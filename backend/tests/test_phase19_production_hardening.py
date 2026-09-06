import asyncio
import io
import os
import shutil
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.api.dependencies.auth import ADMIN_EMAILS
from app.configuration.config import Settings, validate_security_configuration, settings
from app.models.scene import SceneModel
from app.services.payments.payment_service import get_payment_service, PaymentService
from app.services.payments.payment_repository import PaymentRepository
from app.services.usage import get_usage_service, UsageRepository
from app.services.platform.platform_service import get_platform_service, PlatformService
from app.services.platform.config_repository import PlatformConfigRepository
from app.services.platform.audit_repository import AuditRepository
from app.services.project_service import project_service, STORAGE_DIR
from app.services.render_service import render_service, probe_video_metadata, get_ffmpeg_executable

client = TestClient(app)

ADMIN_EMAIL = list(ADMIN_EMAILS)[0]
ADMIN_HEADERS = {"Authorization": "Bearer test-token-admin"}
ALICE_HEADERS = {"Authorization": "Bearer test-token-creator-alice"}
BOB_HEADERS = {"Authorization": "Bearer test-token-creator-bob"}


def create_sample_image(output_path: Path, width: int = 640, height: int = 360, color: str = "blue") -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (width, height), color=color)
    img.save(str(output_path), "JPEG")
    return output_path


@pytest.fixture(autouse=True)
def setup_phase19_env(tmp_path, monkeypatch):
    """Resets services and repositories for isolated test runs."""
    monkeypatch.setattr("app.services.project_service.PROJECTS_DIR", tmp_path / "projects")
    monkeypatch.setattr("app.services.scene_image_service.STORAGE_DIR", tmp_path / "storage")
    monkeypatch.setattr("app.configuration.config.settings.STORAGE_DIR", str(tmp_path / "storage"))
    monkeypatch.setattr("app.configuration.config.settings.IMAGE_GENERATOR_PROVIDER", "mock")
    monkeypatch.setattr("app.configuration.config.settings.FREE_GENERATION_LIMIT", 5)
    monkeypatch.setattr("app.configuration.config.settings.PAYMENTS_STORAGE_BACKEND", "local")
    monkeypatch.setattr("app.configuration.config.settings.USAGE_STORAGE_BACKEND", "local")
    monkeypatch.setattr("app.configuration.config.settings.CREDENTIAL_VAULT_BACKEND", "local")

    platform_svc = get_platform_service()
    platform_svc.config_repo = PlatformConfigRepository(backend="local")
    platform_svc.config_repo.reset_for_testing()
    platform_svc.audit_repo = AuditRepository(backend="local")
    platform_svc.audit_repo.reset_for_testing()

    payment_svc = get_payment_service()
    payment_svc.repository = PaymentRepository(backend="local")
    payment_svc.repository.reset_for_testing()

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
# 1. Environment & Fail-Closed Startup Validation (Sections 2 & 9)
# =====================================================================

def test_production_fails_closed_without_encryption_key():
    """Production startup must refuse to boot if encryption key is missing or insecure."""
    mock_settings = Settings()
    mock_settings.ENVIRONMENT = "production"
    mock_settings.CREDENTIAL_VAULT_BACKEND = "firestore"
    mock_settings.PAYMENTS_STORAGE_BACKEND = "firestore"
    mock_settings.USAGE_STORAGE_BACKEND = "firestore"
    mock_settings.IMAGE_GENERATOR_PROVIDER = "pollinations"
    mock_settings.LLM_PROVIDER = "openrouter"
    mock_settings.CORS_ORIGINS = ["https://scenoraedits.web.app"]

    # 1. Insecure placeholder key
    mock_settings.SCENORA_CREDENTIAL_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    with pytest.raises(RuntimeError, match="insecure placeholder key in production"):
        validate_security_configuration(mock_settings)

    # 2. Empty key
    mock_settings.SCENORA_CREDENTIAL_ENCRYPTION_KEY = ""
    with pytest.raises(RuntimeError, match="SCENORA_CREDENTIAL_ENCRYPTION_KEY is required in production"):
        validate_security_configuration(mock_settings)

    # 3. Invalid length key
    mock_settings.SCENORA_CREDENTIAL_ENCRYPTION_KEY = "short-key"
    with pytest.raises(RuntimeError, match="must be exactly 64 hex characters or 32 raw bytes"):
        validate_security_configuration(mock_settings)


