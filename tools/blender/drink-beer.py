"""Anyone drinking beer from a glass at Minato's counter, animated in Blender and played in the game.

  python tools/blender/drink-beer.py --root . --vessel mug|pint|glass [--name Johansson] [--out output/drink-beer] [--sheet]

The owner, 27 November 2026: "How about a pint glass at the izikaya does it work?", then "Remake it follow Disney principles
how should it look when anyone drinks beer". The draught mug (大ジョッキ) stays Minato's standard; the pint is the extra
(izakaya-beer.js BEER_SERVES says who orders it and why); the small glass is what the big bottle is poured into.

The RIG is tools/blender/drink-can.py's (the game's 28 bones from tools/export-avatar-glb.mjs, arm IK with measured poles,
the wrist limits, a `look` target, the hands' shapes as shape keys driven by the closure), seated on the counter stool as the
game seats a body (tools/drink-beer-kit.mjs: the stool, the counter and the place Thao sets the glass down, each glass as drawn
and how the hand holds it: src/avatars/beer-hold.js). The glass is two objects, one shown at a time: standing on the counter,
and in the right hand's socket from the moment the fingers close on it until they open.

The PERFORMANCE (tools/blender/drink-beer-keys.py, which has the brief) is keyed pose to pose at 30 frames a second in four
parts that start and end on the same pose, so the game plays them in any order it needs: TAKE (the glass picked up off the
counter), FIRST (the first long draught, the "kaa!", the foam wiped off, set down with a tap), SIP (a later, smaller one) and
LET (the hand off the glass, the body back). Baked as drink-can.py bakes (the forearm's twist, the upper arm's roll, the wrist
limits, the forearm and hand three frames behind the upper arm off contacts, every curve evened).

Writes src/avatars/motions/drink-beer-<vessel>.js (johansson-motion v2), tests/drink-beer-<vessel>.verify.json, the .blend, and
with --sheet art/characters/body-kit/review/drink-beer-<vessel>-{front,three-quarter,side}.jpg (the last rows the story poses
as black silhouettes).
"""
import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument('--root', default='.')
ap.add_argument('--name', default='Johansson')
ap.add_argument('--out', default='output/drink-beer')
ap.add_argument('--vessel', default='pint', choices=('mug', 'pint', 'glass'))
ap.add_argument('--sheet', action='store_true')
ap.add_argument('--frames', default='')
args, _ = ap.parse_known_args(argv)
import bpy                                                                  # noqa: E402
from mathutils import Vector, Quaternion, Matrix, Euler                     # noqa: E402

ROOT = Path(args.root).resolve()
OUT = (ROOT / args.out).resolve()
OUT.mkdir(parents=True, exist_ok=True)
FPS = 30

# ------------------------------------------------------------------ the body, as the game builds it
glb, kitfile = OUT / 'body.glb', OUT / 'kit.json'
subprocess.run(['node', 'tools/export-avatar-glb.mjs', '--name', args.name, str(glb)], cwd=ROOT, check=True, capture_output=True)
subprocess.run(['node', 'tools/drink-beer-kit.mjs', '--name', args.name, str(kitfile)], cwd=ROOT, check=True, capture_output=True)
K = json.loads(kitfile.read_text())
M = K['measure']
VESSEL = args.vessel
V = K['vessels'][VESSEL]
OUT = OUT / VESSEL
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(glb))
sys.path.insert(0, str(Path(__file__).resolve().parent))
_argv, sys.argv = sys.argv, [sys.argv[0], '--', '--root', str(ROOT)]       # (head_sculpt reads --root itself)
import head_sculpt as H                                                     # noqa: E402
sys.argv = _argv
for mat in bpy.data.materials:
    if mat.use_nodes:
        H.toon(mat)
scene = bpy.context.scene
scene.render.fps = FPS
rig = next(o for o in scene.objects if o.type == 'ARMATURE')
body = next(o for o in scene.objects if o.type == 'MESH' and 'body' in o.name.lower())
for o in [o for o in scene.objects if o.type == 'MESH' and o.name.startswith('Icosphere')]:
    bpy.data.objects.remove(o)

# The game's frame (y up, the body facing +z, its left +x) and Blender's (z up, the body facing -y).
G2B = lambda v: Vector((v[0], -v[2], v[1]))
B2G = lambda v: [v[0], v[2], -v[1]]
A = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))                               # game axes into Blender's
qG2B = lambda q: (A @ q.to_matrix() @ A.transposed()).to_quaternion()       # a turn in the game's frame, in Blender's
qB2G = lambda q: (A.transposed() @ q.to_matrix() @ A).to_quaternion()
gameQ = lambda xyzw: Quaternion((xyzw[3], xyzw[0], xyzw[1], xyzw[2]))
gameE = lambda x, y, z: Euler((x, y, z), 'XYZ').to_quaternion()            # a game bone's Euler turn, as its pose here

# Blender's rest pose is the game's (every bone unturned, its axes the game's): the import's T-pose put back.
for pb in rig.pose.bones:
    pb.rotation_mode = 'QUATERNION'
    pb.rotation_quaternion = (1, 0, 0, 0)
    pb.location = (0, 0, 0)

# ------------------------------------------------------------------ the hands' shapes, driven
SHAPES = tuple(next(iter(K['hand']['points'].values())).keys())          # wrap, fist (and the handle, where the kit has it)
mesh = body.data
body.shape_key_add(name='Basis', from_mix=False)
keys = {(s, side): body.shape_key_add(name=f'{s}.{side}', from_mix=False) for s in SHAPES for side in 'RL'}
from mathutils.kdtree import KDTree                                          # noqa: E402
points = list(K['hand']['points'].items())
tree = KDTree(len(points))
for i, (key, _) in enumerate(points):
    tree.insert(Vector([float(c) for c in key.split(',')]), i)
tree.balance()
found = 0
for v in mesh.vertices:
    g = B2G(v.co)
    co, i, dist = tree.find(Vector(g))
    if dist is None or dist > 2e-5:
        continue
    hit = points[i][1]
    found += 1
    side = 'R' if g[0] < 0 else 'L'
    for s in SHAPES:
        keys[(s, side)].data[v.index].co = G2B(hit[s])
assert found > 1000, f'the hands\' points not found on the body ({found})'
CW = K['hand']['wrapAt']
for side in 'RL':
    rig[f'close{side}'] = 0.0
    rig[f'hook{side}'] = 0.0
    # (the right hand round the mug's handle closes from rest into the handle shape; every other closure goes round the wrap to the fist)
    handle = side == 'R' and V['hold']['shape'] == 'handle' and 'handle' in SHAPES
    for s, expr in ((('handle', 'c'), ('wrap', '0'), ('fist', '0')) if handle else (('wrap', f'min(c/{CW:.4f},(1-c)/(1-{CW:.4f}))'), ('fist', f'max(0,(c-{CW:.4f})/(1-{CW:.4f}))'), *((('handle', '0'),) if 'handle' in SHAPES else ()))):
        d = keys[(s, side)].driver_add('value').driver
        d.type = 'SCRIPTED'
        d.expression = expr
        for name, prop in (('c', f'close{side}'), ('h', f'hook{side}')):
            var = d.variables.new()
            var.name = name
            var.targets[0].id_type = 'OBJECT'
            var.targets[0].id = rig
            var.targets[0].data_path = f'["{prop}"]'
# face cues the game paints (face.js): the eyes closed, a breath out (the mouth a little open), a content smile
for cue in ('blink', 'breath', 'smile', 'look', 'kaa', 'foam', 'swallow', 'shrug', 'lip', 'mouth', 'counter', 'hold', 'wipe', 'lean', 'fill', 'headLook'):
    rig[cue] = 0.0
rig['fill'] = 1.0

# ------------------------------------------------------------------ sockets and controls
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
eb = rig.data.edit_bones
rest = {n: G2B(p) for n, p in K['bones'].items()}


