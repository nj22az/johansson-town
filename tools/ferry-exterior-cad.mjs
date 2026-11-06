#!/usr/bin/env node
/**
 * The Minato Maru's exterior, drawn in CAD from the game's own model (sheets JS-127-X1 and JS-127-X2).
 *
 * The owner, 3 November 2026, with a screenshot of her alongside Kitano-jima: "The minato Ferry has lots of problems
 * can you draw it in cad". The design book (docs/minato-maru, tools/ferry-drawings.mjs) draws her spaces as boxes; this
 * draws her as she is actually modelled: buildFerryModel() is built in Node exactly as the game builds it, every visible
 * triangle is projected orthographically, hidden lines are removed against a software depth buffer, and the visible
 * feature, boundary and silhouette edges are written as vectors (SVG and DXF), then printed to PDF in Chromium.
 *
 *   X1  Exterior as built, at sea (ramp raised): starboard and port profiles, plan, bow and stern elevations, 1:100.
 *   X2  Alongside Kitano-jima, the owner's screenshot (ramp on the pier, lines as rigged), with the problems found
 *       marked and listed: profile and plan 1:100, bow elevation 1:50.
 *
 * Run: node tools/ferry-exterior-cad.mjs   → docs/minato-maru/exterior/ (SVG, DXF, PDF, PNG previews, problems.json)
 * The PDF and PNG need the pre-installed Chromium (Playwright); pass --no-pdf to write only SVG, DXF and JSON.
 */
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {execSync} from 'node:child_process';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from '../tests/fixtures.mjs';
installDOM();
const {buildFerryModel,FERRY_HULL,FERRY_RAMP,FERRY_CASINGS}=await import('../src/world/ferry-model.js');
const {FERRY_MOORING,FERRY_MOORINGS}=await import('../src/world/ferry.js');
const {AIRPORT_FERRY_PORTS}=await import('../src/world/airport-ferry.js');
const {AIRPORT_LANDING,AIRPORT_PIER_HEIGHT,AIRPORT_CARGO_SURFACE,airportWorld}=await import('../src/world/airport-ground.js');
const {AIRPORT_JETTY}=await import('../src/world/airport-island.js');
const {MINATO_BERTH}=await import('../src/world/minato-berth.js');
const {SEA_LEVEL}=await import('../src/world/ocean.js');
const {FERRY_SHIP,FERRY_HEIGHTS,FERRY_GA}=await import('../src/world/ferry-ship.js');
const {FERRY_INTERIOR,FERRY_HOUSE,FERRY_SALOON,FERRY_CREW_STAIR,FERRY_PASSENGER_SEATS}=await import('../src/world/ferry-interior.js');
const {laneBoardLayout}=await import('../src/world/ferry-boards.js');

const HERE=dirname(fileURLToPath(import.meta.url)),ROOT=join(HERE,'..');
const OUT=join(ROOT,'docs','minato-maru','exterior');
const DATE='2026-11-03',REV='B';
const HALF=FERRY_SHIP.length/2,T=FERRY_SHIP.draft,REST_Y=SEA_LEVEL+FERRY_HULL.origin;
const r2=n=>Math.round(n*100)/100,r1=n=>Math.round(n*10)/10;
/** Shipyard coordinates: z from the transom, height above the keel (base line). */
const yard=p=>({z:p[2]+HALF,h:p[1]+T,x:p[0]});

// ------------------------------------------------------------------ the model, posed
/** She is built as the game builds her; `pose` puts her ramp and gangway where they are in that state. */
function ship(pose){
 const f=buildFerryModel();
 if(pose==='kitano'){
  // Alongside Kitano-jima: at rest on her waterline, the ramp's flap on the pier (ferry.js: restRamp at the landing).
  f.position.set(0,REST_Y,0);f.updateMatrixWorld(true);f.userData.restRamp(AIRPORT_FERRY_PORTS.airport.height);
  f.userData.setRampLocked?.(true);f.position.set(0,0,0);
 }
 if(pose==='minato'){f.position.set(0,REST_Y,0);f.updateMatrixWorld(true);f.userData.restRamp(MINATO_BERTH.landing.top);f.position.set(0,0,0);}
 f.updateMatrixWorld(true);return f;
}

/** Every visible triangle in her frame (metres; +x port, y up from the laden waterline, +z forward, origin amidships). */
function soup(root){
 const P=[],owner=[],parts=[],marks=[],m4=new THREE.Matrix4(),v=new THREE.Vector3();
 root.traverseVisible(o=>{
  if(!o.isMesh)return;
  const mats=Array.isArray(o.material)?o.material:[o.material];
  if(mats.every(m=>!m||m.visible===false||m.colorWrite===false))return;
  const g=o.geometry,pos=g.attributes.position;if(!pos)return;
  const idx=g.index,n=(idx?idx.count:pos.count)-(idx?idx.count:pos.count)%3,count=o.isInstancedMesh?o.count:1,part=parts.length;
  parts.push(o.name||o.parent?.name||'unnamed');marks.push(MARKING.test(o.name)?1:0);
  for(let k=0;k<count;k++){
   if(o.isInstancedMesh){o.getMatrixAt(k,m4);m4.premultiply(o.matrixWorld);}else m4.copy(o.matrixWorld);
   for(let i=0;i<n;i++){v.fromBufferAttribute(pos,idx?idx.getX(i):i).applyMatrix4(m4);P.push(v.x,v.y,v.z);}
   for(let t=0;t<n/3;t++)owner.push(part);
  }
 });
 return {P:Float64Array.from(P),owner:Int32Array.from(owner),parts,mark:Uint8Array.from(owner,o=>marks[o])};
}
/** Paint, not structure: the painted words and marks, the red walkways, labels and tags. Drawn as markings, thin and dashed. */
const MARKING=/^Minato Maru (decal|markings)$|^label:|KKS tag|^badge$|^wordmark$/;

/** Welds the vertices (0.5 mm) and finds every edge with the faces that meet on it. */
function topology(P){
 const T3=P.length/3,vid=new Int32Array(T3),map=new Map();let nv=0;
 for(let i=0;i<T3;i++){const k=Math.round(P[i*3]*2000)+','+Math.round(P[i*3+1]*2000)+','+Math.round(P[i*3+2]*2000);let id=map.get(k);if(id===undefined){id=nv++;map.set(k,id);}vid[i]=id;}
 const nt=T3/3,N=new Float64Array(nt*3),ok=new Uint8Array(nt);
 for(let t=0;t<nt;t++){const a=t*9;const ux=P[a+3]-P[a],uy=P[a+4]-P[a+1],uz=P[a+5]-P[a+2],wx=P[a+6]-P[a],wy=P[a+7]-P[a+1],wz=P[a+8]-P[a+2];
  const nx=uy*wz-uz*wy,ny=uz*wx-ux*wz,nz=ux*wy-uy*wx,l=Math.hypot(nx,ny,nz);
  if(l>1e-10&&vid[t*3]!==vid[t*3+1]&&vid[t*3+1]!==vid[t*3+2]&&vid[t*3]!==vid[t*3+2]){ok[t]=1;N[t*3]=nx/l;N[t*3+1]=ny/l;N[t*3+2]=nz/l;}}
 const E=new Map();
 for(let t=0;t<nt;t++){if(!ok[t])continue;for(let e=0;e<3;e++){const i=t*3+e,j=t*3+(e+1)%3,a=vid[i],b=vid[j],key=a<b?a*4194304+b:b*4194304+a;
  let r=E.get(key);if(!r){r={i,j,f:[]};E.set(key,r);}r.f.push(t);}}
 const edges=[];const cos=Math.cos(50*Math.PI/180);
 for(const r of E.values()){
  let crease=r.f.length===1;
  for(let a=0;a<r.f.length&&!crease;a++)for(let b=a+1;b<r.f.length;b++){const p=r.f[a]*3,q=r.f[b]*3;if(N[p]*N[q]+N[p+1]*N[q+1]+N[p+2]*N[q+2]<cos){crease=true;break;}}
  edges.push({a:r.i,b:r.j,f:r.f,crease});
 }
 return {N,ok,edges};
}

// ------------------------------------------------------------------ hidden-line removal
/** Orthographic views: screen right U, screen up V, depth D (away from the eye). */
const VIEWS={
 starboard:{U:[0,0,1],V:[0,1,0],D:[1,0,0],title:'STARBOARD PROFILE'},
 port:{U:[0,0,-1],V:[0,1,0],D:[-1,0,0],title:'PORT PROFILE'},
 plan:{U:[0,0,1],V:[1,0,0],D:[0,-1,0],title:'PLAN FROM ABOVE'},
 bow:{U:[1,0,0],V:[0,1,0],D:[0,0,-1],title:'BOW ELEVATION, LOOKING AFT'},
 stern:{U:[-1,0,0],V:[0,1,0],D:[0,0,1],title:'STERN ELEVATION, LOOKING FORWARD'},
};
const dot=(a,x,y,z)=>a[0]*x+a[1]*y+a[2]*z;
const RES=.01;   // 1 cm a pixel of the depth buffer: 0.1 mm on the sheet at 1:100

/**
 * Projects her into a view, fills the depth buffer, and returns the visible edges as segments in view metres. With
 * `clip` ({axis 0|1|2, value, keep +1 to keep the side where the coordinate is greater, −1 less}) she is cut by that
 * plane first, as a section or a plan cut above a deck: what is cut away is not drawn, and `cut` holds the lines where
 * the plane cuts her faces.
 */
