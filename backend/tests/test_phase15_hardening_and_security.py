import json
import logging
import os
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.configuration.config import Settings, validate_security_configuration, INSECURE_PLACEHOLDER_KEYS
from app.services.vault.credential_vault import CredentialVault, SUPPORTED_PROVIDERS_CATALOG
from app.utils.security import generate_key_hint, sanitize_secrets
from app.api.dependencies.auth import get_required_user, AuthenticatedUser
from app.services.repository.project_repository import serialize_project
from app.models.project import ProjectModel
from app.models.scene import SceneModel
from app.models.video_bible import VideoBibleModel

client = TestClient(app)

TEST_MASTER_KEY = "1bc258c9647e98da7e6bdba716ae39725ddf78c743b54ef02b5ea18f8049f1a9"


# ---------------------------------------------------------------------------
# TEST 1 & TEST 2: Credential encrypted at rest & Plaintext absent from storage
# ---------------------------------------------------------------------------

def test_credential_encrypted_at_rest_and_plaintext_absent(tmp_path, monkeypatch):
    """TEST 1 & 2: Verify credential is encrypted with AES-256-GCM and plaintext is absent from storage."""
    monkeypatch.setattr("app.services.vault.credential_vault.Path", lambda p: tmp_path / p)
    monkeypatch.setattr("app.services.vault.credential_vault.settings.CREDENTIAL_VAULT_BACKEND", "local")

    vault = CredentialVault(encryption_key=TEST_MASTER_KEY)
    secret_key = "sk-test-live-production-secret-9999"
    user_id = "user_sec_01"
    provider = "openai"

    meta = vault.store_credential(user_id=user_id, provider=provider, secret=secret_key, label="OpenAI Prod")

    # Verify masked hint
    assert meta.key_hint == "••••••••9999"

    # Read raw record directly from disk storage
    local_file = tmp_path / "storage" / "vault" / user_id / f"{provider}.json"
    assert local_file.exists()

    with open(local_file, "r", encoding="utf-8") as f:
        stored_raw = f.read()
        stored_data = json.loads(stored_raw)

    # Plaintext secret MUST NOT appear anywhere in the file
    assert secret_key not in stored_raw
    assert "ciphertext" in stored_data
    assert "nonce" in stored_data
    assert stored_data["ciphertext"] != secret_key
    assert stored_data["nonce"] != secret_key


# ---------------------------------------------------------------------------
# TEST 3: Plaintext credential absent from frontend / API response
# ---------------------------------------------------------------------------

def test_plaintext_absent_from_api_response():
    """TEST 3: Full API key must never appear in API responses (only masked hint)."""
    user_id = "user_api_caller_02"
    secret_key = "sk-ant-test-anthropic-super-secret-key-4321"

    def mock_get_user():
        return AuthenticatedUser(uid=user_id, email="creator2@scenoraedits.com", is_admin=False)

    app.dependency_overrides[get_required_user] = mock_get_user

    try:
        # Save key via API
        save_resp = client.post(
            "/api/api-keys",
            json={"provider": "anthropic", "api_key": secret_key, "label": "My Anthropic"},
        )
        assert save_resp.status_code == 200
        save_data = save_resp.json()

        assert save_data["configured"] is True
        assert save_data["key_hint"] == "••••••••4321"
        assert secret_key not in json.dumps(save_data)

        # List keys via API
        list_resp = client.get("/api/api-keys")
        assert list_resp.status_code == 200
        list_data = list_resp.json()
        assert secret_key not in json.dumps(list_data)

        # Cleanup
        client.delete("/api/api-keys/anthropic")
    finally:
        app.dependency_overrides.pop(get_required_user, None)


# ---------------------------------------------------------------------------
# TEST 4: Credential survives backend restart / reinitialization
# ---------------------------------------------------------------------------

