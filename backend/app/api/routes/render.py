from pathlib import Path
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from app.schemas.render import RenderRequest, RenderJobResponse, RenderJobListResponse
from app.services.render_service import render_service, RESOLUTIONS
from app.services.project_service import STORAGE_DIR

router = APIRouter(prefix="/projects", tags=["render"])


def _to_response(job, project_id: str) -> RenderJobResponse:
    download_url = (
        f"/api/projects/{project_id}/render/{job.id}/download"
        if job.status == "completed" and job.output_path
        else None
    )
    return RenderJobResponse(
        id=job.id,
        project_id=job.project_id,
        status=job.status,
        stage=job.stage,
        progress=job.progress,
        resolution=job.resolution,
        aspect_ratio=job.aspect_ratio,
        output_url=download_url,
        output_filename=job.output_filename,
        file_size=job.file_size,
        duration=job.duration,
        error=job.error,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


@router.post(
    "/{project_id}/render",
    response_model=RenderJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Enqueue a video render job",
)
def enqueue_render(project_id: str, request: RenderRequest):
    """Starts an asynchronous video rendering process for the project."""
    try:
        job = render_service.create_render_job(
            project_id=project_id,
            resolution=request.resolution,
            aspect_ratio_override=request.aspect_ratio,
        )
        return _to_response(job, project_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start render: {e}")


@router.get(
    "/{project_id}/render/{job_id}",
    response_model=RenderJobResponse,
    summary="Get render job status",
)
def get_render_job_status(project_id: str, job_id: str):
    """Retrieves the status, stage, and progress of a render job."""
    job = render_service.get_job(job_id)
    if not job or job.project_id != project_id:
        raise HTTPException(status_code=404, detail=f"Render job '{job_id}' not found.")
    return _to_response(job, project_id)


@router.get(
    "/{project_id}/render/{job_id}/download",
    summary="Download rendered MP4 video",
)
def download_rendered_video(project_id: str, job_id: str):
    """Downloads the completed MP4 video file."""
    job = render_service.get_job(job_id)
    if not job or job.project_id != project_id:
        raise HTTPException(status_code=404, detail=f"Render job '{job_id}' not found.")

    if job.status != "completed" or not job.output_path:
        raise HTTPException(
            status_code=400,
            detail=f"Render job is in '{job.status}' state and not ready for download.",
        )

    file_path = STORAGE_DIR / job.output_path
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Rendered video file not found on disk.")

    filename = job.output_filename or f"{project_id}_{job.resolution}.mp4"
    return FileResponse(
        path=file_path,
        media_type="video/mp4",
        filename=filename,
    )


@router.get(
    "/{project_id}/renders",
    response_model=RenderJobListResponse,
    summary="List all render jobs for a project",
)
def list_project_renders(project_id: str):
    """Returns all render jobs initiated for the given project."""
    jobs = render_service.list_jobs_for_project(project_id)
    return RenderJobListResponse(
        jobs=[_to_response(j, project_id) for j in jobs]
    )


@router.post(
    "/{project_id}/render/{job_id}/retry",
    response_model=RenderJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Retry a failed render job",
)
def retry_render_job(project_id: str, job_id: str):
    """Retries a previously failed render job using identical configuration."""
    job = render_service.get_job(job_id)
    if not job or job.project_id != project_id:
        raise HTTPException(status_code=404, detail=f"Render job '{job_id}' not found.")

    try:
        new_job = render_service.retry_render_job(job_id)
        return _to_response(new_job, project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retry render: {e}")
