import pytest
import io
import base64
import json
import httpx
from pathlib import Path
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.models.scene import SceneModel
from app.models.video_bible import OverallStyleModel, CharacterModel, LocationModel
from app.schemas.project import ProjectCreate, GenerateImageRequest
from app.services.project_service import project_service
from app.services.image_generation.mock_generator import MockImageGenerator
from app.services.image_generation.cloudflare_generator import CloudflareImageGenerator
from app.services.image_generation.huggingface_generator import HuggingFaceImageGenerator
from app.services.image_generation.factory import get_image_generator
from app.services.image_generation.base import ImageGenerationOptions, ImageReference
from app.services.scene_image_service import scene_image_service
from app.services.image_generation.pollinations_generator import PollinationsImageGenerator
from app.services.image_generation.gemini_generator import GeminiImageGenerator
from app.configuration.config import settings

client = TestClient(app)

@pytest.fixture
def project_with_storyboard(tmp_path, monkeypatch):
    monkeypatch.setattr("app.services.project_service.PROJECTS_DIR", tmp_path)
    monkeypatch.setattr("app.services.scene_image_service.STORAGE_DIR", tmp_path)
    monkeypatch.setattr("app.configuration.config.settings.IMAGE_GENERATOR_PROVIDER", "mock")
    project_service._projects.clear()

    project = project_service.create_project(
        ProjectCreate(
            name="Neo Cyber Tokyo",
            description="Cyberpunk investigation"
        )
    )

    # Set up Video Bible
    project.video_bible.overall_style = OverallStyleModel(
        visual_style="Cyberpunk Anime Aesthetic",
        realism_level="Stylized 2D Animation",
        color_treatment="Vibrant cyan and neon pink",
        lighting="Reflective wet streets under neon rain",
        camera_style="Wide-angle dynamic composition",
        lens_cinematography="Anamorphic anime cinematography",
        mood="High-octane and mysterious"
    )

    project.video_bible.characters.append(
        CharacterModel(
            id="char-001",
            name="Aoi",
            description="Infiltration specialist",
            appearance="Short blue hair, glowing neural goggles",
            clothing="Tactical dark blue windbreaker",
            age_range="Early 20s",
            personality="Calculated and stealthy"
        )
    )

    project.video_bible.locations.append(
        LocationModel(
            id="loc-001",
            name="Akira Alleyway",
            description="Narrow backstreet lined with ramen stalls",
            environment="Wet pavement, steam rising from grates",
            lighting="Pulsing neon signs reflecting in puddles"
        )
    )

    # Add 3 storyboard scenes
    scenes = [
        SceneModel(
            id="scene-001",
            start=0.0,
            end=5.0,
            duration=5.0,
            caption="Aoi steps out into the neon alleyway.",
            visual_description="Aoi emerging from shadows in Akira Alleyway with glowing goggles.",
            image_prompt="Cyberpunk Anime, Aoi with glowing goggles walking down Akira Alleyway in rain, 16:9 widescreen composition --no text",
            suggested_motion="Slow dolly forward",
            suggested_transition="Cut",
            image_status="pending"
        ),
        SceneModel(
            id="scene-002",
            start=5.0,
            end=10.0,
            duration=5.0,
            caption="She scans the surrounding rooftops for surveillance drones.",
            visual_description="Low-angle view of rain falling past towering neon facades.",
            image_prompt="Low-angle shot looking up past rainy rooftops with surveillance drones, neon atmosphere, 16:9 composition --no text",
            suggested_motion="Tilt up smoothly",
            suggested_transition="Match cut",
            image_status="pending"
        ),
        SceneModel(
            id="scene-003",
            start=10.0,
            end=15.0,
            duration=5.0,
            caption="A cipher code flashes across her vision.",
            visual_description="Close-up of cybernetic eye HUD glitching.",
            image_prompt="Extreme close up of cybernetic ocular HUD reflection in rain, [TRIGGER_FAILURE] simulated glitch, 16:9 composition",
            suggested_motion="Static macro hold",
            suggested_transition="Cross dissolve",
            image_status="pending"
        ),
    ]
    project.scenes = scenes
    project_service._save_to_disk(project)
    return project

@pytest.mark.anyio
async def test_mock_image_generator_output():
    """Verify MockImageGenerator creates valid image bytes with correct 16:9 dimensions."""
    generator = MockImageGenerator(model_name="mock-cinematic-v1")
    options = ImageGenerationOptions(aspect_ratio="16:9", width=1024, height=576)
    
    result = await generator.generate_image("A futuristic city at dusk", options)
    assert result.content_type == "image/png"
    assert result.provider == "mock"
    assert result.model == "mock-cinematic-v1"
    assert len(result.image_bytes) > 0

    # Verify Pillow can open the bytes and dimensions match
    img = Image.open(io.BytesIO(result.image_bytes))
    assert img.size == (1024, 576)

