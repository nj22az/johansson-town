"""A resident opening a can and drinking it, animated in Blender and played in the game.

  python tools/blender/drink-can.py --root . [--name Johansson] [--out output/drink-can] [--sheet]     (bpy 5.x from pip)

The owner, 27 November 2026: "These hands are near perfect but are they rigged? Can they still drink beer or anything from
the vending machines?", "A can needs to be opened also, removing the tab", "He is holding the can very weird, can you
research how others did this? Drinking needs to be impeccable Disney animation standard", and then: "You need to animate
the beer drinking in blender and bring it to the game after, the rigging might need improvement".

The RIG is the game's own skeleton (tools/export-avatar-glb.mjs: the body as the generator builds it, the 28 bones named as
the game's; Blender's rest pose is the game's, every bone's axes the game's, so a bone's pose here is its rotation there),
improved for animating:
- SOCKETS: `socket.R` under the right hand, where the can is parented (consume.js canSocket: the can's axis along the
  knuckle line, the palm on it, measured on the kit's wrap, tools/blender/hand_model.py CAN); `hook.L` under the left
  hand, where a ring the hooked forefinger lifts lies (HAND.hookAt).
- The hands' SHAPES as shape keys on the body (the game's own points, tools/drink-kit.mjs): round the can (wrap), the
  fist, the forefinger hooked; driven by the rig's `closeR`/`closeL` (0 the hand at rest, the wrap at HAND.wrapAt, 1 the
  fist: the way build.js grip closes a hand) and `hookL`/`hookR`, which the animator keys. No finger bones: the three
  shapes are the hand's whole part in this (it holds, wraps and hooks), each made to measure in Blender (the wrap is on the
  can to a millimetre); bones for fifteen finger joints a hand would take the game's skeleton from 28 bones to 58 for every
  body on screen, every point of the hand weighted to three of them, and fingers posed joint by joint in every move.
- CONTROLS: the arms by IK (`ik.R`, `ik.L`: where the hand goes and how it is turned; `pole.R`, `pole.L`: where the elbow
  goes), each wrist kept in what a wrist does (animate.js PALM.wrist, in the game's Euler order: Blender's ZYX is three.js's
  XYZ); the head by FK, and a `look` target the head turns to as far as `look` says. Each pole's angle is found by
  measuring, not set (the left arm's is half a turn from the right's: with both at 0 the left elbow went away from its
  pole, into his chest); the poles the wrist limits ask for are eased into one another, so no elbow swings over between
  keys. Baked to the game's bones on export: the forearm taking the hand's twist, and each upper arm's roll settled as the
  game's arms have it (the elbow bending about its own x; no roll where the arm is straight), so the motion blends from and
  to the game's poses the short way and no joint turns over between frames.
- The CAN (izakaya-serving-visuals.js 'can', sealed, at its size) on the socket, and its TAB: on the can, then in the left
  hand's hook from the moment it tears off (two Child Of constraints, their influence keyed), then gone in the shirt's
  pocket.

The PERFORMANCE is keyed pose to pose at 30 frames a second (KEYS below), every key eased (Bezier, auto-clamped), the hand's
path through keys set off the straight line so it arcs; the eyes lead the head by a few frames, the chest and the shoulders
follow the arm a few frames late and settle after it. The opening at the lower chest; then the drink in two pulls (a full
can in one go would be twelve seconds of a man's throat; two pulls with a breath between them is how a can is drunk down
when it is thirst, and the second is the one that tips it right up).

Writes src/avatars/motions/drink-can.json (the game's motion format, src/avatars/motion.js `johansson-motion` v2: the
joints, the hands' shapes, the face's cues, the contacts the game keeps, the events, and the points it is checked by),
<out>/drink-can.blend, and with --sheet the contact sheets art/characters/body-kit/review/drink-can-*.jpg.
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
ap.add_argument('--out', default='output/drink-can')
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
subprocess.run(['node', 'tools/drink-kit.mjs', '--name', args.name, str(kitfile)], cwd=ROOT, check=True, capture_output=True)
K = json.loads(kitfile.read_text())
M = K['measure']
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
SHAPES = ('wrap', 'fist', 'hook')
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
    for s, expr in (('wrap', f'min(c/{CW:.4f},(1-c)/(1-{CW:.4f}))'), ('fist', f'max(0,(c-{CW:.4f})/(1-{CW:.4f}))'), ('hook', 'h')):
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
for cue in ('blink', 'breath', 'smile', 'lip', 'ring', 'fill', 'look', 'mouth', 'pocket'):
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
sock = K['socket']['R']
sq = gameQ(sock['quaternion'])                                             # the can in the hand's frame (game)
can_up, can_z = sq @ Vector((0, 1, 0)), sq @ Vector((0, 0, 1))
s_head = rest['handR'] + G2B(sock['position'])
bone('socket.R', s_head, s_head + G2B(can_up) * .06, 'handR', G2B(can_z))
h_head = rest['handL'] + G2B(K['hook']['L'])
bone('hook.L', h_head, h_head + Vector((0, 0, .02)), 'handL')
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


# ------------------------------------------------------------------ the can and its tab
import bmesh                                                                # noqa: E402
CAN = K['can']


def material(name, rgb, rough=.45, metal=.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    return m


def lathe(bm, profile, segs=32, y0=0):
    rings = []
    for r, y in profile:
        ring = [bm.verts.new((r * math.cos(2 * math.pi * i / segs), y, r * math.sin(2 * math.pi * i / segs))) for i in range(segs)]
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(segs):
            bm.faces.new((a[i], a[(i + 1) % segs], b[(i + 1) % segs], b[i]))
    return rings


def can_mesh(name, build, mat):
    bm = bmesh.new()
    build(bm)
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


# (the can's own frame: y up its axis, z toward its opening; as the game draws it)
# (the aluminium a mid silver-grey: the toon shading takes a light grey to white, and the lid and the base read as a white disc)
alu, label, dark = material('Aluminium', (.46, .48, .5), .35, 0), material('Print', (.13, .52, .44), .45, 0), material('Opening', (.12, .14, .12), .6, 0)
for mat in (alu, label, dark):
    H.toon(mat)
can = can_mesh('Can', lambda bm: lathe(bm, [(0, 0), (.027, 0), (.03, .004), (.031, .011), (.033, .016), (.033, .108), (.03, .117), (.029, .121), (0, .121)]), alu)
band = can_mesh('Can print', lambda bm: lathe(bm, [(.0332, .016), (.0332, .108)]), label)
band.parent = can


def ellipsoid(bm, r, at, scale, segs=16, rings=8):
    vs = []
    for j in range(rings + 1):
        t = math.pi * j / rings
        vs.append([bm.verts.new((at[0] + r * scale[0] * math.sin(t) * math.cos(2 * math.pi * i / segs), at[1] + r * scale[1] * math.cos(t),
                                 at[2] + r * scale[2] * math.sin(t) * math.sin(2 * math.pi * i / segs))) for i in range(segs)])
    for a, b in zip(vs, vs[1:]):
        for i in range(segs):
            bm.faces.new((a[i], a[(i + 1) % segs], b[(i + 1) % segs], b[i]))


def torus(bm, R, r, at, sz=1.0, segs=20, sides=6):
    vs = [[bm.verts.new((at[0] + (R + r * math.cos(2 * math.pi * k / sides)) * math.cos(2 * math.pi * i / segs), at[1] + r * math.sin(2 * math.pi * k / sides),
                         at[2] + (R + r * math.cos(2 * math.pi * k / sides)) * math.sin(2 * math.pi * i / segs) * sz)) for k in range(sides)] for i in range(segs)]
    for i in range(segs):
        for k in range(sides):
            bm.faces.new((vs[i][k], vs[(i + 1) % segs][k], vs[(i + 1) % segs][(k + 1) % sides], vs[i][(k + 1) % sides]))


rim = can_mesh('Can rim', lambda bm: torus(bm, .03, .0012, (0, .121, 0)), alu)
rim.parent = can
opening = can_mesh('Can opening', lambda bm: ellipsoid(bm, .006, (0, .121, .012), (1, .13, 1.65)), dark)
opening.parent = can
tab = can_mesh('Can tab', lambda bm: (ellipsoid(bm, .0068, (0, .121, .0115), (1, .2, 1.75)), torus(bm, .0075, .0017, (0, .1215, -.0075), 1.2)), alu)
# the can on the right hand's socket (the bone's frame is the can's: its y the can's axis, its z the opening's way)
can.parent, can.parent_type, can.parent_bone = rig, 'BONE', 'socket.R'
bpy.context.view_layer.update()
can.matrix_world = rig.matrix_world @ P['socket.R'].matrix
# the tab: on the can until it tears off, lifted about the tongue's front end (PIVOT) by its own turn (keyed); from the tear
# the same tab in the hooked forefinger (`Tab in hand`, on the hook.L bone, put where the can's was at the tear), the can's
# hidden; gone in the pocket. (Two objects, one shown at a time, rather than one with two Child Of constraints: the game
# does the same, the tab put into the left hand where it is when it tears.)
PIVOT = Vector(CAN['pivot'])
tab.parent = can
tab.rotation_mode = 'QUATERNION'
bpy.context.view_layer.update()

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


SOCKET = Matrix.Translation(Vector(sock['position'])) @ sq.to_matrix().to_4x4()      # the can in the hand (game)
UPRIGHT = Quaternion((0, 1, 0), math.pi)                                    # the can upright, its opening toward him


def can_turn(tilt, yaw=0.0, roll=0.0):
    """The can's turn in the body's frame: upright, its opening toward him, tipped `tilt` toward his face (its top toward
    him, its bottom up and away), turned `yaw` about the vertical and leant `roll` sideways."""
    return Quaternion((0, 1, 0), yaw) @ Quaternion((0, 0, 1), roll) @ Quaternion((1, 0, 0), -tilt) @ UPRIGHT


def hand_for(can_world):
    return can_world @ SOCKET.inverted()


def can_at(point, turn):
    return Matrix.Translation(Vector(point)) @ turn.to_matrix().to_4x4()


RIM = Vector((0, CAN['rim'] - .003, CAN['rimRadius']))                     # the rim at the opening's side, where the lip goes


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


# ---- the keys (seconds; the game's frame; the body's own lengths: M)
k = M['k']
TIMES = {}


def mark(name, t):
    TIMES[name] = t
    return t


# FK: the spine, the chest, the neck and the head (radians, game Euler XYZ: x pitches forward, y turns to his left, z leans)
BODY = [
    # t     spine            chest             neck             head
    (0.00, (0, 0, 0), (0, 0, 0), (0, 0, 0), (0, 0, 0)),
    (0.40, (.02, 0, 0), (.04, -.02, 0), (.06, -.02, 0), (.14, -.03, .02)),       # looks down at the can coming up
    (1.00, (.03, 0, 0), (.05, 0, 0), (.08, 0, 0), (.20, .02, .02)),              # at the ring
    (1.22, (.035, 0, 0), (.055, 0, 0), (.08, 0, 0), (.22, .02, .02)),            # a little closer before the tear
    (1.34, (.02, 0, 0), (.035, .01, 0), (.05, .01, 0), (.14, .04, 0)),           # the tear: a little jerk back
    (1.75, (.02, 0, 0), (.03, .06, 0), (.05, .06, 0), (.10, .16, -.02)),         # to the pocket: looks to his left
    (2.30, (0, 0, 0), (0, 0, 0), (.03, 0, 0), (.08, 0, 0)),                      # the can opened: looks at it, satisfied
    (2.70, (.02, 0, 0), (.03, 0, 0), (.05, 0, 0), (.14, -.03, 0)),               # anticipation: the dip, a glance at the can
    (3.05, (-.01, 0, 0), (-.02, 0, 0), (-.02, 0, 0), (-.02, 0, 0)),              # up to meet it
    (3.45, (-.02, 0, 0), (-.04, 0, 0), (-.05, 0, 0), (-.10, 0, 0)),              # contact
    (4.80, (-.045, 0, .01), (-.10, 0, 0), (-.145, 0, 0), (-.36, 0, 0)),          # deep: the head back (pushed a fifth past)
    (5.35, (-.02, 0, 0), (-.04, 0, 0), (-.05, 0, 0), (-.10, 0, 0)),              # release
    (5.58, (.01, 0, 0), (.02, 0, 0), (.0, 0, 0), (-.04, 0, 0)),                  # breath
    (5.72, (.015, 0, 0), (.025, 0, 0), (.01, 0, 0), (-.02, 0, 0)),               # a dip before the second pull
    (6.05, (-.02, 0, 0), (-.04, 0, 0), (-.06, 0, 0), (-.12, 0, 0)),              # second pull
    (7.10, (-.055, 0, .012), (-.13, 0, 0), (-.18, 0, 0), (-.44, 0, 0)),          # tipped right up (a tenth past real: further, the can's base meets his nose)
    (7.44, (-.05, 0, .01), (-.125, 0, 0), (-.175, 0, 0), (-.43, 0, 0)),           # held back till the can is off his lips
    (7.72, (-.015, 0, 0), (-.03, 0, 0), (-.03, 0, 0), (-.08, 0, 0)),             # release
    (7.86, (-.02, 0, -.006), (-.035, 0, 0), (-.035, 0, 0), (-.09, .02, 0)),      # "ahh": held, a touch up
    (8.24, (.035, 0, -.01), (.05, 0, 0), (.05, 0, 0), (.12, -.01, 0)),           # breath out, a nod (pushed a fifth past), once the can is down from his face
    (8.50, (-.004, 0, 0), (-.008, 0, 0), (0, 0, 0), (.024, 0, 0)),               # settle (overshoot)
    (8.98, (0, 0, 0), (0, 0, 0), (0, 0, 0), (.03, 0, 0)),
    # A sip (a resident drinking a can that is open, as the game's sips come: in two and a half seconds, from the waist)
    (9.00, (0, 0, 0), (0, 0, 0), (0, 0, 0), (.03, 0, 0)),
    (9.30, (.02, 0, 0), (.03, 0, 0), (.04, 0, 0), (.12, -.03, 0)),               # anticipation: a dip, a glance at it
    (9.65, (-.01, 0, 0), (-.02, 0, 0), (-.02, 0, 0), (-.02, 0, 0)),
    (9.95, (-.02, 0, 0), (-.03, 0, 0), (-.04, 0, 0), (-.08, 0, 0)),              # contact
    (10.55, (-.03, 0, 0), (-.06, 0, 0), (-.08, 0, 0), (-.18, 0, 0)),             # the sip: the head a little back
    (10.85, (-.01, 0, 0), (-.02, 0, 0), (-.02, 0, 0), (-.05, 0, 0)),             # release
    (11.15, (.02, 0, 0), (.03, 0, 0), (.03, 0, 0), (.08, 0, 0)),                 # a breath out, a nod
    (11.60, (-.005, 0, 0), (-.01, 0, 0), (0, 0, 0), (.02, 0, 0)),                # settle
    (12.00, (0, 0, 0), (0, 0, 0), (0, 0, 0), (.03, 0, 0)),
]
# (the drag: the root moves first and the hands last. Each pose's spine and chest are keyed eight frames (0.27 s) before
# the hands reach theirs and its neck and head four (0.13 s): the body starts each move and settles first, the head
# follows, the arm and the can after. The first and last poses of each part stay where they are.)
LEAD = {'spine': 4 / FPS, 'chest': 0.0, 'neck': 0.0, 'head': 0.0}         # (the root first; chest, head and upper arms with the pose)
FIXED = (0.0, 8.98, 9.0, 12.0)
# (but off the can the can goes first: the head comes down from a pull only as the can leaves the lips, or the face would
# come into the can's base, and holds the "ahh" with it; and the head looks down at the can coming up only after the eyes
# have, anticipation-mastery's "looks before moving")
HEAD_ON_TIME = (.40, 5.35, 7.10, 7.44, 7.72, 7.86, 8.24, 10.85)
for t, sp, ch, nk, hd in BODY:
    for n, e in (('spine', sp), ('chest', ch), ('neck', nk), ('head', hd)):
        key_fk(n, t if t in FIXED or (n in ('neck', 'head') and t in HEAD_ON_TIME) else max(0.0, t - LEAD[n]), e)
# swallows: a small dip of the chin at each gulp (the head's own keys between the deep ones)
for t0, t1, n in ((3.70, 4.70, 3), (6.20, 7.00, 3), (10.15, 10.55, 1)):
    for i in range(n):
        t = t0 + (t1 - t0) * (i + .5) / n
        scene.frame_set(F(t))
        q = P['head'].rotation_quaternion.copy()
        P['head'].rotation_quaternion = q @ gameE(.045, 0, 0)
        P['head'].keyframe_insert('rotation_quaternion', frame=F(t))
mark('drinkEnd', 8.98)
mark('drink', 2.45)
mark('sip', 9.0)
duration = mark('end', 12.0)
# the legs and the hips stay as the game stands or seats him; the shoulders and arms are the IK's
for n in ('hips', 'thighL', 'kneeL', 'footL', 'thighR', 'kneeR', 'footR'):
    key_fk(n, 0, (0, 0, 0))
    key_fk(n, duration, (0, 0, 0))

def pull(t0, t1, a0, a1, step=.1):
    """Keys every `step` seconds from t0 to t1 with the rim on the lip, the can tipped from a0 to a1 degrees, eased: a
    contact is kept, not left to the in-betweens."""
    n = max(1, round((t1 - t0) / step))
    out = []
    for i in range(n + 1):
        u = i / n
        a = math.radians(a0 + (a1 - a0) * (u * u * (3 - 2 * u)))
        out.append((t0 + (t1 - t0) * u, (lambda a: lambda t: at_lip(t, a))(a)))
    return out


# The can (right hand): held at his waist, brought to the lower chest to be opened, opened, then drunk.
WAIST = (-.09 * k, M['chestY'] - .12 * k, .17 * k)                            # in the body's frame (game), before the right hip
# (to be opened: brought in to his middle, in front of the lower breastbone and a little out from it, tipped a little toward
# the left hand and turned so the ring faces it: the left hand comes up to it from below with its elbow by his side, and
# nothing of the arm is between the tab and anyone looking at him)
LOWCHEST = (.01 * k, M['chestY'] + .01 * k, .25 * k)
OPEN_TURN = lambda dt=0.0: can_turn(.06 + dt, .35, -.12)
CANKEYS = [
    (0.00, lambda t: can_at(WAIST, can_turn(0, .25))),
    (0.15, lambda t: can_at(WAIST, can_turn(0, .25))),                                                # (still while the move blends in)
    (0.35, lambda t: can_at((-.05 * k, M['chestY'] - .06 * k, .22 * k), can_turn(-.04, .3))),         # on the way up (arc out)
    (0.60, lambda t: can_at(LOWCHEST, OPEN_TURN())),
    (1.15, lambda t: can_at((LOWCHEST[0], LOWCHEST[1] - .006 * k, LOWCHEST[2]), OPEN_TURN(-.01))),    # held against the pull
    (1.22, lambda t: can_at((LOWCHEST[0], LOWCHEST[1] - .014 * k, LOWCHEST[2] + .004 * k), OPEN_TURN(-.02))),  # the give: down together
    (1.38, lambda t: can_at((LOWCHEST[0], LOWCHEST[1] + .006 * k, LOWCHEST[2] - .004 * k), OPEN_TURN(.02))),  # the tear lets it rise
    (2.00, lambda t: can_at((-.03 * k, M['chestY'] - .02 * k, .21 * k), can_turn(.02, .15))),
    (2.45, lambda t: can_at((-.07 * k, M['chestY'] - .06 * k, .19 * k), can_turn(0, .15))),           # opened: at the waist
    (2.75, lambda t: can_at((-.07 * k, M['chestY'] - .085 * k, .18 * k), can_turn(-.06, .15))),       # anticipation: dips
    (3.10, lambda t: can_at((-.12 * k, M['chestY'] + .13 * k, .27 * k), can_turn(.35, .1))),          # the arc: out in front and up
    *pull(3.45, 4.80, 40, 75),                                                                      # contact, then deep
    *pull(4.80, 5.10, 75, 73, .05),                                                                      # the last swallow of it
    (5.35, lambda t: at_lip(t, math.radians(32), away=.03 * k, down=.01 * k)),                       # release (a beat: not snatched away)
    (5.58, lambda t: at_lip(t, math.radians(18), away=.06 * k, down=.04 * k)),                       # a breath
    (5.72, lambda t: Matrix.Translation((0, -.025 * k, .008 * k)) @ at_lip(5.58, math.radians(16), away=.06 * k, down=.04 * k)),  # anticipation: a dip, down
    (5.90, lambda t: at_lip(t, math.radians(42), away=.035 * k, down=.012 * k, side=-.04 * k)),     # breakdown: in on an arc from his right
    *pull(6.05, 7.10, 58, 93),                                                                     # the second pull: the last of it
    *pull(7.10, 7.40, 93, 91, .05),
    (7.52, lambda t: at_lip(t, math.radians(76), away=.026 * k, down=0, side=-.03 * k)),                            # off the lips first (not tipped down against them), then down
    (7.72, lambda t: at_lip(t, math.radians(40), away=.068 * k, down=0)),                            # release: off the lip, into the "ahh"
    (7.86, lambda t: at_lip(t, math.radians(39), away=.07 * k, down=0)),                              # "ahh": held off his lips (with his head)
    (8.06, lambda t: at_lip(t, math.radians(36), away=.08 * k, down=-.02 * k)),                      # anticipation: a touch up
    (8.30, lambda t: can_at((-.13 * k, M['chestY'] + .12 * k, .26 * k), can_turn(.2, .05))),         # down, the arc out
    (8.48, lambda t: can_at((-.14 * k, M['chestY'] - .04 * k, .21 * k), can_turn(.05, .12))),
    (8.66, lambda t: can_at((-.08 * k, M['chestY'] - .138 * k, .17 * k), can_turn(-.03, .25))),      # past the waist, then a long soft settle
    (8.98, lambda t: can_at(WAIST, can_turn(0, .25))),
    (9.00, lambda t: can_at(WAIST, can_turn(0, .25))),
    (9.30, lambda t: can_at((-.09 * k, M['chestY'] - .135 * k, .175 * k), can_turn(-.05, .25))),     # anticipation: dips
    (9.65, lambda t: can_at((-.14 * k, M['chestY'] + .12 * k, .2 * k), can_turn(.3, .1))),           # the arc: out and up
    *pull(9.95, 10.55, 40, 55),                                                                     # contact, the sip
    (10.85, lambda t: at_lip(t, math.radians(25), away=.035 * k, down=.015 * k)),                    # release
    (11.20, lambda t: can_at((-.13 * k, M['chestY'] + .03 * k, .2 * k), can_turn(.08, .1))),          # down, the arc out
    (11.60, lambda t: can_at((-.075 * k, M['chestY'] - .135 * k, .17 * k), can_turn(-.04, .25))),    # settles past the waist
    (12.00, lambda t: can_at(WAIST, can_turn(0, .25))),
]
# The right elbow (its pole): down and out at the waist, out and up as the can goes up to the mouth.
POLES_R = [(9.0, (-.45, .75, -.2)), (9.65, (-.7, 1.05, .1)), (10.2, (-.75, 1.1, .2)), (11.2, (-.6, .9, 0)), (12.0, (-.45, .75, -.2)),
           (0.0, (-.45, .75, -.2)), (0.55, (-.5, .9, -.1)), (2.45, (-.45, .75, -.2)), (3.10, (-.7, 1.05, .1)),
           (3.45, (-.75, 1.1, .2)), (4.80, (-.8, 1.2, .25)), (5.55, (-.7, 1.0, .1)), (7.10, (-.85, 1.25, .3)), (8.1, (-.6, .9, 0)), (8.98, (-.45, .75, -.2))]
# The left hand: at his side, then over the can, its forefinger hooked under the ring; the ring lifted; the tab torn off and
# drawn up and away; to the pocket; back to his side.
# (the left hand at rest as the game's own arm hangs (animate.js: the elbow a little bent, -0.4 rad about its x), not
# straight down at full stretch, where the IK's elbow snaps from bent to straight in a frame, and from where the motion
# would blend out to a bent arm the long way)
REST_TURN = Quaternion((0, 0, 1), .1) @ Quaternion((1, 0, 0), -.4)
LEFT_REST = tuple(Vector(K['bones']['elbowL']) + Quaternion((1, 0, 0), -.4) @ (Vector(K['bones']['handL']) - Vector(K['bones']['elbowL'])))
CLOSE = {'R': [(0, .4), (.15, K['hand']['wrapAt'] * 1.0), (12.0, K['hand']['wrapAt'])], 'L': [(0, 0), (12.0, 0)]}
HOOK_L = [(0, 0), (.55, 0), (.93, 1), (1.98, 1), (2.16, .3), (2.5, 0), (12.0, 0)]        # (closing on the ring four frames after the hand is there)
LOOK = [(0, 0), (.1, .35), (1.6, .35), (1.72, .1), (2.2, .3), (2.75, .4), (2.95, 0), (9.1, 0), (9.3, .35), (9.55, 0), (12.0, 0)]
BLINK = [(0, 0), (3.6, 0), (3.85, 1), (4.95, 1), (5.15, 0), (6.05, 0), (6.25, 1), (7.25, 1), (7.45, 0), (10.05, 0), (10.2, 1), (10.6, 1), (10.75, 0), (12.0, 0)]
BREATH = [(0, 0), (5.3, 0), (5.48, .8), (5.72, 0), (7.8, 0), (8.05, 1), (8.5, .2), (8.98, 0), (10.85, 0), (11.05, .6), (11.4, 0), (12.0, 0)]
SMILE = [(0, 0), (2.2, .4), (2.6, 0), (7.8, 0), (8.12, 1), (8.98, .6), (9.0, 0), (10.9, 0), (11.2, .5), (12.0, .3)]
LIPW = [(0, 0), (3.25, 0), (3.46, 1), (5.10, 1), (5.25, 0), (5.88, 0), (6.05, 1), (7.40, 1), (7.58, 0), (9.78, 0), (9.96, 1), (10.55, 1), (10.65, 0), (12.0, 0)]
POCKETW = [(0, 0), (1.66, 0), (1.95, 1), (2.02, 1), (2.16, 0), (12.0, 0)]
# (the right wrist from his own lips while the can is near them, the "ahh" too)
MOUTHW = [(0, 0), (2.75, 0), (3.45, 1), (8.10, 1), (8.45, 0), (9.3, 0), (9.95, 1), (10.85, 1), (11.3, 0), (12.0, 0)]
RINGW = [(0, 0), (.76, 0), (.80, 1), (1.31, 1), (1.34, 0), (12.0, 0)]        # (on through the tear: the tab comes off where the finger holds it)
FILL = [(0, 1), (3.55, 1), (4.95, .45), (6.35, .45), (7.25, 0), (8.98, 0), (9.0, 1), (12.0, 1)]
# (the eyes go first: the head turns to what they look at five frames after them, anticipation-mastery's "looks before
# moving")
HEAD_LOOK = [(t if t == 0 else t + 5 / FPS, v) for t, v in LOOK]
for name, keys_ in (('hookL', HOOK_L), ('look', LOOK), ('headLook', HEAD_LOOK), ('blink', BLINK), ('breath', BREATH), ('smile', SMILE), ('lip', LIPW), ('ring', RINGW), ('fill', FILL), ('mouth', MOUTHW), ('pocket', POCKETW)):
    for t, v in keys_:
        key_prop(name, t, v)
for side, keys_ in CLOSE.items():
    for t, v in keys_:
        key_prop('close' + side, t, v)
mark('tabOff', 1.30)
mark('tabPocketed', 2.00)
for t, p in POLES_R:
    key_at('pole.R', t, (p[0] * k, p[1] * k, p[2] * k))
# the look target: the can while it is opened and in the glance before the drink, ahead after
scene.frame_set(1)

frames = range(1, F(duration) + 1)
# Breathing (secondary, straight ahead on the keys): the chest rising and falling on a 4.8 s cycle (the calm register's
# 4-6 s), 0.006 rad; keyed on every frame before the can is keyed to the lip and the arms are baked, so the hands stay where they were put.
BREATH_RAD, BREATH_S = .006, 4.8
chest_q = []
for f in frames:
    scene.frame_set(f)
    chest_q.append(game_local('chest'))
for f, q in zip(frames, chest_q):
    q = q @ Quaternion((1, 0, 0), BREATH_RAD * math.sin(2 * math.pi * (f - 1) / FPS / BREATH_S))
    R = rig.data.bones['chest'].matrix_local.to_quaternion()
    P['chest'].rotation_quaternion = R.inverted() @ Aq @ q @ Aq.inverted() @ R
    P['chest'].keyframe_insert('rotation_quaternion', frame=f)

# The can's keys, after the head's (the lip moves with it).
for t, f in CANKEYS:
    key_pose('ik.R', t, hand_for(f(t)), 'handR')
# the look target follows the can's top where the head looks at it
for t in (0, .2, .55, 1.0, 1.3, 1.9, 2.3, 2.75, 3.0, 8.98, 9.1, 9.3, 9.55, 12.0):
    scene.frame_set(F(t))
    top = Matrix(can.matrix_world) @ Vector((0, CAN['rim'], 0))
    key_at('look', t, B2G(top) if t < 3.0 or 9.1 <= t < 9.6 else B2G(rest['head'] + Vector((0, -.8, .1))))

# The tab: lifted about its front end, then off with the left hand from the tear.
RING = Vector(CAN['ring'])


def ring_world(t, lift):
    scene.frame_set(F(t))
    m = Matrix(can.matrix_world)
    turn = Matrix.Rotation(lift, 4, 'X')
    local = PIVOT + (turn @ (RING - PIVOT).to_4d()).to_3d()
    return m @ local


LIFT = [(0, 0), (.93, 0), (1.12, .5), (1.22, .44), (1.30, .55)]          # (lifted; a little give, the anticipation; torn)
for t, a in LIFT:
    tab.rotation_quaternion = Quaternion((1, 0, 0), a)
    tab.location = PIVOT - Quaternion((1, 0, 0), a) @ PIVOT
    tab.keyframe_insert('rotation_quaternion', frame=F(t))
    tab.keyframe_insert('location', frame=F(t))
HOOK = Vector(K['hook']['L'])
SHOULDER_L = Vector(K['bones']['shoulderL'])


def over_way(f, pitch):
    """The left hand's turn coming over the can: the palm down, the fingers on along `f` (the forearm's way, level), dipped
    `pitch` toward what they reach for (so the wrist bends down, not sideways); the thumb toward him."""
    f = Vector((f.x, 0, f.z)).normalized()
    f = (f * math.cos(pitch) + Vector((0, -math.sin(pitch), 0))).normalized()        # the fingers' way
    y = -f                                                                  # (the wrist behind them)
    x = Vector((0, 1, 0))
    x = (x - y * x.dot(y)).normalized()                                     # the back of the hand up (the palm, the left's -x, down)
    return Matrix((x, y, x.cross(y))).transposed().to_quaternion()


def over(point, pitch=.35):
    """Over `point` from the left shoulder: a first guess at the forearm's way (along_forearm takes the IK's own after)."""
    return over_way(Vector(point) - SHOULDER_L, pitch)


def left_for(point, turn=None):
    """The left hand placed so its hooked forefinger's pad is at `point` (game), turned `turn` (over it, unless said)."""
    turn = turn or over(point)
    return Matrix.Translation(Vector(point) - turn @ HOOK) @ turn.to_matrix().to_4x4()


