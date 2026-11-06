import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';

const url=process.argv[2]||'http://127.0.0.1:8766/johansson-town/';
const out=new URL('../../output/visual-audit/graphics-smoke/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const evidence={normal:{},audit:{},errors:[]};
try{
 for(const audit of [false,true]){
  const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(120000);
  const requests=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>evidence.errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));Object.defineProperty(navigator,'getGamepads',{value:()=>[]});Element.prototype.requestFullscreen=async()=>{};});
  const target=new URL(url);if(audit)target.searchParams.set('audit','');
  await page.goto(target.href);await page.locator('#enter').click();
  await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__,null,{timeout:240000});
  if(!audit){
   assert.equal(await page.evaluate(()=>typeof window.__JOHANSSON_GRAPHICS__),'undefined');
   assert.ok(!requests.some(r=>/spector/i.test(r)),'Ordinary visitors never download Spector');
   evidence.normal={inspectorAbsent:true,spectorRequests:0,ink:await page.evaluate(()=>window.__JOHANSSON_LOOK__.ink)};
   await page.screenshot({path:new URL('normal-town.png',out).pathname});
  }else{
   await page.waitForFunction(()=>window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
   const before=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.mouse);
   await page.mouse.move(640,400);await page.mouse.down({button:'right'});await page.mouse.move(720,440,{steps:5});await page.mouse.up({button:'right'});
   const after=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.mouse);
   assert.notEqual(after.yaw,before.yaw,'Normal right-mouse camera controls still work');
   await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;await a.enter('mayor-home');await window.__JOHANSSON_GRAPHICS__.enable();});
   await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
   await page.evaluate(async()=>{
    const a=window.__JOHANSSON_AUDIT__,g=window.__JOHANSSON_GRAPHICS__;window.__graphicsRetained=a;window.__graphicsBefore={room:JSON.parse(window.render_game_to_text()).room,decor:structuredClone(a.activities.state.homeDecor),player:a.activities.state.playerId};
    window.__graphicsCancelled=g.capture().then(()=>({cancelled:false}),error=>({cancelled:/lost/i.test(error.message),message:error.message}));
    await Promise.resolve();(window.__graphicsLose=a.renderer.getContext().getExtension('WEBGL_lose_context')).loseContext();
   });
   await page.waitForFunction(()=>!document.querySelector('#fatal').classList.contains('hidden'));
   const cancelled=await page.evaluate(()=>window.__graphicsCancelled);assert.equal(cancelled.cancelled,true,'Context loss rejects an in-flight Spector capture');
   await page.evaluate(()=>window.__graphicsLose.restoreContext());
   await page.waitForFunction(()=>document.querySelector('#fatal').classList.contains('hidden')&&window.__JOHANSSON_LOOK__.ink&&window.__JOHANSSON_GRAPHICS__.stats.ready);
   const retained=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;return {same:a===window.__graphicsRetained,before:window.__graphicsBefore,after:{room:JSON.parse(window.render_game_to_text()).room,decor:structuredClone(a.activities.state.homeDecor),player:a.activities.state.playerId}};});
   assert.equal(retained.same,true);assert.deepEqual(retained.after,retained.before);
   const captured=await page.evaluate(async()=>{const g=window.__JOHANSSON_GRAPHICS__,frame=await g.capture();return {commands:frame.commands.length,stats:g.stats};});
   assert.ok(captured.commands>0);assert.equal(captured.stats.captures,1);
   evidence.audit={cameraControls:true,cancelled,retained,captured,spectorRequests:requests.filter(r=>/spector/i.test(r)).length};
   await page.screenshot({path:new URL('restored-home.png',out).pathname});
  }
  await page.close();
 }
 assert.deepEqual(evidence.errors,[],'No uncaught browser errors');
 console.log('Graphics smoke passed: lazy loading, camera controls, capture cancellation and restored capture.');
}finally{await writeFile(new URL('report.json',out),JSON.stringify(evidence,null,2)+'\n');await browser.close();}
