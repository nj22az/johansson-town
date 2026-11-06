import * as THREE from '../../vendor/three.module.js';
import {TUCK_R,unitToModel,headReach,dirAt,shapeScale} from './head-cover.js';
import {POLICE_UNIFORM,DUTY_BELT} from './police-data.js';
export {POLICE_UNIFORM,POLICE_PURPOSE,DUTY_BELT} from './police-data.js';

/** The police uniform's modelled pieces (its data, sources and reasons are police-data.js). */

const {smoothstep,lerp}=THREE.MathUtils;
const shade=(hex,f)=>'#'+new THREE.Color(hex).multiplyScalar(f).getHexString();

/** An indexed grid of rings (each `n` points round, closed) into a geometry, faces wound outward from `inside`. */
function ringsGeometry(rings,{closed=true,centre=null,flip=false}={}){
 const n=rings[0].length,pos=[],index=[];
 for(const ring of rings)for(const p of ring)pos.push(p.x,p.y,p.z);
 const cols=closed?n:n-1;
 for(let j=0;j+1<rings.length;j++)for(let i=0;i<cols;i++){
  const a=j*n+i,b=j*n+(i+1)%n,c=(j+1)*n+i,d=(j+1)*n+(i+1)%n;
  if(flip)index.push(a,b,c,b,d,c);else index.push(a,c,b,b,c,d);
 }
 if(centre){const ci=pos.length/3;pos.push(centre.x,centre.y,centre.z);const last=(rings.length-1)*n;
  for(let i=0;i<cols;i++){const a=last+i,b=last+(i+1)%n;if(flip)index.push(a,b,ci);else index.push(a,ci,b);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(index);g.computeVertexNormals();
 return g;
}
/**
 * Winds every triangle of g to face away from `inside(centroid)` (a point inside the shape there), so a piece built from
 * rings or sheets shows its outside whatever order its points came in.
 */
export function orient(g,inside){
 const P=g.attributes.position,I=g.index,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3(),e=new THREE.Vector3();
 for(let i=0;i<I.count;i+=3){a.fromBufferAttribute(P,I.getX(i));b.fromBufferAttribute(P,I.getX(i+1));c.fromBufferAttribute(P,I.getX(i+2));
  n.subVectors(b,a).cross(e.subVectors(c,a));const centre=a.clone().add(b).add(c).multiplyScalar(1/3);
  if(n.dot(centre.sub(inside(centre)))<0){const t=I.getX(i+1);I.setX(i+1,I.getX(i+2));I.setX(i+2,t);}}
 g.computeVertexNormals();return g;
}
/** Sets how much ink outline a part carries (1 is the body's full line). */
const ink=(piece,v)=>{piece.attributes.ink.array.fill(v);return piece;};
/** A quaternion turning +z to the direction n. */
const facing=n=>new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),n.clone().normalize());

/**
 * The fitted cap: everything in the head's unit space against the head and its tucked hair (headReach), then carried to
 * model space, so it sits on every head form with no gap at the forehead and nothing coming through at the sides.
 * Returns where its pieces are, for the hood that has to go over it and for tests.
 */
