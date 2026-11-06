import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {standingHitsRect} from '../physics.js';
import {buildJohanssonHouse,roomPoint,storeyAt,HOUSE_STOREY_FLOOR,houseFloors} from '../src/world/interiors/johansson-house-interior.js';
import {HOUSE_ROOMS,HOUSE_DOORS,HOUSE_STAIR,restoreHouseState} from '../src/world/johansson-house.js';

/** The house built as the game builds it, with its prompts and colliders collected (each given back, as game.js does). */
function build(doors=null){
 installDOM();
 const room=new THREE.Group(),anchors=[],cols=[];
 const layout=buildJohanssonHouse({room,reg:(o,label,fn)=>anchors.push({o,label,fn}),action(){},doors,collider:(x,z,w,d,height=2.8,minY=0)=>{const c={x,z,w,d,height,minY};cols.push(c);return c;}});
 room.updateMatrixWorld(true);
 return {room,layout,anchors,cols};
}
const R=.28,STEP=.1;

/**
 * Everywhere he can walk from the front door, as game.js walks a room with storeys: each step is onto a floor within
 * a step of his feet with room to stand (house-walk.js), inside the room's bounds and clear of every collider at that
 * height.
 */
function reach({layout,cols}){
 const B=layout.bounds,walk=layout.walk;
 const blocked=(x,y,z)=>x<B.minX+R||x>B.maxX-R||z<B.minZ+R||z>B.maxZ-R||cols.some(c=>standingHitsRect(x,z,R,y,c));
 const key=(i,j,y)=>i+','+j+','+Math.round(y*20);
 const [sx,sy,sz]=layout.spawn,start={i:Math.round(sx/STEP),j:Math.round(sz/STEP),y:walk.floorAt(sx,sz,sy).y};
 assert.ok(!blocked(sx,start.y,sz),'the genkan is blocked where he comes in');
 const seen=new Map([[key(start.i,start.j,start.y),start]]),queue=[start];
 while(queue.length){
  const p=queue.pop();
  for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const i=p.i+di,j=p.j+dj,m=walk.move(p.i*STEP,p.y,p.j*STEP,i*STEP,j*STEP,R,(x,y,z)=>blocked(x,y,z));
   if(!m.ok)continue;const k=key(i,j,m.y);if(seen.has(k))continue;
   const q={i,j,y:m.y};seen.set(k,q);queue.push(q);
  }
 }
 return [...seen.values()];
}
const inZone=(p,[x0,y0,x1,y1])=>{const [ax,,az]=roomPoint(x0,y1,0),[bx,,bz]=roomPoint(x1,y0,0);return p.i*STEP>ax&&p.i*STEP<bx&&p.j*STEP>az&&p.j*STEP<bz;};

test('every room on every floor is reached from the front door, up and down the stair, with the doors open', ()=>{
 const h=build(),points=reach(h);
 for(const r of HOUSE_ROOMS)r.zones.forEach((z,i)=>{
  const inside=points.filter(p=>inZone(p,z)&&Math.abs(p.y-r.floor)<.01);
  assert.ok(inside.length>15,`${r.id} ${r.name} (part ${i+1}) is not reached from the door: ${inside.length} places`);
 });
 // He gets to the top floor and the bottom one by the stair, nowhere else, and never stands outside the floors.
 assert.ok(points.some(p=>Math.abs(p.y-HOUSE_STOREY_FLOOR.L1)<.01)&&points.some(p=>Math.abs(p.y-HOUSE_STOREY_FLOOR.B1)<.01));
 assert.ok(!points.some(p=>p.y<HOUSE_STOREY_FLOOR.B1-.01||p.y>HOUSE_STOREY_FLOOR.L1+.01),'feet below the basement or over the upper floor');
 // Both landings are stood on: the stair is walked flight by flight.
 for(const l of HOUSE_STAIR.landings)assert.ok(points.some(p=>Math.abs(p.y-l.max[2])<.01),'nobody stands on the landing at '+l.max[2]);
});

test('nobody walks under the stair lower than his head, or stands in a flight', ()=>{
 const h=build(),points=reach(h),walk=h.layout.walk;
 for(const p of points){
  const x=p.i*STEP,z=p.j*STEP;
  assert.ok(walk.headroom(x,z,p.y),`no headroom at ${x.toFixed(1)}, ${p.y.toFixed(2)}, ${z.toFixed(1)}`);
 }
 // Under the basement's landing (1.3 m over the floor) nobody stands.
 const l=HOUSE_STAIR.landings.find(q=>q.level==='B1');
 assert.ok(!points.some(p=>inZone(p,[l.min[0]+.3,l.min[1]+.3,l.max[0]-.3,l.max[1]-.3])&&Math.abs(p.y-HOUSE_STOREY_FLOOR.B1)<.01),'he stands under the landing');
});