ring_at = lambda t, a: B2G(rig.matrix_world.inverted() @ ring_world(t, a)) if False else B2G(ring_world(t, a))
def bone_point(name, p, t=None):
    """A point in a bone's own frame (the game's axes; build.js's places on the body are), where it is at time t (game)."""
    if t is not None:
        scene.frame_set(F(t))
    m = rig.matrix_world @ P[name].matrix
    return B2G(m.to_translation() + (m.to_quaternion() @ rig.data.bones[name].matrix_local.to_quaternion().inverted() @ Aq) @ Vector(p))


pocket = lambda t: bone_point('chest', K['pocket']['position'], t)
# (how far the fingers point down to the lid: steeply while the forefinger is hooked in the ring, so the other fingers, easy,
# stay above the lid and the forefinger is the one under the ring)
# The left hand comes up from below with the elbow by his side, the forearm up and across to the can; the forefinger hooks
# the ring from his side of it, the hand's back up; the lift is the wrist bending back (BEND: how far the fingers are bent
# down from the forearm's line, radians; less than nothing is the wrist bent back), a little give before the tear; the tab
# torn off up and back toward him; then to the pocket with the elbow out at his side and a little forward, the hand coming
# down into it from above, the fingertips pointing into its mouth.
BEND = {.45: .2, .68: .3, .8: .45, .9: .55, 1.12: -.15, 1.22: -.02, 1.3: -.25, 1.38: -.1, 1.46: .05, 1.56: .1, 1.66: .15, 1.8: .9, 1.95: 1.0, 2.02: 1.0}
REST = lambda dx=0.0, dy=0.0, dz=0.0: Matrix.Translation(Vector(LEFT_REST) + Vector((dx * k, dy * k, dz * k))) @ REST_TURN.to_matrix().to_4x4()
MID = lambda a, b, u, off: Vector(a).lerp(Vector(b), u) + Vector(off) * k
LEFT = [
    (0.00, lambda t: REST()),
    (0.20, lambda t: REST(.016, .004, -.024)),                                                                             # anticipation: out and back (not down: the arm would go straight)
    (0.45, lambda t: left_for(MID(LEFT_REST, ring_at(.8, 0), .5, (.05, -.035, -.01)), over(ring_at(t, 0), .2))),            # breakdown: out and under, the arc
    (0.68, lambda t: left_for(Vector(ring_at(t, 0)) + Vector((.03 * k, -.02 * k, .01 * k)), over(ring_at(t, 0), .3))),      # coming up to it
    (0.80, lambda t: left_for(Vector(ring_at(t, 0)) + Vector((0, -.002 * k, 0)), over(ring_at(t, 0), .45))),                # the forefinger under the ring
    (0.90, lambda t: left_for(Vector(ring_at(t, 0)) + Vector((0, -.003 * k, 0)), over(ring_at(t, 0), .55))),                # the wrist down a touch before the lift
    (1.12, lambda t: left_for(ring_at(t, .5), over(ring_at(t, .5), .1))),                                                   # lifted, the wrist back
    (1.22, lambda t: left_for(ring_at(t, .44), over(ring_at(t, .44), .2))),                                                 # the give: the tear's anticipation
    (1.30, lambda t: left_for(ring_at(t, .55), over(ring_at(t, .55), 0))),                                                  # torn off
    (1.38, lambda t: left_for(MID(ring_at(1.3, .55), Vector(ring_at(1.3, .55)) + Vector((.04 * k, .065 * k, .02 * k)), .5, (-.005, .006, -.018)), over(ring_at(1.3, .55), 0))),  # peeled back toward him on the way up
    (1.46, lambda t: left_for(Vector(ring_at(1.3, .55)) + Vector((.04 * k, .065 * k, .02 * k)), over(ring_at(1.3, .55), .05))),  # follow-through: up and out, past
    (1.56, lambda t: left_for(Vector(ring_at(1.3, .55)) + Vector((.038 * k, .06 * k, .021 * k)), over(ring_at(1.3, .55), .1))),  # settles back
    (1.66, lambda t: left_for(Vector(ring_at(1.3, .55)) + Vector((.045 * k, .055 * k, .035 * k)), over(ring_at(1.3, .55), .15))),  # anticipation: out from him, before the pocket
    (1.80, lambda t: left_for(Vector(pocket(t)) + Vector((0, .025 * k, .015 * k)), over(pocket(t), 1.0))),               # over the pocket
    (1.95, lambda t: left_for(Vector(pocket(t)) + Vector((0, -.002 * k, .003 * k)), over(pocket(t), 1.1))),              # at its mouth
    (2.02, lambda t: left_for(Vector(pocket(t)) + Vector((0, -.008 * k, .002 * k)), over(pocket(t), 1.1))),              # in it
    (2.16, lambda t: left_for(Vector(pocket(t)) + Vector((.01 * k, .025 * k, .02 * k)), over(pocket(t), .9))),           # out of it, up (anticipation of the way down)
    (2.55, lambda t: REST(.0015, -.003, -.003)),                                                                            # down past where it hangs
    (3.05, lambda t: REST()),                                                                                              # settles, long and soft
    # (while he drinks, alive and second to the can: a little out from his side as the right arm goes up, easy while he
    # swallows, a little lift with the breath, back as the can comes down)
    (3.35, lambda t: REST(.016, .01, -.008)),
    (4.70, lambda t: REST(.01, .004, -.004)),
    (5.60, lambda t: REST(.006, .01, .002)),
    (7.05, lambda t: REST(.018, .012, -.01)),
    (8.15, lambda t: REST(.004, .006, .004)),
    (8.98, lambda t: REST()),
    (12.0, lambda t: REST()),
]
# (the elbow: down by his side for the opening, out and a little forward and up for the pocket)
POLES_L = [(0.0, (.45, .75, -.2)), (.45, (.55, .55, -.05)), (1.56, (.6, .6, -.05)), (1.8, (.8, 1.0, .3)), (2.02, (.8, 1.0, .3)),
           (2.45, (.45, .75, -.2)), (12.0, (.45, .75, -.2))]
