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
    "stickfigure": StylePreset("stickfigure", "Stickman", "simple expressive stick figures", "clean educational drawing", "restrained black, white, and one accent color", "even instructional lighting", "clear readable medium and wide shots", "one primary action with generous negative space", "smooth marker lines", "minimal whiteboard-like backgrounds", "friendly and explanatory", "photorealism, complex textures, clutter, text, watermark, logo, blurry, distorted"),
    "whiteboard": StylePreset("whiteboard", "Whiteboard", "hand-drawn educational visual explanations", "whiteboard marker rendering", "white background with restrained accent colors", "flat bright presentation lighting", "clear diagram-friendly framing", "simple centered compositions with readable spacing", "organic marker strokes", "clean whiteboard space", "clear and approachable", "photorealism, clutter, text, watermark, logo, blurry, distorted"),
    "cartoon": StylePreset("cartoon", "Minimal Cartoon", "simplified friendly cartoon characters", "clean rounded shapes", "bright controlled colors", "soft even lighting", "approachable medium shots", "clear silhouette and readable action", "smooth graphic surfaces", "simple uncluttered backgrounds", "warm and accessible", "photorealism, gritty texture, text, watermark, logo, blurry, distorted"),
    "flat": StylePreset("flat", "Flat Vector", "geometric vector-like forms", "flat graphic rendering", "bold limited color blocks", "uniform graphic lighting", "designed editorial framing", "balanced geometric composition", "crisp clean edges", "simple layered shapes", "confident and informative", "photorealism, noisy texture, text, watermark, logo, blurry, distorted"),
    "sketch": StylePreset("sketch", "Hand Drawn", "organic hand-drawn lines", "pencil and ink sketch rendering", "natural paper tones with subtle accent color", "soft illustrative shading", "observational varied framing", "loose but intentional composition", "visible paper and line texture", "lightly suggested environments", "human and thoughtful", "photorealism, glossy 3D, text, watermark, logo, blurry, distorted"),
    "3d": StylePreset("3d", "3D", "dimensional stylized forms", "polished 3D rendering", "coherent material and color palette", "directional 3D lighting with depth", "cinematic three-dimensional camera", "clear foreground, subject, and background layers", "controlled material detail", "spatially consistent environments", "immersive and polished", "flat 2D art, text, watermark, logo, blurry, distorted"),
    "anime": StylePreset("anime", "Anime", "stylized illustrated characters and environments", "high-quality anime rendering", "coherent expressive color palette", "dramatic illustrated lighting", "dynamic illustrated camera angles", "strong silhouette and expressive framing", "clean linework with selective detail", "designed illustrated backgrounds", "expressive and energetic", "photorealism, text, watermark, logo, blurry, distorted"),
    "cinematic": StylePreset("cinematic", "Cinematic", "cinematic film still visual language", "photorealistic cinematic rendering", "consistent film-grade color treatment", "controlled directional cinematic lighting", "cinematic lens and camera movement", "intentional shot size and environmental storytelling", "natural film texture", "believable dimensional environments", "dramatic and immersive", "text, subtitles, logos, watermark, blurry, distorted"),
    "documentary": StylePreset("documentary", "Documentary", "realistic observational visual language", "natural photographic rendering", "authentic restrained color", "available-light realism", "observational handheld or stable documentary camera", "natural composition with believable context", "subtle photographic texture", "real locations with lived-in detail", "honest and grounded", "staged fantasy, text, watermark, logos, blurry, distorted"),
    "custom": StylePreset("custom", "Custom", "clean visual illustration", "balanced digital rendering", "natural balanced color palette", "clear readable lighting", "steady clear camera framing", "balanced subject framing", "smooth clean texture", "clean supportive background", "engaging and clear", "text, subtitles, logos, watermark, blurry, distorted"),
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

# Generic photographic/cinematic rules that conflict with non-photographic artistic styles
_PHOTOGRAPHIC_CONFLICT_RULES = {
    "cinematic",
    "realistic",
    "documentary",
    "photorealistic",
    "35mm",
    "35mm photography",
    "film still",
    "shallow depth of field",
}

