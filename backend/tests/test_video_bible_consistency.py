"""
Phase 5 — Video Bible Consistency Test Suite
Tests recurring entity resolution, canonical identity stability,
scene-specific variation, seed determinism, continuity context,
irrelevant entity exclusion, and aspect ratio handling across 8 scenes.
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
    composition_guidance,
)
from app.services.scene_image_service import _derive_scene_seed


@pytest.fixture
def eight_scene_project():
    """8-scene deterministic test project featuring Bob, his office, and his coffee mug."""
    bob = CharacterModel(
        id="char-bob",
        name="Bob",
        description="30s tech professional and data analyst",
        appearance="30s man with round dark-rimmed glasses, neat side-part dark brown hair",
        clothing="crisp white collared dress shirt and navy blue silk tie",
        age_range="early 30s",
        personality="focused, analytical, detail-oriented",
    )
    office = LocationModel(
        id="loc-office",
        name="Bob's Office",
        description="modern corporate workplace",
        environment="glass-walled conference room in background, wooden office desk, computer screens",
        lighting="soft overhead daylight panels with warm accent light",
    )
    coffee_mug = ObjectModel(
        id="obj-mug",
        name="Bob's Coffee Mug",
        description="ceramic bright red cylindrical coffee mug with white interior and curved handle",
    )

    scenes = [
        SceneModel(
            id="scene-01",
            start=0.0,
            end=5.0,
            duration=5.0,
            caption="Bob arrives at his office and sits at his desk.",
            visual_description="Bob walking into his modern office and sitting down comfortably at his wooden desk.",
        ),
        SceneModel(
            id="scene-02",
            start=5.0,
            end=10.0,
            duration=5.0,
            caption="Bob drinks his morning coffee while looking at his computer.",
            visual_description="Bob taking a warm sip from his coffee mug while gazing attentively at his glowing computer monitor.",
        ),
        SceneModel(
            id="scene-03",
            start=10.0,
            end=15.0,
            duration=5.0,
            caption="Bob studies a complicated spreadsheet.",
            visual_description="Bob leaning forward at his office desk examining dense financial figures and charts on a large spreadsheet screen.",
        ),
        SceneModel(
            id="scene-04",
            start=15.0,
            end=20.0,
            duration=5.0,
            caption="Bob looks confused by the numbers on the screen.",
            visual_description="Bob rubbing his chin with a puzzled and confused expression at his office desk staring at mismatched numbers on his monitor.",
        ),
        SceneModel(
            id="scene-05",
            start=20.0,
            end=25.0,
            duration=5.0,
            caption="Bob writes notes beside his keyboard.",
            visual_description="Bob jotting down quick analytical notes with a ballpoint pen on a notepad beside his desk keyboard.",
        ),
        SceneModel(
            id="scene-06",
            start=25.0,
            end=30.0,
            duration=5.0,
            caption="Bob notices an automated workflow tool on his computer.",
            visual_description="Bob noticing a notification pop-up for an automated data workflow tool on his screen with curiosity.",
        ),
        SceneModel(
            id="scene-07",
            start=30.0,
            end=35.0,
            duration=5.0,
            caption="Bob uses the new workflow and becomes more confident.",
            visual_description="Bob smiling with relief and newfound confidence at his office desk as visual data pipelines streamline across his monitors.",
        ),
        SceneModel(
            id="scene-08",
            start=35.0,
            end=40.0,
            duration=5.0,
            caption="Bob finishes his work while drinking the same coffee.",
            visual_description="Bob happily leaning back in his desk chair, holding his red coffee mug and savoring his completed work.",
        ),
    ]

    return ProjectModel(
        id="proj-eight-scenes",
        name="Bob Office Video Bible Test",
        video_bible=VideoBibleModel(
            overall_style=OverallStyleModel(
                visual_style="cinematic",
                realism_level="cinematic realism",
                lighting="natural office lighting with warm rim lights",
                color_treatment="balanced natural palette with subtle cool blue tones",
                camera_style="medium close-up and medium eye-level shots",
                lens_cinematography="50mm prime lens, natural depth of field",
                mood="focused and professional",
            ),
            rules=["consistent lighting", "high production value", "clean workplace aesthetic"],
            characters=[bob],
            locations=[office],
            objects=[coffee_mug],
        ),
        scenes=scenes,
    )


def test_8_scene_entity_resolution(eight_scene_project):
    """
    Verify that across all 8 scenes:
    - Bob is identified in 8/8 scenes.
    - Office is identified in 8/8 scenes.
    - Coffee Mug is ONLY identified in scenes 2 and 8, and strictly EXCLUDED from 1, 3, 4, 5, 6, 7.
    """
    for i, scene in enumerate(eight_scene_project.scenes):
        context = resolve_scene_context(eight_scene_project, scene, style_id="cinematic")
        entity_ids = {e["id"] for e in context["entities"]}

        # Bob must be in every scene
        assert "char-bob" in entity_ids, f"Scene {i+1} ({scene.id}) missing Bob"

        # Office must be in every scene
        assert "loc-office" in entity_ids, f"Scene {i+1} ({scene.id}) missing Bob's Office"

        # Coffee mug must ONLY be in Scene 2 and Scene 8
        if i in (1, 7):  # scene-02 and scene-08
            assert "obj-mug" in entity_ids, f"Scene {i+1} ({scene.id}) should include Coffee Mug"
        else:
            assert "obj-mug" not in entity_ids, f"Scene {i+1} ({scene.id}) falsely included Coffee Mug"


def test_canonical_identity_stability(eight_scene_project):
    """
    Verify that Bob's appearance, glasses, and clothing attributes
    remain identical in the resolved prompt across all 8 scenes.
    """
    expected_appearance = "round dark-rimmed glasses"
    expected_clothing = "crisp white collared dress shirt and navy blue silk tie"

    for scene in eight_scene_project.scenes:
        context = resolve_scene_context(eight_scene_project, scene, style_id="cinematic")
        prompt = build_scene_prompt(context, scene.visual_description)

        assert expected_appearance in prompt, f"Scene {scene.id} lost glasses attribute"
        assert expected_clothing in prompt, f"Scene {scene.id} lost clothing attribute"
        assert "canonical character identity: Bob" in prompt


def test_scene_specific_seed_variation(eight_scene_project):
    """
    Verify that all 8 scenes produce distinct seeds (preventing static pose freezing)
    while remaining 100% deterministic for identical inputs.
    """
    seeds = []
    proj_id = eight_scene_project.id

    for scene in eight_scene_project.scenes:
        seed = _derive_scene_seed(proj_id, scene.id, scene.caption)
        # Determinism check
        assert seed == _derive_scene_seed(proj_id, scene.id, scene.caption)
        seeds.append(seed)

    # All 8 seeds must be unique
    assert len(set(seeds)) == 8, f"Seed collision detected in seeds: {seeds}"


def test_continuity_context_propagation(eight_scene_project):
    """
    Verify that Scene 1 has no prior continuity,
    while Scenes 2-8 receive continuity context referencing Scene N-1.
    """
    for i, scene in enumerate(eight_scene_project.scenes):
        prev = eight_scene_project.scenes[i - 1] if i > 0 else None
        context = resolve_scene_context(
            eight_scene_project,
            scene,
            style_id="cinematic",
            previous_scene=prev,
        )
        prompt = build_scene_prompt(context, scene.visual_description)

        if i == 0:
            assert "Previous shot continuity" not in prompt
        else:
            assert "Previous shot continuity" in prompt
            # Check that previous scene caption or visual description is referenced
            assert prev.caption[:15].lower() in prompt.lower() or prev.visual_description[:15].lower() in prompt.lower()


def test_irrelevant_entity_exclusion(eight_scene_project):
    """
    Verify that scenes not mentioning coffee (e.g. scene 3 spreadsheet)
    strictly exclude any mention of coffee mug in the prompt.
    """
    scene_spreadsheet = eight_scene_project.scenes[2]  # scene-03
    context = resolve_scene_context(eight_scene_project, scene_spreadsheet, style_id="cinematic")
    prompt = build_scene_prompt(context, scene_spreadsheet.visual_description)

    assert "obj-mug" not in [e["id"] for e in context["entities"]]
    assert "coffee mug" not in prompt.lower()
    assert "ceramic bright red" not in prompt.lower()


def test_aspect_ratio_framing_consistency(eight_scene_project):
    """
    Verify that changing aspect ratio updates composition guidance
    without destroying recurring character or object identity tokens.
    """
    scene = eight_scene_project.scenes[1]  # scene-02 (has Bob, Office, Mug)

    for ratio, expected_framing in (
        ("16:9", "16:9 horizontal video frame"),
        ("9:16", "9:16 vertical video frame"),
        ("1:1", "1:1 square video frame"),
    ):
        eight_scene_project.canvas_settings.aspect_ratio = ratio
        context = resolve_scene_context(eight_scene_project, scene, style_id="cinematic")
        prompt = build_scene_prompt(context, scene.visual_description)

        # Aspect framing guidance is present
        assert expected_framing in prompt
        # Entity consistency remains intact
        assert "canonical character identity: Bob" in prompt
        assert "round dark-rimmed glasses" in prompt
        assert "canonical object identity: Bob's Coffee Mug" in prompt
        assert "ceramic bright red" in prompt
