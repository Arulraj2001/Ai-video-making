import json
import logging
import os
import shutil
import time
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any

from app.configuration.config import settings
from app.configuration.firebase import get_firestore_client
from app.utils.security import sanitize_secrets
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
    ReferenceImageModel,
)

logger = logging.getLogger("scenora.repository")

def serialize_ref_image(ref: Optional[ReferenceImageModel]) -> Optional[dict]:
    if not ref:
        return None
    return {
        "filename": ref.filename,
        "storage_path": ref.storage_path,
        "url": ref.url,
        "file_size": ref.file_size,
    }

def deserialize_ref_image(data: Optional[dict]) -> Optional[ReferenceImageModel]:
    if not data:
        return None
    return ReferenceImageModel(
        filename=data.get("filename", ""),
        storage_path=data.get("storage_path", ""),
        url=data.get("url", ""),
        file_size=data.get("file_size", 0),
    )

def serialize_project(project: ProjectModel) -> Dict[str, Any]:
    """Serializes ProjectModel into a clean JSON-serializable dictionary."""
    vb = project.video_bible
    style = vb.overall_style

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description or "",
        "owner_id": getattr(project, "owner_id", None),
        "raw_captions": project.raw_captions or "",
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "audio_file": {
            "filename": project.audio_file.filename,
            "storage_path": project.audio_file.storage_path,
            "file_size": project.audio_file.file_size,
            "content_type": project.audio_file.content_type,
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
                "image_error": sanitize_secrets(getattr(s, "image_error", None)) if getattr(s, "image_error", None) else None,
                "image_metadata": getattr(s, "image_metadata", None),
                "motion": getattr(s, "motion", "none"),
                "transition": getattr(s, "transition", "none"),
                "transition_duration": getattr(s, "transition_duration", 0.5),
                "image_fit": getattr(s, "image_fit", "cover"),
                "image_position": getattr(s, "image_position", "center"),
                "image_zoom": getattr(s, "image_zoom", 1.0),
                "image_crop": getattr(s, "image_crop", None),
                "brightness": getattr(s, "brightness", 0.0),
                "contrast": getattr(s, "contrast", 1.0),
                "saturation": getattr(s, "saturation", 1.0),
                "color_filter": getattr(s, "color_filter", "none"),
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
        } if getattr(project, "caption_settings", None) else None,
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
            "ducking_enabled": getattr(project.audio_settings, "ducking_enabled", True),
        } if getattr(project, "audio_settings", None) else None,
        "canvas_settings": {
            "aspect_ratio": getattr(project.canvas_settings, "aspect_ratio", "9:16"),
            "resolution": getattr(project.canvas_settings, "resolution", "1080x1920"),
            "fps": getattr(project.canvas_settings, "fps", 30),
        } if getattr(project, "canvas_settings", None) else None,
        "video_bible": {
            "overall_style": {
                "visual_style": style.visual_style,
                "realism_level": style.realism_level,
                "color_treatment": style.color_treatment,
                "lighting": style.lighting,
                "camera_style": style.camera_style,
                "lens_cinematography": style.lens_cinematography,
                "mood": style.mood,
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
                    "reference_image": serialize_ref_image(c.reference_image),
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
                    "reference_image": serialize_ref_image(loc.reference_image),
                }
                for loc in vb.locations
            ],
            "objects": [
                {
                    "id": obj.id,
                    "name": obj.name,
                    "description": obj.description,
                    "reference_image": serialize_ref_image(obj.reference_image),
                }
                for obj in vb.objects
            ],
            "rules": vb.rules,
        },
    }

