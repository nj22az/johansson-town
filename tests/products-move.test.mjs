import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {installDOM} from './fixtures.mjs';
import {productSnapshot} from '../tools/studio/products-snapshot.mjs';

// Sakura's products moved out of eight modules into data/studio/products.json (Studio over MCP, stage 2, batch 2a).
// tests/fixtures/products-legacy.json is what those modules exported before the move; the views over the data must
// give back every value, in the same order where order means something (the atlas, the flavours, the floor walk, the
// catalogue, the stock), and build every pack's geometry to the same bytes. tools/studio/baselines.mjs checks the
// pixels in Chromium. The geometry of 17 packs was re-recorded on 26 October 2026, when they were rebuilt so that none of
// their faces share a plane (the Sakura surface audit, docs/qa/sakura-surfaces/); their envelopes moved by at most
// 1.2 mm (the cans are that much lower, their lids now inside the rim) and the stock is unchanged.
installDOM();
const legacy=JSON.parse(await readFile(new URL('./fixtures/products-legacy.json',import.meta.url),'utf8'));
const now=await productSnapshot();
// Since the snapshot was taken the cast has been consolidated (src/people/cast.js): a place cast.js marks closed no longer
// trades, so its accounts (the Fumoto co-op's Wednesday crates) are gone from ACCOUNTS. Everything else is unchanged.
const {PLACES}=await import('../src/people/cast.js');
const closed=new Set(Object.entries(PLACES).filter(([,p])=>p.closed).map(([id])=>id));
for(const accounts of Object.values(legacy.ACCOUNTS))for(const site of Object.keys(accounts))if(closed.has(site))delete accounts[site];
// And the people who left the island no longer buy anything: they leave every 'for' list and linesFor. Phase 5 of the
// consolidation (docs/CAST-CONSOLIDATION.md; data/studio/products.json) then gave the retired buyers' lines to live
// residents whose days fit them, so a 'for' list is the data's own where it names live cast only and keeps everyone of
// the snapshot's who stayed; linesFor follows for every live buyer.
const {castMember}=await import('../src/people/cast.js');
const live=n=>castMember(n)&&!castMember(n).supporting;
const leave=(o,key)=>{if(Array.isArray(o)){o.forEach(x=>leave(x));return;}if(!o||typeof o!=='object')return;
 // (A supporting crew name, Jun, was the airport clerk's who left; the cook-steward of that name is a different person the snapshot never had.)
 if(Array.isArray(o.for)){o.for=o.for.filter(live);const id=o.id||key,want=now.MERCHANDISING[id]?.for;
  if(want&&want.join()!==o.for.join()){assert.ok(want.every(n=>castMember(n)),id+' is for live residents');for(const n of o.for)assert.ok(want.includes(n),id+' keeps '+n);o.for=[...want];}}
 for(const [k,v] of Object.entries(o))if(k!=='for')leave(v,k);};
leave(legacy.MERCHANDISING);leave(legacy.GROCERY_ITEMS);leave(legacy.SHOP_STOCK);
// Phase 3 of the consolidation moved the florist's trade to Sakura (docs/CAST-CONSOLIDATION.md addendum 3): the Rainflower
// supplier and its accounts are gone, Sakura's supplier record carries the decorations, and the four businesses that took
// their decorations from Mrs Kinjō now take them on their Sakura account (decor, with the why and delivery extended). The
// shelf lines of those accounts, and everything else, are unchanged.
delete legacy.SUPPLIERS['rainflower-florist'];delete legacy.ACCOUNTS['rainflower-florist'];
legacy.SUPPLIERS.sakura={...legacy.SUPPLIERS.sakura,goods:now.SUPPLIERS.sakura.goods,decor:now.SUPPLIERS.sakura.decor};
// 21 October 2026 (briefs/town-hall-zone.md phase M): the mayor's office went, and its accounts with Sakura and Front-Row
// are the Community Hall's (the community kitchen's): the hall orders what the office ordered, as well as its own.
{const hall=now.ACCOUNTS.sakura['community-kitchen'],was=[legacy.ACCOUNTS.sakura['community-kitchen'],legacy.ACCOUNTS.sakura['mayor-office']];
 assert.deepEqual(hall.lines,was.flatMap(a=>a.lines),'the hall orders the kitchen\u2019s lines and the office\u2019s');
 assert.deepEqual(now.ACCOUNTS.sakura['community-kitchen'].stationery,legacy.ACCOUNTS.frontrow['mayor-office'].lines,'the hall\u2019s register takes the office\u2019s stationery');
 assert.equal(now.ACCOUNTS.sakura['mayor-office'],undefined);delete legacy.ACCOUNTS.sakura['mayor-office'];legacy.ACCOUNTS.sakura['community-kitchen']=now.ACCOUNTS.sakura['community-kitchen'];
 legacy.ACCOUNTS.frontrow['community-kitchen']=legacy.ACCOUNTS.frontrow['mayor-office'];delete legacy.ACCOUNTS.frontrow['mayor-office'];}
