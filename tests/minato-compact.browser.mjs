// Walk the compiled game through the fitted room at desktop and phone sizes.
// npm run build:runtime && node tests/minato-compact.browser.mjs
// Optional: CHROMIUM_EXECUTABLE, JOHANSSON_SWIFTSHADER=1,
// JOHANSSON_AUDIT_SOURCE=1, JOHANSSON_AUDIT_VIEWPORTS=desktop,phone.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {TownAuditSession} from '../tools/mcp/session.mjs';

const out=new URL('../docs/qa/minato-compact/',import.meta.url);
await mkdir(out,{recursive:true});
const report={source:process.env.JOHANSSON_AUDIT_SOURCE==='1',softwareGPU:process.env.JOHANSSON_SWIFTSHADER==='1',notes:['Phone is a 390 × 844 Chromium viewport, not a physical iPhone Safari test.','renderInfo is cumulative during frozen manual draws; it is not a per-frame performance measurement.'],viewports:[]};
report.runtime=JSON.parse(await readFile(new URL('../runtime/source.json',import.meta.url),'utf8'));
const save=()=>writeFile(new URL('browser-results.json',out),JSON.stringify(report,null,2)+'\n');
for(const viewport of (process.env.JOHANSSON_AUDIT_VIEWPORTS||'desktop,phone').split(',')){
 const entry=viewport==='phone'?'ramen':'izakaya',record={viewport,entry,checks:[],captures:[],walks:[]};report.viewports.push(record);
 const session=new TownAuditSession({launch:async options=>{
  const browser=await chromium.launch({...options,
   ...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),
   args:[...(options.args||[]),'--disable-dev-shm-usage',...(report.softwareGPU?['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[])],
  });
  const newContext=browser.newContext.bind(browser);
  browser.newContext=async options=>{const context=await newContext(options);await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));return context;};
  return browser;
 }});
 const modelState=()=>session.page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__,furniture=[],failures=[];
  a.scene.traverse(o=>{
   for(let p=o;p;p=p.parent)if(!p.visible)return;
   if(o.userData.walnutFurniture)furniture.push({name:o.name,kind:o.userData.walnutFurniture});
   if(o.userData.loadError)failures.push(o.name);
  });return {furniture,failures};
 });
 const capture=async(name,view)=>{
  await session.page.evaluate(view=>{const a=window.__JOHANSSON_AUDIT__;a.camera=view||null;a.hud.photo(true);a.render();},view);
  const file=viewport+'-'+name+'.png';await session.page.screenshot({path:new URL(file,out).pathname,timeout:60000});
  record.captures.push({file,...(view||{})});
  await session.page.evaluate(()=>window.__JOHANSSON_AUDIT__.hud.photo(false));
 };
 const walk=async(label,x,z)=>{
  const result=await session.walk({x,z,maxSeconds:14,tolerance:.20});
  record.walks.push({label,reached:result.reached,reason:result.reason,steps:result.steps});
  assert.equal(result.reached,true,'Normal movement reaches '+label);
  const lens=await session.page.evaluate(()=>window.__JOHANSSON_AUDIT__.lens);
  record.walks.at(-1).lens=lens;
  assert.equal(lens.blocked,false,'The walking camera remains outside solids at '+label);
 };
 const route=async points=>{for(const [label,x,z] of points)await walk(label,x,z);};
 const waitRoom=async id=>session.page.waitForFunction(id=>window.__JOHANSSON_AUDIT__.roomNavigation?.id===id&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading,id,{timeout:90000});
 const streetExit=async destination=>{
  const result=await session.ui({control:'exit_room'});assert.equal(result.accepted,true,'Exit is available at the physical '+destination+' door');
  await session.page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.roomNavigation===null,null,{timeout:30000});
  const state=await session.observe(),site=state.sites.find(s=>s.id===destination),other=state.sites.find(s=>s.id===(destination==='ramen'?'izakaya':'ramen'));
  const distance=s=>Math.hypot(state.game.player[0]-s.door[0],state.game.player[2]-s.door[2]);
  assert.ok(distance(site)<distance(other),'The physical '+destination+' door returns to its own street position');
  assert.equal(state.playerClearance.staticBlocked,false,'Street arrival is clear');
  record.checks.push(destination+' physical door exits to the matching clear street position');
 };
 try{
  console.log(viewport+': starting compiled game at '+entry);
  let startupTimer;
  try{await Promise.race([session.start({viewport,spawn:entry,time:entry==='ramen'?'12:30':'20:30',source:report.source}),new Promise((_,reject)=>{startupTimer=setTimeout(()=>reject(Error('Bounded game startup exceeded 240 seconds')),240000);})]);}
  finally{clearTimeout(startupTimer);}
  await waitRoom(entry);
  record.runtime=await session.page.evaluate(()=>fetch('./runtime/source.json').then(r=>r.json()));
  assert.deepEqual(record.runtime,report.runtime,'The compiled package belongs to this checkout');
  const ready=await modelState();assert.deepEqual(ready.failures,[]);assert.deepEqual(ready.furniture.map(p=>p.kind).sort(),['backbar','counter']);record.furniture=ready.furniture;
  const initial=await session.observe();assert.ok(initial.game.discoveries,'Saved Minato discoveries exist through either entry');
  assert.ok(initial.game.calendar,'The calendar exists through either entry');
  record.checks.push('one fitted cabinet/counter, saved discoveries and calendar through '+entry);
  await session.input({control:'forward',durationMs:34});
  assert.equal((await session.observe()).seated,false,'Forward stands from the opening seat');
  await session.wait({durationMs:1500});
  console.log(viewport+': fitted room loaded; capturing actual game renderer');
  await capture('entry',{pos:[.08,1.59,3.10],at:[-1.67,1.23,-1.40]});
  await capture('counter',{pos:[-3.66,1.55,1.06],at:[-1.38,1.27,-2.76]});
  await capture('sato',{pos:[3.72,1.60,3.02],at:[4.40,1.25,-.70]});
  await session.page.evaluate(()=>{window.__JOHANSSON_AUDIT__.camera=null;});
  if((await session.observe()).view.thirdPerson)await session.input({control:'view',durationMs:34});
  if(entry==='ramen')await route([['Sato customer aisle',3.0,1.65],['Sato counter end',3.0,-.55],['shared kitchen passage',2.47,-.80],['Minato counter end',1.25,-.80],['Minato customer aisle',1.25,.35],['Minato main aisle',0,1.05]]);
  else await route([['Minato customer aisle',-.6,.82],['Minato main aisle',0,1.05]]);
  await route([['WC approach',.30,2.25],['inside WC',1.45,2.35],['WC return',.30,2.25],['Minato entrance',0,2.75]]);
  await capture('first-person');
  await session.input({control:'view',durationMs:34});
  await session.page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(250));
  record.thirdPersonLens=await session.page.evaluate(()=>window.__JOHANSSON_AUDIT__.lens);
  assert.equal(record.thirdPersonLens.blocked,false,'Third-person camera clears the compact entrance');
  await capture('third-person');
  await session.input({control:'view',durationMs:34});
  record.checks.push('normal first-person walking reaches WC; third-person lens clears entrance');
  if(entry==='ramen')await streetExit('izakaya');
  else{
   await route([['return main aisle',0,1.05],['counter end',1.25,.35],['kitchen end',1.25,-.80],['shared passage',2.47,-.80],['Sato passage',3.0,-.55],['Sato side aisle',3.0,1.65],['Sato customer aisle',3.70,1.65],['Sato exit',3.70,2.88]]);
   await streetExit('ramen');
  }
  await session.page.evaluate(async id=>{await window.__JOHANSSON_AUDIT__.enter(id);window.__JOHANSSON_AUDIT__.render();},entry==='ramen'?'izakaya':'ramen');
  await waitRoom(entry==='ramen'?'izakaya':'ramen');
  assert.equal((await modelState()).furniture.length,2,'Re-entry retains exactly one cabinet and counter');
  record.checks.push('opposite entry reloads the same fitted room once');
  const end=await session.observe();assert.deepEqual(end.invalidTransforms,[]);
  assert.deepEqual((await modelState()).failures,[]);
  record.cancelledRequests=end.errors.filter(e=>e.type==='request'&&e.message.endsWith('net::ERR_ABORTED'));
  record.errors=end.errors.filter(e=>!record.cancelledRequests.includes(e));
  assert.deepEqual(record.errors,[],'No browser, shader or failed asset errors');
  record.renderInfo=await session.page.evaluate(()=>window.__JOHANSSON_AUDIT__.renderInfo);
  record.checks.push('no invalid transforms or browser/shader/HTTP errors');record.passed=true;
  console.log(viewport+': '+record.checks.length+' groups passed');
 }catch(error){
  record.passed=false;record.failure=error.message;record.errors=session.errors;
  if(session.page)try{record.failureState=await session.observe();await session.page.screenshot({path:new URL(viewport+'-failure.png',out).pathname,timeout:30000});}catch(diagnostic){record.diagnosticFailure=diagnostic.message;}
  console.error(error);process.exitCode=1;
 }finally{await save();await session.close();}
 if(!record.passed)break;
}
