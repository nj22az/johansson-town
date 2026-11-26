"""Heads sculpted in Blender for the game's generator, and the review sheet of a character as the game builds them.

Shared by the character scripts (build-johansson-head.py, build-thuan-head.py): each defines its sculpt and calls run().

The owner, 26 November 2026: "Make him in blender", "Fully rigged", "When happy redraw Thuan in Blender too"; and the
rule: after every pass render a front / three-quarter / side sheet with the toon shader and outlines, look at it, and
only then go on.

1. THE SCULPT. The game's head is a sphere pushed into shape (src/avatars/head-profile.js) and everything worn on it
   (hair, a beard's shell, hats, glasses, the painted face) is shaped by the same function. So a head is sculpted here
   as a mesh over that same sphere (a from the front, θ from the crown, the face's features at the angles the game
   paints them), smoothed in Blender, then measured back by casting a ray from its centre. That table is written as
   src/avatars/sculpts/<form>-head.js: a head form of the game's.
2. THE SHEET (--sheet). tools/export-avatar-glb.mjs builds the character in the game's own generator (the sculpt on,
   clothes, hair and painted face) and exports a GLB; it is rendered here with a toon shader (Cycles' Toon BSDF) and
   Freestyle outlines from the front, three-quarter and side, laid on one sheet; and saved as the rigged .blend.

Frames. Game head: x to their left, y up, z to the front. Blender: X the same, Y to the back, Z up.
"""
import argparse
import base64
import json
import math
import subprocess
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument('--root', default='.')
ap.add_argument('--sheet', action='store_true')
ap.add_argument('--only-sheet', action='store_true')
args = ap.parse_args(argv)
ROOT = Path(args.root).resolve()

def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def bell(x, sigma):
    return np.exp(-(x / sigma) ** 2)


def plateau(x, sigma):
    """A bell with a flat top: a blunt, rounded lump, not a point."""
    return np.exp(-(x / sigma) ** 4)


def layout(name):
    """Where the game paints his features, as angles: θ down from the crown, a round from the front (degrees)."""
    code = ("import('./src/avatars/face.js').then(async f=>{const c=await import('./src/avatars/cast.js');"
            "console.log(JSON.stringify(f.faceLayout(c.recipeFor('%s'))))})" % name)
    out = subprocess.run(['node', '--input-type=module', '-e', "import {installDOM} from './tests/fixtures.mjs';installDOM();globalThis.self=globalThis;" + code],
                         cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1]
    L = json.loads(out)
    theta = lambda y: 50.4 + y * (.58 * 180 / 256)
    return {'brow': theta(L['browY']), 'eye': theta(L['eyeY']), 'nose': theta(L['noseY']), 'mouth': theta(L['mouthY']),
            'eyeA': L['spread'] * (1.9 * 180 / math.pi / 256), 'canvas': L}


def to_blender(x, y, z):
    return np.stack([x, -z, y], axis=-1)


def build_head(C, F):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = 'METRIC'
    bpy.ops.mesh.primitive_uv_sphere_add(segments=192, ring_count=128, radius=1)
    head = bpy.context.object
    head.name = head.data.name = C['name'] + 'HeadSculpt'
    mesh = head.data
    co = np.empty(len(mesh.vertices) * 3)
    mesh.vertices.foreach_get('co', co)
    co = co.reshape(-1, 3)
    n = co / np.linalg.norm(co, axis=1, keepdims=True)
    gx, gy, gz = n[:, 0], n[:, 2], -n[:, 1]                                 # Blender to the game frame
    px, py, pz = C['points'](gx, gy, gz, F)
    mesh.vertices.foreach_set('co', to_blender(px, py, pz).ravel())
    mesh.update()
    # Melt the seams between the sculpt's pieces, as a smoothing brush would; the mesh, not the formula, is what counts.
    m = head.modifiers.new('melt', 'SMOOTH')
    m.factor = .5
    m.iterations = C.get('melt', 6)
    bpy.context.view_layer.objects.active = head
    bpy.ops.object.modifier_apply(modifier=m.name)
    for poly in mesh.polygons:
        poly.use_smooth = True
    return head