export function addPoliceCap(list,recipe,m,kit){
 const C=POLICE_UNIFORM.cap,col=C.colours,crown=recipe.outfit.hatColour,spec=kit.HAIR[recipe.hair.style]||null,flip=recipe.hair.flip;
 const N=28,[y0,y1]=C.band,U=v=>unitToModel(v,m),centre=new THREE.Vector3(0,m.headCentre,0),fromCentre=()=>centre;
 // `up`: the inside is below (a face that looks up); `down`: the inside is above.
 const down=p=>p.clone().add(new THREE.Vector3(0,1,0)),up=p=>p.clone().add(new THREE.Vector3(0,-1,0));
 // The band's line round the head: on the skin at the forehead, on the (tucked) hair elsewhere, a few millimetres out.
 let rh=[];for(let i=0;i<N;i++){const a=i/N*Math.PI*2,d=dirAt(a,y0),r=headReach(spec,d,1,flip,shapeScale(d,m))+C.gap;rh.push(r*Math.sqrt(1-y0*y0));}
 // Smoothed round, so the band is a clean ring, not a dent where the hairline meets the forehead.
 for(let k=0;k<3;k++)rh=rh.map((r,i)=>Math.max(r,(rh[(i+N-1)%N]+2*r+rh[(i+1)%N])/4));
 const ang=i=>i/N*Math.PI*2,P=(a,r,y)=>new THREE.Vector3(Math.sin(a)*r,y,Math.cos(a)*r);
 const top=a=>C.crownBack+(C.crownFront-C.crownBack)*(1+Math.cos(a))/2;
 // Band: straight up from its lower edge; inside it, a sweatband that closes the edge down onto the head.
 const bandRings=[rh.map((r,i)=>P(ang(i),r,y0)),rh.map((r,i)=>P(ang(i),r,y1))].map(ring=>ring.map(U));
 ink(kit.part(list,orient(ringsGeometry(bandRings),fromCentre),'head',col.band),1);
 const inner=rh.map((r,i)=>P(ang(i),r-C.gap-.03,y0+.02));
 kit.part(list,orient(ringsGeometry([rh.map((r,i)=>P(ang(i),r,y0)),inner].map(ring=>ring.map(U))),down),'head',col.band).attributes.ink.array.fill(0);
 // The crown: its side (まち) flares from the band's top to the welt, the front raised as the stiffened cap is; the top is
 // a shallow dome over it.
 const R=C.crownRadius,side=[];
 for(let s=1;s<=3;s++){const f=s/3,e=f**.8;side.push(rh.map((r,i)=>P(ang(i),r+(R-r)*e,y1+(top(ang(i))-y1)*f)));}
 const mid=(C.crownFront+C.crownBack)/2,dome=[];
 for(const rho of [.72,.36]){dome.push(rh.map((_,i)=>P(ang(i),R*rho,lerp(mid,top(ang(i)),rho)+C.dome*(1-rho*rho))));}
 const crownRings=[bandRings[1].map(p=>p.clone()),...side.map(r=>r.map(U)),...dome.map(r=>r.map(U))];
 ink(kit.part(list,orient(ringsGeometry(crownRings,{centre:U(new THREE.Vector3(0,mid+C.dome,0))}),fromCentre),'head',crown),1);
 // The welt round the top's edge, the crown's cloth a shade deeper.
 const welt=new THREE.CatmullRomCurve3(rh.map((_,i)=>U(P(ang(i),R+.005,top(ang(i))))),true);
 ink(kit.part(list,new THREE.TubeGeometry(welt,28,m.Rh*.026,3,true),'head',shade(crown,.82)),.35);
 // The visor: a crescent of black resin from the band's lower edge, forward and a little down, with a thickness, a
 // gloss across its top (where it catches the light, so it reads from the front) and its underside.
 const V=C.visor,J=3,I=14,visorTop=[],visorBottom=[];
 const bandR=a=>{const t=(((a/(Math.PI*2))%1)+1)%1*N,i=Math.floor(t)%N,f=t-Math.floor(t);return lerp(rh[i],rh[(i+1)%N],f);};
 for(let j=0;j<=J;j++){const t=j/J,rowT=[],rowB=[];
  for(let i=0;i<=I;i++){const a=-V.half+2*V.half*i/I,L=V.length*Math.pow(Math.max(0,1-(a/V.half)**2),.45),r0=bandR(a)-.03,th=V.thickness*(1-.4*t);
   const out=L*t*Math.cos(V.pitch),drop=L*t*Math.sin(V.pitch),y=y0+.012-drop;
   rowT.push(P(a,r0+out,y+th/2));rowB.push(P(a,r0+out,y-th/2));}
  visorTop.push(rowT);visorBottom.push(rowB);}
 const sheet=(rows,flip)=>{const pos=[],idx=[],n=rows[0].length;for(const row of rows)for(const p of row){const q=U(p);pos.push(q.x,q.y,q.z);}
  for(let j=0;j+1<rows.length;j++)for(let i=0;i+1<n;i++){const a=j*n+i,b=a+1,c=a+n,d=c+1;if(flip)idx.push(a,b,c,b,d,c);else idx.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;};
 // The top in three bands of rows, the middle one the gloss, so its edges run clean along the rows.
 for(const [from,to,colour] of [[0,1,col.visor],[1,2,col.gloss],[2,J,col.visor]])ink(kit.part(list,orient(sheet(visorTop.slice(from,to+1),false),up),'head',colour),1);
 ink(kit.part(list,orient(sheet(visorBottom,true),down),'head',col.under),1);
 // its rim, between the top and the underside
 {const pos=[],idx=[],rim=[...visorTop[J]],rimB=[...visorBottom[J]];
  for(let i=0;i<rim.length;i++){const a=U(rim[i]),b=U(rimB[i]);pos.push(a.x,a.y,a.z,b.x,b.y,b.z);}
  for(let i=0;i+1<rim.length;i++){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,c,b,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  ink(kit.part(list,orient(g,p=>new THREE.Vector3(0,p.y,0)),'head',col.visor),.3);}
 // The chin strap across the front of the band, from ear button to ear button.
 {const S=16,a0=1.42,ys=[y0+.055,y0+.125],rings=[];
  for(const [dy,dr] of [[0,.004],[0,.016],[1,.016],[1,.004]]){const row=[];for(let i=0;i<=S;i++){const a=-a0+2*a0*i/S;row.push(U(P(a,bandR(a)+dr,ys[dy])));}rings.push(row);}
  const strapIn=p=>{const a=Math.atan2(p.x/(m.headSX*m.Rh),p.z/(m.Rh*.98));return U(P(a,bandR(a)+.006,(ys[0]+ys[1])/2));};
  ink(kit.part(list,orient(ringsGeometry(rings,{closed:false}),strapIn),'head',col.strap),.25);
  for(const s of [-1,1]){const a=s*(a0+.04),c=U(P(a,bandR(a)+.022,(ys[0]+ys[1])/2)),n=U(P(a,bandR(a)+.2,(ys[0]+ys[1])/2)).sub(c);
   ink(kit.part(list,new THREE.SphereGeometry(1,6,4),'head',col.earButton,new THREE.Matrix4().compose(c,facing(n),new THREE.Vector3(m.Rh*.05,m.Rh*.05,m.Rh*.025))),.15);}}
 // The badge on the front of the crown: black felt, the gold ring and the silver moon.
 const bs=.36,at=U(P(0,bandR(0)+(R-bandR(0))*bs**.8,y1+(C.crownFront-y1)*bs)),above=U(P(0,bandR(0)+(R-bandR(0))*(bs+.05)**.8,y1+(C.crownFront-y1)*(bs+.05)));
 const tangent=above.clone().sub(at).normalize(),normal=new THREE.Vector3(1,0,0).cross(tangent).normalize(),q=facing(normal),Rh=m.Rh;
 const badge=(g,lift,scale,colour,v)=>ink(kit.part(list,g,'head',colour,new THREE.Matrix4().compose(at.clone().addScaledVector(normal,lift*Rh),q,new THREE.Vector3(...scale.map(s=>s*Rh)))),v);
 badge(new THREE.SphereGeometry(1,8,6),.004,[.2,.24,.035],col.felt,.2);
 badge(new THREE.TorusGeometry(1,.22,4,12),.032,[.12,.12,.12],col.gold,.12);
 badge(new THREE.SphereGeometry(1,6,4),.038,[.075,.075,.03],col.silver,.1);
 return {bandRadius:rh,band:[y0,y1],crown:{radius:R,front:C.crownFront,back:C.crownBack},visor:V};
}

/** The cap's hair line: how much of the hair at unit point (x,y,z) the band and crown cover (0–1). */
export const policeCapTuck=(x,y)=>smoothstep(y,POLICE_UNIFORM.cap.tuck[0],POLICE_UNIFORM.cap.tuck[1]);
export {TUCK_R};

/**
 * Cloth laid on the chest from an outline ([fraction of the half-width, height up the torso], one side, mirrored): cut
 * into small triangles so it bends with the chest, lifted a few millimetres, given an edge all round. The kariyushi's camp
 * collar is built the same way (build.js campCollar). No ink along the open V (`vFrom` to `vTo`), where the outline would
 * draw on the shirt beside the edge.
 */
function laidLapels(list,m,prof,colour,outline,kit,{vFrom,vTo,top=.011,under=.003}){
 const W=m.width,D=m.depth,mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
 for(const s of [-1,1]){
  const shape=outline.map(([f,t])=>new THREE.Vector2(f,t));
  let tris=THREE.ShapeUtils.triangulateShape(shape,[]).map(t=>t.map(i=>[shape[i].x,shape[i].y]));
  for(let k=0;k<2;k++)tris=tris.flatMap(([a,b,c])=>{const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);return [[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]];});
  const at=([f,t],lift)=>{const r=kit.latheRadius(prof,t),x=s*f*W/2*r,z=D/2*r*Math.sqrt(Math.max(0,1-f*f)),q=Math.hypot(x,z)||1,k=1+lift/q;
   return new THREE.Vector3(x*k,m.hipY+t*m.torso+lift*smoothstep(t,.9,1.02),z*k);};
  const T=top*m.k,B=under*m.k,pos=[];
  for(const [a,b,c] of tris){for(const [p,q,r] of [[at(a,T),at(b,T),at(c,T)],[at(a,B),at(c,B),at(b,B)]])pos.push(p.x,p.y,p.z,q.x,q.y,q.z,r.x,r.y,r.z);}
  const ring=[];outline.forEach((p,i)=>{const q=outline[(i+1)%outline.length];for(let j=0;j<3;j++)ring.push([p[0]+(q[0]-p[0])*j/3,p[1]+(q[1]-p[1])*j/3]);});
  ring.forEach((p,i)=>{const q=ring[(i+1)%ring.length],a=at(p,B),b=at(q,B),c=at(q,T),d=at(p,T);pos.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z,a.x,a.y,a.z,c.x,c.y,c.z,d.x,d.y,d.z);});
  let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g=mergeVerticesLite(g);
  // faces out from the body's axis at their height
  orient(g,p=>new THREE.Vector3(0,p.y,0));
  const piece=kit.part(list,g,'chest',colour),Q=piece.attributes.position,inkA=piece.attributes.ink;
  for(let i=0;i<Q.count;i++){const t=(Q.getY(i)-m.hipY)/m.torso,f=Math.abs(Q.getX(i))/(W/2*kit.latheRadius(prof,THREE.MathUtils.clamp(t,0,1.04))),
   edgeV=vFrom[0]+(vTo[0]-vFrom[0])*THREE.MathUtils.clamp((t-vFrom[1])/(vTo[1]-vFrom[1]),0,1);
   inkA.setX(i,.55*smoothstep(f-edgeV,.04,.14));}
 }
}
/** Welds a soup of triangles into an indexed geometry (so orient and the normals see one surface). */
function mergeVerticesLite(g){
 const P=g.attributes.position,map=new Map(),pos=[],idx=[];
 for(let i=0;i<P.count;i++){const key=[P.getX(i),P.getY(i),P.getZ(i)].map(v=>Math.round(v*1e5)).join(',');
  if(!map.has(key)){map.set(key,pos.length/3);pos.push(P.getX(i),P.getY(i),P.getZ(i));}idx.push(map.get(key));}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));out.setIndex(idx);return out;
}
/** A small round thing (a button, a stud) lying on the body at p, facing out along n: radius r, standing h proud. */
function stud(list,kit,bone,colour,p,n,r,h,ink=.15){
 return kit.part(list,new THREE.SphereGeometry(1,6,2,0,Math.PI*2,0,Math.PI/2).rotateX(Math.PI/2),bone,colour,
  new THREE.Matrix4().compose(p,facing(n),new THREE.Vector3(r,r,h))).attributes.ink.array.fill(ink);
}

