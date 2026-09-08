import io
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api.dependencies.auth import ADMIN_EMAILS
from app.configuration.config import settings
from app.models.scene import SceneModel
from app.services.payments.payment_service import get_payment_service, PaymentService
from app.services.payments.payment_repository import PaymentRepository
from app.services.usage import get_usage_service, UsageRepository
from app.services.platform.platform_service import get_platform_service, PlatformService
from app.services.platform.config_repository import PlatformConfigRepository
from app.services.platform.audit_repository import AuditRepository
from app.services.project_service import project_service

client = TestClient(app)

ADMIN_EMAIL = list(ADMIN_EMAILS)[0]
ADMIN_HEADERS = {"Authorization": "Bearer test-token-admin"}
CREATOR_ALICE_HEADERS = {"Authorization": "Bearer test-token-creator-alice"}
CREATOR_BOB_HEADERS = {"Authorization": "Bearer test-token-creator-bob"}


def create_test_project_with_scenes(user_id: str, scene_count: int = 6) -> str:
    headers = {"Authorization": f"Bearer test-token-{user_id}"}
    resp = client.post(
        "/api/projects",
        json={"name": f"Admin Test Project for {user_id}", "description": "Phase 18 test project"},
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
            image_prompt=f"Cinematic scene prompt {i+1}",
        )
        for i in range(scene_count)
    ]
    project_service._save_to_disk(project)
    return proj_id


@pytest.fixture(autouse=True)
def setup_admin_test_env(tmp_path, monkeypatch):
    """Resets services and repositories for isolated test runs."""
    monkeypatch.setattr("app.services.project_service.PROJECTS_DIR", tmp_path / "projects")
    monkeypatch.setattr("app.services.scene_image_service.STORAGE_DIR", tmp_path / "storage")
    monkeypatch.setattr("app.configuration.config.settings.STORAGE_DIR", str(tmp_path / "storage"))
    monkeypatch.setattr("app.configuration.config.settings.IMAGE_GENERATOR_PROVIDER", "mock")
    monkeypatch.setattr("app.configuration.config.settings.FREE_GENERATION_LIMIT", 5)
    monkeypatch.setattr("app.configuration.config.settings.PAYMENTS_STORAGE_BACKEND", "local")
    monkeypatch.setattr("app.configuration.config.settings.USAGE_STORAGE_BACKEND", "local")
    monkeypatch.setattr("app.configuration.config.settings.CREDENTIAL_VAULT_BACKEND", "local")

    # Reset platform service
    platform_svc = get_platform_service()
    platform_svc.config_repo = PlatformConfigRepository(backend="local")
    platform_svc.config_repo.reset_for_testing()
    platform_svc.audit_repo = AuditRepository(backend="local")
    platform_svc.audit_repo.reset_for_testing()

    # Reset payments service
    payment_svc = get_payment_service()
    payment_svc.repository = PaymentRepository(backend="local")
    payment_svc.repository.reset_for_testing()

    # Reset usage service
    usage_svc = get_usage_service()
    usage_svc.repository = UsageRepository(backend="local")
    usage_svc.repository.reset_usage_for_testing()

    project_service._projects.clear()
    yield
    platform_svc.config_repo.reset_for_testing()
    platform_svc.audit_repo.reset_for_testing()
    payment_svc.repository.reset_for_testing()
    usage_svc.repository.reset_usage_for_testing()


# =====================================================================
# 1. Admin Security & Server-Side Enforcement (Section 1)
# =====================================================================

def test_admin_authorization_enforcement():
    """Non-admin users must receive HTTP 403 Forbidden on all /api/admin/* endpoints."""
    protected_endpoints = [
        ("GET", "/api/admin/dashboard"),
        ("GET", "/api/admin/users"),
        ("GET", "/api/admin/payments"),
        ("GET", "/api/admin/config"),
        ("PUT", "/api/admin/config"),
        ("GET", "/api/admin/usage"),
        ("GET", "/api/admin/audit-logs"),
    ]

    for method, path in protected_endpoints:
        # Non-admin user gets 403
        if method == "GET":
            resp = client.get(path, headers=CREATOR_ALICE_HEADERS)
        else:
            resp = client.put(path, json={"free_generation_limit": 10}, headers=CREATOR_ALICE_HEADERS)
        assert resp.status_code == 403, f"Expected 403 on {method} {path} for creator Alice, got {resp.status_code}"
        assert "Admin privileges are required" in resp.json()["detail"]

        # Missing token gets 401 when strict auth is simulated
        resp_unauth = client.get(path, headers={"x-require-auth": "true"})
        assert resp_unauth.status_code == 401, f"Expected 401 on {path} without auth"

        # Authorized admin gets 200 (or valid response)
        if method == "GET":
            resp_admin = client.get(path, headers=ADMIN_HEADERS)
            assert resp_admin.status_code == 200, f"Expected 200 on {path} for admin, got {resp_admin.status_code}"


