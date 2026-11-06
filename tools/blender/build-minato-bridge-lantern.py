"""Native Blender model of the chapter 1 lantern circuit.
Run with Blender 4.2: blender -b -t 2 --python build_lantern.py
Shared original geometry by Nils Johansson from the book lantern scene.
Healthy game derivative: no poor contact; independent 12 V practice circuit.
This script is self-contained; the canonical 24 V ship circuit is unchanged.
"""
import bpy, math, json
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view
from pathlib import Path
OUT=Path(__file__).resolve().parents[2]/'art/ferry-bridge-lantern'
OUT.mkdir(parents=True,exist_ok=True)
ROOT=OUT
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for d in list(bpy.data.materials):bpy.data.materials.remove(d)
s=bpy.context.scene;s.unit_settings.system='METRIC';s.unit_settings.scale_length=1
s.render.engine='CYCLES';s.cycles.samples=24;s.cycles.use_denoising=True
s.render.threads_mode='FIXED';s.render.threads=2
s.render.image_settings.file_format='PNG';s.render.film_transparent=False
s.view_settings.view_transform='AgX'
world=bpy.data.worlds.new('Soft_daylight') if not bpy.data.worlds else bpy.data.worlds[0]
s.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.75,.82,.9,1);world.node_tree.nodes['Background'].inputs[1].default_value=.5

def material(n,c,metal=0,rough=.4,trans=0,emission=0):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
 bs.inputs['Transmission Weight'].default_value=trans
 if emission:bs.inputs['Emission Color'].default_value=(*c,1);bs.inputs['Emission Strength'].default_value=emission
 return m
M={
 'paper':material('Warm_paper',(.89,.88,.84)),
 'dark':material('Marine_dark_blue',(.025,.052,.074)),
 'white':material('Painted_white',(.78,.84,.84)),
 'metal':material('Tinned_copper',(.48,.55,.56),.72,.28),
 'copper':material('Copper_contact',(.62,.28,.09),.7,.32),
 'red':material('Positive_red_insulation',(.65,.022,.012),0,.28),
 'return':material('Negative_dark_blue_insulation',(.015,.067,.15),0,.35),
 'amber':material('Contact_highlight',(.95,.27,.005),.1,.28),
 'oxide':material('Poor_contact_surface',(.12,.32,.21),.08,.8),
 'glass':material('Clear_fuse_glass',(.72,.91,.95),0,.08,.93),
 'lens':material('Lantern_glass',(.87,.93,.88),0,.15,.85),
 'glow':material('Lamp_filament', (1,.57,.12),0,.25,0,4),
 'sea':material('Sea',(.28,.55,.66),0,.65),
 'rail':material('Light_grey_context',(.66,.75,.77),.2,.5),
 'cream':material('Panel',(.76,.79,.77)),
}
def mat(o,m):o.data.materials.append(M[m]);return o
def box(n,loc,dims,m='white',bevel=.01):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=n;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);mat(o,m)
 if bevel:
  q=o.modifiers.new('Soft_manufactured_edges','BEVEL');q.width=bevel;q.segments=1;o.modifiers.new('Weighted_normals','WEIGHTED_NORMAL')
 return o
def cyl(n,loc,r,d,m='metal',axis='Z'):
 bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=r,depth=d,location=loc);o=bpy.context.object;o.name=n
 if axis=='X':o.rotation_euler[1]=math.pi/2
 if axis=='Y':o.rotation_euler[0]=math.pi/2
 mat(o,m);q=o.modifiers.new('Edge_bevel','BEVEL');q.width=.004;q.segments=1;o.modifiers.new('Weighted_normals','WEIGHTED_NORMAL');return o
def wire(n,points,m='red',r=.025):
 d=bpy.data.curves.new(n,'CURVE');d.dimensions='3D';d.resolution_u=16;d.bevel_depth=r;d.bevel_resolution=1
 sp=d.splines.new('POLY');sp.points.add(len(points)-1)
 for p,co in zip(sp.points,points):p.co=(*co,1)
 o=bpy.data.objects.new(n,d);bpy.context.collection.objects.link(o);mat(o,m);return o
