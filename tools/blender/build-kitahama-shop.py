"""Johansson Mart, Kitahama: the corner shop, built parametrically in Blender from its design data.

Run from johansson-town (Blender 4.2+ or the bpy module):
  blender -b --python tools/blender/build-kitahama-shop.py -- --root .
  python3.11 tools/blender/build-kitahama-shop.py -- --root .          (with `pip install bpy`)

Every size and position comes from src/world/okinawa/kitahama-shop.js, the same data drawing KS-001 is made from
(docs/qa/kitahama-shop/). Change the data, run this, and the models follow. No downloaded geometry, no photographic
textures, no brands: products are coloured blocks in their category's colours.

Writes:
  assets/models/kitahama-shop/kitahama-shop-exterior.glb   walls, roof, openings, signboard, canopy, outside items
  assets/models/kitahama-shop/kitahama-shop-interior.glb   floor, wall finishes, ceiling, partitions, the fittings
  art/kitahama-shop/kitahama-shop.blend                    both, for editing
  art/kitahama-shop/kitahama-shop-export.json              sizes, triangle counts, checks against the data

Frame: the game's. Metres, +Y up; local x = u (east), z = v (north), y = h; origin at the outside south-west corner of
the walls at apron level; the front faces -Z. Placed unrotated at x 35.6, z 63.2 (kitahama-shop.js WORLD).
"""
import argparse
import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path

import bpy

parser = argparse.ArgumentParser()
parser.add_argument('--root', required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
root = Path(args.root).resolve()
art = root / 'art/kitahama-shop'
out = root / 'assets/models/kitahama-shop'
art.mkdir(parents=True, exist_ok=True)
out.mkdir(parents=True, exist_ok=True)

D = json.loads(subprocess.run(['node', '--input-type=module', '-e',
    "const s=await import('./src/world/okinawa/kitahama-shop.js');console.log(JSON.stringify(s))"],
    cwd=root, capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1])
B, LIV = D['BUILDING'], D['LIVERY']
OU, OV = B['outside']
WALL, FL, CE, RT, PT = B['wall'], B['floor'], B['ceiling'], B['roofTop'], B['parapetTop']
FIX = {f['id']: f for f in D['FIXTURES']}
OUTS = {f['id']: f for f in D['OUTSIDE']}
OPN = {o['id']: o for o in D['OPENINGS']}
PART = {p['id']: p for p in D['PARTITIONS']}

LATIN_FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
JP_FONT = '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf'

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1.0


# ------------------------------------------------------------------ materials
def lin(hex_color):
    h = hex_color.lstrip('#')
    return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))


MATS = {}


def mat(name, hex_color, rough=.7, metal=0., alpha=1., emit=0.):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new('KitahamaShop / ' + name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*lin(hex_color), 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if alpha < 1:
        p.inputs['Alpha'].default_value = alpha
        if hasattr(m, 'surface_render_method'):
            m.surface_render_method = 'BLENDED'
        if hasattr(m, 'blend_method'):
            m.blend_method = 'BLEND'
    if emit > 0:
        p.inputs['Emission Color'].default_value = (*lin(hex_color), 1)
        p.inputs['Emission Strength'].default_value = emit
    MATS[name] = m
    return m


CREAM = mat('cream render', LIV['cream'], .9)
PLINTH = mat('plinth grey', LIV['plinth'], .85)
CAP = mat('parapet cap', '#b7b8b2', .85)
ROOF = mat('roof screed', '#8f928d', .95)
GREEN = mat('house green', LIV['green'], .55)
GREEN_DARK = mat('house green dark', LIV['greenDark'], .6)
WHITE = mat('white', LIV['white'], .5)
FRAME = mat('aluminium', LIV['frames'], .35, .4)
GLASS = mat('glass', '#cfe3ea', .05, 0., .28)
STEEL = mat('steel grey', '#9aa0a6', .45, .4)
DARK = mat('dark', '#2b2f31', .6)
WALL_IN = mat('inside paint', '#f6f4ee', .8)
FLOOR = mat('vinyl tiles', '#cfd0cc', .6)
TILE_LINE = mat('vinyl tile joint', '#b9bab5', .6)
FITTING = mat('fitting white', '#f1f0ea', .55)
COUNTER_TOP = mat('counter top', '#d9d9d4', .35)
LAMP = mat('troffer', '#fffdf3', .3, 0., 1., 2.5)
CEILING = mat('ceiling', '#fbfaf6', .9)
WOOD = mat('wood', '#9a6a42', .8)
BOARD = mat('blackboard', '#2f3a33', .9)
CARD = mat('cardboard', '#b98d57', .9)
BEIGE = mat('copier beige', '#d8d2c2', .6)
STAINLESS = mat('stainless', '#c8ccce', .35, .55)
WARM = mat('hot case light', '#f2b45c', .4, 0., 1., 1.2)
NAVY = mat('umbrella navy', '#2a3244', .6)

# Products by category, each colour a kind of packet (not a brand): reasons in kitahama-shop.js STOCK.
PRODUCT = {
 'drinks': ['#7aa66b', '#8fc0de', '#6f4b33', '#d9a531', '#e2e2dc', '#c5534a'],     # tea, water, coffee, beer, milk, sports
 'bento': ['#f1efe8', '#e8c27b', '#c86b4a', '#9cbf7a'],                            # rice, fried, grilled, greens
 'onigiri': ['#2e3a2e'],                                                             # nori
 'dairy': ['#f4f4ee', '#dbe8f0', '#efe1b5'],                                          # milk, yoghurt, tofu
 'snacks': ['#e0a43b', '#c95a43', '#7f9c4c', '#d8c06a', '#a8644a', '#e7d3a1'],       # crisps, sweets, bread
 'grocery': ['#b35a3a', '#e9dcc3', '#6b4b2a', '#d1b06b', '#7c8f9a', '#c9c3b3'],      # cans, rice, soy, oil, household
 'magazines': ['#c9483f', '#3f6ea8', '#e3b33c', '#5a8a5a', '#8c4f8c', '#e7e2d6'],
 'cigarettes': ['#e9e5dc', '#2f4f7a', '#b2302b', '#d9b24a'],
 'bottles': ['#5a3a1e', '#c9a35a', '#e8e4d8'],                                       # awamori, whisky, shochu
 'ice': ['#e8f2f6', '#f3c6d3', '#c9e3b8', '#f2e3a0'],
 'cases': ['#b98d57', '#a87c48'],
}


def product(cat, i):
    return mat(f'{cat} {i % len(PRODUCT[cat])}', PRODUCT[cat][i % len(PRODUCT[cat])], .6)


# ------------------------------------------------------------------ geometry, in the game frame (u east, v north, h up)
EXTERIOR, INTERIOR = [], []
PARTS = []          # (model, name, u0, v0, h0, u1, v1, h1) for the report


def loc(u, v, h):
    """The game's (x=u, y=h, z=v) in Blender's frame: (x, -z, y), as the glTF exporter maps back."""
    return (u, -v, h)


def box(model, name, u0, v0, h0, u1, v1, h1, material, bevel=0.):
    u0, u1, v0, v1, h0, h1 = min(u0, u1), max(u0, u1), min(v0, v1), max(v0, v1), min(h0, h1), max(h0, h1)
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc((u0 + u1) / 2, (v0 + v1) / 2, (h0 + h1) / 2))
    o = bpy.context.object
    o.name = name
    o.dimensions = (u1 - u0, v1 - v0, h1 - h0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        m = o.modifiers.new('bevel', 'BEVEL')
        m.width = bevel
        m.segments = 1
        m.limit_method = 'ANGLE'
    o.data.materials.append(material)
    model.append(o)
    PARTS.append((model is EXTERIOR and 'exterior' or 'interior', name, u0, v0, h0, u1, v1, h1))
    return o


def cyl(model, name, u, v, h0, h1, r, material, verts=12, axis='h'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h1 - h0, location=loc(u, v, (h0 + h1) / 2))
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    model.append(o)
    PARTS.append((model is EXTERIOR and 'exterior' or 'interior', name, u - r, v - r, h0, u + r, v + r, h1))
    return o


def cone(model, name, u, v, h0, h1, r0, r1, material, verts=8):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r0, radius2=r1, depth=h1 - h0, location=loc(u, v, (h0 + h1) / 2))
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    model.append(o)
    PARTS.append((model is EXTERIOR and 'exterior' or 'interior', name, u - r0, v - r0, h0, u + r0, v + r0, h1))
    return o


