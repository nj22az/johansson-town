import * as THREE from '../../vendor/three.module.js';
import MUG from './motions/drink-beer-mug.js';
import PINT from './motions/drink-beer-pint.js';
import GLASS from './motions/drink-beer-glass.js';
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
 * counter or standing. One motion a glass (the draught mug, the pint, the small glass), each in four parts that start and end
 * on the same pose (the right hand on the glass where it stands on the counter): TAKE, FIRST (the first long draught, the
 * "kaa!", the foam moustache wiped off, set down with a tap), SIP (a later, quieter one) and LET. The brief, beat by beat, is
 * at the top of tools/blender/drink-beer-keys.py.
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
export const BEER_MOTIONS=Object.freeze({mug:normalizeMotion(MUG),pint:normalizeMotion(PINT),glass:normalizeMotion(GLASS)});
export const beerMotion=prop=>BEER_MOTIONS[vesselOf(prop)]||null;
/** Where each part is in a motion (seconds). */
export const beerParts=M=>({take:[M.markers.take,M.markers.first],first:[M.markers.first,M.markers.sip],sip:[M.markers.sip,M.markers.let],let:[M.markers.let,M.markers.end]});
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
const GULPER=Object.freeze({still:1,antic:.8,lift:.85,gulp:1.35,release:.9,kaa:1,set:.85,settle:.9,head:1.25,kaaAmount:1.2});
const SIPPER=Object.freeze({still:1,antic:1.1,lift:1.12,gulp:.6,release:1.1,kaa:.8,set:1.1,settle:1.1,head:.6,kaaAmount:.4});
export const BEER_STYLES=Object.freeze({
 'Mr Fujita':GULPER,Masaru:GULPER,Kai:GULPER,'Kōji':GULPER,Ryo:GULPER,
 Thao:SIPPER,Christina:SIPPER,
 'Nils Johansson':Object.freeze({still:1,antic:1.5,lift:1.15,gulp:1.25,release:1.2,kaa:1.3,set:1.15,settle:1.2,head:.9,kaaAmount:.8}),
});
export const BEER_STYLE_DEFAULT=Object.freeze({still:1,antic:1,lift:1,gulp:1,release:1,kaa:1,set:1,settle:1,head:1,kaaAmount:1});
export const beerStyleOf=name=>BEER_STYLES[name]||(name==='Johansson'?BEER_STYLES['Nils Johansson']:BEER_STYLE_DEFAULT);
const warps=new Map();
/**
 * A part timed for a style: `duration` (game seconds) and `at(s)`, the motion's seconds from the part's start at s game
 * seconds into it. Each beat's speed is the style's, the speeds eased into one another over a tenth of a second each side of
 * a beat's end (no step of speed), the part's own length `fit` seconds if asked.
 */
export function beerWarp(part,style=BEER_STYLE_DEFAULT,fit=0){
 const key=part+'|'+JSON.stringify(style)+'|'+fit;if(warps.has(key))return warps.get(key);
 const beats=BEATS[part],end=beats.at(-1)[1],step=1/240,rate=m=>{
  // (the beat's length factor, eased across each boundary over 0.1 s of the motion each side)
  let f=style[beats.find(b=>m<b[1])?.[2]||beats.at(-1)[2]]??1;
  for(let i=0;i<beats.length-1;i++){const b=beats[i][1],d=m-b;if(Math.abs(d)<.1){const u=(d+.1)/.2,e=u*u*(3-2*u);f=(style[beats[i][2]]??1)*(1-e)+(style[beats[i+1][2]]??1)*e;}}
  return f;};
 const ms=[0],ss=[0];for(let m=step;m<=end+1e-9;m+=step){ss.push(ss.at(-1)+step*rate(m-step/2));ms.push(m);}
 let total=ss.at(-1),scale=fit>0?fit/total:1;total*=scale;
 const at=s=>{const x=Math.max(0,Math.min(total,s))/scale;let lo=0,hi=ss.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(ss[mid]<=x)lo=mid;else hi=mid;}return ms[lo]+(ms[hi]-ms[lo])*(x-ss[lo])/Math.max(1e-9,ss[hi]-ss[lo]);};
 const out={duration:total,at};warps.set(key,out);return out;
}

