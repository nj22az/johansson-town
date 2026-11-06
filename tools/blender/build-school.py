"""Minato Elementary & Junior High School (港小中学校), the campus. Blender 4.2+.
Run: blender -b --python tools/blender/build-school.py -- --root .
 or, with the bpy module installed: python tools/blender/build-school.py -- --root .

A rural Okinawan port school as it stood in 1997: one two-storey reinforced-concrete
block from the early seventies, flat-roofed and built for typhoons, painted off-white
with a seafoam band and streaked black with mould from the parapets and brown with rust
from under every window bracket. Deep concrete sunshades run over the sea-side windows;
the field side is an open breezeway under the upper corridor. Water tanks on the roof,
a stair tower with the clock, a bike shed under rusted zinc, a trough of brass push taps
for sandy feet, iron bars, a flagpole with horn speakers, shisa on the gateposts, and the
seawall and tetrapods that keep the sea off it.

Authored in town (world) metres, measurements from src/world/school-layout.js. The
hana-block screens, the yard, the fukugi, the signs and the clock hands are made at
runtime (src/world/school.js). Input coordinates are Three.js (x, y, z); Blender takes
(x, -z, y). Colour is baked into vertex colours on a handful of shared surfaces.
"""
import bpy, bmesh, math, sys, argparse, json, random
from pathlib import Path

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
p = argparse.ArgumentParser(); p.add_argument('--root', required=True); a = p.parse_args(args)
root = Path(a.root).resolve()
out = root / 'assets/models/school'; out.mkdir(parents=True, exist_ok=True)
art = root / 'art/school'; art.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
rng = random.Random(1997)

# ------------------------------------------------------------------ measurements
# Mirrors SCHOOL in src/world/school-layout.js.
B = dict(minX=14.5, maxX=39.5, minZ=40.5, maxZ=48.5, floor=.15, storey=3.3, roof=6.75, parapet=7.45)
COR = dict(minZ=38.1, maxZ=40.5)
BAYS = 7
TOWER = dict(minX=18.4, maxX=22.6, minZ=40.5, maxZ=44.5, top=9.9)
GENKAN = dict(x=20.5, half=.95)
GATE = dict(x=20.5, half=1.75, z=24.6)
SEAWALL = dict(east=41, south=51.6, height=1.05)
SHED = dict(minX=12.8, maxX=17.4, minZ=25.3, maxZ=28)
WASH = dict(x=37.1, z=37.55, w=2.8, d=.7)
BARS = dict(x=38.3, z=32.5, w=2.6)
FLAG = dict(x=30.5, z=37.35)
SAND = dict(minX=35.8, maxX=39.4, minZ=29.6, maxZ=31.6)
COLUMNS = [B['minX'] + i * (B['maxX'] - B['minX']) / BAYS for i in range(BAYS + 1)]
BAY = (B['maxX'] - B['minX']) / BAYS

def lin(h): return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))
FIN = {}
def fin(name, colour, rough=.85, kind=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    bs = m.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = (*lin(colour), 1); bs.inputs['Roughness'].default_value = rough
    m['surface'] = kind or ('gloss' if rough < .5 else 'matte'); FIN[name] = m; return m

F = dict(
    wall=fin('Off-white paint', 'e4e1d3', .92),
    band=fin('Seafoam paint', 'a9cbbd', .9),
    trim=fin('White trim', 'efece2', .88),
    concrete=fin('Bare concrete', 'a8a598', .95),
    slab=fin('Slab soffit', 'c9c6b8', .95),
    floor=fin('Corridor floor', '9b9a90', .9),
    step=fin('Terrazzo step', 'b8b2a2', .7),
    glass=fin('Window glass', '3c4d52', .18, 'gloss'),
    frame=fin('Aluminium frame', 'b9bcb8', .35, 'metal'),
    curtain=fin('Canvas curtain', 'd9ceb0', .95),
    door=fin('Steel door green', '587a6a', .6),
    dark=fin('Shadowed recess', '2e302d', .95),
    tank=fin('Water tank blue', '5d8fa6', .5),
    tank2=fin('Water tank white', 'd9dcd6', .5),
    steel=fin('Galvanised steel', '8e948f', .45, 'metal'),
    rust=fin('Rust', '7a4a2c', .9),
    zinc=fin('Rusted zinc', '8c7d6a', .75),
    yellow=fin('Yellow paint', 'd9b43c', .6),
    blue=fin('Playground blue', '3f6f9a', .6),
    red=fin('Red paint', 'b0402f', .6),
    brass=fin('Brass', 'b89a4e', .35, 'metal'),
    tile=fin('Blue tile', '6f98a8', .4, 'gloss'),
    shisa=fin('Glazed shisa', 'a4563a', .55),
    shisa2=fin('Shisa mane', '6e3322', .6),
    rubber=fin('Tyre', '262626', .8),
    orange=fin('Soap net', 'e07a2c', .8),
    tetra=fin('Tetrapod concrete', '9d9a8f', .95),
    tetra2=fin('Tetrapod weathered', '8a887c', .95),
    speaker=fin('Horn speaker', 'c5c7c0', .5),
    clock=fin('Clock face', 'f2efe4', .6),
    black=fin('Black', '1e1e1e', .6),
    lamp=fin('Corridor lamp', 'f4ecd2', .6, 'warm'),
    stain=fin('Stain', 'e4e1d3', .92, 'stain'),
)

def loc(v): return (v[0], -v[2], v[1])
def cube(name, size, at, m, ry=0., rx=0., rz=0., bevel=0.):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc(at))
    o = bpy.context.object; o.name = name; o.scale = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.rotation_euler = (rx, rz, ry); o.data.materials.append(m)
    if bevel:
        b = o.modifiers.new('Worked edges', 'BEVEL'); b.width = min(bevel, min(size) / 3); b.segments = 1
        bpy.ops.object.modifier_apply(modifier=b.name)
    return o