def test_credential_survives_backend_restart(tmp_path, monkeypatch):
    """TEST 4: Stored credential must survive complete vault instance destruction and reinitialization."""
    monkeypatch.setattr("app.services.vault.credential_vault.Path", lambda p: tmp_path / p)
    monkeypatch.setattr("app.services.vault.credential_vault.settings.CREDENTIAL_VAULT_BACKEND", "local")

    user_id = "restart_test_user_03"
    secret_key = "AIzaSyRestartVerificationGoogleSecretKey5555"

    # 1. Instance A writes credential
    vault_a = CredentialVault(encryption_key=TEST_MASTER_KEY)
    vault_a.store_credential(user_id=user_id, provider="gemini", secret=secret_key)

    # 2. Simulate complete process termination (destroy memory cache & instance A)
    del vault_a

    # 3. Instance B starts up fresh with the same master encryption key
    vault_b = CredentialVault(encryption_key=TEST_MASTER_KEY)
    retrieved = vault_b.get_credential(user_id=user_id, provider="gemini")

    assert retrieved is not None
    assert retrieved["api_key"] == secret_key
    assert retrieved["key_hint"] == "••••••••5555"


# ---------------------------------------------------------------------------
# TEST 5: Wrong encryption key cannot decrypt credential
# ---------------------------------------------------------------------------

def test_wrong_encryption_key_cannot_decrypt(tmp_path, monkeypatch):
    """TEST 5: If master encryption key differs across instances, decryption must fail closed."""
    monkeypatch.setattr("app.services.vault.credential_vault.Path", lambda p: tmp_path / p)
    monkeypatch.setattr("app.services.vault.credential_vault.settings.CREDENTIAL_VAULT_BACKEND", "local")

    user_id = "wrong_key_user_04"
    secret_key = "hf_tokenSecretKeyForWrongKeyTest"

    # Write with Master Key A
    vault_a = CredentialVault(encryption_key=TEST_MASTER_KEY)
    vault_a.store_credential(user_id=user_id, provider="huggingface", secret=secret_key)
    del vault_a

    # Read with different Master Key B
    different_key = "2cd369d0758f09eb8f7ceca327bf40836ee089d854c65f033c6fb29f9150f2b0"
    vault_b = CredentialVault(encryption_key=different_key)

    # Decryption must fail and return None (fail closed)
    retrieved = vault_b.get_credential(user_id=user_id, provider="huggingface")
    assert retrieved is None


# ---------------------------------------------------------------------------
# TEST 6: Modified ciphertext fails authentication (AAD Tamper Protection)
# ---------------------------------------------------------------------------

def test_modified_ciphertext_fails_authentication(tmp_path, monkeypatch):
    """TEST 6: Tampering with ciphertext or nonce causes AES-GCM AEAD authentication to fail."""
    monkeypatch.setattr("app.services.vault.credential_vault.Path", lambda p: tmp_path / p)
    vault = CredentialVault(encryption_key=TEST_MASTER_KEY)

    secret = "sk-valid-unmodified-token-1111"
    ct_b64, nonce_b64 = vault.encrypt(secret, "user_05", "openai")

    # Modify 1 character in the ciphertext
    tampered_ct = ("A" if ct_b64[5] != "A" else "B") + ct_b64[1:]

    with pytest.raises(ValueError) as exc:
        vault.decrypt(tampered_ct, nonce_b64, "user_05", "openai")
    assert "integrity check failed" in str(exc.value)


# ---------------------------------------------------------------------------
# TEST 7, 8, 9: Cross-User Isolation (Access, Modify, Delete)
# ---------------------------------------------------------------------------

