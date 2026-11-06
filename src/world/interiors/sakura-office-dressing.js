import * as THREE from '../../../vendor/three.module.js';
import {HARBOUR_LINE,BUS_DWELL,CROSSING_MINUTES} from '../../people/commuter-schedule.js';
import {CARGO_CALLS} from '../cargo-shipping.js';
import {FERRY_TIMETABLE} from '../ferry-timetable.js';
import {CARGO_BOAT_LOOK} from '../harbour-boats.js';

/**
 * What Sakura's office storey holds besides its furniture (the owner, 20 October 2026, with a diorama of a 1997 Okinawa
 * harbour office: "Here are some suggestions on how to enhance the office, maybe something can be useful"). Studied, not
 * copied: each thing is here because somebody in the town uses it, and says who and why, so a story can pick it up.
 * Left out, with the reason: an ashtray (nobody in the cast smokes), the marine radio, hard hat and life vest (this is a
 * konbini's office, not the harbour master's), a beer carton (Sakura Trading supplies the alcohol; the rest room is not its
 * store), a noren at the futon cupboard (it has its sliding fronts), the fan's ribbons (they would have to flutter).
 *
 * Coordinates are the office's frame (sakura-office-room.js). Everything printed is one 1024 px sheet (one texture, one
 * material, merged into one mesh with the room); every thin layer stands at least 4 mm off what it lies on or hangs
 * from (tests/no-z-fighting.test.mjs scans the storey down to 0.0005 m²).
 */
const two=n=>String(n).padStart(2,'0');
export const clock=m=>{const t=((Math.round(m)%1440)+1440)%1440;return two(Math.floor(t/60))+':'+two(t%60);};

/**
 * The departures whiteboard, from the town's own timetables: the Minato Maru's commuter boats (commuter-schedule.js
 * HARBOUR_LINE, alongside BUS_DWELL minutes) and the Naha cargo boat's two calls (cargo-shipping.js CARGO_CALLS, the
 * two boats on alternate days, harbour-boats.js CARGO_BOAT_LOOK). Sakura sells the ferry punch cards over the counter
 * (sakura-layout.js 'ferry-tickets', port-hall.js's shelf of leaflets; single crossings are bought at the Port Terminal
 * window), so Thuan is asked the times all day; and the shop lives by them: her boat home, the depot's deliveries off
 * the cargo boat, the Coral Bay Bar's order out to Kitano-jima on the morning boat (merchandising.js
 * ACCOUNTS.sakura['coral-bay-bar']).
 */
export function sakuraDeparturesBoard(){
 const names=CARGO_BOAT_LOOK.names,cargo=Object.values(names).map(n=>n.bow.replace(/\s+/g,''));
 const ferry=HARBOUR_LINE.map(m=>({in:clock(m),out:clock(m+BUS_DWELL)}));
 // Her first boat out from her night berth and her last boat back to it (ferry-timetable.js), above and below the calls.
 const first=FERRY_TIMETABLE[0],last=FERRY_TIMETABLE.at(-1);
 return Object.freeze({
  title:'予定表　出港・帰港',
  ferry:Object.freeze({boat:'みなと丸',route:'港町 ⇄ 北野島',minutes:CROSSING_MINUTES,calls:Object.freeze(ferry),
  first:Object.freeze({out:clock(first.departs)}),last:Object.freeze({out:clock(last.departs),in:clock(last.arrives)})}),
  cargo:Object.freeze({boat:cargo.join('・'),from:'那覇',alternate:true,calls:Object.freeze(CARGO_CALLS.map(c=>({in:clock(c.alongside),out:clock(c.departure)})))}),
  notes:Object.freeze([
   Object.freeze({at:ferry[0].out,jp:'コーラルベイ注文 → 北野島',why:'The Coral Bay Bar’s order goes out to Kitano-jima on the morning boat.'}),
   Object.freeze({at:ferry[2].out,jp:'タン帰宅',why:'Thuan’s boat home: the shop shuts at 20:30 and the last boat does not wait.'}),
  ]),
  english:'Departures board. Minato Maru to Kitano-jima, a '+CROSSING_MINUTES+'-minute crossing: in '+ferry.map(f=>f.in).join(', ')+', out '+ferry.map(f=>f.out).join(', ')
   +'; the first boat out at '+clock(first.departs)+', and the last back from Kitano-jima at '+clock(last.departs)+', in at '+clock(last.arrives)+'. She does not wait. The Naha cargo boat ('+Object.keys(names).join(' and ')+', on alternate days): alongside '+CARGO_CALLS.map(c=>clock(c.alongside)+' to '+clock(c.departure)).join(' and ')
   +'. In red: the Coral Bay Bar order on the '+ferry[0].out+', and Thuan home on the '+ferry[2].out+'.',
 });
}