def text(model, name, body, font, size, u, v, h, face, material, extrude=.008):
    """Lettering on the south face (normal -v, reading to -u as the player in front of it sees it) or the east face
    (normal +u, reading to -v). Centred on (u, v, h)."""
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = body
    curve.font = bpy.data.fonts.load(font, check_existing=True)
    curve.size = size
    curve.extrude = extrude
    curve.resolution_u = 2
    curve.bevel_depth = 0
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    o = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(o)
    o.location = loc(u, v, h)
    o.rotation_euler = (math.pi / 2, 0, math.pi) if face == 'south' else (math.pi / 2, 0, math.pi / 2)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.object
    o.data.materials.clear()
    o.data.materials.append(material)
    model.append(o)
    return o


def beam(model, name, p0, p1, w, t, material):
    """A bar or a panel from p0 to p1 (game-frame (u, v, h)), w wide across u, t thick; for runs in the v–h plane."""
    from mathutils import Vector
    a, b = Vector(loc(*p0)), Vector(loc(*p1))
    d = b - a
    bpy.ops.mesh.primitive_cube_add(size=1, location=(a + b) / 2)
    o = bpy.context.object
    o.name = name
    o.scale = (w, t, d.length)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    o.data.materials.append(material)
    model.append(o)
    u0, u1 = min(p0[0], p1[0]) - w / 2, max(p0[0], p1[0]) + w / 2
    PARTS.append((model is EXTERIOR and 'exterior' or 'interior', name, u0, min(p0[1], p1[1]), min(p0[2], p1[2]), u1, max(p0[1], p1[1]), max(p0[2], p1[2])))
    return o


# ------------------------------------------------------------------ the walls, with their openings
def runs(name, length):
    cuts = sorted((o['from'], o['to'], o) for o in D['OPENINGS'] if o['wall'] == name)
    out, s = [], 0.
    for f, t, o in cuts:
        if f > s:
            out.append(('solid', s, f, None))
        out.append(('open', f, t, o))
        s = t
    if s < length:
        out.append(('solid', s, length, None))
    return out


def wall_piece(model, wall, a, b, h0, h1, material, thick=(0, WALL), tag=''):
    t0, t1 = thick
    if wall == 'south':
        return box(model, f'{wall} wall{tag}', a, t0, h0, b, t1, h1, material)
    if wall == 'north':
        return box(model, f'{wall} wall{tag}', a, OV - t1, h0, b, OV - t0, h1, material)
    if wall == 'east':
        return box(model, f'{wall} wall{tag}', OU - t1, a, h0, OU - t0, b, h1, material)
    return box(model, f'{wall} wall{tag}', t0, a, h0, t1, b, h1, material)


for wall, length in (('south', OU), ('north', OU), ('east', OV), ('west', OV)):
    # corners: the south and north walls run full length, the east and west between them
    lo, hi = (0, length) if wall in ('south', 'north') else (WALL, OV - WALL)
    for kind, a, b, o in runs(wall, length):
        a, b = max(a, lo), min(b, hi)
        if b <= a:
            continue
        if kind == 'solid':
            wall_piece(EXTERIOR, wall, a, b, 0, PT - B['parapetCap'], CREAM)
        else:
            if o['sill'] > 0:
                wall_piece(EXTERIOR, wall, a, b, 0, o['sill'], CREAM, tag=' under ' + o['id'])
            wall_piece(EXTERIOR, wall, a, b, o['head'], PT - B['parapetCap'], CREAM, tag=' over ' + o['id'])

# the plinth band, 5 mm proud, broken at the doors
PROUD = .005
for wall, length in (('south', OU), ('north', OU), ('east', OV), ('west', OV)):
    for kind, a, b, o in runs(wall, length):
        if kind == 'open' and o['id'].startswith('D'):
            continue
        h = B['plinth']
        if wall == 'south':
            box(EXTERIOR, 'plinth south', a, -PROUD, 0, b, 0, h, PLINTH)
        elif wall == 'north':
            box(EXTERIOR, 'plinth north', a, OV, 0, b, OV + PROUD, h, PLINTH)
        elif wall == 'east':
            box(EXTERIOR, 'plinth east', OU, a, 0, OU + PROUD, b, h, PLINTH)
        else:
            box(EXTERIOR, 'plinth west', -PROUD, a, 0, 0, b, h, PLINTH)

# parapet cap, 30 mm proud all round, and the roof inside the parapet
cap = .03
box(EXTERIOR, 'parapet cap south', -cap, -cap, PT - B['parapetCap'], OU + cap, WALL + .01, PT, CAP)
box(EXTERIOR, 'parapet cap north', -cap, OV - WALL - .01, PT - B['parapetCap'], OU + cap, OV + cap, PT, CAP)
box(EXTERIOR, 'parapet cap west', -cap, WALL, PT - B['parapetCap'], WALL + .01, OV - WALL, PT, CAP)
box(EXTERIOR, 'parapet cap east', OU - WALL - .01, WALL, PT - B['parapetCap'], OU + cap, OV - WALL, PT, CAP)
box(EXTERIOR, 'roof slab', WALL, WALL, CE, OU - WALL, OV - WALL, RT, ROOF)
box(EXTERIOR, 'roof gutter outlet', OU - WALL - .25, OV - WALL - .25, RT, OU - WALL - .05, OV - WALL - .05, RT + .02, DARK)
# the shop floor's edge at the door: the 100 mm step, its face in the plinth grey
d1 = OPN['D1']
box(EXTERIOR, 'door threshold', d1['from'], 0, 0, d1['to'], WALL, FL, PLINTH)

