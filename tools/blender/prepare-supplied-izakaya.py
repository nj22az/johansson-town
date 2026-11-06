"""Blender 4.2: preserve the supplied textured building while reducing geometry.

blender -b --python tools/blender/prepare-supplied-izakaya.py -- \
  --input /path/to/source.glb --root . --triangles 60000
The original remains in the owner's Drive; its SHA is recorded in the report.
"""
import argparse, hashlib, json, math, sys
from pathlib import Path
import bpy
from mathutils import Vector

p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--root',required=True);p.add_argument('--triangles',type=int,default=60000)
p.add_argument('--asset',default='izakaya');p.add_argument('--scale',type=float,default=4.3);p.add_argument('--front-offset',type=float,default=1.15)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);root=Path(a.root).resolve();source=Path(a.input).resolve()
art=root/f'art/{a.asset}/supplied';art.mkdir(parents=True,exist_ok=True)
out=root/f'assets/models/{a.asset}';out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
source_triangles=sum(len(face.vertices)-2 for o in objects for face in o.data.polygons)
print('SOURCE TRIANGLES',source_triangles,flush=True)
for obj in objects:
 bpy.context.view_layer.objects.active=obj;obj.select_set(True)
 modifier=obj.modifiers.new('Web geometry budget','DECIMATE');modifier.ratio=min(1,a.triangles/source_triangles);modifier.use_collapse_triangulate=True
 bpy.ops.object.modifier_apply(modifier=modifier.name)
 print('DECIMATED',obj.name,len(obj.data.polygons),flush=True)
 obj.select_set(False)

# Blender imports glTF Y-up into Z-up; the model's front faces Blender -Y.
points=[o.matrix_world@Vector(v) for o in objects for v in o.bound_box]
lo=Vector([min(v[i] for v in points) for i in range(3)]);hi=Vector([max(v[i] for v in points) for i in range(3)])
center=(lo+hi)/2
for obj in objects:
 transform=obj.matrix_world.copy()
 for vertex in obj.data.vertices:
  v=transform@vertex.co
  vertex.co=((v.x-center.x)*a.scale,(v.y-center.y)*a.scale-a.front_offset,(v.z-lo.z)*a.scale-.08)
 obj.matrix_world.identity();obj.name='Supplied '+a.asset
 obj.data.update()
 for material in obj.data.materials:
  material.use_backface_culling=True

bpy.ops.object.select_all(action='DESELECT')
for obj in objects:obj.select_set(True)
raw=art/'exterior-uncompressed.glb'
bpy.ops.export_scene.gltf(filepath=str(raw),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False)
report={'source_name':source.name,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'source_bytes':source.stat().st_size,'source_triangles':source_triangles,'target_triangles':a.triangles,'output_triangles':sum(len(f.vertices)-2 for o in objects for f in o.data.polygons),'scale':a.scale,'ground_offset':-.08,'front_offset':a.front_offset}
(art/'geometry-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('EXPORTED',json.dumps(report),flush=True)
