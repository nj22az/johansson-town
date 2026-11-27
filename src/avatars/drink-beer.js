import * as THREE from '../../vendor/three.module.js';
import MUG from './motions/drink-beer-mug.js';
import PINT from './motions/drink-beer-pint.js';
import GLASS from './motions/drink-beer-glass.js';
import MUG_BOOTH from './motions/drink-beer-mug-booth.js';
import PINT_BOOTH from './motions/drink-beer-pint-booth.js';
import GLASS_BOOTH from './motions/drink-beer-glass-booth.js';
import MUG_HELD from './motions/drink-beer-mug-held.js';
import PINT_HELD from './motions/drink-beer-pint-held.js';
import GLASS_HELD from './motions/drink-beer-glass-held.js';
import {normalizeMotion,sampleTrack} from './motion.js';
import {lowerLip} from './consume.js';
import {faceLayout} from './face.js';
import {shapeHeadPoint} from './head-profile.js';
import {levelWeights,bring,steady,softWrist,forgetWays} from './drink-can.js';
import {vesselOf,beerSocket,beerRim,beerGrip} from './beer-hold.js';
import {HAND,handPoint} from './build.js';
import {levelHeldDrink} from './table-drink.js';
import {requiredTilt} from '../drinking/liquid.js';

/**
 * Beer from a glass, drunk as it was animated in Blender (tools/blender/drink-beer.py; the owner, 27 November 2026: "Remake
 * it follow Disney principles how should it look when anyone drinks beer"), by anyone: residents and Johansson, at Minato's
 * counter, at the booth's table, or with the glass in the hand and nowhere to set it down. A motion a glass (the draught mug,
 * the pint, the small glass) for each of those (BEER_TABLES), each in parts that start and end on the same pose. At a table:
 * TAKE, FIRST (the first long draught, the "kaa!", the foam moustache wiped off, set down with a tap), SIP (a later, quieter
 * one), LAST (the last of the glass: SIP's beats at SIP's times, the glass toward horizontal and the head further back) and
 * LET, joining on the right hand on the glass where it stands. Held: SIP and LAST from the glass held at the waist, joining
 * there. A later sip is SIP and LAST blended by how far over the beer left needs the glass (beerLastBlend). A glass set down to
 * the drinker's left (half the booth's seats: Thao sets it at the table's end she can reach) is drunk with the left hand, the
 * motion mirrored (the foam wiped with the right). The briefs, beat by beat, are at the top of
 * tools/blender/drink-beer-keys.py and drink-beer-held-keys.py.
 *
 * Played as the can is (drink-can.js): the body from the waist up over the animator's pose, blended in and out level by level;
 * each wrist where the animated body's was, from the chest in this body's size, the right one by the lower lip near the mouth,
 * the left one by the upper lip for the wipe; then the contacts put right exactly: the glass's foot on this counter where it
 * stands (the glass from its place on the counter, `rest`), the rim on this body's lower lip (the glass tipped as far as the beer
 * left in it needs to reach the rim: the tilt follows the fill), the back of the left fingers on the upper lip. Never through
 * the counter: a foot that would go under its top is lifted onto it. Without a counter (standing, or a glass in the hand), the
 * lean in for the counter is taken out and the glass rests in front of the waist. The shoulder comes forward as the body leans
 * in for the glass (a reach), the shoulders lift on the "kaa!", the throat squashes a little at each swallow (the neck's scale,
 * its volume kept), the beer's surface lags the glass's moves and settles (a slosh), and a foam moustache sits on the upper lip
 * after a draught from the mug or the pint until it is wiped.
 *
 * Each resident drinks as themselves (BEER_STYLES): the same keys, timed by beat for who they are, the head back as far as
 * they go back.
 */
/** Where a glass is drunk: at Minato's counter, at the booth's table (lower, nearer), held with nowhere to set it down. */
export const BEER_TABLES=Object.freeze(['counter','booth','held']);
const RAW={mug:[MUG,MUG_BOOTH,MUG_HELD],pint:[PINT,PINT_BOOTH,PINT_HELD],glass:[GLASS,GLASS_BOOTH,GLASS_HELD]};
/** Each glass's motion at each table: {mug: {counter, booth, held}, ...}. */
export const BEER_TABLE_MOTIONS=Object.freeze(Object.fromEntries(Object.entries(RAW).map(([v,list])=>[v,Object.freeze(Object.fromEntries(BEER_TABLES.map((t,i)=>[t,normalizeMotion(list[i])])))])));
/** The counter's motions, by glass. */
export const BEER_MOTIONS=Object.freeze(Object.fromEntries(Object.entries(BEER_TABLE_MOTIONS).map(([v,t])=>[v,t.counter])));
/** The motion for this glass at `table`, drunk with the `side` hand ('R'; 'L' the right hand's mirrored), or null. */
export const beerMotion=(prop,table='counter',side='R')=>{const M=BEER_TABLE_MOTIONS[vesselOf(prop)]?.[table]||null;return M&&side==='L'?mirrorMotion(M):M;};
/** The hand a motion drinks with. */
export const beerSide=M=>M?.mirrored?'L':'R';
const SWAP=n=>/[LR]$/.test(n)&&n.length>1?n.slice(0,-1)+(n.endsWith('L')?'R':'L'):n;
const mirrors=new WeakMap();
/**
 * A motion mirrored left for right (the body's own middle, x = 0, as a mirror): each joint's turn by the other side's, its
 * turns about the up and the forward axes the other way ((x, -y, -z, w): every bone's own axes are the body's at rest); each
 * path across the body the other way, the wrists' each the other's; the hands' closings each the other's. The glass's own
 * frame in a left hand is the right's mirrored (beer-hold.js beerSocket), its drinking side its -z.
 */
