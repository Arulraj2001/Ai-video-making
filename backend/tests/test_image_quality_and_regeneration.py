"""
Phase 6 — Image Generation Quality, Regeneration & Variations Test Suite.
Verifies regeneration seed mutation, structured A/B/C variations,
batch generation failure isolation, retry-failed preservation, and negative guidance.
"""
import pytest
from unittest.mock import AsyncMock, patch

from app.models.project import ProjectModel
from app.models.scene import SceneModel
from app.models.video_bible import VideoBibleModel, OverallStyleModel, CharacterModel
from app.services.scene_image_service import scene_image_service, _derive_scene_seed
from app.services.visual_style_engine import list_style_presets, get_style_preset
from app.services.image_generation.base import GeneratedImageResult, ProviderCapabilities, ImageGenerationOptions
from app.services.image_generation.mock_generator import MockImageGenerator


from app.services.project_service import project_service


@pytest.fixture
def test_project(tmp_path, monkeypatch):
    monkeypatch.setattr("app.services.project_service.PROJECTS_DIR", tmp_path)
    monkeypatch.setattr("app.services.scene_image_service.STORAGE_DIR", tmp_path)
    monkeypatch.setattr("app.configuration.config.settings.IMAGE_GENERATOR_PROVIDER", "mock")
    project_service._projects.clear()

    bob = CharacterModel(
        id="char-bob",
        name="Bob",
        description="data analyst",
        appearance="man with round glasses",
        clothing="white shirt and blue tie",
    )
    scenes = [
        SceneModel(
            id="scene-01",
            start=0.0,
            end=5.0,
            duration=5.0,
            caption="Bob arrives at his desk.",
            visual_description="Bob sitting down comfortably at his office desk.",
        ),
        SceneModel(
            id="scene-02",
            start=5.0,
            end=10.0,
            duration=5.0,
            caption="Bob studies a financial chart.",
            visual_description="Bob analyzing financial charts on his monitor.",
        ),
        SceneModel(
            id="scene-03",
            start=10.0,
            end=15.0,
            duration=5.0,
            caption="Bob completes his analysis.",
            visual_description="Bob leaning back happily having finished his work.",
        ),
    ]
    proj = ProjectModel(
        id="proj-quality-test",
        name="Quality and Regeneration Test",
        video_bible=VideoBibleModel(
            overall_style=OverallStyleModel(visual_style="cinematic"),
            characters=[bob],
        ),
        scenes=scenes,
    )
    project_service._projects[proj.id] = proj
    return proj


def test_seed_derivation_iteration_variation():
    """Verify that advancing iteration yields distinct, deterministic seeds."""
    proj_id = "test-proj"
    scene_id = "scene-1"
    text = "Bob drinks coffee"

    seed_0 = _derive_scene_seed(proj_id, scene_id, text, iteration=0)
    seed_1 = _derive_scene_seed(proj_id, scene_id, text, iteration=1)
    seed_2 = _derive_scene_seed(proj_id, scene_id, text, iteration=2)

    # Determinism
    assert seed_0 == _derive_scene_seed(proj_id, scene_id, text, iteration=0)
    assert seed_1 == _derive_scene_seed(proj_id, scene_id, text, iteration=1)

    # Variation across regenerations
    assert seed_0 != seed_1
    assert seed_1 != seed_2
    assert seed_0 != seed_2


@pytest.mark.anyio
async def test_regeneration_advances_count_and_produces_new_seed(test_project):
    """Verify that force=True increments regeneration_count and updates seed in metadata."""
    generator = MockImageGenerator()

    # Initial generation (iteration 0)
    s1 = await scene_image_service.generate_scene_image(
        project=test_project,
        scene_id="scene-01",
        force=False,
        generator=generator,
    )
    assert s1.image_status == "completed"
    seed_initial = s1.image_metadata.get("seed")
    assert s1.image_metadata.get("regeneration_count", 0) == 0

    # First regeneration (force=True)
    s1_regen1 = await scene_image_service.generate_scene_image(
        project=test_project,
        scene_id="scene-01",
        force=True,
        generator=generator,
    )
    seed_regen1 = s1_regen1.image_metadata.get("seed")
    assert s1_regen1.image_metadata.get("regeneration_count") == 1
    assert seed_initial != seed_regen1

    # Second regeneration (force=True)
    s1_regen2 = await scene_image_service.generate_scene_image(
        project=test_project,
        scene_id="scene-01",
        force=True,
        generator=generator,
    )
    seed_regen2 = s1_regen2.image_metadata.get("seed")
    assert s1_regen2.image_metadata.get("regeneration_count") == 2
    assert seed_regen1 != seed_regen2


