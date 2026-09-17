import io
import os
import time
from pathlib import Path
from PIL import Image, ImageDraw
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.project_service import project_service, STORAGE_DIR
from app.services.render_service import (
    render_service,
    probe_video_metadata,
    get_ffmpeg_executable,
)

client = TestClient(app)


def _create_dummy_image(path: Path, color: str = "blue", text: str = "Scene"):
    path.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (1920, 1080), color=color)
    draw = ImageDraw.Draw(img)
    draw.text((100, 100), text, fill="white")
    img.save(path, format="JPEG", quality=90)


def _wait_for_job(job_id: str, timeout: float = 45.0):
    start = time.time()
    while time.time() - start < timeout:
        job = render_service.get_job(job_id)
        if job and job.status in ("completed", "failed"):
            return job
        time.sleep(0.3)
    return render_service.get_job(job_id)


def test_complete_stage1_to_stage5_pipeline():
    """
    End-to-End Integration Test across all 5 Scenora SaaS stages:
    Stage 1: Script & Audio ingestion / Master Timeline creation
    Stage 2: Video Bible consistency constraints
    Stage 3: Storyboard visual assets and prompt compilation
    Stage 4: Timeline Studio motion presets, transitions, and audio ducking
    Stage 5: Render engine execution, video probing, multi-format delivery, and deletion
    """
    # ----------------------------------------------------
    # STAGE 1: Script & Audio / Master Timeline
    # ----------------------------------------------------
    create_res = client.post(
        "/api/projects",
        json={"name": "E2E Stage 1-5 SaaS Master", "description": "Full end-to-end integration test"}
    )
    assert create_res.status_code == 201
    project = create_res.json()
    project_id = project["id"]

    try:
        # Ingest raw script with timestamps to build Master Timeline
        captions_raw = """00:00 - 00:02
Welcome to Scenora AI studio.

00:02 - 00:04
Consistency across characters and scenes.

00:04 - 00:06
Export broadcast grade media in seconds."""

        cap_res = client.post(
            f"/api/projects/{project_id}/captions",
            json={"raw_captions": captions_raw}
        )
        assert cap_res.status_code == 200
        scenes_data = cap_res.json().get("scenes", [])
        assert len(scenes_data) == 3
        # Assert contiguous non-overlapping timing
        assert scenes_data[0]["start"] == 0.0 and scenes_data[0]["end"] == 2.0
        assert scenes_data[1]["start"] == 2.0 and scenes_data[1]["end"] == 4.0
        assert scenes_data[2]["start"] == 4.0 and scenes_data[2]["end"] == 6.0

        # Configure project settings: Captions, Audio & Canvas
        settings_res = client.put(
            f"/api/projects/{project_id}/settings",
            json={
                "caption_settings": {
                    "enabled": True,
                    "font_size": 42,
                    "font_family": "Arial",
                    "color": "#FFFFFF",
                    "position": "bottom",
                    "alignment": "center",
                    "background": "semi-transparent",
                    "outline_shadow": "subtle",
                    "safe_area": True
                },
                "audio_settings": {
                    "narration_volume": 1.0,
                    "narration_muted": False,
                    "music_volume": 0.25,
                    "music_fade_in": 1.0,
                    "music_fade_out": 2.0,
                    "music_muted": False,
                    "ducking_enabled": True
                },
                "canvas_settings": {
                    "aspect_ratio": "16:9",
                    "resolution": "1920x1080",
                    "fps": 30
                }
            }
        )
        assert settings_res.status_code == 200

        # ----------------------------------------------------
        # STAGE 2: Video Bible Consistency Engine
        # ----------------------------------------------------
        char_res = client.post(
            f"/api/projects/{project_id}/bible/characters",
            json={
                "name": "Alex",
                "role": "Narrator",
                "description": "Tech entrepreneur in casual hoodie",
                "negative_prompt": "blurry, low quality, deformed hands"
            }
        )
        assert char_res.status_code in (200, 201)

        loc_res = client.post(
            f"/api/projects/{project_id}/bible/locations",
            json={
                "name": "High-tech Lab",
                "description": "Clean neon cyberpunk workstation",
                "lighting": "Cinematic volumetric cyan and magenta"
            }
        )
        assert loc_res.status_code in (200, 201)

        # ----------------------------------------------------
        # STAGE 3 & 4: Storyboard Visuals & Timeline Studio Motion
        # ----------------------------------------------------
        # Assign generated images to each scene and configure motion
        img_dir = STORAGE_DIR / "projects" / project_id / "images"
        img1 = img_dir / "scene_0.jpg"
        img2 = img_dir / "scene_1.jpg"
        img3 = img_dir / "scene_2.jpg"

        _create_dummy_image(img1, color="#1e1b4b", text="Stage 3: Scene 1")
        _create_dummy_image(img2, color="#064e3b", text="Stage 3: Scene 2")
        _create_dummy_image(img3, color="#701a75", text="Stage 3: Scene 3")

        # Update scene 0
        s0_id = scenes_data[0]["id"]
        res_s0 = client.put(
            f"/api/projects/{project_id}/scenes/{s0_id}",
            json={
                "image_url": f"/storage/projects/{project_id}/images/scene_0.jpg",
                "image_prompt": "Alex introducing Scenora in High-tech Lab",
                "motion": "zoom_in",
                "image_fit": "cover"
            }
        )
        assert res_s0.status_code == 200

        # Update scene 1
        s1_id = scenes_data[1]["id"]
        res_s1 = client.put(
            f"/api/projects/{project_id}/scenes/{s1_id}",
            json={
                "image_url": f"/storage/projects/{project_id}/images/scene_1.jpg",
                "image_prompt": "Alex reviewing video bible consistency",
                "motion": "pan_left",
                "image_fit": "cover"
            }
        )
        assert res_s1.status_code == 200

        # Update scene 2
        s2_id = scenes_data[2]["id"]
        res_s2 = client.put(
            f"/api/projects/{project_id}/scenes/{s2_id}",
            json={
                "image_url": f"/storage/projects/{project_id}/images/scene_2.jpg",
                "image_prompt": "Scenora broadcast export dashboard",
                "motion": "zoom_out",
                "image_fit": "cover"
            }
        )
        assert res_s2.status_code == 200

        # ----------------------------------------------------
        # STAGE 5: Export & Deliver (Render + Transcode + Delete)
        # ----------------------------------------------------
        # 1. Enqueue 1920x1080 Full HD Render Job
        render_res = client.post(
            f"/api/projects/{project_id}/render",
            json={
                "resolution": "1920x1080",
                "aspect_ratio": "16:9"
            }
        )
        assert render_res.status_code == 202
        job_info = render_res.json()
        job_id = job_info["id"]
        assert job_info["resolution"] == "1920x1080"
        assert job_info["aspect_ratio"] == "16:9"

        # 2. Wait for FFmpeg completion
        finished_job = _wait_for_job(job_id, timeout=45.0)
        assert finished_job is not None, "Render job did not return"
        assert finished_job.status == "completed", f"Render job failed with: {finished_job.error}"
        assert finished_job.output_path is not None

        # 3. Probe Output Video with FFprobe
        master_mp4 = STORAGE_DIR / finished_job.output_path
        assert master_mp4.exists()
        assert master_mp4.stat().st_size > 1000

        probe = probe_video_metadata(master_mp4)
        assert probe["width"] == 1920
        assert probe["height"] == 1080
        # Exact 6.0s duration with 0 timing drift
        assert abs(probe["duration"] - 6.0) < 0.2
        assert probe["video_codec"] == "h264"
        assert probe["audio_codec"] == "aac"

        # 4. Test Multi-Format Deliveries
        # MP3 audio extract
        mp3_res = client.get(f"/api/projects/{project_id}/render/{job_id}/download?format=mp3")
        assert mp3_res.status_code == 200
        assert "audio/mpeg" in mp3_res.headers.get("content-type", "")
        assert len(mp3_res.content) > 100

        # 720p HD mobile version
        p720_res = client.get(f"/api/projects/{project_id}/render/{job_id}/download?format=720p")
        assert p720_res.status_code == 200
        assert "video/mp4" in p720_res.headers.get("content-type", "")
        assert len(p720_res.content) > 1000

        # Animated loop GIF
        gif_res = client.get(f"/api/projects/{project_id}/render/{job_id}/download?format=gif")
        assert gif_res.status_code == 200
        assert "image/gif" in gif_res.headers.get("content-type", "")
        assert len(gif_res.content) > 1000

        # 5. Test Non-Blocking Delete Flow
        del_res = client.delete(f"/api/projects/{project_id}/render/{job_id}")
        assert del_res.status_code in (200, 204)
        list_res = client.get(f"/api/projects/{project_id}/renders")
        assert list_res.status_code == 200
        jobs = list_res.json().get("jobs", [])
        assert not any(j["id"] == job_id for j in jobs)

    finally:
        client.delete(f"/api/projects/{project_id}")
