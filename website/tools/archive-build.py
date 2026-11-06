#!/usr/bin/env python3
# The private archive (test14 "Up close"), built end to end for one layout: every render the page needs, from
# archive-scene.py, then packed into lumera/site/public/archive15/<layout>/ with a manifest the page reads.
# Changing a piece (its model in archive-scene.py, its print, its place) is: edit, run this, commit.
#
#   python3 archive-build.py <blender> <d|m> <work_dir> [steps]
#   steps (default all, in order): prints final masks plate heroes seq pack
#   seq may be given a frame range, seq:<i0>:<i1>, to render the opening in parts (each part is one Blender run)
#   final2x plate2x (desktop, on request): the still and its plate at twice the size, for high-density screens
#
#   final   the still the house approved (path traced; deterministic, so the same script gives the same picture)
#   masks   each piece's exact silhouette in that still (hover and click)
#   plate   the still without the jewellery (what shows where a piece is lifted)
#   heroes  each piece alone at 2x, from the same camera and light, cropped to it (the piece as it comes forward)
#   seq     the drawer opening: N frames from closed to the still, scrubbed by the scroll, at the still's own size
#   pack    webp, the id map, the patches under each piece, the manifest
import json, os, subprocess, sys
from PIL import Image, ImageFilter, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.dirname(os.path.dirname(HERE))
PUB = os.path.join(REPO, "lumera/site/public"); SCENE = os.path.join(HERE, "archive-scene.py")
BL, LAY, WORK = sys.argv[1], sys.argv[2], os.path.abspath(sys.argv[3])
STEPS = sys.argv[4].split(",") if len(sys.argv) > 4 else ["prints", "final", "masks", "plate", "heroes", "seq", "pack"]
# 96 frames, as the box sequence: about 12px of scroll each, so the drawer glides rather than steps
# desktop: the view runs 1.3x wider and taller than the approved frame (2496x1404, the frame its exact middle), so on any
# window the drawer sits in its cabinet and room instead of being cut by black bars
CFG = {"d": dict(res=(2496, 1404), seq_res=(2496, 1404), n=96, over=1.3), "m": dict(res=(1080, 1920), seq_res=(1080, 1920), n=96, over=1)}[LAY]
OVER = CFG["over"]; ENV = dict(os.environ, ARCH_OVER=str(OVER))
PIECES = {1: "ring", 2: "pave", 3: "aura", 4: "knot"}; PRINTS = {5: "ring", 6: "pave", 7: "knot"}
W, H = CFG["res"]; HS = 2; os.makedirs(WORK, exist_ok=True); PR = os.path.join(WORK, "prints")
OUT = os.environ.get("ARCH_OUT") or os.path.join(PUB, "archive15", LAY); os.makedirs(OUT, exist_ok=True)   # ARCH_OUT: pack elsewhere (a test)

def blender(out, w, h, samples, mode="frame"):
    cmd = [BL, "-b", "-P", SCENE, "--", out, str(w), str(h), str(samples), "open", LAY, PUB, PR, mode]
    r = subprocess.run(cmd, capture_output=True, text=True, env=ENV)
    if "DONE" not in r.stdout: sys.exit("blender failed: " + " ".join(cmd) + "\n" + r.stdout[-3000:] + r.stderr[-2000:])
    print("rendered", mode, out, flush=True)

def bbox(m, thr=8):
    return m.point(lambda v: 255 if v > thr else 0).getbbox()
def mask(pid): return Image.open(os.path.join(WORK, "masks", f"m{pid}_0001.png")).convert("L")
def hero_box(pid):
    x0, y0, x1, y1 = bbox(mask(pid)); mx, my = (x1 - x0) * .14 + 6, (y1 - y0) * .14 + 6
    x0, y0, x1, y1 = max(0, x0 - mx), max(0, y0 - my), min(W, x1 + mx), min(H, y1 + my)
    return [round(v) for v in (x0, y0, x1, y1)]

