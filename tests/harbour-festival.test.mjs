// Regression coverage for the owner's 22 October withdrawal. Peaceful festivals use town-calendar/happenings.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {migrateCombat,readSave,SAVE_KEY} from '../src/save.js';
import {playableRoster,restoreLife,insultResident,apologiseTo} from '../src/desktop/life-state.js';
const text=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
test('retired progress is discarded, preserving property, relationships, identity and travel',()=>{
 const peaceful={castRevision:2,yen:5432,inventory:['Driftwood club','Tea'],friendship:{Thuan:{hearts:4}},relationships:{'Johansson|Thuan':{score:8}},desktopCheckpoint:{x:1,z:2,yaw:.5},desktopLife:{active:'Thuan',people:{Thuan:{checkpoint:{x:7,z:8,yaw:1,atHome:true}}},tempers:{old:{count:4}}},island:{journey:{location:'kitano'}}};
 const saved={...clone(peaceful),harbourFestival:{hero:'Thuan',completed:['quay-crate'],watched:['park-towel'],tournaments:{1997:{rewarded:false}}},dungeonDeepest:5};
 migrateCombat(saved);assert.equal(saved.harbourFestival,undefined);assert.equal(saved.dungeonDeepest,undefined);assert.equal(saved.combatRecovery,undefined);
 for(const key of ['yen','inventory','friendship','relationships','desktopCheckpoint','island'])assert.deepEqual(saved[key],peaceful[key]);
 assert.equal(saved.desktopLife.active,'Thuan');assert.deepEqual(saved.desktopLife.people,peaceful.desktopLife.people);assert.equal(saved.desktopLife.tempers,undefined);
 assert.deepEqual(migrateCombat(clone(saved)),saved,'Migration is idempotent');
});
test('active, spectator, tournament, cave and imported arena saves recover to the safe harbour opening',()=>{
 for(const marker of [{harbourFestival:{active:true,bout:{spectating:true}}},{harbourFestival:{resume:{tournament:true}}},{combat:{active:true}},{activeBout:{}},{arenaResume:{stage:'ferry-finale'}},{dungeonRun:{hp:0}},{room:'dungeon'},{desktopCheckpoint:{x:0,z:0,yaw:0,room:'arena'}},{desktopLife:{active:'Thuan',people:{Thuan:{checkpoint:{x:0,z:0,yaw:0,room:'ferry-arena'}}}}}]){
  const raw={castRevision:2,yen:500,inventory:['Tea'],island:{journey:{location:'airport',ticket:true},projects:{harbour:2}},...clone(marker)};
  const storage={getItem:key=>key===SAVE_KEY?JSON.stringify(raw):null};
  const saved=readSave(storage);assert.equal(saved.combatRecovery,true,JSON.stringify(marker));assert.deepEqual(saved.desktopCheckpoint,{x:19.8,z:-40,yaw:-1.03,pitch:0,ship:false});
  assert.equal(saved.island.journey.location,'town');assert.equal(saved.island.journey.ticket,true);assert.equal(saved.island.projects.harbour,2);assert.equal(saved.yen,500);assert.deepEqual(saved.inventory,['Tea']);assert.equal(saved.dungeonRun,undefined);assert.equal(saved.harbourFestival,undefined);
  const life=saved.desktopLife;if(life)assert.equal(life.people.Thuan.checkpoint.atHome,false);
  // Once game startup consumes the transient flag and saves, subsequent loads do not move the player again.
  delete saved.combatRecovery;assert.equal(readSave({getItem:key=>key===SAVE_KEY?JSON.stringify(saved):null}).combatRecovery,undefined);
 }
});
test('every adult, child and family pair ends repeated insults without a fight, including restored hostility',()=>{
 const roster=playableRoster();
 for(const hero of roster)for(const target of roster){
  const life=restoreLife({active:hero.name,tempers:{[hero.name+'\0'+target.name]:{at:720,count:4,cooldown:0}}},roster);
  for(let i=0;i<12;i++)assert.ok(['self','warning','leave'].includes(insultResident(life,target.name,720+i).kind));
  const retained=restoreLife(clone(life),roster);assert.ok(['self','leave'].includes(insultResident(retained,target.name,735).kind));
  apologiseTo(retained,target.name);assert.ok(['self','warning'].includes(insultResident(retained,target.name,736).kind));
 }
});
test('source has no combat launcher, keyboard/touch/controller handler, simulation or public API',()=>{
 const game=text('src/game.js'),life=text('src/desktop/life.js'),activities=text('activities.js');
 for(const marker of ['createHarbourFestival','createFists','buildDungeon','festivalHUD','festivalButton','johansson-festival-menu','startQuarrel','festival.quarrel','dungeonLayout','flashHurt','finishDungeon','dungeon?.strike','festival.render','festival,','festival?.active','if(fists)'])assert.equal(game.includes(marker),false,marker);
 assert.equal(life.includes('startQuarrel'),false);assert.equal(life.includes("result.kind==='fight'"),false);assert.equal(activities.includes('restoreFestival'),false);
 for(const file of ['src/progression/harbour-festival.js','src/progression/harbour-festival-view.js','src/dungeon/dungeon.js','src/dungeon/generate.js','src/interact/fists.js'])assert.equal(existsSync(new URL('../'+file,import.meta.url)),false,file);
 assert.match(text('src/world/coyote-tunnel.js'),/Read the closed descent notice/);assert.doesNotMatch(text('src/world/coyote-tunnel.js'),/onAction\?\.\('dungeon'\)/);
 assert.match(game,/delete activities.state.combatRecovery;standUpAt\(19\.8,-40,-1\.03\)/);
});
test('peaceful calendar festivals and ferry remain in the runtime source',()=>{
 assert.match(text('src/game.js'),/createIslandPlay/);assert.match(text('src/people/happenings.js'),/export/);
 assert.match(text('src/progression/year-loop.js'),/friendship.*inventory.*yen/);
});
