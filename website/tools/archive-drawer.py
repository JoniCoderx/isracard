# The SILAVU private drawer (test14 "Up close"), rendered in Blender (Cycles) for the page's background:
# a dark lacquered cabinet, the presentation drawer in it lined with champagne-taupe suede, brushed steel
# runners and pull, a small dark-suede earring stand, a museum spot from above, pure black all round.
# The jewellery and the prints are NOT in the render: the page draws them live in 3D over it with the same
# camera, so each piece stays clickable and replaceable. So the script also writes:
#   <out>.json  the camera (world matrix, lens, sensor), the lights, and the drawer's interior floor
#   env pass    an equirectangular HDR seen from inside the drawer, for the live pieces' reflections
# Units are metres; the drawer's travel is in millimetres.
# Usage: blender -b -P archive-drawer.py -- <beauty|env> <out.png|out.hdr> <W> <H> <samples> <travel_mm> [layout d|m]
import bpy, bmesh, math, sys, json
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index("--") + 1:]
MODE, OUT, W, H, SAMPLES, TRAVEL = argv[0], argv[1], int(argv[2]), int(argv[3]), int(argv[4]), float(argv[5]) / 1000
LAYOUT = argv[6] if len(argv) > 6 else "d"
mm = lambda v: v / 1000

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True; sc.cycles.denoiser = "OPENIMAGEDENOISE"
sc.cycles.max_bounces = 10; sc.cycles.glossy_bounces = 6; sc.cycles.diffuse_bounces = 4; sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.cycles.blur_glossy = 0.6
sc.render.resolution_x = W; sc.render.resolution_y = H; sc.render.resolution_percentage = 100
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"; sc.view_settings.exposure = 0.0
sc.world = bpy.data.worlds.new("w"); sc.world.use_nodes = True; sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)

# ── materials
def principled(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; return m, m.node_tree.nodes["Principled BSDF"], m.node_tree
def lacquer():
    m, b, t = principled("lacquer"); N = t.nodes; L = t.links
    tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1, 14, 1)
    L.new(tc.outputs["Object"], mp.inputs[0])
    wave = N.new("ShaderNodeTexWave"); wave.inputs["Scale"].default_value = 9; wave.inputs["Distortion"].default_value = 7; wave.inputs["Detail"].default_value = 4; wave.inputs["Detail Roughness"].default_value = .6
    L.new(mp.outputs[0], wave.inputs[0])
    ramp = N.new("ShaderNodeValToRGB"); ramp.color_ramp.elements[0].color = (.014, .008, .0055, 1); ramp.color_ramp.elements[1].color = (.024, .0135, .0085, 1)
    L.new(wave.outputs["Fac"], ramp.inputs[0]); L.new(ramp.outputs[0], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = .32; b.inputs["Coat Weight"].default_value = 1.0; b.inputs["Coat Roughness"].default_value = .035; b.inputs["Coat IOR"].default_value = 1.52
    return m
def suede(name, col, sheen=.7):
    m, b, t = principled(name); N = t.nodes; L = t.links
    b.inputs["Roughness"].default_value = 1.0; b.inputs["Sheen Weight"].default_value = sheen; b.inputs["Sheen Roughness"].default_value = .38; b.inputs["Sheen Tint"].default_value = (1, .96, .9, 1)
    b.inputs["Specular IOR Level"].default_value = .25
    tc = N.new("ShaderNodeTexCoord")
    fine = N.new("ShaderNodeTexNoise"); fine.inputs["Scale"].default_value = 2600; fine.inputs["Detail"].default_value = 3
    nap = N.new("ShaderNodeTexNoise"); nap.inputs["Scale"].default_value = 22; nap.inputs["Detail"].default_value = 3; nap.inputs["Distortion"].default_value = .6
    L.new(tc.outputs["Object"], fine.inputs[0]); L.new(tc.outputs["Object"], nap.inputs[0])
    bump = N.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = .35; bump.inputs["Distance"].default_value = .0004
    L.new(fine.outputs["Fac"], bump.inputs["Height"]); L.new(bump.outputs[0], b.inputs["Normal"])
    mix = N.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.inputs[6].default_value = (col[0] * .84, col[1] * .84, col[2] * .85, 1); mix.inputs[7].default_value = (col[0] * 1.12, col[1] * 1.11, col[2] * 1.08, 1)
    L.new(nap.outputs["Fac"], mix.inputs[0]); L.new(mix.outputs[2], b.inputs["Base Color"])
    return m
def steel():
    m, b, t = principled("steel")
    b.inputs["Base Color"].default_value = (.78, .76, .72, 1); b.inputs["Metallic"].default_value = 1; b.inputs["Roughness"].default_value = .28
    b.inputs["Anisotropic"].default_value = .7
    return m
def flat(name, col, rough=.8):
    m, b, t = principled(name); b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Roughness"].default_value = rough; return m
LAC, SUEDE, STAND, STEEL, CAVE = lacquer(), suede("suede", (.36, .29, .22)), suede("stand", (.05, .036, .028), .5), steel(), flat("cave", (.004, .003, .003), .9)

# ── geometry
def box(name, c, s, mat, bev=.0012, seg=3, parent=None):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co = Vector((v.co.x * s[0], v.co.y * s[1], v.co.z * s[2]))
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o); o.location = c; me.materials.append(mat)
    if bev: md = o.modifiers.new("bev", "BEVEL"); md.width = bev; md.segments = seg; md.limit_method = "ANGLE"
    for p in me.polygons: p.use_smooth = True
    if parent: o.parent = parent
    return o

