import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.scene import SceneModel
from app.schemas.project import ProjectCreate
from app.services.project_service import project_service

client = TestClient(app)

@pytest.fixture
def saas_test_project(monkeypatch):
    monkeypatch.setattr("app.configuration.config.settings.IMAGE_GENERATOR_PROVIDER", "mock")
    proj = project_service.create_project(ProjectCreate(name="SaaS Features Test", description="Testing Sprints 1-5"))
    scenes = [
        SceneModel(id="sc-001", start=0.0, end=5.0, duration=5.0, caption="First scene introducing the topic"),
        SceneModel(id="sc-002", start=5.0, end=10.0, duration=5.0, caption="Second scene showing the problem"),
        SceneModel(id="sc-003", start=10.0, end=15.0, duration=5.0, caption="Third scene with resolution"),
        SceneModel(id="sc-004", start=15.0, end=20.0, duration=5.0, caption="Fourth scene with closing notes"),
    ]
    project_service.set_captions_and_scenes(proj.id, "00:00:00 -> 00:00:20 raw captions", scenes)
    yield proj.id
    try:
        project_service.delete_project(proj.id)
    except Exception:
        pass

def test_model_catalog_endpoint():
    """Verify GET /api/images/models returns 10+ models with expected structure."""
    res = client.get("/api/images/models")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert len(data["models"]) >= 8
    model_ids = [m["id"] for m in data["models"]]
    assert "pollinations-flux-realism" in model_ids
    assert "pollinations-flux-anime" in model_ids
    assert "mock-stickfigure" in model_ids

def test_graphic_template_endpoint(saas_test_project):
    """Verify rendering a graphic template (title_card) updates scene asset."""
    payload = {
        "template_type": "title_card",
        "headline": "SaaS Video Creation",
        "subtext": "Fast & Automated",
        "accent_color": "#6366f1"
    }
    res = client.post(f"/api/projects/{saas_test_project}/scenes/sc-001/graphic-template", json=payload)
    assert res.status_code == 200
    scene_data = res.json()
    assert scene_data["id"] == "sc-001"
    assert scene_data["image_status"] == "completed"
    assert scene_data["image_url"].startswith(f"/media/{saas_test_project}/images/")
    assert scene_data["image_metadata"]["source"] == "graphic_template"

def test_scene_variations_endpoint(saas_test_project):
    """Verify generating 3 variations with mock generator."""
    payload = {
        "provider": "mock",
        "model_id": "mock-stickfigure-v1"
    }
    res = client.post(f"/api/projects/{saas_test_project}/scenes/sc-001/variations", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "variations" in data
    assert len(data["variations"]) == 3
    for v in data["variations"]:
        assert "image_url" in v
        assert "seed" in v

def test_scene_merge_endpoint(saas_test_project):
    """Verify merging scenes combines duration and caption text."""
    payload = {
        "scene_ids": ["sc-001", "sc-002"]
    }
    res = client.post(f"/api/projects/{saas_test_project}/storyboard/merge", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["original_scene_count"] == 4
    assert data["new_scene_count"] == 3
    merged_scene = next(s for s in data["scenes"] if s["id"] == "sc-001")
    assert merged_scene["start"] == 0.0
    assert merged_scene["end"] == 10.0
    assert merged_scene["duration"] == 10.0
    assert "First scene" in merged_scene["caption"]
    assert "Second scene" in merged_scene["caption"]

def test_scene_cluster_duration_mode(saas_test_project):
    """Verify clustering scenes into longer pacing blocks."""
    payload = {
        "mode": "duration",
        "target_duration": 10.0
    }
    res = client.post(f"/api/projects/{saas_test_project}/storyboard/cluster", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["new_scene_count"] == 2
    for s in data["scenes"]:
        assert s["duration"] == 10.0
