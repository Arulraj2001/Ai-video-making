import base64
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

class CloudflareImageGenerator(BaseImageGenerator):
    """
    Cloudflare Workers AI Image Generation Adapter.
    Uses Cloudflare's serverless AI inference network (e.g. FLUX, SDXL).
    """

    def __init__(
        self,
        account_id: str,
        api_token: str,
        model_name: str = "@cf/black-forest-labs/flux-1-schnell",
        timeout: float = 60.0
    ):
        if not account_id or not api_token:
            raise ValueError("Cloudflare account_id and api_token are required for CloudflareImageGenerator")
        self.account_id = account_id
        self._api_token = api_token
        self.model_name = model_name
        self.timeout = timeout

    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            provider_name="cloudflare",
            model_name=self.model_name,
            supports_reference_images=False,
            supports_negative_prompt=True,
            supported_aspect_ratios=["16:9", "9:16", "1:1"],
            notes="Cloudflare Workers AI text-to-image inference. Reference images are supported via prompt descriptor conditioning."
        )

    def _build_url(self) -> str:
        clean_model = self.model_name.lstrip("/")
        return f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/ai/run/{clean_model}"

    # Cloudflare FLUX.1-schnell only accepts 'prompt' and 'steps'.
    # Sending any other field causes HTTP 400 "Additional properties not allowed".
    # Width/height/negative_prompt/guidance are silently ignored at the model level.
    _FLUX_SCHNELL_ACCEPTED_PARAMS = frozenset({"prompt", "steps"})

    async def generate_image(self, prompt: str, options: ImageGenerationOptions) -> GeneratedImageResult:
        url = self._build_url()
        headers = {
            "Authorization": f"Bearer {self._api_token}",
            "Content-Type": "application/json"
        }

        # The FLUX.1-schnell schema only permits 'prompt' and 'steps'.
        # Using 'steps' (not 'num_steps') per the live API schema.
        payload: dict = {
            "prompt": prompt,
            "steps": min(options.num_inference_steps or 4, 8),
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
            except Exception as e:
                raise RuntimeError(f"Cloudflare Workers AI network error: {str(e)}")

            if response.status_code != 200:
                err_msg = f"Cloudflare Workers AI error HTTP {response.status_code}"
                try:
                    err_json = response.json()
                    if "errors" in err_json and err_json["errors"]:
                        err_msg += f": {err_json['errors'][0].get('message', '')}"
                except Exception:
                    pass
                raise RuntimeError(err_msg)

            content_type = response.headers.get("content-type", "")
            if "image" in content_type:
                image_bytes = response.content
                out_content_type = content_type
            else:
                # Could be JSON with base64 result
                try:
                    data = response.json()
                    b64_str = data.get("result", {}).get("image", "")
                    if b64_str:
                        image_bytes = base64.b64decode(b64_str)
                        out_content_type = "image/png"
                    else:
                        raise RuntimeError("Cloudflare response missing image binary or base64 data")
                except Exception as e:
                    raise RuntimeError(f"Failed to parse Cloudflare image response: {str(e)}")

        return GeneratedImageResult(
            image_bytes=image_bytes,
            content_type=out_content_type,
            provider="cloudflare",
            model=self.model_name,
            metadata={
                "provider": "cloudflare",
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
        # Cloudflare text-to-image does not natively accept image byte inputs;
        # Enrich the prompt with character/location descriptions for visual consistency
        enriched_prompt = prompt
        ref_tokens = []
        for r in references:
            ref_tokens.append(f"{r.entity_type}:{r.entity_name}")
            if r.description:
                enriched_prompt += f", {r.entity_name}: {r.description}"

        result = await self.generate_image(enriched_prompt, options)
        result.metadata["references_used"] = ref_tokens
        return result
