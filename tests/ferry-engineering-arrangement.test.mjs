import test from 'node:test';
import assert from 'node:assert/strict';
import {FERRY_INTERIOR,FERRY_ENGINE_ROOM,FERRY_ENGINEERING_ARRANGEMENT} from '../src/world/ferry-interior.js';
import {PLANT_STATIONS} from '../src/world/ferry-plant-controls.js';
import {FERRY_SHIP} from '../src/world/ferry-ship.js';
import {FERRY_PIPING} from '../src/world/ferry-piping.js';
import {routePipes,validatePipeRoute,pipeSegmentIntersectsBox,pipeSegments,pipeRadius} from '../src/world/ferry-pipe-routes.js';
const space={y0:0,y1:3,W:3,z0:-1,z1:5,crossings:[0,4]};
const system=(lines)=>[{id:'fuel',colour:'#8a6a3a',lines}];

test('an obstruction rejects all blocked alternatives instead of falling back to an intersecting route',()=>{
 const anchors={'fuel/a':{pos:[1,1,1],dir:'up'},'fuel/b':{pos:[1,1,3],dir:'up'}};
 const routes=routePipes(system([{from:'a',to:'b',dn:50}]),anchors,{...space,clear:()=>false});
 assert.equal(routes.length,0);assert.equal(routes.issues.length,1);assert.equal(routes.issues[0].status,'unresolved');assert.ok(routes.issues[0].attempts>1);
});
test('outside radius detects a near miss that a centreline-only check would accept',()=>{
 const box={a:[1,0,0],b:[2,2,2]};
 assert.equal(pipeSegmentIntersectsBox([.97,.5,.5],[.97,.5,1.5],box,0),false);
 assert.equal(pipeSegmentIntersectsBox([.97,.5,.5],[.97,.5,1.5],box,pipeRadius(50)),true);
 const check=validatePipeRoute([[.97,.5,.5],[.97,.5,1.5]],{...space,obstacles:[{...box,name:'fuel tank'}]},50);
 assert.equal(check.ok,false);assert.equal(check.obstacle,'fuel tank');
});
test('terminal stubs alone may enter the connected equipment, never an intervening equipment box',()=>{
 const obstacle={a:[-.2,0,.8],b:[.2,1.6,1.2],name:'engine block'};
 const a={pos:[0,1,1]},b={pos:[0,2,3]};
 const terminal=[[0,1,1],[0,1.8,1],[0,1.8,3],[0,2,3]];
 assert.equal(validatePipeRoute(terminal,{...space,obstacles:[obstacle]},25,{a,b}).ok,true);
 const reenter=[[0,1,1],[0,1.8,1],[1,1.8,1],[1,1,1],[0,1,1],[0,1,3],[0,2,3]];
 assert.equal(validatePipeRoute(reenter,{...space,obstacles:[obstacle]},25,{a,b}).ok,false);
});
test('a bounded alternate lane clears an obstruction when the original local order cannot',()=>{
 const anchors={'fuel/a':{pos:[1,.8,.5],dir:'up',local:true},'fuel/b':{pos:[1.5,.8,3],dir:'up',local:true}};
 const obstacles=[{a:[1.1,.7,.4],b:[1.4,1.6,2.5],name:'pump enclosure'}];
 const paths=routePipes(system([{from:'a',to:'b',dn:25}]),anchors,{...space,obstacles});
 assert.equal(paths.length,1);assert.equal(paths.issues.length,0);
 assert.equal(validatePipeRoute(paths[0].points,{...space,obstacles},25,{a:anchors['fuel/a'],b:anchors['fuel/b']}).ok,true);
});
test('independent coincident loops are rejected and segments preserve their source-line identities',()=>{
 const anchors={'fuel/a':{pos:[1,1,1],dir:'up'},'fuel/b':{pos:[1,1,3],dir:'up'},'fuel/c':{pos:[1,1,1],dir:'up'},'fuel/d':{pos:[1,1,3],dir:'up'}};
 const paths=routePipes(system([{from:'a',to:'b',dn:25},{from:'c',to:'d',dn:25}]),anchors,space);
 assert.equal(paths.length,1);assert.equal(paths.issues[0].reason,'pipe clearance');
 const fabricated=[{system:'jacket',from:'mainP',to:'pumpP',lineId:'port',dn:25,points:[[0,1,0],[0,1,2]]},{system:'jacket',from:'mainS',to:'pumpS',lineId:'starboard',dn:50,points:[[0,1,0],[0,1,2]]}];
 const segments=pipeSegments(fabricated);assert.equal(segments.length,2);assert.deepEqual(segments.map(s=>s.lineId),['port','starboard']);assert.deepEqual(segments.map(s=>s.dn),[25,50]);
});
test('every positive-DN diagram edge has an accepted route or an explicit issue, including exhaust and hydraulics',()=>{
 const edges=FERRY_PIPING.flatMap(s=>s.lines.filter(l=>l.dn>0).map(l=>s.id+'/'+l.from+'>'+l.to));
 const records=[...FERRY_INTERIOR.engineeringPipes,...FERRY_INTERIOR.pipeRouteIssues];
 assert.equal(records.length,edges.length);
 assert.deepEqual(records.map(r=>r.system+'/'+r.from+'>'+r.to).sort(),edges.sort());
 assert.ok(FERRY_INTERIOR.pipeRouteIssues.some(r=>r.system==='exhaust'));
 assert.ok(FERRY_INTERIOR.pipeRouteIssues.some(r=>r.system==='hydraulics'));
});
test('accepted paths survive a fresh exact outside-radius equipment/pipe audit; QCV stays below the deckhead',()=>{
 const ER=FERRY_ENGINE_ROOM;
 const obstacles=FERRY_INTERIOR.boxes.filter(b=>b.solid&&b.name&&!/side|deckhead|bulkhead|trunk|casing|partition|escape|plates/.test(b.name));
 const existing=[];
 for(const r of FERRY_INTERIOR.engineeringPipes){const a={...FERRY_INTERIOR.anchors[r.system+'/'+r.from],id:r.system+'/'+r.from},b={...FERRY_INTERIOR.anchors[r.system+'/'+r.to],id:r.system+'/'+r.to};
  assert.deepEqual(validatePipeRoute(r.points,{y0:ER.floor,y1:ER.deckhead,W:ER.side,obstacles},r.dn,{a,b,existing}),{ok:true},r.lineId);existing.push(r);}
 const q=FERRY_INTERIOR.anchors['fuel/qcv'];assert.ok(q.pos[1]+q.off+pipeRadius(20)<ER.deckhead);
 assert.equal(FERRY_ENGINEERING_ARRANGEMENT.status,'concept-requires-redesign');assert.match(FERRY_ENGINEERING_ARRANGEMENT.removal.verification,/unresolved/);
});

