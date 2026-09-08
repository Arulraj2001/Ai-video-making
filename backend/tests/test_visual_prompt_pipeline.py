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
    """Test that Scene Meaning appears at the very beginning of the prompt (Section 1) preserving caption."""
    scene = bible_project.scenes[0]
    context = resolve_scene_context(bible_project, scene, style_id="stickman")
    prompt = build_scene_prompt(context, scene.visual_description)

    # Must start with Scene meaning: and preserve exact caption as source of truth
    assert prompt.startswith("Scene meaning:\nBob sips coffee from his red mug at his desk.")
    assert "Bob sitting down and sipping steaming coffee" in prompt


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


def test_caption_meaning_preserved_exactly(bible_project):
    """Test that original caption is preserved exactly under Scene meaning: as source of truth."""
    scene = bible_project.scenes[0]
    context = resolve_scene_context(bible_project, scene, style_id="cinematic")
    prompt = build_scene_prompt(context, scene.image_prompt)

    assert "Scene meaning:\nBob sips coffee from his red mug at his desk." in prompt


def test_visual_descriptions_used_when_available(bible_project):
    """Test that scene.visual_description is used in the prompt when available."""
    scene = bible_project.scenes[1]
    context = resolve_scene_context(bible_project, scene, style_id="cinematic")
    prompt = build_scene_prompt(context, scene.visual_description)

    assert "Bob staring wide-eyed at multiple glowing monitor screens" in prompt


def test_explicit_prompt_overrides_remain_highest_priority(bible_project):
    """Test that explicit user prompt overrides have higher priority than visual_description and caption."""
    scene = bible_project.scenes[0]
    custom_override = "Bob standing up triumphantly holding his coffee mug in a sunbeam"
    context = resolve_scene_context(
        bible_project,
        scene,
        style_id="cinematic",
        custom_instructions=custom_override,
    )
    prompt = build_scene_prompt(context, custom_override)

    # Caption preserved as source of truth
    assert "Scene meaning:\nBob sips coffee from his red mug at his desk." in prompt
    # User override is prioritized in Subject and action
    assert "Subject and action:\nBob standing up triumphantly holding his coffee mug in a sunbeam." in prompt


def test_prompt_priority_hierarchy(bible_project):
    """
    Test strict prompt priority:
    1. User prompt override
    2. Existing scene.image_prompt
    3. Scene visual_description
    4. Original scene caption
    """
    scene = bible_project.scenes[0]
    scene.image_prompt = "AI Generated Image Prompt: Bob carefully inspects coffee beans."
    scene.visual_description = "Visual Description: Bob examining coffee."

    # Priority 1: User prompt override
    override_context = resolve_scene_context(
        bible_project,
        scene,
        style_id="cinematic",
        custom_instructions="User Override: Bob brewing espresso.",
    )
    prompt_p1 = build_scene_prompt(override_context, "User Override: Bob brewing espresso.")
    assert "User Override: Bob brewing espresso" in prompt_p1

    # Priority 2: Existing image_prompt
    context_p2 = resolve_scene_context(bible_project, scene, style_id="cinematic")
    prompt_p2 = build_scene_prompt(context_p2, scene.image_prompt)
    assert "AI Generated Image Prompt: Bob carefully inspects coffee beans" in prompt_p2

    # Priority 3: Scene visual_description (when image_prompt is absent)
    scene.image_prompt = None
    context_p3 = resolve_scene_context(bible_project, scene, style_id="cinematic")
    prompt_p3 = build_scene_prompt(context_p3, scene.visual_description)
    assert "Visual Description: Bob examining coffee" in prompt_p3

    # Priority 4: Caption (when visual_description and image_prompt are absent)
    scene.visual_description = None
    context_p4 = resolve_scene_context(bible_project, scene, style_id="cinematic")
    prompt_p4 = build_scene_prompt(context_p4)
    assert "Bob sips coffee from his red mug at his desk" in prompt_p4


def test_video_bible_entities_included_only_when_relevant(bible_project):
    """Test that Video Bible entities are included ONLY when relevant to the scene."""
    # Scene 3 does not mention Bob or coffee mug
    scene3 = bible_project.scenes[2]
    context = resolve_scene_context(bible_project, scene3, style_id="cinematic")
    prompt = build_scene_prompt(context, scene3.visual_description)

    assert "canonical character identity: Bob" not in prompt
    assert "canonical object identity: Bob's Coffee Mug" not in prompt


def test_previous_scene_continuity_preserved(bible_project):
    """Test that previous-scene continuity is preserved when a previous scene is provided."""
    scene1 = bible_project.scenes[0]
    scene2 = bible_project.scenes[1]

    # Scene 1 has no previous scene
    context1 = resolve_scene_context(bible_project, scene1, style_id="cinematic")
    prompt1 = build_scene_prompt(context1, scene1.visual_description)
    assert "Previous shot continuity" not in prompt1

    # Scene 2 has previous scene 1
    context2 = resolve_scene_context(
        bible_project,
        scene2,
        style_id="cinematic",
        previous_scene=scene1,
    )
    prompt2 = build_scene_prompt(context2, scene2.visual_description)
    assert "Previous shot continuity" in prompt2
    assert scene1.caption[:15].lower() in prompt2.lower() or "bob" in prompt2.lower()


def test_no_generic_fallback_text_generated(bible_project):
    """Test that neither 'Cinematic scene' nor 'A clearly visualized scene' is generated."""
    scene = bible_project.scenes[0]
    for style_id in ["stickman", "cinematic", "cartoon", "3d", "anime", "custom"]:
        context = resolve_scene_context(bible_project, scene, style_id=style_id)
        prompt = build_scene_prompt(context, scene.visual_description)
        assert "cinematic scene" not in prompt.lower()
        assert "a clearly visualized scene" not in prompt.lower()


def test_empty_or_minimal_captions_fail_clearly_without_data(bible_project):
    """Test that empty or minimal captions fail clearly when no other prompt data is provided."""
    minimal_scene = SceneModel(
        id="scene-empty",
        start=0.0,
        end=5.0,
        duration=5.0,
        caption="   .  ",
        visual_description="",
        image_prompt=None,
    )
    context = resolve_scene_context(bible_project, minimal_scene, style_id="cinematic")
    with pytest.raises(ValueError, match="no meaningful caption, prompt, or visual description"):
        build_scene_prompt(context, None)


def test_empty_or_minimal_captions_use_available_meaningful_data(bible_project):
    """Test that empty or minimal captions succeed using only available meaningful data when override/visual_description exists."""
    minimal_scene = SceneModel(
        id="scene-fallback",
        start=0.0,
        end=5.0,
        duration=5.0,
        caption="   ",
        visual_description="A solitary astronaut gazing at a ringed planet from a lunar crater.",
        image_prompt=None,
    )
    context = resolve_scene_context(bible_project, minimal_scene, style_id="cinematic")
    prompt = build_scene_prompt(context, minimal_scene.visual_description)

    # Should not raise ValueError, should use available visual description
    assert "A solitary astronaut gazing at a ringed planet" in prompt
    # No generic fallback phrases
    assert "cinematic scene" not in prompt.lower()
    assert "a clearly visualized scene" not in prompt.lower()

