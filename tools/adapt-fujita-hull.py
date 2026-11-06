import json,struct,numpy as np,pathlib,sys
if len(sys.argv)!=2:raise SystemExit('Usage: python tools/adapt-fujita-hull.py /path/to/supplied-boat.glb')
src=pathlib.Path(sys.argv[1]);b=src.read_bytes();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);binbuf=b[28+n:];buf=bytearray();views=[];acc=[];meshes=[]
def read(i):
 a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];dt={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']];dim={'SCALAR':1,'VEC3':3,'VEC2':2,'VEC4':4}[a['type']];stride=v.get('byteStride',np.dtype(dt).itemsize*dim);return np.ndarray((a['count'],dim),dtype=dt,buffer=binbuf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(stride,np.dtype(dt).itemsize)).copy()
def append(a,typ,component,target):
 while len(buf)%4:buf.append(0)
 off=len(buf);buf.extend(a.tobytes());views.append({'buffer':0,'byteOffset':off,'byteLength':a.nbytes,'target':target});out={'bufferView':len(views)-1,'componentType':component,'count':len(a),'type':typ}
 if typ=='VEC3':out.update(min=a.min(0).tolist(),max=a.max(0).tolist())
 acc.append(out);return len(acc)-1
def visit(i,parent):
 node=j['nodes'][i];mat=parent@np.array(node.get('matrix',np.eye(4).T.ravel())).reshape(4,4).T
 if node.get('mesh') in [0,1,2] and 'mesh' in node:
  for p in j['meshes'][node['mesh']]['primitives']:
   points=read(p['attributes']['POSITION']);points=(np.column_stack([points,np.ones(len(points))])@mat.T)[:,:3]
   points[:,0]*=.83;points[:,1]=(points[:,1]+.47)*.29-.10;points[:,2]*=.88
   idx=read(p['indices']).astype('<u4').ravel();norm=np.zeros_like(points)
   for tri in idx.reshape(-1,3):
    a,c,d=points[tri];v=np.cross(c-a,d-a);norm[tri]+=v
   norm/=np.maximum(np.linalg.norm(norm,axis=1)[:,None],1e-12)
   pos=append(points.astype('<f4'),'VEC3',5126,34962);normal=append(norm.astype('<f4'),'VEC3',5126,34962);indices=append(idx,'SCALAR',5125,34963)
   meshes.append({'name':['Houseboat gunwale','Houseboat hull','Houseboat inner hull'][node['mesh']],'primitives':[{'attributes':{'POSITION':pos,'NORMAL':normal},'indices':indices,'material':node['mesh']}]})
 for c in node.get('children',[]):visit(c,mat)
for i in j['scenes'][0]['nodes']:visit(i,np.eye(4))
colors=[[.15,.22,.24,1],[.08,.25,.36,1],[.34,.38,.36,1]]
out={'asset':{'version':'2.0','generator':'Johansson Town houseboat hull adaptation','extras':{'source':j['asset']['extras'],'changes':'Hull only, reshaped proportions, rebuilt normals, original replacement materials; no source cabin, textures, fittings or signs retained.'}},'scene':0,'scenes':[{'nodes':list(range(len(meshes)))}],'nodes':[{'mesh':i,'name':m['name']} for i,m in enumerate(meshes)],'meshes':meshes,'materials':[{'name':name,'pbrMetallicRoughness':{'baseColorFactor':color,'metallicFactor':.15,'roughnessFactor':.8},'doubleSided':True} for name,color in zip(['Dark gunwale','Harbour blue','Inner hull'],colors)],'buffers':[{'byteLength':len(buf)}],'bufferViews':views,'accessors':acc}
s=json.dumps(out,separators=(',',':')).encode();s+=b' '*((-len(s))%4);buf+=b'\0'*((-len(buf))%4);dest=pathlib.Path(__file__).parents[1]/'assets/models/harbour/fujita-houseboat-hull.glb';dest.write_bytes(struct.pack('<III',0x46546c67,2,28+len(s)+len(buf))+struct.pack('<II',len(s),0x4e4f534a)+s+struct.pack('<II',len(buf),0x004e4942)+buf);print(dest,dest.stat().st_size)
