# The SILAVU private archive (test14 "Up close"): the drawer and everything in it, path traced in Blender (Cycles).
# All four pieces are built from the house's own data, never redrawn:
#   SOUL    the exact mark (body.mjs MARK, via public/craft15/soul.json), 20 mm, 1.6 mm deep, strands and crescents
#           set with round brilliants between beads (soul-pave.json), on its cable chain with two bezel stations
#   ICON    the mark bent onto a fine round band (as /test4/'s model), strands set (icon-pave.json), the band's
#           front half set; it lies as a ring rests, on its band and the edge of its head
#   AURA    the pair of studs, the mark with its strands set, posts through the suede of their stand
#   MOMENT  the polished mark as a charm on a cable chain, open on the suede, lobster clasp at one end and the
#           SILAVU tag on its extension chain at the other (as the house's photographs show them)
# The prints are the house's photographs as small editorial cards (made by archive-prints.py into prints/).
# Each object carries its piece's id (pass_index and a custom property), so the page can take every piece as its own
# layer: replaced, clicked and moved on its own.
# Usage: blender -b -P archive-scene.py -- <out> <W> <H> <samples> <travel_mm|open> <d|m> <public_dir> <prints_dir> [mode]
#   mode  frame              the still (default): <out>.png and <out>.json (camera, floor)
#         plate              the same still with the jewellery taken out (the prints and the stand stay): what lies under
#                            a piece when it is lifted
#         masks              one sample, the object index: <out>/m<pid>_0001.png per piece (1 ICON, 2 SOUL, 3 AURA,
#                            4 MOMENT, 5-7 the prints), for the page's hover and click
#         hero:<pid>:x0,y0,x1,y1   one piece alone on transparent ground, from the same camera and in the same light (the
#                            rest is still there for the light, unseen by the camera), cropped to the border given as
#                            fractions of the frame (y up); W and H are the full frame at the hero's scale
#         seq:<N>:<i0>:<i1>  frames i0..i1 of N: the drawer travelling from closed to open, the camera easing from the
#                            closed cabinet to the still's camera; <out> is a pattern with #### for the frame
#         seq:<N>:<i0>:<i1>:u  the same, the frames spaced evenly in how far the move has gone (not in its time), so
#                            each is an equal step; the page adds its own gentle ease
import bpy, bmesh, math, os, sys, json, random, re
from mathutils import Vector, Matrix, Quaternion, Euler

argv = sys.argv[sys.argv.index("--") + 1:]
OUT, W, H, SAMPLES = argv[0], int(argv[1]), int(argv[2]), int(argv[3])
TRAVEL_ARG, LAYOUT, PUB, PRINTS = argv[4], argv[5], argv[6].rstrip("/") + "/", argv[7].rstrip("/") + "/"
MODE = argv[8] if len(argv) > 8 else "frame"
mm = lambda v: v / 1000
SOUL = json.load(open(PUB + "craft15/soul.json")); ICONPAVE = json.load(open(PUB + "archive15/icon-pave.json"))
MW = SOUL["W"]

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True; sc.cycles.denoiser = "OPENIMAGEDENOISE"
sc.cycles.max_bounces = 16; sc.cycles.glossy_bounces = 8; sc.cycles.transmission_bounces = 12; sc.cycles.diffuse_bounces = 4
sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False; sc.cycles.blur_glossy = .5; sc.cycles.sample_clamp_indirect = 8
sc.render.resolution_x = W; sc.render.resolution_y = H; sc.render.resolution_percentage = 100
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
sc.world = bpy.data.worlds.new("w"); sc.world.use_nodes = True; sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)
sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGB"; sc.render.image_settings.color_depth = "8"
def link(o, coll=None): (coll or sc.collection).objects.link(o); return o

# ═════════ materials
def principled(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; return m, m.node_tree.nodes["Principled BSDF"], m.node_tree
def lacquer():
    m, b, t = principled("lacquer"); N, L = t.nodes, t.links
    tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1, 16, 1); L.new(tc.outputs["Object"], mp.inputs[0])
    wave = N.new("ShaderNodeTexWave"); wave.inputs["Scale"].default_value = 11; wave.inputs["Distortion"].default_value = 8; wave.inputs["Detail"].default_value = 5; wave.inputs["Detail Roughness"].default_value = .62
    L.new(mp.outputs[0], wave.inputs[0])
    ramp = N.new("ShaderNodeValToRGB"); ramp.color_ramp.elements[0].color = (.011, .0062, .0042, 1); ramp.color_ramp.elements[1].color = (.026, .0145, .009, 1)
    L.new(wave.outputs["Fac"], ramp.inputs[0]); L.new(ramp.outputs[0], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = .35; b.inputs["Coat Weight"].default_value = 1.0; b.inputs["Coat IOR"].default_value = 1.52
    # the coat: smudges and the faintest orange peel, as a hand-rubbed lacquer has
    sm = N.new("ShaderNodeTexNoise"); sm.inputs["Scale"].default_value = 7; sm.inputs["Detail"].default_value = 6; L.new(tc.outputs["Object"], sm.inputs[0])
    sr = N.new("ShaderNodeMapRange"); sr.inputs["From Min"].default_value = .38; sr.inputs["From Max"].default_value = .72; sr.inputs["To Min"].default_value = .018; sr.inputs["To Max"].default_value = .085
    L.new(sm.outputs["Fac"], sr.inputs[0]); L.new(sr.outputs[0], b.inputs["Coat Roughness"])
    op = N.new("ShaderNodeTexNoise"); op.inputs["Scale"].default_value = 420; op.inputs["Detail"].default_value = 2; L.new(tc.outputs["Object"], op.inputs[0])
    bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = .025; bp.inputs["Distance"].default_value = .0002; L.new(op.outputs["Fac"], bp.inputs["Height"]); L.new(bp.outputs[0], b.inputs["Coat Normal"])
    return m
def suede(name, col, sheen=.8, nap=.12):
    m, b, t = principled(name); N, L = t.nodes, t.links
    b.inputs["Roughness"].default_value = 1.0; b.inputs["Sheen Weight"].default_value = sheen; b.inputs["Sheen Roughness"].default_value = .33; b.inputs["Sheen Tint"].default_value = (1, .96, .9, 1)
    b.inputs["Specular IOR Level"].default_value = .2
    tc = N.new("ShaderNodeTexCoord")
    fine = N.new("ShaderNodeTexNoise"); fine.inputs["Scale"].default_value = 3600; fine.inputs["Detail"].default_value = 4; L.new(tc.outputs["Object"], fine.inputs[0])
    pile = N.new("ShaderNodeTexVoronoi"); pile.inputs["Scale"].default_value = 1400; L.new(tc.outputs["Object"], pile.inputs[0])
    mx = N.new("ShaderNodeMath"); mx.operation = "MULTIPLY_ADD"; mx.inputs[1].default_value = .5; L.new(fine.outputs["Fac"], mx.inputs[0]); L.new(pile.outputs["Distance"], mx.inputs[2])
    bump = N.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = .45; bump.inputs["Distance"].default_value = .00035
    L.new(mx.outputs[0], bump.inputs["Height"]); L.new(bump.outputs[0], b.inputs["Normal"])
    # the nap: brushed streaks where the hand has passed, lighter and darker
    mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1, 5, 1); mp.inputs["Rotation"].default_value = (0, 0, .5); L.new(tc.outputs["Object"], mp.inputs[0])
    napn = N.new("ShaderNodeTexNoise"); napn.inputs["Scale"].default_value = 26; napn.inputs["Detail"].default_value = 3; napn.inputs["Distortion"].default_value = .8; L.new(mp.outputs[0], napn.inputs[0])
    mix = N.new("ShaderNodeMix"); mix.data_type = "RGBA"
    mix.inputs[6].default_value = (col[0] * (1 - nap), col[1] * (1 - nap), col[2] * (1 - nap), 1); mix.inputs[7].default_value = (col[0] * (1 + nap), col[1] * (1 + nap * .95), col[2] * (1 + nap * .85), 1)
    L.new(napn.outputs["Fac"], mix.inputs[0])
    # a few pale fibres caught on the surface
    lint = N.new("ShaderNodeTexVoronoi"); lint.inputs["Scale"].default_value = 140; L.new(tc.outputs["Object"], lint.inputs[0])
    lr = N.new("ShaderNodeMapRange"); lr.inputs["From Min"].default_value = .0; lr.inputs["From Max"].default_value = .012; lr.inputs["To Min"].default_value = .55; lr.inputs["To Max"].default_value = 0; lr.clamp = True
    L.new(lint.outputs["Distance"], lr.inputs[0])
    mix2 = N.new("ShaderNodeMix"); mix2.data_type = "RGBA"; mix2.inputs[7].default_value = (col[0] * 1.7, col[1] * 1.7, col[2] * 1.65, 1)
    L.new(lr.outputs[0], mix2.inputs[0]); L.new(mix.outputs[2], mix2.inputs[6]); L.new(mix2.outputs[2], b.inputs["Base Color"])
    return m
