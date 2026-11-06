/**
 * Sakura's paperwork as the web edition shows it (the owner, 19 October 2026: "I'd like the documents and spreadsheets
 * to be realistic"; AGENTS.md, the web edition): the till roll, the stock book, the week's rota, the delivery note to
 * an account, as a small Okinawan konbini and its wholesaler wrote them in October 1997.
 *
 * On the web nothing runs the shop's books (edition.js `liveDocuments`), so these are one deterministic snapshot made
 * from the data: the products and their tax-inclusive prices and unit costs (products-data.js, shop-stock.js), who
 * supplies whom (merchandising.js: Sakura Trading, the town's one wholesaler since it took Front-Row's stationery and Higa
 * Liquor's drink, 22 October 2026) and the rota
 * (sakura-rota.js). The same data always makes the same papers, and every total is the sum of its lines
 * (tests/paperwork.test.mjs). On Linux the ledger is the live shop's (shop-ledger.js).
 *
 * The numbers:
 * - Prices are 1997's, consumption tax (5 % since April 1997) included; a till roll prints the tax inside the total,
 *   内税 = floor(total × 5 / 105).
 * - What sold on the day is a small shop's Friday: the counts come from each line's shelf (where it stands, what it is
 *   for: merchandising.js zones) and a fixed seed, never a random draw at run time.
 * - Trade accounts pay the shelf price less 10 %, rounded down to the yen: a wholesaler's discount to a regular, the
 *   way the depot bills the izakaya's crates.
 * - The lager is Sakura Trading's own buying since Higa Liquor closed (22 October 2026), so no supplier bills Sakura for
 *   it any more: Higa Liquor's invoice went with its trade, as Front-Row's did.
 * - Sakura's own stationery (till rolls, ledgers, labels, delivery pads) is the list below, at 1997 shop prices, with why
 *   the shop uses each.
 */
import {SHOP_STOCK,stockSpec} from './shop-stock.js';
import {ACCOUNTS,SUPPLIERS} from './merchandising.js';
import {PRODUCT_BY_ID} from './products-data.js';
import {SAKURA_HOURS,SAKURA_HOURS_TEXT} from './sakura-rota.js';
import {SHOP_FLOAT} from './sakura-economy.js';

/** The tax inside a tax-inclusive total (5 %, from April 1997). */
export const includedTax=total=>Math.floor(total*5/105);
/** A trade account's price: the shelf price less 10 %, rounded down. */
export const tradePrice=shelf=>Math.floor(shelf*9/10);
export const yen=n=>(n<0?'-¥':'¥')+Math.abs(n).toLocaleString('en-GB');

