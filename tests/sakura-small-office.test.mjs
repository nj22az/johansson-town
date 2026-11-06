// Sakura's small office beside the till (sakura-small-office.js, sakura-small-office-build.js; the owner, 20 October 2026:
// "This could probably fix the tiny office next to the till in Sakura"). Everything in it is data with an owner, a
// reason and a period; its facts come from the town's own data; it keeps clear of the door, the till and the clerk; on
// Linux the lamp, the fridge, the TV and the chair work, on the web they are display pieces that read.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {SAKURA_SMALL_OFFICE,SMALL_OFFICE_ITEMS,SMALL_OFFICE_ITEM,SMALL_OFFICE_NOTES,SMALL_OFFICE_CALENDAR,SMALL_OFFICE_ROTA,SMALL_OFFICE_COLLIDERS,
 SMALL_OFFICE_FRIDGE,SMALL_OFFICE_CHANNELS,SMALL_OFFICE_SOCKET,socketLoad} from '../src/world/interiors/sakura-small-office.js';
import {OFFICE_DOOR} from '../src/world/interiors/sakura-life.js';
import {SAKURA_LAYOUT} from '../src/world/interiors/sakura-layout.js';
import {SAKURA_CLERK_POINT,SAKURA_CLERK_APPROACH,SAKURA_QUEUE} from '../src/world/interiors/sakura-queue.js';
import {ACCOUNTS} from '../src/commerce/merchandising.js';
import {HARBOUR_LINE} from '../src/people/commuter-schedule.js';
import {sakuraPaperwork} from '../src/commerce/paperwork.js';
import {TRADE_ROUND} from '../src/commerce/trade-round.js';
import {SAKURA_HOURS_TEXT,sakuraClerkAt} from '../src/commerce/sakura-rota.js';
import {CORE,SUPPORTING} from '../src/people/roster.js';
import {BUDGETS} from '../src/edition.js';
import {PRODUCT_BY_ID} from '../src/commerce/products-data.js';

const R=SAKURA_SMALL_OFFICE.room,inRoom=(x,z,m=0)=>x>=R.minX+m&&x<=R.maxX-m&&z>=R.minZ+m&&z<=R.maxZ-m;

test('every thing in the small office has an owner, a reason and a period, in English',()=>{
 assert.ok(SMALL_OFFICE_ITEMS.length>=18);
 for(const i of SMALL_OFFICE_ITEMS){
  assert.ok(i.owner&&i.why.length>40&&i.period.length>10,i.id);
  assert.doesNotMatch(i.why+i.period+i.name,/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u,i.id+' reads in English; Japanese only on its label');
 }
 for(const id of ['desk','ledger','lamp','fridge','tv','chair','clock','corkboard','calendar','rota','switch','rug','fairy'])assert.ok(SMALL_OFFICE_ITEM[id],'the office has its '+id);
 for(const id of ['desk','ledger','lamp','fridge','clock','corkboard','calendar','rota','switch'])assert.ok(SMALL_OFFICE_ITEM[id].jp,id+' carries the label the real thing had');
 // Thuan owns the shop; the console is Riku's, for the weekends his mother keeps the counter.
 assert.equal(SMALL_OFFICE_ITEM.desk.owner,'Thuan');assert.equal(SMALL_OFFICE_ITEM.console.owner,'Riku');
});

