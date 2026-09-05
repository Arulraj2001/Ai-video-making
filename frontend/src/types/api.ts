export interface HealthResponse {
  status: string;
}

export interface ApiError {
  error: boolean;
  message: string;
  status_code?: number;
  details?: string;
}
