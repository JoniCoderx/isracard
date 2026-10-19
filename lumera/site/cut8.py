#!/usr/bin/env python3
# The pieces for /test8/, cut out of the house's own studio photographs so
# each can stand in front of type and colour, as in a product reel:
# - the photo's backdrop is measured and lifted to white;
# - an open matting model (rembg, isnet-general-use, run here once) finds the
#   piece itself, which is kept whole and opaque;
# - everything finer than the model sees (chain links, pavé edges) and the
#   piece's own soft shadow are kept as what they darken: over white the
#   result is the photograph exactly, over a colour the shadow falls on it;
# - backdrop further than a little from the piece is let go.
#   public/cut8/{piece}-{700,1200}.webp (with transparency), and for the
#   opening, public/cut8/pave-hero-{700,1200}.webp: SOUL, close and turned
#   (necklace-macro)
# Usage: python3 cut8.py <dir holding img/{shot}-1254.jpg>
import sys, os
import numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session
SRC = sys.argv[1] if len(sys.argv) > 1 else "dist"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "cut8")
os.makedirs(OUT, exist_ok=True)
SHOTS = {"knot": "knot-flat", "ring": "ring-front", "pave": "necklace-detail", "aura": "aura-pair", "promise": "promise-front", "blush": "blush-front", "cadence": "cadence-front", "pave-hero": "necklace-macro"}
sess = new_session("isnet-general-use")
for pid, shot in SHOTS.items():
    im = Image.open(os.path.join(SRC, "img", shot + "-1254.jpg")).convert("RGB")
    a0 = np.asarray(im, float)
    edge = np.concatenate([a0[:6].reshape(-1, 3), a0[-6:].reshape(-1, 3), a0[:, :6].reshape(-1, 3), a0[:, -6:].reshape(-1, 3)])
    I = np.clip(a0 * 255 / max(200, np.percentile(edge.mean(1), 60)), 0, 255)
    mask = remove(im, session=sess, only_mask=True, post_process_mask=True)
    M = np.asarray(mask.filter(ImageFilter.GaussianBlur(1.2)), float) / 255
    near = np.asarray(mask.filter(ImageFilter.MaxFilter(61)).filter(ImageFilter.GaussianBlur(20)), float) / 255
    aL = np.clip((1 - I.min(2) / 255) * 1.15 - 0.05, 0, 1) * near
    a = np.maximum(M, aL)
    rgb = np.clip((I - (1 - a[..., None]) * 255) / np.maximum(a[..., None], 0.004), 0, 255)
    # where the photograph's frame cut the piece (a chain running out of it),
    # it fades out over the last tenth instead of stopping in mid-air
    H_, W_ = a.shape; f = int(0.1 * min(H_, W_)); ramp = np.linspace(0, 1, f)
    if a[:3].max() > 0.3: a[:f] *= ramp[:, None]
    if a[-3:].max() > 0.3: a[-f:] *= ramp[::-1][:, None]
    if a[:, :3].max() > 0.3: a[:, :f] *= ramp[None, :]
    if a[:, -3:].max() > 0.3: a[:, -f:] *= ramp[::-1][None, :]
    o = Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8), "RGBA")
    o = o.crop(o.getchannel("A").point(lambda v: 255 if v > 5 else 0).getbbox())
    for size in (700, 1200):
        s = size / max(o.size)
        r = o.resize((round(o.width * s), round(o.height * s)), Image.LANCZOS) if s < 1 else o
        r.save(os.path.join(OUT, f"{pid}-{size}.webp"), "WEBP", quality=88, method=6)
    print(pid, shot, o.size)
