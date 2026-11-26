// Finds flicker aboard the Minato Maru the way the eye does: in the running game, not in the model's numbers.
//
//   node tools/flicker-audit.mjs [--profile=ipad|iphone|desktop] [--views=id,id] [--out=dir] [--time=720]
//                                [--variants=game,no-shadow,no-ink] [--still] [--runtime] [--src=dir] [--json=file]
//
// --still photographs the views without moving anything (to look at them); --src=dir serves src/ from dir/src instead
// (for a before-and-after: git archive <commit> src | tar -x -C dir).
//
// A view is photographed once and then again after the smallest moves there are: the camera a fraction of a millimetre
// along each axis and turned a few thousandths of a degree (what the depth buffer does with two faces it cannot tell
// apart), and the sun's shadow map slid a few millimetres under her (what happens as she moves at sea and alongside:
// the shadow map is held to the town's grid round the player, so every surface aboard slides through its texels). A real edge only moves by a fraction
// of a pixel under such moves, so each pixel of a moved picture is compared with the nearest matching colour within one
// pixel of it in the first: what is left is a pixel that changed colour while nothing near it moved. That is z-fighting,
// shadow acne or a shadow's crawling saw-teeth, and none of them is allowed (AGENTS.md; JSY-STD-403).
//
// The report gives, per view and per kind of move, the unstable pixels per 10 000 (ppm/100), and writes the first picture,
// a heat map of the unstable pixels over it (red: camera moves, blue: shadow-map moves) and a JSON report to --out.
// It serves this checkout's source modules (src/boot.js), so a change is measured before the runtime is rebuilt;
// --runtime serves the built runtime instead. Software graphics (swiftshader): no claim about an iPhone's GPU.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
/** A pixel counts as changed when a channel moves by this much (of 255) and no pixel within one of it matches. Under the
 * camera's moves the picture's edges shift and its anti-aliasing with them, so only a real flip counts (two faces in one
 * plane: a yellow stripe and grey vinyl); under the shadow map's moves nothing on the screen moves at all, and shadow
 * acne's bands are only a cel band's step apart (about 35 of 255 on a white wall), so a smaller change counts. */
export const FLIP_THRESHOLD=40,SHADOW_THRESHOLD=16;