// 22 October 2026 (the owner): Nhung is the island doctor and Front-Row's trade is Sakura's. Front-Row's supplier record
// and its accounts are gone; what each business ordered from it is now the `stationery` of its Sakura account (Sakura's
// own receipt rolls and ledgers are its own stock), Sakura's supplier record lists the stationery, the paper's account
// (`frontrow`) and the clinic's (Nhung's) say so, and every account keeps its shelf lines.
assert.equal(now.SUPPLIERS.frontrow,undefined);assert.equal(now.ACCOUNTS.frontrow,undefined);
for(const [site,was] of Object.entries(legacy.ACCOUNTS.frontrow)){if(site==='market')continue;assert.deepEqual(now.ACCOUNTS.sakura[site].stationery,was.lines,site+' orders the same stationery from Sakura');}
delete legacy.SUPPLIERS.frontrow;delete legacy.ACCOUNTS.frontrow;
legacy.SUPPLIERS.sakura={...legacy.SUPPLIERS.sakura,goods:now.SUPPLIERS.sakura.goods,stationery:now.SUPPLIERS.sakura.stationery};
// What each account's record says now, field by field: the paper's name, why and delivery; the stationery the offices,
// the hall and the school order, and their why (and the harbour's delivery); the clinic's keeper, Nhung, not a nurse.
// Every other field is compared as it was.
const REWRITTEN={frontrow:['name','why','delivery'],office:['stationery','why','delivery'],koban:['stationery','why'],'community-kitchen':['stationery','why'],school:['stationery','why'],clinic:['owner','contact']};
for(const [site,keys] of Object.entries(REWRITTEN)){const was=legacy.ACCOUNTS.sakura[site],is=now.ACCOUNTS.sakura[site];assert.deepEqual(is.lines,was.lines,site+' keeps its shelf lines');
 const next={...was};for(const key of keys){if(key in is)next[key]=is[key];else delete next[key];}legacy.ACCOUNTS.sakura[site]=next;}
assert.equal(now.ACCOUNTS.sakura.clinic.owner,'Nhung');
for(const site of ['izakaya','onsen','school']){const was=legacy.ACCOUNTS.sakura[site],is=now.ACCOUNTS.sakura[site];assert.deepEqual(is.lines,was.lines,site+' keeps its shelf lines');legacy.ACCOUNTS.sakura[site]={...was,why:is.why,delivery:is.delivery,decor:is.decor};}
// Phase 4 retired the people some accounts' deliveries named (Reiko's evening press): the data's delivery line is the
// one that reads, and it names a live resident; the lines and everything else about the account are unchanged.
const {isRetired}=await import('../src/people/roster.js');
const retiredName=text=>typeof text==='string'&&/Reiko|Tōma|Kinjō|Ōshiro|Shimabukuro|Sakurai|Barfly|Bus driver|Higa Jr|Grandmother Chinen/.test(text);
for(const [supplier,accounts] of Object.entries(legacy.ACCOUNTS))for(const [site,was] of Object.entries(accounts)){const is=now.ACCOUNTS[supplier]?.[site];if(is&&retiredName(was.delivery)&&is.delivery!==was.delivery){assert.ok(!retiredName(is.delivery),supplier+'/'+site+' names a live deliverer');assert.deepEqual(is.lines,was.lines);accounts[site]={...was,delivery:is.delivery};}}
// 22 October 2026 (the owner): Higa Liquor closes and Sakura sells and supplies all the alcohol, on Sakura Trading's round
// (commerce/trade-round.js; the Higas' round since 21 October). Higa Liquor's supplier record and accounts are gone; what
// each business ordered from it is now the `alcohol` of its Sakura account, line for line, Mr Fujita's shed an account
// of its own; Sakura's own lager is its own buying (SOURCED_FROM is empty); Sakura's supplier record lists the drink; the
// accounts that take drink say so in their why and delivery; every account keeps its shelf lines.
assert.equal(now.SUPPLIERS['higa-saketen'],undefined);assert.equal(now.ACCOUNTS['higa-saketen'],undefined);
for(const [site,was] of Object.entries(legacy.ACCOUNTS['higa-saketen'])){if(site==='market')continue;assert.deepEqual(now.ACCOUNTS.sakura[site].alcohol,was.lines,site+' orders the same drink from Sakura');}
assert.equal(legacy.SOURCED_FROM.beer,'higa-saketen');assert.deepEqual(now.SOURCED_FROM,{},'Sakura buys its own lager');legacy.SOURCED_FROM={};
assert.deepEqual(now.ACCOUNTS.sakura['fujita-shed'].lines,[],'Mr Fujita takes only the beer');
legacy.ACCOUNTS.sakura['fujita-shed']={...legacy.ACCOUNTS['higa-saketen']['fujita-shed'],lines:[],alcohol:legacy.ACCOUNTS['higa-saketen']['fujita-shed'].lines};
delete legacy.SUPPLIERS['higa-saketen'];delete legacy.ACCOUNTS['higa-saketen'];
legacy.SUPPLIERS.sakura={...legacy.SUPPLIERS.sakura,goods:now.SUPPLIERS.sakura.goods,alcohol:now.SUPPLIERS.sakura.alcohol};
for(const [site,keys] of Object.entries({izakaya:['alcohol'],ramen:['alcohol','why','delivery'],'coral-bay-bar':['alcohol','why','delivery'],'fujita-shed':['why','delivery']})){
 const was=legacy.ACCOUNTS.sakura[site],is=now.ACCOUNTS.sakura[site];assert.deepEqual(is.lines,was.lines,site+' keeps its shelf lines');
 const next={...was};for(const key of keys)next[key]=is[key];legacy.ACCOUNTS.sakura[site]=next;}
