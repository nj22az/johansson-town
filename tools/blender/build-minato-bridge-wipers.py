"""Original Minato Maru pantograph wiper. Blender 4.2, metres.

Blender Z-up is mapped to ship Y-up by B(). Fixed motor/frame mounts do
not move. Two equal parallel arms drive a translating blade carrier, so
the rubber remains parallel to the actual vertical exterior window.
Run: blender -b -t 2 --python tools/blender/build-minato-bridge-wipers.py
"""
import bpy, json, math
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'art/ferry-bridge-wipers'; OUT.mkdir(parents=True,exist_ok=True)
ASSET=ROOT/'assets/models/ferry-bridge/bridge-wipers-v1.glb'
ASSET.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
s=bpy.context.scene; s.unit_settings.system='METRIC'; s.unit_settings.scale_length=1
def B(p): return Vector((p[0],-p[2],p[1]))
def G(p): return [p.x,p.z,-p.y]
palette={'paint':(.105,.145,.155),'steel':(.39,.44,.45),'rubber':(.018,.024,.026),'bronze':(.43,.32,.17)}
materials={}
for n,c in palette.items():
 m=bpy.data.materials.new(n); m.diffuse_color=(*c,1); m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*c,1)
 bs.inputs['Roughness'].default_value=.65; bs.inputs['Metallic'].default_value=.35 if n=='steel' else .05
 materials[n]=m
