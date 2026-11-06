import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {buildOnsenInterior} from '../src/world/interiors/onsen.js';
import {ONSEN_CIRCUITS,ONSEN_REWIRING,ONSEN_RACEWAY,stageScenario,assess,
 circuitOf,isOn,isWorking,isRunning} from '../src/world/interiors/onsen-electrics.js';
import {circleHitsRect} from '../physics.js';
import {provideCatalog} from './catalog-fixture.mjs';
// The massage chair's model in hand (World's catalogue): its back is what the rollers knead behind.
await provideCatalog('massage-chair');

const build=()=>{const room=new THREE.Group(),hits=[],actions=[];const layout=buildOnsenInterior({room,reg:(o,label,fn)=>hits.push({o,label,fn}),action:(...a)=>actions.push(a),exit(){}});room.updateMatrixWorld(true);return {room,hits,actions,layout};};
const BUSY=['dryer-1','dryer-2','dryer-3','massage-chair'];
const meshes=room=>{const list=[];room.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh)list.push(o);});return list;};
const visibleInWorld=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const ticks=(layout,seconds,step=1/30)=>{for(let t=0;t<seconds;t+=step)layout.tick(step,20*60);};

// The board as it is now: the rewiring (each mirror on its own branch) is the onsen's normal wiring. The single-branch overload
// it cured (three dryers and the chair on circuit 1, 38 A on 20) is history, kept in ONSEN_REWIRING and ONSEN_RACEWAY.
test('the rewired board: eight ways, the two once spare whiter and labelled on tape, each mirror on its own circuit',()=>{
 const a=stageScenario('rest');const {room,hits,actions,layout}=build();
 assert.equal(a.circuits.length,8,'eight circuits wired');
 const mirrors=['dryer-1','dryer-2','dryer-3'].map(circuitOf);assert.equal(new Set(mirrors).size,3,'each mirror on a circuit of its own: '+mirrors);
 assert.equal(circuitOf('massage-chair'),'changing-sockets','the chair keeps its 1994 spur off the left mirror');
 for(const id of ONSEN_REWIRING.ways){
  assert.ok(visibleInWorld(room.getObjectByName('New breaker '+id)),'a breaker in way '+id);
  assert.ok(room.getObjectByName('Breaker lever '+id).rotation.x<Math.PI/2,'lever up');
  assert.ok(visibleInWorld(room.getObjectByName('Tape label '+id)),'its tape');
 }
 assert.equal(room.getObjectByName('Spare way cover 7'),undefined,'no blanking covers left');
 // The new ones are whiter than the 1987 ones, in the lower row beside the pump's breaker.
 const at=name=>new THREE.Box3().setFromObject(room.getObjectByName(name)).getCenter(new THREE.Vector3());
 const colour=id=>room.getObjectByName('Breaker '+id).material.color.getHex();
 assert.notEqual(colour('vanity-2'),colour('pump'));
 for(const id of ONSEN_REWIRING.ways)assert.ok(Math.abs(at('Breaker '+id).y-at('Breaker pump').y)<.002,'lower row');
 // Facing the board (it faces +x, so you look -x and your left is +z), the ways count from your left: fridge, pump, 7, 8.
 const along=v=>-v.z;assert.ok(along(at('Breaker fridge'))<along(at('Breaker pump'))&&along(at('Breaker pump'))<along(at('Breaker vanity-2'))&&along(at('Breaker vanity-2'))<along(at('Breaker vanity-3')));
 const tapes=meshes(room).filter(m=>/^Tape label /.test(m.name)&&visibleInWorld(m)).map(m=>m.name).sort();
 assert.deepEqual(tapes,['Tape label changing-sockets','Tape label circuit list','Tape label vanity-2','Tape label vanity-3'],'three tapes on the board and one on the circuit list');
 hits.find(h=>h.label==='Look at the breaker board').fn();assert.match(actions.at(-1)[2],/eight 20 A breakers/);assert.match(actions.at(-1)[2],/masking tape/);
 layout.dispose();
});

