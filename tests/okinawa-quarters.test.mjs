import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {circleHitsRect} from '../physics.js';
import {GATEBALL_ACTIVE,EAST_BACK} from '../src/world/okinawa/layout.js';
import {homeNameplate,householdAtHome} from '../src/people/island-households.js';

async function town(){
 installDOM();globalThis.self=globalThis;

 const {createTown}=await import('../src/world/town.js?okinawa');
 const {createBusinesses}=await import('../src/world/businesses.js');
 const labels=[],actions=[];
 const world=createTown({scene:new THREE.Scene(),sites:createBusinesses().filter(s=>['market','frontrow'].includes(s.id)),
  mobile:false,shadows:false,register:(o,label,fn)=>labels.push({label,fn,o}),enter(){},onAction:(...a)=>actions.push(a),getPlayerPosition:()=>new THREE.Vector3()});
 return {world,labels,actions};
}

test('the bare ground west of the yard is a quarter you can walk into, through the lanes',async()=>{
 const {world}=await town();
 const {routeAt}=await import('../src/world/layout.js');
 const {NISHI}=await import('../src/world/okinawa/layout.js');
 const {WEST_YARD}=await import('../src/world/west-yard.js');
 const open=(x,z)=>!!routeAt(x,z,.32)&&!world.colliders.some(c=>circleHitsRect(x,z,.32,c));
 // Each lane crosses the yard wall: open ground on both sides of it and in the gap.
 for(const lane of NISHI.lanes)for(const x of [WEST_YARD.minX-2,WEST_YARD.minX-.25,WEST_YARD.minX+1.5])
  assert.ok(open(x,lane.z),`Lane at z=${lane.z} is blocked at x=${x}`);
 // Between the lanes the wall still stands.
 assert.ok(open(WEST_YARD.minX-.25,(NISHI.lanes[0].z+NISHI.lanes[1].z)/2),'The internal dividing wall must stay removed');
 // The seawall walk runs the length of the quarter.
 for(let z=NISHI.quay.maxZ+2;z<NISHI.maxZ-1;z+=3)assert.ok(open(-37.6,z)||open(-37.2,z),'The seawall walk is blocked at z='+z);
 // and there is no seawall to walk through or off.
 assert.ok(!routeAt(-40.2,0,.32),'You can walk off the seawall into the sea');
});

test('Main Street has buildings on both kerbs, and the shops do things',async()=>{
 const {world,labels,actions}=await town();
 const {EAST_ROW,YARD_ROW}=await import('../src/world/okinawa/layout.js');
 const {MAIN_ROAD}=await import('../src/world/main-road.js');
 // A shop-house stands on every plot of both rows: its back at the plot's middle line, three quarters of the way back
 // (Higa Liquor and the coin laundry are rooms you walk into, so their bodies start further back than the others').
 for(const plot of [...EAST_ROW.plots.map(p=>({...p,x:EAST_ROW.minX+(EAST_ROW.maxX-EAST_ROW.minX)*.8})),...YARD_ROW.plots.map(p=>({...p,x:YARD_ROW.maxX-(YARD_ROW.maxX-YARD_ROW.minX)*.8}))])
  assert.ok(world.colliders.some(c=>c.id==='shop-house'&&circleHitsRect(plot.x,(plot.minZ+plot.maxZ)/2,.2,c)),'No building on '+plot.id);
 // None of them stands on the pavements.
 for(const c of world.colliders.filter(c=>c.id==='shop-house'))
  assert.ok(c.x-c.w/2>=MAIN_ROAD.pavementEast-.01||c.x+c.w/2<=MAIN_ROAD.pavementWest+.01,'A shop-house is on the pavement at '+c.x);
 const zenzai=labels.find(l=>l.label==='Order at Nakamura · zenzai & ice cream');
 assert.ok(zenzai,'Nakamura’s sells no zenzai');
 zenzai.fn();
 assert.deepEqual(actions.at(-1).slice(0,1),['dessert-menu']);
 assert.equal(actions.at(-1)[2][0].item,'Zenzai');
 const higa=homeNameplate('higa'),higaPlate=labels.find(l=>l.label===higa.address+' · '+higa.owners);
 assert.ok(higaPlate,'The Higa gate names its address and actual household');
 higaPlate.fn();
 assert.equal(actions.at(-1)[0],'read');assert.equal(actions.at(-1)[1],higa.title);
 for(const name of householdAtHome('higa').residents)assert.ok(actions.at(-1)[2].includes(name),'The Higa nameplate identifies '+name);
 assert.match(actions.at(-1)[2],/Nishi-machi/);
 for(const id of ['kamiya','tamaki']){
  assert.equal(householdAtHome(id).status,'retired','The removed empty plot is not an active home');
  assert.equal(EAST_BACK.plots.some(p=>p.id===id),false,'The park no longer builds the empty '+id+' house');
  assert.equal(labels.some(l=>new RegExp('Read the '+id+' nameplate','i').test(l.label)),false,'No prompt leads to the removed '+id+' house');
 }
 for(const label of ['Pray at the utaki','Inspect the auction shed','Inspect the ice plant','Fish from the seawall',
  'Look at the ice-cream mural','Browse the ¥100 cart','Read the tide board','Look at the goya trellis',...(GATEBALL_ACTIVE?['Watch the gateball']:[])])
  assert.ok(labels.some(l=>l.label===label),'Nothing to '+label);
});

