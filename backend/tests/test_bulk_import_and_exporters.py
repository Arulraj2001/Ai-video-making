import io
import zipfile
from PIL import Image
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.bulk_import_service import bulk_import_service
from app.services.project_service import project_service
from app.services.payments.payment_service import get_payment_service
from app.models.project import ProjectModel
from app.models.scene import SceneModel
from app.schemas.project import CanvasSettingsSchema

client = TestClient(app)

def create_dummy_image(color=(255, 100, 50), size=(100, 100), mode="RGB") -> bytes:
    img = Image.new(mode, size, color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_scene_number_regex_matching():
    # Verify tolerant matching
    assert bulk_import_service.extract_scene_number("scene_01.png") == 1
    assert bulk_import_service.extract_scene_number("scene-2.jpg") == 2
    assert bulk_import_service.extract_scene_number("shot_03.webp") == 3
    assert bulk_import_service.extract_scene_number("04_hero.png") == 4
    assert bulk_import_service.extract_scene_number("5.jpeg") == 5
    assert bulk_import_service.extract_scene_number("scene06.png") == 6
    assert bulk_import_service.extract_scene_number("shot-7-forest.png") == 7
    assert bulk_import_service.extract_scene_number("random_hero_shot.png") is None

def test_image_sanitization_ffmpeg_safety():
    # 1. Test non-even dimensions are made even (e.g. 101x103 -> 100x102)
    raw = create_dummy_image(size=(101, 103))
    clean, w, h = bulk_import_service.sanitize_image_for_ffmpeg(raw, "test.png")
    assert w % 2 == 0
    assert h % 2 == 0
    assert w == 100
    assert h == 102

    # 2. Test RGBA is converted to clean standard RGB without transparency bugs
    rgba_raw = create_dummy_image(size=(120, 120), mode="RGBA")
    clean_rgba, w2, h2 = bulk_import_service.sanitize_image_for_ffmpeg(rgba_raw, "test_rgba.png")
    with Image.open(io.BytesIO(clean_rgba)) as im:
        assert im.mode == "RGB"
        assert im.size == (120, 120)

def test_zip_archive_extraction():
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w") as z:
        z.writestr("scene_01.png", create_dummy_image((255, 0, 0)))
        z.writestr("scene_02.png", create_dummy_image((0, 255, 0)))
        z.writestr("__MACOSX/._scene_01.png", b"junk")
        z.writestr(".DS_Store", b"junk")

    extracted = bulk_import_service.extract_zip_files(zip_buf.getvalue())
    assert len(extracted) == 2
    fnames = [x[0] for x in extracted]
    assert "scene_01.png" in fnames
    assert "scene_02.png" in fnames

def test_export_captions_and_prompts_endpoints():
    from app.schemas.project import ProjectCreate
    proj = project_service.create_project(data=ProjectCreate(name="Test Dual Export"), owner_id="test_user_dual")
    proj.scenes = [
        SceneModel(
            id="sc_1",
            start=0.0,
            end=5.5,
            duration=5.5,
            caption="In the quiet mountain village...",
            image_prompt="A tranquil Japanese village nestled in misty mountains at dawn, cinematic lighting"
        ),
        SceneModel(
            id="sc_2",
            start=5.5,
            end=12.0,
            duration=6.5,
            caption="Master Kenji begins his daily meditation.",
            image_prompt="Master Kenji sitting in zazen posture on wooden temple veranda, dramatic side light"
        )
    ]
    project_service._save_to_disk(proj)

    headers = {"Authorization": "Bearer test-token-test_user_dual"}

    # 1. Export Captions SRT
    res_srt = client.get(f"/api/projects/{proj.id}/export/captions?format=srt", headers=headers)
    assert res_srt.status_code == 200
    data_srt = res_srt.json()
    assert data_srt["format"] == "srt"
    assert "00:00:00,000 --> 00:00:05,500" in data_srt["content"]
    assert "In the quiet mountain village..." in data_srt["content"]
    assert "00:00:05,500 --> 00:00:12,000" in data_srt["content"]

    # 2. Export Captions Timed Text
    res_timed = client.get(f"/api/projects/{proj.id}/export/captions?format=timed_txt", headers=headers)
    assert res_timed.status_code == 200
    data_timed = res_timed.json()
    assert "[00:00.0 - 00:05.5]" in data_timed["content"]
    assert 'Scene 1:\n"In the quiet mountain village..."' in data_timed["content"]

    # 3. Export Prompts Midjourney
    proj.canvas_settings.aspect_ratio = "16:9"
    project_service._save_to_disk(proj)
    res_mj = client.get(f"/api/projects/{proj.id}/export/prompts?format=midjourney", headers=headers)
    assert res_mj.status_code == 200
    data_mj = res_mj.json()
    assert "/imagine prompt:" in data_mj["content"]
    assert "--ar 16:9" in data_mj["content"]
    assert "Japanese village" in data_mj["content"]

    # 4. Export Prompts CSV
    res_csv = client.get(f"/api/projects/{proj.id}/export/prompts?format=csv", headers=headers)
    assert res_csv.status_code == 200
    data_csv = res_csv.json()
    assert "Scene,Start Time,End Time" in data_csv["content"]
    assert "Master Kenji" in data_csv["content"]

def test_bulk_import_pro_gating_and_success():
    from app.schemas.project import ProjectCreate
    from app.models.payment import EntitlementRecord
    from datetime import datetime, timezone, timedelta

    # Setup test project
    proj = project_service.create_project(data=ProjectCreate(name="Test Pro Gating"), owner_id="free_creator_1")
    proj.scenes = [
        SceneModel(id="s1", start=0.0, end=4.0, duration=4.0, caption="First scene"),
        SceneModel(id="s2", start=4.0, end=8.0, duration=4.0, caption="Second scene"),
    ]
    project_service._save_to_disk(proj)

    # 1. Free user should be blocked with 403 Forbidden
    free_headers = {"Authorization": "Bearer test-token-free_creator_1"}
    files = [
        ("files", ("scene_01.png", create_dummy_image(), "image/png")),
        ("files", ("scene_02.png", create_dummy_image(), "image/png")),
    ]
    res_blocked = client.post(f"/api/projects/{proj.id}/scenes/bulk-images", headers=free_headers, files=files)
    assert res_blocked.status_code == 403
    assert "PRO_ENTITLEMENT_REQUIRED" in res_blocked.json()["detail"]

    # 2. Grant active entitlement to a pro user
    payment_svc = get_payment_service()
    now_dt = datetime.now(timezone.utc)
    exp_dt = now_dt + timedelta(days=30)
    ent = EntitlementRecord(
        entitlement_id="ent_pro_test_123",
        uid="pro_creator_1",
        plan_id="pro_monthly",
        status="active",
        started_at=now_dt.isoformat(),
        expires_at=exp_dt.isoformat(),
        payment_id="pay_test_123",
        approved_by="admin_test",
        created_at=now_dt.isoformat(),
        updated_at=now_dt.isoformat()
    )
    payment_svc.repository.create_or_update_entitlement(ent)

    proj_pro = project_service.create_project(data=ProjectCreate(name="Test Pro Success"), owner_id="pro_creator_1")
    proj_pro.scenes = [
        SceneModel(id="ps1", start=0.0, end=4.0, duration=4.0, caption="First scene"),
        SceneModel(id="ps2", start=4.0, end=8.0, duration=4.0, caption="Second scene"),
    ]
    project_service._save_to_disk(proj_pro)

    pro_headers = {"Authorization": "Bearer test-token-pro_creator_1"}
    files_pro = [
        ("files", ("scene_01.png", create_dummy_image(), "image/png")),
        ("files", ("scene_02.png", create_dummy_image(), "image/png")),
    ]
    res_ok = client.post(f"/api/projects/{proj_pro.id}/scenes/bulk-images", headers=pro_headers, files=files_pro)
    assert res_ok.status_code == 200
    data = res_ok.json()
    assert data["matched_count"] == 2
    assert len(data["updated_scenes"]) == 2
    assert data["updated_scenes"][0]["image_status"] == "completed"
    assert data["updated_scenes"][0]["image_url"] is not None
