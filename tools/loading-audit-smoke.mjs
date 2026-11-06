// Compiled-game WebKit smoke: a held real request cannot carry the bar past its step, then park views.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {webkit} from 'playwright';
import {PNG} from 'pngjs';
const out=resolve('docs/qa/loading-render-audit');await mkdir(out,{recursive:true});
const report={physicalDevice:false,engine:'Linux WebKit',views:[]};let failure;
const browser=await webkit.launch({headless:true,env:{...process.env,LIBGL_ALWAYS_SOFTWARE:'1'}});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,hasTouch:true,isMobile:true,serviceWorkers:'block',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'});
 const page=await context.newPage();page.setDefaultTimeout(120000);const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/WebGL|shader|framebuffer|INVALID_/i.test(m.text()))errors.push(m.text());});
 let release,requestSeen;const held=new Promise(resolve=>release=resolve),requested=new Promise(resolve=>requestSeen=resolve);let delayed=0;
 await page.route('**/assets/catalog/**',async route=>{if(new URL(route.request().url()).pathname.endsWith('.glb')){delayed++;requestSeen();await held;}await route.continue();});
 await page.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));});
 await page.goto('http://127.0.0.1:8765/johansson-town/?audit&spawn=park-bench',{waitUntil:'domcontentloaded'});
 // The island loads behind the title; START stays the bar until it is ready.
 await page.waitForFunction(()=>window.__JOHANSSON_LOADING__?.snapshot().label==='Loading character accessories');
 await Promise.race([requested,page.waitForTimeout(10000).then(()=>{throw Error('No catalog model request reached the loading gate');})]);
 assert.ok(delayed>0,'A real model request is held');
 const pending=await page.evaluate(()=>({state:window.__JOHANSSON_LOADING__.snapshot()}));
 await page.waitForTimeout(900);
 const waiting=await page.evaluate(()=>({state:window.__JOHANSSON_LOADING__.snapshot()}));
 assert.equal(waiting.state.completed,pending.state.completed);assert.equal(waiting.state.target,pending.state.target,'Time alone cannot carry the bar past the running step');
 assert.ok(waiting.state.completed<waiting.state.total);report.heldRequest=waiting;
 assert.equal(await page.locator('#enter').isDisabled(),true,'START waits for the island');
 await page.screenshot({path:resolve(out,'measured-loading.png')});release();
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_LOADING__.snapshot().completed===window.__JOHANSSON_LOADING__.snapshot().total&&document.querySelector('#start').classList.contains('hidden'));
 report.completed=await page.evaluate(()=>window.__JOHANSSON_LOADING__.snapshot());
 assert.equal(report.completed.percent,100);
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.renderFrozen=true;a.setTime(720);a.teleport(12,-29.8);a.camera={pos:[18,2.3,-21],at:[11,1.2,-31]};a.render();});
 await page.addStyleTag({content:'#hud,#activity,#directory,#mobile{visibility:hidden!important}'});
 const capture=async label=>{
  const state=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,r=a.renderer;a.render();const look=window.__JOHANSSON_LOOK__;return {ink:look.ink,effects:look.state,buffer:[r.domElement.width,r.domElement.height],shadows:r.shadowMap.enabled,gpuError:r.getContext().getError()};});
  assert.equal(state.ink,true);assert.equal(state.effects.fxaa,true);assert.equal(state.gpuError,0);assert.ok(state.buffer[0]*state.buffer[1]<=2.4e6);assert.equal(state.shadows,false,'phones draw the 16 October look: no shadow map');
  const path=resolve(out,label+'.png');await page.locator('#game').screenshot({path});
  const png=PNG.sync.read(await readFile(path));let minimum=255,maximum=0;const colours=new Set();
  for(let i=0;i<png.data.length;i+=64){const rgb=[...png.data.subarray(i,i+3)];minimum=Math.min(minimum,...rgb);maximum=Math.max(maximum,...rgb);colours.add(rgb.join(','));}
  assert.ok(maximum-minimum>96&&colours.size>32,label+' must contain a drawn scene, not a cleared drawing buffer');
  report.views.push({label,...state,image:{minimum,maximum,colours:colours.size}});console.log('Captured',label);
 };
 await capture('park-portrait');assert.ok(report.views[0].buffer[0]*report.views[0].buffer[1]>600000,'Use the existing pixel budget instead of a fixed 1x picture');
 await page.setViewportSize({width:844,height:390});
 await page.waitForFunction(()=>{const canvas=document.querySelector('#game');return canvas.width>canvas.height;});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await capture('park-landscape');assert.ok(report.views[1].buffer[0]>report.views[1].buffer[1],'Landscape evidence must use the resized drawing buffer');
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;await a.enter('market');a.setTime(1260);a.camera={pos:[2,1.8,4],at:[0,1.1,-4]};a.render();});
 await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);await capture('sakura-interior');
 assert.deepEqual(errors,[]);await context.close();
}catch(error){failure=error;report.failure=error.stack;}
finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
if(failure)throw failure;
