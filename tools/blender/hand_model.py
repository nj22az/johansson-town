"""A hand modelled in Blender, in progress: NOT worn by anybody yet (build.js still draws the mitten).

The owner, 26 November 2026: "Omg they have mitten hands"; "Draw the hand properly not like a balloon with sausages on it";
and of this model, "The hands look awful, make them Disney quality". What is here is the second try: kept as the starting
point for the hand that will be worn (briefs/HANDOFF-SAKURA-RESTROOM-2026-11-26.md, the last section)."""
import math
import bpy
import bmesh
import numpy as np
from mathutils import Matrix, Vector

THICK = 1.1                # how thick the hand is, of the mitten's 2
PALM = -.7                 # where its palm side lies in the box: nearly the mitten's own surface (-1)


def hand_object(name='hand', voxel=.04, detail=.16):
    """A hand at rest, as it hangs at the end of an arm: in the box's units, x through the hand (+x the back of it),
    y 1 (the wrist) .. -1 (the middle fingertip), z across it (+z the forefinger's side).
    Built as a hand is: a flat palm (wider than it is thick, wider at the knuckles than at the wrist, with the heel of the
    hand and the thumb's mound on its inner face), four fingers of three joints each, tapering, a little curled toward the
    palm and more so toward the little finger, and a thumb of two joints growing out of its mound, forward of the
    forefinger. Then made one continuous skin (a voxel remesh), smoothed and thinned out."""
    bm = bmesh.new()

    def ball(c, r):
        made = bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=8, radius=1)['verts']
        bmesh.ops.transform(bm, matrix=Matrix.Translation(c) @ Matrix.Diagonal((*r, 1)), verts=made)

    def bone(a, b, ra, rb, flat=1.0):
        """A tapered round segment from a to b (unit frame), radius ra to rb; `flat` thins it through the hand (x)."""
        a, b = Vector(a), Vector(b)
        n = max(2, int((b - a).length / .05))
        for i in range(n + 1):
            t = i / n
            r = ra + (rb - ra) * t
            ball(a.lerp(b, t), (r * flat, r, r))

    # The palm: a rounded slab. Rows of lumps from the wrist to the knuckles, across from the little finger's edge to the
    # forefinger's; thinner at its edges; the knuckle line an arc, highest at the middle finger.
    for iy in range(10):
        v = iy / 9                                                           # 0 the wrist .. 1 the knuckles
        half = .42 + .44 * v ** .7                                           # the palm widens toward the knuckles
        for iz in range(9):
            w = iz / 8 * 2 - 1
            y = .93 - .86 * v + (.05 * (1 - w * w) - .03 * max(-w, 0)) * v   # the knuckle arc; the little finger's side lower
            thick = .27 * (1 - .28 * w * w) * (.86 + .14 * v)
            ball((0, y, w * half), (thick, .16, .16))
    # The heel of the hand and the thumb's mound, on the palm's face (-x).
    ball((-.14, .62, -.3), (.2, .26, .3))
    ball((-.2, .56, .42), (.24, .32, .28))
    # Knuckles, on the back.
    # Four fingers: [z, base y, length, radius, curl]
    for z, y0, length, r, curl in ((-.66, .0, .6, .185, .24), (-.22, .07, .78, .205, .19), (.22, .1, .86, .21, .16), (.66, .06, .78, .205, .13)):
        p, ang = Vector((0.0, y0, z)), .06
        ball((.1, y0 + .03, z), (.16, .13, r * 1.05))                        # its knuckle
        for k, share in enumerate((.42, .31, .27)):                          # three joints, each shorter and slimmer
            ang += curl
            q = p + Vector((-math.sin(ang), -math.cos(ang), 0)) * (length * share)
            bone(p, q, r * (1 - .07 * k), r * (1 - .07 * (k + 1)))
            p = q
    # The thumb: two joints out of its mound, forward of the forefinger and a little toward the palm.
    p = Vector((-.2, .5, .56))
    # (it stands out past the forefinger's edge no further than the mitten's thumb did: what the hand lies beside was
    # placed to that)
    for k, (dz, dy, dx, seg) in enumerate(((.46, -.84, -.24, .44), (.26, -.93, -.26, .36))):
        d = Vector((dx, dy, dz)).normalized()
        q = p + d * seg
        bone(p, q, .235 - .02 * k, .215 - .025 * k)
        p = q
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    m = obj.modifiers.new('skin', 'REMESH')
    m.mode, m.voxel_size, m.use_smooth_shade = 'VOXEL', voxel, True
    bpy.ops.object.modifier_apply(modifier=m.name)
    m = obj.modifiers.new('melt', 'SMOOTH')
    m.factor, m.iterations = .5, 3
    bpy.ops.object.modifier_apply(modifier=m.name)
    m = obj.modifiers.new('thin', 'DECIMATE')
    m.ratio = detail
    bpy.ops.object.modifier_apply(modifier=m.name)
    m = obj.modifiers.new('melt2', 'SMOOTH')
    m.factor, m.iterations = .4, 2
    bpy.ops.object.modifier_apply(modifier=m.name)
    for p in obj.data.polygons:
        p.use_smooth = True
    co = np.empty(len(obj.data.vertices) * 3)
    obj.data.vertices.foreach_get('co', co)
    co = co.reshape(-1, 3)
    # Into the box exactly, wrist to fingertips.
    lo, hi = co[:, 1].min(), co[:, 1].max()
    co[:, 1] = (co[:, 1] - lo) / (hi - lo) * 2 - 1
    # Through the hand: its palm side lies near the palm side of the box the mitten filled, since the palm is what a hand
    # touches things with and every pose was made to the mitten's surface there; the back of the hand is where a hand's
    # is, inside the mitten's. A cartoon's hand: plump, a little thicker than life.
    lo, hi = co[:, 0].min(), co[:, 0].max()
    co[:, 0] = PALM + (co[:, 0] - lo) / (hi - lo) * THICK
    obj.data.vertices.foreach_set('co', co.ravel())
    obj.data.update()
    obj.data.calc_loop_triangles()
    tri = np.empty(len(obj.data.loop_triangles) * 3, dtype=np.int32)
    obj.data.loop_triangles.foreach_get('vertices', tri)
    return obj, co.astype('<f4'), tri.astype('<u2')
