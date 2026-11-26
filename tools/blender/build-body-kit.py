"""The modular body kit, sculpted in Blender: limbs, torso lines, a bare foot and the shoes that go on it.

  python tools/blender/build-body-kit.py --root .        (bpy 5.x from pip; or blender -b --python ... --)

The owner, 26 November 2026: "can you redraw Johansson and Thuan's body's in blender too? And arms and legs? The shoes
shouldn't be fused on their feet they should be rigged so you can wear different shoes, these bodies needs to be modular so
we can reuse them for all characters"; and of Thuan: "Make her look more feminine and cute in the body too but still cartoon".

The game's body is one skinned mesh the generator builds for each resident from their measures (src/avatars/build.js): a
torso turned on a lathe, limbs, mittens, feet. This kit is the shapes those are built from, so one kit serves everybody:

- LIMBS   an arm and a leg for each frame (standard, sturdy, graceful): how thick the limb is at each point along it and
          round it, as a share of the plain taper the generator used to draw. A shoulder that is round, a biceps, an elbow,
          a forearm and a wrist; a thigh, a knee, a calf at the back and a shin at the front, an ankle. Never thicker than
          the taper, so every sleeve, trouser leg and pose that fitted the old limb fits this one.
- TORSO   the line the torso is turned from: from the waist up for the sturdy frame, the whole of it for the graceful one.
- FEET    one mesh layout (FEET.index) in several shapes: a bare foot, a sneaker, a leather shoe, a boot's foot, a
          slipper. Because every shape has the same points in the same order, a shoe is put on, changed or taken off a
          finished body by writing another shape into the foot's points (build.js wearShoes): the shoes are worn, not fused.
          Each point says what it is part of (FEET.zones: upper, sole, toe cap, collar) for its colour.
          Shapes are in a unit box: x -1..1 across (the left foot; the right is its mirror), y 0 (the floor) .. 1,
          z -1 (heel) .. 1 (toe).

- NOSES   a nose for each of the creator's nose styles that used to be a ball stuck on the face (button, snub, bulb, wide,
          hook, pointed, ridge, and a small soft one for the drawn dots and line): a bridge, a tip and wings as a height
          over a small patch (x -1..1 across, y -1 the top .. 1 under the tip), with how wide, long and deep it is. The
          generator lays it on anybody's face where their nose is (build.js kitNose): everybody keeps the nose that is
          theirs, as a nose.

Each is a mesh made and smoothed in Blender (saved in art/characters/body-kit/body-kit.blend) and read back point by
point. Writes src/avatars/sculpts/body-kit.js.
"""
import argparse
import base64
import json
import math
import sys
from pathlib import Path

import bpy
import bmesh
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument('--root', default='.')
args = ap.parse_args(argv)
ROOT = Path(args.root).resolve()
ART = ROOT / 'art/characters/body-kit'
ART.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.system = 'METRIC'


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def bell(x, s):
    return np.exp(-(x / s) ** 2)


def grid_mesh(name, points, rows, cols, closed_ends=True, at=(0, 0, 0)):
    """A tube of rows x cols points (each row a ring), its ends closed by a pole each; returns the object."""
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in points.reshape(-1, 3)]
    for r in range(rows - 1):
        for c in range(cols):
            a, b = r * cols + c, r * cols + (c + 1) % cols
            bm.faces.new((vs[a], vs[b], vs[b + cols], vs[a + cols]))
    if closed_ends:
        for r, flip in ((0, False), (rows - 1, True)):
            ring = [vs[r * cols + c] for c in range(cols)]
            pole = bm.verts.new(np.mean(points[r], axis=0))
            for c in range(cols):
                tri = (pole, ring[c], ring[(c + 1) % cols]) if flip else (pole, ring[(c + 1) % cols], ring[c])
                bm.faces.new(tri)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = at
    bpy.context.collection.objects.link(obj)
    for p in mesh.polygons:
        p.use_smooth = True
    return obj


