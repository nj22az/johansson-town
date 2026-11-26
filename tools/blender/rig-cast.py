"""Every resident as a rigged character in Blender, and the cast on one toon sheet.

  python tools/blender/rig-cast.py --root . [--only "Thao,Chin"] [--out output/rigged-cast]     (bpy 5.x from pip)

The owner, 26 November 2026: "I want everyone to be remodelled in blender so they are fully rigged and look like 2d characters
from a cartoon in 3d", "The clothes need to be rigged too", "And all hairstyles".

For each resident of the guide (guide/residents.json) the game's generator builds them (their head, the body kit's limbs,
feet, shoes and nose, their clothes and hair) and tools/export-avatar-glb.mjs hands them over; here each becomes a Blender
character:
- the ARMATURE of 28 bones (root, hips, spine, chest, neck, head, both arms and legs, the hair's and the braids' chains,
  the skirt's and the shirt hem's quarters);
- the body welded and taken apart into its PIECES, each its own object skinned to the armature and named for what moves
  it: the torso and its clothes, each sleeve and hem, each arm, leg, hand, foot and shoe, the hair, and so on. The clothes
  are rigged because they are skinned pieces of the same rig, and so is every hairstyle;
- the HEAD on its bone, with its painted face and its four shape keys (smile, shy, surprised, blink);
- toon materials (two bands) and ink outlines (Freestyle), so the file opens looking like the cartoon.
Writes <out>/<name>.blend for each (not kept in the repository: a hundred megabytes of files that this command makes
again), and art/characters/cast/blender-cast-sheet.png and rigged-cast.json, which are.
"""
import argparse
import json
import math
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument('--root', default='.')
ap.add_argument('--only', default='')
ap.add_argument('--out', default='output/rigged-cast')
known, _ = ap.parse_known_args(argv)
sys.argv = [sys.argv[0], '--', '--root', known.root]                         # head_sculpt reads --root itself
import bpy                                                                  # noqa: E402
import numpy as np                                                          # noqa: E402
from mathutils import Vector                                                # noqa: E402
import head_sculpt as H                                                     # noqa: E402

ROOT = Path(known.root).resolve()
OUT = (ROOT / known.out).resolve()
OUT.mkdir(parents=True, exist_ok=True)
SHEET = ROOT / 'art/characters/cast'
SHEET.mkdir(parents=True, exist_ok=True)
names = [r['name'] for r in json.loads((ROOT / 'guide/residents.json').read_text())]
if known.only:
    names = [n for n in names if n in known.only.split(',')]
slug = lambda n: re.sub(r'[^a-z0-9]+', '-', n.lower().replace('ō', 'o')).strip('-')
W, HH = 360, 430
shots, report = [], {}

