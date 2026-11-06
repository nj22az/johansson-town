"""Compact runtime derivatives of the original Blender harbour-bar scene.

Preserves the source Blender GLB's bottle placement and the original label art.
Writes ordinary GLB 2.0 with one primitive per material, accurate merged-part
provenance, opaque bottle shells and integral (non-overlay) label faces.
The high-resolution Blender scene and original exports are never changed.
"""
from pathlib import Path
from collections import defaultdict
import json, struct, math
import numpy as np

PROJECT = Path(__file__).resolve().parents[2]
OUT = PROJECT / 'assets/models/izakaya'
SOURCE = PROJECT / 'art/izakaya/walnut-source'
REPORT = PROJECT / 'art/izakaya/walnut-runtime-report.json'
OUT.mkdir(parents=True, exist_ok=True)
BRANDS = json.loads((SOURCE/'spirits-brands.json').read_text())
BY_NAME = {b['name']:b for b in BRANDS}

def linear(c):
    if isinstance(c,str): c=[int(c.strip('#')[i:i+2],16)/255 for i in (0,2,4)]
    return [v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c]

def load_source():
    return sorted(json.loads((SOURCE/'bottle-placements.json').read_text()),key=lambda n:n['name'])

# The atlas is a compact, lossless-layout derivative of the original label art.
# 4 × 4 tiles with generous edge-extruded gutters; 14 branded label regions.
ATLAS_RECTS={}
for i,b in enumerate(BRANDS):
    tx,ty=(i%4)*512,(i//4)*512
    ATLAS_RECTS[b['name']]=[(tx+76+.5)/2048,(ty+16+.5)/2048,(tx+436-.5)/2048,(ty+496-.5)/2048]

MATERIALS={
 'Wood':dict(base=[1,1,1],rough=.57,metal=0,texture='runtime-walnut.jpg'),
 'Slate':dict(base=[1,1,1],rough=.52,metal=0,texture='runtime-slate.jpg'),
 'Brass':dict(base=linear('#a88b53'),rough=.35,metal=.65),
 'Dark hardware':dict(base=linear('#332d27'),rough=.55,metal=.25),
 'Smoked backing':dict(base=linear('#798783'),rough=.40,metal=.42),
 'Lamp diffusers':dict(base=linear('#e8c68b'),rough=.6,metal=0,emission=[.52,.31,.10]),
 'Bottle bodies':dict(base=[1,1,1],rough=.27,metal=0,vertex_colours=True),
 'Bottle labels':dict(base=[1,1,1],rough=.72,metal=0,texture='spirits-label-atlas.jpg'),
}

class Batch:
    def __init__(self): self.v=[]; self.n=[]; self.uv=[]; self.c=[]; self.idx=[]; self.parts=[]
    def begin(self,name): self.parts.append({'start':len(self.v),'where':name})
    def face(self,verts,uvs=None,colour=None,normals=None):
        vv=np.array(verts,dtype=float)
        normal=np.cross(vv[1]-vv[0],vv[2]-vv[0]); length=np.linalg.norm(normal)
        if length<1e-12:return
        normal=normal/length
        start=len(self.v)
        self.v.extend(vv.tolist())
        self.n.extend(normals if normals is not None else [normal.tolist()]*len(vv))
        self.uv.extend(uvs or [(0,0)]*len(vv))
        self.c.extend([colour or [1,1,1]]*len(vv))
        for i in range(1,len(vv)-1):self.idx.extend([start,start+i,start+i+1])

class Asset:
    def __init__(self,name):self.name=name;self.b=defaultdict(Batch);self.bottles=[]
    def face(self,mat,name,verts,uvs=None,colour=None,normals=None):
        q=self.b[mat];q.begin(name);q.face(verts,uvs,colour,normals)

def coords_uv(vv,axis,grain='X'):
    result=[]
    for x,y,z in vv:
        if grain=='Z':u,v=z,x if axis!=0 else y
        elif axis==0:u,v=y,z
        elif axis==1:u,v=x,z
        else:u,v=x,y
        result.append((u/1.2,1-v/1.2))
    return result

def box(a,name,c,d,mat='Wood',omit=(),grain='X'):
    x,y,z=c;w,t,h=[v/2 for v in d]
    faces=[
      ('left',0,[(x-w,y-t,z-h),(x-w,y-t,z+h),(x-w,y+t,z+h),(x-w,y+t,z-h)]),
      ('right',0,[(x+w,y-t,z-h),(x+w,y+t,z-h),(x+w,y+t,z+h),(x+w,y-t,z+h)]),
      ('front',1,[(x-w,y-t,z-h),(x+w,y-t,z-h),(x+w,y-t,z+h),(x-w,y-t,z+h)]),
      ('back',1,[(x-w,y+t,z-h),(x-w,y+t,z+h),(x+w,y+t,z+h),(x+w,y+t,z-h)]),
      ('bottom',2,[(x-w,y-t,z-h),(x-w,y+t,z-h),(x+w,y+t,z-h),(x+w,y-t,z-h)]),
      ('top',2,[(x-w,y-t,z+h),(x+w,y-t,z+h),(x+w,y+t,z+h),(x-w,y+t,z+h)]),
    ]
    for key,axis,v in faces:
        if key not in omit:a.face(mat,f'{name} / {key}',v,coords_uv(v,axis,grain))

def rect_ring(a,name,x,y,z,w,h,inset,front_y,panel_y,mat='Wood'):
    # One continuous raised panel surface. No stacked/coincident boxes.
    rings=[]
    for ww,hh,yy in [(w,h,y),(w-.018,h-.018,front_y),(w-2*inset,h-2*inset,front_y),(w-2*inset-.018,h-2*inset-.018,panel_y)]:
        rings.append([(x-ww/2,yy,z-hh/2),(x+ww/2,yy,z-hh/2),(x+ww/2,yy,z+hh/2),(x-ww/2,yy,z+hh/2)])
    for j in range(3):
        for k in range(4):
            v=[rings[j][k],rings[j][(k+1)%4],rings[j+1][(k+1)%4],rings[j+1][k]]
            a.face(mat,f'{name} / frame {j}-{k}',v,coords_uv(v,1,'Z'))
    v=rings[-1];a.face(mat,f'{name} / inset',v,coords_uv(v,1,'Z'))

def rod(a,name,p0,p1,r,mat='Brass',segments=8,caps=True):
    p0,p1=np.array(p0,float),np.array(p1,float);axis=p1-p0;axis/=np.linalg.norm(axis)
    helper=np.array([0,0,1.]) if abs(axis[2])<.9 else np.array([1.,0,0])
    u=np.cross(axis,helper);u/=np.linalg.norm(u);v=np.cross(axis,u)
    points=[];norms=[]
    for j in range(segments):
        t=j*math.tau/segments;n=np.cos(t)*u+np.sin(t)*v;norms.append(n.tolist());points.append(n*r)
    q=a.b[mat];q.begin(name)
    for j in range(segments):
        k=(j+1)%segments
        q.face([p0+points[j],p0+points[k],p1+points[k],p1+points[j]],normals=[norms[j],norms[k],norms[k],norms[j]])
    if caps:
        q.face([p0+points[j] for j in reversed(range(segments))])
        q.face([p1+points[j] for j in range(segments)])

def cabinet():
    a=Asset('Backbar')
    box(a,'Plinth',(0,0,.075),(3.10,.48,.15),'Dark hardware',omit=('top',))
    box(a,'Base cabinet',(0,0,.525),(3.14,.49,.75),omit=('top','bottom'))
    for i,x in enumerate([-1.075,0,1.075]):
        rect_ring(a,f'Cupboard {i+1}',x,-.245,.443,1.035,.50,.055,-.309,-.294)
        box(a,f'Drawer {i+1}',(x,-.270,.8025),(1.035,.050,.155),omit=('back',))
        rod(a,f'Drawer {i+1} brass pull',(x-.095,-.332,.8025),(x+.095,-.332,.8025),.006)
        for xx in [x-.08,x+.08]:rod(a,f'Drawer {i+1} standoff',(xx,-.299,.8025),(xx,-.332,.8025),.005)
        rod(a,f'Cupboard {i+1} knob',(x+.34,-.308,.57),(x+.34,-.330,.57),.012)
    box(a,'Worktop walnut nosing',(0,-.045,.929),(3.33,.626,.058),omit=('bottom','top'))
    box(a,'Worktop slate',(0,-.050,.9725),(3.35,.64,.035),'Slate',omit=('bottom',))
    box(a,'Backboard',(0,.222,1.765),(3.20,.05,1.55),omit=('bottom',))
    for i,x in enumerate([-1.07,0,1.07]):
        # Bevelled brass frame connects directly to the opaque silver inset.
        outer=[(x-.487,.165,1.02),(x+.487,.165,1.02),(x+.487,.165,2.51),(x-.487,.165,2.51)]
        inner=[(x-.479,.182,1.028),(x+.479,.182,1.028),(x+.479,.182,2.502),(x-.479,.182,2.502)]
        for k in range(4):a.face('Brass',f'Mirror frame {i+1}-{k}',[outer[k],outer[(k+1)%4],inner[(k+1)%4],inner[k]])
        a.face('Smoked backing',f'Mirror inset {i+1}',inner)
    for xx in [-1.60,1.60]:
        # Extruded shaped pilaster; front moulding is integrated in the profile.
        outline=[(-.05,.225),(.05,.225),(.05,-.270),(.0325,-.270),(.0325,-.3075),(-.0325,-.3075),(-.0325,-.270),(-.05,-.270)]
        for k in range(len(outline)):
            p,q=outline[k],outline[(k+1)%len(outline)]
            vv=[(xx+p[0],p[1],.990),(xx+q[0],q[1],.990),(xx+q[0],q[1],2.555),(xx+p[0],p[1],2.555)]
            # Outline is clockwise as viewed from above; reverse for outward face.
            vv.reverse();a.face('Wood','Outer pilaster moulding',vv,coords_uv(vv,1,'Z'))
    for x in [-.535,.535]:
        box(a,'Inner upright',(x,-.035,1.77),(.066,.43,1.56),omit=('front','bottom','top'),grain='Z')
        for lo,hi,mat in [(x-.033,x-.0055,'Wood'),(x-.0055,x+.0055,'Brass'),(x+.0055,x+.033,'Wood')]:
            v=[(lo,-.25,.99),(hi,-.25,.99),(hi,-.25,2.55),(lo,-.25,2.55)]
            a.face(mat,'Upright integrated brass bead',v,coords_uv(v,1,'Z'))
    for row,z in enumerate([1.488,1.988]):
        box(a,f'Shelf {row+1}',(0,-.045,z),(3.17,.445,.031),omit=('front',))
        for lo,hi,mat in [(z-.0155,z-.0105,'Lamp diffusers'),(z-.0105,z+.0085,'Brass'),(z+.0085,z+.0155,'Wood')]:
            v=[(-1.585,-.2675,lo),(1.585,-.2675,lo),(1.585,-.2675,hi),(-1.585,-.2675,hi)]
            a.face(mat,f'Shelf {row+1} integrated fascia',v,coords_uv(v,1))
    # The rear lower cornice face is hidden by the fitted backboard and wall.
    # Omitting it avoids a near-coplanar 2 mm overlap at the backboard joint.
    box(a,'Cornice lower',(0,-.015,2.555),(3.31,.52,.055),omit=('top','back'))
    box(a,'Cornice brass inlay',(0,-.018,2.590),(3.34,.53,.012),'Brass',omit=('top','bottom'))
    box(a,'Cornice cap',(0,-.015,2.617),(3.39,.565,.047),omit=('bottom',))
    for row,z in enumerate([1.035,1.543,2.043]):
        for bay,x in enumerate([-1.07,0,1.07]):
            rod(a,f'Gallery rail {row+1}-{bay+1}',(x-.465,-.258,z),(x+.465,-.258,z),.004,segments=6)
            for xx in [x-.465,x+.465]:rod(a,'Gallery rail post',(xx,-.258,z-.041),(xx,-.258,z),.004,segments=6)
    return a

def bottle_profile(b):
    h,r,s=b['height'],b['radius'],b['shape'];neck=r*.35;n=2;ys=1
    if s in ('square','bourbon'):n=4.8;ys=.88
    if s in ('flask','tequila'):n=3.8;ys=.72
    if s in ('brandy','bulb','pear'):
        p=[(.67*r,0),(.90*r,.008),(r,.041),(r,h*.36-.004),(.90*r,h*.52-.004),(.65*r,h*.66-.004),(neck,h*.76-.004)]
    elif s in ('sake','wine','liqueur'):
        p=[(.80*r,0),(r,.016),(r,h*.63-.003),(.86*r,h*.735-.003),(.63*r,h*.78-.003),(neck,h*.825-.003)]
    elif s in ('gin','vodka','tall'):
        p=[(.81*r,0),(r,.013),(r,h*.71-.003),(.78*r,h*.775-.003),(neck,h*.80-.003)]
    else:
        p=[(.77*r,0),(r,.018),(r,h*.62-.003),(.88*r,h*.71-.003),(.66*r,h*.765-.003),(neck,h*.80-.003)]
    offset=.004 if s in ('brandy','bulb','pear') else .003
    capbottom=h-.019-offset; top=h+.007-offset
    p += [(neck,capbottom),(neck*1.15,capbottom),(neck*1.15,top)]
    return p,n,ys,offset,capbottom

def interp(p,z):
    for (r0,z0),(r1,z1) in zip(p,p[1:]):
        if z0<=z<=z1 and z1>z0:return r0+(r1-r0)*(z-z0)/(z1-z0)
    return p[-1][0]

def add_bottles(a):
    for source in load_source():
        brand=source['extras']['brand'];b=BY_NAME[brand];p,n,ys,offset,capbottom=bottle_profile(b)
        ox,oz,oy=source['translation'];oy=-oy;oz+=offset
        quat=source.get('rotation',[0,0,0,1]);angle=2*math.atan2(quat[1],quat[3]);ca,sa=math.cos(angle),math.sin(angle)
        zlo=b['label_centre_height']-b['label_height']/2-offset;zhi=zlo+b['label_height']
        theta=math.asin(min(.90,(b['label_width']/(2*b['radius']))**(n/2)))
        # Eight front-label sectors and eight rear sectors, with shared boundaries.
        angles=[-theta+2*theta*i/8 for i in range(9)]+[theta+(math.tau-2*theta)*i/8 for i in range(1,8)]
        rings=[]
        points=p+[(interp(p,zlo),zlo),(interp(p,zhi),zhi)]
        points.sort(key=lambda pair:pair[1])
        for rr,z in points:
            t=min(1,max(0,(z/b['height']-.68)/.12));nn=n+(2-n)*t;yy=ys+(1-ys)*t
            row=[]
            for th in angles:
                st,ct=math.sin(th),math.cos(th)
                xx=math.copysign(abs(st)**(2/nn),st)*rr
                yyv=-math.copysign(abs(ct)**(2/nn),ct)*rr*yy
                row.append(np.array([ca*xx-sa*yyv+ox,sa*xx+ca*yyv+oy,z+oz]))
            rings.append(row)
        # Smooth normals accumulate on the continuous shell, including the label region.
        norms=np.zeros((len(rings),len(angles),3));quads=[]
        for k in range(len(rings)-1):
            for j in range(len(angles)):
                jj=(j+1)%len(angles);ids=[(k,j),(k,jj),(k+1,jj),(k+1,j)]
                vv=[rings[z][t] for z,t in ids];nn=np.cross(vv[1]-vv[0],vv[2]-vv[0]);ll=np.linalg.norm(nn)
                if ll<1e-13:continue
                nn/=ll
                for ii in ids:norms[ii]+=nn
                quads.append((k,j,ids,vv))
        norms/=np.maximum(np.linalg.norm(norms,axis=2,keepdims=True),1e-12)
        # Emulate the filled bottle's overall tint without transparency sorting.
        colour=np.array(b['glass'])*.60+np.array(b['liquid'])*.40
        if b['slug']=='northglass':colour=np.array([.62,.76,.78])
        bodycolour=linear(np.clip(colour*.84+.04,0,1));capcolour=linear(b['cap'])
        u0,v0,u1,v1=ATLAS_RECTS[brand]
        a.b['Bottle bodies'].begin(source['name']+' / solid body and closure')
        a.b['Bottle labels'].begin(source['name']+' / integral paper faces')
        for k,j,ids,vv in quads:
            lower,upper=points[k][1],points[k+1][1]
            label=j<8 and lower>=zlo-1e-9 and upper<=zhi+1e-9 and upper>lower
            ns=[norms[ii].tolist() for ii in ids]
            if label:
                uv=[(u0+(u1-u0)*j/8,v1-(v1-v0)*(lower-zlo)/(zhi-zlo)),(u0+(u1-u0)*(j+1)/8,v1-(v1-v0)*(lower-zlo)/(zhi-zlo)),(u0+(u1-u0)*(j+1)/8,v1-(v1-v0)*(upper-zlo)/(zhi-zlo)),(u0+(u1-u0)*j/8,v1-(v1-v0)*(upper-zlo)/(zhi-zlo))]
                a.b['Bottle labels'].face(vv,uvs=uv,normals=ns)
            else:
                colour=capcolour if lower>=capbottom-1e-8 else bodycolour
                a.b['Bottle bodies'].face(vv,colour=colour,normals=ns)
        a.b['Bottle bodies'].face(list(reversed(rings[0])),colour=bodycolour)
        a.b['Bottle bodies'].face(rings[-1],colour=capcolour)
        a.bottles.append({'brand':brand,'position':[ox,oz,-oy],'angle_y':angle,'base_height':oz,'source':source['name']})

def counter():
    a=Asset('Counter');w,d,h=8.4,.83,.74
    box(a,'Counter foot plinth',(0,0,.045),(8.20,.60,.09),'Dark hardware',omit=('top','bottom'))
    box(a,'Counter carcass',(0,0,.385),(8.26,.61,.59),omit=('top','bottom'))
    for i in range(8):
        x=(i-3.5)*1.02
        rect_ring(a,f'Counter raised panel {i+1}',x,-.305,.381,.99,.53,.055,-.341,-.326)
    box(a,'Counter walnut nosing',(0,0,.7025),(8.38,.815,.045),omit=('top','bottom'))
    box(a,'Counter slate top',(0,0,.7325),(w,d,.015),'Slate',omit=('bottom',))
    rod(a,'Counter brass footrail',(-4.0,-.397,.14),(4.0,-.397,.14),.014,segments=10)
    for x in [-3.4,-1.7,0,1.7,3.4]:rod(a,'Counter footrail bracket',(x,-.307,.12),(x,-.397,.14),.009,segments=8)
    return a

def glb_write(asset,path):
    blob=bytearray();views=[];access=[];images=[];textures=[];mats=[];meshes=[];nodes=[]
    doc={'asset':{'version':'2.0','generator':'Johansson Blender backbar runtime derivative 1'},'scene':0,'scenes':[{'nodes':[0]}]}
    def store(data,target=None):
        while len(blob)%4:blob.append(0)
        start=len(blob);blob.extend(data);v={'buffer':0,'byteOffset':start,'byteLength':len(data)}
        if target:v['target']=target
        views.append(v);return len(views)-1
    def arr(data,kind,component=5126,target=34962):
        data=np.asarray(data,dtype='<f4' if component==5126 else '<u4')
        v=store(data.tobytes(),target);ac={'bufferView':v,'componentType':component,'count':len(data),'type':kind}
        if kind=='VEC3':ac['min']=data.min(axis=0).tolist();ac['max']=data.max(axis=0).tolist()
        access.append(ac);return len(access)-1
    img_ids={}
    for name in asset.b:
        settings=MATERIALS[name];p={'baseColorFactor':settings['base']+[1],'roughnessFactor':settings['rough'],'metallicFactor':settings['metal']}
        if 'texture' in settings:
            fn=settings['texture']
            if fn not in img_ids:
                data=(SOURCE/fn).read_bytes();images.append({'bufferView':store(data),'mimeType':'image/jpeg','name':fn});textures.append({'sampler':0,'source':len(images)-1});img_ids[fn]=len(textures)-1
            p['baseColorTexture']={'index':img_ids[fn]}
        m={'name':name,'pbrMetallicRoughness':p,'alphaMode':'OPAQUE','doubleSided':False}
        if 'emission' in settings:m['emissiveFactor']=settings['emission']
        mats.append(m)
    allpositions=[]
    for mi,(name,b) in enumerate(asset.b.items()):
        # Exact Blender -> glTF rigid basis change. No reindexing, so mergedParts
        # contains the actual exported accessor vertex offsets used by the audit.
        v=np.asarray(b.v,dtype=float);n=np.asarray(b.n,dtype=float)
        v=v[:,[0,2,1]]*np.array([1,1,-1]);n=n[:,[0,2,1]]*np.array([1,1,-1]);allpositions.extend(v.tolist())
        attrs={'POSITION':arr(v,'VEC3'),'NORMAL':arr(n,'VEC3')}
        if 'texture' in MATERIALS[name]:attrs['TEXCOORD_0']=arr(b.uv,'VEC2')
        if MATERIALS[name].get('vertex_colours'):attrs['COLOR_0']=arr(b.c,'VEC3')
        prim={'attributes':attrs,'indices':arr(b.idx,'SCALAR',5125,34963),'material':mi,'mode':4}
        extras={'mergedParts':b.parts,'source_parts':list(dict.fromkeys(p['where'] for p in b.parts))}
        meshes.append({'name':f'{asset.name} / {name}','primitives':[prim],'extras':extras})
        nodes.append({'name':f'{asset.name} / {name}','mesh':mi,'extras':extras})
    points=np.asarray(allpositions)
    rootextras={'asset':'minato-walnut-backbar' if asset.name=='Backbar' else 'minato-walnut-counter','runtimeOptimised':True,'front':'+Z','units':'metres','bottles':asset.bottles,'brands':[b['name'] for b in BRANDS] if asset.bottles else [],'integralLabelFaces':True,'allMaterialsOpaque':True}
    nodes=[{'name':asset.name,'children':list(range(1,len(nodes)+1)),'extras':rootextras}]+nodes
    doc.update(nodes=nodes,meshes=meshes,materials=mats,accessors=access,bufferViews=views,buffers=[{'byteLength':len(blob)}],images=images,textures=textures,samplers=[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}])
    js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((-len(js))%4);blob+=b'\0'*((-len(blob))%4)
    raw=struct.pack('<4sII',b'glTF',2,12+8+len(js)+8+len(blob))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(blob),0x004e4942)+blob
    temporary=path.with_suffix(path.suffix+'.tmp')
    temporary.write_bytes(raw)
    temporary.replace(path)
    report={'file':path.name,'root':asset.name,'file_bytes':len(raw),'vertices':sum(len(b.v) for b in asset.b.values()),'triangles':sum(len(b.idx)//3 for b in asset.b.values()),'primitives':len(meshes),'materials':len(mats),'images':len(images),'bounds':{'min':points.min(axis=0).tolist(),'max':points.max(axis=0).tolist()},'bottles':asset.bottles,'brands':rootextras['brands'],'front':'+Z','all_opaque':True,'double_sided_materials':0,'material_triangles':{name:len(b.idx)//3 for name,b in asset.b.items()}}
    return report

if __name__=='__main__':
    a=cabinet();add_bottles(a)
    reports=[glb_write(a,OUT/'minato-walnut-backbar.glb'),glb_write(counter(),OUT/'minato-walnut-counter.glb')]
    report={'original_model':'Walnut-Harbour-Back-Bar.blend (Blender 4.5.0, original authoring asset; not required for regeneration)','strategy':'Opaque material batches, integral shell label faces, no transmissive layers or duplicate decal surfaces','exports':reports,'texture_files':['spirits-label-atlas.jpg','runtime-walnut.jpg','runtime-slate.jpg']}
    REPORT.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({r['file']:{k:r[k] for k in ('file_bytes','vertices','triangles','primitives','bounds')} for r in reports},indent=2))