def bone(name, head, tail, parent=None, roll_to=None, deform=False):
    b = eb.new(name)
    b.head, b.tail = head, tail
    if roll_to is not None:
        b.align_roll(roll_to)
    if parent:
        b.parent = eb[parent]
    b.use_deform = deform
    return b


# (the arms' bones pointed down the arm, the importer having stood every bone on end: shoulder to elbow, elbow to wrist,
# the hand down its fingers; the deform is the same, and the export reads each bone's rest as it is)
for side in 'RL':
    eb['shoulder' + side].tail = eb['elbow' + side].head
    eb['elbow' + side].tail = eb['hand' + side].head
    eb['hand' + side].tail = eb['hand' + side].head + Vector((0, 0, -.1))
    for n in ('shoulder', 'elbow', 'hand'):
        eb[n + side].align_roll(Vector((0, -1, 0)))
sock = V['socket']
sq = gameQ(sock['quaternion'])                                             # the can in the hand's frame (game)
can_up, can_z = sq @ Vector((0, 1, 0)), sq @ Vector((0, 0, 1))
s_head = rest['handR'] + G2B(sock['position'])
bone('socket.R', s_head, s_head + G2B(can_up) * .06, 'handR', G2B(can_z))
for side in 'RL':
    hand = rest['hand' + side]
    bone('ik.' + side, hand, hand + Vector((0, 0, .06)))
    s = -1 if side == 'R' else 1
    bone('pole.' + side, rest['elbow' + side] + Vector((s * .25, .3, 0)), rest['elbow' + side] + Vector((s * .25, .3, .04)))
head_c = rest['head'] + Vector((0, 0, M['headCentre'] - M['headY']))
bone('look', head_c + Vector((0, -.6, 0)), head_c + Vector((0, -.6, .04)))
bpy.ops.object.mode_set(mode='POSE')
P = rig.pose.bones
for pb in P:
    pb.rotation_mode = 'QUATERNION'

# The arms: a two-bone IK from the shoulder to the wrist, the elbow toward its pole; the hand turned as its control is (the
# bake below moves the forearm's share of the turn into the forearm, and holds the wrist to what a wrist does).
WRIST = ((-.35, .5), (-.45, .45), (-1.1, 1.25))                              # animate.js PALM.wrist (the right hand's terms)
for side in 'RL':
    c = P['elbow' + side].constraints.new('IK')
    c.target, c.subtarget = rig, 'ik.' + side
    c.pole_target, c.pole_subtarget = rig, 'pole.' + side
    c.chain_count, c.use_tail, c.iterations = 2, True, 2000
    c = P['hand' + side].constraints.new('COPY_ROTATION')
    c.target, c.subtarget = rig, 'ik.' + side


def pole_off(side):
    """How far round the line from the shoulder to the wrist the elbow is from its pole (radians, signed): the IK's elbow
    goes toward its pole only with the pole's angle set for the way these bones are rolled."""
    bpy.context.view_layer.update()
    S, E = (rig.matrix_world @ P['shoulder' + side].matrix).to_translation(), (rig.matrix_world @ P['elbow' + side].matrix).to_translation()
    W, Q = (rig.matrix_world @ P['ik.' + side].matrix).to_translation(), (rig.matrix_world @ P['pole.' + side].matrix).to_translation()
    a = (W - S).normalized()
    e, q = (E - S) - a * (E - S).dot(a), (Q - S) - a * (Q - S).dot(a)
    return math.atan2(a.dot(q.cross(e)), q.dot(e))


# (the poles' angles found, not guessed: each arm reaching forward and down with its pole out at its side and back, the
# angle turned until the elbow is the pole's way; the animator's poles then mean what they say)
for side in 'RL':
    sg = -1 if side == 'R' else 1
    ik, pole = P['ik.' + side], P['pole.' + side]
    c = P['elbow' + side].constraints['IK']
    for _ in range(3):
        offs = []
        for target, at in (((0, -.2, -.2), (sg * .5, .2, -.1)), ((-sg * .1, -.22, -.05), (sg * .5, .3, -.2)), ((0, -.1, -.3), (sg * .4, -.2, -.2))):
            ik.matrix = Matrix.Translation(rest['shoulder' + side] + Vector(target))
            pole.matrix = Matrix.Translation(rest['shoulder' + side] + Vector(at))
            offs.append(pole_off(side))
        c.pole_angle = math.remainder(c.pole_angle - sum(offs) / len(offs), math.tau)
    print(f'pole angle {side}: {math.degrees(c.pole_angle):.1f} deg, the elbow then {max(abs(math.degrees(o)) for o in offs):.1f} deg off its pole')
    ik.matrix_basis = Matrix()
    pole.matrix_basis = Matrix()
c = P['head'].constraints.new('DAMPED_TRACK')
c.target, c.subtarget, c.track_axis = rig, 'look', 'TRACK_Z'
c.influence = 0
drv = c.driver_add('influence').driver
drv.type = 'SCRIPTED'
drv.expression = 'l'
var = drv.variables.new()
var.name = 'l'
var.targets[0].id_type, var.targets[0].id, var.targets[0].data_path = 'OBJECT', rig, '["headLook"]'   # (the head's turn to it: the eyes' `look`, later)
bpy.ops.object.mode_set(mode='OBJECT')

JOINTS = ('hips', 'spine', 'chest', 'neck', 'head', 'shoulderL', 'elbowL', 'handL', 'shoulderR', 'elbowR', 'handR', 'thighL', 'kneeL', 'footL', 'thighR', 'kneeR', 'footR')   # motion.js MOTION_JOINTS
PARENTS = {b.name: b.parent.name if b.parent else None for b in rig.data.bones}
Aq = A.to_quaternion()


def game_world(name):
    """A bone's turn in the game's frame (its own axes the game's at rest): Blender's, less its rest, in the game's axes."""
    pb = P[name]
    return Aq.inverted() @ pb.matrix.to_quaternion() @ rig.data.bones[name].matrix_local.to_quaternion().inverted() @ Aq


def game_local(name):
    q = game_world(name)
    parent = PARENTS[name]
    return (game_world(parent).inverted() @ q) if parent else q



# ------------------------------------------------------------------ seated on the stool, as the game seats a body
def pose_game(name, xyzw):
    """Pose a bone by its turn in the game's terms (x, y, z, w; its parent's frame, the game's axes)."""
    R = rig.data.bones[name].matrix_local.to_quaternion()
    P[name].rotation_quaternion = R.inverted() @ Aq @ gameQ(xyzw) @ Aq.inverted() @ R


SEATED_POSE = K['seated']['pose']
LEGS = ('hips', 'thighL', 'kneeL', 'footL', 'thighR', 'kneeR', 'footR')
for n in LEGS:
    pose_game(n, SEATED_POSE[n])
# (each hand where the game's seated arm has it, on his thigh: the IK's controls start there, so the motion blends in from it)
for pb in P:
    for c in pb.constraints:
        c.mute = True
for n in ('shoulderL', 'elbowL', 'handL', 'shoulderR', 'elbowR', 'handR'):
    pose_game(n, SEATED_POSE[n])
bpy.context.view_layer.update()
SEATED = {}
for side in 'RL':
    mw = rig.matrix_world @ P['hand' + side].matrix
    q = qB2G(mw.to_quaternion() @ rig.data.bones['hand' + side].matrix_local.to_quaternion().inverted())
    SEATED['hand' + side] = Matrix.Translation(Vector(B2G(mw.to_translation()))) @ q.to_matrix().to_4x4()
for n in ('shoulderL', 'elbowL', 'handL', 'shoulderR', 'elbowR', 'handR'):
    P[n].rotation_quaternion = (1, 0, 0, 0)
for pb in P:
    for c in pb.constraints:
        c.mute = False
bpy.context.view_layer.update()

