"""Pack the supplied Old Warehouse with NumPy/Pillow; retain source attribution."""
import copy, hashlib, io, json, struct, sys
from pathlib import Path
import numpy as np
from PIL import Image

source=Path(sys.argv[1]);original=source.read_bytes()
length=struct.unpack_from('<I',original,12)[0]
g=json.loads(original[20:20+length]);binary=original[28+length:]
out=copy.deepcopy(g)
out['asset']['generator']='Johansson Town warehouse packer'
out.update(bufferViews=[],accessors=[],meshes=[],nodes=[],scenes=[{'nodes':[]}],scene=0)
payload=bytearray()
def view(data,target=None):
 payload.extend(b'\0'*(-len(payload)%4))
 v={'buffer':0,'byteOffset':len(payload),'byteLength':len(data)}
 if target:v['target']=target
 out['bufferViews'].append(v);payload.extend(data);return len(out['bufferViews'])-1
def read_acc(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']]
 dt=np.dtype({5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']]);w={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
 return np.ndarray((a['count'],w),dtype=dt,buffer=binary,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',w*dt.itemsize),dt.itemsize)).copy()
def write_acc(values,kind):
 values=np.ascontiguousarray(values,dtype='<u4' if kind=='indices' else '<f4')
 a={'bufferView':view(values.tobytes(),34963 if kind=='indices' else 34962),'componentType':5125 if kind=='indices' else 5126,'count':len(values),'type':{1:'SCALAR',2:'VEC2',3:'VEC3'}[values.shape[1]]}
 if kind=='POSITION':a.update(min=values.min(0).tolist(),max=values.max(0).tolist())
 out['accessors'].append(a);return len(out['accessors'])-1
textures=[]
for i,im in enumerate(g['images']):
 v=g['bufferViews'][im['bufferView']];image=Image.open(io.BytesIO(binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]))
 image.thumbnail((1024,1024),Image.Resampling.LANCZOS);stream=io.BytesIO()
 # Preserve packed metal/roughness channels losslessly; photographic colour
 # and normal maps use high-quality JPEG without changing texture coordinates.
 lossless=i in (1,7)
 image.convert('RGB').save(stream,format='PNG' if lossless else 'JPEG',**({'optimize':True} if lossless else {'quality':90,'optimize':True}))
 out['images'][i]={'bufferView':view(stream.getvalue()),'mimeType':'image/png' if lossless else 'image/jpeg'}
 textures.append(list(image.size))
groups={};removed=[];original_draws=0
def visit(i,parent):
 global original_draws
 node=g['nodes'][i]
 # This source has matrix-only transforms (the two export axis conversions
 # cancel). Fail explicitly if a different file requires another convention.
 if any(k in node for k in ['rotation','scale','translation']):raise ValueError('Unexpected source transform')
 matrix=parent@np.array(node.get('matrix',np.eye(4).flatten(order='F'))).reshape(4,4,order='F')
 if 'mesh' in node:
  mesh=g['meshes'][node['mesh']]
  if mesh['name']=='pPlane1_lambert1_0':removed.append(mesh['name'])
  else:
   for pr in mesh['primitives']:
    original_draws+=1
    attrs={k:read_acc(a) for k,a in pr['attributes'].items() if k in ('POSITION','NORMAL','TEXCOORD_0')}
    attrs['POSITION']=attrs['POSITION']@matrix[:3,:3].T+matrix[:3,3]
    normals=attrs['NORMAL']@np.linalg.inv(matrix[:3,:3]);attrs['NORMAL']=normals/np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-10)
    indices=read_acc(pr['indices']).reshape(-1,1)
    groups.setdefault(pr['material'],[]).append((attrs,indices))
 for child in node.get('children',[]):visit(child,matrix)
for i in g['scenes'][g.get('scene',0)]['nodes']:visit(i,np.eye(4))
all_positions=[];triangles=0
for mi,parts in groups.items():
 attrs={k:np.concatenate([a[k] for a,_ in parts]) for k in parts[0][0]};indices=[];offset=0
 for a,ix in parts:indices.append(ix+offset);offset+=len(a['POSITION'])
 indices=np.concatenate(indices);triangles+=len(indices)//3;all_positions.append(attrs['POSITION'])
 pr={'attributes':{k:write_acc(v,k) for k,v in attrs.items()},'indices':write_acc(indices,'indices'),'material':mi}
 index=len(out['meshes']);name='Warehouse '+g['materials'][mi]['name']
 out['meshes'].append({'name':name,'primitives':[pr]});out['nodes'].append({'name':name,'mesh':index});out['scenes'][0]['nodes'].append(index)
out['buffers']=[{'byteLength':len(payload)}]
jb=json.dumps(out,separators=(',',':')).encode();jb+=b' '*(-len(jb)%4);payload+=b'\0'*(-len(payload)%4)
packed=struct.pack('<III',0x46546c67,2,28+len(jb)+len(payload))+struct.pack('<II',len(jb),0x4e4f534a)+jb+struct.pack('<II',len(payload),0x004e4942)+payload
folder=Path(__file__).resolve().parents[1]/'assets/models/warehouse';folder.mkdir(parents=True,exist_ok=True)
(folder/'old-warehouse.glb').write_bytes(packed)
ps=np.concatenate(all_positions)
manifest={'file':'old-warehouse.glb','sourceFile':source.name,'sourceSHA256':hashlib.sha256(original).hexdigest(),'sourceMetadata':g['asset'].get('extras',{}),'sha256':hashlib.sha256(packed).hexdigest(),'sourceBytes':len(original),'bytes':len(packed),'triangles':triangles,'draws':len(groups),'sourceDraws':original_draws+1,'textures':textures,'bounds':{'min':ps.min(0).tolist(),'max':ps.max(0).tolist()},'changes':['Removed only the detached presentation ground plane','Retained the warehouse, awning, ladder, pipes, windows and loading props','Merged static geometry by original material','Capped textures at 1024px; retained packed material channels losslessly']}
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest,indent=2))
