import type { VideoBible } from "./video_bible";

export type ImageStatus = "pending" | "generating" | "completed" | "failed";

export type ImageMotion =
  | "none"
  | "slow zoom in"
  | "slow zoom out"
  | "pan left"
  | "pan right"
  | "pan up"
  | "pan down";

export type TransitionType = "none" | "fade" | "crossfade" | "slide";

export type ImageFit = "cover" | "contain" | "blur" | "fill";
export type ImagePosition = "center" | "top" | "bottom" | "left" | "right";
export type ColorFilter = "none" | "cinematic" | "warm" | "cyberpunk" | "noir" | "vivid";

export interface ImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SceneTemplateType =
  | "standard"
  | "blank_slide"
  | "title_intro"
  | "quote_slide"
  | "key_takeaway"
  | "split_screen"
  | "outro_cta";

export interface SceneBackground {
  type: "color" | "gradient" | "image";
  value?: string;
  gradient_stops?: string[];
  direction?: "vertical" | "horizontal" | "radial";
}

export interface SceneElement {
  id: string;
  type: "text" | "emoji" | "shape" | "badge";
  content: string;
  x: number; // percentage (0 - 100) or pixels
  y: number; // percentage (0 - 100) or pixels
  width?: number;
  height?: number;
  font_size?: number;
  font_weight?: "normal" | "bold";
  color?: string;
  bg_color?: string;
  opacity?: number;
  rotation?: number;
  border_radius?: number;
  padding?: number;
  align?: "left" | "center" | "right";
  shape?: "rectangle" | "pill" | "circle";
}

export interface TTSVoice {
  id: string;
  name: string;
  gender: string;
  locale: string;
  style: string;
}

export interface CaptionSettings {
  enabled: boolean;
  font_family: string;
  font_size: number;
  position: "bottom" | "center" | "top";
  alignment: "left" | "center" | "right";
  background: "semi-transparent" | "solid" | "none";
  outline_shadow: "none" | "subtle" | "strong";
  safe_area: boolean;
  color: string;
}

export interface AudioSettings {
  narration_volume: number;
  narration_muted: boolean;
  music_file?: AudioFile | null;
  music_volume: number;
  music_fade_in: number;
  music_fade_out: number;
  music_muted: boolean;
  ducking_enabled?: boolean;
}

export interface CanvasSettings {
  aspect_ratio: "9:16" | "16:9" | "1:1" | string;
  resolution: "1080x1920" | "1920x1080" | "1080x1080" | string;
  fps: number;
}

export interface Scene {
  id: string;
  start: number;
  end: number;
  duration: number;
  caption: string;
  visual_description?: string | null;
  image_prompt?: string | null;
  suggested_motion?: string | null;
  suggested_transition?: string | null;
  image_status?: ImageStatus;
  image_url?: string | null;
  image_error?: string | null;
  image_metadata?: Record<string, any> | null;
  motion?: ImageMotion;
  transition?: TransitionType;
  transition_duration?: number;
  image_fit?: ImageFit;
  image_position?: ImagePosition;
  image_zoom?: number;
  image_crop?: ImageCrop | null;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  color_filter?: ColorFilter;
  template_type?: SceneTemplateType;
  background?: SceneBackground | null;
  elements?: SceneElement[] | null;
}

export interface AudioFile {
  filename: string;
  file_size: number;
  content_type: string;
  url?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  audio_file?: AudioFile | null;
  raw_captions?: string;
  scenes: Scene[];
  video_bible?: VideoBible;
  caption_settings?: CaptionSettings;
  audio_settings?: AudioSettings;
  canvas_settings?: CanvasSettings;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
  raw_captions?: string;
}

export interface ProjectSettingsUpdate {
  caption_settings?: CaptionSettings;
  audio_settings?: Partial<AudioSettings>;
  canvas_settings?: CanvasSettings;
}

export interface ParseCaptionsResponse {
  valid: boolean;
  scenes: Scene[];
  errors: string[];
}

