import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {createDrinkProp,setPropPortion,DRINKS,BEER_SERVES} from '../src/people/izakaya-beer.js';
import {lowerLip} from '../src/avatars/consume.js';
import {levelHeldDrink} from '../src/avatars/table-drink.js';
import {requiredTilt} from '../src/drinking/liquid.js';
import {BEER_MOTIONS,beerParts,createBeerTableDrink,beerStyleOf,beerWarp} from '../src/avatars/drink-beer.js';
import {beerRim,beerSocket,vesselOf} from '../src/avatars/beer-hold.js';
import {normalizeMotion} from '../src/avatars/motion.js';
installDOM();

/**
 * Beer from a glass at Minato's counter, as it was animated in Blender (tools/blender/drink-beer.py; the owner, 27 November
 * 2026: "Remake it follow Disney principles how should it look when anyone drinks beer"): the draught mug, the pint and the
 * small glass, by Johansson and the residents, seated at the counter and with the glass in the hand. As the can's test asks
 * (tests/drink-can.test.mjs): the motion played is the one made there; the rim on the lower lip at every frame it is to be
 * there; the glass never in the face; the wrists within what a wrist does; nothing pops. And for a glass: its foot on the
 * counter where it stands and never through it; tipped as far as the beer left needs to reach the rim; the eyes shut on the
 * first draught, the "kaa!", the foam moustache wiped off; each resident timed as they drink.
 */
const PALM_WRIST=[[-.35,.5],[-.45,.45],[-1.1,1.25]];
const JUMP=.06,UPPER=['spine','chest','neck','head','shoulderL','elbowL','handL','shoulderR','elbowR','handR'];
// (seven bodies: Johansson and the residents who drink at Minato's counter, the largest (Sverker) among them; Vy, the smallest,
// does not: the counter is 20 cm past her reach leaning in as far as the motion does, and she is not served beer)
const BODIES=['Nils Johansson','Thao','Mr Fujita','Sverker','Thuan','Tetsuo','Masaru'];
// (who takes a glass off the counter and sets it down again: Johansson, the player (game.js sipDrink). A resident's glass comes
// to the hand at a venue (venue-service.js) and is drunk from the hand: heldDrink. The other bodies' arms, in their own
// proportion, come 2-5 cm short of the place Thao sets a glass at (the handover).)
const COUNTER_BODIES=['Nils Johansson'];
const SPOT=new THREE.Vector3(-.15,.739,.58);   // (where Thao sets a glass down at a counter stool, in the seated body's frame: tools/drink-beer-kit.mjs)
const runs=new Map();
const seeded=()=>{let s=7;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};};

