from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class PlatformConfigRecord(BaseModel):
    """
    Centralized configuration stored in Firestore at platform/config.
    Single source of truth for pricing, limits, and payment instructions.
    """
    yearly_plan_id: str = "scenora-pro-yearly"
    yearly_plan_name: str = "ScenoraEdits Pro (Yearly)"
    yearly_plan_price_inr: int = 2999
    yearly_plan_price_usd: int = 49
    yearly_plan_duration_days: int = 365
    yearly_plan_enabled: bool = True
    yearly_plan_description: str = (
        "Unlimited AI scene generation, priority cloud rendering, multi-aspect export, and Video Bible consistency for 1 full year."
    )
    free_generation_limit: int = 5
    payment_upi_id: str = "scenoraedits@upi"
    payment_upi_qr_url: str = ""
    payment_bmc_url: str = "https://buymeacoffee.com/scenoraedits"
    allow_registration: bool = True
    maintenance_mode: bool = False
    updated_at: str = Field(default_factory=lambda: "")
    updated_by: Optional[str] = None

class PlatformConfigUpdate(BaseModel):
    """Payload for updating platform settings and pricing."""
    yearly_plan_name: Optional[str] = None
    yearly_plan_price_inr: Optional[int] = Field(None, gt=0)
    yearly_plan_price_usd: Optional[int] = Field(None, gt=0)
    yearly_plan_duration_days: Optional[int] = Field(None, gt=0)
    yearly_plan_enabled: Optional[bool] = None
    yearly_plan_description: Optional[str] = None
    free_generation_limit: Optional[int] = Field(None, ge=1)
    payment_upi_id: Optional[str] = None
    payment_upi_qr_url: Optional[str] = None
    payment_bmc_url: Optional[str] = None
    allow_registration: Optional[bool] = None
    maintenance_mode: Optional[bool] = None

class AuditLogRecord(BaseModel):
    """
    Lightweight audit log stored in Firestore at admin_audit_logs/{id}.
    Strictly forbids storing API keys, passwords, or secrets.
    """
    log_id: str
    admin_uid: str
    admin_email: str
    action: str
    timestamp: str  # ISO UTC
    details: Dict[str, Any] = Field(default_factory=dict)

class AdminDashboardStats(BaseModel):
    """Summary metrics for /admin dashboard."""
    total_users: int
    pending_payments: int
    active_paid_users: int
    total_generations: int
    free_tier_generations: int
    byok_generations: int
    yearly_price_inr: int
    yearly_price_usd: int
    free_generation_limit: int

class AdminUserSummary(BaseModel):
    """User account overview for /admin/users."""
    uid: str
    email: Optional[str] = None
    created_at: Optional[str] = None
    tier: str = "free"  # "free" | "byok" | "pro_yearly"
    has_active_entitlement: bool = False
    entitlement_expires_at: Optional[str] = None
    current_usage: int = 0
    total_generations: int = 0
    project_count: int = 0

class AdminUsageStats(BaseModel):
    """Platform usage metrics for /admin/usage."""
    total_generations: int
    free_tier_generations: int
    byok_generations: int
    successful_generations: int
    failed_generations: int
    active_paid_users: int
    users_approaching_limit: int
    free_generation_limit: int
