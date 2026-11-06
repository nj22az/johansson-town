// Compiled-game seating audit. Placement and camera framing are controlled fixtures;
// sitting, standing and walking exercise the running game's normal interaction/input.
// node tools/seating-audit.mjs --url http://127.0.0.1:8778/johansson-town/ --mode baseline
// node tools/seating-audit.mjs --url http://127.0.0.1:8778/johansson-town/ --rooms all
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const mode=option('--mode','all'),viewport=option('--viewport','phone'),labelFilter=option('--labels','');
const chosen=markers=>labelFilter?markers.filter(m=>new RegExp(labelFilter,'i').test(m.label)):markers;
assert.ok(['all','baseline','outdoors','rooms'].includes(mode));
assert.ok(['phone','phone-landscape','desktop'].includes(viewport));const phone=viewport.startsWith('phone');
const url=new URL(option('--url','http://127.0.0.1:8778/johansson-town/'));
url.searchParams.set('audit','');url.searchParams.set('spawn','park-bench');url.searchParams.set('cinematic','off');
const out=resolve(option('--output',`../output/playwright/seating-${mode}`));await mkdir(out,{recursive:true});
const report={url:url.href,mode,viewport,label:option('--label','snapshot'),labelFilter,method:'Controlled stand-point placement and camera; real context interaction, normal seat action callback, HUD/menu stand and keyboard walking.',seats:[],rooms:[],errors:[]};
let page,browser,closing=false;
const checkpoint=async()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');

async function enumerate(){
 return page.evaluate(()=>{
  const a=window.__JOHANSSON_AUDIT__,inside=!!a.roomNavigation,base=inside?a.room:a.world.group,markers=[];
  base.updateMatrixWorld(true);base.traverse(o=>{
   const s=o.userData.seat,h=o.userData.hit;if(!s||!h||!!h.inside!==inside)return;
   for(let p=o;p;p=p.parent)if(!p.visible)return;
   // Office task anchors describe a worker's seat but open records, not a visitor seat.
   if(o.userData.officeTask)return;
   markers.push(o);
  });
  window.__SEATING_AUDIT_MARKERS__=markers;
  return markers.map((o,index)=>({index,label:o.userData.hit.label,name:o.name,seat:JSON.parse(JSON.stringify(o.userData.seat)),reservedBy:o.userData.reservedBy||null}));
 });
}

async function pose(name=null){
 return page.evaluate(async name=>{
  const a=window.__JOHANSSON_AUDIT__,T=await import('/johansson-town/vendor/three.module.js'),person=name?a.world.people.find(p=>p.profile.name===name):null,actor=person?.g.userData.character;
  const j=actor?{root:person.g,avatar:actor.avatar,outfit:actor.outfit}:a.johansson,av=j.avatar,u=person?.g.userData;
  a.scene.updateMatrixWorld(true);const bones=Object.fromEntries(['hips','thighL','thighR','kneeL','kneeR','footL','footR'].map(n=>[n,av.bones[n]?{position:av.bones[n].getWorldPosition(new T.Vector3()).toArray(),rotation:av.bones[n].rotation.toArray().slice(0,3)}:null]));
  const ranges={thigh:{min:Infinity,max:-Infinity,count:0},support:{min:Infinity,max:-Infinity,count:0},feet:{min:Infinity,max:-Infinity,count:0}},inverse=new T.Matrix4().copy(j.root.matrixWorld).invert();
  av.root.traverse(body=>{
   if(!body.isSkinnedMesh||!body.visible||body.name.includes('outline'))return;
   const {position,skinIndex,skinWeight}=body.geometry.attributes;if(!skinIndex)return;
   const names=body.skeleton.bones.map(b=>b.name);
   for(let i=0;i<position.count;i++){
    const weights={thigh:0,feet:0};for(let k=0;k<4;k++){const n=names[skinIndex.getComponent(i,k)],w=skinWeight.getComponent(i,k);if(['hips','thighL','thighR'].includes(n))weights.thigh+=w;if(['footL','footR'].includes(n))weights.feet+=w;}
    for(const key of ['thigh','feet'])if(weights[key]>.99){const p=new T.Vector3().fromBufferAttribute(position,i);body.applyBoneTransform(i,p);body.localToWorld(p);const r=ranges[key];r.min=Math.min(r.min,p.y);r.max=Math.max(r.max,p.y);r.count++;if(key==='thigh'){const local=p.clone().applyMatrix4(inverse);if(Math.abs(local.x)<av.measure.width*.6&&Math.abs(local.z)<av.measure.thigh*.5){const s=ranges.support;s.min=Math.min(s.min,p.y);s.max=Math.max(s.max,p.y);s.count++;}}}
   }
  });
  for(const r of Object.values(ranges))if(!r.count){r.min=null;r.max=null;}
  return {name:name||'Johansson',seated:person?Number.isFinite(u.seatHeight):a.seated,activity:u?{pose:u.socialPose,seatHeight:u.seatHeight,floorHeight:u.floorHeight,chairBlend:u.chairBlend,staffBenchPhase:u.staffBenchPhase}:null,game:JSON.parse(window.render_game_to_text()),root:j.root.position.toArray(),measure:av.measure,sitHip:j.sitHip,bones,ranges,fit:person?{surfaceY:person.g.getWorldPosition(new T.Vector3()).y+(u.seatHeight||0)}:a.seat||null,outfit:j.outfit};
 },name);
}

