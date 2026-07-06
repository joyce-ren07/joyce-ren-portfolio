#!/usr/bin/env python3
"""Re-encode the HMW animation with subtle drop shadows on UI elements."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

BG_COLOR = np.array([237, 240, 247], dtype=np.float32)
BG_THRESHOLD = 14.0
BG_FEATHER = 10.0
SHADOW_BLUR = 12
SHADOW_OFFSET_Y = 5
SHADOW_OPACITY = 0.16
ENCODE_CRF = 16
ENCODE_PRESET = "slow"


def build_alpha_mask(arr: np.ndarray) -> np.ndarray:
    dist = np.sqrt(((arr - BG_COLOR) ** 2).sum(axis=2))
    return np.clip((dist - BG_THRESHOLD) / BG_FEATHER, 0.0, 1.0)


def process_frame_bgr(frame_bgr: np.ndarray) -> np.ndarray:
    rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    arr = rgb.astype(np.float32)
    h, w = arr.shape[:2]
    alpha = build_alpha_mask(arr)

    hard_mask = (alpha > 0.02).astype(np.uint8) * 255
    mask_img = Image.fromarray(hard_mask, mode="L")
    blurred = np.array(mask_img.filter(ImageFilter.GaussianBlur(radius=SHADOW_BLUR)))

    shadow = np.zeros_like(blurred, dtype=np.float32)
    if SHADOW_OFFSET_Y < h:
        shadow[SHADOW_OFFSET_Y:, :] = blurred[:-SHADOW_OFFSET_Y, :]
    shadow_alpha = (shadow / 255.0) * SHADOW_OPACITY

    out = np.full((h, w, 3), 255, dtype=np.float32)
    for channel in range(3):
        out[:, :, channel] = out[:, :, channel] * (1.0 - shadow_alpha)
        out[:, :, channel] = (
            out[:, :, channel] * (1.0 - alpha) + arr[:, :, channel] * alpha
        )

    return cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)


def render_video(source: Path, destination: Path) -> None:
    capture = cv2.VideoCapture(str(source))
    if not capture.isOpened():
        raise RuntimeError(f"Unable to open video: {source}")

    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = capture.get(cv2.CAP_PROP_FPS)
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))

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
        f"{width}x{height}",
        "-r",
        str(fps),
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
        encoder.stdin.write(process_frame_bgr(frame).tobytes())
        index += 1
        if index % 60 == 0:
            print(f"Processed {index}/{frame_count} frames", flush=True)

    capture.release()
    encoder.stdin.close()
    if encoder.wait() != 0:
        raise RuntimeError("ffmpeg failed to encode video")

    temp_path.replace(destination)
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
            "  git show aae8337:assets/videos/current/gcal-how-might-we.mp4 "
            "> assets/videos/current/gcal-how-might-we-source.mp4",
            file=sys.stderr,
        )
        return 1

    render_video(source, destination)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
