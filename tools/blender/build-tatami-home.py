"""Original 1990s tatami home, based on the user's room reference.
Blender: blender -b --python tools/blender/build-tatami-home.py -- --root .
Metres; author in Three (x,y,z), export glTF Y up. Retain named movable pieces.
"""
import bpy, math, sys, argparse
from pathlib import Path
from mathutils import Vector
p=argparse.ArgumentParser();p.add_argument('--root',required=True);a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);root=Path(a.root).resolve()
bpy.ops.wm.read_factory_settings(use_empty=True)
M={}
def mat(n,c,rough=.8,alpha=1,glow=0):
 c=tuple(v**2.2 for v in c);m=bpy.data.materials.new(n);m.diffuse_color=(*c,alpha);m.use_nodes=True;b=m.node_tree.nodes['Principled BSDF'];b.inputs['Base Color'].default_value=(*c,alpha);b.inputs['Roughness'].default_value=rough;b.inputs['Alpha'].default_value=alpha
 if alpha<1:m.surface_render_method='DITHERED'
 if glow:b.inputs['Emission Color'].default_value=(*c,1);b.inputs['Emission Strength'].default_value=glow
 M[n]=m;return m
for n,c in {'cedar':(.25,.16,.085),'wood':(.39,.27,.14),'cream':(.87,.82,.63),'paper':(.94,.90,.76),'straw':(.65,.57,.27),'edge':(.27,.28,.15),'green':(.27,.36,.20),'brass':(.46,.36,.15),'porcelain':(.76,.80,.72),'fan':(.40,.51,.49),'steel':(.20,.28,.28),'linen':(.89,.86,.76),'quilt':(.32,.42,.34),'pink':(.60,.27,.24),'red':(.51,.17,.11)}.items():mat(n,c)
mat('glass',(.65,.76,.72),.12,.19);mat('light',(1,.84,.47),.45,1,2)
def loc(v):return (v[0],-v[2],v[1])
def box(n,s,v,m,bevel=0,parent=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc(v));o=bpy.context.object;o.name=n;o.scale=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(M[m])
 if bevel:b=o.modifiers.new('soft edges','BEVEL');b.width=bevel;b.segments=2;bpy.ops.object.modifier_apply(modifier=b.name)
 if parent:o.parent=parent
 return o
def ball(n,v,s,m,parent=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,location=loc(v));o=bpy.context.object;o.name=n;o.scale=(s[0],s[2],s[1]);o.data.materials.append(M[m]);o.parent=parent
 return o
