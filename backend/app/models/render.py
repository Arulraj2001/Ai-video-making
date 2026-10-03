from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, List
import uuid

@dataclass
class RenderJobModel:
    id: str = field(default_factory=lambda: f"render_{uuid.uuid4().hex[:10]}")
    project_id: str = ""
    status: str = "queued"  # "queued", "processing", "completed", "failed"
    stage: str = "Preparing..."  # "Preparing...", "Generating timeline...", "Rendering...", "Finalizing..."
    progress: int = 0  # 0 to 100
    resolution: str = "1080x1920"  # "1080x1920", "1920x1080", "1080x1080"
    aspect_ratio: str = "9:16"  # "9:16", "16:9", "1:1"
    motion_preset: str = "none"  # "none" or "ken_burns"
    owner_id: Optional[str] = None
    output_path: Optional[str] = None
    durable_storage_path: Optional[str] = None
    lease_owner: Optional[str] = None
    lease_expires_at: Optional[str] = None
    attempts: int = 0
    output_filename: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[float] = None
    manifest_version: int = 1
    render_manifest: Optional[dict] = None
    output_sha256: Optional[str] = None
    output_probe: Optional[dict] = None
    queue_wait_seconds: Optional[float] = None
    render_duration_seconds: Optional[float] = None
    upload_duration_seconds: Optional[float] = None
    scene_count: Optional[int] = None
    output_size_bytes: Optional[int] = None
    failure_code: Optional[str] = None
    error: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
