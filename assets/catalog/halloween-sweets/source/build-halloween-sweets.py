"""Wrapped sweets: a mound of twist-wrapped boiled sweets, built in Blender for Johansson World and Johansson Studio.

    python3 johansson-town/assets/catalog/halloween-sweets/source/build-halloween-sweets.py
    (Blender as a Python module, `pip install bpy`; or: blender --background --python <this file>)

Writes next to this file:
    model.glb           the model Johansson Studio checks, exports and publishes into World's catalogue
                        (town-studio/assets/halloween-sweets/model.glb is a copy of it)
    build-report.json   the measurements, every sweet's place (its full transform), the triangles, the anchors

The Pocket Camera's Halloween sticker (tools/blender/render-halloween-stickers.py) builds the same mound with `build()`
from the places recorded in build-report.json (`plan_from_report()`), so the camera and World show the same sweets.

What they are. The children's Halloween walk on Sakura Street is for collecting sweets (src/world/halloween.js); Sakura
Shōten sells boiled fruit sweets by the bag (its "Fruit sweets", src/commerce/products-data.js `candy`) and tips a few
bags out in a mound on the lid of the middle stack of drinks crates by its machine, between the two jack-o'-lantern
pails, at a child's reach (58 cm), where the walk passes: enough for the whole walk, and to be seen from the street.
Each sweet is a boiled fruit drop about 19 mm long, 14 mm wide and 10 mm thick in a cellophane wrapper twisted at both
ends, the twists fanned out: about 3 cm from fan to fan. Four colours of wrapper: orange, grape purple, melon green and
white.

The mound. 41 sweets: six strays that rolled out across the lid, nine in a skirt round the pile, and twenty-six tipped
onto the middle. Each is dropped from above and lowered until it touches the lid or a sweet already there, turned (up
to 28 degrees) and let roll or slide (up to 12 mm) to wherever it settles lowest, so none floats, none passes into
another and none is left perched where it would slide off; 0.4 mm is left at every contact. The contact is found with
rays on a medium surface, proved there (raised half a millimetre at a time until clear) and then on the sticker's fine
surface (a tenth of a millimetre at a time). About 25 cm across and 5.7 cm high, on a 0.40 x 0.44 m lid; the places
come from a fixed seed, so every build makes the same mound.

The phone's sweets are simple (a hexagon round, 72 triangles each: 2952 for the mound) and the sticker's fine (48 round).
The simple ones lie a little inside the fine ones (their corners on its surface), so in the phone's model each is then
let down, lowest first, until it rests on the lid or on the simple sweets below it (`phoneDrop` in the report: up to
6.5 mm at the top of the pile, where the small differences add up).

Its frame (World's catalogue): metres, y up, the front +z, x = 0 and z = 0 the middle of the mound, its lowest point at
y = 0: the lid it rests on.

One material, `cellophane` (glossy), with the wrappers' colours in the vertex colours (COLOR_0): one draw call.
"""
import bpy, json, math, random
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

HERE = Path(__file__).resolve().parent
NAME = 'Wrapped sweets'

COLOURS = {
    'orange': '#f28a1e',    # orange
    'purple': '#8a55b8',    # grape (near the witch hat's band, #7d4fa8)
    'green': '#8fcf3a',     # melon
    'white': '#f4f1ea',     # white
}
REAL = {
    'sweet': 'a boiled fruit drop 19 x 14 x 10 mm in clear-coloured cellophane, twisted at both ends; 30 mm fan to fan',
    'mound': '41 sweets (a few 90 g bags tipped out): a pile of 26, a skirt of 9 and 6 strays, about 25 cm across, 5.7 cm high',
    'lid': 'the drinks crate lid it lies on: 0.40 x 0.44 m',
}
COUNT, STRAYS, SKIRT, SEED = 41, 6, 9, 1997
CLEAR = 0.0004         # left at every contact
TILTS = [-28, -14, 0, 14, 28]
SLIDE = 0.012          # how far a sweet may roll or slide from where it lands, to settle lower
NUDGES = [(0.0, 0.0)] + [(r * math.cos(2 * math.pi * (k + 0.5 * (j % 2)) / n), r * math.sin(2 * math.pi * (k + 0.5 * (j % 2)) / n))
                         for j, (r, n) in enumerate(((SLIDE / 3, 6), (2 * SLIDE / 3, 8), (SLIDE, 10))) for k in range(n)]


