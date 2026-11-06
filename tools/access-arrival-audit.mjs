import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';

const mode=process.argv[2]||'movement',base=process.argv[3]||'http://127.0.0.1:8767/johansson-town/';
const out=new URL('../../output/access-arrival/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={mode,checks:[],errors:[]};
async function boot(spawn,width=1280){
 const context=await browser.newContext({viewport:{width,height:width<500?844:800},serviceWorkers:'block'});
 await context.addInitScript(start=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start,speed:1}));Object.defineProperty(navigator,'getGamepads',{value:()=>[]});Element.prototype.requestFullscreen=async()=>{};},mode==='ferry'?'09:00':spawn==='izakaya'?'18:00':'12:00');
 const page=await context.newPage();page.setDefaultTimeout(120000);
 page.on('pageerror',e=>report.errors.push(e.stack||e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 const url=new URL(base);url.searchParams.set('audit','');if(spawn)url.searchParams.set('spawn',spawn);
 await page.goto(url.href);await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 return {page,context};
}
const state=page=>page.evaluate(()=>({state:JSON.parse(window.render_game_to_text()),seated:window.__JOHANSSON_AUDIT__.seated,ferry:{phase:window.__JOHANSSON_AUDIT__.world.ferry.phase,berth:window.__JOHANSSON_AUDIT__.world.ferry.berth,loading:window.__JOHANSSON_AUDIT__.world.ferry.loadingVehicles},vehicles:window.__JOHANSSON_AUDIT__.world.traffic.snapshot()}));
async function capture(page,name){await page.screenshot({path:new URL(name+'.png',out).pathname});report.checks.push({name,...await state(page)});console.log(name);}
async function walkTo(page,x,z){
 let remaining=Infinity;
 for(let i=0;i<50;i++){
  const p=(await state(page)).state.player,dx=x-p[0],dz=z-p[2];remaining=Math.hypot(dx,dz);if(remaining<.25)return;
  const target=Math.atan2(-dx,-dz),box=await page.locator('canvas').first().boundingBox(),cx=box.x+box.width/2,cy=box.y+box.height/2;
  for(let turn=0;turn<24;turn++){const current=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.mouse.yaw);let delta=target-current;while(delta>Math.PI)delta-=Math.PI*2;while(delta< -Math.PI)delta+=Math.PI*2;if(Math.abs(delta)<.003)break;const pixels=Math.max(-120,Math.min(120,-delta/.0023));await page.mouse.move(cx,cy);await page.mouse.down({button:'right'});await page.mouse.move(cx+pixels,cy);await page.mouse.up({button:'right'});}
  await page.keyboard.down('KeyW');await page.evaluate(ms=>window.__JOHANSSON_AUDIT__.step(ms),Math.min(400,remaining/3*1000));await page.keyboard.up('KeyW');
 }
 if(remaining>=.25){await capture(page,'walk-failed');const diagnostic=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,p=JSON.parse(window.render_game_to_text()).player;return {player:p,colliders:a.world.colliders.filter(c=>Math.hypot(c.x-p[0],c.z-p[2])<4),blocked:a.blocked,vehicles:a.world.traffic.snapshot()};});console.log('Walk diagnostic',JSON.stringify(diagnostic));}
 assert.ok(remaining<.25,`Walking to ${x},${z} stalled ${remaining.toFixed(2)}m away`);
}
try{
 if(mode==='movement'){
  const {page,context}=await boot();
  assert.equal((await state(page)).seated,true);const before=(await state(page)).state.player;
  await page.keyboard.down('ArrowUp');await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(500));await page.keyboard.up('ArrowUp');
  assert.equal((await state(page)).seated,false,'Movement stands from the spawn bench immediately');
  assert.ok(Math.hypot(...(await state(page)).state.player.filter((_,i)=>i!==1).map((v,i)=>v-before[i?2:0]))>.5);
  await capture(page,'bench-movement');
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.teleport(2.6,18,0));await walkTo(page,3.6,18);await capture(page,'main-street-floor');
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.teleport(0,14,0));
  for(const [x,z] of [[0,27],[-8,34.6],[-5.4,40],[1.9,40],[1.9,66]])await walkTo(page,x,z);
  await capture(page,'residential-arrival');
  await context.close();
 }else if(mode==='ferry'){
  const {page,context}=await boot();
  const viewStatus=page=>page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;return {thirdPerson:a.mouse.thirdPerson,saved:localStorage.getItem('johansson-town-view'),actorVisible:a.johansson?.root?.visible,actorReady:a.johansson?.ready,phase:a.island.phase,place:document.querySelector('#place').textContent,detail:document.querySelector('#placeSub').textContent};});
  async function faceTo(page,x,z){
   const p=(await state(page)).state.player,target=Math.atan2(-(x-p[0]),-(z-p[2])),box=await page.locator('canvas').first().boundingBox(),cx=box.x+box.width/2,cy=box.y+box.height/2;
   for(let turn=0;turn<24;turn++){const current=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.mouse.yaw);let delta=target-current;while(delta>Math.PI)delta-=Math.PI*2;while(delta< -Math.PI)delta+=Math.PI*2;if(Math.abs(delta)<.003)break;const pixels=Math.max(-120,Math.min(120,-delta/.0023));await page.mouse.move(cx,cy);await page.mouse.down({button:'right'});await page.mouse.move(cx+pixels,cy);await page.mouse.up({button:'right'});}
   await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(100));
  }
  const ports=await page.evaluate(async()=>{const {AIRPORT_FERRY_PORTS}=await import('/johansson-town/src/world/airport-ferry.js');const {airportWorld,AIRPORT_COUNTER}=await import('/johansson-town/src/world/airport-ground.js');const {AIRPORT_SHOPS}=await import('/johansson-town/src/world/airport-district-plan.js');const shop=AIRPORT_SHOPS[0];return {ports:AIRPORT_FERRY_PORTS,walk:[airportWorld(-40,31),airportWorld(-40,18.7),AIRPORT_COUNTER],signWalk:[[21,31],[21,38.5],[21,64],[shop.x,64],[shop.x,shop.z-6.6]].map(p=>airportWorld(...p)),signFacing:airportWorld(shop.x,shop.z),shopTitle:shop.title};});
  let view;
  if(process.argv[4]!=='flight-only'){
  await page.evaluate(p=>{const a=window.__JOHANSSON_AUDIT__,day=Math.floor(JSON.parse(window.render_game_to_text()).minutes/1440)*1440;a.setTime(day+540);a.teleport(...p,0);},ports.ports.town.landing);
  if((await viewStatus(page)).thirdPerson)await page.keyboard.press('KeyV');
  assert.equal((await viewStatus(page)).saved,'first','Use a real first-person view preference for the ferry');
  await page.waitForTimeout(300);await page.keyboard.press('KeyE');
  await page.getByRole('button',{name:/Buy return ticket/}).click();await page.getByRole('button',{name:'Board the local ferry',exact:true}).click();
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(9000));
  await page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.johansson?.ready);
  view=await viewStatus(page);assert.equal(view.phase,'ferry');assert.equal(view.thirdPerson,false);assert.equal(view.saved,'first');assert.equal(view.actorVisible,true,'The external ferry scene shows Johansson despite saved first-person view');assert.equal(view.place,'MINATO–KITANO-JIMA FERRY');report.checks.push({name:'first-person-ferry-cinematic',view});
  assert.equal((await state(page)).vehicles.filter(v=>v.location==='aboard').length,0,'Some sailings have no cars');await capture(page,'ferry-empty-crossing');
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(10000));
  assert.equal((await state(page)).state.island.location,'airport');view=await viewStatus(page);assert.equal(view.thirdPerson,false,'Landing restores the first-person view');assert.equal(view.saved,'first');assert.equal(view.actorVisible,false);assert.equal(view.place,'Kitano-jima Airport');report.checks.push({name:'airport-view-and-hud',view});await capture(page,'airport-dock-arrival');
  if(process.argv[4]!=='cargo-only'){
   for(const [x,z] of ports.walk)await walkTo(page,x,z);await capture(page,'airport-counter-walk');
   for(const [x,z] of ports.signWalk)await walkTo(page,x,z);
   const shopTarget=await page.evaluate(title=>window.__JOHANSSON_AUDIT__.targets.find(t=>t.label==='Visit '+title),ports.shopTitle);
   assert.ok(shopTarget&&shopTarget.distance<2,'Walk to the actual customer-facing shop interaction');
   await page.keyboard.press('KeyV');await faceTo(page,...ports.signFacing);await page.waitForTimeout(700);
   const signFront=await page.evaluate(title=>{const a=window.__JOHANSSON_AUDIT__,m=a.world.airportIsland.group.getObjectByName(title+' sign'),centre=m.getWorldPosition(a.scene.position.clone()),customer=a.johansson.root.position.clone();customer.y=centre.y;return m.getWorldDirection(centre.clone()).dot(customer.sub(centre).normalize());},ports.shopTitle);
   assert.ok(signFront>.75,'The real customer sees the readable texture front, not its mirrored back');
   await capture(page,'airport-shop-sign-front');report.checks.push({name:'airport-customer-sign-normal',frontDot:signFront,target:shopTarget});
   for(const [x,z] of [...ports.signWalk.slice(0,-1)].reverse())await walkTo(page,x,z);await walkTo(page,...ports.walk.at(-1));
   await page.keyboard.press('KeyV');assert.equal((await viewStatus(page)).saved,'first');
   for(const [x,z] of [...ports.walk.slice(0,-1)].reverse())await walkTo(page,x,z);
  }
  await walkTo(page,...ports.ports.airport.landing);await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,day=Math.floor(JSON.parse(window.render_game_to_text()).minutes/1440)*1440;a.setTime(day+630);});await page.waitForTimeout(200);await page.keyboard.press('KeyE');
  await page.getByRole('button',{name:'Board the local ferry',exact:true}).click();
  let boarded=false;
  for(let i=0;i<250;i++){
   await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(500));const data=await state(page);
   if(data.vehicles.some(v=>v.transfer==='on')&&!report.checks.some(c=>c.name==='car-ramp-boarding')){
    const rampPosition=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,v=a.world.traffic.traffic.vehicles.find(v=>v.transfer==='on');return v?a.world.ferry.ferry.worldToLocal(v.g.position.clone()).toArray():null;});
    if(rampPosition&&Math.abs(rampPosition[0])<.6&&rampPosition[2]>=8.2&&rampPosition[2]<=9.5){await page.waitForTimeout(700);await capture(page,'car-ramp-boarding');}
   }
   if(data.vehicles.some(v=>v.location==='aboard')){boarded=true;assert.ok(data.vehicles.filter(v=>v.location==='aboard').every(v=>v.occupied),'Every moving car has its driver');await page.waitForTimeout(700);await capture(page,'ferry-car-and-driver');break;}
  }
  if(!boarded){await capture(page,'ferry-boarding-failed');console.log('Boarding diagnostic',JSON.stringify(await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;return {blocked:a.blocked,island:a.island.snapshot(),ferry:{phase:a.world.ferry.phase,berth:a.world.ferry.berth},cars:a.world.traffic.traffic.vehicles.map(v=>({owner:v.owner,where:v.where,s:v.s,speed:v.speed,blocker:v.blocker?.owner||v.blocker,trip:!!v.trip,transfer:v.transfer,position:v.g.position.toArray()})),drivers:a.world.people.filter(p=>['Chin','Reiko','Mrs Sato','Nhung'].includes(p.profile.name)).map(p=>({name:p.profile.name,visible:p.g.visible,parent:p.g.parent.name,flags:Object.fromEntries(Object.entries(p.g.userData).filter(([key])=>key==='indoors'||key.startsWith('in')||key==='roomTransition'||key==='sleeping'||key==='playerConversation'))}))};})));}
  assert.equal(boarded,true,'Scheduled airport courier drives aboard the shared ferry');
  assert.ok(report.checks.some(c=>c.name==='car-ramp-boarding'),'The courier physically passes over the bow ramp');
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(9000));await capture(page,'ferry-car-crossing');
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(10000));
  assert.equal((await state(page)).state.island.location,'town');view=await viewStatus(page);assert.equal(view.thirdPerson,false);assert.equal(view.saved,'first');assert.equal(view.actorVisible,false);assert.equal(view.place,'JOHANSSON TOWN');report.checks.push({name:'town-return-view-and-hud',view});await capture(page,'town-ferry-return');
  for(let i=0;i<80&&(await state(page)).vehicles.some(v=>v.transfer==='off'||v.location==='aboard');i++){
   await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(500));
   if(!report.checks.some(c=>c.name==='car-ramp-unloading')&&(await state(page)).vehicles.some(v=>v.transfer==='off')){
    await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,v=a.world.traffic.traffic.vehicles.find(v=>v.transfer==='off'),p=v.g.position;a.frozen=true;a.renderFrozen=false;a.camera={pos:[p.x+6,p.y+4,p.z+5],at:[p.x,p.y+1,p.z]};a.step(0);});
    await capture(page,'car-ramp-unloading');await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.frozen=false;});
   }
  }
  assert.equal((await state(page)).vehicles.some(v=>v.location==='aboard'),false,'Arrived car drives off instead of becoming decoration');
  assert.equal((await state(page)).vehicles.find(v=>v.owner==='Chin').location,'service','The courier completes its delivery at a connected freight bay');
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,v=a.world.traffic.traffic.vehicles.find(v=>v.owner==='Chin'),p=v.g.position.clone();a.teleport(p.x+3,p.z+3,0);a.frozen=true;a.renderFrozen=false;a.camera={pos:[p.x+5,p.y+3,p.z+5],at:[p.x,p.y+1,p.z]};a.step(17);});await capture(page,'town-car-unloaded');
  }
  if(process.argv[4]!=='flight-only')await context.close();
  if(process.argv[4]!=='cargo-only'){
   // A separate fixture keeps the flight's long normal wait from changing the
   // courier appointment tested above. Boarding and return use real UI/controls.
   const flight=process.argv[4]==='flight-only'?{page,context}:await boot();
   await flight.page.evaluate(p=>{const a=window.__JOHANSSON_AUDIT__,day=Math.floor(JSON.parse(window.render_game_to_text()).minutes/1440)*1440;a.setTime(day+540);a.teleport(...p,0);},ports.ports.town.landing);
   if((await viewStatus(flight.page)).thirdPerson)await flight.page.keyboard.press('KeyV');await flight.page.keyboard.press('KeyV');assert.equal((await viewStatus(flight.page)).saved,'third');
   await flight.page.waitForTimeout(300);await flight.page.keyboard.press('KeyE');
   await flight.page.getByRole('button',{name:/Buy return ticket/}).click();await flight.page.getByRole('button',{name:'Board the local ferry',exact:true}).click();await flight.page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(19000));
   assert.equal((await state(flight.page)).state.island.location,'airport');for(const [x,z] of ports.walk)await walkTo(flight.page,x,z);
   await flight.page.keyboard.press('KeyE');await flight.page.getByRole('button',{name:'Buy Naha return ticket · ¥800',exact:true}).click();await flight.page.waitForTimeout(150);await capture(flight.page,'flight-ticket-checkin-menu');console.log('Flight ticket diagnostic',JSON.stringify(await flight.page.evaluate(()=>({ui:window.__JOHANSSON_AGENT_API__.getState(),island:window.__JOHANSSON_AUDIT__.island.snapshot()}))));assert.equal(await flight.page.getByRole('button',{name:'Check in with one cabin bag',exact:true}).count(),1,'Buying the Naha ticket opens normal check-in');await flight.page.getByRole('button',{name:'Check in with one cabin bag',exact:true}).click();await flight.page.getByRole('button',{name:'Board the Naha commuter flight',exact:true}).click();
   if(await flight.page.getByRole('button',{name:'Wait until departure',exact:true}).count()){await flight.page.getByRole('button',{name:'Wait until departure',exact:true}).click();await flight.page.getByRole('button',{name:'Board the Naha commuter flight',exact:true}).click();}
   await flight.page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(6500));view=await viewStatus(flight.page);assert.equal(view.phase,'flight');assert.equal(view.thirdPerson,true);assert.equal(view.saved,'third');assert.equal(view.actorVisible,false,'No standing actor rides on the aircraft roof');assert.equal(view.place,'ISLAND COMMUTER FLIGHT');report.checks.push({name:'third-person-flight-cinematic',view});await capture(flight.page,'flight-no-roof-passenger');
   await flight.page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(6500));await flight.page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).room==='naha-airport-arrivals');await walkTo(flight.page,0,-2.4);await flight.page.keyboard.press('KeyE');await flight.page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(6500));view=await viewStatus(flight.page);assert.equal(view.phase,'flight');assert.equal(view.actorVisible,false);await capture(flight.page,'return-flight-no-roof-passenger');
   await flight.page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(6500));assert.equal((await state(flight.page)).state.island.location,'airport');view=await viewStatus(flight.page);assert.equal(view.thirdPerson,true,'Returning restores the street view');assert.equal(view.saved,'third');assert.equal(view.actorVisible,true);assert.equal(view.place,'Kitano-jima Airport');report.checks.push({name:'flight-return-view-and-hud',view});await capture(flight.page,'flight-return-airport');await flight.context.close();
  }
 }else if(mode==='spawn'){
  for(const [spawn,width] of [['pier',1280],['sakura-bench',1280],['park-bench',390],['ramen',1280],['ferry',1280],['seawall',390],['izakaya',1280]].filter(([id])=>!process.argv[4]||id===process.argv[4])){
   const {page,context}=await boot(spawn,width);
   try{await page.waitForFunction(()=>{const a=window.__JOHANSSON_AUDIT__;if(!a.arrival?.action)return false;a.frozen=true;return true;},null,{timeout:8000});}catch(error){await capture(page,`arrival-${spawn}-failed`);throw error;}
   await capture(page,`arrival-${spawn}-${width}`);
   if(spawn==='pier'){
    await page.evaluate(()=>window.__JOHANSSON_AUDIT__.frozen=false);
    await page.waitForFunction(()=>{const a=window.__JOHANSSON_AUDIT__,s=a.arrival;if(!s.bird||s.seconds<1.8)return false;a.frozen=true;return true;});
    await capture(page,'arrival-pier-gull');
   }
   await page.keyboard.down('ArrowUp');await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(350));await page.keyboard.up('ArrowUp');
   assert.equal((await state(page)).state.arrival.active,false,'Movement cancels the cinematic');
   assert.equal((await state(page)).seated,false,'Movement releases seated opening');
   await capture(page,`arrival-${spawn}-interrupted`);await context.close();
  }
 }else throw new Error('Unknown audit mode '+mode);
 assert.deepEqual(report.errors,[]);
}finally{await writeFile(new URL(mode+'-report.json',out),JSON.stringify(report,null,2)+'\n');await browser.close();}