/**
 * The 1994 jacket's modelled pieces, over the painted garment (garment.js 'police': the shirt and tie in the V, the
 * pockets, the slots, the vents): the collar's stand round the neck, the notched lapels, the shoulder straps and their
 * buttons, the three front buttons and the pocket buttons, the rank plate, the arm emblem, the whistle chain, and the
 * jacket's skirt below the waist (on the hem springs, its front panels going with the thighs when sitting).
 */
export function addPoliceJacket(list,recipe,m,prof,kit,{torsoUV,hemSpec,quarterShare}){
 const J=POLICE_UNIFORM.jacket,o=recipe.outfit,top=o.topColour,metal=o.accent,k=m.k,W=m.width,D=m.depth;
 const vol=kit.bodyVolume(recipe,m),front=(f,t)=>{const r=kit.latheRadius(prof,t);return new THREE.Vector3(f*W/2*r,m.hipY+t*m.torso,D/2*r*Math.sqrt(Math.max(0,1-f*f)));};
 const onBody=(p,lift=0)=>{const n=vol.normal(p);return {p:vol.layOn(p,n,lift),n};};
 // The collar's stand: round the back and sides of the neck, open at the front, rolled a little at its top.
 {const ri=m.armR*1.08+.004*k,t=.007*k,h=.042*k,roll=.012*k,open=.62;
  const band=new THREE.LatheGeometry([[ri,0],[ri+t,0],[ri+t+roll,h],[ri+roll*.6,h],[ri,0]].map(([r,y])=>new THREE.Vector2(r,y)),16,open,Math.PI*2-open*2);
  const P=band.attributes.position;for(let i=0;i<P.count;i++){const a=Math.abs(Math.atan2(P.getX(i),P.getZ(i)));P.setY(i,P.getY(i)*smoothstep(a,open,open+1.0));}band.computeVertexNormals();
  kit.part(list,band,'chest',top,kit.M(0,m.neckY-.012*k,0));}
 // The notched lapels, the jacket's own cloth.
 const L=J.lapel;laidLapels(list,m,prof,top,L,kit,{vFrom:L.at(-1),vTo:L[0]});
 // The shoulder straps: laid over the top of each shoulder from the seam to the collar, a navy resin button at the collar
 // end and a dark-gold one by the seam.
 const strapEnds=[];
 for(const sx of [1,-1]){
  const x0=sx*(m.shoulderX-m.armR*.15),x1=sx*(m.armR*1.08+J.strap.inner*k),pts=[];
  for(let i=0;i<=5;i++){const x=x0+(x1-x0)*i/5;pts.push(vol.layOn(new THREE.Vector3(x,m.shoulderY,0),new THREE.Vector3(0,1,0),0,.25*k));}
  const frames=kit.laidFrames(vol,pts);
  const share=p=>{const w=smoothstep(Math.abs(p.x),m.shoulderX-m.armR*1.1,m.shoulderX+m.armR*.3);return [['chest',1-w],['shoulder'+(sx>0?'L':'R'),w]];};
  const strip=kit.clothStrip(vol,frames,{hw:J.strap.half*k,th:.004*k,gap:.0015*k,across:4}).geometry;
  kit.part(list,strip,share,top).attributes.ink.array.fill(.5);
  const inner=frames.at(-2),outer=frames[1];
  stud(list,kit,'chest',J.strapButton,inner.c.clone().addScaledVector(inner.n,.0055*k),inner.n,.0075*k,.004*k);
  stud(list,kit,share,metal,outer.c.clone().addScaledVector(outer.n,.0055*k),outer.n,.0075*k,.0045*k);
  strapEnds.push({side:sx,inner:inner.c.clone().addScaledVector(inner.n,.006*k),n:inner.n});
 }
 // The three front buttons on the placket, and one on each breast pocket's flap.
 for(const t of J.buttons){const {p,n}=onBody(front(0,t),.002*k);stud(list,kit,'chest',metal,p,n,.0085*k,.005*k);}
 const PK=J.pockets;
 for(const s of [-1,1]){const {p,n}=onBody(front(s*PK.f,PK.t+PK.h/2-PK.flap*.6),.002*k);stud(list,kit,'chest',metal,p,n,.006*k,.0035*k);}
 // The rank plate along the top of the left pocket's flap: a silver bar, the gold-rimmed navy disc in its middle.
 {const {p,n}=onBody(front(PK.f,PK.t+PK.h/2+.022),.002*k),q=facing(n),R=J.rank;
  kit.part(list,new THREE.BoxGeometry(1,1,1),'chest',R.plate,new THREE.Matrix4().compose(p,q,new THREE.Vector3(.052*k,.014*k,.004*k))).attributes.ink.array.fill(.2);
  stud(list,kit,'chest',R.bar,p.clone().addScaledVector(n,.002*k),n,.008*k,.003*k,.1);
  stud(list,kit,'chest',R.ground,p.clone().addScaledVector(n,.0035*k),n,.005*k,.0025*k,0);}
 // The emblem on the right upper arm, a third of the way down, on its outside.
 {const sh=new THREE.Vector3(-m.shoulderX,m.shoulderY,0),el=new THREE.Vector3(-m.shoulderX-.01,m.shoulderY-m.upper,0),c=sh.clone().lerp(el,.36),r=m.armR*1.04;
  const n=new THREE.Vector3(-1,0,.12).normalize(),p=c.clone().addScaledVector(n,r+.002*k),E=J.emblem,q=facing(n);
  kit.part(list,new THREE.SphereGeometry(1,8,6),'shoulderR',E.frame,new THREE.Matrix4().compose(p,q,new THREE.Vector3(.026*k,.032*k,.004*k))).attributes.ink.array.fill(.2);
  kit.part(list,new THREE.SphereGeometry(1,8,6),'shoulderR',E.ground,new THREE.Matrix4().compose(p.clone().addScaledVector(n,.0025*k),q,new THREE.Vector3(.022*k,.028*k,.003*k))).attributes.ink.array.fill(0);
  stud(list,kit,'shoulderR',E.frame,p.clone().addScaledVector(n,.004*k),n,.009*k,.0025*k,0);}
 // The whistle chain: from the right strap's collar button down in a loose loop to the right breast pocket, where the
 // whistle is.
 {const s=strapEnds.find(e=>e.side<0),end=onBody(front(-PK.f-.04,PK.t+PK.h/2-.01),.004*k).p,mid=onBody(front(-.55,.84),.012*k).p;
  const pts=[s.inner,onBody(front(-.5,.95),.008*k).p,mid,end];
  const tubeG=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,'centripetal'),14,.0024*k,3,false);
  kit.part(list,tubeG,'chest',J.chain).attributes.ink.array.fill(.08);}
 // The skirt of the jacket below the waist: on the hem springs; low down at the front it goes with the thighs, so seated
 // it lies on the lap instead of standing through it. Lined inside, so a look up into it finds cloth.
 const hem=hemSpec(recipe,m),rTop=W/2*kit.latheRadius(prof,(hem.waist-m.hipY)/m.torso)*.97,hipY=m.hipY;
 const drape=p=>{const below=smoothstep(hipY+.04*k-p.y,0,.07*k),fr=smoothstep(p.z,-D*.05,D*.3),leg=below*fr*.85,w=smoothstep(p.x,-W*.15,W*.15);
  return [['hips',1-leg],['thighL',leg*w],['thighR',leg*(1-w)]];};
 const ring=new THREE.CylinderGeometry(rTop,hem.rx*1.04,hem.length,28,3,true);
 kit.part(list,ring,quarterShare(hem,drape),top,kit.M(0,hem.waist-hem.length/2,0,0,0,0,1,1,D/W),p=>torsoUV(p,m));
 const lining=new THREE.CylinderGeometry(rTop*.985,hem.rx*1.025,hem.length*.98,20,1,true),I=lining.index;
 for(let i=0;i<I.count;i+=3){const t=I.getX(i+1);I.setX(i+1,I.getX(i+2));I.setX(i+2,t);}
 kit.part(list,lining,quarterShare(hem,drape),shade(top,.7),kit.M(0,hem.waist-hem.length/2-hem.length*.01,0,0,0,0,1,1,D/W)).attributes.ink.array.fill(0);
 return {strapEnds};
}

