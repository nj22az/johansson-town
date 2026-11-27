#!/usr/bin/env node
/**
 * The principles audit (docs/ANIMATION-STANDARD.md, section 5; the owner, 27 November 2026: "https://github.com/dylantarre/
 * animation-principles use this as the guidelines for animating Johansson world make strict adherence to it").
 *
 * Plays every move in animate.js GESTURES, and the walk, the run, the idle, sitting down and standing up, on three bodies
 * (the smallest of the residents by measure, Johansson, the largest), as the game plays them (createAvatarAnimator with a
 * seeded random, 60 frames a second), samples every joint and end effector at every frame, and measures what section 5
 * lists: ease, anticipation, arcs, overlap, twins, squash and volume. Each check gives its numbers and passes, fails, does
 * not apply (with the reason), or is excluded for the move's class (EXCLUDED, with the reason).
 *
 * A library (the test uses it) and a command:
 *   node tools/animation-audit.mjs [--moves a,b] [--bodies a,b] [--out dir] [--write-baseline] [--quiet]
 * writes <out>/animation-audit.json (every move, body and check, with the numbers) and <out>/animation-audit.txt (the table),
 * default out: output/animation-audit. --write-baseline writes tests/animation-principles.baseline.json from the run.
 *
 * Every threshold is in THRESHOLDS below with where it comes from: a skill of the guideline (docs/animation-principles/
 * skills/...), the standard, or "(ours)" where the guideline gives no number, with the reason. They were set from the
 * guideline and the physics of the measures, then checked on two fixtures (tests/animation-principles.test.mjs: a linear
 * lerp that must fail, a move built to the standard's numbers that must pass), never tuned to make a move pass.
 */
import * as THREE from '../vendor/three.module.js';
import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {installDOM} from '../tests/fixtures.mjs';
import {buildAvatar,measure,handShape} from '../src/avatars/build.js';
import {recipeFor,RESIDENT_NAMES} from '../src/avatars/cast.js';
import {createAvatarAnimator,GESTURES,FUN_POSES,STORY_POSES} from '../src/avatars/animate.js';
import {PAIR_ROLES} from '../src/avatars/pair-poses.js';
import {createDrinkProp,createBiteProp,createDishProp} from '../src/people/izakaya-beer.js';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
export const FPS=60;
const DT=1/FPS;

// ---------------------------------------------------------------------------------------------------------------------
// Thresholds. Frame counts are game frames (60 a second); the guideline's are at 24 fps and are multiplied by 2.5
// (timing-principle-mastery: "At 60fps (UI/games), multiply by 2.5").
// ---------------------------------------------------------------------------------------------------------------------
export const THRESHOLDS=Object.freeze({
 // ---- What counts as moving.
 // A joint at rest turns slower than this, or slower than a tenth of its own fastest in the move (ours: the idle's breath
 // and sway turn the chest and head at 0.02 to 0.05 rad/s, well under it; a tenth of the move's own top speed, so that a
 // rest is a rest whatever the move's speed).
 restSpeed:.15,restFraction:.1,
 // A point at rest moves slower than this (ours: the idle moves a hand or the head 5 to 10 mm a second).
 restLinear:.05,
 // A joint takes part in a move's ease, overlap and twins when it turns at least this far from where it began
 // (ours: 0.1 rad is 6 degrees, the smallest turn of a limb that reads as a movement at the game's distance; less is the
 // body's own sway) and reaches twice the rest speed.
 joinTravel:.1,joinPeak:.3,
 // ---- Ease (slow-in-out-mastery: "Use animation curves—never linear for character motion" (game-development); "Flat
 // tangents = slow ... Never leave curves linear" (3d-spatial); the standard: "with flat tangents at holds").
 // The guideline gives no number. (ours) A movement from one rest to the next fails when its first or its last frame
 // already moves at more than half its top speed (both above the rest it is cut at), or when its velocity steps by more
 // than half its top speed in one frame. An eased curve leaves and reaches its rest continuously: a cubic ease-in-out
 // over N frames is at 4/N of its top speed in its first frame (44% at 8 frames, 133 ms) and changes speed by at most 4/N of
 // it a frame; a linear lerp is at 100% from its first frame and steps by 100%; a pose snapped to, and followed by the
 // animator at 14/s, steps by 100% in its first frame. The game's own moves fall on either side of half with few between:
 // of 462 moves and bodies, the worst edge under 20% in 229 and 90-100% in 181, the worst step under 30% in 227 and 100%
 // or more in 200. Movements shorter than 8 frames (3 at 24 fps: "quick" to "instantaneous", timing-principle-mastery)
 // cannot show the difference and are held only to the step of a lerp: nine tenths of their speed in one frame.
 easeEdge:.5,easeStep:.5,easeFrames:8,easeStepShort:.9,
 // ---- Anticipation (anticipation-mastery: "Every action above 200ms duration should have anticipation. Scale
 // anticipation duration to 30-50% of the main action"; "Anticipation must oppose the action direction").
 anticipationAbove:.2,anticipationRatio:Object.freeze([.3,.5]),
 // (ours) The counter-movement has to be seen: at least 5% of the action's travel back along it, and at least 5 mm
 // (the body's own sway moves a hand or the head about a millimetre in a fifth of a second).
 anticipationDepth:.05,anticipationDepthMin:.005,
 // (ours) A move whose primary effector travels less than this has no action to prepare (a breath, a glance of the eyes).
 actionTravel:.03,
 // ---- Arcs (arc-mastery: "Default arc height: 10-20% of travel distance for subtle organic feel, 30-50% for dramatic
 // sweeping motion"). The standard: "for travel over 10 cm" (ours). A stroke is the path between two rests; its arc is
 // the furthest the path goes from the straight line between its ends, over that line's length.
 // Everyday passes 10% to 50%, comedy 30% to 50%. Each register's floor is the guideline's (the mistake it names is the
 // straight line: "Straight-line interpolation", "Flat arcs on fast motion"); the ceiling of both is its largest arc, 50%,
 // a half circle. Everyday's is not 20%: 20% is the guideline's default for the curve put into a move from one point to
 // another, while a limb turning about its joint draws an arc set by how far it turns (90 degrees about the shoulder: 21%;
 // 120: 29%; 180: 50%), and the standard's section 5 already takes "30-50% when sweeping". A 20% ceiling would fail every
 // natural raise of an arm: the wave (43%), the stretch (42%), lifting a drink to the mouth (24%), and 202 of the 433 everyday
 // strokes measured. The owner may tighten it here (arcBands.everyday).
 arcTravel:.10,
 arcBands:Object.freeze({everyday:Object.freeze([.10,.50]),comedy:Object.freeze([.30,.50])}),
 // ---- Overlap (follow-through-overlapping: "offset secondary elements by 2-4 frames (at 24fps) per level of hierarchy";
 // ×2.5: 5 to 10 game frames per level). A joint starts where its first movement passes a tenth of that movement's own top
 // speed, and stops where its last movement falls under a tenth of its own (ours: where an eased curve leaves and reaches its
 // rest whatever its size); never under 0.08 rad/s, above the idle's own breath and sway (0.02 to 0.05 rad/s) that goes on
 // under many moves. (Until 27 November 2026 it was a tenth of the joint's top speed in the whole move: a joint with one fast
 // stroke was called stopped while it still turned back into its rest at half a radian a second, and one with a fast sway
 // late in the move was called started late. A fixed speed instead kept a fast joint moving longer than a slow one with the
 // same curve.)
 // A leg takes part only when its foot leaves the floor (ours): a foot on the floor holds its leg, and the overlap gives way
 // to the contact (the standard's hierarchy names no leg).
 overlapGap:Object.freeze([5,10]),overlapRest:.08,footLift:.03,
 // ---- Twins (the standard, solid drawing: "Offset them in time (at least 2 frames at 24 fps) or in amount (at least
 // 10%) (ours)": 5 game frames). The arms are compared as the left's turns at the shoulder, elbow and wrist against the
 // right's mirrored, at the lag (within half a second) that brings them closest: twins when that lag is under 5 frames and
 // they still differ by under 10% of the larger's movement. An arm moves when one of its joints turns 0.15 rad (ours: a
 // little over a single joint's 0.1, so that the arms' own sway and hang do not count as both moving).
 twinLag:5,twinDifference:.1,twinTravel:.15,twinSearch:30,
 // ---- Squash (squash-stretch-mastery: "Subtle contexts need 1-5%", "2-3% for subtle polish", "Start with 10%
 // deformation for energetic motions"; the standard: everyday 2-5% (calm-relaxation), comedy 10-20%
 // (friendliness-approachability)).
 squashBands:Object.freeze({everyday:Object.freeze([.02,.05]),comedy:Object.freeze([.10,.20])}),
 // An impact (ours): the hips falling at 0.3 m/s or faster (the speed of a 5 mm free fall: slower is a lowering, not a
 // fall) and stopped within 6 frames (100 ms; timing-principle-mastery: "1-2 frames: Instantaneous (impacts, pops)" at
 // 24 fps is 2.5 to 5 game frames, and a frame for the sampling).
 impactFall:.3,impactStop:.05,impactFrames:6,squashWindow:8,
 // ---- Volume (the standard: "bone scale whose product stays 1 (±1%)").
 volume:.01,
 // ---- How long a held move is watched: its way in and a hold of about 2 s (the lead of the audit); a timed move, its own
 // length and a second after for the settle (calm-relaxation: "Long settling times (500ms+)").
 hold:2,tail:1,
});

