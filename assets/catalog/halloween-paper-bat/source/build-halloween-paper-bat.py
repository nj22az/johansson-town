"""The paper bat: a Halloween bat cut from black card, built in Blender for Johansson World and Johansson Studio.

    python3 johansson-town/assets/catalog/halloween-paper-bat/source/build-halloween-paper-bat.py
    (Blender as a Python module, `pip install bpy`; or: blender --background --python <this file>)

Writes next to this file:
    model.glb           the model Johansson Studio checks, exports and publishes into World's catalogue
                        (town-studio/assets/halloween-paper-bat/model.glb is a copy of it)
    build-report.json   the measurements, the parts and their triangles, the anchors

The Pocket Camera's Halloween sticker (tools/blender/render-halloween-stickers.py) imports `build()` from this file, so
the bat on the camera's sticker sheet and the bats on Sakura's lantern string are the same bat.

What it is. The kind of bat a shop cuts for Halloween: a sheet of black card (about 1 mm), drawn round a stencil and
cut out, then creased down the middle so the wings stand forward in a shallow V and it hangs stiff, not flat:
    - a round head-and-body with two pointed ears;
    - the wings: the leading edge arching up to the wrist and out to a pointed tip, the trailing edge cut in three
      scallops between the finger points;
    - two eyes: white paper dots (a hole punch's, 13 mm) glued on, each with a black pupil drawn in marker, looking a
      little down and in, at the children.

    - a pinhole at the top of the crease, between the ears, for the cotton thread it hangs by.

Who, why, where (the Studio card): Sakura Shōten has supplied the town's decorations since Mrs Kinjō retired; for the
children's Halloween walk on Sakura Street (src/world/halloween.js) its shopkeepers hang these on cotton threads from the
lantern string along the awning's front edge, between the paper pumpkin lanterns, from 24 to 31 October (the shutter is
rolled up whenever the shop is open, so nothing is taped to it).

Its frame (World's catalogue): metres, y up, the front +z (the side the eyes are on), the bat's own left +x, its lowest
point at y = 0. The back of the crease is z = 0, the least z of the whole bat; the wing tips stand forward of it. Anchors:
`hang`, where the thread is tied (the top of the crease, between the ears); `balance`, the card's centre of mass (hung
from `hang` it settles with `balance` straight below it: the card leans back by the angle between them); `eyes`.

Real size: 24 cm across the folded wings (24.5 cm flat), 9.6 cm from the ear tips to the belly, 1 mm card, each wing
turned 14 degrees forward at the crease (the tips stand 3 cm forward of it).

Two materials, no texture: card (the black card, and the pupils drawn on the dots) and paper (the white dots).
"""
import bpy, bmesh, json, math, sys
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.geometry import tessellate_polygon

HERE = Path(__file__).resolve().parent
NAME = 'Paper bat'

SPAN = 0.245            # flat, tip to tip
CARD = 0.001            # black card, 1 mm
FOLD = math.radians(14) # each wing turned forward at the crease
EYE_R, PUPIL_R, DOT = 0.0065, 0.0028, 0.00025   # a hole punch's dot (13 mm), the marker pupil, the dot's thickness

COLOURS = {
    'card': '#24222a',    # World's costume black (story-props.js witchHat)
    'paper': '#f8f5ee',   # white paper dots
}
REAL = {
    'card': 'black card, about 1 mm (300 g/m2 board)',
    'span': '24.5 cm flat, 24 cm with the wings turned forward',
    'fold': 'one crease down the middle; each wing turned 14 degrees forward',
    'eyes': 'white paper dots 13 mm across (a hole punch), a black marker pupil 5.6 mm, set low and in',
    'fixing': 'a cotton thread through a pinhole at the top of the crease, tied to the lantern string',
}


