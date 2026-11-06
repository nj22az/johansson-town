/** Photographs Minato for the blog's rubber-stamp pictures: each article's place, in the real game, in a chosen Look.
 *   node tools/minato-stamp-shoot.mjs <out-dir> [--list tools/minato-stamps.json] [--looks stamp,none] [--only a,b] [--size 2400x1200]
 * A shot (minato-stamps.json) names its frame:
 *   view   a storyteller camera from assets/images/feed/views.json: {"view":"harbour/wide"}
 *   ship   metres in the Minato Maru's own frame (x across, +x port; z from her stern; y above her keel), wherever she lies
 *   near   metres from the ferry's position in the world (as tools/ferry-look.mjs frames her from the quay)
 *   world  plain world coordinates
 *   resident  framed on a resident wherever she is at that time: {"resident":{"name":"Thuan","dist":2.4,"side":.8,"y":1.45}}
 * Every shot parks the ferry alongside in town, sets the time ("17:40"), hides the HUD and keeps Johansson out of frame.
 * "lights": true turns her navigation lights on; "clear" (metres, default 2.2) hides the people that close to the lens;
 * "room" (an interior's id, e.g. "market" for Sakura, "onsen") enters it first, with its "view" camera.
 * "back" (metres) is how far behind the lens Johansson stands: keep it small indoors, where a room is drawn only near him.
 */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {FERRY_SHIP} from '../src/world/ferry-ship.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const arg=(name,fallback)=>{const i=process.argv.indexOf('--'+name);return i>0?process.argv[i+1]:fallback;};
const out=resolve(process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:resolve(root,'output/minato-stamps'));await mkdir(out,{recursive:true});
const [W,H]=arg('size','2400x1200').split('x').map(Number);
const looks=arg('looks','stamp').split(',');
const only=arg('only')?new Set(arg('only').split(',')):null;
const list=JSON.parse(await readFile(resolve(arg('list',resolve(root,'tools/minato-stamps.json'))),'utf8')).shots.filter(s=>!only||only.has(s.name));
const views=JSON.parse(await readFile(resolve(root,'assets/images/feed/views.json'),'utf8'));
/** A storyteller camera (position and quaternion) as a position and a point 10 m ahead of it. */
function fromView(key){const [id,view]=key.split('/'),c=views[id][view].camera,[x,y,z,w]=c.quaternion,p=c.position;
 const f=[-(2*(x*z+w*y)),-(2*(y*z-w*x)),-(1-2*(x*x+y*y))];return {pos:p,at:p.map((v,i)=>v+f[i]*10)};}
