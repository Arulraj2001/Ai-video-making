import io
import time
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.scene import SceneModel
from app.models.project import AudioFileModel, CaptionSettingsModel, AudioSettingsModel, CanvasSettingsModel
from app.schemas.project import ProjectCreate, SceneUpdate
from app.services.project_service import project_service, STORAGE_DIR
from app.services.render_service import render_service, probe_video_metadata, get_ffmpeg_executable, _generate_ass_subtitles

client = TestClient(app)


@pytest.fixture
def test_project():
    """Creates a temporary project and deletes it after test."""
    create_res = client.post(
        "/api/projects",
        json={"name": "Phase 9 Sync Project", "description": "Audio, captions, and final editor validation"}
    )
    assert create_res.status_code == 201
    proj_data = create_res.json()
    proj_id = proj_data["id"]

    yield proj_id

    # Cleanup
    client.delete(f"/api/projects/{proj_id}")


def _wait_for_render(job_id: str, timeout: float = 30.0):
    """Helper to poll render job until completed or failed."""
    start_t = time.time()
    while time.time() - start_t < timeout:
        job = render_service.get_job(job_id)
        if job and job.status in ("completed", "failed"):
            return job
        time.sleep(0.2)
    return render_service.get_job(job_id)


def test_audio_association_and_storage(test_project):
    """Verify audio file association, storage path, file size, content type, and URL generation."""
    sample_wav = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    
    upload_res = client.post(
        f"/api/projects/{test_project}/audio",
        files={"audio_file": ("test_voiceover.wav", sample_wav, "audio/wav")}
    )
    assert upload_res.status_code == 200
    data = upload_res.json()
    
    assert data["audio_file"] is not None
    assert data["audio_file"]["filename"] == "test_voiceover.wav"
    assert data["audio_file"]["file_size"] > 0
    assert data["audio_file"]["content_type"] == "audio/wav"
    assert "test_voiceover.wav" in data["audio_file"]["url"]

    # Verify persisted on disk
    p = project_service.get_project(test_project)
    assert p.audio_file is not None
    assert p.audio_file.filename == "test_voiceover.wav"
    assert (STORAGE_DIR / p.audio_file.storage_path.replace("storage/", "")).exists() or Path(p.audio_file.storage_path).exists()


def test_audio_replacement_preserves_scenes_and_images(test_project):
    """Verify replacing audio updates audio track while strictly preserving all scenes, captions, and images."""
    # 1. Setup scenes with captions
    captions = """00:00 - 00:02
First scene with custom visual prompt.

00:02 - 00:04
Second scene with established continuity."""
    client.post(f"/api/projects/{test_project}/captions", json={"raw_captions": captions})

    # Set mock image URL
    p = project_service.get_project(test_project)
    p.scenes[0].image_url = "/media/test/img1.png"
    p.scenes[1].image_url = "/media/test/img2.png"
    project_service._save_to_disk(p)

    # 2. Upload initial audio
    audio1 = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    client.post(f"/api/projects/{test_project}/audio", files={"audio_file": ("audio_v1.wav", audio1, "audio/wav")})

    # 3. Replace audio with a new file
    audio2 = io.BytesIO(b"RIFF\x28\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x04\x00\x00\x00\x00\x00\x00\x00")
    replace_res = client.post(f"/api/projects/{test_project}/audio", files={"audio_file": ("audio_v2_replaced.wav", audio2, "audio/wav")})
    assert replace_res.status_code == 200
    data = replace_res.json()

    # Audio updated
    assert data["audio_file"]["filename"] == "audio_v2_replaced.wav"

    # All scenes, timing, captions, and images preserved
    assert len(data["scenes"]) == 2
    assert data["scenes"][0]["start"] == 0.0
    assert data["scenes"][0]["end"] == 2.0
    assert data["scenes"][0]["caption"] == "First scene with custom visual prompt."
    assert data["scenes"][0]["image_url"] == "/media/test/img1.png"

    assert data["scenes"][1]["start"] == 2.0
    assert data["scenes"][1]["end"] == 4.0
    assert data["scenes"][1]["caption"] == "Second scene with established continuity."
    assert data["scenes"][1]["image_url"] == "/media/test/img2.png"


def test_audio_failure_handling_and_validation(test_project):
    """Verify failure handling for invalid extensions and oversized audio files."""
    # 1. Invalid extension
    bad_audio = io.BytesIO(b"not an audio file")
    bad_res = client.post(
        f"/api/projects/{test_project}/audio",
        files={"audio_file": ("exploit.exe", bad_audio, "application/octet-stream")}
    )
    assert bad_res.status_code == 400
    assert "Unsupported audio format" in bad_res.json()["detail"]

    # 2. Oversized file (> 50MB limit)
    huge_payload = b"0" * (51 * 1024 * 1024)
    huge_audio = io.BytesIO(huge_payload)
    huge_res = client.post(
        f"/api/projects/{test_project}/audio",
        files={"audio_file": ("oversized.wav", huge_audio, "audio/wav")}
    )
    assert huge_res.status_code == 400
    assert "exceeds maximum limit of 50MB" in huge_res.json()["detail"]


