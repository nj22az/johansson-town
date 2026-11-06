"""Original Minato izakaya kit. Blender 4.2+, metres, Principled glTF materials.
Run: blender -b --python tools/blender/build-izakaya.py -- --root .
"""
import bpy, math, sys, argparse, json
from pathlib import Path
from mathutils import Vector
p=argparse.ArgumentParser();p.add_argument('--root',required=True);a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);root=Path(a.root).resolve();out=root/'assets/models/izakaya';out.mkdir(parents=True,exist_ok=True);art=root/'art/izakaya';art.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
materials={}
def mat(name,color,rough=.65,glow=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;bs=m.node_tree.nodes['Principled BSDF'];rgb=tuple((int(color[i:i+2],16)/255)**2.2 for i in (0,2,4));bs.inputs['Base Color'].default_value=(*rgb,1);bs.inputs['Roughness'].default_value=rough
 if glow:bs.inputs['Emission Color'].default_value=(*rgb,1);bs.inputs['Emission Strength'].default_value=glow
 materials[name]=m;return m
wood=mat('Honey cedar','965332');dark=mat('Smoked timber','392621');plaster=mat('Warm limewash','e8c894');roof=mat('Indigo ceramic','344553',.38);red=mat('Persimmon noren','c55043');paper=mat('Lantern paper','ffbd74',.72,.45);cream=mat('Rice paper','fff0c7');green=mat('Bottle green','3c7961',.32);blue=mat('Arita blue','315973',.3);food=mat('Grilled glaze','a75c27',.38);leaf=mat('Edamame','7c9b45');metal=mat('Aged brass','be9748',.35)
# Input uses Three.js x,y,z; Blender uses x,-z,y.
def pos(v):return (v[0],-v[2],v[1])
def cube(name,size,at,m,bevel=.035):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos(at));o=bpy.context.object;o.name=name;o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:
  b=o.modifiers.new('Soft worked edges','BEVEL');b.width=min(bevel,min(size)/3);b.segments=2;bpy.ops.object.modifier_apply(modifier=b.name);o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=o.modifiers[-1].name)
 return o
def sphere(name,scale,at,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,radius=1,location=pos(at));o=bpy.context.object;o.name=name;o.scale=(scale[0],scale[2],scale[1]);o.data.materials.append(m)
 for f in o.data.polygons:f.use_smooth=True
 return o
def cyl(name,r,h,at,m):
 bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=r,depth=h,location=pos(at));o=bpy.context.object;o.name=name;o.data.materials.append(m);b=o.modifiers.new('Rim bevel','BEVEL');b.width=min(.025,h/5);b.segments=2;bpy.ops.object.modifier_apply(modifier=b.name);return o
def lantern(x,y,z):
 sphere('Ribbed paper lantern',(.24,.37,.24),(x,y,z),paper)
 for dy in [-.34,.34]:cyl('Lantern cap',.14,.045,(x,y+dy,z),dark)
 for dy in [-.24,-.12,0,.12,.24]:
  bpy.ops.mesh.primitive_torus_add(major_segments=24,minor_segments=4,location=pos((x,y+dy,z)),major_radius=.237*math.sqrt(1-(dy/.39)**2),minor_radius=.008);bpy.context.object.data.materials.append(red)
 cyl('Lantern cord',.012,.4,(x,y+.55,z),dark)
def bottle(x,y,z):
 cyl('Bottle body',.07,.25,(x,y+.125,z),green);cyl('Bottle neck',.029,.13,(x,y+.31,z),green);cube('Bottle label',(.09,.13,.008),(x,y+.13,z+.07),cream,.002)
def dish(x,y,z):
 cyl('Blue ceramic plate',.23,.04,(x,y,z),blue);cyl('Porcelain well',.19,.015,(x,y+.025,z),cream)
 for i in range(3):
  cube('Bamboo skewer',(.025,.02,.40),(x-.10+i*.10,y+.06,z),wood,.005)
  for j in range(3):sphere('Yakitori',(.04,.035,.048),(x-.10+i*.10,y+.085,z-.11+j*.095),food)