const HALF=FERRY_SHIP.length/2,DRAFT=FERRY_SHIP.draft;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.wasm':'application/wasm','.webmanifest':'application/manifest+json','.ktx2':'image/ktx2','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname),file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(site+'/'))throw Error('outside');const body=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||chromium.executablePath(),args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const report={size:[W,H],looks,shots:{},errors:[]};
try{
 const context=await browser.newContext({viewport:{width:W,height:H},deviceScaleFactor:1,serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'11:30',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(900000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
 await page.locator('#enter:not([disabled])').waitFor();await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading&&!window.__JOHANSSON_STREAMING__?.active);
 const canvas=page.locator('canvas').first();
 for(const look of looks){
  await page.evaluate(name=>window.__JOHANSSON_LOOK__.setStyle(name),look);
  for(const s of list){
   const [h,m]=(s.time||'17:40').split(':').map(Number);
   const fixed=s.view?fromView(s.view):null;
   // An interior is its own room, drawn only once entered (as tools/render-feed-backdrops.mjs does it).
   if(s.room){await page.evaluate(async([id,minutes])=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.setTime(10002*1440+minutes);await a.enter(id);a.render();},[s.room,h*60+m]);
    await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);await page.waitForTimeout(1500);}
   const view=await page.evaluate(({s,fixed,minutes,HALF,DRAFT})=>{
    const a=window.__JOHANSSON_AUDIT__,run=a.world.ferry,f=run.ferry;
    if(!s.room){a.setTime(10002*1440+minutes);a.step(200);
    // She lies alongside in town for every picture, so the harbour shots show her and her rooms are in port.
    run.parkAt('town');run.update(.1,minutes,0);f.userData.lights?.(!!s.lights);f.updateMatrixWorld(true);}
    const V=f.position.constructor;let pos,at;
    if(fixed){pos=fixed.pos;at=fixed.at;}
    else if(s.ship){const w=v=>f.localToWorld(new V(v[0],v[1]-DRAFT,v[2]-HALF)).toArray();pos=w(s.ship.pos);at=w(s.ship.at);}
    else if(s.resident){
     // A resident wherever her day has taken her: the camera in front of her (dist metres along the way she faces,
     // side metres to her left), at height y, looking at her chest.
     let who=null;a.scene.traverse(o=>{if(!who&&o.userData?.name===s.resident.name)who=o;});
     if(!who)throw Error(s.resident.name+' is not in the scene at '+s.time);
     who.updateMatrixWorld(true);const p=who.getWorldPosition(new V()),d=who.getWorldDirection(new V());d.y=0;d.normalize();
     const l=new V(d.z,0,-d.x),r=s.resident;
     pos=[p.x+d.x*r.dist+l.x*r.side,p.y+r.y,p.z+d.z*r.dist+l.z*r.side];at=[p.x+l.x*(r.lookSide||0),p.y+(r.look??1.05),p.z+l.z*(r.lookSide||0)];
     s.__where=[p.x,p.y,p.z];
    }
    else if(s.near){const p=f.position;pos=[p.x+s.near.pos[0],s.near.pos[1],p.z+s.near.pos[2]];at=[p.x+s.near.at[0],s.near.at[1],p.z+s.near.at[2]];}
    else {pos=s.world.pos;at=s.world.at;}
    // Johansson stands far behind the lens, on the ground, out of every picture.
    // (For a resident, only a few metres behind: a room may only be drawn while the player is near it.)
    const dx=pos[0]-at[0],dz=pos[2]-at[2],d=Math.hypot(dx,dz)||1,back=s.back??(s.resident?2.5:40);if(!s.room){a.teleport(pos[0]+dx/d*back,pos[2]+dz/d*back,0,0);a.step(30);}
    // People right against the lens (an engineer at the board, a head at the camera's shoulder) step out of the picture;
    // the ones further off stay, so the place keeps its life. Skinned bodies, and what they carry on their bones.
    const clear=s.clear??2.2,hidden=[],q=new V();
    a.scene.traverse(o=>{if(!o.isSkinnedMesh)return;o.getWorldPosition(q);if(Math.hypot(q.x-pos[0],q.z-pos[2])>=clear)return;
     o.visible=false;hidden.push(o.name||'resident');for(const b of o.skeleton?.bones||[])b.traverse(c=>{if(c.isMesh)c.visible=false;});});
    for(const h of [a.hands,a.hands?.group,a.hands?.root])if(h?.isObject3D)h.visible=false;
    a.hud.photo(true);a.camera={pos,at,...(s.fov?{fov:s.fov}:{})};a.render();a.render();return {pos,at,hidden,where:s.__where};
   },{s,fixed,minutes:h*60+m,HALF,DRAFT});
   await page.waitForTimeout(500);
   const file=`${s.name}--${look}.png`;await canvas.screenshot({path:resolve(out,file)});
   if(s.room){await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.leave();});await page.waitForTimeout(1000);}
   report.shots[file]={...view,time:s.time||'17:40',note:s.note};console.log('shot',file);
  }
 }
}catch(error){report.errors.push(String(error.stack||error));console.error(error);process.exitCode=1;}
finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,1));await browser.close();server.close();}
