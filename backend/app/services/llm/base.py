from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseLLMProvider(ABC):
    """
    Abstract interface for LLM providers generating visual storyboards.
    Allows swappable implementations (Mock, OpenAI, Gemini, Anthropic) without
    coupling the core application logic to a specific provider.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g., 'mock', 'openai', 'gemini', 'anthropic')."""
        pass

    @abstractmethod
    async def generate_storyboard_scenes(
        self,
        scenes: List[Dict[str, Any]],
        visual_context: Dict[str, Any],
        aspect_ratio: str = "16:9"
    ) -> List[Dict[str, Any]]:
        """
        Generate storyboard metadata for a list of scenes:
        For each scene, returns a dictionary containing:
        - id: str
        - visual_description: str
        - image_prompt: str
        - suggested_motion: str
        - suggested_transition: str
        """
        pass

    @abstractmethod
    async def regenerate_scene(
        self,
        scene: Dict[str, Any],
        visual_context: Dict[str, Any],
        instructions: str = "",
        aspect_ratio: str = "16:9"
    ) -> Dict[str, Any]:
        """
        Regenerate storyboard metadata for a single scene with optional custom instructions.
        Returns:
        - visual_description: str
        - image_prompt: str
        - suggested_motion: str
        - suggested_transition: str
        """
        pass