def melt(obj, iterations=2, factor=.5):
    """Blender's smoothing, applied: the mesh, not the formula, is what is kept."""
    m = obj.modifiers.new('melt', 'SMOOTH')
    m.factor, m.iterations = factor, iterations
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=m.name)
    co = np.empty(len(obj.data.vertices) * 3)
    obj.data.vertices.foreach_get('co', co)
    return co.reshape(-1, 3)


# ============================================================================ limbs
NT, NA = 25, 16            # along the limb (0 the shoulder or hip, 1 the wrist or ankle), round it (0 the front, a quarter to their left)


def limb_shape(kind, frame, t, a):
    """How thick, as a share of the plain taper: t along, a round (radians, 0 the front)."""
    front, back, side = np.cos(a), -np.cos(a), np.abs(np.sin(a))
    k = np.ones_like(t)
    if kind == 'arm':
        tone = {'standard': .55, 'sturdy': 1.0, 'graceful': .15, 'stout': .8, 'soft': .2}[frame]
        slim = {'standard': 0, 'sturdy': 0, 'graceful': .05, 'stout': 0, 'soft': .03}[frame]
        k -= .06 * (1 - bell(t - .25, .2)) * (1 - tone * .4)                # the upper arm fullest a quarter down
        k -= (.1 - .03 * tone) * bell(t - .5, .07)                           # the elbow
        k -= .05 * smooth(t, .5, .62) * (1 - bell(t - .64, .1) * (.6 + .4 * tone))   # the forearm swells below it
        k -= (.2 - .04 * tone) * smooth(t, .7, 1.0)                          # down to the wrist
        k += .03 * tone * bell(t - .25, .12) * np.maximum(front, 0)          # a biceps to the front
        k -= slim
    else:
        tone = {'standard': .5, 'sturdy': 1.0, 'graceful': .35, 'stout': .85, 'soft': .3}[frame]
        slim = {'standard': 0, 'sturdy': 0, 'graceful': .03, 'stout': 0, 'soft': .02}[frame]
        # What is sat on keeps its thickness: the back of the thigh, hip to knee, is the taper's own, so everybody sits on
        # the floor and on a chair exactly as they did (the seat is made to the thigh's underside).
        seat = 1 - np.maximum(back, 0) ** .5 * (1 - smooth(t, .5, .6))
        k -= .05 * smooth(t, .12, .42) * seat                                # the thigh narrows to the knee, in front and at the sides
        k -= (.09 - .02 * tone) * bell(t - .5, .06) * seat                   # the knee
        k += .03 * bell(t - .49, .05) * np.maximum(front, 0)                 # the kneecap
        calf = bell(t - .66, .11)
        k -= .1 * smooth(t, .52, .6) * (1 - calf * (.5 + .5 * np.maximum(back, 0)) * (.75 + .25 * tone))   # the calf, behind
        k -= .04 * calf * np.maximum(front, 0)                               # the shin is flat to the front
        k -= (.2 - .03 * tone) * smooth(t, .76, .98)                         # the ankle
        k -= slim * (seat if kind == 'leg' else 1)
    return np.clip(k, .55, 1.0)


def build_limbs():
    out, x0 = {}, 0
    for kind in ('arm', 'leg'):
        out[kind] = {}
        # (stout: a big man's limbs, full with little waist at the elbow, the knee or the ankle; soft: an old lady's, slight)
        for frame in ('standard', 'sturdy', 'graceful', 'stout', 'soft'):
            t = np.linspace(0, 1, NT)[:, None] * np.ones((1, NA))
            a = np.linspace(0, 2 * math.pi, NA, endpoint=False)[None, :] * np.ones((NT, 1))
            k = limb_shape(kind, frame, t, a)
            radius = (.06 if kind == 'arm' else .08) * (1 - .16 * t) * k
            length = .52 if kind == 'arm' else .78
            pts = np.stack([radius * np.sin(a), -radius * np.cos(a), -t * length], axis=-1)      # Blender: -Y the front, Z up
            obj = grid_mesh(f'{kind}-{frame}', pts, NT, NA, at=(x0, 0, 1.0))
            co = melt(obj, 2, .35)[:NT * NA].reshape(NT, NA, 3)
            r = np.hypot(co[..., 0], co[..., 1]) / ((.06 if kind == 'arm' else .08) * (1 - .16 * t))
            # Smoothing draws a mesh in a little everywhere and its end ring most: the fullest of it is the taper's own again,
            # and it grows out of the shoulder or the hip at full thickness (the generator rounds that end itself).
            r = r / r.max() * (1 - (.05 if (kind, frame) == ('arm', 'graceful') else 0))     # (a graceful arm is slimmer all the way down)
            r = 1 + (r - 1) * smooth(t, .02, .16)
            out[kind][frame] = np.clip(r, .5, 1.0)
            x0 += .3
    return out


