import {archiveRows,archiveMonth,archiveDate,linkedRecords,auditArchive,DOCUMENT_TYPES} from './archive.js';
const element=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
export function createArchiveView(archive,{save=()=>{}}={}){
 const root=element('section',undefined,'town-archive');let selected=null,mode='register';const filters={query:'',organisation:'',type:'',month:''};
 function button(label,action){const b=element('button',label);b.type='button';b.onclick=action;return b;}
 function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=element('a');a.href=url;a.download=name;root.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function render(){root.replaceChildren();
  const nav=element('nav');nav.setAttribute('aria-label','Document archive');nav.append(button('Document register',()=>{mode='register';selected=null;render();}),button('Audit reports',()=>{mode='audit';selected=null;auditArchive(archive);save();render();}),button('Export register',()=>{
   const cell=v=>'"'+String(v??'').replace(/^[\s]*[=+@-]/,"'$&").replaceAll('"','""')+'"';
   download('town-document-register.csv',[['Reference','Title','Organisation','Type','Issued','Filed','Transaction','Links'],...archiveRows(archive,filters).map(r=>[r.id,r.title,r.organisation,r.type,archiveDate(r.issued,archive.watermark),archiveDate(r.filed,archive.watermark),r.transaction,r.links.join(' ')])].map(row=>row.map(cell).join(',')).join('\r\n'),'text/csv;charset=utf-8');
  }));root.append(nav);
  root.append(element('p','Community Hall central archive · One in-game year of records. Opening files are authored town history; new transactions are filed as they happen.','archive-policy'));
  if(selected){const r=archive.records.find(r=>r.id===selected);if(!r){root.append(element('p','This document has expired under the one-year retention policy.'));return;}
   root.append(element('h3',r.title));const metadata=element('dl');for(const [k,v] of [['Reference',r.id],['Organisation',r.organisation],['Type',r.type],['Issued',archiveDate(r.issued,archive.watermark)],['Filed',archiveDate(r.filed,archive.watermark)],['Filed by',r.author],['Folder',r.organisation+' / '+archiveMonth(r.issued).slice(5)],['Transaction',r.transaction||'None'],['Origin',r.opening?'Opening town record':'Filed during play']]){metadata.append(element('dt',k),element('dd',v));}root.append(metadata);
   const paper=element('article',undefined,'archive-paper');paper.append(element('h4',r.type.toUpperCase()),element('pre',r.text));root.append(paper);
   const escapeHTML=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
   root.append(button('Print document',()=>download(r.id+'.html','<!doctype html><html lang="en"><meta charset="utf-8"><title>'+escapeHTML(r.title)+'</title><style>body{max-width:180mm;margin:20mm auto;font:12pt Georgia,serif;color:#222}header{border-bottom:2px solid;padding-bottom:12px}pre{white-space:pre-wrap;font:inherit;line-height:1.6}@page{size:A4;margin:20mm}@media print{body{margin:0}button{display:none}}</style><header><h1>'+escapeHTML(r.title)+'</h1><p>'+escapeHTML(r.organisation+' · '+r.id+' · '+archiveDate(r.issued,archive.watermark))+'</p></header><pre>'+escapeHTML(r.text)+'</pre><button onclick="window.print()">Print</button></html>','text/html;charset=utf-8')));
   root.append(button('Download document',()=>download(r.id+'.txt',[r.title,r.id,r.organisation,r.text].join('\n\n'),'text/plain;charset=utf-8')));
   root.append(element('h4','Follow the paperwork'));for(const linked of linkedRecords(archive,r))root.append(button(linked.id+' · '+linked.title,()=>{selected=linked.id;render();}));
   for(const id of r.links)if(!archive.records.some(x=>x.id===id))root.append(element('p',id+' is unavailable. It may have expired; check the audit before assuming it was lost.'));
   if(r.versions.length){root.append(element('h4','Earlier versions'));for(const v of r.versions){const d=element('details');d.append(element('summary',archiveDate(v.filed,archive.watermark)+' · '+v.author),element('pre',v.text));root.append(d);}}
   root.append(button('Back to register',()=>{selected=null;mode='register';render();}));return;
  }
  if(mode==='audit'){
   root.append(element('h3','Audit findings'));if(!archive.findings.length)root.append(element('p','No discrepancies found in the filed transaction chains.'));
   for(const f of archive.findings){const section=element('article',undefined,'archive-finding');section.append(element('h4',f.title+' · '+f.status),element('p',f.detail));for(const id of f.references)section.append(button(id,()=>{selected=id;render();}));
    const label=element('label','Evidence and resolution notes'),notes=element('textarea');notes.value=f.notes;notes.maxLength=2000;notes.setAttribute('aria-label','Notes for '+f.title);label.append(notes);section.append(label);
    section.append(button('Save notes',()=>{f.notes=notes.value.trim();save();render();}),button(f.status==='Resolved'?'Reopen finding':'Resolve finding',()=>{if(f.status!=='Resolved'&&!notes.value.trim()){notes.setCustomValidity('Describe the evidence before resolving this finding.');notes.reportValidity();return;}f.notes=notes.value.trim();f.status=f.status==='Resolved'?'Open':'Resolved';save();render();}));root.append(section);
   }return;
  }
  const toolbar=element('div',undefined,'archive-filters'),searchLabel=element('label','Search documents'),search=element('input');search.type='search';search.placeholder='Reference, person, product or title';search.value=filters.query;searchLabel.append(search);toolbar.append(searchLabel);
  for(const [key,label,values] of [['organisation','Organisation',[...new Set(archive.records.map(r=>r.organisation))].sort()],['type','Document type',DOCUMENT_TYPES],['month','Month',[...new Set(archive.records.map(r=>archiveMonth(r.issued)))].sort().reverse()]]){
   const l=element('label',label),select=element('select');select.setAttribute('aria-label',label);const all=element('option','All');all.value='';select.append(all);for(const v of values){const option=element('option',key==='month'?new Date(v+'-01T00:00:00Z').toLocaleDateString('en-GB',{month:'long',timeZone:'UTC'})+' '+(1997+Number(v.slice(0,4))-new Date(archive.watermark*60000).getUTCFullYear()):v);option.value=v;select.append(option);}select.value=filters[key];select.onchange=()=>{filters[key]=select.value;renderRows();};l.append(select);toolbar.append(l);
  }root.append(toolbar);const count=element('p');count.setAttribute('aria-live','polite');root.append(count);const scroll=element('div',undefined,'archive-scroll');scroll.tabIndex=0;scroll.setAttribute('aria-label','Document register');const table=element('table'),head=element('thead'),row=element('tr');for(const name of ['Reference','Title','Organisation','Type','Issued']){const th=element('th',name);th.scope='col';row.append(th);}head.append(row);table.append(head);const body=element('tbody');table.append(body);scroll.append(table);root.append(scroll);
  function renderRows(){body.replaceChildren();const rows=archiveRows(archive,filters);count.textContent=rows.length+' of '+archive.records.length+' documents';for(const r of rows){const tr=element('tr'),ref=element('td');ref.append(button(r.id,()=>{selected=r.id;render();}));tr.append(ref,...[r.title,r.organisation,r.type,archiveDate(r.issued,archive.watermark)].map(v=>element('td',v)));body.append(tr);}if(!rows.length)count.textContent='No matching documents. Clear or change the filters.';}
  search.oninput=()=>{filters.query=search.value;renderRows();};renderRows();
 }
 render();return root;
}
