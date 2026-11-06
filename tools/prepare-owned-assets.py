"""Prepare Nils Johansson's owned sculpts. Originals are never overwritten.
Run: blender -b --python tools/prepare-owned-assets.py -- SOURCE_FOLDER OUTPUT_FOLDER
"""
import bpy, bmesh, math, sys
from pathlib import Path
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:];source=Path(args[0]);out=Path(args[1]);out.mkdir(parents=True,exist_ok=True)
def import_mesh(name):
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(source/(name+'.glb')));bpy.context.view_layer.update()
 o=next(o for o in bpy.context.scene.objects if o.type=='MESH');bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);return o
def bounds(o):
 return [min(v.co[i] for v in o.data.vertices) for i in range(3)],[max(v.co[i] for v in o.data.vertices) for i in range(3)]
def optimize(o,target):
 mod=o.modifiers.new('Game mesh reduction','DECIMATE');mod.ratio=min(1,target/max(1,len(o.data.polygons)));bpy.ops.object.modifier_apply(modifier=mod.name)
 for p in o.data.polygons:p.use_smooth=True
 for image in bpy.data.images:
  if image.source!='GENERATED' and max(image.size)>1024:image.scale(1024,1024)
 # Baking already contains colour and depth. Avoid metallic glare on faces.
 for mat in o.data.materials:
  if mat and mat.use_nodes:
   for n in mat.node_tree.nodes:
    if n.type=='BSDF_PRINCIPLED':n.inputs['Metallic'].default_value=0;n.inputs['Roughness'].default_value=.9
 return o
def rig(o,kind):
 lo,hi=bounds(o);H=hi[2]-lo[2];cx=(lo[0]+hi[0])/2;cy=(lo[1]+hi[1])/2
 for v in o.data.vertices:v.co-=Vector((cx,cy,lo[2]))
 # Model dimensions are in metres. Barfly is standing; Jonsson is kneeling.
 scale=(1.5 if kind=='barfly' else 1.35)/H
 for v in o.data.vertices:v.co*=scale
 H*=scale
 arm=bpy.data.armatures.new(kind+' skeleton');a=bpy.data.objects.new(kind+' rig',arm);bpy.context.collection.objects.link(a);bpy.context.view_layer.objects.active=a;a.select_set(True);o.select_set(False);bpy.ops.object.mode_set(mode='EDIT')
 positions={'root':((0,0,0),(0,0,H*.12),None),'torso':((0,0,H*.3),(0,0,H*.61),'root'),'head':((0,0,H*.60),(0,0,H*.92),'torso')}
 for side,s in [('L',-1),('R',1)]:
  positions['upper'+side]=((s*H*.23,0,H*.58),(s*H*.28,-H*.02,H*.39),'torso')
  positions['fore'+side]=((s*H*.28,-H*.02,H*.39),(s*H*.28,-H*.03,H*.25),'upper'+side)
  if kind=='barfly':positions['leg'+side]=((s*H*.12,0,H*.29),(s*H*.12,0,H*.04),'root')
 bones={}
 for n,(h,t,parent) in positions.items():
  b=arm.edit_bones.new(n);b.head=h;b.tail=t;bones[n]=b
  if parent:b.parent=bones[parent]
 bpy.ops.object.mode_set(mode='OBJECT');groups={n:o.vertex_groups.new(name=n) for n in positions}
 for v in o.data.vertices:
  x,y,z=v.co;h=z/H;s='L' if x<0 else 'R';ax=abs(x)/H
  weights={'root':1}
  if kind=='barfly':
   if .24<h<.60 and ax>.215:
    amount=max(0,min(1,(ax-.215)/.075));blend=max(0,min(1,(h-.34)/.12));weights={'upper'+s:amount*blend,'fore'+s:amount*(1-blend),'torso':1-amount}
   elif h>.61:weights={'head':1}
   elif h>.53:blend=(h-.53)/.08;weights={'head':blend,'torso':1-blend}
   elif h>.29:weights={'torso':1}
   else:weights={'leg'+s:1}
  else:
   # Base and engine stay bound to root; only the mechanic's head and arms move.
   if h>.68:weights={'head':1}
   elif h>.60 and ax<.2:blend=(h-.60)/.08;weights={'head':blend,'root':1-blend}
   elif .58<h<.65 and ax>.20 and y< H*.10:
    amount=min(1,(h-.58)/.035);weights={'fore'+s:amount,'root':1-amount}
  for n,w in weights.items():
   if w>0:groups[n].add([v.index],w,'REPLACE')
 mod=o.modifiers.new('Skin','ARMATURE');mod.object=a;o.parent=a
 # Every clip has full rest keys so transitions cannot retain a previous pose.
 for name,length,amplitude in [('Idle',4,.025),('Wave',2,.12),('Work',3,.065)]:
  a.animation_data_create();action=bpy.data.actions.new(name);a.animation_data.action=action
  for frame,phase in [(1,0),(int(length*24/4),1),(int(length*24/2),0),(int(length*24*3/4),-1),(int(length*24),0)]:
   for pb in a.pose.bones:
    pb.rotation_mode='XYZ';pb.rotation_euler=(0,0,0)
    if pb.name=='head':pb.rotation_euler[2]=phase*amplitude
    if pb.name.startswith('fore'):pb.rotation_euler[0]=phase*amplitude*(1 if pb.name.endswith('L') else -1)
    if name=='Wave' and pb.name=='upperR':pb.rotation_euler[2]=-.35+phase*.10
    if name=='Wave' and pb.name=='foreR':pb.rotation_euler[2]=-.2+phase*.12
    pb.keyframe_insert(data_path='rotation_euler',frame=frame,group=pb.name)
  track=a.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action);strip.action_frame_end=length*24
 a.animation_data.action=None
 # Avoid summing NLA clips in the rest pose; exporter exports each named track.
 for track in a.animation_data.nla_tracks:track.mute=True
 bpy.context.scene.render.fps=24
 return a
