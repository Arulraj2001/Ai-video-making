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

export type ImageFit = "cover" | "contain" | "fill";
export type ImagePosition = "center" | "top" | "bottom" | "left" | "right";

export interface ImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
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
  motion?: ImageMotion;
  transition?: TransitionType;
  transition_duration?: number;
  image_fit?: ImageFit;
  image_position?: ImagePosition;
  image_zoom?: number;
  image_crop?: ImageCrop | null;
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
}

export interface GenerateImageInput {
  force?: boolean;
  prompt_override?: string;
  /** Art style mode: photorealistic | cinematic | anime | manga | 3d | cartoon | flat | sketch | lineart | stickfigure | documentary | watercolor */
  style_mode?: string;
}

export interface GenerateAllImagesResponse {
  project_id: string;
  scenes: Scene[];
  total_scenes: number;
  completed_count: number;
  failed_count: number;
  provider: string;
}