@pytest.mark.anyio
async def test_mock_image_generator_with_references():
    """Verify MockImageGenerator handles entity reference metadata."""
    generator = MockImageGenerator()
    options = ImageGenerationOptions(aspect_ratio="16:9", width=1024, height=576)
    refs = [
        ImageReference(entity_type="character", entity_name="Aoi", description="Blue hair"),
        ImageReference(entity_type="location", entity_name="Akira Alleyway", description="Neon alley")
    ]
    result = await generator.generate_image_with_references("Scene with Aoi in Akira Alleyway", refs, options)
    assert result.provider == "mock"
    assert len(result.metadata.get("references_used", [])) == 2

def test_cloudflare_and_hf_initialization_and_security():
    """Verify provider adapters require credentials and do not expose tokens."""
    with pytest.raises(ValueError, match="Cloudflare account_id and api_token are required"):
        CloudflareImageGenerator(account_id="", api_token="")

    with pytest.raises(ValueError, match="Hugging Face api_key is required"):
        HuggingFaceImageGenerator(api_key="")

    cf = CloudflareImageGenerator(account_id="fake-account", api_token="secret-token-cf")
    assert cf.capabilities.provider_name == "cloudflare"
    assert cf.capabilities.supports_reference_images is False
    assert "secret-token-cf" not in str(cf.capabilities)

    hf = HuggingFaceImageGenerator(api_key="secret-token-hf")
    assert hf.capabilities.provider_name == "huggingface"
    assert hf.capabilities.supports_reference_images is False
    assert "secret-token-hf" not in str(hf.capabilities)

def test_explicit_model_is_not_replaced_by_style():
    """Style changes prompt treatment but must not silently select another model."""
    generator = PollinationsImageGenerator(style_mode="stickfigure", model_name="flux")
    options = ImageGenerationOptions(aspect_ratio="16:9", width=1024, height=576)

    assert generator.capabilities.model_name == "flux"
    assert "model=flux" in generator._build_url("a person", options, style_mode="stickfigure")

def test_unsupported_provider_model_pair_fails_clearly():
    with pytest.raises(ValueError, match="Unsupported model"):
        get_image_generator(provider_name="pollinations", model_name="mock-stickfigure-v1")

