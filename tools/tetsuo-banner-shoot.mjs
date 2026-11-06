/** Photographs Tetsuo at the wheel of his own kei truck, driving his real road, for the Hotels & Parking banner.
 * Freezes the town, places a free camera around the truck and renders every requested Look.
 *   node tools/tetsuo-banner-shoot.mjs <out-dir> [--shots a,b] [--looks none,oil] [--time 17:40] [--size 2400x900] [--scout]
 * --scout also writes the truck's pose and nearby road so camera setups can be chosen.
 */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const arg=(name,fallback)=>{const i=process.argv.indexOf('--'+name);return i>0?process.argv[i+1]:fallback;};
const out=resolve(process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:'output/tetsuo-banner');await mkdir(out,{recursive:true});
const [W,H]=arg('size','2400x900').split('x').map(Number);
const time=arg('time','17:40').split(':').map(Number);
const looks=arg('looks','none').split(',');
const scout=process.argv.includes('--scout');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.wasm':'application/wasm','.webmanifest':'application/manifest+json','.ktx2':'image/ktx2','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname),file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(site+'/'))throw Error('outside');const body=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||chromium.executablePath(),args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
// Camera setups in the truck's own frame: f = metres ahead of its nose direction, s = metres to its driver's side (+x
// in the truck's frame is the passenger side, the driver sits at -x), y = height; look = point on the truck in the same frame.
const SHOTS={
 sideSea:{f:-.6,s:-5.2,y:1.15,look:[0,1.05,.4]},
 sideSeaLow:{f:.8,s:-4.4,y:.7,look:[0,1.1,.9]},
 cab:{f:3.2,s:-2.2,y:1.35,look:[-.3,1.25,.4]},
 front34:{f:6.5,s:-3.2,y:1.05,look:[0,.95,-.2]},
 front34high:{f:8,s:-5,y:3.2,look:[0,.8,-.6]},
 side:{f:.4,s:-6.5,y:1.25,look:[0,.95,.2]},
 rear34:{f:-6.5,s:-3.4,y:1.6,look:[0,.95,.6]},
 low:{f:5.2,s:-1.6,y:.45,look:[0,1.1,-.4]},
 wide:{f:14,s:-9,y:6.5,look:[0,.8,-3]},
 ...JSON.parse(arg('custom','{}')),
};
const pick=arg('shots',Object.keys(SHOTS).join(',')).split(',');
const report={size:[W,H],time:arg('time','17:40'),looks,shots:{},errors:[]};
try{
 const context=await browser.newContext({viewport:{width:W,height:H},deviceScaleFactor:1,serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'11:30',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage();page.setDefaultTimeout(600000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
 await page.locator('#enter:not([disabled])').waitFor();await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 const pose=await page.evaluate(({minutes,road,from,clear})=>{
  const a=window.__JOHANSSON_AUDIT__,c=a.world.traffic;a.setTime(10002*1440+minutes);c.reconcileAbsent();
  const v=c.islanders.find(v=>v.owner==='Tetsuo');
  if(!c.drivers.board(v))throw Error('Tetsuo could not take the wheel');
  for(const car of c.traffic.vehicles)car.hold=true;
  v.where='driving';c.traffic.drive(v,c.network.path([road]),{from});v.hold=true;a.step(60);
  // The truck's group can sit inside a moving parent: use its world position and heading.
  v.g.updateMatrixWorld(true);
  // Aim at the truck's drawn body: the centre of its world bounding box, not its group origin.
  const B=v.g.position.constructor,box={min:new B(Infinity,Infinity,Infinity),max:new B(-Infinity,-Infinity,-Infinity)},tmp=new B();
  v.g.traverse(o=>{if(!o.isMesh||!o.geometry)return;o.geometry.computeBoundingBox?.();const b=o.geometry.boundingBox;if(!b)return;
   for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){tmp.set(x,y,z).applyMatrix4(o.matrixWorld);box.min.min(tmp);box.max.max(tmp);}});
  const d=v.g.getWorldDirection(new B()),yaw=Math.atan2(d.x,d.z);
  const p=new B((box.min.x+box.max.x)/2,box.min.y,(box.min.z+box.max.z)/2),origin=v.g.getWorldPosition(new B());
  // Keep Johansson out of frame, far behind the truck.
  a.teleport(p.x-Math.sin(yaw)*45,p.z-Math.cos(yaw)*45,yaw,0);a.step(60);
  // A portrait of one truck: other moving or parked vehicles within reach of the lens step out of the picture.
  const hidden=[];for(const car of c.traffic.vehicles){if(car===v)continue;const q=car.g.getWorldPosition(car.g.position.clone());if(Math.hypot(q.x-p.x,q.z-p.z)<Number(clear)){car.g.visible=false;hidden.push(car.owner||car.kind);}}
  v.g.updateMatrixWorld(true);a.hud.photo(true);
  return {x:p.x,y:p.y,z:p.z,yaw,origin:origin.toArray(),box:[box.min.toArray(),box.max.toArray()],kind:v.kind,driver:c.drivers.atWheel(v),length:v.length,width:v.width,hidden};
 },{minutes:time[0]*60+time[1],road:arg('road','main-south'),from:Number(arg('from','27.5')),clear:arg('clear','30')});
 report.truck=pose;console.log('truck',JSON.stringify(pose));
 const canvas=page.locator('canvas').first();
 for(const look of looks){
  await page.evaluate(name=>window.__JOHANSSON_LOOK__.setStyle(name),look);
  for(const name of pick){
   const s=SHOTS[name];
   const view=((p,yaw)=>{const fx=Math.sin(yaw),fz=Math.cos(yaw),sx=Math.cos(yaw),sz=-Math.sin(yaw);
    const at=(f,side,y)=>[p.x+fx*f+sx*side,p.y+y,p.z+fz*f+sz*side];
    return {pos:at(s.f,s.s,s.y),at:at(s.look[2],s.look[0],s.look[1])};})(pose,pose.yaw);
   await page.evaluate(v=>{const a=window.__JOHANSSON_AUDIT__;a.camera=v;a.render();a.render();},view);
   await page.waitForTimeout(400);
   const file=`${name}--${look}.png`;await canvas.screenshot({path:resolve(out,file)});
   report.shots[file]=view;console.log('shot',file);
  }
 }
 if(scout)report.lens=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.lens);
}catch(error){report.errors.push(String(error.stack||error));console.error(error);process.exitCode=1;}
finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,1));await browser.close();server.close();}