async function residents(){
 const names=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.world.people.filter(p=>{
  if(!Number.isFinite(p.g.userData.seatHeight)||p.g.userData.inVehicle||p.g.userData.playerControlled||!p.g.userData.character?.avatar)return false;
  for(let o=p.g;o;o=o.parent)if(!o.visible)return false;return true;
 }).map(p=>p.profile.name));
 const samples=[];for(const name of names){const s=await pose(name);s.supportGap=s.ranges.support.count?s.ranges.support.min-s.fit.surfaceY:null;samples.push(s);}return samples;
}

async function capture(label,spec,{side=false}={}){
 await page.evaluate(async({spec,side})=>{
  const a=window.__JOHANSSON_AUDIT__,T=await import('/johansson-town/vendor/three.module.js'),p=a.johansson.root.position,yaw=spec.yaw||0;let d=2.65;
  // Shimanchu faces -z in the seat frame. Frame from the seat's front, clear of its backrest.
  let dx=side?Math.cos(yaw): -Math.sin(yaw),dz=side?-Math.sin(yaw):-Math.cos(yaw);
  const b=a.roomNavigation?.bounds,clear=(x,z)=>!b||(x>b.minX+.15&&x<b.maxX-.15&&z>b.minZ+.15&&z<b.maxZ-.15);
  if(b&&!clear(p.x+dx*d,p.z+dz*d)){
   const options=[[Math.cos(yaw),-Math.sin(yaw)],[-Math.cos(yaw),Math.sin(yaw)],[-Math.sin(yaw)*.7+Math.cos(yaw)*.7,-Math.cos(yaw)*.7-Math.sin(yaw)*.7]];
   const alternative=options.find(([x,z])=>clear(p.x+x*d,p.z+z*d));if(alternative)[dx,dz]=alternative;else while(d>.75&&!clear(p.x+dx*d,p.z+dz*d))d-=.15;
  }
  {
   const base=b?a.room:a.world.group;base.updateMatrixWorld(true);const surfaces=[];base.traverse(o=>{if(o.isMesh)surfaces.push(o);});const av=a.johansson.avatar,head=av.bones.head.getWorldPosition(new T.Vector3()),knees=av.bones.kneeL.getWorldPosition(new T.Vector3()).add(av.bones.kneeR.getWorldPosition(new T.Vector3())).multiplyScalar(.5),feet=av.bones.footL.getWorldPosition(new T.Vector3()).add(av.bones.footR.getWorldPosition(new T.Vector3())).multiplyScalar(.5),ray=new T.Raycaster();
   const unobstructed=(x,z)=>{const from=new T.Vector3(x,spec.position[1]+1.2,z);return [head,knees,feet].every(target=>{const direction=target.clone().sub(from);ray.set(from,direction.normalize());ray.far=from.distanceTo(target)-.08;return !ray.intersectObjects(surfaces,false).some(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible||o===a.johansson.root||o.userData.character)return false;const m=Array.isArray(h.object.material)?h.object.material[h.face?.materialIndex||0]:h.object.material;return m&&(!m.transparent||m.opacity>.9);});});};
   if(!unobstructed(p.x+dx*d,p.z+dz*d)){
    let found=false;const angle=Math.atan2(dx,dz);
    for(const distance of [2.65,2,1.4,1,.8]){for(const turn of [0,.6,-.6,1.2,-1.2,Math.PI/2,-Math.PI/2,Math.PI]){const x=Math.sin(angle+turn),z=Math.cos(angle+turn);if(clear(p.x+x*distance,p.z+z*distance)&&unobstructed(p.x+x*distance,p.z+z*distance)){dx=x;dz=z;d=distance;found=true;break;}}if(found)break;}
   }
  }
  a.camera={pos:[p.x+dx*d,spec.position[1]+1.2,p.z+dz*d],at:[p.x,spec.position[1]+.82,p.z]};
  a.johansson.root.visible=true;a.render();
 },{spec,side});
 const path=resolve(out,`${viewport}-${label}${side?'-side':''}.png`);await page.screenshot({path});return path;
}

