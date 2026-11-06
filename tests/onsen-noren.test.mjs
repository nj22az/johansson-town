import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildOnsenInterior,ONSEN_ROOM,ONSEN_FAN} from '../src/world/interiors/onsen.js';
import {ONSEN_DOORWAYS,ONSEN_NOREN,norenSpan,norenTop,createNorenMotion} from '../src/world/interiors/onsen-lobby.js';

// Plan batch 2 (shot-plan.md §7): the changing-room noren hang to 1.10 m, the slit is the only sight-line, they part for
// whoever passes without a head ever going through the cloth, and the indigo one breathes in the men's fan.
const N=ONSEN_NOREN,FRONT=ONSEN_ROOM.hall.front;
const build=(people=()=>[])=>{const room=new THREE.Group();const layout=buildOnsenInterior({room,reg(){},action(){},exit(){},people});room.updateMatrixWorld(true);return {room,layout};};
const panelsOf=(room,name)=>{const out=[];room.traverse(o=>{if(o.name===name)out.push(o);});return out.sort((a,b)=>a.position.x-b.position.x);};
const box=o=>new THREE.Box3().setFromObject(o);

test('both noren hang from the rod to a hem at 1.10 m, two panels each with only the slit between them',()=>{
 const {room,layout}=build();
 assert.equal(N.hem,1.1);assert.ok(Math.abs(N.top-N.h-N.hem)<1e-9,'the drop is the rod to the hem');
 for(const [name,D] of [['Women’s noren',ONSEN_DOORWAYS.women],['Men’s noren',ONSEN_DOORWAYS.men]]){
  const [a,b]=panelsOf(room,name).map(p=>box(p.children.find(c=>c.name==='Noren')));// the cloth itself, not what is taped to it
  for(const p of [a,b]){assert.ok(Math.abs(p.min.y-N.hem)<.002,name+' hem at '+p.min.y.toFixed(3));assert.ok(Math.abs(p.max.y-N.top)<.002,name+' hangs from the rod');}
  // Edge to edge across the doorway: the slit is the only gap, and it is the width of a seam.
  assert.ok(Math.abs(a.min.x-D.x0)<.002&&Math.abs(b.max.x-D.x1)<.002,name+' fills its doorway');
  assert.ok(Math.abs(b.min.x-a.max.x-N.slit)<1e-6,name+' slit '+(b.min.x-a.max.x).toFixed(4));
  // The heads of the town's people are behind it: every measured head top is under the rod, and their eyes (about
  // 0.28 m under the top) above the hem; the story's cast (faces 1.23–1.33 m) well above it.
  for(const [who,top] of Object.entries(N.tops)){assert.ok(top<N.top-.2,who);assert.ok(top-.28>N.hem+.03,who+'’s eyes are behind the cloth');}
  for(const who of ['Mr Fujita','Thuan','Thao','Nhung','Tetsuo','Miss Higa'])assert.ok(N.tops[who]-.28>N.hem+.1,who+'’s face is behind the cloth');
 }
 layout.dispose();
});

test('somebody standing just behind the cloth does not move it; somebody walking through parts it and never goes through it',()=>{
 const panels=[0,1].map(k=>({side:'men',panel:k,x:ONSEN_DOORWAYS.men.x0+(k+.5)*(ONSEN_DOORWAYS.men.x1-ONSEN_DOORWAYS.men.x0)/2,half:(ONSEN_DOORWAYS.men.x1-ONSEN_DOORWAYS.men.x0)/4}));
 // Standing a hand's breadth back from the cloth, either side, at the slit: nothing touches it.
 for(const name of ['Mr Fujita','Tetsuo','Johansson']){const m=createNorenMotion(panels,FRONT);
  for(const z of [FRONT+.36,FRONT-.36])for(let i=0;i<90;i++)m.step(1/30,[{name,x:.475,z}],null);
  assert.deepEqual(m.angles.map(a=>Math.abs(a)<1e-9),[true,true],name+' standing behind it leaves it hanging');}
 // Walking through the slit at 1.2 m/s, out of the lobby and into the men's room: at every frame the cloth line from the
 // rod is clear of the walker's head and shoulders (the hand's margin aside), and it settles once they are through.
 const walk=(name)=>{const m=createNorenMotion(panels,FRONT),seen=[];let z=FRONT+1.2;
  for(let i=0;i<150;i++){z-=1.2/30;const who={name,x:.475,z};m.step(1/30,[who],null);seen.push(m.angles.slice());
   const top=norenTop(name),u=FRONT-z,P=N.passer;
   for(const a of m.angles)for(let s=0;s<=N.h;s+=.01){const cu=s*Math.sin(a),cy=N.top-s*Math.cos(a);
    const inHead=cy>top-P.headDrop&&cy<top&&Math.abs(cu-u)<P.head-1e-3,inBody=cy>P.from&&cy<=top-P.headDrop&&Math.abs(cu-u)<P.shoulders-1e-3;
    assert.ok(!inHead&&!inBody,`${name} at z ${z.toFixed(2)}: the cloth goes through them at ${cu.toFixed(3)}, ${cy.toFixed(3)}`);}}
  for(let i=0;i<150;i++)m.step(1/30,[{name,x:.475,z:-2}],null);
  return {max:Math.max(...seen.flat()),min:Math.min(...seen.flat()),after:m.angles.slice(),seen};};
 for(const name of ['Mr Fujita','Thuan','Tetsuo','Johansson']){const w=walk(name);
  assert.ok(w.max>.4,name+' parts it: '+w.max.toFixed(2)+' rad');assert.ok(w.max<=N.swing.maxSwing+1e-9);
  assert.ok(w.min>-.2,name+' pushes it the way he walks');
  for(const a of w.after)assert.ok(Math.abs(a)<.01,name+': it hangs straight again after '+a.toFixed(3));}
 // Frame to frame it never jumps: no pop through a head.
 const w=walk('Mr Fujita');for(let i=1;i<w.seen.length;i++)for(let k=0;k<2;k++)assert.ok(Math.abs(w.seen[i][k]-w.seen[i-1][k])<.35,'a step of '+(w.seen[i][k]-w.seen[i-1][k]).toFixed(2)+' at frame '+i);
 // The same walk always moves it the same way.
 assert.deepEqual(walk('Mr Fujita').seen,w.seen);
 // norenSpan: nothing in reach far off, both sides under the rod.
 assert.equal(norenSpan(2,1.6),null);const under=norenSpan(0,1.6);assert.ok(under.lo<0&&under.hi>0);
});