# ============================================================================ torso
def build_torso():
    """The torso's line from the waist's top to the neck, [radius as a share of the half-width, height as a share of the torso]."""
    lines = {
        # Square shoulders carried out to the arm before they turn in to a strong neck.
        'sturdy': [[1, .64], [1, .76], [.995, .85], [.975, .91], [.92, .96], [.78, .995], [.54, 1.02], [.27, 1.035], [0, 1.04]],
        # A soft bust line over a small waist, narrow shoulders that slope away to a slender neck.
        # The whole of her, hips to neck, in one soft line (Disney's appeal: an S-curve with no shelf or straight in it): round
        # hips a little wider than her shoulders, a small high waist, a soft bust line, shoulders that slope away to a slender
        # neck. (The owner, of a first try whose hips were a wide straight band: "she still has a barrel for hips".)
        'graceful': [[0, -.1], [.5, -.095], [.8, -.062], [.95, -.01], [1.02, .06], [1.03, .12], [.98, .19], [.88, .27], [.77, .35], [.7, .43],
                     [.68, .5], [.71, .56], [.8, .63], [.88, .69], [.89, .74], [.83, .8], [.72, .86], [.58, .925], [.43, .975], [.28, 1.008], [.14, 1.03], [0, 1.04]],
        # A big man heavy in the middle (Sverker, Erik: the owner, 26 November 2026, "Then after their bodies and feet"): the
        # whole of him in one line: the belly is the widest of him, a third of the way up, and rounds over the belt below
        # it; the chest goes in a little above it; ordinary shoulders, sloping to the neck.
        'stout': [[0, -.1], [.5, -.095], [.82, -.06], [.96, -.005], [1.03, .06], [1.09, .14], [1.15, .23], [1.18, .32], [1.17, .41], [1.12, .5],
                  [1.06, .58], [1.02, .66], [.995, .74], [.955, .81], [.88, .87], [.76, .93], [.58, .98], [.38, 1.01], [.19, 1.03], [0, 1.04]],
        # An old lady, small and soft (Christina): round hips under a soft middle with hardly a waist, a low full bust, and
        # narrow rounded shoulders that fall away to a slight neck. Nothing square or straight in her.
        'soft': [[0, -.1], [.5, -.095], [.82, -.06], [.97, -.008], [1.05, .06], [1.08, .13], [1.065, .2], [1.02, .28], [.97, .36], [.93, .44],
                 [.92, .5], [.935, .56], [.965, .62], [.97, .68], [.93, .74], [.85, .8], [.73, .86], [.58, .92], [.43, .97], [.28, 1.005], [.14, 1.03], [0, 1.04]],
    }
    out = {}
    for i, (frame, line) in enumerate(lines.items()):
        curve = bpy.data.curves.new(f'torso-{frame}', 'CURVE')
        curve.dimensions = '3D'
        sp = curve.splines.new('POLY')
        sp.points.add(len(line) - 1)
        for p, (r, y) in zip(sp.points, line):
            p.co = (r * .2, 0, y * .5, 1)
        obj = bpy.data.objects.new(f'torso-{frame}', curve)
        obj.location = (2.2 + i * .5, 0, .6)
        bpy.context.collection.objects.link(obj)
        out[frame] = line
    return out