# ------------------------------------------------------------------ the glass, the beer in it, the counter and the stool
import bmesh                                                                # noqa: E402


def material(name, rgb, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = .4
    H.toon(m)
    if alpha < 1:
        # (the glass see-through, so the beer and its level read: the toon colour mixed with transparency)
        nt = m.node_tree
        out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
        surf = out.inputs['Surface'].links[0].from_socket
        mix, clear = nt.nodes.new('ShaderNodeMixShader'), nt.nodes.new('ShaderNodeBsdfTransparent')
        mix.inputs['Fac'].default_value = alpha
        nt.links.new(clear.outputs[0], mix.inputs[1])
        nt.links.new(surf, mix.inputs[2])
        nt.links.new(mix.outputs[0], out.inputs['Surface'])
        m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else None
    return m


def lathe_mesh(name, profile, mat, segs=40):
    bm = bmesh.new()
    rings = []
    for r, y in profile:
        rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / segs), y, r * math.sin(2 * math.pi * i / segs))) for i in range(segs)])
    for a, b in zip(rings, rings[1:]):
        for i in range(segs):
            f = (a[i], a[(i + 1) % segs], b[(i + 1) % segs], b[i])
            if len({v.co.to_tuple(6) for v in f}) >= 3:
                bm.faces.new(f)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    me.materials.append(mat)
    return ob


# (the vessel's own frame: y up its axis, +z the side of the rim that goes to the lip, +x the mug's handle; as the game draws it)
glass_m = material('Glass', (.78, .86, .88), .1)
beer_m = material('Beer', tuple(((V['beer']['colour'] >> s) & 255) / 255 for s in (16, 8, 0)))
foam_m = material('Foam', (.95, .92, .84))
B = V['beer']


def vessel(name):
    """The glass (its wall, the mug's handle), the beer in it and the head on the beer: each a part of `name`, the beer the
    glass's inside cut at its level by a box kept level in the world (set_level), the head a slab of it."""
    g = lathe_mesh(name, [tuple(p) for p in V['outline']], glass_m)
    if V['handle']:
        hd = V['handle']
        cu = bpy.data.curves.new(name + ' handle', 'CURVE')
        cu.dimensions, cu.bevel_depth, cu.bevel_resolution = '3D', hd['bar'], 3
        sp = cu.splines.new('POLY')
        o0, o1, r, bx = hd['opening'][0], hd['opening'][1], hd['r'], hd['barX']
        D = [(r - .012, o0 - .004), (r + .014, o0 - .006), (bx - .004, o0 + .004), (bx, o0 + .02), (bx, o1 - .02), (bx - .004, o1 - .004), (r + .014, o1 + .006), (r - .012, o1 + .004)]
        sp.points.add(len(D) - 1)
        for p, (x, y) in zip(sp.points, D):
            p.co = (x, y, 0, 1)
        h = bpy.data.objects.new(name + ' handle', cu)
        scene.collection.objects.link(h)
        cu.materials.append(glass_m)
        h.parent = g
    return g


# the beer and its head: the glass's inside, in the world, cut level at the height that holds what is left (bisected on the
# cut's volume), the head a slab on it; drawn for the glass that is shown, at the frames rendered
INSIDE = [(0, B['bottom'] + .0005), (B['rb'] - .0005, B['bottom'] + .0005), (B['rt'] - .0005, B['top'] - .0005), (0, B['top'] - .0005)]
inside = lathe_mesh('Inside', INSIDE, beer_m, 32)
inside.hide_render = True
beer_ob = bpy.data.objects.new('Beer', bpy.data.meshes.new('Beer'))
head_ob = bpy.data.objects.new('Head', bpy.data.meshes.new('Head'))
for ob, mat in ((beer_ob, beer_m), (head_ob, foam_m)):
    scene.collection.objects.link(ob)
    ob.data.materials.append(mat)


def cut(W, top, bottom=None):
    bm = bmesh.new()
    bm.from_mesh(inside.data)
    bm.transform(W)
    for co, no in (((0, 0, top), (0, 0, 1)),) + ((((0, 0, bottom), (0, 0, -1)),) if bottom is not None else ()):
        res = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=co, plane_no=no, clear_outer=True)
        cut_edges = [e for e in res['geom_cut'] if isinstance(e, bmesh.types.BMEdge)]
        if cut_edges:
            bmesh.ops.holes_fill(bm, edges=cut_edges, sides=0)
    return bm


def set_level(g, fill, foam=.012):
    """The beer in glass `g` cut level in the world to hold `fill` of what it was served with, the head `foam` thick on it."""
    W = Matrix(g.matrix_world)
    want = fill * B['ml'] / 1e6
    lo, hi = -.5, 3.0
    for _ in range(28):
        mid = (lo + hi) / 2
        bm = cut(W, mid)
        vol = abs(bm.calc_volume())
        bm.free()
        lo, hi = (mid, hi) if vol < want else (lo, mid)
    top = (lo + hi) / 2
    for ob, bm in ((beer_ob, cut(W, top - (foam if fill > .02 else 0))), (head_ob, cut(W, top, top - foam) if fill > .02 else bmesh.new())):
        bm.to_mesh(ob.data)
        bm.free()
        for p in ob.data.polygons:
            p.use_smooth = False
    print('level', round(top, 4), 'beer faces', len(beer_ob.data.polygons), 'head faces', len(head_ob.data.polygons), 'fill', round(fill, 3), flush=True)
    return top


in_hand = vessel('Glass in hand')
in_hand.parent, in_hand.parent_type, in_hand.parent_bone = rig, 'BONE', 'socket.R'
bpy.context.view_layer.update()
in_hand.matrix_world = rig.matrix_world @ P['socket.R'].matrix
on_counter = vessel('Glass on counter')
wood, dark = material('Counter', (.55, .38, .22)), material('Stool', (.2, .16, .12))
TOP_B = K['counter']['top'] - K['seated']['root'][1]
edge = K['counter']['edge'] - K['seated']['root'][2]
counter = bpy.data.objects.new('Counter', bpy.data.meshes.new('Counter'))
bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1.0)
bm.to_mesh(counter.data)
bm.free()
scene.collection.objects.link(counter)
counter.data.materials.append(wood)
counter.scale = (2.4, K['counter']['depth'], .06)
counter.location = G2B((0, TOP_B - .03, edge + K['counter']['depth'] / 2))
stool = bpy.data.objects.new('Stool', bpy.data.meshes.new('Stool'))
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=.17, radius2=.17, depth=.04)
bm.to_mesh(stool.data)
bm.free()
scene.collection.objects.link(stool)
stool.data.materials.append(dark)
stool.location = G2B((0, K['counter']['seatHeight'] - K['seated']['root'][1] - .02, -K['seated']['root'][2]))

# ------------------------------------------------------------------ keying
F = lambda t: int(round(t * FPS)) + 1


def key_fk(name, t, e):
    pb = P[name]
    pb.rotation_quaternion = gameE(*e)
    pb.keyframe_insert('rotation_quaternion', frame=F(t))


def key_prop(name, t, value, ob=None):
    ob = ob or rig
    ob[name] = float(value)                                                 # (an int would make the property an integer)
    ob.keyframe_insert(f'["{name}"]', frame=F(t))


def key_pose(name, t, world, like=None):
    """A control bone's pose, from where the bone it stands for (`like`) is to be in the game's frame (a 4x4 Matrix: turn and
    place): turned as that bone would be (its rest is its own), so a Copy Rotation from it turns that bone so."""
    pb = P[name]
    restq = rig.data.bones[like].matrix_local.to_quaternion() if like else A.to_quaternion()
    m = Matrix.Translation(G2B(world.to_translation())) @ (qG2B(world.to_quaternion()) @ restq).to_matrix().to_4x4()
    scene.frame_set(F(t))
    was = pb.rotation_quaternion.copy()
    pb.matrix = rig.matrix_world.inverted() @ m
    # (on the same side as the turn the keys round it have there: Blender eases a turn's four numbers each on its own, and
    # between a turn and its opposite sign the hand would go over the long way, in a frame)
    if pb.rotation_quaternion.dot(was) < 0:
        pb.rotation_quaternion = -pb.rotation_quaternion
    pb.keyframe_insert('location', frame=F(t))
    pb.keyframe_insert('rotation_quaternion', frame=F(t))


