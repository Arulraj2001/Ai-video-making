import os
import time
import hashlib
import inspect
from pathlib import Path
from typing import List, Optional, Tuple
from datetime import datetime, timezone

from fastapi import HTTPException
from app.configuration.config import settings
from app.models.project import ProjectModel
from app.models.scene import SceneModel
from app.services.project_service import project_service, STORAGE_DIR
from app.services.visual_style_engine import build_scene_prompt, resolve_scene_context
from app.services.usage import get_usage_service, UsageLimitExceededError
from app.services.image_generation.base import (
    BaseImageGenerator,
    ImageGenerationOptions,
    ImageReference,
    ProviderCapabilities,
)
from app.services.image_generation.factory import get_image_generator, get_available_providers

def _derive_scene_seed(project_id: str, scene_id: str, scene_text: str, iteration: int = 0) -> int:
    """
    Derives a deterministic, scene-specific integer seed from project ID, scene ID,
    normalized scene meaning, and optional regeneration iteration count.
    Ensures distinct scenes and regenerations naturally vary in pose and framing.
    """
    raw = f"{project_id}:{scene_id}:{scene_text.strip().lower()}:{iteration}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % 999983


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

    def _validate_aspect_ratio(self, aspect_ratio: str, capabilities: ProviderCapabilities) -> None:
        if capabilities.supports_aspect_ratio and aspect_ratio not in capabilities.supported_aspect_ratios:
            raise ValueError(
                f"Model '{capabilities.model_name}' does not support project aspect ratio '{aspect_ratio}'. "
                f"Supported ratios: {', '.join(capabilities.supported_aspect_ratios)}"
            )

    def get_capabilities(
        self,
        provider_name: Optional[str] = None,
        model_name: Optional[str] = None,
        style_mode: Optional[str] = None,
    ) -> ProviderCapabilities:
        generator = get_image_generator(
            provider_name=provider_name,
            model_name=model_name,
            style_mode=style_mode,
        )
        return generator.capabilities

    def _previous_scene(self, project: ProjectModel, scene_id: str) -> Optional[SceneModel]:
        index = next((index for index, scene in enumerate(project.scenes) if scene.id == scene_id), None)
        return project.scenes[index - 1] if index and index > 0 else None

    def _optional_generation_kwargs(
        self,
        generator: BaseImageGenerator,
        style_mode: Optional[str],
        seed: Optional[int],
    ) -> dict:
        parameters = inspect.signature(generator.generate_image).parameters
        kwargs = {}
        if "style_mode" in parameters and style_mode:
            kwargs["style_mode"] = style_mode
        if "seed" in parameters and seed is not None and generator.capabilities.supports_seed:
            kwargs["seed"] = seed
        return kwargs

    async def _generate_with_context(
        self,
        generator: BaseImageGenerator,
        prompt: str,
        references: List[ImageReference],
        options: ImageGenerationOptions,
        style_mode: Optional[str],
        seed: Optional[int],
    ):
        if references and generator.capabilities.supports_reference_images:
            method = generator.generate_image_with_references
            kwargs = self._optional_generation_kwargs(generator, style_mode, seed)
            return await method(prompt=prompt, references=references, options=options, **kwargs)
        if references and generator.capabilities.supports_reference_descriptions:
            method = generator.generate_image_with_references
            kwargs = self._optional_generation_kwargs(generator, style_mode, seed)
            return await method(prompt=prompt, references=references, options=options, **kwargs)
        return await generator.generate_image(
            prompt=prompt,
            options=options,
            **self._optional_generation_kwargs(generator, style_mode, seed),
        )

    def _derive_character_seed(self, character_name: str) -> int:
        """
        Derives a stable integer seed from a character name (kept for backwards compatibility).
        """
        digest = hashlib.md5(character_name.lower().strip().encode()).hexdigest()
        return int(digest[:8], 16) % 999983  # prime modulo for better distribution

    def _derive_scene_seed(self, project_id: str, scene_id: str, scene_text: str, iteration: int = 0) -> int:
        """
        Derives a deterministic, scene-specific integer seed from project ID, scene ID,
        normalized scene meaning, and optional regeneration iteration count.
        """
        return _derive_scene_seed(project_id, scene_id, scene_text, iteration=iteration)

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
        provider_name: Optional[str] = None,
        model_name: Optional[str] = None,
        generator: Optional[BaseImageGenerator] = None,
        user_id: Optional[str] = None,
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

        effective_uid = user_id or project.owner_id or getattr(settings, "DEFAULT_LEGACY_UID", "legacy-local-user")
        active_generator = generator or get_image_generator(
            provider_name=provider_name,
            model_name=model_name,
            style_mode=style_mode,
            user_id=effective_uid,
        )
        capabilities = active_generator.capabilities

        request_started_at = time.time()
        usage_svc = get_usage_service()

        # 1. Server-side usage quota reservation (Atomic check & pre-reserve)
        async with usage_svc.reserve(uid=effective_uid, provider=capabilities.provider_name):
            # 2. Update status to 'generating'
            project_service.update_scene_image_state(
                project_id=project.id,
                scene_id=scene_id,
                status="generating",
                error=None
            )

            try:
                # 3. Resolve canonical style, relevant entities, and continuity context.
                context = resolve_scene_context(
                    project=project,
                    scene=target_scene,
                    style_id=style_mode,
                    custom_instructions=prompt_override,
                    previous_scene=self._previous_scene(project, scene_id),
                )
                source_prompt = prompt_override or target_scene.image_prompt or target_scene.caption or "Cinematic scene"
                effective_prompt = build_scene_prompt(context, source_prompt)

                # 4. Determine aspect ratio and dimensions
                aspect_ratio = project.canvas_settings.aspect_ratio or settings.DEFAULT_ASPECT_RATIO or "16:9"
                self._validate_aspect_ratio(aspect_ratio, capabilities)
                width, height = self.get_dimensions_for_aspect_ratio(aspect_ratio)

                options = ImageGenerationOptions(
                    aspect_ratio=aspect_ratio,
                    width=width,
                    height=height,
                    negative_prompt="text, watermark, logo, bad quality, blurry, artifact"
                )

                # 5. Resolve references from the same canonical scene context.
                references = context["references"]

                # 5b. Derive deterministic scene-level seed (with regeneration variation)
                regeneration_count = 0
                if target_scene.image_metadata and isinstance(target_scene.image_metadata, dict):
                    regeneration_count = target_scene.image_metadata.get("regeneration_count", 0)
                if force:
                    regeneration_count += 1

                seed = self._derive_scene_seed(
                    project_id=project.id,
                    scene_id=scene_id,
                    scene_text=target_scene.caption or target_scene.visual_description or scene_id,
                    iteration=regeneration_count,
                )
                if capabilities.supports_seed:
                    options.seed = seed

                # 6. Call the provider through the capability-aware context path
                result = await self._generate_with_context(
                    generator=active_generator,
                    prompt=effective_prompt,
                    references=references,
                    options=options,
                    style_mode=style_mode,
                    seed=seed,
                )

                # 7. Save image bytes to project storage
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
                metadata = dict(metadata)
                metadata["filename"] = filename
                metadata["file_size"] = len(result.image_bytes)
                metadata["aspect_ratio"] = aspect_ratio
                metadata["width"] = width
                metadata["height"] = height
                metadata["generated_at"] = datetime.now(timezone.utc).isoformat()
                metadata["style_id"] = context["style_id"]
                metadata["style_label"] = context["style"].label
                metadata["reference_entities"] = [entity["id"] for entity in context["entities"]]
                metadata["references_used"] = [reference.entity_name for reference in references]
                metadata["reference_mode"] = "image" if references and capabilities.supports_reference_images else ("text" if references else "none")
                metadata["continuity_scene_id"] = context.get("previous_scene_id")
                metadata["prompt_hash"] = hashlib.sha256(effective_prompt.encode("utf-8")).hexdigest()[:16]
                metadata["raw_caption"] = target_scene.caption
                metadata["resolved_scene_meaning"] = context.get("visual_description") or target_scene.caption
                metadata["final_prompt"] = effective_prompt
                metadata["regeneration_count"] = regeneration_count
                metadata["gen_started_at"] = request_started_at
                metadata["gen_completed_at"] = time.time()
                if seed is not None:
                    metadata["seed"] = seed

                # 8. Update scene to 'completed'
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

            except (UsageLimitExceededError, HTTPException):
                raise
            except Exception as e:
                from app.utils.security import sanitize_secrets
                err_msg = sanitize_secrets(str(e)) or "Unknown image generation failure"
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
        generator: Optional[BaseImageGenerator] = None,
        user_id: Optional[str] = None,
    ) -> List[SceneModel]:
        """
        Batch generates images for all scenes in a project.
        Fault-Tolerant: If one scene fails, the remaining scenes continue processing.
        """
        effective_uid = user_id or project.owner_id or getattr(settings, "DEFAULT_LEGACY_UID", "legacy-local-user")
        active_generator = generator or get_image_generator(style_mode=style_mode, user_id=effective_uid)
        results: List[SceneModel] = []

        for scene in project.scenes:
            try:
                updated = await self.generate_scene_image(
                    project=project,
                    scene_id=scene.id,
                    force=force,
                    style_mode=style_mode,
                    generator=active_generator,
                    user_id=effective_uid,
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
        generator: Optional[BaseImageGenerator] = None,
        style_mode: Optional[str] = None,
        provider_name: Optional[str] = None,
        model_name: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> List[SceneModel]:
        """
        Retries generation only for scenes that previously failed or are missing images,
        strictly preserving all already-successful scene images.
        """
        effective_uid = user_id or project.owner_id or getattr(settings, "DEFAULT_LEGACY_UID", "legacy-local-user")
        active_generator = generator or get_image_generator(
            provider_name=provider_name,
            model_name=model_name,
            style_mode=style_mode,
            user_id=effective_uid,
        )
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
                    style_mode=style_mode,
                    provider_name=provider_name,
                    model_name=model_name,
                    generator=active_generator,
                    user_id=effective_uid,
                )
                results.append(updated)
            except Exception:
                refreshed_scene = next((s for s in project.scenes if s.id == scene.id), scene)
                results.append(refreshed_scene)

        return results

    async def generate_scene_variations(
        self,
        project: ProjectModel,
        scene_id: str,
        count: int = 3,
        style_mode: Optional[str] = None,
        provider_name: Optional[str] = None,
        model_name: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> List[dict]:
        """
        Generates N candidate image variations with varying seeds for creator A/B selection.
        Returns a list of {id, image_url, prompt, seed}.
        """
        import random
        target_scene = next((s for s in project.scenes if s.id == scene_id), None)
        if not target_scene:
            raise ValueError(f"Scene '{scene_id}' not found in project '{project.id}'")

        effective_uid = user_id or project.owner_id or getattr(settings, "DEFAULT_LEGACY_UID", "legacy-local-user")
        active_generator = get_image_generator(
            provider_name=provider_name,
            model_name=model_name,
            style_mode=style_mode,
            user_id=effective_uid,
        )

        context = resolve_scene_context(
            project=project,
            scene=target_scene,
            style_id=style_mode,
            previous_scene=self._previous_scene(project, scene_id),
        )
        effective_prompt = build_scene_prompt(
            context,
            target_scene.image_prompt or target_scene.caption or "Cinematic scene",
        )
        references = context["references"]
        aspect_ratio = project.canvas_settings.aspect_ratio or settings.DEFAULT_ASPECT_RATIO or "16:9"
        self._validate_aspect_ratio(aspect_ratio, active_generator.capabilities)
        width, height = self.get_dimensions_for_aspect_ratio(aspect_ratio)

        options = ImageGenerationOptions(
            aspect_ratio=aspect_ratio,
            width=width,
            height=height,
            negative_prompt="text, watermark, logo, bad quality, blurry, artifact"
        )

        variation_directives = [
            ("A", "Medium framing focusing on the primary subject and key action at eye level while preserving identity and style"),
            ("B", "Dynamic wide establishing framing showing the complete subject within the environment while preserving identity and style"),
            ("C", "Expressive close-up detail framing highlighting the subject's expression, hands, and focal objects while preserving identity and style"),
        ]

        variations = []
        scene_text = target_scene.caption or target_scene.visual_description or scene_id

        usage_svc = get_usage_service()
        async with usage_svc.reserve(uid=effective_uid, provider=active_generator.capabilities.provider_name):
            for i in range(min(count, len(variation_directives))):
                var_label, framing_directive = variation_directives[i]
                var_seed = self._derive_scene_seed(project.id, scene_id, scene_text, iteration=i + 1)
                var_prompt = f"{effective_prompt} Composition: {framing_directive}."

                gen_result = await self._generate_with_context(
                    generator=active_generator,
                    prompt=var_prompt,
                    references=references,
                    options=options,
                    style_mode=style_mode,
                    seed=var_seed,
                )
                img_bytes = gen_result.image_bytes

                # Save variation
                timestamp = int(time.time() * 1000)
                extension = "png" if "png" in gen_result.content_type else "jpg"
                filename = f"{scene_id}_var_{var_label}_{timestamp}.{extension}"
                storage_path, image_url = project_service.save_scene_image_asset(
                    project_id=project.id,
                    scene_id=scene_id,
                    image_bytes=img_bytes,
                    filename=filename
                )

                variation_metadata = dict(gen_result.metadata or {})
                variation_metadata.update({
                    "variation_label": f"Variation {var_label}",
                    "framing": framing_directive,
                    "style_id": context["style_id"],
                    "aspect_ratio": aspect_ratio,
                    "width": width,
                    "height": height,
                    "seed": var_seed,
                    "reference_entities": [entity["id"] for entity in context["entities"]],
                    "reference_mode": "image" if references and active_generator.capabilities.supports_reference_images else ("text" if references else "none"),
                })
                variations.append({
                    "id": f"var-{var_label}",
                    "image_url": image_url,
                    "prompt": var_prompt,
                    "seed": var_seed,
                    "metadata": variation_metadata,
                })

        return variations

scene_image_service = SceneImageService()

