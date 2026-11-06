"""Blender-only H1-F1 assets, constrained by the measured CAD and finish schedule.
Run: blender -b --factory-startup --python tools/blender/build-ferry-engine-room-h1.py -- --render --preview
"""
import bpy, json, math, struct, sys
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/ferry-engine-room'
D = json.loads((OUT / 'geometry-h1.json').read_text())
F = json.loads((OUT / 'cad/finish-h1-f1.json').read_text())
EDGE, FINISH = F['edge_detail'], F['materials']
assert D['basis']['clearHeight'] == F['constraints']['working_clearance']
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
collection = bpy.data.collections.new('CAD H1 - retained machinery')
scene.collection.children.link(collection)
details = bpy.data.collections.new('H1-F1 - source plates and glass - render only')
scene.collection.children.link(details)
objects, mats = [], {}
T = Matrix(((1, 0, 0), (0, 0, -1), (0, 1, 0)))

def P(p):
    return Vector((p[0], -p[2], p[1]))

def material(hexcode, cls='paint'):
    key = (hexcode, cls)
    if key not in mats:
        def linear(v):
            return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4
        m = bpy.data.materials.new(f'{cls} {hexcode:06x}')
        m.diffuse_color = tuple(linear(((hexcode >> s) & 255) / 255) for s in [16, 8, 0]) + (1,)
        m.use_nodes = True
        bs = m.node_tree.nodes.get('Principled BSDF')
        bs.inputs['Base Color'].default_value = m.diffuse_color
        props = FINISH.get(cls, FINISH['paint'])
        bs.inputs['Roughness'].default_value = props['roughness']
        bs.inputs['Metallic'].default_value = props['metallic']
        mats[key] = m
    return mats[key]

def link(o, target):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    target.objects.link(o)

def keep(o, name, hexcode, cls):
    o.name = name or 'source fitting'
    o['source'] = 'ferry-interior.js / CAD C-H1'
    o['finish_revision'] = 'H1-F1'
    o['material_class'] = cls
    link(o, collection)
    o.data.materials.append(material(hexcode, cls))
    objects.append(o)
    return o

bevelled = 0
for k, b in enumerate(D['boxes']):
    a, c = Vector(b['a']), Vector(b['b'])
    size = c - a
    if min(abs(x) for x in size) < .00001:
        continue
    bpy.ops.mesh.primitive_cube_add(size=1, location=P((a+c)/2))
    o = bpy.context.object
    o.dimensions = (abs(size.x), abs(size.z), abs(size.y))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    keep(o, b.get('name') or f'CAD component {k}', b['hex'], b.get('cls', 'paint'))
    smallest = min(o.dimensions)
    if smallest >= EDGE['minimum_box_dimension'] and not any(n in o.name.lower() for n in EDGE['excluded_names']):
        mod = o.modifiers.new('F1 inward equipment edge', 'BEVEL')
        mod.width = min(EDGE['equipment_box_bevel_max'], smallest * EDGE['bevel_fraction_of_smallest_dimension'])
        mod.segments = EDGE['bevel_segments']
        mod.affect = 'EDGES'
        mod.limit_method = 'ANGLE'
        mod.use_clamp_overlap = True
        o['bevel_inside_envelope_m'] = mod.width
        bevelled += 1

for c in D['cyls']:
    n = EDGE['cylinder_segments']
    x, y, z = c.get('rot', [0, 0, 0])
    rot = Matrix.Rotation(y, 3, 'Y') @ Matrix.Rotation(x, 3, 'X') @ Matrix.Rotation(z, 3, 'Z')
    v = [P(rot @ Vector((r*math.cos(t*2*math.pi/n), h, r*math.sin(t*2*math.pi/n))) + Vector(c['pos']))
         for h, r in [(-c['h']/2, c['rb']), (c['h']/2, c['rt'])] for t in range(n)]
    # theta advances around XZ: these orders face outwards in source Y-up.
    faces = [tuple(range(n)), tuple(range(2*n-1, n-1, -1))] + [
        (i, i+n, (i+1)%n+n, (i+1)%n) for i in range(n)]
    mesh = bpy.data.meshes.new(c.get('name') or 'cylinder')
    mesh.from_pydata(v, [], faces)
    mesh.update()
    for poly in list(mesh.polygons)[2:]:
        poly.use_smooth = True
    o = bpy.data.objects.new(mesh.name, mesh)
    collection.objects.link(o)
    keep(o, c.get('name'), c['hex'], c.get('cls', 'metal'))

