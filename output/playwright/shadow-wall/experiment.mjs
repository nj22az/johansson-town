import {chromium} from '../../../node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const out=resolve('output/playwright/shadow-wall');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={errors:[],variants:[]};
try{
 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,timezoneId:'Europe/Stockholm',locale:'en-GB',serviceWorkers:'block'});
 await context.addInitScript(()=>{
  const NativeDate=Date,fixed=NativeDate.parse('2026-10-03T10:00:00Z');
  class AuditDate extends NativeDate{constructor(...values){super(...(values.length?values:[fixed]));}static now(){return fixed;}}window.Date=AuditDate;
  let seed=422197;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));
  Object.defineProperty(navigator,'getGamepads',{value:()=>[]});Element.prototype.requestFullscreen=async()=>{};
 });
 const page=await context.newPage();page.setDefaultTimeout(120000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto('http://127.0.0.1:8766/johansson-town/?audit&visual-audit',{waitUntil:'domcontentloaded'});
 await page.locator('#enter').click();await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__);
 await page.addStyleTag({content:'#hud,#activity,#directory,#cameraPanel,#touchControls,#touch-ui{visibility:hidden!important}'});
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(720);await a.enter('resident-home-thuan');a.camera={pos:[2.5,1.6,2.5],at:[-.45,.78,-.45]};a.render();});
 await page.waitForFunction(()=>!window.__JOHANSSON_STREAMING__.active&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
 await page.waitForLoadState('networkidle');
 report.original=await page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__,sun=window.__JOHANSSON_LOOK__.lights.sun;
  const west=[],shell=[];a.room.traverse(o=>{const p=o.geometry?.parameters;if(o.isMesh&&p&&(p.height===2.8||o.name==='Ceiling')){shell.push(o);if(p.width===.12&&o.position.x<0)west.push(o);}});
  window.__WALL_EXPERIMENT__={west,shell,saved:shell.map(o=>({o,receive:o.receiveShadow,cast:o.castShadow,side:o.material.shadowSide})),bias:sun.shadow.bias,normalBias:sun.shadow.normalBias};
  a.render();return {west:west.map(o=>({at:o.position.toArray(),receive:o.receiveShadow,cast:o.castShadow,material:o.material.type,map:!!o.material.map,side:o.material.shadowSide})),sun:{bias:sun.shadow.bias,normalBias:sun.shadow.normalBias,at:sun.position.toArray()},game:window.render_game_to_text()};
 });
 for(const variant of ['original','west-receive-off','west-cast-off','west-cast-front','shell-cast-front','ceiling-cast-off','normal-bias-zero','bias-zero','normal-bias-006','normal-bias-008']){
  await page.evaluate(variant=>{
   const a=window.__JOHANSSON_AUDIT__,e=window.__WALL_EXPERIMENT__,sun=window.__JOHANSSON_LOOK__.lights.sun;
   for(const v of e.saved){v.o.receiveShadow=v.receive;v.o.castShadow=v.cast;v.o.material.shadowSide=v.side;v.o.material.needsUpdate=true;}sun.shadow.bias=e.bias;sun.shadow.normalBias=e.normalBias;
   if(variant==='west-receive-off')for(const o of e.west)o.receiveShadow=false;
   if(variant==='west-cast-off')for(const o of e.west)o.castShadow=false;
   if(variant==='west-cast-front')for(const o of e.west)o.material.shadowSide=0;
   if(variant==='shell-cast-front')for(const o of e.shell)o.material.shadowSide=0;
   if(variant==='ceiling-cast-off')for(const o of e.shell)if(o.name==='Ceiling')o.castShadow=false;
   if(variant==='normal-bias-zero')sun.shadow.normalBias=0;
   if(variant==='bias-zero')sun.shadow.bias=0;
   if(variant==='normal-bias-006')sun.shadow.normalBias=.006;
   if(variant==='normal-bias-008')sun.shadow.normalBias=.008;
   sun.shadow.needsUpdate=true;a.render();
  },variant);
  await page.locator('#game').screenshot({path:resolve(out,variant+'.png'),animations:'disabled'});
  report.variants.push(variant);console.log('Captured',variant);
 }
 await context.close();
}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
