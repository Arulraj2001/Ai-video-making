from fastapi import APIRouter, HTTPException, Query, status, Body
from typing import Optional

from app.schemas.project import (
    SceneSchema,
    GenerateImageRequest,
    GenerateAllImagesResponse,
    ImageCapabilitiesResponse,
    ModelCatalogResponse,
    ModelCatalogItem,
    SceneVariationsResponse,
    SceneVariationItem,
    GraphicTemplateRequest,
)
from app.services.project_service import project_service
from app.services.scene_image_service import scene_image_service
from app.services.image_generation.factory import get_available_providers, get_model_catalog
from app.configuration.config import settings

router = APIRouter(tags=["images"])

@router.get("/images/models", response_model=ModelCatalogResponse)
def get_available_models():
    """
    Returns the full catalog of supported AI image models across providers,
    including readiness status, quality scores, and supported art styles.
    """
    try:
        catalog_raw = get_model_catalog()
        models = [ModelCatalogItem(**item) for item in catalog_raw]
        current_provider = settings.IMAGE_GENERATOR_PROVIDER or "pollinations"
        return ModelCatalogResponse(
            current_provider=current_provider,
            models=models
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch model catalog: {str(e)}"
        )

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
    style_mode = request.style_mode if request else None
    provider = request.provider if request else None
    model_id = request.model_id if request else None

    try:
        updated_scene = await scene_image_service.generate_scene_image(
            project=project,
            scene_id=scene_id,
            force=force,
            prompt_override=prompt_override,
            style_mode=style_mode,
            provider_name=provider,
            model_name=model_id,
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

@router.post("/projects/{project_id}/scenes/{scene_id}/variations", response_model=SceneVariationsResponse)
async def generate_scene_variations(
    project_id: str,
    scene_id: str,
    request: Optional[GenerateImageRequest] = None
):
    """
    Generates 3 candidate image variations for A/B testing and picking the best visual.
    """
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found"
        )

    style_mode = request.style_mode if request else None
    provider = request.provider if request else None
    model_id = request.model_id if request else None

    try:
        vars_raw = await scene_image_service.generate_scene_variations(
            project=project,
            scene_id=scene_id,
            count=3,
            style_mode=style_mode,
            provider_name=provider,
            model_name=model_id
        )
        return SceneVariationsResponse(
            project_id=project_id,
            scene_id=scene_id,
            variations=[SceneVariationItem(**v) for v in vars_raw]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate variations: {str(e)}"
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
    style_mode = request.style_mode if request else None
    provider = request.provider if request else None
    model_id = request.model_id if request else None

    try:
        active_gen = None
        if provider or model_id or style_mode:
            from app.services.image_generation.factory import get_image_generator
            active_gen = get_image_generator(
                provider_name=provider,
                model_name=model_id,
                style_mode=style_mode
            )

        updated_scenes = await scene_image_service.generate_all_scene_images(
            project=project,
            force=force,
            style_mode=style_mode,
            generator=active_gen,
        )

        completed_count = sum(1 for s in updated_scenes if s.image_status == "completed")
        failed_count = sum(1 for s in updated_scenes if s.image_status == "failed")
        caps = scene_image_service.get_capabilities(provider_name=provider)

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

@router.post("/projects/{project_id}/scenes/{scene_id}/graphic-template", response_model=SceneSchema)
def apply_graphic_template(
    project_id: str,
    scene_id: str,
    body: GraphicTemplateRequest = Body(...)
):
    """
    Renders a high-resolution graphic card template (title card, quote, stats, step card, split)
    and applies it as the scene visual asset immediately without calling external AI APIs.
    """
    import time
    from datetime import datetime, timezone
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    target_scene = next((s for s in project.scenes if s.id == scene_id), None)
    if not target_scene:
        raise HTTPException(status_code=404, detail=f"Scene '{scene_id}' not found")

    from app.services.graphic_template_service import graphic_template_service
    headline = body.headline or target_scene.caption or "Scene Title"
    subtext = body.subtext
    accent = body.accent_color or "#6366f1"

    img_bytes = graphic_template_service.render_template(
        template_type=body.template_type,
        headline=headline,
        subtext=subtext,
        accent_color=accent,
        step_number=body.step_number,
        stat_number=body.stat_number,
        width=1920,
        height=1080
    )

    filename = f"{scene_id}_graphic_{int(time.time())}.png"
    storage_path, image_url = project_service.save_scene_image_asset(
        project_id=project_id,
        scene_id=scene_id,
        image_bytes=img_bytes,
        filename=filename
    )

    target_scene.image_url = image_url
    target_scene.image_path = storage_path
    target_scene.image_status = "completed"
    target_scene.image_error = None
    target_scene.image_metadata = {
        "source": "graphic_template",
        "template_type": body.template_type,
        "accent_color": accent,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
    project.updated_at = datetime.now(timezone.utc).isoformat()
    project_service._save_to_disk(project)
    return SceneSchema.model_validate(target_scene)