def box(name, x0, x1, y0, y1, z0, z1, m, bevel=0.):
    return cube(name, (x1 - x0, y1 - y0, z1 - z0), ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), m, bevel=bevel)
def cyl(name, r, h, at, m, verts=12, rx=0., ry=0., rz=0.):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc(at))
    o = bpy.context.object; o.name = name; o.rotation_euler = (rx, rz, ry); o.data.materials.append(m)
    for f in o.data.polygons: f.use_smooth = verts > 8
    return o
def cone(name, r1, r2, h, at, m, verts=10, rx=0., ry=0., rz=0.):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=h, location=loc(at))
    o = bpy.context.object; o.name = name; o.rotation_euler = (rx, rz, ry); o.data.materials.append(m); return o
def ball(name, s, at, m, seg=10, rings=6):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=1, location=loc(at))
    o = bpy.context.object; o.name = name; o.scale = (s[0], s[2], s[1]); o.data.materials.append(m)
    for f in o.data.polygons: f.use_smooth = True
    return o
def rod(name, a, b, r, m, verts=8):
    """A cylinder from point a to point b (Three coordinates)."""
    from mathutils import Vector
    A, Bv = Vector(loc(a)), Vector(loc(b)); d = Bv - A
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d.length, location=(A + Bv) / 2)
    o = bpy.context.object; o.name = name
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = d.to_track_quat('Z', 'Y')
    o.data.materials.append(m); return o