for t, p in POLES_L:
    key_at('pole.L', t, (p[0] * k, p[1] * k, p[2] * k))
for t, f in LEFT:
    key_pose('ik.L', t, f(t), 'handL')
# The elbows: each pole turned about the line from the shoulder to the wrist, as little as will do, until the wrist is within
# what a wrist does (its bend and its turn to either side; its own twist the forearm takes, the bake below): the animator's
# elbow, where it can be, is kept.
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
def along_forearm(t, bend=.35):
    """The left hand turned on along its forearm as the IK has it at t, the back of the hand up, the fingers bent `bend` down
    from the forearm's line (less than nothing: the wrist bent back)."""
    scene.frame_set(F(t))
    f = (Vector(B2G((rig.matrix_world @ P['handL'].matrix).to_translation())) - Vector(B2G((rig.matrix_world @ P['elbowL'].matrix).to_translation()))).normalized()
    down = Vector((0, -1, 0)) - f * -f.y
    down = down.normalized() if down.length > 1e-6 else Vector((0, 0, 1))
    fingers = (f * math.cos(bend) + down * math.sin(bend)).normalized()
    y = -fingers
    x = Vector((0, 1, 0))
    x = (x - y * x.dot(y)).normalized()
    return Matrix((x, y, x.cross(y))).transposed().to_quaternion()