def test_production_fails_closed_with_local_vault_or_storage():
    """Production startup must forbid local filesystem vault and storage."""
    mock_settings = Settings()
    mock_settings.ENVIRONMENT = "production"
    mock_settings.SCENORA_CREDENTIAL_ENCRYPTION_KEY = "a" * 64
    mock_settings.IMAGE_GENERATOR_PROVIDER = "pollinations"
    mock_settings.LLM_PROVIDER = "openrouter"
    mock_settings.CORS_ORIGINS = ["https://scenoraedits.web.app"]

    # Local vault
    mock_settings.CREDENTIAL_VAULT_BACKEND = "local"
    with pytest.raises(RuntimeError, match="CREDENTIAL_VAULT_BACKEND must be 'firestore'"):
        validate_security_configuration(mock_settings)

    # Local payments
    mock_settings.CREDENTIAL_VAULT_BACKEND = "firestore"
    mock_settings.PAYMENTS_STORAGE_BACKEND = "local"
    with pytest.raises(RuntimeError, match="PAYMENTS_STORAGE_BACKEND must be 'firestore'"):
        validate_security_configuration(mock_settings)


def test_production_fails_closed_with_mock_providers():
    """Accidental mock provider configuration is strictly forbidden in production."""
    mock_settings = Settings()
    mock_settings.ENVIRONMENT = "production"
    mock_settings.SCENORA_CREDENTIAL_ENCRYPTION_KEY = "b" * 64
    mock_settings.CREDENTIAL_VAULT_BACKEND = "firestore"
    mock_settings.PAYMENTS_STORAGE_BACKEND = "firestore"
    mock_settings.USAGE_STORAGE_BACKEND = "firestore"
    mock_settings.CORS_ORIGINS = ["https://scenoraedits.web.app"]

    mock_settings.IMAGE_GENERATOR_PROVIDER = "mock"
    mock_settings.LLM_PROVIDER = "openrouter"
    with pytest.raises(RuntimeError, match="IMAGE_GENERATOR_PROVIDER cannot be 'mock'"):
        validate_security_configuration(mock_settings)

    mock_settings.IMAGE_GENERATOR_PROVIDER = "pollinations"
    mock_settings.LLM_PROVIDER = "mock"
    with pytest.raises(RuntimeError, match="LLM_PROVIDER cannot be 'mock'"):
        validate_security_configuration(mock_settings)


def test_production_cors_restrictions():
    """Production CORS rejects wildcard '*' and eliminates localhost entries."""
    mock_settings = Settings()
    mock_settings.ENVIRONMENT = "production"
    mock_settings.SCENORA_CREDENTIAL_ENCRYPTION_KEY = "c" * 64
    mock_settings.CREDENTIAL_VAULT_BACKEND = "firestore"
    mock_settings.PAYMENTS_STORAGE_BACKEND = "firestore"
    mock_settings.USAGE_STORAGE_BACKEND = "firestore"
    mock_settings.IMAGE_GENERATOR_PROVIDER = "pollinations"
    mock_settings.LLM_PROVIDER = "openrouter"

    # Wildcard is strictly forbidden
    mock_settings.CORS_ORIGINS = ["*", "https://scenoraedits.web.app"]
    with pytest.raises(RuntimeError, match="wildcard CORS"):
        validate_security_configuration(mock_settings)

    # Localhost entries are cleanly sanitized
    mock_settings.FIREBASE_SERVICE_ACCOUNT_KEY = '{"project_id": "scenoraedits", "private_key": "-----BEGIN PRIVATE KEY-----test"}'
    mock_settings.CORS_ORIGINS = ["https://scenoraedits.web.app", "http://localhost:5173", "http://127.0.0.1:3000"]
    validate_security_configuration(mock_settings)
    assert "https://scenoraedits.web.app" in mock_settings.CORS_ORIGINS
    assert not any("localhost" in o for o in mock_settings.CORS_ORIGINS)
    assert not any("127.0.0.1" in o for o in mock_settings.CORS_ORIGINS)


