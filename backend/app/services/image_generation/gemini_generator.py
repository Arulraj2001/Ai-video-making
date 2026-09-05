"""Google Gemini native image generation adapter."""
from __future__ import annotations

import base64
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

from app.services.image_generation.base import (
    BaseImageGenerator,
    GeneratedImageResult,
    ImageGenerationOptions,
    ImageReference,
    ProviderCapabilities,
)


class GeminiImageGenerator(BaseImageGenerator):
    """Gemini 3.1 Flash Image through the Interactions API."""

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
    DEFAULT_MODEL = "gemini-3.1-flash-image"
    SUPPORTED_ASPECT_RATIOS = ["16:9", "9:16", "1:1"]

    def __init__(
        self,
        api_key: str,
        model_name: str = DEFAULT_MODEL,
        timeout: float = 90.0,
        http_client: Optional[httpx.AsyncClient] = None,
    ):
        if not api_key:
            raise ValueError("Gemini API key missing. Set GEMINI_API_KEY in the backend environment.")
        if model_name != self.DEFAULT_MODEL:
            raise ValueError(
                f"Unsupported Gemini image model '{model_name}'. Supported model: '{self.DEFAULT_MODEL}'."
            )
        self._api_key = api_key
        self.model_name = model_name
        self.timeout = timeout
        self._http_client = http_client

    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            provider_name="gemini",
            model_name=self.model_name,
            supports_reference_images=True,
            supports_negative_prompt=True,
            supported_aspect_ratios=list(self.SUPPORTED_ASPECT_RATIOS),
            notes=(
                "Gemini native image generation. Supports text-to-image and inline reference-image inputs "
                "through the Interactions API. Seed decoding is not exposed by this adapter."
            ),
            supports_seed=False,
            supports_aspect_ratio=True,
            supports_image_to_image=True,
            supports_reference_descriptions=True,
            supports_variations=True,
        )

    def _endpoint(self) -> str:
        return f"{self.BASE_URL}/interactions"

    @staticmethod
    def _read_reference(reference: ImageReference) -> tuple[bytes, str]:
        if not reference.image_path:
            raise ValueError(
                f"Gemini reference '{reference.entity_name}' has no local image path available."
            )
        path = Path(reference.image_path)
        if not path.is_absolute():
            path = Path.cwd() / path
        if not path.exists():
            raise ValueError(
                f"Gemini reference image for '{reference.entity_name}' was not found: {path}"
            )
        suffix = path.suffix.lower()
        mime_type = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".heic": "image/heic",
            ".heif": "image/heif",
        }.get(suffix, "image/png")
        return path.read_bytes(), mime_type

    def _build_input(
        self,
        prompt: str,
        references: Optional[List[ImageReference]] = None,
    ) -> Any:
        if not references:
            return prompt
        content: List[Dict[str, Any]] = [{"type": "text", "text": prompt}]
        for reference in references[:14]:
            image_bytes, mime_type = self._read_reference(reference)
            content.append({
                "type": "image",
                "data": base64.b64encode(image_bytes).decode("ascii"),
                "mime_type": mime_type,
            })
        return content

    async def _request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        headers = {
            "x-goog-api-key": self._api_key,
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
            raise RuntimeError("Gemini image generation timed out.") from exc
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Gemini provider network error: {exc}") from exc

        if response.status_code >= 400:
            detail = ""
            try:
                body = response.json()
                detail = body.get("error", {}).get("message", "")
            except ValueError:
                detail = response.text[:300]
            if response.status_code in (401, 403):
                raise RuntimeError(f"Gemini API key invalid or unauthorized: {detail or 'authentication failed'}")
            if response.status_code == 404:
                raise RuntimeError(f"Gemini image model unavailable: {detail or self.model_name}")
            if response.status_code == 429:
                raise RuntimeError(f"Gemini quota or rate limit reached: {detail or 'try again later'}")
            raise RuntimeError(f"Gemini provider error HTTP {response.status_code}: {detail or 'request failed'}")
        try:
            return response.json()
        except ValueError as exc:
            raise RuntimeError("Gemini returned a malformed JSON response.") from exc

    @staticmethod
    def _find_image(data: Dict[str, Any]) -> tuple[bytes, str]:
        output_image = data.get("output_image")
        if isinstance(output_image, dict) and output_image.get("data"):
            return base64.b64decode(output_image["data"]), output_image.get("mime_type", "image/jpeg")

        for step in data.get("steps", []):
            for block in step.get("content", []) if isinstance(step, dict) else []:
                if isinstance(block, dict) and block.get("type") == "image" and block.get("data"):
                    return base64.b64decode(block["data"]), block.get("mime_type", "image/jpeg")
        raise RuntimeError("Gemini returned no generated image.")

    async def generate_image(
        self,
        prompt: str,
        options: ImageGenerationOptions,
        style_mode: Optional[str] = None,
        seed: Optional[int] = None,
    ) -> GeneratedImageResult:
        if options.aspect_ratio not in self.SUPPORTED_ASPECT_RATIOS:
            raise ValueError(
                f"Gemini model '{self.model_name}' does not support aspect ratio '{options.aspect_ratio}'."
            )
        if seed is not None:
            raise ValueError("Gemini image generation does not expose seed control.")

        payload = {
            "model": self.model_name,
            "input": prompt,
            "response_format": {
                "type": "image",
                "mime_type": "image/jpeg",
                "aspect_ratio": options.aspect_ratio,
                "image_size": "1K",
            },
            "store": False,
        }
        response = await self._request(payload)
        image_bytes, content_type = self._find_image(response)
        return GeneratedImageResult(
            image_bytes=image_bytes,
            content_type=content_type,
            provider="gemini",
            model=self.model_name,
            metadata={
                "provider": "gemini",
                "model": self.model_name,
                "aspect_ratio": options.aspect_ratio,
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
        if options.aspect_ratio not in self.SUPPORTED_ASPECT_RATIOS:
            raise ValueError(
                f"Gemini model '{self.model_name}' does not support aspect ratio '{options.aspect_ratio}'."
            )
        if seed is not None:
            raise ValueError("Gemini image generation does not expose seed control.")
        payload = {
            "model": self.model_name,
            "input": self._build_input(self._reference_prompt(prompt, references), references),
            "response_format": {
                "type": "image",
                "mime_type": "image/jpeg",
                "aspect_ratio": options.aspect_ratio,
                "image_size": "1K",
            },
            "store": False,
        }
        response = await self._request(payload)
        image_bytes, content_type = self._find_image(response)
        result = GeneratedImageResult(
            image_bytes=image_bytes,
            content_type=content_type,
            provider="gemini",
            model=self.model_name,
            metadata={
                "provider": "gemini",
                "model": self.model_name,
                "aspect_ratio": options.aspect_ratio,
                "seed_supported": False,
                "simulated": False,
            },
        )
        result.metadata["references_used"] = [reference.entity_name for reference in references[:14]]
        result.metadata["reference_mode"] = "image"
        return result

    @staticmethod
    def _reference_prompt(prompt: str, references: List[ImageReference]) -> str:
        names = ", ".join(reference.entity_name for reference in references[:14])
        return f"{prompt}\nUse the supplied reference images for identity and visual continuity: {names}."

    async def check_health(self) -> Dict[str, Any]:
        """Check model/key availability without generating an image."""
        if not self._api_key:
            return {"status": "missing_key", "message": "Gemini API key missing"}
        headers = {"x-goog-api-key": self._api_key}
        endpoint = f"{self.BASE_URL}/models/{self.model_name}"
        try:
            if self._http_client:
                response = await self._http_client.get(endpoint, headers=headers, timeout=self.timeout)
            else:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(endpoint, headers=headers)
        except httpx.TimeoutException:
            return {"status": "unreachable", "message": "Gemini provider check timed out"}
        except httpx.HTTPError as exc:
            return {"status": "unreachable", "message": f"Gemini provider check failed: {exc}"}
        if response.status_code in (401, 403):
            return {"status": "invalid_key", "message": "Gemini API key invalid or unauthorized"}
        if response.status_code == 404:
            return {"status": "model_unavailable", "message": f"Gemini image model unavailable: {self.model_name}"}
        if response.status_code == 429:
            return {"status": "rate_limited", "message": "Gemini quota or rate limit reached"}
        if response.status_code >= 400:
            return {"status": "error", "message": f"Gemini provider returned HTTP {response.status_code}"}
        return {"status": "ready", "message": "Gemini ready - image generation available", "model": self.model_name}