def key_at(name, t, game_point):
    pb = P[name]
    pb.matrix = Matrix.Translation(G2B(game_point))
    pb.keyframe_insert('location', frame=F(t))


def world_of(bone_name, t):
    """A bone's place and turn in the game's frame at time t, as the keys so far have it."""
    scene.frame_set(F(t))
    m = rig.matrix_world @ P[bone_name].matrix
    q = qB2G((m.to_quaternion() @ rig.data.bones[bone_name].matrix_local.to_quaternion().inverted()))
    return Matrix.Translation(Vector(B2G(m.to_translation()))) @ q.to_matrix().to_4x4()


SOCKET = Matrix.Translation(Vector(sock['position'])) @ sq.to_matrix().to_4x4()      # the glass in the hand (game)
UPRIGHT = Quaternion((0, 1, 0), math.pi)                                    # the can upright, its opening toward him


def can_turn(tilt, yaw=0.0, roll=0.0):
    """The can's turn in the body's frame: upright, its opening toward him, tipped `tilt` toward his face (its top toward
    him, its bottom up and away), turned `yaw` about the vertical and leant `roll` sideways."""
    return Quaternion((0, 1, 0), yaw) @ Quaternion((0, 0, 1), roll) @ Quaternion((1, 0, 0), -tilt) @ UPRIGHT


def hand_for(can_world):
    return can_world @ SOCKET.inverted()


def can_at(point, turn):
    return Matrix.Translation(Vector(point)) @ turn.to_matrix().to_4x4()


RIM = Vector(V['rim'])                                                       # the rim on the side that goes to the lip (beer-hold.js beerRim)


def at_lip(t, tilt, away=0.0, yaw=0.0, down=0.0, side=0.0):
    """The can with its rim at his lower lip at time t (the head as the keys have it), tipped `tilt`; `away` metres off it."""
    head = world_of('head', t)
    lip = head @ Vector(K['lip']['lower'])
    fwd = (head.to_quaternion() @ Vector((0, 0, 1)))
    turn = can_turn(tilt, yaw)
    p = lip + fwd * away + Vector((0, -down, 0)) + (head.to_quaternion() @ Vector((1, 0, 0))) * side - turn @ RIM
    return can_at(p, turn)


def chest_point(t, local):
    return world_of('chest', t) @ Vector(local)


def wrist_excess(side):
    q = game_local('hand' + side)
    a = (Vector(K['bones']['hand' + side]) - Vector(K['bones']['elbow' + side])).normalized()
    p = a * Vector((q.x, q.y, q.z)).dot(a)
    t = Quaternion((q.w, p.x, p.y, p.z))
    t.normalize()
    e = (t.inverted() @ q).to_euler('ZYX')
    z = e.z if side == 'R' else -e.z                                        # (the left's turns are the right's mirror: y and z)
    return max(0, WRIST[0][0] - e.x, e.x - WRIST[0][1]) + max(0, WRIST[2][0] - z, z - WRIST[2][1])


def settle_poles(side, times):
    pole = P['pole.' + side]
    last, found = None, []
    for t in times:
        scene.frame_set(F(t))
        S = (rig.matrix_world @ P['shoulder' + side].matrix).to_translation()
        W = (rig.matrix_world @ P['ik.' + side].matrix).to_translation()
        p0 = (rig.matrix_world @ pole.matrix).to_translation()
        axis = (W - S).normalized()
        tried = []
        for deg in range(-70, 71, 10):
            p = S + Matrix.Rotation(math.radians(deg), 3, axis) @ (p0 - S)
            pole.matrix = rig.matrix_world.inverted() @ Matrix.Translation(p)
            bpy.context.view_layer.update()
            tried.append((wrist_excess(side), deg, p, (rig.matrix_world @ P['elbow' + side].matrix).to_translation()))
        # (of the turns that keep the wrist as well as any can, the one whose elbow is nearest where the last key's was: the
        # elbow goes on its way, it does not jump to the other side of the arm from one key to the next; the animator's own
        # pole where nothing was found before)
        least = min(x for x, *_ in tried)
        ok = [c for c in tried if c[0] <= least + .06]                     # (soft_wrist, at the bake, takes up as little as this)
        best = min(ok, key=lambda c: (c[3] - last).length + .002 * abs(c[1]) if last is not None else abs(c[1]))
        last = best[3]
        pole.matrix = rig.matrix_world.inverted() @ Matrix.Translation(best[2])
        pole.keyframe_insert('location', frame=F(t))
        found.append((t, pole.location.copy()))
    # (and the found poles eased into one another, twice over their neighbours: one key's elbow a way round from the next's
    # swung over in the frames between them; the wrist, a little past its ends where that leaves it, soft_wrist takes up)
    for _ in range(2):
        found = [(t, (found[max(0, i - 1)][1] + 2 * p + found[min(len(found) - 1, i + 1)][1]) / 4) for i, (t, p) in enumerate(found)]
    for t, p in found:
        pole.location = p
        pole.keyframe_insert('location', frame=F(t))


# (the left hand over the can turned again, its fingers on along its forearm as the IK has it; its elbow found after)
exec(open(Path(__file__).resolve().parent / 'drink-beer-keys.py').read())

# ------------------------------------------------------------------ the keys applied to the rig
A4 = A.to_4x4()
on_counter.matrix_world = A4 @ counter_at()
FPS_LEAD = 4 / FPS
# FK: the spine leads every pose but the held ones (C, at rest) by four frames (the root first); the chest, the neck and the
# head with the pose (the head after the eyes: headLook)
for t, sp, ch, nk, hd in BODY:
    for n, e in (('spine', sp), ('chest', ch), ('neck', nk), ('head', hd)):
        lead = FPS_LEAD if n == 'spine' and sp not in (CPOSE[0], ZERO[0]) else 0.0
        key_fk(n, max(0.0, t - lead), e)
for n in LEGS:
    for t in (0, duration):
        pose_game(n, SEATED_POSE[n])
        P[n].keyframe_insert('rotation_quaternion', frame=F(t))
for name, keys_ in CUES.items():
    for t, v in sorted(keys_, key=lambda x: x[0]):
        key_prop(name, t, v)
# (reaching for the glass on the counter, the right shoulder comes forward with the lean, as a shoulder blade slides round the
# ribs in a reach: PROTRACT at the most, keyed from the `lean` cue; the game does the same from it, drink-beer.js)
PROTRACT = .05
for f in range(1, F(duration) + 1):
    scene.frame_set(f)
    P['shoulderR'].location = (0, 0, PROTRACT * k * float(rig['lean']))
    P['shoulderR'].keyframe_insert('location', frame=f)
for t, v in sorted(CUES['look']):
    key_prop('headLook', t if t == 0 else min(duration, t + 5 / FPS), v)
# swallows: each a small dip of the chin at its beat (the throat's squash is the game's: the `swallow` cue)
for t, v in CUES['swallow']:
    if v > .99:
        scene.frame_set(F(t))
        P['head'].rotation_quaternion = P['head'].rotation_quaternion.copy() @ gameE(.03, 0, 0)
        P['head'].keyframe_insert('rotation_quaternion', frame=F(t))
