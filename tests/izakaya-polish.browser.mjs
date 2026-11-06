import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {TownAuditSession} from '../tools/mcp/session.mjs';

const out=new URL('../docs/qa/izakaya-polish/',import.meta.url);await mkdir(out,{recursive:true});
const report=[];
for(const viewport of ['desktop','phone']){
 const s=new TownAuditSession({launch:async options=>{
  const browser=await chromium.launch(options),newContext=browser.newContext.bind(browser);
  browser.newContext=async options=>{
   const context=await newContext({...options,timezoneId:'Europe/Stockholm'});
   await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));
   await context.addInitScript(()=>{
    const NativeDate=Date;window.__calendarRealNow=NativeDate.parse('2026-10-05T21:59:59.000Z');
    window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[window.__calendarRealNow]));}static now(){return window.__calendarRealNow;}};
   });return context;
  };return browser;
 }});
 try{
  await s.start({viewport,spawn:'izakaya',time:'20:30'});
  await s.page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.roomNavigation?.id==='izakaya'&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
  await s.page.waitForLoadState('networkidle');
  await s.page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.scene.getObjectByName('barfly')?.userData.ready===true);
  const calendar=()=>s.page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,m=a.scene.getObjectByName('Future Calendar')?.children.find(o=>o.isMesh&&o.name==='Future Calendar');return {...m.userData,textureVersion:m.material.map.version,position:m.getWorldPosition(m.position.clone()).toArray()};});
  const before=await calendar();assert.equal(before.dateKey,'2026-10-05');assert.equal(before.title,'Future Calendar');
  assert.ok(before.position[0]<-5.5&&before.position[2]>6.2,'Calendar moved to the lounge wall');
  // Frozen MCP play and an open modal both leave the real calendar running.
  await s.ui({control:'town_menu'});
  await s.page.evaluate(()=>{window.__calendarRealNow=Date.parse('2026-10-05T22:00:00.000Z');});
  await s.page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.scene.getObjectByName('Future Calendar')?.children.find(o=>o.isMesh&&o.name==='Future Calendar').userData.dateKey==='2026-10-06');
  const midnight=await calendar();assert.equal(midnight.textureVersion,before.textureVersion+1);assert.equal(midnight.highlightedDay,6);
  await s.ui({control:'close_directory'});
  await s.page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(180);a.step(20000);a.render();});
  assert.equal((await calendar()).dateKey,'2026-10-06','Advancing the simulated town clock cannot change the real date');
  // Restore today for the review captures, with real props and normal room lighting.
  await s.page.evaluate(()=>{window.__calendarRealNow=Date.parse('2026-10-05T12:00:00Z');window.__JOHANSSON_AUDIT__.setTime(1230);window.__JOHANSSON_AUDIT__.step(1000);});
  await s.input({control:'forward',durationMs:17});
  await s.wait({durationMs:6000});
  const views=[
   {name:'room',pos:[.0,2.25,5.15],at:[-.8,1.1,-2.5]},
   {name:'lounge',pos:[-1.9,2.45,2.9],at:[-5.35,1.7,5.15]},
   {name:'table',pos:[-.5,2.15,3.55],at:[-3.5,.95,2.2]},
   {name:'calendar',pos:[-5.55,2.03,4.35],at:[-5.55,2.03,6.25]},
  ];
  for(const view of views){
   await s.page.evaluate(({pos,at})=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos,at};a.render();},view);
   await s.page.screenshot({path:new URL(viewport+'-'+view.name+'.png',out).pathname});
  }
  const scene=await s.page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,names=[];a.scene.traverse(o=>{if(o.isMesh&&/Minato worn|Minato everyday/.test(o.name))names.push(o.name);});return {names,info:a.renderInfo};});
  const state=await s.observe();assert.deepEqual(state.invalidTransforms,[]);
  const cancellations=state.errors.filter(e=>e.type==='request'&&e.message.startsWith(s.preview.url)&&e.message.endsWith('net::ERR_ABORTED'));
  const errors=state.errors.filter(e=>!cancellations.includes(e));
  const loadErrors=await s.page.evaluate(()=>{const bad=[];window.__JOHANSSON_AUDIT__.scene.traverse(o=>{if(o.userData.loadError){let visible=true;for(let p=o;p;p=p.parent)if(!p.visible)visible=false;if(visible)bad.push(o.name);}});return bad;});
  assert.deepEqual(loadErrors,[],'Every visible asset loaded');
  assert.deepEqual(errors,[],'No browser, shader or asset errors');
  assert.equal(scene.names.filter(n=>n.startsWith('Minato worn')).length,3);
  await s.page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.leave();await a.enter('izakaya');a.render();});
  const calendarCount=await s.page.evaluate(()=>{let count=0;window.__JOHANSSON_AUDIT__.scene.traverse(o=>{if(o.isMesh&&o.name==='Future Calendar')count++;});return count;});
  assert.equal(calendarCount,1,'Re-entering rebuilds one calendar without stale instances');
  report.push({viewport,before,midnight,scene,calendarCount,errors,cancellations});console.log(viewport+' calendar and room passed');
 }finally{await s.close();}
}
await writeFile(new URL('results.json',out),JSON.stringify(report,null,2)+'\n');
