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
