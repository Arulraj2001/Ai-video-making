import os
import time
import hashlib
from pathlib import Path
from typing import List, Optional, Tuple
from datetime import datetime, timezone

from app.configuration.config import settings
from app.models.project import ProjectModel
from app.models.scene import SceneModel
from app.services.project_service import project_service, STORAGE_DIR
from app.services.visual_context import build_visual_context
from app.services.image_generation.base import (
    BaseImageGenerator,
    ImageGenerationOptions,
    ImageReference,
    ProviderCapabilities,
)
from app.services.image_generation.factory import get_image_generator, get_available_providers

class SceneImageService:
    """
    Orchestrates AI image generation for storyboard scenes.
    Coordinates Video Bible consistency references, aspect ratio handling,
    storage persistence, and fault-tolerant batch generation.
    """

    def get_dimensions_for_aspect_ratio(self, aspect_ratio: str) -> Tuple[int, int]:
        ar = aspect_ratio.strip().lower()
        if ar in ("9:16", "9/16", "vertical", "portrait"):
            return (576, 1024)
        elif ar in ("1:1", "square"):
            return (1024, 1024)
        elif ar in ("4:3", "4/3"):
            return (1024, 768)
        elif ar in ("21:9", "cinemascope"):
            return (1280, 548)
        # Default 16:9 widescreen
        return (1024, 576)

    def get_capabilities(self, provider_name: Optional[str] = None) -> ProviderCapabilities:
        generator = get_image_generator(provider_name)
        return generator.capabilities

    def _derive_character_seed(self, character_name: str) -> int:
        """
        Derives a stable integer seed from a character name.
        Same name always produces the same seed, giving facial/style consistency
        across scenes when using Pollinations' ?seed= parameter.
        """
        digest = hashlib.md5(character_name.lower().strip().encode()).hexdigest()
        return int(digest[:8], 16) % 999983  # prime modulo for better distribution

    def _resolve_scene_references(self, project: ProjectModel, prompt: str, caption: str) -> List[ImageReference]:
        """
        Extracts relevant character, location, and object reference images from Video Bible
        matching keywords in the scene prompt or caption.
        """
        references: List[ImageReference] = []
        combined_text = f"{prompt} {caption}".lower()
        vb = project.video_bible

        # Check characters
        for char in vb.characters:
            if char.name.lower() in combined_text or (char.id and char.id.lower() in combined_text):
                ref_path = None
                ref_url = None
                if char.reference_image:
                    ref_path = char.reference_image.storage_path
                    ref_url = char.reference_image.url
                references.append(
                    ImageReference(
                        entity_type="character",
                        entity_name=char.name,
                        image_path=ref_path,
                        image_url=ref_url,
                        description=f"{char.appearance or ''}. Clothing: {char.clothing or ''}".strip(". ")
                    )
                )

        # Check locations
        for loc in vb.locations:
            if loc.name.lower() in combined_text or (loc.id and loc.id.lower() in combined_text):
                ref_path = None
                ref_url = None
                if loc.reference_image:
                    ref_path = loc.reference_image.storage_path
                    ref_url = loc.reference_image.url
                references.append(
                    ImageReference(
                        entity_type="location",
                        entity_name=loc.name,
                        image_path=ref_path,
                        image_url=ref_url,
                        description=f"{loc.environment or ''}. Lighting: {loc.lighting or ''}".strip(". ")
                    )
                )

        # Check objects
        for obj in vb.objects:
            if obj.name.lower() in combined_text or (obj.id and obj.id.lower() in combined_text):
                ref_path = None
                ref_url = None
                if obj.reference_image:
                    ref_path = obj.reference_image.storage_path
                    ref_url = obj.reference_image.url
                references.append(
                    ImageReference(
                        entity_type="object",
                        entity_name=obj.name,
                        image_path=ref_path,
                        image_url=ref_url,
                        description=obj.description or ""
                    )
                )

        return references

    async def generate_scene_image(
        self,
        project: ProjectModel,
        scene_id: str,
        force: bool = False,
        prompt_override: Optional[str] = None,
        style_mode: Optional[str] = None,
        generator: Optional[BaseImageGenerator] = None
    ) -> SceneModel:
        """
        Generates or regenerates an image for a single scene.
        Updates scene image status, saves image asset to disk, and persists project.
        Supports style_mode for art style selection and character seed locking for consistency.
        """
        target_scene = next((s for s in project.scenes if s.id == scene_id), None)
        if not target_scene:
            raise ValueError(f"Scene '{scene_id}' not found in project '{project.id}'")

        if not force and target_scene.image_status == "completed" and target_scene.image_url:
            return target_scene

        active_generator = generator or get_image_generator(style_mode=style_mode)
        capabilities = active_generator.capabilities

        # 1. Update status to 'generating'
        project_service.update_scene_image_state(
            project_id=project.id,
            scene_id=scene_id,
            status="generating",
            error=None
        )

        try:
            # 2. Determine prompt
            effective_prompt = prompt_override or target_scene.image_prompt or target_scene.caption or "Cinematic scene"

            # 3. Determine aspect ratio and dimensions
            aspect_ratio = settings.DEFAULT_ASPECT_RATIO or "16:9"
            width, height = self.get_dimensions_for_aspect_ratio(aspect_ratio)

            options = ImageGenerationOptions(
                aspect_ratio=aspect_ratio,
                width=width,
                height=height,
                negative_prompt="text, watermark, logo, bad quality, blurry, artifact"
            )

            # 4. Resolve references from Video Bible
            references = self._resolve_scene_references(
                project=project,
                prompt=effective_prompt,
                caption=target_scene.caption
            )

            # 4b. Derive character seed for consistency (Pollinations seed locking)
            seed: Optional[int] = None
            if references:
                # Use the first matched character's seed for facial consistency
                char_refs = [r for r in references if r.entity_type == "character"]
                if char_refs:
                    seed = self._derive_character_seed(char_refs[0].entity_name)

            # 5. Call ImageGenerator adapter
            if references and capabilities.supports_reference_images:
                result = await active_generator.generate_image_with_references(
                    prompt=effective_prompt,
                    references=references,
                    options=options
                )
            else:
                # For Pollinations (no img2img), pass references as prompt enrichment via generate_image_with_references
                if references:
                    result = await active_generator.generate_image_with_references(
                        prompt=effective_prompt,
                        references=references,
                        options=options,
                        style_mode=style_mode,
                        seed=seed,
                    )
                else:
                    # Check if generator accepts style_mode / seed kwargs
                    import inspect
                    sig = inspect.signature(active_generator.generate_image)
                    extra_kwargs = {}
                    if "style_mode" in sig.parameters:
                        extra_kwargs["style_mode"] = style_mode
                    if "seed" in sig.parameters:
                        extra_kwargs["seed"] = seed
                    result = await active_generator.generate_image(
                        prompt=effective_prompt,
                        options=options,
                        **extra_kwargs
                    )

            # 6. Save image bytes to project storage
            images_dir = STORAGE_DIR / "projects" / project.id / "images"
            images_dir.mkdir(parents=True, exist_ok=True)

            timestamp = int(time.time() * 1000)
            ext = "png" if "png" in result.content_type else "jpg"
            filename = f"scene_{scene_id}_{timestamp}.{ext}"
            file_path = images_dir / filename

            with open(file_path, "wb") as f:
                f.write(result.image_bytes)

            relative_path = f"storage/projects/{project.id}/images/{filename}"
            public_url = f"/media/{project.id}/images/{filename}"

            metadata = result.metadata or {}
            metadata["filename"] = filename
            metadata["file_size"] = len(result.image_bytes)
            metadata["aspect_ratio"] = aspect_ratio
            metadata["width"] = width
            metadata["height"] = height
            metadata["generated_at"] = datetime.now(timezone.utc).isoformat()

            # 7. Update scene to 'completed'
            updated_scene = project_service.update_scene_image_state(
                project_id=project.id,
                scene_id=scene_id,
                status="completed",
                url=public_url,
                path=relative_path,
                error=None,
                metadata=metadata
            )
            return updated_scene

        except Exception as e:
            err_msg = str(e) or "Unknown image generation failure"
            updated_scene = project_service.update_scene_image_state(
                project_id=project.id,
                scene_id=scene_id,
                status="failed",
                error=err_msg
            )
            raise RuntimeError(f"Scene {scene_id} image generation failed: {err_msg}")

    async def generate_all_scene_images(
        self,
        project: ProjectModel,
        force: bool = False,
        style_mode: Optional[str] = None,
        generator: Optional[BaseImageGenerator] = None
    ) -> List[SceneModel]:
        """
        Batch generates images for all scenes in a project.
        Fault-Tolerant: If one scene fails, the remaining scenes continue processing.
        """
        active_generator = generator or get_image_generator(style_mode=style_mode)
        results: List[SceneModel] = []

        for scene in project.scenes:
            try:
                updated = await self.generate_scene_image(
                    project=project,
                    scene_id=scene.id,
                    force=force,
                    style_mode=style_mode,
                    generator=active_generator
                )
                results.append(updated)
            except Exception as e:
                # Scene has already been marked as 'failed' in generate_scene_image
                refreshed_scene = next((s for s in project.scenes if s.id == scene.id), scene)
                results.append(refreshed_scene)

        return results

    async def retry_failed_scene_images(
        self,
        project: ProjectModel,
        generator: Optional[BaseImageGenerator] = None
    ) -> List[SceneModel]:
        """
        Retries generation only for scenes that previously failed or are missing images,
        strictly preserving all already-successful scene images.
        """
        active_generator = generator or get_image_generator()
        results: List[SceneModel] = []

        for scene in project.scenes:
            # Strictly preserve already completed scenes with images
            if scene.image_status == "completed" and scene.image_url:
                results.append(scene)
                continue

            try:
                updated = await self.generate_scene_image(
                    project=project,
                    scene_id=scene.id,
                    force=True,
                    generator=active_generator
                )
                results.append(updated)
            except Exception:
                refreshed_scene = next((s for s in project.scenes if s.id == scene.id), scene)
                results.append(refreshed_scene)

        return results

scene_image_service = SceneImageService()
