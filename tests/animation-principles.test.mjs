import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as A from '../tools/animation-audit.mjs';
import {GESTURES} from '../src/avatars/animate.js';

/**
 * The animation principles audit (docs/ANIMATION-STANDARD.md section 5; the owner, 27 November 2026: "https://github.com/
 * dylantarre/animation-principles use this as the guidelines for animating Johansson world make strict adherence to it").
 *
 * First the audit's own calibration: a move made as badly as a move can be (a linear lerp in time, no anticipation, the
 * hands on straight lines, every joint starting and stopping together, the arms each other's mirror) fails ease,
 * anticipation, arcs, overlap and twins; a move built to the standard's numbers passes every check that applies to it; a
 * landing passes squash with a squash that keeps the volume, and fails without one or with one that loses it.
 *
 * Then the game's moves: every move in animate.js GESTURES, and the walk, the run, the idle, sitting down and standing up, on
 * the same three bodies and at the same 60 frames a second as the command (`node tools/animation-audit.mjs`), so the test
 * sees exactly what the baseline was written from (about 100 s on one core). No move may fail a check on a body it does not
 * fail it on in tests/animation-principles.baseline.json; a move that now passes a check it failed must come off the
 * baseline for it (`--write-baseline`), so the list only shrinks; a move with no entry must pass everything.
 */
const BASELINE=JSON.parse(readFileSync(new URL('./animation-principles.baseline.json',import.meta.url),'utf8'));
const BODIES=A.pickBodies();

// ---- The fixtures: the body driven joint by joint, no animator.
// a quintic ease: flat speed and acceleration at both ends
const smoother=x=>{x=Math.min(1,Math.max(0,x));return x*x*x*(x*(6*x-15)+10);};
const span=(f,a,b)=>smoother((f-a)/(b-a));
const NEUTRAL={shoulderL:[0,0,.13],shoulderR:[0,0,-.13],elbowL:[-.12,0,0],elbowR:[-.12,0,0]};
const put=(bones,pose)=>{for(const j of A.JOINTS){const p=pose[j]||NEUTRAL[j]||[0,0,0];bones[j].rotation.set(p[0],p[1],p[2]);}};

/** The bad move: both hands from hanging to forward at shoulder height on straight lines at a constant speed (two-bone IK in
 *  each arm's upright plane), in 0.8 s; the hips, spine, chest, head and wrists lerped with them; the arms mirrored. */
function ikArm(m,bones,side,ty,tz){
 const a=-bones['elbow'+side].position.y,b=-(bones['hand'+side].position.y-m.hand*.455);
 const cy=-ty,cz=-tz,r2=cy*cy+cz*cz,be=-Math.acos(Math.min(1,Math.max(-1,(r2-a*a-b*b)/(2*a*b))));
 return [Math.atan2(cz,cy)-Math.atan2(b*Math.sin(be),a+b*Math.cos(be)),be];
}
const BAD=Object.freeze({frames:60,driver:(i,t,{bones,m})=>{const u=Math.min(1,Math.max(0,t/.8)),L=.43*m.k;   // linear in time
 const ty=-L*.95+L*.55*u,tz=.05*m.k+L*.75*u,pose={hips:[0,.25*u,0],spine:[.15*u,0,0],chest:[.1*u,0,0],head:[-.2*u,0,0]};
 for(const s of ['L','R']){const [sh,el]=ikArm(m,bones,s,ty,tz);pose['shoulder'+s]=[sh,0,s==='L'?.13:-.13];pose['elbow'+s]=[el,0,0];pose['hand'+s]=[-.6*u,0,0];}
 put(bones,pose);}});

/**
 * The good move, built to the standard (everyday register): the right hand reaches forward and up.
 * - Every joint on an eased curve (quintic) from rest to rest.
 * - The drag hierarchy: the root (hips, spine) sets off first, the chest, head and upper arms 7.5 frames after (3 at 24 fps,
 *   inside follow-through-overlapping's 2 to 4), the forearms and hands 7.5 after that; each level turns from its wind-up
 *   into the action and comes to rest in the same order, the same curve.
 * - Anticipation: the whole body winds up first, the weight to the side and back, the right shoulder back; the hand's
 *   wind-up (from the root's first move to the upper arm's turn) is 40% of its action (anticipation-mastery: 30-50%).
 * - The arc: the hand turns about the shoulder with the elbow easing open, about 15% of its chord off the straight line
 *   (arc-mastery, "subtle organic feel": 10-20%).
 * - No twins: the left arm does a smaller thing of its own (it swings back), not the right's mirror.
 */
