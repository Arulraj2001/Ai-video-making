import logging
import os
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse, Response

from app.api.dependencies.auth import AuthenticatedUser, get_admin_user
from app.configuration.config import settings
from app.configuration.firebase import get_storage_bucket
from app.models.payment import PaymentResponse, PaymentRejectRequest, EntitlementResponse
from app.models.platform import (
    PlatformConfigRecord,
    PlatformConfigUpdate,
    AuditLogRecord,
    AdminDashboardStats,
    AdminUserSummary,
    AdminUsageStats,
)
from app.services.platform.platform_service import get_platform_service, PlatformService
from app.services.payments.payment_service import get_payment_service, PaymentService

logger = logging.getLogger("scenora.admin.api")

router = APIRouter(prefix="/admin", tags=["Admin Portal & Central Control"])


@router.get("/dashboard", response_model=AdminDashboardStats)
def get_dashboard_metrics(
    admin: AuthenticatedUser = Depends(get_admin_user),
    platform_svc: PlatformService = Depends(get_platform_service),
) -> AdminDashboardStats:
    """
    Returns platform-wide summary metrics for /admin dashboard.
    Enforces server-side admin authentication.
    """
    return platform_svc.get_dashboard_stats()


@router.get("/users", response_model=List[AdminUserSummary])
def get_users_list(
    admin: AuthenticatedUser = Depends(get_admin_user),
    platform_svc: PlatformService = Depends(get_platform_service),
) -> List[AdminUserSummary]:
    """
    Lists registered creators, active tiers, entitlement expiration, and usage.
    Guaranteed NEVER to return API keys, passwords, or secrets.
    """
    return platform_svc.get_users_list()


@router.get("/payments", response_model=List[PaymentResponse])
def list_payments(
    status: Optional[str] = Query(None, description="Optional filter: 'pending', 'approved', 'rejected'"),
    admin: AuthenticatedUser = Depends(get_admin_user),
    payment_svc: PaymentService = Depends(get_payment_service),
) -> List[PaymentResponse]:
    """
    Lists payments across all users with optional status filter.
    """
    records = payment_svc.list_all_payments(status_filter=status)
    return [PaymentResponse.model_validate(r.model_dump()) for r in records]


@router.get("/payments/{payment_id}/proof-url")
def get_payment_proof_url(
    payment_id: str,
    admin: AuthenticatedUser = Depends(get_admin_user),
    payment_svc: PaymentService = Depends(get_payment_service),
):
    """
    Returns secure URL to view payment proof screenshot.
    Only authorized administrators can access this endpoint.
    """
    proof_path = payment_svc.get_payment_proof_file_path(payment_id)
    if not proof_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No payment proof uploaded for payment {payment_id}."
        )

    return {
        "payment_id": payment_id,
        "proof_url": f"/api/admin/payments/{payment_id}/proof-file",
        "storage_path": proof_path,
    }


