#!/usr/bin/env python3
"""Crop, speed up, and round corners on the CueTurn wizard UI screen recording."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

CROP_X = 40
CROP_Y = 34
CROP_W = 2856
CROP_H = 1350
SPEED = 1.7
CORNER_RADIUS = 32
BG_COLOR = (237, 237, 237)
ENCODE_CRF = 18
ENCODE_PRESET = "slow"


def rounded_mask(width: int, height: int, radius: int) -> np.ndarray:
    mask_img = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask_img)
    draw.rounded_rectangle([0, 0, width - 1, height - 1], radius=radius, fill=255)
    return np.array(mask_img, dtype=np.float32) / 255.0


def process_frame(frame_bgr: np.ndarray, mask: np.ndarray) -> np.ndarray:
    cropped = frame_bgr[CROP_Y : CROP_Y + CROP_H, CROP_X : CROP_X + CROP_W]
    rgb = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB).astype(np.float32)

    bg = np.full_like(rgb, BG_COLOR, dtype=np.float32)
    alpha = mask[..., None]
    out = bg * (1.0 - alpha) + rgb * alpha
    return cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)


def render_video(source: Path, destination: Path) -> None:
    capture = cv2.VideoCapture(str(source))
    if not capture.isOpened():
        raise RuntimeError(f"Unable to open video: {source}")

    fps = capture.get(cv2.CAP_PROP_FPS)
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    output_fps = fps * SPEED
    mask = rounded_mask(CROP_W, CROP_H, CORNER_RADIUS)

    destination.parent.mkdir(parents=True, exist_ok=True)
    temp_path = destination.with_suffix(".tmp.mp4")

    command = [
        "ffmpeg",
        "-y",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "bgr24",
        "-s",
        f"{CROP_W}x{CROP_H}",
        "-r",
        str(output_fps),
        "-i",
        "pipe:0",
        "-an",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-crf",
        str(ENCODE_CRF),
        "-preset",
        ENCODE_PRESET,
        "-movflags",
        "+faststart",
        str(temp_path),
    ]
    encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert encoder.stdin is not None

    index = 0
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        encoder.stdin.write(process_frame(frame, mask).tobytes())
        index += 1
        if index % 120 == 0:
            print(f"Processed {index}/{frame_count} frames", flush=True)

    capture.release()
    encoder.stdin.close()
    if encoder.wait() != 0:
        raise RuntimeError("ffmpeg failed to encode video")

    temp_path.replace(destination)
    print(
        f"Wrote {destination} ({CROP_W}x{CROP_H}, {SPEED}x speed, "
        f"radius={CORNER_RADIUS}px, {index} frames @ {output_fps:.1f} fps)"
    )


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    source = root / "8:17:26 wizard ui.mov"
    destination = root / "assets" / "videos" / "cueturn" / "cueturn-wizard-ui.mp4"

    if len(sys.argv) >= 2:
        source = Path(sys.argv[1])
    if len(sys.argv) >= 3:
        destination = Path(sys.argv[2])

    if not source.exists():
        print(f"Source video not found: {source}", file=sys.stderr)
        return 1

    render_video(source, destination)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