def steel():
    m, b, t = principled("steel"); b.inputs["Base Color"].default_value = (.8, .78, .74, 1); b.inputs["Metallic"].default_value = 1; b.inputs["Roughness"].default_value = .26; b.inputs["Anisotropic"].default_value = .75; return m
def flat(name, col, rough=.8):
    m, b, t = principled(name); b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Roughness"].default_value = rough; return m
LAC, SUEDE, STANDM, PIPE, STEEL, CAVE = lacquer(), suede("suede", (.25, .2, .152)), suede("stand", (.045, .032, .025), .55, .1), suede("piping", (.26, .205, .155), .7, .08), steel(), flat("cave", (.003, .0025, .002), .9)
GOLD, _gb, _ = principled("white gold"); _gb.inputs["Base Color"].default_value = (.87, .862, .845, 1); _gb.inputs["Metallic"].default_value = 1; _gb.inputs["Roughness"].default_value = .075
GOLDP, _gp, _ = principled("white gold polished"); _gp.inputs["Base Color"].default_value = (.88, .872, .855, 1); _gp.inputs["Metallic"].default_value = 1; _gp.inputs["Roughness"].default_value = .05
DIA, _d, _ = principled("diamond"); _d.inputs["Base Color"].default_value = (1, 1, 1, 1); _d.inputs["Roughness"].default_value = 0; _d.inputs["IOR"].default_value = 2.417; _d.inputs["Transmission Weight"].default_value = 1
if "Dispersion" in _d.inputs: _d.inputs["Dispersion"].default_value = .035

# ═════════ geometry helpers (millimetres inside each piece; the piece's root is scaled to metres)
def box(name, c, s, mat, bev=.0012, seg=3, parent=None):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co = Vector((v.co.x * s[0], v.co.y * s[1], v.co.z * s[2]))
    bm.to_mesh(me); bm.free(); o = link(bpy.data.objects.new(name, me)); o.location = c; me.materials.append(mat)
    if bev: md = o.modifiers.new("bev", "BEVEL"); md.width = bev; md.segments = seg; md.limit_method = "ANGLE"
    for p in me.polygons: p.use_smooth = True
    if parent: o.parent = parent
    return o
def root(name, pid=0):
    e = link(bpy.data.objects.new(name, None)); e.scale = (.001, .001, .001); e["piece"] = name; e["pid"] = pid; return e
def own(o, r):
    o.parent = r; o.pass_index = r["pid"]; o["piece"] = r["piece"]; return o

def mark_polys():
    d = SOUL["mark"]; tok = re.findall(r"[MCLZ]|-?\d*\.?\d+(?:e-?\d+)?", d, re.I); i = 0; cmd = ""; out = []; cur = None; pt = (0, 0)
    def n():
        nonlocal i; v = float(tok[i]); i += 1; return v
    while i < len(tok):
        if re.match("[MCLZ]", tok[i], re.I): cmd = tok[i].upper(); i += 1
        if cmd == "M":
            if cur: out.append(cur)
            pt = (n(), n()); cur = [pt]; cmd = "L"
        elif cmd == "L": pt = (n(), n()); cur.append(pt)
        elif cmd == "C":
            a = (n(), n()); b = (n(), n()); c = (n(), n())
            for k in range(1, 7):
                t = k / 6; u = 1 - t
                cur.append((u**3 * pt[0] + 3 * u * u * t * a[0] + 3 * u * t * t * b[0] + t**3 * c[0], u**3 * pt[1] + 3 * u * u * t * a[1] + 3 * u * t * t * b[1] + t**3 * c[1]))
            pt = c
        elif cmd == "Z": cmd = ""
        else: i += 1
    if cur: out.append(cur)
    return out
MARKP = mark_polys()

def mark_solid(name, s, depth, bev, mat, r):
    """the mark, filled (its gaps as drawn), extruded depth mm, edges rounded; bottom face at z = 0"""
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "2D"; cu.fill_mode = "BOTH"
    cu.extrude = (depth - 2 * bev) / 2; cu.bevel_depth = bev; cu.bevel_resolution = 5; cu.offset = -bev * .85
    for poly in MARKP:
        pts = poly[:-1] if poly[0] == poly[-1] else poly
        sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
        for k, (x, y) in enumerate(pts): sp.points[k].co = ((x - MW / 2) * s, (500 - y) * s, 0, 1)
        sp.use_cyclic_u = True
    o = link(bpy.data.objects.new(name, cu))
    bpy.context.view_layer.objects.active = o
    for x in bpy.context.selected_objects: x.select_set(False)
    o.select_set(True); bpy.ops.object.convert(target="MESH")
    o.data.transform(Matrix.Translation((0, 0, depth / 2)))
    o.data.materials.append(mat)
    for f in o.data.polygons: f.use_smooth = True
    md = o.modifiers.new("wn", "WEIGHTED_NORMAL"); md.keep_sharp = True
    return own(o, r)

