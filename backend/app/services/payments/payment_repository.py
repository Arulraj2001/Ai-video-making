import logging
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

from app.configuration.config import settings
from app.configuration.firebase import get_firestore_client
from app.models.payment import PaymentRecord, EntitlementRecord

logger = logging.getLogger("scenora.payments.repository")

class PaymentRepository:
    """
    Repository for persisting and querying payment and entitlement records.
    Supports:
    - 'firestore': Cloud Firestore subcollections:
        - users/{uid}/payments/{paymentId}
        - users/{uid}/entitlements/{entitlementId}
        - payments_index/{paymentId} (for admin pending lookup)
    - 'local' / 'memory': Thread-safe in-memory store for unit tests and local development.
    """

    def __init__(self, backend: Optional[str] = None):
        self._backend = (backend or getattr(settings, "PAYMENTS_STORAGE_BACKEND", "firestore")).strip().lower()
        self._payments: Dict[str, Dict[str, Any]] = {}
        self._entitlements: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def reset_for_testing(self):
        """Clears in-memory payments and entitlements for isolated unit testing."""
        with self._lock:
            self._payments.clear()
            self._entitlements.clear()


    def create_payment(self, payment: PaymentRecord) -> PaymentRecord:
        """Stores a new payment record under users/{uid}/payments/{paymentId}."""
        payment_dict = payment.model_dump()
        with self._lock:
            self._payments[payment.payment_id] = dict(payment_dict)

        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    # Write to subcollection users/{uid}/payments/{paymentId}
                    db.collection("users").document(payment.uid).collection("payments").document(payment.payment_id).set(payment_dict)
                    # Write to index collection payments_index/{paymentId} for cross-user admin queries
                    db.collection("payments_index").document(payment.payment_id).set({
                        "payment_id": payment.payment_id,
                        "uid": payment.uid,
                        "status": payment.status,
                        "submitted_at": payment.submitted_at,
                    })
                except Exception as e:
                    logger.warning(f"Failed to persist payment {payment.payment_id} to Firestore: {e}")

        return payment

    def update_payment(self, payment: PaymentRecord) -> PaymentRecord:
        """Updates an existing payment record."""
        payment_dict = payment.model_dump()
        with self._lock:
            self._payments[payment.payment_id] = dict(payment_dict)

        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    db.collection("users").document(payment.uid).collection("payments").document(payment.payment_id).set(payment_dict)
                    db.collection("payments_index").document(payment.payment_id).set({
                        "payment_id": payment.payment_id,
                        "uid": payment.uid,
                        "status": payment.status,
                        "submitted_at": payment.submitted_at,
                        "reviewed_at": payment.reviewed_at,
                    }, merge=True)
                except Exception as e:
                    logger.warning(f"Failed to update payment {payment.payment_id} in Firestore: {e}")

        return payment

    def get_payment(self, uid: str, payment_id: str) -> Optional[PaymentRecord]:
        """Retrieves a payment record scoped to the authenticated creator."""
        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    doc = db.collection("users").document(uid).collection("payments").document(payment_id).get()
                    if doc.exists:
                        return PaymentRecord.model_validate(doc.to_dict())
                except Exception as e:
                    logger.warning(f"Failed to fetch payment {payment_id} from Firestore: {e}")

        with self._lock:
            data = self._payments.get(payment_id)
            if data and data.get("uid") == uid:
                return PaymentRecord.model_validate(data)
        return None

    def get_payment_by_id(self, payment_id: str) -> Optional[PaymentRecord]:
        """Admin helper: retrieves a payment record by ID across all creators."""
        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    # First check index to get UID
                    idx_doc = db.collection("payments_index").document(payment_id).get()
                    if idx_doc.exists:
                        uid = idx_doc.to_dict().get("uid")
                        if uid:
                            doc = db.collection("users").document(uid).collection("payments").document(payment_id).get()
                            if doc.exists:
                                return PaymentRecord.model_validate(doc.to_dict())
                except Exception as e:
                    logger.warning(f"Failed to fetch payment by ID {payment_id} from Firestore: {e}")

        with self._lock:
            data = self._payments.get(payment_id)
            if data:
                return PaymentRecord.model_validate(data)
        return None

    def list_user_payments(self, uid: str) -> List[PaymentRecord]:
        """Lists all payment records for a specific creator."""
        results: List[PaymentRecord] = []
        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    docs = db.collection("users").document(uid).collection("payments").order_by("submitted_at", direction="DESCENDING").stream()
                    for doc in docs:
                        results.append(PaymentRecord.model_validate(doc.to_dict()))
                    if results:
                        return results
                except Exception as e:
                    logger.warning(f"Failed to list user payments from Firestore: {e}")

        with self._lock:
            user_items = [
                PaymentRecord.model_validate(p)
                for p in self._payments.values()
                if p.get("uid") == uid
            ]
            user_items.sort(key=lambda x: x.submitted_at, reverse=True)
            return user_items

    def list_pending_payments(self) -> List[PaymentRecord]:
        """Lists all payments with status == 'pending' for admin review."""
        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    idx_docs = db.collection("payments_index").where("status", "==", "pending").stream()
                    pending_list: List[PaymentRecord] = []
                    for idx_doc in idx_docs:
                        idx_data = idx_doc.to_dict()
                        uid = idx_data.get("uid")
                        pid = idx_data.get("payment_id")
                        if uid and pid:
                            rec = self.get_payment(uid, pid)
                            if rec and rec.status == "pending":
                                pending_list.append(rec)
                    if pending_list:
                        pending_list.sort(key=lambda x: x.submitted_at, reverse=True)
                        return pending_list
                except Exception as e:
                    logger.warning(f"Failed to list pending payments from Firestore: {e}")

        with self._lock:
            pending = [
                PaymentRecord.model_validate(p)
                for p in self._payments.values()
                if p.get("status") == "pending"
            ]
            pending.sort(key=lambda x: x.submitted_at, reverse=True)
            return pending

    def list_all_payments(self, status_filter: Optional[str] = None) -> List[PaymentRecord]:
        """Admin operation: lists all payments from Firestore or in-memory, optionally filtered by status."""
        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    query = db.collection("payments_index")
                    if status_filter and status_filter.lower() != "all":
                        query = query.where("status", "==", status_filter.lower())
                    idx_docs = query.stream()
                    items: List[PaymentRecord] = []
                    for idx_doc in idx_docs:
                        idx_data = idx_doc.to_dict()
                        uid = idx_data.get("uid")
                        pid = idx_data.get("payment_id")
                        if uid and pid:
                            rec = self.get_payment(uid, pid)
                            if rec:
                                items.append(rec)
                    items.sort(key=lambda x: x.submitted_at, reverse=True)
                    return items
                except Exception as e:
                    logger.warning(f"Failed to list all payments from Firestore: {e}")

        with self._lock:
            records = [PaymentRecord.model_validate(p) for p in self._payments.values()]
            if status_filter and status_filter.lower() != "all":
                records = [p for p in records if p.status.lower() == status_filter.lower()]
            records.sort(key=lambda x: x.submitted_at, reverse=True)
            return records

    def create_or_update_entitlement(self, entitlement: EntitlementRecord) -> EntitlementRecord:
        """Stores an entitlement record under users/{uid}/entitlements/{entitlementId}."""
        ent_dict = entitlement.model_dump()
        with self._lock:
            self._entitlements[entitlement.entitlement_id] = dict(ent_dict)

        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    db.collection("users").document(entitlement.uid).collection("entitlements").document(entitlement.entitlement_id).set(ent_dict)
                except Exception as e:
                    logger.warning(f"Failed to persist entitlement {entitlement.entitlement_id} to Firestore: {e}")

        return entitlement

    def list_user_entitlements(self, uid: str) -> List[EntitlementRecord]:
        """Lists all entitlements for a user."""
        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    docs = db.collection("users").document(uid).collection("entitlements").stream()
                    results = [EntitlementRecord.model_validate(d.to_dict()) for d in docs]
                    if results:
                        return results
                except Exception as e:
                    logger.warning(f"Failed to list user entitlements from Firestore: {e}")

        with self._lock:
            return [
                EntitlementRecord.model_validate(e)
                for e in self._entitlements.values()
                if e.get("uid") == uid
            ]

    def get_active_entitlement(self, uid: str) -> Optional[EntitlementRecord]:
        """
        Retrieves the latest active entitlement for a creator.
        Server verifies that status == 'active' and expires_at > now_utc.
        """
        entitlements = self.list_user_entitlements(uid)
        now_iso = datetime.now(timezone.utc).isoformat()

        active_entitlements = [
            e for e in entitlements
            if e.status == "active" and e.expires_at > now_iso
        ]

        if not active_entitlements:
            return None

        # Sort by expires_at descending (latest expiration)
        active_entitlements.sort(key=lambda x: x.expires_at, reverse=True)
        return active_entitlements[0]
