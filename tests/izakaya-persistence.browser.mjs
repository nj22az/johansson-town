// Persistence through actual room controls, normal save UI and a page reload.
// No player/actor placement, activity invocation or game-state fixture writes.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {TownAuditSession} from '../tools/mcp/session.mjs';
import {TourClient} from '../tools/mcp/tour-client.mjs';
import {MINATO_MEMORIES,MINATO_MEMORY_STORY,MINATO_RECIPE_CARD} from '../src/world/interiors/izakaya-exploration.js';

const out=new URL('../docs/qa/izakaya-items/',import.meta.url);await mkdir(out,{recursive:true});
const report={normalControls:true,fixturePlacement:false,walks:[],captures:[],checks:[]},s=new TownAuditSession();
const saveReport=()=>writeFile(new URL('persistence-report.json',out),JSON.stringify(report,null,2)+'\n');
const shot=async label=>{const file=new URL('persistence-'+label+'.png',out);await writeFile(file,await s.screenshot());report.captures.push(file.pathname);};
const readStored=()=>s.page.evaluate(async()=>{const {readSave}=await import('/johansson-town/src/save.js');return readSave(localStorage);});
const assertSaved=stored=>{
 assert.ok(stored,'A local player save exists');
 for(const id of [...MINATO_MEMORIES.map(m=>m.id),'complete','collected'])assert.ok(stored.inspectedIds.includes('minato-memory:'+id),'Stored '+id+' marker');
 assert.equal(stored.notes.filter(n=>n===MINATO_MEMORY_STORY).length,1,'Exactly one saved Minato story');
 assert.equal(stored.inventory.filter(i=>i===MINATO_RECIPE_CARD).length,1,'Exactly one saved recipe card');
};
const face=async(x,z,pitch=0)=>{
 const state=await s.observe(),p=state.game.player;let turn=Math.atan2(p[0]-x,p[2]-z)-state.view.yaw;
 while(turn>Math.PI)turn-=2*Math.PI;while(turn< -Math.PI)turn+=2*Math.PI;
 const result=await s.look({degrees:turn*180/Math.PI,verticalDegrees:state.view.pitch*180/Math.PI+pitch});assert.equal(result.accepted,true);
};
const navigate=async(label,x,z)=>{
 for(let attempt=0;attempt<4;attempt++){
  const state=await s.observe(),p=state.game.player;assert.equal(state.game.room,'izakaya','Walking stays in Minato');
  if(Math.hypot(p[0]-x,p[2]-z)<.55)return;
  const b=state.roomNavigation.bounds,grid=await s.grid({x:(b.minX+b.maxX)/2,z:(b.minZ+b.maxZ)/2,width:Math.min(32,b.maxX-b.minX),depth:Math.min(32,b.maxZ-b.minZ),cell:.4,radius:.28});
  const path=TourClient.prototype.path.call({state},grid,{x,z});assert.ok(path?.points.length,'A standing path to '+label);
  const result=await s.follow({points:path.points.slice(0,64),maxSeconds:120});
  report.walks.push({label,attempt,goal:[x,z],points:path.points,reached:result.reached,reason:result.reason,player:(await s.observe()).game.player});await saveReport();
  console.log(JSON.stringify({walk:label,attempt,reached:result.reached,player:report.walks.at(-1).player}));
  if(!result.reached)await s.wait({durationMs:1000});
 }
 const p=(await s.observe()).game.player;assert.ok(Math.hypot(p[0]-x,p[2]-z)<.55,'Actual walking reaches '+label);
};
const choose=async label=>assert.equal((await s.choose({label})).accepted,true,'Enabled action '+label);

