# The prints for the private archive (archive-scene.py): the house's campaign photographs as small editorial cards,
# 48 x 74 mm at 20 px/mm, a 42 x 54 mm picture, the caption in the house's spaced capitals (Jost), a faint paper grain,
# and a gloss mask (the picture is glossier than the card).
# Usage: python3 archive-prints.py <public_dir> <jost.ttf> <out_dir>
import sys
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import numpy as np
pub, ttf, out = sys.argv[1].rstrip("/") + "/", sys.argv[2], sys.argv[3].rstrip("/") + "/"
K = 20; W, H = 48, 74; PX, PY, PW, PH = 3, 3.5, 42, 54
font = ImageFont.truetype(ttf, int(2.1 * K))
for name, img, cap in [("icon", "models/ring-1400.jpg", "SILAVU ICON"), ("soul", "models/necklace-1400.jpg", "SILAVU SOUL"), ("moment", "models/bracelet-1400.jpg", "SILAVU MOMENT")]:
    card = np.full((H * K, W * K, 3), (237, 230, 216), np.float32)
    card += np.random.default_rng(3).normal(0, 2.2, card.shape[:2])[..., None]
    card = Image.fromarray(np.clip(card, 0, 255).astype(np.uint8))
    ph = Image.open(pub + img).convert("RGB"); tw, th = int(PW * K), int(PH * K); r = max(tw / ph.width, th / ph.height)
    ph = ph.resize((round(ph.width * r), round(ph.height * r)), Image.LANCZOS); ox = (ph.width - tw) // 2; oy = int((ph.height - th) * .3)
    ph = ImageEnhance.Contrast(ph.crop((ox, oy, ox + tw, oy + th))).enhance(1.06)
    card.paste(ph, (int(PX * K), int(PY * K)))
    d = ImageDraw.Draw(card); d.rectangle([int(PX * K), int(PY * K), int(PX * K) + tw - 1, int(PY * K) + th - 1], outline=(150, 138, 120), width=1)
    sp = .55 * K; ws = [d.textlength(c, font=font) for c in cap]; x = (W * K - (sum(ws) + sp * (len(cap) - 1))) / 2; y = (PY + PH + 7.2) * K
    for c, w in zip(cap, ws): d.text((x, y), c, font=font, fill=(52, 44, 36), anchor="lm"); x += w + sp
    card.save(out + name + ".png")
    m = Image.new("L", (W * K, H * K), 200); ImageDraw.Draw(m).rectangle([int(PX * K), int(PY * K), int(PX * K) + tw, int(PY * K) + th], fill=90); m.save(out + name + "-rough.png")
print("ok")
