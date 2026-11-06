"""Bake an owned static display with its source paint on a coherent new UV atlas.

Blender --background --python tools/blender/decimate-static-display.py -- source.glb output.glb 1500
The original file is never written. Dense scan UV islands cannot survive collapse;
selected-to-active color baking transfers the original paint to the display mesh.
"""
import bpy
import sys
from pathlib import Path

source, destination, target = sys.argv[sys.argv.index("--") + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(Path(source).resolve()))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
assert len(meshes) == 1, 'A display must be a single textured mesh'
obj = meshes[0]
high = obj
low = obj.copy()
low.data = obj.data.copy()
bpy.context.collection.objects.link(low)
low.name = 'Maneki-neko painted display'
bpy.ops.object.select_all(action='DESELECT')
obj = low
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
triangles = sum(len(p.vertices) - 2 for p in obj.data.polygons)
modifier = obj.modifiers.new(name='Static display LOD', type='DECIMATE')
modifier.decimate_type = 'COLLAPSE'
modifier.ratio = int(target) / triangles
modifier.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier=modifier.name)

# A new continuous chart layout avoids unrelated source atlas patches spanning
# a decimated triangle. Bake only color; source lighting is not baked into paint.
while obj.data.uv_layers:
    obj.data.uv_layers.remove(obj.data.uv_layers[0])
obj.data.uv_layers.new(name='DisplayUV')
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.151917, island_margin=0.025)
bpy.ops.object.mode_set(mode='OBJECT')
image = bpy.data.images.new('Maneki original paint display bake', width=1024, height=1024, alpha=False)
image.colorspace_settings.name = 'sRGB'
material = bpy.data.materials.new('Material_0')
material.use_nodes = True
principled = material.node_tree.nodes.get('Principled BSDF')
principled.inputs['Metallic'].default_value = 0
principled.inputs['Roughness'].default_value = 0.9
texture = material.node_tree.nodes.new('ShaderNodeTexImage')
texture.image = image
material.node_tree.links.new(texture.outputs['Color'], principled.inputs['Base Color'])
material.node_tree.nodes.active = texture
obj.data.materials.clear()
obj.data.materials.append(material)
for polygon in obj.data.polygons:
    polygon.material_index = 0
    polygon.use_smooth = True
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 1
scene.render.bake.use_selected_to_active = True
scene.render.bake.use_pass_direct = False
scene.render.bake.use_pass_indirect = False
scene.render.bake.use_pass_color = True
scene.render.bake.cage_extrusion = 0.05
scene.render.bake.max_ray_distance = 0.15
scene.render.bake.margin = 12
bpy.ops.object.select_all(action='DESELECT')
high.select_set(True)
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, use_selected_to_active=True)
image.pack()
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(Path(destination).resolve()), export_format='GLB', use_selection=True, export_animations=False, export_skins=False)
print('DISPLAY_TRIANGLES', sum(len(p.vertices) - 2 for p in obj.data.polygons))
