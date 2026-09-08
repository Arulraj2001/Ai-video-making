from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.render_service import render_service, get_ffmpeg_executable, RESOLUTIONS
from app.models.scene import SceneModel

client = TestClient(app)

@pytest.fixture
def project_with_scenes():
    """Creates a temporary project with scenes for render testing via API."""
    create_res = client.post(
        "/api/projects",
        json={"name": "Render Test Movie", "description": "Testing Phase 7 video rendering"}
    )
    assert create_res.status_code == 201
    project = create_res.json()
    project_id = project["id"]

    captions = """00:00 - 00:03
First scene of test movie

00:03 - 00:06
Second scene of test movie"""

    cap_res = client.post(
        f"/api/projects/{project_id}/captions",
        json={"raw_captions": captions}
    )
    assert cap_res.status_code == 200
    yield project
    client.delete(f"/api/projects/{project_id}")


def test_ffmpeg_executable_available():
    exe = get_ffmpeg_executable()
    assert exe is not None
    assert len(exe) > 0


def test_enqueue_render_job_default(project_with_scenes):
    response = client.post(
        f"/api/projects/{project_with_scenes['id']}/render",
        json={"resolution": "1080x1920"}
    )
    assert response.status_code == 202
    data = response.json()
    assert data["project_id"] == project_with_scenes["id"]
    assert data["resolution"] == "1080x1920"
    assert data["aspect_ratio"] == "9:16"
    assert data["status"] in ("queued", "processing", "completed")
    assert "stage" in data


def test_enqueue_render_job_landscape(project_with_scenes):
    response = client.post(
        f"/api/projects/{project_with_scenes['id']}/render",
        json={"resolution": "1920x1080"}
    )
    assert response.status_code == 202
    data = response.json()
    assert data["resolution"] == "1920x1080"
    assert data["aspect_ratio"] == "16:9"


def test_enqueue_render_invalid_project():
    response = client.post(
        "/api/projects/proj_non_existent/render",
        json={"resolution": "1080x1920"}
    )
    assert response.status_code == 404


def test_get_render_job_status(project_with_scenes):
    # Enqueue
    create_res = client.post(
        f"/api/projects/{project_with_scenes['id']}/render",
        json={"resolution": "1080x1920"}
    )
    job_id = create_res.json()["id"]

    # Poll status
    poll_res = client.get(f"/api/projects/{project_with_scenes['id']}/render/{job_id}")
    assert poll_res.status_code == 200
    poll_data = poll_res.json()
    assert poll_data["id"] == job_id
    assert poll_data["project_id"] == project_with_scenes["id"]
    assert 0 <= poll_data["progress"] <= 100


def test_get_render_status_not_found(project_with_scenes):
    response = client.get(f"/api/projects/{project_with_scenes['id']}/render/render_does_not_exist")
    assert response.status_code == 404


def test_list_project_renders(project_with_scenes):
    response = client.get(f"/api/projects/{project_with_scenes['id']}/renders")
    assert response.status_code == 200
    data = response.json()
    assert "jobs" in data
    assert isinstance(data["jobs"], list)


def test_build_scene_filters():
    scene = SceneModel(
        id="sc1",
        start=0.0,
        end=4.0,
        duration=4.0,
        caption="test",
        motion="slow zoom in",
        transition="fade",
        transition_duration=0.5,
    )
    filters = render_service._build_scene_filters(
        scene=scene,
        duration=4.0,
        num_frames=120,
        target_width=1080,
        target_height=1920,
        is_last=False,
    )
    assert "zoompan" in filters
    assert "fps=30" in filters
    assert "setsar=1" in filters
    assert "fade=t=out" in filters