for _ in range(2):                                                         # (the forearm moves with the hand's turn: twice over)
    for t, f in LEFT:
        if round(t, 2) in BEND:
            point = f(t) @ HOOK
            key_pose('ik.L', t, left_for(point, along_forearm(t, BEND[round(t, 2)])), 'handL')
every = lambda t0, t1, dt=.2: [t0 + dt * i for i in range(int((t1 - t0) / dt) + 1)]
settle_poles('R', sorted(set([round(t, 3) for t, _ in CANKEYS] + every(0, duration, .1))))
settle_poles('L', sorted(set([round(t, 3) for t, _ in LEFT] + every(0, 2.6, .1))))


# the tab: in the hook from the tear, where it was on the can then; gone in the pocket
scene.frame_set(F(TIMES['tabOff']))
held = can_mesh('Tab in hand', lambda bm: (ellipsoid(bm, .0068, (0, .121, .0115), (1, .2, 1.75)), torus(bm, .0075, .0017, (0, .1215, -.0075), 1.2)), alu)
held.parent, held.parent_type, held.parent_bone = rig, 'BONE', 'hook.L'
bpy.context.view_layer.update()
held.matrix_world = Matrix(tab.matrix_world)
for ob, shown in ((tab, ((0, True), (TIMES['tabOff'] - 1 / FPS, True), (TIMES['tabOff'], False))),
                  (held, ((0, False), (TIMES['tabOff'] - 1 / FPS, False), (TIMES['tabOff'], True), (TIMES['tabPocketed'], True), (TIMES['tabPocketed'] + 1 / FPS, False)))):
    for t, v in shown:
        ob.hide_render = ob.hide_viewport = not v
        ob.keyframe_insert('hide_render', frame=F(t))
        ob.keyframe_insert('hide_viewport', frame=F(t))
