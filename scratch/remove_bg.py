from PIL import Image
import os
import glob

input_path = r"C:\Users\Arshit Anand\.gemini\antigravity\brain\878224eb-0d13-49f4-b68c-c038592bdbf3\.user_uploaded\media__1785516237194.png"
img = Image.open(input_path).convert("RGBA")

# Remove white background pixels (floodfill from corners or color threshold)
width, height = img.size
pixels = img.load()

# Threshold for white background
for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        # Outer border / white background test
        if r > 230 and g > 230 and b > 230:
            pixels[x, y] = (0, 0, 0, 0)

# Save to public assets
output_files = [
    r"c:\Users\Arshit Anand\OneDrive\Desktop\Kynisto\public\logo.png",
    r"c:\Users\Arshit Anand\OneDrive\Desktop\Kynisto\public\brand-logo.png",
    r"c:\Users\Arshit Anand\OneDrive\Desktop\Kynisto\public\icon.png",
    r"c:\Users\Arshit Anand\OneDrive\Desktop\Kynisto\public\favicon.ico",
    r"c:\Users\Arshit Anand\OneDrive\Desktop\Kynisto\public\apple-touch-icon.png",
    r"c:\Users\Arshit Anand\OneDrive\Desktop\Kynisto\app\icon.png"
]

for out_path in output_files:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    img.save(out_path)
    print(f"Saved: {out_path}")

# Update Android launcher mipmaps
res_dir = r"c:\Users\Arshit Anand\OneDrive\Desktop\Kynisto\android\app\src\main\res"
if os.path.exists(res_dir):
    for launcher_png in glob.glob(os.path.join(res_dir, "**", "ic_launcher*.png"), recursive=True):
        img.save(launcher_png)
        print(f"Updated Android Launcher Icon: {launcher_png}")

print("Background removal and logo asset generation complete!")
