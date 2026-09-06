import os
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Union
from fastapi import APIRouter, Query

from app.schemas.health import HealthResponse, HealthDiagnosticsResponse
from app.configuration.config import settings
from app.services.render_service import get_ffmpeg_executable
from app.services.project_service import STORAGE_DIR

router = APIRouter(tags=["health"])

def check_diagnostics() -> dict:
    # 1. FFmpeg verification
    ffmpeg_exe = get_ffmpeg_executable()
    ffmpeg_ok = False
    try:
        if os.path.isfile(ffmpeg_exe) or shutil.which(ffmpeg_exe):
            ffmpeg_ok = True
    except Exception:
        ffmpeg_ok = False

    # 2. Storage write verification
    storage_ok = False
    try:
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        test_file = STORAGE_DIR / ".healthcheck_write_test"
        test_file.write_text("ok")
        test_file.unlink(missing_ok=True)
        storage_ok = True
    except Exception:
        storage_ok = False

    is_prod = (
        getattr(settings, "ENVIRONMENT", "development").lower() == "production"
        or os.getenv("SCENORA_ENV", "").lower() == "production"
    )

    return {
        "status": "ok" if (storage_ok and ffmpeg_ok) else "degraded",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "ffmpeg_available": ffmpeg_ok,
        "ffmpeg_path": "[CONFIGURED]" if (ffmpeg_ok and is_prod) else (ffmpeg_exe if ffmpeg_ok else None),
        "storage_writable": storage_ok,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/health", response_model=Union[HealthDiagnosticsResponse, HealthResponse])
def get_health(detailed: bool = Query(False, description="Include detailed system diagnostics")):
    """
    Health check endpoint returning application operational status.
    Default returns: {"status": "ok"}
    With detailed=true returns system diagnostics.
    """
    if detailed:
        return check_diagnostics()
    return {"status": "ok"}

@router.get("/health/diagnostics", response_model=HealthDiagnosticsResponse)
def get_health_diagnostics():
    """Returns comprehensive system diagnostics for production monitoring."""
    return check_diagnostics()
