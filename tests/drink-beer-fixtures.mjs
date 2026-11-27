// What tests/drink-beer.test.mjs and tests/drink-beer-tables.test.mjs measure of a glass of beer drunk as animated
// (src/avatars/drink-beer.js): played as the game plays it, every frame's facts, and the checks every drink is held to.
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
installDOM();
const {buildAvatar,HAND}=await import('../src/avatars/build.js');
const {recipeFor}=await import('../src/avatars/cast.js');
const {createAvatarAnimator}=await import('../src/avatars/animate.js');
const {createDrinkProp,setPropPortion,IZAKAYA_PLAYER_SEATS}=await import('../src/people/izakaya-beer.js');
const {lowerLip}=await import('../src/avatars/consume.js');
const {levelHeldDrink}=await import('../src/avatars/table-drink.js');
const {requiredTilt}=await import('../src/drinking/liquid.js');
const {createBeerTableDrink,restTurn,beerSideFor,beerPlan,beerStyleOf,beerMotion,beerLastBlend}=await import('../src/avatars/drink-beer.js');
const {beerRim,vesselOf}=await import('../src/avatars/beer-hold.js');
const {MINATO_COMPACT}=await import('../src/world/interiors/minato-compact-plan.js');

/** A wrist's limits (animate.js PALM.wrist, the right hand's terms; the left's y and z the right's mirror), radians. */
export const PALM_WRIST=[[-.35,.5],[-.45,.45],[-1.1,1.25]];
/** No joint's turn a frame changes by this much from one frame to the next (a pop: tests/drink-can.test.mjs). */
export const JUMP=.06;
export const UPPER=['spine','chest','neck','head','shoulderL','elbowL','handL','shoulderR','elbowR','handR'];
export const KIND={mug:'draft',pint:'pint',glass:'bottle'};
const seeded=()=>{let s=7;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};};
const wristOf=(a,s)=>{const e=new THREE.Euler().setFromQuaternion(a.bones['hand'+s].quaternion,'XYZ');return [e.x,s==='R'?e.y:-e.y,s==='R'?e.z:-e.z];};

/** How deep the glass goes into the drawn head (metres): points on its wall and its rim, each by a ray from the head's middle. */
export function glassInFace(a,prop){
 const m=a.measure,centre=a.bones.head.localToWorld(new THREE.Vector3(0,m.headCentre-m.headY,0)),h=prop.userData.rimHeight,ray=new THREE.Raycaster();let deep=0;
 const r=vesselOf(prop)==='mug'?.047:vesselOf(prop)==='pint'?.038:.03;
 // (as the can's test: its wall to just under the rim, and the opening's middle; the rim itself is under the lip)
 for(let j=0;j<=6;j++)for(let k=0;k<16;k++){const ang=k/16*Math.PI*2,p=prop.localToWorld(new THREE.Vector3(Math.cos(ang)*r*(j===6?.6:1),h*Math.min(j,5.8)/6,Math.sin(ang)*r*(j===6?.6:1)));
  const d=p.clone().sub(centre),len=d.length();if(len>m.Rh*1.6)continue;
  ray.set(centre,d.normalize());const out=ray.intersectObject(a.face.head,true).filter(x=>x.distance>=len);if(out.length&&out[0].distance-len>deep)deep=out[0].distance-len;}
 return deep;
}
/** The table at a seat (the counter's, or the booth's) as a box: its top, and its extent in x and z (world). */
function tableBox(seat){
 const P=MINATO_COMPACT,b=seat.counter?{c:P.counter.position,w:P.counter.width,d:P.counter.depth,top:P.counter.top,thick:.06}:{c:P.booth.position,w:P.booth.tableWidth,d:P.booth.tableDepth,top:P.booth.tableTop,thick:.05};
 return {min:new THREE.Vector3(b.c[0]-b.w/2,b.top-b.thick,b.c[2]-b.d/2),max:new THREE.Vector3(b.c[0]+b.w/2,b.top,b.c[2]+b.d/2),top:b.top};
}
/** How far any point of either hand (build.js HAND's contact envelope, the closed hand's too) is inside the table (metres). */
function handInTable(a,box){
 let deep=0;const m=a.measure;
 for(const side of ['R','L'])for(const list of [HAND.touch,HAND.fist?.touch||[]])for(const p of list){
  const w=a.bones['hand'+side].localToWorld(new THREE.Vector3((side==='R'?-1:1)*p[0]*m.hand,p[1]*m.hand,p[2]*m.hand));
  if(w.x<box.min.x||w.x>box.max.x||w.z<box.min.z||w.z>box.max.z||w.y<box.min.y||w.y>box.top)continue;
  deep=Math.max(deep,Math.min(box.top-w.y,w.y-box.min.y,w.x-box.min.x,box.max.x-w.x,w.z-box.min.z,box.max.z-w.z));}
 return deep;
}
const runs=new Map();
/**
 * A glass drunk off a table by `who` (Johansson's way, game.js sipDrink: createBeerTableDrink), seated at `seat` (a counter
 * stool, or a booth seat: `window` with the glass to the right, `table` with it to the left), the glass from `start` of it to
 * `end`: every frame's facts.
 */
