import io
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api.dependencies.auth import ADMIN_EMAILS
from app.configuration.config import settings
from app.models.scene import SceneModel
from app.models.payment import PaymentRecord, EntitlementRecord
from app.services.payments.payment_service import get_payment_service, PaymentService
from app.services.payments.payment_repository import PaymentRepository
from app.services.usage import get_usage_service, UsageRepository
from app.services.project_service import project_service

client = TestClient(app)

ADMIN_EMAIL = list(ADMIN_EMAILS)[0]  # sridharparthasarathy2002@gmail.com
ADMIN_HEADERS = {"Authorization": "Bearer test-token-admin"}
USER_A_HEADERS = {"Authorization": "Bearer test-token-creator-alice"}
USER_B_HEADERS = {"Authorization": "Bearer test-token-creator-bob"}


def create_test_project_with_scenes(user_id: str, scene_count: int = 8):
    headers = {"Authorization": f"Bearer test-token-{user_id}"}
    resp = client.post(
        "/api/projects",
        json={"name": f"Project for {user_id}", "description": "Test video project"},
        headers=headers,
    )
    assert resp.status_code == 201
    proj_id = resp.json()["id"]

    project = project_service.get_project(proj_id)
    project.scenes = [
        SceneModel(
            id=f"scene-{i+1}",
            start=float(i * 3),
            end=float((i + 1) * 3),
            duration=3.0,
            caption=f"Scene caption {i+1}",
            image_prompt=f"Cinematic prompt {i+1}",
        )
        for i in range(scene_count)
    ]
    project_service._save_to_disk(project)
    return proj_id



@pytest.fixture(autouse=True)
def setup_payments_test_env(tmp_path, monkeypatch):
    """Isolates repository storage and resets test state before each test."""
    monkeypatch.setattr("app.services.project_service.PROJECTS_DIR", tmp_path / "projects")
    monkeypatch.setattr("app.services.scene_image_service.STORAGE_DIR", tmp_path / "storage")
    monkeypatch.setattr("app.configuration.config.settings.STORAGE_DIR", str(tmp_path / "storage"))
    monkeypatch.setattr("app.configuration.config.settings.IMAGE_GENERATOR_PROVIDER", "mock")
    monkeypatch.setattr("app.configuration.config.settings.FREE_GENERATION_LIMIT", 5)
    monkeypatch.setattr("app.configuration.config.settings.PAYMENTS_STORAGE_BACKEND", "local")
    monkeypatch.setattr("app.configuration.config.settings.USAGE_STORAGE_BACKEND", "local")
    monkeypatch.setattr("app.configuration.config.settings.CREDENTIAL_VAULT_BACKEND", "local")

    # Reset payments service singleton
    payment_svc = get_payment_service()
    payment_svc.repository = PaymentRepository(backend="local")
    payment_svc.repository.reset_for_testing()

    # Reset usage service singleton
    usage_svc = get_usage_service()
    usage_svc.repository = UsageRepository(backend="local")
    usage_svc.repository.reset_usage_for_testing()

    project_service._projects.clear()
    yield
    payment_svc.repository.reset_for_testing()
    usage_svc.repository.reset_usage_for_testing()


def test_get_yearly_plan_config():
    """1. Plan Configuration: dynamic non-hardcoded pricing and instructions."""
    resp = client.get("/api/plans/yearly")
    assert resp.status_code == 200
    data = resp.json()
    assert data["plan_id"] == "scenora-pro-yearly"
    assert data["price_inr"] == 2999
    assert data["price_usd"] == 49
    assert data["duration_days"] == 365
    assert data["enabled"] is True
    assert "scenoraedits@upi" in data["upi_id"]
    assert "buymeacoffee.com" in data["bmc_url"]
    assert len(data["features"]) >= 3


def test_submit_payment_upi():
    """2. User submits UPI payment details: initial status is pending."""
    payload = {
        "plan_id": "scenora-pro-yearly",
        "amount": 2999,
        "currency": "INR",
        "payment_method": "upi",
        "reference": "UTR-428901234567",
    }
    resp = client.post("/api/payments", json=payload, headers=USER_A_HEADERS)
    assert resp.status_code == 201
    data = resp.json()
    assert data["payment_id"].startswith("pay_")
    assert data["uid"] == "creator-alice"
    assert data["status"] == "pending"
    assert data["reference"] == "UTR-428901234567"
    assert data["amount"] == 2999
    assert data["currency"] == "INR"

    # Zero auto-activation: entitlement must be None
    ent_resp = client.get("/api/entitlements/current", headers=USER_A_HEADERS)
    assert ent_resp.status_code == 200
    assert ent_resp.json() is None


