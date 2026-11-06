import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {SAKURA_LAYOUT,AISLE_LEVELS,CHILLER,BUN_STEAMER,FRONT_ENDCAPS,COPY_MACHINE,SAKURA_TILL_FLOOR} from './sakura-layout.js';
import {MEDICINE_SHELF} from './sakura-dressing.js';
import {BACKROOM} from './sakura-backroom.js';
import {RESTROOM} from './sakura-restroom.js';
import {MAGAZINE_RACK} from './sakura-magazine-rack.js';

/**
 * Sakura Shōten, built: the family shop Thuan keeps, drawn from scratch to the shop's own
 * measurements (sakura-layout.js) instead of the supplied convenience-store model, which
 * came with no licence (docs/AMPLIFY-AUDIT.md, B5).
 *
 * A 1960s harbour shōten that has taken on konbini habits: terrazzo floor, honey-wood
 * wainscot under cream plaster, a ceiling of white boards on dark beams with bare tubes
 * on battens and a striped till canopy over the counter; wooden gondolas with green end
 * panels and cream price rails; a long wooden counter; the glass bun cabinet on the west
 * wall with dagashi jars on top; the medicine boards
 * behind the till; a steel rack in the back room; the office and the restroom.
 *
 * The meshes keep the names the rest of the shop looks for: `sakura-building` (the
 * shell, hidden when the shop is seen from the street), `sakura-ceiling`, `sakura-floor`,
 * `sakura-counter`, `sakura-shelf` (wall shelving), `sakura-shelf <island>` and
 * `sakura-shelf-ends <island>` (the three gondolas), `sakura-light` (the tubes, which
 * glow), `sakura-door` and `sakura-toilet`. POS detail lives in sakura-counter-detail.js. Each shell part is one draw: every
 * piece is a box with a vertex colour, merged by name. Shelf tops are taken from the
 * stock layout itself, so every product stands on a board.
 */
export const SAKURA_SHELL=Object.freeze({
 ceiling:2.98,floorFront:3.91,partitionZ:-3.99,backZ:-6.86,westX:-6.86,eastX:6.86,backWestX:-5.76,backEastX:5.76,
 /** The shop's colours, in one place. */
 colours:Object.freeze({
  plaster:0xf3ead6,wainscot:0x9c7148,wainscotDark:0x6e4c30,ceiling:0xf6f1e6,beam:0x8a5a36,
  wood:0xb08a5e,woodDark:0x7f5a38,spine:0xe7dfc8,end:0x3f6e58,rail:0xf5ecd6,plinth:0x5a4636,
  steel:0x9aa4a6,concrete:0xb9b6ac,tile:0xd8e8e0,porcelain:0xf6f4ee,
 }),
});

/** Island footprints, read off the colliders the layout already moves with them. */
export const SAKURA_ISLANDS=Object.freeze({
 east:SAKURA_LAYOUT.colliders[0],middle:SAKURA_LAYOUT.colliders[1],endcap:SAKURA_LAYOUT.colliders[2],west:SAKURA_LAYOUT.colliders[3],
});

const C=SAKURA_SHELL.colours;
function parts(name){
 const list=[],colour=new THREE.Color();
 const box=(w,h,d,x,y,z,hex,{ry=0}={})=>{
  if(w<=0||h<=0||d<=0)return;
  const g=new THREE.BoxGeometry(w,h,d);if(ry)g.rotateY(ry);g.translate(x,y,z);g.deleteAttribute('uv');
  colour.set(hex);const n=g.attributes.position.count,c=new Float32Array(n*3);for(let i=0;i<n;i++)c.set([colour.r,colour.g,colour.b],i*3);
  g.setAttribute('color',new THREE.BufferAttribute(c,3));list.push(g);
 };
 /** A box by its extents. */
 const span=(x0,x1,y0,y1,z0,z1,hex)=>box(x1-x0,y1-y0,z1-z0,(x0+x1)/2,(y0+y1)/2,(z0+z1)/2,hex);
 const cyl=(r,h,x,y,z,hex,seg=12)=>{const g=new THREE.CylinderGeometry(r,r,h,seg);g.translate(x,y,z);g.deleteAttribute('uv');colour.set(hex);const n=g.attributes.position.count,c=new Float32Array(n*3);for(let i=0;i<n;i++)c.set([colour.r,colour.g,colour.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(c,3));list.push(g.index?g.toNonIndexed():g);};
 const mesh=(material)=>{
  const geometries=list.map(g=>g.index?g.toNonIndexed():g);
  const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
  // Indexed, so the triangles can be counted and picked out the way the old model's were.
  merged.setIndex(Array.from({length:merged.attributes.position.count},(_,i)=>i));
  merged.computeBoundingBox();merged.computeBoundingSphere();
  const m=new THREE.Mesh(merged,material);m.name=name;m.receiveShadow=true;return m;
 };
 return {box,span,cyl,mesh};
}

const material=(extra={})=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82,...extra});

