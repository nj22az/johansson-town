import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {standingHitsRect,canStepBetween} from '../physics.js';
import {stepInside} from '../src/world/room-arrival.js';

/**
 * The owner, 21 October 2026, on his iPhone outside Nakamura Zenzai: "There is a bug when I go outside the ice cream shop
 * it says enter their home and then I get stuck in the staircase, any place without a fully functional interior
 * shouldn't have a button to enter". And the same day: "Also the railing by the ships at the dock you can get stuck when
 * spawning there".
 *
 * So every way into somewhere -- a prompt that takes him in, the Enter button at a door, a room entered only from inside
 * another -- must lead to a fully functional interior:
 *   1. the room builds (game.js roomShell, run here as the game runs it, with the builders it imports);
 *   2. he arrives (the spawn, and the step inside the third-person camera takes) on walkable floor, clear of solids;
 *   3. he can move: a metre in at least two directions, and over every floor of a room of more than one storey;
 *   4. there is a working way back out: the Exit button's street point is walkable and clear, with room to move.
 * And every place the game starts or puts him outdoors (the openings, the ferry landings, the quick crossing) stands him
 * on walkable ground clear of solids, with room to move a metre two ways, and a way on foot to the street.
 * Failures are listed together, with the way in and the reason, so a new door that leads nowhere is named.
 */
installDOM();globalThis.self=globalThis;
const source=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
const slice=(from,to)=>{const a=source.indexOf(from),b=source.indexOf(to,a);assert.ok(a>=0&&b>a,'game.js still has '+from);return source.slice(a,b);};
// The game's own dispatch from a site to its room (game.js roomShell), run with the builders game.js imports.
const shellSource=slice('function roomShell(s){','\n\n\n/**\n * Doorways.');
const imports={};
for(const m of source.matchAll(/^import\s*\{([^}]*)\}\s*from\s*'([^']+)'/gm)){
 const path=new URL('../src/'+m[2].replace(/^\.\//,''),import.meta.url).href;
 for(const part of m[1].split(',')){const [name,alias]=part.trim().split(/\s+as\s+/);if(name)imports[(alias||name).trim()]={path,name:name.trim()};}
}
const scope={};
for(const n of new Set([...shellSource.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)].map(m=>m[1])))if(imports[n])scope[n]=(await import(imports[n].path))[imports[n].name];

const {createTown}=await import('../src/world/town.js');
const {createBusinesses}=await import('../src/world/businesses.js');
const {routeAt,groundHeight,planHeight,setWalkSurface}=await import('../src/world/layout.js');
const {COAST_BOUNDS}=await import('../src/world/island-coast.js');
const {createWalkSurface}=await import('../src/world/walk-surface.js');
const {createColliderGrid}=await import('../src/world/collider-grid.js');
const {suppliedRoomBoundsBlocked}=await import('../src/world/supplied-rooms.js');
const {SAKURA_LAYOUT}=await import('../src/world/interiors/sakura-layout.js');
const {buildIzakayaRoom}=await import('../src/world/izakaya.js');
const {OPENINGS}=await import('../src/world/openings.js');
const {QUICK_CROSSING}=await import('../src/world/ferry-quick-crossing.js');
const {AIRPORT_FERRY_PORTS}=await import('../src/world/airport-ferry.js');
const {AIRPORT_LANDING,AIRPORT_COUNTER}=await import('../src/world/airport-ground.js');
const {createFerryRun}=await import('../src/world/ferry.js');
const {createFerryWalk}=await import('../src/world/ferry-walk.js');

