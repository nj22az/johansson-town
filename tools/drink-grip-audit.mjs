// Controlled render fixtures; the actual compiled shed is checked separately below.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const base=process.argv[2]||'http://127.0.0.1:8769/johansson-town/',shedOnly=process.argv.includes('--shed-only'),out=resolve('../output/playwright/drink-grip'+(shedOnly?'/shed-final':''));await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:process.platform==='darwin'?['--use-angle=metal']:[]});
const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'}),page=await context.newPage(),report={mode:shedOnly?'compiled-shed':'whole-cast-and-shed',groups:[],drinks:[],errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
try{
 await page.goto(base+'tools/drink-grip-preview.html');await page.waitForFunction(()=>window.__READY__);const names=await page.evaluate(()=>allDrinkCharacters);
 if(!shedOnly){
 for(let i=0;i<names.length;i+=5){const group=names.slice(i,i+5),id=String(i/5).padStart(2,'0');await page.goto(base+'tools/drink-grip-preview.html?who='+encodeURIComponent(group.join(',')));await page.waitForFunction(()=>window.__READY__);
  for(const [label,phase] of [['hold',0],['sip',1.2],['lower',2.4]]){await page.evaluate(t=>setPhase(t),phase);await page.screenshot({path:resolve(out,`cast-${id}-${label}.png`)});}report.groups.push({names:group,state:JSON.parse(await page.evaluate(()=>render_game_to_text()))});
 }
 for(const kind of ['draft','bottle','can','coffee','sake','oolong','mugicha','awamori']){await page.goto(base+'tools/drink-grip-preview.html?who='+encodeURIComponent('Mr Fujita,Mrs Sato,Johansson')+'&drink='+kind);await page.waitForFunction(()=>window.__READY__);await page.screenshot({path:resolve(out,`vessel-${kind}.png`)});report.drinks.push(kind);}
 await page.goto(base+'tools/drink-grip-preview.html?custom=1');await page.waitForFunction(()=>window.__READY__);await page.evaluate(()=>setPhase(1.2));await page.screenshot({path:resolve(out,'custom-small-rounded-sip.png')});await page.evaluate(()=>setPhase(2.4));await page.screenshot({path:resolve(out,'custom-small-rounded-lower.png')});
 }
 await page.setViewportSize({width:620,height:720});await page.goto(base+'?audit&cinematic=off&visual-audit');await page.locator('#enter').click();await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp,{timeout:90000});
 report.compiled=await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.setTime(720);const s=a.world.portShed,actor=s.actor,p=actor.entity.getWorldPosition(actor.entity.position.clone());a.teleport(p.x+3,p.z+2);a.step(1000);return {source:actor.avatar.recipe.name,position:p.toArray(),held:actor.heldKind,compiled:performance.getEntriesByType('resource').map(e=>e.name).find(x=>/game-[^/]+\.js/.test(x))};});
 for(const [label,phase] of [['hold',0],['sip',1.2],['lower',2.4]]){
  await page.evaluate(t=>{const a=window.__JOHANSSON_AUDIT__,actor=a.world.portShed.actor,v=actor.avatar.bones.head.getWorldPosition(actor.entity.position.clone()),front=actor.avatar.root.getWorldDirection(actor.entity.position.clone());actor.entity.userData.consumeElapsed=t;a.step(600);const at=actor.avatar.bones.head.getWorldPosition(v.clone());at.y-=.24;const pos=at.clone().addScaledVector(front,1.65);pos.y+=.18;a.camera={pos:pos.toArray(),at:at.toArray()};a.render();},phase);
  await page.screenshot({path:resolve(out,`compiled-fujita-${label}.png`)});
 }
 report.characterCount=names.length;report.complete=true;await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(report.errors.length)process.exitCode=1;
}finally{await browser.close();}
