from typing import Optional, List
from app.configuration.config import settings
from app.services.image_generation.base import BaseImageGenerator
from app.services.image_generation.mock_generator import MockImageGenerator
from app.services.image_generation.cloudflare_generator import CloudflareImageGenerator
from app.services.image_generation.huggingface_generator import HuggingFaceImageGenerator

_cached_mock_generator: Optional[MockImageGenerator] = None

def get_image_generator(provider_name: Optional[str] = None) -> BaseImageGenerator:
    """
    Factory creating configured ImageGenerator instance based on environment settings or explicit override.
    Never exposes API credentials to callers.
    """
    global _cached_mock_generator
    chosen_provider = (provider_name or settings.IMAGE_GENERATOR_PROVIDER or "mock").strip().lower()

    if chosen_provider == "cloudflare":
        account_id = settings.CLOUDFLARE_ACCOUNT_ID
        api_token = settings.CLOUDFLARE_API_TOKEN
        if not account_id or not api_token:
            raise ValueError(
                "Cloudflare credentials missing. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in backend environment."
            )
        model = settings.IMAGE_GENERATOR_MODEL or settings.CLOUDFLARE_IMAGE_MODEL
        return CloudflareImageGenerator(account_id=account_id, api_token=api_token, model_name=model)

    elif chosen_provider in ("huggingface", "hf"):
        api_key = settings.HUGGINGFACE_API_KEY
        if not api_key:
            raise ValueError(
                "Hugging Face credentials missing. Set HUGGINGFACE_API_KEY in backend environment."
            )
        model = settings.IMAGE_GENERATOR_MODEL or settings.HUGGINGFACE_IMAGE_MODEL
        return HuggingFaceImageGenerator(api_key=api_key, model_name=model)

    elif chosen_provider == "mock":
        if _cached_mock_generator is None:
            model = settings.IMAGE_GENERATOR_MODEL or "mock-cinematic-v1"
            _cached_mock_generator = MockImageGenerator(model_name=model)
        return _cached_mock_generator

    else:
        raise ValueError(
            f"Unsupported image generator provider '{chosen_provider}'. Supported: 'mock', 'cloudflare', 'huggingface'."
        )

def get_available_providers() -> List[str]:
    return ["mock", "cloudflare", "huggingface"]
