"""Johansson's head, sculpted in Blender, and the review sheet of him as the game builds him.

  python tools/blender/build-johansson-head.py --root . [--sheet] [--only-sheet]     (bpy 5.x from pip; or blender -b --python ... --)

The owner, 26 November 2026, with his photograph: "Make him in blender"; "shift the character from cute chibi to rugged,
sturdy, manly cartoon caricature"; and the rule: after every pass render a front / three-quarter / side sheet with the toon
shader and outlines, look at it against the photograph, and only then go on.

1. THE SCULPT. The game's head is a sphere pushed into shape (src/avatars/head-profile.js) and everything he wears on it
   (hair, the stubble's shell, hats, glasses, the painted face) is shaped by the same function. So the head is sculpted
   here as a mesh over that same sphere (a from the front, θ from the crown, the face's features at the angles the game
   paints them: face-layout.json), smoothed in Blender, then measured back by casting a ray from its centre through
   every degree. That table is written as src/avatars/sculpts/rugged-head.js: the game's head form 'rugged'.
   What is sculpted: a taller, blockier skull with flat temples, a wide jaw with corners and a squared chin, a brow
   ridge that overhangs recessed eye sockets, cheekbones, and a nose with a bridge from the brow, a tip that stands
   forward in profile and nostril wings.
2. THE SHEET (--sheet). `tools/export-avatar-glb.mjs` builds him in the game's own generator (the sculpt on, his clothes,
   hair and painted face) and exports a GLB; it is rendered here with a toon shader (Cycles' Toon BSDF, two bands) and
   Freestyle outlines from the front, three-quarter and side, and the three are laid on one sheet.

Frames. Game head: x to his left, y up, z to the front. Blender: X the same, Y to the back, Z up.
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
ap.add_argument('--name', default='Johansson')
args = ap.parse_args(argv)
ROOT = Path(args.root).resolve()
ART = ROOT / 'art/characters/johansson'
ART.mkdir(parents=True, exist_ok=True)

# The proportions (the head's half-axes as multiples of its radius; the game keeps its depth at 0.98).
WIDTH, HEIGHT = .92, 1.12            # height about 1.22 x width (the brief: 1.15 to 1.25)


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def bell(x, sigma):
    return np.exp(-(x / sigma) ** 2)


def plateau(x, sigma):
    """A bell with a flat top: a blunt, rounded lump, not a point."""
    return np.exp(-(x / sigma) ** 4)


def layout():
    """Where the game paints his features, as angles: θ down from the crown, a round from the front (degrees)."""
    code = ("import('./src/avatars/face.js').then(async f=>{const c=await import('./src/avatars/cast.js');"
            "console.log(JSON.stringify(f.faceLayout(c.recipeFor('%s'))))})" % args.name)
    out = subprocess.run(['node', '--input-type=module', '-e', "import {installDOM} from './tests/fixtures.mjs';installDOM();globalThis.self=globalThis;" + code],
                         cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip().splitlines()[-1]
    L = json.loads(out)
    theta = lambda y: 50.4 + y * (.58 * 180 / 256)
    return {'brow': theta(L['browY']), 'eye': theta(L['eyeY']), 'nose': theta(L['noseY']), 'mouth': theta(L['mouthY']),
            'eyeA': L['spread'] * (1.9 * 180 / math.pi / 256), 'canvas': L}


def sculpt(x, y, z, F):
    """The head's radius along each unit direction (game frame), before the half-axes are applied."""
    A = np.degrees(np.arctan2(x, z))
    a = np.abs(A)
    t = np.degrees(np.arccos(np.clip(y, -1, 1)))
    front = smooth(z, -.25, .45)
    low = smooth(-y, -.15, .55)
    # The skull: a rounded block. Squarer low and to the front (jaw corners, a flat face, flat temples), rounder over
    # the crown and at the back of the head.
    p = 2.3 + 1.5 * low * (.5 + .5 * front) + .5 * front * (1 - low)
    r = (np.abs(x) ** p + np.abs(y) ** p + np.abs(z) ** p) ** (-1 / p)
    # The crown comes in a little at the sides, so the head is widest at the jaw, not at the temples.
    r -= .06 * smooth(y, .05, .75) * bell(a - 90, 55)
    # Flat temples: the sides between the brow and the cheekbone drawn in.
    r -= .055 * bell(a - 84, 26) * bell(t - 80, 17)
    # The jaw: wide, with a corner under each ear, and a chin that is a squared base, not a point.
    r += .075 * bell(a - 60, 15) * bell(t - 131, 10)
    r += .1 * bell(a - 88, 28) * bell(t - 126, 13)                       # the jaw carried out at the sides: the head is widest here
    r += .07 * bell(a, 26) * bell(t - 140, 8)
    r += .03 * bell(a - 22, 9) * bell(t - 143, 7)                        # the chin's two corners
    # Cheekbones.
    r += .03 * bell(a - 37, 11) * bell(t - (F['eye'] + 10), 6)
    # The brow ridge: a bar over the eyes, heaviest toward the middle, hanging forward of the sockets under it.
    tb = F['brow']
    r += (.085 + .02 * bell(a, 12)) * bell(t - (tb + .5), 4.8) * smooth(-a, -52, -30)
    r += .022 * bell(t - (tb - 10), 10) * smooth(-a, -48, -20)             # the forehead leaning forward into it
    # The sockets: the eyes sit back under the ridge.
    for s in (-1, 1):
        r -= .058 * bell(A - s * F['eyeA'], 10.5) * bell(t - (F['eye'] + 1.5), 6.6)
    # The nose: a bridge that starts at the brow, widens and stands further forward toward the tip, a rounded tip
    # with a drop under it, and a nostril wing either side.
    t0, tt = tb + 2.5, F['nose']
    tc = tt - 2.0                                                           # where the nose stands furthest forward
    u = np.clip((t - t0) / (tc - t0), 0, 1)
    rise = (.055 + .15 * u ** 1.4) * smooth(t, t0 - 3.5, t0 + 2)
    end = np.where(t > tc, plateau(t - tc, 5.6), 1)                         # a round end, not a cut
    r += rise * end * bell(A, 4.4 + 4.2 * u)
    r += .125 * plateau(a, 9.2) * plateau(t - (tc + .4), 5.4)                  # the ball of the tip: broad and blunt
    r += .085 * bell(a - 11.2, 4.4) * bell(t - (tc + 1.6), 3.8)              # the nostril wings
    # The mouth's ground and the upper lip, a little forward of the cheeks.
    r += .022 * bell(a, 19) * bell(t - (F['mouth'] - 2), 7.5)
    return r


