"""The body kit's hand, box-modelled in Blender as animation studios model hands: a low cage (a palm block that tapers to
the wrist, four fingers each extruded from its knuckle in three joints, a thumb grown from the palm's side) smoothed by
subdivision surface into one continuous skin.

The owner, 26 November 2026: "Omg they have mitten hands"; of a palm of spheres with spheres for fingers, "Draw the hand
properly not like a balloon with sausages on it"; of a hand of voxel-merged lumps, "The hands look awful, make them Disney
quality". Both of those were built from blobs; this one is designed: a soft palm, fingers that taper, fan a little and
curl more toward the little one, the middle longest, and a thumb from a fleshy base angled toward the forefinger."""
import math
import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

# Frame: x through the hand (+x the back, -x the palm), y along it (+y the wrist, -y the fingertips), z across it (+z the
# forefinger's side, where the thumb is).
P = dict(palm_len=1.0, palm_w=1.44, palm_t=.6, fingers=[  # z centre, length, width, curl per joint (rad), splay (rad)
    (+.57, .70, .38, .13, +.08),     # fore
    (+.19, .78, .39, .15, +.02),     # middle
    (-.19, .72, .38, .19, -.04),     # ring
    (-.56, .54, .35, .25, -.11),     # little
], gap=.012, thumb=dict(len=.7, steps=[  # each step out of the palm's side: its way (x, y, z), its share of the length, taper
    ((-.4, -.55, .75), .3, 1.0), ((-.45, -.9, .32), .32, .97), ((-.3, -1.0, .02), .26, .9), ((-.2, -1.0, -.05), .12, .55)]))

# The same hand closed round a handle (a mug's, a torch, an umbrella's crook, a bar), the power grip: every finger curled at
# each of its three joints (a tuple: knuckle, middle, end), the little finger most, drawn together; the thumb brought round
# in front of the palm and laid across the forefinger and the middle finger. The same cage, so the same points in the same
# order: the game blends the resting hand into this one (build.js grip).
# (Curled further, the ring and little fingers' tips go into the palm: tools/blender checks the skin never passes through itself.)
GRIP = dict(P, fingers=[(z, l, w, (c0, c1, c2), sp * .3) for (z, l, w, _, sp), (c0, c1, c2) in zip(P['fingers'], [
    (.8, .9, .4), (.8, .95, .4), (.7, 1.0, .45), (.75, 1.0, .45)])],
    thumb=dict(len=.7, steps=[((-.4, -.55, .75), .3, 1.0), ((-.7, -.65, .25), .32, .97), ((-.5, -.55, -.5), .26, .9), ((-.2, -.4, -.9), .12, .55)]))

# The knuckle line, in the cage's frame: where the fingers leave the palm (at the middle finger, the top of the arc).
KNUCKLES = -.06

# The palm's face toward what it holds, in the cage's frame (the block's -x side: build's xs[0]).
PALM_FACE = -P['palm_t'] * .55
# The hand round a can (the owner, 27 November 2026: "He is holding the can very weird"; of drinking, "impeccable Disney
# animation standard"): a 350 ml can is 66 mm across, 0.6 of the cast's hand lengths in radius (build.js m.hand, 54 to 57 mm),
# 0.627 in the cage's units. Its axis lies across the hand along the knuckle line (z), against the palm a little above the
# knuckles, where a power grip holds it; each finger goes round it joint by joint, every one of its three bones laid on it
# (tangent to it, its own half-thickness off it); the thumb comes out of the palm's side and round the other way, over the
# top of the can. Held upright the thumb is up.
CAN = dict(radius=.627, y=.25)
FINGER_HALF = (.27, .25, .23)     # each bone's half-thickness, its axis to its pad (the knuckle face, tapered; measured)


def wrap_curls(z, length, radius, y, half=FINGER_HALF):
    """A finger's three curls (knuckle, middle, end) laying each of its bones on a round thing whose axis is along z at
    (PALM_FACE - radius, y): from its knuckle, each bone along the tangent to the circle its own half-thickness out, going
    round the way a finger closes (clockwise, seen down +z)."""
    cx = PALM_FACE - radius
    px, py = -.03, KNUCKLES * (1 - (z / (P['palm_w'] / 2)) ** 2)
    prev, curls = 0.0, []
    for share, h in zip((.42, .32, .26), half):
        R = radius + h
        vx, vy = cx - px, y - py
        D = math.hypot(vx, vy)
        if D <= R:                                   # (already on it: on along its round)
            rx, ry = (px - cx) / D, (py - y) / D
            ux, uy = ry, -rx
        else:
            b, wx, wy = math.asin(R / D), vx / D, vy / D
            for t in (b, -b):
                ux, uy = wx * math.cos(t) - wy * math.sin(t), wx * math.sin(t) + wy * math.cos(t)
                if (px - cx) * uy - (py - y) * ux < 0:
                    break
        a = math.atan2(-ux, -uy)
        curls.append(a - prev)
        prev = a
        px, py = px + ux * length * share, py + uy * length * share
    return tuple(curls)


