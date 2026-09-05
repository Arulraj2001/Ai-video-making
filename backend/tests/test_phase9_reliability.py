import io
import json
import pytest
from fastapi.testclient import TestClient
from pathlib import Path

from app.main import app
from app.services.project_service import project_service, sanitize_filename
from app.services.scene_image_service import scene_image_service
from app.services.render_service import render_service
from app.models.scene import SceneModel
from app.schemas.project import ProjectCreate

client = TestClient(app)

@pytest.fixture
def clean_project(monkeypatch):
    monkeypatch.setattr("app.configuration.config.settings.IMAGE_GENERATOR_PROVIDER", "mock")
    proj = project_service.create_project(ProjectCreate(name="Phase 9 Test Project", description="Reliability testing"))
    # Add dummy scenes
    scenes = [
        SceneModel(id="sc-001", start=0.0, end=3.0, duration=3.0, caption="First scene caption"),
        SceneModel(id="sc-002", start=3.0, end=6.0, duration=3.0, caption="Second scene caption"),
        SceneModel(id="sc-003", start=6.0, end=9.0, duration=3.0, caption="Third scene caption")
    ]
    project_service.set_captions_and_scenes(proj.id, "00:00:00 -> 00:00:09 caption", scenes)
    yield proj.id
    project_service.delete_project(proj.id)


def test_healthz_and_diagnostics():
    """Verify /healthz and /api/health/diagnostics return full system health details."""
    res = client.get("/healthz")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("ok", "degraded")
    assert "version" in data
    assert "environment" in data
    assert "ffmpeg_available" in data
    assert "storage_writable" in data
    assert "timestamp" in data

    diag_res = client.get("/api/health/diagnostics")
    assert diag_res.status_code == 200
    diag_data = diag_res.json()
    assert diag_data["storage_writable"] is True

    # Check query param on /api/health
    detailed_res = client.get("/api/health?detailed=true")
    assert detailed_res.status_code == 200
    assert "ffmpeg_available" in detailed_res.json()


def test_project_backup_export_and_import(clean_project):
    """Verify exporting project to JSON and restoring it creates an identical functional project."""
    project_id = clean_project

    # 1. Export JSON backup
    export_res = client.get(f"/api/projects/{project_id}/export")
    assert export_res.status_code == 200
    assert "attachment" in export_res.headers.get("content-disposition", "")
    backup_data = export_res.json()
    assert backup_data["id"] == project_id
    assert len(backup_data["scenes"]) == 3
    assert backup_data["name"] == "Phase 9 Test Project"

    # 2. Import backup via raw JSON payload
    import_res = client.post("/api/projects/import-backup", json=backup_data)
    assert import_res.status_code == 201
    restored_proj = import_res.json()
    assert restored_proj["id"] != project_id  # New unique project ID
    assert restored_proj["name"] == "Phase 9 Test Project (Restored)"
    assert len(restored_proj["scenes"]) == 3
    assert restored_proj["scenes"][0]["caption"] == "First scene caption"

    # 3. Import backup via file upload
    json_bytes = json.dumps(backup_data).encode("utf-8")
    upload_res = client.post(
        "/api/projects/import-backup",
        files={"backup_file": ("backup.json", io.BytesIO(json_bytes), "application/json")}
    )
    assert upload_res.status_code == 201
    uploaded_proj = upload_res.json()
    assert len(uploaded_proj["scenes"]) == 3

    # Cleanup restored projects
    project_service.delete_project(restored_proj["id"])
    project_service.delete_project(uploaded_proj["id"])