test('it fits the real small office: inside its walls, out of the door’s swing, sized from New Yokosuka',()=>{
 assert.deepEqual([R.door.hingeX,R.door.z,R.door.width],[OFFICE_DOOR.hingeX,OFFICE_DOOR.z,OFFICE_DOOR.width],'the same door as the shop’s');
 const S=SAKURA_SMALL_OFFICE.swing;
 const face={back:['z',R.minZ],front:['z',R.maxZ],west:['x',R.minX],east:['x',R.maxX]};
 for(const i of SMALL_OFFICE_ITEMS.filter(i=>i.wall)){
  const [axis,at]=face[i.wall],k=axis==='x'?0:2;assert.ok(Math.abs(i.at[k]-at)<1e-9,i.id+' hangs on the '+i.wall+' wall');
  const along=axis==='x'?[i.at[2],i.size[2]]:[i.at[0],i.size[0]],[lo,hi]=axis==='x'?[R.minZ,R.maxZ]:[R.minX,R.maxX];
  assert.ok(along[0]-along[1]/2>=lo&&along[0]+along[1]/2<=hi,i.id+' stays on its wall');assert.ok(i.at[1]+i.size[1]/2<R.ceiling,i.id+' under the ceiling');
 }
 for(const i of SMALL_OFFICE_ITEMS.filter(i=>!i.wall)){
  const [x,y,z]=i.at,[w,h,d]=i.size,yaw=i.yaw||0,hx=Math.abs(Math.cos(yaw))*w/2+Math.abs(Math.sin(yaw))*d/2,hz=Math.abs(Math.sin(yaw))*w/2+Math.abs(Math.cos(yaw))*d/2;
  for(const [cx,cz] of [[x-hx,z-hz],[x+hx,z-hz],[x-hx,z+hz],[x+hx,z+hz]]){
   assert.ok(inRoom(cx,cz,-.001),i.id+' stands inside the office walls: '+[cx,cz]);
   if(y<OFFICE_DOOR.height)assert.ok(Math.hypot(cx-S.x,cz-S.z)>S.radius||y>OFFICE_DOOR.height,i.id+' is out of the door’s swing');
  }
 }
 assert.equal(SMALL_OFFICE_ITEM.chair.seat,.42,'New Yokosuka’s chair seat');
 assert.equal(SMALL_OFFICE_ITEM.clock.size[0]>=.26,true,'its wall clock’s 0.26 m dial, with the ears');
 assert.ok(SMALL_OFFICE_ITEM.switch.at[0]>R.door.to,'the switch is on the latch side, by the door');
});

test('its colliders are the shop’s, clear of the till, the clerk’s stand point and the queue',()=>{
 const has=c=>SAKURA_LAYOUT.colliders.some(r=>Math.abs(r.x-c.x)<1e-9&&Math.abs(r.z-c.z)<1e-9&&r.w===c.w&&r.d===c.d);
 for(const c of SMALL_OFFICE_COLLIDERS){
  assert.ok(has(c),c.id+' is a collider of the shop');
  assert.ok(inRoom(c.x-c.w/2,c.z-c.d/2,-.001)&&inRoom(c.x+c.w/2,c.z+c.d/2,-.001),c.id+' inside the office');
  for(const p of [SAKURA_CLERK_POINT,SAKURA_CLERK_APPROACH,...SAKURA_QUEUE.map(q=>[q.x,0,q.z])])
   assert.ok(Math.abs(p[0]-c.x)>c.w/2+.4||Math.abs(p[2]-c.z)>c.d/2+.4,c.id+' keeps clear of '+p);
 }
 // The old desk and fridge colliders are gone with them: nothing left standing in the doorway.
 assert.ok(!SAKURA_LAYOUT.colliders.some(r=>r.x===6.4&&r.z===-2.7),'the old desk’s collider is gone');
 // A way in: the floor from the door to the cork board and the desk's front stays open.
 const blocked=(x,z)=>SAKURA_LAYOUT.colliders.some(r=>Math.abs(x-r.x)<r.w/2+.25&&Math.abs(z-r.z)<r.d/2+.25);
 for(const [x,z] of [[5.7,-1.5],[5.7,-2.4],[5.2,-2.6],[6.0,-2.6]])assert.ok(!blocked(x,z),'open floor at '+[x,z]);
});

