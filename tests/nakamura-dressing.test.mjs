import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {standingHitsRect,circleHitsRect} from '../physics.js';

/**
 * Nakamura Zenzai's makeover (the owner, 21 October 2026: "the ice cream shop looks abhorrent as it is"): every new thing
 * has its who and why, the signs are Japanese and come from the game's own names and menu, what follows the hours does,
 * and nothing new stands in anybody's way.
 */
installDOM();globalThis.self=globalThis;
const {NAKAMURA_DRESSING,NAKAMURA_LEFT_OUT,NAKAMURA_OPEN_SIGNS,NAKAMURA_TABLE,NAKAMURA_PARASOL,NAKAMURA_SHUTTER,NAKAMURA_FRAME,kanjiPrice,nakamuraFrontage,nakamuraShutterDown}=await import('../src/world/okinawa/nakamura-dressing.js');
const {NAKAMURA_MENU,BLUE_CORAL,dessertShopOpen}=await import('../src/world/blue-coral-shop.js');
const {japaneseSign}=await import('../src/world/okinawa/signs.js');
const {nakamuraPoint,NAKAMURA_GO_HOME}=await import('../src/world/nakamura-plan.js');
const {HARBOUR_PARK_PATHS,parkPathAt}=await import('../src/world/harbour-park-plan.js');

test('every new thing says who it is for, why it is there and what period it is true to',()=>{
 const ids=new Set();
 for(const d of NAKAMURA_DRESSING){
  assert.ok(!ids.has(d.id),d.id);ids.add(d.id);
  for(const key of ['who','why','period'])assert.ok(typeof d[key]==='string'&&d[key].length>=(key==='who'?3:20),`${d.id} ${key}`);
  assert.ok(['building','prop','open-hours'].includes(d.build),d.id);assert.equal(d.at.length,3,d.id);
 }
 for(const id of ['noren','lanterns','parasol','ice-flag','shutter'])assert.equal(NAKAMURA_DRESSING.find(d=>d.id===id).build,'open-hours');
 assert.deepEqual(Object.keys(NAKAMURA_OPEN_SIGNS).sort(),['flag','lanterns','noren','parasol','shutter']);
 for(const l of NAKAMURA_LEFT_OUT)assert.ok(l.suggestion&&l.why.length>20,l.suggestion);
});

test('the shop’s signs are Japanese, from the names and the menu the game already has',()=>{
 assert.equal(japaneseSign('Nakamura Zenzai'),'中村ぜんざい');
 assert.equal(japaneseSign('Zenzai'),'ぜんざい');
 assert.equal(japaneseSign('Nakamura'),'中村');
 for(const p of NAKAMURA_MENU)assert.notEqual(japaneseSign(p.item),p.item,`${p.item} has a tag`);
 assert.equal(kanjiPrice(250),'二五〇円');assert.equal(kanjiPrice(100),'一〇〇円');
 assert.deepEqual(NAKAMURA_MENU.map(p=>p.cost),[250,120,150,120,100],'the prices are the game’s');
});

test('the retained fittings keep their measured day/night states when explicitly staffed',()=>{
 const f=nakamuraFrontage({menu:NAKAMURA_MENU,hours:{...BLUE_CORAL,staffed:true}});
 const at=(minutes,open)=>{f.update(minutes,open);return {noren:f.noren.visible,parasol:f.parasol.visible,lamp:f.lanterns.emissiveIntensity,canopyMinY:f.canopy.minY};};
 assert.deepEqual(at(9*60,false),{noren:false,parasol:false,lamp:0,canopyMinY:1e3},'not yet open');
 assert.deepEqual(at(12*60,true),{noren:true,parasol:true,lamp:0,canopyMinY:NAKAMURA_PARASOL.rim},'open at noon, lanterns dark by day');
 const dusk=at(18*60+30,true);assert.equal(dusk.noren,true);assert.ok(dusk.lamp>.5,'lit at dusk while staffed');
 assert.deepEqual(at(19*60+30,false),{noren:false,parasol:false,lamp:0,canopyMinY:1e3},'closed: taken in and dark');
 // People walk under the canopy; the camera does not go through it.
 const c={...f.canopy,minY:NAKAMURA_PARASOL.rim};
 assert.equal(standingHitsRect(c.x,c.z,.3,0,c),false,'a person stands under the parasol');
 assert.ok(c.minY>1.9,'its rim is over anyone’s head');
});

