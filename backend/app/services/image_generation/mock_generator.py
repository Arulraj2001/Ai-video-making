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
    Deterministic, offline image generator.
    Supports two rendering modes:
      - 'cinematic' (default): Dark gradient storyboard test card
      - 'stickfigure': White-background whiteboard animation style with stick figure poses
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
            notes="Offline deterministic generator. Use style_mode='stickfigure' for whiteboard animation style."
        )

    # -------------------------------------------------------------------------
    # Cinematic gradient mode
    # -------------------------------------------------------------------------

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

    def _render_cinematic(self, prompt: str, options: ImageGenerationOptions, references=None) -> bytes:
        if "[TRIGGER_FAILURE]" in prompt:
            raise RuntimeError("Simulated image generation failure for testing error handling and fault tolerance.")

        width = options.width or 1024
        height = options.height or 576
        bg_dark, bg_mid, accent = self._generate_palette(prompt)

        img = Image.new("RGB", (width, height), bg_dark)
        draw = ImageDraw.Draw(img)

        for y in range(height):
            factor = y / max(height, 1)
            r = int(bg_dark[0] * (1 - factor) + bg_mid[0] * factor)
            g = int(bg_dark[1] * (1 - factor) + bg_mid[1] * factor)
            b = int(bg_dark[2] * (1 - factor) + bg_mid[2] * factor)
            draw.line([(0, y), (width, y)], fill=(r, g, b))

        for x in range(0, width, max(width // 8, 32)):
            draw.line([(x, 0), (x, height)], fill=(r // 2 + 10, g // 2 + 10, b // 2 + 10))
        for y in range(0, height, max(height // 6, 32)):
            draw.line([(0, y), (width, y)], fill=(r // 2 + 10, g // 2 + 10, b // 2 + 10))

        border_margin = 24
        draw.rectangle(
            [(border_margin, border_margin), (width - border_margin, height - border_margin)],
            outline=accent, width=2
        )
        ch_len = 16
        for cx, cy in [(border_margin, border_margin), (width - border_margin, border_margin),
                       (border_margin, height - border_margin), (width - border_margin, height - border_margin)]:
            draw.line([(cx - ch_len, cy), (cx + ch_len, cy)], fill=accent, width=2)
            draw.line([(cx, cy - ch_len), (cx, cy + ch_len)], fill=accent, width=2)

        try:
            font_title = ImageFont.load_default()
            font_body = ImageFont.load_default()
            font_meta = ImageFont.load_default()
        except Exception:
            font_title = font_body = font_meta = None

        draw.text((border_margin + 16, border_margin + 16),
                  "AI VIDEO MAKER • STORYBOARD VISUAL PREVIEW", fill=accent, font=font_title)
        draw.text((width - border_margin - 240, border_margin + 16),
                  f"ASPECT: {options.aspect_ratio} ({width}x{height})", fill=(200, 200, 200), font=font_meta)

        max_chars_per_line = max(width // 14, 30)
        words = prompt.split()
        lines, current_line = [], []
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

        ref_names = []
        if references:
            for ref in references:
                ref_names.append(f"{ref.entity_type}:{ref.entity_name}")
                if ref.image_path:
                    try:
                        ref_img = Image.open(ref.image_path).convert("RGB")
                        ref_img.thumbnail((72, 72))
                        img.paste(ref_img, (width - border_margin - 88, height - border_margin - 88))
                        draw.rectangle(
                            [(width - border_margin - 88, height - border_margin - 88),
                             (width - border_margin - 16, height - border_margin - 16)],
                            outline=accent, width=1
                        )
                    except Exception:
                        pass

        footer = f"ENGINE: {self.capabilities.provider_name.upper()} • MODEL: {self._model_name}"
        if ref_names:
            footer += f" • REFS: {', '.join(ref_names[:2])}"
        draw.text((border_margin + 16, height - border_margin - 28), footer, fill=(160, 160, 160), font=font_meta)

        output = io.BytesIO()
        img.save(output, format="PNG")
        return output.getvalue()

    # -------------------------------------------------------------------------
    # Stick Figure / Whiteboard mode
    # -------------------------------------------------------------------------

    def _draw_stick_figure(self, draw: ImageDraw.ImageDraw, cx: int, cy: int,
                           scale: float = 1.0, color=(40, 40, 40)):
        """Draw a basic stick figure centered at (cx, cy)."""
        lw = max(2, int(3 * scale))
        head_r = int(28 * scale)
        draw.ellipse([(cx - head_r, cy - head_r), (cx + head_r, cy + head_r)], outline=color, width=lw)
        body_top = cy + head_r
        body_bot = cy + int(90 * scale)
        draw.line([(cx, body_top), (cx, body_bot)], fill=color, width=lw)
        arm_y = cy + int(45 * scale)
        arm_w = int(55 * scale)
        draw.line([(cx - arm_w, arm_y + int(20 * scale)), (cx, arm_y)], fill=color, width=lw)
        draw.line([(cx, arm_y), (cx + arm_w, arm_y + int(20 * scale))], fill=color, width=lw)
        leg_w = int(45 * scale)
        leg_h = int(70 * scale)
        draw.line([(cx, body_bot), (cx - leg_w, body_bot + leg_h)], fill=color, width=lw)
        draw.line([(cx, body_bot), (cx + leg_w, body_bot + leg_h)], fill=color, width=lw)

    def _draw_speech_bubble(self, draw: ImageDraw.ImageDraw, text: str,
                             bx: int, by: int, canvas_width: int, font, color=(40, 40, 40)):
        """Draw a speech bubble with wrapped text."""
        max_w = min(canvas_width - 120, 600)
        words = text.split()
        lines, cur = [], []
        for w in words:
            test = " ".join(cur + [w])
            if len(test) * 8 > max_w:
                lines.append(" ".join(cur))
                cur = [w]
            else:
                cur.append(w)
        if cur:
            lines.append(" ".join(cur))
        lines = lines[:4]

        pad, line_h = 16, 22
        bw = max_w + pad * 2
        bh = len(lines) * line_h + pad * 2

        draw.rounded_rectangle([(bx, by), (bx + bw, by + bh)], radius=12,
                                fill=(255, 255, 255), outline=color, width=2)
        tail_x = bx + 40
        tail_y = by + bh
        draw.polygon([(tail_x, tail_y), (tail_x + 20, tail_y), (tail_x + 5, tail_y + 18)],
                     fill=(255, 255, 255), outline=color)

        for i, line in enumerate(lines):
            draw.text((bx + pad, by + pad + i * line_h), line, fill=color, font=font)

    def _render_stickfigure(self, prompt: str, options: ImageGenerationOptions) -> bytes:
        """Whiteboard-style stick figure with speech bubble caption."""
        width = options.width or 1024
        height = options.height or 576

        img = Image.new("RGB", (width, height), (252, 252, 252))
        draw = ImageDraw.Draw(img)

        # Whiteboard horizontal lines
        for y in range(0, height, 40):
            draw.line([(0, y), (width, y)], fill=(220, 230, 240), width=1)

        h = int(hashlib.md5(prompt.encode()).hexdigest(), 16)
        num_figures = (h % 2) + 1
        positions = [
            (int(width * 0.28), int(height * 0.60)),
            (int(width * 0.55), int(height * 0.60)),
        ][:num_figures]

        for fx, fy in positions:
            self._draw_stick_figure(draw, fx, fy, scale=1.0 + (h % 3) * 0.15)

        try:
            font = ImageFont.load_default()
        except Exception:
            font = None

        bubble_x = int(width * 0.05)
        bubble_y = int(height * 0.06)
        self._draw_speech_bubble(draw, prompt[:180], bubble_x, bubble_y, width, font)

        draw.text((20, height - 28),
                  f"[STICKFIGURE MODE] • {options.aspect_ratio} • {width}×{height}",
                  fill=(160, 160, 160), font=font)

        output = io.BytesIO()
        img.save(output, format="PNG")
        return output.getvalue()

    # -------------------------------------------------------------------------
    # Public interface
    # -------------------------------------------------------------------------

    def _render_image(self, prompt: str, options: ImageGenerationOptions,
                      references=None, style_mode: Optional[str] = None) -> bytes:
        mode = (style_mode or "cinematic").lower()
        if mode == "stickfigure":
            return self._render_stickfigure(prompt, options)
        return self._render_cinematic(prompt, options, references)

    async def generate_image(
        self, prompt: str, options: ImageGenerationOptions,
        style_mode: Optional[str] = None, seed: Optional[int] = None,
    ) -> GeneratedImageResult:
        image_bytes = self._render_image(prompt, options, style_mode=style_mode)
        return GeneratedImageResult(
            image_bytes=image_bytes,
            content_type="image/png",
            provider="mock",
            model=self._model_name,
            metadata={
                "provider": "mock",
                "model": self._model_name,
                "style_mode": style_mode or "cinematic",
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
        options: ImageGenerationOptions,
        style_mode: Optional[str] = None,
        seed: Optional[int] = None,
    ) -> GeneratedImageResult:
        image_bytes = self._render_image(prompt, options, references=references, style_mode=style_mode)
        ref_tags = [f"{r.entity_type}:{r.entity_name}" for r in references]
        return GeneratedImageResult(
            image_bytes=image_bytes,
            content_type="image/png",
            provider="mock",
            model=self._model_name,
            metadata={
                "provider": "mock",
                "model": self._model_name,
                "style_mode": style_mode or "cinematic",
                "aspect_ratio": options.aspect_ratio,
                "width": options.width,
                "height": options.height,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "references_used": ref_tags,
                "simulated": True
            }
        )