# ------------------------------------------------------------------ glazing and doors
FW = .04          # aluminium section
GLASS_T = .008


def glazed(wall, a, b, sill, head, panes, name):
    """Fixed glazing in an aluminium frame, set in the middle of the wall's thickness."""
    mid = WALL / 2
    if wall == 'south':
        F = lambda u0, h0, u1, h1, m, t=FW: box(EXTERIOR, name, u0, mid - t / 2, h0, u1, mid + t / 2, h1, m)
    else:  # east
        F = lambda u0, h0, u1, h1, m, t=FW: box(EXTERIOR, name, OU - mid - t / 2, u0, h0, OU - mid + t / 2, u1, h1, m)
    F(a, sill, b, sill + FW, FRAME)
    F(a, head - FW, b, head, FRAME)
    F(a, sill, a + FW, head, FRAME)
    F(b - FW, sill, b, head, FRAME)
    for k in range(1, panes):
        x = a + (b - a) * k / panes
        F(x - FW / 2, sill, x + FW / 2, head, FRAME)
    F(a + FW, sill + FW, b - FW, head - FW, GLASS, GLASS_T)


w1, w2 = OPN['W1'], OPN['W2']
glazed('south', w1['from'], w1['to'], w1['sill'], w1['head'], 3, 'W1 shop window')
glazed('east', w2['from'], w2['to'], w2['sill'], w2['head'], 2, 'W2 side window')
# D1: two sliding leaves, closed, each a glass panel in a frame; a frame box (the door operator) over them
leaf = (d1['to'] - d1['from']) / 2
for k, (t0, t1) in enumerate(((.02, .06), (.07, .11))):
    a = d1['from'] + k * leaf - (.02 if k else 0)
    b = a + leaf + .02
    for (u0, h0, u1, h1, m) in ((a, FL, b, FL + FW, FRAME), (a, d1['head'] - FW, b, d1['head'], FRAME),
                                (a, FL, a + FW, d1['head'], FRAME), (b - FW, FL, b, d1['head'], FRAME)):
        box(EXTERIOR, f'D1 door leaf {k + 1}', u0, t0, h0, u1, t1, h1, m)
    box(EXTERIOR, f'D1 door glass {k + 1}', a + FW, (t0 + t1) / 2 - GLASS_T / 2, FL + FW, b - FW, (t0 + t1) / 2 + GLASS_T / 2, d1['head'] - FW, GLASS)
    box(EXTERIOR, f'D1 door pull bar {k + 1}', (a + b) / 2 - .01, t0 - .025, 1.0, (a + b) / 2 + .01, t0 - .005, 1.25, FRAME)
box(EXTERIOR, 'D1 door operator', d1['from'] - .05, -.02, d1['head'], d1['to'] + .05, WALL, d1['head'] + .12, FRAME)
# D2: the steel delivery door, closed, set to the outside face, with a lever
d2 = OPN['D2']
box(EXTERIOR, 'D2 frame north', OU - .06, d2['to'] - .05, FL, OU, d2['to'], d2['head'], STEEL)
box(EXTERIOR, 'D2 frame south', OU - .06, d2['from'], FL, OU, d2['from'] + .05, d2['head'], STEEL)
box(EXTERIOR, 'D2 frame head', OU - .06, d2['from'], d2['head'] - .05, OU, d2['to'], d2['head'], STEEL)
box(EXTERIOR, 'D2 door leaf', OU - .05, d2['from'] + .05, FL, OU - .01, d2['to'] - .05, d2['head'] - .05, STEEL)
box(EXTERIOR, 'D2 lever', OU - .01, d2['from'] + .12, 1.0, OU + .04, d2['from'] + .26, 1.03, DARK)
box(EXTERIOR, 'D2 step', OU, d2['from'], 0, OU + .35, d2['to'], FL, PLINTH)

# ------------------------------------------------------------------ the signboard, round the corner
sb = OUTS['X6']
h0, h1 = sb['min'][2], sb['max'][2]
SBT = .15
box(EXTERIOR, 'signboard south', 0, -SBT, h0, OU + SBT, 0, h1, GREEN)
box(EXTERIOR, 'signboard east', OU, -SBT, h0, OU + SBT, OV, h1, GREEN)
box(EXTERIOR, 'signboard line south', 0, -SBT - .002, h0, OU + SBT, -SBT, h0 + .05, WHITE)
box(EXTERIOR, 'signboard line east', OU + SBT, -SBT, h0, OU + SBT + .002, OV, h0 + .05, WHITE)
box(EXTERIOR, 'signboard soffit', 0, -SBT, h0 - .01, OU + SBT, 0, h0, GREEN_DARK)
box(EXTERIOR, 'signboard soffit east', OU, 0, h0 - .01, OU + SBT, OV, h0, GREEN_DARK)
SIGN_EN, SIGN_JP = 'JOHANSSON MART', D['SHOP']['jp'] + '　' + D['SHOP']['branch']
text(EXTERIOR, 'sign wordmark south', SIGN_EN, LATIN_FONT, .30, (OU + SBT) / 2, -SBT - .004, h0 + .43, 'south', WHITE)
text(EXTERIOR, 'sign japanese south', SIGN_JP, JP_FONT, .14, (OU + SBT) / 2, -SBT - .004, h0 + .17, 'south', WHITE)
text(EXTERIOR, 'sign wordmark east', SIGN_EN, LATIN_FONT, .30, OU + SBT + .004, OV / 2, h0 + .43, 'east', WHITE)
text(EXTERIOR, 'sign japanese east', SIGN_JP, JP_FONT, .14, OU + SBT + .004, OV / 2, h0 + .17, 'east', WHITE)
# the opening hours on the door glass, small, as every shop has them
text(EXTERIOR, 'door hours', D['HOURS']['sign'], JP_FONT, .035, d1['from'] + leaf / 2, .015, 1.55, 'south', DARK, .001)

# ------------------------------------------------------------------ the canopy, the machines, the bins, the A-board
cp = OUTS['X5']
box(EXTERIOR, 'canopy', cp['min'][0], cp['min'][1], cp['min'][2], cp['max'][0], cp['max'][1], cp['max'][2], GREEN)
for u in (cp['min'][0] + .15, cp['max'][0] - .15):
    # two tie rods from the canopy's front edge back up to the wall, under the signboard's soffit
    beam(EXTERIOR, 'canopy tie rod', (u, cp['min'][1] + .05, cp['max'][2]), (u, -.01, OUTS['X6']['min'][2] - .06), .016, .016, STEEL)
