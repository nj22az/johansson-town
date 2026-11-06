import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
const source=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
const identity=source.slice(source.indexOf('function sharedDining('),source.indexOf('function roomCollider('));
const clear=source.slice(source.indexOf('function clearRoom('),source.indexOf('\nfunction roomShell('));
const leave=source.slice(source.indexOf('function leaveRoom('),source.indexOf('\nfunction syncExteriorPlace('));

test('leaving an interior releases resources immediately and preserves borrowed assets and persistent interactions',()=>{
 for(const id of ['izakaya','ramen','market']){
  const room=new THREE.Group(),ownedGeometry=new THREE.BoxGeometry(),ownedMaterial=new THREE.MeshStandardMaterial(),ownedTexture=new THREE.Texture();ownedMaterial.map=ownedTexture;
  const owned=new THREE.Mesh(ownedGeometry,ownedMaterial),shared=new THREE.Group();shared.userData.sharedAsset=true;
  const borrowed=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());shared.add(borrowed);room.add(owned,shared);
  const released=[];for(const [resource,label] of [[ownedGeometry,'geometry'],[ownedMaterial,'material'],[ownedTexture,'texture'],[borrowed.geometry,'borrowed geometry'],[borrowed.material,'borrowed material']])resource.addEventListener('dispose',()=>released.push(label));
  const calls=[],noop=()=>{},service={restore:noop,cancel:noop,dispose:noop,clear:noop,hide:noop};
  const persistent={userData:{persistentShop:true,hit:{inside:true}}},temporary={userData:{hit:{inside:true}}};
  // clearRoom() cancels the third-person Johansson's table drink (game.js `johansson?.cancelTableDrink()`); he is null here.
  const context={THREE,current:{id},room,roomColliders:[{}],interactables:[persistent,temporary],boxCache:new Map(),town:{visible:false},indoorCeilings:{},activeRoomLayout:{dispose:()=>calls.push('room disposed')},
   townSections:{invalidate:()=>calls.push('outside cache invalidated')},shopStreetView:{dispose:()=>calls.push('portal disposed')},showShopThroughWindow:()=>calls.push('live storefront'),sakuraShop:{hide:noop},
   replayInterrupted:noop,lowerPocket:noop,spawnScene:null,photoStudio:null,photoReturning:false,NAHA_ARRIVALS:{id:'arrivals'},CITY_RESTAURANT:{id:'restaurant'},activities:{state:{},close:noop},wearSwim:noop,inspector:null,resetInput:noop,
   document:{body:{classList:{remove:noop}}},$:()=>({classList:{add:noop}}),seated:true,parkSeat:{},active:{},yaw:.3,pitch:.1,hands:{},thirdPerson:false,syncView:noop,placeAtEntrance:noop,
   roomToStreet:y=>y,player:new THREE.Object3D(),yAxis:new THREE.Vector3(0,1,0),say:noop,syncExteriorPlace:()=>'',finishDungeon:noop,
   johansson:null,izakayaTV:null,storeService:null,ramenPlayerService:null,venueService:null,beerService:null,workplaceResidents:service,bookshopCustomers:service,neighbourChats:service,chatBubble:service,izakayaGuests:service,onsenGuests:service,homeGuests:service,hideRamen:noop};
  vm.runInNewContext(identity+clear+'\n'+leave+'\nleaveRoom();',context);
  assert.equal(context.current,null);assert.equal(room.children.length,0,'Closed interior is not retained while outdoors');
  assert.deepEqual(released.sort(),['geometry','material','texture']);
  assert.deepEqual(calls,['outside cache invalidated','portal disposed','room disposed','live storefront']);
  assert.deepEqual(context.interactables,[persistent]);assert.equal(context.roomColliders.length,0);assert.equal(context.town.visible,true);
 }
});

test('the actual indoor simulation advances time and resident controllers while player input is paused',()=>{
 // Neighbour chats are cancelled whenever they cannot run (paused, catching up or off the budget: game.js advanceTown,
 // since the NPC social restoration of 25 October 2026, briefs/HANDOFF-NPC-SOCIAL-2026-10-25.md), so the service has
 // `cancel` as the game's own does. The third-person Johansson model (game.js `johansson`) is null until it is first shown.
 const calls={life:0,cast:0,neighbours:0,shop:0};const noop=()=>{},service={update:noop,sync:noop,cancel:noop};
 const start=source.indexOf('function advanceTown('),end=source.indexOf('/** Keeps the town on the device clock',start);
 const simStart=source.indexOf('function simulate(frameDt'),simEnd=source.indexOf('\nconst absence=',simStart);
 const context={minutes:145,elapsed:0,accumulator:0,saveTick:0,SIM_STEP:1/60,MAX_FRAME_DT:.1,townClock:{speed:1},current:{id:'market'},catchingUp:false,
  deckUnder:()=>null,islandPlay:null,activities:{tick:noop,save:noop},evictIfClosed:noop,izakayaGuests:service,onsenGuests:service,activeRoomLayout:null,homeOwner:()=>false,homeGuests:service,
  venueService:null,beerService:null,ramenPlayerService:null,workplaceResidents:service,bookshopCustomers:service,castAI:{update:()=>calls.cast++},sakuraShop:{update:()=>calls.shop++},ramenGuests:service,ramenMeals:service,satoKitchen:null,neighbourChats:service,
  world:{updateLife:()=>calls.life++},ferryCrew:null,neighbours:{update:()=>calls.neighbours++},weather:false,daylight:()=>1,advanceWeather:noop,updatePost:noop,followClock:noop,attention:{update:noop,attends:()=>true},BUDGET:{}};
 vm.runInNewContext(identity+source.slice(start,end)+'\n'+source.slice(simStart,simEnd)+'\nfor(let i=0;i<7200;i++)simulate(1/60,true);',context);
 assert.ok(Math.abs(context.minutes-147)<1e-6);for(const name of Object.keys(calls))assert.equal(calls[name],7200,name+' continues without rendering');
});
