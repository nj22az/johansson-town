import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {Element,installDOM} from './fixtures.mjs';
import {createActivities} from '../activities.js';
import {createOfficeWorkbookView,officeCellText,matchingOfficeRows,workbookFileURL} from '../src/office/workbooks.js';

const directory=new URL('../assets/office-workbooks/',import.meta.url);
const catalogue=JSON.parse(await readFile(new URL('catalogue.json',directory)));
function dom(){
 const fixture=installDOM();
 document.createElement=tag=>{const e=new Element();e.tagName=tag;e.attributes={};e.setAttribute=(k,v)=>e.attributes[k]=v;e.replaceChildren=(...children)=>{e.children=children;};return e;};
 for(const e of fixture.elements.values())e.replaceChildren=(...children)=>{e.children=children;};
 const query=document.querySelector;document.querySelector=s=>{const e=query(s);e.replaceChildren=(...children)=>{e.children=children;};return e;};
 return fixture;
}
const descendants=e=>[e,...e.children.flatMap(descendants)];
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('all three downloads are complete Excel workbooks with formulas, filters and prepared entry rows',async()=>{
 assert.equal(catalogue.workbooks.length,3);
 for(const book of catalogue.workbooks){
  const bytes=await readFile(new URL(book.file,directory));assert.equal(bytes.length,book.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),book.sha256);
  // Read the exported OpenXML, including its cached results: the in-game preview
  // must describe the actual downloaded cells, not a separately authored mock.
  const inspection=spawnSync('python3',['-c',`import sys,zipfile,json,xml.etree.ElementTree as E
n={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(sys.argv[1]) as z:
 assert z.testzip() is None
 sheet=E.fromstring(z.read('xl/worksheets/sheet1.xml'))
 strings=E.fromstring(z.read('xl/sharedStrings.xml')) if 'xl/sharedStrings.xml' in z.namelist() else []
 ss=[''.join(t.text or '' for t in si.findall('.//s:t',n)) for si in strings]
 cells={}
 for c in sheet.findall('.//s:c',n):
  v=c.find('s:v',n); f=c.find('s:f',n); value=v.text if v is not None else None
  if c.get('t')=='s' and value is not None: value=ss[int(value)]
  elif c.get('t')=='inlineStr': value=''.join(t.text or '' for t in c.findall('.//s:t',n))
  elif value is not None and c.get('t') not in ['str','e']: value=float(value)
  cells[c.get('r')]={'value':value,'formula':'='+f.text if f is not None else ''}
 tables=[E.fromstring(z.read(p)) for p in z.namelist() if p.startswith('xl/tables/') and p.endswith('.xml')]
 print(json.dumps({'cells':cells,'frozen':sheet.find('.//s:pane',n).attrib,'validation':len(sheet.findall('.//s:dataValidation',n)),'filters':[t.find('s:autoFilter',n).get('ref') for t in tables],'external':any('externalLink' in p or 'vbaProject' in p for p in z.namelist())}))`,new URL(book.file,directory).pathname],{encoding:'utf8'});
  assert.equal(inspection.status,0,inspection.stderr);const xml=JSON.parse(inspection.stdout);
  assert.equal(xml.frozen.state,'frozen');assert.equal(Number(xml.frozen.ySplit),9);assert.ok(xml.validation>0);assert.equal(xml.external,false);
  assert.ok(xml.filters.includes('A9:'+String.fromCharCode(64+book.columns.length)+'29'));
  book.rows.forEach((row,r)=>row.forEach((value,c)=>{const cell=xml.cells[String.fromCharCode(65+c)+(r+10)];assert.deepEqual(cell.value??null,value??null,book.id+' cached cell');assert.equal(cell.formula,book.formulas[r][c]);}));
  for(const [c,column] of book.columns.entries())if(column.calculated){const last=xml.cells[String.fromCharCode(65+c)+'29'];assert.ok(last.formula);assert.ok(last.value===null||last.value==='','Unused formula rows remain blank');}
 }
});

test('office preview filters real records, exposes formulas and offers each native download',()=>{
 dom();let selected;
 for(const book of catalogue.workbooks){
  const root=createOfficeWorkbookView(catalogue,book.id,id=>selected=id),nodes=descendants(root),search=nodes.find(e=>e.tagName==='input'),body=nodes.find(e=>e.tagName==='tbody');
  assert.equal(body.children.length,6);const download=nodes.find(e=>e.tagName==='a');assert.equal(download.download,book.file);assert.equal(download.href,workbookFileURL(book));
  const c=book.columns.findIndex(c=>c.calculated);body.children[0].children[c+1].onclick();assert.ok(nodes.find(e=>e.className==='office-workbook-formula').textContent.includes(book.formulas[0][c]));
  search.value=book.rows[2][0];search.oninput();assert.equal(body.children.length,1);assert.equal(body.firstChild.firstChild.textContent,'12','Filtering preserves Excel row numbers');
  search.value='no-such-record';search.oninput();assert.equal(body.children.length,0);assert.match(nodes.find(e=>e.className==='office-workbook-count').textContent,/No matching records/);
  nodes.filter(e=>e.tagName==='button').at(-1).onclick();assert.equal(selected,'service-work-log');
 }
 assert.equal(officeCellText(32400,'date'),'14 Sept 1988');assert.equal(officeCellText(0,'integer'),'0');
 assert.equal(matchingOfficeRows(catalogue.workbooks[0],'alongside').length,2);
 assert.throws(()=>workbookFileURL({file:'../../other.xlsx'}));
});

test('records pause the game, recover after a failed fetch and cannot reopen after closing',async()=>{
 const fixture=dom(),native=fetch;let resolve;
 const activities=createActivities({say(){},onWeather(){},onTime(){}}),balance=activities.state.yen;
 globalThis.fetch=()=>new Promise(done=>resolve=done);
 try{
  activities.action('office-records','Records','warehouse-stock');assert.equal(activities.paused,true);activities.close();resolve(new Response(JSON.stringify(catalogue)));await flush();assert.equal(activities.paused,false);assert.ok(document.querySelector('#activity').classList.contains('hidden'));
  activities.action('office-records','Records','warehouse-stock');await flush();assert.match(document.querySelector('#activityBody').firstChild.children.find(e=>e.tagName==='h3').textContent,/Warehouse/);assert.equal(activities.state.yen,balance);activities.close();
  const {loadOfficeWorkbooks}=await import('../src/office/workbooks.js?retry-office');let calls=0;globalThis.fetch=async()=>++calls===1?new Response('',{status:503}):new Response(JSON.stringify(catalogue));
  await assert.rejects(loadOfficeWorkbooks());assert.equal((await loadOfficeWorkbooks()).workbooks.length,3);assert.equal(calls,2);
 }finally{globalThis.fetch=native;activities.close();}
});