def test_submit_payment_bmc():
    """3. User submits Buy Me a Coffee international payment."""
    payload = {
        "plan_id": "scenora-pro-yearly",
        "amount": 49,
        "currency": "USD",
        "payment_method": "buymeacoffee",
        "reference": "Supporter John Doe #8812",
    }
    resp = client.post("/api/payments", json=payload, headers=USER_B_HEADERS)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "pending"
    assert data["uid"] == "creator-bob"
    assert data["amount"] == 49
    assert data["currency"] == "USD"


def test_payment_proof_upload_valid():
    """4. Valid proof upload saves under UID-scoped path."""
    # First submit payment
    sub_resp = client.post(
        "/api/payments",
        json={
            "plan_id": "scenora-pro-yearly",
            "amount": 2999,
            "currency": "INR",
            "payment_method": "upi",
            "reference": "UTR-VALID-PROOF-1",
        },
        headers=USER_A_HEADERS,
    )
    payment_id = sub_resp.json()["payment_id"]

    # Upload proof image
    fake_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"A" * 100
    files = {"file": ("screenshot.png", io.BytesIO(fake_png_bytes), "image/png")}
    upload_resp = client.post(
        f"/api/payments/{payment_id}/proof",
        files=files,
        headers=USER_A_HEADERS,
    )
    assert upload_resp.status_code == 200
    upload_data = upload_resp.json()
    assert upload_data["payment_id"] == payment_id
    assert f"users/creator-alice/payments/{payment_id}/proof/screenshot.png" == upload_data["proof_storage_path"]

    # Verify payment record now has the proof path
    list_resp = client.get("/api/payments", headers=USER_A_HEADERS)
    payments = list_resp.json()
    matching = [p for p in payments if p["payment_id"] == payment_id]
    assert len(matching) == 1
    assert matching[0]["proof_storage_path"] == upload_data["proof_storage_path"]


def test_payment_proof_upload_rejects_non_image():
    """5. Proof upload rejects executable or non-image MIME types."""
    sub_resp = client.post(
        "/api/payments",
        json={
            "plan_id": "scenora-pro-yearly",
            "amount": 2999,
            "currency": "INR",
            "payment_method": "upi",
            "reference": "UTR-MIME-CHECK",
        },
        headers=USER_A_HEADERS,
    )
    payment_id = sub_resp.json()["payment_id"]

    files = {"file": ("malicious.exe", io.BytesIO(b"MZ\x90\x00"), "application/octet-stream")}
    upload_resp = client.post(
        f"/api/payments/{payment_id}/proof",
        files=files,
        headers=USER_A_HEADERS,
    )
    assert upload_resp.status_code == 400
    assert "Invalid file type" in upload_resp.json()["detail"]


def test_payment_proof_upload_rejects_oversized_file():
    """6. Proof upload rejects files exceeding 5MB."""
    sub_resp = client.post(
        "/api/payments",
        json={
            "plan_id": "scenora-pro-yearly",
            "amount": 2999,
            "currency": "INR",
            "payment_method": "upi",
            "reference": "UTR-SIZE-CHECK",
        },
        headers=USER_A_HEADERS,
    )
    payment_id = sub_resp.json()["payment_id"]

    oversized_bytes = b"0" * (5 * 1024 * 1024 + 10)
    files = {"file": ("huge.png", io.BytesIO(oversized_bytes), "image/png")}
    upload_resp = client.post(
        f"/api/payments/{payment_id}/proof",
        files=files,
        headers=USER_A_HEADERS,
    )
    assert upload_resp.status_code == 400
    assert "exceeds 5MB" in upload_resp.json()["detail"]


def test_cross_user_isolation_and_proof_access():
    """7. Cross-user isolation: User B cannot view User A's payments or upload proof for them."""
    # User A creates payment
    sub_a = client.post(
        "/api/payments",
        json={
            "plan_id": "scenora-pro-yearly",
            "amount": 2999,
            "currency": "INR",
            "payment_method": "upi",
            "reference": "UTR-ALICE-ISOLATED",
        },
        headers=USER_A_HEADERS,
    )
    pay_id_a = sub_a.json()["payment_id"]

    # User B lists payments -> should be empty
    list_b = client.get("/api/payments", headers=USER_B_HEADERS)
    assert list_b.status_code == 200
    assert len(list_b.json()) == 0

    # User B attempts to upload proof for User A's payment -> 404
    files = {"file": ("hack.png", io.BytesIO(b"\x89PNG\r\n\x1a\n"), "image/png")}
    hack_resp = client.post(
        f"/api/payments/{pay_id_a}/proof",
        files=files,
        headers=USER_B_HEADERS,
    )
    assert hack_resp.status_code == 404