test('game preview remains visible and is explicitly excluded from the accepted engineering registry',()=>{
 assert.equal(FERRY_INTERIOR.pipes.length,172);assert.ok(FERRY_INTERIOR.pipes.every(r=>r.status==='visual-preview-unverified'));
 assert.ok(FERRY_INTERIOR.engineeringPipes.every(r=>r.status==='geometry-clear'));
});


test('relocated generators, labels and every circuit terminal are in the auxiliary space and clear its fixed plant',()=>{
 const half=FERRY_SHIP.length/2,I=FERRY_INTERIOR;
 const own=/^generator (bed|sump|engine)$/;
 const beds=I.boxes.filter(b=>b.name==='generator bed');assert.equal(beds.length,2);
 for(const bed of beds){assert.ok(Math.abs(bed.a[2]+half-15.2)<1e-7);assert.ok(Math.abs(bed.b[2]+half-16.05)<1e-7);}
 for(const b of I.boxes.filter(b=>own.test(b.name||''))){
  const other=I.boxes.filter(o=>o.solid&&o!==b&&!own.test(o.name||'')).find(o=>[0,1,2].every(k=>Math.min(b.a[k],b.b[k])<Math.max(o.a[k],o.b[k])-1e-6&&Math.max(b.a[k],b.b[k])>Math.min(o.a[k],o.b[k])+1e-6));
  assert.equal(other,undefined,(b.name||'genset')+' overlaps '+other?.name);
 }
 for(const [id,a] of Object.entries(I.anchors).filter(([id])=>/gen[12]$/.test(id)))assert.ok(a.pos[2]+half>15.2&&a.pos[2]+half<16.3,id+' follows its relocated machine');
 for(const p of I.plates.filter(p=>/^maker’s plate: generator No./.test(p.name)))assert.ok(p.pos[2]+half>15.19&&p.pos[2]+half<15.3,p.name+' travels with the bed');
 const service={a:[-2.1,FERRY_ENGINE_ROOM.floor,13.05-half],b:[2.1,FERRY_ENGINE_ROOM.deckhead,13.7-half]};
 assert.ok(!I.boxes.filter(o=>o.solid).some(o=>[0,1,2].every(k=>service.a[k]<Math.max(o.a[k],o.b[k])-1e-6&&service.b[k]>Math.min(o.a[k],o.b[k])+1e-6)),'main fore-end band is free of fixed equipment boxes');
 assert.equal(FERRY_ENGINEERING_ARRANGEMENT.generatorEnvelope.room,'aux-room');
 assert.equal(FERRY_ENGINEERING_ARRANGEMENT.auxiliaryGeneratorAccess.centreAisle,1.0);
});
test('local generator operating positions follow the auxiliary-room panels, while remote switchboard stations remain',()=>{
 for(const [id,x] of [['gen1',.6],['gen2',-.6]]){
  const st=PLANT_STATIONS.find(s=>s.id==='local-'+id);assert.ok(st);assert.equal(st.pos[0],x);
  const physical=FERRY_INTERIOR.anchors['fuel/fuel-'+id];assert.ok(Math.abs(st.pos[2]-(physical.pos[2]-.55))<1e-7);assert.ok(st.pos[2]+FERRY_SHIP.length/2>14.6);
  assert.ok(PLANT_STATIONS.some(s=>s.id==='panel-'+id));
 }
});

