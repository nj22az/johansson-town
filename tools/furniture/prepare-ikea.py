"""Create small, texture-free game variants of the downloaded IKEA furniture."""
import bpy, os, sys, argparse
root=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
parser=argparse.ArgumentParser();parser.add_argument('--only',choices=['lack','ivar'])
options=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
for name,colour in [('lack',(0.83,0.78,0.65,1)),('ivar',(0.57,0.40,0.23,1))]:
 if options.only and name!=options.only:continue
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 path=os.path.join(root,'assets/models/furniture/ikea-'+name+'.glb')
 bpy.ops.import_scene.gltf(filepath=path)
 for obj in list(bpy.context.scene.objects):
  if obj.type!='MESH':continue
  mat=bpy.data.materials.new(name+' town palette');mat.diffuse_color=colour;mat.use_nodes=True
  bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=colour;bs.inputs['Roughness'].default_value=.95
  obj.data.materials.clear();obj.data.materials.append(mat)
  for poly in obj.data.polygons:poly.material_index=0
  # IVAR's joined panels contain seams that collapse simplification opens into
  # visible slits. Its original geometry is small enough to retain intact.
  if name!='ivar' and len(obj.data.polygons)>5000:
   mod=obj.modifiers.new('Mobile silhouette','DECIMATE');mod.ratio=min(1,5000/len(obj.data.polygons));bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.ops.export_scene.gltf(filepath=os.path.join(root,'assets/models/furniture/town-'+name+'.glb'),export_format='GLB',export_texcoords=False,export_cameras=False,export_lights=False)
 print('PREPARED',name)