def streak(name, x, top, length, width, z, face, dark, wall_hex, m):
    """A stain running down a wall: dark at the top, fading into the paint below.
    face is +1 for a wall facing +z, -1 for -z, and 'x+'/'x-' for walls facing along x."""
    bm = bmesh.new(); rows = 4
    verts = []
    for r in range(rows + 1):
        y = top - length * r / rows
        for c in (-1, 1):
            if face in (1, -1): p = (x + c * width / 2 * (1 - .35 * r / rows), y, z)
            else: p = (x, y, z + c * width / 2 * (1 - .35 * r / rows))
            verts.append(bm.verts.new(loc(p)))
    for r in range(rows):
        a0, a1, b0, b1 = verts[r * 2], verts[r * 2 + 1], verts[r * 2 + 2], verts[r * 2 + 3]
        bm.faces.new((a0, a1, b1, b0))
    # Turn every face to look out of the wall it is painted on.
    from mathutils import Vector
    out = {1: Vector((0, -1, 0)), -1: Vector((0, 1, 0)), 'x+': Vector((1, 0, 0)), 'x-': Vector((-1, 0, 0))}[face]
    bm.normal_update()
    wrong = [f for f in bm.faces if f.normal.dot(out) < 0]
    if wrong: bmesh.ops.reverse_faces(bm, faces=wrong)
    mesh = bpy.data.meshes.new(name); bm.to_mesh(mesh); bm.free()
    o = bpy.data.objects.new(name, mesh); bpy.context.collection.objects.link(o); o.data.materials.append(m)
    base, stain = lin(wall_hex), lin(dark)
    layer = o.data.color_attributes.new(name='Col', type='BYTE_COLOR', domain='CORNER')
    for poly in o.data.polygons:
        for li in poly.loop_indices:
            vi = o.data.loops[li].vertex_index; t = (vi // 2) / rows
            k = .85 * (1 - t) ** 1.15
            layer.data[li].color = (*(stain[i] * k + base[i] * (1 - k) for i in range(3)), 1)
    return o

# ------------------------------------------------------------------ walls with openings
def wall_x(name, x0, x1, y0, y1, z, t, m, openings):
    """A wall along x at plane z (thickness t, centred), with rectangular openings
    (ox0, ox1, oy0, oy1). The solid is the grid cells no opening covers."""
    xs = sorted({x0, x1, *[v for o in openings for v in (o[0], o[1])]})
    ys = sorted({y0, y1, *[v for o in openings for v in (o[2], o[3])]})
    for i in range(len(xs) - 1):
        for j in range(len(ys) - 1):
            cx, cy = (xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2
            if any(o[0] < cx < o[1] and o[2] < cy < o[3] for o in openings): continue
            box(name, xs[i], xs[i + 1], ys[j], ys[j + 1], z - t / 2, z + t / 2, m)

def window(x0, x1, y0, y1, z, face, panes=4, curtain=None):
    """Recessed aluminium sash window in a wall at plane z; face +1 = outside is +z."""
    inset = .1 * face
    box('Glass', x0, x1, y0, y1, z - .01 + inset * 0, z + .01, F['glass'])
    fz = z + face * .03
    for x in (x0, x1): box('Sash', x - .03, x + .03, y0, y1, fz - .025, fz + .025, F['frame'])
    for y in (y0, y1): box('Sash', x0, x1, y - .03, y + .03, fz - .025, fz + .025, F['frame'])
    for k in range(1, panes):
        xm = x0 + (x1 - x0) * k / panes
        box('Mullion', xm - .02, xm + .02, y0, y1, fz - .02, fz + .02, F['frame'])
    box('Transom bar', x0, x1, y0 + (y1 - y0) * .72 - .02, y0 + (y1 - y0) * .72 + .02, fz - .02, fz + .02, F['frame'])
    if curtain:   # drawn canvas curtains seen through the glass, bunched unevenly
        for (cx0, cx1) in curtain:
            box('Curtain', cx0, cx1, y0 + .05, y1 - .05, z - face * .06, z - face * .04, F['curtain'])
    box('Sill', x0 - .05, x1 + .05, y0 - .07, y0, z + face * .02, z + face * .12, F['trim'])

# ================================================================== the block
x0, x1, z0, z1 = B['minX'], B['maxX'], B['minZ'], B['maxZ']
S, FL = B['storey'], B['floor']
# Plinth under block and breezeway.
box('Plinth', x0 - .3, x1 + .3, 0, FL, COR['minZ'], z1 + .3, F['concrete'])
box('Corridor floor', x0 - .1, x1 + .1, FL, FL + .01, COR['minZ'] + .05, z0, F['floor'])

# Sea face (south): big windows under deep concrete sunshades, both floors.
openS = []
for level in (0, 1):
    base = FL + level * S
    for i in range(BAYS):
        bx0 = x0 + i * BAY + .25; bx1 = x0 + (i + 1) * BAY - .25
        openS.append((bx0, bx1, base + .95, base + 2.75))
wall_x('Sea wall', x0, x1, FL, B['roof'], z1, .24, F['wall'], openS)
for (ox0, ox1, oy0, oy1) in openS:
    k = rng.random()
    cur = [(ox0 + .05, ox0 + .05 + (ox1 - ox0) * (.18 + .2 * k))] + ([(ox1 - .05 - (ox1 - ox0) * .22, ox1 - .05)] if k > .3 else [])
    window(ox0, ox1, oy0, oy1, z1 + .02, 1, 4, cur)
for level in (0, 1):
    y = FL + level * S + 2.95
    box('Sunshade', x0 - .2, x1 + .2, y, y + .13, z1, z1 + .75, F['slab'])
    box('Sunshade edge', x0 - .2, x1 + .2, y - .05, y + .15, z1 + .72, z1 + .8, F['trim'])
# The seafoam band at the foot and at the floor line.
box('Foot band', x0, x1, FL, FL + .55, z1 + .12, z1 + .135, F['band'])
box('Floor band', x0, x1, FL + S - .12, FL + S + .18, z1 + .12, z1 + .135, F['band'])

# Field face (north): doors and high windows along both corridors.
openN = []
for level in (0, 1):
    base = FL + level * S
    for i in range(BAYS):
        bx0 = x0 + i * BAY
        if level == 0 and bx0 < GENKAN['x'] < bx0 + BAY:
            openN.append((GENKAN['x'] - GENKAN['half'] - .35, GENKAN['x'] + GENKAN['half'] + .35, base, base + 2.35))
            continue
        openN.append((bx0 + .35, bx0 + 1.2, base, base + 2.05))                   # sliding door
        openN.append((bx0 + 1.45, bx0 + BAY - .3, base + 1.0, base + 2.05))       # corridor windows
        openN.append((bx0 + .35, bx0 + BAY - .3, base + 2.3, base + 2.8))         # transom
wall_x('Corridor wall', x0, x1, FL, B['roof'], z0, .22, F['wall'], openN)
for (ox0, ox1, oy0, oy1) in openN:
    h = oy1 - oy0
    if abs((ox0 + ox1) / 2 - GENKAN['x']) < .1 and h > 2.2:
        box('Genkan dark', ox0, ox1, oy0, oy1, z0 - .05, z0 + .05, F['dark'])
        for x in (ox0 + .5, ox1 - .5):
            box('Entrance glass', x - .5, x + .45, oy0, oy1 - .1, z0 - .12, z0 - .1, F['glass'])
            for dx in (-.5, .45): box('Entrance frame', x + dx - .03, x + dx + .03, oy0, oy1 - .1, z0 - .14, z0 - .1, F['frame'])
            box('Push bar', x - .35, x + .3, oy0 + 1.0, oy0 + 1.04, z0 - .17, z0 - .13, F['frame'])
        continue
    if h > 1.8:    # the classroom's sliding door: steel, with a small window
        box('Door', ox0, ox1, oy0, oy1, z0 - .05, z0 + .05, F['door'])
        box('Door window', ox0 + .15, ox1 - .15, oy0 + 1.2, oy0 + 1.8, z0 - .07, z0 - .05, F['glass'])
        box('Door pull', ox1 - .12, ox1 - .08, oy0 + .9, oy0 + 1.1, z0 - .09, z0 - .05, F['frame'])
    else:
        window(ox0, ox1, oy0, oy1, z0 - .02, -1, max(2, int((ox1 - ox0) / .9)))
box('Corridor dado', x0, x1, FL, FL + .9, z0 - .125, z0 - .11, F['band'])
box('Upper dado', x0, x1, FL + S, FL + S + .9, z0 - .125, z0 - .11, F['band'])

# End walls, with a small stair window each.
for x, face in ((x0, -1), (x1, 1)):
    box('End wall', x - .12, x + .12, FL, B['roof'], z0, z1, F['wall'])
    for level in (0, 1):
        yb = FL + level * S + 1.2
        box('End window glass', x + face * .125, x + face * .135, yb, yb + 1.1, 45.4, 46.6, F['glass'])
        box('End window frame', x + face * .12, x + face * .15, yb - .04, yb + 1.14, 45.36, 45.42, F['frame'])
        box('End window frame', x + face * .12, x + face * .15, yb - .04, yb + 1.14, 46.58, 46.64, F['frame'])

# Upper corridor slab, its edge beam, columns, and the roof over it all.
box('Upper corridor slab', x0 - .15, x1 + .15, FL + S - .15, FL + S, COR['minZ'], z0, F['slab'])
box('Corridor edge beam', x0 - .15, x1 + .15, FL + S - .45, FL + S + .2, COR['minZ'], COR['minZ'] + .2, F['wall'])
box('Upstand', x0 - .15, x1 + .15, FL + S + .2, FL + S + .35, COR['minZ'], COR['minZ'] + .2, F['trim'])
for x in COLUMNS:
    box('Column', x - .2, x + .2, FL, B['roof'], COR['minZ'], COR['minZ'] + .4, F['wall'])
box('Roof slab', x0 - .35, x1 + .35, B['roof'] - .2, B['roof'], COR['minZ'] - .2, z1 + .35, F['slab'])
box('Roof edge', x0 - .35, x1 + .35, B['roof'] - .45, B['roof'] - .15, COR['minZ'] - .25, COR['minZ'] - .15, F['wall'])
# Parapet all round.
P = B['parapet']
box('Parapet', x0 - .35, x1 + .35, B['roof'], P, COR['minZ'] - .25, COR['minZ'] - .05, F['wall'])
box('Parapet', x0 - .35, x1 + .35, B['roof'], P, z1 + .15, z1 + .35, F['wall'])
for x in (x0 - .35, x1 + .15): box('Parapet', x, x + .2, B['roof'], P, COR['minZ'] - .25, z1 + .35, F['wall'])
box('Coping', x0 - .4, x1 + .4, P, P + .06, COR['minZ'] - .3, COR['minZ'], F['trim'])
box('Coping', x0 - .4, x1 + .4, P, P + .06, z1 + .1, z1 + .4, F['trim'])
# Corridor ceiling lamps, one per bay on each level.
for level in (0, 1):
    for i in range(BAYS):
        cx = x0 + (i + .5) * BAY
        box('Corridor lamp', cx - .45, cx + .45, FL + (level + 1) * S - .24, FL + (level + 1) * S - .18, 39.2, 39.4, F['lamp'])

# The genkan's steps and the grille in front of it.
g = GENKAN['x']
box('Genkan step', g - 1.5, g + 1.5, FL, FL + .12, COR['minZ'] + .8, z0 - .1, F['step'])
for k in range(14): box('Drain grille', g - 1.3 + k * .2, g - 1.26 + k * .2, 0.005, .02, COR['minZ'] - .6, COR['minZ'] - .05, F['steel'])

# ------------------------------------------------------------------ stair tower + clock
T = TOWER
box('Tower', T['minX'], T['maxX'], B['roof'], T['top'], T['minZ'] - .1, T['maxZ'], F['wall'])
box('Tower coping', T['minX'] - .1, T['maxX'] + .1, T['top'], T['top'] + .08, T['minZ'] - .2, T['maxZ'] + .1, F['trim'])
box('Tower band', T['minX'], T['maxX'], T['top'] - .6, T['top'] - .35, T['minZ'] - .115, T['minZ'] - .1, F['band'])
cyl('Clock rim', .78, .1, (20.5, 8.35, T['minZ'] - .15), F['frame'], 32, rx=math.pi / 2)
cyl('Clock face', .7, .02, (20.5, 8.35, T['minZ'] - .205), F['clock'], 32, rx=math.pi / 2)
for k in range(12):
    a = k / 12 * math.tau
    box('Clock mark', 20.5 + .6 * math.sin(a) - .02, 20.5 + .6 * math.sin(a) + .02, 8.35 + .6 * math.cos(a) - .06, 8.35 + .6 * math.cos(a) + .06, T['minZ'] - .225, T['minZ'] - .215, F['black'])
box('Tower window', 21.1, 22.0, 7.1, 7.6, T['minZ'] - .12, T['minZ'] - .1, F['glass'])
box('Roof door', 18.9, 19.8, B['roof'], B['roof'] + 2.0, T['maxZ'], T['maxZ'] + .05, F['door'])

# ------------------------------------------------------------------ roof kit
for tx, m in ((29.5, F['tank']), (32.0, F['tank2'])):
    for dx in (-.55, .55):
        for dz in (-.55, .55): box('Tank stand', tx + dx - .04, tx + dx + .04, B['roof'], B['roof'] + .9, 45.5 + dz - .04, 45.5 + dz + .04, F['steel'])
    box('Tank stand deck', tx - .7, tx + .7, B['roof'] + .9, B['roof'] + .96, 44.8, 46.2, F['steel'])
    cyl('Water tank', .85, 1.7, (tx, B['roof'] + 1.81, 45.5), m, 20)
    cyl('Tank lid', .3, .12, (tx, B['roof'] + 2.72, 45.5), m, 14)
    rod('Tank pipe', (tx + .7, B['roof'] + .95, 45.5), (tx + .7, B['roof'] + .05, 45.5), .04, F['steel'])
    rod('Tank pipe', (tx + .7, B['roof'] + .05, 45.5), (tx + 2.4, B['roof'] + .05, 45.5), .04, F['steel'])
cube('Roof vent', (.7, .6, .7), (35.5, B['roof'] + .3, 44), F['concrete'])
cube('Roof vent cap', (.9, .06, .9), (35.5, B['roof'] + .63, 44), F['concrete'])
rod('Lightning rod', (37.0, B['roof'], 43.0), (37.0, B['roof'] + 3.2, 43.0), .03, F['steel'])
# Horn speakers on the tower's corner, facing the field and the harbour.
for side in (-1, 1):
    rod('Speaker arm', (T['maxX'] if side > 0 else T['minX'], 9.3, T['minZ'] + .3), (T['maxX'] + side * .5 if side > 0 else T['minX'] - .5, 9.3, T['minZ'] + .3), .03, F['steel'])
    cone('Horn speaker', .28, .09, .55, ((T['maxX'] + .55) if side > 0 else (T['minX'] - .55), 9.15, T['minZ'] - .05), F['speaker'], 14, rx=math.pi / 2 + .25)

# ------------------------------------------------------------------ weathering
# Mould from the parapets and sunshades; rust from every window bracket.
def stains():
    """Every stain is kept on solid wall: a streak that runs past the bottom of a beam
    hangs in the air, and catches the sun as a white spike."""
    NZ = COR['minZ'] - .253                     # the parapet and roof edge, one plane
    for k in range(40):
        x = x0 + .2 + rng.random() * (x1 - x0 - .4)
        streak('Mould streak', x, P, rng.uniform(.35, P - (B['roof'] - .45) - .02), rng.uniform(.12, .5), NZ, -1, '2f3430', 'e4e1d3', F['stain'])
    for k in range(30):                          # the upper corridor's edge beam
        x = x0 + .2 + rng.random() * (x1 - x0 - .4)
        streak('Mould streak', x, FL + S + .2, rng.uniform(.2, .6), rng.uniform(.1, .4), COR['minZ'] - .003, -1, '3a3f39', 'e4e1d3', F['stain'])
    for x in COLUMNS:                            # the columns, from under the roof edge
        for level in (0, 1):
            if rng.random() < .7:
                top = B['roof'] - .5 if level else FL + S - .5
                streak('Mould streak', x + rng.uniform(-.08, .08), top, rng.uniform(.5, 1.6), rng.uniform(.12, .28), COR['minZ'] - .003, -1, '363b36', 'e4e1d3', F['stain'])
    for k in range(40):                          # the sea-side parapet
        x = x0 + .2 + rng.random() * (x1 - x0 - .4)
        streak('Mould streak', x, P, rng.uniform(.3, .68), rng.uniform(.15, .6), z1 + .353, 1, '2c312d', 'e4e1d3', F['stain'])
    for level in (0, 1):                         # down the piers between the windows
        for i in range(BAYS + 1):
            if rng.random() < .8:
                x = x0 + i * BAY
                streak('Mould streak', x + rng.uniform(-.06, .06), FL + level * S + 2.92, rng.uniform(.8, 2.2), rng.uniform(.18, .34), z1 + .123, 1, '353a35', 'e4e1d3', F['stain'])
    for (ox0, ox1, oy0, oy1) in openS:           # rust from the window brackets
        for x in (ox0 + .15, ox1 - .15):
            if rng.random() < .75: streak('Rust run', x, oy0 - .08, rng.uniform(.35, .75), rng.uniform(.04, .09), z1 + .123, 1, '6e3b1e', 'e4e1d3', F['stain'])
    for x, face in ((x0 - .123, 'x-'), (x1 + .123, 'x+')):
        for k in range(10):
            z = z0 + .3 + rng.random() * (z1 - z0 - .6)
            if 45.1 < z < 46.9: continue         # the stair windows
            streak('Mould streak', x, B['roof'] - .05, rng.uniform(.6, 2.2), rng.uniform(.2, .7), z, face, '2d322e', 'e4e1d3', F['stain'])
    for k in range(6):
        x = T['minX'] + .2 + rng.random() * (T['maxX'] - T['minX'] - .4)
        if abs(x - 20.5) < .9: continue          # the clock
        streak('Mould streak', x, T['top'], rng.uniform(.4, 1.3), rng.uniform(.15, .45), T['minZ'] - .103, -1, '2d322e', 'e4e1d3', F['stain'])
stains()

# ================================================================== the grounds
# Gateposts, the sliding gate drawn back, and the shisa: open mouth on the right,
# closed on the left, as they are always set.
def shisa(x, z, open_mouth, facing=-1):
    y = 1.62
    ball('Shisa body', (.2, .2, .26), (x, y + .2, z + .02), F['shisa'])
    for dx in (-.1, .1):
        cyl('Shisa leg', .05, .25, (x + dx, y + .1, z - .12), F['shisa'], 8)
    ball('Shisa chest', (.17, .2, .14), (x, y + .33, z - .12), F['shisa'])
    ball('Shisa head', (.19, .17, .17), (x, y + .55, z - .2), F['shisa'])
    ball('Shisa mane', (.24, .2, .14), (x, y + .58, z - .12), F['shisa2'], 12, 7)
    for dx in (-.08, .08):
        ball('Shisa eye', (.045, .04, .03), (x + dx, y + .62, z - .34), F['shisa2'], 8, 5)
        ball('Shisa ear', (.05, .05, .04), (x + dx * 1.9, y + .7, z - .16), F['shisa2'], 8, 5)
    ball('Shisa snout', (.1, .06, .07), (x, y + .5, z - .34), F['shisa'], 8, 5)
    if open_mouth:
        box('Shisa mouth', x - .07, x + .07, y + .4, y + .45, z - .38, z - .33, F['shisa2'])
        for dx in (-.045, .045): cone('Shisa tooth', .015, 0, .04, (x + dx, y + .43, z - .37), F['trim'], 6)
    ball('Shisa tail', (.06, .14, .06), (x, y + .42, z + .24), F['shisa2'], 8, 5)
for side, open_mouth in ((-1, False), (1, True)):
    gx = GATE['x'] + side * GATE['half']
    box('Gatepost', gx - .3, gx + .3, 0, 1.55, GATE['z'] - .3, GATE['z'] + .3, F['concrete'], bevel=.02)
    box('Gatepost cap', gx - .36, gx + .36, 1.55, 1.63, GATE['z'] - .36, GATE['z'] + .36, F['trim'])
    shisa(gx, GATE['z'], open_mouth)
# The sliding gate, pushed back against the west windbreak, and its rail.
for k in range(12):
    gx = GATE['x'] - GATE['half'] - .45 - k * .26
    box('Gate bar', gx - .015, gx + .015, .08, 1.35, GATE['z'] + .15, GATE['z'] + .18, F['steel'])
box('Gate rail', GATE['x'] - GATE['half'] - 3.5, GATE['x'] - GATE['half'] - .35, 1.3, 1.36, GATE['z'] + .13, GATE['z'] + .2, F['steel'])
box('Gate rail', GATE['x'] - GATE['half'] - 3.5, GATE['x'] - GATE['half'] - .35, .08, .14, GATE['z'] + .13, GATE['z'] + .2, F['steel'])
for k in range(2): cyl('Gate wheel', .07, .04, (GATE['x'] - GATE['half'] - .6 - k * 2.4, .07, GATE['z'] + .165), F['black'], 10, rx=math.pi / 2)

# Bike shed: steel posts, a rusted corrugated zinc roof sloping back, bikes in a rack.
s = SHED
for x in (s['minX'] + .1, (s['minX'] + s['maxX']) / 2, s['maxX'] - .1):
    for z, h in ((s['minZ'] + .95, 2.15), (s['maxZ'] - .1, 1.85)):
        box('Shed post', x - .04, x + .04, 0, h, z - .04, z + .04, F['steel'])
roof_len = s['maxZ'] - s['minZ'] - .6
for k in range(int((s['maxX'] - s['minX'] + .4) / .12)):
    x = s['minX'] - .2 + k * .12
    m = F['zinc'] if rng.random() > .35 else F['rust']
    cube('Zinc sheet', (.07, .02, roof_len + .3), (x, 2.02 + (k % 2) * .02, (s['minZ'] + .95 + s['maxZ'] - .1) / 2 - .15), m, rx=-.1)
box('Shed beam', s['minX'], s['maxX'], 2.1, 2.16, s['minZ'] + .9, s['minZ'] + 1.0, F['steel'])
box('Rack rail', s['minX'] + .2, s['maxX'] - .2, .35, .39, s['maxZ'] - .5, s['maxZ'] - .46, F['steel'])
def bicycle(x, z, colour):
    for dz in (-.52, .52):
        bpy.ops.mesh.primitive_torus_add(major_segments=20, minor_segments=5, major_radius=.31, minor_radius=.025, location=loc((x, .33, z + dz)))
        o = bpy.context.object; o.rotation_euler = (0, math.pi / 2, 0); o.data.materials.append(F['rubber'])
    rod('Bike frame', (x, .35, z - .5), (x, .78, z - .15), .022, colour)
    rod('Bike frame', (x, .35, z + .5), (x, .72, z + .1), .022, colour)
    rod('Bike frame', (x, .72, z + .1), (x, .78, z - .15), .022, colour)
    rod('Bike frame', (x, .35, z + .02), (x, .72, z + .1), .022, colour)
    rod('Bike frame', (x, .35, z + .02), (x, .35, z + .5), .02, colour)
    rod('Handlebar', (x - .24, .98, z - .5), (x + .24, .98, z - .5), .018, F['steel'])
    rod('Stem', (x, .78, z - .15), (x, .98, z - .5), .02, colour)
    cube('Saddle', (.12, .05, .22), (x, .86, z + .12), F['black'])
    cube('Basket', (.3, .22, .24), (x, .9, z - .68), F['steel'])
for k, colour in enumerate((F['red'], F['blue'], F['yellow'], F['door'], F['red'], F['blue'])):
    bicycle(s['minX'] + .45 + k * .72, s['maxZ'] - .9, colour)

# Wash station: a concrete trough on legs, blue-tiled splashback, brass push taps.
w = WASH
box('Trough', w['x'] - w['w'] / 2, w['x'] + w['w'] / 2, .55, .82, w['z'] - w['d'] / 2, w['z'] + w['d'] / 2, F['concrete'], bevel=.02)
box('Trough well', w['x'] - w['w'] / 2 + .08, w['x'] + w['w'] / 2 - .08, .8, .83, w['z'] - w['d'] / 2 + .08, w['z'] + w['d'] / 2 - .08, F['dark'])
for dx in (-w['w'] / 2 + .2, 0, w['w'] / 2 - .2): box('Trough leg', w['x'] + dx - .12, w['x'] + dx + .12, 0, .55, w['z'] - .2, w['z'] + .2, F['concrete'])
box('Splashback', w['x'] - w['w'] / 2, w['x'] + w['w'] / 2, .82, 1.25, w['z'] + w['d'] / 2 - .08, w['z'] + w['d'] / 2, F['tile'])
box('Pipe', w['x'] - w['w'] / 2, w['x'] + w['w'] / 2, 1.14, 1.18, w['z'] + w['d'] / 2 - .14, w['z'] + w['d'] / 2 - .1, F['steel'])
for k in range(6):
    tx = w['x'] - w['w'] / 2 + .25 + k * (w['w'] - .5) / 5
    cyl('Push tap', .03, .1, (tx, 1.1, w['z'] + w['d'] / 2 - .18), F['brass'], 10, rx=math.pi / 2)
    cyl('Tap head', .035, .05, (tx, 1.11, w['z'] + w['d'] / 2 - .25), F['brass'], 10)
    if k in (1, 4): cube('Soap net', (.07, .12, .05), (tx + .1, .98, w['z'] + w['d'] / 2 - .13), F['orange'])
# Rubber sandals left at the trough.
for dx in (-.6, -.45, .9):
    cube('Sandal', (.09, .02, .24), (w['x'] + dx, .01, w['z'] - .6), F['blue'] if dx < 0 else F['red'])

# Iron bars (tetsubō), three heights, paint worn to rust at the grips.
b = BARS
for i, dx in enumerate((-b['w'] / 2, 0, b['w'] / 2)):
    box('Bar post', b['x'] + dx - .05, b['x'] + dx + .05, 0, 1.45, b['z'] - .05, b['z'] + .05, F['yellow'])
for i, (xa, xb, h) in enumerate(((-b['w'] / 2, 0, .8), (0, b['w'] / 2, 1.2))):
    rod('Iron bar', (b['x'] + xa, h, b['z']), (b['x'] + xb, h, b['z']), .02, F['steel'])
    rod('Rust grip', (b['x'] + (xa + xb) / 2 - .25, h, b['z']), (b['x'] + (xa + xb) / 2 + .25, h, b['z']), .021, F['rust'])
# Sandpit kerb.
sp = SAND
for (a0, a1, c0, c1) in ((sp['minX'], sp['maxX'], sp['minZ'] - .15, sp['minZ']), (sp['minX'], sp['maxX'], sp['maxZ'], sp['maxZ'] + .15),
                         (sp['minX'] - .15, sp['minX'], sp['minZ'] - .15, sp['maxZ'] + .15), (sp['maxX'], sp['maxX'] + .15, sp['minZ'] - .15, sp['maxZ'] + .15)):
    box('Sandpit kerb', a0, a1, 0, .18, c0, c1, F['concrete'])
# A stack of old tyres half-buried as a climbing line along the field's west end.
for k in range(5):
    bpy.ops.mesh.primitive_torus_add(major_segments=18, minor_segments=6, major_radius=.3, minor_radius=.1, location=loc((13.8, .18, 30.5 + k * .75)))
    o = bpy.context.object; o.rotation_euler = (0, 0, 0); o.scale = (1, 1, 1.4); o.data.materials.append(F['rubber'] if k % 2 else F['blue'])

# Flagpole with its halyard and the horn speakers the chime comes out of.
fp = FLAG
cyl('Flagpole base', .3, .25, (fp['x'], .125, fp['z']), F['concrete'], 14)
rod('Flagpole', (fp['x'], .25, fp['z']), (fp['x'], 8.8, fp['z']), .055, F['steel'], 10)
ball('Flagpole finial', (.09, .09, .09), (fp['x'], 8.88, fp['z']), F['brass'])
rod('Halyard', (fp['x'] + .08, 1.2, fp['z']), (fp['x'] + .06, 8.7, fp['z']), .006, F['trim'], 4)
for a in (-.9, .9):
    cone('Horn speaker', .25, .08, .5, (fp['x'] + math.sin(a) * .35, 6.4, fp['z'] - math.cos(a) * .35), F['speaker'], 14, rx=math.pi / 2 - .2, ry=a)
# A low platform (chōrei-dai) in front of the field for morning assembly.
box('Assembly stand', 29.3, 31.3, 0, .55, 36.0, 36.9, F['concrete'], bevel=.02)
box('Assembly stand step', 29.8, 30.8, 0, .27, 35.6, 36.0, F['concrete'])

# ------------------------------------------------------------------ sea defences
SE, SS, SH = SEAWALL['east'], SEAWALL['south'], SEAWALL['height']
box('Seawall east', SE, SE + .6, -.4, SH, 24.6, SS + .6, F['concrete'])
box('Seawall south', 12, SE + .6, -.4, SH, SS, SS + .6, F['concrete'])
box('Seawall coping', SE - .05, SE + .65, SH, SH + .08, 24.6, SS + .65, F['trim'])
box('Seawall coping', 11.95, SE + .65, SH, SH + .08, SS - .05, SS + .65, F['trim'])
# Where the lawn's seawall ends, the campus wall turns out to meet it.
box('Seawall return', 33.55, SE, -.4, SH, 24.25, 24.85, F['concrete'])
for k in range(22):
    x = 12.3 + rng.random() * (SE - 12.6)
    streak('Salt stain', x, SH, rng.uniform(.3, .9), rng.uniform(.2, .6), SS - .003, -1, '6b6e67', 'a8a598', F['stain'])

def tetrapod(at, s, m):
    """Four tapering legs from one centre, at the corners of a tetrahedron."""
    from mathutils import Vector, Euler
    dirs = [Vector((1, 1, 1)), Vector((1, -1, -1)), Vector((-1, 1, -1)), Vector((-1, -1, 1))]
    rot = Euler((rng.uniform(0, math.tau), rng.uniform(0, math.tau), rng.uniform(0, math.tau)))
    for d in dirs:
        d = d.normalized(); d.rotate(rot)
        tip = (at[0] + d.x * s, at[1] + d.z * s, at[2] - d.y * s)
        o = rod('Tetrapod leg', at, tip, s * .28, m, 8)
        cone_obj = cone('Tetrapod foot', s * .28, s * .2, s * .12, tip, m, 8)
        cone_obj.rotation_mode = 'QUATERNION'; cone_obj.rotation_quaternion = o.rotation_quaternion
    ball('Tetrapod hub', (s * .36, s * .36, s * .36), at, m, 10, 6)
for k in range(15):   # along the east wall
    tetrapod((SE + 1.6 + rng.uniform(0, 3.2), rng.uniform(-.1, .5), 26 + k * 2.1 + rng.uniform(-.4, .4)), rng.uniform(.95, 1.25), F['tetra'] if k % 2 else F['tetra2'])
for k in range(16):   # and along the south
    tetrapod((13 + k * 2.1 + rng.uniform(-.4, .4), rng.uniform(-.1, .5), SS + 2.0 + rng.uniform(0, 3.0)), rng.uniform(.95, 1.25), F['tetra'] if k % 2 else F['tetra2'])
for k in range(4):
    tetrapod((SE + 2.5 + rng.uniform(-1, 1), rng.uniform(-.1, .4), SS + 2.4 + rng.uniform(-1, 1)), 1.1, F['tetra2'])

# ================================================================== export
def surface(name, rough, metal=0., vertex=True, glow=None, strength=0., colour=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nodes = m.node_tree.nodes; bs = nodes['Principled BSDF']
    bs.inputs['Roughness'].default_value = rough; bs.inputs['Metallic'].default_value = metal
    if vertex:
        attr = nodes.new('ShaderNodeVertexColor'); attr.layer_name = 'Col'
        m.node_tree.links.new(attr.outputs['Color'], bs.inputs['Base Color'])
    if colour: bs.inputs['Base Color'].default_value = (*lin(colour), 1)
    if glow:
        bs.inputs['Emission Color'].default_value = (*lin(glow), 1); bs.inputs['Emission Strength'].default_value = strength
    return m
SURFACES = {
    'matte': surface('School matte', .88), 'gloss': surface('School glazed', .35),
    'metal': surface('School metal', .4, .6),
    'warm': surface('School lamps', .7, vertex=False, colour='f4ecd2', glow='f7e7bd', strength=.6),
    # Stains are decals: flush with the wall, and drawn without depth at runtime.
    'stain': surface('School stains', .92),
}
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    m = o.data.materials[0]
    if 'Col' not in o.data.color_attributes:
        c = m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value
        layer = o.data.color_attributes.new(name='Col', type='BYTE_COLOR', domain='CORNER')
        for item in layer.data: item.color = (c[0], c[1], c[2], 1)
    o.data.materials[0] = SURFACES[m['surface']]
for key, m in SURFACES.items():
    chosen = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.data.materials[0] == m]
    if not chosen: continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in chosen: o.select_set(True)
    bpy.context.view_layer.objects.active = chosen[0]
    bpy.ops.object.join(); bpy.context.object.name = 'Minato school / ' + key
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
name = 'minato-school'
bpy.ops.wm.save_as_mainfile(filepath=str(art / (name + '.blend')), compress=True)
options = dict(filepath=str(out / (name + '.glb')), export_format='GLB', export_yup=True, export_animations=False, export_apply=True)
try: bpy.ops.export_scene.gltf(**options, export_vertex_color='MATERIAL')
except TypeError: bpy.ops.export_scene.gltf(**options)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
report = {'meshes': len(meshes), 'triangles': sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes),
          'bytes': (out / (name + '.glb')).stat().st_size}
(art / 'export-report.json').write_text(json.dumps({name: report}, indent=2))
print(name, report)