def lin(hexa):
    c = [int(hexa[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


# ---- One sweet, in its own frame: the long axis x, its thickness y, its width z --------------------------------------
FAN = [(0.0094, 0.0034, 0.0046, 0.04, 0.0), (0.0099, 0.0024, 0.0031, 0.03, 0.05), (0.0104, 0.0014, 0.0016, 0.0, 0.1),
       (0.0108, 0.0012, 0.0014, 0.0, 0.14), (0.0114, 0.0012, 0.0030, 0.07, 0.18), (0.0122, 0.0013, 0.0048, 0.12, 0.22),
       (0.0132, 0.0015, 0.0064, 0.16, 0.26), (0.0142, 0.0017, 0.0076, 0.19, 0.28), (0.0150, 0.0019, 0.0084, 0.20, 0.3)]
DETAIL = {   # round: points round each ring; body: the rings along the drop (fractions of its half-length); fan: FAN's rings
    'phone': (6, [-0.38, 0.38], [2, 8]),          # a hexagon with a corner on top and below: as thick as the fine sweet
    'probe': (12, [-0.56, 0.0, 0.56], [0, 2, 6, 8]),
    'render': (48, [-0.93, -0.84, -0.72, -0.56, -0.38, -0.19, 0.0, 0.19, 0.38, 0.56, 0.72, 0.84, 0.93], list(range(9))),
}


def rings(detail):
    """The sweet's rings from one fan's edge to the other: (x, half-thickness, half-width, crinkle, twist). Every
    detail takes its rings and its points round them from the render's, so a coarser sweet lies inside a finer one."""
    a = 0.0095                                    # the drop's half-length inside the wrapper
    _, body, fan = DETAIL[detail]
    out = []
    for u in body:                                # a rounded pillow: a superellipse along its length
        k = (1 - abs(u) ** 2.6) ** (1 / 2.6)
        out.append((u * a, 0.0052 * k, 0.0072 * k, 0.0, 0.0))
    ends = [FAN[i] for i in fan]
    return [(-x, ry, rz, c, -t) for x, ry, rz, c, t in reversed(ends)] + out + ends


def sweet_mesh(detail):
    """A twist-wrapped sweet: verts, faces, and a colour weight per vertex (0 the wrapper over the drop, up to 1 for the
    paler fans). Closed: a point caps each fan."""
    N = DETAIL[detail][0]
    R = rings(detail)
    verts, weights = [], []
    turn = math.pi / 2 if detail == 'phone' else 0.0   # the phone's hexagon: corners at the top and the bottom
    for x, ry, rz, c, twist in R:
        for i in range(N):
            phi = 2 * math.pi * i / N + turn
            k = 1 + c * math.sin(5 * phi + 1.3 * math.copysign(1, x))
            y, z = ry * math.sin(phi) * k, rz * math.cos(phi) * k
            ct, st = math.cos(twist), math.sin(twist)            # the fans turned about the long axis: the twist
            verts.append((x, y * ct - z * st, y * st + z * ct))
            weights.append(min(1.0, abs(x) / 0.0150) if abs(x) > 0.0094 else 0.0)
    cap_l, cap_r = len(verts), len(verts) + 1
    verts += [(R[0][0] - 0.0004, 0.0, 0.0), (R[-1][0] + 0.0004, 0.0, 0.0)]
    weights += [1.0, 1.0]
    faces = []
    for r in range(len(R) - 1):
        for i in range(N):
            j = (i + 1) % N
            faces.append((r * N + i, r * N + j, (r + 1) * N + j, (r + 1) * N + i))
    last = (len(R) - 1) * N
    for i in range(N):
        j = (i + 1) % N
        faces.append((cap_l, j, i))
        faces.append((cap_r, last + i, last + j))
    return verts, faces, weights


# ---- The mound --------------------------------------------------------------------------------------------------------
def placed(verts, m):
    return [tuple(m @ Vector(v)) for v in verts]


def plan_points():
    """Where each sweet is dropped and how it is turned, from a fixed seed: a few strays that rolled far, then the skirt
    round the pile, then the pile itself, each nearer the middle than the last. Returns [(x, z, yaw degrees, colour)]."""
    rnd = random.Random(SEED)
    points = []
    for i in range(STRAYS):
        a = 2 * math.pi * (i + 0.35 * rnd.random()) / STRAYS
        r = 0.110 + 0.020 * rnd.random()
        points.append((r * math.cos(a), r * math.sin(a)))
    for i in range(SKIRT):
        a = 2 * math.pi * (i + 0.8 * rnd.random()) / SKIRT + 0.4
        r = 0.050 + 0.035 * rnd.random()
        points.append((r * math.cos(a), r * math.sin(a)))
    pile = COUNT - STRAYS - SKIRT
    for i in range(pile):
        r = 0.044 * math.sqrt(rnd.random()) * (1 - 0.8 * i / pile)
        a = 2 * math.pi * rnd.random()
        points.append((r * math.cos(a), r * math.sin(a)))
    colours = []                                  # every four in a row are the four colours, in a shuffled order
    while len(colours) < COUNT:
        four = list(COLOURS)
        rnd.shuffle(four)
        colours += four
    colours = colours[:COUNT]
    return [(x, z, rnd.uniform(0, 180), c) for (x, z), c in zip(points, colours)]


def heap():
    """Drops the sweets: each one's transform (World frame, before the mound is centred) and colour."""
    probe_v, probe_f, _ = sweet_mesh('probe')
    fine_v, fine_f, _ = sweet_mesh('render')
    down, up = Vector((0, -1, 0)), Vector((0, 1, 0))
    out, scene_tree = [], None

    def near(lo, hi):
        return [o for o in out if o['lo'][0] < hi[0] and o['hi'][0] > lo[0] and o['lo'][1] < hi[1] and o['hi'][1] > lo[1]]

    for x, z, yaw, colour in plan_points():
        best = None
        for a in TILTS:
            for b in TILTS:
                rot = Matrix.Rotation(math.radians(yaw), 4, 'Y') @ Matrix.Rotation(math.radians(a), 4, 'Z') @ Matrix.Rotation(math.radians(b), 4, 'X')
                local = [rot @ Vector(v) for v in probe_v]
                ymin = min(v.y for v in local)
                for dx, dz in NUDGES:
                    cx, cz = x + dx, z + dz
                    lo = (min(v.x for v in local) + cx, min(v.z for v in local) + cz)
                    hi = (max(v.x for v in local) + cx, max(v.z for v in local) + cz)
                    others = near(lo, hi)
                    start = max([0.0] + [o['top'] for o in others]) + 0.004 - ymin
                    moving = [Vector((v.x + cx, v.y + start, v.z + cz)) for v in local]
                    drop = min(v.y for v in moving)                      # to the lid
                    if others:
                        for v in moving:                                 # its points down onto the sweets below
                            hit = scene_tree.ray_cast(v, down, drop)
                            if hit[0] is not None:
                                drop = min(drop, hit[3])
                        tree = BVHTree.FromPolygons(moving, probe_f)
                        for o in others:                                 # their points up into it
                            for q in o['probe']:
                                if lo[0] <= q.x <= hi[0] and lo[1] <= q.z <= hi[1]:
                                    hit = tree.ray_cast(q, up, drop)
                                    if hit[0] is not None:
                                        drop = min(drop, hit[3])
                    y = start - drop + CLEAR
                    # a thin fan can slip between the rays: prove the place on the probe surface, raising it until clear
                    trees = [o['tree'] for o in others]
                    for _ in range(80):
                        test = BVHTree.FromPolygons([Vector((v.x + cx, v.y + y, v.z + cz)) for v in local], probe_f)
                        if not any(test.overlap(t) for t in trees):
                            break
                        y += 0.0005
                    centre = y + sum(v.y for v in local) / len(local)
                    if best is None or centre < best[0] - 1e-7:
                        best = (centre, Matrix.Translation((cx, y, cz)) @ rot, (a, b), lo, hi)
        _, m, tilt, lo, hi = best
        # proved on the fine surface: raised a tenth of a millimetre at a time until it touches nothing
        fine_trees = [o['fine'] for o in near(lo, hi)]
        for _ in range(100):
            fine = BVHTree.FromPolygons(placed(fine_v, m), fine_f)
            if min(v[1] for v in placed(fine_v, m)) >= 0 and not any(fine.overlap(t) for t in fine_trees):
                break
            m = Matrix.Translation((0, 0.0001, 0)) @ m
        else:
            raise RuntimeError('a sweet could not be set down clear of the others')
        probe = [m @ Vector(v) for v in probe_v]
        out.append({'matrix': m, 'colour': colour, 'tilt': tilt, 'yaw': yaw, 'probe': probe, 'fine': fine,
                    'tree': BVHTree.FromPolygons(probe, probe_f),
                    'top': max(v.y for v in probe), 'lo': lo, 'hi': hi})
        allv = [p for o in out for p in o['probe']]
        allf = [tuple(i * len(probe_v) + k for k in f) for i in range(len(out)) for f in probe_f]
        scene_tree = BVHTree.FromPolygons(allv, allf)
    return [{'matrix': o['matrix'], 'colour': o['colour'], 'tilt': o['tilt'], 'yaw': o['yaw']} for o in out]


def settle(sweets, sv, sf, step=0.0001, most=0.01):
    """The phone's simpler sweets lie a little inside the fine ones (where a hexagon cuts a curve), so at their places
    they would hang a little above what holds them: each is let down, lowest first, until it rests on the lid
    or on the simple sweets below (0.1 mm left). Returns each sweet's matrix for the phone."""
    mats = [s['matrix'].copy() for s in sweets]
    trees = [BVHTree.FromPolygons(placed(sv, m), sf) for m in mats]
    for i in sorted(range(len(mats)), key=lambda k: mats[k].translation.y):
        others = [t for j, t in enumerate(trees) if j != i]
        down = 0.0
        while down < most:
            m = Matrix.Translation((0, -(down + step), 0)) @ mats[i]
            vs = placed(sv, m)
            if min(v[1] for v in vs) < 0 or any(BVHTree.FromPolygons(vs, sf).overlap(t) for t in others):
                break
            down += step
        down = max(0.0, down - step)
        mats[i] = Matrix.Translation((0, -down, 0)) @ mats[i]
        trees[i] = BVHTree.FromPolygons(placed(sv, mats[i]), sf)
        sweets[i]['phoneDrop'] = round(down, 5)
    return mats


def plan_from_report(path=None):
    """The mound as the last build recorded it (build-report.json): the same sweets in the same places."""
    report = json.loads(Path(path or HERE / 'build-report.json').read_text())
    return [{'matrix': Matrix([s['matrix'][i * 4:i * 4 + 4] for i in range(4)]), 'colour': s['colour'],
             'tilt': tuple(s['tilt']), 'yaw': s['yaw']} for s in report['sweets']]


def blender(v):
    return (v[0], -v[2], v[1])


def material(detail):
    """`cellophane`: white, glossy, coloured by the vertex colours (the GLB); the sticker's is clearer and shinier."""
    m = bpy.data.materials.get('cellophane') or bpy.data.materials.new('cellophane')
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (1.0, 1.0, 1.0, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.22
    bsdf.inputs['Metallic'].default_value = 0.0
    if detail != 'phone':
        attr = nt.nodes.new('ShaderNodeVertexColor')
        attr.layer_name = 'Color'
        nt.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
        bsdf.inputs['Roughness'].default_value = 0.16
        bsdf.inputs['Specular IOR Level'].default_value = 0.75
        bsdf.inputs['Coat Weight'].default_value = 1.0
        bsdf.inputs['Coat Roughness'].default_value = 0.04
        bsdf.inputs['Subsurface Weight'].default_value = 0.18
        bsdf.inputs['Subsurface Radius'].default_value = (0.004, 0.003, 0.002)
    m.use_backface_culling = True
    return m


def build(detail='phone', collection=None, plan=None):
    """Builds the heap into the current scene under an empty named after the card. detail 'phone' (the GLB) or
    'render' (the stickers: the same sweets in the same places, finer). Returns {root, objects, report}; World frame,
    lowest y = 0 (the crate lid), the heap centred on x = z = 0."""
    scene = bpy.context.scene
    col = collection or scene.collection
    sweets = plan or heap()
    sv, sf, sw = sweet_mesh(detail)
    matrices = settle(sweets, sv, sf) if detail == 'phone' else [s['matrix'] for s in sweets]
    verts, faces, cols = [], [], []
    for s, m in zip(sweets, matrices):
        base = len(verts)
        verts += placed(sv, m)
        faces += [tuple(base + i for i in f) for f in sf]
        c = lin(COLOURS[s['colour']])
        cols += [tuple(min(1.0, ch * (1 - 0.2 * w) + 0.2 * w) for ch in c) for w in sw]   # the fans paler
    low = min(v[1] for v in verts)
    cx = (min(v[0] for v in verts) + max(v[0] for v in verts)) / 2
    cz = (min(v[2] for v in verts) + max(v[2] for v in verts)) / 2
    verts = [(x - cx, y - low, z - cz) for x, y, z in verts]
    root = bpy.data.objects.new(NAME, None)
    col.objects.link(root)
    root['asset'] = NAME
    root['maker'] = 'Boiled fruit drops in twisted cellophane, from the bag Sakura Shōten sells (its Fruit sweets)'
    root['colours'] = json.dumps(COLOURS)
    mesh = bpy.data.meshes.new('Wrapped sweets')
    mesh.from_pydata([blender(v) for v in verts], [], faces)
    mesh.update()
    attr = mesh.color_attributes.new('Color', 'FLOAT_COLOR', 'POINT')
    for i, c in enumerate(cols):
        attr.data[i].color = (*c, 1.0)
    mesh.color_attributes.active_color = attr
    for p in mesh.polygons:
        p.use_smooth = True
    mesh.materials.append(material(detail))
    obj = bpy.data.objects.new('Wrapped sweets', mesh)
    obj['role'] = 'decoration'
    obj['note'] = f'{len(sweets)} boiled sweets in twisted cellophane: orange, grape purple, melon green and white'
    obj.parent = root
    col.objects.link(obj)
    lo = [min(v[i] for v in verts) for i in range(3)]
    hi = [max(v[i] for v in verts) for i in range(3)]
    tris = sum(len(f) - 2 for f in faces)
    report = {
        'name': NAME, 'detail': detail, 'real': REAL, 'colours': COLOURS,
        'parts': [{'name': 'Wrapped sweets', 'material': 'cellophane', 'role': 'decoration', 'triangles': tris,
                   'note': obj['note']}],
        'count': len(sweets),
        'sweets': [{'colour': s['colour'], 'yaw': round(s['yaw'], 3), 'tilt': list(s['tilt']), 'phoneDrop': s.get('phoneDrop', 0.0),
                    'matrix': [round(v, 7) for row in (Matrix.Translation((-cx, -low, -cz)) @ s['matrix']) for v in row]}
                   for s in sweets],
        'size': [round(hi[i] - lo[i], 4) for i in range(3)],
        'min': [round(v, 4) for v in lo], 'max': [round(v, 4) for v in hi],
        'radius': round(max(math.hypot(x, z) for x, _, z in verts), 4),
        'triangles': tris, 'materials': 1,
        'anchors': {'top': [0.0, round(hi[1], 4), 0.0], 'rest': [0.0, 0.0, 0.0]},
        'clearance': CLEAR,
    }
    root['anchors'] = json.dumps(report['anchors'])
    return {'root': root, 'objects': [obj], 'report': report, 'plan': sweets}


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = 'METRIC'
    made = build('phone')
    bpy.ops.export_scene.gltf(filepath=str(HERE / 'model.glb'), export_format='GLB', export_yup=True, export_apply=True,
                              export_extras=True, export_normals=True, export_vertex_color='ACTIVE',
                              export_animations=False, export_materials='EXPORT', export_image_format='AUTO')
    (HERE / 'build-report.json').write_text(json.dumps(made['report'], indent=1, ensure_ascii=False) + '\n')
    print('triangles', made['report']['triangles'], 'size', made['report']['size'], 'radius', made['report']['radius'])


if __name__ == '__main__':
    main()
