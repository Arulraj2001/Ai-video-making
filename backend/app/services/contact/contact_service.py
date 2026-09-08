import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status

from app.models.inquiry import (
    ContactInquiryCreate,
    ContactInquiryRecord,
    ContactInquiryUpdate,
    ContactInquiryResponse,
)
from app.services.contact.contact_repository import ContactRepository

logger = logging.getLogger("scenora.contact.service")

class ContactService:
    """Business service handling creator contact submissions and admin management."""

    def __init__(self, repository: Optional[ContactRepository] = None):
        self.repository = repository or ContactRepository()

    def submit_inquiry(self, req: ContactInquiryCreate) -> ContactInquiryRecord:
        """Processes and stores a new public contact inquiry."""
        inquiry_id = f"inq_{uuid.uuid4().hex[:16]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        record = ContactInquiryRecord(
            inquiry_id=inquiry_id,
            name=req.name.strip(),
            email=str(req.email).strip().lower(),
            subject=req.subject.strip(),
            channel_url=req.channel_url.strip() if req.channel_url else None,
            message=req.message.strip(),
            status="unread",
            submitted_at=now_iso,
            admin_notes=None,
            reviewed_at=None,
            reviewed_by=None,
        )

        saved = self.repository.create_inquiry(record)
        logger.info(f"New contact inquiry submitted: {inquiry_id} from {saved.email}")
        return saved

    def list_inquiries(self, status_filter: Optional[str] = None) -> List[ContactInquiryRecord]:
        """Lists inquiries with optional status filtering."""
        return self.repository.list_inquiries(status=status_filter)

    def get_inquiry(self, inquiry_id: str) -> ContactInquiryRecord:
        """Retrieves a single inquiry or raises 404."""
        inq = self.repository.get_inquiry(inquiry_id)
        if not inq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contact inquiry {inquiry_id} not found."
            )
        return inq

    def update_inquiry(
        self, inquiry_id: str, updates: ContactInquiryUpdate, admin_identifier: str
    ) -> ContactInquiryRecord:
        """Updates inquiry status or notes by admin."""
        inq = self.get_inquiry(inquiry_id)
        now_iso = datetime.now(timezone.utc).isoformat()

        if updates.status is not None:
            inq.status = updates.status
            inq.reviewed_at = now_iso
            inq.reviewed_by = admin_identifier

        if updates.admin_notes is not None:
            inq.admin_notes = updates.admin_notes

        saved = self.repository.update_inquiry(inq)
        logger.info(f"Inquiry {inquiry_id} updated by {admin_identifier}: status={inq.status}")
        return saved

    def delete_inquiry(self, inquiry_id: str, admin_identifier: str) -> bool:
        """Deletes an inquiry record."""
        self.get_inquiry(inquiry_id)  # Validate existence
        self.repository.delete_inquiry(inquiry_id)
        logger.info(f"Inquiry {inquiry_id} deleted by {admin_identifier}")
        return True


_contact_service_instance: Optional[ContactService] = None

def get_contact_service() -> ContactService:
    """Dependency injection provider for ContactService."""
    global _contact_service_instance
    if _contact_service_instance is None:
        _contact_service_instance = ContactService()
    return _contact_service_instance
