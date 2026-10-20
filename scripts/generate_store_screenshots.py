import os
from PIL import Image, ImageDraw, ImageFont

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def draw_top_bar(draw, width=1080):
    # Android Status Bar (time, wifi, battery)
    draw.rectangle([0, 0, width, 80], fill=(12, 14, 18, 255))
    try:
        font_status = ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 32)
    except:
        font_status = ImageFont.load_default()
    draw.text((60, 24), "09:41", fill=(203, 213, 225, 255), font=font_status)
    draw.text((width - 240, 24), "5G  ●  100%", fill=(203, 213, 225, 255), font=font_status)
    
    # SynqSquad App Header
    header_y = 80
    header_h = 140
    draw.rectangle([0, header_y, width, header_y + header_h], fill=(14, 17, 21, 255))
    draw.line([(0, header_y + header_h), (width, header_y + header_h)], fill=(255, 255, 255, 24), width=2)
    
    # App Logo S
    draw.rounded_rectangle([60, header_y + 30, 140, header_y + 110], radius=20, fill=(37, 99, 235, 255))
    try:
        font_logo = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 52)
        font_brand = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 46)
        font_btn = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 32)
    except:
        font_logo = ImageFont.load_default()
        font_brand = ImageFont.load_default()
        font_btn = ImageFont.load_default()
        
    draw.text((85, header_y + 42), "S", fill=(255, 255, 255, 255), font=font_logo)
    draw.text((160, header_y + 46), "SynqSquad", fill=(255, 255, 255, 255), font=font_brand)
    
    # Right buttons: "Post" + "Rajnish S."
    draw.rounded_rectangle([width - 380, header_y + 32, width - 230, header_y + 108], radius=16, fill=(26, 32, 41, 255), outline=(255, 255, 255, 30), width=2)
    draw.text((width - 345, header_y + 52), "+ Post", fill=(243, 244, 246, 255), font=font_btn)
    
    draw.ellipse([width - 180, header_y + 30, width - 100, header_y + 110], fill=(37, 99, 235, 255))
    draw.text((width - 158, header_y + 44), "R", fill=(255, 255, 255, 255), font=font_logo)