# ============================================================================ feet and shoes
RJ, RS = 15, 16            # stations from heel to toe, points round each


def foot_points(shape):
    """One foot or shoe in the unit box: [stations][round] -> (x across, y up, z heel to toe). The left foot (its inner side is -x)."""
    j = np.linspace(0, 1, RJ)[:, None] * np.ones((1, RS))
    phi = np.linspace(0, 2 * math.pi, RS, endpoint=False)[None, :] * np.ones((RJ, 1))     # 0 the top, round by their left
    z = -np.cos(j * math.pi)                                                # stations bunch at the heel and the toe
    sx, cy = np.sin(phi), np.cos(phi)
    end = np.sqrt(np.clip(1 - z ** 2, 0, 1)) ** .62                          # the heel's and the toe's round ends
    P = {
        # width at heel / ball / toe, top at ankle / toe, how flat the top is, sole's thickness
        'foot':    dict(heel=.62, ball=.86, toe=.76, ankle=1.0, low=.36, crown=.8, flat=.42),
        'sneaker': dict(heel=.84, ball=1.0, toe=.94, ankle=1.0, low=.66, crown=.55, flat=.26),
        'shoe':    dict(heel=.78, ball=.95, toe=.76, ankle=.96, low=.5, crown=.65, flat=.26),
        'boot':    dict(heel=.84, ball=1.0, toe=.9, ankle=1.0, low=.7, crown=.55, flat=.26),
        'slipper': dict(heel=.8, ball=1.0, toe=.95, ankle=.5, low=.46, crown=.6, flat=.3),
        # A lady's court shoe (Christina's): narrow, a rounded toe that comes in, cut low, on a small heel.
        'court':   dict(heel=.66, ball=.86, toe=.6, ankle=.98, low=.33, crown=.72, flat=.26),
        # A broad work shoe for a big man (Sverker's, Erik's): wide all the way, a full round toe, a thick sole.
        'broad':   dict(heel=.9, ball=1.0, toe=.97, ankle=1.0, low=.6, crown=.6, flat=.24),
    }[shape]
    w = (P['heel'] + (P['ball'] - P['heel']) * smooth(z, -.75, .3) + (P['toe'] - P['ball']) * smooth(z, .35, 1.0)) * (.35 + .65 * end)
    # The top: the ankle's dome a third of the way from the heel (where the leg goes in), falling to the toe.
    # (z -0.25 is where the leg's own axis comes down: build.js lays the shoe so.)
    top = P['low'] + (P['ankle'] - P['low']) * bell(z + .3, .55)
    if shape == 'slipper':                                                   # a band over the instep, open-looking behind it
        top = .24 + .3 * bell(z - .25, .42)
    top = top * (.45 + .55 * end)
    bottom = np.zeros_like(z)
    if shape == 'foot':
        bottom = bottom + .07 * bell(z + .1, .28) * np.maximum(-sx, 0)        # the arch, on the inner side
    if shape in ('shoe', 'court'):
        bottom = bottom + (.09 if shape == 'court' else .05) * smooth(z, -.42, -.3) * (1 - smooth(z, .0, .14))   # a heel block and a waist under the arch
    up = np.where(cy >= 0, np.abs(cy) ** P['crown'], -np.abs(cy) ** P['flat'])     # a round top, a flat sole
    y = bottom + (top - bottom) * (.5 + .5 * up) + (1 - end) * .04
    x = w * sx * (1 - .1 * np.maximum(cy, 0) ** 2)
    if shape == 'foot':                                                      # five toes: the front edge in soft lobes, the big one inside
        toes = smooth(z, .78, .98)
        z = z - .05 * toes * (1 - np.abs(np.cos(2.5 * math.pi * (sx * .5 + .5)))) - .1 * toes * smooth(sx, -.2, 1.0)
    return np.stack([x, y, np.clip(z, -1, 1)], axis=-1)