def measure(head):
    """The mesh's radius through every degree, by a ray from its centre: [θ 0..180][a -180..180]."""
    deps = bpy.context.evaluated_depsgraph_get()
    tree = BVHTree.FromObject(head, deps)
    NA, NT = 241, 121                                                       # every degree and a half
    table = np.zeros((NT, NA), dtype=np.float64)
    for it in range(NT):
        th = math.radians(it * 180 / (NT - 1))
        for ia in range(NA):
            a = math.radians(ia * 360 / (NA - 1) - 180)
            gx, gy, gz = math.sin(th) * math.sin(a), math.cos(th), math.sin(th) * math.cos(a)
            d = Vector((gx, -gz, gy))
            hit = tree.ray_cast(Vector((0, 0, 0)) + d * 1e-4, d, 4.0)
            if hit[0] is None:
                raise SystemExit(f'no surface at column {ia}, row {it}')
            table[it, ia] = hit[0].length
    table[:, -1] = table[:, 0]                                              # the seam is one line
    table[0, :] = table[0, :].mean()
    table[-1, :] = table[-1, :].mean()
    return table


def write_module(C, table, F):
    lo, hi = float(table.min()), float(table.max())
    q = np.round((table - lo) / (hi - lo) * 65535).astype('<u2')
    data = base64.b64encode(q.tobytes()).decode()
    js = ("// Generated by tools/blender/build-%s-head.py: the head sculpted in Blender, measured through every degree and a half.\n"
          "// Do not edit: change the sculpt and run the script. radius = min + (max - min) * u16 / 65535, rows θ 0..180 (from the\n"
          "// crown), columns a -180..180 (round from the front, + to their left), in the head's own radius before its half-axes.\n"
          "export const %s=Object.freeze({width:%s,height:%s,na:%d,nt:%d,min:%r,max:%r,\n data:'%s'});\n"
          % (C['slug'], C['const'], C['width'], C['height'], table.shape[1], table.shape[0], round(lo, 6), round(hi, 6), data))
    module_path(C).write_text(js)
    NT, NA = table.shape
    at = lambda t, a=0: float(table[int(round(t * (NT - 1) / 180)), int(round((a + 180) * (NA - 1) / 360))])
    report = {'source': 'Original Johansson Town head, sculpted in Blender for the game\'s generator', 'character': C['name'], 'form': C['form'],
              'generator': 'tools/blender/build-%s-head.py' % C['slug'], 'blender': bpy.app.version_string,
              'halfAxes': {'width': C['width'], 'height': C['height'], 'depth': .98, 'heightOverWidth': round(C['height'] / C['width'], 3)},
              'radius': {'min': round(lo, 4), 'max': round(hi, 4)},
              'features_deg': {k: round(v, 2) for k, v in F.items() if k != 'canvas'},
              'profile': {'brow': round(at(F['brow']), 4), 'eyeSocket': round(at(F['eye'] + 1, F['eyeA']), 4), 'noseTip': round(at(F['nose']), 4),
                          'upperLip': round(at(F['mouth'] - 4), 4), 'chin': round(at(141), 4)},
              'jawCorner': round(at(130, 62), 4), 'temple': round(at(84, 78), 4)}
    (art(C) / 'head-sculpt-report.json').write_text(json.dumps(report, indent=1) + '\n')
    return report


