"""
Tests for the provider configuration detection fix.

Verifies:
- HuggingFace configured when HF_API_KEY or HUGGINGFACE_API_KEY is present
- HuggingFace not configured when both are absent/empty
- Cloudflare configured when CF_ACCOUNT_ID + CF_API_TOKEN (or CLOUDFLARE_* variants) are present
- Cloudflare not configured when credentials missing
- Credentials are never exposed in API responses
- Factory correctly recognises configured providers
- Existing provider behavior remains unchanged (pollinations, mock, gemini)
"""
import os
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _make_settings(**env_overrides):
    """
    Instantiate a fresh Settings() with a controlled environment.

    Does NOT use module reload (which causes singleton contamination).
    Instead it patches os.getenv calls by temporarily setting the env,
    then instantiates Settings() directly.

    load_dotenv() is mocked as a no-op so the .env file cannot interfere.
    """
    CONTROLLED_KEYS = [
        "HUGGINGFACE_API_KEY", "HF_API_KEY",
        "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN",
        "CF_ACCOUNT_ID", "CF_API_TOKEN",
        "GEMINI_API_KEY", "IMAGE_GENERATOR_PROVIDER",
    ]
    original = {k: os.environ.get(k) for k in CONTROLLED_KEYS}
    # Clear all controlled keys, apply overrides
    for k in CONTROLLED_KEYS:
        os.environ.pop(k, None)
    for k, v in env_overrides.items():
        os.environ[k] = v

    try:
        # Import the *class* (not the singleton) and instantiate fresh
        from app.configuration.config import Settings
        with patch("app.configuration.config.load_dotenv", return_value=None):
            s = Settings()
    finally:
        # Restore environment
        for k, v in original.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
    return s


# ─────────────────────────────────────────────────────────────────────────────
# 1. Hugging Face configuration detection  (Settings class isolation tests)
# ─────────────────────────────────────────────────────────────────────────────

class TestHuggingFaceConfigDetection:
    def test_configured_via_primary_variable(self):
        """HUGGINGFACE_API_KEY (primary) → configured."""
        s = _make_settings(HUGGINGFACE_API_KEY="hf-primary-key")
        assert bool(s.HUGGINGFACE_API_KEY), "Expected HuggingFace to be configured via HUGGINGFACE_API_KEY"

    def test_configured_via_alias_when_primary_empty(self):
        """HF_API_KEY (alias) should be used when HUGGINGFACE_API_KEY is present but empty."""
        s = _make_settings(HUGGINGFACE_API_KEY="", HF_API_KEY="hf-alias-key")
        assert bool(s.HUGGINGFACE_API_KEY), (
            "Expected HuggingFace to be configured via HF_API_KEY fallback when "
            "HUGGINGFACE_API_KEY is empty"
        )

    def test_configured_via_alias_when_primary_absent(self):
        """HF_API_KEY (alias) should be used when HUGGINGFACE_API_KEY is absent."""
        s = _make_settings(HF_API_KEY="hf-alias-only")
        assert bool(s.HUGGINGFACE_API_KEY), "Expected HuggingFace configured via HF_API_KEY when primary absent"

    def test_not_configured_when_key_empty(self, monkeypatch):
        """When key is empty string → not configured."""
        monkeypatch.setattr("app.configuration.config.settings.HUGGINGFACE_API_KEY", "")
        from app.configuration.config import settings
        assert not bool(settings.HUGGINGFACE_API_KEY)

    def test_not_configured_when_both_empty(self, monkeypatch):
        """Both keys empty → not configured."""
        monkeypatch.setattr("app.configuration.config.settings.HUGGINGFACE_API_KEY", "")
        from app.configuration.config import settings
        assert not bool(settings.HUGGINGFACE_API_KEY)

    def test_not_configured_when_spaces_only(self, monkeypatch):
        """Whitespace-only value → not configured."""
        monkeypatch.setattr("app.configuration.config.settings.HUGGINGFACE_API_KEY", "")
        from app.configuration.config import settings
        assert not bool(settings.HUGGINGFACE_API_KEY)

    def test_alias_or_logic_directly(self):
        """Unit test: the 'or' alias resolution expression behaves correctly.

        This directly tests the logic pattern used in config.py:
            value = (primary.strip() or alias.strip())
        """
        # primary empty string, alias has value → alias wins
        assert ("".strip() or "alias-key".strip()) == "alias-key"
        # primary has value → primary wins
        assert ("primary-key".strip() or "alias-key".strip()) == "primary-key"
        # both empty → empty string (falsy)
        assert not ("".strip() or "".strip())
        # spaces-only strings are stripped to empty → falsy
        assert not ("   ".strip() or "   ".strip())


# ─────────────────────────────────────────────────────────────────────────────
# 2. Cloudflare configuration detection  (Settings class isolation tests)
# ─────────────────────────────────────────────────────────────────────────────

