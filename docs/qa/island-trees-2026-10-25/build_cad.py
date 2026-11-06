"""Original tree design CAD, mesh catalogue and source-based audit. No game files are changed."""
from pathlib import Path
import argparse, json, math, struct, csv, zipfile, hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from shapely.geometry import Polygon
from shapely.ops import unary_union
import ezdxf
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT=Path(__file__).parent
OUT=Path.cwd()/'tree-output'
MM=72/25.4
PAPER='#f5f2e9'; INK='#203d39'; MUTED='#60716a'; GREEN='#6b9956'; GOLD='#bc8b48'
SPECS=[
 dict(id='TR-01',name='Round broadleaf',h=5.4,w=4.6,d=4.1,clear=2.2,role='Small garden / street tree; a new distinct family',base='minato-round',notes=['Three joined foliage masses define one scalloped crown.','Three tapered limbs connect the trunk to the crown.','Reserve for suitable gardens; no new street planting is authorised.']),
 dict(id='TR-02',name='Fukugi windbreak',h=6.2,w=2.65,d=2.35,clear=1.1,role='Existing boundary and school windbreaks',base='minato-column',notes=['A full egg-shaped crown with a rounded, asymmetric top.','Fine foliage detail is subordinate to the outer silhouette.','Low foliage belongs behind boundaries, not over a pedestrian route.']),
 dict(id='TR-03',name='Gajumaru / banyan',h=5.6,w=8.4,d=6.8,clear=2.3,role='Harbour Park and existing shrine / garden trees',base='minato-spread',notes=['Four substantial spreading branches carry the low canopy.','Three aerial roots start on actual branches and reach the ground.','The 8.4 m crown is a maximum study; fit each existing location.']),
 dict(id='TR-04',name='Ryukyu coastal pine',h=6.2,w=5.8,d=4.7,clear=2.2,role='Optional future coastal family; no active pine found',base=None,notes=['Three offset, rounded needle pads reveal the branch structure.','Never use a stack of pointed cones for the near model.','No island placement or extra planting is proposed in this revision.']),
 dict(id='TR-05',name='Coconut palm',h=8.0,w=7.2,d=6.8,clear=4.8,role='Existing 75 Kitano beach palms',base='palm',notes=['A gently bowed, tapered and ringed trunk supports the crown.','Twelve broad, closed fronds read clearly at ordinary game distance.','Distant crowns must retain the same bow and frond direction.']),
 dict(id='TR-06',name='Adan / pandanus',h=3.6,w=3.5,d=3.25,clear=.4,role='Existing 31 Kitano coastal specimens; tree-like plant',base='pandanus',notes=['Five visible prop roots meet the trunk rather than float beside it.','Three separate rosettes; broad folded leaves, not loose triangles.','Set the foliage envelope outside the walk and camera approach.']),
 dict(id='TR-07',name='Banana clump',h=3.4,w=3.8,d=3.5,clear=.5,role='Existing 34 Kitano specimens; a herb, not a woody tree',base='banana',notes=['A fleshy pseudostem and six broad, arched paddle leaves.','Small tip splits only; preserve a readable continuous leaf area.','Retain the tropical planting positions and their open routes.']),
]

def linear(hexstr):
    v=np.array([int(hexstr[i:i+2],16)/255 for i in (1,3,5)])
    return np.where(v<=.04045,v/12.92,((v+.055)/1.055)**2.4)

