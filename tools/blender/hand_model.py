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
], gap=.012, thumb=dict(len=.7))


def build(P=P, levels=3):
    bm = bmesh.new()
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
            arc = .06 * (1 - (z / (W / 2)) ** 2) * (1 - y / L)   # the knuckle line an arc, highest at the middle
            for k, x in enumerate(xs):
                V[i, j, k] = bm.verts.new((x * thin, y - arc, z * widen))
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
    for (zc, length, w, curl, splay), face in zip(sorted(P['fingers'], key=lambda f: f[0]), knuckles):
        inset = bmesh.ops.inset_individual(bm, faces=[face], thickness=P['gap'], depth=0)
        f = face
        direction = Vector((0, -1, 0))
        ang = 0.0
        segs = (.42, .32, .26)
        for s, share in enumerate(segs):
            ext = bmesh.ops.extrude_discrete_faces(bm, faces=[f])['faces'][0]
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
        region = base
        steps = [(Vector((-.4, -.55, .75)), .3, 1.0), (Vector((-.45, -.9, .32)), .32, .97), (Vector((-.3, -1.0, .02)), .26, .9), (Vector((-.2, -1.0, -.05)), .12, .55)]
        for dv, share, taper in steps:
            out = bmesh.ops.extrude_face_region(bm, geom=region)
            bmesh.ops.delete(bm, geom=region, context='FACES')
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
    bm.to_mesh(mesh)
    bm.free()
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