/** Walls, floor and ceiling of the shop floor, the back room, the office and the restroom. */
function buildShell(){
 const {span,box,mesh}=parts('sakura-building');
 const S=SAKURA_SHELL,top=S.ceiling,W=S.westX,E=S.eastX,F=S.floorFront,P=S.partitionZ,B=S.backZ;
 // A wall with its wainscot: wood to 0.88 m under a dark rail to 0.94, plaster above. Each course starts where the last
 // ends: the wood run up into the rail put the two boards' ends in one plane (the Sakura surface audit, SK-ZF rev A).
 // A wall whose inner face is exactly on the line given, built outward from it, with its
 // wainscot: wood to 0.9 m, a dark rail, plaster above. `face` points into the room.
 const wallX=(x,z0,z1,face)=>{const t=.08;
  span(Math.min(x,x-face*t),Math.max(x,x-face*t),0,top,z0,z1,C.plaster);
  const at=(d,w)=>[Math.min(x+face*d,x+face*(d+w)),Math.max(x+face*d,x+face*(d+w))];
  span(...at(0,.018),.08,.88,z0,z1,C.wainscot);span(...at(0,.03),.88,.94,z0,z1,C.wainscotDark);span(...at(0,.025),0,.08,z0,z1,C.wainscotDark);};
 const wallZ=(z,x0,x1,face,{wains=true}={})=>{const t=.08;
  span(x0,x1,0,top,Math.min(z,z-face*t),Math.max(z,z-face*t),C.plaster);
  if(!wains)return;
  const at=(d,w)=>[Math.min(z+face*d,z+face*(d+w)),Math.max(z+face*d,z+face*(d+w))];
  span(x0,x1,.08,.88,...at(0,.018),C.wainscot);span(x0,x1,.88,.94,...at(0,.03),C.wainscotDark);span(x0,x1,0,.08,...at(0,.025),C.wainscotDark);};
 // Shop floor: west and east walls; the partition with its passage (x 3.25..4.39) to the back.
 wallX(W+.04,P,F,1);wallX(E-.04,P,F,-1);
 wallZ(P+.04,-3.96,3.25,1);wallZ(P+.04,4.39,E,1);wallZ(P+.04,W,-3.96,1,{wains:false});
 span(3.25,4.39,2.2,top,P-.04,P+.04,C.plaster);
 // The back room: concrete, plain, its own walls round x -5.76..5.76.
 for(const [x,face] of [[S.backWestX,-1],[S.backEastX,1]])span(x-.04,x+.04,0,top,B,P-.04,C.concrete);// up to the partition's back face, not into it
 span(S.backWestX,S.backEastX,0,top,B-.08,B,C.concrete);
 // The delivery door in the back wall, steel, painted green.
 span(3.0,4.3,0,2.3,B+.005,B+.05,0x4f7a64);span(3.85,4.15,1.0,1.08,B+.05,B+.09,C.steel);
 // The office (x 4.6..6.8, z -3.95..-1.17): its west wall and the front with its doorway.
 span(4.56,4.64,0,top,P,-1.25,C.plaster);span(4.57,5.14,0,top,-1.21,-1.13,C.plaster);span(6.28,E,0,top,-1.21,-1.13,C.plaster);span(5.14,6.28,2.2,top,-1.21,-1.13,C.plaster);
 span(4.64,4.66,.08,.9,P,-1.25,C.wainscot);
 // The restroom (x -6.82..-4.09, z -3.95..-2.58): its east wall with the doorway at z -3.66..-2.78, and its front.
 span(-4.08,-3.96,0,top,P,-3.66,C.plaster);span(-4.08,-3.96,0,top,-2.78,-2.42,C.plaster);span(-4.08,-3.96,2.2,top,-3.66,-2.78,C.plaster);
 span(W,-3.96,0,top,-2.54,-2.42,C.plaster);
 // Skirting where floors meet: a thin dark line round the back room.
 span(S.backWestX,S.backEastX,0,.1,B,B+.02,0x77746c);
 // Ceiling beams across the shop, dark wood on the white boards.
 for(let x=-6.2;x<=6.3;x+=1.55)span(x-.07,x+.07,top-.16,top,P,F,C.beam);
 span(W,E,top-.12,top,-.02-.06,-.02+.06,C.beam);
 return mesh(material());
}

