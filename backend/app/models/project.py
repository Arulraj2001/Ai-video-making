from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, List
import uuid
from app.models.scene import SceneModel
from app.models.video_bible import VideoBibleModel

@dataclass
class AudioFileModel:
    filename: str
    storage_path: str
    file_size: int
    content_type: str

@dataclass
class CaptionSettingsModel:
    enabled: bool = True
    font_family: str = "Inter"
    font_size: int = 42
    position: str = "bottom"  # "bottom", "center", "top"
    alignment: str = "center"  # "left", "center", "right"
    background: str = "semi-transparent"  # "none", "semi-transparent", "solid"
    outline_shadow: str = "subtle"  # "none", "subtle", "strong"
    safe_area: bool = True
    color: str = "#FFFFFF"

@dataclass
class AudioSettingsModel:
    narration_volume: float = 1.0
    narration_muted: bool = False
    music_file: Optional[AudioFileModel] = None
    music_volume: float = 0.25
    music_fade_in: float = 1.0
    music_fade_out: float = 2.0
    music_muted: bool = False
    ducking_enabled: bool = True

@dataclass
class CanvasSettingsModel:
    aspect_ratio: str = "9:16"  # "9:16", "16:9", "1:1"
    resolution: str = "1080x1920"  # "1080x1920", "1920x1080", "1080x1080"
    fps: int = 30
    motion_preset: str = "none"  # "none", "ken_burns"

@dataclass
class ProjectModel:
    id: str = field(default_factory=lambda: f"proj_{uuid.uuid4().hex[:8]}")
    name: str = ""
    description: Optional[str] = ""
    audio_file: Optional[AudioFileModel] = None
    raw_captions: Optional[str] = ""
    scenes: List[SceneModel] = field(default_factory=list)
    video_bible: VideoBibleModel = field(default_factory=VideoBibleModel)
    # Phase 8: Practical pre-export editing settings
    caption_settings: CaptionSettingsModel = field(default_factory=CaptionSettingsModel)
    audio_settings: AudioSettingsModel = field(default_factory=AudioSettingsModel)
    canvas_settings: CanvasSettingsModel = field(default_factory=CanvasSettingsModel)
    owner_id: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
