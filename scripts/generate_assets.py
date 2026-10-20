import os
import math
from PIL import Image, ImageDraw, ImageFont

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def draw_emblem(draw, center_x, center_y, size, fg_color=(255, 255, 255, 255)):
    """
    Draws a clean, geometric, interlocking modern 'S' monogram
    representing two collaborators synchronizing (SynqSquad).
    Composed of two balanced interlocking arcs / loops.
    """
    r = size * 0.22
    stroke = int(size * 0.12)
    offset_y = size * 0.14
    
    # Top loop (opens to the left)
    top_bbox = [
        center_x - r,
        center_y - offset_y - r,
        center_x + r,
        center_y - offset_y + r
    ]
    draw.arc(top_bbox, start=135, end=360, fill=fg_color, width=stroke)
    
    # Bottom loop (opens to the right)
    bot_bbox = [
        center_x - r,
        center_y + offset_y - r,
        center_x + r,
        center_y + offset_y + r
    ]
    draw.arc(bot_bbox, start=315, end=180, fill=fg_color, width=stroke)
    
    # Diagonal connecting bar
    bar_width = stroke
    draw.line([
        (center_x + r * 0.4, center_y - offset_y * 0.4),
        (center_x - r * 0.4, center_y + offset_y * 0.4)
    ], fill=fg_color, width=bar_width)
    
    # Precision node caps at endpoints
    cap_r = stroke // 2
    # Top-left endpoint
    x_tl = center_x - r * math.cos(math.radians(45))
    y_tl = (center_y - offset_y) + r * math.sin(math.radians(45))
    draw.ellipse([x_tl - cap_r, y_tl - cap_r, x_tl + cap_r, y_tl + cap_r], fill=fg_color)
    
    # Bottom-right endpoint
    x_br = center_x + r * math.cos(math.radians(45))
    y_br = (center_y + offset_y) - r * math.sin(math.radians(45))
    draw.ellipse([x_br - cap_r, y_br - cap_r, x_br + cap_r, y_br + cap_r], fill=fg_color)

def generate_app_icon(size, bg_color=(12, 14, 18, 255), emblem_color=(255, 255, 255, 255), is_maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    if is_maskable:
        # Full bleed background for adaptive/maskable icons
        draw.rectangle([0, 0, size, size], fill=bg_color)
        # Emblem sized strictly inside 80% safe zone circle (diameter = 0.75 * size)
        emblem_size = size * 0.65
        draw_emblem(draw, size // 2, size // 2, emblem_size, fg_color=emblem_color)
    else:
        # Rounded squircle for standard icons
        corner_r = int(size * 0.22)
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=corner_r, fill=bg_color)
        # 1px crisp subtle border
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=corner_r, outline=(37, 99, 235, 120), width=max(1, int(size * 0.015)))
        emblem_size = size * 0.75
        draw_emblem(draw, size // 2, size // 2, emblem_size, fg_color=emblem_color)
        
    return img

def generate_monochrome_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_emblem(draw, size // 2, size // 2, size * 0.75, fg_color=(255, 255, 255, 255))
    return img

def generate_feature_graphic(width=1024, height=500):
    img = Image.new("RGBA", (width, height), (12, 14, 18, 255))
    draw = ImageDraw.Draw(img)
    
    # Subtle background accent radial gradient / grid lines
    for x in range(0, width, 40):
        draw.line([(x, 0), (x, height)], fill=(255, 255, 255, 8), width=1)
    for y in range(0, height, 40):
        draw.line([(0, y), (width, y)], fill=(255, 255, 255, 8), width=1)
        
    # Blue badge container for emblem on the left
    emblem_box_size = 180
    box_x = 100
    box_y = (height - emblem_box_size) // 2
    corner_r = 36
    draw.rounded_rectangle(
        [box_x, box_y, box_x + emblem_box_size, box_y + emblem_box_size],
        radius=corner_r,
        fill=(37, 99, 235, 255)
    )
    draw_emblem(
        draw,
        box_x + emblem_box_size // 2,
        box_y + emblem_box_size // 2,
        emblem_box_size * 0.75,
        fg_color=(255, 255, 255, 255)
    )
    
    # Textual elements on the right
    text_x = box_x + emblem_box_size + 60
    
    # Try loading a standard system TTF or draw structured text shapes
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", 64)
        font_sub = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", 26)
        font_tag = ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 18)
    except Exception:
        try:
            font_title = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 60)
            font_sub = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 24)
            font_tag = ImageFont.truetype("/System/Library/Fonts/Supplemental/Courier New Bold.ttf", 18)
        except Exception:
            font_title = ImageFont.load_default()
            font_sub = ImageFont.load_default()
            font_tag = ImageFont.load_default()
            
    # Category tag
    tag_y = box_y + 10
    draw.rounded_rectangle([text_x, tag_y, text_x + 220, tag_y + 32], radius=6, fill=(37, 99, 235, 30), outline=(37, 99, 235, 100), width=1)
    draw.text((text_x + 12, tag_y + 7), "HACKATHONS & PAPERS", fill=(59, 130, 246, 255), font=font_tag)
    
    # Brand title
    title_y = tag_y + 44
    draw.text((text_x, title_y), "SynqSquad", fill=(255, 255, 255, 255), font=font_title)
    
    # Tagline
    sub_y = title_y + 74
    draw.text((text_x, sub_y), "The One-Click Teammate Matchmaker on Gmail", fill=(203, 213, 225, 255), font=font_sub)
    draw.text((text_x, sub_y + 36), "Verified Google accounts. Zero spam. Direct peer collaboration.", fill=(148, 163, 184, 255), font=font_sub)
    
    return img

def main():
    public_icons = "public/icons"
    store_dir = "store"
    ensure_dir(public_icons)
    ensure_dir(store_dir)
    
    print("Generating PWA Icons...")
    # Standard 192x192
    icon_192 = generate_app_icon(192, bg_color=(37, 99, 235, 255), emblem_color=(255, 255, 255, 255))
    icon_192.save(os.path.join(public_icons, "icon-192.png"))
    
    # Standard 512x512
    icon_512 = generate_app_icon(512, bg_color=(37, 99, 235, 255), emblem_color=(255, 255, 255, 255))
    icon_512.save(os.path.join(public_icons, "icon-512.png"))
    icon_512.save(os.path.join(store_dir, "icon-512.png"))
    
    # Maskable 512x512 (Safe-zone padding)
    icon_maskable = generate_app_icon(512, bg_color=(37, 99, 235, 255), emblem_color=(255, 255, 255, 255), is_maskable=True)
    icon_maskable.save(os.path.join(public_icons, "icon-maskable-512.png"))
    
    # Monochrome 512x512
    icon_mono = generate_monochrome_icon(512)
    icon_mono.save(os.path.join(public_icons, "icon-monochrome.png"))
    
    # Favicon (48x48)
    favicon = generate_app_icon(48, bg_color=(37, 99, 235, 255), emblem_color=(255, 255, 255, 255))
    favicon.save("public/favicon.ico")
    
    print("Generating Google Play Store Feature Graphic (1024x500)...")
    feature_graphic = generate_feature_graphic(1024, 500)
    feature_graphic.save(os.path.join(store_dir, "feature-graphic.png"))
    
    print("✓ All icon and store banner assets generated successfully.")

if __name__ == "__main__":
    main()
