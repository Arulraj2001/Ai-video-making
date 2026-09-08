import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies.auth import AuthenticatedUser, get_admin_user
from app.models.inquiry import (
    ContactInquiryCreate,
    ContactInquiryUpdate,
    ContactInquiryResponse,
)
from app.services.contact.contact_service import ContactService, get_contact_service

logger = logging.getLogger("scenora.contact.api")

router = APIRouter(tags=["Contact & Support Inquiries"])


@router.post("/contact", response_model=ContactInquiryResponse, status_code=status.HTTP_201_CREATED)
def submit_contact_inquiry(
    request: ContactInquiryCreate,
    contact_svc: ContactService = Depends(get_contact_service),
) -> ContactInquiryResponse:
    """
    Public endpoint: Creators or visitors submit questions, GPU support requests,
    or billing inquiries. Does not require authentication.
    """
    record = contact_svc.submit_inquiry(request)
    return ContactInquiryResponse.model_validate(record.model_dump())


@router.get("/admin/inquiries", response_model=List[ContactInquiryResponse])
def list_contact_inquiries(
    status: Optional[str] = Query(None, description="Filter by status: unread, read, replied, archived"),
    admin: AuthenticatedUser = Depends(get_admin_user),
    contact_svc: ContactService = Depends(get_contact_service),
) -> List[ContactInquiryResponse]:
    """
    Admin-only: Lists all creator inquiries with optional status filtering.
    """
    records = contact_svc.list_inquiries(status_filter=status)
    return [ContactInquiryResponse.model_validate(r.model_dump()) for r in records]


@router.get("/admin/inquiries/{inquiry_id}", response_model=ContactInquiryResponse)
def get_contact_inquiry(
    inquiry_id: str,
    admin: AuthenticatedUser = Depends(get_admin_user),
    contact_svc: ContactService = Depends(get_contact_service),
) -> ContactInquiryResponse:
    """
    Admin-only: Retrieves a single inquiry by ID.
    """
    record = contact_svc.get_inquiry(inquiry_id)
    return ContactInquiryResponse.model_validate(record.model_dump())


@router.patch("/admin/inquiries/{inquiry_id}", response_model=ContactInquiryResponse)
def update_contact_inquiry(
    inquiry_id: str,
    request: ContactInquiryUpdate,
    admin: AuthenticatedUser = Depends(get_admin_user),
    contact_svc: ContactService = Depends(get_contact_service),
) -> ContactInquiryResponse:
    """
    Admin-only: Updates an inquiry's status (e.g. read, replied, archived) or admin notes.
    """
    admin_id = admin.email or admin.uid
    record = contact_svc.update_inquiry(inquiry_id, request, admin_identifier=admin_id)
    return ContactInquiryResponse.model_validate(record.model_dump())


@router.delete("/admin/inquiries/{inquiry_id}")
def delete_contact_inquiry(
    inquiry_id: str,
    admin: AuthenticatedUser = Depends(get_admin_user),
    contact_svc: ContactService = Depends(get_contact_service),
):
    """
    Admin-only: Deletes an inquiry record.
    """
    admin_id = admin.email or admin.uid
    contact_svc.delete_inquiry(inquiry_id, admin_identifier=admin_id)
    return {"message": f"Inquiry {inquiry_id} successfully deleted."}