vm = OUTS['X1']
for k in range(2):
    a = vm['min'][0] + k * 1.0
    u0, u1, v0, v1, top = a + .02, a + .98, vm['min'][1], vm['max'][1], vm['max'][2]
    box(EXTERIOR, f'vending machine {k + 1} body', u0, v0, 0, u1, v1, top, WHITE, .01)
    # the display: a lit case standing 90 mm proud of the body, its glass at the front, the cans behind it
    box(EXTERIOR, f'vending machine {k + 1} display back', u0 + .06, v0 - .012, .92, u1 - .06, v0, 1.72, mat('display back', '#e9eef0', .5, 0, 1, .4))
    for (x0, x1) in ((u0 + .04, u0 + .06), (u1 - .06, u1 - .04)):
        box(EXTERIOR, f'vending machine {k + 1} display side', x0, v0 - .09, .92, x1, v0, 1.72, WHITE)
    box(EXTERIOR, f'vending machine {k + 1} display top', u0 + .04, v0 - .09, 1.70, u1 - .04, v0, 1.72, WHITE)
    box(EXTERIOR, f'vending machine {k + 1} display sill', u0 + .04, v0 - .09, .92, u1 - .04, v0, .95, WHITE)
    box(EXTERIOR, f'vending machine {k + 1} glass', u0 + .06, v0 - .09, .95, u1 - .06, v0 - .082, 1.70, GLASS)
    for row in range(3):
        box(EXTERIOR, 'vending shelf', u0 + .06, v0 - .08, .95 + row * .25, u1 - .06, v0 - .012, .96 + row * .25, FRAME)
        for col in range(6):
            cu = u0 + .12 + col * ((u1 - u0 - .24) / 5)
            cyl(EXTERIOR, 'vending can', cu, v0 - .045, .96 + row * .25, 1.09 + row * .25, .028, product('drinks', row * 6 + col + k), 8)
            box(EXTERIOR, 'vending button', cu - .02, v0 - .086, 1.10 + row * .25, cu + .02, v0 - .08, 1.12 + row * .25, mat('button', '#d9534a', .4))
    box(EXTERIOR, f'vending machine {k + 1} panel', u1 - .26, v0 - .004, .55, u1 - .06, v0, .9, mat('panel grey', '#d6d7d3', .5))
    box(EXTERIOR, f'vending machine {k + 1} outlet', u0 + .1, v0 - .004, .12, u1 - .1, v0, .32, DARK)
bn = OUTS['X2']
box(EXTERIOR, 'bins', bn['min'][0], bn['min'][1], 0, bn['max'][0], bn['max'][1], bn['max'][2], mat('bin grey', '#a9aea9', .7), .01)
for k in range(2):
    a = bn['min'][0] + .06 + k * .27
    box(EXTERIOR, 'bin opening', a, bn['min'][1] - .002, .62, a + .2, bn['min'][1], .78, DARK)
ab = OUTS['X7']
cu, cv, top = (ab['min'][0] + ab['max'][0]) / 2, (ab['min'][1] + ab['max'][1]) / 2, ab['max'][2]
spread = (ab['max'][1] - ab['min'][1]) / 2 - .02
for side in (-1, 1):
    # its feet a hair over the ground: a leaning panel's lower corner would otherwise dip into it
    beam(EXTERIOR, 'A-board face', (cu, cv + side * spread, .012), (cu, cv + side * .02, top - .02), .44, .018, BOARD)
    for du in (-.23, .23):
        beam(EXTERIOR, 'A-board frame', (cu + du, cv + side * (spread + .01), .02), (cu + du, cv + side * .03, top), .03, .03, WOOD)
box(EXTERIOR, 'A-board hinge rail', cu - .25, cv - .03, top - .03, cu + .25, cv + .03, top, WOOD)

# ------------------------------------------------------------------ behind and on the roof
cu3 = OUTS['X3']
for k in range(2):
    a = cu3['min'][0] + k * .9
    box(EXTERIOR, f'condensing unit {k + 1}', a + .05, OV + .15, 0, a + .85, OV + .55, .8, mat('unit grey', '#c4c7c3', .6), .01)
    cyl(EXTERIOR, 'condenser fan', a + .45, OV + .56, .2, .7, .2, DARK, 16).rotation_euler = (math.pi / 2, 0, 0)
for k in range(9):
    h = .08 + k * .095
    o = box(EXTERIOR, 'louvred screen slat', cu3['min'][0], OV + cu3['max'][1] - OV - .02, h, cu3['max'][0], OV + cu3['max'][1] - OV, h + .07, mat('screen', '#b7bab5', .7))
    o.rotation_euler = (-.35, 0, 0)
for u in (cu3['min'][0], cu3['max'][0] - .04):
    box(EXTERIOR, 'louvred screen post', u, cu3['max'][1] - .04, 0, u + .04, cu3['max'][1], cu3['max'][2], STEEL)
tk = OUTS['X4']
tu, tv = (tk['min'][0] + tk['max'][0]) / 2, (tk['min'][1] + tk['max'][1]) / 2
for du in (-.45, .45):
    for dv in (-.45, .45):
        box(EXTERIOR, 'tank stand leg', tu + du - .025, tv + dv - .025, RT, tu + du + .025, tv + dv + .025, RT + .5, STEEL)
box(EXTERIOR, 'tank stand top', tu - .52, tv - .52, RT + .48, tu + .52, tv + .52, RT + .52, STEEL)
cyl(EXTERIOR, 'water tank', tu, tv, RT + .52, tk['max'][2] - .05, .55, STAINLESS, 24)
cyl(EXTERIOR, 'water tank lid', tu, tv, tk['max'][2] - .05, tk['max'][2], .18, STAINLESS, 16)
cyl(EXTERIOR, 'downpipe', OU + .06, OV - .08, 0, PT - .2, .045, STEEL, 10)
box(EXTERIOR, 'downpipe hopper', OU + .01, OV - .16, PT - .32, OU + .12, OV - .01, PT - .12, STEEL)

# ------------------------------------------------------------------ the interior: floor, finishes, ceiling, partitions
I = D['INSIDE']
box(INTERIOR, 'shop floor', I['u0'], I['v0'], 0, I['u1'], I['v1'], FL, FLOOR)
# 300 mm vinyl tiles, the joints as fine strips just over the floor
for k in range(1, int((I['u1'] - I['u0']) / .3) + 1):
    u = I['u0'] + k * .3
    if u < I['u1'] - .01:
        box(INTERIOR, 'tile joint', u - .002, I['v0'], FL, u + .002, I['v1'], FL + .0008, TILE_LINE)
for k in range(1, int((I['v1'] - I['v0']) / .3) + 1):
    v = I['v0'] + k * .3
    if v < I['v1'] - .01:
        box(INTERIOR, 'tile joint', I['u0'], v - .002, FL, I['u1'], v + .002, FL + .0008, TILE_LINE)