for t, v in ((0, True), (TIMES['tabOff'] - 1 / FPS, True), (TIMES['tabOff'], False)):
    opening.hide_render = opening.hide_viewport = v
    opening.keyframe_insert('hide_viewport', frame=F(t))
    opening.keyframe_insert('hide_render', frame=F(t))
# every key eased (auto-clamped Bezier), the hide keys held
for ob in (rig, tab, held, opening):
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
    contacts.append({c: float(rig[c]) for c in ('lip', 'mouth', 'ring', 'pocket')})
# The hands drag (follow-through, the tertiary level): each hand's turn at the wrist DRAG frames behind its forearm's, so
# it starts after the arm and goes on after the arm has stopped; not while it holds a contact (the rim at the lip, the
# finger on the ring, the tab at the pocket), where the turn is what puts it there.
DRAG = 4
# (and the forearm after the upper arm: the elbow's turn half of the way to where it was three frames before, off contacts.
# All of three frames made the hand's paths lose their arcs and the can fling at 107 mm a frame.)
for side, held_by in (('R', ('lip', 'mouth')), ('L', ('ring', 'pocket'))):
    for part, lag, much in (('elbow', 3, .5), ('hand', DRAG, 1.0)):
        late = [p[part + side].copy() for p in baked]
        for i, f in enumerate(frames):
            free = 1 - max(contacts[i][c] for c in held_by)
            baked[i][part + side] = late[i].slerp(late[max(0, i - lag)], much * max(0.0, min(1.0, free)))
