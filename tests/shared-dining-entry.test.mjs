import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {createBeerService,IZAKAYA_PLAYER_SEATS,NAO_STATION,DRINKS} from '../src/people/izakaya-beer.js';
import {createRamenPlayerService} from '../src/people/ramen-player-service.js';
import {createRamenKitchen} from '../src/people/ramen-kitchen.js';
import {createVenueService} from '../src/people/venue-service.js';
import {IZAKAYA_GUEST_SEATS} from '../src/people/indoor-residents.js';
import {SATO_COUNTER,SATO_COOK,SATO_GUEST_SEATS,SATO_MENU,SATO_RAMEN,satoRamenOpen} from '../src/world/sato-ramen-layout.js';
import {izakayaOpen} from '../src/people/social.js';
import {closedGreeting} from '../src/people/izakaya-hours.js';
import {roomToStreet} from '../src/world/doorway.js';
import {MINATO_COMPACT as P} from '../src/world/interiors/minato-compact-plan.js';
import {SHARED_DINING_COLLIDERS,SHARED_DINING_BOUNDS,SHARED_DINING_FLOOR} from '../src/world/interiors/shared-dining-layout.js';
import {suppliedRoomBoundsBlocked} from '../src/world/supplied-rooms.js';
import {standingHitsRect} from '../physics.js';
import {buildMinatoBar} from '../src/world/interiors/minato-bar.js';
import {installDOM} from './fixtures.mjs';
installDOM();

// Execute the real game integration without starting its renderer. The service
// controllers are real; only the shell construction and browser surface are stubbed.
const source=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
const between=(start,end)=>{const i=source.indexOf(start),j=source.indexOf(end,i);assert.ok(i>=0&&j>i,start);return source.slice(i,j);};
const helpers=between('function sharedDining(','function roomCollider(');
const services=between('function startVenueService(','function clearRoom(');
const shell=between('function roomShell(','\n\n\n/**');
const leave=between('function leaveRoom(','\nfunction syncExteriorPlace(');
const getTable=between('getTableService:',',onStand:').slice('getTableService:'.length);
const noop=()=>{};
const exitSiteAt=(x,z)=>Math.hypot(x-P.ramenEntrance.exit[0],z-P.ramenEntrance.exit[2])<Math.hypot(x-P.entrance.exit[0],z-P.entrance.exit[2])?'ramen':'izakaya';
const layout={bounds:SHARED_DINING_BOUNDS,floorPolygon:SHARED_DINING_FLOOR};
const blocked=(x,z,r=.3)=>suppliedRoomBoundsBlocked(layout,x,z,r)||SHARED_DINING_COLLIDERS.some(c=>standingHitsRect(x,z,r,0,c));

