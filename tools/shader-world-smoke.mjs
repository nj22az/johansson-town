// Shared shader acceptance: boots the whole game in a cloud session's software Chromium (swiftshader), presses START, and photographs one street
// view and one room through the ?audit harness, timing each step: the check that the real game, not a stripped-down
// scene, can be looked at from a cloud session.
//   node tools/shader-world-smoke.mjs [--source] [--baseline=<git-ref>] [out-dir]
// The built runtime by default (rebuild it first: npm run build:runtime); --source serves the source modules instead.
// About 35 s to "Island ready" and 60 s to play on a 4-core cloud machine. Run it alone: browsers or test suites
// running beside it starve it, and the island then takes many minutes to draw.
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),SOURCE=args.includes('--source');
const proofLooks=(args.find(a=>a.startsWith('--looks='))?.slice(8)||'manga,flat,oil,crayon').split(',');
const baselineRef=args.find(a=>a.startsWith('--baseline='))?.slice(11),baselineHTML=baselineRef?execFileSync('git',['show',baselineRef+':johansson-town/index.html'],{cwd:site,encoding:'utf8'}):null;
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(root,'output/cloud-boot-smoke'));await mkdir(out,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.hdr':'application/octet-stream','.wasm':'application/wasm'};
const sourcePage=html=>html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'')
 .replace(/import\(['"]\.\/runtime\/boot-[^'"]+['"]\)/g,"import('./src/boot.js')")
 .replace(/from ['"]\.\/runtime\/audio-[^'"]+['"]/g,"from './src/audio/town-audio.js?snappy=1'")
 .replace(/window\.JOHANSSON_FEED_MODULE="[^"]+"/,'window.JOHANSSON_FEED_MODULE="./src/feed/mount.js"')
 .replace(/window\.JOHANSSON_PORTRAIT_MODULE="[^"]+"/,'window.JOHANSSON_PORTRAIT_MODULE="./src/avatars/guide-portraits.js"');
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);
 const file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(site))throw Error('outside');
 let body=await readFile(file);if(baselineHTML&&file===resolve(root,'index.html'))body=Buffer.from(baselineHTML);if(SOURCE&&file===resolve(root,'index.html'))body=sourcePage(body.toString());
 res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const t0=Date.now(),at=()=>+((Date.now()-t0)/1000).toFixed(1),report={source:SOURCE,baseline:baselineRef||null,viewport:[390,844],physicalDevice:false,steps:[],errors:[]};
const step=(name,extra={})=>{report.steps.push({name,s:at(),...extra});console.log(at()+'s',name);};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:20',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(600000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Shader Error|VALIDATE_STATUS/.test(m.text()))report.errors.push(m.text());});
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);step('page loaded');
 await page.locator('#enter:not([disabled])').waitFor();step('island ready');
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);step('playing');
 await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
 const shot=async(name,cam)=>{await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},cam);await page.waitForTimeout(300);
  await page.locator('#game').screenshot({path:resolve(out,name+'.png')});step('photographed '+name);};
 for(const look of proofLooks){await page.evaluate(n=>window.__JOHANSSON_LOOK__.setStyle(n),look);await shot('street-'+look,{pos:[20.5,1.7,21.5],at:[22.5,1.4,34]});if(!await page.evaluate(n=>window.__JOHANSSON_LOOK__.state?.look===n,look))throw Error('World fell back from '+look);}
 await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;await a.enter('community-kitchen');});
 await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);step('entered the Community Hall');
 for(const look of proofLooks){await page.evaluate(n=>window.__JOHANSSON_LOOK__.setStyle(n),look);await shot('room-'+look,{pos:[-1.5,1.6,2.2],at:[2,1,-1.5]});if(!await page.evaluate(n=>window.__JOHANSSON_LOOK__.state?.look===n,look))throw Error('World fell back from '+look);}
 if(args.includes('--izakaya')){
  await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.setTime(19*60);await a.enter('izakaya');});
  await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);step('entered Minato Izakaya');
  for(const look of proofLooks){await page.evaluate(n=>window.__JOHANSSON_LOOK__.setStyle(n),look);await shot('izakaya-'+look,{pos:[1.0,1.75,-1.0],at:[-1.8,1.1,-3.0]});if(!await page.evaluate(n=>window.__JOHANSSON_LOOK__.state?.look===n,look))throw Error('World fell back from '+look);}
 }
}catch(error){report.errors.push(error.message);throw error;}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
console.log(JSON.stringify({steps:report.steps.length,errors:report.errors}));
if(report.errors.length)process.exit(1);
