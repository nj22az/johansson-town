"""Original Harbour Park bench, authored in Blender in physical metres.

Run from johansson-town:
  blender -b --python tools/blender/build-harbour-bench.py -- --root .

The design JSON is the source for the Blender model, exported glTF extras and
generated runtime dimensions. No downloaded geometry or photographic textures.
"""
import argparse
import hashlib
import json
import random
import sys
from pathlib import Path

import bpy

parser = argparse.ArgumentParser()
parser.add_argument('--root', required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
root = Path(args.root).resolve()
art = root / 'art/park'
out = root / 'assets/models/park'
out.mkdir(parents=True, exist_ok=True)
spec_path = art / 'harbour-bench-spec.json'
spec = json.loads(spec_path.read_text())

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1.0


def material(name, hex_color, roughness, metalness=0):
    value = bpy.data.materials.new(name)
    value.use_nodes = True
    shader = value.node_tree.nodes['Principled BSDF']
    color = tuple((int(hex_color[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metalness
    return value


cedar = material('Harbour / warm worn cedar', '9a6a42', .9)
wear = material('Harbour / weathered cedar edges', 'b07e50', .92)
iron = material('Harbour / dark painted iron', '303638', .62, .12)
materials = (cedar, wear, iron)


def position(at):
    return (at[0], -at[2], at[1])


def box(name, size, at, finish, bevel=.004):
    bpy.ops.mesh.primitive_cube_add(size=1, location=position(at))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(finish)
    if bevel:
        modifier = obj.modifiers.new('Rounded worn edge', 'BEVEL')
        modifier.width = min(bevel, min(size) / 3)
        modifier.segments = 1
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        modifier = obj.modifiers.new('Board face normals', 'WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


length, depth, seat_y = spec['length'], spec['seatDepth'], spec['seatHeight']
thickness = spec['seatThickness']
leg_x = length / 2 - .14
back_z = spec['backZ']

# Four straight legs leave the middle of the seat open for feet. End frames and
# stretcher are kept behind the knees; there is no solid box under the sitter.
for x in (-leg_x, leg_x):
    for z in (-depth / 2 + .055, depth / 2 - .055):
        box('Iron leg', (.055, seat_y - thickness, .055),
            (x, (seat_y - thickness) / 2, z), iron)
    box('End support rail', (.065, .045, depth + .015),
        (x, seat_y - thickness - .0225, 0), iron)
    box('Iron foot', (.095, .035, spec['footprintDepth']),
        (x, .0175, 0), iron)
    box('Backrest upright', (.05, spec['backHeight'] + .025, .05),
        (x, seat_y + spec['backHeight'] / 2 - .0125, back_z), iron)
box('Rear low stretcher', (length - .22, .04, .04),
    (0, .16, depth / 2 - .055), iron)

# Four level slats: their upper faces are exactly the runtime support plane. A
# narrow gap is decorative, so no tilted board changes the usable sitting height.
gap = .008
slat_depth = (depth - gap * 3) / 4
for i in range(4):
    z = -depth / 2 + slat_depth / 2 + i * (slat_depth + gap)
    box('Cedar seat slat %d' % (i + 1), (length, thickness, slat_depth),
        (0, seat_y - thickness / 2, z), cedar, .004)
    # Edge wear remains below the support plane and within the board footprint.
    box('Seat edge wear %d' % (i + 1), (length - .02, .006, .003),
        (0, seat_y - .007, z - slat_depth / 2 + .0015), wear, 0)

for i in range(3):
    y = seat_y + .2 + .14 * i
    box('Cedar backrest slat %d' % (i + 1), (length, .1, .04),
        (0, y, back_z), cedar, .005)
    box('Backrest worn edge %d' % (i + 1), (length - .025, .005, .003),
        (0, y + .043, back_z - .0215), wear, 0)

# Small sparse dents/grain lines, geometry only, do not modify any support face.
rng = random.Random(1972)
for i in range(12):
    box('Cedar weathering %02d' % i, (rng.uniform(.08, .24), .001, .006),
        (rng.uniform(-length * .4, length * .4), seat_y + .2 + .14 * (i % 3) + rng.uniform(-.03, .03), back_z - .0206), wear, 0)

# Flush iron bolt heads on the back, below the seat's contact surface.
for x in (-leg_x, leg_x):
    for i in range(3):
        box('Backrest bolt', (.018, .018, .006),
            (x, seat_y + .2 + .14 * i, back_z - .023), iron, .002)

model = bpy.data.objects.new('HarbourParkBench', None)
bpy.context.collection.objects.link(model)
model.empty_display_type = 'PLAIN_AXES'
model['authoringSource'] = 'tools/blender/build-harbour-bench.py'
model['dimensionSource'] = 'art/park/harbour-bench-spec.json'
model['seatHeight'] = seat_y
model['seatDepth'] = depth
model['length'] = length
model['sit'] = [0.0, 0.0, spec['sitZ']]
model['facing'] = '-Z'

# Exactly three material meshes: keep this tiny prop inexpensive on phones.
for finish in materials:
    selected = [obj for obj in bpy.context.scene.objects
                if obj.type == 'MESH' and obj.data.materials[0] == finish]
    bpy.ops.object.select_all(action='DESELECT')
    for obj in selected:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = selected[0]
    bpy.ops.object.join()
    bpy.context.object.name = finish.name
    bpy.context.object.parent = model

blend = art / 'harbour-bench.blend'
glb = out / 'harbour-bench.glb'
bpy.ops.wm.save_as_mainfile(filepath=str(blend), compress=True)
bpy.ops.export_scene.gltf(filepath=str(glb), export_format='GLB',
                          export_yup=True, export_animations=False,
                          export_extras=True, export_apply=True)

dimensions = {key: spec[key] for key in ('length', 'seatDepth', 'seatHeight',
              'seatThickness', 'backHeight', 'backZ', 'footprintDepth', 'sitZ',
              'parkModelX', 'parkModelFootY', 'standModelX', 'referenceParkScale')}
(root / 'src/world/harbour-bench-dimensions.js').write_text(
    '// Generated by tools/blender/build-harbour-bench.py from art/park/harbour-bench-spec.json.\n'
    '// Metres, +Y up; front -Z, back +Z; origin at foot centre.\n'
    'export const HARBOUR_BENCH_DIMENSIONS=Object.freeze(' + json.dumps(dimensions, separators=(',', ':')) + ');\n')
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
triangles = sum(sum(len(face.vertices) - 2 for face in obj.data.polygons) for obj in meshes)
report = {'source': 'Original Johansson Town geometry authored in Blender',
          'generator': 'tools/blender/build-harbour-bench.py',
          'spec': 'art/park/harbour-bench-spec.json',
          'blender': bpy.app.version_string, 'units': 'metres',
          'meshes': len(meshes), 'materials': len(materials),
          'triangles': triangles, 'bytes': glb.stat().st_size,
          'glbSHA256': hashlib.sha256(glb.read_bytes()).hexdigest(),
          'dimensions': dimensions}
(art / 'harbour-bench-export.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
