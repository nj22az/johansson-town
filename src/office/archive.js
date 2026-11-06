import {TOWN_PAPERS} from './town-papers.js';
/** Central, per-save Community Hall register. Dates use absolute town minutes,
 * not the cosmetic 1997 calendar, so retention survives a December rollover. */
export const YEAR_MINUTES=365*1440;
export const DOCUMENT_TYPES=['Order','Delivery note','Invoice','Receipt','Ledger entry','Schedule','Handover','Message','Flyer','Minutes','Notice','Workbook','Audit report'];
const clean=(v,n=240)=>String(v??'').replace(/[\u0000-\u0008<>]/g,'').slice(0,n);
export function restoreArchive(saved){
 const records=Array.isArray(saved?.records)?saved.records.filter(r=>r&&/^DOC-\d+$/.test(r.id)&&Number.isFinite(r.issued)&&Number.isFinite(r.filed)&&DOCUMENT_TYPES.includes(r.type)).map(r=>({...r,title:clean(r.title),organisation:clean(r.organisation),text:clean(r.text,20000),source:clean(r.source),links:Array.isArray(r.links)?r.links.filter(x=>typeof x==='string'):[],versions:Array.isArray(r.versions)?r.versions.filter(v=>v&&Number.isFinite(v.filed)&&typeof v.text==='string'):[]})):[];
 return {v:1,sequence:records.reduce((n,r)=>Math.max(n,+r.id.slice(4)),Number.isSafeInteger(saved?.sequence)?saved.sequence:0),records,seeded:saved?.seeded===true,watermark:Number.isFinite(saved?.watermark)?saved.watermark:0,findings:Array.isArray(saved?.findings)?saved.findings.filter(f=>f&&typeof f.id==='string'&&Array.isArray(f.references)).map(f=>({...f,status:f.status==='Resolved'?'Resolved':'Open',notes:clean(f.notes,2000)})):[]};
}
export function retainArchive(archive,now){
 if(!Number.isFinite(now))return;
 archive.watermark=Math.max(archive.watermark,now);
 archive.records=archive.records.filter(r=>r.issued>archive.watermark-YEAR_MINUTES);
 archive.findings=archive.findings.filter(f=>f.references.some(id=>archive.records.some(r=>r.id===id)));
}
export function fileDocument(state,spec,now=state.minutes){
 if(!Number.isFinite(now)||!DOCUMENT_TYPES.includes(spec.type))return null;
 const a=state.documentArchive??=restoreArchive();retainArchive(a,now);
 const issued=Number.isFinite(spec.issued)?spec.issued:now;
 if(issued>now||issued<=a.watermark-YEAR_MINUTES)return null;
 const source=clean(spec.source),text=clean(spec.text,20000),existing=source&&a.records.find(r=>r.source===source);
 if(existing){if(existing.text!==text){existing.versions.push({filed:now,text:existing.text,author:existing.author});existing.text=text;existing.filed=now;existing.author=clean(spec.author||'Town clerk');}return existing;}
 const record={id:'DOC-'+String(++a.sequence).padStart(6,'0'),type:spec.type,title:clean(spec.title),organisation:clean(spec.organisation||'Community Hall'),author:clean(spec.author||'Town clerk'),issued,filed:now,source,text,links:[...(spec.links||[])],versions:[],transaction:clean(spec.transaction),quantity:spec.quantity??null,amount:spec.amount??null,opening:spec.opening===true};
 a.records.push(record);return record;
}
export function archiveRows(a,{query='',organisation='',type='',month=''}={}){
 const q=query.trim().toLowerCase();return a.records.filter(r=>(!organisation||r.organisation===organisation)&&(!type||r.type===type)&&(!month||archiveMonth(r.issued)===month)&&(!q||[r.id,r.title,r.organisation,r.text,r.transaction,...r.links].join(' ').toLowerCase().includes(q))).sort((a,b)=>b.issued-a.issued||b.id.localeCompare(a.id));
}
export function archiveMonth(minute){return new Date(Math.floor(minute/1440)*86400000).toISOString().slice(0,7);}
export function archiveDate(minute,now=minute){const d=new Date(Math.floor(minute/1440)*86400000);return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',timeZone:'UTC'})+' · '+(1997+d.getUTCFullYear()-new Date(now*60000).getUTCFullYear());}
export function linkedRecords(a,r){return a.records.filter(x=>x.id!==r.id&&(r.links.includes(x.id)||x.links.includes(r.id)||(r.transaction&&x.transaction===r.transaction)));}
export function auditArchive(a){
 const findings=[];const groups=new Map();for(const r of a.records){if(r.transaction){if(!groups.has(r.transaction))groups.set(r.transaction,[]);groups.get(r.transaction).push(r);}}
 for(const [transaction,records] of groups){
  const order=records.find(r=>r.type==='Order'),delivery=records.find(r=>r.type==='Delivery note'),invoice=records.find(r=>r.type==='Invoice'),receipt=records.find(r=>r.type==='Receipt');
  if(order&&delivery&&order.quantity!==delivery.quantity)findings.push({id:transaction+'-quantity',title:'Delivery quantity differs from order',references:[order.id,delivery.id],detail:`Ordered ${order.quantity}; received ${delivery.quantity}.`});
  if(delivery&&invoice&&delivery.quantity!==invoice.quantity)findings.push({id:transaction+'-billed',title:'Invoice quantity differs from delivery',references:[delivery.id,invoice.id],detail:`Received ${delivery.quantity}; invoiced ${invoice.quantity}.`});
  if(invoice&&receipt&&invoice.amount!==receipt.amount)findings.push({id:transaction+'-payment',title:'Payment differs from invoice',references:[invoice.id,receipt.id],detail:`Invoiced ¥${invoice.amount}; paid ¥${receipt.amount}.`});
  for(const r of records)for(const id of r.links)if(!a.records.some(x=>x.id===id))findings.push({id:r.id+'-missing-'+id,title:'Linked document unavailable',references:[r.id],detail:id+' may have expired under the one-year retention policy; verify before treating this as a discrepancy.'});
 }
 for(const finding of findings)if(!a.findings.some(f=>f.id===finding.id))a.findings.push({...finding,status:'Open',notes:''});return a.findings;
}
/** Opening records are authored fictional history, not invented player activity. */
export function seedArchive(state,now){
 const a=state.documentArchive??=restoreArchive();retainArchive(a,now);if(a.seeded)return;a.seeded=true;
 for(const paper of TOWN_PAPERS)fileDocument(state,{...paper,opening:true},now);
 const organisations=['Sakura Shop','Harbour Office','Community Hall','Minato Clinic','Sato Ramen','Minato Izakaya','Town Maintenance','Minato School'];
 for(let month=0;month<12;month++){
  const date=new Date(now*60000);date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()-month);const issued=date.getTime()/60000;
  for(const organisation of organisations)fileDocument(state,{type:'Handover',organisation,title:'Monthly handover',issued,opening:true,source:`opening-${organisation}-${month}`,text:'Monthly handover\nOrganisation: '+organisation+'\nPrepared by: Town clerk\nActions: check supplies, confirm staffing and file completed paperwork.\nStatus: routine work completed; outstanding requests carried forward.'},now);
  fileDocument(state,{type:'Flyer',organisation:'Community Hall',title:'Community clean-up',issued,opening:true,source:'opening-flyer-'+month,text:'COMMUNITY CLEAN-UP\nDate: '+archiveDate(issued+((7-date.getUTCDay())%7)*1440,now)+'\nMeet at the Community Hall at 09:00.\nBring gloves; bags are supplied.\nOrganiser: Community Hall\nPlease leave the quay clear for ferry passengers.'},now);
 }
 const transaction='SAKURA-OPENING-0042',issued=now-2*1440;
 const order=fileDocument(state,{type:'Order',organisation:'Sakura Shop',title:'Order — bottled tea',issued,opening:true,transaction,quantity:20,amount:2000,text:'PURCHASE ORDER\nSupplier: Harbour Wholesaler\nBottled tea: 20 boxes × ¥100 = ¥2,000\nDeliver to: Sakura Shop stockroom.\nAuthorised by: Thuan.'},now);
 const delivery=fileDocument(state,{type:'Delivery note',organisation:'Sakura Shop',title:'Delivery — bottled tea',issued:issued+30,opening:true,transaction,quantity:18,links:[order.id],text:'DELIVERY NOTE\nBottled tea: 18 boxes received.\nReceived by: Thuan.\nTwo boxes short; supplier contacted.'},now);
 const invoice=fileDocument(state,{type:'Invoice',organisation:'Sakura Shop',title:'Invoice — bottled tea',issued:issued+60,opening:true,transaction,quantity:20,amount:2000,links:[order.id,delivery.id],text:'INVOICE\nBottled tea: 20 boxes × ¥100 = ¥2,000\nTotal due: ¥2,000 (tax included).\nTerms: cash on delivery.'},now);
 fileDocument(state,{type:'Receipt',organisation:'Sakura Shop',title:'Payment — bottled tea',issued:issued+90,opening:true,transaction,amount:2000,links:[invoice.id],text:'RECEIPT\nCash received: ¥2,000\nPaid by: Thuan\nReceived by: Harbour Wholesaler.'},now);
}
/** File at the source before the shop's short display journal is trimmed. */
export function fileShopEntry(state,entry){
 const now=entry.minute;if(!Number.isFinite(now))return;
 const linkedOrder=state.documentArchive?.records.find(r=>r.id===entry.archiveOrder);
 const transaction=linkedOrder?.transaction||'SAKURA-'+(state.documentArchive?.sequence||0)+'-'+now;
 const type=entry.kind==='Sale'?'Receipt':entry.kind==='Delivery'?'Delivery note':entry.kind==='Stock purchase'?'Order':'Ledger entry';
 const document=fileDocument(state,{type,organisation:'Sakura Shop',author:entry.kind==='Sale'?'Thuan':'Town clerk',title:entry.kind+' — '+entry.item,transaction,links:linkedOrder?[linkedOrder.id]:[],quantity:entry.quantity,amount:entry.revenue||entry.cost,text:[type.toUpperCase(),entry.item,'Counterparty: '+(entry.buyer||'Customer'),'Quantity: '+entry.quantity,'Revenue: ¥'+entry.revenue,'Cost: ¥'+entry.cost,'Till balance: ¥'+entry.cash].join('\n')},now);
 if(type!=='Ledger entry'&&document)fileDocument(state,{type:'Ledger entry',organisation:'Sakura Shop',title:entry.kind+' ledger posting',transaction,links:[document.id],amount:entry.revenue||entry.cost,text:document.text},now);
 if(entry.kind==='Stock purchase'&&document){
  const invoice=fileDocument(state,{type:'Invoice',organisation:'Sakura Shop',title:'Supplier invoice — '+entry.item,transaction,quantity:entry.quantity,amount:entry.cost,links:[document.id],text:'SUPPLIER INVOICE\n'+entry.item+'\nQuantity: '+entry.quantity+'\nPaid in cash: ¥'+entry.cost},now);
  fileDocument(state,{type:'Receipt',organisation:'Sakura Shop',title:'Supplier payment — '+entry.item,transaction,amount:entry.cost,links:[invoice.id],text:'CASH RECEIPT\nSupplier: Harbour Wholesaler\nAmount received: ¥'+entry.cost},now);
 }
 return document;
}
