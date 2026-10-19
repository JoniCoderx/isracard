# SOUL, modelled and rendered in Blender (Cycles, path traced), free and on
# this machine: the house's exact mark (its outline from body.mjs MARK, as
# point lists), 20 mm tall and 1.6 mm deep with rounded polished edges; the
# pavé of soul-pave.json, each a round brilliant (57 facets, glass of
# diamond's index and dispersion) set in the top face, held by beads of white
# gold; the cable chain with its bezel-set stations. Lit as jewellery is shot:
# soft boxes the metal reflects, dark cards that give it drawing, and a key
# light whose soft shadow falls on a catcher behind (the page lays the
# picture on its own colour).
# Usage: blender -b -P soul-blender.py -- <mark.json> <pave.json> <out.png>
#        [width] [height] [samples] [az] [el] [frame] [lens]
import bpy, bmesh, json, math, sys, random
from mathutils import Vector, Matrix, Quaternion

argv = sys.argv[sys.argv.index("--") + 1:]
MARKJ, PAVEJ, OUT = argv[0], argv[1], argv[2]
W = int(argv[3]) if len(argv) > 3 else 1400
H = int(argv[4]) if len(argv) > 4 else 1400
SAMPLES = int(argv[5]) if len(argv) > 5 else 256
AZ = float(argv[6]) if len(argv) > 6 else 0.55     # the turn, radians
EL = float(argv[7]) if len(argv) > 7 else 0.18     # the camera a little above
FRAME = float(argv[8]) if len(argv) > 8 else 30.0  # mm of the piece across the shorter side
LENS = float(argv[9]) if len(argv) > 9 else 100.0

mark = json.load(open(MARKJ)); PAVE = json.load(open(PAVEJ))
MW = mark["MARK_W"]; S = 20 / 1000; DEPTH = 1.6
def P(x, y, z=0.0): return Vector(((x - MW / 2) * S, (500 - y) * S, z))

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"
sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True; sc.cycles.denoiser = "OPENIMAGEDENOISE"
sc.cycles.max_bounces = 32; sc.cycles.transmission_bounces = 24; sc.cycles.glossy_bounces = 16; sc.cycles.transparent_max_bounces = 16
sc.cycles.caustics_reflective = True; sc.cycles.caustics_refractive = True; sc.cycles.blur_glossy = 0.3
sc.render.resolution_x = W; sc.render.resolution_y = H; sc.render.film_transparent = True
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"; sc.render.image_settings.color_depth = "16"
sc.unit_settings.scale_length = 0.001

def link(o): sc.collection.objects.link(o); return o

# ── materials
gold = bpy.data.materials.new("white gold"); gold.use_nodes = True
b = gold.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = (0.86, 0.855, 0.84, 1); b.inputs["Metallic"].default_value = 1.0; b.inputs["Roughness"].default_value = 0.07
dia = bpy.data.materials.new("diamond"); dia.use_nodes = True
d = dia.node_tree.nodes["Principled BSDF"]
d.inputs["Base Color"].default_value = (1, 1, 1, 1); d.inputs["Roughness"].default_value = 0.0; d.inputs["IOR"].default_value = 2.417
d.inputs["Transmission Weight"].default_value = 1.0
if "Dispersion" in d.inputs: d.inputs["Dispersion"].default_value = 0.03

# ── the pendant: the mark, filled, extruded, its edges rounded
cu = bpy.data.curves.new("mark", "CURVE"); cu.dimensions = "2D"; cu.fill_mode = "BOTH"
BEV = 0.16
cu.extrude = (DEPTH - 2 * BEV) / 2; cu.bevel_depth = BEV; cu.bevel_resolution = 5; cu.offset = -BEV * 0.85
for s in mark["shapes"]:
    for contour in [s["outer"]] + s["holes"]:
        pts = contour[:-1] if contour[0] == contour[-1] else contour
        sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
        for i, (x, y) in enumerate(pts):
            v = P(x, y); sp.points[i].co = (v.x, v.y, 0, 1)
        sp.use_cyclic_u = True
pend = link(bpy.data.objects.new("pendant", cu)); pend.location.z = DEPTH / 2
bpy.context.view_layer.objects.active = pend; pend.select_set(True)
bpy.ops.object.convert(target="MESH")
pend.data.materials.append(gold)
for f in pend.data.polygons: f.use_smooth = True
mod = pend.modifiers.new("ws", "WEIGHTED_NORMAL"); mod.keep_sharp = True

