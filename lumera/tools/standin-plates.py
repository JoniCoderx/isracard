"""Local stand-in wrist plates.

The twelve photographs are fetched by CI from a host this container cannot
reach, so the local build renders the wrist view with these instead: a dark
frame, a tapered arm, and a BRIGHT GREEN band drawn exactly where script2's
plate table says the wrist is.

That makes the stand-in a test rather than a placeholder. If the stones the
renderer draws land inside the green band, the table is right — and the
photograph lands in the same place, because both were measured the same way.
"""
import math, os
from PIL import Image, ImageDraw

OUT = "/home/user/isracard/lumera/site/dist/img"
os.makedirs(OUT, exist_ok=True)

# the same numbers as script2.html
P = {
    "f": (0.4771, 0.6615, 0.1060),
    "m": (0.4866, 0.7040, 0.1272),
}
SLOPE = -0.296                      # dx per dy, down the arm
TINT = [(232,205,184),(220,179,148),(199,148,104),(164,113,63),(119,80,44),(77,51,29)]

def plate(W, H, g, tint):
    cx, cy, r = g[0]*W, g[1]*H, g[2]*H
    im = Image.new("RGB", (W, H), (7,7,7))
    d = ImageDraw.Draw(im)
    left, right = [], []
    t = -1.0
    while t <= 1.0001:
        y = cy + t*H*0.55
        c = cx + (y-cy)*SLOPE
        w = r*(1 + (abs(t)**1.6)*0.75) if t < 0 else r*(1 + (t**1.3)*0.55)
        left.append((c-w, y)); right.append((c+w, y))
        t += 0.05
    d.polygon(left + right[::-1], fill=tint)
    # the wrist band, at right angles to the arm
    ang = math.atan2(1.0, SLOPE) - math.pi/2
    ca, sa = math.cos(ang), math.sin(ang)
    bw, bh = r*1.25, r*0.22
    corners = [(-bw,-bh),(bw,-bh),(bw,bh),(-bw,bh)]
    d.polygon([(cx + x*ca - y*sa, cy + x*sa + y*ca) for x, y in corners], fill=(0,255,102))
    return im

n = 0
for k in ("f", "m"):
    for s in range(6):
        for suf, W, H in (("-1900",1900,950), ("-1300",1300,650), ("-1000",1000,500)):
            plate(W, H, P[k], TINT[s]).save(
                "%s/wrist-%s%d%s.jpg" % (OUT, k, s, suf), quality=86, optimize=True)
            n += 1
print("wrote %d stand-in plates" % n)
