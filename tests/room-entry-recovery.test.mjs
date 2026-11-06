import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {SAKURA_STAIR_PASSAGE,SAKURA_STAIR_CLIMB,toOffice,onSakuraStairFoot,onSakuraStairHead} from '../src/world/interiors/sakura-stairs.js';
import {BLUE_CORAL} from '../src/world/blue-coral-shop.js';

// Exercise the actual entry/transition code; only rendering, loading and the DOM
// are replaced so failures can be injected without a browser or network.
const source=readFileSync(new URL('../src/game.js',import.meta.url),'utf8'),noop=()=>{};
const between=(start,end)=>{const i=source.indexOf(start),j=source.indexOf(end,i);assert.ok(i>=0&&j>i,start);return source.slice(i,j);};
const entry=between('async function enterRoom(','\nfunction leaveRoom(');
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};

function fixture(site,extra={}){
 const calls={builds:[],errors:[],messages:[],visits:[],resets:0},old={id:'existing-room'},layout={retained:true};
 const nodes=new Map(),c={THREE,SITES:[site],businessId:id=>id,current:old,roomLoading:false,photoStudio:null,photoReturning:false,
  replayInterrupted:noop,lowerPocket:noop,spawnScene:null,playingResident:()=>false,izakayaReady:()=>true,roomAssetsReady:()=>true,
  sakuraShop:{ready:async()=>true},kitahamaShopRoomReady:async()=>true,loadRoomAssets:async()=>true,preloadIzakaya:async()=>{},
  activities:{state:{},close:noop,visit:id=>calls.visits.push(id),action:noop},parkSeat:{id:'old-seat'},seated:true,
  yaw:.7,pitch:.12,player:new THREE.Object3D(),camera:new THREE.PerspectiveCamera(),yAxis:new THREE.Vector3(0,1,0),
  room:new THREE.Group(),activeRoomLayout:layout,thirdPerson:false,content:null,indoorCeilings:null,
  resetInput:()=>{calls.resets++;},console:{error:(message,error)=>calls.errors.push({message,error})},
  roomShell:s=>{assert.equal(c.roomLoading,true,'The entry lock remains held through construction');calls.builds.push(s.id);c.activeRoomLayout={storeys:true,spawn:[0,0,2]};},
  addRoomProps:noop,buildBusinessContent:()=>({}),reg:noop,inspector:{open:noop},createIndoorCeilings:noop,unstuckPlayer:noop,
  workplaceResidents:{enter:noop},bookshopCustomers:{enter:noop},minutes:720,roomyHeading:v=>v,streetToRoom:v=>v,syncView:noop,active:null,
  leaveRoom:()=>{c.current=null;},say:message=>calls.messages.push(message),
  $:selector=>{if(!nodes.has(selector))nodes.set(selector,{classList:{remove:noop},textContent:''});return nodes.get(selector);},...extra};
 c.player.position.set(4,0,5);vm.createContext(c);vm.runInContext(entry,c);return {c,calls,old,layout};
}

test('every prerequisite rejects safely, preserves the current room and permits a successful retry',async()=>{
 for(const id of ['market','izakaya','ramen','kitahama-shop','onsen','sakura-office'])for(const rejection of [false,true]){
  const site={id,title:id},fault=Error('Injected '+id+' preload rejection');let fail=true,assetReady=false;
  const load=async()=>{if(fail){if(rejection)throw fault;return false;}assetReady=true;return true;};
  const extra=id==='market'?{sakuraShop:{ready:load}}:id==='kitahama-shop'?{kitahamaShopRoomReady:load}:
   ['izakaya','ramen'].includes(id)?{izakayaReady:()=>assetReady,preloadIzakaya:load}:{roomAssetsReady:()=>assetReady,loadRoomAssets:load};
  const {c,calls,old,layout}=fixture(site,extra),seat=c.parkSeat;
  assert.equal(await c.enterRoom(site),false,id+' failure resolves');
  assert.equal(c.roomLoading,false);assert.equal(c.current,old);assert.equal(c.activeRoomLayout,layout);
  assert.deepEqual(c.player.position.toArray(),[4,0,5]);assert.equal(c.seated,true);assert.equal(c.parkSeat,seat);
  assert.deepEqual(calls.builds,[]);assert.deepEqual(calls.visits,[]);
  assert.ok(calls.messages.at(-1).includes('Please try the door again'));
  if(rejection)assert.equal(calls.errors[0]?.error,fault,'Preserve the original rejection');
  fail=false;assert.equal(await c.enterRoom(site),true,id+' retry succeeds');
  assert.equal(c.roomLoading,false);assert.equal(c.current,site);assert.deepEqual(calls.builds,[id]);
 }
});

test('rapid entries cannot replace a room while any stage of the first entry is pending',async()=>{
 const shop={id:'market',title:'Sakura'},other={id:'sakura-office',title:'Office'},first=deferred(),second=deferred(),secondStarted=deferred();
 const {c,calls}=fixture(shop,{sakuraShop:{ready:()=>first.promise},roomAssetsReady:()=>false,
  loadRoomAssets:()=>{secondStarted.resolve();return second.promise;}});
 c.SITES.push(other);const opening=c.enterRoom(shop);
 assert.equal(c.roomLoading,true);assert.equal(await c.enterRoom(other),false);
 first.resolve(true);await secondStarted.promise;
 assert.equal(c.roomLoading,true);assert.equal(await c.enterRoom(other),false);
 assert.deepEqual(calls.builds,[]);second.resolve(true);assert.equal(await opening,true);
 assert.equal(c.roomLoading,false);assert.equal(c.current,shop);assert.deepEqual(calls.builds,['market']);
});

