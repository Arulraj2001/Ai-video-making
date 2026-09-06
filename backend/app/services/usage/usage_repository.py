import logging
import threading
from datetime import datetime, timezone
from typing import Dict, Optional, Tuple, Any

from app.configuration.config import settings
from app.configuration.firebase import get_firestore_client
from app.models.usage import UserUsageRecord

logger = logging.getLogger("scenora.usage.repository")

class UsageRepository:
    """
    Repository for persisting and retrieving user usage records.
    Supports:
    - 'firestore': Cloud Firestore subcollection users/{uid}/usage/{period} (Production)
    - 'local' / 'memory': Thread-safe atomic in-memory store (Testing and local dev)
    """

    def __init__(self, backend: Optional[str] = None):
        self._backend = (backend or getattr(settings, "USAGE_STORAGE_BACKEND", "firestore")).strip().lower()
        self._memory_store: Dict[str, Dict[str, Any]] = {}
        self._locks: Dict[str, threading.Lock] = {}
        self._global_lock = threading.Lock()

    def _get_lock_for_user(self, uid: str, period: str) -> threading.Lock:
        key = f"{uid}:{period}"
        with self._global_lock:
            if key not in self._locks:
                self._locks[key] = threading.Lock()
            return self._locks[key]

    def get_usage(self, uid: str, period: str, default_reset_at: str) -> UserUsageRecord:
        """Retrieves or initializes a user usage record for the period."""
        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    doc_ref = db.collection("users").document(uid).collection("usage").document(period)
                    snap = doc_ref.get()
                    if snap.exists:
                        data = snap.to_dict() or {}
                        return UserUsageRecord.model_validate(data)
                except Exception as e:
                    logger.warning(f"Failed to read usage from Firestore for {uid}/{period}: {e}")

        # Fallback to local memory store
        key = f"{uid}:{period}"
        with self._get_lock_for_user(uid, period):
            if key in self._memory_store:
                return UserUsageRecord.model_validate(self._memory_store[key])
            # Return new empty record
            new_rec = UserUsageRecord(
                uid=uid,
                period=period,
                generationCount=0,
                freeTierGenerations=0,
                byokGenerations=0,
                successfulGenerations=0,
                failedGenerations=0,
                resetAt=default_reset_at,
            )
            return new_rec

    def atomic_reserve_quota(
        self,
        uid: str,
        period: str,
        limit: int,
        is_byok: bool,
        default_reset_at: str,
    ) -> Tuple[bool, UserUsageRecord]:
        """
        Atomically checks if quota is available and reserves a slot.
        If is_byok is True, always succeeds (BYOK does not consume free tier).
        If is_byok is False:
          - If freeTierGenerations >= limit: returns (False, current_record)
          - If freeTierGenerations < limit: atomically increments freeTierGenerations and returns (True, updated_record)
        """
        now_iso = datetime.now(timezone.utc).isoformat()

        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    doc_ref = db.collection("users").document(uid).collection("usage").document(period)
                    transaction = db.transaction()

                    @get_firestore_transactional(db)
                    def txn_reserve(txn):
                        snap = doc_ref.get(transaction=txn)
                        if snap.exists:
                            data = snap.to_dict() or {}
                            rec = UserUsageRecord.model_validate(data)
                        else:
                            rec = UserUsageRecord(
                                uid=uid,
                                period=period,
                                generationCount=0,
                                freeTierGenerations=0,
                                byokGenerations=0,
                                successfulGenerations=0,
                                failedGenerations=0,
                                resetAt=default_reset_at,
                            )

                        if not is_byok and rec.freeTierGenerations >= limit:
                            return False, rec

                        # Pre-reserve free tier generation
                        if not is_byok:
                            rec.freeTierGenerations += 1
                        else:
                            rec.byokGenerations += 1

                        rec.updatedAt = now_iso
                        txn.set(doc_ref, rec.model_dump())
                        return True, rec

                    return txn_reserve(transaction)
                except Exception as e:
                    logger.warning(f"Firestore transaction reserve failed: {e}. Falling back to memory lock.")

        # Local / Memory atomic reservation
        key = f"{uid}:{period}"
        with self._get_lock_for_user(uid, period):
            if key in self._memory_store:
                rec = UserUsageRecord.model_validate(self._memory_store[key])
            else:
                rec = UserUsageRecord(
                    uid=uid,
                    period=period,
                    generationCount=0,
                    freeTierGenerations=0,
                    byokGenerations=0,
                    successfulGenerations=0,
                    failedGenerations=0,
                    resetAt=default_reset_at,
                )

            if not is_byok and rec.freeTierGenerations >= limit:
                return False, rec

            if not is_byok:
                rec.freeTierGenerations += 1
            else:
                rec.byokGenerations += 1

            rec.updatedAt = now_iso
            self._memory_store[key] = rec.model_dump()
            return True, rec

    def finalize_generation(
        self,
        uid: str,
        period: str,
        is_byok: bool,
        success: bool,
        default_reset_at: str,
    ) -> UserUsageRecord:
        """
        Finalizes a generation reservation:
        - If success: increments generationCount and successfulGenerations
        - If failure: decrements the pre-reserved freeTierGenerations (or byokGenerations)
          and increments failedGenerations (guarantees failed requests NEVER consume quota).
        """
        now_iso = datetime.now(timezone.utc).isoformat()

        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    doc_ref = db.collection("users").document(uid).collection("usage").document(period)
                    transaction = db.transaction()

                    @get_firestore_transactional(db)
                    def txn_finalize(txn):
                        snap = doc_ref.get(transaction=txn)
                        data = snap.to_dict() if snap.exists else {}
                        rec = UserUsageRecord.model_validate(data) if data else UserUsageRecord(
                            uid=uid,
                            period=period,
                            resetAt=default_reset_at
                        )

                        if success:
                            rec.generationCount += 1
                            rec.successfulGenerations += 1
                        else:
                            # Revert reservation on failure
                            if not is_byok and rec.freeTierGenerations > 0:
                                rec.freeTierGenerations -= 1
                            elif is_byok and rec.byokGenerations > 0:
                                rec.byokGenerations -= 1
                            rec.failedGenerations += 1

                        rec.updatedAt = now_iso
                        txn.set(doc_ref, rec.model_dump())
                        return rec

                    return txn_finalize(transaction)
                except Exception as e:
                    logger.warning(f"Firestore finalize failed: {e}. Falling back to memory.")

        key = f"{uid}:{period}"
        with self._get_lock_for_user(uid, period):
            if key in self._memory_store:
                rec = UserUsageRecord.model_validate(self._memory_store[key])
            else:
                rec = UserUsageRecord(uid=uid, period=period, resetAt=default_reset_at)

            if success:
                rec.generationCount += 1
                rec.successfulGenerations += 1
            else:
                if not is_byok and rec.freeTierGenerations > 0:
                    rec.freeTierGenerations -= 1
                elif is_byok and rec.byokGenerations > 0:
                    rec.byokGenerations -= 1
                rec.failedGenerations += 1

            rec.updatedAt = now_iso
            self._memory_store[key] = rec.model_dump()
            return rec

    def reset_usage_for_testing(self, uid: Optional[str] = None):
        """Helper for test isolation."""
        with self._global_lock:
            if uid:
                self._memory_store = {k: v for k, v in self._memory_store.items() if not k.startswith(f"{uid}:")}
            else:
                self._memory_store.clear()


def get_firestore_transactional(db):
    try:
        from firebase_admin import firestore
        return firestore.transactional
    except Exception:
        # Fallback dummy decorator
        def decorator(fn):
            return fn
        return decorator
