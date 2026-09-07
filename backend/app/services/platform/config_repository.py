import logging
import threading
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from app.configuration.config import settings
from app.configuration.firebase import get_firestore_client
from app.models.platform import PlatformConfigRecord

logger = logging.getLogger("scenora.platform.config")

CONFIG_DOC_COLLECTION = "platform"
CONFIG_DOC_ID = "config"

class PlatformConfigRepository:
    """
    Manages platform configuration persistence in Firestore at platform/config
    with thread-safe in-memory caching and fallback to settings.
    """

    def __init__(self, backend: Optional[str] = None):
        self._backend = (backend or getattr(settings, "PAYMENTS_STORAGE_BACKEND", "firestore")).strip().lower()
        self._cached_config: Optional[PlatformConfigRecord] = None
        self._lock = threading.Lock()

    def _get_default_config(self) -> PlatformConfigRecord:
        now_iso = datetime.now(timezone.utc).isoformat()
        return PlatformConfigRecord(
            yearly_plan_id=getattr(settings, "YEARLY_PLAN_ID", "scenora-pro-yearly"),
            yearly_plan_name=getattr(settings, "YEARLY_PLAN_NAME", "ScenoraEdits Pro (Yearly)"),
            yearly_plan_price_inr=getattr(settings, "YEARLY_PLAN_PRICE_INR", 2999),
            yearly_plan_price_usd=getattr(settings, "YEARLY_PLAN_PRICE_USD", 49),
            yearly_plan_duration_days=getattr(settings, "YEARLY_PLAN_DURATION_DAYS", 365),
            yearly_plan_enabled=getattr(settings, "YEARLY_PLAN_ENABLED", True),
            yearly_plan_description=getattr(
                settings,
                "YEARLY_PLAN_DESCRIPTION",
                "Unlimited AI scene generation, priority cloud rendering, multi-aspect export, and Video Bible consistency for 1 full year."
            ),
            free_generation_limit=getattr(settings, "FREE_GENERATION_LIMIT", 5),
            payment_upi_id=getattr(settings, "PAYMENT_UPI_ID", "scenoraedits@upi"),
            payment_upi_qr_url=getattr(settings, "PAYMENT_UPI_QR_URL", ""),
            payment_bmc_url=getattr(settings, "PAYMENT_BMC_URL", "https://buymeacoffee.com/scenoraedits"),
            allow_registration=True,
            maintenance_mode=False,
            updated_at=now_iso,
            updated_by="system",
        )

    def get_config(self) -> PlatformConfigRecord:
        """Retrieves active platform configuration, pulling from Firestore or local cache."""
        with self._lock:
            if self._cached_config:
                return self._cached_config

        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    doc = db.collection(CONFIG_DOC_COLLECTION).document(CONFIG_DOC_ID).get()
                    if doc.exists:
                        data = doc.to_dict() or {}
                        rec = PlatformConfigRecord.model_validate(data)
                        with self._lock:
                            self._cached_config = rec
                        return rec
                    else:
                        # Initialize default config in Firestore
                        default_rec = self._get_default_config()
                        db.collection(CONFIG_DOC_COLLECTION).document(CONFIG_DOC_ID).set(default_rec.model_dump())
                        with self._lock:
                            self._cached_config = default_rec
                        return default_rec
                except Exception as e:
                    logger.warning(f"Failed to read platform/config from Firestore: {e}")

        default_rec = self._get_default_config()
        with self._lock:
            self._cached_config = default_rec
        return default_rec

    def update_config(self, updates: Dict[str, Any], admin_identifier: str) -> PlatformConfigRecord:
        """Updates platform configuration and writes to Firestore and cache."""
        current = self.get_config().model_dump()
        for k, v in updates.items():
            if v is not None:
                current[k] = v

        current["updated_at"] = datetime.now(timezone.utc).isoformat()
        current["updated_by"] = admin_identifier

        updated_record = PlatformConfigRecord.model_validate(current)

        with self._lock:
            self._cached_config = updated_record

        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    db.collection(CONFIG_DOC_COLLECTION).document(CONFIG_DOC_ID).set(updated_record.model_dump())
                    logger.info(f"Updated platform/config in Firestore by {admin_identifier}")
                except Exception as e:
                    logger.warning(f"Failed to save platform/config to Firestore: {e}")

        return updated_record

    def reset_for_testing(self):
        """Resets cached configuration for clean test runs."""
        with self._lock:
            self._cached_config = None
