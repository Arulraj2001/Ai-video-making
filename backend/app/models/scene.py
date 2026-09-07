from dataclasses import dataclass
from typing import Optional

@dataclass
class SceneModel:
    id: str
    start: float
    end: float
    duration: float
    caption: str
    visual_description: Optional[str] = None
    image_prompt: Optional[str] = None
    suggested_motion: Optional[str] = None
    suggested_transition: Optional[str] = None
    image_status: str = "pending"  # "pending", "generating", "completed", "failed"
    image_url: Optional[str] = None
    image_path: Optional[str] = None
    image_error: Optional[str] = None
    image_metadata: Optional[dict] = None
    # Phase 6: Timeline Animation & Transitions
    motion: str = "none"  # "none", "slow zoom in", "slow zoom out", "pan left", "pan right", "pan up", "pan down"
    transition: str = "none"  # "none", "fade", "crossfade", "slide"
    transition_duration: float = 0.5
    # Phase 8: Image Transform settings
    image_fit: str = "cover"  # "cover", "contain", "blur", "fill"
    image_position: str = "center"  # "center", "top", "bottom", "left", "right"
    image_zoom: float = 1.0  # 1.0 to 2.5
    image_crop: Optional[dict] = None  # {"x": 0, "y": 0, "width": 100, "height": 100}
    # Visual Adjustments & Filters
    brightness: float = 0.0  # -0.5 to +0.5 (0.0 default)
    contrast: float = 1.0  # 0.5 to 2.0 (1.0 default)
    saturation: float = 1.0  # 0.0 to 2.5 (1.0 default)
    color_filter: str = "none"  # "none", "cinematic", "warm", "cyberpunk", "noir", "vivid"
    # Slide Templates & Canvas Elements
    template_type: str = "standard"  # "standard", "blank_slide", "title_intro", "quote_slide", "key_takeaway", "split_screen", "outro_cta"
    background: Optional[dict] = None  # {"type": "color" | "gradient" | "image", "value": "#0f172a"}
    elements: Optional[list] = None  # list of overlay elements: text, emoji, shapes, badges