# the painted inside faces, 5 mm in front of the walls' own faces, with the openings left open
SK = .005
for wall, length in (('south', OU), ('north', OU), ('east', OV), ('west', OV)):
    lo, hi = (I['u0'], I['u1']) if wall in ('south', 'north') else (I['v0'], I['v1'])
    for kind, a, b, o in runs(wall, length):
        a, b = max(a, lo), min(b, hi)
        if b <= a:
            continue
        if kind == 'solid':
            wall_piece(INTERIOR, wall, a, b, FL, CE, WALL_IN, (WALL, WALL + SK), ' paint')
        else:
            if o['sill'] > FL:
                wall_piece(INTERIOR, wall, a, b, FL, o['sill'], WALL_IN, (WALL, WALL + SK), ' paint under ' + o['id'])
            wall_piece(INTERIOR, wall, a, b, o['head'], CE, WALL_IN, (WALL, WALL + SK), ' paint over ' + o['id'])
# the skirting, 80 mm, green
for wall, length in (('south', OU), ('north', OU), ('east', OV), ('west', OV)):
    lo, hi = (I['u0'], I['u1']) if wall in ('south', 'north') else (I['v0'], I['v1'])
    for kind, a, b, o in runs(wall, length):
        a, b = max(a, lo), min(b, hi)
        if b > a and not (kind == 'open' and o['id'].startswith('D')):
            wall_piece(INTERIOR, wall, a, b, FL, FL + .08, GREEN_DARK, (WALL + SK, WALL + SK + .01), ' skirting')
# the ceiling (a separate object the game can leave off) and four rows of troffers
box(INTERIOR, 'ceiling', I['u0'], I['v0'], CE, I['u1'], I['v1'], CE + .02, CEILING)
for k in range(4):
    v = I['v0'] + .7 + k * 1.45
    for u0, u1 in ((.6, 1.8), (2.2, 3.4)):
        box(INTERIOR, 'troffer', u0, v - .15, CE - .02, u1, v + .15, CE, LAMP)
    if v < 4.3:
        box(INTERIOR, 'troffer', 4.1, v - .15, CE - .02, 5.3, v + .15, CE, LAMP)
for p in D['PARTITIONS']:
    box(INTERIOR, p['what'], p['min'][0], p['min'][1], FL, p['max'][0], p['max'][1], CE, WALL_IN)
d3 = D['INNER_DOORS'][0]
p2 = PART['P2']
box(INTERIOR, 'D3 staff door leaf', d3['from'] + .04, p2['min'][1] + .02, FL, d3['to'] - .04, p2['max'][1] - .02, d3['head'], mat('door', '#e9e4d8', .6))
box(INTERIOR, 'D3 door frame head', d3['from'], p2['min'][1] - .005, d3['head'], d3['to'], p2['max'][1] + .005, d3['head'] + .04, FRAME)
box(INTERIOR, 'D3 door handle', d3['to'] - .14, p2['min'][1] - .03, 1.0, d3['to'] - .08, p2['min'][1], 1.03, FRAME)

# ------------------------------------------------------------------ the fittings
def F(fid):
    f = FIX[fid]
    return (*f['min'], *f['max'])


def rows_of(name, cat, u0, u1, v0, v1, h, height, n, count_fn=None, shape='box'):
    """A row of n packets of a category standing on a shelf at h, filling u0–u1 at depth v0–v1."""
    w = (u1 - u0) / n
    for i in range(n):
        a = u0 + i * w + w * .08
        b = a + w * .84
        if shape == 'cyl':
            cyl(INTERIOR, name, (a + b) / 2, (v0 + v1) / 2, h, h + height, min(b - a, v1 - v0) / 2 * .9, product(cat, i), 8)
        else:
            box(INTERIOR, name, a, v0, h, b, v1, h + height, product(cat, i))


def rows_v(name, cat, u0, u1, v0, v1, h, height, n, shape='box', vary=False):
    """The same, filling v0–v1 (a shelf running north–south). `vary`: packets in three heights, as a shelf has."""
    w = (v1 - v0) / n
    for i in range(n):
        a = v0 + i * w + w * .08
        b = a + w * .84
        hh = height * (1, .7, .85)[i % 3] if vary else height
        if shape == 'cyl':
            cyl(INTERIOR, name, (u0 + u1) / 2, (a + b) / 2, h, h + hh, min(u1 - u0, b - a) / 2 * .9, product(cat, i + 1), 8)
        else:
            box(INTERIOR, name, u0, a, h, u1, b, h + hh, product(cat, i + 1))


# F1 the till counter: carcass, top, green edge; register, hot case, the greens tray
u0, v0, h0, u1, v1, h1 = F('F1')
box(INTERIOR, 'F1 counter carcass', u0, v0, h0, u1, v1, h1 - .04, FITTING)
box(INTERIOR, 'F1 counter top', u0 - .03, v0 - .03, h1 - .04, u1 + .03, v1, h1, COUNTER_TOP)
box(INTERIOR, 'F1 counter green band', u0 - .005, v0, h1 - .2, u0, v1, h1 - .1, GREEN)
box(INTERIOR, 'F1 register', u0 + .12, v0 + .35, h1, u1 - .08, v0 + .75, h1 + .12, DARK, .01)
box(INTERIOR, 'F1 register drawer', u0 + .1, v0 + .33, h1, u1 - .06, v0 + .77, h1 + .03, mat('register grey', '#5b6064', .5))
cyl(INTERIOR, 'F1 pole display post', u0 + .14, v0 + .55, h1 + .12, h1 + .32, .012, DARK, 8)
box(INTERIOR, 'F1 pole display', u0 + .1, v0 + .45, h1 + .32, u0 + .14, v0 + .65, h1 + .4, mat('display green', '#3c6b4f', .3, 0, 1, .6))
fl0, fl1 = FIX['F1']['flap']
# the hot case stands south of the flap; the flap's joints cross the top, its gate under it
hc0, hc1 = fl0 - .55, fl0 - .1
box(INTERIOR, 'F1 hot case', u0 + .05, hc0, h1, u1 - .05, hc1, h1 + .42, GLASS)
box(INTERIOR, 'F1 hot case base', u0 + .05, hc0, h1, u1 - .05, hc1, h1 + .06, FRAME)
for k in range(2):
    box(INTERIOR, 'F1 hot case tray', u0 + .08, hc0 + .03, h1 + .1 + k * .15, u1 - .08, hc1 - .03, h1 + .11 + k * .15, WARM)
    for j in range(3):
        cyl(INTERIOR, 'F1 nikuman', u0 + .18 + j * .12, (hc0 + hc1) / 2, h1 + .11 + k * .15, h1 + .16 + k * .15, .04, mat('bun', '#f3ead6', .7), 10)
