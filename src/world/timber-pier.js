import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {SEA_LEVEL} from './ocean.js';

/**
 * A timber pier, built the way a dock builder builds one (the owner, 2026-10-19: "how would a dock builder make
 * these?"), from the water up:
 *
 * 1. Piles: round timber driven into the seabed in rows across the pier (bents) at under two metres, one under each
 *    line of the frame. Each is dry and grey-brown above the tide, black and weed-green where the sea wets it, with
 *    a pale salt line at high water.
 * 2. Pile caps (headstocks): a heavy beam across the top of every bent, the full width of the pier.
 * 3. Stringers: joists along the pier on the caps, at most 0.7 m apart, so a deck board never spans further.
 * 4. Deck boards: across the stringers, 140 mm wide with a 10 mm gap. The gaps show the dark of the frame below,
 *    never the water: a dark sheet lies on the stringers under the boards (the cyan seam, 2026-10-19, was the sea
 *    seen through a board gap with nothing under it).
 * 5. An edge kerb (toe board) along every open edge, rails of posts and a top rail where people walk by the water,
 *    fender piles with rubber faces at a berth, a ladder down to the water, cleats and a bollard for the lines.
 *
 * The plan is data first (`timberPierPlan`): what stands where and why, so the tests, the stories and the builder ask
 * the same questions (does every deck have piles under its corners; does any board leave a gap to the sea). The
 * builder (`buildTimberPier`) draws it in three meshes: the timber and iron of the frame merged with their colours in
 * the vertices, and the piles instanced.
 */

/** Section sizes, metres. */
export const PIER_TIMBER=Object.freeze({
 board:Object.freeze({width:.14,gap:.01,thickness:.045}),
 stringer:Object.freeze({width:.1,depth:.15,maxSpacing:.7}),
 cap:Object.freeze({width:.22,depth:.18,overhang:.06}),
 pile:Object.freeze({radius:.11,maxSpacing:2}),
 kerb:Object.freeze({width:.12,height:.1}),
 rail:Object.freeze({post:.09,height:1.05,cap:Object.freeze([.13,.05]),mid:Object.freeze([.07,.045]),maxSpacing:1.6}),
 fender:Object.freeze({radius:.09,rubber:.035,top:.32}),
});
/** The water's marks on a pile: the salt line at high water, the black wet band, the weed below low water. */
export const PILE_BANDS=Object.freeze({salt:SEA_LEVEL+.18,wet:SEA_LEVEL+.14,weed:SEA_LEVEL-.32});
/**
 * Colours: weathered timber, its darker frame, the wet band, iron and rubber. The boards are the rulebook's timber deck
 * (ground-standard.js, #8a7559) a shade either way, as one plank never weathers like the next.
 */
export const PIER_COLOURS=Object.freeze({board:0x8a7559,boardAlt:0x917c5f,boardDark:0x85704f,frame:0x5d4836,cap:0x54412f,kerb:0x7a5d43,rail:0x8f7256,
 underlay:0x2c241d,pileDry:0x6b5844,salt:0xb3ad98,wet:0x3a3128,weed:0x2d3a2f,iron:0x30373a,galv:0x8d9493,rubber:0x1e2223,rope:0x9b825e,
 safety:0xe0b93a});

const range=(a,b,n)=>Array.from({length:n},(_,i)=>n===1?(a+b)/2:a+(b-a)*i/(n-1));
const evenly=(a,b,max)=>range(a,b,Math.max(2,Math.ceil((b-a)/max)+1));