/** A fresh glass (or a later sip, `first` false) drunk off the counter by `who`, seated on a counter stool: every frame's facts. */
function counterDrink(who,vessel,first=true){
 const key=[who,vessel,first].join('|');if(runs.has(key))return runs.get(key);
 const a=buildAvatar(recipeFor(who),{shadows:false}),room=new THREE.Group();room.add(a.root);
 const animator=createAvatarAnimator(a,{random:seeded()}),state={seated:true,seatHeight:.46,seatFront:.19};
 for(let i=0;i<90;i++)animator.update(1/60,state);room.updateMatrixWorld(true);
 const kind={mug:'draft',pint:'pint',glass:'bottle'}[vessel],prop=createDrinkProp(kind,{held:true});room.add(prop);
 prop.position.copy(a.root.localToWorld(SPOT.clone()));prop.quaternion.copy(a.root.getWorldQuaternion(new THREE.Quaternion())).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI));
 const start=first?1:.6,end=first?.6:.45;setPropPortion(prop,start,{immediate:true});
 let consumed=0;const lease={prop,kind,startFraction:start,endFraction:end,get consumedPortion(){return consumed;},
  consume(p){consumed=(start-end)*p;setPropPortion(prop,start-consumed,{immediate:true});},finish:()=>({left:1,consumedPortion:consumed}),cancel:()=>({left:1,consumedPortion:consumed})};
 const faces=[];const paint=a.paintFace.bind(a);a.paintFace=s=>{faces.push(s);return paint(s);};
 const drink=createBeerTableDrink(a,lease),lip=lowerLip(a).lower,top=prop.position.y,fluid=levelHeldDrink(prop),frames=[];
 while(drink.active){
  animator.update(1/60,state);drink.update(1/60);room.updateMatrixWorld(true);const c=drink.diagnostics;if(!drink.active||!c)break;
  const up=new THREE.Vector3(0,1,0).applyQuaternion(prop.getWorldQuaternion(new THREE.Quaternion()));
  let low=Infinity;for(let i=0;i<16;i++){const ang=i/16*Math.PI*2,r=(prop.userData.grip.radius??.03)*.9;low=Math.min(low,prop.localToWorld(new THREE.Vector3(Math.cos(ang)*r,0,Math.sin(ang)*r)).y);}
  const wrist=s=>{const e=new THREE.Euler().setFromQuaternion(a.bones['hand'+s].quaternion,'XYZ');return [e.x,s==='R'?e.y:-e.y,s==='R'?e.z:-e.z];};
  frames.push({t:c.elapsed,part:c.part,c,rimLip:prop.localToWorld(beerRim(prop)).distanceTo(a.bones.head.localToWorld(lip.clone())),
   tilt:up.angleTo(new THREE.Vector3(0,1,0)),portion:prop.userData.portion,low:low-top,foot:prop.getWorldPosition(new THREE.Vector3()),face:faces.at(-1),
   need:requiredTilt(fluid.profile,Math.max(.01,fluid.startingVolumeMl*prop.userData.portion)),wrist:{R:wrist('R'),L:wrist('L')},
   inFace:frames.length%6===0?glassInFace(a,prop):0,surface:fluid.up.clone(),foam:a.bones.head.getObjectByName('Foam moustache')?.visible||false,
   joints:UPPER.map(j=>a.bones[j].quaternion.clone())});
 }
 const run={a,prop,frames,top,spot:prop.position.clone(),duration:drink.duration};runs.set(key,run);return run;
}

/** A resident's sip with the glass in the hand (venue-service.js: the 'Drink' pose, consumeElapsed), seated at the counter or
 *  standing: every frame's facts. */
function heldDrink(who,vessel,seated){
 const key=['held',who,vessel,seated].join('|');if(runs.has(key))return runs.get(key);
 const a=buildAvatar(recipeFor(who),{shadows:false}),room=new THREE.Group();room.add(a.root);
 const animator=createAvatarAnimator(a,{random:seeded()}),kind={mug:'draft',pint:'pint',glass:'bottle'}[vessel],prop=createDrinkProp(kind,{held:true});a.bones.handR.add(prop);
 const faces=[];const paint=a.paintFace.bind(a);a.paintFace=s=>{faces.push(s);return paint(s);};
 const base={seated,seatHeight:.46,seatFront:.19};for(let i=0;i<60;i++)animator.update(1/60,{...base,pose:seated?'Sit':'Idle_Neutral'});
 const lip=lowerLip(a).lower,frames=[];
 for(let i=0;i<Math.round(3*60);i++){animator.update(1/60,{...base,heldProp:prop,pose:'Drink',consumeElapsed:i/60});room.updateMatrixWorld(true);const c=animator.beerCue;if(!c)continue;
  const wrist=s=>{const e=new THREE.Euler().setFromQuaternion(a.bones['hand'+s].quaternion,'XYZ');return [e.x,s==='R'?e.y:-e.y,s==='R'?e.z:-e.z];};
  frames.push({t:i/60,c,rimLip:prop.localToWorld(beerRim(prop)).distanceTo(a.bones.head.localToWorld(lip.clone())),face:faces.at(-1),wrist:{R:wrist('R'),L:wrist('L')},
   inFace:i%6===0?glassInFace(a,prop):0,foot:prop.getWorldPosition(new THREE.Vector3()),joints:UPPER.map(j=>a.bones[j].quaternion.clone())});}
 const run={a,prop,frames};runs.set(key,run);return run;
}

