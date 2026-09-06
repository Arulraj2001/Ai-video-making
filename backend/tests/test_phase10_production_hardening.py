import io
import json
import logging
import os
import shutil
import time
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.configuration.config import settings
from app.configuration.logging_config import SensitiveDataFilter
from app.services.project_service import project_service, validate_project_id
from app.services.render_service import render_service
from app.schemas.project import ProjectCreate

client = TestClient(app)

@pytest.fixture
def test_project():
    """Create a temporary project and clean up afterwards."""
    proj = project_service.create_project(
        ProjectCreate(name="Phase 10 Hardening Test Project", description="Testing production hardening")
    )
    yield proj.id
    try:
        project_service.delete_project(proj.id)
    except Exception:
        pass


def test_path_traversal_rejection():
    """Verify that directory traversal sequences and invalid characters in project IDs are strictly rejected."""
    traversal_payloads = [
        "../../etc",
        "../secrets",
        "project/../other",
        "proj\\..\\win",
        "/etc/passwd",
        "proj;rm -rf",
        "proj<script>",
        "",
        "   ",
        "proj name with spaces"
    ]
    for payload in traversal_payloads:
        with pytest.raises(ValueError) as exc:
            validate_project_id(payload)
        assert "disallowed characters" in str(exc.value) or "empty" in str(exc.value)

    # Legitimate project IDs pass without error
    valid_ids = ["proj_12345678", "test-project-01", "my_video_99", "PROJ-ABC_123"]
    for valid in valid_ids:
        assert validate_project_id(valid) == valid


def test_atomic_json_write_and_recovery(test_project):
    """Verify that JSON writes produce backup copies and corrupted project.json is safely recovered."""
    p = project_service.get_project(test_project)
    assert p is not None
    pdir = project_service._get_project_dir(test_project)
    pfile = pdir / "project.json"
    bak_file = pdir / "project.json.bak"

    # Save update to trigger backup creation
    p.description = "Updated description for backup test"
    project_service._save_to_disk(p)

    assert pfile.exists()
    assert bak_file.exists()

    # Intentionally corrupt project.json with invalid JSON
    with open(pfile, "w", encoding="utf-8") as f:
        f.write('{"id": "corrupted", "name": "Broken JSON...')

    # Reload from disk: _load_from_disk should recover from project.json.bak
    project_service._load_from_disk()
    recovered = project_service.get_project(test_project)
    assert recovered is not None
    assert recovered.id == test_project
    assert recovered.name == "Phase 10 Hardening Test Project"


def test_stale_generation_not_overwriting_newer_success(test_project):
    """
    CRITICAL HARDENING GUARANTEE:
    Verify that an older, slower generation request cannot overwrite a newer successful state.
    """
    captions = """00:00 - 00:03\nScene for concurrency test."""
    client.post(f"/api/projects/{test_project}/captions", json={"raw_captions": captions})

    p = project_service.get_project(test_project)
    scene_id = p.scenes[0].id

    t_earlier_request = 1000.0
    t_newer_request = 2000.0
    t_newer_completed = 2500.0

    # 1. Simulate newer request completing first (e.g. fast regeneration)
    project_service.update_scene_image_state(
        project_id=test_project,
        scene_id=scene_id,
        status="completed",
        url="/media/test/new_fast_image.png",
        path="storage/projects/test/images/new_fast_image.png",
        metadata={
            "gen_started_at": t_newer_request,
            "gen_completed_at": t_newer_completed,
            "filename": "new_fast_image.png"
        }
    )

    p_refreshed = project_service.get_project(test_project)
    assert p_refreshed.scenes[0].image_url == "/media/test/new_fast_image.png"

    # 2. Simulate older request finishing late (t_earlier_request < t_newer_completed)
    stale_result = project_service.update_scene_image_state(
        project_id=test_project,
        scene_id=scene_id,
        status="completed",
        url="/media/test/old_stale_image.png",
        path="storage/projects/test/images/old_stale_image.png",
        metadata={
            "gen_started_at": t_earlier_request,
            "gen_completed_at": 3000.0,
            "filename": "old_stale_image.png"
        }
    )

    # 3. Verify that the NEWER image was preserved and NOT overwritten
    assert stale_result.image_url == "/media/test/new_fast_image.png"
    p_final = project_service.get_project(test_project)
    assert p_final.scenes[0].image_url == "/media/test/new_fast_image.png"


def test_failure_does_not_wipe_completed_image(test_project):
    """Verify that if a regeneration fails, the existing successful image is preserved."""
    captions = """00:00 - 00:03\nScene for failure preservation."""
    client.post(f"/api/projects/{test_project}/captions", json={"raw_captions": captions})

    p = project_service.get_project(test_project)
    scene_id = p.scenes[0].id

    # Complete initial image
    project_service.update_scene_image_state(
        project_id=test_project,
        scene_id=scene_id,
        status="completed",
        url="/media/test/good_image.png",
        path="storage/projects/test/images/good_image.png"
    )

    # Later regeneration fails
    updated = project_service.update_scene_image_state(
        project_id=test_project,
        scene_id=scene_id,
        status="failed",
        error="Rate limit exceeded: 429"
    )

    # Image URL must remain intact
    assert updated.image_url == "/media/test/good_image.png"
    assert updated.image_error == "Rate limit exceeded: 429"


def test_secret_redaction_in_logs():
    """Verify that SensitiveDataFilter redacts secret credentials from log messages."""
    secret_token = "secret_cf_token_xyz987654321"
    filter_obj = SensitiveDataFilter([secret_token])

    record = logging.LogRecord(
        name="test_logger",
        level=logging.ERROR,
        pathname="test.py",
        lineno=10,
        msg=f"Failed request with token {secret_token}",
        args=(),
        exc_info=None
    )

    filter_obj.filter(record)
    assert secret_token not in record.msg
    assert "[REDACTED_SECRET]" in record.msg


def test_missing_media_graceful_render(test_project):
    """Verify that missing scene images or missing audio do not crash the FFmpeg rendering pipeline."""
    captions = """00:00 - 00:02\nMissing image scene test."""
    client.post(f"/api/projects/{test_project}/captions", json={"raw_captions": captions})

    # Point scene to a nonexistent image URL
    p = project_service.get_project(test_project)
    p.scenes[0].image_url = "/media/test/nonexistent_image_12345.png"
    p.scenes[0].image_path = "storage/projects/test/images/nonexistent_image_12345.png"
    project_service._save_to_disk(p)

    # Render without audio or real image — should generate solid dark canvas + silent audio gracefully
    res = client.post(
        f"/api/projects/{test_project}/render",
        json={"resolution": "1920x1080", "aspect_ratio": "16:9"}
    )
    assert res.status_code in (200, 202)
    job_id = res.json()["id"]

    # Poll status until completed
    job_data = None
    for _ in range(40):
        time.sleep(0.5)
        st_res = client.get(f"/api/projects/{test_project}/render/{job_id}")
        assert st_res.status_code == 200
        job_data = st_res.json()
        if job_data["status"] in ("completed", "failed"):
            break

    assert job_data is not None
    assert job_data["status"] == "completed"
    assert job_data["output_url"] is not None


def test_storage_dir_configurable():
    """Verify that STORAGE_DIR is defined and media directories resolve under it."""
    assert hasattr(settings, "STORAGE_DIR")
    storage_path = Path(settings.STORAGE_DIR)
    assert storage_path.name in ("storage", os.getenv("STORAGE_DIR", "storage"))