# ── a round brilliant, girdle radius 1, table up (+z)
def brilliant():
    R = math.radians; pts = []
    s = 0.54; c22 = math.cos(R(22.5)); rv = s / c22; tc = math.tan(R(34.5)); hc = (1 - rv) * tc; g = 0.03
    ra = s + 0.5 * (1 - s); ya = tc * (1 - ra * c22)
    tp = math.tan(R(40.75)); pd = tp * 1 + g; rq = 0.23; yq = -g - tp * (1 - rq)
    for k in range(8):
        f = R(k * 45); h = f + R(22.5)
        pts.append((rv * math.cos(f), rv * math.sin(f), hc))
        pts.append((ra * math.cos(h), ra * math.sin(h), ya))
        pts.append((rq * math.cos(h), rq * math.sin(h), yq))
    for k in range(32):
        f = R(k * 11.25)
        pts.append((math.cos(f), math.sin(f), 0)); pts.append((math.cos(f), math.sin(f), -g))
    pts.append((0, 0, -pd))
    me = bpy.data.meshes.new("brilliant"); bm = bmesh.new()
    vs = [bm.verts.new(p) for p in pts]
    bmesh.ops.convex_hull(bm, input=vs)
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(0.5), verts=bm.verts, edges=bm.edges)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = False
    me.materials.append(dia)
    return me
BRIL = brilliant()

rnd = random.Random(7)
for i, (x, y, r, a) in enumerate(PAVE):
    dd = r * S * 2 * 0.98
    o = link(bpy.data.objects.new(f"stone{i}", BRIL))
    o.location = P(x, y, DEPTH - 0.06 * dd); o.scale = (dd / 2,) * 3; o.rotation_euler = (0, 0, rnd.random() * math.pi)

# ── the beads that hold the stones, between each and the next
bead = bpy.data.meshes.new("bead"); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=1)
bm.to_mesh(bead); bm.free(); bead.materials.append(gold)
for p in bead.polygons: p.use_smooth = True
n = 0
for i in range(1, len(PAVE)):
    x1, y1, r1, _ = PAVE[i - 1]; x2, y2, r2, _ = PAVE[i]
    if math.hypot(x2 - x1, y2 - y1) > 1.6 * (r1 + r2): continue
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2; ang = math.atan2(y2 - y1, x2 - x1); off = (r1 + r2) / 2 * 0.86
    br = max(0.035, (r1 + r2) / 2 * S * 0.2)
    for sg in (1, -1):
        o = link(bpy.data.objects.new(f"bead{n}", bead)); n += 1
        o.location = P(mx - math.sin(ang) * off * sg, my + math.cos(ang) * off * sg, DEPTH + br * 0.15); o.scale = (br,) * 3

# ── the chain: a jump ring at the outer top of each crescent, then the cable
# chain, each link a quarter turn to the last, with bezel-set stations
def catmull(ps, n=400):
    out = []
    ps = [ps[0]] + ps + [ps[-1]]
    for i in range(1, len(ps) - 2):
        p0, p1, p2, p3 = ps[i - 1], ps[i], ps[i + 1], ps[i + 2]
        for k in range(n):
            t = k / n; t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(ps[-2]); return out
bpy.ops.mesh.primitive_torus_add(major_radius=0.42, minor_radius=0.13, major_segments=28, minor_segments=12)
tor = bpy.context.active_object; tor.data.transform(Matrix.Diagonal((1.42, 1, 1, 1))); link_mesh = tor.data
link_mesh.materials.append(gold)
for p in link_mesh.polygons: p.use_smooth = True
sc.collection.objects.unlink(tor)
bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=1.0, depth=0.9, end_fill_type="NOTHING")
cupo = bpy.context.active_object; cup_mesh = cupo.data; cup_mesh.materials.append(gold); sc.collection.objects.unlink(cupo)
for p in cup_mesh.polygons: p.use_smooth = True
X = Vector((1, 0, 0)); stations = []
for ax, ay, sg in ((76, 329, -1), (795, 324.5, 1)):
    a = P(ax, ay, DEPTH * 0.5)
    ctrl = [a, a + Vector((sg * 3, 2.4, -0.2)), a + Vector((sg * 14, 22, -2)), a + Vector((sg * 34, 70, -8)), a + Vector((sg * 58, 150, -16))]
    path = catmull(ctrl); L = [0.0]
    for i in range(1, len(path)): L.append(L[-1] + (path[i] - path[i - 1]).length)
    s, k, j = 0.9, 0, 0
    while s < L[-1]:
        while L[j + 1] < s: j += 1
        u = (s - L[j]) / max(1e-9, L[j + 1] - L[j]); p = path[j].lerp(path[j + 1], u); tg = (path[j + 1] - path[j]).normalized()
        if abs(s - 24) < 1.3 or abs(s - 56) < 1.3:
            if not any((q - p).length < 1 for q in stations): stations.append(p.copy())
        else:
            q = X.rotation_difference(tg) @ Quaternion(X, math.pi / 2 if k % 2 else 0)
            o = link(bpy.data.objects.new(f"link{k}_{sg}", link_mesh)); o.location = p; o.rotation_mode = "QUATERNION"; o.rotation_quaternion = q
        s += 1.18; k += 1
for i, p in enumerate(stations):
    o = link(bpy.data.objects.new(f"cup{i}", cup_mesh)); o.location = p
    o = link(bpy.data.objects.new(f"st{i}", BRIL)); o.location = p + Vector((0, 0, 0.12)); o.scale = (0.78,) * 3