async function seat(marker,room){
 const row={room:room||null,...marker,interaction:null};report.seats.push(row);
 row.occupant=await page.evaluate(index=>{
  const a=window.__JOHANSSON_AUDIT__,o=window.__SEATING_AUDIT_MARKERS__[index],s=o.userData.seat;
  for(const p of a.world.people){const u=p.g.userData;if(!Number.isFinite(u.seatHeight)||u.inVehicle||u.playerControlled)continue;let visible=true;for(let parent=p.g;parent;parent=parent.parent)if(!parent.visible)visible=false;if(!visible)continue;const q=p.g.getWorldPosition(o.position.clone());if(Math.hypot(q.x-s.position[0],q.z-s.position[2])<.4)return p.profile.name;}return null;
 },marker.index);
 if(row.occupant){row.occupied=true;row.occupantPose=await pose(row.occupant);row.occupantSupportGap=row.occupantPose.ranges.support.min-row.occupantPose.fit.surfaceY;console.log(`OCCUPIED ${room||'outdoors'}: ${marker.label} #${marker.index} (${row.occupant})`);await checkpoint();return;}
 // The fixture selects an authored clear stand point; no actor pose or furniture is edited.
 row.approach=await page.evaluate(index=>{
  const a=window.__JOHANSSON_AUDIT__,o=window.__SEATING_AUDIT_MARKERS__[index],s=o.userData.seat;
  a.activities.close();a.camera=null;const q=o.getWorldPosition(o.position.clone()),stand=s.stand||[s.position[0],s.position[1],s.position[2]+.9];
  const yaw=Math.atan2(-(q.x-stand[0]),-(q.z-stand[2]));a.teleport(stand[0],stand[2],yaw);a.step(30);a.step(0);
  const authored={active:a.active,stand,yaw,navigation:a.navigation(stand[0],stand[2])};
  if(a.active!==o.userData.hit.label){
   for(const [dx,dz] of [[.2,0],[-.2,0],[0,.2],[0,-.2],[.35,.2],[-.35,.2],[.35,-.2],[-.35,-.2]]){
    const x=stand[0]+dx,z=stand[2]+dz,n=a.navigation(x,z);if(n.staticBlocked||n.residentBlocked)continue;
    const facing=Math.atan2(-(q.x-x),-(q.z-z));a.teleport(x,z,facing);a.step(30);a.step(0);
    if(a.active===o.userData.hit.label)return {active:a.active,stand:[x,n.y,z],yaw:facing,navigation:n,authored};
   }
   a.teleport(stand[0],stand[2],yaw);a.step(30);a.step(0);
  }
  return authored;
 },marker.index);
 if(row.approach.active===marker.label){
  row.interaction=phone?'normal touch context button':'normal keyboard context interaction';if(phone)await page.locator('#act').click();else await page.keyboard.press('KeyE');
 }else{
  // Nearby desks/goods can win the view-based selector. A unique action label still
  // runs the same registered callback; duplicates must be targeted by actual context.
  const duplicate=await page.evaluate(label=>window.__SEATING_AUDIT_MARKERS__.filter(o=>o.userData.hit.label===label).length>1,marker.label);
  if(duplicate){row.failure=`Context selected ${row.approach.active||'nothing'} instead of duplicate seat ${marker.label}`;await checkpoint();return;}
  row.interaction='registered action callback (audit.use)';await page.evaluate(label=>window.__JOHANSSON_AUDIT__.use(label),marker.label);
 }
 await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(1200));row.pose=await pose();
 if(!row.pose.seated){row.subtitle=await page.locator('#subtitle').innerText();if(/occupied|already sitting/i.test(row.subtitle)){row.occupied=true;console.log(`OCCUPIED ${room||'outdoors'}: ${marker.label} #${marker.index}`);}else row.failure='Seat action did not seat the player';await checkpoint();return;}
 row.seatDistance=Math.hypot(row.pose.game.player[0]-marker.seat.position[0],row.pose.game.player[2]-marker.seat.position[2]);
 if(row.seatDistance>.55)row.failure='Interaction chose another seat';
 const height=row.pose.fit?.surfaceY??marker.seat.surfaceY;
 if(Number.isFinite(height)&&row.pose.ranges.support.count){row.supportGap=row.pose.ranges.support.min-height;if(Math.abs(row.supportGap)>.015)row.failure='Rendered clothing does not meet the seat surface';}
 if(row.pose.fit&&row.pose.game.seat){row.textSupportGap=row.pose.ranges.support.min-row.pose.game.seat.surfaceY;if(Math.abs(row.textSupportGap)>.015)row.failure='Rendered body differs from the seat support serialized by render_game_to_text';}
 row.controls=await page.evaluate(()=>[...document.querySelectorAll('#contextActions button,#act')].filter(b=>{const s=getComputedStyle(b),r=b.getBoundingClientRect();return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'&&!b.classList.contains('control-off')&&!b.classList.contains('hidden');}).map(b=>({id:b.id,text:b.textContent.trim(),label:b.getAttribute('aria-label')})));
 const representative=/watch the town|look at Sakura|staff bench|reading chair|visitor desk|mayor|spare desk|massage|tatami|changing-room|indoor bath|rock bath|wash|stool/i.test(marker.label)||marker.index===0;
 if(representative){row.screenshot=await capture(`${room||'outside'}-${marker.index}`,marker.seat);if(/watch the town|look at Sakura|staff bench|changing-room bench/.test(marker.label))row.sideScreenshot=await capture(`${room||'outside'}-${marker.index}`,marker.seat,{side:true});}
 // Normal E/context action shows the ramen/bar table menu; choose its actual Stand button.
 const primaryStand=page.locator('#standButton');
 if(await primaryStand.isVisible()){await primaryStand.click();row.standMethod='universal Stand button';}
 else if(phone){await page.locator('#act').click();row.standMethod='legacy context button';}
 else{await page.keyboard.press('KeyE');row.standMethod='normal keyboard context interaction';}
 const standButton=page.getByRole('button',{name:'Stand up',exact:true});
 if(await standButton.isVisible())await standButton.click();
 row.standing=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.step(500);const state=JSON.parse(window.render_game_to_text());return {seated:a.seated,player:state.player,navigation:a.navigation(state.player[0],state.player[2])};});
 row.standing.feet=(await pose()).ranges.feet;
 if(row.standing.feet.count)row.standing.soleGap=row.standing.feet.min-row.standing.navigation.y;
 if(row.standing.seated)row.failure='Could not stand through the real context/menu action';
 if(row.standing.soleGap<-.01)row.failure='Standing shoes penetrate the floor';
 // Walk away from the chair using actual keyboard input, after preserving the stand position.
 await page.evaluate(()=>{window.__JOHANSSON_AUDIT__.camera=null;});
 await page.keyboard.down('KeyW');await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(800));await page.keyboard.up('KeyW');
 row.walk=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.step(0);const s=JSON.parse(window.render_game_to_text());return {seated:a.seated,player:s.player,navigation:a.navigation(s.player[0],s.player[2])};});
 row.walk.distance=Math.hypot(row.walk.player[0]-row.standing.player[0],row.walk.player[2]-row.standing.player[2]);
 row.walk.attempts=[{key:'KeyW',distance:row.walk.distance,player:row.walk.player}];
 if(row.walk.distance<.15){
  for(const key of ['KeyA','KeyD','KeyS']){
   await page.keyboard.down(key);await page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(800));await page.keyboard.up(key);
   const next=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.step(0);const s=JSON.parse(window.render_game_to_text());return {seated:a.seated,player:s.player,navigation:a.navigation(s.player[0],s.player[2])};});
   next.distance=Math.hypot(next.player[0]-row.standing.player[0],next.player[2]-row.standing.player[2]);next.attempts=[...row.walk.attempts,{key,distance:next.distance,player:next.player}];row.walk=next;if(next.distance>=.15)break;
  }
 }
 if(row.standing.navigation.staticBlocked)row.failure='Stand position remains inside furniture';
 if(row.walk.distance<.15)row.failure='Player cannot walk clear of the stand point in any cardinal direction';
 console.log(`${row.failure?'FAIL':'PASS'} ${room||'outdoors'}: ${marker.label} #${marker.index}; walked ${row.walk.distance.toFixed(2)} m`);await checkpoint();
}