/** Indoor facade; the street storefront supplies its own frame outside. */
function buildFrontFrame(){
 const {span,mesh}=parts('sakura-front-frame');
 const S=SAKURA_SHELL,W=S.westX,E=S.eastX,F=S.floorFront,top=S.ceiling;
 // The front: no glass here (the storefront has it), only the frame. A kick panel under
 // each pane, posts between them, the transom bar and a band of wall to the ceiling.
 const doorHalf=.95;
 for(const [x0,x1] of [[W,-doorHalf],[doorHalf,E]]){
  span(x0,x1,0,.32,F-.04,F+.06,C.wainscotDark);
  const n=Math.max(1,Math.round((x1-x0)/1.45));
  // Posts stand 5 mm proud of the kick panels and the door posts 5 mm proud of the transom, never flush.
  for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n;span(x-.05,x+.05,0,2.55,F-.045,F+.065,C.woodDark);}
 }
 span(W,E,2.5,2.6,F-.05,F+.07,C.woodDark);span(W,E,2.6,top,F-.03,F+.05,C.plaster);
 for(const x of [-doorHalf,doorHalf])span(x-.06,x+.06,0,2.6,F-.055,F+.075,C.woodDark);
 return mesh(material());
}

/** Floors laid flush in the terrazzo, which is cut round them: the till's tiles and the restroom's mosaic. */
export const SAKURA_FLOOR_INSETS=Object.freeze([...SAKURA_TILL_FLOOR,Object.freeze({x0:RESTROOM.minX,x1:RESTROOM.maxX,z0:RESTROOM.minZ,z1:RESTROOM.maxZ})]);
/**
 * A level floor from x0..x1 by z0..z1 at height y, with rectangular holes cut where another floor is laid flush (the
 * till's tiles): cut into the cells of a grid through the holes' edges, so the two floors meet edge to edge and never
 * share a plane. UVs are those of a PlaneGeometry of the whole floor laid flat, so a repeated texture is unchanged.
 */
