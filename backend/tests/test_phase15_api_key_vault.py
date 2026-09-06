import os
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.vault.credential_vault import CredentialVault, SUPPORTED_PROVIDERS_CATALOG
from app.utils.security import generate_key_hint, sanitize_secrets
from app.services.image_generation.factory import get_image_generator
from app.services.llm.factory import get_llm_provider
from app.api.dependencies.auth import get_current_user, AuthenticatedUser

client = TestClient(app)


# ---------------------------------------------------------------------------
# 1. Cryptographic AES-256-GCM Vault Unit Tests
# ---------------------------------------------------------------------------

def test_aes_gcm_encrypt_decrypt_roundtrip(tmp_path, monkeypatch):
    """Verifies that encryption and decryption round-trip perfectly preserving secrets."""
    monkeypatch.setattr("app.services.vault.credential_vault.Path", lambda p: tmp_path / p)
    vault = CredentialVault(encryption_key="test-secure-master-key-32-chars-long!")

    secret = "sk-test-openai-credential-secret-key-12345"
    user_id = "user_alpha"
    provider = "openai"

    ct_b64, nonce_b64 = vault.encrypt(secret, user_id, provider)

    # Ciphertext and nonce must be valid non-empty strings, distinct from plaintext
    assert ct_b64 != secret
    assert nonce_b64 != secret
    assert len(ct_b64) > 10
    assert len(nonce_b64) > 10

    # Decrypt returns exact original secret
    decrypted = vault.decrypt(ct_b64, nonce_b64, user_id, provider)
    assert decrypted == secret


def test_nonce_uniqueness(tmp_path, monkeypatch):
    """Encrypting the exact same plaintext twice must produce different nonces and ciphertexts."""
    monkeypatch.setattr("app.services.vault.credential_vault.Path", lambda p: tmp_path / p)
    vault = CredentialVault()

    secret = "AIzaSySecretGoogleApiKey9876543210"
    user_id = "user_beta"
    provider = "gemini"

    ct1, nonce1 = vault.encrypt(secret, user_id, provider)
    ct2, nonce2 = vault.encrypt(secret, user_id, provider)

    assert nonce1 != nonce2
    assert ct1 != ct2


def test_aad_cryptographic_binding_cross_user_fails(tmp_path, monkeypatch):
    """Ciphertext encrypted for User A cannot be decrypted by User B (AAD mismatch raises error)."""
    monkeypatch.setattr("app.services.vault.credential_vault.Path", lambda p: tmp_path / p)
    vault = CredentialVault()

    secret = "hf_myHuggingFaceAccessToken123456"
    ct, nonce = vault.encrypt(secret, user_id="user_owner", provider="huggingface")

    # Attempting to decrypt under an imposter user ID must fail
    with pytest.raises(ValueError) as exc_info:
        vault.decrypt(ct, nonce, user_id="user_attacker", provider="huggingface")
    assert "integrity check failed" in str(exc_info.value)


def test_aad_cryptographic_binding_cross_provider_fails(tmp_path, monkeypatch):
    """Ciphertext encrypted for Provider A cannot be decrypted as Provider B."""
    monkeypatch.setattr("app.services.vault.credential_vault.Path", lambda p: tmp_path / p)
    vault = CredentialVault()

    secret = "sk-ant-claudeAnthropicApiKey12345678"
    ct, nonce = vault.encrypt(secret, user_id="user_owner", provider="anthropic")

    # Swapping provider in AAD must fail decryption
    with pytest.raises(ValueError) as exc_info:
        vault.decrypt(ct, nonce, user_id="user_owner", provider="openai")
    assert "integrity check failed" in str(exc_info.value)


# ---------------------------------------------------------------------------
# 2. Key Masking & Secret Sanitation Tests
# ---------------------------------------------------------------------------

def test_generate_key_hint():
    """Ensures masked hints only reveal last 4 characters and never expose key body."""
    hint1 = generate_key_hint("sk-1234567890abcdef")
    assert hint1 == "••••••••cdef"

    hint2 = generate_key_hint("AIzaSyVeryLongKeyABCD1234")
    assert hint2 == "••••••••1234"

    hint_short = generate_key_hint("abc")
    assert hint_short == "••••••••"

    assert generate_key_hint(None) == "Not configured"
    assert generate_key_hint("") == "Not configured"


def test_sanitize_secrets():
    """Ensures secret patterns are scrubbed from error logs and exception messages."""
    raw_error = "Failed connecting with API key sk-proj-12345678901234567890 in header"
    clean = sanitize_secrets(raw_error)
    assert "sk-proj-12345678901234567890" not in clean
    assert "[REDACTED]" in clean

    hf_error = "Unauthorized: token hf_AbCdEfGhIjKlMnOpQrStUvWxYz is invalid"
    assert "hf_AbCdEfGhIjKlMnOpQrStUvWxYz" not in sanitize_secrets(hf_error)
    assert "[REDACTED]" in sanitize_secrets(hf_error)


# ---------------------------------------------------------------------------
# 3. Vault Storage & Multi-User Isolation Tests
# ---------------------------------------------------------------------------

def test_vault_user_isolation(tmp_path, monkeypatch):
    """Verifies that User A's stored keys are completely invisible and inaccessible to User B."""
    monkeypatch.setattr("app.services.vault.credential_vault.Path", lambda p: tmp_path / p)
    vault = CredentialVault()

    user_a = "user_alice_uid_101"
    user_b = "user_bob_uid_202"

    # User A saves Gemini key
    vault.store_credential(
        user_id=user_a,
        provider="gemini",
        secret="AIzaSyAliceSecretKey1234567890",
        label="Alice Gemini",
    )

    # User A can retrieve it
    cred_a = vault.get_credential(user_a, "gemini")
    assert cred_a is not None
    assert cred_a["api_key"] == "AIzaSyAliceSecretKey1234567890"

    # User B checks Gemini: must NOT receive Alice's key
    cred_b = vault.get_credential(user_b, "gemini")
    assert cred_b is None

    # User A deletes their key
    vault.delete_credential(user_a, "gemini")
    assert vault.get_credential(user_a, "gemini") is None


