// The consolidated roster (src/people/roster.js; docs/CAST-CONSOLIDATION.md §4–§9, §13): internally consistent, and
// resolving to the live cast without changing who walks today (phase 1).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CORE,SUPPORTING,ROSTER,RETIRED,HOUSEHOLDS,QUARTERS,SHIP_POSTS,SHIP_POST_ALIASES,SHORE_ROLES,RETIRED_HOMES,RETIRED_HOME_IDS,
 identityOf,isRetired,householdOf,shipPostOf,holderOf,shipPostKey,namesOf,retiredHomeFallback,rosterDocument} from '../src/people/roster.js';
import {CAST,CAST_NAMES,castMember,liveNameFor} from '../src/people/cast.js';
import {ISLAND_HOMES} from '../src/people/island-households.js';
import {FERRY_MANNING} from '../src/world/ferry-ship.js';
import {FERRY_SHORE} from '../src/people/ferry-crew.js';
import {RENAMED_RESIDENTS,formerNames} from '../src/people/renamed.js';
import {recipeFor} from '../src/avatars/cast.js';

const homes=new Map(ISLAND_HOMES.map(h=>[h.home,h]));

// Dr Ken retired into Nhung on 22 October 2026 (the owner): the brief's 21 core are 20.
test('18 core and 5 supporting identities; 23 unique short display names; ids are machine keys, never names',()=>{
 assert.equal(CORE.length,18);assert.equal(SUPPORTING.length,5);assert.equal(ROSTER.length,23);
 assert.equal(new Set(ROSTER.map(p=>p.name)).size,23);
 assert.equal(new Set([...ROSTER,...RETIRED].map(p=>p.id)).size,36,'every id once, the retired included');
 for(const p of [...ROSTER,...RETIRED]){
  assert.match(p.id,/^[a-z][a-z0-9-]*$/,p.id+' is a machine key');
  assert.ok(![p.name,p.fullName,...p.was].includes(p.id),p.id+' is not also a name');
  assert.ok(p.category==='retired'||/^[mf]$/.test(p.sex),p.id+' has a sex');
 }
 for(const p of CORE)assert.equal(p.category,'core');for(const p of SUPPORTING)assert.equal(p.category,'supporting');
 // The brief's display names, in its order (§4 and §5).
 assert.deepEqual(CORE.map(p=>p.name),['Nils','Thuan','Thao','Chin','Vy','Nhung','Koji','Riku','Yui','Gran Higa','Tetsu','Aki','Mori','Fuji','Jack','Mac','Nao','Mika']);
 assert.deepEqual(SUPPORTING.map(p=>p.name),['Ryo','Ren','Aya','Jun','Kai']);
 // Ages are the source's (cast.js); children keep theirs.
 assert.equal(identityOf('vy').age,11);assert.equal(identityOf('riku').age,9);assert.ok(isRetired('mai'));
});

test('every name, full name, historical name and id maps to exactly one identity',()=>{
 const seen=new Map();
 for(const p of [...ROSTER,...RETIRED])for(const key of new Set([p.id,p.name,p.fullName,...p.was].filter(Boolean))){
  assert.ok(!seen.has(key)||seen.get(key)===p.id,key+' names both '+seen.get(key)+' and '+p.id);seen.set(key,p.id);
  assert.equal(identityOf(key)?.id,p.id,key);
 }
 assert.equal(identityOf('Harbour visitor'),null);assert.equal(identityOf('Emi Kado'),null);assert.equal(identityOf(''),null);
 // The brief's previous identities (§4) all resolve to the new person.
 for(const [old,now] of [['Johansson','nils'],['Kōji','koji'],['Miss Higa','yui'],['Mrs Higa','yui'],['Yonamine-sensei','yui'],['Grandmother Higa','gran-higa'],['Tetsuo','tetsu'],['Mrs Sato','aki'],['Officer Mori','mori'],['Mrs Nakamura','emi'],['Nakamura Mai','mai'],['Mr Fujita','fuji'],['Harbour master','jack'],['Mr Nakandakari','mac'],['Ms Uezu','nao'],['Ms Ganaha','mika'],['Chief officer','ryo'],['Deck hand','ren'],['Purser','aya'],['Cook-steward','jun'],['Kitano line hand','kai']])
  assert.equal(identityOf(old)?.id,now,old);
});

