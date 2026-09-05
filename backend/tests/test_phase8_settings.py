import pytest
import io
from fastapi.testclient import TestClient
from app.main import app
from app.services.render_service import render_service, _generate_ass_subtitles
from app.models.scene import SceneModel
from app.models.project import CaptionSettingsModel, AudioSettingsModel, CanvasSettingsModel

client = TestClient(app)

@pytest.fixture
def project_for_settings():
    """Creates a project with scenes for Phase 8 test coverage."""
    create_res = client.post(
        "/api/projects",
        json={"name": "Phase 8 Pre-Export Test", "description": "Testing Phase 8 settings"}
    )
    assert create_res.status_code == 201
    project = create_res.json()
    project_id = project["id"]

    captions = """00:00 - 00:03
The quick brown fox jumps over the lazy dog.

00:03 - 00:06
A visual story crafted for high-retention engagement."""

    cap_res = client.post(
        f"/api/projects/{project_id}/captions",
        json={"raw_captions": captions}
    )
    assert cap_res.status_code == 200
    yield cap_res.json()
    client.delete(f"/api/projects/{project_id}")


def test_caption_settings_update(project_for_settings):
    project_id = project_for_settings["id"]
    new_caption_settings = {
        "enabled": True,
        "font_family": "Roboto",
        "font_size": 32,
        "position": "middle",
        "alignment": "center",
        "background": "semi-transparent",
        "outline_shadow": "strong",
        "safe_area": True,
        "text_color": "#ffea00",
        "background_color": "#000000"
    }

    res = client.put(
        f"/api/projects/{project_id}/settings",
        json={"caption_settings": new_caption_settings}
    )
    assert res.status_code == 200
    updated = res.json()
    assert updated["caption_settings"]["font_family"] == "Roboto"
    assert updated["caption_settings"]["position"] == "middle"
    assert updated["caption_settings"]["background"] == "semi-transparent"
    assert updated["caption_settings"]["outline_shadow"] == "strong"
    assert updated["caption_settings"]["safe_area"] is True


def test_audio_settings_update(project_for_settings):
    project_id = project_for_settings["id"]
    new_audio_settings = {
        "narration_volume": 0.85,
        "narration_muted": False,
        "music_volume": 0.35,
        "music_fade_in": 1.5,
        "music_fade_out": 2.5,
        "music_muted": False
    }

    res = client.put(
        f"/api/projects/{project_id}/settings",
        json={"audio_settings": new_audio_settings}
    )
    assert res.status_code == 200
    updated = res.json()
    assert updated["audio_settings"]["narration_volume"] == 0.85
    assert updated["audio_settings"]["music_volume"] == 0.35
    assert updated["audio_settings"]["music_fade_in"] == 1.5


def test_canvas_settings_update(project_for_settings):
    project_id = project_for_settings["id"]
    new_canvas_settings = {
        "aspect_ratio": "16:9",
        "resolution": "1920x1080",
        "fps": 30
    }

    res = client.put(
        f"/api/projects/{project_id}/settings",
        json={"canvas_settings": new_canvas_settings}
    )
    assert res.status_code == 200
    updated = res.json()
    assert updated["canvas_settings"]["aspect_ratio"] == "16:9"
    assert updated["canvas_settings"]["resolution"] == "1920x1080"
    assert updated["canvas_settings"]["fps"] == 30


def test_background_music_upload_and_delete(project_for_settings):
    project_id = project_for_settings["id"]
    fake_audio = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    
    upload_res = client.post(
        f"/api/projects/{project_id}/audio/background-music",
        files={"file": ("test_bgm.wav", fake_audio, "audio/wav")}
    )
    assert upload_res.status_code == 200
    updated = upload_res.json()
    assert updated["audio_settings"]["music_file"] is not None
    assert "test_bgm" in updated["audio_settings"]["music_file"]["filename"]

    # Delete background music
    del_res = client.delete(f"/api/projects/{project_id}/audio/background-music")
    assert del_res.status_code == 200
    updated_after_del = del_res.json()
    assert updated_after_del["audio_settings"]["music_file"] is None


def test_scene_image_transform_settings(project_for_settings):
    project_id = project_for_settings["id"]
    scene_id = project_for_settings["scenes"][0]["id"]

    update_res = client.put(
        f"/api/projects/{project_id}/scenes/{scene_id}",
        json={
            "image_fit": "contain",
            "image_position": "top",
            "image_zoom": 1.25,
            "image_crop": {"preset": "16:9"}
        }
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["image_fit"] == "contain"
    assert updated["image_position"] == "top"
    assert updated["image_zoom"] == 1.25
    assert updated["image_crop"] == {"preset": "16:9"}


def test_ass_subtitle_generation():
    scenes = [
        SceneModel(id="s1", start=0.0, end=2.5, duration=2.5, caption="Hello World"),
        SceneModel(id="s2", start=2.5, end=5.0, duration=2.5, caption="Second Subtitle"),
    ]
    settings = CaptionSettingsModel(
        enabled=True,
        font_family="Inter",
        font_size=28,
        position="bottom",
        alignment="center",
        background="solid",
        outline_shadow="strong",
        safe_area=True
    )

    ass_content = _generate_ass_subtitles(scenes, settings, 1080, 1920)
    assert "[Script Info]" in ass_content
    assert "[V4+ Styles]" in ass_content
    assert "PlayResX: 1080" in ass_content
    assert "PlayResY: 1920" in ass_content
    assert "Dialogue: 0,0:00:00.00,0:00:02.50,Default,,0,0,0,,Hello World" in ass_content
    assert "Dialogue: 0,0:00:02.50,0:00:05.00,Default,,0,0,0,,Second Subtitle" in ass_content
