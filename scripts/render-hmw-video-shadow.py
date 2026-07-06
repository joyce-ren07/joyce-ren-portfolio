#!/usr/bin/env python3
"""Re-encode the HMW animation with subtle drop shadows on UI elements."""

from __future__ import annotations

import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

BG_COLOR = np.array([237, 240, 247], dtype=np.float32)
BG_THRESHOLD = 18.0
SHADOW_BLUR = 10
SHADOW_OFFSET_Y = 4
SHADOW_OPACITY = 0.18


def process_frame_bgr(frame_bgr: np.ndarray) -> np.ndarray:
    rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    arr = rgb.astype(np.float32)
    h, w = arr.shape[:2]

    dist = np.sqrt(((arr - BG_COLOR) ** 2).sum(axis=2))
    mask = (dist > BG_THRESHOLD).astype(np.uint8) * 255

    mask_img = Image.fromarray(mask, mode="L")
    blurred = np.array(mask_img.filter(ImageFilter.GaussianBlur(radius=SHADOW_BLUR)))

    shadow = np.zeros_like(blurred, dtype=np.float32)
    if SHADOW_OFFSET_Y < h:
        shadow[SHADOW_OFFSET_Y:, :] = blurred[:-SHADOW_OFFSET_Y, :]
    shadow = (shadow * SHADOW_OPACITY).astype(np.uint8)

    alpha = mask.astype(np.float32) / 255.0
    shadow_alpha = shadow.astype(np.float32) / 255.0

    out = np.full((h, w, 3), 255, dtype=np.float32)
    shadow_rgb = np.zeros((h, w, 3), dtype=np.float32)

    for c in range(3):
        out[:, :, c] = (
            out[:, :, c] * (1 - shadow_alpha)
            + shadow_rgb[:, :, c] * shadow_alpha
        )
        out[:, :, c] = out[:, :, c] * (1 - alpha) + arr[:, :, c] * alpha

    return cv2.cvtColor(out.astype(np.uint8), cv2.COLOR_RGB2BGR)


def render_video(source: Path, destination: Path) -> None:
    capture = cv2.VideoCapture(str(source))
    if not capture.isOpened():
        raise RuntimeError(f"Unable to open video: {source}")

    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = capture.get(cv2.CAP_PROP_FPS)
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))

    destination.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(
        str(destination),
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (width, height),
    )

    index = 0
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        writer.write(process_frame_bgr(frame))
        index += 1
        if index % 60 == 0:
            print(f"Processed {index}/{frame_count} frames", flush=True)

    capture.release()
    writer.release()
    print(f"Wrote {destination}")


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    source = root / "assets" / "videos" / "current" / "gcal-how-might-we-source.mp4"
    destination = root / "assets" / "videos" / "current" / "gcal-how-might-we.mp4"

    if len(sys.argv) >= 2:
        source = Path(sys.argv[1])
    if len(sys.argv) >= 3:
        destination = Path(sys.argv[2])

    if not source.exists():
        print(
            "Source video not found. Extract the pre-shadow version from git:\n"
            "  git show HEAD~1:assets/videos/current/gcal-how-might-we.mp4 "
            "> assets/videos/current/gcal-how-might-we-source.mp4",
            file=sys.stderr,
        )
        return 1

    render_video(source, destination)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
