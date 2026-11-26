"""Sakura's restroom sanitary ware, redrawn in Blender from the CAD solids, in metres.

  blender -b --python tools/blender/build-sakura-restroom.py -- --root . [--render]
  python tools/blender/build-sakura-restroom.py --root . [--render]        (bpy 5.x from pip)

Reads art/sakura-restroom/cad/parts.json and its STL parts (tools/cad/build-sakura-restroom-cad.py). For each part:
welds the CAD triangles, brings it to its triangle budget, marks the hard edges and weights the normals so the
fillets shade round and the flats stay flat, then gives it its finish. Parts that share a finish and never move are
one mesh; the flush lever and the tap's cross head keep their own, with the origin on their spindle.

Each fixture is a root (Toilet, Washbasin) with its origin on the floor at the wall and its front to Blender -Y, which
is +Z in the exported glTF. Writes assets/models/sakura-restroom/sakura-restroom-fixtures.glb, the .blend beside the CAD,
a report, and with --render the review stills (Cycles).
"""
import argparse
import json
import math
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument('--root', default='.')
ap.add_argument('--render', action='store_true')
args = ap.parse_args(argv)
ROOT = Path(args.root).resolve()
CAD = ROOT / 'art/sakura-restroom/cad'
OUT = ROOT / 'assets/models/sakura-restroom'
REVIEW = ROOT / 'art/sakura-restroom/review'
PARTS = json.loads((CAD / 'parts.json').read_text())
SPEC = json.loads((ROOT / 'art/sakura-restroom/spec.json').read_text())

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1.0

# Finishes. Chrome keeps the room's own values (sakura-restroom.js) so old and new fittings match.
FINISH = {
    'Porcelain': dict(colour=(.925, .915, .88), roughness=.16, metallic=0),
    'SeatPlastic': dict(colour=(.955, .945, .915), roughness=.34, metallic=0),
    'Chrome': dict(colour=(.56, .60, .64), roughness=.22, metallic=.85),
    'CoverPink': dict(colour=(.90, .50, .57), roughness=.96, metallic=0),
    'Water': dict(colour=(.50, .70, .72), roughness=.04, metallic=0),
    'IndexBlue': dict(colour=(.05, .22, .62), roughness=.3, metallic=0),
}
# Thuan's terry covers on the seat and the lid (spec.json decor): the ware is drawn bare in CAD, dressed here.
COVERED = {'Seat': 'CoverPink', 'Lid': 'CoverPink'}
# Drawn in CAD but never seen: the buffers are under the seat, the trap's throat under the water.
UNSEEN = {'SeatBuffers', 'Sump'}
# Triangles a part may spend. A phone draws the whole room; the curves that are looked at get the most.
BUDGET = {'Bowl': 4400, 'Seat': 2600, 'Lid': 1500, 'Tank': 900, 'TankLid': 2000, 'Spout': 1500, 'StopValve': 900, 'Hinge': 300,
          'DishDrain': 120, 'LeverBoss': 160, 'FlushLever': 300, 'Water': 80,
          'Basin': 1600, 'Pedestal': 1100, 'Tap': 1500, 'TapHandle': 1500, 'Waste': 220, 'TapIndex': 60}
# What is joined into one mesh: static parts of one finish.
JOIN = {'toilet': {'ToiletChrome': ['Spout', 'DishDrain', 'LeverBoss', 'StopValve'], 'ToiletLid': ['Lid', 'Hinge']},
        'washbasin': {'BasinChrome': ['Tap', 'Waste'], 'TapHandle': ['TapHandle', 'TapIndex']}}
ROOTS = {'toilet': 'Toilet', 'washbasin': 'Washbasin'}
# CAD frame (wall Y=0, front +Y, mm) to the fixture's Blender frame (front -Y, m): half a turn about Z.
TO_BLENDER = Matrix.Rotation(math.pi, 4, 'Z') @ Matrix.Scale(.001, 4)


def material(name):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    f = FINISH[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*f['colour'], 1)
    b.inputs['Roughness'].default_value = f['roughness']
    b.inputs['Metallic'].default_value = f['metallic']
    return m


def load(fixture, rec):
    before = set(bpy.data.objects)
    bpy.ops.wm.stl_import(filepath=str(CAD / rec['stl']))
    obj = (set(bpy.data.objects) - before).pop()
    obj.name = obj.data.name = rec['part']
    mesh = obj.data
    mesh.transform(TO_BLENDER)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=2e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    cad_triangles = len(mesh.polygons)
    budget = BUDGET[rec['part']]
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    if cad_triangles > budget:
        d = obj.modifiers.new('budget', 'DECIMATE')
        d.ratio = budget / cad_triangles
        bpy.ops.object.modifier_apply(modifier=d.name)
    for p in mesh.polygons:
        p.use_smooth = True
    # Glazed ware has no hard edge but where two faces meet squarely; turned metal keeps its shoulders.
    mesh.set_sharp_from_angle(angle=math.radians(38 if rec['finish'] in ('Chrome', 'IndexBlue') else 52))
    w = obj.modifiers.new('weighted', 'WEIGHTED_NORMAL')
    w.keep_sharp = True
    w.weight = 60
    bpy.ops.object.modifier_apply(modifier=w.name)
    mesh.materials.clear()
    mesh.materials.append(material(COVERED.get(rec['part'], rec['finish'])))
    obj['cadPart'] = f"{fixture}/{rec['part']}"
    obj['cadTriangles'] = cad_triangles
    return obj


def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = o.data.name = name
    return o