test('the indigo noren breathes out into the lobby in the men’s fan, the crimson one hangs still, and both settle when the fan stops',()=>{
 let fanTime=0;const yawAt=t=>Math.sin(t*ONSEN_FAN.rate)*ONSEN_FAN.sweep;
 const panels=Object.values(ONSEN_DOORWAYS).flatMap(D=>[0,1].map(k=>({side:D.side,panel:k,x:D.x0+(k+.5)*(D.x1-D.x0)/2,half:(D.x1-D.x0)/4})));
 const run=(seconds,on)=>{const m=createNorenMotion(panels,FRONT),log=[];for(let t=0;t<seconds;t+=1/30){if(on)fanTime+=1/30;m.step(1/30,[],{at:ONSEN_FAN.at,time:fanTime,on,yawAt});log.push(m.angles.slice());}return {m,log};};
 const {m,log}=run(40,true);
 const men=log.map(a=>[a[2],a[3]]),women=log.map(a=>[a[0],a[1]]);
 assert.ok(women.flat().every(a=>a===0),'the crimson noren: no fan on the women’s side');
 const out=Math.min(...men.flat());assert.ok(out<-.03&&out>-.12,'breathes out into the lobby, a few degrees: '+out.toFixed(3));
 assert.ok(men.flat().every(a=>a<.02),'never blown into the changing room');
 // Once a sweep (the fan's head turns every 2π/0.4 s): in, out, in again, not a flutter.
 let breaths=0;for(let i=1;i<men.length;i++)if(men[i-1][0]>-.02&&men[i][0]<=-.02)breaths++;
 assert.ok(breaths>=2&&breaths<=4,'breaths in 40 s: '+breaths);
 // Smooth: no frame-to-frame jump.
 for(let i=1;i<men.length;i++)assert.ok(Math.abs(men[i][0]-men[i-1][0])<.01);
 // Each panel a moment after the other, never in lockstep.
 assert.ok(men.some(([a,b])=>Math.abs(a-b)>.002),'the two panels are not one board');
 // The fan stops (its circuit off): the breath dies away.
 for(let i=0;i<300;i++)m.step(1/30,[],{at:ONSEN_FAN.at,time:fanTime,on:false,yawAt});
 assert.ok(m.angles.every(a=>Math.abs(a)<.005),'still once the fan stops: '+m.angles.map(a=>a.toFixed(4)));
 // Photographs: the film can stop the parting (nobody in its plates parts the cloth) and the breath.
 assert.deepEqual(m.stage({part:false}),{part:false,breathe:true});assert.deepEqual(m.stage({breathe:false}),{part:false,breathe:false});
});

test('in the room: the noren hold off the people the room is told about, even in a frozen frame',()=>{
 let here=[];const {room,layout}=build(()=>here);
 const men=()=>panelsOf(room,'Men’s noren').map(p=>p.rotation.x);
 layout.tick(1/30,1170);assert.deepEqual(men().map(a=>Math.abs(a)<.2),[true,true]);
 here=[{name:'Tetsuo',x:.475,z:FRONT+.05}];layout.realUpdate();
 assert.ok(men().every(a=>a>.2),'pushed into the men’s room by him standing in it: '+men().map(a=>a.toFixed(2)));
 layout.props.stage({noren:{part:false}});here=[];for(let i=0;i<200;i++)layout.tick(1/30,1170);
 here=[{name:'Tetsuo',x:.475,z:FRONT+.05}];layout.realUpdate();assert.ok(men().every(a=>Math.abs(a)<.2),'not parted for a photograph');
 layout.dispose();
});
