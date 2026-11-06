import test from 'node:test';import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createTown} from '../src/world/town.js';
import {islandTerrainHeight,MOUNTAIN_VERTICES,TERRAIN_GRID,COAST_ROAD} from '../src/world/island-plan.js';import {HARBOUR_POND,HARBOUR_PARK_PATHS,harbourPondAt} from '../src/world/harbour-park-plan.js';import {routeAt,groundHeight} from '../src/world/layout.js';import {circleHitsRect} from '../physics.js';
import {onIslandLand} from '../src/world/coastal-ground.js';
import {AIRPORT_LANDING,AIRPORT_COUNTER,airportWorld,AIRPORT_PAVEMENT_HEIGHT} from '../src/world/airport-ground.js';
import {TROPIC_TRAILS,TROPIC_PLACES} from '../src/world/tropical-island.js';
import {restoreIsland,islandState,buyFerry,FERRY_FARE,ferryArrival,buyFlight,checkIn,boardFlight,flightArrival,finishRepair,completeProject,flightTimes} from '../src/island/services.js';
import {auditArchive,YEAR_MINUTES,retainArchive} from '../src/office/archive.js';

test('mountain triangles and grounded height share each vertex; existing town heights remain stable',()=>{try{const g=TERRAIN_GRID,n=Math.round((g.maxX-g.minX)/g.step)+1;for(let i=0;i<MOUNTAIN_VERTICES.length;i+=7)assert.ok(Math.abs(islandTerrainHeight(g.minX+i%n*g.step,g.minZ+Math.floor(i/n)*g.step)-MOUNTAIN_VERTICES[i])<1e-8);assert.ok(groundHeight(40,175)<1);assert.equal(groundHeight(0,-44),0);for(let i=1;i<COAST_ROAD.length;i++){const a=COAST_ROAD[i-1],b=COAST_ROAD[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.1);for(let n=0;n<=steps;n++){const x=a[0]+(b[0]-a[0])*n/steps,z=a[1]+(b[1]-a[1])*n/steps;assert.ok(routeAt(x,z,.32),'road walk bounds '+x+','+z);for(let k=0;k<8;k++){const angle=k*Math.PI/4;assert.ok(onIslandLand(x+Math.cos(angle)*.32,z+Math.sin(angle)*.32),'road over water '+x+','+z);}}}assert.equal(routeAt(400,400,.32),null);}finally{}});

test('the one park pond is not walkable and its circuit, quay gate and onsen approach stay clear',()=>{
 installDOM();const world=createTown({scene:new THREE.Scene(),sites:[],townMode:'peninsula',mobile:true,shadows:false,register(){},enter(){},onAction(){}});
 const blocked=(x,z)=>!routeAt(x,z,.32)||world.colliders.some(c=>circleHitsRect(x,z,.32,c));
 assert.equal(harbourPondAt(HARBOUR_POND.x,HARBOUR_POND.z),true);assert.equal(blocked(HARBOUR_POND.x,HARBOUR_POND.z),true);
 for(const route of HARBOUR_PARK_PATHS.filter(r=>['park-approach','garden-onsen-approach','garden-pond-loop','garden-quay-walk'].includes(r.id)))for(let i=1;i<route.points.length;i++)for(let t=0;t<=1;t+=.025){const a=route.points[i-1],b=route.points[i],x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;assert.equal(blocked(x,z),false,route.id+' '+[x,z]);}
 assert.equal(world.landmarks.filter(s=>s.id==='harbour-park').length,1);assert.equal(world.landmarks.some(s=>s.id==='aoba-garden'),false);
});

test('airport landing connects to passenger counter while the runway and sewage plant remain inaccessible',()=>{
 try{

  const route=[AIRPORT_LANDING,airportWorld(-40,31),airportWorld(-40,18.7),AIRPORT_COUNTER];
  for(const path of [route,[...route].reverse()])for(let i=1;i<path.length;i++){
   const a=path[i-1],b=path[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.15);
   let y=groundHeight(...a);
   for(let n=0;n<=steps;n++){
    const t=n/steps,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],next=groundHeight(...p);
    assert.ok(routeAt(...p,.32),'Shared ferry pier/counter passage at '+p);
    assert.ok(Math.abs(next-y)<.24,'Unwalkable airport floor step at '+p);y=next;
   }
  }
  assert.ok(routeAt(...AIRPORT_COUNTER,.32));
  assert.ok(Math.abs(groundHeight(...AIRPORT_COUNTER)-AIRPORT_PAVEMENT_HEIGHT)<.001);
  assert.equal(routeAt(...airportWorld(0,-4),.32),null);
  assert.equal(routeAt(...airportWorld(-33,9),.32),null);
 }finally{}
});

