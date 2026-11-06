// Photographs the Minato Maru's electrical workshop (ferry-interior.js, Fr 45–52) in the running game, in the ship's
// own frame wherever she lies: the bench, the test panel, the room from forward, the door from the workshop.
//   node tools/ferry-workshop-look.mjs [out-dir]
// Serves the source tree, so the flat can be looked at before the runtime is rebuilt.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const out=resolve(process.argv[2]||resolve(root,'output/ferry-workshop-look'));await mkdir(out,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.hdr':'application/octet-stream'};
const sourcePage=html=>html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'')
 .replace(/import\(['"]\.\/runtime\/boot-[^'"]+['"]\)/g,"import('./src/boot.js')")
 .replace(/from ['"]\.\/runtime\/audio-[^'"]+['"]/g,"from './src/audio/town-audio.js?snappy=1'")
 .replace(/window\.JOHANSSON_FEED_MODULE="[^"]+"/,'window.JOHANSSON_FEED_MODULE="./src/feed/mount.js"')
 .replace(/window\.JOHANSSON_PORTRAIT_MODULE="[^"]+"/,'window.JOHANSSON_PORTRAIT_MODULE="./src/avatars/guide-portraits.js"');
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);
 const file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(site))throw Error('outside');
 let body=await readFile(file);if(file===resolve(root,'index.html'))body=sourcePage(body.toString());
 res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
import {FERRY_SHIP} from '../src/world/ferry-ship.js';
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:960,height:675},serviceWorkers:'block'});
await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
const page=await context.newPage();page.setDefaultTimeout(900000);
const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.warn('Page error:',e.message);});
await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
await page.locator('#enter').click();
await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading&&!window.__JOHANSSON_STREAMING__?.active);
const HALF=FERRY_SHIP.length/2,Z=z=>z-HALF,Y=y=>y-FERRY_SHIP.draft,y0=Y(.9);
const shot=async(name,pos,at)=>{
 await page.evaluate(([p,a])=>{const A=window.__JOHANSSON_AUDIT__,f=A.world.ferry.ferry;f.updateMatrixWorld(true);const V=f.position.constructor,w=v=>f.localToWorld(new V(...v)).toArray();
  A.setTime(12*60);A.camera={pos:w(p),at:w(a)};A.render();},[pos,at]);
 await page.waitForTimeout(300);await page.locator('#game').screenshot({path:resolve(out,name+'.jpg'),type:'jpeg',quality:86});console.log('wrote',name);
};
await shot('01-from-the-door',[.3,y0+1.55,Z(22.75)],[2.2,y0+.9,Z(26)]);
await shot('03b-meter',[1.9,y0+1.35,Z(24.9)],[1.75,y0+.95,Z(25.65)]);
await shot('02-test-panel',[.6,y0+1.5,Z(23.1)],[-3.0,y0+1.0,Z(25.7)]);
await shot('03-bench',[1.9,y0+1.45,Z(24.4)],[2.3,y0+1.0,Z(25.9)]);
await shot('04-from-forward',[-1.8,y0+1.6,Z(25.6)],[1.2,y0+.6,Z(22.6)]);
await shot('05-workshop-door',[2.0,y0+1.5,Z(20.2)],[.25,y0+1.0,Z(22.5)]);
console.log('errors',errors.length);
await browser.close();server.close();
