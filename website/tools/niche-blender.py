# One niche in a wall of dark basalt, lit by a lamp in its ceiling, rendered in Blender (Cycles, CPU).
# The piece is not in the render: the page sets the house's own photograph on the ledge, so the
# render also writes where the ledge and the opening fall in the frame (niche-meta.json).
#
# Usage: blender -b -P niche-blender.py -- <out.png> <meta.json> <hex light colour> [W H samples]
#        blender -b -P niche-blender.py -- <out.png> <meta.json> wall [W H samples]   (the bare wall, no niche)
import bpy, sys, json, math
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index("--") + 1:]
OUT, META, COL = argv[0], argv[1], argv[2]
W = int(argv[3]) if len(argv) > 3 else 900
H = int(argv[4]) if len(argv) > 4 else 1350
SAMPLES = int(argv[5]) if len(argv) > 5 else 96
WALL_ONLY = COL == "wall"

def hex2rgb(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# ---- materials: honed stone, fine grain and a slow cloud of tone, barely any relief ----
def stone(name, base, rough, grain, cloud):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; L = nt.links
    bsdf = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord")
    fine = N.new("ShaderNodeTexNoise"); fine.inputs["Scale"].default_value = 90; fine.inputs["Detail"].default_value = 6
    big = N.new("ShaderNodeTexNoise"); big.inputs["Scale"].default_value = 2.2; big.inputs["Detail"].default_value = 3; big.inputs["Roughness"].default_value = 0.45
    for t in (fine, big): L.new(tc.outputs["Object"], t.inputs["Vector"])
    mix = N.new("ShaderNodeMix"); mix.data_type = "FLOAT"; mix.inputs["Factor"].default_value = grain
    L.new(big.outputs["Fac"], mix.inputs["A"]); L.new(fine.outputs["Fac"], mix.inputs["B"])
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.5 - cloud; ramp.color_ramp.elements[0].color = (*[v * 0.72 for v in base], 1)
    ramp.color_ramp.elements[1].position = 0.5 + cloud; ramp.color_ramp.elements[1].color = (*[v * 1.3 for v in base], 1)
    L.new(mix.outputs[0], ramp.inputs["Fac"]); L.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    rr = N.new("ShaderNodeMapRange"); rr.inputs["To Min"].default_value = rough - 0.08; rr.inputs["To Max"].default_value = rough + 0.06
    L.new(fine.outputs["Fac"], rr.inputs["Value"]); L.new(rr.outputs[0], bsdf.inputs["Roughness"])
    bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.06; bp.inputs["Distance"].default_value = 0.002
    L.new(fine.outputs["Fac"], bp.inputs["Height"]); L.new(bp.outputs["Normal"], bsdf.inputs["Normal"])
    return m

basalt = stone("basalt", [0.05, 0.048, 0.046], 0.66, 0.55, 0.24)
inner = stone("inner", [0.16, 0.148, 0.135], 0.62, 0.45, 0.2)
polish = bpy.data.materials.new("polish"); polish.use_nodes = True
pb = polish.node_tree.nodes["Principled BSDF"]; pb.inputs["Base Color"].default_value = (0.01, 0.0095, 0.009, 1); pb.inputs["Roughness"].default_value = 0.07

def box(name, loc, size, mat):
    bpy.ops.mesh.primitive_cube_add(location=loc); o = bpy.context.object; o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2); bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(mat); return o

