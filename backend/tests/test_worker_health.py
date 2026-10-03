from datetime import datetime, timedelta, timezone

from app.services.worker_health_service import WorkerHealthService


def test_worker_heartbeat_reports_healthy_worker():
    service = WorkerHealthService()
    service.heartbeat("worker-a", status="processing", current_job_id="render-1")

    diagnostics = service.diagnostics()

    assert diagnostics["worker_count"] == 1
    assert diagnostics["active_worker_count"] == 1
    assert diagnostics["workers"][0]["current_job_id"] == "render-1"


def test_stale_worker_is_not_active():
    service = WorkerHealthService()
    service._heartbeats["worker-a"] = {
        "worker_id": "worker-a",
        "status": "idle",
        "last_seen_at": (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat(),
    }

    diagnostics = service.diagnostics(stale_after_seconds=90)

    assert diagnostics["active_worker_count"] == 0
    assert diagnostics["workers"][0]["healthy"] is False
