import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {installDOM} from './fixtures.mjs';
import {CAST,CAST_NAMES,PLACES,RELATIONSHIPS,castMember} from '../src/people/cast.js';
import {CORE,RETIRED,ROSTER,identityOf} from '../src/people/roster.js';
import {homeForResident,householdAtHome,homeNameplate} from '../src/people/island-households.js';
import {NEIGHBOURS} from '../src/people/neighbours.js';
import {canonicalDay} from '../src/people/canonical-day.js';
import {FEED_PLACES} from '../src/feed/places.js';
import {BELONGINGS,RETIRED_BELONGINGS} from '../src/people/belongings.js';
import {ARTICLES,RETIRED_ARTICLES} from '../guide/articles.mjs';
import {RETIRED_RECIPE_NAMES,RESIDENT_NAMES,recipeFor} from '../src/avatars/cast.js';
import {castKey,migrateCast,CAST_REVISION} from '../src/save.js';
import {playableRoster,restoreLife} from '../src/desktop/life-state.js';
import {accountOf} from '../src/commerce/merchandising.js';
installDOM();

const retiredNames=['Mrs Nakamura','Emi','Emi Nakamura','emi','Mai','Nakamura Mai','Mai Nakamura','mai'];
const clone=value=>JSON.parse(JSON.stringify(value));

test('only the two Nakamura identities retire, without new residents or successor roles',()=>{
 assert.equal(CORE.length,18);assert.equal(ROSTER.length,23);assert.equal(CAST.length,23);
 assert.deepEqual(RETIRED.slice(-2).map(p=>p.id),['emi','mai']);
 for(const name of retiredNames){
  assert.equal(identityOf(name)?.category,'retired',name);
  assert.equal(castMember(name),null);assert.equal(homeForResident(name),null);assert.equal(canonicalDay(name,900),null);
  assert.ok(!RESIDENT_NAMES.includes(name)&&!CAST_NAMES.includes(name));
 }
 for(const name of ['Mrs Nakamura','Mai']){
  assert.ok(RETIRED_RECIPE_NAMES.includes(name));assert.ok(recipeFor(name).outfit,'the historical drawing remains');
  assert.ok(RETIRED_ARTICLES[name]&&RETIRED_BELONGINGS[name],'history is retained');
  assert.equal(ARTICLES[name],undefined);assert.equal(BELONGINGS[name],undefined);
  assert.ok(!NEIGHBOURS.some(p=>p.name===name));assert.ok(!RELATIONSHIPS.some(p=>p.a===name||p.b===name));
  assert.ok(!FEED_PLACES.some(p=>p.regulars.includes(name)));
 }
 for(const id of ['emi','mai'])assert.deepEqual(identityOf(id).transfer.to,[],'no successor is invented');
 for(const name of ['Vy','Riku','Nhung','Thao','Chin','Thuan','Miss Higa','Grandmother Higa'])assert.ok(castMember(name),name+' remains');
 assert.equal(RELATIONSHIPS.find(p=>p.a==='Vy'&&p.b==='Riku')?.kind,'cousins and classmates','their existing relationship is unchanged');
 assert.equal(ARTICLES.Vy.photos.some(p=>p.with==='Riku'),false,'the retired friendship is not reassigned');
});

test('the household registration retires while the facilities await a keeper and civic services remain',()=>{
 const home=householdAtHome('nakamura');assert.equal(home.retired,true);assert.equal(home.retainedBuilding,true);
 assert.deepEqual(home.residents,[]);assert.equal(homeNameplate('nakamura'),null);
 for(const id of ['zenzai','blue-coral']){assert.ok(PLACES[id].closed);assert.equal(PLACES[id].keepers,undefined);}
 assert.deepEqual(PLACES.clinic.keepers,['Nhung']);assert.deepEqual(PLACES['town-hall'].keepers,['Nhung']);
 const hall=accountOf('community-kitchen');assert.equal(hall.owner,undefined);assert.equal(hall.kitchenClosed,true);
 assert.deepEqual(hall.lines,['tea','crackers','tissues']);assert.ok(hall.stationery.length,'the civic register retains its paper supply');
 const day=castMember('Vy').day;assert.ok(!day.some(([,where])=>['zenzai','blue-coral'].includes(where)));
 assert.equal(canonicalDay('Vy',16*60+25).place,'park','Vy still does her homework in the park');
});

