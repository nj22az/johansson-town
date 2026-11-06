// Boots the whole game in a cloud session's software Chromium (swiftshader), presses START, and photographs one street
// view and one room through the ?audit harness, timing each step: the check that the real game, not a stripped-down
// scene, can be looked at from a cloud session.
//   node tools/cloud-boot-smoke.mjs [--source] [--eyes3d] [out-dir]   (--eyes3d: start in third person and photograph Johansson's face)
// The built runtime by default (rebuild it first: npm run build:runtime); --source serves the source modules instead.
// About 35 s to "Island ready" and 60 s to play on a 4-core cloud machine. Run it alone: browsers or test suites
// running beside it starve it, and the island then takes many minutes to draw.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),SOURCE=args.includes('--source'),HERO=args.includes('--world-hero'),EYES3D=args.includes('--eyes3d');
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(root,'output/cloud-boot-smoke'));await mkdir(out,{recursive:true});
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
const t0=Date.now(),at=()=>+((Date.now()-t0)/1000).toFixed(1),report={source:SOURCE,viewport:HERO?[1600,1000]:[390,844],physicalDevice:false,steps:[],errors:[]};
const step=(name,extra={})=>{report.steps.push({name,s:at(),...extra});console.log(at()+'s',name);};
try{
 const context=await browser.newContext({viewport:HERO?{width:1600,height:1000}:{width:390,height:844},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:20',speed:1}));if(new URLSearchParams(location.search).has('eyes3d'))localStorage.setItem('johansson-town-view','third');Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(600000);
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit${EYES3D?'&eyes3d':''}`);step('page loaded');
 await page.locator('#enter:not([disabled])').waitFor();step('island ready');
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);step('playing');
 await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
 const shot=async(name,cam)=>{await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},cam);await page.waitForTimeout(300);
  await page.locator('#game').screenshot({path:resolve(out,name+'.png')});step('photographed '+name);};
 if(HERO){await page.evaluate(()=>window.__JOHANSSON_AUDIT__.setTime(10002*1440+12*60));await shot('sakura-current',{pos:[4,3.5,-36],at:[-12,2.8,-27.3]});}else{
 await shot('street-town-hall-gate',{pos:[20.5,1.7,21.5],at:[22.5,1.4,34]});
 // The rigged eyes, close: in third person (set above), a lens a metre in front of Johansson's face, along his head's facing.
 if(EYES3D){const lens=await page.evaluate(()=>{const head=window.__JOHANSSON_MODEL__.avatar.face.head;head.updateWorldMatrix(true,false);const e=head.matrixWorld.elements,l=Math.hypot(e[8],e[9],e[10]),f=[e[8]/l,e[9]/l,e[10]/l];
  return {pos:[e[12]+f[0],e[13]+f[1]+.05,e[14]+f[2]],at:[e[12],e[13]-.02,e[14]]};});await shot('player-face',lens);}
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;await a.enter('community-kitchen');});
 await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);step('entered the Community Hall');
 await shot('room-community-hall',{pos:[-1.5,1.6,2.2],at:[2,1,-1.5]});
 }
}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
console.log(JSON.stringify({steps:report.steps.length,errors:report.errors}));
if(report.errors.length)process.exit(1);
