// Photographs Minato's service side in the running game, on a phone (390 × 844, the ?audit harness), for the owner:
// the prep board's otoshi bowls, and Thao serving a drink from the back bar, the tap or the cold store (her walk to
// the bottle, the pour at the worktop, the glass carried to the counter).
//
//   node tools/izakaya-bar-look.mjs [out-dir] [--source] [--linux] [--booth] [--only board,serve-awamori,...]
//
// --source serves the source tree (src/boot.js) instead of the built runtime.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),SOURCE=args.includes('--source');
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(root,'output/izakaya-bar'));
await mkdir(out,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wasm':'application/wasm','.woff2':'font/woff2'};
const sourcePage=html=>html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'')
 .replace(/import\(['"]\.\/runtime\/boot-[^'"]+['"]\)/g,"import('./src/boot.js')")
 .replace(/from ['"]\.\/runtime\/audio-[^'"]+['"]/g,"from './src/audio/town-audio.js?snappy=1'")
 .replace(/window\.JOHANSSON_FEED_MODULE="[^"]+"/,'window.JOHANSSON_FEED_MODULE="./src/feed/mount.js"')
 .replace(/window\.JOHANSSON_PORTRAIT_MODULE="[^"]+"/,'window.JOHANSSON_PORTRAIT_MODULE="./src/avatars/guide-portraits.js"');
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);const file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(site))throw Error('outside');
 let body=await readFile(file);if(SOURCE&&file===resolve(root,'index.html'))body=sourcePage(body.toString());
 res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const only=(args[args.indexOf('--only')+1]||'').split(',').filter(Boolean),wanted=name=>!args.includes('--only')||only.some(o=>name.includes(o));
try{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'19:00',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
 // --linux: the Linux edition's budgets (edition.js reads window.johanssonDesktop as the page loads): the full pour.
 if(args.includes('--linux'))await context.addInitScript(()=>{window.johanssonDesktop={offline:true,photo:true};});
 const page=await context.newPage();page.setDefaultTimeout(600000);page.on('pageerror',e=>console.warn('Page error:',e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp,null,{timeout:600000});
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(19*60);a.enter('izakaya');});
 await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(3000));
 const shot=async(name,camera)=>{if(!wanted(name))return;await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},camera);await page.waitForTimeout(500);await page.screenshot({path:resolve(out,name+'.png')});console.log('saved',name);};
 globalThis.__shots={page,shot};
 // The prep board from the customer's side, close, as in the owner's photo.
 await shot('board',{pos:[-1.35,1.45,-.75],at:[-1.75,.94,-1.6]});
 // Thao's side: the worktop, the back bar and the cold store, from the counter's end.
 await shot('service-side',{pos:[1.0,1.75,-1.0],at:[-1.8,1.1,-3.0]});

 // Thao makes a drink: the order goes in as the menu sends it, and the game runs on in steps of 1.5 s; each photo
 // looks at her from the counter's side (her back to the camera at the back bar and the cold store, so from the side).
 const staff=()=>page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,t=a.world.people.find(p=>p.profile.name==='Thao')?.g;return t?{at:t.position.toArray(),yaw:t.rotation.y,w:a.beerService?.working}:null;});
 const seatId=args.includes('--booth')?'table':'counter2';
 for(const kind of ['draft','awamori','oolong','bottle','can','sake']){
  if(!wanted('serve-'+kind))continue;
  const ok=await page.evaluate(async([kind,seatId])=>{const a=window.__JOHANSSON_AUDIT__,s=a.beerService;s.clear();
   const {IZAKAYA_PLAYER_SEATS}=await import('/johansson-town/src/people/izakaya-beer.js');return s.order(kind,IZAKAYA_PLAYER_SEATS[seatId]);},[kind,seatId]);
  console.log(kind,'ordered',ok);let n=0;
  for(let i=0;i<60;i++){
   const s=await staff();if(!s?.w)break;const [x,,z]=s.at,back=Math.cos(s.yaw)>.5;
   const cam=s.w.phase==='making'&&back?{pos:[x+1.15,1.5,z+.62],at:[x-.15,1.0,z-.3]}:z>-1.2?{pos:[x+1.3,1.55,z+1.1],at:[x,.9,z-.2]}:{pos:[x+.75,1.5,-.70],at:[x-.05,.98,z+.2]};
   await shot(`serve-${kind}-${String(++n).padStart(2,'0')}-${s.w.phase}-${s.w.step||''}`,cam);
   await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(1500));
  }
 }
}finally{await browser.close();server.close();}
