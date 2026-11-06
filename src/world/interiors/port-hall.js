import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import * as THREE from '../../../vendor/three.module.js';
import {createVendingMachine,VENDING_MACHINE} from '../vending.js';
import {japaneseSign} from '../okinawa/signs.js';
import {buildAvatar} from '../../avatars/build.js';
import {createAvatarAnimator} from '../../avatars/animate.js';
import {recipeFor} from '../../avatars/cast.js';
import {GANAHA,ganahaAtWindow} from '../../people/ganaha.js';
import {FERRY_FARE} from '../../island/services.js';
import {FERRY_TIMETABLE} from '../ferry-timetable.js';
import {serviceTime} from '../../people/commuter-schedule.js';
import {PORT_HALL_FINISH,paintHallFloor,paintHallPlywood,finishPortHall} from './port-hall-finish.js';

/**
 * The waiting hall of the Minato Port Building (port-building.js, docs/PORT-BUILDING-PLAN.md).
 *
 * One counter sells every way off the island: the shared passenger and car ferry to
 * Kitano-jima and the evening boat to Naha. Benches face the big windows onto the pier,
 * a departures board hangs over the counter, and the stairs go up to the Harbour
 * Office. Room contract: the door is on the +z wall, you enter facing -z (yaw 0).
 */
export const PORT_HALL=Object.freeze({w:9,d:7,h:3.2});
const GOTHIC='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",system-ui,sans-serif';