for b in D['bars']:
    a, c = P(b['a']), P(b['b'])
    dv = c - a
    if dv.length < .0001:
        continue
    bpy.ops.mesh.primitive_cylinder_add(vertices=EDGE['bar_segments'], radius=b['r'], depth=dv.length, location=(a+c)/2)
    o = bpy.context.object
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = dv.to_track_quat('Z', 'Y')
    for poly in o.data.polygons:
        poly.use_smooth = len(poly.vertices) == 4
    keep(o, 'pipe / guard / support', b['hex'], b.get('cls', 'metal'))

# Native source plate surfaces: game retains its original live versions.
def hexvalue(value, fallback):
    return int(value.removeprefix('#'), 16) if value else fallback

def plate_mesh(name, verts, faces, p, mat):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    details.objects.link(o)
    R = Matrix.Rotation(p.get('rotY', 0), 3, 'Y') @ Matrix.Rotation(p.get('rotX', 0), 3, 'X')
    o.location = P(p['pos'])
    o.rotation_euler = (T @ R).to_euler()
    mesh.materials.append(mat)
    o['render_only'] = True
    o['source_plate'] = p.get('name', '')
    return o

def text(p, lines, x, y, z, size, mat):
    lines = [''.join(c for c in str(s) if ord(c) < 256) for s in lines]
    if not any(lines):
        return
    curve = bpy.data.curves.new('Source label ' + p.get('name', ''), 'FONT')
    curve.body = '\n'.join(lines)
    curve.align_x = curve.align_y = 'CENTER'
    curve.size = size
    curve.space_line = 1.15
    o = bpy.data.objects.new(curve.name, curve)
    details.objects.link(o)
    R = Matrix.Rotation(p.get('rotY', 0), 3, 'Y') @ Matrix.Rotation(p.get('rotX', 0), 3, 'X')
    o.location = P(Vector(p['pos']) + R @ Vector((x, y, z)))
    o.rotation_euler = (T @ R).to_euler()
    curve.materials.append(mat)
    o['render_only'] = True

def disk(p, r, z, mat, name):
    n = 48
    v = [(r*math.cos(i*2*math.pi/n), r*math.sin(i*2*math.pi/n), z) for i in range(n)]
    return plate_mesh(name, v, [tuple(range(n))], p, mat)

for p in D['plates']:
    kind = p.get('kind') or 'text'
    bg = material(hexvalue(p.get('bg'), 0xf1ede2))
    ink = material(hexvalue(p.get('fg'), 0x1d2326))
    w, h = p['w'], p['h']
    if kind == 'dial':
        radius = w / 2
        disk(p, radius, .0005, material(0x65757a, 'metal'), 'Source dial rim')
        disk(p, radius*.9, .001, bg, 'Source dial face')
        verts, faces = [], []
        def radial(t, a, b, width):
            angle = math.radians(225 - 270*t)
            tangent = Vector((-math.sin(angle), math.cos(angle), 0)) * width / 2
            u = Vector((math.cos(angle), math.sin(angle), 0))
            idx = len(verts)
            for point in [u*a-tangent, u*b-tangent, u*b+tangent, u*a+tangent]:
                verts.append((point.x, point.y, .0018))
            faces.append((idx, idx+1, idx+2, idx+3))
        for j in range(11):
            radial(j/10, radius*(.66 if j%5 == 0 else .74), radius*.83, radius*.026)
        plate_mesh('Source dial graduations', verts, faces, p, ink)
        if p.get('red'):
            lo, hi = p['red']
            vs, fs = [], []
            steps = max(2, math.ceil((hi-lo)*48))
            for j in range(steps+1):
                angle = math.radians(225-270*(lo+(hi-lo)*j/steps))
                for r in [.84, .89]:
                    vs.append((radius*r*math.cos(angle), radius*r*math.sin(angle), .0018))
            for j in range(steps):
                fs.append((2*j, 2*j+1, 2*j+3, 2*j+2))
            plate_mesh('Source dial red interval', vs, fs, p, material(0xb33f37))
        angle = math.radians(225-270*(p.get('value') or 0))
        u, t = Vector((math.cos(angle), math.sin(angle), 0)), Vector((-math.sin(angle), math.cos(angle), 0))
        points = [u*radius*.72, -u*radius*.18+t*radius*.035, -u*radius*.18-t*radius*.035]
        plate_mesh('Source dial needle', [(v.x, v.y, .0022) for v in points], [(0, 1, 2)], p, ink)
        disk(p, radius*.065, .0025, ink, 'Source dial pivot')
        lines = p.get('lines', [])
        text(p, lines, 0, -radius*.38, .0023, min(radius*.16, w/max([len(str(s)) for s in lines] or [1])*.82), ink)
        if p.get('range'):
            for val, xx in zip(p['range'], [-.57, .57]):
                text(p, [str(val)], radius*xx, -radius*.55, .0023, radius*.13, ink)
    elif kind not in ['grating']:
        o = plate_mesh('Source ' + p.get('name', kind), [(-w/2,-h/2,.0003),(w/2,-h/2,.0003),(w/2,h/2,.0003),(-w/2,h/2,.0003)], [(0,1,2,3)], p, bg)
        if kind == 'chequer':
            # Source floor plate relief, half a millimetre high, shader only.
            m = bg.copy()
            m.name = 'Source chequer plate - 0.5 mm render relief'
            o.data.materials[0] = m
            nodes, links = m.node_tree.nodes, m.node_tree.links
            coords = nodes.new('ShaderNodeTexCoord')
            wave = nodes.new('ShaderNodeTexWave');wave.wave_type = 'BANDS';wave.bands_direction = 'DIAGONAL';wave.inputs['Scale'].default_value = 90
            bump = nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value = .25;bump.inputs['Distance'].default_value = .0005
            links.new(coords.outputs['Object'], wave.inputs['Vector']);links.new(wave.outputs['Fac'], bump.inputs['Height']);links.new(bump.outputs['Normal'], nodes.get('Principled BSDF').inputs['Normal'])
        else:
            lines = [str(a) for a in p.get('lines', []) if str(a)]
            if lines:
                size = min(h/max(1,len(lines))*.66, w/max(map(len,lines))*.9)
                text(p, lines, 0, 0, .001, size, ink)

