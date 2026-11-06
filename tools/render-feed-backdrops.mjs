// Captures the town feed's comic sets from the running game: for every place in
// src/feed/places.js, several camera views (wide, push, low, high) of the real room or street,
// with the residents, the player's hands and the HUD hidden. Each view saves
//   assets/images/feed/<id>-<view>.webp        the picture (the wide one is also <id>.webp)
//   assets/images/feed/<id>-<view>-depth.webp  linear depth at half size, 16-bit in red and green, lossless
// and assets/images/feed/views.json holds each view's camera and the spots a resident can use:
// open floor to stand on and counters to lean at, found by rays, and the game's own seats in
// view (stools, benches, sofas: where the seat is, its height and which way a sitter faces).
// The comic renderer rebuilds that camera and draws the residents with the depth, so they stand
// and sit inside the room.
// node tools/render-feed-backdrops.mjs [--seats-only] [--source] [id …]   (serves the repository itself; the built runtime, or the source with --source)
// --seats-only keeps the pictures and depth and refreshes only the seats in views.json.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile,unlink} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {FEED_PLACES} from '../src/feed/places.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),seatsOnly=args.includes('--seats-only'),only=new Set(args.filter(a=>!a.startsWith('--')));
const W=1600,H=1200,DEPTH_FAR=60;
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wasm':'application/wasm','.ktx2':'image/ktx2','.woff2':'font/woff2'};
/**
 * --source: draw the game from its source modules rather than the built runtime (tools/ferry-look.mjs does
 * the same), so a change can be photographed before the runtime is rebuilt.
 */
const SOURCE=args.includes('--source');
const sourcePage=html=>html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'')
 .replace(/import\(['"]\.\/runtime\/boot-[^'"]+['"]\)/g,"import('./src/boot.js')")
 .replace(/from ['"]\.\/runtime\/audio-[^'"]+['"]/g,"from './src/audio/town-audio.js?snappy=1'")
 .replace(/window\.JOHANSSON_FEED_MODULE="[^"]+"/,'window.JOHANSSON_FEED_MODULE="./src/feed/mount.js"')
 .replace(/window\.JOHANSSON_PORTRAIT_MODULE="[^"]+"/,'window.JOHANSSON_PORTRAIT_MODULE="./src/avatars/guide-portraits.js"');
const server=createServer(async(req,res)=>{
 try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);const file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));
  if(!file.startsWith(site))throw Error('outside');let body=await readFile(file);if(SOURCE&&file===resolve(root,'index.html'))body=sourcePage(body.toString());
  res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream'});res.end(body);}
 catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
