import sys
from PIL import Image

def clean_image(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        
        new_data = []
        for item in datas:
            # Change all white (also shades of whites/greys commonly used in checkerboards)
            # A checkerboard is often white (255,255,255) and grey (204,204,204) or similar.
            # We can check if r, g, b are equal (greyscale) and above a certain threshold.
            # But the graduation cap is also white/grey!
            # Let's try to just do a simple floodfill from the edges.
            pass
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    clean_image("public/logo.png", "public/logo_transparent.png")