/** The town as the game builds it (Kitano-jima too), with every prompt it registers. */
const SITES=createBusinesses(),prompts=[];let entered=null;
const town=new THREE.Group(),scene=new THREE.Scene();scene.add(town);
const world=createTown({scene:town,sites:SITES,townMode:'peninsula',mobile:true,shadows:false,register:(o,label,fn)=>prompts.push({o,label,fn}),enter:s=>{entered=s;},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
world.kitano?.ensure?.();scene.updateMatrixWorld(true);
// The ground he walks on is the game's: the plan, lifted where a mesh is walked on (game.js walkSurface).
{const B=COAST_BOUNDS,surface=createWalkSurface({minX:B.minX-2,maxX:B.maxX+2,minZ:B.minZ-2,maxZ:B.maxZ+2,base:planHeight});surface.add(town);setWalkSurface(surface);}

/** Every way in: what calls the game's enter(site), the Enter button's doors (game.js doorNearby), the rooms only reached from inside. */
const WAYS_IN=[];
for(const p of prompts){entered=null;try{p.fn();}catch{}if(entered)WAYS_IN.push({how:`the prompt "${p.label}"`,site:entered});}
for(const s of [...SITES.filter(s=>!s.insideOnly),...(world.landmarks||[]).filter(l=>Number.isFinite(l.entryFacing))])if(s.approachPosition||s.door)WAYS_IN.push({how:`the Enter button at ${s.id}`,site:s});
for(const s of SITES.filter(s=>s.insideOnly))WAYS_IN.push({how:`inside only (${s.id})`,site:s});

const R=.28,PLAYER_RADIUS=R;
/** Builds a site's room through game.js roomShell, as the game does: its layout, its solids and its prompts. */
function buildRoom(s){
 const room=new THREE.Group(),colliders=[],labels=[],prompts=[],noop=()=>{};
 const context={...scope,THREE,Math,Number,Object,Array,Error,room,town:{visible:true},SITES,world,current:s,activeRoomLayout:null,minutes:720,elapsed:0,
  player:new THREE.Object3D(),clearRoom:noop,reg:(o,label)=>{labels.push(label);prompts.push({o,label});},roomColliders:colliders,
  roomCollider:(x,z,w,d,height=2.8,minY=0)=>{const c={x,z,w,d,height,minY};colliders.push(c);return c;},
  activities:{state:{},action:noop,save:noop,unreadPost:0,post:noop},islandPlay:null,leaveRoom:noop,crossThreshold:noop,enterRoom:noop,takeNahaBoat:noop,
  takeSakuraStair:noop,evacuateSakuraOffice:noop,sleepUntilMorning:noop,playerRecipe:()=>null,hands:{},say:noop,weatherMode:'fixed',newsOn:()=>false,
  box:(size,pos,color,parent)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial());m.position.set(...pos);parent.add(m);return m;},
  // Sakura is a live shop the game keeps (people/sakura-shop.js); its room is SAKURA_LAYOUT's, its solids that layout's.
  sakuraShop:{layout:SAKURA_LAYOUT,colliders:SAKURA_LAYOUT.colliders}};
 vm.runInNewContext(shellSource+'\nroomShell(site);',Object.assign(context,{site:s}));
 let layout=context.activeRoomLayout;
 // Minato is built as its room's props are added (game.js addRoomProps), from the same builder.
 if(!layout&&s.id==='izakaya')layout=buildIzakayaRoom({room,box:context.box,reg:context.reg,collider:context.roomCollider,action:noop,exit:noop,signTexture:()=>null});
 for(const c of layout?.colliders||[])if(!colliders.includes(c))colliders.push(c);
 room.updateMatrixWorld(true);
 return {layout,colliders,labels,prompts};
}
/** A step indoors by the game's rules (game.js roomStep): the walk's floors and stair, the room's bounds and solids. */
function roomRules(layout,colliders){
 const blocked=(x,z,r,y)=>suppliedRoomBoundsBlocked(layout,x,z,r)||colliders.some(c=>standingHitsRect(x,z,r,y,c));
 const step=(x,y,z,nx,nz)=>{
  if(!layout.walk)return {ok:!blocked(nx,nz,R,y),y};
  const m=layout.walk.move(x,y,z,nx,nz,R,(bx,by,bz)=>blocked(bx,bz,.05,by));
  return {ok:m.ok&&!blocked(nx,nz,R,m.y),y:m.y};
 };
 return {blocked,step};
}
/** How far (up to `far`) he walks from a point in a direction, a tenth of a metre at a time. */
function reach(step,[x0,y0,z0],dx,dz,far=1){
 let x=x0,y=y0,z=z0;
 for(let d=.1;d<=far+1e-9;d+=.1){const nx=x0+dx*d,nz=z0+dz*d,s=step(x,y,z,nx,nz);if(!s.ok)return d-.1;x=nx;z=nz;y=s.y;}
 return far;
}
const DIRECTIONS=[[0,-1],[1,0],[0,1],[-1,0]];
/** Every place [x, y, z] he walks to from a point inside a room (a flood over a 0.2 m grid, storeys and stairs too). */
function walked(step,[x0,y0,z0],bounds){
 const key=(x,z,y)=>`${Math.round(x*5)},${Math.round(z*5)},${Math.round(y*4)}`,seen=new Set([key(x0,z0,y0)]),cells=[[x0,y0,z0]];
 for(let i=0;i<cells.length&&cells.length<40000;i++){
  const [x,y,z]=cells[i];
  for(const [dx,dz] of [...DIRECTIONS,[1,1],[1,-1],[-1,1],[-1,-1]]){
   const nx=x+dx*.2,nz=z+dz*.2;if(nx<bounds.minX||nx>bounds.maxX||nz<bounds.minZ||nz>bounds.maxZ)continue;
   const s=step(x,y,z,nx,nz);if(!s.ok)continue;const k=key(nx,nz,s.y);if(seen.has(k))continue;seen.add(k);cells.push([nx,s.y,nz]);
  }
 }
 return cells;
}
/** The floors of a room of more than one storey he walks onto from a point. */
function floorsReached(walk,step,from,bounds){
 const floors=new Set();for(const [x,y,z] of walked(step,from,bounds)){const on=walk.floorAt(x,z,y);if(on)floors.add(on.floor.id);}
 return floors;
}
const EXIT_LABEL=/^(?:exit|leave|step outside|go out)\b/i,DOWN_LABEL=/downstairs|fire escape/i;
/**
 * Whether he walks from a point to a way out: to within 1.45 m of the room's exit point on its floor, where the Exit
 * button shows (game.js updateContextControls), or within reach of a prompt that takes him out (game.js interaction).
 */
