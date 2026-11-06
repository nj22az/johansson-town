import * as THREE from '../../../vendor/three.module.js';

export const FUTURE_CALENDAR_TIME_ZONE='Europe/Stockholm';
export const FUTURE_CALENDAR_SIZE=Object.freeze({width:.8,height:1.12});
const TITLE='Future Calendar';
const MONTHS=Object.freeze(['January','February','March','April','May','June','July','August','September','October','November','December']);
const WEEKDAYS=Object.freeze(['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']);
const dateFormatter=new Intl.DateTimeFormat('en-GB',{
 timeZone:FUTURE_CALENDAR_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',
});
const timeFormatter=new Intl.DateTimeFormat('en-GB',{
 timeZone:FUTURE_CALENDAR_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',
 hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',
});
const FONT='"Hiragino Kaku Gothic ProN","Yu Gothic",Arial,sans-serif';
const PAPER='#f4ecd8',INK='#3a3025',RED='#a64635';
const CANVAS={width:640,height:896};

function timestamp(now){
 const value=now instanceof Date?now.getTime():now;
 if(typeof value!=='number'||!Number.isFinite(value))throw new RangeError('A valid real date is required for Future Calendar');
 return value;
}
function parts(formatter,ms){
 const result={};
 for(const part of formatter.formatToParts(ms))if(part.type!=='literal')result[part.type]=Number(part.value);
 return result;
}
function utcDate(year,monthIndex,day){
 // setUTCFullYear also handles years below 100 without Date.UTC's 1900 adjustment.
 const date=new Date(0);date.setUTCFullYear(year,monthIndex,day);date.setUTCHours(0,0,0,0);return date;
}

/** A Gregorian month laid out Monday first, independent of the game clock. */
export function getFutureCalendarMonth(year,month){
 if(!Number.isInteger(year)||year<1||!Number.isInteger(month)||month<1||month>12)throw new RangeError('Invalid calendar month');
 const first=utcDate(year,month-1,1),last=utcDate(year,month,0);
 const daysInMonth=last.getUTCDate(),startColumn=(first.getUTCDay()+6)%7;
 const weeks=Array.from({length:Math.ceil((startColumn+daysInMonth)/7)},(_,row)=>
  Array.from({length:7},(_,column)=>{const day=row*7+column-startColumn+1;return day>=1&&day<=daysInMonth?day:null;}));
 return {year,month,monthName:MONTHS[month-1],daysInMonth,startColumn,weeks};
}

/** The real civil date in Stockholm; explicit instants make timezone tests deterministic. */
export function getFutureCalendarDate(now=new Date()){
 const ms=timestamp(now),{year,month,day}=parts(dateFormatter,ms),calendar=getFutureCalendarMonth(year,month);
 const weekday=WEEKDAYS[utcDate(year,month-1,day).getUTCDay()];
 const dateKey=`${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
 return {...calendar,day,weekday,dateKey,dateLabel:`${weekday}, ${day} ${calendar.monthName} ${year}`,timeZone:FUTURE_CALENDAR_TIME_ZONE};
}

function zoneOffset(ms){
 const p=parts(timeFormatter,ms),local=utcDate(p.year,p.month-1,p.day);
 local.setUTCHours(p.hour,p.minute,p.second,0);
 return local.getTime()-Math.floor(ms/1000)*1000;
}
function nextMidnight(date){
 const civilMidnight=utcDate(date.year,date.month-1,date.day+1).getTime();
 // Re-evaluate at the candidate instant so a DST change never becomes a 24-hour timer.
 let candidate=civilMidnight-zoneOffset(civilMidnight);
 candidate=civilMidnight-zoneOffset(candidate);
 return candidate;
}

function paint(ctx,date){
 const {width:w,height:h}=CANVAS;
 ctx.clearRect(0,0,w,h);ctx.fillStyle=PAPER;ctx.fillRect(0,0,w,h);
 const age=ctx.createLinearGradient(0,0,w,h);age.addColorStop(0,'rgba(255,253,238,.48)');age.addColorStop(.6,'rgba(235,217,180,.04)');age.addColorStop(1,'rgba(153,116,69,.14)');ctx.fillStyle=age;ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='#c9b58e';ctx.lineWidth=2;ctx.strokeRect(18,18,w-36,h-36);
 const write=(text,x,y,size,colour=INK,weight=600)=>{ctx.fillStyle=colour;ctx.font=`${weight} ${size}px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x,y,w-64);};
 write(TITLE,w/2,71,43,INK,800);
 ctx.strokeStyle='#b39b76';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(45,108);ctx.lineTo(w-45,108);ctx.stroke();
 write(`${date.monthName.toUpperCase()} ${date.year}`,w/2,150,34,INK,700);
 write('TODAY',w/2,207,19,RED,700);
 write(`${String(date.day).padStart(2,'0')} ${date.monthName.slice(0,3).toUpperCase()} ${date.year}`,w/2,255,53,INK,800);
 write(date.weekday,w/2,302,26,INK,500);
 const left=52,cellWidth=(w-left*2)/7,top=410,rowHeight=62;
 ['MON','TUE','WED','THU','FRI','SAT','SUN'].forEach((day,column)=>write(day,left+(column+.5)*cellWidth,363,19,column>=5?RED:INK,700));
 ctx.strokeStyle='#d1bea0';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(left,384);ctx.lineTo(w-left,384);ctx.stroke();
 date.weeks.forEach((week,row)=>week.forEach((day,column)=>{
  if(day===null)return;
  const x=left+(column+.5)*cellWidth,y=top+row*rowHeight;
  if(day===date.day){ctx.fillStyle='#e5cabb';ctx.beginPath();ctx.arc(x,y,26,0,Math.PI*2);ctx.fill();ctx.strokeStyle=RED;ctx.lineWidth=3;ctx.stroke();}
  write(String(day),x,y,29,column>=5?RED:INK,day===date.day?800:500);
 }));
 write('Today is circled',w/2,810,20,'#78654e',500);
 // A darker crease and warm edge give the lifted lower paper a little age.
 const curl=ctx.createLinearGradient(0,h-56,0,h);curl.addColorStop(0,'rgba(172,144,101,0)');curl.addColorStop(.4,'rgba(172,144,101,.10)');curl.addColorStop(1,'rgba(255,251,232,.60)');ctx.fillStyle=curl;ctx.fillRect(0,h-56,w,56);
}

