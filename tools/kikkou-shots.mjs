// Photographs Sakura with the Kikkou ink and without it (render/kikkou-ids.js): boots World in a cloud session's software
// Chromium, enters Sakura through the audit harness, and photographs the shop from the door and three lenses into it,
// and Thuan at work, each with ?kikkou=1 and then ?kikkou=0 on the same frame (the page reads the address every frame).
//   node tools/kikkou-shots.mjs [--source] [--room market|sakura-office|izakaya|ramen|ship] [--time 12:20] [out-dir]
// --room ship: aboard the Minato Maru, through the engine room's eight fixed cameras, Kikkou as the game decides it
// (`kikkou=auto`: on because the player stands on her indoor floor) and off.
// The built runtime by default (npm run build:runtime first); --source serves the source modules. Run it alone.
// KIKKOU_MODES=kikkou:1,plain:0 (the default) names the passes and their ?kikkou= value: `ids` shows the IDs, `edge` the
// line alone. KIKKOU_LIST=<metres> lists the see-through and cut-out surfaces that near (with KIKKOU_TOWN=1, the town's
// round Sakura's frontage instead of the room's) into report.json, to find what a stray line is drawn round; with
// KIKKOU_MODES=ids:ids, KIKKOU_PROBE=x,y names the object at that pixel of the last shot.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const args=process.argv.slice(2),flag=k=>{const i=args.indexOf(k);return i>=0?args[i+1]:null;};
const SOURCE=args.includes('--source'),TIME=flag('--time')||'12:20',ROOM=flag('--room')||'market';
const out=resolve(args.find((a,i)=>!a.startsWith('--')&&!['--time','--room'].includes(args[i-1]))||resolve(root,'output/kikkou-shots'));await mkdir(out,{recursive:true});
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
const t0=Date.now(),at=()=>+((Date.now()-t0)/1000).toFixed(1),report={source:SOURCE,time:TIME,steps:[],errors:[],warnings:[]};
const step=(name,extra={})=>{report.steps.push({name,s:at(),...extra});console.log(at()+'s',name,Object.keys(extra).length?JSON.stringify(extra):'');};
try{
 const context=await browser.newContext({viewport:{width:900,height:900},serviceWorkers:'block'});
  await context.addInitScript(t=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:t,speed:1}));localStorage.setItem('johansson-town-view','third');Element.prototype.requestFullscreen=async()=>{};},TIME);
 const page=await context.newPage();page.setDefaultTimeout(900000);
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')report.warnings.push(m.text().slice(0,300));});
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit&kikkou=1`);step('page loaded');
 await page.locator('#enter:not([disabled])').waitFor();step('island ready');
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);step('playing');
 await page.addStyleTag({content:'body>*:not(#game){visibility:hidden!important}#game{visibility:visible!important}'});
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.hud.photo(true));
 if(ROOM==='ship'){
  // Aboard the Minato Maru: parked at Minato, the player stood on each engine-space floor in turn, photographed through the
  // engine room's own eight fixed cameras (ferry-engine-room-plan.js FERRY_H1_SHOTS; H1 metres: X forward, Y port, Z up).
  const {FERRY_H1_SHOTS}=await import('/home/user/johansson-town/src/world/ferry-engine-room-plan.js');
  await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.activities.close();a.frozen=true;a.camera=null;a.setTime(515);a.world.ferry.parkAt('town');a.world.ferry.update(0,515,0);a.step(50);});
  const at=([X,Y,Z])=>[Y,Z-1.9,X-17.25];
  const place=async H=>page.evaluate(([x,y,z])=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.step(30);const ship=a.world.ferry.ferry;ship.updateMatrixWorld(true);
   const p=ship.localToWorld(ship.position.clone().set(x,y,z));a.stand(p.x,p.y,p.z,0);a.step(30);return a.probe(p.x,p.y+1,p.z).deck;},at(H));
  step('stood in the engine room',{deck:await place([11.1,0,.9])});
  await page.waitForFunction(()=>{const s=window.__JOHANSSON_AUDIT__.world.ferry.ferry.userData.engineRoomH1;return s.loaded||s.error;},null,{timeout:120000});
  const shotsAboard=[];
  for(const sh of FERRY_H1_SHOTS){if(process.env.KIKKOU_VIEWS&&!process.env.KIKKOU_VIEWS.split(',').includes(sh.id))continue;
   const deck=await place([sh.pos[0],sh.pos[1],.9]);
   const cam=await page.evaluate(([p,t])=>{const ship=window.__JOHANSSON_AUDIT__.world.ferry.ferry;ship.updateMatrixWorld(true);
    const w=v=>ship.localToWorld(ship.position.clone().set(...v)).toArray();return {pos:w(p),at:w(t)};},[at(sh.pos),at(sh.at)]);
   for(const [mode,query] of (process.env.KIKKOU_MODES||'kikkou:1,plain:0').split(',').map(x=>x.split(':'))){
    await page.evaluate(q=>history.replaceState(null,'','?audit&visual-audit&kikkou='+(q==='1'?'auto':q)),query);
    await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},cam);await page.waitForTimeout(300);
    await page.locator('#game').screenshot({path:resolve(out,sh.id+'-'+mode+'.png')});step('photographed '+sh.id+'-'+mode,{deck});
   }
  }
  throw Object.assign(new Error('done'),{done:true});
 }
 // (Sakura's office is reached by the shop's stair: in at the shop, then up)
 await page.evaluate(async r=>{const a=window.__JOHANSSON_AUDIT__;await a.enter(r==='sakura-office'?'market':r);},ROOM);
 if(ROOM==='sakura-office'){await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);await page.evaluate(()=>window.__JOHANSSON_AUDIT__.stair('up'));for(let i=0;i<120&&await page.evaluate(()=>window.__JOHANSSON_AUDIT__.player.room)!=='sakura-office';i++){await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(400));await page.waitForTimeout(400);}await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(800));}
 await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
 const room=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.room);step('in '+ROOM,{room:typeof room==='object'?room?.id??null:room,player:await page.evaluate(()=>window.__JOHANSSON_AUDIT__.player)});
 const p=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.player);
 const [px,,pz]=p.position,fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw);
 // From the door, eye high, into the shop: straight ahead and to either side; then lower, at the shelves.
 const views={};
 for(const [k,turn,height,back,ahead] of [['door',0,1.6,.3,3],['left',.7,1.55,.2,2.5],['right',-.7,1.55,.2,2.5],['shelves',.35,1.2,-.6,2.2]]){
  const c=Math.cos(turn),s=Math.sin(turn),dx=fx*c-fz*s,dz=fx*s+fz*c;
  views[k]={pos:[px-fx*back,height,pz-fz*back],at:[px+dx*ahead,height-.35,pz+dz*ahead]};
 }
 // Thuan, if she is in the shop: a three-quarter lens on her.
 const thuan=await page.evaluate(()=>{let scene=window.__JOHANSSON_MODEL__?.avatar?.root;while(scene?.parent)scene=scene.parent;let t=null;
  scene?.traverse(o=>{if(o.name==='Shimanchu · Thuan'){let v=true;for(let q=o;q;q=q.parent)if(!q.visible)v=false;if(v)t=o;}});
  if(!t)return null;t.updateWorldMatrix(true,true);const e=t.matrixWorld.elements,l=Math.hypot(e[8],e[10]);return {p:[e[12],e[13],e[14]],f:[e[8]/l,e[10]/l]};});
 if(thuan){const a=.6,c=Math.cos(a),s=Math.sin(a),dx=thuan.f[0]*c-thuan.f[1]*s,dz=thuan.f[0]*s+thuan.f[1]*c;
  views.thuan={pos:[thuan.p[0]+dx*1.9,thuan.p[1]+1.25,thuan.p[2]+dz*1.9],at:[thuan.p[0],thuan.p[1]+.95,thuan.p[2]]};}
 if(process.env.KIKKOU_VIEWS){const keep=new Set(process.env.KIKKOU_VIEWS.split(','));for(const k of Object.keys(views))if(!keep.has(k))delete views[k];}
 step('views',{thuan:!!thuan});
 if(process.env.KIKKOU_LIST){report.list=await page.evaluate(([cx,cz,RADIUS,town])=>{const a=window.__JOHANSSON_AUDIT__;let scene=town?(a.world?.group||a.world?.scene||null):a.scene;if(town&&scene){cx=-8;cz=-28;}if(!scene){scene=window.__JOHANSSON_MODEL__?.avatar?.root;while(scene?.parent)scene=scene.parent;}
  const out=[];scene.traverseVisible(o=>{if(!o.isMesh)return;const ms=Array.isArray(o.material)?o.material:[o.material];if(!ms.some(m=>m&&(m.transparent||m.opacity<1||m.alphaTest>0||m.transmission>0||m.alphaHash||/glass|pane|window/i.test((o.name||'')+(o.parent?.name||'')))))return;
   o.geometry.computeBoundingBox?.();const b=o.geometry.boundingBox?.clone().applyMatrix4(o.matrixWorld);if(!b)return;const c=b.getCenter(b.min.clone()),sz=b.getSize(b.min.clone());
   if(Math.hypot(c.x-cx,c.z-cz)>(+RADIUS||14))return;out.push({name:o.name,parent:o.parent?.name,c:[c.x,c.y,c.z].map(v=>+v.toFixed(2)),size:[sz.x,sz.y,sz.z].map(v=>+v.toFixed(2)),mats:ms.map(m=>({n:m.name,t:m.type,tx:m.transmission,ah:m.alphaHash,tr:m.transparent,op:m.opacity,at:m.alphaTest,dw:m.depthWrite,map:!!m.map,cw:m.colorWrite}))});});
  return out;},[px,pz,+(process.env.KIKKOU_LIST)||14,!!process.env.KIKKOU_TOWN]);}
 const shot=async(name,cam)=>{await page.evaluate(c=>{const a=window.__JOHANSSON_AUDIT__;a.camera=c;a.render();},cam);await page.waitForTimeout(300);
  await page.locator('#game').screenshot({path:resolve(out,name+'.png')});step('photographed '+name);};
 for(const [mode,query] of (process.env.KIKKOU_MODES||'kikkou:1,plain:0').split(',').map(x=>x.split(':'))){
  await page.evaluate(q=>history.replaceState(null,'','?audit&visual-audit&kikkou='+q),query);
  for(const [k,cam] of Object.entries(views))await shot(k+'-'+mode,cam);
 }
 // KIKKOU_PROBE=x,y (screen pixels of the last shot, in ids mode): the object whose ID is there, and its parents.
 if(process.env.KIKKOU_PROBE){const [qx,qy]=process.env.KIKKOU_PROBE.split(',').map(Number);
  report.probe=await page.evaluate(([qx,qy])=>{const k=globalThis.__JOHANSSON_KIKKOU__;if(!k?.target)return 'no ids';const t=k.target,c=document.querySelector('#game canvas')||document.querySelector('canvas');
   const r=c.getBoundingClientRect(),x=Math.floor(qx/r.width*t.width),y=Math.floor((1-qy/r.height)*t.height),px=new Uint8Array(4);k.renderer.readRenderTargetPixels(t,x,y,1,1,px);
   const v=px[0]+256*px[1],o=k.drawn.get(v);const chain=[];for(let p=o;p;p=p.parent)chain.push(p.name||p.type);
   let pos=null;if(o){o.updateWorldMatrix(true,false);const e=o.matrixWorld.elements;pos=[e[12],e[13],e[14]].map(n=>+n.toFixed(2));}
   const m=o?(Array.isArray(o.material)?o.material[0]:o.material):null;
   return {pixel:[...px],id:v,chain,pos,material:m&&{type:m.type,name:m.name,transparent:m.transparent,opacity:m.opacity,map:!!m.map}};},[qx,qy]);}
 report.renderInfo=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.renderInfo);
}catch(error){if(!error?.done)report.errors.push(String(error?.stack||error));}
finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,1));console.log(JSON.stringify({steps:report.steps.length,errors:report.errors}));await browser.close();server.close();}
