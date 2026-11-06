import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar,bodyVolume} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {normalizeRecipe} from '../src/avatars/recipe.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {ISLAND_OUTFITS} from '../src/avatars/outfits.js';
import {seatRooms,seatEdge} from './seat-edge.mjs';
installDOM();

/**
 * Seated, the body fits the seat and its own clothes (the owner, 21 October 2026, of a resident in a skirt on a park bench:
 * "her hands shouldn't clip through the skirt and the legs shouldn't clip through the bench"). For every kind of thing worn
 * below the waist (a skirt, a long skirt or a dress, the house dress after the bath, shorts, trousers) and every kind of
 * seat (a bench, a chair, a stool, a floor cushion), each said with its height and where its front edge is (seatFront):
 *  - no point of a leg, a shoe or what is worn on them is inside the seat's solid, beyond a few millimetres of contact (the
 *    thighs rest on its top, the knees bend over its front edge, the shins hang in front of it); only cloth sat on, pressed
 *    under a thigh where nothing can see it, may press as far as SAT_ON;
 *  - no point of a mitten, a forearm or an upper arm is inside what is worn below the waist: the drawn cloth of a skirt or a
 *    dress as it is fitted (towel-fit.js), or the legs of trousers or shorts as wide as they are drawn; and no mitten is in
 *    the body. The mittens rest on the lap, on top of the cloth.
 * Contact is allowed to a few millimetres (CONTACT), as the film collision rule has it.
 */
const CONTACT=.004,SAT_ON=.006;
const base=recipeFor('Thuan');
const dressed=(name,outfit)=>normalizeRecipe({...base,name,outfit:{...base.outfit,...outfit}});
const sundress=ISLAND_OUTFITS.find(o=>o.outfit.top==='sundress').outfit;
/** [name, recipe, what is worn ('clothes' or the after-bath house dress), the category] */
const BODIES=[
 ['Vy (pleated skirt)',recipeFor('Vy'),'clothes','skirt'],
 ['Ms Ganaha (skirt)',recipeFor('Ms Ganaha'),'clothes','skirt'],
 ['Mai (skirt, a child)',recipeFor('Mai'),'clothes','skirt'],
 ['Grandmother Higa (long skirt)',recipeFor('Grandmother Higa'),'clothes','dress'],
 ['a sundress',dressed('Sundress sitter',sundress),'clothes','dress'],
 ['Thao after the bath (house dress)',recipeFor('Thao'),'afterbath','dress'],
 ['Kōji (shorts)',recipeFor('Kōji'),'clothes','shorts'],
 ['Kai (shorts)',recipeFor('Kai'),'clothes','shorts'],
 ['Mr Fujita (trousers)',recipeFor('Mr Fujita'),'clothes','trousers'],
 ['Jun (trousers, round)',recipeFor('Jun'),'clothes','trousers'],
 ['Grandmother Sakurai (wide trousers)',dressed('Wide sitter',{bottom:'widepants'}),'clothes','trousers'],
];
/** The seats: the seat's top `h` over the floor, its `depth` from the front edge back, the mark `front` behind that edge,
 *  its `thick`ness (a slab; a floor cushion is solid to the floor). Two benches as the town's are, then the town's own
 *  chairs, stools, cushions and benches, each with its `front` as World says it and its depth and thickness as its mesh is
 *  drawn (seat-edge.mjs): the shallowest stool, the lowest, a dining chair, a counter stool, a floor cushion, the bath's
 *  tatami edge, a deep bench and a narrow one. */
