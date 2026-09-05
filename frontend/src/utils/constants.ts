export const APP_NAME = "AI Video Maker";
export const APP_VERSION = "0.1.0";
export const DEFAULT_API_BASE_URL = "http://localhost:8000";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
