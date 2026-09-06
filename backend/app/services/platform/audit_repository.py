import logging
import threading
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from app.configuration.config import settings
from app.configuration.firebase import get_firestore_client
from app.models.platform import AuditLogRecord

logger = logging.getLogger("scenora.platform.audit")

FORBIDDEN_DETAIL_KEYS = {"api_key", "password", "token", "secret", "ciphertext", "nonce"}

def sanitize_audit_details(details: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures no sensitive credentials or keys are ever persisted in audit logs."""
    clean = {}
    for k, v in details.items():
        if any(f_key in k.lower() for f_key in FORBIDDEN_DETAIL_KEYS):
            clean[k] = "[REDACTED]"
        elif isinstance(v, dict):
            clean[k] = sanitize_audit_details(v)
        else:
            clean[k] = v
    return clean

class AuditRepository:
    """
    Lightweight audit repository persisting administrative events in Firestore
    at admin_audit_logs/{id} and in-memory buffer.
    """

    def __init__(self, backend: Optional[str] = None):
        self._backend = (backend or getattr(settings, "PAYMENTS_STORAGE_BACKEND", "firestore")).strip().lower()
        self._memory_logs: List[AuditLogRecord] = []
        self._lock = threading.Lock()

    def record_action(
        self,
        admin_uid: str,
        admin_email: str,
        action: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditLogRecord:
        """Records an administrative event."""
        log_id = f"log_{uuid.uuid4().hex[:16]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        safe_details = sanitize_audit_details(details or {})

        record = AuditLogRecord(
            log_id=log_id,
            admin_uid=admin_uid,
            admin_email=admin_email,
            action=action,
            timestamp=now_iso,
            details=safe_details,
        )

        with self._lock:
            self._memory_logs.append(record)

        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    db.collection("admin_audit_logs").document(log_id).set(record.model_dump())
                    logger.info(f"Audit log recorded: {action} by {admin_email}")
                except Exception as e:
                    logger.warning(f"Failed to record audit log in Firestore: {e}")

        return record

    def list_logs(self, limit: int = 50) -> List[AuditLogRecord]:
        """Lists recent administrative events sorted newest first."""
        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    docs = db.collection("admin_audit_logs").order_by("timestamp", direction="DESCENDING").limit(limit).stream()
                    results = [AuditLogRecord.model_validate(d.to_dict()) for d in docs]
                    if results:
                        return results
                except Exception as e:
                    logger.warning(f"Failed to fetch audit logs from Firestore: {e}")

        with self._lock:
            logs = list(self._memory_logs)
            logs.sort(key=lambda x: x.timestamp, reverse=True)
            return logs[:limit]

    def reset_for_testing(self):
        with self._lock:
            self._memory_logs.clear()