export interface SceneUpdateInput {
  start?: number;
  end?: number;
  caption?: string;
  visual_description?: string;
  image_prompt?: string;
  suggested_motion?: string;
  suggested_transition?: string;
  image_status?: ImageStatus;
  image_url?: string | null;
  image_metadata?: Record<string, any> | null;
  motion?: ImageMotion;
  transition?: TransitionType;
  transition_duration?: number;
  image_fit?: ImageFit;
  image_position?: ImagePosition;
  image_zoom?: number;
  image_crop?: ImageCrop | null;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  color_filter?: ColorFilter;
  template_type?: SceneTemplateType;
  background?: SceneBackground | null;
  elements?: SceneElement[] | null;
}


export interface RegenerateSceneInput {
  instructions?: string;
}

export interface StoryboardGenerateResponse {
  project_id: string;
  scenes: Scene[];
  total_scenes: number;
  llm_provider: string;
}

export interface ImageGeneratorCapabilities {
  provider: string;
  model: string;
  supports_reference_images: boolean;
  supports_negative_prompt: boolean;
  supported_aspect_ratios: string[];
  notes: string;
  available_providers: string[];
  supports_seed?: boolean;
  supports_aspect_ratio?: boolean;
  supports_image_to_image?: boolean;
  supports_reference_descriptions?: boolean;
  supports_variations?: boolean;
}

export interface ImageProviderHealth {
  provider: string;
  model: string;
  status: string;
  message: string;
}

export interface GenerateImageInput {
  force?: boolean;
  prompt_override?: string;
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  /** Art style mode: photorealistic | cinematic | anime | manga | 3d | cartoon | flat | sketch | lineart | stickfigure | documentary | watercolor */
  style_mode?: string;
  provider?: string;
  model_id?: string;
}

export interface ModelCatalogItem {
  id: string;
  name: string;
  provider: string;
  model_id: string;
  description: string;
  category?: "free_cloud" | "quota_cloud" | "local" | "mock" | "paid_cloud" | string;
  quality: number;
  speed: string;
  is_free: boolean;
  is_ready: boolean;
  supported_styles: string[];
  supports_reference_images?: boolean;
  supports_seed?: boolean;
  supports_aspect_ratio?: boolean;
  supports_negative_prompt?: boolean;
  supports_image_to_image?: boolean;
  supports_variations?: boolean;
}

export interface ModelCatalogResponse {
  current_provider: string;
  models: ModelCatalogItem[];
}

export interface ProviderUsageItem {
  provider: string;
  date: string;
  used_today: number;
  estimated_daily_limit: number | null;
  remaining_today: number | null;
  is_exhausted: boolean;
  resets_at_utc: string;
}

export type ProviderUsageStats = Record<string, ProviderUsageItem>;

export interface ClusterScenesInput {
  mode?: "fixed_duration" | "smart_llm" | "caption_count";
  target_duration?: number;
  captions_per_scene?: number;
}

export interface ClusterScenesResponse {
  project_id: string;
  original_scene_count: number;
  new_scene_count: number;
  scenes: Scene[];
}

export interface MergeScenesInput {
  scene_ids: string[];
}

export interface GraphicTemplateInput {
  template_type: "title_card" | "quote_card" | "stats_card" | "step_card" | "split_layout";
  headline?: string;
  subtext?: string;
  accent_color?: string;
  step_number?: string;
  stat_number?: string;
}

export interface SceneVariationItem {
  id: string;
  image_url: string;
  prompt: string;
  seed: number;
  metadata?: Record<string, any> | null;
}

export interface SceneVariationsResponse {
  project_id: string;
  scene_id: string;
  variations: SceneVariationItem[];
}

export interface GenerateAllImagesResponse {
  project_id: string;
  scenes: Scene[];
  total_scenes: number;
  completed_count: number;
  failed_count: number;
  provider: string;
}

