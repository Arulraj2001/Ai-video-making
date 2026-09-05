"""
Comprehensive test suite for Phase 4 Visual Prompt Pipeline Correction.
Verifies prompt ordering, style rule filtering, character identity sanitization,
aspect ratio framing, scene seed variation, and custom style handling.
"""
import pytest
from app.models.project import ProjectModel
from app.models.scene import SceneModel
from app.models.video_bible import (
    VideoBibleModel,
    OverallStyleModel,
    CharacterModel,
    LocationModel,
    ObjectModel,
)
from app.services.visual_style_engine import (
    build_scene_prompt,
    resolve_scene_context,
    get_style_preset,
    normalize_style_id,
    list_style_presets,
    composition_guidance,
    _PHOTOGRAPHIC_CONFLICT_RULES,
    _NON_PHOTOGRAPHIC_STYLES,
)
from app.services.scene_image_service import _derive_scene_seed


@pytest.fixture
def bible_project():
    return ProjectModel(
        id="proj-prompt-test",
        name="Visual Prompt Test",
        video_bible=VideoBibleModel(
            overall_style=OverallStyleModel(
                visual_style="cinematic",
                realism_level="cinematic realism",
                lighting="dramatic chiaroscuro",
                color_treatment="cool teal and orange",
                camera_style="dynamic handheld",
                lens_cinematography="35mm anamorphic prime",
                mood="tense and cinematic",
            ),
            rules=[
                "cinematic",
                "realistic",
                "documentary",
                "35mm photography",
                "film still",
                "consistent lighting",
                "high production value",
            ],
            characters=[
                CharacterModel(
                    id="char-bob",
                    name="Bob",
                    description="protagonist",
                    appearance="a simple stick figure man with round head and line limbs",
                    clothing="blue tie",
                    personality="curious and analytical",
                )
            ],
            locations=[
                LocationModel(
                    id="loc-office",
                    name="Modern Office",
                    environment="glass-walled conference room",
                    lighting="overhead soft fluorescent",
                )
            ],
            objects=[
                ObjectModel(
                    id="obj-mug",
                    name="Coffee Mug",
                    description="ceramic red mug with steam",
                )
            ],
        ),
        scenes=[
            SceneModel(
                id="scene-01",
                start=0.0,
                end=5.0,
                duration=5.0,
                caption="Bob sips coffee from his red mug at his desk.",
                visual_description="Bob sitting down and sipping steaming coffee from a red mug at a tidy modern office desk.",
            ),
            SceneModel(
                id="scene-02",
                start=5.0,
                end=10.0,
                duration=5.0,
                caption="Bob frantically types complex financial formulas into an Excel spreadsheet.",
                visual_description="Bob staring wide-eyed at multiple glowing monitor screens displaying complex financial charts and spreadsheets.",
            ),
            SceneModel(
                id="scene-03",
                start=10.0,
                end=15.0,
                duration=5.0,
                caption="A sleek modern automated workflow tool visualizes data pipelines.",
                visual_description="An abstract holographic data flow diagram showing automated workflows and interconnected glowing nodes.",
            ),
        ],
    )


def test_scene_meaning_placed_first_in_prompt(bible_project):
    """Test that Scene Meaning / Action appears at the very beginning of the prompt (Section 1)."""
    scene = bible_project.scenes[0]
    context = resolve_scene_context(bible_project, scene, style_id="stickman")
    prompt = build_scene_prompt(context, scene.visual_description)

    # Must start with Scene: {meaning}
    assert prompt.startswith("Scene: Bob sitting down and sipping steaming coffee from a red mug at a tidy modern office desk.")


def test_photographic_rules_filtered_for_non_photographic_styles(bible_project):
    """Test that cinematic/realistic/35mm photographic rules are omitted from non-photographic styles."""
    scene = bible_project.scenes[0]

    for style_id in ["stickfigure", "whiteboard", "cartoon", "flat", "sketch", "anime", "3d"]:
        context = resolve_scene_context(bible_project, scene, style_id=style_id)
        prompt = build_scene_prompt(context, scene.visual_description).lower()

        # None of the conflicting photographic rules should be in the prompt
        for conflict_rule in _PHOTOGRAPHIC_CONFLICT_RULES:
            assert f"directive: {conflict_rule}" not in prompt
            assert f"rule: {conflict_rule}" not in prompt

        # Non-conflicting rules should remain
        assert "consistent lighting" in prompt
        assert "high production value" in prompt


def test_photographic_styles_retain_photographic_rules(bible_project):
    """Test that cinematic and documentary styles keep photographic directives."""
    scene = bible_project.scenes[0]

    for style_id in ["cinematic", "documentary"]:
        context = resolve_scene_context(bible_project, scene, style_id=style_id)
        prompt = build_scene_prompt(context, scene.visual_description).lower()

        assert "cinematic" in prompt
        assert "consistent lighting" in prompt