try{
 await s.start({viewport:'desktop',spawn:'izakaya',time:'20:30'});await s.page.waitForLoadState('networkidle');
 await s.page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).room==='izakaya'&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
 assert.equal((await s.observe()).game.room,'izakaya');await s.input({control:'forward',durationMs:300});
 if((await s.observe()).view.thirdPerson)await s.input({control:'view',durationMs:34});
 for(const memory of [
  {id:'guestbook',goal:[-3.8,4.85],at:[-4.82,4.86],pitch:25},
  {id:'window',goal:[-3.9,5.5],at:[-3.9,6.13],pitch:0},
  {id:'radio',goal:[-.4,-4.82],at:[-.4,-5.7],pitch:-40},
  {id:'recipe',goal:[5.65,-4.94],at:[5.65,-6.16],pitch:0},
 ]){
  await navigate(memory.id,...memory.goal);await face(...memory.at,memory.pitch);await s.input({control:'interact',durationMs:16});
  const definition=MINATO_MEMORIES.find(m=>m.id===memory.id),state=await s.observe();assert.equal(state.ui.activity?.title,definition.title,'Normal interaction selects '+memory.id);
  await choose(definition.choice);await shot(memory.id);await s.input({control:'close',durationMs:16});
 }
 const stored=await readStored();assertSaved(stored);report.beforeReload={savedAt:stored.savedAt,markers:stored.inspectedIds.filter(i=>i.startsWith('minato-memory:')),storyCount:stored.notes.filter(n=>n===MINATO_MEMORY_STORY).length,cardCount:stored.inventory.filter(i=>i===MINATO_RECIPE_CARD).length};
 report.checks.push('four physical memories read through normal walking and menus','autosaved story, six markers and exactly one recipe card');
 // Save now is an additional ordinary user control, not a direct save call.
 assert.equal((await s.ui({control:'town_menu'})).accepted,true);await s.page.locator('#playerButton').click();
 await choose('Save now');assert.equal((await s.observe()).ui.activity.title,'Saved');await shot('save-now');await s.input({control:'close',durationMs:16});
 assertSaved(await readStored());report.checks.push('Menu → Player & save → Save now');

 await s.page.reload({waitUntil:'domcontentloaded'});await s.page.locator('#enter').click();
 await s.page.waitForFunction(()=>window.__JOHANSSON_RUNNING__&&window.__JOHANSSON_AUDIT__&&window.__JOHANSSON_AGENT_API__&&!window.__JOHANSSON_AUDIT__.blocked.catchingUp,null,{timeout:240000});
 // Reapply the same deterministic audit stepping mode as TownAuditSession.start.
 // This only controls advancement; it never places characters or changes progress.
 await s.page.evaluate(()=>{const a=window.__JOHANSSON_AUDIT__;a.frozen=true;a.renderFrozen=false;a.step(0);});
 await s.page.waitForLoadState('networkidle');await s.page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).room==='izakaya'&&!window.__JOHANSSON_AUDIT__.blocked.roomLoading);
 const restored=await readStored();assertSaved(restored);
 const after=await s.observe();assert.equal(after.game.discoveries.complete,true);report.afterReload={room:after.game.room,discoveries:after.game.discoveries,markers:restored.inspectedIds.filter(i=>i.startsWith('minato-memory:')),storyCount:restored.notes.filter(n=>n===MINATO_MEMORY_STORY).length,cardCount:restored.inventory.filter(i=>i===MINATO_RECIPE_CARD).length};
 await s.input({control:'forward',durationMs:300}); // Stand normally and finish the reload's opening camera.
 assert.equal((await s.ui({control:'town_menu'})).accepted,true);assert.equal((await s.ui({control:'bag'})).accepted,true);await choose(MINATO_RECIPE_CARD);
 const reader=(await s.observe()).ui.activity;assert.equal(reader.title,MINATO_RECIPE_CARD);assert.ok(reader.body.includes(MINATO_MEMORY_STORY));await shot('restored-recipe-card');
 report.checks.push('reload and normal Enter restore completed discovery','saved recipe card remains readable through the normal Bag');
 const final=await s.observe();assert.deepEqual(final.invalidTransforms,[]);report.observedErrors=final.errors;
 const cancellations=final.errors.filter(e=>e.type==='request'&&e.message.startsWith(s.preview.url)&&e.message.endsWith('net::ERR_ABORTED'));
 assert.deepEqual(final.errors.filter(e=>!cancellations.includes(e)),[],'No runtime or asset errors');report.expectedNavigationCancellations=cancellations;
 report.passed=true;console.log(JSON.stringify({passed:true,checks:report.checks,captures:report.captures.length,errors:final.errors.length}));
}catch(error){report.failure=error.message;report.final=s.page?await s.observe().catch(()=>null):null;console.error(error);process.exitCode=1;}
finally{report.inputs=s.history;await saveReport();await s.close();}
