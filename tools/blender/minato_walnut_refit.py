"""Retire the old fitted furniture before the shared room is batched.

The original authoring calls still consume their deterministic random sequence so
unrelated furnishings keep their exact positions. These objects never reach the
export. The separately authored walnut assets are composed atomically at runtime.
"""
import re
from collections import Counter


RETIRED_FAMILIES = frozenset({
    'Counter carcass', 'Counter front slat', 'Counter kick', 'Guest ledge',
    'Counter arm-rail', 'Arm-rail bracket', 'Foot rail',
    'Serving shelf bracket', 'Serving shelf',
    'Back bar cupboard', 'Back bar top', 'Cupboard door seam',
    'Back bar mirror', 'Back bar stile', 'Back bar cornice',
    'Bottle shelf', 'Shelf light',
    'Bottle', 'Bottle neck', 'Bottle shoulder', 'Bottle cap', 'Bottle label', 'Keep tag',
})


def family(obj):
    return re.sub(r'\.\d+$', '', obj.name)


def retire_original_furniture(bpy):
    removed = Counter()
    relocated = Counter()
    for obj in list(bpy.context.scene.objects):
        if obj.type != 'MESH':
            continue
        name = family(obj)
        # Bottle labels also appear on the kitchen's sauces: only the stock
        # against the old backbar belongs to this replacement.
        old_stock = -4.65 < obj.location.x < -1.05 and 5.80 < obj.location.y < 6.30
        # The original source reuses Counter front slat for Sato Ramen, whose
        # separate lunch counter stays in place.
        minato_side = obj.location.x < 3.5
        if name in RETIRED_FAMILIES and minato_side and (not name.startswith(('Bottle', 'Keep tag')) or old_stock):
            removed[name] += 1
            bpy.data.objects.remove(obj, do_unlink=True)
            continue
        # Keep the working rice cooker and clean plates, on the free ends of the
        # rear prep strip. Blender coordinates are x,-game-z,game-y.
        if name in ('Rice cooker', 'Rice cooker lid'):
            obj.location.x += 9.67       # -3.60 -> 6.07
            obj.location.y += .22       # -5.95 -> -6.17 in the game
            obj.location.z -= .0185     # base .92 -> .9015 above .8975 steel
            relocated[name] += 1
        elif name == 'Stacked plates':
            obj.location.x += 7.69       # -2.70 -> 4.99
            obj.location.y += .18       # -5.95 -> -6.13
            obj.location.z -= .0225     # first base .924 -> .9015
            relocated[name] += 1
    return {
        'assets': ['minato-walnut-backbar.glb', 'minato-walnut-counter.glb'],
        'removedObjects': sum(removed.values()),
        'removedFamilies': dict(sorted(removed.items())),
        'relocatedFamilies': dict(sorted(relocated.items())),
        'replacementBottleCount': 42,
        'replacementBrandCount': 14,
        'serviceTop': .78,
        'floorTop': .04,
    }


def remove_counter_contact_faces(bpy, top=.78):
    """Open invisible prop bases at their contact with the new opaque slate.

The original export made every finish double-sided. A fish-case bottom 0.5 mm
above its ice and counter, or a closed vessel base at the same depth as the top,
could therefore draw a second upward face. Remove only those horizontal contact
polygons inside the replaced counter footprint; visible walls, rims and contents
retain their authored geometry and all other room surfaces are untouched.
"""
    import bmesh
    bpy.context.view_layer.update()
    removed = Counter()
    for obj in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
        vertices = [obj.matrix_world @ v.co for v in obj.data.vertices]
        if not vertices:
            continue
        lo = [min(v[i] for v in vertices) for i in range(3)]
        hi = [max(v[i] for v in vertices) for i in range(3)]
        if lo[0] < -5.01 or hi[0] > 3.41 or lo[1] < 1.915 or hi[1] > 2.765:
            continue
        if lo[2] > top + .0021 or hi[2] < top - .0021:
            continue
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        faces = []
        for face in bm.faces:
            world = [obj.matrix_world @ v.co for v in face.verts]
            if all(abs(v.z - top) <= .0021 for v in world) and max(v.z for v in world) - min(v.z for v in world) < .00001:
                faces.append(face)
        if faces:
            removed[family(obj)] += len(faces)
            bmesh.ops.delete(bm, geom=faces, context='FACES')
            bm.to_mesh(obj.data)
            obj.data.update()
        bm.free()
    return {'removedContactFaces': sum(removed.values()), 'families': dict(sorted(removed.items()))}
