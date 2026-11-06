"""Original reusable side-swept low ponytail; export body-relative Blender mesh parts.
Run with Blender --background --python tools/blender/build-swept-ponytail.py.
No third-party game assets are used. Coordinates are relative to the head centre/radius.
"""
import bpy,math,json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
parts=[]
def meshpart(name,vertices,faces,kind='head',shade=1,colour=None):
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
 obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
 parts.append({'name':name,'kind':kind,'shade':shade,'colour':colour,'vertices':vertices,'indices':[i for f in faces for i in f]})
 return obj
# Closed clean hairline: the perimeter is explicitly modelled, rather than burying
# the remainder of a whole sphere beneath the skin.
verts=[];faces=[];cols=48;rows=16
for row in range(rows+1):
 for col in range(cols+1):
  phi=2*math.pi*col/cols;front=max(0,math.cos(phi));back=max(0,-math.cos(phi))
  y=-.13-.40*back+front*(.63+.06*math.sin(phi)+.13*math.exp(-((math.sin(phi)+.23)/.18)**2)-.05*math.cos(4*phi))
  theta=(.012+(math.acos(y)-.012)*row/rows)
  verts.append([1.075*math.sin(theta)*math.sin(phi),1.075*math.cos(theta),1.06*math.sin(theta)*math.cos(phi)])
for row in range(rows):
 for col in range(cols):
  a=row*(cols+1)+col;b=a+1;c=a+cols+1;d=c+1;faces.extend([(a,c,b),(b,c,d)])
meshpart('Swept scalp',verts,faces)
# Raised curved fringe ribbons give an actual part and visible directional sweep.
for ribbon in range(3):
 verts=[];faces=[]
 for i in range(21):
  t=i/20;x=-.23+1.00*t;y=.88-.42*t+.085*math.sin(math.pi*t)+ribbon*.045
  for side in [-1,1]:
   yy=y+side*.055*math.sin(math.pi*(.06+.88*t));zz=math.sqrt(max(.02,1-x*x-yy*yy))+.105
   verts.append([x,yy,zz])
 for i in range(20):a=i*2;faces.extend([(a,a+2,a+1),(a+1,a+2,a+3)])
 meshpart('Swept fringe '+str(ribbon+1),verts,faces,shade=1+.025*ribbon)
# Lifted crown locks give the silhouette actual hair volume and a small cowlick.
# Each lock is a closed curved tube with a rounded belly and a tapered curling tip.
def raised_lock(name,controls,radius,shade):
 verts=[];faces=[];steps=24;sides=12
 def centre(t):
  return [sum(controls[i][axis]*[ (1-t)**3,3*(1-t)**2*t,3*(1-t)*t*t,t**3 ][i] for i in range(4)) for axis in range(3)]
 for row in range(steps+1):
  t=row/steps;cx,cy,cz=centre(t);a=centre(max(0,t-.002));b=centre(min(1,t+.002));dx,dy=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dy);nx,ny=-dy/length,dx/length
  r=radius*math.sin(math.pi*t)**.7+.008*(1-t)+.001
  for col in range(sides):
   angle=2*math.pi*col/sides;ridge=1+.035*math.cos(3*angle)
   verts.append([cx+nx*r*math.cos(angle)*ridge,cy+ny*r*math.cos(angle)*ridge,cz+r*.82*math.sin(angle)])
 for row in range(steps):
  for col in range(sides):
   a=row*sides+col;b=row*sides+(col+1)%sides;c=a+sides;d=b+sides;faces.extend([(a,b,c),(b,d,c)])
 faces.extend([(0,i+1,i) for i in range(1,sides-1)])
 base=steps*sides;faces.extend([(base,base+i,base+i+1) for i in range(1,sides-1)])
 meshpart(name,verts,faces,shade=shade)
