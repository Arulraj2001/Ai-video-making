import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.scene import SceneModel
from app.schemas.project import ProjectCreate, GenerateImageRequest
from app.services.project_service import project_service
from app.services.usage import get_usage_service, UsageService, UsageRepository, UsageLimitExceededError
from app.services.vault import get_credential_vault
from app.configuration.config import settings

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_usage_test_env(tmp_path, monkeypatch):
    """Clean isolated test environment for usage testing."""
    monkeypatch.setattr("app.services.project_service.PROJECTS_DIR", tmp_path / "projects")
    monkeypatch.setattr("app.services.scene_image_service.STORAGE_DIR", tmp_path / "storage")
    monkeypatch.setattr("app.configuration.config.settings.STORAGE_DIR", str(tmp_path / "storage"))
    monkeypatch.setattr("app.configuration.config.settings.IMAGE_GENERATOR_PROVIDER", "mock")
    monkeypatch.setattr("app.configuration.config.settings.FREE_GENERATION_LIMIT", 5)
    monkeypatch.setattr("app.configuration.config.settings.USAGE_STORAGE_BACKEND", "local")
    monkeypatch.setattr("app.configuration.config.settings.CREDENTIAL_VAULT_BACKEND", "local")

    # Reset in-memory singletons
    usage_svc = get_usage_service()
    usage_svc.repository = UsageRepository(backend="local")
    usage_svc.repository.reset_usage_for_testing()

    vault = get_credential_vault()
    vault._backend = "local"
    vault._local_vault_dir = tmp_path / "vault"
    vault._local_vault_dir.mkdir(parents=True, exist_ok=True)
    vault._memory_cache.clear()

    project_service._projects.clear()
    yield
    usage_svc.repository.reset_usage_for_testing()
    vault._memory_cache.clear()
    if (tmp_path / "vault").exists():
        import shutil
        shutil.rmtree(tmp_path / "vault", ignore_errors=True)


def create_test_project_with_scenes(user_id: str, scene_count: int = 6):
    headers = {"Authorization": f"Bearer test-token-{user_id}"}
    resp = client.post(
        "/api/projects",
        json={"name": f"Project for {user_id}", "description": "Test video project"},
        headers=headers,
    )
    assert resp.status_code == 201
    proj_data = resp.json()
    proj_id = proj_data["id"]

    project = project_service.get_project(proj_id)
    project.scenes = [
        SceneModel(
            id=f"scene-{i+1}",
            start=float(i * 3),
            end=float((i + 1) * 3),
            duration=3.0,
            caption=f"Scene caption {i+1}",
            image_prompt=f"Cinematic visual prompt for scene {i+1}",
        )
        for i in range(scene_count)
    ]
    project_service._save_to_disk(project)
    return proj_id


# ---------------------------------------------------------------------------
# 1. First Generation & Increments
# ---------------------------------------------------------------------------

def test_first_generation_initializes_and_increments():
    """Verify first generation initializes usage at 0 and increments to 1 on success."""
    user_id = "user_first_gen"
    headers = {"Authorization": f"Bearer test-token-{user_id}"}
    usage_svc = get_usage_service()

    # Initial usage should be 0
    usage_before = usage_svc.get_usage(user_id)
    assert usage_before.current_usage == 0
    assert usage_before.remaining == 5
    assert usage_before.status == "active"

    # Also verify via API
    res_api = client.get("/api/usage", headers=headers)
    assert res_api.status_code == 200
    assert res_api.json()["current_usage"] == 0
    assert res_api.json()["remaining"] == 5

    # Trigger first generation
    proj_id = create_test_project_with_scenes(user_id, scene_count=2)
    gen_res = client.post(
        f"/api/projects/{proj_id}/scenes/scene-1/generate-image",
        json={"force": True},
        headers=headers,
    )
    assert gen_res.status_code == 200

    # Usage must now be 1
    usage_after = usage_svc.get_usage(user_id)
    assert usage_after.current_usage == 1
    assert usage_after.remaining == 4
    assert usage_after.free_tier_generations == 1

    res_api_after = client.get("/api/usage", headers=headers)
    assert res_api_after.json()["current_usage"] == 1
    assert res_api_after.json()["remaining"] == 4


# ---------------------------------------------------------------------------
# 2. Consecutive Increments and Limit Reached
# ---------------------------------------------------------------------------

