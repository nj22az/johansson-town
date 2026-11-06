import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {STATION_DRESSING,STATION_SAFETY_POSTERS,stationState} from '../src/world/police-station-dressing.js';
import {stationNotices,stationNoticeText} from '../src/feed/police-notices.js';
import {belongingsOf} from '../src/people/belongings.js';
import {coplanarOverlaps} from '../tools/z-fighting.mjs';
import {buildPoliceStation} from '../src/world/police-station.js';
import {standingHitsRect} from '../physics.js';
installDOM();globalThis.self=globalThis;globalThis.__KIT_TRACE__=true;
const world={group:new THREE.Group(),colliders:[],hourly:[]};
const ps=buildPoliceStation(world,{sites:[],register(){},enter(){},onAction(){}});delete globalThis.__KIT_TRACE__;

test('every dressing prop has who/why and a measured position, with no duplicate id',()=>{
 assert.equal(new Set(STATION_DRESSING.map(p=>p.id)).size,STATION_DRESSING.length);
 for(const p of [...STATION_DRESSING,...STATION_SAFETY_POSTERS])assert.ok(p.who&&p.why.length>25,p.id);
 for(const p of STATION_DRESSING){assert.ok(p.who&&p.why.length>25,p.id);assert.equal(p.at.length,3);}
 assert.deepEqual(ps.group.userData.dressing,STATION_DRESSING);
 let lights=0;ps.group.traverse(o=>{if(o.isPointLight)lights++;});assert.equal(lights,0);
});
test('dry mornings only: 08:00 inclusive, noon exclusive, rain takes it in immediately',()=>{
 for(const m of [480,570,719.99,1440+570])assert.equal(stationState(m).futon,true);
 for(const m of [0,479.99,720,1000])assert.equal(stationState(m).futon,false);
 ps.update(570);assert.equal(ps.dressing.futon.visible,true);ps.dressing.setRain(true);assert.equal(ps.dressing.futon.visible,false);assert.equal(ps.dressing.towels.visible,false);
 ps.dressing.setRain(false);assert.equal(ps.dressing.futon.visible,true);ps.update(720);assert.equal(ps.dressing.futon.visible,false);
});
test('patrol card follows Mori’s real 21:00–02:00 timetable across midnight',()=>{
 for(const m of [1260,1439,0,119.99,-1]){ps.update(m);assert.equal(ps.dressing.card.visible,true,String(m));}
 for(const m of [120,540,780,960,1259.99]){ps.update(m);assert.equal(ps.dressing.card.visible,false,String(m));}
});
test('lost property uses the storyteller’s belongings and missing Tama uses its bookshop',()=>{
 const notices=stationNotices();assert.deepEqual(notices,stationNotices());
 assert.ok(belongingsOf(notices[0].who).some(b=>b.what===notices[0].belonging.what));
 assert.equal(notices[1].story.thing,'Tama the cat');assert.equal(notices[1].place,'books');
 assert.doesNotMatch(stationNoticeText(),/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u);
});
test('street door and patrol car exit remain unobstructed',()=>{
 const added=world.colliders.filter(c=>/station-hanabuku|station-gas-hutch|hibiscus-/.test(c.id));
 for(let x=2;x<=5.05;x+=.1)assert.equal(added.some(c=>standingHitsRect(x,20.3,.3,.04,c)),false);
 for(let x=3.1;x<=9.5;x+=.1)for(const z of [26,26.6,27.2])assert.equal(added.some(c=>standingHitsRect(x,z,.3,.04,c)),false);
});
test('station dressing at dry morning, rain and patrol time has no flashing face over 0.01 m²',()=>{
 for(const [m,rain] of [[570,false],[570,true],[720,false],[1260,false]]){
  ps.dressing.setRain(rain);ps.update(m);world.group.updateMatrixWorld(true);
  const found=coplanarOverlaps(world.group,{tolerance:.002,minArea:.01});
  assert.deepEqual(found.map(f=>`${f.a} | ${f.b}: ${f.area.toFixed(3)} at ${f.at} normal ${f.normal}`),[],String([m,rain]));
 }
});

test('entrance nameplate is compact below the canopy, and the complete canopy sign clears its concrete cap',()=>{
 const plate=ps.group.getObjectByName('Station door plate'),fascia=ps.group.getObjectByName('Station entrance canopy sign');
 assert.ok(plate&&fascia);assert.ok(plate.geometry.parameters.height<1.3,'no long blank tail under four characters');
 assert.ok(plate.position.y+plate.geometry.parameters.height/2<2.4,'space below canopy and red lamp');
 assert.ok(5.7-.72-(fascia.position.x+fascia.geometry.parameters.depth/2)>=.006,'the sign backing clears the cap by at least 6 mm');
 assert.ok(fascia.material[4].map&&!fascia.material[5].map,'the emblem and name share one lettered face, with a plain back');
});