def set_origin(obj, point):
    """Moves the object's origin to `point` (fixture frame) without moving its surface."""
    obj.data.transform(Matrix.Translation(-point))
    obj.location = point


report = {'source': 'Original Johansson Town geometry: CAD solids redrawn in Blender', 'generator': 'tools/blender/build-sakura-restroom.py',
          'cad': 'tools/cad/build-sakura-restroom-cad.py', 'blender': bpy.app.version_string, 'units': 'metres', 'fixtures': {}}
roots = {}
for fixture, records in (('toilet', PARTS['toilet']), ('washbasin', PARTS['washbasin'])):
    root = bpy.data.objects.new(ROOTS[fixture], None)
    bpy.context.collection.objects.link(root)
    root['authoringSource'] = 'tools/blender/build-sakura-restroom.py'
    root['drawing'] = SPEC['drawing']
    root['who'] = SPEC[fixture]['who']
    root['why'] = SPEC[fixture]['why']
    roots[fixture] = root
    byPart = {r['part']: r for r in records if r['part'] not in UNSEEN}
    made = {name: load(fixture, r) for name, r in byPart.items()}
    grouped = set()
    final = []
    for name, members in JOIN[fixture].items():
        final.append(join([made[m] for m in members], name))
        grouped.update(members)
    final += [o for n, o in made.items() if n not in grouped]
    for rec in records:
        if 'pivot' in rec:
            o = bpy.data.objects[rec['part']]
            set_origin(o, (TO_BLENDER @ Vector(rec['pivot'])))
            o['pivotAxisCad'] = rec['axis']
    entry = {}
    for o in final:
        o.parent = root
        o.data.calc_loop_triangles()
        entry[o.name] = {'triangles': len(o.data.loop_triangles), 'materials': [m.name for m in o.data.materials]}
    lo = Vector((1e9,) * 3)
    hi = Vector((-1e9,) * 3)
    for o in final:
        for c in o.bound_box:
            v = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, v))
            hi = Vector(map(max, hi, v))
    report['fixtures'][ROOTS[fixture]] = {'meshes': entry, 'triangles': sum(e['triangles'] for e in entry.values()),
                                           'size_m': [round(hi[i] - lo[i], 4) for i in range(3)],
                                           'min_m': [round(v, 4) for v in lo], 'max_m': [round(v, 4) for v in hi]}

OUT.mkdir(parents=True, exist_ok=True)
glb = OUT / 'sakura-restroom-fixtures.glb'
bpy.ops.wm.save_as_mainfile(filepath=str(CAD.parent / 'sakura-restroom-fixtures.blend'), compress=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(glb), export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                          export_extras=True, export_cameras=False, export_lights=False, export_animations=False)
report['glb'] = {'path': str(glb.relative_to(ROOT)), 'bytes': glb.stat().st_size}
report['triangles'] = sum(f['triangles'] for f in report['fixtures'].values())
(CAD.parent / 'blender-report.json').write_text(json.dumps(report, indent=1) + '\n')
print(json.dumps({k: v['triangles'] for k, v in report['fixtures'].items()}), report['glb'])

if args.render:
    REVIEW.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 40
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 880, 880
    scene.view_settings.view_transform = 'Standard'
    # The room they stand in: the toilet on its wall, the basin on the wall to its right, as in the shop.
    roots['washbasin'].location = (1.645, -.70, 0)
    roots['washbasin'].rotation_euler = (0, 0, math.radians(-90))

    def plane(name, size, loc, rot, colour, rough=.5):
        bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
        o = bpy.context.object
        o.name = name
        o.scale = (*size, 1)
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*colour, 1)
        m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = rough
        o.data.materials.append(m)
        return o
    plane('Floor', (6, 6), (0, -1, 0), (0, 0, 0), (.42, .45, .44))
    plane('Wall', (6, 3), (0, 0, 1.5), (math.radians(90), 0, 0), (.72, .82, .77), .4)
    plane('SideWall', (6, 3), (1.645, -1, 1.5), (math.radians(90), 0, math.radians(90)), (.72, .82, .77), .4)
    world = bpy.data.worlds.new('Review')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (.9, .92, .95, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = .35
    scene.world = world
    for loc, energy, size in (((-.9, -2.2, 2.3), 34, 1.6), ((1.2, -1.6, 2.5), 18, 1.2)):
        light = bpy.data.lights.new('Key', 'AREA')
        light.energy = energy
        light.size = size
        lo = bpy.data.objects.new('Key', light)
        lo.location = loc
        bpy.context.collection.objects.link(lo)
        lo.rotation_euler = (Vector((0, -.4, .5)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera'))
    bpy.context.collection.objects.link(cam)
    scene.camera = cam
    shots = {
        'toilet-three-quarter': ((-1.15, -1.75, 1.25), (0, -.36, .47), 42),
        'toilet-side': ((-2.2, -.38, .55), (0, -.38, .47), 50),
        'toilet-above': ((.25, -1.25, 1.75), (0, -.35, .45), 40),
        'cistern-spout-and-lever': ((-.62, -.66, 1.10), (-.04, -.12, .80), 55),
        'washbasin-three-quarter': ((.55, -1.7, 1.45), (1.48, -.70, .72), 45),
        'washbasin-tap': ((1.12, -1.05, 1.16), (1.56, -.70, .90), 70),
    }
    for name, (at, look, lens) in shots.items():
        cam.location = at
        cam.data.lens = lens
        cam.rotation_euler = (Vector(look) - Vector(at)).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(REVIEW / f'{name}.png')
        bpy.ops.render.render(write_still=True)
