// Photographs residents seated on the town's indoor chairs, stools, cushions and benches in the running game (the owner's
// item of 22 October 2026: seated poses for chairs, stools and cushions, two places on the indoor benches, the clinic
// bench's facing): each sitter is a body made with the town's avatar modules, put on the seat's places (seat-slots.js; a
// seat without them, on the seat itself) and sat as residents are, with the seat's height and its front edge (`front`).
//
//   node tools/seated-interior-photos.mjs [out-dir] [--site=<repository root>] [--only=regex]
//
// --site serves another checkout (e.g. main for before); --runtime uses its rebuilt entry points, otherwise source modules.
// --desktop uses 1280 × 800; the default is phone-sized 390 × 844.
// Run it alone: swiftshader is starved by test suites or another browser beside it. 390 × 844, as the phone.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),flag=name=>args.find(a=>a.startsWith('--'+name+'='))?.split('=').slice(1).join('=');
const site=resolve(flag('site')||resolve(here,'..')),root=resolve(site,'johansson-town'),ONLY=flag('only')?new RegExp(flag('only')):null;
const out=resolve(args.find(a=>!a.startsWith('--'))||resolve(here,'output/seated-interiors'));await mkdir(out,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.hdr':'application/octet-stream','.wasm':'application/wasm'};
const sourcePage=html=>html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'')
 .replace(/import\(['"]\.\/runtime\/boot-[^'"]+['"]\)/g,"import('./src/boot.js')")
 .replace(/from ['"]\.\/runtime\/audio-[^'"]+['"]/g,"from './src/audio/town-audio.js?snappy=1'")
 .replace(/window\.JOHANSSON_FEED_MODULE="[^"]+"/,'window.JOHANSSON_FEED_MODULE="./src/feed/mount.js"')
 .replace(/window\.JOHANSSON_PORTRAIT_MODULE="[^"]+"/,'window.JOHANSSON_PORTRAIT_MODULE="./src/avatars/guide-portraits.js"');
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);
 const file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(site))throw Error('outside');
 let body=await readFile(file);if(!args.includes('--runtime')&&file===resolve(root,'index.html'))body=sourcePage(body.toString());
 res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const t0=Date.now(),at=()=>((Date.now()-t0)/1000).toFixed(0)+'s',report={site,runtime:args.includes('--runtime'),viewport:args.includes('--desktop')?[1280,800]:[390,844],softwareChromium:true,physicalDevice:false,stagedResidents:true,shots:[],errors:[]};
