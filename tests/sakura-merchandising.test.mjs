import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MERCHANDISING,ZONES,ZONE_OF_SHELF,linesFor} from '../src/commerce/merchandising.js';
import {SHOP_STOCK} from '../src/commerce/shop-stock.js';
import {SAKURA_SHELVES} from '../src/world/interiors/sakura-layout.js';

const residents=new Set(JSON.parse(await readFile(new URL('../guide/residents.json',import.meta.url))).map(r=>r.name));

test('every line in Sakura is there for somebody, for a reason, in its place',()=>{
 for(const item of SHOP_STOCK){
  const m=MERCHANDISING[item.id];assert.ok(m,item.id+' has a reason to be stocked');
  assert.ok(ZONES[m.zone],item.id+' belongs to a zone of the floor');
  assert.ok(m.why.length>20&&m.placed.length>20,item.id+' says why it is bought and why it stands there');
  assert.ok(m.for.length>=1&&m.for.every(n=>residents.has(n)),item.id+' is bought by people who live here: '+m.for.join(', '));
  const shelf=SAKURA_SHELVES[item.id];assert.ok(shelf,item.id+' is on a shelf');
  assert.equal(ZONE_OF_SHELF[shelf.fitting],m.zone,item.id+' stands in the '+m.zone+' zone');
 }
 assert.deepEqual(Object.keys(MERCHANDISING).sort(),SHOP_STOCK.map(i=>i.id).sort(),'Nothing is stocked without a line, and no line without stock');
});

test('the floor follows its philosophy',()=>{
 const level=id=>Math.min(...SAKURA_SHELVES[id].levels);
 // Children's sweets low, a grown-up's snacks higher.
 assert.ok(level('candy')<level('chips'),'Sweets for children sit below the crisps');
 // Beer in the column nearest the till; the bestselling drink first.
 assert.equal(SAKURA_SHELVES.beer.fridge,3);assert.equal(SAKURA_SHELVES.tea.fridge,0);
 // The heaviest thing in the shop goes low.
 assert.equal(level('detergent'),Math.min(...Object.values(SAKURA_SHELVES).filter(s=>s.fitting==='east').map(s=>Math.min(...s.levels))));
 // Most people in town have a reason to come in.
 const shoppers=[...residents].filter(n=>linesFor(n).length);assert.ok(shoppers.length>=residents.size*.75,'Most of the town shops here: '+shoppers.length+'/'+residents.size);
});

