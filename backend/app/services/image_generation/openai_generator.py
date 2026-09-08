"""OpenAI DALL-E 3 image generation adapter."""
from __future__ import annotations

import base64
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.services.image_generation.base import (
    BaseImageGenerator,
    GeneratedImageResult,
    ImageGenerationOptions,
    ImageReference,
    ProviderCapabilities,
)

logger = logging.getLogger("scenora.image_generation.openai")


class OpenAIImageGenerator(BaseImageGenerator):
    """OpenAI DALL-E 3 visual synthesis generator."""

    BASE_URL = "https://api.openai.com/v1"
    DEFAULT_MODEL = "dall-e-3"
    SUPPORTED_ASPECT_RATIOS = ["16:9", "9:16", "1:1"]

    ASPECT_RATIO_DIMENSIONS = {
        "16:9": "1792x1024",
        "9:16": "1024x1792",
        "1:1": "1024x1024",
    }

    def __init__(
        self,
        api_key: str,
        model_name: str = DEFAULT_MODEL,
        timeout: float = 90.0,
        http_client: Optional[httpx.AsyncClient] = None,
    ):
        if not api_key or not api_key.strip():
            raise ValueError("OpenAI API key missing. Set OPENAI_API_KEY in the Vault or backend environment.")
        self._api_key = api_key.strip()
        self.model_name = model_name or self.DEFAULT_MODEL
        self.timeout = timeout
        self._http_client = http_client

    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            provider_name="openai",
            model_name=self.model_name,
            supports_reference_images=False,
            supports_negative_prompt=False,
            supported_aspect_ratios=list(self.SUPPORTED_ASPECT_RATIOS),
            notes=(
                "OpenAI DALL-E 3 visual synthesis. Supports 16:9, 9:16, and 1:1 aspect ratios, "
                "with automatic prompt adherence and high visual fidelity."
            ),
            supports_seed=False,
            supports_aspect_ratio=True,
            supports_image_to_image=False,
            supports_reference_descriptions=True,
            supports_variations=True,
        )

    def _endpoint(self) -> str:
        return f"{self.BASE_URL}/images/generations"

    def _get_size_for_aspect_ratio(self, aspect_ratio: str) -> str:
        ar = aspect_ratio.strip().lower()
        if ar in self.ASPECT_RATIO_DIMENSIONS:
            return self.ASPECT_RATIO_DIMENSIONS[ar]
        if ar in ("9/16", "vertical", "portrait"):
            return "1024x1792"
        if ar in ("1/1", "square"):
            return "1024x1024"
        if ar in ("16/9", "horizontal", "landscape", "widescreen"):
            return "1792x1024"
        return "1792x1024"

    async def _request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        try:
            if self._http_client:
                response = await self._http_client.post(
                    self._endpoint(), json=payload, headers=headers, timeout=self.timeout
                )
            else:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(self._endpoint(), json=payload, headers=headers)
        except httpx.TimeoutException as exc:
            self._record_usage(success=False, status_code=504)
            raise RuntimeError("OpenAI image generation timed out.") from exc
        except httpx.HTTPError as exc:
            self._record_usage(success=False, status_code=502)
            raise RuntimeError(f"OpenAI provider network error: {exc}") from exc

        if response.status_code >= 400:
            self._record_usage(success=False, status_code=response.status_code)
            detail = ""
            try:
                body = response.json()
                detail = body.get("error", {}).get("message", "")
            except ValueError:
                detail = response.text[:300]

            if response.status_code in (401, 403):
                raise RuntimeError(f"OpenAI API key invalid or unauthorized: {detail or 'authentication failed'}")
            if response.status_code == 429:
                raise RuntimeError(f"OpenAI quota or rate limit reached: {detail or 'check your OpenAI account billing'}")
            if response.status_code == 400:
                raise RuntimeError(f"OpenAI image generation rejected: {detail or 'bad request'}")
            raise RuntimeError(f"OpenAI provider error HTTP {response.status_code}: {detail or 'request failed'}")

        self._record_usage(success=True, status_code=200)
        try:
            return response.json()
        except ValueError as exc:
            raise RuntimeError("OpenAI returned a malformed JSON response.") from exc

    def _record_usage(self, success: bool, status_code: int) -> None:
        try:
            from app.services.usage_tracker_service import usage_tracker
            usage_tracker.record_call("openai", success=success, status_code=status_code)
        except Exception:
            pass

    async def _extract_image_bytes(self, item: Dict[str, Any]) -> bytes:
        b64 = item.get("b64_json")
        if b64:
            return base64.b64decode(b64)
        url = item.get("url")
        if url:
            try:
                if self._http_client:
                    img_resp = await self._http_client.get(url, timeout=self.timeout)
                else:
                    async with httpx.AsyncClient(timeout=self.timeout) as client:
                        img_resp = await client.get(url)
                if img_resp.status_code == 200:
                    return img_resp.content
            except Exception as e:
                raise RuntimeError(f"Failed to download generated image from OpenAI URL: {e}")
        raise RuntimeError("OpenAI returned no image data in response.")

    async def generate_image(
        self,
        prompt: str,
        options: ImageGenerationOptions,
        style_mode: Optional[str] = None,
        seed: Optional[int] = None,
    ) -> GeneratedImageResult:
        size_str = self._get_size_for_aspect_ratio(options.aspect_ratio)
        payload: Dict[str, Any] = {
            "model": self.model_name,
            "prompt": prompt,
            "n": 1,
            "size": size_str,
            "response_format": "b64_json",
            "quality": "standard",
        }
        if options.extra_params:
            if "quality" in options.extra_params:
                payload["quality"] = options.extra_params["quality"]
            if "style" in options.extra_params:
                payload["style"] = options.extra_params["style"]

        response_data = await self._request(payload)
        items = response_data.get("data", [])
        if not items:
            raise RuntimeError("OpenAI response contained empty image data.")

        item = items[0]
        image_bytes = await self._extract_image_bytes(item)
        revised_prompt = item.get("revised_prompt")

        return GeneratedImageResult(
            image_bytes=image_bytes,
            content_type="image/png",
            provider="openai",
            model=self.model_name,
            metadata={
                "provider": "openai",
                "model": self.model_name,
                "aspect_ratio": options.aspect_ratio,
                "dimensions": size_str,
                "revised_prompt": revised_prompt,
                "seed_supported": False,
                "simulated": False,
            },
        )

    async def generate_image_with_references(
        self,
        prompt: str,
        references: List[ImageReference],
        options: ImageGenerationOptions,
        style_mode: Optional[str] = None,
        seed: Optional[int] = None,
    ) -> GeneratedImageResult:
        augmented_prompt = self._reference_prompt(prompt, references)
        result = await self.generate_image(
            prompt=augmented_prompt,
            options=options,
            style_mode=style_mode,
            seed=seed,
        )
        result.metadata["references_used"] = [r.entity_name for r in references]
        result.metadata["reference_mode"] = "description_augmented"
        return result

    @staticmethod
    def _reference_prompt(prompt: str, references: List[ImageReference]) -> str:
        ref_descriptions = []
        for ref in references:
            desc = f"{ref.entity_type.capitalize()} '{ref.entity_name}'"
            if ref.description:
                desc += f": {ref.description}"
            ref_descriptions.append(desc)
        if ref_descriptions:
            return f"{prompt}\n\n[Visual Continuity References]:\n" + "\n".join(f"- {d}" for d in ref_descriptions)
        return prompt

    async def check_health(self) -> Dict[str, Any]:
        """Check OpenAI API key availability without generating an image."""
        if not self._api_key:
            return {"status": "missing_key", "message": "OpenAI API key missing"}
        headers = {"Authorization": f"Bearer {self._api_key}"}
        endpoint = f"{self.BASE_URL}/models"
        try:
            if self._http_client:
                response = await self._http_client.get(endpoint, headers=headers, timeout=self.timeout)
            else:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(endpoint, headers=headers)
        except httpx.TimeoutException:
            return {"status": "unreachable", "message": "OpenAI provider check timed out"}
        except httpx.HTTPError as exc:
            return {"status": "unreachable", "message": f"OpenAI provider check failed: {exc}"}

        if response.status_code in (401, 403):
            return {"status": "invalid_key", "message": "OpenAI API key invalid or unauthorized"}
        if response.status_code == 429:
            return {"status": "rate_limited", "message": "OpenAI quota or rate limit reached"}
        if response.status_code >= 400:
            return {"status": "error", "message": f"OpenAI returned HTTP {response.status_code}"}
        return {"status": "ready", "message": "OpenAI ready - DALL-E 3 image generation available", "model": self.model_name}
