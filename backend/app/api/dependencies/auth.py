from dataclasses import dataclass, field
import logging
import os
from typing import Optional, Dict, Any
from fastapi import Request, Header, HTTPException, status, Depends
import firebase_admin
from firebase_admin import auth
from app.configuration.config import settings
from app.configuration.firebase import initialize_firebase

logger = logging.getLogger("scenora.auth")

def _load_admin_emails() -> set:
    base = {
        "sridharparthasarathy2002@gmail.com",
        "samuelarul2001@gmail.com"
    }
    raw = os.getenv("ADMIN_EMAILS", "").strip()
    if raw:
        if raw.startswith("[") and raw.endswith("]"):
            import json
            try:
                emails = json.loads(raw)
                base.update(e.lower().strip() for e in emails if isinstance(e, str) and e.strip())
            except Exception:
                base.update(e.strip().strip('"').strip("'").lower() for e in raw.strip("[]").split(",") if e.strip())
        else:
            base.update(e.strip().lower() for e in raw.split(",") if e.strip())
    return base

ADMIN_EMAILS = _load_admin_emails()

@dataclass
class AuthenticatedUser:
    uid: str
    email: Optional[str] = None
    is_admin: bool = False
    claims: Dict[str, Any] = field(default_factory=dict)

def check_is_admin(email: Optional[str], claims: Optional[Dict[str, Any]] = None) -> bool:
    if email and email.lower().strip() in ADMIN_EMAILS:
        return True
    if claims and claims.get("admin") is True:
        return True
    return False

def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> AuthenticatedUser:
    """
    FastAPI dependency to extract and verify the current user from Firebase ID Token.
    Supports:
    1. Authorization: Bearer <Firebase ID Token>
    2. Authorization: Bearer test-token-<uid> (for local tests/mocking)
    3. Fallback to default local creator if unauthenticated and auth is not strictly required.
    """
    is_prod = (
        settings.ENVIRONMENT.lower() == "production"
        or os.getenv("SCENORA_ENV", "").lower() == "production"
        or os.getenv("RENDER", "").lower() == "true"
    )

    if authorization:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1].strip()
        elif len(parts) == 1:
            token = parts[0].strip()
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Authorization header format. Expected 'Bearer <token>'."
            )

        # Disallow test token bypasses in production
        if token.startswith("test-token-") or token.startswith("mock-") or token.startswith("fake-"):
            if is_prod:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Test and mock tokens are strictly forbidden in production."
                )
            token_val = token[len("test-token-"):].strip() or "test-user"
            if token_val in ADMIN_EMAILS:
                email = token_val
                uid = "admin-test"
                is_admin = True
            elif token_val.startswith("admin"):
                email = list(ADMIN_EMAILS)[0]
                uid = token_val
                is_admin = True
            else:
                uid = token_val
                email = f"{uid}@test.scenoraedits.com"
                is_admin = check_is_admin(email)
            return AuthenticatedUser(
                uid=uid,
                email=email,
                is_admin=is_admin,
                claims={"sub": uid, "email": email, "admin": is_admin, "test_mode": True}
            )


        # Initialize Firebase Admin SDK
        initialize_firebase()

        try:
            decoded = auth.verify_id_token(token)
            uid = decoded.get("uid") or decoded.get("user_id")
            if not uid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Malformed token: missing user ID."
                )
            email = decoded.get("email")
            is_admin = check_is_admin(email, decoded)
            return AuthenticatedUser(
                uid=uid,
                email=email,
                is_admin=is_admin,
                claims=decoded
            )
        except auth.ExpiredIdTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has expired. Please sign in again."
            )
        except auth.InvalidIdTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(e)}"
            )
        except Exception as e:
            logger.warning(f"Failed to verify Firebase ID token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication verification failed: {str(e)}"
            )

    # If no token provided:
    auth_required = (
        is_prod
        or getattr(settings, "FIREBASE_AUTH_REQUIRED", False)
        or request.headers.get("x-require-auth") == "true"
    )

    if auth_required:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header."
        )

    # Return fallback local creator user for legacy and offline compatibility
    default_uid = getattr(settings, "DEFAULT_LEGACY_UID", "legacy-local-user")
    return AuthenticatedUser(
        uid=default_uid,
        email="creator@scenoraedits.local",
        is_admin=False,
        claims={"local_fallback": True}
    )

def get_required_user(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    """Dependency that ensures the user is strictly authenticated (not legacy fallback)."""
    default_uid = getattr(settings, "DEFAULT_LEGACY_UID", "legacy-local-user")
    if user.uid == default_uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required to perform this action."
        )
    return user

def get_admin_user(user: AuthenticatedUser = Depends(get_required_user)) -> AuthenticatedUser:
    """Dependency that ensures the authenticated user is an authorized admin."""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges are required for this action."
        )
    return user
