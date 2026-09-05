import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.video_bible import VideoBibleModel, CharacterModel, OverallStyleModel
from app.services.visual_context import build_visual_context
from app.services.project_service import ProjectService

client = TestClient(app)

def test_build_visual_context_standalone():
    vb = VideoBibleModel(
        overall_style=OverallStyleModel(
            visual_style="Cyberpunk Noir",
            realism_level="Photorealistic",
            color_treatment="Neon cyan and magenta accents with crushed blacks",
            lighting="Volumetric atmospheric rain haze with bright neon signs",
            camera_style="Low-angle tracking shots",
            lens_cinematography="50mm anamorphic prime lens, f/1.4",
            mood="Dystopian, suspenseful"
        ),
        characters=[
            CharacterModel(
                id="char-001",
                name="Maya Vance",
                description="Cyber archivist",
                appearance="Silver buzzcut, glowing cyan cybernetic left eye",
                clothing="Weathered trench coat",
                age_range="Late 20s",
                personality="Stoic, analytical"
            )
        ],
        rules=["cinematic", "realistic", "futuristic"]
    )

    ctx = build_visual_context(vb)
    assert "Cyberpunk Noir" in ctx["style_prompt_fragment"]
    assert "Maya Vance" in ctx["characters_catalog"]["char-001"]["prompt_descriptor"]
    assert "char-001" in ctx["characters_catalog"]
    assert "cinematic" in ctx["active_rules"]

def test_video_bible_api_and_persistence():
    # 1. Create project
    create_res = client.post("/api/projects", json={"name": "Video Bible Test Project"})
    assert create_res.status_code == 201
    proj_id = create_res.json()["id"]

    # 2. Get default Video Bible
    bible_res = client.get(f"/api/projects/{proj_id}/bible")
    assert bible_res.status_code == 200
    bible_data = bible_res.json()
    assert bible_data["overall_style"]["visual_style"] == "Cinematic film"
    assert len(bible_data["characters"]) == 0

    # 3. Update Overall Style & Rules
    update_res = client.put(
        f"/api/projects/{proj_id}/bible",
        json={
            "overall_style": {
                "visual_style": "Steampunk Victorian",
                "lighting": "Warm gaslight and brass reflections"
            },
            "rules": ["cinematic", "historical", "steampunk"]
        }
    )
    assert update_res.status_code == 200
    updated_bible = update_res.json()
    assert updated_bible["overall_style"]["visual_style"] == "Steampunk Victorian"
    assert "steampunk" in updated_bible["rules"]

    # 4. Add Character
    char_res = client.post(
        f"/api/projects/{proj_id}/bible/characters",
        json={
            "name": "Captain Sterling",
            "description": "Airship commander",
            "appearance": "Handlebar mustache, scarred cheek",
            "clothing": "Naval leather duster with brass buttons",
            "age_range": "40s",
            "personality": "Fearless, boisterous"
        }
    )
    assert char_res.status_code == 201
    char_data = char_res.json()
    char_id = char_data["id"]
    assert char_data["name"] == "Captain Sterling"

    # 5. Upload Reference Image for Character
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    files = {"file": ("sterling_ref.png", io.BytesIO(fake_png), "image/png")}
    ref_res = client.post(
        f"/api/projects/{proj_id}/bible/characters/{char_id}/reference",
        files=files
    )
    assert ref_res.status_code == 200
    ref_data = ref_res.json()
    assert "sterling_ref.png" in ref_data["filename"]
    assert f"/media/{proj_id}/references/" in ref_data["url"]

    # 6. Add Location
    loc_res = client.post(
        f"/api/projects/{proj_id}/bible/locations",
        json={
            "name": "The Aetherium Hangar",
            "description": "Massive iron airship dock",
            "environment": "Towering iron girders above the cloud line",
            "lighting": "Golden hour sunset piercing through thick steam"
        }
    )
    assert loc_res.status_code == 201
    loc_id = loc_res.json()["id"]

    # 7. Add Object
    obj_res = client.post(
        f"/api/projects/{proj_id}/bible/objects",
        json={
            "name": "Chronometer Compass",
            "description": "Brass pocket device with spinning gyroscope rings"
        }
    )
    assert obj_res.status_code == 201
    obj_id = obj_res.json()["id"]

    # 8. Test build_visual_context endpoint
    ctx_res = client.get(f"/api/projects/{proj_id}/bible/visual-context")
    assert ctx_res.status_code == 200
    ctx = ctx_res.json()
    assert "Steampunk Victorian" in ctx["style_prompt_fragment"]
    assert "Captain Sterling" in ctx["characters_catalog"][char_id]["prompt_descriptor"]
    assert ctx["characters_catalog"][char_id]["has_reference_image"] is True
    assert "The Aetherium Hangar" in ctx["locations_catalog"][loc_id]["prompt_descriptor"]
    assert "Chronometer Compass" in ctx["objects_catalog"][obj_id]["prompt_descriptor"]
    assert len(ctx["reference_images_catalog"]) == 1

    # 9. Verify Disk Persistence across new service instance
    fresh_service = ProjectService()
    reloaded_proj = fresh_service.get_project(proj_id)
    assert reloaded_proj is not None
    assert reloaded_proj.video_bible.overall_style.visual_style == "Steampunk Victorian"
    assert len(reloaded_proj.video_bible.characters) == 1
    assert reloaded_proj.video_bible.characters[0].reference_image is not None
    assert len(reloaded_proj.video_bible.locations) == 1
    assert len(reloaded_proj.video_bible.objects) == 1

    # 10. Clean up
    del_res = client.delete(f"/api/projects/{proj_id}")
    assert del_res.status_code == 204
