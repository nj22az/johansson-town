import {SHOP_STOCK} from './shop-stock.js';
import {SHOP_FLOAT} from './sakura-economy.js';
// The sign belongs in front of the money, not inside it: a loss reads -¥300, never ¥-300.
const yen=n=>(n<0?'-¥':'¥')+Math.abs(n).toLocaleString('en-GB');
const date=minute=>'Day '+(Math.floor(minute/1440)+1)+' · '+String(Math.floor(minute%1440/60)).padStart(2,'0')+':'+String(Math.floor(minute%60)).padStart(2,'0');
const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
export function createShopLedgerView(state,getMinutes){
 const root=el('section',undefined,'sakura-ledger'),summary=el('dl',undefined,'sakura-ledger-summary'),tabs=el('nav',undefined,'sakura-ledger-tabs');
 tabs.setAttribute('aria-label','Shop spreadsheet sheets');let selected='sales',last='';
 const sales=el('button','Sales & expenses'),stock=el('button','Stock book');sales.onclick=()=>{selected='sales';last='';update();};stock.onclick=()=>{selected='stock';last='';update();};tabs.append(sales,stock);
 const scroll=el('div',undefined,'sakura-ledger-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Sakura shop spreadsheet');
 const table=el('table'),note=el('p',undefined,'sakura-ledger-note');scroll.append(table);root.append(summary,tabs,scroll,note);
 function update(){
  const shop=state.sakura,key=JSON.stringify([selected,shop.cash,shop.sales,shop.profit,shop.bought,shop.stockSpent,shop.overheads,shop.drawings,shop.stock,shop.journal.at(-1),shop.deliveries]);if(key===last)return;last=key;
  sales.setAttribute('aria-pressed',String(selected==='sales'));stock.setAttribute('aria-pressed',String(selected==='stock'));
  // Gross profit is what the goods made; the shop's result is what is left after the
  // meter has run. Both are shown, because the gap between them is the whole point.
  summary.replaceChildren();
  for(const [label,value] of [['Cash in till',shop.cash],['Sales',shop.sales],['Gross profit',shop.profit+shop.overheads],
   ['Running costs',shop.overheads],['Shop result',shop.profit],['Thuan\u2019s drawings',shop.drawings],
   ['Supplier payments',shop.stockSpent]]){
   const entry=el('div');entry.append(el('dt',label),el('dd',yen(value)));
   if(label==='Shop result'&&value<0)entry.className='sakura-ledger-loss';
   summary.append(entry);
  }
  table.replaceChildren();table.append(el('caption',selected==='sales'?'Sakura Shōten · Sales & expenses':'Sakura Shōten · Stock book'));
  const head=el('thead'),headers=el('tr'),body=el('tbody'),columns=selected==='sales'?['Date / time','Entry','Customer / supplier','Item','Qty','Sales','Cost','Profit','Till']:['Item','On shelf','Back room','Ordered','Retail price','Unit cost'];
  for(const title of columns){const th=el('th',title);th.scope='col';headers.append(th);}head.append(headers);table.append(head,body);
  const rows=selected==='sales'?[...shop.journal].reverse().map(r=>[date(r.minute),r.kind,r.buyer,r.item,r.quantity,r.revenue?yen(r.revenue):'—',r.cost?yen(r.cost):'—',r.profit?yen(r.profit):'—',yen(r.cash)]):SHOP_STOCK.map(item=>{const counts=shop.stock[item.id],incoming=shop.deliveries.filter(d=>d.item===item.id).reduce((sum,d)=>sum+d.quantity,0);return [item.name,counts.shelf+' / '+item.capacity,counts.reserve,incoming||'—',yen(item.cost),yen(item.unitCost)];});
  for(const values of rows){const tr=el('tr');for(const value of values)tr.append(el('td',String(value)));body.append(tr);}
  if(!rows.length){const tr=el('tr'),td=el('td','No transactions yet. Customers arrive during shop hours.');td.colSpan=columns.length;tr.append(td);body.append(tr);}
  note.textContent=(selected==='sales'?'Latest 400 entries. Gross profit = sales less the cost of goods sold; the shop result is that less the running costs, which are billed once per trading day at closing. Thuan\u2019s drawings are her own pay and come out of a profit already made, so they leave the till without changing the result \u2014 and she never draws on the \u00a5'+SHOP_FLOAT.toLocaleString('en-GB')+' float that pays the wholesaler. Supplier payments reduce cash when stock is ordered; they are not deducted from profit twice.':'Thuan checks the back room from 19:30 and restocks by hand after closing at 20:00. Sold-out shelves stay empty during the trading day. Supplier orders are paid from the till and delivered to the back room after 30 town minutes.')+(shop.openingSales?' Earlier sales of '+yen(shop.openingSales)+' predate this ledger; their profit is not estimated.':'')+' The town continues while this book is open. On return, up to one town day of absence is continued.';
 }
 update();return {element:root,update};
}