def stool(x,z):
 cyl('Round stool cushion',.30,.14,(x,.64,z),red)
 for dx in [-.19,.19]:
  for dz in [-.19,.19]:cube('Stool leg',(.07,.59,.07),(x+dx,.30,z+dz),dark,.012)
def merge_export(name):
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
 # Each finish is one mesh/draw, not hundreds of individually exported components.
 for m in materials.values():
  selected=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==m]
  if not selected:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in selected:o.select_set(True)
  bpy.context.view_layer.objects.active=selected[0];bpy.ops.object.join();bpy.context.object.name=name+' / '+m.name
 bpy.ops.wm.save_as_mainfile(filepath=str(art/(name+'.blend')),compress=True)
 bpy.ops.export_scene.gltf(filepath=str(out/(name+'.glb')),export_format='GLB',export_yup=True,export_animations=False)
 report[name]={'meshes':len([o for o in bpy.context.scene.objects if o.type=='MESH']),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH'),'bytes':(out/(name+'.glb')).stat().st_size}
def render(name,camera,target,ortho):
 scene=bpy.context.scene;scene.world=bpy.data.worlds.new('Warm daylight');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.78,.86,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
 bpy.ops.object.light_add(type='AREA',location=pos((1,10,7)));bpy.context.object.data.energy=1700;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=8
 bpy.ops.object.camera_add(location=pos(camera));cam=bpy.context.object;cam.rotation_euler=(Vector(pos(target))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=ortho;scene.camera=cam
 scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True;scene.render.resolution_x=1000;scene.render.resolution_y=850;scene.render.resolution_percentage=100;scene.render.filepath=str(art/(name+'.png'));bpy.ops.render.render(write_still=True)
report={}
# Street-facing building. Front +Z, origin at ground centre.
cube('Stone footing',(8.4,.24,8.4),(0,0,0),dark)
cube('Rear plaster wall',(8,4,.22),(0,2,-4),plaster)
for x in [-4,4]:cube('Side plaster wall',(.22,4,8),(x,2,0),plaster)
for x in [-2.6,2.6]:
 cube('Recessed frontage',(2.6,2.75,.22),(x,1.4,3.9),dark)
 for n in range(12):cube('Cedar lattice',(.055,2.35,.12),(x-1.1+n*.20,1.38,4.09),wood,.012)
 cube('Warm window',(2.25,1.65,.05),(x,1.65,3.99),paper,.01)
for x in [-4,-1.15,1.15,4]:cube('Facade post',(.17,4.1,.22),(x,2.05,4),dark)
for y in [.35,2.8,3.85]:cube('Facade lintel',(8.25,.16,.25),(0,y,4),wood)
cube('Door threshold',(2.4,.13,1.0),(0,.08,4.2),wood)
for n in range(5):cube('Split noren',(.42,.7,.04),(-.9+n*.45,2.45,4.18),red,.025)
cube('Sign backing',(3.7,.73,.17),(0,3.35,4.2),dark)
for side in [-1,1]:
 o=cube('Ceramic roof',(4.6,.17,9.2),(side*2.15,4.42,0),roof);o.rotation_euler.y=side*.21
 for n in range(22):
  # narrow rounded tile ribs follow the same roof slope
  for x in [side*.3,side*1.2,side*2.1,side*3,side*3.9]:
   seam=cube('Ceramic tile seam',(.92,.025,.025),(x,4.95-abs(x)*.213,-4.4+n*.42),roof,.006);seam.rotation_euler.y=side*.21
lantern(-1.7,2.6,4.55);lantern(1.7,2.6,4.55)
for x in [-3.4,3.4]:
 cyl('Flower pot',.29,.48,(x,.35,4.6),wood)
 for i in range(6):sphere('Camellia leaves',(.17,.28,.14),(x+math.sin(i)*.19,.85+(i%2)*.17,4.6+math.cos(i)*.19),green)
merge_export('minato-exterior');render('minato-exterior',(10,8,14),(0,2,0),14)
# The room (minato-interior.glb) is built by build-minato-interior.py.
path=art/'export-report.json';data=json.loads(path.read_text()) if path.exists() else {};data.update(report);path.write_text(json.dumps(data,indent=2))