# Breathing (secondary, straight ahead): the chest on a 4.8 s cycle, 0.006 rad, let go of near the ends of each part so the
# parts join on the same pose
JOINS = [SEG['take'], SEG['first'], SEG['sip'], SEG['let'], duration]
frames = range(1, F(duration) + 1)
envelope = lambda t: min(1.0, *[min(1, max(0, (abs(t - b) - .05) / .3)) for b in JOINS])
chest_q = []
for f in frames:
    scene.frame_set(f)
    chest_q.append(game_local('chest'))
for f, q in zip(frames, chest_q):
    t = (f - 1) / FPS
    e = envelope(t)
    e = e * e * (3 - 2 * e)
    q = q @ Quaternion((1, 0, 0), .006 * e * math.sin(2 * math.pi * t / 4.8))
    R = rig.data.bones['chest'].matrix_local.to_quaternion()
    P['chest'].rotation_quaternion = R.inverted() @ Aq @ q @ Aq.inverted() @ R
    P['chest'].keyframe_insert('rotation_quaternion', frame=f)


def fill_at(t):
    scene.frame_set(F(t))
    return float(rig['fill'])


def moved(m, d):
    return Matrix.Translation(Vector(d)) @ m


def between(a, b, u, bow=(0, 0, 0)):
    p = a.to_translation().lerp(b.to_translation(), u) + Vector(bow)
    return Matrix.Translation(p) @ a.to_quaternion().slerp(b.to_quaternion(), u).to_matrix().to_4x4()


ON = hand_for(counter_at())
CHEST_AT = Vector((-.12, M['chestY'] + .06, .3))                              # (held up in front of his chest, pleased with it)
LOW_AT = Vector((-.13, M['chestY'] + .02, .31))


def glass_pose(name, t):
    """The right hand's pose for a named place of the glass (or of the hand, off it) at time t (game frame)."""
    rest = SEATED['handR']
    if name == 'rest':
        return rest
    if name == 'dip':
        return moved(rest, (0, -.012, -.02))
    if name == 'restpast':
        return moved(rest, (0, -.006, .004))
    if name == 'near':
        return moved(ON, (-.02, .01, -.035))
    if name == 'mid':
        return between(moved(rest, (0, -.012, -.02)), moved(ON, (-.02, .01, -.035)), .5, (-.02, .06, 0))
    if name == 'on':
        return ON
    if name == 'off':
        return moved(ON, (-.025, .015, -.02))
    if name == 'back':
        return between(moved(ON, (-.025, .015, -.02)), rest, .5, (-.02, .05, 0))
    if name == 'rock':
        return hand_for(counter_at(dz=.015, tip=math.radians(5)))
    if name == 'up':
        return hand_for(can_at(SPOT + Vector((0, .09, -.06)), can_turn(math.radians(4))))
    if name == 'in':
        lip = at_lip(t, math.radians(18), away=.08, down=.05)
        return hand_for(can_at(SPOT.lerp(lip.to_translation(), .6) + Vector((0, .1, -.02)), can_turn(math.radians(12))))
    if name == 'chest':
        return hand_for(can_at(CHEST_AT, can_turn(math.radians(10), .1)))
    if name == 'chestlow':
        return hand_for(can_at(LOW_AT, can_turn(math.radians(5), .1)))
    if name == 'setup':
        return hand_for(can_at(LOW_AT + Vector((0, .025, -.015)), can_turn(math.radians(5), .1)))
    if name == 'setmid':
        return hand_for(can_at((LOW_AT + Vector((0, .025, -.015))).lerp(SPOT, .55) + Vector((0, .035, 0)), can_turn(math.radians(2), .05)))
    if name == 'setnear':
        return hand_for(can_at(SPOT + Vector((0, .012, -.004)), UPRIGHT))
    if isinstance(name, tuple) and name[0] == 'lip':
        _, deg, away = name
        tilt = tilt_for(fill_at(t)) + math.radians(3) if deg is None else math.radians(deg)
        return hand_for(at_lip(t, tilt, away=away))
    raise KeyError(name)


# the right hand (its IK control): the glass's places; a pull keyed every tenth of a second with the rim on the lip, the glass
# going over as the beer goes down (the tilt the beer left needs to reach the rim, and 3 degrees more)
GLASS_KEYS = []
for t, name in GLASS:
    if isinstance(name, tuple) and name[0] == 'pull':
        _, ta, tb, f0, f1 = name
        n = max(1, round((tb - ta) / .1))
        GLASS_KEYS += [(ta + (tb - ta) * i / n, ('lip', None, 0)) for i in range(n + 1)]
    else:
        GLASS_KEYS.append((t, name))
GLASS_KEYS.sort(key=lambda x: x[0])
for t, p in POLES_R:
    key_at('pole.R', t, (p[0] * k, p[1] * k, p[2] * k))
for t, name in GLASS_KEYS:
    key_pose('ik.R', t, glass_pose(name, t), 'handR')
# the left hand: at rest on his thigh; for the first draught's foam, up to his lips, the side of the forefinger drawn across
# the upper lip from his left to his right, and down again
HK = K['hand']
WIPE_AT = Vector((HK['half'][0] * M['hand'], (HK['knuckles'] * .7 + HK['tip'] * .3) * M['hand'], .1 * M['hand']))   # (the back of the left hand's fingers, just past the knuckles)
UPPER_LIP = Vector(K['lip']['mouth']) + Vector((0, .007 * k, .006 * k))


def wipe_pose(t, dx):
    head = world_of('head', t)
    hq = head.to_quaternion()
    hx, hy, hz = hq @ Vector((1, 0, 0)), hq @ Vector((0, 1, 0)), hq @ Vector((0, 0, 1))
    at = head @ UPPER_LIP + hx * dx + hz * .003
    fingers = (-hx * math.cos(.35) - hy * math.sin(.35)).normalized()         # (across, to his right, a little down)
    y = -fingers
    x = -hz                                                                  # (the back of the hand toward his lips, the palm away)
    x = (x - y * x.dot(y)).normalized()
    z = x.cross(y)
    turn = Matrix((x, y, z)).transposed()
    return Matrix.Translation(at - turn @ WIPE_AT) @ turn.to_4x4()


def bone_point(name, p, t=None):
    """A point in a bone's own frame (the game's axes), where it is at time t (game frame)."""
    if t is not None:
        scene.frame_set(F(t))
    m = rig.matrix_world @ P[name].matrix
    return B2G(m.to_translation() + (m.to_quaternion() @ rig.data.bones[name].matrix_local.to_quaternion().inverted() @ Aq) @ Vector(p))


def left_pose(name, t):
    rest = SEATED['handL']
    return {'rest': lambda: rest, 'restdip': lambda: moved(rest, (0, -.01, 0)), 'restpast': lambda: moved(rest, (0, -.005, 0)),
            'wipe0': lambda: wipe_pose(t, .03 * k), 'wipe1': lambda: wipe_pose(t, -.028 * k),
            'rising': lambda: between(rest, wipe_pose(t, .03 * k), .55, (.05, 0, .03)),
            'falling': lambda: between(wipe_pose(t, -.028 * k), rest, .45, (.06, -.02, .04))}[name]()


POLES_L = [(0, (.45, .75, -.2)), (duration, (.45, .75, -.2))]
for t, name in LEFT:
    if name in ('rising', 'wipe0', 'wipe1', 'falling'):
        POLES_L.append((t, (.55, .65, .1)))
for t, p in sorted(POLES_L):
    key_at('pole.L', t, (p[0] * k, p[1] * k, p[2] * k))
for t, name in LEFT:
    key_pose('ik.L', t, left_pose(name, t), 'handL')
# (the back of the fingers onto the lip as the IK and the wrist have the hand: each wipe key moved by what it is off, twice over)
for _ in range(2):
    for t, name in LEFT:
        if name in ('wipe0', 'wipe1'):
            want = wipe_pose(t, (.03 if name == 'wipe0' else -.028) * k) @ WIPE_AT
            got = Vector(bone_point('handL', WIPE_AT, t))
            key_pose('ik.L', t, moved(left_pose(name, t), want - got), 'handL')
