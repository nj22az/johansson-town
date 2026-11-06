from pathlib import Path
import struct,json,io,subprocess,math
import numpy as np
from PIL import Image
import sys,hashlib
file=Path(sys.argv[1])
with file.open('rb') as f:
 f.seek(12);n,_=struct.unpack('<II',f.read(8));doc=json.loads(f.read(n));n,_=struct.unpack('<II',f.read(8));data=bytearray(f.read(n))
def accessor(i):
 a=doc['accessors'][i];b=doc['bufferViews'][a['bufferView']];dtype=np.dtype({5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']]);dim={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
 return np.ndarray((a['count'],dim),dtype=dtype,buffer=data,offset=b.get('byteOffset',0)+a.get('byteOffset',0),strides=(b.get('byteStride',dim*dtype.itemsize),dtype.itemsize)).copy()

if doc.get('asset',{}).get('extras',{}).get('householdRefit'):raise SystemExit('Already refitted')
mode=sys.argv[2];removed=0
for mi,mesh in enumerate(doc['meshes']):
 for p in mesh['primitives']:
  pos=accessor(p['attributes']['POSITION']);indices=accessor(p['indices']).astype(int).ravel();tri=indices.reshape(-1,3);v=pos[tri];centres=v.mean(1);x,y,z=centres.T;drop=np.zeros(len(tri),bool)
  if mode=='apartment':
   # Four redundant lounge pieces become two separate sleeping corners. Preserve
   # floor, rug, walls, kitchen, dining table and the user's apartment shell.
   for a,b,c,d in [(-3.5,-1.3,1.66,2.8),(-4.53,-3.40,2.75,4.04),(-3.05,-1.30,3.0,4.05),(-4.18,-3.49,1.95,2.72)]:
    drop|=(x>a)&(x<b)&(z>c)&(z<d)&(v[:,:,1].min(1)>.02)&(v[:,:,1].max(1)<1.15)
  elif mode=='office':
   # Baked PCs, LCDs, mice, keyboards and filing cabinet are replaced as complete
   # objects. Their independent printed shadows are removed from the desk too.
   if mi in [12,20,25]:drop[:]=True
   if mi==13:drop|=((y>1.50)&(z> -3.0)&(z< -2.80)&((x< -1.65)|((x>.75)&(x<1.1))))|((z< -3.30)&(x< -1.05)&(x> -1.4))
   if mi==21:drop|=(y>.89)&(y<.92)&(z< -2.40)&(((x< -1.67)&(x> -2.97))|((x>.38)&(x<1.7)))
   # Straighten the existing left chair and tuck it 20 cm closer to its keyboard.
   if mi in [11,19]:
    selected=(pos[:,0]<-2)&(pos[:,2]>-2.4);a=.617;c=np.cos(a);s=np.sin(a)
    for semantic in ['POSITION','NORMAL']:
     if semantic not in p['attributes']:continue
     ai=p['attributes'][semantic];arr=accessor(ai);q=arr[selected].copy()
     if semantic=='POSITION':q[:,0]+=2.52;q[:,2]+=1.82
     xx=q[:,0]*c+q[:,2]*s;zz=-q[:,0]*s+q[:,2]*c;q[:,0]=xx;q[:,2]=zz
     if semantic=='POSITION':q[:,0]-=2.52;q[:,2]-=2.02
     arr[selected]=q;ac=doc['accessors'][ai];bv=doc['bufferViews'][ac['bufferView']];offset=bv.get('byteOffset',0)+ac.get('byteOffset',0)
     for j in np.where(selected)[0]:struct.pack_into('<fff',data,offset+j*bv.get('byteStride',12),*arr[j])
     if semantic=='POSITION':ac['min']=arr.min(0).tolist();ac['max']=arr.max(0).tolist()
  keep=tri[~drop].ravel();removed+=int(drop.sum());ac=doc['accessors'][p['indices']];bv=doc['bufferViews'][ac['bufferView']];dtype={5125:'<u4',5123:'<u2',5121:'u1'}[ac['componentType']];encoded=keep.astype(dtype).tobytes();offset=bv.get('byteOffset',0)+ac.get('byteOffset',0);data[offset:offset+len(encoded)]=encoded;ac['count']=max(1,len(keep));p['_empty']=not len(keep);ac['min']=[int(keep.min()) if len(keep) else 0];ac['max']=[int(keep.max()) if len(keep) else 0]
# Empty primitives must not enter GLTFLoader; their buffers remain harmlessly
# embedded to preserve all original texture buffer references.
for mesh in doc['meshes']:mesh['primitives']=[p for p in mesh['primitives'] if not p.pop('_empty',False)]
empty={i for i,m in enumerate(doc['meshes']) if not m['primitives']}
for node in doc['nodes']:
 if node.get('mesh') in empty:del node['mesh']
# glTF requires a nonempty primitives array even on an unused mesh.
mapping={old:new for new,old in enumerate(i for i in range(len(doc['meshes'])) if i not in empty)}
doc['meshes']=[m for i,m in enumerate(doc['meshes']) if i not in empty]
for node in doc['nodes']:
 if 'mesh' in node:node['mesh']=mapping[node['mesh']]
doc.setdefault('asset',{}).setdefault('extras',{})['householdRefit']={'kind':mode,'removedTriangles':removed,'sourceSHA256':hashlib.sha256(file.read_bytes()).hexdigest()}
raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);data+=b'\x00'*((-len(data))%4)
file.write_bytes(struct.pack('<III',0x46546c67,2,28+len(raw)+len(data))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(data),0x004e4942)+data)
print(mode,'removed',removed,'triangles')
