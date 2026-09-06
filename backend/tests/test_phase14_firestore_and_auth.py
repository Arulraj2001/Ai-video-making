import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.project_service import project_service
from app.api.dependencies.auth import check_is_admin, AuthenticatedUser
from app.services.repository.project_repository import (
    FirestoreProjectRepository,
    DualReadProjectRepository,
    FilesystemProjectRepository,
)
from app.models.project import ProjectModel
from app.services.storage.asset_storage import sanitize_filename, default_asset_storage

client = TestClient(app)

def test_admin_recognition():
    """Verify admin email recognition logic."""
    assert check_is_admin("samuelarul2001@gmail.com") is True
    assert check_is_admin("sridharparthasarathy2002@gmail.com") is True
    assert check_is_admin("SAMUELARUL2001@GMAIL.COM") is True
    assert check_is_admin("regular_creator@gmail.com") is False
    assert check_is_admin(None) is False
    assert check_is_admin("random@test.com", claims={"admin": True}) is True

def test_auth_token_verification_and_rejection():
    """Verify Bearer token parsing, test tokens, and rejection of invalid tokens."""
    # 1. Test token bypass for test user A
    headers_a = {"Authorization": "Bearer test-token-creatorA"}
    res_a = client.get("/api/projects", headers=headers_a)
    assert res_a.status_code == 200

    # 2. Rejection of invalid token format
    res_bad = client.get("/api/projects", headers={"Authorization": "InvalidHeaderFormatWithThreeParts Extra Token"})
    assert res_bad.status_code == 401
    assert "Expected 'Bearer <token>'" in res_bad.json()["detail"]

    # 3. Rejection of fake Firebase token when strict auth is checked
    res_fake = client.get("/api/projects", headers={"Authorization": "Bearer not-a-valid-firebase-jwt"})
    assert res_fake.status_code == 401

    # 4. Strict auth enforcement with X-Require-Auth
    res_no_auth = client.get("/api/projects", headers={"X-Require-Auth": "true"})
    assert res_no_auth.status_code == 401
    assert "Missing Authorization header" in res_no_auth.json()["detail"]

def test_strict_user_isolation():
    """
    Core Security Test:
    User A creates Project A.
    User B must NEVER see Project A, read Project A, or modify/delete Project A.
    """
    headers_user_a = {"Authorization": "Bearer test-token-user_alpha"}
    headers_user_b = {"Authorization": "Bearer test-token-user_beta"}

    # 1. User A creates Project A
    res_create = client.post(
        "/api/projects",
        json={"name": "Alpha Top Secret Project", "description": "Classified sci-fi documentary"},
        headers=headers_user_a
    )
    assert res_create.status_code == 201
    proj_a = res_create.json()
    proj_a_id = proj_a["id"]
    assert proj_a["owner_id"] == "user_alpha"

    # 2. User A lists projects -> Project A is visible
    list_a = client.get("/api/projects", headers=headers_user_a).json()
    assert any(p["id"] == proj_a_id for p in list_a)

    # 3. User B lists projects -> Project A is NOT visible
    list_b = client.get("/api/projects", headers=headers_user_b).json()
    assert not any(p["id"] == proj_a_id for p in list_b)

    # 4. User B attempts direct GET access to Project A -> 404 Not Found (zero information leakage)
    get_b = client.get(f"/api/projects/{proj_a_id}", headers=headers_user_b)
    assert get_b.status_code == 404

    # 5. User B attempts to DELETE Project A -> 404 Not Found
    del_b = client.delete(f"/api/projects/{proj_a_id}", headers=headers_user_b)
    assert del_b.status_code == 404

    # 6. Verify Project A is STILL intact for User A
    get_a = client.get(f"/api/projects/{proj_a_id}", headers=headers_user_a)
    assert get_a.status_code == 200
    assert get_a.json()["id"] == proj_a_id

    # 7. User A deletes Project A -> 204 No Content
    del_a = client.delete(f"/api/projects/{proj_a_id}", headers=headers_user_a)
    assert del_a.status_code == 204

    # 8. User A verifies Project A is gone
    assert client.get(f"/api/projects/{proj_a_id}", headers=headers_user_a).status_code == 404

def test_dual_read_and_non_destructive_claim():
    """Verify that unassigned legacy projects are non-destructively claimed by an authenticated creator."""
    fs_repo = FilesystemProjectRepository()
    dual_repo = DualReadProjectRepository(fs_repo=fs_repo)

    # Create an unassigned legacy project
    legacy_project = ProjectModel(
        name="Legacy Disk Project",
        description="Created before Phase 14 auth",
        owner_id=None
    )
    saved_legacy = fs_repo.save_project(legacy_project)
    legacy_id = saved_legacy.id

    # Creator claims the project
    claimed = dual_repo.get_project(legacy_id, owner_id="creator_gamma")
    assert claimed is not None
    assert claimed.owner_id == "creator_gamma"

    # Disk file is still intact (non-destructive)
    disk_file = fs_repo._get_project_file(legacy_id)
    assert disk_file.exists()

    # Another user cannot claim or access this now-owned project
    other_user_read = dual_repo.get_project(legacy_id, owner_id="creator_delta")
    assert other_user_read is None

    # Cleanup
    dual_repo.delete_project(legacy_id, owner_id="creator_gamma")

def test_asset_storage_sanitization():
    """Verify that filename sanitization prevents path traversal and malicious characters."""
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("..\\..\\boot.ini") == "boot.ini"
    assert sanitize_filename("cool image!.png") == "cool_image_.png"
    assert sanitize_filename("normal_file.mp3") == "normal_file.mp3"

def test_live_cloud_firestore_roundtrip():
    """
    Live Integration Test against Google Cloud Firestore project scenora-46cfe.
    Tests users/{uid}/projects/{projectId} CRUD directly with the service account.
    """
    repo = FirestoreProjectRepository()
    if not repo.db:
        pytest.skip("Cloud Firestore client not available in current environment")

    test_uid = "test_phase14_creator"
    test_project = ProjectModel(
        name="Live Cloud Firestore Verification Project",
        description="Testing live Firebase Admin SDK connection",
        owner_id=test_uid
    )

    try:
        # 1. Save to Cloud Firestore
        saved = repo.save_project(test_project, owner_id=test_uid)
        assert saved.id == test_project.id

        # 2. Retrieve from Cloud Firestore
        fetched = repo.get_project(test_project.id, owner_id=test_uid)
        assert fetched is not None
        assert fetched.id == test_project.id
        assert fetched.name == "Live Cloud Firestore Verification Project"
        assert fetched.owner_id == test_uid

        # 3. List projects for user
        user_projects = repo.list_projects(owner_id=test_uid)
        assert any(p.id == test_project.id for p in user_projects)

        # 4. User isolation check in Firestore: another user receives None
        other_user_fetch = repo.get_project(test_project.id, owner_id="another_user")
        assert other_user_fetch is None
    finally:
        # 5. Clean up from Cloud Firestore
        repo.delete_project(test_project.id, owner_id=test_uid)
        cleaned = repo.get_project(test_project.id, owner_id=test_uid)
        assert cleaned is None