const GOOD=(()=>{const F=7.5,share=.4,end=63,turn=share*end/(1+share)-F;
 return Object.freeze({frames:80,driver:(i,t,{bones})=>{const f=t*60,bk=k=>span(f,k*F,turn+k*F),on=k=>span(f,turn+k*F,end+(k-1)*F);
  put(bones,{hips:[0,0,.1*bk(0)-.1*on(0)],spine:[-.05*bk(0)+.2*on(0),0,0],
   chest:[0,-.06*bk(1)+.2*on(1),0],head:[-.06*bk(1)-.14*on(1),0,0],
   shoulderR:[.16*bk(1)-1.26*on(1),0,-.13-.05*on(1)],shoulderL:[.1*bk(1)+.2*on(1),0,.13+.05*on(1)],
   elbowR:[-.12+.06*bk(2)-.46*on(2),0,0],handR:[.1*bk(2)-.4*on(2),0,0],elbowL:[-.12+.04*bk(2)-.24*on(2),0,0]});}});})();

/** A landing: a hop 8 cm up, down onto the floor at 0.9 m/s, and, as the hips stop, a squash of the torso (the hips' scale
 *  `y` down by 3% at most, everyday's 2-5%, eased in and out over 12 frames), keeping its volume or not. */
const landing=({squash=.03,keep=true}={})=>Object.freeze({frames:60,driver:(i,t,{avatar,bones})=>{
 const T=.36,u=Math.min(1,Math.max(0,t/T));avatar.root.position.y=.08*4*u*(1-u);
 for(const j of A.JOINTS)bones[j].rotation.set(...(NEUTRAL[j]||[0,0,0]));
 const f=t*60-T*60,s=1-squash*Math.sin(Math.PI*Math.min(1,Math.max(0,f/12)))**2,w=keep?1/Math.sqrt(s):1;bones.hips.scale.set(w,s,w);}});

const bodies=new Map();const bodyOf=name=>{if(!bodies.has(name))bodies.set(name,A.createBody(name));return bodies.get(name);};
const audit=(name,fixture,who)=>A.analyse(A.recordMove(bodyOf(who),name,fixture)).checks;
const results=c=>Object.fromEntries(Object.entries(c).map(([k,v])=>[k,v.result]));

test('the audit fails a move made badly: a linear lerp, no anticipation, straight paths, everything at once, the arms mirrored',()=>{
 for(const who of BODIES){const c=audit('Fixture:bad',BAD,who);
  for(const check of ['ease','anticipation','arcs','overlap','twins'])assert.equal(c[check].result,'fail',`${who}: the bad move passes ${check}: ${JSON.stringify(c[check])}`);
  // (the measured numbers say why: speed from all to nothing in a frame, no counter-movement, a path a few % off its chord,
  // every level off together, the arms identical)
  assert.ok(c.ease.worstStep>=.9,`${who}: ease steps ${c.ease.worstStep}`);
  assert.ok(c.arcs.main.deviation<.1,`${who}: the hands' path ${c.arcs.main.deviation} off the straight`);
  assert.ok(c.overlap.gaps.every(g=>Math.abs(g.start)<5),`${who}: ${c.overlap.why}`);
  assert.ok(c.twins.difference<.01&&c.twins.lag===0,`${who}: ${c.twins.why}`);
 }
});

test('the audit passes a move built to the standard\'s numbers, on every body, and every check that can apply does',()=>{
 for(const who of BODIES){const c=audit('Fixture:good',GOOD,who);
  for(const check of ['ease','anticipation','arcs','overlap','twins','volume'])assert.equal(c[check].result,'pass',`${who}: the good move fails ${check}: ${JSON.stringify(c[check])}`);
  assert.equal(c.squash.result,'n/a',`${who}: no impact in a reach`);
  // (and with room to spare: inside the bands, not on their edges)
  assert.ok(c.anticipation.ratio>.33&&c.anticipation.ratio<.48,`${who}: anticipation ${c.anticipation.ratio} of the action`);
  assert.ok(c.arcs.main.deviation>.12&&c.arcs.main.deviation<.19,`${who}: arc ${c.arcs.main.deviation}`);
  assert.ok(c.overlap.gaps.every(g=>g.start>=6&&g.start<=9&&g.stop>=6&&g.stop<=9),`${who}: ${JSON.stringify(c.overlap.gaps)}`);
  assert.ok(c.ease.worstEdge<.4&&c.ease.worstStep<.4,`${who}: ease edge ${c.ease.worstEdge}, step ${c.ease.worstStep}`);
 }
});