export function floorWithout(x0,x1,z0,z1,holes=[],y=0){
 const cut=(lo,hi,keys)=>[...new Set([lo,hi,...keys.map(v=>Math.min(hi,Math.max(lo,v)))])].sort((a,b)=>a-b);
 const xs=cut(x0,x1,holes.flatMap(h=>[h.x0,h.x1])),zs=cut(z0,z1,holes.flatMap(h=>[h.z0,h.z1]));
 const W=x1-x0,D=z1-z0,pos=[],uv=[],u=x=>(x-x0)/W,v=z=>(z1-z)/D;
 for(let i=0;i+1<xs.length;i++)for(let k=0;k+1<zs.length;k++){
  const a=xs[i],b=xs[i+1],c=zs[k],d=zs[k+1],mx=(a+b)/2,mz=(c+d)/2;
  if(b-a<1e-9||d-c<1e-9||holes.some(h=>mx>h.x0&&mx<h.x1&&mz>h.z0&&mz<h.z1))continue;
  // Two triangles facing up: (a,d) (b,d) (b,c) and (a,d) (b,c) (a,c).
  for(const [x,z] of [[a,d],[b,d],[b,c],[a,d],[b,c],[a,c]]){pos.push(x,y,z);uv.push(u(x),v(z));}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('normal',new THREE.Float32BufferAttribute(pos.map((_,i)=>i%3===1?1:0),3));
 g.computeBoundingBox();g.computeBoundingSphere();return g;
}

function buildCeilingAndFloor(page){
 const S=SAKURA_SHELL,out=[];
 {const {span,mesh}=parts('sakura-ceiling');
  span(S.westX,S.eastX,S.ceiling,S.ceiling+.04,S.partitionZ,S.floorFront,C.ceiling);
  // Open the ceiling over both flights and the turning landing.
  span(-.6,S.backEastX,S.ceiling,S.ceiling+.04,S.backZ,S.partitionZ,0xe6e2d8);
  out.push(mesh(material()));}
 // Terrazzo on the shop floor, grey concrete in the back room.
 // A shade under white, so the tubes' sheen (sakura-surfaces.js) shows on it.
 const floorMat=new THREE.MeshStandardMaterial({color:0xd9d6cf,roughness:.6});
 if(page){
  // One 60 cm tile: a pale, slightly cool terrazzo with a fine joint round it, as a
  // konbini floor is laid. Brighter than it was, so the tubes' sheen reads on it.
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
  ctx.fillStyle='#efebe2';ctx.fillRect(0,0,512,512);
  let seed=3;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let i=0;i<2600;i++){ctx.fillStyle=['#cfc6b4','#bdb3a0','#faf8f2','#aea493','#d9d0bf','#c3cbc9'][i%6];const s=1+rnd()*4;ctx.fillRect(rnd()*512,rnd()*512,s,s);}
  ctx.strokeStyle='#d2c9b6';ctx.lineWidth=4;ctx.strokeRect(0,0,512,512);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set((S.eastX-S.westX)/.6,(S.floorFront-S.partitionZ)/.6);t.anisotropy=8;
  floorMat.map=t;
 }else floorMat.color.setHex(0xe9e1cf);
 const shopFloor=new THREE.Mesh(floorWithout(S.westX,S.eastX,S.partitionZ,S.floorFront,SAKURA_FLOOR_INSETS),floorMat);
 shopFloor.name='sakura-floor';shopFloor.receiveShadow=true;out.push(shopFloor);
 const back=new THREE.Mesh(new THREE.PlaneGeometry(S.backEastX-S.backWestX,S.partitionZ-S.backZ),new THREE.MeshStandardMaterial({color:0xb4b1a8,roughness:.9}));
 back.rotation.x=-Math.PI/2;back.position.set(0,.001,(S.partitionZ+S.backZ)/2);back.name='sakura-floor back room';back.receiveShadow=true;out.push(back);
 return out;
}

/**
 * One gondola, from its collider: a plinth, a cream spine down the middle with a header
 * board, four wooden boards each side at the aisle levels, price rails, and green end panels.
 */
