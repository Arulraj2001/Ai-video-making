from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_project_lifecycle():
    # 1. Initially projects list is empty (tests empty state)
    list_res = client.get("/api/projects")
    assert list_res.status_code == 200
    initial_count = len(list_res.json())

    # 2. Create project
    create_res = client.post(
        "/api/projects",
        json={"name": "New Sci-Fi Video", "description": "Space documentary demo"}
    )
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["name"] == "New Sci-Fi Video"
    project_id = created["id"]

    # 3. Retrieve single project
    get_res = client.get(f"/api/projects/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == project_id

    # 4. Delete project
    del_res = client.delete(f"/api/projects/{project_id}")
    assert del_res.status_code == 204

    # 5. Verify 404 on deleted project
    get_del_res = client.get(f"/api/projects/{project_id}")
    assert get_del_res.status_code == 404


def test_project_creation_persists_canvas_settings():
    create_res = client.post(
        "/api/projects",
        json={
            "name": "Vertical Demo",
            "canvas_settings": {
                "aspect_ratio": "9:16",
                "resolution": "1080x1920",
            },
        },
    )
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["canvas_settings"]["aspect_ratio"] == "9:16"
    assert created["canvas_settings"]["resolution"] == "1080x1920"

    project_id = created["id"]
    get_res = client.get(f"/api/projects/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["canvas_settings"]["aspect_ratio"] == "9:16"

    delete_res = client.delete(f"/api/projects/{project_id}")
    assert delete_res.status_code == 204
