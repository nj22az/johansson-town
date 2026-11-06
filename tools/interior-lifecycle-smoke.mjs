import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {webkit} from 'playwright';
const out=resolve('docs/qa/interior-lifecycle');await mkdir(out,{recursive:true});
const report={engine:'Linux WebKit',physicalDevice:false,cycles:[],views:[]};let failure;
console.log('Starting mobile WebKit');
const browser=await webkit.launch({headless:true,env:{...process.env,LIBGL_ALWAYS_SOFTWARE:'1'}});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:'block',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'});
 page.setDefaultTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 console.log('Loading town');
 await page.goto('http://127.0.0.1:8765/johansson-town/?audit',{waitUntil:'domcontentloaded'});await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_LOADING__.snapshot().completed===window.__JOHANSSON_LOADING__.snapshot().total);
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.renderFrozen=true;a.teleport(-2,-25);a.setTime(720);});
 console.log('Town loaded');
 const capture=async(label,pos,at)=>{console.log('Capture',label);
  const state=await page.evaluate(({pos,at})=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos,at};a.render();return {gpuError:a.renderer.getContext().getError(),render:a.renderInfo,portal:{...window.__JOHANSSON_SHOP_VIEW__}};},{pos,at});
  assert.equal(state.gpuError,0);await page.locator('#game').screenshot({path:resolve(out,label+'.png')});report.views.push({label,...state});
 };
 await capture('street-day',[8,2,-21],[-12,1.6,-27.3]);
 for(let cycle=0;cycle<4;cycle++)for(const venue of ['market','izakaya']){
  console.log('Enter',cycle,venue);
  await page.evaluate(async venue=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;await a.enter(venue);a.render();},venue);
  const indoor=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;return {visible:a.room.visible,children:a.room.children.length,info:a.renderInfo};});assert.ok(indoor.visible&&indoor.children>0);
  if(cycle===0){await capture(venue+'-inside',[0,1.7,2],[0,1.5,-3]);assert.equal(report.views.at(-1).portal.passes,0,'Looking into the venue draws no town pass');await capture(venue+'-window',[0,1.7,0],[0,1.6,7]);}
  const exterior=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.leave();a.render();return {roomChildren:a.room.children.length,roomVisible:a.room.visible,portalBytes:window.__JOHANSSON_SHOP_VIEW__.cacheBytes,info:a.renderInfo};});
  assert.equal(exterior.roomChildren,0);assert.equal(exterior.roomVisible,false);assert.equal(exterior.portalBytes,0);report.cycles.push({cycle,venue,indoor,exterior});
 }
 console.log('Advancing indoor simulation for three minutes');
 const continuity=await page.evaluate(async()=>{
  const a=window.__JOHANSSON_AUDIT__;await a.enter('market');const p=a.world.people.find(p=>p.profile.name==='Grandmother Sakurai');if(p.g.parent!==a.world.group)throw Error('Shore fixture actor is borrowed');delete p.g.userData.indoors;p.g.visible=true;p.g.position.set(0,.04,10);a.setTime(145);a.activities.menu('Audit','Checking indoor continuity',[]);const before=window.__JOHANSSON_POSE__.minutes;a.step(180000);a.activities.close();
  return {before,after:window.__JOHANSSON_POSE__.minutes,start:[0,.04,10],resident:{name:p.profile.name,indoors:p.g.userData.indoors,position:p.g.position.toArray()},roomVisible:a.room.visible};
 });
 console.log('Continuity result',JSON.stringify(continuity));report.continuity=continuity;assert.ok(continuity.after>=continuity.before+1,JSON.stringify(continuity));assert.equal(continuity.roomVisible,true);assert.equal(continuity.resident.indoors,'home');report.continuity=continuity;
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.setTime(30));await capture('sakura-night',[0,1.7,1],[0,1.6,-3]);
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.leave());await capture('street-night',[8,2,-21],[-12,1.6,-27.3]);
 const last=report.cycles.filter(c=>c.venue==='izakaya');assert.ok(last.at(-1).exterior.info.geometries<=last[1].exterior.info.geometries+30,'Repeated entry must not accumulate room geometry');
 assert.ok(last.at(-1).exterior.info.textures<=last[1].exterior.info.textures,'Repeated entry must not accumulate mascot bone textures');
 assert.deepEqual(errors,[]);report.errors=errors;await page.close();
}catch(error){failure=error;report.failure=error.stack;}
finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
if(failure)throw failure;