@pytest.mark.anyio
async def test_variations_abc_generation(test_project):
    """Verify generate_scene_variations produces 3 candidate images with distinct framing and seeds."""
    variations = await scene_image_service.generate_scene_variations(
        project=test_project,
        scene_id="scene-01",
        count=3,
        provider_name="mock",
    )

    assert len(variations) == 3
    var_ids = [v["id"] for v in variations]
    assert var_ids == ["var-A", "var-B", "var-C"]

    # Framing directives must differ
    framings = [v["metadata"]["framing"] for v in variations]
    assert "Medium framing" in framings[0]
    assert "Dynamic wide" in framings[1]
    assert "close-up" in framings[2].lower()

    # Seeds must all be distinct
    seeds = [v["seed"] for v in variations]
    assert len(set(seeds)) == 3

    # All variations have valid image urls
    for v in variations:
        assert v["image_url"].startswith("/media/")
        assert v["image_url"].endswith((".png", ".jpg"))


@pytest.mark.anyio
async def test_batch_generation_failure_isolation(test_project):
    """
    Verify fault tolerance in batch generation:
    If scene 2 fails, scene 1 and scene 3 succeed and retain status 'completed',
    while scene 2 receives status 'failed' with error details.
    """
    mock_gen = MockImageGenerator()

    # Wrap generate_image so that scene-02 fails
    orig_generate = mock_gen.generate_image

    async def flaky_generate(prompt, options, **kwargs):
        if prompt.startswith("Scene: Bob analyzing financial charts"):
            raise ConnectionError("Simulated upstream provider timeout on Scene 2")
        return await orig_generate(prompt, options, **kwargs)

    mock_gen.generate_image = AsyncMock(side_effect=flaky_generate)

    results = await scene_image_service.generate_all_scene_images(
        project=test_project,
        force=True,
        generator=mock_gen,
    )

    assert len(results) == 3
    # Scene 1: Success
    assert results[0].id == "scene-01"
    assert results[0].image_status == "completed"
    assert results[0].image_url is not None

    # Scene 2: Isolated Failure
    assert results[1].id == "scene-02"
    assert results[1].image_status == "failed"
    assert "Simulated upstream provider timeout" in (results[1].image_error or "")

    # Scene 3: Success
    assert results[2].id == "scene-03"
    assert results[2].image_status == "completed"
    assert results[2].image_url is not None


@pytest.mark.anyio
async def test_retry_failed_preserves_successful(test_project):
    """
    Verify that retry_failed_scene_images only regenerates failed scenes
    and strictly leaves successful scenes untouched.
    """
    generator = MockImageGenerator()

    # Step 1: Ensure Scene 1 and Scene 3 are completed, Scene 2 is failed
    test_project.scenes[0].image_status = "completed"
    test_project.scenes[0].image_url = "/media/test/images/scene_1_original.png"
    original_s1_url = test_project.scenes[0].image_url

    test_project.scenes[1].image_status = "failed"
    test_project.scenes[1].image_error = "Previous timeout"
    test_project.scenes[1].image_url = None

    test_project.scenes[2].image_status = "completed"
    test_project.scenes[2].image_url = "/media/test/images/scene_3_original.png"
    original_s3_url = test_project.scenes[2].image_url

    # Step 2: Run retry
    results = await scene_image_service.retry_failed_scene_images(
        project=test_project,
        generator=generator,
    )

    # Scene 1 was preserved untouched
    assert results[0].image_url == original_s1_url
    assert results[0].image_status == "completed"

    # Scene 2 was retried and is now completed
    assert results[1].image_status == "completed"
    assert results[1].image_url is not None
    assert results[1].image_error is None

    # Scene 3 was preserved untouched
    assert results[2].image_url == original_s3_url
    assert results[2].image_status == "completed"


def test_negative_guidance_comprehensiveness():
    """Verify that all 10 normalized visual style presets prevent watermarks, text, logos, and blurriness."""
    presets = list_style_presets()
    assert len(presets) >= 10

    for p_info in presets:
        preset = get_style_preset(p_info["id"])
        neg = preset.negative_prompt.lower()

        assert "text" in neg, f"Style '{preset.id}' missing 'text' negative guidance"
        assert "watermark" in neg, f"Style '{preset.id}' missing 'watermark' negative guidance"
        assert "logo" in neg or "logos" in neg, f"Style '{preset.id}' missing 'logo' negative guidance"
        assert "blurry" in neg or "distorted" in neg, f"Style '{preset.id}' missing visual defect negative guidance"
