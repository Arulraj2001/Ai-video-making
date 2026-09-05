export type RenderJobStatus = "queued" | "processing" | "completed" | "failed";

export type RenderJobStage =
  | "Preparing..."
  | "Generating timeline..."
  | "Rendering..."
  | "Finalizing...";

export interface RenderJob {
  id: string;
  project_id: string;
  status: RenderJobStatus;
  stage: string;
  progress: number;
  resolution: "1080x1920" | "1920x1080" | "1080x1080" | string;
  aspect_ratio: string;
  output_url?: string | null;
  output_filename?: string | null;
  file_size?: number | null;
  duration?: number | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RenderRequestInput {
  resolution?: string;
  aspect_ratio?: string;
}

export interface RenderJobListResponse {
  jobs: RenderJob[];
}