/** How deep the glass goes into the drawn head (metres): points on its wall and its rim, each by a ray from the head's middle. */
function glassInFace(a,prop){
 const m=a.measure,centre=a.bones.head.localToWorld(new THREE.Vector3(0,m.headCentre-m.headY,0)),h=prop.userData.rimHeight,ray=new THREE.Raycaster();let deep=0;
 const r=vesselOf(prop)==='mug'?.047:vesselOf(prop)==='pint'?.038:.03;
 // (as the can's test: its wall to just under the rim, and the opening's middle; the rim itself is under the lip)
 for(let j=0;j<=6;j++)for(let k=0;k<16;k++){const ang=k/16*Math.PI*2,p=prop.localToWorld(new THREE.Vector3(Math.cos(ang)*r*(j===6?.6:1),h*Math.min(j,5.8)/6,Math.sin(ang)*r*(j===6?.6:1)));
  const d=p.clone().sub(centre),len=d.length();if(len>m.Rh*1.6)continue;
  ray.set(centre,d.normalize());const out=ray.intersectObject(a.face.head,true).filter(x=>x.distance>=len);if(out.length&&out[0].distance-len>deep)deep=out[0].distance-len;}
 return deep;
}

test('the motions are the ones made in Blender: version 2, four parts that join on one pose, the rim on the lip where it was there',()=>{
 for(const [vessel,M] of Object.entries(BEER_MOTIONS)){
  assert.equal(M.version,2);assert.ok(M.reach.foot&&M.reach.spot&&M.reach.mouthL&&M.face.kaa&&M.contact.counter,vessel+': the beer\'s tracks');
  const P=beerParts(M),T=M.times;
  // (each part starts and ends on the same pose, so the game plays them in any order)
  const idx=t=>T.findIndex(x=>x>=t-1e-6);
  for(const t of [P.first[0],P.sip[0],P.let[0]])for(const [n,d] of Object.entries(M.joints)){const i=idx(t),j=idx(P.first[0]);
   const q=new THREE.Quaternion().fromArray(d,i*4),q0=new THREE.Quaternion().fromArray(d,j*4);assert.ok(q.angleTo(q0)<.005,`${vessel}: ${n} at ${t} s is the pose the parts join on (${q.angleTo(q0).toFixed(4)} rad)`);}
  const V=JSON.parse(readFileSync(new URL(`./drink-beer-${vessel}.verify.json`,import.meta.url),'utf8'));
  const on=V.lipWeight.map((w,i)=>w>.99?Math.hypot(...V.rim[i].map((v,j)=>v-V.lip[i][j])):0);
  assert.ok(Math.max(...on)<.008,`${vessel}: in Blender the rim on the lip to ${(Math.max(...on)*1000).toFixed(1)} mm`);
  assert.ok(T.length>300,vessel);
 }
 assert.throws(()=>normalizeMotion({...BEER_MOTIONS.pint,face:{...BEER_MOTIONS.pint.face,kaa:[0]}}),/Invalid kaa track/);
});

for(const vessel of ['mug','pint','glass'])test(`the ${vessel}, taken off the counter and set down: the rim on the lip, the foot on the counter where it stands and never through it`,()=>{
 const report=[];
 for(const who of COUNTER_BODIES){
  const {frames,spot}=counterDrink(who,vessel);let rim=0,n=0,lip=0,low=0,foot=0,lift=0;
  for(const f of frames){if(f.c.w<.99)continue;if(f.c.lip>.99&&f.c.hold>.5){rim=Math.max(rim,f.rimLip);lip=Math.max(lip,f.c.fix.lip);n++;}
   if(f.c.hold>.5)low=Math.min(low,f.low);if(f.c.hold>.5&&f.c.counter>.99)foot=Math.max(foot,f.foot.distanceTo(spot));lift=Math.max(lift,f.c.fix.lift);}
  report.push(`${who}: rim ${(rim*1000).toFixed(1)} mm off over ${n} frames (put right by ${(lip*1000).toFixed(1)}); foot ${(foot*1000).toFixed(1)} mm from its place, ${(-low*1000).toFixed(1)} mm under the top at worst, lifted ${(lift*1000).toFixed(1)}`);
  assert.ok(n>30,`${who}: drinks (${n} frames at the lip)`);
  assert.ok(rim<.002,`${who}: the rim on the lip: ${report.at(-1)}`);
  assert.ok(low>-.001,`${who}: never through the counter: ${report.at(-1)}`);
  assert.ok(foot<.02,`${who}: the foot where it stands while it is on the counter: ${report.at(-1)}`);
 }
 console.log(report.join('\n'));
});

