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
    output_path: Optional[str] = None
    output_filename: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[float] = None
    error: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
