/**
 * Walks laid across a lawn: the paths of Harbour Park, the east lawn's walks, Kitahama's coastal walk and Kitano Road's
 * footway, each a set of convex pieces of one class of the rulebook (ground-standard.js), and a row of setts (the stone
 * edging) wherever a piece meets ground the rulebook says needs one (a lawn, by edgeRule). Step 4 of the owner's ground
 * plan (21 October 2026: "Walk paths, grass and sandy beach?"; docs/GROUND-STANDARD.md).
 *
 * The axis-aligned generator (ground-build.js) lays the streets and the quarters; a park's walks bend at any angle and
 * meet in round joins, so they are laid here from polygons instead, with the same materials and the same edging:
 *  - walkPieces() cuts the walks into disjoint convex pieces, the first walk listed owning a junction, so no two surfaces
 *    ever lie one on the other;
 *  - edgingPieces() finds the outline of their union (each piece's sides, less what another piece covers) and lays a
 *    10 cm strip of setts outside it where the neighbour needs edging, with the corners filled round, never a notch;
 *  - buildPaths() lays both as one mesh per class, flush at the class's top, the setts 3 mm proud of the path.
 * No THREE until buildPaths, so the plan can be asked anywhere (layout, the audit, the tests).
 */
import * as THREE from '../../vendor/three.module.js';
import {GROUND_CLASSES,GROUND_EDGE,edgeRule} from './ground-standard.js';
import {subtractPolygon,area} from './street-plan.js';
import {EDGING_PROUD} from './ground-plan.js';

const EPS=1e-7;
/** A circle as a convex polygon: the round join of a walk, as the park has always drawn its joins. */
export function disc(x,z,r,n=16){return Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;return [x+Math.cos(a)*r,z+Math.sin(a)*r];});}
/** A segment of a walk as a quad, `w` wide, ending square at its two points. */
export function band(a,b,w){
 const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,ox=-dz/l*w/2,oz=dx/l*w/2;
 return [[a[0]-ox,a[1]-oz],[b[0]-ox,b[1]-oz],[b[0]+ox,b[1]+oz],[a[0]+ox,a[1]+oz]];
}
const ccw=p=>{let s=0;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length];s+=p[i][0]*q[1]-q[0]*p[i][1];}return s>0?p:[...p].reverse();};
const boxOf=p=>{let a=Infinity,b=-Infinity,c=Infinity,d=-Infinity;for(const [x,z] of p){if(x<a)a=x;if(x>b)b=x;if(z<c)c=z;if(z>d)d=z;}return {minX:a,maxX:b,minZ:c,maxZ:d};};
const meets=(a,b,pad=0)=>a.minX<b.maxX+pad&&a.maxX>b.minX-pad&&a.minZ<b.maxZ+pad&&a.maxZ>b.minZ-pad;
/** Whether a point lies in a convex polygon (counter-clockwise). */
export function inConvex(p,x,z,eps=0){
 for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if((b[0]-a[0])*(z-a[1])-(b[1]-a[1])*(x-a[0])< -eps)return false;}
 return true;
}
/** The part [t0, t1] of the segment a→b inside a convex polygon (counter-clockwise), or null (Cyrus–Beck). */
function clipSegment(p,a,b){
 let t0=0,t1=1;const dx=b[0]-a[0],dz=b[1]-a[1];
 for(let i=0;i<p.length;i++){
  const q=p[i],r=p[(i+1)%p.length],ex=r[0]-q[0],ez=r[1]-q[1];
  // Inside is where ex*(z-qz)-ez*(x-qx) >= 0.
  const num=ex*(a[1]-q[1])-ez*(a[0]-q[0]),den=ex*dz-ez*dx;
  if(Math.abs(den)<1e-12){if(num<0)return null;continue;}
  const t=-num/den;if(den>0)t0=Math.max(t0,t);else t1=Math.min(t1,t);
  if(t0>t1)return null;
 }
 return [t0,t1];
}
const minus=(polys,mask)=>polys.flatMap(p=>subtractPolygon(p,mask)).filter(p=>p.length>=3&&area(p)>1e-6).map(ccw);