/**
 * The whole frame of a pier from its spec.
 * @param {object} spec
 * @param {string} spec.id
 * @param {number} spec.top deck top (the walking level)
 * @param {number} spec.seabed where the piles are driven to
 * @param {Array<{id:string,minX:number,maxX:number,minZ:number,maxZ:number,pileX:number[],bents:number[],stringersFrom?:number,stringersTo?:number}>} spec.decks
 *   rectangles of one deck; boards run across x, stringers along z. `bents` are the z of each row of piles; a deck
 *   that lands on a quay wall has no bent there (`stringersTo` runs its stringers onto the wall).
 * @param {Array<{minX:number,maxX:number,minZ:number,maxZ:number}>} [spec.cutouts] where something else is the floor (a shed's own boards)
 * @param {Array<{from:number[],to:number[],gaps?:number[][]}>} [spec.rails] rails along edges, [x,z] to [x,z]; gaps along the run (a ladder's opening)
 * @param {Array<{from:number[],to:number[]}>} [spec.kerbs]
 * @param {Array<{x:number,z:number}>} [spec.fenders] fender piles, outboard of a berth
 * @param {Array<{x:number,z:number,face:'east'|'west'|'north'|'south',bottom:number}>} [spec.ladders]
 * @param {Array<{x:number,z:number,along:'x'|'z',line:string}>} [spec.cleats]
 * @param {Array<{x:number,z:number,line:string}>} [spec.bollards]
 */
export function timberPierPlan(spec){
 const T=PIER_TIMBER,top=spec.top,boardBottom=top-T.board.thickness,stringerTop=boardBottom,stringerBottom=stringerTop-T.stringer.depth;
 const capTop=stringerBottom,capBottom=capTop-T.cap.depth,pileTop=capBottom;
 const decks=spec.decks.map(d=>{
  const width=d.maxX-d.minX,n=Math.ceil(width/T.stringer.maxSpacing)+1,inset=T.stringer.width/2+.01;
  const stringers=range(d.minX+inset,d.maxX-inset,n).map(x=>({x,minZ:d.stringersTo??Math.min(...d.bents)-T.cap.width/2,maxZ:d.stringersFrom??Math.max(...d.bents)+T.cap.width/2}));
  const caps=d.bents.map(z=>({z,minX:d.minX-T.cap.overhang,maxX:d.maxX+T.cap.overhang}));
  const piles=d.bents.flatMap(z=>d.pileX.map(x=>({x,z,deck:d.id})));
  return {...d,stringers,caps,piles};
 });
 // Boards: one row of the pitch for the whole pier along z, so where two deck rectangles meet the boards carry on
 // across the join at the same pitch; each board spans whatever deck lies under its centre line.
 const pitch=T.board.width+T.board.gap,minZ=Math.min(...decks.map(d=>d.minZ)),maxZ=Math.max(...decks.map(d=>d.maxZ));
 const count=Math.round((maxZ-minZ)/pitch),step=(maxZ-minZ)/count,boards=[];
 const cut=(x0,x1,z0,z1)=>{let spans=[[x0,x1]];for(const c of spec.cutouts||[])if(z1>c.minZ&&z0<c.maxZ)spans=spans.flatMap(([a,b])=>b<=c.minX||a>=c.maxX?[[a,b]]:[[a,Math.min(b,c.minX)],[Math.max(a,c.maxX),b]].filter(([p,q])=>q-p>.02));return spans;};
 for(let i=0;i<count;i++){
  const z0=minZ+i*step,z1=z0+step,z=(z0+z1)/2;
  const under=decks.filter(d=>z>=d.minZ&&z<=d.maxZ);if(!under.length)continue;
  const x0=Math.min(...under.map(d=>d.minX)),x1=Math.max(...under.map(d=>d.maxX));
  for(const [a,b] of cut(x0,x1,z0,z1))boards.push({minX:a,maxX:b,minZ:z0+T.board.gap/2,maxZ:z1-T.board.gap/2,index:i});
 }
 const piles=decks.flatMap(d=>d.piles);
 const rails=(spec.rails||[]).map(r=>{
  const [ax,az]=r.from,[bx,bz]=r.to,len=Math.hypot(bx-ax,bz-az),dir=[(bx-ax)/len,(bz-az)/len];
  // Posts at both ends and either side of every gap, the rest evenly between at under 1.6 m.
  const spans=[];let s=0;for(const [g0,g1] of [...(r.gaps||[])].sort((p,q)=>p[0]-q[0])){spans.push([s,g0]);s=g1;}spans.push([s,len]);
  // A rail that meets another at a corner is trimmed there (`trim`, metres at its start and end) and leaves the
  // corner post to the other: no two caps, rails or posts overlap, so no two faces share a plane and flicker.
  const [t0,t1]=r.trim||[0,0];if(spans.length){spans[0][0]+=t0;spans.at(-1)[1]-=t1;}
  const runs=spans.filter(([a,b])=>b-a>.05).map(([a,b],i,all)=>{const posts=evenly(a-(i===0?t0:0),b+(i===all.length-1?t1:0),T.rail.maxSpacing).filter(t=>t>=a-1e-6&&t<=b+1e-6);
   if(i===0&&t0&&!posts.some(t=>t-a<.3))posts.unshift(a+.1);if(i===all.length-1&&t1&&!posts.some(t=>b-t<.3))posts.push(b-.1);
   // An untrimmed end carries its cap and rails out over its end post.
   const ea=i===0&&!t0?T.rail.post/2:0,eb=i===all.length-1&&!t1?T.rail.post/2:0;
   return {from:[ax+dir[0]*(a-ea),az+dir[1]*(a-ea)],to:[ax+dir[0]*(b+eb),az+dir[1]*(b+eb)],posts:[...new Set(posts)].sort((p,q)=>p-q).map(t=>[ax+dir[0]*t,az+dir[1]*t])};});
  return {...r,runs};
 });
 return Object.freeze({id:spec.id,top,seabed:spec.seabed,levels:Object.freeze({boardBottom,stringerTop,stringerBottom,capTop,capBottom,pileTop}),
  decks,boards,piles,rails,kerbs:spec.kerbs||[],fenders:spec.fenders||[],ladders:spec.ladders||[],cleats:spec.cleats||[],bollards:spec.bollards||[],cutouts:spec.cutouts||[]});
}