const SEATS=[
 ['a park bench',{h:.46,depth:.45,front:.225,thick:.06}],
 ['a deep bench',{h:.5,depth:.6,front:.3,thick:.08}],
];
const REAL=[
 ['Tetsuo’s yard home','Sit at Tetsuo’s table','Tetsuo’s stool'],
 ['Umi-no-yu','Wash at the tap','a wash stool at Umi-no-yu'],
 ['a concrete family home','Sit at the dining table','a dining chair'],
 ['Minato and Sato Ramen','Sit at the counter','a counter stool at Minato'],
 ['a concrete family home','Sit at the tea table','a zabuton'],
 ['Umi-no-yu','Sit on the tatami','the tatami edge at Umi-no-yu'],
 ['domestic arrivals','Sit in domestic arrivals','the arrivals bench'],
 ['the clinic','Sit in the clinic waiting room','the clinic bench'],
];
const rooms=await seatRooms();
for(const [room,label,name] of REAL){
 const r=rooms.find(r=>r.name===room),seat=r.seats.find(s=>s.label===label).seat,edge=seatEdge(r.room,seat);
 SEATS.push([name,{h:seat.surfaceY-seat.position[1],depth:seat.front+edge.back,front:seat.front,thick:edge.thick}]);
}
function seeded(seed=7){let s=seed;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};}
function sit(recipe,outfit,seat,frames=90){
 const avatar=buildAvatar(recipe,{shadows:false});avatar.wear(outfit);const holder=new THREE.Group();holder.add(avatar.root);
 const rand=seeded(),own=fn=>{const o=Math.random;Math.random=rand;try{return fn();}finally{Math.random=o;}};
 const animator=own(()=>createAvatarAnimator(avatar,{random:rand}));
 for(let i=0;i<frames;i++){own(()=>animator.update(1/60,{seated:true,seatHeight:seat.h,seatFront:seat.front}));avatar.springs?.update(1/60);}
 holder.updateMatrixWorld(true);return avatar;
}
/** The drawn surface of a body as it is posed (world), each point with its bone and whether it is fitted cloth (towel-fit.js),
 *  drawn where the fit puts it. */
function drawn(avatar){
 const out=[],p=new THREE.Vector3(),rest=new THREE.Vector3();avatar.root.updateMatrixWorld(true);
 for(const mesh of avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'))){
  const g=mesh.geometry,P=g.attributes.position,I=g.attributes.skinIndex,F=g.attributes.towelFit,fit=F&&mesh.towelFit,names=mesh.skeleton.bones.map(b=>b.name);
  if(fit)fit.refresh();
  for(let i=0;i<P.count;i++){mesh.getVertexPosition(i,p);const cloth=!!fit&&F.getX(i)>.5;if(cloth)fit.fitPoint(p,F.getX(i),rest.fromBufferAttribute(P,i));
   out.push({p:p.clone().applyMatrix4(mesh.matrixWorld),bone:names[I.getX(i)],cloth});}
 }
 return out;
}
/** How deep a point is inside the seat's solid (metres; 0 outside). The holder faces -z: the front edge is at z = -front. */
function inSeat(p,s){
 const dz=Math.min(p.z+s.front,s.depth-s.front-p.z),dy=Math.min(s.h-p.y,p.y-(s.h-s.thick));
 return dz>0&&dy>0&&Math.abs(p.x)<1?Math.min(dz,dy):0;
}
const segment=(p,a,b)=>{const ab=b.clone().sub(a),t=THREE.MathUtils.clamp(p.clone().sub(a).dot(ab)/ab.lengthSq(),0,1);return p.distanceTo(a.clone().addScaledVector(ab,t));};
/** How wide each leg is drawn (from the thigh to the knee, and the knee to the ankle), as `limb` in build.js draws it. */
function legWidth(recipe,m){
 const b=recipe.outfit.bottom;
 const thigh=b==='shorts'?1.26:b==='widepants'?1.32:b==='culottes'?1.7:b==='cropped'?1.16:b==='suteteko'?1.3:1.02;
 return {thigh:m.legR*thigh,shin:m.legR*(b==='widepants'?1.32:1.02)};
}
/** What is worn below the waist, as a signed distance (negative inside): the torso and the legs at their drawn width. */
function lowerBody(avatar){
 const m=avatar.measure,vol=bodyVolume(avatar.recipe,m),b=avatar.bones,w=legWidth(avatar.recipe,m),at=n=>b[n].getWorldPosition(new THREE.Vector3());
 const hips=b.hips.matrixWorld.clone().invert(),q=new THREE.Vector3(),legs=[];
 for(const s of ['L','R'])legs.push([at('thigh'+s),at('knee'+s),w.thigh],[at('knee'+s),at('foot'+s),w.shin]);
 return {torso:p=>{q.copy(p).applyMatrix4(hips);q.y+=m.hipY;return vol.sdf(q);},legs:p=>Math.min(...legs.map(([a,c,r])=>segment(p,a,c)-r))};
}
/** The fitted cloth of a skirt, a dress or a wrap, as it is drawn: its triangles (world). */
function cloth(avatar){
 const tris=[];avatar.root.updateMatrixWorld(true);
 for(const mesh of avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'))){
  const g=mesh.geometry,F=g.attributes.towelFit;if(!F||!mesh.towelFit)continue;
  const P=g.attributes.position,fit=mesh.towelFit,p=new THREE.Vector3(),rest=new THREE.Vector3(),at=new Map();fit.refresh();
  const point=i=>{if(!at.has(i)){mesh.getVertexPosition(i,p);fit.fitPoint(p,F.getX(i),rest.fromBufferAttribute(P,i));at.set(i,p.clone().applyMatrix4(mesh.matrixWorld));}return at.get(i);};
  const I=g.index,n=I?I.count:P.count,ix=k=>I?I.getX(k):k;
  for(let k=0;k<n;k+=3){const a=ix(k),b=ix(k+1),c=ix(k+2);if(F.getX(a)>.5&&F.getX(b)>.5&&F.getX(c)>.5)tris.push(new THREE.Triangle(point(a),point(b),point(c)));}
 }
 return tris;
}
/** Under the cloth: a point nearer the body than the cloth over it is (the nearest cloth within `reach`). */
function underCloth(p,tris,body,reach){
 const c=new THREE.Vector3();let best=null,d=reach;
 for(const t of tris){t.closestPointToPoint(p,c);const e=c.distanceTo(p);if(e<d){d=e;best=c.clone();}}
 return best?Math.max(0,body(best)-body(p)):0;
}

