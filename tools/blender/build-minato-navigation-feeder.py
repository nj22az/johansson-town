"""Actual ESB 105 V AC navigation-light feeder. Native editable Blender original.
Run: blender -b -t 2 --python tools/blender/build-minato-navigation-feeder.py
Ship bridge frame +X port, +Y up, +Z fore. No independent source or extra light.
"""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'art/ferry-navigation-feeder';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.unit_settings.system='METRIC';s.unit_settings.scale_length=1
B=lambda p:Vector((p[0],-p[2],p[1]))
parts=[]
def box(n,p,d,c):parts.append(dict(name=n,kind='box',p=p,d=d,color=c))
def cyl(n,p,r,h,c,axis='y'):parts.append(dict(name=n,kind='cylinder',p=p,r=r,h=h,color=c,axis=axis))
# Replaces the existing navigation-light panel, on the same console, not another cabinet.
box('NL1_enclosure',[-2.05,1.16,-.445],[1.1,.28,.30],0x25373b)
box('NL1_operator_fascia',[-2.05,1.16,-.606],[1.08,.26,.022],0xd8d2c0)
for i in range(4):
 x=-2.46+i*.27
 cyl('NL1_fuse_cap_A_'+str(i),[x,1.105,-.627],.024,.02,0x343c3e,'z')
 cyl('NL1_fuse_cap_B_'+str(i),[x+.065,1.105,-.627],.024,.02,0x343c3e,'z')
 cyl('NL1_switch_escutcheon_'+str(i),[x+.035,1.205,-.627],.032,.014,0x525c5e,'z')
# The cabling runs along the solid forward sill and through glands below the glass.
A=[[-2.48,1.11,-.40],[-2.48,.96,-.40],[-2.9,.96,-.40],[-2.9,.96,-.12],[-3.12,.96,-.12],[-4.12,.96,-.12],[-4.12,1.17,-.25],[-4.18,1.17,-.25]]
R=[[p[0],p[1]+.022,p[2]+.022]for p in A]
# Incoming ESB feeder rises inside the existing console, enters the panel base.
incoming=[[-2.20,.35,-.43],[-2.20,.98,-.43],[-2.20,1.03,-.43]]
for i in range(1,len(incoming)):
 parts.append(dict(name='C0_ESB_incoming_feeder_'+str(i),kind='bar',a=incoming[i-1],b=incoming[i],r=.014,color=0x455359))
cyl('C0_ESB_panel_inlet_gland',[-2.20,1.025,-.43],.025,.07,0x838e90)
# One waterproof two-core cable, NOT hull-return wiring.
for i in range(1,len(A)):
 a=Vector(A[i-1]);b=Vector(A[i]);parts.append(dict(name='C1_two_core_cable_'+str(i),kind='bar',a=list(a),b=list(b),r=.012,color=0x455359))
for x in [-3.3,-3.65,-4.0]:box('C1_saddle_clip',[x,.975,-.12],[.035,.045,.045],0xa6adac)
cyl('C1_bulkhead_gland',[-3,.96,-.12],.025,.18,0x838e90,'x')
# Same position as the existing starboard sidelight. Hood and lens sector face forward/outboard.
box('L1_mounting_foot',[-4.18,1.18,-.25],[.22,.06,.20],0x26383b)
cyl('L1_lower_housing',[-4.18,1.225,-.25],.105,.07,0x26383b)
cyl('L1_top_cap',[-4.18,1.405,-.25],.115,.05,0x26383b)
box('L1_inboard_screen',[-4.07,1.32,-.27125],[.025,.24,.2425],0x162225)
box('L1_aft_screen',[-4.18,1.32,-.405],[.24,.24,.025],0x162225)
cyl('L1_cable_gland',[-4.18,1.18,-.25],.022,.06,0x929a98)
anchors={'inputA':[-2.48,1.11,-.40],'inputB':[-2.415,1.11,-.378],'inputP':[-2.48,1.11,-.40],'busN':[-2.415,1.11,-.378],'F1contact':[-2.46,1.105,-.627],'switch':[-2.425,1.205,-.627],'lanternA':A[-1],'lanternN':R[-1]}
plan=dict(revision='navigation-feeder-v2',supply=dict(board='ESB',volts=105,hz=60,kind='AC',system='insulated two-wire; neither conductor is DC negative or hull return'),placement='Existing navigation-light console and starboard sidelight; no new floor obstruction',parts=parts,anchors=anchors,wires={'incomingFeeder':incoming,'outgoing':A,'return':R},connections=[['ESB.105.A','NL1.in.A'],['NL1.in.A','F1A'],['F1A','S1A'],['S1A','L1.A'],['L1.A','L1.filament'],['L1.filament','L1.B'],['L1.B','S1B'],['S1B','F1B'],['F1B','NL1.in.B'],['NL1.in.B','ESB.105.B']],lamp=dict(name='Starboard sidelight',p=[-4.18,1.315,-.25],r=.087,h=.14,on=0x2aff70),healthy=True)
mats={}
def mat(c):
 if c not in mats:
  m=bpy.data.materials.new('Paint_'+hex(c));m.diffuse_color=(((c>>16)&255)/255,((c>>8)&255)/255,(c&255)/255,1);mats[c]=m
 return mats[c]
