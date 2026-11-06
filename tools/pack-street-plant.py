"""Prepare Polygonal Mind's CC0 potted plant from the user-supplied OS3A catalogue.
Usage: python tools/pack-street-plant.py /path/to/Banana_Plant.glb
The original intake directory with its source receipts is also accepted.
"""
from pathlib import Path
from io import BytesIO
import hashlib,json,struct,sys
from PIL import Image

root=Path(__file__).resolve().parents[1]
intake=Path(sys.argv[1]);out=root/'assets/models/street';out.mkdir(parents=True,exist_ok=True)
if intake.is_dir():
    source=next(a for a in json.loads((intake/'selected-assets.json').read_text())['assets'] if a['name']=='Banana_Plant')
    model_path=intake/'Banana_Plant.glb'
else:
    receipt=json.loads((out/'manifest.json').read_text())
    source={'creator':receipt['creator'],'source_url':receipt['source'],'download_url':receipt['download'],
      'license_url':receipt['licenseURL'],'sha256':receipt['sourceSHA256'],'triangles':receipt['triangles']}
    model_path=intake
b=model_path.read_bytes()
if hashlib.sha256(b).hexdigest()!=source['sha256']:raise ValueError('Plant source differs from the verified original')
length=struct.unpack_from('<I',b,12)[0]
d=json.loads(b[20:20+length]);binary=b[28+length:]
image_views={i['bufferView'] for i in d['images']}
new=bytearray();views=[];mapped={}
for i,v in enumerate(d['bufferViews']):
    if i in image_views:continue
    new.extend(b'\0'*((-len(new))%4));mapped[i]=len(views)
    views.append({**v,'byteOffset':len(new)})
    new.extend(binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])
for accessor in d['accessors']:accessor['bufferView']=mapped[accessor['bufferView']]
for image in d['images']:
    v=d['bufferViews'][image['bufferView']]
    im=Image.open(BytesIO(binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]))
    im.thumbnail((512,512),Image.Resampling.LANCZOS)
    alpha=im.mode=='RGBA' and im.getchannel('A').getextrema()[0]<255
    stream=BytesIO()
    if alpha:im.save(stream,format='PNG',optimize=True)
    else:im.convert('RGB').save(stream,format='JPEG',quality=86,subsampling=0,optimize=True)
    payload=stream.getvalue();new.extend(b'\0'*((-len(new))%4))
    image['bufferView']=len(views);image['mimeType']='image/png' if alpha else 'image/jpeg'
    views.append({'buffer':0,'byteOffset':len(new),'byteLength':len(payload)});new.extend(payload)
for m in d['materials']:
    if m.get('alphaMode')=='BLEND':m['alphaMode']='MASK';m['alphaCutoff']=.45
    m.setdefault('pbrMetallicRoughness',{})['metallicFactor']=0
    m['pbrMetallicRoughness']['roughnessFactor']=.86
d['bufferViews']=views;d['buffers']=[{'byteLength':len(new)}]
header=json.dumps(d,separators=(',',':')).encode();header+=b' '*((-len(header))%4);new.extend(b'\0'*((-len(new))%4))
result=struct.pack('<III',0x46546c67,2,28+len(header)+len(new))+struct.pack('<II',len(header),0x4e4f534a)+header+struct.pack('<II',len(new),0x004e4942)+new
(out/'potted-plant.glb').write_bytes(result)
if intake.is_dir():(out/'LICENSE-CC0.md').write_text((intake/'Polygonal-Mind-CC0-License.md').read_text())
elif not (out/'LICENSE-CC0.md').exists():raise ValueError('Keep the included creator licence beside the manifest')
manifest={'path':'models/street/potted-plant.glb','creator':source['creator'],'catalogue':'https://github.com/ToxSam/os3a-gallery',
 'source':source['source_url'],'download':source['download_url'],'license':'CC0-1.0','licenseURL':source['license_url'],
 'sourceSHA256':source['sha256'],'sha256':hashlib.sha256(result).hexdigest(),'triangles':source['triangles'],'bytes':len(result),
 'changes':['Textures reduced to 512px and re-encoded','Alpha testing replaces transparent leaf blending','Instanced at runtime; original geometry retained']}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest))
