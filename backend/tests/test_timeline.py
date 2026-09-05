import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def test_project_with_scenes():
    # Create project
    create_res = client.post(
        "/api/projects",
        json={"name": "Timeline Test Project", "description": "Testing Master Timeline Rule"}
    )
    assert create_res.status_code == 201
    project = create_res.json()
    project_id = project["id"]

    # Add captions with 3 scenes
    captions = """00:00 - 00:05
The spaceship approached the alien planet.

00:05 - 00:12
Vibrant purple clouds enveloped the upper atmosphere.

00:12 - 00:18
A beacon began transmitting mysterious frequencies."""

    cap_res = client.post(
        f"/api/projects/{project_id}/captions",
        json={"raw_captions": captions}
    )
    assert cap_res.status_code == 200

    yield project_id

    # Cleanup
    client.delete(f"/api/projects/{project_id}")

def test_master_timeline_rule_and_scene_update(test_project_with_scenes):
    project_id = test_project_with_scenes
    get_res = client.get(f"/api/projects/{project_id}")
    scenes = get_res.json()["scenes"]
    assert len(scenes) == 3

    # Master Timeline Rule: image occupies scene start to end
    assert scenes[0]["start"] == 0.0
    assert scenes[0]["end"] == 5.0
    assert scenes[0]["duration"] == 5.0

    # Update Scene 1 with motion and transition, plus change end time with ripple
    update_res = client.put(
        f"/api/projects/{project_id}/timeline/scenes/{scenes[0]['id']}?ripple=true",
        json={
            "end": 7.0,
            "motion": "slow zoom in",
            "transition": "fade",
            "transition_duration": 0.8
        }
    )
    assert update_res.status_code == 200
    updated_scenes = update_res.json()["scenes"]

    # Scene 0 updated
    assert updated_scenes[0]["start"] == 0.0
    assert updated_scenes[0]["end"] == 7.0
    assert updated_scenes[0]["duration"] == 7.0
    assert updated_scenes[0]["motion"] == "slow zoom in"
    assert updated_scenes[0]["transition"] == "fade"
    assert updated_scenes[0]["transition_duration"] == 0.8

    # Ripple effect: Scene 1 shifted by +2.0 seconds
    assert updated_scenes[1]["start"] == 7.0
    assert updated_scenes[1]["end"] == 14.0
    # Scene 2 shifted by +2.0 seconds
    assert updated_scenes[2]["start"] == 14.0
    assert updated_scenes[2]["end"] == 20.0

def test_split_scene(test_project_with_scenes):
    project_id = test_project_with_scenes
    get_res = client.get(f"/api/projects/{project_id}")
    scenes = get_res.json()["scenes"]
    target = scenes[1]  # start 5.0, end 12.0

    split_res = client.post(
        f"/api/projects/{project_id}/timeline/scenes/{target['id']}/split",
        json={"split_time": 8.5}
    )
    assert split_res.status_code == 200
    updated_scenes = split_res.json()["scenes"]
    assert len(updated_scenes) == 4

    # Original scene shortened
    s1 = updated_scenes[1]
    assert s1["id"] == target["id"]
    assert s1["start"] == 5.0
    assert s1["end"] == 8.5
    assert s1["duration"] == 3.5

    # New scene created contiguously
    s2 = updated_scenes[2]
    assert s2["start"] == 8.5
    assert s2["end"] == 12.0
    assert s2["duration"] == 3.5
    assert "cont." in s2["caption"]

    # Scene 3 intact
    s3 = updated_scenes[3]
    assert s3["start"] == 12.0
    assert s3["end"] == 18.0