test('the 1994 raceway runs from the women\'s left mirror, through the partition and over both noren to the chair, flat on the walls',()=>{
 stageScenario('rest');const {room,layout}=build();
 const R=ONSEN_RACEWAY;
 assert.equal(R.year,1994,'inside the town\'s years (1985–1999)');assert.equal(R.circuit,circuitOf('massage-chair'));assert.ok(R.why.length>60&&R.period.length>40);
 assert.equal(ONSEN_CIRCUITS[0].loads.find(l=>l.id==='massage-chair').raceway,R.name);
 assert.ok(room.getObjectByName(R.from)&&room.getObjectByName(R.to),'both ends are real sockets');
 const group=room.getObjectByName(R.name);assert.ok(group);
 const pieces=meshes(group);assert.ok(pieces.length>10,'runs, elbows, corners and caps');
 // One continuous line: each run starts where the last ended (through the wall at the end cap).
 for(let i=1;i<R.runs.length;i++){const a=R.runs[i-1].path.at(-1),b=R.runs[i].path[0];const gap=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);assert.ok(gap<.15,'run '+i+' joins the last: '+gap.toFixed(3));}
 // It starts at the left mirror's socket and ends on top of the socket box.
 const box=b=>new THREE.Box3().setFromObject(b),start=box(room.getObjectByName(R.from)),end=box(room.getObjectByName('Massage chair socket box'));
 assert.ok(Math.abs(R.runs[0].path[0][0]-start.min.x)<.002,'leaves the side of the left mirror’s socket');
 assert.ok(Math.abs(R.runs.at(-1).path.at(-1)[1]-end.max.y)<.002,'arrives on top of the socket box');
 // Over both noren: along the bandai wall from the west wall to the partition, end caps either side of the hole he
 // drilled through it, and on along the men's side; where it crosses the doorways it is above the rods and the header.
 const women=R.runs.find(r=>r.side==='women'&&r.end==='wall'),men=R.runs.find(r=>r.side==='men'&&r.start==='wall');
 assert.ok(women&&men,'one run each side of the partition');
 assert.ok(Math.abs(women.path.at(-1)[0]+.05)<.002&&Math.abs(men.path[0][0]-.05)<.002,'through the partition (x ±0.05)');
 for(const r of [women,men])assert.ok(r.path.every(p=>Math.abs(p[2]-1.6)<.08),'on the bandai wall');
 const rods=meshes(room).filter(m=>m.name==='Noren rod').map(box);assert.equal(rods.length,2,'two noren, two rods');
 for(const p of pieces)for(const rod of rods){const b=box(p);if(b.max.x>rod.min.x&&b.min.x<rod.max.x&&b.max.z>1.45&&b.min.z<1.75)assert.ok(b.min.y>rod.max.y,'the raceway crosses over the noren rods');}
 for(const n of meshes(room).filter(m=>m.name==='Noren'))assert.ok(rods.some(rod=>box(n).max.y<rod.max.y+.001));
 const shrink=b=>b.clone().expandByScalar(-.0008);
 const own=new Set(pieces);
 const allowed=o=>own.has(o)||o.userData.wall||/^(Umi-no-yu floor|Rock bath paving|Umi-no-yu sea view)$/.test(o.name)||o.name===R.from+' plate'||o.parent?.name===R.to;
 for(const p of pieces){
  const b=box(p);assert.ok(b.min.y>.85,p.name+' is up on the wall, not at a foot or a towel');
  for(const o of meshes(room)){if(allowed(o))continue;const ob=box(o);if(ob.isEmpty())continue;
   assert.ok(!shrink(b).intersectsBox(ob),`${p.name} at ${b.getCenter(new THREE.Vector3()).toArray().map(v=>v.toFixed(2))} clips ${o.name||o.type}`);}
 }
 // Under the ceiling beams, and its back on a wall face: never floating, never inside the plaster.
 const beams=meshes(room).filter(m=>m.userData.beam);assert.equal(beams.length,6,'the ceiling beams');
 for(const beam of beams)for(const p of pieces)assert.ok(!box(p).intersectsBox(box(beam)));
 const walls=meshes(room).filter(m=>m.userData.wall).map(box);
 for(const p of pieces.filter(m=>m.name==='Raceway run')){const b=box(p),touch=walls.some(w=>w.clone().expandByScalar(.0005).intersectsBox(b)),inside=walls.some(w=>shrink(w).intersectsBox(shrink(b)));
  assert.ok(touch,'a run sits on a wall');assert.ok(!inside,'a run is not inside a wall');}
 // The socket box by the chair is out of reach of a walking body (the cooler and the chair fence it).
 const blocked=(x,z,r)=>layout.colliders.some(c=>circleHitsRect(x,z,r,c));
 assert.ok(blocked(4.62,2.9,.25),'nobody stands in the gap between the cooler and the chair');
 layout.dispose();
});

