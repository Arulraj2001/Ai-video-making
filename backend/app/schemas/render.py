from pydantic import BaseModel, Field
from typing import Optional, List

class RenderRequest(BaseModel):
    resolution: str = Field(default="1080x1920", description="Target video resolution (1080x1920, 1920x1080, 1080x1080)")
    aspect_ratio: Optional[str] = Field(default=None, description="Optional aspect ratio override (9:16, 16:9, 1:1)")
    motion_preset: str = Field(default="none", description="Motion effect for scenes: 'none' (static) or 'ken_burns' (subtle zoom/pan)")


class RenderJobResponse(BaseModel):
    id: str
    project_id: str
    status: str  # "queued", "processing", "completed", "failed"
    stage: str   # "Preparing...", "Generating timeline...", "Rendering...", "Finalizing..."
    progress: int  # 0 to 100
    resolution: str
    aspect_ratio: str
    output_url: Optional[str] = None
    output_filename: Optional[str] = None
    file_size: Optional[int] = None
    duration: Optional[float] = None
    error: Optional[str] = None
    created_at: str
    updated_at: str

class RenderJobListResponse(BaseModel):
    jobs: List[RenderJobResponse]