function hiddenLine(model,view,clip=null){
 const {N,ok,edges,mark}=model,V=VIEWS[view];let P=model.P,owner=null;
 const side=(x,y,z)=>clip?clip.keep*([x,y,z][clip.axis]-clip.value):1;
 const cut=[];
 if(clip){
  // Cut every triangle by the plane: keep what is on the kept side (fan-triangulated), and note where it is cut.
  const out=[],own=[],tri=model.P;
  for(let t=0;t<tri.length/9;t++){
   const v=[0,1,2].map(k=>[tri[t*9+k*3],tri[t*9+k*3+1],tri[t*9+k*3+2]]),d=v.map(p=>side(...p));
   if(d.every(x=>x>=0)){out.push(...v.flat());own.push(t);continue;}if(d.every(x=>x<0))continue;
   const poly=[],xs=[];
   for(let k=0;k<3;k++){const a=v[k],b=v[(k+1)%3],da=d[k],db=d[(k+1)%3];if(da>=0)poly.push(a);
    if((da>=0)!==(db>=0)){const f=da/(da-db),q=a.map((c,i)=>c+(b[i]-c)*f);poly.push(q);xs.push(q);}}
   for(let k=1;k+1<poly.length;k++){out.push(...poly[0],...poly[k],...poly[k+1]);own.push(t);}
   if(xs.length===2)cut.push(xs);
  }
  P=Float64Array.from(out);owner=Int32Array.from(own);
 }
 const nt=P.length/9,n3=P.length/3,tid=t=>owner?owner[t]:t;
 const pu=new Float64Array(n3),pv=new Float64Array(n3),pd=new Float64Array(n3);
 let u0=Infinity,u1=-Infinity,v0=Infinity,v1=-Infinity;
 for(let i=0;i<n3;i++){const x=P[i*3],y=P[i*3+1],z=P[i*3+2];pu[i]=dot(V.U,x,y,z);pv[i]=dot(V.V,x,y,z);pd[i]=dot(V.D,x,y,z);
  if(pu[i]<u0)u0=pu[i];if(pu[i]>u1)u1=pu[i];if(pv[i]<v0)v0=pv[i];if(pv[i]>v1)v1=pv[i];}
 u0-=.2;v0-=.2;u1+=.2;v1+=.2;
 const W=Math.ceil((u1-u0)/RES),H=Math.ceil((v1-v0)/RES),depth=new Float32Array(W*H).fill(Infinity),tri=new Int32Array(W*H).fill(-1);
 const sx=u=>(u-u0)/RES,sy=v=>(v1-v)/RES;
 for(let t=0;t<nt;t++){
  const a=t*3,x0=sx(pu[a]),y0=sy(pv[a]),x1=sx(pu[a+1]),y1=sy(pv[a+1]),x2=sx(pu[a+2]),y2=sy(pv[a+2]);
  const area=(x1-x0)*(y2-y0)-(x2-x0)*(y1-y0);if(Math.abs(area)<1e-9)continue;
  const d0=pd[a],d1=pd[a+1],d2=pd[a+2];
  const minX=Math.max(0,Math.ceil(Math.min(x0,x1,x2)-.5)),maxX=Math.min(W-1,Math.floor(Math.max(x0,x1,x2)-.5));
  const minY=Math.max(0,Math.ceil(Math.min(y0,y1,y2)-.5)),maxY=Math.min(H-1,Math.floor(Math.max(y0,y1,y2)-.5));
  for(let y=minY;y<=maxY;y++){const py=y+.5;for(let x=minX;x<=maxX;x++){const px=x+.5;
   const w0=((x1-px)*(y2-py)-(x2-px)*(y1-py))/area,w1=((x2-px)*(y0-py)-(x0-px)*(y2-py))/area,w2=1-w0-w1;
   if(w0<-1e-7||w1<-1e-7||w2<-1e-7)continue;const d=w0*d0+w1*d1+w2*d2,k=y*W+x;if(d<depth[k]){depth[k]=d;tri[k]=tid(t);}}}
 }
 const EPS=.02;
 /** Visible when, at the point or a pixel beside it, nothing nearer covers it (or what covers it is its own face). */
 const visible=(px,py,d,faces)=>{const ix=Math.floor(px),iy=Math.floor(py);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=ix+dx,y=iy+dy;if(x<0||y<0||x>=W||y>=H)return true;const k=y*W+x;
   if(tri[k]<0||depth[k]>=d-EPS||(faces&&faces.includes(tri[k])))return true;}
  return false;};
 const D=V.D,out={outline:[],detail:[],marking:[]};
 const MP=model.P,mu=i=>dot(V.U,MP[i*3],MP[i*3+1],MP[i*3+2]),mv=i=>dot(V.V,MP[i*3],MP[i*3+1],MP[i*3+2]),md=i=>dot(V.D,MP[i*3],MP[i*3+1],MP[i*3+2]);
 for(const e of edges){
  let sil=false;if(!e.crease){let pos=false,neg=false;for(const f of e.f){const s=N[f*3]*D[0]+N[f*3+1]*D[1]+N[f*3+2]*D[2];if(s>1e-6)pos=true;else neg=true;}sil=pos&&neg;}   // a face seen edge-on counts as turned away: a flat bottom's edge is an outline
  if(!e.crease&&!sil)continue;
  const A=e.a,B=e.b;let t0=0,t1=1;
  if(clip){const da=side(MP[A*3],MP[A*3+1],MP[A*3+2]),db=side(MP[B*3],MP[B*3+1],MP[B*3+2]);if(da<0&&db<0)continue;if(da<0)t0=da/(da-db);if(db<0)t1=da/(da-db);}
  const U0=mu(A)+(mu(B)-mu(A))*t0,V0=mv(A)+(mv(B)-mv(A))*t0,D0=md(A)+(md(B)-md(A))*t0,U1=mu(A)+(mu(B)-mu(A))*t1,V1=mv(A)+(mv(B)-mv(A))*t1,D1=md(A)+(md(B)-md(A))*t1;
  const ax=sx(U0),ay=sy(V0),bx=sx(U1),by=sy(V1),len=Math.hypot(bx-ax,by-ay),n=Math.max(1,Math.ceil(len/.7));
  let run=null;const list=e.f.every(f=>mark[f])?out.marking:sil||e.f.length===1?out.outline:out.detail;
  for(let i=0;i<=n;i++){const t=i/n,px=ax+(bx-ax)*t,py=ay+(by-ay)*t,d=D0+(D1-D0)*t;
   if(visible(px,py,d,e.f)){if(run===null)run=t;if(i===n)list.push(seg(run,1));}
   else if(run!==null){list.push(seg(run,(i-1)/n));run=null;}}
  function seg(ta,tb){return [U0+(U1-U0)*ta,V0+(V1-V0)*ta,U0+(U1-U0)*tb,V0+(V1-V0)*tb];}
 }
 /** Tests a 3D polyline (a mooring line) against the depth buffer: its visible and hidden runs. */
 const polyline=(pts,step=.05)=>{const vis=[],hid=[];
  for(let s=0;s+1<pts.length;s++){const a=pts[s],b=pts[s+1],L=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]),n=Math.max(1,Math.ceil(L/step));let run=null,state=null;
   const at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
   for(let i=0;i<=n;i++){const p=at(i/n),u=dot(V.U,...p),v=dot(V.V,...p),d=dot(V.D,...p),seen=visible(sx(u),sy(v),d,null);
    if(state===null){state=seen;run=i/n;}else if(seen!==state||i===n){const q0=at(run),q1=at(i/n);(state?vis:hid).push([dot(V.U,...q0),dot(V.V,...q0),dot(V.U,...q1),dot(V.V,...q1)]);state=seen;run=i/n;}}}
  return {vis,hid};};
 return {outline:merge(out.outline),detail:merge(out.detail),marking:merge(out.marking),cut:merge(cut.map(([a,b])=>[dot(V.U,...a),dot(V.V,...a),dot(V.U,...b),dot(V.V,...b)])),bounds:{u0:u0+.2,u1:u1-.2,v0:v0+.2,v1:v1-.2},polyline,project:p=>[dot(V.U,...p),dot(V.V,...p)]};
}

/** Joins collinear, touching pieces into one line and drops duplicates (1 mm). */
function merge(segs){
 const groups=new Map();
 for(const s of segs){let [x0,y0,x1,y1]=s;const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy);if(L<.002)continue;
  let ux=dx/L,uy=dy/L;if(ux<-1e-9||(Math.abs(ux)<=1e-9&&uy<0)){ux=-ux;uy=-uy;}
  const ang=Math.round(Math.atan2(uy,ux)*2000),c=Math.round((-uy*x0+ux*y0)*1000),key=ang+'|'+c;
  const t0=ux*x0+uy*y0,t1=ux*x1+uy*y1;let g=groups.get(key);if(!g){g={ux,uy,c:-uy*x0+ux*y0,iv:[]};groups.set(key,g);}g.iv.push([Math.min(t0,t1),Math.max(t0,t1)]);}
 const out=[];
 for(const g of groups.values()){g.iv.sort((a,b)=>a[0]-b[0]);let cur=null;
  const emit=([a,b])=>out.push([g.ux*a-g.uy*g.c,g.uy*a+g.ux*g.c,g.ux*b-g.uy*g.c,g.uy*b+g.ux*g.c]);
  for(const iv of g.iv){if(cur&&iv[0]<=cur[1]+.001)cur[1]=Math.max(cur[1],iv[1]);else{if(cur)emit(cur);cur=[...iv];}}if(cur)emit(cur);}
 return out;
}