export function mirrorMotion(M){
 if(mirrors.has(M))return mirrors.get(M);
 const q=d=>{const o=d.slice();for(let i=0;i<o.length;i+=4){o[i+1]=-o[i+1];o[i+2]=-o[i+2];}return o;},x=d=>{const o=d.slice();for(let i=0;i<o.length;i+=3)o[i]=-o[i];return o;};
 const joints={},shapes={},reach={};for(const [n,d] of Object.entries(M.joints))joints[SWAP(n)]=q(d);for(const [n,d] of Object.entries(M.shapes))shapes[SWAP(n)]=d;
 for(const [n,d] of Object.entries(M.reach))reach[n==='R'?'L':n==='L'?'R':n]=x(d);
 const out={...M,joints,shapes,reach,mirrored:true,props:{...M.props,glass:{...M.props.glass,bone:'handL'}}};mirrors.set(M,out);return out;
}
/** Where each part is in a motion (seconds): from each marker to the next. */
const partsOf=new WeakMap();
export function beerParts(M){
 if(partsOf.has(M))return partsOf.get(M);
 const mk=Object.entries(M.markers).filter(([n])=>n!=='end').sort((a,b)=>a[1]-b[1]),out={};
 mk.forEach(([n,t],i)=>{out[n]=[t,i+1<mk.length?mk[i+1][1]:M.markers.end];});partsOf.set(M,out);return out;
}
/** Each part's beats (seconds from its start, tools/blender/drink-beer-keys.py), for timing them by who drinks. */
const BEATS={take:[[0,.35,'still'],[.35,.62,'antic'],[.62,1.42,'lift'],[1.42,1.75,'settle']],
 first:[[0,.2,'still'],[.2,.5,'antic'],[.5,1.4,'lift'],[1.4,3.2,'gulp'],[3.2,3.5,'release'],[3.5,5.1,'kaa'],[5.1,5.95,'set'],[5.95,6.6,'settle']],
 sip:[[0,.2,'still'],[.2,.5,'antic'],[.5,1.4,'lift'],[1.4,2.1,'gulp'],[2.1,2.4,'release'],[2.4,2.75,'kaa'],[2.75,3.6,'set'],[3.6,4.25,'settle']],
 let:[[0,.15,'still'],[.15,1.4,'settle']]};
/**
 * How each drinks (appeal: "each resident drinks as themselves"; exaggeration stays everyday, 20-30%, but for the first
 * "kaa!"): each beat's length against the keys', how far the head goes back in a draught, and how big the "kaa!" is.
 * - a gulper (Mr Fujita, the quay crew): quick to the glass, a long deep draught with the head well back, a big "kaa!";
 * - a sipper (Thao, Christina): unhurried to it, a short draught, the head barely back, a content little breath for a "kaa";
 * - Johansson with his dark beer: looks at it a while first (the anticipation long), slow to the lips, a long draught with the
 *   eyes shut, a slow satisfied breath out.
 */
// (the quay crew: Masaru off his boat, Kai the Kitano line hand, Kōji on his weeks ashore, Ryo of the ferry's deck)
// (`between`: seconds a glass held with nowhere to set it down is held between sips, when nothing else times them (Mr Fujita
// in his chair with the ballgame on): a gulper back to it soon, a sipper in their own time)
const GULPER=Object.freeze({still:1,antic:.8,lift:.85,gulp:1.35,release:.9,kaa:1,set:.85,settle:.9,head:1.25,kaaAmount:1.2,between:6});
const SIPPER=Object.freeze({still:1,antic:1.1,lift:1.12,gulp:.6,release:1.1,kaa:.8,set:1.1,settle:1.1,head:.6,kaaAmount:.4,between:12});
export const BEER_STYLES=Object.freeze({
 'Mr Fujita':GULPER,Masaru:GULPER,Kai:GULPER,'Kōji':GULPER,Ryo:GULPER,
 Thao:SIPPER,Christina:SIPPER,
 'Nils Johansson':Object.freeze({still:1,antic:1.5,lift:1.15,gulp:1.25,release:1.2,kaa:1.3,set:1.15,settle:1.2,head:.9,kaaAmount:.8,between:10}),
});
export const BEER_STYLE_DEFAULT=Object.freeze({still:1,antic:1,lift:1,gulp:1,release:1,kaa:1,set:1,settle:1,head:1,kaaAmount:1,between:8});
export const beerStyleOf=name=>BEER_STYLES[name]||(name==='Johansson'?BEER_STYLES['Nils Johansson']:BEER_STYLE_DEFAULT);
const warps=new Map();
/**
 * A part timed for a style: `duration` (game seconds) and `at(s)`, the motion's seconds from the part's start at s game
 * seconds into it. Each beat's speed is the style's, the speeds eased into one another over a tenth of a second each side of
 * a beat's end (no step of speed), the part's own length `fit` seconds if asked.
 */
export function beerWarp(part,style=BEER_STYLE_DEFAULT,fit=0){
 const key=part+'|'+JSON.stringify(style)+'|'+fit;if(warps.has(key))return warps.get(key);
 const beats=BEATS[part==='last'?'sip':part],end=beats.at(-1)[1],step=1/240,rate=m=>{
  // (the beat's length factor, eased across each boundary over 0.15 s of the motion each side: a quick draught's speed carried
  // into the glass's way down from the lip took it 38 mm a frame)
  let f=style[beats.find(b=>m<b[1])?.[2]||beats.at(-1)[2]]??1;
  for(let i=0;i<beats.length-1;i++){const b=beats[i][1],d=m-b;if(Math.abs(d)<.15){const u=(d+.15)/.3,e=u*u*(3-2*u);f=(style[beats[i][2]]??1)*(1-e)+(style[beats[i+1][2]]??1)*e;}}
  return f;};
 const ms=[0],ss=[0];for(let m=step;m<=end+1e-9;m+=step){ss.push(ss.at(-1)+step*rate(m-step/2));ms.push(m);}
 let total=ss.at(-1),scale=fit>0?fit/total:1;total*=scale;
 const at=s=>{const x=Math.max(0,Math.min(total,s))/scale;let lo=0,hi=ss.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(ss[mid]<=x)lo=mid;else hi=mid;}return ms[lo]+(ms[hi]-ms[lo])*(x-ss[lo])/Math.max(1e-9,ss[hi]-ss[lo]);};
 const out={duration:total,at};warps.set(key,out);return out;
}

/**
 * A motion read at time t, with the LAST part blended in by `b` (0..1) where t is in SIP: the same moment of LAST, which has
 * SIP's beats at SIP's times (its contacts the same), so the two are one sip of a glass between half and nearly empty.
 */
