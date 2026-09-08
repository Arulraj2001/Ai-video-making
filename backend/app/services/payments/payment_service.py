import logging
import os
import re
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List, Tuple

from fastapi import HTTPException, status

from app.configuration.config import settings
from app.configuration.firebase import get_storage_bucket
from app.models.payment import (
    PaymentRecord,
    EntitlementRecord,
    PaymentSubmitRequest,
    PlanConfigResponse,
    EntitlementResponse,
)
from app.services.payments.payment_repository import PaymentRepository

logger = logging.getLogger("scenora.payments.service")

ALLOWED_PROOF_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}

MAX_PROOF_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def sanitize_proof_filename(filename: str) -> str:
    """Sanitizes filename and strips any directory path traversal characters."""
    base = Path(filename).name
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', base)
    return clean or "proof.png"


class PaymentService:
    """
    Business service layer orchestrating payments, payment proof storage,
    yearly entitlements, and manual admin verification.
    """

    def __init__(self, repository: Optional[PaymentRepository] = None):
        self.repository = repository or PaymentRepository()

    def get_yearly_plan_config(self) -> PlanConfigResponse:
        """Returns the centralized yearly plan configuration and payment instructions."""
        features = [
            "Unlimited AI scene generations for 365 days",
            "Priority cloud rendering queue",
            "Full Video Bible consistency engine",
            "Multi-aspect ratio exports (16:9, 9:16, 1:1)",
            "Priority creator support SLA",
            "All upcoming Pro features included",
        ]
        try:
            from app.services.platform.platform_service import get_platform_service
            p_config = get_platform_service().get_config()
            return PlanConfigResponse(
                plan_id=p_config.yearly_plan_id,
                name=p_config.yearly_plan_name,
                price_inr=p_config.yearly_plan_price_inr,
                price_usd=p_config.yearly_plan_price_usd,
                duration_days=p_config.yearly_plan_duration_days,
                enabled=p_config.yearly_plan_enabled,
                description=p_config.yearly_plan_description,
                upi_id=p_config.payment_upi_id,
                upi_qr_url=p_config.payment_upi_qr_url,
                bmc_url=p_config.payment_bmc_url,
                features=features,
            )
        except Exception:
            return PlanConfigResponse(
                plan_id=getattr(settings, "YEARLY_PLAN_ID", "scenora-pro-yearly"),
                name=getattr(settings, "YEARLY_PLAN_NAME", "ScenoraEdits Pro (Yearly)"),
                price_inr=getattr(settings, "YEARLY_PLAN_PRICE_INR", 2999),
                price_usd=getattr(settings, "YEARLY_PLAN_PRICE_USD", 49),
                duration_days=getattr(settings, "YEARLY_PLAN_DURATION_DAYS", 365),
                enabled=getattr(settings, "YEARLY_PLAN_ENABLED", True),
                description=getattr(
                    settings,
                    "YEARLY_PLAN_DESCRIPTION",
                    "Unlimited AI scene generation, priority cloud rendering, multi-aspect export, and Video Bible consistency for 1 full year."
                ),
                upi_id=getattr(settings, "PAYMENT_UPI_ID", "scenoraedits@upi"),
                upi_qr_url=getattr(settings, "PAYMENT_UPI_QR_URL", ""),
                bmc_url=getattr(settings, "PAYMENT_BMC_URL", "https://buymeacoffee.com/scenoraedits"),
                features=features,
            )

    def get_all_plans_config(self) -> List[PlanConfigResponse]:
        """Returns all configured and enabled creator plans (6-Month and 1-Year Passes)."""
        plans: List[PlanConfigResponse] = []
        try:
            from app.services.platform.platform_service import get_platform_service
            p_config = get_platform_service().get_config()

            # 1. 6-Month Plan
            if getattr(p_config, "plan_6m_enabled", True):
                plans.append(
                    PlanConfigResponse(
                        plan_id=getattr(p_config, "plan_6m_id", "scenora-pro-6months"),
                        name=getattr(p_config, "plan_6m_name", "ScenoraEdits Pro (6 Months)"),
                        price_inr=getattr(p_config, "plan_6m_price_inr", 1799),
                        price_usd=getattr(p_config, "plan_6m_price_usd", 29),
                        duration_days=getattr(p_config, "plan_6m_duration_days", 180),
                        enabled=getattr(p_config, "plan_6m_enabled", True),
                        description=getattr(
                            p_config,
                            "plan_6m_description",
                            "Full studio timeline access, Video Bible consistency, and BYOK integration for 6 months."
                        ),
                        upi_id=p_config.payment_upi_id,
                        upi_qr_url=p_config.payment_upi_qr_url,
                        bmc_url=p_config.payment_bmc_url,
                        features=[
                            "Full studio timeline access for 6 months",
                            "Bring Your Own Key (BYOK) unlimited generations",
                            "Video Bible™ character consistency engine",
                            "16:9 Landscape & 9:16 Shorts export",
                            "Speech-aware DSP audio ducking",
                            "Commercial YouTube monetization rights",
                        ],
                    )
                )

            # 2. 1-Year Plan
            if getattr(p_config, "yearly_plan_enabled", True):
                plans.append(
                    PlanConfigResponse(
                        plan_id=p_config.yearly_plan_id,
                        name=p_config.yearly_plan_name,
                        price_inr=p_config.yearly_plan_price_inr,
                        price_usd=p_config.yearly_plan_price_usd,
                        duration_days=p_config.yearly_plan_duration_days,
                        enabled=p_config.yearly_plan_enabled,
                        description=p_config.yearly_plan_description,
                        upi_id=p_config.payment_upi_id,
                        upi_qr_url=p_config.payment_upi_qr_url,
                        bmc_url=p_config.payment_bmc_url,
                        features=[
                            "Full studio timeline access for 1 full year",
                            "Bring Your Own Key (BYOK) unlimited generations",
                            "Unlimited priority cloud GPU rendering queue",
                            "Full Video Bible™ character & style continuity",
                            "Multi-aspect ratio exports (16:9 & 9:16 Shorts)",
                            "Speech-aware digital audio ducking (-14dB DSP)",
                            "Kinetic word-by-word highlighted captions",
                            "100% Commercial YouTube monetization license",
                            "Priority creator support SLA & all updates",
                        ],
                    )
                )
        except Exception:
            plans.append(self.get_yearly_plan_config())

        return plans

    def submit_payment(self, uid: str, req: PaymentSubmitRequest) -> PaymentRecord:
        """
        Creates a new pending payment record associated with the authenticated creator's UID.
        Zero automatic activation occurs at submission.
        """
        all_plans = self.get_all_plans_config()
        matching_plan = next((p for p in all_plans if p.plan_id == req.plan_id), None)
        if not matching_plan:
            matching_plan = self.get_yearly_plan_config()

        if not matching_plan.enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subscription plan '{req.plan_id}' is currently disabled."
            )

        if req.amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment amount."
            )

        payment_id = f"pay_{uuid.uuid4().hex[:16]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        payment = PaymentRecord(
            payment_id=payment_id,
            uid=uid,
            plan_id=req.plan_id or config.plan_id,
            amount=req.amount,
            currency=req.currency,
            payment_method=req.payment_method,
            reference=req.reference.strip(),
            proof_storage_path=None,
            status="pending",
            rejection_reason=None,
            submitted_at=now_iso,
            reviewed_at=None,
            reviewed_by=None,
        )

        return self.repository.create_payment(payment)

    def upload_payment_proof(
        self,
        uid: str,
        payment_id: str,
        file_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> str:
        """
        Validates and stores payment proof screenshot in Firebase Storage under:
        users/{uid}/payments/{paymentId}/proof/{filename}
        Never stores binary data directly in Firestore.
        """
        payment = self.repository.get_payment(uid, payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment {payment_id} not found or access denied."
            )

        # 1. Validate file size
        if len(file_bytes) > MAX_PROOF_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds 5MB limit ({len(file_bytes)} bytes)."
            )
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded proof file is empty."
            )

        # 2. Validate MIME type
        clean_content_type = (content_type or "").lower().split(";")[0].strip()
        if clean_content_type not in ALLOWED_PROOF_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type '{clean_content_type}'. Only JPEG, PNG, and WebP images are allowed."
            )

        # 3. Sanitize filename and construct UID-scoped path
        safe_name = sanitize_proof_filename(filename)
        storage_path = f"users/{uid}/payments/{payment_id}/proof/{safe_name}"

        is_prod = (
            getattr(settings, "ENVIRONMENT", "development").lower() == "production"
            or os.getenv("SCENORA_ENV", "").lower() == "production"
        )

        # 4. Save to Firebase Storage as canonical production store
        uploaded_to_bucket = False
        bucket = get_storage_bucket()
        if bucket:
            try:
                blob = bucket.blob(storage_path)
                blob.upload_from_string(file_bytes, content_type=clean_content_type)
                uploaded_to_bucket = True
                logger.info(f"Uploaded payment proof to Firebase Storage: {storage_path}")
            except Exception as e:
                logger.warning(f"Firebase Storage upload failed for {storage_path}: {e}")

        # Retain local copy only if bucket upload did not occur or for offline local dev/testing
        if not uploaded_to_bucket or not is_prod:
            local_root = Path(getattr(settings, "STORAGE_DIR", "storage"))
            local_file_path = local_root / "users" / uid / "payments" / payment_id / "proof" / safe_name
            local_file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(local_file_path, "wb") as f:
                f.write(file_bytes)

        # 5. Update payment record in Firestore/repository
        payment.proof_storage_path = storage_path
        self.repository.update_payment(payment)

        return storage_path

    def list_user_payments(self, uid: str) -> List[PaymentRecord]:
        """Lists all payment records owned by the authenticated user."""
        return self.repository.list_user_payments(uid)

    def list_pending_payments(self) -> List[PaymentRecord]:
        """Admin operation: Lists all payments awaiting verification."""
        return self.repository.list_pending_payments()

    def get_payment(self, uid: str, payment_id: str) -> Optional[PaymentRecord]:
        """Retrieves a creator's specific payment."""
        return self.repository.get_payment(uid, payment_id)

    def get_active_entitlement(self, uid: str) -> Optional[EntitlementRecord]:
        """Checks if the user has an active, unexpired entitlement."""
        return self.repository.get_active_entitlement(uid)

    def get_current_entitlement_response(self, uid: str) -> Optional[EntitlementResponse]:
        """Returns safe entitlement status response for API callers."""
        ent = self.get_active_entitlement(uid)
        if not ent:
            return None

        now_dt = datetime.now(timezone.utc)
        expires_dt = datetime.fromisoformat(ent.expires_at)
        days_remaining = max(0, (expires_dt - now_dt).days)

        return EntitlementResponse(
            entitlement_id=ent.entitlement_id,
            uid=ent.uid,
            plan_id=ent.plan_id,
            status=ent.status,
            is_active=(ent.status == "active" and days_remaining > 0),
            started_at=ent.started_at,
            expires_at=ent.expires_at,
            payment_id=ent.payment_id,
            days_remaining=days_remaining,
        )

    def approve_payment(
        self,
        admin_identifier: str,
        payment_id: str,
    ) -> Tuple[PaymentRecord, EntitlementRecord]:
        """
        Secure server-side operation to approve a pending payment:
        1. Verifies pending payment exists.
        2. Idempotency: If payment is ALREADY approved, returns existing entitlement safely without duplicating.
        3. Creates/updates active entitlement with 365-day expiration from activation UTC.
        4. Records approving admin and reviewed timestamp.
        """
        payment = self.repository.get_payment_by_id(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment {payment_id} not found."
            )

        # IDEMPOTENCY CHECK: If already approved, return existing entitlement
        if payment.status == "approved":
            logger.info(f"Payment {payment_id} is already approved. Returning existing entitlement.")
            existing_entitlements = self.repository.list_user_entitlements(payment.uid)
            matching = [e for e in existing_entitlements if e.payment_id == payment_id]
            if matching:
                return payment, matching[0]
            # If no matching found, fall back to current active entitlement
            active = self.get_active_entitlement(payment.uid)
            if active:
                return payment, active

        if payment.status == "rejected":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment {payment_id} has already been rejected and cannot be approved."
            )

        # Approve payment and create new entitlement with duration matching the plan
        now_dt = datetime.now(timezone.utc)
        all_plans = self.get_all_plans_config()
        matching_plan = next((p for p in all_plans if p.plan_id == payment.plan_id), None)
        if matching_plan:
            duration_days = matching_plan.duration_days
        else:
            duration_days = getattr(settings, "YEARLY_PLAN_DURATION_DAYS", 365)

        started_at = now_dt.isoformat()
        expires_at = (now_dt + timedelta(days=duration_days)).isoformat()

        entitlement_id = f"ent_{uuid.uuid4().hex[:16]}"
        entitlement = EntitlementRecord(
            entitlement_id=entitlement_id,
            uid=payment.uid,
            plan_id=payment.plan_id,
            status="active",
            started_at=started_at,
            expires_at=expires_at,
            payment_id=payment.payment_id,
            approved_by=admin_identifier,
            created_at=started_at,
            updated_at=started_at,
        )

        # Persist entitlement
        self.repository.create_or_update_entitlement(entitlement)

        # Update payment status
        payment.status = "approved"
        payment.reviewed_at = started_at
        payment.reviewed_by = admin_identifier
        self.repository.update_payment(payment)

        logger.info(
            f"Payment {payment_id} approved by admin {admin_identifier}. "
            f"Active entitlement {entitlement_id} granted to user {payment.uid} until {expires_at}."
        )

        try:
            from app.services.platform.platform_service import get_platform_service
            get_platform_service().audit_repo.record_action(
                admin_uid=admin_identifier,
                admin_email=admin_identifier,
                action="payment_approved",
                details={
                    "payment_id": payment_id,
                    "uid": payment.uid,
                    "amount": payment.amount,
                    "currency": payment.currency,
                    "entitlement_id": entitlement_id,
                }
            )
        except Exception as e:
            logger.warning(f"Failed to record approval audit: {e}")

        return payment, entitlement

    def reject_payment(
        self,
        admin_identifier: str,
        payment_id: str,
        reason: str,
    ) -> PaymentRecord:
        """
        Secure server-side operation to reject a payment:
        1. Verifies payment exists.
        2. Cannot reject already approved payments.
        3. Sets status to 'rejected' with reason, reviewer, and timestamp.
        """
        payment = self.repository.get_payment_by_id(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment {payment_id} not found."
            )

        if payment.status == "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reject payment {payment_id} because it was already approved with active entitlement."
            )

        if payment.status == "rejected":
            # Idempotent return
            return payment

        now_iso = datetime.now(timezone.utc).isoformat()
        payment.status = "rejected"
        payment.rejection_reason = reason.strip()
        payment.reviewed_at = now_iso
        payment.reviewed_by = admin_identifier

        self.repository.update_payment(payment)
        logger.info(f"Payment {payment_id} rejected by admin {admin_identifier}. Reason: {reason}")

        try:
            from app.services.platform.platform_service import get_platform_service
            get_platform_service().audit_repo.record_action(
                admin_uid=admin_identifier,
                admin_email=admin_identifier,
                action="payment_rejected",
                details={
                    "payment_id": payment_id,
                    "uid": payment.uid,
                    "reason": reason.strip(),
                }
            )
        except Exception as e:
            logger.warning(f"Failed to record rejection audit: {e}")

        return payment

    def list_all_payments(self, status_filter: Optional[str] = None) -> List[PaymentRecord]:
        """Admin operation: Lists all payments across all users, optionally filtered by status."""
        return self.repository.list_all_payments(status_filter=status_filter)

    def get_payment_proof_file_path(self, payment_id: str) -> Optional[str]:
        """Returns the storage path for payment proof screenshot."""
        payment = self.repository.get_payment_by_id(payment_id)
        if not payment or not payment.proof_storage_path:
            return None
        return payment.proof_storage_path



# Global singleton instance
_payment_service: Optional[PaymentService] = None

def get_payment_service() -> PaymentService:
    global _payment_service
    if _payment_service is None:
        _payment_service = PaymentService()
    return _payment_service