test('the new streets are batched into a handful of meshes and light up at night',async()=>{
 const {world}=await town();
 const q=world.quarters;
 const merged=q.meshes.filter(m=>!/sign|nameplate|fascia|upright|flag|poster|prices/.test(m.name));
 // 80 before Kitahama; the new lane, its five houses and the cane field add their own cells,
 // and the residential quarter west of it (seven houses, the flats, the park) about twenty more.
 // Fumoto at the foot of Mount Aoba (four houses, the co-op store, the square, its pole
 // line) adds its own cells.
 assert.ok(merged.length<160,'The quarters are '+merged.length+' draw calls');
 let triangles=0;for(const m of q.meshes)triangles+=m.geometry.attributes.position.count/3;
 // 120k before Kitahama and the detailed distribution poles; the residential quarter's
 // seven walled houses, flats and park add about 45k.
 // Fumoto's four walled houses, store, square, windbreak and seven poles add about 40k.
 assert.ok(triangles<240000,'The quarters are '+Math.round(triangles)+' triangles');
 world.updateHours(13*60);
 const day=q.materials.glow.emissiveIntensity;
 world.updateHours(21*60);
 assert.ok(q.materials.glow.emissiveIntensity>day+.3,'The windows do not light up after dark');
});

test('Thuan has something to say about the island sweets',async()=>{
 const {giftReaction}=await import('../src/people/thuan-gifts.js');
 const {itemIcon}=await import('../src/ui/icons.js');
 for(const item of ['Zenzai','Sata andagi','Awamori miniature']){
  const reply=giftReaction(item);
  assert.ok(/[。！？…]|\n/.test(reply.text)&&!/Nobody brings the shopkeeper/.test(reply.text),'Thuan has no reply for '+item);
 }
 assert.equal(itemIcon('Zenzai'),'ice');assert.equal(itemIcon('Sata andagi'),'food');assert.equal(itemIcon('Awamori miniature'),'cup');
});

test('the neighbours can be walked up to, and the walkers keep to the ground',async()=>{
 const {world}=await town();
 const {routeAt}=await import('../src/world/layout.js');
 const {NEIGHBOURS,routePoint,neighbourAwake}=await import('../src/people/neighbours.js');
 const open=(x,z)=>!!routeAt(x,z,.32)&&!world.colliders.some(c=>circleHitsRect(x,z,.32,c));
 for(const n of NEIGHBOURS){
  assert.ok(n.lines.length>0&&n.hours.length>0,n.name+' has nothing to say or no hours');
  if(n.walk){
   const total=routePoint(n.route,0).total;
   for(let d=0;d<total;d+=.5){const p=routePoint(n.route,d);assert.ok(open(p.x,p.z),`${n.name} walks through something at ${p.x.toFixed(1)},${p.z.toFixed(1)}`);}
  }else{
   // Somewhere within talking distance where the player can stand.
   let near=false;
   for(let a=0;a<Math.PI*2&&!near;a+=Math.PI/12)for(const r of [1,1.5,2,2.5,3])if(open(n.at[0]+Math.cos(a)*r,n.at[1]+Math.sin(a)*r)){near=true;break;}
   assert.ok(near,'Nobody can get near enough to talk to '+n.name);
  }
 }
 assert.equal(new Set(NEIGHBOURS.map(n=>n.name)).size,NEIGHBOURS.length,'Two neighbours share a name');
 // Every neighbour keeps the cast's canonical day (neighbours.js builds NEIGHBOURS from cast.js): Grandmother Higa is
 // behind Kissa Higa's counter at nine on a weekday (commerce/kissa-higa.js, 30 October 2026) and on her verandah at nine
 // on a Sunday, at the bath's bandai from ten, and asleep at home at eleven at night; `hours` no longer hides a canonical
 // neighbour. Town day 0 (1 January 1970) is a Thursday, day 3 a Sunday.
 const {canonicalDay}=await import('../src/people/canonical-day.js');
 const higa=NEIGHBOURS.find(n=>n.name==='Grandmother Higa');assert.ok(higa.canonical);
 assert.ok(neighbourAwake(higa,9*60),'Grandmother Higa is about at nine');
 assert.equal(canonicalDay('Grandmother Higa',9*60).place,'kissa-higa','Grandmother Higa is behind Kissa Higa’s counter at nine on a Thursday');
 assert.equal(canonicalDay('Grandmother Higa',3*1440+9*60).place,'home','and on her verandah at nine on a Sunday');
 assert.equal(canonicalDay('Grandmother Higa',10*60+30).place,'onsen','and at the bandai from the bath’s opening');
 const night=canonicalDay('Grandmother Higa',23*60);assert.equal(night.place,'home');assert.equal(night.rest,'sleep','Grandmother Higa is asleep at home at eleven');
});

test('Sakura’s shutter follows the rota: up through the day, down once the shop is shut (sakura-rota.js)',async()=>{
 const {world}=await town();
 const shutter=world.quarters.shutter;
 for(const h of[10,20.25]){for(let i=0;i<400;i++)shutter.update(h*60,1/30);assert.equal(shutter.open,1,'The shutter is down at '+h+':00');}
 for(const h of[3,21,23.5]){for(let i=0;i<400;i++)shutter.update(h*60,1/30);assert.equal(shutter.open,0,'The shutter is up at '+h+':00');}
});

test('visual fixtures can snap the shutter without changing normal interpolation',async()=>{
 const {world}=await town(),shutter=world.quarters.shutter;
 const curtain=world.group.getObjectByName('Sakura roller shutter');
 shutter.update(12*60,0,{snap:true});assert.equal(shutter.open,1);assert.equal(curtain.visible,false);
 // A fixture can still force the curtain down (a photograph of the slats); ordinary updates then roll it back up at the usual rate.
 shutter.set(0);
 shutter.update(12*60,.5);assert.ok(Math.abs(shutter.open-.2)<1e-9,'Ordinary animation retains its elapsed-time rate');
 shutter.update(12*60,.5);assert.ok(shutter.open>0&&shutter.open<1,'Ordinary updates animate rather than jump');
});
