import re
from typing import Optional

SECRET_PATTERNS = [
    # OpenAI, Anthropic, OpenRouter API keys
    re.compile(r"sk-(?:ant-|or-)?[a-zA-Z0-9_-]{16,}", re.IGNORECASE),
    # Google / Firebase API keys
    re.compile(r"AIza[a-zA-Z0-9_-]{25,}", re.IGNORECASE),
    # Hugging Face access tokens
    re.compile(r"hf_[a-zA-Z0-9_-]{16,}", re.IGNORECASE),
    # Cloudflare tokens
    re.compile(r"cfut_[a-zA-Z0-9_-]{20,}", re.IGNORECASE),
    # Generic Bearer tokens
    re.compile(r"(Bearer\s+)[a-zA-Z0-9_.-]{16,}", re.IGNORECASE),
    # URL query string secrets
    re.compile(r"((?:api[_-]?key|token|secret|key)=)[^&\s]{6,}", re.IGNORECASE),
    # Authorization header value patterns in text
    re.compile(r"((?:authorization|auth):\s*(?:bearer\s*)?)[^\s\"',;]{16,}", re.IGNORECASE),
    # PEM Private Keys (Firebase Admin / RSA / EC private keys)
    re.compile(r"-----BEGIN (?:[A-Z0-9_-]+\s+)?PRIVATE KEY-----[\s\S]+?-----END (?:[A-Z0-9_-]+\s+)?PRIVATE KEY-----", re.IGNORECASE),
    # JSON secret fields (passwords, tokens, vault secrets, api keys)
    re.compile(r'("(?:password|secret|api_key|apikey|token|private_key|key|client_secret)"\s*:\s*")[^"]+(")', re.IGNORECASE),
]

def sanitize_secrets(text: Optional[str]) -> str:
    """
    Sanitizes API keys, tokens, and authorization credentials from error strings,
    tracebacks, or log messages, replacing them with [REDACTED].
    """
    if not text:
        return ""
    sanitized = str(text)
    for pattern in SECRET_PATTERNS:
        # If group matched, preserve label and redact secret part
        def _replace_match(m):
            if len(m.groups()) > 0 and m.group(1):
                return f"{m.group(1)}[REDACTED]"
            return "[REDACTED]"
        sanitized = pattern.sub(_replace_match, sanitized)
    return sanitized

def generate_key_hint(secret: Optional[str]) -> str:
    """
    Generates a secure masked key hint displaying only the final 4 characters.
    Example: '••••••••ABCD'. Never exposes prefix or sufficient material to guess the secret.
    """
    if not secret:
        return "Not configured"
    clean = secret.strip()
    if len(clean) <= 6:
        return "••••••••"
    last_four = clean[-4:]
    return f"••••••••{last_four}"