every = lambda t0, t1, dt=.2: [t0 + dt * i for i in range(int((t1 - t0) / dt) + 1)]
settle_poles('R', sorted(set([round(t, 3) for t, _ in GLASS_KEYS] + every(0, duration, .1))))
settle_poles('L', sorted(set([round(t, 3) for t, _ in LEFT] + every(0, duration, .2))))
# the look target: the glass's top (on the counter or in the hand), the head turning to it as far as headLook
for t in every(0, duration, .1):
    scene.frame_set(F(t))
    g = in_hand if float(rig['hold']) > .5 else on_counter
    key_at('look', t, B2G(Matrix(g.matrix_world) @ Vector((0, V['rimHeight'], 0))))
# the glass: on the counter until the fingers close on it, in the hand until they open
for t, v in [(0, 0)] + sorted(CUES['hold']):
    for ob, shown in ((in_hand, v > .5), (on_counter, v <= .5)):
        for o in [ob] + list(ob.children):
            o.hide_render = not shown
            o.keyframe_insert('hide_render', frame=F(t))
# every key eased (auto-clamped Bezier), the hide keys held
for ob in [rig, in_hand, on_counter] + list(in_hand.children) + list(on_counter.children):
    ad = ob.animation_data
    if ad and ad.action:
        for fc in ad.action.fcurves if hasattr(ad.action, 'fcurves') else []:
            for kp in fc.keyframe_points:
                kp.interpolation = 'CONSTANT' if 'hide' in fc.data_path else 'BEZIER'
                kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'
scene.frame_start, scene.frame_end = 1, F(duration)
print('keyed', F(duration), 'frames', flush=True)

# ------------------------------------------------------------------ bake and export
def g3(v):
    return [round(c, 5) for c in B2G(v)]


def head_point(p):
    """A point of the head (its bone's frame, the game's axes) where the head is now (Blender's frame)."""
    m = rig.matrix_world @ P['head'].matrix
    return m.to_translation() + (m.to_quaternion() @ rig.data.bones['head'].matrix_local.to_quaternion().inverted() @ Aq) @ Vector(p)


def set_game_local(name, q):
    """Pose a bone by its turn in the game's terms (its parent's frame, the game's axes): its basis here."""
    R = rig.data.bones[name].matrix_local.to_quaternion()
    P[name].rotation_quaternion = R.inverted() @ Aq @ q @ Aq.inverted() @ R


FOREARM = {s: (Vector(K['bones']['hand' + s]) - Vector(K['bones']['elbow' + s])).normalized() for s in 'RL'}


def twist_into_forearm(side, elbow, hand):
    """The hand's turn about the forearm's line moved into the forearm, which turns the hand that way (the elbow's own twist,
    as the game turns it); the wrist bends, it does not wring. (About the forearm's own line, from the elbow to the wrist,
    which turning about leaves the wrist where it is.)"""
    a = FOREARM[side]
    v = Vector((hand.x, hand.y, hand.z))
    p = a * v.dot(a)
    t = Quaternion((hand.w, p.x, p.y, p.z))
    t.normalize()
    return elbow @ t, t.inverted() @ hand


UPPERARM = {s: (Vector(K['bones']['elbow' + s]) - Vector(K['bones']['shoulder' + s])).normalized() for s in 'RL'}


ROLLED = {}


def settle_roll(side, shoulder, elbow):
    """The upper arm's roll about its own line, which the IK leaves to chance where the arm is near straight (and turns over
    from one frame to the next), set as the game's arms have it: the elbow bending about its own x (forward, the hinge every
    move of the game's bends it by) and, as the arm straightens, the upper arm not rolled at all. The arm is where it was:
    only what the shoulder and the elbow each take of the turn about the upper arm's line changes, so the motion blends from
    and to the game's own poses the short way, and samples between its frames without the arm wringing."""
    u, f = UPPERARM[side], FOREARM[side]
    rest = -2 * math.atan2(Vector((shoulder.x, shoulder.y, shoulder.z)).dot(u), shoulder.w)     # (the shoulder's own roll, undone)
    perp = lambda v: v - u * v.dot(u)
    d, n = perp(elbow @ f), perp(Vector((-1, 0, 0)).cross(f))                  # (the forearm, and the way a hinge bends it)
    if n.length < 1e-6 or d.length < 1e-6:
        a = rest
    else:
        hinge = math.atan2(u.dot(n.cross(d)), n.dot(d))
        s = min(1, d.length / math.sin(.5))
        s = s * s * (3 - 2 * s)
        # (the way round from the one to the other kept from frame to frame, not the shorter: where the two are half a turn
        # apart, the shorter way changes sides as the arm straightens, and the upper arm would turn over in a frame)
        was = ROLLED.get(side)
        diff = math.remainder(hinge - rest, math.tau)
        if was is not None:
            diff += math.tau * round((was - diff) / math.tau)
        ROLLED[side] = diff
        a = rest + diff * s
    return shoulder @ Quaternion(u, a), Quaternion(u, -a) @ elbow


def soft_wrist(side, q):
    """The wrist kept within what a wrist does (PALM.wrist): its bend and its turn to either side eased into their ends
    within the last 0.15 rad of them, never past (on the way between keys the controls bent it back a moment)."""
    e = q.to_euler('ZYX')                                    # (Blender's ZYX: the game's (three.js) XYZ, the order PALM.wrist is in)
    sg = 1 if side == 'R' else -1
    soft = lambda v, lo, hi, m=.15: (hi - m + m * math.tanh((v - hi + m) / m)) if v > hi - m else (lo + m - m * math.tanh((lo + m - v) / m)) if v < lo + m else v
    e.x = soft(e.x, WRIST[0][0] + .03, WRIST[0][1] - .03)                   # (a little inside them: the game samples between frames)
    e.z = sg * soft(sg * e.z, WRIST[2][0] + .03, WRIST[2][1] - .03)
    return e.to_quaternion()


frames = range(1, F(duration) + 1)
# The bake: every frame's pose, as the controls put it, written to the game's bones (the forearm taking its twist), and the
# controls let go; the renders and the export are of the baked bones.
baked, contacts = [], []
for f in frames:
    scene.frame_set(f)
    pose = {n: game_local(n) for n in JOINTS}
    for side in 'RL':
        pose['elbow' + side], pose['hand' + side] = twist_into_forearm(side, pose['elbow' + side], pose['hand' + side])
        pose['shoulder' + side], pose['elbow' + side] = settle_roll(side, pose['shoulder' + side], pose['elbow' + side])
        pose['hand' + side] = soft_wrist(side, pose['hand' + side])
    baked.append(pose)
    contacts.append({c: float(rig[c]) for c in ('lip', 'mouth', 'counter', 'hold', 'wipe')})
    contacts[-1]['held'] = contacts[-1]['counter'] * contacts[-1]['hold']
# Overlap (follow-through-overlapping: "offset secondary elements by 2-4 frames (at 24fps) per level of hierarchy"; the
# standard's rule 5): the IK moves the upper arm and the hand together, so the forearm and the hand (the secondary level) are
# moved LAG frames after the upper arm, both (the wrist's bend is the same, later). Where the hand holds a contact (the rim at
# the lip, the forefinger on the ring, the tab at the pocket) the arm is the IK's own, which puts it there; eased into it and
# out of it over EASE frames each side, so the hand comes to the contact on its arc and leaves on one, and nothing is flung.
# (A drag by half, and the hand's own four frames, did not stagger the levels; a whole drag with no contacts put back flung
# the can at 107 mm a frame.)
LAG, EASE = 3, 8
ease3 = lambda x: 0.0 if x <= 0 else 1.0 if x >= 1 else x * x * (3 - 2 * x)
for side, held_by in (('R', ('lip', 'mouth', 'held')), ('L', ('wipe',))):  # (the can too: on its ring, and near his face, which a
    # late forearm would put it into)
    on = [max(c[h] for h in held_by) for c in contacts]
    soft = [max(on[j] * ease3(1 - abs(i - j) / EASE) for j in range(max(0, i - EASE), min(len(on), i + EASE + 1))) for i in range(len(on))]
    late = {part: [p[part + side].copy() for p in baked] for part in ('elbow', 'hand')}
    for i in range(len(baked)):
        for part in ('elbow', 'hand'):
            baked[i][part + side] = late[part][max(0, i - LAG)].slerp(late[part][i], soft[i])
        # (between the two, the hand's twist given to the forearm again and the wrist kept within what a wrist does)
        baked[i]['elbow' + side], hand = twist_into_forearm(side, baked[i]['elbow' + side], baked[i]['hand' + side])
        baked[i]['hand' + side] = soft_wrist(side, hand)