// ---------------------------------------------------------------------------------------------------------------------
// The register of each move (the standard, section 2): comedy for the funny poses (fun-poses.js FUN_POSES), the pair gags
// (pair-poses.js PAIR_ROLES), Fujita's Back and the other story moves (Ten Minutes of Heaven: animate.js's own list of the
// story's eased moves), and the comic set pieces EvilLaugh, WindUp, Tackle, Stomp, HeelKick, Tada and Cheer; everyday for
// all the rest: walking, idling, talking, listening, eating, drinking, work, sitting, the habits, greetings and feelings.
// To correct a move's register, add it to COMEDY_EXTRA or EVERYDAY_EXTRA (which wins).
// (Not sure, for the owner: the theatrical poses of expressive-poses.js (BattleRage, StartledPanic, Sleepwalker ...) and
// the dances of music-moves.js are left everyday, as the audit's lead has it.)
// ---------------------------------------------------------------------------------------------------------------------
const TEN_MINUTES_OF_HEAVEN=['CupHands','CoinToCheek','BowDeep','BowWalk','KneelHug','PoleFlick','Peek','BannerUp','FanWild','HoldOn',
 'FingerStop','Tape','Offer','Reach','LieKnead','GrenadeCoin','Aim','HoldUp','HoldUpStraws','Call','WriteAbove'];
const COMEDY_EXTRA=['EvilLaugh','WindUp','Tackle','Stomp','HeelKick','Tada','Cheer'];
const EVERYDAY_EXTRA=[];
export const COMEDY=Object.freeze(new Set([...Object.keys(FUN_POSES),...Object.keys(PAIR_ROLES),...STORY_POSES,...TEN_MINUTES_OF_HEAVEN,...COMEDY_EXTRA].filter(n=>!EVERYDAY_EXTRA.includes(n))));
export const registerOf=name=>COMEDY.has(name)?'comedy':'everyday';

// The moves the game plays that are not GESTURES: the walk (a resident's pace, people/schedules.js: 1.25 m/s), the run (the
// player's, game.js: 3 m/s, which the animator draws as its run), the idle, and sitting down and standing up (a seat taken
// as indoor-residents.js takes one: chairBlend from 0 to 1 in half a second, and back).
export const LOCOMOTION=Object.freeze(['Walk:loco','Run:loco','Idle','SitDown','StandUp']);
/** Every move the audit plays, most seen in play first (the order the baseline is fixed in; section 6 of the standard). */
export const SEEN_ORDER=Object.freeze(['Walk:loco','Idle','Talk','Nod','Wave','Eat','SitEat','Drink','SitDrink','DrinkCanOpened','DrinkCan','SitDown','StandUp',
 'ScratchHead','HairTuck','HeelRock','ChinTap','CollarTug','Run:loco']);
export function allMoves(){const rest=Object.keys(GESTURES).filter(n=>!SEEN_ORDER.includes(n));return [...SEEN_ORDER,...rest];}

/** The primary effector of a move, where the largest travel does not find it: sitting down and standing up are the hips going
 *  onto the seat and off it (the feet travel further only because the scene moves the body across the seat as it sits:
 *  indoor-residents.js moveAcrossSeat, which the audit does not play); a jump is the body leaving the floor (the crouch
 *  before it is in the hips), and the arms flung up are its secondary action, though they travel further. */
export const PRIMARY=Object.freeze({SitDown:'hips',StandUp:'hips',Jump:'hips',Hop:'hips',JumpForJoy:'hips',StartledJump:'hips'});
/** Cycles and seat changes, whose feet are not a stroke of their own: the walk's and the run's feet slide on the ground in the
 *  body's frame (their stance is straight by nature), and a seat change's are the scene's. Their arcs are the hands' and the
 *  head's. */
const NO_FOOT_ARCS=new Set(['Walk:loco','Run:loco','Idle','SitDown','StandUp']);