function entryFixture(id){
 const room=new THREE.Group(),ramenLife=new THREE.Group(),regular=new THREE.Group(),scene=new THREE.Group();
 ramenLife.userData.sharedAsset=true;ramenLife.add(regular);scene.add(ramenLife);
 const thao=new THREE.Group(),sato=new THREE.Group();thao.position.set(...NAO_STATION);thao.userData.inIzakaya=true;sato.position.set(...SATO_COOK.position);sato.userData.inRamen=true;
 const calls={izakaya:0,ramen:0,pay:0,builders:[]},television={update:noop},state={yen:4000};
 // The drinks station is the room's own (minato-bar.js): Thao makes every drink from it.
 const builder=options=>{calls.builders.push(options);return {television,exitSiteAt,yaw:0,bar:buildMinatoBar(options.room||new THREE.Group())};};
 const context={THREE,current:{id},room,ramenLife,regular,activeRoomLayout:null,roomColliders:[],town:{},minutes:720,elapsed:0,parkSeat:null,tipsy:0,
  world:{people:[{profile:{name:'Thao'},g:thao},{profile:{name:'Mrs Sato'},g:sato}]},player:new THREE.Object3D(),
  izakayaGuests:{sync:()=>{calls.izakaya++;return ['Thao'];}},ramenGuests:{sync:()=>{calls.ramen++;return ['Mrs Sato'];}},
  izakayaTV:null,beerService:null,ramenPlayerService:null,venueService:null,createBeerService,createRamenPlayerService,createVenueService,
  IZAKAYA_GUEST_SEATS,SATO_GUEST_SEATS,SATO_MENU,SATO_RAMEN,DRINKS,izakayaOpen,satoRamenOpen,closedGreeting,
  activities:{state,spend:n=>{state.yen-=n;calls.pay++;return true;},action:noop,menu:noop,save:noop,close:noop},
  environmentBlocked:blocked,hasRamenTicket:()=>false,useRamenTicket:()=>false,ramenMouthful:noop,wantsAnother:()=>true,
  shopStreetView:{invalidate:noop},say:noop,box:noop,reg:noop,roomCollider:noop,leaveRoom:noop,signTex:noop,
  buildIzakayaRoom:builder,buildSatoRamenRoom:builder,homeOwner:()=>null,buildCompactShop:()=>null,buildSuppliedRoom:()=>null,
  NAHA_ARRIVALS:{id:'arrivals'},CITY_RESTAURANT:{id:'restaurant'},islandPlay:null,
  residentLedger:{account:()=>({}),purchase:()=>true,record:noop},
 };
 context.clearRoom=()=>{context.activeRoomLayout=null;room.clear();};
 context.satoKitchen=createRamenKitchen({getMinutes:()=>context.minutes,getCook:()=>sato});
 vm.createContext(context);vm.runInContext(helpers+shell+services+'\nroomShell(current);addRoomProps(current);getTableService='+getTable+';',context);
 return {context,calls,television,thao,sato,ramenLife,regular};
}

test('both entries offer real Minato and Sato service, with their own hours and existing kitchen lifetime',()=>{
 for(const id of ['izakaya','ramen']){
  const f=entryFixture(id),c=f.context;
  assert.ok(c.beerService&&c.ramenPlayerService&&c.venueService,id+' initialises both dining services');
  assert.equal(f.ramenLife.parent,c.room);assert.ok(f.ramenLife.visible);
  assert.equal(f.ramenLife.children[0],f.regular,'The existing Sato dining group and regular are retained');
  assert.equal(f.calls.izakaya,1);assert.equal(f.calls.ramen,1);
  assert.equal(c.izakayaTV,f.television,'The TV is attached through either entrance');
  assert.equal(f.calls.builders[0].exploration.state,c.activities.state,'Discoveries use the persistent state through either door');
  c.parkSeat={...SATO_COUNTER[1],ramenSeatId:1};
  assert.equal(c.getTableService(),c.ramenPlayerService,'The ramen seat opens its service regardless of the entrance');
  const seat=Object.values(IZAKAYA_PLAYER_SEATS).find(s=>s.counter);assert.ok(seat);
  assert.equal(c.beerService.order('draft',seat),false,'Minato is closed at lunch');
  assert.equal(c.ramenPlayerService.request('shoyu'),true);
  for(let i=0;i<2700&&!c.ramenPlayerService.order?.delivered;i++){c.ramenPlayerService.update(1/30);c.satoKitchen.update(1/30);}
  assert.equal(c.ramenPlayerService.order?.delivered,true,'Mrs Sato cooks the lunch after entry through '+id);
  assert.equal(f.calls.pay,1);assert.deepEqual(c.ramenPlayerService.order.prop.position.toArray(),c.parkSeat.table);
  c.ramenPlayerService.cancel();c.minutes=1200;
  assert.equal(c.ramenPlayerService.request('shoyu'),false,'Sato remains closed in the evening');
  c.parkSeat={izakaya:seat};
  assert.equal(c.getTableService(),null,'A Minato seat does not open the ramen menu');
  assert.equal(c.beerService.order('draft',seat),true);
  for(let i=0;i<2700&&c.beerService.pending;i++)c.beerService.update(1/30);
  assert.equal(c.beerService.served,1,'Thao serves the evening drink after entry through '+id);
  f.thao.userData.inIzakaya=false;assert.equal(c.beerService.order('draft',seat),false,'Thao must actually be working in the room');
  c.beerService.clear();c.ramenPlayerService.dispose();c.venueService.dispose();
 }
});