def brilliant():
    R = math.radians; pts = []
    s = .54; c22 = math.cos(R(22.5)); rv = s / c22; tc = math.tan(R(34.5)); hc = (1 - rv) * tc; g = .03
    ra = s + .5 * (1 - s); ya = tc * (1 - ra * c22); tp = math.tan(R(40.75)); pd = tp * 1 + g; rq = .23; yq = -g - tp * (1 - rq)
    for k in range(8):
        f = R(k * 45); h = f + R(22.5)
        pts += [(rv * math.cos(f), rv * math.sin(f), hc), (ra * math.cos(h), ra * math.sin(h), ya), (rq * math.cos(h), rq * math.sin(h), yq)]
    for k in range(32):
        f = R(k * 11.25); pts += [(math.cos(f), math.sin(f), 0), (math.cos(f), math.sin(f), -g)]
    pts.append((0, 0, -pd))
    me = bpy.data.meshes.new("brilliant"); bm = bmesh.new(); vs = [bm.verts.new(p) for p in pts]
    bmesh.ops.convex_hull(bm, input=vs); bmesh.ops.dissolve_limit(bm, angle_limit=R(.5), verts=bm.verts, edges=bm.edges)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = False
    me.materials.append(DIA); return me
BRIL = brilliant()
SPH = bpy.data.meshes.new("bead"); _bm = bmesh.new(); bmesh.ops.create_uvsphere(_bm, u_segments=14, v_segments=9, radius=1); _bm.to_mesh(SPH); _bm.free(); SPH.materials.append(GOLD)
for p in SPH.polygons: p.use_smooth = True
def torus_mesh(name, R, r, sx=1.0, mat=None, seg=(26, 10)):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    U, V = seg; vs = []
    for i in range(U):
        a = i / U * 2 * math.pi
        for j in range(V):
            b = j / V * 2 * math.pi
            vs.append(bm.verts.new(((R + r * math.cos(b)) * math.cos(a) * sx, (R + r * math.cos(b)) * math.sin(a), r * math.sin(b))))
    for i in range(U):
        for j in range(V):
            bm.faces.new((vs[i * V + j], vs[((i + 1) % U) * V + j], vs[((i + 1) % U) * V + (j + 1) % V], vs[i * V + (j + 1) % V]))
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    me.materials.append(mat or GOLD); return me
def inst(name, me, r, loc, rot=None, scl=1.0):
    o = link(bpy.data.objects.new(name, me)); o.location = loc
    if rot is not None:
        o.rotation_mode = "QUATERNION"; o.rotation_quaternion = rot
    o.scale = (scl, scl, scl) if not isinstance(scl, tuple) else scl
    return own(o, r)

def pave(r, pave_list, s, depth, rnd):
    """the stones in the top face, each between beads, as the Blender SOUL model sets them"""
    P = lambda x, y: ((x - MW / 2) * s, (500 - y) * s)
    for i, (x, y, rr, a) in enumerate(pave_list):
        dd = rr * s * 2 * .98; p = P(x, y)
        inst("st", BRIL, r, (p[0], p[1], depth - .06 * dd), Euler((0, 0, rnd.random() * math.pi)).to_quaternion(), dd / 2)
    for i in range(1, len(pave_list)):
        x1, y1, r1, _ = pave_list[i - 1]; x2, y2, r2, _ = pave_list[i]
        if math.hypot(x2 - x1, y2 - y1) > 1.6 * (r1 + r2): continue
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2; ang = math.atan2(y2 - y1, x2 - x1); off = (r1 + r2) / 2 * .86; br = max(.035, (r1 + r2) / 2 * s * .2)
        for sg in (1, -1):
            p = P(mx - math.sin(ang) * off * sg, my + math.cos(ang) * off * sg); inst("bead", SPH, r, (p[0], p[1], depth + br * .15), None, br)

# ═════════ chains lying on the suede
def catmull(ps, n=40):
    ps = [ps[0]] + ps + [ps[-1]]; out = []
    for i in range(1, len(ps) - 2):
        p0, p1, p2, p3 = ps[i - 1], ps[i], ps[i + 1], ps[i + 2]
        for k in range(n):
            t = k / n; t2, t3 = t * t, t * t * t
            out.append(.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(ps[-2]); return out
def lying_path(pts2d, seed, wob=.8):
    """a chain as it lies: the curve through the given points, with the small kinks and waves a real chain settles
    into (smooth noise across the line, a few millimetres long), never a drawn arc"""
    path = catmull([Vector((p[0], p[1], 0)) for p in pts2d], 60)
    rnd = random.Random(seed); ph = [rnd.random() * 6.28 for _ in range(4)]
    L = [0.0]
    for i in range(1, len(path)): L.append(L[-1] + (path[i] - path[i - 1]).length)
    out = []
    for i, p in enumerate(path):
        t = (path[min(i + 1, len(path) - 1)] - path[max(i - 1, 0)]); t.z = 0; t.normalize(); nrm = Vector((-t.y, t.x, 0))
        s = L[i]; fade = min(1, s / 6, (L[-1] - s) / 6)
        off = wob * fade * (.6 * math.sin(s / 4.1 + ph[0]) + .3 * math.sin(s / 1.9 + ph[1]) + .25 * math.sin(s / 9.3 + ph[2]))
        out.append(p + nrm * off)
    return out
def chain(r, path, link_R=.42, link_r=.13, pitch=1.18, start=.9, stations=(), first_turn=0):
    """cable links along the path: alternately flat on the suede and standing on edge, a quarter turn apart"""
    me = torus_mesh("link", link_R, link_r, 1.42, GOLD, (20, 8))
    L = [0.0]
    for i in range(1, len(path)): L.append(L[-1] + (path[i] - path[i - 1]).length)
    s, k, j, X, placed = start, first_turn, 0, Vector((1, 0, 0)), []
    while s < L[-1]:
        while L[j + 1] < s: j += 1
        u = (s - L[j]) / max(1e-9, L[j + 1] - L[j]); p = path[j].lerp(path[j + 1], u); tg = (path[j + 1] - path[j]); tg.z = 0; tg.normalize()
        if any(abs(s - st) < 1.3 for st in stations):
            if any(abs(s - st) < .6 for st in stations): placed.append(p.copy())
        else:
            q = X.rotation_difference(tg); edge = k % 2 == 1
            if edge: q = q @ Quaternion(X, math.pi / 2)
            inst("link", me, r, (p.x, p.y, (link_R + link_r) if edge else link_r), q)
        s += pitch; k += 1
    cup = bpy.data.meshes.new("cup"); bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=1, radius2=1, depth=.9); bm.to_mesh(cup); bm.free(); cup.materials.append(GOLD)
    for pp in cup.polygons: pp.use_smooth = True
    for p in placed:
        inst("cup", cup, r, (p.x, p.y, .45)); inst("cst", BRIL, r, (p.x, p.y, .78), None, .78)
    return path[-1], (path[-1] - path[-4]).normalized()

