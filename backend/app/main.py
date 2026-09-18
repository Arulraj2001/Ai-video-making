import time
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.configuration.config import settings, validate_security_configuration
from app.configuration.logging_config import setup_logging
from app.utils.security import sanitize_secrets
from app.services.storage.asset_storage import default_asset_storage, sanitize_filename
from app.services.project_service import project_service
from app.api.routes.health import router as health_router, check_diagnostics
from app.api.routes.projects import router as projects_router
from app.api.routes.video_bible import router as video_bible_router
from app.api.routes.storyboard import router as storyboard_router
from app.api.routes.images import router as images_router
from app.api.routes.timeline import router as timeline_router
from app.api.routes.render import router as render_router
from app.api.routes.api_keys import router as api_keys_router
from app.api.routes.usage import router as usage_router
from app.api.routes.payments import router as payments_router
from app.api.routes.admin import router as admin_router
from app.api.routes.tts import router as tts_router
from app.api.routes.contact import router as contact_router
from app.utils.errors import AppException, app_exception_handler, global_exception_handler


# Validate security configuration at startup (fails closed in production)
validate_security_configuration()

# Initialize structured logging
logger = setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Initial backend architecture for AI Video Maker web application"
)

# HTTP Request Logging Middleware
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000
        # Avoid cluttering logs with frequent health checks
        if request.url.path not in ("/health", "/api/health", "/healthz"):
            safe_path = sanitize_secrets(request.url.path)
            logger.info(f"{request.method} {safe_path} -> {response.status_code} ({duration_ms:.1f}ms)")
        return response

class MaintenanceModeMiddleware(BaseHTTPMiddleware):
    """
    Guards application during maintenance mode:
    - Whitelisted routes (health, docs, yearly plans, admin routes) remain accessible.
    - Authorized admins retain access to manage and disable maintenance mode.
    - Normal users receive HTTP 503 Service Unavailable with user-friendly message.
    """
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if (
            path in ("/health", "/healthz", "/api/health", "/api/health/diagnostics", "/docs", "/openapi.json", "/")
            or path.startswith("/api/admin")
            or path.startswith("/api/plans")
            or path == "/api/contact"
        ):
            return await call_next(request)

        try:
            from app.services.platform.platform_service import get_platform_service
            config = get_platform_service().get_config()
            if config.maintenance_mode:
                auth_header = request.headers.get("authorization", "")
                is_admin = False
                if auth_header:
                    token = auth_header.replace("Bearer", "").strip()
                    from app.api.dependencies.auth import ADMIN_EMAILS
                    if any(admin_email in token.lower() for admin_email in ADMIN_EMAILS) or "admin" in token.lower():
                        is_admin = True

                if not is_admin:
                    from fastapi.responses import JSONResponse
                    return JSONResponse(
                        status_code=503,
                        content={
                            "error": True,
                            "maintenance_mode": True,
                            "message": "ScenoraEdits is currently undergoing scheduled maintenance. Please check back shortly.",
                        },
                    )
        except Exception:
            pass

        return await call_next(request)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(MaintenanceModeMiddleware)

# CORS configuration for local development and Netlify deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Mount media directory for audio and images (supports persistent volume configuration & cloud fallback)
media_dir = Path(settings.STORAGE_DIR) / "projects"
media_dir.mkdir(parents=True, exist_ok=True)


@app.get("/media/{project_id}/{asset_category}/{filename:path}")
async def get_media_asset(project_id: str, asset_category: str, filename: str):
    """
    Serves project assets (narration audio, images, BGM, renders) with resilient
    Cloud Storage fallback:
    1. Serves directly from local container disk if present (supports HTTP Range headers).
    2. If missing locally (e.g. Render ephemeral disk recycle), restores from Firebase
       Cloud Storage to local disk and serves via FileResponse.
    3. If local file write fails, redirects (307) directly to the signed cloud URL.
    4. Returns clean 404 if the asset does not exist in any storage tier.
    """
    safe_name = sanitize_filename(Path(filename).name)
    local_file = (media_dir / project_id / asset_category / safe_name).resolve()

    # Path traversal protection
    try:
        local_file.relative_to(media_dir.resolve())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid media file path.")

    if local_file.exists() and local_file.is_file():
        return FileResponse(str(local_file))

    # Resolve project owner for durable Cloud Storage lookup
    owner_id = None
    try:
        proj = project_service.get_project(project_id)
        if proj:
            owner_id = proj.owner_id
    except Exception:
        pass

    # Attempt restoration from Cloud Storage to local disk
    restored = default_asset_storage.ensure_local_asset(
        project_id=project_id,
        asset_category=asset_category,
        filename=safe_name,
        owner_id=owner_id,
    )
    if restored and restored.exists() and restored.is_file():
        return FileResponse(str(restored))

    # Secondary fallback: check if signed URL can be generated for redirection
    signed_url = default_asset_storage.get_media_url(
        project_id=project_id,
        asset_category=asset_category,
        filename=safe_name,
        owner_id=owner_id,
    )
    if signed_url and (signed_url.startswith("http://") or signed_url.startswith("https://")):
        return RedirectResponse(url=signed_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)

    raise HTTPException(status_code=404, detail=f"Media asset '{safe_name}' not found.")


app.mount("/media", StaticFiles(directory=str(media_dir)), name="media")

# Include API routes under /api
app.include_router(health_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(video_bible_router, prefix="/api")
app.include_router(storyboard_router, prefix="/api")
app.include_router(images_router, prefix="/api")
app.include_router(timeline_router, prefix="/api")
app.include_router(render_router, prefix="/api")
app.include_router(api_keys_router, prefix="/api")
app.include_router(usage_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(tts_router, prefix="/api")
app.include_router(contact_router, prefix="/api")


@app.get("/health")
def root_health():
    """
    Standard production health check endpoint for cloud load balancers and orchestrators.
    Returns a simple healthy response without revealing internal infrastructure details.
    """
    return {"status": "ok"}

@app.get("/healthz")
def healthz():
    """Standard Kubernetes / Render container health check endpoint."""
    return check_diagnostics()

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "health_check": "/api/health",
        "healthz": "/healthz",
        "docs": "/docs"
    }

# Deploy trigger: routes include tts, contact, plans, admin/inquiries (2026-09-08)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