def test_duplicate_scene(test_project_with_scenes):
    project_id = test_project_with_scenes
    get_res = client.get(f"/api/projects/{project_id}")
    scenes = get_res.json()["scenes"]
    target = scenes[0]  # 0.0 to 5.0 (duration 5.0)

    dup_res = client.post(
        f"/api/projects/{project_id}/timeline/scenes/{target['id']}/duplicate"
    )
    assert dup_res.status_code == 200
    updated_scenes = dup_res.json()["scenes"]
    assert len(updated_scenes) == 4

    # Scene 0: 0.0 to 5.0
    assert updated_scenes[0]["start"] == 0.0
    assert updated_scenes[0]["end"] == 5.0

    # Duplicated Scene 1: 5.0 to 10.0
    assert updated_scenes[1]["start"] == 5.0
    assert updated_scenes[1]["end"] == 10.0
    assert updated_scenes[1]["duration"] == 5.0
    assert "Copy" in updated_scenes[1]["caption"]

    # Downstream scene shifted by 5.0 (originally 5.0 to 12.0 -> now 10.0 to 17.0)
    assert updated_scenes[2]["start"] == 10.0
    assert updated_scenes[2]["end"] == 17.0

def test_delete_scene(test_project_with_scenes):
    project_id = test_project_with_scenes
    get_res = client.get(f"/api/projects/{project_id}")
    scenes = get_res.json()["scenes"]
    target_to_del = scenes[1]  # duration 7.0

    del_res = client.delete(
        f"/api/projects/{project_id}/timeline/scenes/{target_to_del['id']}?ripple=true"
    )
    assert del_res.status_code == 200
    updated_scenes = del_res.json()["scenes"]
    assert len(updated_scenes) == 2

    # Scene 0 unchanged: 0.0 to 5.0
    assert updated_scenes[0]["start"] == 0.0
    assert updated_scenes[0]["end"] == 5.0

    # Scene 1 (originally Scene 2, 12.0 to 18.0) shifted back by 7.0 -> 5.0 to 11.0
    assert updated_scenes[1]["start"] == 5.0
    assert updated_scenes[1]["end"] == 11.0
    assert updated_scenes[1]["duration"] == 6.0

def test_reorder_scenes(test_project_with_scenes):
    project_id = test_project_with_scenes
    get_res = client.get(f"/api/projects/{project_id}")
    scenes = get_res.json()["scenes"]
    ids = [s["id"] for s in scenes]  # [id0 (5s), id1 (7s), id2 (6s)]

    # Reverse order: [id2, id1, id0]
    reversed_ids = list(reversed(ids))
    reorder_res = client.post(
        f"/api/projects/{project_id}/timeline/reorder",
        json={"scene_ids": reversed_ids}
    )
    assert reorder_res.status_code == 200
    updated_scenes = reorder_res.json()["scenes"]

    # id2 was 6s duration -> starts at 0.0, ends at 6.0
    assert updated_scenes[0]["id"] == ids[2]
    assert updated_scenes[0]["start"] == 0.0
    assert updated_scenes[0]["end"] == 6.0

    # id1 was 7s duration -> starts at 6.0, ends at 13.0
    assert updated_scenes[1]["id"] == ids[1]
    assert updated_scenes[1]["start"] == 6.0
    assert updated_scenes[1]["end"] == 13.0

    # id0 was 5s duration -> starts at 13.0, ends at 18.0
    assert updated_scenes[2]["id"] == ids[0]
    assert updated_scenes[2]["start"] == 13.0
    assert updated_scenes[2]["end"] == 18.0

def test_upload_replacement_image(test_project_with_scenes):
    project_id = test_project_with_scenes
    get_res = client.get(f"/api/projects/{project_id}")
    scenes = get_res.json()["scenes"]
    target_id = scenes[0]["id"]

    # Create dummy PNG bytes
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"

    upload_res = client.post(
        f"/api/projects/{project_id}/timeline/scenes/{target_id}/upload-image",
        files={"file": ("custom_shot.png", io.BytesIO(fake_png), "image/png")}
    )
    assert upload_res.status_code == 200
    updated_scene = upload_res.json()
    assert updated_scene["id"] == target_id
    assert updated_scene["image_status"] == "completed"
    assert "/media/" in updated_scene["image_url"]
    assert updated_scene["image_metadata"]["source"] == "user_upload"