def foot_zones(shape, pts):
    """What each point is part of: 0 the upper (or the skin), 1 the sole, 2 the toe cap, 3 the collar.
    Zones follow the mesh's own rows and columns (a point's place round its ring and along the foot), never a height:
    a triangle is a zone's only when all three of its points are, so every edge between two colours runs along a line of
    the mesh and is clean."""
    j = np.linspace(0, 1, RJ)[:, None] * np.ones((1, RS))
    cy = np.cos(np.linspace(0, 2 * math.pi, RS, endpoint=False))[None, :] * np.ones((RJ, 1))
    z = -np.cos(j * math.pi)
    zone = np.zeros(pts.shape[:2], dtype=np.uint8)
    under = cy < -.3
    if shape == 'sneaker':
        zone[(z > .55) & ~under & (cy < .75)] = 2
        zone[(np.abs(z + .3) < .34) & (cy > .9)] = 3
        zone[under] = 1
    elif shape in ('shoe', 'boot', 'slipper', 'court', 'broad'):
        zone[cy < -.6] = 1
        if shape == 'court':                                                 # cut low: the instep shows in the shoe's opening
            zone[(cy > .5) & (z > -.66) & (z < .34)] = 3
        if shape == 'broad':                                                 # a toe cap
            zone[(z > .6) & (cy >= -.6)] = 2
    return zone


def build_feet():
    shapes, zones, index = {}, {}, None
    for i, shape in enumerate(('foot', 'sneaker', 'shoe', 'boot', 'slipper', 'court', 'broad')):
        pts = foot_points(shape)
        # Blender: X across, -Y the toe's way, Z up; a tenth of a metre to the unit.
        obj = grid_mesh(f'foot-{shape}', np.stack([pts[..., 0] * .05, -pts[..., 2] * .12, pts[..., 1] * .09], axis=-1), RJ, RS, at=(4 + i * .2, 0, 0))
        co = melt(obj, 1, .3)
        unit = np.stack([co[:, 0] / .05, co[:, 2] / .09, -co[:, 1] / .12], axis=-1)
        # Back into the unit box exactly: the floor is 0, the heel -1, the toe 1.
        unit[:, 1] -= unit[:, 1].min()
        unit[:, 1] /= max(unit[:, 1].max(), 1e-6) / (1.0 if shape != 'slipper' else .56)
        z0, z1 = unit[:, 2].min(), unit[:, 2].max()
        unit[:, 2] = (unit[:, 2] - z0) / (z1 - z0) * 2 - 1
        unit[:, 0] /= max(np.abs(unit[:, 0]).max(), 1e-6) / np.abs(pts[..., 0]).max()
        shapes[shape] = unit.astype('<f4')
        zone = foot_zones(shape, pts).reshape(-1)
        zones[shape] = np.concatenate([zone, [zone[0], zone[-1]]]).astype(np.uint8)       # the two poles
        if index is None:
            obj.data.calc_loop_triangles()
            tri = np.empty(len(obj.data.loop_triangles) * 3, dtype=np.int32)
            obj.data.loop_triangles.foreach_get('vertices', tri)
            index = tri.astype('<u2')
    return shapes, zones, index


# ============================================================================ hands
def build_hand():
    """The hand (tools/blender/hand_model.py), in the kit's frame: x through the hand (+x the back of it), y 1 (the wrist)
    .. -1 (the middle fingertip), z across it (+z the forefinger's side, where the thumb is); scaled the same on every axis
    (its own proportions), so the game sizes it by one number."""
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import hand_model
    obj = hand_model.build(levels=2)                                        # (two levels: smooth at a phone's size, a quarter of the points)
    co = np.empty(len(obj.data.vertices) * 3)
    obj.data.vertices.foreach_get('co', co)
    co = co.reshape(-1, 3)
    lo, hi = co[:, 1].min(), co[:, 1].max()
    k = 2 / (hi - lo)
    unit = np.stack([(co[:, 0] - (co[:, 0].min() + co[:, 0].max()) / 2) * k, (co[:, 1] - lo) * k - 1, co[:, 2] * k], axis=-1)
    obj.data.vertices.foreach_set('co', np.stack([unit[:, 0] * .03, -unit[:, 2] * .03, unit[:, 1] * .03], axis=-1).ravel())
    obj.data.update()
    obj.location = (6, 0, 0)
    obj.data.calc_loop_triangles()
    tri = np.empty(len(obj.data.loop_triangles) * 3, dtype=np.int32)
    obj.data.loop_triangles.foreach_get('vertices', tri)
    return unit.astype('<f4'), tri.astype('<u4')