raised_lock('Lifted swept crown',[( -.11,.98,.32),(0,1.28,.24),(.46,1.29,.10),(.65,1.08,0)],.115,1.45)
raised_lock('Crown curl behind',[( -.22,.99,0),(-.05,1.15,-.10),(.25,1.22,-.20),(.55,1.00,-.26)],.085,1.20)
raised_lock('Soft crown side lock',[( -.30,.91,.20),(-.45,1.10,.10),(-.40,1.15,0),(-.20,1.08,-.12)],.08,1.30)

# A narrow exposed scalp part is readable even in black hair. It follows the
# actual cap surface rather than disappearing into its crown.
verts=[];faces=[]
for i in range(25):
 t=i/24;x=-.23-.035*t;y=.60+.43*t;width=.018*(1-.72*t)
 for dx in [-width,width]:
  xx=x+dx;z=1.06*math.sqrt(max(.001,1-(xx/1.075)**2-(y/1.075)**2))+.025
  verts.append([xx,y,z])
for i in range(24):a=i*2;faces.extend([(a,a+2,a+1),(a+1,a+2,a+3)])
meshpart('Soft scalp part',verts,[(a,c,b) for a,b,c in faces],shade=.95,colour='scalp')
# Two tapered face-framing locks soften the temples without covering the eyes.
for side in [-1,1]:
 verts=[];faces=[]
 for row in range(17):
  t=row/16;radius=.055*(1-t)**.65+.004
  cx=side*(.84+.08*math.sin(math.pi*t)-.055*t);y=.34-.58*t;z=.52-.10*t
  for col in range(12):
   a=2*math.pi*col/12;verts.append([cx+radius*math.cos(a),y,z+radius*.7*math.sin(a)])
 for row in range(16):
  for col in range(12):a=row*12+col;b=row*12+(col+1)%12;c=a+12;d=b+12;faces.extend([(a,b,c),(b,d,c)])
 faces.extend([(0,i+1,i) for i in range(1,11)])
 base=16*12;faces.extend([(base,base+i,base+i+1) for i in range(1,11)])
 meshpart('Soft temple lock '+str(side),verts,faces,shade=1.04)
# Tapered locks gather low at the nape, then hang behind the shoulders.
for lock in range(5):
 verts=[];faces=[]
 for row in range(17):
  t=row/16;radius=(.23*(1-t)**.55+.025)*(.75 if lock in [0,4] else 1)
  cx=(lock-2)*.075*(1-.4*t);y=-.45-1.03*t;z=-1.02-.17*math.sin(math.pi*t)
  for col in range(12):
   a=2*math.pi*col/12;verts.append([cx+radius*math.cos(a),y,z+radius*.75*math.sin(a)])
 for row in range(16):
  for col in range(12):a=row*12+col;b=row*12+(col+1)%12;c=a+12;d=b+12;faces.extend([(a,b,c),(b,d,c)])
 faces.extend([(0,i+1,i) for i in range(1,11)])
 base=16*12;faces.extend([(base,base+i,base+i+1) for i in range(1,11)])
 meshpart('Ponytail lock '+str(lock+1),verts,faces,'tail',.93+.025*lock)
# Export the actual topology authored in Blender; runtime fits all head forms.
(root/'src/avatars/swept-ponytail-mesh.js').write_text('// Generated by tools/blender/build-swept-ponytail.py\nexport const SWEPT_PONYTAIL=Object.freeze('+json.dumps(parts,separators=(',',':'))+');\n')
mat=bpy.data.materials.new('Recolourable hair');mat.diffuse_color=(.65,.43,.2,1)
for obj in bpy.context.scene.objects:
 if obj.type=='MESH':obj.data.materials.append(mat)
scalp=bpy.data.materials.new('Scalp follows skin colour');scalp.diffuse_color=(.88,.67,.48,1)
bpy.data.objects['Soft scalp part'].data.materials.clear();bpy.data.objects['Soft scalp part'].data.materials.append(scalp)
bpy.ops.wm.save_as_mainfile(filepath=str(root/'art/avatars/swept-ponytail.blend'))
print('Exported',len(parts),'reusable hair parts')
