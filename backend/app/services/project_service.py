import json
import os
import shutil
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

import re

STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "storage"))
PROJECTS_DIR = STORAGE_DIR / "projects"

ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".aac", ".ogg"}
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

MAX_AUDIO_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20 MB

def sanitize_filename(filename: str) -> str:
    """Sanitizes filename and strips any directory path traversal characters."""
    base = Path(filename).name
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', base)
    return clean or "file"

class ProjectService:
    def __init__(self):
        self._projects: dict[str, ProjectModel] = {}
        PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
        self._load_from_disk()

    def _get_project_dir(self, project_id: str) -> Path:
        pdir = PROJECTS_DIR / project_id
        pdir.mkdir(parents=True, exist_ok=True)
        return pdir

    def _get_project_file(self, project_id: str) -> Path:
        return self._get_project_dir(project_id) / "project.json"

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
        pfile = self._get_project_file(project.id)
        vb = project.video_bible
        style = vb.overall_style

        data = {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "raw_captions": project.raw_captions,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "audio_file": {
                "filename": project.audio_file.filename,
                "storage_path": project.audio_file.storage_path,
                "file_size": project.audio_file.file_size,
                "content_type": project.audio_file.content_type
            } if project.audio_file else None,
            "scenes": [
                {
                    "id": s.id,
                    "start": s.start,
                    "end": s.end,
                    "duration": s.duration,
                    "caption": s.caption,
                    "visual_description": getattr(s, "visual_description", None),
                    "image_prompt": getattr(s, "image_prompt", None),
                    "suggested_motion": getattr(s, "suggested_motion", None),
                    "suggested_transition": getattr(s, "suggested_transition", None),
                    "image_status": getattr(s, "image_status", "pending"),
                    "image_url": getattr(s, "image_url", None),
                    "image_path": getattr(s, "image_path", None),
                    "image_error": getattr(s, "image_error", None),
                    "image_metadata": getattr(s, "image_metadata", None),
                    "motion": getattr(s, "motion", "none"),
                    "transition": getattr(s, "transition", "none"),
                    "transition_duration": getattr(s, "transition_duration", 0.5),
                    "image_fit": getattr(s, "image_fit", "cover"),
                    "image_position": getattr(s, "image_position", "center"),
                    "image_zoom": getattr(s, "image_zoom", 1.0),
                    "image_crop": getattr(s, "image_crop", None),
                }
                for s in project.scenes
            ],
            "caption_settings": {
                "enabled": getattr(project.caption_settings, "enabled", True),
                "font_family": getattr(project.caption_settings, "font_family", "Inter"),
                "font_size": getattr(project.caption_settings, "font_size", 42),
                "position": getattr(project.caption_settings, "position", "bottom"),
                "alignment": getattr(project.caption_settings, "alignment", "center"),
                "background": getattr(project.caption_settings, "background", "semi-transparent"),
                "outline_shadow": getattr(project.caption_settings, "outline_shadow", "subtle"),
                "safe_area": getattr(project.caption_settings, "safe_area", True),
                "color": getattr(project.caption_settings, "color", "#FFFFFF"),
            } if hasattr(project, "caption_settings") and project.caption_settings else None,
            "audio_settings": {
                "narration_volume": getattr(project.audio_settings, "narration_volume", 1.0),
                "narration_muted": getattr(project.audio_settings, "narration_muted", False),
                "music_file": {
                    "filename": project.audio_settings.music_file.filename,
                    "storage_path": project.audio_settings.music_file.storage_path,
                    "file_size": project.audio_settings.music_file.file_size,
                    "content_type": project.audio_settings.music_file.content_type,
                } if project.audio_settings and project.audio_settings.music_file else None,
                "music_volume": getattr(project.audio_settings, "music_volume", 0.25),
                "music_fade_in": getattr(project.audio_settings, "music_fade_in", 1.0),
                "music_fade_out": getattr(project.audio_settings, "music_fade_out", 2.0),
                "music_muted": getattr(project.audio_settings, "music_muted", False),
            } if hasattr(project, "audio_settings") and project.audio_settings else None,
            "canvas_settings": {
                "aspect_ratio": getattr(project.canvas_settings, "aspect_ratio", "9:16"),
                "resolution": getattr(project.canvas_settings, "resolution", "1080x1920"),
                "fps": getattr(project.canvas_settings, "fps", 30),
            } if hasattr(project, "canvas_settings") and project.canvas_settings else None,
            "video_bible": {
                "overall_style": {
                    "visual_style": style.visual_style,
                    "realism_level": style.realism_level,
                    "color_treatment": style.color_treatment,
                    "lighting": style.lighting,
                    "camera_style": style.camera_style,
                    "lens_cinematography": style.lens_cinematography,
                    "mood": style.mood
                },
                "characters": [
                    {
                        "id": c.id,
                        "name": c.name,
                        "description": c.description,
                        "appearance": c.appearance,
                        "clothing": c.clothing,
                        "age_range": c.age_range,
                        "personality": c.personality,
                        "reference_image": self._serialize_ref_image(c.reference_image)
                    }
                    for c in vb.characters
                ],
                "locations": [
                    {
                        "id": loc.id,
                        "name": loc.name,
                        "description": loc.description,
                        "environment": loc.environment,
                        "lighting": loc.lighting,
                        "reference_image": self._serialize_ref_image(loc.reference_image)
                    }
                    for loc in vb.locations
                ],
                "objects": [
                    {
                        "id": obj.id,
                        "name": obj.name,
                        "description": obj.description,
                        "reference_image": self._serialize_ref_image(obj.reference_image)
                    }
                    for obj in vb.objects
                ],
                "rules": vb.rules
            }
        }
        with open(pfile, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

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
                if pfile.exists():
                    try:
                        with open(pfile, "r", encoding="utf-8") as f:
                            data = json.load(f)
                        proj = self._deserialize_project(data)
                        self._projects[proj.id] = proj
                    except Exception:
                        continue

    def list_projects(self) -> List[ProjectModel]:
        return list(self._projects.values())

    def get_project(self, project_id: str) -> Optional[ProjectModel]:
        return self._projects.get(project_id)

    def create_project(self, data: ProjectCreate) -> ProjectModel:
        project = ProjectModel(
            name=data.name.strip(),
            description=data.description.strip() if data.description else "",
            raw_captions=data.raw_captions or "",
            video_bible=VideoBibleModel()
        )
        self._projects[project.id] = project
        self._save_to_disk(project)
        return project

    def delete_project(self, project_id: str) -> bool:
        if project_id in self._projects:
            del self._projects[project_id]
            pdir = PROJECTS_DIR / project_id
            if pdir.exists():
                shutil.rmtree(pdir, ignore_errors=True)
            return True
        return False

    def save_audio(
        self,
        project_id: str,
        filename: str,
        content: bytes,
        content_type: str
    ) -> AudioFileModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        if len(content) > MAX_AUDIO_SIZE:
            raise ValueError(f"Audio file size ({len(content) / (1024*1024):.1f}MB) exceeds maximum limit of 50MB")

        safe_filename = sanitize_filename(filename)
        ext = Path(safe_filename).suffix.lower()
        if ext not in ALLOWED_AUDIO_EXTENSIONS:
            allowed = ", ".join(sorted(ALLOWED_AUDIO_EXTENSIONS))
            raise ValueError(f"Unsupported audio format '{ext}'. Allowed: {allowed}")

        audio_dir = self._get_project_dir(project_id) / "audio"
        audio_dir.mkdir(parents=True, exist_ok=True)
        dest_file = audio_dir / safe_filename

        with open(dest_file, "wb") as f:
            f.write(content)

        relative_path = f"storage/projects/{project_id}/audio/{safe_filename}"
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
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")
        target = next((s for s in project.scenes if s.id == scene_id), None)
        if not target:
            raise ValueError(f"Scene '{scene_id}' not found in project")

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

        ref_dir = self._get_project_dir(project_id) / "references"
        ref_dir.mkdir(parents=True, exist_ok=True)
        safe_name = f"{entity_type}_{entity_id}{ext}"
        dest_file = ref_dir / safe_name

        with open(dest_file, "wb") as f:
            f.write(content)

        relative_path = f"storage/projects/{project_id}/references/{safe_name}"
        url_path = f"/media/{project_id}/references/{safe_name}"

        ref_model = ReferenceImageModel(
            filename=safe_filename,
            storage_path=relative_path,
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
            image_crop=target.image_crop
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
            image_crop=target.image_crop
        )

        project.scenes.insert(target_idx + 1, new_scene)
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

        images_dir = STORAGE_DIR / "projects" / project_id / "images"
        images_dir.mkdir(parents=True, exist_ok=True)

        timestamp = int(datetime.now().timestamp() * 1000)
        saved_filename = f"replacement_{scene_id}_{timestamp}{ext}"
        dest_path = images_dir / saved_filename

        with open(dest_path, "wb") as f:
            f.write(file_bytes)

        relative_path = f"storage/projects/{project_id}/images/{saved_filename}"
        public_url = f"/media/{project_id}/images/{saved_filename}"

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
        content_type: str
    ) -> AudioFileModel:
        project = self.get_project(project_id)
        if not project:
            raise ValueError(f"Project '{project_id}' not found")

        if len(content) > MAX_AUDIO_SIZE:
            raise ValueError(f"Music file size ({len(content) / (1024*1024):.1f}MB) exceeds maximum limit of 50MB")

        clean_name = sanitize_filename(filename)
        ext = Path(clean_name).suffix.lower()
        if ext not in ALLOWED_AUDIO_EXTENSIONS:
            allowed = ", ".join(sorted(ALLOWED_AUDIO_EXTENSIONS))
            raise ValueError(f"Unsupported audio format '{ext}'. Allowed: {allowed}")

        audio_dir = self._get_project_dir(project_id) / "audio"
        audio_dir.mkdir(parents=True, exist_ok=True)
        timestamp = int(datetime.now().timestamp() * 1000)
        safe_name = f"bgm_{timestamp}_{clean_name}"
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

project_service = ProjectService()