for g in D.get('glass', []):
    bpy.ops.mesh.primitive_cube_add(size=1, location=P(g['pos']))
    o = bpy.context.object
    o.name = 'Source booth glazing - render only'
    o.dimensions = (g['size'][0], g['size'][2], g['size'][1])
    link(o, details)
    m = material(0xc1dade, 'metal').copy()
    m.name = 'Retained booth glass'
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Metallic'].default_value = 0
    bs.inputs['Roughness'].default_value = .12
    bs.inputs['Transmission Weight'].default_value = .86
    bs.inputs['IOR'].default_value = 1.45
    o.data.materials.append(m)
    o['render_only'] = True

for X, Y in D['basis']['luminaires']:
    data = bpy.data.lights.new('CAD H1-03 overhead fixture', 'AREA')
    data.energy, data.shape, data.size, data.color = 80, 'DISK', .65, (1,.94,.84)
    o = bpy.data.objects.new(data.name, data)
    scene.collection.objects.link(o)
    o.location = P((Y, (3.5 if X in [9.5,12.5,24.4] else 3.38)-1.9, X-17.25))
world = bpy.data.worlds.new('Machinery-space ambient')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.34,.42,.46,1)
world.node_tree.nodes['Background'].inputs[1].default_value = .28
for s in D['shots']:
    def cp(a):
        X,Y,Z = a
        return P((Y,Z-1.9,X-17.25))
    data = bpy.data.cameras.new(s['id'])
    o = bpy.data.objects.new(s['id'], data)
    scene.collection.objects.link(o)
    o.location = cp(s['pos'])
    o.rotation_euler = (cp(s['at'])-o.location).to_track_quat('-Z','Y').to_euler()
    data.type, data.sensor_fit = 'PERSP', 'VERTICAL'
    data.lens = (data.sensor_height/2)/math.tan(math.radians(s['fov'])/2)
    data.clip_start, data.clip_end = .05, 60
    o['label'], o['locked'] = s['label'], True
    o.lock_location = o.lock_rotation = o.lock_scale = (True,True,True)
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 128
scene.cycles.use_denoising = False
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = .035
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 4
scene.render.resolution_x, scene.render.resolution_y = 1600, 1200
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = 0
scene.camera = bpy.data.objects[D['shots'][0]['id']]
scene['CAD_revision'], scene['finish_revision'] = 'C-H1', 'H1-F1'
scene['clear_headroom_m'], scene['nominal_height_m'] = 2.4, 2.7
scene['asset_workflow'] = 'Blender only, per owner instruction 31 October 2026'
scene['release'] = 'Development geometry study'
collection.asset_mark()
collection.asset_data.description = 'Minato Maru measured H1-F1 machinery space. Metric source components; 2.4 m reserved working headroom.'
for tag in ['Minato Maru', 'Engine room', 'CAD H1', 'Blender only']:
    collection.asset_data.tags.new(tag)
