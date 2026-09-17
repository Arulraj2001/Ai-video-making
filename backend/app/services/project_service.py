import json
import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone
from app.models.project import (
    ProjectModel,
    AudioFileModel,
    CaptionSettingsModel,
    AudioSettingsModel,
    CanvasSettingsModel,
)
from app.models.scene import SceneModel
from app.models.video_bible import (
    VideoBibleModel,
    OverallStyleModel,
    CharacterModel,
    LocationModel,
    ObjectModel,
    ReferenceImageModel
)
from app.schemas.project import ProjectCreate, SceneUpdate, ProjectSettingsUpdate
from app.schemas.video_bible import (
    OverallStyleUpdate,
    CharacterCreate,
    CharacterUpdate,
    LocationCreate,
    LocationUpdate,
    ObjectCreate,
    ObjectUpdate
)
from app.services.repository.project_repository import (
    DualReadProjectRepository,
    ProjectRepository,
)
from app.services.storage.asset_storage import (
    AssetStorage,
    default_asset_storage,
)

import re

STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "storage"))
PROJECTS_DIR = STORAGE_DIR / "projects"

import threading

_project_locks: dict[str, threading.Lock] = {}
_locks_mutex = threading.Lock()

def get_project_lock(project_id: str) -> threading.Lock:
    with _locks_mutex:
        if project_id not in _project_locks:
            _project_locks[project_id] = threading.Lock()
        return _project_locks[project_id]

ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".aac", ".ogg"}
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

MAX_AUDIO_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20 MB

PROJECT_ID_REGEX = re.compile(r'^[a-zA-Z0-9_-]+$')

def sanitize_filename(filename: str) -> str:
    """Sanitizes filename and strips any directory path traversal characters."""
    base = Path(filename).name
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', base)
    return clean or "file"

def validate_project_id(project_id: str) -> str:
    """Validates that project_id contains only alphanumeric, dash, or underscore characters and does not attempt directory traversal."""
    if not project_id or not isinstance(project_id, str):
        raise ValueError("Project ID cannot be empty")
    clean_id = project_id.strip()
    if not PROJECT_ID_REGEX.match(clean_id):
        raise ValueError(f"Invalid project ID '{project_id}': contains disallowed characters")
    return clean_id

