import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';
import {webkit,chromium} from 'playwright';
const candidateOnly=process.argv.includes('--candidate-only');
const parkOnly=process.argv.includes('--park-only');
const out=resolve('docs/qa/october-11-look');await mkdir(out,{recursive:true});
const report={engine:'Linux WebKit',physicalDevice:false,reference:'716bc0c1309ef7d0392e5183d32b6b8a0151c5ad',views:[]};let failure;
const browser=process.env.CHROMIUM_EXECUTABLE?await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}):await webkit.launch({headless:true,env:{...process.env,LIBGL_ALWAYS_SOFTWARE:'1'}});
if(process.env.CHROMIUM_EXECUTABLE)report.engine='Linux Chromium / SwiftShader';
try{
 for(const [version,port] of (candidateOnly?[['restored',8765]]:[['reference',8766],['before',8767],['restored',8765]])){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:'block',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'});
  if(version==='restored')await context.addInitScript(()=>{if(!sessionStorage.getItem('look-migration-checked')){sessionStorage.setItem('johansson-safe-graphics-v1','1');sessionStorage.setItem('look-migration-checked','1');}});
  if(process.env.CHROMIUM_EXECUTABLE)await context.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:8765/')?r.continue():r.abort());
  const page=await context.newPage();page.setDefaultTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const enter=async()=>{await page.locator('#enter').click();await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__);await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.renderFrozen=true;a.teleport(12,-29.8);});};
  await page.goto(`http://127.0.0.1:${port}/johansson-town/?audit`,{waitUntil:'domcontentloaded'});await enter();
  if(version==='restored')await page.waitForFunction(()=>['park-onsen','harbour-park-bench'].every(id=>window.__JOHANSSON_STREAMING__.loaded.includes(id)));
  const capture=async(label,minutes,pos,at)=>{
   const state=await page.evaluate(({minutes,pos,at})=>{const a=window.__JOHANSSON_AUDIT__,look=window.__JOHANSSON_LOOK__;a.setTime(minutes);a.camera={pos,at};a.renderer.info.reset();a.render();return {ink:look.ink,effects:look.state,buffer:[a.renderer.domElement.width,a.renderer.domElement.height],safe:window.__JOHANSSON_SAFE_GRAPHICS__,gpuError:a.renderer.getContext().getError()};},{minutes,pos,at});
   assert.equal(state.ink,true);assert.equal(state.gpuError,0);
   if(version==='restored'){assert.equal(state.effects.hdr,true);assert.equal(state.effects.samples,4);assert.equal(state.effects.fxaa,true);assert.ok(state.buffer[0]*state.buffer[1]<=2.4e6);assert.equal(state.safe,false);}
   const path=resolve(out,version+'-'+label+'.png');await page.locator('#game').screenshot({path});const png=PNG.sync.read(await readFile(path));let sum=0,n=0,min=255,max=0;
   for(let i=0;i<png.data.length;i+=64){const v=(png.data[i]+png.data[i+1]+png.data[i+2])/3;sum+=v;n++;min=Math.min(min,v);max=Math.max(max,v);}
   assert.ok(max-min>90&&sum/n>8);report.views.push({version,label,mean:sum/n,...state});
  };
  if(parkOnly){
   const tree=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,t=a.scene.getObjectByName('Harbour Park cherry blossom');const p=t.getWorldPosition(t.position.clone());a.teleport(p.x-2.3,p.z);return p.toArray();});
   await capture('park-relative-day',720,[tree[0]+6,tree[1]+2.3,tree[2]+8.8],[tree[0]-1,tree[1]+1.2,tree[2]-1.2]);
   assert.deepEqual(errors,[]);await context.close();continue;
  }
  await capture('park-day',720,[18,2.3,-21],[11,1.2,-31]);
  await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>{const c=document.querySelector('#game');return c.width>c.height;});
  if(candidateOnly){
   await capture('onsen-day',720,[5,2.2,-25],[23.4,2,-20.6]);
   await capture('park-overhead-day',720,[9,15,-18],[18,1,-27]);
  }
  await capture('street-day',720,[9,2.1,-16],[-12,3.8,-27.3]);
  await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;await a.enter('market');});
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>{const c=document.querySelector('#game');return c.height>c.width;});
  await capture('shop-night',1260,[2,1.8,4],[0,1.1,-4]);
  if(version==='restored'){
   await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.leave();await a.enterInside('sakura-office');});
   await capture('office-midnight',30,[.2,5.66,-2.7],[4.5,5.21,2.5]);
   // Simulate a second process interrupted during entry in a row. Automatic recovery must keep
   // ink, grading and HDR while avoiding multisampling and the shadow atlas.
   await page.addInitScript(()=>{sessionStorage.setItem('johansson-startup-attempt-v1',JSON.stringify({stage:'entering',at:Date.now()-1000,strikes:2}));});
   await page.reload({waitUntil:'domcontentloaded'});await enter();
   report.recovery=await page.evaluate(()=>({safe:window.__JOHANSSON_SAFE_GRAPHICS__,ink:window.__JOHANSSON_LOOK__.ink,effects:window.__JOHANSSON_LOOK__.state}));
   assert.equal(report.recovery.safe,true);assert.equal(report.recovery.ink,true);assert.equal(report.recovery.effects.samples,0);assert.equal(report.recovery.effects.hdr,true);
  }
  assert.deepEqual(errors,[]);await context.close();
 }
}catch(error){failure=error;report.failure=error.stack;}
finally{await writeFile(resolve(out,candidateOnly?'integrated-report.json':parkOnly?'foliage-report.json':'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
if(failure)throw failure;