test('seated on a bench, a chair, a stool or a cushion: no leg in the seat, no hand or arm in the clothes',()=>{
 const report=[],wrong=[];
 for(const [name,recipe,outfit,kind] of BODIES)for(const [where,seat] of SEATS){
  const avatar=sit(recipe,outfit,seat),points=drawn(avatar),b=avatar.bones,q=new THREE.Vector3();
  // the legs, the shoes and what is drawn on them, against the seat (cloth sat on, under a thigh, pressed a little further)
  const thighs=['L','R'].map(s=>new THREE.Line3(b['thigh'+s].getWorldPosition(new THREE.Vector3()),b['knee'+s].getWorldPosition(new THREE.Vector3())));
  const satOn=p=>thighs.some(t=>{const c=t.closestPointToPoint(p,true,q);return Math.hypot(c.x-p.x,c.z-p.z)<avatar.measure.legR*1.1&&p.y<c.y;});
  let leg={depth:0};
  for(const {p,bone,cloth} of points)if(/^(hips|thigh|knee|foot)[LR]?$/.test(bone)&&(bone!=='hips'||cloth)){
   const d=inSeat(p,seat)-(cloth&&satOn(p)?SAT_ON-CONTACT:0);if(d>leg.depth)leg={depth:d,bone,at:p};}
  // the arms against what is worn below the waist
  const L=lowerBody(avatar),tris=cloth(avatar),body=p=>Math.min(L.torso(p),L.legs(p));
  let arm={depth:0};
  for(const {p,bone} of points){
   if(!/^(shoulder|elbow|hand)[LR]$/.test(bone))continue;
   const hand=/^hand/.test(bone),below=p.y<avatar.bones.hips.getWorldPosition(new THREE.Vector3()).y+avatar.measure.torso*.25;
   let d=Math.max(0,-L.legs(p));if(hand)d=Math.max(d,-L.torso(p));
   if(tris.length&&below)d=Math.max(d,underCloth(p,tris,body,.08*avatar.measure.k));
   if(d>arm.depth)arm={depth:d,bone,at:p};
  }
  report.push(`${name} on ${where}: leg ${(leg.depth*1000).toFixed(1)} mm (${leg.bone||'-'}), arm ${(arm.depth*1000).toFixed(1)} mm (${arm.bone||'-'})`);
  if(leg.depth>=CONTACT)wrong.push(`${name} on ${where}: the ${leg.bone} ${(leg.depth*1000).toFixed(1)} mm into the seat`);
  if(arm.depth>=CONTACT)wrong.push(`${name} (${kind}) on ${where}: the ${arm.bone} ${(arm.depth*1000).toFixed(1)} mm into what is worn`);
  avatar.dispose();
 }
 if(process.env.SEATED_REPORT)console.log(report.join('\n'));
 assert.deepEqual(wrong,[]);
});
