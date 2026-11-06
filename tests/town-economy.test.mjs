import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GOODS,ALCOHOL,measureMargin} from '../src/economy/goods.js';
import {createEconomy,simulateDay,closeYear,barTrade,BUSINESSES,pour} from '../src/economy/town-economy.js';

const day=n=>new Date(Date.UTC(1997,0,1+n));

test('every good climbs the 1997 price ladder: mainland, ferry, Sakura, the shelf, the bar',()=>{
 for(const [id,g] of Object.entries(GOODS)){
  assert.ok(g.wholesale>0&&g.freight>0,id);
  assert.ok(g.trade>g.wholesale+g.freight,id+': Sakura sells on above her landed cost');
  if(g.retail)assert.ok(g.retail>g.trade,id+': the shelf price is above the trade price');
 }
 // The bars pay Sakura's trade price for drink (Higa Liquor's until it closed, 22 October 2026): a tenth over the floor.
 for(const id of Object.keys(ALCOHOL)){
  assert.ok(barTrade(id)>GOODS[id].trade,id+': Sakura sells to bars above its own trade floor');
  const m=measureMargin(id,'minato',barTrade(id));
  // Spirits earn their bar three to four times over by the glass; draught, about two and a half.
  if(m&&m.measures>1)assert.ok(m.bottle>=barTrade(id)*(id==='beer-keg'?2.2:2.8)&&m.bottle<=barTrade(id)*7,id+': sold by the measure ('+m.bottle+' from '+barTrade(id)+')');
 }
 // Real 1997 prices: a can of beer ¥220, a large bottle at the bar ¥600, a mug of draught ¥450.
 assert.equal(GOODS['beer-can'].retail,220);assert.equal(GOODS['beer-bottle'].measure.minato.price,600);
 assert.equal(measureMargin('awamori-720').measures,12,'Twelve 60 ml glasses in a 720 ml bottle');
});

test('nothing appears by itself: stock only rises when it is delivered',()=>{
 const s=createEconomy();
 for(let n=0;n<120;n++){
  const before=JSON.parse(JSON.stringify(s.biz));
  const events=simulateDay(s,day(n));
  for(const [biz,b] of Object.entries(s.biz))for(const [good,qty] of Object.entries(b.stock)){
   assert.ok(Number.isInteger(qty)&&qty>=0,biz+' '+good+' stock is a real count');
   const came=events.filter(e=>(e.kind==='ferry'&&biz==='sakura'||e.kind==='delivery'&&e.to===biz)&&e.good===good).reduce((t,e)=>t+e.qty,0);
   assert.ok(qty-(before[biz].stock[good]|0)<=came,`${biz} ${good} rose by ${qty-(before[biz].stock[good]|0)} with ${came} delivered on day ${n}`);
  }
  if(events.some(e=>e.kind==='typhoon'))assert.ok(!events.some(e=>e.kind==='ferry'),'No ferry in a typhoon');
 }
});

test('a bar pours from real bottles until they are empty',()=>{
 const s=createEconomy();s.biz.minato.stock['awamori-720']=1;s.biz.minato.open['awamori-720']=0;s.today={};
 let glasses=0;while(pour(s,'minato','awamori-720'))glasses++;
 assert.equal(glasses,12,'One bottle, twelve glasses, then nothing until the next is delivered');
 assert.equal(s.biz.minato.stock['awamori-720'],0);
});

test('the town has its ups and downs and balances over the year',()=>{
 const s=createEconomy(),start=s.households.cash,years=[];
 for(let y=0;y<3;y++){for(let n=0;n<365;n++)simulateDay(s,day(y*365+n));years.push({...closeYear(s),end:s.households.cash});}
 for(const [i,y] of years.entries()){
  assert.ok(Math.abs(y.end-start)/start<.3,`Year ${i+1}: households end near where they started (${y.end} from ${start})`);
  const minato=y.monthly.map(m=>m.minato);assert.ok(Math.max(...minato)/Math.min(...minato)>1.6,'Minato has busy months and quiet ones');
  for(const [id,low] of Object.entries(y.lowest))assert.ok(low>=0,id+' never owes anybody');
  assert.ok(y.stockouts/y.demand<.03,'Shelves are rarely empty: '+(y.stockouts/y.demand*100).toFixed(1)+'%');
  assert.ok(y.imports>0&&y.exports>0,'Goods come in on the ferry and fish go out');
 }
 // Over the years the town neither drains nor floods with money.
 assert.ok(Math.abs(years[2].end-years[1].end)/start<.15,'Year on year, the town is in balance');
 for(const id of Object.keys(BUSINESSES))assert.ok(s.biz[id].cash>0,id+' is trading at the end');
});

test('every business in the economy is kept by somebody in the cast, and Umi-no-yu by its owner, Grandmother Higa',async()=>{
 const {CAST_NAMES}=await import('../src/people/cast.js');
 for(const [id,b] of Object.entries(BUSINESSES))assert.ok(CAST_NAMES.includes(b.owner),id+': '+b.owner+' is in the cast');
 // Higa Liquor closed on 22 October 2026: she keeps the bath only, and the bars buy their drink from Sakura.
 assert.equal(BUSINESSES.onsen.owner,'Grandmother Higa');assert.equal(BUSINESSES.higa,undefined,'Higa Liquor trades no more');
 for(const [id,b] of Object.entries(BUSINESSES))if(b.supplier)assert.equal(b.supplier,'sakura',id+' buys from Sakura');
 const s=createEconomy();for(const id of Object.keys(ALCOHOL))assert.ok(s.biz.sakura.stock[id]>0,'Sakura keeps '+id+' in its stock room');
});
