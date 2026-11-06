"""Render the actual source bridge plus exported Blender navigation feeder.
Run node tools/export-bridge-lantern-review.mjs first. This is Blender visual
evidence, not a claim about the browser renderer or physical device performance.
"""
import bpy,json,math,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/qa/navigation-feeder-2026-11-02';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def B(p):return (p[0],-p[2],p[1])
for d in json.loads((OUT/'bridge-source-geometry.json').read_text()):
 mesh=bpy.data.meshes.new(d['name']);mesh.from_pydata([B(d['points'][i:i+3]) for i in range(0,len(d['points']),3)],[],[(i,i+1,i+2)for i in range(0,len(d['points'])//3,3)]);mesh.update()
 color=mesh.color_attributes.new(name='Col',type='FLOAT_COLOR',domain='CORNER')
 for i,v in enumerate(color.data):v.color=(*d['colours'][i*3:i*3+3],1)
 mat=bpy.data.materials.new(d['name']);mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.6
 v=mat.node_tree.nodes.new('ShaderNodeVertexColor');v.layer_name='Col';mat.node_tree.links.new(v.outputs['Color'],bs.inputs['Base Color'])
 if d['glass']:bs.inputs['Transmission Weight'].default_value=.85;bs.inputs['Roughness'].default_value=.12
 o=bpy.data.objects.new(d['name'],mesh);bpy.context.collection.objects.link(o);mesh.materials.append(mat)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/models/ferry-bridge/navigation-feeder-v2.glb'))
# Reproduce the runtime canvas panel text as editable Blender text for this
# source-geometry proof (not a browser screenshot).
for name,label,p,size in [('Header','NAVIGATION LIGHTS  105 V AC',(-2.05,1.245,-.622),.029)]+[(str(i),t,(-2.425+i*.27,1.158,-.622),.022)for i,t in enumerate(['STBD','PORT','MASTHEAD','STERN'])]:
 d=bpy.data.curves.new('Panel text '+name,'FONT');d.body=label;d.size=size;d.align_x='CENTER';o=bpy.data.objects.new('Panel text '+name,d);bpy.context.collection.objects.link(o);o.location=B(p);o.rotation_euler=(math.pi/2,0,math.pi)
 m=bpy.data.materials.new('Panel ink '+name);m.diffuse_color=(.03,.05,.06,1);d.materials.append(m)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=8;s.cycles.use_denoising=True;s.render.threads_mode='FIXED';s.render.threads=2;s.render.image_settings.file_format='PNG';s.view_settings.view_transform='AgX'
s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.8,.9,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.8
for name,p,power,size in [('Bridge daylight',(1,-2,5),650,5),('Room fill',(0,4,3),400,4)]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=p;o.rotation_euler=(Vector((2,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
for name,p,target,scale in [
 ('console',(-1.7,1.65,-1.75),(-2.05,1.16,-.445),1.65),
 ('circuit-overview',(-4.0,3.2,-2.2),(-3.12,1.1,-.25),3.3),
 ('external-lamp',(-5.0,1.9,.7),(-4.18,1.315,-.25),.85)]:
 if '--console-only' in sys.argv and name!='console':continue
 d=bpy.data.cameras.new(name);cam=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(cam);cam.location=B(p);cam.rotation_euler=(Vector(B(target))-cam.location).to_track_quat('-Z','Y').to_euler();d.type='ORTHO';d.ortho_scale=scale;s.camera=cam;s.render.resolution_x=960;s.render.resolution_y=600;s.render.filepath=str(OUT/(name+'-final.png'));bpy.ops.render.render(write_still=True)