def test_consecutive_increments_and_limit_reached():
    """Verify consecutive generations up to 5/5, and 6th generation blocked with HTTP 429."""
    user_id = "user_quota_limit"
    headers = {"Authorization": f"Bearer test-token-{user_id}"}
    proj_id = create_test_project_with_scenes(user_id, scene_count=6)

    # Perform 5 generations (allowed)
    for i in range(1, 6):
        res = client.post(
            f"/api/projects/{proj_id}/scenes/scene-{i}/generate-image",
            json={"force": True},
            headers=headers,
        )
        assert res.status_code == 200, f"Generation #{i} failed: {res.text}"

    # Verify usage is 5/5, remaining 0, status limit_reached
    usage_api = client.get("/api/usage", headers=headers).json()
    assert usage_api["current_usage"] == 5
    assert usage_api["remaining"] == 0
    assert usage_api["status"] == "limit_reached"

    # Attempt 6th generation -> MUST FAIL with HTTP 429
    res_blocked = client.post(
        f"/api/projects/{proj_id}/scenes/scene-6/generate-image",
        json={"force": True},
        headers=headers,
    )
    assert res_blocked.status_code == 429
    err = res_blocked.json()["detail"]
    assert err["code"] == "USAGE_LIMIT_EXCEEDED"
    assert err["current_usage"] == 5
    assert err["limit"] == 5
    assert "Free generation limit reached (5/5)" in err["message"]


# ---------------------------------------------------------------------------
# 3. Failed Generation Does NOT Consume Quota
# ---------------------------------------------------------------------------

def test_failed_generation_does_not_consume_quota(monkeypatch):
    """When a provider fails or throws, free quota must NOT be deducted."""
    user_id = "user_fail_safe"
    headers = {"Authorization": f"Bearer test-token-{user_id}"}
    usage_svc = get_usage_service()
    proj_id = create_test_project_with_scenes(user_id, scene_count=2)

    # 1. Successfully generate 1 image -> usage = 1
    res1 = client.post(
        f"/api/projects/{proj_id}/scenes/scene-1/generate-image",
        json={"force": True},
        headers=headers,
    )
    assert res1.status_code == 200
    assert usage_svc.get_usage(user_id).current_usage == 1

    # 2. Simulate provider failure on next generation
    async def failing_generate(*args, **kwargs):
        raise RuntimeError("GPU Server 503 Service Unavailable")

    monkeypatch.setattr(
        "app.services.scene_image_service.scene_image_service._generate_with_context",
        failing_generate,
    )

    res_fail = client.post(
        f"/api/projects/{proj_id}/scenes/scene-2/generate-image",
        json={"force": True},
        headers=headers,
    )
    # The endpoint catches or returns 500
    assert res_fail.status_code in (500, 200) # (if returned failed scene status)

    # 3. Usage MUST STILL BE 1! Not 2!
    usage_after_fail = usage_svc.get_usage(user_id)
    assert usage_after_fail.current_usage == 1
    assert usage_after_fail.remaining == 4

    # Verify failedGenerations count is recorded
    period = usage_svc.get_current_period_key()
    rec = usage_svc.repository.get_usage(user_id, period, usage_svc.get_next_reset_time())
    assert rec.failedGenerations == 1
    assert rec.freeTierGenerations == 1


# ---------------------------------------------------------------------------
# 4. Retry Behavior
# ---------------------------------------------------------------------------