# Spacing (slow-in-out-mastery; the principles audit's ease): every joint's curve from the spine up evened over its
# neighbours, five frames each side by binomial weights (about a frame and a half's spread at 30 fps): the poses stay where they are keyed,
# the steps of speed from one key's in-betweens to the next's (which the game plays as a jump of the joint's turn a frame) are
# taken out.
SPREAD = (1, 10, 45, 120, 210, 252, 210, 120, 45, 10, 1)


def evened(qs, spread=SPREAD):
    out, n = [], len(spread) // 2
    for i, q in enumerate(qs):
        acc = Vector((0, 0, 0))
        for d, w in zip(range(-n, n + 1), spread):
            r = q.inverted() @ qs[min(len(qs) - 1, max(0, i + d))]
            if r.w < 0:
                r = -r
            axis, angle = r.to_axis_angle()
            acc += axis * angle * w / sum(spread)
        out.append(q @ Quaternion(acc.normalized(), acc.length) if acc.length > 1e-9 else q.copy())
    return out


UPPER = ('spine', 'chest', 'neck', 'head', 'shoulderL', 'elbowL', 'handL', 'shoulderR', 'elbowR', 'handR')
# (and less while the rim is at his lip, a frame each side, eased over twice EASE: there every joint from the spine up is close to where the IK put the
# can on the lip as the head swallows; eased from the one to the other as the contact comes and goes)
on = [max(c['lip'], c['wipe'], c['held']) for c in contacts]          # (and the back of the fingers on the lip, the glass on the counter)
at_lip = [max(on[j] * ease3(1 - abs(i - j) / (2 * EASE)) for j in range(max(0, i - 2 * EASE), min(len(on), i + 2 * EASE + 1))) for i in range(len(on))]
for n in UPPER:
    raw = [p[n] for p in baked]
    for pose, q, q1, w in zip(baked, evened(raw), evened(raw, (1, 2, 1)), at_lip):
        pose[n] = q.slerp(q1, w)
# (the hands' own turns once more, two frames each side, at the lip too: the IK's hand is turned key by key, and its turn at
# the wrist is the least even of all)
for n in ('handR', 'handL'):
    for pose, q in zip(baked, evened([p[n] for p in baked], (1, 4, 6, 4, 1))):
        pose[n] = q
for side in 'RL':                                                           # (and the wrist still within what a wrist does)
    for pose in baked:
        pose['hand' + side] = soft_wrist(side, pose['hand' + side])
for pb in P:
    for c in pb.constraints:
        if c.type in ('IK', 'COPY_ROTATION', 'DAMPED_TRACK'):
            c.mute = True
for n in UPPER:
    fc = [c for c in (rig.animation_data.action.fcurves if hasattr(rig.animation_data.action, 'fcurves') else []) if c.data_path == f'pose.bones["{n}"].rotation_quaternion']
    for f, pose in zip(frames, baked):
        set_game_local(n, pose[n])
        P[n].keyframe_insert('rotation_quaternion', frame=f)


cues = ('closeR', 'closeL', 'blink', 'breath', 'smile', 'look', 'kaa', 'foam', 'swallow', 'shrug', 'lip', 'mouth', 'counter', 'hold', 'wipe', 'lean', 'fill')
reach = {'R': [], 'L': [], 'mouth': [], 'mouthL': [], 'foot': [], 'spot': []}
times, joints, tracks = [], {n: [] for n in JOINTS}, {c: [] for c in cues}
verify = {'rim': [], 'lip': [], 'base': [], 'up': [], 'wipe': [], 'upperLip': [], 'wrist': {'R': [], 'L': []}}
WM = rig.matrix_world
for f in frames:
    scene.frame_set(f)
    times.append(round((f - 1) / FPS, 5))
    for n in JOINTS:
        q = game_local(n)
        if q.w < 0:
            q = -q
        joints[n] += [round(q.x, 4), round(q.y, 4), round(q.z, 4), round(q.w, 4)]
    for c in cues:
        tracks[c].append(round(min(1, max(0, float(rig[c]))), 4))
    chest = rig.matrix_world @ P['chest'].matrix
    cq = chest.to_quaternion() @ rig.data.bones['chest'].matrix_local.to_quaternion().inverted() @ Aq
    for side in 'RL':
        w = (rig.matrix_world @ P['hand' + side].matrix).to_translation()
        reach[side] += [round(c / M['k'], 4) for c in cq.inverted() @ (w - chest.to_translation())]
    head = rig.matrix_world @ P['head'].matrix
    hq = head.to_quaternion() @ rig.data.bones['head'].matrix_local.to_quaternion().inverted() @ Aq
    wr, wl = (rig.matrix_world @ P['handR'].matrix).to_translation(), (rig.matrix_world @ P['handL'].matrix).to_translation()
    reach['mouth'] += [round(c / M['k'], 4) for c in hq.inverted() @ (wr - head_point(K['lip']['lower']))]
    reach['spot'] += [round(c, 4) for c in Vector(B2G(wr)) - SPOT]                                # (the right wrist from the glass's place, metres)
    reach['mouthL'] += [round(c / M['k'], 4) for c in hq.inverted() @ (wl - head_point(UPPER_LIP))]
    g = in_hand if float(rig['hold']) > .5 else on_counter
    gm = Matrix(g.matrix_world)
    reach['foot'] += [round(c, 4) for c in Vector(B2G(gm @ Vector((0, 0, 0)))) - SPOT]          # (the glass's foot from its place on the counter, metres)
    verify['rim'].append(g3(gm @ RIM))
    verify['lip'].append(g3(head_point(K['lip']['lower'])))
    verify['upperLip'].append(g3(head_point(UPPER_LIP)))
    verify['base'].append(g3(gm @ Vector((0, 0, 0))))
    verify['up'].append([round(c, 4) for c in B2G(gm.to_quaternion() @ Vector((0, 1, 0)))])
    hl = WM @ P['handL'].matrix
    verify['wipe'].append(g3(hl.to_translation() + (hl.to_quaternion() @ rig.data.bones['handL'].matrix_local.to_quaternion().inverted() @ Aq) @ WIPE_AT))
    for side in 'RL':
        e = game_local('hand' + side).to_euler('ZYX')
        verify['wrist'][side].append([round(e.x, 4), round(e.y, 4), round(e.z, 4)])