test('the glass never goes into the face, and the wrists stay within what a wrist does',()=>{
 for(const vessel of ['mug','pint','glass'])for(const [who,seated] of COUNTER_BODIES.map(w=>[w,'counter'])){const {frames}=counterDrink(who,vessel);
  const deep=Math.max(...frames.map(f=>f.inFace));if(process.env.BEER_DEBUG&&deep>.002)console.log(who,vessel,seated,frames.filter(f=>f.inFace>.001).map(f=>f.t.toFixed(2)+':'+(f.inFace*1000).toFixed(1)+':'+f.part+':lip'+f.c.lip.toFixed(2)).join(' '));assert.ok(deep<.002,`${who}, the ${vessel}: ${(deep*1000).toFixed(1)} mm into the face`);
  let worst=0,at=null;for(const f of frames)for(const s of ['R','L'])f.wrist[s].forEach((v,i)=>{const [lo,hi]=PALM_WRIST[i],o=Math.max(lo-v,v-hi);if(o>worst){worst=o;at=`${s} ${'xyz'[i]} at ${f.t.toFixed(2)} s`;}});
  assert.ok(worst<.05,`${who}, the ${vessel}: a wrist ${worst.toFixed(3)} rad past its limit (${at})`);}
});

// (27 November 2026: Johansson's right elbow, letting go of the mug and the small glass, swung 0.4 rad over five frames 0.5 s
// into LET, its speed stepping by 0.096 rad a frame. Two causes in the bake (tools/blender/drink-beer.py): the hand's way back
// to his thigh went out of the arm's reach as he sat back, so the IK took the arm straight and bent it again in five frames; and
// where the arm was straight the upper arm's roll was dropped to none and given back, the elbow taking it. The way back is now
// kept within reach (within_reach) and the roll carried across the straight frames (settled_rolls).)
test('nothing pops: no joint turns over between frames, its speed never jumps, the glass is never snatched',()=>{
 for(const vessel of ['mug','pint','glass'])for(const [who,seated] of COUNTER_BODIES.map(w=>[w,'counter'])){const {frames}=counterDrink(who,vessel);let turn=[0],glass=[0],jump=[0];
  for(let i=2;i<frames.length;i++){
   frames[i].joints.forEach((q,j)=>{const d=q.angleTo(frames[i-1].joints[j]);if(d>turn[0])turn=[d,UPPER[j],frames[i].t];
    if(i>1){const e=Math.abs(d-frames[i-1].joints[j].angleTo(frames[i-2].joints[j]));if(e>jump[0])jump=[e,UPPER[j],frames[i].t];}});
   const d=frames[i].foot.distanceTo(frames[i-1].foot);if(d>glass[0])glass=[d,frames[i].t];}
  assert.ok(turn[0]<.3,`${who}, ${vessel}: ${turn[1]} turns ${turn[0].toFixed(2)} rad in a frame at ${turn[2]?.toFixed(2)} s`);
  assert.ok(glass[0]<.03,`${who}, ${vessel}: the glass moves ${(glass[0]*1000).toFixed(0)} mm in a frame at ${glass[1]?.toFixed(2)} s`);
  assert.ok(jump[0]<JUMP,`${who}, ${vessel}: ${jump[1]}'s turn a frame changes by ${jump[0].toFixed(3)} rad from one frame to the next at ${jump[2]?.toFixed(2)} s`);}
});

