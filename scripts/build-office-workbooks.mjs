import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';

const outputDir=path.resolve(process.argv[2]||'assets/office-workbooks');
const reviewDir=path.resolve(process.argv[3]||'review');
await fs.mkdir(outputDir,{recursive:true});await fs.mkdir(reviewDir,{recursive:true});
const date=value=>new Date(value+'Z');
const day=value=>date(value+'T00:00:00');
const serial=value=>value instanceof Date?(value.getTime()-Date.UTC(1899,11,30))/86400000:value;
const columns=(names,types,widths,calculated=[])=>names.map((label,i)=>({label,type:types[i]||'text',width:widths[i]||18,calculated:calculated.includes(i)}));
const specs=[
 {id:'berth-register',title:'Harbour berth register',sheet:'Berth register',description:'Vessel calls, berth assignments and scheduled time alongside.',
  columns:columns(['Call ID','Vessel','Berth','Arrival','Departure','Stay (hours)','Cargo','Status'],['text','text','text','datetime','datetime','number','text','text'],[19,23,19,23,23,17,27,18],[5]),
  rows:[
   ['BR-8814-01','Aoba Maru','East quay 1',date('1988-09-14T06:20:00'),date('1988-09-14T09:20:00'),null,'Fish boxes','Departed'],
   ['BR-8814-02','Harbour launch','South jetty',date('1988-09-14T08:30:00'),date('1988-09-14T17:00:00'),null,'Service equipment','Alongside'],
   ['BR-8814-03','Midori','East quay 2',date('1988-09-14T10:00:00'),date('1988-09-14T17:30:00'),null,'General stores','Alongside'],
   ['BR-8814-04','Shiosai','East quay 1',date('1988-09-14T17:00:00'),date('1988-09-15T06:00:00'),null,'Paper and tea','Expected'],
   ['BR-8814-05','Mellosa','Outer berth',date('1988-09-14T18:30:00'),date('1988-09-15T08:30:00'),null,'Workshop supplies','Expected'],
   ['BR-8814-06','Nam Phuoc','East quay 2',date('1988-09-15T09:00:00'),date('1988-09-15T15:00:00'),null,'Household goods','Expected'],
  ], formulas:r=>({F:`=IF(A${r}="","",IF(COUNT(D${r}:E${r})<2,"",ROUND((E${r}-D${r})*24,2)))`}),
  summaries:[['A5','Registered calls','A6','=COUNTA(A10:A29)'],['D5','Alongside','D6','=COUNTIFS(H10:H29,"Alongside")'],['G5','Scheduled berth hours','G6','=SUM(F10:F29)']],
  validations:[['H10:H29',['Expected','Alongside','Departed']]],
  verify(sheet){const old=sheet.getRange('E10').values[0][0],oldHours=sheet.getRange('F10').values[0][0];sheet.getRange('E10').values=[[serial(old)+1/24]];assert.equal(sheet.getRange('F10').values[0][0],oldHours+1);sheet.getRange('E10').values=[[old]];assert.equal(sheet.getRange('G6').values[0][0],52);},
 },
 {id:'warehouse-stock',title:'Warehouse stock ledger',sheet:'Stock ledger',description:'Receipts, issues, stock on hand and reorder quantities.',
  columns:columns(['Stock code','Item','Unit','Opening','Received','Issued','On hand','Minimum','Reorder qty'],['text','text','text','integer','integer','integer','integer','integer','integer'],[19,29,17,15,15,15,15,15,18],[6,8]),
  rows:[['WH-001','Mooring line','Coils',8,3,7,null,6,null],['WH-002','Rubber fenders','Each',12,4,3,null,8,null],['WH-003','Fish boxes','Each',120,40,115,null,60,null],['WH-004','Printer paper','Reams',9,5,4,null,6,null],['WH-005','Work gloves','Pairs',24,0,18,null,12,null],['WH-006','Packing tape','Rolls',15,12,8,null,10,null]],
  formulas:r=>({G:`=IF(A${r}="","",IF(COUNT(D${r}:F${r})<3,"",D${r}+E${r}-F${r}))`,I:`=IF(A${r}="","",IF(COUNT(G${r}:H${r})<2,"",MAX(0,H${r}-G${r})))`}),
  summaries:[['A5','Stock lines','A6','=COUNTA(A10:A29)'],['D5','Lines to reorder','D6','=COUNTIFS(I10:I29,">0")'],['G5','Negative balances','G6','=COUNTIFS(G10:G29,"<0")']],
  verify(sheet){assert.equal(sheet.getRange('G10').values[0][0],4);assert.equal(sheet.getRange('I10').values[0][0],2);sheet.getRange('E10').values=[[0]];assert.equal(sheet.getRange('G10').values[0][0],1);assert.equal(sheet.getRange('I10').values[0][0],5);sheet.getRange('E10').values=[[3]];assert.equal(sheet.getRange('D6').values[0][0],3);},
 },
 {id:'service-work-log',title:'Marine service work log',sheet:'Service log',description:'Equipment jobs, assigned staff, due dates and remaining work.',
  columns:columns(['Job ID','Equipment','Work requested','Owner','Due date','Planned hours','Worked hours','Hours left','Closed date','State'],['text','text','text','text','date','number','number','number','date','text'],[19,24,35,20,19,19,19,17,19,18],[7,9]),
  rows:[['SV-001','Quay light 2','Replace lamp and test','Tetsuo',day('1988-09-13'),2,1,null,null,null],['SV-002','Harbour launch','Check instrument panel','Chin',day('1988-09-14'),4,2.5,null,null,null],['SV-003','Office printer','Clean feed rollers','Tetsuo',day('1988-09-14'),1.5,1.5,null,day('1988-09-14'),null],['SV-004','Warehouse trolley','Replace wheel bearing','Chin',day('1988-09-16'),3,0,null,null,null],['SV-005','Vessel records','File service certificates','Harbour master',day('1988-09-15'),2,1,null,null,null],['SV-006','Quay hand pump','Inspect seals','Chin',day('1988-09-17'),2.5,0,null,null,null]],
  formulas:r=>({H:`=IF(A${r}="","",IF(COUNT(F${r}:G${r})<2,"",MAX(0,F${r}-G${r})))`,J:`=IF(A${r}="","",IF(I${r}<>"","Closed",IF(E${r}="","Set due date",IF(E${r}<$A$6,"Overdue","Open"))))`}),
  summaries:[['A5','Review date','A6',day('1988-09-14')],['D5','Unclosed jobs','D6','=COUNTA(A10:A29)-COUNTIFS(J10:J29,"Closed")'],['G5','Overdue jobs','G6','=COUNTIFS(J10:J29,"Overdue")']],
  verify(sheet){assert.equal(sheet.getRange('J10').values[0][0],'Overdue');assert.equal(sheet.getRange('H11').values[0][0],1.5);sheet.getRange('G11').values=[[4]];assert.equal(sheet.getRange('H11').values[0][0],0);assert.equal(sheet.getRange('J11').values[0][0],'Open','Hours alone do not close a job');sheet.getRange('I11').values=[[day('1988-09-14')]];assert.equal(sheet.getRange('J11').values[0][0],'Closed');sheet.getRange('G11').values=[[2.5]];sheet.getRange('I11').values=[[null]];assert.equal(sheet.getRange('D6').values[0][0],5);},
 },
];

