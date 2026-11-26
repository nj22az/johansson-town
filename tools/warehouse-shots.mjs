// Photographs the Harbour Warehouse's inside in the running game (world/interiors/warehouse.js: the bay, the mezzanine,
// the stair): boots World in a cloud session's software Chromium, enters the warehouse through the audit harness, and
// photographs the bay from the door, the racks under the mezzanine, the stair, and the mezzanine from the top of it.
//   node tools/warehouse-shots.mjs [--source] [out-dir]
// The built runtime by default (npm run build:runtime first); --source serves the source modules. Run it alone.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),SOURCE=args.includes('--source');
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(root,'output/warehouse-shots'));await mkdir(out,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.hdr':'application/octet-stream','.wasm':'application/wasm'};
const sourcePage=html=>html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'')
 .replace(/import\(['"]\.\/runtime\/boot-[^'"]+['"]\)/g,"import('./src/boot.js')")
 .replace(/from ['"]\.\/runtime\/audio-[^'"]+['"]/g,"from './src/audio/town-audio.js?snappy=1'")
 .replace(/window\.JOHANSSON_FEED_MODULE="[^"]+"/,'window.JOHANSSON_FEED_MODULE="./src/feed/mount.js"')
 .replace(/window\.JOHANSSON_PORTRAIT_MODULE="[^"]+"/,'window.JOHANSSON_PORTRAIT_MODULE="./src/avatars/guide-portraits.js"');
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);
 const file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(site))throw Error('outside');
 let body=await readFile(file);if(SOURCE&&file===resolve(root,'index.html'))body=sourcePage(body.toString());
 res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const t0=Date.now(),at=()=>+((Date.now()-t0)/1000).toFixed(1),report={source:SOURCE,steps:[],errors:[],warnings:[]};
const step=(name,extra={})=>{report.steps.push({name,s:at(),...extra});console.log(at()+'s',name,Object.keys(extra).length?JSON.stringify(extra):'');};
try{
 const context=await browser.newContext({viewport:{width:900,height:900},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:20',speed:1}));localStorage.setItem('johansson-town-view','third');Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(900000);
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')report.warnings.push(m.text().slice(0,300));});
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);step('page loaded');
 await page.locator('#enter:not([disabled])').waitFor();step('island ready');
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);step('playing');
 await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.hud.photo(true));
 await page.evaluate(async()=>{await window.__JOHANSSON_AUDIT__.enter('warehouse');});
 await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
 step('in the warehouse',{player:await page.evaluate(()=>window.__JOHANSSON_AUDIT__.player)});
 const stand=(x,y,z,ms=600)=>page.evaluate(([x,y,z,ms])=>{const a=window.__JOHANSSON_AUDIT__;a.stand(x,y,z,0);for(let i=0;i<ms/50;i++)a.step(50);return a.player;},[x,y,z,ms]);
 const shot=async(name,cam)=>{await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},cam);await page.waitForTimeout(300);
  await page.locator('#game').screenshot({path:resolve(out,name+'.png')});step('photographed '+name);};
 step('by the door',{player:(await stand(0,0,3.6)).position});
 await shot('1-bay-from-the-door',{pos:[-.4,1.7,4.9],at:[.2,1.7,-2]});
 await shot('2-under-the-mezzanine',{pos:[0,1.5,.2],at:[-.4,1.2,-4.6]});
 await shot('3-stair-and-shutter',{pos:[-1.9,1.9,2.6],at:[2.4,1.3,.4]});
 await shot('4-depot-racks-and-drums',{pos:[1.6,1.8,3.9],at:[-2.6,.9,1.6]});
 step('half way up the stair',{player:(await stand(2.28,1.3,-.05)).position});
 await shot('5-on-the-stair',{pos:[.6,2.5,1.9],at:[2.3,1.9,-.6]});
 step('on the mezzanine',{player:(await stand(.4,2.6,-3.2)).position});
 await shot('6-mezzanine',{pos:[2.3,4.25,-2.1],at:[-1.4,3.1,-4.7]});
 await shot('7-mezzanine-east',{pos:[-2.3,4.3,-2.2],at:[2.2,3.0,-4.4]});
 await shot('8-bay-from-the-gate',{pos:[-.9,4.2,-2.6],at:[.2,.6,3.4]});
}catch(e){report.errors.push(String(e?.stack||e));console.error(e);}
finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,1));await browser.close();server.close();}
console.log(report.errors.length?'ERRORS '+JSON.stringify(report.errors):'no page errors');
process.exit(report.errors.length?1:0);
