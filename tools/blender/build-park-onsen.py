"""Umi-no-yu, the onsen on the east lawn. Blender 4.2+, metres, Principled glTF materials.
Run: blender -b --python tools/blender/build-park-onsen.py -- --root .
 or, with the bpy module installed: python tools/blender/build-park-onsen.py -- --root .

A small seaside hot spring of the kind a harbour town kept for itself in 1997: a timber
bathhouse with a tiled gable roof and the louvred steam vent along its ridge, an
open-air rock bath behind a bamboo fence that stays low on the sea side, and a free
footbath under its own little roof out front for anyone passing through the park.

Authored facing +Z (the entrance side) with the origin at the middle of the bathhouse's
back wall line; park-onsen.js turns it to face the town. Signs, the noren and the steam
are added at runtime. Input coordinates are Three.js (x, y, z); Blender takes (x, -z, y).
"""
import bpy, math, sys, argparse, json, random
from pathlib import Path

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
p = argparse.ArgumentParser(); p.add_argument('--root', required=True); a = p.parse_args(args)
root = Path(a.root).resolve()
out = root / 'assets/models/onsen'; out.mkdir(parents=True, exist_ok=True)
art = root / 'art/onsen'; art.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
rng = random.Random(1997)

def lin(hexstr):
    return tuple((int(hexstr[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))
FINISH = {}
def finish(name, colour, rough=.8, kind=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    bs = m.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = (*lin(colour), 1); bs.inputs['Roughness'].default_value = rough
    m['surface'] = kind or ('gloss' if rough < .5 else 'matte')
    FINISH[name] = m; return m

F = dict(
    footing=finish('Footing stone', '8b867c', .9),
    yakisugi=finish('Charred cedar', '2c2621', .85),
    plaster=finish('Lime plaster', 'e6dcc6', .9),
    timber=finish('Weathered cedar', '7a5a3c', .75),
    beam=finish('Dark timber', '43301f', .8),
    roof=finish('Kawara tile', '4c5660', .55, 'gloss'),
    ridge=finish('Ridge tile', '3a434c', .5, 'gloss'),
    interior=finish('Dim doorway', '231c17', .95),
    stone=finish('Garden stone', '7e7a72', .9),
    gravel=finish('Raked gravel', 'a39d8e', .95),
    rock=finish('Bath rock', '6d675f', .88),
    rock2=finish('Mossy rock', '5f6552', .9),
    bamboo=finish('Bamboo', 'b39d5c', .6),
    bamboo2=finish('Old bamboo', '9a8650', .65),
    rope=finish('Black palm rope', '2a2420', .9),
    pine=finish('Pine needles', '2f4a2c', .85),
    bark=finish('Pine bark', '4e3a2b', .9),
    fridge=finish('Milk fridge', 'eef0ea', .4, 'gloss'),
    milk=finish('Coffee milk', 'b58a5c', .4, 'gloss'),
    cap=finish('Milk cap', 'd8c9a0', .5),
    red=finish('Fridge sign red', 'b3382c', .6),
    deck=finish('Wet cedar deck', '6a4a31', .6),
    pail=finish('Hinoki pail', 'd2b27c', .6),
    water=finish('Onsen water', '86b8ad', .06, 'water'),
    stream=finish('Falling water', 'd9ece6', .1, 'water'),
    shoji=finish('Lit shoji paper', 'f6e7c6', .9, 'warm'),
    glass=finish('Door glass', 'cfe3e6', .05, 'glass'),
)

def loc(v): return (v[0], -v[2], v[1])
def cube(name, size, at, m, ry=0., rx=0., bevel=0.):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc(at))
    o = bpy.context.object; o.name = name; o.scale = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.rotation_euler = (rx, 0, ry)
    o.data.materials.append(m)
    if bevel:
        b = o.modifiers.new('Worked edges', 'BEVEL'); b.width = min(bevel, min(size) / 3); b.segments = 1
        bpy.ops.object.modifier_apply(modifier=b.name)
    return o
def cyl(name, r, h, at, m, verts=10, rx=0., ry=0., rz=0.):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc(at))
    o = bpy.context.object; o.name = name
    # Blender's cylinder stands on its Z, which is Three's Y. rz tilts it about Three's Z.
    o.rotation_euler = (rx, rz, ry); o.data.materials.append(m)
    for f in o.data.polygons: f.use_smooth = verts > 8
    return o
def cone(name, r1, r2, h, at, m, verts=10):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=h, location=loc(at))
    o = bpy.context.object; o.name = name; o.data.materials.append(m); return o