assert len(objects) == F['constraints']['source_components']

# Evaluate native modifiers, audit outward faces, and bake bounded contact shade.
bpy.context.view_layer.update()
depsgraph = bpy.context.evaluated_depsgraph_get()
copies, vertices, polygons = [], [], []
normal_faces = 0
envelope_checks = 0
for src in objects:
    mesh = bpy.data.meshes.new_from_object(src.evaluated_get(depsgraph), depsgraph=depsgraph)
    if 'bevel_inside_envelope_m' in src:
        low = [min(v.co[k] for v in src.data.vertices) for k in range(3)]
        high = [max(v.co[k] for v in src.data.vertices) for k in range(3)]
        assert all(low[k]-.000001 <= v.co[k] <= high[k]+.000001 for v in mesh.vertices for k in range(3)), src.name
        envelope_checks += 1
    center = sum((v.co for v in mesh.vertices), Vector()) / len(mesh.vertices)
    for poly in mesh.polygons:
        if poly.area > 1e-10:
            assert poly.normal.dot(poly.center-center) > 1e-8, f'Inward face: {src.name} / {poly.index}'
            normal_faces += 1
    o = bpy.data.objects.new(src.name + ' / export', mesh)
    scene.collection.objects.link(o)
    o.matrix_world = src.matrix_world.copy()
    o['material_class'] = 'metal' if src['material_class'] == 'metal' else 'paint'
    copies.append(o)
    offset = len(vertices)
    vertices.extend(o.matrix_world @ v.co for v in mesh.vertices)
    polygons.extend(tuple(offset+i for i in p.vertices) for p in mesh.polygons)
assert normal_faces > 10000
bvh = BVHTree.FromPolygons(vertices, polygons)
radius, strength, rays = FINISH['contact_shading_radius'], FINISH['contact_shading_strength'], FINISH['contact_shading_rays']
shade_min, shade_max = 1, 0
for o in copies:
    mesh = o.data
    mesh.calc_normals_split()
    attr = mesh.color_attributes.new(name='Color', type='FLOAT_COLOR', domain='CORNER')
    col = mesh.materials[0].diffuse_color
    cache = {}
    for loop in mesh.loops:
        normal = (o.matrix_world.to_3x3() @ loop.normal).normalized()
        vertex = mesh.vertices[loop.vertex_index]
        key = (loop.vertex_index, tuple(round(v,4) for v in normal))
        if key not in cache:
            origin = o.matrix_world @ vertex.co + normal*.0008
            tangent = normal.cross(Vector((0,0,1)) if abs(normal.z)<.9 else Vector((1,0,0))).normalized()
            bitangent = normal.cross(tangent)
            blocked = 0
            for j in range(rays):
                z = math.sqrt(1-(j+.5)/rays)
                a = j*2.3999632297
                r = math.sqrt(1-z*z)
                direction = normal*z + tangent*(math.cos(a)*r) + bitangent*(math.sin(a)*r)
                _, _, _, distance = bvh.ray_cast(origin, direction, radius)
                if distance is not None:
                    blocked += 1-distance/radius
            cache[key] = 1-strength*blocked/rays
        shade = cache[key]
        shade_min, shade_max = min(shade_min,shade), max(shade_max,shade)
        attr.data[loop.index].color = tuple(v*shade for v in col[:3])+(1,)
    mesh.materials.clear()

# Two shared surface groups; no textures, UVs or per-fitting draw calls.
export_materials = {}
for cls in ['paint','metal']:
    m = bpy.data.materials.new('H1-F1 ' + cls + ' / vertex contact colour')
    m.use_nodes = True
    node = m.node_tree.nodes.new('ShaderNodeVertexColor')
    node.layer_name = 'Color'
    bs = m.node_tree.nodes.get('Principled BSDF')
    m.node_tree.links.new(node.outputs['Color'], bs.inputs['Base Color'])
    bs.inputs['Roughness'].default_value = FINISH[cls]['roughness']
    bs.inputs['Metallic'].default_value = FINISH[cls]['metallic']
    export_materials[cls] = m
for o in copies:
    o.data.materials.append(export_materials[o['material_class']])
bpy.ops.object.select_all(action='DESELECT')
for o in copies:
    o.select_set(True)
bpy.context.view_layer.objects.active = copies[0]
bpy.ops.object.join()
merged = bpy.context.object
merged.name = 'Minato Maru H1-F1 / CAD source'
path = ROOT / 'assets/models/ferry-engine-room' / F['runtime']['file']
bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True,
    export_apply=True, export_cameras=False, export_lights=False, export_yup=True,
    export_texcoords=False, export_tangents=False)