// How each move is played, where it is not standing with nothing in the hands (from what each move's own comment says).
const SEATED=new Set(['SitEnjoyFood','SitPresentFood','SitToast','SitPress','SitDrink','SitEat','SitRead','ChairUncurl','FrozenAbsurd','GrenadeCoin','PoleFlick','Call','ReachBack']);
const CONTEXT=Object.freeze({
 WriteAbove:{seated:true,seat:'Soak',pose:'Soak',seatHeight:-.35},   // soaking, the book held up out of the water
 LieKnead:{lying:true},                                              // "with lying, flat on the back kneading the air"
 CrabWalk:{speed:.3},BowWalk:{speed:.4},                             // they walk (sideways; backing out with a bow)
});
const PROPS=Object.freeze({
 DrinkCan:()=>({R:createDrinkProp('can',{held:true,sealed:true})}),DrinkCanOpened:()=>({R:createDrinkProp('can',{held:true})}),
 Drink:()=>({R:createDrinkProp('draft',{held:true})}),SitDrink:()=>({R:createDrinkProp('draft',{held:true})}),SitToast:()=>({R:createDrinkProp('draft',{held:true})}),
 Eat:()=>({R:createBiteProp('rice'),L:createDishProp('rice')}),SitEat:()=>({R:createBiteProp('rice'),L:createDishProp('rice')}),
});

// ---------------------------------------------------------------------------------------------------------------------
// Classes of move a check cannot measure reliably, excluded with the reason (they are not failures and not passes).
// ---------------------------------------------------------------------------------------------------------------------
export const EXCLUDED=Object.freeze({
 cycles:{moves:['Walk:loco','Run:loco','Idle'],checks:['anticipation','overlap'],
  why:'a cycle has no single action to prepare and no one start or stop to stagger: the walk and the run start and stop when the scene changes their speed, and the idle never stops'},
 swings:{moves:['Nod','HeadShake','LookAround'],checks:['anticipation'],
  why:'the head swings back and forth through its rest: every swing is the counter-movement of the next, so which is the action cannot be told from the motion (a nod\'s own dip, the action, lasts 0.17 s, under the 200 ms anticipation is for)'},
 windup:{moves:['WindUp'],checks:['anticipation'],why:'it is itself the anticipation, of the cartoon dash the scene plays after it'},
 lying:{moves:['LieKnead','CarriedPlank'],checks:['anticipation','arcs','squash'],
  why:'the whole body is tipped onto its back about the hips (and, carried, lifted): every point travels with the tipping, so the hands\' and head\'s paths and the hips\' fall are the tipping\'s, not the move\'s'},
});
const excludedFor=(move,check)=>Object.entries(EXCLUDED).find(([,c])=>c.moves.includes(move)&&c.checks.includes(check));

// ---------------------------------------------------------------------------------------------------------------------
// The skeleton and its levels.
// ---------------------------------------------------------------------------------------------------------------------
export const JOINTS=Object.freeze(['hips','spine','chest','neck','head','shoulderL','elbowL','handL','shoulderR','elbowR','handR','thighL','kneeL','footL','thighR','kneeR','footR']);
// The drag hierarchy (follow-through-overlapping, "The Drag Hierarchy"; the standard, rule 5): root (hips, spine) →
// primary (chest, head, upper arms) → secondary (forearms, hands) → tertiary (hair, cloth: on springs, see checkOverlap).
// The neck goes with the head; the legs, which the standard does not place, by the same reach from the root (ours): the
// thighs with the upper arms, the shins and feet with the forearms and hands.
export const LEVEL=Object.freeze({hips:0,spine:0,chest:1,neck:1,head:1,shoulderL:1,shoulderR:1,thighL:1,thighR:1,
 elbowL:2,elbowR:2,handL:2,handR:2,kneeL:2,kneeR:2,footL:2,footR:2});
const LEVEL_NAMES=['root','primary','secondary'];
export const EFFECTORS=Object.freeze(['handL','handR','head','hips','footL','footR']);

// ---------------------------------------------------------------------------------------------------------------------
// Bodies: the smallest and the largest of the residents by measure (height by depth by shoulder width), and Johansson.
// ---------------------------------------------------------------------------------------------------------------------
export function pickBodies(){
 const size=n=>{const m=measure(recipeFor(n));return m.H*m.depth*m.shoulderX;};
 const others=RESIDENT_NAMES.filter(n=>n!=='Johansson').map(n=>[n,size(n)]).sort((a,b)=>a[1]-b[1]);
 return [others[0][0],'Johansson',others.at(-1)[0]];
}

const seededRandom=(seed=7)=>{let s=seed;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};};
let domReady=false;
const ensureDOM=()=>{if(!domReady){installDOM();domReady=true;}};

/** A body to play moves on: built once, put back to its rest between moves. */
export function createBody(name){
 ensureDOM();
 const avatar=buildAvatar(recipeFor(name),{shadows:false}),holder=new THREE.Group();holder.add(avatar.root);
 const rest=new Map();avatar.root.traverse(o=>rest.set(o,{p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone(),parent:o.parent,visible:o.visible}));
 const children=new Map([...rest.keys()].map(o=>[o,new Set(o.children)]));
 return {name,avatar,holder,
  /** Everything as it was built: transforms, what hangs from what, the swing. */
  reset(){
   for(const [o,r] of rest){o.position.copy(r.p);o.quaternion.copy(r.q);o.scale.copy(r.s);o.visible=r.visible;if(o.parent!==r.parent)r.parent?.add(o);}
   for(const [o,kids] of children)for(const c of [...o.children])if(!kids.has(c))o.remove(c);
   avatar.springs?.reset();holder.updateMatrixWorld(true);
  }};
}

const _v=new THREE.Vector3();

/**
 * A recording of a move on a body: every animated joint's own turn (in its parent's frame), the world place of each end
 * effector (the middle of each hand, the middle of the head, the hips, each ankle) and of what the right hand holds, and
 * every bone's scale, at 60 frames a second.
 *
 * `driver(i, t)` makes frame i (t seconds into the move; negative before it): by default the game's animator playing `move`.
 * `pre` frames of rest are kept before the move starts (index `start`, its first frame: the one before it is the rest every
 * travel is measured from, so a jump in the first frame counts); `end` is where the move's own time ends.
 */