def test_production_fails_closed_without_firebase_service_account():
    """Production startup must refuse to boot if FIREBASE_SERVICE_ACCOUNT_KEY is missing or invalid."""
    mock_settings = Settings()
    mock_settings.ENVIRONMENT = "production"
    mock_settings.SCENORA_CREDENTIAL_ENCRYPTION_KEY = "d" * 64
    mock_settings.CREDENTIAL_VAULT_BACKEND = "firestore"
    mock_settings.PAYMENTS_STORAGE_BACKEND = "firestore"
    mock_settings.USAGE_STORAGE_BACKEND = "firestore"
    mock_settings.IMAGE_GENERATOR_PROVIDER = "pollinations"
    mock_settings.LLM_PROVIDER = "openrouter"
    mock_settings.CORS_ORIGINS = ["https://scenoraedits.web.app"]

    # 1. Missing service account
    mock_settings.FIREBASE_SERVICE_ACCOUNT_KEY = None
    with pytest.raises(RuntimeError, match="FIREBASE_SERVICE_ACCOUNT_KEY is required"):
        validate_security_configuration(mock_settings)

    # 2. Malformed JSON
    mock_settings.FIREBASE_SERVICE_ACCOUNT_KEY = "not-json-or-file"
    with pytest.raises(RuntimeError, match="FIREBASE_SERVICE_ACCOUNT_KEY in production is malformed"):
        validate_security_configuration(mock_settings)

    # 3. Valid dummy service account passes
    mock_settings.FIREBASE_SERVICE_ACCOUNT_KEY = '{"project_id": "scenoraedits", "private_key": "-----BEGIN PRIVATE KEY-----test"}'
    validate_security_configuration(mock_settings)


# =====================================================================
# 2. Production Authentication Fail-Closed (Section 4)
# =====================================================================

def test_production_rejects_test_tokens_and_fake_auth(monkeypatch):
    """In production, test tokens, mock tokens, and missing auth fail closed with 401."""
    monkeypatch.setattr("app.configuration.config.settings.ENVIRONMENT", "production")

    # 1. Test token rejected
    resp1 = client.get("/api/projects", headers={"Authorization": "Bearer test-token-creator-alice"})
    assert resp1.status_code == 401
    assert "strictly forbidden in production" in resp1.json()["detail"]

    # 2. Mock / fake token rejected
    resp2 = client.get("/api/projects", headers={"Authorization": "Bearer mock-token-12345"})
    assert resp2.status_code == 401
    assert "strictly forbidden in production" in resp2.json()["detail"]

    # 3. Missing header rejected
    resp3 = client.get("/api/projects")
    assert resp3.status_code == 401
    assert "Missing Authorization header" in resp3.json()["detail"]


# =====================================================================
# 3. Root Health & Diagnostics Sanitization (Section 12)
# =====================================================================

def test_root_health_and_diagnostics_sanitization(monkeypatch):
    """GET /health returns clean status; diagnostics in production hide internal filesystem paths."""
    # 1. Root /health endpoint returns simple status
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}

    # 2. /api/health returns simple status
    res_api = client.get("/api/health")
    assert res_api.status_code == 200
    assert res_api.json() == {"status": "ok"}

    # 3. Detailed diagnostics in production hide ffmpeg_path
    monkeypatch.setattr("app.configuration.config.settings.ENVIRONMENT", "production")
    res_diag = client.get("/api/health/diagnostics")
    assert res_diag.status_code == 200
    data = res_diag.json()
    assert data["status"] in ("ok", "degraded")
    if data["ffmpeg_available"]:
        assert data["ffmpeg_path"] == "[CONFIGURED]"


