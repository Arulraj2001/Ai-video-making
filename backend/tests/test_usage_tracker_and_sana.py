import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.usage_tracker_service import UsageTrackerService, usage_tracker
from app.services.image_generation.sana_generator import SanaLocalImageGenerator
from app.services.image_generation.factory import get_model_catalog, get_available_providers, get_image_generator
from app.services.image_generation.base import ImageGenerationOptions

client = TestClient(app)

def test_usage_tracker_counts_and_limits(tmp_path):
    tracker = UsageTrackerService(storage_dir=str(tmp_path))
    
    # Initial status
    status = tracker.get_provider_usage("cloudflare")
    assert status["used_today"] == 0
    assert status["estimated_daily_limit"] == 25
    assert status["remaining_today"] == 25
    assert status["is_exhausted"] is False

    # Record 3 successful generations
    tracker.record_call("cloudflare", success=True, status_code=200)
    tracker.record_call("cloudflare", success=True, status_code=200)
    tracker.record_call("cloudflare", success=True, status_code=200)

    status = tracker.get_provider_usage("cloudflare")
    assert status["used_today"] == 3
    assert status["remaining_today"] == 22
    assert status["is_exhausted"] is False

def test_usage_tracker_429_quota_exhaustion(tmp_path):
    tracker = UsageTrackerService(storage_dir=str(tmp_path))
    
    # Record a 429 quota exhaustion
    tracker.record_call("cloudflare", success=False, status_code=429)

    status = tracker.get_provider_usage("cloudflare")
    assert status["is_exhausted"] is True
    assert status["remaining_today"] == 0

def test_usage_tracker_get_all(tmp_path):
    tracker = UsageTrackerService(storage_dir=str(tmp_path))
    all_usage = tracker.get_all_usage()
    assert "cloudflare" in all_usage
    assert "pollinations" in all_usage
    assert "sana_local" in all_usage

def test_sana_generator_capabilities_and_offline_handling():
    gen = SanaLocalImageGenerator(base_url="http://127.0.0.1:9999") # non-existent port
    assert gen.capabilities.provider_name == "sana_local"
    assert "16:9" in gen.capabilities.supported_aspect_ratios

    # Attempting to generate on an offline server should raise a clean informative message
    options = ImageGenerationOptions(aspect_ratio="16:9", width=1024, height=576)
    with pytest.raises(RuntimeError) as exc_info:
        import asyncio
        asyncio.run(gen.generate_image("A futuristic city", options))
    
    assert "Local SANA" in str(exc_info.value)
    assert "python scripts/sana_server.py" in str(exc_info.value)

def test_factory_sana_local_registered():
    providers = get_available_providers()
    assert "sana_local" in providers

    generator = get_image_generator(provider_name="sana_local")
    assert isinstance(generator, SanaLocalImageGenerator)

def test_model_catalog_categories():
    catalog = get_model_catalog()
    model_ids = [m["id"] for m in catalog]
    assert "sana-sprint-local" in model_ids
    assert "cf-flux-schnell" in model_ids

    # Verify categories are populated
    categories = {m.get("category") for m in catalog}
    assert "free_cloud" in categories
    assert "quota_cloud" in categories
    assert "local" in categories
    assert "mock" in categories
    assert "paid_cloud" in categories

def test_api_usage_stats_endpoint():
    res = client.get("/api/images/usage-stats")
    assert res.status_code == 200
    data = res.json()
    assert "cloudflare" in data
    assert "used_today" in data["cloudflare"]
    assert "estimated_daily_limit" in data["cloudflare"]

def test_api_models_endpoint_has_categories():
    res = client.get("/api/images/models")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    sana_model = next((m for m in data["models"] if m["provider"] == "sana_local"), None)
    assert sana_model is not None
    assert sana_model["category"] == "local"
