import os
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "AI Video Maker Backend"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production" if os.getenv("RENDER") else "development")
    
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS Configuration - supports local development, JSON lists, and Firebase Hosting
    default_cors = (
        "https://scenoraedits.web.app,https://scenoraedits.firebaseapp.com"
        if os.getenv("RENDER")
        else "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
    )
    raw_cors: str = os.getenv("CORS_ORIGINS", default_cors).strip()
    if raw_cors.startswith("[") and raw_cors.endswith("]"):
        import json
        try:
            CORS_ORIGINS: List[str] = [
                o.strip() for o in json.loads(raw_cors) if o and isinstance(o, str) and o.strip()
            ]
        except Exception:
            CORS_ORIGINS: List[str] = [
                origin.strip().strip('"').strip("'")
                for origin in raw_cors.strip("[]").split(",")
                if origin.strip()
            ]
    else:
        CORS_ORIGINS: List[str] = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]
    
    # Allow Netlify and Firebase Hosting preview and production domains in production
    CORS_ORIGIN_REGEX: str = os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.(netlify\.app|web\.app|firebaseapp\.com)")

    # LLM Provider Configuration for Storyboard Generation
    # Supported: "mock", "openai", "gemini", "anthropic", "openrouter"
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openrouter" if os.getenv("RENDER") else "mock").lower()
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: Optional[str] = os.getenv("LLM_BASE_URL", None)

    # OpenRouter API Key (handles both OPENROUTER_API_KEY and OpenRouter_key)
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", os.getenv("OpenRouter_key", ""))

    # Gemini image/LLM provider key. Image generation requires this explicit variable.
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Image Generator Provider Configuration
    # Supported: "pollinations", "mock", "cloudflare", "huggingface", "gemini"
    IMAGE_GENERATOR_PROVIDER: str = os.getenv("IMAGE_GENERATOR_PROVIDER", "pollinations").lower()
    IMAGE_GENERATOR_MODEL: Optional[str] = os.getenv("IMAGE_GENERATOR_MODEL", None)
    
    # Cloudflare Workers AI credentials.
    # Supports both CLOUDFLARE_ACCOUNT_ID and the shorter CF_ACCOUNT_ID alias.
    # Uses explicit non-empty check so that an empty primary var falls back to alias.
    CLOUDFLARE_ACCOUNT_ID: str = (
        os.getenv("CLOUDFLARE_ACCOUNT_ID", "").strip()
        or os.getenv("CF_ACCOUNT_ID", "").strip()
    )
    CLOUDFLARE_API_TOKEN: str = (
        os.getenv("CLOUDFLARE_API_TOKEN", "").strip()
        or os.getenv("CF_API_TOKEN", "").strip()
    )
    CLOUDFLARE_IMAGE_MODEL: str = os.getenv("CLOUDFLARE_IMAGE_MODEL", "@cf/black-forest-labs/flux-1-schnell")

    # Hugging Face Inference credentials.
    # Supports both HUGGINGFACE_API_KEY and the shorter HF_API_KEY alias.
    # Uses explicit non-empty check so that an empty primary var falls back to alias.
    HUGGINGFACE_API_KEY: str = (
        os.getenv("HUGGINGFACE_API_KEY", "").strip()
        or os.getenv("HF_API_KEY", "").strip()
    )
    HUGGINGFACE_IMAGE_MODEL: str = os.getenv("HUGGINGFACE_IMAGE_MODEL", "black-forest-labs/FLUX.1-schnell")
    
    DEFAULT_ASPECT_RATIO: str = os.getenv("DEFAULT_ASPECT_RATIO", "16:9")
    
    # Root storage directory (supports persistent volume mounts e.g. /var/data on Render)
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "storage")
    # Rendered videos remain local only and are removed after this many hours.
    RENDER_RETENTION_HOURS: int = max(1, int(os.getenv("RENDER_RETENTION_HOURS", "24")))

    # Firebase Backend Configuration
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "scenoraedits").strip()
    FIREBASE_STORAGE_BUCKET: str = os.getenv("FIREBASE_STORAGE_BUCKET", "scenoraedits.firebasestorage.app").strip()
    FIREBASE_SERVICE_ACCOUNT_KEY: Optional[str] = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY", None)

    # Phase 15: Credential Vault Configuration (256-bit AES-GCM)
    # Supported: "firestore" (default, production intended), "local" (development/test only)
    CREDENTIAL_VAULT_BACKEND: str = os.getenv("CREDENTIAL_VAULT_BACKEND", "firestore").strip().lower()
    SCENORA_CREDENTIAL_ENCRYPTION_KEY: str = os.getenv(
        "SCENORA_CREDENTIAL_ENCRYPTION_KEY",
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    ).strip()

    # Phase 16: Usage Limits & Free Tier Configuration
    FREE_GENERATION_LIMIT: int = int(os.getenv("FREE_GENERATION_LIMIT", "5"))
    USAGE_PERIOD: str = os.getenv("USAGE_PERIOD", "monthly").strip().lower()
    USAGE_STORAGE_BACKEND: str = os.getenv("USAGE_STORAGE_BACKEND", "firestore").strip().lower()

    # Phase 17: Yearly Plan & Manual Payments Configuration
    YEARLY_PLAN_ID: str = os.getenv("YEARLY_PLAN_ID", "scenora-pro-yearly")
    YEARLY_PLAN_NAME: str = os.getenv("YEARLY_PLAN_NAME", "ScenoraEdits Pro (Yearly)")
    YEARLY_PLAN_PRICE_INR: int = int(os.getenv("YEARLY_PLAN_PRICE_INR", "2999"))
    YEARLY_PLAN_PRICE_USD: int = int(os.getenv("YEARLY_PLAN_PRICE_USD", "49"))
    YEARLY_PLAN_CURRENCY_DEFAULT: str = os.getenv("YEARLY_PLAN_CURRENCY_DEFAULT", "INR")
    YEARLY_PLAN_DURATION_DAYS: int = int(os.getenv("YEARLY_PLAN_DURATION_DAYS", "365"))
    YEARLY_PLAN_ENABLED: bool = os.getenv("YEARLY_PLAN_ENABLED", "true").lower() == "true"
    YEARLY_PLAN_DESCRIPTION: str = os.getenv(
        "YEARLY_PLAN_DESCRIPTION",
        "Unlimited AI scene generation, priority cloud rendering, multi-aspect export, and Video Bible consistency for 1 full year."
    )
    PAYMENT_UPI_ID: str = os.getenv("PAYMENT_UPI_ID", "scenoraedits@upi")
    PAYMENT_UPI_QR_URL: str = os.getenv("PAYMENT_UPI_QR_URL", "/assets/payments/upi_qr.png")
    PAYMENT_BMC_URL: str = os.getenv("PAYMENT_BMC_URL", "https://buymeacoffee.com/scenoraedits")
    PAYMENTS_STORAGE_BACKEND: str = os.getenv("PAYMENTS_STORAGE_BACKEND", "firestore").strip().lower()