function sampler(M,t,b=0){
 const P=beerParts(M),off=b>0&&P.last&&P.sip&&t>=P.sip[0]-1e-9&&t<=P.sip[1]+1e-9?P.last[0]-P.sip[0]:null,u=off===null?0:b,t2=off===null?t:t+off;
 const end=M.times.at(-1),at=x=>Math.max(0,Math.min(end,x)),_r=new THREE.Quaternion();
 return {t,t2,b:u,
  track:d=>{const a=sampleTrack(M,d,t);return u?a+(sampleTrack(M,d,t2)-a)*u:a;},
  idx:d=>{const a=sampleIdx(M,d,t);return u?a+(sampleIdx(M,d,t2)-a)*u:a;},
  path:n=>{const a=pathAt(M,n,t);return u?a.lerp(pathAt(M,n,t2),u):a;},
  quat:(track,q)=>{q.fromArray(track.evaluate(at(t)));if(u)q.slerp(_r.fromArray(track.evaluate(at(t2))),u);return q;}};
}
/** A motion's cues at time t (`S` a sampler of it): the hands' closing (closeR, closeL: each hand's own; `side` the hand on
 *  the glass), the face's, the contacts' weights, the beer left. */
export function beerCues(M,t,S=sampler(M,t)){
 const s=S.track,F=M.face,C=M.contact;
 return {side:beerSide(M),closeR:s(M.shapes.closeR),closeL:s(M.shapes.closeL),blink:s(F.blink),breath:s(F.breath),smile:s(F.smile),look:s(F.look),kaa:s(F.kaa),foam:s(F.foam),
  swallow:s(F.swallow),shrug:s(F.shrug),lip:s(C.lip),mouth:s(C.mouth),counter:s(C.counter),hold:s(C.hold),wipe:s(C.wipe),lean:s(C.lean),fill:M.fill?s(M.fill):1};
}
/** A contact's weight widened into its approach and its leaving (drink-can.js widen), each motion once. */
const wide=new WeakMap();
function widened(M,name,reach){
 const all=wide.get(M)||wide.set(M,{}).get(M),key=name+reach;if(all[key])return all[key];
 const data=M.contact[name],T=M.times,out=new Float32Array(data.length);
 for(let i=0;i<data.length;i++){let w=0;for(let j=Math.max(0,i-Math.ceil(reach*M.fps)-1);j<Math.min(data.length,i+Math.ceil(reach*M.fps)+2)&&w<1;j++){const d=Math.abs(T[i]-T[j]);if(d<reach){const x=1-d/reach;w=Math.max(w,data[j]*x*x*(3-2*x));}}out[i]=w;}
 return all[key]=out;
}
function pathAt(M,name,t){
 const T=M.times,data=M.reach[name];if(t<=T[0])return new THREE.Vector3().fromArray(data,0);if(t>=T.at(-1))return new THREE.Vector3().fromArray(data,data.length-3);
 let lo=0,hi=T.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(T[mid]<=t)lo=mid;else hi=mid;}
 return new THREE.Vector3().fromArray(data,lo*3).lerp(new THREE.Vector3().fromArray(data,hi*3),(t-T[lo])/(T[hi]-T[lo]));
}
const tracksOf=new WeakMap();
const tracks=M=>tracksOf.get(M)||tracksOf.set(M,Object.entries(M.joints).map(([n,d])=>[n,new THREE.QuaternionKeyframeTrack(n+'.quaternion',M.times,d).createInterpolant()])).get(M);
const LEVEL={spine:0,chest:1,neck:1,head:1,shoulderL:1,shoulderR:1,elbowL:2,elbowR:2,handL:2,handR:2};
const _q=new THREE.Quaternion(),_v=new THREE.Vector3(),ID=new THREE.Quaternion();
/** A turn's angle scaled (about its own axis) by f. */
function scaleTurn(q,f){if(q.w<0)q.set(-q.x,-q.y,-q.z,-q.w);const s=Math.hypot(q.x,q.y,q.z);if(s<1e-9)return q;const a=2*Math.atan2(s,q.w)*f,k=Math.sin(a/2)/s;return q.set(q.x*k,q.y*k,q.z*k,Math.cos(a/2));}
/** The motion's joints at t over the pose the bones have, by `w` (a number, or each level's); `unlean` of the lean in for a
 *  counter taken out of the spine and the chest (no counter there); the neck and the head back by `head` of the motion's
 *  while the glass is at the mouth. */
function poseAt(avatar,M,S,w,unlean=0,head=1,mouth=0){
 for(const [name,track] of tracks(M)){const b=avatar.bones[name];if(!b)continue;S.quat(track,_q);
  if(unlean>0&&(name==='spine'||name==='chest'))_q.slerp(b.quaternion,unlean);
  if(mouth>0&&head!==1&&(name==='neck'||name==='head'))scaleTurn(_q,1+(head-1)*mouth);
  b.quaternion.slerp(_q,typeof w==='number'?w:w[LEVEL[name]]);}
 avatar.root.updateMatrixWorld(true);
}
function held(avatar,M){const was=tracks(M).map(([n])=>[avatar.bones[n],avatar.bones[n]?.quaternion.clone()]).filter(([b])=>b);return ()=>{for(const [b,q] of was)b.quaternion.copy(q);avatar.root.updateMatrixWorld(true);};}

// ---- the body's own measures, found once
const lips=new WeakMap();
/** This body's lower lip and the middle of its upper lip (3 mm out from it), in the head bone's frame. */
function lipsOf(avatar){
 if(lips.has(avatar))return lips.get(avatar);
 const L=lowerLip(avatar),m=avatar.measure,up=L.mouth.clone().add(new THREE.Vector3(0,.007*m.k,.006*m.k));
 return lips.set(avatar,{lower:L.lower.clone(),upper:up}).get(avatar);
}
/** The back of the free hand's fingers (the left's, or the right's drinking with the left), just past the knuckles, in its
 *  hand bone's frame: what wipes the foam off. */
const wipePoint=(m,side='L')=>new THREE.Vector3(...handPoint(m,side,[HAND.half[0],HAND.knuckles*.7+HAND.tip*.3,.1]));
const binds=new WeakMap();
const bindOf=avatar=>binds.get(avatar)||binds.set(avatar,{L:avatar.bones.shoulderL.position.clone(),R:avatar.bones.shoulderR.position.clone(),neck:avatar.bones.neck.scale.clone()}).get(avatar);
/** Put back what a drink moves off the bones' own: the shoulders' places (the reach, the shrug) and the throat's squash. */
export function restBeer(avatar){
 const b=binds.get(avatar);if(!b)return;avatar.bones.shoulderL.position.copy(b.L);avatar.bones.shoulderR.position.copy(b.R);avatar.bones.neck.scale.copy(b.neck);
 const f=foams.get(avatar);if(f)f.visible=false;
}