# ---- geometry: the wall faces -Y; the niche opening is NW x NH, NDEEP deep; its floor at z = 0 ----
NW, NH, NDEEP, T = 0.56, 0.84, 0.36, 0.6
wall = box("wall", (0, T / 2, 0.4), (6, T, 4), basalt)
if not WALL_ONLY:
    # one block of stone with the niche carved out of it; the carved faces take the paler inner stone; soft edges
    cut = box("cut", (0, NDEEP / 2 - 0.05, NH / 2), (NW, NDEEP + 0.1, NH), inner)
    bo = wall.modifiers.new("niche", "BOOLEAN"); bo.object = cut; bo.operation = "DIFFERENCE"; bo.solver = "EXACT"
    bo.material_mode = "TRANSFER"
    bpy.context.view_layer.objects.active = wall; bpy.ops.object.modifier_apply(modifier="niche")
    cut.hide_render = True; cut.hide_viewport = True
    bv = wall.modifiers.new("soft", "BEVEL"); bv.width = 0.006; bv.segments = 3; bv.limit_method = "ANGLE"
    # a polished slab set into the floor of the niche, its lip just proud of the wall
    box("ledge", (0, NDEEP / 2 - 0.03, -0.018), (NW - 0.002, NDEEP + 0.06, 0.036), polish)
    # the lamp: a small glowing disc in the ceiling, and the spot it throws onto the back wall and the slab
    bpy.ops.mesh.primitive_cylinder_add(radius=0.028, depth=0.006, location=(0, NDEEP * 0.55, NH - 0.002))
    lamp = bpy.context.object; em = bpy.data.materials.new("lamp"); em.use_nodes = True
    en = em.node_tree.nodes; en.remove(en["Principled BSDF"]); e = en.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = (*[0.75 + 0.25 * c for c in hex2rgb(COL)], 1); e.inputs["Strength"].default_value = 60
    em.node_tree.links.new(e.outputs[0], en["Material Output"].inputs[0]); lamp.data.materials.append(em)
    bpy.ops.object.light_add(type="SPOT", location=(0, NDEEP * 0.55, NH - 0.02))
    sp = bpy.context.object; sp.data.energy = 95; sp.data.spot_size = math.radians(58); sp.data.spot_blend = 0.45
    sp.data.shadow_soft_size = 0.012; sp.data.color = [0.45 + 0.55 * c for c in hex2rgb(COL)]
    sp.rotation_euler = (math.radians(9), 0, 0)   # down, leaning back so its edge draws a scallop on the back wall
    # the light the slab throws back up, so the foot of the back wall glows
    bpy.ops.object.light_add(type="AREA", location=(0, NDEEP * 0.5, 0.01))
    ar = bpy.context.object; ar.data.energy = 2.5; ar.data.size = 0.4; ar.data.color = [0.5 + 0.5 * c for c in hex2rgb(COL)]
    ar.rotation_euler = (math.radians(180), 0, 0)

# a broad light high above the wall, grazing down its face so the honed stone reads
bpy.ops.object.light_add(type="AREA", location=(0, -0.9, 2.9))
fk = bpy.context.object; fk.data.energy = 60 if not WALL_ONLY else 80; fk.data.size = 4; fk.data.color = (1, 0.96, 0.92)
fk.rotation_euler = (math.radians(22), 0, 0)

world = bpy.data.worlds.new("w"); sc.world = world; world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.002, 0.002, 0.002, 1)

# ---- camera: straight on, the opening a little above centre ----
bpy.ops.object.camera_add(location=(0, -2.35, NH * 0.5 + 0.03))
cam = bpy.context.object; cam.rotation_euler = (math.radians(90), 0, 0); cam.data.lens = 50 if not WALL_ONLY else 35
sc.camera = cam
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.quality = 90
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)

# ---- where the ledge and the opening fall in the frame (fractions from the top left) ----
def px(p):
    v = world_to_camera_view(sc, cam, Vector(p)); return [round(v.x, 4), round(1 - v.y, 4)]
meta = {} if WALL_ONLY else {
    "ledge_front": px((0, -0.02, 0.0)), "ledge_back": px((0, NDEEP, 0.0)),
    "open_tl": px((-NW / 2, 0, NH)), "open_br": px((NW / 2, 0, 0)),
    "back_tl": px((-NW / 2, NDEEP, NH)), "back_br": px((NW / 2, NDEEP, 0)),
}
json.dump(meta, open(META, "w"), indent=1)
print("NICHE", OUT, json.dumps(meta))