# ═════════ the pieces
def build_soul(at, turn, arms, clasp_at):
    r = root("pave", 2); rnd = random.Random(7); S, DEPTH = .02, 1.6
    mark_solid("soul", S, DEPTH, .16, GOLD, r); pave(r, SOUL["pave"], S, DEPTH, rnd)
    rings = [((x - MW / 2) * S, (500 - y) * S) for x, y in SOUL["rings"]]
    jr = torus_mesh("jr", .62, .13, 1, GOLD)
    M = Matrix.Translation((at[0], at[1], 0)) @ Matrix.Rotation(math.radians(turn), 4, "Z")
    ends = []
    for k, (x, y) in enumerate(rings):
        inst("jr", jr, r, (x, y, .75), Euler((math.pi / 2, 0, (1 if k else -1) * .5)).to_quaternion())
        ends.append(M @ Vector((x + (-.9 if k == 0 else .9), y + .6, 0)))
    for o in [c for c in r.children]:
        o.matrix_basis = M @ o.matrix_basis
    for k, pts in enumerate(arms):
        path = lying_path([(ends[k].x, ends[k].y)] + pts, 11 + k)
        chain(r, path, stations=(24, 56))
    # the spring ring where the two ends meet, and the closing ring
    cx, cy = clasp_at
    inst("clasp", torus_mesh("spring", 1.0, .26, 1, GOLD), r, (cx, cy, .26))
    inst("cring", torus_mesh("cring", .7, .16, 1, GOLD), r, (cx + 1.9, cy + .4, .16))
    return r

def build_icon(at, turn):
    r = root("ring", 1); RC, RW, L, DEPTH = 9.4, .8, 11.2, 1.0; RTOP = RC + RW; S = L / 1000
    parts = []
    m = mark_solid("iconmark", S, DEPTH, .12, GOLD, r)
    bm = bmesh.new(); bm.from_mesh(m.data)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    for _ in range(7):
        long = [e for e in bm.edges if e.calc_length() > .32]
        if not long: break
        bmesh.ops.subdivide_edges(bm, edges=long, cuts=1, use_grid_fill=False); bmesh.ops.triangulate(bm, faces=bm.faces[:])
    for v in bm.verts:   # bend the flat mark onto the top of the band: u along it, v across, w up
        x, y, z = v.co; th = y / RTOP; rr = RTOP + (z - .15); v.co = Vector((x, rr * math.cos(th), rr * math.sin(th)))
    bm.to_mesh(m.data); bm.free(); m.data.update(); parts.append(m)
    th0 = (L / 2 - .6) / RTOP
    for sg in (1, -1):
        cu = bpy.data.curves.new("band", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = RW; cu.bevel_resolution = 6; cu.use_fill_caps = True
        sp = cu.splines.new("POLY"); n = 90; sp.points.add(n)
        for i in range(n + 1):
            a = sg * (th0 + (math.pi - th0) * i / n); sp.points[i].co = (0, RC * math.cos(a), RC * math.sin(a), 1)
        o = link(bpy.data.objects.new("band", cu)); o.data.materials.append(GOLD); own(o, r); parts.append(o)
    rnd = random.Random(3)
    for x, y, rr, _a in ICONPAVE:
        u, v, d = (500 - y) * S, (x - MW / 2) * S, rr * S * 2 * .96; th = u / RTOP; rad = RTOP + DEPTH + .02 - d * .18 - .15
        nrm = Vector((0, math.cos(th), math.sin(th)))
        inst("st", BRIL, r, (v, rad * math.cos(th), rad * math.sin(th)), Vector((0, 0, 1)).rotation_difference(nrm) @ Quaternion((0, 0, 1), rnd.random() * 3), d / 2)
    for sg in (1, -1):
        th = th0 + .13
        while th < th0 + 1.45:
            a = sg * th; nrm = Vector((0, math.cos(a), math.sin(a)))
            inst("st", BRIL, r, nrm * (RC + RW * .86), Vector((0, 0, 1)).rotation_difference(nrm), .56); th += 1.12 * 1.06 / (RC + RW)
    # laid down: axis upright, head towards the viewer, then tipped until the head's lower edge and the band's far
    # side both rest on the suede
    bpy.context.view_layer.update()
    base = Matrix(((0, 0, 1), (0, -1, 0), (1, 0, 0))).transposed().to_4x4()   # columns: x->z, y->-y, z->x
    def verts(objs):
        dg = bpy.context.evaluated_depsgraph_get(); out = []
        for o in objs:
            me = o.evaluated_get(dg).to_mesh(); mw = o.matrix_basis
            out += [mw @ v.co for v in me.vertices]; o.evaluated_get(dg).to_mesh_clear()
        return out
    head, band = verts([parts[0]]), verts(parts[1:])
    def low(vs, a): R = Matrix.Rotation(a, 4, "X") @ base; return min((R @ v).z for v in vs)
    a0, a1 = -1.3, 0.0
    for _ in range(36):
        a = (a0 + a1) / 2
        if low(head, a) - low(band, a) < 0: a1 = a
        else: a0 = a
    a = (a0 + a1) / 2; R = Matrix.Rotation(a, 4, "X") @ base; lo = min(low(head, a), low(band, a))
    M = Matrix.Translation((at[0], at[1], -lo + .02)) @ Matrix.Rotation(math.radians(turn), 4, "Z") @ R
    for o in list(r.children): o.matrix_basis = M @ o.matrix_basis
    return r

def build_aura(stand_xy, face_y, z0, gap):
    r = root("aura", 3); S, DEPTH = .0135, 1.4; rnd = random.Random(5)
    post = bpy.data.meshes.new("post"); bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=.42, radius2=.42, depth=9); bm.to_mesh(post); bm.free(); post.materials.append(GOLD)
    for k, sx in enumerate((-gap / 2, gap / 2)):
        e = link(bpy.data.objects.new("stud", None)); own(e, r)
        m = mark_solid("aura", S, DEPTH, .14, GOLD, r); m.parent = e
        before = set(r.children)
        pave(r, ICONPAVE, S, DEPTH, rnd)
        for o in set(r.children) - before:
            if o is not e: o.parent = e
        p = inst("post", post, r, (0, 0, -4.4)); p.parent = e
        # stood on the stand: the face towards the viewer (-y), the mark upright, the post through the suede
        e.location = (stand_xy[0] + sx, face_y - .12, z0); e.rotation_euler = (math.pi / 2, 0, (k - .5) * .05)
    return r

