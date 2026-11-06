// Local source harness: PHOTO_CHROME overrides the installed headless Chromium path.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const require=createRequire(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:process.env.PHOTO_CHROME||'/root/.cache/ms-playwright/chromium_headless_shell-1161/chrome-linux/headless_shell',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const evidence=new URL('../tests/evidence/photo-studio/',import.meta.url);await mkdir(evidence,{recursive:true});
try{
 for(const [width,height] of [[1440,1000],[390,844],[844,390],[320,568]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<500,acceptDownloads:true});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.stack);});
  await page.route('http://photo.test/**',async route=>{
   const path=new URL(route.request().url()).pathname;
   if(path==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/base.css"><link rel="stylesheet" href="/photo-mode.css"></head><body><button id="opener" style="position:fixed;z-index:100">Open photo studio</button><canvas id="game"></canvas></body></html>'});
   try{await route.fulfill({body:await readFile(new URL('..'+path,import.meta.url)),contentType:path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Not found'});}
  });
  await page.goto('http://photo.test/');
  await page.evaluate(async()=>{
   const THREE=await import('/vendor/three.module.js'),{createPhotoStudio}=await import('/src/photo/studio.js'),{buildWarehouseInterior}=await import('/src/world/interiors/warehouse.js');
   const scene=new THREE.Scene(),room=new THREE.Group();scene.add(room);scene.background=new THREE.Color('#a6b8bc');buildWarehouseInterior({room,reg(){},collider(){},action(){},exit(){}});scene.add(new THREE.HemisphereLight(0xe8f0ea,0x766a56,2));
   const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#game'),antialias:true});renderer.setSize(innerWidth,innerHeight,false);
   const gameCamera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,100);gameCamera.position.set(0,1.7,4.4);
   const actor=new THREE.Group();actor.visible=false;actor.position.set(5,2,3);scene.add(actor);window.original=actor;window.openCount=0;window.closeCount=0;
   let placeX=0;window.placeVisits=[];window.studio=createPhotoStudio({scene,renderer,gameCamera,draw:view=>renderer.render(scene,view),getContext:()=>({position:new THREE.Vector3(placeX,0,4.4),yaw:0,cast:[{name:'Mrs Sato'},{name:'Thuan',outfit:'sailor'}],hide:[actor]}),getLocations:()=>[{id:'garden',title:'Aoba pond garden',icon:'map'},{id:'ramen',title:'Sato Ramen',icon:'door'}],onLocation:async place=>{placeX=place.id==='garden'?1:0;window.placeVisits.push(place.id);},onOpen:()=>window.openCount++,onClose:()=>{window.closeCount++;renderer.setSize(innerWidth,innerHeight,false);}});
   document.querySelector('#opener').onclick=()=>studio.open();const tick=()=>{requestAnimationFrame(tick);studio.render();};tick();
  });
  await page.getByRole('button',{name:'Open photo studio',exact:true}).click();
  const frame=await page.locator('.photo-frame').boundingBox(),before=await page.evaluate(()=>studio.snapshot());
  const point=before.actors[0].screen;await page.mouse.move(frame.x+point[0]*frame.width,frame.y+point[1]*frame.height);await page.mouse.down();await page.mouse.move(frame.x+point[0]*frame.width+30,frame.y+point[1]*frame.height+20,{steps:5});await page.mouse.up();
  const after=await page.evaluate(()=>studio.snapshot());assert.equal(after.selected,0);assert.ok(Math.abs(after.actors[0].x-before.actors[0].x)>.02);assert.equal(after.camera.azimuth,before.camera.azimuth);
  const dressed=await page.evaluate(()=>studio.snapshot().actors[1].outfit);assert.equal(dressed.top,'sailorlong');
  await page.getByRole('button',{name:'Rotate character',exact:true}).click();
  const turnStart=await page.evaluate(()=>studio.snapshot());const pt=turnStart.actors[0].screen;
  await page.mouse.move(frame.x+pt[0]*frame.width,frame.y+pt[1]*frame.height);await page.mouse.down();await page.mouse.move(frame.x+pt[0]*frame.width+45,frame.y+pt[1]*frame.height,{steps:5});await page.mouse.up();
  const turned=await page.evaluate(()=>studio.snapshot());assert.ok(Math.abs(turned.actors[0].turn-turnStart.actors[0].turn)>10);assert.equal(turned.actors[0].x,turnStart.actors[0].x);assert.equal(turned.camera.azimuth,turnStart.camera.azimuth);
  // Dressing up is Johansson Studio's: the photo studio has no wardrobe, and everyone wears their own clothes.
  assert.equal(await page.locator('summary',{hasText:'Wardrobe'}).count(),0);assert.equal(await page.locator('select[name^=wear]').count(),0);
  await page.getByRole('button',{name:'Face camera',exact:true}).click();await page.getByRole('button',{name:'Move character',exact:true}).click();
  await page.locator('[data-tab="place"]').click();await page.getByRole('button',{name:'Aoba pond garden',exact:true}).click();await page.waitForFunction(()=>!studio.snapshot().busy);assert.deepEqual(await page.evaluate(()=>placeVisits),['garden']);assert.equal(await page.evaluate(()=>studio.snapshot().actors.length),2);
  await page.locator('[data-tab="cast"]').click();
  await page.getByRole('button',{name:'Cheer',exact:true}).click();await page.getByRole('button',{name:'Surprised',exact:true}).click();
  await page.getByLabel('Speech bubble',{exact:true}).fill('The cargo is HOW late?');
  await page.getByLabel('Style',{exact:true}).selectOption('meme');await page.locator('[data-tab="text"]').click();await page.getByLabel('Top text · meme',{exact:true}).fill('ONE SMALL DELIVERY');await page.getByLabel('Bottom text · meme or comic',{exact:true}).fill('Six pallets later…');
  const geometry=await page.evaluate(()=>{const root=document.querySelector('#photoStudio'),frame=document.querySelector('.photo-frame').getBoundingClientRect();return {overflow:root.scrollWidth>innerWidth,frame:{x:frame.x,y:frame.y,w:frame.width,h:frame.height},active:studio.active};});assert.equal(geometry.overflow,false);assert.ok(geometry.frame.w>150&&geometry.frame.h>120);assert.equal(geometry.active,true);
  const captureButton=page.getByRole('button',{name:'Capture panel',exact:true});if(width<500)await captureButton.tap();else await captureButton.click();await page.waitForFunction(()=>studio.panelCount===1);
  await page.locator('[data-tab="film"]').click();const first=await page.locator('.photo-film a').first().getAttribute('href');
  const png=await page.evaluate(async url=>{const b=await(await fetch(url)).blob(),bitmap=await createImageBitmap(b),c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;const x=c.getContext('2d');x.drawImage(bitmap,0,0);const p=x.getImageData(0,0,c.width,c.height).data;let varied=0;for(let i=0;i<p.length;i+=800)if(p[i]!==p[0]||p[i+1]!==p[1])varied++;return {w:bitmap.width,h:bitmap.height,bytes:b.size,varied};},first);assert.deepEqual([png.w,png.h],[1200,900]);assert.ok(png.bytes>20000&&png.varied>100,JSON.stringify(png));
  // Set and film: a sunset backdrop, in black and white.
  await page.locator('[data-tab="cast"]').click();await page.getByRole('button',{name:'Line up',exact:true}).click();
  await page.locator('[data-tab="camera"]').click();await page.locator('summary',{hasText:'Set & film'}).click();await page.getByLabel('Backdrop',{exact:true}).selectOption('sunset');await page.getByLabel('Film',{exact:true}).selectOption('mono');
  for(const format of ['square','portrait']){await page.getByLabel('Format',{exact:true}).selectOption(format);await page.getByRole('button',{name:'Capture panel',exact:true}).click();await page.waitForFunction(n=>studio.panelCount===n,format==='square'?2:3);}
  await page.locator('[data-tab="film"]').click();
  // The black-and-white film is in the saved pixels, not only on the preview.
  const grey=await page.evaluate(async url=>{const b=await(await fetch(url)).blob(),im=await createImageBitmap(b),c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const p=x.getImageData(0,0,c.width,c.height).data;let tinted=0,n=0;for(let i=0;i<p.length;i+=4000){n++;if(Math.max(p[i],p[i+1],p[i+2])-Math.min(p[i],p[i+1],p[i+2])>20)tinted++;}return tinted/n;},await page.locator('.photo-film a').nth(1).getAttribute('href'));assert.ok(grey<.02,'mono film baked in: '+grey);
  await page.getByRole('button',{name:'Capture panel',exact:true}).click();await page.waitForFunction(()=>studio.panelCount===4);assert.ok(await page.getByRole('button',{name:'Capture panel',exact:true}).isDisabled());
  await page.getByRole('button',{name:'Save comic PNG',exact:true}).click();await page.getByRole('link',{name:'Download comic PNG',exact:true}).waitFor();
  const comic=await page.evaluate(async()=>{const b=await(await fetch(document.querySelector('[data-comic-link] a').href)).blob(),im=await createImageBitmap(b);return {w:im.width,h:im.height,bytes:b.size};});assert.equal(comic.w,1200);assert.ok(comic.h>800&&comic.bytes>30000);
  await page.getByLabel('Format',{exact:true}).selectOption('landscape');await page.screenshot({path:fileURLToPath(new URL(`${width}x${height}.png`,evidence))});
  await page.locator('[data-tab="cast"]').click();for(let i=0;i<4;i++)await page.getByRole('button',{name:'Add',exact:true}).click();assert.ok(await page.getByRole('button',{name:'Add',exact:true}).isDisabled());
  await page.getByRole('button',{name:'Remove character',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Add',exact:true}).isDisabled(),false);
  await page.getByRole('button',{name:'Return to town',exact:true}).click();assert.equal(await page.evaluate(()=>studio.active),false);assert.equal(await page.evaluate(()=>original.visible),false);assert.deepEqual(await page.evaluate(()=>original.position.toArray()),[5,2,3]);assert.equal(await page.locator('body > #game').count(),1);assert.equal(await page.evaluate(()=>document.activeElement.id),'opener');
  await page.getByRole('button',{name:'Open photo studio',exact:true}).click();assert.equal(await page.locator('.photo-film figure').count(),4);await page.locator('[data-tab="film"]').click();await page.getByRole('button',{name:'Remove panel 2',exact:true}).click();assert.equal(await page.locator('.photo-film figure').count(),3);
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>studio.active),false);assert.equal(await page.evaluate(()=>closeCount),2);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({viewport:[width,height],png,comic,errors}));await page.close();
 }
}finally{await browser.close();}
