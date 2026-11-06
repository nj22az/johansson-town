// Real-game notice-board acceptance. Run alone, after build:runtime.
// --baseline photographs the unmodified compiled game before the first build.
// Usage: TOWN_CHROMIUM_PATH=... node tools/woodland-poster-review.mjs [--baseline] [out-dir]
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),baseline=args.includes('--baseline');
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(root,'output/woodland-poster-review'));
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.gz':'application/gzip','.svg':'image/svg+xml','.hdr':'application/octet-stream','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{
 try{const path=decodeURIComponent(new URL(req.url,'http://local').pathname),file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));
  if(!file.startsWith(site+'/'))throw Error('outside');
  const body=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const start=Date.now(),report={baseline,physicalDevice:false,steps:[],errors:[],checks:[],modelRequests:0};
const record=(name,extra={})=>{const row={name,seconds:+((Date.now()-start)/1000).toFixed(1),...extra};report.steps.push(row);console.log(JSON.stringify(row));};
const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};
try{
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:20',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(240000);
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('request',req=>{if(/woodland\.glb(?:\.gz)?(?:\?|$)/.test(req.url()))report.modelRequests++;});
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);record('page loaded');
 await page.locator('#enter:not([disabled])').waitFor();record('island ready');
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;if(a.player.room)await a.leave();if(a.seated)a.interact();a.setTime(10002*1440+12*60);a.teleport(5.5,-31.25,0,0);a.step(100);});
 record('playing at harbour board');
 check('model is not requested at World startup',report.modelRequests===0);
 const pose=await page.evaluate(()=>({...window.__JOHANSSON_POSE__}));
 const photographBoard=async(name,phone=false)=>{
  await page.evaluate(phone=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.teleport(3.5,-31.25,0,0);a.step(50);a.camera={pos:[5.5,1.66,phone?-30.5:-31.85],at:[5.5,1.55,-33.2]};a.render();},phone);
  await page.locator('#game').screenshot({path:resolve(out,name+'.png')});record(name);
 };
 if(baseline){
  await photographBoard('woodland-board-before-desktop');
  await page.setViewportSize({width:390,height:844});
  await photographBoard('woodland-board-before-phone',true);
 }else{
  const openBoard=async()=>{
   await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.activities.close();a.camera=null;a.teleport(5.5,-31.25,0,0);a.step(100);a.interact();});
   await page.getByRole('button',{name:'Look',exact:true}).waitFor();
  };
  const openViewer=async()=>{
   await openBoard();await page.getByRole('button',{name:'Look',exact:true}).click();
   const frame=page.frameLocator('#activity iframe');
   await page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.activities.viewerActive);
   await frame.locator('canvas').waitFor();
   await page.locator('#activity iframe[aria-busy="false"]').waitFor();
   return frame;
  };
  await photographBoard('woodland-board-after-desktop');
  // The remade case (JW-NB rev A) from the other sides: oblique, rear, the hood and header close up.
  for(const [name,pos,at] of [['noticeboard-oblique-desktop',[7.3,1.45,-31.7],[5.5,1.6,-33.2]],['noticeboard-rear-desktop',[4.4,1.55,-35.4],[5.5,1.4,-33.2]],['noticeboard-header-close-desktop',[5.9,1.95,-32.55],[5.5,2.05,-33.15]],['noticeboard-flyer-close-desktop',[6.0,1.55,-32.6],[5.965,1.53,-33.2]]]){
   await page.evaluate(([pos,at])=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.teleport(3.5,-31.25,0,0);a.step(50);a.camera={pos,at};a.render();},[pos,at]);
   await page.locator('#game').screenshot({path:resolve(out,name+'.png')});record(name);
  }
  await openBoard();
  await page.screenshot({path:resolve(out,'woodland-board-look-menu-desktop.png')});
  check('board menu still does not request model',report.modelRequests===0);
  await page.getByRole('button',{name:'Read Thuan’s flyer',exact:true}).click();
  check('Thuan flyer remains readable',await page.locator('#activityBody img').count()>0);
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.activities.close());
  const frame=await openViewer();record('Look opened the 3D viewer');
  await page.screenshot({path:resolve(out,'woodland-viewer-in-world-desktop.png')});
  check('Look loads the real model',report.modelRequests===1);
  check('exactly one viewer is mounted',await page.locator('#activity iframe').count()===1);
  const count=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.renderer.info.render.frame);
  await page.waitForTimeout(200);
  check('hidden World stops rendering',count===await page.evaluate(()=>window.__JOHANSSON_AUDIT__.renderer.info.render.frame));
  await frame.locator('body').press('Escape');
  await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.activities.paused);
  check('Escape removes the iframe',await page.locator('#activity iframe').count()===0);
  check('return retains player position',await page.evaluate(p=>{const a=window.__JOHANSSON_POSE__;return Math.abs(a.x-p.x)<.001&&Math.abs(a.z-p.z)<.001;},pose));
  await openViewer();await page.goBack();
  await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.activities.paused);
  check('browser Back closes without leaving World',page.url().includes('/johansson-town/?audit')&&await page.locator('#activity iframe').count()===0);
  await openViewer();
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.activities.inventory());
  check('replacing the modal destroys the viewer',await page.locator('#activity iframe').count()===0);
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.activities.close());
  await page.setViewportSize({width:390,height:844});
  await photographBoard('woodland-board-after-phone',true);
  await openBoard();await page.screenshot({path:resolve(out,'woodland-board-look-menu-phone.png')});
  const phoneFrame=await openViewer();
  await page.screenshot({path:resolve(out,'woodland-viewer-in-world-phone.png')});
  check('phone has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check('embedded viewer fits the phone',await phoneFrame.locator('body').evaluate(e=>e.scrollWidth<=innerWidth));
  await page.locator('#closeActivity').click();
  await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.activities.paused);
  check('Close returns to World and removes iframe',await page.locator('#activity iframe').count()===0);
  await photographBoard('woodland-return-to-world-phone',true);
  record('all entry and return checks passed');
 }
 check('no page errors',report.errors.length===0);
}catch(error){report.failure=error.stack;throw error;
}finally{
 await writeFile(resolve(out,baseline?'baseline-report.json':'report.json'),JSON.stringify(report,null,2)+'\n');
 await browser.close();server.close();
}