export function recordMove(body,move,{driver=null,frames=null,pre=30,warm=60,hold=THRESHOLDS.hold,tail=THRESHOLDS.tail}={}){
 const {avatar,holder}=body,m=avatar.measure,bones=avatar.bones;
 body.reset();
 const animator=driver?null:createAvatarAnimator(avatar,{random:seededRandom(),initialTime:0});
 const props=PROPS[move]?.()||{};if(props.R)bones.handR.add(props.R);if(props.L)bones.handL.add(props.L);
 const base={...(SEATED.has(move)?{seated:true,seatHeight:.45,seatFront:.2}:{}),...(CONTEXT[move]||{}),...(props.R?{heldProp:props.R}:{})};
 // the move's own length, and how long it is watched
 let length,watch,held=false,state=()=>base;
 const loco=move==='Walk:loco'||move==='Run:loco';
 // (the speed as actors.js gives it to the animator: damped toward the pace at 20/s, as a resident sets off and stops)
 if(loco){length=3;watch=4.2;const pace=move==='Run:loco'?3:1.25;let speed=0,last=-Infinity;
  state=t=>{if(t!==last){speed=THREE.MathUtils.damp(speed,t>=0&&t<3?pace:0,20,DT);last=t;}return speed>0?{...base,speed}:base;};}
 else if(move==='Idle'){length=watch=5;}
 else if(move==='SitDown'){length=.5;watch=2;state=t=>t<0?base:{...base,seated:true,seatHeight:.45,seatFront:.2,pose:'Sit',seat:'Sit',chairBlend:Math.min(1,t*2)};}
 else if(move==='StandUp'){length=.5;watch=2;const sat={...base,seated:true,seatHeight:.45,seatFront:.2,pose:'Sit',seat:'Sit'};state=t=>t<0?{...sat,chairBlend:1}:t<.5?{...sat,chairBlend:1-t*2}:base;}
 else if(driver){length=frames/FPS;watch=length+tail;}
 else{const d=GESTURES[move];if(d===undefined)throw Error('No such move: '+move);
  if(d===Infinity){held=true;const ramp=[FUN_POSES[move]?.ramp??PAIR_ROLES[move]?.ramp??.5].flat()[0];length=watch=ramp+hold;}
  else{length=d;watch=d+tail;}}
 const n=pre+Math.round(watch*FPS),start=pre,end=pre+Math.round(length*FPS);
 const rec={move,body:body.name,register:registerOf(move),fps:FPS,n,start,end,held,measure:{k:m.k,H:m.H},
  joints:Object.fromEntries(JOINTS.map(j=>[j,new Float64Array(n*4)])),
  eff:Object.fromEntries([...EFFECTORS,...(props.R?['prop']:[])].map(e=>[e,new Float64Array(n*3)])),
  scale:{},squashY:new Float64Array(n)};
 // every bone's scale (and the body's own), and which of them carry the torso: a squash is the torso shortened along its height
 const scaled=[['body',avatar.root],...Object.entries(bones).filter(([,o])=>o!==avatar.root)],TORSO=new Set(['body','root','hips','spine','chest']);
 for(const [nm] of scaled)rec.scale[nm]=new Float64Array(n);
 const H=handShape(m),handMid=new THREE.Vector3(0,m.hand*H.middle[1],0),headMid=new THREE.Vector3(0,m.headCentre-m.headY,0);
 const restScale=scaled.map(([,o])=>o.scale.x*o.scale.y*o.scale.z),restY=scaled.map(([,o])=>o.scale.y);
 const step=(i,t)=>{
  if(driver)driver(i-pre,t,{avatar,bones,m});
  else{const s=state(t);animator.update(DT,s);}
  holder.updateMatrixWorld(true);
 };
 // settle into the body's rest (the idle, or the seat for standing up) before anything is kept
 if(!driver)for(let i=0;i<warm;i++)step(-1,-(warm-i+pre)/FPS);
 const played=!driver&&!loco&&!['Idle','SitDown','StandUp'].includes(move);
 for(let i=0;i<n;i++){
  const t=(i-pre+1)/FPS;
  if(played&&i===pre)animator.play(move);
  step(i,t);
  for(const j of JOINTS){const q=bones[j].quaternion,a=rec.joints[j];a[i*4]=q.x;a[i*4+1]=q.y;a[i*4+2]=q.z;a[i*4+3]=q.w;}
  const put=(name,v)=>{const a=rec.eff[name];a[i*3]=v.x;a[i*3+1]=v.y;a[i*3+2]=v.z;};
  put('handL',bones.handL.localToWorld(_v.copy(handMid)));put('handR',bones.handR.localToWorld(_v.copy(handMid)));
  put('head',bones.head.localToWorld(_v.copy(headMid)));put('hips',bones.hips.getWorldPosition(_v));
  put('footL',bones.footL.getWorldPosition(_v));put('footR',bones.footR.getWorldPosition(_v));
  if(props.R)put('prop',props.R.getWorldPosition(_v));
  let squash=0;
  scaled.forEach(([nm,o],k)=>{rec.scale[nm][i]=o.scale.x*o.scale.y*o.scale.z/restScale[k];
   if(TORSO.has(nm))squash=Math.max(squash,1-o.scale.y/restY[k]);});
  rec.squashY[i]=squash;
 }
 return rec;
}

// ---------------------------------------------------------------------------------------------------------------------
// Measures.
// ---------------------------------------------------------------------------------------------------------------------
const qAt=(a,i)=>[a[i*4],a[i*4+1],a[i*4+2],a[i*4+3]];
const qMul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
const qInv=a=>[-a[0],-a[1],-a[2],a[3]];
/** The rotation vector (axis times angle) of a unit quaternion. */
function qLog(q){let [x,y,z,w]=q;if(w<0){x=-x;y=-y;z=-z;w=-w;}const s=Math.hypot(x,y,z);if(s<1e-12)return [2*x,2*y,2*z];const a=2*Math.atan2(s,w);return [x/s*a,y/s*a,z/s*a];}
const norm=v=>Math.hypot(...v);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);

/** A joint's angular velocity (rad/s, vector in its parent's frame) at each frame (0 at the first). */
function angularVelocity(a,n,world=false){
 const w=Array.from({length:n},()=>[0,0,0]);
 for(let i=1;i<n;i++){const r=world?qMul(qAt(a,i),qInv(qAt(a,i-1))):qMul(qAt(a,i),qInv(qAt(a,i-1)));w[i]=qLog(r).map(v=>v*FPS);}
 return w;
}
/** How far a joint has turned from frame `from`, at each frame (rad). */
function turnFrom(a,n,from){const q0=qInv(qAt(a,from));return Array.from({length:n},(_,i)=>norm(qLog(qMul(qAt(a,i),q0))));}
const pointAt=(a,i)=>[a[i*3],a[i*3+1],a[i*3+2]];

/** The frames where a speed is above rest: [first, last] runs, each at least `min` frames. */
function movingRuns(speed,from,to,rest,min=3){
 const runs=[];let a=-1;
 for(let i=from;i<=to;i++){const on=i<to&&speed[i]>rest;if(on&&a<0)a=i;else if(!on&&a>=0){if(i-a>=min)runs.push([a,i-1]);a=-1;}}
 return runs;
}

