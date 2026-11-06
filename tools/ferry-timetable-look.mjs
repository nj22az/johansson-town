// Photographs the Minato Maru keeping her timetable in the running game, on a phone (390 × 844, the ?audit harness),
// for the owner (briefs/ferry-timetable.md): the landing sign at T−2 minutes, the Go ashore / Stay aboard prompt
// aboard, the crossing with him on deck, and arrival at Kitano-jima. Her 08:45 out of Minato.
//
//   node tools/ferry-timetable-look.mjs [out-dir] [--source]
//
// --source serves the source tree (src/boot.js) instead of the built runtime.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {QUICK_CROSSING} from '../src/world/ferry-quick-crossing.js';
import {AIRPORT_FERRY_PORTS} from '../src/world/airport-ferry.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),SOURCE=args.includes('--source');
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(root,'output/ferry-timetable'));
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
const OUT=8*60+45;
try{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'08:40',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(600000);page.on('pageerror',e=>console.warn('Page error:',e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp,null,{timeout:600000});
 await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading&&!window.__JOHANSSON_STREAMING__?.active);await page.waitForTimeout(3000);
 const save=async name=>{await page.waitForTimeout(800);await page.screenshot({path:resolve(out,name+'.png')});console.log('saved',name);};
 const state=()=>page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,f=a.world.ferry,op=f.operation;return {minutes:+JSON.parse(window.render_game_to_text()).minutes.toFixed(2),berth:f.berth,stage:op?.stage||null,kind:op?.sailingKind||null,departing:f.departing,prompt:a.island.departurePrompt,sign:a.island.landingSigns.departing('town'),player:a.player.position};});
 /** Steps the running game until `test(state)` (a function source), at most `seconds`. */
 const until=async(test,seconds=900)=>{for(let t=0;t<seconds;t+=10){const s=await state();if((0,eval)(test)(s))return s;await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(10000));}throw Error('Not reached: '+test+' '+JSON.stringify(await state()));};

 // 1. The landing sign at T−2: he stands on the pier by the gangway; she is alongside, preparing the 08:45.
 const T=AIRPORT_FERRY_PORTS.town,sign=QUICK_CROSSING.town.at;
 await page.evaluate(([x,z])=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(8*60+41.8);a.teleport(x+1.8,z+2.4,Math.PI*.6,0);a.step(500);},[T.landing[0],T.landing[1]]);
 console.log('start',JSON.stringify(await state()));
 const warned=await until(`s=>s.minutes>=${OUT-2}+.15`,200);console.log('T-2',JSON.stringify(warned));
 await page.evaluate(([sx,sz])=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:[sx+3.4,1.7,sz+9.5],at:[sx-1.4,1.9,sz-1.8]};a.render();},sign);
 await save('1-sign-T-minus-2');

 // 2. Aboard at T−2: on her upper passenger deck, the Go ashore / Stay aboard prompt on the action rail.
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,f=a.world.ferry.ferry;f.updateMatrixWorld(true);
  const p=f.localToWorld(new f.position.constructor(...(f.userData.passengerDeck||[1.3,f.userData.deckY??1.01,.2])));
  a.stand(p.x,p.y,p.z,Math.PI/2);a.camera=null;a.step(1500);});
 console.log('aboard',JSON.stringify(await state()));
 await save('2-prompt-go-ashore-stay-aboard');

 // 3. He stays aboard; she sails at 08:45 and crosses with him on deck.
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.island.stayAboard());
 const sea=await until(`s=>s.kind==='sea'`,900);console.log('at sea',JSON.stringify(sea));
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(20000));
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,f=a.world.ferry.ferry;f.updateMatrixWorld(true);
  const V=f.position.constructor,cam=f.localToWorld(new V(-9,10,-19)),at=new V(...a.player.position);a.camera={pos:cam.toArray(),at:[at.x,at.y+.6,at.z]};a.render();});
 await save('3-crossing-on-deck');

 // 4. Alongside at Kitano-jima; he goes ashore down her ramp (Go ashore) and stands on the pier with her behind him.
 const there=await until(`s=>s.berth==='airport'&&s.stage==='alongside'`,1200);console.log('arrived',JSON.stringify(there));
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.island.goAshore();for(let i=0;i<30&&a.island.walking;i++)a.step(5000);});
 console.log('ashore',JSON.stringify(await state()));
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,f=a.world.ferry.ferry,V=f.position.constructor,p=new V(...a.player.position);
  const away=p.clone().sub(f.position).setY(0).normalize(),side=new V(-away.z,0,away.x);
  const cam=p.clone().addScaledVector(away,5.5).addScaledVector(side,2.2);cam.y=p.y+2.4;
  a.face(Math.atan2(-away.x,-away.z),0);a.camera={pos:cam.toArray(),at:[(p.x*2+f.position.x)/3,p.y+2.2,(p.z*2+f.position.z)/3]};a.step(300);});
 await save('4-arrival-kitano-jima');
 console.log('done',JSON.stringify(await state()));
}finally{await browser.close();server.close();}
