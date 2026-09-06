from typing import Optional, List
from pydantic import BaseModel, Field

class PaymentRecord(BaseModel):
    """
    Firestore payment record schema stored at users/{uid}/payments/{paymentId}.
    """
    payment_id: str
    uid: str
    plan_id: str
    amount: float
    currency: str  # "INR" | "USD"
    payment_method: str  # "upi" | "buymeacoffee"
    reference: str  # UTR, transaction reference, or coffee supporter note
    proof_storage_path: Optional[str] = None  # users/{uid}/payments/{paymentId}/proof/{file}
    status: str = "pending"  # "pending" | "approved" | "rejected"
    rejection_reason: Optional[str] = None
    submitted_at: str  # ISO UTC
    reviewed_at: Optional[str] = None  # ISO UTC
    reviewed_by: Optional[str] = None  # Admin email or UID

class EntitlementRecord(BaseModel):
    """
    Firestore entitlement record schema stored at users/{uid}/entitlements/{entitlementId}.
    """
    entitlement_id: str
    uid: str
    plan_id: str
    status: str = "active"  # "active" | "expired" | "cancelled"
    started_at: str  # ISO UTC
    expires_at: str  # ISO UTC (started_at + 365 days)
    payment_id: str
    approved_by: str  # Admin email or UID
    created_at: str  # ISO UTC
    updated_at: str  # ISO UTC

class PaymentSubmitRequest(BaseModel):
    """Client request payload to submit a payment record."""
    plan_id: str = Field(default="scenora-pro-yearly")
    amount: float = Field(gt=0, description="Payment amount in specified currency")
    currency: str = Field(pattern="^(INR|USD)$")
    payment_method: str = Field(pattern="^(upi|buymeacoffee)$")
    reference: str = Field(min_length=3, max_length=120, description="UTR or supporter reference")

class PaymentRejectRequest(BaseModel):
    """Admin request payload to reject a pending payment."""
    reason: str = Field(min_length=3, max_length=500, description="Reason for rejection")

class PaymentResponse(BaseModel):
    """Safe payment metadata returned to creator or admin."""
    payment_id: str
    uid: str
    plan_id: str
    amount: float
    currency: str
    payment_method: str
    reference: str
    proof_storage_path: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    submitted_at: str
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None

class EntitlementResponse(BaseModel):
    """Entitlement status returned to creator or backend services."""
    entitlement_id: str
    uid: str
    plan_id: str
    status: str
    is_active: bool
    started_at: str
    expires_at: str
    payment_id: str
    days_remaining: int

class PlanConfigResponse(BaseModel):
    """Centralized yearly plan configuration & instructions for UI."""
    plan_id: str
    name: str
    price_inr: int
    price_usd: int
    duration_days: int
    enabled: bool
    description: str
    upi_id: str
    upi_qr_url: str
    bmc_url: str
    features: List[str] = Field(default_factory=list)