export function tableDrink(who,vessel,{seat:seatId='counter2',start=1,end=.6}={}){
 const key=[who,vessel,seatId,start,end].join('|');if(runs.has(key))return runs.get(key);
 const SEAT=IZAKAYA_PLAYER_SEATS[seatId],a=buildAvatar(recipeFor(who),{shadows:false}),room=new THREE.Group(),holder=new THREE.Group();room.add(holder);holder.add(a.root);
 holder.position.set(...SEAT.position);holder.rotation.set(0,SEAT.yaw,0);
 const animator=createAvatarAnimator(a,{random:seeded()}),state={seated:true,seatHeight:SEAT.surfaceY,seatFront:SEAT.front};
 for(let i=0;i<90;i++)animator.update(1/60,state);room.updateMatrixWorld(true);
 // (the glass where Thao sets it down at that seat, turned as she turns it: its drinking side and a mug's handle to the hand on its side)
 const prop=createDrinkProp(KIND[vessel],{held:true}),place=new THREE.Vector3(...SEAT.table),side=beerSideFor(a,place);room.add(prop);
 prop.position.copy(place);prop.quaternion.copy(restTurn(a.root,side));setPropPortion(prop,start,{immediate:true});
 let consumed=0;const lease={prop,kind:KIND[vessel],startFraction:start,endFraction:end,get consumedPortion(){return consumed;},
  consume(p){consumed=(start-end)*p;setPropPortion(prop,start-consumed,{immediate:true});},finish:()=>({left:1,consumedPortion:consumed}),cancel:()=>({left:1,consumedPortion:consumed})};
 const faces=[];const paint=a.paintFace.bind(a);a.paintFace=s=>{faces.push(s);return paint(s);};
 const drink=createBeerTableDrink(a,lease),lip=lowerLip(a).lower,top=prop.position.y,fluid=levelHeldDrink(prop),box=tableBox(SEAT),frames=[];
 while(drink.active){
  animator.update(1/60,state);drink.update(1/60);room.updateMatrixWorld(true);const c=drink.diagnostics;if(!drink.active||!c)break;
  const up=new THREE.Vector3(0,1,0).applyQuaternion(prop.getWorldQuaternion(new THREE.Quaternion()));
  let low=Infinity;for(let i=0;i<16;i++){const ang=i/16*Math.PI*2,r=(prop.userData.grip.radius??.03)*.9;low=Math.min(low,prop.localToWorld(new THREE.Vector3(Math.cos(ang)*r,0,Math.sin(ang)*r)).y);}
  frames.push({t:c.elapsed,part:c.part,c,rimLip:prop.localToWorld(beerRim(prop,side)).distanceTo(a.bones.head.localToWorld(lip.clone())),
   tilt:up.angleTo(new THREE.Vector3(0,1,0)),portion:prop.userData.portion,low:low-top,foot:prop.getWorldPosition(new THREE.Vector3()),face:faces.at(-1),
   need:requiredTilt(fluid.profile,Math.max(.01,fluid.startingVolumeMl*prop.userData.portion)),wrist:{R:wristOf(a,'R'),L:wristOf(a,'L')},
   inFace:frames.length%6===0?glassInFace(a,prop):0,inTable:frames.length%3===0?handInTable(a,box):0,surface:fluid.up.clone(),
   foam:a.bones.head.getObjectByName('Foam moustache')?.visible||false,joints:UPPER.map(j=>a.bones[j].quaternion.clone())});
 }
 const run={a,prop,frames,top,spot:place.clone(),side,duration:drink.duration,table:frames[0]?.c.table,last:frames[0]?.c.last};runs.set(key,run);return run;
}
/**
 * A resident's glass held with nowhere to set it down (animate.js: the 'Drink' or 'DrinkStanding' pose, a glass of beer in the
 * hand and no `drinkRest`): standing, or `seated` on a chair with no table (Mr Fujita's in his shed). `timed`: its sip in the
 * venue's time (`consumeElapsed` over the plan) from `portion`; else in their own rhythm for `seconds` (two sips and the hold
 * between), then the pose ended and the glass taken from the hand (the play eased out). Every frame's facts.
 */
