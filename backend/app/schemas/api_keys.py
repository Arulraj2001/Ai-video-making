from typing import Optional, List
from pydantic import BaseModel, Field

class SaveApiKeyRequest(BaseModel):
    provider: str = Field(..., min_length=2, max_length=50, description="Provider identifier (gemini, openai, anthropic, openrouter, huggingface, cloudflare)")
    api_key: str = Field(..., min_length=4, max_length=512, description="Secret API key")
    label: Optional[str] = Field(default=None, max_length=80, description="Custom label")
    account_id: Optional[str] = Field(default=None, max_length=120, description="Cloudflare Account ID (for cloudflare provider only)")

class ApiKeyMetadataResponse(BaseModel):
    provider: str
    label: str
    category: str  # "image", "llm", "multimodal", "local_gpu"
    configured: bool
    key_hint: Optional[str] = None
    account_id_hint: Optional[str] = None
    status: str = "active"  # "active", "unconfigured", "error"
    validation_status: str = "untested"  # "valid", "untested", "invalid"
    updated_at: Optional[str] = None
    supported_models: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    has_app_default: bool = False

class ApiKeyListResponse(BaseModel):
    providers: List[ApiKeyMetadataResponse]

class TestApiKeyResponse(BaseModel):
    provider: str
    valid: bool
    message: str
