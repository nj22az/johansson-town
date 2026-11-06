"""Original articulated study mannequin for the sober drinking laboratory.

Run with Blender 4.5 --background --python tools/blender/build-drinking-mannequin.py.
The edit-friendly transform rig uses named hinge empties and rigid articulated parts,
not a deforming skin. Coordinates below use the runtime's metres / Y-up / face +X.
The GLB contains the same meshes, materials and complete joint hierarchy as the blend.
"""
import bpy, math, os
from mathutils import Vector
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
OUT = os.path.join(ROOT, 'assets/models/drinking')
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
# Runtime (x,y,z) -> Blender (x,-z,y); glTF exports back to runtime Y-up.
def B(p): return Vector((p[0],-p[2],p[1]))
def mat(name, rgb, rough=.5, metal=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*rgb,1)
    bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
    return m
ivory=mat('Warm porcelain',(.69,.65,.56),.48)
joint=mat('Graphite hinge',(.13,.155,.16),.55,.08)
lip=mat('Soft clay lips',(.34,.235,.20),.6)
eye=mat('Inset charcoal eyes',(.07,.09,.095),.52)
nodes={}
# Each hinge's local axes are runtime +X,+Y,+Z. No negative scale or mirrored hand.
def hinge(name, p, parent=None):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o)
    o.empty_display_type='SPHERE';o.empty_display_size=.012
    if parent:
        o.parent=parent;o.location=B(p)
    else: o.location=B(p)
    nodes[name]=o;return o
root=hinge('DrinkingMannequin',(0,0,0))
root['author']='Original Johansson World drinking study'
root['units']='metres; runtime Y up; facing +X; anatomical right hand at +Z'
root['rig']='Rigid articulated transform hierarchy; edit joints and meshes directly'
root['seatTopM']=.46

def mesh(name, vertices, faces, material, parent):
    data=bpy.data.meshes.new(name);data.from_pydata([B(v) for v in vertices],[],faces);data.update()
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.parent=parent
    o.data.materials.append(material)
    for poly in o.data.polygons: poly.use_smooth=True
    return o

def ellipsoid(name, centre, radius, material, parent, segments=24, rings=14):
    vs=[];fs=[]
    # Poles included only once; no zero-area cap triangles.
    vs.append((centre[0],centre[1]+radius[1],centre[2]))
    for j in range(1,rings):
        t=math.pi*j/rings
        for i in range(segments):
            a=2*math.pi*i/segments
            vs.append((centre[0]+radius[0]*math.sin(t)*math.cos(a),centre[1]+radius[1]*math.cos(t),centre[2]+radius[2]*math.sin(t)*math.sin(a)))
    south=len(vs);vs.append((centre[0],centre[1]-radius[1],centre[2]))
    for i in range(segments): fs.append((0,1+(i+1)%segments,1+i))
    for j in range(rings-2):
        s=1+j*segments;n=s+segments
        for i in range(segments):
            k=(i+1)%segments;fs.append((s+i,s+k,n+k,n+i))
    s=1+(rings-2)*segments
    for i in range(segments): fs.append((s+i,s+(i+1)%segments,south))
    return mesh(name,vs,fs,material,parent)

def capsule(name, start, end, radius, material, parent, segments=14, hemi=4, end_radius=None):
    # A continuous smooth capsule, one draw call rather than overlapping cylinders.
    a=Vector(start);b=Vector(end);axis=(b-a).normalized();L=(b-a).length
    u=axis.cross(Vector((0,0,1)))
    if u.length<.1:u=axis.cross(Vector((0,1,0)))
    u.normalize();v=axis.cross(u).normalized();r2=end_radius or radius
    vs=[];fs=[]
    rings=[]
    # Rounded ends have radius, the provided start/end are their centres.
    for j in range(hemi+1):
        t=-math.pi/2+j*(math.pi/2)/hemi;rings.append((radius*math.sin(t),radius*math.cos(t)))
    rings.append((L,r2))
    for j in range(1,hemi+1):
        t=j*(math.pi/2)/hemi;rings.append((L+r2*math.sin(t),r2*math.cos(t)))
    for along,r in rings:
        for i in range(segments):
            q=a+axis*along+(u*math.cos(2*math.pi*i/segments)+v*math.sin(2*math.pi*i/segments))*r
            vs.append(tuple(q))
    for j in range(len(rings)-1):
        for i in range(segments):
            k=(i+1)%segments;s=j*segments;n=s+segments;fs.append((s+i,s+k,n+k,n+i))
    return mesh(name,vs,fs,material,parent)

