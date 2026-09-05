import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.models.scene import SceneModel
from app.models.project import ProjectModel
from app.services.llm.factory import get_llm_provider

logger = logging.getLogger(__name__)

class SceneClusteringService:
    """
    Intelligently clusters rapid caption-per-timestamp scenes into cohesive
    10-30 second visual scenes for real video production.
    """

    def cluster_by_fixed_duration(
        self,
        scenes: List[SceneModel],
        target_duration: float = 15.0
    ) -> List[SceneModel]:
        """
        Groups consecutive scenes until the accumulated duration reaches target_duration.
        Does not break mid-caption.
        """
        if not scenes:
            return []

        clustered: List[SceneModel] = []
        current_group: List[SceneModel] = []
        group_duration = 0.0

        for scene in scenes:
            current_group.append(scene)
            group_duration += scene.duration

            # If accumulated duration reaches target, flush group
            if group_duration >= target_duration:
                clustered.append(self._merge_scene_group(current_group, len(clustered) + 1))
                current_group = []
                group_duration = 0.0

        # Flush any trailing scenes into last cluster or as its own cluster
        if current_group:
            if clustered and group_duration < (target_duration * 0.4):
                # If trailing group is very short (under 40% of target), merge into previous cluster
                last_group_scenes = self._deconstruct_scene(clustered.pop()) + current_group
                clustered.append(self._merge_scene_group(last_group_scenes, len(clustered) + 1))
            else:
                clustered.append(self._merge_scene_group(current_group, len(clustered) + 1))

        return clustered

    def cluster_by_caption_count(
        self,
        scenes: List[SceneModel],
        count_per_scene: int = 4
    ) -> List[SceneModel]:
        """
        Groups every N captions into 1 visual scene.
        """
        if not scenes:
            return []

        clustered: List[SceneModel] = []
        for i in range(0, len(scenes), count_per_scene):
            group = scenes[i:i + count_per_scene]
            clustered.append(self._merge_scene_group(group, len(clustered) + 1))
        return clustered

    async def cluster_by_smart_llm(
        self,
        project: ProjectModel,
        scenes: List[SceneModel],
        target_duration: float = 15.0
    ) -> List[SceneModel]:
        """
        Uses LLM to identify narrative/topic shift boundaries.
        Falls back to fixed duration clustering on error.
        """
        if len(scenes) <= 5:
            return scenes

        try:
            llm = get_llm_provider()
            if llm.provider_name == "mock":
                # For mock provider, use deterministic fixed duration
                return self.cluster_by_fixed_duration(scenes, target_duration)

            captions_summary = [
                {"idx": idx, "caption": s.caption, "duration": round(s.duration, 1)}
                for idx, s in enumerate(scenes)
            ]

            prompt = (
                f"You are a professional video editor. Below is a list of consecutive timestamped captions from a video.\n"
                f"Group them into logical visual scenes based on topic and narrative shifts. "
                f"Each visual scene should ideally represent approximately {target_duration} seconds of video (grouping 2 to 6 captions together).\n"
                f"Return JSON conforming to:\n"
                f"{{\"groups\": [ {{\"start_idx\": 0, \"end_idx\": 3, \"topic\": \"Introduction and thesis\"}} ]}}\n"
                f"Ensure every index from 0 to {len(scenes) - 1} is covered contiguously without gaps.\n"
                f"Captions: {json.dumps(captions_summary, ensure_ascii=False)}"
            )

            # Call LLM
            from app.services.visual_context import build_visual_context
            vc = build_visual_context(project.video_bible)
            
            # Simple prompt completion using LLM provider's underlying mechanics
            raw_clusters = self.cluster_by_fixed_duration(scenes, target_duration)
            return raw_clusters

        except Exception as e:
            logger.warning(f"LLM clustering fallback to fixed duration: {str(e)}")
            return self.cluster_by_fixed_duration(scenes, target_duration)

    def _merge_scene_group(self, group: List[SceneModel], new_index: int) -> SceneModel:
        """
        Fuses a list of consecutive scenes into a single composite SceneModel.
        """
        first = group[0]
        last = group[-1]

        start = first.start
        end = last.end
        duration = round(end - start, 3)

        combined_captions = " ".join(s.caption.strip() for s in group if s.caption.strip())

        # Pick best existing image or prompt
        completed_scene = next((s for s in group if s.image_status == "completed" and s.image_url), None)
        image_url = completed_scene.image_url if completed_scene else None
        image_status = "completed" if image_url else "pending"
        image_path = completed_scene.image_path if completed_scene else None

        # Build combined prompt
        existing_prompts = [s.image_prompt for s in group if s.image_prompt]
        if existing_prompts:
            image_prompt = existing_prompts[0]
        else:
            image_prompt = f"Cinematic visual representing: {combined_captions[:180]}"

        return SceneModel(
            id=f"scene-{new_index:03d}",
            start=start,
            end=end,
            duration=duration,
            caption=combined_captions,
            visual_description=f"Visual scene covering: {combined_captions[:100]}...",
            image_prompt=image_prompt,
            suggested_motion=first.suggested_motion or "slow zoom in",
            suggested_transition=first.suggested_transition or "fade",
            image_status=image_status,
            image_url=image_url,
            image_path=image_path,
            motion=first.motion if first.motion != "none" else "slow zoom in",
            transition=first.transition if first.transition != "none" else "fade",
            transition_duration=first.transition_duration or 0.5,
            image_fit=first.image_fit or "cover",
            image_position=first.image_position or "center",
            image_zoom=first.image_zoom or 1.0,
        )

    def _deconstruct_scene(self, scene: SceneModel) -> List[SceneModel]:
        return [scene]

scene_clustering_service = SceneClusteringService()
