"""Dedicated Firestore-backed render worker for production deployments."""

import asyncio
import logging
import os
import socket

from app.services.render_service import render_service
from app.services.worker_health_service import worker_health_service

logger = logging.getLogger("scenora.render_worker")


async def run_worker() -> None:
    worker_id = os.getenv("RENDER_WORKER_ID") or f"{socket.gethostname()}-{os.getpid()}"
    poll_seconds = max(1, int(os.getenv("RENDER_WORKER_POLL_SECONDS", "5")))
    lease_seconds = max(60, int(os.getenv("RENDER_WORKER_LEASE_SECONDS", "3600")))
    logger.info("Render worker %s started", worker_id)

    while True:
        try:
            worker_health_service.heartbeat(worker_id, status="polling")
            job = render_service.claim_next_queued_job(worker_id, lease_seconds=lease_seconds)
        except Exception:
            logger.exception("Render worker could not poll the queue")
            await asyncio.sleep(poll_seconds)
            continue
        if job is None:
            await asyncio.sleep(poll_seconds)
            continue
        logger.info("Render worker %s claimed job %s", worker_id, job.id)
        try:
            worker_health_service.heartbeat(worker_id, status="processing", current_job_id=job.id)
            await render_service._run_render_worker(job.id)
        except Exception:
            logger.exception("Render worker failed while processing job %s", job.id)
        finally:
            worker_health_service.heartbeat(worker_id, status="idle")


if __name__ == "__main__":
    asyncio.run(run_worker())