// 24 October 2026 (the owner): the cold cabinet's shelves were numbered from the top, against the rule that counts them
// from the bottom, so every drink stood the other way up from its `placed` note (tea low, children's drinks high). Each
// line's shelves are mirrored, top for bottom, and World walks them up each column again; nothing else about a shelf moves.
{const {FRIDGE_LEVELS}=await import('../src/world/interiors/sakura-layout.js'),mirror=y=>FRIDGE_LEVELS[FRIDGE_LEVELS.length-1-FRIDGE_LEVELS.indexOf(y)];
 const fridge=Object.keys(legacy.SAKURA_SHELVES).filter(id=>legacy.SAKURA_SHELVES[id].fitting==='fridge');
 for(const id of fridge){const was=legacy.SAKURA_SHELVES[id],is=now.SAKURA_SHELVES[id];
  assert.deepEqual(is.levels,was.levels.map(mirror).sort((a,b)=>a-b),id+' stands mirrored in its column');legacy.SAKURA_SHELVES[id]={...was,levels:is.levels};}
 const order=Object.keys(now.SAKURA_SHELVES).filter(id=>fridge.includes(id));let i=0;
 legacy.SAKURA_SHELVES=Object.fromEntries(Object.entries(legacy.SAKURA_SHELVES).map(([id,s])=>fridge.includes(id)?[order[i],legacy.SAKURA_SHELVES[order[i++]]]:[id,s]));}
for(const name of Object.keys(legacy.linesFor))if(!live(name))delete legacy.linesFor[name];
for(const [name,want] of Object.entries(now.linesFor)){assert.ok(castMember(name),name+' buys at Sakura but is not in the cast');for(const line of legacy.linesFor[name]||[])assert.ok(want.includes(line),name+' keeps the '+line);legacy.linesFor[name]=want;}

test('every legacy export, shelf, atlas cell and flavour shift comes back from the data unchanged',()=>{
 assert.deepEqual(Object.keys(now).sort(),Object.keys(legacy).sort());
 for(const key of Object.keys(legacy)){if(key==='geometry')continue;assert.deepStrictEqual(now[key],legacy[key],key);}
});

test('order is kept where World reads it in order',()=>{
 for(const key of ['STORE_BRANDS','PACKS','FLAVOURS','MERCHANDISING','SOURCED_FROM','SAKURA_SHELVES'])assert.deepEqual(Object.keys(now[key]),Object.keys(legacy[key]),key);
 for(const key of ['BRAND_ATLAS_KEYS','DRINKABLE'])assert.deepEqual(now[key],legacy[key],key);
 for(const key of ['STORE_ITEMS','GROCERY_ITEMS','SHOP_STOCK'])assert.deepEqual(now[key].map(i=>i.id),legacy[key].map(i=>i.id),key);
 for(const [id,list] of Object.entries(legacy.FLAVOURS))assert.deepEqual(now.FLAVOURS[id].map(f=>f[0]),list.map(f=>f[0]),id);
});

test('every pack is built to the same geometry, on the shelf, in the hand and as fresh food',()=>{
 assert.deepEqual(Object.keys(now.geometry).sort(),Object.keys(legacy.geometry).sort());
 for(const [id,g] of Object.entries(legacy.geometry))assert.deepStrictEqual(now.geometry[id],g,id);
});