test('ticket, check-in, missed flight, weather closure and return records survive restore without duplicate charges',()=>{const state={yen:800+FERRY_FARE};assert.equal(buyFerry(state,480).ok,true);assert.equal(buyFerry(state,481).already,true);ferryArrival(state,'airport',498);assert.equal(buyFlight(state,500).ok,true);assert.equal(state.yen,0);const ticket=islandState(state).journey.ticket;assert.equal(boardFlight(state,ticket).ok,false);assert.equal(checkIn(state,530).ok,true);assert.equal(boardFlight(state,540).wait,15);assert.equal(boardFlight(state,ticket,true).ok,false);assert.equal(boardFlight(state,ticket).ok,true);flightArrival(state,'naha',ticket+45);const restored={...state,island:restoreIsland(state.island)};assert.equal(restored.island.journey.location,'naha');flightArrival(restored,'airport',ticket+100);ferryArrival(restored,'town',ticket+118);assert.equal(restored.island.journey.roundTrip,false);assert.equal(restored.island.journey.ticket,null);assert.equal(restored.yen,0);assert.ok(restored.documentArchive.records.some(r=>r.title==='Commuter flight check-in'));const missed={yen:800};buyFlight(missed,500);checkIn(missed,552);assert.ok(missed.island.journey.ticket>555);assert.equal(missed.yen,0);});

test('town growth requires service evidence, spends treasury once, changes flights and produces a complete audit chain',()=>{const state={yen:1200};assert.equal(completeProject(state,'cargo',500).ok,false);finishRepair(state,510);assert.equal(finishRepair(state,511),false);assert.equal(completeProject(state,'cargo',530).ok,true);assert.equal(completeProject(state,'cargo',531).ok,false);flightArrival(state,'naha',600);assert.equal(completeProject(state,'bus',650).ok,true);ferryArrival(state,'airport',700);ferryArrival(state,'airport',900);assert.equal(completeProject(state,'guesthouse',1000).ok,true);assert.equal(state.island.treasury,16000);assert.ok(flightTimes(state).includes(660));assert.deepEqual(auditArchive(state.documentArchive),[]);retainArchive(state.documentArchive,1001+YEAR_MINUTES);assert.equal(state.documentArchive.records.length,0);});


test('the tropical island: quay, plaza, beach and jungle trail connect, the airside and the sea stay closed',()=>{try{installDOM();const world=createTown({scene:new THREE.Scene(),sites:[],mobile:true,register(){},enter(){},onAction(){}}),blocked=(x,z)=>!routeAt(x,z,.32)||world.colliders.some(c=>circleHitsRect(x,z,.32,c));const legs=[[[-44,31],[-48,31]],[[0,18.7],[-4,30]],[[-4,30],[-4,34]],...TROPIC_TRAILS.flatMap(t=>t.slice(1).map((p,k)=>[t[k],p]))];for(const [from,to] of legs)for(let t=0;t<=1;t+=.025){const p=airportWorld(from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t);assert.equal(blocked(...p),false,'island route '+p);}for(const closed of [[0,16],[30,10],[-14,96],[120,40]])assert.equal(routeAt(...airportWorld(...closed),.32),null,'closed at '+closed);assert.ok(routeAt(...airportWorld(...TROPIC_PLACES.coralBay),.32),'Coral Bay sand');}finally{}});

test('Rainflower Lane is reachable with clear central walking space and Thuan outfit changes preserve her skeleton',async()=>{try{installDOM();const world=createTown({scene:new THREE.Scene(),sites:[],townMode:'peninsula',mobile:true,register(){},enter(){},onAction(){}});for(let z=30.5;z<=55;z+=.5){assert.ok(routeAt(4.5,z,.32));assert.equal(world.colliders.some(c=>circleHitsRect(4.5,z,.32,c)),false);assert.equal(groundHeight(4.5,z),.04);}const {buildAvatar}=await import('../src/avatars/build.js'),{recipeFor}=await import('../src/avatars/cast.js');const avatar=buildAvatar(recipeFor('Thuan'));const skeleton=avatar.body.skeleton;avatar.wear('nozomi');const alternate=avatar.root.children.find(c=>c.name==='Thuan · shopping lane outfit');assert.ok(alternate.visible);assert.equal(alternate.skeleton,skeleton);assert.equal(avatar.body.visible,false);avatar.wear('swim');assert.equal(alternate.visible,false);avatar.wear('nozomi');assert.equal(alternate.visible,true);avatar.wear('clothes');assert.equal(avatar.body.visible,true);assert.equal(alternate.visible,false);avatar.wear('sailor');const sailor=avatar.root.children.find(c=>c.name==='Thuan · harbour academy sailor');assert.ok(sailor.visible);assert.equal(sailor.skeleton,skeleton);assert.equal(avatar.body.visible,false);assert.equal(avatar.recipe.name,'Thuan');avatar.wear('clothes');assert.equal(sailor.visible,false);assert.equal(avatar.body.visible,true);avatar.dispose();}finally{}});

test('rain follows the explorer and remains animated rain rather than becoming solid overhead cables',()=>{try{installDOM();const player=new THREE.Vector3(3.3,0,41.4),world=createTown({scene:new THREE.Scene(),sites:[],townMode:'peninsula',mobile:true,getPlayerPosition:()=>player,register(){},enter(){},onAction(){}}),rain=world.group.getObjectByName('Local rain streaks');assert.ok(rain?.isLineSegments);assert.ok(rain.userData.dynamicProp);world.setRain(true);world.update(.1,1,1,600);assert.equal(rain.visible,true);assert.deepEqual(rain.position.toArray(),player.toArray());const p=rain.geometry.getAttribute('position');for(let i=0;i<p.count;i+=2)assert.ok(Math.abs(p.getY(i+1)-p.getY(i)-.65)<.00001);world.setRain(false);assert.equal(rain.visible,false);}finally{}});