// ---- the foam moustache: little blobs along the upper lip on the head's own surface, wiped away from his left to his right
const foams=new WeakMap(),FOAM_N=9;
function foamOf(avatar){
 if(foams.has(avatar))return foams.get(avatar);
 const m=avatar.measure,L=faceLayout(avatar.recipe),g=new THREE.Group();g.name='Foam moustache';
 const material=new THREE.MeshStandardMaterial({color:0xf7f0e2,roughness:.92});
 const geo=new THREE.SphereGeometry(1,10,6);
 for(let i=0;i<FOAM_N;i++){
  const u=i/(FOAM_N-1)-.5,x=L.mouthX+u*30*L.mouthS*L.mouthW,y=L.mouthY-7*L.mouthS-Math.abs(u)*3;
  const theta=Math.PI*.28+y/256*Math.PI*.58,phi=Math.PI/2-.95+x/256*1.9;
  const dir=new THREE.Vector3(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta));
  const v=shapeHeadPoint(dir.clone(),m.profile),p=new THREE.Vector3(v.x*m.Rh*m.headSX,m.headCentre-m.headY+v.y*m.Rh*m.headSY,v.z*m.Rh*.98);
  const out=p.clone().sub(new THREE.Vector3(0,m.headCentre-m.headY,0)).normalize();
  const blob=new THREE.Mesh(geo,material);blob.name='Foam '+i;blob.userData.u=u+.5;
  // (each blob a flattened lump against the skin, its centre 2.5 mm out so it sits on the lip and never shares its surface)
  blob.position.copy(p.addScaledVector(out,.0025*m.k));blob.scale.set(.0085*m.k*(1-Math.abs(u)*.5),.0042*m.k,.004*m.k);
  blob.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),out);blob.castShadow=false;g.add(blob);
 }
 g.visible=false;avatar.bones.head.add(g);foams.set(avatar,g);return g;
}
/** The moustache on (amount 0..1): what is left of it after the wipe, which goes from his left (u 1) to his right (u 0); or,
 *  wiped by the right hand (`mirrored`), from his right to his left. */
function showFoam(avatar,amount,mirrored=false){
 if(amount<=.01&&!foams.has(avatar))return;
 const g=foamOf(avatar);g.visible=amount>.01;for(const b of g.children)b.visible=(mirrored?1-b.userData.u:b.userData.u)<=amount+1e-6;
}

// ---- the beer's surface: it lags the glass's moves and settles (a damped spring on its normal), never past 14 degrees
const sloshes=new WeakMap();
function slosh(prop,dt){
 const fluid=levelHeldDrink(prop);if(!fluid)return;
 const p=prop.getWorldPosition(new THREE.Vector3()),s=sloshes.get(prop)||{p:p.clone(),v:new THREE.Vector3(),a:new THREE.Vector3(),n:new THREE.Vector3(0,1,0),nv:new THREE.Vector3()};
 const h=Math.max(1/240,Math.min(.05,dt||1/60)),v=p.clone().sub(s.p).divideScalar(h);
 if(v.length()>3)v.set(0,0,0);   // (a glass put somewhere else, not moved)
 s.a.lerp(v.clone().sub(s.v).divideScalar(h),.5);s.v.copy(v);s.p.copy(p);
 const target=new THREE.Vector3(0,9.8,0).sub(s.a.clone().setY(0)).normalize();
 const om=9,ze=.34;s.nv.addScaledVector(target.clone().sub(s.n),om*om*h).addScaledVector(s.nv,-2*ze*om*h);s.n.addScaledVector(s.nv,h).normalize();
 if(s.n.y<Math.cos(.245)){const flat=s.n.clone().setY(0).normalize();s.n.set(flat.x*Math.sin(.245),Math.cos(.245),flat.z*Math.sin(.245));}
 sloshes.set(prop,s);fluid.surface(s.n);fluid.update(prop.userData.portion??1);
}

/** The glass where it is this frame (world), its parent kept: in the hand's socket while held (the right's, or `side`), else
 *  standing at `rest`. */
export function placeBeer(avatar,prop,cues,rest,side=cues.side||'R'){
 let world;
 if(cues.hold>=.5||!rest?.position){const S=beerSocket(avatar.measure,prop,side);world=avatar.bones['hand'+side].matrixWorld.clone().multiply(new THREE.Matrix4().compose(S.position,S.quaternion,new THREE.Vector3(1,1,1)));}
 else world=new THREE.Matrix4().compose(rest.position,rest.quaternion,new THREE.Vector3(1,1,1));
 if(prop.parent){prop.parent.updateWorldMatrix(true,false);world.premultiply(prop.parent.matrixWorld.clone().invert());}
 prop.matrixAutoUpdate=false;prop.matrix.copy(world);prop.matrixWorldNeedsUpdate=true;prop.updateMatrixWorld(true);
}
/** The glass's upright turn at its place on the counter, its rim's drinking side toward the body (`root`'s back), a mug's
 *  handle to the drinker's right; for the left hand (`side` 'L'), half round: the handle to the left, its -z (the left hand's
 *  drinking side) toward the body. */
export const restTurn=(root,side='R')=>root.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),side==='L'?0:Math.PI));
/** Which hand takes a glass standing at `place` (world): the one on its side of the body (the root's +x is the body's left). */
export const beerSideFor=(avatar,place)=>avatar.root.worldToLocal(new THREE.Vector3().copy(place)).x>0?'L':'R';
/** Which table a glass standing at `place` (world) is on, for this body: the one whose top, as its motion was made, is
 *  nearest the place's height over the body's root (the counter 0.74 m, the booth's table 0.68 m). */
export function beerTableFor(avatar,place,prop=null){
 const y=avatar.root.worldToLocal(new THREE.Vector3().copy(place)).y,M=BEER_TABLE_MOTIONS[vesselOf(prop)]||BEER_TABLE_MOTIONS.mug;
 return ['counter','booth'].reduce((a,t)=>Math.abs(M[t].props.counter.top-y)<Math.abs(M[a].props.counter.top-y)?t:a);
}