INSECURE_PLACEHOLDER_KEYS = {
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "scenora-default-master-encryption-key-256-bits-vault!",
    "0000000000000000000000000000000000000000000000000000000000000000",
}


def validate_security_configuration(current_settings: Optional[Settings] = None) -> None:
    """
    Validates security and cryptographic configuration before application startup.
    FAILS CLOSED in production if encryption key is missing or insecure,
    or if local filesystem persistence is attempted in production.
    """
    s = current_settings or settings
    is_prod = (
        s.ENVIRONMENT.lower() == "production"
        or os.getenv("SCENORA_ENV", "").lower() == "production"
        or any(k in os.environ for k in ("RENDER", "RENDER_SERVICE_ID", "RENDER_INSTANCE_ID", "RENDER_SERVICE_NAME"))
    )

    # 1. Validate Vault Backend in production
    if is_prod:
        if s.CREDENTIAL_VAULT_BACKEND != "firestore":
            raise RuntimeError(
                f"FATAL: In production, CREDENTIAL_VAULT_BACKEND must be 'firestore', "
                f"got '{s.CREDENTIAL_VAULT_BACKEND}'. "
                f"Local filesystem vault is strictly forbidden in production."
            )

    # 2. Validate Master Encryption Key
    raw_key = s.SCENORA_CREDENTIAL_ENCRYPTION_KEY.strip()
    if is_prod:
        if not raw_key:
            raise RuntimeError(
                "FATAL: SCENORA_CREDENTIAL_ENCRYPTION_KEY is required in production. "
                "System cannot start without a deterministic persistent 256-bit master key."
            )
        if raw_key in INSECURE_PLACEHOLDER_KEYS:
            raise RuntimeError(
                "FATAL: SCENORA_CREDENTIAL_ENCRYPTION_KEY is set to an insecure placeholder key in production. "
                "You must supply a cryptographically secure 256-bit key via environment variable."
            )
        # Check length & entropy: 64 hex characters (32 bytes) or 32 raw bytes
        if len(raw_key) == 64:
            try:
                bytes.fromhex(raw_key)
            except ValueError:
                raise RuntimeError("FATAL: SCENORA_CREDENTIAL_ENCRYPTION_KEY 64-char string is not valid hexadecimal.")
        elif len(raw_key.encode("utf-8")) == 32:
            pass
        else:
            raise RuntimeError(
                f"FATAL: SCENORA_CREDENTIAL_ENCRYPTION_KEY must be exactly 64 hex characters or 32 raw bytes (256 bits). "
                f"Got length {len(raw_key)}."
            )

        # 3. Validate Payments & Usage Storage Backends in production
        if s.PAYMENTS_STORAGE_BACKEND != "firestore":
            raise RuntimeError(
                f"FATAL: In production, PAYMENTS_STORAGE_BACKEND must be 'firestore', got '{s.PAYMENTS_STORAGE_BACKEND}'."
            )
        if s.USAGE_STORAGE_BACKEND != "firestore":
            raise RuntimeError(
                f"FATAL: In production, USAGE_STORAGE_BACKEND must be 'firestore', got '{s.USAGE_STORAGE_BACKEND}'."
            )

        # 4. Validate Provider Safety - No accidental mock providers in production
        if s.IMAGE_GENERATOR_PROVIDER == "mock":
            raise RuntimeError(
                "FATAL: In production, IMAGE_GENERATOR_PROVIDER cannot be 'mock'. "
                "Must be a real generator provider (e.g. 'pollinations', 'gemini', 'cloudflare', 'huggingface')."
            )
        if s.LLM_PROVIDER == "mock":
            raise RuntimeError(
                "FATAL: In production, LLM_PROVIDER cannot be 'mock'. "
                "Must be a real LLM provider (e.g. 'openrouter', 'gemini', 'openai')."
            )

        # 5. Validate Production CORS Restrictions
        if any(origin.strip() == "*" for origin in s.CORS_ORIGINS):
            raise RuntimeError("FATAL: In production, wildcard CORS ('*') is strictly forbidden.")

        # Sanitize CORS origins in production by eliminating localhost entries
        s.CORS_ORIGINS = [
            origin for origin in s.CORS_ORIGINS
            if not ("localhost" in origin.lower() or "127.0.0.1" in origin)
        ]

        # 6. Validate Firebase Service Account in production
        sa_key = (s.FIREBASE_SERVICE_ACCOUNT_KEY or "").strip()
        if not sa_key:
            raise RuntimeError(
                "FATAL: In production, FIREBASE_SERVICE_ACCOUNT_KEY is required to initialize "
                "Firebase Admin SDK and connect to Firestore/Firebase Storage."
            )
        if not os.path.exists(sa_key):
            try:
                import json
                sa_dict = json.loads(sa_key)
                if not isinstance(sa_dict, dict) or "project_id" not in sa_dict or "private_key" not in sa_dict:
                    raise ValueError("Missing required service account fields ('project_id', 'private_key').")
            except Exception as e:
                raise RuntimeError(
                    f"FATAL: FIREBASE_SERVICE_ACCOUNT_KEY in production is malformed: {e}. "
                    "Must be a valid service account JSON string or existing file path."
                )
    else:
        if not raw_key or raw_key in INSECURE_PLACEHOLDER_KEYS:
            import logging
            logger = logging.getLogger("scenora.security")
            logger.warning(
                "[DEV WARNING] SCENORA_CREDENTIAL_ENCRYPTION_KEY is using a development placeholder key. "
                "This is strictly forbidden in production."
            )


settings = Settings()



