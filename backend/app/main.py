import time
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.configuration.config import settings
from app.configuration.logging_config import setup_logging
from app.api.routes.health import router as health_router, check_diagnostics
from app.api.routes.projects import router as projects_router
from app.api.routes.video_bible import router as video_bible_router
from app.api.routes.storyboard import router as storyboard_router
from app.api.routes.images import router as images_router
from app.api.routes.timeline import router as timeline_router
from app.api.routes.render import router as render_router
from app.utils.errors import AppException, app_exception_handler, global_exception_handler

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
        if request.url.path not in ("/api/health", "/healthz"):
            logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms:.1f}ms)")
        return response

app.add_middleware(RequestLoggingMiddleware)

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

# Mount media directory for audio and images (supports persistent volume configuration)
media_dir = Path(settings.STORAGE_DIR) / "projects"
media_dir.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_dir)), name="media")

# Include API routes under /api
app.include_router(health_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(video_bible_router, prefix="/api")
app.include_router(storyboard_router, prefix="/api")
app.include_router(images_router, prefix="/api")
app.include_router(timeline_router, prefix="/api")
app.include_router(render_router, prefix="/api")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
