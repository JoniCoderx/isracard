# The SILAVU line, modelled for the pages: diamonds of eight cuts (round,
# oval, cushion, princess, emerald, marquise, pear, baguette) built facet by
# facet as convex hulls, and the emerald-cut line bracelet in white gold with
# four-prong baskets, links and a box clasp.
#
#   seq  <out_dir> <frames> <w> <h> <samples>
#        the bracelet falling away from the camera: tilting, turning and
#        descending, one transparent PNG per frame (/test13/'s signature)
#   cut  <name> <out.png> <w> <h> <samples>
#        one stone, close, on a transparent ground (the builder's close-up)
#
# Usage: blender -b -P line-blender.py -- <mode> ...
import bpy, bmesh, math, sys, os
from mathutils import Vector, Matrix, Euler

argv = sys.argv[sys.argv.index("--") + 1:]
MODE = argv[0]
R = math.radians
sc = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)

# ── materials
def principled(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    return m, m.node_tree.nodes["Principled BSDF"]
gold, gb = principled("white gold")
gb.inputs["Base Color"].default_value = (0.90, 0.90, 0.905, 1); gb.inputs["Metallic"].default_value = 1.0; gb.inputs["Roughness"].default_value = 0.06
dia, db = principled("diamond")
db.inputs["Base Color"].default_value = (1, 1, 1, 1); db.inputs["Roughness"].default_value = 0.0; db.inputs["IOR"].default_value = 2.417
db.inputs["Transmission Weight"].default_value = 1.0
if "Dispersion" in db.inputs: db.inputs["Dispersion"].default_value = 0.045

def hull(name, pts, mat):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [bm.verts.new(p) for p in pts]
    bmesh.ops.convex_hull(bm, input=vs)
    bmesh.ops.dissolve_limit(bm, angle_limit=R(0.4), verts=bm.verts, edges=bm.edges)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = False
    me.materials.append(mat); return me

# ── outlines: the girdle of each shape as a radius for every direction, longest extent 1
def polar_from_poly(poly):
    pol = sorted((math.atan2(y, x) % (2 * math.pi), math.hypot(x, y)) for x, y in poly)
    def r(a):
        a %= 2 * math.pi
        for i in range(len(pol)):
            a0, r0 = pol[i - 1]; a1, r1 = pol[i]
            if i == 0: a0 -= 2 * math.pi
            if a0 <= a <= a1: t = (a - a0) / max(1e-9, a1 - a0); return r0 + (r1 - r0) * t
        return pol[0][1]
    return r
def outline(shape):
    if shape == "round": return lambda a: 1.0
    if shape == "oval": return lambda a: 1 / math.sqrt((math.cos(a) / 1) ** 2 + (math.sin(a) / .70) ** 2)
    if shape == "cushion": return lambda a: (abs(math.cos(a)) ** 3.4 / 1 + abs(math.sin(a)) ** 3.4 / .93 ** 3.4) ** (-1 / 3.4)
    if shape == "princess": return lambda a: (abs(math.cos(a)) ** 14 + abs(math.sin(a)) ** 14) ** (-1 / 14) * .78
    if shape == "marquise":
        h = .5; Rr = (1 + h * h) / (2 * h)
        poly = [(x, s * (math.sqrt(max(0, Rr * Rr - x * x)) - (Rr - h))) for s in (1, -1) for x in [i / 60 - 1 for i in range(121)]]
        return polar_from_poly(poly)
    if shape == "pear":
        poly = []
        for i in range(240):
            t = i / 240 * 2 * math.pi; x = math.cos(t); y = .64 * math.sin(t) * ((1 - math.cos(t)) / 2) ** .38
            poly.append((x * .98 - .08, y))
        return polar_from_poly(poly)
    raise ValueError(shape)

def brilliant(shape):
    """a modern brilliant: table, star and bezel facets, 32 girdle facets, pavilion mains to the culet; a fancy shape is the round bent to its outline"""
    rr = outline(shape); pts = []
    s = 0.55; c22 = math.cos(R(22.5)); rv = s / c22; tc = math.tan(R(34.5)); hc = (1 - rv) * tc; g = 0.025
    ra = s + 0.5 * (1 - s); ya = tc * (1 - ra * c22)
    tp = math.tan(R(40.75)); pd = tp * 1 + g; rq = 0.24; yq = -g - tp * (1 - rq)
    P = lambda rad, a, z: (rad * rr(a) * math.cos(a), rad * rr(a) * math.sin(a), z * (0.92 if shape != "round" else 1))
    for k in range(8):
        f = R(k * 45); h = f + R(22.5)
        pts += [P(rv, f, hc), P(ra, h, ya), P(rq, h, yq)]
    for k in range(64):
        f = R(k * 5.625); pts += [P(1, f, 0), P(1, f, -g)]
    if shape in ("marquise", "pear", "oval"):
        # a short keel instead of a point, as the elongated stones are cut
        pts += [P(.12, 0, -pd), P(.12, math.pi, -pd)]
    else: pts.append((0, 0, -pd))
    return pts

def stepcut(L, W, corner):
    """an emerald (corner > 0) or baguette (corner 0) step cut: three steps up to the table, three down to a keel"""
    def ring(sx, sy, z):
        c = corner * min(sx, sy)
        hx, hy = sx / 2, sy / 2
        if c <= 0: return [(hx, hy, z), (-hx, hy, z), (-hx, -hy, z), (hx, -hy, z)]
        return [(hx, hy - c, z), (hx - c, hy, z), (-hx + c, hy, z), (-hx, hy - c, z), (-hx, -hy + c, z), (-hx + c, -hy, z), (hx - c, -hy, z), (hx, -hy + c, z)]
    pts = ring(L, W, 0) + ring(L, W, -0.02 * W)
    for k, (f, z) in enumerate([(0.93, 0.05), (0.85, 0.10), (0.76, 0.14)]):
        pts += ring(L - (1 - f) * W, W * f, z * W)
    for f, z in [(0.80, -0.20), (0.58, -0.40), (0.34, -0.56)]:
        pts += ring(L - (1 - f) * W, W * f, z * W)
    kl = max(0.05, (L - W) * 0.5 + 0.08 * W)
    pts += [(kl / 2, 0, -0.66 * W), (-kl / 2, 0, -0.66 * W)]
    return pts

def stone_mesh(cut, L=1.0, W=None):
    if cut == "emerald": return hull("emerald", stepcut(L, W or L * .72, .22), dia)
    if cut == "baguette": return hull("baguette", stepcut(L, W or L * .38, 0), dia)
    pts = brilliant(cut)
    return hull(cut, [(x * L / 2, y * L / 2, z * L / 2) for x, y, z in pts], dia)

def obj(name, me, loc=(0, 0, 0), rot=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o); o.location = loc; o.rotation_euler = rot
    if parent: o.parent = parent
    return o

def cyl(name, r, depth, seg=16):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=depth)
    bm.to_mesh(me); bm.free(); me.materials.append(gold)
    for p in me.polygons: p.use_smooth = True
    return me