# =====================================================================
# 4. Error Handling Sanitization (Section 15)
# =====================================================================

def test_production_error_handling_sanitization(monkeypatch):
    """Production 500 errors must not leak stack traces or exception details."""
    monkeypatch.setattr("app.configuration.config.settings.ENVIRONMENT", "production")

    # Trigger a 500 by requesting an invalid/corrupted project operation
    # or invoking a route with simulated unexpected error
    from app.utils.errors import global_exception_handler
    from starlette.requests import Request
    from starlette.datastructures import Headers

    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/projects/corrupted",
        "headers": [],
    }
    req = Request(scope)
    simulated_err = Exception("Internal database /path/to/secret/file.db failed with password=Secret123!")

    import asyncio
    res = asyncio.run(global_exception_handler(req, simulated_err))
    assert res.status_code == 500

    import json
    body = json.loads(res.body.decode())
    assert "Secret123" not in str(body)
    assert "/path/to/secret" not in str(body)
    assert "An unexpected server error occurred" in body["message"]
    assert "details" not in body


# =====================================================================
# 5. Maintenance Mode (Section 30)
# =====================================================================

def test_maintenance_mode_behavior():
    """Maintenance mode returns 503 for creators while preserving admin & health access."""
    # 1. Enable maintenance mode
    client.put(
        "/api/admin/config",
        json={"maintenance_mode": True},
        headers=ADMIN_HEADERS,
    )

    # 2. Regular user mutation is blocked with 503
    res_blocked = client.post(
        "/api/projects",
        json={"name": "Blocked Project"},
        headers=ALICE_HEADERS,
    )
    assert res_blocked.status_code == 503
    assert res_blocked.json()["maintenance_mode"] is True
    assert "scheduled maintenance" in res_blocked.json()["message"]

    # 3. Whitelisted endpoints remain accessible
    assert client.get("/health").status_code == 200
    assert client.get("/api/plans/yearly").status_code == 200

    # 4. Admin retains access to view and disable maintenance mode
    admin_cfg = client.get("/api/admin/config", headers=ADMIN_HEADERS)
    assert admin_cfg.status_code == 200
    assert admin_cfg.json()["maintenance_mode"] is True

    # 5. Admin disables maintenance mode
    client.put(
        "/api/admin/config",
        json={"maintenance_mode": False},
        headers=ADMIN_HEADERS,
    )

    # 6. Creator is immediately unblocked
    res_unblocked = client.post(
        "/api/projects",
        json={"name": "Unblocked Project"},
        headers=ALICE_HEADERS,
    )
    assert res_unblocked.status_code == 201


# =====================================================================
# 6. Cross-User Isolation (Section 23)
# =====================================================================

def test_cross_user_isolation():
    """Creator Alice's projects, usage, and payments cannot be accessed by Creator Bob."""
    # 1. Alice creates a project
    resp_create = client.post(
        "/api/projects",
        json={"name": "Alice Private Project", "description": "Confidential"},
        headers=ALICE_HEADERS,
    )
    assert resp_create.status_code == 201
    alice_proj_id = resp_create.json()["id"]

    # 2. Bob attempts to read Alice's project -> receives 404 (does not leak existence)
    resp_get = client.get(f"/api/projects/{alice_proj_id}", headers=BOB_HEADERS)
    assert resp_get.status_code == 404

    # 3. Bob attempts to delete Alice's project -> receives 404
    resp_del = client.delete(f"/api/projects/{alice_proj_id}", headers=BOB_HEADERS)
    assert resp_del.status_code == 404

    # 4. Bob attempts to generate scene in Alice's project -> receives 404
    resp_gen = client.post(
        f"/api/projects/{alice_proj_id}/scenes/scene-1/generate-image",
        json={"force": True},
        headers=BOB_HEADERS,
    )
    assert resp_gen.status_code == 404


# =====================================================================
# 7. Real Production FFmpeg Render & Output Verification (Section 27)
# =====================================================================

