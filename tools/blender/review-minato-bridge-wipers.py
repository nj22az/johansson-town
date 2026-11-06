"""Actual source bridge with final native wipers, interior/exterior proofs.
Run tools/export-bridge-wipers-review.mjs first. These are Blender views, not
browser screenshots or physical-device performance evidence.
"""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/qa/bridge-wipers-2026-11-02';OUT.mkdir(parents=True,exist_ok=True)
PLAN=json.loads((ROOT/'art/ferry-bridge-wipers/scene.json').read_text())
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def B(p):return Vector((p[0],-p[2],p[1]))
for d in json.loads((OUT/'bridge-source-geometry.json').read_text()):
 mesh=bpy.data.meshes.new(d['name']);mesh.from_pydata([B(d['points'][i:i+3]) for i in range(0,len(d['points']),3)],[],[(i,i+1,i+2)for i in range(0,len(d['points'])//3,3)]);mesh.update()
 color=mesh.color_attributes.new(name='Col',type='FLOAT_COLOR',domain='CORNER')
 for i,v in enumerate(color.data):v.color=(*d['colours'][i*3:i*3+3],1)
 mat=bpy.data.materials.new(d['name']);mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.65
 v=mat.node_tree.nodes.new('ShaderNodeVertexColor');v.layer_name='Col';mat.node_tree.links.new(v.outputs['Color'],bs.inputs['Base Color'])
 if d['glass']:
  bs.inputs['Transmission Weight'].default_value=1;bs.inputs['Roughness'].default_value=.08;bs.inputs['IOR'].default_value=1.45
  # The actual glass geometry is unmodified; source opacity stays documented.
 o=bpy.data.objects.new(d['name'],mesh);bpy.context.collection.objects.link(o);mesh.materials.append(mat)
units=[]
for x in PLAN['sourcePane']['centres']:
 before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/models/ferry-bridge/bridge-wipers-v1.glb'));added=set(bpy.data.objects)-before
 root=bpy.data.objects.new('Native wiper on actual pane '+str(x),None);bpy.context.collection.objects.link(root);root.location=B((x+PLAN['rootXOffset'],PLAN['rootY'],0))
 nodes={}
 for o in added:
  if not o.parent:o.parent=root
  for n in PLAN['parts']:
   if o.name=='wiper_'+n or o.name.startswith('wiper_'+n+'.'):nodes[n]=o;o.rotation_mode='XYZ'
 units.append(nodes)
def pose(angle):
 for nodes in units:
  nodes['drive'].rotation_euler[1]=-angle;nodes['idler'].rotation_euler[1]=-angle
  nodes['carrier'].location=B((PLAN['armLength']*math.sin(angle),-PLAN['armLength']*math.cos(angle),0))
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=16;s.cycles.use_denoising=True;s.render.threads_mode='FIXED';s.render.threads=2;s.render.image_settings.file_format='PNG';s.view_settings.view_transform='AgX'
s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.68,.8,.89,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.8
for name,p,power,size in [('Exterior daylight',(0,2.8,2.8),650,4),('Cabin fill',(0,1.7,-2),500,3)]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=B(p);o.rotation_euler=(B((0,1.5,0))-o.location).to_track_quat('-Z','Y').to_euler()
views=[('outside-parked',(1.6,1.95,4),(0,1.55,0),4.6,-.7),('inside-parked',(-.7,1.65,-2.35),(0,1.5,0),3.4,-.7),('outside-midstroke',(.9,1.85,2.5),(0,1.50,0),3.8,0),('outside-contact-detail',(.42,1.66,.60),(0,1.55,0),1.22,.7)]
for name,p,target,scale,angle in views:
 pose(angle);d=bpy.data.cameras.new(name);cam=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(cam);cam.location=B(p);cam.rotation_euler=(B(target)-cam.location).to_track_quat('-Z','Y').to_euler();d.type='ORTHO';d.ortho_scale=scale;s.camera=cam;s.render.resolution_x=1200;s.render.resolution_y=800;s.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
pose(-.7);bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'actual-source-review.blend'))