DW, DD, DH, WT, BT = mm(324), mm(226), mm(62), mm(12), mm(10)        # drawer box: width, depth, height, wall, bottom
FT, FH = mm(22), mm(80)                                                # front panel thickness and height
drawer = bpy.data.objects.new("drawer", None); sc.collection.objects.link(drawer)
# the box (its front at y = 0 when closed), walls, bottom
box("bottom", (0, DD / 2, BT / 2), (DW, DD, BT), LAC, parent=drawer)
box("wl", (-DW / 2 + WT / 2, DD / 2, DH / 2), (WT, DD, DH), LAC, parent=drawer)
box("wr", (DW / 2 - WT / 2, DD / 2, DH / 2), (WT, DD, DH), LAC, parent=drawer)
box("wb", (0, DD - WT / 2, DH / 2), (DW, WT, DH), LAC, parent=drawer)
box("wf", (0, WT / 2, DH / 2), (DW, WT, DH), LAC, parent=drawer)
# the front, a slim brushed line along its top, and the pull
box("front", (0, -FT / 2, DH / 2 + mm(4)), (DW + mm(28), FT, FH), LAC, bev=.0016, parent=drawer)
box("inlay", (0, -FT - mm(.2), DH / 2 + mm(4) + FH / 2 - mm(7)), (DW + mm(28) - mm(16), mm(.6), mm(1.4)), STEEL, bev=0, parent=drawer)
box("pull", (0, -FT - mm(9), DH / 2 + mm(2)), (mm(118), mm(7), mm(9)), STEEL, bev=.002, seg=4, parent=drawer)
for x in (-mm(46), mm(46)): box("post", (x, -FT - mm(3), DH / 2 + mm(2)), (mm(6), mm(7), mm(6)), STEEL, bev=.0008, parent=drawer)
# the runners on its sides
for sx in (-1, 1): box("runner", (sx * (DW / 2 + mm(2.5)), DD / 2, DH * .45), (mm(5), DD - mm(8), mm(14)), STEEL, bev=.0005, parent=drawer)
# the lining: a suede floor and suede panels with softly rounded tops, upholstered
LT, IW, ID = mm(4), DW - 2 * WT, DD - 2 * WT
box("floor", (0, DD / 2, BT + LT / 2), (IW, ID, LT), SUEDE, bev=.0015, seg=4, parent=drawer)
PT = mm(5); PH = DH - BT - mm(3)
box("pl", (-IW / 2 + PT / 2, DD / 2, BT + PH / 2), (PT, ID, PH), SUEDE, bev=.0022, seg=5, parent=drawer)
box("pr", (IW / 2 - PT / 2, DD / 2, BT + PH / 2), (PT, ID, PH), SUEDE, bev=.0022, seg=5, parent=drawer)
box("pb", (0, DD - WT - PT / 2, BT + PH / 2), (IW, PT, PH), SUEDE, bev=.0022, seg=5, parent=drawer)
box("pf", (0, WT + PT / 2, BT + PH / 2), (IW, PT, PH), SUEDE, bev=.0022, seg=5, parent=drawer)
FLOOR = BT + LT                                                       # the interior floor, above the drawer's base
IX, IY = IW - 2 * PT, ID - 2 * PT                                     # the interior's free width and depth
# the earring stand (desktop: back, left of centre), dark suede, a base and an upright with a rounded head
SX, SY = (-mm(52), DD / 2 + mm(62)) if LAYOUT == "d" else (-mm(60), DD / 2 + mm(70))
box("standbase", (SX, SY, FLOOR + mm(4)), (mm(50), mm(30), mm(8)), STAND, bev=.0025, seg=5, parent=drawer)
box("standup", (SX, SY + mm(3), FLOOR + mm(8) + mm(19)), (mm(42), mm(7), mm(38)), STAND, bev=.003, seg=6, parent=drawer)