# ============================================================================ the sheet
def toon(material):
    """The material's colour through a two-band toon shader; its texture's alpha kept."""
    nt = material.node_tree
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    principled = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    shader = nt.nodes.new('ShaderNodeBsdfToon')
    shader.component = 'DIFFUSE'
    shader.inputs['Size'].default_value = .62
    shader.inputs['Smooth'].default_value = .04
    alpha = None
    image = next((n for n in nt.nodes if n.type == 'TEX_IMAGE'), None)
    paint = next((n for n in nt.nodes if n.type in ('VERTEX_COLOR', 'ATTRIBUTE')), None)
    if principled:
        base = principled.inputs['Base Color']
        if image and paint:
            # The game lays the painted cloth over the part's own colour by the paint's alpha (build.js bodyMaterial).
            mix = nt.nodes.new('ShaderNodeMix')
            mix.data_type = 'RGBA'
            nt.links.new(image.outputs['Alpha'], mix.inputs[0])
            nt.links.new(paint.outputs['Color'], mix.inputs[6])
            nt.links.new(image.outputs['Color'], mix.inputs[7])
            nt.links.new(mix.outputs[2], shader.inputs['Color'])
        elif base.is_linked:
            nt.links.new(base.links[0].from_socket, shader.inputs['Color'])
        else:
            shader.inputs['Color'].default_value = base.default_value
        if principled.inputs['Alpha'].is_linked and not (image and paint):
            alpha = principled.inputs['Alpha'].links[0].from_socket
    # A little of its own colour unlit, as the game's faces are a little self-lit, so the shaded band is never black.
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Strength'].default_value = .42
    if shader.inputs['Color'].is_linked:
        nt.links.new(shader.inputs['Color'].links[0].from_socket, emit.inputs['Color'])
    else:
        emit.inputs['Color'].default_value = shader.inputs['Color'].default_value
    add = nt.nodes.new('ShaderNodeAddShader')
    nt.links.new(shader.outputs[0], add.inputs[0])
    nt.links.new(emit.outputs[0], add.inputs[1])
    final = add.outputs[0]
    if alpha:
        clear = nt.nodes.new('ShaderNodeBsdfTransparent')
        mix = nt.nodes.new('ShaderNodeMixShader')
        nt.links.new(alpha, mix.inputs[0])
        nt.links.new(clear.outputs[0], mix.inputs[1])
        nt.links.new(final, mix.inputs[2])
        final = mix.outputs[0]
    nt.links.new(final, out.inputs['Surface'])