def test_gemini_requires_key_and_routes_requested_model(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    with pytest.raises(ValueError, match="Gemini API key missing"):
        get_image_generator(provider_name="gemini", model_name="gemini-3.1-flash-image")

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    generator = get_image_generator(provider_name="gemini", model_name="gemini-3.1-flash-image")
    assert isinstance(generator, GeminiImageGenerator)
    assert generator.capabilities.provider_name == "gemini"
    assert generator.capabilities.model_name == "gemini-3.1-flash-image"
    assert generator.capabilities.supports_reference_images is True
    assert generator.capabilities.supports_seed is False
    assert generator.capabilities.supported_aspect_ratios == ["16:9", "9:16", "1:1"]

def test_gemini_rejects_unsupported_model(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    with pytest.raises(ValueError, match="Unsupported Gemini image model"):
        get_image_generator(provider_name="gemini", model_name="gemini-other-image")

@pytest.mark.anyio
async def test_gemini_mocked_image_response_and_aspect_ratio():
    image_bytes = b"fake-gemini-image"

    async def handler(request):
        body = json.loads(request.content)
        assert body["model"] == "gemini-3.1-flash-image"
        assert body["response_format"]["aspect_ratio"] == "9:16"
        assert body["response_format"]["type"] == "image"
        assert request.headers["x-goog-api-key"] == "test-key"
        return httpx.Response(200, json={
            "output_image": {
                "data": base64.b64encode(image_bytes).decode("ascii"),
                "mime_type": "image/jpeg",
            }
        })

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        generator = GeminiImageGenerator(api_key="test-key", http_client=client)
        result = await generator.generate_image(
            "structured scene prompt",
            ImageGenerationOptions(aspect_ratio="9:16", width=576, height=1024),
        )

    assert result.image_bytes == image_bytes
    assert result.provider == "gemini"
    assert result.model == "gemini-3.1-flash-image"
    assert result.metadata["aspect_ratio"] == "9:16"
    assert result.metadata["seed_supported"] is False

@pytest.mark.anyio
async def test_gemini_reference_input_is_sent_and_metadata_recorded(tmp_path):
    reference_path = tmp_path / "aoi.png"
    reference_path.write_bytes(b"reference-image")
    reference = ImageReference(
        entity_type="character",
        entity_name="Aoi",
        image_path=str(reference_path),
        description="blue hair",
    )

    async def handler(request):
        body = json.loads(request.content)
        assert isinstance(body["input"], list)
        assert body["input"][1]["type"] == "image"
        assert base64.b64decode(body["input"][1]["data"]) == b"reference-image"
        return httpx.Response(200, json={
            "output_image": {
                "data": base64.b64encode(b"generated").decode("ascii"),
                "mime_type": "image/jpeg",
            }
        })

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        result = await GeminiImageGenerator(api_key="test-key", http_client=client).generate_image_with_references(
            "scene prompt", [reference], ImageGenerationOptions(aspect_ratio="1:1", width=1024, height=1024)
        )

    assert result.metadata["reference_mode"] == "image"
    assert result.metadata["references_used"] == ["Aoi"]

@pytest.mark.anyio
async def test_gemini_malformed_and_api_error_responses():
    async def malformed_handler(request):
        return httpx.Response(200, json={"steps": []})

    async with httpx.AsyncClient(transport=httpx.MockTransport(malformed_handler)) as client:
        with pytest.raises(RuntimeError, match="no generated image"):
            await GeminiImageGenerator(api_key="test-key", http_client=client).generate_image(
                "prompt", ImageGenerationOptions()
            )

    async def quota_handler(request):
        return httpx.Response(429, json={"error": {"message": "quota exceeded"}})

    async with httpx.AsyncClient(transport=httpx.MockTransport(quota_handler)) as client:
        with pytest.raises(RuntimeError, match="quota or rate limit"):
            await GeminiImageGenerator(api_key="test-key", http_client=client).generate_image(
                "prompt", ImageGenerationOptions()
            )

@pytest.mark.anyio
async def test_gemini_health_check_states():
    async def ready_handler(request):
        return httpx.Response(200, json={"name": "models/gemini-3.1-flash-image"})

    async with httpx.AsyncClient(transport=httpx.MockTransport(ready_handler)) as client:
        health = await GeminiImageGenerator(api_key="test-key", http_client=client).check_health()
    assert health["status"] == "ready"

    async def invalid_handler(request):
        return httpx.Response(401, json={"error": {"message": "invalid key"}})

    async with httpx.AsyncClient(transport=httpx.MockTransport(invalid_handler)) as client:
        health = await GeminiImageGenerator(api_key="test-key", http_client=client).check_health()
    assert health["status"] == "invalid_key"

@pytest.mark.anyio
async def test_project_aspect_ratio_controls_generated_dimensions(project_with_storyboard, tmp_path):
    for aspect_ratio, expected_size in (("16:9", (1024, 576)), ("9:16", (576, 1024)), ("1:1", (1024, 1024))):
        project_with_storyboard.canvas_settings.aspect_ratio = aspect_ratio
        project_with_storyboard.scenes[0].image_status = "pending"
        project_with_storyboard.scenes[0].image_url = None
        project_with_storyboard.scenes[0].image_path = None
        project_with_storyboard.scenes[0].image_metadata = None
        scene = await scene_image_service.generate_scene_image(
            project=project_with_storyboard,
            scene_id="scene-001",
            force=True,
            provider_name="mock",
            model_name="mock-cinematic-v1",
        )
        image_path = tmp_path / Path(scene.image_path).relative_to("storage")
        with image_path.open("rb") as image_file:
            image = Image.open(image_file)
            assert image.size == expected_size
        assert scene.image_metadata["aspect_ratio"] == aspect_ratio
        assert (scene.image_metadata["width"], scene.image_metadata["height"]) == expected_size

@pytest.mark.anyio
async def test_generation_metadata_records_style_references_and_continuity(project_with_storyboard):
    project_with_storyboard.canvas_settings.aspect_ratio = "9:16"
    scene = await scene_image_service.generate_scene_image(
        project=project_with_storyboard,
        scene_id="scene-001",
        force=True,
        style_mode="stickfigure",
        provider_name="mock",
        model_name="mock-stickfigure-v1",
    )

    assert scene.image_metadata["style_id"] == "stickfigure"
    # This fixture has no uploaded reference asset, so no reference conditioning
    # or reference-description fallback is expected.
    assert scene.image_metadata["reference_mode"] == "none"
    assert "char-001" in scene.image_metadata["reference_entities"]
    assert scene.image_metadata["prompt_hash"]

@pytest.mark.anyio
async def test_variations_preserve_context_and_return_metadata(project_with_storyboard):
    variations = await scene_image_service.generate_scene_variations(
        project=project_with_storyboard,
        scene_id="scene-001",
        count=2,
        style_mode="cinematic",
        provider_name="mock",
        model_name="mock-cinematic-v1",
    )

    assert len(variations) == 2
    assert variations[0]["seed"] != variations[1]["seed"]
    assert variations[0]["metadata"]["style_id"] == "cinematic"
    assert variations[0]["metadata"]["reference_mode"] == "none"

def test_capabilities_api_endpoint_never_exposes_secrets():
    """Verify GET /api/images/capabilities returns safe public metadata only."""
    response = client.get("/api/images/capabilities")
    assert response.status_code == 200
    data = response.json()
    assert "provider" in data
    assert "model" in data
    assert "supports_reference_images" in data
    assert "supported_aspect_ratios" in data
    assert "16:9" in data["supported_aspect_ratios"]
    assert "available_providers" in data

    # Verify no credentials leaked
    body_str = response.text.lower()
    assert "secret" not in body_str
    assert "token" not in body_str
    assert "api_key" not in body_str
    assert "password" not in body_str

@pytest.mark.anyio
async def test_single_scene_image_generation(project_with_storyboard):
    """Test successful image generation for a single scene and disk persistence."""
    scene = await scene_image_service.generate_scene_image(
        project=project_with_storyboard,
        scene_id="scene-001"
    )
    assert scene.image_status == "completed"
    assert scene.image_url is not None
    assert scene.image_url.startswith(f"/media/{project_with_storyboard.id}/images/")
    assert scene.image_error is None
    assert scene.image_metadata is not None
    assert project_with_storyboard.canvas_settings.aspect_ratio == "9:16"
    assert scene.image_metadata["aspect_ratio"] == "9:16"
    assert scene.image_metadata["width"] == 576
    assert scene.image_metadata["height"] == 1024
    assert scene.image_metadata["reference_mode"] == "none"
    assert scene.image_metadata.get("references_used", []) == []

@pytest.mark.anyio
async def test_single_scene_regeneration(project_with_storyboard):
    """Test regenerating a single scene without affecting other scenes."""
    # First generation
    s1 = await scene_image_service.generate_scene_image(project_with_storyboard, "scene-001")
    url_first = s1.image_url

    # Scene 2 is still pending
    assert project_with_storyboard.scenes[1].image_status == "pending"

    # Regenerate scene 1 with force=True
    s1_regen = await scene_image_service.generate_scene_image(
        project=project_with_storyboard,
        scene_id="scene-001",
        force=True,
        prompt_override="High-angle shot of Aoi in pouring rain"
    )
    assert s1_regen.image_status == "completed"
    assert project_with_storyboard.scenes[1].image_status == "pending"

@pytest.mark.anyio
async def test_batch_generation_with_fault_tolerance(project_with_storyboard):
    """
    Test Generate All images where Scene 3 triggers a simulated failure ([TRIGGER_FAILURE]).
    Critical Requirement: If one scene fails, the remaining scenes MUST continue!
    """
    results = await scene_image_service.generate_all_scene_images(
        project=project_with_storyboard,
        force=True
    )

    assert len(results) == 3
    # Scene 1 and Scene 2 should succeed
    assert results[0].image_status == "completed"
    assert results[0].image_url is not None
    assert results[1].image_status == "completed"
    assert results[1].image_url is not None

    # Scene 3 triggered failure, but scenes 1 & 2 completed fine!
    assert results[2].image_status == "failed"
    assert results[2].image_error is not None
    assert "Simulated image generation failure" in results[2].image_error

def test_api_generate_endpoints(project_with_storyboard):
    """Test REST endpoints for generating single image and Generate All."""
    # 1. Single scene endpoint
    resp1 = client.post(
        f"/api/projects/{project_with_storyboard.id}/scenes/scene-001/generate-image",
        json={"force": True}
    )
    assert resp1.status_code == 200
    s1_data = resp1.json()
    assert s1_data["image_status"] == "completed"
    assert s1_data["image_url"] is not None

    # 2. Batch endpoint
    resp_all = client.post(
        f"/api/projects/{project_with_storyboard.id}/scenes/generate-all-images",
        json={"force": True}
    )
    assert resp_all.status_code == 200
    batch_data = resp_all.json()
    assert batch_data["total_scenes"] == 3
    assert batch_data["completed_count"] == 2  # Scene 1 and 2 succeed
    assert batch_data["failed_count"] == 1     # Scene 3 triggers simulated failure