class Mesh:
    def __init__(self,name): self.name=name;self.parts=[];self.controls=[]
    def add(self,v,f,color,kind):
        v=np.asarray(v,float);f=np.asarray(f,int)
        if not len(v) or not len(f):return
        # Weld the poles / seams and orient every closed component consistently.
        from collections import defaultdict,deque
        _,first,inverse=np.unique(np.round(v,9),axis=0,return_index=True,return_inverse=True)
        v=v[first];f=inverse[f];area=np.linalg.norm(np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]]),axis=1);f=f[area>1e-10]
        edges=defaultdict(list)
        for i,tri in enumerate(f):
            for a,b in zip(tri,np.roll(tri,-1)):edges[tuple(sorted((int(a),int(b))))].append((i,int(a),int(b)))
        if any(len(e)!=2 for e in edges.values()):raise ValueError('Open or nonmanifold CAD part: '+kind)
        adj=defaultdict(list)
        for pair in edges.values():
            a,b=pair;toggle=a[1:]==b[1:];adj[a[0]].append((b[0],toggle));adj[b[0]].append((a[0],toggle))
        flip={};components=[]
        for i in range(len(f)):
            if i in flip:continue
            flip[i]=False;q=deque([i]);component=[]
            while q:
                a=q.popleft();component.append(a)
                for b,toggle in adj[a]:
                    value=flip[a]^toggle
                    if b not in flip:flip[b]=value;q.append(b)
                    elif flip[b]!=value:raise ValueError('Nonorientable CAD surface')
            components.append(component)
        for i,do in flip.items():
            if do:f[i]=f[i,[0,2,1]]
        for comp in components:
            ff=f[comp];volume=np.einsum('ij,ij->i',v[ff[:,0]],np.cross(v[ff[:,1]],v[ff[:,2]])).sum()/6
            if volume<0:f[comp]=f[comp][:,[0,2,1]]
        self.parts.append(dict(v=v,f=f,color=linear(color),kind=kind))
    def tube(self,points,radii,color='#886345',sides=9):
        p=np.asarray(points,float);v=[];f=[]
        for i,x in enumerate(p):
            t=p[min(i+1,len(p)-1)]-p[max(i-1,0)];t/=np.linalg.norm(t)
            a=np.cross(t,[0,0,1]);
            if np.linalg.norm(a)<.01:a=np.cross(t,[1,0,0])
            a/=np.linalg.norm(a);b=np.cross(t,a)
            for k in range(sides):v.append(x+radii[i]*(a*math.cos(k*2*math.pi/sides)+b*math.sin(k*2*math.pi/sides)))
        for i in range(len(p)-1):
            for k in range(sides):
                a=i*sides+k;b=i*sides+(k+1)%sides;c=(i+1)*sides+k;d=(i+1)*sides+(k+1)%sides
                f.extend([[a,c,b],[b,c,d]])
        # Closed, triangulated end caps.
        for end,reverse in [(0,True),(len(p)-1,False)]:
            mid=len(v);v.append(p[end])
            for k in range(sides):
                a=end*sides+k;b=end*sides+(k+1)%sides;f.append([mid,b,a] if reverse else [mid,a,b])
        self.add(v,f,color,'bark');self.controls.append({'points':p.tolist(),'radii':list(radii)})
    def crown(self,center,radius,color='#76ad55',seed=0,rows=16,cols=32):
        cx,cy,cz=center;rx,ry,rz=radius;v=[];f=[]
        for i in range(rows+1):
            t=math.pi*i/rows
            for j in range(cols):
                a=j/cols*math.tau
                scallop=1+.065*math.cos(a*3+seed)*math.sin(t)**2+.035*math.cos(a*5+seed*.7)*math.sin(t)**3
                y=cy+ry*math.cos(t)+.055*ry*math.cos(a*3+seed)*math.sin(t)**2
                v.append([cx+rx*math.sin(t)*math.cos(a)*scallop,y,cz+rz*math.sin(t)*math.sin(a)*scallop])
        for i in range(rows):
            for j in range(cols):
                a=i*cols+j;b=i*cols+(j+1)%cols;c=(i+1)*cols+j;d=(i+1)*cols+(j+1)%cols
                if i: f.append([a,b,c])
                if i<rows-1:f.append([b,d,c])
        self.add(v,f,color,'foliage')
    def leaf(self,base,yaw,length,rise,droop,width,color='#79b654',banana=False):
        # A closed folded blade: one soft top and a distinct underside, not an alpha card.
        v=[];f=[];rows=14;across=6;ay=np.array([math.cos(yaw),0,math.sin(yaw)]);side=np.array([-math.sin(yaw),0,math.cos(yaw)])
        for underside in (False,True):
            for i in range(rows+1):
                t=i/rows
                at=np.array(base)+ay*(length*t)+[0,rise*math.sin(t*math.pi*.85)-droop*t*t,0]
                half=width*(math.sin(math.pi*(.025+.95*t))**(.6 if banana else .75))*.5
                half*=1+(.025 if banana else .06)*math.cos(t*math.pi*10)
                for j in range(across+1):
                    s=j/across*2-1;lift=(1-s*s)*width*.10
                    v.append(at+side*(half*s)+[0,lift-(.025 if underside else 0),0])
        stride=across+1;n=(rows+1)*stride
        for lower in (0,1):
            for i in range(rows):
                for j in range(across):
                    a=lower*n+i*stride+j;b=a+1;c=a+stride;d=c+1
                    f.extend([[a,c,b],[b,c,d]] if not lower else [[a,b,c],[b,d,c]])
        for i in range(rows):
            for j in (0,across):
                a=i*stride+j;b=(i+1)*stride+j;f.extend([[a,b,a+n],[b,b+n,a+n]])
        for i in (0,rows):
            for j in range(across):
                a=i*stride+j;b=a+1;f.extend([[a,a+n,b],[b,a+n,b+n]])
        self.add(v,f,color,'foliage')
    def fit(self,h,w,d):
        v=np.concatenate([p['v'] for p in self.parts]);lo=v.min(0);hi=v.max(0);s=np.array([w/(hi[0]-lo[0]),h/(hi[1]-lo[1]),d/(hi[2]-lo[2])])
        for p in self.parts:p['v']=(p['v']-[0,lo[1],0])*s
        for c in self.controls:c['points']=((np.array(c['points'])-[0,lo[1],0])*s).tolist();c['radii']=[round(float(r*max(s[0],s[2])),5) for r in c['radii']]
        self.transform=dict(scale=s.tolist(),yShift=float(lo[1]))
    def arrays(self):
        v=[];f=[];colors=[];start=0
        for p in self.parts:v.extend(p['v']);f.extend(p['f']+start);colors.extend([p['color']]*len(p['v']));start+=len(p['v'])
        return np.array(v),np.array(f),np.array(colors)