# the cabinet: a frame round the drawer's opening, a top running back into the dark, a black cavity inside
OW, OZ0, OZ1 = DW + mm(36), -mm(6), DH + mm(10)
CW = OW + mm(150)
box("rail_top", (0, mm(9), OZ1 + mm(60)), (CW, mm(18), mm(120)), LAC, bev=.0016)
box("rail_bot", (0, mm(9), OZ0 - mm(80)), (CW, mm(18), mm(160)), LAC, bev=.0016)
for sx in (-1, 1): box("stile", (sx * (OW / 2 + (CW - OW) / 4), mm(9), (OZ0 + OZ1) / 2), ((CW - OW) / 2, mm(18), OZ1 - OZ0 + mm(2)), LAC, bev=.0016)
box("top", (0, mm(180), OZ1 + mm(129)), (CW + mm(10), mm(380), mm(18)), LAC, bev=.002)
box("cave", (0, mm(200), (OZ0 + OZ1) / 2), (OW + mm(10), mm(380), OZ1 - OZ0 + mm(30)), CAVE, bev=0)
bpy.data.objects["cave"].data.flip_normals() if False else None

drawer.location = (0, -TRAVEL, 0)

SPOTW = 8.0
# ── light: a museum spot from above the drawer, a soft fill from the visitor's side, two rims for the lacquer
ICY = DD / 2 - TRAVEL                                                  # the interior's centre (y) with the drawer at this travel
target = Vector((0, ICY, FLOOR))
def light(kind, loc, energy, aim=None, **kw):
    d = bpy.data.lights.new(kind + str(len(bpy.data.lights)), kind); d.energy = energy
    for k, v in kw.items(): setattr(d, k, v)
    o = bpy.data.objects.new(d.name, d); sc.collection.objects.link(o); o.location = loc
    if aim is not None: o.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return o