function buildIsland(id){
 const R=SAKURA_ISLANDS[id],shelf=parts('sakura-shelf '+id),ends=parts('sakura-shelf-ends '+id);
 const x0=R.x-R.w/2,x1=R.x+R.w/2,z0=R.z-R.d/2,z1=R.z+R.d/2,inZ0=z0+.05,inZ1=z1-.05;
 shelf.span(x0+.04,x1-.04,0,.12,inZ0,inZ1,C.plinth);
 shelf.span(R.x-.02,R.x+.02,.12,1.48,inZ0,inZ1,C.spine);
 for(const side of [-1,1]){
  const a=side<0?x0+.01:R.x+.02,b=side<0?R.x-.02:x1-.01;
  shelf.span(a,b,.12,.2,inZ0,inZ1,C.wood);
  for(const level of AISLE_LEVELS){
   shelf.span(a,b,level-.022,level,inZ0,inZ1,C.wood);
   // The price rail on the board's lip, 3 mm proud of the board's edge: flush with it, the two faces fought.
   const lip=side<0?a:b;shelf.span(Math.min(lip+side*.003,lip-side*.015),Math.max(lip+side*.003,lip-side*.015),level-.05,level+.012,inZ0,inZ1,C.rail);
  }
 }
 // Two compact bays on the daily-goods island, with a visible upright between them.
 if(id==='east')ends.span(x0,x1,.12,1.47,R.z-.018,R.z+.018,C.end);// 1 cm under the spine's top
 // A header board on the spine with the shop's hand-painted aisle card.
 shelf.span(R.x-.015,R.x+.015,1.48,1.5,inZ0,inZ1,C.woodDark);
 for(const z of [z0+.025,z1-.025])ends.span(x0,x1,0,1.5,z-.025,z+.025,C.end);
 for(const z of [z0+.025,z1-.025])ends.span(x0+.05,x1-.05,1.1,1.36,z+(z<R.z?-.03:.03)-.004,z+(z<R.z?-.03:.03)+.004,C.rail);
 return [shelf.mesh(material()),ends.mesh(material())];
}

/** The middle island's end cap, facing the door: the month's offer stacked on two boards. */
function buildEndcap(){
 const R=SAKURA_ISLANDS.endcap,{span,mesh}=parts('sakura-shelf-ends endcap');
 const x0=R.x-R.w/2,x1=R.x+R.w/2,z0=R.z-R.d/2,z1=R.z+R.d/2;
 span(x0+.03,x1-.03,0,.12,z0+.03,z1,C.plinth);
 span(x0,x1,0,1.55,z1-.04,z1,C.end);
 for(const x of [x0,x1-.04])span(x,x+.04,0,1.2,z0,z1,C.end);
 for(const level of [.202,.805])span(x0+.04,x1-.04,level-.022,level,z0+.02,z1-.04,C.wood);
 span(x0+.08,x1-.08,1.22,1.5,z1-.06,z1-.04,C.rail);
 return mesh(material());
}

/** The front end caps (FRONT_ENDCAPS): two boards and a header card, facing the window. */
function buildFrontEndcaps(){
 const {span,mesh}=parts('sakura-shelf-ends front');
 for(const E of FRONT_ENDCAPS){
  const x0=E.x-E.w/2,x1=E.x+E.w/2,z0=E.z-E.d/2,z1=E.z+E.d/2;
  span(x0+.03,x1-.03,0,.12,z0,z1-.03,C.plinth);
  span(x0,x1,0,1.5,z0,z0+.04,C.end);
  for(const x of [x0,x1-.04])span(x,x+.04,0,1.2,z0,z1,C.end);
  for(const level of E.levels)span(x0+.04,x1-.04,level-.022,level,z0+.04,z1-.02,C.wood);
  span(x0+.08,x1-.08,1.22,1.46,z0+.04,z0+.06,C.rail);
 }
 return mesh(material());
}