def draw_bottom_nav(draw, width=1080, height=1920):
    nav_h = 140
    nav_y = height - nav_h
    draw.rectangle([0, nav_y, width, height], fill=(14, 17, 21, 255))
    draw.line([(0, nav_y), (width, nav_y)], fill=(255, 255, 255, 24), width=2)
    
    # Home gesture indicator
    draw.rounded_rectangle([(width - 340) // 2, height - 30, (width + 340) // 2, height - 18], radius=6, fill=(255, 255, 255, 80))

def create_screenshot_1_feed(output_path):
    width, height = 1080, 1920
    img = Image.new("RGBA", (width, height), (12, 14, 18, 255))
    draw = ImageDraw.Draw(img)
    
    draw_top_bar(draw, width)
    draw_bottom_nav(draw, width, height)
    
    try:
        font_h1 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 52)
        font_sub = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 34)
        font_tag = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 26)
        font_body = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 32)
        font_meta = ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 26)
    except:
        font_h1 = font_sub = font_tag = font_body = font_meta = ImageFont.load_default()
        
    # Search & Filter bar
    sy = 250
    draw.rounded_rectangle([60, sy, width - 60, sy + 100], radius=24, fill=(20, 24, 31, 255), outline=(255, 255, 255, 30), width=2)
    draw.text((100, sy + 30), "🔍  Search by college, event (SIH, NeurIPS), or skill...", fill=(156, 163, 175, 255), font=font_body)
    
    # Chips
    cy = sy + 130
    chips = ["All (12)", "Hackathons", "Research", "Next.js", "Python", "ROS2"]
    cx = 60
    for i, chip in enumerate(chips):
        chip_w = len(chip) * 22 + 40
        if i == 0:
            draw.rounded_rectangle([cx, cy, cx + chip_w, cy + 70], radius=16, fill=(37, 99, 235, 255))
            draw.text((cx + 20, cy + 18), chip, fill=(255, 255, 255, 255), font=font_tag)
        else:
            draw.rounded_rectangle([cx, cy, cx + chip_w, cy + 70], radius=16, fill=(20, 24, 31, 255), outline=(255, 255, 255, 24), width=1)
            draw.text((cx + 20, cy + 18), chip, fill=(156, 163, 175, 255), font=font_tag)
        cx += chip_w + 16
        
    # Card 1: Smart India Hackathon Railway Edge AI
    card_y = cy + 110
    card_h = 440
    draw.rounded_rectangle([60, card_y, width - 60, card_y + card_h], radius=28, fill=(20, 24, 31, 255), outline=(255, 255, 255, 24), width=2)
    
    # Author avatar & name
    draw.ellipse([90, card_y + 35, 170, card_y + 115], fill=(37, 99, 235, 60), outline=(37, 99, 235, 200), width=2)
    draw.text((115, card_y + 48), "A", fill=(255, 255, 255, 255), font=font_h1)
    draw.text((195, card_y + 40), "Aarav Sharma", fill=(243, 244, 246, 255), font=font_h1)
    draw.text((195, card_y + 98), "IIT Delhi • Computer Vision Researcher", fill=(156, 163, 175, 255), font=font_meta)
    
    # Event Badge
    draw.rounded_rectangle([width - 340, card_y + 35, width - 90, card_y + 85], radius=12, fill=(37, 99, 235, 30), outline=(37, 99, 235, 100), width=1)
    draw.text((width - 325, card_y + 46), "SIH 2026 • 2 SLOTS", fill=(59, 130, 246, 255), font=font_tag)
    
    # Card Title
    draw.text((90, card_y + 160), "Edge Vision Model for Railway Track Fault Detection", fill=(255, 255, 255, 255), font=font_h1)
    draw.text((90, card_y + 230), "Trained YOLOv11 crack-detection baseline running on embedded Jetson devices.\nSeeking frontend engineer for mobile alert UI and backend for telemetry.", fill=(156, 163, 175, 255), font=font_body)
    
    # Skill badges
    sk_y = card_y + 340
    for sk, sk_x in [("Next.js", 90), ("React Native", 260), ("FastAPI", 490), ("Jetson Edge AI", 660)]:
        draw.rounded_rectangle([sk_x, sk_y, sk_x + len(sk)*18 + 30, sk_y + 60], radius=12, fill=(26, 32, 41, 255), outline=(255, 255, 255, 20), width=1)
        draw.text((sk_x + 15, sk_y + 14), sk, fill=(203, 213, 225, 255), font=font_meta)
        
    # Card 2: NeurIPS Medical MRI
    card2_y = card_y + card_h + 30
    draw.rounded_rectangle([60, card2_y, width - 60, card2_y + card_h], radius=28, fill=(20, 24, 31, 255), outline=(255, 255, 255, 24), width=2)
    
    draw.ellipse([90, card2_y + 35, 170, card2_y + 115], fill=(59, 130, 246, 60), outline=(59, 130, 246, 200), width=2)
    draw.text((115, card2_y + 48), "E", fill=(255, 255, 255, 255), font=font_h1)
    draw.text((195, card2_y + 40), "Dr. Elena Rostova", fill=(243, 244, 246, 255), font=font_h1)
    draw.text((195, card2_y + 98), "Oxford University • Postdoc in Bio-Imaging", fill=(156, 163, 175, 255), font=font_meta)
    
    draw.rounded_rectangle([width - 340, card2_y + 35, width - 90, card2_y + 85], radius=12, fill=(16, 185, 129, 30), outline=(16, 185, 129, 100), width=1)
    draw.text((width - 325, card2_y + 46), "NEURIPS • 1 SLOT", fill=(16, 185, 129, 255), font=font_tag)
    
    draw.text((90, card2_y + 160), "Multimodal 3D Brain MRI Segmentation Co-Author", fill=(255, 255, 255, 255), font=font_h1)
    draw.text((90, card2_y + 230), "GPU cluster compute (4x H100s) and clean BraTS datasets ready.\nLooking for collaborator for volumetric segmentation and LaTeX drafting.", fill=(156, 163, 175, 255), font=font_body)
    
    sk_y2 = card2_y + 340
    for sk, sk_x in [("PyTorch", 90), ("MONAI", 260), ("3D U-Net", 420), ("LaTeX", 600)]:
        draw.rounded_rectangle([sk_x, sk_y2, sk_x + len(sk)*18 + 30, sk_y2 + 60], radius=12, fill=(26, 32, 41, 255), outline=(255, 255, 255, 20), width=1)
        draw.text((sk_x + 15, sk_y2 + 14), sk, fill=(203, 213, 225, 255), font=font_meta)
        
    img.save(output_path)
    print(f"✓ Screenshot 1 saved: {output_path}")