test('meal receipts and conversations follow the current side or seat, not the entrance used',()=>{
 const c={current:{id:'ramen'},parkSeat:null,activeRoomLayout:{exitSiteAt},player:new THREE.Object3D()};vm.createContext(c);vm.runInContext(helpers,c);
 c.player.position.set(...P.entrance.spawn);assert.equal(c.activityPlace(),'izakaya');
 c.player.position.set(...P.ramenEntrance.spawn);assert.equal(c.activityPlace(),'ramen');
 c.parkSeat={izakaya:IZAKAYA_PLAYER_SEATS.window};assert.equal(c.activityPlace(),'izakaya');
 c.current={id:'izakaya'};c.parkSeat={ramenSeatId:0};assert.equal(c.activityPlace(),'ramen');
 c.current={id:'market'};assert.equal(c.activityPlace(),'market','Other rooms retain their site identity');
});

test('the shared room syncs Minato guests from either door while Sato keeps its continuous update',()=>{
 const advance=between('function advanceTown(','/** Keeps the town on the device clock');
 for(const id of ['izakaya','ramen','market']){
  const calls={minato:0,sato:0},service={sync:noop,update:noop,cancel:noop};
  const c={current:{id},minutes:720,elapsed:0,catchingUp:false,saveTick:0,townClock:{speed:1},islandPlay:null,
   activities:{tick:noop},evictIfClosed:noop,izakayaGuests:{sync:()=>calls.minato++},ramenGuests:{sync:()=>calls.sato++},onsenGuests:service,
   activeRoomLayout:null,homeOwner:()=>false,venueService:null,beerService:null,ramenPlayerService:null,
   workplaceResidents:service,bookshopCustomers:service,castAI:service,sakuraShop:service,ramenMeals:service,satoKitchen:service,neighbourChats:service,
   BUDGET:{},weather:false,world:{updateLife:noop},daylight:()=>1,ferryCrew:null,neighbours:null};
  vm.runInNewContext(helpers+advance+'\nadvanceTown(1/30,true);',c);
  assert.equal(calls.minato,id==='market'?0:1);assert.equal(calls.sato,1,'Sato continues even outside the shared room');
 }
});

function leaveFixture(id){
 const sites=[{id:'izakaya',entryFacing:.4},{id:'ramen',entryFacing:.4},{id:'market',entryFacing:-1}],calls=[];
 const c={THREE,current:sites.find(s=>s.id===id),SITES:sites,activeRoomLayout:{yaw:0,exitSiteAt},player:new THREE.Object3D(),room:{},town:{},
  replayInterrupted:noop,lowerPocket:noop,spawnScene:null,photoStudio:null,photoReturning:false,NAHA_ARRIVALS:{id:'arrivals'},CITY_RESTAURANT:{id:'restaurant'},
  activities:{state:{},close:noop},wearSwim:noop,inspector:null,resetInput:noop,document:{body:{classList:{remove:noop}}},$:()=>({classList:{add:noop}}),
  seated:false,parkSeat:null,active:null,yaw:.7,pitch:.1,hands:{},thirdPerson:false,syncView:noop,clearRoom:()=>calls.push('cleared'),
  placeAtEntrance:s=>calls.push(s.id),roomToStreet,yAxis:new THREE.Vector3(0,1,0),say:noop,syncExteriorPlace:()=>'',finishDungeon:noop};
 vm.createContext(c);vm.runInContext(helpers+leave,c);return {c,calls};
}