/** Wall shelving: the open chiller, the bun steamer, the copy machine, the delivery shelf, the medicine boards and the back-room rack. */
function buildWallShelving(){
 const {span,cyl,mesh}=parts('sakura-shelf');
 // The open chiller on the west wall (CHILLER): a dark well at the foot, four stepped
 // decks narrowing as they rise, a white back, end panels and a lit canopy on top.
 {const K=CHILLER,L=K.levels;
  // Well, lip, back and canopy run between the two end panels (z ±0.03 round K.z0 and K.z1), not into them.
  span(K.x0,K.x1,0,L[0]-.02,K.z0+.03,K.z1-.03,0x3a4a50);
  span(K.x1-.06,K.x1,L[0]-.02,L[0]+.1,K.z0+.03,K.z1-.03,0xdfe6e8);
  L.forEach((y,i)=>{const front=K.x1-.06-i*.08;span(K.x0,front,y-.025,y,K.z0+.02,K.z1-.02,0xe9eeef);span(front-.012,front+.003,y-.03,y+.05,K.z0+.03,K.z1-.03,C.rail);});// rails 3 mm proud of the decks, ends in the end panels
  span(K.x0,K.x0+.04,L[0],K.canopy,K.z0+.03,K.z1-.03,0xf4f6f6);
  for(const z of [K.z0,K.z1])span(K.x0,K.x1,0,K.canopy+.18,z-.03,z+.03,0x2f5f4a);
  span(K.x0,K.x1-.18,K.canopy,K.canopy+.18,K.z0+.03,K.z1-.03,0x2f5f4a);
  span(K.x1-.2,K.x1-.16,K.canopy-.02,K.canopy+.02,K.z0+.05,K.z1-.05,0xfffbee);
  // The two bays' dividers, so each pair of lines reads as its own section.
  for(const z of [-.27,1.11])span(K.x0+.04,K.x1-.3,L[0],K.canopy,z-.012,z+.012,0xcfd8da);}
 // The bun steamer on the counter (BUN_STEAMER): a steel base, glass all round, two racks.
 {const B=BUN_STEAMER,x0=B.x-B.w/2,x1=B.x+B.w/2,z0=B.z-B.d/2,z1=B.z+B.d/2,y0=B.top;
  span(x0,x1,y0,y0+.06,z0,z1,0xc9ced2);span(x0,x1,y0+B.h-.04,y0+B.h,z0,z1,0xd7263d);
  span(x1-.02,x1,y0+.06,y0+B.h-.04,z0,z1,0xc9ced2);
  for(const y of [B.top+.02,B.top+.215])span(x0+.02,x1-.02,y-.006,y,z0+.02,z1-.02,0xb8bec0);}
 // The copy machine by the east window, with the fax on its own little table beside it.
 {const M=COPY_MACHINE,x0=M.x-M.w/2,x1=M.x+M.w/2,z0=M.z-M.d/2,z1=M.z+M.d/2;
  span(x0,x1,0,.08,z0,z1,0x3a3e40);span(x0,x1,.08,.9,z0,z1,0xe9e6dc);span(x0+.02,x1-.02,.9,.96,z0+.02,z1-.02,0x5d6a70);
  span(x0+.08,x0+.34,.97,.99,z0+.06,z0+.2,0x2a6a3a);span(x0+.06,x1-.06,.5,.54,z0-.02,z0,0xb8bec0);
  span(x1+.05,x1+.45,0,.7,z0+.1,z1-.05,C.woodDark);span(x1+.1,x1+.4,.7,.82,z0+.15,z1-.12,0xe9e6dc);span(x1+.12,x1+.25,.82,.86,z0+.2,z0+.35,0x2b2e30);}
 // The delivery shelf by the restroom (x -6.19..-4.15, z -2.47..-1.86): bare steel.
 for(const y of [.088,.357,.670,.983,1.296])span(-6.167,-4.173,y-.02,y,-2.457,-1.873,C.steel);// 3 mm inside the uprights' faces
 for(const x of [-6.15,-4.19])for(const z of [-2.45,-1.88])span(x-.02,x+.02,0,1.45,z-.02,z+.02,0x7d878a);
 // The medicine boards behind the till, over the cabinet, and the cupboard beside it.
 const M=MEDICINE_SHELF;
 span(M.back-.01,M.back+.03,.98,2.1,M.minZ-.08,M.maxZ+.08,C.woodDark);
 // The boards end on the side panels and the top sits on them: run through them, their faces shared the panels' planes.
 for(const y of M.levels)span(M.front-.02,M.back,y-.02,y,M.minZ-.06,M.maxZ+.06,C.wood);
 for(const z of [M.minZ-.08,M.maxZ+.08])span(M.front-.02,M.back+.03,.98,2.1,z-.02,z+.02,C.woodDark);
 span(M.front-.025,M.back+.03,2.08,2.12,M.minZ-.08,M.maxZ+.08,C.woodDark);// the top 5 mm proud of the panels' fronts
 span(6.24,6.73,0,.9,1.88,3.52,C.wainscot);span(6.22,6.73,.9,.94,1.88,3.52,C.woodDark);
 // The back-room rack: two steel units, four boards.
 const K=BACKROOM.rack;
 for(const [a,b] of K.units){
  // Boards 3 mm inside the uprights' outer faces, so board ends and uprights never share a plane.
  for(const y of K.levels)span(a+.003,b-.003,y-.025,y,K.front+.003,K.back-.003,C.steel);
  for(const x of [a+.02,b-.02])for(const z of [K.front+.02,K.back-.02])span(x-.02,x+.02,0,2.25,z-.02,z+.02,0x6f7a7c);
 }
 // The magazine rack's plinth so it does not float on the terrazzo.
 const R=MAGAZINE_RACK;if(R.placed)span(R.x-R.width/2,R.x+R.width/2,0,.06,R.z-R.depth/2,R.z+R.depth/2,C.plinth);
 return mesh(material());
}