@router.get("/payments/{payment_id}/proof-file")
def view_payment_proof_file(
    payment_id: str,
    admin: AuthenticatedUser = Depends(get_admin_user),
    payment_svc: PaymentService = Depends(get_payment_service),
):
    """
    Securely streams the payment proof image to the authenticated admin.
    Normal users receive 403 Forbidden.
    """
    payment = payment_svc.get_payment_proof_file_path(payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proof not found.")

    media_type = "image/png"
    if payment.endswith(".jpg") or payment.endswith(".jpeg"):
        media_type = "image/jpeg"
    elif payment.endswith(".webp"):
        media_type = "image/webp"

    # 1. Canonical Store: Stream directly from Firebase Storage bucket
    bucket = get_storage_bucket()
    if bucket:
        try:
            blob = bucket.blob(payment)
            if blob.exists():
                content = blob.download_as_bytes()
                content_type = blob.content_type or media_type
                return Response(content=content, media_type=content_type)
        except Exception as e:
            logger.warning(f"Failed to stream payment proof from Firebase Storage bucket: {e}")

    # 2. Local fallback for offline/development and local unit tests
    storage_root = Path(getattr(settings, "STORAGE_DIR", "storage"))
    file_path = storage_root / payment
    if not file_path.exists():
        file_path = storage_root.parent / payment
        if not file_path.exists():
            file_path = Path(payment)

    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proof file does not exist in storage.")

    return FileResponse(file_path, media_type=media_type)


@router.post("/payments/{payment_id}/approve")
def approve_payment(
    payment_id: str,
    admin: AuthenticatedUser = Depends(get_admin_user),
    payment_svc: PaymentService = Depends(get_payment_service),
):
    """
    Admin-only operation: Approve a pending payment.
    - Idempotent: repeated calls do NOT create duplicate entitlements.
    - Creates active entitlement valid for 365 days from activation.
    - Records approving admin identifier and audit log.
    """
    admin_id = admin.email or admin.uid
    payment, entitlement = payment_svc.approve_payment(
        admin_identifier=admin_id,
        payment_id=payment_id,
    )
    return {
        "message": f"Payment {payment_id} successfully approved.",
        "payment": PaymentResponse.model_validate(payment.model_dump()),
        "entitlement": EntitlementResponse(
            entitlement_id=entitlement.entitlement_id,
            uid=entitlement.uid,
            plan_id=entitlement.plan_id,
            status=entitlement.status,
            is_active=(entitlement.status == "active"),
            started_at=entitlement.started_at,
            expires_at=entitlement.expires_at,
            payment_id=entitlement.payment_id,
            days_remaining=365,
        )
    }


@router.post("/payments/{payment_id}/reject")
def reject_payment(
    payment_id: str,
    request: PaymentRejectRequest,
    admin: AuthenticatedUser = Depends(get_admin_user),
    payment_svc: PaymentService = Depends(get_payment_service),
):
    """
    Admin-only operation: Reject a pending payment.
    Records reviewer, reason, and audit log; grants no entitlement.
    """
    admin_id = admin.email or admin.uid
    payment = payment_svc.reject_payment(
        admin_identifier=admin_id,
        payment_id=payment_id,
        reason=request.reason,
    )
    return {
        "message": f"Payment {payment_id} rejected.",
        "payment": PaymentResponse.model_validate(payment.model_dump()),
    }



@router.get("/config", response_model=PlatformConfigRecord)
def get_platform_config(
    admin: AuthenticatedUser = Depends(get_admin_user),
    platform_svc: PlatformService = Depends(get_platform_service),
) -> PlatformConfigRecord:
    """Returns active platform configuration."""
    return platform_svc.get_config()


@router.put("/config", response_model=PlatformConfigRecord)
def update_platform_config(
    updates: PlatformConfigUpdate,
    admin: AuthenticatedUser = Depends(get_admin_user),
    platform_svc: PlatformService = Depends(get_platform_service),
) -> PlatformConfigRecord:
    """
    Updates platform configuration (pricing, free limits, payment instructions).
    Immediately takes effect in server-side usage and payment enforcement.
    Logs administrative audit event.
    """
    return platform_svc.update_config(updates=updates, admin=admin)


@router.get("/usage", response_model=AdminUsageStats)
def get_platform_usage_stats(
    admin: AuthenticatedUser = Depends(get_admin_user),
    platform_svc: PlatformService = Depends(get_platform_service),
) -> AdminUsageStats:
    """
    Returns platform-wide generation consumption analytics.
    """
    return platform_svc.get_usage_stats()


@router.get("/audit-logs", response_model=List[AuditLogRecord])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    admin: AuthenticatedUser = Depends(get_admin_user),
    platform_svc: PlatformService = Depends(get_platform_service),
) -> List[AuditLogRecord]:
    """
    Returns recent administrative events log (newest first).
    """
    return platform_svc.get_audit_logs(limit=limit)