const played=new WeakMap(),leans=new WeakMap();
/** The spine and the chest leant further in by `a` radians (the spine 0.55 of it), about their own x: forward. */
function leanIn(avatar,a){const b=avatar.bones;b.spine.quaternion.multiply(_q.setFromAxisAngle(new THREE.Vector3(1,0,0),a*.55));b.chest.quaternion.multiply(_q.setFromAxisAngle(new THREE.Vector3(1,0,0),a*.45));avatar.root.updateMatrixWorld(true);}
/** How much further than the motion's body a body leans in to take a glass standing where it stands on the counter (its arm,
 *  in its proportion, short of it): found once a play, on the pose the parts join on (the hand on the glass), up to 0.25 rad;
 *  the leaning in, a little more for a shorter arm, is how anyone takes a glass a long arm away. */
function extraLean(avatar,M,rest,prop){
 const key=rest.position.toArray().map(v=>v.toFixed(3)).join(),was=leans.get(avatar);if(was?.key===key&&was.M===M)return was.E;
 const G=beerSide(M),b=avatar.bones,m=avatar.measure,back=held(avatar,M),sh=b['shoulder'+G],pos=sh.position.clone(),bind=bindOf(avatar);
 const tC=M.markers.first,arm=(m.upper+m.fore)*.975;
 const short=E=>{poseAt(avatar,M,sampler(M,tC),1);sh.position.copy(bind[G]).add(new THREE.Vector3(0,0,.05*m.k));leanIn(avatar,E);
  // (the wrist where this hand holds this glass standing at its place: the foot there, the hand turned to the glass upright)
  const S=beerSocket(m,prop,G),hq=rest.quaternion.clone().multiply(S.quaternion.clone().invert()),goal=rest.position.clone().sub(S.position.clone().applyQuaternion(hq));
  return sh.getWorldPosition(new THREE.Vector3()).distanceTo(goal)-arm;};
 let E=0;if(short(0)>0){let lo=0,hi=.3;for(let i=0;i<12;i++){const mid=(lo+hi)/2;if(short(mid)>0)lo=mid;else hi=mid;}E=hi;}
 back();sh.position.copy(pos);avatar.root.updateMatrixWorld(true);
 leans.set(avatar,{key,M,E});return E;
}
/**
 * Beer drunk at time t (seconds into the glass's motion), over the pose the animator has made, by `w`.
 * opts: `motion` (beerMotion: the glass's, at its table, mirrored for the left hand); `rest` {position, quaternion} the
 * glass's foot on the table and its upright turn there (null: held, with nothing to set it down on); `blend` {in, out} seconds
 * into and before the end of the play (level by level, as the can's); `style` (BEER_STYLES); `dt` (the slosh); `last` (0..1:
 * how much of LAST a SIP is, beerLastBlend). `prop` null: the body alone (the glass gone from the hand as the play eases out).
 * Returns the cues and how far each contact was put right (`fix`, metres).
 */