def sheet(C):
    ART = art(C)
    glb = ART / ('review/%s-game.glb' % C['slug'])
    glb.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['node', 'tools/export-avatar-glb.mjs', '--name', C['name'], str(glb)], cwd=ROOT, check=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(glb))
    scene = bpy.context.scene
    for m in bpy.data.materials:
        if m.use_nodes:
            toon(m)
    meshes = [o for o in scene.objects if o.type == 'MESH']
    top = max((o.matrix_world @ Vector(c)).z for o in meshes for c in o.bound_box)
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 24
    scene.cycles.use_denoising = False
    scene.cycles.max_bounces = 2
    scene.cycles.transparent_max_bounces = 8
    scene.render.film_transparent = False
    scene.view_settings.view_transform = 'Standard'
    W, H = 600, 720
    scene.render.resolution_x, scene.render.resolution_y = W, H
    world = bpy.data.worlds.new('Paper')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (.82, .88, .92, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = .5
    scene.world = world
    sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN'))
    sun.data.energy = 3.2
    sun.data.angle = math.radians(2)
    sun.data.use_shadow = False                                            # the game casts no shadow across a face
    scene.collection.objects.link(sun)
    # Outlines: the game's ink, drawn here by Freestyle on the silhouette, the borders and the hard creases.
    scene.render.use_freestyle = True
    scene.render.line_thickness = 2.6
    layer = bpy.context.view_layer
    fs = layer.freestyle_settings
    ls = fs.linesets[0] if fs.linesets else fs.linesets.new('ink')
    ls.select_silhouette = True
    ls.select_border = False                                               # (the stubble's see-through shell has edges that are not his)
    ls.select_crease = True
    ls.select_external_contour = True
    ls.select_material_boundary = True
    fs.crease_angle = math.radians(128)
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new('ink')
    ls.linestyle.color = (.19, .12, .10)
    cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera'))
    cam.data.lens = 70
    scene.collection.objects.link(cam)
    scene.camera = cam
    # A bust: the head, the neck, the shoulders and the chest. He faces Blender -Y.
    target = Vector((0, 0, top - .27))
    views = {'front': 0, 'three-quarter': 38, 'side': 90}
    shots = []
    for name, yaw in views.items():
        a = math.radians(yaw)
        cam.location = target + Vector((math.sin(a) * 2.25, -math.cos(a) * 2.25, .06))
        cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
        sun.rotation_euler = (Vector((0, 0, 0)) - Vector((math.sin(a - .32) * 3, -math.cos(a - .32) * 3, 2.6))).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(ART / f'review/{name}.png')
        bpy.ops.render.render(write_still=True)
        shots.append(scene.render.filepath)
    px = []
    for path in shots:
        img = bpy.data.images.load(path)
        a = np.empty(W * H * 4, dtype=np.float32)
        img.pixels.foreach_get(a)
        px.append(a.reshape(H, W, 4))
    # The rigged character as Blender holds him: the armature, the skinned body and the head on its bone, the toon
    # materials and this review's camera and light, with his textures packed in the file.
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(ART / ('%s-rigged.blend' % C['slug'])), compress=True)
    rig = next(o for o in scene.objects if o.type == 'ARMATURE')
    (ART / 'rig-report.json').write_text(json.dumps({
        'source': 'The game\'s generator (src/avatars/build.js) wearing the Blender sculpt, exported by tools/export-avatar-glb.mjs',
        'blender': bpy.app.version_string, 'armature': rig.name, 'bones': [b.name for b in rig.data.bones],
        'meshes': {o.name: {'vertices': len(o.data.vertices), 'skinned': bool(o.find_armature()), 'parentBone': o.parent_bone or None,
                            'shapeKeys': [k.name for k in o.data.shape_keys.key_blocks] if o.data.shape_keys else []} for o in meshes}}, indent=1) + '\n')
    out = bpy.data.images.new('sheet', W * 3, H)
    out.pixels.foreach_set(np.concatenate(px, axis=1).ravel())
    out.filepath_raw = str(ART / 'review/contact-sheet.png')
    out.file_format = 'PNG'
    out.save()
    print('sheet', out.filepath_raw)


