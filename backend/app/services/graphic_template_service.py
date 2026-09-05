import os
import io
import time
from typing import Optional, Tuple
from PIL import Image, ImageDraw, ImageFont

class GraphicTemplateService:
    """
    Renders high-resolution, broadcast-quality graphic card images (16:9 or 9:16)
    using Pillow without calling any external AI APIs.
    """

    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        h = hex_color.lstrip("#")
        if len(h) == 6:
            return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
        return (99, 102, 241)  # Default indigo

    def _get_font(self, size: int):
        font_candidates = [
            "arial.ttf",
            "arialbd.ttf",
            "segoeui.ttf",
            "segoeuib.ttf",
            "Helvetica.ttf",
            "DejaVuSans-Bold.ttf",
            "DejaVuSans.ttf",
        ]
        for f in font_candidates:
            try:
                return ImageFont.truetype(f, size)
            except Exception:
                continue
        return ImageFont.load_default()

    def render_template(
        self,
        template_type: str,
        headline: str,
        subtext: Optional[str] = None,
        accent_color: str = "#6366f1",
        step_number: Optional[str] = None,
        stat_number: Optional[str] = None,
        width: int = 1920,
        height: int = 1080
    ) -> bytes:
        img = Image.new("RGBA", (width, height), (15, 23, 42, 255))  # Slate 900
        draw = ImageDraw.Draw(img)
        rgb_accent = self._hex_to_rgb(accent_color)

        # Draw subtle gradient backdrop
        for y in range(height):
            factor = y / float(height)
            r = int(15 + (factor * 10))
            g = int(23 + (factor * 8))
            b = int(42 + (factor * 15))
            draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

        # Ambient colored glow circle top-right
        glow_center = (int(width * 0.8), int(height * 0.2))
        glow_radius = int(width * 0.25)
        draw.ellipse(
            [
                (glow_center[0] - glow_radius, glow_center[1] - glow_radius),
                (glow_center[0] + glow_radius, glow_center[1] + glow_radius)
            ],
            fill=(rgb_accent[0], rgb_accent[1], rgb_accent[2], 25)
        )

        font_large = self._get_font(int(height * 0.075))
        font_med = self._get_font(int(height * 0.045))
        font_small = self._get_font(int(height * 0.03))
        font_huge = self._get_font(int(height * 0.18))

        margin_x = int(width * 0.1)

        if template_type == "title_card":
            # Accent pill tag
            tag_y = int(height * 0.28)
            draw.rounded_rectangle(
                [margin_x, tag_y, margin_x + 140, tag_y + 36],
                radius=18,
                fill=(rgb_accent[0], rgb_accent[1], rgb_accent[2], 180)
            )
            draw.text((margin_x + 20, tag_y + 7), "KEY POINT", fill=(255, 255, 255, 255), font=font_small)

            # Headline
            title_y = int(height * 0.38)
            draw.text((margin_x, title_y), headline, fill=(255, 255, 255, 255), font=font_large)

            # Subtext
            if subtext:
                draw.text((margin_x, title_y + int(height * 0.16)), subtext, fill=(148, 163, 184, 255), font=font_med)

            # Bottom accent bar
            bar_y = int(height * 0.88)
            draw.rectangle([margin_x, bar_y, margin_x + 280, bar_y + 8], fill=rgb_accent)

        elif template_type == "quote_card":
            quote_y = int(height * 0.22)
            # Giant quotation mark
            draw.text((margin_x, quote_y), "“", fill=(rgb_accent[0], rgb_accent[1], rgb_accent[2], 180), font=font_huge)

            # Quote text
            text_y = quote_y + int(height * 0.16)
            draw.text((margin_x + 20, text_y), f"\"{headline}\"", fill=(248, 250, 252, 255), font=font_large)

            if subtext:
                draw.text((margin_x + 24, text_y + int(height * 0.22)), f"— {subtext}", fill=(rgb_accent[0], rgb_accent[1], rgb_accent[2], 255), font=font_med)

        elif template_type == "stats_card":
            stat_val = stat_number or "85%"
            stat_y = int(height * 0.25)
            draw.text((margin_x, stat_y), stat_val, fill=rgb_accent, font=font_huge)

            label_y = stat_y + int(height * 0.25)
            draw.text((margin_x, label_y), headline, fill=(255, 255, 255, 255), font=font_large)

            if subtext:
                draw.text((margin_x, label_y + int(height * 0.14)), subtext, fill=(148, 163, 184, 255), font=font_med)

        elif template_type == "step_card":
            step_lbl = step_number or "STEP 01"
            step_y = int(height * 0.24)
            draw.text((margin_x, step_y), step_lbl, fill=rgb_accent, font=font_med)

            line_y = step_y + int(height * 0.08)
            draw.line([(margin_x, line_y), (margin_x + int(width * 0.8), line_y)], fill=(51, 65, 85, 255), width=2)

            head_y = line_y + int(height * 0.06)
            draw.text((margin_x, head_y), headline, fill=(255, 255, 255, 255), font=font_large)

            if subtext:
                draw.text((margin_x, head_y + int(height * 0.15)), subtext, fill=(148, 163, 184, 255), font=font_med)

        else:  # split_layout or default
            split_x = int(width * 0.45)
            # Left panel accent fill
            draw.rectangle([(0, 0), (split_x, height)], fill=(30, 41, 59, 255))
            draw.line([(split_x, 0), (split_x, height)], fill=(rgb_accent[0], rgb_accent[1], rgb_accent[2], 120), width=4)

            # Left side content
            draw.text((int(width * 0.06), int(height * 0.42)), "OVERVIEW", fill=rgb_accent, font=font_med)

            # Right side content
            draw.text((split_x + int(width * 0.06), int(height * 0.35)), headline, fill=(255, 255, 255, 255), font=font_large)
            if subtext:
                draw.text((split_x + int(width * 0.06), int(height * 0.52)), subtext, fill=(148, 163, 184, 255), font=font_med)

        # Export as PNG bytes
        buf = io.BytesIO()
        img.convert("RGB").save(buf, format="PNG")
        return buf.getvalue()

graphic_template_service = GraphicTemplateService()
