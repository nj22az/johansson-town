// Reproducible browser acceptance: run the audit server, then node tools/title-screen-audit.mjs.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const url=process.env.TITLE_AUDIT_URL||'http://127.0.0.1:8767/johansson-town/?audit&cinematic=off';
const out=resolve(process.env.TITLE_AUDIT_OUTPUT||'../output/playwright/world-title');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=metal']});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,serviceWorkers:'block',timezoneId:'Europe/Stockholm'});
await context.addInitScript(()=>{
 localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));
 if(!localStorage.getItem('johansson-town-weather'))localStorage.setItem('johansson-town-weather',JSON.stringify({weather:'sunny',mode:'fixed'}));
 Element.prototype.requestFullscreen=async()=>{};
});
const page=await context.newPage();page.setDefaultTimeout(180000);
const report={url,browser:browser.version(),viewports:[],checks:[],errors:[],failedRequests:[]};
page.on('pageerror',error=>{report.errors.push(error.stack);console.error(error.stack);});
page.on('requestfailed',req=>{if(req.url().startsWith(new URL(url).origin))report.failedRequests.push(req.url()+': '+req.failure()?.errorText);});
const ready=async()=>{
 await page.waitForFunction(()=>typeof window.__JOHANSSON_ENTER_WORLD__==='function');
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>window.__JOHANSSON_MODEL__?.ready===true);
};
try{
 await page.goto(url,{waitUntil:'domcontentloaded'});
 const beforeReady=await page.locator('#enter').boundingBox();
 await ready();
 assert.match(await page.locator('#enter').innerText(),/Start Exploring/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('johansson-town-1988-v5')),null);
 assert.equal(await page.locator('.title-town,.title-sky').count(),0);
 const afterReady=await page.locator('#enter').boundingBox();
 assert.ok(Math.abs(beforeReady.y-afterReady.y)<2,'The primary action does not shift when preview is ready');
 report.checks.push('Fresh player label; preview leaves save untouched; no legacy image/sky; stable action placement');
 for(const [width,height] of [[390,844],[393,852],[430,932],[768,1024],[1280,800],[1920,1080],[844,390],[320,568]]){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const layout=await page.evaluate(()=>{
   const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
   const start=document.querySelector('#start');
   return {scrollWidth:start.scrollWidth,clientWidth:start.clientWidth,scrollHeight:start.scrollHeight,clientHeight:start.clientHeight,logo:box(document.querySelector('#titleLogo')),actions:[...document.querySelectorAll('#enter,.title-secondary>*')].map(box)};
  });
  assert.ok(layout.scrollWidth<=layout.clientWidth+1,'No horizontal scrolling');
  for(const b of layout.actions){assert.ok(b.width>=44&&b.height>=44,'Touch target at least 44px');assert.ok(b.x>=0&&b.right<=width+1,'Actions fit viewport');}
  const secondary=layout.actions.slice(1);assert.ok(Math.max(...secondary.map(b=>b.width))-Math.min(...secondary.map(b=>b.width))<1);
  await page.screenshot({path:resolve(out,`after-${width}x${height}.png`)});
  report.viewports.push({width,height,...layout});
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('link',{name:'Guide',exact:true}).click();
 assert.equal(await page.locator('#start').evaluate(e=>e.classList.contains('guide-open')),true);
 await page.goBack();assert.equal(await page.locator('#start').evaluate(e=>e.classList.contains('guide-open')),false);
 await page.goForward();assert.equal(await page.locator('#start').evaluate(e=>e.classList.contains('guide-open')),true);
 await page.locator('[data-guide-close]').first().click();
 assert.equal(await page.locator('#openStudio').getAttribute('href'),'/avatar-creator/');
 const studio=await page.request.get(new URL('/avatar-creator/',url).href);assert.equal(studio.ok(),true);
 report.checks.push('Guide open/close and browser back/forward; original Studio destination responds');
 await page.locator('.title-settings summary').click();
 await page.locator('#titleWeather').click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('johansson-town-weather')).mode),'fixed');
 await page.locator('#titleDice').click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('johansson-town-weather')).mode),'random');
 assert.equal(await page.locator('#installTown').isVisible(),false);
 await page.evaluate(()=>{const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>{window.titleInstallTest=true;};dispatchEvent(event);});
 await page.locator('#installTown').click();assert.equal(await page.evaluate(()=>window.titleInstallTest),true);
 await page.locator('.title-settings summary').click();
 report.checks.push('Shared weather cycle and random weather; desktop install hidden until install prompt is available');
 await page.emulateMedia({reducedMotion:'reduce'});
 const lens=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.lens.position);
 await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,250)));
 assert.deepEqual(await page.evaluate(()=>window.__JOHANSSON_AUDIT__.lens.position),lens);
 report.checks.push('Reduced motion keeps title camera still');
 const saves=await page.evaluate(()=>{
  const a=JSON.stringify({yen:273,minutes:720,visited:[],inventory:['Tea'],savedAt:Date.now()});
  const b=JSON.stringify({yen:987,minutes:720,visited:[],inventory:[],savedAt:Date.now()});
  localStorage.setItem('johansson-town-1988-v5',a);localStorage.setItem('johansson-town-1988-v5@player-2',b);
  localStorage.setItem('johansson-town-players',JSON.stringify({active:'player-1',players:[{id:'player-1',name:'Visitor'},{id:'player-2',name:'Sakura',lastPlayed:1}]}));return {a,b};
 });
 await page.reload();await ready();
 assert.match(await page.locator('#enter').innerText(),/Continue/);
 assert.match(await page.locator('#titlePlayerSummary').innerText(),/273/);
 await page.screenshot({path:resolve(out,'continue-390.png')});
 assert.equal(await page.evaluate(()=>localStorage.getItem('johansson-town-1988-v5')),saves.a);
 page.once('dialog',dialog=>dialog.dismiss());await page.locator('#titleNew').click();
 assert.equal(await page.locator('#titleSlots').isVisible(),false);
 page.once('dialog',dialog=>dialog.accept());await page.locator('#titleNew').click();
 await page.locator('#titleNewName').fill('New visitor');
 await page.locator('#titleNewForm button').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('johansson-town-players')).active!=='player-1');
 await ready();assert.match(await page.locator('#enter').innerText(),/Start Exploring/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('johansson-town-1988-v5')),saves.a);
 report.checks.push('Existing player Continue and currency; New Game confirmation cancel/accept; new slot retains old save');
 await page.locator('#titleLoad').click();
 await page.locator('#titleImportFile').setInputFiles({name:'imported.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({game:'johansson-world',player:'Imported',state:{yen:654,minutes:720,visited:[],inventory:[]}}))});
 await ready();assert.match(await page.locator('#titlePlayerSummary').innerText(),/654/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('johansson-town-1988-v5')),saves.a);
 report.checks.push('Save import loads a separate player and preserves previous progress');
 await page.locator('#titleLoad').click();
 await page.screenshot({path:resolve(out,'save-picker-390.png')});
 const last=page.locator('#titleSlotsClose');await last.focus();await page.keyboard.press('Tab');
 assert.equal(await page.locator('#titleSlotList button').first().evaluate(e=>e===document.activeElement),true);
 await page.getByRole('button',{name:/Sakura/}).click();
 await ready();assert.match(await page.locator('#titlePlayerName').innerText(),/Sakura/);
 assert.match(await page.locator('#titlePlayerSummary').innerText(),/987/);
 await page.locator('#enter').focus();await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__===true);
 assert.equal(await page.locator('#start').isVisible(),false);
 await page.evaluate(()=>dispatchEvent(new Event('johansson-save')));
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('johansson-town-1988-v5@player-2')).yen),987);
 assert.equal(await page.evaluate(()=>localStorage.getItem('johansson-town-1988-v5')),saves.a);
 report.checks.push('Save picker traps keyboard focus; selecting another player reloads its state; keyboard Continue restores selected money without touching the other save');
 await page.screenshot({path:resolve(out,'playing-390.png')});
 assert.deepEqual(report.errors,[],'No browser exceptions');
 assert.deepEqual(report.failedRequests,[],'No local request failures');
 report.pass=true;
}catch(error){report.pass=false;report.failure=error.stack;await page.screenshot({path:resolve(out,'failure.png')}).catch(()=>{});throw error;}
finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({pass:report.pass,viewports:report.viewports.length,checks:report.checks,output:out},null,2));