test('the save-era names of the sisters (Yui, Aya, Nao) are not roster aliases: they now name the teacher, the purser and the bosun',()=>{
 for(const [old,now] of Object.entries(RENAMED_RESIDENTS)){
  const legacy=identityOf(now),reused=identityOf(old);
  if(reused&&reused!==legacy)assert.ok(!legacy.was.includes(old)&&reused.name===old,old+' is only a save-era name of '+now+' and the display name of '+reused.id);
 }
 assert.equal(identityOf('Yui').id,'yui');assert.equal(identityOf('Aya').id,'aya');assert.equal(identityOf('Nao').id,'nao');
 // formerNames keeps the legacy table for the person it names and never hands one of those names to the new bearer.
 assert.deepEqual(formerNames('Thuan'),['Yuri','Yui']);assert.deepEqual(formerNames('Nhung'),['Aya']);assert.deepEqual(formerNames('Thao'),['Nao']);
 assert.ok(!formerNames('Miss Higa').includes('Yui'));assert.ok(formerNames('Mr Fujita').includes('Fuji'));
});

test('exactly 12 core households with the listed members (the doctor and Nakamura homes retired); every core person in one; homes stand in the registry',()=>{
 assert.equal(HOUSEHOLDS.length,12);
 const expected={'kitano-1':['nils','thuan'],'kitahama-1':['thao','chin','vy'],'kitahama-3':['nhung','koji','riku'],higa:['yui','gran-higa'],'resident-home-kenji':['tetsu'],
  'kitahama-2':['aki'],koban:['mori'],office:['jack'],'kitahama-flat-3':['mac'],'kitahama-flat-4':['mika'],'kitahama-8':['nao'],'fujita-houseboat':['fuji']};
 assert.deepEqual(Object.fromEntries(HOUSEHOLDS.map(h=>[h.home,[...h.members]])),expected);
 const placed=HOUSEHOLDS.flatMap(h=>h.members);assert.equal(new Set(placed).size,18);assert.equal(placed.length,18);
 for(const p of CORE){assert.equal(householdOf(p.id)?.home,p.home,p.id+' sleeps where the household says');assert.equal(p.household,p.home);}
 for(const h of HOUSEHOLDS){const reg=homes.get(h.home);assert.ok(reg&&!reg.retired&&!reg.secondaryOnly,h.home+' is a standing primary home in the registry');}
 assert.equal(HOUSEHOLDS.filter(h=>homes.get(h.home).island==='minato').length,11);
 // Nobody keeps a secondary shore room (addendum 4), and shipboard berths add no household.
 for(const p of ROSTER){assert.equal(p.room,null,p.id);if(p.berth)assert.ok(QUARTERS.find(q=>q.id===p.berth)?.aboard,p.id+'’s berth is aboard');}
 for(const p of SUPPORTING){assert.equal(p.household,null,p.id+' is not a household');assert.ok(p.berth||p.home,p.id+' has quarters');assert.ok(QUARTERS.some(q=>q.who.includes(p.id)),p.id+' is in QUARTERS');}
 assert.equal(identityOf('kai').home,'kitano-2');assert.ok(homes.get('kitano-2'));
});