def test_unauthorized_user_cannot_approve_payment():
    """8. Normal users cannot approve payments (HTTP 403 Forbidden)."""
    sub = client.post(
        "/api/payments",
        json={
            "plan_id": "scenora-pro-yearly",
            "amount": 2999,
            "currency": "INR",
            "payment_method": "upi",
            "reference": "UTR-AUTH-GUARD",
        },
        headers=USER_A_HEADERS,
    )
    pay_id = sub.json()["payment_id"]

    # Alice tries to approve her own payment
    appr_resp = client.post(f"/api/admin/payments/{pay_id}/approve", headers=USER_A_HEADERS)
    assert appr_resp.status_code == 403
    assert "Admin privileges are required" in appr_resp.json()["detail"]


def test_admin_approval_and_entitlement_creation():
    """9. Admin approval activates 1-year entitlement with 365-day expiry."""
    sub = client.post(
        "/api/payments",
        json={
            "plan_id": "scenora-pro-yearly",
            "amount": 2999,
            "currency": "INR",
            "payment_method": "upi",
            "reference": "UTR-APPROVE-TEST-9",
        },
        headers=USER_A_HEADERS,
    )
    pay_id = sub.json()["payment_id"]

    # Admin approves payment
    appr_resp = client.post(f"/api/admin/payments/{pay_id}/approve", headers=ADMIN_HEADERS)
    assert appr_resp.status_code == 200
    appr_data = appr_resp.json()
    assert appr_data["payment"]["status"] == "approved"
    assert appr_data["entitlement"]["is_active"] is True
    assert appr_data["entitlement"]["days_remaining"] == 365

    # Creator checks current entitlement
    ent_resp = client.get("/api/entitlements/current", headers=USER_A_HEADERS)
    assert ent_resp.status_code == 200
    ent = ent_resp.json()
    assert ent is not None
    assert ent["is_active"] is True
    assert ent["status"] == "active"
    assert ent["payment_id"] == pay_id

    # Expiry is exactly 365 days after start
    start_dt = datetime.fromisoformat(ent["started_at"])
    expires_dt = datetime.fromisoformat(ent["expires_at"])
    assert (expires_dt - start_dt).days == 365


def test_duplicate_approval_idempotency():
    """10. Repeated approval does NOT duplicate entitlements or alter duration."""
    sub = client.post(
        "/api/payments",
        json={
            "plan_id": "scenora-pro-yearly",
            "amount": 2999,
            "currency": "INR",
            "payment_method": "upi",
            "reference": "UTR-IDEMPOTENT-10",
        },
        headers=USER_A_HEADERS,
    )
    pay_id = sub.json()["payment_id"]

    # First approval
    resp1 = client.post(f"/api/admin/payments/{pay_id}/approve", headers=ADMIN_HEADERS)
    assert resp1.status_code == 200
    ent1_id = resp1.json()["entitlement"]["entitlement_id"]

    # Second approval (accidental double click / duplicate request)
    resp2 = client.post(f"/api/admin/payments/{pay_id}/approve", headers=ADMIN_HEADERS)
    assert resp2.status_code == 200
    ent2_id = resp2.json()["entitlement"]["entitlement_id"]

    # Idempotent: same entitlement returned
    assert ent1_id == ent2_id

    # Verify repository only has 1 entitlement for user
    payment_svc = get_payment_service()
    entitlements = payment_svc.repository.list_user_entitlements("creator-alice")
    assert len(entitlements) == 1


def test_admin_rejection_flow():
    """11. Admin rejection sets rejected status and grants zero entitlement."""
    sub = client.post(
        "/api/payments",
        json={
            "plan_id": "scenora-pro-yearly",
            "amount": 2999,
            "currency": "INR",
            "payment_method": "upi",
            "reference": "UTR-FAKE-UTR",
        },
        headers=USER_B_HEADERS,
    )
    pay_id = sub.json()["payment_id"]

    # Admin rejects
    reject_resp = client.post(
        f"/api/admin/payments/{pay_id}/reject",
        json={"reason": "Transaction not found on bank statement."},
        headers=ADMIN_HEADERS,
    )
    assert reject_resp.status_code == 200
    rej_data = reject_resp.json()
    assert rej_data["payment"]["status"] == "rejected"
    assert rej_data["payment"]["rejection_reason"] == "Transaction not found on bank statement."

    # Creator has no active entitlement
    ent_resp = client.get("/api/entitlements/current", headers=USER_B_HEADERS)
    assert ent_resp.status_code == 200
    assert ent_resp.json() is None