for pb in P:
    for c in pb.constraints:
        if c.type in ('IK', 'COPY_ROTATION'):
            c.mute = True
for n in ('shoulderL', 'elbowL', 'handL', 'shoulderR', 'elbowR', 'handR'):
    fc = [c for c in (rig.animation_data.action.fcurves if hasattr(rig.animation_data.action, 'fcurves') else []) if c.data_path == f'pose.bones["{n}"].rotation_quaternion']
    for f, pose in zip(frames, baked):
        set_game_local(n, pose[n])
        P[n].keyframe_insert('rotation_quaternion', frame=f)

cues = ('closeR', 'closeL', 'hookL', 'hookR', 'blink', 'breath', 'smile', 'look', 'lip', 'ring', 'fill', 'mouth', 'pocket')
reach = {'R': [], 'L': [], 'mouth': []}
times, joints, tracks, verify = [], {n: [] for n in JOINTS}, {c: [] for c in cues + ('tab',)}, {'rim': [], 'lip': [], 'canUp': [], 'hook': [], 'ringAt': [], 'pocket': [], 'wrist': {'R': [], 'L': []}}
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
        tracks[c].append(round(float(rig[c]), 4))
    tracks['tab'].append(round(min(1, tab.rotation_quaternion.angle / .55), 4) if f < F(TIMES['tabOff']) else 1.0)
    # (each wrist in the chest's frame, in his sizes (k): where any body's hands go, in its own sizes)
    chest = rig.matrix_world @ P['chest'].matrix
    cq = chest.to_quaternion() @ rig.data.bones['chest'].matrix_local.to_quaternion().inverted() @ Aq
    for side in 'RL':
        w = (rig.matrix_world @ P['hand' + side].matrix).to_translation()
        local = cq.inverted() @ (w - chest.to_translation())
        reach[side] += [round(c / M['k'], 4) for c in local]                  # (cq takes the game's axes into Blender's)
    # (and the right wrist from the lower lip, in the head's frame: where it is as the can goes to the mouth, which on a
    # bigger head is further out)
    head = rig.matrix_world @ P['head'].matrix
    hq = head.to_quaternion() @ rig.data.bones['head'].matrix_local.to_quaternion().inverted() @ Aq
    wr = (rig.matrix_world @ P['handR'].matrix).to_translation()
    reach['mouth'] += [round(c / M['k'], 4) for c in hq.inverted() @ (wr - head_point(K['lip']['lower']))]
    cm = Matrix(can.matrix_world)
    verify['rim'].append(g3(cm @ RIM))
    verify['lip'].append(g3(head_point(K['lip']['lower'])))
    verify['canUp'].append([round(c, 4) for c in B2G((cm.to_quaternion() @ Vector((0, 1, 0))))])
    verify['hook'].append(g3((WM @ P['hook.L'].matrix).to_translation()))
    verify['ringAt'].append(g3(Matrix((tab if f < F(TIMES['tabOff']) else held).matrix_world) @ RING))
    verify['pocket'].append([round(c, 5) for c in bone_point('chest', K['pocket']['position'])])
    for side in 'RL':
        e = game_local('hand' + side).to_euler('ZYX')
        verify['wrist'][side].append([round(e.x, 4), round(e.y, 4), round(e.z, 4)])
