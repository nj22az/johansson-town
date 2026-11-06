// The web edition's Sakura paperwork (src/commerce/paperwork.js): realistic, deterministic, and every total adds up.
import test from 'node:test';
import assert from 'node:assert/strict';
import {sakuraPaperwork,includedTax,tradePrice,STATIONERY} from '../src/commerce/paperwork.js';
import {SHOP_STOCK,stockSpec} from '../src/commerce/shop-stock.js';
import {ACCOUNTS} from '../src/commerce/merchandising.js';

const papers=sakuraPaperwork(),paper=id=>papers.find(p=>p.id===id);
const sum=(rows,i)=>rows.reduce((s,r)=>s+r[i],0);

test('the same data makes the same papers',()=>{
 assert.deepEqual(sakuraPaperwork(),papers);
});

test('every paper is dated October 1997 and names its issuer',()=>{
 for(const p of papers){assert.match(p.date,/October 1997|Oct/);assert.ok(p.from&&p.number&&p.jp,p.id);}
});

test('the till roll: every line is quantity × shelf price, and the totals are the lines',()=>{
 const z=paper('till-roll');
 for(const [name,qty,price,amount] of z.rows){assert.equal(amount,qty*price,name);assert.equal(price,SHOP_STOCK.find(s=>s.name===name).cost,name);}
 assert.equal(z.totals.total,sum(z.rows,3));assert.equal(z.totals.items,sum(z.rows,1));
 assert.equal(z.totals.tax,includedTax(z.totals.total));assert.equal(z.totals.drawer,z.totals.float+z.totals.total);
 assert.ok(z.totals.customers>0&&z.totals.customers<=z.totals.items);
});

test('the stock book values each line at its unit cost',()=>{
 const s=paper('stock-book');
 for(const [name,shelf,back,retail,unit,value] of s.rows){const spec=SHOP_STOCK.find(x=>x.name===name);assert.equal(shelf,spec.capacity);assert.equal(retail,spec.cost);assert.equal(unit,spec.unitCost);assert.equal(value,(shelf+back)*unit,name);}
 assert.equal(s.totals.value,sum(s.rows,5));assert.equal(s.totals.units,sum(s.rows,1)+sum(s.rows,2));assert.equal(s.totals.lines,SHOP_STOCK.length);
});

test('the rota follows the shop’s hours: Thuan on weekdays, shut on Saturday, Nhung on Sunday',()=>{
 const r=paper('rota');assert.equal(r.rows.length,7);
 assert.deepEqual(r.rows.map(x=>x[1]),['Thuan','Thuan','Thuan','Thuan','Thuan','closed','Nhung']);assert.equal(r.rows[5][3],0);
 assert.equal(r.totals.total,sum(r.rows,3));assert.equal(r.totals.Thuan+r.totals.Nhung,r.totals.total);
});

test('the depot’s delivery note bills the account’s own lines at the trade price',()=>{
 const d=paper('delivery-izakaya'),lines=ACCOUNTS.sakura.izakaya.lines.map(id=>stockSpec(id).name);
 assert.deepEqual(d.rows.map(r=>r[0]),lines);
 for(const [name,qty,unit,amount] of d.rows){assert.equal(unit,tradePrice(SHOP_STOCK.find(s=>s.name===name).cost));assert.equal(amount,qty*unit);}
 assert.equal(d.totals.total,sum(d.rows,3));assert.equal(d.totals.subtotal,d.totals.total);assert.equal(d.totals.tax,includedTax(d.totals.total));
});

// Higa Liquor's invoice went with its trade (Sakura Trading's since 22 October 2026, when the shop closed): the lager is
// Sakura's own buying, as everything in the stock book.
test('no Higa Liquor invoice any more; the lager is Sakura Trading’s own buying',()=>{
 assert.equal(papers.some(p=>p.id==='higa-invoice'),false);
 assert.deepEqual(papers.map(p=>p.id),['till-roll','stock-book','rota','delivery-izakaya']);
 assert.equal(stockSpec('beer').unitCost>0,true);assert.match(paper('stock-book').notes.join(' '),/Sakura Trading’s own buying, the lager too/);
});

// Front-Row's stationery invoice went with its trade (Sakura's since 22 October 2026): the shop's own stationery list stays.
test('no Front-Row invoice any more; Sakura’s own stationery is priced',()=>{
 assert.equal(sakuraPaperwork().some(p=>p.id==='frontrow-invoice'),false);
 assert.ok(STATIONERY.length>=4&&STATIONERY.every(s=>s.price>0&&s.why.length>10));
});