test('the notes, the calendar and the rota say what the town’s data says',()=>{
 const coral=ACCOUNTS.sakura['coral-bay-bar'],note=id=>SMALL_OFFICE_NOTES.find(n=>n.id===id).text;
 assert.deepEqual(coral.lines,['orange','water']);assert.match(coral.delivery,/morning car ferry/);
 assert.match(note('boat'),/8:30 boat/);assert.ok(HARBOUR_LINE.includes(510),'the 08:30 boat');
 assert.match(note('boat'),/mandarin juice, water/);
 // The drink round, Sakura Trading's since Higa Liquor closed (22 October 2026): Kōji loads at the depot at 10:30 on
 // Tuesdays and Fridays (trade-round.js).
 assert.equal(sakuraPaperwork().some(p=>p.id==='higa-invoice'),false,'no Higa Liquor invoice any more');
 assert.deepEqual(TRADE_ROUND.days,[2,5]);assert.equal(TRADE_ROUND.start,630);assert.equal(TRADE_ROUND.load.place,'warehouse');
 assert.match(note('round'),/^Tue · Fri 10:30: Kōji’s round at the depot/);
 assert.match(note('eisa'),/Eisa poster/);
 const riku=[...CORE,...SUPPORTING].find(p=>p.id==='riku');assert.ok(riku&&riku.age<12,'Riku is a boy at school');
 // October 1997: the first was a Wednesday; the round's marks are every Tuesday and Friday, the closed marks Saturdays.
 assert.equal(new Date(1997,9,1).getDay(),SMALL_OFFICE_CALENDAR.firstWeekday);
 const roundDays=SMALL_OFFICE_CALENDAR.marks.filter(m=>m.text==='round').map(m=>m.day);
 assert.deepEqual(roundDays,Array.from({length:31},(_,i)=>i+1).filter(d=>TRADE_ROUND.days.includes(new Date(1997,9,d).getDay())),'every round day, and only those');
 assert.equal(SMALL_OFFICE_CALENDAR.marks.some(m=>m.text==='Higa'),false);
 for(const m of SMALL_OFFICE_CALENDAR.marks.filter(m=>m.text==='closed'))assert.equal(new Date(1997,9,m.day).getDay(),6,m.day+' is a Saturday');
 // The rota: the shop's own, day by day (a week of October 1997 in town minutes: 13 October was a Monday).
 assert.deepEqual(SMALL_OFFICE_ROTA.map(r=>r.who),['Thuan','Thuan','Thuan','Thuan','Thuan','closed','Nhung']);
 assert.ok(SMALL_OFFICE_ROTA.filter(r=>r.who!=='closed').every(r=>r.hours===SAKURA_HOURS_TEXT&&r.hours==='9:00–20:30'));
 assert.ok(['Thuan','Nhung'].includes(sakuraClerkAt(600)));
});

test('the fridge holds Thuan’s own drinks and lunch, from the shop’s lines; the socket is not overloaded',()=>{
 for(const f of SMALL_OFFICE_FRIDGE)if(f.id!=='bento')assert.ok(PRODUCT_BY_ID[f.id],f.id+' is one of the shop’s lines');
 assert.ok(SMALL_OFFICE_FRIDGE.some(f=>f.id==='soda'),'ramune');
 assert.ok(socketLoad()>0&&socketLoad()<=SMALL_OFFICE_SOCKET.amps*SMALL_OFFICE_SOCKET.volts,'within the 15 A double socket: '+socketLoad()+' W');
 assert.deepEqual(SMALL_OFFICE_CHANNELS.map(c=>c.id),['ferry','weather','game']);
});

async function build(edition){
 installDOM();
 const {buildSakuraSmallOffice,ferryBoardLines}=await import('../src/world/interiors/sakura-small-office-build.js');
 const room=new THREE.Group(),prompts=new Map(),actions=[];
 const anchor=(at,label,fn)=>{const o=new THREE.Object3D();o.position.set(...at);room.add(o);o.userData.hit={label,fn};prompts.set(label,o);return o;};
 const office=buildSakuraSmallOffice(room,{anchor,action:(...a)=>actions.push(a),budget:BUDGETS[edition]});
 return {room,office,prompts,actions,ferryBoardLines};
}
const visibleDraws=group=>{let n=0;group.traverse(o=>{if(!o.isMesh)return;for(let a=o;a;a=a.parent)if(!a.visible)return;n++;});return n;};

