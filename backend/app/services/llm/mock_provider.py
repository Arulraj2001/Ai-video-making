import re
from typing import List, Dict, Any
from .base import BaseLLMProvider

class MockLLMProvider(BaseLLMProvider):
    """
    Intelligent, deterministic mock provider that simulates LLM storyboard generation.
    Incorporates the Video Bible visual context, character continuity, location consistency,
    composition rules, and duration-aware cinematography without requiring external API keys.
    """

    @property
    def provider_name(self) -> str:
        return "mock"

    def _extract_matching_entities(self, caption: str, visual_context: Dict[str, Any]) -> Dict[str, Any]:
        """Detect characters, locations, and objects referenced in caption or context."""
        cap_lower = caption.lower()
        cap_tokens = {t for t in re.findall(r"[a-z0-9]+", cap_lower) if len(t) > 2}
        stopwords = {"the", "and", "for", "with", "his", "her", "their", "its", "bobs", "bob", "new", "old", "room"}

        matched_chars = []
        for key, data in visual_context.get("characters_catalog", {}).items():
            name = data.get("name", key)
            name_tokens = {t for t in re.findall(r"[a-z0-9]+", name.lower()) if t not in stopwords and len(t) > 2}
            if name.lower() in cap_lower or (name_tokens and name_tokens & cap_tokens):
                matched_chars.append({"name": name, **data})

        matched_locs = []
        for key, data in visual_context.get("locations_catalog", {}).items():
            name = data.get("name", key)
            name_tokens = {t for t in re.findall(r"[a-z0-9]+", name.lower()) if t not in stopwords and len(t) > 2}
            if name.lower() in cap_lower or (name_tokens and name_tokens & cap_tokens):
                matched_locs.append({"name": name, **data})

        matched_objs = []
        for key, data in visual_context.get("objects_catalog", {}).items():
            name = data.get("name", key)
            name_tokens = {t for t in re.findall(r"[a-z0-9]+", name.lower()) if t not in stopwords and len(t) > 2}
            if name.lower() in cap_lower or (name_tokens and name_tokens & cap_tokens):
                matched_objs.append({"name": name, **data})

        return {
            "characters": matched_chars,
            "locations": matched_locs,
            "objects": matched_objs,
        }

    def _build_scene_metadata(
        self,
        scene: Dict[str, Any],
        visual_context: Dict[str, Any],
        index: int,
        total: int,
        instructions: str = "",
        aspect_ratio: str = "16:9"
    ) -> Dict[str, Any]:
        caption = scene.get("caption", "").strip()
        duration = float(scene.get("duration", 5.0))
        style_fragment = visual_context.get("style_prompt_fragment", "").strip()

        entities = self._extract_matching_entities(caption, visual_context)
        chars = entities["characters"]
        locs = entities["locations"]
        objs = entities["objects"]

        # 1. Synthesize Visual Description (narrative understanding of the scene)
        char_desc = ""
        if chars:
            c = chars[0]
            desc = c.get("prompt_descriptor") or f"{c['name']} ({c.get('appearance', 'distinct appearance')}, wearing {c.get('clothing', 'signature clothing')})"
            char_desc = f"featuring {desc}"

        loc_desc = ""
        if locs:
            l = locs[0]
            loc_desc = f"set in {l.get('prompt_descriptor', l['name'])}"

        obj_desc = ""
        if objs:
            o = objs[0]
            obj_desc = f", prominently highlighting the {o.get('prompt_descriptor', o['name'])}"

        clean_caption = re.sub(r'["\']', '', caption)
        visual_description = (
            f"Scene visualizing '{clean_caption}'. "
            f"{char_desc.capitalize() if char_desc else 'A clear narrative composition'} "
            f"{loc_desc}{obj_desc}. The framing captures the primary subject and key action."
        )
        if instructions:
            visual_description += f" Directed alteration: {instructions}."

        # 2. Synthesize Image Prompt (Scene Action FIRST!)
        prompt_parts = [f"Scene: {clean_caption}"]

        # Continuity: Characters
        if chars:
            c = chars[0]
            prompt_parts.append(c.get("prompt_descriptor") or f"character {c['name']} with {c.get('appearance', 'detailed visual identity')}")

        # Continuity: Location
        if locs:
            l = locs[0]
            prompt_parts.append(l.get("prompt_descriptor") or f"environment of {l['name']}")

        # Continuity: Objects
        if objs:
            o = objs[0]
            prompt_parts.append(o.get("prompt_descriptor") or f"featuring detailed {o['name']}")

        if style_fragment:
            prompt_parts.append(style_fragment)

        if instructions:
            prompt_parts.append(f"stylistic modification: {instructions}")

        composition = visual_context.get("composition_guidance", f"{aspect_ratio} composition")
        prompt_parts.append(f"{composition}, balanced readable framing, sharp focus, master cinematography")
        prompt_parts.append("--no text, typography, captions, subtitles, logos, watermarks, signature, split screen, low quality")

        image_prompt = ", ".join(prompt_parts)

        # 3. Suggested Motion (Duration-aware)
        if duration <= 3.5:
            motion = "Subtle fast push-in with camera stabilization"
        elif duration <= 6.0:
            motion = "Slow cinematic dolly forward, gentle parallax depth"
        elif duration <= 10.0:
            motion = "Smooth lateral tracking shot with atmospheric floating dust motes"
        else:
            motion = "Slow atmospheric crane descent, deep focus multi-plane hold"

        # 4. Suggested Transition
        if index == 0:
            transition = "Fade in from black"
        elif index == total - 1:
            transition = "Fade out to black"
        elif duration <= 3.0:
            transition = "Hard cut"
        elif "remember" in caption.lower() or "meanwhile" in caption.lower() or "later" in caption.lower():
            transition = "Cross dissolve (0.8s)"
        else:
            transition = "Cinematic cut"

        return {
            "id": scene.get("id", f"scene-{index+1:03d}"),
            "visual_description": visual_description,
            "image_prompt": image_prompt,
            "suggested_motion": motion,
            "suggested_transition": transition,
        }

    async def generate_storyboard_scenes(
        self,
        scenes: List[Dict[str, Any]],
        visual_context: Dict[str, Any],
        aspect_ratio: str = "16:9"
    ) -> List[Dict[str, Any]]:
        total = len(scenes)
        results = []
        for i, s in enumerate(scenes):
            meta = self._build_scene_metadata(s, visual_context, i, total, aspect_ratio=aspect_ratio)
            results.append(meta)
        return results

    async def regenerate_scene(
        self,
        scene: Dict[str, Any],
        visual_context: Dict[str, Any],
        instructions: str = "",
        aspect_ratio: str = "16:9"
    ) -> Dict[str, Any]:
        return self._build_scene_metadata(
            scene,
            visual_context,
            index=0,
            total=1,
            instructions=instructions,
            aspect_ratio=aspect_ratio
        )