test('the glass goes over as the beer goes down, far enough for it to reach the rim; the eyes shut on the first draught; "kaa!"; the foam wiped off',()=>{
 for(const [who,vessel] of [['Nils Johansson','pint'],['Nils Johansson','mug'],['Nils Johansson','glass']]){const {frames}=counterDrink(who,vessel);
  const drinking=frames.filter((f,i)=>f.c.lip>.99&&f.c.w>.99&&frames[i+1]&&frames[i+1].portion<f.portion-1e-5);
  assert.ok(drinking.length>20,`${who}: drinks (${drinking.length} frames)`);
  for(const f of drinking)assert.ok(f.tilt>f.need-.02,`${who} at ${f.t.toFixed(2)} s: tipped ${THREE.MathUtils.radToDeg(f.tilt).toFixed(0)} degrees, ${THREE.MathUtils.radToDeg(f.need).toFixed(0)} needed for the beer to reach the rim`);
  assert.ok(drinking.at(-1).tilt-drinking[0].tilt>THREE.MathUtils.degToRad(8),`${who}: further over as it empties`);
  assert.ok(drinking.filter(f=>f.face.blink>.99).length>drinking.length*.6,`${who}: the eyes shut on the first long draught`);
 }
 const j=counterDrink('Nils Johansson','pint').frames,t=counterDrink('Nils Johansson','glass').frames;
 assert.ok(j.some(f=>f.face.expression==='laugh'),'"kaa!" after Johansson\'s first draught');
 assert.ok(j.some(f=>f.foam)&&!j.at(-1).foam,'a foam moustache on the lip after the pint, wiped off');
 assert.ok(!t.some(f=>f.foam),'none from the small glass');
});

test('the tap of the set-down sloshes the beer, which settles',()=>{
 const {frames}=counterDrink('Nils Johansson','pint'),set=frames.findIndex((f,i)=>i>10&&f.part==='first'&&f.c.counter>.99&&frames[i-1].c.counter<.99);
 assert.ok(set>0,'set down');
 const tilt=f=>f.surface.angleTo(new THREE.Vector3(0,1,0)),after=frames.slice(set,set+30).map(tilt),late=frames.slice(set+90,set+100).map(tilt);
 assert.ok(Math.max(...after)>THREE.MathUtils.degToRad(.5),`the surface lags the glass (${THREE.MathUtils.radToDeg(Math.max(...after)).toFixed(1)} degrees)`);
 assert.ok(Math.max(...late)<THREE.MathUtils.degToRad(.5),`and settles (${THREE.MathUtils.radToDeg(Math.max(...late)).toFixed(2)} degrees 1.5 s after)`);
});

test('each drinks as themselves: a gulper\'s draught is longer and quicker to the glass, a sipper\'s shorter, Johansson looks at his beer first',()=>{
 const F=beerWarp('first',beerStyleOf('Mr Fujita')),T=beerWarp('first',beerStyleOf('Thao')),J=beerWarp('first',beerStyleOf('Nils Johansson')),D=beerWarp('first');
 const beat=(W,from,to)=>{let a=0,b=0;for(let s=0;s<W.duration;s+=1/120){const m=W.at(s);if(m<from)a=s;if(m<to)b=s;}return b-a;};
 assert.ok(beat(F,1.4,3.2)>beat(D,1.4,3.2)*1.25&&beat(F,.5,1.4)<beat(D,.5,1.4),'the gulper');
 assert.ok(beat(T,1.4,3.2)<beat(D,1.4,3.2)*.7,'the sipper');
 assert.ok(beat(J,.2,.5)>beat(D,.2,.5)*1.3,'Johansson');
});

test('the pint and the mug on Minato\'s menu, with who orders them and why',()=>{
 assert.ok(DRINKS.pint&&BEER_SERVES.pint.who&&BEER_SERVES.pint.why&&BEER_SERVES.draft.who&&BEER_SERVES.draft.why);
 assert.equal(vesselOf(createDrinkProp('pint',{held:true})),'pint');
});
