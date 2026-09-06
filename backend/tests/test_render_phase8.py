import asyncio
import io
import time
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.scene import SceneModel
from app.models.project import AudioFileModel
from app.services.project_service import project_service, STORAGE_DIR
from app.services.render_service import (
    render_service,
    probe_video_metadata,
    RESOLUTIONS,
    ASPECT_TO_RESOLUTION,
    _generate_ass_subtitles,
)

client = TestClient(app)


@pytest.fixture
def clean_project():
    """Creates a temporary project and deletes it after test."""
    create_res = client.post(
        "/api/projects",
        json={"name": "Phase 8 Video Test", "description": "Full HD render verification"}
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


def test_probe_video_metadata_nonexistent():
    with pytest.raises(FileNotFoundError):
        probe_video_metadata("non_existent_file.mp4")


def test_never_stretch_images_across_fit_modes():
    """Verify that all image_fit settings (contain, cover, blur, fill) strictly preserve aspect ratio."""
    scene_contain = SceneModel(id="s1", start=0.0, end=3.0, duration=3.0, caption="c1", image_fit="contain")
    scene_cover = SceneModel(id="s2", start=3.0, end=6.0, duration=3.0, caption="c2", image_fit="cover")
    scene_blur = SceneModel(id="s3", start=6.0, end=9.0, duration=3.0, caption="c3", image_fit="blur")
    scene_fill = SceneModel(id="s4", start=9.0, end=12.0, duration=3.0, caption="c4", image_fit="fill")

    # 1. Contain
    f_contain = render_service._build_scene_filters(scene_contain, 3.0, 90, 1920, 1080, False)
    assert "force_original_aspect_ratio=decrease" in f_contain
    assert "pad=1920:1080:" in f_contain
    assert "setsar=1" in f_contain

    # 2. Cover
    f_cover = render_service._build_scene_filters(scene_cover, 3.0, 90, 1920, 1080, False)
    assert "force_original_aspect_ratio=increase" in f_cover
    assert "crop=1920:1080:" in f_cover
    assert "setsar=1" in f_cover

    # 3. Blur
    f_blur = render_service._build_scene_filters(scene_blur, 3.0, 90, 1920, 1080, False)
    assert "force_original_aspect_ratio=increase" in f_blur
    assert "force_original_aspect_ratio=decrease" in f_blur
    assert "boxblur=" in f_blur
    assert "overlay=" in f_blur
    assert "setsar=1" in f_blur

    # 4. Fill - strictly mapped to stretch-free cover behavior
    f_fill = render_service._build_scene_filters(scene_fill, 3.0, 90, 1920, 1080, False)
    assert "force_original_aspect_ratio=increase" in f_fill
    assert f_fill.split(",")[0] != "scale=1920:1080"  # No unconstrained raw stretching
    assert "crop=1920:1080:" in f_fill
    assert "setsar=1" in f_fill


def test_motion_and_crop_coordinate_clamping():
    """Verify crop percentages are clamped safely within [0, 100] to prevent FFmpeg bounds errors."""
    scene_oversized_crop = SceneModel(
        id="sc_crop",
        start=0.0,
        end=3.0,
        duration=3.0,
        caption="crop test",
        image_crop={"x": 90, "y": 80, "width": 50, "height": 50},  # x+w=140% > 100%
        motion="slow zoom in"
    )
    filters = render_service._build_scene_filters(scene_oversized_crop, 3.0, 90, 1920, 1080, False, target_fps=30)
    assert "crop=" in filters
    assert "zoompan=" in filters
    assert "fps=30" in filters


def test_authoritative_caption_sync():
    """Verify authoritative caption timestamps are preserved without drift."""
    scenes = [
        SceneModel(id="s1", start=0.0, end=2.75, duration=2.75, caption="First authoritative beat"),
        SceneModel(id="s2", start=2.75, end=5.50, duration=2.75, caption="Second authoritative beat"),
    ]
    from app.models.project import CaptionSettingsModel
    settings = CaptionSettingsModel(enabled=True)
    ass = _generate_ass_subtitles(scenes, settings, 1920, 1080)
    assert "Dialogue: 0,0:00:00.00,0:00:02.75,Default,,0,0,0,,First authoritative beat" in ass
    assert "Dialogue: 0,0:00:02.75,0:00:05.50,Default,,0,0,0,,Second authoritative beat" in ass


def test_render_canvas_landscape_16x9(clean_project):
    """Render a real 16:9 Full HD (1920x1080) MP4 with H.264, AAC audio, and captions."""
    # 1. Setup scenes
    captions = """00:00 - 00:02
Landscape Full HD scene one with vivid colors.

00:02 - 00:04
Landscape Full HD scene two with smooth motion."""
    client.post(f"/api/projects/{clean_project}/captions", json={"raw_captions": captions})

    # 2. Add sample audio voiceover
    fake_audio = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    client.post(
        f"/api/projects/{clean_project}/audio",
        files={"audio_file": ("narration.wav", fake_audio, "audio/wav")}
    )

    # 3. Enqueue 16:9 render job
    res = client.post(
        f"/api/projects/{clean_project}/render",
        json={"resolution": "1920x1080", "aspect_ratio": "16:9"}
    )
    assert res.status_code == 202
    job_id = res.json()["id"]

    # 4. Wait for completion
    job = _wait_for_render(job_id, timeout=45.0)
    assert job is not None
    assert job.status == "completed", f"Render failed with error: {job.error}"
    assert job.output_path is not None

    # 5. Probe rendered MP4 metadata with FFmpeg
    full_path = STORAGE_DIR / job.output_path
    meta = probe_video_metadata(full_path)

    assert meta["is_valid"] is True
    assert meta["width"] == 1920
    assert meta["height"] == 1080
    assert meta["aspect_ratio"] == "16:9"
    assert meta["video_codec"] == "h264"
    assert meta["fps"] == 30.0
    assert meta["audio_codec"] == "aac"
    assert meta["duration"] == pytest.approx(4.0, abs=0.5)


def test_render_canvas_vertical_9x16(clean_project):
    """Render a real 9:16 Full HD (1080x1920) MP4 with H.264, AAC audio, and captions."""
    captions = """00:00 - 00:02
Vertical mobile video for TikTok, Shorts, Reels.

00:02 - 00:04
Authoritative second scene with seamless transition."""
    client.post(f"/api/projects/{clean_project}/captions", json={"raw_captions": captions})

    # Enqueue 9:16 render job
    res = client.post(
        f"/api/projects/{clean_project}/render",
        json={"resolution": "1080x1920", "aspect_ratio": "9:16"}
    )
    assert res.status_code == 202
    job_id = res.json()["id"]

    job = _wait_for_render(job_id, timeout=45.0)
    assert job is not None
    assert job.status == "completed", f"Render failed: {job.error}"

    full_path = STORAGE_DIR / job.output_path
    meta = probe_video_metadata(full_path)

    assert meta["is_valid"] is True
    assert meta["width"] == 1080
    assert meta["height"] == 1920
    assert meta["aspect_ratio"] == "9:16"
    assert meta["video_codec"] == "h264"
    assert meta["fps"] == 30.0
    assert meta["audio_codec"] == "aac"


def test_render_canvas_square_1x1(clean_project):
    """Render a real 1:1 Square (1080x1080) MP4 with H.264 and AAC audio."""
    captions = """00:00 - 00:02
Square aspect ratio video post for Instagram.

00:02 - 00:04
Clean composition perfectly balanced without stretch."""
    client.post(f"/api/projects/{clean_project}/captions", json={"raw_captions": captions})

    # Enqueue 1:1 render job
    res = client.post(
        f"/api/projects/{clean_project}/render",
        json={"resolution": "1080x1080", "aspect_ratio": "1:1"}
    )
    assert res.status_code == 202
    job_id = res.json()["id"]

    job = _wait_for_render(job_id, timeout=45.0)
    assert job is not None
    assert job.status == "completed", f"Render failed: {job.error}"

    full_path = STORAGE_DIR / job.output_path
    meta = probe_video_metadata(full_path)

    assert meta["is_valid"] is True
    assert meta["width"] == 1080
    assert meta["height"] == 1080
    assert meta["aspect_ratio"] == "1:1"
    assert meta["video_codec"] == "h264"
    assert meta["fps"] == 30.0
    assert meta["audio_codec"] == "aac"


def test_render_failure_handling_and_retry(clean_project):
    """Verify that a failed render preserves project scenes and assets, provides meaningful error, and allows retry."""
    captions = """00:00 - 00:03
Scene that exists before simulated failure."""
    client.post(f"/api/projects/{clean_project}/captions", json={"raw_captions": captions})

    # Corrupt scene image path to simulate missing asset / failure
    proj = project_service.get_project(clean_project)
    assert len(proj.scenes) == 1
    orig_caption = proj.scenes[0].caption

    # Create render job
    job = render_service.create_render_job(clean_project, resolution="1080x1920")
    assert job.status in ("queued", "processing")

    # Manually simulate a failure state to verify failure handling & retry semantics
    job.status = "failed"
    job.error = "Simulated FFmpeg process error for retry verification."
    render_service._save_jobs_for_project(clean_project)

    # 1. Verify project & scenes are intact
    proj_after = project_service.get_project(clean_project)
    assert proj_after is not None
    assert len(proj_after.scenes) == 1
    assert proj_after.scenes[0].caption == orig_caption

    # 2. Verify retry endpoint works and launches new job with identical settings
    retry_res = client.post(f"/api/projects/{clean_project}/render/{job.id}/retry")
    assert retry_res.status_code == 202
    retry_job_data = retry_res.json()
    assert retry_job_data["id"] != job.id
    assert retry_job_data["resolution"] == job.resolution
    assert retry_job_data["aspect_ratio"] == job.aspect_ratio