# (each finger's bones as far off their axis as that finger is drawn thick, smoothed: measured on the wrap, each finger's pad
# came to stand 0.5 to 1.1 hundredths of the cage off the can, the little finger's two; laid on it, to half of one)
SETTLE = {.57: .009, .19: .006, -.19: .007, -.56: .016}
WRAP = dict(P, fingers=[(z, l, w, wrap_curls(z, l, CAN['radius'], CAN['y'], tuple(h - SETTLE[z] for h in FINGER_HALF)), 0.0) for (z, l, w, _, sp) in P['fingers']],
    thumb=dict(len=.7, steps=[((0, .1, 1), .3, 1.0), ((-.6, .5, .4), .32, .97), ((-.7, .7, 0), .26, .9), ((-.4, .9, -.1), .12, .55)]))

def finger_joints(z, length, curls):
    """A finger's joints in the cage's frame (x, y at its own z): the knuckle, the middle joint, the end joint, the tip's
    bone's end; and each bone's way (the angle it is curled through), as build() extrudes them."""
    px, py, a, out = -.03, KNUCKLES * (1 - (z / (P['palm_w'] / 2)) ** 2), 0.0, []
    for share, c in zip((.42, .32, .26), curls):
        a += c
        nx, ny = px - math.sin(a) * length * share, py - math.cos(a) * length * share
        out.append(((px, py), (nx, ny), a))
        px, py = nx, ny
    return out


# The hand hooking a can's ring-pull (the owner: "A can needs to be opened also, removing the tab"): the forefinger out on
# its own and crooked at its end into a hook, to go under the ring and lift it; the other three folded into the palm, out of
# its way, as a hand does to pull a ring (a half-open hand read as a hand cupped over the can); the thumb by the forefinger's
# side, steadying it.
HOOK = dict(P, fingers=[(z, l, w, c, sp) for (z, l, w, _, sp), c in zip(P['fingers'], [
    (.15, .95, .9), (.8, .95, .4), (.7, 1.0, .45), (.75, 1.0, .45)])],
    thumb=dict(len=.7, steps=[((-.4, -.55, .75), .3, 1.0), ((-.5, -.85, .3), .32, .97), ((-.3, -1.0, .05), .26, .9), ((-.2, -1.0, 0), .12, .55)]))