def rounded_box(name,centre,size,radius,material,parent):
    # Bevelled palm/foot; apply modifier so the GLB is self contained.
    bpy.ops.mesh.primitive_cube_add(size=1)
    o=bpy.context.object;o.name=name;o.parent=parent;o.location=B(centre)
    o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    mod=o.modifiers.new('Rounded edges','BEVEL');mod.width=radius;mod.segments=3
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    for f in o.data.polygons:f.use_smooth=True
    normals=o.modifiers.new('Face normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=normals.name)
    return o

pelvis=hinge('pelvis',(-.28,.535,0),root)
ellipsoid('Pelvis', (0,0,0),(.105,.075,.145),ivory,pelvis)
spine=hinge('spine',(0,.075,0),pelvis)
ellipsoid('Abdomen',(0,.085,0),(.083,.115,.119),ivory,spine)
chest=hinge('chest',(0,.18,0),spine)
ellipsoid('Ribcage',(0,.12,0),(.105,.161,.173),ivory,chest)
# A separate neck hinge gives a visible deliberate swallow.
neck=hinge('neck',(.005,.314,0),chest)
capsule('Neck',(0,.018,0),(0,.069,0),.043,ivory,neck,18)
throat=hinge('throat',(.043,.044,0),neck)
ellipsoid('Larynx',(0,0,0),(.008,.014,.012),ivory,throat,16,10)
head=hinge('head',(.005,.107,0),neck)
ellipsoid('Cranium',(-.014,.110,0),(.089,.114,.083),ivory,head,32,22)
ellipsoid('Face',(.041,.095,0),(.064,.082,.071),ivory,head,28,20)
# Nose bridge with a soft tip, visibly human in profile.
capsule('Nose bridge',(.086,.153,0),(.109,.130,0),.009,ivory,head,16,end_radius=.010)
ellipsoid('Nose tip',(.116,.128,0),(.011,.009,.013),ivory,head,20,12)
ellipsoid('Oral pad',(.095,.096,0),(.023,.022,.027),ivory,head,24,16)
for sign in [-1,1]:
    ellipsoid('Ear '+str(sign),(-.037,.106,sign*.080),(.020,.031,.011),ivory,head,18,12)
    ellipsoid('Eye '+str(sign),(.073,.144,sign*.055),(.008,.0042,.0055),eye,head,16,10)
    capsule('Brow '+str(sign),(.070,.154,sign*.050),(.075,.154,sign*.063),.0035,ivory,head,10,3)
# Small mouth opening separates lips; mouth marker lies at the outer drinking contact.
capsule('Upper lip',(.116,.098,-.017),(.116,.098,.017),.0032,lip,head,12,3)
jaw=hinge('jaw',(.015,.079,0),head)
ellipsoid('Jaw',(.049,-.011,0),(.049,.035,.053),ivory,jaw,24,14)
ellipsoid('Chin',(.075,-.023,0),(.023,.022,.032),ivory,jaw,20,12)
capsule('Lower lip',(.101,.014,-.016),(.101,.014,.016),.0031,lip,jaw,12,3)
mouth=hinge('mouth',(.1192,.096,0),head)
mouth['normal']='local +X; local +Z is the rim tangent'

# Fixed seated support: thighs forward, shins down, both soles exactly on y=0.
for side,z in [('R',.100),('L',-.100)]:
    hip=hinge('hip'+side,(.015,-.006,z),pelvis)
    knee_rel=(.373,-.044,0)
    capsule('Thigh '+side,(.028,-.002,0),(.348,-.041,0),.063,ivory,hip,20,end_radius=.047)
    knee=hinge('knee'+side,knee_rel,hip)
    ellipsoid('Knee hinge '+side,(0,0,0),(.044,.044,.044),joint,knee,18,12)
    ankle_rel=(.006,-.420,0)
    capsule('Calf '+side,(.001,-.035,0),(.006,-.388,0),.043,ivory,knee,20,end_radius=.027)
    foot=hinge('foot'+side,ankle_rel,knee)
    rounded_box('Foot '+side,(.050,-.035,0),(.200,.060,.083),.019,joint,foot)
# hips .535-.006-.044-.420 = ankle .065; foot -.035 ± .030 => bottom0.

# Arm rest points are chosen by the same analytic geometry as runtime.
def elbow_for(S,W,A=.29,F=.26):
    S=Vector(S);W=Vector(W);D=W-S;d=D.length;D.normalize()
    pole=Vector((-.30,.73,.36))-S;pole= pole-D*pole.dot(D);pole.normalize()
    x=(A*A-F*F+d*d)/(2*d);h=math.sqrt(max(0,A*A-x*x))
    return S+D*x+pole*h
S=Vector((-.28,1.075,.178));W=Vector((-.055,.695,.21));E=elbow_for(S,W)
shoulder=hinge('shoulderR',(0,.285,.178),chest)
ellipsoid('Shoulder hinge R',(0,0,0),(.043,.043,.043),joint,shoulder,20,14)
capsule('Upper arm R',(E-S).normalized()*.035,(E-S)*.89,.040,ivory,shoulder,20,end_radius=.033)
elbow=hinge('elbowR',E-S,shoulder)
ellipsoid('Elbow hinge R',(0,0,0),(.031,.031,.031),joint,elbow,18,12)
capsule('Forearm R',(W-E).normalized()*.025,(W-E)*.91,.032,ivory,elbow,20,end_radius=.022)
wrist=hinge('wristR',W-E,elbow)
ellipsoid('Wrist hinge R',(0,0,0),(.020,.020,.020),joint,wrist,16,12)
# Hand frame: wrist +X towards fingertips, +Y to index/thumb, palm inward -Z.
rounded_box('Right palm',(.034,0,0),(.068,.071,.022),.008,ivory,wrist)
FINGERS=[('index',.026,(.034,.025,.018),.0068),('middle',.0087,(.037,.027,.019),.0070),('ring',-.0087,(.034,.025,.018),.0066),('pinky',-.025,(.028,.021,.016),.0060)]
for name,y,lengths,r in FINGERS:
    parent=hinge(name+'MCP',(.069,y,-.002),wrist)
    for j,L in enumerate(lengths):
        capsule(name+' phalanx '+str(j+1),(r*.45,0,0),(L-r*.6,0,0),r,ivory,parent,12,3,end_radius=r*.92)
        if j<2:parent=hinge(name+('PIP' if j==0 else 'DIP'),(L,0,0),parent)
thumb=hinge('thumbCMC',(.026,.033,-.009),wrist)
capsule('Thumb proximal',(.004,0,0),(.030,0,0),.0082,ivory,thumb,12,3)
thumb2=hinge('thumbIP',(.035,0,0),thumb)
capsule('Thumb distal',(.003,0,0),(.025,0,0),.0076,ivory,thumb2,12,3)
# The far arm is supported on the far thigh and independent of the animated torso.
SL=Vector((-.28,1.075,-.178));EL=Vector((-.28,.785,-.178));WL=Vector((-.12,.599,-.145))
left=hinge('shoulderL',SL,root)
ellipsoid('Shoulder hinge L',(0,0,0),(.043,.043,.043),joint,left,20,14)
capsule('Upper arm L',(EL-SL).normalized()*.035,(EL-SL)*.89,.040,ivory,left,20,end_radius=.033)
le=hinge('elbowL',EL-SL,left)
ellipsoid('Elbow hinge L',(0,0,0),(.031,.031,.031),joint,le,18,12)
capsule('Forearm L',(WL-EL).normalized()*.025,(WL-EL)*.91,.032,ivory,le,20,end_radius=.022)
lw=hinge('wristL',WL-EL,le)
ellipsoid('Resting left palm',(.035,-.014,.015),(.046,.025,.037),ivory,lw,22,14)
for i in range(4):
    capsule('Resting left digit '+str(i),(.060,-.013,(i-1.5)*.016),(.090,-.025,(i-1.5)*.016+.008),.0065,ivory,lw,10,3)
capsule('Resting left thumb',(.010,-.025,.026),(.041,-.040,.038),.008,ivory,lw,12,3)
# Union and smooth the upper facial forms into one sculpted surface. This avoids
# visible intersecting ellipsoid seams and provides an attached lip support.
def sculpt_union(names, name, voxel):
    bpy.ops.object.select_all(action='DESELECT')
    objects=[bpy.data.objects[n] for n in names]
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join();o=objects[0];o.name=name
    mod=o.modifiers.new('Unified sculpt','REMESH');mod.mode='VOXEL';mod.voxel_size=voxel;mod.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Sculpt smoothing','SMOOTH');mod.factor=.6;mod.iterations=18
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=o.modifiers.new('Runtime topology','DECIMATE');mod.ratio=.20
    bpy.ops.object.modifier_apply(modifier=mod.name)
    for f in o.data.polygons:f.use_smooth=True
sculpt_union(['Cranium','Face','Nose bridge','Nose tip','Oral pad'],'Sculpted head',.0026)
sculpt_union(['Jaw','Chin'],'Sculpted jaw',.0024)
# Label/articulation metadata is embedded without synthetic animations. Runtime source
# owns the timeline; the saved Blender scene is an editable neutral rig, not a fake clip.
for key,o in nodes.items():
    o['joint']=key
    if any(s in key for s in ['MCP','PIP','DIP','CMC','IP']):o['hingeAxis']='local Y'
# Camera/light for opening the source file; not exported into the runtime asset.
bpy.ops.object.camera_add(location=(2,-3,1.7))
cam=bpy.context.object;cam.name='Source inspection camera';direction=Vector((-.1,0, .9))-cam.location
cam.rotation_euler=direction.to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=1.75;bpy.context.scene.camera=cam
bpy.ops.object.light_add(type='AREA',location=(1,-2,3));lamp=bpy.context.object;lamp.name='Source soft key';lamp.data.energy=250;lamp.data.shape='DISK';lamp.data.size=3
bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1
bpy.context.scene.render.engine='BLENDER_EEVEE_NEXT'
bpy.context.scene.world.color=(.25,.25,.25)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'drinking-mannequin.blend'))
# Restrict GLB to the actual model hierarchy; source camera/light stay editable in blend.
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for o in root.children_recursive:o.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'drinking-mannequin.glb'),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_animations=False,export_materials='EXPORT')
print('DRINKING_MANNEQUIN_EXPORTED',os.path.join(OUT,'drinking-mannequin.glb'))
