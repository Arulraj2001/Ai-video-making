import logging
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies.auth import get_required_user, AuthenticatedUser
from app.schemas.api_keys import (
    SaveApiKeyRequest,
    ApiKeyMetadataResponse,
    ApiKeyListResponse,
    TestApiKeyResponse,
)
from app.services.vault import get_credential_vault
from app.services.vault.credential_vault import SUPPORTED_PROVIDERS_CATALOG
from app.utils.security import sanitize_secrets

logger = logging.getLogger("scenora.api.api_keys")

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


@router.get("", response_model=ApiKeyListResponse)
def list_user_api_keys(
    current_user: AuthenticatedUser = Depends(get_required_user),
) -> ApiKeyListResponse:
    """
    Returns configured status and masked metadata for all supported AI providers.
    NEVER returns plaintext keys or ciphertexts.
    """
    try:
        vault = get_credential_vault()
        providers_metadata = vault.list_credentials_metadata(current_user.uid)
        return ApiKeyListResponse(providers=providers_metadata)
    except Exception as e:
        logger.error(f"Failed to list API keys for user {current_user.uid}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve API key vault status.",
        )


@router.post("", response_model=ApiKeyMetadataResponse)
def save_user_api_key(
    payload: SaveApiKeyRequest,
    current_user: AuthenticatedUser = Depends(get_required_user),
) -> ApiKeyMetadataResponse:
    """
    Encrypts and persists a provider API key using AES-256-GCM authenticated encryption.
    Cryptographically binds the key to current_user.uid.
    """
    provider_clean = payload.provider.strip().lower()
    if provider_clean not in SUPPORTED_PROVIDERS_CATALOG:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider '{payload.provider}'. Supported: {', '.join(SUPPORTED_PROVIDERS_CATALOG.keys())}",
        )

    info = SUPPORTED_PROVIDERS_CATALOG[provider_clean]
    if info.get("is_free"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{info['label']} does not require or accept API keys.",
        )

    key_clean = payload.api_key.strip()
    if not key_clean or len(key_clean) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid API key: Key must be at least 4 characters long.",
        )

    if provider_clean == "cloudflare" and not (payload.account_id and payload.account_id.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cloudflare requires both an API Token and Account ID.",
        )

    try:
        vault = get_credential_vault()
        metadata = vault.store_credential(
            user_id=current_user.uid,
            provider=provider_clean,
            secret=key_clean,
            label=payload.label,
            account_id=payload.account_id,
        )
        logger.info(f"User '{current_user.uid}' saved API key for provider '{provider_clean}'")
        return metadata
    except Exception as e:
        safe_msg = sanitize_secrets(str(e))
        logger.error(f"Failed saving key for user {current_user.uid} provider {provider_clean}: {safe_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to encrypt and store API key safely: {safe_msg}",
        )


@router.delete("/{provider}")
def delete_user_api_key(
    provider: str,
    current_user: AuthenticatedUser = Depends(get_required_user),
) -> Dict[str, Any]:
    """
    Deletes user's saved API key for a given provider.
    """
    provider_clean = provider.strip().lower()
    try:
        vault = get_credential_vault()
        vault.delete_credential(current_user.uid, provider_clean)
        logger.info(f"User '{current_user.uid}' removed API key for '{provider_clean}'")
        return {
            "provider": provider_clean,
            "deleted": True,
            "message": f"Successfully removed API key for {provider_clean}.",
        }
    except Exception as e:
        logger.error(f"Failed deleting key for {current_user.uid}/{provider_clean}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete API key.",
        )


@router.post("/{provider}/test", response_model=TestApiKeyResponse)
async def test_user_api_key(
    provider: str,
    current_user: AuthenticatedUser = Depends(get_required_user),
) -> TestApiKeyResponse:
    """
    Validates connection with the provider using the user's stored key (or app default)
    without performing expensive or billable operations.
    """
    provider_clean = provider.strip().lower()
    try:
        vault = get_credential_vault()
        res = await vault.test_credential(current_user.uid, provider_clean)
        return res
    except Exception as e:
        safe_msg = sanitize_secrets(str(e))
        logger.warning(f"Test key failed for {current_user.uid}/{provider_clean}: {safe_msg}")
        return TestApiKeyResponse(
            provider=provider_clean,
            valid=False,
            message=safe_msg,
        )