const catalogue={version:1,asOf:'14 September 1988',workbooks:[]};
for(const spec of specs){
 const workbook=Workbook.create(),sheet=workbook.worksheets.add(spec.sheet),last=String.fromCharCode(64+spec.columns.length);
 sheet.showGridLines=false;sheet.tabColor='#42584E';
 sheet.getRange(`A1:${last}29`).format={font:{name:'Arial',size:11,color:'#29342F'},verticalAlignment:'center',rowHeight:24};
 sheet.getRange('A2').values=[[spec.title]];sheet.getRange('A2').format.font={name:'Arial',size:16,bold:true,color:'#29342F'};sheet.getRange('A2').format.rowHeight=30;
 sheet.getRange('A3').values=[['Johansson Town. Fictional records for 14 September 1988.']];sheet.getRange('A3').format.font={name:'Arial',size:11,italic:true,color:'#66706A'};
 sheet.getRange(`A4:${last}4`).format.borders={bottom:{style:'thin',color:'#A1A999'}};
 for(const [labelCell,label,valueCell,value] of spec.summaries){sheet.getRange(labelCell).values=[[label]];sheet.getRange(labelCell).format.font={name:'Arial',size:11,color:'#66706A'};sheet.getRange(valueCell)[typeof value==='string'?'formulas':'values']=[[value]];sheet.getRange(valueCell).format.font={name:'Arial',size:16,bold:true,color:'#29342F'};sheet.getRange(valueCell).setNumberFormat(value instanceof Date?'d mmm yyyy':label.includes('hours')?'0.00':'#,##0');}
 sheet.getRange('A8').values=[['Blue cells are editable. '+(spec.id==='berth-register'?'Use full dates and times. Stay hours calculate automatically.':spec.id==='warehouse-stock'?'Enter 0 for no stock. On hand and reorder quantities calculate automatically.':'Enter 0 for no hours. Add a closed date only when the job is finished.')]];sheet.getRange('A8').format.font={name:'Arial',size:11,italic:true,color:'#66706A'};
 sheet.getRange(`A9:${last}9`).values=[spec.columns.map(c=>c.label)];
 sheet.getRange(`A10:${last}${9+spec.rows.length}`).values=spec.rows;
 for(let r=10;r<=29;r++)for(const [col,formula] of Object.entries(spec.formulas(r)))sheet.getRange(`${col}${r}`).formulas=[[formula]];
 const table=sheet.tables.add(`A9:${last}29`,true,spec.id.replaceAll('-','_'));table.showFilterButton=true;
 sheet.getRange(`A9:${last}9`).format={fill:'#42584E',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',rowHeight:30,borders:{insideVertical:{style:'thin',color:'#FFFFFF'}}};
 for(const [i,col] of spec.columns.entries()){
  const letter=String.fromCharCode(65+i),body=sheet.getRange(`${letter}10:${letter}29`);sheet.getRange(`${letter}1:${letter}29`).format.columnWidth=col.width;
  body.format={fill:col.calculated?'#F1F2EC':'#F3F7FA',font:{name:'Arial',size:11,color:col.calculated?'#29342F':'#245579'},horizontalAlignment:col.type==='text'?'left':'right'};
  body.setNumberFormat(col.type==='datetime'?'d mmm hh:mm':col.type==='date'?'d mmm yyyy':col.type==='integer'?'#,##0':col.type==='number'?'0.00':'@');
  if(['integer','number'].includes(col.type)&&!col.calculated)sheet.dataValidations.add({range:`${letter}10:${letter}29`,rule:{type:col.type==='integer'?'whole':'decimal',operator:'greaterThanOrEqual',formula1:0}});
 }
 for(const [range,values] of spec.validations||[])sheet.getRange(range).dataValidation={rule:{type:'list',values}};
 if(spec.id==='warehouse-stock'){sheet.getRange('I10:I29').conditionalFormats.add('cellIs',{operator:'greaterThan',formula:0,format:{fill:'#F4E2B8',font:{color:'#6E482A',bold:true}}});sheet.getRange('G10:G29').conditionalFormats.add('cellIs',{operator:'lessThan',formula:0,format:{fill:'#F6D7CD',font:{color:'#8F3529',bold:true}}});}
 if(spec.id==='service-work-log'){sheet.getRange('A6').setNumberFormat('d mmm yyyy');sheet.getRange('J10:J29').conditionalFormats.add('containsText',{text:'Overdue',format:{fill:'#F4E2B8',font:{color:'#6E482A',bold:true}}});}
 sheet.freezePanes.freezeRows(9);sheet.freezePanes.freezeColumns(1);
 spec.verify(sheet);
 const key=sheet.getRange('A10').values[0][0];sheet.getRange('A10').values=[['']];for(const col of Object.keys(spec.formulas(10)))assert.equal(sheet.getRange(`${col}10`).values[0][0],'');sheet.getRange('A10').values=[[key]];
 workbook.recalculate();
 const checked=await workbook.inspect({kind:'table',range:`'${spec.sheet}'!A9:${last}15`,include:'values,formulas',tableMaxRows:7,tableMaxCols:10,maxChars:3500});
 await fs.writeFile(path.join(reviewDir,spec.id+'-check.ndjson'),checked.ndjson);
 const errors=await workbook.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:50},maxChars:1500});
 await fs.writeFile(path.join(reviewDir,spec.id+'-errors.ndjson'),errors.ndjson);
 for(const row of sheet.getRange(`A1:${last}29`).values)for(const value of row)assert.ok(!/^#(REF!|DIV\/0!|VALUE!|NAME\?|N\/A|NUM!|NULL!|SPILL!|CALC!)/.test(String(value)),String(value));
 const preview=await workbook.render({sheetName:spec.sheet,range:`A1:${last}16`,scale:1.5,format:'png'});await fs.writeFile(path.join(reviewDir,spec.id+'.png'),new Uint8Array(await preview.arrayBuffer()));
 const file=spec.id+'.xlsx',xlsx=await SpreadsheetFile.exportXlsx(workbook);await xlsx.save(path.join(outputDir,file));
 const bytes=await fs.readFile(path.join(outputDir,file));
 const rows=sheet.getRange(`A10:${last}${9+spec.rows.length}`).values.map(row=>row.map(serial));
 catalogue.workbooks.push({id:spec.id,title:spec.title,sheet:spec.sheet,description:spec.description,file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),columns:spec.columns.map(({width,...col})=>col),rows,formulas:spec.rows.map((_,i)=>spec.columns.map((__,j)=>spec.formulas(i+10)[String.fromCharCode(65+j)]||'')),summaries:spec.summaries.map(([_,label,cell])=>({label,value:serial(sheet.getRange(cell).values[0][0]),type:spec.id==='service-work-log'&&cell==='A6'?'date':'number'}))});
 console.log(JSON.stringify({file,bytes:bytes.length,records:rows.length,summary:catalogue.workbooks.at(-1).summaries}));
}
await fs.writeFile(path.join(outputDir,'catalogue.json'),JSON.stringify(catalogue,null,2)+'\n');