def deserialize_project(data: Dict[str, Any], project_id: Optional[str] = None) -> ProjectModel:
    """Reconstructs a ProjectModel from dictionary representation with full backward compatibility."""
    audio = None
    if data.get("audio_file") and isinstance(data.get("audio_file"), dict):
        audio = AudioFileModel(**data["audio_file"])

    scenes = []
    for s in data.get("scenes", []):
        raw_motion = s.get("motion", "none")
        motion_str = raw_motion.get("type", "none") if isinstance(raw_motion, dict) else (raw_motion or "none")
        raw_trans = s.get("transition", "none")
        trans_str = raw_trans.get("type", "none") if isinstance(raw_trans, dict) else (raw_trans or "none")
        caption_text = s.get("caption") or s.get("text") or ""

        scenes.append(
            SceneModel(
                id=str(s.get("id", f"scene_{len(scenes)+1}")),
                start=float(s.get("start", 0.0)),
                end=float(s.get("end", 0.0)),
                duration=float(s.get("duration", 0.0)),
                caption=caption_text,
                visual_description=s.get("visual_description"),
                image_prompt=s.get("image_prompt"),
                suggested_motion=s.get("suggested_motion"),
                suggested_transition=s.get("suggested_transition"),
                image_status=s.get("image_status", "pending"),
                image_url=s.get("image_url"),
                image_path=s.get("image_path"),
                image_error=s.get("image_error"),
                image_metadata=s.get("image_metadata"),
                motion=motion_str,
                transition=trans_str,
                transition_duration=float(s.get("transition_duration", 0.5)),
                image_fit=s.get("image_fit", "cover"),
                image_position=s.get("image_position", "center"),
                image_zoom=float(s.get("image_zoom", 1.0)),
                image_crop=s.get("image_crop"),
                brightness=float(s.get("brightness", 0.0)),
                contrast=float(s.get("contrast", 1.0)),
                saturation=float(s.get("saturation", 1.0)),
                color_filter=s.get("color_filter", "none"),
            )
        )

    vb_data = data.get("video_bible", {})
    if not isinstance(vb_data, dict):
        vb_data = {}
    style_data = vb_data.get("overall_style", {})

    if isinstance(style_data, dict):
        overall_style = OverallStyleModel(
            visual_style=style_data.get("visual_style", "Cinematic film"),
            realism_level=style_data.get("realism_level", "Photorealistic"),
            color_treatment=style_data.get("color_treatment", "Rich contrast, cinematic film-grade color palette with natural skin tones"),
            lighting=style_data.get("lighting", "Atmospheric natural lighting with subtle directional rim lights"),
            camera_style=style_data.get("camera_style", "Eye-level medium shots, smooth cinematic motion"),
            lens_cinematography=style_data.get("lens_cinematography", style_data.get("lens", "35mm prime lens, shallow depth of field, f/2.0")),
            mood=style_data.get("mood", "Dramatic, engaging, immersive"),
        )
    elif isinstance(style_data, str):
        overall_style = OverallStyleModel(
            visual_style=style_data or "Cinematic film",
            realism_level=vb_data.get("realism_level", "Photorealistic"),
            color_treatment=vb_data.get("color_treatment", "Rich contrast, cinematic film-grade color palette with natural skin tones"),
            lighting=vb_data.get("lighting", "Atmospheric natural lighting with subtle directional rim lights"),
            camera_style=vb_data.get("camera_style", "Eye-level medium shots, smooth cinematic motion"),
            lens_cinematography=vb_data.get("lens", "35mm prime lens, shallow depth of field, f/2.0"),
            mood=vb_data.get("mood", "Dramatic, engaging, immersive"),
        )
    else:
        overall_style = OverallStyleModel()

    characters = [
        CharacterModel(
            id=c["id"],
            name=c["name"],
            description=c.get("description", ""),
            appearance=c.get("appearance", ""),
            clothing=c.get("clothing", ""),
            age_range=c.get("age_range", ""),
            personality=c.get("personality", ""),
            reference_image=deserialize_ref_image(c.get("reference_image")),
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
            reference_image=deserialize_ref_image(loc.get("reference_image")),
        )
        for loc in vb_data.get("locations", [])
    ]

    objects = [
        ObjectModel(
            id=obj["id"],
            name=obj["name"],
            description=obj.get("description", ""),
            reference_image=deserialize_ref_image(obj.get("reference_image")),
        )
        for obj in vb_data.get("objects", [])
    ]

    rules = vb_data.get("rules", ["cinematic", "realistic", "documentary"])

    video_bible = VideoBibleModel(
        overall_style=overall_style,
        characters=characters,
        locations=locations,
        objects=objects,
        rules=rules,
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
        audio_file=audio,
        raw_captions=data.get("raw_captions", ""),
        scenes=scenes,
        video_bible=video_bible,
        caption_settings=caption_settings,
        audio_settings=audio_settings,
        canvas_settings=canvas_settings,
        owner_id=data.get("owner_id"),
        created_at=data.get("created_at") or datetime.now(timezone.utc).isoformat(),
        updated_at=data.get("updated_at") or datetime.now(timezone.utc).isoformat(),
    )