def build_moment(at, turn, arm_a, arm_b, ext):
    r = root("knot", 4); S, DEPTH = .0118, 1.35
    mark_solid("charm", S, DEPTH, .26, GOLDP, r)   # polished, as the photographs show it
    rings = [((x - MW / 2) * S, (500 - y) * S) for x, y in SOUL["rings"]]
    jr = torus_mesh("jr", .55, .12, 1, GOLD)
    M = Matrix.Translation((at[0], at[1], 0)) @ Matrix.Rotation(math.radians(turn), 4, "Z")
    ends = []
    for k, (x, y) in enumerate(rings):
        inst("jr", jr, r, (x, y, .67), Euler((math.pi / 2, 0, (1 if k else -1) * .5)).to_quaternion())
        ends.append(M @ Vector((x + (-.8 if k == 0 else .8), y + .5, 0)))
    for o in list(r.children): o.matrix_basis = M @ o.matrix_basis
    # one side to the lobster clasp
    pa = lying_path([(ends[0].x, ends[0].y)] + arm_a, 21, .45); end_a, dir_a = chain(r, pa, .36, .11, 1.0)
    q = Vector((1, 0, 0)).rotation_difference(dir_a)
    lob = bpy.data.meshes.new("lobster"); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=14, radius=1)
    for v in bm.verts:
        x, y, z = v.co; t = (x + 1) / 2; v.co = Vector((x * 2.3, y * (1.0 - .35 * t) * 1.15, z * .62 * (1.0 - .25 * t)))
    bm.to_mesh(lob); bm.free(); lob.materials.append(GOLDP)
    for pp in lob.polygons: pp.use_smooth = True
    inst("lobster", lob, r, end_a + dir_a * 2.6 + Vector((0, 0, .72)), q)
    inst("lring", torus_mesh("lring", .55, .13, 1, GOLD), r, end_a + dir_a * .4 + Vector((0, 0, .14)))
    inst("gate", torus_mesh("gate", .9, .1, 1.6, GOLDP), r, end_a + dir_a * 3.0 + Vector((0, 0, .95)), q)
    # the other side, its end ring, the extension chain and the tag
    pb = lying_path([(ends[1].x, ends[1].y)] + arm_b, 22, .45); end_b, dir_b = chain(r, pb, .36, .11, 1.0)
    inst("ering", torus_mesh("ering", .9, .17, 1, GOLD), r, end_b + dir_b * .9 + Vector((0, 0, .17)))
    pe = lying_path([(end_b.x + dir_b.x * 1.9, end_b.y + dir_b.y * 1.9)] + ext, 23, .3); end_e, dir_e = chain(r, pe, .3, .09, .82)
    tag = bpy.data.meshes.new("tag"); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co = Vector((v.co.x * 8.6, v.co.y * 3.1, v.co.z * .55))
    bm.to_mesh(tag); bm.free(); satin, _sb, _ = principled("white gold satin"); _sb.inputs["Base Color"].default_value = (.86, .852, .835, 1); _sb.inputs["Metallic"].default_value = 1; _sb.inputs["Roughness"].default_value = .24
    tag.materials.append(satin)
    to = inst("tag", tag, r, end_e + dir_e * 5.4 + Vector((0, 0, .28)), Vector((1, 0, 0)).rotation_difference(dir_e))
    bv = to.modifiers.new("b", "BEVEL"); bv.width = .14; bv.segments = 3
    inst("tring", torus_mesh("tring", .55, .12, 1, GOLD), r, end_e + dir_e * .6 + Vector((0, 0, .12)))
    # the engraving: SILAVU, as the tag carries it
    tc = bpy.data.curves.new("eng", "FONT"); tc.body = "SILAVU"; tc.size = 1.0; tc.space_character = 1.3; tc.align_x = "CENTER"; tc.align_y = "CENTER"; tc.extrude = .2
    try: tc.font = bpy.data.fonts.load(PUB + "fonts/jost-normal-latin-b58a58.woff2")   # the house's Jost
    except Exception: pass
    txt = link(bpy.data.objects.new("eng", tc)); own(txt, r); txt.matrix_basis = to.matrix_basis @ Matrix.Translation((.5, 0, .28))
    bpy.context.view_layer.update()
    bo = to.modifiers.new("e", "BOOLEAN"); bo.operation = "DIFFERENCE"; bo.object = txt; txt.hide_render = True; txt.display_type = "WIRE"
    return r

# ═════════ the prints
def build_print(name, img, at, turn, z, pid):
    r = root("print-" + name, pid)
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=10, y_subdivisions=26, size=1, calc_uvs=True)
    o = bpy.context.active_object; o.name = "print-" + name
    for v in o.data.vertices:
        x, y = v.co.x * 38, v.co.y * 59; yy = abs(y) / 29.5; xx = x / 19
        v.co = Vector((x, y, .32 * yy ** 3 + .08 * xx * xx + .04 * math.sin(y / 9)))
    sd = o.modifiers.new("t", "SOLIDIFY"); sd.thickness = .3; sd.offset = 1
    bv = o.modifiers.new("b", "BEVEL"); bv.width = .06; bv.segments = 2; bv.limit_method = "ANGLE"
    m, b, t = principled("paper-" + name); N, L = t.nodes, t.links
    tx = N.new("ShaderNodeTexImage"); tx.image = bpy.data.images.load(PRINTS + img + ".png"); L.new(tx.outputs[0], b.inputs["Base Color"])
    rx = N.new("ShaderNodeTexImage"); rx.image = bpy.data.images.load(PRINTS + img + "-rough.png"); rx.image.colorspace_settings.name = "Non-Color"
    rr = N.new("ShaderNodeMapRange"); rr.inputs["To Min"].default_value = .18; rr.inputs["To Max"].default_value = .82; L.new(rx.outputs[0], rr.inputs[0]); L.new(rr.outputs[0], b.inputs["Roughness"])
    b.inputs["Coat Weight"].default_value = .15; b.inputs["Coat Roughness"].default_value = .25
    pn = N.new("ShaderNodeTexNoise"); pn.inputs["Scale"].default_value = 900; bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = .05
    L.new(pn.outputs["Fac"], bp.inputs["Height"]); L.new(bp.outputs[0], b.inputs["Normal"])
    o.data.materials.append(m)
    for f in o.data.polygons: f.use_smooth = True
    o.location = (at[0], at[1], z); o.rotation_euler = (0, 0, math.radians(turn)); own(o, r)
    return r

