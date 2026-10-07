#!/usr/bin/env python3
"""The white hero film for /test-white/, made from one still.

The still ("The Cloche" by day: the three pieces under a glass cloche on white
marble, Dubai behind) is moved like a camera on a slider: a slow push in toward
the necklace and back out, eased at both ends, so the film loops on itself.
The light is the photograph's own: the brightest points of the stones (found
as what stands above its surroundings, not painted on) catch in a slow wave
that runs along the pieces, and a soft band of daylight crosses the room once
per loop. Nothing is drawn that is not in the picture.

  dist/v/hero-white.mp4 (1080), dist/v/hero-white-720.mp4 (phones),
  dist/img/hero-white-1600.jpg, dist/img/hero-white-1920.jpg

Needs ffmpeg, numpy and Pillow. Usage: hero-white.py <dist dir>
"""
import os, subprocess, sys, tempfile, urllib.request
import numpy as np
from PIL import Image, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else "dist"
SRC = "https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf/hf_20261007_203347_c4951f35-ed0e-4092-a4df-c66bb6e6e4a8.png"
FPS, T = 24, 12.0                 # one loop, in seconds
N = int(FPS * T)
W, H = 1920, 1080
FOCUS = (0.405, 0.47)             # the necklace's pendant, as a fraction of the still
ZOOM = 0.13                       # how far the camera pushes in at the middle of the loop
BOX = (700, 480, 1380, 1240)      # where the pieces are, in the still's pixels

os.makedirs(os.path.join(OUT, "v"), exist_ok=True)
os.makedirs(os.path.join(OUT, "img"), exist_ok=True)
tmp = tempfile.mkdtemp()
src = os.path.join(tmp, "still.png")
req = urllib.request.Request(SRC, headers={"User-Agent": "silavu-build"})
with urllib.request.urlopen(req, timeout=120) as r, open(src, "wb") as f:
    f.write(r.read())

im = Image.open(src).convert("RGB")
SW, SH = im.size
base = np.asarray(im).astype(np.float32) / 255.0

# the stones' own highlights: brighter than their neighbourhood by a clear margin
x0, y0, x1, y1 = BOX
crop = base[y0:y1, x0:x1]
lum = crop @ np.array([0.299, 0.587, 0.114], np.float32)
blur = np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(7))).astype(np.float32) / 255.0
hi = np.clip((lum - blur - 0.05) / 0.10, 0, 1) * np.clip((lum - 0.55) / 0.3, 0, 1)
yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
along = (xx / SW) * 1.0 + (yy / SH) * 0.35          # the direction the wave runs
rng = np.random.default_rng(7)
phase = rng.uniform(0, 2 * np.pi, hi.shape).astype(np.float32)

# the daylight band: a soft diagonal across the whole frame
gy, gx = np.mgrid[0:SH, 0:SW].astype(np.float32)
diag = (gx / SW) * 0.8 + (gy / SH) * 0.6

def frame(i):
    t = i / N                                       # 0..1 over the loop
    img = base.copy()
    # daylight: the band enters at one side and leaves at the other, out of frame at the seam
    pos = -0.35 + 2.1 * t
    band = np.exp(-((diag - pos) / 0.22) ** 2)
    img *= (1.0 + 0.07 * band)[..., None]
    # the stones catch: a wave along the pieces twice a loop, and each point's own slow twinkle
    wave = (0.5 + 0.5 * np.cos(2 * np.pi * (2 * t) - along * 9.0)) ** 14
    twk = (0.5 + 0.5 * np.cos(2 * np.pi * (3 * t) + phase)) ** 24
    g = hi * (0.75 * wave + 0.45 * twk)
    glow = np.asarray(Image.fromarray((np.clip(g, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255.0
    sub = img[y0:y1, x0:x1]
    sub += (g * 0.55 + glow * 0.5)[..., None]
    img = np.clip(img, 0, 1)
    # the camera: in and back out, eased, so the last frame meets the first
    e = 0.5 - 0.5 * np.cos(2 * np.pi * t)
    s = 1.0 + ZOOM * e
    cw = SW / s
    ch = cw * 9 / 16
    if ch > SH:
        ch = SH; cw = ch * 16 / 9
    cx = SW / 2 + (FOCUS[0] * SW - SW / 2) * e * 0.9
    cy = SH / 2 + (FOCUS[1] * SH - SH / 2) * e * 0.9
    bx0 = min(max(cx - cw / 2, 0), SW - cw)
    by0 = min(max(cy - ch / 2, 0), SH - ch)
    out = Image.fromarray((img * 255 + 0.5).astype(np.uint8)).resize((W, H), Image.LANCZOS, box=(bx0, by0, bx0 + cw, by0 + ch))
    return out

hd = os.path.join(OUT, "v", "hero-white.mp4")
enc = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                        "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", hd],
                       stdin=subprocess.PIPE)
for i in range(N):
    f = frame(i)
    if i == 0:
        for w in (1600, 1920):
            f.resize((w, w * 9 // 16), Image.LANCZOS).save(os.path.join(OUT, "img", f"hero-white-{w}.jpg"), quality=90)
    enc.stdin.write(f.tobytes())
enc.stdin.close()
if enc.wait():
    sys.exit("encoding failed")
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", hd, "-an", "-vf", "scale=1280:720:flags=lanczos", "-c:v", "libx264", "-preset", "slow",
                "-crf", "23", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", os.path.join(OUT, "v", "hero-white-720.mp4")], check=True)
for n in ("hero-white.mp4", "hero-white-720.mp4"):
    print(n, os.path.getsize(os.path.join(OUT, "v", n)) // 1024, "KB")
