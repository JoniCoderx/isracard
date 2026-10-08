#!/usr/bin/env python3
"""The matte for the hero pop-out, cut once from the take and kept as a film.

For each frame from the moment she reaches in, a segmentation model (rembg,
birefnet-general-lite) separates the foreground from the room; of that, only
what is lit is kept, her hands and arms and the white-gold necklace, and not
the black velvet form, which stays behind the words. The matte rises over
one second as her fingers reach the chain, so the necklace comes forward as
it is taken, and is black before that. Each frame is blended with its
neighbours so the edges hold still.

  hero-pop-matte.py <frames dir> <masks dir> <out.mp4>
  (frames: 0001.png.. of the 1080p take; masks: the model's output, same names)
"""
import os, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter

FR, MK, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
A, B = 168, 192          # the matte rises from frame A (7.0 s) to frame B (8.0 s)
names = sorted(f for f in os.listdir(FR) if f.endswith(".png"))
W, H = Image.open(os.path.join(FR, names[0])).size
enc = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", "24", "-i", "-",
                        "-c:v", "libx264", "-preset", "slow", "-crf", "8", "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
def raw(n):
    """the matte of one frame before smoothing: the model's foreground, kept where it is lit"""
    mp = os.path.join(MK, n)
    if not os.path.exists(mp): return None
    im = Image.open(os.path.join(FR, n)).convert("L")
    lum = np.asarray(im.filter(ImageFilter.GaussianBlur(2)), np.float32) / 255.0
    m = np.asarray(Image.open(mp).convert("L").resize((W, H), Image.LANCZOS), np.float32) / 255.0
    lit = np.clip((lum - 0.22) / 0.14, 0, 1)
    return m * lit * lit * (3 - 2 * lit)

# each frame is blended with its neighbours (1:2:1), so an edge the model
# placed a pixel differently from one frame to the next does not flicker
cache = {}
def get(i):
    if i < 0 or i >= len(names): return None
    if i not in cache: cache[i] = raw(names[i])
    return cache[i]
for k, n in enumerate(names, 1):
    w = min(1.0, max(0.0, (k - A) / (B - A)))
    cur = get(k - 1)
    if w <= 0 or cur is None:
        enc.stdin.write(bytes(W * H)); cache.pop(k - 3, None); continue
    prev, nxt = get(k - 2), get(k)
    prev = cur if prev is None else prev; nxt = cur if nxt is None else nxt
    a = (prev + 2 * cur + nxt) / 4 * w
    a = np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)))
    enc.stdin.write(a.tobytes())
    cache.pop(k - 3, None)
enc.stdin.close()
sys.exit(enc.wait())