# ═════════ the layouts: desktop (a wide drawer, seen from the front) and phone (a deep drawer, seen from above)
if LAYOUT == "d":
    IX, IY = 214, 150
    LAY = dict(
        stand=(-70, 44), prints=[("moment", "moment", (68, 20), 9, .0, 7), ("soul", "soul", (51, 32), 2, .5, 6), ("icon", "icon", (31, 43), -6, 1.0, 5)],
        soul=dict(at=(-20, -18), turn=-5, arms=[[(-33, -11), (-41, 2), (-47, 18), (-44, 33), (-37, 45), (-27, 53), (-20, 56)], [(-5, -11), (1, 2), (4, 17), (6, 30), (1, 43), (-9, 52), (-16, 56)]], clasp=(-18, 57)),
        ring=dict(at=(-68, -24), turn=-6),
        moment=dict(at=(46, -30), turn=7, a=[(31, -35), (21, -43), (11, -41), (5, -33), (6, -22)], b=[(61, -33), (73, -38), (85, -33), (92, -21), (94, -9)], ext=[(95, -2), (96, 3)]))
    CAM = dict(tgt=(2, 0, 2), dist=470, elev=55, lens=70)
else:
    IX, IY = 124, 220
    LAY = dict(
        stand=(-33, 4), prints=[("icon", "icon", (-32, 64), -5, 0, 5), ("soul", "soul", (-6, 72), 2, .5, 6), ("moment", "moment", (20, 80), 7, 1.0, 7)],   # the stand forward of the ICON print, so its caption shows over the tablet
        soul=dict(at=(14, -16), turn=-6, arms=[[(4, -8), (-2, 6), (-4, 20), (2, 30), (10, 34)], [(24, -9), (31, 4), (33, 18), (28, 29), (18, 34)]], clasp=(14, 35)),
        ring=dict(at=(-32, -42), turn=-4),
        moment=dict(at=(16, -80), turn=-4, a=[(3, -84), (-7, -90), (-15, -86), (-17, -76), (-12, -67)], b=[(29, -84), (40, -88), (48, -80), (50, -68), (45, -58)], ext=[(40, -53), (37, -50)]))
    CAM = dict(tgt=(0, -4, 2), dist=292, elev=64, lens=50)

PT, WT, BT, LT = 5, 12, 10, 4
DW, DD, DH = IX + 2 * PT + 2 * WT, IY + 2 * PT + 2 * WT, 46
TRAVEL_OPEN = DD - 34
TRAVEL = TRAVEL_OPEN if TRAVEL_ARG == "open" else float(TRAVEL_ARG)
drawer = link(bpy.data.objects.new("drawer", None))
def dbox(name, c, s, mat, bev=1.2, seg=3):
    return box(name, (mm(c[0]), mm(c[1]), mm(c[2])), (mm(s[0]), mm(s[1]), mm(s[2])), mat, mm(bev), seg, drawer)
dbox("bottom", (0, DD / 2, BT / 2), (DW, DD, BT), LAC)
dbox("wl", (-DW / 2 + WT / 2, DD / 2, DH / 2), (WT, DD, DH), LAC, 1.8, 4); dbox("wr", (DW / 2 - WT / 2, DD / 2, DH / 2), (WT, DD, DH), LAC, 1.8, 4)
dbox("wb", (0, DD - WT / 2, DH / 2), (DW, WT, DH), LAC, 1.8, 4); dbox("wf", (0, WT / 2, DH / 2), (DW, WT, DH), LAC, 1.8, 4)
FT, FH = 22, 66
dbox("front", (0, -FT / 2, DH / 2 + 4), (DW + 28, FT, FH), LAC, 2.4, 5)
dbox("inlay", (0, -FT - .2, DH / 2 + 4 + FH / 2 - 7), (DW + 12, .6, 1.4), STEEL, 0)
dbox("pull", (0, -FT - 9, DH / 2 + 2), (min(118, DW * .42), 7, 9), STEEL, 2, 4)
for x in (-min(118, DW * .42) / 2 + 13, min(118, DW * .42) / 2 - 13): dbox("post", (x, -FT - 3, DH / 2 + 2), (6, 7, 6), STEEL, .8)
for sx in (-1, 1): dbox("runner", (sx * (DW / 2 + 2.5), DD / 2, DH * .45), (5, DD - 8, 14), STEEL, .5)
IW, ID = DW - 2 * WT, DD - 2 * WT
dbox("floor", (0, DD / 2, BT + LT / 2), (IW, ID, LT), SUEDE, 1.5, 4)
PH = DH - BT - 3
dbox("pl", (-IW / 2 + PT / 2, DD / 2, BT + PH / 2), (PT, ID, PH), SUEDE, 2.2, 5); dbox("pr", (IW / 2 - PT / 2, DD / 2, BT + PH / 2), (PT, ID, PH), SUEDE, 2.2, 5)
dbox("pb", (0, DD - WT - PT / 2, BT + PH / 2), (IW, PT, PH), SUEDE, 2.2, 5); dbox("pf", (0, WT + PT / 2, BT + PH / 2), (IW, PT, PH), SUEDE, 2.2, 5)
# the welt that finishes the lining along its top edges
for (c, s) in [((-IW / 2 + PT / 2, DD / 2, BT + PH + .9), (PT + 1, ID, 1.8)), ((IW / 2 - PT / 2, DD / 2, BT + PH + .9), (PT + 1, ID, 1.8)),
               ((0, DD - WT - PT / 2, BT + PH + .9), (IW, PT + 1, 1.8)), ((0, WT + PT / 2, BT + PH + .9), (IW, PT + 1, 1.8))]:
    dbox("welt", c, s, PIPE, .85, 4)
FLOOR = BT + LT
# the cabinet
OW, OZ0, OZ1 = DW + 36, -6, DH + 10; CW = OW + 170
for nm, c, s in [("rail_top", (0, 9, OZ1 + 60), (CW, 18, 120)), ("rail_bot", (0, 9, OZ0 - 80), (CW, 18, 160))]:
    box(nm, (mm(c[0]), mm(c[1]), mm(c[2])), (mm(s[0]), mm(s[1]), mm(s[2])), LAC, mm(2))
for sx in (-1, 1): box("stile", (mm(sx * (OW / 2 + (CW - OW) / 4)), mm(9), mm((OZ0 + OZ1) / 2)), (mm((CW - OW) / 2), mm(18), mm(OZ1 - OZ0 + 2)), LAC, mm(2))
box("top", (0, mm(DD * .9), mm(OZ1 + 129)), (mm(CW + 10), mm(DD * 1.8), mm(18)), LAC, mm(2.5))
box("cave", (0, mm(DD * .9 + 20), mm((OZ0 + OZ1) / 2)), (mm(OW + 10), mm(DD * 1.8), mm(OZ1 - OZ0 + 30)), CAVE, 0)

# the stand for the earrings: a base and an upright tablet, dark suede
SX, SY = LAY["stand"]; SY0 = DD / 2 + SY
dbox("standbase", (SX, SY0, FLOOR + 4), (40, 26, 8), STANDM, 2.6, 5)
dbox("standup", (SX, SY0 + 3, FLOOR + 8 + 15), (34, 7, 30), STANDM, 3.2, 6)
FACE_Y = SY0 + 3 - 3.5