/** A frame on the body's outside at azimuth a (0 the front, + the wearer's left) and height y: the point, out, along, up. */
function outsideAt(recipe,m,prof,kit,a,y,hem){
 const W=m.width,D=m.depth,t=(y-m.hipY)/m.torso;
 let rx=W/2*kit.latheRadius(prof,THREE.MathUtils.clamp(t,-.1,1.04)),rz=rx*D/W;
 if(hem&&y<=hem.waist&&y>=hem.waist-hem.length){
  // over the jacket's skirt (its ring, build.js addPoliceJacket)
  const f=(hem.waist-y)/hem.length,top=W/2*kit.latheRadius(prof,(hem.waist-m.hipY)/m.torso)*.97,r=lerp(top,hem.rx*1.04,f);
  if(r>rx){rx=r;rz=r*D/W;}
 }
 const p=new THREE.Vector3(Math.sin(a)*rx,y,Math.cos(a)*rz),out=new THREE.Vector3(Math.sin(a)/rx,0,Math.cos(a)/rz).normalize(),up=new THREE.Vector3(0,1,0);
 return {p,out,along:up.clone().cross(out).normalize(),up};
}
/** A matrix placing a unit shape at c with its x along `along`, y along `up` and z along `out`, scaled. */
const placed=(c,{along,up,out},scale)=>new THREE.Matrix4().makeBasis(along,up,out).scale(new THREE.Vector3(...scale)).setPosition(c);
/** A coiled cord (a revolver lanyard, a radio's lead) round a centre line: `turns` coils of radius `coil`. */
function coiledCord(points,{coil,wire,turns,segments=96}){
 const centre=new THREE.CatmullRomCurve3(points,false,'centripetal'),path=[],up=new THREE.Vector3(0,1,0),n=new THREE.Vector3(),b=new THREE.Vector3();
 for(let i=0;i<=segments;i++){const t=i/segments,p=centre.getPointAt(t),d=centre.getTangentAt(t);n.copy(Math.abs(d.y)>.9?new THREE.Vector3(1,0,0):up).cross(d).normalize();b.copy(d).cross(n);
  const ph=t*turns*Math.PI*2,e=smoothstep(t,0,.06)*smoothstep(1-t,0,.06);path.push(p.clone().addScaledVector(n,Math.cos(ph)*coil*e).addScaledVector(b,Math.sin(ph)*coil*e));}
 return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path),segments,wire,3,false);
}

