"""Minato izakaya, the room. Blender 4.2+, metres, Principled glTF materials.
Run: blender -b --python tools/blender/build-minato-interior.py -- --root .
 or: python -c "import bpy" available -> python tools/blender/build-minato-interior.py -- --root .

A small harbour izakaya as it would have stood in 1997, fitted into the room the game
already walks: the counter, its five stools, the two shared tables, Thao's place at the
kitchen end and every collider and prompt in izakaya.js keep the coordinates they had.
What changes is everything round them.

 - The walls are a room rather than a box: cedar wainscot to the dado, earth plaster
   above, posts, a picture rail, beams and a slatted ceiling, and lattice windows with
   the paper lit from behind.
 - The counter is a working counter. A guest ledge at elbow height, a raised serving
   shelf behind it with the glass fish case, and a steel work top on Thao's side with
   the charcoal grill under its hood, the oden pot, the sink and the beer tap.
 - Things a bar of that year actually had on it: soy and shichimi, ashtrays, paper
   chopstick sleeves, rolled oshibori, a till, a beckoning cat, a kamidana up in the
   corner, the back bar of sake and kept bottles, crates of empties by the door.
 - The east side is a raised tatami koagari with low tables and cushions, shoes left on
   the stone at its step.

The kitchen is a real one, and it is shared. Behind Thao's counter the back bar keeps
the west end; the rest of the back wall is the cooking line -- a tall fridge, a four
burner range under a steel canopy, the fryer, a double sink and the prep bench -- and it
runs on, through an opening in the east wall, into Sato Ramen: the little corner shop
that opens at lunch while Minato is shut (x 6.5 to 11.4). Its side of the line is the
noodle boiler, the two stock pots and the toppings, facing a counter of five stools, a
wall ledge, a ticket machine by the door and its own noren.

Menu strips and signs are drawn at runtime (izakaya.js) so the lettering stays sharp.
Input coordinates are Three.js (x, y, z); Blender takes (x, -z, y).
"""
import bpy, bmesh, math, sys, argparse, json, random
from pathlib import Path

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
p = argparse.ArgumentParser(); p.add_argument('--root', required=True); a = p.parse_args(args)
root = Path(a.root).resolve()
out = root / 'assets/models/izakaya'; out.mkdir(parents=True, exist_ok=True)
art = root / 'art/izakaya'; art.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
rng = random.Random(1997)