class ProjectService:
    def __init__(self, repository: Optional[ProjectRepository] = None, asset_storage: Optional[AssetStorage] = None):
        self.repository = repository or DualReadProjectRepository()
        self.asset_storage = asset_storage or default_asset_storage
        self._projects: dict[str, ProjectModel] = (
            self.repository.fs_repo._memory_cache
            if hasattr(self.repository, "fs_repo")
            else {}
        )
        PROJECTS_DIR.mkdir(parents=True, exist_ok=True)

    def _get_project_dir(self, project_id: str) -> Path:
        valid_id = validate_project_id(project_id)
        pdir = (PROJECTS_DIR / valid_id).resolve()
        try:
            pdir.relative_to(PROJECTS_DIR.resolve())
        except ValueError:
            raise ValueError(f"Directory traversal detected for project ID '{project_id}'")
        pdir.mkdir(parents=True, exist_ok=True)
        return pdir

    def _get_project_file(self, project_id: str) -> Path:
        return self._get_project_dir(project_id) / "project.json"

    def save_scene_image_asset(
        self,
        project_id: str,
        scene_id: str,
        image_bytes: bytes,
        filename: str,
        owner_id: Optional[str] = None
    ) -> tuple[str, str]:
        """Saves raw image bytes for a scene to storage and returns (relative_path, public_url)."""
        return self.asset_storage.save_asset(
            project_id=project_id,
            asset_category="images",
            filename=filename,
            content=image_bytes,
            content_type="image/png",
            owner_id=owner_id,
        )

    def resolve_media_url(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        owner_id: Optional[str] = None,
    ) -> Optional[str]:
        """
        Returns a durable, browser-consumable URL for an asset, refreshing
        stale Firebase signed URLs so project media keeps working after Render
        recycles its local disk. Returns None when the asset cannot be resolved
        so callers can fall back to their stored URL.
        """
        try:
            return self.asset_storage.get_media_url(project_id, asset_category, filename, owner_id)
        except Exception:
            return None

    def upload_asset_to_cloud(
        self,
        project_id: str,
        asset_category: str,
        filename: str,
        content: bytes,
        content_type: str,
        owner_id: Optional[str] = None,
    ) -> Optional[str]:
        """Best-effort durable upload of an already-persisted local asset."""
        try:
            return self.asset_storage.upload_to_cloud(
                project_id, asset_category, filename, content, content_type, owner_id
            )
        except Exception:
            return None

    def _serialize_ref_image(self, ref: Optional[ReferenceImageModel]) -> Optional[dict]:
        if not ref:
            return None
        return {
            "filename": ref.filename,
            "storage_path": ref.storage_path,
            "url": ref.url,
            "file_size": ref.file_size
        }

    def _deserialize_ref_image(self, data: Optional[dict]) -> Optional[ReferenceImageModel]:
        if not data:
            return None
        return ReferenceImageModel(
            filename=data["filename"],
            storage_path=data["storage_path"],
            url=data["url"],
            file_size=data.get("file_size", 0)
        )

    def _save_to_disk(self, project: ProjectModel) -> None:
        self.repository.save_project(project, getattr(project, "owner_id", None))
        return

    def _deserialize_project(self, data: dict, project_id: Optional[str] = None) -> ProjectModel:
        import uuid
        audio = None
        if data.get("audio_file"):
            audio = AudioFileModel(**data["audio_file"])
        scenes = []
        for s in data.get("scenes", []):
            scenes.append(
                SceneModel(
                    id=s["id"],
                    start=s["start"],
                    end=s["end"],
                    duration=s["duration"],
                    caption=s["caption"],
                    visual_description=s.get("visual_description"),
                    image_prompt=s.get("image_prompt"),
                    suggested_motion=s.get("suggested_motion"),
                    suggested_transition=s.get("suggested_transition"),
                    image_status=s.get("image_status", "pending"),
                    image_url=s.get("image_url"),
                    image_path=s.get("image_path"),
                    image_error=s.get("image_error"),
                    image_metadata=s.get("image_metadata"),
                    motion=s.get("motion", "none"),
                    transition=s.get("transition", "none"),
                    transition_duration=s.get("transition_duration", 0.5),
                    image_fit=s.get("image_fit", "cover"),
                    image_position=s.get("image_position", "center"),
                    image_zoom=s.get("image_zoom", 1.0),
                    image_crop=s.get("image_crop"),
                    brightness=s.get("brightness", 0.0),
                    contrast=s.get("contrast", 1.0),
                    saturation=s.get("saturation", 1.0),
                    color_filter=s.get("color_filter", "none"),
                )
            )

        vb_data = data.get("video_bible", {})
        style_data = vb_data.get("overall_style", {})
        overall_style = OverallStyleModel(
            visual_style=style_data.get("visual_style", "Cinematic film"),
            realism_level=style_data.get("realism_level", "Photorealistic"),
            color_treatment=style_data.get("color_treatment", "Rich contrast, cinematic film-grade color palette with natural skin tones"),
            lighting=style_data.get("lighting", "Atmospheric natural lighting with subtle directional rim lights"),
            camera_style=style_data.get("camera_style", "Eye-level medium shots, smooth cinematic motion"),
            lens_cinematography=style_data.get("lens_cinematography", "35mm prime lens, shallow depth of field, f/2.0"),
            mood=style_data.get("mood", "Dramatic, engaging, immersive")
        )

        characters = [
            CharacterModel(
                id=c["id"],
                name=c["name"],
                description=c.get("description", ""),
                appearance=c.get("appearance", ""),
                clothing=c.get("clothing", ""),
                age_range=c.get("age_range", ""),
                personality=c.get("personality", ""),
                reference_image=self._deserialize_ref_image(c.get("reference_image"))
            )
            for c in vb_data.get("characters", [])
        ]

        locations = [
            LocationModel(
                id=loc["id"],
                name=loc["name"],
                description=loc.get("description", ""),
                environment=loc.get("environment", ""),
                lighting=loc.get("lighting", ""),
                reference_image=self._deserialize_ref_image(loc.get("reference_image"))
            )
            for loc in vb_data.get("locations", [])
        ]

        objects = [
            ObjectModel(
                id=obj["id"],
                name=obj["name"],
                description=obj.get("description", ""),
                reference_image=self._deserialize_ref_image(obj.get("reference_image"))
            )
            for obj in vb_data.get("objects", [])
        ]

        rules = vb_data.get("rules", ["cinematic", "realistic", "documentary"])

        video_bible = VideoBibleModel(
            overall_style=overall_style,
            characters=characters,
            locations=locations,
            objects=objects,
            rules=rules
        )

        cs_data = data.get("caption_settings") or {}
        caption_settings = CaptionSettingsModel(
            enabled=cs_data.get("enabled", True),
            font_family=cs_data.get("font_family", "Inter"),
            font_size=cs_data.get("font_size", 42),
            position=cs_data.get("position", "bottom"),
            alignment=cs_data.get("alignment", "center"),
            background=cs_data.get("background", "semi-transparent"),
            outline_shadow=cs_data.get("outline_shadow", "subtle"),
            safe_area=cs_data.get("safe_area", True),
            color=cs_data.get("color", "#FFFFFF"),
        )

        as_data = data.get("audio_settings") or {}
        bgm_file = None
        if as_data.get("music_file"):
            bgm_file = AudioFileModel(**as_data["music_file"])
        audio_settings = AudioSettingsModel(
            narration_volume=as_data.get("narration_volume", 1.0),
            narration_muted=as_data.get("narration_muted", False),
            music_file=bgm_file,
            music_volume=as_data.get("music_volume", 0.25),
            music_fade_in=as_data.get("music_fade_in", 1.0),
            music_fade_out=as_data.get("music_fade_out", 2.0),
            music_muted=as_data.get("music_muted", False),
            ducking_enabled=as_data.get("ducking_enabled", True),
        )

        cv_data = data.get("canvas_settings") or {}
        canvas_settings = CanvasSettingsModel(
            aspect_ratio=cv_data.get("aspect_ratio", "9:16"),
            resolution=cv_data.get("resolution", "1080x1920"),
            fps=cv_data.get("fps", 30),
        )

        return ProjectModel(
            id=project_id or data.get("id") or f"proj_{uuid.uuid4().hex[:8]}",
            name=data.get("name", "Untitled Project"),
            description=data.get("description", ""),
            owner_id=data.get("owner_id"),
            audio_file=audio,
            raw_captions=data.get("raw_captions", ""),
            scenes=scenes,
            video_bible=video_bible,
            caption_settings=caption_settings,
            audio_settings=audio_settings,
            canvas_settings=canvas_settings,
            created_at=data.get("created_at") or datetime.now(timezone.utc).isoformat(),
            updated_at=data.get("updated_at") or datetime.now(timezone.utc).isoformat(),
        )

    def _load_from_disk(self) -> None:
        if not PROJECTS_DIR.exists():
            return
        for pdir in PROJECTS_DIR.iterdir():
            if pdir.is_dir():
                pfile = pdir / "project.json"
                bak_file = pdir / "project.json.bak"
                data = None
                if pfile.exists():
                    try:
                        with open(pfile, "r", encoding="utf-8") as f:
                            data = json.load(f)
                    except Exception:
                        # Attempt recovery from backup if main file is corrupted
                        if bak_file.exists():
                            try:
                                with open(bak_file, "r", encoding="utf-8") as bf:
                                    data = json.load(bf)
                            except Exception:
                                pass
                elif bak_file.exists():
                    try:
                        with open(bak_file, "r", encoding="utf-8") as bf:
                            data = json.load(bf)
                    except Exception:
                        pass

                if data:
                    try:
                        proj = self._deserialize_project(data)
                        self._projects[proj.id] = proj
                    except Exception:
                        continue

    def list_projects(self, owner_id: Optional[str] = None) -> List[ProjectModel]:
        return self.repository.list_projects(owner_id)

    def get_project(self, project_id: str, owner_id: Optional[str] = None) -> Optional[ProjectModel]:
        return self.repository.get_project(project_id, owner_id)

    def create_project(self, data: ProjectCreate, owner_id: Optional[str] = None) -> ProjectModel:
        project = ProjectModel(
            name=data.name.strip(),
            description=data.description.strip() if data.description else "",
            raw_captions=data.raw_captions or "",
            video_bible=VideoBibleModel(),
            owner_id=owner_id
        )
        return self.repository.save_project(project, owner_id)

    def delete_project(self, project_id: str, owner_id: Optional[str] = None) -> bool:
        return self.repository.delete_project(project_id, owner_id)

    def save_audio(
        self,
        project_id: str,
        filename: str,
        content: bytes,
        content_type: str,
        owner_id: Optional[str] = None
    ) -> AudioFileModel:
        project = self.get_project(project_id, owner_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        if len(content) > MAX_AUDIO_SIZE:
            raise ValueError(f"Audio file size ({len(content) / (1024*1024):.1f}MB) exceeds maximum limit of 50MB")

        safe_filename = sanitize_filename(filename)
        ext = Path(safe_filename).suffix.lower()
        if ext not in ALLOWED_AUDIO_EXTENSIONS:
            allowed = ", ".join(sorted(ALLOWED_AUDIO_EXTENSIONS))
            raise ValueError(f"Unsupported audio format '{ext}'. Allowed: {allowed}")

        # Persist narration audio through the asset storage adapter (uploads to
        # Firebase Storage when available while keeping a local copy for the
        # render pipeline). `owner_id` is required for the durable cloud copy.
        relative_path, _ = self.asset_storage.save_asset(
            project_id=project_id,
            asset_category="audio",
            filename=safe_filename,
            content=content,
            content_type=content_type or "audio/mpeg",
            owner_id=owner_id,
        )
        audio_model = AudioFileModel(
            filename=safe_filename,
            storage_path=relative_path,
            file_size=len(content),
            content_type=content_type or "audio/mpeg"
        )
        project.audio_file = audio_model
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return audio_model

    def set_captions_and_scenes(
        self,
        project_id: str,
        raw_captions: str,
        scenes: List[SceneModel]
    ) -> ProjectModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        project.raw_captions = raw_captions
        project.scenes = scenes
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project

    def update_scene(
        self,
        project_id: str,
        scene_id: str,
        update: SceneUpdate
    ) -> SceneModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        target = next((s for s in project.scenes if s.id == scene_id), None)
        if not target:
            raise ValueError(f"Scene '{scene_id}' not found in project")

        new_start = update.start if update.start is not None else target.start
        new_end = update.end if update.end is not None else target.end
        new_caption = update.caption if update.caption is not None else target.caption

        if new_end <= new_start:
            raise ValueError(f"End time ({new_end}s) must be greater than start time ({new_start}s)")

        target.start = round(new_start, 3)
        target.end = round(new_end, 3)
        target.duration = round(target.end - target.start, 3)
        target.caption = new_caption.strip()

        if update.visual_description is not None:
            target.visual_description = update.visual_description.strip()
        if update.image_prompt is not None:
            target.image_prompt = update.image_prompt.strip()
        if update.suggested_motion is not None:
            target.suggested_motion = update.suggested_motion.strip()
        if update.suggested_transition is not None:
            target.suggested_transition = update.suggested_transition.strip()
        if update.image_status is not None:
            target.image_status = update.image_status
        if update.image_url is not None:
            target.image_url = update.image_url
        if update.image_error is not None:
            target.image_error = update.image_error
        if update.image_metadata is not None:
            target.image_metadata = update.image_metadata
        if update.motion is not None:
            target.motion = update.motion
        if update.transition is not None:
            target.transition = update.transition
        if update.transition_duration is not None:
            target.transition_duration = max(0.1, round(update.transition_duration, 2))
        if update.image_fit is not None:
            target.image_fit = update.image_fit
        if update.image_position is not None:
            target.image_position = update.image_position
        if update.image_zoom is not None:
            target.image_zoom = max(1.0, min(3.0, round(update.image_zoom, 2)))
        if update.image_crop is not None:
            target.image_crop = update.image_crop
        if update.brightness is not None:
            target.brightness = round(update.brightness, 2)
        if update.contrast is not None:
            target.contrast = round(update.contrast, 2)
        if update.saturation is not None:
            target.saturation = round(update.saturation, 2)
        if update.color_filter is not None:
            target.color_filter = update.color_filter
        if update.template_type is not None:
            target.template_type = update.template_type
        if update.background is not None:
            target.background = update.background
        if update.elements is not None:
            target.elements = update.elements

        project.scenes.sort(key=lambda s: s.start)
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return target

    def update_scene_image_state(
        self,
        project_id: str,
        scene_id: str,
        status: str,
        url: Optional[str] = None,
        path: Optional[str] = None,
        error: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> SceneModel:
        with get_project_lock(project_id):
            project = self.get_project(project_id)
            if not project:
                raise ValueError(f"Project '{project_id}' not found")
            target = next((s for s in project.scenes if s.id == scene_id), None)
            if not target:
                raise ValueError(f"Scene '{scene_id}' not found in project")

            # Stale state protection:
            # Never allow an older slow generation request to overwrite a newer successful state
            if status == "completed" and target.image_status == "completed" and metadata:
                req_started = metadata.get("gen_started_at")
                current_completed = (target.image_metadata or {}).get("gen_completed_at")
                if req_started and current_completed and req_started < current_completed:
                    # Newer image already completed; keep newer image state
                    return target

            if status == "failed" and target.image_status == "completed":
                # Never erase an already completed image on failure
                target.image_error = error
                project.updated_at = datetime.now(timezone.utc).isoformat()
                self._save_to_disk(project)
                return target

            target.image_status = status
            if url is not None:
                target.image_url = url
            if path is not None:
                target.image_path = path
            target.image_error = error
            if metadata is not None:
                target.image_metadata = metadata

            project.updated_at = datetime.now(timezone.utc).isoformat()
            self._save_to_disk(project)
            return target

    # --- Phase 3: Video Bible Methods ---

    def update_overall_style(self, project_id: str, update: OverallStyleUpdate) -> OverallStyleModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        style = project.video_bible.overall_style
        if update.visual_style is not None:
            style.visual_style = update.visual_style.strip()
        if update.realism_level is not None:
            style.realism_level = update.realism_level.strip()
        if update.color_treatment is not None:
            style.color_treatment = update.color_treatment.strip()
        if update.lighting is not None:
            style.lighting = update.lighting.strip()
        if update.camera_style is not None:
            style.camera_style = update.camera_style.strip()
        if update.lens_cinematography is not None:
            style.lens_cinematography = update.lens_cinematography.strip()
        if update.mood is not None:
            style.mood = update.mood.strip()

        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return style

    def update_rules(self, project_id: str, rules: List[str]) -> List[str]:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        project.video_bible.rules = [r.strip() for r in rules if r.strip()]
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project.video_bible.rules

    # Characters
    def add_character(self, project_id: str, data: CharacterCreate) -> CharacterModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        char_num = len(project.video_bible.characters) + 1
        char_id = f"char-{char_num:03d}"

        character = CharacterModel(
            id=char_id,
            name=data.name.strip(),
            description=data.description.strip() if data.description else "",
            appearance=data.appearance.strip() if data.appearance else "",
            clothing=data.clothing.strip() if data.clothing else "",
            age_range=data.age_range.strip() if data.age_range else "",
            personality=data.personality.strip() if data.personality else ""
        )
        project.video_bible.characters.append(character)
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return character

    def update_character(self, project_id: str, char_id: str, update: CharacterUpdate) -> CharacterModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        char = next((c for c in project.video_bible.characters if c.id == char_id), None)
        if not char:
            raise ValueError(f"Character '{char_id}' not found")

        if update.name is not None:
            char.name = update.name.strip()
        if update.description is not None:
            char.description = update.description.strip()
        if update.appearance is not None:
            char.appearance = update.appearance.strip()
        if update.clothing is not None:
            char.clothing = update.clothing.strip()
        if update.age_range is not None:
            char.age_range = update.age_range.strip()
        if update.personality is not None:
            char.personality = update.personality.strip()

        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return char

    def delete_character(self, project_id: str, char_id: str) -> bool:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        initial_len = len(project.video_bible.characters)
        project.video_bible.characters = [c for c in project.video_bible.characters if c.id != char_id]
        if len(project.video_bible.characters) < initial_len:
            project.updated_at = datetime.now(timezone.utc).isoformat()
            self._save_to_disk(project)
            return True
        return False

    # Locations
    def add_location(self, project_id: str, data: LocationCreate) -> LocationModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        loc_num = len(project.video_bible.locations) + 1
        loc_id = f"loc-{loc_num:03d}"

        location = LocationModel(
            id=loc_id,
            name=data.name.strip(),
            description=data.description.strip() if data.description else "",
            environment=data.environment.strip() if data.environment else "",
            lighting=data.lighting.strip() if data.lighting else ""
        )
        project.video_bible.locations.append(location)
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return location

    def update_location(self, project_id: str, loc_id: str, update: LocationUpdate) -> LocationModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        loc = next((l for l in project.video_bible.locations if l.id == loc_id), None)
        if not loc:
            raise ValueError(f"Location '{loc_id}' not found")

        if update.name is not None:
            loc.name = update.name.strip()
        if update.description is not None:
            loc.description = update.description.strip()
        if update.environment is not None:
            loc.environment = update.environment.strip()
        if update.lighting is not None:
            loc.lighting = update.lighting.strip()

        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return loc

    def delete_location(self, project_id: str, loc_id: str) -> bool:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        initial_len = len(project.video_bible.locations)
        project.video_bible.locations = [l for l in project.video_bible.locations if l.id != loc_id]
        if len(project.video_bible.locations) < initial_len:
            project.updated_at = datetime.now(timezone.utc).isoformat()
            self._save_to_disk(project)
            return True
        return False

    # Objects
    def add_object(self, project_id: str, data: ObjectCreate) -> ObjectModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        obj_num = len(project.video_bible.objects) + 1
        obj_id = f"obj-{obj_num:03d}"

        obj = ObjectModel(
            id=obj_id,
            name=data.name.strip(),
            description=data.description.strip() if data.description else ""
        )
        project.video_bible.objects.append(obj)
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return obj

    def update_object(self, project_id: str, obj_id: str, update: ObjectUpdate) -> ObjectModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        obj = next((o for o in project.video_bible.objects if o.id == obj_id), None)
        if not obj:
            raise ValueError(f"Object '{obj_id}' not found")

        if update.name is not None:
            obj.name = update.name.strip()
        if update.description is not None:
            obj.description = update.description.strip()

        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return obj

    def delete_object(self, project_id: str, obj_id: str) -> bool:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        initial_len = len(project.video_bible.objects)
        project.video_bible.objects = [o for o in project.video_bible.objects if o.id != obj_id]
        if len(project.video_bible.objects) < initial_len:
            project.updated_at = datetime.now(timezone.utc).isoformat()
            self._save_to_disk(project)
            return True
        return False

    # Reference Image Storage
    def save_reference_image(
        self,
        project_id: str,
        entity_type: str,
        entity_id: str,
        filename: str,
        content: bytes
    ) -> ReferenceImageModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        if len(content) > MAX_IMAGE_SIZE:
            raise ValueError(f"Image file size ({len(content) / (1024*1024):.1f}MB) exceeds maximum limit of 20MB")

        safe_filename = sanitize_filename(filename)
        ext = Path(safe_filename).suffix.lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            allowed = ", ".join(sorted(ALLOWED_IMAGE_EXTENSIONS))
            raise ValueError(f"Unsupported image format '{ext}'. Allowed: {allowed}")

        safe_name = f"{entity_type}_{entity_id}{ext}"

        # Persist the reference image through the asset storage adapter so it is
        # uploaded to Firebase Storage when possible (durable) while keeping a
        # local copy for prompt/context use.
        rel_path, url_path = self.asset_storage.save_asset(
            project_id=project_id,
            asset_category="references",
            filename=safe_name,
            content=content,
            content_type="image/png" if ext == ".png" else "image/jpeg",
            owner_id=project.owner_id,
        )

        # When the file was uploaded to Firebase, store the immutable cloud path
        # so reference URLs can be refreshed into fresh signed URLs on read.
        storage_path = rel_path
        if url_path and str(url_path).startswith("http") and project.owner_id:
            storage_path = f"users/{project.owner_id}/projects/{project_id}/references/{safe_name}"

        ref_model = ReferenceImageModel(
            filename=safe_filename,
            storage_path=storage_path,
            url=url_path,
            file_size=len(content)
        )

        # Attach to character, location, or object
        if entity_type == "character":
            char = next((c for c in project.video_bible.characters if c.id == entity_id), None)
            if not char:
                raise ValueError(f"Character '{entity_id}' not found")
            char.reference_image = ref_model
        elif entity_type == "location":
            loc = next((l for l in project.video_bible.locations if l.id == entity_id), None)
            if not loc:
                raise ValueError(f"Location '{entity_id}' not found")
            loc.reference_image = ref_model
        elif entity_type == "object":
            obj = next((o for o in project.video_bible.objects if o.id == entity_id), None)
            if not obj:
                raise ValueError(f"Object '{entity_id}' not found")
            obj.reference_image = ref_model
        else:
            raise ValueError(f"Unknown entity type '{entity_type}'")

        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return ref_model

    def update_scene_timeline(
        self,
        project_id: str,
        scene_id: str,
        update: SceneUpdate,
        ripple: bool = True
    ) -> ProjectModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        idx = next((i for i, s in enumerate(project.scenes) if s.id == scene_id), None)
        if idx is None:
            raise ValueError(f"Scene '{scene_id}' not found")

        target = project.scenes[idx]
        old_end = target.end

        if update.caption is not None:
            target.caption = update.caption.strip()
        if update.visual_description is not None:
            target.visual_description = update.visual_description.strip()
        if update.image_prompt is not None:
            target.image_prompt = update.image_prompt.strip()
        if update.suggested_motion is not None:
            target.suggested_motion = update.suggested_motion.strip()
        if update.suggested_transition is not None:
            target.suggested_transition = update.suggested_transition.strip()
        if update.motion is not None:
            target.motion = update.motion
        if update.transition is not None:
            target.transition = update.transition
        if update.transition_duration is not None:
            target.transition_duration = max(0.1, round(update.transition_duration, 2))
        if update.image_fit is not None:
            target.image_fit = update.image_fit
        if update.image_position is not None:
            target.image_position = update.image_position
        if update.image_zoom is not None:
            target.image_zoom = max(1.0, min(3.0, round(update.image_zoom, 2)))
        if update.image_crop is not None:
            target.image_crop = update.image_crop
        if update.brightness is not None:
            target.brightness = max(-0.5, min(0.5, round(update.brightness, 2)))
        if update.contrast is not None:
            target.contrast = max(0.5, min(2.0, round(update.contrast, 2)))
        if update.saturation is not None:
            target.saturation = max(0.0, min(2.5, round(update.saturation, 2)))
        if update.color_filter is not None:
            target.color_filter = update.color_filter
        if update.template_type is not None:
            target.template_type = update.template_type
            if update.template_type != "standard":
                target.image_url = None
                target.image_path = None
                target.image_status = "completed"
        if update.background is not None:
            target.background = update.background
        if update.elements is not None:
            target.elements = update.elements
        if update.image_url is not None:
            target.image_url = update.image_url
        if update.image_status is not None:
            target.image_status = update.image_status

        new_start = update.start if update.start is not None else target.start
        new_end = update.end if update.end is not None else target.end

        if new_end <= new_start:
            raise ValueError(f"End time ({new_end}s) must be greater than start time ({new_start}s)")

        target.start = round(new_start, 3)
        target.end = round(new_end, 3)
        target.duration = round(target.end - target.start, 3)

        if ripple and target.end != old_end:
            delta = round(target.end - old_end, 3)
            for s in project.scenes[idx + 1:]:
                s.start = round(s.start + delta, 3)
                s.end = round(s.end + delta, 3)

        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project

    def split_scene(self, project_id: str, scene_id: str, split_time: float) -> ProjectModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        target_idx = next((i for i, s in enumerate(project.scenes) if s.id == scene_id), None)
        if target_idx is None:
            raise ValueError(f"Scene '{scene_id}' not found")

        target = project.scenes[target_idx]
        split_time = round(split_time, 3)
        if split_time <= target.start or split_time >= target.end:
            raise ValueError(
                f"Split time ({split_time}s) must be strictly between scene start ({target.start}s) and end ({target.end}s)"
            )

        original_end = target.end
        target.end = split_time
        target.duration = round(target.end - target.start, 3)

        existing_ids = {s.id for s in project.scenes}
        new_id = f"{target.id}-b"
        counter = 2
        while new_id in existing_ids:
            counter += 1
            new_id = f"{target.id}-part{counter}"

        new_scene = SceneModel(
            id=new_id,
            start=split_time,
            end=original_end,
            duration=round(original_end - split_time, 3),
            caption=f"{target.caption} (cont.)",
            visual_description=target.visual_description,
            image_prompt=target.image_prompt,
            suggested_motion=target.suggested_motion,
            suggested_transition=target.suggested_transition,
            image_status=target.image_status,
            image_url=target.image_url,
            image_path=target.image_path,
            image_error=target.image_error,
            image_metadata=target.image_metadata,
            motion=target.motion,
            transition=target.transition,
            transition_duration=target.transition_duration,
            image_fit=target.image_fit,
            image_position=target.image_position,
            image_zoom=target.image_zoom,
            image_crop=target.image_crop,
            brightness=getattr(target, "brightness", 0.0),
            contrast=getattr(target, "contrast", 1.0),
            saturation=getattr(target, "saturation", 1.0),
            color_filter=getattr(target, "color_filter", "none")
        )

        project.scenes.insert(target_idx + 1, new_scene)
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project

    def duplicate_scene(self, project_id: str, scene_id: str) -> ProjectModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        target_idx = next((i for i, s in enumerate(project.scenes) if s.id == scene_id), None)
        if target_idx is None:
            raise ValueError(f"Scene '{scene_id}' not found")

        target = project.scenes[target_idx]
        shift_amount = target.duration

        new_start = target.end
        new_end = round(new_start + shift_amount, 3)

        # Ripple: shift downstream scenes
        for s in project.scenes[target_idx + 1:]:
            s.start = round(s.start + shift_amount, 3)
            s.end = round(s.end + shift_amount, 3)

        existing_ids = {s.id for s in project.scenes}
        new_id = f"{target.id}-copy"
        counter = 1
        while new_id in existing_ids:
            counter += 1
            new_id = f"{target.id}-copy{counter}"

        new_scene = SceneModel(
            id=new_id,
            start=new_start,
            end=new_end,
            duration=shift_amount,
            caption=f"{target.caption} (Copy)",
            visual_description=target.visual_description,
            image_prompt=target.image_prompt,
            suggested_motion=target.suggested_motion,
            suggested_transition=target.suggested_transition,
            image_status=target.image_status,
            image_url=target.image_url,
            image_path=target.image_path,
            image_error=target.image_error,
            image_metadata=target.image_metadata,
            motion=target.motion,
            transition=target.transition,
            transition_duration=target.transition_duration,
            image_fit=target.image_fit,
            image_position=target.image_position,
            image_zoom=target.image_zoom,
            image_crop=target.image_crop,
            brightness=getattr(target, "brightness", 0.0),
            contrast=getattr(target, "contrast", 1.0),
            saturation=getattr(target, "saturation", 1.0),
            color_filter=getattr(target, "color_filter", "none"),
            template_type=getattr(target, "template_type", "standard"),
            background=getattr(target, "background", None),
            elements=json.loads(json.dumps(getattr(target, "elements", None) or [])) if getattr(target, "elements", None) else None,
        )

        project.scenes.insert(target_idx + 1, new_scene)
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project

    def add_slide(
        self,
        project_id: str,
        caption: str = "New Slide",
        duration: float = 4.0,
        template_type: str = "blank_slide",
        background: Optional[dict] = None,
        elements: Optional[list] = None,
    ) -> ProjectModel:
        """Appends a new slide template scene to the project timeline."""
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        last_end = max((s.end for s in project.scenes), default=0.0)
        new_start = round(last_end, 3)
        new_end = round(new_start + duration, 3)

        existing_ids = {s.id for s in project.scenes}
        seq = len(project.scenes) + 1
        new_id = f"scene_{seq:03d}"
        while new_id in existing_ids:
            seq += 1
            new_id = f"scene_{seq:03d}"

        new_scene = SceneModel(
            id=new_id,
            start=new_start,
            end=new_end,
            duration=round(duration, 3),
            caption=caption.strip(),
            template_type=template_type,
            background=background,
            elements=elements or [],
            image_status="completed",
        )
        project.scenes.append(new_scene)
        project.scenes.sort(key=lambda s: s.start)
        project.updated_at = datetime.now(timezone.utc).isoformat()
    def add_scene(
        self,
        project_id: str,
        caption: str = "New scene narration...",
        duration: float = 5.0,
        owner_id: Optional[str] = None,
    ) -> ProjectModel:
        """Appends a new narration scene to the project Master Timeline."""
        project = self.get_project(project_id, owner_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        last_end = max((s.end for s in project.scenes), default=0.0)
        new_start = round(last_end, 3)
        new_end = round(new_start + max(duration, 1.0), 3)

        existing_ids = {s.id for s in project.scenes}
        seq = len(project.scenes) + 1
        new_id = f"SC_{seq:03d}"
        while new_id in existing_ids:
            seq += 1
            new_id = f"SC_{seq:03d}"

        new_scene = SceneModel(
            id=new_id,
            start=new_start,
            end=new_end,
            duration=round(new_end - new_start, 3),
            caption=caption.strip(),
            visual_description="",
            image_prompt="",
            suggested_motion="slow zoom in",
            suggested_transition="fade",
            image_status="pending",
        )
        project.scenes.append(new_scene)
        project.scenes.sort(key=lambda s: s.start)
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project

    def add_slide(
        self,
        project_id: str,
        caption: str = "New Slide",
        duration: float = 4.0,
        template_type: str = "blank_slide",
        background: Optional[dict] = None,
        elements: Optional[list] = None,
        owner_id: Optional[str] = None,
    ) -> ProjectModel:
        """Appends a new presentation slide scene to the project timeline."""
        project = self.get_project(project_id, owner_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        last_end = max((s.end for s in project.scenes), default=0.0)
        new_start = round(last_end, 3)
        new_end = round(new_start + max(duration, 0.5), 3)

        existing_ids = {s.id for s in project.scenes}
        seq = len(project.scenes) + 1
        new_id = f"SC_{seq:03d}"
        while new_id in existing_ids:
            seq += 1
            new_id = f"SC_{seq:03d}"

        new_scene = SceneModel(
            id=new_id,
            start=new_start,
            end=new_end,
            duration=round(new_end - new_start, 3),
            caption=caption.strip(),
            visual_description="",
            image_prompt="",
            suggested_motion="none",
            suggested_transition="fade",
            image_status="pending",
            template_type=template_type,
            background=background,
            elements=elements or [],
        )
        project.scenes.append(new_scene)
        project.scenes.sort(key=lambda s: s.start)
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project

    def auto_align_scenes(
        self,
        project_id: str,
        owner_id: Optional[str] = None,
    ) -> ProjectModel:
        """Resolves all timeline gaps and overlaps, ensuring strict contiguous alignment."""
        project = self.get_project(project_id, owner_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        if not project.scenes:
            return project

        # Sort scenes by start time
        project.scenes.sort(key=lambda s: s.start)

        current_time = 0.0
        for sc in project.scenes:
            dur = sc.duration if sc.duration and sc.duration > 0.5 else max(sc.end - sc.start, 1.0)
            sc.start = round(current_time, 3)
            sc.end = round(current_time + dur, 3)
            sc.duration = round(sc.end - sc.start, 3)
            current_time = sc.end

        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project

    def delete_scene(self, project_id: str, scene_id: str, ripple: bool = True) -> ProjectModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        if len(project.scenes) <= 1:
            raise ValueError("Cannot delete the only remaining scene in the project")

        target_idx = next((i for i, s in enumerate(project.scenes) if s.id == scene_id), None)
        if target_idx is None:
            raise ValueError(f"Scene '{scene_id}' not found")

        target = project.scenes[target_idx]
        deleted_duration = target.duration

        project.scenes.pop(target_idx)

        if ripple:
            for s in project.scenes[target_idx:]:
                s.start = max(0.0, round(s.start - deleted_duration, 3))
                s.end = round(s.start + s.duration, 3)

        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project

    def reorder_scenes(self, project_id: str, scene_ids: List[str]) -> ProjectModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        scene_map = {s.id: s for s in project.scenes}
        if set(scene_ids) != set(scene_map.keys()) or len(scene_ids) != len(project.scenes):
            raise ValueError("Reorder list must contain all existing scene IDs exactly once")

        reordered = [scene_map[sid] for sid in scene_ids]

        # Recalculate timestamps sequentially preserving each scene's duration
        current_time = 0.0
        for s in reordered:
            s.start = round(current_time, 3)
            s.end = round(current_time + s.duration, 3)
            current_time = s.end

        project.scenes = reordered
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project

    def upload_replacement_image(
        self,
        project_id: str,
        scene_id: str,
        file_bytes: bytes,
        filename: str
    ) -> SceneModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        target = next((s for s in project.scenes if s.id == scene_id), None)
        if not target:
            raise ValueError(f"Scene '{scene_id}' not found")

        if len(file_bytes) > MAX_IMAGE_SIZE:
            raise ValueError(f"Image file size ({len(file_bytes) / (1024*1024):.1f}MB) exceeds maximum limit of 20MB")

        safe_filename = sanitize_filename(filename)
        ext = Path(safe_filename).suffix.lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise ValueError(f"Invalid image format '{ext}'. Allowed: {ALLOWED_IMAGE_EXTENSIONS}")

        timestamp = int(datetime.now().timestamp() * 1000)
        saved_filename = f"replacement_{scene_id}_{timestamp}{ext}"

        # Persist through the asset storage adapter: durable Firebase copy (when
        # available) while keeping a local file for offline rendering.
        relative_path, public_url = self.asset_storage.save_asset(
            project_id=project_id,
            asset_category="images",
            filename=saved_filename,
            content=file_bytes,
            content_type="image/png" if ext == ".png" else "image/jpeg",
            owner_id=project.owner_id,
        )

        target.image_url = public_url
        target.image_path = relative_path
        target.image_status = "completed"
        target.image_error = None
        target.image_metadata = {
            "source": "user_upload",
            "filename": saved_filename,
            "original_name": filename,
            "file_size": len(file_bytes),
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }

        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return target

    replace_scene_image = upload_replacement_image

    def update_project_settings(
        self,
        project_id: str,
        update: ProjectSettingsUpdate
    ) -> ProjectModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        if update.caption_settings is not None:
            cs = update.caption_settings
            project.caption_settings.enabled = cs.enabled
            project.caption_settings.font_family = cs.font_family
            project.caption_settings.font_size = cs.font_size
            project.caption_settings.position = cs.position
            project.caption_settings.alignment = cs.alignment
            project.caption_settings.background = cs.background
            project.caption_settings.outline_shadow = cs.outline_shadow
            project.caption_settings.safe_area = cs.safe_area
            project.caption_settings.color = cs.color

        if update.audio_settings is not None:
            as_ = update.audio_settings
            project.audio_settings.narration_volume = as_.narration_volume
            project.audio_settings.narration_muted = as_.narration_muted
            project.audio_settings.music_volume = as_.music_volume
            project.audio_settings.music_fade_in = as_.music_fade_in
            project.audio_settings.music_fade_out = as_.music_fade_out
            project.audio_settings.music_muted = as_.music_muted
            if hasattr(as_, "ducking_enabled") and as_.ducking_enabled is not None:
                project.audio_settings.ducking_enabled = as_.ducking_enabled

        if update.canvas_settings is not None:
            cv = update.canvas_settings
            project.canvas_settings.aspect_ratio = cv.aspect_ratio
            project.canvas_settings.resolution = cv.resolution
            project.canvas_settings.fps = cv.fps

        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project

    def save_background_music(
        self,
        project_id: str,
        filename: str,
        content: bytes,
        content_type: str,
        owner_id: Optional[str] = None
    ) -> AudioFileModel:
        project = self.get_project(project_id, owner_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        if len(content) > MAX_AUDIO_SIZE:
            raise ValueError(f"Music file size ({len(content) / (1024*1024):.1f}MB) exceeds maximum limit of 50MB")

        clean_name = sanitize_filename(filename)
        ext = Path(clean_name).suffix.lower()
        if ext not in ALLOWED_AUDIO_EXTENSIONS:
            allowed = ", ".join(sorted(ALLOWED_AUDIO_EXTENSIONS))
            raise ValueError(f"Unsupported audio format '{ext}'. Allowed: {allowed}")

        safe_name = f"bgm_{uuid.uuid4().hex[:6]}_{clean_name}"
        audio_dir = self._get_project_dir(project_id) / "audio"
        audio_dir.mkdir(parents=True, exist_ok=True)
        dest_file = audio_dir / safe_name

        with open(dest_file, "wb") as f:
            f.write(content)

        relative_path = f"storage/projects/{project_id}/audio/{safe_name}"
        audio_model = AudioFileModel(
            filename=safe_name,
            storage_path=relative_path,
            file_size=len(content),
            content_type=content_type or "audio/mpeg"
        )
        project.audio_settings.music_file = audio_model
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return audio_model

    def delete_background_music(self, project_id: str) -> ProjectModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        project.audio_settings.music_file = None
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project

    def delete_audio(self, project_id: str) -> ProjectModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        project.audio_file = None
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project

    def export_project_json(self, project_id: str) -> dict:
        """Exports the complete project representation for JSON backup."""
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")
        pfile = self._get_project_file(project.id)
        if not pfile.exists():
            self._save_to_disk(project)
        with open(pfile, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["_export_version"] = "1.0"
        data["_exported_at"] = datetime.now(timezone.utc).isoformat()
        return data

    def import_project_json(self, backup_data: dict, new_name: Optional[str] = None) -> ProjectModel:
        """Restores a project from a JSON backup payload."""
        if not isinstance(backup_data, dict):
            raise ValueError("Invalid backup data: must be a JSON object")

        import uuid
        new_id = f"proj_{uuid.uuid4().hex[:8]}"
        raw_name = new_name or backup_data.get("name") or "Restored Project"
        project_name = f"{raw_name} (Restored)" if not new_name and "name" in backup_data else raw_name

        backup_copy = dict(backup_data)
        backup_copy["name"] = project_name

        project = self._deserialize_project(backup_copy, project_id=new_id)
        project.created_at = datetime.now(timezone.utc).isoformat()
        project.updated_at = datetime.now(timezone.utc).isoformat()

        self._projects[project.id] = project
        self._save_to_disk(project)
        return project

    def cleanup_temp_files(self, project_id: Optional[str] = None) -> dict:
        """
        Cleans up temporary render directories (tmp_*) and orphaned temporary files.
        If project_id is specified, only cleans for that project; otherwise cleans across all projects.
        """
        cleaned_dirs = 0
        cleaned_files = 0
        freed_bytes = 0

        target_dirs = []
        if project_id:
            renders_dir = STORAGE_DIR / "projects" / project_id / "renders"
            if renders_dir.exists():
                target_dirs.append(renders_dir)
        else:
            projects_root = STORAGE_DIR / "projects"
            if projects_root.exists():
                for pdir in projects_root.iterdir():
                    if pdir.is_dir():
                        rdir = pdir / "renders"
                        if rdir.exists():
                            target_dirs.append(rdir)

        for rdir in target_dirs:
            for item in rdir.iterdir():
                if item.is_dir() and item.name.startswith("tmp_"):
                    try:
                        for root, _, files in os.walk(item):
                            for f in files:
                                fp = Path(root) / f
                                freed_bytes += fp.stat().st_size
                                cleaned_files += 1
                        shutil.rmtree(item, ignore_errors=True)
                        cleaned_dirs += 1
                    except Exception:
                        pass

        test_file = STORAGE_DIR / ".healthcheck_write_test"
        if test_file.exists():
            try:
                test_file.unlink()
                cleaned_files += 1
            except Exception:
                pass

        return {
            "cleaned_dirs": cleaned_dirs,
            "cleaned_files": cleaned_files,
            "freed_bytes": freed_bytes,
            "freed_mb": round(freed_bytes / (1024 * 1024), 2)
        }

    def merge_scenes(self, project_id: str, scene_ids: List[str]) -> ProjectModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        if len(scene_ids) < 2:
            raise ValueError("Must provide at least 2 scene IDs to merge")

        scenes_to_merge = [s for s in project.scenes if s.id in scene_ids]
        if len(scenes_to_merge) != len(scene_ids):
            missing = set(scene_ids) - {s.id for s in scenes_to_merge}
            raise ValueError(f"Scene(s) not found: {missing}")

        scenes_to_merge.sort(key=lambda s: s.start)
        first = scenes_to_merge[0]
        last = scenes_to_merge[-1]

        merged_start = first.start
        merged_end = last.end
        merged_duration = round(merged_end - merged_start, 3)
        merged_caption = " ".join(s.caption.strip() for s in scenes_to_merge if s.caption.strip())

        completed = next((s for s in scenes_to_merge if s.image_status == "completed" and s.image_url), None)
        image_url = completed.image_url if completed else first.image_url
        image_path = completed.image_path if completed else first.image_path
        image_status = "completed" if image_url else "pending"

        prompts = [s.image_prompt for s in scenes_to_merge if s.image_prompt]
        image_prompt = prompts[0] if prompts else f"Cinematic visual for: {merged_caption[:180]}"

        merged_scene = SceneModel(
            id=first.id,
            start=merged_start,
            end=merged_end,
            duration=merged_duration,
            caption=merged_caption,
            visual_description=f"Merged visual scene covering: {merged_caption[:100]}...",
            image_prompt=image_prompt,
            suggested_motion=first.suggested_motion or "slow zoom in",
            suggested_transition=first.suggested_transition or "fade",
            image_status=image_status,
            image_url=image_url,
            image_path=image_path,
            motion=first.motion if first.motion != "none" else "slow zoom in",
            transition=first.transition if first.transition != "none" else "fade",
            transition_duration=first.transition_duration,
            image_fit=first.image_fit,
            image_position=first.image_position,
            image_zoom=first.image_zoom,
        )

        new_scenes = []
        remove_set = set(s.id for s in scenes_to_merge[1:])
        for s in project.scenes:
            if s.id == first.id:
                new_scenes.append(merged_scene)
            elif s.id in remove_set:
                continue
            else:
                new_scenes.append(s)

        project.scenes = new_scenes
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project

    async def cluster_scenes(
        self,
        project_id: str,
        mode: str = "fixed_duration",
        target_duration: float = 15.0,
        captions_per_scene: int = 4
    ) -> ProjectModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        from app.services.scene_clustering_service import scene_clustering_service
        if mode == "caption_count":
            new_scenes = scene_clustering_service.cluster_by_caption_count(project.scenes, captions_per_scene)
        elif mode == "smart_llm":
            new_scenes = await scene_clustering_service.cluster_by_smart_llm(project, project.scenes, target_duration)
        else:
            new_scenes = scene_clustering_service.cluster_by_fixed_duration(project.scenes, target_duration)

        project.scenes = new_scenes
        project.updated_at = datetime.now(timezone.utc).isoformat()
        self._save_to_disk(project)
        return project

project_service = ProjectService()