/** Each animated joint: its speed, its fastest, how far it turns, and the frames it moves in. */
function jointMotion(rec){
 const T=THRESHOLDS,out={};
 for(const j of JOINTS){
  const w=angularVelocity(rec.joints[j],rec.n),speed=w.map(norm),travel=Math.max(...turnFrom(rec.joints[j],rec.n,rec.start-1).slice(rec.start));
  let peak=0;for(let i=rec.start;i<rec.n;i++)peak=Math.max(peak,speed[i]);
  const rest=Math.max(T.restSpeed,T.restFraction*peak);
  out[j]={w,speed,peak,travel,rest,moving:travel>=T.joinTravel&&peak>=T.joinPeak};
 }
 return out;
}

// ---- Ease
// A joint's movements are the runs of frames it turns faster than its rest in. A run whose own top speed is under three
// times the rest is a wobble on a moving hold, not a movement from one rest to another: its first and last frames are cut
// at the rest whatever its shape, so it has no edges to judge; its velocity steps count, against the joint's top speed.
function checkEase(rec,J){
 const T=THRESHOLDS,worst={edge:0,step:0},failures=[];let segments=0;
 for(const j of JOINTS){const M=J[j];if(!M.moving)continue;
  // what a step at each frame is measured against (the top speed of the movement it is in), and how much of it it may be
  const ref=new Float64Array(rec.n).fill(M.peak),allow=new Float64Array(rec.n).fill(T.easeStep);
  for(const [a,b] of movingRuns(M.speed,rec.start,rec.n,M.rest)){
   let peak=0;for(let i=a;i<=b;i++)peak=Math.max(peak,M.speed[i]);
   if(peak<3*M.rest)continue;
   const L=b-a+1,short=L<T.easeFrames;
   for(let i=Math.max(0,a-1);i<=Math.min(rec.n-1,b+1);i++){ref[i]=peak;allow[i]=short?T.easeStepShort:T.easeStep;}
   // (a movement still going when the watch ends has no top speed or end of its own to judge; a short one, no edges)
   if(b>=rec.n-2||short)continue;
   segments++;
   // (above the rest the run is cut at: a snap is all of its speed at once whatever the rest, an eased start only just over it)
   const startSpeed=Math.max(0,M.speed[a]-M.rest)/(peak-M.rest),endSpeed=Math.max(0,M.speed[b]-M.rest)/(peak-M.rest);
   if(Math.max(startSpeed,endSpeed)>worst.edge)Object.assign(worst,{edge:Math.max(startSpeed,endSpeed),edgeJoint:j,edgeAt:(startSpeed>=endSpeed?a:b)-rec.start});
   if(startSpeed>T.easeEdge||endSpeed>T.easeEdge)failures.push({joint:j,kind:startSpeed>T.easeEdge?'starts':'ends',from:+((a-rec.start)/FPS).toFixed(3),to:+((b-rec.start)/FPS).toFixed(3),startSpeed:+startSpeed.toFixed(3),endSpeed:+endSpeed.toFixed(3),peak:+peak.toFixed(2)});
  }
  let step=0,at=0,over=0;for(let i=Math.max(1,rec.start);i<rec.n;i++){const d=norm(sub(M.w[i],M.w[i-1]))/ref[i];if(d>step){step=d;at=i;}if(d/allow[i]>over)over=d/allow[i];}
  if(step>worst.step)Object.assign(worst,{step,stepJoint:j,stepAt:at-rec.start});
  if(over>1)failures.push({joint:j,kind:'steps',at:+((at-rec.start)/FPS).toFixed(3),step:+step.toFixed(3),by:+norm(sub(M.w[at],M.w[at-1])).toFixed(2)});
 }
 if(!segments&&!failures.length)return {result:'n/a',why:'no joint turns as far as '+T.joinTravel+' rad from one rest to another'};
 return {result:failures.length?'fail':'pass',segments,failing:failures.length,
  worstEdge:+worst.edge.toFixed(3),worstEdgeJoint:worst.edgeJoint??null,worstEdgeAt:+((worst.edgeAt??0)/FPS).toFixed(3),
  worstStep:+worst.step.toFixed(3),worstStepJoint:worst.stepJoint??null,worstStepAt:+((worst.stepAt??0)/FPS).toFixed(3),
  why:failures.length?[...new Set(failures.map(f=>`${f.joint} ${f.kind}${f.kind==='steps'?` by ${(f.step*100).toFixed(0)}% of its top speed in a frame at ${f.at} s`:` at ${(Math.max(f.startSpeed,f.endSpeed)*100).toFixed(0)}% of its top speed (${f.from}-${f.to} s)`}`))].slice(0,4).join('; '):'',
  failures:failures.slice(0,10)};
}

// ---- The primary effector: the end effector that travels furthest from where it was when the move began.
function primaryOf(rec){
 if(PRIMARY[rec.move])return {name:PRIMARY[rec.move],overridden:true};
 let best=null;
 for(const e of EFFECTORS){const a=rec.eff[e],p0=pointAt(a,rec.start-1);let far=0;for(let i=rec.start;i<rec.n;i++)far=Math.max(far,norm(sub(pointAt(a,i),p0)));if(!best||far>best.travel)best={name:e,travel:far};}
 return best;
}
const linearSpeed=(a,n)=>Array.from({length:n},(_,i)=>i?norm(sub(pointAt(a,i),pointAt(a,i-1)))*FPS:0);