test('an already consolidated save drops every retired alias and impossible errand while preserving belongings and survivors',()=>{
 const records=()=>Object.fromEntries(retiredNames.map(name=>[name,{points:4}]));
 const saved={castRevision:2,yen:987,inventory:['Blue Coral ice cream','Canned coffee'],notes:['Met Mrs Nakamura before the counter closed.'],
  homeTarget:'home-nakamura',navigationTarget:'home-nakamura',lastHome:'home-nakamura',
  residentLocations:{...records(),Vy:{position:[2,3]}},residentLife:{...records(),Thuan:{yen:50}},
  friendship:{...records(),Thuan:{points:8}},treats:records(),greeted:records(),impressions:records(),
  relationships:{'Mai|Vy':{chat:4},'Emi|Thuan':{chat:2},'Thao|Thuan':{chat:9}},
  bookshop:{completed:{'3:Mai':true,'3:Thuan':true}},errand:{from:'Thuan',to:'Nakamura Mai',kind:'deliver'}};
 migrateCast(saved);
 assert.equal(saved.castRevision,CAST_REVISION);assert.equal(saved.homeTarget,'nakamura');assert.equal(saved.navigationTarget,'nakamura');assert.equal(saved.lastHome,'nakamura');
 assert.deepEqual(saved.residentLocations,{Vy:{position:[2,3]}});assert.deepEqual(saved.residentLife,{Thuan:{yen:50}});
 assert.deepEqual(saved.friendship,{Thuan:{points:8}});for(const field of ['treats','greeted','impressions'])assert.deepEqual(saved[field],{});
 assert.deepEqual(saved.relationships,{'Thao|Thuan':{chat:9}});assert.deepEqual(saved.bookshop.completed,{'3:Thuan':true});assert.equal(saved.errand,undefined);
 assert.equal(saved.yen,987);assert.deepEqual(saved.inventory,['Blue Coral ice cream','Canned coffee']);assert.deepEqual(saved.notes,['Met Mrs Nakamura before the counter closed.']);
 for(const name of retiredNames)assert.equal(castKey(name),null,name);
 const once=clone(saved);migrateCast(saved);assert.deepEqual(saved,once,'a second migration changes nothing');
});

test('a saved controlled family member returns to Johansson and cannot be selected through a historical alias',()=>{
 const roster=playableRoster(retiredNames);assert.ok(!roster.some(p=>retiredNames.includes(p.name)));
 const retained={x:12,z:-20,yaw:.5,atHome:false};
 for(const name of retiredNames){
  const raw={version:2,active:name,people:{[name]:{home:'nakamura',checkpoint:{x:6,z:-12,yaw:0,atHome:true}},Johansson:{checkpoint:retained},Thuan:{checkpoint:{x:2,z:3,yaw:1,atHome:false}}},
   tempers:{[name+'\0Thuan']:{at:900,count:1}}};
  const life=restoreLife(raw,roster);assert.equal(life.active,'Johansson');assert.deepEqual(life.people.Johansson.checkpoint,retained);
  assert.deepEqual(life.people.Thuan.checkpoint,raw.people.Thuan.checkpoint);assert.deepEqual(life.tempers,{});
  assert.ok(!Object.keys(life.people).some(key=>retiredNames.includes(key)));assert.deepEqual(restoreLife(life,roster),life);
 }
});

test('authored product audiences and active article references name no retired family member',async()=>{
 const products=JSON.parse(await readFile(new URL('../data/studio/products.json',import.meta.url),'utf8')).products;
 for(const product of products)for(const name of product.purpose?.for||[])assert.ok(!retiredNames.includes(name),product.id+' audience');
 for(const [name,article] of Object.entries(ARTICLES)){
  assert.ok(!retiredNames.includes(name));
  for(const photo of article.photos)assert.ok(!retiredNames.includes(photo.with));
 }
 assert.doesNotMatch(JSON.stringify(ARTICLES.Vy),/Mrs Nakamura|\bMai\b/);
});