test('physical and contextual exits return to the selected street door, without cross-room teleporting',()=>{
 for(const [entry,destination] of [['izakaya','ramen'],['ramen','izakaya']]){
  const {c,calls}=leaveFixture(entry);c.player.position.set(...(destination==='ramen'?P.ramenEntrance.spawn:P.entrance.spawn));c.leaveNearbyDoor();
  assert.deepEqual(calls,['cleared',destination]);assert.equal(c.current,null);assert.ok(Math.abs(c.yaw-1.1)<1e-9);
  const explicit=leaveFixture(entry);explicit.c.leaveRoom(destination);assert.deepEqual(explicit.calls,['cleared',destination]);
 }
 for(const [entry,request,expected] of [['izakaya',undefined,'izakaya'],['izakaya','market','izakaya'],['market','ramen','market']]){
  const {c,calls}=leaveFixture(entry);c.leaveRoom(request);assert.deepEqual(calls,['cleared',expected]);
 }
 // The actual contextual control measures the nearby door, not only the entry door.
 const visibility=between('const exitPoint=','\n contextTarget=');
 for(const at of [P.entrance.spawn,P.ramenEntrance.spawn,[0,0,-2]]){
  const c={current:{id:'izakaya'},active:null,player:{position:new THREE.Vector3(...at)},roomWalk:()=>null,
   activeRoomLayout:{exit:P.entrance.exit,exitAt:(x,z)=>exitSiteAt(x,z)==='ramen'?P.ramenEntrance.exit:P.entrance.exit}};
  vm.runInNewContext(visibility+'\nvisible=exitNearby;',c);assert.equal(c.visible,at[2]>0);
 }
});

test('shared street views and television work through either entrance during either service period',()=>{
 const frontage=source.match(/function streetFrontageOf\(site\)\{[^\n]+/)[0],sharedFrontage={position:[1,0,2],interiorZ:P.bounds.maxZ};
 const c={};vm.runInNewContext(frontage,c);
 for(const id of ['izakaya','ramen'])assert.equal(c.streetFrontageOf({id,streetFrontage:sharedFrontage}),sharedFrontage);
 const loop=source.slice(source.indexOf('function loop()'));
 const tv=loop.slice(loop.indexOf('izakayaTV?.update('),loop.indexOf(';',loop.indexOf('izakayaTV?.update('))+1);
 for(const id of ['izakaya','ramen','market'])for(const minutes of [600,720,1200]){
  let update;const c={current:{id},minutes,izakayaOpen,satoRamenOpen,izakayaTV:{update:o=>update=o},camera:{},started:true,document:{hidden:false},roomLoading:false,inspector:null,activities:{paused:false}};
  vm.runInNewContext(helpers+tv,c);assert.equal(update.active,id!=='market'&&minutes!==600,id+' at '+minutes);
 }
});

test('a failed room build returns to the street and leaves the entrance usable',async()=>{
 const enter=between('async function enterRoom(','\nfunction leaveRoom(');
 for(const id of ['izakaya','ramen']){
  const site={id,title:id==='izakaya'?'Minato Izakaya':'Sato Ramen'},fault=Error('Injected interior setup failure'),calls=[];
  const c={SITES:[site],businessId:id=>id,current:null,roomLoading:false,photoStudio:null,photoReturning:false,
   replayInterrupted:noop,lowerPocket:noop,spawnScene:null,playingResident:()=>false,izakayaReady:()=>true,
   roomAssetsReady:()=>true,activities:{state:{},close:noop,visit:noop},parkSeat:{},seated:true,
   yaw:.7,pitch:.12,player:new THREE.Object3D(),yAxis:new THREE.Vector3(0,1,0),resetInput:()=>calls.push('input'),
   roomShell:()=>{throw fault;},console:{error:(message,error)=>calls.push([message,error])},
   leaveRoom:()=>{calls.push('street');c.current=null;},say:message=>calls.push(message)};
  vm.createContext(c);vm.runInContext(enter,c);
  assert.equal(await c.enterRoom(site),false,'A failed entry resolves without an unhandled rejection');
  assert.equal(c.current,null);assert.equal(c.seated,false);assert.equal(c.parkSeat,null);
  assert.equal(c.yaw,.7);assert.equal(c.pitch,.12);
  assert.ok(calls.includes('street'));assert.ok(calls.includes('input'));
  assert.ok(calls.some(value=>Array.isArray(value)&&value[1]===fault),'Keep the original exception for diagnosis');
  assert.ok(calls.at(-1).includes('safely outside'));
 }
});