// ---- Anticipation
// The action is the stroke of the primary effector (from one of its rests to the next) in which it first comes half way to
// the furthest it goes. The counter-movement is the way it goes against the action's direction before it: inside that
// stroke (a wind-up that turns into the action without stopping), and in the strokes just before it that go against it
// (a crouch, held or not, before the spring: "Jump preparation: full crouch with held pose before launch",
// anticipation-mastery). The anticipation lasts from the first of those to the moment the action sets off.
function strokesOf(a,rec,from,to){
 const T=THRESHOLDS,sp=linearSpeed(a,rec.n);let peak=0;for(let i=from;i<=to;i++)peak=Math.max(peak,sp[i]);
 return movingRuns(sp,from,to+1,Math.max(T.restLinear,T.restFraction*peak),2);
}
function checkAnticipation(rec,P){
 const T=THRESHOLDS,a=rec.eff[P.name],p0=pointAt(a,rec.start-1),last=rec.held?rec.n-1:Math.min(rec.n-1,rec.end);
 const at=i=>pointAt(a,i),dist=i=>norm(sub(at(i),p0)),along=(i,j,u)=>sub(at(j),at(i)).reduce((acc,v,c)=>acc+v*u[c],0);
 let D=0;for(let i=rec.start;i<=last;i++)D=Math.max(D,dist(i));
 if(D<T.actionTravel)return {result:'n/a',why:`the ${P.name} travels ${(D*100).toFixed(1)} cm: no action`,effector:P.name};
 const S=strokesOf(a,rec,rec.start,last);let half=last;for(let i=rec.start;i<=last;i++)if(dist(i)>=.5*D){half=i;break;}
 let k=S.findIndex(([,y])=>y>=half);if(k<0)k=S.length-1;
 // the reach of the anticipation: the action's stroke, and the strokes just before it that go against its direction
 const [s0,s1]=S[k],dir=sub(at(s1),at(Math.max(0,s0-1))),dl=norm(dir),u=dir.map(v=>v/dl);
 let first=k;while(first>0&&along(Math.max(0,S[first-1][0]-1),S[first-1][1],u)<-.001)first--;
 const base=Math.max(0,S[first][0]-1),s=i=>along(base,i,u),len=Math.max(dl,s(s1));
 let sMin=0,iMin=base;for(let i=base;i<=s1;i++){const v=s(i);if(v<sMin){sMin=v;iMin=i;}}
 const depth=-sMin,need=Math.max(T.anticipationDepthMin,T.anticipationDepth*len),has=depth>=need;
 // it sets off back where it leaves the line it stood on (a drift across the line is not a counter-movement), and the action
 // sets off from the bottom, or from the end of a hold there (a held crouch is part of the anticipation: still within 5% of
 // the depth for 6 frames, 100 ms, or more)
 let from=base;if(has)for(let i=base;i<=iMin;i++)if(s(i)>=-.02*depth)from=i;
 let release=iMin;if(has){let i=iMin;while(i+1<=s1&&s(i+1)<=sMin+.05*depth)i++;if(i-iMin>=6)release=i;}
 const action=(s1-(has?release:Math.max(0,s0-1)))/FPS,antic=has?(release-from)/FPS:0,ratio=action>0?antic/action:0;
 const out={effector:P.name,from:+((from-rec.start)/FPS).toFixed(3),travel:+len.toFixed(3),action:+action.toFixed(3),depth:+depth.toFixed(4),depthShare:+(depth/len).toFixed(3),anticipation:+antic.toFixed(3),ratio:+ratio.toFixed(3)};
 if(action<=T.anticipationAbove)return {result:'n/a',why:`the action takes ${(action*1000).toFixed(0)} ms (anticipation is for actions over 200 ms)`,...out};
 const ok=has&&ratio>=T.anticipationRatio[0]&&ratio<=T.anticipationRatio[1];
 return {result:ok?'pass':'fail',why:!has?`no counter-movement (back ${(depth*1000).toFixed(1)} mm, ${(need*1000).toFixed(1)} mm needed)`:ok?'':`counter-movement ${(ratio*100).toFixed(0)}% of the action (30-50%)`,...out};
}

// ---- Arcs: each stroke of the hand, head, foot or held prop between rests, against its chord
function checkArcs(rec,P){
 const T=THRESHOLDS,band=T.arcBands[rec.register];
 // the hips are not an arc's effector (a jump straight up is straight): the furthest-travelled of the others (and, where the
 // feet are not a stroke of their own, of the hands and the head)
 const feet=!NO_FOOT_ARCS.has(rec.move),may=e=>e!=='hips'&&(feet||!e.startsWith('foot'));
 let name=P.name;if(!may(name)){let best=0;for(const e of EFFECTORS.filter(may)){const a=rec.eff[e],p0=pointAt(a,rec.start-1);let far=0;for(let i=rec.start;i<rec.n;i++)far=Math.max(far,norm(sub(pointAt(a,i),p0)));if(far>best){best=far;name=e;}}}
 const a=rec.eff[name],sp=linearSpeed(a,rec.n);let peak=0;for(let i=rec.start;i<rec.n;i++)peak=Math.max(peak,sp[i]);
 const strokes=[];
 for(const [i0,i1] of movingRuns(sp,rec.start,rec.n,Math.max(T.restLinear,T.restFraction*peak))){
  const A=pointAt(a,Math.max(0,i0-1)),B=pointAt(a,i1),c=sub(B,A),chord=norm(c);if(chord<T.arcTravel)continue;
  const u=c.map(v=>v/chord);let dev=0,path=0;
  for(let i=i0;i<=i1;i++){const p=sub(pointAt(a,i),A),along=p.reduce((s,v,k)=>s+v*u[k],0);dev=Math.max(dev,norm(p.map((v,k)=>v-along*u[k])));path+=norm(sub(pointAt(a,i),pointAt(a,i-1)));}
  const share=dev/chord;
  strokes.push({from:+((i0-rec.start)/FPS).toFixed(3),to:+((i1-rec.start)/FPS).toFixed(3),chord:+chord.toFixed(3),deviation:+share.toFixed(3),path:+path.toFixed(3),
   ok:share>=band[0]&&share<=band[1]});
 }
 if(!strokes.length)return {result:'n/a',why:`no stroke of the ${name} travels ${T.arcTravel*100} cm`,effector:name};
 const bad=strokes.filter(s=>!s.ok),main=strokes.reduce((x,y)=>y.chord>x.chord?y:x),out=d=>Math.max(band[0]-d,d-band[1]);
 const worst=bad.length?bad.reduce((x,y)=>out(y.deviation)>out(x.deviation)?y:x):null;
 return {result:bad.length?'fail':'pass',effector:name,band,strokes:strokes.length,failing:bad.length,main:{chord:main.chord,deviation:main.deviation},worst,
  why:worst?`${bad.length} of ${strokes.length} strokes of the ${name} outside ${band[0]*100}-${band[1]*100}%: the worst ${(worst.deviation*100).toFixed(1)}% off a ${(worst.chord*100).toFixed(0)} cm chord (${worst.from}-${worst.to} s)`:'',
  list:strokes.slice(0,10)};
}

