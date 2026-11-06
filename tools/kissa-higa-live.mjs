import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
// Kissa Higa in the built running game: town days 4, 6 and 11, Tetsuo at 08:20, Mori at 08:35 and off-watch Ms Uezu.
// The frozen render clock advances through the actual simulation; it does not pose or place the residents for a shot.
// Reports positions, seat keys, foot bones and the closing safety hold. KISSA_CASES can select comma-separated labels.
// The residents walk in because the player is near (people/attention.js); swiftshader in a cloud session. Not a
// physical-device check.
//   node tools/kissa-higa-live.mjs [out-dir] [repo-root]
const out=resolve(process.argv[2]||'docs/qa/kissa-higa/live'),root=resolve(process.argv[3]||'..');
await mkdir(out,{recursive:true});
const port=8790+Math.floor(Math.random()*90);
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',root],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,800));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:960,height:640},serviceWorkers:'block'});
 await context.addInitScript(()=>{try{localStorage.clear();}catch{}Object.defineProperty(navigator,'getGamepads',{value:()=>[]});});
 const page=await context.newPage();page.setDefaultTimeout(900000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(/Kissa Higa/.test(m.text()))errors.push(m.text());});
 await page.goto(`http://127.0.0.1:${port}/johansson-town/?audit&visual-audit`,{waitUntil:'domcontentloaded'});
 await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__,null,{timeout:900000});
 await page.evaluate(()=>{window.__JOHANSSON_AUDIT__.renderFrozen=false;});
 // Who is where: the place, the position, the seat height, and every foot and toe bone's height (the lowest of them is
 // where the shoe meets the floor, or does not).
 const census=place=>page.evaluate(async place=>{
  const a=window.__JOHANSSON_AUDIT__,T=await import('./vendor/three.module.js'),people=[];
  a.scene.traverse(o=>{if(o.userData?.place!==place||!o.visible)return;const p=o.getWorldPosition(new T.Vector3()),bones={};
   o.traverse(b=>{if(b.isBone&&/foot|toe|ankle/i.test(b.name))bones[b.name]=+b.getWorldPosition(new T.Vector3()).y.toFixed(3);});
   const ys=Object.values(bones);
   people.push({name:o.name||o.userData.name||null,activity:o.userData.activity,at:[+p.x.toFixed(2),+p.y.toFixed(3),+p.z.toFixed(2)],seatHeight:o.userData.seatHeight??null,
    seatKey:o.userData.standSeat?.key??null,walking:!!o.userData.walking,yaw:+o.rotation.y.toFixed(4),
    lowestFootBone:ys.length?Math.min(...ys):null,footBones:bones});});
  return people;},place);
 const run=(minutes,steps)=>page.evaluate(({minutes,steps})=>{const a=window.__JOHANSSON_AUDIT__;a.teleport(4.9,8.4,Math.PI/2);a.setTime(minutes);a.step(steps*2500);},{minutes,steps});
 const shots=[['room',{pos:[6.3,1.6,9.2],at:[9.6,.8,7.6]}],['counter',{pos:[8.0,1.35,8.6],at:[10.2,.9,7.3]}],
  ['table',{pos:[7.4,1.5,8.8],at:[7.1,.85,9.7]}]];
 const cases=[];
 for(const [label,day] of [['monday',4],['wednesday',6],['rota-1-monday',11]].filter(([label])=>!process.env.KISSA_CASES||process.env.KISSA_CASES.split(',').includes(label))){
  const base=day*1440;
  // Walk in, rather than start on a seat: Tetsuo before Mori, then the 08:30 handover and five minutes to settle.
  await run(base+8*60,24);await run(base+8*60+19,24);
  await page.waitForFunction(()=>window.__JOHANSSON_AUDIT__.scene.getObjectByName('Kissa Higa models')?.children.length===4);
  const before=await census('kissa-higa');
  await writeFile(`${out}/${label}-before.json`,JSON.stringify(before,null,2)+'\n');
  await writeFile(`${out}/${label}-controllers.json`,JSON.stringify(await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;return {clock:window.render_game_to_text(),people:a.world.people.map(p=>({name:p.profile?.name,position:p.g.position.toArray(),visible:p.g.visible,place:p.g.userData.place,seat:p.g.userData.standSeat,indoors:p.g.userData.indoors,activity:p.g.userData.activity}))};}),null,2)+'\n');
  const photograph=async suffix=>{for(const [kind,view] of shots){
   const name=`${label}-${suffix}-${kind}`;
   await page.evaluate(v=>{const a=window.__JOHANSSON_AUDIT__;a.camera=v;a.hud?.photo?.(true);a.render();if(a.johansson?.root)a.johansson.root.visible=false;a.render();},view);
   await page.locator('canvas').first().screenshot({path:`${out}/${name}.jpg`,type:'jpeg',quality:92});console.log('wrote',name);
  }};
  await photograph('0820');
  assert.equal(before.find(p=>p.name==='Tetsuo')?.seatKey,'kissa-stool-2',label+': Tetsuo before Mori');
  await run(base+8*60+34,24);
  const morning=await census('kissa-higa');
  await writeFile(`${out}/${label}-0835.json`,JSON.stringify(morning,null,2)+'\n');
  assert.equal(morning.find(p=>p.name==='Officer Mori')?.seatKey,'kissa-stool-2',label+': Mori at 08:35');
  assert.ok(!morning.some(p=>p.name==='Tetsuo'&&p.seatKey),'Tetsuo has given up the seat');
  if(day===11)assert.equal(morning.find(p=>p.name==='Ms Uezu')?.seatKey,'kissa-chair-1','off-watch Ms Uezu');
  await photograph('0835');cases.push({label,day,beforeTime:'08:20',before,time:'08:35',morning});
 }
 // A customer still inside after closing: she waits outside; both the visible shutter and its collider stay up.
 await run(11*1440+579,48);
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.teleport(8,8.4);a.setTime(11*1440+591);a.step(60000);});
 const closingHeld=await census('kissa-higa');
 const safety=await page.evaluate(()=>{const h=window.__JOHANSSON_AUDIT__.world.quarters.higa;return {held:h.closingHeld,shutterVisible:h.shutter.visible,shutterMinY:h.shutterSolid.minY,doorMinY:h.doorSolid.minY};});
 assert.ok(safety.held&&!safety.shutterVisible&&safety.shutterMinY>100&&safety.doorMinY>100,'an occupant has a visible, collidable way out');
 assert.ok(closingHeld.some(p=>p.name==='Grandmother Higa'),'she waits to finish closing');
 const closeShot=async name=>{await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:[1.4,1.7,8.6],at:[8.6,1.2,8.2]};a.hud.photo(true);if(a.johansson?.root)a.johansson.root.visible=false;a.render();});await page.locator('canvas').first().screenshot({path:`${out}/${name}.jpg`,type:'jpeg',quality:92});};
 await closeShot('closing-held-0952');
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.teleport(4.9,8.4);a.setTime(11*1440+593);a.step(1000);a.setTime(11*1440+597);a.step(1000);});
 await closeShot('closing-clear-0957');
 assert.equal(await page.evaluate(()=>window.__JOHANSSON_AUDIT__.world.quarters.higa.closingHeld),false,'she finishes after the customer leaves');
 // The baseline: the bench out front at 19:41, Tetsuo on the town's existing 0.44 m bench, measured the same way.
 // Mac's attendance follows his rota; this case does not require him to occupy his 0.31 m crate.
 await run(11*1440+19*60+40,24);
 const evening=await census('higa-bench');
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:[3.0,.9,11.6],at:[5.0,.4,9.8]};a.render();});
 await page.locator('canvas').first().screenshot({path:`${out}/05-live-bench-baseline-1941.jpg`,type:'jpeg',quality:86});
 const report={time:'Exact frozen-clock captures; residents advanced by the running game simulation',viewport:[960,640],physicalDevice:false,cases,closing:{safety,keeper:closingHeld},evening,errors};
 await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({cases,evening},null,1));
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();server.kill();}
