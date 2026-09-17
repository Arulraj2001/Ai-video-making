import csv
import io
import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Union, Tuple, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, Body, Request, HTTPException, status, Depends, Query
from fastapi.responses import JSONResponse
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectSummaryResponse,
    SceneSchema,
    SceneUpdate,
    AudioFileSchema,
    CaptionSettingsSchema,
    AudioSettingsSchema,
    CanvasSettingsSchema,
    ProjectSettingsUpdate,
    ParseCaptionsRequest,
    ParseCaptionsResponse
)
from app.services.project_service import project_service
from app.services.caption_parser import parse_and_validate_captions
from app.services.bulk_import_service import bulk_import_service
from app.services.payments.payment_service import get_payment_service
from app.utils.errors import NotFoundException
from app.api.routes.video_bible import _serialize_bible
from app.api.dependencies.auth import get_current_user, AuthenticatedUser
import logging

logger = logging.getLogger("scenora.projects")

router = APIRouter(prefix="/projects", tags=["projects"])

def _format_srt_time(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

def _format_display_time(seconds: float) -> str:
    minutes = int(seconds // 60)
    secs = seconds % 60
    return f"{minutes:02d}:{secs:04.1f}"

def _scene_image_url(project_id, scene, owner_id) -> Optional[str]:
    """Returns a fresh/durable URL for a completed scene image, falling back to the stored one."""
    raw_url = getattr(scene, "image_url", None)
    if not raw_url:
        return raw_url
    raw_path = getattr(scene, "image_path", None) or raw_url
    name = Path(str(raw_path)).name if raw_path else None
    if name:
        try:
            resolved = project_service.resolve_media_url(project_id, "images", name, owner_id)
            if resolved:
                return resolved
        except Exception:
            pass
    return raw_url


def _to_project_response(p) -> ProjectResponse:
    audio = None
    if p.audio_file:
        audio = AudioFileSchema(
            filename=p.audio_file.filename,
            file_size=p.audio_file.file_size,
            content_type=p.audio_file.content_type,
            url=project_service.resolve_media_url(p.id, "audio", p.audio_file.filename, p.owner_id)
            or f"/media/{p.id}/audio/{p.audio_file.filename}"
        )
    scenes = []
    for s in p.scenes:
        sch = SceneSchema.model_validate(s)
        if sch.image_url:
            sch.image_url = _scene_image_url(p.id, s, p.owner_id)
        scenes.append(sch)

    bgm = None
    if getattr(p, "audio_settings", None) and p.audio_settings.music_file:
        bgm = AudioFileSchema(
            filename=p.audio_settings.music_file.filename,
            file_size=p.audio_settings.music_file.file_size,
            content_type=p.audio_settings.music_file.content_type,
            url=project_service.resolve_media_url(
                p.id, "audio", p.audio_settings.music_file.filename, p.owner_id
            )
            or f"/media/{p.id}/audio/{p.audio_settings.music_file.filename}"
        )

    caption_settings = None
    if getattr(p, "caption_settings", None):
        caption_settings = CaptionSettingsSchema(
            enabled=p.caption_settings.enabled,
            font_family=p.caption_settings.font_family,
            font_size=p.caption_settings.font_size,
            position=p.caption_settings.position,
            alignment=p.caption_settings.alignment,
            background=p.caption_settings.background,
            outline_shadow=p.caption_settings.outline_shadow,
            safe_area=p.caption_settings.safe_area,
            color=p.caption_settings.color
        )

    audio_settings = None
    if getattr(p, "audio_settings", None):
        audio_settings = AudioSettingsSchema(
            narration_volume=p.audio_settings.narration_volume,
            narration_muted=p.audio_settings.narration_muted,
            music_file=bgm,
            music_volume=p.audio_settings.music_volume,
            music_fade_in=p.audio_settings.music_fade_in,
            music_fade_out=p.audio_settings.music_fade_out,
            music_muted=p.audio_settings.music_muted,
            ducking_enabled=getattr(p.audio_settings, "ducking_enabled", True)
        )

    canvas_settings = None
    if getattr(p, "canvas_settings", None):
        canvas_settings = CanvasSettingsSchema(
            aspect_ratio=p.canvas_settings.aspect_ratio,
            resolution=p.canvas_settings.resolution,
            fps=p.canvas_settings.fps,
            motion_preset=getattr(p.canvas_settings, "motion_preset", "none"),
        )

    return ProjectResponse(
        id=p.id,
        name=p.name,
        description=p.description,
        owner_id=getattr(p, "owner_id", None),
        audio_file=audio,
        raw_captions=p.raw_captions,
        scenes=scenes,
        video_bible=_serialize_bible(p.video_bible),
        caption_settings=caption_settings,
        audio_settings=audio_settings,
        canvas_settings=canvas_settings,
        created_at=p.created_at,
        updated_at=p.updated_at
    )

@router.get("", response_model=Union[List[ProjectSummaryResponse], List[ProjectResponse]])
def list_projects(
    summary: bool = False,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Returns list of active projects for the current creator."""
    projects = project_service.list_projects(owner_id=current_user.uid)
    if summary:
        summaries = []
        for p in projects:
            scenes = p.scenes or []
            aspect_ratio = getattr(p.canvas_settings, "aspect_ratio", "16:9") if getattr(p, "canvas_settings", None) else "16:9"
            total_duration = scenes[-1].end if scenes else 0.0
            thumb = next((s.image_url for s in scenes if getattr(s, "image_url", None)), None)
            if thumb:
                first = next((s for s in scenes if getattr(s, "image_url", None)), None)
                thumb = _scene_image_url(p.id, first, p.owner_id) or thumb

            cs = None
            if getattr(p, "canvas_settings", None):
                cs = CanvasSettingsSchema(
                    aspect_ratio=p.canvas_settings.aspect_ratio,
                    resolution=p.canvas_settings.resolution,
                    fps=p.canvas_settings.fps,
                )

            summaries.append(
                ProjectSummaryResponse(
                    id=p.id,
                    name=p.name,
                    description=p.description or "",
                    aspect_ratio=aspect_ratio,
                    scene_count=len(scenes),
                    total_duration=round(total_duration, 2),
                    thumbnail_url=thumb,
                    canvas_settings=cs,
                    owner_id=p.owner_id,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                )
            )
        return summaries
    return [_to_project_response(p) for p in projects]

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(data: ProjectCreate, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Creates a new project owned by the current creator."""
    p = project_service.create_project(data, owner_id=current_user.uid)
    return _to_project_response(p)

@router.post("/parse-captions", response_model=ParseCaptionsResponse)
def parse_captions(req: ParseCaptionsRequest):
    """
    Parses and validates raw Clipchamp captions without persisting them.
    Used for instant UI preview and validation checks.
    """
    result = parse_and_validate_captions(req.raw_captions)
    scenes = [
        SceneSchema(
            id=s.id,
            start=s.start,
            end=s.end,
            duration=s.duration,
            caption=s.caption
        )
        for s in result.scenes
    ]
    return ParseCaptionsResponse(
        valid=result.valid,
        scenes=scenes,
        errors=result.errors
    )

@router.post("/import", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def import_project(
    name: str = Form(...),
    description: Optional[str] = Form(""),
    raw_captions: str = Form(...),
    audio_file: Optional[UploadFile] = File(None),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Creates a new project by parsing Clipchamp captions into Master Timeline scenes
    and optionally uploading a voice/audio file.
    """
    parse_result = parse_and_validate_captions(raw_captions)
    if not parse_result.valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Caption validation failed", "errors": parse_result.errors}
        )

    # Create project owned by current creator
    proj = project_service.create_project(ProjectCreate(name=name, description=description or ""), owner_id=current_user.uid)
    
    # Save audio if uploaded
    if audio_file:
        content = await audio_file.read()
        try:
            project_service.save_audio(
                project_id=proj.id,
                filename=audio_file.filename or "audio.mp3",
                content=content,
                content_type=audio_file.content_type or "audio/mpeg",
                owner_id=current_user.uid
            )
        except ValueError as e:
            project_service.delete_project(proj.id, owner_id=current_user.uid)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Set parsed scenes
    proj = project_service.set_captions_and_scenes(proj.id, raw_captions, parse_result.scenes)
    return _to_project_response(proj)

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Retrieves single project by ID with creator isolation."""
    p = project_service.get_project(project_id, owner_id=current_user.uid)
    if not p:
        raise NotFoundException("Project", project_id)
    return _to_project_response(p)

@router.post("/{project_id}/audio", response_model=ProjectResponse)
async def upload_project_audio(
    project_id: str,
    audio_file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Uploads or replaces audio file for an existing project."""
    p = project_service.get_project(project_id, owner_id=current_user.uid)
    if not p:
        raise NotFoundException("Project", project_id)

    content = await audio_file.read()
    try:
        project_service.save_audio(
            project_id=project_id,
            filename=audio_file.filename or "audio.mp3",
            content=content,
            content_type=audio_file.content_type or "audio/mpeg",
            owner_id=current_user.uid
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return _to_project_response(project_service.get_project(project_id, owner_id=current_user.uid))

@router.delete("/{project_id}/audio", response_model=ProjectResponse)
def delete_project_audio(project_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Removes narration audio file from the project."""
    p = project_service.get_project(project_id, owner_id=current_user.uid)
    if not p:
        raise NotFoundException("Project", project_id)

    updated = project_service.delete_audio(project_id)
    return _to_project_response(updated)

@router.post("/{project_id}/captions", response_model=ProjectResponse)
def update_project_captions(
    project_id: str,
    req: ParseCaptionsRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Parses and updates scenes from raw captions for an existing project."""
    p = project_service.get_project(project_id, owner_id=current_user.uid)
    if not p:
        raise NotFoundException("Project", project_id)

    parse_result = parse_and_validate_captions(req.raw_captions)
    if not parse_result.valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Caption validation failed", "errors": parse_result.errors}
        )

    updated = project_service.set_captions_and_scenes(project_id, req.raw_captions, parse_result.scenes)
    return _to_project_response(updated)

@router.post("/{project_id}/ingest", response_model=ProjectResponse)
async def ingest_project_media(
    project_id: str,
    raw_captions: str = Form(...),
    audio_file: Optional[UploadFile] = File(None),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Ingests voiceover narration audio and Clipchamp timestamped captions
    directly into an existing project in a single atomic call.
    Does not create a duplicate project record.
    """
    p = project_service.get_project(project_id, owner_id=current_user.uid)
    if not p:
        raise NotFoundException("Project", project_id)

    parse_result = parse_and_validate_captions(raw_captions)
    if not parse_result.valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Caption validation failed", "errors": parse_result.errors}
        )

    if audio_file:
        content = await audio_file.read()
        try:
            project_service.save_audio(
                project_id=project_id,
                filename=audio_file.filename or "audio.mp3",
                content=content,
                content_type=audio_file.content_type or "audio/mpeg",
                owner_id=current_user.uid
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    updated = project_service.set_captions_and_scenes(project_id, raw_captions, parse_result.scenes)
    return _to_project_response(updated)

@router.put("/{project_id}/scenes/{scene_id}", response_model=SceneSchema)
def update_scene(
    project_id: str,
    scene_id: str,
    update: SceneUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Updates a single scene's start, end, or caption with timeline validation."""
    p = project_service.get_project(project_id, owner_id=current_user.uid)
    if not p:
        raise NotFoundException("Project", project_id)

    try:
        scene = project_service.update_scene(project_id, scene_id, update)
        return SceneSchema.model_validate(scene)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Deletes project by ID with creator ownership verification."""
    p = project_service.get_project(project_id, owner_id=current_user.uid)
    if not p:
        raise NotFoundException("Project", project_id)

    deleted = project_service.delete_project(project_id, owner_id=current_user.uid)
    if not deleted:
        raise NotFoundException("Project", project_id)
    return None

@router.put("/{project_id}/settings", response_model=ProjectResponse)
def update_project_settings(
    project_id: str,
    settings: ProjectSettingsUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Updates pre-export editing configurations:
    - Caption Settings (enabled, font, size, position, alignment, background, outline/shadow, safe area, color)
    - Audio Settings (narration volume/mute, music volume/fade in/fade out/mute)
    - Canvas Settings (aspect ratio, resolution, fps)
    """
    p = project_service.get_project(project_id, owner_id=current_user.uid)
    if not p:
        raise NotFoundException("Project", project_id)

    try:
        updated = project_service.update_project_settings(project_id, settings)
        return _to_project_response(updated)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/{project_id}/music", response_model=ProjectResponse)
@router.post("/{project_id}/audio/background-music", response_model=ProjectResponse)
async def upload_background_music(
    project_id: str,
    music_file: Optional[UploadFile] = File(None),
    file: Optional[UploadFile] = File(None),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Uploads background music audio file for the project."""
    actual_file = music_file or file
    if not actual_file:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No audio file provided.")

    p = project_service.get_project(project_id, owner_id=current_user.uid)
    if not p:
        raise NotFoundException("Project", project_id)

    content = await actual_file.read()
    try:
        project_service.save_background_music(
            project_id=project_id,
            filename=actual_file.filename or "music.mp3",
            content=content,
            content_type=actual_file.content_type or "audio/mpeg"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return _to_project_response(project_service.get_project(project_id, owner_id=current_user.uid))

@router.delete("/{project_id}/music", response_model=ProjectResponse)
@router.delete("/{project_id}/audio/background-music", response_model=ProjectResponse)
def delete_background_music(project_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Removes background music from the project."""
    p = project_service.get_project(project_id, owner_id=current_user.uid)
    if not p:
        raise NotFoundException("Project", project_id)

    updated = project_service.delete_background_music(project_id)
    return _to_project_response(updated)

@router.get("/{project_id}/export")
def export_project_backup(project_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Exports complete project as a downloadable JSON backup."""
    p = project_service.get_project(project_id, owner_id=current_user.uid)
    if not p:
        raise NotFoundException("Project", project_id)
    data = project_service.export_project_json(project_id)
    filename = f"{project_id}_backup.json"
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.post("/import-backup", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def import_project_backup(request: Request, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Restores a project from an uploaded JSON backup file or raw JSON payload."""
    content_type = request.headers.get("content-type", "")
    data = None
    if "multipart/form-data" in content_type:
        form = await request.form()
        backup_file = form.get("backup_file") or form.get("file")
        if backup_file and hasattr(backup_file, "read"):
            content = await backup_file.read()
            try:
                data = json.loads(content.decode("utf-8"))
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid JSON file: {e}")
        else:
            raw_json = form.get("json_data")
            if raw_json:
                data = json.loads(str(raw_json))
    else:
        try:
            data = await request.json()
        except Exception:
            data = None

    if not data:
        raise HTTPException(status_code=400, detail="No backup file or JSON data provided")

    try:
        restored = project_service.import_project_json(data)
        if restored:
            restored.owner_id = current_user.uid
            project_service.repository.save_project(restored, current_user.uid)
        return _to_project_response(restored)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{project_id}/cleanup")
def cleanup_project_temp_files(project_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Cleans up temporary render directories and stale files for a project."""
    p = project_service.get_project(project_id, owner_id=current_user.uid)
    if not p:
        raise NotFoundException("Project", project_id)
    res = project_service.cleanup_temp_files(project_id)
    return {"message": "Cleanup complete", **res}

@router.post("/cleanup")
def cleanup_all_temp_files():
    """Cleans up temporary render directories across all projects."""
    res = project_service.cleanup_temp_files(None)
    return {"message": "Cleanup complete", **res}

# ══════════════════════════════════════════════════════════════════════════════
# BULK SCENE IMAGE IMPORT (PAID PRO FEATURE) & DUAL EXPORTERS
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/{project_id}/scenes/bulk-images")
async def bulk_import_scene_images(
    project_id: str,
    files: List[UploadFile] = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    PRO FEATURE: Ingests multiple images or a ZIP archive, matches files to scenes,
    sanitizes each image for 100% FFmpeg rendering safety, and updates project scenes.
    """
    project = project_service.get_project(project_id, owner_id=current_user.uid)
    if not project:
        raise NotFoundException("Project", project_id)

    # 1. Pro Entitlement Check
    is_pro = False
    if current_user.is_admin:
        is_pro = True
    else:
        payment_svc = get_payment_service()
        ent = payment_svc.get_active_entitlement(current_user.uid)
        if ent and ent.status == "active":
            is_pro = True

    if not is_pro:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="PRO_ENTITLEMENT_REQUIRED: Bulk scene image alignment is a Pro creator feature. Upgrade to Pro to unlock bulk imports and automated alignment."
        )

    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files uploaded.")

    # 2. Extract files (supporting single .zip or multi-file drops)
    extracted: List[Tuple[str, bytes]] = []
    if len(files) == 1 and (files[0].filename or "").lower().endswith(".zip"):
        zip_bytes = await files[0].read()
        try:
            extracted = bulk_import_service.extract_zip_files(zip_bytes)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid ZIP archive: {e}")
    else:
        for f in files:
            content = await f.read()
            extracted.append((f.filename or "image.png", content))

    if not extracted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid image files found in upload.")

    # 3. Match files to scenes
    assigned, leftover = bulk_import_service.match_files_to_scenes(extracted, project.scenes)

    # 4. Sanitize and assign to matched scenes
    updated_scenes = []
    timestamp = int(time.time() * 1000)

    for scene_num, (filename, raw_bytes) in assigned.items():
        # scene_num is 1-indexed
        target_scene = next((s for s in project.scenes if getattr(s, "scene_number", None) == scene_num), None)
        if not target_scene and 1 <= scene_num <= len(project.scenes):
            target_scene = project.scenes[scene_num - 1]

        if not target_scene:
            continue

        try:
            clean_bytes, w, h = bulk_import_service.sanitize_image_for_ffmpeg(raw_bytes, filename)
        except Exception as e:
            logger.warning(f"Skipping corrupted bulk image '{filename}': {e}")
            continue

        saved_name = f"bulk_{target_scene.id}_{timestamp}.png"
        relative_path, public_url = project_service.save_scene_image_asset(
            project_id=project.id,
            scene_id=target_scene.id,
            image_bytes=clean_bytes,
            filename=saved_name,
            owner_id=project.owner_id,
        )

        target_scene.image_url = public_url
        target_scene.image_path = relative_path
        target_scene.image_status = "completed"
        target_scene.image_error = None
        target_scene.image_metadata = {
            "source": "bulk_import",
            "original_filename": filename,
            "width": w,
            "height": h,
            "imported_at": datetime.now(timezone.utc).isoformat()
        }
        updated_scenes.append(SceneSchema.model_validate(target_scene))

    project.updated_at = datetime.now(timezone.utc).isoformat()
    project_service._save_to_disk(project)

    return {
        "matched_count": len(updated_scenes),
        "unmatched_files": leftover,
        "updated_scenes": updated_scenes,
        "project": _to_project_response(project)
    }

@router.get("/{project_id}/export/captions")
def export_project_captions(
    project_id: str,
    format: str = Query("timed_txt"),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Exports project narration captions with exact timeline timecodes.
    Formats:
      - 'timed_txt': [00:00.0 - 00:06.5] Scene 1: "..."
      - 'srt': Standard SubRip subtitle format (.srt)
      - 'clean_txt': Raw continuous narration script text
    """
    project = project_service.get_project(project_id, owner_id=current_user.uid)
    if not project:
        raise NotFoundException("Project", project_id)

    slug = re.sub(r"[^a-zA-Z0-9_\-]+", "_", (project.name or "project").lower()).strip("_")

    if format == "srt":
        srt_lines = []
        for i, scene in enumerate(project.scenes, start=1):
            start_s = _format_srt_time(scene.start)
            end_s = _format_srt_time(scene.end)
            text = (scene.caption or "").strip()
            srt_lines.append(f"{i}\n{start_s} --> {end_s}\n{text}\n")
        content = "\n".join(srt_lines)
        ext = "srt"
    elif format == "timed_txt":
        lines = []
        for i, scene in enumerate(project.scenes, start=1):
            start_s = _format_display_time(scene.start)
            end_s = _format_display_time(scene.end)
            dur = scene.end - scene.start
            text = (scene.caption or "").strip()
            lines.append(f"[{start_s} - {end_s}] ({dur:.1f}s) Scene {i}:\n\"{text}\"\n")
        content = "\n".join(lines)
        ext = "txt"
    else:  # clean_txt
        lines = [(scene.caption or "").strip() for scene in project.scenes if (scene.caption or "").strip()]
        content = "\n\n".join(lines)
        ext = "txt"

    return {
        "format": format,
        "filename": f"{slug}_captions_{format}.{ext}",
        "content": content,
        "scene_count": len(project.scenes)
    }

@router.get("/{project_id}/export/prompts")
def export_project_prompts(
    project_id: str,
    format: str = Query("midjourney"),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Exports system-generated visual prompts formatted for external AI generators.
    Formats:
      - 'midjourney': /imagine prompt: ... --ar {aspect_ratio} --v 6.0
      - 'comfyui': Clean line-by-line list for ComfyUI / Leonardo / Fooocus
      - 'csv': Spreadsheet with Scene, Start, End, Narration, Prompt, AspectRatio
    """
    project = project_service.get_project(project_id, owner_id=current_user.uid)
    if not project:
        raise NotFoundException("Project", project_id)

    slug = re.sub(r"[^a-zA-Z0-9_\-]+", "_", (project.name or "project").lower()).strip("_")
    aspect_ratio = getattr(project.canvas_settings, "aspect_ratio", "16:9") or "16:9"

    items = []
    for i, scene in enumerate(project.scenes, start=1):
        prompt = (scene.image_prompt or scene.visual_description or scene.caption or "").strip()
        items.append({
            "scene_num": i,
            "start": scene.start,
            "end": scene.end,
            "caption": (scene.caption or "").strip(),
            "prompt": prompt
        })

    if format == "midjourney":
        lines = []
        for item in items:
            prompt_clean = item["prompt"]
            lines.append(f"// Scene {item['scene_num']} ({item['start']:.1f}s - {item['end']:.1f}s)\n/imagine prompt: {prompt_clean} --ar {aspect_ratio} --v 6.0\n")
        content = "\n".join(lines)
        ext = "txt"
    elif format == "comfyui":
        lines = [item["prompt"] for item in items]
        content = "\n\n".join(lines)
        ext = "txt"
    else:  # csv
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Scene", "Start Time", "End Time", "Duration (s)", "Narration Caption", "System Prompt", "Aspect Ratio"])
        for item in items:
            dur = round(item["end"] - item["start"], 2)
            writer.writerow([
                item["scene_num"],
                _format_display_time(item["start"]),
                _format_display_time(item["end"]),
                dur,
                item["caption"],
                item["prompt"],
                aspect_ratio
            ])
        content = output.getvalue()
        ext = "csv"

    return {
        "format": format,
        "filename": f"{slug}_prompts_{format}.{ext}",
        "content": content,
        "prompt_count": len(items)
    }


