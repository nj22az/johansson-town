// Real-game photographs of Sakura's wall band (drawings SK-WB rev A). Run alone, after build:runtime.
// Usage: TOWN_CHROMIUM_PATH=... node tools/sakura-band-review.mjs [--baseline] [out-dir]
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),baseline=args.includes('--baseline');
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(root,'output/sakura-band-review'));
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

 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;await a.enter('market');a.teleport(5.6,3.3,Math.PI);a.step(60);});
 record('inside Sakura');
 const views=[['back',[0.3,1.62,2.7],[0.3,2.62,-3.93]],['west',[-2.4,1.62,0.4],[-6.8,2.62,0.4]],['east',[2.9,1.62,1.2],[6.8,2.6,1.2]],
  ['oblique',[3.6,1.7,2.4],[-2.2,2.62,-3.93]],['back-close',[-0.5,2.1,-1.6],[0.3,2.67,-3.93]]];
 const shoot=async(tag)=>{for(const [name,pos,at] of views){
  await page.evaluate(([pos,at])=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos,at};a.render();},[pos,at]);
  await page.locator('#game').screenshot({path:resolve(out,`band-${tag}-${name}.png`)});record(`${tag} ${name}`);}};
 await shoot(baseline?'before':'after');
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:[0.3,1.62,2.7],at:[0.3,2.62,-3.93]};a.render();});
 await page.locator('#game').screenshot({path:resolve(out,`band-${baseline?'before':'after'}-phone.png`)});
 check('no page errors',report.errors.length===0);
}catch(error){report.failure=error.stack;throw error;
}finally{
 await writeFile(resolve(out,baseline?'baseline-report.json':'report.json'),JSON.stringify(report,null,2)+'\n');
 await browser.close();server.close();
}
