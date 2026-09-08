import { API_BASE_URL } from "../utils/constants";
import { auth } from "../lib/firebase";
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
  ApiKeyMetadata,
  ApiKeyListResponse,
  SaveApiKeyPayload,
  TestApiKeyResponse,
  TTSVoice,
} from "../types";

class ApiService {

  private baseUrl: string;
  private _adminCache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor() {
    this.baseUrl = API_BASE_URL.replace(/\/$/, "");
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let authHeader: Record<string, string> = {};
    try {
      const currentUser = auth ? auth.currentUser : null;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        if (token) {
          authHeader = { Authorization: `Bearer ${token}` };
        }
      }
    } catch {
      // Unauthenticated / offline
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          ...authHeader,
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
  async listProjects(summary: boolean = false): Promise<Project[]> {
    const qs = summary ? "?summary=true" : "";
    return this.request<Project[]>(`/api/projects${qs}`);
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

  // Ingest voiceover and Clipchamp captions into an EXISTING project
  async ingestProjectMedia(projectId: string, formData: FormData): Promise<Project> {
    return this.request<Project>(`/api/projects/${encodeURIComponent(projectId)}/ingest`, {
      method: "POST",
      body: formData,
    });
  }

  // Update scenes from raw captions for an existing project
  async updateCaptions(projectId: string, rawCaptions: string): Promise<Project> {
    return this.request<Project>(`/api/projects/${encodeURIComponent(projectId)}/captions`, {
      method: "POST",
      body: JSON.stringify({ raw_captions: rawCaptions }),
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

  // Edge-TTS: Get high-fidelity neural voices
  async getTTSVoices(): Promise<TTSVoice[]> {
    return this.request<TTSVoice[]>("/api/tts/voices");
  }

  // Edge-TTS: Synthesize audio & timestamps for an existing project
  async generateVoiceover(
    projectId: string,
    scriptText: string,
    voice: string = "en-US-ChristopherNeural",
    speed: number = 1.0
  ): Promise<Project> {
    return this.request<Project>(`/api/projects/${encodeURIComponent(projectId)}/generate-voiceover`, {
      method: "POST",
      body: JSON.stringify({
        script_text: scriptText,
        voice,
        speed,
      }),
    });
  }

  // Edge-TTS: Ingest new project with script text
  async importWithTTS(data: {
    name: string;
    script_text: string;
    description?: string;
    voice?: string;
    speed?: number;
  }): Promise<Project> {
    return this.request<Project>("/api/projects/import-tts", {
      method: "POST",
      body: JSON.stringify(data),
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

  async addSlide(
    projectId: string,
    data: {
      caption?: string;
      duration?: number;
      template_type?: string;
      background?: any;
      elements?: any[];
    }
  ): Promise<Project> {
    return this.request<Project>(`/api/projects/${projectId}/timeline/slides`, {
      method: "POST",
      body: JSON.stringify(data),
    });
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

  getRenderDownloadUrl(
    projectId: string,
    jobId: string,
    format: string = "mp4",
    token?: string,
    disposition?: "attachment" | "inline"
  ): string {
    const params = new URLSearchParams();
    if (format && format !== "mp4") params.set("format", format);
    if (disposition) params.set("disposition", disposition);
    if (token) params.set("token", token);
    const qs = params.toString();
    return `${this.baseUrl}/api/projects/${projectId}/render/${jobId}/download${qs ? `?${qs}` : ""}`;
  }

  async getAuthenticatedRenderDownloadUrl(
    projectId: string,
    jobId: string,
    format: string = "mp4",
    disposition: "attachment" | "inline" = "inline"
  ): Promise<string> {
    let token: string | undefined;
    try {
      const currentUser = auth?.currentUser;
      if (currentUser) {
        token = (await currentUser.getIdToken()) || undefined;
      }
    } catch {
      // fallback if offline or unauthenticated
    }
    return this.getRenderDownloadUrl(projectId, jobId, format, token, disposition);
  }

  async downloadRenderFile(
    projectId: string,
    jobId: string,
    format: string = "mp4",
    filename?: string
  ): Promise<void> {
    let authHeader: Record<string, string> = {};
    try {
      const currentUser = auth?.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        if (token) {
          authHeader = { Authorization: `Bearer ${token}` };
        }
      }
    } catch {
      // fallback
    }

    const params = new URLSearchParams();
    if (format && format !== "mp4") params.set("format", format);
    params.set("disposition", "attachment");
    const url = `${this.baseUrl}/api/projects/${projectId}/render/${jobId}/download?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...authHeader,
      },
    });

    if (!response.ok) {
      let errorDetail = `Failed to download file (${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson.detail) errorDetail = errJson.detail;
      } catch {
        // fallback
      }
      throw new Error(errorDetail);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;

    let resolvedFilename = filename;
    if (!resolvedFilename) {
      const cd = response.headers.get("content-disposition");
      if (cd) {
        const match = cd.match(/filename="?([^";]+)"?/);
        if (match?.[1]) resolvedFilename = match[1];
      }
    }
    if (!resolvedFilename) {
      const ext = format === "mp3" ? "mp3" : format === "webm" ? "webm" : format === "gif" ? "gif" : "mp4";
      resolvedFilename = `render_${jobId}_${format}.${ext}`;
    }

    link.download = resolvedFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }

  async deleteRenderJob(projectId: string, jobId: string): Promise<void> {
    return this.request<void>(`/api/projects/${projectId}/render/${jobId}`, {
      method: "DELETE",
    });
  }

  // API Key Vault methods
  async listApiKeys(): Promise<ApiKeyListResponse> {
    return this.request<ApiKeyListResponse>("/api/api-keys");
  }

  async saveApiKey(payload: SaveApiKeyPayload): Promise<ApiKeyMetadata> {
    return this.request<ApiKeyMetadata>("/api/api-keys", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async deleteApiKey(provider: string): Promise<{ provider: string; deleted: boolean; message: string }> {
    return this.request<{ provider: string; deleted: boolean; message: string }>(`/api/api-keys/${encodeURIComponent(provider)}`, {
      method: "DELETE",
    });
  }

  async testApiKey(provider: string): Promise<TestApiKeyResponse> {
    return this.request<TestApiKeyResponse>(`/api/api-keys/${encodeURIComponent(provider)}/test`, {
      method: "POST",
    });
  }

  // Usage and Quota methods (Phase 16)
  async getUsage(): Promise<UsageResponse> {
    return this.request<UsageResponse>("/api/usage");
  }

  // Payments and Entitlements methods (Phase 17)
  async getPlans(): Promise<PlanConfigResponse[]> {
    try {
      return await this.request<PlanConfigResponse[]>("/api/plans");
    } catch {
      const yearly = await this.getYearlyPlan();
      return [yearly];
    }
  }

  async getYearlyPlan(): Promise<PlanConfigResponse> {
    return this.request<PlanConfigResponse>("/api/plans/yearly");
  }

  async submitPayment(input: PaymentSubmitRequest): Promise<PaymentResponse> {
    return this.request<PaymentResponse>("/api/payments", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async uploadPaymentProof(
    paymentId: string,
    file: File
  ): Promise<{ payment_id: string; proof_storage_path: string; message: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<{ payment_id: string; proof_storage_path: string; message: string }>(
      `/api/payments/${encodeURIComponent(paymentId)}/proof`,
      {
        method: "POST",
        body: formData,
      }
    );
  }

  async getUserPayments(): Promise<PaymentResponse[]> {
    return this.request<PaymentResponse[]>("/api/payments");
  }

  async getCurrentEntitlement(): Promise<EntitlementResponse | null> {
    try {
      return await this.request<EntitlementResponse>("/api/entitlements/current");
    } catch {
      return null;
    }
  }

  // Admin Portal & Central Control methods (Phase 18) with SWR In-Memory Caching
  invalidateAdminCache(): void {
    this._adminCache.clear();
  }

  async getAdminDashboard(force: boolean = false): Promise<AdminDashboardStats> {
    const key = "dashboard";
    const cached = this._adminCache.get(key);
    if (!force && cached && Date.now() - cached.timestamp < 15000) {
      return cached.data;
    }
    const data = await this.request<AdminDashboardStats>("/api/admin/dashboard");
    this._adminCache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  async getAdminUsers(force: boolean = false): Promise<AdminUserSummary[]> {
    const key = "users";
    const cached = this._adminCache.get(key);
    if (!force && cached && Date.now() - cached.timestamp < 15000) {
      return cached.data;
    }
    const data = await this.request<AdminUserSummary[]>("/api/admin/users");
    this._adminCache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  async getAdminPayments(status?: string, force: boolean = false): Promise<PaymentResponse[]> {
    const key = `payments_${status || "all"}`;
    const cached = this._adminCache.get(key);
    if (!force && cached && Date.now() - cached.timestamp < 15000) {
      return cached.data;
    }
    const url = status && status !== "all"
      ? `/api/admin/payments?status=${encodeURIComponent(status)}`
      : "/api/admin/payments";
    const data = await this.request<PaymentResponse[]>(url);
    this._adminCache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  async getAdminProofUrl(paymentId: string): Promise<{ payment_id: string; proof_url: string; storage_path?: string }> {
    const res = await this.request<{ payment_id: string; proof_url: string; storage_path?: string }>(
      `/api/admin/payments/${encodeURIComponent(paymentId)}/proof-url`
    );
    if (res.proof_url) {
      res.proof_url = new URL(res.proof_url, this.baseUrl).toString();
    }
    try {
      const currentUser = auth ? auth.currentUser : null;
      if (currentUser && res.proof_url) {
        const token = await currentUser.getIdToken();
        if (token) {
          const sep = res.proof_url.includes("?") ? "&" : "?";
          res.proof_url = `${res.proof_url}${sep}token=${encodeURIComponent(token)}`;
        }
      }
    } catch {
      // ignore
    }
    return res;
  }

  async approveAdminPayment(
    paymentId: string
  ): Promise<{ message: string; payment: PaymentResponse; entitlement: EntitlementResponse }> {
    this.invalidateAdminCache();
    return this.request<{ message: string; payment: PaymentResponse; entitlement: EntitlementResponse }>(
      `/api/admin/payments/${encodeURIComponent(paymentId)}/approve`,
      { method: "POST" }
    );
  }

  async rejectAdminPayment(
    paymentId: string,
    reason: string
  ): Promise<{ message: string; payment: PaymentResponse }> {
    this.invalidateAdminCache();
    return this.request<{ message: string; payment: PaymentResponse }>(
      `/api/admin/payments/${encodeURIComponent(paymentId)}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      }
    );
  }

  async getAdminConfig(force: boolean = false): Promise<PlatformConfig> {
    const key = "config";
    const cached = this._adminCache.get(key);
    if (!force && cached && Date.now() - cached.timestamp < 15000) {
      return cached.data;
    }
    const data = await this.request<PlatformConfig>("/api/admin/config");
    this._adminCache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  async updateAdminConfig(config: Partial<PlatformConfig>): Promise<PlatformConfig> {
    this.invalidateAdminCache();
    return this.request<PlatformConfig>("/api/admin/config", {
      method: "PUT",
      body: JSON.stringify(config),
    });
  }

  async getAdminUsage(force: boolean = false): Promise<AdminUsageStats> {
    const key = "usage";
    const cached = this._adminCache.get(key);
    if (!force && cached && Date.now() - cached.timestamp < 15000) {
      return cached.data;
    }
    const data = await this.request<AdminUsageStats>("/api/admin/usage");
    this._adminCache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  async getAdminAuditLogs(limit: number = 50, force: boolean = false): Promise<AuditLogEntry[]> {
    const key = `audit_${limit}`;
    const cached = this._adminCache.get(key);
    if (!force && cached && Date.now() - cached.timestamp < 15000) {
      return cached.data;
    }
    const data = await this.request<AuditLogEntry[]>(`/api/admin/audit-logs?limit=${limit}`);
    this._adminCache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  // Contact & Inquiries (Public & Admin)
  async submitContactInquiry(data: ContactInquiryCreate): Promise<ContactInquiryRecord> {
    return this.request<ContactInquiryRecord>("/api/contact", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getAdminInquiries(status?: string): Promise<ContactInquiryRecord[]> {
    const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
    return this.request<ContactInquiryRecord[]>(`/api/admin/inquiries${query}`);
  }

  async getAdminInquiry(inquiryId: string): Promise<ContactInquiryRecord> {
    return this.request<ContactInquiryRecord>(`/api/admin/inquiries/${encodeURIComponent(inquiryId)}`);
  }

  async updateAdminInquiry(inquiryId: string, updates: ContactInquiryUpdate): Promise<ContactInquiryRecord> {
    return this.request<ContactInquiryRecord>(`/api/admin/inquiries/${encodeURIComponent(inquiryId)}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async deleteAdminInquiry(inquiryId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/admin/inquiries/${encodeURIComponent(inquiryId)}`, {
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

export interface UsageResponse {
  uid: string;
  period: string;
  current_usage: number;
  limit: number;
  remaining: number;
  reset_date: string;
  status: "active" | "limit_reached" | string;
  has_byok: boolean;
  free_tier_generations?: number;
  byok_generations?: number;
  has_active_entitlement?: boolean;
  tier?: "free" | "byok" | "pro_yearly";
  entitlement_expires_at?: string;
  plan_name?: string;
}

export interface PlanConfigResponse {
  plan_id: string;
  name: string;
  price_inr: number;
  price_usd: number;
  duration_days: number;
  enabled: boolean;
  description: string;
  upi_id: string;
  upi_qr_url: string;
  bmc_url: string;
  features: string[];
}

export interface PaymentSubmitRequest {
  plan_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  reference: string;
}

export interface PaymentResponse {
  payment_id: string;
  uid: string;
  plan_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  reference: string;
  proof_storage_path?: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface EntitlementResponse {
  entitlement_id: string;
  uid: string;
  plan_id: string;
  status: string;
  is_active: boolean;
  started_at: string;
  expires_at: string;
  payment_id: string;
  days_remaining: number;
}

export interface AdminDashboardStats {
  total_users: number;
  pending_payments: number;
  active_paid_users: number;
  total_generations: number;
  free_tier_generations: number;
  byok_generations: number;
  yearly_price_inr: number;
  yearly_price_usd: number;
  free_generation_limit: number;
}

export interface AdminUserSummary {
  uid: string;
  email?: string;
  created_at?: string;
  tier: "free" | "byok" | "pro_yearly" | string;
  has_active_entitlement: boolean;
  entitlement_expires_at?: string;
  current_usage: number;
  total_generations: number;
  project_count: number;
}

export interface AdminUsageStats {
  total_generations: number;
  free_tier_generations: number;
  byok_generations: number;
  successful_generations: number;
  failed_generations: number;
  active_paid_users: number;
  users_approaching_limit: number;
  free_generation_limit: number;
}

export interface PlatformConfig {
  yearly_plan_id: string;
  yearly_plan_name: string;
  yearly_plan_price_inr: number;
  yearly_plan_price_usd: number;
  yearly_plan_duration_days: number;
  yearly_plan_enabled: boolean;
  yearly_plan_description: string;
  plan_6m_id?: string;
  plan_6m_name?: string;
  plan_6m_price_inr?: number;
  plan_6m_price_usd?: number;
  plan_6m_duration_days?: number;
  plan_6m_enabled?: boolean;
  plan_6m_description?: string;
  free_generation_limit: number;
  payment_upi_id: string;
  payment_upi_qr_url: string;
  payment_bmc_url: string;
  allow_registration: boolean;
  maintenance_mode: boolean;
  updated_at?: string;
  updated_by?: string;
}

export interface ContactInquiryCreate {
  name: string;
  email: string;
  subject?: string;
  channel_url?: string;
  message: string;
}

export interface ContactInquiryRecord {
  inquiry_id: string;
  name: string;
  email: string;
  subject: string;
  channel_url?: string;
  message: string;
  status: "unread" | "read" | "replied" | "archived";
  submitted_at: string;
  admin_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface ContactInquiryUpdate {
  status?: "unread" | "read" | "replied" | "archived";
  admin_notes?: string;
}

export interface AuditLogEntry {
  log_id: string;
  admin_uid: string;
  admin_email: string;
  action: string;
  timestamp: string;
  details: Record<string, any>;
}

export const api = new ApiService();