# ============================================================================ noses
NU, NV = 15, 19            # across, and from the top of the bridge to under the tip


def nose_shape(style, u, v):
    """How far the nose stands out (1 its tip) at u across and v down the patch."""
    P = {
        # where the tip is, how round and wide it is; the bridge's height at its top and how wide; wings; a hook's bump
        'soft':    dict(tip=.42, round=.5, wide=.62, bridge=.12, bw=.3, wings=.0, bump=0),
        'button':  dict(tip=.3, round=.62, wide=.78, bridge=.05, bw=.3, wings=.0, bump=0),
        'snub':    dict(tip=.2, round=.5, wide=.7, bridge=.02, bw=.28, wings=.12, bump=-.06),
        'bulb':    dict(tip=.36, round=.72, wide=.9, bridge=.14, bw=.34, wings=.1, bump=0),
        'wide':    dict(tip=.4, round=.5, wide=.72, bridge=.2, bw=.4, wings=.42, bump=0),
        'hook':    dict(tip=.6, round=.36, wide=.6, bridge=.34, bw=.34, wings=.16, bump=.2),
        'pointed': dict(tip=.56, round=.3, wide=.5, bridge=.22, bw=.28, wings=.1, bump=0),
        'ridge':   dict(tip=.5, round=.4, wide=.5, bridge=.46, bw=.3, wings=.08, bump=0),
    }[style]
    vt = P['tip']
    along = np.clip((v + 1) / (vt + 1), 0, 1)                               # 0 at the top of the bridge, 1 at the tip
    ridge = (P['bridge'] + (1 - P['bridge']) * along ** 1.6 + P['bump'] * bell(along - .5, .22)) * bell(u, P['bw'] + .16 * along)
    ridge = ridge * np.where(v > vt, bell(v - vt, P['round'] * .8), 1)       # under the tip it turns back to the lip
    tip = np.exp(-((u / P['wide']) ** 2 + ((v - vt) / P['round']) ** 2))
    wings = P['wings'] * (bell(np.abs(u) - .62, .24) * bell(v - (vt + .08), .26))
    h = np.maximum(ridge, tip) * .92 + wings
    return h * (1 - u ** 6) * (1 - np.clip(v, -1, 1) ** 8)                   # nothing at the patch's edge: it grows out of the face


NOSE_SIZE = {'soft': [.8, 1.25, .62], 'button': [1.0, 1.0, .9], 'snub': [.95, 1.05, .85], 'bulb': [1.2, 1.2, 1.1], 'wide': [1.5, 1.15, .95],
             'hook': [1.0, 1.9, 1.5], 'pointed': [.85, 1.6, 1.45], 'ridge': [.8, 1.8, 1.05]}