test('every retired identity records its disposition and a retiring home registration',()=>{
 assert.equal(RETIRED.length,13);
 // Dr Kakazu's old name resolves to his retired record, and Nhung holds his post.
 assert.equal(identityOf('Dr Kakazu')?.id,'dr-ken');assert.equal(identityOf('Dr Ken')?.id,'dr-ken');assert.deepEqual([...identityOf('dr-ken').transfer.to],['nhung']);
 for(const p of RETIRED){
  assert.equal(p.category,'retired');assert.ok(isRetired(p.id)&&isRetired(p.name));
  assert.ok(p.transfer.purpose.length>10,p.id+' has a disposition');
  if(['emi','mai'].includes(p.id))assert.deepEqual(p.transfer.to,[],p.id+' has no invented successor');
  else assert.ok(p.transfer.to.length,p.id+' has its original transfer');
  for(const to of p.transfer.to)assert.ok(ROSTER.some(q=>q.id===to),p.id+' transfers to '+to+', an active identity');
  assert.ok(homes.get(p.home),p.id+'’s former home '+p.home+' is a registry id');
  assert.ok(RETIRED_HOME_IDS.includes(p.home),p.home+' is a retiring home record');
  assert.ok(!HOUSEHOLDS.some(h=>h.members.includes(p.id)),p.id+' is in no household');
 }
 assert.deepEqual(RETIRED.map(p=>p.name),['Bus driver','Mr Higa Jr','Grandmother Sakurai','Grandmother Chinen','Postman Tōma','Mr Shimabukuro','Mr Ōshiro','Mrs Kinjō','Barfly','Reiko','Dr Kakazu','Mrs Nakamura','Mai']);
 // The brief's cautions (§6): Fuji keeps Shiosai, not the captain's house; Chin keeps 1 Kitahama, not the flat.
 assert.equal(identityOf('fuji').home,'fujita-houseboat');assert.equal(identityOf('chin').home,'kitahama-1');
 assert.equal(identityOf('thuan').role.includes('owns'),true);assert.ok(!identityOf('chin').role.toLowerCase().includes('sakura'));
});

test('the eight ship posts are the manning plan’s keys, each with a holder, reliefs where the brief says, nobody in two stations',()=>{
 assert.deepEqual(SHIP_POSTS.map(p=>p.key),FERRY_MANNING.map(p=>p.post));
 const holders=SHIP_POSTS.map(p=>p.holder);assert.equal(new Set(holders).size,8);
 for(const p of SHIP_POSTS){const who=identityOf(p.holder);assert.ok(who&&who.category!=='retired',p.key+' is held by an active identity');assert.equal(who.post,p.key,who.id+' knows the post');}
 assert.equal(identityOf('fuji').post,'master');assert.equal(identityOf('chin').post,'oiler');assert.equal(identityOf('nils').post,'chief');assert.equal(identityOf('nao').post,'bosun');
 assert.equal(SHIP_POSTS.find(p=>p.key==='oiler').title,'Motorman');assert.equal(shipPostKey('motorman'),'oiler');assert.deepEqual(SHIP_POST_ALIASES,{motorman:'oiler'});
 assert.equal(SHIP_POSTS.find(p=>p.key==='chief').relief,'mac');assert.equal(SHIP_POSTS.find(p=>p.key==='bosun').relief,'koji');
 for(const p of SHIP_POSTS)if(p.relief){assert.ok(!holders.includes(p.relief),p.relief+' relieves and holds no post of their own');assert.equal(identityOf(p.relief).relief,p.key);}
 assert.equal(holderOf('motorman').id,'chin');assert.equal(shipPostOf('Mr Fujita').key,'master');
 // Shore roles are ferry-crew.js keys; Jack takes the office and Minato's lines, Mika the counter, Kai stays at Kitano.
 assert.deepEqual(new Set(SHORE_ROLES.map(r=>r.key)),new Set(FERRY_SHORE.map(s=>s.post)));
 assert.equal(holderOf('port').id,'jack');assert.equal(holderOf('linesman').id,'jack');assert.equal(holderOf('tickets').id,'mika');assert.equal(holderOf('airport-linesman').id,'kai');assert.equal(holderOf('relief-engineer').id,'mac');assert.equal(holderOf('electrician').id,'tetsu');
 for(const r of SHORE_ROLES)assert.ok(identityOf(r.holder).shore.includes(r.key),r.holder+' knows the shore role '+r.key);
});