# =====================================================================
# 2. Admin Dashboard Summary Cards (Section 2)
# =====================================================================

def test_admin_dashboard_metrics():
    """Validates summary counters: users, pending payments, paid users, generations, prices."""
    # 1. Create a user payment
    sub_resp = client.post(
        "/api/payments",
        json={
            "plan_id": "scenora-pro-yearly",
            "amount": 2999,
            "currency": "INR",
            "payment_method": "upi",
            "reference": "UPI-DASH-12345",
        },
        headers=CREATOR_ALICE_HEADERS,
    )
    assert sub_resp.status_code == 201

    # 2. Query admin dashboard
    dash_resp = client.get("/api/admin/dashboard", headers=ADMIN_HEADERS)
    assert dash_resp.status_code == 200
    data = dash_resp.json()

    assert data["pending_payments"] >= 1
    assert data["total_users"] >= 1
    assert data["yearly_price_inr"] == 2999
    assert data["yearly_price_usd"] == 49
    assert data["free_generation_limit"] == 5


# =====================================================================
# 3. Creator Directory & Secret Exposure Prevention (Section 3)
# =====================================================================

def test_admin_users_directory_no_secrets_exposed():
    """Lists creators, usage, tier, and guarantees NO keys, secrets or passwords are exposed."""
    # Create projects for Alice and Bob
    create_test_project_with_scenes("creator-alice", scene_count=2)
    create_test_project_with_scenes("creator-bob", scene_count=1)

    resp = client.get("/api/admin/users", headers=ADMIN_HEADERS)
    assert resp.status_code == 200
    users = resp.json()
    assert isinstance(users, list)
    assert len(users) >= 2

    uids = [u["uid"] for u in users]
    assert "creator-alice" in uids
    assert "creator-bob" in uids

    forbidden_fields = {"password", "api_key", "secret", "token", "hash", "ciphertext", "nonce"}
    for u in users:
        assert "uid" in u
        assert "tier" in u
        assert "current_usage" in u
        assert "project_count" in u
        for key in u.keys():
            assert not any(forbidden in key.lower() for forbidden in forbidden_fields), f"Sensitive key {key} exposed!"


# =====================================================================
# 4. Central Platform Configuration & Dynamic Pricing (Section 5)
# =====================================================================

def test_dynamic_pricing_modification_and_public_reflection():
    """Admin updates yearly pricing; immediately reflected on /api/plans/yearly without restart."""
    # 1. Check initial public price
    resp1 = client.get("/api/plans/yearly")
    assert resp1.status_code == 200
    assert resp1.json()["price_inr"] == 2999
    assert resp1.json()["price_usd"] == 49

    # 2. Admin updates prices to 3499 INR and 59 USD
    put_resp = client.put(
        "/api/admin/config",
        json={
            "yearly_plan_price_inr": 3499,
            "yearly_plan_price_usd": 59,
            "yearly_plan_name": "ScenoraEdits Pro Ultra",
        },
        headers=ADMIN_HEADERS,
    )
    assert put_resp.status_code == 200
    updated = put_resp.json()
    assert updated["yearly_plan_price_inr"] == 3499
    assert updated["yearly_plan_price_usd"] == 59
    assert updated["yearly_plan_name"] == "ScenoraEdits Pro Ultra"

    # 3. Public endpoint immediately reflects new pricing
    resp2 = client.get("/api/plans/yearly")
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["price_inr"] == 3499
    assert data2["price_usd"] == 59
    assert data2["name"] == "ScenoraEdits Pro Ultra"

    # 4. Check /api/plans returns both 6-month and yearly plans
    resp_plans = client.get("/api/plans")
    assert resp_plans.status_code == 200
    plans = resp_plans.json()
    assert len(plans) >= 2
    plan_6m = next((p for p in plans if p["plan_id"] == "scenora-pro-6months"), None)
    assert plan_6m is not None
    assert plan_6m["duration_days"] == 180

    # 5. Admin updates 6-month pricing dynamically
    put_6m = client.put(
        "/api/admin/config",
        json={
            "plan_6m_price_inr": 1999,
            "plan_6m_price_usd": 35,
            "plan_6m_name": "ScenoraEdits Pro 6-Month Pass",
        },
        headers=ADMIN_HEADERS,
    )
    assert put_6m.status_code == 200
    updated_plans = client.get("/api/plans").json()
    p6_updated = next(p for p in updated_plans if p["plan_id"] == "scenora-pro-6months")
    assert p6_updated["price_inr"] == 1999
    assert p6_updated["price_usd"] == 35
    assert p6_updated["name"] == "ScenoraEdits Pro 6-Month Pass"