def test_retry_behavior_succeeds_and_charges_once(monkeypatch):
    """A retry that succeeds after a previous failure consumes exactly 1 generation."""
    user_id = "user_retry"
    headers = {"Authorization": f"Bearer test-token-{user_id}"}
    usage_svc = get_usage_service()
    proj_id = create_test_project_with_scenes(user_id, scene_count=2)

    # Attempt 1: Fails
    call_count = 0
    original_gen = getattr(
        client.app.state, "_orig_gen", None
    )

    async def fail_once(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise RuntimeError("Temporary provider timeout")
        # Second time: succeed with dummy ImageResult
        from app.services.image_generation.base import GeneratedImageResult
        return GeneratedImageResult(
            image_bytes=b"\x89PNG\r\n\x1a\nfake",
            content_type="image/png",
            provider="mock",
            model="mock-cinematic-v1",
            metadata={"regeneration_count": 1}
        )

    monkeypatch.setattr(
        "app.services.scene_image_service.scene_image_service._generate_with_context",
        fail_once,
    )

    # First attempt (fails)
    res_try1 = client.post(
        f"/api/projects/{proj_id}/scenes/scene-1/generate-image",
        json={"force": True},
        headers=headers,
    )
    assert usage_svc.get_usage(user_id).current_usage == 0

    # Second attempt / Retry (succeeds)
    res_try2 = client.post(
        f"/api/projects/{proj_id}/scenes/scene-1/generate-image",
        json={"force": True},
        headers=headers,
    )
    assert res_try2.status_code == 200

    # Total charged should be exactly 1
    assert usage_svc.get_usage(user_id).current_usage == 1
    assert usage_svc.get_usage(user_id).remaining == 4


# ---------------------------------------------------------------------------
# 5. Concurrency Protection
# ---------------------------------------------------------------------------

def test_concurrent_generation_requests_prevent_quota_overrun():
    """
    When limit=5 and current usage=4, two simultaneous requests
    must NOT both successfully become generation #5. Exactly one must succeed,
    and one must be rejected with 429.
    """
    user_id = "user_concurrency"
    headers = {"Authorization": f"Bearer test-token-{user_id}"}
    usage_svc = get_usage_service()
    proj_id = create_test_project_with_scenes(user_id, scene_count=6)

    # 1. Bring usage to 4
    for i in range(1, 5):
        res = client.post(
            f"/api/projects/{proj_id}/scenes/scene-{i}/generate-image",
            json={"force": True},
            headers=headers,
        )
        assert res.status_code == 200

    assert usage_svc.get_usage(user_id).current_usage == 4

    # 2. Fire two concurrent requests for scene-5 and scene-6
    results = []

    def make_call(scene_id):
        # Use a new TestClient instance or same client with thread pool
        res = client.post(
            f"/api/projects/{proj_id}/scenes/{scene_id}/generate-image",
            json={"force": True},
            headers=headers,
        )
        return res.status_code

    with ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(make_call, "scene-5")
        f2 = executor.submit(make_call, "scene-6")
        results = [f1.result(), f2.result()]

    # Exactly one must be 200, and one must be 429!
    assert 200 in results, f"Expected one 200 OK in {results}"
    assert 429 in results, f"Expected one 429 Too Many Requests in {results}"

    # Final usage must be exactly 5, NEVER 6!
    assert usage_svc.get_usage(user_id).current_usage == 5
    assert usage_svc.get_usage(user_id).remaining == 0


# ---------------------------------------------------------------------------
# 6. Monthly Reset & Period Rollover
# ---------------------------------------------------------------------------

def test_monthly_reset_period_rollover():
    """Verify usage rolls over into a fresh 5 quota in a new accounting period."""
    user_id = "user_monthly_rollover"
    usage_svc = get_usage_service()

    # Period A: 2026-09
    period_sep = "2026-09"
    reset_sep = "2026-10-01T00:00:00+00:00"

    # Consume all 5 in September
    for _ in range(5):
        allowed, rec = usage_svc.repository.atomic_reserve_quota(
            uid=user_id, period=period_sep, limit=5, is_byok=False, default_reset_at=reset_sep
        )
        assert allowed is True
        usage_svc.repository.finalize_generation(
            uid=user_id, period=period_sep, is_byok=False, success=True, default_reset_at=reset_sep
        )

    # 6th in September fails
    allowed_6, _ = usage_svc.repository.atomic_reserve_quota(
        uid=user_id, period=period_sep, limit=5, is_byok=False, default_reset_at=reset_sep
    )
    assert allowed_6 is False

    # Period B: 2026-10 (New Month Rollover)
    period_oct = "2026-10"
    reset_oct = "2026-11-01T00:00:00+00:00"

    oct_rec = usage_svc.repository.get_usage(user_id, period_oct, reset_oct)
    assert oct_rec.freeTierGenerations == 0
    assert oct_rec.generationCount == 0

    # In October, first generation succeeds cleanly
    allowed_oct, rec_oct = usage_svc.repository.atomic_reserve_quota(
        uid=user_id, period=period_oct, limit=5, is_byok=False, default_reset_at=reset_oct
    )
    assert allowed_oct is True
    assert rec_oct.freeTierGenerations == 1


# ---------------------------------------------------------------------------
# 7. Cross-User Isolation
# ---------------------------------------------------------------------------

def test_cross_user_isolation():
    """User A consuming all 5 generations must never affect User B's quota."""
    user_a = "user_alpha"
    user_b = "user_beta"

    headers_a = {"Authorization": f"Bearer test-token-{user_a}"}
    headers_b = {"Authorization": f"Bearer test-token-{user_b}"}

    proj_a = create_test_project_with_scenes(user_a, scene_count=5)
    proj_b = create_test_project_with_scenes(user_b, scene_count=2)

    # User A consumes all 5 generations
    for i in range(1, 6):
        client.post(
            f"/api/projects/{proj_a}/scenes/scene-{i}/generate-image",
            json={"force": True},
            headers=headers_a,
        )

    usage_a = client.get("/api/usage", headers=headers_a).json()
    assert usage_a["current_usage"] == 5
    assert usage_a["remaining"] == 0

    # User B must still have 0 used and 5 remaining!
    usage_b = client.get("/api/usage", headers=headers_b).json()
    assert usage_b["current_usage"] == 0
    assert usage_b["remaining"] == 5
    assert usage_b["status"] == "active"

    # User B generates successfully
    res_b = client.post(
        f"/api/projects/{proj_b}/scenes/scene-1/generate-image",
        json={"force": True},
        headers=headers_b,
    )
    assert res_b.status_code == 200
    assert client.get("/api/usage", headers=headers_b).json()["current_usage"] == 1


# ---------------------------------------------------------------------------
# 8. BYOK (Bring Your Own Key) Bypasses Free Limit
# ---------------------------------------------------------------------------

def test_byok_generation_bypasses_free_limit(monkeypatch):
    """When a user has their own API key in Vault, generation continues beyond free limit."""
    user_id = "user_byok_tester"
    headers = {"Authorization": f"Bearer test-token-{user_id}"}
    usage_svc = get_usage_service()
    proj_id = create_test_project_with_scenes(user_id, scene_count=7)

    # 1. Exhaust free quota (5 generations)
    for i in range(1, 6):
        res = client.post(
            f"/api/projects/{proj_id}/scenes/scene-{i}/generate-image",
            json={"force": True},
            headers=headers,
        )
        assert res.status_code == 200

    # 6th attempt on free tier is blocked
    res_blocked = client.post(
        f"/api/projects/{proj_id}/scenes/scene-6/generate-image",
        json={"force": True},
        headers=headers,
    )
    assert res_blocked.status_code == 429

    # 2. Add user's own API key into CredentialVault
    vault = get_credential_vault()
    vault.store_credential(
        user_id=user_id,
        provider="mock",
        secret="custom-user-mock-secret-key-12345",
    )

    # 3. Now 6th and 7th generations succeed!
    res_byok_1 = client.post(
        f"/api/projects/{proj_id}/scenes/scene-6/generate-image",
        json={"force": True, "provider": "mock"},
        headers=headers,
    )
    assert res_byok_1.status_code == 200

    res_byok_2 = client.post(
        f"/api/projects/{proj_id}/scenes/scene-7/generate-image",
        json={"force": True, "provider": "mock"},
        headers=headers,
    )
    assert res_byok_2.status_code == 200

    # 4. Check usage records: free tier stayed at 5, byokGenerations is 2
    period = usage_svc.get_current_period_key()
    rec = usage_svc.repository.get_usage(user_id, period, usage_svc.get_next_reset_time())
    assert rec.freeTierGenerations == 5
    assert rec.byokGenerations == 2
    assert rec.generationCount == 7

    # Usage API reports has_byok = True
    usage_api = client.get("/api/usage", headers=headers).json()
    assert usage_api["has_byok"] is True


# ---------------------------------------------------------------------------
# 9. GET /api/usage Security and Zero-Leakage
# ---------------------------------------------------------------------------

def test_usage_api_security_and_format():
    """GET /api/usage must return all expected fields and zero secret leakage."""
    user_id = "user_api_inspect"
    headers = {"Authorization": f"Bearer test-token-{user_id}"}

    res = client.get("/api/usage", headers=headers)
    assert res.status_code == 200
    data = res.json()

    # Required fields
    assert "uid" in data
    assert "period" in data
    assert "current_usage" in data
    assert "limit" in data
    assert "remaining" in data
    assert "reset_date" in data
    assert "status" in data
    assert "has_byok" in data

    # Strict secret protection
    data_str = str(data)
    assert "api_key" not in data_str.lower()
    assert "secret" not in data_str.lower()
    assert "ciphertext" not in data_str.lower()
    assert "nonce" not in data_str.lower()
