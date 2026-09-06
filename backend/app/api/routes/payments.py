import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File

from app.api.dependencies.auth import (
    AuthenticatedUser,
    get_current_user,
    get_required_user,
    get_admin_user,
)
from app.models.payment import (
    PaymentSubmitRequest,
    PaymentRejectRequest,
    PaymentResponse,
    EntitlementResponse,
    PlanConfigResponse,
)
from app.services.payments.payment_service import get_payment_service, PaymentService

logger = logging.getLogger("scenora.payments.api")

router = APIRouter(tags=["Payments & Entitlements"])


@router.get("/plans/yearly", response_model=PlanConfigResponse)
def get_yearly_plan_config(
    payment_service: PaymentService = Depends(get_payment_service),
) -> PlanConfigResponse:
    """
    Returns the centralized yearly plan details, dynamic pricing (INR/USD),
    and payment instructions for UPI (India) and Buy Me a Coffee (International).
    Zero hardcoding of pricing in frontend or backend.
    """
    return payment_service.get_yearly_plan_config()


@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def submit_payment(
    request: PaymentSubmitRequest,
    current_user: AuthenticatedUser = Depends(get_required_user),
    payment_service: PaymentService = Depends(get_payment_service),
) -> PaymentResponse:
    """
    Submit payment transaction metadata (UPI reference or Buy Me a Coffee note).
    Always starts in 'pending' status.
    UID is strictly bound from verified Firebase token.
    """
    record = payment_service.submit_payment(uid=current_user.uid, req=request)
    return PaymentResponse.model_validate(record.model_dump())


@router.post("/payments/{payment_id}/proof")
async def upload_payment_proof(
    payment_id: str,
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_required_user),
    payment_service: PaymentService = Depends(get_payment_service),
):
    """
    Upload payment proof screenshot for an existing pending payment.
    Files are stored under users/{uid}/payments/{paymentId}/proof/{filename}.
    Never stores binary data directly in Firestore.
    """
    content = await file.read()
    storage_path = payment_service.upload_payment_proof(
        uid=current_user.uid,
        payment_id=payment_id,
        file_bytes=content,
        filename=file.filename or "proof.png",
        content_type=file.content_type or "image/png",
    )
    return {
        "payment_id": payment_id,
        "proof_storage_path": storage_path,
        "message": "Payment proof uploaded successfully and queued for admin review.",
    }


@router.get("/payments", response_model=List[PaymentResponse])
def list_user_payments(
    current_user: AuthenticatedUser = Depends(get_required_user),
    payment_service: PaymentService = Depends(get_payment_service),
) -> List[PaymentResponse]:
    """
    List payment records for the authenticated creator.
    Cross-user isolation: users can ONLY view their own records.
    """
    records = payment_service.list_user_payments(uid=current_user.uid)
    return [PaymentResponse.model_validate(r.model_dump()) for r in records]


@router.get("/entitlements/current", response_model=Optional[EntitlementResponse])
def get_current_entitlement(
    current_user: AuthenticatedUser = Depends(get_required_user),
    payment_service: PaymentService = Depends(get_payment_service),
) -> Optional[EntitlementResponse]:
    """
    Returns the creator's currently active entitlement and remaining days,
    or null if no active entitlement exists.
    """
    return payment_service.get_current_entitlement_response(uid=current_user.uid)


# =========================================================================
# Protected Admin-Only Operations
# =========================================================================

@router.get("/admin/payments/pending", response_model=List[PaymentResponse])
def list_pending_payments(
    admin: AuthenticatedUser = Depends(get_admin_user),
    payment_service: PaymentService = Depends(get_payment_service),
) -> List[PaymentResponse]:
    """
    Admin-only operation: List all payments awaiting manual review.
    Requires verified admin privileges.
    """
    records = payment_service.list_pending_payments()
    return [PaymentResponse.model_validate(r.model_dump()) for r in records]


@router.post("/admin/payments/{payment_id}/approve")
def approve_payment(
    payment_id: str,
    admin: AuthenticatedUser = Depends(get_admin_user),
    payment_service: PaymentService = Depends(get_payment_service),
):
    """
    Admin-only operation: Approve a pending payment.
    - Idempotent: repeated calls do NOT create duplicate entitlements.
    - Creates active entitlement valid for 365 days from activation.
    - Records approving admin identifier.
    """
    admin_id = admin.email or admin.uid
    payment, entitlement = payment_service.approve_payment(
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


@router.post("/admin/payments/{payment_id}/reject")
def reject_payment(
    payment_id: str,
    request: PaymentRejectRequest,
    admin: AuthenticatedUser = Depends(get_admin_user),
    payment_service: PaymentService = Depends(get_payment_service),
):
    """
    Admin-only operation: Reject a pending payment.
    Records reviewer and reason; grants no entitlement.
    """
    admin_id = admin.email or admin.uid
    payment = payment_service.reject_payment(
        admin_identifier=admin_id,
        payment_id=payment_id,
        reason=request.reason,
    )
    return {
        "message": f"Payment {payment_id} rejected.",
        "payment": PaymentResponse.model_validate(payment.model_dump()),
    }
