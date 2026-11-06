"""Package a cleaned Blender GLB with 1K maps, preserving geometry, rig and clips."""
import argparse,struct,json,io
from pathlib import Path
from PIL import Image
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('destination');a=p.parse_args()
b=Path(a.source).read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);binary=b[28+n:];images={im['bufferView'] for im in g['images']};packed=bytearray()
for i,v in enumerate(g['bufferViews']):
 start=v.get('byteOffset',0);data=binary[start:start+v['byteLength']]
 if i in images:
  image=Image.open(io.BytesIO(data)).convert('RGB');image.thumbnail((1024,1024));out=io.BytesIO();image.save(out,format='JPEG',quality=88);data=out.getvalue()
 packed.extend(b'\0'*((-len(packed))%4));v['byteOffset']=len(packed);v['byteLength']=len(data);packed.extend(data)
g['buffers']=[{'byteLength':len(packed)}];payload=json.dumps(g,separators=(',',':')).encode();payload+=b' '*((-len(payload))%4);packed.extend(b'\0'*((-len(packed))%4))
Path(a.destination).write_bytes(struct.pack('<III',0x46546c67,2,28+len(payload)+len(packed))+struct.pack('<II',len(payload),0x4e4f534a)+payload+struct.pack('<II',len(packed),0x004e4942)+packed)
