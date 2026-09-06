from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

class UserUsageRecord(BaseModel):
    """
    Persistent Firestore document schema stored at users/{uid}/usage/{period}.
    Tracks all generation activities per accounting period.
    """
    uid: str = Field(..., description="Firebase User UID")
    period: str = Field(..., description="Usage accounting period, e.g. '2026-09'")
    generationCount: int = Field(0, description="Total successful generations completed in this period")
    freeTierGenerations: int = Field(0, description="Generations consumed against the platform free tier quota")
    byokGenerations: int = Field(0, description="Generations executed using user's own configured API keys")
    successfulGenerations: int = Field(0, description="Count of successfully fulfilled generation requests")
    failedGenerations: int = Field(0, description="Count of failed generation requests (does not consume free quota)")
    updatedAt: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp of last usage update"
    )
    resetAt: str = Field(..., description="ISO 8601 UTC timestamp of next periodic reset (1st of next month 00:00:00 UTC)")


class UsageResponse(BaseModel):
    """
    Client-safe response model for GET /api/usage.
    Guaranteed NEVER to expose API keys, secrets, or internal identifiers.
    """
    uid: str
    period: str
    current_usage: int = Field(..., description="Number of free tier generations used in the current period")
    limit: int = Field(..., description="Configured free tier limit for the current period")
    remaining: int = Field(..., description="Free tier generations remaining")
    reset_date: str = Field(..., description="ISO timestamp when free tier usage resets")
    status: str = Field(..., description="'active' if quota available, 'limit_reached' if free tier exhausted")
    has_byok: bool = Field(False, description="True if user has configured at least one custom API key in vault")
    free_tier_generations: int = Field(0, description="Free tier generations count")
    byok_generations: int = Field(0, description="BYOK generations count")
    has_active_entitlement: bool = Field(False, description="True if creator has an active paid yearly entitlement")
    tier: str = Field("free", description="'free' | 'byok' | 'pro_yearly'")
    entitlement_expires_at: Optional[str] = Field(None, description="ISO timestamp of yearly entitlement expiration")
    plan_name: Optional[str] = Field(None, description="Name of active plan if applicable")

