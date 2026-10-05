#!/usr/bin/env python3
# The desk in "Light goes in. Fire comes out.": a black leather surface and the
# loose stones and bracelet links that lie on it. The masters are 4K renders
# kept on the generation host; the page asks for small cut-outs of the stones
# (512 on the long side, with their own transparency, trimmed to the stone)
# and the leather at three widths plus an upright phone crop.
# Usage: python3 desk-assets.py <out dir>   (needs Pillow)
import io, os, sys, urllib.request
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else "dist/desk"
os.makedirs(OUT, exist_ok=True)
B = "https://d8j0ntlcm91z4.cloudfront.net/user_3ErATumMWusrALBkSVRVXQxJGVf/"
STONES = {
    "round":    "hf_20261005_131720_58205823-36f4-4828-b50b-3cb75b52eb18.png",
    "emerald":  "hf_20261005_131721_2c669470-ed84-4022-a351-111982fb35e7.png",
    "baguette": "hf_20261005_131720_d74cf871-eede-47e6-9413-3c45cfa3b41b.png",
    "marquise": "hf_20261005_131720_c9140f44-36e0-4064-ade0-b923eb0e7f74.png",
    "pear":     "hf_20261005_131721_ba7bbef6-1952-4046-813a-cdc77dc85d12.png",
    "oval":     "hf_20261005_131722_2cdff433-77ad-4424-abe3-c08f23754447.png",
    "link":     "hf_20261005_131722_e349478c-28a2-4314-b65d-e0ccbb59f5aa.png",
    "princess": "hf_20261005_131722_6fc894af-28b2-4787-9890-7ce349a5993c.png",
}
LEATHER = "hf_20261005_131810_107ad100-5a3c-41e1-a02d-9c014fa1aea5.png"  # 3840 x 2160


def get(name):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(B + name, timeout=120) as r:
                return Image.open(io.BytesIO(r.read()))
        except Exception as e:  # a slow host gets three more tries
            err = e
    raise SystemExit("desk: could not fetch %s (%s)" % (name, err))


for n, f in STONES.items():
    im = get(f).convert("RGBA")
    # trimmed to the stone: the faint haze the render leaves around it is cut
    a = im.split()[3].point(lambda v: 255 if v > 12 else 0)
    im = im.crop(a.getbbox())
    im.thumbnail((512, 512), Image.LANCZOS)
    im.save(os.path.join(OUT, n + "-512.webp"), "WEBP", quality=86, method=6)

lt = get(LEATHER).convert("RGB")
for w in (3840, 2560, 1600):
    lt.resize((w, round(w * 9 / 16)), Image.LANCZOS).save(
        os.path.join(OUT, "leather-%d.jpg" % w), "JPEG", quality=82, optimize=True, progressive=True)
# a phone holds the desk upright: the middle of the master, 9:16, real pixels
lt.crop((1312, 0, 1312 + 1215, 2160)).resize((1080, 1920), Image.LANCZOS).save(
    os.path.join(OUT, "leather-v-1080.jpg"), "JPEG", quality=80, optimize=True, progressive=True)

for f in sorted(os.listdir(OUT)):
    print("desk/%s %dKB" % (f, os.path.getsize(os.path.join(OUT, f)) // 1024))