for name in names:
    glb = OUT / (slug(name) + '.glb')
    subprocess.run(['node', 'tools/export-avatar-glb.mjs', '--name', name, str(glb)], cwd=ROOT, check=True, capture_output=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(glb))
    glb.unlink()
    scene = bpy.context.scene
    rig = next(o for o in scene.objects if o.type == 'ARMATURE')
    rig.name = name
    for m in bpy.data.materials:
        if m.use_nodes:
            H.toon(m)
    # The body: welded (the generator draws every triangle with its own corners), then taken apart into its pieces.
    body = next(o for o in scene.objects if o.type == 'MESH' and o.find_armature() and 'body' in o.name.lower())
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=1e-5)
    bpy.ops.mesh.separate(type='LOOSE')
    bpy.ops.object.mode_set(mode='OBJECT')
    pieces = [o for o in scene.objects if o.type == 'MESH' and o.find_armature()]
    count = {}
    for o in pieces:
        if len(o.data.vertices) < 3:
            continue
        # named for the bone that carries most of it
        weight = {}
        for v in o.data.vertices:
            for g in v.groups:
                weight[g.group] = weight.get(g.group, 0) + g.weight
        bone = o.vertex_groups[max(weight, key=weight.get)].name if weight else 'body'
        count[bone] = count.get(bone, 0) + 1
        o.name = o.data.name = f'{bone} · piece {count[bone]}'
        for p in o.data.polygons:
            p.use_smooth = True
    meshes = [o for o in scene.objects if o.type == 'MESH']
    head = next((o for o in meshes if 'head' in o.name.lower() and not o.find_armature()), None)
    report[name] = {'file': f'{slug(name)}.blend', 'bones': len(rig.data.bones), 'skinnedPieces': len(pieces),
                    'piecesByBone': dict(sorted(count.items())), 'vertices': sum(len(o.data.vertices) for o in meshes),
                    'faceShapeKeys': [k.name for k in head.data.shape_keys.key_blocks] if head and head.data.shape_keys else []}
    # The sheet's picture: a bust, toon and ink.
    top = max((o.matrix_world @ Vector(c)).z for o in meshes for c in o.bound_box)
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 12
    scene.cycles.use_denoising = False
    scene.cycles.max_bounces = 2
    scene.cycles.transparent_max_bounces = 8
    scene.view_settings.view_transform = 'Standard'
    scene.render.resolution_x, scene.render.resolution_y = W, HH
    world = bpy.data.worlds.new('Paper')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (.82, .88, .92, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = .5
    scene.world = world
    sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN'))
    sun.data.energy, sun.data.use_shadow = 3.2, False
    scene.collection.objects.link(sun)
    scene.render.use_freestyle = True
    scene.render.line_thickness = 2.2
    fs = bpy.context.view_layer.freestyle_settings
    ls = fs.linesets[0] if fs.linesets else fs.linesets.new('ink')
    ls.select_silhouette, ls.select_border, ls.select_crease, ls.select_external_contour = True, False, False, True
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new('ink')
    ls.linestyle.color = (.19, .12, .10)
    cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera'))
    cam.data.lens = 70
    scene.collection.objects.link(cam)
    scene.camera = cam
    target, a = Vector((0, 0, top - .3)), math.radians(32)
    cam.location = target + Vector((math.sin(a) * 2.5, -math.cos(a) * 2.5, .06))
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sun.rotation_euler = (Vector((0, 0, 0)) - Vector((math.sin(a - .32) * 3, -math.cos(a - .32) * 3, 2.6))).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / (slug(name) + '.blend')), compress=True)
    scene.render.filepath = str(OUT / (slug(name) + '.png'))
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(scene.render.filepath)
    arr = np.empty(W * HH * 4, dtype=np.float32)
    img.pixels.foreach_get(arr)
    shots.append(arr.reshape(HH, W, 4).copy())
    report[name]['megabytes'] = round((OUT / (slug(name) + '.blend')).stat().st_size / 1e6, 2)
    print(name, report[name]['skinnedPieces'], 'pieces', report[name]['megabytes'], 'MB', flush=True)

if not known.only:
    cols = 6
    rows = math.ceil(len(shots) / cols)
    sheet = np.ones((rows * HH, cols * W, 4), dtype=np.float32)
    for i, s in enumerate(shots):
        r, c = rows - 1 - i // cols, i % cols                               # Blender's pixels run from the bottom row up
        sheet[r * HH:(r + 1) * HH, c * W:(c + 1) * W] = s
    out = bpy.data.images.new('cast', cols * W, rows * HH)
    out.pixels.foreach_set(sheet.ravel())
    out.filepath_raw = str(SHEET / 'blender-cast-sheet.png')
    out.file_format = 'PNG'
    out.save()
    (SHEET / 'rigged-cast.json').write_text(json.dumps({'generator': 'tools/blender/rig-cast.py', 'blender': bpy.app.version_string,
                                                        'order': names, 'characters': report}, indent=1, ensure_ascii=False) + '\n')
print('done', len(shots))