parts={n:[] for n in ['fixed','drive','idler','carrier']}
def box(n,p,d,m='paint',part='fixed',bevel=.0015):
 bpy.ops.mesh.primitive_cube_add(size=1,location=B(p));o=bpy.context.object;o.name=n
 o.dimensions=(d[0],d[2],d[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(materials[m])
 if bevel:
  mod=o.modifiers.new('Manufactured edges','BEVEL');mod.width=bevel;mod.segments=1
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 parts[part].append(o);return o
def cyl(n,p,r,depth,m='steel',part='fixed',vertices=12):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=B(p),rotation=(math.pi/2,0,0));o=bpy.context.object;o.name=n;o.data.materials.append(materials[m]);parts[part].append(o);return o
L=.54;D=.05
# Faceplate bears against solid fore wall z=0; four fasteners retain the plate.
box('Frame-bearing mounting plate',(.025,0,.007),(.14,.1,.014))
for x in [-.026,.076]:
 for y in [-.032,.032]:cyl('Plate securing bolt',(x,y,.017),.006,.008)
# Compact motor lives behind the solid upper-frame plating, not on the glass.
box('Fixed electric motor',(0,0,-.145),(.095,.075,.09),'paint',bevel=.008)
box('Motor mounting flange',(0,0,-.09),(.11,.085,.02),'steel')
for x,r in [(0,.019),(D,.012)]:
 cyl('Sealed spindle bearing',(x,0,.019),r,.03)
 cyl('Rigid through-frame spindle',(x,0,-.02),.007 if x==0 else .004,.17)
 cyl('Spindle retaining washer',(x,0,.045),r*.8,.005)
# Both arms are geometrically equal, with actual pin eyes at both ends.
for part,x,width,r in [('drive',0,.018,.021),('idler',D,.012,.014)]:
 box(part+' rigid arm',(x,-L/2,.052),(width,L,.014),'paint',part)
 for y in [0,-L]:cyl(part+' hinge eye',(x,y,.052),r,.018,'steel',part)
 cyl(part+' spindle nut',(x,0,.065),.009 if part=='drive' else .006,.01,'bronze',part,6)
# Carrier is authored relative to the primary lower pin, unlike the fixed arms.
box('Pantograph lower coupler',(.025,0,.052),(.072,.022,.018),'steel','carrier')
for x in [0,D]:cyl('Coupler hinge pin',(x,0,.065),.006,.015,'bronze','carrier')
# Spring-loaded dogleg pushes the blade holder toward the glass while leaving
# visible room between rotating arms and the outer pane.
box('Blade pressure bridge',(.025,0,.023),(.026,.055,.058),'paint','carrier')
box('Spring retaining strap',(.025,0,.058),(.012,.072,.007),'steel','carrier')
box('Rigid blade spine',(.025,0,-.001),(.025,.53,.016),'paint','carrier')
for y in [-.16,.16]:
 box('Blade rubber retaining clip',(.025,y,-.005),(.033,.022,.014),'steel','carrier')
box('Continuous rubber wiping edge',(.025,0,-.0185),(.012,.53,.012),'rubber','carrier',.0007)
for y in [-.261,.261]:box('Rounded blade end cap',(.025,y,-.002),(.027,.012,.02),'rubber','carrier')

roots={}
for part,objects in parts.items():
 root=bpy.data.objects.new('wiper_'+part,None);bpy.context.collection.objects.link(root);roots[part]=root
 for o in objects:o.parent=root
# Pose native edit file at park. Source parts and named linkage remain editable.
def pose(angle):
 roots['drive'].rotation_euler[1]=-angle; roots['idler'].rotation_euler[1]=-angle
 # Idler geometry is drawn at +D; rotate about its own spindle, not drive shaft.
 roots['idler'].location=B((D*(1-math.cos(angle)),-D*math.sin(angle),0))
 roots['carrier'].location=B((L*math.sin(angle),-L*math.cos(angle),0))
pose(-.7)
s['description']='Original frame-mounted parallel-arm marine wiper; no product logo or OEM geometry'
s['window_authority']='ferry-interior.js glass: vertical pane1.05x.95, centre y1.45,z-.04; exterior face z-.025'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Minato_Maru_Bridge_Wiper.blend'))
# Export zero-angle articulated groups. Runtime rotates both arms around their
# individual origins and translates the unrotated carrier analytically.
pose(0)
roots['idler'].location=B((D,0,0))
for o in parts['idler']:o.location.x-=D
bpy.context.view_layer.update()
export_parts={}
for name,objects in parts.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name='wiper_'+name+'_mesh'
 # Bake each part into one vertex-coloured mesh; share one cheap game material.
 colors=o.data.color_attributes.new(name='Col',type='FLOAT_COLOR',domain='CORNER')
 for poly in o.data.polygons:
  c=o.data.materials[poly.material_index].diffuse_color
  for li in poly.loop_indices:colors.data[li].color=c
 export_parts[name]=o
paint=bpy.data.materials.new('World wiper vertex colours');paint.use_nodes=True;paint.diffuse_color=(.5,.5,.5,1)
bs=paint.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.65
attr=paint.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='Col';paint.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color'])
fallback={}
for name,o in export_parts.items():
 o.data.materials.clear();o.data.materials.append(paint)
 for poly in o.data.polygons:poly.material_index=0
 o.data.calc_loop_triangles();pos=[];col=[];normal=[]
 # Geometry is emitted in its node-local frame in the same basis as glTF.
 # Joined object origin is not generally zero; bake its transform relative to root.
 transform=o.matrix_local.copy()
 for tri in o.data.loop_triangles:
  for li in tri.loops:
   loop=o.data.loops[li];v=transform@o.data.vertices[loop.vertex_index].co
   pos.extend(G(v));normal.extend(G((transform.to_3x3()@loop.normal).normalized()))
   col.extend(o.data.color_attributes['Col'].data[li].color[:3])
 fallback[name]={'position':[round(v,7) for v in pos],'normal':[round(v,6) for v in normal],'color':[round(v,5) for v in col]}
 # Bake object transforms while preserving articulated parent nodes.
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ASSET),export_format='GLB',use_selection=True,export_extras=True,export_yup=True,export_cameras=False,export_lights=False)
plan={'revision':'bridge-wipers-v1','units':'metres','sourcePane':{'centres':[-1.18,0,1.18],'centreY':1.45,'centreZ':-.04,'width':1.05,'height':.95,'depth':.03,'outerFaceZ':-.025},'rootY':2.005,'rootXOffset':-.025,'armLength':L,'shaftCentres':D,'sweep':[-.7,.7],'park':-.7,'bladeLength':.53,'rubberMinZ':-.0245,'rubberMaxZ':-.0125,'fixedBounds':[-.055,.095,1.955,2.055,-.19,.065],'nativeAsset':'models/ferry-bridge/bridge-wipers-v1.glb','parts':['fixed','drive','idler','carrier'],'fallback':fallback}
(OUT/'scene.json').write_text(json.dumps({k:v for k,v in plan.items() if k!='fallback'},indent=2)+'\n')
(ROOT/'src/world/ferry-bridge-wipers-geometry.js').write_text('// Generated only by tools/blender/build-minato-bridge-wipers.py.\nexport const WIPER_GEOMETRY='+json.dumps(plan,separators=(',',':'))+';\n')
print('WIPER EXPORT',ASSET.stat().st_size,'bytes; triangles',sum(len(v['position'])//9 for v in fallback.values()))
