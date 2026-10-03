from datetime import datetime, timedelta, timezone

import pytest

from app.models.render import RenderJobModel
from app.services.render_service import render_service


def test_active_render_jobs_cannot_be_deleted():
    job = RenderJobModel(project_id="project", status="processing")
    render_service._jobs[job.id] = job

    with pytest.raises(ValueError, match="Active render jobs"):
        render_service.delete_job(job.id)

    render_service._jobs.pop(job.id, None)


def test_cleanup_only_removes_expired_completed_jobs(monkeypatch):
    completed = RenderJobModel(
        project_id="project",
        status="completed",
        created_at=(datetime.now(timezone.utc) - timedelta(hours=48)).isoformat(),
    )
    queued = RenderJobModel(
        project_id="project",
        status="queued",
        created_at=(datetime.now(timezone.utc) - timedelta(hours=48)).isoformat(),
    )
    render_service._jobs[completed.id] = completed
    render_service._jobs[queued.id] = queued
    monkeypatch.setattr(render_service, "delete_job", lambda job_id: render_service._jobs.pop(job_id, None) is not None)

    removed = render_service.cleanup_expired_renders()

    assert removed >= 1
    assert completed.id not in render_service._jobs
    assert queued.id in render_service._jobs
    render_service._jobs.pop(queued.id, None)