@pytest.mark.anyio
async def test_ffmpeg_real_render_and_metadata_probe(tmp_path):
    """
    Executes a real FFmpeg video render using bundled imageio-ffmpeg.
    Verifies MP4 container, resolution, aspect ratio, frame duration, and metadata.
    """
    # Verify FFmpeg binary is discoverable
    ffmpeg_exe = get_ffmpeg_executable()
    assert ffmpeg_exe and Path(ffmpeg_exe).exists(), f"FFmpeg not found at {ffmpeg_exe}"

    # Setup project with 2 scenes and real dummy images
    proj_resp = client.post(
        "/api/projects",
        json={"name": "FFmpeg Production Render", "description": "Real render test"},
        headers=ALICE_HEADERS,
    )
    assert proj_resp.status_code == 201
    proj_id = proj_resp.json()["id"]

    project = project_service.get_project(proj_id, owner_id="creator-alice")

    img1 = create_sample_image(tmp_path / "scene1.jpg", 1280, 720, "navy")
    img2 = create_sample_image(tmp_path / "scene2.jpg", 1280, 720, "crimson")

    project.scenes = [
        SceneModel(
            id="sc-1",
            start=0.0,
            end=2.0,
            duration=2.0,
            caption="First Production Scene",
            image_path=str(img1),
            image_fit="cover",
        ),
        SceneModel(
            id="sc-2",
            start=2.0,
            end=4.0,
            duration=2.0,
            caption="Second Production Scene",
            image_path=str(img2),
            image_fit="contain",
        ),
    ]
    project_service._save_to_disk(project)

    # 1. Render in 16:9 Landscape (1280x720)
    job_16_9 = render_service.create_render_job(
        project_id=proj_id,
        resolution="1280x720",
        aspect_ratio_override="16:9",
    )
    # Wait for 720p job to complete (auto-launched by create_render_job)
    for _ in range(120):
        status_rec = render_service.get_job(job_16_9.id)
        if status_rec and status_rec.status in ("completed", "failed"):
            break
        await asyncio.sleep(0.1)

    assert status_rec.status == "completed", f"Render failed: {status_rec.error}"
    assert status_rec.output_path is not None
    output_file = STORAGE_DIR / status_rec.output_path
    assert output_file.exists(), f"Rendered MP4 does not exist at {output_file}"

    # Probe rendered MP4 metadata using real FFmpeg
    meta = probe_video_metadata(str(output_file))
    assert meta["width"] == 1280
    assert meta["height"] == 720
    assert meta["file_size"] > 1000  # Non-empty valid MP4
    assert meta["duration"] is not None and meta["duration"] >= 3.0  # Approx 4 seconds

    # Clean up 720p rendered MP4
    try:
        output_file.unlink(missing_ok=True)
    except Exception:
        pass

    # 2. Render in Full HD 16:9 Landscape (1920x1080)
    job_1080p = render_service.create_render_job(
        project_id=proj_id,
        resolution="1920x1080",
        aspect_ratio_override="16:9",
    )
    for _ in range(120):
        status_1080p = render_service.get_job(job_1080p.id)
        if status_1080p and status_1080p.status in ("completed", "failed"):
            break
        await asyncio.sleep(0.1)

    status_1080p = render_service.get_job(job_1080p.id)
    assert status_1080p.status == "completed", f"1080p Render failed: {status_1080p.error}"
    assert status_1080p.output_path is not None
    output_1080p = STORAGE_DIR / status_1080p.output_path
    assert output_1080p.exists(), f"1080p Rendered MP4 does not exist at {output_1080p}"

    # Probe Full HD rendered MP4 metadata using real FFmpeg
    meta_1080p = probe_video_metadata(str(output_1080p))
    assert meta_1080p["width"] == 1920
    assert meta_1080p["height"] == 1080
    assert meta_1080p["file_size"] > 1000  # Non-empty valid MP4
    assert meta_1080p["duration"] is not None and meta_1080p["duration"] >= 3.0  # Approx 4 seconds

    # Clean up 1080p rendered MP4
    try:
        output_1080p.unlink(missing_ok=True)
    except Exception:
        pass
