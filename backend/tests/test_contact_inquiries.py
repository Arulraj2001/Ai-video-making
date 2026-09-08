import pytest
from starlette.testclient import TestClient
from app.main import app
from app.services.contact.contact_service import get_contact_service

client = TestClient(app)

ADMIN_HEADERS = {"Authorization": "Bearer test-token-admin"}
USER_HEADERS = {"Authorization": "Bearer test-token-creator-alice"}

from app.services.contact.contact_repository import ContactRepository

@pytest.fixture(autouse=True)
def reset_inquiries():
    """Reset in-memory inquiries before each test."""
    svc = get_contact_service()
    svc.repository = ContactRepository(backend="local")
    svc.repository.reset_for_testing()

def test_public_contact_submission_success():
    """Public creator can submit an inquiry without authentication."""
    resp = client.post(
        "/api/contact",
        json={
            "name": "Sarah Jenkins",
            "email": "sarah@creatorchannel.com",
            "subject": "Technical & Local GPU Setup",
            "channel_url": "https://youtube.com/@sarahcreates",
            "message": "Hello Scenora team, can I run local PyTorch diffusion on an RTX 3070 with 8GB VRAM?",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["inquiry_id"].startswith("inq_")
    assert data["name"] == "Sarah Jenkins"
    assert data["email"] == "sarah@creatorchannel.com"
    assert data["status"] == "unread"
    assert data["submitted_at"] is not None

def test_contact_submission_validation_errors():
    """Validates required email format and minimum message length."""
    # Invalid email
    resp1 = client.post(
        "/api/contact",
        json={
            "name": "Sarah Jenkins",
            "email": "not-an-email",
            "message": "Valid message with more than 10 characters.",
        },
    )
    assert resp1.status_code == 422

    # Short message
    resp2 = client.post(
        "/api/contact",
        json={
            "name": "Sarah",
            "email": "sarah@test.com",
            "message": "Short",
        },
    )
    assert resp2.status_code == 422

def test_admin_inquiries_security_enforcement():
    """Unauthenticated or non-admin requests cannot access admin inquiries."""
    resp_no_auth = client.get("/api/admin/inquiries")
    assert resp_no_auth.status_code in (401, 403)

    resp_user = client.get("/api/admin/inquiries", headers=USER_HEADERS)
    assert resp_user.status_code == 403

def test_admin_inquiry_lifecycle_and_updates():
    """Admin can list inquiries, filter by status, update status/notes, and delete."""
    # 1. Submit two inquiries
    inq1 = client.post(
        "/api/contact",
        json={
            "name": "Alice Channel",
            "email": "alice@channel.com",
            "subject": "Billing",
            "message": "Question about 6-month creator pass via UPI.",
        },
    ).json()

    inq2 = client.post(
        "/api/contact",
        json={
            "name": "Bob Studio",
            "email": "bob@studio.com",
            "subject": "Local RTX GPU",
            "message": "How do I configure CUDA on Windows 11?",
        },
    ).json()

    # 2. Admin lists all inquiries
    resp_all = client.get("/api/admin/inquiries", headers=ADMIN_HEADERS)
    assert resp_all.status_code == 200
    all_inqs = resp_all.json()
    assert len(all_inqs) == 2
    assert all_inqs[0]["status"] == "unread"

    # 3. Admin updates inq1 to "replied" with admin notes
    patch_resp = client.patch(
        f"/api/admin/inquiries/{inq1['inquiry_id']}",
        json={
            "status": "replied",
            "admin_notes": "Sent email reply explaining UPI UTR verification.",
        },
        headers=ADMIN_HEADERS,
    )
    assert patch_resp.status_code == 200
    updated1 = patch_resp.json()
    assert updated1["status"] == "replied"
    assert updated1["admin_notes"] == "Sent email reply explaining UPI UTR verification."
    assert updated1["reviewed_by"] is not None

    # 4. Admin filters by status: unread should have 1, replied should have 1
    resp_unread = client.get("/api/admin/inquiries?status=unread", headers=ADMIN_HEADERS)
    assert resp_unread.status_code == 200
    assert len(resp_unread.json()) == 1
    assert resp_unread.json()[0]["inquiry_id"] == inq2["inquiry_id"]

    resp_replied = client.get("/api/admin/inquiries?status=replied", headers=ADMIN_HEADERS)
    assert resp_replied.status_code == 200
    assert len(resp_replied.json()) == 1
    assert resp_replied.json()[0]["inquiry_id"] == inq1["inquiry_id"]

    # 5. Admin deletes inq2
    del_resp = client.delete(f"/api/admin/inquiries/{inq2['inquiry_id']}", headers=ADMIN_HEADERS)
    assert del_resp.status_code == 200

    resp_after_del = client.get("/api/admin/inquiries", headers=ADMIN_HEADERS)
    assert len(resp_after_del.json()) == 1