/**
 * The walks as disjoint convex pieces. `walks`: [{id, cls, polygons}] (convex polygons, overlapping freely); the first
 * walk listed owns the ground where they overlap. `masks`: convex polygons laid by someone else (Main Street, a quay).
 * Returns [{cls, walk, poly, box}].
 */
export function walkPieces(walks,{masks=[]}={}){
 const out=[],taken=masks.map(m=>({poly:ccw(m),box:boxOf(m)}));
 for(const w of walks)for(const polygon of w.polygons){
  let pieces=[ccw(polygon)];const box=boxOf(polygon);
  for(const t of taken)if(meets(box,t.box))pieces=minus(pieces,t.poly);
  for(const poly of pieces)out.push({cls:w.cls,walk:w.id,poly,box:boxOf(poly)});
  taken.push({poly:ccw(polygon),box});
 }
 return out;
}

/**
 * The setts round the walks: along the outline of the pieces' union, outside it, where `neighbour(x, z)` (what lies
 * beyond: {cls}, or null for nothing to edge against) needs a stone edging by the rulebook. Each strip is cut by the
 * pieces and by the strips before it, so nothing overlaps; where the outline turns, a round of setts fills the corner.
 * Returns [{poly, cls, top}] where `top` is the walk's top at that side (the setts lie 3 mm over it).
 */
export function edgingPieces(pieces,{neighbour,width=GROUND_EDGE.edging.width,top}){
 const W=width,raw=[],ends=[];
 const near=b=>pieces.filter(q=>meets(b,q.box,W+.05));
 for(const piece of pieces){
  const p=piece.poly,others=near(piece.box).filter(q=>q!==piece);
  for(let i=0;i<p.length;i++){
   const a=p[i],b=p[(i+1)%p.length],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(l<1e-4)continue;
   const nx=dz/l,nz=-dx/l,o=.01,A=[a[0]+nx*o,a[1]+nz*o],B=[b[0]+nx*o,b[1]+nz*o];
   // What of this side another piece covers.
   const covered=others.map(q=>clipSegment(q.poly,A,B)).filter(Boolean).sort((u,v)=>u[0]-v[0]);
   const open=[];let t=0;for(const [c0,c1] of covered){if(c0>t+1e-6)open.push([t,c0]);t=Math.max(t,c1);}if(t<1-1e-6)open.push([t,1]);
   for(const [t0,t1] of open){
    // Split the open run where its neighbour changes, every 5 cm.
    const n=Math.max(1,Math.ceil((t1-t0)*l/.05));let run=null;
    const flush=end=>{if(run!==null&&end-run>1e-6){const s=[a[0]+dx*run,a[1]+dz*run],e=[a[0]+dx*end,a[1]+dz*end];
      raw.push({poly:ccw([s,e,[e[0]+nx*W,e[1]+nz*W],[s[0]+nx*W,s[1]+nz*W]]),cls:piece.cls,top:top(piece.cls,(s[0]+e[0])/2,(s[1]+e[1])/2)});ends.push(s,e);}run=null;};
    for(let k=0;k<n;k++){
     const u=t0+(t1-t0)*(k+.5)/n,x=a[0]+dx*u+nx*.06,z=a[1]+dz*u+nz*.06,nb=neighbour(x,z);
     const want=!!nb&&edgeRule(piece.cls,nb.cls).edge==='edging';
     if(want&&run===null)run=t0+(t1-t0)*k/n;if(!want)flush(t0+(t1-t0)*k/n);
    }
    flush(t1);
   }
  }
 }
 // Cut each strip by the walks and by the strips laid before it.
 const out=[],cut=(poly,box)=>{let list=[poly];for(const q of near(box))list=minus(list,q.poly);for(const e of out)if(meets(box,e.box))list=minus(list,e.poly);return list;};
 for(const r of raw){const box=boxOf(r.poly);for(const poly of cut(r.poly,box))out.push({poly,cls:r.cls,top:r.top,box:boxOf(poly)});}
 // The corners: wherever two runs of setts meet at an end, a round of setts fills what is left between them.
 const key=([x,z])=>Math.round(x*1000)+','+Math.round(z*1000),count=new Map();for(const e of ends)count.set(key(e),(count.get(key(e))||0)+1);
 const done=new Set();
 for(const e of ends){const k=key(e);if(count.get(k)<2||done.has(k))continue;done.add(k);
  const poly=ccw(disc(e[0],e[1],W,16)),box=boxOf(poly),owner=out.find(o=>meets(box,o.box,.001));
  for(const piece of cut(poly,box)){
   // A sliver no wider than a millimetre or two is nothing to lay.
   if(area(piece)<2e-5)continue;
   out.push({poly:piece,cls:owner?.cls??'park-path',top:owner?.top??top('park-path',e[0],e[1]),box:boxOf(piece)});
  }
 }
 return out;
}