/**
 * Every corner of every deck rectangle has a bearing pile within `reach` of it, or lies on the quay wall it lands on
 * (`landing`, the wall's face z): no deck ends in mid-air.
 */
export function unsupportedCorners(plan,reach=.6){
 const out=[];
 for(const d of plan.decks)for(const [x,z] of [[d.minX,d.minZ],[d.maxX,d.minZ],[d.minX,d.maxZ],[d.maxX,d.maxZ]]){
  if(d.landing!=null&&Math.abs(z-d.landing)<=Math.abs(d.maxZ-d.landing)+1e-6&&(z-d.landing)*(d.maxZ-d.landing)>=0)continue;
  if(!plan.piles.some(p=>Math.abs(p.x-x)<=reach&&Math.abs(p.z-z)<=reach))out.push({deck:d.id,x,z});
 }
 return out;
}

/** The largest open gap between boards along the pier (what the sea could show through, before the underlay). */
export function widestBoardGap(plan){
 const rows=[...new Set(plan.boards.map(b=>b.index))].sort((a,b)=>a-b);let widest=0;
 for(let i=1;i<rows.length;i++){const a=plan.boards.filter(b=>b.index===rows[i-1]),b=plan.boards.filter(q=>q.index===rows[i]);widest=Math.max(widest,b[0].minZ-a[0].maxZ);}
 return widest;
}

function coloured(geometry,hex){
 const c=new THREE.Color(hex),n=geometry.attributes.position.count,a=new Float32Array(n*3);
 for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}
 geometry.setAttribute('color',new THREE.BufferAttribute(a,3));return geometry;
}
const boxAt=(w,h,d,x,y,z,hex,ry=0)=>{const g=new THREE.BoxGeometry(w,h,d);if(ry)g.rotateY(ry);g.translate(x,y,z);return coloured(g,hex);};
const rodBetween=(a,b,r,hex,segments=6)=>{
 const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),g=new THREE.CylinderGeometry(r,r,d.length(),segments,1,true);
 g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));g.translate((A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2);return coloured(g,hex);
};

