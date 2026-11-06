// Fresh tablet/desktop contexts: resizing an iPhone context is not a tablet acceptance test.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {webkit,devices} from 'playwright';
import {checkFerryExploration} from './ferry-exploration-check.mjs';

const site=resolve(new URL('../..',import.meta.url).pathname),out=resolve(site,'johansson-town/output/ferry-exploration');await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://local').pathname),file=resolve(site,'.'+path+(path.endsWith('/')?'index.html':''));if(!file.startsWith(site+'/'))throw Error('Outside repository');const body=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const report={physicalDevice:false,engine:'WebKit / software graphics',profiles:[],passed:false},started=Date.now();let browser;
try{
 browser=await webkit.launch({headless:false});
 const profiles=[['ipad-portrait',{...devices['iPad Mini'],viewport:{width:744,height:1133},screen:{width:744,height:1133}}],['ipad-landscape',{...devices['iPad Mini'],viewport:{width:1133,height:744},screen:{width:1133,height:744}}],['desktop',{viewport:{width:1280,height:800},deviceScaleFactor:1,hasTouch:false,isMobile:false}]];
 const requested=process.argv[2];if(requested&&!profiles.some(([name])=>name===requested))throw Error('Unknown exploration profile: '+requested);
 for(const [name,options] of profiles.filter(([name])=>!requested||name===requested)){
  const dir=resolve(out,name);await mkdir(dir,{recursive:true});const entry={name,viewport:options.viewport,steps:[],errors:[]};report.profiles.push(entry);
  const context=await browser.newContext({...options,serviceWorkers:'block',recordVideo:{dir:resolve(dir,'recordings'),size:options.viewport}}),page=await context.newPage();
  page.on('pageerror',e=>entry.errors.push(e.message));
  const step=(name,data={})=>{const s={name,seconds:+((Date.now()-started)/1000).toFixed(2),...data};entry.steps.push(s);console.log(JSON.stringify(s));};
  const settleLoads=async()=>{await page.waitForLoadState('networkidle',{timeout:60000});await page.waitForFunction(()=>!window.__JOHANSSON_STREAMING__?.active&&!window.__JOHANSSON_AUDIT__?.blocked.roomLoading,null,{timeout:60000});await page.waitForLoadState('networkidle',{timeout:60000});};
  try{
   await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));
   await page.goto('http://127.0.0.1:'+server.address().port+'/johansson-town/?audit&cinematic=off');
   await page.waitForFunction(()=>{const b=document.querySelector('#enter');return b&&!b.disabled;},null,{timeout:180000});
   if(options.hasTouch)await page.locator('#enter').tap({timeout:120000});else await page.locator('#enter').click({timeout:120000});
   await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&!window.__JOHANSSON_AUDIT__?.blocked.catchingUp,null,{timeout:120000});await settleLoads();
   const view=await page.evaluate(()=>({width:innerWidth,height:innerHeight,canvas:document.querySelector('#game').getBoundingClientRect().toJSON(),graphics:window.__JOHANSSON_LOOK__?.state}));
   assert.ok(Math.abs(view.canvas.width-view.width)<2&&Math.abs(view.canvas.height-view.height)<2,'Canvas fills the real fresh viewport');
   assert.equal(view.graphics.ink,true);assert.equal(view.graphics.grade,true);assert.equal(view.graphics.hdr,true);assert.equal(view.graphics.samples,4);step('fresh viewport and full graphics',view);
   await checkFerryExploration({page,out:dir,step,settleLoads,touch:!!options.hasTouch,profile:name});assert.deepEqual(entry.errors,[]);entry.passed=true;
  }catch(e){entry.passed=false;entry.failure=e.stack||e.message;await page.screenshot({path:resolve(dir,'failure.png')}).catch(()=>{});throw e;}
  finally{await context.close();}
 }
 report.passed=true;
}catch(e){report.failure=e.stack||e.message;process.exitCode=1;}
finally{report.seconds=+((Date.now()-started)/1000).toFixed(2);await browser?.close();await new Promise(resolve=>server.close(resolve));await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