/**
 * The counter, the way a 1990s konbini till reads: a long run of warm wood-veneer bays
 * framed in dark rails, a pale laminate top with a dark edge band, and a black kick
 * plinth set back underneath. Top at the shared service-counter height; the customer stands at x < 4.54.
 */
export const SAKURA_COUNTER=Object.freeze({x0:4.54,x1:5.06,z0:.08,z1:3.86,top:FURNITURE_HEIGHTS.serviceCounter,bay:.62});
function buildCounter(){
 const {span,mesh}=parts('sakura-counter');
 const {x0,x1,z0,z1,top,bay}=SAKURA_COUNTER,rail=0x87968e,veneer=0xdde2d7,laminate=0xf0eee4;
 span(x0+.06,x1,0,.12,z0,z1,0x2a2420);
 span(x0,x1,.12,top-.04,z0,z1,0xd1d9ce);
 // The customer face: a rail along the foot and the head, a stile between every bay.
 span(x0-.02,x0,.12,.19,z0,z1,rail);span(x0-.02,x0,top-.13,top-.04,z0,z1,rail);
 const bays=Math.round((z1-z0)/bay),w=(z1-z0)/bays;
 for(let i=0;i<bays;i++){const a=z0+i*w;span(x0-.014,x0,.19,top-.13,a+.03,a+w-.03,veneer);}
 for(let i=0;i<=bays;i++){const a=z0+i*w;span(x0-.02,x0,.12,top-.04,a-.03,a+.03,rail);}
 // The laminate top, overhanging the customer side, with its dark edge band.
 span(x0-.06,x1+.03,top-.04,top,z0-.03,z1+.03,laminate);
 span(x0-.075,x0-.055,top-.055,top+.004,z0-.035,z1+.035,rail);
 // The flap at the north end, where Thuan comes through.
 span(x0,x1,top,top+.02,z0,z0+.06,C.woodDark);
 return mesh(material());
}

/**
 * The tube runs, [x, z0, z1]: three down the shop, one over the counter, two in the stockroom, one in the small office.
 * The stockroom's pair stand east of the stairwell (x > -0.6, where its ceiling is): the western one used to hang at
 * x -2.2, over both flights where the ceiling was opened for the stair, a tube and batten in mid-air that the stair's
 * lens met as a ceiling 2.6 m up.
 */