try{
 const context=await browser.newContext({viewport:args.includes('--desktop')?{width:1280,height:800}:{width:390,height:844},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'10:40',speed:1}));localStorage.setItem('johansson-town-view','third');Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(900000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
 await page.locator('#enter:not([disabled])').waitFor();console.log(at(),'island ready');
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);console.log(at(),'playing');
 await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
 await page.evaluate(async()=>{
  const a=window.__JOHANSSON_AUDIT__,T=await import('/johansson-town/vendor/three.module.js');
  const {buildAvatar}=await import('/johansson-town/src/avatars/build.js'),{createAvatarAnimator}=await import('/johansson-town/src/avatars/animate.js');
  const {recipeFor}=await import('/johansson-town/src/avatars/cast.js'),{normalizeRecipe}=await import('/johansson-town/src/avatars/recipe.js');
  const {ISLAND_OUTFITS}=await import('/johansson-town/src/avatars/outfits.js');
  const staged=[];
  const {IZAKAYA_GUEST_SEATS}=await import('/johansson-town/src/people/indoor-residents.js');
  const booth=IZAKAYA_GUEST_SEATS.slice(-3,-1);
  const boothSeat={...booth[0],slots:booth};
  const seatOf=label=>{if(label==='Minato booth')return boothSeat;let found=null;a.room.traverse(o=>{const s=o.userData.seat;if(!found&&s&&(o.userData.hit?.label===label||s.label===label))found=s;});return found;};
  const recipe=who=>who==='sundress'?normalizeRecipe({...recipeFor('Thuan'),name:'Sundress sitter',outfit:{...recipeFor('Thuan').outfit,...ISLAND_OUTFITS.find(o=>o.outfit.top==='sundress').outfit}}):recipeFor(who);
  // The people who live and visit here are hidden, so only the staged sitters are in the picture.
  const hide=()=>{for(const p of a.world.people||[])if(p.g)p.g.visible=false;};
  window.__seats={
   clear(){for(const s of staged){s.holder.removeFromParent();s.avatar.dispose();}staged.length=0;},
   /** The seat's places: a bench's own (seat-slots.js), or the seat itself. */
   places(label){const s=seatOf(label);if(!s)return null;return {seat:{position:s.position,yaw:s.yaw,front:s.front??null,surfaceY:s.surfaceY},places:(s.slots||[s]).map(p=>({position:p.position,yaw:p.yaw??s.yaw}))};},
   /** Sit `who` on place `i` of the seat, as a resident sits there: its height and, where it says it, its front edge. */
   sit(label,i,who,outfit='clothes'){
    hide();const s=seatOf(label),place=(s.slots||[s])[i];if(!place)return null;
    const avatar=buildAvatar(recipe(who),{shadows:true,faceSize:256});avatar.wear(outfit);
    const holder=new T.Group();holder.userData.seatPhoto=true;holder.position.set(...place.position);holder.rotation.y=place.yaw??s.yaw;holder.add(avatar.root);a.room.add(holder);
    const animator=createAvatarAnimator(avatar),state={seated:true,seatHeight:s.surfaceY-place.position[1],seatFront:s.front};
    for(let f=0;f<120;f++){animator.update(1/60,state);avatar.springs?.update(1/60);}
    staged.push({holder,avatar});return place.position;
   },
  };
 });
 const shot=async(name,cam)=>{if(ONLY&&!ONLY.test(name))return;await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},cam);await page.waitForTimeout(300);
  await page.locator('#game').screenshot({path:resolve(out,name+'.png')});report.shots.push({name,camera:cam});console.log(at(),'photographed',name,JSON.stringify(cam));};
 const enter=async id=>{await page.evaluate(id=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;if(a.roomNavigation)a.leave();a.enter(id);},id);
  await page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.room.visible&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading);await page.waitForTimeout(1500);console.log(at(),'in',id);};
 /** A lens on the sitters, turned `turn` from the way the seat faces (`face`, the same in the before and after runs), `h`
  *  high, as far off as `d` allows with a clear line to them (the rooms are small: never inside a wall). */
 const lens=(p,{d=2.4,h=1.25,turn=.45,lift=.8,face=p.seat.yaw}={})=>page.evaluate(async({p,d,h,turn,lift,face})=>{
  const a=window.__JOHANSSON_AUDIT__,T=await import('/johansson-town/vendor/three.module.js'),[x,y,z]=p.seat.position;
  const mid=p.places.reduce((m,q)=>[m[0]+q.position[0]/p.places.length,m[1],m[2]+q.position[2]/p.places.length],[0,y,0]);
  const at=new T.Vector3(mid[0],y+lift,mid[2]),yaw=face+turn,dir=new T.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const meshes=[];a.room.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh||!o.visible)return;for(let p=o;p;p=p.parent)if(p.userData.seatPhoto||!p.visible)return;meshes.push(o);});const ray=new T.Raycaster();
  for(let k=d;k>.9;k-=.1){const pos=at.clone().addScaledVector(dir,k);pos.y=y+h;const v=pos.clone().sub(at),len=v.length();
   ray.set(at,v.normalize());ray.far=len+.25;if(!ray.intersectObjects(meshes,false).some(hit=>hit.distance>.45))return {pos:pos.toArray(),at:at.toArray()};}
  const pos=at.clone().addScaledVector(dir,1);pos.y=y+h;return {pos:pos.toArray(),at:at.toArray()};
 },{p,d,h,turn,lift,face});
 const stage=async(room,label,who,views,face)=>{
  if(ONLY&&!views.some(([name])=>ONLY.test(name)))return;
  const p=await page.evaluate(l=>window.__seats.places(l),label);if(!p){report.errors.push('no seat '+label+' in '+room);return;}
  console.log(room,label,JSON.stringify(p.seat),p.places.length,'places');
  await page.evaluate(([l,who])=>{window.__seats.clear();who.forEach(([w,o],i)=>window.__seats.sit(l,i,w,o));},[label,who]);
  for(const [name,opts] of views)if(!ONLY||ONLY.test(name))await shot(name,await lens(p,{...opts,...(face!=null?{face}:{})}));
 };
 // 1. The clinic: the waiting bench, its back to the consulting room's partition; two waiting.
 await enter('clinic');
 await stage('clinic','Sit in the clinic waiting room',[['Vy'],['Mr Fujita']],[['clinic-bench',{d:2.5,turn:-1}],['clinic-bench-side',{d:2.2,turn:1.35,h:.8,lift:.45}]],Math.PI);
 // 2. The police station lobby: the waiting bench by the door.
 await enter('koban');
 await stage('koban','Sit on the waiting bench',[['Ms Ganaha'],['Kai']],[['police-bench',{d:2.3,turn:-.35}],['police-bench-side',{d:2.4,turn:-1.35,h:.8,lift:.45}]]);
 // 3. Naha's domestic arrivals: three on one bench.
 await enter('naha-airport-arrivals');
 await stage('arrivals','Sit in domestic arrivals',[['Grandmother Higa'],['sundress'],['Jun']],[['arrivals-bench',{d:2.8,turn:.2,h:1.3}],['arrivals-bench-side',{d:2.8,turn:1.3,h:.8,lift:.45}]]);
 // 4. Umi-no-yu: the changing-room bench (after the bath), and the tatami's edge in the lobby.
 await enter('onsen');
 await stage('onsen','Sit on the changing-room bench',[['Thao','afterbath'],['Kōji']],[['onsen-changing-bench',{d:2.2,turn:0}],['onsen-changing-bench-side',{d:2.4,turn:1.35,h:.8,lift:.45}]]);
 await stage('onsen','Sit on the tatami',[['sundress']],[['onsen-tatami',{d:1.9,turn:.5}],['onsen-tatami-side',{d:2.2,turn:1.4,h:.8,lift:.45}]]);
 // 5. Minato: two at the counter, on its stools.
 await enter('izakaya');
 await stage('izakaya','Sit at the counter',[['Grandmother Higa']],[['minato-stool',{d:2.2,turn:.5}],['minato-stool-side',{d:2.2,turn:-1.45,h:1.05,lift:.7}],['minato-stool-other-side',{d:2.2,turn:-1.45,h:.85,lift:.45}]]);
 await stage('izakaya','Minato booth',[['Nhung'],['Kōji']],[['minato-booth',{d:2.8,turn:1.2}],['minato-booth-side',{d:2.5,turn:1.3,h:.85,lift:.45}]]);
 // 6. A family home: a dining chair (a skirt) and a zabuton at the tea table (shorts).
 await enter('home-kitahama-3');
 await stage('home','Sit at the dining table',[['Ms Ganaha']],[['dining-chair-side',{d:2.2,turn:1.45,h:.85,lift:.45}],['dining-chair-other-side',{d:2.2,turn:-1.45,h:.85,lift:.45}]]);
 await stage('home','Sit at the tea table',[['Kōji']],[['zabuton',{d:2,turn:.5,h:.9,lift:.3}],['zabuton-side',{d:2,turn:1.45,h:.7,lift:.3}],['zabuton-other-side',{d:2,turn:-1.45,h:.7,lift:.3}]]);
}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
console.log(JSON.stringify({shots:report.shots.length,errors:report.errors}));