test('the retained shutter rolls through clear fitted positions when explicitly staffed',()=>{
 const hours={...BLUE_CORAL,staffed:true},f=nakamuraFrontage({menu:NAKAMURA_MENU,hours});
 const at=(minutes,open=false)=>{f.update(minutes,open);return {flag:f.flag.visible,shutter:f.shutter.visible,solid:f.shutterSolid.minY===0};};
 assert.deepEqual(at(9*60),{flag:false,shutter:true,solid:true},'before ten: shut');
 assert.deepEqual(at(12*60,true),{flag:true,shutter:false,solid:false},'noon: open');
 assert.deepEqual(at(18*60+40,true),{flag:true,shutter:false,solid:false},'twenty to seven: still serving');
 assert.deepEqual(at(20*60+30),{flag:false,shutter:true,solid:true},'half past eight: shut');
 assert.deepEqual(at(2*60),{flag:false,shutter:true,solid:true},'the small hours: shut');
 // Shut, the shutter runs from the floor into the wall over its box.
 at(23*60);const box=new THREE.Box3().setFromObject(f.shutter);
 assert.ok(box.min.y<.08&&box.max.y>NAKAMURA_FRAME.ground,'from the floor into the wall over the box: no slot of lit ceiling over it');
 // It rolls, it does not pop: half-way through the roll it is half-way down, and it starts once she is out.
 const {open,close}=BLUE_CORAL,{roll,after}=NAKAMURA_SHUTTER;
 assert.equal(nakamuraShutterDown(open,hours),1);assert.ok(Math.abs(nakamuraShutterDown(open+roll/2,hours)-.5)<1e-9);assert.equal(nakamuraShutterDown(open+roll,hours),0);
 assert.equal(nakamuraShutterDown(close+after*.99,hours),0,'the exit delay is retained');
 assert.ok(Math.abs(nakamuraShutterDown(close+after+roll/2,hours)-.5)<1e-9);assert.equal(nakamuraShutterDown(close+after+roll,hours),1);
 let last=1;for(let m=open;m<=open+roll;m+=roll/20){const d=nakamuraShutterDown(m,hours);assert.ok(d<=last+1e-12);last=d;}
 assert.ok(roll*60/4>=1&&roll*60<=15,'one to fifteen seconds at the town clock’s speeds');
 // Up, it is hidden inside the box and the wall over it: its foot is above the box's underside.
 f.update(close+after+roll*.001,false);assert.ok(new THREE.Box3().setFromObject(f.shutter).min.y>2.85,'barely started: still in the box');
 // It runs 15 cm behind the piers' faces, not in the opening's plane.
 assert.ok(Math.abs(f.shutter.position.z-(NAKAMURA_FRAME.D-.15))<1e-9);
});

test('the vacant facility stays visibly closed and refuses orders at every hour',async()=>{
 const {buildBlueCoralShop}=await import('../src/world/blue-coral-shop.js');
 const regs=[],actions=[],world={group:new THREE.Group()};
 const shop=buildBlueCoralShop({world,register:(o,label,fn)=>regs.push({label,fn}),onAction:(...a)=>actions.push(a)});
 assert.ok(world.colliders.some(c=>c.id==='nakamura-shutter'));
 assert.equal(BLUE_CORAL.staffed,false);assert.equal(BLUE_CORAL.owner,null);assert.equal(BLUE_CORAL.status,'vacant');
 for(let minutes=0;minutes<1440;minutes+=15){
  shop.update(minutes);regs.find(r=>r.label==='Read the dessert counter notice').fn();
  assert.equal(shop.isOpen(),false);assert.equal(dessertShopOpen(minutes),false);
  assert.equal(actions.at(-1)[0],'read');assert.match(actions.at(-1)[1],/closed/);assert.match(actions.at(-1)[2],/vacant/);
  assert.equal(shop.frontage.shutter.visible,true);assert.equal(shop.frontage.shutterSolid.minY,0);
  for(const thing of ['noren','flag','parasol'])assert.equal(shop.frontage[thing].visible,false);
 }
 shop.frontage.update(720,true);assert.equal(shop.frontage.flag.visible,false,'a stale open flag cannot reopen an unstaffed shop');
 assert.equal(world.landmarks.some(p=>p.id==='home-nakamura'),false,'no occupied residence doorway');
});

