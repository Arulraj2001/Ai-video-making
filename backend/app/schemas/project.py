from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.video_bible import VideoBibleSchema

class SceneSchema(BaseModel):
    id: str = Field(..., description="Canonical scene ID e.g. scene-001")
    start: float = Field(..., description="Start timestamp in seconds")
    end: float = Field(..., description="End timestamp in seconds")
    duration: float = Field(..., description="Duration in seconds")
    caption: str = Field(..., description="Caption text")
    visual_description: Optional[str] = Field(default=None, description="Visual description of the shot")
    image_prompt: Optional[str] = Field(default=None, description="Synthesized text-to-image generation prompt")
    suggested_motion: Optional[str] = Field(default=None, description="Suggested camera or subject motion")
    suggested_transition: Optional[str] = Field(default=None, description="Suggested transition to the next scene")
    image_status: str = Field(default="pending", description="Image status: pending, generating, completed, failed")
    image_url: Optional[str] = Field(default=None, description="URL to generated image asset")
    image_error: Optional[str] = Field(default=None, description="Failure error details if any")
    image_metadata: Optional[dict] = Field(default=None, description="Generation metadata (model, provider, dimensions, etc.)")
    # Phase 6: Timeline Animation & Transitions
    motion: str = Field(default="none", description="Image motion: none, slow zoom in, slow zoom out, pan left, pan right, pan up, pan down")
    transition: str = Field(default="none", description="Transition: none, fade, crossfade, slide")
    transition_duration: float = Field(default=0.5, description="Transition duration in seconds")
    # Phase 8: Image Transform settings
    image_fit: str = Field(default="cover", description="Image fit: cover, contain, blur, fill")
    image_position: str = Field(default="center", description="Image position: center, top, bottom, left, right")
    image_zoom: float = Field(default=1.0, description="Image zoom level (1.0 to 2.5)")
    image_crop: Optional[Dict[str, Any]] = Field(default=None, description="Optional bounding crop")
    # Visual Adjustments & Filters
    brightness: float = Field(default=0.0, description="Brightness adjustment: -0.5 to +0.5")
    contrast: float = Field(default=1.0, description="Contrast adjustment: 0.5 to 2.0")
    saturation: float = Field(default=1.0, description="Saturation adjustment: 0.0 to 2.5")
    color_filter: str = Field(default="none", description="Color filter: none, cinematic, warm, cyberpunk, noir, vivid")
    # Slide Templates & Canvas Elements
    template_type: Optional[str] = Field(default="standard", description="Template: standard, blank_slide, title_intro, quote_slide, key_takeaway, split_screen, outro_cta")
    background: Optional[Dict[str, Any]] = Field(default=None, description="Slide background styling: type (color/gradient/image) and value")
    elements: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Overlay elements (text, emoji, shape, badge)")

    model_config = {"from_attributes": True}

class SceneUpdate(BaseModel):
    start: Optional[float] = None
    end: Optional[float] = None
    caption: Optional[str] = None
    visual_description: Optional[str] = None
    image_prompt: Optional[str] = None
    suggested_motion: Optional[str] = None
    suggested_transition: Optional[str] = None
    image_status: Optional[str] = None
    image_url: Optional[str] = None
    image_error: Optional[str] = None
    image_metadata: Optional[dict] = None
    motion: Optional[str] = None
    transition: Optional[str] = None
    transition_duration: Optional[float] = None
    image_fit: Optional[str] = None
    image_position: Optional[str] = None
    image_zoom: Optional[float] = None
    image_crop: Optional[Dict[str, Any]] = None
    brightness: Optional[float] = None
    contrast: Optional[float] = None
    saturation: Optional[float] = None
    color_filter: Optional[str] = None
    template_type: Optional[str] = None
    background: Optional[Dict[str, Any]] = None
    elements: Optional[List[Dict[str, Any]]] = None

class GenerateVoiceoverRequest(BaseModel):
    script_text: str = Field(..., min_length=1, description="Narration or script text to synthesize with Edge-TTS")
    voice: Optional[str] = Field(default="en-US-ChristopherNeural", description="Voice ID from curated catalog")
    speed: Optional[float] = Field(default=1.0, ge=0.5, le=2.0, description="Speech rate multiplier (0.5x to 2.0x)")