def build_noses():
    out = {}
    for i, style in enumerate(NOSE_SIZE):
        v = np.linspace(-1, 1, NV)[:, None] * np.ones((1, NU))
        u = np.linspace(-1, 1, NU)[None, :] * np.ones((NV, 1))
        h = nose_shape(style, u, v)
        sx, sy, sz = NOSE_SIZE[style]
        pts = np.stack([u * .02 * sx, -h * .03 * sz, -v * .02 * sy], axis=-1)   # Blender: -Y the front, Z up
        bm = bmesh.new()
        vs = [bm.verts.new(q) for q in pts.reshape(-1, 3)]
        for r in range(NV - 1):
            for c in range(NU - 1):
                a = r * NU + c
                bm.faces.new((vs[a], vs[a + NU], vs[a + NU + 1], vs[a + 1]))
        mesh = bpy.data.meshes.new(f'nose-{style}')
        bm.to_mesh(mesh)
        bm.free()
        obj = bpy.data.objects.new(f'nose-{style}', mesh)
        obj.location = (6 + i * .08, 0, 0)
        bpy.context.collection.objects.link(obj)
        co = melt(obj, 1, .35).reshape(NV, NU, 3)
        height = np.clip(-co[..., 1] / (.03 * sz), 0, None)
        height[0, :] = height[-1, :] = 0
        height[:, 0] = height[:, -1] = 0
        out[style] = (height / max(height.max(), 1e-6)).astype('<f4')
    return out


limbs, torso, (feet, zones, index), noses, (hand, hand_index) = build_limbs(), build_torso(), build_feet(), build_noses(), build_hand()
bpy.ops.wm.save_as_mainfile(filepath=str(ART / 'body-kit.blend'), compress=True)

b64 = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
rows = lambda table: [[round(float(v), 3) for v in row] for row in table]
js = ["// Generated by tools/blender/build-body-kit.py: the modular body kit, sculpted in Blender. Do not edit: change the kit and run it.",
      "/** How thick a limb is as a share of its plain taper: [along 0..1][round, 0 the front, a quarter turn their left]. Never over 1. */",
      "export const LIMBS=Object.freeze(" + json.dumps({k: {f: rows(t) for f, t in v.items()} for k, v in limbs.items()}, separators=(',', ':')) + ");",
      "/** The torso's line from the waist's top to the neck, for a frame: [radius as a share of the half-width, height as a share of the torso]. */",
      "export const TORSO=Object.freeze(" + json.dumps(torso, separators=(',', ':')) + ");",
      "/** Feet and shoes: one mesh layout in several shapes (Float32 x, y, z in the unit box; the left foot), its triangles (Uint16) and each point's zone (Uint8). */",
      "export const FEET=Object.freeze({points:%d,index:'%s',\n shapes:Object.freeze({%s}),\n zones:Object.freeze({%s})});" % (
          len(next(iter(feet.values()))), b64(index),
          ','.join("%s:'%s'" % (k, b64(v)) for k, v in feet.items()), ','.join("%s:'%s'" % (k, b64(v)) for k, v in zones.items())),
      "/** The hand: its points (Float32 x, y, z: +x the back of the hand, y 1 the wrist .. -1 the middle fingertip, +z the forefinger's side; the same scale on every axis) and its triangles (Uint32). */",
      "export const HANDS=Object.freeze({points:%d,index:'%s',hand:'%s'});" % (len(hand), b64(hand_index), b64(hand)),
      "/** Noses: a height (0..1, Float32, rows from the top of the bridge to under the tip) over a patch, and each one's [width, length, depth]. */",
      "export const NOSES=Object.freeze({cols:%d,rows:%d,size:Object.freeze(%s),\n shapes:Object.freeze({%s})});" % (
          NU, NV, json.dumps(NOSE_SIZE, separators=(',', ':')), ','.join("%s:'%s'" % (k, b64(v)) for k, v in noses.items()))]
(ROOT / 'src/avatars/sculpts/body-kit.js').write_text('\n'.join(js) + '\n')
report = {'source': 'Original Johansson Town body kit, sculpted in Blender for the game\'s generator', 'generator': 'tools/blender/build-body-kit.py',
          'blender': bpy.app.version_string, 'limbs': {k: {f: {'min': round(float(t.min()), 3), 'max': round(float(t.max()), 3)} for f, t in v.items()} for k, v in limbs.items()},
          'noses': list(noses), 'feet': {'points': int(len(next(iter(feet.values())))), 'triangles': int(len(index) // 3), 'shapes': list(feet)}, 'torso': list(torso)}
(ART / 'body-kit-report.json').write_text(json.dumps(report, indent=1) + '\n')
print(json.dumps(report['limbs']), report['feet'])
