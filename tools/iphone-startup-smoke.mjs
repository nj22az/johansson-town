// Run in CI with WebKit/Mesa and an iPhone profile; this does not model iOS process limits.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {webkit,chromium,devices} from 'playwright';
import {checkFerryExploration} from './ferry-exploration-check.mjs';

const site=resolve(new URL('../..',import.meta.url).pathname);
const out=resolve(process.env.IPHONE_OUTPUT||resolve(site,'johansson-town/output/iphone-startup'));
await mkdir(out,{recursive:true});
const engine=process.env.IPHONE_ENGINE||'webkit';
const report={engine,profile:'iPhone 13',physicalDevice:false,notes:['Desktop WebKit/Chromium with iPhone viewport, DPR, touch and user agent. Not physical iOS Safari or its memory limits.'],steps:[],errors:[],consoleErrors:[],failedRequests:[]};
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
  const file=resolve(site,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(site+'/'))throw Error('Outside repository');
  const body=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser,page,context;
const started=Date.now();
const step=(name,data={})=>{const item={name,seconds:+((Date.now()-started)/1000).toFixed(2),...data};report.steps.push(item);console.log(JSON.stringify(item));};
const state=()=>page.evaluate(()=>{
 const a=window.__JOHANSSON_AUDIT__,r=a?.renderer;
 return {running:!!window.__JOHANSSON_RUNNING__,safe:window.__JOHANSSON_SAFE_GRAPHICS__,loading:window.__JOHANSSON_LOADING__?.snapshot(),
  room:a?.roomNavigation?.id||null,blocked:a?.blocked,player:a?.player?.position,
  graphics:window.__JOHANSSON_LOOK__?.state,render:a?.renderInfo,frames:r?.info?.render?.frame,
  canvas:{width:document.querySelector('#game')?.width,height:document.querySelector('#game')?.height},
  fatal:document.querySelector('#fatal:not(.hidden)')?.textContent,
  launch:JSON.parse(localStorage.getItem('johansson-loading-report-v1')||'null')};
});
const settleLoads=async()=>{
 await page.waitForLoadState('networkidle',{timeout:60000});
 await page.waitForFunction(()=>!window.__JOHANSSON_STREAMING__?.active&&!window.__JOHANSSON_AUDIT__?.blocked.roomLoading,null,{timeout:60000});
 // A completed model decode can start image/media requests after the first idle observation.
 await page.waitForLoadState('networkidle',{timeout:60000});
};
const exitThroughDoor=async()=>{
 await settleLoads();
 const probeApproach=()=>page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__,nav=a.roomNavigation;
  const diagnostic={navigation:nav,player:a.player,layout:{bounds:a.layout?.bounds,spawn:a.layout?.spawn,exit:a.layout?.exit},candidates:[]};
  if(!nav)return {...diagnostic,error:'No current room to exit'};
  const exit=nav.exit,spawn=nav.spawn,dx=spawn[0]-exit[0],dz=spawn[2]-exit[2],length=Math.hypot(dx,dz);
  if(!length)return {...diagnostic,error:'No authored inward doorway direction for '+nav.id};
  const candidates=[spawn,...[.65,.85,1.05,1.2].flatMap(d=>[0,-.2,.2].map(side=>[
   exit[0]+dx/length*d-dz/length*side,spawn[1],exit[2]+dz/length*d+dx/length*side]))];
  diagnostic.candidates=candidates.map(standing=>{
   const probe=a.navigation(standing[0],standing[2]),distance=Math.hypot(standing[0]-exit[0],standing[2]-exit[2]);
   const exitSite=a.layout.exitSiteAt?.(standing[0],standing[2])??null;
   return {standing,distance,probe,exitSite,clear:distance<1.3&&!probe.staticBlocked&&!probe.residentBlocked&&(!a.layout.exitSiteAt||exitSite===nav.id)};
  });
  const blockers=new Set(diagnostic.candidates.flatMap(c=>c.probe.residents));
  diagnostic.blockingResidents=[...a.world.people.map(p=>p.g),...(a.world.neighbours||[])]
   .filter(g=>blockers.has(g.userData.name||g.name)).map(g=>({name:g.userData.name||g.name,
    position:g.position.toArray(),worldPosition:g.getWorldPosition(g.position.clone()).toArray(),parent:g.parent?.name,
    visible:g.visible,inIzakaya:g.userData.inIzakaya??false,inRamen:g.userData.inRamen??false,
    indoors:g.userData.indoors??null,activity:g.userData.activity??null,roomTransition:g.userData.roomTransition??null}));
  const at=diagnostic.candidates.find(p=>p.clear)?.standing;
  if(!at)return {...diagnostic,error:'No clear standing point inside the authored '+nav.id+' exit'};
  a.camera=null;a.stand(...at,Math.atan2(at[0]-exit[0],at[2]-exit[2]));a.hud.photo(false);a.hud.wake();a.step(0);
  return {...diagnostic,room:nav.id,exit,standing:at,probe:a.navigation(at[0],at[2])};
 });
 const began=Date.now();let approach=await probeApproach(),attempts=1;
 const firstBlockers=approach.blockingResidents;
 // Guests arrive through this same doorway. Give ordinary traffic a bounded chance to move,
 // reusing every native collision/resident/site predicate; a permanently blocked exit still fails.
 while(approach.error&&approach.candidates.length&&Date.now()-began<10000){
  await new Promise(resolve=>setTimeout(resolve,250));approach=await probeApproach();attempts++;
 }
 approach.wait={milliseconds:Date.now()-began,attempts,firstBlockers};
 if(approach.error){report.exitApproachFailure=approach;step('authored dining exit approach failed',approach);assert.fail(approach.error);}
 step('approach authored dining exit',approach);
 // The actual context control is offered only near a door. Do not force a hidden/disabled control.
 await page.waitForFunction(()=>{const b=document.querySelector('#exitRoomButton');return b&&!b.hidden&&!b.disabled&&b.getClientRects().length>0&&!document.querySelector('#contextActions').hidden;},null,{timeout:30000});
 const hit=await page.evaluate(()=>{const b=document.querySelector('#exitRoomButton'),r=b.getBoundingClientRect(),target=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {buttonContainsTarget:b.contains(target),target:target?.id||target?.tagName};});
 step('native dining exit hit target',hit);assert.equal(hit.buttonContainsTarget,true,'The visible exit receives touches: '+JSON.stringify(hit));
 await page.locator('#exitRoomButton').tap();
 await page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.roomNavigation===null,null,{timeout:30000});
 await settleLoads();
};
const boot=async(reload=false,natural=false)=>{
 // Finish this page's detail decodes before a planned reload. WebKit otherwise
 // reports the outgoing document's cancelled blob texture as an access-control error.
 // Keep all error assertions: no message is filtered out or discarded.
 if(report.steps.length){
  await settleLoads();
 }
 if(reload)await page.reload({waitUntil:'domcontentloaded'});
 else await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/${natural?'':'?audit&spawn=ferry&cinematic=off'}`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__JOHANSSON_LOADING__?.snapshot().ready||window.__JOHANSSON_LOADING__?.snapshot().error,null,{timeout:240000});
 const ready=await state();assert.equal(ready.loading?.error,null,JSON.stringify(ready));
 await page.locator('#enter').tap();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_LOADING__?.snapshot().completed===10&&!window.__JOHANSSON_AUDIT__?.blocked.catchingUp,null,{timeout:180000});
 const playing=await state();
 assert.equal(playing.fatal,undefined,'No fatal overlay after START');
 assert.equal(playing.graphics?.ink,true,'Every launch retains the cartoon ink pass');
 assert.equal(playing.graphics?.grade,true,'Every launch retains the cartoon colour grade');
 assert.equal(playing.graphics?.hdr,true,'Every launch retains HDR');
 assert.equal(playing.graphics?.samples,4,'Every launch retains four-sample antialiasing');
};
const checkRoomLifetime=async()=>{
 const saved=await page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__,d=document.documentElement.dataset;
  const value={frozen:a.frozen,camera:a.camera??null,hasRenderFrozen:Object.hasOwn(a,'renderFrozen'),renderFrozen:a.renderFrozen??null,
   hasMenu:Object.hasOwn(d,'desktopMenu'),menu:d.desktopMenu??null};
  a.frozen=true;a.renderFrozen=true;return value;
 });
 const settle=settleLoads;
 const streamState=()=>page.evaluate(()=>{const s=window.__JOHANSSON_STREAMING__;return {active:s.active,loaded:[...s.loaded].sort(),failed:[...s.failed].sort(),retries:s.retries};});
 const resources=value=>({textures:value.render.textures,geometries:value.render.geometries,releasedCanvases:value.render.releasedCanvases});
 const exteriorState=()=>page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:[8,2,-21],at:[-12,1.6,-27.3]};a.render();return {
  roomChildren:a.room.children.length,roomVisible:a.room.visible,portalBytes:window.__JOHANSSON_SHOP_VIEW__.cacheBytes,
  gpuError:a.renderer.getContext().getError(),render:a.renderInfo};});
 const visit=async(venue,phase,cycle)=>{
  await page.evaluate(async id=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;if(id==='sakura-office')await a.enterInside(id);else await a.enter(id);},venue);
  await page.waitForFunction(id=>window.__JOHANSSON_AUDIT__.roomNavigation?.id===id&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading,venue,{timeout:120000});
  await settle();
  // Exercise real street-window passes and room uploads from the same fixed views on every visit.
  await page.evaluate(async id=>{
   const a=window.__JOHANSSON_AUDIT__,views=id==='sakura-office'
    ?[{pos:[3.2,1.7,2.5],at:[3.2,1.7,4.55]},{pos:[4.6,1.7,3],at:[6.4,1.7,3]},{pos:[3.2,1.7,3],at:[3.2,1.7,.55]},
     {pos:[-.65,1.6,.8],at:[-2,.85,.55]}] // The hall's printed cases upload their second shared atlas too.
    :[{pos:[0,1.7,0],at:[0,1.6,7]},{pos:[0,1.7,2],at:[0,1.5,-3]}];
   for(const view of views){a.camera=view;a.render();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}
  },venue);
  const indoor=await state();assert.equal(indoor.fatal,undefined);assert.equal(indoor.running,true);
  await settle(); // Finish requests triggered by the rendered room/TV before intentionally disposing it.
  await page.evaluate(async()=>{
   // This frozen resource loop deliberately invokes the real leaveRoom lifecycle directly;
   // the live dining-door button is exercised separately before freezing the simulation.
   const a=window.__JOHANSSON_AUDIT__;a.leave();a.camera={pos:[8,2,-21],at:[-12,1.6,-27.3]};a.render();
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  });
  // Warm-up exits may expose a different street detail radius. Finish those loads before sampling too.
  await settle();
  const exterior=await exteriorState();
  assert.equal(exterior.roomChildren,0,venue+' exit releases room objects');assert.equal(exterior.roomVisible,false,venue+' exit hides the empty room');
  assert.equal(exterior.portalBytes,0,venue+' exit releases private window index buffers');
  assert.equal(exterior.gpuError,0,venue+' exit leaves no graphics error');
  const exited=await state();assert.equal(exited.fatal,undefined);assert.equal(exited.running,true);
  assert.equal(exited.graphics?.ink,true);assert.equal(exited.graphics?.grade,true);assert.equal(exited.graphics?.hdr,true);assert.equal(exited.graphics?.samples,4);
  for(const key of ['textures','geometries','releasedCanvases'])assert.ok(Number.isFinite(exterior.render[key]),'Resource diagnostic '+key+' is available');
  const sample={phase,cycle,venue,indoor:indoor.render,exterior,stream:await streamState()};
  step('room resource '+phase+' '+cycle+' '+venue,sample);return sample;
 };
 try{
  await settle();
  // Warm every venue before establishing its post-exit baseline. The second pass includes any shared
  // resources first requested by the other venue, so their first allocation cannot look like a leak.
  const warmups=[];
  for(let cycle=0;cycle<2;cycle++)for(const venue of ['sakura-office','izakaya'])warmups.push(await visit(venue,'warmup',cycle));
  await settle();const streaming=await streamState();assert.equal(streaming.active,null);
  // Frozen audit frames still update the detail streamer. Pause the existing main loop only after its
  // work settles, then drive the real renderer explicitly; this prevents unrelated detail arrivals
  // from changing resource counts during the bounded comparison. Restore the previous pause state below.
  await page.evaluate(()=>{document.documentElement.dataset.desktopMenu='open';window.__JOHANSSON_AUDIT__.renderFrozen=false;});
  // Baselines are fresh matching venue visits AFTER the entire warm-up and stream freeze.
  // The same exterior camera can retain a different bounded state after each doorway; compare like with like.
  const settledExterior=await exteriorState();
  assert.equal(settledExterior.roomChildren,0);assert.equal(settledExterior.roomVisible,false);assert.equal(settledExterior.portalBytes,0);
  assert.equal(settledExterior.gpuError,0,'The settled exterior has no graphics error');
  const baselines={};report.roomLifetime={warmupCycles:2,checkedCycles:3,warmups,settledExterior,baselines,cycles:[]};
  for(const venue of ['sakura-office','izakaya']){
   baselines[venue]=await visit(venue,'baseline',0);
   assert.deepEqual(baselines[venue].stream,streaming,'No concurrent detail loads during the matching baseline pass');
  }
  for(let cycle=0;cycle<3;cycle++)for(const venue of ['sakura-office','izakaya']){
   const sample=await visit(venue,'check',cycle);report.roomLifetime.cycles.push(sample);
  }
  const base=Object.fromEntries(Object.entries(baselines).map(([venue,sample])=>[venue,resources(sample.exterior)]));
  report.roomLifetime.growth=report.roomLifetime.cycles.map(sample=>({cycle:sample.cycle,venue:sample.venue,
   delta:Object.fromEntries(Object.entries(resources(sample.exterior)).map(([key,value])=>[key,value-base[sample.venue][key]]))}));
  step('room resource growth after all checked cycles',{baseline:base,growth:report.roomLifetime.growth});
  for(const sample of report.roomLifetime.cycles){
   assert.deepEqual(sample.stream,streaming,'No concurrent detail loads during the resource comparison');
   const actual=resources(sample.exterior),baseline=base[sample.venue];
   for(const key of Object.keys(actual))assert.ok(actual[key]<=baseline[key],sample.venue+' retains '+key+' after warm-up: '+JSON.stringify({cycle:sample.cycle,baseline,actual}));
  }
 }finally{
  await page.evaluate(value=>{
   const a=window.__JOHANSSON_AUDIT__,d=document.documentElement.dataset;
   a.camera=value.camera;a.frozen=value.frozen;if(value.hasRenderFrozen)a.renderFrozen=value.renderFrozen;else delete a.renderFrozen;
   if(value.hasMenu)d.desktopMenu=value.menu;else delete d.desktopMenu;a.render();
  },saved);
 }
};
// Exercise the production ferry through its real frame loop, GLB request and camera controls.
const checkFerryRoom=()=>checkFerryExploration({page,out,step,settleLoads,touch:true,profile:'phone'});

try{
 browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:false}:{headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block',recordVideo:{dir:resolve(out,'recordings'),size:{width:744,height:1133}}});
 await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));
 await context.addInitScript(()=>{
  if(!localStorage.getItem('johansson-town-clock'))localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:20',speed:1}));
  Element.prototype.requestFullscreen=async()=>{};
  // Exercise a real context loss at the first loading yield, before town construction.
  if(localStorage.getItem('iphone-test-early-loss')==='1'){
   localStorage.removeItem('iphone-test-early-loss');
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(kind,...args){
    const gl=original.call(this,kind,...args);
    if(this.id==='game'&&kind==='webgl2'&&gl&&!window.__IPHONE_CONTEXT_TEST__){
     const extension=gl.getExtension('WEBGL_lose_context');
     const result=window.__IPHONE_CONTEXT_TEST__={supported:!!extension,lost:0,restored:0,prevented:false};
     if(extension){
      this.addEventListener('webglcontextlost',event=>{
       result.lost++;
       queueMicrotask(()=>{result.prevented=event.defaultPrevented;setTimeout(()=>extension.restoreContext(),300);});
      });
      this.addEventListener('webglcontextrestored',()=>result.restored++);
      setTimeout(()=>extension.loseContext(),0);
     }
    }
    return gl;
   };
  }
 });
 page=await context.newPage();
 page.on('pageerror',error=>report.errors.push({message:error.message,stack:error.stack,seconds:+((Date.now()-started)/1000).toFixed(2),lastStep:report.steps.at(-1)?.name}));
 page.on('console',message=>{if(message.type()==='error')report.consoleErrors.push(message.text());});
 page.on('requestfailed',request=>report.failedRequests.push({url:request.url(),failure:request.failure()?.errorText}));
 page.on('crash',()=>report.errors.push('BROWSER PAGE CRASHED'));
 await boot();step('cold-start portrait',await state());
 await page.screenshot({path:resolve(out,'portrait.png')});
 const frame=(await state()).frames;
 await page.waitForFunction(before=>window.__JOHANSSON_AUDIT__.renderer.info.render.frame>before+20,frame,{timeout:60000});
 step('live frame loop advances',await state());
 await page.setViewportSize({width:844,height:390});
 await page.waitForFunction(()=>document.querySelector('#game').width>document.querySelector('#game').height);
 step('landscape',await state());await page.screenshot({path:resolve(out,'landscape.png')});
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>document.querySelector('#game').height>document.querySelector('#game').width);
 await boot(true);step('warm reload',await state());
 await checkFerryRoom();
 // Existing audit entry calls the same enterRoom path as the door. No mocked renderer/scene.
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(4*1440+20*60+30);await a.enter('izakaya');});
 await page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.roomNavigation?.id==='izakaya'&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading,null,{timeout:120000});
 const room=await state();assert.equal(room.running,true);assert.equal(room.fatal,undefined);step('entered Izakaya',room);
 await page.screenshot({path:resolve(out,'izakaya.png')});
 // Exercise the combined CAD, resource-lifetime and poster revision: both dining
 // doors, an actual exit, re-entry, then the upstairs office. A successful first
 // entry alone misses disposed/shared textures and old room resources on return.
 for(const id of ['ramen','izakaya']){
  await exitThroughDoor();
  await page.evaluate(async id=>window.__JOHANSSON_AUDIT__.enter(id),id);
  await page.waitForFunction(id=>window.__JOHANSSON_AUDIT__.roomNavigation?.id===id&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading,id,{timeout:120000});
  const entered=await state(),before=entered.frames;
  await page.waitForFunction(before=>window.__JOHANSSON_AUDIT__.renderer.info.render.frame>before+10,before,{timeout:60000});
  assert.equal(entered.running,true);assert.equal(entered.fatal,undefined);
  step(id==='ramen'?'Sato door after Izakaya exit':'Izakaya re-entry after Sato exit',entered);
 }
 await exitThroughDoor();
 await page.evaluate(async()=>window.__JOHANSSON_AUDIT__.enterInside('sakura-office'));
 await page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.roomNavigation?.id==='sakura-office'&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading,null,{timeout:120000});
 const officePrints=await page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__,slots=[{name:'UMINEKO Black',at:[1.18,1.5,3.25]},{name:'KITANO 12 pure malt',at:[5.15,1.5,3.2]}];
  return slots.map(({name,at})=>({name,present:a.targets.some(t=>t.label==='Look at '+name+' poster'&&t.position.every((v,i)=>Math.abs(v-at[i])<1e-5))}));
 });
 assert.equal(officePrints.every(p=>p.present),true,'Both selected office posters have their real Look prompts');
 step('Sakura upstairs office with the two selected posters',{prints:officePrints,...await state()});
 await page.screenshot({path:resolve(out,'sakura-office.png')});
 for(const [name,x] of [['umineko-black',1.18],['kitano-12',5.15]]){
  await page.evaluate(x=>{const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.camera={pos:[x,1.65,3.0],at:[x,2.3,4.49]};a.hud.photo(true);a.render();},x);
  await page.screenshot({path:resolve(out,'office-'+name+'.png')});
 }
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.hud.photo(false);a.frozen=false;});
 await settleLoads();
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.leave());
 await checkRoomLifetime();
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.activities.save());
 await boot(true);
 assert.equal(await page.evaluate(()=>window.__JOHANSSON_AUDIT__.activities.state.visited.includes('izakaya')),true,'Room discovery survives reload');
 step('saved room discovery survives reload',await state());
 await page.evaluate(()=>localStorage.setItem('iphone-test-early-loss','1'));
 await boot(true);
 const recovery=await page.evaluate(()=>window.__IPHONE_CONTEXT_TEST__);
 assert.equal(recovery.supported,true,'The simulation must expose real graphics loss');
 assert.equal(recovery.lost,1);assert.equal(recovery.prevented,true,'A loading-screen context loss must permit restoration');
 assert.equal(recovery.restored,1);assert.equal((await state()).graphics.hdr,true,'Full HDR/ink returns after restoration');
 step('real context loss during startup recovers',{recovery,...await state()});
 await page.screenshot({path:resolve(out,'restored-startup.png')});
 await page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__,now=new Date(),real=(now.getTime()-now.getTimezoneOffset()*60000)/60000;
  // Reproduce a twelve-hour return at any time of day, including after midnight.
  a.setTime(real-720);a.activities.state.clockAhead=0;a.activities.save();
  localStorage.setItem('johansson-town-clock',JSON.stringify({start:'real',speed:1}));
 });
 await boot(false,true);
 const natural=await state(),enteringMs=natural.loading.timings.frame.end-natural.loading.timings.frame.start;
 assert.ok(enteringMs<60000,'A twelve-hour return must not strand START for minutes: '+enteringMs+' ms');
 step('ordinary URL with twelve-hour absence and natural opening',{enteringMs,...natural});
 await page.screenshot({path:resolve(out,'natural-opening.png')});
 assert.deepEqual(report.errors,[],'No uncaught errors or page crash');
 assert.deepEqual(report.consoleErrors.filter(m=>/shader error|VALIDATE_STATUS|WebGL.*(?:error|lost)/i.test(m)),[],'No graphics errors');
 report.passed=true;
}catch(error){report.passed=false;report.failure=error.message;process.exitCode=1;
 if(page)try{report.failureState=await state();await page.screenshot({path:resolve(out,'failure.png'),timeout:15000});}catch(diagnostic){report.diagnosticFailure=diagnostic.message;}
}finally{
 console.log(JSON.stringify(report));await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 await context?.close();await browser?.close();await new Promise(resolve=>server.close(resolve));
}
