// Photographs the actual bridge in the running game: wide, radar, chart and phone helm.
// node tools/ferry-bridge-look.mjs [out-dir]
// Uses source modules; TOWN_CHROMIUM_PATH may select an installed Chromium executable.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7);
const out=resolve(process.argv[2]||resolve(root,'output/ferry-bridge-look'));await mkdir(out,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.hdr':'application/octet-stream'};
const sourcePage=html=>html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'')
 .replace(/import\(['"]\.\/runtime\/boot-[^'"]+['"]\)/g,"import('./src/boot.js')")
 .replace(/from ['"]\.\/runtime\/audio-[^'"]+['"]/g,"from './src/audio/town-audio.js?snappy=1'")
 .replace(/window\.JOHANSSON_FEED_MODULE="[^"]+"/,'window.JOHANSSON_FEED_MODULE="./src/feed/mount.js"')
 .replace(/window\.JOHANSSON_PORTRAIT_MODULE="[^"]+"/,'window.JOHANSSON_PORTRAIT_MODULE="./src/avatars/guide-portraits.js"');
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);
 const file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(site))throw Error('outside');
 let body=await readFile(file);if(!process.argv.includes('--runtime')&&file===resolve(root,'index.html'))body=sourcePage(body.toString());
 res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
import {FERRY_HEIGHTS,FERRY_SHIP} from '../src/world/ferry-ship.js';
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:960,height:675},serviceWorkers:'block'});
await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
const page=await context.newPage();page.setDefaultTimeout(180000);
const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.warn('Page error:',e.message);});
await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
await page.locator('#enter').click();
await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading&&!window.__JOHANSSON_STREAMING__?.active);
const HALF=FERRY_SHIP.length/2,Z=z=>z-HALF,Y=y=>y-FERRY_SHIP.draft,y0=Y(FERRY_HEIGHTS.bridgeDeck);
const shot=async(name,pos,at)=>{
 if(only&&!new RegExp(only).test(name))return;
 await page.evaluate(([p,a])=>{const A=window.__JOHANSSON_AUDIT__,f=A.world.ferry.ferry;f.updateMatrixWorld(true);const V=f.position.constructor,w=v=>f.localToWorld(new V(...v)).toArray();
  A.setTime(12*60);A.camera={pos:w(p),at:w(a)};A.render();},[pos,at]);
 await page.waitForTimeout(300);await page.locator('#game').screenshot({path:resolve(out,name+'.jpg'),type:'jpeg',quality:86});console.log('wrote',name);
};
await shot('01-bridge-wide',[1.9,y0+1.65,Z(20.55)],[0,y0+1.22,Z(22.5)]);
await shot('02-radar',[-.95,y0+1.42,Z(21.65)],[-.95,y0+1.28,Z(22.45)]);
await shot('03-chart',[-1.6,y0+1.65,Z(20.5)],[-2.3,y0+.96,Z(19.98)]);
await page.setViewportSize({width:390,height:844});
await shot('04-phone-helm',[0,y0+1.65,Z(20.85)],[0,y0+1.2,Z(22.5)]);
console.log('errors',errors.length);if(errors.length)process.exitCode=1;
await browser.close();server.close();