def test_cross_user_secret_isolation(tmp_path, monkeypatch):
    """TEST 7, 8, 9: User A and User B cannot access, modify, or delete each other's credentials."""
    monkeypatch.setattr("app.services.vault.credential_vault.Path", lambda p: tmp_path / p)
    monkeypatch.setattr("app.services.vault.credential_vault.settings.CREDENTIAL_VAULT_BACKEND", "local")

    vault = CredentialVault(encryption_key=TEST_MASTER_KEY)
    monkeypatch.setattr("app.services.vault.credential_vault.get_credential_vault", lambda: vault)
    monkeypatch.setattr("app.api.routes.api_keys.get_credential_vault", lambda: vault)

    user_a = "user_alice_uid_777"
    user_b = "user_bob_uid_888"

    secret_a = "sk-alice-openai-key-AAAA"
    secret_b = "sk-bob-openai-key-BBBB"

    # User A stores secret A, User B stores secret B for the SAME provider
    vault.store_credential(user_id=user_a, provider="openai", secret=secret_a)
    vault.store_credential(user_id=user_b, provider="openai", secret=secret_b)

    # TEST 7: Isolation
    cred_a = vault.get_credential(user_a, "openai")
    cred_b = vault.get_credential(user_b, "openai")
    assert cred_a["api_key"] == secret_a
    assert cred_b["api_key"] == secret_b
    assert cred_a["api_key"] != cred_b["api_key"]

    # TEST 8: User A cannot modify User B's credential via API
    def mock_user_a():
        return AuthenticatedUser(uid=user_a, email="alice@test.com", is_admin=False)

    app.dependency_overrides[get_required_user] = mock_user_a
    try:
        # Alice updates her key
        alice_new_secret = "sk-alice-updated-key-CCCC"
        client.post("/api/api-keys", json={"provider": "openai", "api_key": alice_new_secret})

        # Verify Bob's key is completely untouched
        bob_check = vault.get_credential(user_b, "openai")
        assert bob_check["api_key"] == secret_b

        # TEST 9: Alice deletes her key
        del_resp = client.delete("/api/api-keys/openai")
        assert del_resp.status_code == 200

        # Verify Alice's key is gone, but Bob's key remains active
        assert vault.get_credential(user_a, "openai") is None
        bob_after_delete = vault.get_credential(user_b, "openai")
        assert bob_after_delete is not None
        assert bob_after_delete["api_key"] == secret_b

    finally:
        app.dependency_overrides.pop(get_required_user, None)


# ---------------------------------------------------------------------------
# TEST 10: Full credential never appears in logs
# ---------------------------------------------------------------------------

def test_full_credential_never_in_logs():
    """TEST 10: SensitiveDataFilter redacts any API key pattern from log records."""
    from app.configuration.logging_config import SensitiveDataFilter

    filt = SensitiveDataFilter()
    logger = logging.getLogger("test_redaction_logger")
    logger.setLevel(logging.INFO)

    secret = "sk-proj-superSecretOpenAiKey9988776655"
    record = logging.LogRecord(
        name="test",
        level=logging.ERROR,
        pathname="test.py",
        lineno=1,
        msg=f"OpenAI error: failed request with authorization header Bearer {secret}",
        args=(),
        exc_info=None,
    )

    filt.filter(record)
    assert secret not in record.msg
    assert "[REDACTED]" in record.msg


# ---------------------------------------------------------------------------
# TEST 11: Full credential never appears in project data
# ---------------------------------------------------------------------------

def test_full_credential_never_in_project_data():
    """TEST 11: Project serialization never includes API keys, and scrubs errors."""
    secret = "AIzaSySecretApiKeyLeakedInExceptionMsg"

    proj = ProjectModel(
        id="proj_sec_101",
        name="Security Audit Project",
        video_bible=VideoBibleModel(),
        scenes=[
            SceneModel(
                id="scene-01",
                start=0.0,
                end=3.0,
                duration=3.0,
                caption="Testing scene",
                image_error=f"Gemini API returned error for key {secret}: 403 Forbidden",
            )
        ],
    )

    serialized = serialize_project(proj)
    serialized_str = json.dumps(serialized)

    # The raw secret must be completely sanitized from project JSON
    assert secret not in serialized_str
    assert "[REDACTED]" in serialized["scenes"][0]["image_error"]


# ---------------------------------------------------------------------------
# TEST 12: Full credential never in frontend storage
# ---------------------------------------------------------------------------

