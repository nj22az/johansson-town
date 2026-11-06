// Actual compiled Sakura save recovery, rack detour, checkout and exit.
// node tools/sakura-rack-audit.mjs [desktop|phone]
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {serveGame} from './mcp/static-server.mjs';
import {marketVisitsForDay} from '../src/people/market-visits.js';
import {restoreSakura} from '../src/commerce/sakura-economy.js';
import {stockSpec} from '../src/commerce/shop-stock.js';
import {MAGAZINE_RACK} from '../src/world/interiors/sakura-magazine-rack.js';
const rackPosition=[MAGAZINE_RACK.x,0,MAGAZINE_RACK.z],readerPosition=[MAGAZINE_RACK.x,0,MAGAZINE_RACK.z-MAGAZINE_RACK.depth/2-.44];
import {SAVE_KEY} from '../src/save.js';
import {realTownMinutes} from '../src/town-clock.js';
import {residentPlan} from '../src/people/social.js';
import {RESIDENTS} from '../src/people/residents.js';
import {ownedDisplayView} from './owned-display-views.mjs';

const viewport=process.argv[2]||'desktop';assert.ok(['desktop','phone'].includes(viewport));
const day=Math.floor(realTownMinutes()/1440),visits=marketVisitsForDay(day*1440);
assert.ok(visits.Reiko,'This saved-Reiko fixture requires a day with her authored shopping visit');
// A restored unfinished errand may continue outside its original visit window.
// Reiko's current work/sleep/lunch plan still wins; do not force a shop visitor
// during her Front Row shift merely because an older catalogue chose that hour.
const profile=RESIDENTS.find(p=>p.name==='Reiko');
const minute=Array.from({length:660},(_,i)=>540+i).find(m=>residentPlan(profile,day*1440+m,false,{residentLife:{Reiko:{day,shopping:{started:day*1440+m,finished:false}}}}).place==='market');
assert.ok(Number.isFinite(minute),'Reiko has an available time for the restored shop errand');
const start=day*1440+minute,time=`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
const out=new URL('../../output/sakura-rack/',import.meta.url);await mkdir(out,{recursive:true});
const saved={minutes:start,inventory:[],yen:1200,sound:false,sakura:restoreSakura(),residentLocations:{Reiko:{position:[0,0],indoors:'market'}},residentLife:{Reiko:{day,yen:2400,purchases:[],activities:[],shopping:{phase:'browse',started:start,finished:false,item:'pudding',picked:false,paid:false,timer:0,position:rackPosition}}}};
const report={viewport,scenario:'Restored real Reiko embedded in Sakura magazine rack; Johansson remains at its front while she shops.',samples:[],phases:[],errors:[]};
let server,browser,page,closing=false;
const capture=async label=>{await page.evaluate(()=>window.__JOHANSSON_AUDIT__.render());await page.screenshot({path:new URL(`${viewport}-${label}.png`,out).pathname});};
try{
 server=await serveGame(fileURLToPath(new URL('../',import.meta.url)));
 browser=await chromium.launch({headless:true,args:process.platform==='darwin'?['--use-angle=metal']:[]});
 const context=await browser.newContext({viewport:viewport==='phone'?{width:390,height:844}:{width:1280,height:800},timezoneId:Intl.DateTimeFormat().resolvedOptions().timeZone,serviceWorkers:'block'});
 await context.addInitScript(({saved,time,key})=>{localStorage.setItem(key,JSON.stringify({...saved,savedAt:Date.now()}));localStorage.setItem('johansson-town-clock',JSON.stringify({start:time,speed:1}));Object.defineProperty(navigator,'getGamepads',{value:()=>[]});Element.prototype.requestFullscreen=async()=>{};},{saved,time,key:SAVE_KEY});
 page=await context.newPage();page.setDefaultTimeout(120000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});page.on('requestfailed',r=>{if(!closing)report.errors.push(`${r.url()} ${r.failure()?.errorText}`);});
 const url=new URL(server.url);url.searchParams.set('audit','');url.searchParams.set('visual-audit','');
 await page.goto(url.href,{waitUntil:'domcontentloaded'});await page.locator('#enter').click();
 await page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp);
 report.initial=await page.evaluate(async({readerPosition})=>{
  const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.renderFrozen=false;a.teleport(-8,8,0);await a.enter('market');a.teleport(readerPosition[0],readerPosition[2],0);
  a.camera={pos:[-2.8,1.8,1.2],at:[-4.65,.9,2.3]};a.step(0);
  const reiko=a.world.people.find(p=>p.profile.name==='Reiko');
  // Startup can restore a local worker at her real bookshop door before the
  // requested clock is applied. Let the normal schedule walk her to Sakura;
  // neither the customer nor the saved rack position is teleported here.
  let arrivalSeconds=0;
  for(;arrivalSeconds<120&&!reiko.g.userData.inMarket;arrivalSeconds+=.25)a.step(250);
  const game=JSON.parse(window.render_game_to_text());
  return {room:game.room,minutes:game.minutes,day:Math.floor(game.minutes/1440),arrivalSeconds,shopping:a.activities.state.residentLife.Reiko,position:reiko.g.position.toArray(),inside:!!reiko.g.userData.inMarket,clear:a.navigation(reiko.g.position.x,reiko.g.position.z,.35),shop:a.shop,count:a.world.people.length};
 },{readerPosition});
 assert.equal(report.initial.room,'market');assert.equal(report.initial.inside,true);assert.equal(report.initial.clear.staticBlocked,false,'Restored customer stands outside the magazine rack');
 assert.ok(Math.hypot(report.initial.position[0]-rackPosition[0],report.initial.position[2]-rackPosition[2])>.6,'Save recovery does not leave her inside the rack');
 await capture('restored-clear');
 // Controlled art views supplement the genuine MCP walkthrough. They do not move
 // Johansson or the customer and retain the existing lifecycle obstruction.
 report.detailViews=[];
 for(const [label,pos,at] of [
  ['detail-aisles',[0,1.72,2.95],[-.3,.95,-1.3]],
  ['detail-chilled-food',[-4.95,1.48,1.45],[-6.48,1.05,.35]],
  ['detail-checkout',[3.92,1.55,1.02],[4.80,1.16,.75]],
  ['detail-warmer',[4.02,1.43,2.58],[4.80,1.20,1.93]],
  ['detail-staff-supplies',[5.78,1.00,1.20],[6.42,.825,1.60]],
 ]){
  await page.evaluate(({pos,at})=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos,at};a.step(16);},{pos,at});
  await capture(label);report.detailViews.push({label,pos,at});
 }
 for(const [label,kind] of [['detail-lucky-cat','Maneki_neko_Colorful'],['detail-thuan-figurine','thuanFigurine']]){
  const bounds=await page.evaluate(async kind=>{
   const a=window.__JOHANSSON_AUDIT__,{Box3}=await import('./vendor/three.module.js');
   let holder=null;
   a.scene.traverse(node=>{
    if(node.name!==kind||!node.userData.ready)return;
    let visible=true;for(let p=node;p;p=p.parent)if(!p.visible)visible=false;
    if(visible)holder=node;
   });
   if(!holder)throw Error('Loaded visible display missing: '+kind);
   holder.updateWorldMatrix(true,true);const box=new Box3().setFromObject(holder);
   return {min:box.min.toArray(),max:box.max.toArray()};
  },kind);
  const {pos,at}=ownedDisplayView(kind,bounds);
  await page.evaluate(({pos,at})=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos,at};a.step(16);},{pos,at});
  await capture(label);report.detailViews.push({label,kind,bounds,pos,at});
 }
 await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:[-2.8,1.8,1.2],at:[-4.65,.9,2.3]};a.step(0);});
 let complete=false,detoured=false;const phases=new Set();
 for(let tick=0;tick<1200;tick++){
  const sample=await page.evaluate(capacity=>{
   const a=window.__JOHANSSON_AUDIT__,p=a.world.people.find(p=>p.profile.name==='Reiko'),before=p.g.position.clone(),wasInside=!!p.g.userData.inMarket;a.step(250);
   const s=JSON.parse(window.render_game_to_text()),r=a.activities.state.residentLife.Reiko.shopping,inside=!!p.g.userData.inMarket;
   const peers=a.world.people.filter(q=>q!==p&&q.g.userData.inMarket&&q.g.visible);
   const displayed=[];
   a.scene.traverse(mesh=>{
    if(!mesh.isInstancedMesh||!new RegExp('^Sakura '+r.item+' (goods|packaging|clear wrapper)$').test(mesh.name))return;
    let visible=0,sellableVisible=0;const array=mesh.instanceMatrix.array;
    for(let i=0;i<mesh.count;i++){const k=i*16;if(Math.abs(array[k])+Math.abs(array[k+1])+Math.abs(array[k+2])+Math.abs(array[k+4])+Math.abs(array[k+5])+Math.abs(array[k+6])+Math.abs(array[k+8])+Math.abs(array[k+9])+Math.abs(array[k+10])>1e-7){visible++;if(i<capacity)sellableVisible++;}}
    displayed.push({name:mesh.name,visible,sellableVisible,decorativeCount:mesh.count-capacity,extraVisible:visible-sellableVisible});
   });
   return {phase:r.phase,position:p.g.position.toArray(),inside,displacement:wasInside&&inside?p.g.position.distanceTo(before):0,staticBlocked:inside&&a.navigation(p.g.position.x,p.g.position.z,.35).staticBlocked,playerClearance:inside?Math.hypot(p.g.position.x-s.player[0],p.g.position.z-s.player[2]):null,peerClearance:inside&&peers.length?Math.min(...peers.map(q=>p.g.position.distanceTo(q.g.position))):null,player:s.player,picked:r.picked,paid:r.paid,finished:r.finished,item:r.item,sales:a.activities.state.sakura.journal.filter(r=>r.kind==='Sale'&&r.buyer==='Reiko').length,purchases:a.activities.state.residentLife.Reiko.purchases.filter(r=>r.id==='shop-goods').length,stock:a.activities.state.sakura.stock[r.item].shelf,displayed,count:a.world.people.length};
  },stockSpec(saved.residentLife.Reiko.shopping.item).capacity);
  report.samples.push({second:tick/4,...sample});phases.add(sample.phase);
  assert.ok(sample.displacement<=.251,'The actual customer walks without jumping');assert.equal(sample.staticBlocked,false,'Customer clears the actual room fittings');
  if(sample.inside){assert.ok(sample.playerClearance>=.629,'Johansson stays clear of the customer');if(sample.peerClearance!==null)assert.ok(sample.peerClearance>=.699,'Customer clears other actual residents');}
  assert.equal(sample.count,report.initial.count,'No duplicate avatars');assert.deepEqual(sample.player,readerPosition,'Customer finds her own detour around the stationary reader');
  assert.equal(sample.displayed.length,3,'The real pudding stock has body, print and clear-wrapper batches');
  for(const display of sample.displayed){assert.equal(display.sellableVisible,sample.stock,display.name+' follows the same actual shelf claim');assert.equal(display.extraVisible,display.decorativeCount,display.name+' preserves the other flavour display facings');}
  if(!detoured&&sample.phase==='browse'&&sample.position[0]<-4.9){detoured=true;await capture('rack-detour');}
  if(sample.phase==='pickup'&&!report.pickup){report.pickup=sample;await capture('chiller-pickup');}
  if(sample.phase==='queue'&&!report.checkout){report.checkout=sample;await page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.camera={pos:[2.7,1.8,2.8],at:[4.8,.9,.9]};});await capture('checkout');}
  if(sample.finished&&!sample.inside){assert.equal(sample.paid,true);assert.equal(sample.sales,1);assert.equal(sample.purchases,1);assert.equal(sample.stock,stockSpec(sample.item).capacity-1);complete=true;break;}
 }
 report.complete=complete;report.detoured=detoured;report.phases=[...phases];assert.equal(complete,true,'Customer finishes her real visit and walks out');assert.equal(detoured,true);
 for(const phase of ['browse','pickup','queue','paid','finished'])assert.ok(phases.has(phase),'Observed '+phase);
 await capture('completed');assert.deepEqual(report.errors,[],'No browser or asset errors');console.log(`Sakura rack ${viewport}: restored clear, detoured, picked, paid once and left`);
}catch(error){report.failure=error.message;if(page)await capture('failed').catch(()=>{});throw error;}
finally{await writeFile(new URL(`${viewport}-report.json`,out),JSON.stringify(report,null,2)+'\n');closing=true;await browser?.close();await server?.close();}