function walksOut(layout,step,from,bounds,prompts,label){
 const exit=layout.exit,exitFloor=layout.exitFloor??0,v=new THREE.Vector3();
 const targets=prompts.filter(p=>label.test(p.label)).map(p=>p.o.getWorldPosition(v).clone());
 return walked(step,from,bounds).some(([x,y,z])=>exit&&!label.source.includes('downstairs')&&Math.hypot(x-exit[0],z-exit[2])<1.45&&(!layout.walk||Math.abs(y-exitFloor)<1)
  ||targets.some(t=>Math.hypot(x-t.x,y+1-t.y,z-t.z)<2.6));
}

/** How much floor (m²) he walks over from a point, up to 8 m² (a flood over a 0.2 m grid). */
function floorArea(step,[x0,y0,z0],bounds){
 const seen=new Set([`${Math.round(x0*5)},${Math.round(z0*5)}`]),queue=[[x0,y0,z0]];
 for(let i=0;i<queue.length&&seen.size<200;i++){const [x,y,z]=queue[i];
  for(const [dx,dz] of DIRECTIONS){const nx=x+dx*.2,nz=z+dz*.2,k=`${Math.round(nx*5)},${Math.round(nz*5)}`;if(seen.has(k)||nx<bounds.minX||nx>bounds.maxX||nz<bounds.minZ||nz>bounds.maxZ)continue;
   const s=step(x,y,z,nx,nz);if(!s.ok)continue;seen.add(k);queue.push([nx,s.y,nz]);}}
 return seen.size*.04;
}
/** Outdoors: the town's walkable ground, its fixed solids, and the step the game allows (game.js collides). */
const grid=createColliderGrid(world.colliders);
const solidOutside=(x,z,y)=>grid.some(x,z,R,c=>!c.only&&!c.moving&&standingHitsRect(x,z,R,y,c));
const outsideBlocked=(x,z)=>!routeAt(x,z,R)||solidOutside(x,z,groundHeight(x,z));
// The Minato Maru lying alongside, at Minato and at Kitano-jima, her gangway out and her ramp down: a step onto her floors,
// or into her gangway's rails, goes by her walk (ferry-walk.js), as in game.js collides; her hull is solid from the shore.
const FERRIES=['town','airport'].map(berth=>{const colliders=[],run=createFerryRun({parent:new THREE.Group(),colliders});run.parkAt(berth);run.update(1/60,600,0);const walk=createFerryWalk(run);walk.update();return {walk,hull:colliders.find(c=>c.id==='ferry')};});
const inHull=(x,z)=>FERRIES.some(({hull})=>hull&&Math.abs(x-hull.x)<hull.w/2+R&&Math.abs(z-hull.z)<hull.d/2+R);
const outsideStep=(x,y,z,nx,nz)=>{
 for(const {walk} of FERRIES){const m=walk.move(x,y,z,nx,nz,R);if(m)return {ok:m.ok,y:m.y};}
 const g=groundHeight(nx,nz);return {ok:canStepBetween(y,g)&&!outsideBlocked(nx,nz)&&!inHull(nx,nz),y:g};
};
/** Whether he walks from a point to within `near` of a target (a flood over a 0.5 m grid, `limit` cells at most). */
function walksTo([x0,z0],[tx,tz],near=3,limit=120000){
 const seen=new Set([`${Math.round(x0*2)},${Math.round(z0*2)}`]),queue=[[x0,z0]];
 for(let i=0;i<queue.length&&seen.size<limit;i++){
  const [x,z]=queue[i];if(Math.hypot(x-tx,z-tz)<near)return true;
  for(const [dx,dz] of DIRECTIONS){const nx=x+dx*.5,nz=z+dz*.5,k=`${Math.round(nx*2)},${Math.round(nz*2)}`;if(seen.has(k))continue;
   // Half-metre steps checked in tenths, so a kerb or a bollard is not stepped over.
   let ok=true;for(let t=.1;t<=.5+1e-9&&ok;t+=.1){const px=x+dx*(t-.1),pz=z+dz*(t-.1);ok=outsideStep(px,groundHeight(px,pz),pz,x+dx*t,z+dz*t).ok;}
   if(!ok)continue;seen.add(k);queue.push([nx,nz]);}
 }
 return false;
}
const minato=SITES.find(s=>s.id==='market'),STREET=[minato.exitPosition?.[0]??minato.door[0],minato.exitPosition?.[2]??minato.door[2]];
const KITANO_STREET=[AIRPORT_COUNTER[0],AIRPORT_COUNTER[1]];
const onKitano=(x,z)=>world.kitano?.near?.(x,z)??x>120;

