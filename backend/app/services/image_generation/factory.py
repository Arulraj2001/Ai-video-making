from typing import Optional, List
from app.configuration.config import settings
from app.services.image_generation.base import BaseImageGenerator
from app.services.image_generation.mock_generator import MockImageGenerator
from app.services.image_generation.cloudflare_generator import CloudflareImageGenerator
from app.services.image_generation.huggingface_generator import HuggingFaceImageGenerator
from app.services.image_generation.pollinations_generator import PollinationsImageGenerator

_cached_mock_generator: Optional[MockImageGenerator] = None
_cached_pollinations_generator: Optional[PollinationsImageGenerator] = None

def get_image_generator(
    provider_name: Optional[str] = None,
    model_name: Optional[str] = None,
    style_mode: Optional[str] = None,
) -> BaseImageGenerator:
    """
    Factory creating configured ImageGenerator instance based on environment settings or explicit override.
    Never exposes API credentials to callers.

    Providers:
      - "pollinations" : Free, no API key, FLUX.1-based (recommended default)
      - "cloudflare"   : Requires CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN
      - "huggingface"  : Requires HUGGINGFACE_API_KEY
      - "mock"         : Offline Pillow-based test cards
    """
    global _cached_mock_generator, _cached_pollinations_generator
    chosen_provider = (provider_name or settings.IMAGE_GENERATOR_PROVIDER or "pollinations").strip().lower()

    if chosen_provider == "pollinations":
        mode = style_mode or "photorealistic"
        gen = PollinationsImageGenerator(style_mode=mode)
        if model_name:
            # Override internal model if explicitly passed
            gen.capabilities.model_name = model_name
        return gen

    elif chosen_provider == "cloudflare":
        account_id = settings.CLOUDFLARE_ACCOUNT_ID
        api_token = settings.CLOUDFLARE_API_TOKEN
        if not account_id or not api_token:
            raise ValueError(
                "Cloudflare credentials missing. Set CF_ACCOUNT_ID and CF_API_TOKEN in backend environment."
            )
        model = model_name or settings.IMAGE_GENERATOR_MODEL or settings.CLOUDFLARE_IMAGE_MODEL
        return CloudflareImageGenerator(account_id=account_id, api_token=api_token, model_name=model)

    elif chosen_provider in ("huggingface", "hf"):
        api_key = settings.HUGGINGFACE_API_KEY
        if not api_key:
            raise ValueError(
                "Hugging Face credentials missing. Set HF_API_KEY in backend environment."
            )
        model = model_name or settings.IMAGE_GENERATOR_MODEL or settings.HUGGINGFACE_IMAGE_MODEL
        return HuggingFaceImageGenerator(api_key=api_key, model_name=model)

    elif chosen_provider == "mock":
        model = model_name or settings.IMAGE_GENERATOR_MODEL or ("mock-stickfigure-v1" if style_mode == "stickfigure" else "mock-cinematic-v1")
        return MockImageGenerator(model_name=model)

    else:
        raise ValueError(
            f"Unsupported image generator provider '{chosen_provider}'. Supported: 'pollinations', 'mock', 'cloudflare', 'huggingface'."
        )

def get_available_providers() -> List[str]:
    return ["pollinations", "mock", "cloudflare", "huggingface"]

