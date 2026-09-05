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
    assert response.status_code == 400


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
