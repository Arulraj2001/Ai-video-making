from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ImageGenerationOptions(BaseModel):
    aspect_ratio: str = Field(default="16:9", description="Target aspect ratio e.g. 16:9, 9:16, 1:1")
    width: int = Field(default=1024, description="Target pixel width")
    height: int = Field(default=576, description="Target pixel height")
    negative_prompt: Optional[str] = Field(default="text, watermark, logo, blurry, distorted, low quality, artifact", description="Negative prompt directives")
    seed: Optional[int] = Field(default=None, description="Deterministic generation seed if supported")
    num_inference_steps: Optional[int] = Field(default=25, description="Inference steps")
    guidance_scale: Optional[float] = Field(default=7.5, description="Guidance scale / CFG")
    extra_params: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Provider-specific parameters")

class ImageReference(BaseModel):
    entity_type: str = Field(..., description="Character, location, or object")
    entity_name: str = Field(..., description="Name of the entity")
    image_path: Optional[str] = Field(default=None, description="Local filesystem path to reference image")
    image_url: Optional[str] = Field(default=None, description="Public media URL to reference image")
    description: Optional[str] = Field(default=None, description="Visual description of the entity for prompt augmentation")

class GeneratedImageResult(BaseModel):
    image_bytes: bytes
    content_type: str = Field(default="image/png", description="MIME type of the generated image")
    provider: str = Field(..., description="Name of the provider adapter used")
    model: str = Field(..., description="Model identifier used")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Generation metadata (dimensions, aspect_ratio, seed, references_used, etc.)")

class ProviderCapabilities(BaseModel):
    provider_name: str
    model_name: str
    supports_reference_images: bool
    supports_negative_prompt: bool
    supported_aspect_ratios: List[str]
    notes: str
    supports_seed: bool = False
    supports_aspect_ratio: bool = True
    supports_image_to_image: bool = False
    supports_reference_descriptions: bool = True
    supports_variations: bool = True

class BaseImageGenerator(ABC):
    """
    Abstract ImageGenerator interface for AI Video Maker.
    Ensures provider-agnostic image generation and capability handling.
    """

    @property
    @abstractmethod
    def capabilities(self) -> ProviderCapabilities:
        """Returns the capabilities of this generator provider/model."""
        pass

    @abstractmethod
    async def generate_image(self, prompt: str, options: ImageGenerationOptions) -> GeneratedImageResult:
        """
        Generates an image from a text prompt and generation options.
        """
        pass

    @abstractmethod
    async def generate_image_with_references(
        self,
        prompt: str,
        references: List[ImageReference],
        options: ImageGenerationOptions
    ) -> GeneratedImageResult:
        """
        Generates an image conditioned on prompt and visual reference images/entities.
        """
        pass