def test_build_scene_filters_ken_burns_preset():
    scene = SceneModel(
        id="sc_kb",
        start=0.0,
        end=4.0,
        duration=4.0,
        caption="kb test",
        motion="none",
    )
    f0 = render_service._build_scene_filters(
        scene=scene,
        duration=4.0,
        num_frames=120,
        target_width=1080,
        target_height=1920,
        scene_index=0,
        motion_preset="ken_burns",
    )
    assert "zoompan=" in f0
    assert "zoom+0.0008" in f0

    # Index 1 -> pan_left
    f1 = render_service._build_scene_filters(
        scene=scene,
        duration=4.0,
        num_frames=120,
        target_width=1080,
        target_height=1920,
        scene_index=1,
        motion_preset="ken_burns",
    )
    assert "zoompan=" in f1
    assert "x=" in f1

    # Index 2 -> zoom_out
    f2 = render_service._build_scene_filters(
        scene=scene,
        duration=4.0,
        num_frames=120,
        target_width=1080,
        target_height=1920,
        scene_index=2,
        motion_preset="ken_burns",
    )
    assert "zoompan=" in f2
    assert "zoom-0.0008" in f2


def test_build_scene_filters_blur_mirror():
    scene = SceneModel(
        id="sc_blur",
        start=0.0,
        end=5.0,
        duration=5.0,
        caption="test blur",
        image_fit="blur",
    )
    filters = render_service._build_scene_filters(
        scene=scene,
        duration=5.0,
        num_frames=150,
        target_width=1920,
        target_height=1080,
        is_last=False,
    )
    assert "split[fg][bg]" in filters
    assert "boxblur" in filters
    assert "overlay=" in filters
    assert "setsar=1" in filters
    assert "fps=30" in filters


def test_build_scene_filters_color_grading_and_presets():
    scene = SceneModel(
        id="sc_color",
        start=0.0,
        end=3.0,
        duration=3.0,
        caption="test color",
        brightness=0.15,
        contrast=1.20,
        saturation=1.35,
        color_filter="cinematic",
    )
    filters = render_service._build_scene_filters(
        scene=scene,
        duration=3.0,
        num_frames=90,
        target_width=1280,
        target_height=720,
        is_last=False,
    )
    assert "colorbalance=" in filters
    assert "eq=brightness=0.15:contrast=1.20:saturation=1.35" in filters
    assert "fps=30" in filters


def test_render_download_formats_and_deletion():
    from app.services.project_service import STORAGE_DIR
    from app.models.render import RenderJobModel

    # Create dummy completed render job
    project_res = client.post(
        "/api/projects",
        json={"name": "Render Download Test", "description": "Testing owned downloads"}
    )
    assert project_res.status_code == 201
    project_id = project_res.json()["id"]
    dummy_job = RenderJobModel(
        project_id=project_id,
        status="completed",
        resolution="1080x1920",
        output_path="test_renders/dummy.mp4",
        output_filename="dummy.mp4"
    )
    render_service._jobs[dummy_job.id] = dummy_job

    dummy_file = STORAGE_DIR / "test_renders" / "dummy.mp4"
    dummy_file.parent.mkdir(parents=True, exist_ok=True)
    dummy_file.write_bytes(b"dummy video content")

    try:
        # 1. Download default MP4
        res_mp4 = client.get(f"/api/projects/{project_id}/render/{dummy_job.id}/download")
        assert res_mp4.status_code == 200
        assert res_mp4.headers["content-type"] == "video/mp4"

        # 2. Delete render job
        del_res = client.delete(f"/api/projects/{project_id}/render/{dummy_job.id}")
        assert del_res.status_code == 204
        assert render_service.get_job(dummy_job.id) is None
    finally:
        if dummy_file.exists():
            dummy_file.unlink(missing_ok=True)
        if dummy_file.parent.exists():
            dummy_file.parent.rmdir()
        client.delete(f"/api/projects/{project_id}")