def hair_shell(name, const, form, field, height, ride=None, res=(91, 181)):
    """Hair sculpted over the head's sphere: `field(A, t)` is positive where there is hair (degrees: A round from the front,
    signed; t from the crown), `height(A, t)` how far it stands off the head (in head radii). The shell is made as a mesh
    in the open scene and smoothed in Blender; its height is measured back by rays from the centre and written with the
    hairline's field as src/avatars/sculpts/<form>-hair.js (the game cuts the hair along the field: build.js cutHairCap).
    `ride(x, y, z)`: the head's own radius along a direction, so the mesh shown here sits on the sculpted head."""
    import bmesh
    bpy.ops.mesh.primitive_uv_sphere_add(segments=180, ring_count=120, radius=1)
    obj = bpy.context.object
    obj.name = obj.data.name = name
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    drop = []
    for v in bm.verts:
        n = v.co.normalized()
        gx, gy, gz = n.x, n.z, -n.y
        A, t = math.degrees(math.atan2(gx, gz)), math.degrees(math.acos(max(-1, min(1, gy))))
        if float(field(np.float64(A), np.float64(t))) <= 0:
            drop.append(v)
        else:
            v.co = n * (1.004 + float(height(np.float64(A), np.float64(t))))
    bmesh.ops.delete(bm, geom=drop, context='VERTS')
    bm.to_mesh(obj.data)
    bm.free()
    for poly in obj.data.polygons:
        poly.use_smooth = True
    m = obj.modifiers.new('melt', 'SMOOTH')
    m.factor, m.iterations = .5, 2
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=m.name)
    tree = BVHTree.FromObject(obj, bpy.context.evaluated_depsgraph_get())
    NT, NA = res
    F, R = np.zeros((NT, NA)), np.zeros((NT, NA))
    for it in range(NT):
        t = it * 180 / (NT - 1)
        for ia in range(NA):
            A = ia * 360 / (NA - 1) - 180
            F[it, ia] = float(field(np.float64(A), np.float64(t)))
            th, a = math.radians(t), math.radians(A)
            d = Vector((math.sin(th) * math.sin(a), -math.sin(th) * math.cos(a), math.cos(th)))
            hit = tree.ray_cast(d * 1e-4, d, 4.0)
            R[it, ia] = hit[0].length if hit[0] is not None else 1.004 + float(height(np.float64(A), np.float64(t)))
    F = np.clip(F, -30, 30)
    pack = lambda T: (float(T.min()), float(T.max()), base64.b64encode(np.round((T - T.min()) / (T.max() - T.min()) * 65535).astype('<u2').tobytes()).decode())
    (f0, f1, fb), (r0, r1, rb) = pack(F), pack(R)
    (ROOT / ('src/avatars/sculpts/%s-hair.js' % form)).write_text(
        "// Generated by tools/blender: hair sculpted in Blender over the head's sphere. Do not edit: change the sculpt and run it.\n"
        "// Rows θ 0..180 (from the crown), columns a -180..180 (round from the front). field: positive where there is hair (degrees\n"
        "// from its edge); radius: how far out it stands (the head is 1). value = min + (max - min) * u16 / 65535.\n"
        "export const %s=Object.freeze({na:%d,nt:%d,field:Object.freeze({min:%r,max:%r,data:'%s'}),\n radius:Object.freeze({min:%r,max:%r,data:'%s'})});\n"
        % (const, NA, NT, round(f0, 5), round(f1, 5), fb, round(r0, 6), round(r1, 6), rb))
    obj['sculptKind'] = 'hair'
    if ride is not None:                                                    # as it is worn: on the sculpted head
        co = np.empty(len(obj.data.vertices) * 3)
        obj.data.vertices.foreach_get('co', co)
        co = co.reshape(-1, 3)
        n = co / np.linalg.norm(co, axis=1, keepdims=True)
        co *= ride(n[:, 0], n[:, 2], -n[:, 1])[:, None]
        obj.data.vertices.foreach_set('co', co.ravel())
        obj.data.update()
    thick = obj.modifiers.new('thickness', 'SOLIDIFY')                       # (shown with its thickness; measured without)
    thick.thickness, thick.offset = .035, -1
    return obj


