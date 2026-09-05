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
            f"You are an expert AI video storyboard director.\n"
            f"Generate visual descriptions, image prompts, suggested motion, and suggested transitions for the following scenes.\n"
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
            f"Regenerate a single visual storyboard scene.\n"
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
