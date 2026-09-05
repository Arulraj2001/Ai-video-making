from typing import Optional
from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str = "ok"

class HealthDiagnosticsResponse(BaseModel):
    status: str = "ok"
    version: str
    environment: str
    ffmpeg_available: bool
    ffmpeg_path: Optional[str] = None
    storage_writable: bool
    timestamp: str