# everything that lies in the drawer: built in millimetres on the floor, then carried by the drawer
pieces = []
L1 = LAY["soul"]; pieces.append(build_soul(L1["at"], L1["turn"], L1["arms"], L1["clasp"]))
L2 = LAY["ring"]; pieces.append(build_icon(L2["at"], L2["turn"]))
pieces.append(build_aura((SX, SY), SY + 3 - 3.5, FLOOR + 8 + 21 - FLOOR, 15.5))
L4 = LAY["moment"]; pieces.append(build_moment(L4["at"], L4["turn"], L4["a"], L4["b"], L4["ext"]))
for name, img, at, turn, z, pid in LAY["prints"]: pieces.append(build_print(name, img, at, turn, .02 + z, pid))
floor_root = link(bpy.data.objects.new("floor", None)); floor_root.location = (0, mm(DD / 2), mm(FLOOR)); floor_root.parent = drawer
for p in pieces:
    if p["piece"] == "aura":   # the studs are placed in the stand's frame (y measured from the floor's centre too)
        pass
    p.parent = floor_root
drawer.location = (0, -mm(TRAVEL), 0)

# the jewellery, as one collection (for the lamps only the metal and the stones should see)
JEWELS = bpy.data.collections.new("jewels")
for p in pieces:
    if not p["piece"].startswith("print"):
        for o in p.children_recursive:
            if o.type in ("MESH", "CURVE"): JEWELS.objects.link(o)
# ═════════ light: a museum installation. A soft wash, a pin spot on each piece (its own pool, its sparkle), rims for
# the lacquer, and unseen white panels above for the white gold to reflect
ICY = mm(DD / 2 - TRAVEL_OPEN); FZ = mm(FLOOR)
def W2(p):   # floor millimetres to world metres
    return Vector((mm(p[0]), ICY + mm(p[1]), FZ + mm(p[2] if len(p) > 2 else 0)))
def light(kind, loc, energy, aim=None, **kw):
    d = bpy.data.lights.new(kind + str(len(bpy.data.lights)), kind); d.energy = energy
    for k, v in kw.items(): setattr(d, k, v)
    o = link(bpy.data.objects.new(d.name, d)); o.location = loc
    if aim is not None: o.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return o
WARM = (1, .9, .78); NEUT = (1, .95, .88)
light("SPOT", W2((-30, -120, 640)), .75, W2((0, 0)), spot_size=math.radians(50), spot_blend=1.0, shadow_soft_size=mm(70), color=WARM)
for key, at, z in [("pave", LAY["soul"]["at"], 0), ("ring", LAY["ring"]["at"], 0), ("knot", LAY["moment"]["at"], 0), ("aura", (SX, SY), 22), ("prints", LAY["prints"][1][2], 0)]:
    pw = {"pave": 3.6, "ring": 3.0, "knot": 3.4, "aura": 2.8, "prints": .7}[key]
    light("SPOT", W2((at[0] - 50, at[1] - 120, 430)), pw, W2((at[0], at[1], z)), spot_size=math.radians(8.5 if key != "prints" else 16), spot_blend=.85, shadow_soft_size=mm(18), color=NEUT)
light("AREA", W2((0, -700, 240)), .18, W2((0, 0, 40)), size=mm(600), color=NEUT)
light("AREA", W2((-520, 420, 520)), .9, W2((0, 0, 0)), size=mm(260), color=NEUT)
light("AREA", W2((540, 380, 480)), .6, W2((0, 0, 0)), size=mm(220), color=NEUT)
light("AREA", Vector((0, mm(40), mm(OZ1 + 40))), .3, W2((0, 0, 0)), size=mm(240), color=WARM)
def panel(loc, size, strength, aim):
    bpy.ops.mesh.primitive_plane_add(size=size, location=loc); o = bpy.context.active_object
    o.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat("Z", "Y").to_euler()
    m = bpy.data.materials.new("panel"); m.use_nodes = True; nt = m.node_tree; nt.nodes.remove(nt.nodes["Principled BSDF"])
    e = nt.nodes.new("ShaderNodeEmission"); e.inputs["Strength"].default_value = strength; e.inputs["Color"].default_value = (1, .97, .93, 1); nt.links.new(e.outputs[0], nt.nodes["Material Output"].inputs[0])
    o.data.materials.append(m); o.visible_camera = False; o.visible_diffuse = False; o.visible_shadow = False; o.visible_volume_scatter = False
    return o
panel(W2((0, -260, 520)), mm(520), 3.6, W2((0, 0)))
panel(W2((0, -560, 190)), mm(420), 4.5, W2((SX, SY, 25)))
panel(W2((SX, SY - 200, 260)), mm(220), 3.0, W2((SX, SY, 25)))      # low in front, unseen: what the standing studs look into
light("SPOT", W2((SX - 30, SY - 280, 170)), 1.6, W2((SX, SY, 26)), spot_size=math.radians(9), spot_blend=.8, shadow_soft_size=mm(25), color=NEUT)
# small hot lamps that only the metal and the stones see: the glints of pavé under real lights
for i in range(12):
    a = i * 2.399; zz = .45 + .5 * ((i * .618) % 1); rr = math.sqrt(1 - zz * zz)
    l = bpy.data.lights.new(f"spark{i}", "POINT"); l.energy = .9; l.shadow_soft_size = mm(1.5); l.color = NEUT
    o = link(bpy.data.objects.new(f"spark{i}", l)); o.location = W2((math.cos(a) * rr * 520, 140 + abs(math.sin(a)) * rr * 420, zz * 520))
    o.visible_diffuse = False
    o.light_linking.receiver_collection = JEWELS   # only the jewellery receives them: no glint in the lacquer
panel(W2((-380, 120, 300)), mm(300), 2.4, W2((0, 0)))
panel(W2((360, 60, 320)), mm(280), 2.0, W2((0, 0)))

# ═════════ camera
cd = bpy.data.cameras.new("cam"); cam = link(bpy.data.objects.new("cam", cd)); sc.camera = cam
tgt = W2(CAM["tgt"]); e = math.radians(CAM["elev"]); dist = mm(CAM["dist"])
cam.location = tgt + Vector((0, -math.cos(e) * dist, math.sin(e) * dist)); cam.rotation_euler = (tgt - cam.location).to_track_quat("-Z", "Y").to_euler()
# ARCH_OVER (default 1): render a wider and taller view around the same picture. W and H are then the overscanned size and
# the approved frame is exactly the middle W/OVER x H/OVER of it (same camera, same pixel scale)
OVER = float(os.environ.get("ARCH_OVER", "1"))
cd.lens = CAM["lens"]; cd.sensor_width = 36 * OVER; cd.sensor_fit = "AUTO"; cd.clip_start = .005; cd.clip_end = 10
cd.dof.use_dof = True; cd.dof.focus_distance = (tgt - cam.location).length; cd.dof.aperture_fstop = 7.1

# ═════════ the modes
def jewellery():
    return [o for p in pieces if not p["piece"].startswith("print") for o in p.children_recursive]
