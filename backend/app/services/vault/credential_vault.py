import base64
import hashlib
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.configuration.config import settings
from app.configuration.firebase import get_firestore_client
from app.schemas.api_keys import ApiKeyMetadataResponse, TestApiKeyResponse
from app.utils.security import generate_key_hint, sanitize_secrets

logger = logging.getLogger("scenora.vault")

SUPPORTED_PROVIDERS_CATALOG = {
    "gemini": {
        "label": "Google Gemini",
        "category": "multimodal",
        "description": "Powers both multimodal image generation (Imagen 3) and fast storyboard LLM ideation.",
        "supported_models": [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-2.0-flash-exp",
            "gemini-3.1-flash-image",
        ],
        "env_var": "GEMINI_API_KEY",
    },
    "openai": {
        "label": "OpenAI",
        "category": "multimodal",
        "description": "High-intelligence LLM storyboard scripts (GPT-4o) and DALL-E 3 visual synthesis.",
        "supported_models": [
            "gpt-4o",
            "gpt-4o-mini",
            "dall-e-3",
        ],
        "env_var": "LLM_API_KEY",
    },
    "anthropic": {
        "label": "Anthropic Claude",
        "category": "llm",
        "description": "Nuanced narrative, character bible generation, and creative direction.",
        "supported_models": [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
        ],
        "env_var": "ANTHROPIC_API_KEY",
    },
    "openrouter": {
        "label": "OpenRouter",
        "category": "llm",
        "description": "Universal unified gateway to 100+ LLM models with customizable routing.",
        "supported_models": [
            "meta-llama/llama-3.3-70b-instruct",
            "google/gemini-flash-1.5",
            "anthropic/claude-3.5-sonnet",
        ],
        "env_var": "OPENROUTER_API_KEY",
    },
    "huggingface": {
        "label": "Hugging Face",
        "category": "image",
        "description": "Access FLUX.1, SDXL, and thousands of community visual models.",
        "supported_models": [
            "black-forest-labs/FLUX.1-schnell",
            "black-forest-labs/FLUX.1-dev",
            "stabilityai/stable-diffusion-xl-base-1.0",
        ],
        "env_var": "HUGGINGFACE_API_KEY",
    },
    "cloudflare": {
        "label": "Cloudflare Workers AI",
        "category": "image",
        "description": "Lightning-fast serverless GPU edge generation (FLUX, DreamShaper, SDXL).",
        "supported_models": [
            "@cf/black-forest-labs/flux-1-schnell",
            "@cf/bytedance/stable-diffusion-xl-lightning",
            "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        ],
        "env_var": "CLOUDFLARE_API_TOKEN",
        "requires_account_id": True,
    },
    "pollinations": {
        "label": "Pollinations AI (Free Cloud)",
        "category": "image",
        "description": "Zero-config cloud image generator. Free and no API key required.",
        "supported_models": [
            "flux",
            "turbo",
            "deliberate",
        ],
        "env_var": None,
        "is_free": True,
    },
    "sana_local": {
        "label": "SANA Local GPU",
        "category": "local_gpu",
        "description": "Private zero-cost local neural pipeline running on your workstation GPU.",
        "supported_models": [
            "Efficient-Large-Model/SANA-1.6B",
        ],
        "env_var": None,
        "is_free": True,
    },
}


class CredentialVault:
    """
    Secure authenticated AES-256-GCM Credential Vault.
    Stores and retrieves encrypted third-party API keys for authenticated creators.
    Cryptographically binds every ciphertext to user_id:provider using Authenticated Additional Data (AAD).
    """

    def __init__(self, encryption_key: Optional[str] = None):
        raw_key = encryption_key or getattr(settings, "SCENORA_CREDENTIAL_ENCRYPTION_KEY", "")
        if not raw_key:
            # Fallback for dev/test if key not set
            raw_key = "scenora-default-master-encryption-key-256-bits-vault!"

        # Derive clean 32-byte key
        clean = raw_key.strip()
        if len(clean) == 64:
            try:
                self._key_bytes = bytes.fromhex(clean)
            except ValueError:
                self._key_bytes = hashlib.sha256(clean.encode("utf-8")).digest()
        elif len(clean.encode("utf-8")) == 32:
            self._key_bytes = clean.encode("utf-8")
        else:
            self._key_bytes = hashlib.sha256(clean.encode("utf-8")).digest()

        self._aesgcm = AESGCM(self._key_bytes)
        self._backend = getattr(settings, "CREDENTIAL_VAULT_BACKEND", "firestore").strip().lower()
        if self._backend == "local":
            self._local_vault_dir = Path("storage/vault")
            self._local_vault_dir.mkdir(parents=True, exist_ok=True)
            logger.info("[VAULT CONFIG] CREDENTIAL_VAULT_BACKEND='local' active (Development/Testing only).")
        else:
            self._backend = "firestore"
            logger.info("[VAULT CONFIG] CREDENTIAL_VAULT_BACKEND='firestore' active (Production secure store).")

        self._memory_cache: Dict[str, Dict[str, Any]] = {}

    def _get_aad(self, user_id: str, provider: str) -> bytes:
        return f"{user_id}:{provider.lower()}".encode("utf-8")

    def encrypt(self, secret: str, user_id: str, provider: str) -> tuple[str, str]:
        """
        Encrypts secret using AES-256-GCM with 96-bit random nonce and AAD.
        Returns (ciphertext_b64, nonce_b64).
        """
        if not secret:
            raise ValueError("Secret cannot be empty.")
        nonce = os.urandom(12)
        aad = self._get_aad(user_id, provider)
        ciphertext = self._aesgcm.encrypt(nonce, secret.strip().encode("utf-8"), aad)
        return (
            base64.b64encode(ciphertext).decode("ascii"),
            base64.b64encode(nonce).decode("ascii"),
        )

    def decrypt(self, ciphertext_b64: str, nonce_b64: str, user_id: str, provider: str) -> str:
        """
        Decrypts ciphertext using AES-256-GCM and verifies AAD integrity.
        Raises ValueError on tamper or integrity failure.
        """
        try:
            ciphertext = base64.b64decode(ciphertext_b64)
            nonce = base64.b64decode(nonce_b64)
            aad = self._get_aad(user_id, provider)
            plaintext = self._aesgcm.decrypt(nonce, ciphertext, aad)
            return plaintext.decode("utf-8")
        except Exception as e:
            logger.warning(f"Decryption failed for user '{user_id}' provider '{provider}': {e}")
            raise ValueError("Failed to decrypt credentials: authentication or integrity check failed.")

    def _get_user_local_file(self, user_id: str, provider: str) -> Path:
        base_dir = getattr(self, "_local_vault_dir", None) or Path("storage/vault")
        user_dir = base_dir / user_id
        user_dir.mkdir(parents=True, exist_ok=True)
        return user_dir / f"{provider.lower()}.json"

    def store_credential(
        self,
        user_id: str,
        provider: str,
        secret: str,
        label: Optional[str] = None,
        account_id: Optional[str] = None,
    ) -> ApiKeyMetadataResponse:
        """
        Encrypts and stores a third-party API key in the configured vault backend (Firestore or local).
        NEVER stores plaintext secrets or logs them.
        """
        provider_key = provider.lower().strip()
        info = SUPPORTED_PROVIDERS_CATALOG.get(provider_key)
        display_label = label or (info["label"] if info else provider_key.capitalize())
        category = info["category"] if info else "image"

        ct_b64, nonce_b64 = self.encrypt(secret, user_id, provider_key)
        key_hint = generate_key_hint(secret)

        acct_ct_b64 = None
        acct_nonce_b64 = None
        acct_hint = None
        if account_id and account_id.strip():
            acct_clean = account_id.strip()
            acct_ct_b64, acct_nonce_b64 = self.encrypt(acct_clean, user_id, f"{provider_key}_account_id")
            acct_hint = generate_key_hint(acct_clean)

        now_iso = datetime.now(timezone.utc).isoformat()

        doc_data = {
            "provider": provider_key,
            "label": display_label,
            "category": category,
            "ciphertext": ct_b64,
            "nonce": nonce_b64,
            "key_hint": key_hint,
            "account_id_ct": acct_ct_b64,
            "account_id_nonce": acct_nonce_b64,
            "account_id_hint": acct_hint,
            "status": "active",
            "validation_status": "untested",
            "updated_at": now_iso,
        }

        # 1. Update memory cache
        cache_key = f"{user_id}:{provider_key}"
        self._memory_cache[cache_key] = doc_data

        # 2. Persist to configured backend (zero silent dual-writes or accidental fallbacks)
        if self._backend == "firestore":
            db = get_firestore_client()
            if not db:
                raise RuntimeError(
                    "Cloud Firestore client unavailable while CREDENTIAL_VAULT_BACKEND='firestore'. "
                    "Operation failed closed to prevent unpersisted or unencrypted credential loss."
                )
            try:
                db.collection("users").document(user_id).collection("apiKeys").document(provider_key).set(doc_data)
                logger.info(f"Stored encrypted credential in Firestore for user '{user_id}' provider '{provider_key}'")
            except Exception as e:
                logger.error(f"Firestore save error for user '{user_id}' provider '{provider_key}': {e}")
                raise RuntimeError(f"Failed to persist encrypted credential to Cloud Firestore: {e}")

        elif self._backend == "local":
            try:
                local_file = self._get_user_local_file(user_id, provider_key)
                with open(local_file, "w", encoding="utf-8") as f:
                    json.dump(doc_data, f, indent=2)
                logger.info(f"Stored encrypted credential in local vault for user '{user_id}' provider '{provider_key}'")
            except Exception as e:
                logger.error(f"Failed writing local vault file for {user_id}/{provider_key}: {e}")
                raise RuntimeError(f"Failed writing local vault file: {e}")

        return ApiKeyMetadataResponse(
            provider=provider_key,
            label=display_label,
            category=category,
            configured=True,
            key_hint=key_hint,
            account_id_hint=acct_hint,
            status="active",
            validation_status="untested",
            updated_at=now_iso,
            supported_models=info.get("supported_models", []) if info else [],
            description=info.get("description") if info else None,
            has_app_default=self.has_app_default(provider_key),
        )

    def get_credential(self, user_id: str, provider: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves and decrypts the credential for a user and provider.
        Returns dict with decrypted 'api_key' and optional 'account_id', or None.
        """
        provider_key = provider.lower().strip()
        data = self._read_raw_record(user_id, provider_key)
        if not data or "ciphertext" not in data or "nonce" not in data:
            return None

        try:
            plain_key = self.decrypt(data["ciphertext"], data["nonce"], user_id, provider_key)
            plain_acct = None
            if data.get("account_id_ct") and data.get("account_id_nonce"):
                try:
                    plain_acct = self.decrypt(
                        data["account_id_ct"],
                        data["account_id_nonce"],
                        user_id,
                        f"{provider_key}_account_id",
                    )
                except Exception:
                    plain_acct = None

            return {
                "api_key": plain_key,
                "account_id": plain_acct,
                "label": data.get("label"),
                "updated_at": data.get("updated_at"),
                "key_hint": data.get("key_hint"),
                "account_id_hint": data.get("account_id_hint"),
            }
        except Exception as e:
            logger.error(f"Failed to decrypt credential for {user_id}/{provider_key}: {e}")
            return None

    def has_credential(self, user_id: str, provider: str) -> bool:
        """
        Fast check whether an authenticated user has an active encrypted credential
        configured for the given provider.
        """
        if not user_id or not provider:
            return False
        provider_key = provider.lower().strip()
        data = self._read_raw_record(user_id, provider_key)
        return data is not None and bool(data.get("ciphertext"))

    def _read_raw_record(self, user_id: str, provider: str) -> Optional[Dict[str, Any]]:
        """Reads raw encrypted document strictly from the configured backend."""
        provider_key = provider.lower().strip()
        cache_key = f"{user_id}:{provider_key}"

        # Check memory cache first
        if cache_key in self._memory_cache:
            return self._memory_cache[cache_key]

        if self._backend == "firestore":
            try:
                db = get_firestore_client()
                if db:
                    doc_ref = db.collection("users").document(user_id).collection("apiKeys").document(provider_key)
                    snapshot = doc_ref.get()
                    if snapshot.exists:
                        doc_data = snapshot.to_dict()
                        self._memory_cache[cache_key] = doc_data
                        return doc_data
            except Exception as e:
                logger.error(f"Firestore read failed for {user_id}/{provider_key}: {e}")
            return None

        elif self._backend == "local":
            local_file = self._get_user_local_file(user_id, provider_key)
            if local_file.exists():
                try:
                    with open(local_file, "r", encoding="utf-8") as f:
                        doc_data = json.load(f)
                        self._memory_cache[cache_key] = doc_data
                        return doc_data
                except Exception as e:
                    logger.warning(f"Error reading local vault file {local_file}: {e}")
            return None

        return None

    def delete_credential(self, user_id: str, provider: str) -> bool:
        """Deletes user's API key from memory and the configured persistent backend."""
        provider_key = provider.lower().strip()
        cache_key = f"{user_id}:{provider_key}"
        if cache_key in self._memory_cache:
            del self._memory_cache[cache_key]

        if self._backend == "firestore":
            try:
                db = get_firestore_client()
                if db:
                    db.collection("users").document(user_id).collection("apiKeys").document(provider_key).delete()
                    logger.info(f"Deleted credential from Firestore for user '{user_id}' provider '{provider_key}'")
            except Exception as e:
                logger.warning(f"Firestore delete error for {user_id}/{provider_key}: {e}")

        elif self._backend == "local":
            local_file = self._get_user_local_file(user_id, provider_key)
            if local_file.exists():
                try:
                    local_file.unlink()
                except Exception as e:
                    logger.warning(f"Could not remove local vault file {local_file}: {e}")

        return True

    def has_app_default(self, provider: str) -> bool:
        """Checks if server environment has a default API key or credentials for this provider."""
        provider_key = provider.lower().strip()
        info = SUPPORTED_PROVIDERS_CATALOG.get(provider_key)
        if not info:
            return False
        if info.get("is_free"):
            return True

        env_var = info.get("env_var")
        if not env_var:
            return False

        val = getattr(settings, env_var, None) or os.getenv(env_var)
        if provider_key == "cloudflare":
            acct = getattr(settings, "CLOUDFLARE_ACCOUNT_ID", None) or os.getenv("CF_ACCOUNT_ID")
            return bool(val and acct)
        return bool(val)

    def list_credentials_metadata(self, user_id: str) -> List[ApiKeyMetadataResponse]:
        """
        Lists metadata for all supported providers for a user.
        NEVER returns plaintext keys or ciphertexts.
        """
        results: List[ApiKeyMetadataResponse] = []

        for p_key, info in SUPPORTED_PROVIDERS_CATALOG.items():
            record = self._read_raw_record(user_id, p_key)
            is_configured = record is not None and bool(record.get("ciphertext"))
            key_hint = record.get("key_hint") if is_configured else None
            acct_hint = record.get("account_id_hint") if is_configured else None
            status_val = "active" if is_configured else ("active" if info.get("is_free") else "unconfigured")
            val_status = record.get("validation_status", "untested") if is_configured else ("valid" if info.get("is_free") else "untested")
            updated = record.get("updated_at") if is_configured else None

            results.append(
                ApiKeyMetadataResponse(
                    provider=p_key,
                    label=info["label"],
                    category=info["category"],
                    configured=is_configured,
                    key_hint=key_hint,
                    account_id_hint=acct_hint,
                    status=status_val,
                    validation_status=val_status,
                    updated_at=updated,
                    supported_models=info.get("supported_models", []),
                    description=info.get("description"),
                    has_app_default=self.has_app_default(p_key),
                )
            )

        return results

    async def test_credential(self, user_id: str, provider: str) -> TestApiKeyResponse:
        """
        Performs a lightweight, non-billable test of the provider credentials.
        All exceptions are passed through sanitize_secrets to ensure zero leakage.
        """
        provider_key = provider.lower().strip()
        info = SUPPORTED_PROVIDERS_CATALOG.get(provider_key)
        if not info:
            return TestApiKeyResponse(
                provider=provider_key,
                valid=False,
                message=f"Unknown provider '{provider_key}'.",
            )

        if info.get("is_free"):
            return TestApiKeyResponse(
                provider=provider_key,
                valid=True,
                message=f"{info['label']} is available without API key authentication.",
            )

        # Retrieve user key, or check app default
        user_cred = self.get_credential(user_id, provider_key)
        api_key = user_cred.get("api_key") if user_cred else None
        account_id = user_cred.get("account_id") if user_cred else None

        if not api_key:
            # Fall back to server env if configured
            if self.has_app_default(provider_key):
                env_var = info.get("env_var")
                api_key = getattr(settings, env_var, None) or os.getenv(env_var)
                if provider_key == "cloudflare":
                    account_id = getattr(settings, "CLOUDFLARE_ACCOUNT_ID", None) or os.getenv("CF_ACCOUNT_ID")

        if not api_key:
            return TestApiKeyResponse(
                provider=provider_key,
                valid=False,
                message="No API key configured for this provider. Please add your API key first.",
            )

        # Test specific provider
        try:
            import httpx

            if provider_key == "gemini":
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=api_key)
                    # List models to verify key validity without generating content
                    models = [m.name for m in genai.list_models()]
                    if models:
                        self._update_validation_status(user_id, provider_key, "valid")
                        return TestApiKeyResponse(
                            provider=provider_key,
                            valid=True,
                            message=f"Successfully verified Google Gemini credentials ({len(models)} models available).",
                        )
                except Exception as ex:
                    self._update_validation_status(user_id, provider_key, "invalid")
                    return TestApiKeyResponse(
                        provider=provider_key,
                        valid=False,
                        message=sanitize_secrets(f"Gemini authentication failed: {str(ex)}"),
                    )

            elif provider_key == "openai":
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.get(
                            "https://api.openai.com/v1/models",
                            headers={"Authorization": f"Bearer {api_key}"},
                        )
                        if resp.status_code == 200:
                            self._update_validation_status(user_id, provider_key, "valid")
                            return TestApiKeyResponse(
                                provider=provider_key,
                                valid=True,
                                message="Successfully verified OpenAI credentials.",
                            )
                        else:
                            self._update_validation_status(user_id, provider_key, "invalid")
                            return TestApiKeyResponse(
                                provider=provider_key,
                                valid=False,
                                message=sanitize_secrets(f"OpenAI verification failed: HTTP {resp.status_code}"),
                            )
                except Exception as ex:
                    self._update_validation_status(user_id, provider_key, "invalid")
                    return TestApiKeyResponse(
                        provider=provider_key,
                        valid=False,
                        message=sanitize_secrets(f"OpenAI connection error: {str(ex)}"),
                    )

            elif provider_key == "openrouter":
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.get(
                            "https://openrouter.ai/api/v1/auth/key",
                            headers={"Authorization": f"Bearer {api_key}"},
                        )
                        if resp.status_code == 200:
                            self._update_validation_status(user_id, provider_key, "valid")
                            return TestApiKeyResponse(
                                provider=provider_key,
                                valid=True,
                                message="Successfully verified OpenRouter credentials.",
                            )
                        else:
                            self._update_validation_status(user_id, provider_key, "invalid")
                            return TestApiKeyResponse(
                                provider=provider_key,
                                valid=False,
                                message=sanitize_secrets(f"OpenRouter verification failed: HTTP {resp.status_code}"),
                            )
                except Exception as ex:
                    self._update_validation_status(user_id, provider_key, "invalid")
                    return TestApiKeyResponse(
                        provider=provider_key,
                        valid=False,
                        message=sanitize_secrets(f"OpenRouter connection error: {str(ex)}"),
                    )

            elif provider_key == "huggingface":
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.get(
                            "https://huggingface.co/api/whoami-v2",
                            headers={"Authorization": f"Bearer {api_key}"},
                        )
                        if resp.status_code == 200:
                            self._update_validation_status(user_id, provider_key, "valid")
                            return TestApiKeyResponse(
                                provider=provider_key,
                                valid=True,
                                message="Successfully verified Hugging Face credentials.",
                            )
                        else:
                            self._update_validation_status(user_id, provider_key, "invalid")
                            return TestApiKeyResponse(
                                provider=provider_key,
                                valid=False,
                                message=sanitize_secrets(f"Hugging Face verification failed: HTTP {resp.status_code}"),
                            )
                except Exception as ex:
                    self._update_validation_status(user_id, provider_key, "invalid")
                    return TestApiKeyResponse(
                        provider=provider_key,
                        valid=False,
                        message=sanitize_secrets(f"Hugging Face connection error: {str(ex)}"),
                    )

            elif provider_key == "cloudflare":
                if not account_id:
                    return TestApiKeyResponse(
                        provider=provider_key,
                        valid=False,
                        message="Cloudflare requires both an API Token and Account ID.",
                    )
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.get(
                            "https://api.cloudflare.com/client/v4/user/tokens/verify",
                            headers={"Authorization": f"Bearer {api_key}"},
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            if data.get("success"):
                                self._update_validation_status(user_id, provider_key, "valid")
                                return TestApiKeyResponse(
                                    provider=provider_key,
                                    valid=True,
                                    message="Successfully verified Cloudflare Workers AI token.",
                                )
                        self._update_validation_status(user_id, provider_key, "invalid")
                        return TestApiKeyResponse(
                            provider=provider_key,
                            valid=False,
                            message=sanitize_secrets(f"Cloudflare token verification failed: HTTP {resp.status_code}"),
                        )
                except Exception as ex:
                    self._update_validation_status(user_id, provider_key, "invalid")
                    return TestApiKeyResponse(
                        provider=provider_key,
                        valid=False,
                        message=sanitize_secrets(f"Cloudflare connection error: {str(ex)}"),
                    )

            elif provider_key == "anthropic":
                # Check key format without billable API call
                if api_key.startswith("sk-ant-") and len(api_key) > 30:
                    self._update_validation_status(user_id, provider_key, "valid")
                    return TestApiKeyResponse(
                        provider=provider_key,
                        valid=True,
                        message="Anthropic API key format verified.",
                    )
                else:
                    self._update_validation_status(user_id, provider_key, "invalid")
                    return TestApiKeyResponse(
                        provider=provider_key,
                        valid=False,
                        message="Invalid Anthropic API key format (expected sk-ant-...).",
                    )

            # Default generic pass
            return TestApiKeyResponse(
                provider=provider_key,
                valid=True,
                message=f"Credentials for {provider_key} configured.",
            )

        except Exception as e:
            return TestApiKeyResponse(
                provider=provider_key,
                valid=False,
                message=sanitize_secrets(f"Verification error: {str(e)}"),
            )

    def _update_validation_status(self, user_id: str, provider: str, status_str: str) -> None:
        """Updates validation status in memory and storage."""
        provider_key = provider.lower().strip()
        record = self._read_raw_record(user_id, provider_key)
        if record:
            record["validation_status"] = status_str
            self._memory_cache[f"{user_id}:{provider_key}"] = record
            try:
                local_file = self._get_user_local_file(user_id, provider_key)
                if local_file.exists():
                    with open(local_file, "w", encoding="utf-8") as f:
                        json.dump(record, f, indent=2)
            except Exception:
                pass


_vault_instance: Optional[CredentialVault] = None


def get_credential_vault() -> CredentialVault:
    """Returns the singleton CredentialVault instance."""
    global _vault_instance
    if _vault_instance is None:
        _vault_instance = CredentialVault()
    return _vault_instance