spot = light("SPOT", (mm(-30), ICY - mm(150), mm(620)), SPOTW, target, spot_size=math.radians(36), spot_blend=1.0, shadow_soft_size=mm(55), color=(1, .93, .84))
fill = light("AREA", (0, ICY - mm(700), mm(260)), .7, (0, ICY, mm(40)), size=mm(600), color=(1, .95, .9))
rimL = light("AREA", (-mm(500), ICY + mm(420), mm(520)), 2.2, (0, ICY, 0), size=mm(260), color=(1, .96, .92))
rimR = light("AREA", (mm(520), ICY + mm(380), mm(480)), 1.6, (0, ICY, 0), size=mm(220), color=(1, .96, .92))
glow = light("AREA", (0, mm(40), OZ1 + mm(40)), .5, (0, ICY, FLOOR), size=mm(240), color=(1, .9, .78))   # light falling in under the cabinet's edge

# ── camera
cam_d = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cam_d); sc.collection.objects.link(cam); sc.camera = cam
if LAYOUT == "d":
    tgt = Vector((0, ICY - mm(10), FLOOR + mm(4))); dist, elev, lens = mm(640), math.radians(52), 50
else:
    tgt = Vector((0, ICY + mm(4), FLOOR)); dist, elev, lens = mm(640), math.radians(58), 42
cam.location = tgt + Vector((0, -math.cos(elev) * dist, math.sin(elev) * dist))
cam.rotation_euler = (tgt - cam.location).to_track_quat("-Z", "Y").to_euler()
cam_d.lens = lens; cam_d.sensor_width = 36; cam_d.dof.use_dof = MODE != "env"; cam_d.dof.focus_distance = (tgt - cam.location).length; cam_d.dof.aperture_fstop = 4.5; cam_d.sensor_fit = "AUTO"; cam_d.clip_start = .01; cam_d.clip_end = 10

if MODE == "env":
    # seen from the jewellery, a little above the floor: everything the white gold and the stones reflect, with the
    # spot's own disc made visible (a light's emitter is not seen by camera rays)
    cam_d.type = "PANO"; cam_d.panorama_type = "EQUIRECTANGULAR"
    cam.location = target + Vector((0, 0, mm(12))); cam.rotation_euler = (math.radians(90), 0, math.radians(-90))   # the panorama's centre on +x, as three.js expects
    me = bpy.data.meshes.new("disc"); bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, radius=mm(55), segments=32); bm.to_mesh(me); bm.free()
    em = bpy.data.materials.new("em"); em.use_nodes = True; nt = em.node_tree; nt.nodes.remove(nt.nodes["Principled BSDF"])
    es = nt.nodes.new("ShaderNodeEmission"); es.inputs["Strength"].default_value = SPOTW / (math.pi * mm(55) ** 2) / 6; es.inputs["Color"].default_value = (1, .93, .84, 1)
    nt.links.new(es.outputs[0], nt.nodes["Material Output"].inputs[0]); me.materials.append(em)
    dob = bpy.data.objects.new("disc", me); sc.collection.objects.link(dob); dob.location = spot.location; dob.rotation_euler = spot.rotation_euler
    sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
    sc.render.image_settings.file_format = "HDR"
else:
    sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGB"; sc.render.image_settings.color_depth = "8"
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)

if MODE != "env":
    bpy.context.view_layer.update()
    info = { "about": "archive-drawer.py: Blender world (z up, metres); the page turns it to three.js (y up)",
      "res": [W, H], "lens": cam_d.lens, "sensor": cam_d.sensor_width, "fit": "AUTO",
      "cam": [list(r) for r in cam.matrix_world], "travel_mm": TRAVEL * 1000,
      "floor": { "x": 0, "y": ICY, "z": FLOOR, "w": IX, "d": IY },
      "spot": { "pos": list(spot.location), "target": list(target), "w": SPOTW, "color": [1, .93, .84], "angle": math.radians(36), "soft": mm(55) },
      "stand": { "x": SX, "y": SY - TRAVEL, "z": FLOOR, "face_y": SY - TRAVEL - mm(.5), "w": mm(42), "h": mm(38) } }
    json.dump(info, open(OUT.rsplit(".", 1)[0] + ".json", "w"), indent=1)
print("DONE", OUT)