class ImportTTSProjectRequest(BaseModel):
    name: str = Field(..., min_length=1, description="Project name")
    description: Optional[str] = Field(default="", description="Project description")
    script_text: str = Field(..., min_length=1, description="Narration or script text to synthesize")
    voice: Optional[str] = Field(default="en-US-ChristopherNeural", description="Voice ID from curated catalog")
    speed: Optional[float] = Field(default=1.0, ge=0.5, le=2.0, description="Speech rate multiplier (0.5x to 2.0x)")

class SplitSceneRequest(BaseModel):
    split_time: float = Field(..., description="Timestamp in seconds at which to split the scene")

class DuplicateSceneRequest(BaseModel):
    pass

class AddSlideRequest(BaseModel):
    caption: str = Field(default="New Slide", description="Slide caption / presentation takeaway")
    duration: float = Field(default=4.0, ge=0.5, le=60.0, description="Slide duration in seconds")
    template_type: str = Field(default="blank_slide", description="Slide template layout")
    background: Optional[Dict[str, Any]] = None
    elements: Optional[List[Dict[str, Any]]] = None

class ReorderScenesRequest(BaseModel):
    scene_ids: List[str] = Field(..., description="Ordered list of scene IDs defining the new sequence")

class TimelineUpdateResponse(BaseModel):
    project_id: str
    scenes: List[SceneSchema]
    total_duration: float

class RegenerateSceneRequest(BaseModel):
    instructions: Optional[str] = Field(default="", description="Optional user tweak instructions for prompt regeneration")

class GenerateImageRequest(BaseModel):
    force: bool = Field(default=False, description="Force regenerate even if already completed")
    prompt_override: Optional[str] = Field(default=None, description="Optional custom image prompt override")
    style_mode: Optional[str] = Field(
        default=None,
        description=(
            "Art style mode for image generation. "
            "Options: photorealistic, anime, manga, 3d, cartoon, flat, sketch, lineart, stickfigure, documentary, cinematic, watercolor"
        )
    )
    provider: Optional[str] = Field(default=None, description="Provider override: pollinations, huggingface, cloudflare, mock")
    model_id: Optional[str] = Field(default=None, description="Specific model ID override")
    aspect_ratio: Optional[str] = Field(default=None, pattern=r"^(16:9|9:16|1:1)$", description="Per-image aspect ratio override")

class ModelCatalogItem(BaseModel):
    id: str
    name: str
    provider: str
    model_id: str
    description: str
    category: Optional[str] = "free_cloud"
    quality: int = Field(default=4, ge=1, le=5)
    speed: str = "Fast"
    is_free: bool = True
    is_ready: bool = True
    supported_styles: List[str] = Field(default_factory=list)
    supports_reference_images: bool = False
    supports_seed: bool = False
    supports_aspect_ratio: bool = True
    supports_negative_prompt: bool = True
    supports_image_to_image: bool = False
    supports_variations: bool = True

class ModelCatalogResponse(BaseModel):
    current_provider: str
    models: List[ModelCatalogItem]

class ClusterScenesRequest(BaseModel):
    mode: str = Field(default="fixed_duration", description="Clustering mode: 'fixed_duration', 'smart_llm', 'caption_count'")
    target_duration: float = Field(default=15.0, description="Target duration in seconds for each visual scene (e.g. 15.0 to 25.0)")
    captions_per_scene: int = Field(default=4, description="Number of captions to group together if using caption_count mode")

class ClusterScenesResponse(BaseModel):
    project_id: str
    original_scene_count: int
    new_scene_count: int
    scenes: List[SceneSchema]

class MergeScenesRequest(BaseModel):
    scene_ids: List[str] = Field(..., min_length=2, description="List of scene IDs to merge sequentially")

class GraphicTemplateRequest(BaseModel):
    template_type: str = Field(..., description="Template type: 'title_card', 'split_layout', 'quote_card', 'stats_card', 'step_card', 'comparison'")
    headline: Optional[str] = Field(default=None, description="Primary heading text")
    subtext: Optional[str] = Field(default=None, description="Secondary description or citation")
    accent_color: Optional[str] = Field(default="#6366f1", description="Accent color in hex")
    step_number: Optional[str] = Field(default=None, description="Step number e.g. '01' or 'STEP 1'")
    stat_number: Optional[str] = Field(default=None, description="Big statistic e.g. '87%' or '3x'")

class SceneVariationItem(BaseModel):
    id: str
    image_url: str
    prompt: str
    seed: int
    metadata: Optional[dict] = None

class SceneVariationsResponse(BaseModel):
    project_id: str
    scene_id: str
    variations: List[SceneVariationItem]