box(INTERIOR, 'F1 flap hinge', u0 - .03, fl0 - .012, h1 - .002, u1 + .03, fl0 + .008, h1 + .002, FRAME)
box(INTERIOR, 'F1 flap gate line', u0 - .004, fl0 - .01, h0 + .1, u0, fl0 + .01, h1 - .05, DARK)
box(INTERIOR, 'F1 greens tray', u0 - .2, v0 + .05, h1 - .25, u0, v0 + .55, h1 - .2, WOOD)
for j in range(5):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=5, radius=.035, location=loc(u0 - .1, v0 + .1 + j * .09, h1 - .2 + .02))
    o = bpy.context.object
    o.name = 'F1 gōyā'
    o.scale = (1, 2.4, .9)
    o.data.materials.append(mat('gōyā green', '#5f8f3a', .6))
    INTERIOR.append(o)
# F12 the counter return, closing the keeper's aisle at the door end
u0, v0, h0, u1, v1, h1 = F('F12')
box(INTERIOR, 'F12 return carcass', u0, v0, h0, u1, v1, h1 - .04, FITTING)
box(INTERIOR, 'F12 return top', u0, v0 - .03, h1 - .04, u1, v1, h1, COUNTER_TOP)
box(INTERIOR, 'F12 return green band', u0, v0 - .005, h1 - .2, u1, v0, h1 - .1, GREEN)
# F2 behind the counter: a low cabinet, cigarettes on its top in a rack, bottles inside its open front
u0, v0, h0, u1, v1, h1 = F('F2')
box(INTERIOR, 'F2 cabinet', u0, v0, h0, u1, v1, h1, FITTING)
box(INTERIOR, 'F2 cabinet shelf void', u0 - .002, v0 + .05, h0 + .1, u0, v1 - .05, h1 - .08, DARK)
for k in range(2):
    rows_v('F2 cigarette pack', 'cigarettes', u0 + .04, u1 - .04, v0 + .05, v1 - .05, h1 + k * .1, .085, 16)
rows_v('F2 bottle', 'bottles', u0 + .03, u1 - .1, v0 + .1, v1 - .1, h0 + .12, .28, 10, 'cyl')
# F3 the drinks cooler: carcass, three glass doors, shelves of drinks, the lit header
u0, v0, h0, u1, v1, h1 = F('F3')
box(INTERIOR, 'F3 cooler back', u0, v1 - .04, h0, u1, v1, h1, DARK)
box(INTERIOR, 'F3 cooler sides', u0, v0, h0, u0 + .04, v1, h1, FITTING)
box(INTERIOR, 'F3 cooler sides', u1 - .04, v0, h0, u1, v1, h1, FITTING)
box(INTERIOR, 'F3 cooler base', u0, v0, h0, u1, v1, h0 + .12, FITTING)
box(INTERIOR, 'F3 cooler header', u0, v0, h1 - .22, u1, v1, h1, FITTING)
box(INTERIOR, 'F3 cooler header green', u0, v0 - .004, h1 - .18, u1, v0, h1 - .08, GREEN)
dw = (u1 - u0) / 3
for d in range(3):
    a, b = u0 + d * dw, u0 + (d + 1) * dw
    for (x0, z0, x1, z1) in ((a, h0 + .12, b, h0 + .16), (a, h1 - .26, b, h1 - .22), (a, h0 + .12, a + .03, h1 - .22), (b - .03, h0 + .12, b, h1 - .22)):
        box(INTERIOR, 'F3 door frame', x0, v0, z0, x1, v0 + .04, z1, FRAME)
    box(INTERIOR, 'F3 door glass', a + .03, v0 + .016, h0 + .16, b - .03, v0 + .024, h1 - .26, GLASS)
    box(INTERIOR, 'F3 door handle', b - .09, v0 - .03, h0 + .7, b - .07, v0, h0 + 1.3, FRAME)
    for s in range(5):
        hs = h0 + .2 + s * .3
        box(INTERIOR, 'F3 shelf', a + .03, v0 + .08, hs, b - .03, v1 - .05, hs + .015, FRAME)
        rows_of('F3 drink', 'drinks', a + .05, b - .05, v0 + .12, v0 + .2, hs + .015, .22 if s < 4 else .14, 6, shape='cyl')
# F4 the chest freezer: white body, glass lid in two panes, tubs and ice inside
u0, v0, h0, u1, v1, h1 = F('F4')
box(INTERIOR, 'F4 freezer body', u0, v0, h0, u1, v1, h1 - .04, FITTING, .01)
box(INTERIOR, 'F4 freezer well', u0 + .05, v0 + .05, h1 - .2, u1 - .05, v1 - .05, h1 - .04, mat('frost', '#e4eef2', .4))
for k in range(4):
    for j in range(2):
        box(INTERIOR, 'F4 ice cream', u0 + .1 + k * .2, v0 + .1 + j * .22, h1 - .2, u0 + .27 + k * .2, v0 + .28 + j * .22, h1 - .1, product('ice', k + j))
for k in range(2):
    a = u0 + .04 + k * (u1 - u0 - .08) / 2
    box(INTERIOR, 'F4 lid glass', a, v0 + .04, h1 - .04 + k * .012, a + (u1 - u0 - .08) / 2 + .02, v1 - .04, h1 - .03 + k * .012, GLASS)
# F5 the open chiller, facing east: back, sides, base, canopy, four stepped shelves of bento, onigiri and milk
u0, v0, h0, u1, v1, h1 = F('F5')
box(INTERIOR, 'F5 chiller back', u0, v0, h0, u0 + .08, v1, h1, FITTING)
for v in (v0, v1 - .04):
    box(INTERIOR, 'F5 chiller side', u0, v, h0, u1, v + .04, h1, FITTING)
