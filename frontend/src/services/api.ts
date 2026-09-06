import { API_BASE_URL } from "../utils/constants";
import type {
  HealthResponse,
  Project,
  ProjectCreateInput,
  ParseCaptionsResponse,
  Scene,
  SceneUpdateInput,
  VideoBible,
  OverallStyle,
  Character,
  Location,
  VideoObject,
  ReferenceImage,
  VisualContext,
  StoryboardGenerateResponse,
  ImageGeneratorCapabilities,
  ImageProviderHealth,
  GenerateImageInput,
  GenerateAllImagesResponse,
  ModelCatalogResponse,
  ClusterScenesInput,
  ClusterScenesResponse,
  GraphicTemplateInput,
  SceneVariationsResponse,
  ProviderUsageStats,
  RenderJob,
  RenderRequestInput,
  RenderJobListResponse,
} from "../types";

class ApiService {

  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL.replace(/\/$/, "");
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          ...options?.headers,
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            if (typeof errorData.detail === "object" && errorData.detail.errors) {
              errorMessage = errorData.detail.errors.join("; ");
            } else if (typeof errorData.detail === "string") {
              errorMessage = errorData.detail;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Response was not JSON
        }
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return null as unknown as T;
      }

      return await response.json();
    } catch (err: any) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error(`Cannot connect to backend at ${this.baseUrl}. Is the server running?`);
      }
      throw err;
    }
  }

  // Health check endpoint (GET /api/health)
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/api/health");
  }

  // Projects endpoints
  async listProjects(): Promise<Project[]> {
    return this.request<Project[]>("/api/projects");
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`);
  }

  async createProject(input: ProjectCreateInput): Promise<Project> {
    return this.request<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  // Phase 2: Parse and validate captions
  async parseCaptions(rawCaptions: string): Promise<ParseCaptionsResponse> {
    return this.request<ParseCaptionsResponse>("/api/projects/parse-captions", {
      method: "POST",
      body: JSON.stringify({ raw_captions: rawCaptions }),
    });
  }

  // Phase 2: Import new project with audio & parsed captions
  async importProject(formData: FormData): Promise<Project> {
    return this.request<Project>("/api/projects/import", {
      method: "POST",
      body: formData,
    });
  }

  // Phase 2: Upload or replace audio file
  async uploadAudio(projectId: string, file: File): Promise<Project> {
    const formData = new FormData();
    formData.append("audio_file", file);
    return this.request<Project>(`/api/projects/${projectId}/audio`, {
      method: "POST",
      body: formData,
    });
  }

  // Delete project narration audio file
  async deleteAudio(projectId: string): Promise<Project> {
    return this.request<Project>(`/api/projects/${projectId}/audio`, {
      method: "DELETE",
    });
  }

  // Phase 2: Update an individual scene's timing and caption
  async updateScene(projectId: string, sceneId: string, update: SceneUpdateInput): Promise<Scene> {
    return this.request<Scene>(`/api/projects/${projectId}/scenes/${sceneId}`, {
      method: "PUT",
      body: JSON.stringify(update),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/api/projects/${id}`, {
      method: "DELETE",
    });
  }

  // --- Phase 3: Video Bible Methods ---

  async getVideoBible(projectId: string): Promise<VideoBible> {
    return this.request<VideoBible>(`/api/projects/${projectId}/bible`);
  }

  async updateVideoBible(
    projectId: string,
    update: { overall_style?: Partial<OverallStyle>; rules?: string[] }
  ): Promise<VideoBible> {
    return this.request<VideoBible>(`/api/projects/${projectId}/bible`, {
      method: "PUT",
      body: JSON.stringify(update),
    });
  }

  async getVisualContext(projectId: string): Promise<VisualContext> {
    return this.request<VisualContext>(`/api/projects/${projectId}/bible/visual-context`);
  }

  // Characters
  async addCharacter(projectId: string, data: Partial<Character>): Promise<Character> {
    return this.request<Character>(`/api/projects/${projectId}/bible/characters`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCharacter(
    projectId: string,
    charId: string,
    data: Partial<Character>
  ): Promise<Character> {
    return this.request<Character>(`/api/projects/${projectId}/bible/characters/${charId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCharacter(projectId: string, charId: string): Promise<void> {
    return this.request<void>(`/api/projects/${projectId}/bible/characters/${charId}`, {
      method: "DELETE",
    });
  }

  async uploadCharacterReference(
    projectId: string,
    charId: string,
    file: File
  ): Promise<ReferenceImage> {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<ReferenceImage>(
      `/api/projects/${projectId}/bible/characters/${charId}/reference`,
      {
        method: "POST",
        body: formData,
      }
    );
  }

  // Locations
  async addLocation(projectId: string, data: Partial<Location>): Promise<Location> {
    return this.request<Location>(`/api/projects/${projectId}/bible/locations`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateLocation(
    projectId: string,
    locId: string,
    data: Partial<Location>
  ): Promise<Location> {
    return this.request<Location>(`/api/projects/${projectId}/bible/locations/${locId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteLocation(projectId: string, locId: string): Promise<void> {
    return this.request<void>(`/api/projects/${projectId}/bible/locations/${locId}`, {
      method: "DELETE",
    });
  }

  async uploadLocationReference(
    projectId: string,
    locId: string,
    file: File
  ): Promise<ReferenceImage> {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<ReferenceImage>(
      `/api/projects/${projectId}/bible/locations/${locId}/reference`,
      {
        method: "POST",
        body: formData,
      }
    );
  }

  // Objects
  async addObject(projectId: string, data: Partial<VideoObject>): Promise<VideoObject> {
    return this.request<VideoObject>(`/api/projects/${projectId}/bible/objects`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateObject(
    projectId: string,
    objId: string,
    data: Partial<VideoObject>
  ): Promise<VideoObject> {
    return this.request<VideoObject>(`/api/projects/${projectId}/bible/objects/${objId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteObject(projectId: string, objId: string): Promise<void> {
    return this.request<void>(`/api/projects/${projectId}/bible/objects/${objId}`, {
      method: "DELETE",
    });
  }

  async uploadObjectReference(
    projectId: string,
    objId: string,
    file: File
  ): Promise<ReferenceImage> {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<ReferenceImage>(
      `/api/projects/${projectId}/bible/objects/${objId}/reference`,
      {
        method: "POST",
        body: formData,
      }
    );
  }

  // --- Phase 4: Storyboard Generation ---

  async generateStoryboard(projectId: string): Promise<StoryboardGenerateResponse> {
    return this.request<StoryboardGenerateResponse>(`/api/projects/${projectId}/storyboard/generate`, {
      method: "POST",
    });
  }

  async regenerateScenePrompt(
    projectId: string,
    sceneId: string,
    instructions?: string
  ): Promise<Scene> {
    return this.request<Scene>(`/api/projects/${projectId}/storyboard/scenes/${sceneId}/regenerate`, {
      method: "POST",
      body: JSON.stringify({ instructions: instructions || "" }),
    });
  }

  async updateSceneStoryboard(
    projectId: string,
    sceneId: string,
    update: SceneUpdateInput
  ): Promise<Scene> {
    return this.request<Scene>(`/api/projects/${projectId}/storyboard/scenes/${sceneId}`, {
      method: "PUT",
      body: JSON.stringify(update),
    });
  }

  // --- Phase 5: Storyboard Scene Image Generation ---

  async getImageCapabilities(provider?: string, model?: string, style?: string): Promise<ImageGeneratorCapabilities> {
    const params = new URLSearchParams();
    if (provider) params.set("provider", provider);
    if (model) params.set("model", model);
    if (style) params.set("style", style);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<ImageGeneratorCapabilities>(`/api/images/capabilities${query}`);
  }

  async getImageProviderHealth(provider: string, model?: string): Promise<ImageProviderHealth> {
    const params = new URLSearchParams({ provider });
    if (model) params.set("model", model);
    return this.request<ImageProviderHealth>(`/api/images/provider-health?${params.toString()}`);
  }

  async getProviderUsageStats(): Promise<ProviderUsageStats> {
    return this.request<ProviderUsageStats>("/api/images/usage-stats");
  }

  async generateSceneImage(
    projectId: string,
    sceneId: string,
    options?: GenerateImageInput
  ): Promise<Scene> {
    return this.request<Scene>(`/api/projects/${projectId}/scenes/${sceneId}/generate-image`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    });
  }

  async generateAllSceneImages(
    projectId: string,
    options?: GenerateImageInput
  ): Promise<GenerateAllImagesResponse> {
    return this.request<GenerateAllImagesResponse>(
      `/api/projects/${projectId}/scenes/generate-all-images`,
      {
        method: "POST",
        body: JSON.stringify(options || {}),
      }
    );
  }

  async getModelCatalog(): Promise<ModelCatalogResponse> {
    return this.request<ModelCatalogResponse>("/api/images/models");
  }

  async clusterScenes(
    projectId: string,
    input?: ClusterScenesInput
  ): Promise<ClusterScenesResponse> {
    return this.request<ClusterScenesResponse>(`/api/projects/${projectId}/storyboard/cluster`, {
      method: "POST",
      body: JSON.stringify(input || {}),
    });
  }

  async mergeScenes(
    projectId: string,
    sceneIds: string[]
  ): Promise<ClusterScenesResponse> {
    return this.request<ClusterScenesResponse>(`/api/projects/${projectId}/storyboard/merge`, {
      method: "POST",
      body: JSON.stringify({ scene_ids: sceneIds }),
    });
  }

  async generateSceneVariations(
    projectId: string,
    sceneId: string,
    options?: GenerateImageInput
  ): Promise<SceneVariationsResponse> {
    return this.request<SceneVariationsResponse>(`/api/projects/${projectId}/scenes/${sceneId}/variations`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    });
  }

  async applyGraphicTemplate(
    projectId: string,
    sceneId: string,
    input: GraphicTemplateInput
  ): Promise<Scene> {
    return this.request<Scene>(`/api/projects/${projectId}/scenes/${sceneId}/graphic-template`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }


  // --- Phase 6: Visual Timeline Methods ---

  async updateSceneTimeline(
    projectId: string,
    sceneId: string,
    update: SceneUpdateInput,
    ripple: boolean = true
  ): Promise<Project> {
    return this.request<Project>(
      `/api/projects/${projectId}/timeline/scenes/${sceneId}?ripple=${ripple}`,
      {
        method: "PUT",
        body: JSON.stringify(update),
      }
    );
  }

  async splitScene(
    projectId: string,
    sceneId: string,
    splitTime: number
  ): Promise<Project> {
    return this.request<Project>(
      `/api/projects/${projectId}/timeline/scenes/${sceneId}/split`,
      {
        method: "POST",
        body: JSON.stringify({ split_time: splitTime }),
      }
    );
  }

  async duplicateScene(projectId: string, sceneId: string): Promise<Project> {
    return this.request<Project>(
      `/api/projects/${projectId}/timeline/scenes/${sceneId}/duplicate`,
      {
        method: "POST",
      }
    );
  }

  async deleteTimelineScene(
    projectId: string,
    sceneId: string,
    ripple: boolean = true
  ): Promise<Project> {
    return this.request<Project>(
      `/api/projects/${projectId}/timeline/scenes/${sceneId}?ripple=${ripple}`,
      {
        method: "DELETE",
      }
    );
  }

  async reorderScenes(projectId: string, sceneIds: string[]): Promise<Project> {
    return this.request<Project>(`/api/projects/${projectId}/timeline/reorder`, {
      method: "POST",
      body: JSON.stringify({ scene_ids: sceneIds }),
    });
  }

  async uploadReplacementImage(
    projectId: string,
    sceneId: string,
    file: File
  ): Promise<Scene> {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<Scene>(
      `/api/projects/${projectId}/timeline/scenes/${sceneId}/upload-image`,
      {
        method: "POST",
        body: formData,
      }
    );
  }

  async restoreTimelineScenes(
    projectId: string,
    scenes: Scene[]
  ): Promise<Project> {
    return this.request<Project>(`/api/projects/${projectId}/timeline/restore`, {
      method: "POST",
      body: JSON.stringify(scenes),
    });
  }

  // --- Phase 7: Video Rendering Engine ---

  async startRender(
    projectId: string,
    input: RenderRequestInput = { resolution: "1080x1920" }
  ): Promise<RenderJob> {
    return this.request<RenderJob>(`/api/projects/${projectId}/render`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getRenderStatus(
    projectId: string,
    jobId: string
  ): Promise<RenderJob> {
    return this.request<RenderJob>(
      `/api/projects/${projectId}/render/${jobId}`
    );
  }

  async listRenderJobs(projectId: string): Promise<RenderJobListResponse> {
    return this.request<RenderJobListResponse>(
      `/api/projects/${projectId}/renders`
    );
  }

  // --- Phase 8: Settings (Captions, Audio mixing, Canvas) ---

  async updateProjectSettings(
    projectId: string,
    update: import("../types/project").ProjectSettingsUpdate
  ): Promise<Project> {
    return this.request<Project>(`/api/projects/${projectId}/settings`, {
      method: "PUT",
      body: JSON.stringify(update),
    });
  }

  async uploadBackgroundMusic(
    projectId: string,
    file: File
  ): Promise<Project> {
    const formData = new FormData();
    formData.append("music_file", file);
    return this.request<Project>(`/api/projects/${projectId}/music`, {
      method: "POST",
      body: formData,
    });
  }

  async deleteBackgroundMusic(projectId: string): Promise<Project> {
    return this.request<Project>(`/api/projects/${projectId}/music`, {
      method: "DELETE",
    });
  }

  // --- Phase 9: Reliability, Backups, Retries, Cleanup & Diagnostics ---

  async getHealthDiagnostics(): Promise<any> {
    return this.request<any>("/api/health/diagnostics");
  }

  async retryFailedImages(
    projectId: string,
    options?: GenerateImageInput
  ): Promise<GenerateAllImagesResponse> {
    return this.request<GenerateAllImagesResponse>(
      `/api/projects/${projectId}/scenes/retry-failed`,
      {
        method: "POST",
        body: JSON.stringify(options || {}),
      }
    );
  }

  async retryRender(projectId: string, jobId: string): Promise<RenderJob> {
    return this.request<RenderJob>(
      `/api/projects/${projectId}/render/${jobId}/retry`,
      {
        method: "POST",
      }
    );
  }

  getProjectExportUrl(projectId: string): string {
    return `${this.baseUrl}/api/projects/${projectId}/export`;
  }

  async exportProjectBackup(projectId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/projects/${projectId}/export`);
    if (!res.ok) throw new Error("Failed to export project backup");
    return await res.json();
  }

  async importProjectBackup(fileOrData: File | Record<string, any>): Promise<Project> {
    if (fileOrData instanceof File) {
      const formData = new FormData();
      formData.append("backup_file", fileOrData);
      return this.request<Project>("/api/projects/import-backup", {
        method: "POST",
        body: formData,
      });
    } else {
      return this.request<Project>("/api/projects/import-backup", {
        method: "POST",
        body: JSON.stringify(fileOrData),
      });
    }
  }

  async cleanProjectTemp(projectId: string): Promise<{
    message: string;
    cleaned_dirs: number;
    cleaned_files: number;
    freed_bytes: number;
    freed_mb: number;
  }> {
    return this.request<{
      message: string;
      cleaned_dirs: number;
      cleaned_files: number;
      freed_bytes: number;
      freed_mb: number;
    }>(`/api/projects/${projectId}/cleanup`, {
      method: "POST",
    });
  }

  getRenderDownloadUrl(projectId: string, jobId: string, format: string = "mp4"): string {
    const query = format && format !== "mp4" ? `?format=${encodeURIComponent(format)}` : "";
    return `${this.baseUrl}/api/projects/${projectId}/render/${jobId}/download${query}`;
  }

  async deleteRenderJob(projectId: string, jobId: string): Promise<void> {
    return this.request<void>(`/api/projects/${projectId}/render/${jobId}`, {
      method: "DELETE",
    });
  }

  getMediaUrl(urlPath?: string): string {
    if (!urlPath) return "";
    if (urlPath.startsWith("http://") || urlPath.startsWith("https://")) {
      return urlPath;
    }
    const clean = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;
    return `${this.baseUrl}/${clean}`;
  }
}

export const api = new ApiService();