test('dryers, the chair and the pot look on when they run and dead when they do not, and the same moment always looks the same',()=>{
 const src=readFileSync(new URL('../src/world/interiors/onsen-electrics.js',import.meta.url),'utf8');
 assert.ok(!/Math\.random/.test(src),'nothing random in the electrics');
 const ALL=[...BUSY,'kettle'];
 const sample=()=>{stageScenario('last-straw');const {room,layout}=build();ticks(layout,2);
  const out={layout,room,look:Object.fromEntries(ALL.map(id=>[id,layout.power.appearance(id)])),
   yaw:[1,2,3].map(i=>room.getObjectByName('Hair dryer '+i).rotation.y),rollers:meshes(room).filter(m=>m.name==='Massage chair roller').map(m=>m.position.toArray())};return out;};
 const first=sample();
 for(const id of ['dryer-1','dryer-2','dryer-3']){const l=first.look[id];assert.ok(l.working&&l.lamp&&l.air,id+' lamp lit and air blowing: '+JSON.stringify(l));}
 assert.ok(first.look['massage-chair'].lamp&&first.look['massage-chair'].moving,'the chair’s lamp is lit and it kneads');
 assert.ok(first.look.kettle.lamp&&first.look.kettle.plugged,'the pot boils, plugged in');
 assert.equal(first.rollers.length,2);
 // Resting on the counter while it hums: never below the vanity top.
 for(let i=1;i<=3;i++){const b=new THREE.Box3().setFromObject(first.room.getObjectByName('Hair dryer '+i));assert.ok(b.min.y>.81-.0005,'dryer '+i+' on the counter: '+b.min.y.toFixed(4));}
 // The rollers travel gently: within the backrest, a few centimetres a frame at most.
 const before=first.rollers;ticks(first.layout,1/30,1/30);const after=meshes(first.room).filter(m=>m.name==='Massage chair roller').map(m=>m.position.toArray());
 const step=Math.max(...before.map((p,i)=>Math.hypot(p[0]-after[i][0],p[1]-after[i][1],p[2]-after[i][2])));assert.ok(step>0&&step<.02,'roller step '+step.toFixed(4));
 const back=new THREE.Box3().setFromObject(first.room.getObjectByName('Massage chair back'));
 for(const p of after)assert.ok(p[1]>back.min.y+.1&&p[1]<back.max.y-.1&&p[2]>back.min.z&&p[2]<back.max.z,'roller inside the backrest’s face');
 // Over a whole travel up and down the back (9 s), each lump stays on the roller track (y 0.485–0.975: under the headrest
 // pillow) and on the cushions: straight behind it, past the lump, is the back's own face (x 4.625 or more), never the
 // pillow or a shoulder wing.
 {const chairMeshes=[];first.layout.chair.object.traverse(o=>{if(o.isMesh)chairMeshes.push(o);});
  const lumps=meshes(first.room).filter(m=>m.name==='Massage chair roller'),ray=new THREE.Raycaster(),east=new THREE.Vector3(1,0,0);
  let low=Infinity,high=-Infinity;
  for(let t=0;t<9;t+=.25){ticks(first.layout,.25,.25);
   for(const l of lumps){const b=new THREE.Box3().setFromObject(l),c=b.getCenter(new THREE.Vector3());low=Math.min(low,b.min.y);high=Math.max(high,b.max.y);
    ray.set(new THREE.Vector3(4.3,c.y,c.z),east);ray.far=1;const hit=ray.intersectObjects(chairMeshes,false)[0];
    assert.ok(hit&&hit.object.name==='Massage chair back'&&hit.point.x>=4.625&&Math.abs(hit.point.z-3.55)<.224,'a lump on the back’s face: '+(hit?hit.object.name+' '+hit.point.toArray().map(v=>v.toFixed(3)):'nothing'));
    assert.ok(b.min.x<hit.point.x&&b.max.x>hit.point.x,'half in the cushion, half out: '+b.min.x.toFixed(3)+'–'+b.max.x.toFixed(3));}}
  assert.ok(low>=.485-1e-3&&high<=.975+1e-3,'the lumps between '+low.toFixed(3)+' and '+high.toFixed(3));}
 first.layout.dispose();
 const second=sample();
 assert.deepEqual(second.yaw,first.yaw,'the same hum at the same moment');assert.deepEqual(second.rollers,first.rollers);
 // The blackout: lamps out at once, the air fades out within a second, the chair stops where it is, the pot's lamp dark.
 const stopped0=meshes(second.room).filter(m=>m.name==='Massage chair roller').map(m=>m.position.toArray());
 stageScenario('blackout');
 for(const id of ALL){const l=second.layout.power.appearance(id);assert.equal(l.working,false);assert.equal(l.lamp,false,id+' lamp dark at once');}
 assert.equal(isRunning('kettle'),true,'the pot still switched on');assert.equal(second.layout.power.appearance('kettle').plugged,true);
 ticks(second.layout,1.2);
 for(const id of ['dryer-1','dryer-2','dryer-3']){assert.equal(second.layout.power.appearance(id).air,false,id+' no air');assert.equal(second.room.getObjectByName('Hair dryer '+id.at(-1)).rotation.y,0,'still');}
 const stopped=meshes(second.room).filter(m=>m.name==='Massage chair roller').map(m=>m.position.toArray());ticks(second.layout,1);
 assert.deepEqual(stopped,stopped0,'stopped mid-knead');
 assert.deepEqual(meshes(second.room).filter(m=>m.name==='Massage chair roller').map(m=>m.position.toArray()),stopped,'and it stays there');
 assert.equal(second.layout.power.appearance('massage-chair').moving,false);
 // Restored: the house lit, everything big switched off and still, the pot unplugged.
 stageScenario('restored');ticks(second.layout,2);
 for(const id of ALL){const l=second.layout.power.appearance(id);assert.ok(!l.working&&!l.lamp,id+' off after the reset');}
 assert.equal(second.layout.power.appearance('kettle').plugged,false);assert.ok(isWorking('lobby-lamp')&&isWorking('women-tube'));
 assert.ok(assess().contract.amps<40);
 second.layout.dispose();stageScenario('rest');
});