for q in parts:
 if q['kind']=='box':
  bpy.ops.mesh.primitive_cube_add(size=1,location=B(q['p']));o=bpy.context.object;o.dimensions=(q['d'][0],q['d'][2],q['d'][1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 else:
  if q['kind']=='bar':a=B(q['a']);b=B(q['b']);p=(a+b)/2;d=(b-a).length
  else:p=B(q['p']);d=q['h']
  bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=q['r'],depth=d,location=p);o=bpy.context.object
  if q['kind']=='bar':o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
  elif q.get('axis')=='x':o.rotation_euler[1]=math.pi/2
  elif q.get('axis')=='z':o.rotation_euler[0]=math.pi/2
 o.name=q['name'];o.data.materials.append(mat(q['color']));o['actualNavigationFeeder']=True
# Lens is separate because navigation control changes its light output.
l=plan['lamp'];bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=l['r'],depth=l['h'],location=B(l['p']));lens=bpy.context.object;lens.name='Starboard sidelight';lens.data.materials.append(mat(l['on']))
s['circuit']=json.dumps(plan);s['ownership']='Nils Johansson'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Minato_Maru_Navigation_Feeder.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:
 if o.type=='MESH' and o!=lens:
  o.select_set(True);bpy.context.view_layer.objects.active=o
bpy.ops.object.join();body=bpy.context.object;body.name='Navigation feeder housing and two-core cable'
# Merge colours into a single vertex-coloured mesh.
colors=[m.diffuse_color[:] for m in body.data.materials];attr=body.data.color_attributes.new(name='Col',type='FLOAT_COLOR',domain='CORNER')
for poly in body.data.polygons:
 for idx in poly.loop_indices:attr.data[idx].color=colors[poly.material_index]
m=bpy.data.materials.new('World_vertex_colours');m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');vc=m.node_tree.nodes.new('ShaderNodeVertexColor');vc.layer_name='Col';m.node_tree.links.new(vc.outputs['Color'],bs.inputs['Base Color']);bs.inputs['Roughness'].default_value=.67
body.data.materials.clear();body.data.materials.append(m)
for poly in body.data.polygons:poly.material_index=0
bpy.ops.object.select_all(action='SELECT');asset=ROOT/'assets/models/ferry-bridge/navigation-feeder-v2.glb'
bpy.ops.export_scene.gltf(filepath=str(asset),export_format='GLB',export_extras=True,export_yup=True)
(OUT/'scene.json').write_text(json.dumps(plan,indent=2)+'\n')
(ROOT/'src/world/ferry-bridge-lantern-plan.js').write_text('// Generated by tools/blender/build-minato-navigation-feeder.py. Metres in bridge local frame.\nexport const BRIDGE_LANTERN_PLAN = '+json.dumps(plan,separators=(',',':'))+';\n')
print('EXPORTED',asset,asset.stat().st_size)