def test_full_credential_never_in_frontend_storage():
    """TEST 12: Verify frontend code never writes API keys to localStorage or sessionStorage."""
    frontend_dir = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "src")
    assert os.path.exists(frontend_dir), f"Frontend directory not found at {frontend_dir}"

    prohibited_patterns = [
        "localStorage.setItem('api_key'",
        'localStorage.setItem("api_key"',
        "localStorage.setItem('apiKey'",
        'localStorage.setItem("apiKey"',
        "sessionStorage.setItem('api_key'",
        'sessionStorage.setItem("api_key"',
    ]

    for root, _, files in os.walk(frontend_dir):
        for file in files:
            if file.endswith((".ts", ".tsx", ".js", ".jsx")):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                    for pat in prohibited_patterns:
                        assert pat not in content, f"Prohibited storage pattern '{pat}' found in {path}"


# ---------------------------------------------------------------------------
# TEST 13: Production fails closed without secure encryption key
# ---------------------------------------------------------------------------

def test_production_fails_closed_without_encryption_key():
    """TEST 13: System refuses to start in production if master key is missing or insecure."""
    # Test missing key
    prod_missing_settings = Settings()
    prod_missing_settings.ENVIRONMENT = "production"
    prod_missing_settings.SCENORA_CREDENTIAL_ENCRYPTION_KEY = ""
    prod_missing_settings.CREDENTIAL_VAULT_BACKEND = "firestore"

    with pytest.raises(RuntimeError) as exc1:
        validate_security_configuration(prod_missing_settings)
    assert "SCENORA_CREDENTIAL_ENCRYPTION_KEY is required in production" in str(exc1.value)

    # Test placeholder key
    prod_placeholder_settings = Settings()
    prod_placeholder_settings.ENVIRONMENT = "production"
    prod_placeholder_settings.SCENORA_CREDENTIAL_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    prod_placeholder_settings.CREDENTIAL_VAULT_BACKEND = "firestore"

    with pytest.raises(RuntimeError) as exc2:
        validate_security_configuration(prod_placeholder_settings)
    assert "insecure placeholder key in production" in str(exc2.value)


# ---------------------------------------------------------------------------
# TEST 14: Production forbids local persistence fallback
# ---------------------------------------------------------------------------

def test_production_forbids_local_persistence_fallback():
    """TEST 14: System refuses to start in production if CREDENTIAL_VAULT_BACKEND is 'local'."""
    prod_local_settings = Settings()
    prod_local_settings.ENVIRONMENT = "production"
    prod_local_settings.SCENORA_CREDENTIAL_ENCRYPTION_KEY = TEST_MASTER_KEY
    prod_local_settings.CREDENTIAL_VAULT_BACKEND = "local"

    with pytest.raises(RuntimeError) as exc:
        validate_security_configuration(prod_local_settings)
    assert "Local filesystem vault is strictly forbidden in production" in str(exc.value)


# ---------------------------------------------------------------------------
# TEST 15: Admin cannot retrieve plaintext user credentials
# ---------------------------------------------------------------------------

def test_admin_cannot_retrieve_plaintext_credentials(tmp_path, monkeypatch):
    """TEST 15: An administrator cannot retrieve another user's plaintext API keys."""
    monkeypatch.setattr("app.services.vault.credential_vault.Path", lambda p: tmp_path / p)
    monkeypatch.setattr("app.services.vault.credential_vault.settings.CREDENTIAL_VAULT_BACKEND", "local")

    vault = CredentialVault(encryption_key=TEST_MASTER_KEY)

    regular_user_id = "creator_user_123"
    admin_user_id = "admin_user_999"
    user_secret = "sk-creator-private-key-9876"

    vault.store_credential(user_id=regular_user_id, provider="openai", secret=user_secret)

    def mock_admin():
        return AuthenticatedUser(uid=admin_user_id, email="admin@scenoraedits.com", is_admin=True)

    app.dependency_overrides[get_required_user] = mock_admin

    try:
        # Admin requests their own vault metadata
        admin_resp = client.get("/api/api-keys")
        assert admin_resp.status_code == 200
        admin_data = admin_resp.json()

        # Admin must NOT see creator_user_123's key or hint
        admin_openai = next(p for p in admin_data["providers"] if p["provider"] == "openai")
        assert admin_openai["configured"] is False
        assert user_secret not in json.dumps(admin_data)

    finally:
        app.dependency_overrides.pop(get_required_user, None)
