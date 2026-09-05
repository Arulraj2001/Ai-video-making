export interface ReferenceImage {
  filename: string;
  url: string;
  file_size: number;
}

export interface OverallStyle {
  visual_style: string;
  realism_level: string;
  color_treatment: string;
  lighting: string;
  camera_style: string;
  lens_cinematography: string;
  mood: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  appearance: string;
  clothing: string;
  age_range: string;
  personality: string;
  reference_image?: ReferenceImage | null;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  environment: string;
  lighting: string;
  reference_image?: ReferenceImage | null;
}

export interface VideoObject {
  id: string;
  name: string;
  description: string;
  reference_image?: ReferenceImage | null;
}

export interface VideoBible {
  overall_style: OverallStyle;
  characters: Character[];
  locations: Location[];
  objects: VideoObject[];
  rules: string[];
}

export interface VisualContext {
  style_prompt_fragment: string;
  characters_catalog: Record<string, any>;
  locations_catalog: Record<string, any>;
  objects_catalog: Record<string, any>;
  active_rules: string[];
  reference_images_catalog: Array<{
    entity_type: string;
    entity_id: string;
    entity_name: string;
    url: string;
    filename: string;
  }>;
}