/** PNG to WebP with ImageMagick, or with Python's Pillow where ImageMagick is not installed (the same settings). */
function webp(src,dst,{quality=80,lossless=false,resize=null}={}){
 try{execFileSync('convert',[src,...(resize?['-resize',resize.join('x')]:[]),...(lossless?['-define','webp:lossless=true']:['-quality',String(quality)]),'-define','webp:method=6',dst]);}
 catch(e){if(e.code!=='ENOENT')throw e;
  execFileSync('python3',['-I','-c','import sys,json\nfrom PIL import Image\nsrc,dst,o=sys.argv[1],sys.argv[2],json.loads(sys.argv[3])\nim=Image.open(src)\nif o.get("resize"):im=im.resize(tuple(o["resize"]),Image.LANCZOS)\nim.save(dst,"WEBP",method=6,**({"lossless":True} if o.get("lossless") else {"quality":o["quality"]}))',src,dst,JSON.stringify({quality,lossless,resize})]);}
}
const out=resolve(root,'assets/images/feed');await mkdir(out,{recursive:true});
const viewsPath=resolve(out,'views.json');
const views=existsSync(viewsPath)?JSON.parse(await readFile(viewsPath,'utf8')):{};
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:W,height:H},serviceWorkers:'block',deviceScaleFactor:1});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(240000);
 page.on('pageerror',e=>console.warn('Page error:',e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp,null,{timeout:240000});
 // Draw only the requested stills; the frozen RAF may keep streaming, without continuously re-rendering the town.
 await page.evaluate(()=>{window.__JOHANSSON_AUDIT__.renderFrozen=false;});
 await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
 const settle=async()=>{await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading&&!window.__JOHANSSON_STREAMING__?.active);await page.waitForTimeout(2500);};
 const hideCast=()=>page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;
  for(const h of [a.hands,a.hands?.group,a.hands?.root])if(h?.isObject3D)h.visible=false;
  // These are empty story sets: hide the actual resident roots too, so a previous fixture’s hidden keeper cannot hold
  // the evening shutter open. Re-sample that frontage after removing occupancy, without advancing the story’s time.
  for(const g of [...a.world.people.map(p=>p.g),...(a.world.neighbours||[])])g.visible=false;
  if(a.johansson?.root)a.johansson.root.visible=false;
  const h=a.world.quarters?.higa,t=JSON.parse(window.render_game_to_text()).minutes;if(h){h.update(t-.001);h.update(t);}
  a.scene.traverse(o=>{if(o.isSkinnedMesh)o.visible=false;if(o.isBone)o.traverse(c=>{if(c.isMesh)c.visible=false;});});});

 /** The camera the game is drawing with now, as position and look-at. */
 const currentPose=()=>page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.render();let cam=null;a.scene.traverse(o=>{if(o.isPerspectiveCamera&&!cam)cam=o;});
  const d=cam.getWorldDirection(new cam.position.constructor()),p=cam.getWorldPosition(new cam.position.constructor());return {pos:p.toArray(),dir:d.toArray()};});

 /**
  * The game's own seats in view: every visible seat record (the ones residents and the player
  * sit on) that is in the picture, 1.2–9 m off and not a bath, in the frame the camera is in.
  */
 const seatScan=async()=>{
  const a=window.__JOHANSSON_AUDIT__,THREE=await import('/johansson-town/vendor/three.module.js'),inside=!!a.roomNavigation,base=inside?a.room:a.world.group;
  let camera=null;a.scene.traverse(o=>{if(o.isPerspectiveCamera&&!camera)camera=o;});camera.updateMatrixWorld(true);
  const cam=camera.getWorldPosition(new THREE.Vector3()),seats=[],seen=new Set(),r=v=>+(+v).toFixed(3);
  const visit=(s,id)=>{
   const [x,y,z]=s.position,key=x.toFixed(2)+','+z.toFixed(2);if(seen.has(key))return;
   const at=new THREE.Vector3(x,s.surfaceY??y+.45,z),d=at.distanceTo(cam);if(d<1.2||d>9)return;
   const ndc=at.clone().project(camera);if(ndc.z>1||Math.abs(ndc.x)>.95||ndc.y<-.98||ndc.y>.9)return;
   seen.add(key);
   seats.push({id,position:s.position.map(r),stand:(s.stand||s.position).map(r),surfaceY:r(s.surfaceY??y+.45),yaw:r(s.yaw||0),...(Number.isFinite(s.front)?{front:r(s.front)}:{}),...(Array.isArray(s.table)?{table:s.table.map(r)}:{})});
  };
  base.updateMatrixWorld(true);base.traverse(o=>{
   const s=o.userData.seat,h=o.userData.hit;if(!s||!h||!!h.inside!==inside||s.soak||o.userData.officeTask)return;
   for(let p=o;p;p=p.parent)if(!p.visible)return;
   // (a bench's places, seat-slots.js, each a seat of its own: two can sit on it in a comic as in World)
   for(const slot of s.slots||[s])visit({...s,...slot},h.label||o.name||'seat');
  });
  // Seats only residents use, with no marker of their own (Minato's table bench).
  if(a.roomNavigation?.id==='izakaya'){const {IZAKAYA_GUEST_SEATS}=await import('/johansson-town/src/people/indoor-residents.js');for(const s of IZAKAYA_GUEST_SEATS)visit({position:s.position,stand:s.stand,surfaceY:s.surfaceY,yaw:s.yaw,front:s.front},'Minato guest seat');}
  return seats;
 };

 /** Depth, camera and usable spots for the view on screen. */
 const measure=()=>page.evaluate(async({W,H,FAR})=>{
  const a=window.__JOHANSSON_AUDIT__,THREE=await import('/johansson-town/vendor/three.module.js');
  let cam=null;a.scene.traverse(o=>{if(o.isPerspectiveCamera&&!cam)cam=o;});
  // The game's own camera, projection and all: it may shape the projection beyond the fov.
  const camera=cam;camera.updateMatrixWorld(true);
  // Linear view depth in metres / FAR, packed into RGB so it survives a PNG exactly.
  const material=new THREE.ShaderMaterial({uniforms:{far:{value:FAR}},
   vertexShader:'#include <common>\n#include <batching_pars_vertex>\n#include <skinning_pars_vertex>\nvarying float vz;\nvoid main(){\n#include <skinbase_vertex>\n#include <begin_vertex>\n#include <batching_vertex>\n#include <skinning_vertex>\n#include <project_vertex>\nvz=-mvPosition.z;}',
   fragmentShader:'uniform float far;varying float vz;void main(){float d=floor(clamp(vz/far,0.,1.)*65535.+.5);float r=floor(d/256.);gl_FragColor=vec4(r/255.,(d-r*256.)/255.,0.,1.);}',side:THREE.DoubleSide});
  const r=a.renderer,DW=W/2,DH=H/2,target=new THREE.WebGLRenderTarget(DW,DH),before={override:a.scene.overrideMaterial,background:a.scene.background,fog:a.scene.fog,tone:r.toneMapping};
  a.scene.overrideMaterial=material;a.scene.background=new THREE.Color(1,1,1);a.scene.fog=null;r.toneMapping=THREE.NoToneMapping;
  r.setRenderTarget(target);r.setClearColor(0xffffff,1);r.clear();r.render(a.scene,camera);
  const px=new Uint8Array(DW*DH*4);r.readRenderTargetPixels(target,0,0,DW,DH,px);r.setRenderTarget(null);
  a.scene.overrideMaterial=before.override;a.scene.background=before.background;a.scene.fog=before.fog;r.toneMapping=before.tone;target.dispose();material.dispose();
  const canvas=document.createElement('canvas');canvas.width=DW;canvas.height=DH;const ctx=canvas.getContext('2d'),img=ctx.createImageData(DW,DH);
  for(let y=0;y<DH;y++)for(let x=0;x<DW;x++){const s=((DH-1-y)*DW+x)*4,d=(y*DW+x)*4;img.data[d]=px[s];img.data[d+1]=px[s+1];img.data[d+2]=px[s+2];img.data[d+3]=255;}
  ctx.putImageData(img,0,0);
  // Spots: rays through the lower part of the picture, kept where they land on something level.
  const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
  const meshes=[];a.scene.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh&&visible(o))meshes.push(o);});
  const ray=new THREE.Raycaster(),hits=[];
  const first=(origin,dir)=>{ray.set(origin,dir);ray.far=40;return ray.intersectObjects(meshes,false).find(h=>h.face&&(!h.object.material||!h.object.material.transparent||h.object.material.opacity>.5));};
  for(let sy=.42;sy<.99;sy+=.025)for(let sx=.08;sx<.93;sx+=.025){
   ray.setFromCamera(new THREE.Vector2(sx*2-1,-(sy*2-1)),camera);const h=first(ray.ray.origin,ray.ray.direction);
   if(!h)continue;const n=h.face.normal.clone().transformDirection(h.object.matrixWorld);if(n.y<.9)continue;
   hits.push({p:h.point,d:h.distance,sx,sy});
  }
  // The floor is the level most of the picture's level ground is at — not the lowest, which by
  // the harbour is the sea.
  const levels=new Map();for(const h of hits){const k=Math.round(h.p.y/.05);levels.set(k,(levels.get(k)||0)+1);}
  const floor=([...levels].sort((a,b)=>b[1]-a[1])[0]?.[0]??0)*.05,spots={stand:[],counter:[]},taken=new Set();
  for(const h of hits){
   const lift=h.p.y-floor;if(lift<-.12)continue;const kind=Math.abs(lift)<.12?'stand':lift>.8&&lift<1.15?'counter':null;if(!kind||h.d<1.4||h.d>9)continue;
   const key=kind+Math.round(h.p.x/.6)+','+Math.round(h.p.z/.6);if(taken.has(key))continue;
   if(kind==='stand'){
    // Room to stand: the floor carries on all round, with nothing at body height in the way.
    let clear=true;for(const [dx,dz] of [[.28,0],[-.28,0],[0,.28],[0,-.28]]){const g=first(new THREE.Vector3(h.p.x+dx,h.p.y+1.7,h.p.z+dz),new THREE.Vector3(0,-1,0));if(!g||g.point.y-h.p.y>.08){clear=false;break;}}
    if(!clear)continue;
   }
   taken.add(key);spots[kind].push([+h.p.x.toFixed(3),+h.p.y.toFixed(3),+h.p.z.toFixed(3),+h.sx.toFixed(3),+h.sy.toFixed(3)]);
  }
  return {depth:canvas.toDataURL('image/png').split(',')[1],floor:+floor.toFixed(3),spots,
   camera:{position:camera.getWorldPosition(new THREE.Vector3()).toArray().map(v=>+v.toFixed(4)),quaternion:camera.getWorldQuaternion(new THREE.Quaternion()).toArray().map(v=>+v.toFixed(6)),projection:camera.projectionMatrix.toArray().map(v=>+v.toPrecision(7)),fov:camera.fov,aspect:W/H,depthFar:FAR}};
 },{W,H,FAR:DEPTH_FAR});

 const capture=async(place,name)=>{
  await hideCast();
  if(place.id==='higa-liquor'||place.id==='kissa-higa'){const shut=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.world.quarters.higa.shutter.scale.y>=.999);if(shut!==(place.id==='higa-liquor'))throw Error(place.id+': frontage does not match its story time');}
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.render());
  if(seatsOnly){const seats=await page.evaluate(seatScan);const view=views[place.id]?.[name];if(view){view.seats=seats;delete view.spots.seat;}console.log('Seats:',place.id,name,seats.length);return;}
  const png=resolve(out,'.capture.png');await page.screenshot({path:png,clip:{x:0,y:0,width:W,height:H},animations:'disabled'});
  webp(png,resolve(out,`${place.id}-${name}.webp`),{quality:80});
  if(name==='wide')webp(png,resolve(out,place.id+'.webp'),{quality:78,resize:[960,720]});
  await unlink(png);
  const m=await measure(),seats=await page.evaluate(seatScan),depthPng=resolve(out,'.depth.png');await writeFile(depthPng,Buffer.from(m.depth,'base64'));
  webp(depthPng,resolve(out,`${place.id}-${name}-depth.webp`),{lossless:true});await unlink(depthPng);
  (views[place.id]??={})[name]={camera:m.camera,floor:m.floor,spots:m.spots,seats};
  console.log('View:',place.id,name,'stand',m.spots.stand.length,'seats',seats.length,'counter',m.spots.counter.length);
 };
 /** The wide view, then the same camera pushed in, dropped low and raised high. */
 const variations=async place=>{
  const base=await currentPose(),[px,py,pz]=base.pos,[dx,dy,dz]=base.dir,flat=Math.hypot(dx,dz)||1,fx=dx/flat,fz=dz/flat;
  await capture(place,'wide');
  const set=async(name,pos,at)=>{await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},{pos,at});await page.waitForTimeout(800);await capture(place,name);};
  const ahead=place.shot.push??1.4;
  await set('push',[px+fx*ahead,py,pz+fz*ahead],[px+fx*(ahead+5),py-.35,pz+fz*(ahead+5)]);
  await set('low',[px+fx*.6,Math.max(.45,py-1.1),pz+fz*.6],[px+fx*5,py+.4,pz+fz*5]);
  await set('high',[px-fx*.2,py+.9,pz-fz*.2],[px+fx*4,py-1.4,pz+fz*4]);
 };

 for(const place of FEED_PLACES.filter(p=>!only.size||only.has(p.id))){
  const shot=place.shot;
  await page.evaluate(minutes=>window.__JOHANSSON_AUDIT__.setTime(minutes),shot.time??720);
  if(shot.room){
   await page.evaluate(async id=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;await a.enter(id);a.render();},shot.room);
   await settle();
   if(shot.camera)await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},shot.camera);
   await variations(place);
   await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.leave();});await settle();
  }else{
   const view=await page.evaluate(async shot=>{
    if(!shot.lane)return shot;
    const {shoppingLanePoint}=await import('/johansson-town/src/world/shopping-lane-plan.js');
    const at=shoppingLanePoint(...shot.lane.at),cam=shoppingLanePoint(...shot.lane.cam),look=shoppingLanePoint(...shot.lane.look);
    return {at,camera:{pos:[cam[0],shot.lane.height,cam[1]],at:[look[0],1.2,look[1]]}};
   },shot);
   await page.evaluate(({at,camera})=>{const a=window.__JOHANSSON_AUDIT__;a.teleport(...at);a.camera=camera;a.render();},view);
   await settle();
   if(place.id==='kissa-higa')await page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.scene.getObjectByName('Kissa Higa models')?.children.length===4);
   await variations(place);
   await page.evaluate(()=>{window.__JOHANSSON_AUDIT__.camera=null;});
  }
  await writeFile(viewsPath,JSON.stringify(views)+'\n');
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