/**
 * The duty belt and its kit (DUTY_BELT). Under the police jacket the belt is hidden, so only what comes out of its waist
 * slots is built: the holster with the revolver's grip and lanyard, the baton holder, the radio and its cord to the
 * speaker-microphone on the left shoulder strap. Without the jacket the belt shows, buckle and handcuff case and all.
 * Each piece rides on the cloth it hangs over (the jacket's skirt takes the same skin), so the skirt never swings through
 * it. The belt's colour (outfit.beltColour) is the leather's: black for the patrol, white for traffic duty.
 */
export function addDutyBelt(list,recipe,m,prof,kit,{hemSpec,quarterShare}){
 const B=DUTY_BELT,o=recipe.outfit,k=m.k,leather=o.beltColour,jacket=o.top==='police',hem=jacket?hemSpec(recipe,m):null;
 const hipY=m.hipY,y=t=>hipY+t*m.torso,D=m.depth,W=m.width;
 // the skin of whatever the kit hangs over there: the jacket skirt's (quarterShare) or the hips'
 const drape=p=>{const below=smoothstep(hipY+.04*k-p.y,0,.07*k),fr=smoothstep(p.z,-D*.05,D*.3),leg=below*fr*.85,w=smoothstep(p.x,-W*.15,W*.15);return [['hips',1-leg],['thighL',leg*w],['thighR',leg*(1-w)]];};
 const skinAt=p=>{const w=(hem?quarterShare(hem,drape):drape)(p);return ()=>w;};
 const at=(a,yy)=>outsideAt(recipe,m,prof,kit,a,yy,hem);
 if(!jacket){
  const r=t=>W/2*kit.latheRadius(prof,t)+.006*k,bt=B.belt.t;
  ink(kit.part(list,new THREE.CylinderGeometry(r(bt+.04),r(bt-.04),B.belt.width*k,32,1,true),'hips',leather,kit.M(0,y(bt),0,0,0,0,1,1,D/W)),.6);
  const f=at(0,y(bt));kit.part(list,new THREE.BoxGeometry(1,1,1),'hips',B.belt.buckle,placed(f.p.clone().addScaledVector(f.out,.006*k),f,[.06*k,.045*k,.008*k])).attributes.ink.array.fill(.3);
  const C=B.cuffs,c=at(C.at,y(C.top)-C.height*k/2);
  ink(kit.part(list,new THREE.CapsuleGeometry(.5,1,2,6),'hips',leather,placed(c.p.clone().addScaledVector(c.out,C.depth*k/2+.004*k),c,[C.width*k,C.height*k/2,C.depth*k])),.6);
 }
 // The holster on the right hip: black resin, the revolver's grip out of its top, angled back, the lanyard's coil
 // from the grip's butt to the belt.
 {const H=B.holster,top=y(H.top),c=at(H.at,top-H.length*k/2),f=at(H.at,top),share=skinAt(c.p);
  const centre=c.p.clone().addScaledVector(c.out,H.depth*k/2+.003*k);
  ink(kit.part(list,new THREE.CapsuleGeometry(.5,1,2,8),share,leather,placed(centre,c,[H.width*k,H.length*k*.5,H.depth*k])),.7);
  // the safety strap over the top, and the revolver's frame and grip coming out of it
  const lip=f.p.clone().addScaledVector(f.out,H.depth*k/2+.003*k);
  kit.part(list,new THREE.BoxGeometry(1,1,1),share,leather,placed(lip.clone().addScaledVector(f.up,-.006*k),f,[H.width*k*1.08,.012*k,H.depth*k*1.1])).attributes.ink.array.fill(.4);
  const back=f.along.clone().multiplyScalar(Math.sign(Math.sin(H.at))||1);   // towards the wearer's back (`along` runs anticlockwise seen from above: backwards on the left, forwards on the right)
  const g0=lip.clone().addScaledVector(f.up,.006*k),g1=g0.clone().addScaledVector(f.up,.045*k).addScaledVector(back,.03*k);
  kit.part(list,new THREE.SphereGeometry(1,6,4),share,'#2a2b31',placed(g0.clone().addScaledVector(f.up,.004*k),f,[.022*k,.014*k,.02*k])).attributes.ink.array.fill(.3);
  const grip=new THREE.CapsuleGeometry(1,1,2,6),dir=g1.clone().sub(g0),len=dir.length();
  kit.part(list,grip,share,H.grip,new THREE.Matrix4().compose(g0.clone().add(g1).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize()),new THREE.Vector3(.013*k,len/3,.011*k))).attributes.ink.array.fill(.5);
  // the lanyard: from the butt, down the back of the holster and up again into the slot
  const butt=g1.clone().addScaledVector(dir,.004*k),out=f.out;
  const pts=[butt,butt.clone().addScaledVector(back,.02*k).addScaledVector(out,.008*k).addScaledVector(f.up,-.02*k),
   centre.clone().addScaledVector(back,H.width*k*.75).addScaledVector(out,H.depth*k*.3),centre.clone().addScaledVector(back,H.width*k*.85).addScaledVector(f.up,H.length*k*.3).addScaledVector(out,-.002*k),
   lip.clone().addScaledVector(back,H.width*k*.95).addScaledVector(f.up,.012*k).addScaledVector(out,-H.depth*k*.45)];
  kit.part(list,coiledCord(pts,{coil:.0055*k,wire:.0017*k,turns:7,segments:28}),share,H.lanyard).attributes.ink.array.fill(.08);}
 // The baton holder on the left hip: the closed baton grip up, its guard and its grip above the sleeve.
 {const T=B.baton,top=y(T.top),c=at(T.at,top-T.length*k/2),share=skinAt(c.p),R=T.radius*k;
  const centre=c.p.clone().addScaledVector(c.out,R+.003*k),tilt=new THREE.Quaternion().setFromAxisAngle(c.out,.12);
  const fr={along:c.along.clone().applyQuaternion(tilt),up:c.up.clone().applyQuaternion(tilt),out:c.out};
  ink(kit.part(list,new THREE.CylinderGeometry(1,.9,1,8),share,leather,placed(centre,fr,[R*1.15,T.length*k*.62,R*1.15])),.6);
  const gTop=centre.clone().addScaledVector(fr.up,T.length*k*.31);
  kit.part(list,new THREE.TorusGeometry(1,.35,4,8).rotateX(Math.PI/2),share,T.colour,placed(gTop,fr,[R*1.05,R*1.05,R*1.05])).attributes.ink.array.fill(.3);
  ink(kit.part(list,new THREE.CapsuleGeometry(1,1,2,8),share,T.grip,placed(gTop.clone().addScaledVector(fr.up,T.length*k*.2),fr,[R*.95,T.length*k*.16,R*.95])),.5);}
 // The radio on the left front of the belt, its aerial, and the coiled cord up to the microphone on the shoulder strap.
 {const Rd=B.radio,top=y(Rd.top),c=at(Rd.at,top-Rd.height*k/2),share=skinAt(c.p);
  const centre=c.p.clone().addScaledVector(c.out,Rd.depth*k/2+.003*k);
  ink(kit.part(list,new THREE.BoxGeometry(1,1,1,1,1,1),share,Rd.colour,placed(centre,c,[Rd.width*k,Rd.height*k,Rd.depth*k])),.6);
  const head=centre.clone().addScaledVector(c.up,Rd.height*k/2);
  kit.part(list,new THREE.CylinderGeometry(.005*k,.006*k,.05*k,6),share,Rd.aerial,placed(head.clone().addScaledVector(c.up,.025*k).addScaledVector(c.along,-Rd.width*k*.3),c,[1,1,1])).attributes.ink.array.fill(.3);
  // the microphone: on the left strap by the collar, as the jacket's strap is (or the same place on a shirt)
  const vol=kit.bodyVolume(recipe,m),J=POLICE_UNIFORM.jacket;
  const strapX=m.armR*1.08+J.strap.inner*k+.012*k,micAt=vol.layOn(new THREE.Vector3(strapX,m.shoulderY,0),new THREE.Vector3(0,1,0),0,.25*k);
  const mn=vol.normal(micAt),micFront=new THREE.Vector3(0,-.25,1).normalize();
  const mic=micAt.clone().addScaledVector(mn,.014*k).addScaledVector(micFront,.012*k);
  kit.part(list,new THREE.CapsuleGeometry(.5,1,2,6),'chest',Rd.mic,new THREE.Matrix4().compose(mic,new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),micFront),new THREE.Vector3(.04*k,.03*k,.02*k))).attributes.ink.array.fill(.5);
  // the cord: up from the radio's top, up the back over the shoulder blade and over the top of the shoulder by the neck
  // (inside the arm's swing), to the microphone; laid on the body all the way
  const lay=(a,t,lift)=>{const r=kit.latheRadius(prof,t),p=new THREE.Vector3(Math.sin(a)*W/2*r,y(t),Math.cos(a)*D/2*r);return vol.layOn(p,vol.normal(p),lift*k);};
  const pts=[head.clone().addScaledVector(c.out,.004*k),lay(Rd.at+.15,.36,.022),lay(2.3,.6,.02),lay(2.45,.86,.02),vol.layOn(new THREE.Vector3(strapX-.006*k,m.shoulderY,-.035*k),new THREE.Vector3(0,1,0),.02*k,.25*k),mic.clone().addScaledVector(micFront,-.012*k).addScaledVector(mn,-.004*k)];
  const torsoSkin=p=>{const ch=smoothstep(p.y,hipY+m.torso*.15,hipY+m.torso*.55);return [['hips',1-ch],['chest',ch]];};
  kit.part(list,coiledCord(pts,{coil:.005*k,wire:.0016*k,turns:12,segments:48}),torsoSkin,Rd.colour).attributes.ink.array.fill(.06);}
}
