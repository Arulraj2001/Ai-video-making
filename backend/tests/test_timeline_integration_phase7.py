"""
Phase 7 — Timeline Studio Integration & Master Timeline Mapping Tests.
Verifies:
1. Caption -> Scene -> Clip -> Render timing with zero drift.
2. Visual/transform editing without touching caption timestamps.
3. Ripple adjustments maintaining contiguous timeline boundaries.
4. Scene image replacement safety (does not mutate timing, captions, Video Bible, or neighbors).
5. Storyboard to Timeline to FFmpeg filter synchronization.
6. State restoration for undo/redo fidelity.
"""
import io
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.project import ProjectModel
from app.models.scene import SceneModel
from app.models.video_bible import VideoBibleModel, CharacterModel, LocationModel, ObjectModel
from app.services.project_service import project_service
from app.services.render_service import render_service, _generate_ass_subtitles, _format_ass_time
from app.schemas.project import SceneUpdate

client = TestClient(app)


@pytest.fixture
def project_with_bible(tmp_path, monkeypatch):
    monkeypatch.setattr("app.services.project_service.PROJECTS_DIR", tmp_path)
    monkeypatch.setattr("app.services.scene_image_service.STORAGE_DIR", tmp_path)
    monkeypatch.setattr("app.services.render_service.STORAGE_DIR", tmp_path)
    project_service._projects.clear()

    # 4-scene project with non-integer Clipchamp timecodes
    captions = """00:00 - 00:04.500
Bob arrives at his office and sits at his desk.

00:04.500 - 00:11.200
Bob drinks his morning coffee while studying financial reports.

00:11.200 - 00:15.000
He spots an automated workflow tool on his computer screen.

00:15.000 - 00:22.750
Bob completes his analysis and leans back with confidence."""

    bob = CharacterModel(
        id="char-bob",
        name="Bob",
        description="data analyst",
        appearance="man with round glasses",
        clothing="white shirt and blue tie"
    )
    office = LocationModel(
        id="loc-office",
        name="Bob's Office",
        description="modern workplace with large windows"
    )
    mug = ObjectModel(
        id="obj-mug",
        name="Bob's Ceramic Mug",
        description="blue ceramic coffee mug"
    )

    create_res = client.post(
        "/api/projects",
        json={"name": "Phase 7 Timeline Studio Project", "description": "Master Timeline Integration"}
    )
    assert create_res.status_code == 201
    proj_data = create_res.json()
    proj_id = proj_data["id"]

    # Ingest captions
    cap_res = client.post(
        f"/api/projects/{proj_id}/captions",
        json={"raw_captions": captions}
    )
    assert cap_res.status_code == 200

    # Attach Video Bible
    proj = project_service.get_project(proj_id)
    proj.video_bible = VideoBibleModel(
        characters=[bob],
        locations=[office],
        objects=[mug],
    )
    project_service._save_to_disk(proj)

    yield proj_id

    # Cleanup
    client.delete(f"/api/projects/{proj_id}")


def test_caption_to_timeline_to_render_zero_drift(project_with_bible):
    """
    Verify: caption timing -> scene timing -> clip duration -> render duration with zero drift.
    """
    proj_id = project_with_bible
    proj = project_service.get_project(proj_id)
    scenes = proj.scenes

    assert len(scenes) == 4

    # Scene 1: 0.000 -> 4.500 (4.500s)
    assert scenes[0].start == 0.0
    assert scenes[0].end == 4.5
    assert scenes[0].duration == 4.5

    # Scene 2: 4.500 -> 11.200 (6.700s)
    assert scenes[1].start == 4.5
    assert scenes[1].end == 11.2
    assert scenes[1].duration == 6.7

    # Scene 3: 11.200 -> 15.000 (3.800s)
    assert scenes[2].start == 11.2
    assert scenes[2].end == 15.0
    assert scenes[2].duration == 3.8

    # Scene 4: 15.000 -> 22.750 (7.750s)
    assert scenes[3].start == 15.0
    assert scenes[3].end == 22.75
    assert scenes[3].duration == 7.75

    # Cumulative timeline checks
    sum_durations = round(sum(s.duration for s in scenes), 3)
    max_end_time = max(s.end for s in scenes)
    assert sum_durations == 22.75
    assert max_end_time == 22.75

    # Contiguity check: each scene starts exactly when previous ends
    for i in range(1, len(scenes)):
        assert scenes[i].start == scenes[i - 1].end

    # Verify ASS Subtitle file generation matches exact start and end times
    caption_settings = proj.caption_settings
    ass_text = _generate_ass_subtitles(
        scenes=scenes,
        caption_settings=caption_settings,
        target_width=1080,
        target_height=1920
    )

    # Validate dialogue events in ASS
    assert f"Dialogue: 0,{_format_ass_time(0.0)},{_format_ass_time(4.5)}" in ass_text
    assert f"Dialogue: 0,{_format_ass_time(4.5)},{_format_ass_time(11.2)}" in ass_text
    assert f"Dialogue: 0,{_format_ass_time(11.2)},{_format_ass_time(15.0)}" in ass_text
    assert f"Dialogue: 0,{_format_ass_time(15.0)},{_format_ass_time(22.75)}" in ass_text