_NON_PHOTOGRAPHIC_STYLES = {
    "stickfigure",
    "whiteboard",
    "cartoon",
    "flat",
    "sketch",
    "anime",
    "3d",
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
    """Provides framing instructions without using ambiguous scenery words like 'landscape'."""
    ratio = (aspect_ratio or "16:9").strip()
    if ratio == "9:16":
        return "9:16 vertical video frame; keep the subject and action centered with intentional top and bottom breathing room"
    if ratio == "1:1":
        return "1:1 square video frame; keep the subject and key action legible near the visual center without crowding"
    return "16:9 horizontal video frame; frame the primary subject and key action with clear readable spatial boundaries"


def _tokens(value: str) -> set[str]:
    return {token for token in re.findall(r"[a-z0-9]+", value.lower()) if len(token) > 2}


def _entity_matches(text: str, name: str, entity_id: str, extra_keywords: Optional[List[str]] = None) -> bool:
    text_lower = text.lower()
    if name.lower() in text_lower or entity_id.lower() in text_lower:
        return True
    text_tokens = _tokens(text)
    name_tokens = _tokens(name)
    id_tokens = _tokens(entity_id)
    if (name_tokens and name_tokens <= text_tokens) or (id_tokens and id_tokens <= text_tokens):
        return True

    # Meaningful distinctive tokens from name (e.g. "coffee" or "mug" from "Coffee Mug")
    stopwords = {"the", "and", "for", "with", "his", "her", "their", "its", "bobs", "bob", "new", "old", "room"}
    meaningful_tokens = {t for t in name_tokens if t not in stopwords and len(t) >= 3}
    if meaningful_tokens and (meaningful_tokens & text_tokens):
        return True

    if extra_keywords:
        for kw in extra_keywords:
            if kw:
                kw_l = kw.lower()
                if kw_l in text_lower or (len(kw_l) >= 4 and kw_l.rstrip("s") in text_lower):
                    return True
    return False


def _identity(entity: Any, kind: str, style_id: Optional[str] = None) -> str:
    """Builds canonical identity while ensuring character appearance is style-adaptive."""
    parts = [f"canonical {kind} identity: {entity.name}"]
    for label, value in (("role", getattr(entity, "description", "")), ("appearance", getattr(entity, "appearance", "")), ("clothing", getattr(entity, "clothing", "")), ("age", getattr(entity, "age_range", "")), ("personality", getattr(entity, "personality", "")), ("environment", getattr(entity, "environment", "")), ("lighting", getattr(entity, "lighting", ""))):
        if value:
            clean_val = value
            # If the user selected a non-stickman style, do not hardcode 'stick figure' into 3D, anime, or cinematic prompts
            if style_id and style_id != "stickfigure":
                clean_val = re.sub(r"\b(stick\s*figure|stickman)\b", "character", clean_val, flags=re.IGNORECASE).strip()
            parts.append(f"{label}: {clean_val}")
    return "; ".join(parts)


def resolve_scene_context(
    project: ProjectModel,
    scene: SceneModel,
    style_id: Optional[str] = None,
    custom_instructions: Optional[str] = None,
    previous_scene: Optional[SceneModel] = None,
) -> Dict[str, Any]:
    """Resolve only the Video Bible entities relevant to one scene and filter contradictory rules."""
    preset = get_style_preset(style_id or project.video_bible.overall_style.visual_style)
    scene_text = " ".join(filter(None, [scene.caption, scene.visual_description, scene.image_prompt]))
    bible = project.video_bible
    characters = [entity for entity in bible.characters if _entity_matches(scene_text, entity.name, entity.id)]
    locations = [
        entity for entity in bible.locations
        if _entity_matches(
            scene_text,
            entity.name,
            entity.id,
            [w for w in re.findall(r"[a-z0-9]+", (getattr(entity, "environment", "") or "").lower()) if len(w) >= 4 and w not in {"with", "from", "room", "soft", "glass", "overhead"}]
        )
    ]
    objects = [entity for entity in bible.objects if _entity_matches(scene_text, entity.name, entity.id)]

    entities: List[Dict[str, Any]] = []
    references: List[ImageReference] = []
    for kind, collection in (("character", characters), ("location", locations), ("object", objects)):
        for entity in collection:
            entities.append({
                "type": kind,
                "id": entity.id,
                "name": entity.name,
                "identity": _identity(entity, kind, style_id=preset.id),
            })
            reference = getattr(entity, "reference_image", None)
            if reference:
                references.append(ImageReference(
                    entity_type=kind,
                    entity_name=entity.name,
                    image_path=reference.storage_path,
                    image_url=reference.url,
                    description=_identity(entity, kind, style_id=preset.id),
                ))

    previous_context = None
    if previous_scene:
        prev_desc = (previous_scene.visual_description or previous_scene.caption or "").strip()
        if prev_desc:
            previous_context = f"Previous shot continuity: {prev_desc}. Preserve identity and visual language, but vary the shot and action."

    # Filter out contradictory photographic rules for non-photographic styles
    raw_rules = list(bible.rules)
    if preset.id in _NON_PHOTOGRAPHIC_STYLES:
        filtered_rules = [r for r in raw_rules if r.strip().lower() not in _PHOTOGRAPHIC_CONFLICT_RULES]
    else:
        filtered_rules = raw_rules

    return {
        "scene_id": scene.id,
        "caption": scene.caption,
        "visual_description": scene.visual_description or "",
        "style": preset,
        "style_id": preset.id,
        "entities": entities,
        "references": references,
        "rules": filtered_rules,
        "aspect_ratio": project.canvas_settings.aspect_ratio or "16:9",
        "composition": composition_guidance(project.canvas_settings.aspect_ratio or "16:9"),
        "continuity_context": previous_context,
        "previous_scene_id": previous_scene.id if previous_scene else None,
        "custom_instructions": custom_instructions or "",
    }


def build_scene_prompt(context: Dict[str, Any], scene_prompt: Optional[str] = None) -> str:
    """
    Assemble a readable, prioritized prompt strictly following the Core Prompt Model:
    1. Scene subject / action / meaning (FIRST)
    2. Relevant character identity
    3. Relevant location identity
    4. Relevant object identity
    5. Selected visual style & rendering
    6. Composition & aspect framing
    7. Compatible project rules
    8. Continuity context
    9. Scene-specific direction (de-duplicated)
    10. Explicit custom instructions (de-duplicated)
    11. Negative guidance
    """
    preset: StylePreset = context["style"]
    sections: List[str] = []

    # 1. Scene subject / action / meaning (FIRST!)
    scene_meaning = (
        scene_prompt
        or context.get("visual_description")
        or context.get("caption")
        or "A clearly visualized scene"
    ).strip().rstrip(".")
    sections.append(f"Scene: {scene_meaning}.")

    caption = (context.get("caption") or "").strip().rstrip(".")
    if caption and caption.lower() not in scene_meaning.lower():
        sections.append(f"Caption intent: {caption}.")

    # 2-4. Relevant entities (Character, Location, Object)
    for entity in context.get("entities", []):
        sections.append(entity["identity"].rstrip(".") + ".")

    # 5. Selected visual style & rendering language
    if preset.id == "custom" and context.get("custom_instructions"):
        sections.append(f"Visual style: Custom art style. {context['custom_instructions'].strip().rstrip('.')}.")
    else:
        sections.append(
            f"Visual style: {preset.label}. {preset.visual_language}; {preset.rendering}; {preset.color_treatment}; {preset.texture}."
        )
        sections.append(f"Lighting and camera: {preset.lighting}; {preset.camera}.")

    # 6. Composition / aspect ratio framing
    sections.append(f"Composition: {context['composition']}.")

    # 7. Compatible project rules
    if context.get("rules"):
        sections.append("Project visual rules: " + "; ".join(context["rules"]) + ".")

    # 8. Continuity context (if present)
    if context.get("continuity_context"):
        sections.append(context["continuity_context"].rstrip(".") + ".")

    # 9. Scene-specific camera / direction (only if distinct from scene_meaning and caption)
    caption_text = (context.get("caption") or "").strip().lower()
    if scene_prompt:
        clean_prompt = scene_prompt.strip().rstrip(".")
        clean_prompt_lower = clean_prompt.lower()
        if clean_prompt_lower != scene_meaning.lower() and clean_prompt_lower != caption_text:
            sections.append(f"Scene direction: {clean_prompt}.")

    # 10. Explicit custom instructions (if not already used as custom style)
    if context.get("custom_instructions") and preset.id != "custom":
        clean_custom = context["custom_instructions"].strip().rstrip(".")
        clean_custom_lower = clean_custom.lower()
        if (
            clean_custom_lower != scene_meaning.lower()
            and clean_custom_lower != caption_text
            and clean_custom_lower != (scene_prompt or "").strip().lower()
        ):
            sections.append(f"Custom user direction: {clean_custom}.")

    # 11. Negative guidance
    sections.append("Avoid: " + preset.negative_prompt.rstrip(".") + ".")

    return " ".join(section for section in sections if section)