def test_expired_local_render_is_removed():
    from app.services.project_service import STORAGE_DIR
    from app.models.render import RenderJobModel

    old_time = (datetime.now(timezone.utc) - timedelta(hours=25)).isoformat()
    dummy_job = RenderJobModel(
        project_id="expired_render_project",
        status="completed",
        output_path="test_renders/expired.mp4",
        output_filename="expired.mp4",
        created_at=old_time,
        updated_at=old_time,
    )
    render_service._jobs[dummy_job.id] = dummy_job
    dummy_file = STORAGE_DIR / "test_renders" / "expired.mp4"
    dummy_file.parent.mkdir(parents=True, exist_ok=True)
    dummy_file.write_bytes(b"expired")

    try:
        assert render_service.cleanup_expired_renders() == 1
        assert render_service.get_job(dummy_job.id) is None
        assert not dummy_file.exists()
    finally:
        dummy_file.unlink(missing_ok=True)
        if dummy_file.parent.exists():
            dummy_file.parent.rmdir()


def test_download_authenticated_and_capability_token():
    from app.services.project_service import STORAGE_DIR
    from app.models.render import RenderJobModel

    owner_uid = "UpZC2saOUzdbUFiZYtxAnCvfdcg1"
    # Create project owned by authenticated Firebase user
    project_res = client.post(
        "/api/projects",
        json={"name": "Auth Download Project", "description": "Testing capability & token auth"},
        headers={"Authorization": f"Bearer test-token-{owner_uid}"}
    )
    assert project_res.status_code == 201
    project_id = project_res.json()["id"]

    dummy_job = RenderJobModel(
        project_id=project_id,
        status="completed",
        resolution="1080x1080",
        output_path=f"projects/{project_id}/renders/test_render.mp4",
        output_filename="test_video_1080x1080.mp4"
    )
    render_service._jobs[dummy_job.id] = dummy_job

    dummy_file = STORAGE_DIR / "projects" / project_id / "renders" / "test_render.mp4"
    dummy_file.parent.mkdir(parents=True, exist_ok=True)
    dummy_file.write_bytes(b"render binary data content")

    try:
        # 1. Unauthenticated browser GET without headers (capability-token download)
        # This mirrors the exact user failure case: browser clicking <a download> without auth headers
        res_unauth = client.get(f"/api/projects/{project_id}/render/{dummy_job.id}/download")
        assert res_unauth.status_code == 200
        assert res_unauth.content == b"render binary data content"
        assert res_unauth.headers["content-disposition"].startswith("attachment")

        # 2. Inline disposition test for video player preview
        res_inline = client.get(f"/api/projects/{project_id}/render/{dummy_job.id}/download?disposition=inline")
        assert res_inline.status_code == 200
        assert res_inline.headers["content-disposition"].startswith("inline")

        # 3. Authenticated query parameter GET (?token=test-token-<owner_uid>)
        res_token = client.get(f"/api/projects/{project_id}/render/{dummy_job.id}/download?token=test-token-{owner_uid}")
        assert res_token.status_code == 200
        assert res_token.content == b"render binary data content"

        # 4. Unauthorized user query param GET (?token=test-token-attacker) -> 403 Forbidden
        res_unauthorized = client.get(f"/api/projects/{project_id}/render/{dummy_job.id}/download?token=test-token-attacker")
        assert res_unauthorized.status_code == 403
        assert "Not authorized" in res_unauthorized.json()["detail"]

        # 5. Invalid job_id -> 404
        res_bad_job = client.get(f"/api/projects/{project_id}/render/non_existent_job/download")
        assert res_bad_job.status_code == 404

        # 6. Invalid project_id -> 404
        res_bad_project = client.get(f"/api/projects/proj_non_existent/render/{dummy_job.id}/download")
        assert res_bad_project.status_code == 404
    finally:
        if dummy_file.exists():
            dummy_file.unlink(missing_ok=True)
        if dummy_file.parent.exists():
            dummy_file.parent.rmdir()
        client.delete(f"/api/projects/{project_id}", headers={"Authorization": f"Bearer test-token-{owner_uid}"})



