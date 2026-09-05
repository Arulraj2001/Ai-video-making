"""
Image Generation module providing abstract ImageGenerator interface and provider adapters.
"""
from app.services.image_generation.base import (
    BaseImageGenerator,
    ImageGenerationOptions,
    ImageReference,
    GeneratedImageResult,
    ProviderCapabilities,
)
from app.services.image_generation.factory import get_image_generator

__all__ = [
    "BaseImageGenerator",
    "ImageGenerationOptions",
    "ImageReference",
    "GeneratedImageResult",
    "ProviderCapabilities",
    "get_image_generator",
]
