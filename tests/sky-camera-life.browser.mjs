import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {TownAuditSession} from '../tools/mcp/session.mjs';
const out=new URL('../docs/qa/sky-camera-life/',import.meta.url);await mkdir(out,{recursive:true});
const reports=[];
for(const viewport of ['desktop','phone']){
 console.log(viewport+' starting');const s=new TownAuditSession({launch:async options=>{
  const browser=await chromium.launch(options),newContext=browser.newContext.bind(browser);
  browser.newContext=async options=>{const context=await newContext(options);
   // The managed test network blocks Google Fonts. Exercise the existing system
   // font fallback without waiting for an external request to time out.
   await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));return context;};
  return browser;
 }});
 try{
  await s.start({viewport,time:'07:20'});
  const title=await s.context.newPage();await title.goto(s.preview.url);await title.waitForTimeout(2500);
  const gradient=await title.locator('.title-screen').evaluate(e=>getComputedStyle(e).backgroundImage);assert.match(gradient,/linear-gradient/);
  await title.screenshot({path:new URL(viewport+'-sky.png',out).pathname});await title.close();
  if(!(await s.controlState()).view.thirdPerson)await s.input({control:'view',durationMs:17});
  console.log(viewport+' loaded');const lenses=[];
  for(const room of ['resident-home-aya','resident-home-thuan','market','izakaya','onsen']){
   await s.page.evaluate(async id=>{const a=window.__JOHANSSON_AUDIT__;a.leave();await a.enter(id);a.step(1000);},room);
   await s.look({verticalDegrees:60,_compact:true});
   for(let turn=0;turn<4;turn++){
    if(turn)await s.look({degrees:90,_compact:true});
    const lens=await s.page.evaluate(()=>window.__JOHANSSON_AUDIT__.lens);
    assert.ok(lens.position.every(Number.isFinite),room+' finite lens');
    assert.ok(!lens.blocked,room+' camera clear: '+JSON.stringify(lens));
    assert.ok(lens.ceiling==null||lens.position[1]<=lens.ceiling+.001,room+' lens below ceiling');lenses.push({room,turn,...lens});
   }
   await s.page.screenshot({path:new URL(viewport+'-'+room+'.png',out).pathname});
   await s.look({verticalDegrees:-60,_compact:true});
  }
  // Observe the existing actor: no spawn, duplicate, or scripted coordinate injection.
  await s.page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.leave();a.setTime(449);await a.enter('resident-home-thuan');a.step(1000);});
  console.log(viewport+' cameras checked');const thuan=()=>s.page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,p=a.world.people.find(p=>p.profile.name==='Thuan'),g=p.g;return {position:g.position.toArray(),parent:g.parent.name,visible:g.visible,place:g.userData.place,activity:g.userData.activity,sleeping:g.userData.sleeping,waking:g.userData.waking,inHome:g.userData.inHome,inMarket:g.userData.inMarket,inRamen:g.userData.inRamen,inIzakaya:g.userData.inIzakaya,pose:g.userData.socialPose,held:g.userData.heldItem,meal:a.activities.state.residentLife?.Thuan};});
  const routine=[];routine.push(await thuan());assert.ok(routine.at(-1).sleeping);
  await s.page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(450);a.step(1000);});routine.push(await thuan());assert.ok(routine.at(-1).waking);
  await s.page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(475);a.step(15000);});routine.push(await thuan());assert.equal(routine.at(-1).pose,'Eat');
  await s.page.screenshot({path:new URL(viewport+'-thuan-breakfast.png',out).pathname});
  await s.page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(510);a.step(15000);});routine.push(await thuan());assert.ok(!routine.at(-1).inHome,'Thuan walks out of her home');
  await s.page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.leave();a.step(120000);});routine.push(await thuan());assert.ok(routine.at(-1).inMarket,'Thuan reaches her shop');
  await s.page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(780);a.step(60000);await a.enter('ramen');a.step(30000);});routine.push(await thuan());assert.ok(routine.at(-1).inRamen,'Thuan enters ramen');assert.equal(routine.at(-1).meal.meals.ramen.item,'ramen');
  await s.page.screenshot({path:new URL(viewport+'-thuan-noodles.png',out).pathname});
  await s.page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.leave();a.setTime(1230);a.step(120000);await a.enter('izakaya');a.step(30000);});routine.push(await thuan());assert.ok(routine.at(-1).inIzakaya,'Thuan visits Minato');assert.equal(routine.at(-1).meal.meals.izakaya.drink,'beer');
  await s.page.screenshot({path:new URL(viewport+'-thuan-beer.png',out).pathname});
  await s.page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(1290);a.step(15000);a.leave();a.step(120000);});routine.push(await thuan());assert.equal(routine.at(-1).place,'home');
  await s.page.evaluate(()=>window.__JOHANSSON_AUDIT__.activities.save());
  await s.page.reload();await s.page.locator('#enter').click();await s.page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
  const duplicates=await s.page.evaluate(()=>window.__JOHANSSON_AUDIT__.world.people.filter(p=>p.profile.name==='Thuan').length);assert.equal(duplicates,1);
  const fontFailures=s.errors.filter(e=>e.type==='request'&&e.message.startsWith('https://fonts.googleapis.com/')&&e.message.includes('ERR_EMPTY_RESPONSE'));
  let fontConsole=fontFailures.length;
  const applicationErrors=s.errors.filter(e=>{
   if(fontFailures.includes(e))return false;
   if(e.type==='console'&&e.message==='Failed to load resource: net::ERR_EMPTY_RESPONSE'&&fontConsole>0){fontConsole--;return false;}
   if(e.type==='request'&&e.message.startsWith(s.preview.url)&&e.message.includes('ERR_ABORTED'))return false;
   return true;
  });
  assert.equal(applicationErrors.length,0,'application errors: '+JSON.stringify(applicationErrors));
  reports.push({viewport,gradient,lenses,routine,duplicates,applicationErrors,environmentNotes:s.errors});console.log(viewport+' passed');
 }finally{await s.close();}
}
await writeFile(new URL('results.json',out),JSON.stringify(reports,null,2)+'\n');