# glTF permits normalized byte colours. Quantize colours only, never positions.
raw = path.read_bytes()
json_len = struct.unpack_from('<I', raw, 12)[0]
gltf = json.loads(raw[20:20+json_len])
binary = raw[28+json_len:]
colour_views = {}
for mesh in gltf['meshes']:
    for primitive in mesh['primitives']:
        accessor = gltf['accessors'][primitive['attributes']['COLOR_0']]
        assert accessor['componentType'] == 5126 and accessor['type'] == 'VEC4'
        colour_views[accessor['bufferView']] = accessor
newbin = bytearray()
for index, view in enumerate(gltf['bufferViews']):
    start, size = view.get('byteOffset',0), view['byteLength']
    data = binary[start:start+size]
    if index in colour_views:
        accessor = colour_views[index]
        assert accessor.get('byteOffset',0) == 0 and not view.get('byteStride')
        values = struct.unpack('<'+'f'*(size//4), data)
        data = bytes(max(0,min(255,round(v*255))) for v in values)
        accessor['componentType'], accessor['normalized'] = 5121, True
    while len(newbin)%4:
        newbin.append(0)
    view['byteOffset'], view['byteLength'] = len(newbin), len(data)
    newbin.extend(data)
gltf['buffers'][0]['byteLength'] = len(newbin)
while len(newbin)%4:
    newbin.append(0)
encoded = json.dumps(gltf,separators=(',',':')).encode()
encoded += b' '*((-len(encoded))%4)
length = 12+8+len(encoded)+8+len(newbin)
path.write_bytes(struct.pack('<4sII',b'glTF',2,length)+struct.pack('<I4s',len(encoded),b'JSON')+encoded+struct.pack('<I4s',len(newbin),b'BIN\0')+newbin)
triangles = sum(gltf['accessors'][p['indices']]['count']//3 for m in gltf['meshes'] for p in m['primitives'])
assert length < F['runtime']['max_bytes'], length
assert triangles <= F['runtime']['max_triangles'], triangles
assert sum(len(m['primitives']) for m in gltf['meshes']) <= F['runtime']['max_material_groups']
bpy.data.objects.remove(merged,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
# Save editable originals, source-labelled detail and cameras, not the merged export.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Minato_Maru_Engine_Room_H1.blend'),compress=True)
audit = {'revision':'H1-F1','workflow':'Blender only','source_components':len(objects),'bevelled_equipment_boxes':bevelled,
    'bevelled_source_envelopes_checked':envelope_checks,
    'outward_faces_checked':normal_faces,'outward_faces_failed':0,'dial_faces':sum(p.get('kind')=='dial' for p in D['plates']),
    'source_glass_panes':len(D.get('glass',[])),'contact_shade_range':[shade_min,shade_max],
    'runtime_file':F['runtime']['file'],'runtime_bytes':length,'runtime_triangles':triangles,
    'runtime_primitives':sum(len(m['primitives']) for m in gltf['meshes']),
    'colour_quantization':'normalized unsigned byte; positions and normals unchanged','tonemapping':'AgX / medium high contrast'}
(ROOT/'docs/qa/ferry-engine-room-h1/blender-finish-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
print('H1_F1_BUILD_COMPLETE',json.dumps(audit),flush=True)
if '--render' in sys.argv:
    if '--preview' in sys.argv:
        scene.render.engine = 'BLENDER_EEVEE'
        scene.eevee.use_gtao = True
        scene.eevee.gtao_distance, scene.eevee.gtao_factor = .3, 1.25
        scene.eevee.use_soft_shadows = True
        scene.eevee.taa_render_samples = 64
        # Preview glass uses the game's opacity; the saved Cycles source keeps transmission.
        glass = bpy.data.materials.get('Retained booth glass')
        if glass:
            glass.blend_method, glass.shadow_method = 'BLEND', 'NONE'
            bs = glass.node_tree.nodes.get('Principled BSDF')
            bs.inputs['Transmission Weight'].default_value = 0
            bs.inputs['Alpha'].default_value = .38
        scene.render.resolution_x, scene.render.resolution_y = 960, 720
    only = next((a.split('=',1)[1] for a in sys.argv if a.startswith('--shots=')),None)
    for s in D['shots']:
        if only and s['id'] not in only.split(','):
            continue
        scene.camera = bpy.data.objects[s['id']]
        scene.render.filepath = str(OUT/'renders'/(s['id']+'.png'))
        bpy.ops.render.render(write_still=True)
