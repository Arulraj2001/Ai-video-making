import logging
import time
from typing import Optional, List, Dict, Any

from app.api.dependencies.auth import AuthenticatedUser
from app.configuration.config import settings
from app.models.platform import (
    PlatformConfigRecord,
    PlatformConfigUpdate,
    AuditLogRecord,
    AdminDashboardStats,
    AdminUserSummary,
    AdminUsageStats,
)
from app.services.platform.config_repository import PlatformConfigRepository
from app.services.platform.audit_repository import AuditRepository

logger = logging.getLogger("scenora.platform.service")

class PlatformService:
    """
    Core administrative service managing platform configuration, dynamic pricing,
    free tier limits, audit trail logging, and platform analytics.
    """

    def __init__(
        self,
        config_repo: Optional[PlatformConfigRepository] = None,
        audit_repo: Optional[AuditRepository] = None,
    ):
        self.config_repo = config_repo or PlatformConfigRepository()
        self.audit_repo = audit_repo or AuditRepository()

    def get_config(self) -> PlatformConfigRecord:
        """Returns the centralized dynamic platform configuration."""
        return self.config_repo.get_config()

    def update_config(
        self,
        updates: PlatformConfigUpdate,
        admin: AuthenticatedUser,
    ) -> PlatformConfigRecord:
        """
        Updates platform settings or pricing, and records an audit log entry.
        """
        admin_id = admin.email or admin.uid
        update_dict = updates.model_dump(exclude_unset=True)

        old_config = self.get_config()
        updated = self.config_repo.update_config(update_dict, admin_identifier=admin_id)

        # Determine audit action type
        if "yearly_plan_price_inr" in update_dict or "yearly_plan_price_usd" in update_dict:
            action = "pricing_updated"
        elif "free_generation_limit" in update_dict:
            action = "free_limit_updated"
        else:
            action = "platform_settings_updated"

        audit_details = {
            "changed_fields": list(update_dict.keys()),
            "old_values": {k: getattr(old_config, k, None) for k in update_dict.keys()},
            "new_values": update_dict,
        }

        self.audit_repo.record_action(
            admin_uid=admin.uid,
            admin_email=admin.email or admin.uid,
            action=action,
            details=audit_details,
        )

        logger.info(f"Platform configuration updated by {admin_id}: {list(update_dict.keys())}")
        return updated

    def get_dashboard_stats(self) -> AdminDashboardStats:
        """Computes summary platform metrics for the /admin dashboard."""
        from app.services.payments.payment_service import get_payment_service
        from app.services.usage.usage_service import get_usage_service
        from app.services.project_service import project_service

        payment_svc = get_payment_service()
        usage_svc = get_usage_service()
        config = self.get_config()

        # 1. Pending payments count
        pending_payments = len(payment_svc.list_pending_payments())

        # 2. Collect user UIDs across payments, usage, and projects
        known_uids = set()
        for p in getattr(payment_svc.repository, "_payments", {}).values():
            if p.get("uid"):
                known_uids.add(p["uid"])

        for proj in project_service.list_projects():
            if getattr(proj, "owner_id", None):
                known_uids.add(proj.owner_id)

        # 3. Aggregate usage and entitlements
        active_paid_users = 0
        total_gens = 0
        free_gens = 0
        byok_gens = 0

        # Check in-memory store or repository
        usage_records = list(getattr(usage_svc.repository, "_memory_store", {}).values())
        for rec in usage_records:
            uid = rec.get("uid")
            if uid:
                known_uids.add(uid)
            total_gens += rec.get("generationCount", 0)
            free_gens += rec.get("freeTierGenerations", 0)
            byok_gens += rec.get("byokGenerations", 0)

        for uid in known_uids:
            if payment_svc.get_active_entitlement(uid):
                active_paid_users += 1

        total_users_count = max(len(known_uids), 1)  # At least the current creator/admin

        return AdminDashboardStats(
            total_users=total_users_count,
            pending_payments=pending_payments,
            active_paid_users=active_paid_users,
            total_generations=total_gens,
            free_tier_generations=free_gens,
            byok_generations=byok_gens,
            yearly_price_inr=config.yearly_plan_price_inr,
            yearly_price_usd=config.yearly_plan_price_usd,
            free_generation_limit=config.free_generation_limit,
        )

    def get_users_list(self) -> List[AdminUserSummary]:
        """
        Gathers safe creator summaries for /admin/users.
        Guaranteed NEVER to return API keys, passwords, or secrets.
        """
        from app.services.payments.payment_service import get_payment_service
        from app.services.usage.usage_service import get_usage_service
        from app.services.project_service import project_service

        payment_svc = get_payment_service()
        usage_svc = get_usage_service()

        known_uids = set()
        user_projects_count: Dict[str, int] = {}
        for proj in project_service.list_projects():
            owner = getattr(proj, "owner_id", None)
            if owner:
                known_uids.add(owner)
                user_projects_count[owner] = user_projects_count.get(owner, 0) + 1

        for p in getattr(payment_svc.repository, "_payments", {}).values():
            uid = p.get("uid")
            if uid:
                known_uids.add(uid)

        for rec in getattr(usage_svc.repository, "_memory_store", {}).values():
            uid = rec.get("uid")
            if uid:
                known_uids.add(uid)

        # Always include default local creator if empty
        if not known_uids:
            known_uids.add(getattr(settings, "DEFAULT_LEGACY_UID", "legacy-local-user"))

        summaries: List[AdminUserSummary] = []
        for uid in known_uids:
            ent = payment_svc.get_active_entitlement(uid)
            has_ent = bool(ent)
            has_byok = usage_svc.check_has_byok(uid)

            if has_ent:
                tier = "pro_yearly"
            elif has_byok:
                tier = "byok"
            else:
                tier = "free"

            usage_resp = usage_svc.get_usage(uid)
            proj_count = user_projects_count.get(uid, 0)

            email = f"{uid}@user.scenoraedits.com" if not ("@" in uid) else uid

            summaries.append(
                AdminUserSummary(
                    uid=uid,
                    email=email,
                    created_at="2026-09-01T00:00:00.000Z",
                    tier=tier,
                    has_active_entitlement=has_ent,
                    entitlement_expires_at=ent.expires_at if ent else None,
                    current_usage=usage_resp.current_usage,
                    total_generations=usage_resp.free_tier_generations + usage_resp.byok_generations,
                    project_count=proj_count,
                )
            )

        summaries.sort(key=lambda x: x.current_usage, reverse=True)
        return summaries

    def get_usage_stats(self) -> AdminUsageStats:
        """Aggregates platform usage for /admin/usage."""
        from app.services.payments.payment_service import get_payment_service
        from app.services.usage.usage_service import get_usage_service

        usage_svc = get_usage_service()
        payment_svc = get_payment_service()
        config = self.get_config()
        limit = config.free_generation_limit

        total_gens = 0
        free_gens = 0
        byok_gens = 0
        success_gens = 0
        failed_gens = 0
        active_paid = 0
        approaching_limit = 0

        known_uids = set()
        usage_records = list(getattr(usage_svc.repository, "_memory_store", {}).values())
        for rec in usage_records:
            uid = rec.get("uid")
            if uid:
                known_uids.add(uid)
            t = rec.get("generationCount", 0)
            f = rec.get("freeTierGenerations", 0)
            b = rec.get("byokGenerations", 0)
            s = rec.get("successfulGenerations", 0)
            fail = rec.get("failedGenerations", 0)

            total_gens += t
            free_gens += f
            byok_gens += b
            success_gens += s
            failed_gens += fail

            if f >= max(1, limit - 1):
                approaching_limit += 1

        for uid in known_uids:
            if payment_svc.get_active_entitlement(uid):
                active_paid += 1

        return AdminUsageStats(
            total_generations=total_gens,
            free_tier_generations=free_gens,
            byok_generations=byok_gens,
            successful_generations=success_gens,
            failed_generations=failed_gens,
            active_paid_users=active_paid,
            users_approaching_limit=approaching_limit,
            free_generation_limit=limit,
        )

    def get_audit_logs(self, limit: int = 50) -> List[AuditLogRecord]:
        """Returns recent administrative events."""
        return self.audit_repo.list_logs(limit=limit)


# Global singleton instance
_platform_service: Optional[PlatformService] = None

def get_platform_service() -> PlatformService:
    global _platform_service
    if _platform_service is None:
        _platform_service = PlatformService()
    return _platform_service