/** Centered paper, facing local +Z. Place and rotate group on the room wall. */
export function createFutureCalendar({now=new Date()}={}){
 const {width,height}=FUTURE_CALENDAR_SIZE;
 const canvas=document.createElement('canvas');canvas.width=CANVAS.width;canvas.height=CANVAS.height;
 const ctx=canvas.getContext('2d');
 if(!ctx)throw new Error('Future Calendar needs a 2D canvas');
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const group=new THREE.Group();group.name=TITLE;
 const geometry=new THREE.PlaneGeometry(width,height,1,16),position=geometry.attributes.position;
 for(let i=0;i<position.count;i++){
  const rise=Math.max(0,(.12-(position.getY(i)+height/2))/.12);
  position.setZ(i,.008+rise*rise*.042);
 }
 geometry.computeVertexNormals();
 const material=new THREE.MeshStandardMaterial({map:texture,roughness:.92,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(geometry,material);mesh.name=TITLE;group.add(mesh);
 const backing=new THREE.Mesh(new THREE.BoxGeometry(width,height,.012),new THREE.MeshStandardMaterial({color:0xeee3ca,roughness:1}));
 backing.position.z=-.005;backing.name='Future Calendar paper thickness';group.add(backing);
 const pin=new THREE.Mesh(new THREE.SphereGeometry(.022,8,6),new THREE.MeshStandardMaterial({color:0x8f714c,roughness:.6,metalness:.2}));
 pin.scale.z=.48;pin.position.set(0,height/2-.045,.022);pin.name='Future Calendar mounting pin';group.add(pin);
 let dayKey=null,lastObserved=-Infinity,midnight=-Infinity,disposed=false;
 function update(realNow=new Date()){
  if(disposed)return false;
  const ms=timestamp(realNow);
  if(ms>=lastObserved&&ms<midnight){lastObserved=ms;return false;}
  lastObserved=ms;
  const date=getFutureCalendarDate(ms);midnight=nextMidnight(date);
  if(date.dateKey===dayKey)return false;
  dayKey=date.dateKey;paint(ctx,date);texture.needsUpdate=true;
  Object.assign(mesh.userData,{title:TITLE,dateKey:date.dateKey,dateLabel:date.dateLabel,timeZone:date.timeZone,
   calendarYear:date.year,calendarMonth:date.month,highlightedDay:date.day,daysInMonth:date.daysInMonth});
  return true;
 }
 function dispose(){
  if(disposed)return;disposed=true;
  texture.dispose();
  for(const object of [mesh,backing,pin]){object.geometry.dispose();object.material.dispose();}
  group.removeFromParent();
 }
 update(now);
 return {group,mesh,update,dispose};
}
