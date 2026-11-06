// The published game, with its actual room loader, materials, lights and ink pass.
// Run after npm run build:runtime. Optional environment: CHROMIUM_EXECUTABLE,
// JOHANSSON_SWIFTSHADER=1 (software GPU), JOHANSSON_AUDIT_SOURCE=1 (local iteration).
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {TownAuditSession} from '../tools/mcp/session.mjs';

const out=new URL('../docs/qa/izakaya-backbar/',import.meta.url);
await mkdir(out,{recursive:true});
const report={source:process.env.JOHANSSON_AUDIT_SOURCE==='1',softwareGPU:process.env.JOHANSSON_SWIFTSHADER==='1',viewports:[]};
report.runtime=JSON.parse(await readFile(new URL('../runtime/source.json',import.meta.url),'utf8'));
const save=()=>writeFile(new URL('browser-results.json',out),JSON.stringify(report,null,2)+'\n');
const changedPixels=(a,b)=>{
 const x=PNG.sync.read(a),y=PNG.sync.read(b);assert.equal(x.width,y.width);assert.equal(x.height,y.height);
 let changed=0;for(let i=0;i<x.data.length;i+=4)if([0,1,2].some(c=>Math.abs(x.data[i+c]-y.data[i+c])>3))changed++;
 return {changed,total:x.width*x.height,width:x.width,height:x.height};
};
for(const viewport of ['desktop','phone']){
 const record={viewport,checks:[],captures:[],walks:[]};report.viewports.push(record);
 const session=new TownAuditSession({launch:async options=>{
  const browser=await chromium.launch({...options,
   ...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),
   args:[...(options.args||[]),'--disable-dev-shm-usage',...(report.softwareGPU?['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[])],
  });
  const original=browser.newContext.bind(browser);
  browser.newContext=async options=>{
   const context=await original(options);
   // No external fonts are required by the game or the new bottle atlas.
   await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));
   return context;
  };return browser;
 }});
 const camera=async view=>session.page.evaluate(({pos,at})=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos,at};a.render();},view);
 const capture=async(name,view)=>{
  await camera(view);const filename=viewport+'-'+name+'.png';
  await session.page.screenshot({path:new URL(filename,out).pathname,timeout:60000});
    record.captures.push({file:filename,...view});
 };
 const furniture=()=>session.page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__,roots=[],errors=[];
  a.scene.traverse(o=>{
   let visible=true;for(let p=o;p;p=p.parent)if(!p.visible)visible=false;
   if(visible&&o.userData.walnutFurniture)roots.push({name:o.name,kind:o.userData.walnutFurniture,position:o.position.toArray()});
   if(visible&&o.userData.loadError)errors.push(o.name);
  });return {roots,errors};
 });
 try{
  console.log(viewport+': starting published game');
  await session.start({viewport,spawn:'izakaya',time:'20:30',source:report.source});
  record.runtime=await session.page.evaluate(()=>fetch('./runtime/source.json').then(r=>r.json()));
  assert.deepEqual(record.runtime,report.runtime,'The browser serves this checkout’s compiled package');
  await session.page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.roomNavigation?.id==='izakaya'&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
  await session.page.waitForLoadState('networkidle',{timeout:90000});
  await session.page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.scene.getObjectByName('barfly')?.userData.ready===true,null,{timeout:90000});
  const ready=await furniture();assert.deepEqual(ready.errors,[]);assert.equal(ready.roots.length,2);
  console.log(viewport+': complete room loaded');
  assert.deepEqual(ready.roots.map(x=>x.kind).sort(),['backbar','counter']);record.furniture=ready.roots;
  record.checks.push('one complete shelf and counter; every visible model loaded');
  await session.input({control:'forward',durationMs:34});
  assert.equal((await session.observe()).seated,false,'The normal forward control stands from the counter');
  await session.wait({durationMs:7000});
  const hero=viewport==='phone'?{pos:[.7,1.65,1.5],at:[-2.4,1.35,-5.8]}:{pos:[-.6,1.85,.8],at:[-2.6,1.45,-5.8]};
  const close={pos:[-2.875,1.62,viewport==='phone'?-2.5:-4.0],at:[-2.875,1.43,-5.95]};
  await capture('room',hero);await capture('shelf',close);
  await capture('counter',{pos:[.2,1.45,1.2],at:[-.8,.65,-2.34]});
  await capture('overhead',{pos:[-.5,3.65,-.8],at:[-.8,.4,-3.8]});

  // Freeze simulation and compare the same fully loaded view twice. Camera changes
  // below are tested separately; this check catches unstable draws at a fixed view.
  await camera(close);await session.page.evaluate(()=>window.__JOHANSSON_AUDIT__.render());
  const first=await session.page.locator('#game').screenshot({timeout:60000});
  await session.page.evaluate(()=>window.__JOHANSSON_AUDIT__.render());
  const second=await session.page.locator('#game').screenshot({timeout:60000});
  record.fixedView=changedPixels(first,second);
  assert.equal(record.fixedView.changed,0,'No fixed-view pixels change by more than three colour levels');
  record.checks.push('fixed frozen view is pixel-stable');

  // Slow lateral and low grazing views of the actual meshes, for visual review.
  for(let i=0;i<7;i++){
   const t=i/6,pos=[-4.25+2.75*t,1.12+.5*t,-4.0-.32*Math.sin(t*Math.PI)];
   await capture('sweep-'+String(i).padStart(2,'0'),{pos,at:[-2.875,1.52,-5.82]});
  }
  record.checks.push('seven changing camera angles captured for shelf/label review');
  console.log(viewport+': views captured; fixed-view changed pixels = '+record.fixedView.changed);
  if(viewport==='desktop'){
   await session.page.evaluate(()=>{window.__JOHANSSON_AUDIT__.camera=null;});
   if((await session.observe()).view.thirdPerson)await session.input({control:'view',durationMs:34});
   // Thao stands at [3.5,-3.8]. Pass behind her 0.63 m combined collision
   // radius, instead of asking the normal walking controls to walk through her.
   for(const [label,x,z] of [['customer aisle',-3.8,-.5],['counter end',3.95,-.5],['kitchen passage',4.15,-4.1],['clear staff aisle',4.15,-4.7],['behind Thao',-2.875,-4.7],['back bar approach',-2.875,-4.4]]){
    const result=await session.walk({x,z,maxSeconds:16,tolerance:.22});
    record.walks.push({label,reached:result.reached,reason:result.reason,steps:result.steps});
    assert.equal(result.reached,true,'Normal walking reaches '+label);
   }
   record.checks.push('normal keyboard movement clears the counter and shared kitchen');
   // The ordinary Exit control appears at the door, not from behind the bar.
   // Pass east of Thao, then step west before the raised koagari starts at Z=-.9.
   for(const [label,x,z] of [['return staff aisle',4.3,-4.7],['kitchen end',4.3,-1.6],['clear koagari corner',3.95,-1.6],['return counter end',3.95,-.5],['central aisle',0,-.5],['entrance',0,5.2]]){
    const result=await session.walk({x,z,maxSeconds:16,tolerance:.22});
    record.walks.push({label,reached:result.reached,reason:result.reason,steps:result.steps});
    assert.equal(result.reached,true,'Normal walking reaches '+label);
   }
   const departure=await session.ui({control:'exit_room'});
   assert.equal(departure.accepted,true,'The normal Exit control is available at the entrance');
   await session.page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.roomNavigation===null,null,{timeout:30000});
   assert.equal((await session.observe()).game.room,null,'The normal exit returns to the street');
   await session.page.evaluate(async()=>{await window.__JOHANSSON_AUDIT__.enter('izakaya');window.__JOHANSSON_AUDIT__.render();});
   await session.page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.roomNavigation?.id==='izakaya'&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
   assert.equal((await furniture()).roots.length,2,'Re-entry creates one of each piece');
   record.checks.push('normal exit and shared-loader re-entry retain exactly one of each piece');
  }
  const state=await session.observe();assert.deepEqual(state.invalidTransforms,[]);
  assert.deepEqual((await furniture()).errors,[],'No visible asset reports a load failure');
  const cancelled=e=>e.type==='request'&&e.message.endsWith('net::ERR_ABORTED');
  record.cancelledRequests=state.errors.filter(cancelled);record.errors=state.errors.filter(e=>!cancelled(e));
  assert.deepEqual(record.errors,[],'No browser, shader or failed HTTP asset responses');
  record.checks.push('no invalid transforms or browser/shader/HTTP errors');record.passed=true;
  console.log(viewport+': '+record.checks.length+' checks passed');
 }catch(error){
  record.passed=false;record.failure=error.message;record.errors=session.errors;
  if(session.page)try{
   record.failureState=await session.observe();
   record.navigation=await session.page.evaluate(()=>{
    const a=window.__JOHANSSON_AUDIT__,[x,,z]=a.player.position;
    return [-.3,0,.3].flatMap(dx=>[-.3,0,.3].map(dz=>a.navigation(x+dx,z+dz)));
   });
   await session.page.screenshot({path:new URL(viewport+'-failure.png',out).pathname,timeout:60000});
  }catch(diagnostic){record.diagnosticFailure=diagnostic.message;}
  console.error(error);process.exitCode=1;
 }
 finally{await save();await session.close();}
 if(!record.passed)break;
}
