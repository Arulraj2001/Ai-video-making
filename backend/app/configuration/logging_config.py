import logging
import os
import sys
from app.utils.security import sanitize_secrets

class SensitiveDataFilter(logging.Filter):
    """
    Sanitizes API keys, tokens, and credentials from log records so that
    secrets never appear in logs or exception traces.
    """
    def __init__(self, secrets: list[str] | None = None):
        super().__init__()
        self._secrets: list[str] = [s for s in (secrets or []) if s and len(s) >= 4]

    def add_secret(self, secret: str) -> None:
        if secret and len(secret) >= 4 and secret not in self._secrets:
            self._secrets.append(secret)

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            # 1. Regex scrubbing for unknown keys, Bearer tokens, headers
            record.msg = sanitize_secrets(record.msg)
            # 2. Known static environment secret replacement
            for secret in self._secrets:
                if secret in record.msg:
                    record.msg = record.msg.replace(secret, "[REDACTED_SECRET]")
        if record.args:
            if isinstance(record.args, dict):
                cleaned = {}
                for k, v in record.args.items():
                    if isinstance(v, str):
                        v = sanitize_secrets(v)
                        for secret in self._secrets:
                            v = v.replace(secret, "[REDACTED_SECRET]")
                    cleaned[k] = v
                record.args = cleaned
            elif isinstance(record.args, tuple):
                cleaned_args = []
                for arg in record.args:
                    if isinstance(arg, str):
                        arg = sanitize_secrets(arg)
                        for secret in self._secrets:
                            arg = arg.replace(secret, "[REDACTED_SECRET]")
                    cleaned_args.append(arg)
                record.args = tuple(cleaned_args)
        return True

def setup_logging():
    """Configures structured application logging with sensitive data redaction."""
    log_level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    log_level = getattr(logging, log_level_name, logging.INFO)

    log_format = "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    # Known sensitive environment variables to redact
    sensitive_keys = [
        os.getenv("GEMINI_API_KEY", ""),
        os.getenv("CLOUDFLARE_API_TOKEN", ""),
        os.getenv("CF_API_TOKEN", ""),
        os.getenv("HUGGINGFACE_API_KEY", ""),
        os.getenv("HF_API_KEY", ""),
        os.getenv("OPENROUTER_API_KEY", ""),
        os.getenv("OpenRouter_key", ""),
        os.getenv("LLM_API_KEY", "")
    ]
    redaction_filter = SensitiveDataFilter(sensitive_keys)

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.addFilter(redaction_filter)

    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format=log_format,
        datefmt=date_format,
        handlers=[stream_handler],
        force=True
    )

    # Set third-party loggers to reasonable levels
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("PIL").setLevel(logging.WARNING)

    logger = logging.getLogger("ai_video_maker")
    logger.addFilter(redaction_filter)
    logger.info(f"Logging initialized with level: {log_level_name} (secret redaction active)")
    return logger

