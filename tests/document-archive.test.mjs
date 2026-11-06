import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreArchive,fileDocument,seedArchive,retainArchive,archiveRows,linkedRecords,auditArchive,YEAR_MINUTES} from '../src/office/archive.js';
import {restoreSakura,shopEntry,advanceDeliveries} from '../src/commerce/sakura-economy.js';
import {createArchiveView} from '../src/office/archive-ui.js';
import {Element,installDOM} from './fixtures.mjs';
const now=Date.UTC(2026,9,2,12)/60000;
test('one-year retention spans year rollover, keeps sequence and never resurrects expired records',()=>{
 const state={minutes:now};const old=fileDocument(state,{type:'Invoice',title:'Old',issued:now-YEAR_MINUTES+1});const fresh=fileDocument(state,{type:'Receipt',title:'New'});retainArchive(state.documentArchive,now+1);assert.ok(!state.documentArchive.records.some(r=>r.id===old.id));assert.ok(state.documentArchive.records.some(r=>r.id===fresh.id));
 const restored=restoreArchive(JSON.parse(JSON.stringify(state.documentArchive)));assert.equal(restored.sequence,2);retainArchive(restored,now-100);assert.equal(restored.watermark,now+1);assert.equal(fileDocument({documentArchive:restored},{type:'Invoice',issued:now-YEAR_MINUTES},now),null);
});
test('source filing is idempotent and corrections preserve original evidence',()=>{
 const state={minutes:now};const spec={type:'Invoice',title:'Test',source:'invoice-1',text:'Original'};const a=fileDocument(state,spec),b=fileDocument(state,spec);assert.equal(a.id,b.id);assert.equal(state.documentArchive.records.length,1);fileDocument(state,{...spec,text:'Corrected',author:'Thuan'},now+4);assert.equal(a.versions[0].text,'Original');assert.equal(a.text,'Corrected');assert.equal(a.filed,now+4);
});
test('opening records cover twelve monthly folders, are searchable and support a complete discrepancy audit',()=>{
 const state={minutes:now};seedArchive(state,now);const count=state.documentArchive.records.length;seedArchive(state,now);assert.equal(state.documentArchive.records.length,count);assert.equal(new Set(archiveRows(state.documentArchive,{type:'Handover'}).map(r=>Math.floor((now-r.issued)/43200))).size,12);
 const invoice=archiveRows(state.documentArchive,{query:'bottled tea',type:'Invoice'})[0];assert.ok(linkedRecords(state.documentArchive,invoice).some(r=>r.type==='Order'));assert.ok(linkedRecords(state.documentArchive,invoice).some(r=>r.type==='Delivery note'));assert.equal(auditArchive(state.documentArchive).length,2);state.documentArchive.findings[0].status='Resolved';state.documentArchive.findings[0].notes='Supplier credit agreed';auditArchive(state.documentArchive);assert.equal(restoreArchive(state.documentArchive).findings[0].status,'Resolved');
 assert.ok(archiveRows(state.documentArchive,{type:'Workbook'}).length>=3);assert.ok(archiveRows(state.documentArchive,{organisation:'Community Hall',type:'Schedule'}).length);
});
test('shop postings file before the short journal is trimmed and supplier delivery links to its order',()=>{
 const state={minutes:now,sakura:restoreSakura()};state.sakura.cash=10000;
 for(let i=0;i<410;i++)shopEntry(state,{minute:now+i,kind:'Sale',item:'Tea',revenue:100,buyer:'Johansson'});
 assert.equal(state.sakura.journal.length,400);assert.equal(state.documentArchive.records.filter(r=>r.type==='Receipt').length,410);
 const order=shopEntry(state,{minute:now+500,kind:'Stock purchase',item:'Tea',quantity:4,cost:200,buyer:'Wholesaler'});state.sakura.deliveries.push({item:'tea',quantity:4,due:now+530,archiveOrder:order.id});advanceDeliveries(state,now+530);
 const delivery=state.documentArchive.records.find(r=>r.type==='Delivery note');assert.equal(delivery.transaction,order.transaction);assert.ok(linkedRecords(state.documentArchive,delivery).some(r=>r.type==='Invoice'));assert.equal(auditArchive(state.documentArchive).length,0);
});
const all=n=>[n,...n.children.flatMap(all)];
test('register search, document links, empty state and audit notes are usable',()=>{
 installDOM();document.createElement=tag=>{const e=new Element();e.tagName=tag;return e;};const state={minutes:now};seedArchive(state,now);let saved=0;const root=createArchiveView(state.documentArchive,{save:()=>saved++});
 let nodes=all(root);const search=nodes.find(n=>n.tagName==='input');search.value='bottled tea';search.oninput();assert.equal(all(root).find(n=>n.tagName==='tbody').children.length,4);
 const reference=all(root).find(n=>n.tagName==='button'&&n.textContent?.startsWith('DOC-'));reference.onclick();assert.match(all(root).find(n=>n.className==='archive-paper').children[1].textContent,/RECEIPT|INVOICE|DELIVERY|PURCHASE/);
 all(root).find(n=>n.textContent==='Audit reports').onclick();const notes=all(root).find(n=>n.tagName==='textarea');notes.value='Contacted supplier; credit note agreed';all(root).find(n=>n.textContent==='Resolve finding').onclick();assert.equal(state.documentArchive.findings[0].status,'Resolved');assert.ok(saved>0);
 all(root).find(n=>n.textContent==='Document register').onclick();const input=all(root).find(n=>n.tagName==='input');input.value='not-a-record';input.oninput();assert.match(all(root).find(n=>n.tagName==='p'&&n.textContent?.startsWith('No matching')).textContent,/No matching/);
});
