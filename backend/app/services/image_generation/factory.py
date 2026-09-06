from typing import Optional, List
from app.configuration.config import settings
from app.services.image_generation.base import BaseImageGenerator
from app.services.image_generation.mock_generator import MockImageGenerator
from app.services.image_generation.cloudflare_generator import CloudflareImageGenerator
from app.services.image_generation.huggingface_generator import HuggingFaceImageGenerator
from app.services.image_generation.pollinations_generator import PollinationsImageGenerator
from app.services.image_generation.gemini_generator import GeminiImageGenerator
from app.services.image_generation.sana_generator import SanaLocalImageGenerator

_cached_mock_generator: Optional[MockImageGenerator] = None
_cached_pollinations_generator: Optional[PollinationsImageGenerator] = None
_cached_sana_generator: Optional[SanaLocalImageGenerator] = None

def _validate_model(provider: str, model_name: Optional[str]) -> None:
    if not model_name:
        return
    match = next(
        (
            item for item in get_model_catalog()
            if item["provider"] == provider and item["model_id"] == model_name
        ),
        None,
    )
    if not match:
        if provider == "gemini":
            raise ValueError(
                f"Unsupported Gemini image model '{model_name}'. "
                f"Supported model: 'gemini-3.1-flash-image'."
            )
        raise ValueError(
            f"Unsupported model '{model_name}' for provider '{provider}'. "
            "Choose a model listed for the selected provider."
        )

def get_image_generator(
    provider_name: Optional[str] = None,
    model_name: Optional[str] = None,
    style_mode: Optional[str] = None,
    user_id: Optional[str] = None,
) -> BaseImageGenerator:
    """
    Factory creating configured ImageGenerator instance based on environment settings,
    user vault credentials (if user_id provided), or explicit override.
    Never exposes API credentials to callers.

    Providers:
      - "pollinations" : Free, no API key, FLUX.1-based (recommended default)
      - "cloudflare"   : Requires CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN
      - "huggingface"  : Requires HUGGINGFACE_API_KEY
      - "gemini"       : Requires GEMINI_API_KEY
      - "sana_local"   : Local GPU port 8001
      - "mock"         : Offline Pillow-based test cards
    """
    global _cached_mock_generator, _cached_pollinations_generator
    chosen_provider = (provider_name or settings.IMAGE_GENERATOR_PROVIDER or "pollinations").strip().lower()

    if chosen_provider == "hf":
        chosen_provider = "huggingface"
    _validate_model(chosen_provider, model_name)

    user_cred = None
    if user_id:
        try:
            from app.services.vault import get_credential_vault
            vault = get_credential_vault()
            user_cred = vault.get_credential(user_id, chosen_provider)
        except Exception:
            user_cred = None

    if chosen_provider == "pollinations":
        mode = style_mode or "photorealistic"
        return PollinationsImageGenerator(style_mode=mode, model_name=model_name)

    elif chosen_provider == "cloudflare":
        account_id = (user_cred.get("account_id") if user_cred else None) or settings.CLOUDFLARE_ACCOUNT_ID
        api_token = (user_cred.get("api_key") if user_cred else None) or settings.CLOUDFLARE_API_TOKEN
        if not account_id or not api_token:
            raise ValueError(
                "Cloudflare credentials missing. Set CF_ACCOUNT_ID and CF_API_TOKEN in Vault or backend environment."
            )
        model = model_name or settings.IMAGE_GENERATOR_MODEL or settings.CLOUDFLARE_IMAGE_MODEL
        return CloudflareImageGenerator(account_id=account_id, api_token=api_token, model_name=model)

    elif chosen_provider in ("huggingface", "hf"):
        api_key = (user_cred.get("api_key") if user_cred else None) or settings.HUGGINGFACE_API_KEY
        if not api_key:
            raise ValueError(
                "Hugging Face credentials missing. Set HF_API_KEY in Vault or backend environment."
            )
        model = model_name or settings.IMAGE_GENERATOR_MODEL or settings.HUGGINGFACE_IMAGE_MODEL
        return HuggingFaceImageGenerator(api_key=api_key, model_name=model)

    elif chosen_provider == "mock":
        model = model_name or settings.IMAGE_GENERATOR_MODEL or ("mock-stickfigure-v1" if style_mode == "stickfigure" else "mock-cinematic-v1")
        return MockImageGenerator(model_name=model)

    elif chosen_provider in ("sana_local", "sana"):
        global _cached_sana_generator
        model = model_name or "Efficient-Large-Model/Sana_Sprint_1.6B_1024px_diffusers"
        if _cached_sana_generator is None or _cached_sana_generator.model_name != model:
            _cached_sana_generator = SanaLocalImageGenerator(model_name=model)
        return _cached_sana_generator

    elif chosen_provider == "gemini":
        gemini_key = (user_cred.get("api_key") if user_cred else None) or settings.GEMINI_API_KEY
        if not gemini_key:
            raise ValueError("Gemini API key missing. Set GEMINI_API_KEY in Vault or backend environment.")
        model = model_name or GeminiImageGenerator.DEFAULT_MODEL
        return GeminiImageGenerator(api_key=gemini_key, model_name=model)

    else:
        raise ValueError(
            f"Unsupported image generator provider '{chosen_provider}'. Supported: 'pollinations', 'mock', 'cloudflare', 'sana_local', 'huggingface', 'gemini'."
        )