/** The owner's devices: an iPad mini in portrait (his photographs, 1488 × 2266 at 2×), an iPhone, a desktop. At 1×. */
const PROFILES={
 ipad:{viewport:{width:744,height:1133},deviceScaleFactor:1,isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'},
 iphone:{viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'},
 desktop:{viewport:{width:1280,height:800},deviceScaleFactor:1,isMobile:false,hasTouch:false},
};

/**
 * The views, in the ship's own frame (ferry-model.js: +x to port, +z forward, y up from the laden waterline).
 * `eye` and `at` place an audit camera; `stand` (with `yaw`/`pitch`) stands him there and lets the game's own camera
 * (the engine room's explorer, near plane 0.055 m) take the picture. The first two are the owner's photographs of
 * 26 November 2026; the rest walk her other spaces.
 */
export const FLICKER_VIEWS=[
 {id:'car-deck-engine-room-door',note:'the owner’s first photograph: the casing P door, its hazard stripes and the 機関室 sign',
  eye:[.35,3.75,-12.9],at:[2.75,2.55,-11.2],near:.15},
 {id:'engine-room',note:'the owner’s second photograph: forward between the engines, the grating aisle, chequer plate',
  stand:[1.75,-1,-8.1],yaw:Math.PI*1.05,pitch:-.18},
 {id:'engine-room-port',note:'the engine room forward along the port engine’s outboard side, the workbench to port',
  stand:[2.95,-1,-8.2],yaw:Math.PI*1.02,pitch:-.25},
 {id:'car-deck-forward',note:'the car deck from aft, along the lanes',eye:[0,3.8,-14.5],at:[0,2.4,-4],near:.15},
 {id:'car-deck-aft',note:'the car deck from the bow, aft between the casings',eye:[.6,3.8,8],at:[0,2.6,-8],near:.15},
 {id:'stair-p',note:'stair P from its foot',eye:[3.3,3.9,-5.4],at:[3.4,5.6,-9.6],near:.15},
 {id:'lobby',note:'the lobby across to the stair heads',eye:[0,8.1,-8.2],at:[3.5,6.9,-10.8],near:.15},
 {id:'saloon',note:'the saloon from its aft end',eye:[2.6,8.1,-.6],at:[-1.5,7,5],near:.15},
 {id:'carpet-room',note:'the carpet room',eye:[-2.6,8.3,-1.4],at:[2.4,6.9,-5],near:.15},
 {id:'wheelhouse',note:'the wheelhouse, to the console',eye:[1.8,10.7,2.6],at:[-.5,10,5.6],near:.15},
 {id:'crew-corridor',note:'the crew corridor on the bridge deck',eye:[0,10.7,-11],at:[0,10.2,2],near:.15},
 {id:'starboard-walkway',note:'outside: the starboard walkway along the deckhouse’s side, turned from the noon sun',
  eye:[-3.78,8.2,-7.4],at:[-3.3,7.3,.5],near:.15},
 {id:'open-deck',note:'outside: the open deck aft, to the lobby’s aft face and the bridge deck over it',eye:[1.2,8.2,-16.4],at:[0,8,-10],near:.15},
 {id:'mess',note:'the crew mess',eye:[2.6,10.7,-.9],at:[.4,9.9,-3],near:.15},
 {id:'engine-room-aft',note:'the engine room aft to the gearboxes and control booth',stand:[0,-1,-4.2],yaw:0,pitch:-.12},
 {id:'aux-room',note:'the auxiliary machinery room',stand:[0,-1,.5],yaw:Math.PI,pitch:-.12},
 {id:'workshop',note:'the workshop',stand:[1.5,-1,3.4],yaw:Math.PI*.6,pitch:-.12},
];

/** The camera moves (metres; degrees for turns). Each is far below a pixel at the distances seen aboard. */
const CAMERA_MOVES=[['x',.0004],['y',-.0004],['z',.0004],['yaw',.004]];
/** The shadow map's moves under her (world metres, x and z): nothing on the screen moves but the shadow's texels. */
const SHADOW_MOVES=[[.004,.009],[.017,-.006],[-.011,.023]];

const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav','.wasm':'application/wasm','.hdr':'application/octet-stream','.mp4':'video/mp4'};
const sourcePage=html=>html.replace(/<link rel="modulepreload" data-town-runtime[^>]*>\n?/g,'')
 .replace(/import\(['"]\.\/runtime\/boot-[^'"]+['"]\)/g,"import('./src/boot.js')")
 .replace(/from ['"]\.\/runtime\/audio-[^'"]+['"]/g,"from './src/audio/town-audio.js?snappy=1'")
 .replace(/window\.JOHANSSON_FEED_MODULE="[^"]+"/,'window.JOHANSSON_FEED_MODULE="./src/feed/mount.js"')
 .replace(/window\.JOHANSSON_PORTRAIT_MODULE="[^"]+"/,'window.JOHANSSON_PORTRAIT_MODULE="./src/avatars/guide-portraits.js"');

/**
 * Pixels of `moved` that no pixel within one of the same place in `base` matches, and the other way round (an edge
 * that only slid by a fraction of a pixel finds its colour beside it; a face that flipped does not). RGBA buffers.
 */
export function unstablePixels(base,moved,width,height,threshold=FLIP_THRESHOLD){
 const flags=new Uint8Array(width*height);let count=0;
 const near=(a,b,i)=>{
  const x=i%width,y=(i-x)/width;let best=255;
  for(let dy=-1;dy<=1&&best>threshold;dy++){const yy=y+dy;if(yy<0||yy>=height)continue;
   for(let dx=-1;dx<=1;dx++){const xx=x+dx;if(xx<0||xx>=width)continue;const j=(yy*width+xx)*4,k=i*4;
    const d=Math.max(Math.abs(a[k]-b[j]),Math.abs(a[k+1]-b[j+1]),Math.abs(a[k+2]-b[j+2]));if(d<best){best=d;if(best<=threshold)break;}}}
  return best;
 };
 for(let i=0;i<width*height;i++){
  const k=i*4;if(Math.max(Math.abs(base[k]-moved[k]),Math.abs(base[k+1]-moved[k+1]),Math.abs(base[k+2]-moved[k+2]))<=threshold)continue;
  if(near(moved,base,i)>threshold||near(base,moved,i)>threshold){flags[i]=1;count++;}
 }
 return {flags,count};
}

async function main(){
 const args=process.argv.slice(2),flag=(name,fallback=null)=>args.find(a=>a.startsWith('--'+name+'='))?.split('=').slice(1).join('=')??fallback;
 const PROFILE=flag('profile','ipad'),RUNTIME=args.includes('--runtime'),MINUTES=Number(flag('time','720'));
 const out=resolve(flag('out',resolve(root,'output/flicker-audit')));await mkdir(out,{recursive:true});
 const VARIANTS=(flag('variants','game')).split(','),STILL=args.includes('--still'),SRC=flag('src')?resolve(flag('src')):null;
 const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname);
  if(!path.startsWith('/johansson-town/'))throw Error('outside');
  const rel=path.slice('/johansson-town'.length)+(path.endsWith('/')?'index.html':''),base=SRC&&rel.startsWith('/src/')?SRC:root;
  const file=resolve(base,'.'+rel);if(!file.startsWith(base))throw Error('outside');
  let body=await readFile(file);if(!RUNTIME&&file===resolve(root,'index.html'))body=sourcePage(body.toString());
  res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(body);}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||'/opt/pw-browsers/chromium',
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--ignore-gpu-blocklist']});
 const t0=Date.now(),at=()=>+((Date.now()-t0)/1000).toFixed(1);
 const report={profile:PROFILE,source:!RUNTIME,src:SRC,minutes:MINUTES,threshold:{camera:FLIP_THRESHOLD,shadow:SHADOW_THRESHOLD},physicalDevice:false,renderer:'swiftshader',views:[],errors:[]};
 try{
  const context=await browser.newContext({...PROFILES[PROFILE],serviceWorkers:'block'});
  await context.addInitScript(start=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start,speed:1}));Element.prototype.requestFullscreen=async()=>{};},
   String(Math.floor(MINUTES/60)).padStart(2,'0')+':'+String(MINUTES%60).padStart(2,'0'));
  const page=await context.newPage();page.setDefaultTimeout(600000);page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));
  await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
  await page.locator('#enter:not([disabled])').waitFor();console.log(at()+'s island ready');
  if(PROFILES[PROFILE].hasTouch)await page.locator('#enter').tap();else await page.locator('#enter').click();
  await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);console.log(at()+'s playing');
  await page.addStyleTag({content:'body *:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
  report.graphics=await page.evaluate(minutes=>{
   const a=window.__JOHANSSON_AUDIT__,r=a.renderer,look=window.__JOHANSSON_LOOK__;
   // The shadow map slid by window.__FLICKER_SHADOW_SHIFT__ (world metres): the sun and its target are moved for the
   // shadow pass only, after the game has placed them for the hour.
   {const sun=look.lights.sun,shadow=sun.shadow,update=shadow.updateMatrices.bind(shadow);
    shadow.updateMatrices=function(light){const s=window.__FLICKER_SHADOW_SHIFT__;if(!s)return update(light);
     const move=(k)=>{light.position.x+=k*s[0];light.position.z+=k*s[1];light.target.position.x+=k*s[0];light.target.position.z+=k*s[1];light.updateMatrixWorld();light.target.updateMatrixWorld();};
     move(1);try{return update(light);}finally{move(-1);}};}
   // The game's camera, as the renderer is handed it (it is not otherwise exposed).
   const render=r.render;r.render=function(scene,camera){if(camera?.isPerspectiveCamera&&camera.far>=600)window.__FLICKER_CAMERA__=camera;return render.apply(this,arguments);};
   a.activities?.close?.();a.frozen=true;a.camera=null;a.setTime(minutes);a.world.ferry.parkAt('town');a.world.ferry.update(0,minutes,0);a.step(50);
   const sun=look.lights.sun;
   return {shadows:r.shadowMap.enabled,shadowType:r.shadowMap.type,shadowSize:sun.shadow.mapSize.toArray(),bias:sun.shadow.bias,normalBias:sun.shadow.normalBias,
    shadowCamera:[sun.shadow.camera.left,sun.shadow.camera.right,sun.shadow.camera.near,sun.shadow.camera.far],state:look.state,
    buffer:[r.domElement.width,r.domElement.height]};
  },MINUTES);
  console.log('graphics',JSON.stringify(report.graphics));
  const wanted=flag('views')?flag('views').split(','):FLICKER_VIEWS.map(v=>v.id);
  const grab=async()=>{const png=PNG.sync.read(await page.locator('#game').screenshot());return png;};
  for(const view of FLICKER_VIEWS.filter(v=>wanted.includes(v.id))){
   for(const variant of VARIANTS){
    // Place the view, then hand back where the game's camera stands, in the ship's frame and the world's.
    const placed=await page.evaluate(async([view,variant])=>{
     const a=window.__JOHANSSON_AUDIT__,look=window.__JOHANSSON_LOOK__,ship=a.world.ferry.ferry,V=ship.position.constructor;
     window.__FLICKER_SHADOW_SHIFT__=null;ship.updateMatrixWorld(true);
     const sun=look.lights.sun;sun.castShadow=variant!=='no-shadow';if(look.state)look.state.ink=variant!=='no-ink';
     a.camera=null;
     if(view.stand){
      const p=ship.localToWorld(new V(...view.stand));a.stand(p.x,p.y,p.z,view.yaw);a.face(view.yaw+ship.rotation.y,view.pitch);a.step(400);
      await new Promise(r=>setTimeout(r,50));
      for(let i=0;i<60&&!(!a.blocked.roomLoading&&!window.__JOHANSSON_STREAMING__?.active&&(ship.userData.engineRoomH1?.loaded!==false));i++)await new Promise(r=>setTimeout(r,250));
      a.step(300);
     }else{
      // He stands a step behind the lens, on the deck it looks over, so the game draws the ship's rooms as he sees them
      // and he is not in the picture.
      const back=new V(view.eye[0]-view.at[0],0,view.eye[2]-view.at[2]).normalize().multiplyScalar(.9);
      const p=ship.localToWorld(new V(view.eye[0]+back.x,view.eye[1]-1.7,view.eye[2]+back.z));a.stand(p.x,p.y,p.z,0);a.step(200);
     }
     const cam=window.__FLICKER_CAMERA__;
     if(view.eye){const e=ship.localToWorld(new V(...view.eye)),t=ship.localToWorld(new V(...view.at));a.camera={pos:e.toArray(),at:t.toArray()};a.render();if(view.near){cam.near=view.near;cam.updateProjectionMatrix();}}
     else{a.render();const d=new V();cam.getWorldDirection(d);a.camera={pos:cam.position.toArray(),at:cam.position.clone().add(d.multiplyScalar(4)).toArray()};}
     a.render();
     const eye=ship.worldToLocal(new V(...a.camera.pos)),target=ship.worldToLocal(new V(...a.camera.at));
     return {eye:eye.toArray(),at:target.toArray(),near:cam.near,far:cam.far,fov:cam.fov,deck:a.probe(...a.player.position).deck,player:a.player.position};
    },[view,variant]);
    const base=await grab();const {width,height}=base;
    await writeFile(resolve(out,`${PROFILE}-${view.id}-${variant}.png`),PNG.sync.write(base));
    const heat=Buffer.from(base.data);for(let i=0;i<heat.length;i+=4){const g=(heat[i]+heat[i+1]+heat[i+2])/3*.45;heat[i]=heat[i+1]=heat[i+2]=g;}
    const union={camera:new Uint8Array(width*height),shadow:new Uint8Array(width*height)},per={camera:[],shadow:[]};
    if(STILL){report.views.push({id:view.id,variant,...placed});console.log(at()+'s',view.id,variant,'still');continue;}
    for(const [kind,moves] of [['camera',CAMERA_MOVES],['shadow',SHADOW_MOVES]]){
     for(const move of moves){
      await page.evaluate(([kind,move,placed])=>{
       const a=window.__JOHANSSON_AUDIT__,ship=a.world.ferry.ferry,V=ship.position.constructor;
       const eye=new V(...placed.eye),target=new V(...placed.at);
       if(kind==='camera'){
        const [axis,amount]=move;
        if(axis==='x'||axis==='y'||axis==='z'){eye[axis]+=amount;target[axis]+=amount;}
        else{const d=target.clone().sub(eye),len=d.length(),turn=amount*Math.PI/180*len;
         if(axis==='yaw'){const side=new V(-d.z,0,d.x).normalize();target.addScaledVector(side,turn);}else target.y+=turn;}
       }
       window.__FLICKER_SHADOW_SHIFT__=kind==='shadow'?move:null;
       ship.updateMatrixWorld(true);
       a.camera={pos:ship.localToWorld(eye).toArray(),at:ship.localToWorld(target).toArray()};a.render();
      },[kind,move,placed]);
      const moved=await grab(),{flags,count}=unstablePixels(base.data,moved.data,width,height,kind==='shadow'?SHADOW_THRESHOLD:FLIP_THRESHOLD);
      per[kind].push(+(count/(width*height)*1e4).toFixed(2));for(let i=0;i<flags.length;i++)if(flags[i])union[kind][i]=1;
     }
    }
    await page.evaluate(()=>{window.__FLICKER_SHADOW_SHIFT__=null;});
    const total=k=>union[k].reduce((s,v)=>s+v,0),pixels=width*height;
    for(let i=0;i<pixels;i++){const k=i*4;if(union.camera[i]){heat[k]=255;heat[k+1]=40;heat[k+2]=40;}else if(union.shadow[i]){heat[k]=40;heat[k+1]=120;heat[k+2]=255;}}
    await writeFile(resolve(out,`${PROFILE}-${view.id}-${variant}-unstable.png`),PNG.sync.write({width,height,data:heat}));
    const entry={id:view.id,variant,note:view.note,...placed,size:[width,height],
     camera:{per10k:+(total('camera')/pixels*1e4).toFixed(2),moves:per.camera},shadow:{per10k:+(total('shadow')/pixels*1e4).toFixed(2),moves:per.shadow}};
    report.views.push(entry);console.log(at()+'s',view.id,variant,'camera',entry.camera.per10k,'shadow',entry.shadow.per10k,'(per 10 000 pixels)');
   }
  }
 }catch(e){report.failure=e.stack||e.message;process.exitCode=1;console.error(e);}
 finally{await browser.close();server.close();await writeFile(flag('json')||resolve(out,`report-${PROFILE}.json`),JSON.stringify(report,null,1)+'\n');}
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();
