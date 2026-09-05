import os
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "AI Video Maker Backend"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS Configuration - supports local development and Netlify deployments
    raw_cors: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
    )
    CORS_ORIGINS: List[str] = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]
    
    # Allow Netlify preview domains in production
    CORS_ORIGIN_REGEX: str = os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.netlify\.app")

    # LLM Provider Configuration for Storyboard Generation
    # Supported: "mock", "openai", "gemini", "anthropic"
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock").lower()
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: Optional[str] = os.getenv("LLM_BASE_URL", None)
    
    # Image Generator Provider Configuration for Phase 5
    # Supported: "mock", "cloudflare", "huggingface"
    IMAGE_GENERATOR_PROVIDER: str = os.getenv("IMAGE_GENERATOR_PROVIDER", "mock").lower()
    IMAGE_GENERATOR_MODEL: Optional[str] = os.getenv("IMAGE_GENERATOR_MODEL", None)
    
    # Cloudflare Workers AI credentials
    CLOUDFLARE_ACCOUNT_ID: str = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
    CLOUDFLARE_API_TOKEN: str = os.getenv("CLOUDFLARE_API_TOKEN", "")
    CLOUDFLARE_IMAGE_MODEL: str = os.getenv("CLOUDFLARE_IMAGE_MODEL", "@cf/black-forest-labs/flux-1-schnell")
    
    # Hugging Face Inference credentials
    HUGGINGFACE_API_KEY: str = os.getenv("HUGGINGFACE_API_KEY", "")
    HUGGINGFACE_IMAGE_MODEL: str = os.getenv("HUGGINGFACE_IMAGE_MODEL", "black-forest-labs/FLUX.1-schnell")
    
    DEFAULT_ASPECT_RATIO: str = os.getenv("DEFAULT_ASPECT_RATIO", "16:9")

settings = Settings()