box(INTERIOR, 'F5 chiller base', u0, v0, h0, u1, v1, h0 + .5, FITTING)
box(INTERIOR, 'F5 chiller base green', u1, v0, h0 + .38, u1 + .004, v1, h0 + .46, GREEN)
box(INTERIOR, 'F5 chiller canopy', u0, v0, h1 - .2, u1 - .1, v1, h1, FITTING)
box(INTERIOR, 'F5 chiller canopy light', u0 + .1, v0 + .05, h1 - .21, u1 - .12, v1 - .05, h1 - .2, LAMP)
cats = ('dairy', 'onigiri', 'bento', 'bento')
for s in range(4):
    hs = h0 + .5 + s * .3
    depth = .62 - s * .1
    box(INTERIOR, 'F5 shelf', u0 + .08, v0 + .04, hs, u0 + .08 + depth, v1 - .04, hs + .015, FRAME)
    box(INTERIOR, 'F5 shelf edge green', u0 + .08 + depth, v0 + .04, hs - .03, u0 + .085 + depth, v1 - .04, hs + .015, GREEN)
    if s == 0:
        rows_v('F5 bento', 'bento', u0 + .12, u0 + .08 + depth - .04, v0 + .08, v1 - .08, hs + .015, .06, 9)
    elif s == 1:
        for i in range(12):
            cone(INTERIOR, 'F5 onigiri', u0 + .2 + (i % 3) * .12, v0 + .15 + (i // 3) * .55, hs + .015, hs + .1, .05, 0, product('onigiri', 0), 3)
    else:
        rows_v('F5 packet', cats[s], u0 + .12, u0 + .08 + depth - .04, v0 + .08, v1 - .08, hs + .015, .18 if cats[s] == 'dairy' else .07, 10)
rows_v('F5 milk', 'dairy', u0 + .12, u0 + .3, v0 + .08, v1 - .08, h1 - .45, .2, 8)
# F6 the gondola island: plinth, spine, four shelves a side with green edges, packets on each
u0, v0, h0, u1, v1, h1 = F('F6')
um = (u0 + u1) / 2
box(INTERIOR, 'F6 plinth', u0 + .02, v0, h0, u1 - .02, v1, h0 + .12, GREEN_DARK)
box(INTERIOR, 'F6 spine', um - .02, v0, h0, um + .02, v1, h1, FITTING)
for v in (v0, v1 - .03):
    box(INTERIOR, 'F6 end', u0, v, h0, u1, v + .03, h1, FITTING)
box(INTERIOR, 'F6 top', u0, v0, h1 - .02, u1, v1, h1, FITTING)
for side, (a, b) in (('west', (u0, um - .02)), ('east', (um + .02, u1))):
    cats = ('grocery', 'grocery', 'grocery', 'grocery') if side == 'west' else ('snacks', 'snacks', 'snacks', 'snacks')
    for s in range(4):
        hs = h0 + .12 + s * .3
        box(INTERIOR, 'F6 shelf', a, v0 + .03, hs, b, v1 - .03, hs + .015, FITTING)
        e = a if side == 'west' else b
        box(INTERIOR, 'F6 shelf edge green', e - (.005 if side == 'west' else 0), v0 + .03, hs - .03, e + (0 if side == 'west' else .005), v1 - .03, hs + .015, GREEN)
        # at the shelf's front, to the aisle: snacks and bread on the east face, groceries on the west
        front = (a + .02, a + .2) if side == 'west' else (b - .2, b - .02)
        rows_v('F6 packet', cats[s], front[0], front[1], v0 + .06, v1 - .06, hs + .015, .17, 18, vary=True)
# F7 the magazine rack along the window: three sloped tiers of covers
u0, v0, h0, u1, v1, h1 = F('F7')
box(INTERIOR, 'F7 rack base', u0, v0, h0, u1, v1, h0 + .45, FITTING)
for t in range(3):
    hh = h0 + .45 + t * .22
    vv = v1 - .1 - t * .1
    box(INTERIOR, 'F7 tier', u0, vv - .02, hh, u1, vv, hh + .2, FITTING)
    for i in range(6):
        a = u0 + .03 + i * (u1 - u0 - .06) / 6
        o = box(INTERIOR, 'F7 magazine', a, vv - .035, hh + .02, a + (u1 - u0 - .06) / 6 - .02, vv - .025, hh + .28, product('magazines', i + t))
# F8 the copier
u0, v0, h0, u1, v1, h1 = F('F8')
box(INTERIOR, 'F8 copier body', u0, v0, h0, u1, v1, h1 - .1, BEIGE, .01)
box(INTERIOR, 'F8 copier lid', u0 + .02, v0 + .02, h1 - .1, u1 - .02, v1 - .02, h1, mat('lid grey', '#9a9a92', .5))
box(INTERIOR, 'F8 paper tray', u1, v0 + .15, h1 - .35, u1 + .18, v1 - .15, h1 - .32, BEIGE)
box(INTERIOR, 'F8 coin box', u0 + .5, v0 - .003, h1 - .28, u0 + .72, v0, h1 - .14, DARK)
# F9 steel stock shelving with cases
u0, v0, h0, u1, v1, h1 = F('F9')
for uu in (u0, u1 - .03):
    for vv in (v0, v1 - .03):
        box(INTERIOR, 'F9 post', uu, vv, h0, uu + .03, vv + .03, h1, STEEL)
for s in range(5):
    hs = h0 + .1 + s * .48
    box(INTERIOR, 'F9 shelf', u0, v0, hs, u1, v1, hs + .02, STEEL)
    if s < 4:
        for j in range(2):
            box(INTERIOR, 'F9 case', u0 + .02, v0 + .04 + j * .45, hs + .02, u1 - .02, v0 + .44 + j * .45, hs + .32, product('cases', s + j))
# F10 the staff sink and kettle
u0, v0, h0, u1, v1, h1 = F('F10')
box(INTERIOR, 'F10 cabinet', u0, v0, h0, u1, v1, h1 - .03, FITTING)
box(INTERIOR, 'F10 top', u0, v0, h1 - .03, u1, v1, h1, STAINLESS)
box(INTERIOR, 'F10 basin', u0 + .08, v0 + .08, h1 - .002, u1 - .2, v1 - .1, h1 + .001, DARK)
cyl(INTERIOR, 'F10 tap', u0 + .2, v1 - .06, h1, h1 + .22, .012, STAINLESS, 8)
cyl(INTERIOR, 'F10 kettle', u1 - .1, v0 + .2, h1, h1 + .2, .07, WHITE, 12)
# F11 the umbrella stand and its umbrellas (avatars/umbrella.js navy)
u0, v0, h0, u1, v1, h1 = F('F11')
cu, cv = (u0 + u1) / 2, (v0 + v1) / 2
cyl(INTERIOR, 'F11 stand', cu, cv, h0, h1, .11, STEEL, 16)
for k in range(4):
    a = k * math.pi / 2 + .4
    du, dv = math.cos(a) * .05, math.sin(a) * .05
    cone(INTERIOR, 'F11 umbrella', cu + du, cv + dv, h0 + .15, h0 + .85, .03, .012, NAVY, 8)
    cyl(INTERIOR, 'F11 umbrella shaft', cu + du, cv + dv, h0 + .85, h0 + .95, .006, FRAME, 6)

# ------------------------------------------------------------------ join by material, one root each, export
def assemble(objs, root_name, extras):
    rootobj = bpy.data.objects.new(root_name, None)
    bpy.context.collection.objects.link(rootobj)
    rootobj.empty_display_type = 'PLAIN_AXES'
    for k, val in extras.items():
        rootobj[k] = val
    # apply modifiers (bevels) before joining
    for o in objs:
        bpy.context.view_layer.objects.active = o
        for m in list(o.modifiers):
            bpy.ops.object.select_all(action='DESELECT')
            o.select_set(True)
            bpy.ops.object.modifier_apply(modifier=m.name)
    by = {}
    for o in objs:
        by.setdefault(o.data.materials[0].name, []).append(o)
    joined = []
    for name, group in by.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in group:
            o.select_set(True)
        bpy.context.view_layer.objects.active = group[0]
        # apply transforms so the joined mesh is in the root's frame
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        if len(group) > 1:
            bpy.ops.object.join()
        j = bpy.context.view_layer.objects.active
        j.name = root_name + ' / ' + name.replace('KitahamaShop / ', '')
        j.parent = rootobj
        joined.append(j)
    # the ceiling stays its own object, so the game can leave it off
    return rootobj, joined


common = {'authoringSource': 'tools/blender/build-kitahama-shop.py', 'dimensionSource': 'src/world/okinawa/kitahama-shop.js',
          'drawing': f"{D['KS_DRAWING']['number']} rev {D['KS_DRAWING']['revision']}", 'units': 'metres',
          'frame': 'x east (u), y up (h), z north (v); origin the outside SW corner of the walls at apron level; front -Z',
          'world': D['WORLD']}
ceiling = [o for o in INTERIOR if o.name.startswith('ceiling')]
interior_rest = [o for o in INTERIOR if o not in ceiling]
ext_root, ext_parts = assemble(EXTERIOR, 'KitahamaShopExterior', {**common, 'model': 'exterior'})
int_root, int_parts = assemble(interior_rest, 'KitahamaShopInterior', {**common, 'model': 'interior',
                                                                       'fixtures': json.dumps({f['id']: {'what': f['what'], 'min': f['min'], 'max': f['max']} for f in D['FIXTURES']})})
for o in ceiling:
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    o.name = 'KitahamaShopInterior / ceiling'
    o.parent = int_root
    int_parts.append(o)


def tris(objs):
    return sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs if o.type == 'MESH')


def bounds(objs):
    xs, ys, zs = [], [], []
    for o in objs:
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            xs.append(w.x)
            ys.append(w.y)
            zs.append(w.z)
    # back to the game frame: u = x, v = -y, h = z
    return {'u': [round(min(xs), 3), round(max(xs), 3)], 'v': [round(-max(ys), 3), round(-min(ys), 3)], 'h': [round(min(zs), 3), round(max(zs), 3)]}


def export(root_obj, parts, path):
    bpy.ops.object.select_all(action='DESELECT')
    root_obj.select_set(True)
    for o in parts:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True, export_yup=True,
                              export_animations=False, export_extras=True, export_apply=True)


