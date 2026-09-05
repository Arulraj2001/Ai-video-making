import logging
from typing import List, Optional
from app.models.project import ProjectModel
from app.models.scene import SceneModel
from app.services.visual_context import build_visual_context
from app.services.visual_style_engine import resolve_scene_context
from app.services.llm.base import BaseLLMProvider
from app.services.llm.factory import get_llm_provider
from app.services.project_service import project_service
from app.configuration.config import settings
from app.utils.errors import NotFoundError, ValidationError

logger = logging.getLogger(__name__)

class StoryboardService:
    """
    Orchestrates turning parsed timestamped captions into a visual storyboard.
    Enforces Video Bible visual consistency and prompt synthesis rules across all scenes.
    """

    def _previous_scene(self, project: ProjectModel, scene_id: str) -> Optional[SceneModel]:
        index = next((index for index, scene in enumerate(project.scenes) if scene.id == scene_id), None)
        return project.scenes[index - 1] if index is not None and index > 0 else None

    async def generate_storyboard(
        self,
        project: ProjectModel,
        llm_provider: Optional[BaseLLMProvider] = None,
        aspect_ratio: Optional[str] = None
    ) -> List[SceneModel]:
        """
        Generate visual description, image prompt, motion, and transition for every scene in the project.
        """
        if not project.scenes:
            raise ValidationError("Cannot generate storyboard: Project has no parsed scenes.")

        provider = llm_provider or get_llm_provider()
        ratio = aspect_ratio or project.canvas_settings.aspect_ratio or settings.DEFAULT_ASPECT_RATIO

        # 1. Build normalized visual context from project Video Bible
        visual_context = build_visual_context(
            project.video_bible,
            aspect_ratio=ratio,
        )

        # 2. Prepare scene input payload for LLM
        scenes_input = []
        for index, scene in enumerate(project.scenes):
            scene_context = resolve_scene_context(
                project=project,
                scene=scene,
                previous_scene=project.scenes[index - 1] if index > 0 else None,
            )
            scenes_input.append({
                "id": scene.id,
                "start": scene.start,
                "end": scene.end,
                "duration": scene.duration,
                "caption": scene.caption,
                "scene_visual_context": {
                    "style_id": scene_context["style_id"],
                    "entities": scene_context["entities"],
                    "composition": scene_context["composition"],
                    "continuity_context": scene_context["continuity_context"],
                },
            })

        logger.info(
            f"Generating storyboard for project '{project.id}' ({len(project.scenes)} scenes) "
            f"using provider '{provider.provider_name}'."
        )

        # 3. Call LLM provider
        generated_scenes_meta = await provider.generate_storyboard_scenes(
            scenes=scenes_input,
            visual_context=visual_context,
            aspect_ratio=ratio
        )

        # 4. Map generated metadata back to project scenes
        meta_by_id = {item["id"]: item for item in generated_scenes_meta if "id" in item}

        for idx, scene in enumerate(project.scenes):
            # Lookup by ID first, fallback to positional index
            meta = meta_by_id.get(scene.id)
            if not meta and idx < len(generated_scenes_meta):
                meta = generated_scenes_meta[idx]

            if meta:
                scene.visual_description = meta.get("visual_description", scene.visual_description)
                scene.image_prompt = meta.get("image_prompt", scene.image_prompt)
                scene.suggested_motion = meta.get("suggested_motion", scene.suggested_motion)
                scene.suggested_transition = meta.get("suggested_transition", scene.suggested_transition)

        # 5. Persist updated project with storyboard data to disk
        project_service._save_to_disk(project)
        return project.scenes

    async def regenerate_scene_prompt(
        self,
        project: ProjectModel,
        scene_id: str,
        instructions: Optional[str] = None,
        llm_provider: Optional[BaseLLMProvider] = None,
        aspect_ratio: Optional[str] = None
    ) -> SceneModel:
        """
        Regenerate storyboard prompt and metadata for an individual scene with optional custom instructions.
        """
        target_scene = next((s for s in project.scenes if s.id == scene_id), None)
        if not target_scene:
            raise NotFoundError(f"Scene with ID '{scene_id}' not found in project '{project.id}'.")

        provider = llm_provider or get_llm_provider()
        ratio = aspect_ratio or project.canvas_settings.aspect_ratio or settings.DEFAULT_ASPECT_RATIO
        visual_context = build_visual_context(
            project.video_bible,
            aspect_ratio=ratio,
        )

        scene_context = resolve_scene_context(
            project=project,
            scene=target_scene,
            custom_instructions=instructions,
            previous_scene=self._previous_scene(project, scene_id),
        )
        scene_input = {
            "id": target_scene.id,
            "start": target_scene.start,
            "end": target_scene.end,
            "duration": target_scene.duration,
            "caption": target_scene.caption,
            "current_image_prompt": target_scene.image_prompt,
            "current_visual_description": target_scene.visual_description,
            "scene_visual_context": {
                "style_id": scene_context["style_id"],
                "entities": scene_context["entities"],
                "composition": scene_context["composition"],
                "continuity_context": scene_context["continuity_context"],
            },
        }

        meta = await provider.regenerate_scene(
            scene=scene_input,
            visual_context=visual_context,
            instructions=instructions or "",
            aspect_ratio=ratio
        )

        target_scene.visual_description = meta.get("visual_description", target_scene.visual_description)
        target_scene.image_prompt = meta.get("image_prompt", target_scene.image_prompt)
        target_scene.suggested_motion = meta.get("suggested_motion", target_scene.suggested_motion)
        target_scene.suggested_transition = meta.get("suggested_transition", target_scene.suggested_transition)

        # Persist to disk
        project_service._save_to_disk(project)
        return target_scene

storyboard_service = StoryboardService()
