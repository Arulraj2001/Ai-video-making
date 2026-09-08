import logging
import threading
from typing import Dict, List, Optional, Any

from app.configuration.config import settings
from app.configuration.firebase import get_firestore_client
from app.models.inquiry import ContactInquiryRecord

logger = logging.getLogger("scenora.contact.repository")

class ContactRepository:
    """
    Repository for persisting and querying creator contact inquiries.
    Supports Firestore persistence with in-memory caching/fallback for tests and local development.
    """

    def __init__(self, backend: Optional[str] = None):
        self._backend = (backend or getattr(settings, "PAYMENTS_STORAGE_BACKEND", "firestore")).strip().lower()
        self._inquiries: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def reset_for_testing(self):
        """Clears in-memory inquiries for isolated test runs."""
        with self._lock:
            self._inquiries.clear()

    def create_inquiry(self, record: ContactInquiryRecord) -> ContactInquiryRecord:
        """Stores a new contact inquiry in Firestore and in-memory store."""
        data = record.model_dump()
        with self._lock:
            self._inquiries[record.inquiry_id] = dict(data)

        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    db.collection("inquiries").document(record.inquiry_id).set(data)
                    logger.info(f"Saved contact inquiry {record.inquiry_id} to Firestore.")
                except Exception as e:
                    logger.warning(f"Failed to save inquiry {record.inquiry_id} to Firestore: {e}")

        return record

    def get_inquiry(self, inquiry_id: str) -> Optional[ContactInquiryRecord]:
        """Retrieves a single inquiry by ID."""
        with self._lock:
            if inquiry_id in self._inquiries:
                return ContactInquiryRecord.model_validate(self._inquiries[inquiry_id])

        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    doc = db.collection("inquiries").document(inquiry_id).get()
                    if doc.exists:
                        data = doc.to_dict() or {}
                        rec = ContactInquiryRecord.model_validate(data)
                        with self._lock:
                            self._inquiries[inquiry_id] = dict(data)
                        return rec
                except Exception as e:
                    logger.warning(f"Failed to fetch inquiry {inquiry_id} from Firestore: {e}")

        return None

    def list_inquiries(self, status: Optional[str] = None) -> List[ContactInquiryRecord]:
        """Lists all inquiries, optionally filtered by status, sorted newest first."""
        results: List[ContactInquiryRecord] = []

        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    query = db.collection("inquiries")
                    if status and status.lower() != "all":
                        query = query.where("status", "==", status.lower())
                    
                    docs = query.stream()
                    for d in docs:
                        data = d.to_dict() or {}
                        rec = ContactInquiryRecord.model_validate(data)
                        with self._lock:
                            self._inquiries[rec.inquiry_id] = dict(data)
                        results.append(rec)
                    
                    results.sort(key=lambda r: r.submitted_at, reverse=True)
                    return results
                except Exception as e:
                    logger.warning(f"Failed to list inquiries from Firestore: {e}")

        # Fallback to in-memory store
        with self._lock:
            for data in self._inquiries.values():
                rec = ContactInquiryRecord.model_validate(data)
                if not status or status.lower() == "all" or rec.status.lower() == status.lower():
                    results.append(rec)

        results.sort(key=lambda r: r.submitted_at, reverse=True)
        return results

    def update_inquiry(self, record: ContactInquiryRecord) -> ContactInquiryRecord:
        """Updates an existing inquiry record."""
        data = record.model_dump()
        with self._lock:
            self._inquiries[record.inquiry_id] = dict(data)

        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    db.collection("inquiries").document(record.inquiry_id).set(data)
                except Exception as e:
                    logger.warning(f"Failed to update inquiry {record.inquiry_id} in Firestore: {e}")

        return record

    def delete_inquiry(self, inquiry_id: str) -> bool:
        """Deletes an inquiry record."""
        with self._lock:
            self._inquiries.pop(inquiry_id, None)

        if self._backend == "firestore":
            db = get_firestore_client()
            if db:
                try:
                    db.collection("inquiries").document(inquiry_id).delete()
                    return True
                except Exception as e:
                    logger.warning(f"Failed to delete inquiry {inquiry_id} from Firestore: {e}")

        return True
