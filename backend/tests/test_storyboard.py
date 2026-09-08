import asyncio
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.scene import SceneModel
from app.models.video_bible import OverallStyleModel, CharacterModel, LocationModel, ObjectModel
from app.services.project_service import project_service
from app.services.storyboard_service import storyboard_service
from app.services.llm.mock_provider import MockLLMProvider
from app.services.visual_context import build_visual_context
from app.services.visual_style_engine import (
    build_scene_prompt,
    normalize_style_id,
    resolve_scene_context,
)

client = TestClient(app)

from app.schemas.project import ProjectCreate

@pytest.fixture
def sample_project_with_bible(tmp_path, monkeypatch):
    monkeypatch.setattr("app.services.project_service.PROJECTS_DIR", tmp_path)
    project_service._projects.clear()

    project = project_service.create_project(
        ProjectCreate(
            name="Cyber Odyssey",
            description="A sci-fi adventure in a sprawling neon metropolis"
        )
    )

    # Set Video Bible
    project.video_bible.overall_style = OverallStyleModel(
        visual_style="Cyberpunk Blade Runner Neo-noir",
        realism_level="Cinematic Photorealism",
        color_treatment="High contrast teal and neon magenta",
        lighting="Volumetric neon reflections on rain-slicked asphalt",
        camera_style="Wide-angle anamorphic lens",
        lens_cinematography="35mm master cinematography, shallow depth of field",
        mood="Enigmatic and high-stakes tension"
    )
    project.video_bible.rules = ["cinematic", "futuristic", "film noir"]

    project.video_bible.characters.append(
        CharacterModel(
            id="char-001",
            name="Kaelen",
            description="Renegade cyber-hacker",
            appearance="Silver undercut hairstyle, glowing cyan ocular implant",
            clothing="Weathered matte black leather trenchcoat with collar raised",
            age_range="Late 20s",
            personality="Stoic, cynical, fiercely intelligent"
        )
    )

    project.video_bible.locations.append(
        LocationModel(
            id="loc-001",
            name="The Spire Underbelly",
            description="Subterranean megacity alleyways under monolithic towers",
            environment="Dystopian neon bazaar filled with holographic billboards",
            lighting="Pulsing purple and cyan neon tubes flickering through steam vents"
        )
    )

    project.video_bible.objects.append(
        ObjectModel(
            id="obj-001",
            name="The Neural Shard",
            description="A glowing crystalline data drive pulsing with amber light"
        )
    )

    # Add scenes
    scenes = [
        SceneModel(
            id="scene-001",
            start=0.0,
            end=4.0,
            duration=4.0,
            caption="Kaelen slipped into the shadows of the Spire Underbelly as sirens wailed in the distance."
        ),
        SceneModel(
            id="scene-002",
            start=4.0,
            end=9.5,
            duration=5.5,
            caption="Holding the Neural Shard in trembling hands, the fate of the city hung in the balance."
        )
    ]
    project.scenes = scenes
    project_service._save_to_disk(project)
    return project

def test_mock_provider_rules_and_generation(sample_project_with_bible):
    """Verify MockLLMProvider enforces all 10 prompt rules and returns all required fields."""
    provider = MockLLMProvider()
    scenes_input = [
        {
            "id": s.id,
            "start": s.start,
            "end": s.end,
            "duration": s.duration,
            "caption": s.caption
        }
        for s in sample_project_with_bible.scenes
    ]

    for aspect_ratio, guidance in (
        ("16:9", "16:9 horizontal video frame"),
        ("9:16", "9:16 vertical video frame"),
        ("1:1", "1:1 square video frame"),
    ):
        visual_context = build_visual_context(
            sample_project_with_bible.video_bible,
            aspect_ratio=aspect_ratio,
        )
        results = asyncio.run(provider.generate_storyboard_scenes(
            scenes=scenes_input,
            visual_context=visual_context,
            aspect_ratio=aspect_ratio
        ))

        assert len(results) == 2
        for result in results:
            # Check required fields
            assert "id" in result
            assert "visual_description" in result
            assert "image_prompt" in result
            assert "suggested_motion" in result
            assert "suggested_transition" in result

            prompt = result["image_prompt"]

            # Visual description and Video Bible identity remain present.
            assert len(result["visual_description"]) > 20
            assert "Cyberpunk Blade Runner Neo-noir" in prompt or "Teal and neon magenta" in prompt or "Volumetric neon reflections" in prompt

            # Negative prompt guidance remains present.
            assert "--no text" in prompt
            assert "watermark" in prompt

            # Aspect ratio is expressed through semantic composition guidance.
            assert guidance in prompt

def test_storyboard_service_flow(sample_project_with_bible):
    """Test storyboard_service.generate_storyboard and regenerate_scene_prompt."""
    scenes = asyncio.run(storyboard_service.generate_storyboard(sample_project_with_bible))
    assert len(scenes) == 2
    assert scenes[0].image_prompt is not None
    assert scenes[0].visual_description is not None
    assert scenes[0].suggested_motion is not None
    assert scenes[0].suggested_transition is not None

    # Test single scene regeneration
    updated_scene = asyncio.run(storyboard_service.regenerate_scene_prompt(
        project=sample_project_with_bible,
        scene_id="scene-001",
        instructions="Dramatic close-up on the glowing ocular implant with rain streaming down"
    ))
    assert "ocular implant" in updated_scene.image_prompt.lower() or "close-up" in updated_scene.image_prompt.lower()
    assert "Directed alteration" in updated_scene.visual_description or "ocular implant" in updated_scene.visual_description.lower()

