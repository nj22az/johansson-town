import assert from 'node:assert/strict';
import {resolve} from 'node:path';

/** Real rendered-game checks shared by phone, fresh iPad contexts and desktop. */
export async function checkFerryExploration({page,out,step,settleLoads,touch=true,profile='phone'}){
 const button=selector=>touch?page.locator(selector).tap():page.locator(selector).click();
 const camera=()=>page.evaluate(()=>window.__JOHANSSON_AUDIT__.ferryCamera);
 const saved=await page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__,s={player:a.player,frozen:a.frozen,camera:a.camera??null,view:a.mouse.thirdPerson,fov:a.ferryCamera.fov,zoom:a.ferryCamera.zoom};
  a.activities.close();a.frozen=true;a.camera=null;a.setTime(515);a.world.ferry.parkAt('town');a.world.ferry.update(0,515,0);a.step(50);return s;
 });
 const place=async point=>{
  await page.keyboard.press('Escape');
  return page.evaluate(([X,Y,Z])=>{
   const a=window.__JOHANSSON_AUDIT__;a.step(50);const ship=a.world.ferry.ferry;ship.updateMatrixWorld(true);
   const p=ship.localToWorld(ship.position.clone().set(Y,Z-1.9,X-17.25));a.stand(p.x,p.y,p.z,0);a.step(30);
   return {camera:a.ferryCamera,deck:a.probe(p.x,p.y+1,p.z).deck,view:a.mouse.thirdPerson};
  },point);
 };
 const walk=async ms=>{
  const before=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.ferryCamera.local);
  await page.keyboard.down('w');try{for(let elapsed=0;elapsed<ms;elapsed+=25)await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(25));}finally{await page.keyboard.up('w');}
  const after=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.ferryCamera.local);
  return {before,after,distance:Math.hypot(after[0]-before[0],after[2]-before[2])};
 };
 try{
  const first=await place([11.1,0,.9]);assert.equal(first.camera.active,true);assert.equal(first.camera.mode,'walk');assert.equal(first.camera.id,null);assert.equal(first.view,saved.view);
  await page.waitForFunction(()=>{const s=window.__JOHANSSON_AUDIT__.world.ferry.ferry.userData.engineRoomH1;return s.loaded||s.error;},null,{timeout:60000});await settleLoads();
  const asset=await page.evaluate(()=>{
   const a=window.__JOHANSSON_AUDIT__,s=a.world.ferry.ferry.userData.engineRoomH1,model=s.group.getObjectByName('Minato Maru H1-F1 / Blender CAD');let meshes=0,groupMeshes=0,triangles=0;
   s.group.traverse(o=>{if(o.isMesh)groupMeshes++;});model?.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
   a.renderer.info.reset();a.render();return {loaded:s.loaded,error:s.error,meshes,groupMeshes,triangles,gpuError:a.renderer.getContext().getError(),render:a.renderInfo};
  });
  assert.equal(asset.loaded,true);assert.equal(asset.error,null);assert.equal(asset.meshes,2);assert.equal(asset.groupMeshes,2);assert.equal(asset.triangles,80376);assert.equal(asset.gpuError,0);step('ferry Blender asset and interior rendering',{profile,...asset});
  const movement=await walk(600);assert.ok(movement.distance>.2&&movement.distance<.8,JSON.stringify(movement));await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(500));
  assert.equal((await camera()).mode,'walk');await page.screenshot({path:resolve(out,'ferry-explore-'+profile+'.png')});step('ferry normal movement',{profile,...movement});
  const beforeLook=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.lens.rotation);
  await page.keyboard.down('l');await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(250));await page.keyboard.up('l');await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(250));
  const afterLook=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.lens.rotation);assert.ok(Math.abs(beforeLook[1]-afterLook[1])>.05,'Free looking changes the actual lens');assert.equal((await camera()).mode,'walk');
  const drift=await page.evaluate(()=>{
   const a=window.__JOHANSSON_AUDIT__,ship=a.world.ferry.ferry,poses=[];
   for(let i=0;i<32;i++){a.step(i%2?17:33);poses.push(ship.worldToLocal(ship.position.clone().set(...a.lens.position)).toArray());}
   const first=poses[0];return Math.max(...poses.map(p=>Math.hypot(...p.map((v,i)=>v-first[i]))));
  });assert.ok(drift<.01,'No standing lens jitter relative to the ferry: '+drift);step('ferry free look and standing stability',{profile,driftMetres:drift});
  await place([11.1,0,.9]);await button('#ferryExplore > summary');await button('#ferryExplore [data-precision]');assert.equal((await camera()).precision,true);
  const precise=await walk(600);assert.ok(precise.distance>.05&&precise.distance<.28,JSON.stringify(precise));await button('#ferryExplore [data-precision]');await button('#ferryExplore > summary');step('ferry precision movement',{profile,...precise});
  await place([11.1,0,.9]);const feet=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.ferryCamera.local);
  await page.keyboard.press('o');assert.equal((await camera()).mode,'inspect');await page.keyboard.press('Escape');
  // Turn with the real look keys, then tap a projected, visible piece of the actual machinery.
  await page.keyboard.down('l');
  try{for(let i=0;i<40;i++){await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(25));const yaw=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.mouse.yaw);if(yaw< -1.5)break;}}finally{await page.keyboard.up('l');}
  await page.waitForTimeout(200);
  // In portrait the walking thumb owns the lower-left area. Centre the machine in the open view before tapping.
  for(let i=0;i<12;i++){
   const p=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.ferryInspectPoints.find(p=>p.inView));
   const width=page.viewportSize().width;if(!p||p.x>=width*.49)break;
   await page.keyboard.down('j');await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(25));await page.keyboard.up('j');await page.waitForTimeout(80);
  }
  const points=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.ferryInspectPoints.filter(p=>p.inView&&document.elementFromPoint(p.x,p.y)?.id==='game'));
  assert.ok(points.length,'Visible inspectable machinery is on screen after looking round');
  for(const p of points.slice(0,4)){if(touch)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);if((await camera()).mode==='inspect')break;}
  assert.equal((await camera()).mode,'inspect','Tapping the visible machinery opens inspection');
  const lowerView=await page.evaluate(()=>document.elementFromPoint(innerWidth*.2,innerHeight*.8)?.id);assert.equal(lowerView,'game','The walking thumb zone releases the view during inspection');
  const beforeOrbit=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.lens.position);
  const bounds=await page.locator('#game').boundingBox();assert.ok(bounds);
  await page.mouse.move(bounds.x+bounds.width*.6,bounds.y+bounds.height*.4);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.7,bounds.y+bounds.height*.45,{steps:12});await page.mouse.up();
  await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(200));
  await button('#ferryExplore > summary');await button('#ferryExplore [data-out]');await button('#ferryExplore [data-in]');await button('#ferryExplore > summary');
  const afterOrbit=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.lens.position);assert.ok(Math.hypot(...afterOrbit.map((v,i)=>v-beforeOrbit[i]))>.005,'Inspection actually orbits the machine');
  const inspection=await camera();await page.screenshot({path:resolve(out,'ferry-inspect-'+profile+'.png')});await page.keyboard.press('Escape');await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(20));
  const returned=await camera();assert.equal(returned.mode,'walk');assert.ok(Math.hypot(...returned.local.map((v,i)=>v-feet[i]))<.02,'Inspection returns to the original standing point: '+JSON.stringify({feet,returned:returned.local}));step('ferry machinery orbit zoom and return',{profile,focus:inspection.id});
  await button('#ferryExplore > summary');await button('#ferryExplore [data-guide]');
  await page.waitForFunction(()=>document.querySelector('#ferryExplore [data-map] svg polyline'));await page.screenshot({path:resolve(out,'ferry-map-'+profile+'.png')});
  await button('#ferryExplore [data-guide]');await button('#ferryExplore > summary');
  await page.keyboard.press('v');assert.equal((await camera()).mode,'overview');assert.equal((await camera()).id,'engines-aft');await page.keyboard.press('v');assert.equal((await camera()).id,'engines-fore');
  await button('#ferryExplore > summary');const views=[];
  const ids=['engines-aft','engines-fore','control','aux','workshop','store','electrical','workshop-entry'];
  for(let i=0;i<ids.length;i++){await page.locator('#ferryExplore [data-angle]').selectOption(String(i));await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(20));const s=await camera();assert.equal(s.mode,'overview');assert.equal(s.id,ids[i]);views.push(s.id);}
  await button('#ferryExplore > summary');await page.keyboard.press('Escape');
  const stops=[['engine-room',[13.1,0,.9]],['control-booth',[10.55,-2.8,.9]],['aux-room',[16.7,0,.9]],['workshop',[21,0,.9]],['electrical-workshop',[24,0,.9]]];
  for(const [floor,point]of stops){const s=await place(point);assert.equal(s.camera.mode,'walk',floor);assert.equal(s.camera.id,null,'No automatic cut in '+floor);}
  step('ferry manual views and room transitions',{profile,views,rooms:stops.map(s=>s[0])});
  const frameTimes=await page.evaluate(async()=>{const times=[];await new Promise(resolve=>{let last;const sample=t=>{if(last!==undefined)times.push(t-last);last=t;if(times.length<12)requestAnimationFrame(sample);else resolve();};requestAnimationFrame(sample);});return times;});
  const sorted=frameTimes.slice().sort((a,b)=>a-b);step('ferry frame pacing observation',{profile,hostedSoftwareRendering:true,medianMs:sorted[6],p95Ms:sorted.at(-1),samples:frameTimes,physicalDevice:false});
 }finally{
  const state=await page.evaluate(saved=>{const a=window.__JOHANSSON_AUDIT__;a.camera=null;a.stand(...saved.player.position,saved.player.yaw);a.step(30);const s={camera:a.ferryCamera,view:a.mouse.thirdPerson};a.camera=saved.camera;a.frozen=saved.frozen;return s;},saved);
  assert.equal(state.camera.active,false);assert.equal(state.view,saved.view);assert.ok(Math.abs(state.camera.fov-saved.fov)<.00001);assert.equal(state.camera.zoom,saved.zoom);step('ferry ordinary lens restored',{profile,...state});
 }
}
