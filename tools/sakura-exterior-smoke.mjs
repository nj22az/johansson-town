import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';
import {webkit} from 'playwright';
const out=resolve('docs/qa/sakura-office-exterior');await mkdir(out,{recursive:true});
const report={engine:'Linux WebKit',physicalDevice:false,views:[]};let failure;
const browser=await webkit.launch({headless:true,env:{...process.env,LIBGL_ALWAYS_SOFTWARE:'1'}});
try{
 const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:'block',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'});
 page.setDefaultTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/johansson-town/?audit',{waitUntil:'domcontentloaded'});await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_LOADING__.snapshot().completed===window.__JOHANSSON_LOADING__.snapshot().total);
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.renderFrozen=true;a.teleport(-2,-25);});
 const capture=async(label,minutes,pos,at)=>{
  const state=await page.evaluate(({minutes,pos,at})=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(minutes);a.camera={pos,at};a.render();const panes=[];a.scene.traverse(o=>{if(/Sakura (main|harbour) office glazing/.test(o.name))panes.push({name:o.name,emissive:(o.material.userData.celFrom||o.material).emissiveIntensity});});return {ink:window.__JOHANSSON_LOOK__.ink,gpuError:a.renderer.getContext().getError(),panes,render:a.renderInfo};},{minutes,pos,at});
  assert.equal(state.ink,true);assert.equal(state.gpuError,0);
  if(minutes===30){assert.equal(state.panes.length,2);assert.ok(state.panes.every(p=>p.emissive>.3));}
  const path=resolve(out,label+'.png');await page.locator('#game').screenshot({path});const png=PNG.sync.read(await readFile(path));let sum=0,n=0,min=255,max=0;
  for(let i=0;i<png.data.length;i+=64){const v=(png.data[i]+png.data[i+1]+png.data[i+2])/3;sum+=v;n++;min=Math.min(min,v);max=Math.max(max,v);}
  const mean=sum/n;assert.ok(mean>8&&max-min>90,label+' must contain a drawn scene');report.views.push({label,minutes,mean,...state});
 };
 await capture('street-day',720,[9,2.1,-16],[-12,3.8,-27.3]);
 await capture('roof-day',720,[4,15,-14],[-12,3,-27.3]);
 await capture('street-midnight',30,[9,2.1,-16],[-12,3.8,-27.3]);
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>{const c=document.querySelector('#game');return c.height>c.width;});
 await capture('phone-day',720,[9,2.1,-16],[-12,3.8,-27.3]);
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;await a.enterInside('sakura-office');});
 await capture('office-outlook-midnight',30,[.2,5.66,-2.7],[4.5,5.21,2.5]);
 assert.deepEqual(errors,[]);await page.close();
}catch(error){failure=error;report.failure=error.stack;}
finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
if(failure)throw failure;
