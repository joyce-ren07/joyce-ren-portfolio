#!/usr/bin/env python3
"""Prepare a black-screen phone mockup PNG for video layering."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def prepare_frame(source: Path, destination: Path, threshold: int = 48) -> dict[str, float]:
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    width, height = image.size

    # Only process frames with an opaque screen. Export-ready device PNGs usually
    # already include a transparent screen window.
    center = pixels[width // 2, height // 2]
    if center[3] < 32:
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, optimize=True)
    else:
        for y in range(height):
            for x in range(width):
                red, green, blue, alpha = pixels[x, y]
                if alpha == 0:
                    continue
                if max(red, green, blue) <= threshold:
                    pixels[x, y] = (0, 0, 0, 0)

        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, optimize=True)

    return measure_screen_insets(image)


def measure_screen_insets(image: Image.Image) -> dict[str, float]:
    pixels = image.load()
    width, height = image.size
    center_x = width // 2
    center_y = height // 2

    left = right = center_x
    top = bottom = center_y

    for x in range(center_x, -1, -1):
        if pixels[x, center_y][3] > 128:
            left = x + 1
            break

    for x in range(center_x, width):
        if pixels[x, center_y][3] > 128:
            right = x - 1
            break

    for y in range(center_y, -1, -1):
        if pixels[center_x, y][3] > 128:
            top = y + 1
            break

    for y in range(center_y, height):
        if pixels[center_x, y][3] > 128:
            bottom = y - 1
            break

    return {
        "top": top / height * 100,
        "left": left / width * 100,
        "right": (width - right - 1) / width * 100,
        "bottom": (height - bottom - 1) / height * 100,
        "width": (right - left) / width * 100,
        "height": (bottom - top) / height * 100,
        "radius": (right - left) / width * 100 * 0.105,
    }


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "uploads" / "phone-frame.png"
    destination = root / "assets" / "images" / "home-start" / "phone-frame.png"

    if not source.exists():
        print(f"Missing source image: {source}", file=sys.stderr)
        return 1

    insets = prepare_frame(source, destination)
    print(f"Wrote {destination}")
    print("CSS insets:")
    print(f"  --device-screen-top: {insets['top']:.2f}%;")
    print(f"  --device-screen-right: {insets['right']:.2f}%;")
    print(f"  --device-screen-bottom: {insets['bottom']:.2f}%;")
    print(f"  --device-screen-left: {insets['left']:.2f}%;")
    print(f"  --device-screen-radius: {insets['radius']:.2f}%;")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
