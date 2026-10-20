import os
from PIL import Image, ImageDraw
import math

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def draw_emblem(draw, center_x, center_y, size, fg_color=(255, 255, 255, 255)):
    r = size * 0.22
    stroke = int(size * 0.12)
    offset_y = size * 0.14
    
    top_bbox = [center_x - r, center_y - offset_y - r, center_x + r, center_y - offset_y + r]
    draw.arc(top_bbox, start=135, end=360, fill=fg_color, width=stroke)
    
    bot_bbox = [center_x - r, center_y + offset_y - r, center_x + r, center_y + offset_y + r]
    draw.arc(bot_bbox, start=315, end=180, fill=fg_color, width=stroke)
    
    draw.line([
        (center_x + r * 0.4, center_y - offset_y * 0.4),
        (center_x - r * 0.4, center_y + offset_y * 0.4)
    ], fill=fg_color, width=stroke)
    
    cap_r = stroke // 2
    x_tl = center_x - r * math.cos(math.radians(45))
    y_tl = (center_y - offset_y) + r * math.sin(math.radians(45))
    draw.ellipse([x_tl - cap_r, y_tl - cap_r, x_tl + cap_r, y_tl + cap_r], fill=fg_color)
    
    x_br = center_x + r * math.cos(math.radians(45))
    y_br = (center_y + offset_y) - r * math.sin(math.radians(45))
    draw.ellipse([x_br - cap_r, y_br - cap_r, x_br + cap_r, y_br + cap_r], fill=fg_color)

def generate_android_icon(size, is_round=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    if is_round:
        draw.ellipse([0, 0, size - 1, size - 1], fill=(37, 99, 235, 255))
        draw_emblem(draw, size // 2, size // 2, size * 0.70, fg_color=(255, 255, 255, 255))
    else:
        corner_r = int(size * 0.22)
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=corner_r, fill=(37, 99, 235, 255))
        draw_emblem(draw, size // 2, size // 2, size * 0.72, fg_color=(255, 255, 255, 255))
        
    return img

def generate_foreground(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Adaptive foreground inside 66% viewport
    draw_emblem(draw, size // 2, size // 2, size * 0.50, fg_color=(255, 255, 255, 255))
    return img

def main():
    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    
    base_res = "android/app/src/main/res"
    
    for folder, size in densities.items():
        dir_path = os.path.join(base_res, folder)
        ensure_dir(dir_path)
        
        # ic_launcher.png
        icon = generate_android_icon(size, is_round=False)
        icon.save(os.path.join(dir_path, "ic_launcher.png"))
        
        # ic_launcher_round.png
        icon_round = generate_android_icon(size, is_round=True)
        icon_round.save(os.path.join(dir_path, "ic_launcher_round.png"))
        
        # ic_launcher_foreground.png (for adaptive icons, standard size is 108dp * density)
        fg_size = int(size * 108 / 48)
        fg = generate_foreground(fg_size)
        fg.save(os.path.join(dir_path, "ic_launcher_foreground.png"))
        
    print("✓ Android mipmap launcher icons generated for all density tiers.")

if __name__ == "__main__":
    main()
