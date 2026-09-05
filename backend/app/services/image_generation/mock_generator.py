import io
import hashlib
from datetime import datetime, timezone
from typing import List, Optional
from PIL import Image, ImageDraw, ImageFont

from app.services.image_generation.base import (
    BaseImageGenerator,
    ImageGenerationOptions,
    ImageReference,
    GeneratedImageResult,
    ProviderCapabilities,
)

class MockImageGenerator(BaseImageGenerator):
    """
    Deterministic, offline image generator producing high-aesthetic storyboard test cards.
    Ideal for zero-cost development, automated tests, and CI/CD pipelines.
    """

    def __init__(self, model_name: str = "mock-cinematic-v1"):
        self._model_name = model_name

    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            provider_name="mock",
            model_name=self._model_name,
            supports_reference_images=True,
            supports_negative_prompt=True,
            supported_aspect_ratios=["16:9", "9:16", "1:1", "4:3", "21:9"],
            notes="Offline deterministic generator rendering high-aesthetic storyboard visuals with Pillow."
        )

    def _generate_palette(self, prompt: str):
        """Derive a cinematic dark palette deterministically from the prompt text."""
        h = int(hashlib.md5(prompt.encode("utf-8")).hexdigest(), 16)
        hue_variants = [
            ((15, 23, 42), (30, 41, 59), (56, 189, 248)),    # Deep Blue / Cyan
            ((24, 15, 38), (49, 27, 78), (216, 180, 254)),   # Dystopian Purple
            ((13, 27, 24), (20, 50, 45), (52, 211, 153)),    # Cyber Emerald
            ((38, 20, 15), (78, 35, 20), (251, 146, 60)),    # Amber Sunset
            ((20, 20, 25), (40, 40, 50), (148, 163, 184)),   # Monochromatic Slate
        ]
        return hue_variants[h % len(hue_variants)]

    def _render_image(
        self,
        prompt: str,
        options: ImageGenerationOptions,
        references: Optional[List[ImageReference]] = None
    ) -> bytes:
        if "[TRIGGER_FAILURE]" in prompt:
            raise RuntimeError("Simulated image generation failure for testing error handling and fault tolerance.")

        width = options.width or 1024
        height = options.height or 576

        bg_dark, bg_mid, accent = self._generate_palette(prompt)

        # Create base canvas
        img = Image.new("RGB", (width, height), bg_dark)
        draw = ImageDraw.Draw(img)

        # Draw subtle vertical gradient
        for y in range(height):
            factor = y / max(height, 1)
            r = int(bg_dark[0] * (1 - factor) + bg_mid[0] * factor)
            g = int(bg_dark[1] * (1 - factor) + bg_mid[1] * factor)
            b = int(bg_dark[2] * (1 - factor) + bg_mid[2] * factor)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        # Atmospheric grid / framing lines
        grid_color = (255, 255, 255, 20)
        for x in range(0, width, max(width // 8, 32)):
            draw.line([(x, 0), (x, height)], fill=(r // 2 + 10, g // 2 + 10, b // 2 + 10))
        for y in range(0, height, max(height // 6, 32)):
            draw.line([(0, y), (width, y)], fill=(r // 2 + 10, g // 2 + 10, b // 2 + 10))

        # Draw cinematic letterbox bars or border frame
        border_margin = 24
        draw.rectangle(
            [(border_margin, border_margin), (width - border_margin, height - border_margin)],
            outline=accent,
            width=2
        )

        # Corner crosshairs
        ch_len = 16
        corners = [
            (border_margin, border_margin),
            (width - border_margin, border_margin),
            (border_margin, height - border_margin),
            (width - border_margin, height - border_margin)
        ]
        for cx, cy in corners:
            draw.line([(cx - ch_len, cy), (cx + ch_len, cy)], fill=accent, width=2)
            draw.line([(cx, cy - ch_len), (cx, cy + ch_len)], fill=accent, width=2)

        # Load default font
        try:
            font_title = ImageFont.load_default()
            font_body = ImageFont.load_default()
            font_meta = ImageFont.load_default()
        except Exception:
            font_title = None
            font_body = None
            font_meta = None

        # Top Header
        header_text = "AI VIDEO MAKER • STORYBOARD VISUAL PREVIEW"
        draw.text((border_margin + 16, border_margin + 16), header_text, fill=accent, font=font_title)

        # Aspect ratio badge
        ar_badge = f"ASPECT: {options.aspect_ratio} ({width}x{height})"
        draw.text((width - border_margin - 240, border_margin + 16), ar_badge, fill=(200, 200, 200), font=font_meta)

        # Main prompt text wrapped in center
        max_chars_per_line = max(width // 14, 30)
        words = prompt.split()
        lines = []
        current_line = []

        for word in words:
            if len(" ".join(current_line + [word])) <= max_chars_per_line:
                current_line.append(word)
            else:
                lines.append(" ".join(current_line))
                current_line = [word]
            if len(lines) >= 6:
                break
        if current_line and len(lines) < 6:
            lines.append(" ".join(current_line))

        prompt_box_y = height // 2 - (len(lines) * 14)
        for i, line in enumerate(lines):
            draw.text((border_margin + 24, prompt_box_y + (i * 24)), line, fill=(255, 255, 255), font=font_body)

        # Reference thumbnails inset if provided and present on disk
        ref_names = []
        if references:
            for r in references:
                ref_names.append(f"{r.entity_type}:{r.entity_name}")
                if r.image_path:
                    try:
                        ref_img = Image.open(r.image_path).convert("RGB")
                        ref_img.thumbnail((72, 72))
                        img.paste(ref_img, (width - border_margin - 88, height - border_margin - 88))
                        draw.rectangle(
                            [(width - border_margin - 88, height - border_margin - 88),
                             (width - border_margin - 16, height - border_margin - 16)],
                            outline=accent,
                            width=1
                        )
                    except Exception:
                        pass

        # Footer
        footer_text = f"ENGINE: {self.capabilities.provider_name.upper()} • MODEL: {self._model_name}"
        if ref_names:
            footer_text += f" • REFS: {', '.join(ref_names[:2])}"
        draw.text((border_margin + 16, height - border_margin - 28), footer_text, fill=(160, 160, 160), font=font_meta)

        output = io.BytesIO()
        img.save(output, format="PNG")
        return output.getvalue()

    async def generate_image(self, prompt: str, options: ImageGenerationOptions) -> GeneratedImageResult:
        image_bytes = self._render_image(prompt, options, references=None)
        return GeneratedImageResult(
            image_bytes=image_bytes,
            content_type="image/png",
            provider="mock",
            model=self._model_name,
            metadata={
                "provider": "mock",
                "model": self._model_name,
                "aspect_ratio": options.aspect_ratio,
                "width": options.width,
                "height": options.height,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "references_used": [],
                "simulated": True
            }
        )

    async def generate_image_with_references(
        self,
        prompt: str,
        references: List[ImageReference],
        options: ImageGenerationOptions
    ) -> GeneratedImageResult:
        image_bytes = self._render_image(prompt, options, references=references)
        ref_tags = [f"{r.entity_type}:{r.entity_name}" for r in references]
        return GeneratedImageResult(
            image_bytes=image_bytes,
            content_type="image/png",
            provider="mock",
            model=self._model_name,
            metadata={
                "provider": "mock",
                "model": self._model_name,
                "aspect_ratio": options.aspect_ratio,
                "width": options.width,
                "height": options.height,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "references_used": ref_tags,
                "simulated": True
            }
        )