test('a landing passes squash with a squash that keeps the volume, and fails without one or with one that loses it',()=>{
 const who='Johansson';
 const kept=audit('Fixture:landing',landing(),who),none=audit('Fixture:landing',landing({squash:0}),who),lost=audit('Fixture:landing',landing({keep:false}),who);
 assert.deepEqual([kept.squash.result,kept.volume.result],['pass','pass'],JSON.stringify(kept.squash));
 assert.ok(kept.squash.worst.squash>.025&&kept.squash.worst.squash<=.03,JSON.stringify(kept.squash.worst));
 assert.equal(none.squash.result,'fail',JSON.stringify(none.squash));assert.equal(none.volume.result,'pass');
 assert.equal(lost.volume.result,'fail',JSON.stringify(lost.volume));assert.equal(lost.squash.result,'fail',JSON.stringify(lost.squash));
});

// ---- The game's moves, as the command plays them.
let report=null;const run=()=>report??=A.audit({bodies:BODIES});

test('the baseline was written on the bodies the audit picks today',()=>{
 assert.deepEqual(BASELINE.bodies,BODIES,'the smallest, Johansson and the largest by measure have changed: write the baseline again (node tools/animation-audit.mjs --write-baseline)');
 assert.equal(BASELINE.fps,A.FPS);
});

test('every move in GESTURES is audited, and the walk, the run, the idle, sitting down and standing up',()=>{
 const r=run(),moves=Object.keys(r.moves);
 for(const m of [...Object.keys(GESTURES),...A.LOCOMOTION])assert.ok(moves.includes(m),`${m} is not audited`);
 for(const [m,x] of Object.entries(r.moves))for(const [who,b] of Object.entries(x.bodies))for(const c of A.CHECKS)
  assert.ok(['pass','fail','n/a','excluded'].includes(b.checks[c].result),`${m} on ${who}: ${c} gave ${b.checks[c].result}`);
 const C=A.counts(r);console.log('passing (of the moves each check applies to): '+A.CHECKS.map(c=>`${c} ${C[c].pass}/${C[c].pass+C[c].fail}`).join(', ')+`; every check ${C.all.pass}/${C.all.moves}`);
});

test('no move fails a check it does not already fail in the baseline, and a move with no entry passes everything',()=>{
 const r=run(),known=BASELINE.failures,added=[];
 for(const [m,x] of Object.entries(r.moves))for(const [who,b] of Object.entries(x.bodies))for(const c of A.CHECKS){
  if(b.checks[c].result!=='fail')continue;
  if(!known[m]?.[c]?.includes(who))added.push(`${m} on ${who} fails ${c}${known[m]?'':' (a move with no baseline entry)'}: ${b.checks[c].why||JSON.stringify(b.checks[c]).slice(0,200)}`);}
 assert.deepEqual(added,[],'new failures (docs/ANIMATION-STANDARD.md section 5: no new move and no change to a move may add one):\n'+added.join('\n'));
});

test('the baseline only shrinks: a check a move now passes comes off it',()=>{
 const r=run(),stale=[];
 for(const [m,f] of Object.entries(BASELINE.failures)){
  if(!r.moves[m]){stale.push(`${m} is no longer a move`);continue;}
  for(const [c,on] of Object.entries(f))for(const who of on)if(r.moves[m].bodies[who]?.checks[c].result!=='fail')stale.push(`${m} on ${who} now gives ${r.moves[m].bodies[who]?.checks[c].result} for ${c}`);}
 assert.deepEqual(stale,[],'take these off the baseline (node tools/animation-audit.mjs --write-baseline, after the move\'s sheets have been looked at):\n'+stale.join('\n'));
});

test('the can drink as animated in Blender (DrinkCanOpened): what it gets, for the re-key',()=>{
 const r=run(),d=r.moves.DrinkCanOpened;
 for(const [who,b] of Object.entries(d.bodies))console.log(`DrinkCanOpened on ${who}: `+A.CHECKS.map(c=>`${c} ${b.checks[c].result}${b.checks[c].why?` (${b.checks[c].why.slice(0,140)})`:''}`).join('; '));
 assert.ok(d,'audited');
});