// ------------------------------------------------------------------ the sheet: one display list → SVG and DXF
const A1={w:841,h:594};
function sheet(){
 const items=[];
 return {items,
  line:(x1,y1,x2,y2,layer)=>items.push({k:'line',x1,y1,x2,y2,layer}),
  poly:(pts,layer,closed=false)=>items.push({k:'poly',pts,layer,closed}),
  circle:(x,y,r,layer)=>items.push({k:'circle',x,y,r,layer}),
  text:(x,y,s,h,layer='TEXT',o={})=>items.push({k:'text',x,y,s:String(s),h,layer,anchor:o.anchor||'start',rot:o.rot||0,bold:!!o.bold}),
  image:(x,y,w,h,href)=>items.push({k:'image',x,y,w,h,href}),
 };
}
/** Line weights (mm) and colours by layer, as a CAD office's pen table. */
const LAYERS={
 'OUTLINE':{w:.35,c:'#1d2326',aci:7},'CUT':{w:.6,c:'#1d2326',aci:7},'RESOLVED':{w:.35,c:'#2f7a4a',aci:3},'RESOLVED-TEXT':{w:0,c:'#2f7a4a',aci:3},'ROOM':{w:0,c:'#4a5a5d',aci:8},'SEAT':{w:.3,c:'#24585c',aci:4},'SEAT-TEXT':{w:0,c:'#24585c',aci:4},'MARKING':{w:.1,c:'#4f7d84',aci:4,dash:'1.2 .8'},'DETAIL':{w:.13,c:'#1d2326',aci:8},'FRAME':{w:.5,c:'#1d2326',aci:7},'THIN':{w:.18,c:'#1d2326',aci:7},
 'CENTRE':{w:.18,c:'#2f6f74',aci:4,dash:'6 1.5 1 1.5'},'WATERLINE':{w:.25,c:'#2f6f74',aci:4,dash:'5 2'},'DIM':{w:.13,c:'#1d2326',aci:3},
 'TEXT':{w:0,c:'#1d2326',aci:7},'PIER':{w:.25,c:'#6d5a3a',aci:42,dash:'3 1.2'},'SECTION':{w:.35,c:'#6d5a3a',aci:42},'HATCH':{w:.1,c:'#6d5a3a',aci:42},'ROPE':{w:.3,c:'#7a6a36',aci:42},
 'MARKUP':{w:.35,c:'#c0302a',aci:1},'MARKUP-HIDDEN':{w:.3,c:'#c0302a',aci:1,dash:'2.5 1.5'},'MARKUP-TEXT':{w:0,c:'#c0302a',aci:1},
};
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function toSVG(sh,title){
 const byLayer=new Map(),rest=[];
 for(const it of sh.items){
  if(it.k==='line'){const d=`M${r2(it.x1)} ${r2(it.y1)}L${r2(it.x2)} ${r2(it.y2)}`;(byLayer.get(it.layer)||byLayer.set(it.layer,[]).get(it.layer)).push(d);}
  else if(it.k==='poly'){const d='M'+it.pts.map(p=>r2(p[0])+' '+r2(p[1])).join('L')+(it.closed?'Z':'');(byLayer.get(it.layer)||byLayer.set(it.layer,[]).get(it.layer)).push(d);}
  else rest.push(it);}
 let body='';
 for(const [layer,ds] of byLayer){const L=LAYERS[layer];body+=`<path data-layer="${layer}" fill="none" stroke="${L.c}" stroke-width="${L.w}" stroke-linecap="round" stroke-linejoin="round"${L.dash?` stroke-dasharray="${L.dash}"`:''} d="${ds.join('')}"/>\n`;}
 for(const it of rest){const L=LAYERS[it.layer]||LAYERS.TEXT;
  if(it.k==='circle')body+=`<circle data-layer="${it.layer}" cx="${r2(it.x)}" cy="${r2(it.y)}" r="${r2(it.r)}" fill="${it.layer.startsWith('MARKUP')?'#fff':'none'}" stroke="${L.c}" stroke-width="${L.w}"${L.dash?` stroke-dasharray="${L.dash}"`:''}/>\n`;
  else if(it.k==='text')body+=`<text data-layer="${it.layer}" x="${r2(it.x)}" y="${r2(it.y)}" font-size="${it.h}" fill="${L.c}" text-anchor="${it.anchor}"${it.bold?' font-weight="bold"':''}${it.rot?` transform="rotate(${it.rot} ${r2(it.x)} ${r2(it.y)})"`:''}>${esc(it.s)}</text>\n`;
  else if(it.k==='image')body+=`<image x="${r2(it.x)}" y="${r2(it.y)}" width="${r2(it.w)}" height="${r2(it.h)}" href="${it.href}" preserveAspectRatio="xMidYMid meet"/>\n`;}
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${A1.w}mm" height="${A1.h}mm" viewBox="0 0 ${A1.w} ${A1.h}" font-family="Helvetica, Arial, 'WenQuanYi Zen Hei', sans-serif">
<title>${esc(title)}</title><rect width="${A1.w}" height="${A1.h}" fill="#fbfaf6"/>
${body}</svg>\n`;
}
/** AutoCAD R12 ASCII DXF, millimetres at sheet size (the views at the scales printed under them). */
function toDXF(sh){
 const o=[],g=(c,v)=>o.push(String(c),String(v)),Y=y=>r2(A1.h-y);
 const ascii=s=>[...s].map(c=>c.charCodeAt(0)<128?c:'\\U+'+c.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')).join('');
 g(0,'SECTION');g(2,'HEADER');g(9,'$ACADVER');g(1,'AC1009');g(9,'$EXTMIN');g(10,0);g(20,0);g(9,'$EXTMAX');g(10,A1.w);g(20,A1.h);g(0,'ENDSEC');
 g(0,'SECTION');g(2,'TABLES');
 const types=[['CONTINUOUS','Solid',[]],['DASHED','Dashed',[3,-1.5]],['CENTER','Centre',[6,-1.5,1,-1.5]]];
 g(0,'TABLE');g(2,'LTYPE');g(70,types.length);
 for(const [n,d,p] of types){g(0,'LTYPE');g(2,n);g(70,0);g(3,d);g(72,65);g(73,p.length);g(40,p.reduce((a,b)=>a+Math.abs(b),0));for(const x of p)g(49,x);}
 g(0,'ENDTAB');g(0,'TABLE');g(2,'LAYER');g(70,Object.keys(LAYERS).length);
 for(const [n,L] of Object.entries(LAYERS)){g(0,'LAYER');g(2,n);g(70,0);g(62,L.aci);g(6,L.dash?(n==='CENTRE'?'CENTER':'DASHED'):'CONTINUOUS');}
 g(0,'ENDTAB');g(0,'ENDSEC');g(0,'SECTION');g(2,'ENTITIES');
 for(const it of sh.items){
  if(it.k==='line'){g(0,'LINE');g(8,it.layer);g(10,r2(it.x1));g(20,Y(it.y1));g(30,0);g(11,r2(it.x2));g(21,Y(it.y2));g(31,0);}
  else if(it.k==='poly'){const pts=it.closed?[...it.pts,it.pts[0]]:it.pts;for(let i=0;i+1<pts.length;i++){g(0,'LINE');g(8,it.layer);g(10,r2(pts[i][0]));g(20,Y(pts[i][1]));g(30,0);g(11,r2(pts[i+1][0]));g(21,Y(pts[i+1][1]));g(31,0);}}
  else if(it.k==='circle'){g(0,'CIRCLE');g(8,it.layer);g(10,r2(it.x));g(20,Y(it.y));g(30,0);g(40,r2(it.r));}
  else if(it.k==='text'){const j=it.anchor==='middle'?1:it.anchor==='end'?2:0;g(0,'TEXT');g(8,it.layer);g(10,r2(it.x));g(20,Y(it.y));g(30,0);g(40,r2(it.h*.72));g(1,ascii(it.s));if(it.rot)g(50,-it.rot);
   if(j){g(72,j);g(11,r2(it.x));g(21,Y(it.y));g(31,0);}}
 }
 g(0,'ENDSEC');g(0,'EOF');return o.join('\n')+'\n';
}

// ------------------------------------------------------------------ drawing helpers
const CHAR=.55;const tw=(s,h)=>[...s].reduce((w,c)=>w+(c.charCodeAt(0)>0x2e80?1:CHAR)*h,0);
function wrap(s,width,h){const words=s.split(' '),lines=[];let line='';for(const w of words){const t=line?line+' '+w:w;if(tw(t,h)>width&&line){lines.push(line);line=w;}else line=t;}if(line)lines.push(line);return lines;}
/** Places a view on the sheet: view metres → sheet millimetres at 1:scale, `datum` (view u, v) at (x, y). */
function place(sh,hl,scale,x,y,datum=[0,0]){
 const k=1000/scale,X=u=>x+(u-datum[0])*k,Y=v=>y-(v-datum[1])*k;
 for(const s of hl.marking)sh.line(X(s[0]),Y(s[1]),X(s[2]),Y(s[3]),'MARKING');
 for(const s of hl.detail)sh.line(X(s[0]),Y(s[1]),X(s[2]),Y(s[3]),'DETAIL');
 for(const s of hl.outline)sh.line(X(s[0]),Y(s[1]),X(s[2]),Y(s[3]),'OUTLINE');
 for(const s of hl.cut||[])sh.line(X(s[0]),Y(s[1]),X(s[2]),Y(s[3]),'CUT');
 return {X,Y,k,box:{x0:X(hl.bounds.u0),x1:X(hl.bounds.u1),y0:Y(hl.bounds.v1),y1:Y(hl.bounds.v0)}};
}
function viewTitle(sh,x,y,s,scale){sh.text(x,y,s,4,'TEXT',{bold:true});const w=tw(s,4)*1.02;sh.line(x,y+1.3,x+w,y+1.3,'THIN');sh.line(x,y+2.1,x+w,y+2.1,'THIN');sh.text(x+w+4,y,'SCALE 1:'+scale,2.8);}
/** A dimension with arrowheads; vertical when x1 === x2. */
function dim(sh,x1,y1,x2,y2,label,off){
 const vert=Math.abs(x1-x2)<1e-6,nx=vert?off:0,ny=vert?0:off,ax=x1+nx,ay=y1+ny,bx=x2+nx,by=y2+ny,s=Math.sign(off)||1;
 sh.line(x1+(vert?s*1:0),y1+(vert?0:s*1),ax+(vert?s*1.5:0),ay+(vert?0:s*1.5),'DIM');sh.line(x2+(vert?s*1:0),y2+(vert?0:s*1),bx+(vert?s*1.5:0),by+(vert?0:s*1.5),'DIM');
 sh.line(ax,ay,bx,by,'DIM');
 const L=Math.hypot(bx-ax,by-ay),ux=(bx-ax)/L,uy=(by-ay)/L;
 for(const [px,py,d] of [[ax,ay,1],[bx,by,-1]])sh.poly([[px+d*ux*2.2-uy*.6,py+d*uy*2.2+ux*.6],[px,py],[px+d*ux*2.2+uy*.6,py+d*uy*2.2-ux*.6]],'DIM');
 if(vert)sh.text(ax-1.2*s+(s<0?0:0),(ay+by)/2,label,2.5,'TEXT',{anchor:'middle',rot:-90});else sh.text((ax+bx)/2,ay-1.2,label,2.5,'TEXT',{anchor:'middle'});
}
/** A level mark: a small triangle on a line, with its figure. */
function level(sh,x,y,label,len=14){sh.line(x,y,x+len,y,'DIM');sh.poly([[x+2,y],[x+3.2,y-2],[x+.8,y-2]],'DIM',true);sh.text(x+4,y-.9,label,2.2);}
/** A numbered balloon with a leader to (tx, ty). */
function balloon(sh,x,y,n,tx,ty,ok=false){const L=ok?'RESOLVED':'MARKUP';sh.circle(x,y,3.4,L);sh.text(x,y+1.25,n,3.4,L+'-TEXT',{anchor:'middle',bold:true});
 if(tx!==undefined){const d=Math.hypot(tx-x,ty-y);if(d>3.6){sh.line(x+(tx-x)/d*3.4,y+(ty-y)/d*3.4,tx,ty,L);sh.circle(tx,ty,.6,L);}}}
function frameAndTitle(sh,{no,title,subtitle,sheetNo,scales,notes}){
 const {w,h}=A1;sh.poly([[10,10],[w-10,10],[w-10,h-10],[10,h-10]],'FRAME',true);sh.poly([[5,5],[w-5,5],[w-5,h-5],[5,h-5]],'THIN',true);
 const cols=8,rows=6;
 for(let i=0;i<cols;i++){const x=10+(w-20)*(i+.5)/cols;sh.text(x,8.6,String.fromCharCode(65+i),2.5,'TEXT',{anchor:'middle'});sh.text(x,h-6.4,String.fromCharCode(65+i),2.5,'TEXT',{anchor:'middle'});if(i){const xl=10+(w-20)*i/cols;sh.line(xl,5,xl,10,'THIN');sh.line(xl,h-10,xl,h-5,'THIN');}}
 for(let i=0;i<rows;i++){const y=10+(h-20)*(i+.5)/rows;sh.text(7.5,y+1,i+1,2.5,'TEXT',{anchor:'middle'});sh.text(w-7.5,y+1,i+1,2.5,'TEXT',{anchor:'middle'});if(i){const yl=10+(h-20)*i/rows;sh.line(5,yl,10,yl,'THIN');sh.line(w-10,yl,w-5,yl,'THIN');}}
 // The title block, 180 × 56 mm at the bottom right.
 const bx=w-10-180,by=h-10-56,cell=(x,y,cw,ch,label,value,size=3)=>{sh.poly([[bx+x,by+y],[bx+x+cw,by+y],[bx+x+cw,by+y+ch],[bx+x,by+y+ch]],'THIN',true);sh.text(bx+x+1.5,by+y+3,label,1.8);
  (Array.isArray(value)?value:[value]).forEach((v,i,a)=>sh.text(bx+x+1.5,by+y+ch-2-(a.length-1-i)*(size+1),v,i===a.length-1?size:2.4,'TEXT',{bold:i===a.length-1&&size>3.5}));};
 sh.poly([[bx,by],[bx+180,by],[bx+180,by+56],[bx,by+56]],'FRAME',true);
 cell(0,0,80,14,'YARD',['Johansson Shipyard, Innoshima','JOHANSSON SHIPYARD'],4);cell(80,0,62,14,'SHIP',['M/V MINATO MARU','hull No. 127, built 1994'],3);cell(142,0,38,14,'DRAWING No.',no,4.5);
 cell(0,14,142,16,'TITLE',[title,subtitle],3.6);cell(142,14,38,16,'SCALE',scales,3);
 cell(0,30,46,13,'SOURCE','tools/ferry-exterior-cad.mjs',2.3);cell(46,30,48,13,'DATA','buildFerryModel() as built',2.3);cell(94,30,48,13,'STATUS','AS-BUILT SURVEY',3);cell(142,30,38,13,'SHEET',sheetNo+' / 3',3.5);
 cell(0,43,46,13,'DRAWN','Claude, AI survey',2.6);cell(46,43,48,13,'CHECKED','owner review open',2.6);cell(94,43,48,13,'DATE',DATE,3);cell(142,43,38,13,'REV',REV+' · fixes, stair, saloon',2.6);
 if(notes?.length){const lines=notes.flatMap(n=>[...wrap(n,174,2.3),'']).slice(0,-1),nh=lines.length*3+7;sh.poly([[bx,by-nh-2],[bx+180,by-nh-2],[bx+180,by-2],[bx,by-2]],'THIN',true);sh.text(bx+1.5,by-nh+1,'NOTES',1.8);lines.forEach((l,i)=>sh.text(bx+1.5,by-nh+5+i*3,l,2.3));}
 sh.text(14,h-12.5,'AS-BUILT SURVEY OF THE GAME MODEL · Johansson World vessel · no flag, class or construction approval · drawn by projecting buildFerryModel() with hidden lines removed',2.2,'MARKUP-TEXT');
}

// ------------------------------------------------------------------ the survey: measurements the sheets and the problem list read
/** The Kitano-jima mooring lines in her frame, as createFerryRun lays them (bitt → fairlead → the pier's bitt). */
function kitanoLines(){
 const P=AIRPORT_FERRY_PORTS.airport,g=new THREE.Group();g.rotation.order='YXZ';g.position.set(P.berth[0],REST_Y,P.berth[1]);g.rotation.y=P.yaw;g.updateMatrixWorld(true);
 const iv=g.matrixWorld.clone().invert(),to=a=>new THREE.Vector3(...a).applyMatrix4(iv).toArray();
 const landing=to([AIRPORT_LANDING[0],P.height,AIRPORT_LANDING[1]]);
 const corner=(u,v,y)=>{const [x,z]=airportWorld(u,v);return to([x,y,z]);},Jt=AIRPORT_JETTY;
 const jc=[corner(Jt.minX,Jt.minZ,0),corner(Jt.maxX,Jt.maxZ,0)];
 const jetty={face:Math.min(jc[0][2],jc[1][2]),end:Math.max(jc[0][2],jc[1][2]),x0:Math.min(jc[0][0],jc[1][0]),x1:Math.max(jc[0][0],jc[1][0]),top:AIRPORT_PIER_HEIGHT-REST_Y,thickness:Jt.thickness};
 const C=AIRPORT_CARGO_SURFACE,ac=corner(C.minX,(Jt.minZ+Jt.maxZ)/2,0),asphalt=C.minX<Jt.maxX&&C.maxX>Jt.minX?{from:ac[2],top:C.y-REST_Y}:null;
 return {landing,pierTop:P.height-REST_Y,jetty,asphalt,lines:FERRY_MOORINGS.airport.map(l=>({id:l.id,name:l.name,station:l.station,pts:[[...FERRY_MOORING.bitts[l.bitt||l.station]],[...FERRY_MOORING.fairleads[l.lead||l.station]],to(l.pier)]}))};
}
/** Minato's lines in her frame, alongside the outer pier. */
function townLines(){
 const P=AIRPORT_FERRY_PORTS.town,g=new THREE.Group();g.rotation.order='YXZ';g.position.set(P.berth[0],REST_Y,P.berth[1]);g.rotation.y=P.yaw;g.updateMatrixWorld(true);
 const iv=g.matrixWorld.clone().invert(),to=a=>new THREE.Vector3(...a).applyMatrix4(iv).toArray();
 return FERRY_MOORINGS.town.map(l=>({id:l.id,name:l.name,station:l.station,pts:[[...FERRY_MOORING.bitts[l.bitt||l.station]],[...FERRY_MOORING.fairleads[l.lead||l.station]],to(l.pier)]}));
}
/** Where a line goes through her: the faces it pierces (with the mesh), and the spaces of FERRY_GA it passes. */
function pierce(model3d,pts){
 const ray=new THREE.Raycaster(),hits=[],spaces=[];
 for(let s=0;s+1<pts.length;s++){const a=new THREE.Vector3(...pts[s]),b=new THREE.Vector3(...pts[s+1]),dir=b.clone().sub(a),L=dir.length();dir.normalize();
  ray.set(a,dir);ray.far=L-.15;ray.near=0;const ends=pts.slice(0,2).map(q=>new THREE.Vector3(...q));
  for(const h of ray.intersectObject(model3d,true)){if(!h.object.isMesh||ends.some(e=>e.distanceTo(h.point)<=.25))continue;hits.push({at:h.point.toArray().map(r2),mesh:h.object.name,along:r2(h.distance+(s?pts.slice(0,s).reduce((d,p,i)=>d+Math.hypot(...p.map((c,k)=>pts[i+1][k]-c)),0):0))});}
  const n=Math.ceil(L/.1);for(let i=0;i<=n;i++){const p=a.clone().lerp(b,i/n),Y=yard(p.toArray());
   for(const sp of FERRY_GA){if(Y.z>=sp.z[0]&&Y.z<=sp.z[1]&&Y.x>=sp.x[0]&&Y.x<=sp.x[1]&&Y.h>=sp.y[0]&&Y.h<=sp.y[1]){const last=spaces[spaces.length-1];if(last?.id===sp.id)last.to=r1(Y.z);else spaces.push({id:sp.id,from:r1(Y.z),to:r1(Y.z)});}}}}
 return {hits,spaces};
}
/** Her painted boards, painted and measured in Chromium by the game's own code (src/world/ferry-boards.js). */
async function measureCanvases(chromium){
 const b=await chromium.launch(),p=await b.newPage();
 await p.route('http://ferry.local/**',r=>{const path=new URL(r.request().url()).pathname;
  if(path==='/')return r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8">'});
  return r.fulfill({contentType:'text/javascript',body:readFileSync(join(ROOT,path))});});
 await p.goto('http://ferry.local/');
 const out=await p.evaluate(async()=>{
  const B=await import('/src/world/ferry-boards.js');
  const nb=document.createElement('canvas');nb.width=512;nb.height=128;const x=nb.getContext('2d');
  const L=B.paintNameBoard(x,[0,0,512,128]);
  // The gap between the names in this browser's fonts, and in Helvetica Bold (an iPad's sans-serif) for the English.
  x.font=`bold ${L.jp.size}px ${B.NAME_BOARD.jpFont}`;const jp=x.measureText(B.NAME_BOARD.jp).width;
  const helv=(.833+.278+.722+.722+.611+.778+.278+.833+.722+.722+.722)*B.NAME_BOARD.enSize;
  const Lh=B.nameBoardLayout(0,512,(t,size,font)=>font===B.NAME_BOARD.jpFont?jp*size/L.jp.size:helv*size/B.NAME_BOARD.enSize);
  const c=document.createElement('canvas');c.width=512;c.height=736;const G=B.paintLaneBoards(c.getContext('2d'));
  const lb=document.createElement('canvas');lb.width=512;lb.height=368;lb.getContext('2d').drawImage(c,0,368,512,368,0,0,512,368);
  return {board:{gap:L.en.x-(L.jp.x+L.jp.width),gapHelvetica:Lh.en.x-(Lh.jp.x+Lh.jp.width),scale:L.scale,jpEnd:L.jp.x+L.jp.width,enStart:L.en.x},
   lane:{truckSpan:G.truckSpan,dividers:G.dividers},pics:{name:nb.toDataURL('image/png'),lane:lb.toDataURL('image/png')}};
 });
 await b.close();return out;
}
// ------------------------------------------------------------------ build
async function main(){
 const noPdf=process.argv.includes('--no-pdf');mkdirSync(OUT,{recursive:true});
 const t0=Date.now(),log=s=>console.log(`[${((Date.now()-t0)/1000).toFixed(1)} s] ${s}`);
 const atSea=ship('sea'),kitano=ship('kitano');
 const prep=root=>{const s=soup(root);return {...s,...topology(s.P),root};};
 const A=prep(atSea),K=prep(kitano);log(`model: ${A.P.length/9} triangles at sea, ${K.P.length/9} alongside; ${A.edges.length} edges`);
 const view=(m,v)=>{const r=hiddenLine(m,v);log(`${v}: ${r.outline.length} outline + ${r.detail.length} detail lines`);return r;};
 const sea={starboard:view(A,'starboard'),port:view(A,'port'),plan:view(A,'plan'),bow:view(A,'bow'),stern:view(A,'stern')};
 const kit={starboard:view(K,'starboard'),plan:view(K,'plan'),bow:view(K,'bow')};

 // Survey figures from the geometry itself.
 const box=new THREE.Box3();atSea.traverseVisible(o=>{if(o.isMesh)box.expandByObject(o);});
 const length=l=>r2(l.pts.slice(1).reduce((d,p,i)=>d+Math.hypot(...p.map((c,k)=>c-l.pts[i][k])),0));
 const moor=kitanoLines(),lines=moor.lines.map(l=>({...l,...pierce(kitano,l.pts),length:length(l)}));
 const townRigged=townLines().map(l=>({...l,...pierce(atSea,l.pts),length:length(l)}));
 const minato=ship('minato'),ramp={kitano:rampClearance(kitano,moor),minato:rampClearance(minato,null)};
 const lane=laneBoardLayout();
 let canvases=null,chromium=null;
 if(!noPdf){const req=createRequire(import.meta.url);try{({chromium}=req(join(execSync('npm root -g').toString().trim(),'playwright')));}catch{({chromium}=await import('playwright'));}canvases=await measureCanvases(chromium);}
 const findings=buildFindings({lines,townRigged,lane,canvases,ramp,jetty:moor.jetty});
 const problems=findings;
 writeFileSync(join(OUT,'problems.json'),JSON.stringify({date:DATE,rev:REV,source:'tools/ferry-exterior-cad.mjs',heights:FERRY_HEIGHTS,ship:{length:FERRY_SHIP.length,beam:FERRY_SHIP.beam,draft:T,freeboard:FERRY_SHIP.freeboard},
  bounds:{min:box.min.toArray().map(r2),max:box.max.toArray().map(r2)},kitano:{pierTopAboveWL:r2(moor.pierTop),landing:moor.landing.map(r2),jetty:moor.jetty,asphalt:moor.asphalt,lines},minato:{lines:townRigged},
  ramp,laneBoard:lane,boards:canvases?{name:canvases.board,lane:canvases.lane}:null,findings},null,1)+'\n');

 // ---------------- Sheet X1: the exterior as built, at sea, 1:100.
 const s1=sheet(),S=100;
 const pr=place(s1,sea.starboard,S,232,181);   // amidships, waterline
 const pl=place(s1,sea.plan,S,232,282);
 const po=place(s1,sea.port,S,232,506);
 const bw=place(s1,sea.bow,S,506,181),st=place(s1,sea.stern,S,612,181);
 const WLS=[[pr,-17.6,18.2],[po,-18.2,17.6],[bw,-4.8,4.8],[st,-4.8,4.8]];
 for(const [v,a,b] of WLS){s1.line(v.X(a),v.Y(0),v.X(b),v.Y(0),'WATERLINE');s1.text(v.X(b)+1,v.Y(0)+1,'DWL',2.2);}
 s1.line(pl.X(-18),pl.Y(0),pl.X(18.4),pl.Y(0),'CENTRE');s1.text(pl.X(18.4)+1,pl.Y(0)+1,'CL',2.2);
 for(const v of [bw,st]){s1.line(v.X(0),v.Y(-2.6),v.X(0),v.Y(16.8),'CENTRE');}
 // Levels at the right of the profile and the frame scale under it (shipyard z from the transom, frames at 500 mm).
 const lev=[['DWL',0],['CAR DECK',FERRY_HEIGHTS.carDeck-T],['PASSENGER DECK',FERRY_HEIGHTS.passengerDeck-T],['BRIDGE DECK',FERRY_HEIGHTS.bridgeDeck-T],['COMPASS DECK',FERRY_HEIGHTS.compassDeck-T],['MAST TOP',r2(box.max.y)]];
 for(const [n,y] of lev){level(s1,pr.X(18.6),pr.Y(y),`${n} ${r2(y+T).toFixed(2)} ABL`,30);}
 level(s1,pr.X(18.6),pr.Y(-T),`BASE LINE 0.00`,30);
 const scale=(v,yy,dir)=>{for(let z=0;z<=34.5+1e-9;z+=.5){const x=v.X(dir*(z-HALF)),big=Math.abs(z%5)<1e-9;s1.line(x,yy,x,yy+(big?2.5:z%1?0.8:1.5),'THIN');if(big)s1.text(x,yy+5.2,'Fr '+(z*2),2,'TEXT',{anchor:'middle'});}s1.line(v.X(dir*-HALF),yy,v.X(dir*HALF),yy,'THIN');};
 scale(pr,pr.Y(-T)+4,1);scale(po,po.Y(-T)+4,-1);
 dim(s1,pr.X(-HALF),pr.Y(-T)+14,pr.X(HALF),pr.Y(-T)+14,`LOA ${FERRY_SHIP.length.toFixed(1)} m`,0);
 dim(s1,bw.X(-FERRY_SHIP.beam/2),bw.Y(-T)+6,bw.X(FERRY_SHIP.beam/2),bw.Y(-T)+6,`B ${FERRY_SHIP.beam.toFixed(1)} m`,0);
 dim(s1,pr.X(-HALF)-6,pr.Y(0),pr.X(-HALF)-6,pr.Y(-T),`T ${T.toFixed(1)}`,0);
 dim(s1,pr.X(-HALF)-6,pr.Y(FERRY_HEIGHTS.carDeck-T),pr.X(-HALF)-6,pr.Y(0),`f ${FERRY_SHIP.freeboard.toFixed(1)}`,0);
 dim(s1,pr.X(-HALF)-14,pr.Y(box.max.y),pr.X(-HALF)-14,pr.Y(-T),`${r2(box.max.y+T).toFixed(1)} m keel to mast top`,0);
 viewTitle(s1,pr.X(-HALF),pr.Y(-T)+25,VIEWS.starboard.title+' · ramp raised, at sea',S);
 viewTitle(s1,pl.X(-HALF),pl.Y(-5)+8,VIEWS.plan.title+' · port side up',S);
 dim(s1,po.X(HALF),po.Y(-T)+14,po.X(-HALF),po.Y(-T)+14,`LOA ${FERRY_SHIP.length.toFixed(1)} m · bow to the left`,0);
 viewTitle(s1,po.X(-HALF),po.Y(-T)+25,VIEWS.port.title+' · gangway door and gate in her side',S);
 viewTitle(s1,bw.X(-4.6),bw.Y(-T)+18,'BOW',S);s1.text(bw.X(-4.6),bw.Y(-T)+23,'looking aft · port on the right',2.4);
 viewTitle(s1,st.X(-4.6),st.Y(-T)+18,'STERN',S);s1.text(st.X(-4.6),st.Y(-T)+23,'looking forward · starboard on the right',2.4);
 // Particulars, from the ship's data (ferry-ship.js) and measured off the model.
 {const x=666,y0=40,rows=[['Length overall',FERRY_SHIP.length.toFixed(2)+' m'],['Length between perpendiculars',FERRY_SHIP.lengthBP.toFixed(2)+' m'],['Breadth moulded',FERRY_SHIP.beam.toFixed(2)+' m'],['Depth to car deck',FERRY_SHIP.depth.toFixed(2)+' m'],['Draft, laden',T.toFixed(2)+' m'],['Freeboard to car deck',FERRY_SHIP.freeboard.toFixed(2)+' m'],
  ['Car deck / passenger deck',`${FERRY_HEIGHTS.carDeck.toFixed(1)} / ${FERRY_HEIGHTS.passengerDeck.toFixed(1)} m ABL`],['Bridge deck / compass deck',`${FERRY_HEIGHTS.bridgeDeck.toFixed(1)} / ${FERRY_HEIGHTS.compassDeck.toFixed(1)} m ABL`],['Mast top in the data / as modelled',`${FERRY_HEIGHTS.mastTop.toFixed(1)} / ${r2(box.max.y+T).toFixed(2)} m ABL`],
  ['Bow ramp',`leaf ${FERRY_RAMP.leaf} m, flap ${FERRY_RAMP.flap} m, ${FERRY_RAMP.width} m over girders`],['Model extent, x (port +)',`${r2(box.min.x)} to ${r2(box.max.x)} m`],['Model extent, z (fwd +)',`${r2(box.min.z)} to ${r2(box.max.z)} m`]];
  s1.text(x,y0,'PRINCIPAL PARTICULARS',3.2,'TEXT',{bold:true});rows.forEach(([a,b],i)=>{s1.text(x,y0+7+i*4.6,a,2.4);s1.text(x+160,y0+7+i*4.6,b,2.4,'TEXT',{anchor:'end'});s1.line(x,y0+8.4+i*4.6,x+160,y0+8.4+i*4.6,'DETAIL');});}
 {const x=666,y0=118,leg=[['OUTLINE','Visible outline: silhouette and free edges'],['DETAIL','Visible feature edges (faces meeting at 50° or more)'],['MARKING','Paint: names, draft and load-line marks, red walkways'],['WATERLINE','Designed waterline, laden 1.9 m'],['CENTRE','Centreline']];
  s1.text(x,y0,'LINES',3.2,'TEXT',{bold:true});leg.forEach(([L,s],i)=>{s1.line(x,y0+6+i*5,x+16,y0+6+i*5,L);s1.text(x+20,y0+7+i*5,s,2.4);});}
 frameAndTitle(s1,{no:'JS-127-X1',title:'EXTERIOR AS BUILT · at sea, ramp raised',subtitle:'Profiles, plan, bow and stern from the game model',sheetNo:1,scales:['1:100','on A1'],
  notes:['Drawn from the game itself, not redrawn by hand: buildFerryModel() (src/world/ferry-model.js) is built in Node exactly as the game builds it; every visible triangle is projected orthographically and hidden lines are removed against a 10 mm depth buffer. What this sheet shows is what is modelled, including its faults.',
   'Heights ABL are above the base line (keel); the model frame is the laden waterline. Frames (Fr) at 500 mm from the transom. Glass is drawn opaque, as an elevation does. The people, mooring lines and the shore are not part of the ship and are not drawn here: see sheet X2.',
   'The DXF beside this sheet is the same drawing in millimetres at sheet size (layers OUTLINE, DETAIL, MARKING, WATERLINE, CENTRE, DIM, TEXT).']});

 // ---------------- Sheet X2: alongside Kitano-jima, the owner's screenshot: Rev A's problems and their state now.
 const s2=sheet(),kp=place(s2,kit.starboard,S,210,186),kl=place(s2,kit.plan,S,210,282),kb=place(s2,kit.bow,50,612,368);
 for(const [v,a,b] of [[kp,-17.6,24.5],[kb,-4.9,4.9]]){s2.line(v.X(a),v.Y(0),v.X(b),v.Y(0),'WATERLINE');s2.text(v.X(b)+1,v.Y(0)+1,'DWL',2.2);}
 s2.line(kl.X(-18),kl.Y(0),kl.X(27),kl.Y(0),'CENTRE');s2.line(kb.X(0),kb.Y(-2.4),kb.X(0),kb.Y(16.8),'CENTRE');
 // The Kitano-jima pier (airport-island.js AIRPORT_JETTY) in her frame: its face, deck and the cargo court's asphalt over its shore end.
 const J=moor.jetty;
 s2.poly([[kp.X(J.face),kp.Y(J.top)],[kp.X(J.end),kp.Y(J.top)]],'PIER');s2.poly([[kp.X(J.face),kp.Y(J.top)],[kp.X(J.face),kp.Y(J.top-J.thickness)],[kp.X(J.end),kp.Y(J.top-J.thickness)]],'PIER');
 s2.text(kp.X(J.end)+1,kp.Y(J.top)+1,'PIER',2.2);
 s2.poly([[kl.X(J.face),kl.Y(J.x0)],[kl.X(J.end),kl.Y(J.x0)],[kl.X(J.end),kl.Y(J.x1)],[kl.X(J.face),kl.Y(J.x1)]],'PIER',true);
 s2.text(kl.X(J.end)+1,kl.Y(J.x1)+3,'Kitano-jima pier',2.2);
 s2.line(kb.X(J.x0),kb.Y(J.top),kb.X(J.x1),kb.Y(J.top),'PIER');s2.text(kb.X(J.x1)+1,kb.Y(J.top)+1,'PIER DECK',2.2);
 for(const l of lines){const p=l.pts[2];s2.circle(kl.X(p[2]),kl.Y(p[0]),1.6,'PIER');}
 // The lines as rigged: through her where they pierce, red; seen, solid; behind or inside her, dashed.
 const ropeIn=(v,hl,pts,bad)=>{const {vis,hid}=hl.polyline(pts);
  for(const s of vis)s2.line(v.X(s[0]),v.Y(s[1]),v.X(s[2]),v.Y(s[3]),bad?'MARKUP':'ROPE');
  if(bad)for(const s of hid)s2.line(v.X(s[0]),v.Y(s[1]),v.X(s[2]),v.Y(s[3]),'MARKUP-HIDDEN');};
 for(const l of lines){const bad=l.hits.length>0;ropeIn(kp,kit.starboard,l.pts,bad);ropeIn(kl,kit.plan,l.pts,bad);ropeIn(kb,kit.bow,l.pts,bad);
  if(bad)for(const h of l.hits){const [x,y,z]=h.at;for(const [v,u,w] of [[kl,z,x],[kp,z,y]]){const X=v.X(u),Y=v.Y(w);s2.line(X-.9,Y-.9,X+.9,Y+.9,'MARKUP');s2.line(X-.9,Y+.9,X+.9,Y-.9,'MARKUP');}}}
 viewTitle(s2,kp.X(-HALF),kp.Y(-T)+12,'STARBOARD PROFILE · alongside Kitano-jima, ramp on the pier',S);
 viewTitle(s2,kl.X(-HALF),kl.Y(-5)+8,'PLAN · lines as rigged at Kitano-jima',S);
 viewTitle(s2,kb.X(-4.6),kb.Y(-T)+10,'BOW ELEVATION · as in the screenshot',50);s2.text(kb.X(-4.6),kb.Y(-T)+15.5,'looking aft from the pier · port on the right · lines as rigged',2.4);
 // Detail A: the ramp's toe on the pier, starboard profile, 1:50, with the pier in section.
 const DA={u0:16.6,u1:24.2,v0:.3,v1:3.1},da=placeWindow(s2,kit.starboard,50,488,496,DA);
 {const x0=Math.max(DA.u0,J.face),x1=Math.min(DA.u1,J.end),yt=J.top,yb=Math.max(DA.v0,J.top-J.thickness);
  s2.poly([[da.X(x1),da.Y(yt)],[da.X(x0),da.Y(yt)],[da.X(x0),da.Y(yb)],[da.X(x1),da.Y(yb)]],'SECTION');
  for(let c=da.X(x0)-40;c<da.X(x1);c+=2){const seg=clip([c,da.Y(yb),c+(da.Y(yb)-da.Y(yt)),da.Y(yt)],[da.X(x0),da.Y(yt),da.X(x1),da.Y(yb)]);if(seg)s2.line(...seg,'HATCH');}
  const asp=moor.asphalt;if(asp&&asp.from<x1)s2.poly([[da.X(Math.max(asp.from,x0)),da.Y(J.top)],[da.X(Math.max(asp.from,x0)),da.Y(asp.top)],[da.X(x1),da.Y(asp.top)]],'SECTION');
  const g=ramp.kitano,gz=g.at[2],gy=g.at[1],under=moor.asphalt&&gz>=moor.asphalt.from?moor.asphalt.top:J.top;
  s2.line(da.X(gz)-6,da.Y(under),da.X(gz)+2,da.Y(under),'DIM');s2.text(da.box.x0+12,da.box.y0+5,`The laid ramp’s lowest point is ${Math.abs(g.clear).toFixed(3)} m ${g.clear>=0?'clear of':'into'} what it lies on (the flap’s toe, on the asphalt); the girders now taper above the pier.`,2,g.clear>=0?'RESOLVED-TEXT':'MARKUP-TEXT');
  s2.text(da.X(J.face),da.Y(J.top-J.thickness)+4,'PIER, in section: deck '+r2(J.top+REST_Y).toFixed(2)+' m (world), '+J.thickness+' m thick; face '+r2(J.face-HALF).toFixed(2)+' m ahead of the stem',2.1);
  if(asp)s2.text(da.X(x1)-1,da.Y(asp.top)-5,'cargo court asphalt, +'+r2(asp.top-J.top).toFixed(2)+' over the pier',2,'TEXT',{anchor:'end'});}
 viewTitle(s2,488,da.box.y1+9,'DETAIL A · the ramp’s toe on the pier',50);
 {const x0=kp.X(DA.u0),x1=kp.X(DA.u1),y0=kp.Y(DA.v1),y1=kp.Y(DA.v0);s2.poly([[x0,y0],[x1,y0],[x1,y1],[x0,y1]],'MARKUP-HIDDEN',true);s2.text(x1+1,y1+3.5,'A',3,'MARKUP-TEXT',{bold:true});}
 // Balloons on the views and the problem list.
 const V={profile:kp,plan:kl,bow:kb,detail:da};
 for(const p of problems)for(const m of p.marks||[]){const v=V[m.view];if(v)balloon(s2,v.X(m.at[0])+m.off[0],v.Y(m.at[1])+m.off[1],p.n,v.X(m.at[0]),v.Y(m.at[1]),p.status==='resolved');}
 {let y=346;const x=20,w=455;s2.text(x,y,'FINDINGS · Rev A found them, Rev B fixed them; measured again from the game model',3.4,'TEXT',{bold:true});y+=2;
  for(const p of problems.filter(p=>p.sheet==='X2')){const ok=p.status==='resolved',found=wrap(p.found,w-14,2.1),fix=wrap('Rev B: '+p.fix,w-14,2.1),now=wrap('Now: '+p.now,w-14,2);
   if(y+8+(found.length+fix.length)*2.7+now.length*2.6>A1.h-16){s2.text(x,y+5,'… the rest are listed in problems.json and README.md',2.4);break;}
   balloon(s2,x+3.4,y+5,p.n,undefined,undefined,ok);s2.text(x+10,y+5.6,p.title,2.6,'TEXT',{bold:true});s2.text(x+w,y+5.6,ok?'RESOLVED':'OPEN',2.6,ok?'RESOLVED-TEXT':'MARKUP-TEXT',{anchor:'end',bold:true});y+=8.6;
   for(const l of found){s2.text(x+10,y,l,2.1);y+=2.7;}for(const l of fix){s2.text(x+10,y,l,2.1);y+=2.7;}for(const l of now){s2.text(x+10,y,l,2,ok?'RESOLVED-TEXT':'MARKUP-TEXT');y+=2.6;}y+=1.2;}}
 // The canvases as the code draws them, measured.
 if(canvases){const x=716,y=44;s2.text(x,y,'AS PAINTED',3.2,'TEXT',{bold:true});s2.text(x,y+4,'by the game’s own painters (src/world/ferry-boards.js)',2.1);
  s2.image(x,y+7,108,27,canvases.pics.name);
  wrap(`Name board (bridge front): ${r1(canvases.board.gap)} px between the names here, ${r1(canvases.board.gapHelvetica)} px in Helvetica Bold (an iPad). Finding 2.`,108,2.1).forEach((l,i)=>s2.text(x,y+39+i*2.8,l,2.1,'RESOLVED-TEXT'));
  s2.image(x+14,y+52,80,57.5,canvases.pics.lane);
  wrap(`Lane board, face to the quay: the truck spans ${canvases.lane.truckSpan.join('–')} px between the dividers at ${canvases.lane.dividers.map(d=>d.join('–')).join(' and ')} px. Finding 3.`,108,2.1).forEach((l,i)=>s2.text(x,y+114+i*2.8,l,2.1,'RESOLVED-TEXT'));}
 frameAndTitle(s2,{no:'JS-127-X2',title:'ALONGSIDE KITANO-JIMA · findings and fixes',subtitle:'The owner’s screenshot of 3 November 2026, surveyed again',sheetNo:2,scales:['1:100; bow, detail 1:50','on A1'],
  notes:['Her pose is the game’s: on her waterline at rest, the ramp laid on the Kitano-jima pier by restRamp(), the lines laid bitt → fairlead → pier bitt as createFerryRun lays them (FERRY_MOORINGS.airport). Green: found in Rev A and fixed, measured again. Red: still open. Red dashed: a faulty line where it is hidden inside or behind her; × where a line pierces a modelled face (none now).']});

 // ---------------- Sheet X3: the passenger accommodation and the crew stair, 1:50 (Rev B).
 const s3=sheet(),S3=50,PY=FERRY_HEIGHTS.passengerDeck-T,BY=FERRY_HEIGHTS.bridgeDeck-T,CY=FERRY_HEIGHTS.compassDeck-T,CS=FERRY_CREW_STAIR,SX=(CS.x[0]+CS.x[1])/2;
 const cutP=hiddenLine(A,'plan',{axis:1,value:PY+1.5,keep:-1}),cutB=hiddenLine(A,'plan',{axis:1,value:BY+1.5,keep:-1});
 const secA=hiddenLine(A,'port',{axis:0,value:SX,keep:-1}),secB=hiddenLine(A,'stern',{axis:2,value:18.9-HALF,keep:1});
 log(`sections: ${cutP.cut.length}, ${cutB.cut.length}, ${secA.cut.length}, ${secB.cut.length} cut lines`);
 const PW={u0:5.6-HALF,u1:23.7-HALF,v0:-4.55,v1:4.55};
 const pp=placeWindow(s3,cutP,S3,24,222,PW),bp=placeWindow(s3,cutB,S3,24,438,PW);
 const sa=placeWindow(s3,secA,S3,412,182,{u0:-(23.6-HALF),u1:-(15.3-HALF),v0:PY-.7,v1:CY+1.0});
 const sb=placeWindow(s3,secB,S3,412,420,{u0:-4.6,u1:4.6,v0:PY-.7,v1:CY+1.0});
 // Rooms named from the general arrangement, on their own deck's plan.
 for(const [v,deck] of [[pp,'passenger'],[bp,'bridge']])for(const sp of FERRY_GA.filter(sp=>sp.deck===deck)){
  const u=(sp.z[0]+sp.z[1])/2-HALF,w=(sp.x[0]+sp.x[1])/2;if(u<PW.u0+.5||u>PW.u1-.5||Math.abs(w)>4.3||sp.z[1]-sp.z[0]<1.4||sp.x[1]-sp.x[0]<.5)continue;
  const at=sp.id==='crew-stair'?[u,w-.75]:sp.id==='saloon'?[u+1.2,.0]:[u,w];
  v.sheet=s3;s3.text(v.X(at[0]),v.Y(at[1])-.6,sp.id.replace(/-/g,' ').toUpperCase(),2.1,'ROOM',{anchor:'middle',bold:true});
  if(sp.seats)s3.text(v.X(at[0]),v.Y(at[1])+2.4,sp.seats+' places',1.9,'ROOM',{anchor:'middle'});}
 // The seats anyone may take: S1 to S3.
 FERRY_PASSENGER_SEATS.forEach((p,i)=>{const u=p.position[2],w=p.position[0];s3.circle(pp.X(u),pp.Y(w),2.2,'SEAT');s3.text(pp.X(u),pp.Y(w)+.8,'S'+(i+1),2.1,'SEAT-TEXT',{anchor:'middle',bold:true});});
 // Dimensions: the saloon's rows and aisle; the stair's going, rise and width.
 {const R=FERRY_SALOON.rows;dim(s3,pp.X(R[3]),pp.Y(2.3),pp.X(R[4]),pp.Y(2.3),'0.88',-3);dim(s3,pp.X(R[0])-6,pp.Y(FERRY_SALOON.aisle),pp.X(R[0])-6,pp.Y(-FERRY_SALOON.aisle),'aisle 0.90',0);
  dim(s3,sa.X(-CS.foot),sa.Y(PY)+6,sa.X(-CS.head),sa.Y(PY)+6,`going ${(CS.head-CS.foot).toFixed(2)} · 13 × 0.20`,0);
  dim(s3,sa.X(-CS.foot)+8,sa.Y(BY),sa.X(-CS.foot)+8,sa.Y(PY),`rise ${(BY-PY).toFixed(2)} · 45°`,0);
  dim(s3,bp.X(CS.head)+4,bp.Y(CS.x[1]),bp.X(CS.head)+4,bp.Y(CS.x[0]),'0.80',0);
  for(const [v,y,n] of [[sa,PY,'PASSENGER DECK'],[sa,BY,'BRIDGE DECK'],[sa,CY,'COMPASS DECK'],[sb,PY,'PASSENGER DECK'],[sb,BY,'BRIDGE DECK']])level(s3,v.box.x1+1,v.Y(y),n+' '+(y+T).toFixed(2)+' ABL',22);}
 // Where the sections are taken, on the plans.
 for(const [v,u0,u1,w0,w1,lab] of [[pp,15.5-HALF,23.5-HALF,SX,SX,'A'],[bp,15.5-HALF,23.5-HALF,SX,SX,'A'],[pp,18.9-HALF,18.9-HALF,-4.4,4.4,'B'],[bp,18.9-HALF,18.9-HALF,-4.4,4.4,'B']]){
  s3.line(v.X(u0),v.Y(w0),v.X(u1),v.Y(w1),'CENTRE');s3.text(v.X(u1)+(u0===u1?0:2),v.Y(w1)+(u0===u1?-1.5:1),lab,3,'TEXT',{anchor:'middle',bold:true});}
 viewTitle(s3,24,232,'PASSENGER DECK · plan cut 1.5 m above it',S3);viewTitle(s3,24,448,'BRIDGE DECK · plan cut 1.5 m above it',S3);
 viewTitle(s3,412,192,'SECTION A–A · through the crew stair, looking to starboard',S3);viewTitle(s3,412,430,'SECTION B–B · through the saloon, looking forward',S3);
 // Findings 5 and 6, found and fixed with this work.
 for(const p of problems.filter(p=>p.sheet==='X3'))for(const m of p.marks||[]){const v={pplan:pp,bplan:bp}[m.view];if(v)balloon(s3,v.X(m.at[0])+m.off[0],v.Y(m.at[1])+m.off[1],p.n,v.X(m.at[0]),v.Y(m.at[1]),p.status==='resolved');}
 // What changed, and why.
 {let y=462;const x=24,w=370;s3.text(x,y,'WHAT CHANGED IN REV B · the owner, 3 November 2026',3.2,'TEXT',{bold:true});y+=5;
  const items=[
   ['Crew stair to the wheelhouse','“We need an interior stair case to the bridge as well.” A straight flight, 0.8 m clear, 13 risers of 0.2 m at 45°, in a trunk on the saloon’s starboard side behind a door marked 乗組員専用 (crew only); its well rises through the master’s cabin’s corner, walled off, into the wheelhouse’s aft starboard corner, railed, beside the starboard wing door (moved 0.85 m forward). The chart table moved to the aft bulkhead (finding 5); the master’s bunk to the corridor’s wall.'],
   ['A saloon to do nothing in','“The accommodation needs to be more cosy and comfortable, it should be fun to sit there and do nothing.” 34 reclining seats in terracotta moquette, 0.7 m a place, wooden arms, white head covers, five rows at 0.88 m facing the bow (finding 6), a 0.9 m aisle; a rose-brown carpet, cream curtains tied back at the side windows, a teak ledge under the bow windows, a pothos from Sakura.'],
   ['The carpet room','A round low table each side with zabuton, tea cups, pillows and folded blankets; the reading rack at the forward partition: the town paper (printed at Front-Row) and manga and paperbacks from Sakura.'],
   ['Seats you can take','S1 by the bow windows, S2 the port window seat, S3 a cushion in the carpet room: sit and she carries you across (game.js keeps a seat aboard in her frame).'],
   ['Places for 100',`Open deck 22 · lobby benches 6 (now counted) · carpet room 38 · saloon 34 = ${FERRY_GA.reduce((n,sp)=>n+(sp.seats||0),0)} passengers, as certified.`]];
  for(const [h,t] of items){s3.text(x,y,h,2.5,'TEXT',{bold:true});y+=3.2;for(const l of wrap(t,w,2.1)){s3.text(x,y,l,2.1);y+=2.75;}y+=1.4;}}
 {const x=640,y0=60,leg=[['CUT','Cut by the plane of the plan or section'],['OUTLINE','Visible outline beyond'],['DETAIL','Visible feature edges'],['MARKING','Paint and carpet edges'],['CENTRE','Where a section is taken']];
  s3.text(x,y0,'LINES',3.2,'TEXT',{bold:true});leg.forEach(([L,t],i)=>{s3.line(x,y0+6+i*5,x+16,y0+6+i*5,L);s3.text(x+20,y0+7+i*5,t,2.4);});
  s3.circle(x+8,y0+34,2.2,'SEAT');s3.text(x+8,y0+34.8,'S',2.1,'SEAT-TEXT',{anchor:'middle',bold:true});s3.text(x+20,y0+35,'A seat anyone may take',2.4);}
 frameAndTitle(s3,{no:'JS-127-X3',title:'ACCOMMODATION AND CREW STAIR',subtitle:'Passenger deck, bridge deck and two sections from the game model',sheetNo:3,scales:['1:50','on A1'],
  notes:['Plans are cut 1.5 m above their deck and sections through the plane marked, both from buildFerryModel() as the game builds it; what is cut is drawn heavy, what lies beyond in outline. Rooms are named from the general arrangement (src/world/ferry-ship.js FERRY_GA).']});

 const svg1=toSVG(s1,'Minato Maru · JS-127-X1 · exterior as built'),svg2=toSVG(s2,'Minato Maru · JS-127-X2 · alongside Kitano-jima, findings'),svg3=toSVG(s3,'Minato Maru · JS-127-X3 · accommodation and crew stair');
 const SHEETS=[['JS-127-X1-exterior',s1,svg1],['JS-127-X2-kitano-problems',s2,svg2],['JS-127-X3-accommodation',s3,svg3]];
 for(const [name,sh,svg] of SHEETS){writeFileSync(join(OUT,name+'.svg'),svg);writeFileSync(join(OUT,name+'.dxf'),toDXF(sh));}
 log('SVG and DXF written');
 if(!noPdf){
  const b=await chromium.launch(),p=await b.newPage();
  const html=`<!doctype html><meta charset="utf-8"><style>@page{size:841mm 594mm;margin:0}html,body{margin:0}svg{display:block;page-break-after:always}</style>${SHEETS.map(s=>s[2]).join('')}`;
  const tmp=join(OUT,'.print.html');writeFileSync(tmp,html);await p.goto(pathToFileURL(tmp).href);
  await p.pdf({path:join(OUT,'Minato_Maru_Exterior_CAD_RevB.pdf'),width:'841mm',height:'594mm',printBackground:true,preferCSSPageSize:true});
  for(const [name,,svg] of SHEETS){
   await p.setViewportSize({width:3364,height:2376});await p.setContent(`<!doctype html><meta charset="utf-8"><style>html,body{margin:0}svg{width:3364px;height:2376px;display:block}</style>${svg}`);
   await p.screenshot({path:join(OUT,name+'.png')});}
  await b.close();(await import('node:fs')).rmSync(tmp);log('PDF and PNG previews written');
 }
}

/** Liang–Barsky: the part of segment [x0,y0,x1,y1] inside the rectangle [xmin,ymin,xmax,ymax], or null. */
function clip(s,[xa,ya,xb,yb]){
 const [x0,y0,x1,y1]=s,dx=x1-x0,dy=y1-y0;let t0=0,t1=1;
 for(const [p,q] of [[-dx,x0-xa],[dx,xb-x0],[-dy,y0-ya],[dy,yb-y0]]){if(Math.abs(p)<1e-12){if(q<0)return null;continue;}const r=q/p;if(p<0){if(r>t1)return null;if(r>t0)t0=r;}else{if(r<t0)return null;if(r<t1)t1=r;}}
 return [x0+dx*t0,y0+dy*t0,x0+dx*t1,y0+dy*t1];
}
/** A detail: the part of a view inside window `w` (view metres) at 1:scale, its lower left corner at (x, y). */
function placeWindow(sh,hl,scale,x,y,w){
 const k=1000/scale,X=u=>x+(u-w.u0)*k,Y=v=>y-(v-w.v0)*k,box={x0:X(w.u0),x1:X(w.u1),y0:Y(w.v1),y1:Y(w.v0)};
 for(const [list,layer] of [[hl.marking,'MARKING'],[hl.detail,'DETAIL'],[hl.outline,'OUTLINE'],[hl.cut||[],'CUT']])for(const s of list){const c=clip([X(s[0]),Y(s[1]),X(s[2]),Y(s[3])],[box.x0,box.y0,box.x1,box.y1]);if(c)sh.line(...c,layer);}
 sh.poly([[box.x0,box.y0],[box.x1,box.y0],[box.x1,box.y1],[box.x0,box.y1]],'THIN',true);
 return {X,Y,k,box};
}
/**
 * How far the laid ramp, leaf and flap, is above what it lies over: Kitano-jima's pier stone, or the cargo court's
 * asphalt over its shore end (`moor`), or Minato's landing plate. Negative: into it.
 */
function rampClearance(model3d,moor){
 const ramp=model3d.userData.ramp,v=new THREE.Vector3();model3d.updateMatrixWorld(true);let worst={clear:Infinity,at:null};
 const under=(x,z)=>{if(moor){const J=moor.jetty;if(z<J.face||z>J.end||x<J.x0||x>J.x1)return null;return moor.asphalt&&z>=moor.asphalt.from?moor.asphalt.top:J.top;}
  return z>HALF?MINATO_BERTH.landing.top-REST_Y:null;};
 ramp.traverse(o=>{if(!o.isMesh)return;const pos=o.geometry.attributes.position;
  for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);const u=under(v.x,v.z);if(u===null)continue;const c=v.y-u;
   if(c<worst.clear)worst={clear:Math.round(c*1000)/1000,at:v.toArray().map(n=>Math.round(n*1000)/1000)};}});
 return worst;
}

/**
 * The findings: each problem found in the owner's screenshot (Rev A) or while fixing them (Rev B), what was done, and
 * its state now, measured again from the game model and its code.
 */
function buildFindings({lines,townRigged,lane,canvases,ramp,jetty}){
 const out=[];const add=f=>out.push({n:out.length+1,...f});
 const pierced=[...lines,...townRigged].reduce((n,l)=>n+l.hits.length,0),stbd=lines.find(l=>l.station==='fwdS')||lines[0];
 add({id:'kitano-aft-lines-through-ship',sheet:'X2',title:'At Kitano-jima the after spring and stern line ran through the ship',
  found:'Rev A: the aft station’s two lines were led from the port-quarter fairlead to pier bitts ahead of the bow: 37.88 and 37 m through the aft mooring station, casing P, the lower lobby and across the car deck (10 and 9 modelled faces), the yellow line in the screenshot. The Minato head line also bent in the air over the port bow house’s roof edge, clipping it.',
  fix:'each station keeps its own two ropes (ferry.js FERRY_MOORING.ropes); bow-on at Kitano-jima she makes fast from both bows only, each led through its stem fairlead to the bitts on its own side, the bosun at the starboard bow, the stern ropes coiled aft; Minato’s head line and forward spring lead through a new side chock on the bow house’s corner; the coils moved clear of the windlass drums.',
  status:pierced===0?'resolved':'open',now:`${pierced} modelled faces pierced by any laid line at Kitano-jima or Minato, ramp raised or laid (tests/ferry-exterior.test.mjs).`,
  marks:[{view:'plan',at:[(stbd.pts[1][2]+stbd.pts[2][2])/2,(stbd.pts[1][0]+stbd.pts[2][0])/2],off:[12,12]},{view:'bow',at:[-2.55,1.9],off:[-22,8]}]});
 const helv=(.833+.278+.722+.722+.611+.778+.278+.833+.722+.722+.722),gapH=canvases?.board.gapHelvetica,gap=canvases?.board.gap;
 add({id:'name-board-text-overlap',sheet:'X2',title:'The bridge name board’s two names ran into each other',
  found:'Rev A: みなと丸 and MINATO MARU were each centred on fixed points of the 512 px board (30% and 72%); in Helvetica Bold (an iPad) the English started at 238.7 px and 丸 ended at 263.5 px, about 25 px of overlap.',
  fix:'the names are laid out from their measured widths, centred as a pair with 30 px between them inside a 34 px margin, both shrinking together if a device’s font is wider (src/world/ferry-boards.js nameBoardLayout).',
  status:canvases?(Math.min(gap,gapH)>=20?'resolved':'open'):'unchecked',now:canvases?`${r1(gap)} px between the names in Chromium’s fonts, ${r1(gapH)} px in Helvetica Bold.`:'not measured (run without --no-pdf)',
  marks:[{view:'bow',at:[0,FERRY_HEIGHTS.bridgeDeck-T+2.3],off:[30,-10]}]});
 const [ta,tb]=lane.truckSpan,clearL=ta-lane.dividers[0][1],clearR=lane.dividers[1][0]-tb;
 add({id:'lane-board-truck-symbol',sheet:'X2',title:'The lane boards’ truck sign sat across a lane divider',
  found:'Rev A: the truck pictogram was drawn beside the middle arrow’s foot, its cab (x 326–348 px) across the divider (329–335 px), 0.18 m tall: from the quay it read as a stray “L” on the arrow. The dividers were 7 px off the middle between the lanes.',
  fix:'a larger truck under a shortened centre arrow, centred in its lane; the dividers midway between the lanes (src/world/ferry-boards.js laneBoardLayout).',
  status:Math.min(clearL,clearR)>=12?'resolved':'open',now:`the truck spans x ${ta}–${tb} px, ${clearL} and ${clearR} px clear of the dividers.`,
  marks:[{view:'bow',at:[-2.62,FERRY_HEIGHTS.carDeck-T+2.4+.06+1.56],off:[-24,-14]},{view:'bow',at:[2.62,FERRY_HEIGHTS.carDeck-T+2.4+.06+1.56],off:[26,-14]}]});
 add({id:'ramp-girders-into-pier',sheet:'X2',title:'The ramp’s side girders ran into the pier',
  found:'Rev A: the leaf’s two side girders, 0.5 m deep for its whole 4 m and square at the toe, ended 0.28 m inside the Kitano-jima pier deck and 0.33 m below Minato’s landing plate; the flap’s hinge pin sank 0.02 m into the landing.',
  fix:'the girders taper over the leaf’s last 2 m to the deck plate’s own depth at the toe, the plate’s underside eases up over its last 0.3 m, the flap’s hinge pin is flush with its underside, and the plate is 4.4 m clear between the girders.',
  status:Math.min(ramp.kitano.clear,ramp.minato.clear)>=-.002?'resolved':'open',now:`lowest point of the laid ramp ${ramp.kitano.clear.toFixed(3)} m over the Kitano-jima pier, ${ramp.minato.clear.toFixed(3)} m over Minato’s landing plate.`,
  marks:[{view:'detail',at:[ramp.kitano.at[2],ramp.kitano.at[1]],off:[16,-14]},{view:'profile',at:[ramp.kitano.at[2],ramp.kitano.at[1]],off:[12,14]}]});
 const chart=FERRY_INTERIOR.boxes.find(b=>b.name==='chart table'),cx=Math.max(Math.abs(chart.a[0]),Math.abs(chart.b[0]));
 add({id:'chart-table-blocks-wing-door',sheet:'X3',title:'The chart table stood in front of the starboard wing door',
  found:'Found in Rev B: the chart table (x −2.9 to −1.7, shipyard z 19.54–20.35) stood across the inside of the starboard wing door (z 19.6–20.4), so nobody could walk from the wheelhouse out to the starboard wing.',
  fix:'the chart table moved to the aft bulkhead under the fire-detection panel (x −1.95 to −1.0); the starboard wing door moved 0.85 m forward, where the crew stair arrives beside it.',
  status:cx<=2.42-.3?'resolved':'open',now:`the chart table ends ${(2.42-cx).toFixed(2)} m inboard of both wing doors’ ways in; walked in tests/ferry-walk.test.mjs.`,
  marks:[{view:'bplan',at:[(chart.a[2]+chart.b[2])/2,(chart.a[0]+chart.b[0])/2],off:[-10,14]}]});
 const front=Math.max(...FERRY_INTERIOR.boxes.filter(b=>b.name==='saloon seats').map(b=>b.b[2])),wall=FERRY_HOUSE.fore-.08;
 add({id:'saloon-front-row-through-wall',sheet:'X3',title:'The saloon’s front row stood out through the forward wall',
  found:'Found in Rev B: seven rows of three seats at 0.85 m did not fit the saloon: the front row stood 0.25 m out through the forward wall over the car deck (shipyard z 22.70–23.25 against the wall at 22.92), and the general arrangement claimed 42 seats where 36 fitted.',
  fix:'five rows at 0.88 m of four seats each side (two to starboard beside the crew stair), 34 seats; the lobby’s two benches are counted (6) and the carpet room carries 38, so she still has places for 100.',
  status:front<=wall+1e-6?'resolved':'open',now:`the front row ends ${((wall-front)).toFixed(2)} m short of the forward wall (tests/ferry-accommodation.test.mjs).`,
  marks:[{view:'pplan',at:[front,1.9],off:[10,-16]}]});
 return out;
}

await main();