export function heldDrink(who,vessel,{seated=false,portion=.6,timed=true,seconds=0}={}){
 const key=['held',who,vessel,seated,portion,timed,seconds].join('|');if(runs.has(key))return runs.get(key);
 const a=buildAvatar(recipeFor(who),{shadows:false}),room=new THREE.Group();room.add(a.root);
 const animator=createAvatarAnimator(a,{random:seeded()}),prop=createDrinkProp(KIND[vessel],{held:true});setPropPortion(prop,portion,{immediate:true});
 const base={seated,seatHeight:.44,seatFront:.19},pose=seated?'Drink':'DrinkStanding',rest={...base,pose:seated?'Sit':'Idle_Neutral'};
 for(let i=0;i<60;i++)animator.update(1/60,rest);room.updateMatrixWorld(true);
 a.bones.handR.add(prop);
 const plan=beerPlan(prop,beerStyleOf(recipeFor(who).name),{table:'held'}),lip=lowerLip(a).lower,frames=[];
 const length=timed?plan.duration+.6:seconds,after=timed?0:.9;
 for(let i=0;i<Math.round((length+after)*60);i++){const e=i/60,on=e<length;
  if(!on&&prop.parent)prop.removeFromParent();
  animator.update(1/60,on?{...base,heldProp:prop,pose,...(timed?{consumeElapsed:Math.min(e,plan.duration)}:{})}:rest);room.updateMatrixWorld(true);const c=animator.beerCue;
  frames.push({t:e,on,c,rimLip:on?prop.localToWorld(beerRim(prop,'R')).distanceTo(a.bones.head.localToWorld(lip.clone())):Infinity,wrist:{R:wristOf(a,'R'),L:wristOf(a,'L')},
   hand:a.bones.handR.getWorldPosition(new THREE.Vector3()),inFace:on&&i%6===0?glassInFace(a,prop):0,foot:on?prop.getWorldPosition(new THREE.Vector3()):null,joints:UPPER.map(j=>a.bones[j].quaternion.clone())});}
 const run={a,prop,plan,frames};runs.set(key,run);return run;
}
/** The worst of a run's frames: each joint's turn a frame and its change, the glass's step a frame, the wrists past their limits. */
export function worst(frames,from=1){
 let turn=[0],jump=[0],glass=[0],wrist=[0];
 for(let i=from;i<frames.length;i++){const f=frames[i],e=frames[i-1];
  f.joints.forEach((q,j)=>{const d=q.angleTo(e.joints[j]);if(d>turn[0])turn=[d,UPPER[j],f.t];if(i>from){const x=Math.abs(d-e.joints[j].angleTo(frames[i-2].joints[j]));if(x>jump[0])jump=[x,UPPER[j],f.t];}});
  if(f.foot&&e.foot){const d=f.foot.distanceTo(e.foot);if(d>glass[0])glass=[d,f.t];}
  for(const s of ['R','L'])f.wrist[s].forEach((v,k)=>{const [lo,hi]=PALM_WRIST[k],o=Math.max(lo-v,v-hi);if(o>wrist[0])wrist=[o,`${s} ${'xyz'[k]}`,f.t];});}
 return {turn,jump,glass,wrist};
}
/** The checks every glass off a table is held to (a report line for the log, and the asserts). */
export function checkTableDrink(tag,run,{drinks=true}={}){
 const {frames,spot}=run;let rim=0,n=0,low=0,foot=0,face=0,table=0,flow=0,short=0;
 for(let i=0;i<frames.length;i++){const f=frames[i];face=Math.max(face,f.inFace);table=Math.max(table,f.inTable);if(f.c.w<.99)continue;
  if(f.c.lip>.99&&f.c.hold>.5){rim=Math.max(rim,f.rimLip);n++;}
  if(f.c.hold>.5)low=Math.min(low,f.low);if(f.c.hold>.5&&f.c.counter>.99)foot=Math.max(foot,f.foot.distanceTo(spot));
  // (tipped as far as the beer left needs, on every frame it flows)
  if(f.c.lip>.99&&frames[i+1]&&frames[i+1].portion<f.portion-1e-5){flow++;short=Math.max(short,f.need-f.tilt);}}
 const W=worst(frames,2),line=`${tag}: rim ${(rim*1000).toFixed(1)} mm over ${n}; foot ${(foot*1000).toFixed(1)} mm from its place, ${(-low*1000).toFixed(1)} under the top; `+
  `glass ${(face*1000).toFixed(1)} mm into the face, hands ${(table*1000).toFixed(1)} into the table; wrist ${W.wrist[0].toFixed(3)} past (${W.wrist[1]} ${W.wrist[2]?.toFixed(2)}); `+
  `steps ${W.jump[0].toFixed(3)} rad (${W.jump[1]} ${W.jump[2]?.toFixed(2)}), turn ${W.turn[0].toFixed(2)}, glass ${(W.glass[0]*1000).toFixed(0)} mm a frame; tilt short by ${(short*180/Math.PI).toFixed(1)} deg over ${flow}`;
 if(drinks)assert.ok(n>20,`${tag}: drinks (${n} frames at the lip)`);
 assert.ok(rim<.002,`${tag}: the rim on the lip: ${line}`);
 assert.ok(low>-.001,`${tag}: never through the table: ${line}`);
 assert.ok(foot<.02,`${tag}: the foot where it stands while it is on the table: ${line}`);
 assert.ok(face<.002,`${tag}: the glass never in the face: ${line}`);
 assert.ok(table<.003,`${tag}: no hand through the table: ${line}`);
 assert.ok(W.wrist[0]<.05,`${tag}: the wrists within what a wrist does: ${line}`);
 assert.ok(W.turn[0]<.3&&W.jump[0]<JUMP,`${tag}: nothing pops: ${line}`);
 assert.ok(W.glass[0]<.03,`${tag}: the glass never snatched: ${line}`);
 if(drinks)assert.ok(short<.02,`${tag}: tipped as far as the beer left needs: ${line}`);
 return line;
}
export {THREE,beerMotion,beerLastBlend,IZAKAYA_PLAYER_SEATS,createDrinkProp,recipeFor};