// ---- Overlap: when each level of the drag hierarchy starts and stops. The keyed joints only: the hair, the skirts and the
// hems swing on springs (springs.js, straight ahead: their drag is the spring's), and they hang from the hips and the head,
// not after the forearms; carried by their parent from its first frame, their own start shows no lag to measure.
function checkOverlap(rec,J){
 const T=THRESHOLDS,levels=[[],[],[]];
 // (a leg whose foot stays on the floor is held by it)
 const lifted=side=>{const a=rec.eff['foot'+side],y0=a[(rec.start-1)*3+1];let up=0;for(let i=rec.start;i<rec.n;i++)up=Math.max(up,a[i*3+1]-y0);return up>=T.footLift;};
 const free={L:lifted('L'),R:lifted('R')};
 for(const j of JOINTS){const M=J[j];if(!M.moving)continue;if(/^(thigh|knee|foot)/.test(j)&&!free[j.slice(-1)])continue;
  const v=M.speed,floor=T.overlapRest;let a=-1,b=-1;for(let i=rec.start;i<rec.n;i++)if(v[i]>floor){if(a<0)a=i;b=i;}
  if(a<0)continue;
  // (the first movement's top: where the speed first stops rising, over three frames; the last's, where it last starts falling)
  const avg=i=>(v[Math.max(0,i-1)]+v[i]+v[Math.min(rec.n-1,i+1)])/3;
  let p1=a;while(p1<b&&avg(p1+1)>=avg(p1))p1++;let pl=b;while(pl>a&&avg(pl-1)>=avg(pl))pl--;
  const r1=Math.max(floor,T.restFraction*v[p1]),rl=Math.max(floor,T.restFraction*v[pl]);
  let on=a;while(on<p1&&v[on]<r1)on++;let off=b;while(off>pl&&v[off]<rl)off--;
  // (it stops only if it has come to rest before the watch ends: a held move's life goes on)
  const settled=off<rec.n-6;
  levels[LEVEL[j]].push({joint:j,on:on-rec.start,off:settled?off-rec.start:null});}
 const present=levels.map((l,k)=>l.length?{level:LEVEL_NAMES[k],k,on:Math.min(...l.map(x=>x.on)),off:l.every(x=>x.off!==null)?Math.max(...l.map(x=>x.off)):null,joints:l.map(x=>x.joint)}:null).filter(Boolean);
 if(present.length<2)return {result:'n/a',why:present.length?`only the ${present[0].level} level moves`:'nothing moves',levels:present};
 const gaps=[];
 for(let k=1;k<present.length;k++){const a=present[k-1],b=present[k],n=b.k-a.k,lo=T.overlapGap[0]*n,hi=T.overlapGap[1]*n;
  const on=b.on-a.on,off=a.off!==null&&b.off!==null?b.off-a.off:null;
  gaps.push({from:a.level,to:b.level,start:on,stop:off,need:[lo,hi],ok:on>=lo&&on<=hi&&(off===null||off>=lo&&off<=hi)});}
 const bad=gaps.filter(g=>!g.ok);
 return {result:bad.length?'fail':'pass',why:bad.length?bad.map(g=>`${g.from}→${g.to} starts ${g.start} frames${g.stop!==null?`, stops ${g.stop}`:''} apart (${g.need[0]}-${g.need[1]})`).join('; '):'',
  gaps,levels:present.map(l=>({level:l.level,start:l.on,stop:l.off,joints:l.joints}))};
}

// ---- Twins: the left arm against the right mirrored
function checkTwins(rec,J){
 const T=THRESHOLDS,arm=s=>['shoulder'+s,'elbow'+s,'hand'+s];
 const travel=s=>Math.max(...arm(s).map(j=>J[j].travel));
 if(travel('L')<T.twinTravel||travel('R')<T.twinTravel)return {result:'n/a',why:`one arm stays still (left ${travel('L').toFixed(2)}, right ${travel('R').toFixed(2)} rad)`};
 const series=(s,mirror)=>{const q0=arm(s).map(j=>qInv(qAt(rec.joints[j],rec.start-1)));
  return Array.from({length:rec.n},(_,i)=>arm(s).flatMap((j,k)=>{const r=qLog(qMul(qAt(rec.joints[j],i),q0[k]));return mirror?[r[0],-r[1],-r[2]]:r;}));};
 const L=series('L',false),R=series('R',true),a=rec.start,b=rec.held?rec.n-1:Math.min(rec.n-1,rec.end+Math.round(.5*FPS));
 const energy=X=>{let s=0;for(let i=a;i<=b;i++)s+=X[i].reduce((t,v)=>t+v*v,0);return Math.sqrt(s);};
 const scale=Math.max(energy(L),energy(R));
 const diff=lag=>{let s=0;for(let i=a;i<=b;i++){const k=Math.min(rec.n-1,Math.max(0,i+lag));s+=L[i].reduce((t,v,c)=>t+(v-R[k][c])**2,0);}return Math.sqrt(s)/scale;};
 let best={lag:0,difference:diff(0)};for(let lag=-T.twinSearch;lag<=T.twinSearch;lag++){const d=diff(lag);if(d<best.difference)best={lag,difference:d};}
 const twins=Math.abs(best.lag)<T.twinLag&&best.difference<T.twinDifference;
 return {result:twins?'fail':'pass',lag:best.lag,difference:+best.difference.toFixed(3),atZero:+diff(0).toFixed(3),
  why:twins?`the arms mirror each other: ${Math.abs(best.lag)} frames apart and ${(best.difference*100).toFixed(1)}% different`:''};
}

// ---- Squash: at each impact (the hips' fall stopped), the torso compressed by the register's amount
function checkSquash(rec){
 const T=THRESHOLDS,band=T.squashBands[rec.register],h=rec.eff.hips,v=Array.from({length:rec.n},(_,i)=>i?(h[i*3+1]-h[(i-1)*3+1])*FPS:0);
 const impacts=[];
 for(let i=rec.start+1;i<rec.n;i++){if(v[i]<-T.impactStop)continue;if(v[i-1]>=-T.impactStop)continue;
  let fall=0;for(let k=Math.max(rec.start,i-T.impactFrames);k<i;k++)fall=Math.min(fall,v[k]);
  if(fall<=-T.impactFall){let sq=0,vol=0;for(let k=Math.max(0,i-T.squashWindow);k<=Math.min(rec.n-1,i+T.squashWindow);k++){sq=Math.max(sq,rec.squashY[k]);for(const a of Object.values(rec.scale))vol=Math.max(vol,Math.abs(a[k]-1));}
   impacts.push({at:+((i-rec.start)/FPS).toFixed(3),fall:+fall.toFixed(2),squash:+sq.toFixed(3),volume:+vol.toFixed(3),ok:sq>=band[0]&&sq<=band[1]&&vol<=T.volume});}}
 if(!impacts.length)return {result:'n/a',why:'no impact: the hips never fall as fast as '+T.impactFall+' m/s and stop'};
 const bad=impacts.filter(x=>!x.ok);
 return {result:bad.length?'fail':'pass',band,impacts:impacts.length,failing:bad.length,worst:(bad[0]||impacts[0]),
  why:bad.length?`${bad.length} of ${impacts.length} impacts without a ${band[0]*100}-${band[1]*100}% squash (the first at ${bad[0].at} s: ${(bad[0].squash*100).toFixed(1)}%)`:''};
}

// ---- Volume: every bone's scale, x times y times z, against its rest
function checkVolume(rec){
 let worst=0,bone=null,at=0;
 for(const [b,a] of Object.entries(rec.scale))for(let i=rec.start;i<rec.n;i++){const d=Math.abs(a[i]-1);if(d>worst){worst=d;bone=b;at=i;}}
 return {result:worst<=THRESHOLDS.volume?'pass':'fail',worst:+worst.toFixed(4),bone,at:+((at-rec.start)/FPS).toFixed(3)};
}

