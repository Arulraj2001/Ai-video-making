import base64
import json
import pytest
import httpx
from unittest.mock import AsyncMock, patch, MagicMock

from app.services.image_generation.openai_generator import OpenAIImageGenerator
from app.services.image_generation.base import ImageGenerationOptions, ImageReference
from app.services.image_generation.factory import (
    get_image_generator,
    get_available_providers,
    get_model_catalog,
)


def test_openai_generator_init_validation():
    with pytest.raises(ValueError, match="OpenAI API key missing"):
        OpenAIImageGenerator(api_key="")

    with pytest.raises(ValueError, match="OpenAI API key missing"):
        OpenAIImageGenerator(api_key="   ")

    gen = OpenAIImageGenerator(api_key="sk-test-key-12345")
    assert gen.model_name == "dall-e-3"
    assert gen.capabilities.provider_name == "openai"
    assert gen.capabilities.model_name == "dall-e-3"
    assert "16:9" in gen.capabilities.supported_aspect_ratios
    assert "9:16" in gen.capabilities.supported_aspect_ratios
    assert "1:1" in gen.capabilities.supported_aspect_ratios


def test_openai_aspect_ratio_dimensions():
    gen = OpenAIImageGenerator(api_key="sk-test")
    assert gen._get_size_for_aspect_ratio("16:9") == "1792x1024"
    assert gen._get_size_for_aspect_ratio("9:16") == "1024x1792"
    assert gen._get_size_for_aspect_ratio("1:1") == "1024x1024"
    assert gen._get_size_for_aspect_ratio("widescreen") == "1792x1024"
    assert gen._get_size_for_aspect_ratio("portrait") == "1024x1792"


@pytest.mark.anyio
async def test_openai_generate_image_success():
    fake_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR..."
    b64_data = base64.b64encode(fake_png_bytes).decode("ascii")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "created": 12345678,
        "data": [
            {
                "b64_json": b64_data,
                "revised_prompt": "A majestic cinematic mountain peak at sunset.",
            }
        ],
    }

    mock_http_client = AsyncMock()
    mock_http_client.post.return_value = mock_resp

    gen = OpenAIImageGenerator(api_key="sk-test-123", http_client=mock_http_client)
    opts = ImageGenerationOptions(aspect_ratio="16:9")
    result = await gen.generate_image("A majestic mountain peak", opts)

    assert result.provider == "openai"
    assert result.model == "dall-e-3"
    assert result.image_bytes == fake_png_bytes
    assert result.metadata["aspect_ratio"] == "16:9"
    assert result.metadata["dimensions"] == "1792x1024"
    assert result.metadata["revised_prompt"] == "A majestic cinematic mountain peak at sunset."

    # Verify request payload
    call_kwargs = mock_http_client.post.call_args[1]
    assert call_kwargs["json"]["model"] == "dall-e-3"
    assert call_kwargs["json"]["size"] == "1792x1024"
    assert call_kwargs["json"]["response_format"] == "b64_json"


@pytest.mark.anyio
async def test_openai_generate_image_with_references():
    fake_png_bytes = b"fake-png-data"
    b64_data = base64.b64encode(fake_png_bytes).decode("ascii")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "data": [{"b64_json": b64_data, "revised_prompt": "Prompt with references"}]
    }

    mock_http_client = AsyncMock()
    mock_http_client.post.return_value = mock_resp

    gen = OpenAIImageGenerator(api_key="sk-test-123", http_client=mock_http_client)
    refs = [
        ImageReference(
            entity_type="character",
            entity_name="Commander Shepard",
            description="Scarred veteran in N7 armor with dark hair",
        )
    ]
    opts = ImageGenerationOptions(aspect_ratio="1:1")
    result = await gen.generate_image_with_references(
        "Standing on the bridge of the Normandy", refs, opts
    )

    assert result.provider == "openai"
    assert "Commander Shepard" in result.metadata["references_used"]

    # Verify reference was injected into prompt payload
    call_kwargs = mock_http_client.post.call_args[1]
    sent_prompt = call_kwargs["json"]["prompt"]
    assert "Commander Shepard" in sent_prompt
    assert "N7 armor" in sent_prompt


@pytest.mark.anyio
async def test_openai_error_handling_401():
    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.json.return_value = {"error": {"message": "Incorrect API key provided."}}

    mock_http_client = AsyncMock()
    mock_http_client.post.return_value = mock_resp

    gen = OpenAIImageGenerator(api_key="sk-invalid", http_client=mock_http_client)
    with pytest.raises(RuntimeError, match="OpenAI API key invalid"):
        await gen.generate_image("Test prompt", ImageGenerationOptions())


@pytest.mark.anyio
async def test_openai_error_handling_429():
    mock_resp = MagicMock()
    mock_resp.status_code = 429
    mock_resp.json.return_value = {"error": {"message": "You exceeded your current quota."}}

    mock_http_client = AsyncMock()
    mock_http_client.post.return_value = mock_resp

    gen = OpenAIImageGenerator(api_key="sk-quota-exceeded", http_client=mock_http_client)
    with pytest.raises(RuntimeError, match="OpenAI quota or rate limit reached"):
        await gen.generate_image("Test prompt", ImageGenerationOptions())


def test_factory_openai_provider_available():
    providers = get_available_providers()
    assert "openai" in providers


def test_factory_get_image_generator_openai():
    with patch("app.services.image_generation.factory.settings") as mock_settings:
        mock_settings.OPENAI_API_KEY = "sk-env-test-key"
        mock_settings.IMAGE_GENERATOR_MODEL = None
        mock_settings.OPENAI_IMAGE_MODEL = "dall-e-3"

        gen = get_image_generator(provider_name="openai")
        assert isinstance(gen, OpenAIImageGenerator)
        assert gen.model_name == "dall-e-3"


def test_factory_catalog_openai_and_personalization():
    catalog = get_model_catalog()
    openai_item = next((m for m in catalog if m["id"] == "openai-dall-e-3"), None)
    assert openai_item is not None
    assert openai_item["provider"] == "openai"
    assert openai_item["model_id"] == "dall-e-3"
    assert openai_item["is_free"] is False

    # When user has credential in vault, is_ready is True
    with patch("app.services.vault.get_credential_vault") as mock_get_vault:
        mock_vault = MagicMock()
        mock_vault.has_credential.side_effect = lambda uid, prov: prov == "openai"
        mock_get_vault.return_value = mock_vault

        personalized_catalog = get_model_catalog(user_id="user_abc123")
        personalized_openai = next(
            (m for m in personalized_catalog if m["id"] == "openai-dall-e-3"), None
        )
        assert personalized_openai is not None
        assert personalized_openai["is_ready"] is True


def test_routes_models_catalog_includes_openai():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    response = client.get("/api/images/models")
    assert response.status_code == 200
    data = response.json()
    model_ids = [m["id"] for m in data["models"]]
    assert "openai-dall-e-3" in model_ids


def test_routes_models_catalog_with_authenticated_user_vault():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    with patch("app.services.vault.get_credential_vault") as mock_get_vault:
        mock_vault = MagicMock()
        mock_vault.has_credential.side_effect = (
            lambda uid, prov: prov == "openai" and uid == "user-vault-test"
        )
        mock_get_vault.return_value = mock_vault

        response = client.get(
            "/api/images/models",
            headers={"Authorization": "Bearer test-token-user-vault-test"},
        )
        assert response.status_code == 200
        data = response.json()
        openai_model = next(
            (m for m in data["models"] if m["id"] == "openai-dall-e-3"), None
        )
        assert openai_model is not None
        assert openai_model["is_ready"] is True