def to_blender(x, y, z):
    return np.stack([x, -z, y], axis=-1)


def build_head(F):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = 'METRIC'
    bpy.ops.mesh.primitive_uv_sphere_add(segments=192, ring_count=128, radius=1)
    head = bpy.context.object
    head.name = head.data.name = 'JohanssonHeadSculpt'
    mesh = head.data
    co = np.empty(len(mesh.vertices) * 3)
    mesh.vertices.foreach_get('co', co)
    co = co.reshape(-1, 3)
    n = co / np.linalg.norm(co, axis=1, keepdims=True)
    gx, gy, gz = n[:, 0], n[:, 2], -n[:, 1]                                 # Blender to the game frame
    r = sculpt(gx, gy, gz, F)
    mesh.vertices.foreach_set('co', (to_blender(gx, gy, gz) * r[:, None]).ravel())
    mesh.update()
    # Melt the seams between the sculpt's pieces, as a smoothing brush would; the mesh, not the formula, is what counts.
    m = head.modifiers.new('melt', 'SMOOTH')
    m.factor = .5
    m.iterations = 6
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


def write_module(table, F):
    lo, hi = float(table.min()), float(table.max())
    q = np.round((table - lo) / (hi - lo) * 65535).astype('<u2')
    data = base64.b64encode(q.tobytes()).decode()
    js = ("// Generated by tools/blender/build-johansson-head.py: the head sculpted in Blender, measured through every degree.\n"
          "// Do not edit: change the sculpt and run the script. radius = min + (max - min) * u16 / 65535, rows θ 0..180 (from the\n"
          "// crown), columns a -180..180 (round from the front, + to his left), in the head's own radius before its half-axes.\n"
          "export const RUGGED_HEAD=Object.freeze({width:%s,height:%s,na:%d,nt:%d,min:%r,max:%r,\n data:'%s'});\n"
          % (WIDTH, HEIGHT, table.shape[1], table.shape[0], round(lo, 6), round(hi, 6), data))
    (ROOT / 'src/avatars/sculpts/rugged-head.js').write_text(js)
    NT, NA = table.shape
    at = lambda t, a=0: float(table[int(round(t * (NT - 1) / 180)), int(round((a + 180) * (NA - 1) / 360))])
    report = {'source': 'Original Johansson Town head, sculpted in Blender for the game\'s generator',
              'generator': 'tools/blender/build-johansson-head.py', 'blender': bpy.app.version_string,
              'halfAxes': {'width': WIDTH, 'height': HEIGHT, 'depth': .98, 'heightOverWidth': round(HEIGHT / WIDTH, 3)},
              'radius': {'min': round(lo, 4), 'max': round(hi, 4)},
              'features_deg': {k: round(v, 2) for k, v in F.items() if k != 'canvas'},
              'profile': {'brow': round(at(F['brow']), 4), 'eyeSocket': round(at(F['eye'] + 1, F['eyeA']), 4), 'noseTip': round(at(F['nose']), 4),
                          'upperLip': round(at(F['mouth'] - 4), 4), 'chin': round(at(141), 4)},
              'jawCorner': round(at(130, 62), 4), 'temple': round(at(84, 78), 4)}
    (ART / 'head-sculpt-report.json').write_text(json.dumps(report, indent=1) + '\n')
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


def sheet():
    glb = ART / 'review/johansson-game.glb'
    glb.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['node', 'tools/export-avatar-glb.mjs', '--name', args.name, str(glb)], cwd=ROOT, check=True)
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
    bpy.ops.wm.save_as_mainfile(filepath=str(ART / 'johansson-rigged.blend'), compress=True)
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


if not args.only_sheet:
    if not (ROOT / 'src/avatars/sculpts/rugged-head.js').exists():        # the first run: a plain ball for the game to load
        write_module(np.ones((121, 241)) + np.linspace(0, 1e-6, 241)[None, :], {'brow': 80, 'eye': 90, 'nose': 105, 'mouth': 118, 'eyeA': 16})
    F = layout()
    head = build_head(F)
    table = measure(head)
    report = write_module(table, F)
    head.scale = (WIDTH, .98, HEIGHT)
    head['authoringSource'] = 'tools/blender/build-johansson-head.py'
    bpy.ops.wm.save_as_mainfile(filepath=str(ART / 'johansson-head.blend'), compress=True)
    print(json.dumps(report['profile']), report['radius'])
if args.sheet or args.only_sheet:
    sheet()
