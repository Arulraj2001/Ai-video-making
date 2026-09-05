from typing import Dict, Any, List
from app.models.video_bible import VideoBibleModel

def build_visual_context(video_bible: VideoBibleModel) -> Dict[str, Any]:
    """
    Produces a normalized visual-consistency context dictionary
    that downstream AI prompt-generation services can use to enforce visual coherence.
    """
    style = video_bible.overall_style
    rules_str = ", ".join(video_bible.rules) if video_bible.rules else "None"

    # 1. Synthesize style prompt fragment
    style_fragments = [
        f"Visual Style: {style.visual_style}",
        f"Realism: {style.realism_level}",
        f"Lighting: {style.lighting}",
        f"Color Treatment: {style.color_treatment}",
        f"Camera: {style.camera_style}",
        f"Lens & Cinematography: {style.lens_cinematography}",
        f"Mood: {style.mood}",
        f"Visual Directives: {rules_str}"
    ]
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
        "reference_images_catalog": reference_images
    }
