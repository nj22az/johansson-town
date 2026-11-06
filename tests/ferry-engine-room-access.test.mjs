import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {FERRY_INTERIOR,FERRY_ENGINE_ROOM,BELOW_DECK_FLOORS} from '../src/world/ferry-interior.js';
import {FERRY_LADDER,FERRY_INSPECT} from '../src/world/ferry-inspect.js';
import {createFerryRun} from '../src/world/ferry.js';
import {createFerryWalk} from '../src/world/ferry-walk.js';
import {createEarDefenders,wearEarDefenders} from '../src/avatars/ear-defenders.js';
import {buildAvatar} from '../src/avatars/build.js';
import {recipeFor,CREW_LOOKS} from '../src/avatars/cast.js';
import {createFerryCrewAboard,BELOW_DECK_PLACES} from '../src/people/ferry-crew-aboard.js';
import {FERRY_CREW} from '../src/people/ferry-crew.js';
installDOM();

test('thin paint aboard is drawn as a decal with a depth offset, so nothing flickers on a phone',()=>{
 const parent=new THREE.Group();createFerryRun({parent,colliders:[]});
 const names=[];parent.traverse(o=>{if(o.isMesh&&/^Minato Maru /.test(o.name))names.push(o.name);});
 assert.ok(names.includes('Minato Maru decal'),'the decal class exists: '+names.join(', '));
 const decal=parent.getObjectByName('Minato Maru decal');
 assert.equal(decal.material.polygonOffset,true);assert.ok(decal.material.polygonOffsetFactor<0&&decal.material.polygonOffsetUnits<0);
 const thin=FERRY_INTERIOR.boxes.filter(b=>b.draw!==false&&b.cls==='paint'&&Math.min(b.b[0]-b.a[0],b.b[1]-b.a[1],b.b[2]-b.a[2])<=.02);
 assert.ok(thin.length>20,'the floor coverings and hazard stripes are thin paint: '+thin.length);
});

test('the engine-room ladder is walked across its whole width, and the prompts take you down and back up',()=>{
 const L=FERRY_ENGINE_ROOM.ladder,ladder=FERRY_INTERIOR.floors.find(f=>f.id==='er-ladder'),foot=FERRY_INTERIOR.floors.find(f=>f.id==='er-ladder-foot');
 for(const x of [L.x[0]+.08,(L.x[0]+L.x[1])/2,L.x[1]-.08]){assert.ok(ladder.inside(x,(L.head+L.foot)/2,.3),'ladder at x '+x);assert.ok(foot.inside(x,L.foot+.2,.3),'foot at x '+x);}
 assert.ok(!FERRY_INSPECT.some(p=>p.id==='er-door'),'the door prompt is the way down now, not a note');
 const parent=new THREE.Group(),run=createFerryRun({parent,colliders:[]});run.parkAt('town');run.update(1/60,600,0);
 const walk=createFerryWalk(run);walk.update();
 for(const [way,other] of [['down','up'],['up','down']]){
  const v=run.ferry.localToWorld(new THREE.Vector3(...FERRY_LADDER[way].to));
  const below=walk.floorBelow(v.x,v.z,v.y+.1);assert.ok(below,way+' lands on a floor');
  assert.equal(BELOW_DECK_FLOORS.includes(below.floor.id),way==='down',way+' lands '+below.floor.id);
  if(way==='down'){const mid=run.ferry.localToWorld(new THREE.Vector3(0,FERRY_ENGINE_ROOM.floor,(FERRY_ENGINE_ROOM.aft+FERRY_ENGINE_ROOM.fore)/2));const plates=walk.floorBelow(mid.x,mid.z,mid.y+.1);assert.ok(plates&&BELOW_DECK_FLOORS.includes(plates.floor.id),'the floor plates count as below: '+plates?.floor?.id);}
  assert.ok(Math.abs(below.y-v.y)<.08,way+' lands at the floor\'s height');
  const at=FERRY_LADDER[other].at;assert.ok(Math.hypot(at[0]-FERRY_LADDER[way].to[0],at[2]-FERRY_LADDER[way].to[2])<1.2,'the way back is within reach of where you land');
 }
});

test('ear defenders fit any head and come off again; everybody below wears them',()=>{
 for(const name of ['Thuan','Mr Nakandakari','Mr Higa Jr']){
  const avatar=buildAvatar(recipeFor(name)),m=avatar.measure;
  const g=wearEarDefenders(avatar,true);assert.equal(g.parent,avatar.bones.head);assert.equal(wearEarDefenders(avatar,true),g,'one pair at most');
  const box=new THREE.Box3().setFromObject(g);const cy=m.headCentre-m.headY;
  assert.ok(box.min.y>cy-m.Rh*m.headSY&&box.max.y>cy+m.Rh*m.headSY*.9,'the band goes over the crown');
  assert.ok(box.max.x>m.headSX*m.Rh&&box.max.x<m.headSX*m.Rh+.12,'the cups sit on the ears');
  assert.equal(wearEarDefenders(avatar,false),null);assert.ok(!avatar.bones.head.children.some(o=>o.userData.earDefenders));
  avatar.dispose();
 }
 const parent=new THREE.Group(),run=createFerryRun({parent,colliders:[]});run.parkAt('town');
 const attached=[];const characters={attach(g,name){const avatar=buildAvatar(recipeFor(name));g.add(avatar.root);const a={avatar};attached.push([name,a]);return a;}};
 const crew=createFerryCrewAboard({run,characters,register:()=>{},onAction:()=>{}});crew.place(12*60);
 const snap=crew.snapshot();
 for(const s of snap)assert.equal(s.earDefenders,BELOW_DECK_PLACES.includes(crewWhere(s.name,crew.phase)),s.name+' at '+crewWhere(s.name,crew.phase));
 assert.ok(snap.some(s=>s.earDefenders),'somebody is below with ear defenders on at noon');
 for(const [name,a] of attached){const on=!!a.avatar.bones.head.children.find(o=>o.userData?.earDefenders);assert.equal(on,!!snap.find(s=>s.name===name)?.earDefenders,name);}
});
import {crewPlaces} from '../src/people/ferry-crew-aboard.js';
const crewWhere=(name,phase)=>crewPlaces(phase,12*60).find(c=>c.name===name)?.where;

test('the crew are drawn, not generated: no two look alike, and Ms Uezu is a woman',()=>{
 const seen=new Map();
 for(const c of FERRY_CREW){const r=recipeFor(c.name),key=JSON.stringify([r.hair,r.outfit,r.head]);assert.ok(!seen.has(key),c.name+' looks like '+seen.get(key));seen.set(key,c.name);}
 for(const name of ['Mr Nakandakari','Mr Higa Jr','Ms Uezu'])assert.ok(CREW_LOOKS[name]&&recipeFor(name).outfit.top===CREW_LOOKS[name].outfit.top,name+' has a drawn look');
 assert.equal(recipeFor('Ms Uezu').body.silhouette,'feminine');
});