def make_tree(spec):
    m=Mesh(spec['id']);key=spec['id']
    if key in ('TR-01','TR-02','TR-03','TR-04'):
        fork=1.85 if key!='TR-03' else 2.15
        m.tube([[0,0,0],[.035,.16,.02],[-.04,1.05,0],[.06,fork,.03]],[.44,.32,.24,.21])
        if key=='TR-02':
            m.crown([0,3.65,0],[1.28,2.5,1.15],color='#67a558',seed=2)
            for a in np.linspace(0,math.tau,4,endpoint=False):m.tube([[.05,1.4,0],[math.cos(a)*.35,2.3,math.sin(a)*.3],[math.cos(a)*.65,3.0,math.sin(a)*.5]],[.13,.09,.045])
        elif key=='TR-01':
            for i,a in enumerate([.15,2.2,4.35]):m.tube([[.06,fork,.03],[math.cos(a)*.58,2.45,math.sin(a)*.55],[math.cos(a)*1.25,3.16+i*.12,math.sin(a)*1.0]],[.2,.135,.07])
            for center,radius,seed in [([-.88,3.65,.05],[1.4,1.1,1.3],.5),([.95,3.8,-.1],[1.35,1.18,1.25],2),([0,4.5,.05],[1.3,.88,1.2],4)]:m.crown(center,radius,seed=seed)
        elif key=='TR-03':
            for i,a in enumerate([.25,1.85,3.4,5.05]):
                end=[math.cos(a)*2.6,3.5+(i%2)*.15,math.sin(a)*2.2]
                m.tube([[.06,fork,.03],[math.cos(a)*1.15,2.8,math.sin(a)*.9],end],[.24,.19,.095])
                if i<3:
                    m.tube([[end[0]*.63,3.05,end[2]*.63],[end[0]*.66,1.5,end[2]*.66],[end[0]*.7,0,end[2]*.7]],[.045,.06,.09],sides=7)
                m.crown([end[0]*.72,4.15+(i%2)*.12,end[2]*.72],[2.12,1.25,1.85],color='#74ac59',seed=i+.3)
            m.crown([-.2,4.82,.1],[2.4,.8,2.0],color='#80b760',seed=.2)
        else:
            for i,(x,y,z,rx,ry,rz) in enumerate([[-1.15,3.4,.2,1.75,.65,1.6],[1.0,4.65,-.25,1.8,.7,1.55],[-.25,5.6,.05,1.5,.65,1.4]]):
                m.tube([[.06,fork,.03],[x*.35,y-.7,z*.3],[x,y-.1,z]],[.17,.11,.055]);m.crown([x,y,z],[rx,ry,rz],color=['#639a53','#74a65c','#82af66'][i],seed=i)
    elif key=='TR-05':
        pts=[[.8*(t**1.6),7.5*t,.08*math.sin(t*math.pi)] for t in np.linspace(0,1,19)]
        m.tube(pts,[(.28-.11*t)*(1+(.06 if i%2 else 0)) for i,t in enumerate(np.linspace(0,1,19))],color='#a48b63',sides=10)
        for i in range(12):
            a=i*2.39996;length=3.4+(i%3)*.15;m.leaf([.8,7.45,0],a,length,.5+(i%3)*.12,1.35+(i%3)*.2,.68,color=['#7dbd57','#70ad4b','#609b43'][i%3])
        m.crown([.8,7.36,0],[.28,.37,.28],color='#6f9143',rows=8,cols=12)
        for i in range(4):m.crown([.8+math.cos(i*1.6)*.24,7.0,math.sin(i*1.6)*.24],[.15,.2,.15],color='#a39548',seed=i,rows=6,cols=10)
    elif key=='TR-06':
        for i,a in enumerate(np.linspace(0,math.tau,5,endpoint=False)):
            m.tube([[math.cos(a)*.72,0,math.sin(a)*.72],[math.cos(a)*.42,.65,math.sin(a)*.42],[0,1.25,0]],[.06,.055,.08],color='#aa9067',sides=7)
        m.tube([[0,.85,0],[.1,1.65,.03],[.35,2.25,0]],[.16,.13,.1],color='#9c8058')
        for k,(x,y,z) in enumerate([[.7,2.8,.18],[-.3,2.5,-.28],[.2,3.15,-.02]]):
            m.tube([[.35,2.25,0],[x,y,z]],[.09,.055])
            for i in range(9):m.leaf([x,y,z],i*2.39996+k,1.15+(i%3)*.12,.3,.8,.30,color=['#75ad59','#84b961','#659d4e'][i%3])
    elif key=='TR-07':
        m.tube([[0,0,0],[.01,1.0,.01],[.06,2.1,0]],[.19,.17,.11],color='#b7bc77')
        for i in range(6):m.leaf([.06,1.6+i*.14,0],i*2.39996,1.85+(i%2)*.12,.8,.8,.92,color=['#88bc5d','#77ac50','#9cc96b'][i%3],banana=True)
    m.fit(spec['h'],spec['w'],spec['d']);return m

def current_mesh(record):
    v=np.array(record['position']).reshape(-1,3);f=np.array(record['index']).reshape(-1,3) if record['index'] else np.arange(len(v)).reshape(-1,3)
    colors=np.array(record['color']).reshape(-1,3) if record['color'] else np.tile(linear('#6f9851'),(len(v),1))
    return v,f,colors

def raster(arrays,path,size=(1000,850),eye=(1,.30,1.3)):
    v,f,col=arrays;v=np.asarray(v);f=np.asarray(f);col=np.asarray(col)
    n=np.array(eye,float);n/=np.linalg.norm(n);right=np.cross([0,1,0],n);right/=np.linalg.norm(right);up=np.cross(n,right)
    xyz=np.stack([v@right,v@up,v@n],1);lo=xyz[:,:2].min(0);hi=xyz[:,:2].max(0)
    W,H=size;scale=min((W-100)/(hi[0]-lo[0]+.5),(H-90)/(hi[1]-lo[1]+.6));center=(lo+hi)/2
    p=np.stack([(xyz[:,0]-center[0])*scale+W/2,H/2-(xyz[:,1]-center[1])*scale,xyz[:,2]],1)
    bg=np.array([245,242,233]);img=np.tile(bg,(H,W,1)).astype(np.uint8);zbuf=np.full((H,W),-1e10);mask=np.zeros((H,W),np.uint8)
    ground=int(np.clip(H/2-((0-up@((v.min(0)+v.max(0))/2)))*scale,0,H-1))
    shadow=Image.new('RGBA',(W,H));sd=ImageDraw.Draw(shadow);bottom=np.max(p[:,1]);sw=min(W*.42,(hi[0]-lo[0])*scale*.38);sd.ellipse((W/2-sw,bottom-15,W/2+sw,bottom+12),fill=(53,72,45,24));shadow=shadow.filter(ImageFilter.GaussianBlur(12));img=np.array(Image.alpha_composite(Image.fromarray(img).convert('RGBA'),shadow).convert('RGB'))
    light=np.array([-.4,.8,.6]);light/=np.linalg.norm(light)
    for tri in f:
        q=p[tri];a,b,c=q;normal=np.cross(v[tri[1]]-v[tri[0]],v[tri[2]]-v[tri[0]]);norm=np.linalg.norm(normal)
        if norm<1e-10:continue
        normal/=norm
        x0=max(0,int(np.floor(q[:,0].min())));x1=min(W-1,int(np.ceil(q[:,0].max())));y0=max(0,int(np.floor(q[:,1].min())));y1=min(H-1,int(np.ceil(q[:,1].max())))
        if x0>x1 or y0>y1:continue
        den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
        if abs(den)<1e-8:continue
        yy,xx=np.mgrid[y0:y1+1,x0:x1+1];xx=xx+.5;yy=yy+.5
        u=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den;vv=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den;w=1-u-vv
        depth=u*a[2]+vv*b[2]+w*c[2];use=(u>=-.00001)&(vv>=-.00001)&(w>=-.00001)&(depth>zbuf[y0:y1+1,x0:x1+1])
        if not use.any():continue
        # Double-sided inspection; soft game-like bands. This is a CAD renderer, not a World shader claim.
        dot=abs(float(normal@light));shade=.65 if dot<.2 else .83 if dot<.55 else 1.0
        rgb=np.clip(col[tri].mean(0)*shade,0,1);rgb=np.where(rgb<=.0031308,rgb*12.92,1.055*rgb**(1/2.4)-.055);rgb=(rgb*255).astype(np.uint8)
        tile=img[y0:y1+1,x0:x1+1];tile[use]=rgb;zbuf[y0:y1+1,x0:x1+1][use]=depth[use];mask[y0:y1+1,x0:x1+1][use]=255
    edge=np.array(Image.fromarray(mask).filter(ImageFilter.MinFilter(3)))<mask
    img[edge]=(img[edge]*.75+np.array([42,61,44])*.25).astype(np.uint8)
    Image.fromarray(img).save(path)