class GenerateAllImagesResponse(BaseModel):
    project_id: str
    scenes: List[SceneSchema]
    total_scenes: int
    completed_count: int
    failed_count: int
    provider: str

class ImageCapabilitiesResponse(BaseModel):
    provider: str
    model: str
    supports_reference_images: bool
    supports_negative_prompt: bool
    supported_aspect_ratios: List[str]
    notes: str
    available_providers: List[str]
    supports_seed: bool = False
    supports_aspect_ratio: bool = True
    supports_image_to_image: bool = False
    supports_reference_descriptions: bool = True
    supports_variations: bool = True

class ImageProviderHealthResponse(BaseModel):
    provider: str
    model: str
    status: str
    message: str


class StoryboardGenerateResponse(BaseModel):
    project_id: str
    scenes: List[SceneSchema]
    total_scenes: int
    llm_provider: str

class AudioFileSchema(BaseModel):
    filename: str
    file_size: int
    content_type: str
    url: Optional[str] = None

# Phase 8: Caption, Audio, and Canvas Settings Schemas

class CaptionSettingsSchema(BaseModel):
    enabled: bool = Field(default=True, description="Whether captions are burned and displayed")
    font_family: str = Field(default="Inter", description="Font family: Inter, Montserrat, Arial, Roboto, Impact")
    font_size: int = Field(default=42, description="Font size in pixels")
    position: str = Field(default="bottom", description="Position: bottom, center, top")
    alignment: str = Field(default="center", description="Alignment: left, center, right")
    background: str = Field(default="semi-transparent", description="Background: none, semi-transparent, solid")
    outline_shadow: str = Field(default="subtle", description="Outline/Shadow: none, subtle, strong")
    safe_area: bool = Field(default=True, description="Whether safe-area margin padding is applied")
    color: str = Field(default="#FFFFFF", description="Text color hex code")

class AudioSettingsSchema(BaseModel):
    narration_volume: float = Field(default=1.0, ge=0.0, le=2.0, description="Narration voice volume scale")
    narration_muted: bool = Field(default=False, description="Whether narration voice is muted")
    music_file: Optional[AudioFileSchema] = Field(default=None, description="Uploaded background music file")
    music_volume: float = Field(default=0.25, ge=0.0, le=2.0, description="Background music volume scale")
    music_fade_in: float = Field(default=1.0, ge=0.0, le=10.0, description="Background music fade in duration in seconds")
    music_fade_out: float = Field(default=2.0, ge=0.0, le=10.0, description="Background music fade out duration in seconds")
    music_muted: bool = Field(default=False, description="Whether background music is muted")
    ducking_enabled: bool = Field(default=True, description="Whether background music automatically ducks under voice narration")


class CanvasSettingsSchema(BaseModel):
    aspect_ratio: str = Field(default="9:16", description="Canvas aspect ratio: 9:16, 16:9, 1:1")
    resolution: str = Field(default="1080x1920", description="Canvas resolution: 1080x1920, 1920x1080, 1080x1080")
    fps: int = Field(default=30, description="Target framerate: 30 FPS")

class ProjectSettingsUpdate(BaseModel):
    caption_settings: Optional[CaptionSettingsSchema] = None
    audio_settings: Optional[AudioSettingsSchema] = None
    canvas_settings: Optional[CanvasSettingsSchema] = None

class ParseCaptionsRequest(BaseModel):
    raw_captions: str = Field(..., description="Raw text of Clipchamp timestamped captions")

class ParseCaptionsResponse(BaseModel):
    valid: bool
    scenes: List[SceneSchema] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, description="Project name")
    description: Optional[str] = Field(default="", max_length=500, description="Optional description")
    raw_captions: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    audio_file: Optional[AudioFileSchema] = None
    raw_captions: Optional[str] = ""
    scenes: List[SceneSchema] = Field(default_factory=list)
    video_bible: Optional[VideoBibleSchema] = None
    caption_settings: Optional[CaptionSettingsSchema] = None
    audio_settings: Optional[AudioSettingsSchema] = None
    canvas_settings: Optional[CanvasSettingsSchema] = None
    owner_id: Optional[str] = None
    created_at: str
    updated_at: str

class ProjectSummaryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    aspect_ratio: str = "16:9"
    scene_count: int = 0
    total_duration: float = 0.0
    thumbnail_url: Optional[str] = None
    canvas_settings: Optional[CanvasSettingsSchema] = None
    owner_id: Optional[str] = None
    created_at: str
    updated_at: str