if "prints" in STEPS:
    # the house's Jost, straight from the site's own font file (Pillow and Blender read WOFF2 as they read the TTF)
    os.makedirs(PR, exist_ok=True)
    subprocess.run([sys.executable, os.path.join(HERE, "archive-prints.py"), PUB, os.path.join(PUB, "fonts/jost-normal-latin-b58a58.woff2"), PR], check=True)
if "final" in STEPS: blender(os.path.join(WORK, "final.png"), W, H, 160)
if "masks" in STEPS: blender(os.path.join(WORK, "masks") + "/", W, H, 1, "masks")
if "plate" in STEPS: blender(os.path.join(WORK, "plate.png"), W, H, 96, "plate")
if "final2x" in STEPS: blender(os.path.join(WORK, "final-x.png"), W * 2, H * 2, 160)
if "plate2x" in STEPS: blender(os.path.join(WORK, "plate-x.png"), W * 2, H * 2, 96, "plate")

# the approved frame inside the wider view, and a fall-off to black across the margin only (the frame itself untouched),
# so the room dissolves into the page's black at its outer edge
FW, FH = round(W / OVER), round(H / OVER); FX, FY = (W - FW) // 2, (H - FH) // 2
def falloff(size):
    w, h = size
    if OVER <= 1: return None
    import numpy as np
    sx, sy = w / W, h / H
    def axis(n, f0, f1):
        v = np.arange(n) + .5; d = np.minimum(np.clip((v - 0) / max(1, f0), 0, 1), np.clip((n - v) / max(1, n - f1), 0, 1))
        return d * d * (3 - 2 * d)
    fx = axis(w, FX * sx, (FX + FW) * sx); fy = axis(h, FY * sy, (FY + FH) * sy)
    return np.outer(fy, fx) ** .8
def fade(im):
    f = falloff(im.size)
    if f is None: return im
    import numpy as np
    a = np.asarray(im.convert("RGB")).astype(np.float32) * f[..., None]
    return Image.fromarray(np.clip(a + .5, 0, 255).astype("uint8"))
if "heroes" in STEPS:
    for pid in PIECES:
        x0, y0, x1, y1 = hero_box(pid); hs = max(HS, min(6, round(1400 / max(x1 - x0, y1 - y0), 2)))   # small pieces finer
        blender(os.path.join(WORK, f"hero{pid}.png"), round(W * hs), round(H * hs), 96, f"hero:{pid}:{x0 / W:.5f},{1 - y1 / H:.5f},{x1 / W:.5f},{1 - y0 / H:.5f}")
SEQD = os.path.join(WORK, "seq%du%s" % (CFG["n"], "" if OVER == 1 else "o%g" % OVER))
for st in [x for x in STEPS if x == "seq" or x.startswith("seq:")]:
    os.makedirs(SEQD, exist_ok=True); sw, sh = CFG["seq_res"]; n = CFG["n"]
    i0, i1 = (0, n - 1) if st == "seq" else [int(v) for v in st.split(":")[1:3]]
    blender(os.path.join(SEQD, "f####.png"), sw, sh, 36, f"seq:{n}:{i0}:{i1}:u")   # evenly spaced steps
