from datetime import datetime, timezone
from typing import List, Optional
import httpx

from app.services.image_generation.base import (
    BaseImageGenerator,
    ImageGenerationOptions,
    ImageReference,
    GeneratedImageResult,
    ProviderCapabilities,
)

class HuggingFaceImageGenerator(BaseImageGenerator):
    """
    Hugging Face Inference API Image Generation Adapter.
    Uses Hugging Face Serverless / Inference endpoints (e.g. FLUX, SDXL).
    """

    def __init__(
        self,
        api_key: str,
        model_name: str = "black-forest-labs/FLUX.1-schnell",
        base_url: str = "https://api-inference.huggingface.co/models",
        timeout: float = 60.0
    ):
        if not api_key:
            raise ValueError("Hugging Face api_key is required for HuggingFaceImageGenerator")
        self._api_key = api_key
        self.model_name = model_name
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            provider_name="huggingface",
            model_name=self.model_name,
            supports_reference_images=False,
            supports_negative_prompt=True,
            supported_aspect_ratios=["16:9", "9:16", "1:1"],
            notes="Hugging Face Inference API. Reference images are supported via prompt descriptor conditioning."
        )

    async def generate_image(self, prompt: str, options: ImageGenerationOptions) -> GeneratedImageResult:
        url = f"{self.base_url}/{self.model_name}"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json"
        }

        parameters = {}
        if options.negative_prompt:
            parameters["negative_prompt"] = options.negative_prompt
        if options.width and options.height:
            parameters["width"] = options.width
            parameters["height"] = options.height
        if options.num_inference_steps:
            parameters["num_inference_steps"] = options.num_inference_steps
        if options.guidance_scale:
            parameters["guidance_scale"] = options.guidance_scale

        payload = {
            "inputs": prompt,
            "parameters": parameters
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
            except Exception as e:
                raise RuntimeError(f"Hugging Face network error: {str(e)}")

            if response.status_code != 200:
                err_msg = f"Hugging Face Inference error HTTP {response.status_code}"
                try:
                    err_json = response.json()
                    if "error" in err_json:
                        err_msg += f": {err_json['error']}"
                        if "estimated_time" in err_json:
                            err_msg += f" (Model loading, estimated {err_json['estimated_time']:.1f}s)"
                except Exception:
                    pass
                raise RuntimeError(err_msg)

            content_type = response.headers.get("content-type", "image/jpeg")
            image_bytes = response.content

        return GeneratedImageResult(
            image_bytes=image_bytes,
            content_type=content_type,
            provider="huggingface",
            model=self.model_name,
            metadata={
                "provider": "huggingface",
                "model": self.model_name,
                "aspect_ratio": options.aspect_ratio,
                "width": options.width,
                "height": options.height,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "references_used": []
            }
        )

    async def generate_image_with_references(
        self,
        prompt: str,
        references: List[ImageReference],
        options: ImageGenerationOptions
    ) -> GeneratedImageResult:
        enriched_prompt = prompt
        ref_tokens = []
        for r in references:
            ref_tokens.append(f"{r.entity_type}:{r.entity_name}")
            if r.description:
                enriched_prompt += f", {r.entity_name}: {r.description}"

        result = await self.generate_image(enriched_prompt, options)
        result.metadata["references_used"] = ref_tokens
        return result
