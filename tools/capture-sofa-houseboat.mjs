import {chromium} from 'playwright';
import {TownAuditSession} from './mcp/session.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=new URL((process.env.AUDIT_OUTPUT||'../docs/qa/fujita-sofa-camera/').replace(/\/?$/,'/'),import.meta.url);await mkdir(out,{recursive:true});
const report={gameCommit:process.env.AUDIT_GAME_COMMIT,physicalDevice:false,browser:'Chromium software WebGL',controls:'Keyboard/mouse in both viewport sizes; physical touch acceptance outstanding',views:[],errors:[],probes:[],walk:[],firstPerson:[]};
const session=new TownAuditSession({launch:async options=>{
 const b=await chromium.launch({...options,...(process.env.TOWN_AUDIT_CHROMIUM?{executablePath:process.env.TOWN_AUDIT_CHROMIUM}:{}),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const create=b.newContext.bind(b);b.newContext=async o=>{const c=await create({...o,...(o.isMobile?{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'}:{})});await c.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));return c;};return b;
}});
try{
 for(const viewport of ['phone','desktop']){
  await session.start({viewport,spawn:'pier',time:'15:00'});const page=session.page;
  await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;if(!await a.world.portShed.boat.ready)throw Error('Hull failed');a.setTime(900);a.camera=null;a.teleport(-40.18,-57.05,0);a.step(1500);});
  const capture=async name=>{
   const state=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,s=a.world.portShed,roofs=[];s.boat.group.traverse(o=>{if(o.userData.houseboatRoof)roofs.push(o.visible);});
    const model=window.__JOHANSSON_MODEL__;
    return {routine:s.routine.state,position:s.fujita.getWorldPosition(s.fujita.position.clone()).toArray(),roofs,player:a.player,lens:a.lens,mouse:a.mouse,playerVisible:model?.root.visible};});
   await page.screenshot({path:new URL(viewport+'-'+name+'.png',out).pathname});report.views.push({viewport,name,state});console.log(viewport,name,JSON.stringify(state));
  };
  await capture('normal-cabin-camera');
  await session.input({control:'view',durationMs:17});await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(200));await capture('alternate-cabin-camera');
  const forward=await session.input({control:'forward',durationMs:200});assert.ok(forward.displacement>.1,'first-person walking');
  const backward=await session.input({control:'backward',durationMs:200});assert.ok(backward.displacement>.1,'first-person backing up');report.firstPerson.push({viewport,forward:forward.displacement,backward:backward.displacement});
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.teleport(-40.15,-56.65,Math.PI/2);a.step(200);});
  await session.look({degrees:12,verticalDegrees:38});await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(500));await capture('open-cabinet-day');
  await session.look({verticalDegrees:-38});
  // Advance the production routine alone for staging; focused routine tests exercise
  // bedtime and wake-up. Avoid 45 s of unrelated town work in these visual captures.
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,s=a.world.portShed;a.setTime(1410);for(let i=0;i<500;i++)s.tick(.1,1410);a.teleport(-40.18,-57.05,0,-.05);a.step(1500);});
  await capture('first-person-night');
  await session.input({control:'view',durationMs:17});await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(1500));await capture('third-person-night');
  assert.equal(report.views.at(-1).state.routine,'sleeping');
  for(const z of [-56.35,-57.05,-58.7])for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
   const probe=await page.evaluate(({z,yaw})=>{const a=window.__JOHANSSON_AUDIT__;a.teleport(-40.18,z,yaw);a.step(200);return {z,yaw,lens:a.lens,mouse:a.mouse};},{z,yaw});
   assert.equal(probe.lens.blocked,false,'cabin camera lens is clear');report.probes.push({viewport,...probe});
  }
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.teleport(-40.18,-57.05,0);a.step(1500);});
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:[-40.5,6.3,-57.7],at:[-40.5,.5,-57.7]};a.step(0);});await capture('sleep-overhead');
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:[-39.95,1.45,-57.3],at:[-41.1,.7,-58.4]};a.step(0);});await capture('sleep-side-night');
  assert.ok(report.views.filter(v=>v.viewport===viewport).every(v=>v.state.roofs.every(r=>!r)),'roof and ceiling fitting cut away');
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,s=a.world.portShed;a.camera=null;a.setTime(360);for(let i=0;i<500;i++)s.tick(.1,360);a.setTime(900);a.teleport(-37.5,-54.2,0,-.05);a.step(500);});
  for(const point of [{x:-40.2,z:-54.2},{x:-39.85,z:-55.35},{x:-39.85,z:-56.35},{x:-40.18,z:-57.05},{x:-39.85,z:-56.35},{x:-39.85,z:-55.35},{x:-40.2,z:-54.2},{x:-37.5,z:-54.2}]){
   const result=await session.walk({...point,maxSeconds:12,tolerance:.18});assert.equal(result.reached,true,'gangway/cabin route '+JSON.stringify(point));report.walk.push({viewport,point,reached:result.reached});
  }
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.face(0,-.05);a.step(1500);});await capture('restored-exterior-day');
  const exterior=report.views.at(-1).state;assert.equal(exterior.routine,'watching');assert.ok(exterior.roofs.every(Boolean));assert.ok(Math.abs(exterior.lens.rotation[0]+.05)<.01,'exterior pitch restored');
  report.errors.push({viewport,errors:session.errors});await session.close();
 }
 report.passed=report.errors.every(v=>v.errors.length===0);if(!report.passed)throw Error('Browser errors: '+JSON.stringify(report.errors));
}catch(e){report.passed=false;report.failure=e.stack;try{await session.page?.screenshot({path:new URL('failure.png',out).pathname});}catch{}process.exitCode=1;}
finally{await session.close();await writeFile(new URL('report.json',out),JSON.stringify(report,null,2));}
