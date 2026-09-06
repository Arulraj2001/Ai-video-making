import { BRAND } from "../config/brand";

export const APP_NAME = BRAND.name;
export const APP_VERSION = BRAND.version;
export const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? "https://ai-video-maker-backend.onrender.com"
  : "http://localhost:8000";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