/** A motion's cues at time t: the hands' closing, the face's, the contacts' weights, the beer left. */
export function beerCues(M,t){
 const s=d=>sampleTrack(M,d,t),F=M.face,C=M.contact;
 return {closeR:s(M.shapes.closeR),closeL:s(M.shapes.closeL),blink:s(F.blink),breath:s(F.breath),smile:s(F.smile),look:s(F.look),kaa:s(F.kaa),foam:s(F.foam),
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
function poseAt(avatar,M,t,w,unlean=0,head=1,mouth=0){
 for(const [name,track] of tracks(M)){const b=avatar.bones[name];if(!b)continue;_q.fromArray(track.evaluate(Math.max(0,Math.min(M.times.at(-1),t))));
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
/** The back of the left hand's fingers, just past the knuckles, in the left hand bone's frame: what wipes the foam off. */
const wipePoint=m=>new THREE.Vector3(...handPoint(m,'L',[HAND.half[0],HAND.knuckles*.7+HAND.tip*.3,.1]));
const binds=new WeakMap();
const bindOf=avatar=>binds.get(avatar)||binds.set(avatar,{L:avatar.bones.shoulderL.position.clone(),R:avatar.bones.shoulderR.position.clone(),neck:avatar.bones.neck.scale.clone()}).get(avatar);
/** Put back what a drink moves off the bones' own: the shoulders' places (the reach, the shrug) and the throat's squash. */
export function restBeer(avatar){
 const b=binds.get(avatar);if(!b)return;avatar.bones.shoulderL.position.copy(b.L);avatar.bones.shoulderR.position.copy(b.R);avatar.bones.neck.scale.copy(b.neck);
 const f=foams.get(avatar);if(f)f.visible=false;
}
/** Where a glass rests standing, or held with no counter before him: in front of his right hip, a hand's height up (the root's frame). */
const standRest=m=>new THREE.Vector3(-.12*m.k,m.hipY+.2*m.k,.24*m.k);

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
/** The moustache on (amount 0..1): what is left of it after the wipe, which goes from his left (u 1) to his right (u 0). */
function showFoam(avatar,amount){
 if(amount<=.01&&!foams.has(avatar))return;
 const g=foamOf(avatar);g.visible=amount>.01;for(const b of g.children)b.visible=b.userData.u<=amount+1e-6;
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
 const om=9,ze=.22;s.nv.addScaledVector(target.clone().sub(s.n),om*om*h).addScaledVector(s.nv,-2*ze*om*h);s.n.addScaledVector(s.nv,h).normalize();
 if(s.n.y<Math.cos(.245)){const flat=s.n.clone().setY(0).normalize();s.n.set(flat.x*Math.sin(.245),Math.cos(.245),flat.z*Math.sin(.245));}
 sloshes.set(prop,s);fluid.surface(s.n);fluid.update(prop.userData.portion??1);
}

/** The glass where it is this frame (world), its parent kept: in the right hand's socket while held, else standing at `rest`. */
export function placeBeer(avatar,prop,cues,rest){
 let world;
 if(cues.hold>=.5||!rest?.position){const S=beerSocket(avatar.measure,prop,'R');world=avatar.bones.handR.matrixWorld.clone().multiply(new THREE.Matrix4().compose(S.position,S.quaternion,new THREE.Vector3(1,1,1)));}
 else world=new THREE.Matrix4().compose(rest.position,rest.quaternion,new THREE.Vector3(1,1,1));
 if(prop.parent){prop.parent.updateWorldMatrix(true,false);world.premultiply(prop.parent.matrixWorld.clone().invert());}
 prop.matrixAutoUpdate=false;prop.matrix.copy(world);prop.matrixWorldNeedsUpdate=true;prop.updateMatrixWorld(true);
}
/** The glass's upright turn at its place on the counter, its rim's drinking side toward the body (`root`'s back). */
export const restTurn=root=>root.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI));

const played=new WeakMap();
/**
 * Beer drunk at time t (seconds into the glass's motion), over the pose the animator has made, by `w`.
 * opts: `rest` {position, quaternion} the glass's foot on the counter and its upright turn there (null: standing, or held
 * with no counter); `blend` {in, out} seconds into and before the end of the play (level by level, as the can's);
 * `style` (BEER_STYLES); `dt` (the slosh).
 * Returns the cues and how far each contact was put right (`fix`, metres).
 */
export function playBeerDrink(avatar,prop,t,w=1,{motion:M=beerMotion(prop),rest=null,blend=null,style=BEER_STYLE_DEFAULT,dt=1/60}={}){
 const cues=beerCues(M,t),fix={lip:0,foot:0,wipe:0,lift:0,R:0,L:0},m=avatar.measure,b=avatar.bones,k=m.k;
 const lastT=played.get(avatar);if(lastT===undefined||Math.abs(t-lastT)>.25)forgetWays(avatar);played.set(avatar,t);
 const lw=blend?levelWeights(blend):null;if(lw)w=lw[2];
 const bind=bindOf(avatar);restBeer(avatar);
 const counter=!!rest?.position,root=avatar.root.getWorldQuaternion(new THREE.Quaternion());
 if(w<=0&&!(lw&&lw[0]>0)){if(prop)placeBeer(avatar,prop,cues,rest);return {...cues,fix,w:0};}
 // the shoulders: the right one forward as he leans in for the glass on a counter (a reach), both up on the "kaa!"
 const k1=lw?lw[1]:w,shrug=cues.shrug*Math.min(1.3,style.kaaAmount)*.018*k*k1;
 b.shoulderR.position.copy(bind.R).add(new THREE.Vector3(0,shrug,counter?.05*k*cues.lean*k1:0));b.shoulderL.position.copy(bind.L).add(new THREE.Vector3(0,shrug,0));
 // each wrist where the animated body's was, in this body's size (the motion's whole pose; then blended as the move is)
 const goals={},unlean=counter?0:cues.lean,mouthW=cues.mouth,head=style.head??1;
 const back=w<1||lw&&lw[0]<1?held(avatar,M):null;poseAt(avatar,M,t,1,unlean,head,mouthW);
 {const chest=b.chest,L=lipsOf(avatar),wipeNear=sampleIdx(M,widened(M,'wipe',.35),t);
  const R=chest.localToWorld(pathAt(M,'R',t).multiplyScalar(k));
  if(mouthW>0)R.lerp(b.head.localToWorld(pathAt(M,'mouth',t).multiplyScalar(k).add(L.lower)),mouthW);
  // (by the counter: the wrist from the glass's place as the motion has it, from this glass's place: where it stands)
  const near=sampleIdx(M,widened(M,'counter',.45),t)*(1-mouthW);
  if(near>0){const place=counter?rest.position:avatar.root.localToWorld(standRest(m));R.lerp(place.clone().add(pathAt(M,'spot',t).applyQuaternion(root)),near);}
  const Lw=chest.localToWorld(pathAt(M,'L',t).multiplyScalar(k));
  if(wipeNear>0)Lw.lerp(b.head.localToWorld(pathAt(M,'mouthL',t).multiplyScalar(k).add(L.upper)),wipeNear);
  goals.R=R.sub(b.handR.getWorldPosition(_v));goals.L=Lw.sub(b.handL.getWorldPosition(_v));}
 if(back){back();poseAt(avatar,M,t,lw||w,unlean,head,mouthW);}
 for(const side of ['R','L']){const hand=b['hand'+side].getWorldPosition(new THREE.Vector3()),before=['shoulder','elbow','hand'].map(j=>b[j+side].quaternion.clone());
  const near=side==='L'?sampleIdx(M,widened(M,'wipe',.35),t):Math.max(cues.lip,sampleIdx(M,widened(M,'lip',.3),t));
  fix[side]=bring(avatar,side,null,hand.add(goals[side]),w,side==='R'?1:near,side==='R'?Math.max(near,cues.hold*sampleIdx(M,widened(M,'counter',.3),t)):near*.4,'beer'+side);
  if(side==='L')steady(avatar,'L',before,t,w*(1-near));
  const off=1-near;if(side==='R'&&off>0){const q=b.handR.quaternion,soft=q.clone();softWrist(soft,'R');q.slerp(soft,off);b.handR.updateWorldMatrix(false,true);}}
 if(prop){
  placeBeer(avatar,prop,cues,rest);
  const S=beerSocket(m,prop,'R'),inHand=p=>b.handR.worldToLocal(prop.localToWorld(p.clone()));
  // the foot on the counter where it stands, as the motion has it there (the rock before the lift, the tap of the set-down)
  const onCounter=counter?cues.hold*sampleIdx(M,widened(M,'counter',.3),t):0;
  if(onCounter>0){fix.foot=bring(avatar,'R',inHand(new THREE.Vector3()),rest.position.clone().add(pathAt(M,'foot',t).applyQuaternion(root)),onCounter*w,true,1,'beerFoot');placeBeer(avatar,prop,cues,rest);}
  // the rim on the lip, the glass tipped as far as the beer left in it needs (and the motion's 3 degrees more), never less
  if(cues.lip>0&&cues.hold>.5){
   const fluid=levelHeldDrink(prop),f=prop.userData.portion??1,need=fluid?requiredTilt(fluid.profile,Math.max(.01,fluid.startingVolumeMl*f))+.052:0;
   const up=new THREE.Vector3(0,1,0).applyQuaternion(prop.getWorldQuaternion(new THREE.Quaternion())),now=up.angleTo(new THREE.Vector3(0,1,0));
   if(need>now+1e-3){const axis=new THREE.Vector3(0,1,0).cross(up).normalize(),hq=b.handR.getWorldQuaternion(new THREE.Quaternion());
    hq.premultiply(new THREE.Quaternion().setFromAxisAngle(axis,(need-now)*cues.lip));b.handR.quaternion.copy(b.handR.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(hq));b.handR.updateWorldMatrix(false,true);placeBeer(avatar,prop,cues,rest);}
   const lip=b.head.localToWorld(lipsOf(avatar).lower.clone());
   fix.lip=bring(avatar,'R',inHand(beerRim(prop)),lip,cues.lip*w,true,1,'beerLip');placeBeer(avatar,prop,cues,rest);
  }
  // never through the counter: the lowest of its foot's round lifted onto the top
  if(counter&&cues.hold>.5){let low=Infinity;const g=prop.userData.grip||{},r=(g.radius??.03)*.9;
   for(let i=0;i<12;i++){const a=i/12*Math.PI*2;low=Math.min(low,prop.localToWorld(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r)).y);}
   const near=prop.getWorldPosition(new THREE.Vector3()).setY(0).distanceTo(rest.position.clone().setY(0));
   if(low<rest.position.y&&near<.2){const hand=b.handR.getWorldPosition(new THREE.Vector3());fix.lift=rest.position.y-low;bring(avatar,'R',null,hand.add(new THREE.Vector3(0,fix.lift+1e-4,0)),1,true,1,'beerLift');placeBeer(avatar,prop,cues,rest);}}
  slosh(prop,dt);
 }
 // the back of the left fingers across the upper lip
 if(cues.wipe>0){const lip=b.head.localToWorld(lipsOf(avatar).upper.clone());fix.wipe=bring(avatar,'L',wipePoint(m),lip,cues.wipe*w,true,1,'beerWipe');}
 // a swallow: the throat squashed a little and widened as much (its volume kept), on the beat
 const sq=.035*cues.swallow*w;if(sq>0){const x=1/Math.sqrt(1-sq);b.neck.scale.set(bind.neck.x*x,bind.neck.y*(1-sq),bind.neck.z*x);}
 showFoam(avatar,cues.foam*(lw?lw[1]:w));
 return {...cues,fix,w};
}
function sampleIdx(M,data,t){const T=M.times;if(t<=T[0])return data[0];if(t>=T.at(-1))return data.at(-1);let lo=0,hi=T.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(T[mid]<=t)lo=mid;else hi=mid;}return data[lo]+(data[hi]-data[lo])*(t-T[lo])/(T[hi]-T[lo]);}
/** The face for a beer's cues (the caller paints it): eyes shut on a long draught, the "kaa!" (brows up, the mouth open: the
 *  comedy register's push, for those who give one), a content smile after, the eyes on the glass. */