export const TUBE_RUNS=Object.freeze([[-4.4,-3.2,3.2],[-1.2,-3.2,3.2],[2.4,-3.2,3.2],[5.6,.4,3.4],[.9,-6.4,-4.4],[3.7,-6.4,-4.4],[5.7,-3.6,-1.6]].map(Object.freeze));
/** The tubes, on wooden battens: two runs down the shop, one in the back room and the office. */
function buildTubes(){
 const {span,mesh}=parts('sakura-light'),y=SAKURA_SHELL.ceiling-.2;
 const runs=TUBE_RUNS;
 // Each tube ends within its run: the last of a run used to hang up to 0.8 m past it, through the partition into the
 // shop (the stockroom's) and through the small office's front wall (the office's), and met the wall band's cap there.
 for(const [x,z0,z1] of runs)for(let z=z0;z<z1-.4;z+=1.32)span(x-.03,x+.03,y-.03,y+.03,z,Math.min(z+1.2,z1),0xfffbee);
 // Two bare tubes under the till canopy, lighting the counter top.
 for(const x of [4.55,4.95])for(const z of [.3,1.8])span(x-.025,x+.025,2.12,2.17,z,z+1.6,0xfffbee);
 return mesh(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,emissive:0xfff3d6,emissiveIntensity:1}));
}
function buildBattens(){
 const {span,mesh}=parts('sakura-battens'),y=SAKURA_SHELL.ceiling-.13;
 for(const [x,z0,z1] of TUBE_RUNS)span(x-.07,x+.07,y-.04,y+.04,z0,z1-.4,C.wood);
 // Over the counter hangs the till canopy (sakura-cheer.js buildTillCanopy); its rods.
 for(const z of [.25,1.95,3.3])for(const x of [4.45,5.15])span(x-.012,x+.012,2.5,SAKURA_SHELL.ceiling,z-.012,z+.012,0x2b2b2b);
 return mesh(material());
}

function buildRestroomFittings(){
 const {span,cyl,mesh}=parts('sakura-toilet');
 // The toilet against the west wall, the basin and its mirror on the south wall.
 span(-6.8,-6.5,.35,.85,-3.5,-3.0,C.porcelain);span(-6.55,-6.0,.0,.38,-3.42,-3.08,C.porcelain);span(-6.55,-5.95,.38,.42,-3.47,-3.03,0xe8e4da);
 cyl(.04,.06,-6.65,.9,-3.25,0xc8ccd0,8);
 const R=RESTROOM;
 span(R.mirror.x-.22,R.mirror.x+.22,.78,.86,-3.92,-3.52,C.porcelain);span(R.mirror.x-.08,R.mirror.x+.08,0,.78,-3.9,-3.75,C.porcelain);
 return mesh(material());
}

function buildDoors(){
 const {span,mesh}=parts('sakura-door');
 // The passage to the back room: a frame and a swing door left open against the wall.
 const P=SAKURA_SHELL.partitionZ;
 // The frame stands 2 cm proud of the wall's wainscot (its face 1.8 cm off the plaster): at 6 cm it lay 2 mm from the
 // wainscot's face, and a thin line flashed beside the passage.
 // The jambs stop under the head.
 for(const x of [3.25,4.39])span(x-.05,x+.05,0,2.18,P-.06,P+.08,C.woodDark);span(3.2,4.44,2.18,2.26,P-.06,P+.08,C.woodDark);
 span(4.4,4.44,0,2.12,P+.08,P+1.02,0xe9e1cf);
 // The office doorway: jambs, head and a casing on the shop side. Its door swings
 // (sakura-life.js buildOfficeDoor). The restroom door stands open into the restroom.
 for(const x of [5.12,6.30])span(x-.04,x+.04,0,2.2,-1.25,-1.09,C.woodDark);
 span(5.08,6.34,2.16,2.24,-1.25,-1.09,C.woodDark);
 for(const [x0,x1] of [[5.0,5.08],[6.34,6.42]])span(x0,x1,0,2.32,-1.13,-1.1,C.woodDark);
 span(5.0,6.42,2.24,2.32,-1.13,-1.1,C.woodDark);
 span(-4.9,-4.08,0,2.15,-2.82,-2.78,0xd8cdb4);
 return mesh(material());
}

/** Builds the whole interior as one group, ready to be cloned into the room. */
export function buildSakuraShell(){
 const page=typeof document!=='undefined'&&!!document.createElement;
 const root=new THREE.Group();root.name='Sakura shōten interior';
 root.add(buildShell(),buildFrontFrame(),...buildCeilingAndFloor(page),buildWallShelving(),buildCounter(),buildTubes(),buildBattens(),buildRestroomFittings(),buildDoors(),buildEndcap(),buildFrontEndcaps());
 for(const id of ['east','middle','west'])root.add(...buildIsland(id));
 root.traverse(o=>{if(o.isMesh)o.receiveShadow=true;});
 return root;
}