def normals(v,f):
    out=np.zeros_like(v)
    for tri in f:
        n=np.cross(v[tri[1]]-v[tri[0]],v[tri[2]]-v[tri[0]])
        for i in tri:out[i]+=n
    lens=np.linalg.norm(out,axis=1);lens[lens<1e-8]=1;return (out/lens[:,None]).astype('<f4')

def glb(models,path):
    doc={'asset':{'version':'2.0','generator':'Johansson original island tree CAD Rev A'},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'materials':[],'buffers':[{'byteLength':0}],'bufferViews':[],'accessors':[]}
    buf=bytearray();materials={}
    def acc(a,kind,ctype=5126):
        nonlocal buf
        while len(buf)%4:buf.append(0)
        offset=len(buf);buf.extend(a.tobytes());view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':a.nbytes});entry={'bufferView':view,'componentType':ctype,'count':len(a),'type':kind}
        if kind=='VEC3':entry.update(min=a.min(0).tolist(),max=a.max(0).tolist())
        i=len(doc['accessors']);doc['accessors'].append(entry);return i
    for i,m in enumerate(models):
        prim=[]
        for part in m.parts:
            c=tuple(part['color']);matkey=c+tuple([part['kind']]);
            if matkey not in materials:
                materials[matkey]=len(doc['materials']);doc['materials'].append({'name':part['kind'],'pbrMetallicRoughness':{'baseColorFactor':list(c)+[1],'roughnessFactor':.9,'metallicFactor':0},'doubleSided':False})
            v=part['v'].astype('<f4');f=part['f'];p=acc(v,'VEC3');n=acc(normals(v,f),'VEC3');ind=acc(f.reshape(-1).astype('<u4'),'SCALAR',5125)
            prim.append({'attributes':{'POSITION':p,'NORMAL':n},'indices':ind,'material':materials[matkey]})
        doc['meshes'].append({'name':m.name,'primitives':prim});doc['nodes'].append({'name':m.name,'mesh':i,'translation':[i*13,0,0]});doc['scenes'][0]['nodes'].append(i)
    doc['buffers'][0]['byteLength']=len(buf);raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);buf+=b'\0'*((-len(buf))%4)
    path.write_bytes(struct.pack('<III',0x46546C67,2,12+8+len(raw)+8+len(buf))+struct.pack('<I4s',len(raw),b'JSON')+raw+struct.pack('<I4s',len(buf),b'BIN\0')+buf)

def outlines(mesh,axes=(0,1),kind=None):
    polys=[]
    for p in mesh.parts:
        if kind and p['kind']!=kind:continue
        pts=p['v'][:,axes]
        for f in p['f']:
            tri=Polygon(pts[f]);
            if tri.area>1e-9:polys.append(tri)
    if not polys:return []
    u=unary_union(polys);geoms=list(u.geoms) if hasattr(u,'geoms') else [u]
    return [np.array(g.exterior.coords) for g in geoms if g.geom_type=='Polygon']