def test_cannot_approve_rejected_payment():
    """12. Cannot approve a payment that was previously rejected."""
    sub = client.post(
        "/api/payments",
        json={
            "plan_id": "scenora-pro-yearly",
            "amount": 2999,
            "currency": "INR",
            "payment_method": "upi",
            "reference": "UTR-REJECT-FIRST",
        },
        headers=USER_A_HEADERS,
    )
    pay_id = sub.json()["payment_id"]

    client.post(
        f"/api/admin/payments/{pay_id}/reject",
        json={"reason": "Payment bounced."},
        headers=ADMIN_HEADERS,
    )

    appr_resp = client.post(f"/api/admin/payments/{pay_id}/approve", headers=ADMIN_HEADERS)
    assert appr_resp.status_code == 400
    assert "rejected" in appr_resp.json()["detail"].lower()


def test_phase16_usage_integration_paid_access():
    """
    13. Phase 16 Integration:
    - Free user consumes 5 free generations.
    - 6th generation is rejected with HTTP 429.
    - User purchases yearly plan; admin approves.
    - User can now generate 6th, 7th, 8th images without limit.
    """
    user_id = "creator-pro-yearly-user"
    headers = {"Authorization": f"Bearer test-token-{user_id}"}

    # Create project with 8 scenes
    proj_id = create_test_project_with_scenes(user_id, scene_count=8)

    # Consume 5 free generations
    for i in range(1, 6):
        scene_resp = client.post(
            f"/api/projects/{proj_id}/scenes/scene-{i}/generate-image",
            json={"prompt_override": f"Scene {i} prompt"},
            headers=headers,
        )
        assert scene_resp.status_code == 200

    # 6th attempt as free user -> HTTP 429 Too Many Requests
    blocked_resp = client.post(
        f"/api/projects/{proj_id}/scenes/scene-6/generate-image",
        json={"prompt_override": "Scene 6 should be blocked"},
        headers=headers,
    )
    assert blocked_resp.status_code == 429

    # Now user purchases yearly plan and submits payment
    pay_resp = client.post(
        "/api/payments",
        json={
            "plan_id": "scenora-pro-yearly",
            "amount": 2999,
            "currency": "INR",
            "payment_method": "upi",
            "reference": "UTR-PRO-YEARLY-SUCCESS",
        },
        headers=headers,
    )
    assert pay_resp.status_code == 201
    payment_id = pay_resp.json()["payment_id"]

    # Admin approves payment
    appr_resp = client.post(
        f"/api/admin/payments/{payment_id}/approve",
        headers=ADMIN_HEADERS,
    )
    assert appr_resp.status_code == 200

    # Verify usage endpoint reflects paid Pro Yearly status
    usage_resp = client.get("/api/usage", headers=headers)
    assert usage_resp.status_code == 200
    usage_data = usage_resp.json()
    assert usage_data["has_active_entitlement"] is True
    assert usage_data["tier"] == "pro_yearly"
    assert usage_data["status"] == "active"
    assert usage_data["plan_name"] == "ScenoraEdits Pro (Yearly)"

    # Now scene 6, 7 generate successfully without hitting the free limit!
    scene6_resp = client.post(
        f"/api/projects/{proj_id}/scenes/scene-6/generate-image",
        json={"prompt_override": "Scene 6 paid access"},
        headers=headers,
    )
    assert scene6_resp.status_code == 200

    scene7_resp = client.post(
        f"/api/projects/{proj_id}/scenes/scene-7/generate-image",
        json={"prompt_override": "Scene 7 paid access"},
        headers=headers,
    )
    assert scene7_resp.status_code == 200



def test_expired_entitlement_is_detected_as_inactive():
    """14. An expired entitlement is strictly recognized as inactive by server."""
    user_id = "creator-expired"
    payment_svc = get_payment_service()

    # Create entitlement expired 10 days ago
    now_dt = datetime.now(timezone.utc)
    expired_dt = now_dt - timedelta(days=10)
    started_dt = expired_dt - timedelta(days=365)

    ent = EntitlementRecord(
        entitlement_id="ent_expired_123",
        uid=user_id,
        plan_id="scenora-pro-yearly",
        status="active",
        started_at=started_dt.isoformat(),
        expires_at=expired_dt.isoformat(),
        payment_id="pay_old_123",
        approved_by=ADMIN_EMAIL,
        created_at=started_dt.isoformat(),
        updated_at=started_dt.isoformat(),
    )
    payment_svc.repository.create_or_update_entitlement(ent)

    # Server check must return None
    active = payment_svc.get_active_entitlement(user_id)
    assert active is None

    headers = {"Authorization": f"Bearer test-token-{user_id}"}
    ent_resp = client.get("/api/entitlements/current", headers=headers)
    assert ent_resp.status_code == 200
    assert ent_resp.json() is None
