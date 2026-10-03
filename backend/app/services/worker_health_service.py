"""Shared render-worker heartbeat and queue diagnostics."""

import threading
from datetime import datetime, timezone
from typing import Any, Optional

from app.configuration.firebase import get_firestore_client


class WorkerHealthService:
    def __init__(self):
        self._lock = threading.Lock()
        self._heartbeats: dict[str, dict[str, Any]] = {}

    def heartbeat(
        self,
        worker_id: str,
        status: str = "idle",
        current_job_id: Optional[str] = None,
    ) -> None:
        payload = {
            "worker_id": worker_id,
            "status": status,
            "current_job_id": current_job_id,
            "last_seen_at": datetime.now(timezone.utc).isoformat(),
        }
        with self._lock:
            self._heartbeats[worker_id] = payload

        db = get_firestore_client()
        if db:
            try:
                db.collection("render_workers").document(worker_id).set(payload)
            except Exception:
                # Heartbeats must never stop a render worker.
                pass

    def diagnostics(self, stale_after_seconds: int = 90) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        workers: list[dict[str, Any]] = []
        db = None
        with self._lock:
            local_workers = list(self._heartbeats.values())
        if local_workers:
            workers = local_workers
        else:
            db = get_firestore_client()
            try:
                if db:
                    workers = [doc.to_dict() or {} for doc in db.collection("render_workers").stream()]
            except Exception:
                workers = []

        active_workers = 0
        for worker in workers:
            seen = _parse_timestamp(worker.get("last_seen_at"))
            worker["healthy"] = bool(seen and (now - seen).total_seconds() <= stale_after_seconds)
            if worker["healthy"]:
                active_workers += 1

        queued_jobs = None
        processing_jobs = None
        if db:
            try:
                queued_jobs = sum(1 for _ in db.collection("render_jobs").where("status", "==", "queued").stream())
                processing_jobs = sum(1 for _ in db.collection("render_jobs").where("status", "==", "processing").stream())
            except Exception:
                pass

        return {
            "workers": workers,
            "worker_count": len(workers),
            "active_worker_count": active_workers,
            "queued_jobs": queued_jobs,
            "processing_jobs": processing_jobs,
            "timestamp": now.isoformat(),
        }


def _parse_timestamp(value: Any) -> Optional[datetime]:
    if not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


worker_health_service = WorkerHealthService()