def test_visual_editing_preserves_caption_timestamps(project_with_bible):
    """
    Verify editing visual transforms (crop, zoom, position, fit, motion, transition)
    does NOT alter caption timestamps (zero silent drift).
    """
    proj_id = project_with_bible
    proj = project_service.get_project(proj_id)
    target_scene = proj.scenes[1]
    original_start = target_scene.start
    original_end = target_scene.end
    original_duration = target_scene.duration
    original_caption = target_scene.caption

    # Edit framing, motion, transition, zoom, crop
    update_res = client.put(
        f"/api/projects/{proj_id}/timeline/scenes/{target_scene.id}",
        json={
            "image_fit": "contain",
            "image_position": "top",
            "image_zoom": 1.75,
            "image_crop": {"x": 10, "y": 12, "width": 80, "height": 76},
            "motion": "pan right",
            "transition": "crossfade",
            "transition_duration": 0.6,
            "brightness": 0.1,
            "contrast": 1.2,
            "saturation": 1.1,
            "color_filter": "cinematic"
        }
    )
    assert update_res.status_code == 200
    updated_proj = update_res.json()
    s1 = updated_proj["scenes"][1]

    # Visual properties updated
    assert s1["image_fit"] == "contain"
    assert s1["image_position"] == "top"
    assert s1["image_zoom"] == 1.75
    assert s1["image_crop"] == {"x": 10, "y": 12, "width": 80, "height": 76}
    assert s1["motion"] == "pan right"
    assert s1["transition"] == "crossfade"
    assert s1["transition_duration"] == 0.6
    assert s1["brightness"] == 0.1
    assert s1["color_filter"] == "cinematic"

    # CRITICAL: Timestamps and caption must remain IDENTICAL
    assert s1["start"] == original_start
    assert s1["end"] == original_end
    assert s1["duration"] == original_duration
    assert s1["caption"] == original_caption

    # All neighboring scenes preserved
    assert updated_proj["scenes"][0]["start"] == 0.0
    assert updated_proj["scenes"][0]["end"] == 4.5
    assert updated_proj["scenes"][2]["start"] == 11.2
    assert updated_proj["scenes"][3]["end"] == 22.75


def test_ripple_scene_timing_adjustment(project_with_bible):
    """
    Verify that expanding a scene's duration with ripple=True shifts all downstream
    scenes by exact delta while keeping all boundaries contiguous.
    """
    proj_id = project_with_bible

    # Extend Scene 2 end from 11.2 to 13.0 (+1.8s) with ripple=True
    update_res = client.put(
        f"/api/projects/{proj_id}/timeline/scenes/scene-002?ripple=true",
        json={"end": 13.0}
    )
    assert update_res.status_code == 200
    scenes = update_res.json()["scenes"]

    # Scene 1 unchanged
    assert scenes[0]["start"] == 0.0
    assert scenes[0]["end"] == 4.5

    # Scene 2 expanded
    assert scenes[1]["start"] == 4.5
    assert scenes[1]["end"] == 13.0
    assert scenes[1]["duration"] == 8.5

    # Scene 3 shifted by +1.8s (was 11.2 -> 15.0, now 13.0 -> 16.8)
    assert scenes[2]["start"] == 13.0
    assert scenes[2]["end"] == 16.8
    assert scenes[2]["duration"] == 3.8

    # Scene 4 shifted by +1.8s (was 15.0 -> 22.75, now 16.8 -> 24.55)
    assert scenes[3]["start"] == 16.8
    assert scenes[3]["end"] == 24.55
    assert scenes[3]["duration"] == 7.75


