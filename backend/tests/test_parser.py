import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.caption_parser import parse_and_validate_captions, parse_time_to_seconds

client = TestClient(app)

SAMPLE_STANDARD = """
00:00 - 00:05
Caption text

00:05 - 00:11
Another caption
"""

SAMPLE_UNICODE_ARROW = """
00:00 → 00:05
Caption text with arrow

00:05 → 00:11
Second scene
"""

SAMPLE_SRT_ARROW = """
00:00 --> 00:05
Standard SRT arrow scene

00:05 --> 00:11
Next scene
"""

SAMPLE_HH_MM_SS = """
00:00:00 --> 00:00:05
Full hour minute second format

00:00:05 --> 00:00:12
Continuing the story
"""

SAMPLE_FRACTIONS = """
00:01.500 - 00:04.250
Subsecond precision text

00:04.250 - 00:09.000
Second segment
"""

def test_timecode_parsing():
    assert parse_time_to_seconds("00:00") == 0.0
    assert parse_time_to_seconds("00:05") == 5.0
    assert parse_time_to_seconds("01:23") == 83.0
    assert parse_time_to_seconds("0:05") == 5.0
    assert parse_time_to_seconds("00:00:05") == 5.0
    assert parse_time_to_seconds("01:00:00") == 3600.0
    assert parse_time_to_seconds("00:01.500") == 1.5
    # Invalid timecodes
    assert parse_time_to_seconds("00:75") is None
    assert parse_time_to_seconds("invalid") is None

def test_parse_standard_format():
    res = parse_and_validate_captions(SAMPLE_STANDARD)
    assert res.valid is True
    assert len(res.scenes) == 2
    assert res.scenes[0].id == "scene-001"
    assert res.scenes[0].start == 0.0
    assert res.scenes[0].end == 5.0
    assert res.scenes[0].duration == 5.0
    assert res.scenes[0].caption == "Caption text"
    assert isinstance(res.scenes[0].start, (int, float))
    assert isinstance(res.scenes[0].end, (int, float))

    assert res.scenes[1].id == "scene-002"
    assert res.scenes[1].start == 5.0
    assert res.scenes[1].end == 11.0
    assert res.scenes[1].duration == 6.0
    assert res.scenes[1].caption == "Another caption"

def test_parse_unicode_arrow():
    res = parse_and_validate_captions(SAMPLE_UNICODE_ARROW)
    assert res.valid is True
    assert len(res.scenes) == 2
    assert res.scenes[0].caption == "Caption text with arrow"

def test_parse_srt_arrow():
    res = parse_and_validate_captions(SAMPLE_SRT_ARROW)
    assert res.valid is True
    assert len(res.scenes) == 2
    assert res.scenes[0].end == 5.0

def test_parse_hh_mm_ss():
    res = parse_and_validate_captions(SAMPLE_HH_MM_SS)
    assert res.valid is True
    assert len(res.scenes) == 2
    assert res.scenes[1].duration == 7.0

def test_parse_fractions():
    res = parse_and_validate_captions(SAMPLE_FRACTIONS)
    assert res.valid is True
    assert res.scenes[0].start == 1.5
    assert res.scenes[0].end == 4.25
    assert res.scenes[0].duration == 2.75

# Validation failure tests

def test_validation_missing_timestamps():
    bad_input = "This is raw text without any timestamps whatsoever."
    res = parse_and_validate_captions(bad_input)
    assert res.valid is False
    assert any("Missing timestamp" in err for err in res.errors)

def test_validation_invalid_timestamps():
    bad_input = "00:85 - 00:99\nText with invalid minutes and seconds."
    res = parse_and_validate_captions(bad_input)
    assert res.valid is False
    assert any("Invalid" in err for err in res.errors)

def test_validation_end_before_start():
    bad_input = "00:10 - 00:05\nInverted time range."
    res = parse_and_validate_captions(bad_input)
    assert res.valid is False
    assert any("must be greater than start" in err for err in res.errors)