def test_vault_metadata_never_leaks_plaintext(tmp_path, monkeypatch):
    """Metadata listing must never include ciphertext or plaintext secret."""
    monkeypatch.setattr("app.services.vault.credential_vault.Path", lambda p: tmp_path / p)
    vault = CredentialVault()

    user_id = "user_charlie_303"
    secret = "sk-openrouter-secret-super-long-token-9999"

    vault.store_credential(user_id=user_id, provider="openrouter", secret=secret)
    metadata_list = vault.list_credentials_metadata(user_id)

    openrouter_meta = next((m for m in metadata_list if m.provider == "openrouter"), None)
    assert openrouter_meta is not None
    assert openrouter_meta.configured is True
    assert openrouter_meta.key_hint == "••••••••9999"

    # Assert model dump / dict has zero secret material
    meta_dict = openrouter_meta.model_dump()
    assert secret not in str(meta_dict)
    assert "ciphertext" not in meta_dict


# ---------------------------------------------------------------------------
# 4. FastAPI Vault Endpoint Integration Tests
# ---------------------------------------------------------------------------

def test_api_keys_endpoints_authenticated():
    """Tests GET, POST, DELETE /api/api-keys with mocked authentication."""
    from app.api.dependencies.auth import get_required_user
    test_uid = "vault_test_creator_555"

    def mock_get_user():
        return AuthenticatedUser(
            uid=test_uid,
            email="creator@scenoraedits.ai",
            is_admin=False,
        )

    app.dependency_overrides[get_required_user] = mock_get_user

    try:
        # 1. GET /api/api-keys: returns supported catalog
        res = client.get("/api/api-keys")
        assert res.status_code == 200
        data = res.json()
        assert "providers" in data
        assert len(data["providers"]) >= len(SUPPORTED_PROVIDERS_CATALOG)

        # 2. POST /api/api-keys: store OpenAI key
        secret_key = "sk-test-openai-secret-key-for-fastapi-vault-8888"
        save_res = client.post(
            "/api/api-keys",
            json={
                "provider": "openai",
                "api_key": secret_key,
                "label": "My Test OpenAI Key",
            },
        )
        assert save_res.status_code == 200
        save_data = save_res.json()
        assert save_data["configured"] is True
        assert save_data["key_hint"] == "••••••••8888"
        # Zero plaintext leakage
        assert secret_key not in str(save_data)

        # 3. GET /api/api-keys confirms OpenAI is now configured
        res2 = client.get("/api/api-keys")
        providers = {p["provider"]: p for p in res2.json()["providers"]}
        assert providers["openai"]["configured"] is True
        assert providers["openai"]["key_hint"] == "••••••••8888"

        # 4. POST /api/api-keys/openai/test
        test_res = client.post("/api/api-keys/openai/test")
        assert test_res.status_code == 200
        # Should return result without leaking secrets
        test_data = test_res.json()
        assert "valid" in test_data
        assert secret_key not in str(test_data)

        # 5. DELETE /api/api-keys/openai
        del_res = client.delete("/api/api-keys/openai")
        assert del_res.status_code == 200
        assert del_res.json()["deleted"] is True

        # 6. GET /api/api-keys confirms OpenAI is now unconfigured
        res3 = client.get("/api/api-keys")
        providers3 = {p["provider"]: p for p in res3.json()["providers"]}
        assert providers3["openai"]["configured"] is False

    finally:
        app.dependency_overrides.pop(get_required_user, None)


def test_api_keys_unauthenticated_rejected():
    """Requests without auth token to vault endpoints must be rejected with 401."""
    from app.api.dependencies.auth import get_required_user
    # Ensure dependency overrides are clear
    app.dependency_overrides.pop(get_required_user, None)

    res = client.get("/api/api-keys")
    assert res.status_code in (401, 403)


# ---------------------------------------------------------------------------
# 5. Provider Resolution via Vault Credentials
# ---------------------------------------------------------------------------

def test_image_generator_resolves_user_vault_key(tmp_path, monkeypatch):
    """Image generation factory uses the user's decrypted key when user_id is provided."""
    from app.services.vault import get_credential_vault
    vault = get_credential_vault()

    test_uid = "user_custom_gemini_uid_777"
    user_gemini_key = "AIzaSyCustomUserGeminiKeyForImageGen"

    vault.store_credential(
        user_id=test_uid,
        provider="gemini",
        secret=user_gemini_key,
    )

    # get_image_generator with user_id resolves user's key
    gen = get_image_generator(provider_name="gemini", user_id=test_uid)
    assert gen is not None
    assert gen._api_key == user_gemini_key

    # Cleanup
    vault.delete_credential(test_uid, "gemini")


def test_llm_provider_resolves_user_vault_key():
    """LLM provider factory uses the user's decrypted key when user_id is provided."""
    from app.services.vault import get_credential_vault
    vault = get_credential_vault()

    test_uid = "user_custom_openrouter_uid_888"
    user_router_key = "sk-or-v1-custom-openrouter-key-from-vault"

    vault.store_credential(
        user_id=test_uid,
        provider="openrouter",
        secret=user_router_key,
    )

    # get_llm_provider with user_id resolves user's custom key
    llm = get_llm_provider(provider_name="openrouter", user_id=test_uid)
    assert llm is not None
    assert getattr(llm, "api_key", None) == user_router_key

    # Cleanup
    vault.delete_credential(test_uid, "openrouter")