test('the parasol table is at the dessert bench’s shop end, and the bench is still free to sit at',()=>{
 const [x,,z]=nakamuraPoint(...NAKAMURA_TABLE);
 assert.ok(Math.abs(x-7.3)<.01&&Math.abs(z+16.25)<.01,'world 7.3, -16.25');
 const bench={x:7.3,z:-17.6,w:.44,d:1.4};
 assert.ok(z-.28>bench.z+bench.d/2+.3,'a clear gap between table and bench');
});

test('nothing new stands in a route, a prompt, the family’s way home or a park path',async()=>{
 const {createTown}=await import('../src/world/town.js');
 const {createIslandBusinesses}=await import('../src/world/businesses.js');
 const prompts=[],actions=[],world=createTown({scene:new THREE.Scene(),sites:createIslandBusinesses(),mobile:true,shadows:false,kitano:'distant',register:(o,label,fn)=>prompts.push({o,label,fn}),enter(){},onAction:(...a)=>actions.push(a),getPlayerPosition:()=>new THREE.Vector3()});
 const mine=world.colliders.filter(c=>/^nakamura-(planter|crates|hibiscus|back-step|gas|bench-table)$/.test(c.id));
 assert.equal(mine.length,6);
 for(const v of NAKAMURA_GO_HOME)assert.equal(mine.some(c=>standingHitsRect(v[0],v[2],.30,v[1],c)),false,'way home '+v);
 for(const p of prompts){const v=p.o.getWorldPosition(new THREE.Vector3());if(Math.hypot(v.x-9.5,v.z+12)>14)continue;
  assert.equal(mine.some(c=>standingHitsRect(v.x,v.z,.30,0,c)),false,p.label);}
 // The bench's own stand point (quarters.js) and the park's paths.
 assert.equal(mine.some(c=>standingHitsRect(6.5,-17.6,.30,0,c)),false,'the bench stand point');
 for(const c of mine)for(const [dx,dz] of [[0,0],[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]]){
  const x=c.x+dx*c.w,z=c.z+dz*c.d;assert.equal(parkPathAt(x,z),null,`${c.id} on ${parkPathAt(x,z)?.id}`);
 }
 assert.ok(HARBOUR_PARK_PATHS.length>0);
 // The street's own: the pavement in front of the counter stays clear (tests/nakamura-display.test.mjs's sweep line).
 for(let z=-12;z<=-8.5;z+=.1)assert.equal(mine.some(c=>circleHitsRect(4.5,z,.28,c)),false,'pavement '+z.toFixed(1));
 // The canopy is a camera-only collider while the parasol is up.
 assert.ok(world.colliders.some(c=>c.id==='nakamura-parasol-canopy'));
 // Vacant: the shutter blocks the closed counter at noon as well as at night.
 assert.equal(world.colliders.find(c=>c.id==='nakamura-shutter').minY,0);
 // After hours the bench is still a seat, and the shutter does not stand in its way.
 world.blueCoral.update(20*60+30);prompts.find(p=>p.label==='Sit beside Nakamura with your dessert').fn();assert.equal(actions.at(-1)[0],'seat');
 assert.equal(standingHitsRect(6.5,-17.6,.30,0,world.colliders.find(c=>c.id==='nakamura-shutter')),false);
});