try{
 browser=await chromium.launch({headless:!args.includes('--headed'),args:process.platform==='darwin'?['--use-angle=metal']:[]});
 const context=await browser.newContext({viewport:viewport==='phone'?{width:390,height:844}:viewport==='phone-landscape'?{width:844,height:390}:{width:1280,height:800},hasTouch:phone,deviceScaleFactor:1,timezoneId:'Europe/Stockholm',serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));Object.defineProperty(navigator,'getGamepads',{value:()=>[]});Element.prototype.requestFullscreen=async()=>{};});
 page=await context.newPage();page.setDefaultTimeout(120000);
 page.on('pageerror',e=>report.errors.push({type:'page',message:e.message}));page.on('console',m=>{if(m.type()==='error')report.errors.push({type:'console',message:m.text()});});
 page.on('response',r=>{if(r.status()>=400)report.errors.push({type:'http',message:`${r.status()} ${r.url()}`});});page.on('requestfailed',r=>{if(!closing)report.errors.push({type:'request',message:`${r.url()}: ${r.failure()?.errorText}`});});
 await page.goto(url.href,{waitUntil:'domcontentloaded'});await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.renderFrozen=false;const s=JSON.parse(window.render_game_to_text());a.setTime(Math.floor(s.minutes/1440)*1440+720);a.step(1500);});
 report.runtime=await page.evaluate(()=>({version:window.__JOHANSSON_RUNTIME_VERSION__,stability:window.__JOHANSSON_STABILITY__,blocked:window.__JOHANSSON_AUDIT__.blocked,parkBenchSource:window.__JOHANSSON_AUDIT__.world.park?.benchSource}));
 const outside=chosen(await enumerate());report.outdoorCount=outside.length;console.log(`Ready: ${outside.length} outdoor seats`);
 if(mode==='baseline'){
  const park=outside.find(s=>s.label==='Sit and watch the town and harbour');assert.ok(park);
  report.baseline={seat:park,pose:await pose(),screenshot:await capture('harbour-park-front',park.seat),sideScreenshot:await capture('harbour-park',park.seat,{side:true})};
 }else{
  if(mode!=='rooms'){for(const marker of outside)await seat(marker,null);report.outdoorResidents=await residents();}
  if(mode!=='outdoors'){
   const selected=option('--rooms','all');
   const sites=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;return [...a.sites,...(a.world.landmarks||[]).filter(s=>['warehouse','ferry-terminal'].includes(s.id)).map(s=>({id:s.id,title:s.title}))].filter((s,i,list)=>list.findIndex(q=>q.id===s.id)===i);});
   const rooms=selected==='all'?[...new Set([...sites.map(s=>s.id),'naha-airport-arrivals'])]:selected.split(',');
   for(const id of rooms){
    const entry={id};report.rooms.push(entry);console.log(`Entering ${id}`);
    entry.method=await page.evaluate(async id=>{
     const a=window.__JOHANSSON_AUDIT__;a.activities.close();if(a.roomNavigation)a.leave();a.camera=null;const state=JSON.parse(window.render_game_to_text()),m=id==='izakaya'?1080:720;a.setTime(Math.floor(state.minutes/1440)*1440+m);await a.enter(id);
     let method='audit.enter';if(a.roomNavigation?.id!==id){const site=a.world.landmarks?.find(s=>s.id===id);if(site){let marker=null;a.world.group.traverse(o=>{if(o.userData.hit?.label==='Enter '+site.title)marker=o;});if(marker){const door=site.door||[site.x,0,site.z];a.teleport(door[0],door[2]);await marker.userData.hit.fn();method='registered landmark door callback';}}}a.step(500);return method;
    },id);
    entry.actual=await page.evaluate(()=>JSON.parse(window.render_game_to_text()).room);if(entry.actual!==id){entry.skipped='Unavailable room';await checkpoint();continue;}
    await page.waitForFunction(()=>!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
    if(id==='onsen'){
     // Pay through the real bandai dialog; every bath/washing seat shares that entry.
     await page.evaluate(()=>window.__JOHANSSON_AUDIT__.use('Pay at the bandai · ¥300'));
     const pay=page.getByRole('button',{name:'Pay ¥300',exact:true});if(await pay.isVisible())await pay.click();
     await page.evaluate(()=>window.__JOHANSSON_AUDIT__.activities.close());
     entry.paid=await page.evaluate(()=>window.__JOHANSSON_AUDIT__.activities.onsenPaid());
    }
    const markers=chosen(await enumerate());entry.count=markers.length;for(const marker of markers)await seat(marker,id);entry.residents=await residents();
    if(id==='izakaya'){
     const occupied=report.seats.filter(s=>s.room===id&&s.occupied);
     if(occupied.length){
      await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.activities.close();a.camera=null;const s=JSON.parse(window.render_game_to_text());a.setTime(Math.floor(s.minutes/1440)*1440+760);a.step(15000);});
      entry.occupiedRetests=[];for(const s of occupied){await seat(markers.find(m=>m.index===s.index),id);const retest=report.seats.at(-1);retest.releasedRetest=true;entry.occupiedRetests.push({index:s.index,occupied:!!retest.occupied,seated:!!retest.pose?.seated,failure:retest.failure||null});}
     }
    }
    await checkpoint();
   }
  }
 }
 report.failures=report.seats.filter(r=>r.failure).map(r=>({room:r.room,label:r.label,index:r.index,message:r.failure}));
 report.summary={uniqueSeatTargets:report.outdoorCount+report.rooms.reduce((n,r)=>n+(r.count||0),0),successfulInteractions:report.seats.filter(r=>r.pose?.seated).length,occupiedObservations:report.seats.filter(r=>r.occupied).length,callbackFixtures:report.seats.filter(r=>r.interaction?.includes('callback')).length};
 report.complete=true;await checkpoint();console.log(JSON.stringify({seats:report.seats.length,failures:report.failures,errors:report.errors,out}));
 if(args.includes('--strict')){assert.deepEqual(report.failures,[]);assert.deepEqual(report.errors,[]);}
}catch(error){report.failure=error.message;await checkpoint();throw error;}
finally{closing=true;await browser?.close();}
