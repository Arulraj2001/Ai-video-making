export interface HealthResponse {
  status: string;
}

export interface ApiError {
  error: boolean;
  message: string;
  status_code?: number;
  details?: string;
}

export interface ApiKeyMetadata {
  provider: string;
  label: string;
  category: "image" | "llm" | "multimodal" | "local_gpu";
  configured: boolean;
  key_hint: string | null;
  account_id_hint: string | null;
  status: "active" | "unconfigured" | "error";
  validation_status: "valid" | "untested" | "invalid";
  updated_at: string | null;
  supported_models: string[];
  description: string | null;
  has_app_default: boolean;
}

export interface ApiKeyListResponse {
  providers: ApiKeyMetadata[];
}

export interface SaveApiKeyPayload {
  provider: string;
  api_key: string;
  label?: string;
  account_id?: string;
}

export interface TestApiKeyResponse {
  provider: string;
  valid: boolean;
  message: string;
}

