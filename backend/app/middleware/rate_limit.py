"""Small bounded per-instance rate limiter for expensive API operations."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.configuration.config import settings
from app.services.rate_limit_service import RateLimitService


class SlidingWindowLimiter(RateLimitService):
    """Backward-compatible local limiter used by tests and local callers."""

    def __init__(self, limit: int, window_seconds: int):
        super().__init__(limit, window_seconds, backend="memory")


class ExpensiveOperationRateLimitMiddleware(BaseHTTPMiddleware):
    """Protects generation/render endpoints from accidental or abusive bursts."""

    def __init__(self, app):
        super().__init__(app)
        self.limiter = RateLimitService(
            getattr(settings, "EXPENSIVE_REQUESTS_PER_MINUTE", 20),
            60,
        )

    async def dispatch(self, request: Request, call_next):
        if (
            getattr(settings, "ENVIRONMENT", "development").lower() == "production"
            and request.method in {"POST", "PUT", "PATCH"}
            and self._is_expensive(request.url.path)
        ):
            import hashlib
            user = request.headers.get("authorization") or ""
            client = request.client.host if request.client else "unknown"
            key = hashlib.sha256(f"{client}:{user}".encode("utf-8")).hexdigest()
            allowed, retry_after = self.limiter.allow(key)
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": {
                            "code": "RATE_LIMITED",
                            "message": "Too many expensive requests. Please retry shortly.",
                            "retry_after_seconds": retry_after,
                        }
                    },
                    headers={"Retry-After": str(retry_after)},
                )
        return await call_next(request)

    @staticmethod
    def _is_expensive(path: str) -> bool:
        return (
            "/render" in path
            or "/generate-image" in path
            or "/generate-all-images" in path
            or "/retry-failed" in path
            or "/variations" in path
            or path.endswith("/storyboard/generate")
            or "/storyboard/scenes/" in path and path.endswith("/regenerate")
        )
