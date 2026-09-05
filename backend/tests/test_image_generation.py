import pytest
import io
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
    assert scene.image_metadata["aspect_ratio"] == "16:9"
    assert scene.image_metadata["width"] == 1024
    assert scene.image_metadata["height"] == 576
    assert "character:Aoi" in scene.image_metadata.get("references_used", [])

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