def test_validation_overlapping_scenes():
    bad_input = """
00:00 - 00:08
Scene one

00:05 - 00:12
Overlapping scene
"""
    res = parse_and_validate_captions(bad_input)
    assert res.valid is False
    assert any("Overlapping" in err for err in res.errors)

def test_validation_duplicate_timestamps():
    bad_input = """
00:00 - 00:05
First

00:00 - 00:05
Duplicate start time
"""
    res = parse_and_validate_captions(bad_input)
    assert res.valid is False
    assert any("Duplicate" in err for err in res.errors)

def test_validation_empty_captions():
    bad_input = """
00:00 - 00:05

00:05 - 00:10
Non empty text
"""
    res = parse_and_validate_captions(bad_input)
    assert res.valid is False
    assert any("Empty caption text" in err for err in res.errors)

# API integration tests

def test_api_parse_endpoint():
    res = client.post("/api/projects/parse-captions", json={"raw_captions": SAMPLE_STANDARD})
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert len(data["scenes"]) == 2
    assert data["scenes"][0]["id"] == "scene-001"

def test_api_import_project_and_edit_scene():
    # 1. Import project with audio file and captions
    audio_content = b"fake audio content for test"
    files = {"audio_file": ("voiceover.mp3", io.BytesIO(audio_content), "audio/mpeg")}
    data = {
        "name": "Full Production Project",
        "description": "Voiceover narration test",
        "raw_captions": SAMPLE_STANDARD
    }

    import_res = client.post("/api/projects/import", data=data, files=files)
    assert import_res.status_code == 201
    proj = import_res.json()
    proj_id = proj["id"]
    assert proj["name"] == "Full Production Project"
    assert proj["audio_file"]["filename"] == "voiceover.mp3"
    assert len(proj["scenes"]) == 2
    assert proj["scenes"][0]["start"] == 0.0

    # 2. Edit scene caption and timing
    edit_res = client.put(
        f"/api/projects/{proj_id}/scenes/scene-001",
        json={"caption": "Updated narration text", "start": 0.0, "end": 4.5}
    )
    assert edit_res.status_code == 200
    edited_scene = edit_res.json()
    assert edited_scene["caption"] == "Updated narration text"
    assert edited_scene["end"] == 4.5
    assert edited_scene["duration"] == 4.5

    # 3. Clean up
    del_res = client.delete(f"/api/projects/{proj_id}")
    assert del_res.status_code == 204

def test_api_ingest_into_existing_project():
    # 1. Create empty project with just a name (simulates New Project modal)
    create_res = client.post("/api/projects", json={"name": "Existing Empty Project"})
    assert create_res.status_code == 201
    proj = create_res.json()
    proj_id = proj["id"]
    assert len(proj["scenes"]) == 0
    assert proj["audio_file"] is None

    # 2. Ingest audio and captions into this existing project
    audio_bytes = b"test audio voice narration"
    files = {"audio_file": ("narration.mp3", io.BytesIO(audio_bytes), "audio/mpeg")}
    data = {"raw_captions": SAMPLE_STANDARD}

    ingest_res = client.post(f"/api/projects/{proj_id}/ingest", data=data, files=files)
    assert ingest_res.status_code == 200
    updated = ingest_res.json()
    assert updated["id"] == proj_id  # CRITICAL: Same project ID, no duplicate created!
    assert updated["name"] == "Existing Empty Project"
    assert updated["audio_file"]["filename"] == "narration.mp3"
    assert len(updated["scenes"]) == 2
    assert updated["scenes"][0]["start"] == 0.0

    # 3. Verify retrieval reflects populated scenes
    get_res = client.get(f"/api/projects/{proj_id}")
    assert get_res.status_code == 200
    assert len(get_res.json()["scenes"]) == 2

    # 4. Clean up
    del_res = client.delete(f"/api/projects/{proj_id}")
    assert del_res.status_code == 204

