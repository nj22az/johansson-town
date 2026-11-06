// The fish market on the east quay (src/world/fish-market.js): the owner, 30 October 2026, "Work accordingly to your
// recommendations" (docs/research/japanese-miniature-scenes.md) and "I like the sale counter". The catch reads as fish in
// ice, every piece stands where its job is and on what it stands, the counter keeps Kōji's real hours, and nothing new
// blocks the walk, the columns, the board or the place Kōji stands to sort.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {circleHitsRect} from '../physics.js';

installDOM();globalThis.self=globalThis;
const FM=await import('../src/world/fish-market.js');
const {EAST_QUAY}=await import('../src/world/okinawa/layout.js');
const {fishAt,fishById}=await import('../src/world/okinawa/fish.js');
const {canonicalDay}=await import('../src/people/canonical-day.js');
const {NEIGHBOURS}=await import('../src/people/neighbours.js');
const {createKit}=await import('../src/world/okinawa/kit.js');
const {createTown}=await import('../src/world/town.js');
const {createIslandBusinesses}=await import('../src/world/businesses.js');
const world=createTown({scene:new THREE.Scene(),sites:createIslandBusinesses(),mobile:true,kitano:'distant',shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
world.group.updateMatrixWorld(true);

const S=EAST_QUAY.shed,B=FM.FISH_BOX;
const inShed=(r,e=1e-6)=>r.minX>=S.minX-e&&r.maxX<=S.maxX+e&&r.minZ>=S.minZ-e&&r.maxZ<=S.maxZ+e;
const rectOf=c=>({minX:c.x-c.w/2,maxX:c.x+c.w/2,minZ:c.z-c.d/2,maxZ:c.z+c.d/2});
const overlap=(a,b)=>a.minX<b.maxX-1e-6&&b.minX<a.maxX-1e-6&&a.minZ<b.maxZ-1e-6&&b.minZ<a.maxZ-1e-6;
const near=c=>c.x>S.minX-1&&c.x<S.maxX+1&&c.z>S.minZ-1&&c.z<S.maxZ+1;
const MINE=['auction-catch','auction-scale','fish-market-wash','fish-market-boots','packed-fish-boxes','fish-counter','fish-crates'];
const mine=world.colliders.filter(c=>MINE.includes(c.id)&&near(c));
const koji=NEIGHBOURS.find(n=>n.name==='Kōji');

test('the auction lays the fish nobody bid for, a kind to a box, each with the boat that landed it',()=>{
 const crated=fishAt('auction').filter(f=>f.id!=='maguro'&&f.id!=='seika').map(f=>f.id);
 assert.deepEqual(Object.keys(FM.LAID).sort(),[...crated].sort(),'every boxed kind has its laying, and only those');
 assert.equal(FM.AUCTION_LOTS.length,16,'the old grid of eighteen less the counter’s bay');
 for(const lot of FM.AUCTION_LOTS){
  assert.ok(crated.includes(lot.fish),lot.id);
  assert.equal(lot.count,FM.LAID[lot.fish].count);
  assert.ok(FM.LANDED_BY[lot.boat],lot.id+' was landed by somebody');
  const f=fishById(lot.fish),laid=FM.LAID[lot.fish],cols=Math.max(1,Math.floor((B.w-2*B.wall-.04)/(laid.length+.04)));
  assert.ok(laid.length<=B.w-2*B.wall-.04,`${f.id} fits the box lengthwise`);
  assert.ok(Math.ceil(lot.count/cols)*laid.length*laid.depth<=B.d-2*B.wall-.04+1e-9,`${f.id}: ${lot.count} lie side by side, not through each other`);
 }
 // How a fish is caught decides its boat: the reef boat for nets and the deep-drop lines, the sabani for the spear.
 for(const [id,{boat}] of Object.entries(FM.LAID)){
  const caught=fishById(id).caught;
  if(boat==='bonito')assert.match(caught,/bonito/);
  if(boat==='sabani')assert.match(caught,/spear/);
 }
});

test('the lots, the counter and Kōji’s stack share the floor without touching, and the catch’s collider covers every box',()=>{
 const lots=FM.AUCTION_LOTS.map(l=>({id:l.id,minX:l.x-B.w/2,maxX:l.x+B.w/2,minZ:l.z-B.d/2,maxZ:l.z+B.d/2}));
 const counter=FM.counterRect(),stack=FM.stackRect();
 for(const l of lots){
  assert.ok(inShed(l),l.id+' on the floor');
  assert.equal(overlap(l,counter),false,l.id+' and the counter');
  assert.equal(overlap(l,stack),false,l.id+' and Kōji’s stack');
  assert.ok(FM.catchColliders().some(c=>{const r=rectOf(c);return l.minX>=r.minX&&l.maxX<=r.maxX&&l.minZ>=r.minZ&&l.maxZ<=r.maxZ;}),l.id+' is solid');
 }
 assert.ok(inShed(counter)&&inShed(stack));
 assert.equal(overlap(counter,stack),false);
 assert.equal(FM.SORTING_STACK.y,FM.AUCTION_FLOOR,'the stack stands on the floor, not 16 cm into it');
});

test('every new solid stands inside the shed, off the columns, the board and each other',()=>{
 for(const id of MINE)assert.ok(mine.some(c=>c.id===id),id+' is built');
 const columns=world.colliders.filter(c=>c.id==='auction-column'&&near(c)).map(rectOf);
 const board=world.colliders.find(c=>c.id==='auction-price-board');
 assert.equal(columns.length,8);
 const boardRect=board.yaw?{minX:board.x-board.d/2,maxX:board.x+board.d/2,minZ:board.z-board.w/2,maxZ:board.z+board.w/2}:rectOf(board);
 for(const c of mine){
  const r=rectOf(c);
  assert.ok(inShed(r,.02),`${c.id} at ${c.x.toFixed(2)},${c.z.toFixed(2)} inside the shed`);
  for(const col of columns)assert.equal(overlap(r,col),false,`${c.id} through a column`);
  assert.equal(overlap(r,boardRect),false,`${c.id} through the board`);
 }
 const others=mine.filter(c=>c.id!=='auction-catch');
 others.forEach((a,i)=>others.slice(i+1).forEach(b=>assert.equal(overlap(rectOf(a),rectOf(b)),false,`${a.id} and ${b.id}`)));
});

test('Kōji stands to sort behind the counter, clear of everything solid',()=>{
 assert.deepEqual(koji.at,[23.4,-41.7]);
 const solid=world.colliders.filter(near).filter(c=>!(c.minY>1.9));
 for(const c of solid)assert.equal(circleHitsRect(koji.at[0],koji.at[1],.25,c),false,`Kōji stands in ${c.id}`);
});

test('the walk from the lawn gate to the ice plant, between the shed and the parapet, stays open',()=>{
 for(let x=19.4;x<=31.4;x+=.2)for(const c of mine)assert.equal(circleHitsRect(x,-39.75,.4,c),false,`${c.id} on the walk at ${x.toFixed(1)}`);
});

test('the counter keeps Kōji’s hours: 07:00 to 09:00 while he is ashore and at the auction',()=>{
 const DAY=1440;
 let open=0;
 for(let m=0;m<14*DAY;m+=10){
  if(!FM.fishCounterOpen(m))continue;open++;
  assert.equal(canonicalDay('Kōji',m)?.place,'fish-auction',`open at ${m} with Kōji at ${canonicalDay('Kōji',m)?.place}`);
 }
 assert.equal(open,7*12,'open seven mornings a fortnight, two hours each');
 assert.equal(FM.fishCounterOpen(7*60+30),true);
 assert.equal(FM.fishCounterOpen(7*DAY+7*60+30),false,'his relief week: he is the ferry’s bosun');
 assert.equal(FM.fishCounterOpen(9*60),false,'nine: he goes to the ice plant');
 assert.equal(FM.fishCounterOpen(6*60+59),false,'before the floor is washed');
});

test('the counter sells by the kilo at the morning’s auction prices, and its wares are out only while it is open',()=>{
 const board=readFileSync(new URL('../src/world/auction-board.js',import.meta.url),'utf8');
 for(const s of FM.FISH_COUNTER.sells){
  const name=fishById(s.fish).name;
  assert.ok(board.includes(`${name[0].toUpperCase()+name.slice(1)} ¥${s.kilo.toLocaleString('en-GB')}`),`${name} at the board’s price`);
  assert.ok(fishAt('auction').some(f=>f.id===s.fish),name+' comes off the auction floor');
  assert.match(s.item,/\(1 kg\)$/);
 }
 const wares=world.group.getObjectByName('Fish counter wares');
 assert.ok(wares&&wares.children.length>0);
 world.updateHours(7*60+30);assert.equal(wares.visible,true,'07:30 on a week ashore');
 world.updateHours(12*60);assert.equal(wares.visible,false,'noon');
 world.updateHours(7*1440+7*60+30);assert.equal(wares.visible,false,'his relief week');
});

test('every piece says who it is for, why it is there and where',()=>{
 assert.ok(FM.FISH_MARKET_PIECES.length>=10);
 for(const p of FM.FISH_MARKET_PIECES)for(const k of ['id','who','why','where'])assert.ok(p[k]?.length>2,`${p.id} ${k}`);
 for(const b of Object.values(FM.LANDED_BY))assert.ok(b.name&&b.why);
});

test('the market is light enough for a phone: under 56,000 vertices for the floor, the counter, the roof’s water and the quay edge',()=>{
 const kit=createKit(),group=new THREE.Group();
 FM.buildFishMarket(kit,()=>{},group);kit.finish(group);
 let vertices=0;group.traverse(o=>{if(o.isMesh)vertices+=o.geometry.attributes.position.count;});
 assert.ok(vertices<56000,`${vertices} vertices`);
});
