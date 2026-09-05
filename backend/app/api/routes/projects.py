import json
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, Body, Request, HTTPException, status
from fastapi.responses import JSONResponse
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
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
from app.utils.errors import NotFoundException
from app.api.routes.video_bible import _serialize_bible

router = APIRouter(prefix="/projects", tags=["projects"])

def _to_project_response(p) -> ProjectResponse:
    audio = None
    if p.audio_file:
        audio = AudioFileSchema(
            filename=p.audio_file.filename,
            file_size=p.audio_file.file_size,
            content_type=p.audio_file.content_type,
            url=f"/media/{p.id}/audio/{p.audio_file.filename}"
        )
    scenes = [
        SceneSchema.model_validate(s)
        for s in p.scenes
    ]

    bgm = None
    if getattr(p, "audio_settings", None) and p.audio_settings.music_file:
        bgm = AudioFileSchema(
            filename=p.audio_settings.music_file.filename,
            file_size=p.audio_settings.music_file.file_size,
            content_type=p.audio_settings.music_file.content_type,
            url=f"/media/{p.id}/audio/{p.audio_settings.music_file.filename}"
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
            fps=p.canvas_settings.fps
        )

    return ProjectResponse(
        id=p.id,
        name=p.name,
        description=p.description,
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

@router.get("", response_model=List[ProjectResponse])
def list_projects():
    """Returns list of active projects."""
    projects = project_service.list_projects()
    return [_to_project_response(p) for p in projects]

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(data: ProjectCreate):
    """Creates a new project in the workspace."""
    p = project_service.create_project(data)
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
    audio_file: Optional[UploadFile] = File(None)
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

    # Create project
    proj = project_service.create_project(ProjectCreate(name=name, description=description or ""))
    
    # Save audio if uploaded
    if audio_file:
        content = await audio_file.read()
        try:
            project_service.save_audio(
                project_id=proj.id,
                filename=audio_file.filename or "audio.mp3",
                content=content,
                content_type=audio_file.content_type or "audio/mpeg"
            )
        except ValueError as e:
            project_service.delete_project(proj.id)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Set parsed scenes
    proj = project_service.set_captions_and_scenes(proj.id, raw_captions, parse_result.scenes)
    return _to_project_response(proj)

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str):
    """Retrieves single project by ID."""
    p = project_service.get_project(project_id)
    if not p:
        raise NotFoundException("Project", project_id)
    return _to_project_response(p)

@router.post("/{project_id}/audio", response_model=ProjectResponse)
async def upload_project_audio(project_id: str, audio_file: UploadFile = File(...)):
    """Uploads or replaces audio file for an existing project."""
    p = project_service.get_project(project_id)
    if not p:
        raise NotFoundException("Project", project_id)

    content = await audio_file.read()
    try:
        project_service.save_audio(
            project_id=project_id,
            filename=audio_file.filename or "audio.mp3",
            content=content,
            content_type=audio_file.content_type or "audio/mpeg"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return _to_project_response(project_service.get_project(project_id))

@router.delete("/{project_id}/audio", response_model=ProjectResponse)
def delete_project_audio(project_id: str):
    """Removes narration audio file from the project."""
    p = project_service.get_project(project_id)
    if not p:
        raise NotFoundException("Project", project_id)

    updated = project_service.delete_audio(project_id)
    return _to_project_response(updated)

@router.post("/{project_id}/captions", response_model=ProjectResponse)
def update_project_captions(project_id: str, req: ParseCaptionsRequest):
    """Parses and updates scenes from raw captions for an existing project."""
    p = project_service.get_project(project_id)
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

@router.put("/{project_id}/scenes/{scene_id}", response_model=SceneSchema)
def update_scene(project_id: str, scene_id: str, update: SceneUpdate):
    """Updates a single scene's start, end, or caption with timeline validation."""
    try:
        scene = project_service.update_scene(project_id, scene_id, update)
        return SceneSchema.model_validate(scene)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str):
    """Deletes project by ID."""
    deleted = project_service.delete_project(project_id)
    if not deleted:
        raise NotFoundException("Project", project_id)
    return None

@router.put("/{project_id}/settings", response_model=ProjectResponse)
def update_project_settings(project_id: str, settings: ProjectSettingsUpdate):
    """
    Updates pre-export editing configurations:
    - Caption Settings (enabled, font, size, position, alignment, background, outline/shadow, safe area, color)
    - Audio Settings (narration volume/mute, music volume/fade in/fade out/mute)
    - Canvas Settings (aspect ratio, resolution, fps)
    """
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
):
    """Uploads background music audio file for the project."""
    actual_file = music_file or file
    if not actual_file:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No audio file provided.")

    p = project_service.get_project(project_id)
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

    return _to_project_response(project_service.get_project(project_id))

@router.delete("/{project_id}/music", response_model=ProjectResponse)
@router.delete("/{project_id}/audio/background-music", response_model=ProjectResponse)
def delete_background_music(project_id: str):
    """Removes background music from the project."""
    p = project_service.get_project(project_id)
    if not p:
        raise NotFoundException("Project", project_id)

    updated = project_service.delete_background_music(project_id)
    return _to_project_response(updated)

@router.get("/{project_id}/export")
def export_project_backup(project_id: str):
    """Exports complete project as a downloadable JSON backup."""
    p = project_service.get_project(project_id)
    if not p:
        raise NotFoundException("Project", project_id)
    data = project_service.export_project_json(project_id)
    filename = f"{project_id}_backup.json"
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.post("/import-backup", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def import_project_backup(request: Request):
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
        return _to_project_response(restored)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{project_id}/cleanup")
def cleanup_project_temp_files(project_id: str):
    """Cleans up temporary render directories and stale files for a project."""
    p = project_service.get_project(project_id)
    if not p:
        raise NotFoundException("Project", project_id)
    res = project_service.cleanup_temp_files(project_id)
    return {"message": "Cleanup complete", **res}

@router.post("/cleanup")
def cleanup_all_temp_files():
    """Cleans up temporary render directories across all projects."""
    res = project_service.cleanup_temp_files(None)
    return {"message": "Cleanup complete", **res}