/** Whether a point lies on a walk (any piece). */
export function onPieces(pieces,x,z,pad=0){return pieces.some(p=>x>=p.box.minX-pad&&x<=p.box.maxX+pad&&z>=p.box.minZ-pad&&z<=p.box.maxZ+pad&&inConvex(p.poly,x,z,pad));}

/** A flat convex piece with its sides, `depth` deep, wound to face up and out. */
function tri(list,a,b,c,out){
 const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
 const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 if(n[0]*out[0]+n[1]*out[1]+n[2]*out[2]<0)[b,c]=[c,b];
 list.push(...a,...b,...c);
}
function solid(list,poly,top,depth){
 const n=poly.length,P=poly.map(([x,z])=>[x,top(x,z),z]),cx=poly.reduce((s,p)=>s+p[0],0)/n,cz=poly.reduce((s,p)=>s+p[1],0)/n;
 for(let i=1;i<n-1;i++)tri(list,P[0],P[i],P[i+1],[0,1,0]);
 if(!depth)return;
 for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n],A=[a[0],a[1]-depth,a[2]],B=[b[0],b[1]-depth,b[2]];
  const mx=(a[0]+b[0])/2-cx,mz=(a[2]+b[2])/2-cz,out=[mx,0,mz];
  tri(list,a,b,B,out);tri(list,a,B,A,out);}
}

/**
 * Lays walks and their setts: one mesh per class in the rulebook's shared material (ground-build.js groundMaterial),
 * one for the setts. `top(cls, x, z)` is the finished top of a class at a point.
 */
export function buildPaths(parent,{pieces,edging=[],top,name='Walks',material,shadows=false}){
 const group=new THREE.Group();group.name=name;parent.add(group);
 const lists=new Map();
 // A walk's outline lies behind its setts or flush with what it meets: no sides. The setts show theirs down into the lawn,
 // and so does a bed of garden earth, which stands 25 mm proud of the turf it is dug in.
 for(const p of pieces){const l=lists.get(p.cls)??lists.set(p.cls,[]).get(p.cls);solid(l,p.poly,(x,z)=>top(p.cls,x,z),p.cls==='earth'?.04:0);}
 const setts=[];for(const e of edging)solid(setts,e.poly,()=>e.top+EDGING_PROUD,.04);
 const meshes=new Map();
 const add=(id,positions,label)=>{
  if(!positions.length)return;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  const mesh=new THREE.Mesh(g,material(id));mesh.name=label;mesh.userData.groundClass=id;mesh.receiveShadow=true;mesh.castShadow=false;
  group.add(mesh);meshes.set(id,mesh);
 };
 for(const [cls,list] of lists)add(cls,list,name+': '+(GROUND_CLASSES[cls]?.name??cls));
 add('edging',setts,'Stone edging');
 return {group,meshes};
}
