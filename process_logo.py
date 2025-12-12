#!/usr/bin/env python3
"""
Process logo to remove background and create transparent PNG
"""
from PIL import Image
import sys

def remove_background(input_path, output_path, threshold=240):
    """
    Remove white/light background from image and make it transparent

    Args:
        input_path: Path to input image
        output_path: Path to save output image
        threshold: RGB value threshold for considering a pixel as background (default 240)
    """
    # Open the image
    img = Image.open(input_path)

    # Convert to RGBA if not already
    img = img.convert("RGBA")

    # Get pixel data
    data = img.getdata()

    # Create new data with transparency
    new_data = []
    for item in data:
        # If pixel is light (near white/gray), make it transparent
        # Keep all channels for comparison
        r, g, b, a = item

        # If all RGB values are above threshold, make transparent
        if r >= threshold and g >= threshold and b >= threshold:
            new_data.append((r, g, b, 0))  # Fully transparent
        else:
            new_data.append(item)  # Keep original

    # Update image data
    img.putdata(new_data)

    # Save as PNG with transparency
    img.save(output_path, "PNG")
    print(f"✓ Saved transparent logo to: {output_path}")
    print(f"  Image size: {img.size}")
    print(f"  Mode: {img.mode}")

if __name__ == "__main__":
    input_logo = "/Users/dev/Documents/OPD-Health/white-logo.png"

    # Output paths for all three portals
    output_paths = [
        "/Users/dev/Documents/OPD-Health/opdwallet_aws/web-admin/public/logos/habit-logo-white.png",
        "/Users/dev/Documents/OPD-Health/opdwallet_aws/web-member/public/logos/habit-logo-white.png",
        "/Users/dev/Documents/OPD-Health/opdwallet_aws/web-doctor/public/logos/habit-logo-white.png",
    ]

    print("Processing logo...")
    print(f"Input: {input_logo}")
    print()

    for output_path in output_paths:
        try:
            remove_background(input_logo, output_path, threshold=240)
        except Exception as e:
            print(f"✗ Error processing {output_path}: {e}")
            sys.exit(1)

    print()
    print("✓ Logo processing complete! All three portals updated.")
