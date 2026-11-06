"""Repack the Blender GLB with portable JPEG maps; no runtime decoder required.
Usage: python tools/pack-supplied-izakaya.py
"""
import argparse, hashlib, io, json, struct
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--asset',default='izakaya');a=p.parse_args()
art=root/f'art/{a.asset}/supplied'
source=art/'exterior-uncompressed.glb'
data=source.read_bytes();size=struct.unpack_from('<I',data,12)[0]
doc=json.loads(data[20:20+size]);binary=data[28+size:]
base_images={doc['textures'][m['pbrMetallicRoughness']['baseColorTexture']['index']]['source'] for m in doc['materials'] if 'baseColorTexture' in m.get('pbrMetallicRoughness',{})}
replacements={};images=[]
for i,image in enumerate(doc.get('images',[])):
 view=doc['bufferViews'][image['bufferView']];offset=view.get('byteOffset',0)
 with Image.open(io.BytesIO(binary[offset:offset+view['byteLength']])) as original:
  converted=original.convert('RGB');limit=2048 if i in base_images else 1024
  converted.thumbnail((limit,limit),Image.Resampling.LANCZOS)
  buffer=io.BytesIO();converted.save(buffer,format='JPEG',quality=88,subsampling=0,optimize=True)
  replacements[image['bufferView']]=buffer.getvalue();image['mimeType']='image/jpeg'
  images.append({'index':i,'size':list(converted.size),'bytes':len(buffer.getvalue()),'base_color':i in base_images})
packed=bytearray()
for i,view in enumerate(doc['bufferViews']):
 offset=view.get('byteOffset',0);chunk=replacements.get(i,binary[offset:offset+view['byteLength']])
 while len(packed)%4:packed.append(0)
 view['byteOffset']=len(packed);view['byteLength']=len(chunk);packed.extend(chunk)
while len(packed)%4:packed.append(0)
doc['buffers']=[{'byteLength':len(packed)}]
encoded=json.dumps(doc,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4)
output=struct.pack('<III',0x46546c67,2,28+len(encoded)+len(packed))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(packed),0x004e4942)+packed
filename='minato-supplied-exterior.glb' if a.asset=='izakaya' else 'tea-house-exterior.glb'
destination=root/f'assets/models/{a.asset}'/filename;destination.write_bytes(output)
report=json.loads((art/'geometry-report.json').read_text());report.update({'runtime_bytes':len(output),'runtime_sha256':hashlib.sha256(output).hexdigest(),'images':images,'size_reduction_percent':round(100*(1-len(output)/report['source_bytes']),2)})
(art/'optimisation-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
