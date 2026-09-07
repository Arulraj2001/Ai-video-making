import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.models.scene import SceneModel
from app.services.render_service import render_service
from app.services.project_service import project_service

client = TestClient(app)

@pytest.fixture
def sample_project():
    res = client.post(
        "/api/projects",
        json={"name": "Slide & TTS E2E Test Project", "description": "Testing PowerPoint-style slides and Edge-TTS"}
    )
    assert res.status_code == 201
    proj = res.json()
    proj_id = proj["id"]

    # Ingest 2 initial scenes
    captions = """00:00 - 00:04
Welcome to our presentation on futuristic artificial intelligence.

00:04 - 00:08
Key architectural breakthroughs are accelerating generative video workflows."""

    cap_res = client.post(
        f"/api/projects/{proj_id}/captions",
        json={"raw_captions": captions}
    )
    assert cap_res.status_code == 200

    yield proj_id
    client.delete(f"/api/projects/{proj_id}")


def test_tts_voices_endpoint():
    """1. TTS catalog returns curated Microsoft Edge Neural voices."""
    resp = client.get("/api/tts/voices")
    assert resp.status_code == 200
    voices = resp.json()
    assert len(voices) >= 5
    ids = [v["id"] for v in voices]
    assert "en-US-ChristopherNeural" in ids
    assert "en-US-JennyNeural" in ids


def test_add_slide_endpoint(sample_project):
    """2. Adding a PowerPoint-style slide template appends scene to Master Timeline."""
    proj_id = sample_project
    resp = client.post(
        f"/api/projects/{proj_id}/timeline/slides",
        json={
            "caption": "Executive Summary & Core Takeaways",
            "duration": 5.0,
            "template_type": "key_takeaway",
            "background": {
                "type": "gradient",
                "gradient_stops": ["#042f2e", "#0f172a"],
                "direction": "vertical"
            },
            "elements": [
                {
                    "id": "elem_1",
                    "type": "badge",
                    "content": "PRO TIP",
                    "x": 50,
                    "y": 25,
                    "font_size": 24,
                    "color": "#ffffff",
                    "bg_color": "#0d9488"
                },
                {
                    "id": "elem_2",
                    "type": "emoji",
                    "content": "🚀",
                    "x": 50,
                    "y": 40,
                    "font_size": 54
                }
            ]
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    scenes = data["scenes"]
    assert len(scenes) == 3

    new_slide = scenes[-1]
    assert new_slide["caption"] == "Executive Summary & Core Takeaways"
    assert new_slide["duration"] == 5.0
    assert new_slide["template_type"] == "key_takeaway"
    assert len(new_slide["elements"]) == 2
    assert new_slide["elements"][0]["content"] == "PRO TIP"


def test_update_scene_template_and_duplicate(sample_project):
    """3. Updating scene with template/elements and duplicating preserves template structure."""
    proj_id = sample_project
    get_res = client.get(f"/api/projects/{proj_id}")
    scenes = get_res.json()["scenes"]
    target_id = scenes[0]["id"]

    # Update scene 1 to title_intro template
    up_res = client.put(
        f"/api/projects/{proj_id}/timeline/scenes/{target_id}",
        json={
            "template_type": "title_intro",
            "background": {
                "type": "gradient",
                "gradient_stops": ["#1e1b4b", "#0f172a"]
            },
            "elements": [
                {
                    "id": "elem_title",
                    "type": "text",
                    "content": "CHAPTER ONE",
                    "x": 50,
                    "y": 30,
                    "font_size": 42
                }
            ]
        }
    )
    assert up_res.status_code == 200
    updated_proj = up_res.json()
    sc0 = updated_proj["scenes"][0]
    assert sc0["template_type"] == "title_intro"
    assert sc0.get("image_url") is None
    assert len(sc0["elements"]) == 1

    # Duplicate scene 1
    dup_res = client.post(f"/api/projects/{proj_id}/timeline/scenes/{target_id}/duplicate")
    assert dup_res.status_code == 200
    dup_proj = dup_res.json()
    assert len(dup_proj["scenes"]) == 3
    dup_scene = dup_proj["scenes"][1]
    assert dup_scene["template_type"] == "title_intro"
    assert len(dup_scene["elements"]) == 1


def test_pillow_frame_compositing(tmp_path):
    """4. Pillow frame compositing correctly renders background gradient, templates, and overlay elements."""
    scene = SceneModel(
        id="test_scene_01",
        start=0.0,
        end=4.0,
        duration=4.0,
        caption="Artificial Intelligence Breakthrough",
        template_type="key_takeaway",
        background={
            "type": "gradient",
            "gradient_stops": ["#042f2e", "#0f172a"],
            "direction": "vertical"
        },
        elements=[
            {
                "id": "elem_1",
                "type": "badge",
                "content": "KEY TAKEAWAY",
                "x": 50,
                "y": 30,
                "font_size": 28,
                "color": "#ffffff",
                "bg_color": "#0d9488"
            },
            {
                "id": "elem_2",
                "type": "emoji",
                "content": "✨",
                "x": 50,
                "y": 50,
                "font_size": 64
            }
        ]
    )

    out_file = tmp_path / "rendered_frame.png"
    render_service._composite_scene_frame(
        scene=scene,
        base_img_path=None,
        target_width=1080,
        target_height=1920,
        output_path=out_file
    )

    assert out_file.exists()
    assert out_file.stat().st_size > 5000  # valid image file written