export function playBeerDrink(avatar,prop,t,w=1,{motion:M=beerMotion(prop),rest=null,blend=null,style=BEER_STYLE_DEFAULT,dt=1/60,fresh,last=0}={}){
 const S=sampler(M,t,last),cues=beerCues(M,t,S),fix={lip:0,foot:0,wipe:0,lift:0,R:0,L:0},m=avatar.measure,b=avatar.bones,k=m.k;
 // (G the hand on the glass, W the other: the right and the left, or for a glass to the left, the motion mirrored, the other way)
 const G=cues.side,W=G==='R'?'L':'R',heldOnly=M.props?.table==='held',hG=b['hand'+G],wide=(name,reach)=>S.idx(widened(M,name,reach));
 // (a new play forgets the ways the elbows took in the last; one part on to the next, which join on one pose, does not)
 const lastT=played.get(avatar);if(fresh??(lastT===undefined||Math.abs(t-lastT)>.25))forgetWays(avatar);played.set(avatar,t);
 // (`blend.scale`: the whole of it eased out from less than all of it, where a play stopped part of the way in)
 const lw=blend?levelWeights(blend).map(x=>x*(blend.scale??1)):null;if(lw)w=lw[2];
 const bind=bindOf(avatar);restBeer(avatar);
 const counter=!!rest?.position,root=avatar.root.getWorldQuaternion(new THREE.Quaternion());
 if(w<=0&&!(lw&&lw[0]>0)){if(prop)placeBeer(avatar,prop,cues,rest);return {...cues,fix,w:0};}
 // the shoulders: the glass hand's forward as he leans in for the glass on a table (a reach), both up on the "kaa!"
 const k1=lw?lw[1]:w,shrug=cues.shrug*Math.min(1.3,style.kaaAmount)*.018*k*k1;
 b['shoulder'+G].position.copy(bind[G]).add(new THREE.Vector3(0,shrug,counter?.05*k*cues.lean*k1:0));b['shoulder'+W].position.copy(bind[W]).add(new THREE.Vector3(0,shrug,0));
 // each wrist where the animated body's was, in this body's size (the motion's whole pose; then blended as the move is)
 const goals={},unlean=counter?0:cues.lean,mouthW=cues.mouth,head=(style.head??1)*(vesselOf(prop)==='mug'?1.35:1);   // (the tall mug: the head further back, its far wall clear of the nose)
 // (each hand where this body rests it, as the animator has it before the motion: on its own thigh)
 const own={R:b.handR.getWorldPosition(new THREE.Vector3()),L:b.handL.getWorldPosition(new THREE.Vector3())};
 const back=w<1||lw&&lw[0]<1?held(avatar,M):null;poseAt(avatar,M,S,1,unlean,head,mouthW);let away;
 if(counter&&cues.lean>0&&prop){const E=extraLean(avatar,M,rest,prop);if(E>0)leanIn(avatar,E*cues.lean);}
 {const chest=b.chest,L=lipsOf(avatar),wipeNear=wide('wipe',.35);
  // (a hand resting on the thigh rests on this body's own, where the animator lays it; as it leaves the rest, over the first
  // 18 cm of its way, by the motion's path from the chest in this body's size: the path's rest is Johansson's thigh, out of a
  // shorter arm's reach, which took the arm straight and bent it again in a frame, 27 November 2026; over less, the hand made
  // up the 10 cm between the two at 1.7 m/s)
  // (a glass held with nowhere to set it down is never at the hand's rest: its hand goes by the path all the time)
  away=s=>{if(heldOnly&&s===G)return 1;const d=S.path(s).distanceTo(pathAt(M,s,0))*k,x=Math.min(1,d/(.18*k));return x*x*(3-2*x);};
  const Rg=chest.localToWorld(S.path(G).multiplyScalar(k)).lerp(own[G],1-away(G));
  if(mouthW>0)Rg.lerp(b.head.localToWorld(S.path('mouth').multiplyScalar(k).add(L.lower)),mouthW);
  // (by the glass on the table: the wrist from the glass's place as the motion has it, from this glass's place: where it
  // stands. As the hand comes to it, holds it there and leaves it; not while the hand rests on the thigh, which is this body's
  // own, by the chest path)
  const near=counter?Math.min(wide('counter',.45),wide('hold',.45))*(1-mouthW):0;
  if(near>0)Rg.lerp(rest.position.clone().add(S.path('spot').applyQuaternion(root)),near);
  const Lw=chest.localToWorld(S.path(W).multiplyScalar(k)).lerp(own[W],1-away(W));
  if(wipeNear>0)Lw.lerp(b.head.localToWorld(S.path('mouthL').multiplyScalar(k).add(L.upper)),wipeNear);
  goals[G]=within(avatar,G,Rg,away(G)).sub(hG.getWorldPosition(_v));goals[W]=within(avatar,W,Lw,away(W)).sub(b['hand'+W].getWorldPosition(_v));}
 if(back){back();poseAt(avatar,M,S,lw||w,unlean,head,mouthW);}

 if(counter&&cues.lean>0&&prop){const E=extraLean(avatar,M,rest,prop);if(E>0)leanIn(avatar,E*cues.lean*(lw?lw[0]:w));}
 // a swallow: the throat squashed a little and widened as much (its volume kept), on the beat (before the contacts, which
 // the head's move with it would carry off the lip)
 {const sq=.035*cues.swallow*w;if(sq>0){const x=1/Math.sqrt(1-sq);b.neck.scale.set(bind.neck.x*x,bind.neck.y*(1-sq),bind.neck.z*x);avatar.root.updateMatrixWorld(true);}}
 for(const side of [G,W]){const hand=b['hand'+side].getWorldPosition(new THREE.Vector3()),before=['shoulder','elbow','hand'].map(j=>b[j+side].quaternion.clone());
  const near=side===W?wide('wipe',.35):Math.max(cues.lip,wide('lip',.3),counter?Math.min(wide('hold',.6),wide('counter',.3)):0);
  fix[side]=bring(avatar,side,null,hand.add(goals[side]),w,side===G?1:near,side===G?Math.max(near,Math.min(wide('hold',.6),wide('counter',.3))):near*.4,'beer'+side,TW(w));
  if(side===W)steady(avatar,W,before,t,w*(1-near));
  const off=1-near;if(side===G&&off>0){const q=hG.quaternion,soft=q.clone();softWrist(soft,G);q.slerp(soft,off);hG.updateWorldMatrix(false,true);}}
 if(prop){
  placeBeer(avatar,prop,cues,rest);
  const So=beerSocket(m,prop,G),inHand=p=>hG.worldToLocal(prop.localToWorld(p.clone()));
  // the foot on the table where it stands, as the motion has it there (the rock before the lift, the tap of the set-down)
  // (let go of as gently as it was taken: the hand's hold on the glass widened into its coming and going)
  const onCounter=counter?Math.min(wide('hold',.6),wide('counter',.3)):0;
  if(onCounter>0){
   // (the glass stood as the motion has it there, upright or rocked on its foot: the hand turned so, whatever this arm made of it)
   // (the glass as the hand holds it, or would hold it closing on it: its socket, so the hand comes onto the glass turned and
   // placed as it will hold it, and nothing steps when the fingers close; the glass standing at its place jumped into the
   // socket by 5-7 mm on another body, and the arm after it)
   const want=S.path('up').applyQuaternion(root).normalize(),has=new THREE.Vector3(0,1,0).applyQuaternion(hG.getWorldQuaternion(new THREE.Quaternion()).multiply(So.quaternion));
   const turn=new THREE.Quaternion().setFromUnitVectors(has,want),hq=hG.getWorldQuaternion(new THREE.Quaternion());
   hq.premultiply(new THREE.Quaternion().slerp(turn,onCounter*w));hG.quaternion.copy(hG.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(hq));hG.updateWorldMatrix(false,true);placeBeer(avatar,prop,cues,rest);
   fix.foot=bring(avatar,G,So.position.clone(),rest.position.clone().add(S.path('foot').applyQuaternion(root)),onCounter*w,true,1,'beerFoot',TW(onCounter*w));placeBeer(avatar,prop,cues,rest);}
  // the rim on the lip, the glass tipped as far as the beer left in it needs (and the motion's 3 degrees more), never less
  // (the rim brought onto the lip over the glass's last 0.3 s to it, not over the contact's own tenth of a second: another
  // body's elbow, turned round to keep its wrist as the rim lands, swung 37 mm a frame, 27 November 2026)
  const toLip=wide('lip',.3);
  if(toLip>0&&cues.hold>.5){
   const fluid=levelHeldDrink(prop),f=prop.userData.portion??1,need=fluid?requiredTilt(fluid.profile,Math.max(.01,fluid.startingVolumeMl*f))+.052:0;
   const up=new THREE.Vector3(0,1,0).applyQuaternion(prop.getWorldQuaternion(new THREE.Quaternion())),now=up.angleTo(new THREE.Vector3(0,1,0));
   if(need>now+1e-3){const axis=new THREE.Vector3(0,1,0).cross(up).normalize(),hq=hG.getWorldQuaternion(new THREE.Quaternion());
    hq.premultiply(new THREE.Quaternion().setFromAxisAngle(axis,(need-now)*cues.lip));hG.quaternion.copy(hG.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(hq));hG.updateWorldMatrix(false,true);placeBeer(avatar,prop,cues,rest);}
   const lip=b.head.localToWorld(lipsOf(avatar).lower.clone());
   fix.lip=bring(avatar,G,inHand(beerRim(prop,G)),lip,Math.max(cues.lip,toLip)*w,true,1,'beerLip',TW(Math.max(cues.lip,toLip)*w));placeBeer(avatar,prop,cues,rest);
  }
  // never through the counter: the lowest of its foot's round lifted onto the top
  if(counter&&cues.hold>.5){let low=Infinity;const g=prop.userData.grip||{},r=(g.radius??.03)*.9;
   for(let i=0;i<12;i++){const a=i/12*Math.PI*2;low=Math.min(low,prop.localToWorld(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r)).y);}
   const near=prop.getWorldPosition(new THREE.Vector3()).setY(0).distanceTo(rest.position.clone().setY(0));
   if(low<rest.position.y&&near<.2){const hand=hG.getWorldPosition(new THREE.Vector3());fix.lift=rest.position.y-low;bring(avatar,G,null,hand.add(new THREE.Vector3(0,fix.lift+1e-4,0)),1,true,1,'beerLift',1);placeBeer(avatar,prop,cues,rest);}}
  slosh(prop,dt);
 }
 // the back of the free hand's fingers across the upper lip
 {const on=wide('wipe',.3);if(on>0){const lip=b.head.localToWorld(lipsOf(avatar).upper.clone());fix.wipe=bring(avatar,W,wipePoint(m,W),lip,on*w,false,1,'beerWipe',TW(on*w));}}
 showFoam(avatar,cues.foam*(lw?lw[1]:w),G==='L');
 return {...cues,fix,w};
}
/** A wrist's goal `p` (world) drawn in toward its shoulder, softly, where it is near or past the arm's length: an arm is never
 *  taken straight (the IK snaps it straight and bends it again in a frame), the goal unchanged within 90% of the length and
 *  never further than 97.5% (soft IK), by `much` (none at rest: the hand on the thigh where the animator lays it). Another
 *  body's arm, in its own proportion, may not reach where the motion's path has Johansson's wrist. */
