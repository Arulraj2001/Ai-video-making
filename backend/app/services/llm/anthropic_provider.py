import json
import logging
from typing import List, Dict, Any
import httpx
from .base import BaseLLMProvider

logger = logging.getLogger(__name__)

class AnthropicProvider(BaseLLMProvider):
    """
    Anthropic Claude provider using the Messages API.
    """

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        self.api_key = api_key
        self.model = model

    @property
    def provider_name(self) -> str:
        return "anthropic"

    async def generate_storyboard_scenes(
        self,
        scenes: List[Dict[str, Any]],
        visual_context: Dict[str, Any],
        aspect_ratio: str = "16:9"
    ) -> List[Dict[str, Any]]:
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        prompt_text = (
            f"You are an expert AI video storyboard director and text-to-image prompt writer.\n"
            f"For each scene, treat the caption as the source of truth for the scene's subject, action, setting, and emotional beat. Do not produce generic mood imagery like 'Cinematic scene', multiple events, collages, or literal text inside the image.\n"
            f"Generate visual descriptions, image prompts, suggested motion, and suggested transitions for the following scenes.\n"
            f"Every image_prompt must follow this structured format:\n"
            f"Scene meaning: [exact original caption]\n"
            f"Visual interpretation: [faithful visual expansion]\n"
            f"Subject and action: [what is visible and happening]\n"
            f"Characters and continuity: [only relevant Video Bible entities]\n"
            f"Environment: [location and important objects]\n"
            f"Camera and composition: [shot type, angle, framing, lens, depth of field]\n"
            f"Lighting and mood: [lighting appropriate to the caption and selected style]\n"
            f"Style: [selected visual style]\n"
            f"Aspect-ratio framing: [16:9, 9:16, or 1:1 composition guidance]\n"
            f"Negative guidance: [no text, watermark, logo, duplicate subjects, distorted anatomy, unrelated objects, blurry output]\n"
            f"Target aspect ratio: {aspect_ratio}\n"
            f"Visual Context: {json.dumps(visual_context)}\n"
            f"Scenes: {json.dumps(scenes)}\n"
            f"Respond ONLY with a JSON object: {{\"scenes\": [{{\"id\": \"scene-001\", \"visual_description\": \"...\", \"image_prompt\": \"...\", \"suggested_motion\": \"...\", \"suggested_transition\": \"...\"}}]}}"
        )

        payload = {
            "model": self.model,
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": prompt_text}]
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        text = data["content"][0]["text"].strip()
        # strip markdown codeblock if present
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        parsed = json.loads(text.strip())
        return parsed.get("scenes", [])

    async def regenerate_scene(
        self,
        scene: Dict[str, Any],
        visual_context: Dict[str, Any],
        instructions: str = "",
        aspect_ratio: str = "16:9"
    ) -> Dict[str, Any]:
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        prompt_text = (
            f"Regenerate a single visual storyboard scene as one concrete, filmable image. Treat the caption as the source of truth for the subject, action, setting, and emotional beat. Preserve relevant Video Bible identities and add a clear shot size, camera angle, depth, lighting, and composition. Avoid generic imagery, multiple events, collage layouts, and text inside the image.\n"
            f"Target aspect ratio: {aspect_ratio}\n"
            f"Custom instructions: {instructions}\n"
            f"Visual Context: {json.dumps(visual_context)}\n"
            f"Scene: {json.dumps(scene)}\n"
            f"Respond ONLY with a JSON object: {{\"visual_description\": \"...\", \"image_prompt\": \"...\", \"suggested_motion\": \"...\", \"suggested_transition\": \"...\"}}"
        )

        payload = {
            "model": self.model,
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt_text}]
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        text = data["content"][0]["text"].strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        parsed = json.loads(text.strip())
        return parsed