/** A small deterministic sequence from a word (FNV-1a, then an LCG): the same papers every time. */
function seeded(word){let h=2166136261;for(const c of word){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return ()=>(h=(Math.imul(h,1664525)+1013904223)>>>0)/4294967296;}

/** How a Friday's sales lean by where a line stands (merchandising.js ZONES): drinks and the counter sell most. */
const ZONE_PACE=Object.freeze({drinks:[9,22],counter:[8,14],fresh:[5,12],daily:[2,7],pantry:[1,5],sweets:[3,9]});
const zoneOf=id=>PRODUCT_BY_ID[id]?.purpose?.zone;

/** The stationery Sakura keeps for its own till and books: Front-Row's trade list until Sakura took over the stationery (22 October 2026), its own stock now. */
export const STATIONERY=Object.freeze([
 Object.freeze({id:'receipt-rolls',name:'Till receipt rolls, 58 mm (box of 10)',unit:'box',price:1200,why:'The register prints a roll in about two trading days.'}),
 Object.freeze({id:'ledger',name:'Account ledger, A4, 100 leaves',unit:'book',price:780,why:'Sakura Trading’s accounts book, one a quarter.'}),
 Object.freeze({id:'labels',name:'Price-gun labels (10 rolls)',unit:'pack',price:450,why:'Prices on the cans and packets.'}),
 Object.freeze({id:'delivery-pads',name:'Delivery note pads, carbon, 50 sets',unit:'pad',price:520,why:'The depot’s 納品書, one copy for the account.'}),
]);

const DAY='Fri 17 October 1997',WEEK=['Mon 13','Tue 14','Wed 15','Thu 16','Fri 17','Sat 18','Sun 19'];

/** The till roll: Friday's Z report from register 01. */
function tillRoll(){
 const next=seeded('sakura-z-1997-10-17');
 const lines=SHOP_STOCK.map(item=>{const [lo,hi]=ZONE_PACE[zoneOf(item.id)]||[1,4];const qty=lo+Math.floor(next()*(hi-lo+1));return {id:item.id,name:item.name,qty,price:item.cost,amount:qty*item.cost};});
 const total=lines.reduce((s,l)=>s+l.amount,0),items=lines.reduce((s,l)=>s+l.qty,0),customers=Math.round(items/2.4);
 return {id:'till-roll',kind:'till',title:'Sakura Shōten · Z report',jp:'精算レシート',from:'Sakura Shōten, Main Street, Minato',date:DAY,number:'REG 01 · Z 0291',
  hours:SAKURA_HOURS_TEXT,columns:['Item','Qty','Price','Amount'],rows:lines.map(l=>[l.name,l.qty,l.price,l.amount]),
  totals:{items,customers,total,tax:includedTax(total),float:SHOP_FLOAT,drawer:SHOP_FLOAT+total},
  notes:['Prices include consumption tax (5 %).','Drawer = float + takings; the takings are banked at the Port Terminal’s post counter on Monday.']};
}

/** The stock book at the close of Friday: every shelf full again after the restock, and what waits in the back room. */
function stockBook(){
 const next=seeded('sakura-stock-1997-10-17');
 const rows=SHOP_STOCK.map(item=>{const shelf=item.capacity,back=6*Math.floor(next()*5);const qty=shelf+back;return [item.name,shelf,back,item.cost,item.unitCost,qty*item.unitCost];});
 return {id:'stock-book',kind:'sheet',title:'Sakura Shōten · Stock book',jp:'在庫表',from:'Sakura Shōten',date:DAY+', after closing',number:'Stock count 42',
  columns:['Item','On shelf','Back room','Retail','Unit cost','Value at cost'],rows,
  totals:{lines:rows.length,units:rows.reduce((s,r)=>s+r[1]+r[2],0),value:rows.reduce((s,r)=>s+r[5],0)},
  notes:['Unit cost is what Sakura pays its suppliers: all of it Sakura Trading’s own buying, the lager too since Higa Liquor closed.']};
}

/** The week's rota from the shop's own hours (sakura-rota.js): Thuan on weekdays, Saturday shut, Nhung on Sunday. */
function rota(){
 const hours=(SAKURA_HOURS.close-SAKURA_HOURS.open)/60;
 const rows=WEEK.map((day,i)=>i===5?[day+' Oct','closed','—',0]:[day+' Oct',i<5?'Thuan':'Nhung',SAKURA_HOURS_TEXT,hours]);
 const by=name=>rows.filter(r=>r[1]===name).reduce((s,r)=>s+r[3],0);
 return {id:'rota',kind:'sheet',title:'Sakura Shōten · Counter rota',jp:'勤務表',from:'Sakura Shōten',date:'Week of 13–19 October 1997',number:'Week 42',
  columns:['Day','At the counter','Hours','Hours worked'],rows,totals:{Thuan:by('Thuan'),Nhung:by('Nhung'),total:rows.reduce((s,r)=>s+r[3],0)},
  notes:['The till closes at 20:00; the last half hour is the restock, the shutter down at 20:30.','Thuan comes over on the 08:30 boat on weekdays; the shop shuts on Saturdays; Nhung keeps Sunday, her day away from the clinic.']};
}

/** A delivery note from the depot (Sakura Trading) to one account, with that account's own lines (merchandising.js). */
function deliveryNote(site='izakaya'){
 const account=ACCOUNTS.sakura[site],next=seeded('depot-'+site+'-1997-10-13');
 const rows=account.lines.map(id=>{const spec=stockSpec(id),qty=6*(1+Math.floor(next()*3)),unit=tradePrice(spec.cost);return [spec.name,qty,unit,qty*unit];});
 const total=rows.reduce((s,r)=>s+r[3],0);
 return {id:'delivery-'+site,kind:'invoice',title:'Sakura Trading · Delivery note',jp:'納品書',from:SUPPLIERS.sakura.name+', Quay Warehouse depot',to:account.name+' (attn. '+(account.owner||account.contact)+')',
  date:'Mon 13 October 1997',number:'D-1997-1013-'+site.toUpperCase().slice(0,3),columns:['Item','Qty','Trade price','Amount'],rows,
  totals:{subtotal:total,tax:includedTax(total),total},notes:[account.delivery,'Trade price: shelf price less 10 %. Tax included. Payable at the end of the month.']};
}

/** Every paper, in the order the folder holds them. */
export function sakuraPaperwork(){return [tillRoll(),stockBook(),rota(),deliveryNote('izakaya')];}

const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
const cell=v=>typeof v==='number'?(Number.isInteger(v)&&Math.abs(v)>=100?yen(v):String(v)):String(v);
/** The folder on the back-office desk: one paper at a time, as printed. */
export function createPaperworkView(papers=sakuraPaperwork()){
 const root=el('section',undefined,'sakura-ledger sakura-paperwork'),tabs=el('nav',undefined,'sakura-ledger-tabs');tabs.setAttribute('aria-label','Papers in the folder');
 const head=el('dl',undefined,'sakura-ledger-summary'),scroll=el('div',undefined,'sakura-ledger-scroll'),note=el('p',undefined,'sakura-ledger-note');
 scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Sakura paperwork');root.append(tabs,head,scroll,note);
 let selected=papers[0].id;
 const buttons=papers.map(p=>{const b=el('button',p.jp+' '+p.title.split(' · ').pop());b.type='button';b.onclick=()=>{selected=p.id;render();};tabs.append(b);return [p.id,b];});
 function render(){
  const p=papers.find(x=>x.id===selected);for(const [id,b] of buttons)b.setAttribute('aria-pressed',String(id===selected));
  head.replaceChildren();for(const [k,v] of [['From',p.from],...(p.to?[['To',p.to]]:[]),['Date',p.date],['No.',p.number]]){const d=el('div');d.append(el('dt',k),el('dd',v));head.append(d);}
  const table=el('table');table.append(el('caption',p.title+' · '+p.jp));const thead=el('thead'),tr=el('tr');for(const c of p.columns){const th=el('th',c);th.scope='col';tr.append(th);}thead.append(tr);
  const tbody=el('tbody');for(const r of p.rows){const row=el('tr');r.forEach((v,i)=>row.append(el('td',i&&p.kind!=='sheet'||typeof v==='number'&&v>=100?cell(v):String(v))));tbody.append(row);}
  const tfoot=el('tfoot');for(const [k,v] of Object.entries(p.totals)){const row=el('tr'),label=el('th',k[0].toUpperCase()+k.slice(1));label.colSpan=p.columns.length-1;label.scope='row';row.append(label,el('td',typeof v==='number'&&!['items','customers','lines','units','crates','Thuan','Nhung'].includes(k)&&p.id!=='rota'?yen(v):String(v)));tfoot.append(row);}
  table.append(thead,tbody,tfoot);scroll.replaceChildren(table);note.textContent=p.notes.join(' ');
 }
 render();return {element:root,update(){}};
}