def write_meta(path):
    bpy.context.view_layer.update()
    json.dump({ "res": [W, H], "lens": cd.lens, "sensor": cd.sensor_width, "fit": "AUTO", "cam": [list(r) for r in cam.matrix_world], "travel_mm": TRAVEL,
      "floor": { "y": ICY, "z": FZ, "w": mm(IX), "d": mm(IY) } }, open(path, "w"), indent=1)

# The cabinet's lacquered rail mirrors whatever lies in front of it: the pieces as the drawer comes out, and the pieces and
# prints in any view wide enough to show the rail (a mirrored knot among them). Where that can be seen, a piece or print is
# clear to any reflection ray that has travelled more than 30 mm to reach it: the rail sees the drawer without them, while
# each piece's reflections of itself and its contact with the suede (all well inside 30 mm) are untouched.
def no_mirrors():
    mine = {o for p in pieces for o in p.children_recursive if o.type in ("MESH", "CURVE")}
    users = {}
    for o in sc.objects:
        for s in getattr(o, "material_slots", []):
            if s.material: users.setdefault(s.material.name, set()).add(o)
    done = {}
    for o in mine:
        for s in o.material_slots:
            m = s.material
            if not m or not m.use_nodes: continue
            if m.name not in done:
                mm_ = m if users.get(m.name, set()) <= mine else m.copy()
                t_ = mm_.node_tree; out = next(n for n in t_.nodes if n.type == "OUTPUT_MATERIAL" and n.is_active_output)
                if out.inputs["Surface"].links:
                    src = out.inputs["Surface"].links[0].from_socket
                    lp = t_.nodes.new("ShaderNodeLightPath"); far = t_.nodes.new("ShaderNodeMath"); far.operation = "GREATER_THAN"; far.inputs[1].default_value = mm(30)
                    t_.links.new(lp.outputs["Ray Length"], far.inputs[0])
                    gl = t_.nodes.new("ShaderNodeMath"); gl.operation = "MULTIPLY"; t_.links.new(lp.outputs["Is Glossy Ray"], gl.inputs[0]); t_.links.new(far.outputs[0], gl.inputs[1])
                    tr = t_.nodes.new("ShaderNodeBsdfTransparent"); mx = t_.nodes.new("ShaderNodeMixShader")
                    t_.links.new(gl.outputs[0], mx.inputs[0]); t_.links.new(src, mx.inputs[1]); t_.links.new(tr.outputs[0], mx.inputs[2]); t_.links.new(mx.outputs[0], out.inputs["Surface"])
                done[m.name] = mm_
            s.material = done[m.name]

if MODE == "frame":
    if OVER > 1: no_mirrors()
    sc.render.filepath = OUT; bpy.ops.render.render(write_still=True); write_meta(OUT.rsplit(".", 1)[0] + ".json")
elif MODE == "plate":
    if OVER > 1: no_mirrors()
    for o in jewellery(): o.hide_render = True
    sc.render.filepath = OUT; bpy.ops.render.render(write_still=True)
elif MODE == "masks":
    sc.cycles.samples = 1; sc.cycles.use_denoising = False
    bpy.context.view_layer.use_pass_object_index = True
    sc.use_nodes = True; tree = sc.node_tree
    for n in list(tree.nodes): tree.nodes.remove(n)
    rl = tree.nodes.new("CompositorNodeRLayers"); fo = tree.nodes.new("CompositorNodeOutputFile"); fo.base_path = OUT
    fo.format.file_format = "PNG"; fo.format.color_mode = "BW"; fo.file_slots.clear()
    for pid in range(1, 8):
        idm = tree.nodes.new("CompositorNodeIDMask"); idm.index = pid; idm.use_antialiasing = True
        tree.links.new(rl.outputs["IndexOB"], idm.inputs[0]); fo.file_slots.new(f"m{pid}_"); tree.links.new(idm.outputs[0], fo.inputs[-1])
    comp = tree.nodes.new("CompositorNodeComposite"); tree.links.new(rl.outputs["Image"], comp.inputs[0])
    sc.render.filepath = OUT.rstrip("/") + "/beauty.png"; bpy.ops.render.render(write_still=True)
elif MODE.startswith("hero:"):
    _, pid, box_ = MODE.split(":"); pid = int(pid); x0, y0, x1, y1 = [float(v) for v in box_.split(",")]
    target = [p for p in pieces if p["pid"] == pid][0]; keep = set(target.children_recursive)
    for o in sc.objects:
        if o.type in ("MESH", "CURVE", "FONT") and o not in keep: o.visible_camera = False
    # the studs keep their stand as an invisible mask: what it hides in the drawer (the posts) stays hidden
    if pid == 3:
        for o in sc.objects:
            if o.name.startswith("stand"): o.visible_camera = True; o.is_holdout = True
    cd.dof.use_dof = False   # a piece brought forward is seen in focus
    sc.render.film_transparent = True; sc.render.image_settings.color_mode = "RGBA"
    sc.render.use_border = True; sc.render.use_crop_to_border = True
    sc.render.border_min_x, sc.render.border_min_y, sc.render.border_max_x, sc.render.border_max_y = x0, y0, x1, y1
    sc.render.filepath = OUT; bpy.ops.render.render(write_still=True)
elif MODE.startswith("seq:"):
    _, N, i0, i1, *spc = MODE.split(":"); N, i0, i1 = int(N), int(i0), int(i1); even = spc == ["u"]
    tgt_f, dist_f, el_f = tgt.copy(), dist, e
    tgt_s = Vector((0, -mm(FT) - mm(30), mm(DH * .55))); dist_s = dist_f * 1.55; el_s = el_f - math.radians(17)
    sm = lambda x: x * x * x * (x * (x * 6 - 15) + 10)
    no_mirrors()
    for i in range(i0, i1 + 1):
        t = i / (N - 1)
        if even:   # the time at which the move has gone i/(N-1) of the way (smootherstep inverted, by halving)
            lo, hi = 0.0, 1.0
            for _ in range(50): mid = (lo + hi) / 2; lo, hi = (mid, hi) if sm(mid) < t else (lo, mid)
            t = (lo + hi) / 2
        u = sm(t)
        drawer.location = (0, -mm(TRAVEL_OPEN * sm(min(1, t * 1.06))), 0)
        tg = tgt_s.lerp(tgt_f, u); dd = dist_s + (dist_f - dist_s) * u; el = el_s + (el_f - el_s) * u
        cam.location = tg + Vector((0, -math.cos(el) * dd, math.sin(el) * dd)); cam.rotation_euler = (tg - cam.location).to_track_quat("-Z", "Y").to_euler()
        cd.dof.focus_distance = dd
        sc.render.filepath = OUT.replace("####", "%04d" % i); bpy.ops.render.render(write_still=True)
print("DONE", OUT, MODE)