export const CHECKS=Object.freeze(['ease','anticipation','arcs','overlap','twins','squash','volume']);
/** Every check of a recording. */
export function analyse(rec){
 const J=jointMotion(rec),P=primaryOf(rec);
 const run={ease:()=>checkEase(rec,J),anticipation:()=>checkAnticipation(rec,P),arcs:()=>checkArcs(rec,P),overlap:()=>checkOverlap(rec,J),
  twins:()=>checkTwins(rec,J),squash:()=>checkSquash(rec),volume:()=>checkVolume(rec)};
 const checks={};
 for(const c of CHECKS){const ex=excludedFor(rec.move,c);checks[c]=ex?{result:'excluded',class:ex[0],why:ex[1].why}:run[c]();}
 return {move:rec.move,body:rec.body,register:rec.register,primary:P.name,checks};
}

/** A move's results over the bodies: a check fails when it fails on any body, passes when it passes on all it applies to. */
export function combine(perBody){
 const out={};
 for(const c of CHECKS){const rs=perBody.map(r=>r.checks[c].result);
  out[c]=rs.includes('excluded')?'excluded':rs.includes('fail')?'fail':rs.includes('pass')?'pass':'n/a';}
 return out;
}

/** Audit moves on bodies: {moves: {name: {register, checks: {check: result}, bodies: {body: analysis}}}}. */
export function audit({moves=allMoves(),bodies=pickBodies(),onMove=null}={}){
 const built=bodies.map(createBody),report={generated:new Date().toISOString(),bodies,fps:FPS,thresholds:THRESHOLDS,excluded:EXCLUDED,moves:{}};
 for(const move of moves){
  const per=built.map(b=>analyse(recordMove(b,move)));
  report.moves[move]={register:registerOf(move),checks:combine(per),bodies:Object.fromEntries(per.map(p=>[p.body,{primary:p.primary,checks:p.checks}]))};
  onMove?.(move,report.moves[move]);
 }
 return report;
}

/** The failures of a report: for each move that fails anything, each check it fails and the bodies it fails on. */
export function failuresOf(report){
 const out={};
 for(const [m,r] of Object.entries(report.moves)){const f={};
  for(const c of CHECKS){const on=Object.entries(r.bodies).filter(([,b])=>b.checks[c].result==='fail').map(([n])=>n);if(on.length)f[c]=on;}
  if(Object.keys(f).length)out[m]=f;}
 return out;
}
/** How many moves pass each check (and all of them), of those it applies to. */
export function counts(report){
 const out={};const moves=Object.values(report.moves);
 for(const c of CHECKS){const rs=moves.map(m=>m.checks[c]);out[c]={pass:rs.filter(r=>r==='pass').length,fail:rs.filter(r=>r==='fail').length,na:rs.filter(r=>r==='n/a').length,excluded:rs.filter(r=>r==='excluded').length};}
 out.all={moves:moves.length,pass:moves.filter(m=>CHECKS.every(c=>m.checks[c]!=='fail')).length};
 return out;
}

const mark={pass:'ok',fail:'FAIL','n/a':'-',excluded:'excl'};
/** The readable table: one row a move, a column a check. */
export function summary(report){
 const rows=[['move','register',...CHECKS]];
 for(const [m,r] of Object.entries(report.moves))rows.push([m,r.register,...CHECKS.map(c=>mark[r.checks[c]])]);
 const w=rows[0].map((_,i)=>Math.max(...rows.map(r=>r[i].length)));
 const line=r=>r.map((v,i)=>v.padEnd(w[i])).join('  ');
 const C=counts(report);
 return [`Animation principles audit: ${Object.keys(report.moves).length} moves on ${report.bodies.join(', ')} (60 fps)`,'',line(rows[0]),line(w.map(n=>'-'.repeat(n))),...rows.slice(1).map(line),'',
  'Passing (of the moves each check applies to): '+CHECKS.map(c=>`${c} ${C[c].pass}/${C[c].pass+C[c].fail}`).join(', ')+`; every check: ${C.all.pass}/${C.all.moves}`].join('\n');
}

// ---------------------------------------------------------------------------------------------------------------------
// The command.
// ---------------------------------------------------------------------------------------------------------------------
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const arg=k=>{const i=process.argv.indexOf(k);return i>0?process.argv[i+1]:null;};
 const list=k=>arg(k)?.split(',').map(s=>s.trim()).filter(Boolean)||null;
 const out=arg('--out')||join(ROOT,'output/animation-audit'),quiet=process.argv.includes('--quiet');
 const started=Date.now();
 const report=audit({moves:list('--moves')||undefined,bodies:list('--bodies')||undefined,
  onMove:quiet?null:(m,r)=>process.stdout.write(`${m.padEnd(16)} ${CHECKS.map(c=>`${c} ${mark[r.checks[c]]}`).join('  ')}\n`)});
 report.seconds=Math.round((Date.now()-started)/1000);
 mkdirSync(out,{recursive:true});
 writeFileSync(join(out,'animation-audit.json'),JSON.stringify(report,null,1));
 const table=summary(report);writeFileSync(join(out,'animation-audit.txt'),table+'\n');
 console.log('\n'+table+`\n\n${report.seconds} s; written to ${out}`);
 if(process.argv.includes('--write-baseline')){
  const file=join(ROOT,'tests/animation-principles.baseline.json');
  writeFileSync(file,baselineText(baselineOf(report)));console.log('baseline written: '+file);
 }
}

/** The baseline: the checks each move fails today and the bodies it fails them on, the bodies, and the excluded classes. */
export function baselineOf(report){
 return {about:'The moves that fail the animation principles audit today (tools/animation-audit.mjs, docs/ANIMATION-STANDARD.md section 5), '+
  'for each the checks it fails and the bodies it fails them on. This list may only shrink: no new move and no change to a move may add a '+
  'failure, and a move that passes a check it failed on a body comes off for that body (tests/animation-principles.test.mjs). '+
  'Written by node tools/animation-audit.mjs --write-baseline; never edited by hand.',
  generated:report.generated.slice(0,10),bodies:report.bodies,fps:report.fps,excluded:report.excluded,failures:failuresOf(report)};
}
/** The baseline as text: one line a move, so that each move that comes off it is one line of the change. */
export function baselineText(b){
 const {failures,...rest}=b,head=JSON.stringify(rest,null,1).replace(/\n}$/,'');
 return head+',\n "failures": {\n'+Object.entries(failures).map(([m,f])=>`  ${JSON.stringify(m)}: ${JSON.stringify(f)}`).join(',\n')+'\n }\n}\n';
}
