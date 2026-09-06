from fastapi import APIRouter, Depends
from app.api.dependencies.auth import get_current_user, AuthenticatedUser
from app.models.usage import UsageResponse
from app.services.usage import get_usage_service

router = APIRouter(prefix="/usage", tags=["usage"])

@router.get("", response_model=UsageResponse)
def get_current_user_usage(
    user: AuthenticatedUser = Depends(get_current_user)
) -> UsageResponse:
    """
    Returns current periodic generation usage, limits, and reset date for the authenticated user.
    Never exposes API keys, secrets, or internal identifiers.
    """
    usage_svc = get_usage_service()
    return usage_svc.get_usage(user.uid)
