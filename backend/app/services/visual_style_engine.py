"""Canonical visual style and scene-context resolution for storyboard generation."""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional

from app.models.project import ProjectModel
from app.models.scene import SceneModel
from app.services.image_generation.base import ImageReference


@dataclass(frozen=True)
class StylePreset:
    id: str
    label: str
    visual_language: str
    rendering: str
    color_treatment: str
    lighting: str
    camera: str
    composition: str
    texture: str
    background: str
    mood: str
    negative_prompt: str


_STYLE_PRESETS: Dict[str, StylePreset] = {
    "stickfigure": StylePreset("stickfigure", "Stickman", "simple expressive stick figures", "clean educational drawing", "restrained black, white, and one accent color", "even instructional lighting", "clear readable medium and wide shots", "one primary action with generous negative space", "smooth marker lines", "minimal whiteboard-like backgrounds", "friendly and explanatory", "photorealism, complex textures, clutter, text, watermark"),
    "whiteboard": StylePreset("whiteboard", "Whiteboard", "hand-drawn educational visual explanations", "whiteboard marker rendering", "white background with restrained accent colors", "flat bright presentation lighting", "clear diagram-friendly framing", "simple centered compositions with readable spacing", "organic marker strokes", "clean whiteboard space", "clear and approachable", "photorealism, clutter, text, watermark"),
    "cartoon": StylePreset("cartoon", "Minimal Cartoon", "simplified friendly cartoon characters", "clean rounded shapes", "bright controlled colors", "soft even lighting", "approachable medium shots", "clear silhouette and readable action", "smooth graphic surfaces", "simple uncluttered backgrounds", "warm and accessible", "photorealism, gritty texture, text, watermark"),
    "flat": StylePreset("flat", "Flat Vector", "geometric vector-like forms", "flat graphic rendering", "bold limited color blocks", "uniform graphic lighting", "designed editorial framing", "balanced geometric composition", "crisp clean edges", "simple layered shapes", "confident and informative", "photorealism, noisy texture, text, watermark"),
    "sketch": StylePreset("sketch", "Hand Drawn", "organic hand-drawn lines", "pencil and ink sketch rendering", "natural paper tones with subtle accent color", "soft illustrative shading", "observational varied framing", "loose but intentional composition", "visible paper and line texture", "lightly suggested environments", "human and thoughtful", "photorealism, glossy 3D, text, watermark"),
    "3d": StylePreset("3d", "3D", "dimensional stylized forms", "polished 3D rendering", "coherent material and color palette", "directional 3D lighting with depth", "cinematic three-dimensional camera", "clear foreground, subject, and background layers", "controlled material detail", "spatially consistent environments", "immersive and polished", "flat 2D art, text, watermark"),
    "anime": StylePreset("anime", "Anime", "stylized illustrated characters and environments", "high-quality anime rendering", "coherent expressive color palette", "dramatic illustrated lighting", "dynamic illustrated camera angles", "strong silhouette and expressive framing", "clean linework with selective detail", "designed illustrated backgrounds", "expressive and energetic", "photorealism, text, watermark"),
    "cinematic": StylePreset("cinematic", "Cinematic", "cinematic film still visual language", "photorealistic cinematic rendering", "consistent film-grade color treatment", "controlled directional cinematic lighting", "cinematic lens and camera movement", "intentional shot size and environmental storytelling", "natural film texture", "believable dimensional environments", "dramatic and immersive", "text, subtitles, logos, watermark"),
    "documentary": StylePreset("documentary", "Documentary", "realistic observational visual language", "natural photographic rendering", "authentic restrained color", "available-light realism", "observational handheld or stable documentary camera", "natural composition with believable context", "subtle photographic texture", "real locations with lived-in detail", "honest and grounded", "staged fantasy, text, watermark"),
    "custom": StylePreset("custom", "Custom", "the project's chosen visual language", "the project's chosen rendering approach", "the project's chosen color treatment", "the project's chosen lighting", "the project's chosen camera language", "scene-appropriate composition", "the project's chosen texture", "the project's chosen background treatment", "the project's chosen mood", "text, subtitles, logos, watermark"),
}

_STYLE_ALIASES = {
    "stickman": "stickfigure",
    "white board": "whiteboard",
    "minimal cartoon": "cartoon",
    "flat vector": "flat",
    "hand drawn": "sketch",
    "hand-drawn": "sketch",
    "photorealistic": "cinematic",
    "photo": "cinematic",
}


def normalize_style_id(style_id: Optional[str]) -> str:
    key = (style_id or "cinematic").strip().lower().replace("_", " ").replace("-", " ")
    key = _STYLE_ALIASES.get(key, key.replace(" ", ""))
    return key if key in _STYLE_PRESETS else "custom"


def get_style_preset(style_id: Optional[str]) -> StylePreset:
    return _STYLE_PRESETS[normalize_style_id(style_id)]


def list_style_presets() -> List[Dict[str, str]]:
    return [{"id": preset.id, "label": preset.label} for preset in _STYLE_PRESETS.values()]


