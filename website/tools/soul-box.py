# SOUL lying on the SILAVU box, for a white page (/test12/). The pendant,
# its pavé and its chain are the house's model, built by
# lumera/site/soul-blender.py (run here up to its studio, with the chain laid
# flat over the lid and down the back instead of rising to a neck). The box
# is the house's: black lacquer with a rose-gold band at the lid. Rendered on
# a transparent ground; the floor only catches the shadow, so the page puts
# the picture straight on its own white.
# Usage: blender -b -P soul-box.py -- <mark.json> <pave.json> <out.png>
#        [width] [height] [samples] [az] [el]
import bpy, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lumera", "site", "soul-blender.py")
code = open(SRC).read()
code = code[:code.index("# ── the studio")]
# the chain lies on the lid in a loose loop behind the pendant, the two sides meeting at the clasp
old = "ctrl = [a, a + Vector((sg * 3, 2.4, -0.2)), a + Vector((sg * 14, 22, -2)), a + Vector((sg * 34, 70, -8)), a + Vector((sg * 58, 150, -16))]"
assert old in code, "soul-blender.py's chain has changed"
code = code.replace(old, "a = Vector((a.x, a.y, 0.55)); ctrl = [a, a + Vector((sg * 3, 3, 0)), a + Vector((sg * 9, 13, 0)), a + Vector((sg * 10.5, 24, 0)), a + Vector((sg * 5, 31.5, 0)), Vector((-sg * 0.6, a.y + 33.5, 0.55))]")
exec(compile(code, SRC, "exec"))
# (after the model's own script, which reads the same arguments for its own camera)
W = int(argv[3]) if len(argv) > 3 else 1600
H = int(argv[4]) if len(argv) > 4 else 1600
SAMPLES = int(argv[5]) if len(argv) > 5 else 96
AZ = float(argv[6]) if len(argv) > 6 else -0.38
EL = float(argv[7]) if len(argv) > 7 else 1.02

sc = bpy.context.scene
# the box: 66 x 54 x 34 mm, its lid 11 mm deep; the pendant lies on it a little in front of centre
BX, BY, BZ, LID = 66.0, 54.0, 34.0, 11.0
CY = 15.0                                   # the box's centre lies behind the pendant
def boxmesh(name, sx, sy, sz, z0, bevel, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, CY, z0 + sz / 2)); o = bpy.context.active_object; o.name = name
    o.scale = (sx, sy, sz); bpy.ops.object.transform_apply(scale=True)
    m = o.modifiers.new("bevel", "BEVEL"); m.width = bevel; m.segments = 8; m.limit_method = "NONE"
    for p in o.data.polygons: p.use_smooth = True
    o.data.materials.append(mat); return o
lac = bpy.data.materials.new("lacquer"); lac.use_nodes = True; lb = lac.node_tree.nodes["Principled BSDF"]
lb.inputs["Base Color"].default_value = (0.006, 0.006, 0.007, 1); lb.inputs["Roughness"].default_value = 0.12
lb.inputs["Coat Weight"].default_value = 1.0; lb.inputs["Coat Roughness"].default_value = 0.025
rg = bpy.data.materials.new("rose gold"); rg.use_nodes = True; rb = rg.node_tree.nodes["Principled BSDF"]
rb.inputs["Base Color"].default_value = (0.93, 0.66, 0.53, 1); rb.inputs["Metallic"].default_value = 1.0; rb.inputs["Roughness"].default_value = 0.16
base = boxmesh("box", BX, BY, BZ - LID - 0.6, -BZ, 2.2, lac)
lid = boxmesh("lid", BX + 0.4, BY + 0.4, LID, -LID, 2.6, lac)
band = boxmesh("band", BX + 0.9, BY + 0.9, 1.6, -LID - 1.4, 0.5, rg)

# a floor that only catches the shadow; everything else is see-through
bpy.ops.mesh.primitive_plane_add(size=3000, location=(0, 0, -BZ)); floor = bpy.context.active_object; floor.is_shadow_catcher = True
sc.render.film_transparent = True