for kind in ['barfly','Jonsson','merry_Moose','Maneki_neko_Colorful']:
 o=import_mesh(kind)
 if kind=='barfly':
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.co.x>-.12 or v.co.z<0],context='VERTS');bm.to_mesh(o.data);bm.free()
 optimize(o,18000 if kind=='barfly' else 26000)
 if kind=='merry_Moose':
  # This sculpt has a damaged monochrome atlas; clean coloured surfaces avoid
  # the white seam fragments without erasing the sculpted detail.
  def colour(name,c):
   m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*c,1);n.inputs['Roughness'].default_value=.9;return m
  o.data.materials.clear()
  palette=[('Walnut',(.25,.12,.055)),('Cream',(.72,.64,.45)),('Charcoal',(.045,.04,.035)),('Skin',(.65,.38,.21)),('Work blue',(.12,.25,.36)),('Steel',(.25,.31,.32))]
  for name,c in palette:o.data.materials.append(colour(name,c))
  for p in o.data.polygons:
   x,y,z=p.center
   if kind=='merry_Moose':p.material_index=1 if z>.60 else 0 if z>-.25 else 2
  if kind=='merry_Moose':
   bpy.ops.mesh.primitive_cube_add(size=1,location=(-.015,-.338,-.379));plaque=bpy.context.object;plaque.name='Readable Merry Moose plaque';plaque.scale=(.84,.025,.16);plaque.data.materials.append(colour('Sign ivory',(.95,.86,.61)))
   bpy.ops.object.text_add(location=(-.015,-.355,-.38),rotation=(math.pi/2,0,0));text=bpy.context.object;text.name='Merry Moose lettering';text.data.body='MERRY MOOSE';text.data.align_x='CENTER';text.data.align_y='CENTER';text.data.size=.097;text.data.extrude=.001;text.data.materials.append(colour('Lettering',(.075,.10,.09)))
   bpy.context.view_layer.update();text.scale.x=min(1,.76/max(.001,text.dimensions.x));bpy.ops.object.convert(target='MESH')
   # Plain ivory sclera and complete dark pupils, with one small highlight each.
   for x in [.03,.15]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=1,location=(x,-.505,.525));eye=bpy.context.object;eye.name='Repaired ivory eye';eye.scale=(.051,.022,.070);eye.data.materials.append(colour('Eye ivory',(.96,.94,.83)))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=12,radius=1,location=(x,-.529,.522));eye=bpy.context.object;eye.name='Complete pupil';eye.scale=(.028,.012,.047);eye.data.materials.append(colour('Pupil',(.035,.024,.018)))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=.009,location=(x-.006,-.542,.54));bpy.context.object.data.materials.append(colour('Eye highlight',(1,1,1)))
  bpy.context.view_layer.objects.active=o

 if kind in ['barfly','Jonsson']:rig(o,kind)
 bpy.ops.file.pack_all()
 bpy.ops.wm.save_as_mainfile(filepath=str(out/(kind+'.blend')))
 bpy.ops.export_scene.gltf(filepath=str(out/(kind+'.glb')),export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_image_format='JPEG',export_image_quality=85)
 print('PREPARED',kind,'vertices',len(o.data.vertices),'bytes',(out/(kind+'.glb')).stat().st_size,flush=True)