test('a late setup failure uses the existing street rollback and releases the entry lock',async()=>{
 const site={id:'izakaya',title:'Minato'},fault=Error('Resident placement failed');let fail=true;
 const {c,calls}=fixture(site,{workplaceResidents:{enter:()=>{if(fail)throw fault;}}});
 assert.equal(await c.enterRoom(site),false);assert.equal(c.current,null);assert.equal(c.roomLoading,false);
 assert.equal(c.yaw,.7);assert.equal(c.pitch,.12);assert.equal(calls.errors[0].error,fault);
 assert.ok(calls.messages.at(-1).includes('safely outside'));
 fail=false;assert.equal(await c.enterRoom(site),true);assert.equal(c.current,site);
});

test('background room assets consume loader rejections and can retry',async()=>{
 const loader=between('async function loadRoomAssets(','\nlet roomAssetsTry='),fault=Error('Poster fetch failed');let failed=true;
 const c={ROOM_ASSETS:{},preloadTradePosters:async()=>{if(failed)throw fault;return true;},console:{error:(message,error)=>assert.equal(error,fault)}};
 vm.createContext(c);vm.runInContext(loader,c);
 assert.equal(await c.loadRoomAssets({id:'sakura-office'}),false);
 failed=false;assert.equal(await c.loadRoomAssets({id:'sakura-office'}),true);
});

function stairs(up,ready,enterRoom){
 const market={id:'market',title:'Sakura'},office={id:'sakura-office',title:'Sakura office'},messages=[],errors=[],veil={style:{},classList:{add:noop,remove:noop}};
 const c={THREE,current:up?market:office,SITES:[market],SAKURA_OFFICE_SITE:office,SAKURA_STAIR_PASSAGE,SAKURA_STAIR_CLIMB,toOffice,onSakuraStairFoot,onSakuraStairHead,
  stairPassage:null,stairArmed:true,sakuraStairArrival:false,roomLoading:false,replayInterrupted:noop,resetInput:noop,pointWalk:{cancel:noop},seated:false,parkSeat:null,
  player:new THREE.Object3D(),yAxis:new THREE.Vector3(0,1,0),yaw:0,pitch:.3,playerSpeed:1,thirdPerson:false,syncView:noop,
  camera:new THREE.PerspectiveCamera(),loadRoomAssets:()=>ready(),sakuraShop:{ready:()=>ready()},enterRoom,leaveRoom:()=>assert.fail('Do not discard the loaded storey before entry'),
  $:()=>veil,say:message=>messages.push(message),console:{error:(...args)=>errors.push(args)},setTimeout:fn=>{fn();return 1;}};
 vm.createContext(c);vm.runInContext(between('function takeSakuraStair(','/** One step of the climb:')+
  between('async function finishStairPassage(','/** The locked stairwell camera:')+
  between('function checkSakuraStair(','/**\n * The office\'s fire door'),c);
 return {c,messages,errors};
}

test('failed stair prerequisites retain either storey at its safe arrival and allow another climb',async()=>{
 for(const up of [true,false])for(const rejects of [true,false]){
  let fail=true,entries=0;const ready=()=>fail?(rejects?Promise.reject(Error('Missing storey asset')):Promise.resolve(false)):Promise.resolve(true);
  const {c,messages}=stairs(up,ready,async()=>{entries++;c.current=c.stairPassage.target;return true;}),original=c.current;
  assert.equal(c.takeSakuraStair(up?'up':'down'),true);
  // Represent the end of the animated climb, which is not a walkable waiting spot.
  c.player.position.set(-4,2,-6);assert.equal(await c.finishStairPassage(),false);
  assert.equal(c.current,original);assert.equal(entries,0);assert.equal(c.stairPassage,null);assert.equal(c.sakuraStairArrival,false);assert.equal(c.playerSpeed,0);
  const back=SAKURA_STAIR_PASSAGE[up?'foot':'head'].arrive;
  assert.deepEqual(c.player.position.toArray(),[...back.at]);assert.equal(c.yaw,back.yaw);assert.equal(c.pitch,0);
  assert.ok(messages.at(-1).includes('Please try the stairs again'));assert.ok(!messages.some(s=>s==='Sakura · the office upstairs.'||s==='Sakura · the stockroom.'));
  c.checkSakuraStair();assert.equal(c.stairArmed,true,'The safe arrival is clear of the trigger');
  fail=false;assert.equal(c.takeSakuraStair(up?'up':'down'),true);assert.equal(await c.finishStairPassage(),true);assert.equal(entries,1);
 }
});

test('a second prerequisite check failing during the cut also keeps the original storey',async()=>{
 const {c,messages}=stairs(true,()=>Promise.resolve(true),async()=>false),original=c.current;
 c.takeSakuraStair('up');assert.equal(await c.finishStairPassage(),false);assert.equal(c.current,original);
 assert.deepEqual(c.player.position.toArray(),[...SAKURA_STAIR_PASSAGE.foot.arrive.at]);assert.deepEqual(messages,[]);
});

test('a stale dessert action cannot expose purchases at the vacant Blue Coral counter',()=>{
 const handler=between("if(args[0]==='dessert-menu'){","if(args[0]==='ferry-ladder')"),actions=[];
 vm.runInNewContext('(function(){'+handler+'})()',{BLUE_CORAL,args:['dessert-menu','Blue Coral',[{title:'Ice cream',cost:150}]],
  // Even an obsolete controller reporting open cannot override unstaffed data.
  world:{blueCoral:{isOpen:()=>true}},activities:{menu:()=>assert.fail('The vacant shop has no live service menu'),action:(...args)=>actions.push(args)}});
 assert.deepEqual(actions,[['read','Nakamura is closed',BLUE_CORAL.closedNotice]]);
});
