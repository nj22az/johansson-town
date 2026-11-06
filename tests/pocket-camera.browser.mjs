// The pocket camera in the real game (run by hand: TOWN_CHROMIUM_PATH=… node tests/pocket-camera.browser.mjs).
// Raise it (F on a desktop, the Town book tile on a phone), photograph a resident in town and a room, lower it, look at
// the album, reload: the photos, their people and places, the diary moments and the layout must all be right.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=fileURLToPath(new URL('.',import.meta.url)),site=resolve(here,'../..');
const require=createRequire(resolve(here,'../package.json')),{chromium}=require('playwright');
const out=resolve(here,'evidence/pocket-camera');await mkdir(out,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.glb':'model/gltf-binary','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg','.woff2':'font/woff2','.ktx2':'image/ktx2','.wasm':'application/wasm'};
const server=createServer(async(q,s)=>{try{const p=decodeURIComponent(new URL(q.url,'http://x').pathname);const f=resolve(site,'.'+(p.endsWith('/')?p+'index.html':p));s.writeHead(200,{'content-type':TYPES[extname(f)]||'application/octet-stream'});s.end(await readFile(f));}catch{s.writeHead(404);s.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const box=(p,s)=>p.locator(s).boundingBox();
try{
 for(const [width,height,touch] of [[1100,760,false],[390,844,true]].filter(([w])=>!process.env.POCKET_WIDTH||+process.env.POCKET_WIDTH===w)){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:touch,serviceWorkers:'block'});
  await ctx.addInitScript(()=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));localStorage.setItem('johansson-town-view','third');sessionStorage.setItem('seeded','1');}Element.prototype.requestFullscreen=async()=>{};});
  const page=await ctx.newPage();page.setDefaultTimeout(240000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const boot=async()=>{await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit`);await page.locator('#enter').click();
   await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);};
  const status=()=>page.evaluate(()=>({...window.__JOHANSSON_AUDIT__.pocket.status(),third:window.__JOHANSSON_AUDIT__.mouse.thirdPerson}));
  await boot();
  // Stand 2.6 m from the nearest resident in town, facing them.
  const spot=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(12*60+20);a.step(500);
   for(const t of a.targets.filter(t=>/^Talk to /.test(t.label)).sort((x,y)=>x.distance-y.distance)){const [tx,,tz]=t.position;
    for(let k=0;k<16;k++){const ang=k*Math.PI/8,x=tx+Math.sin(ang)*2.6,z=tz+Math.cos(ang)*2.6,n=a.navigation(x,z);if(!n.staticBlocked&&!n.residentBlocked)return {name:t.label.replace(/^Talk to /,''),x,z,yaw:Math.atan2(-(tx-x),-(tz-z))};}}return null;});
  assert.ok(spot,'a resident to photograph');
  await page.evaluate(s=>{const a=window.__JOHANSSON_AUDIT__;a.teleport(s.x,s.z,s.yaw,-.08);a.step(120);},spot);
  assert.equal((await status()).third,true,'starts in third person');
  // On the phone the player has chosen a feminine look: their camera is the pink Pocket Lady (pocket-models.js).
  if(touch)await page.evaluate(async()=>{const r=await import('/johansson-town/src/avatars/recipe.js'),base=r.normalizeRecipe({});
   localStorage.setItem('johansson-town-avatar',r.encodeRecipe(r.normalizeRecipe({...base,body:{...base.body,silhouette:'feminine'}})));});
  const model=touch?'Pocket Lady':'Pocket Gentleman',palette=touch?'rose':'green';
  assert.equal((await status()).model,model);
  if(touch){await page.locator('#directoryButton').tap();await page.locator('#pocketButton').tap();}else await page.keyboard.press('f');
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(100));await page.waitForTimeout(300);
  let s=await status();assert.equal(s.raised,true);assert.equal(s.third,false,'raised to his eye');
  assert.equal(await page.locator('.pocket-mark').textContent(),model,'the body carries the model\'s name');
  assert.equal(await page.locator('#pocketViewfinder').getAttribute('data-model'),touch?'lady':'gentleman');
  // The screen is a picture in the page at a whole-pixel scale, inside the window, not the full-screen game canvas.
  const screen=await box(page,'.pocket-screen'),scale=screen.width/128;
  assert.ok(Math.abs(scale-Math.round(scale))<.01&&scale>=1,`whole-pixel scale, got ${scale}`);
  assert.ok(screen.x>=0&&screen.y>=0&&screen.x+screen.width<=width&&screen.y+screen.height<=height,'inside the window');
  for(const b of ['[data-shutter]','[data-lower]']){const r=await box(page,b);assert.ok(r&&r.y+r.height<=height&&r.width>=44&&r.height>=44,b+' on screen and big enough to tap');}
  await page.screenshot({path:`${out}/${width}-1-raised.png`});
  // While it is up: no action is offered, E opens nothing, and (below) Space takes the photo without a jump.
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#contextActions button')].filter(b=>!b.hidden&&b.offsetParent).length),0,'no actions offered with the camera up');
  if(!touch){await page.keyboard.press('e');await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__JOHANSSON_AUDIT__.activities.paused),false,'E opens nothing');}
  const footY=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()).player[1]);const y0=await footY();
  // Residents keep walking (the game runs live between the test's steps): find the subject, turn to them 2 to 4 m
  // away and press the shutter in one go, through the real Space key (desktop) or the real Take button (phone).
  const aimed=await page.evaluate(([name,touch])=>{const a=window.__JOHANSSON_AUDIT__,me=JSON.parse(window.render_game_to_text()).player;
   const t=a.targets.find(t=>t.label==='Talk to '+name);if(!t)return null;let [tx,,tz]=t.position,dx=tx-me[0],dz=tz-me[2],d=Math.hypot(dx,dz);
   if(d<2||d>4){for(let k=0;k<16;k++){const ang=k*Math.PI/8,x=tx+Math.sin(ang)*2.8,z=tz+Math.cos(ang)*2.8,n=a.navigation(x,z);if(!n.staticBlocked&&!n.residentBlocked){a.teleport(x,z,0,0);dx=tx-x;dz=tz-z;break;}}}
   a.face(Math.atan2(-dx,-dz),-.08);a.step(80);const look=a.pocket.look();
   if(touch)document.querySelector('[data-shutter]').click();
   else document.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}));
   document.dispatchEvent(new KeyboardEvent('keyup',{code:'Space',key:' ',bubbles:true}));
   return look;},[spot.name,touch]);
  assert.ok(aimed,'the subject is still about');console.log('the lens saw',JSON.stringify(aimed.filter(l=>l.distance<6)));
  await page.waitForTimeout(150);
  // The message first (it stays 3.5 s, and a step here takes longer than that to draw), then the jump.
  assert.match(await page.locator('.pocket-said').textContent(),new RegExp('^Kept: '+spot.name));
  s=await status();assert.equal(s.album.length,1);assert.equal(s.album[0].palette,palette,'the photo prints in its camera\'s shades');assert.ok(s.album[0].people.includes(spot.name),`${spot.name} is in the photo: ${JSON.stringify(s.album[0])}`);
  if(!touch){await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(200));assert.ok(Math.abs(await footY()-y0)<.02,'Space took the photo and did not make him jump');}
  await page.screenshot({path:`${out}/${width}-2-kept.png`});
  if(touch)await page.locator('[data-lower]').tap();else await page.keyboard.press('f');
  await page.waitForTimeout(150);s=await status();assert.equal(s.raised,false);assert.equal(s.third,true,'back behind him');
  // In a room: the room is the place.
  await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;await a.enter('ramen');a.step(800);a.pocket.raise();a.step(100);});await page.waitForTimeout(200);
  const kept=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.pocket.shoot());assert.equal(kept.ok,true,kept.text);
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.pocket.lower();a.leave();});
  s=await status();assert.equal(s.album[1].place.title,'Sato Ramen');
  // The diary has the first photo of the resident as a discovery with a news sentence.
  const moment=await page.evaluate(()=>Object.values(window.__JOHANSSON_AUDIT__.activities.state.diary.moments).flat().find(m=>m.id==='photo:ph1'));
  assert.equal(moment.kind,'discovery');assert.match(moment.news,new RegExp('^'+spot.name+' was photographed by the mayor'));
  // The album page: wide enough for its photos, captions and buttons, scrolling inside.
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.activities.pocketAlbum());await page.waitForTimeout(300);
  assert.equal(await page.locator('.pocket-album figure').count(),2);
  const photo=await box(page,'.pocket-album figure:first-child .pocket-album-photo'),letGo=await box(page,'.pocket-album figure:first-child button:has-text("Let go")');
  assert.ok(photo.width>=Math.min(220,width-80),'the photo is shown at a readable size, '+photo.width);
  assert.ok(letGo&&letGo.y+letGo.height<=height,'the first photo\'s buttons are on screen');
  await page.screenshot({path:`${out}/${width}-3-album.png`});
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__.activities;a.close();a.save();});
  await boot();
  assert.deepEqual((await status()).album.map(p=>p.id),['ph1','ph2'],'the album is saved with the player');
  assert.deepEqual(errors,[],'no page errors');
  await ctx.close();console.log('pocket camera ok at',width+'x'+height,touch?'(touch)':'');
 }
}finally{await browser.close();server.close();}
