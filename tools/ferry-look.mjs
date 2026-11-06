// Photographs the Minato Maru and her harbour in the running game, from the views the ferry work needs
// (docs/FERRY-AUDIT.md): quay, pier, waterline, aerial, night, lifted out of the water (the "dry dock"
// view of the underwater body), the harbour from above, the cargo ship, and her moving on a crossing.
//
//   node tools/ferry-look.mjs [out-dir] [--source] [--set=ship,harbour,cargo,crossing,night] [--only=regex] [--jpg]
//
// --source serves the source tree (src/boot.js) instead of the built runtime, so a change can be looked at
// before the runtime is rebuilt. --jpg writes small JPEGs (the reviewed set in docs/qa/ferry is kept as webp).
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),flag=name=>args.find(a=>a.startsWith('--'+name+'='))?.split('=')[1];
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(root,'output/ferry-audit'));
await mkdir(out,{recursive:true});
const SOURCE=args.includes('--source'),JPG=args.includes('--jpg');
const SETS=(flag('set')||'ship').split(','),ONLY=flag('only')?new RegExp(flag('only')):null;
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.wasm':'application/wasm','.hdr':'application/octet-stream'};
/** The page, pointed at the source graph rather than the hashed runtime chunks. */
const sourcePage=html=>html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'')
 .replace(/import\(['"]\.\/runtime\/boot-[^'"]+['"]\)/g,"import('./src/boot.js')")
 .replace(/from ['"]\.\/runtime\/audio-[^'"]+['"]/g,"from './src/audio/town-audio.js?snappy=1'")
 .replace(/window\.JOHANSSON_FEED_MODULE="[^"]+"/,'window.JOHANSSON_FEED_MODULE="./src/feed/mount.js"')
 .replace(/window\.JOHANSSON_PORTRAIT_MODULE="[^"]+"/,'window.JOHANSSON_PORTRAIT_MODULE="./src/avatars/guide-portraits.js"');
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);const file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(site))throw Error('outside');
 let body=await readFile(file);if(SOURCE&&file===resolve(root,'index.html'))body=sourcePage(body.toString());
 res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:JPG?960:1280,height:JPG?675:900},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'14:20',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(300000);page.on('pageerror',e=>console.warn('Page error:',e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp,null,{timeout:300000});
 await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
 await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading&&!window.__JOHANSSON_STREAMING__?.active);await page.waitForTimeout(3000);
 const info=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,f=a.world.ferry;return {phase:f.phase,berth:f.berth,pos:f.ferry.position.toArray(),visible:f.ferry.visible};});
 console.log('ferry',JSON.stringify(info));
 const save=async name=>{await page.waitForTimeout(700);await page.locator('#game').screenshot(JPG?{path:resolve(out,name+'.jpg'),type:'jpeg',quality:80}:{path:resolve(out,name+'.png')});console.log('saved',name);};
 const wanted=name=>!ONLY||ONLY.test(name);
 /** A view of the ship as she lies: the ramp down (or up), lit or not, lifted for the dry-dock view. */
 const shot=async(name,pos,at,setup)=>{if(!wanted(name))return;await page.evaluate(([pos,at,setup])=>{const a=window.__JOHANSSON_AUDIT__,f=a.world.ferry.ferry;
   f.userData.__y??=f.position.y;f.position.y=f.userData.__y;f.userData.lights(false);f.userData.setRamp(1,setup==='airport'?-.008:.24);
   if(setup==='airport'){const run=a.world.ferry;run.parkAt('airport');f.userData.__y=f.position.y;}
   if(setup==='lift'){f.position.y+=2.2;} if(setup==='night')f.userData.lights(true);if(setup==='rampUp')f.userData.setRamp(0);
   a.camera={pos,at};a.render();},[pos,at,setup]);await save(name);};
 /** Any view at a town time (minutes), with the world stepped a little so moving things settle. */
 const view=async(name,minutes,pos,at,before)=>{if(!wanted(name))return;await page.evaluate(([minutes,pos,at,before])=>{const a=window.__JOHANSSON_AUDIT__;
   if(Number.isFinite(minutes)){a.setTime(minutes);a.step(400);}if(before)(0,eval)(before)(a);a.camera={pos,at};a.render();},[minutes,pos,at,before]);await save(name);};
 const [fx,,fz]=info.pos;const L=(dx,dy,dz)=>[fx+dx,dy,fz+dz];
 if(SETS.includes('ship')){
  await shot('01-quay-three-quarter',L(9,4.5,18),L(0,1.2,0));
  await shot('02-pier-gangway',L(5.2,1.7,-1),L(-1,1.8,-3));
  await shot('03-starboard-broadside',L(-24,3,-2),L(0,1,0));
  await shot('04-stern',L(-6,3,-24),L(0,1.5,0));
  await shot('05-aerial',L(-10,26,-6),L(0,0,0));
  await shot('06-bow-ramp',L(-4,3.2,16),L(0,1.2,8));
  await shot('07-waterline-draft-marks',L(-9,.2,8),L(0,-.2,9));
  await shot('08-drydock-underwater',L(-12,-.6,-14),L(0,-.6,-3),'lift');
  await shot('09-drydock-stern-screws',L(-3.5,-1.2,-15),L(0,-.8,-9),'lift');
  await shot('10-wheelhouse-mast',L(6,7,4),L(0,5,-3));
  await shot('11-night',L(9,4.5,18),L(0,1.2,0),'night');
  await shot('12-ramp-up',L(-4,3.2,16),L(0,1.2,8),'rampUp');
  await shot('13-draft-marks-close',L(-5.2,.15,9.2),L(-2.9,0,9.6));
  await shot('14-load-line-close',L(-5.5,.4,-.5),L(-3.2,.3,-.5));
  await shot('15-car-deck',L(1.4,3.4,12.5),L(0,.6,1));
  // The bow's working fittings (FERRY_DECK_FITTINGS): the barrier shut and the lanes red at sea, lifted and green with the ramp down.
  await shot('18-bow-barrier-shut',L(-1.6,3.0,3),L(.3,2.2,14),'rampUp');
  await shot('19-bow-barrier-open',L(-1.6,3.0,3),L(.3,2.2,14));
  await shot('20-lane-signals-from-quay',L(3,2.4,24),L(0,4,12));
 }
 // The harbour from above and from the quay: basin, breakwater, piers, the ferry's berth.
 if(SETS.includes('harbour')){
  // (The player is put at the pier's end first: the game draws only what is near the player.)
  const pierEnd=`a=>a.teleport(0,-63)`;
  await view('h1-harbour-plan',14*60+20,[-4,140,-76],[-4,0,-76.1],pierEnd);
  await view('h2-basin-from-quay',14*60+20,[-12,7,-40],[-14,0,-80]);
  await view('h3-breakwater-west-end',14*60+20,[-62,12,-80],[-30,0,-106],pierEnd);
  await view('h4-outer-pier-from-quay',14*60+20,[3.5,4,-46],[0,0,-88],pierEnd);
 }
 // The island cargo ship: arriving round the breakwater, alongside, leaving; and against the ferry's berth.
 if(SETS.includes('cargo')){
  for(const [name,m] of [['c1-cargo-approach',7*60+10],['c2-cargo-turning',7*60+24],['c3-cargo-alongside',8*60],['c4-cargo-leaving',8*60+50]])
   await view(name,m,[-6,60,-70],[-6,0,-70.1]);
  await view('c5-cargo-alongside-quay',8*60,[2,6,-38],[16,0,-56]);
 }
 // A crossing: off the berth, at sea, and in to Kitano-jima, with her motion (roll and pitch) as it plays.
 // The player rides with her, as on a real crossing: the game draws the sea and the ship round the player.
 // (Teleported only, not stepped: a step would walk the player back onto dry ground.)
 const ride=`a.teleport(r.ferry.position.x,r.ferry.position.z);`;
 if(SETS.includes('crossing')){
  const pose=t=>`a=>{const r=a.world.ferry;if(r.phase!=='crossing'){r.parkAt('town');r.beginCrossing('airport');}r.setCrossingProgress(${t});${ride}r.setCrossingProgress(${t});}`;
  for(const [name,t,dx,dy,dz] of [['x1-astern',.04,-14,9,-10],['x2-swinging',.12,-16,12,6],['x3-breakwater',.22,-18,10,10],['x4-at-sea',.5,-18,7,14],['x5-approach',.86,-20,10,-8],['x6-alongside-kitano',1,-16,9,-10]])
   if(wanted(name)){await page.evaluate(([fn])=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(11*60);(0,eval)(fn)(a);},[pose(t)]);
    const p=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.world.ferry.ferry.position.toArray());
    await view(name,null,[p[0]+dx,dy,p[2]+dz],[p[0],1,p[2]],pose(t));}
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.world.ferry.parkAt('town'));
 }
 // At night: her navigation lights crossing, and lying alongside after the last boat.
 if(SETS.includes('night')){
  const crossing=t=>`a=>{const r=a.world.ferry;if(r.phase!=='crossing'){r.parkAt('town');r.beginCrossing('airport');}r.setCrossingProgress(${t});${ride}r.update(.1,a.world.__minutes??0,0);r.setCrossingProgress(${t});}`;
  for(const [name,m,t,dx,dz] of [['n1-night-crossing-port-side',21*60,.5,14,6],['n2-night-crossing-starboard',21*60,.5,-14,6],['n3-night-astern',21*60,.5,-4,-20]])
   if(wanted(name)){await page.evaluate(([m,fn])=>{const a=window.__JOHANSSON_AUDIT__;a.setTime(m);a.world.__minutes=m;(0,eval)(fn)(a);},[m,crossing(t)]);
    const p=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.world.ferry.ferry.position.toArray());
    await view(name,null,[p[0]+dx,6,p[2]+dz],[p[0],2,p[2]],crossing(t));}
  await view('n4-night-alongside',23*60,L(9,4.5,18),L(0,1.2,0),`a=>{const r=a.world.ferry;r.parkAt('town');r.update(.1,23*60,0);}`);
  // Loading after dark, in service: the ramp floodlights on (FERRY_LOADS `floodlights`), the lanes green.
  await view('n5-night-loading',19*60+30,L(3,2.6,26),L(0,2.5,8),`a=>{const r=a.world.ferry;r.parkAt('town');r.update(.1,19*60+30,0);}`);
 }
 // Ad hoc views from a JSON file: [{name, minutes, pos:[x,y,z], at:[x,y,z], before:"a=>{…}"}].
 if(flag('views'))for(const v of JSON.parse(await readFile(resolve(flag('views')),'utf8')))await view(v.name,v.minutes??null,v.pos,v.at,v.before||null);
 if(SETS.includes('kitano')){
  // At Kitano-jima: bow in to the jetty with her ramp down on it. The player goes over first, so that
  // side of the sound is the one the game draws.
  await page.evaluate(async()=>{const a=window.__JOHANSSON_AUDIT__,{AIRPORT_LANDING}=await import('/johansson-town/src/world/airport-ground.js');a.teleport(AIRPORT_LANDING[0],AIRPORT_LANDING[1]);a.step(2000);});await page.waitForTimeout(3000);
  const away=await page.evaluate(()=>{const f=window.__JOHANSSON_AUDIT__.world.ferry;f.parkAt('airport');f.ferry.userData.__y=f.ferry.position.y;f.ferry.updateMatrixWorld(true);const w=(x,y,z)=>{const v=f.ferry.localToWorld(new f.ferry.position.constructor(x,y,z));return v.toArray();};return {a:w(-14,6,-8),b:w(0,1,6),c:w(9,3,16),d:w(0,1,9)};});
  await shot('16-kitano-jima-berth',away.a,away.b,'airport');
  await shot('17-kitano-jima-ramp',away.c,away.d,'airport');
 }
}finally{await browser.close();server.close();}