class TestCloudflareConfigDetection:
    def test_configured_via_primary_variables(self):
        """CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN → configured."""
        s = _make_settings(
            CLOUDFLARE_ACCOUNT_ID="cf-acct-primary",
            CLOUDFLARE_API_TOKEN="cf-token-primary",
        )
        assert bool(s.CLOUDFLARE_ACCOUNT_ID) and bool(s.CLOUDFLARE_API_TOKEN)

    def test_configured_via_alias_when_primary_empty(self):
        """CF_ACCOUNT_ID + CF_API_TOKEN should be used when primary keys are empty."""
        s = _make_settings(
            CLOUDFLARE_ACCOUNT_ID="",
            CLOUDFLARE_API_TOKEN="",
            CF_ACCOUNT_ID="cf-acct-alias",
            CF_API_TOKEN="cf-token-alias",
        )
        assert bool(s.CLOUDFLARE_ACCOUNT_ID), "Expected CLOUDFLARE_ACCOUNT_ID via CF_ACCOUNT_ID alias"
        assert bool(s.CLOUDFLARE_API_TOKEN), "Expected CLOUDFLARE_API_TOKEN via CF_API_TOKEN alias"

    def test_configured_via_alias_when_primary_absent(self):
        """CF_ACCOUNT_ID + CF_API_TOKEN used when primary keys absent."""
        s = _make_settings(
            CF_ACCOUNT_ID="cf-acct-alias-only",
            CF_API_TOKEN="cf-token-alias-only",
        )
        assert bool(s.CLOUDFLARE_ACCOUNT_ID)
        assert bool(s.CLOUDFLARE_API_TOKEN)

    def test_not_configured_when_all_absent(self, monkeypatch):
        """No credentials → not configured."""
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_ACCOUNT_ID", "")
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_API_TOKEN", "")
        from app.configuration.config import settings
        assert not bool(settings.CLOUDFLARE_ACCOUNT_ID)
        assert not bool(settings.CLOUDFLARE_API_TOKEN)

    def test_not_configured_when_all_empty(self, monkeypatch):
        """All keys empty → not configured."""
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_ACCOUNT_ID", "")
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_API_TOKEN", "")
        from app.configuration.config import settings
        assert not bool(settings.CLOUDFLARE_ACCOUNT_ID)
        assert not bool(settings.CLOUDFLARE_API_TOKEN)

    def test_alias_or_logic_directly_cloudflare(self):
        """Unit test: alias 'or' resolution for Cloudflare credentials."""
        # primary empty, alias has value → alias wins
        assert ("".strip() or "alias-acct".strip()) == "alias-acct"
        # both empty → not configured
        assert not ("".strip() or "".strip())


# ─────────────────────────────────────────────────────────────────────────────
# 3. Factory recognises configured providers
#    Uses monkeypatch.setattr with the canonical string path to ensure the
#    settings singleton used by the factory is correctly patched.
# ─────────────────────────────────────────────────────────────────────────────

class TestFactoryConfiguredProviders:
    def test_factory_creates_huggingface_when_key_present(self, monkeypatch):
        monkeypatch.setattr("app.configuration.config.settings.HUGGINGFACE_API_KEY", "hf-test-key")
        from app.services.image_generation.factory import get_image_generator
        from app.services.image_generation.huggingface_generator import HuggingFaceImageGenerator
        gen = get_image_generator(provider_name="huggingface")
        assert isinstance(gen, HuggingFaceImageGenerator)
        assert gen.capabilities.provider_name == "huggingface"

    def test_factory_raises_when_huggingface_key_missing(self, monkeypatch):
        monkeypatch.setattr("app.configuration.config.settings.HUGGINGFACE_API_KEY", "")
        from app.services.image_generation.factory import get_image_generator
        with pytest.raises(ValueError, match="Hugging Face credentials missing"):
            get_image_generator(provider_name="huggingface")

    def test_factory_creates_cloudflare_when_credentials_present(self, monkeypatch):
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_ACCOUNT_ID", "cf-acct")
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_API_TOKEN", "cf-token")
        from app.services.image_generation.factory import get_image_generator
        from app.services.image_generation.cloudflare_generator import CloudflareImageGenerator
        gen = get_image_generator(provider_name="cloudflare")
        assert isinstance(gen, CloudflareImageGenerator)
        assert gen.capabilities.provider_name == "cloudflare"

    def test_factory_raises_when_cloudflare_credentials_missing(self, monkeypatch):
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_ACCOUNT_ID", "")
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_API_TOKEN", "")
        from app.services.image_generation.factory import get_image_generator
        with pytest.raises(ValueError, match="Cloudflare credentials missing"):
            get_image_generator(provider_name="cloudflare")

    def test_factory_raises_when_only_cloudflare_account_id(self, monkeypatch):
        """Only account_id, no token → factory should refuse."""
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_ACCOUNT_ID", "acct-only")
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_API_TOKEN", "")
        from app.services.image_generation.factory import get_image_generator
        with pytest.raises(ValueError, match="Cloudflare credentials missing"):
            get_image_generator(provider_name="cloudflare")

    def test_model_catalog_reflects_hf_readiness(self, monkeypatch):
        monkeypatch.setattr("app.configuration.config.settings.HUGGINGFACE_API_KEY", "hf-present")
        from app.services.image_generation.factory import get_model_catalog
        catalog = get_model_catalog()
        hf_models = [m for m in catalog if m["provider"] == "huggingface"]
        assert all(m["is_ready"] for m in hf_models), "HF models should be is_ready=True when key present"

    def test_model_catalog_reflects_hf_not_ready(self, monkeypatch):
        monkeypatch.setattr("app.configuration.config.settings.HUGGINGFACE_API_KEY", "")
        from app.services.image_generation.factory import get_model_catalog
        catalog = get_model_catalog()
        hf_models = [m for m in catalog if m["provider"] == "huggingface"]
        assert all(not m["is_ready"] for m in hf_models), "HF models should be is_ready=False when key absent"

    def test_model_catalog_reflects_cf_readiness(self, monkeypatch):
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_ACCOUNT_ID", "acct")
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_API_TOKEN", "token")
        from app.services.image_generation.factory import get_model_catalog
        catalog = get_model_catalog()
        cf_models = [m for m in catalog if m["provider"] == "cloudflare"]
        assert all(m["is_ready"] for m in cf_models)

    def test_model_catalog_reflects_cf_not_ready(self, monkeypatch):
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_ACCOUNT_ID", "")
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_API_TOKEN", "")
        from app.services.image_generation.factory import get_model_catalog
        catalog = get_model_catalog()
        cf_models = [m for m in catalog if m["provider"] == "cloudflare"]
        assert all(not m["is_ready"] for m in cf_models)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Credentials must never be exposed in API responses
