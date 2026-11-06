import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve('output/cargo-berth');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={errors:[],views:[]};
try{
 const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block',timezoneId:'Europe/Stockholm'});
 await context.addInitScript(()=>{
  localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));
  Object.defineProperty(navigator,'getGamepads',{value:()=>[]});
  Element.prototype.requestFullscreen=async()=>{};
 });
 const page=await context.newPage();page.setDefaultTimeout(240000);
 page.on('pageerror',e=>report.errors.push({type:'page',message:e.message}));
 page.on('console',m=>{if(m.type()==='error')report.errors.push({type:'console',message:m.text()});});
 page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))report.errors.push({type:'asset',message:r.status()+' '+r.url()});});
 await page.goto('http://127.0.0.1:8768/johansson-town/?audit&visual-audit&spawn=pier&cinematic=off',{waitUntil:'domcontentloaded'});
 await page.locator('#enter').click();console.log('Entered app; waiting for running scene');
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 console.log('Game running');
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.teleport(57,-60);a.setTime(720);await a.world.oilJetty.load();a.render();});
 await page.addStyleTag({content:'#hud,#activity,#directory,#cameraPanel,#touchControls,#touch-ui{visibility:hidden!important}'});
 for(const view of [
  {name:'desktop-overall',width:1280,height:800,pos:[-5,48,-22],at:[47,1,-95]},
  {name:'desktop-dockside',width:1280,height:800,pos:[62,3.3,-61],at:[40,5,-91]},
  {name:'phone-dockside',width:390,height:844,pos:[58,3.3,-65],at:[42,5,-92]},
  {name:'phone-approach',width:390,height:844,pos:[46,2,-44.4],at:[57,2,-44.4]},
 ]){
  await page.setViewportSize({width:view.width,height:view.height});
  await page.evaluate(v=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:v.pos,at:v.at};a.render();},view);
  await page.waitForTimeout(400);await page.screenshot({path:resolve(out,view.name+'.png')});
  report.views.push({name:view.name,state:await page.evaluate(()=>({game:JSON.parse(window.render_game_to_text()),cargo:window.__JOHANSSON_AUDIT__.world.oilJetty.snapshot(),render:window.__JOHANSSON_AUDIT__.renderInfo}))});
  console.log('Captured',view.name);
 }
 const navigation=await page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__,issues=[],points=[[43.9,-44.4],[57,-44.4],[57,-49],[57,-139],[66,-139],[66,-49],[57,-49]];
  for(let i=1;i<points.length;i++){
   const from=points[i-1],to=points[i],n=Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])/.1);
   for(let k=0;k<=n;k++){
    const x=from[0]+(to[0]-from[0])*k/n,z=from[1]+(to[1]-from[1])*k/n,p=a.navigation(x,z,.32);
    if(p.staticBlocked)issues.push(p);
   }
  }
  return issues;
 });
 assert.deepEqual(navigation,[],'actual app approach/quay collision');
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(915);a.render();});
 const leaving=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.world.oilJetty.snapshot());
 assert.equal(leaving.phase,'departing');
 assert.equal(await page.evaluate(()=>window.__JOHANSSON_AUDIT__.world.oilJetty.connections.visible),false);
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(931);a.render();});
 assert.equal(await page.evaluate(()=>window.__JOHANSSON_AUDIT__.world.oilJetty.ship.visible),false);
 assert.equal(await page.evaluate(()=>window.__JOHANSSON_AUDIT__.world.oilJetty.quay.visible),true);
 await page.setViewportSize({width:1280,height:800});
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(720);a.camera=null;a.teleport(43.9,-44.4,-Math.PI/2);a.render();});
 await page.keyboard.down('ArrowUp');await page.evaluate(()=>window.advanceTime(3000));await page.keyboard.up('ArrowUp');
 const moved=await page.evaluate(()=>JSON.parse(window.render_game_to_text()));
 assert.ok(moved.player[0]>45,'player walks onto actual ramp');report.walked=moved;
 report.navigation='clear';report.departure=leaving;
 assert.deepEqual(report.errors,[],'browser errors');
 console.log('Navigation, actual movement and arrival/departure checks passed');
 await context.close();
}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
