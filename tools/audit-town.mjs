// Serve the repository root at port 8765 and install Playwright.
// node tools/audit-town.mjs [--entry-gate | --recovery | --outdoors [--night]]
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(new URL('../package.json',import.meta.url));
const {chromium}=require('playwright');
const out=new URL('../../output/acceptance/',import.meta.url);await mkdir(out,{recursive:true});
const night=process.argv.includes('--night');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const evidence=[];
try{
 for(const [width,height] of [[1280,800],[390,844]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<500});page.setDefaultTimeout(120000);
  const errors=[],graphicsErrors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/WebGL|framebuffer|shader|NaN|INVALID_/i.test(m.text()))graphicsErrors.push(m.text());});
  const network=[],pending=new Set();page.context().on('request',r=>{pending.add(r.url());network.push({event:'start',url:r.url()});});page.context().on('requestfinished',r=>{pending.delete(r.url());network.push({event:'done',url:r.url()});});page.context().on('requestfailed',r=>{pending.delete(r.url());network.push({event:'failed',url:r.url(),failure:r.failure()});});
  await page.addInitScript(start=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start,speed:1}));Object.defineProperty(navigator,'getGamepads',{value:()=>[]});Element.prototype.requestFullscreen=async()=>{};},night?'21:00':'12:00');
  if(process.argv.includes('--entry-gate')){
   let release;const gate=new Promise(r=>release=r);
   await page.route('**/loading-facts.js',async route=>{await gate;await route.continue();});
   const navigation=page.goto('http://127.0.0.1:8765/johansson-town/?audit');
   await page.locator('#enter').waitFor({state:'attached'});
   assert.equal(await page.locator('#enter').isDisabled(),true,'START waits for its launch dependency');
   await page.evaluate(()=>document.querySelector('#enter').click());
   assert.equal(await page.evaluate(()=>!!window.__JOHANSSON_BOOTING__),false,'Native disabled blocks an early click');
   release();await navigation;
  }else await page.goto('http://127.0.0.1:8765/johansson-town/?audit');
  await page.locator('#enter').click();
  await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading,null,{timeout:240000});
  console.log('Booted',width);
  const snapshot=async(label)=>{
   await page.waitForTimeout(400);
   const state=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,bad=[];a.scene.updateMatrixWorld(true);a.scene.traverse(o=>{if(!o.matrixWorld.elements.every(Number.isFinite))bad.push(o.name||o.type);});return {state:JSON.parse(window.render_game_to_text()),bad,ink:window.__JOHANSSON_LOOK__.ink,draws:a.renderer.info.render.calls};});
   assert.deepEqual(state.bad,[],'Finite transforms: '+label);assert.ok(state.draws>0);
   await page.screenshot({path:new URL(label+(night?'-night':'')+'-'+width+'.png',out).pathname});evidence.push({viewport:[width,height],label,night,...state});console.log('Captured',label,width);
  };
  await snapshot('street');
  if(process.argv.includes('--entry-gate')){assert.deepEqual(errors,[]);assert.deepEqual(graphicsErrors,[]);console.log('Delayed START passed',width);await page.close();continue;}
  if(process.argv.includes('--outdoors')){
   const views=[['rainflower',[90,111],[91,3.2,121],[90,1.1,103]],['garden',[-23.4,40.6],[-25,5,48],[-23.4,1,40.6]],['harbour-window',[-3,-28],[-2,2.2,-21],[-11,1.2,-28]]];
   const airport=await page.evaluate(async()=>{const {airportWorld}=await import('/johansson-town/src/world/airport-ground.js');return {a:airportWorld(-18,37),cam:airportWorld(-32,90),at:airportWorld(-7,58)};});
   views.push(['airport-junction',airport.a,[airport.cam[0],22,airport.cam[1]],[airport.at[0],1.1,airport.at[1]]]);
   for(const [label,at,pos,look] of views){
    await page.evaluate(({at,pos,look})=>{const a=window.__JOHANSSON_AUDIT__;a.teleport(...at);a.activities.menu('Audit view','',[]);document.querySelector('#activity').style.display='none';a.camera={pos,at:look};a.step(0);},{at,pos,look});
    await snapshot(label);
    await page.evaluate(()=>{window.__JOHANSSON_AUDIT__.activities.close();document.querySelector('#activity').style.display='';window.__JOHANSSON_AUDIT__.camera=null;});
   }
   assert.deepEqual(errors,[]);assert.deepEqual(graphicsErrors,[]);console.log('Outdoor views passed',width);await page.close();continue;
  }
  const homes=await page.evaluate(only=>window.__JOHANSSON_AUDIT__.sites.filter(s=>only?s.id==='mayor-home':/home/.test(s.id)),process.argv.includes('--recovery'));
  for(const s of homes){
   await page.evaluate(async id=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;await a.enter(id);a.camera={pos:[.15,1.8,2.25],at:[-.4,.8,-2.4]};},s.id);
   await page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.room.visible&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
   assert.equal(await page.evaluate(()=>JSON.parse(window.render_game_to_text()).room),s.id);
   await snapshot(s.id);
   if(s.id==='mayor-home'){
    // Decorating is Johansson Studio's (src/studio-handoff.js): what Studio sends, World shows at once.
    await page.evaluate(()=>{const studio=home=>{const key='johansson-town-studio',value=JSON.stringify({home});localStorage.setItem(key,value);dispatchEvent(new StorageEvent('storage',{key,newValue:value,storageArea:localStorage}));};studio({wall:'harbour',textile:'leaf',keepsake:'postcard'});});
    assert.equal(await page.evaluate(()=>window.__JOHANSSON_AUDIT__.use('Decorate your home')),false,'World has no Decorate your home');
    assert.equal(await page.evaluate(()=>window.__JOHANSSON_AUDIT__.layout.snapshot().decor.wall),'harbour');await snapshot('decorated-home');
   }
   await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.leave();});await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.room.visible);
  }
  await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;await a.enter('mayor-home');a.activities.state.quest=3;a.activities.state.fish=1;a.activities.state.kenjiEscort='done';a.activities.save();});
  await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
  await page.evaluate(()=>{const studio=home=>{const key='johansson-town-studio',value=JSON.stringify({home});localStorage.setItem(key,value);dispatchEvent(new StorageEvent('storage',{key,newValue:value,storageArea:localStorage}));};studio({...window.__JOHANSSON_AUDIT__.activities.state.homeDecor,keepsake:'cat'});});
  await snapshot('earned-keepsake');
  const before=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;window.__auditRetained=a;return {room:JSON.parse(window.render_game_to_text()).room,decor:a.activities.state.homeDecor,player:JSON.parse(window.render_game_to_text()).player};});
  await page.evaluate(()=>(window.__auditLoseExt=window.__JOHANSSON_AUDIT__.renderer.getContext().getExtension('WEBGL_lose_context')).loseContext());
  await page.waitForFunction(()=>document.querySelector('#fatal').classList.contains('hidden')===false);
  await page.evaluate(()=>window.__auditLoseExt.restoreContext());
  await page.waitForFunction(()=>document.querySelector('#fatal').classList.contains('hidden')&&window.__JOHANSSON_LOOK__.ink);
  const after=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;return {same:a===window.__auditRetained,room:JSON.parse(window.render_game_to_text()).room,decor:a.activities.state.homeDecor,player:JSON.parse(window.render_game_to_text()).player};});
  assert.equal(after.same,true,'Context restore retains game instance');assert.deepEqual({...after,same:undefined},{...before,same:undefined});await snapshot('context-restored');
  await page.reload();
  try{await page.locator('#enter').click({timeout:30000});await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp,null,{timeout:90000});}
  catch(e){await page.screenshot({path:new URL('reload-failure-'+width+'.png',out).pathname});const diagnostic=await page.evaluate(()=>({running:window.__JOHANSSON_RUNNING__,booting:window.__JOHANSSON_BOOTING__,blocked:window.__JOHANSSON_AUDIT__?.blocked,startup:window.__JOHANSSON_STARTUP__,look:window.__JOHANSSON_LOOK__,fatal:document.querySelector('#fatal')?.innerText,bootStatus:document.querySelector('#bootStatus')?.innerText,body:document.body.innerText.slice(-5000)}));await writeFile(new URL('reload-failure-'+width+'.json',out),JSON.stringify({diagnostic,errors,graphicsErrors,pending:[...pending],network},null,2));console.log('Reload diagnostic',JSON.stringify({diagnostic,errors,graphicsErrors,pending:[...pending]}));throw e;}
  await page.evaluate(async()=>window.__JOHANSSON_AUDIT__.enter('mayor-home'));await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
  assert.deepEqual(await page.evaluate(()=>window.__JOHANSSON_AUDIT__.activities.state.homeDecor),before.decor);await snapshot('saved-home');
  assert.deepEqual(errors,[],'Browser errors');assert.deepEqual(graphicsErrors,[],'GPU errors');console.log('Passed',width,homes.length,'homes and restore/reload');await page.close();
 }
}finally{await writeFile(new URL((process.argv.includes('--entry-gate')?'entry-gate-results':process.argv.includes('--recovery')?'recovery-results':process.argv.includes('--outdoors')?'outdoor-results':'results')+(night?'-night':'')+'.json',out),JSON.stringify(evidence,null,2));await browser.close();}