/** Where the Exit button puts him on the street (game.js placeAtEntrance with leave). */
function streetExit(s){
 let x0,z0;
 if(s.exitPosition){x0=s.exitPosition[0];z0=s.exitPosition[2];}
 else{const d=s.door||[s.side*4,0,s.z+2.5];x0=d[0];z0=(d.length>2?d[2]:d[1])+.6;}
 const yaw=s.entryFacing!=null?s.entryFacing+Math.PI:0;
 return [x0-Math.sin(yaw)*.6,z0-Math.cos(yaw)*.6];
}

/** Each place's faults, by place: the four requirements, in words. */
function interiorFaults(s){
 const faults=[];let built;
 try{built=buildRoom(s);}catch(e){return [`the room does not build (${e.message})`];}
 const {layout,colliders,labels,prompts}=built;
 if(!layout)return ['no room is built for it'];
 const {blocked,step}=roomRules(layout,colliders),spawn=layout.spawn||[0,0,4.3],bounds=layout.bounds||{minX:-5,maxX:5,minZ:-5,maxZ:5};
 const arrivals=[['first person',[spawn[0],spawn[1]??0,spawn[2]]],['behind him',stepInside([spawn[0],spawn[1]??0,spawn[2]],layout.yaw??0,{step})]];
 for(const [view,p] of arrivals){
  const [x,y,z]=p.map(v=>+v.toFixed(3));
  if(blocked(x,z,R,y))faults.push(`${view}: arrives at ${x},${y},${z} inside a wall or a solid`);
  if(layout.walk&&!layout.walk.floorAt(x,z,y))faults.push(`${view}: arrives at ${x},${y},${z} with no floor under his feet`);
  // He can move: a metre at least one way (a doorway's mat may have walls each side), and into a room, not a cupboard.
  const ways=DIRECTIONS.filter(([dx,dz])=>reach(step,p,dx,dz)>=1-1e-6).length,area=floorArea(step,p,bounds);
  if(!ways)faults.push(`${view}: from ${x},${y},${z} he cannot walk a metre any way`);
  if(area<4)faults.push(`${view}: from ${x},${y},${z} he can walk over only ${area.toFixed(1)} m²`);
 }
 if(layout.walk){
  // Every storey of it: a floor's level is its height to the half metre (a stair's is the top it climbs to).
  const floors=floorsReached(layout.walk,step,arrivals[1][1],bounds),level=f=>Math.round(2*(typeof f.y==='number'?f.y:Array.isArray(f.y)?Math.max(...f.y):Math.max(...f.y.x)))/2;
  const reached=new Set(layout.walk.floors.filter(f=>floors.has(f.id)).map(level)),missing=[...new Set(layout.walk.floors.map(level))].filter(l=>!reached.has(l));
  if(missing.length)faults.push(`storeys he cannot walk onto: ${missing.map(l=>l+' m').join(', ')} (${layout.walk.floors.filter(f=>missing.includes(level(f))).map(f=>f.id).join(', ')})`);
 }
 // The way out, walked from where he arrives: the Exit button's spot, or a prompt that takes him out (from a room entered
 // only from inside, the way back down).
 if(!walksOut(layout,step,arrivals[1][1],bounds,prompts,s.insideOnly?DOWN_LABEL:EXIT_LABEL))faults.push(s.insideOnly?'he cannot walk to a way back down or out':'he cannot walk to the Exit button\'s spot or to a prompt that takes him out');
 if(!s.insideOnly){
  const [x,z]=streetExit(s),y=groundHeight(x,z);
  if(!routeAt(x,z,R))faults.push(`the street exit ${x.toFixed(2)},${z.toFixed(2)} is not walkable ground`);
  else if(solidOutside(x,z,y))faults.push(`the street exit ${x.toFixed(2)},${z.toFixed(2)} is inside a solid`);
  else{const ways=DIRECTIONS.filter(([dx,dz])=>reach(outsideStep,[x,y,z],dx,dz)>=1-1e-6).length;if(ways<2)faults.push(`from the street exit he can walk a metre ${ways?'only one way':'no way'}`);}
 }
 return faults;
}