def test_scene_image_replacement_safety(project_with_bible):
    """
    Verify image replacement updates the scene image reference without mutating:
    - scene start, end, or duration
    - caption text
    - neighboring scenes
    - Video Bible entities
    """
    proj_id = project_with_bible
    proj_before = project_service.get_project(proj_id)
    scene_2_before = proj_before.scenes[1]
    bible_chars_before = len(proj_before.video_bible.characters)

    fake_png = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
        b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )

    upload_res = client.post(
        f"/api/projects/{proj_id}/timeline/scenes/scene-002/upload-image",
        files={"file": ("bob_replacement_mug.png", io.BytesIO(fake_png), "image/png")}
    )
    assert upload_res.status_code == 200
    uploaded_scene = upload_res.json()

    # Image reference updated
    assert uploaded_scene["id"] == "scene-002"
    assert uploaded_scene["image_status"] == "completed"
    assert "/media/" in uploaded_scene["image_url"]
    assert uploaded_scene["image_metadata"]["source"] == "user_upload"

    # Confirm project state
    proj_after = project_service.get_project(proj_id)
    scene_2_after = proj_after.scenes[1]

    # Timing unchanged
    assert scene_2_after.start == scene_2_before.start
    assert scene_2_after.end == scene_2_before.end
    assert scene_2_after.duration == scene_2_before.duration

    # Caption unchanged
    assert scene_2_after.caption == scene_2_before.caption

    # Neighbors unchanged
    assert proj_after.scenes[0].start == proj_before.scenes[0].start
    assert proj_after.scenes[0].end == proj_before.scenes[0].end
    assert proj_after.scenes[2].start == proj_before.scenes[2].start
    assert proj_after.scenes[2].end == proj_before.scenes[2].end

    # Video Bible unchanged
    assert len(proj_after.video_bible.characters) == bible_chars_before
    assert proj_after.video_bible.characters[0].name == "Bob"


def test_storyboard_to_timeline_to_ffmpeg_filters(project_with_bible):
    """
    Verify that scene properties configured in the storyboard/timeline correctly translate
    into valid FFmpeg filter expressions in render_service with exact crop, zoom, and frame counts.
    """
    proj_id = project_with_bible
    proj = project_service.get_project(proj_id)
    scene = proj.scenes[1]  # duration 6.7s

    # Set custom transform
    scene.image_crop = {"x": 10.0, "y": 15.0, "width": 80.0, "height": 70.0}
    scene.image_fit = "cover"
    scene.image_zoom = 1.4
    scene.motion = "slow zoom in"
    scene.transition = "fade"
    scene.transition_duration = 0.5

    duration = scene.duration
    target_fps = 30
    num_frames = int(round(duration * target_fps))

    filters = render_service._build_scene_filters(
        scene=scene,
        duration=duration,
        num_frames=num_frames,
        target_width=1080,
        target_height=1920,
        is_last=False
    )

    # Bounding crop filter applied
    assert "crop=iw*0.800:ih*0.700:iw*0.100:ih*0.150" in filters

    # Motion zoompan filter applied with exact frame count
    assert f"d={num_frames}" in filters
    assert "s=1080x1920" in filters
    assert "zoompan=" in filters


def test_undo_redo_history_restoration(project_with_bible):
    """
    Verify /restore endpoint allows timeline history snapshots to be restored perfectly.
    """
    proj_id = project_with_bible
    proj = project_service.get_project(proj_id)
    original_scenes_json = [s.__dict__.copy() for s in proj.scenes]

    # Modify scene 1 caption and end time
    client.put(
        f"/api/projects/{proj_id}/timeline/scenes/scene-001",
        json={"caption": "Modified caption", "end": 6.0}
    )

    # Restore original scenes snapshot
    restore_res = client.post(
        f"/api/projects/{proj_id}/timeline/restore",
        json=original_scenes_json
    )
    assert restore_res.status_code == 200
    restored_scenes = restore_res.json()["scenes"]

    assert restored_scenes[0]["caption"] == "Bob arrives at his office and sits at his desk."
    assert restored_scenes[0]["end"] == 4.5
