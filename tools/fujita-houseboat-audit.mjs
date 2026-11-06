import {chromium} from 'playwright';
import {TownAuditSession} from './mcp/session.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const session=new TownAuditSession({launch:async o=>{
 const browser=await chromium.launch({...o,...(process.env.TOWN_AUDIT_CHROMIUM?{executablePath:process.env.TOWN_AUDIT_CHROMIUM,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']}: {})}),create=browser.newContext.bind(browser);
 browser.newContext=async config=>{const context=await create(config);await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));return context;};return browser;
}});
const out=new URL((process.env.AUDIT_OUTPUT||'../docs/qa/fujita-houseboat/').replace(/\/?$/,'/'),import.meta.url);await mkdir(out,{recursive:true});const report={screens:[],externalFonts:'Google font CSS stubbed because the execution network blocks it; local fallback fonts used.'};
try{
 for(const viewport of (process.env.TOWN_AUDIT_PHONE_ONLY?['phone']:['desktop','phone'])){
  console.log('Starting',viewport);await session.start({viewport,spawn:'pier',time:'23:29'});const page=session.page;
  if(process.env.TOWN_AUDIT_ENDPOINTS_ONLY){
   const endpoint=await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;if(!await a.world.portShed.boat.ready)throw Error('Hull failed to load');a.teleport(-37.5,-54.2,0);a.setTime(360);a.step(38000);a.camera={pos:[-47,6,-49],at:[-38.5,.8,-57]};a.render();const s=a.world.portShed;return {state:s.routine.state,position:s.fujita.getWorldPosition(s.fujita.position.clone()).toArray()};});assert.equal(endpoint.state,'watching');
   await page.screenshot({path:new URL(`${viewport}-wake-return.png`,out).pathname});
   await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(450);a.step(0);a.camera={pos:[-43,40,-20],at:[-26,0,-56]};a.render();});await page.screenshot({path:new URL(`${viewport}-harbour-clearance.png`,out).pathname});
   report.screens.push({viewport,endpoint,stagedEndpointIllustrations:true});await session.close();continue;
  }
  if(viewport==='phone'){
   const cdp=await session.context.newCDPSession(page);
   const touch=async(type,x,y)=>{await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1,radiusX:4,radiusY:4,force:1}]});await page.waitForTimeout(30);};
   session.input=async({control,durationMs=300})=>{
    assert.equal(control,'forward');const before=await session.controlState(),box=await page.locator('#stick').boundingBox();assert.ok(box,'touch movement area');
    const x=box.x+box.width*.5,y=box.y+box.height*.65,r=await page.locator('#stickBase').evaluate(o=>o.offsetWidth/2);
    await touch('touchStart',x,y);await touch('touchMove',x,y-(9+(r-9)*.7));
    await page.evaluate(ms=>window.__JOHANSSON_AUDIT__.step(ms),durationMs);await touch('touchEnd');
    const after=await session.controlState(),displacement=Math.hypot(...after.game.player.map((v,i)=>v-before.game.player[i]));
    session.history.push({control:'touch-stick',durationMs,from:before.game.player,to:after.game.player,displacement});return {accepted:true,before,after,displacement};
   };
   session.look=async({degrees=0})=>{
    let dx=-degrees*Math.PI/180/(Math.PI*1.1/390);const before=await session.controlState();
    while(Math.abs(dx)>.001){const step=Math.max(-100,Math.min(100,dx));await touch('touchStart',280,350);
     if(Math.abs(step)<9){await touch('touchMove',310,350);await touch('touchMove',280+step,350);}else await touch('touchMove',280+step,350);
     await touch('touchEnd');dx-=step;
    }
    await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(17));return {accepted:true,before,after:await session.controlState()};
   };
  }

  await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;if(!await a.world.portShed.boat.ready)throw Error('Hull failed to load');a.teleport(-37.5,-54.2,0);a.camera={pos:[-47,6,-49],at:[-38.5,.8,-57]};a.setTime(1409);a.step(0);});
  await page.screenshot({path:new URL(`${viewport}-evening.png`,out).pathname});
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(900);a.step(0);});await page.screenshot({path:new URL(`${viewport}-day.png`,out).pathname});
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.setTime(1410));const steps=[];
  for(let i=0;i<38;i++){steps.push(await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.step(1000);const s=a.world.portShed;return {state:s.routine.state,position:s.fujita.getWorldPosition(s.fujita.position.clone()).toArray(),held:s.fujita.userData.heldItem};}));if(i===11)await page.screenshot({path:new URL(`${viewport}-boarding.png`,out).pathname});}
  assert.equal(steps.at(-1).state,'sleeping');assert.equal(steps.at(-1).held,undefined);
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:[-44.5,4,-53.6],at:[-40.7,.7,-57.5]};a.step(0);});await page.screenshot({path:new URL(`${viewport}-berth.png`,out).pathname});
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.teleport(-37.5,-54.2,Math.PI/2);a.step(0);});
  const gangway=await session.walk({x:-40.2,z:-54.2,maxSeconds:12,tolerance:.2});assert.equal(gangway.reached,true,'gangway controls');
  const deck=await session.walk({x:-39.85,z:-55.35,maxSeconds:8,tolerance:.2});assert.equal(deck.reached,true,'bow deck');
  const door=await session.walk({x:-39.85,z:-56.35,maxSeconds:8,tolerance:.2});assert.equal(door.reached,true,'cabin door');
  const aisle=await session.walk({x:-40.13,z:-57.08,maxSeconds:8,tolerance:.15});assert.equal(aisle.reached,true,'berth aisle');
  await page.screenshot({path:new URL(`${viewport}-cabin-camera.png`,out).pathname});
  const camera=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,roofs=[];a.world.portShed.boat.group.traverse(o=>{if(o.userData.houseboatRoof)roofs.push(o.visible);});return {lens:a.lens,roofVisible:roofs};});
  assert.ok(camera.roofVisible.every(v=>!v),'cabin cutaway');assert.equal(camera.lens.blocked,false,'normal cabin camera clearance');
  const collisionStart=(await session.controlState()).game.player;
  await session.look({degrees:(-Math.PI/2-(await session.controlState()).view.yaw)*180/Math.PI});
  await session.input({control:'forward',durationMs:1200});
  const collisionEnd=(await session.controlState()).game.player;
  assert.ok(collisionEnd[0]<-39.59,'starboard cabin wall stops touch movement');
  assert.ok(Math.hypot(collisionEnd[0]-collisionStart[0],collisionEnd[2]-collisionStart[2])<.7,'wall collision is bounded');
  const returnRoute=[];for(const point of [{x:-39.85,z:-56.35},{x:-39.85,z:-55.35},{x:-40.2,z:-54.2},{x:-37.5,z:-54.2}]){const result=await session.walk({...point,maxSeconds:12,tolerance:.18});returnRoute.push({point,reached:result.reached});assert.ok(result.reached,'return across gangway '+JSON.stringify(point));}
  await page.screenshot({path:new URL(`${viewport}-gangway-return.png`,out).pathname});
  const wakeSteps=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,steps=[];a.setTime(360);for(let i=0;i<38;i++){a.step(1000);const s=a.world.portShed;steps.push({state:s.routine.state,position:s.fujita.getWorldPosition(s.fujita.position.clone()).toArray()});}return steps;});
  const wake=await page.evaluate(()=>{const s=window.__JOHANSSON_AUDIT__.world.portShed;return {state:s.routine.state,position:s.fujita.getWorldPosition(s.fujita.position.clone()).toArray(),held:s.fujita.userData.heldItem};});assert.equal(wake.state,'watching','06:00 shed return');
  await page.screenshot({path:new URL(`${viewport}-wake-return.png`,out).pathname});
  const awakeRoofs=await page.evaluate(()=>{const roofs=[];window.__JOHANSSON_AUDIT__.world.portShed.boat.group.traverse(o=>{if(o.userData.houseboatRoof)roofs.push(o.visible);});return roofs;});assert.ok(awakeRoofs.every(Boolean),'outside awake restores roof');
  const harbour=await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__,T=await import('/johansson-town/vendor/three.module.js'),samples=[];for(const minutes of [420,435,450,520,535,549,870,885,900,990,1005,1019]){a.setTime(minutes);a.step(0);const boat=new T.Box3().setFromObject(a.world.portShed.boat.group),gangway=new T.Box3().setFromObject(a.world.portShed.boat.gangway),ship=new T.Box3().setFromObject(a.world.cargoShipping.ship);samples.push({minutes,boatOverlap:ship.intersectsBox(boat),gangwayOverlap:ship.intersectsBox(gangway)});}return samples;});assert.ok(harbour.every(s=>!s.boatOverlap&&!s.gangwayOverlap),'cargo clearance');
  await page.screenshot({path:new URL(`${viewport}-harbour-clearance.png`,out).pathname});
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(360);for(let i=0;i<38;i++)a.step(1000);});
  const final=await session.observe(),routine=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.world.portShed.routine.state);assert.equal(routine,'watching');assert.deepEqual(final.invalidTransforms,[]);
  const environmentNotes=final.errors.filter(e=>e.type==='request'&&e.message.includes('/assets/figurines/thuan/thuan-display.glb ')&&e.message.endsWith('net::ERR_ABORTED'));
  if(environmentNotes.length){const response=await session.context.request.get(new URL('./assets/figurines/thuan/thuan-display.glb',page.url()).href);assert.equal(response.status(),200);assert.equal((await response.body()).subarray(0,4).toString(),'glTF');}
  const errors=final.errors.filter(e=>!environmentNotes.includes(e));assert.deepEqual(errors,[],'all unclassified browser and asset errors');
  report.screens.push({viewport,steps,walk:{controls:viewport==='phone'?'CDP touch joystick and swipes':'keyboard/mouse',gangway:gangway.reached,deck:deck.reached,door:door.reached,aisle:aisle.reached,returnRoute},camera,collision:{from:collisionStart,to:collisionEnd},awakeRoofs,wake,wakeSteps,harbour,routine,errors,environmentNotes,invalidTransforms:final.invalidTransforms});await session.close();console.log('Passed',viewport);
 }
 report.passed=true;
}catch(e){report.passed=false;report.error=e.stack;try{await session.page?.screenshot({path:new URL('failure.png',out).pathname});}catch{};process.exitCode=1;}
finally{await session.close();await writeFile(new URL(process.env.TOWN_AUDIT_ENDPOINTS_ONLY?'endpoints.json':'report.json',out),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,error:report.error?.split('\n')[0]}));}