def build_dxf(models,specs,path):
    doc=ezdxf.new('R2010');doc.units=4;msp=doc.modelspace()
    for name,color in [('BARK',32),('CROWN',3),('DIMS',8),('TEXT',7),('REFERENCE',9)]:doc.layers.new(name,dxfattribs={'color':color})
    for k,(m,s) in enumerate(zip(models,specs)):
        ox=(k%4)*25000;oy=-(k//4)*25000
        msp.add_text(s['id']+'  '+s['name'].upper(),dxfattribs={'height':240,'layer':'TEXT'}).set_placement((ox,oy+11000))
        for axes,dx,dy,label in [((0,1),0,0,'FRONT'),((2,1),11000,0,'SIDE'),((0,2),0,-9000,'PLAN')]:
            for kind,layer in [('bark','BARK'),('foliage','CROWN')]:
                for poly in outlines(m,axes,kind):msp.add_lwpolyline((poly*1000+[ox+dx,oy+dy]).tolist(),close=True,dxfattribs={'layer':layer})
            msp.add_text(label,dxfattribs={'height':180,'layer':'TEXT'}).set_placement((ox+dx-2500,oy+dy-5000 if label=='PLAN' else oy+dy-750))
        v,_,_=m.arrays();lo=v.min(0)*1000;hi=v.max(0)*1000
        for p1,p2,base in [((lo[0]+ox,oy),(hi[0]+ox,oy),(ox,oy-500)),((hi[0]+ox,oy),(hi[0]+ox,hi[1]+oy),(hi[0]+ox+700,oy)),((ox+11000+lo[2],oy),(ox+11000+hi[2],oy),(ox+11000,oy-500))]:
            angle=90 if p1[0]==p2[0] else 0
            dim=msp.add_linear_dim(base=base,p1=p1,p2=p2,angle=angle,dimstyle='EZDXF',override={'dimtxt':150,'dimasz':120,'dimexe':80,'dimexo':80,'dimdec':0},dxfattribs={'layer':'DIMS'});dim.render()
        msp.add_text('ALL DIMENSIONS mm. ORIGINAL DESIGN STUDY; NO LIVE REPLACEMENT.',dxfattribs={'height':130,'layer':'TEXT'}).set_placement((ox,oy-14000))
    doc.saveas(path)
    audit=doc.audit();return {'errors':len(audit.errors),'fixes':len(audit.fixes),'nativeDimensions':len(msp.query('DIMENSION'))}

def line(c,x1,y1,x2,y2,color=INK,width=.25):c.setStrokeColor(HexColor(color));c.setLineWidth(width*MM);c.line(x1*MM,y1*MM,x2*MM,y2*MM)
def txt(c,x,y,text,size=9,color=INK,font='Sans'):
    c.setFillColor(HexColor(color));c.setFont(font,size);c.drawString(x*MM,y*MM,str(text))
def wrap(c,x,y,text,width,size=9,leading=4.7,color=INK):
    words=text.split();row=''
    for w in words:
        test=(row+' '+w).strip()
        if pdfmetrics.stringWidth(test,'Sans',size)>width*MM and row:txt(c,x,y,row,size,color);y-=leading;row=w
        else:row=test
    if row:txt(c,x,y,row,size,color);y-=leading
    return y
def header(c,num,title,sub):
    c.setFillColor(HexColor(PAPER));c.rect(0,0,420*MM,297*MM,fill=1,stroke=0)
    txt(c,14,282,'JOHANSSON  /  ISLAND TREE DESIGN',9,MUTED,'Bold');txt(c,14,266,title,22,INK,'Bold');txt(c,14,256,sub,9,MUTED);line(c,14,250,406,250,MUTED,.18)
    txt(c,14,10,'REV A  |  25 OCTOBER 2026  |  METRES IN REPORT; MILLIMETRES IN DXF',7,MUTED);txt(c,347,10,f'A3 LANDSCAPE  /  {num:02}',7,MUTED)
def dim(c,a,b,label,offset=0):
    x1,y1=a;x2,y2=b
    line(c,x1,y1,x2,y2,MUTED,.15)
    dx=x2-x1;dy=y2-y1;L=math.hypot(dx,dy) or 1;nx=-dy/L;ny=dx/L
    for x,y in [a,b]:line(c,x-nx*1.2,y-ny*1.2,x+nx*1.2,y+ny*1.2,MUTED,.2)
    if abs(dy)>abs(dx):
        c.saveState();c.translate((x1-2)*MM,((y1+y2)/2)*MM);c.rotate(90);txt(c,0,0,label,8,MUTED);c.restoreState()
    else:txt(c,(x1+x2)/2-10,(y1+y2)/2+2,label,8,MUTED)
def draw_ortho(c,m,axes,x,y,k):
    for kind,color in [('bark','#8b6d4d'),('foliage','#94b77b')]:
        for poly in outlines(m,axes,kind):
            p=c.beginPath();p.moveTo((x+poly[0,0]*k)*MM,(y+poly[0,1]*k)*MM)
            for a,b in poly[1:]:p.lineTo((x+a*k)*MM,(y+b*k)*MM)
            p.close();c.setFillColor(HexColor(color));c.setStrokeColor(HexColor(INK));c.setLineWidth(.22*MM);c.drawPath(p,stroke=1,fill=1)
def human(c,x,y,k):
    c.setStrokeColor(HexColor('#9e9d8c'));c.setLineWidth(.4*MM);c.circle(x*MM,(y+1.67*k)*MM,.12*k*MM,stroke=1,fill=0)
    line(c,x,y+1.5*k,x,y+.8*k,'#9e9d8c',.5);line(c,x,y+.8*k,x-.15*k,y,'#9e9d8c',.5);line(c,x,y+.8*k,x+.15*k,y,'#9e9d8c',.5);line(c,x-.22*k,y+1.15*k,x+.22*k,y+1.15*k,'#9e9d8c',.5)

def make_pdf(current,models,summary,path):
    for name,file in [('Sans','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf')]:pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+file))
    c=canvas.Canvas(str(path),pagesize=(420*MM,297*MM));c.setTitle('Johansson Island Trees - CAD and Audit - Rev A');c.setAuthor('Office of Nils Johansson')
    by={m['id']:m for m in current['models']}
    header(c,1,'Trees with a clear identity','SOURCE AUDIT + ORIGINAL DIMENSIONED DESIGNS  /  No live game assets changed')
    txt(c,14,235,'WHY THE CHERRY WORKS',11,INK,'Bold');wrap(c,14,226,'It has a legible trunk, connected limbs and a single readable canopy. The island trees need that same clarity, with a different silhouette for each species.',186,11,5.8)
    txt(c,224,235,'AUDIT RESULT',11,INK,'Bold');wrap(c,224,226,'200 woody trees plus 65 tree-like coastal plants were accounted for. The stretched shared broadleaf and the separate tropical / distant systems need a common art direction.',180,11,5.8)
    for i,(old,new,caption) in enumerate([('minato-spread','TR-03','BANYAN: expose supporting limbs'),('palm','TR-05','PALM: a readable frond crown'),('minato-column','TR-02','FUKUGI: soften the dark stretched mass')]):
        x=14+i*132
        c.drawImage(str(OUT/('current-'+old+'.png')),x*MM,98*MM,width=62*MM,height=105*MM,preserveAspectRatio=True,anchor='c')
        c.drawImage(str(OUT/(new+'.png')),(x+63)*MM,98*MM,width=62*MM,height=105*MM,preserveAspectRatio=True,anchor='c')
        txt(c,x,94,'CURRENT GEOMETRY',7,MUTED);txt(c,x+64,94,'REV A DESIGN',7,MUTED);txt(c,x,82,caption,8,INK,'Bold')
    wrap(c,14,67,'Direction: compact, friendly, rounded forms; deliberate branch structure; broad readable foliage; quiet surface detail. Nintendo screenshots inform the visual language. Every proposed mesh here is original Johansson geometry.',388,10,5.3)
    wrap(c,14,44,'This is an audit and CAD design package, not a final in-game render. CAD comparison thumbnails are individually framed; dimensions govern scale. New shapes require a development prototype, World Look checks and device acceptance.',388,9,4.6,MUTED)
    c.showPage()
    header(c,2,'Measured tree register','Full production town built from source, including Kitano plants and hamlet  /  Excludes shrubs, ferns, grass and rocks')
    rows=[('Minato','Boundary / school fukugi','24'),('Minato','Gajumaru / spreading broadleaf','3'),('Minato','Harbour cherry','1'),('Kitano','Hamlet fukugi / gajumaru','14 / 1'),('Kitano','Coconut palms','75'),('Kitano','Rainforest canopy trees','82'),('Kitano','Adan / pandanus (tree-like)','31'),('Kitano','Banana clumps (herbaceous)','34')]
    y=232
    for row in [('ISLAND','FAMILY','INSTANCES')]+rows:
        txt(c,15,y,row[0],10);txt(c,59,y,row[1],10);txt(c,175,y,row[2],10);line(c,14,y-4,205,y-4,'#d4d8c9',.15);y-=16
    txt(c,225,231,'GEOMETRY FINDINGS',11,INK,'Bold')
    issues=[('01 / Repeated silhouette','The same 611-triangle sample is rescaled into round, column and spreading forms. The active production build uses column and spread; round is a dormant template.'),('02 / Cherry scale label','A scale setting of 6.2 produces a green crown 6.884 m tall and 8.097 m wide. Treat measured bounds, not a parameter name, as the envelope.'),('03 / Palm distant mismatch','The near sample is 7.304 m wide and 10.136 m tall, including its bowed crown. The far model is a straight pole with a flattened icosphere.'),('04 / Collision labels','226 generic "Island tree trunk" colliders cover 222 tropical plants plus four rocks. This label cannot be used as a tree count.')]
    y=219
    for title,body in issues:txt(c,225,y,title,10,INK,'Bold');y=wrap(c,225,y-7,body,178,9,4.6)-7
    wrap(c,14,65,'Confirmed scope: 28 Minato specimens + 237 Kitano specimens = 265 tree / tree-like placements. Of those, 200 are woody trees and 65 are pandanus or banana. Headland / forest-wall builders were inactive in this production build and are not counted.',386,10,5.2)
    txt(c,14,36,'Source commit: '+current['sourceCommit'],8,MUTED);c.showPage()
    header(c,3,'Minato - audit positions','Actual authored centres  /  Keep the island compact; retain existing plots and clear routes')
    map_image(summary['inventory'],'minato',OUT/'minato-plan.png',current);c.drawImage(str(OUT/'minato-plan.png'),14*MM,30*MM,width=238*MM,height=210*MM,preserveAspectRatio=True)
    txt(c,270,231,'28 SPECIMENS',12,INK,'Bold');y=219
    for t in ['24 fukugi: ten in the older gardens and fourteen at the school.','Three spreading broadleaf / gajumaru specimens.','One cherry at Harbour Park: retain its geometry and seasons.','Use TR-02 for boundary trees and TR-03 for the spreading specimens, subject to a site fit.','TR-01 and TR-04 are family studies, not instructions to fill empty plots.','The measured register includes world and local coordinates.']:
        y=wrap(c,270,y,t,130,10,5.2)-6
    c.showPage()
    header(c,4,'Kitano-jima - audit positions','Island-local coordinates u / v  /  Keep terrain, airport, hamlet, trails and beach openings')
    map_image(summary['inventory'],'kitano',OUT/'kitano-plan.png',current);c.drawImage(str(OUT/'kitano-plan.png'),14*MM,30*MM,width=250*MM,height=210*MM,preserveAspectRatio=True)
    txt(c,280,231,'237 SPECIMENS',12,INK,'Bold');y=219
    for t in ['75 coconut palms along the beach belt.','82 rainforest canopy trees inland.','31 pandanus and 34 banana clumps.','Fourteen hamlet fukugi and one hamlet gajumaru.','Match the near and far silhouette before changing the 240 / 260 m transition.','This revision does not move trees or introduce a third island.']:
        y=wrap(c,280,y,t,120,10,5.2)-6
    c.showPage()
    for page,(m,s) in enumerate(zip(models,SPECS),5):
        header(c,page,s['id']+'  /  '+s['name'],s['role']+'  /  Front and side 1:75 at A3; plan 1:150')
        k=1000/75;v,_,_=m.arrays();lo=v.min(0);hi=v.max(0)
        draw_ortho(c,m,(0,1),83,57,k);line(c,16,57,151,57,MUTED,.18);human(c,143,57,k)
        dim(c,(83+lo[0]*k,47),(83+hi[0]*k,47),f"{s['w']*1000:.0f} mm")
        dim(c,(22,57),(22,57+s['h']*k),f"{s['h']*1000:.0f} mm")
        txt(c,49,32,'FRONT  /  HUMAN 1.79 m',8,MUTED)
        draw_ortho(c,m,(2,1),215,57,k);line(c,161,57,267,57,MUTED,.18)
        dim(c,(215+lo[2]*k,47),(215+hi[2]*k,47),f"{s['d']*1000:.0f} mm")
        txt(c,195,32,'SIDE',8,MUTED)
        draw_ortho(c,m,(0,2),211,207,1000/150);txt(c,180,237,'PLAN  /  1:150',8,MUTED)
        c.drawImage(str(OUT/(s['id']+'.png')),279*MM,117*MM,width=125*MM,height=122*MM,preserveAspectRatio=True,anchor='c')
        txt(c,280,112,'ORTHOGRAPHIC DESIGN MODEL',8,MUTED);y=100
        for note in s['notes']:y=wrap(c,280,y,note,124,9,4.6)-3
        txt(c,280,39,f"Mesh: {len(m.arrays()[1]):,} triangles",8,MUTED)
        txt(c,280,28,'Closed opaque geometry / metres',8,MUTED)
        # The clearance is a design envelope, not a regulation or a collision certification.
        txt(c,15,230,f"Target lower foliage clearance: {s['clear']:.2f} m",9,INK,'Bold')
        txt(c,15,222,'Confirm the actual envelope at each existing site.',8,MUTED)
        c.showPage()
    header(c,12,'TR-08  /  Retain the harbour cherry','Existing production geometry, measured  /  No redesign of the accepted seasonal tree')
    for i,(key,label) in enumerate([('cherry-leaf','GREEN CROWN'),('cherry-bloom','FLOWERING CROWN'),('cherry-bare','BARE STRUCTURE')]):
        x=14+i*132;c.drawImage(str(OUT/('current-'+key+'.png')),x*MM,94*MM,width=126*MM,height=143*MM,preserveAspectRatio=True,anchor='c');r=by[key];b=r['bounds']['size'];txt(c,x,85,label,10,INK,'Bold');txt(c,x,74,f"H {b[1]:.3f} / W {b[0]:.3f} / D {b[2]:.3f} m",9,MUTED);txt(c,x,65,f"{r['triangles']:,} triangles",9,MUTED)
    wrap(c,14,49,'Keep the connected branches and seasonal dresses. The source scale is not the actual height: use the measured canopy bounds when checking sight lines. The present ground collider is only 0.48 x 0.48 m; compare it with the visible root flare before sign-off.',387,10,5.2)
    c.showPage()
    header(c,13,'Acceptance and replacement order','Original Johansson designs inspired by the clarity of a toy-life game  /  Ready for a development prototype')
    cols=[(14,'01 / SHAPE & CONTACT',['A trunk, fork and supported crown must remain readable from pedestrian height and from the town camera.','No floating foliage, unanchored roots, flat paddles seen edge-on, or exposed inside faces.','Use the cherry as a quality benchmark, without duplicating one canopy shape across every species.']),
          (148,'02 / CAMERA & PERFORMANCE',['Maintain the authored planting centres until the measured site fit proves a change is needed.','Use opaque instanced meshes; at most two material groups per prototype tree. The GLB is a CAD catalogue, not an optimised game export.','Set separate near / middle / far budgets; match crown centre, height and width within 5% before evaluating any LOD switch.']),
          (282,'03 / PROVE IT IN WORLD',['First prototype TR-02 and TR-03 in Minato and TR-05 on Kitano. Check front, side, under-canopy and opposite-shore views.','Check the existing Looks in day and dim lighting, shadows, walking routes, collision and camera clearance.','Target the established 60 fps desktop / 30 fps iPad budgets. No measured frame-rate or Safari pass is claimed by this CAD audit.'])]
    for x,title,notes in cols:
        txt(c,x,232,title,10,INK,'Bold');y=220
        for note in notes:y=wrap(c,x,y,note,122,10,5.4)-8
    txt(c,14,100,'REFERENCE AND PROVENANCE',11,INK,'Bold')
    refs=[('Production geometry','nj22az/nj22az.github.io, commit '+current['sourceCommit']),('Tree sources','src/world/okinawa/trees.js; vegetation-kit.js; cherry-tree.js; tropical-island.js'),('Official visual reference','Nintendo UK - Tomodachi Life: Living the Dream; IslandDesign2 official screenshot.'),('Reference URL','https://www.nintendo.com/en-gb/Games/Nintendo-Switch-download-software/Tomodachi-Life-Living-the-Dream-2786386.html'),('Prior unresolved finding','HANDOFF-2026-10-21.md: heavy / dark gajumaru crown; AMPLIFY-AUDIT.md: one shared broadleaf.'),('Verification boundary','Source-derived mesh measurements and CAD renders; no new live-browser, physical-device or full-world art acceptance.')]
    y=89
    for label,value in refs:txt(c,14,y,label,8,INK,'Bold');y=wrap(c,64,y,value,340,8,4.5,MUTED)-3
    c.showPage();c.save()

