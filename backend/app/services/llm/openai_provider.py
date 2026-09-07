import json
import logging
from typing import List, Dict, Any, Optional
import httpx
from .base import BaseLLMProvider

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an elite Hollywood visual director and AI cinematography storyboard artist.
Your job is to convert timestamped video captions into a cohesive visual storyboard.

For each scene provided, generate:
1. "visual_description": A detailed explanation of what is visually happening in the shot (subject, framing, action, lighting, mood) understanding the caption's narrative subtext rather than simply illustrating literal words.
2. "image_prompt": A master generative image prompt formatted for text-to-image models (Midjourney, Stable Diffusion, Flux, Imagen). Every prompt MUST:
    - Treat the caption as the source of truth for the scene's subject, action, and emotional beat; never replace it with a generic image.
    - Translate the caption into a concrete single filmable moment with visible subjects, action, setting, and cause-and-effect.
    - Describe the actual visual scene before adding style language.
   - Strictly incorporate the project's Video Bible style, camera, and lighting.
   - Maintain recurring character consistency (using character visual anchors).
   - Maintain recurring location consistency.
   - Maintain recurring object consistency.
   - Avoid text/words/subtitles inside generated images.
   - Avoid logos/watermarks.
   - Specify composition for the requested aspect ratio.
    - Include shot size or camera angle, subject placement, depth, and meaningful foreground/background details when supported by the caption.
    - Keep the prompt concise enough for an image model: one coherent shot, no multiple panels, montage, collage, or unrelated events.
   - Avoid unnecessary aesthetic drift between scenes.
   - Prefer cinematic video-ready composition.
3. "suggested_motion": Recommended camera or subject movement tailored to scene duration.
4. "suggested_transition": Transition to the next scene (e.g. Cut, Cross dissolve, Fade to black).

Respond strictly with valid JSON conforming to:
{
  "scenes": [
    {
      "id": "scene-001",
      "visual_description": "...",
      "image_prompt": "...",
      "suggested_motion": "...",
      "suggested_transition": "..."
    }
  ]
}
"""

class OpenAIProvider(BaseLLMProvider):
    """
    OpenAI and OpenAI-compatible provider (OpenAI, OpenRouter, Groq, Ollama, vLLM).
    Uses HTTPX AsyncClient with JSON response format.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o-mini",
        base_url: Optional[str] = None
    ):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/") if base_url else "https://api.openai.com/v1"

    @property
    def provider_name(self) -> str:
        return "openai"

    async def generate_storyboard_scenes(
        self,
        scenes: List[Dict[str, Any]],
        visual_context: Dict[str, Any],
        aspect_ratio: str = "16:9"
    ) -> List[Dict[str, Any]]:
        user_content = {
            "aspect_ratio": aspect_ratio,
            "video_bible_visual_context": visual_context,
            "scenes": scenes
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(user_content, indent=2)}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.4
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            resp.raise_for_status()
            data = resp.json()

        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return parsed.get("scenes", [])

    async def regenerate_scene(
        self,
        scene: Dict[str, Any],
        visual_context: Dict[str, Any],
        instructions: str = "",
        aspect_ratio: str = "16:9"
    ) -> Dict[str, Any]:
        user_content = {
            "aspect_ratio": aspect_ratio,
            "video_bible_visual_context": visual_context,
            "target_scene": scene,
            "user_custom_instructions": instructions or "Make it more cinematic and dramatic."
        }

        single_prompt = (
            SYSTEM_PROMPT +
            "\nYou are regenerating a SINGLE scene. Respond strictly with a JSON object: "
            '{"visual_description": "...", "image_prompt": "...", "suggested_motion": "...", "suggested_transition": "..."}'
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": single_prompt},
                {"role": "user", "content": json.dumps(user_content, indent=2)}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.5
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            resp.raise_for_status()
            data = resp.json()

        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return parsed