# (the body from the waist up: the legs and the hips stay as the game stands or seats him, so the one motion is drunk
# standing or sitting)
UPPER = ('spine', 'chest', 'neck', 'head', 'shoulderL', 'elbowL', 'handL', 'shoulderR', 'elbowR', 'handR')
motion = {'format': 'johansson-motion', 'version': 2, 'name': 'Opens a can and drinks it', 'fps': FPS, 'by': f'tools/blender/drink-can.py ({args.name})',
          'times': times, 'joints': {n: joints[n] for n in UPPER},
          'shapes': {c: tracks[c] for c in ('closeR', 'closeL', 'hookL', 'hookR')},
          'face': {c: tracks[c] for c in ('blink', 'breath', 'smile', 'look')},
          'prop': {'tab': tracks['tab']},
          'reach': reach,
          'contact': {'lip': tracks['lip'], 'ring': tracks['ring'], 'mouth': tracks['mouth'], 'pocket': tracks['pocket']},
          'fill': tracks['fill'],
          'events': [{'t': TIMES['tabOff'], 'name': 'tabOff'}, {'t': TIMES['tabPocketed'], 'name': 'tabPocketed'}],
          'markers': {'drink': TIMES['drink'], 'drinkEnd': TIMES['drinkEnd'], 'sip': TIMES['sip']},
          'props': {'can': {'bone': 'handR', 'socket': 'can'}, 'tab': {'bone': 'handL', 'at': 'hook'}}}