def ball(name, r):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r)
    bm.to_mesh(me); bm.free(); me.materials.append(gold)
    for p in me.polygons: p.use_smooth = True
    return me
def box(name, sx, sy, sz, bevel=0.0):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co.x *= sx; v.co.y *= sy; v.co.z *= sz
    if bevel: bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=3, affect="EDGES")
    bm.to_mesh(me); bm.free(); me.materials.append(gold)
    for p in me.polygons: p.use_smooth = True
    return me

# ── the line bracelet: emerald cuts across the line, each in a four-prong basket
def bracelet():
    root = bpy.data.objects.new("line", None); sc.collection.objects.link(root)
    A, B = 33.0, 27.0                         # the ellipse the line follows, in mm (about 18 cm round)
    Ls, Ws = 3.3, 4.6                         # a stone: 3.3 mm along the line, 4.6 mm across it
    S = 2048; pts = [(A * math.cos(i / S * 2 * math.pi), B * math.sin(i / S * 2 * math.pi)) for i in range(S + 1)]
    acc = [0]
    for i in range(1, S + 1): acc.append(acc[-1] + math.dist(pts[i], pts[i - 1]))
    per = acc[-1]; n = int(per // (Ls + 0.75)); step = per / n
    stone = stone_mesh("emerald", Ws, Ls)     # long axis across the line
    depth = 0.66 * Ls
    prong = cyl("prong", 0.26, depth * 0.95 + 0.5); tip = ball("tip", 0.33)
    rail = cyl("rail", 0.18, 1.0, 10)
    link_me = box("link", 0.9, 2.6, 0.7, 0.18)
    j = 0
    for k in range(n):
        want = k * step
        while j < S and acc[j] < want: j += 1
        x, y = pts[j]; nx, ny = pts[min(S, j + 1)]
        ang = math.atan2(ny - y, nx - x)            # the tangent
        hold = bpy.data.objects.new(f"set{k}", None); sc.collection.objects.link(hold); hold.parent = root
        hold.location = (x, y, 0); hold.rotation_euler = (0, 0, ang)
        obj(f"stone{k}", stone, (0, 0, 0.18), (0, 0, math.pi / 2), hold)
        for sx in (1, -1):
            for sy in (1, -1):
                cx, cy = sx * (Ls / 2 - 0.2), sy * (Ws / 2 - 0.35)
                obj(f"prong{k}{sx}{sy}", prong, (cx, cy, 0.25 - (depth * 0.95 + 0.5) / 2 + 0.25), (0, 0, 0), hold)
                obj(f"tip{k}{sx}{sy}", tip, (cx * 0.96, cy * 0.96, 0.42), (0, 0, 0), hold)
        for sy in (1, -1):                           # the basket's rails under the girdle
            r_ = obj(f"rail{k}{sy}", rail, (0, sy * (Ws / 2 - 0.35), -depth * 0.55), (0, math.pi / 2, 0), hold); r_.scale = (1, 1, Ls * 0.9)
        obj(f"link{k}", link_me, (Ls / 2 + 0.38, 0, -depth * 0.75), (0, 0, 0), hold)
    # the box clasp, under the line at the back
    cl = obj("clasp", box("clasp", 6.0, 4.6, 2.6, 0.5), (0, B + 0.2, -depth * 0.55), (0, 0, 0), root)
    return root

# ── the studio: a soft key from above and in front, rims, small hot lamps for fire, dark flags for contrast
def studio(target=(0, 0, 0), scale=1.0):
    aimo = bpy.data.objects.new("aim", None); sc.collection.objects.link(aimo); aimo.location = target
    def aim(o, axis="TRACK_NEGATIVE_Z"):
        c = o.constraints.new("TRACK_TO"); c.target = aimo; c.track_axis = axis; c.up_axis = "UP_Y"
    def area(name, size, loc, power, sy=None):
        l = bpy.data.lights.new(name, "AREA"); l.shape = "RECTANGLE"; l.size = size * scale; l.size_y = (sy or size) * scale; l.energy = power * scale * scale
        o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = [v * scale for v in loc]; aim(o)
        if name in ("key", "top"): o.visible_glossy = False     # the big soft lights light the metal and the stones, but are not mirrored as white blocks in the tables
        return o
    area("key", 120, (-40, -120, 260), 1.1e6)
    area("top", 220, (0, 40, 300), 6.0e5)
    area("rimL", 30, (-260, 60, 60), 2.0e5, sy=220)
    area("rimR", 30, (260, 80, 80), 2.0e5, sy=220)
    for i in range(14):
        a = i * 2.399; zz = 0.35 + 0.55 * ((i * 0.618) % 1); rr = math.sqrt(1 - zz * zz)
        l = bpy.data.lights.new(f"spark{i}", "POINT"); l.energy = 1.6e5 * scale * scale; l.shadow_soft_size = 1.0 * scale
        o = bpy.data.objects.new(f"spark{i}", l); sc.collection.objects.link(o); o.location = (math.cos(a) * rr * 380 * scale, math.sin(a) * rr * 380 * scale - 60 * scale, zz * 380 * scale)
    for nm, loc in (("flagL", (-220, -160, 160)), ("flagR", (230, -120, 200)), ("flagT", (0, -60, 330)), ("flagB", (-60, -260, 60)), ("flagD", (160, -230, 90)), ("flagE", (-150, 120, 220))):
        bpy.ops.mesh.primitive_plane_add(size=170 * scale, location=[v * scale for v in loc]); o = bpy.context.active_object; o.name = nm; aim(o, "TRACK_Z")
        m, nb = principled(nm); nb.inputs["Base Color"].default_value = (0.003, 0.003, 0.003, 1); nb.inputs["Roughness"].default_value = 1
        o.data.materials.append(m); o.visible_camera = False; o.visible_shadow = False
    world = bpy.data.worlds.new("w"); sc.world = world; world.use_nodes = True
    bg = world.node_tree.nodes["Background"]; bg.inputs["Color"].default_value = (0.92, 0.92, 0.93, 1); bg.inputs["Strength"].default_value = 0.2
    return aimo

def render_setup(w, h, samples):
    sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = samples; sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 16; sc.cycles.transmission_bounces = 14; sc.cycles.glossy_bounces = 8; sc.cycles.transparent_max_bounces = 8
    sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
    sc.render.resolution_x = w; sc.render.resolution_y = h; sc.render.resolution_percentage = 100
    sc.render.film_transparent = True
    sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - High Contrast"
    sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"

def camera(loc, target, lens=85):
    cam = bpy.data.cameras.new("cam"); cam.lens = lens; cam.sensor_width = 36; cam.clip_start = 1; cam.clip_end = 5000
    co = bpy.data.objects.new("cam", cam); sc.collection.objects.link(co); sc.camera = co; co.location = loc
    d = Vector(target) - Vector(loc); co.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return co

if MODE == "seq":
    out, N, W, H, SAMP = argv[1], int(argv[2]), int(argv[3]), int(argv[4]), int(argv[5])
    first = int(argv[6]) if len(argv) > 6 else 0; last = int(argv[7]) if len(argv) > 7 else N - 1
    os.makedirs(out, exist_ok=True)
    root = bracelet(); studio()
    camera((0, -158, 106), (0, 0, -2), 85)
    render_setup(W, H, SAMP)
    ease = lambda t: t * t * (3 - 2 * t)
    for f in range(first, last + 1):
        t = f / (N - 1)
        u = ease(t)
        # it leans back toward the camera, turns, and drops away and down, as if let go
        root.rotation_euler = Euler((R(64) * u, R(-12) * u, R(-42) * u), "XYZ")
        # the frame keeps the whole bracelet: the page carries the frame itself down and out of the screen
        root.location = (6 * u, 92 * u ** 1.4, -76 * u ** 1.4)
        sc.render.filepath = os.path.join(out, "f%03d.png" % f)
        bpy.ops.render.render(write_still=True)
        print("frame", f, flush=True)

elif MODE == "cut":
    name, out, W, H, SAMP = argv[1], argv[2], int(argv[3]), int(argv[4]), int(argv[5])
    me = stone_mesh(name, 10.0)
    st = obj("stone", me, (0, 0, 0), (0, 0, R(90) if name in ("oval", "marquise", "pear", "emerald", "baguette") else 0))
    # a single prong-less stone, its table up, seen from above and in front
    studio((0, 0, 0), 0.08)
    camera((0, -17, 31), (0, 0, -0.8), 85)
    render_setup(W, H, SAMP)
    sc.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print("rendered", out, flush=True)