class ProjectRepository(ABC):
    """Abstract interface for project persistence."""

    @abstractmethod
    def list_projects(self, owner_id: Optional[str] = None) -> List[ProjectModel]:
        pass

    @abstractmethod
    def get_project(self, project_id: str, owner_id: Optional[str] = None) -> Optional[ProjectModel]:
        pass

    @abstractmethod
    def save_project(self, project: ProjectModel, owner_id: Optional[str] = None) -> ProjectModel:
        pass

    @abstractmethod
    def delete_project(self, project_id: str, owner_id: Optional[str] = None) -> bool:
        pass


class FilesystemProjectRepository(ProjectRepository):
    """Local filesystem project persistence using storage/projects."""

    def __init__(self, storage_dir: Optional[Path] = None):
        self.storage_dir = storage_dir or Path(getattr(settings, "STORAGE_DIR", "storage"))
        self.projects_dir = self.storage_dir / "projects"
        self.projects_dir.mkdir(parents=True, exist_ok=True)
        self._memory_cache: Dict[str, ProjectModel] = {}
        self._load_all()

    def _get_project_dir(self, project_id: str) -> Path:
        pdir = (self.projects_dir / project_id).resolve()
        pdir.mkdir(parents=True, exist_ok=True)
        return pdir

    def _get_project_file(self, project_id: str) -> Path:
        return self._get_project_dir(project_id) / "project.json"

    def _load_all(self):
        self._memory_cache.clear()
        if not self.projects_dir.exists():
            return
        for pdir in self.projects_dir.iterdir():
            if pdir.is_dir():
                pfile = pdir / "project.json"
                if pfile.exists():
                    try:
                        with open(pfile, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            proj = deserialize_project(data)
                            self._memory_cache[proj.id] = proj
                    except Exception as e:
                        logger.warning(f"Failed to read project from {pfile}: {e}")

    def list_projects(self, owner_id: Optional[str] = None) -> List[ProjectModel]:
        self._load_all()
        all_projs = list(self._memory_cache.values())
        if not owner_id:
            return all_projs

        # Enforce user isolation:
        # Match projects owned by this owner_id, or unassigned legacy projects if owner_id is default legacy user
        default_legacy = getattr(settings, "DEFAULT_LEGACY_UID", "legacy-local-user")
        filtered = []
        for p in all_projs:
            if p.owner_id == owner_id:
                filtered.append(p)
            elif p.owner_id is None and owner_id == default_legacy:
                filtered.append(p)
        return sorted(filtered, key=lambda x: x.updated_at, reverse=True)

    def get_project(self, project_id: str, owner_id: Optional[str] = None) -> Optional[ProjectModel]:
        proj = self._memory_cache.get(project_id)
        if not proj:
            # Check disk in case it was written externally
            pfile = self._get_project_file(project_id)
            if pfile.exists():
                try:
                    with open(pfile, "r", encoding="utf-8") as f:
                        proj = deserialize_project(json.load(f))
                        self._memory_cache[proj.id] = proj
                except Exception:
                    return None

        if not proj:
            return None

        # Verify ownership if owner_id is specified
        default_legacy = getattr(settings, "DEFAULT_LEGACY_UID", "legacy-local-user")
        if owner_id:
            if proj.owner_id is not None and proj.owner_id != owner_id:
                # Belongs to a different user -> Not accessible
                return None
            if proj.owner_id is None and owner_id != default_legacy:
                # Unassigned legacy project accessed by an authenticated user -> claim it!
                proj.owner_id = owner_id
                self.save_project(proj, owner_id)

        return proj

    def save_project(self, project: ProjectModel, owner_id: Optional[str] = None) -> ProjectModel:
        if owner_id:
            project.owner_id = owner_id
        project.updated_at = datetime.now(timezone.utc).isoformat()

        data = serialize_project(project)
        pdir = self._get_project_dir(project.id)
        tmp_file = pdir / f"project.json.tmp.{uuid.uuid4().hex}"
        bak_file = pdir / "project.json.bak"
        pfile = pdir / "project.json"

        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            f.flush()
            os.fsync(f.fileno())

        if pfile.exists():
            try:
                shutil.copy2(pfile, bak_file)
            except Exception:
                pass

        for attempt in range(10):
            try:
                os.replace(tmp_file, pfile)
                break
            except PermissionError:
                if attempt == 9:
                    raise
                time.sleep(0.02 * (attempt + 1))

        self._memory_cache[project.id] = project
        return project

    def delete_project(self, project_id: str, owner_id: Optional[str] = None) -> bool:
        proj = self.get_project(project_id, owner_id)
        if not proj:
            return False

        if project_id in self._memory_cache:
            del self._memory_cache[project_id]

        pdir = self.projects_dir / project_id
        if pdir.exists():
            shutil.rmtree(pdir, ignore_errors=True)
        return True


class FirestoreProjectRepository(ProjectRepository):
    """
    Cloud Firestore project persistence under:
    users/{owner_id}/projects/{project_id}
    """

    def __init__(self):
        self.db = get_firestore_client()

    def _get_collection_ref(self, owner_id: str):
        if not self.db:
            return None
        return self.db.collection("users").document(owner_id).collection("projects")

    def list_projects(self, owner_id: Optional[str] = None) -> List[ProjectModel]:
        if not self.db or not owner_id:
            return []
        try:
            col_ref = self._get_collection_ref(owner_id)
            docs = col_ref.stream()
            projects = []
            for doc in docs:
                data = doc.to_dict()
                if data:
                    projects.append(deserialize_project(data, project_id=doc.id))
            return sorted(projects, key=lambda p: p.updated_at, reverse=True)
        except Exception as e:
            logger.error(f"Firestore list_projects failed for user {owner_id}: {e}")
            return []

    def get_project(self, project_id: str, owner_id: Optional[str] = None) -> Optional[ProjectModel]:
        if not self.db or not owner_id:
            return None
        try:
            doc_ref = self._get_collection_ref(owner_id).document(project_id)
            doc = doc_ref.get()
            if not doc.exists:
                return None
            data = doc.to_dict()
            return deserialize_project(data, project_id=doc.id)
        except Exception as e:
            logger.error(f"Firestore get_project failed for user {owner_id}, project {project_id}: {e}")
            return None

    def save_project(self, project: ProjectModel, owner_id: Optional[str] = None) -> ProjectModel:
        if not self.db or not owner_id:
            return project
        try:
            project.owner_id = owner_id
            project.updated_at = datetime.now(timezone.utc).isoformat()
            data = serialize_project(project)
            doc_ref = self._get_collection_ref(owner_id).document(project.id)
            doc_ref.set(data)

            # Update user profile last_active timestamp
            try:
                user_ref = self.db.collection("users").document(owner_id)
                user_ref.set({
                    "uid": owner_id,
                    "last_active": project.updated_at,
                    "updated_at": project.updated_at
                }, merge=True)
            except Exception:
                pass

            return project
        except Exception as e:
            logger.error(f"Firestore save_project failed for user {owner_id}, project {project.id}: {e}")
            raise

    def delete_project(self, project_id: str, owner_id: Optional[str] = None) -> bool:
        if not self.db or not owner_id:
            return False
        try:
            doc_ref = self._get_collection_ref(owner_id).document(project_id)
            doc_ref.delete()
            return True
        except Exception as e:
            logger.error(f"Firestore delete_project failed for user {owner_id}, project {project_id}: {e}")
            return False


class DualReadProjectRepository(ProjectRepository):
    """
    Seamless Dual-Read & Non-Destructive Migration Repository:
    1. Checks Cloud Firestore (users/{owner_id}/projects/{project_id})
    2. If not found in Firestore, falls back to local filesystem storage
    3. If found locally and user is authenticated, seamlessly migrates to Firestore
    4. Writes to both Firestore and local filesystem to preserve 100% backward compatibility
    """

    def __init__(self, fs_repo: Optional[FilesystemProjectRepository] = None):
        self.fs_repo = fs_repo or FilesystemProjectRepository()
        self.firestore_repo = FirestoreProjectRepository()

    @property
    def is_firestore_ready(self) -> bool:
        if os.getenv("PYTEST_CURRENT_TEST") and os.getenv("TEST_FIRESTORE") != "1":
            return False
        return self.firestore_repo.db is not None

    def list_projects(self, owner_id: Optional[str] = None) -> List[ProjectModel]:
        if not self.is_firestore_ready or not owner_id:
            return self.fs_repo.list_projects(owner_id)

        # Merge projects from Firestore and local filesystem
        fs_projs = self.fs_repo.list_projects(owner_id)
        firestore_projs = self.firestore_repo.list_projects(owner_id)

        projects_by_id: Dict[str, ProjectModel] = {p.id: p for p in fs_projs}
        for p in firestore_projs:
            projects_by_id[p.id] = p

        return sorted(projects_by_id.values(), key=lambda p: p.updated_at, reverse=True)

    def get_project(self, project_id: str, owner_id: Optional[str] = None) -> Optional[ProjectModel]:
        default_legacy = getattr(settings, "DEFAULT_LEGACY_UID", "legacy-local-user")

        # 1. Check local filesystem / cache first (instant response & unit-test safe)
        proj = self.fs_repo.get_project(project_id, owner_id)
        if proj:
            # Dual-Read non-destructive migration: if authenticated creator, sync to Firestore
            if self.is_firestore_ready and owner_id and owner_id != default_legacy:
                try:
                    if proj.owner_id != owner_id:
                        proj.owner_id = owner_id
                    self.firestore_repo.save_project(proj, owner_id)
                    logger.info(f"Non-destructively synced project '{project_id}' to Firestore for user '{owner_id}'")
                except Exception as e:
                    logger.debug(f"Firestore background sync deferred for {project_id}: {e}")
            return proj

        # 2. Dual-Read: If not in local cache, check Cloud Firestore
        if self.is_firestore_ready and owner_id:
            proj = self.firestore_repo.get_project(project_id, owner_id)
            if proj:
                # Also ensure cached in filesystem memory
                self.fs_repo._memory_cache[proj.id] = proj
                return proj

        return None

    def save_project(self, project: ProjectModel, owner_id: Optional[str] = None) -> ProjectModel:
        if owner_id:
            project.owner_id = owner_id

        # 1. Always save locally to ensure fast media serving & local offline safety
        self.fs_repo.save_project(project, owner_id)

        # 2. Save to Cloud Firestore if connected
        if self.is_firestore_ready and owner_id:
            try:
                self.firestore_repo.save_project(project, owner_id)
            except Exception as e:
                logger.warning(f"Failed to sync project '{project.id}' to Firestore: {e}")

        return project

    def delete_project(self, project_id: str, owner_id: Optional[str] = None) -> bool:
        fs_deleted = self.fs_repo.delete_project(project_id, owner_id)
        firestore_deleted = False
        if self.is_firestore_ready and owner_id:
            firestore_deleted = self.firestore_repo.delete_project(project_id, owner_id)
        return fs_deleted or firestore_deleted