test('every way in leads to a fully functional interior: it builds, he arrives on a floor clear of solids, can move, and can get out',()=>{
 const places=new Map();for(const w of WAYS_IN){const s=w.site;if(!places.has(s.id))places.set(s.id,{site:s,ways:[]});places.get(s.id).ways.push(w.how);}
 assert.ok(places.size>=25,'the town still has its doors ('+places.size+')');
 const failures=[];
 for(const {site,ways} of places.values()){const f=interiorFaults(site);if(f.length)failures.push(`${site.id} (${ways.join('; ')}):\n    ${f.join('\n    ')}`);}
 assert.deepEqual(failures,[],'\n  '+failures.join('\n  '));
});

test('the retired Nakamura home has no way in while its vacant facility notice remains accessible',()=>{
 // The owner retired the family on 31 October 2026. The retained shop-house is not a live residence, and a historical
 // home id must not recreate a door into its flat. Its physical staircase remains covered by nakamura-shop.test.mjs.
 assert.equal(WAYS_IN.some(w=>w.site.id==='home-nakamura'||w.site.homeId==='nakamura'),false);
 assert.equal(SITES.some(s=>s.id==='home-nakamura'||s.homeId==='nakamura'),false);
 assert.equal(world.landmarks.some(s=>s.id==='home-nakamura'),false);
 const facility=world.landmarks.find(s=>s.id==='nakamura');assert.ok(facility,'retain the public facility');
 assert.equal(facility.owner,null);assert.match(facility.line,/closed.*keeper.*vacant/);
 const notice=prompts.find(p=>p.label==='Read the upstairs vacancy notice');assert.ok(notice);
 entered=null;notice.fn();assert.equal(entered,null,'the vacancy notice does not enter a residence');
 const at=notice.o.getWorldPosition(new THREE.Vector3());
 assert.equal(world.colliders.some(c=>standingHitsRect(at.x,at.z,R,0,c)),false,'read the vacancy notice from clear public ground');
 // All remaining live interiors still take the step inside by the feet's own rules.
 assert.match(slice('async function enterRoom(','\nfunction leaveRoom('),/stepInside\([^;]*\{step:roomStep/);
});

/** Every point the game starts him or puts him outdoors. */
const ARRIVALS=[
 ...OPENINGS.filter(o=>Array.isArray(o.stand)).map(o=>({id:'opening '+o.id,at:o.stand})),
 ...Object.values(QUICK_CROSSING).map(q=>({id:q.id,at:q.stand})),
 ...Object.entries(AIRPORT_FERRY_PORTS).map(([k,p])=>({id:'ferry landing ('+k+')',at:p.landing})),
 {id:'Kitano-jima landing',at:AIRPORT_LANDING},{id:'Kitano-jima airport counter',at:AIRPORT_COUNTER},
];
test('every place the game starts him or puts him outdoors is walkable, clear of solids, with room to move and a way to the street',()=>{
 const failures=[];
 for(const a of ARRIVALS){
  const [x,z]=a.at,y=groundHeight(x,z),f=[];
  if(!routeAt(x,z,R))f.push('not on walkable ground');
  const inside=grid.near(x,z,R).filter(c=>!c.only&&!c.moving&&standingHitsRect(x,z,R,y,c));
  if(inside.length)f.push('inside '+inside.map(c=>c.id||'a solid').join(', '));
  if(FERRIES.some(({walk})=>walk.blocked(x,y,z,R)))f.push('inside the ferry\'s gangway or rails while she is alongside');
  if(inHull(x,z))f.push('inside her hull while she is alongside');
  // On level ground, not on a coping or a kerb's top: the ground under him varies by no more than 5 cm.
  const rim=Array.from({length:8},(_,i)=>groundHeight(x+Math.cos(i*Math.PI/4)*R,z+Math.sin(i*Math.PI/4)*R)),rise=Math.max(y,...rim)-Math.min(y,...rim);
  if(rise>.05)f.push(`on a ledge (the ground under him rises ${rise.toFixed(2)} m)`);
  const ways=DIRECTIONS.filter(([dx,dz])=>reach(outsideStep,[x,y,z],dx,dz)>=1-1e-6).length;
  if(ways<2)f.push(`can walk a metre ${ways?'only one way':'no way'}`);
  if(!f.length&&!walksTo([x,z],onKitano(x,z)?KITANO_STREET:STREET))f.push('no way on foot to the street');
  if(f.length)failures.push(`${a.id} at ${x.toFixed(2)},${z.toFixed(2)}: ${f.join('; ')}`);
 }
 assert.deepEqual(failures,[],'\n  '+failures.join('\n  '));
});
