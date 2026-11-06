# Usage: python3 tools/shrink-glb-textures.py <in.glb> <out.glb> <max-pixels>
# Used for the Meshy kissaten candidates (art/kissaten/meshy/provenance.json): their 2048 px colour maps to 1024.
"""Rewrite a GLB with its images re-encoded as JPEG at most `size` pixels on a side; geometry untouched."""
import io,json,struct,sys
from PIL import Image
src,dst,size=sys.argv[1],sys.argv[2],int(sys.argv[3])
b=open(src,'rb').read()
jl=struct.unpack('<I',b[12:16])[0];g=json.loads(b[20:20+jl]);off=20+jl
bl=struct.unpack('<I',b[off:off+4])[0];binc=b[off+8:off+8+bl]
imgviews={im['bufferView']:i for i,im in enumerate(g.get('images',[])) if 'bufferView' in im}
out=bytearray();
for i,bv in enumerate(g['bufferViews']):
    data=binc[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']]
    if i in imgviews:
        im=Image.open(io.BytesIO(data)).convert('RGB')
        if max(im.size)>size:im=im.resize((size,size) if im.size[0]==im.size[1] else (size,int(im.size[1]*size/im.size[0])),Image.LANCZOS)
        buf=io.BytesIO();im.save(buf,'JPEG',quality=88);data=buf.getvalue();g['images'][imgviews[i]]['mimeType']='image/jpeg'
    while len(out)%4:out.append(0)
    bv['byteOffset']=len(out);bv['byteLength']=len(data);out+=data
while len(out)%4:out.append(0)
g['buffers'][0]['byteLength']=len(out)
js=json.dumps(g,separators=(',',':')).encode()
while len(js)%4:js+=b' '
total=12+8+len(js)+8+len(out)
open(dst,'wb').write(struct.pack('<III',0x46546C67,2,total)+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(out),0x004E4942)+bytes(out))
print(dst.split('/')[-1],len(b)//1024,'KB ->',total//1024,'KB')