test('Sakura supplies every business in town, with lines it really stocks',async()=>{
 const {TRADE_ACCOUNTS,tradeBuyersOf}=await import('../src/commerce/merchandising.js');
 const {readdir}=await import('node:fs/promises');
 const sources=(await Promise.all((await readdir(new URL('../src/world/',import.meta.url),{recursive:true})).filter(f=>f.endsWith('.js')).map(f=>readFile(new URL('../src/world/'+f,import.meta.url),'utf8')))).join('\n');
 const stock=new Set(SHOP_STOCK.map(i=>i.id));
 for(const [site,a] of Object.entries(TRADE_ACCOUNTS)){
  assert.ok(new RegExp(`id:'${site}'|'${site}'`).test(sources),site+' is a real place in town');
  assert.ok(a.owner?residents.has(a.owner):a.contact,(a.owner||a.contact)+' orders for '+a.name);
  // An account orders shelf lines, or only drink (Mr Fujita's shed: the beer, since the Higas' van went).
  assert.ok((a.lines.length||a.alcohol?.length)&&a.lines.every(l=>stock.has(l)),a.name+' orders lines Sakura stocks');
  assert.ok(a.why.length>30&&a.delivery.length>20,a.name+' says why and when');
 }
 for(const id of ['izakaya','ramen','onsen','frontrow','form3d','office'])assert.ok(TRADE_ACCOUNTS[id],id+' buys from Sakura');
 // Alcohol is Sakura Trading's since Higa Liquor closed (22 October 2026): named `alcohol` goods on an account, never shelf
 // lines. Office supplies are Sakura's since the same day (Front-Row's, when Nhung became the island doctor): named
 // `stationery` goods on an account, never shelf lines.
 const {ACCOUNTS,SUPPLIERS,suppliersOf}=await import('../src/commerce/merchandising.js');
 for(const a of Object.values(TRADE_ACCOUNTS))assert.ok(!a.lines.includes('beer')&&!a.lines.includes('notebook'),a.name+' gets alcohol and stationery from their own suppliers');
 assert.equal(SUPPLIERS['higa-saketen'],undefined,'Higa Liquor supplies nothing since it closed');assert.equal(ACCOUNTS['higa-saketen'],undefined);
 assert.ok(SUPPLIERS.sakura.alcohol.length>=4&&/beer, awamori, sake and shōchū/.test(SUPPLIERS.sakura.goods),'Sakura supplies the drink');
 assert.deepEqual(suppliersOf('izakaya').map(s=>s.supplier),['sakura'],'Minato has one supplier');
 for(const site of ['izakaya','ramen','coral-bay-bar','fujita-shed'])assert.ok(TRADE_ACCOUNTS[site].alcohol?.length&&TRADE_ACCOUNTS[site].alcohol.every(l=>typeof l==='string'&&l.length>3),site+' takes its drink from Sakura');
 assert.deepEqual(Object.keys(TRADE_ACCOUNTS).filter(site=>TRADE_ACCOUNTS[site].alcohol).sort(),['coral-bay-bar','fujita-shed','izakaya','ramen'],'the round’s four customers, and nobody else on account');
 assert.equal(SUPPLIERS.frontrow,undefined,'Front-Row supplies nothing since Nhung became the doctor');assert.equal(ACCOUNTS.frontrow,undefined);
 assert.ok(SUPPLIERS.sakura.stationery.length>=5&&/stationery/.test(SUPPLIERS.sakura.goods),'Sakura supplies the stationery');
 for(const site of ['office','community-kitchen','school','koban'])assert.ok(TRADE_ACCOUNTS[site].stationery?.length&&TRADE_ACCOUNTS[site].stationery.every(l=>typeof l==='string'&&l.length>3),site+' takes its stationery from Sakura');
 for(const [id,s] of Object.entries(SUPPLIERS)){assert.ok(residents.has(s.owner),s.owner+' runs '+s.name);for(const [site,a] of Object.entries(ACCOUNTS[id])){assert.ok(new RegExp(`id:'${site}'|'${site}'`).test(sources),site+' is a real place');assert.ok(a.owner?residents.has(a.owner):a.contact,site);}}
 // The florist's trade is Sakura's since Mrs Kinjō retired (docs/CAST-CONSOLIDATION.md addendum 3): decorations ride on the accounts.
 const {decorBuyers}=await import('../src/commerce/merchandising.js');
 assert.equal(SUPPLIERS['rainflower-florist'],undefined,'Rainflower Florist supplies nothing');assert.equal(ACCOUNTS['rainflower-florist'],undefined);
 assert.ok(SUPPLIERS.sakura.decor.length>=5&&/flowers and decorations/.test(SUPPLIERS.sakura.goods),'Sakura supplies the flowers and decorations');
 // The mayor's office's wreaths and bunting went to the Community Hall with its ceremonies (briefs/town-hall-zone.md phase M).
 assert.deepEqual(decorBuyers().sort(),['community-kitchen','izakaya','onsen','school'],'the florist’s old round, on Sakura’s accounts');
 for(const site of decorBuyers())assert.ok(/flower|lantern|wreath|bunting|vase/i.test(TRADE_ACCOUNTS[site].why)&&TRADE_ACCOUNTS[site].decor.every(l=>typeof l==='string'&&l.length>3),site+' says what decorations and why');
 // Only open places trade, and every named owner is somebody in the cast (src/people/cast.js).
 const {CAST_NAMES,PLACES}=await import('../src/people/cast.js');
 const cast=new Set(CAST_NAMES),closed=Object.keys(PLACES).filter(id=>PLACES[id].closed);
 for(const [id,s] of Object.entries(SUPPLIERS)){assert.ok(cast.has(s.owner),s.owner+' is in the cast');
  for(const [site,a] of Object.entries(ACCOUNTS[id])){assert.ok(!closed.includes(site),site+' is closed and orders nothing');if(a.owner)assert.ok(cast.has(a.owner),a.owner+' ('+site+') is in the cast');}}
 assert.ok(SHOP_STOCK.filter(i=>tradeBuyersOf(i.id).length).length>=15,'Half the lines go to a business too');
});
