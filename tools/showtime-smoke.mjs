import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {serveGame} from './mcp/static-server.mjs';
const liveMode=process.argv.includes('--live-lyrics');
const customLines=['My banana runs the harbour','Thuan dances on the moon','The captain lost his trousers','We all demand another tune'];
const root=fileURLToPath(new URL('../',import.meta.url)),output=resolve(process.env.CONCERT_QA_OUTPUT||resolve(root,'../output/showtime-qa'));
await mkdir(output,{recursive:true});const preview=await serveGame(root),errors=[],checks=[];
const browser=await chromium.launch({headless:true,...(process.env.CONCERT_BROWSER?{executablePath:process.env.CONCERT_BROWSER}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800},serviceWorkers:'block'});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/showtime-fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}.hidden{display:none!important}#hud{position:absolute;left:-9999px}</style><button id="origin">Karaoke machine</button><canvas id="game"></canvas><div id="hud"></div><div id="activity" class="hidden"></div><div id="directory" class="hidden"></div></html>'}));
 await page.goto(new URL('showtime-fixture',preview.url).href);
 if(liveMode)await page.evaluate(()=>{
  const voices=[{name:'Daniel',lang:'en-GB',localService:true},{name:'Serena',lang:'en-GB',localService:true}];
  window.mockSpeech={spoken:[],timers:[],cancelled:0};
  Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class{constructor(text){this.text=text;}}});
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>voices,
   cancel(){window.mockSpeech.cancelled++;window.mockSpeech.timers.forEach(clearTimeout);window.mockSpeech.timers=[];},
   speak(u){if(!u.text.trim())return;window.mockSpeech.spoken.push({text:u.text,voice:u.voice?.name,pitch:u.pitch,rate:u.rate});
    const later=(f,t)=>window.mockSpeech.timers.push(setTimeout(f,t));later(()=>u.onstart?.(),10);
    [...u.text.matchAll(/\S+/g)].forEach((w,i)=>later(()=>u.onboundary?.({name:'word',charIndex:w.index}),20+i*150));later(()=>u.onend?.(),1300);
   }}});
 });
 await page.evaluate(async()=>{
  const base=location.pathname.replace(/showtime-fixture$/,''),THREE=await import(base+'vendor/three.module.js'),{createConcert}=await import(base+'src/music/concert.js'),{recipeFor}=await import(base+'src/avatars/cast.js');
  const Native=window.AudioContext;
  window.AudioContext=class extends Native{constructor(){super();window.audio=this;window.meter=this.createAnalyser();window.meter.fftSize=256;const dest=this.destination,make=this.createGain.bind(this);this.createGain=()=>{const g=make(),connect=g.connect.bind(g);g.connect=(next,...args)=>{if(next===dest)connect(window.meter);return connect(next,...args);};return g;};}};
  window.registered=new Map();Object.defineProperty(document,'modelContext',{configurable:true,value:{registerTool(tool){window.registered.set(tool.name,tool);}}});
  const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#game'),antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const draw=renderer.render.bind(renderer);renderer.render=(scene,camera)=>{window.lastScene=scene;window.lastCamera=camera;draw(scene,camera);};
  window.balance=500;window.completed=0;window.peak=0;
  window.concert=createConcert({renderer,getCast:()=>['Johansson','Thuan','Chin','Mr Fujita'].map(name=>({name,recipe:recipeFor(name)})),getDraft:()=>window.draft,saveDraft:d=>{window.draft=structuredClone(d);return true;},pay:n=>{if(window.balance<n)return false;window.balance-=n;return true;},onFinish:()=>window.completed++});
  window.__JOHANSSON_RUNNING__=true;window.__JOHANSSON_AGENT_CONTEXT__=()=>({concert:window.concert.snapshot(),controlsAllowed:!window.concert.active});
  await import(base+'webmcp.js');window.callMCP=async(name,args={})=>JSON.parse(await window.registered.get(name).execute(args));
  document.querySelector('#origin').onclick=()=>window.concert.open();function frame(){window.concert.render();if(window.meter&&window.concert.playing){const a=new Uint8Array(window.meter.frequencyBinCount);window.meter.getByteFrequencyData(a);window.peak=Math.max(window.peak,...a);}requestAnimationFrame(frame);}frame();
 });
 const call=(name,args)=>page.evaluate(async({name,args})=>window.callMCP(name,args),{name,args});
 await page.getByRole('button',{name:'Karaoke machine',exact:true}).click();
 if(liveMode){
  await call('johansson_concert',{lines:customLines,performance:'wild'});await page.getByRole('button',{name:'Test voice',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.concert-status').textContent.startsWith('Voice ready'));
 }
 const state=await call('johansson_get_state');assert.equal(state.state.concert.choices.arrangements.length,6);assert.equal(state.state.concert.choices.voices.length,5);assert.equal(state.state.concert.choices.performances.length,3);
 assert.equal((await call('johansson_concert',{voice:'missing'})).ok,false);assert.equal((await call('johansson_concert',{performance:'missing'})).ok,false);
 checks.push('Registered MCP handlers expose all six arrangements, five voices and three energy levels, and reject invalid options');
 for(const style of ['pop','ballad','disco','rock','enka','eurobeat']){
  await page.evaluate(()=>{window.peak=0;});
  const result=await call('johansson_concert',{song:'bus',arrangement:style,voice:'cast',performance:'wild',...(liveMode?{lines:customLines}:{}),cast:['Johansson','Thuan','Chin','Mr Fujita']});assert.equal(result.ok,true);
  assert.equal((await call('johansson_choose_action',{label:style==='pop'?'Perform · ¥100':'Perform again'})).ok,true);
  await page.waitForFunction(()=>window.concert.snapshot().phase==='singing',null,{timeout:12000});
  if(style==='pop'){await page.keyboard.press('h');assert.match(await page.locator('.concert-status').innerText(),/room joins in/);}
  const before=await page.evaluate(()=>window.lastCamera.position.toArray());
  assert.equal((await call('johansson_choose_action',{label:'Cheer!'})).ok,true);
  await page.waitForTimeout(1300);
  const evidence=await page.evaluate(()=>{const data=new Uint8Array(window.meter.frequencyBinCount);window.meter.getByteFrequencyData(data);let held=0,bones=0,invalid=0;window.lastScene.traverse(o=>{if(o.name==='Handheld karaoke microphone'&&o.visible)held++;if(o.isBone)bones++;if(!o.matrixWorld.elements.every(Number.isFinite))invalid++;});return {peak:Math.max(window.peak,...data),vocalSource:window.concert.snapshot().vocalSource,spoken:window.mockSpeech?.spoken,context:window.audio.state,held,bones,invalid,balance:window.balance,song:window.concert.snapshot().song};});
  console.log(JSON.stringify({style,evidence,errors}));
  await page.screenshot({path:resolve(output,style+'-quartet.png')});
  assert.ok(evidence.peak>0,style+' has real sound output');if(liveMode){assert.equal(evidence.vocalSource,'live-text');assert.equal(evidence.spoken.at(-1).text,customLines[0]);}assert.ok(evidence.bones>20);assert.equal(evidence.invalid,0);assert.equal(evidence.balance,400);
  if(style==='rock'){
   await page.waitForTimeout(2200);const after=await page.evaluate(()=>window.lastCamera.position.toArray());assert.notDeepEqual(after,before,'Directed camera moves during the song');await page.screenshot({path:resolve(output,'rock-directed-camera.png')});
   await page.setViewportSize({width:390,height:844});await page.screenshot({path:resolve(output,'rock-phone.png')});await page.setViewportSize({width:1280,height:800});
  }
  await call('johansson_choose_action',{label:'Stop'});assert.equal(await page.evaluate(()=>window.concert.playing),false);checks.push({style,...evidence});
 }
 await call('johansson_concert',{arrangement:'rock',voice:'belt',performance:'wild'});await call('johansson_choose_action',{label:'Perform again'});
 await page.waitForFunction(()=>window.concert.snapshot().finished,null,{timeout:35000});assert.equal(await page.evaluate(()=>window.completed),1);if(liveMode){const spoken=await page.evaluate(()=>window.mockSpeech.spoken.slice(-4));assert.deepEqual(spoken.map(s=>s.text),customLines);assert.equal(await page.evaluate(()=>window.mockSpeech.timers.length),0);}
 assert.equal((await call('johansson_choose_action',{label:'Encore'})).ok,true);await call('johansson_choose_action',{label:'Stop'});
 assert.equal(await page.evaluate(()=>window.balance),400);await call('johansson_choose_action',{label:'Return to Minato'});
 assert.equal(await page.locator('#concert').isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'origin');
 await page.getByRole('button',{name:'Karaoke machine',exact:true}).click();assert.equal(await page.getByLabel('Character voice',{exact:true}).inputValue(),'belt');assert.equal(await page.getByLabel('Stage energy',{exact:true}).inputValue(),'wild');
 await page.screenshot({path:resolve(output,'saved-showtime-songbook.png')});await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);checks.push('Full rock performance and bow, free encore, Stop, Return, focus and saved voice/energy settings');
 await writeFile(resolve(output,'report.json'),JSON.stringify({scope:liveMode?'Real WebGL stage, music and registered WebMCP callbacks with simulated browser speech events: custom lyrics, cast voices, boundaries, cancellation. Native speech listening is not established by this test.':'Real WebGL/Web Audio concert and registered WebMCP callbacks in an isolated fixture, not a complete town-navigation pass',browser:browser.version(),checks,errors},null,2)+'\n');console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser.close();await preview.close();}