def build(P=P, levels=3, like=None):
    bm = bmesh.new()
    # (every point numbered as it is made, from the point it was made from, and the cage put in that order before it is
    # smoothed: bmesh orders what its operators make by where it lies in memory, so the same cage built twice, or built after
    # anything else, came out in another order, and the shapes of one hand could not be blended into each other)
    tag = bm.verts.layers.int.new('made')
    made = [0]

    def number():
        fresh = [v for v in bm.verts if v[tag] == 0]
        def source(v):
            old = [e.other_vert(v)[tag] for e in v.link_edges if e.other_vert(v)[tag] > 0]
            return min(old) if old else 0
        for v in sorted(fresh, key=source):
            made[0] += 1
            v[tag] = made[0]
    L, W, T = P['palm_len'], P['palm_w'], P['palm_t']
    # The palm: a block, four columns across (one per finger), two rows down, a little wider at the knuckles.
    zs = np.array([-W / 2, -W / 4, 0, W / 4, W / 2])
    ys = np.array([L, L * .62, L * .3, 0.0])
    xs = np.array([-T * .55, T * .45])
    V = {}
    for i, y in enumerate(ys):
        u = 1 - y / L                                    # 0 the wrist .. 1 the knuckles
        widen = .62 + .38 * min(1, u / .62) ** .7        # the palm narrows to a round wrist
        thin = .78 + .22 * min(1, u / .62)
        for j, z in enumerate(zs):
            arc = -KNUCKLES * (1 - (z / (W / 2)) ** 2) * (1 - y / L)   # the knuckle line an arc, highest at the middle
            for k, x in enumerate(xs):
                V[i, j, k] = bm.verts.new((x * thin, y - arc, z * widen))
                made[0] += 1
                V[i, j, k][tag] = made[0]
    F = lambda *vs: bm.faces.new(vs)
    ni, nj = len(ys), len(zs)
    for i in range(ni - 1):
        for j in range(nj - 1):
            F(V[i, j, 0], V[i, j + 1, 0], V[i + 1, j + 1, 0], V[i + 1, j, 0])        # the palm (-x)
            F(V[i, j, 1], V[i + 1, j, 1], V[i + 1, j + 1, 1], V[i, j + 1, 1])        # the back (+x)
    for j in range(nj - 1):
        F(V[0, j, 0], V[0, j, 1], V[0, j + 1, 1], V[0, j + 1, 0])                    # the wrist end
        knuckle = F(V[ni - 1, j, 0], V[ni - 1, j + 1, 0], V[ni - 1, j + 1, 1], V[ni - 1, j, 1])   # the knuckle faces
    for i in range(ni - 1):
        F(V[i, 0, 0], V[i + 1, 0, 0], V[i + 1, 0, 1], V[i, 0, 1])                    # the little finger's edge
        F(V[i, nj - 1, 0], V[i, nj - 1, 1], V[i + 1, nj - 1, 1], V[i + 1, nj - 1, 0])  # the forefinger's edge
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    knuckles = sorted([f for f in bm.faces if all(abs(v.co.y - (0 - .06 * (1 - (v.co.z / (W / 2)) ** 2))) < .02 for v in f.verts) and f.normal.y < -.5],
                      key=lambda f: f.calc_center_median().z)
    # Each finger: the knuckle face inset (a gap between fingers), then three joints, each shorter, slimmer and curled.
    for (zc, length, w, curls, splay), face in zip(sorted(P['fingers'], key=lambda f: f[0]), knuckles):
        inset = bmesh.ops.inset_individual(bm, faces=[face], thickness=P['gap'], depth=0)
        number()
        f = face
        direction = Vector((0, -1, 0))
        ang = 0.0
        segs = (.42, .32, .26)
        curls = curls if isinstance(curls, tuple) else (curls,) * 3
        for s, share in enumerate(segs):
            ext = bmesh.ops.extrude_discrete_faces(bm, faces=[f])['faces'][0]
            number()
            curl = curls[s]
            ang += curl
            d = Vector((-math.sin(ang), -math.cos(ang), math.sin(splay)))
            c = ext.calc_center_median()
            step = d * (length * share)
            taper = .93 if s < 2 else .86
            for v in ext.verts:
                v.co = c + (v.co - c) * taper + step
            # turn the face to look along the finger
            rot = Matrix.Rotation(-curl, 4, 'Z')
            c2 = ext.calc_center_median()
            for v in ext.verts:
                v.co = c2 + rot @ (v.co - c2)
            f = ext
        # the fingertip: one more short, small step so it rounds off
        ext = bmesh.ops.extrude_discrete_faces(bm, faces=[f])['faces'][0]
        number()
        c = ext.calc_center_median()
        d = Vector((-math.sin(ang + curl * .5), -math.cos(ang + curl * .5), 0))
        for v in ext.verts:
            v.co = c + (v.co - c) * .55 + d * (w * .28)
    # The thumb: out of the forefinger's side of the palm, from the wrist to the middle of the palm (its mound is that broad),
    # out to the side and a little forward, then curving forward and down toward the forefinger, thinning to a round tip.
    th = P['thumb']
    base = [f for f in bm.faces if f.normal.z > .6 and L * .3 < f.calc_center_median().y < L * .62]
    if base:
        bmesh.ops.inset_region(bm, faces=base, thickness=.025, depth=0)
        number()
        region = base
        for dv, share, taper in th['steps']:
            dv = Vector(dv)
            out = bmesh.ops.extrude_face_region(bm, geom=region)
            bmesh.ops.delete(bm, geom=region, context='FACES')
            number()
            region = [g for g in out['geom'] if isinstance(g, bmesh.types.BMFace)]
            verts = list({v for f in region for v in f.verts})
            c = sum((v.co for v in verts), Vector()) / len(verts)
            n = sum((f.normal for f in region), Vector()).normalized()
            q = n.rotation_difference(dv.normalized())
            step = dv.normalized() * (th['len'] * share)
            for v in verts:
                v.co = c + q @ ((v.co - c) * taper) + step
            bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new('handCage')
    # (and another shape of the hand is the resting hand's own cage with these points moved, `like` (its cage, build's
    # `.cage`): the same points, edges, faces and corners in the same order, so it is smoothed into the same points)
    bm.verts.sort(key=lambda v: v[tag])
    if like is not None:
        co = [c for v in bm.verts for c in v.co]
        bm.free()
        mesh = like.copy()
        assert len(mesh.vertices) * 3 == len(co), 'another cage than the resting hand\'s'
        mesh.vertices.foreach_set('co', co)
        mesh.update()
    else:
        bm.to_mesh(mesh)
        bm.free()
    build.cage = mesh.copy()
    obj = bpy.data.objects.new('hand', mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    m = obj.modifiers.new('subsurf', 'SUBSURF')
    m.levels = m.render_levels = levels
    bpy.ops.object.modifier_apply(modifier=m.name)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def hook_point():
    """Where a ring hooked by the forefinger lies (HOOK), in the cage's frame: on the pad of its end bone, half way along
    it, the bone's half-thickness off its axis toward the palm."""
    z, length, w, curls, splay = HOOK['fingers'][0]
    (ax, ay), (bx, by), a = finger_joints(z, length, curls)[2]
    h = FINGER_HALF[2]
    return ((ax + bx) / 2 - math.cos(a) * h, (ay + by) / 2 + math.sin(a) * h, z + length * (.42 + .32 + .13) * math.sin(splay))
