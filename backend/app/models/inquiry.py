from typing import Optional
from pydantic import BaseModel, Field

class ContactInquiryCreate(BaseModel):
    """Payload submitted by a creator on the public /contact page."""
    name: str = Field(min_length=2, max_length=100, description="Creator full name")
    email: str = Field(
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        description="Creator contact email"
    )
    subject: str = Field(default="General Inquiry", max_length=150, description="Inquiry topic / category")
    channel_url: Optional[str] = Field(None, max_length=300, description="Optional YouTube or social channel URL")
    message: str = Field(min_length=10, max_length=3000, description="Inquiry message content")

class ContactInquiryUpdate(BaseModel):
    """Admin payload to update inquiry status or internal admin notes."""
    status: Optional[str] = Field(None, pattern="^(unread|read|replied|archived)$")
    admin_notes: Optional[str] = Field(None, max_length=2000)

class ContactInquiryRecord(BaseModel):
    """Complete inquiry record stored in Firestore or memory."""
    inquiry_id: str
    name: str
    email: str
    subject: str
    channel_url: Optional[str] = None
    message: str
    status: str = "unread"  # "unread" | "read" | "replied" | "archived"
    submitted_at: str  # ISO UTC
    admin_notes: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None

class ContactInquiryResponse(BaseModel):
    """Safe response returned to creator or admin."""
    inquiry_id: str
    name: str
    email: str
    subject: str
    channel_url: Optional[str] = None
    message: str
    status: str
    submitted_at: str
    admin_notes: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