/** A round timber pile from the seabed to `top`, banded by the tide (vertex colours, hard edges). */
export function pileGeometry(top,bottom,radius=PIER_TIMBER.pile.radius,segments=8){
 const C=PIER_COLOURS,B=PILE_BANDS,bands=[[bottom,B.weed,C.weed],[B.weed,B.wet,C.wet],[B.wet,B.salt,C.salt],[B.salt,top,C.pileDry]];
 const parts=bands.map(([a,b,c])=>[Math.max(a,bottom),Math.min(b,top),c]).filter(([a,b])=>b-a>1e-3).map(([a,b,c])=>{
  const g=new THREE.CylinderGeometry(radius,radius,b-a,segments,1,true);g.translate(0,(a+b)/2,0);g.deleteAttribute('uv');return coloured(g.toNonIndexed(),c);});
 const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());return g;
}

/** A rope hanging between two points (a parabola close enough to the catenary at these spans), as a tube. */
export function hangingRope(from,to,{sag=.25,radius=.022,segments=10,colour=PIER_COLOURS.rope}={}){
 const A=new THREE.Vector3(...from),B=new THREE.Vector3(...to),points=[];
 for(let i=0;i<=segments;i++){const t=i/segments,p=A.clone().lerp(B,t);p.y-=sag*4*t*(1-t);points.push(p);}
 const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),segments*2,radius,5,false);g.deleteAttribute('uv');return coloured(g,colour);
}

/**
 * Draws the plan into `parent`. Returns {group, colliders, timber, piles}. Colliders: the rails (people lean on them,
 * nobody walks through them) and the bollards; a kerb and a cleat are stepped over.
 */
