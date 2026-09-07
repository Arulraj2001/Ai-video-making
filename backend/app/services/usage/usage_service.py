from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
import logging
from typing import Optional, Dict, Any
from fastapi import HTTPException, status

from app.configuration.config import settings
from app.models.usage import UserUsageRecord, UsageResponse
from app.services.usage.usage_repository import UsageRepository

logger = logging.getLogger("scenora.usage.service")

class UsageLimitExceededError(HTTPException):
    """Exception raised when a user exceeds their free tier generation quota."""
    def __init__(
        self,
        current_usage: int,
        limit: int,
        reset_date: str,
        message: Optional[str] = None
    ):
        msg = message or (
            f"Free generation limit reached ({current_usage}/{limit}). "
            "Add your own API key in Settings > API Keys to continue generating, "
            "or wait until your monthly quota resets."
        )
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": msg,
                "code": "USAGE_LIMIT_EXCEEDED",
                "current_usage": current_usage,
                "limit": limit,
                "reset_date": reset_date,
            }
        )

@dataclass
class QuotaReservation:
    uid: str
    period: str
    is_byok: bool
    provider: str
    reserved: bool
    finalized: bool = False

class UsageService:
    """
    Core service enforcing server-side usage quotas and tracking consumption.
    Integrates with:
    - Phase 15.1 CredentialVault to detect BYOK (Bring Your Own Key)
    - Firestore users/{uid}/usage/{period}
    - FastAPI endpoints
    """

    def __init__(self, repository: Optional[UsageRepository] = None):
        self.repository = repository or UsageRepository()

    @staticmethod
    def get_current_period_key(now: Optional[datetime] = None) -> str:
        """Returns accounting period key: 'YYYY-MM'."""
        dt = now or datetime.now(timezone.utc)
        return dt.strftime("%Y-%m")

    @staticmethod
    def get_next_reset_time(now: Optional[datetime] = None) -> str:
        """Calculates 1st of next month 00:00:00 UTC."""
        dt = now or datetime.now(timezone.utc)
        if dt.month == 12:
            next_month = datetime(dt.year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        else:
            next_month = datetime(dt.year, dt.month + 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        return next_month.isoformat()

    def get_limit(self) -> int:
        """Centralized getter for dynamic free generation limit from PlatformService."""
        try:
            from app.services.platform.platform_service import get_platform_service
            config = get_platform_service().get_config()
            return int(config.free_generation_limit)
        except Exception:
            return int(getattr(settings, "FREE_GENERATION_LIMIT", 5))


    def check_has_byok(self, uid: str, provider: Optional[str] = None) -> bool:
        """
        Queries Phase 15.1 CredentialVault to determine if the user has
        configured their own API key.
        """
        try:
            from app.services.vault import get_credential_vault
            vault = get_credential_vault()
            if provider:
                cred = vault.get_credential(uid, provider)
                return bool(cred and cred.get("api_key"))
            else:
                # Check if user has ANY valid configured provider key
                configured = [
                    m for m in vault.list_credentials_metadata(uid)
                    if getattr(m, "configured", False)
                ]
                if configured:
                    return True
                for k, v in getattr(vault, "_memory_cache", {}).items():
                    if k.startswith(f"{uid}:") and v and v.get("ciphertext"):
                        return True
                return False
        except Exception as e:
            logger.debug(f"Vault check for user '{uid}': {e}")
            return False

    def check_has_active_entitlement(self, uid: str) -> Optional[Any]:
        """
        Queries Phase 17 PaymentService to check if user has an active, unexpired paid entitlement.
        """
        try:
            from app.services.payments.payment_service import get_payment_service
            service = get_payment_service()
            return service.get_active_entitlement(uid)
        except Exception as e:
            logger.debug(f"Entitlement check for user '{uid}': {e}")
            return None

    def get_usage(self, uid: str, has_byok: Optional[bool] = None, entitlement: Optional[Any] = None) -> UsageResponse:
        """Retrieves current usage and calculates remaining allowance."""
        period = self.get_current_period_key()
        reset_date = self.get_next_reset_time()
        record = self.repository.get_usage(uid, period, reset_date)
        limit = self.get_limit()

        current = record.freeTierGenerations
        remaining = max(0, limit - current)
        if has_byok is None:
            has_byok = self.check_has_byok(uid)
        if entitlement is None:
            entitlement = self.check_has_active_entitlement(uid)
        has_entitlement = bool(entitlement)

        tier = "free"
        plan_name = None
        expires_at = None
        if has_entitlement and entitlement:
            tier = "pro_yearly"
            plan_name = getattr(settings, "YEARLY_PLAN_NAME", "ScenoraEdits Pro (Yearly)")
            expires_at = entitlement.expires_at
            status_str = "active"
        elif has_byok:
            tier = "byok"
            status_str = "active"
        else:
            tier = "free"
            status_str = "active" if remaining > 0 else "limit_reached"

        return UsageResponse(
            uid=uid,
            period=period,
            current_usage=current,
            limit=limit,
            remaining=remaining,
            reset_date=record.resetAt or reset_date,
            status=status_str,
            has_byok=has_byok,
            free_tier_generations=record.freeTierGenerations,
            byok_generations=record.byokGenerations,
            has_active_entitlement=has_entitlement,
            tier=tier,
            entitlement_expires_at=expires_at,
            plan_name=plan_name,
        )

    def check_and_reserve_quota(self, uid: str, provider: str) -> QuotaReservation:
        """
        Atomic server-side check and pre-reservation.
        - If user has active yearly entitlement: Paid access granted unconditionally.
        - If user provides own key (BYOK): Allowed unconditionally.
        - If on free tier: Denies if freeTierGenerations >= limit.
        """
        period = self.get_current_period_key()
        reset_date = self.get_next_reset_time()
        limit = self.get_limit()

        legacy_uid = getattr(settings, "DEFAULT_LEGACY_UID", "legacy-local-user")
        if uid == legacy_uid and not getattr(settings, "ENFORCE_USAGE_ON_LEGACY_LOCAL", False):
            is_exempt = True
        else:
            is_byok = self.check_has_byok(uid, provider)
            has_entitlement = bool(self.check_has_active_entitlement(uid))
            is_exempt = is_byok or has_entitlement

        allowed, record = self.repository.atomic_reserve_quota(
            uid=uid,
            period=period,
            limit=limit,
            is_byok=is_exempt,
            default_reset_at=reset_date,
        )

        if not allowed:
            raise UsageLimitExceededError(
                current_usage=record.freeTierGenerations,
                limit=limit,
                reset_date=record.resetAt or reset_date,
            )

        return QuotaReservation(
            uid=uid,
            period=period,
            is_byok=is_exempt,
            provider=provider,
            reserved=True,
        )


    def finalize_reservation(self, reservation: QuotaReservation, success: bool):
        """Finalizes quota reservation based on generation outcome."""
        if not reservation.reserved or reservation.finalized:
            return

        reset_date = self.get_next_reset_time()
        self.repository.finalize_generation(
            uid=reservation.uid,
            period=reservation.period,
            is_byok=reservation.is_byok,
            success=success,
            default_reset_at=reset_date,
        )
        reservation.finalized = True

    @asynccontextmanager
    async def reserve(self, uid: str, provider: str):
        """
        Asynchronous context manager ensuring fail-safe reservation and finalization.
        If generation fails with an exception, reservation is released and not charged.
        If generation completes successfully, quota is committed.
        """
        reservation = self.check_and_reserve_quota(uid, provider)
        success = False
        try:
            yield reservation
            success = True
        finally:
            self.finalize_reservation(reservation, success=success)


_usage_service: Optional[UsageService] = None

def get_usage_service() -> UsageService:
    global _usage_service
    if _usage_service is None:
        _usage_service = UsageService()
    return _usage_service
