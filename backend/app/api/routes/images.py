from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional

from app.schemas.project import (
    SceneSchema,
    GenerateImageRequest,
    GenerateAllImagesResponse,
    ImageCapabilitiesResponse,
)
from app.services.project_service import project_service
from app.services.scene_image_service import scene_image_service
from app.services.image_generation.factory import get_available_providers

router = APIRouter(tags=["images"])

@router.get("/images/capabilities", response_model=ImageCapabilitiesResponse)
def get_image_capabilities(provider: Optional[str] = Query(None, description="Optional provider override")):
    """
    Returns image generator capabilities (aspect ratios, reference support, models).
    Guaranteed NEVER to expose API keys or credentials.
    """
    try:
        caps = scene_image_service.get_capabilities(provider_name=provider)
        return ImageCapabilitiesResponse(
            provider=caps.provider_name,
            model=caps.model_name,
            supports_reference_images=caps.supports_reference_images,
            supports_negative_prompt=caps.supports_negative_prompt,
            supported_aspect_ratios=caps.supported_aspect_ratios,
            notes=caps.notes,
            available_providers=get_available_providers()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to query image generator capabilities: {str(e)}"
        )

@router.post("/projects/{project_id}/scenes/{scene_id}/generate-image", response_model=SceneSchema)
async def generate_scene_image(
    project_id: str,
    scene_id: str,
    request: Optional[GenerateImageRequest] = None
):
    """
    Generates or regenerates an AI visual for a single storyboard scene.
    Respects prompt, Video Bible context, and aspect ratio.
    """
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found"
        )

    force = request.force if request else False
    prompt_override = request.prompt_override if request else None

    try:
        updated_scene = await scene_image_service.generate_scene_image(
            project=project,
            scene_id=scene_id,
            force=force,
            prompt_override=prompt_override
        )
        return SceneSchema.model_validate(updated_scene)
    except Exception as e:
        # Check if scene was updated with failure state
        failed_scene = next((s for s in project.scenes if s.id == scene_id), None)
        if failed_scene and failed_scene.image_status == "failed":
            return SceneSchema.model_validate(failed_scene)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/projects/{project_id}/scenes/generate-all-images", response_model=GenerateAllImagesResponse)
async def generate_all_scene_images(
    project_id: str,
    request: Optional[GenerateImageRequest] = None
):
    """
    Batch generates images for all scenes in a project.
    Fault-tolerant: If one scene fails, the remaining scenes continue processing.
    """
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found"
        )

    force = request.force if request else False

    try:
        updated_scenes = await scene_image_service.generate_all_scene_images(
            project=project,
            force=force
        )

        completed_count = sum(1 for s in updated_scenes if s.image_status == "completed")
        failed_count = sum(1 for s in updated_scenes if s.image_status == "failed")
        caps = scene_image_service.get_capabilities()

        return GenerateAllImagesResponse(
            project_id=project_id,
            scenes=[SceneSchema.model_validate(s) for s in updated_scenes],
            total_scenes=len(updated_scenes),
            completed_count=completed_count,
            failed_count=failed_count,
            provider=caps.provider_name
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed during batch image generation: {str(e)}"
        )

@router.post("/projects/{project_id}/scenes/retry-failed", response_model=GenerateAllImagesResponse)
async def retry_failed_scene_images(project_id: str):
    """
    Retries generation only for scenes that previously failed or are missing images,
    strictly preserving all already-successful scene images.
    """
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found"
        )

    try:
        updated_scenes = await scene_image_service.retry_failed_scene_images(project=project)
        completed_count = sum(1 for s in updated_scenes if s.image_status == "completed")
        failed_count = sum(1 for s in updated_scenes if s.image_status == "failed")
        caps = scene_image_service.get_capabilities()

        return GenerateAllImagesResponse(
            project_id=project_id,
            scenes=[SceneSchema.model_validate(s) for s in updated_scenes],
            total_scenes=len(updated_scenes),
            completed_count=completed_count,
            failed_count=failed_count,
            provider=caps.provider_name
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed during retry of failed images: {str(e)}"
        )
