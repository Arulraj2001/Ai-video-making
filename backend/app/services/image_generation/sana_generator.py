import base64
from datetime import datetime, timezone
import logging
import os
from typing import List, Optional
import httpx

from app.services.image_generation.base import (
    BaseImageGenerator,
    ImageGenerationOptions,
    ImageReference,
    GeneratedImageResult,
    ProviderCapabilities,
)

logger = logging.getLogger(__name__)

class SanaLocalImageGenerator(BaseImageGenerator):
    """
    Adapter for local SANA-Sprint 1.6B inference microservice.
    Runs 100% locally on consumer GPUs (FastAPI server on port 8001).
    """

    DEFAULT_URL = "http://127.0.0.1:8001"

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: str = "Efficient-Large-Model/Sana_Sprint_1.6B_1024px_diffusers",
        timeout: float = 60.0
    ):
        self.base_url = (base_url or os.getenv("SANA_LOCAL_URL") or self.DEFAULT_URL).rstrip("/")
        self.model_name = model_name
        self.timeout = timeout

    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            provider_name="sana_local",
            model_name=self.model_name,
            supports_reference_images=False,
            supports_negative_prompt=True,
            supported_aspect_ratios=["16:9", "9:16", "1:1"],
            notes="Local SANA-Sprint 1.6B 1-step inference running on local GPU. 100% Free & Unlimited."
        )

    async def check_health(self) -> bool:
        """Quick check to see if the local SANA server is running."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/health")
                return res.status_code == 200
        except Exception:
            return False

    async def generate_image(self, prompt: str, options: ImageGenerationOptions) -> GeneratedImageResult:
        url = f"{self.base_url}/generate"
        payload = {
            "prompt": prompt,
            "width": options.width or 1024,
            "height": options.height or 1024,
            "num_inference_steps": options.num_inference_steps or 2,
            "guidance_scale": 1.0,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
        except httpx.ConnectError:
            raise RuntimeError(
                "Local SANA-Sprint server is not running on port 8001. "
                "Please start it by running 'python scripts/sana_server.py' in a terminal."
            )
        except Exception as e:
            raise RuntimeError(f"Failed to connect to local SANA server: {str(e)}")

        if response.status_code == 503:
            raise RuntimeError("SANA-Sprint 1.6B model is currently loading into your GPU memory. Please wait a moment and try again.")
        elif response.status_code != 200:
            raise RuntimeError(f"Local SANA server error ({response.status_code}): {response.text}")

        data = response.json()
        b64_img = data.get("image_base64")
        if not b64_img:
            raise RuntimeError("Local SANA server response missing 'image_base64' data")

        image_bytes = base64.b64decode(b64_img)

        # Record local usage
        try:
            from app.services.usage_tracker_service import usage_tracker
            usage_tracker.record_call("sana_local", success=True, status_code=200)
        except Exception:
            pass

        return GeneratedImageResult(
            image_bytes=image_bytes,
            content_type="image/png",
            provider="sana_local",
            model=self.model_name,
            metadata={
                "provider": "sana_local",
                "model": self.model_name,
                "aspect_ratio": options.aspect_ratio,
                "width": options.width,
                "height": options.height,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "local": True,
            }
        )

    async def generate_image_with_references(
        self,
        prompt: str,
        references: List[ImageReference],
        options: ImageGenerationOptions
    ) -> GeneratedImageResult:
        enriched_prompt = prompt
        for r in references:
            if r.description:
                enriched_prompt += f", {r.entity_name}: {r.description}"
        return await self.generate_image(enriched_prompt, options)
