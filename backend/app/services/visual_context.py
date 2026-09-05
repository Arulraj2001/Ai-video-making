from typing import Dict, Any, List
from app.models.video_bible import VideoBibleModel
from app.services.visual_style_engine import get_style_preset, normalize_style_id, composition_guidance

def build_visual_context(
    video_bible: VideoBibleModel,
    style_mode: str | None = None,
    aspect_ratio: str = "16:9",
) -> Dict[str, Any]:
    """
    Produces a normalized visual-consistency context dictionary
    that downstream AI prompt-generation services can use to enforce visual coherence.
    """
    style = video_bible.overall_style
    preset = get_style_preset(style_mode or style.visual_style)
    rules_str = ", ".join(video_bible.rules) if video_bible.rules else "None"

    # 1. Synthesize style prompt fragment
    label = style.visual_style if (preset.id == "custom" and style.visual_style) else preset.label
    style_fragments = [
        f"Visual Style: {label}",
        f"Style Language: {preset.visual_language}; Rendering: {preset.rendering}; Texture: {preset.texture}; Background: {preset.background}",
    ]
    # Only include photographic camera/lens details if the style is photographic
    if preset.id not in ("stickfigure", "whiteboard", "cartoon", "flat", "sketch", "anime", "3d"):
        if style.realism_level:
            style_fragments.append(f"Realism: {style.realism_level}")
        if style.lighting:
            style_fragments.append(f"Lighting: {style.lighting}")
        if style.color_treatment:
            style_fragments.append(f"Color Treatment: {style.color_treatment}")
        if style.camera_style:
            style_fragments.append(f"Camera: {style.camera_style}")
        if style.lens_cinematography:
            style_fragments.append(f"Lens & Cinematography: {style.lens_cinematography}")
        if style.mood:
            style_fragments.append(f"Mood: {style.mood}")
    else:
        style_fragments.append(f"Lighting: {preset.lighting}")
        style_fragments.append(f"Camera: {preset.camera}")
        style_fragments.append(f"Color Treatment: {preset.color_treatment}")

    style_fragments.append(f"Composition Guidance ({aspect_ratio}): {composition_guidance(aspect_ratio)}")

    # Filter contradictory rules for non-photographic styles
    raw_rules = list(video_bible.rules or [])
    if preset.id in ("stickfigure", "whiteboard", "cartoon", "flat", "sketch", "anime", "3d"):
        from app.services.visual_style_engine import _PHOTOGRAPHIC_CONFLICT_RULES
        filtered_rules = [r for r in raw_rules if r.strip().lower() not in _PHOTOGRAPHIC_CONFLICT_RULES]
    else:
        filtered_rules = raw_rules
    rules_str = ", ".join(filtered_rules) if filtered_rules else "None"
    style_fragments.append(f"Visual Directives: {rules_str}")
    style_prompt_fragment = ". ".join(style_fragments) + "."

    # 2. Build characters catalog
    characters_catalog: Dict[str, Any] = {}
    reference_images: List[Dict[str, Any]] = []

    for char in video_bible.characters:
        desc_parts = [char.name]
        if char.age_range:
            desc_parts.append(f"({char.age_range})")
        if char.appearance:
            desc_parts.append(f"Appearance: {char.appearance}")
        if char.clothing:
            desc_parts.append(f"Clothing: {char.clothing}")
        if char.personality:
            desc_parts.append(f"Personality: {char.personality}")
        if char.description:
            desc_parts.append(f"Role: {char.description}")

        char_prompt = ". ".join(desc_parts)
        characters_catalog[char.id] = {
            "id": char.id,
            "name": char.name,
            "prompt_descriptor": char_prompt,
            "has_reference_image": char.reference_image is not None,
            "reference_url": char.reference_image.url if char.reference_image else None
        }

        if char.reference_image:
            reference_images.append({
                "entity_type": "character",
                "entity_id": char.id,
                "entity_name": char.name,
                "url": char.reference_image.url,
                "filename": char.reference_image.filename
            })

    # 3. Build locations catalog
    locations_catalog: Dict[str, Any] = {}
    for loc in video_bible.locations:
        loc_parts = [f"Location: {loc.name}"]
        if loc.environment:
            loc_parts.append(f"Environment: {loc.environment}")
        if loc.lighting:
            loc_parts.append(f"Lighting: {loc.lighting}")
        if loc.description:
            loc_parts.append(f"Details: {loc.description}")

        loc_prompt = ". ".join(loc_parts)
        locations_catalog[loc.id] = {
            "id": loc.id,
            "name": loc.name,
            "prompt_descriptor": loc_prompt,
            "has_reference_image": loc.reference_image is not None,
            "reference_url": loc.reference_image.url if loc.reference_image else None
        }

        if loc.reference_image:
            reference_images.append({
                "entity_type": "location",
                "entity_id": loc.id,
                "entity_name": loc.name,
                "url": loc.reference_image.url,
                "filename": loc.reference_image.filename
            })

    # 4. Build objects catalog
    objects_catalog: Dict[str, Any] = {}
    for obj in video_bible.objects:
        obj_parts = [f"Object: {obj.name}"]
        if obj.description:
            obj_parts.append(obj.description)

        obj_prompt = ". ".join(obj_parts)
        objects_catalog[obj.id] = {
            "id": obj.id,
            "name": obj.name,
            "prompt_descriptor": obj_prompt,
            "has_reference_image": obj.reference_image is not None,
            "reference_url": obj.reference_image.url if obj.reference_image else None
        }

        if obj.reference_image:
            reference_images.append({
                "entity_type": "object",
                "entity_id": obj.id,
                "entity_name": obj.name,
                "url": obj.reference_image.url,
                "filename": obj.reference_image.filename
            })

    return {
        "style_prompt_fragment": style_prompt_fragment,
        "characters_catalog": characters_catalog,
        "locations_catalog": locations_catalog,
        "objects_catalog": objects_catalog,
        "active_rules": video_bible.rules,
        "style_preset_id": normalize_style_id(style_mode or style.visual_style),
        "style_preset": {
            "id": preset.id,
            "label": preset.label,
            "visual_language": preset.visual_language,
            "rendering": preset.rendering,
            "composition": preset.composition,
            "camera": preset.camera,
            "lighting": preset.lighting,
            "mood": preset.mood,
        },
        "composition_guidance": composition_guidance(aspect_ratio),
        "reference_images_catalog": reference_images
    }
