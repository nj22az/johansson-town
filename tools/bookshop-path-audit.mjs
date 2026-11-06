// Compiled-game regression: actual existing customers, room furniture and staff.
// Run after build:runtime: node tools/bookshop-path-audit.mjs [desktop|phone]
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {TownAuditSession} from './mcp/session.mjs';

const viewport=process.argv[2]||'desktop',session=new TownAuditSession();
assert.ok(['desktop','phone'].includes(viewport),'Use desktop or phone');
const out=new URL('../../output/bookshop-path/',import.meta.url);await mkdir(out,{recursive:true});
const report={viewport,fixture:'Real Reiko holds the narrow aisle while Johansson temporarily occupies a browsing stop.',phases:[],samples:[],errors:[]};
const capture=async label=>{await session.page.evaluate(()=>window.__JOHANSSON_AUDIT__.render());await writeFile(new URL(`${viewport}-${label}.png`,out),await session.screenshot());};
try{
 await session.start({viewport,spawn:'sakura-bench',time:'15:12'});
 const fixture=await session.page.evaluate(async()=>{
  const a=window.__JOHANSSON_AUDIT__,state=a.activities.state,people=a.world.people;
  a.frozen=true;a.world.traffic.reconcileAbsent();
  const person=people.find(p=>p.profile.name==='Chin'),index=people.indexOf(person),day=(6-index%6)%6,minutes=day*1440+912;
  state.residentLife??={};state.residentLife.Chin={day,yen:2400,purchases:[],activities:[],shopping:{finished:true}};
  a.setTime(minutes);
  // Fixture placement sets up the previously observed obstruction. Every journey
  // after entering the room runs the normal compiled customer and walking code.
  const {TOWN_DESTINATIONS}=await import('/johansson-town/src/world/town-grid.js');
  for(const name of ['Nhung','Reiko']){const p=people.find(p=>p.profile.name===name);p.g.position.set(p.profile.work[0],0,p.profile.work[1]);p.g.userData.indoors='work';p.g.visible=false;}
  person.g.position.set(TOWN_DESTINATIONS.books[0],0,TOWN_DESTINATIONS.books[1]);
  person.g.userData.indoors='bookshop';person.g.visible=false;
  a.teleport(-8,8,0);await a.enter('frontrow');
  a.teleport(-.3,2,0);
  const reiko=people.find(p=>p.profile.name==='Reiko');reiko.g.position.set(-1.8,0,-1.7);reiko.g.userData.facePlayerUntil=performance.now()+1e9;
  a.camera={pos:[-.1,1.8,2.75],at:[-.2,.8,-1.5]};a.step(1000);
  return {minutes,day,peopleCount:people.length,originalKenjiPosition:[...TOWN_DESTINATIONS.books],room:JSON.parse(window.render_game_to_text()).room};
 });
 report.fixtureState=fixture;assert.equal(fixture.room,'frontrow');await capture('browse-start');
 // Johansson is an actual dynamic obstruction, using the same position read by
 // customer path planning. Then he walks out of its approach through real input.
 await session.page.evaluate(()=>window.__JOHANSSON_AUDIT__.teleport(1.8,-2.1,0));
 let completed=false,released=false,detoured=false,counterCaptured=false;
 const phases=new Set();
 for(let tick=0;tick<1200;tick++){
  const second=tick/4;
  if(second===45){
   // Move along the clear east aisle using actual keyboard control, not placement.
   await session.page.keyboard.down('KeyD');await session.page.evaluate(()=>window.__JOHANSSON_AUDIT__.step(600));await session.page.keyboard.up('KeyD');
   const clearance=await session.page.evaluate(()=>{const p=JSON.parse(window.render_game_to_text()).player;return Math.hypot(p[0]-1.8,p[2]+2.1);});
   assert.ok(clearance>=.7,'Real input clears the browsing stop');released=true;await capture('shelf-cleared');
  }
  const sample=await session.page.evaluate(()=>{
   const a=window.__JOHANSSON_AUDIT__,p=a.world.people.find(p=>p.profile.name==='Chin'),before=p.g.position.clone();
   let displacement=0,minPersonClearance=Infinity,badFloor=false;
   a.step(250);
   if(p.g.userData.inBookshop){
    displacement=p.g.position.distanceTo(before);
    badFloor=a.navigation(p.g.position.x,p.g.position.z,.3).staticBlocked;
    for(const other of a.world.people)if(other!==p&&other.g.visible&&(other.g.userData.inBookshop||other.g.userData.inWorkplace==='frontrow'))minPersonClearance=Math.min(minPersonClearance,p.g.position.distanceTo(other.g.position));
   }
   const s=JSON.parse(window.render_game_to_text()),visit=a.bookshopCustomers.find(p=>p.name==='Chin');
   return {visit,position:p.g.position.toArray(),displacement,minPersonClearance,badFloor,player:s.player,minutes:s.minutes,sales:(a.activities.state.bookshop?.sales||[]).filter(s=>s.buyer==='Chin').length,purchases:(a.activities.state.residentLife?.Chin?.purchases||[]).filter(p=>p.id==='bookshop-paperback').length,completed:(a.activities.state.bookshop?.completed||[]).some(s=>s.key.endsWith(':Chin')),actorCount:a.world.people.length};
  });
  report.samples.push({second,...sample});
  assert.ok(sample.displacement<=.25+.001,'Customer walks without teleporting');assert.equal(sample.badFloor,false,'Customer clears actual furniture and room bounds');
  assert.ok(sample.minPersonClearance>=.65-.001,'Customer clears the actual staff and customers');assert.equal(sample.actorCount,fixture.peopleCount,'No duplicate residents');
  if(sample.visit){
   phases.add(sample.visit.phase);
   if(!detoured&&sample.position[0]>-.9&&sample.visit.phase==='browse'){detoured=true;await capture('detour');}
   if(!counterCaptured&&sample.visit.phase==='counter'&&Math.hypot(sample.position[0]+1.1,sample.position[2]-1.25)<.2){counterCaptured=true;await capture('counter');}
  }
  if(!sample.visit&&sample.completed){assert.equal(sample.sales,1);assert.equal(sample.purchases,1);completed=true;break;}
 }
 report.phases=[...phases];report.completed=completed;report.released=released;report.detoured=detoured;
 assert.equal(completed,true,'Real customer completes the visit');assert.equal(released,true);assert.equal(detoured,true);
 for(const phase of ['browse','counter','leave'])assert.ok(phases.has(phase),'Customer reaches '+phase);
 await capture('completed');report.errors=[...session.errors];assert.deepEqual(report.errors,[],'No browser or asset errors');
 console.log(`Bookshop ${viewport}: browse, detour, occupied shelf recovery, purchase and exit passed`);
}finally{
 report.errors=[...session.errors];await writeFile(new URL(`${viewport}-report.json`,out),JSON.stringify(report,null,2)+'\n');await session.close();
}