function within(avatar,side,p,much=1){
 const m=avatar.measure,L=m.upper+m.fore,S=avatar.bones['shoulder'+side].getWorldPosition(new THREE.Vector3()),d=p.distanceTo(S),a=.9*L,top=.975*L;
 if(d<=a||much<=0)return p;return p.lerp(S.add(p.clone().sub(S).setLength(a+(top-a)*(1-Math.exp(-(d-a)/(top-a))))),much);
}
/** How much of the hand's twist a contact coming on moves into the forearm (drink-can.js bring): over its first quarter, not
 *  in its first frame, which turned the forearm 0.19 rad in one (Christina's left hand as the drink blended in), nor by its
 *  weight all the way, which left the twist split by the frame before (Sverker's elbow leaving the lip). */
const TW=w=>Math.min(1,4*Math.max(0,w));
function sampleIdx(M,data,t){const T=M.times;if(t<=T[0])return data[0];if(t>=T.at(-1))return data.at(-1);let lo=0,hi=T.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(T[mid]<=t)lo=mid;else hi=mid;}return data[lo]+(data[hi]-data[lo])*(t-T[lo])/(T[hi]-T[lo]);}
/** The face for a beer's cues (the caller paints it): eyes shut on a long draught, the "kaa!" (brows up, the mouth open: the
 *  comedy register's push, for those who give one), a content smile after, the eyes on the glass. */
export function beerFace(cue,style=BEER_STYLE_DEFAULT,base='neutral'){
 const w=cue.w??1,kaa=cue.kaa*w*(style.kaaAmount??1);
 const expression=kaa>.55?'laugh':kaa>.25||cue.smile*w>.5?'content':base;
 return {expression,blink:Math.max(cue.blink*w,0),talk:cue.breath*w>.4||kaa>.55?1:0,look:cue.look*w>.15?[0,1]:null};
}
/** How the glass hand closes this frame (build.js grip: amount, shape), and which it is (`side`). */
export const beerHand=(avatar,prop,cue)=>({...beerGrip(avatar.measure,prop),amount:cue['close'+(cue.side||'R')],side:cue.side||'R'});
/** How far the free hand closes (the wipe's curl), and which it is. */
export const beerFreeHand=cue=>{const side=(cue.side||'R')==='R'?'L':'R';return {side,amount:cue['close'+side]};};

/** Whether a resident's glass of beer is drunk as animated (animate.js): at a table, where it stands (`drinkRest`), in the time
 *  the drink needs, which the venue gives it (venue-service.js); or held with nowhere to set it down (the 'Drink' and
 *  'DrinkStanding' poses with a glass and no `drinkRest`). */
export const BEER_HELD=true;
/** The poses in which a resident holding a glass of beer drinks it as animated, held (no table). */
export const BEER_HELD_POSES=Object.freeze(['Drink','DrinkStanding']);
const lastBlends=new Map();
/**
 * How much of LAST a later sip is (0..1), for a sip that leaves `endFraction` of the glass: as far over as the beer left then
 * needs the glass (drinking/liquid.js requiredTilt, and the 3 degrees more the motion keys) between how far SIP and LAST take
 * it at the lip (each part's furthest, in the motion). Half a mug needs SIP; the last of it, LAST; between, between.
 */
export function beerLastBlend(M,prop,endFraction){
 const P=beerParts(M),fluid=levelHeldDrink(prop);if(!P.last||!P.sip||!fluid||!Number.isFinite(endFraction))return 0;
 const key=M.name+'|'+(prop.userData.drinkKind)+'|'+Math.round(endFraction*1000);if(lastBlends.has(key))return lastBlends.get(key);
 const most=([a,b])=>{let x=0;for(let t=a;t<=b;t+=1/M.fps)if(sampleIdx(M,M.contact.lip,t)>.99){const up=pathAt(M,'up',t);x=Math.max(x,Math.acos(Math.min(1,up.y/up.length())));}return x;};
 const need=requiredTilt(fluid.profile,Math.max(.01,fluid.startingVolumeMl*endFraction))+.052,s0=most(P.sip),s1=most(P.last);
 const b=s1>s0?Math.min(1,Math.max(0,(need-s0)/(s1-s0))):0;lastBlends.set(key,b);return b;
}
/**
 * A beer drunk as animated, timed for who drinks it: at a table (`table` 'counter' or 'booth', with the `side` hand) the glass
 * taken off it, the first draught of a fresh glass (`first`) or a later sip (`last` of LAST blended into it), set down and let
 * go; held ('held'), a sip from the glass held before them. {M, seq, duration, drink, last}: each part's place in the motion and
 * in the play. (`counter: false`, the old word for held.)
 */
