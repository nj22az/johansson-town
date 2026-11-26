// Photographs Sakura's customer restroom in the running game (drawing SK-401: the drawn toilet, basin and tap, and the
// door that is shut until somebody comes to it). Boots World in a cloud session's software Chromium, enters Sakura
// through the audit harness, and photographs: the door from the shop with nobody near (shut), with the player at it
// (open), and the toilet, the cistern and the basin from inside.
//   node tools/restroom-shots.mjs [--source] [out-dir]
// The built runtime by default (npm run build:runtime first); --source serves the source modules. Run it alone.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),SOURCE=args.includes('--source');
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(root,'output/restroom-shots'));await mkdir(out,{recursive:true});
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
 await page.evaluate(async()=>{await window.__JOHANSSON_AUDIT__.enter('market');});
 await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
 step('in Sakura',{player:await page.evaluate(()=>window.__JOHANSSON_AUDIT__.player)});
 // What the room holds: the drawn fixtures or the stand-ins, and the door.
 const find=()=>page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;let scene=a.scene;if(!scene){scene=window.__JOHANSSON_MODEL__?.avatar?.root;while(scene?.parent)scene=scene.parent;}
  const names=['Restroom sanitary ware','Restroom plain fixtures','Toilet','Washbasin','FlushLever','TapHandle','Sakura restroom door'],found={};
  scene.traverse(o=>{if(names.includes(o.name)){let v=true;for(let q=o;q;q=q.parent)if(!q.visible)v=false;if(v){o.updateWorldMatrix(true,false);const e=o.matrixWorld.elements;found[o.name]={at:[e[12],e[13],e[14]].map(n=>+n.toFixed(3)),yaw:+o.rotation.y.toFixed(3),leverDip:+o.rotation.x.toFixed(3)};}}});return found;});
 const stand=(x,z,ms=1500)=>page.evaluate(([x,z,ms])=>{const a=window.__JOHANSSON_AUDIT__;a.stand(x,0,z,0);for(let i=0;i<ms/50;i++)a.step(50);return a.player;},[x,z,ms]);
 const shot=async(name,cam)=>{await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},cam);await page.waitForTimeout(300);
  await page.locator('#game').screenshot({path:resolve(out,name+'.png')});step('photographed '+name);};
 const doorCam={pos:[-1.9,1.55,-2.6],at:[-4.05,1.05,-3.22]};
 step('stood by the till',{player:(await stand(2.2,1.2)).position,...await find()});
 await shot('1-door-shut-from-the-shop',doorCam);
 step('stood at the door',{player:(await stand(-3.3,-3.2)).position,door:(await find())['Sakura restroom door']});
 await shot('2-door-open-from-the-shop',doorCam);
 step('stood inside',{player:(await stand(-4.75,-3.2)).position,door:(await find())['Sakura restroom door']});
 await shot('3-room-from-above-the-door',{pos:[-4.35,2.3,-3.2],at:[-6.3,.35,-3.25]});
 await shot('4-toilet',{pos:[-5.15,1.25,-2.78],at:[-6.45,.55,-3.25]});
 await shot('5-cistern-spout-and-lever',{pos:[-5.75,1.25,-2.78],at:[-6.66,.82,-3.2]});
 await shot('6-washbasin-and-tap',{pos:[-5.85,1.45,-2.9],at:[-5.175,.86,-3.72]});
 await shot('7-tap',{pos:[-5.5,1.2,-3.3],at:[-5.175,.9,-3.86]});
 step('stood at the toilet',{player:(await stand(-5.75,-3.25,2500)).position,door:(await find())['Sakura restroom door']});
 await shot('8-door-shut-behind-you',{pos:[-6.3,1.6,-3.6],at:[-4.08,1.0,-3.22]});
 await shot('9-notices',{pos:[-5.0,1.62,-3.6],at:[-5.0,1.68,-2.58]});
 await shot('10-stickers-low',{pos:[-4.55,1.5,-3.75],at:[-6.2,.7,-3.0]});
}catch(e){report.errors.push(String(e?.stack||e));console.error(e);}
finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,1));await browser.close();server.close();}
console.log(report.errors.length?'ERRORS '+JSON.stringify(report.errors):'no page errors',report.warnings.filter(w=>/restroom/i.test(w)));
process.exit(report.errors.length?1:0);