# (a module, so the game has it without fetching it, and its build bundles it; the points it is checked by beside its test)
target = ROOT / 'src/avatars/motions/drink-can.js'
target.write_text('// Written by tools/blender/drink-can.py (Blender: the rig, the keys and the bake are there); the game\'s motion format,\n'
                  '// src/avatars/motion.js `johansson-motion` v2. Do not edit: animate it there and export it again.\n'
                  'export default ' + json.dumps(motion, separators=(',', ':')) + ';\n')
(ROOT / 'tests/drink-can.verify.json').write_text(json.dumps({'name': args.name, 'times': times, 'lipWeight': tracks['lip'], 'ringWeight': tracks['ring'], **verify}, separators=(',', ':')) + '\n')
err = [((Vector(r) - Vector(l)).length, t) for r, l, w, t in zip(verify['rim'], verify['lip'], tracks['lip'], times) if w > .99]
print('rim to lip at contact: max %.1f mm, mean %.1f mm over %d frames' % (max(e for e, _ in err) * 1000, sum(e for e, _ in err) / len(err) * 1000, len(err)))
herr = [((Vector(h) - Vector(r)).length, t) for h, r, w, t in zip(verify['hook'], verify['ringAt'], tracks['ring'], times) if w > .99]
if herr:
    print('hook to ring while hooked: max %.1f mm' % (max(e for e, _ in herr) * 1000))
perr = [((Vector(h) - Vector(p)).length, t) for h, p, w, t in zip(verify['hook'], verify['pocket'], tracks['pocket'], times) if w > .99]
if perr:
    print('hook to pocket while in it: max %.1f mm (at %.2f s)' % (max(perr)[0] * 1000, max(perr)[1]))
for side in 'RL':
    sg = 1 if side == 'R' else -1
    worst = 0
    for e in verify['wrist'][side]:
        for i, (lo, hi) in enumerate(WRIST):
            v = e[i] if i == 0 or sg > 0 else -e[i]
            worst = max(worst, lo - v, v - hi)
    print('wrist %s: furthest past its limits %.3f rad' % (side, worst))
print('wrote', target, len(times), 'samples', flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'drink-can.blend'), compress=True)

# ------------------------------------------------------------------ contact sheets
if args.sheet or args.frames:
    picks = [float(x) for x in args.frames.split(',')] if args.frames else [0, .2, .55, .9, 1.22, 1.38, 1.8, 2.0, 2.75, 3.1, 3.45, 4.8, 5.7, 7.1, 7.8, 8.45]
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
    for view, (dx, dy) in views.items():
        close = view == 'opening'
        # (and, from the front and the three-quarter, the story poses again as black silhouettes: staging-mastery's test)
        story = [.9, 1.38, 1.95, 2.45, 3.45, 4.8, 7.1, 7.8] if view in ('front', 'three-quarter') else []
        for t, silhouette in [(t, False) for t in ([.2, .45, .68, .8, .9, 1.12, 1.22, 1.3, 1.38, 1.46, 1.66, 1.8, 1.95, 2.02, 2.16, 2.47] if close else picks)] + [(t, True) for t in story]:
            scene.frame_set(F(t))
            aim = Vector((0, 0, M['chestY'] + (.12 if close else .3) * k))
            cam.location = aim + Vector((dx, dy, 0)) * (.85 if close else 1.9) + Vector((0, 0, .25 if close else .12))
            cam.rotation_euler = (aim - cam.location).to_track_quat('-Z', 'Y').to_euler()
            scene.render.filepath = str(shots / f'{view}-{F(t):03d}{"-s" if silhouette else ""}.png')
            scene.render.film_transparent = silhouette                    # (the figure alone, on nothing)
            bpy.ops.render.render(write_still=True)
            scene.render.film_transparent = False
            if silhouette:
                # (black wherever the figure is, white where it is not: its alpha, turned over)
                shape = str(shots / f'{view}-{F(t):03d}-silhouette.png')
                subprocess.run(['convert', scene.render.filepath, '-alpha', 'extract', '-threshold', '50%', '-negate', shape], check=True)
                files.append((view, t, shape, 'silhouette'))
            else:
                files.append((view, t, scene.render.filepath, ''))
        print('rendered', view, flush=True)
    for view in views:
        sheet = ROOT / f'art/characters/body-kit/review/drink-can-{view}.jpg'
        cmd = ['montage'] + [x for v, t, f, tag in files if v == view for x in ('-label', f'{t:.2f} s' + (f' {tag}' if tag else ''), f)] + ['-tile', '8x', '-geometry', '+2+2', '-pointsize', '14', str(OUT / f'sheet-{view}.png')]
        subprocess.run(cmd, check=True)
        subprocess.run(['convert', str(OUT / f'sheet-{view}.png'), '-quality', '82', str(sheet)], check=True)
        print('sheet', sheet, flush=True)