export function beerPlan(prop,style=BEER_STYLE_DEFAULT,{counter=true,table=counter?'counter':'held',side='R',first=false,last=0}={}){
 const M=beerMotion(prop,table,table==='held'?'R':side);if(!M)return null;const P=beerParts(M),seq=[];let total=0;
 const held=table==='held',parts=held?['sip']:['take',first?'first':'sip','let'];
 for(const part of parts){const warp=beerWarp(part,style);seq.push({part,start:P[part][0],at:total,warp});total+=warp.duration;}
 return {M,seq,duration:total,drink:!held&&first?'first':'sip',last:first?0:last,table};
}
/** Where a plan is `e` seconds in: the part and the motion's time. */
export function beerPlanAt(plan,e){const s=plan.seq.findLast(x=>e>=x.at)||plan.seq[0];return {part:s.part,t:s.start+s.warp.at(e-s.at)};}
/** The plan's beer left at the motion's time t (its fill, LAST's blended into SIP's). */
const planFill=(plan,t)=>sampler(plan.M,t,plan.last).track(plan.M.fill);
/** The fill at the start and the end of the plan's draught (its drinking part's). */
const draught=plan=>{const D=beerParts(plan.M)[plan.drink];return [planFill(plan,D[0]+.5),planFill(plan,D[1]-.05)];};
/** How much of the sip's beer is drunk `e` seconds into a plan, 0..1: none before the draught, the motion's fill going down
 *  while the rim is at the lip, all of it after (as createBeerTableDrink takes it from the lease). */
export function beerDrunkAt(plan,e){
 const [f0,f1]=draught(plan);if(!(f0>f1))return e>=plan.duration?1:0;
 const {part,t}=beerPlanAt(plan,Math.min(e,plan.duration-1e-6)),i=plan.seq.findIndex(x=>x.part===part),j=plan.seq.findIndex(x=>x.part===plan.drink);
 if(i<j)return 0;if(i>j)return 1;return Math.min(1,Math.max(0,(f0-planFill(plan,t))/(f0-f1)));
}
/** How long a resident's sip of beer takes (a venue's drink step): the plan's length; 0 for a glass not drunk as animated. */
export const beerSipLength=(prop,name,opts)=>beerPlan(prop,beerStyleOf(name),opts)?.duration||0;
/** The glass's rest on a table for a play: where it stands, and turned as it stands (or as a drinker on that side has it). */
export const beerRestAt=(avatar,place,side)=>({position:new THREE.Vector3().copy(place),quaternion:restTurn(avatar.root,side)});

/**
 * Johansson's glass at Minato (game.js sipDrink, the lease the beer service gives: its glass is the one Thao set down, kept in
 * the room), drunk as animated: at the counter or the booth's table (whichever it stands on, beerTableFor), with the hand on
 * its side (beerSideFor), taken off the table, the first long draught of a fresh glass or a later sip (as far toward the last
 * of it as the beer left after it, beerLastBlend), set down where it stood, let go. The same interface as table-drink.js
 * createAvatarTableDrink. Call after the animator.
 */
export function createBeerTableDrink(avatar,lease,{onComplete=()=>{},onCancel=()=>{},style=beerStyleOf(avatar.recipe?.name)}={}){
 const prop=lease.prop;
 prop.updateWorldMatrix(true,false);avatar.root.updateWorldMatrix(true,false);
 const rest={position:prop.getWorldPosition(new THREE.Vector3()),quaternion:prop.getWorldQuaternion(new THREE.Quaternion())};
 const table=beerTableFor(avatar,rest.position,prop),side=beerSideFor(avatar,rest.position),M=beerMotion(prop,table,side);
 const drinkPart=(lease.startFraction??1)>=.99?'first':'sip',last=drinkPart==='sip'?beerLastBlend(M,prop,lease.endFraction):0;
 const plan=beerPlan(prop,style,{table,side,first:drinkPart==='first',last}),total=plan.duration,[f0,f1]=draught(plan);
 let elapsed=0,active=true,diag=null,lastFlow=0,lookAt=null;
 const where=e=>beerPlanAt(plan,e);
 function finish(cancelled=false){
  if(!active)return null;active=false;restBeer(avatar);
  const fluid=levelHeldDrink(prop);if(fluid){fluid.surface(new THREE.Vector3(0,1,0));fluid.update(prop.userData.portion??lease.startFraction);}
  // (back where it stood, upright, its own transform again)
  prop.matrixAutoUpdate=true;const w=new THREE.Matrix4().compose(rest.position,rest.quaternion,new THREE.Vector3(1,1,1));
  if(prop.parent){prop.parent.updateWorldMatrix(true,false);w.premultiply(prop.parent.matrixWorld.clone().invert());}
  w.decompose(prop.position,prop.quaternion,prop.scale);prop.updateWorldMatrix(false,true);
  if(avatar.handHeld)avatar.handHeld.R=0;
  const result={...(cancelled?lease.cancel():lease.finish()),volumeConsumedMl:Math.max(0,lease.startFraction-(prop.userData.portion??lease.startFraction))*(fluid?.startingVolumeMl||0)};
  (cancelled?onCancel:onComplete)(result);return result;
 }
 return {prop,get active(){return active;},get elapsed(){return elapsed;},get diagnostics(){return diag;},get lookAt(){return lookAt;},get duration(){return total;},
  update(dt){
   if(!active)return;elapsed+=dt;if(elapsed>=total){finish();return;}
   const {part,t}=where(elapsed),cue=playBeerDrink(avatar,prop,t,1,{motion:M,rest,blend:{in:elapsed,out:total-elapsed},style,dt,fresh:elapsed<=dt+1e-9,last});
   // (the hands closing as animated, over what the animator had: the mug's handle in the handle's shape)
   const hand=beerHand(avatar,prop,cue),free=beerFreeHand(cue);avatar.grip?.(hand.side,hand.amount*cue.w,hand.shape);avatar.grip?.(free.side,free.amount*cue.w);
   // (the beer goes down as the motion's does while the rim is on his lip)
   if(part===drinkPart&&cue.lip>.99&&f0>f1){const flow=Math.min(1,Math.max(0,(f0-cue.fill)/(f0-f1)));if(flow>lastFlow){lastFlow=flow;lease.consume(flow);}}
   {const f=beerFace(cue,style);if(!f.look)delete f.look;avatar.paintFace?.(f);}
   lookAt=cue.look*cue.w>.15?prop.localToWorld(new THREE.Vector3(0,prop.userData.rimHeight||.12,0)):null;
   diag={...cue,part,t,elapsed,total,consumedPortion:lease.consumedPortion,table,last};
  },
  cancel(){return finish(true);}};
}