materials = {}
def lin(hexstr):
    return tuple((int(hexstr[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))
def mat(name, color, rough=.7, metal=0., glow=0., alpha=1.):
    m = bpy.data.materials.new(name); m.use_nodes = True
    bs = m.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = (*lin(color), 1)
    bs.inputs['Roughness'].default_value = rough
    bs.inputs['Metallic'].default_value = metal
    if glow:
        bs.inputs['Emission Color'].default_value = (*lin(color), 1)
        bs.inputs['Emission Strength'].default_value = glow
    if alpha < 1:
        bs.inputs['Alpha'].default_value = alpha
        for attr, value in (('blend_method', 'BLEND'), ('surface_render_method', 'BLENDED')):
            try: setattr(m, attr, value)
            except Exception: pass
    materials[name] = m
    return m

M = dict(
    ramenplaster=mat('Ramen sage plaster','868d68',.96),
    smoke=mat('Smoked cedar', '3f2a1c', .78),
    floorA=mat('Cedar floor', '76502f', .74),
    floorB=mat('Cedar floor, darker board', '65432a', .76),
    honey=mat('Honey cedar', 'a06c42', .52),
    table=mat('Table cedar', '6e4a2f', .5),
    hood=mat('Hood steel', '7a8082', .45, .55),
    wainscot=mat('Wainscot boards', '553a26', .72),
    plaster=mat('Earth plaster', 'b98d5e', .92),
    steel=mat('Brushed steel', 'aeb3b3', .34, .75),
    darksteel=mat('Blackened steel', '3b3f40', .5, .6),
    glass=mat('Display glass', 'd8ecef', .05, 0, 0, .22),
    ice=mat('Crushed ice', 'eef4f3', .35),
    salmon=mat('Salmon', 'ea8a5c', .4), tuna=mat('Tuna', '9e2c35', .4),
    whitefish=mat('White fish', 'efe3d2', .4), shrimp=mat('Sweet shrimp', 'e97a54', .4),
    ember=mat('Binchotan embers', 'ff6a1f', .9, 0, 3.0),
    glaze=mat('Tare glaze', '7c3f1b', .38),
    vinyl=mat('Red vinyl', 'a5322b', .45),
    tatami=mat('Tatami', 'b7ae6c', .85), heri=mat('Tatami edging', '28332f', .8),
    zabuton=mat('Zabuton indigo', '2d4868', .8),
    lacquer=mat('Black lacquer', '1d1917', .3),
    lantern=mat('Red lantern paper', 'c8402e', .7, 0, .9),
    bulb=mat('Warm bulb', 'ffd28a', .4, 0, 4.0),
    enamel=mat('Green enamel', '35574a', .35),
    green=mat('Bottle green', '2c5c43', .22), brown=mat('Bottle brown', '5a3016', .22),
    clear=mat('Clear bottle', 'b9c9c2', .15),
    label=mat('Paper label', 'efe3c6', .8), red=mat('Red label', 'b3382c', .6),
    porcelain=mat('Porcelain', 'f1ece0', .3), blue=mat('Arita blue', '2f5872', .3),
    shoji=mat('Lit shoji paper', 'f6e7c6', .9, 0, .55),
    daikon=mat('Daikon', 'e3d3a6', .5), egg=mat('Oden egg', 'b98a4a', .45),
    konnyaku=mat('Konnyaku', '67615b', .5), broth=mat('Dashi', 'a8732f', .2),
    beer=mat('Lager', 'd3962a', .15), foam=mat('Beer head', 'f8f2e2', .6),
    crateY=mat('Yellow beer crate', 'd9aa33', .6), crateR=mat('Red beer crate', 'a9322b', .6),
    straw=mat('Barrel straw', 'c2ab76', .9), rope=mat('Straw rope', '6b5436', .9),
    noren=mat('Indigo noren', '28395a', .8),
    stone=mat('Step stone', '85817a', .9),
    edamame=mat('Edamame', '7d9b45', .6),
    cream=mat('Till cream', 'e6dcc4', .5),
    sakaki=mat('Sakaki leaves', '3d6a37', .7),
    tile=mat('White wall tile', 'e4e0d4', .35), grout=mat('Tile grout', '9a968a', .8),
    quarry=mat('Quarry tile', '9c5436', .62), quarryB=mat('Quarry tile, darker', '86462d', .64),
    chashu=mat('Chashu', 'c98b6a', .45), negi=mat('Negi', '6fa83c', .55), menma=mat('Menma', 'a77c3e', .5),
    nori=mat('Nori', '1f2a22', .6), noodle=mat('Noodles', 'e8cf7a', .5), oil=mat('Fryer oil', 'b8862a', .15),
    tube=mat('Fluorescent tube', 'fff4dc', .4, 0, 3.0), lacq_red=mat('Red lacquer', '9c2b22', .35),
    ticket=mat('Ticket machine cream', 'ddd4bc', .45),
    # The bar: a polished top, a lacquered arm-rail, a smoked mirror behind the bottles,
    # brass, oxblood leather and a burgundy carpet under the booth.
    bartop=mat('Bar top mahogany', '5c2c1a', .26), mirror=mat('Smoked mirror', '2f2a28', .12, .65),
    brass=mat('Brass', 'b08a3a', .32, .8), leather=mat('Oxblood leather', '7a1f1e', .36),
    button=mat('Leather button', '4a1010', .4), carpet=mat('Burgundy carpet', '5a1a22', .95),
    whisky=mat('Whisky amber', '8a4a14', .18), gin=mat('Gin bottle blue', '2b4f7a', .18),
    speaker=mat('Speaker cloth', '22201e', .9),
)

def loc(v): return (v[0], -v[2], v[1])
def made_mesh(name, verts, faces, at, m, smooth=False):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.materials.append(m);data.update()
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=loc(at)
    if smooth:
        for f in data.polygons:f.use_smooth=True
    return o

def cube(name, size, at, m, rot=0., bevel=0.):
    x,y,z=size[0]/2,size[2]/2,size[1]/2
    verts=[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
    faces=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    o=made_mesh(name,verts,faces,at,m);o.rotation_euler.z=rot
    if bevel:
        bm=bmesh.new();bm.from_mesh(o.data)
        bmesh.ops.bevel(bm,geom=list(bm.edges),offset=min(bevel,min(size)/3),segments=1,affect='EDGES')
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
    return o

def cyl(name, r, h, at, m, verts=12, axis='y', rot=0.):
    vs=[(math.cos(k*math.tau/verts)*r,math.sin(k*math.tau/verts)*r,z) for z in (-h/2,h/2) for k in range(verts)]
    faces=[tuple(reversed(range(verts))),tuple(range(verts,2*verts))]+[(k,(k+1)%verts,(k+1)%verts+verts,k+verts) for k in range(verts)]
    o=made_mesh(name,vs,faces,at,m,verts>8)
    if axis=='x':o.rotation_euler.y=math.pi/2
    elif axis=='z':o.rotation_euler.x=math.pi/2
    o.rotation_euler.z+=rot;return o

def cone(name, r1, r2, h, at, m, verts=12):
    bm=bmesh.new();bmesh.ops.create_cone(bm,cap_ends=True,cap_tris=False,segments=verts,radius1=r1,radius2=r2,depth=h)
    data=bpy.data.meshes.new(name);bm.to_mesh(data);bm.free();data.materials.append(m)
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=loc(at)
    for f in data.polygons:f.use_smooth=True
    return o

def ball(name, scale, at, m, seg=10, rings=6):
    bm=bmesh.new();bmesh.ops.create_uvsphere(bm,u_segments=seg,v_segments=rings,radius=1)
    data=bpy.data.meshes.new(name);bm.to_mesh(data);bm.free();data.materials.append(m)
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=loc(at);o.scale=(scale[0],scale[2],scale[1])
    for f in data.polygons:f.use_smooth=True
    return o

def ring(name, R, r, at, m):
    segments=12
    vs=[((R+r*math.cos(j*math.tau/4))*math.cos(i*math.tau/segments),(R+r*math.cos(j*math.tau/4))*math.sin(i*math.tau/segments),r*math.sin(j*math.tau/4)) for i in range(segments) for j in range(4)]
    faces=[(i*4+j,((i+1)%segments)*4+j,((i+1)%segments)*4+(j+1)%4,i*4+(j+1)%4) for i in range(segments) for j in range(4)]
    return made_mesh(name,vs,faces,at,m,True)

# --------------------------------------------------------------------------- floor
cube('Diorama base', (13, .3, 13), (0, -.16, 0), M['smoke'])
x = -6.4; i = 0
while x < 6.39:
    w = min(.32, 6.4 - x)
    cube('Floorboard', (w - .006, .04, 12.8), (x + w / 2, .02, 0), M['floorA'] if i % 2 else M['floorB'])
    x += w; i += 1

# --------------------------------------------------------------------------- walls
cube('Back wall', (12.8, 3.8, .2), (0, 1.9, -6.4), M['plaster'])
cube('Left cutaway wall', (.2, 2.8, 13), (-6.4, 1.4, 0), M['plaster'])
cube('Right cutaway rim', (.2, .65, 9.75), (6.4, .325, 1.525), M['wainscot'])   # open behind the counter: the kitchen runs on into Sato Ramen

def wainscot_run(axis, fixed, a0, a1, skip=()):
    """Vertical cedar boards to the dado along one wall, with a cap rail."""
    length = a1 - a0; mid = (a0 + a1) / 2
    if axis == 'x':
        cube('Wainscot panel', (length, .95, .03), (mid, .515, fixed), M['wainscot'])
        cube('Dado rail', (length, .06, .07), (mid, 1.0, fixed + (.02 if fixed < 0 else -.02)), M['smoke'])
    else:
        cube('Wainscot panel', (.03, .95, length), (fixed, .515, mid), M['wainscot'])
        cube('Dado rail', (.07, .06, length), (fixed + (.02 if fixed < 0 else -.02), 1.0, mid), M['smoke'])
    n = int(length / .42)
    for k in range(1, n):
        t = a0 + k * length / n
        if any(s0 < t < s1 for s0, s1 in skip): continue
        if axis == 'x': cube('Board batten', (.035, .93, .025), (t, .5, fixed + (.02 if fixed < 0 else -.02)), M['smoke'])
        else: cube('Board batten', (.025, .93, .035), (fixed + (.02 if fixed < 0 else -.02), .5, t), M['smoke'])

wainscot_run('x', -6.285, -6.3, -1.1)   # the kitchen tile takes the rest of the back wall
wainscot_run('z', -6.285, -6.3, 6.3)
wainscot_run('z', 6.285, -3.3, 6.3)
wainscot_run('x', 6.285, -6.3, -1.85)
wainscot_run('x', 6.285, 1.85, 6.3)

for xx in (-6.22, -3.2):   # the cooking line stands along the rest of it
    cube('Wall post', (.16, 3.8, .14), (xx, 1.9, -6.22), M['smoke'])
for zz in (-6.2, -3.4, -.6, 1.8, 4.3, 6.2):
    cube('Wall post', (.14, 3.8, .16), (-6.22, 1.9, zz), M['smoke'])
for zz in (-2.9, -.6, 1.8, 4.3, 6.2):
    cube('Wall post', (.14, 3.8, .16), (6.22, 1.9, zz), M['smoke'])
for xx in (-6.2, -1.9, 1.9, 5.4):   # clear of the street window
    cube('Wall post', (.16, 3.8, .14), (xx, 1.9, 6.22), M['smoke'])
# Picture rail above the posters, and a head rail under the beams.
for y in (2.85, 3.66):
    cube('Wall rail', (12.6, .09, .07), (0, y, -6.24), M['smoke'])
    cube('Wall rail', (.07, .09, 12.6), (-6.24, y, 0), M['smoke'])
    cube('Wall rail', (.07, .09, 9.6), (6.24, y, 1.5), M['smoke'])
    cube('Wall rail', (4.45, .09, .07), (-4.07, y, 6.24), M['smoke'])
    cube('Wall rail', (4.45, .09, .07), (4.07, y, 6.24), M['smoke'])

# --------------------------------------------------------------------------- ceiling
for zz in (-4.8, -1.6, 1.6, 4.8):
    cube('Ceiling beam', (12.8, .24, .2), (0, 3.62, zz), M['smoke'], bevel=.02)
for xx in (-3.2, 3.2):
    cube('Ceiling purlin', (.18, .16, 12.8), (xx, 3.5, 0), M['smoke'])
for k in range(26):
    cube('Ceiling slat', (12.8, .02, .08), (0, 3.77, -6.25 + k * .5), M['floorB'])

# --------------------------------------------------------------------------- windows
def shoji(name, centre, width, height, axis):
    """A lattice window: frame, kumiko grid and paper lit from behind."""
    cx, cy, cz = centre
    if axis == 'x':   # in a wall running along x
        cube(name + ' paper', (width, height, .01), (cx, cy, cz), M['shoji'])
        for dx in (-width / 2, width / 2): cube(name + ' frame', (.06, height + .1, .05), (cx + dx, cy, cz), M['honey'])
        for dy in (-height / 2, height / 2): cube(name + ' frame', (width + .1, .06, .05), (cx, cy + dy, cz), M['honey'])
        for k in range(1, 6): cube(name + ' kumiko', (.018, height, .03), (cx - width / 2 + k * width / 6, cy, cz), M['honey'])
        for k in range(1, 4): cube(name + ' kumiko', (width, .018, .03), (cx, cy - height / 2 + k * height / 4, cz), M['honey'])
    else:
        cube(name + ' paper', (.01, height, width), (cx, cy, cz), M['shoji'])
        for dz in (-width / 2, width / 2): cube(name + ' frame', (.05, height + .1, .06), (cx, cy, cz + dz), M['honey'])
        for dy in (-height / 2, height / 2): cube(name + ' frame', (.05, .06, width + .1), (cx, cy + dy, cz), M['honey'])
        for k in range(1, 6): cube(name + ' kumiko', (.03, height, .018), (cx, cy, cz - width / 2 + k * width / 6), M['honey'])
        for k in range(1, 4): cube(name + ' kumiko', (.03, .018, width), (cx, cy - height / 2 + k * height / 4, cz), M['honey'])

shoji('Street window', (-3.9, 1.72, 6.27), 2.2, 1.1, 'x')
shoji('Koagari window', (6.27, 1.72, 1.8), 2.4, 1.0, 'z')

# --------------------------------------------------------------------------- counter
cube('Counter carcass', (8.3, .95, .75), (-.8, .475, -2.55), M['smoke'])
for k in range(42):
    cube('Counter front slat', (.1, .86, .03), (-4.9 + k * .197, .52, -2.155), M['wainscot'])
cube('Counter kick', (8.3, .09, .05), (-.8, .045, -2.14), M['smoke'])
cube('Guest ledge', (8.4, .07, .55), (-.8, 1.075, -2.2), M['bartop'], bevel=.02)
# The arm-rail along the guests' edge, round and lacquered, the way a bar counter ends.
cyl('Counter arm-rail', .045, 8.4, (-.8, 1.07, -1.93), M['lacquer'], 16, axis='x')
for k in range(9): cube('Arm-rail bracket', (.04, .06, .05), (-4.8 + k * 1.0, 1.02, -1.96), M['brass'])
cyl('Foot rail', .02, 8.2, (-.8, .2, -1.98), M['brass'], 10, axis='x')
for k in range(9): cube('Serving shelf bracket', (.06, .14, .18), (-4.8 + k * 1.0, 1.16, -2.6), M['smoke'])
cube('Serving shelf', (8.3, .06, .26), (-.8, 1.25, -2.6), M['honey'], bevel=.015)
cube('Work top cabinet', (8.3, .88, .58), (-.8, .44, -3.06), M['steel'])
cube('Work top', (8.35, .035, .62), (-.8, .9, -3.06), M['steel'])
for k in range(7): cube('Cabinet door seam', (.01, .7, .005), (-4.3 + k * 1.2, .44, -3.353), M['darksteel'])

# Neta case: fish on ice behind glass, on the serving shelf.
cube('Neta case glass', (2.6, .24, .24), (-2.4, 1.4, -2.6), M['glass'])
cube('Neta case rim', (2.64, .02, .26), (-2.4, 1.53, -2.6), M['steel'])
for dx in (-1.31, 1.31): cube('Neta case end', (.02, .25, .25), (-2.4 + dx, 1.405, -2.6), M['steel'])
cube('Neta case ice', (2.54, .03, .2), (-2.4, 1.295, -2.6), M['ice'])
fish = [M['salmon'], M['tuna'], M['whitefish'], M['shrimp']]
for k in range(10):
    cube('Fish on ice', (.2, .05, .12), (-3.55 + k * .255, 1.335, -2.6), fish[k % 4], rot=.25 * (-1) ** k)

# Place settings, condiments and ashtrays along the ledge. The props the venue hands
# out stand at x ± .15 in front of each stool, so these keep to either side of that.
STOOLS = (-3.8, -2.3, -.8, .7, 2.2)
for sx in STOOLS:
    cube('Chopstick sleeve', (.03, .008, .23), (sx - .34, 1.115, -2.08), M['porcelain'])
    cube('Sleeve band', (.032, .009, .04), (sx - .34, 1.116, -2.14), M['red'])
    cyl('Rolled oshibori', .022, .17, (sx + .35, 1.13, -2.1), M['porcelain'], 8, axis='z')
    cube('Oshibori tray', (.08, .01, .2), (sx + .35, 1.113, -2.1), M['honey'])
for cx in (-3.05, -.05, 1.45):
    cyl('Soy cruet', .026, .09, (cx - .06, 1.155, -2.35), M['porcelain'], 10)
    cyl('Soy cruet cap', .02, .025, (cx - .06, 1.212, -2.35), M['red'], 10)
    cyl('Shichimi tin', .018, .07, (cx + .02, 1.145, -2.36), M['brown'], 10)
    cube('Toothpick box', (.04, .06, .04), (cx + .08, 1.14, -2.35), M['honey'])
    cyl('Glass ashtray', .06, .025, (cx + .02, 1.123, -2.02), M['clear'], 12)

# On the serving shelf by the tap: the evening's open bottles, the shaker and glasses.
cube('Open whisky', (.08, .22, .08), (-.95, 1.39, -2.62), M['whisky'], bevel=.008)
cyl('Open whisky neck', .017, .07, (-.95, 1.535, -2.62), M['whisky'], 8)
cube('Open whisky label', (.065, .08, .004), (-.95, 1.37, -2.578), M['cream'])
cyl('Open gin', .04, .22, (-.78, 1.39, -2.62), M['gin'], 10)
cyl('Open gin neck', .017, .08, (-.78, 1.54, -2.62), M['gin'], 8)
cyl('Shaker', .038, .17, (.42, 1.365, -2.6), M['steel'], 14)
cone('Shaker cap', .038, .02, .06, (.42, 1.48, -2.6), M['steel'], 14)
for gx in (.55, .64, .73):
    cyl('Rocks glass', .036, .075, (gx, 1.318, -2.6), M['clear'], 12)

# Till and the beckoning cat at the kitchen end.
cube('Till', (.32, .16, .28), (3.0, 1.19, -2.28), M['cream'], bevel=.02)
cube('Till keys', (.26, .01, .12), (3.0, 1.275, -2.24), M['smoke'], rot=0)
cube('Till display', (.14, .06, .02), (3.0, 1.3, -2.4), M['darksteel'])
cyl('Maneki-neko base', .06, .025, (2.72, 1.29, -2.6), M['red'], 12)
ball('Maneki-neko body', (.065, .085, .055), (2.72, 1.37, -2.6), M['porcelain'])
ball('Maneki-neko head', (.058, .052, .05), (2.72, 1.49, -2.6), M['porcelain'])
for dx in (-.035, .035): cone('Maneki-neko ear', .018, 0, .035, (2.72 + dx, 1.54, -2.6), M['porcelain'], 4)
ball('Maneki-neko paw', (.022, .03, .022), (2.78, 1.52, -2.57), M['porcelain'], 8, 5)
cube('Maneki-neko collar', (.09, .012, .06), (2.72, 1.44, -2.6), M['red'])

# --------------------------------------------------------------------------- kitchen side
# Charcoal grill under its hood, where the guests can watch the skewers.
cube('Grill body', (1.3, .2, .34), (1.7, 1.02, -3.02), M['darksteel'])
cube('Grill embers', (1.2, .03, .26), (1.7, 1.125, -3.02), M['ember'])
for k in range(12):
    cube('Skewer', (.012, .012, .36), (1.15 + k * .1, 1.16, -3.02), M['honey'])
    for j in range(4): cube('Yakitori', (.034, .03, .036), (1.15 + k * .1, 1.175, -3.12 + j * .06), M['glaze'])
cube('Grill hood', (1.5, .26, .62), (1.7, 2.4, -3.12), M['hood'], bevel=.02)
cube('Hood duct', (.36, 1.1, .36), (1.7, 3.08, -3.3), M['hood'])

# Oden: a square pot of dashi with its dividers and what is simmering in it.
cube('Oden pot', (.62, .16, .38), (-4.2, .99, -3.05), M['steel'])
cube('Oden dashi', (.58, .01, .34), (-4.2, 1.07, -3.05), M['broth'])
for dx in (-.1, .1): cube('Oden divider', (.008, .03, .34), (-4.2 + dx, 1.07, -3.05), M['steel'])
for k in range(3): cyl('Oden daikon', .045, .04, (-4.4 + k * .07, 1.08, -3.12 + (k % 2) * .1), M['daikon'], 10)
for k in range(3): ball('Oden egg', (.03, .026, .03), (-4.2, 1.08, -3.14 + k * .08), M['egg'], 8, 5)
for k in range(3): cube('Oden konnyaku', (.06, .02, .05), (-4.0, 1.08, -3.14 + k * .08), M['konnyaku'], rot=.4 * k)

# Sink and tap, beer tap and glasses.
cube('Sink basin', (.46, .012, .36), (2.85, .915, -3.06), M['darksteel'])
cyl('Sink tap', .012, .26, (2.85, 1.05, -3.3), M['steel'], 8)
cube('Tap spout', (.02, .02, .14), (2.85, 1.17, -3.24), M['steel'])
cyl('Beer tower', .045, .34, (-.3, 1.09, -2.95), M['steel'], 12)
cube('Beer spout', (.03, .03, .12), (-.3, 1.2, -2.86), M['steel'])
cyl('Beer tap handle', .016, .12, (-.3, 1.3, -2.9), M['lacquer'], 8)
for k in range(4):
    cyl('Beer glass', .036, .13, (-.05 + k * .085, .985, -3.0), M['clear'], 10)

# Back bar: cupboard, shelves of isshobin, shochu and kept whisky with name tags.
cube('Back bar cupboard', (3.35, .88, .55), (-2.875, .44, -5.95), M['wainscot'])
cube('Back bar top', (3.4, .04, .6), (-2.875, .9, -5.95), M['honey'])
for k in range(4): cube('Cupboard door seam', (.012, .74, .005), (-4.4 + k * .9, .44, -5.672), M['smoke'])
cyl('Rice cooker', .15, .22, (-3.6, 1.03, -5.95), M['porcelain'], 14)
cyl('Rice cooker lid', .14, .04, (-3.6, 1.16, -5.95), M['steel'], 14)
for k in range(5): cube('Stacked plates', (.26, .012, .26), (-2.7, .93 + k * .014, -5.95), M['blue'])
# The back bar: a smoked mirror behind five lit shelves of bottles, kept whisky and
# sake, shochu and a few imported ones, each shelf with a warm strip under its lip.
cube('Back bar mirror', (3.3, 1.75, .02), (-2.875, 1.9, -6.27), M['mirror'])
for xx in (-4.55, -1.2): cube('Back bar stile', (.08, 1.85, .34), (xx, 1.92, -6.1), M['smoke'])
cube('Back bar cornice', (3.5, .14, .4), (-2.875, 2.9, -6.08), M['smoke'], bevel=.02)
SHELVES = (1.08, 1.42, 1.76, 2.1, 2.44)
for y in SHELVES:
    cube('Bottle shelf', (3.25, .03, .3), (-2.875, y, -6.1), M['honey'])
    cube('Shelf light', (3.1, .012, .02), (-2.875, y - .022, -5.97), M['bulb'])
def bottle(x, y, z, kind):
    if kind == 'whisky':   # square-shouldered, amber, the kept bottles of the regulars
        cube('Bottle', (.075, .2, .075), (x, y + .1, z), M['whisky'], bevel=.008)
        cyl('Bottle neck', .016, .07, (x, y + .235, z), M['whisky'], 8)
        cyl('Bottle cap', .019, .025, (x, y + .28, z), M['lacquer'], 8)
        cube('Bottle label', (.06, .07, .004), (x, y + .09, z + .039), rng.choice([M['label'], M['cream'], M['red']]))
        if rng.random() > .5: cube('Keep tag', (.05, .03, .004), (x, y + .22, z + .02), M['label'])
        return
    if kind == 'isshobin':
        body, h, r = rng.choice([M['green'], M['brown']]), .3, .05
    elif kind == 'shochu':
        body, h, r = M['clear'], .22, .042
    elif kind == 'gin':
        body, h, r = M['gin'], .22, .04
    else:
        body, h, r = M['brown'], .2, .045
    cyl('Bottle', r, h, (x, y + h / 2, z), body, 8)
    cone('Bottle shoulder', r, r * .45, .05, (x, y + h + .025, z), body, 8)
    cyl('Bottle neck', r * .42, .07, (x, y + h + .085, z), body, 8)
    cube('Bottle label', (r * 1.5, h * .5, .004), (x, y + h * .45, z + r + .001), M['label'] if rng.random() > .3 else M['red'])
for n, y in enumerate(SHELVES):
    kinds = ('whisky', 'whisky', 'gin', 'shochu') if n < 2 else ('isshobin', 'shochu', 'whisky') if n < 4 else ('whisky', 'keep')
    room = .34 if n == 4 else .3
    for k in range(int(3.1 // .22)):
        if y + room > 2.86: break
        kind = kinds[(k * 7 + n) % len(kinds)]
        if kind == 'isshobin' and y > 2.2: kind = 'whisky'
        bottle(-4.38 + k * .22 + rng.uniform(-.015, .015), y + .016, -6.1 + rng.uniform(-.03, .03), kind)
# Brass sconces either side of the back bar and along the west wall.
def sconce(x, y, z, facing):
    cube('Sconce plate', (.12, .16, .03) if facing == 'z' else (.03, .16, .12), (x, y, z), M['brass'])
    off = (0, 0, .09) if facing == 'z' else (.09, 0, 0)
    cone('Sconce shade', .05, .11, .16, (x + off[0], y + .06, z + off[2]), M['brass'], 14)
    ball('Sconce bulb', (.045, .05, .045), (x + off[0], y + .1, z + off[2]), M['bulb'], 10, 6)
for sx in (-4.85, -.95): sconce(sx, 2.45, -6.27, 'z')
for sz in (-1.0, 3.4): sconce(-6.27, 2.35, sz, 'x')
# The speakers, up on brackets in the west corners, the cloth gone shiny where it is touched.
for sz in (-4.7, 4.6):
    cube('Speaker cabinet', (.3, .46, .3), (-6.08, 2.55, sz), M['lacquer'], bevel=.015)
    cube('Speaker grille', (.01, .4, .25), (-5.925, 2.55, sz), M['speaker'])
    cyl('Speaker woofer', .095, .012, (-5.915, 2.48, sz), M['darksteel'], 18, axis='x')
    cyl('Speaker tweeter', .035, .012, (-5.915, 2.68, sz), M['darksteel'], 12, axis='x')
    cube('Speaker bracket', (.26, .04, .06), (-6.17, 2.3, sz), M['darksteel'])

# The cooking line along the rest of the back wall, on white tile.
cube('Kitchen tile', (7.5, 1.1, .02), (2.55, 1.45, -6.275), M['tile'])
for k in range(1, 25): cube('Tile joint', (.008, 1.1, .005), (-1.2 + k * .3, 1.45, -6.262), M['grout'])
for k in range(1, 4): cube('Tile joint', (7.5, .008, .005), (2.55, .9 + k * .275, -6.262), M['grout'])
# A tall two-door fridge.
cube('Kitchen fridge', (1.35, 1.9, .7), (-.4, .95, -5.95), M['steel'], bevel=.02)
cube('Fridge door seam', (.01, 1.8, .005), (-.4, .95, -5.597), M['darksteel'])
for dx in (-.1, .1): cube('Fridge handle', (.03, .6, .03), (-.4 + dx, 1.2, -5.58), M['darksteel'])
# The range: four burners, the wok, a pan, a stock pot and the kettle.
cube('Range body', (1.9, .86, .75), (1.4, .43, -5.95), M['steel'])
cube('Range top', (1.92, .04, .77), (1.4, .88, -5.95), M['darksteel'])
for k in range(4): cyl('Range knob', .03, .03, (.75 + k * .43, .7, -5.565), M['darksteel'], 10, axis='z')
for dx, dz in ((-.45, -.18), (.45, -.18), (-.45, .16), (.45, .16)):
    ring('Burner ring', .11, .014, (1.4 + dx, .915, -5.95 + dz), M['darksteel'])
cyl('Stock pot', .22, .34, (.95, 1.08, -6.13), M['steel'], 16)
cyl('Stock pot broth', .2, .01, (.95, 1.25, -6.13), M['broth'], 16)
cyl('Wok', .27, .09, (1.85, .96, -5.79), M['darksteel'], 18)
cyl('Wok handle', .018, .3, (2.2, 1.0, -5.62), M['smoke'], 8, axis='x', rot=.5)
cyl('Frying pan', .15, .04, (.95, .94, -5.79), M['darksteel'], 14)
cyl('Kettle', .1, .16, (1.85, 1.0, -6.12), M['steel'], 12)
cone('Kettle lid', .09, .03, .05, (1.85, 1.1, -6.12), M['steel'], 12)
# The fryer, the double sink and the dish rack, and the prep bench at the end.
cube('Fryer', (.7, .86, .75), (2.75, .43, -5.95), M['steel'])
cube('Fryer oil', (.56, .01, .5), (2.75, .9, -5.97), M['oil'])
for dx in (-.14, .14):
    cube('Fryer basket', (.22, .12, .38), (2.75 + dx, .93, -5.97), M['darksteel'])
    cyl('Basket handle', .012, .3, (2.75 + dx, 1.05, -5.7), M['lacquer'], 6, axis='z')
cube('Sink cabinet', (1.4, .86, .75), (3.85, .43, -5.95), M['steel'])
cube('Sink top', (1.42, .035, .77), (3.85, .88, -5.95), M['steel'])
for dx in (-.33, .33): cube('Sink bowl', (.5, .012, .44), (3.85 + dx, .9, -5.95), M['darksteel'])
cyl('Kitchen tap', .015, .32, (3.85, 1.06, -6.22), M['steel'], 8)
cube('Kitchen spout', (.025, .025, .2), (3.85, 1.21, -6.13), M['steel'])
cube('Dish rack', (1.2, .04, .3), (3.85, 1.95, -6.12), M['steel'])
for k in range(9): cube('Plate in rack', (.01, .2, .2), (3.35 + k * .12, 2.07, -6.12), M['porcelain'] if k % 3 else M['blue'])
cube('Prep bench', (1.4, .86, .75), (5.55, .43, -5.95), M['steel'])
cube('Prep bench top', (1.42, .035, .77), (5.55, .88, -5.95), M['steel'])
cube('Chopping board', (.5, .03, .32), (5.4, .915, -5.9), M['honey'])
for k in range(6): cube('Sliced negi', (.03, .012, .03), (5.3 + k * .035, .935, -5.85), M['negi'])
cyl('Prep bowl', .1, .06, (5.9, .93, -5.95), M['porcelain'], 12)
# The canopy over the range and the fryer, with its duct and a rail of ladles.
cube('Kitchen canopy', (3.3, .32, .85), (1.95, 2.35, -5.95), M['hood'], bevel=.02)
cube('Canopy duct', (.45, 1.25, .45), (1.95, 3.1, -6.15), M['hood'])
cube('Ladle rail', (2.8, .02, .02), (1.95, 2.12, -6.25), M['steel'])
for k in range(7):
    cyl('Hanging ladle', .008, .32, (.8 + k * .38, 1.95, -6.23), M['steel'], 6)
    cyl('Ladle cup', .045, .04, (.8 + k * .38, 1.78, -6.2), M['steel'], 10)
# The radio moves up over the fridge.
cube('Radio shelf', (1.1, .04, .42), (-.4, 2.28, -6.07), M['honey'])
cube('Radio cabinet', (1.0, .56, .38), (-.4, 2.58, -6.04), M['honey'], bevel=.03)
cube('Radio cloth', (.55, .36, .01), (-.55, 2.58, -5.845), M['straw'])
for dx in (.28, .4): cyl('Radio dial', .035, .03, (-.4 + dx, 2.58, -5.84), M['cream'], 12, axis='z')

# Kamidana up in the corner, and the radio on its shelf.
cube('Kamidana shelf', (.9, .04, .3), (-5.6, 3.15, -6.13), M['honey'])
cube('Kamidana shrine', (.34, .28, .16), (-5.6, 3.31, -6.14), M['honey'])
cube('Kamidana roof', (.44, .05, .24), (-5.6, 3.47, -6.12), M['smoke'])
for dx in (-.32, .32):
    cyl('Sakaki vase', .025, .08, (-5.6 + dx, 3.21, -6.1), M['porcelain'], 8)
    ball('Sakaki', (.05, .09, .04), (-5.6 + dx, 3.32, -6.1), M['sakaki'], 8, 5)
cyl('Shimenawa', .015, .95, (-5.6, 3.55, -6.05), M['straw'], 6, axis='x')

# Beer crates of empties and the drinks fridge behind the counter's west end.
def crate(x, y, z, m):
    cube('Beer crate', (.46, .3, .34), (x, y + .15, z), m, bevel=.015)
    for i in range(4):
        for j in range(3): cyl('Bottle top', .028, .06, (x - .165 + i * .11, y + .31, z - .1 + j * .1), M['brown'], 8)
crate(-5.7, 0, -4.7, M['crateY']); crate(-5.7, .3, -4.7, M['crateY']); crate(-5.7, 0, -4.3, M['crateR'])
cube('Drinks fridge', (.78, 1.85, .62), (-5.75, .925, -5.85), M['steel'], bevel=.02)
cube('Fridge handle', (.03, .5, .03), (-5.42, 1.15, -5.52), M['darksteel'])

# --------------------------------------------------------------------------- stools
for sx in STOOLS:
    z = -1.42
    cyl('Stool cushion', .19, .07, (sx, .675, z), M['vinyl'], 16)
    cyl('Stool seat', .2, .03, (sx, .625, z), M['smoke'], 16)
    for dx, dz in ((-.12, -.12), (-.12, .12), (.12, -.12), (.12, .12)):
        cube('Stool leg', (.035, .61, .035), (sx + dx, .305, z + dz), M['smoke'])
    for dx, dz, w, d in ((0, -.12, .24, .02), (0, .12, .24, .02), (-.12, 0, .02, .24), (.12, 0, .02, .24)):
        cube('Stool rung', (w, .02, d), (sx + dx, .22, z + dz), M['smoke'])

# --------------------------------------------------------------------------- tables
for tx, tz in ((-3.5, 2.2), (2.6, 2.0)):
    cube('Table top', (2.5, .06, 1.35), (tx, .915, tz), M['table'], bevel=.02)
    cube('Table apron', (2.3, .08, 1.15), (tx, .85, tz), M['smoke'])
    for dx in (-1.1, 1.1):
        for dz in (-.55, .55): cube('Table leg', (.08, .82, .08), (tx + dx, .41, tz + dz), M['smoke'])
    for dz in (-1.08, 1.08):
        if tx < 0:
            # The west table is a booth: tufted oxblood banquettes with high backs, on carpet.
            side = 1 if dz > 0 else -1
            # The seat's top at .565, where izakaya.js sits people at the tables.
            cube('Booth plinth', (2.5, .43, .44), (tx, .215, tz + dz), M['smoke'])
            cube('Booth seat', (2.5, .14, .46), (tx, .495, tz + dz), M['leather'], bevel=.04)
            cube('Booth back', (2.5, .66, .14), (tx, .82, tz + dz + side * .21), M['leather'], bevel=.05)
            cube('Booth top rail', (2.54, .05, .18), (tx, 1.17, tz + dz + side * .21), M['bartop'], bevel=.015)
            for row in range(2):
                for k in range(9):
                    ball('Tuft button', (.016, .016, .01), (tx - 1.1 + k * .275 + (row % 2) * .1375, .7 + row * .22, tz + dz + side * .138), M['button'], 6, 4)
            continue
        cube('Bench cushion', (2.5, .06, .42), (tx, .53, tz + dz), M['vinyl'], bevel=.02)
        cube('Bench board', (2.5, .04, .42), (tx, .48, tz + dz), M['smoke'])
        for dx in (-1.1, 1.1): cube('Bench support', (.08, .46, .36), (tx + dx, .23, tz + dz), M['smoke'])
    # What is on the table between friends.
    cube('Condiment tray', (.3, .02, .14), (tx, .955, tz), M['honey'])
    cyl('Soy cruet', .026, .09, (tx - .06, 1.01, tz), M['porcelain'], 10)
    cyl('Shichimi tin', .018, .07, (tx + .05, 1.0, tz), M['brown'], 10)
    cyl('Glass ashtray', .06, .025, (tx + .55, .96, tz + .3), M['clear'], 12)
    cube('Menu stand', (.14, .2, .02), (tx - .4, 1.045, tz - .05), M['label'])
    cyl('Big beer bottle', .038, .23, (tx - .7, 1.06, tz - .25), M['brown'], 10)
    cyl('Big beer neck', .016, .09, (tx - .7, 1.22, tz - .25), M['brown'], 8)
    cube('Beer label', (.05, .07, .004), (tx - .7, 1.07, tz - .21), M['label'])
    for dx, dz in ((-.95, .15), (-.35, -.35)):
        cyl('Beer in glass', .033, .11, (tx + dx, 1.0, tz + dz), M['beer'], 10)
        cyl('Beer head', .034, .02, (tx + dx, 1.065, tz + dz), M['foam'], 10)
    cyl('Edamame bowl', .08, .045, (tx + .35, .968, tz - .25), M['blue'], 12)
    for k in range(7): cube('Edamame pod', (.05, .015, .02), (tx + .35 + math.cos(k) * .04, .995, tz - .25 + math.sin(k) * .04), M['edamame'], rot=k)
    cube('Yakitori plate', (.3, .015, .11), (tx + .8, .955, tz - .3), M['blue'])
    for k in range(3):
        cube('Skewer', (.26, .01, .01), (tx + .8, .97, tz - .34 + k * .04), M['honey'])
        for j in range(4): cube('Yakitori', (.035, .028, .03), (tx + .72 + j * .05, .98, tz - .34 + k * .04), M['glaze'])

cube('Booth carpet', (3.3, .012, 3.0), (-3.5, .046, 2.2), M['carpet'])   # on the boards (their top is at .04)

# --------------------------------------------------------------------------- koagari
KX, KZ, KL = 5.3, 1.8, 5.4     # centre x, centre z, length along the wall
cube('Koagari platform', (2.0, .38, KL), (KX, .19, KZ), M['wainscot'])
cube('Koagari edge beam', (.1, .09, KL), (4.33, .345, KZ), M['honey'], bevel=.015)
for row in range(3):
    for col, mx in enumerate((4.82, 5.78)):
        mz = KZ - KL / 2 + .9 + row * 1.8
        cube('Tatami', (.94, .03, 1.78), (mx, .395, mz), M['tatami'])
        for dx in (-.455, .455): cube('Tatami edge', (.03, .032, 1.78), (mx + dx, .397, mz), M['heri'])
for tz in (.5, 3.1):
    cube('Low table', (.75, .05, 1.2), (KX, .745, tz), M['table'], bevel=.015)
    for dx in (-.3, .3):
        for dz in (-.5, .5): cube('Low table leg', (.06, .3, .06), (KX + dx, .56, tz + dz), M['smoke'])
    for dx in (-.58, .58):
        for dz in (-.3, .3): cube('Zabuton', (.5, .07, .52), (KX + dx, .445, tz + dz), M['zabuton'], bevel=.025)
    cyl('Tokkuri', .035, .11, (KX - .1, .83, tz - .2), M['porcelain'], 10)
    cyl('Tokkuri neck', .014, .05, (KX - .1, .905, tz - .2), M['porcelain'], 8)
    for dz in (-.05, .1): cyl('Ochoko', .022, .03, (KX + .05, .785, tz + dz), M['blue'], 10)
    cube('Sashimi plate', (.3, .015, .18), (KX, .78, tz + .35), M['porcelain'])
    for k in range(5): cube('Sashimi', (.05, .02, .12), (KX - .1 + k * .05, .795, tz + .35), fish[k % 3], rot=.2)
    cyl('Glass ashtray', .06, .025, (KX + .2, .783, tz - .4), M['clear'], 12)
cube('Kutsunugi stone', (.55, .12, .4), (4.02, .06, 1.8), M['stone'], bevel=.04)
for dz, shade in ((1.62, M['lacquer']), (1.95, M['brown'])):
    for dx in (-.07, .07): cube('Left shoes', (.1, .07, .26), (4.02 + dx, .155, dz), shade, bevel=.02)

# --------------------------------------------------------------------------- the room's edges
# Sake barrels by the west wall, and crates of empties by the door.
for bz in (-.75, .05):
    cyl('Komodaru', .3, .56, (-5.88, .3, bz), M['straw'], 16)
    for y in (.1, .5): ring('Barrel rope', .305, .02, (-5.88, y, bz), M['rope'])
    cube('Barrel label', (.02, .26, .3), (-5.57, .32, bz), M['red'])
crate(-5.6, 0, 5.75, M['crateR']); crate(-5.6, .3, 5.75, M['crateR']); crate(-5.1, 0, 5.75, M['crateY'])
cyl('Umbrella stand', .13, .5, (-2.35, .25, 5.95), M['blue'], 14)
for k, tilt in enumerate((.12, -.1)):
    o = cyl('Umbrella', .03, .95, (-2.35 + tilt * .5, .6, 5.95 + k * .04), M['lacquer'], 8)
    o.rotation_euler.y = tilt
for k in range(4): cyl('Coat peg', .018, .09, (-6.22, 1.78, 4.8 + k * .35), M['honey'], 8, axis='x')


# --------------------------------------------------------------------------- Sato Ramen
# The corner shop beside Minato, x 6.5 to 11.4 and z -6.4 to 3.7: its kitchen is the east
# end of the same line, open to Minato's behind the counter, and its customers come in
# by their own door at the front.
RX0, RX1, RZ0, RZ1 = 6.5, 11.4, -6.4, 3.7
RW, RD, RCX, RCZ = RX1 - RX0, RZ1 - RZ0, (RX0 + RX1) / 2, (RZ0 + RZ1) / 2
cube('Ramen base', (RW + .2, .3, RD), (RCX, -.16, RCZ), M['smoke'])
row = 0; zz = RZ0
while zz < RZ1 - .01:
    for col in range(int(RW / .3) + 1):
        xx = RX0 + .15 + col * .3
        if xx > RX1: break
        cube('Quarry tile', (.29, .04, .29), (xx, .02, zz + .15), M['quarry'] if (row + col) % 3 else M['quarryB'])
    zz += .3; row += 1
cube('Ramen back wall', (RW + .2, 3.8, .2), (RCX, 1.9, RZ0), M['ramenplaster'])
cube('Ramen east wall', (.2, 3.8, RD + .2), (RX1 + .1, 1.9, RCZ), M['ramenplaster'])
cube('Ramen west face', (.04, 3.8, RZ1 + 3.35), (RX0 + .02, 1.9, (RZ1 - 3.35) / 2), M['ramenplaster'])
for side, fx in ((1, RX0 + .05), (-1, RX1 - .01)):
    cube('Ramen wall tile', (.02, 1.1, RZ1 + 3.3), (fx, .55, (RZ1 - 3.3) / 2), M['tile'])
    for k in range(1, 4): cube('Tile joint', (.03, .008, RZ1 + 3.3), (fx, k * .275, (RZ1 - 3.3) / 2), M['grout'])
cube('Ramen kitchen tile', (RW, 1.1, .02), (RCX, 1.45, RZ0 + .125), M['tile'])
for k in range(1, 16): cube('Tile joint', (.008, 1.1, .005), (RX0 + k * .3, 1.45, RZ0 + .138), M['grout'])
# The front wall with the door on the right, the noren inside it, and a window.
DX, DW = 9.75, 1.3
cube('Ramen front wall', (DX - DW / 2 - RX0, 3.8, .2), ((RX0 + DX - DW / 2) / 2, 1.9, RZ1), M['ramenplaster'])
cube('Ramen front wall', (RX1 - DX - DW / 2, 3.8, .2), ((RX1 + DX + DW / 2) / 2, 1.9, RZ1), M['ramenplaster'])
cube('Ramen door lintel', (DW, 1.6, .2), (DX, 3.0, RZ1), M['ramenplaster'])
cube('Ramen door glass', (DW - .1, 2.1, .02), (DX, 1.1, RZ1 + .06), M['glass'])
for dx in (-DW / 2, 0, DW / 2): cube('Door frame', (.05, 2.2, .06), (DX + dx, 1.1, RZ1 + .05), M['steel'])
cube('Door frame', (DW, .05, .06), (DX, 2.2, RZ1 + .05), M['steel'])
for k in range(2): cube('Ramen noren', (DW / 2 - .04, .7, .01), (DX - DW / 4 + k * DW / 2, 1.85, RZ1 - .13), M['lacq_red'])
cube('Noren rod', (DW + .1, .03, .03), (DX, 2.22, RZ1 - .13), M['lacquer'])
shoji('Ramen window', (7.8, 1.72, RZ1 - .11), 1.8, 1.0, 'x')
# Ceiling, and fluorescent tubes rather than lanterns: a lunch counter, not a bar.
for zz in (-4.8, -1.6, 1.6):
    cube('Ceiling beam', (RW, .24, .2), (RCX, 3.62, zz), M['smoke'], bevel=.02)
for k in range(21):
    cube('Ceiling slat', (RW, .02, .08), (RCX, 3.77, RZ0 + .15 + k * .5), M['floorB'])
cube('Ramen ceiling', (RW + .2, .06, RD + .2), (RCX, 3.83, RCZ), M['floorA'])
for tz in (-2.6, .3, 2.6):
    cube('Tube fitting', (.14, .06, 1.3), (RCX, 3.56, tz), M['steel'])
    cyl('Fluorescent tube', .025, 1.2, (RCX, 3.5, tz), M['tube'], 8, axis='z')

# The ramen kitchen: noodle boiler, the two stock pots, and the toppings.
cube('Noodle boiler', (1.2, .86, .75), (7.25, .43, -5.95), M['steel'])
cube('Boiler water', (1.06, .01, .6), (7.25, .9, -5.95), M['clear'])
for k in range(6):
    cyl('Tebo basket', .07, .16, (6.9 + (k % 3) * .35, .88, -6.12 + (k // 3) * .3), M['darksteel'], 10)
    cyl('Tebo handle', .01, .28, (6.9 + (k % 3) * .35, 1.02, -5.98 + (k // 3) * .3), M['lacquer'], 6, axis='z')
cube('Pot stand', (1.3, .62, .75), (8.6, .31, -5.95), M['darksteel'])
for dx in (-.32, .32):
    cyl('Soup pot', .28, .5, (8.6 + dx, .87, -5.95), M['steel'], 18)
    cyl('Soup', .26, .01, (8.6 + dx, 1.125, -5.95), M['broth'], 18)
    cyl('Pot lid', .29, .02, (8.6 + dx + .2, 1.14, -5.95 + .18), M['steel'], 18)
cube('Toppings table', (1.35, .86, .75), (9.95, .43, -5.95), M['steel'])
cube('Toppings top', (1.37, .035, .77), (9.95, .88, -5.95), M['steel'])
for k, (m, shape) in enumerate(((M['chashu'], 'disc'), (M['negi'], 'bits'), (M['menma'], 'bits'), (M['nori'], 'sheet'), (M['egg'], 'egg'))):
    tx = 9.45 + k * .25
    cube('Toppings tray', (.22, .04, .3), (tx, .92, -5.95), M['steel'])
    for j in range(3):
        if shape == 'disc': cyl('Chashu slice', .045, .012, (tx, .95, -6.03 + j * .08), m, 12)
        elif shape == 'sheet': cube('Nori sheet', (.08, .005, .12), (tx, .945, -6.02 + j * .03), m)
        elif shape == 'egg': ball('Ajitama', (.03, .025, .035), (tx, .955, -6.03 + j * .08), m, 8, 5)
        else: cube('Topping', (.12, .02, .06), (tx, .95, -6.03 + j * .08), m, rot=j * .6)
cube('Ramen canopy', (2.8, .32, .85), (7.95, 2.35, -5.95), M['hood'], bevel=.02)
cube('Ramen canopy duct', (.45, 1.25, .45), (7.95, 3.1, -6.15), M['hood'])
cube('Bowl shelf', (1.4, .04, .3), (9.95, 1.95, -6.15), M['honey'])
for k in range(4):
    for j in range(4): cyl('Donburi', .085, .07, (9.5 + k * .3, 2.0 + j * .075, -6.15), M['porcelain'], 14)
    cyl('Donburi rim', .087, .012, (9.5 + k * .3, 2.27, -6.15), M['red'], 14)
# The back room, off the ramen kitchen, behind its noren.
cube('Back room opening', (.9, 2.0, .02), (11.0, 1.0, RZ0 + .13), M['lacquer'])
for dx in (-.5, .5): cube('Doorway post', (.1, 2.1, .12), (11.0 + dx, 1.05, RZ0 + .16), M['smoke'])
cube('Doorway lintel', (1.1, .1, .12), (11.0, 2.08, RZ0 + .16), M['smoke'])
for k in range(2): cube('Noren panel', (.42, .8, .01), (10.78 + k * .44, 1.62, RZ0 + .2), M['noren'])

# The counter, a match for Minato's, and five chrome stools with red tops.
# A real open passage at the east end, wide enough for a person and a bowl tray.
cube('Ramen counter carcass', (3.5, .95, .75), (8.4, .475, -2.55), M['smoke'])
for k in range(17):cube('Counter front slat', (.1, .86, .03), (6.8+k*.197,.52,-2.155),M['wainscot'])
cube('Ramen guest ledge', (3.6,.07,.55),(8.4,1.075,-2.2),M['honey'],bevel=.015)
cube('Ramen serving shelf',(3.5,.06,.26),(8.4,1.25,-2.6),M['honey'])
cube('Ramen work top cabinet',(3.5,.88,.58),(8.4,.44,-3.06),M['steel'])
cube('Ramen work top',(3.55,.035,.62),(8.4,.9,-3.06),M['steel'])
RSTOOLS=(7.1,7.8,8.5,9.2,9.9)
for sx in RSTOOLS:
    cyl('Ramen stool top', .19, .08, (sx, .72, -1.42), M['vinyl'], 16)
    cyl('Ramen stool post', .03, .66, (sx, .36, -1.42), M['steel'], 10)
    cyl('Ramen stool foot', .17, .03, (sx, .02, -1.42), M['steel'], 14)
    ring('Ramen foot ring', .14, .012, (sx, .28, -1.42), M['steel'])
    cube('Chopstick box', (.14, .08, .06), (sx - .3, 1.15, -2.35), M['honey'])
    cyl('Water cup', .033, .09, (sx + .3, 1.155, -2.1), M['clear'], 10)
for cx in (7.65, 9.45, 10.35):
    cyl('Pepper shaker', .02, .08, (cx - .05, 1.15, -2.36), M['porcelain'], 10)
    cyl('Garlic jar', .03, .07, (cx + .03, 1.145, -2.36), M['clear'], 10)
    cyl('Beni shoga pot', .028, .06, (cx + .1, 1.14, -2.36), M['red'], 10)
cyl('Water pitcher', .06, .22, (8.55, 1.22, -2.35), M['steel'], 12)
# A ledge along the east wall for the lunch rush, and its three stools.
cube('Wall ledge', (.38, .05, 2.4), (RX1 - .2, 1.05, 1.2), M['honey'], bevel=.015)
for k in range(3): cube('Ledge bracket', (.3, .12, .04), (RX1 - .17, .97, .2 + k * 1.0), M['smoke'])
for lz in (.3, 1.2, 2.1):
    cyl('Ramen stool top', .17, .07, (RX1 - .75, .7, lz), M['vinyl'], 16)
    cyl('Ramen stool post', .03, .64, (RX1 - .75, .35, lz), M['steel'], 10)
    cyl('Ramen stool foot', .15, .03, (RX1 - .75, .02, lz), M['steel'], 14)
# The meal-ticket machine by the door: pay first, hand the ticket over the counter.
cube('Ticket machine', (.72, 1.6, .5), (6.95, .8, RZ1 - .38), M['ticket'], bevel=.03)
cube('Ticket machine panel', (.6, .6, .02), (6.95, 1.2, RZ1 - .64), M['cream'])
for r in range(4):
    for c in range(3): cube('Ticket button', (.14, .1, .02), (6.77 + c * .18, .98 + r * .14, RZ1 - .655), M['red'] if (r + c) % 4 == 0 else M['porcelain'])
cube('Coin slot', (.12, .03, .02), (7.12, 1.62, RZ1 - .655), M['darksteel'])
cube('Ticket tray', (.3, .06, .1), (6.95, .7, RZ1 - .66), M['darksteel'])
# A television up in the corner for the lunchtime news, and a lucky daruma.
cube('TV bracket', (.3, .05, .3), (RX1 - .3, 2.7, RZ1 - .4), M['smoke'])
cube('Ramen television', (.55, .42, .42), (RX1 - .35, 2.95, RZ1 - .45), M['darksteel'], bevel=.02)
cube('Daruma shelf', (.5, .04, .25), (RX1 - .2, 2.0, -1.5), M['honey'])
ball('Daruma', (.1, .12, .09), (RX1 - .22, 2.14, -1.5), M['red'], 10, 6)

# --------------------------------------------------------------------------- lights
def akachochin(x, y, z):
    ball('Red paper lantern', (.2, .3, .2), (x, y, z), M['lantern'], 14, 8)
    for dy in (-.28, .28): cyl('Lantern cap', .11, .04, (x, y + dy, z), M['lacquer'], 12)
    for dy in (-.14, 0, .14): ring('Lantern rib', .2 * math.sqrt(1 - (dy / .31) ** 2), .006, (x, y + dy, z), M['lacquer'])
    cyl('Lantern cord', .008, 3.62 - (y + .3), (x, (3.62 + y + .3) / 2, z), M['lacquer'], 6)
def bell(x, y, z):
    # Black bell shades in a row over the counter, each pooling light on the bar top.
    cone('Bar pendant shade', .17, .065, .3, (x, y, z), M['lacquer'], 18)
    cyl('Bar pendant collar', .068, .05, (x, y + .17, z), M['darksteel'], 12)
    ball('Bar pendant bulb', (.06, .05, .06), (x, y - .14, z), M['bulb'], 10, 6)
    cyl('Bar pendant cord', .007, 3.62 - (y + .2), (x, (3.62 + y + .2) / 2, z), M['lacquer'], 6)
for lx in (-3.8, -2.3, -.8, .7, 2.2): bell(lx, 2.45, -2.25)
akachochin(-5.2, 2.9, 5.6)   # one lantern left, by the door
def pendant(x, y, z):
    cone('Enamel shade', .24, .05, .16, (x, y, z), M['enamel'], 16)
    ball('Bulb', (.05, .06, .05), (x, y - .09, z), M['bulb'], 10, 6)
    cyl('Pendant cord', .007, 3.7 - y, (x, (3.7 + y) / 2, z), M['lacquer'], 6)
for px, py, pz in ((KX, 2.15, .5), (KX, 2.15, 3.1)):   # the koagari keeps its enamel shades
    pendant(px, py, pz)
for px, pz in ((-3.5, 2.2), (2.6, 2.0)): bell(px, 2.35, pz)   # the tables have the bar's

cube('Entry mat', (2.1, .02, .9), (0, .05, 5.5), M['vinyl'])

# A lived-in lounge corner: old upholstered bench, walnut tables and amber globes.
upholstery=mat('Worn olive upholstery','807254',.95)
for z in (4.15,5.0):
 cube('Lounge seat',(.72,.18,.78),(-5.62,.47,z),upholstery,bevel=.045)
 cube('Lounge back',(.16,.70,.78),(-5.94,.88,z),upholstery,bevel=.035)
 cube('Lounge plinth',(.60,.40,.75),(-5.62,.20,z),M['smoke'])
 cube('Lounge table',(.66,.055,.66),(-4.6,.72,z),M['honey'],bevel=.015)
 cyl('Lounge table post',.035,.68,(-4.6,.35,z),M['steel'],10)
 for ang in (0,math.pi/2):cube('Lounge table foot',(.60,.04,.06),(-4.6,.04,z),M['darksteel'],rot=ang)
 cyl('Lounge pendant cord',.009,.60,(-5.1,3.35,z),M['lacquer'],6)
 ball('Amber globe lamp',(.18,.18,.18),(-5.1,2.98,z),M['bulb'],12,8)
 cube('Table menu',(.10,.19,.015),(-4.6,.84,z-.15),M['label'])
# Small practical details around the ramen cooking line.
cube('Ramen extractor',(3.3,.32,.86),(8.55,2.40,-5.94),M['hood'],bevel=.03)
cube('Ramen extractor duct',(.42,1.05,.42),(8.55,3.06,-6.11),M['hood'])
for i in range(7):cube('Hood filter seam',(.035,.02,.72),(7.25+i*.38,2.23,-5.94),M['darksteel'])
for x in (7.0,9.7):
 cube('Cloth',(.16,.012,.22),(x,1.0,-5.52),M['label'])
 cyl('Sauce bottle',.036,.23,(x,1.08,-5.92),M['brown'],10)
 cube('Bottle label',(.065,.10,.003),(x,1.08,-5.883),M['label'])

# Sato's window table and old television, inspired by a modest 1990s diner.
cube('Ramen corner table',(1.35,.07,1.05),(7.65,.75,1.15),M['honey'],bevel=.015)
for x in (7.13,8.17):
 for z in (.75,1.55):cube('Corner table leg',(.07,.72,.07),(x,.36,z),M['smoke'])
for z in (.35,1.95):
 cube('Corner chair seat',(.45,.07,.44),(7.65,.46,z),M['honey'])
 cube('Corner chair back',(.45,.43,.06),(7.65,.73,z+(-.22 if z<1 else .22)),M['smoke'])
 for x in (7.48,7.82):
  for dz in (-.17,.17):cube('Corner chair leg',(.035,.43,.035),(x,.23,z+dz),M['smoke'])
cube('Ramen window ledge',(1.8,.06,.25),(7.8,1.12,3.53),M['honey'])
cube('TV corner shelf',(1.0,.08,.8),(10.78,2.76,2.96),M['honey'])
cube('Old television',(.66,.48,.42),(10.78,3.04,2.98),M['smoke'],bevel=.02)
cube('Television glass',(.51,.36,.014),(10.71,3.06,3.198),M['darksteel'],bevel=.02)
for y in (2.97,3.1):cyl('TV dial',.032,.016,(11.05,y,3.21),M['honey'],8,axis='z')
cyl('Table condiment jar',.035,.12,(8.03,.85,1.38),M['red'],10)
cube('Chopstick holder',(.12,.10,.06),(8.10,.84,1.13),M['honey'])
# Dark timber dado, green plaster above, clearly different from the shared kitchen tile.
for z in (-1.25,0,1.25,2.5):
 cube('Ramen cedar panel',(.03,.95,1.20),(6.57,.5,z),M['wainscot'])
 cube('Ramen timber cap',(.045,.06,1.20),(6.60,1.01,z),M['honey'])

# --------------------------------------------------------------------------- export
# The game allows the room ten draws. Every finish above keeps its colour, but as a
# vertex colour on one of a handful of shared surfaces -- matte, glossy, metal, glass,
# and the three that give light -- so the whole room is seven meshes.
def surface(name, rough, metal=0., vertex=True, glow=None, glow_strength=0., alpha=1.):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nodes = m.node_tree.nodes; bs = nodes['Principled BSDF']
    bs.inputs['Roughness'].default_value = rough; bs.inputs['Metallic'].default_value = metal
    if vertex:
        attr = nodes.new('ShaderNodeVertexColor'); attr.layer_name = 'Col'
        m.node_tree.links.new(attr.outputs['Color'], bs.inputs['Base Color'])
    if glow:
        bs.inputs['Base Color'].default_value = (*lin(glow), 1)
        bs.inputs['Emission Color'].default_value = (*lin(glow), 1); bs.inputs['Emission Strength'].default_value = glow_strength
    if alpha < 1:
        bs.inputs['Base Color'].default_value = (*lin('d8ecef'), 1); bs.inputs['Alpha'].default_value = alpha
        for attr_name, value in (('blend_method', 'BLEND'), ('surface_render_method', 'BLENDED')):
            try: setattr(m, attr_name, value)
            except Exception: pass
    return m
SURFACES = {
    'matte': surface('Minato matte', .78), 'gloss': surface('Minato glossy', .32),
    'metal': surface('Minato steel', .38, .7), 'glass': surface('Minato glass', .05, vertex=False, alpha=.10),
    'lantern': surface('Minato lantern paper', .7, vertex=False, glow='c8402e', glow_strength=.9),
    'warm': surface('Minato lamplight', .8, vertex=False, glow='f6e2b8', glow_strength=1.2),
    'ember': surface('Minato embers', .9, vertex=False, glow='ff6a1f', glow_strength=3.0),
}
def surface_for(m):
    if m == M['glass']: return 'glass'
    if m == M['lantern']: return 'lantern'
    if m in (M['shoji'], M['bulb']): return 'warm'
    if m == M['ember']: return 'ember'
    bs = m.node_tree.nodes['Principled BSDF']
    if bs.inputs['Alpha'].default_value < .99: return 'glass'
    if bs.inputs['Metallic'].default_value > .3: return 'metal'
    return 'gloss' if bs.inputs['Roughness'].default_value < .5 else 'matte'

def merge_export(name):
    for o in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
        m = o.data.materials[0]; colour = m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value
        layer = o.data.color_attributes.new(name='Col', type='BYTE_COLOR', domain='CORNER')
        for item in layer.data: item.color = (colour[0], colour[1], colour[2], 1)
        o.data.materials[0] = SURFACES[surface_for(m)]
    for key, m in SURFACES.items():
        chosen = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.data.materials[0] == m]
        if not chosen: continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in chosen: o.select_set(True)
        bpy.context.view_layer.objects.active = chosen[0]
        # Stable room batch names; the versioned filename identifies the refit.
        bpy.ops.object.join(); bpy.context.object.name = 'minato-interior / ' + m.name
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(art / (name + '.blend')), compress=True)
    options = dict(filepath=str(out / (name + '.glb')), export_format='GLB', export_yup=True, export_animations=False, export_apply=True)
    try: bpy.ops.export_scene.gltf(**options, export_vertex_color='MATERIAL')
    except TypeError: bpy.ops.export_scene.gltf(**options)
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    return {'meshes': len(meshes), 'triangles': sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes),
            'bytes': (out / (name + '.glb')).stat().st_size}

sys.path.insert(0, str(Path(__file__).resolve().parent))
from minato_real_props import create_prop_api, upgrade_real_props
from minato_food_props import upgrade_food_props
from minato_device_props import upgrade_device_props
from minato_walnut_refit import retire_original_furniture, remove_counter_contact_faces
walnut_replacement = retire_original_furniture(bpy)
prop_api = create_prop_api(globals())
before = {'objects': len([o for o in bpy.context.scene.objects if o.type == 'MESH']),
          'triangles': sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type == 'MESH')}
coverage = {}
for category, upgrade in [('vessels-kitchen-storage-furniture', upgrade_real_props), ('food', upgrade_food_props), ('devices', upgrade_device_props)]:
    print('Upgrading', category, flush=True)
    coverage[category] = upgrade(prop_api)
    print('Completed', category, flush=True)
from minato_furniture_heights import apply_furniture_heights
furniture_report=apply_furniture_heights(bpy,root)
walnut_replacement['counterContacts'] = remove_counter_contact_faces(bpy, furniture_report['heights']['serviceCounter'])
(art/'furniture-height-report.json').write_text(json.dumps(furniture_report,indent=2))
after = {'objects': len([o for o in bpy.context.scene.objects if o.type == 'MESH']),
         'triangles': sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type == 'MESH')}
geometry_by_family = {}
import re
for obj in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    family=re.sub(r'\.\d+$','',obj.name)
    geometry_by_family[family]=geometry_by_family.get(family,0)+sum(len(p.vertices)-2 for p in obj.data.polygons)
(art / 'minato-prop-inventory.json').write_text(json.dumps({'before': before, 'after': after, 'coverage': coverage, 'replacement': walnut_replacement,
    'geometryByFamily': dict(sorted(geometry_by_family.items(),key=lambda entry:-entry[1]))}, indent=2))
report = merge_export('minato-interior-walnut')
path = art / 'export-report.json'
data = json.loads(path.read_text()) if path.exists() else {}
data['minato-interior-walnut'] = report
path.write_text(json.dumps(data, indent=2))
print('minato-interior-walnut', report)