def test_retry_failed_images_preserves_completed(clean_project):
    """Verify retrying failed scene images strictly preserves existing completed scene images."""
    project_id = clean_project
    proj = project_service.get_project(project_id)

    # Set Scene 1 to completed with an existing image
    proj.scenes[0].image_status = "completed"
    proj.scenes[0].image_url = "/media/test/img1.png"
    proj.scenes[0].image_path = "storage/projects/test/img1.png"

    # Set Scene 2 to failed
    proj.scenes[1].image_status = "failed"
    proj.scenes[1].image_error = "Mock generation error"
    proj.scenes[1].image_url = None

    # Set Scene 3 to completed
    proj.scenes[2].image_status = "completed"
    proj.scenes[2].image_url = "/media/test/img3.png"

    project_service._save_to_disk(proj)

    # Call retry-failed endpoint
    res = client.post(f"/api/projects/{project_id}/scenes/retry-failed")
    assert res.status_code == 200
    data = res.json()

    # Scene 1 and 3 should preserve their original URLs
    updated_p = project_service.get_project(project_id)
    assert updated_p.scenes[0].image_url == "/media/test/img1.png"
    assert updated_p.scenes[2].image_url == "/media/test/img3.png"
    # Scene 2 should now be completed by mock generator
    assert updated_p.scenes[1].image_status == "completed"
    assert updated_p.scenes[1].image_url is not None


def test_retry_render_job(clean_project):
    """Verify retrying a render job re-enqueues the job with identical settings."""
    project_id = clean_project

    # Enqueue a render job
    render_res = client.post(
        f"/api/projects/{project_id}/render",
        json={"resolution": "1920x1080", "aspect_ratio": "16:9"}
    )
    assert render_res.status_code == 202
    job = render_res.json()
    job_id = job["id"]

    # Retry job
    retry_res = client.post(f"/api/projects/{project_id}/render/{job_id}/retry")
    assert retry_res.status_code == 202
    new_job = retry_res.json()
    assert new_job["id"] != job_id
    assert new_job["resolution"] == "1920x1080"
    assert new_job["aspect_ratio"] == "16:9"


def test_upload_file_validations(clean_project):
    """Verify upload size limits and filename sanitization prevent malicious input."""
    project_id = clean_project

    # 1. Path traversal in filename sanitization
    traversal_name = "../../../etc/passwd.mp3"
    sanitized = sanitize_filename(traversal_name)
    assert "/" not in sanitized
    assert "\\" not in sanitized
    assert ".." not in sanitized

    # 2. File size limit rejection (> 50MB audio)
    fake_huge_audio = b"0" * (51 * 1024 * 1024)
    huge_res = client.post(
        f"/api/projects/{project_id}/audio",
        files={"audio_file": ("huge.mp3", io.BytesIO(fake_huge_audio), "audio/mpeg")}
    )
    assert huge_res.status_code == 400
    assert "exceeds maximum limit" in huge_res.json()["detail"]


def test_cleanup_temp_files(clean_project):
    """Verify cleanup endpoint cleans orphaned temp dirs without error."""
    project_id = clean_project

    # Create dummy temp render dir
    temp_dir = project_service._get_project_dir(project_id) / "renders" / "tmp_dummy123"
    temp_dir.mkdir(parents=True, exist_ok=True)
    (temp_dir / "test.txt").write_text("temporary data")

    # Run project cleanup
    res = client.post(f"/api/projects/{project_id}/cleanup")
    assert res.status_code == 200
    data = res.json()
    assert data["cleaned_dirs"] >= 1
    assert not temp_dir.exists()

    # Run system cleanup
    all_res = client.post("/api/projects/cleanup")
    assert all_res.status_code == 200


def test_security_no_api_keys_in_frontend():
    """Verify no hardcoded secrets or production API keys are checked into frontend source."""
    frontend_src = Path(__file__).resolve().parent.parent.parent / "frontend" / "src"
    assert frontend_src.exists()

    forbidden_patterns = ["sk-proj-", "ghp_", "bearer ", "AIzaSy"]
    for path in frontend_src.rglob("*.ts*"):
        text = path.read_text(encoding="utf-8")
        for pattern in forbidden_patterns:
            assert pattern not in text, f"Potential secret found in {path}: {pattern}"