export function beerFace(cue,style=BEER_STYLE_DEFAULT,base='neutral'){
 const w=cue.w??1,kaa=cue.kaa*w*(style.kaaAmount??1);
 const expression=kaa>.55?'laugh':kaa>.25||cue.smile*w>.5?'content':base;
 return {expression,blink:Math.max(cue.blink*w,0),talk:cue.breath*w>.4||kaa>.55?1:0,look:cue.look*w>.15?[0,1]:null};
}
/** How the right hand closes this frame (build.js grip: amount, shape). */
export const beerHand=(avatar,prop,cue)=>({...beerGrip(avatar.measure,prop),amount:cue.closeR});

/** How long a beer sip with the glass already in the hand lasts (a resident's drink step at a venue: 3 or 4 s), seconds. */
export const BEER_HELD_SIP=3.2;

/**
 * Johansson's glass at Minato's counter (game.js sipDrink, the lease the beer service gives: its glass is the one Thao set
 * down, kept in the room), drunk as animated: taken off the counter, the first long draught of a fresh glass or a later sip,
 * set down where it stood, let go. The same interface as table-drink.js createAvatarTableDrink. Call after the animator.
 */
export function createBeerTableDrink(avatar,lease,{onComplete=()=>{},onCancel=()=>{},style=beerStyleOf(avatar.recipe?.name)}={}){
 const prop=lease.prop,M=beerMotion(prop),P=beerParts(M);
 prop.updateWorldMatrix(true,false);
 const rest={position:prop.getWorldPosition(new THREE.Vector3()),quaternion:prop.getWorldQuaternion(new THREE.Quaternion())};
 const drinkPart=(lease.startFraction??1)>=.99?'first':'sip',seq=[];let total=0;
 for(const part of ['take',drinkPart,'let']){const warp=beerWarp(part,style);seq.push({part,start:P[part][0],at:total,warp});total+=warp.duration;}
 const f0=sampleTrack(M,M.fill,P[drinkPart][0]+.5),f1=sampleTrack(M,M.fill,P[drinkPart][1]-.05);
 let elapsed=0,active=true,last=null,lastFlow=0,lookAt=null;
 const where=e=>{const s=seq.findLast(x=>e>=x.at)||seq[0];return {part:s.part,t:s.start+s.warp.at(e-s.at)};};
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
 return {prop,get active(){return active;},get elapsed(){return elapsed;},get diagnostics(){return last;},get lookAt(){return lookAt;},get duration(){return total;},
  update(dt){
   if(!active)return;elapsed+=dt;if(elapsed>=total){finish();return;}
   const {part,t}=where(elapsed),cue=playBeerDrink(avatar,prop,t,1,{motion:M,rest,blend:{in:elapsed,out:total-elapsed},style,dt});
   // (the hands closing as animated, over what the animator had: the mug's handle in the handle's shape)
   const hand=beerHand(avatar,prop,cue);avatar.grip?.('R',hand.amount*cue.w,hand.shape);avatar.grip?.('L',cue.closeL*cue.w);
   // (the beer goes down as the motion's does while the rim is on his lip)
   if(part===drinkPart&&cue.lip>.99&&f0>f1){const flow=Math.min(1,Math.max(0,(f0-cue.fill)/(f0-f1)));if(flow>lastFlow){lastFlow=flow;lease.consume(flow);}}
   avatar.paintFace?.(beerFace(cue,style));
   lookAt=cue.look*cue.w>.15?prop.localToWorld(new THREE.Vector3(0,prop.userData.rimHeight||.12,0)):null;
   last={...cue,part,t,elapsed,total,consumedPortion:lease.consumedPortion};
  },
  cancel(){return finish(true);}};
}