def sphere(n,loc,r,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=r,location=loc);o=bpy.context.object;o.name=n;mat(o,m);return o
def text(n,t,loc,size=.13,m='dark',rot=(0,0,0)):
 d=bpy.data.curves.new(n,'FONT');d.body=t;d.size=size;d.align_x='CENTER';d.align_y='CENTER';d.extrude=.0003
 font=ROOT/'book2-v2/fonts/SourceSans3-Bold.ttf'
 if font.exists():d.font=bpy.data.fonts.load(str(font))
 o=bpy.data.objects.new(n,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=rot;mat(o,m);return o

def area(n,loc,power,size,target):
 d=bpy.data.lights.new(n,'AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new(n,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Key_softbox',(-3,-4,7),900,5,(0,0,.4));area('Fill_softbox',(3,-1,5),650,4,(.4,0,.4))
# Sparse architectural context: the circuit stays entirely in front of the wall.
box('Bridge_cutaway_floor',(-.15,.15,-.08),(5.0,2.5,.1),'paper',.025)
box('Exterior_sea_strip',(1.45,1.13,-.005),(2.0,.48,.025),'sea',.005)
box('Bridge_window_sill',(.95,.66,.61),(2.45,.09,.1),'white')
box('Bridge_window_top',(.95,.66,1.6),(2.45,.09,.08),'white')
for x in [-.27,2.17]:box('Bridge_window_upright', (x,.66,1.1),(.075,.09,1.07),'white')
box('Bridge_wall_cutaway',(-1.4,.72,.33),(2.3,.1,.58),'white')
# Source battery. Positive is on right, so outgoing and return wires never cross.
box('B1_12V_battery',(-1.65,.03,.27),(.83,.6,.52),'dark',.04)
box('B1_battery_lid',(-1.65,.03,.55),(.86,.63,.07),'white',.025)
P=(-1.42,-.14,.625);BN=(-1.91,-.14,.625)
for n,p,m in [('B1_positive_P',P,'red'),('B1_negative_N',BN,'return')]:
 cyl(n+'_collar',p,.065,.04,m);cyl(n+'_metal_post',(p[0],p[1],p[2]+.035),.04,.06,'metal')
text('Battery_plus','+',(-1.42,-.31,.592),.14,'red');text('Battery_minus','−',(-1.91,-.31,.592),.14,'return')
text('Battery_nameplate','12 V',(-1.65,-.281,.31),.2,'white',(math.pi/2,0,0))
# Open inline fuse holder: intact fuse and a single selected poor contact at output.
fx,fy=-.48,-.18
box('F1_insulating_base',(fx,fy,.07),(1.02,.34,.12),'dark',.025)
left=(-.96,fy,.14);right=(.01,fy,.14)
for n,x in [('input',left[0]),('output',right[0])]:
 cyl('F1_'+n+'_screw',(x,fy,.155),.051,.04,'metal');box('F1_'+n+'_screw_slot',(x,fy,.177),(.058,.009,.004),'dark',0)
# Two clips, glass tube and fuse wire have the same electrical centreline.
for n,x in [('input',-.79),('output',-.17)]:
 box('F1_'+n+'_clip_floor',(x,fy,.19),(.1,.19,.045),'copper',.008)
 for yy in [fy-.08,fy+.08]:box('F1_'+n+'_clip_jaw',(x,yy,.265),(.095,.035,.15),'copper',.007)
wire('F1_input_metal_link',[left,(-.79,fy,.21)],'copper',.02)
wire('F1_output_metal_link',[(-.17,fy,.21),right],'copper',.02)
cyl('F1_intact_glass_tube',(-.48,fy,.285),.075,.52,'glass','X')
cyl('F1_input_fuse_cap',(-.78,fy,.285),.08,.1,'metal','X')
cyl('F1_output_fuse_cap',(-.18,fy,.285),.08,.1,'metal','X')
wire('F1_intact_fuse_element',[(-.78,fy,.285),(-.63,fy,.29),(-.5,fy,.27),(-.35,fy,.3),(-.18,fy,.285)],'copper',.008)
# Surface resistance is at cap/clip interface. No invented discrete resistor.
for j in range(18):
 x=-.219+.014*(j%6);y=fy-.071+.024*(j//6)
 o=sphere('F1_poor_contact_surface_'+str(j),(x,y,.218),.014,'oxide');o.scale=(.9,1,.28)
box('F1_selected_contact_marker',(-.168,fy-.112,.22),(.13,.018,.11),'amber',.004)
# Exterior navigation lantern, with exposed lower terminal compartment.
lx,ly=1.48,.04
box('Lantern_wall_mount',(lx,.47,.38),(.37,.12,.55),'dark',.02)
box('Lantern_mount_bracket',(lx,.22,.16),(.42,.48,.075),'metal',.012)
cyl('L1_lower_housing',(lx,ly,.24),.3,.2,'dark')
cyl('L1_lens_chamber',(lx,ly,.63),.235,.58,'lens')
cyl('L1_top_cap',(lx,ly,.97),.3,.12,'dark')
for zz in [.36,.62,.88]:cyl('L1_lens_protecting_ring',(lx,ly,zz),.26,.022,'metal')
for angle in [math.pi/4,3*math.pi/4,5*math.pi/4,7*math.pi/4]:
 x=lx+.26*math.cos(angle);y=ly+.26*math.sin(angle);cyl('L1_protective_guard',(x,y,.63),.018,.6,'dark')
cyl('L1_bulb_socket',(lx,ly,.365),.08,.085,'metal')
# The slightly glowing bulb is physically inside the lantern.
sphere('L1_bulb_glass',(lx,ly,.59),.12,'lens')
wire('L1_filament',[(lx-.06,ly,.56),(lx-.025,ly,.64),(lx+.025,ly,.64),(lx+.06,ly,.56)],'glow',.009)
A=(1.19,-.28,.145);LN=(1.77,-.28,.145)
for n,p,m in [('L1_terminal_A',A,'red'),('L1_terminal_N',LN,'return')]:
 box(n+'_block',(p[0],p[1],.11),(.18,.18,.13),'white',.012);cyl(n+'_screw',(p[0],p[1],.195),.041,.025,'metal')
wire('L1_internal_A_to_bulb',[A,(1.3,-.2,.23),(lx-.06,ly,.365)],'red',.016)
wire('L1_internal_bulb_to_N',[(lx+.06,ly,.365),(1.66,-.2,.23),LN],'return',.016)
# Place the book's deliberately enlarged components at physical sizes in the
# existing bridge. Blender Z is up; glTF exports to the ship's Y-up frame.
def B(p):return Vector((p[0],-p[2],p[1]))
def place(o,origin,scale,target):
 o.location=(o.location-Vector(origin))*scale+B(target);o.scale*=scale
for o in list(bpy.data.objects):
 n=o.name
 if n.startswith(('F1_poor_contact_surface_','F1_selected_contact_marker')):
  bpy.data.objects.remove(o,do_unlink=True)
 elif n.startswith(('B1_','Battery_')):place(o,(-1.65,.03,0),.24,(2.78,1.02,-.35))
 elif n.startswith('F1_'):
  r=Matrix.Rotation(-math.pi/2,3,'X');o.location=r@(o.location-Vector((-.48,-.18,0)))*.20+B((1.80,.80,-.721));o.scale*=.20;o.rotation_euler=(r@o.rotation_euler.to_matrix()).to_euler()
 elif n.startswith(('L1_','Lantern_')):
  r=Matrix.Rotation(-math.pi/2,3,'Z');o.location=r@(o.location-Vector((1.48,.04,0)))*.40+B((3.95,.96,-.95));o.scale*=.40;o.rotation_euler=(r@o.rotation_euler.to_matrix()).to_euler()
 elif o.type not in {'LIGHT'}:bpy.data.objects.remove(o,do_unlink=True)

def gbox(n,p,dims,m='dark',bevel=.005):return box(n,B(p),(dims[0],dims[2],dims[1]),m,bevel)
gbox('Battery_wall_tray',(2.78,1.00,-.35),(.25,.04,.20),'metal',.004)
gbox('Battery_wall_bracket_back',(2.91,.87,-.35),(.025,.18,.20),'metal',.004)
for z in [-.42,-.28]:wire('Battery_tray_diagonal_support',[B((2.90,.81,z)),B((2.66,.98,z))],'metal',.009)
gbox('Fuse_holder_support',(1.80,.80,-.708),(.24,.10,.03),'cream',.004)
# Ordinary equipment marking only; no teaching plaque on the real bridge.
bpy.data.objects['Battery_nameplate'].location=B((2.78,1.10,-.429));bpy.data.objects['Battery_nameplate'].rotation_euler=(math.pi/2,0,math.pi)

positive=[(2.8352,1.17,-.3092),(2.8352,1.17,-.48),(2.8352,1.025,-.48),(2.8352,1.025,-.715),(1.704,1.025,-.715),(1.704,.80,-.749)]
outgoing=[(1.898,.80,-.749),(1.98,.80,-.749),(1.98,.91,-.749),(2.885,.91,-.749),(2.885,.82,-.18),
 (3.065,.82,-.18),(4.015,.82,-.18),(4.015,.82,-1.066),(3.822,1.018,-1.066)]
return_path=[(3.822,1.018,-.834),(3.90,.85,-.834),(4.045,.85,-.834),(4.045,.85,-.15),
 (3.065,.85,-.15),(2.915,.85,-.15),(2.88,.85,-.15),(2.88,1.08,-.74),(2.66,1.08,-.74),
 (2.66,1.17,-.3092),(2.7176,1.17,-.3092)]
for n,pts,m in [('W1_battery_to_intact_fuse',positive,'red'),('W2_intact_fuse_to_lamp',outgoing,'red'),('W3_lamp_return_to_battery',return_path,'return')]:wire(n,[B(p) for p in pts],m,.0055)
# Glands lie in the solid sidewall below the windows. Both cables remain along
# the existing console and forward/outer dodger; no rail crosses a walking path.
for i,p in enumerate([(3,.82,-.18),(3,.85,-.15)]):
 o=cyl('Paired_wall_gland_'+str(i),B(p),.014,.19,'metal','X')
for x in [3.3,3.7]:gbox('Paired_cable_clip',(x,.835,-.165),(.03,.07,.07),'metal',.003)

meta={'revision':'bridge-lantern-v2','units':'m','frame':'ship local +X port +Y up +Z forward; origin at bridge floor/forward wall',
 'ownership':'Nils Johansson','healthy':True,'independentSourceV':12,'shipDCV':24,'canonicalNavigationLightsChanged':False,
 'bookSource':'blender-illustrationer/reality-scenes/lantern-path/build_lantern.py',
 'componentScales':{'battery':.24,'fuseHolder':.20,'lamp':.40},
 'wires':{'sourceToFuse':positive,'fuseToLamp':outgoing,'returnToSource':return_path},
 'connections':[['B1.P','F1.input'],['F1.input','F1.intact_fuse'],['F1.intact_fuse','F1.output'],['F1.output','L1.A'],['L1.A','L1.bulb'],['L1.bulb','L1.N'],['L1.N','B1.N']],
 'placement':'Existing wheelhouse console; no new floor obstruction',
 'sourceComponents':[o.name for o in bpy.data.objects if o.type in {'MESH','CURVE','FONT'}]}
s['ownership']='Nils Johansson';s['circuit']=json.dumps(meta,ensure_ascii=False)
bpy.context.view_layer.update()
def game_vector(v):return [v.x,v.z,-v.y]
meta['labels']={n:{'up':game_vector((bpy.data.objects[n].matrix_world.to_3x3()@Vector((0,1,0))).normalized()),'normal':game_vector((bpy.data.objects[n].matrix_world.to_3x3()@Vector((0,0,1))).normalized())}for n in ['Battery_nameplate']}
meta['visibleText']={o.name:o.data.body for o in bpy.data.objects if o.type=='FONT'}
# Save editable parts before reducing game draw calls. No render-only context,
# fault patches, cameras or book values are exported into the game.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Minato_Maru_Bridge_Lantern.blend'))
for o in list(bpy.data.objects):
 if o.type in {'CURVE','FONT'}:
  bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
opaque=[];glass=[];glow=[]
for o in list(bpy.data.objects):
 if o.type!='MESH':continue
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
 o.select_set(False)
 m=o.data.materials[0]
 if m.name in {'Clear_fuse_glass','Lantern_glass'}:glass.append(o)
 elif m.name=='Lamp_filament':glow.append(o)
 else:
  color=o.data.color_attributes.new(name='Col',type='FLOAT_COLOR',domain='CORNER')
  for d in color.data:d.color=m.diffuse_color
  opaque.append(o)
def merge(parts,name,material):
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name=name
 o.data.materials.clear();o.data.materials.append(material)
 for p in o.data.polygons:p.material_index=0
 return o
paint=material('World_vertex_colours',(.8,.8,.8),0,.67)
bs=paint.node_tree.nodes.get('Principled BSDF');attr=paint.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='Col';paint.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color'])
clear=material('World_practice_glass',(.63,.85,.86),0,.20);clear.diffuse_color=(.63,.85,.86,.32)
bs=clear.node_tree.nodes.get('Principled BSDF');bs.inputs['Alpha'].default_value=.32;clear.surface_render_method='DITHERED'
bulb=material('World_practice_filament',(1,.63,.22),0,.5,0,.65)
objects=[merge(opaque,'Healthy 12 V practice equipment',paint),merge(glass,'Practice lamp and intact fuse glass',clear),merge(glow,'Independent battery lamp filament',bulb)]
for o in objects:o['healthy']=True;o['independent12VPracticeCircuit']=True
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
asset=OUT.parents[1]/'assets/models/ferry-bridge/bridge-lantern-v2.glb';asset.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(asset),export_format='GLB',use_selection=True,export_extras=True,export_yup=True,export_cameras=False,export_lights=False,export_materials='EXPORT')
meta['gameAssetBytes']=asset.stat().st_size
for o in objects:o.data.calc_loop_triangles()
meta['triangles']=sum(len(o.data.loop_triangles) for o in objects)
(OUT/'scene.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
plan={k:meta[k] for k in ['revision','wires','connections','placement','healthy','independentSourceV','shipDCV']}
(OUT.parents[1]/'src/world/ferry-bridge-lantern-plan.js').write_text('// Generated by tools/blender/build-minato-bridge-lantern.py. Metres in bridge local frame.\nexport const BRIDGE_LANTERN_PLAN = '+json.dumps(plan,ensure_ascii=False,separators=(',',':'))+';\n')
print('EXPORTED',asset,meta['gameAssetBytes'])
