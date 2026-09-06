import logging
from typing import Optional
from app.configuration.config import settings
from .base import BaseLLMProvider
from .mock_provider import MockLLMProvider
from .openai_provider import OpenAIProvider
from .gemini_provider import GeminiProvider
from .anthropic_provider import AnthropicProvider
from .openrouter_provider import OpenRouterProvider

logger = logging.getLogger(__name__)

def get_llm_provider(
    provider_name: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    base_url: Optional[str] = None,
    user_id: Optional[str] = None,
) -> BaseLLMProvider:
    """
    Factory creating the configured LLM provider.
    Reads from user vault credentials (if user_id provided), or environment variables / settings by default.
    Falls back gracefully to MockLLMProvider if credentials are not provided.
    """
    selected_provider = (provider_name or settings.LLM_PROVIDER or "mock").lower().strip()
    key = api_key

    if not key and user_id:
        try:
            from app.services.vault import get_credential_vault
            vault = get_credential_vault()
            cred = vault.get_credential(user_id, selected_provider)
            if cred and cred.get("api_key"):
                key = cred["api_key"]
        except Exception:
            key = None

    if not key:
        key = settings.LLM_API_KEY or ""

    selected_model = model or settings.LLM_MODEL
    url = base_url or settings.LLM_BASE_URL

    if selected_provider == "openrouter":
        router_key = key or settings.OPENROUTER_API_KEY or ""
        if not router_key:
            logger.warning("OpenRouter provider selected but OPENROUTER_API_KEY is not set. Falling back to MockLLMProvider.")
            return MockLLMProvider()
        return OpenRouterProvider(api_key=router_key, model=selected_model or "meta-llama/llama-3.3-70b-instruct:free", base_url=url)

    elif selected_provider == "openai":
        if not key and not url:
            logger.warning("OpenAI provider selected but LLM_API_KEY is not set. Falling back to MockLLMProvider.")
            return MockLLMProvider()
        return OpenAIProvider(api_key=key, model=selected_model or "gpt-4o-mini", base_url=url)

    elif selected_provider == "gemini":
        gemini_key = key or settings.GEMINI_API_KEY or ""
        if not gemini_key:
            logger.warning("Gemini provider selected but GEMINI_API_KEY is not set. Falling back to MockLLMProvider.")
            return MockLLMProvider()
        return GeminiProvider(api_key=gemini_key, model=selected_model or "gemini-1.5-flash")

    elif selected_provider == "anthropic":
        anthropic_key = key or getattr(settings, "ANTHROPIC_API_KEY", "") or ""
        if not anthropic_key:
            logger.warning("Anthropic provider selected but ANTHROPIC_API_KEY is not set. Falling back to MockLLMProvider.")
            return MockLLMProvider()
        return AnthropicProvider(api_key=anthropic_key, model=selected_model or "claude-3-5-sonnet-20241022")

    else:
        # Default mock provider
        return MockLLMProvider()