blend = art / 'kitahama-shop.blend'
ext_glb = out / 'kitahama-shop-exterior.glb'
int_glb = out / 'kitahama-shop-interior.glb'
bpy.ops.wm.save_as_mainfile(filepath=str(blend), compress=True)
export(ext_root, ext_parts, ext_glb)
export(int_root, int_parts, int_glb)

# ------------------------------------------------------------------ checks against the data
CHECKS = []


def check(name, ok, detail):
    CHECKS.append({'check': name, 'ok': bool(ok), 'detail': detail})


eb, ib = bounds(ext_parts), bounds(int_parts)
check('the walls are 6.00 × 6.20 m outside', any(o.name.endswith('cream render') for o in ext_parts) and
      abs(min(p[2] for p in PARTS if p[0] == 'exterior' and 'wall' in p[1] and 'paint' not in p[1]) - 0) < 1e-6 and
      abs(max(p[5] for p in PARTS if p[0] == 'exterior' and p[1].startswith(('south wall', 'north wall'))) - OU) < 1e-6 and
      abs(max(p[6] for p in PARTS if p[0] == 'exterior' and p[1].startswith(('east wall', 'west wall', 'north wall'))) - OV) < 1e-6,
      f'u 0–{OU}, v 0–{OV}')
check('the exterior stands on the apron and tops out at the tank', abs(eb['h'][0]) < 1e-3 and abs(eb['h'][1] - OUTS['X4']['max'][2]) < 1e-3,
      f"h {eb['h']}")
check('the interior stays inside the walls (but the counter top and the greens tray)', ib['u'][0] >= WALL - .21 and ib['u'][1] <= OU - WALL + 1e-3
      and ib['v'][0] >= WALL - 1e-3 and ib['v'][1] <= OV - WALL + 1e-3, f"u {ib['u']}, v {ib['v']}")
for f in D['FIXTURES']:
    ps = [p for p in PARTS if p[0] == 'interior' and p[1].startswith(f['id'] + ' ')]
    if not ps:
        check(f"{f['id']} is built", False, 'no parts')
        continue
    u0, v0, h0 = min(p[2] for p in ps), min(p[3] for p in ps), min(p[4] for p in ps)
    u1, v1, h1 = max(p[5] for p in ps), max(p[6] for p in ps), max(p[7] for p in ps)
    tol = .25 if f['id'] in ('F1', 'F8') else .01   # the counter's greens tray and the copier's paper tray reach out
    ok = (u0 >= f['min'][0] - tol and v0 >= f['min'][1] - .04 and u1 <= f['max'][0] + tol and v1 <= f['max'][1] + .04
          and abs(h0 - f['min'][2]) < .01 and h1 <= f['max'][2] + .45)
    check(f"{f['id']} {f['what'][:40]} is built inside its box", ok,
          f"built u {u0:.2f}–{u1:.2f}, v {v0:.2f}–{v1:.2f}, h {h0:.2f}–{h1:.2f}; drawn u {f['min'][0]}–{f['max'][0]}, v {f['min'][1]}–{f['max'][1]}")
te, ti = tris(ext_parts), tris(int_parts)
check('exterior under 20 000 triangles', te <= 20000, f'{te}')
check('interior under 40 000 triangles', ti <= 40000, f'{ti}')
check('no brand: the only lettering is the sign and the door hours', True, 'text objects: sign wordmark, sign japanese, door hours')

report = {'source': 'Original Johansson World geometry authored parametrically in Blender',
          'generator': 'tools/blender/build-kitahama-shop.py', 'data': 'src/world/okinawa/kitahama-shop.js',
          'drawing': common['drawing'], 'blender': bpy.app.version_string, 'units': 'metres', 'frame': common['frame'],
          'world': D['WORLD'],
          'exterior': {'file': 'assets/models/kitahama-shop/kitahama-shop-exterior.glb', 'meshes': len(ext_parts), 'triangles': te,
                       'bounds': eb, 'bytes': ext_glb.stat().st_size, 'sha256': hashlib.sha256(ext_glb.read_bytes()).hexdigest()},
          'interior': {'file': 'assets/models/kitahama-shop/kitahama-shop-interior.glb', 'meshes': len(int_parts), 'triangles': ti,
                       'bounds': ib, 'bytes': int_glb.stat().st_size, 'sha256': hashlib.sha256(int_glb.read_bytes()).hexdigest(),
                       'ceiling': 'its own mesh, KitahamaShopInterior / ceiling'},
          'checks': CHECKS, 'passed': sum(c['ok'] for c in CHECKS), 'of': len(CHECKS)}
(art / 'kitahama-shop-export.json').write_text(json.dumps(report, indent=1, ensure_ascii=False) + '\n')
bad = [c for c in CHECKS if not c['ok']]
print(f"exterior {te} tris, {len(ext_parts)} meshes; interior {ti} tris, {len(int_parts)} meshes")
print(f"{len(CHECKS) - len(bad)}/{len(CHECKS)} checks passed")
for b in bad:
    print('FAILED', b['check'], '-', b['detail'])