def line(n,pts,m,r=.008,parent=None):
 c=bpy.data.curves.new(n,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=1;t=c.splines.new('POLY');t.points.add(len(pts)-1)
 for pt,v in zip(t.points,pts):pt.co=(*loc(v),1)
 o=bpy.data.objects.new(n,c);bpy.context.collection.objects.link(o);o.data.materials.append(M[m]);o.parent=parent;return o
def empty(n,v=(0,0,0)):
 o=bpy.data.objects.new(n,None);bpy.context.collection.objects.link(o);o.location=loc(v);return o
# Six-mat room with alternating grain and dark woven heri borders.
box('floor substrate',(6,.08,6),(0,-.04,0),'cedar')
for ix in range(3):
 for iz in range(2):
  x=-2+ix*2;z=-1.5+iz*3;box('tatami',(1.96,.035,2.96),(x,.018,z),'straw')
  for edge in [-.96,.96]:box('tatami binding',(.055,.014,2.96),(x+edge,.042,z),'edge')
  for k in range(55):box('woven rush',(.011,.003,2.84),(x-.88+k*.033,.037,z),'cream')
# Back sliding cupboards and side fusuma; shallow pale teal tide marks on paper.
for i in range(4):
 x=-2.25+i*1.5;box('back fusuma',(1.47,2.3,.08),(x,1.2,-2.98),'paper') if i!=3 else None
 box('back frame',(.055,2.4,.09),(x-.75,1.22,-2.9),'cedar');ball('recessed pull',(x+.56,1.14,-2.918),(.035,.035,.012),'brass')
 for k in range(3):box('subtle tide line',(1.40,.012,.005),(x,.14+k*.04,-2.933),'porcelain')
for side in [-1,1]:
 box('side panels',(.08,2.4,6),(side*2.99,1.2,0),'paper')
 for z in [-3,-1.5,0,1.5,3]:box('side frame',(.10,2.45,.055),(side*2.92,1.23,z),'cedar')
 for y in [.08,2.4,2.8]:box('side rail',(.10,.055,6),(side*2.92,y,0),'cedar')
 box('transom',(.065,.36,6),(side*2.97,2.60,0),'wood')
 for z in [i*.18-2.85 for i in range(33)]:box('transom lattice',(.04,.28,.018),(side*2.91,2.60,z),'green')
# Painted reeds on the left panels, deliberately restrained.
for j in range(6):
 z=-2.3+j*.32;line('painted reed',[(-2.938,.35,z),(-2.938,1.7,z+.08)],'green',.009)
 for k in range(4):ball('painted leaf',(-2.934,.65+k*.25,z+(.07 if k%2 else -.07)),(.008,.07,.028),'green')
for y in [.04,2.4,2.8]:box('back rail',(6,.06,.10),(0,y,-2.92),'cedar')
box('back transom',(6,.36,.06),(0,2.60,-2.98),'wood')
for x in [i*.2-2.8 for i in range(29)]:line('diamond transom',[(x-.09,2.52,-2.938),(x,2.65,-2.938),(x+.09,2.52,-2.938)],'green',.007)
# Front doorway; keep the middle opening usable.
for x in [-2.15,2.15]:box('PreviewFront',(1.7,2.8,.08),(x,1.4,2.99),'cream')
box('door lintel',(6,.16,.16),(0,2.72,2.97),'cedar');box('PreviewCeiling',(6,.055,6),(0,2.83,0),'cream')
# Glass-front tea cabinet at rear left.
box('tea cabinet base',(1.25,.48,.56),(-1.95,.24,-2.57),'wood',.025)
box('cabinet back',(1.25,.87,.045),(-1.95,.915,-2.82),'wood')
for x in [-2.55,-1.35]:box('cabinet side',(.055,.87,.56),(x,.915,-2.57),'wood')
box('cabinet crown',(1.28,.055,.60),(-1.95,1.37,-2.57),'wood')
box('cabinet recess',(1.12,.73,.03),(-1.95,.92,-2.267),'cedar')
for y in [.61,.97,1.3]:box('cabinet shelf',(1.12,.035,.48),(-1.95,y,-2.50),'wood')
for x in [-2.25,-1.65]:
 box('drawer',(.56,.28,.045),(x,.25,-2.265),'wood',.009);line('drawer pull',[(x-.07,.31,-2.225),(x,.27,-2.21),(x+.07,.31,-2.225)],'brass')
for i in range(6):ball('tea cup',(-2.4+i*.18,.70,-2.43),(.065,.07,.065),'porcelain')
for i in range(4):ball('rice bowl',(-2.35+i*.23,1.05,-2.42),(.09,.055,.09),'cream')
for x in [-2.24,-1.66]:box('glass door',(.55,.7,.015),(x,.965,-2.23),'glass');box('door stile',(.028,.73,.018),(x-.28,.96,-2.21),'cedar')
ball('tea jar',(-2.23,1.51,-2.54),(.14,.18,.14),'red');ball('tea jar lid',(-2.23,1.70,-2.54),(.11,.028,.11),'brass')
for x in [-1.93,-1.68]:box('tea tin',(.13,.24,.13),(x,1.48,-2.55),'cream');box('tin label',(.12,.09,.006),(x,1.48,-2.48),'green')
# Wooden pendulum clock, face and hands.
box('clock body',(.29,.58,.09),(-1.04,2.0,-2.88),'wood',.025);ball('clock face',(-1.04,2.15,-2.82),(.17,.17,.017),'cream')
line('clock hands',[(-1.13,2.17,-2.79),(-1.04,2.15,-2.79),(-1.04,2.25,-2.79)],'cedar',.008);ball('pendulum',(-1.04,1.82,-2.81),(.04,.06,.015),'brass')
# Low tea table, one cushion and flower vase.
box('tea table',(1.18,.07,.78),(-1.65,.35,1.45),'wood',.025)
for x in [-2.11,-1.19]:
 for z in [1.17,1.73]:box('table leg',(.08,.30,.08),(x,.16,z),'cedar')
box('floor cushion',(.65,.12,.60),(-1.0,.065,2.10),'green',.055)
for x in [-1.67,-1.30]:ball('cup',(x,.43,1.4),(.07,.05,.07),'porcelain')
ball('teapot',(-1.98,.46,1.43),(.115,.09,.09),'porcelain');ball('teapot lid',(-1.98,.55,1.43),(.07,.018,.07),'cream')
line('teapot handle',[(-2.05,.48,1.43),(-2.16,.52,1.43),(-2.16,.40,1.43),(-2.04,.40,1.43)],'porcelain',.012)
ball('flower vase',(-2.09,.47,1.7),(.055,.10,.055),'brass');line('flower stem',[(-2.09,.55,1.7),(-2.12,.83,1.7)],'green');ball('flower',(-2.12,.83,1.7),(.06,.025,.05),'red')
# Fan wire guard and three blades, separate rotor for runtime movement.
box('fan foot',(.45,.07,.37),(2.35,.055,1.8),'cream',.03);box('fan stem',(.055,.72,.055),(2.35,.42,1.8),'fan')
rotor=empty('FanRotor',(2.35,1.12,1.75))
for i in range(3):
 ang=i*math.tau/3;leaf=ball('fan blade',(.12*math.cos(ang),.12*math.sin(ang),0),(.18,.075,.015),'fan',rotor);leaf.rotation_euler.y=ang
ball('fan hub',(2.35,1.12,1.61),(.065,.065,.035),'cream')
for z in [1.61,1.86]:
 for radius in [.11,.21,.32]:line('fan guard',[(2.35+radius*math.cos(t),1.12+radius*math.sin(t),z) for t in [i*math.tau/48 for i in range(49)]],'steel',.005)
 for i in range(12):
  t=i*math.tau/12;line('guard spoke',[(2.35,1.12,z),(2.35+.32*math.cos(t),1.12+.32*math.sin(t),z)],'steel',.004)
# Folded bedding in the cupboard; the laid-out copy only appears at night.
box('cupboard backing',(1.8,2.45,.08),(2.10,1.225,-2.96),'cedar')
door=empty('FutonCupboardDoor',(2.25,0,-2.22))
box('cupboard paper',(1.46,2.3,.055),(0,1.2,0),'paper',parent=door)
for x in [-.73,.73]:box('cupboard stile',(.035,2.3,.065),(x,1.2,0),'cedar',parent=door)
ball('cupboard pull',(-.56,1.14,.035),(.035,.035,.012),'brass',door)
fold=empty('StoredFuton');bed=empty('LaidFuton')
for i in range(3):box('folded mattress',(.86,.095,.56),(2.05,.35+i*.10,-2.65),'linen',.035,fold)
box('folded quilt',(.85,.12,.55),(2.05,.71,-2.65),'quilt',.045,fold)
box('night mattress',(1.18,.15,2.15),(.65,.095,-.6),'linen',.06,bed)
box('night quilt',(1.10,.055,1.43),(.65,.19,-.32),'quilt',.025,bed)
ball('pillow',(.65,.23,-1.42),(.43,.10,.22),'linen',bed)
# A square paper lantern in place of a bare ceiling light.
box('lantern',(.62,.25,.46),(0,2.43,-.65),'light')
for x in [-.31,0,.31]:box('lantern frame',(.026,.28,.49),(x,2.43,-.65),'cedar')
for y in [2.30,2.55]:box('lantern rail',(.65,.026,.49),(0,y,-.65),'cedar')
# Convert curves; join static meshes by material to keep the mobile draw count low.
for o in list(bpy.context.scene.objects):
 if o.type=='CURVE':bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
for material in M.values():
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and not o.parent and not o.name.startswith('Preview') and o.data.materials and o.data.materials[0]==material]
 if not objects:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name='Room_'+material.name