/** Every dressing piece: where it is, who it is for and why, what makes it 1997. */
const D=(id,name,room,at,who,why,period=null)=>Object.freeze({id,name,room,at:Object.freeze(at),who,why,...(period?{period}:{})});
export const SAKURA_OFFICE_DRESSING=Object.freeze([
 D('departures','Departures whiteboard','office',[5.35,1.55,.55],'Thuan','The boats the shop lives by, written up from the timetables, for Thuan and for the customers who buy their ferry punch cards at the till: her boat home at 22:15, the cargo boat that brings the depot’s stock, the morning boat that takes the Coral Bay Bar’s order. Over the fridge on the back wall, where she sees it from the desk and from the door.','A magnetic whiteboard in an aluminium frame, marker tray and two magnets; the times in black, the shop’s own notes in red.'),
 D('route-map','Route map poster','office',[6.34,1.55,1],'Thuan','The sea lanes the shop’s stock comes by: the cargo boats from Naha to Minato and the Minato Maru over to Kitano-jima, where the Coral Bay Bar is an account. A shipping agent’s give-away.','沖縄航路図: a printed route map, the routes in red over a pale sea, as the island lines handed out to their customers.'),
 D('desk-mat','Desk mat','office',[5.9,.74,2.15],'Thuan','A green vinyl mat over the desk top, the day’s notes tucked under it: the depot’s number, Kōji’s round days, the bank’s hours.','Green transparent PVC desk mats were on every Japanese office desk.'),
 D('hanko','Hanko tray','office',[5.76,.74,2.6],'Thuan','The shop’s seal and its red ink pad: every delivery slip from the depot is stamped received.','A lacquered tray with the company seal (角印) and a shuniku pad.'),
 D('pen-can','Pen can','office',[6.2,.74,1.86],'Thuan','A rinsed coffee can from the shop’s own cold cabinet, holding the pens and the red marker for the board.','A 190 g steel coffee can, the island’s favourite, its label an invented one (島珈琲).'),
 D('binoculars','Binoculars','office',[6.2,.74,1.68],'Thuan','On the desk by the harbour window: she watches for the depot’s van on the quay and for the cargo boat coming in.','Black 7 × 50 porro-prism binoculars.'),
 D('shisa','Shisa pair','office',[6.05,.62,4.2],'Thuan','Two terracotta shisa on a little tray on the safe, guarding the takings: one mouth open, one closed.','Small Tsuboya-style unglazed shisa.'),
 D('archive-boxes','Archive boxes','office',[5.13,1.32,4.18],'Thuan','The last two years’ slips in boxes on the filing cabinet, waiting to go across the hall to the archive.','Cardboard document boxes, the year written on the end: 平成7年, 平成8年.'),
 D('shelf-plan','Rolled shelf plan','office',[5.13,1.76,4.18],'Thuan','The shop’s shelf plan (棚割表) rolled in a tube, for the next re-lay of the aisles.','A cardboard drawing tube.'),
 D('mosquito-pig','Mosquito-coil pig','office',[6.05,0,1.2],'Thuan','A green ceramic pig with a coil inside, under the harbour window: when the sash is open at dusk the mosquitoes come in off the harbour.','蚊遣り豚 with a green spiral coil.'),
 D('binders','Blue binders','office',[1.18,0,4.32],'Thuan','This year’s binders on the ledger shelf, each with its white spine label: purchases, sales, staff, the depot, the bouquets. One leans, a few lie flat.','Blue ring binders with printed white spine labels, as every office bought them.'),
 D('switch-plates','Light switches','storey',null,'everyone','A chunky switch plate by each door, its cable in a surface moulding up to the ceiling: the wiring was added after the building went up.','Ivory wide-rocker plates and painted cable mouldings.'),
 D('skirting','Skirting','storey',null,'everyone','A dark skirting board (巾木) along every wall of the office and the hall, where mops and slippers would mark the plaster.','Dark-stained timber 巾木, 7 cm.'),
 D('door-mat','Door mat','hall',[.44,0,1.1],'staff','A green mat on the hall floor at the office door: slippers are wiped before the office’s floor.','A green rubber-backed mat.'),
 D('safety-poster','Typhoon safety poster','hall',[.696,1.5,-2.85],'everyone','The typhoon checks in the hall where everyone passes them: the shutter, the sandbags at the back door, torch and batteries, water, the fire escape clear.','安全第一 / 台風対策確認, a green-cross safety poster.'),
 D('tea-tins','Tea tin and coffee jar','office',[3.7,.85,.68],'staff','Sanpin-cha in a tin and a jar of instant coffee: what the staff drink on a break.','さんぴん茶 jasmine tea, Okinawa’s everyday tea.'),
 D('dish-drainer','Dish drainer','office',[3.0,.85,.9],'staff','Beside the sink, the mugs drying.','A blue plastic dish drainer.'),
 D('open-shelf','Open shelf','office',[3.2,1.35,.66],'staff','Under the wall cupboard: cup noodles for a long day, the tea bowls.','Cup noodles (an invented brand) and stacked yunomi.'),
 D('tenugui','Tenugui','office',[4.46,.9,.85],'staff','A hand towel hung on the side of the fridge.','A printed cotton tenugui.'),
 D('garbage-schedule','Garbage schedule','office',[4.08,.9,1.15],'staff','The town hall’s collection days, held on the fridge by magnets: who takes the office’s rubbish down on which day.','A town-hall printed sheet, ごみ収集日.'),
 D('sink-mat','Bamboo mat','office',[2.45,0,1.4],'staff','In front of the sink, where the floor gets wet.','A slatted bamboo mat.'),
 D('tea-set','Tea on the low table','restRoom',[-.35,.36,2.5],'staff','A yunomi on a bamboo coaster, a manga left open, a tin of chinsuko: the end of a break.','Chinsuko, the Okinawan shortbread, in its tin.'),
 D('television','Television','restRoom',[-.6,0,4.12],'staff','A 14-inch set on a low stand for the news and the weather, facing the low table.','A 14-inch CRT with a rabbit-ear aerial.'),
 D('carton','Sakura Trading carton','restRoom',[-2.5,.385,3.9],'staff','A reused carton from the depot on the storage case in the futon cupboard, with the spare towels and the summer quilt.','A plain kraft carton with the depot’s stencil (さくら商事).'),
]);

