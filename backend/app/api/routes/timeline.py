from fastapi import APIRouter, HTTPException, UploadFile, File, Query, status
from typing import List, Optional
from datetime import datetime, timezone

from app.schemas.project import (
    SceneSchema,
    SceneUpdate,
    SplitSceneRequest,
    ReorderScenesRequest,
    ProjectResponse,
    TimelineUpdateResponse,
)
from app.models.scene import SceneModel
from app.services.project_service import project_service
from app.api.routes.projects import _to_project_response

router = APIRouter(prefix="/projects/{project_id}/timeline", tags=["timeline"])

@router.put("/scenes/{scene_id}", response_model=ProjectResponse)
def update_timeline_scene(
    project_id: str,
    scene_id: str,
    update: SceneUpdate,
    ripple: bool = Query(default=True, description="Whether to ripple time changes to subsequent scenes")
):
    """
    Updates scene timeline properties (start, end, duration, motion, transition, framing).
    Enforces Master Timeline Rule: downstream scenes automatically ripple if scene length changes.
    """
    try:
        project = project_service.update_scene_timeline(
            project_id=project_id,
            scene_id=scene_id,
            update=update,
            ripple=ripple
        )
        return _to_project_response(project)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/scenes/{scene_id}/split", response_model=ProjectResponse)
def split_timeline_scene(
    project_id: str,
    scene_id: str,
    request: SplitSceneRequest
):
    """
    Splits an existing scene at a specific split timestamp into two contiguous scenes.
    """
    try:
        project = project_service.split_scene(
            project_id=project_id,
            scene_id=scene_id,
            split_time=request.split_time
        )
        return _to_project_response(project)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/scenes/{scene_id}/duplicate", response_model=ProjectResponse)
def duplicate_timeline_scene(
    project_id: str,
    scene_id: str
):
    """
    Duplicates a scene directly after it, shifting downstream scenes to maintain contiguous alignment.
    """
    try:
        project = project_service.duplicate_scene(
            project_id=project_id,
            scene_id=scene_id
        )
        return _to_project_response(project)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/scenes/{scene_id}", response_model=ProjectResponse)
def delete_timeline_scene(
    project_id: str,
    scene_id: str,
    ripple: bool = Query(default=True, description="Whether to shift subsequent scenes back")
):
    """
    Deletes a scene and shifts downstream scenes to maintain a contiguous timeline.
    """
    try:
        project = project_service.delete_scene(
            project_id=project_id,
            scene_id=scene_id,
            ripple=ripple
        )
        return _to_project_response(project)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/reorder", response_model=ProjectResponse)
def reorder_timeline_scenes(
    project_id: str,
    request: ReorderScenesRequest
):
    """
    Reorders scenes according to the specified scene ID list, recalculating contiguous timestamps.
    """
    try:
        project = project_service.reorder_scenes(
            project_id=project_id,
            scene_ids=request.scene_ids
        )
        return _to_project_response(project)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/scenes/{scene_id}/upload-image", response_model=SceneSchema)
async def upload_timeline_replacement_image(
    project_id: str,
    scene_id: str,
    file: UploadFile = File(...)
):
    """
    Uploads a user replacement image for a specific timeline scene.
    Immediately updates scene image_url and completes status.
    """
    try:
        file_bytes = await file.read()
        scene = project_service.upload_replacement_image(
            project_id=project_id,
            scene_id=scene_id,
            file_bytes=file_bytes,
            filename=file.filename or "replacement.png"
        )
        return SceneSchema.model_validate(scene)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/restore", response_model=ProjectResponse)
def restore_timeline_scenes(
    project_id: str,
    scenes: List[SceneSchema]
):
    """
    Restores an exact list of scenes (e.g. for Undo/Redo operations), preserving project settings.
    """
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project '{project_id}' not found")
    scene_models = [SceneModel(**s.model_dump()) for s in scenes]
    project.scenes = scene_models
    project.updated_at = datetime.now(timezone.utc).isoformat()
    project_service._save_to_disk(project)
    return _to_project_response(project)
