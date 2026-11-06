import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {serveGame} from './mcp/static-server.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),output=resolve(process.env.CONCERT_QA_OUTPUT||resolve(root,'../output/concert-qa'));
await mkdir(output,{recursive:true});
const preview=await serveGame(root),errors=[],report={views:[],checks:[]};
const launchOptions={headless:true,...(process.env.CONCERT_BROWSER?{executablePath:process.env.CONCERT_BROWSER}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']};
let browser=await chromium.launch(launchOptions);
try{
 let page=await browser.newPage({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const shot=async name=>{await page.screenshot({path:resolve(output,name+'.png')});report.views.push(name);};
 page.on('pageerror',e=>errors.push(e.message));
 if(!process.argv.includes('--game-only')){
 await page.route('**/concert-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><button id="origin">Karaoke machine</button><canvas id="game"></canvas></body></html>'}));
 await page.goto(new URL('concert-fixture',preview.url).href);
 await page.evaluate(async()=>{
  const base=location.pathname.replace(/concert-fixture$/,'');
  const THREE=await import(base+'vendor/three.module.js'),{createConcert}=await import(base+'src/music/concert.js'),{recipeFor}=await import(base+'src/avatars/cast.js');
  const Native=window.AudioContext;window.AudioContext=class extends Native{constructor(){super();window.concertContext=this;window.concertAnalyser=this.createAnalyser();window.concertAnalyser.fftSize=256;const destination=this.destination,original=this.createGain.bind(this);this.createGain=()=>{const g=original(),connect=g.connect.bind(g);g.connect=(next,...args)=>{if(next===destination)connect(window.concertAnalyser);return connect(next,...args);};return g;};}};
  window.balance=500;window.completions=0;
  const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#game'),antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
  window.concert=createConcert({renderer,getCast:()=>['Johansson','Thuan','Chin','Mr Fujita'].map(name=>({name,recipe:recipeFor(name)})),getDraft:()=>window.concertDraft,saveDraft:d=>{window.concertDraft=structuredClone(d);return true;},pay:n=>{if(window.balance<n)return false;window.balance-=n;return true;},onFinish:()=>window.completions++,onClose:()=>renderer.setSize(800,600)});
  document.querySelector('#origin').focus();window.concert.open();function frame(){window.concert.render();requestAnimationFrame(frame);}frame();
 });

 await shot('desktop-solo-setup');await page.getByLabel('Number of performers').selectOption('2');await shot('desktop-duet-setup');
 await page.getByLabel('Number of performers').selectOption('4');await page.getByLabel('Song',{exact:true}).selectOption('summer');
 await page.getByText('Edit the title and lyrics',{exact:true}).click();await page.getByLabel('Title',{exact:true}).fill('Tonight at Minato');
 await page.getByLabel('Line 1',{exact:true}).fill('Our little harbour sings tonight');await page.getByLabel('Line 2',{exact:true}).fill('<img src=x onerror=alert(1)>');await page.getByLabel('Line 3',{exact:true}).click();
 assert.equal(await page.locator('.concert-line img').count(),0);
 await page.getByRole('button',{name:'Perform · ¥100',exact:true}).click();await page.waitForFunction(()=>window.concert.snapshot().phase==='singing');
 assert.equal(await page.evaluate(()=>window.balance),400);assert.equal(await page.evaluate(()=>window.concertDraft.song.title),'Tonight at Minato');
 await page.waitForFunction(()=>{const bytes=new Uint8Array(window.concertAnalyser.frequencyBinCount);window.concertAnalyser.getByteFrequencyData(bytes);return Math.max(...bytes)>0;},null,{timeout:5000});
 report.checks.push('Real Web Audio output, paid once, saved title/lyrics, no injected HTML');await shot('desktop-quartet-performing');
 await page.setViewportSize({width:390,height:844});await shot('phone-quartet-performing');await page.setViewportSize({width:1024,height:768});await shot('tablet-quartet-performing');
 await page.waitForFunction(()=>window.concert.snapshot().finished,null,{timeout:35000});assert.equal(await page.evaluate(()=>window.completions),1);await shot('tablet-finished');
 await page.getByRole('button',{name:'Encore',exact:true}).click();await page.waitForFunction(()=>window.concert.playing);assert.equal(await page.evaluate(()=>window.balance),400,'encore included');
 await page.getByRole('button',{name:'Stop',exact:true}).click();assert.equal(await page.evaluate(()=>window.concert.playing),false);await page.setViewportSize({width:390,height:844});await shot('phone-setup');
 await page.getByRole('button',{name:'Perform again',exact:true}).click();await page.waitForFunction(()=>window.concert.playing);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});});assert.equal(await page.evaluate(()=>window.concert.playing),false);
 await page.getByRole('button',{name:'Return to Minato',exact:true}).click();assert.equal(await page.locator('#concert').isVisible(),false);assert.equal(await page.evaluate(()=>document.querySelector('#game').parentElement.tagName),'BODY');assert.equal(await page.evaluate(()=>document.activeElement.id),'origin');
 await page.evaluate(()=>window.concert.open());assert.equal(await page.getByLabel('Title',{exact:true}).inputValue(),'Tonight at Minato');await page.evaluate(()=>{window.balance=0;});await page.getByRole('button',{name:'Perform · ¥100',exact:true}).click();await page.waitForFunction(()=>!window.concert.snapshot().busy);assert.equal(await page.evaluate(()=>window.concert.playing),false);assert.equal(await page.evaluate(()=>window.balance),0);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#concert').isVisible(),false);
 await page.evaluate(()=>window.concert.open());await page.getByLabel('Title',{exact:true}).fill('Saved even on Escape');await page.keyboard.press('Escape');await page.evaluate(()=>window.concert.open());assert.equal(await page.getByLabel('Title',{exact:true}).inputValue(),'Saved even on Escape');await page.keyboard.press('Escape');
 await page.setViewportSize({width:1280,height:800});await page.evaluate(()=>{window.balance=500;window.concert.open();});await page.getByLabel('Song',{exact:true}).selectOption('bus');await page.getByRole('button',{name:'Perform · ¥100',exact:true}).click();await page.waitForFunction(()=>window.concert.snapshot().phase==='singing');await shot('minato-karaoke-preview');await page.keyboard.press('Escape');
 report.checks.push('Unsaved text is retained on Escape','Full performance and bow','Free encore','Stop and backgrounding silence and reset the song','Exit restores canvas and focus','Reopening restores the draft','Insufficient funds never starts a take');
 }
 if(process.argv.includes('--game')||process.argv.includes('--game-only')){
  await browser.close();browser=await chromium.launch(launchOptions);page=await browser.newPage({viewport:{width:1280,height:800},serviceWorkers:'block'});page.on('pageerror',e=>errors.push(e.message));
  console.log('Checking the compiled World and physical karaoke machine…');
  const offlineHTML=(await readFile(resolve(root,'index.html'),'utf8')).replace(/<link[^>]+href="https:[^>]+>/g,'');
  await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==new URL(preview.url).origin)return route.abort();if(u.pathname==='/johansson-town/')return route.fulfill({contentType:'text/html',body:offlineHTML});return route.continue();});
  await page.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'18:00',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
  await page.setViewportSize({width:1280,height:800});
  await page.goto(preview.url+'?audit&visual-audit&cinematic=off',{waitUntil:'domcontentloaded'});
  await page.locator('#enter').click();
  await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp,null,{timeout:240000});
  await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(18*60);await a.enter('izakaya');});
  await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
  const before=await page.evaluate(()=>({player:window.__JOHANSSON_AUDIT__.player,wallet:document.querySelector('#wallet').textContent,parent:document.querySelector('#game').parentElement.tagName}));
  assert.equal(before.player.room,'izakaya');
  await page.evaluate(()=>{let target;window.__JOHANSSON_AUDIT__.scene.traverse(o=>{if(o.userData.hit?.label==='Sing at the karaoke')target=o;});if(!target)throw Error('The physical karaoke interaction is missing');target.userData.hit.fn();});
  await page.locator('#concert').waitFor({state:'visible',timeout:60000});
  const configured=await page.evaluate(async()=>JSON.parse(await window.__JOHANSSON_AGENT_API__.concert({song:'bus',cast:['Johansson','Thuan'],title:'An evening at Minato'})));
  assert.equal(configured.ok,true);assert.deepEqual(configured.state.concert.cast,['Johansson','Thuan']);
  assert.equal(configured.state.controls.move,false);
  await page.getByRole('button',{name:'Perform · ¥100',exact:true}).click();
  await page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.concertState.phase==='singing');
  await shot('game-desktop-duet');
  assert.equal(await page.evaluate(()=>window.__JOHANSSON_AGENT_API__.getState().concert.playing),true);
  await page.setViewportSize({width:1024,height:768});await shot('game-tablet-duet');
  await page.setViewportSize({width:390,height:844});await shot('game-phone-duet');
  const stopped=await page.evaluate(async()=>JSON.parse(await window.__JOHANSSON_AGENT_API__.chooseAction({label:'Stop'})));assert.equal(stopped.ok,true);
  const returned=await page.evaluate(async()=>JSON.parse(await window.__JOHANSSON_AGENT_API__.chooseAction({label:'Return to Minato'})));assert.equal(returned.ok,true);
  const after=await page.evaluate(()=>({player:window.__JOHANSSON_AUDIT__.player,wallet:document.querySelector('#wallet').textContent,parent:document.querySelector('#game').parentElement.tagName}));
  assert.deepEqual(after.player,before.player,'World resumes at the same position and facing');assert.equal(after.parent,before.parent);
  assert.notEqual(after.wallet,before.wallet);await page.evaluate(()=>window.__JOHANSSON_AUDIT__.render());await shot('game-returned-to-minato');
  report.checks.push('Compiled World boots, physical machine opens the stage, WebMCP configures/starts/stops/exits it, wallet is charged, original player position and renderer return');
 }
 assert.deepEqual(errors,[]);report.errors=errors;report.browser=browser.version();await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await preview.close();}