def test_character_identity_sanitized_across_different_mediums(bible_project):
    """Test that medium-specific descriptors (like 'stick figure') are stripped when rendering in 3D/Anime/Cinematic."""
    scene = bible_project.scenes[0]

    # In 3D style, 'stick figure' appearance text should be sanitized to avoid contradictory stick-in-3D outputs
    context_3d = resolve_scene_context(bible_project, scene, style_id="3d")
    prompt_3d = build_scene_prompt(context_3d, scene.visual_description).lower()
    assert "stick figure" not in prompt_3d
    assert "blue tie" in prompt_3d  # Clothing / identity details preserved

    # In Anime style
    context_anime = resolve_scene_context(bible_project, scene, style_id="anime")
    prompt_anime = build_scene_prompt(context_anime, scene.visual_description).lower()
    assert "stick figure" not in prompt_anime

    # In stickfigure style, stick figure descriptor is naturally allowed
    context_stick = resolve_scene_context(bible_project, scene, style_id="stickfigure")
    prompt_stick = build_scene_prompt(context_stick, scene.visual_description).lower()
    assert "stick figure" in prompt_stick or "stick figures" in prompt_stick


def test_all_ten_styles_supported_and_normalized():
    """Verify all 10 normalized styles exist and generate coherent prompts."""
    presets = list_style_presets()
    preset_ids = {p["id"] for p in presets}
    expected_ids = {
        "stickfigure",
        "whiteboard",
        "cartoon",
        "flat",
        "sketch",
        "3d",
        "anime",
        "cinematic",
        "documentary",
        "custom",
    }
    assert expected_ids.issubset(preset_ids)


def test_custom_style_neutral_fallback(bible_project):
    """Test that Custom style uses clean neutral illustration without undefined errors."""
    scene = bible_project.scenes[2]
    context = resolve_scene_context(bible_project, scene, style_id="custom")
    prompt = build_scene_prompt(context, scene.visual_description)

    assert "Visual style: Custom" in prompt
    assert "balanced digital rendering" in prompt


def test_custom_style_with_user_instructions(bible_project):
    """Test that custom user instructions are cleanly injected into the prompt."""
    scene = bible_project.scenes[2]
    custom_inst = "Retro synthwave 1980s aesthetic with glowing neon grid and wireframe vectors"
    context = resolve_scene_context(
        bible_project,
        scene,
        style_id="custom",
        custom_instructions=custom_inst,
    )
    prompt = build_scene_prompt(context, scene.visual_description)

    assert custom_inst in prompt
    assert "Visual style: Custom" in prompt


def test_composition_guidance_avoids_landscape_ambiguity():
    """Verify that composition guidance uses explicit video frame wording and avoids 'landscape'."""
    g_16_9 = composition_guidance("16:9")
    g_9_16 = composition_guidance("9:16")
    g_1_1 = composition_guidance("1:1")

    assert "16:9 horizontal video frame" in g_16_9
    assert "landscape" not in g_16_9.lower()

    assert "9:16 vertical video frame" in g_9_16
    assert "1:1 square video frame" in g_1_1


def test_scene_seed_varies_across_scenes(bible_project):
    """Test that different scenes produce different seeds while remaining deterministic."""
    proj_id = bible_project.id
    scene1 = bible_project.scenes[0]
    scene2 = bible_project.scenes[1]
    scene3 = bible_project.scenes[2]

    seed1 = _derive_scene_seed(proj_id, scene1.id, scene1.caption)
    seed2 = _derive_scene_seed(proj_id, scene2.id, scene2.caption)
    seed3 = _derive_scene_seed(proj_id, scene3.id, scene3.caption)

    # Determinism: same input yields same seed
    assert seed1 == _derive_scene_seed(proj_id, scene1.id, scene1.caption)

    # Variation: different scenes yield different seeds
    assert seed1 != seed2
    assert seed2 != seed3
    assert seed1 != seed3

    # Seed is within valid range [1, 2147483647]
    for seed in (seed1, seed2, seed3):
        assert 1 <= seed <= 2147483647


def test_no_prompt_duplication_when_scene_meaning_provided(bible_project):
    """Ensure scene action description is not repeated in prompt body."""
    scene = bible_project.scenes[0]
    context = resolve_scene_context(bible_project, scene, style_id="stickman")
    prompt = build_scene_prompt(context, scene.visual_description)

    # Count occurrences of the specific visual description
    count = prompt.count("Bob sitting down and sipping steaming coffee")
    assert count == 1, f"Expected visual description to appear once, appeared {count} times"