def map_image(inventory,island,path,current):
    import matplotlib;matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig,ax=plt.subplots(figsize=(10,8),dpi=140);fig.patch.set_facecolor(PAPER);ax.set_facecolor(PAPER)
    palette={'fukugi':'#537b50','banyan':'#a47b48','cherry':'#bd7b8e','palm':'#91ad54','rainforest':'#46744e','pandanus':'#ab9a54','banana':'#78a95d'}
    if island=='kitano':
        p=np.array(current['kitanoOutline']);ax.fill(p[:,0],p[:,1],color='#e0e5d1',zorder=0)
        for trail in current['kitanoTrails']:a=np.array(trail);ax.plot(a[:,0],a[:,1],color='#c19c67',lw=2,zorder=1)
        ax.add_patch(plt.Rectangle((-58,-12),122,28.75,color='#adb6ae',alpha=.5,zorder=1));ax.text(5,0,'AIRPORT',ha='center',fontsize=8,color=INK)
    else:
        ax.set_xlim(-44,46);ax.set_ylim(-48,60)
        for b in current['contextFootprints']:
            if abs(b['x'])<60 and abs(b['z'])<80:ax.add_patch(plt.Rectangle((b['x']-b['w']/2,b['z']-b['d']/2),b['w'],b['d'],fc='#d9ddd1',ec='none',alpha=.45))
    for family,color in palette.items():
        rows=[r for r in inventory if r['island']==island and r['family']==family]
        if not rows:continue
        x=[r['local_x'] for r in rows];z=[r['local_z'] for r in rows];ax.scatter(x,z,s=42 if family in ['banyan','cherry'] else 17,c=color,label=f'{family} ({len(rows)})',edgecolors=PAPER,linewidths=.5,zorder=3)
    ax.set_aspect('equal');ax.invert_yaxis();ax.set_xlabel('u / x (m)');ax.set_ylabel('v / z (m)');ax.grid(alpha=.15);ax.legend(loc='upper right',fontsize=8,framealpha=.95);fig.tight_layout();fig.savefig(path,facecolor=PAPER);plt.close(fig)

