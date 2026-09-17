import asyncio
import os
from pathlib import Path
import subprocess
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse

from app.schemas.render import RenderRequest, RenderJobResponse, RenderJobListResponse
from app.services.render_service import render_service, RESOLUTIONS, get_ffmpeg_executable
from app.services.project_service import STORAGE_DIR, project_service
from app.api.dependencies.auth import get_current_user, AuthenticatedUser
from app.configuration.config import settings

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
def create_render_job(
    project_id: str,
    req: RenderRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Initiates a background render job for the specified project."""
    if not project_service.get_project(project_id, owner_id=current_user.uid):
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    try:
        job = render_service.create_render_job(
            project_id=project_id,
            resolution=req.resolution,
            aspect_ratio_override=req.aspect_ratio,
            motion_preset=req.motion_preset,
            owner_id=current_user.uid,
        )
        return _to_response(job, project_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create render job: {e}")



@router.get(
    "/{project_id}/render/{job_id}",
    response_model=RenderJobResponse,
    summary="Poll status of a render job",
)
def get_render_status(
    project_id: str,
    job_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Returns the current progress, status, and stage of a render job."""
    if not project_service.get_project(project_id, owner_id=current_user.uid):
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    job = render_service.get_job(job_id)
    if not job or job.project_id != project_id:
        raise HTTPException(status_code=404, detail=f"Render job '{job_id}' not found.")
    return _to_response(job, project_id)


@router.get(
    "/{project_id}/render/{job_id}/download",
    summary="Download rendered video in requested format & quality",
)
async def download_rendered_video(
    project_id: str,
    job_id: str,
    format: str = Query("mp4", description="Output format: mp4, 720p, mp3, webm, gif"),
    disposition: str = Query("attachment", description="Content disposition: attachment or inline"),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Downloads the completed video or transcoded audio/video in requested format."""
    job = render_service.get_job(job_id)
    if not job or job.project_id != project_id:
        raise HTTPException(status_code=404, detail=f"Render job '{job_id}' not found.")

    project = None
    if current_user and current_user.uid and current_user.uid != getattr(settings, "DEFAULT_LEGACY_UID", "legacy-local-user"):
        project = project_service.get_project(project_id, owner_id=current_user.uid)
    if not project and getattr(job, "owner_id", None):
        project = project_service.get_project(project_id, owner_id=job.owner_id)
    if not project:
        project = project_service.get_project(project_id, owner_id=None)

    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    # Ownership check:
    # If caller is an authenticated user (not the local fallback user), verify ownership or admin.
    # If caller is unauthenticated/fallback (browser <a download> or <video src>), possession of
    # project_id + valid unguessable completed job_id acts as a capability token.
    default_uid = getattr(settings, "DEFAULT_LEGACY_UID", "legacy-local-user")
    is_fallback_user = (current_user.uid == default_uid) and current_user.claims.get("local_fallback", False)

    if not is_fallback_user:
        if project.owner_id and current_user.uid != project.owner_id and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this project's renders."
            )

    if job.status != "completed" or not job.output_path:
        raise HTTPException(
            status_code=400,
            detail=f"Render job is in '{job.status}' state and not ready for download.",
        )

    master_path = STORAGE_DIR / job.output_path
    if not master_path.exists():
        raise HTTPException(status_code=404, detail="Rendered video file not found on disk.")

    disp_type = "inline" if disposition == "inline" else "attachment"
    base_name = Path(job.output_filename or f"{project_id}_{job.resolution}").stem
    ffmpeg_exe = get_ffmpeg_executable()
    loop = asyncio.get_running_loop()
    transcode_threads = str(min(8, max(2, os.cpu_count() or 2)))

    if format == "mp3":
        # Extract audio-only master mix
        mp3_path = master_path.parent / f"{job_id}.mp3"
        if not mp3_path.exists() or mp3_path.stat().st_size == 0:
            cmd = [
                ffmpeg_exe, "-y",
                "-threads", transcode_threads,
                "-i", str(master_path),
                "-vn",
                "-c:a", "libmp3lame",
                "-q:a", "2",
                str(mp3_path)
            ]
            res = await loop.run_in_executor(None, lambda: subprocess.run(cmd, capture_output=True))
            if res.returncode != 0:
                raise HTTPException(status_code=500, detail="Failed to extract audio MP3.")
        return FileResponse(
            path=mp3_path,
            media_type="audio/mpeg",
            filename=f"{base_name}.mp3",
            content_disposition_type=disp_type,
        )

    elif format == "720p":
        # 720p compressed mobile/share version
        p720_path = master_path.parent / f"{job_id}_720p.mp4"
        if not p720_path.exists() or p720_path.stat().st_size == 0:
            cmd = [
                ffmpeg_exe, "-y",
                "-threads", transcode_threads,
                "-i", str(master_path),
                "-vf", "scale=-2:720",
                "-c:v", "libx264",
                "-crf", "23",
                "-preset", "ultrafast",
                "-c:a", "copy",
                str(p720_path)
            ]
            res = await loop.run_in_executor(None, lambda: subprocess.run(cmd, capture_output=True))
            if res.returncode != 0:
                p720_path = master_path
        return FileResponse(
            path=p720_path,
            media_type="video/mp4",
            filename=f"{base_name}_720p.mp4",
            content_disposition_type=disp_type,
        )

    elif format == "webm":
        # WebM open format
        webm_path = master_path.parent / f"{job_id}.webm"
        if not webm_path.exists() or webm_path.stat().st_size == 0:
            cmd = [
                ffmpeg_exe, "-y",
                "-threads", transcode_threads,
                "-i", str(master_path),
                "-c:v", "libvpx-vp9",
                "-crf", "32",
                "-b:v", "0",
                "-c:a", "libopus",
                str(webm_path)
            ]
            res = await loop.run_in_executor(None, lambda: subprocess.run(cmd, capture_output=True))
            if res.returncode != 0:
                raise HTTPException(status_code=500, detail="Failed to transcode WebM video.")
        return FileResponse(
            path=webm_path,
            media_type="video/webm",
            filename=f"{base_name}.webm",
            content_disposition_type=disp_type,
        )

    elif format == "gif":
        # Animated preview GIF (first 6 seconds)
        gif_path = master_path.parent / f"{job_id}_preview.gif"
        if not gif_path.exists() or gif_path.stat().st_size == 0:
            cmd = [
                ffmpeg_exe, "-y",
                "-threads", transcode_threads,
                "-i", str(master_path),
                "-t", "6",
                "-vf", "fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
                str(gif_path)
            ]
            res = await loop.run_in_executor(None, lambda: subprocess.run(cmd, capture_output=True))
            if res.returncode != 0:
                raise HTTPException(status_code=500, detail="Failed to generate animated preview GIF.")
        return FileResponse(
            path=gif_path,
            media_type="image/gif",
            filename=f"{base_name}_preview.gif",
            content_disposition_type=disp_type,
        )

    else:
        # Default: Full quality master MP4
        return FileResponse(
            path=master_path,
            media_type="video/mp4",
            filename=job.output_filename or f"{base_name}.mp4",
            content_disposition_type=disp_type,
        )


@router.delete(
    "/{project_id}/render/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a render job and its output files",
)
def delete_render_job(
    project_id: str,
    job_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Deletes a render job and cleans up its media files from storage."""
    if not project_service.get_project(project_id, owner_id=current_user.uid):
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    job = render_service.get_job(job_id)
    if not job or job.project_id != project_id:
        raise HTTPException(status_code=404, detail=f"Render job '{job_id}' not found.")

    render_service.delete_job(job_id)
    return None


@router.get(
    "/{project_id}/renders",
    response_model=RenderJobListResponse,
    summary="List all render jobs for a project",
)
def list_project_renders(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Returns all render jobs initiated for the given project."""
    if not project_service.get_project(project_id, owner_id=current_user.uid):
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
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
def retry_render_job(
    project_id: str,
    job_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Retries a previously failed render job using identical configuration."""
    if not project_service.get_project(project_id, owner_id=current_user.uid):
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    job = render_service.get_job(job_id)
    if not job or job.project_id != project_id:
        raise HTTPException(status_code=404, detail=f"Render job '{job_id}' not found.")

    try:
        new_job = render_service.retry_render_job(job_id, owner_id=current_user.uid)
        return _to_response(new_job, project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retry render: {e}")