def get_model_catalog() -> List[dict]:
    hf_ready = bool(settings.HUGGINGFACE_API_KEY)
    cf_ready = bool(settings.CLOUDFLARE_ACCOUNT_ID and settings.CLOUDFLARE_API_TOKEN)
    
    return [
        {
            "id": "pollinations-flux-realism",
            "name": "FLUX.1 Realism",
            "provider": "pollinations",
            "model_id": "flux-realism",
            "description": "Hyper-realistic photography and cinematic lighting (FLUX.1)",
            "quality": 5,
            "speed": "Fast",
            "is_free": True,
            "is_ready": True,
            "supported_styles": ["photorealistic", "cinematic", "documentary"]
        },
        {
            "id": "pollinations-flux-anime",
            "name": "FLUX.1 Anime & Manga",
            "provider": "pollinations",
            "model_id": "flux-anime",
            "description": "Japanese animation, vibrant anime scenes, clean lineart",
            "quality": 5,
            "speed": "Fast",
            "is_free": True,
            "is_ready": True,
            "supported_styles": ["anime", "manga"]
        },
        {
            "id": "pollinations-flux-3d",
            "name": "FLUX.1 3D Render",
            "provider": "pollinations",
            "model_id": "flux-3d",
            "description": "Pixar / Unreal Engine style 3D CGI character & scene renders",
            "quality": 4,
            "speed": "Fast",
            "is_free": True,
            "is_ready": True,
            "supported_styles": ["3d"]
        },
        {
            "id": "pollinations-flux",
            "name": "FLUX.1 Standard",
            "provider": "pollinations",
            "model_id": "flux",
            "description": "Standard versatile FLUX.1 generator for sketches, art and cartoons",
            "quality": 4,
            "speed": "Fast",
            "is_free": True,
            "is_ready": True,
            "supported_styles": ["sketch", "lineart", "watercolor"]
        },
        {
            "id": "pollinations-turbo",
            "name": "Pollinations Turbo",
            "provider": "pollinations",
            "model_id": "turbo",
            "description": "Ultra-fast generation for 2D cartoons, flat vector graphics, and icons",
            "quality": 3,
            "speed": "Instant",
            "is_free": True,
            "is_ready": True,
            "supported_styles": ["cartoon", "flat"]
        },
        {
            "id": "hf-flux-schnell",
            "name": "HuggingFace FLUX.1-schnell",
            "provider": "huggingface",
            "model_id": "black-forest-labs/FLUX.1-schnell",
            "description": "State-of-the-art 4-step FLUX.1 generation via Hugging Face",
            "quality": 5,
            "speed": "Medium",
            "is_free": True,
            "is_ready": hf_ready,
            "supported_styles": ["photorealistic", "cinematic", "3d", "anime"]
        },
        {
            "id": "hf-sdxl",
            "name": "HuggingFace SDXL 1.0",
            "provider": "huggingface",
            "model_id": "stabilityai/stable-diffusion-xl-base-1.0",
            "description": "Stable Diffusion XL Base 1.0 for artistic and stylised images",
            "quality": 4,
            "speed": "Medium",
            "is_free": True,
            "is_ready": hf_ready,
            "supported_styles": ["photorealistic", "artistic", "fantasy"]
        },
        {
            "id": "cf-flux-schnell",
            "name": "Cloudflare Workers FLUX.1",
            "provider": "cloudflare",
            "model_id": "@cf/black-forest-labs/flux-1-schnell",
            "description": "Fast serverless FLUX generation on Cloudflare Edge AI",
            "quality": 4,
            "speed": "Fast",
            "is_free": True,
            "is_ready": cf_ready,
            "supported_styles": ["photorealistic", "cinematic"]
        },
        {
            "id": "mock-stickfigure",
            "name": "Whiteboard Stick Figure",
            "provider": "mock",
            "model_id": "mock-stickfigure-v1",
            "description": "Offline minimalist stick-figure drawings with speech bubbles",
            "quality": 3,
            "speed": "Instant (Offline)",
            "is_free": True,
            "is_ready": True,
            "supported_styles": ["stickfigure"]
        },
        {
            "id": "mock-cinematic",
            "name": "Studio Storyboard Card",
            "provider": "mock",
            "model_id": "mock-cinematic-v1",
            "description": "Fast placeholder graphic cards with mood and prompt metadata",
            "quality": 2,
            "speed": "Instant (Offline)",
            "is_free": True,
            "is_ready": True,
            "supported_styles": ["cinematic", "photorealistic"]
        }
    ]


