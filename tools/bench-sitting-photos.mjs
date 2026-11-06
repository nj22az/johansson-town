// Photographs sitting on the town's benches in the running game (briefs/HANDOFF-2026-10-21-evening.md, the owner's item 4:
// "two people should be able to sit together on a bench, and the avatars need better animation her hands shouldn't clip
// through the skirt and the legs shouldn't clip through the bench"): the owner's spot (a girl in a pleated skirt, Vy's
// recipe on the player, on the first seawall bench at night), two people on one bench, and a skirt, trousers and a dress
// seated. The player sits through the game's own seat prompt; the others are bodies made with the town's avatar modules,
// put on the bench's places (seat-slots.js; on a tree without them, either side of its middle) and sat as residents are.
//
//   node tools/bench-sitting-photos.mjs [out-dir] [--site=<repository root>] [--only=regex]
//
// --site serves another checkout's tree (a worktree of origin/main for the "before"); it always serves the source modules.
// Run it alone: swiftshader is starved by test suites or another browser beside it. 390 × 844, as the phone.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),flag=name=>args.find(a=>a.startsWith('--'+name+'='))?.split('=').slice(1).join('=');
const site=resolve(flag('site')||resolve(here,'..')),root=resolve(site,'johansson-town'),ONLY=flag('only')?new RegExp(flag('only')):null;
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(here,'output/bench-sitting'));await mkdir(out,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.hdr':'application/octet-stream','.wasm':'application/wasm'};
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
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const t0=Date.now(),at=()=>((Date.now()-t0)/1000).toFixed(0)+'s',report={site,shots:[],errors:[]};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'21:40',speed:1}));localStorage.setItem('johansson-town-view','third');Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(900000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
 await page.locator('#enter:not([disabled])').waitFor();console.log(at(),'island ready');
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);console.log(at(),'playing');
 await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
 // The staging helpers, in the page: the bench's places, bodies sat on them, the player on a seat.
 await page.evaluate(async()=>{
  const a=window.__JOHANSSON_AUDIT__,T=await import('/johansson-town/vendor/three.module.js');
  const {buildAvatar}=await import('/johansson-town/src/avatars/build.js'),{createAvatarAnimator}=await import('/johansson-town/src/avatars/animate.js');
  const {recipeFor}=await import('/johansson-town/src/avatars/cast.js'),{normalizeRecipe}=await import('/johansson-town/src/avatars/recipe.js');
  const {ISLAND_OUTFITS}=await import('/johansson-town/src/avatars/outfits.js');
  const staged=[];
  // (a bench by its seat's id, or by its prompt where it has none: the Harbour Park benches)
  const benchOf=id=>{let found=null;a.world.group.traverse(o=>{const s=o.userData.seat;if(!found&&s&&(s.id===id||o.userData.hit?.label===id))found={marker:o,seat:s};});return found;};
  /** The bench's places: its own (seat-slots.js), or on a tree without them, either side of its middle, 0.72 m apart. */
  const placesOf=seat=>seat.slots||[-1,1].map(k=>{const o=k*.36,ax=Math.cos(seat.yaw),az=-Math.sin(seat.yaw);return {...seat,position:[seat.position[0]+ax*o,seat.position[1],seat.position[2]+az*o]};});
  const recipe=who=>who==='sundress'?normalizeRecipe({...recipeFor('Thuan'),name:'Sundress sitter',outfit:{...recipeFor('Thuan').outfit,...ISLAND_OUTFITS.find(o=>o.outfit.top==='sundress').outfit}}):recipeFor(who);
  window.__bench={
   clear(){for(const s of staged){s.holder.removeFromParent();s.avatar.dispose();}staged.length=0;},
   /** Sit `who` (wearing `outfit`) on place `i` of bench `id`, as a resident sits: the seat's height and front edge. */
   sit(id,i,who,outfit='clothes'){
    const {seat}=benchOf(id),place=placesOf(seat)[i],avatar=buildAvatar(recipe(who),{shadows:true,faceSize:256});avatar.wear(outfit);
    const holder=new T.Group();holder.position.set(place.position[0],place.position[1],place.position[2]);holder.rotation.y=place.yaw??seat.yaw;holder.add(avatar.root);a.world.group.add(holder);
    const animator=createAvatarAnimator(avatar),state={seated:true,seatHeight:seat.surfaceY-place.position[1],seatFront:seat.front};
    for(let f=0;f<120;f++){animator.update(1/60,state);avatar.springs?.update(1/60);}
    staged.push({holder,avatar});return {place:place.position,yaw:place.yaw??seat.yaw};
   },
   /** The player, dressed as `who`, sat on bench `id` through the game's own prompt, from beside place `i`. */
   async player(id,i,who){
    const {seat}=benchOf(id),place=placesOf(seat)[i],stand=place.stand||seat.stand;
    a.teleport(stand[0],stand[2],seat.yaw);a.johansson.setRecipe(recipeFor(who));
    a.use(benchOf(id).marker.userData.hit.label);
    a.step(2000);return a.seat;
   },
   places(id){const {seat}=benchOf(id);return {seat:{position:seat.position,yaw:seat.yaw,front:seat.front,surfaceY:seat.surfaceY},places:placesOf(seat).map(p=>p.position)};},
  };
 });
 const shot=async(name,cam)=>{if(ONLY&&!ONLY.test(name))return;await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},cam);await page.waitForTimeout(300);
  await page.locator('#game').screenshot({path:resolve(out,name+'.png')});report.shots.push(name);console.log(at(),'photographed',name);};
 const night=21*60+40,dusk=19*60,evening=17*60+20;
 // 1. The owner's spot: the first seawall bench (x -38.35, z -20, facing the sea, -x), at night, the player in Vy's skirt.
 await page.evaluate(m=>window.__JOHANSSON_AUDIT__.setTime(m),night);
 const owner=await page.evaluate(()=>window.__bench.player('seawall-bench--20',0,'Vy'));console.log('owner seat',JSON.stringify(owner));
 const [px,,pz]=owner?.position||[-38.35,0,-20];
 // (the seawall's parapet, 0.78 m high, runs 0.67 m in front of the seat's edge: the lens looks over it)
 const front={pos:[px-1.5,1.35,pz-.7],at:[px,.6,pz]},side={pos:[px-.3,.75,pz+1.6],at:[px+.02,.5,pz]};
 await shot('owner-spot-night',front);
 // (and at dusk, when the night's grade does not hide the legs against the seat)
 await page.evaluate(m=>window.__JOHANSSON_AUDIT__.setTime(m),dusk);
 await shot('owner-spot-dusk',front);await shot('owner-spot-dusk-side',side);
 // 2. Two on one bench: a resident sits down beside the player (the bench's other place).
 await page.evaluate(()=>window.__bench.sit('seawall-bench--20',1,'Ms Ganaha'));
 const pair={pos:[px-2.4,1.65,pz-.36],at:[px,.62,pz-.36]};
 await shot('two-on-a-bench-dusk',pair);await shot('two-on-a-bench-dusk-side',{pos:[px-.3,.8,pz+1.9],at:[px,.5,pz-.36]});
 await page.evaluate(m=>window.__JOHANSSON_AUDIT__.setTime(m),night);await shot('two-on-a-bench-night',pair);
 await page.evaluate(()=>window.__bench.clear());
 // 3. A skirt, trousers and a dress seated, in the evening light: the Harbour Park bench under the cherry (the skirt and the
 //    trousers side by side), and the gajumaru bench (a long skirt and a sundress).
 await page.evaluate(m=>{window.__JOHANSSON_AUDIT__.setTime(m);window.__JOHANSSON_AUDIT__.teleport(14,-24,0);},evening);
 const park=await page.evaluate(()=>window.__bench.places('Sit under the harbour cherry'));console.log('park bench',JSON.stringify(park));
 await page.evaluate(()=>{window.__bench.sit('Sit under the harbour cherry',0,'Ms Ganaha');window.__bench.sit('Sit under the harbour cherry',1,'Mr Fujita');});
 {const [x,,z]=park.seat.position;await shot('skirt-and-trousers',{pos:[x-2.2,1.2,z+.3],at:[x,.6,z]});await shot('skirt-and-trousers-side',{pos:[x-1.2,.75,z-2.2],at:[x+.05,.5,z]});}
 await page.evaluate(()=>window.__bench.clear());
 const shade=await page.evaluate(()=>window.__bench.places('Sit under the gajumaru'));console.log('gajumaru bench',JSON.stringify(shade));
 await page.evaluate(()=>{window.__bench.sit('Sit under the gajumaru',0,'Grandmother Higa');window.__bench.sit('Sit under the gajumaru',1,'sundress');});
 {const [x,,z]=shade.seat.position;await shot('long-skirt-and-dress',{pos:[x+.2,1.2,z-2.2],at:[x,.6,z]});await shot('long-skirt-and-dress-side',{pos:[x+2.2,.75,z-1.1],at:[x,.5,z]});}
}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
console.log(JSON.stringify({shots:report.shots.length,errors:report.errors}));
