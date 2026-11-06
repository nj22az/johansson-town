/**
 * CPU-only full-game wiring smoke.
 * Run from the Johansson Town directory:
 *   npm test
 * Or set TOWN_REVIEW_ROOT to that directory.
 *
 * This substitutes only WebGLRenderer and DOM/browser APIs. The real vendored
 * Three.js scene graph, geometry, town, content, activities, people, room
 * construction, fixed simulation and save modules execute. It does not test
 * WebGL support, shader compilation, screenshots, sound playback or frame rate.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {CAST_NAMES} from '../src/people/cast.js';
import {residentCards,canonicalHomeSites} from '../src/people/home-directory.js';

// The town's clock follows the real one (town-clock.js), so without this the smoke test
// depended on the hour it was run at: after 20:00 Sakura had already shut and restocked
// before the test's own day began, and the after-hours restock it checks never came. Ten
// in the morning, with time still running from there.
{
 const RealDate=Date,started=RealDate.now(),base=new RealDate(2026,8,30,10,0,0).getTime();
 globalThis.Date=class extends RealDate{
  constructor(...args){super(...(args.length?args:[base+RealDate.now()-started]));}
  static now(){return base+RealDate.now()-started;}
 };
}
// Explicit post-consolidation addresses: removing a working door still fails this smoke.
// Keep the visit expectation tied to this independent inventory, not the runtime's SITES.
// The doctor's flat (home-clinic) went with Dr Kakazu on 22 October 2026: Nhung, the doctor now, lives at 3 Kitahama.
const EXPECTED_SITES=['clinic','community-kitchen','form3d','frontrow','home-higa','home-kitahama-3','home-kitahama-8','home-kitahama-flat-3','home-kitahama-flat-4','home-kitano-2','izakaya','kitahama-shop','koban','market','mayor-home','office','onsen','ramen','resident-home-kenji','resident-home-mrs-sato','resident-home-thuan','school'];
// Twelve core households after the 31 October Nakamura retirement, plus supporting accommodation and duty berths (CAST-CONSOLIDATION-REPORT.md; roster.js HOUSEHOLDS).
const EXPECTED_HOME_DESTINATIONS=['ferry-chief-cabin','ferry-crew-cabin','ferry-engineer-duty-berth','ferry-officer-cabin','fujita-houseboat','home-higa','home-kitahama-3','home-kitahama-8','home-kitahama-flat-3','home-kitahama-flat-4','home-kitano-2','koban','mayor-home','office','resident-home-kenji','resident-home-mrs-sato','resident-home-thuan'];
const root=resolve(new URL('..',import.meta.url).pathname);
const fixtures=await import(pathToFileURL(resolve(root,'tests/fixtures.mjs')).href);
import {provideCatalog} from './catalog-fixture.mjs';
const dataModule=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');

function assertFiniteTransforms(api,label){
  api.scene.updateMatrixWorld(true);
  api.camera.updateMatrixWorld(true);
  for(const object of [api.scene,api.camera])object.traverse(node=>{
    assert.ok(node.matrix.elements.every(Number.isFinite),label+': invalid local matrix on '+(node.name||node.type));
    assert.ok(node.matrixWorld.elements.every(Number.isFinite),label+': invalid world matrix on '+(node.name||node.type));
    assert.ok([node.position.x,node.position.y,node.position.z].every(Number.isFinite),label+': invalid position');
  });
  assert.ok(api.camera.projectionMatrix.elements.every(Number.isFinite),label+': invalid camera projection');
}

function quietDataUrlError(error){
  // Keep failed assertions readable: a Node stack can otherwise print the full
  // base64-encoded source of the imported game and obscure the actual failure.
  if(error?.stack)error.stack=error.stack.split('\n').map(line=>line.length>1200?line.slice(0,100)+' … '+line.slice(-80):line).join('\n');
  return error;
}

// In the third-person view you start up to a step inside the door, so the camera has room.
const atDoor=(p,spawn)=>{assert.equal(p[1],spawn[1]);assert.ok(Math.hypot(p[0]-spawn[0],p[2]-spawn[2])<=1.25,`${p} is not at the door ${spawn}`);};

test('Published island boots, shares the wooden bookshop/workshop and visits every interior',async()=>{
  try {
    fixtures.installDOM();
    // The Town Book uses semantic nested cards and prepends each person's avatar.
    // Keep this browser double local to the full-game test; the real UI module runs.
    const createElement=document.createElement.bind(document);
    document.createElement=tag=>{const element=createElement(tag);element.tagName=tag.toUpperCase();element.ownerDocument=document;
      element.prepend=(...items)=>element.children.unshift(...items);return element;};
    // Native panels mount styles in the head and add their tile by element ID.
    document.head=document.createElement('head');
    document.getElementById=id=>document.querySelector('#'+id);
    Object.assign(document.querySelector('#minimap'),{width:720,height:620});
    // A bookmarked bench URL now starts safely on foot at the fish auction (the bench was removed).
    globalThis.location.search='?spawn=sakura-bench&cinematic=off';
    globalThis.innerHeight=768;
    globalThis.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
    globalThis.addEventListener=()=>{};
    globalThis.requestAnimationFrame=()=>1; // No real browser render scheduling.
    globalThis.cancelAnimationFrame=()=>{};
    document.querySelectorAll=()=>[];
    window.devicePixelRatio=1;
    document.hidden=false;

    const gameUrl=pathToFileURL(resolve(root,'src/game.js'));
    const threeUrl=pathToFileURL(resolve(root,'vendor/three.module.js')).href;
    let source=await readFile(gameUrl,'utf8');
    const index=await readFile(resolve(root,'index.html'),'utf8');
    // The third-person view (the eye button, V) is a deliberate feature again.
    assert.match(index,/id="viewButton"/,'The view button is on the page');
    source=source.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_,prefix,relative,suffix)=>prefix+new URL(relative,gameUrl).href+suffix);
    const rendererShim=dataModule(`
      export * from ${JSON.stringify(threeUrl)};
      export class WebGLRenderer {
        constructor({canvas}){this.domElement=canvas;this.capabilities={getMaxAnisotropy:()=>8,isWebGL2:true};this.shadowMap={};this.dpr=1;this.width=1;this.height=1;this.target=null;this.autoClear=true;this.info={render:{calls:0,triangles:0}};}
        setPixelRatio(value){this.dpr=value;}
        getPixelRatio(){return this.dpr;}
        setSize(width,height,updateStyle=true){this.width=width;this.height=height;if(updateStyle){this.domElement.style.width=width+'px';this.domElement.style.height=height+'px';}}
        render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}
        // The ink pipeline draws the town into an offscreen target before grading it,
        // so the double has to answer the render-target half of the renderer too.
        getDrawingBufferSize(target){target.set(this.width*this.dpr,this.height*this.dpr);return target;}
        getRenderTarget(){return this.target;}
        setRenderTarget(target){this.target=target;}
        clear(){}
        clearDepth(){}
      }
    `);
    const threeImport="import * as THREE from '"+threeUrl+"';";
    assert.ok(source.includes(threeImport),'Expected canonical vendored Three.js import');
    source=source.replace(threeImport,"import * as THREE from '"+rendererShim+"';");
    source+='\nexport {scene,camera,world,player,SITES,activities,simulate,advanceAbsentTown,catchUpFrame,enterRoom,leaveRoom,runStabilityChecks,setTime,keys,groundHeight,characters,interaction,resizeRenderer,doInteract,touchSticks,residentBlocked,occupiedByPerson,environmentBlocked,updateContextControls,navigationLeg,seated,parkSeat};\nexport const reviewRoom=()=>room;export const reviewShop=()=>sakuraShop;export const reviewSetActive=o=>active={...o.userData.hit,object:o};\nexport const reviewCurrentRoom=()=>current;\nexport const reviewSetMinutes=value=>{followRealClock=false;minutes=value;};export const reviewSetYaw=value=>yaw=value;\nexport const reviewRoomState=()=>({visible:room.visible,townVisible:town.visible,colliders:roomColliders.length});\nexport const reviewHiddenCutaways=()=>{let hidden=0;room.traverse(o=>{if(o.userData.cutaway&&o.layers.mask!==1)hidden++;});return hidden;};\n//# sourceURL=johansson-town-cpu-smoke.js\n';
    // Exercise the new geometry in the full game, including actual room exits.
    const originalFetch=globalThis.fetch;
    globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});
    globalThis.fetch=async url=>String(url).startsWith('blob:')?originalFetch(url):new Response(await readFile(resolve(root,'assets',new URL(url).pathname.split('/assets/')[1])));
    const {SUPPLIED_ROOM_LAYOUTS}=await import('../src/world/supplied-rooms.js?snappy=1');
    const {preloadPark}=await import('../src/world/park.js?snappy=1');assert.equal(await preloadPark(),true);
    const {preloadIzakaya}=await import('../src/world/izakaya.js?snappy=1');
    assert.deepEqual(await preloadIzakaya(),{ready:2,total:2},'New izakaya exterior and existing dining room preloaded');
    // World's catalogue (src/catalog): Umi-no-yu is built with Studio's massage chair, and the game opens its door only
    // once the chair's model is in hand (enterRoom, ONSEN_ASSETS). This DOM has no page for the catalogue to fetch in
    // (window.document), so the model is read from disk and handed over, as the room tests do (catalog-fixture.mjs).
    const {ONSEN_ASSETS}=await import('../src/world/interiors/onsen.js');
    await provideCatalog(...ONSEN_ASSETS);
    source+='\nexport {applyFerryCamera,ferryExploreActive,changeView,inspectFerryMachinery};export const reviewFerryExplorer=()=>ferryExplorer;\n';
    const api=await import(dataModule(source));
    const {Vector3}=await import(threeUrl);
    const {BOOKSHOP_WORKSHOP_ROOM}=await import('../src/world/bookshop-workshop-layout.js');
    const {circleHitsRect}=await import('../physics.js?snappy=1');
    assert.deepEqual(api.SITES.map(s=>s.id).sort(),EXPECTED_SITES);
    assert.equal(api.SITES.some(s=>s.id==='home-nakamura'),false,'The retired family has no live residence entry');
    assert.equal(api.world.people.some(p=>['Mrs Nakamura','Mai'].includes(p.profile.name)),false,'The retired ice-cream family is not spawned');
    assert.deepEqual(api.world.landmarks.map(s=>s.id).sort(),['airport-island','ferry-terminal','fujita-houseboat','harbour-park','home-higa','home-kitahama-flat-3','home-kitahama-flat-4','nakamura','warehouse']);
    assert.deepEqual(api.world.harbourShops.map(s=>s.id).sort(),['form3d','frontrow','office']);
    assert.ok(api.world.group.getObjectByName('west-shop:frontrow'));
    assert.equal(api.world.group.getObjectByName('west-shop:form3d'),undefined,'Only one bookshop/workshop exterior');
    assert.equal(api.world.group.getObjectByName('Sato Ramen restaurant'),undefined,'The island has no ramen premises');
    assert.equal(window.__JOHANSSON_RUNNING__,true);
    assert.equal(window.__JOHANSSON_STABILITY__?.ok,true,'Startup stability: '+JSON.stringify(window.__JOHANSSON_STABILITY__?.failures));
    // Check the actual actions as well as the mode-aware diagnostic count.
    const streetLabels=new Set();api.world.group.traverse(o=>{if(o.userData.hit)streetLabels.add(o.userData.hit.label);});
    for(const label of ['Sit on neighbourhood bench','Inspect post box','Inspect utility cabinet','Inspect traffic mirror','Inspect recycling bins'])assert.ok(streetLabels.has(label),label);
    const waiting=api.world.people.find(p=>p.profile.name==='Thao').g;
    const savedPosition=waiting.position.clone(),savedVisibility=waiting.visible;
    waiting.position.set(0,0,10);waiting.visible=true;waiting.userData.visualReady=false;
    assert.equal(api.residentBlocked(0,10),false,'Pending characters cannot create invisible collisions');
    assert.equal(api.occupiedByPerson(0,10),false);
    waiting.userData.visualReady=true;assert.equal(api.residentBlocked(0,10),true);
    waiting.position.copy(savedPosition);waiting.visible=savedVisibility;

    const market=api.SITES.find(s=>s.id==='market'),books=api.SITES.find(s=>s.id==='frontrow');
    // The bus stop is an outdoor destination; the warehouse has an interior.
    const interiors=[...api.SITES,api.world.landmarks.find(s=>s.id==='warehouse')];
    assert.equal(api.world.sakuraBench,undefined,'The removed bench has no world seat');
    assert.equal(api.world.group.getObjectByName('sakura-bench-seat'),undefined);
    assert.ok(!streetLabels.has('Sit and look at Sakura'),'No orphaned sit prompt');
    assert.equal(api.seated,false);assert.equal(api.parkSeat,null);
    assert.deepEqual([api.player.position.x,api.player.position.z],[19.8,-40],'The old bench URL starts at the safe harbour opening');
    // This harness suppresses animation frames; ground contact is settled by the fixed physics step.
    api.simulate(1/60);
    assert.equal(api.player.position.y,api.groundHeight(19.8,-40),'Standing feet settle on the actual harbour ground');
    assert.ok(!api.environmentBlocked(api.player.position.x,api.player.position.z),'Clear standing point');
    const look=api.camera.getWorldDirection(new Vector3());look.y=0;look.normalize();
    const toAuction=new Vector3(25.5-api.player.position.x,0,-43.4-api.player.position.z).normalize();
    assert.ok(look.dot(toAuction)>.97,'Opening view faces the fish auction');
    const openingStart=api.player.position.clone();api.keys.KeyW=true;api.simulate(.1);api.keys.KeyW=false;
    assert.ok(Math.hypot(api.player.position.x-openingStart.x,api.player.position.z-openingStart.z)>.1,'The first movement walks immediately');
    assert.equal(api.seated,false);
    assert.ok(!api.environmentBlocked(api.player.position.x,api.player.position.z),'Movement stays clear of solids');
    // The kerb furniture now stands at x=.5; exercise Run/strafe on the clear
    // middle of the east pavement instead of walking into the utility cabinet.
    api.player.position.set(2.5,0,14);api.reviewSetYaw(0);api.simulate(1/60);
    const runningStart=api.player.position.clone();
    for(let ahead=0;ahead<=.8;ahead+=.1){const hits=api.world.colliders.filter(c=>circleHitsRect(runningStart.x,runningStart.z-ahead,.34,c));assert.equal(hits.length,0,'Clear movement test route '+runningStart.toArray()+': '+JSON.stringify(hits));}
    api.touchSticks.move.y=-1;api.simulate(.1);const walked=api.player.position.distanceTo(runningStart);
    api.player.position.copy(runningStart);document.querySelector('#run').onpointerdown({button:0,pointerType:'touch',preventDefault(){},stopPropagation(){}});api.simulate(.1);
    assert.ok(api.player.position.distanceTo(runningStart)>walked*1.6,'Touch Run increases speed');
    document.querySelector('#run').onpointerdown({button:0,pointerType:'touch',preventDefault(){},stopPropagation(){}});
    api.player.position.copy(runningStart);api.keys.ShiftRight=true;api.simulate(.1);
    assert.ok(api.player.position.distanceTo(runningStart)>walked*1.6,'Right Shift runs');
    api.keys.ShiftRight=false;api.touchSticks.reset();api.player.position.copy(runningStart);
    const startX=api.player.position.x;api.keys.KeyA=true;api.simulate(.1);api.keys.KeyA=false;assert.ok(api.player.position.x<startX);
    const leftX=api.player.position.x;api.keys.KeyD=true;api.simulate(.1);api.keys.KeyD=false;assert.ok(api.player.position.x>leftX);
    assert.equal(window.__JOHANSSON_JUMP__(),true);api.simulate(.1);assert.ok(api.player.position.y>api.groundHeight(api.player.position.x,api.player.position.z)+.05);
    for(let i=0;i<12;i++)api.simulate(.1);assert.equal(api.player.position.y,api.groundHeight(api.player.position.x,api.player.position.z),'Jump lands on the actual drawn paving');
    assert.equal(api.player.visible,false);assert.equal(api.player.children.length,0);assert.equal(api.camera.fov,65);
    assert.equal(api.scene.fog,null);assertFiniteTransforms(api,'outdoor startup');

    const directory=()=>document.querySelector('#directoryButton').onclick();
    const descendants=node=>[node,...(node.children||[]).flatMap(descendants)];
    const directoryNodes=()=>descendants(document.querySelector('#directoryGrid'));
    const find=id=>directoryNodes().find(b=>b.dataset?.id===id);
    const shortcut=id=>directoryNodes().find(b=>b.dataset?.shortcut===id);
    const section=id=>{const tab=directoryNodes().find(b=>b.tagName==='BUTTON'&&b.dataset?.townFilter===id);assert.ok(tab,'Town Book section: '+id);tab.onclick();};
    directory();section('places');{const dock=find('form3d');assert.ok(dock&&/Dock/.test(dock.children[0]?.textContent||''),'The dock workshop remains an explicit public destination');}
    const publicIds=directoryNodes().filter(b=>b.dataset?.id).map(b=>b.dataset.id);
    for(const id of ['frontrow','form3d','market','clinic','office','koban','izakaya','onsen','harbour-park','school','community-kitchen','nakamura'])assert.ok(publicIds.includes(id),'Public business or place remains in Places: '+id);
    for(const id of ['aoba-garden','rainflower-lane','rainflower-florist','home-kitahama-flat-3','home-kitahama-flat-4','home-tamaki','home-kamiya'])assert.ok(!publicIds.includes(id),'Retired or vacant address is not a public destination: '+id);
    assert.equal(new Set(publicIds).size,publicIds.length,'Public destinations appear once');
    api.world.group.updateMatrixWorld(true);
    const homeTargets=canonicalHomeSites(residentCards({sites:api.SITES,landmarks:api.world.landmarks,people:api.world.people,neighbours:api.world.neighbours,minutes:600}));
    section('homes');assert.deepEqual(homeTargets.map(h=>h.id).sort(),EXPECTED_HOME_DESTINATIONS);assert.deepEqual(directoryNodes().filter(b=>b.dataset?.id).map(b=>b.dataset.id).sort(),homeTargets.map(h=>h.id).sort(),'Every occupied home has one address action');
    section('people');assert.deepEqual(directoryNodes().filter(b=>b.dataset?.personId).map(b=>b.dataset.personId).sort(),[...CAST_NAMES].sort(),'The live cast is discoverable exactly once');
    const walkingStart=api.player.position.clone();
    for(const [filter,ids]of [['places',publicIds],['homes',homeTargets.map(h=>h.id)]])for(const id of ids){
      directory();section(filter);assert.equal(find(id).dataset.travel,'locked');assert.equal(shortcut(id),undefined,'No shortcut before favours: '+id);
      find(id).onclick();assert.deepEqual(api.player.position.toArray(),walkingStart.toArray(),'Directions never move the player: '+id);
      if(id==='mayor-home'){
        const terminal=api.world.landmarks.find(s=>s.id==='ferry-terminal'),door=terminal.approachPosition||terminal.exitPosition||terminal.door;
        assert.equal(api.navigationLeg?.transfer,true,'Kitano home directions begin with a ferry leg even though the terminal is a landmark');
        assert.equal(api.navigationLeg.from,'minato');
        assert.deepEqual(api.navigationLeg.goal,{x:door[0],y:door[1],z:door[2]},'Use the actual public terminal entrance');
      }
    }
    api.activities.state.quest=3;api.activities.state.kenjiEscort='done';
    for(const home of homeTargets){
      directory();section('homes');assert.equal(find(home.id).dataset.travel,'locked','Show home remains walking-only after unlock');
      const before=api.player.position.clone();find(home.id).onclick();assert.deepEqual(api.player.position.toArray(),before.toArray(),'Unlocked Show home still marks a route');
      directory();section('homes');assert.equal(shortcut(home.id)?.dataset.travel,'ready','Occupied home shortcut: '+home.id);shortcut(home.id).onclick();
      assert.ok(Math.hypot(api.player.position.x-home.x,api.player.position.z-home.z)<1.25,'Home shortcut arrives at its actual entrance: '+home.id);
      assert.equal(api.environmentBlocked(api.player.position.x,api.player.position.z),false,'Home shortcut has standing clearance: '+home.id);
    }
    directory();section('places');assert.equal(find('frontrow').dataset.travel,'locked');assert.equal(shortcut('frontrow').dataset.travel,'ready');shortcut('frontrow').onclick();
    assert.ok(Math.hypot(api.player.position.x-books.door[0],api.player.position.z-books.door[2])<1.2);
    api.simulate(1/60);api.interaction();api.updateContextControls();assert.equal(document.querySelector('#enterBuildingButton').hidden,false,'The doorway remains available beside a nearby conversation');assert.match(document.querySelector('#enterBuildingButton').children.find(c=>c.className==='context-label').textContent,/Enter Front-Row Books/);
    // The street action includes the real asynchronous threshold animation.
    const entrance=api.world.group.getObjectByName('frontrow-west-entrance');
    await entrance.userData.hit.fn();assert.equal(api.reviewCurrentRoom()?.id,'frontrow');
    atDoor(api.player.position.toArray(),BOOKSHOP_WORKSHOP_ROOM.spawn);
    api.player.position.set(...BOOKSHOP_WORKSHOP_ROOM.spawn);api.interaction();api.updateContextControls();assert.equal(document.querySelector('#exitRoomButton').hidden,false,'Exit is available on the clear floor beside the door');await document.querySelector('#exitRoomButton').onclick({detail:0});assert.equal(api.reviewCurrentRoom(),null);
    assert.ok(Math.hypot(api.player.position.x-books.door[0],api.player.position.z-books.door[2])<1.2,'Return to the same entrance');

    const visited=new Set();
    for(const site of interiors){
      api.reviewSetMinutes(1050);api.reviewSetYaw((site.streetFrontage?.yaw??site.entryFacing??0)+Math.PI);
      await api.enterRoom(site);assert.equal(api.reviewCurrentRoom()?.id,site.id,'Interior entry: '+site.id);
      assert.equal(api.reviewRoomState().visible,true);assert.equal(api.reviewRoomState().townVisible,false);
      assert.ok(api.reviewRoomState().colliders>0,'Interior colliders: '+site.id);
      if(site.id==='frontrow'){
        atDoor(api.player.position.toArray(),BOOKSHOP_WORKSHOP_ROOM.spawn);
        // Repairs moved to the dock workshop; the bookshop keeps its counter, desks and reading table.
        for(const name of ['Bookselling counter','Newspaper and book wrapping desk','New arrivals display','Reading table'])assert.ok(api.reviewRoom().getObjectByName(name),name+' is in the bookshop');
        const exits=[];api.reviewRoom().traverse(o=>{if(o.userData.hit?.label.startsWith('Exit to '))exits.push(o);});
        assert.equal(exits.length,1,'One shared interior exit');
      }
      if(site.id==='office'){
        atDoor(api.player.position.toArray(),SUPPLIED_ROOM_LAYOUTS.office.spawn);
        assert.ok(api.reviewRoom().getObjectByName('Harbour office shell'));
        assert.ok(api.reviewRoom().getObjectByName('Clerk CRT monitor'));
      }
      if(site.id==='warehouse')assert.ok(api.reviewRoom().getObjectByName('warehouse-ledger-bench'));
      if(site.id==='izakaya')assert.ok(api.reviewRoom().getObjectByName('Minato CRT television'));
      // Movement uses the room's forward direction; entry itself preserves street yaw.
      const facing=site.id==='frontrow'?0:SUPPLIED_ROOM_LAYOUTS[site.id]?.yaw??0;api.reviewSetYaw(facing);
      const roomStart=api.player.position.clone();api.keys.KeyW=true;api.simulate(.1);api.keys.KeyW=false;
      assert.ok((api.player.position.x-roomStart.x)*-Math.sin(facing)+(api.player.position.z-roomStart.z)*-Math.cos(facing)>0,'Walk inside '+site.id);
      assert.equal(api.player.visible,false);assert.equal(api.reviewHiddenCutaways(),0);assertFiniteTransforms(api,'inside '+site.id);
      if(site.id==='market'){
        const rotation=api.camera.quaternion.clone();
        for(const [width,height] of [[390,844],[768,1030],[1024,768],[844,390]]){
          globalThis.innerWidth=width;globalThis.innerHeight=height;api.resizeRenderer();
          for(const talking of [true,false]){
            if(talking)api.activities.action('resident','Thuan');else api.activities.close();
            const canvas=document.querySelector('#game'),w=parseFloat(canvas.style.width),h=parseFloat(canvas.style.height),projection=api.camera.projectionMatrix.elements;
            assert.ok(Math.abs(api.camera.aspect-w/h)<1e-12);assert.ok(Math.abs(projection[0]*w/(projection[5]*h)-1)<1e-12,'Conversation keeps correct proportions');
          }
        }
        assert.ok(api.camera.quaternion.angleTo(rotation)<1e-6,'Conversation preserves view direction');
        globalThis.innerWidth=1024;globalThis.innerHeight=768;api.resizeRenderer();
        api.activities.action('resident','Thuan');
      }
      api.leaveRoom();
      assert.equal(api.activities.paused,false);assert.equal(api.reviewCurrentRoom(),null);
      assert.equal(api.reviewRoomState().townVisible,true);assert.equal(api.reviewRoom().getObjectByName('Minato CRT television'),undefined);
      assertFiniteTransforms(api,'outside '+site.id);visited.add(site.id);
    }
    assert.deepEqual([...visited].sort(),[...EXPECTED_SITES,'warehouse'].sort());

    // The afternoon workshop shift has Tetsuo ashore. Front-Row's floor is unstaffed by day since Nhung became the island
    // doctor (22 October 2026): she sets the paper at its back bench in the evening, checked below.
    // Chin is signed on aboard, not afternoon workshop staff; Reiko is retired.
    // Opening a workplace must not duplicate a driver or borrow the ferry's motorman.
    const {createResidentLedger}=await import('../src/people/resident-personalities.js');
    const ledger=createResidentLedger(()=>api.activities.state),staffNames=['Tetsuo'];
    const placeOf={Tetsuo:'form3d'};
    for(const name of staffNames)ledger.account(name,1050).shopping={finished:true};
    api.reviewSetMinutes(1050);api.player.position.set(0,0,14);
    const staff=api.world.people.filter(p=>staffNames.includes(p.profile.name));
    for(let i=0;i<600&&!staff.every(p=>p.g.userData.indoors==='work'||p.g.userData.inVehicle);i++)api.simulate(.1);
    const workshop=api.SITES.find(s=>s.id==='form3d');
    for(const site of [books,workshop]){
     await api.enterRoom(site);
     const chin=api.world.people.find(p=>p.profile.name==='Chin');
     assert.equal(chin.g.userData.aboardFerry,true,'Chin stays signed on aboard during the working day');
     assert.equal(chin.g.userData.inWorkplace,undefined,'Opening a shore workplace does not borrow Chin');
     for(const name of staffNames.filter(n=>placeOf[n]===site.id)){
      const p=api.world.people.find(p=>p.profile.name===name);assert.equal(p.profile.workSite,site.id);
      if(p.g.userData.inVehicle){
       const car=api.world.traffic.traffic.vehicles.find(v=>v.id===p.g.userData.inVehicle);
       assert.ok(car,name+' has an owned delivery car');assert.equal(car.driver,name);
       assert.equal(p.g.parent,car.g,name+' remains the same seated driver');
       assert.equal(api.world.traffic.drivers.has(car),true);assert.equal(p.g.userData.indoors,'vehicle');
      }else assert.equal(p.g.userData.inWorkplace,site.id,name+' works at '+site.id);
      assert.equal(p.g.visible,true);
     }
     if(site===books)api.leaveRoom();
    }
    const choose=label=>{const button=document.querySelector('#activityActions').children.find(b=>b.textContent===label);assert.ok(button,'Action: '+label);assert.equal(button.disabled,false);button.onclick();};
    api.reviewRoom().getObjectByName('content-stepwise').userData.hit.fn();assert.match(document.querySelector('#activityTitle').textContent,/StepWise/);choose('Use this pattern in Form 3D');
    const workshopBalance=api.activities.state.yen;choose('Print model · ¥40');
    api.leaveRoom();for(let i=0;i<90;i++)api.simulate(.1);assert.equal(api.activities.state.workshop.job.remaining,0,'Printing progresses outside');
    // Old saved addresses (the electronics shop, StepWise) resolve to the dock workshop.
    await api.enterRoom({id:'stepwise'});assert.equal(api.reviewCurrentRoom().id,'form3d');
    api.reviewRoom().getObjectByName('Use Form 3D printer').userData.hit.fn();choose('Collect model');
    assert.ok(api.activities.state.inventory.includes('Johansson cable ring'));assert.equal(api.activities.state.yen,workshopBalance-40);api.leaveRoom();
    // The evening at the paper (workplaces.js EVENING_DESKS): at 19:40 the old shop's room draws Nhung at the back bench.
    {const nhung=api.world.people.find(p=>p.profile.name==='Nhung');ledger.account('Nhung',1180).shopping={finished:true};api.reviewSetMinutes(1180);
     for(let i=0;i<1200&&nhung.g.userData.indoors!=='paper';i++)api.simulate(.1);
     assert.equal(nhung.g.userData.indoors,'paper','Nhung is at the paper at 19:40');
     await api.enterRoom(books);assert.equal(nhung.g.userData.inWorkplace,'frontrow','the old shop draws her at the back bench');assert.equal(nhung.g.visible,true);api.leaveRoom();}

    // Catch-up is queued now: drive the same bounded frame worker as the browser.
    api.reviewSetMinutes(5*1440+510);const journalBefore=api.activities.state.sakura.journal.length;
    api.advanceAbsentTown(1440);
    let batches=0;while(api.activities.state.pendingTownMinutes>0&&batches++<10000)api.catchUpFrame();
    assert.equal(api.activities.state.pendingTownMinutes,0,'Unattended day completes through bounded batches');
    const dayRows=api.activities.state.sakura.journal.slice(journalBefore);
    assert.ok(dayRows.some(r=>r.kind==='Sale'&&r.buyer!=='Johansson'),'Residents shop while the player is absent');
    assert.ok(dayRows.some(r=>r.kind==='Restocked'),'Thuan restocks after hours');
    assert.ok(dayRows.filter(r=>r.kind==='Restocked').every(r=>r.minute%1440>=1200||r.minute%1440<540));
    const savedShop=JSON.stringify(api.activities.state.sakura);await api.enterRoom(market);api.leaveRoom();
    assert.equal(JSON.stringify(api.activities.state.sakura),savedShop,'Entering does not replay sales');
    for(const site of interiors){api.reviewSetMinutes(180);await api.enterRoom(site);api.simulate(.1);assert.equal(api.reviewCurrentRoom()?.id,site.id,'Overnight entry: '+site.id);api.leaveRoom();}
    api.runStabilityChecks();assert.equal(window.__JOHANSSON_STABILITY__.ok,true,'Post-walkthrough stability: '+JSON.stringify(window.__JOHANSSON_STABILITY__.failures));
    // Exercise the actual walking/controller/render wiring below deck after the ordinary town tour.
    api.leaveRoom();api.reviewSetMinutes(515);api.world.ferry.parkAt('town');api.world.ferry.update(0,515,0);api.simulate(.05);
    const ship=api.world.ferry.ferry;ship.updateMatrixWorld(true);api.player.position.copy(ship.localToWorld(new Vector3(0,-1,11.1-17.25)));api.reviewSetYaw(.4);
    api.simulate(.05);api.applyFerryCamera();assert.equal(api.ferryExploreActive(),true);const explore=api.reviewFerryExplorer();assert.equal(explore.mode,'walk');assert.equal(explore.id,null);
    const start=ship.worldToLocal(api.player.position.clone());api.keys.KeyW=true;
    for(let i=0;i<36;i++){api.simulate(1/60);api.applyFerryCamera();}api.keys.KeyW=false;
    const after=ship.worldToLocal(api.player.position.clone());assert.ok(after.distanceTo(start)>.2&&after.distanceTo(start)<.8,'Engine-room walking uses a comfortable speed');
    for(let i=0;i<30;i++){api.simulate(1/60);api.applyFerryCamera();}
    const idle=ship.worldToLocal(api.camera.position.clone());let drift=0;
    for(let i=0;i<90;i++){api.simulate(1/60);api.applyFerryCamera();drift=Math.max(drift,ship.worldToLocal(api.camera.position.clone()).distanceTo(idle));}
    assert.ok(drift<.01,'Standing camera stays still relative to the ferry: '+drift);
    const feet=ship.worldToLocal(api.player.position.clone());assert.equal(api.inspectFerryMachinery(),true);assert.equal(explore.mode,'inspect');
    for(let i=0;i<12;i++){explore.orbit(.03,.01);explore.zoom(.98);api.simulate(1/60);api.applyFerryCamera();}
    api.inspectFerryMachinery();api.applyFerryCamera();assert.equal(explore.mode,'walk');assert.ok(ship.worldToLocal(api.player.position.clone()).distanceTo(feet)<.01,'Inspection returns to the same standing place');
    const views=new Set();for(let i=0;i<8;i++){api.changeView();api.applyFerryCamera();views.add(explore.id);}assert.equal(views.size,8,'All saved views are manually available');
    explore.walk();api.applyFerryCamera();assert.equal(explore.mode,'walk');
    console.log('Engine-room controller review',JSON.stringify({walkingMetres:after.distanceTo(start),idleDriftMetres:drift,manualViews:views.size}));
    globalThis.fetch=originalFetch;
  }catch(error){throw quietDataUrlError(error);}
});
