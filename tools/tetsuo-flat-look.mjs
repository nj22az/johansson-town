// Photographs Tetsuo's flat (interiors/tetsuo-flat.js) in the running game: the room by day and at night, the desk,
// the kitchen and genkan, and the house's new back window from the yard.
//   node tools/tetsuo-flat-look.mjs [out-dir]
// Serves the source tree, so the flat can be looked at before the runtime is rebuilt.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const out=resolve(process.argv[2]||resolve(root,'output/tetsuo-flat-look'));await mkdir(out,{recursive:true});
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
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:960,height:675},serviceWorkers:'block'});
await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'15:00',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
const page=await context.newPage();page.setDefaultTimeout(900000);
const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.warn('Page error:',e.message);});
await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
await page.locator('#enter').click();
await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading&&!window.__JOHANSSON_STREAMING__?.active);
const shot=async(name,minutes,cam,tick=.5,openShoji=false)=>{
 await page.evaluate(([m,c,t,o])=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(m);a.layout?.set?.({shojiOpen:o});a.layout?.tick?.(t,m,0);a.layout?.tick?.(t,m,0);a.camera=c;a.render();},[minutes,cam,tick,openShoji]);
 await page.waitForTimeout(300);await page.locator('#game').screenshot({path:resolve(out,name+'.jpg'),type:'jpeg',quality:86});console.log('wrote',name);
};
// Outside first: the house from the yard path and from behind.
await page.evaluate(()=>{window.__JOHANSSON_AUDIT__.setTime(15*60);});
await shot('01-house-front',15*60,{pos:[-17.2,1.7,-.4],at:[-19.6,1.3,3.2]});
await shot('02-house-back',15*60,{pos:[-20.2,1.7,9.6],at:[-20.6,1.2,6.4]});
await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;await a.enter('resident-home-kenji');});
await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
// Room coordinates: the plan is mirrored for this house (x → −x).
const DAY=15*60,NIGHT=23*60+10,WINTER=null;void WINTER;
await shot('03-room-day',DAY,{pos:[.35,2.0,1.45],at:[2.0,.45,-.9]});
await shot('04-room-night',NIGHT,{pos:[.35,2.0,1.45],at:[2.0,.45,-.9]});
await shot('05-desk',DAY,{pos:[1.0,1.5,-1.3],at:[1.1,.8,1.4]});
await shot('06-kitchen-genkan',DAY,{pos:[-.5,1.6,1.35],at:[-1.6,.9,-1.5]});
await shot('07-window-open',DAY,{pos:[.5,1.5,.6],at:[1.6,1.1,-1.7]},.5,true);
await shot('08-room-from-window',NIGHT,{pos:[1.6,1.9,-1.45],at:[.9,.5,1.2]});
console.log(JSON.stringify(await page.evaluate(()=>window.__JOHANSSON_AUDIT__.layout?.snapshot?.())));
if(process.env.DEBUG_SHOJI)console.log(await page.evaluate(()=>{const out=[];window.__JOHANSSON_AUDIT__.scene.traverse(o=>{if(/Shoji leaf|Window glass|Window view/.test(o.name)){const p=o.getWorldPosition(o.position.clone());out.push(o.name+' vis '+o.visible+' at '+p.toArray().map(v=>v.toFixed(2)).join(','));}});return out.join('\n');}));
console.log('errors',errors.length);
await browser.close();server.close();