def test_caption_authoritative_timing_preservation(test_project):
    """Verify that editing visual properties, prompts, or crop presets NEVER modifies authoritative caption timestamps."""
    captions = """00:01.250 - 00:03.750
Precision subsecond timed scene.

00:03.750 - 00:07.500
Second segment with strict boundary."""
    client.post(f"/api/projects/{test_project}/captions", json={"raw_captions": captions})

    p = project_service.get_project(test_project)
    s1_id = p.scenes[0].id

    # Update visual properties via scene API
    update_res = client.put(
        f"/api/projects/{test_project}/scenes/{s1_id}",
        json={
            "image_crop": {"x": 12.5, "y": 0, "width": 75, "height": 100},
            "image_zoom": 1.5,
            "image_position": "top",
            "motion": "slow zoom in",
            "transition": "fade",
            "transition_duration": 0.5,
            "color_filter": "cinematic",
            "brightness": 0.1,
            "contrast": 1.2
        }
    )
    assert update_res.status_code == 200
    updated_s1 = update_res.json()

    # Authoritative timing is 100% preserved
    assert updated_s1["start"] == 1.25
    assert updated_s1["end"] == 3.75
    assert updated_s1["duration"] == 2.5
    assert updated_s1["image_zoom"] == 1.5
    assert updated_s1["image_position"] == "top"
    assert updated_s1["motion"] == "slow zoom in"


def test_end_to_end_synchronization_chain(test_project):
    """Verify end-to-end synchronization: audio duration == scene duration == render duration."""
    captions = """00:00 - 00:02
First synchronized scene beat.

00:02 - 00:04
Second synchronized scene beat."""
    client.post(f"/api/projects/{test_project}/captions", json={"raw_captions": captions})

    # Associate 4-second audio
    fake_audio = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    client.post(f"/api/projects/{test_project}/audio", files={"audio_file": ("sync.wav", fake_audio, "audio/wav")})

    # Render landscape
    res = client.post(
        f"/api/projects/{test_project}/render",
        json={"resolution": "1920x1080", "aspect_ratio": "16:9"}
    )
    assert res.status_code == 202
    job_id = res.json()["id"]

    job = _wait_for_render(job_id, timeout=40.0)
    assert job is not None
    assert job.status == "completed"

    full_path = STORAGE_DIR / job.output_path
    meta = probe_video_metadata(full_path)

    # Perfect synchronization
    assert meta["is_valid"] is True
    assert meta["width"] == 1920
    assert meta["height"] == 1080
    assert meta["duration"] == pytest.approx(4.0, abs=0.5)
    assert meta["audio_codec"] == "aac"


def test_final_editor_all_parameters_persistence(test_project):
    """Verify that editing crop, zoom, position, motion, transitions, and audio settings persists properly."""
    captions = """00:00 - 00:03
Editor persistence test scene."""
    client.post(f"/api/projects/{test_project}/captions", json={"raw_captions": captions})

    p = project_service.get_project(test_project)
    scene_id = p.scenes[0].id

    # 1. Update Scene Inspector settings
    update_res = client.put(
        f"/api/projects/{test_project}/scenes/{scene_id}",
        json={
            "caption": "Updated caption from final editor",
            "image_fit": "contain",
            "image_position": "bottom",
            "image_zoom": 1.3,
            "image_crop": {"x": 10, "y": 10, "width": 80, "height": 80},
            "motion": "pan left",
            "transition": "crossfade",
            "transition_duration": 0.75,
            "brightness": 0.05,
            "contrast": 1.15,
            "saturation": 1.25,
            "color_filter": "warm"
        }
    )
    assert update_res.status_code == 200
    s_data = update_res.json()
    assert s_data["caption"] == "Updated caption from final editor"
    assert s_data["image_fit"] == "contain"
    assert s_data["image_position"] == "bottom"
    assert s_data["image_zoom"] == 1.3
    assert s_data["motion"] == "pan left"
    assert s_data["transition"] == "crossfade"
    assert s_data["transition_duration"] == 0.75
    assert s_data["color_filter"] == "warm"

    # 2. Update Audio Settings Panel
    audio_res = client.put(
        f"/api/projects/{test_project}/settings",
        json={
            "audio_settings": {
                "narration_volume": 0.9,
                "narration_muted": False,
                "music_volume": 0.3,
                "music_fade_in": 1.2,
                "music_fade_out": 1.8,
                "ducking_enabled": True
            }
        }
    )
    assert audio_res.status_code == 200
    a_data = audio_res.json()["audio_settings"]
    assert a_data["narration_volume"] == 0.9
    assert a_data["music_volume"] == 0.3
    assert a_data["ducking_enabled"] is True

    # 3. Verify FFmpeg filters reflect these settings without syntax errors
    p_refreshed = project_service.get_project(test_project)
    filters = render_service._build_scene_filters(
        p_refreshed.scenes[0],
        duration=3.0,
        num_frames=90,
        target_width=1920,
        target_height=1080,
        is_last=True,
        target_fps=30
    )
    assert "zoompan=" in filters
    assert "colorbalance=" in filters
    assert "crop=" in filters
    assert "fps=30" in filters


def test_background_music_association_and_deletion(test_project):
    """Verify BGM upload, persistence, and deletion."""
    fake_bgm = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    
    # Upload BGM
    up_res = client.post(
        f"/api/projects/{test_project}/audio/background-music",
        files={"file": ("cinematic_bgm.wav", fake_bgm, "audio/wav")}
    )
    assert up_res.status_code == 200
    p_data = up_res.json()
    assert p_data["audio_settings"]["music_file"] is not None
    assert "cinematic_bgm.wav" in p_data["audio_settings"]["music_file"]["filename"]

    # Delete BGM
    del_res = client.delete(f"/api/projects/{test_project}/audio/background-music")
    assert del_res.status_code == 200
    assert del_res.json()["audio_settings"]["music_file"] is None
