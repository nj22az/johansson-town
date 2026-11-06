// Controlled compiled-game pose fixture; separate from normal MCP walking evidence.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=new URL('../../output/avatar-floor/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:800},serviceWorkers:'block'});page.setDefaultTimeout(240000);
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('johansson-town-clock',JSON.stringify({start:'12:00',speed:1}));Object.defineProperty(navigator,'getGamepads',{value:()=>[]});Element.prototype.requestFullscreen=async()=>{};});
 await page.goto('http://127.0.0.1:8767/johansson-town/?audit&spawn=sakura-bench&cinematic=off');await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 const report=await page.evaluate(async()=>{
  const a=window.__JOHANSSON_AUDIT__,T=await import('/johansson-town/vendor/three.module.js');a.frozen=true;a.renderFrozen=false;await a.enter('market');a.step(50);
  const g=a.world.people.find(p=>p.profile.name==='Thuan').g,body=g.children.find(o=>o.name.startsWith('Shimanchu')).children.find(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'));
  const feet=['footL','footR'].map(n=>body.skeleton.bones.findIndex(b=>b.name===n)),{position,skinIndex,skinWeight}=body.geometry.attributes,indices=[];
  for(let i=0;i<position.count;i++)if(feet.includes(skinIndex.getX(i))&&skinWeight.getX(i)>.999)indices.push(i);
  if(indices.length<20)throw Error('Missing live Thuan foot samples');
  const sole=()=>{g.updateMatrixWorld(true);let y=Infinity;for(const i of indices){const p=new T.Vector3().fromBufferAttribute(position,i);body.applyBoneTransform(i,p);body.localToWorld(p);y=Math.min(y,p.y);}return y;};
  a.room.updateMatrixWorld(true);const ray=new T.Raycaster(new T.Vector3(g.position.x,.8,g.position.z),new T.Vector3(0,-1,0));
  const support=ray.intersectObject(a.room,true).find(h=>h.object.name==='sakura-floor');
  if(!support)throw Error('No drawn Sakura floor beneath Thuan');
  const before=sole(),floor=support.point.y;g.userData.chat={greeting:true,speaking:false};g.userData.playerConversation=true;
  let lowest=Infinity,highest=-Infinity,waved=false;for(let i=0;i<120;i++){a.step(1000/60);const y=sole();lowest=Math.min(lowest,y);highest=Math.max(highest,y);waved||=!!window.__JOHANSSON_CAST__.takes.find(t=>t.name==='Thuan')?.gesture;}
  g.userData.chat={greeting:true,speaking:false};a.step(350);
  a.camera={pos:[g.position.x+.15,.95,g.position.z+1.8],at:[g.position.x,.7,g.position.z]};a.render();
  window.__FLOOR_BOW_CAPTURE__=()=>{a.johansson.play('Bow');let angle=0;for(let i=0;i<90;i++){a.step(1000/60);const b=a.johansson.avatar.bones;angle=Math.max(angle,b.chest.rotation.x+b.spine.rotation.x);}a.johansson.play('Bow');a.step(700);const p=a.johansson.root.position;a.camera={pos:[p.x+1.2,.9,p.z+.8],at:[p.x,.7,p.z]};a.johansson.root.visible=true;a.render();return angle;};
  return {before,floor,lowest,highest,waved,support:support.object.name,staffPosition:g.position.toArray()};
 });
 assert.ok(report.waved);assert.ok(Math.abs(report.lowest-report.floor)<1e-4);assert.ok(Math.abs(report.highest-report.floor)<1e-4);
 await page.screenshot({path:new URL('thuan-wave.png',out).pathname});
 report.johanssonAngle=await page.evaluate(()=>window.__FLOOR_BOW_CAPTURE__());assert.ok(report.johanssonAngle>.1&&report.johanssonAngle<.3);
 await page.screenshot({path:new URL('johansson-greeting.png',out).pathname});assert.deepEqual(errors,[]);
 await writeFile(new URL('report.json',out),JSON.stringify({...report,errors},null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