test('retiring homes resolve to a retained public place; a home that stays resolves to itself',()=>{
 for(const id of ['kitahama-4','kitahama-5','kitahama-6','kinjo','oshiro','resident-home-aya','kitano-3','kitahama-flat-1','kitahama-flat-2','shimabukuro'])assert.ok(RETIRED_HOME_IDS.includes(id),id);
 for(const id of RETIRED_HOME_IDS){assert.ok(homes.get(id),id+' is a registry id today');assert.notEqual(retiredHomeFallback('home-'+id),'home-'+id,id);if(!['izakaya','clinic','nakamura'].includes(id))assert.notEqual(retiredHomeFallback(id),id,id);}
 assert.equal(retiredHomeFallback('izakaya'),'izakaya','the izakaya stays as a business; only Barfly’s home registration retires');
 assert.equal(retiredHomeFallback('clinic'),'clinic','the clinic stays; only the doctor’s flat behind it retires (22 October 2026)');assert.equal(retiredHomeFallback('home-clinic'),'clinic');
 assert.equal(retiredHomeFallback('home-kitahama-4'),'community-kitchen');assert.equal(retiredHomeFallback('post-office'),'ferry-terminal');assert.equal(retiredHomeFallback('rainflower-florist'),'market');assert.equal(retiredHomeFallback('home-izakaya'),'izakaya');
 for(const id of ['home-higa','kitahama-1','home-kitahama-flat-3','mayor-home','market',undefined])assert.equal(retiredHomeFallback(id),id);
 for(const h of HOUSEHOLDS)assert.ok(!Object.hasOwn(RETIRED_HOMES,h.home),h.home+' is a household and does not retire');
});

test('phase 2: every person resolves to one body in cast.js; the supporting crew have bodies; old-name lookups draw the same person',()=>{
 for(const p of ROSTER){const live=liveNameFor(p.id);assert.ok(CAST_NAMES.includes(live),p.id+' → '+live);assert.equal(liveNameFor(p.name),live);for(const w of p.was)assert.equal(liveNameFor(w),live,w);}
 // The short display names of Fuji, Jack, Nao and Koji wait for phase 5's sweep; Mac is renamed with his biography.
 assert.equal(castMember('Fuji').name,'Mr Fujita');assert.equal(castMember('Jack').name,'Harbour master');assert.equal(castMember('Nao').name,'Ms Uezu');assert.equal(castMember('Koji').name,'Kōji');
 assert.equal(castMember('Mac').name,'Mac');assert.equal(castMember('Mr Nakandakari').name,'Mac');
 for(const p of SUPPORTING){const live=castMember(p.name);assert.equal(live?.name,p.name,p.name+' has a body of their own');assert.ok(live.supporting,p.name+' is marked supporting in the cast');for(const w of p.was)assert.equal(castMember(w)?.name,p.name,w+' resolves to '+p.name);}
 for(const p of RETIRED)for(const name of [p.name,p.id,...p.was])assert.equal(castMember(name),null,name+' has no body (phase 4)');
 for(const name of CAST_NAMES)assert.equal(castMember(name).name,name,'cast.js lookups are untouched');
 assert.equal(CAST.length,23,'the 18 core and the five supporting crew');
 assert.equal(CAST.filter(p=>p.supporting).length,5);
 const bare=r=>JSON.stringify({...r,name:null});
 // Emi is the one display name that already has a drawing of its own (the old townsfolk profile, Mrs Kinjō's look): it keeps it until phase 5.
 for(const p of ROSTER)if(p.avatar&&p.name!=='Emi')assert.equal(bare(recipeFor(p.name)),bare(recipeFor(p.avatar)),p.name+' is drawn as '+p.avatar);
 assert.notEqual(bare(recipeFor('Emi')),bare(recipeFor('Mrs Nakamura')),'the townsfolk Emi keeps her own face until phase 5');
 // The supporting crew are drawn once each, under their own names and under the job-role names they had.
 const looks=new Set();
 for(const p of SUPPORTING){const own=bare(recipeFor(p.name));assert.ok(!looks.has(own),p.name+' has a look of their own');looks.add(own);for(const w of p.was)assert.equal(bare(recipeFor(w)),own,w+' draws '+p.name);}
 assert.deepEqual(namesOf('fuji'),['Fuji','Fujita','Mr Fujita']);
});

test('docs/cast-roster.json mirrors the module (node tools/write-cast-roster.mjs)',async()=>{
 const file=await readFile(new URL('../docs/cast-roster.json',import.meta.url),'utf8');
 assert.equal(file,JSON.stringify(rosterDocument(),null,1)+'\n');
});