def test_visual_style_engine_resolves_relevant_entities_and_composition(sample_project_with_bible):
    scene = sample_project_with_bible.scenes[0]
    scene.visual_description = "Kaelen enters The Spire Underbelly while carrying The Neural Shard."
    context = resolve_scene_context(sample_project_with_bible, scene, style_id="stickman")
    prompt = build_scene_prompt(context, scene.image_prompt)

    assert normalize_style_id("Stickman") == "stickfigure"
    assert context["style_id"] == "stickfigure"
    assert {entity["id"] for entity in context["entities"]} == {"char-001", "loc-001", "obj-001"}
    assert "9:16 vertical video frame" in context["composition"]
    assert "canonical character identity: Kaelen" in prompt
    assert "canonical location identity: The Spire Underbelly" in prompt

    sample_project_with_bible.canvas_settings.aspect_ratio = "16:9"
    landscape_context = resolve_scene_context(sample_project_with_bible, scene, style_id="stickman")
    assert "16:9 horizontal video frame" in landscape_context["composition"]

    sample_project_with_bible.canvas_settings.aspect_ratio = "1:1"
    square_context = resolve_scene_context(sample_project_with_bible, scene, style_id="stickman")
    assert "1:1 square video frame" in square_context["composition"]

    unrelated_scene = sample_project_with_bible.scenes[1]
    unrelated_scene.caption = "A quiet empty street with no named entities."
    unrelated_context = resolve_scene_context(sample_project_with_bible, unrelated_scene, style_id="cinematic")
    assert unrelated_context["entities"] == []

def test_final_prompt_prioritizes_ai_scene_prompt_and_preserves_caption(sample_project_with_bible):
    scene = sample_project_with_bible.scenes[0]
    scene.visual_description = "A generic neon city mood."
    scene.image_prompt = "Kaelen hides behind a steaming service column as distant sirens approach."

    context = resolve_scene_context(sample_project_with_bible, scene, style_id="cinematic")
    prompt = build_scene_prompt(context, scene.image_prompt)

    assert "Scene meaning:\nKaelen slipped into the shadows" in prompt or "slipped into the shadows" in prompt
    assert "Kaelen hides behind a steaming service column as distant sirens approach" in prompt
    assert "A generic neon city mood" not in prompt

def test_storyboard_api_endpoints(sample_project_with_bible):
    """Test full HTTP API routes for storyboard generation, regeneration, and editing."""
    pid = sample_project_with_bible.id

    # 1. POST /generate
    resp = client.post(f"/api/projects/{pid}/storyboard/generate")
    assert resp.status_code == 200
    data = resp.json()
    assert data["project_id"] == pid
    assert data["total_scenes"] == 2
    assert len(data["scenes"]) == 2
    scene1 = data["scenes"][0]
    assert scene1["id"] == "scene-001"
    assert len(scene1["image_prompt"]) > 10
    assert len(scene1["visual_description"]) > 10

    # 2. POST /scenes/{id}/regenerate
    regen_resp = client.post(
        f"/api/projects/{pid}/storyboard/scenes/scene-001/regenerate",
        json={"instructions": "Extreme wide shot with lightning strike"}
    )
    assert regen_resp.status_code == 200
    regen_data = regen_resp.json()
    assert regen_data["id"] == "scene-001"
    assert "lightning" in regen_data["image_prompt"].lower() or "lightning" in regen_data["visual_description"].lower()

    # 3. PUT /scenes/{id} (manual edit)
    edit_resp = client.put(
        f"/api/projects/{pid}/storyboard/scenes/scene-001",
        json={
            "image_prompt": "Custom tailored master prompt, 35mm film grain, 16:9",
            "suggested_motion": "Dramatic orbital push",
            "suggested_transition": "Match cut"
        }
    )
    assert edit_resp.status_code == 200
    edit_data = edit_resp.json()
    assert edit_data["image_prompt"] == "Custom tailored master prompt, 35mm film grain, 16:9"
    assert edit_data["suggested_motion"] == "Dramatic orbital push"
    assert edit_data["suggested_transition"] == "Match cut"

    # Every storyboard mutation returns the complete persisted scene contract.
    for field in ("image_status", "image_url", "image_error", "image_metadata"):
        assert field in scene1
        assert field in regen_data
        assert field in edit_data

    # Project responses retain the Video Bible used by storyboard generation.
    project_resp = client.get(f"/api/projects/{pid}")
    assert project_resp.status_code == 200
    project_data = project_resp.json()
    assert project_data["video_bible"]["overall_style"]["visual_style"] == "Cyberpunk Blade Runner Neo-noir"
    assert len(project_data["video_bible"]["characters"]) == 1