# =====================================================================
# 5. Immediate Free Limit Enforcement (Section 6)
# =====================================================================

def test_immediate_free_limit_enforcement_without_restart():
    """
    User reaches limit (5). 6th generation is blocked (429).
    Admin raises limit to 10 via /api/admin/config.
    User immediately succeeds generating 6th image without 429.
    """
    proj_id = create_test_project_with_scenes("creator-limit-test", scene_count=7)
    headers = {"Authorization": "Bearer test-token-creator-limit-test"}

    # Initial limit is 5
    # Generate 5 scenes
    for i in range(1, 6):
        resp = client.post(
            f"/api/projects/{proj_id}/scenes/scene-{i}/generate-image",
            json={"force": True},
            headers=headers,
        )
        assert resp.status_code == 200, f"Scene {i} generation failed: {resp.text}"

    # 6th generation should be blocked with 429 Quota Exceeded
    resp_blocked = client.post(
        f"/api/projects/{proj_id}/scenes/scene-6/generate-image",
        json={"force": True},
        headers=headers,
    )
    assert resp_blocked.status_code == 429
    assert "Free generation limit reached" in resp_blocked.json()["detail"]["message"]

    # Admin increases free generation limit to 10
    config_update = client.put(
        "/api/admin/config",
        json={"free_generation_limit": 10},
        headers=ADMIN_HEADERS,
    )
    assert config_update.status_code == 200
    assert config_update.json()["free_generation_limit"] == 10

    # User immediately retries 6th generation - must now succeed with 200 OK!
    resp_success = client.post(
        f"/api/projects/{proj_id}/scenes/scene-6/generate-image",
        json={"force": True},
        headers=headers,
    )
    assert resp_success.status_code == 200, f"Expected generation to succeed after limit increase: {resp_success.text}"


# =====================================================================
# 6. Payment Review, Approval, Rejection & Proof Viewing (Section 4 & 7)
# =====================================================================