def get_available_providers() -> List[str]:
    return ["pollinations", "cloudflare", "sana_local", "mock", "huggingface", "gemini"]

def get_model_catalog() -> List[dict]:
    hf_ready = bool(settings.HUGGINGFACE_API_KEY)
    cf_ready = bool(settings.CLOUDFLARE_ACCOUNT_ID and settings.CLOUDFLARE_API_TOKEN)
    gemini_ready = bool(settings.GEMINI_API_KEY)
    
    catalog = [
        # --- 1. FREE CLOUD (Zero Setup / Unlimited) ---
        {
            "id": "pollinations-flux-realism",
            "name": "FLUX.1 Realism",
            "provider": "pollinations",
            "model_id": "flux-realism",
            "category": "free_cloud",
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
            "category": "free_cloud",
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
            "category": "free_cloud",
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
            "category": "free_cloud",
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
            "category": "free_cloud",
            "description": "Ultra-fast generation for 2D cartoons, flat vector graphics, and icons",
            "quality": 3,
            "speed": "Instant",
            "is_free": True,
            "is_ready": True,
            "supported_styles": ["cartoon", "flat"]
        },

        # --- 2. CLOUDFLARE WORKERS AI (Daily Quota) ---
        {
            "id": "cf-flux-schnell",
            "name": "Cloudflare Workers FLUX.1",
            "provider": "cloudflare",
            "model_id": "@cf/black-forest-labs/flux-1-schnell",
            "category": "quota_cloud",
            "description": "Fast serverless FLUX generation on Cloudflare Edge AI (~25 images/day free)",
            "quality": 4,
            "speed": "Fast",
            "is_free": True,
            "is_ready": cf_ready,
            "supported_styles": ["photorealistic", "cinematic"]
        },

        # --- 3. LOCAL GPU (Offline / 100% Free / Unlimited) ---
        {
            "id": "sana-sprint-local",
            "name": "SANA-Sprint 1.6B (Local GPU)",
            "provider": "sana_local",
            "model_id": "Efficient-Large-Model/Sana_Sprint_1.6B_1024px_diffusers",
            "category": "local",
            "description": "Ultra-fast 1-step offline generation on your GPU via local server (Free & Unlimited)",
            "quality": 4,
            "speed": "Instant (Local)",
            "is_free": True,
            "is_ready": True,
            "supported_styles": ["photorealistic", "cinematic", "anime", "3d", "custom"]
        },

        # --- 4. OFFLINE MOCK / TESTING ---
        {
            "id": "mock-stickfigure",
            "name": "Whiteboard Stick Figure",
            "provider": "mock",
            "model_id": "mock-stickfigure-v1",
            "category": "mock",
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
            "category": "mock",
            "description": "Fast placeholder graphic cards with mood and prompt metadata",
            "quality": 2,
            "speed": "Instant (Offline)",
            "is_free": True,
            "is_ready": True,
            "supported_styles": ["cinematic", "photorealistic"]
        },

        # --- 5. PAID / ADVANCED CLOUD (API Keys Required) ---
        {
            "id": "gemini-3-1-flash-image",
            "name": "Gemini 3.1 Flash Image",
            "provider": "gemini",
            "model_id": "gemini-3.1-flash-image",
            "category": "paid_cloud",
            "description": "Gemini native image generation and multi-reference image editing",
            "quality": 5,
            "speed": "Fast",
            "is_free": False,
            "is_ready": gemini_ready,
            "supported_styles": ["stickfigure", "whiteboard", "cartoon", "flat", "sketch", "3d", "anime", "cinematic", "documentary", "custom"],
            "supports_reference_images": True,
            "supports_seed": False,
            "supports_aspect_ratio": True,
            "supports_negative_prompt": True,
            "supports_image_to_image": True,
            "supports_variations": True,
        },
        {
            "id": "hf-flux-schnell",
            "name": "HuggingFace FLUX.1-schnell",
            "provider": "huggingface",
            "model_id": "black-forest-labs/FLUX.1-schnell",
            "category": "paid_cloud",
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
            "category": "paid_cloud",
            "description": "Stable Diffusion XL Base 1.0 for artistic and stylised images",
            "quality": 4,
            "speed": "Medium",
            "is_free": True,
            "is_ready": hf_ready,
            "supported_styles": ["photorealistic", "artistic", "fantasy"]
        }
    ]
    for item in catalog:
        item.setdefault("supports_reference_images", False)
        item.setdefault("supports_seed", item["provider"] in ("pollinations", "mock", "sana_local"))
        item.setdefault("supports_aspect_ratio", True)
        item.setdefault("supports_negative_prompt", True)
        item.setdefault("supports_image_to_image", False)
        item.setdefault("supports_variations", True)
    return catalog


