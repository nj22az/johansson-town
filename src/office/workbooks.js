import {assetURL} from '../assets.js';

let catalogueRequest=null;
export function loadOfficeWorkbooks(){
 if(!catalogueRequest)catalogueRequest=fetch(assetURL('office-workbooks/catalogue.json')).then(response=>{if(!response.ok)throw Error('Records unavailable');return response.json();}).catch(error=>{catalogueRequest=null;throw error;});
 return catalogueRequest;
}
export function workbookFileURL(book){
 if(!/^[a-z][a-z-]*\.xlsx$/.test(book.file))throw Error('Invalid office filename');
 return assetURL('office-workbooks/'+book.file);
}
export function officeCellText(value,type){
 if(value===null||value===undefined||value==='')return '';
 if(type==='date'||type==='datetime'){
  const date=new Date(Date.UTC(1899,11,30)+Number(value)*86400000);
  return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',...(type==='date'?{year:'numeric'}:{hour:'2-digit',minute:'2-digit',hour12:false}),timeZone:'UTC'}).format(date);
 }
 if(typeof value==='number')return value.toLocaleString('en-GB',{maximumFractionDigits:2});
 return String(value);
}
export function matchingOfficeRows(book,query=''){
 const search=query.trim().toLowerCase();
 return book.rows.map((row,index)=>({row,index})).filter(({row})=>!search||row.some((value,i)=>officeCellText(value,book.columns[i].type).toLowerCase().includes(search)));
}

export function createOfficeWorkbookView(catalogue,selectedId,onSelect){
 const book=catalogue.workbooks.find(b=>b.id===selectedId)||catalogue.workbooks[0];
 const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
 const root=el('section',undefined,'office-workbook'),tabs=el('nav',undefined,'office-workbook-tabs');tabs.setAttribute('aria-label','Office workbooks');
 for(const item of catalogue.workbooks){const button=el('button',item.sheet);button.type='button';button.setAttribute('aria-pressed',String(item.id===book.id));button.onclick=()=>onSelect(item.id);tabs.append(button);}root.append(tabs);
 root.append(el('h3',book.title),el('p',book.description,'office-workbook-description'));
 const summaries=el('dl',undefined,'office-workbook-summary');for(const summary of book.summaries){const group=el('div');group.append(el('dt',summary.label),el('dd',officeCellText(summary.value,summary.type)));summaries.append(group);}root.append(summaries);
 const toolbar=el('div',undefined,'office-workbook-toolbar'),label=el('label','Find a record'),search=el('input');search.type='search';search.placeholder='Vessel, stock code or job';search.setAttribute('aria-label','Find a record');label.append(search);
 const download=el('a','Download Excel file','office-workbook-download');download.href=workbookFileURL(book);download.download=book.file;download.type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
 toolbar.append(label,download);root.append(toolbar);
 const scroll=el('div',undefined,'office-workbook-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',book.sheet+' spreadsheet');
 const table=el('table'),caption=el('caption',book.sheet+' — '+catalogue.asOf),head=el('thead'),headers=el('tr');headers.append(el('th','Row'));
 for(const col of book.columns){const th=el('th',col.label);th.scope='col';if(col.calculated)th.title='Calculated in the Excel workbook';headers.append(th);}head.append(headers);table.append(caption,head);const tbody=el('tbody');table.append(tbody);scroll.append(table);root.append(scroll);
 const count=el('p',undefined,'office-workbook-count');count.setAttribute('aria-live','polite');root.append(count);
 const formula=el('p','Select a value to see its cell or formula.','office-workbook-formula');formula.setAttribute('aria-live','polite');root.append(formula);
 root.append(el('p','Preview the town records here. Download the workbook to edit its blue input cells, use filters and calculate your own records. Each file has 20 prepared entry lines.','office-workbook-note'));
 function render(){tbody.replaceChildren();const rows=matchingOfficeRows(book,search.value);
  for(const {row,index} of rows){const tr=el('tr'),rowNumber=el('th',String(index+10));rowNumber.scope='row';tr.append(rowNumber);
   row.forEach((value,i)=>{const col=book.columns[i],td=el('td',officeCellText(value,col.type),col.calculated?'office-calculated':col.type==='text'?'':'office-number');td.tabIndex=0;
    const select=()=>{const cell=String.fromCharCode(65+i)+(index+10),source=book.formulas[index][i];formula.textContent=cell+' · '+(source||'Input: '+(officeCellText(value,col.type)||'Blank'));};td.onfocus=select;td.onclick=select;tr.append(td);});tbody.append(tr);
  }count.textContent=rows.length?`${rows.length} of ${book.rows.length} records`:'No matching records. Clear the search to see all records.';
 }
 search.oninput=render;render();return root;
}
