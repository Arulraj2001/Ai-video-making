import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def get_rounded_polygon_points(vertices, radius, points_per_corner=16):
    """
    Computes points for a polygon with perfectly rounded tangent fillet corners.
    """
    n = len(vertices)
    poly_points = []
    
    for i in range(n):
        v_prev = vertices[(i - 1) % n]
        v_curr = vertices[i]
        v_next = vertices[(i + 1) % n]
        
        d1 = (v_prev[0] - v_curr[0], v_prev[1] - v_curr[1])
        d2 = (v_next[0] - v_curr[0], v_next[1] - v_curr[1])
        
        len1 = math.hypot(d1[0], d1[1])
        len2 = math.hypot(d2[0], d2[1])
        
        u1 = (d1[0] / len1, d1[1] / len1)
        u2 = (d2[0] / len2, d2[1] / len2)
        
        dot = max(-1.0, min(1.0, u1[0] * u2[0] + u1[1] * u2[1]))
        half_angle = math.acos(dot) / 2.0
        dist = radius / math.tan(half_angle)
        dist = min(dist, min(len1, len2) * 0.48)
        actual_radius = dist * math.tan(half_angle)
        
        t1 = (v_curr[0] + u1[0] * dist, v_curr[1] + u1[1] * dist)
        t2 = (v_curr[0] + u2[0] * dist, v_curr[1] + u2[1] * dist)
        
        bisector = (u1[0] + u2[0], u1[1] + u2[1])
        b_len = math.hypot(bisector[0], bisector[1])
        if b_len < 1e-6:
            poly_points.append(v_curr)
            continue
        u_b = (bisector[0] / b_len, bisector[1] / b_len)
        center_dist = actual_radius / math.sin(half_angle)
        c = (v_curr[0] + u_b[0] * center_dist, v_curr[1] + u_b[1] * center_dist)
        
        a1 = math.atan2(t1[1] - c[1], t1[0] - c[0])
        a2 = math.atan2(t2[1] - c[1], t2[0] - c[0])
        diff = (a2 - a1) % (2 * math.pi)
        if diff > math.pi:
            diff -= 2 * math.pi
            
        for s in range(points_per_corner + 1):
            t = s / points_per_corner
            ang = a1 + diff * t
            px = c[0] + actual_radius * math.cos(ang)
            py = c[1] + actual_radius * math.sin(ang)
            poly_points.append((px, py))
            
    return poly_points