if "pack" in STEPS:
    man = {"layout": LAY, "res": [W, H], "frame": [FX, FY, FX + FW, FY + FH], "final": f"archive15/{LAY}/final.webp", "pieces": [], "prints": []}
    fade(Image.open(os.path.join(WORK, "final.png")).convert("RGB")).save(os.path.join(OUT, "final.webp"), quality=90, method=6)
    plate = fade(Image.open(os.path.join(WORK, "plate.png")).convert("RGB"))
    # the twice-size still and plate, where rendered (the page sends them to high-density screens only)
    fx, px_ = os.path.join(WORK, "final-x.png"), os.path.join(WORK, "plate-x.png")
    plateX = fade(Image.open(px_).convert("RGB")) if os.path.exists(px_) and os.path.exists(fx) and Image.open(fx).size == (W * 2, H * 2) else None
    if plateX:
        fade(Image.open(fx).convert("RGB")).save(os.path.join(OUT, "final-x.webp"), quality=88, method=6)
        man["finalX"] = {"src": f"archive15/{LAY}/final-x.webp", "res": [W * 2, H * 2]}
    # the id map, at half size: which piece (or print) is under each point of the still
    ids = Image.new("L", (W, H), 0)
    for pid in list(PIECES) + list(PRINTS):
        ids.paste(pid * 32, (0, 0, W, H), mask(pid).point(lambda v: 255 if v > 127 else 0))
    ids.resize((W // 2, H // 2), Image.NEAREST).save(os.path.join(OUT, "ids.png"), optimize=True)
    man["ids"] = {"src": f"archive15/{LAY}/ids.png", "scale": .5, "step": 32}
    for pid, pc in PIECES.items():
        m = mask(pid); x0, y0, x1, y1 = bbox(m)
        # the patch: the plate where the piece and its contact shadow were, feathered, so lifting the piece leaves the
        # suede (or the stand) as it would be
        grow = max(5, round(W / 190)); a = m.filter(ImageFilter.MaxFilter(grow * 2 + 1)).filter(ImageFilter.GaussianBlur(grow * .6))
        px0, py0, px1, py1 = max(0, x0 - grow * 2), max(0, y0 - grow * 2), min(W, x1 + grow * 2), min(H, y1 + grow * 2)
        patch = plate.crop((px0, py0, px1, py1)).convert("RGBA"); patch.putalpha(a.crop((px0, py0, px1, py1)))
        patch.save(os.path.join(OUT, f"patch-{pc}.webp"), quality=88, method=6)
        if plateX:
            ax = a.crop((px0, py0, px1, py1)).resize(((px1 - px0) * 2, (py1 - py0) * 2), Image.BILINEAR)
            patchX = plateX.crop((px0 * 2, py0 * 2, px1 * 2, py1 * 2)).convert("RGBA"); patchX.putalpha(ax)
            patchX.save(os.path.join(OUT, f"patch-{pc}-x.webp"), quality=88, method=6)
        hx0, hy0, hx1, hy1 = hero_box(pid)
        Image.open(os.path.join(WORK, f"hero{pid}.png")).save(os.path.join(OUT, f"hero-{pc}.webp"), quality=90, method=6)
        man["pieces"].append({"pid": pid, "id": pc, "box": [x0, y0, x1, y1], "patch": {"src": f"archive15/{LAY}/patch-{pc}.webp", "rect": [px0, py0, px1, py1], **({"srcX": f"archive15/{LAY}/patch-{pc}-x.webp"} if plateX else {})},
                              "hero": {"src": f"archive15/{LAY}/hero-{pc}.webp", "rect": [hx0, hy0, hx1, hy1]}})
    for pid, pc in PRINTS.items(): man["prints"].append({"pid": pid, "piece": pc, "box": list(bbox(mask(pid)))})
    frames = sorted(f for f in os.listdir(SEQD) if f.endswith(".png"))
    if len(frames) != CFG["n"]: sys.exit(f"pack: {len(frames)} opening frames in {SEQD}, expected {CFG['n']}")
    od = os.path.join(OUT, "seq")
    if os.path.isdir(od):
        for f in os.listdir(od): os.remove(os.path.join(od, f))
    os.makedirs(od, exist_ok=True)
    for k, f in enumerate(frames): fade(Image.open(os.path.join(SEQD, f)).convert("RGB")).save(os.path.join(od, "%02d.webp" % k), quality=88, method=6)
    man["seq"] = {"n": len(frames), "res": list(CFG["seq_res"]), "src": f"archive15/{LAY}/seq/%02d.webp", "space": "even"}
    json.dump(man, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
    print("packed", OUT)