test('a sliding door shut keeps him out, and open again lets him through; its state is kept by its id', ()=>{
 const saved=new Map(),doors={get:id=>saved.get(id),set:(id,open)=>saved.set(id,open)};
 const h=build(doors),d=HOUSE_DOORS.find(q=>q.id==='D-G0-WEST-S');
 const slide=h.anchors.filter(a=>a.label==='Slide the door');
 assert.equal(slide.length,HOUSE_DOORS.filter(q=>q.leaf).length,'a prompt for each leaf');
 const living=HOUSE_ROOMS.find(r=>r.key==='g0-living');
 const reaches=()=>reach(h).some(p=>inZone(p,living.zones[0])&&Math.abs(p.y)<.01);
 assert.ok(reaches(),'the living room is reached with the door open');
 // Its prompt: the anchor in the opening.
 const p=new THREE.Vector3(),[mx,,mz]=roomPoint(d.at,(d.from+d.to)/2,0);
 const a=slide.find(q=>{q.o.getWorldPosition(p);return Math.hypot(p.x-mx,p.z-mz)<.05&&Math.abs(p.y-1.1)<.05;});
 a.fn();h.layout.doors.settle();
 assert.equal(saved.get('D-G0-WEST-S'),false);
 assert.ok(!reaches(),'the living room is reached through a shut door');
 a.fn();h.layout.doors.settle();
 assert.ok(reaches(),'the living room is not reached with the door open again');
 // Built again from the save, the door is as it was left.
 a.fn();const again=build(doors);
 assert.equal(again.layout.doors.list().find(q=>q.id==='D-G0-WEST-S').open,false);
});

test('the save keeps the doors by id and reads back only what the house has',()=>{
 assert.deepEqual(restoreHouseState({schema:2,doors:{'D-G0-WEST-S':false,'D-L1-HALL-N':true,'D-NOWHERE':false,'D-B1-EAST-S':'shut','D-G0-ENTRY-HALL':false}}),{schema:2,doors:{'D-G0-WEST-S':false,'D-L1-HALL-N':true}});
 assert.equal(restoreHouseState({schema:1,doors:{'D-G0-WEST-S':false}}),undefined,'another schema needs a migration');
 assert.equal(restoreHouseState(null),undefined);
});

test('every prompt in the house can be walked up to on its own floor', ()=>{
 const h=build(),points=reach(h),p=new THREE.Vector3();
 assert.ok(h.anchors.length>=45,'prompts: '+h.anchors.length);
 for(const a of h.anchors){
  a.o.getWorldPosition(p);
  assert.ok(a.o.userData.sameLevel,a.label+' is offered on its own floor only');
  const floor=HOUSE_STOREY_FLOOR[storeyAt(p.y-.6)];
  const near=points.some(q=>Math.abs(q.y-floor)<.3&&Math.hypot(q.i*STEP-p.x,q.j*STEP-p.z)<1.6);
  assert.ok(near,`${a.label} at ${p.toArray().map(v=>v.toFixed(2))} cannot be walked up to`);
 }
 for(const label of ['Check the post','Watch the television','Lie down on the futon','Sit at the low table','Look at the bookshelf','Look at the teaching board','Look at Thuan’s sewing machine','Run a bath','Use the toilet','Take a sauna','Look at the main switchboard','Look at the water heater','Look at the lift pump cover'])
  assert.ok(h.anchors.some(a=>a.label===label),'no prompt: '+label);
});

test('the mayor’s home keeps what the game and Studio look for by name', ()=>{
 const {room,layout}=build(),names=new Set();room.traverse(o=>{if(o.name)names.add(o.name);});
 for(const n of ['Mayor’s home','Futon','Quilt','Futon Thuan','Zabuton','Television screen','Letter box back','Envelope in the letter box','Toilet','Bath (ofuro)','Wardrobe mirror','Upper wall','House B1','House G0','House L1'])assert.ok(names.has(n),'no '+n);
 let beds=0;room.traverse(o=>{if(o.userData.bed)beds++;});assert.equal(beds,2);
 assert.equal(typeof layout.refreshPost,'function');
 const seats=[];room.traverse(o=>{if(o.userData.seat)seats.push(o.userData.seat);});
 assert.equal(seats.length,4);
 // Each cushion's seat looks at the table and he stands up behind it.
 for(const s of seats){const [x,,z]=s.position,[sx,,sz]=s.stand,fx=-Math.sin(s.yaw),fz=-Math.cos(s.yaw);assert.ok(fx*(x-sx)+fz*(z-sz)>.7,'stands up behind the cushion');}
});

test('the storeys more than one over his feet are put away, and the well shows the floor over it', ()=>{
 const {layout}=build(),g=layout.storeyGroups;
 layout.follow({x:0,y:0,z:3});assert.deepEqual([g.B1.visible,g.G0.visible,g.L1.visible],[true,true,true]);
 layout.follow({x:0,y:2.8,z:3});assert.deepEqual([g.B1.visible,g.G0.visible,g.L1.visible],[true,true,true]);
 layout.follow({x:-2,y:-2.8,z:3});assert.deepEqual([g.B1.visible,g.G0.visible,g.L1.visible],[true,true,false]);
 // The point lights shown at once stay inside the town's budget of eight (render/light-budget.js).
 for(const y of [-2.8,0,2.8]){layout.follow({x:0,y,z:0});let n=0;for(const l of Object.values(g))if(l.visible)l.traverse(o=>{if(o.isPointLight)n++;});assert.ok(n<=8,`${n} lights on at ${y}`);}
 // Every floor of the walk lies on a storey's floor, a landing or a flight.
 for(const f of houseFloors())assert.ok(Array.isArray(f.y)||Object.values(HOUSE_STOREY_FLOOR).some(y=>Math.abs(f.y-y)<.01)||/landing/.test(f.id),f.id+' at '+f.y);
});