import * as THREE from '../vendor/three.module.js';
import {createFerryRun} from '../src/world/ferry.js';
import {createFerryWalk} from '../src/world/ferry-walk.js';
test('centre and side aisles reach the relocated generators and auxiliary plant without passing through machinery',()=>{
 const run=createFerryRun({parent:new THREE.Group(),colliders:[]});run.parkAt('town');run.update(1/60,600,0);
 const walk=createFerryWalk(run);walk.update();
 const fp=FERRY_ENGINE_ROOM.floor,half=FERRY_SHIP.length/2;
 const point=(x,z)=>run.ferry.localToWorld(new THREE.Vector3(x,fp,z-half));
 const trace=(from,waypoints)=>{let p=point(...from);for(const coords of waypoints){const target=point(...coords);let guard=0;
  while(Math.hypot(target.x-p.x,target.z-p.z)>.02&&guard++<2000){const distance=Math.hypot(target.x-p.x,target.z-p.z),step=Math.min(.04,distance),x=p.x+(target.x-p.x)*step/distance,z=p.z+(target.z-p.z)*step/distance,m=walk.move(p.x,p.y,p.z,x,z,.28);
   assert.ok(m?.ok,'aisle to '+coords+' stops at '+m?.floor?.id);p.set(x,m.y,z);}
  assert.ok(guard<2000,'finite walk');}
 };
 trace([0,13.68],[[0,14.8],[0,16.6],[0,17]]);
 for(const s of [1,-1])trace([0,17],[[0,16.55],[s*2.9,16.55],[s*2.9,15.4],[s*2.9,14.7],[s*.6,14.75]]);
});

test('empty and nonfinite engineering paths cannot receive geometry acceptance',()=>{
 assert.equal(validatePipeRoute([],space,50).ok,false);
 assert.equal(validatePipeRoute([[0,1,1],[0,Infinity,2]],space,50).ok,false);
 assert.equal(validatePipeRoute([[0,1,1],[0,1,2]],space,Infinity).ok,false);
 assert.equal(FERRY_INTERIOR.engineeringPipes,FERRY_INTERIOR.engineeringPipes,'deterministic audit is cached');
});

test('longitudinal bounds reject pipes outside the machinery rooms while only a declared terminal penetration may leave',()=>{
 assert.equal(validatePipeRoute([[0,1,4.5],[0,1,5.1]],space,25).ok,false);
 assert.equal(validatePipeRoute([[0,1,4.5],[0,1,5.1]],space,25,{b:{pos:[0,1,5.1],penetration:true}}).ok,true);
 assert.equal(validatePipeRoute([[0,1,4.5],[0,1,5.1],[1,1,5.1],[1,1,4.5]],space,25,{a:{pos:[0,1,4.5],penetration:true}}).ok,false);
});