def clay_sheet(C, objects):
    """The sculpt as clay: the head (and what was sculpted with it) in one plain clay, from the front, three-quarter and side."""
    scene = bpy.context.scene
    clay = bpy.data.materials.new('Clay')
    clay.use_nodes = True
    b = clay.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (.62, .42, .33, 1)
    b.inputs['Roughness'].default_value = .85
    dark = clay.copy()
    dark.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.36, .24, .19, 1)
    for o in objects:
        o.data.materials.clear()
        o.data.materials.append(dark if o.get('sculptKind') == 'hair' else clay)
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 32
    scene.cycles.use_denoising = False
    scene.view_settings.view_transform = 'Standard'
    W, Hh = 520, 600
    scene.render.resolution_x, scene.render.resolution_y = W, Hh
    world = bpy.data.worlds.new('Studio')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (.8, .82, .84, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = .45
    scene.world = world
    sun = bpy.data.objects.new('ClaySun', bpy.data.lights.new('ClaySun', 'SUN'))
    sun.data.energy, sun.data.angle = 1.5, math.radians(12)
    scene.collection.objects.link(sun)
    cam = bpy.data.objects.new('ClayCamera', bpy.data.cameras.new('ClayCamera'))
    cam.data.lens = 70
    scene.collection.objects.link(cam)
    scene.camera = cam
    px = []
    for yaw in (0, 40, 90):
        a = math.radians(yaw)
        cam.location = Vector((math.sin(a) * 6.4, -math.cos(a) * 6.4, .1))
        cam.rotation_euler = (Vector((0, 0, 0)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
        sun.rotation_euler = (Vector((0, 0, 0)) - Vector((math.sin(a - .5) * 3, -math.cos(a - .5) * 3, 2.6))).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(art(C) / 'review/clay-tmp.png')
        bpy.ops.render.render(write_still=True)
        img = bpy.data.images.load(scene.render.filepath)
        arr = np.empty(W * Hh * 4, dtype=np.float32)
        img.pixels.foreach_get(arr)
        px.append(arr.reshape(Hh, W, 4).copy())
        bpy.data.images.remove(img)
    out = bpy.data.images.new('clay', W * 3, Hh)
    out.pixels.foreach_set(np.concatenate(px, axis=1).ravel())
    out.filepath_raw = str(art(C) / 'review/clay.png')
    out.file_format = 'PNG'
    out.save()
    (art(C) / 'review/clay-tmp.png').unlink(missing_ok=True)


def art(C):
    path = ROOT / 'art/characters' / C['slug']
    path.mkdir(parents=True, exist_ok=True)
    return path


def module_path(C):
    return ROOT / ('src/avatars/sculpts/%s-head.js' % C['form'])


def game_profile(expression):
    """A head profile of the game's (head-profile.js headProfile) for a JS expression that yields a recipe's head."""
    code = ("const h=await import('./src/avatars/head-profile.js');%s;console.log(JSON.stringify(h.headProfile(head)))" % expression)
    out = subprocess.run(['node', '--input-type=module', '-e', "import {installDOM} from './tests/fixtures.mjs';installDOM();globalThis.self=globalThis;" + code],
                         cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1]
    return json.loads(out)


def shape_as_game(x, y, z, P):
    """head-profile.js shapeHeadPoint for a plain profile (no corners, no crown), on arrays: a head form's own silhouette."""
    lower = np.clip((-y - .12) / .78, 0, 1)
    cheek = np.exp(-(((y + .16) / .32) ** 2)) * P['cheek']
    x = x * (1 - P['taper'] * lower + cheek)
    z = np.where(z > 0, z * (1 - .08 * np.maximum(0, 1 - np.abs(y) * 1.4)), z)
    return x, y, z


def ensure(C):
    """The first run: a plain ball in the form's place, so the game's head code (which imports every sculpt) loads."""
    if not module_path(C).exists():
        write_module(C, np.ones((121, 241)) + np.linspace(0, 1e-6, 241)[None, :], {'brow': 80, 'eye': 90, 'nose': 105, 'mouth': 118, 'eyeA': 16})


def run(C):
    """C: name (the cast's), slug, form, const, width, height, points(x, y, z, F) -> the sculpt's points, melt (optional),
    extra(F) -> other meshes sculpted with the head (its hair: hair_shell)."""
    if not args.only_sheet:
        ensure(C)
        F = layout(C['name'])
        head = build_head(C, F)
        table = measure(head)
        report = write_module(C, table, F)
        made = [head] + list(C['extra'](F) if C.get('extra') else [])          # what is sculpted with the head: its hair
        for o in made:
            o.scale = (C['width'], .98, C['height'])
        head['authoringSource'] = 'tools/blender/build-%s-head.py' % C['slug']
        bpy.ops.wm.save_as_mainfile(filepath=str(art(C) / ('%s-head.blend' % C['slug'])), compress=True)
        (art(C) / 'review').mkdir(exist_ok=True)
        clay_sheet(C, made)
        print(json.dumps(report['profile']), report['radius'])
    if args.sheet or args.only_sheet:
        sheet(C)