test('Linux: the lamp switches, the fridge opens on its contents, the TV changes channel, the chair spins home',async()=>{
 const {room,office,prompts,actions}=await build('linux');
 assert.equal(office.edition,'linux');
 const press=label=>{const o=prompts.get(label);assert.ok(o,'prompt '+label+' in '+[...prompts.keys()]);o.userData.hit.fn();return o;};
 press('Read Sakura sales ledger');assert.deepEqual(actions.at(-1),['shop-ledger']);
 const pool=room.getObjectByName('Sakura desk lamp pool');assert.equal(pool.visible,true);
 const lamp=press('Switch off the desk lamp');assert.equal(pool.visible,false);assert.equal(lamp.userData.hit.label,'Switch on the desk lamp');
 const contents=room.getObjectByName('Sakura office fridge contents'),door=room.getObjectByName('Sakura office fridge door');
 assert.equal(contents.visible,false,'nothing behind a shut door is drawn');
 const fridge=press('Open the mini fridge');for(let i=0;i<60;i++)office.tick(i/60,600,1/60);
 assert.ok(door.rotation.y<-1.2&&contents.visible,'the door swings open on the drinks and the lunch box');assert.equal(fridge.userData.hit.label,'Close the mini fridge');
 const leaf=new THREE.Box3().setFromObject(door);assert.ok(leaf.min.x>SAKURA_SMALL_OFFICE.room.minX-.005,'the open door stays off the west wall');
 fridge.userData.hit.fn();for(let i=0;i<60;i++)office.tick(1+i/60,600,1/60);assert.equal(door.rotation.y,0);assert.equal(contents.visible,false);
 assert.equal(office.state.channel,'ferry');press('Change the TV channel');assert.equal(office.state.channel,'weather');press('Change the TV channel');assert.equal(office.state.channel,'game');press('Change the TV channel');assert.equal(office.state.channel,'ferry');
 const seat=room.getObjectByName('Sakura office chair seat'),rest=seat.rotation.y;press('Spin the swivel chair');
 office.tick(2,600,.4);assert.notEqual(seat.rotation.y,rest,'it turns');for(let i=0;i<10;i++)office.tick(2.5+i*.4,600,.4);assert.equal(seat.rotation.y,rest,'and comes to rest facing the desk');
 // The clock keeps the town's time: 15:00 puts the hour hand a quarter turn clockwise.
 office.tick(5,900,1/60);const hands=room.getObjectByName('Sakura cat clock hands');assert.ok(Math.abs(hands.children[0].rotation.z+Math.PI/2)<1e-9);
 // The shop shuts at 20:30 and Thuan switches it all off; it is on again at the next opening.
 office.setHours(21*60);assert.equal(office.state.lamp,false);assert.equal(office.state.tv,false);assert.equal(pool.visible,false);
 office.setHours(9*60+30);assert.equal(office.state.lamp,true);assert.equal(office.state.tv,true);
 office.dispose();
});

test('the web: the same room drawn, each thing a display piece whose prompt reads; the ledger opens the fixed papers',async()=>{
 const {room,office,prompts,actions}=await build('web');
 assert.equal(office.edition,'web');
 for(const label of ['Switch off the desk lamp','Open the mini fridge','Change the TV channel','Spin the swivel chair'])assert.ok(!prompts.has(label),label+' is Linux’s');
 for(const label of ['Look at the desk lamp','Look at the mini fridge','Look at the small TV','Look at the swivel chair','Read the cork board','Look at the calendar','Read the staff rota','Look at the cat clock','Look at the light switch']){
  prompts.get(label).userData.hit.fn();const [kind,title,text]=actions.at(-1);assert.equal(kind,'inspect');assert.ok(title&&text.length>60,label);
 }
 assert.match(actions.find(a=>a[1]==='Mini fridge')[2],/AOZORA ramune/);assert.match(actions.find(a=>a[1]==='Small TV')[2],/08:30, 14:30, 22:00/);
 prompts.get('Read Sakura sales ledger').userData.hit.fn();assert.deepEqual(actions.at(-1),['shop-ledger'],'activities.js shows the web’s October 1997 folder');
 assert.equal(office.state.fridge,false);assert.equal(room.getObjectByName('Sakura office fridge contents').visible,false);
 // Drawn exactly as on Linux, and cheaply: what is fixed is merged.
 const group=room.getObjectByName('Sakura small office');assert.ok(visibleDraws(group)<=14,visibleDraws(group)+' draws');
 for(const name of ['Sakura office fridge door','Sakura office chair seat','Sakura desk lamp bulb','Sakura office TV screen','Sakura cat clock hands','Sakura fairy lights circuit A','Sakura fairy lights circuit B'])assert.ok(room.getObjectByName(name),name+' is named for the film');
 office.dispose();
});

test('the ferry board is the town’s timetable, the next boat marked',async()=>{
 const {ferryBoardLines}=await build('web');
 assert.deepEqual(ferryBoardLines().map(l=>l.time),HARBOUR_LINE.map(m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')));
 assert.equal(ferryBoardLines(515).find(l=>l.time==='08:30').status,'ALONGSIDE');
 assert.equal(ferryBoardLines(600).find(l=>l.next).time,'14:30');
 assert.equal(ferryBoardLines(23*60).find(l=>l.next).time,'08:30','after the last boat, tomorrow’s first');
});