// ---- the printed sheet: one canvas, regions in pixels (x0, y0, x1, y1), top-left origin.
const SHEET=1024;
const R=Object.freeze({
 board:[0,0,512,340],mat:[512,0,768,160],map:[768,0,1024,350],safety:[0,340,256,700],garbage:[256,340,384,520],
 labels:[384,340,960,404],boxes:[256,520,512,584],can:[512,520,640,584],tin:[640,520,768,584],cup:[768,520,896,584],
 chinsuko:[896,520,1024,600],manga:[0,700,160,810],screen:[160,700,288,796],gauge:[288,700,320,828],tenugui:[320,700,448,870],
 bamboo:[448,700,576,828],carton:[576,700,704,764],coaster:[704,700,768,764],
});
const BINDER_LABELS=['仕入 1','仕入 2','売上 1','売上 2','人事','本部','配送','花・装飾','銀行','税','見積','雑'];
const JP='"Hiragino Sans","Yu Gothic","Noto Sans CJK JP",sans-serif';

function drawSheet(ctx){
 const at=(r,draw)=>{const [x0,y0,x1,y1]=r;ctx.save();ctx.translate(x0,y0);ctx.beginPath();ctx.rect(0,0,x1-x0,y1-y0);ctx.clip();draw(x1-x0,y1-y0);ctx.restore();};
 const text=(s,x,y,px,c='#2c2620',align='left',weight='bold')=>{ctx.fillStyle=c;ctx.font=`${weight} ${px}px ${JP}`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y);};
 const B=sakuraDeparturesBoard();
 at(R.board,(w,h)=>{ctx.fillStyle='#f7f7f2';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#c9cfd2';ctx.lineWidth=2;for(let y=83;y<h;y+=34){ctx.beginPath();ctx.moveTo(14,y);ctx.lineTo(w-14,y);ctx.stroke();}
  text(B.title,w/2,30,30,'#1f2a44','center');
  text(B.ferry.boat+'  '+B.ferry.route+'  '+B.ferry.minutes+'分',18,66,22,'#1f2a44');
  // Five rows: the first boat out, the three calls, the last boat back from Kitano-jima.
  const rows=['始発　　　　発 '+B.ferry.first.out,...B.ferry.calls.map(c=>'着 '+c.in+'  →  発 '+c.out),'最終 北野島発 '+B.ferry.last.out+' → 着 '+B.ferry.last.in];
  rows.forEach((r,i)=>text(r,40,100+i*34,22,'#1d1d1d','left','normal'));
  text('貨物船 '+B.cargo.boat+'（'+B.cargo.from+'・隔日）',18,250,20,'#1f2a44');
  B.cargo.calls.forEach((c,i)=>text('着岸 '+c.in+' → 出港 '+c.out,40+i*236,292,19,'#1d1d1d','left','normal'));
  // The shop's own notes in red, in the right-hand column beside their boats.
  B.notes.forEach((n,i)=>{const y=i?202:134,[a,b]=n.jp.split(' → ');text(a,352,y-10,16,'#c0322b');if(b)text('→ '+b,352,y+12,16,'#c0322b');});
  ctx.strokeStyle='#c0322b';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(118,202,92,16,0,0,Math.PI*2);ctx.stroke();});
 at(R.mat,(w,h)=>{ctx.fillStyle='#9fc4a8';ctx.fillRect(0,0,w,h);
  for(const [x,y,ww,hh,c,lines] of [[12,14,70,60,'#fff7b8',['本部','0980','-72']],[96,30,58,70,'#ffffff',['ヒガ','土曜','発注']],[170,20,74,52,'#ffd9d0',['銀行','9-15時']]]){ctx.fillStyle=c;ctx.fillRect(x,y,ww,hh);lines.forEach((s,i)=>text(s,x+6,y+14+i*17,13,'#3a3a3a','left','normal'));}
  ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(0,0,w,10);ctx.fillRect(0,0,8,h);});
 at(R.map,(w,h)=>{ctx.fillStyle='#e9f1f2';ctx.fillRect(0,0,w,h);ctx.fillStyle='#2f6f9a';ctx.fillRect(0,0,w,46);text('沖縄航路図',w/2,24,26,'#ffffff','center');
  ctx.fillStyle='#cfe3ea';ctx.fillRect(12,58,w-24,h-104);
  const isle=(x,y,rx,ry,name,dx=0)=>{ctx.fillStyle='#d9c99a';ctx.beginPath();ctx.ellipse(x,y,rx,ry,.3,0,Math.PI*2);ctx.fill();text(name,x+dx,y-ry-12,17,'#2c2620','center');};
  isle(70,250,40,26,'那覇');isle(160,150,30,20,'港町');isle(206,92,18,12,'北野島',-6);
  ctx.strokeStyle='#c0322b';ctx.lineWidth=4;ctx.setLineDash([10,7]);ctx.beginPath();ctx.moveTo(92,236);ctx.lineTo(146,164);ctx.moveTo(176,138);ctx.lineTo(198,102);ctx.stroke();ctx.setLineDash([]);
  text('貨物船',100,190,14,'#c0322b');text('みなと丸 22分',150,106,13,'#c0322b','right');text('平成9年度',w/2,h-24,15,'#2c2620','center','normal');});
 at(R.safety,(w,h)=>{ctx.fillStyle='#fbfbf6';ctx.fillRect(0,0,w,h);ctx.fillStyle='#2f8a4e';ctx.fillRect(0,0,w,70);ctx.fillStyle='#ffffff';ctx.fillRect(20,14,42,42);ctx.fillStyle='#2f8a4e';ctx.fillRect(36,18,10,34);ctx.fillRect(24,30,34,10);
  text('安全第一',150,36,32,'#ffffff','center');text('台風対策確認',w/2,98,26,'#1f2a44','center');
  ['シャッター','裏口の土のう','懐中電灯・電池','飲料水','非常口・はしご','窓の養生'].forEach((s,i)=>{ctx.strokeStyle='#2c2620';ctx.lineWidth=2;ctx.strokeRect(24,132+i*36,20,20);text(s,56,142+i*36,19,'#2c2620','left','normal');});
  text('さくら商事',w/2,h-20,16,'#2c2620','center','normal');});
 at(R.garbage,(w,h)=>{ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.fillStyle='#4a8a5a';ctx.fillRect(0,0,w,30);text('ごみ収集日',w/2,16,17,'#ffffff','center');
  [['燃やす','月・木'],['資源','水'],['缶・びん','第2・4金'],['粗大','申込']].forEach(([a,b],i)=>{text(a,8,48+i*30,14,'#2c2620','left','normal');text(b,w-8,48+i*30,14,'#c0322b','right');});text('港町役場',w/2,h-12,12,'#555','center','normal');});
 at(R.labels,(w,h)=>{BINDER_LABELS.forEach((s,i)=>{const x=i*48;ctx.fillStyle='#f4f4ee';ctx.fillRect(x,0,46,h);ctx.save();ctx.translate(x+23,h/2);ctx.rotate(-Math.PI/2);text(s,0,0,13,'#1f2a44','center');ctx.restore();});});
 at(R.boxes,(w,h)=>{['平成7年','平成8年'].forEach((s,i)=>{ctx.fillStyle='#c9a774';ctx.fillRect(i*128,0,126,h);ctx.fillStyle='#f6f1e4';ctx.fillRect(i*128+14,12,98,40);text(s,i*128+63,32,20,'#2c2620','center');});});
 at(R.can,(w,h)=>{ctx.fillStyle='#7a4a2a';ctx.fillRect(0,0,w,h);ctx.fillStyle='#e8d9b0';ctx.fillRect(0,16,w,30);text('島珈琲',w/2,31,18,'#7a4a2a','center');});
 at(R.tin,(w,h)=>{ctx.fillStyle='#2f7a52';ctx.fillRect(0,0,w,h);text('さんぴん茶',w/2,h/2,19,'#fff7d6','center');});
 at(R.cup,(w,h)=>{ctx.fillStyle='#f2efe6';ctx.fillRect(0,0,w,h);ctx.fillStyle='#d23b2f';ctx.fillRect(0,0,w,22);text('みなとヌードル',w/2,42,15,'#d23b2f','center');});
 at(R.chinsuko,(w,h)=>{ctx.fillStyle='#d9a441';ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff3d6';ctx.fillRect(10,14,w-20,h-28);text('ちんすこう',w/2,h/2,19,'#8a3a1e','center');});
 at(R.manga,(w,h)=>{ctx.fillStyle='#fbfaf4';ctx.fillRect(0,0,w,h);ctx.fillStyle='#b8b3a4';ctx.fillRect(w/2-1,0,2,h);ctx.strokeStyle='#2c2620';ctx.lineWidth=2;
  for(const [x,y,ww,hh] of [[8,8,64,44],[8,58,64,44],[88,8,64,30],[88,44,64,58]]){ctx.strokeRect(x,y,ww,hh);}ctx.fillStyle='#2c2620';ctx.beginPath();ctx.arc(40,30,9,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(120,74,12,0,Math.PI*2);ctx.fill();});
 at(R.screen,(w,h)=>{const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#3d4a4f');g.addColorStop(1,'#1d2427');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.fillStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.ellipse(36,26,30,12,-.4,0,Math.PI*2);ctx.fill();});
 at(R.gauge,(w,h)=>{ctx.fillStyle='#e8e6dc';ctx.fillRect(0,0,w,h);ctx.fillStyle='#bfe0ef';ctx.fillRect(10,10,12,h-20);ctx.fillStyle='#4f9fd0';ctx.fillRect(10,58,12,h-68);});
 at(R.tenugui,(w,h)=>{ctx.fillStyle='#f1f4f6';ctx.fillRect(0,0,w,h);ctx.fillStyle='#2f5f9a';for(let y=0;y<h;y+=24)for(let x=(y/24)%2*16;x<w;x+=32){ctx.beginPath();ctx.arc(x,y+12,7,0,Math.PI*2);ctx.fill();}});
 at(R.bamboo,(w,h)=>{ctx.fillStyle='#c8ad72';ctx.fillRect(0,0,w,h);ctx.fillStyle='#9e8350';for(let x=0;x<w;x+=16)ctx.fillRect(x,0,3,h);});
 at(R.carton,(w,h)=>{ctx.fillStyle='#c39a66';ctx.fillRect(0,0,w,h);text('さくら商事',w/2,h/2,22,'#5a3a22','center');});
 at(R.coaster,(w,h)=>{ctx.fillStyle='#b99d62';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#8a7140';ctx.lineWidth=3;for(let r=6;r<32;r+=6){ctx.beginPath();ctx.arc(w/2,h/2,r,0,Math.PI*2);ctx.stroke();}});
}

/** UVs of a geometry squeezed into a region of the sheet (CanvasTexture flips Y: v 0 is the sheet's bottom). */
function intoRegion(geometry,[x0,y0,x1,y1]){
 const uv=geometry.attributes.uv,u0=x0/SHEET,u1=x1/SHEET,v0=1-y1/SHEET,v1=1-y0/SHEET;
 for(let i=0;i<uv.count;i++)uv.setXY(i,u0+uv.getX(i)*(u1-u0),v0+uv.getY(i)*(v1-v0));
 uv.needsUpdate=true;return geometry;
}

/**
 * Dresses the storey. `box`, `cyl`, `collider`, `anchor`, `action` and `mat` are the room builder's (sakura-office-room.js):
 * its plain pieces merge with the room's; the printed ones share the sheet's one material and merge into one mesh.
 */
export function buildSakuraOfficeDressing({room,box,cyl,anchor,action,paint}){
 const sheet=paint(SHEET,SHEET,ctx=>drawSheet(ctx));
 // Prints are decals on what they are printed on, drawn in front of it by polygon offset (the Sakura surface audit).
 const printed=sheet?new THREE.MeshStandardMaterial({map:sheet,roughness:.85,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4}):null;
 /** A printed face: a plane of the sheet's region, at `at`, turned by yaw (0 faces +z), or laid flat (face up). */
 const print=(region,[w,h],at,{yaw=0,flat=false,name,fallback=0xf2efe6}={})=>{
  const g=intoRegion(new THREE.PlaneGeometry(w,h),region),m=new THREE.Mesh(g,printed||new THREE.MeshStandardMaterial({color:fallback,roughness:.83}));
  m.position.set(...at);if(flat)m.rotation.set(-Math.PI/2,0,yaw);else m.rotation.y=yaw;m.name=name;room.add(m);return m;};
 /** A printed cylinder's side (cans, tins, cups): the region wraps round it once. */
 const printedCyl=(region,r,h,at,name,fallback)=>{const g=intoRegion(new THREE.CylinderGeometry(r,r,h,14,1,true),region),m=new THREE.Mesh(g,printed||new THREE.MeshStandardMaterial({color:fallback,roughness:.83}));m.position.set(...at);m.name=name;room.add(m);return m;};
 const item=id=>SAKURA_OFFICE_DRESSING.find(d=>d.id===id);
 const STEEL=0x9aa3a6,DARK=0x3b3f42;

 // ---- the office: the departures board over the fridge, the route map on the harbour wall
 {const [x,y,z]=item('departures').at,w=1.2,h=.8;
  box([w,h,.016],[x,y,z+.006],0xf7f7f2,'Whiteboard backing');
  print(R.board,[w-.04,h-.04],[x,y,z+.018],{name:'Departures whiteboard'});
  for(const [sx,sy,px,py] of [[w+.03,.025,0,h/2],[w+.03,.025,0,-h/2],[.025,h,-w/2,0],[.025,h,w/2,0]])box([sx,sy,.026],[x+px,y+py,z+.013],STEEL,'Whiteboard frame');
  box([.6,.03,.06],[x,y-h/2-.03,z+.03],STEEL,'Whiteboard marker tray');
  for(const [dx,c] of [[-.12,0x1d1d1d],[.0,0xc0322b]])cyl(.008,.13,[x+dx,y-h/2-.008,z+.035],c,'Whiteboard marker',6).rotation.z=Math.PI/2;
  for(const [dx,dy] of [[-.45,.3],[.4,.32]])cyl(.016,.012,[x+dx,y+dy,z+.03],0xc0322b,'Whiteboard magnet',10).rotation.x=Math.PI/2;
  anchor([x,1.2,z+.6],'Read the departures board',()=>action('read','Departures board',sakuraDeparturesBoard().english));}
 {const [x,y,z]=item('route-map').at;print(R.map,[.5,.68],[x-.005,y,z],{yaw:-Math.PI/2,name:'Route map poster'});}

 // ---- the desk: the mat and its notes, the seal, the pen can, the binoculars
 {const [x,y,z]=item('desk-mat').at;print(R.mat,[.8,.5],[x,y+.004,z],{flat:true,yaw:-Math.PI/2,name:'Desk mat',fallback:0x9fc4a8});}
 {const [x,y,z]=item('hanko').at;box([.13,.025,.08],[x,y+.0165,z],0x5a2a22,'Hanko tray');cyl(.022,.012,[x+.03,y+.035,z],0xc0322b,'Ink pad',12);cyl(.008,.05,[x-.035,y+.054,z],0x8a6a48,'Hanko',8);}
 {const [x,y,z]=item('pen-can').at;printedCyl(R.can,.033,.105,[x,y+.0565,z],'Pen can',0x7a4a2a);cyl(.0335,.004,[x,y+.002,z],0x9a9a92,'Pen can base',14);/* the seamed base under the can, not inside it */
  for(const [dx,dz,a,c] of [[.01,0,.12,0x1d4e9a],[-.012,.008,-.1,0xc0322b],[0,-.012,.05,0x1d1d1d]]){const p=cyl(.004,.15,[x+dx,y+.12,z+dz],c,'Pen',5);p.rotation.z=a;}}
 {const [x,y,z]=item('binoculars').at;for(const dz of [-.035,.035]){const b=cyl(.026,.12,[x,y+.03,z+dz],DARK,'Binoculars barrel',10);b.rotation.z=Math.PI/2;}box([.05,.03,.04],[x,y+.03,z],DARK,'Binoculars bridge');}

 // ---- the safe, the filing cabinet, the floor by the window
 {const [x,y,z]=item('shisa').at;box([.42,.02,.18],[x,y+.01,z],0x8a6a48,'Shisa tray');
  for(const [dx,open] of [[-.1,true],[.1,false]]){const sx=x+dx,c=0xb8643c;box([.08,.022,.08],[sx,y+.031,z],c,'Shisa');box([.065,.07,.06],[sx,y+.077,z+.006],c,'Shisa');box([.075,.06,.07],[sx,y+.142,z-.012],c,'Shisa');
   box([.05,open?.02:.008,.012],[sx,y+.128,z-.05],0x7a3a22,'Shisa mouth');}}
 {const [x,y,z]=item('archive-boxes').at;box([.4,.21,.3],[x,y+.105,z],0xc9a774,'Archive box');box([.4,.21,.3],[x+.01,y+.315,z+.02],0xc9a774,'Archive box');
  print([R.boxes[0],R.boxes[1],R.boxes[0]+126,R.boxes[3]],[.17,.08],[x,y+.105,z-.154],{yaw:Math.PI,name:'Archive box label'});
  print([R.boxes[0]+128,R.boxes[1],R.boxes[2]-2,R.boxes[3]],[.17,.08],[x+.01,y+.315,z+.02-.154],{yaw:Math.PI,name:'Archive box label'});
  cyl(.04,.6,[x,y+.46,z],0x6f6a5c,'Shelf plan tube',10).rotation.x=Math.PI/2;}
 {const [x,,z]=item('mosquito-pig').at,c=0x4f8a5a;const body=cyl(.075,.13,[x,.085,z],c,'Mosquito-coil pig',14);body.rotation.z=Math.PI/2;
  cyl(.035,.02,[x-.075,.085,z],0x3d6e47,'Mosquito-coil pig snout',10).rotation.z=Math.PI/2;
  for(const dz of [-.04,.04])box([.02,.03,.025],[x-.035,.16,z+dz],c,'Mosquito-coil pig ear');
  for(const [dx,dz] of [[-.04,-.04],[-.04,.04],[.04,-.04],[.04,.04]])cyl(.014,.02,[x+dx,.01,z+dz],c,'Mosquito-coil pig leg',6);
  cyl(.05,.006,[x+.068,.085,z],0x2e5a3a,'Mosquito coil',16).rotation.z=Math.PI/2;}

 // ---- the ledger shelf: blue binders with white spine labels; one leaning, a flat pile on the top board
 {const [x,,z]=item('binders').at,w=.75;let k=0;
  for(let row=0;row<3;row++)for(let i=0;i<(row===2?3:6);i++){
   // The last of the middle row leans towards the shelf's side.
   const lean=row===1&&i===5?-.18:0,bx=x-w/2+.1+i*.105+(lean?.02:0),by=.2+row*.58,b=box([.075,.3,.28],[bx,by,z+.01],[0x2f5fa0,0x2f5fa0,0x3a6aa8][(i+row)%3],'Binder');b.rotation.z=lean;
   const lab=print([R.labels[0]+(k%12)*48,R.labels[1],R.labels[0]+(k%12)*48+46,R.labels[3]],[.04,.1],[bx-Math.sin(lean)*.03,by+Math.cos(lean)*.03,z+.01-.144],{yaw:Math.PI,name:'Binder spine label'});lab.rotation.z=-lean;k++;}
  for(let s=0;s<3;s++)box([.3,.035,.24],[x+.18,1.2+.0125+.0175+s*.036,z+.01],[0x2f5fa0,0xd8cdb0,0x3a6aa8][s],'Binder pile');}

 // ---- the kitchenette: the open shelf, the tins, the drainer, the towel, the schedule on the fridge, the mat
 {const [x,y,z]=item('open-shelf').at;box([1,.02,.22],[x,y,z-.002],0xd3c8ae,'Open shelf');for(const dx of [-.45,.45])box([.02,.08,.18],[x+dx,y-.05,z-.01],0xb8b0a0,'Open shelf bracket');
  for(const dx of [-.38,-.26,-.14]){printedCyl(R.cup,.048,.09,[x+dx,y+.055,z],'Cup noodles',0xf2efe6);cyl(.05,.006,[x+dx,y+.103,z],0xe8e2d0,'Cup noodles lid',14);}
  for(let s=0;s<3;s++)cyl(.052,.055,[x+.25,y+.0375+s*.055,z],[0x8c6a5d,0xe8e4d8,0x5d7a8c][s],'Tea bowl',12);}
 {const [x,y,z]=item('tea-tins').at;printedCyl(R.tin,.045,.13,[x,y+.065,z],'Sanpin-cha tin',0x2f7a52);cyl(.046,.008,[x,y+.134,z],0xc9c9c0,'Tin lid',14);cyl(.044,.004,[x,y+.002,z],0x2f7a52,'Tin base',14);
  cyl(.04,.1,[x+.12,y+.05,z],0x5a3a22,'Instant coffee jar',12);cyl(.042,.025,[x+.12,y+.1125,z],0xe8e4d8,'Coffee jar lid',12);}
 {const [x,y,z]=item('dish-drainer').at;box([.34,.012,.26],[x,y+.006,z],0x3f86c4,'Dish drainer');for(const dz of [-.13,.13])box([.34,.07,.012],[x,y+.012+.035,z+dz*.95],0x3f86c4,'Dish drainer side');
  for(const [dx,c] of [[-.08,0xe8e4d8],[.06,0x8c6a5d]]){const m=cyl(.04,.09,[x+dx,y+.07,z],c,'Mug',10);m.rotation.x=.5;}}
 {const [x,y,z]=item('tenugui').at;box([.015,.015,.32],[x+.012,y+.24,z],0xb4beb8,'Towel rail');print(R.tenugui,[.28,.42],[x+.012,y+.02,z],{yaw:Math.PI/2,name:'Tenugui'});}
 {const [x,y,z]=item('garbage-schedule').at;print(R.garbage,[.2,.28],[x,y,z+.004],{name:'Garbage schedule'});for(const [dx,dy] of [[-.08,.12],[.08,.12]])cyl(.012,.008,[x+dx,y+dy,z+.012],0xe0b33a,'Fridge magnet',10).rotation.x=Math.PI/2;}
 {const [x,,z]=item('sink-mat').at;print(R.bamboo,[.5,.36],[x,.005,z],{flat:true,name:'Bamboo mat',fallback:0xc8ad72});}

 // ---- the rest room: the tea things on the low table, the television in the corner, the carton in the cupboard
 {const [x,y,z]=item('tea-set').at;print(R.coaster,[.09,.09],[x+.12,y+.004,z-.1],{flat:true,name:'Bamboo coaster'});cyl(.034,.08,[x+.12,y+.044,z-.1],0x6f8a7a,'Yunomi',12);
  box([.25,.008,.17],[x-.12,y+.004,z+.06],0xf4f1e6,'Open manga').rotation.y=.3;print(R.manga,[.25,.17],[x-.12,y+.012,z+.06],{flat:true,yaw:.3,name:'Open manga pages'});
  box([.16,.045,.1],[x+.12,y+.0225,z+.15],0xd9a441,'Chinsuko tin');print(R.chinsuko,[.15,.09],[x+.12,y+.049,z+.15],{flat:true,name:'Chinsuko tin lid'});}
 {const [x,,z]=item('television').at;box([.52,.3,.4],[x,.17,z],0x7a5638,'Television stand',true);
  box([.38,.33,.36],[x,.32+.165,z],0x4a4c4e,'Television');print(R.screen,[.27,.21],[x,.5,z-.184],{yaw:Math.PI,name:'Television screen'});
  box([.07,.02,.05],[x,.66,z+.05],0x2c2e30,'Aerial base');for(const a of [-.45,.45]){const e=cyl(.004,.38,[x+Math.sin(a)*.19,.67+.19*Math.cos(a),z+.05],0xb4b4ac,'Rabbit-ear aerial',4);e.rotation.z=-a;}
  anchor([x,1,z-.6],'Watch the television',()=>action('read','Rest room television','The midday news from Naha and the weather for the islands: the typhoon map, the wave heights for the ferries.'));}
 {const [x,y,z]=item('carton').at;box([.45,.3,.38],[x,y+.15,z],0xc39a66,'Sakura Trading carton');print(R.carton,[.3,.15],[x+.229,y+.15,z],{yaw:Math.PI/2,name:'Carton stencil'});}

 // ---- the storey: skirting along the office's and the hall's walls, switches by the doors, the mat at the office door
 // A run along a wall face: `axis` 'x' runs along x at z = face, 'z' along z at x = face; `into` is the room's side.
 // Its back sits 2 mm inside the wall, so no face of it is in the wall's plane.
 const SK=.07,SD=.014;
 const run=(axis,face,into,from,to)=>{const len=to-from;if(len<.05)return;const mid=(from+to)/2,c=face+into*(SD/2-.002);
  if(axis==='x')box([len,SK,SD],[mid,SK/2+.001,c],0x4a3a2c,'Skirting');else box([SD,SK,len],[c,SK/2+.001,mid],0x4a3a2c,'Skirting');};
 const e=SD+.002;// a run ends this far short of the face it meets
 // The office: its back wall (z .55), harbour wall (x 6.34), front (z 4.49) and the wall to the hall (x .80).
 for(const [a,b] of [[.8+e,2.0-.003],[4.455+.003,6.34-e]])run('x',.55,1,a,b);
 for(const [a,b] of [[.55+e,1.6-.003],[2.8+.003,3.87-.003]])run('z',6.34,-1,a,b);
 for(const [a,b] of [[1.555+.003,4.895-.003],[5.365+.003,5.8-.003]])run('x',4.49,-1,a,b);
 for(const [a,b] of [[.55+e,.65-.003],[1.55+.003,2.0-.003],[3.77+.003,4.15-.003]])run('z',.8,1,a,b);
 // The hall: the store wall (x -2.0), the office wall (x .70), its back wall either side of the fire door (z -5.44).
 for(const [a,b] of [[-3.36+.003,-1.6-.003],[-.7+.003,1.65-e]])run('z',-2.0,1,a,b);
 for(const [a,b] of [[-5.44+e,-5.29],[-5.11,-4.4-.003],[-3.5+.003,-2.3-.003],[-1.4+.003,-.95-.003],[-.05+.003,.65-.003],[1.55+.003,1.65-e]])run('z',.7,-1,a,b);
 for(const [a,b] of [[-.6+.003,-.45-.003],[.45+.003,.7-e]])run('x',-5.44,1,a,b);
 // Switch plates, each with its cable moulding to the ceiling.
 const plate=(axis,face,into,along,name)=>{const c=face+into*(.012/2-.002),y=1.2;
  const p=axis==='x'?[along,y,c]:[c,y,along],m=axis==='x'?[.075,.12,.012]:[.012,.12,.075];box(m,p,0xece6d4,name);
  const k=axis==='x'?[.02,.04,.01]:[.01,.04,.02];box(k,axis==='x'?[along,y,c+into*.01]:[c+into*.01,y,along],0xdcd4bc,'Switch rocker');
  const mould=axis==='x'?[.025,2.8-y-.07,.01]:[.01,2.8-y-.07,.025];box(mould,axis==='x'?[along,(y+.06+2.8)/2,face+into*(.01/2-.002)]:[face+into*(.01/2-.002),(y+.06+2.8)/2,along],0xe4dcc6,'Cable moulding');};
 plate('z',.8,1,.6,'Office light switch');plate('z',.7,-1,.4,'Hall light switch');plate('z',.8,1,1.78,'Rest room light switch');
 // The mat at the office door, on the hall's floor.
 {const [x,,z]=item('door-mat').at;box([.45,.008,.8],[x,.004+.001,z],0x3f6e4a,'Door mat');}
 // The typhoon poster in the hall.
 {const [x,y,z]=item('safety-poster').at;print(R.safety,[.42,.59],[x-.004,y,z],{yaw:-Math.PI/2,name:'Typhoon safety poster'});}
}