grasp = next(t for t, v in zip(times, tracks['hold']) if v > .5)
release = max(t for t, v in zip(times, tracks['hold']) if v > .5)
motion = {'format': 'johansson-motion', 'version': 2, 'name': {'mug': 'Drinks a draught from the mug', 'pint': 'Drinks a pint', 'glass': 'Drinks a small glass of beer'}[VESSEL],
          'fps': FPS, 'by': f'tools/blender/drink-beer.py --vessel {VESSEL} ({args.name})',
          'times': times, 'joints': {n: joints[n] for n in UPPER},
          'shapes': {c: tracks[c] for c in ('closeR', 'closeL')},
          'face': {c: tracks[c] for c in ('blink', 'breath', 'smile', 'look', 'kaa', 'foam', 'swallow', 'shrug')},
          'reach': reach,
          'contact': {c: tracks[c] for c in ('lip', 'mouth', 'counter', 'hold', 'wipe', 'lean')},
          'fill': tracks['fill'],
          'events': [{'t': round(grasp, 5), 'name': 'grasp'}, {'t': round(release + 1 / FPS, 5), 'name': 'release'}],
          'markers': {n: round(TIMES[n], 5) for n in ('take', 'first', 'sip', 'let', 'end')},
          'props': {'glass': {'vessel': VESSEL, 'kind': V['kind'], 'bone': 'handR', 'made': {'name': args.name, 'k': round(M['k'], 5)}},
                    'counter': {'spot': [round(c, 5) for c in SPOT], 'top': round(TOP, 5)}}}
target = ROOT / f'src/avatars/motions/drink-beer-{VESSEL}.js'
target.write_text(f'// Written by tools/blender/drink-beer.py --vessel {VESSEL} (Blender: the rig, the keys and the bake are there); the game\'s\n'
                  '// motion format, src/avatars/motion.js `johansson-motion` v2. Do not edit: animate it there and export it again.\n'
                  'export default ' + json.dumps(motion, separators=(',', ':')) + ';\n')
(ROOT / f'tests/drink-beer-{VESSEL}.verify.json').write_text(json.dumps({'name': args.name, 'vessel': VESSEL, 'times': times, 'lipWeight': tracks['lip'], 'counterWeight': tracks['counter'],
                                                                        'holdWeight': tracks['hold'], 'wipeWeight': tracks['wipe'], 'top': TOP, **verify}, separators=(',', ':')) + '\n')
err = [((Vector(r) - Vector(l)).length, t) for r, l, w, t in zip(verify['rim'], verify['lip'], tracks['lip'], times) if w > .99]
print('rim to lip at contact: max %.1f mm, mean %.1f mm over %d frames' % (max(e for e, _ in err) * 1000, sum(e for e, _ in err) / len(err) * 1000, len(err)))
on = [(abs(b[1] - TOP), t) for b, w, h, t in zip(verify['base'], tracks['counter'], tracks['hold'], times) if w > .99]
print('the foot on the counter while it is there: off it by at most %.1f mm (at %.2f s)' % (max(on)[0] * 1000, max(on)[1]))
low = min((b[1] - TOP, t) for b, t in zip(verify['base'], times))
print('the foot lowest against the counter top: %.1f mm (at %.2f s)' % (low[0] * 1000, low[1]))
we = [((Vector(a) - Vector(b)).length, t) for a, b, w, t in zip(verify['wipe'], verify['upperLip'], tracks['wipe'], times) if w > .99]
if we:
    print('the forefinger to the upper lip while wiping: %.1f-%.1f mm' % (min(we)[0] * 1000, max(we)[0] * 1000))
for side in 'RL':
    sg = 1 if side == 'R' else -1
    worst = 0
    for e in verify['wrist'][side]:
        for i, (lo, hi) in enumerate(WRIST):
            v = e[i] if i == 0 or sg > 0 else -e[i]
            worst = max(worst, lo - v, v - hi)
    print('wrist %s: furthest past its limits %.3f rad' % (side, worst))
print('wrote', target, len(times), 'samples', flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / f'drink-beer-{VESSEL}.blend'), compress=True)

# ------------------------------------------------------------------ contact sheets
if args.sheet or args.frames:
    picks = [float(x) for x in args.frames.split(',')] if args.frames else [.35, .55, .9, 1.25, 1.57, 1.73, 2.15, 2.35, 3.85, 4.2, 4.55, 5.9, 6.8, 8.2, 8.9, 9.55]
    views = {'front': (0, -1.0), 'three-quarter': (-.62, -.78), 'side': (-1.0, 0), 'opening': (.35, -.94)}
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 8
    scene.cycles.use_denoising = False
    scene.cycles.max_bounces = 2
    scene.view_settings.view_transform = 'Standard'
    scene.render.resolution_x, scene.render.resolution_y = 300, 360
    world = bpy.data.worlds.new('Paper')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (.82, .88, .92, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = .7
    scene.world = world
    sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN'))
    sun.data.energy = 3.0
    scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(50), 0, math.radians(-30))
    scene.render.use_freestyle = True
    scene.render.line_thickness = 1.4
    fs = bpy.context.view_layer.freestyle_settings
    ls = fs.linesets[0] if fs.linesets else fs.linesets.new('ink')
    ls.select_silhouette, ls.select_border, ls.select_crease = True, False, False
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new('ink')
    ls.linestyle.color = (.19, .12, .10)
    cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera'))
    cam.data.lens = 50
    scene.collection.objects.link(cam)
    scene.camera = cam
    shots = OUT / 'shots'
    shots.mkdir(exist_ok=True)
    files = []
    T0, T1, T2, T3 = TIMES['take'], TIMES['first'], TIMES['sip'], TIMES['let']
    picks = [T0 + .3, T0 + .62, T0 + 1.0, T0 + 1.45, T1 + .5, T1 + .9, T1 + 1.4, T1 + 2.6, T1 + 3.3, T1 + 3.65, T1 + 4.5, T1 + 5.3, T1 + 5.95, T2 + 1.75, T3 + .7, T3 + 1.4]
    if args.frames:
        picks = [float(x) for x in args.frames.split(',')]
    story = [T0 + 1.45, T1 + .5, T1 + 1.4, T1 + 2.6, T1 + 3.65, T1 + 4.5, T1 + 5.95, T3 + .7]
    views = {'front': (0, -1.0), 'three-quarter': (-.62, -.78), 'side': (-1.0, 0)}
    for view, (dx, dy) in views.items():
        for t, silhouette in [(t, False) for t in picks] + [(t, True) for t in (story if not args.frames else [])]:
            scene.frame_set(F(t))
            g = in_hand if float(rig['hold']) > .5 else on_counter
            set_level(g, float(rig['fill']), .012 if VESSEL != 'glass' else .006)
            for o in (counter, stool):
                o.hide_render = silhouette                                  # (the figure and the glass alone, on nothing)
            aim = Vector((0, 0, 1.0))
            cam.location = aim + Vector((dx, dy, 0)) * 1.9 + Vector((0, 0, .15))
            cam.rotation_euler = (aim - cam.location).to_track_quat('-Z', 'Y').to_euler()
            scene.render.filepath = str(shots / f'{view}-{F(t):03d}{"-s" if silhouette else ""}.png')
            scene.render.film_transparent = silhouette
            bpy.ops.render.render(write_still=True)
            scene.render.film_transparent = False
            if silhouette:
                shape = str(shots / f'{view}-{F(t):03d}-silhouette.png')
                subprocess.run(['convert', scene.render.filepath, '-alpha', 'extract', '-threshold', '50%', '-negate', shape], check=True)
                files.append((view, t, shape, 'silhouette'))
            else:
                files.append((view, t, scene.render.filepath, ''))
        print('rendered', view, flush=True)
    for o in (counter, stool):
        o.hide_render = False
    name = 'frames' if args.frames else None
    for view in views:
        sheet = ROOT / f'art/characters/body-kit/review/drink-beer-{VESSEL}-{view}.jpg' if not name else OUT / f'frames-{view}.jpg'
        cmd = ['montage'] + [x for v, t, f, tag in files if v == view for x in ('-label', f'{t:.2f} s' + (f' {tag}' if tag else ''), f)] + ['-tile', '8x', '-geometry', '+2+2', '-pointsize', '14', str(OUT / f'sheet-{view}.png')]
        subprocess.run(cmd, check=True)
        subprocess.run(['convert', str(OUT / f'sheet-{view}.png'), '-quality', '82', str(sheet)], check=True)
        print('sheet', sheet, flush=True)