def test_admin_payment_approval_and_proof_access():
    """Admin views proof, approves payment, grants 365-day entitlement, and verifies idempotency."""
    # 1. Creator Alice submits payment
    sub_resp = client.post(
        "/api/payments",
        json={
            "plan_id": "scenora-pro-yearly",
            "amount": 2999,
            "currency": "INR",
            "payment_method": "upi",
            "reference": "UPI-ALICE-9999",
        },
        headers=CREATOR_ALICE_HEADERS,
    )
    payment_id = sub_resp.json()["payment_id"]

    # 2. Creator uploads proof image
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    upload_resp = client.post(
        f"/api/payments/{payment_id}/proof",
        files={"file": ("screenshot.png", io.BytesIO(fake_png), "image/png")},
        headers=CREATOR_ALICE_HEADERS,
    )
    assert upload_resp.status_code == 200

    # 3. Security: Non-admin cannot view proof URL or file
    resp_proof_unauth = client.get(f"/api/admin/payments/{payment_id}/proof-url", headers=CREATOR_ALICE_HEADERS)
    assert resp_proof_unauth.status_code == 403

    # 4. Admin accesses proof URL and file
    resp_proof_url = client.get(f"/api/admin/payments/{payment_id}/proof-url", headers=ADMIN_HEADERS)
    assert resp_proof_url.status_code == 200
    assert resp_proof_url.json()["proof_url"] == f"/api/admin/payments/{payment_id}/proof-file"

    resp_file = client.get(f"/api/admin/payments/{payment_id}/proof-file", headers=ADMIN_HEADERS)
    assert resp_file.status_code == 200
    assert resp_file.headers["content-type"] == "image/png"
    assert resp_file.content == fake_png

    # 5. Admin lists payments filtered by pending
    pending_resp = client.get("/api/admin/payments?status=pending", headers=ADMIN_HEADERS)
    assert pending_resp.status_code == 200
    pending_ids = [p["payment_id"] for p in pending_resp.json()]
    assert payment_id in pending_ids

    # 6. Admin approves payment via /api/admin/payments/{payment_id}/approve
    approve_resp = client.post(f"/api/admin/payments/{payment_id}/approve", headers=ADMIN_HEADERS)
    assert approve_resp.status_code == 200
    app_data = approve_resp.json()
    assert app_data["payment"]["status"] == "approved"
    assert app_data["entitlement"]["is_active"] is True
    assert app_data["entitlement"]["days_remaining"] == 365

    # 7. Idempotency test: Approving already-approved payment returns same entitlement safely
    dup_approve = client.post(f"/api/admin/payments/{payment_id}/approve", headers=ADMIN_HEADERS)
    assert dup_approve.status_code == 200
    assert dup_approve.json()["entitlement"]["entitlement_id"] == app_data["entitlement"]["entitlement_id"]


def test_admin_payment_rejection_workflow():
    """Admin rejects invalid payment with reason; no entitlement is granted."""
    # 1. Creator Bob submits payment
    sub_resp = client.post(
        "/api/payments",
        json={
            "plan_id": "scenora-pro-yearly",
            "amount": 2999,
            "currency": "INR",
            "payment_method": "upi",
            "reference": "UPI-INVALID-REF",
        },
        headers=CREATOR_BOB_HEADERS,
    )
    payment_id = sub_resp.json()["payment_id"]

    # 2. Admin rejects payment
    reject_resp = client.post(
        f"/api/admin/payments/{payment_id}/reject",
        json={"reason": "Transaction reference not found on bank statement."},
        headers=ADMIN_HEADERS,
    )
    assert reject_resp.status_code == 200
    assert reject_resp.json()["payment"]["status"] == "rejected"
    assert reject_resp.json()["payment"]["rejection_reason"] == "Transaction reference not found on bank statement."

    # 3. Verify Bob has NO active entitlement
    ent_resp = client.get("/api/entitlements/current", headers=CREATOR_BOB_HEADERS)
    assert ent_resp.status_code == 200
    assert ent_resp.json() is None


# =====================================================================
# 7. Audit Logging & Safe Details (Section 8)
# =====================================================================

def test_admin_audit_logging_and_sanitization():
    """Verifies administrative audit entries are stored and sensitive data is redacted."""
    # Trigger config update
    client.put(
        "/api/admin/config",
        json={"free_generation_limit": 8},
        headers=ADMIN_HEADERS,
    )

    # Fetch audit logs
    audit_resp = client.get("/api/admin/audit-logs", headers=ADMIN_HEADERS)
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    assert len(logs) >= 1

    latest = logs[0]
    assert "log_id" in latest
    assert "admin_email" in latest
    assert "action" in latest
    assert "timestamp" in latest
    assert "details" in latest

    # Verify no secrets in audit logs
    for log in logs:
        details_str = str(log["details"]).lower()
        assert "password" not in details_str or "[redacted]" in details_str


# =====================================================================
# 8. Platform Usage Aggregation (Section 6)
# =====================================================================

def test_admin_platform_usage_stats():
    """Aggregates platform consumption metrics and users approaching limit."""
    usage_resp = client.get("/api/admin/usage", headers=ADMIN_HEADERS)
    assert usage_resp.status_code == 200
    stats = usage_resp.json()

    assert "total_generations" in stats
    assert "free_tier_generations" in stats
    assert "byok_generations" in stats
    assert "successful_generations" in stats
    assert "free_generation_limit" in stats