# ── the studio
AIM = bpy.data.objects.new("aim", None); sc.collection.objects.link(AIM); AIM.location = (0, 0.2, DEPTH / 2)
def aim(o, axis="TRACK_NEGATIVE_Z"):
    c = o.constraints.new("TRACK_TO"); c.target = AIM; c.track_axis = axis; c.up_axis = "UP_Y"
def area(name, size, loc, power, color=(1, 1, 1), sx=None):
    l = bpy.data.lights.new(name, "AREA"); l.shape = "RECTANGLE"; l.size = size; l.size_y = sx or size; l.energy = power; l.color = color
    o = link(bpy.data.objects.new(name, l)); o.location = loc; aim(o); return o
# a dark studio and large soft boxes: polished metal shows them as clean
# white bands against black, and the stones break them into sparks
area("key", 90, (-90, 110, 170), 2.4e5)                 # a large softbox above and to the left: the key, and its shadow
area("strip L", 22, (-180, 0, 70), 1.2e5, sx=180)       # strip lights at either side: the edges
area("strip R", 22, (180, 10, 50), 1.0e5, sx=180)
area("top", 160, (0, 230, 30), 9.0e4)                    # a broad top light
area("rim", 40, (50, 70, -150), 6.0e4, (1, 0.97, 0.93), sx=140)
area("front", 70, (40, -30, 260), 4.0e4)                 # a smaller fill from beside the camera
for i in range(10):                                      # a few small hot lamps for the diamonds' sparks
    a = i * 2.399; zz = 0.3 + 0.6 * ((i * 0.618) % 1); rr = math.sqrt(1 - zz * zz)
    l = bpy.data.lights.new(f"spark{i}", "POINT"); l.energy = 2.5e4; l.shadow_soft_size = 2
    o = link(bpy.data.objects.new(f"spark{i}", l)); o.location = (math.cos(a) * rr * 260, math.sin(a) * rr * 260, zz * 260)
def card(name, size, loc, shade):
    bpy.ops.mesh.primitive_plane_add(size=size, location=loc); o = bpy.context.active_object; o.name = name
    aim(o, "TRACK_Z")
    m = bpy.data.materials.new(name); m.use_nodes = True; nb = m.node_tree.nodes["Principled BSDF"]; nb.inputs["Base Color"].default_value = (shade, shade, shade, 1); nb.inputs["Roughness"].default_value = 1
    o.data.materials.append(m); o.visible_camera = False; o.visible_shadow = False
card("flag L", 110, (-150, -40, 110), 0.004)             # two dark cards where the faces look: drawing in the
card("flag R", 110, (160, -60, 100), 0.004)              # metal, black facets in the stones
world = bpy.data.worlds.new("w"); sc.world = world; world.use_nodes = True
bg = world.node_tree.nodes["Background"]; bg.inputs["Strength"].default_value = 1.0; bg.inputs["Color"].default_value = (0.012, 0.012, 0.013, 1)
# a soft white reflector in front, above the camera, unseen by it: the
# pavé's tables look up into it, so the stones read white with dark facets
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 90, 300)); refl = bpy.context.active_object; aim(refl, "TRACK_Z")
rm = bpy.data.materials.new("reflector"); rm.use_nodes = True; nt = rm.node_tree; nt.nodes.clear()
em = nt.nodes.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = 2.2; outn = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(em.outputs[0], outn.inputs[0])
refl.data.materials.append(rm); refl.visible_camera = False; refl.visible_shadow = False
bpy.ops.mesh.primitive_plane_add(size=160, location=(190, 70, 190)); refl2 = bpy.context.active_object; aim(refl2, "TRACK_Z")
refl2.data.materials.append(rm); refl2.visible_camera = False; refl2.visible_shadow = False
# the wall behind: it catches the shadow only
bpy.ops.mesh.primitive_plane_add(size=800, location=(0, 0, -14)); wall = bpy.context.active_object; wall.is_shadow_catcher = True

# ── everything above is built lying with +y up; Blender aims with world z
# up, so the whole set is stood upright (the pendant then faces -y)
ROOT = bpy.data.objects.new("root", None); sc.collection.objects.link(ROOT)
for o in list(sc.collection.objects):
    if o is not ROOT: o.parent = ROOT
ROOT.rotation_euler = (math.pi / 2, 0, 0)
UP = Matrix.Rotation(math.pi / 2, 4, "X")

# ── the camera: turned, a little above, a long lens
cam = bpy.data.cameras.new("cam"); cam.lens = LENS; cam.sensor_width = 36
co = link(bpy.data.objects.new("cam", cam)); sc.camera = co
tgt = Vector((0, 0.2, DEPTH / 2))
dist = FRAME / 2 / math.tan(math.atan(18 / LENS) * (min(W, H) / max(W, H)) if W >= H else math.atan(18 / LENS))
co.location = UP @ (tgt + Vector((dist * math.cos(EL) * math.sin(AZ), dist * math.sin(EL), dist * math.cos(EL) * math.cos(AZ))))
aim(co)

sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("rendered", OUT)