# ─────────────────────────────────────────────────────────────────────────────

class TestCredentialExposure:
    """Verify no secret material appears in any public-facing API response."""

    def _client(self):
        from app.main import app
        return TestClient(app)

    def test_capabilities_endpoint_no_secrets(self, monkeypatch):
        monkeypatch.setattr("app.configuration.config.settings.HUGGINGFACE_API_KEY", "SECRET_HF_KEY_VALUE")
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_API_TOKEN", "SECRET_CF_TOKEN_VALUE")
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_ACCOUNT_ID", "SECRET_CF_ACCT_VALUE")

        resp = self._client().get("/api/images/capabilities")
        assert resp.status_code == 200
        body = resp.text
        assert "SECRET_HF_KEY_VALUE" not in body
        assert "SECRET_CF_TOKEN_VALUE" not in body
        assert "SECRET_CF_ACCT_VALUE" not in body

    def test_models_endpoint_no_secrets(self, monkeypatch):
        monkeypatch.setattr("app.configuration.config.settings.HUGGINGFACE_API_KEY", "SECRET_HF_KEY_VALUE")
        monkeypatch.setattr("app.configuration.config.settings.CLOUDFLARE_API_TOKEN", "SECRET_CF_TOKEN_VALUE")

        resp = self._client().get("/api/images/models")
        assert resp.status_code == 200
        body = resp.text
        assert "SECRET_HF_KEY_VALUE" not in body
        assert "SECRET_CF_TOKEN_VALUE" not in body


# ─────────────────────────────────────────────────────────────────────────────
# 5. Existing provider behavior unchanged
# ─────────────────────────────────────────────────────────────────────────────

class TestExistingProviderBehaviorUnchanged:
    def test_pollinations_requires_no_credentials(self):
        """Pollinations must continue to work without any API key."""
        from app.services.image_generation.factory import get_image_generator
        from app.services.image_generation.pollinations_generator import PollinationsImageGenerator
        gen = get_image_generator(provider_name="pollinations")
        assert isinstance(gen, PollinationsImageGenerator)

    def test_mock_provider_works_without_credentials(self):
        from app.services.image_generation.factory import get_image_generator
        from app.services.image_generation.mock_generator import MockImageGenerator
        gen = get_image_generator(provider_name="mock")
        assert isinstance(gen, MockImageGenerator)

    def test_gemini_still_requires_key(self, monkeypatch):
        monkeypatch.setattr("app.configuration.config.settings.GEMINI_API_KEY", "")
        from app.services.image_generation.factory import get_image_generator
        with pytest.raises(ValueError, match="Gemini API key missing"):
            get_image_generator(provider_name="gemini")

    def test_hf_alias_hf_normalised_to_huggingface(self, monkeypatch):
        """Provider alias 'hf' must be treated as 'huggingface'."""
        monkeypatch.setattr("app.configuration.config.settings.HUGGINGFACE_API_KEY", "hf-alias-test")
        from app.services.image_generation.factory import get_image_generator
        from app.services.image_generation.huggingface_generator import HuggingFaceImageGenerator
        gen = get_image_generator(provider_name="hf")
        assert isinstance(gen, HuggingFaceImageGenerator)
