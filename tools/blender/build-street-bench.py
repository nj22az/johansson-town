"""Late-Shōwa street bench. Metres, Y-up glTF, origin at ground centre.
Seat faces local -Z; backrest is local +Z. Run:
  blender -b --python tools/blender/build-street-bench.py -- --root .
"""
import bpy, math, sys, argparse, json
from pathlib import Path
from mathutils import Vector

p=argparse.ArgumentParser();p.add_argument('--root',required=True)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
root=Path(a.root).resolve()
out=root/'assets/models/street';out.mkdir(parents=True,exist_ok=True)
art=root/'art/street';art.mkdir(parents=True,exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)

materials={}
def mat(name,color,rough=.62,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    bs=m.node_tree.nodes['Principled BSDF']
    rgb=tuple((int(color[i:i+2],16)/255)**2.2 for i in (0,2,4))
    bs.inputs['Base Color'].default_value=(*rgb,1)
    bs.inputs['Roughness'].default_value=rough
    bs.inputs['Metallic'].default_value=metal
    materials[name]=m;return m

wood=mat('Bench cedar','8a5a38',.78)
dark=mat('Bench smoked','3c2a1e',.82)
iron=mat('Cast iron','2c3033',.38,.55)
bolt=mat('Worn brass','b08a4a',.42,.35)
pad=mat('Concrete pad','9a958c',.95)

def pos(v):
    # Three.js x,y,z → Blender x,-z,y
    return (v[0],-v[2],v[1])

def cube(name,size,at,m,bevel=.012):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos(at))
    o=bpy.context.object;o.name=name
    o.dimensions=(size[0],size[2],size[1])
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(m)
    if bevel:
        b=o.modifiers.new('Soft','BEVEL');b.width=min(bevel,min(size)/3.2);b.segments=2
        bpy.ops.object.modifier_apply(modifier=b.name)
        o.modifiers.new('WN','WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=o.modifiers[-1].name)
    return o

# Concrete pads
for dx in (-.72,.72):
    cube('Pad',(.34,.06,.42),(dx,.03,.02),pad,.004)

# Cast-iron legs: front and back pairs, with a slight outward splay on the feet.
for dx in (-.68,.68):
    for dz,h,y in ((-.18,.40,.22),(.20,.78,.41)):
        cube('Leg',(.07,h,.07),(dx,y,dz),iron,.006)
    cube('Foot',(.11,.04,.14),(dx,.04,-.20),iron,.004)
    cube('Foot',(.11,.04,.14),(dx,.04,.22),iron,.004)
    cube('Stay',(.05,.04,.40),(dx,.18,.02),iron,.003)

# Cross stretchers
cube('Stretcher',(1.42,.045,.05),(0,.16,-.18),iron,.003)
cube('Stretcher',(1.42,.045,.05),(0,.16,.20),iron,.003)
cube('Seat rail',(1.58,.055,.055),(0,.41,-.02),dark,.004)
cube('Back rail',(1.58,.05,.05),(0,.62,.22),dark,.004)

# Seat slats — sit height 0.44 m, slight gap, facing local -Z
for i,z in enumerate((-.22,-.11,.00,.11)):
    slat=cube('Seat slat',(1.62,.045,.09),(0,.445,z),wood if i%2==0 else dark,.008)
    slat.rotation_euler.x=math.radians(-2)

# Backrest slats
for i,y in enumerate((.58,.72,.86)):
    cube('Back slat',(1.62,.09,.04),(0,y,.24),wood if i!=1 else dark,.008)

# Armrests
for dx in (-.78,.78):
    cube('Arm',(.07,.045,.42),(dx,.62,.00),dark,.006)
    cube('Arm post',(.055,.20,.055),(dx,.52,.18),iron,.004)

# Fasteners
for dx in (-.62,.62):
    for z in (-.22,.11):
        cube('Bolt',(.03,.02,.03),(dx,.475,z),bolt,.002)

# Root extras for the runtime seat (Three.js local space: +Y up, sit toward -Z).
root=bpy.data.objects.new('SakuraBench',None)
bpy.context.collection.objects.link(root)
root.empty_display_type='PLAIN_AXES'
for o in list(bpy.context.scene.objects):
    if o!=root and o.type=='MESH':
        o.parent=root
root['seatHeight']=0.44
root['eyeY']=1.16
root['sit']=[0.0,0.0,-0.08]
root['stand']=[0.0,0.0,-1.45]

# Merge by material for a handful of draws.
for m in materials.values():
    selected=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==m]
    if not selected:continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in selected:o.select_set(True)
    bpy.context.view_layer.objects.active=selected[0]
    bpy.ops.object.join()
    bpy.context.object.name='Bench / '+m.name
    bpy.context.object.parent=root

bpy.ops.wm.save_as_mainfile(filepath=str(art/'sakura-bench.blend'),compress=True)
bpy.ops.export_scene.gltf(
    filepath=str(out/'sakura-bench.glb'),
    export_format='GLB',
    export_yup=True,
    export_animations=False,
    export_extras=True,
    export_apply=True
)

meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
report={
    'meshes':len(meshes),
    'triangles':tris,
    'bytes':(out/'sakura-bench.glb').stat().st_size,
    'seatHeight':0.44,
    'eyeY':1.16
}
(art/'export-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