export function buildTimberPier(parent,plan,{shadows=false,ropes=[],colliderTag={}}={}){
 const T=PIER_TIMBER,C=PIER_COLOURS,L=plan.levels,group=new THREE.Group();group.name='Timber pier: '+plan.id;parent.add(group);
 const timber=[],iron=[],kerbs=[],under=[];
 // 4. Boards, each a shade apart (as boards are: one plank never weathers like the next), and the dark sheet under them.
 for(const b of plan.boards){const tone=b.index%3===1?C.boardAlt:b.index%5===3?C.boardDark:C.board;timber.push(boxAt(b.maxX-b.minX,T.board.thickness,b.maxZ-b.minZ,(b.minX+b.maxX)/2,plan.top-T.board.thickness/2,(b.minZ+b.maxZ)/2,tone));}
 for(const d of plan.decks)under.push(boxAt(d.maxX-d.minX-.02,.008,d.maxZ-d.minZ-.02,(d.minX+d.maxX)/2,L.boardBottom-.006,(d.minZ+d.maxZ)/2,C.underlay));
 // 3. Stringers, 2. caps.
 for(const d of plan.decks){
  for(const s of d.stringers)under.push(boxAt(T.stringer.width,T.stringer.depth,s.maxZ-s.minZ,s.x,(L.stringerTop+L.stringerBottom)/2,(s.minZ+s.maxZ)/2,C.frame));
  for(const c of d.caps)under.push(boxAt(c.maxX-c.minX,T.cap.depth,T.cap.width,(c.minX+c.maxX)/2,(L.capTop+L.capBottom)/2,c.z,C.cap));
 }
 // 5. Kerbs along the open edges, a little sunk into the boards so they never share a face with them.
 for(const k of plan.kerbs){const [ax,az]=k.from,[bx,bz]=k.to,len=Math.hypot(bx-ax,bz-az),alongX=Math.abs(bx-ax)>Math.abs(bz-az);
  kerbs.push(boxAt(alongX?len:T.kerb.width,T.kerb.height+.01,alongX?T.kerb.width:len,(ax+bx)/2,plan.top+T.kerb.height/2-.005,(az+bz)/2,C.kerb));}
 // Rails: posts, a mid rail and a broad top rail to lean on; the kerb under them is the toe board.
 const colliders=[];
 for(const r of plan.rails)for(const run of r.runs){
  const [ax,az]=run.from,[bx,bz]=run.to,len=Math.hypot(bx-ax,bz-az),alongX=Math.abs(bx-ax)>Math.abs(bz-az),cx=(ax+bx)/2,cz=(az+bz)/2,R=T.rail;
  for(const [x,z] of run.posts)timber.push(boxAt(R.post,R.height-.02,R.post,x,plan.top+(R.height-.02)/2,z,C.rail));
  timber.push(boxAt(alongX?len:R.cap[0],R.cap[1],alongX?R.cap[0]:len,cx,plan.top+R.height,cz,C.rail));
  timber.push(boxAt(alongX?len:R.mid[1],R.mid[0],alongX?R.mid[1]:len,cx,plan.top+.5,cz,C.rail));
  // (as thick as its posts: the cap's lip over the water is not something to walk into)
  colliders.push({id:plan.id+'-rail',x:cx,z:cz,w:alongX?len:R.post+.01,d:alongX?R.post+.01:len,height:plan.top+R.height+.03,timberPier:plan.id,...colliderTag});
 }
 // A chain across each rail gap: a ladder's opening is closed when nobody is using it.
 for(const r of plan.rails)for(let i=1;i<r.runs.length;i++){const a=r.runs[i-1].to,b=r.runs[i].from;iron.push(hangingRope([a[0],plan.top+.85,a[1]],[b[0],plan.top+.85,b[1]],{sag:.12,radius:.012,segments:8,colour:C.safety}));}
 // Fender piles with a rubber face where a boat lies.
 const fenderTop=plan.top+T.fender.top;
 for(const f of plan.fenders){
  // The rubber face on the pile's outboard side, from below low water to above the deck; a short waler bolts the
  // pile back to the pier's edge (f.edge, the deck edge it stands off), so it is part of the frame, not a stick in the water.
  const out=f.face==='east'?1:-1,r=T.fender.radius+T.fender.rubber/2;
  iron.push(boxAt(T.fender.rubber,fenderTop-(SEA_LEVEL-.35),.1,f.x+out*r,(fenderTop+SEA_LEVEL-.35)/2,f.z,C.rubber));
  const edge=f.edge??f.x-out*.3;timber.push(boxAt(Math.abs(f.x-edge)+.1,.12,.12,(f.x+edge)/2,L.capTop-.07,f.z,C.frame));
 }
 // Ladders: galvanised stringers and rungs from the deck edge to below low water.
 for(const l of plan.ladders){
  const alongX=l.face==='north'||l.face==='south',half=.22,out=l.face==='west'||l.face==='south'?-.06:.06;
  for(const s of [-half,half]){const a=alongX?[l.x+s,plan.top+.02,l.z+out]:[l.x+out,plan.top+.02,l.z+s],b=alongX?[l.x+s,l.bottom,l.z+out]:[l.x+out,l.bottom,l.z+s];iron.push(rodBetween(a,b,.024,C.galv));}
  for(let y=plan.top-.22;y>l.bottom+.05;y-=.28){const a=alongX?[l.x-half,y,l.z+out]:[l.x+out,y,l.z-half],b=alongX?[l.x+half,y,l.z+out]:[l.x+out,y,l.z+half];iron.push(rodBetween(a,b,.017,C.galv));}
  // Grab handles above the deck either side of the opening.
  for(const s of [-half,half]){const base=alongX?[l.x+s,plan.top,l.z+out*.5]:[l.x+out*.5,plan.top,l.z+s];iron.push(rodBetween(base,[base[0],plan.top+.75,base[2]],.022,C.galv));}
 }
 // Cleats: a cast horn on a timber pad. Bollards: a cast post with a cap, bolted through a timber base plate.
 for(const c of plan.cleats){const ry=c.along==='x'?0:Math.PI/2,y=plan.top+(c.onKerb?T.kerb.height-.005:0);
  // On a kerb the cleat is bolted straight to it; on the boards it has a pad of its own.
  if(!c.onKerb)timber.push(boxAt(.36,.03,.16,c.x,y+.01,c.z,C.boardDark,ry));
  iron.push(boxAt(.3,.035,.06,c.x,y+.085,c.z,C.iron,ry));iron.push(boxAt(.07,.065,.07,c.x,y+.04,c.z,C.iron,ry));}
 for(const b of plan.bollards){
  // The pads are offcuts of the deck's own boards (the rulebook's timber deck), the darker ones.
  timber.push(boxAt(.46,.04,.46,b.x,plan.top+.015,b.z,C.boardDark));
  const post=new THREE.CylinderGeometry(.12,.14,.34,10);post.translate(b.x,plan.top+.2,b.z);iron.push(coloured(post,C.iron));
  const head=new THREE.CylinderGeometry(.17,.15,.06,10);head.translate(b.x,plan.top+.39,b.z);iron.push(coloured(head,C.iron));
  colliders.push({id:plan.id+'-bollard',x:b.x,z:b.z,w:.46,d:.46,height:plan.top+.42,timberPier:plan.id,...colliderTag});
 }
 for(const r of ropes)iron.push(hangingRope(r.from,r.to,r));
 // The colours ride in the vertices; the material carries a mid grey and the vertices are lifted to match, so the cel
 // pass (render/cel.js bandsFor) gives the timber the same three-band ramp as every other timber in town rather than
 // the high-key ramp it keeps for white plaster.
 const BASE=.4,lift=list=>{for(const g of list){const c=g.attributes.color;for(let i=0;i<c.array.length;i++)c.array[i]/=BASE;}};
 lift(timber);lift(kerbs);lift(under);
 const timberMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,color:new THREE.Color(BASE,BASE,BASE)});timberMat.name='pier-timber';
 const ironMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:.3});ironMat.name='pier-iron';
 const nonIndexed=list=>list.map(g=>{const n=g.index?g.toNonIndexed():g;if(n!==g)g.dispose();if(n.attributes.uv)n.deleteAttribute('uv');return n;});
 const frame=new THREE.Mesh(mergeGeometries(nonIndexed(timber),false),timberMat);frame.name='Pier timber frame and deck';frame.castShadow=shadows;frame.receiveShadow=true;group.add(frame);
 // The frame under the boards (caps, stringers, the sheet) is structure, seen only past the boards' ends: its own mesh.
 const underMesh=new THREE.Mesh(mergeGeometries(nonIndexed(under),false),timberMat);underMesh.name='Pier frame under the deck';underMesh.castShadow=shadows;underMesh.receiveShadow=true;group.add(underMesh);
 // The kerbs (toe boards) are the pier's edge, as a coping is a quay's: a mesh of their own, so they read as an edge.
 let kerbMesh=null;if(kerbs.length){kerbMesh=new THREE.Mesh(mergeGeometries(nonIndexed(kerbs),false),timberMat);kerbMesh.name='Pier kerb (toe boards)';kerbMesh.castShadow=shadows;kerbMesh.receiveShadow=true;group.add(kerbMesh);}
 let ironMesh=null;if(iron.length){ironMesh=new THREE.Mesh(mergeGeometries(nonIndexed(iron),false),ironMat);ironMesh.name='Pier ironwork and rope';ironMesh.castShadow=shadows;ironMesh.receiveShadow=true;group.add(ironMesh);}
 // 1. Piles, instanced: the bearing piles under the caps, the fender piles to their own height.
 const pileMesh=(list,top,radius)=>{if(!list.length)return null;const geometry=pileGeometry(top,plan.seabed,radius);lift([geometry]);const m=new THREE.InstancedMesh(geometry,timberMat,list.length);
  const o=new THREE.Object3D();list.forEach((p,i)=>{o.position.set(p.x,0,p.z);o.updateMatrix();m.setMatrixAt(i,o.matrix);});m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();m.castShadow=shadows;m.receiveShadow=true;group.add(m);return m;};
 const piles=pileMesh(plan.piles,L.pileTop+.01,T.pile.radius);if(piles)piles.name='Pier bearing piles';
 const fenders=pileMesh(plan.fenders,fenderTop,T.fender.radius);if(fenders)fenders.name='Pier fender piles';
 return {group,colliders,frame,under:underMesh,kerbs:kerbMesh,iron:ironMesh,piles,fenders};
}
