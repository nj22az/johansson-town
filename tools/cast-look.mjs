// Photographs the cast at work in the running game: Miss Higa at the Umi-no-yu bandai in the evening and teaching the class.
//   node tools/cast-look.mjs [out-dir]
// Serves the source tree, so the cast can be looked at before the runtime is rebuilt.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const out=resolve(process.argv[2]||resolve(root,'output/cast-look'));await mkdir(out,{recursive:true});
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
const shot=async(name,minutes)=>{
 await page.evaluate(m=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(m);a.layout?.tick?.(.5,m,0);a.layout?.tick?.(.5,m,0);a.render();},minutes);
 await page.waitForTimeout(400);await page.locator('#game').screenshot({path:resolve(out,name+'.jpg'),type:'jpeg',quality:86});console.log('wrote',name);
};
// Frame whoever is named, from `back` metres in front of them at eye height (or from a fixed camera in the room's frame).
const near=async(name,back=1.6,up=.25)=>page.evaluate(([n,b,u])=>{const a=window.__JOHANSSON_AUDIT__;let f=null;a.scene.traverse(o=>{if(!f&&o.name===n&&o.visible!==false)f=o;});if(!f)return null;
 f.updateMatrixWorld(true);const p=f.getWorldPosition(f.position.clone()),d=f.getWorldDirection(f.position.clone());return {pos:[p.x+d.x*b,p.y+1.3+u,p.z+d.z*b],at:[p.x,p.y+1.0,p.z]};},[name,back,up]);
for(const [site,label,minutes,cam] of [['onsen','01-onsen-evening',19*60,'Umi-no-yu attendant'],['school','02-classroom-lesson',10*60,{pos:[-3.6,1.65,2.9],at:[3.2,.9,-1.2]}],['school','03-classroom-lunch',12*60+30,{pos:[3.4,1.65,2.9],at:[-1.5,.6,-1.2]}]]){
 await page.evaluate(async s=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;await a.enter(s);},site);
 await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
 await page.evaluate(m=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(m);a.layout?.tick?.(.5,m,0);},minutes);
 const c=typeof cam==='string'?await near(cam,-1.5,0):cam;if(!c)console.warn('nobody called',cam);
 await page.evaluate(c=>{window.__JOHANSSON_AUDIT__.camera=c;},c);
 await shot(label,minutes);
}
console.log('errors',errors.length);
await browser.close();server.close();
