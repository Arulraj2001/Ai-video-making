import logging
from fastapi import APIRouter, HTTPException, Path
from app.schemas.project import (
    SceneSchema,
    SceneUpdate,
    RegenerateSceneRequest,
    StoryboardGenerateResponse,
    ClusterScenesRequest,
    ClusterScenesResponse,
    MergeScenesRequest,
)
from app.services.project_service import project_service
from app.services.storyboard_service import storyboard_service
from app.services.llm.factory import get_llm_provider
from app.utils.errors import NotFoundError, ValidationError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects/{project_id}/storyboard", tags=["Storyboard"])

@router.post("/generate", response_model=StoryboardGenerateResponse)
async def generate_storyboard_endpoint(
    project_id: str = Path(..., description="Project ID")
):
    """
    Generate visual storyboard for all scenes in the project.
    Synthesizes visual descriptions, image prompts, suggested motions, and transitions
    guided by the Video Bible visual context and prompt rules.
    """
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    if not project.scenes:
        raise HTTPException(
            status_code=400,
            detail="Cannot generate storyboard: Project has no parsed scenes. Please import captions first."
        )

    try:
        provider = get_llm_provider()
        scenes = await storyboard_service.generate_storyboard(project, llm_provider=provider)
        return StoryboardGenerateResponse(
            project_id=project_id,
            scenes=[
                SceneSchema(
                    id=s.id,
                    start=s.start,
                    end=s.end,
                    duration=s.duration,
                    caption=s.caption,
                    visual_description=s.visual_description,
                    image_prompt=s.image_prompt,
                    suggested_motion=s.suggested_motion,
                    suggested_transition=s.suggested_transition,
                )
                for s in scenes
            ],
            total_scenes=len(scenes),
            llm_provider=provider.provider_name,
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating storyboard for project {project_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Storyboard generation failed: {str(e)}")

@router.post("/scenes/{scene_id}/regenerate", response_model=SceneSchema)
async def regenerate_scene_endpoint(
    project_id: str = Path(..., description="Project ID"),
    scene_id: str = Path(..., description="Scene ID to regenerate"),
    request: RegenerateSceneRequest = RegenerateSceneRequest(),
):
    """
    Regenerate storyboard prompt and metadata for a single scene with optional custom instructions.
    """
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    try:
        updated_scene = await storyboard_service.regenerate_scene_prompt(
            project=project,
            scene_id=scene_id,
            instructions=request.instructions
        )
        return SceneSchema(
            id=updated_scene.id,
            start=updated_scene.start,
            end=updated_scene.end,
            duration=updated_scene.duration,
            caption=updated_scene.caption,
            visual_description=updated_scene.visual_description,
            image_prompt=updated_scene.image_prompt,
            suggested_motion=updated_scene.suggested_motion,
            suggested_transition=updated_scene.suggested_transition,
        )
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error regenerating scene {scene_id} in project {project_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scene regeneration failed: {str(e)}")

@router.put("/scenes/{scene_id}", response_model=SceneSchema)
async def update_scene_storyboard_endpoint(
    project_id: str = Path(..., description="Project ID"),
    scene_id: str = Path(..., description="Scene ID to update"),
    update: SceneUpdate = ...,
):
    """
    Manually edit and update a scene's image prompt, visual description, motion, transition, or timestamps.
    """
    try:
        updated = project_service.update_scene(project_id, scene_id, update)
        return SceneSchema(
            id=updated.id,
            start=updated.start,
            end=updated.end,
            duration=updated.duration,
            caption=updated.caption,
            visual_description=updated.visual_description,
            image_prompt=updated.image_prompt,
            suggested_motion=updated.suggested_motion,
            suggested_transition=updated.suggested_transition,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating scene {scene_id} in project {project_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scene update failed: {str(e)}")

@router.post("/cluster", response_model=ClusterScenesResponse)
async def cluster_scenes_endpoint(
    project_id: str = Path(..., description="Project ID"),
    request: ClusterScenesRequest = ClusterScenesRequest()
):
    """
    Groups rapid captions into coherent 10-25 second visual scenes to give the output a true video feel.
    """
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    original_count = len(project.scenes)
    try:
        updated_project = await project_service.cluster_scenes(
            project_id=project_id,
            mode=request.mode,
            target_duration=request.target_duration,
            captions_per_scene=request.captions_per_scene
        )
        return ClusterScenesResponse(
            project_id=project_id,
            original_scene_count=original_count,
            new_scene_count=len(updated_project.scenes),
            scenes=[SceneSchema.model_validate(s) for s in updated_project.scenes]
        )
    except Exception as e:
        logger.error(f"Error clustering scenes for project {project_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scene clustering failed: {str(e)}")

@router.post("/merge", response_model=ClusterScenesResponse)
def merge_scenes_endpoint(
    project_id: str = Path(..., description="Project ID"),
    request: MergeScenesRequest = ...
):
    """
    Merges selected scenes into a single composite scene with continuous duration.
    """
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    original_count = len(project.scenes)
    try:
        updated_project = project_service.merge_scenes(
            project_id=project_id,
            scene_ids=request.scene_ids
        )
        return ClusterScenesResponse(
            project_id=project_id,
            original_scene_count=original_count,
            new_scene_count=len(updated_project.scenes),
            scenes=[SceneSchema.model_validate(s) for s in updated_project.scenes]
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error merging scenes in project {project_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scene merge failed: {str(e)}")

