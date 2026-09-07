import json
import logging
from typing import List, Dict, Any
import httpx
from .base import BaseLLMProvider

logger = logging.getLogger(__name__)

class GeminiProvider(BaseLLMProvider):
    """
    Google Gemini provider using the Google AI REST API with JSON response format.
    """

    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model = model

    @property
    def provider_name(self) -> str:
        return "gemini"

    async def generate_storyboard_scenes(
        self,
        scenes: List[Dict[str, Any]],
        visual_context: Dict[str, Any],
        aspect_ratio: str = "16:9"
    ) -> List[Dict[str, Any]]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        prompt_text = (
            f"You are an expert AI video storyboard director and text-to-image prompt writer.\n"
            f"For each scene, treat the caption as the source of truth. Convert it into one concrete, filmable moment with a visible subject, action, setting, emotional beat, shot size or camera angle, depth, and purposeful composition. Do not produce generic mood imagery, multiple events, collages, or literal text inside the image.\n"
            f"Generate visual descriptions, image prompts, suggested motion, and suggested transitions for the following scenes.\n"
            f"Every image_prompt must begin with the caption's actual scene action, then add only relevant Video Bible identities, style, lighting, camera, and composition.\n"
            f"Target aspect ratio: {aspect_ratio}\n"
            f"Visual Context: {json.dumps(visual_context)}\n"
            f"Scenes: {json.dumps(scenes)}\n"
            f"Return JSON strictly conforming to: {{\"scenes\": [{{\"id\": \"scene-001\", \"visual_description\": \"...\", \"image_prompt\": \"...\", \"suggested_motion\": \"...\", \"suggested_transition\": \"...\"}}]}}"
        )

        payload = {
            "contents": [{"parts": [{"text": prompt_text}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.4
            }
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        text = data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(text)
        return parsed.get("scenes", [])

    async def regenerate_scene(
        self,
        scene: Dict[str, Any],
        visual_context: Dict[str, Any],
        instructions: str = "",
        aspect_ratio: str = "16:9"
    ) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        prompt_text = (
            f"Regenerate a single visual storyboard scene as one concrete, filmable image. Treat the caption as the source of truth for the subject, action, setting, and emotional beat. Preserve relevant Video Bible identities and add a clear shot size, camera angle, depth, lighting, and composition. Avoid generic imagery, multiple events, collage layouts, and text inside the image.\n"
            f"Target aspect ratio: {aspect_ratio}\n"
            f"Custom instructions: {instructions}\n"
            f"Visual Context: {json.dumps(visual_context)}\n"
            f"Scene: {json.dumps(scene)}\n"
            f"Return JSON strictly conforming to: {{\"visual_description\": \"...\", \"image_prompt\": \"...\", \"suggested_motion\": \"...\", \"suggested_transition\": \"...\"}}"
        )

        payload = {
            "contents": [{"parts": [{"text": prompt_text}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.5
            }
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        text = data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(text)
        return parsed
