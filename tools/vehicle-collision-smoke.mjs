/** Real compiled-game regression for the owner's 24 October truck overlap report.
 * Stages the existing Tetsuo/car on its actual road; movement is ordinary keyboard input.
 * node tools/vehicle-collision-smoke.mjs [output-directory]
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),site=resolve(root,'..');
const out=resolve(process.argv[2]||'output/vehicle-collision');await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.svg':'image/svg+xml','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://x').pathname),file=resolve(site,'.'+(path.endsWith('/')?path+'index.html':path));if(!file.startsWith(site+'/'))throw Error('outside');const body=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.TOWN_CHROMIUM_PATH||chromium.executablePath(),args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const report={compiled:true,physicalDevice:false,checks:[],pageErrors:[],screenshots:[],passed:false};
let page;
const check=(name,extra={})=>{report.checks.push({name,passed:true,...extra});console.log(name);};
try{
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'11:30',speed:1}));Element.prototype.requestFullscreen=async()=>{};});
 page=await context.newPage();page.setDefaultTimeout(480000);page.on('pageerror',e=>report.pageErrors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/johansson-town/?audit&visual-audit`);
 await page.locator('#enter:not([disabled])').waitFor();await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 check('compiled World boots');
 const fixture=await page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__,c=a.world.traffic;a.setTime(10002*1440+690);c.reconcileAbsent();
  const v=c.islanders.find(v=>v.owner==='Tetsuo');
  if(!c.drivers.board(v))throw Error('The real driver could not be borrowed for the truck fixture');
  for(const car of c.traffic.vehicles)car.hold=true;
  v.where='driving';c.traffic.drive(v,c.network.path(['main-south']),{from:27.5});v.hold=true;
  a.teleport(v.g.position.x+3,v.g.position.z,Math.PI/2,0);a.step(50);
  return {x:v.g.position.x,y:v.g.position.y,z:v.g.position.z,width:v.width,length:v.length,driver:c.drivers.atWheel(v),trip:!!v.trip};
 });
 assert.equal(fixture.driver,true);assert.equal(fixture.trip,true);check('existing resident occupies an actual on-road vehicle',fixture);
 const status=()=>page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__,v=a.world.traffic.islanders.find(v=>v.owner==='Tetsuo');
  return {player:a.player.position,car:v.g.position.toArray(),solid:{...v.solid},active:a.active,navigation:a.navigation(v.g.position.x,v.g.position.z),held:v.hold};
 });
 // Test all four approaches using the real movement/collision code, not audit teleports into the body.
 for(const [side,dx,dz,yaw] of [['east',1,0,Math.PI/2],['west',-1,0,-Math.PI/2],['front',0,1,0],['rear',0,-1,Math.PI]]){
  const edge=(dx?fixture.width/2:fixture.length/2)+1.3;
  const x=fixture.x+dx*edge,z=fixture.z+dz*edge;
  await page.evaluate(({x,z,yaw})=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.teleport(x,z,yaw,0);a.step(100);},{x,z,yaw});
  const before=await status();await page.keyboard.down('w');await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(1500));await page.keyboard.up('w');
  const after=await status(),px=after.player[0],pz=after.player[2],moved=Math.hypot(px-before.player[0],pz-before.player[2]);
  assert.ok(moved>.3,`${side}: walking never approached the car (${moved})`);
  const clearance=dx?Math.abs(px-fixture.x)-fixture.width/2:Math.abs(pz-fixture.z)-fixture.length/2;
  assert.ok(clearance>=.27&&clearance<.65,`${side}: body clearance ${clearance}`);
  assert.notEqual(after.active,'Talk to Tetsuo');check('ordinary walking blocked on '+side,{clearance,moved});
 }
 await page.keyboard.press('v');
 await page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__,v=a.world.traffic.islanders[0];a.teleport(v.g.position.x+1.08,v.g.position.z+.3,Math.PI/2,0);a.step(100);
  a.camera={pos:[v.g.position.x+5,2.8,v.g.position.z+5],at:[v.g.position.x,1.1,v.g.position.z]};a.render();
 });
 await page.screenshot({path:resolve(out,'vehicle-collision-desktop.png')});report.screenshots.push('vehicle-collision-desktop.png');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,v=a.world.traffic.islanders[0];a.camera={pos:[v.g.position.x+5,2.8,v.g.position.z+6],at:[v.g.position.x,1.2,v.g.position.z]};a.render();});
 await page.screenshot({path:resolve(out,'vehicle-collision-phone.png')});report.screenshots.push('vehicle-collision-phone.png');check('desktop and phone-width game views captured');
 const old=await status();
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,v=a.world.traffic.islanders[0];a.teleport(v.g.position.x+5,v.g.position.z+6,0,0);v.hold=false;a.step(2000);});
 const moved=await status();assert.ok(Math.hypot(moved.car[0]-old.car[0],moved.car[2]-old.car[2])>.5);
 assert.equal(moved.solid.x,moved.car[0]);assert.equal(moved.solid.z,moved.car[2]);assert.ok(moved.navigation.solids.some(c=>c.id==='parked-vehicle'));
 check('travelling car and live pedestrian boundary remain synchronised');
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__,v=a.world.traffic.islanders[0];v.hold=true;a.stand(v.g.position.x,v.g.position.y,v.g.position.z,0);a.step(200);});
 const rescued=await status(),cx=Math.max(Math.abs(rescued.player[0]-rescued.car[0])-fixture.width/2,0),cz=Math.max(Math.abs(rescued.player[2]-rescued.car[2])-fixture.length/2,0);
 assert.ok(Math.hypot(cx,cz)>=.27,'an existing overlap must clear to a safe standing point');check('existing overlap recovers without trapping the player');
 assert.deepEqual(report.pageErrors,[]);report.passed=true;
}catch(error){report.failure=error.stack||String(error);if(page)try{await page.screenshot({path:resolve(out,'failure.png')});report.screenshots.push('failure.png');}catch{}throw error;
}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();}