def create_scenora_icon(size: int) -> Image.Image:
    """
    Renders the ScenoraEdits emblem with tangent-fillet rounded play button,
    camera lens aperture, clapper accents, and AI magic star.
    """
    scale = 4
    cs = size * scale
    img = Image.new("RGBA", (cs, cs), (0, 0, 0, 0))
    pad = int(cs * 0.05)
    rad = int(cs * 0.24)
    box = [pad, pad, cs - pad, cs - pad]

    # 1. Background Squircle: Indigo (#6366F1) to Royal Violet (#3730A3)
    base = Image.new("RGBA", (cs, cs), (0, 0, 0, 0))
    for y in range(pad, cs - pad):
        f = (y - pad) / max(1, (cs - 2 * pad))
        r = int(99 * (1 - f) + 55 * f)
        g = int(102 * (1 - f) + 48 * f)
        b = int(241 * (1 - f) + 163 * f)
        ImageDraw.Draw(base).line([(pad, y), (cs - pad, y)], fill=(r, g, b, 255))

    mask = Image.new("L", (cs, cs), 0)
    ImageDraw.Draw(mask).rounded_rectangle(box, radius=rad, fill=255)
    img.paste(base, (0, 0), mask)

    draw = ImageDraw.Draw(img)
    # Glassy inner border
    draw.rounded_rectangle(box, radius=rad, outline=(255, 255, 255, 75), width=max(1, int(2.5 * scale)))

    cx = cs / 2
    cy = cs / 2

    # 2. Concentric Lens Rings
    ring_r = int(cs * 0.31)
    draw.ellipse([cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r], outline=(255, 255, 255, 35), width=max(1, int(2 * scale)))

    # 3. Clapper Slashes across top
    slash_w = max(1, int(cs * 0.04))
    slash_h = int(cs * 0.14)
    for x_off in [-0.16, -0.02, 0.12]:
        sx = int(cx + cs * x_off)
        sy = int(cs * 0.16)
        draw.line([(sx, sy), (sx + int(slash_h * 0.5), sy + slash_h)], fill=(255, 255, 255, 55), width=slash_w)

    # 4. Optically Balanced Smooth Play Prism
    opt_cx = cx + int(cs * 0.038)
    tri_r = cs * 0.21
    v0 = (opt_cx - tri_r * 0.72, cy - tri_r * 0.90)
    v1 = (opt_cx + tri_r * 1.05, cy)
    v2 = (opt_cx - tri_r * 0.72, cy + tri_r * 0.90)

    fillet_r = max(1, int(14 * scale))
    smooth_pts = get_rounded_polygon_points([v0, v1, v2], fillet_r)

    # Ambient drop shadow under play prism
    shadow_play = Image.new("RGBA", (cs, cs), (0, 0, 0, 0))
    s_pts = [(p[0], p[1] + int(7 * scale)) for p in smooth_pts]
    ImageDraw.Draw(shadow_play).polygon(s_pts, fill=(20, 15, 60, 160))
    shadow_play = shadow_play.filter(ImageFilter.GaussianBlur(max(1, int(9 * scale))))
    img = Image.alpha_composite(img, shadow_play)

    # Draw Play Triangle with Flame Orange (#FF6B00)
    play_layer = Image.new("RGBA", (cs, cs), (0, 0, 0, 0))
    ImageDraw.Draw(play_layer).polygon(smooth_pts, fill=(255, 107, 0, 255))

    # Inner gloss reflection bevel
    draw_play = ImageDraw.Draw(play_layer)
    b_start = (v0[0] + int(12 * scale), v0[1] + int(12 * scale))
    b_end = (v1[0] - int(16 * scale), v1[1] - int(4 * scale))
    draw_play.line([b_start, b_end], fill=(255, 225, 160, 210), width=max(1, int(2.5 * scale)))

    img = Image.alpha_composite(img, play_layer)
    draw = ImageDraw.Draw(img)

    # 5. Magic AI Spark at top-right
    spark_cx = int(cs * 0.76)
    spark_cy = int(cs * 0.23)
    s_r = int(cs * 0.065)
    draw.polygon([
        (spark_cx, spark_cy - s_r), (spark_cx + s_r*0.28, spark_cy - s_r*0.28),
        (spark_cx + s_r, spark_cy), (spark_cx + s_r*0.28, spark_cy + s_r*0.28),
        (spark_cx, spark_cy + s_r), (spark_cx - s_r*0.28, spark_cy + s_r*0.28),
        (spark_cx - s_r, spark_cy), (spark_cx - s_r*0.28, spark_cy - s_r*0.28),
    ], fill=(255, 193, 7, 255))
    draw.ellipse([spark_cx - s_r*0.22, spark_cy - s_r*0.22, spark_cx + s_r*0.22, spark_cy + s_r*0.22], fill=(255, 255, 255, 240))

    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img