def lin(hexa):
    """sRGB hex to linear RGB (Blender's colours and glTF's are linear)."""
    c = [int(hexa[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


# ---- The outline: the right half (x >= 0), from the top of the head round to the belly -------------------------------
def bezier(p0, p1, p2, p3, n):
    out = []
    for i in range(1, n + 1):
        t = i / n
        a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3
        out.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return out


def scallop(p, q, depth, n):
    """A concave cut from finger point p to q: a quadratic arc bulging up into the wing by depth x the chord."""
    mx, my = (p[0] + q[0]) / 2, (p[1] + q[1]) / 2
    dx, dy = q[0] - p[0], q[1] - p[1]
    L = math.hypot(dx, dy)
    nx, ny = -dy / L, dx / L                      # left of p->q: into the wing (the outline runs clockwise)
    if ny < 0:
        nx, ny = -nx, -ny
    c = (mx + nx * depth * L * 2, my + ny * depth * L * 2)
    out = []
    for i in range(1, n + 1):
        t = i / n
        out.append(((1 - t) ** 2 * p[0] + 2 * (1 - t) * t * c[0] + t * t * q[0],
                    (1 - t) ** 2 * p[1] + 2 * (1 - t) * t * c[1] + t * t * q[1]))
    return out


def half_outline(fine=1):
    """The right half's outline, clockwise from the top of the head (x = 0) to the bottom of the belly (x = 0)."""
    n = lambda k: max(2, int(round(k * fine)))
    h = SPAN / 2
    top, ear_in, ear_tip, ear_out = (0.0, 0.0335), (0.0095, 0.0365), (0.0215, 0.0640), (0.0315, 0.0262)
    shoulder, wrist, tip = (0.0318, 0.0105), (0.0700, 0.0400), (h, 0.0255)
    f1, f2, f3, hip, belly = (0.1010, -0.0060), (0.0745, -0.0185), (0.0475, -0.0170), (0.0290, -0.0135), (0.0, -0.0345)
    pts = [top]
    pts += bezier(top, (0.0040, 0.0335), (0.0075, 0.0345), ear_in, n(3))
    pts += bezier(ear_in, (0.0135, 0.0470), (0.0175, 0.0580), ear_tip, n(6))           # the ear's inside edge
    pts += bezier(ear_tip, (0.0255, 0.0560), (0.0310, 0.0420), ear_out, n(6))           # its outside edge
    pts += bezier(ear_out, (0.0335, 0.0210), (0.0330, 0.0150), shoulder, n(3))          # the side of the head
    pts += bezier(shoulder, (0.0420, 0.0240), (0.0560, 0.0390), wrist, n(6))            # the leading edge up to the wrist
    pts += bezier(wrist, (0.0850, 0.0410), (0.1080, 0.0350), tip, n(7))                 # and out to the tip
    pts += scallop(tip, f1, 0.17, n(6))
    pts += scallop(f1, f2, 0.17, n(6))
    pts += scallop(f2, f3, 0.15, n(6))
    pts += scallop(f3, hip, 0.12, n(4))
    pts += bezier(hip, (0.0260, -0.0260), (0.0150, -0.0345), belly, n(6))               # the round belly
    return pts


# ---- The card ---------------------------------------------------------------------------------------------------------
def fold_matrix(side):
    """Turns one half (side +1: x > 0) forward about the crease, the y axis on the card's front face."""
    pivot = Vector((0.0, 0.0, CARD / 2))
    rot = Matrix.Rotation(-side * FOLD, 4, 'Y')       # +x turns towards +z for the right half
    return Matrix.Translation(pivot) @ rot @ Matrix.Translation(-pivot)


def card_geometry(fine=1):
    """The cut card as one closed solid (front z = +CARD/2, back -CARD/2), creased at x = 0: verts (World frame), faces."""
    right = half_outline(fine)
    crease = [(0.0, y) for y in (right[-1][1] + (right[0][1] - right[-1][1]) * k / 8 for k in range(1, 8))]
    halves = []
    for side in (1, -1):
        ring = [(side * x, y) for x, y in right] + crease          # down the outline, back up the crease
        if side < 0:
            ring.reverse()                                        # keep both rings the same way round (clockwise)
        halves.append((side, ring))
    verts, faces, index = [], [], {}

    def vid(x, y, z, side):
        key = (round(x, 7), round(y, 7), round(z, 7))
        if key not in index:
            p = Vector((x, y, z))
            if abs(x) > 1e-9:
                p = fold_matrix(1 if x > 0 else -1) @ p
            index[key] = len(verts)
            verts.append((p.x, p.y, p.z))
        return index[key]

    for side, ring in halves:
        tris = tessellate_polygon([[Vector((x, y, 0)) for x, y in ring]])
        for z, flip in ((CARD / 2, False), (-CARD / 2, True)):
            for t in tris:
                a, b, c = (vid(ring[i][0], ring[i][1], z, side) for i in t)
                # tessellate_polygon's winding: make the front face +z and the back -z
                pa, pb, pc = (Vector((ring[i][0], ring[i][1], 0)) for i in t)
                up = (pb - pa).cross(pc - pa).z > 0
                faces.append((a, b, c) if up != flip else (a, c, b))
        # the cut edge (the outline, not the crease, which is inside the card)
        outline = ring[:len(right)] if side > 0 else ring[len(crease):]
        for i in range(len(outline) - 1):
            (x0, y0), (x1, y1) = outline[i], outline[i + 1]
            a, b = vid(x0, y0, CARD / 2, side), vid(x1, y1, CARD / 2, side)
            c, d = vid(x1, y1, -CARD / 2, side), vid(x0, y0, -CARD / 2, side)
            faces.append((a, d, c, b) if side > 0 else (a, d, c, b))
    return verts, faces


def disc(cx, cy, r, z0, z1, seg):
    """A flat round dot (a closed short cylinder) on the card's front face, before the fold: verts, faces."""
    verts = [(cx + r * math.cos(2 * math.pi * i / seg), cy + r * math.sin(2 * math.pi * i / seg), z) for z in (z0, z1) for i in range(seg)]
    verts += [(cx, cy, z0), (cx, cy, z1)]
    c0, c1 = 2 * seg, 2 * seg + 1
    faces = []
    for i in range(seg):
        j = (i + 1) % seg
        faces.append((i, j, seg + j, seg + i))
        faces.append((c1, seg + i, seg + j))
        faces.append((c0, j, i))
    return verts, faces


EYES = [(0.0118, 0.0105), (-0.0118, 0.0105)]          # the dots: on the head, either side of the crease
PUPIL = (-0.0016, -0.0019)                             # each pupil a little down and towards the crease


def eye_geometry(seg):
    """The white dots and their pupils, each folded with its own half: (dots verts, faces), (pupils verts, faces)."""
    out = {'dots': ([], []), 'pupils': ([], [])}
    for x, y in EYES:
        side = 1 if x > 0 else -1
        m = fold_matrix(side)
        for key, (cx, cy, r, z0, z1) in (('dots', (x, y, EYE_R, CARD / 2 - 0.0001, CARD / 2 + DOT)),
                                          ('pupils', (x + side * PUPIL[0], y + PUPIL[1], PUPIL_R, CARD / 2 + DOT - 0.0001, CARD / 2 + DOT + 0.00015))):
            v, f = disc(cx, cy, r, z0, z1, seg)
            vs, fs = out[key]
            base = len(vs)
            vs.extend(tuple(m @ Vector(p)) for p in v)
            fs.extend(tuple(base + i for i in face) for face in f)
    return out['dots'], out['pupils']


def blender(v):
    """World (x, y up, z front) to Blender (x, -y front, z up); the glTF exporter turns it back (export_yup)."""
    return (v[0], -v[2], v[1])


def material(name, hexa, rough, sheen=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*lin(hexa), 1.0)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = 0.0
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.35
    m.diffuse_color = (*lin(hexa), 1.0)
    m.use_backface_culling = True
    return m


def build(detail='phone', collection=None):
    """Builds the bat into the current scene under an empty named after the card. detail 'phone' (the GLB) or 'render'
    (the sticker: the same outline and dots, finer curves). Returns {root, objects, report}; World frame, lowest y = 0."""
    fine, seg = (1, 16) if detail == 'phone' else (4, 48)
    scene = bpy.context.scene
    col = collection or scene.collection
    mats = {'card': material('card', COLOURS['card'], 0.62), 'paper': material('paper', COLOURS['paper'], 0.75)}
    card_v, card_f = card_geometry(fine)
    (dot_v, dot_f), (pup_v, pup_f) = eye_geometry(seg)
    low = min(v[1] for v in card_v)
    back = min(v[2] for v in card_v)                       # the back of the crease
    lift = lambda vs: [(x, y - low, z - back) for x, y, z in vs]
    root = bpy.data.objects.new(NAME, None)
    col.objects.link(root)
    root['asset'] = NAME
    root['maker'] = 'Cut by hand from black card at Sakura Shōten (a stencil, scissors, a hole punch for the eyes)'
    root['colours'] = json.dumps(COLOURS)
    parts = [('Paper bat card', card_v, card_f, 'card', 'decoration', 'the black card, cut and creased down the middle'),
             ('Paper bat eyes', dot_v, dot_f, 'paper', 'decoration', 'two white paper dots glued on'),
             ('Paper bat pupils', pup_v, pup_f, 'card', 'decoration', 'the pupils, drawn on the dots in black marker')]
    objects, report_parts, allv = [], [], []
    for name, vs, fs, mat, role, note in parts:
        vs = lift(vs)
        allv += vs
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata([blender(v) for v in vs], [], fs)
        mesh.update()
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(mesh)
        bm.free()
        for p in mesh.polygons:
            p.use_smooth = False
        mesh.materials.append(mats[mat])
        obj = bpy.data.objects.new(name, mesh)
        obj['role'] = role
        obj['note'] = note
        obj.parent = root
        col.objects.link(obj)
        objects.append(obj)
        tris = sum(len(f) - 2 for f in fs)
        report_parts.append({'name': name, 'material': mat, 'role': role, 'triangles': tris, 'note': note})
    lo = [min(v[i] for v in allv) for i in range(3)]
    hi = [max(v[i] for v in allv) for i in range(3)]
    crease_top = max(v[1] for v in lift(card_v) if abs(v[0]) < 1e-6)
    # the card's centre of mass: its front face's triangles, by area (the card is the same thickness everywhere)
    lv, mass, centre = lift(card_v), 0.0, Vector((0, 0, 0))
    for fc in card_f:
        if len(fc) == 3:
            a, b, c = (Vector(lv[i]) for i in fc)
            area = (b - a).cross(c - a).length / 2
            mass += area
            centre += (a + b + c) / 3 * area
    centre /= mass
    tip = max(lift(card_v), key=lambda v: v[0])
    report = {
        'name': NAME, 'detail': detail, 'real': REAL, 'colours': COLOURS, 'parts': report_parts, 'back': 'z = 0 (min z)',
        'size': [round(hi[i] - lo[i], 4) for i in range(3)],
        'min': [round(v, 4) for v in lo], 'max': [round(v, 4) for v in hi],
        'triangles': sum(p['triangles'] for p in report_parts), 'materials': len(mats),
        'anchors': {
            'hang': [0.0, round(crease_top, 4), 0.0],                 # the thread's pinhole: the top of the crease
            'balance': [0.0, round(centre.y, 4), round(centre.z, 4)],
            'eyes': [0.0, round(EYES[0][1] - low, 4), round(CARD / 2 + DOT - back, 4)],
            'wing-tip-left': [round(tip[0], 4), round(tip[1], 4), round(tip[2], 4)],
            'wing-tip-right': [round(-tip[0], 4), round(tip[1], 4), round(tip[2], 4)],
        },
    }
    root['anchors'] = json.dumps(report['anchors'])
    return {'root': root, 'objects': objects, 'report': report}


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = 'METRIC'
    made = build('phone')
    out = HERE / 'model.glb'
    bpy.ops.export_scene.gltf(filepath=str(out), export_format='GLB', export_yup=True, export_apply=True,
                              export_extras=True, export_normals=True, export_vertex_color='NONE',
                              export_animations=False, export_materials='EXPORT', export_image_format='AUTO')
    (HERE / 'build-report.json').write_text(json.dumps(made['report'], indent=1, ensure_ascii=False) + '\n')
    print('triangles', made['report']['triangles'], 'size', made['report']['size'])


if __name__ == '__main__':
    main()
