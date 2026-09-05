import json
import logging
from typing import List, Dict, Any, Optional
import httpx
from .base import BaseLLMProvider

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an elite visual director and AI storyboard artist.
Your job is to convert timestamped video captions into a cohesive visual storyboard.

For each scene provided, generate:
1. "visual_description": A detailed explanation of what is visually happening in the shot (subject, framing, action, lighting, mood) capturing the caption's subtext.
2. "image_prompt": A master generative image prompt formatted for text-to-image models (Midjourney, Stable Diffusion, Flux, Imagen). Every prompt MUST:
   - Describe the actual visual scene.
   - Strictly incorporate the project's Video Bible style, camera, and lighting.
   - Maintain character consistency (using character visual anchors).
   - Maintain recurring location consistency.
   - Avoid text/words/subtitles inside generated images.
   - Avoid logos/watermarks.
   - Specify composition for the requested aspect ratio.
3. "suggested_motion": Recommended camera or subject movement (e.g. slow zoom in, pan right, static).
4. "suggested_transition": Transition to the next scene (e.g. cut, crossfade, fade to black).

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

class OpenRouterProvider(BaseLLMProvider):
    """
    OpenRouter LLM Provider supporting access to 100+ AI models including free tiers.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "meta-llama/llama-3.3-70b-instruct:free",
        base_url: Optional[str] = None
    ):
        self.api_key = api_key
        self.model = model or "meta-llama/llama-3.3-70b-instruct:free"
        self.base_url = (base_url or "https://openrouter.ai/api/v1").rstrip("/")

    @property
    def provider_name(self) -> str:
        return "openrouter"

    async def generate_storyboard_scenes(
        self,
        scenes: List[Dict[str, Any]],
        visual_context: Dict[str, Any],
        aspect_ratio: str = "16:9"
    ) -> List[Dict[str, Any]]:
        user_content = {
            "aspect_ratio": aspect_ratio,
            "video_bible_visual_context": visual_context,
            "scenes_to_storyboard": [
                {
                    "id": s.get("id"),
                    "start": s.get("start"),
                    "end": s.get("end"),
                    "duration": s.get("duration"),
                    "caption": s.get("caption")
                }
                for s in scenes
            ]
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/Arulraj2001/Ai-video-making",
            "X-Title": "AI Video Maker Studio"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(user_content, ensure_ascii=False)}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.4
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers
            )

            if resp.status_code != 200:
                logger.error(f"OpenRouter API error ({resp.status_code}): {resp.text}")
                # Fallback to standard request without response_format if model doesn't support json_object mode
                if "response_format" in resp.text:
                    payload.pop("response_format", None)
                    payload["messages"][0]["content"] += "\nEnsure you output pure raw JSON only."
                    retry_resp = await client.post(
                        f"{self.base_url}/chat/completions",
                        json=payload,
                        headers=headers
                    )
                    if retry_resp.status_code != 200:
                        raise ValueError(f"OpenRouter generation failed: {retry_resp.text}")
                    data = retry_resp.json()
                else:
                    raise ValueError(f"OpenRouter generation failed: {resp.text}")
            else:
                data = resp.json()

        raw_content = data["choices"][0]["message"]["content"]
        # Strip markdown fences if present
        cleaned = raw_content.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        parsed = json.loads(cleaned)
        return parsed.get("scenes", [])