def generate_favicons(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)

    sizes = {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "favicon-48x48.png": 48,
        "apple-touch-icon.png": 180,
        "android-chrome-192x192.png": 192,
        "android-chrome-512x512.png": 512,
    }

    images = {}
    for filename, s in sizes.items():
        icon = create_scenora_icon(s)
        path = os.path.join(output_dir, filename)
        icon.save(path, format="PNG")
        images[s] = icon
        print(f"Generated {filename} ({s}x{s})")

    # Generate multi-layer Windows favicon.ico containing 16x16, 32x32, 48x48
    ico_path = os.path.join(output_dir, "favicon.ico")
    icon_48 = images[48]
    icon_48.save(
        ico_path,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print(f"Generated favicon.ico (16, 32, 48)")

    # Generate matching SVG favicon
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="scenora-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#3730A3" />
    </linearGradient>
    <linearGradient id="scenora-play" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF8533" />
      <stop offset="100%" stop-color="#FF4500" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#312E81" flood-opacity="0.35" />
    </filter>
  </defs>
  <!-- Squircle Base -->
  <rect x="3" y="3" width="58" height="58" rx="15" fill="url(#scenora-bg)" filter="url(#shadow)" />
  <rect x="3" y="3" width="58" height="58" rx="15" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="1.5" />
  
  <!-- Lens Ring -->
  <circle cx="32" cy="32" r="18" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="2" />
  
  <!-- Film Clapper Slashes -->
  <line x1="22" y1="11" x2="28" y2="20" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="2.5" stroke-linecap="round" />
  <line x1="31" y1="11" x2="37" y2="20" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="2.5" stroke-linecap="round" />
  
  <!-- Smooth Play Prism -->
  <path d="M 23 20 C 23 18.5 24.5 17.5 26 18.5 L 45 29.5 C 46.5 30.5 46.5 32.5 45 33.5 L 26 44.5 C 24.5 45.5 23 44.5 23 43 Z" fill="url(#scenora-play)" />
  <path d="M 25 21 L 43 31.5" stroke="#FFE4B5" stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round" />
  
  <!-- AI Golden Magic Star -->
  <path d="M 48 11 L 49.5 14.5 L 53 16 L 49.5 17.5 L 48 21 L 46.5 17.5 L 43 16 L 46.5 14.5 Z" fill="#FFC107" />
  <circle cx="48" cy="16" r="1.2" fill="#FFFFFF" />
</svg>'''
    with open(os.path.join(output_dir, "favicon.svg"), "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("Generated favicon.svg")


def generate_og_image(output_path: str):
    """
    Creates a perfectly clean, high-resolution 1200x630 OpenGraph social share card.
    Light SaaS Aesthetic:
    - Pristine, bright canvas (#FFFFFF / #F8FAFC)
    - Subtle ambient purple & orange glows
    - Distinct ScenoraEdits emblem
    - Perfectly positioned badges, headline, and subtitle without any text overlaps
    - Floating Studio Workspace card on right side
    """
    W = 1200
    H = 630
    scale = 2
    img = Image.new("RGBA", (W * scale, H * scale), (250, 252, 255, 255))

    # 1. Soft atmospheric ambient lighting
    glow_purple = Image.new("RGBA", (W * scale, H * scale), (0, 0, 0, 0))
    glow_p_draw = ImageDraw.Draw(glow_purple)
    glow_p_draw.ellipse([-150, -150, 600, 600], fill=(124, 58, 237, 20))
    glow_purple = glow_purple.filter(ImageFilter.GaussianBlur(140))
    img = Image.alpha_composite(img, glow_purple)

    glow_orange = Image.new("RGBA", (W * scale, H * scale), (0, 0, 0, 0))
    glow_o_draw = ImageDraw.Draw(glow_orange)
    glow_o_draw.ellipse([W * scale - 600, H * scale - 500, W * scale + 150, H * scale + 150], fill=(255, 107, 0, 18))
    glow_orange = glow_orange.filter(ImageFilter.GaussianBlur(150))
    img = Image.alpha_composite(img, glow_orange)

    draw = ImageDraw.Draw(img)

    # 2. Technical background grid
    grid_spacing = 38 * scale
    for x in range(0, W * scale, grid_spacing):
        draw.line([(x, 0), (x, H * scale)], fill=(226, 232, 240, 50), width=1)
    for y in range(0, H * scale, grid_spacing):
        draw.line([(0, y), (W * scale, y)], fill=(226, 232, 240, 50), width=1)

    # Fonts
    font_bold_path = "C:/Windows/Fonts/segoeuib.ttf"
    font_reg_path = "C:/Windows/Fonts/segoeui.ttf"
    font_semi_path = "C:/Windows/Fonts/seguisb.ttf"
    if not os.path.exists(font_bold_path):
        font_bold_path = "C:/Windows/Fonts/arialbd.ttf"
        font_reg_path = "C:/Windows/Fonts/arial.ttf"
        font_semi_path = "C:/Windows/Fonts/arialbd.ttf"

    font_logo_brand = ImageFont.truetype(font_bold_path, 36 * scale)
    font_badge = ImageFont.truetype(font_bold_path, 13 * scale)
    font_headline = ImageFont.truetype(font_bold_path, 46 * scale)
    font_subhead = ImageFont.truetype(font_reg_path, 19 * scale)
    font_pill = ImageFont.truetype(font_bold_path, 14 * scale)
    font_footer = ImageFont.truetype(font_semi_path, 15 * scale)
    font_card_title = ImageFont.truetype(font_bold_path, 14 * scale)
    font_card_text = ImageFont.truetype(font_reg_path, 12 * scale)

    left_margin = 72 * scale

    # 3. Top Row: Badge + Brand Logo
    pill_y = 60 * scale
    pill_text = "5-STAGE AI VIDEO STUDIO"
    pill_bbox = draw.textbbox((left_margin, pill_y), pill_text, font=font_badge)
    pill_w = pill_bbox[2] - pill_bbox[0] + int(32 * scale)
    pill_h = int(28 * scale)

    draw.rounded_rectangle(
        [left_margin, pill_y, left_margin + pill_w, pill_y + pill_h],
        radius=int(14 * scale),
        fill=(238, 242, 255, 255),
        outline=(199, 210, 254, 255),
        width=int(1.5 * scale)
    )
    # Pulsing purple dot
    dot_r = int(4 * scale)
    dot_cx = left_margin + int(14 * scale)
    dot_cy = pill_y + int(14 * scale)
    draw.ellipse([dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r], fill=(99, 102, 241, 255))
    draw.text((left_margin + int(24 * scale), pill_y + int(5 * scale)), pill_text, fill=(79, 70, 229, 255), font=font_badge)

    # Next Row: Logo Icon & Name
    logo_y = pill_y + int(46 * scale)
    icon_size = 48 * scale
    icon_img = create_scenora_icon(icon_size)
    img.paste(icon_img, (left_margin, logo_y), icon_img)

    text_x = left_margin + icon_size + int(16 * scale)
    draw.text((text_x, logo_y + int(3 * scale)), "Scenora", fill=(17, 24, 39, 255), font=font_logo_brand)
    bbox_s = draw.textbbox((text_x, logo_y + int(3 * scale)), "Scenora", font=font_logo_brand)
    edits_x = bbox_s[2]
    draw.text((edits_x, logo_y + int(3 * scale)), "Edits", fill=(255, 107, 0, 255), font=font_logo_brand)

    # 4. Main Headline
    head_y = logo_y + int(76 * scale)
    line1 = "Turn Audio & Scripts into"
    line2 = "Consistent AI Videos"
    draw.text((left_margin, head_y), line1, fill=(15, 23, 42, 255), font=font_headline)
    draw.text((left_margin, head_y + int(56 * scale)), line2, fill=(79, 70, 229, 255), font=font_headline)

    # 5. Subtitle
    sub_y = head_y + int(130 * scale)
    subhead_line = "The scene-by-scene production studio for creators.\nLock character faces, burn subtitles, add Ken Burns\nmotion, and export finished Full HD MP4 videos."
    draw.text((left_margin, sub_y), subhead_line, fill=(75, 85, 99, 255), font=font_subhead, spacing=int(7 * scale))

    # 6. Feature Pills (Clean 2x2 Grid with colored dots)
    pills_y = sub_y + int(96 * scale)
    feature_items = [
        ("Audio Voiceover Sync", (255, 107, 0)),
        ("Character Face Lock", (124, 58, 237)),
        ("Live Ken Burns Motion", (37, 99, 235)),
        ("1080p Studio MP4 Export", (16, 185, 129)),
    ]

    col_gap = int(14 * scale)
    row_gap = int(12 * scale)
    pill_w = int(240 * scale)
    pill_h = int(34 * scale)

    for i, (label, dot_col) in enumerate(feature_items):
        r_idx = i // 2
        c_idx = i % 2
        px = left_margin + c_idx * (pill_w + col_gap)
        py = pills_y + r_idx * (pill_h + row_gap)

        draw.rounded_rectangle(
            [px, py, px + pill_w, py + pill_h],
            radius=int(8 * scale),
            fill=(255, 255, 255, 255),
            outline=(226, 232, 240, 255),
            width=int(1.2 * scale)
        )
        draw.ellipse([px + int(12 * scale), py + int(12 * scale), px + int(20 * scale), py + int(20 * scale)], fill=dot_col)
        draw.text((px + int(28 * scale), py + int(8 * scale)), label, fill=(31, 41, 55, 255), font=font_pill)

    # 7. Floating Studio Timeline Preview Card on Right Side
    card_x = int(670 * scale)
    card_y = int(70 * scale)
    card_w = int(455 * scale)
    card_h = int(445 * scale)
    card_rad = int(16 * scale)

    # Shadow
    shadow_img = Image.new("RGBA", (W * scale, H * scale), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_img)
    s_draw.rounded_rectangle(
        [card_x - 4, card_y + 8, card_x + card_w + 4, card_y + card_h + 16],
        radius=card_rad + 4,
        fill=(15, 23, 42, 24)
    )
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(22))
    img = Image.alpha_composite(img, shadow_img)

    draw = ImageDraw.Draw(img)

    # Card Base
    draw.rounded_rectangle(
        [card_x, card_y, card_x + card_w, card_y + card_h],
        radius=card_rad,
        fill=(255, 255, 255, 255),
        outline=(226, 232, 240, 255),
        width=int(1.5 * scale)
    )

    # Card Header
    draw.rounded_rectangle(
        [card_x, card_y, card_x + card_w, card_y + int(46 * scale)],
        radius=card_rad,
        fill=(248, 250, 252, 255)
    )
    dot_y = card_y + int(23 * scale)
    draw.ellipse([card_x + int(18 * scale), dot_y - 5, card_x + int(28 * scale), dot_y + 5], fill=(239, 68, 68, 255))
    draw.ellipse([card_x + int(34 * scale), dot_y - 5, card_x + int(44 * scale), dot_y + 5], fill=(245, 158, 11, 255))
    draw.ellipse([card_x + int(50 * scale), dot_y - 5, card_x + int(60 * scale), dot_y + 5], fill=(16, 185, 129, 255))

    draw.text((card_x + int(74 * scale), card_y + int(14 * scale)), "Studio Pipeline • 1080x1920 (9:16)", fill=(75, 85, 99, 255), font=font_card_title)

    # 4 Scenes inside Timeline Preview
    scene_data = [
        ("Scene 1  (0:00 - 0:08)", "Ancient temple at sunrise, misty morning...", (99, 102, 241), "Ken Burns Zoom"),
        ("Scene 2  (0:08 - 0:17)", "Master Kenji meditating in quiet focus...", (236, 72, 153), "Character Lock"),
        ("Scene 3  (0:17 - 0:26)", "Golden raven descends carrying parchment...", (255, 107, 0), "Burn Subtitles"),
        ("Scene 4  (0:26 - 0:34)", "Epic cinematic finale reveal in Full HD...", (16, 185, 129), "Audio Ducking"),
    ]
    sc_y = card_y + int(58 * scale)
    for title, desc, col, badge_lbl in scene_data:
        box_h = int(68 * scale)
        draw.rounded_rectangle(
            [card_x + int(14 * scale), sc_y, card_x + card_w - int(14 * scale), sc_y + box_h],
            radius=int(9 * scale),
            fill=(248, 250, 252, 255),
            outline=(226, 232, 240, 255),
            width=int(1.2 * scale)
        )
        draw.rounded_rectangle(
            [card_x + int(14 * scale), sc_y, card_x + int(20 * scale), sc_y + box_h],
            radius=int(3 * scale),
            fill=col
        )
        draw.text((card_x + int(30 * scale), sc_y + int(11 * scale)), title, fill=(17, 24, 39, 255), font=font_card_title)
        
        # Mini feature badge on the right
        badge_font = font_card_text
        bb = draw.textbbox((0, 0), badge_lbl, font=badge_font)
        bw = bb[2] - bb[0] + int(14 * scale)
        bx = card_x + card_w - int(24 * scale) - bw
        by = sc_y + int(10 * scale)
        draw.rounded_rectangle(
            [bx, by, bx + bw, by + int(20 * scale)],
            radius=int(4 * scale),
            fill=(255, 255, 255, 255),
            outline=(209, 213, 219, 255),
            width=1
        )
        draw.text((bx + int(7 * scale), by + int(2 * scale)), badge_lbl, fill=(75, 85, 99, 255), font=badge_font)

        draw.text((card_x + int(30 * scale), sc_y + int(36 * scale)), desc, fill=(107, 114, 128, 255), font=font_card_text)
        sc_y += box_h + int(10 * scale)

    # Status Bar at bottom of card
    status_y = card_y + card_h - int(54 * scale)
    draw.rounded_rectangle(
        [card_x + int(14 * scale), status_y, card_x + card_w - int(14 * scale), status_y + int(40 * scale)],
        radius=int(8 * scale),
        fill=(236, 253, 245, 255),
        outline=(167, 243, 208, 255),
        width=int(1.2 * scale)
    )
    
    # Draw custom vector check circle
    chk_cx = card_x + int(30 * scale)
    chk_cy = status_y + int(20 * scale)
    chk_r = int(7 * scale)
    draw.ellipse([chk_cx - chk_r, chk_cy - chk_r, chk_cx + chk_r, chk_cy + chk_r], fill=(16, 185, 129, 255))
    draw.line([(chk_cx - 4*scale, chk_cy), (chk_cx - 1*scale, chk_cy + 3*scale)], fill=(255, 255, 255, 255), width=int(1.5 * scale))
    draw.line([(chk_cx - 1*scale, chk_cy + 3*scale), (chk_cx + 4*scale, chk_cy - 3*scale)], fill=(255, 255, 255, 255), width=int(1.5 * scale))

    draw.text(
        (card_x + int(44 * scale), status_y + int(11 * scale)),
        "Audio Ducked & Synced • Ready for Full HD MP4 Render",
        fill=(5, 150, 105, 255),
        font=font_card_title
    )

    # 8. Bottom Brand Trust Bar
    foot_y = int(560 * scale)
    draw.line([(left_margin, foot_y - int(16 * scale)), (W * scale - left_margin, foot_y - int(16 * scale))], fill=(226, 232, 240, 255), width=int(1 * scale))
    draw.text((left_margin, foot_y), "scenoraedits.web.app", fill=(79, 70, 229, 255), font=font_footer)
    draw.text((left_margin + int(200 * scale), foot_y), "•  Bring Your Own Key (BYOK)  •  Zero Token Markup  •  100% Creator Ownership", fill=(107, 114, 128, 255), font=font_footer)

    final_img = img.resize((W, H), Image.Resampling.LANCZOS)
    final_img.save(output_path, format="PNG", optimize=True)
    print(f"Generated clean OG Image at {output_path} (1200x630)")


if __name__ == "__main__":
    public_dir = os.path.abspath("frontend/public")
    print(f"Generating branding assets into: {public_dir}")
    generate_favicons(public_dir)
    generate_og_image(os.path.join(public_dir, "og-image.png"))
    print("All branding assets generated successfully!")