bpy.ops.object.select_all(action='DESELECT')
out=root/'assets/models/tatami-home';out.mkdir(parents=True,exist_ok=True);art=root/'art/tatami-home';art.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out/'tatami-home.glb'),export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
for child in bed.children:child.hide_render=True
for o in bpy.context.scene.objects:
 if o.name.startswith('Preview'):o.hide_render=True
# Preview camera through the front entry, looking toward cupboards.
bpy.ops.object.camera_add(location=loc((0,3.6,6.8)));cam=bpy.context.object;cam.rotation_euler=(Vector(loc((0,1.0,0)))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=8.4;bpy.context.scene.camera=cam
for v,power,size in [((0,2.6,0),180,3),((0,2,3),350,4)]:
 bpy.ops.object.light_add(type='AREA',location=loc(v));lamp=bpy.context.object;lamp.data.energy=power;lamp.data.shape='DISK';lamp.data.size=size;lamp.rotation_euler=(Vector(loc((0,.1,0)))-lamp.location).to_track_quat('-Z','Y').to_euler()
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=24;s.view_settings.exposure=-.4;s.world=bpy.data.worlds.new('Soft daylight');s.world.color=(.35,.35,.35);s.render.resolution_x=1100;s.render.resolution_y=850;s.render.resolution_percentage=100
s.render.filepath=str(art/'room-preview.png');bpy.ops.wm.save_as_mainfile(filepath=str(art/'tatami-home.blend'));bpy.ops.render.render(write_still=True)
