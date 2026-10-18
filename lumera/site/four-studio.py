#!/usr/bin/env python3
# The four signature pieces for /test4/, two photographed angles each, set in
# one studio: every photograph's backdrop is measured at its edges and the
# exposure is lifted just enough that the backdrop reads as pure white, so on
# the page the pieces sit in the same light with no box or mask around them.
# Only the brightness is changed, and the outer edge of the backdrop eased
# to white; nothing of the piece is redrawn.
#   public/studio/{shot}-{700,1100}.webp
# Usage: python3 four-studio.py <dir holding img/{shot}-1254.jpg>
import sys, os
from PIL import Image, ImageOps, ImageFilter, ImageDraw
SRC = sys.argv[1] if len(sys.argv) > 1 else "dist"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "studio")
os.makedirs(OUT, exist_ok=True)
SHOTS = ["knot-flat", "knot-full", "ring-front", "ring-side", "necklace-detail", "necklace-front", "aura-pair", "aura-signed"]
for s in SHOTS:
    im = Image.open(os.path.join(SRC, "img", s + "-1254.jpg")).convert("RGB")
    w, h = im.size
    # the backdrop: a band of pixels along all four edges
    edge = [im.getpixel((x, y)) for x in range(0, w, 7) for y in (2, 6, h - 3, h - 7)] + \
           [im.getpixel((x, y)) for y in range(0, h, 7) for x in (2, 6, w - 3, w - 7)]
    lum = sorted(sum(p) / 3 for p in edge)
    bg = lum[int(len(lum) * 0.6)]
    k = 255.0 / max(200.0, bg)
    lut = [min(255, int(round(v * k))) for v in range(256)] * 3
    out = im.point(lut)
    # the outer edge of the frame is backdrop only: it is eased to white, so
    # a backdrop shaded darker at one side does not show as an edge
    m = Image.new("L", (w, h), 255); d = ImageDraw.Draw(m); f = int(w * 0.09)
    d.rectangle([f, f, w - f, h - f], fill=0)
    m = m.filter(ImageFilter.GaussianBlur(f * 0.6))
    out = Image.composite(Image.new("RGB", (w, h), (255, 255, 255)), out, m)
    for size in (700, 1100):
        out.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, f"{s}-{size}.webp"), "WEBP", quality=86, method=6)
    print(f"{s}: backdrop {bg:.0f} -> 255 (x{k:.3f})")