def rock(name, size, at, m):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1, location=loc(at))
    o = bpy.context.object; o.name = name
    for v in o.data.vertices: v.co *= rng.uniform(.82, 1.12)
    o.scale = (size[0], size[2], size[1]); o.rotation_euler = (rng.uniform(-.2, .2), rng.uniform(-.2, .2), rng.uniform(0, math.pi))
    o.data.materials.append(m); return o
def ellipse(name, rx, rz, y, at, m, verts=40, depth=0.):
    """A flat or extruded ellipse in the ground plane."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=1, depth=max(depth, .005), location=loc((at[0], y, at[1])))
    o = bpy.context.object; o.name = name; o.scale = (rx, rz, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(m); return o

# ============================================================== the bathhouse
W, D = 7.2, 4.2                 # x from -3.6 to 3.6, z from 0 to 4.2
FLOOR, EAVE = .35, 3.15
cube('Footing', (W + .4, FLOOR, D + .4), (0, FLOOR / 2, D / 2), F['footing'], bevel=.03)
def wall_x(x0, x1, z, lower=True, upper=(1.35, EAVE)):
    """A run of wall along X: charred cedar to the rail, plaster above."""
    w = x1 - x0; cx = (x0 + x1) / 2
    if lower: cube('Charred cedar boards', (w, 1.35 - FLOOR, .18), (cx, (1.35 + FLOOR) / 2, z), F['yakisugi'])
    if upper[1] > upper[0]: cube('Plaster', (w, upper[1] - upper[0], .16), (cx, (upper[0] + upper[1]) / 2, z), F['plaster'])
cube('Back boards', (W, 1.35 - FLOOR, .18), (0, (1.35 + FLOOR) / 2, .09), F['yakisugi'])
cube('Back plaster', (W, EAVE - 1.35, .16), (0, (1.35 + EAVE) / 2, .09), F['plaster'])
for sx in (-1, 1):
    cube('Side boards', (.18, 1.35 - FLOOR, D), (sx * (W / 2 - .09), (1.35 + FLOOR) / 2, D / 2), F['yakisugi'])
    cube('Side plaster', (.16, EAVE - 1.35, D), (sx * (W / 2 - .09), (1.35 + EAVE) / 2, D / 2), F['plaster'])
DOOR0, DOOR1, DOORH = -2.3, -.5, 2.45
wall_x(-W / 2, DOOR0, D - .09)
wall_x(DOOR1, W / 2, D - .09)
cube('Over the door', (DOOR1 - DOOR0, EAVE - DOORH, .16), ((DOOR0 + DOOR1) / 2, (DOORH + EAVE) / 2, D - .09), F['plaster'])
# Board battens down the charred cedar, the way the boards are actually fixed.
for z, x0, x1 in ((D + .005, -W / 2, DOOR0), (D + .005, DOOR1, W / 2)):
    n = int((x1 - x0) / .45)
    for k in range(1, n): cube('Batten', (.04, 1.0, .03), (x0 + k * (x1 - x0) / n, .85, z), F['beam'])
cube('Doorway, inside', (DOOR1 - DOOR0, DOORH - FLOOR, .04), ((DOOR0 + DOOR1) / 2, (DOORH + FLOOR) / 2, D - .5), F['interior'])
for x0, x1, z in ((DOOR0, DOOR1, D - .5),):
    for side in (-1, 1):
        cube('Doorway reveal', (.16, DOORH - FLOOR, .45), (x0 if side < 0 else x1, (DOORH + FLOOR) / 2, D - .27), F['timber'])
# Two glazed sliding doors, one drawn back.
for k, x in enumerate((-1.85, -1.15)):
    zz = D - .16 - k * .05
    cube('Door glass', (.86, 1.9, .01), (x, FLOOR + .98, zz), F['glass'])
    for dx in (-.43, .43): cube('Door stile', (.05, 1.95, .04), (x + dx, FLOOR + .98, zz), F['timber'])
    for y in (FLOOR + .03, FLOOR + .7, FLOOR + 1.93): cube('Door rail', (.9, .05, .04), (x, y, zz), F['timber'])
    for dx in (-.14, .14): cube('Door bar', (.02, 1.2, .03), (x + dx, FLOOR + 1.3, zz), F['timber'])
# Posts, sill plate, wall plate.
for x in (-W / 2, DOOR0 - .05, DOOR1 + .05, W / 2):
    cube('Post', (.18, EAVE - FLOOR + .05, .18), (x, (EAVE + FLOOR) / 2, D), F['beam'])
for x in (-W / 2, W / 2): cube('Post', (.18, EAVE - FLOOR + .05, .18), (x, (EAVE + FLOOR) / 2, 0), F['beam'])
for z in (0, D):
    cube('Wall plate', (W + .3, .2, .22), (0, EAVE + .05, z), F['beam'])
    cube('Sill', (W + .1, .12, .22), (0, FLOOR + .06, z), F['beam'])
cube('Rail', (W, .08, .06), (0, 1.36, D + .04), F['beam'])
# High lattice windows either side of the door, lit from within.
def lit_window(cx, cy, w, h, z):
    cube('Window paper', (w, h, .01), (cx, cy, z), F['shoji'])
    for dx in (-w / 2, w / 2): cube('Window frame', (.06, h + .08, .05), (cx + dx, cy, z + .01), F['timber'])
    for dy in (-h / 2, h / 2): cube('Window frame', (w + .08, .06, .05), (cx, cy + dy, z + .01), F['timber'])
    for k in range(1, int(w / .12)): cube('Koshi bar', (.025, h, .035), (cx - w / 2 + k * .12, cy, z + .03), F['timber'])
lit_window(1.55, 2.05, 2.8, .75, D + .01)
lit_window(-2.95, 2.05, .9, .75, D + .01)

# The roof: a tiled gable along X with deep eaves, ridge and end tiles, and the louvred
# yuge-nuki along the ridge that lets the bath's steam out -- what makes it a bathhouse.
RUN, RISE, OVER = D / 2 + .7, 1.4, .6
slope = math.atan2(RISE, RUN); length = math.hypot(RUN, RISE) + .05
for side in (1, -1):
    cz = D / 2 + side * RUN / 2; cy = EAVE + RISE / 2 + .08
    cube('Roof', (W + 2 * OVER, .12, length), (0, cy, cz), F['roof'], rx=side * slope)
    for k in range(int((W + 2 * OVER) / .28) + 1):
        x = -(W / 2 + OVER) + .1 + k * .28
        if x > W / 2 + OVER - .05: break
        cube('Tile ridge line', (.07, .06, length), (x, cy + .08 / math.cos(slope), cz), F['ridge'], rx=side * slope)
    cube('Eave tiles', (W + 2 * OVER + .1, .1, .14), (0, EAVE + .1 - .02, D / 2 + side * (RUN + .02)), F['ridge'])
    cube('Barge board', (.08, .3, length), (side * (W / 2 + OVER), cy - .08, cz), F['beam'], rx=side * slope)
    cube('Barge board', (.08, .3, length), (-side * (W / 2 + OVER), cy - .08, cz), F['beam'], rx=side * slope)
top = EAVE + RISE + .12
cube('Ridge', (W + 2 * OVER + .2, .26, .34), (0, top, D / 2), F['ridge'], bevel=.04)
for sx in (-1, 1): cube('Onigawara', (.12, .42, .42), (sx * (W / 2 + OVER + .12), top + .08, D / 2), F['ridge'], bevel=.03)
cube('Steam vent base', (2.4, .34, .8), (0, top + .2, D / 2), F['beam'])
for k in range(9): cube('Vent louvre', (.04, .26, .82), (-1.1 + k * .275, top + .2, D / 2), F['timber'])
for side in (1, -1):
    cube('Vent roof', (2.8, .08, .7), (0, top + .52, D / 2 + side * .3), F['roof'], rx=side * .5)
cube('Vent ridge', (2.9, .1, .14), (0, top + .7, D / 2), F['ridge'])

# The porch over the door, the sign board, the step.
for x in (DOOR0 - .1, DOOR1 + .1):
    cube('Porch post', (.14, 2.65, .14), (x, 1.32, D + 1.0), F['beam'])
cube('Porch beam', (2.3, .16, .16), ((DOOR0 + DOOR1) / 2, 2.62, D + 1.0), F['beam'])
cube('Porch roof', (2.7, .1, 1.4), ((DOOR0 + DOOR1) / 2, 2.86, D + .6), F['roof'], rx=.24)
cube('Porch roof edge', (2.75, .08, .1), ((DOOR0 + DOOR1) / 2, 2.72, D + 1.28), F['ridge'])
# The name board itself is not here: park-onsen.js hangs it on the porch beam's front face (z D + 1.09),
# where it reads from the street. This backing on the wall above the door is left bare behind the porch.
cube('Sign board backing', (1.9, .56, .08), ((DOOR0 + DOOR1) / 2, 2.8, D + .04), F['beam'])
cube('Entrance step', (2.0, .2, .6), ((DOOR0 + DOOR1) / 2, .1, D + .5), F['stone'], bevel=.03)

# Coffee milk after the bath, from the little fridge under the eave.
FX, FZ = -3.0, D + .45
cube('Milk fridge', (.62, 1.25, .5), (FX, .625, FZ), F['fridge'], bevel=.03)
cube('Fridge window', (.5, .7, .01), (FX, .72, FZ + .255), F['glass'])
cube('Fridge sign', (.5, .14, .01), (FX, 1.12, FZ + .255), F['red'])
for row in range(2):
    for k in range(4):
        cyl('Coffee milk', .03, .12, (FX - .17 + k * .11, .5 + row * .3, FZ + .12), F['milk'], 8)
        cyl('Milk cap', .031, .012, (FX - .17 + k * .11, .566 + row * .3, FZ + .12), F['cap'], 8)

# A bench under the windows for sitting out the flush after the bath.
cube('Bench seat', (1.9, .07, .42), (1.7, .45, D + .62), F['timber'], bevel=.015)
for dx in (-.8, .8): cube('Bench leg', (.08, .42, .36), (1.7 + dx, .21, D + .62), F['beam'])

# ============================================================== the footbath
AX0, AX1, AZ0, AZ1 = .4, 3.4, 6.4, 7.8       # the pool's rim, x and z
acx, acz = (AX0 + AX1) / 2, (AZ0 + AZ1) / 2
for z in (AZ0 + .13, AZ1 - .13):
    cube('Footbath rim', (AX1 - AX0, .42, .26), (acx, .21, z), F['stone'], bevel=.03)
    cube('Footbath seat', (AX1 - AX0 - .1, .06, .34), (acx, .45, z + (-.05 if z < acz else .05)), F['timber'], bevel=.015)
for x in (AX0 + .13, AX1 - .13): cube('Footbath rim', (.26, .42, AZ1 - AZ0 - .52), (x, .21, acz), F['stone'], bevel=.03)
cube('Footbath floor', (AX1 - AX0 - .5, .1, AZ1 - AZ0 - .5), (acx, .05, acz), F['rock'])
cube('Footbath water', (AX1 - AX0 - .5, .02, AZ1 - AZ0 - .5), (acx, .3, acz), F['water'])
for k in range(5): rock('Footbath pebble', (.12, .06, .1), (AX0 + .5 + k * .5, .14, acz + rng.uniform(-.2, .2)), F['rock2'])
cyl('Footbath spout', .035, .55, (AX1 - .2, .52, acz), F['bamboo'], 8, rz=math.pi / 2 - .35)
cyl('Footbath stream', .012, .22, (AX1 - .47, .42, acz), F['stream'], 6)
# The azumaya over it: four posts and a low hipped roof.
PX0, PX1, PZ0, PZ1 = AX0 - .25, AX1 + .25, AZ0 - .25, AZ1 + .25
for x in (PX0, PX1):
    for z in (PZ0, PZ1): cube('Azumaya post', (.14, 2.05, .14), (x, 1.025, z), F['beam'])
for z in (PZ0, PZ1): cube('Azumaya beam', (PX1 - PX0 + .3, .14, .14), (acx, 2.05, z), F['beam'])
for x in (PX0, PX1): cube('Azumaya beam', (.14, .14, PZ1 - PZ0 + .3), (x, 2.05, acz), F['beam'])
for side in (1, -1):
    cube('Azumaya roof', (PX1 - PX0 + .8, .09, (PZ1 - PZ0) / 2 + .6), (acx, 2.4, acz + side * ((PZ1 - PZ0) / 4 + .25)), F['roof'], rx=side * .42)
cube('Azumaya ridge', (PX1 - PX0 + .9, .14, .2), (acx, 2.7, acz), F['ridge'], bevel=.03)

# Stepping stones from the lawn to the door.
for k in range(6):
    s = rng.uniform(.5, .66)
    cube('Stepping stone', (s, .06, s * rng.uniform(.8, 1.0)), (-1.4 + rng.uniform(-.15, .15), .03, D + 1.25 + k * .72), F['stone'], ry=rng.uniform(-.4, .4), bevel=.02)

# ============================================================== the rock bath
BZ0, BZ1 = -7.0, -.3
cube('Bath yard gravel', (W, .04, BZ1 - BZ0), (0, .02, (BZ0 + BZ1) / 2), F['gravel'])
# The way out to the bath: a glazed sliding door in the back wall, and a window either side.
cube('Back doorway', (1.6, 2.0, .04), (0, FLOOR + 1.0, -.02), F['interior'])
for x in (-.4, .4):
    cube('Door glass', (.78, 1.9, .01), (x, FLOOR + .98, -.05), F['glass'])
    for dx in (-.39, .39): cube('Door stile', (.05, 1.95, .04), (x + dx, FLOOR + .98, -.06), F['timber'])
    for y in (FLOOR + .03, FLOOR + .7, FLOOR + 1.93): cube('Door rail', (.82, .05, .04), (x, y, -.06), F['timber'])
cube('Back door head', (1.8, .14, .2), (0, FLOOR + 2.02, -.02), F['beam'])
for x in (-2.4, 2.4):
    cube('Window paper', (1.2, .6, .01), (x, 2.2, -.02), F['shoji'])
    for k in range(1, 10): cube('Koshi bar', (.025, .6, .035), (x - .6 + k * .12, 2.2, -.04), F['timber'])
cube('Washing deck', (W, .08, 1.1), (0, .34, -.7), F['deck'])
for x in (-3.2, -1.6, 0, 1.6, 3.2): cube('Deck bearer', (.1, .3, 1.0), (x, .15, -.7), F['beam'])
for k in range(4):
    cyl('Hinoki pail', .12, .16, (-2.6 + k * .5, .46, -.55), F['pail'], 12)
    cube('Wash stool', (.26, .2, .22), (-2.6 + k * .5, .48, -.95), F['pail'])
PCX, PCZ, PRX, PRZ = .2, -3.9, 2.35, 1.75
ellipse('Pool wall', PRX + .1, PRZ + .1, .21, (PCX, PCZ), F['rock'], 32, .42)
ellipse('Bath water', PRX, PRZ, .43, (PCX, PCZ), F['water'], 40, .01)
for k in range(26):
    t = k / 26 * math.tau; jitter = rng.uniform(-.08, .08)
    x = PCX + (PRX + .12 + jitter) * math.cos(t); z = PCZ + (PRZ + .12 + jitter) * math.sin(t)
    big = rng.uniform(.3, .5)
    rock('Bath rock', (big, rng.uniform(.26, .42), big * rng.uniform(.75, 1.0)), (x, .3, z), F['rock'] if k % 3 else F['rock2'])
for x, z, s in ((-1.6, -5.9, .7), (2.3, -5.4, .6), (2.6, -2.5, .5)):
    rock('Standing rock', (s, s * 1.1, s * .8), (x, .45, z), F['rock2'])
# The bamboo spout that keeps the bath running over.
cyl('Kakehi', .045, 1.4, (1.9, 1.05, -5.6), F['bamboo'], 10, rz=math.pi / 2 - .25, ry=.6)
cyl('Kakehi stand', .05, 1.2, (2.45, .6, -5.95), F['bamboo2'], 8)
cyl('Kakehi stream', .014, .55, (1.35, .7, -5.2), F['stream'], 6)
# A snow-viewing lantern and a black pine leaning over the water.
LX, LZ = -2.9, -5.8
cyl('Lantern foot', .05, .5, (LX, .45, LZ), F['stone'], 6)
for dx, dz in ((-.2, -.15), (.2, -.15), (0, .22)):
    cyl('Lantern leg', .045, .5, (LX + dx, .25, LZ + dz), F['stone'], 6)
cyl('Lantern ring', .26, .08, (LX, .54, LZ), F['stone'], 6)
cube('Lantern firebox', (.3, .26, .3), (LX, .71, LZ), F['stone'])
cone('Lantern roof', .52, .08, .22, (LX, .95, LZ), F['stone'], 6)
cone('Lantern jewel', .07, 0, .12, (LX, 1.11, LZ), F['stone'], 8)
TX, TZ = 3.0, -6.2
for k, (x, y, z, r) in enumerate(((TX, .6, TZ, .13), (TX - .25, 1.6, TZ + .15, .11), (TX - .7, 2.3, TZ + .5, .09))):
    cyl('Pine trunk', r, 1.1, (x, y, z), F['bark'], 8, rz=.35 + k * .15)
# Black pine is grown in layered pads of needles at the ends of its branches, so it is
# many small flat clouds, not a few big discs.
for x, y, z, sx, sz in ((TX - .9, 2.3, TZ + .6, .55, .45), (TX - 1.45, 2.05, TZ + 1.05, .42, .38)):
    cyl('Pine branch', .045, .9, ((x + TX - .6) / 2, y - .12, (z + TZ + .45) / 2), F['bark'], 6, rz=1.2, ry=-.6)
for x, y, z, s in ((TX - .05, 1.25, TZ - .05, .42), (TX - .45, 1.72, TZ + .28, .46), (TX + .22, 1.95, TZ - .25, .36),
                   (TX - .9, 2.32, TZ + .6, .5), (TX - 1.45, 2.08, TZ + 1.05, .4), (TX - .55, 2.72, TZ + .42, .42),
                   (TX - 1.15, 2.78, TZ + .82, .32), (TX - .2, 2.4, TZ + .05, .34)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=9, ring_count=4, radius=1, location=loc((x, y, z)))
    o = bpy.context.object; o.name = 'Pine pad'
    for v in o.data.vertices: v.co *= rng.uniform(.85, 1.1)
    o.scale = (s, s * .8, s * .36); o.rotation_euler.z = rng.uniform(0, math.pi); o.data.materials.append(F['pine'])

# The fence: tall bamboo on the two lawn sides, low on the sea side so the bath looks out.
def takegaki(x0, z0, x1, z1, h):
    length = math.hypot(x1 - x0, z1 - z0); ang = math.atan2(z1 - z0, x1 - x0)
    n = int(length / .065)
    for k in range(n + 1):
        t = k / n; x = x0 + (x1 - x0) * t; z = z0 + (z1 - z0) * t
        cube('Bamboo slat', (.055, h, .055), (x, h / 2, z), F['bamboo'] if k % 3 else F['bamboo2'])
    for y in (h * .25, h * .6, h * .92):
        cube('Fence rail', (length, .04, .04), ((x0 + x1) / 2, y, (z0 + z1) / 2), F['bamboo2'], ry=-ang)
        for k in range(1, int(length / .9)):
            t = k / int(length / .9); cube('Rope tie', (.07, .07, .07), (x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t), F['rope'])
    for k in range(int(length / 1.8) + 1):
        t = min(1, k * 1.8 / length)
        cyl('Fence post', .06, h + .1, (x0 + (x1 - x0) * t, (h + .1) / 2, z0 + (z1 - z0) * t), F['bamboo2'], 8)
takegaki(-W / 2 - .05, BZ1, -W / 2 - .05, BZ0, 1.9)
takegaki(W / 2 + .05, BZ1, W / 2 + .05, BZ0, 1.9)
takegaki(-W / 2 - .05, BZ0, W / 2 + .05, BZ0, .95)

# ============================================================== export
def surface(name, rough, metal=0., vertex=True, glow=None, strength=0., alpha=1., colour=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nodes = m.node_tree.nodes; bs = nodes['Principled BSDF']
    bs.inputs['Roughness'].default_value = rough; bs.inputs['Metallic'].default_value = metal
    if vertex:
        attr = nodes.new('ShaderNodeVertexColor'); attr.layer_name = 'Col'
        m.node_tree.links.new(attr.outputs['Color'], bs.inputs['Base Color'])
    if colour: bs.inputs['Base Color'].default_value = (*lin(colour), 1)
    if glow:
        bs.inputs['Emission Color'].default_value = (*lin(glow), 1); bs.inputs['Emission Strength'].default_value = strength
    if alpha < 1:
        bs.inputs['Alpha'].default_value = alpha
        for attr_name, value in (('blend_method', 'BLEND'), ('surface_render_method', 'BLENDED')):
            try: setattr(m, attr_name, value)
            except Exception: pass
    return m
SURFACES = {
    'matte': surface('Umi-no-yu matte', .82), 'gloss': surface('Umi-no-yu glazed', .45),
    'water': surface('Umi-no-yu water', .06),
    'warm': surface('Umi-no-yu lamplight', .85, vertex=False, colour='f6e7c6', glow='f6e2b8', strength=.8),
    'glass': surface('Umi-no-yu glass', .05, vertex=False, colour='cfe3e6', alpha=.3),
}
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    m = o.data.materials[0]; colour = m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value
    layer = o.data.color_attributes.new(name='Col', type='BYTE_COLOR', domain='CORNER')
    for item in layer.data: item.color = (colour[0], colour[1], colour[2], 1)
    o.data.materials[0] = SURFACES[m['surface']]
for key, m in SURFACES.items():
    chosen = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.data.materials[0] == m]
    if not chosen: continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in chosen: o.select_set(True)
    bpy.context.view_layer.objects.active = chosen[0]
    bpy.ops.object.join(); bpy.context.object.name = 'Umi-no-yu / ' + key
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
name = 'umi-no-yu'
bpy.ops.wm.save_as_mainfile(filepath=str(art / (name + '.blend')), compress=True)
options = dict(filepath=str(out / (name + '.glb')), export_format='GLB', export_yup=True, export_animations=False, export_apply=True)
try: bpy.ops.export_scene.gltf(**options, export_vertex_color='MATERIAL')
except TypeError: bpy.ops.export_scene.gltf(**options)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
report = {'meshes': len(meshes), 'triangles': sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes),
          'bytes': (out / (name + '.glb')).stat().st_size}
(art / 'export-report.json').write_text(json.dumps({name: report}, indent=2))
print(name, report)
