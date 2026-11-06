import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {MAGAZINE_TITLES,issueFor,rackIssues,MANGA_CHAPTERS} from '../src/world/interiors/magazine-issues.js';
import {pagesFor} from '../src/world/interiors/magazine-art.js';

const day=(m,d)=>new Date(1997,m-1,d);
const title=id=>MAGAZINE_TITLES.find(t=>t.id===id);

test('weeklies turn over on their own on-sale day, monthlies on the 1st, papers daily',()=>{
 const hayabusa=title('hayabusa');// on sale Mondays
 assert.equal(issueFor(hayabusa,day(9,15)).key,issueFor(hayabusa,day(9,21)).key,'same issue all week');
 assert.notEqual(issueFor(hayabusa,day(9,21)).key,issueFor(hayabusa,day(9,22)).key,'new issue on Monday');
 assert.equal(issueFor(hayabusa,day(9,22)).number,issueFor(hayabusa,day(9,15)).number+1);
 const guide=title('shimaaruki');
 assert.equal(issueFor(guide,day(9,1)).key,issueFor(guide,day(9,30)).key);
 assert.notEqual(issueFor(guide,day(9,30)).key,issueFor(guide,day(10,1)).key);
 assert.equal(issueFor(guide,day(9,13)).dateLine,'October 1997','monthlies carry next month on the cover');
 for(const id of ['minato','shimaspo','nippo']){
  const t=title(id);assert.notEqual(issueFor(t,day(9,13)).head,issueFor(t,day(9,14)).head,id+' changes daily');
  assert.notEqual(issueFor(t,day(9,13)).head,issueFor(t,day(9,20)).head,id+' differs a week later');
 }
 assert.deepEqual(rackIssues(day(9,13)),rackIssues(day(9,13)));
 assert.notEqual(rackIssues(day(9,13)).key,rackIssues(day(9,14)).key);
});

test('every chapter of the serial comes round, and each issue has pages to flip',()=>{
 const seen=new Set();
 for(let w=0;w<8;w++)seen.add(issueFor(title('hayabusa'),day(9,1+w*7)).chapter);
 assert.equal(seen.size,MANGA_CHAPTERS);
 for(const t of MAGAZINE_TITLES)for(const d of [day(9,13),day(10,6)]){
  const pages=pagesFor(t,issueFor(t,d));
  assert.ok(pages.length>=(t.paper?2:4),t.id+' has too few pages');
  for(const p of pages){
   assert.ok(p.draw||p.image,t.id+' page has nothing to show');
   if(p.image)assert.ok(existsSync(new URL('../assets/'+p.image,import.meta.url)),p.image+' is missing; run tools/magazines/draw_pages.py');
  }
 }
 assert.ok(pagesFor(title('hayabusa'),issueFor(title('hayabusa'),day(9,13))).some(p=>/gag/.test(p.image||'')),'the 4-koma are in the shōnen weekly');
});

// Record the actual Canvas drawing commands with proportional glyph advances.
// This checks printed bounds rather than a second copy of the page layout.
function recordingPen(){
 const text=[],rects=[],stack=[];
 const c={font:'10px sans-serif',textAlign:'left',textBaseline:'alphabetic',fillStyle:'#000',
  save(){stack.push({font:this.font,textAlign:this.textAlign,textBaseline:this.textBaseline,fillStyle:this.fillStyle});},restore(){Object.assign(this,stack.pop());},scale(){},
  measureText(value){const size=Number(this.font.match(/([\d.]+)px/)[1]);return {width:[...String(value)].reduce((n,ch)=>n+(/\s/.test(ch)?.28:/[ilI.,'!]/.test(ch)?.25:/[MW]/.test(ch)?.85:/[A-Z]/.test(ch)?.64:.54)*size,0)};},
  fillText(value,x,y){const size=Number(this.font.match(/([\d.]+)px/)[1]),width=this.measureText(value).width,left=x-(this.textAlign==='right'?width:this.textAlign==='center'?width/2:0);text.push({value:String(value),left,right:left+width,top:y-size/2,bottom:y+size/2,size,colour:this.fillStyle});},
  fillRect(x,y,w,h){rects.push({x,y,w,h,colour:this.fillStyle});},
 };
 return {c,text,rects};
}

test('every current contents label is readable inside its column, clear of markers and page numbers',()=>{
 for(const title of MAGAZINE_TITLES.filter(t=>!t.paper))for(const date of [day(9,1),day(9,8),day(9,15),day(9,22)]){
  const issue=issueFor(title,date),{c,text,rects}=recordingPen();pagesFor(title,issue)[1].draw(c,320,440);
  const marks=rects.filter(r=>r.w===6&&r.h===30),labels=text.filter(t=>t.colour==='#2b2b2b');
  assert.equal(marks.length,7);
  const expected=[issue.head,issue.sub,...title.subs.filter(s=>s!==issue.sub).slice(0,3),"Reader's page","Next issue preview"];
  marks.forEach((mark,i)=>{
   const row=labels.filter(t=>t.top>=mark.y-3&&t.bottom<=mark.y+mark.h+3);
   assert.ok(row.length>=1&&row.length<=2,title.id+' row '+i+' stays on one or two lines');
   assert.equal(row.map(t=>t.value).join('').replace(/\s/g,''),expected[i].replace(/\s/g,''),'The complete authored headline survives wrapping');
   for(const t of row){assert.ok(t.left>=mark.x+mark.w+16&&t.right<=264.001,title.id+' label stays inside the printed column: '+JSON.stringify(t));assert.ok(t.size>=12,'Body text remains readable');}
   const number=text.find(t=>t.value===String(4+i*6)&&t.colour===mark.colour);
   assert.ok(number.left>=276&&number.right<=300.001,'Page numbers retain a separate right column');
  });
  const header=text.filter(t=>t.colour==='#fff');assert.equal(header.length,2);
  assert.ok(header[0].left>=14&&header[0].right<=306.001&&header[1].left>=14&&header[1].right<=306.001,'Header text remains on the page');
  assert.ok(header[0].bottom<header[1].top,'Section and magazine title occupy separate printed lines');
 }
});