# ── the studio: a white room's soft light, and dark flags for the stones' drawing
AIM = bpy.data.objects.new("aim", None); sc.collection.objects.link(AIM); AIM.location = (7, 8, -12)
def aim(o, axis="TRACK_NEGATIVE_Z"):
    c = o.constraints.new("TRACK_TO"); c.target = AIM; c.track_axis = axis; c.up_axis = "UP_Y"
def area(name, size, loc, power, sy=None, color=(1, 1, 1)):
    l = bpy.data.lights.new(name, "AREA"); l.shape = "RECTANGLE"; l.size = size; l.size_y = sy or size; l.energy = power; l.color = color
    o = bpy.data.objects.new(name, l); sc.collection.objects.link(o); o.location = loc; aim(o); return o
area("key", 140, (-180, -40, 340), 1.5e6)              # the big soft key, high and to the left: the box's long soft shadow falls right and back
area("fill", 300, (260, -260, 160), 1.6e5)             # a broad fill from the front right
area("strip", 40, (-260, 80, 120), 2.2e5, sy=300)      # a strip at the left edge: a clean line along the lacquer and the metal
area("back", 200, (60, 360, 220), 3.0e5, color=(1, .98, .95))
for i in range(18):                                    # small hot lamps: the diamonds' fire
    a = i * 2.399; zz = 0.35 + 0.6 * ((i * 0.618) % 1); rr = math.sqrt(1 - zz * zz)
    l = bpy.data.lights.new(f"spark{i}", "POINT"); l.energy = 2.4e5; l.shadow_soft_size = 1.5
    o = bpy.data.objects.new(f"spark{i}", l); sc.collection.objects.link(o); o.location = (math.cos(a) * rr * 420, math.sin(a) * rr * 420 - 60, zz * 420)
def card(name, size, loc, shade):
    bpy.ops.mesh.primitive_plane_add(size=size, location=loc); o = bpy.context.active_object; o.name = name; aim(o, "TRACK_Z")
    m = bpy.data.materials.new(name); m.use_nodes = True; nb = m.node_tree.nodes["Principled BSDF"]; nb.inputs["Base Color"].default_value = (shade, shade, shade, 1); nb.inputs["Roughness"].default_value = 1
    o.data.materials.append(m); o.visible_camera = False; o.visible_shadow = False
card("flag L", 160, (-200, -120, 200), 0.004)          # dark cards where the faces look: black facets, drawing in the metal
card("flag R", 160, (220, -40, 260), 0.004)
# a soft white reflector above the camera, unseen by it: the pavé's tables look up into it and read white
bpy.ops.mesh.primitive_plane_add(size=220, location=(-30, -70, 300)); refl = bpy.context.active_object; aim(refl, "TRACK_Z")
rm = bpy.data.materials.new("reflector"); rm.use_nodes = True; nt = rm.node_tree; nt.nodes.clear()
em = nt.nodes.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = 2.6; outn = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(em.outputs[0], outn.inputs[0])
refl.data.materials.append(rm); refl.visible_camera = False; refl.visible_shadow = False
world = bpy.data.worlds.new("w"); sc.world = world; world.use_nodes = True
bg = world.node_tree.nodes["Background"]; bg.inputs["Color"].default_value = (0.05, 0.05, 0.052, 1); bg.inputs["Strength"].default_value = 1.0

# ── the camera: in front and to one side, looking down at the lid
cam = bpy.data.cameras.new("cam"); cam.lens = 85; cam.sensor_width = 36
co = bpy.data.objects.new("cam", cam); sc.collection.objects.link(co); sc.camera = co
dist = float(argv[8]) if len(argv) > 8 else 215
co.location = Vector((dist * math.cos(EL) * math.sin(AZ), -dist * math.cos(EL) * math.cos(AZ), dist * math.sin(EL)))
aim(co)

sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
sc.cycles.max_bounces = 12; sc.cycles.transmission_bounces = 12; sc.cycles.glossy_bounces = 8
sc.render.resolution_x = W; sc.render.resolution_y = H; sc.render.resolution_percentage = 100
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"
sc.render.filepath = argv[2]
bpy.ops.render.render(write_still=True)
print("rendered", argv[2])
