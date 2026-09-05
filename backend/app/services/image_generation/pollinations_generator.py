"""
Pollinations.ai Image Generator
================================
100% free, no API key, no account required.
Uses FLUX.1 and other models via Pollinations.ai public API.

Style modes map to different Pollinations models:
  - photorealistic  → flux-realism
  - anime           → flux-anime
  - 3d              → flux-3d
  - cartoon/flat    → turbo + style prefix
  - sketch/lineart  → flux + style prefix
  - default/none    → flux
"""
import hashlib
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import List, Optional

from app.services.image_generation.base import (
    BaseImageGenerator,
    GeneratedImageResult,
    ImageGenerationOptions,
    ImageReference,
    ProviderCapabilities,
)

# Maps style_mode string → (pollinations_model, prompt_prefix)
STYLE_MODE_MAP: dict = {
    "photorealistic": ("flux-realism", ""),
    "anime":          ("flux-anime",   ""),
    "manga":          ("flux-anime",   "manga style, ink lines, "),
    "3d":             ("flux-3d",      ""),
    "cartoon":        ("turbo",        "2D cartoon animation style, vibrant colors, clean lines, "),
    "flat":           ("turbo",        "flat design vector illustration, minimal, bold shapes, "),
    "sketch":         ("flux",         "pencil sketch, detailed line art, cross-hatching, black and white, "),
    "lineart":        ("flux",         "clean line art, minimal, vector style, "),
    "stickfigure":    ("flux",         "simple stick figure drawing, whiteboard sketch style, minimalist, "),
    "documentary":    ("flux-realism", "documentary photography style, candid, natural light, "),
    "cinematic":      ("flux-realism", "cinematic film still, dramatic lighting, anamorphic lens, "),
    "watercolor":     ("flux",         "watercolor painting, soft edges, artistic brushwork, "),
}

DEFAULT_TIMEOUT_SECONDS = 60


class PollinationsImageGenerator(BaseImageGenerator):
    """
    Free unlimited image generator using the Pollinations.ai public API.
    No API key or account required. Backed by FLUX.1 and Stable Diffusion models.
    """

    BASE_URL = "https://image.pollinations.ai/prompt"

    def __init__(self, style_mode: str = "photorealistic"):
        self._style_mode = style_mode.lower() if style_mode else "photorealistic"

    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            provider_name="pollinations",
            model_name=f"flux-{self._style_mode}",
            supports_reference_images=False,   # Pollinations does not support img2img
            supports_negative_prompt=True,
            supported_aspect_ratios=["16:9", "9:16", "1:1", "4:3", "21:9"],
            notes=(
                "Free unlimited image generation via Pollinations.ai (no API key required). "
                "Powered by FLUX.1, flux-realism, flux-anime, flux-3d, and turbo models."
            )
        )

    def _build_url(
        self,
        prompt: str,
        options: ImageGenerationOptions,
        style_mode: Optional[str] = None,
        seed: Optional[int] = None,
    ) -> str:
        mode = (style_mode or self._style_mode or "photorealistic").lower()
        model, prefix = STYLE_MODE_MAP.get(mode, ("flux", ""))

        # Build the full prompt with style prefix
        full_prompt = f"{prefix}{prompt}".strip()

        # Append negative prompt guidance if provided
        if options.negative_prompt:
            full_prompt += f". Avoid: {options.negative_prompt}"

        encoded_prompt = urllib.parse.quote(full_prompt)

        width = options.width or 1024
        height = options.height or 576

        params = {
            "width": width,
            "height": height,
            "model": model,
            "nologo": "true",
            "safe": "false",
            "enhance": "false",
        }

        if seed is not None:
            params["seed"] = seed

        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.BASE_URL}/{encoded_prompt}?{query}"

    def _fetch_image(self, url: str) -> bytes:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "AI-Video-Maker/1.0 (personal-use)"}
        )
        with urllib.request.urlopen(req, timeout=DEFAULT_TIMEOUT_SECONDS) as response:
            return response.read()

    async def generate_image(
        self,
        prompt: str,
        options: ImageGenerationOptions,
        style_mode: Optional[str] = None,
        seed: Optional[int] = None,
    ) -> GeneratedImageResult:
        url = self._build_url(prompt, options, style_mode=style_mode, seed=seed)

        # Run blocking HTTP call — Pollinations is synchronous HTTP
        # In production you'd use aiohttp; for simplicity we use urllib in thread
        import asyncio
        loop = asyncio.get_event_loop()
        image_bytes = await loop.run_in_executor(None, self._fetch_image, url)

        mode = (style_mode or self._style_mode or "photorealistic").lower()
        model, _ = STYLE_MODE_MAP.get(mode, ("flux", ""))

        return GeneratedImageResult(
            image_bytes=image_bytes,
            content_type="image/jpeg",
            provider="pollinations",
            model=model,
            metadata={
                "provider": "pollinations",
                "model": model,
                "style_mode": mode,
                "aspect_ratio": options.aspect_ratio,
                "width": options.width,
                "height": options.height,
                "seed": seed,
                "source_url": url,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "simulated": False,
            }
        )

    async def generate_image_with_references(
        self,
        prompt: str,
        references: List[ImageReference],
        options: ImageGenerationOptions,
        style_mode: Optional[str] = None,
        seed: Optional[int] = None,
    ) -> GeneratedImageResult:
        # Pollinations does not support img2img reference images.
        # We enrich the prompt with detailed reference descriptions instead.
        ref_descriptions = []
        for ref in references:
            parts = [f"{ref.entity_type} '{ref.entity_name}'"]
            if ref.description:
                parts.append(ref.description)
            ref_descriptions.append(". ".join(parts))

        enriched_prompt = prompt
        if ref_descriptions:
            enriched_prompt = f"{prompt}. Characters/context: {'; '.join(ref_descriptions)}"

        return await self.generate_image(
            prompt=enriched_prompt,
            options=options,
            style_mode=style_mode,
            seed=seed,
        )