def create_screenshot_2_drawer(output_path):
    width, height = 1080, 1920
    img = Image.new("RGBA", (width, height), (12, 14, 18, 255))
    draw = ImageDraw.Draw(img)
    
    draw_top_bar(draw, width)
    # Dimmed background overlay
    draw.rectangle([0, 220, width, height], fill=(0, 0, 0, 180))
    
    # Bottom Sheet Drawer
    drawer_y = 480
    draw.rounded_rectangle([0, drawer_y, width, height], radius=44, fill=(20, 24, 31, 255), outline=(255, 255, 255, 30), width=2)
    
    # Handle bar
    draw.rounded_rectangle([(width - 120)//2, drawer_y + 24, (width + 120)//2, drawer_y + 34], radius=5, fill=(100, 116, 139, 255))
    
    try:
        font_h1 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 50)
        font_h2 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 38)
        font_body = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 32)
        font_meta = ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 28)
        font_btn = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 36)
    except:
        font_h1 = font_h2 = font_body = font_meta = font_btn = ImageFont.load_default()
        
    # Status
    draw.text((70, drawer_y + 70), "HACKATHON TEAM  •  SMART INDIA HACKATHON 2026", fill=(59, 130, 246, 255), font=font_meta)
    draw.text((70, drawer_y + 130), "Edge Vision Model for Railway Track Fault Detection", fill=(255, 255, 255, 255), font=font_h1)
    
    # Slots box
    s_y = drawer_y + 240
    draw.rounded_rectangle([70, s_y, width - 70, s_y + 110], radius=20, fill=(26, 32, 41, 255), outline=(255, 255, 255, 24), width=1)
    draw.text((110, s_y + 36), "Open Collaborator Slots", fill=(156, 163, 175, 255), font=font_body)
    draw.text((width - 300, s_y + 36), "2 of 6 Remaining", fill=(16, 185, 129, 255), font=font_meta)
    
    # Description
    d_y = s_y + 150
    draw.text((70, d_y), "PROJECT DESCRIPTION", fill=(100, 116, 139, 255), font=font_meta)
    draw.text((70, d_y + 50), "We have trained a YOLOv11 crack-detection baseline running on embedded\nJetson devices. We need one frontend developer to build the mobile emergency\nalert interface and one backend engineer for real-time telemetry streaming.", fill=(203, 213, 225, 255), font=font_body)
    
    # Creator card
    c_y = d_y + 210
    draw.rounded_rectangle([70, c_y, width - 70, c_y + 180], radius=20, fill=(26, 32, 41, 255), outline=(255, 255, 255, 24), width=1)
    draw.ellipse([100, c_y + 35, 180, c_y + 115], fill=(37, 99, 235, 255))
    draw.text((125, c_y + 46), "A", fill=(255, 255, 255, 255), font=font_h1)
    draw.text((210, c_y + 40), "Aarav Sharma", fill=(255, 255, 255, 255), font=font_h2)
    draw.text((210, c_y + 95), "aa••••l@gmail.com  (Revealed on Connect)", fill=(100, 116, 139, 255), font=font_meta)
    
    # Safety: Report & Block links
    safe_y = c_y + 220
    draw.text((70, safe_y), "🚩 Report Requisition", fill=(156, 163, 175, 255), font=font_meta)
    draw.text((width - 320, safe_y), "🚫 Block Creator", fill=(156, 163, 175, 255), font=font_meta)
    
    # Primary "Connect on Gmail" button
    btn_y = height - 260
    draw.rounded_rectangle([70, btn_y, width - 70, btn_y + 130], radius=28, fill=(37, 99, 235, 255))
    draw.text((width // 2 - 220, btn_y + 42), "✉️  Connect on Gmail", fill=(255, 255, 255, 255), font=font_btn)
    draw.text((width // 2 - 270, btn_y + 145), "Opens prefilled message directly in your verified Gmail", fill=(100, 116, 139, 255), font=font_meta)
    
    draw_bottom_nav(draw, width, height)
    img.save(output_path)
    print(f"✓ Screenshot 2 saved: {output_path}")

def create_screenshot_3_post(output_path):
    width, height = 1080, 1920
    img = Image.new("RGBA", (width, height), (12, 14, 18, 255))
    draw = ImageDraw.Draw(img)
    
    draw_top_bar(draw, width)
    
    try:
        font_h1 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 52)
        font_h2 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 40)
        font_body = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 34)
        font_meta = ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 26)
        font_btn = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 36)
    except:
        font_h1 = font_h2 = font_body = font_meta = font_btn = ImageFont.load_default()
        
    py = 260
    draw.text((70, py), "Post a Collaborator Requisition", fill=(255, 255, 255, 255), font=font_h1)
    draw.text((70, py + 70), "6 simple fields. Verified Gmail contact only. Auto-expires in 30 days.", fill=(156, 163, 175, 255), font=font_body)
    
    # Form Container
    f_y = py + 140
    draw.rounded_rectangle([70, f_y, width - 70, height - 200], radius=28, fill=(20, 24, 31, 255), outline=(255, 255, 255, 24), width=2)
    
    # Field 1: Requisition Type
    draw.text((110, f_y + 40), "1. COLLABORATION TYPE", fill=(100, 116, 139, 255), font=font_meta)
    draw.rounded_rectangle([110, f_y + 80, 500, f_y + 170], radius=16, fill=(37, 99, 235, 255))
    draw.text((180, f_y + 110), "Hackathon Team", fill=(255, 255, 255, 255), font=font_h2)
    
    draw.rounded_rectangle([530, f_y + 80, width - 110, f_y + 170], radius=16, fill=(26, 32, 41, 255), outline=(255, 255, 255, 24), width=1)
    draw.text((580, f_y + 110), "Research Co-Author", fill=(156, 163, 175, 255), font=font_h2)
    
    # Field 2: Title
    draw.text((110, f_y + 210), "2. PROJECT TITLE", fill=(100, 116, 139, 255), font=font_meta)
    draw.rounded_rectangle([110, f_y + 250, width - 110, f_y + 350], radius=16, fill=(26, 32, 41, 255), outline=(37, 99, 235, 120), width=2)
    draw.text((140, f_y + 285), "Autonomous Micro-Grid Power Trading Swarm", fill=(255, 255, 255, 255), font=font_body)
    
    # Field 3: Event & Deadline
    draw.text((110, f_y + 390), "3. EVENT & SUBMISSION DEADLINE", fill=(100, 116, 139, 255), font=font_meta)
    draw.rounded_rectangle([110, f_y + 430, width - 110, f_y + 530], radius=16, fill=(26, 32, 41, 255), outline=(255, 255, 255, 24), width=1)
    draw.text((140, f_y + 465), "Smart India Hackathon 2026 • Nov 30, 2026", fill=(255, 255, 255, 255), font=font_body)
    
    # Field 4: Skills Wanted
    draw.text((110, f_y + 570), "4. SKILLS NEEDED (TAGS)", fill=(100, 116, 139, 255), font=font_meta)
    draw.rounded_rectangle([110, f_y + 610, width - 110, f_y + 710], radius=16, fill=(26, 32, 41, 255), outline=(255, 255, 255, 24), width=1)
    draw.text((140, f_y + 645), "Python  •  FastAPI  •  Solidity  •  Smart Meters", fill=(59, 130, 246, 255), font=font_meta)
    
    # Field 5: Description
    draw.text((110, f_y + 750), "5. BRIEF DESCRIPTION & SCOPE", fill=(100, 116, 139, 255), font=font_meta)
    draw.rounded_rectangle([110, f_y + 790, width - 110, f_y + 960], radius=16, fill=(26, 32, 41, 255), outline=(255, 255, 255, 24), width=1)
    draw.text((140, f_y + 825), "Building peer-to-peer solar power settlement.\nNeed one smart contract developer and one backend engineer.", fill=(203, 213, 225, 255), font=font_body)
    
    # Submit Button
    s_btn_y = f_y + 1000
    draw.rounded_rectangle([110, s_btn_y, width - 110, s_btn_y + 120], radius=24, fill=(37, 99, 235, 255))
    draw.text((width // 2 - 180, s_btn_y + 36), "Publish Requisition", fill=(255, 255, 255, 255), font=font_btn)
    
    draw_bottom_nav(draw, width, height)
    img.save(output_path)
    print(f"✓ Screenshot 3 saved: {output_path}")

def create_screenshot_4_profile(output_path):
    width, height = 1080, 1920
    img = Image.new("RGBA", (width, height), (12, 14, 18, 255))
    draw = ImageDraw.Draw(img)
    
    draw_top_bar(draw, width)
    
    try:
        font_h1 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 52)
        font_h2 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 40)
        font_body = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 34)
        font_meta = ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 28)
        font_btn = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 34)
    except:
        font_h1 = font_h2 = font_body = font_meta = font_btn = ImageFont.load_default()
        
    py = 260
    # Profile Card
    draw.rounded_rectangle([70, py, width - 70, py + 340], radius=28, fill=(20, 24, 31, 255), outline=(255, 255, 255, 24), width=2)
    
    draw.ellipse([110, py + 50, 230, py + 170], fill=(37, 99, 235, 255))
    draw.text((145, py + 65), "R", fill=(255, 255, 255, 255), font=font_h1)
    
    draw.text((270, py + 50), "Rajnish Singh", fill=(255, 255, 255, 255), font=font_h1)
    draw.text((270, py + 115), "rajnishsingh.dev@gmail.com", fill=(59, 130, 246, 255), font=font_meta)
    
    draw.rounded_rectangle([270, py + 170, 520, py + 225], radius=10, fill=(16, 185, 129, 20), outline=(16, 185, 129, 80), width=1)
    draw.text((290, py + 182), "✓ Google Verified Account", fill=(16, 185, 129, 255), font=font_meta)
    
    draw.text((110, py + 260), "Full-Stack & ML Engineer • Gautam Buddha University", fill=(156, 163, 175, 255), font=font_body)
    
    # Outreach History Card (10/day Limit Tracker)
    o_y = py + 380
    draw.rounded_rectangle([70, o_y, width - 70, o_y + 220], radius=24, fill=(20, 24, 31, 255), outline=(255, 255, 255, 24), width=1)
    draw.text((110, o_y + 35), "DAILY OUTREACH QUOTA", fill=(100, 116, 139, 255), font=font_meta)
    draw.text((110, o_y + 80), "8 of 10 Connect Actions Remaining Today", fill=(255, 255, 255, 255), font=font_h2)
    draw.text((110, o_y + 140), "Protects creators from automated bulk scraping. Resets rolling 24h.", fill=(156, 163, 175, 255), font=font_meta)
    
    # Privacy & Legal Controls (DPDP 2023 & GDPR)
    l_y = o_y + 260
    draw.rounded_rectangle([70, l_y, width - 70, l_y + 440], radius=24, fill=(20, 24, 31, 255), outline=(255, 255, 255, 24), width=1)
    draw.text((110, l_y + 40), "DATA PRIVACY & COMPLIANCE (DPDP ACT 2023 / GDPR)", fill=(100, 116, 139, 255), font=font_meta)
    
    # Export button
    draw.rounded_rectangle([110, l_y + 90, width - 110, l_y + 200], radius=16, fill=(26, 32, 41, 255), outline=(255, 255, 255, 24), width=1)
    draw.text((150, l_y + 125), "📥  Download Machine-Readable JSON Export", fill=(243, 244, 246, 255), font=font_h2)
    draw.text((150, l_y + 165), "Complete copy of profile, requisitions, and contact audit records", fill=(156, 163, 175, 255), font=font_meta)
    
    # Delete Account button
    draw.rounded_rectangle([110, l_y + 230, width - 110, l_y + 340], radius=16, fill=(225, 29, 72, 20), outline=(225, 29, 72, 100), width=1)
    draw.text((150, l_y + 265), "🗑️  Permanently Erase Account & All Data", fill=(244, 63, 94, 255), font=font_h2)
    draw.text((150, l_y + 305), "1-click permanent deletion of profile, listings, and outreach logs", fill=(244, 63, 94, 180), font=font_meta)
    
    # Sign out button
    so_y = l_y + 480
    draw.rounded_rectangle([70, so_y, width - 70, so_y + 110], radius=20, fill=(26, 32, 41, 255), outline=(255, 255, 255, 24), width=1)
    draw.text((width // 2 - 80, so_y + 36), "Sign Out", fill=(156, 163, 175, 255), font=font_btn)
    
    draw_bottom_nav(draw, width, height)
    img.save(output_path)
    print(f"✓ Screenshot 4 saved: {output_path}")

def main():
    store_dir = "store"
    ensure_dir(store_dir)
    
    create_screenshot_1_feed(os.path.join(store_dir, "screenshot-1-feed.png"))
    create_screenshot_2_drawer(os.path.join(store_dir, "screenshot-2-drawer.png"))
    create_screenshot_3_post(os.path.join(store_dir, "screenshot-3-post.png"))
    create_screenshot_4_profile(os.path.join(store_dir, "screenshot-4-profile.png"))
    print("✓ All 4 phone screenshots (1080x1920) generated successfully.")

if __name__ == "__main__":
    main()
