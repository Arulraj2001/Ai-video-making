import logging
from typing import Optional
from app.configuration.config import settings
from .base import BaseLLMProvider
from .mock_provider import MockLLMProvider
from .openai_provider import OpenAIProvider
from .gemini_provider import GeminiProvider
from .anthropic_provider import AnthropicProvider

logger = logging.getLogger(__name__)

def get_llm_provider(
    provider_name: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    base_url: Optional[str] = None
) -> BaseLLMProvider:
    """
    Factory creating the configured LLM provider.
    Reads from environment variables / settings by default.
    Falls back gracefully to MockLLMProvider if credentials are not provided.
    """
    selected_provider = (provider_name or settings.LLM_PROVIDER or "mock").lower().strip()
    key = api_key or settings.LLM_API_KEY or ""
    selected_model = model or settings.LLM_MODEL
    url = base_url or settings.LLM_BASE_URL

    if selected_provider == "openai":
        if not key and not url:
            logger.warning("OpenAI provider selected but LLM_API_KEY is not set. Falling back to MockLLMProvider.")
            return MockLLMProvider()
        return OpenAIProvider(api_key=key, model=selected_model or "gpt-4o-mini", base_url=url)

    elif selected_provider == "gemini":
        if not key:
            logger.warning("Gemini provider selected but LLM_API_KEY is not set. Falling back to MockLLMProvider.")
            return MockLLMProvider()
        return GeminiProvider(api_key=key, model=selected_model or "gemini-1.5-flash")

    elif selected_provider == "anthropic":
        if not key:
            logger.warning("Anthropic provider selected but LLM_API_KEY is not set. Falling back to MockLLMProvider.")
            return MockLLMProvider()
        return AnthropicProvider(api_key=key, model=selected_model or "claude-3-5-sonnet-20241022")

    else:
        # Default mock provider
        return MockLLMProvider()