def composition_guidance(aspect_ratio: str) -> str:
    ratio = (aspect_ratio or "16:9").strip()
    if ratio == "9:16":
        return "vertical mobile composition; keep the primary subject readable in a tall frame with intentional top and bottom breathing room"
    if ratio == "1:1":
        return "balanced square composition; keep the subject and key action legible near the visual center without crowding"
    return "landscape composition; use the wider frame for environmental storytelling while keeping the primary action clear"


def _tokens(value: str) -> set[str]:
    return {token for token in re.findall(r"[a-z0-9]+", value.lower()) if len(token) > 2}


def _entity_matches(text: str, name: str, entity_id: str) -> bool:
    text_tokens = _tokens(text)
    name_tokens = _tokens(name)
    id_tokens = _tokens(entity_id)
    return bool(name.lower() in text.lower() or entity_id.lower() in text.lower() or (name_tokens and name_tokens <= text_tokens) or (id_tokens and id_tokens <= text_tokens))


def _identity(entity: Any, kind: str) -> str:
    parts = [f"canonical {kind} identity: {entity.name}"]
    for label, value in (("role", getattr(entity, "description", "")), ("appearance", getattr(entity, "appearance", "")), ("clothing", getattr(entity, "clothing", "")), ("age", getattr(entity, "age_range", "")), ("personality", getattr(entity, "personality", "")), ("environment", getattr(entity, "environment", "")), ("lighting", getattr(entity, "lighting", ""))):
        if value:
            parts.append(f"{label}: {value}")
    return "; ".join(parts)


def resolve_scene_context(
    project: ProjectModel,
    scene: SceneModel,
    style_id: Optional[str] = None,
    custom_instructions: Optional[str] = None,
    previous_scene: Optional[SceneModel] = None,
) -> Dict[str, Any]:
    """Resolve only the Video Bible entities relevant to one scene."""
    preset = get_style_preset(style_id or project.video_bible.overall_style.visual_style)
    scene_text = " ".join(filter(None, [scene.caption, scene.visual_description, scene.image_prompt]))
    bible = project.video_bible
    characters = [entity for entity in bible.characters if _entity_matches(scene_text, entity.name, entity.id)]
    locations = [entity for entity in bible.locations if _entity_matches(scene_text, entity.name, entity.id)]
    objects = [entity for entity in bible.objects if _entity_matches(scene_text, entity.name, entity.id)]

    entities: List[Dict[str, Any]] = []
    references: List[ImageReference] = []
    for kind, collection in (("character", characters), ("location", locations), ("object", objects)):
        for entity in collection:
            entities.append({"type": kind, "id": entity.id, "name": entity.name, "identity": _identity(entity, kind)})
            reference = getattr(entity, "reference_image", None)
            if reference:
                references.append(ImageReference(
                    entity_type=kind,
                    entity_name=entity.name,
                    image_path=reference.storage_path,
                    image_url=reference.url,
                    description=_identity(entity, kind),
                ))

    previous_context = None
    if previous_scene:
        previous_context = f"Previous shot continuity: {previous_scene.visual_description or previous_scene.caption}. Preserve identity and visual language, but vary the shot and action."

    return {
        "scene_id": scene.id,
        "caption": scene.caption,
        "visual_description": scene.visual_description or "",
        "style": preset,
        "style_id": preset.id,
        "entities": entities,
        "references": references,
        "rules": list(bible.rules),
        "aspect_ratio": project.canvas_settings.aspect_ratio or "16:9",
        "composition": composition_guidance(project.canvas_settings.aspect_ratio or "16:9"),
        "continuity_context": previous_context,
        "previous_scene_id": previous_scene.id if previous_scene else None,
        "custom_instructions": custom_instructions or "",
    }


def build_scene_prompt(context: Dict[str, Any], scene_prompt: Optional[str] = None) -> str:
    """Assemble a readable, prioritized prompt without dumping raw project metadata."""
    preset: StylePreset = context["style"]
    sections = [
        f"Visual style: {preset.label}. {preset.visual_language}; {preset.rendering}; {preset.color_treatment}.",
        f"Lighting and camera: {preset.lighting}; {preset.camera}.",
        f"Composition: {context['composition']}.",
    ]
    if context.get("rules"):
        sections.append("Project visual rules: " + "; ".join(context["rules"]) + ".")
    for entity in context.get("entities", []):
        sections.append(entity["identity"] + ".")
    sections.append(f"Scene meaning: {context.get('visual_description') or context.get('caption') or scene_prompt or 'a meaningful video moment'}.")
    if scene_prompt:
        sections.append(f"Scene-specific image direction: {scene_prompt}.")
    if context.get("continuity_context"):
        sections.append(context["continuity_context"])
    if context.get("custom_instructions"):
        sections.append(f"User custom direction, preserve the core identity: {context['custom_instructions']}.")
    sections.append(f"Target aspect ratio: {context['aspect_ratio']}.")
    sections.append("Avoid: " + preset.negative_prompt + ".")
    return " ".join(section for section in sections if section)
