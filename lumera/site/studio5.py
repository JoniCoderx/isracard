#!/usr/bin/env python3
# The collection for /test5/, all seven pieces in one light: each of two
# photographed angles of every piece has its backdrop measured and lifted to
# white (only the exposure changes, and the outer edge of the backdrop is
# eased to white), then is laid onto the same warm stone tile (a soft pool of
# light from above, deeper at the edges) by multiplying: the piece and its own
# shadow sit on the stone, nothing of the piece is redrawn. Done here, once,
# so the page needs no blending while it moves.
#   public/studio5/{piece}-{a,b}-{700,1200}.webp
# Usage: python3 studio5.py <dir holding img/{shot}-1254.jpg>
import sys, os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
SRC = sys.argv[1] if len(sys.argv) > 1 else "dist"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "studio5")
os.makedirs(OUT, exist_ok=True)
PIECES = {"knot": ("knot-flat", "knot-full"), "ring": ("ring-front", "ring-side"), "pave": ("necklace-detail", "necklace-front"), "aura": ("aura-pair", "aura-signed"),
          "promise": ("promise-front", "promise-macro"), "blush": ("blush-front", "blush-side"), "cadence": ("cadence-front", "cadence-side")}
N = 1254
# the stone: warm, lit from above, a little grain
yy, xx = np.mgrid[0:N, 0:N] / N
d = np.sqrt((xx - 0.5) ** 2 * 1.0 + (yy - 0.36) ** 2 * 1.3)
light = np.clip(1 - d * 0.62, 0, 1) ** 1.4
base = np.array([182, 172, 160], float); top = np.array([226, 219, 209], float)
tile = base[None, None, :] + (top - base)[None, None, :] * light[..., None]
rng = np.random.default_rng(7); tile += rng.normal(0, 1.6, (N, N, 1))
tile = np.clip(tile, 0, 255)
for pid, shots in PIECES.items():
    for tag, s in zip("ab", shots):
        im = Image.open(os.path.join(SRC, "img", s + "-1254.jpg")).convert("RGB")
        w, h = im.size
        edge = [im.getpixel((x, y)) for x in range(0, w, 7) for y in (2, 6, h - 3, h - 7)] + [im.getpixel((x, y)) for y in range(0, h, 7) for x in (2, 6, w - 3, w - 7)]
        bg = sorted(sum(p) / 3 for p in edge)[int(len(edge) * 0.6)]
        k = 255.0 / max(200.0, bg)
        out = im.point([min(255, int(round(v * k))) for v in range(256)] * 3)
        m = Image.new("L", (w, h), 255); dr = ImageDraw.Draw(m); f = int(w * 0.09)
        dr.rectangle([f, f, w - f, h - f], fill=0); m = m.filter(ImageFilter.GaussianBlur(f * 0.6))
        out = Image.composite(Image.new("RGB", (w, h), (255, 255, 255)), out, m).resize((N, N), Image.LANCZOS)
        comp = Image.fromarray((np.asarray(out, float) / 255 * tile).astype(np.uint8))
        for size in (700, 1200):
            comp.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, f"{pid}-{tag}-{size}.webp"), "WEBP", quality=84, method=6)
        print(pid, tag, s, f"backdrop {bg:.0f}")