def main():
    global OUT
    parser=argparse.ArgumentParser();parser.add_argument('--current',type=Path,default=OUT/'current.json');parser.add_argument('--out',type=Path,default=OUT);args=parser.parse_args();OUT=args.out;OUT.mkdir(parents=True,exist_ok=True)
    current=json.loads(args.current.read_text());models=[make_tree(s) for s in SPECS]
    inventory=[];A=current['airportFrame'];ang=A['yaw'];ca=math.cos(ang);sa=math.sin(ang)
    def entry(island,family,x,y,z,source,scale=1):
        wx,wz=(A['x']+ca*x+sa*z,A['z']-sa*x+ca*z) if island=='kitano' else (x,z)
        inventory.append(dict(id=f'T-{len(inventory)+1:03}',island=island,family=family,local_x=x,local_y=y,local_z=z,world_x=wx,world_z=wz,source_height_parameter_m=scale if source=='broadleaf builder' else None,instance_scale=None if source=='broadleaf builder' else scale,source=source))
    for p in current['broadleafCalls']:
        island='kitano' if any('kitano-hamlet.js' in s for s in p['stack']) else 'minato';q=p['point'];entry(island,'fukugi' if p['family']=='column' else 'banyan',q['x'],q['y'],q['z'],'broadleaf builder',p['h'])
    for batch in current['instancedBatches']:
        if batch['name']=='School fukugi':
            for r in batch['instances']:p=r['position'];entry('minato','fukugi',p[0],p[1],p[2],batch['name'],r['scale'][0])
    entry('minato','cherry',12,0,-29.8,'Harbour cherry',6.2)
    for key,family in [('palms','palm'),('trees','rainforest'),('pandanus','pandanus'),('bananas','banana')]:
        for p in current['kitanoPlantings'][key]:entry('kitano',family,p['u'],p['y'],p['v'],'tropicalPlantings:'+key,p['scale'])
    summary=dict(sourceCommit=current['sourceCommit'],date='2026-10-25',scope='Source-based audit and original CAD design, no live replacement',counts={i:{f:sum(r['island']==i and r['family']==f for r in inventory) for f in ['fukugi','banyan','cherry','palm','rainforest','pandanus','banana']} for i in ['minato','kitano']},inventory=inventory,designs=[])
    for spec,m in zip(SPECS,models):
        v,f,co=m.arrays();assert np.isfinite(v).all();size=v.max(0)-v.min(0);assert np.allclose(size,[spec['w'],spec['h'],spec['d']],atol=1e-6)
        summary['designs'].append({**spec,'actualBounds':{'min':v.min(0).tolist(),'max':v.max(0).tolist()},'triangles':len(f),'branchControls':m.controls,'fitTransform':m.transform})
        raster((v,f,co),OUT/(spec['id']+'.png'))
    for record in current['models']:
        if record['id'] in ['minato-round','minato-column','minato-spread','palm','pandanus','banana','rainforest','cherry-leaf','cherry-bloom','cherry-bare']:raster(current_mesh(record),OUT/('current-'+record['id']+'.png'))
    with (OUT/'Island_Tree_Register_Rev_A.csv').open('w',newline='') as f:w=csv.DictWriter(f,fieldnames=list(inventory[0]));w.writeheader();w.writerows(inventory)
    summary['dxf']=build_dxf(models,SPECS,OUT/'Island_Trees_CAD_Rev_A.dxf')
    glb(models,OUT/'Island_Tree_Design_Catalog_Rev_A.glb')
    (OUT/'Island_Tree_Design_Rev_A.json').write_text(json.dumps(summary,indent=2)+'\n')
    make_pdf(current,models,summary,OUT/'Island_Trees_CAD_Audit_Rev_A.pdf')
    validation={'finiteGeometry':True,'dimensionedDesigns':len(models),'boundToleranceMetres':1e-6,'allTargetBoundsMatch':True,'inventoryCount':len(inventory),'woodyTrees':sum(r['family'] not in ['pandanus','banana'] for r in inventory),'treeLikePlants':sum(r['family'] in ['pandanus','banana'] for r in inventory),'dxf':summary['dxf'],'sourceCommit':current['sourceCommit'],'noGameRuntimeChanges':True,'physicalDeviceAcceptance':False}
    (OUT/'validation.json').write_text(json.dumps(validation,indent=2)+'\n')
    readme='''JOHANSSON ISLAND TREES - REV A\n25 October 2026\n\nAudit and original CAD design only. The live game is unchanged.\nThe PDF has 13 A3 landscape sheets. DXF modelspace is millimetres;\nfront / side / plan outlines are exact orthographic projections of the design mesh.\nThere are three native dimensions per proposed family.\nThe GLB is in metres, with seven labelled design trees spaced 13 m apart.\nIt is an editable CAD catalogue, not an optimised runtime asset.\nThe CSV contains 265 authored tree / tree-like placements, including 200 woody trees.\nJSON contains bounds, original branch controls, source provenance and inventory.\nCherry geometry is retained and audited, not replaced.\nNo live-rendering, phone, iPad or frame-rate pass is claimed.\n\nReproduction:\n1. Reproduce these drawings: python source/build_cad.py --current source/current-source-measurements.json --out output\n2. For a fresh game audit, place the measurement script and loader in the repository's docs/qa/island-trees-2026-10-25 folder, then run Node with --experimental-loader and TREE_AUDIT_OUTPUT set.\nPython dependencies: numpy, Pillow, shapely, ezdxf, reportlab, matplotlib.\n\nVisual reference: official Nintendo UK Tomodachi Life: Living the Dream page.\nNo Nintendo mesh, texture, code or extracted game asset is included.\n'''
    (OUT/'README.txt').write_text(readme)
    deliver=['Island_Trees_CAD_Audit_Rev_A.pdf','Island_Trees_CAD_Rev_A.dxf','Island_Tree_Design_Catalog_Rev_A.glb','Island_Tree_Register_Rev_A.csv','Island_Tree_Design_Rev_A.json','validation.json','README.txt']
    with zipfile.ZipFile(OUT/'Island_Trees_CAD_Package_Rev_A.zip','w',zipfile.ZIP_DEFLATED) as z:
        for name in deliver:z.write(OUT/name,name)
        z.write(__file__,'source/build_cad.py');z.write(ROOT/'measure-current.mjs','source/measure-current.mjs');z.write(ROOT/'capture-loader.mjs','source/capture-loader.mjs');z.write(args.current,'source/current-source-measurements.json')
        for s in SPECS:z.write(OUT/(s['id']+'.png'),'previews/'+s['id']+'.png')
    print(json.dumps(validation,indent=2))

if __name__=='__main__':main()