function canvasTexture(w,h,draw){
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');if(ctx)draw(ctx,w,h);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

export function buildPortHall({room,reg,collider=()=>{},action,naha=()=>{},upstairs=()=>{}}){
 const group=new THREE.Group();group.name='Minato Port Terminal waiting hall';room.add(group);
 const {w,d,h}=PORT_HALL,hw=w/2,hd=d/2;
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.82}));return mats.get(c);};
 const box=(name,size,pos,c,{ry=0}={})=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),typeof c==='number'?mat(c):c);m.name=name;m.position.set(...pos);m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;group.add(m);return m;};
 const panel=(name,pw,ph,pos,ry,draw,px=512,basic=false)=>{const tex=canvasTexture(px,Math.round(px*ph/pw),draw);const m=new THREE.Mesh(new THREE.PlaneGeometry(pw,ph),basic?new THREE.MeshBasicMaterial({map:tex}):new THREE.MeshStandardMaterial({map:tex,roughness:.9}));m.name=name;m.position.set(...pos);m.rotation.y=ry;group.add(m);return m;};
 const spot=(pos,label,fn)=>{const o=new THREE.Object3D();o.name=label;o.position.set(...pos);group.add(o);reg(o,label,fn,true);return o;};

 // Shell: terrazzo floor, cream walls over a teal dado, a pale ceiling with battens.
 const floor=panel('Terrazzo floor',w,d,[0,.002,0],0,paintHallFloor,1024);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
 box('Ceiling',[w,.04,d],[0,h+.02,0],0xd8d2c4);
 const wall=PORT_HALL_FINISH.wall,dado=PORT_HALL_FINISH.dado;
 box('Hall wall',[w,h,.08],[0,h/2,-hd-.04],wall);box('Hall dado',[w,1,.02],[0,.5,-hd+.005],dado);
 box('Hall wall',[.08,h,d],[hw+.04,h/2,0],wall);box('Hall dado',[.02,1,d],[hw-.005,.5,0],dado);
 // The pier wall (-x): three big windows onto the quay and the ferry.
 box('Pier wall',[.08,.9,d],[-hw-.04,.45,0],dado);
 box('Pier wall head',[.08,.55,d],[-hw-.04,h-.27,0],wall);
 const view=panel('View of the pier',d-.4,h-1.55,[-hw-.02,.9+(h-1.45)/2,0],Math.PI/2,(x,cw,ch)=>{
  const sky=x.createLinearGradient(0,0,0,ch*.55);sky.addColorStop(0,'#7fc0e6');sky.addColorStop(1,'#d8eef3');x.fillStyle=sky;x.fillRect(0,0,cw,ch*.55);
  x.fillStyle='#e9f3f1';for(const [cx,cy,r] of [[.2,.18,.06],[.26,.16,.05],[.7,.12,.07],[.77,.14,.05]]){x.beginPath();x.arc(cx*cw,cy*ch,r*cw,0,7);x.fill();}
  x.fillStyle='#7d8fa0';x.beginPath();x.moveTo(cw*.55,ch*.55);x.quadraticCurveTo(cw*.72,ch*.38,cw*.92,ch*.55);x.fill();
  const sea=x.createLinearGradient(0,ch*.55,0,ch);sea.addColorStop(0,'#2fb5b8');sea.addColorStop(1,'#46d1c4');x.fillStyle=sea;x.fillRect(0,ch*.55,cw,ch*.45);
  x.fillStyle='#d9d4c6';x.fillRect(0,ch*.78,cw,ch*.22);x.fillStyle='#2b3436';for(let b=.08;b<1;b+=.18)x.fillRect(b*cw,ch*.74,cw*.025,ch*.06);
  x.fillStyle='#f4f1ea';x.fillRect(cw*.18,ch*.5,cw*.42,ch*.12);x.fillStyle='#2f5f6a';x.fillRect(cw*.18,ch*.6,cw*.42,ch*.04);x.fillStyle='#f4f1ea';x.fillRect(cw*.32,ch*.42,cw*.16,ch*.09);x.fillStyle='#c8392e';x.fillRect(cw*.41,ch*.36,cw*.03,ch*.07);
 },1024,true);
 view.name='View of the pier';
 for(let z=-hd+.2;z<=hd-.19;z+=(d-.4)/3)box('Window mullion',[.07,h-1.45,.07],[-hw+.02,.9+(h-1.45)/2,z],0xb8bec0);
 for(const y of [.9,h-.55])box('Window rail',[.09,.07,d-.3],[-hw+.02,y,0],0xb8bec0);
 // The door wall (+z): glass doors in the middle.
 for(const [x,len] of [[-(hw+.95)/2,hw-.95],[(hw+.95)/2,hw-.95]]){box('Door wall',[len,h,.08],[x,h/2,hd+.04],wall);box('Door wall dado',[len,1,.02],[x,.5,hd-.005],dado);}
 box('Door head',[1.9,h-2.3,.08],[0,2.3+(h-2.3)/2,hd+.04],wall);
 box('Glass doors',[1.86,2.26,.04],[0,1.13,hd+.05],new THREE.MeshStandardMaterial({color:0xa9cfd8,roughness:.12,transparent:true,opacity:.5}));
 for(const x of [-.95,0,.95])box('Door frame',[.06,2.3,.1],[x,1.15,hd+.02],0xb8bec0);
 group.add(new THREE.HemisphereLight(0xf6f2e6,0x8a8478,1.65));
 const windowLight=new THREE.DirectionalLight(0xfff4df,1.25);windowLight.name='Soft light from the pier windows';windowLight.position.set(-4,2.6,1.5);group.add(windowLight);
 const lamp=new THREE.PointLight(0xfff2dc,.35,13,2);lamp.position.set(0,h-.4,0);group.add(lamp);
 const tube=new THREE.MeshBasicMaterial({color:0xf6fbf4});
 for(const x of [-2.5,0,2.5])for(const z of [-1.6,1.6]){box('Light batten',[1.3,.05,.18],[x,h-.03,z],0xdedfd6);const t=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,1.2,6),tube);t.rotation.z=Math.PI/2;t.position.set(x,h-.07,z);group.add(t);}
 const finish=finishPortHall({group,w,d,h,box,panel});

 // The ticket counter along the back wall: three windows, one for each way off the island. The public half stands on
 // its front panel; the clerk's half, behind the glass, is open underneath for her knees (a bank counter: she sits on
 // an ordinary chair at its height, the passengers stand).
 const cz=-hd+.75;
 box('Ticket counter',[6.6,FURNITURE_HEIGHTS.serviceCounter-.05,.3],[-.4,(FURNITURE_HEIGHTS.serviceCounter-.05)/2,cz+.2],0x7a5b40);
 for(const x of [-3.68,2.88])box('Ticket counter end',[.04,FURNITURE_HEIGHTS.serviceCounter-.05,.75],[x,(FURNITURE_HEIGHTS.serviceCounter-.05)/2,cz-.02],0x7a5b40);
 panel('Ticket counter plywood',6.54,FURNITURE_HEIGHTS.serviceCounter-.15,[-.4,FURNITURE_HEIGHTS.serviceCounter/2+.035,cz+.356],0,paintHallPlywood,1024);
 box('Ticket counter top',[6.7,.05,.8],[-.4,FURNITURE_HEIGHTS.serviceCounter-.025,cz],0x6f5138);
 box('Ticket counter kick',[6.6,.12,.05],[-.4,.06,cz+.36],0x2b3436);
 for(const x of [-3.7,-1.5,.7,2.9])box('Counter screen post',[.05,1.5,.05],[x,FURNITURE_HEIGHTS.serviceCounter+.75,cz-.05],0xaab4ad);
 box('Counter screen',[6.6,1.15,.02],[-.4,FURNITURE_HEIGHTS.serviceCounter+.575,cz-.05],new THREE.MeshStandardMaterial({color:0xd5e3da,roughness:.16,transparent:true,opacity:.2}));
 box('Counter transom',[6.6,.07,.06],[-.4,2.1,cz-.05],0xaab4ad);
 box('Back office wall',[6.6,.22,.06],[-.4,2.32,cz-.05],dado);
 collider(-.4,cz,6.8,.85,FURNITURE_HEIGHTS.serviceCounter);
 const windows=[
  {x:-2.6,title:'Cargo crossing',sub:'CARS WITH DRIVERS · ISLAND ERRANDS',go:()=>action('read','Cargo crossing','The same ferry carries passengers and occasional island deliveries. Drivers reverse their cars up its lowered ramp, stay aboard for the crossing, and drive off onto the cargo court. Some sailings carry no cars.')},
  {x:-.4,title:'Airport ferry',sub:'KITANO-JIMA AIRPORT · '+(FERRY_FARE?'¥'+FERRY_FARE:'NO FARE THIS SEASON'),go:()=>action('airport-ferry')},
  {x:1.8,title:'Evening boat to Naha',sub:'17:00–21:30 · WITH THUAN',go:()=>naha()},
 ];
 for(const win of windows){
  panel('Counter window sign',1.9,.3,[win.x,2.31,cz-.01],0,(x,cw,ch)=>{x.fillStyle='#e3d9c4';x.fillRect(0,0,cw,ch);x.fillStyle='#36463d';x.textAlign='center';x.textBaseline='middle';x.font=`700 ${ch*.38}px ${GOTHIC}`;x.fillText(japaneseSign(win.title)===win.title?win.title.toUpperCase():japaneseSign(win.title),cw/2,ch*.36);x.font=`600 ${ch*.18}px system-ui`;x.fillText(win.sub,cw/2,ch*.78);},512);
  box('Ticket tray',[.5,.04,.3],[win.x,FURNITURE_HEIGHTS.serviceCounter+.02,cz+.25],0x8e979a);
  win.spot=spot([win.x,1.25,cz+.6],win.title==='Evening boat to Naha'?'Take the evening boat to Naha with Thuan':win.title==='Cargo crossing'?'Read about cargo crossings':'Buy a ticket: '+win.title,win.go);
 }
 // Ms Ganaha's place behind the middle window (people/ganaha.js): her chair, the ticket stock, the date stamp, the
 // telephone the izakaya rings, and the slip pad for the passenger count. She is there from noon to 22:15.
 const mid=windows[1].x,chairZ=cz-.48;
 box('Clerk chair seat',[.44,.06,.42],[mid,FURNITURE_HEIGHTS.seat-.03,chairZ],0x2f4f5f);
 box('Clerk chair back',[.4,.42,.05],[mid,FURNITURE_HEIGHTS.seat+.26,chairZ-.22],0x2f4f5f);
 box('Clerk chair post',[.05,FURNITURE_HEIGHTS.seat-.06,.05],[mid,(FURNITURE_HEIGHTS.seat-.06)/2,chairZ],0x8e979a);
 box('Clerk chair foot',[.5,.03,.5],[mid,.015,chairZ],0x3a3f42);
 const top=FURNITURE_HEIGHTS.serviceCounter;
 box('Ticket stock',[.22,.06,.14],[mid-.5,top+.03,cz-.2],0xe9e0c8);box('Ticket stock band',[.23,.02,.04],[mid-.5,top+.045,cz-.2],0xc8392e);
 box('Date stamp',[.06,.09,.06],[mid-.28,top+.045,cz-.24],0x2b3436);
 box('Telephone',[.2,.07,.16],[mid+.5,top+.035,cz-.22],0x3a5a48);box('Telephone receiver',[.2,.04,.05],[mid+.5,top+.09,cz-.27],0x3a5a48);
 box('Passenger slip pad',[.15,.01,.2],[mid+.22,top+.005,cz-.24],0xf6f1e2);
 // The post and parcel counter (people/ganaha.js GANAHA.post): the 〒 plate over her window, the parcel shelf behind
 // her and the scale on the counter, moved here from the old post office on Main Street (phase 3 of the consolidation).
 panel('Post counter plate',.72,.2,[mid,top+1.02,cz-.03],0,(x,cw,ch)=>{x.fillStyle='#c8102e';x.fillRect(0,0,cw,ch);x.fillStyle='#ffffff';x.textAlign='center';x.textBaseline='middle';
  x.font=`700 ${ch*.62}px ${GOTHIC}`;x.fillText('〒',cw*.12,ch*.5);x.font=`700 ${ch*.34}px system-ui`;x.fillText('POST & PARCELS',cw*.58,ch*.5);},512);
 box('Parcel shelf',[1.4,.04,.3],[mid,1.65,cz-.62],0x8a6a46);
 for(const [i,c] of [0xd8c6a4,0xc9b58f,0xe3d7bd].entries())box('Parcel',[.3,.22,.24],[mid-.45+i*.45,1.78,cz-.62],c);
 box('Brass scale',[.22,.09,.16],[mid-.75,top+.045,cz-.22],0xc9a64a);
 const post=spot([mid-.5,1.25,cz+.6],'Post and parcels',()=>action('read','Post and parcels · Port Terminal',GANAHA.post.text+(ganahaAtWindow(minutes)?'':' The window opens at noon.')));
 panel('Window closed plate',.72,.2,[mid,top+.34,cz-.03],0,(x,cw,ch)=>{x.fillStyle='#f6f1e2';x.fillRect(0,0,cw,ch);x.strokeStyle='#2b5a78';x.lineWidth=ch*.05;x.strokeRect(0,0,cw,ch);x.fillStyle='#2b3436';x.textAlign='center';x.textBaseline='middle';
  // Each line is fitted to the plate (never cut at its edges).
  const fit=(text,weight,size,y)=>{let px=size;do{x.font=`${weight} ${px}px system-ui`;}while(x.measureText(text).width>cw*.9&&--px>8);x.fillText(text,cw/2,y);};
  fit('WINDOW OPENS AT 12:00','700',ch*.34,ch*.34);fit('Morning tickets from the oiler at the gangway','600',ch*.22,ch*.72);},512);
 const closedPlate=group.getObjectByName('Window closed plate');
 const clerk=new THREE.Group();clerk.name='Ms Ganaha at the ticket window';clerk.position.set(mid,0,chairZ);clerk.rotation.y=Math.PI;group.add(clerk);   // facing the window
 // Her face is painted on a canvas, so without a page (the room tests) the chair is empty.
 const ganaha=typeof document!=='undefined'&&document.createElement?buildAvatar(recipeFor(GANAHA.name),{shadows:false,faceSize:256}):null,ganahaMotion=ganaha&&createAvatarAnimator(ganaha);
 if(ganaha)clerk.add(ganaha.root);
 const talk=spot([mid+.45,1.25,cz+.6],'Talk to Ms Ganaha',()=>action('ganaha',GANAHA.name,{buy:windows[1].go}));
 let time=0,minutes=720;
 function tick(dt=0,now=720){
  time+=dt;minutes=now;finish.tick(time);const here=ganahaAtWindow(minutes);
  clerk.visible=here;talk.visible=here;if(closedPlate)closedPlate.visible=!here;
  // Before noon her window sells nothing: the oiler sells the morning tickets at the gangway (people/ferry-crew.js).
  const hit=windows[1].spot.userData.hit;
  if(hit){hit.label=here?'Buy a ticket: Airport ferry':'Airport ferry: the window opens at 12:00';hit.fn=here?windows[1].go:()=>action('read','Airport ferry window','The window opens at noon. Until then the oiler sells tickets at the gangway on the outer pier, as each boat waits to sail.');}
  if(here)ganahaMotion?.update(dt,{speed:0,seated:true,seatHeight:FURNITURE_HEIGHTS.seat,pose:Math.floor(time/11)%4===3?'SitHold':'Sit',expression:'neutral'});
 }
 tick(0);

 // A chalk-style departures board below the ceiling: the town's actual services, never the reference's routes.
 panel('Departures board',3.6,.62,[-.4,2.8,cz+.01],0,(x,cw,ch)=>{
  x.fillStyle='#26362f';x.fillRect(0,0,cw,ch);x.strokeStyle='#c6bca7';x.lineWidth=ch*.045;x.strokeRect(0,0,cw,ch);x.fillStyle='#f0e9d8';x.textBaseline='middle';
  x.font=`700 ${ch*.15}px ${GOTHIC}`;x.textAlign='left';x.fillText(japaneseSign('Departures'),cw*.04,ch*.15);x.font=`600 ${ch*.1}px system-ui`;x.fillText('DEPARTURES',cw*.26,ch*.15);
  // The Minato Maru's sailings out of Minato (ferry-timetable.js), two to a row, then the Naha boat.
  const out=FERRY_TIMETABLE.filter(s=>s.from==='town').map(s=>serviceTime(s.departs));
  const rows=[[out.slice(0,2).join(' '),'KITANO-JIMA','Outer pier'],[out.slice(2).join(' '),'KITANO-JIMA','Cars & foot'],['17:00','NAHA (evening)','Outer pier']];
  x.font=`600 ${ch*.1}px ui-monospace,monospace`;rows.forEach(([t,dest,where],i)=>{const y=ch*(.36+i*.13);x.fillText(t,cw*.04,y);x.fillText(dest,cw*.22,y);x.fillText(where,cw*.68,y);});
 },1024,true);
 spot([-.4,1.4,cz+.9],'Read the departures board',()=>action('read','Ferry departures','The Minato Maru, the shared car and passenger ferry, crosses to Kitano-jima to her timetable and does not wait: out of Minato at 07:30, 08:45, 14:45 and 22:15, back from Kitano-jima at 08:08, 14:08, 21:38 and 22:45; her horn goes two minutes before she sails. Buy a return passenger ticket at the airport-ferry window (Ms Ganaha, noon to 22:15; in the morning from the oiler at the gangway) and board from the outer pier. The evening boat to Naha opens at 17:00. Post and parcels are handled at the same window.'));

 // Benches: two rows of moulded seats facing the pier windows.
 const seatColours=[PORT_HALL_FINISH.orange,PORT_HALL_FINISH.olive];
 for(const [row,z] of [[0,-.6],[1,1.2]])for(let i=0;i<5;i++){
  const zz=z+(i-2)*.55,x=-.6+row*1.9;
  box('Hall seat',[.46,.06,.46],[x,.44,zz],seatColours[row]);
  const back=box('Hall seat back',[.06,.42,.46],[x+.24,.68,zz],seatColours[row]);back.rotation.z=-.1;
  const seat=spot([x-.65,.9,zz],'Sit in the ferry waiting hall',()=>action('seat','Ferry waiting hall','A seat by the pier windows while you wait for the boat.'));seat.userData.seat={id:'port-hall-'+row+'-'+i,position:[x,0,zz],stand:[x-.85,0,zz],surfaceY:.47,eyeY:1.18,yaw:Math.PI/2,pitch:0,front:.23};
 }
 for(const [x,z] of [[-.6,-.6],[1.3,1.2]]){
  box('Bench rail',[.08,.07,2.72],[x,.33,z],0x77847e);
  for(const zz of [z-1,z+1])for(const xx of [x-.15,x+.15])box('Bench leg',[.035,.41,.035],[xx,.205,zz],0xaab4ad);
  collider(x+.015,z,.65,2.72,.94);
 }
 // The east wall: a map of the strait, the stairs to the Harbour Office, a vending machine.
 panel('Map of the strait',2.1,1.3,[hw-.01,1.75,-1.3],-Math.PI/2,(x,cw,ch)=>{
  x.fillStyle='#bfe0e4';x.fillRect(0,0,cw,ch);x.fillStyle='#e8dcb4';x.strokeStyle='#6b6450';x.lineWidth=3;
  x.beginPath();x.ellipse(cw*.3,ch*.55,cw*.14,ch*.2,-.3,0,7);x.fill();x.stroke();
  x.beginPath();x.ellipse(cw*.62,ch*.62,cw*.07,ch*.08,0,0,7);x.fill();x.stroke();
  x.fillRect(cw*.84,0,cw*.16,ch);x.strokeRect(cw*.84,0,cw*.16,ch);
  x.setLineDash([10,8]);x.strokeStyle='#c8392e';x.lineWidth=4;x.beginPath();x.moveTo(cw*.36,ch*.7);x.quadraticCurveTo(cw*.6,ch*.85,cw*.84,ch*.5);x.stroke();
  x.strokeStyle='#2b5a78';x.beginPath();x.moveTo(cw*.38,ch*.62);x.lineTo(cw*.56,ch*.62);x.stroke();x.setLineDash([]);
  x.fillStyle='#2b3436';x.font=`700 ${ch*.07}px system-ui`;x.textAlign='center';x.fillText('MINATO',cw*.3,ch*.56);x.fillText('KITANO-JIMA',cw*.62,ch*.78);x.fillText('MAINLAND',cw*.92,ch*.1);x.fillText('THE STRAIT',cw*.5,ch*.12);
 },768);
 spot([hw-.8,1.4,-1.3],'Read the map of the strait',()=>action('read','Map of the strait','The outer pier connects Minato with Kitano-jima on one shared passenger and car ferry. Walk aboard with a return passenger ticket; working vehicles use the lowered bow ramp with their drivers. In the evening a separate boat goes to Naha. There is no road bridge to the airport.'));
 // Stairs up the east wall to the Harbour Office door.
 for(let i=0;i<8;i++)box('Stair tread',[.95,.06,.3],[hw-.55,.18+i*.19,2.9-i*.3],0x8a6a4a);
 box('Stair string',[.06,1.6,2.5],[hw-1.05,.95,1.85],0x7a5b40);
 box('Landing',[.95,.1,1],[hw-.55,1.66,.45],0x8a6a4a);
 box('Office door',[.05,2,.95],[hw-.02,2.66,.45],0x74563b);
 panel('Harbour Office sign',.9,.24,[hw-.04,3.0-.05,.45],-Math.PI/2,(x,cw,ch)=>{x.fillStyle='#3e463f';x.fillRect(0,0,cw,ch);x.fillStyle='#f3ecd8';x.font=`700 ${ch*.5}px system-ui`;x.textAlign='center';x.textBaseline='middle';x.fillText('HARBOUR OFFICE ↑',cw/2,ch/2);},384);
 collider(hw-.55,1.75,1,2.6,1.7);
 spot([hw-1.3,1.2,2.4],'Go up to the Harbour Office',upstairs);
 // indoors on the hall's floor, so no concrete pad; its collider is its own footprint (it faces -x: its depth along x)
 const vending=createVendingMachine({pad:false});vending.position.set(hw-.55,0,-2.9);vending.rotation.y=-Math.PI/2;group.add(vending);collider(hw-.55,-2.9,VENDING_MACHINE.size.depth+.04,VENDING_MACHINE.size.width+.04,1.9);
 spot([hw-1.2,1.1,-2.9],'Buy a drink from the vending machine',()=>action('vending'));
 // Sakura's ferry punch cards, on an honour shelf by the door: Thuan restocks it.
 box('Punch card shelf',[.6,.9,.3],[-hw+.5,.45,hd-.4],0x8a6a4a);
 panel('Punch card notice',.55,.4,[-hw+.5,1.15,hd-.56],0,(x,cw,ch)=>{x.fillStyle='#f6e7c4';x.fillRect(0,0,cw,ch);x.fillStyle='#c8392e';x.fillRect(0,0,cw,ch*.28);x.fillStyle='#fff';x.font=`700 ${ch*.18}px system-ui`;x.textAlign='center';x.fillText('SAKURA',cw/2,ch*.18);x.fillStyle='#2b2b2b';x.font=`600 ${ch*.12}px system-ui`;x.fillText('FERRY PUNCH CARDS',cw/2,ch*.48);x.fillText('sold at Sakura',cw/2,ch*.68);x.fillText('honour box',cw/2,ch*.86);},256);
 spot([-hw+.9,1,hd-.7],'Look at the punch card shelf',()=>action('read','Ferry punch cards','Ferry punch cards are sold at Sakura. Thuan keeps this shelf stocked with leaflets; the cards themselves are sold at Sakura, over the counter.'));
 // A wall clock over the doors.
 panel('Wall clock',.5,.5,[0,2.85,hd-.01],Math.PI,(x,cw,ch)=>{x.fillStyle='#f6f1e2';x.beginPath();x.arc(cw/2,ch/2,cw*.46,0,7);x.fill();x.strokeStyle='#2b3436';x.lineWidth=cw*.05;x.stroke();for(let i=0;i<12;i++){const a=i/12*Math.PI*2;x.fillStyle='#2b3436';x.fillRect(cw/2+Math.sin(a)*cw*.36-2,ch/2-Math.cos(a)*ch*.36-2,4,4);}x.lineWidth=cw*.035;x.beginPath();x.moveTo(cw/2,ch/2);x.lineTo(cw*.62,ch*.3);x.moveTo(cw/2,ch/2);x.lineTo(cw*.32,ch*.44);x.stroke();},256);

 return {bounds:{minX:-hw+.2,maxX:hw-.2,minZ:-hd+.2,maxZ:hd-.2},spawn:[0,0,hd-.7],exit:[0,1.1,hd-.04],yaw:0,portHall:true,tick,clerk};
}

