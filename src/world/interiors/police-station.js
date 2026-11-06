import * as THREE from '../../../vendor/three.module.js';
import {benchSeat} from '../seat-slots.js';
import {createKit,paint} from '../okinawa/kit.js';
import {japaneseSign} from '../okinawa/signs.js';
import {createHouseWalk} from '../house-walk.js';
import {sleepHours} from '../../people/home-life.js';
import {POLICE_STATION as S} from '../police-station-layout.js';

/**
 * Inside Minato Police Station (police-station-layout.js, police-station.js).
 *
 * The room's frame, as every room in the town has it: the street door's wall at +z, so you walk in facing -z. Its +x is
 * the plaza side (south in the world), its -x the side towards Higa Liquor (north), -z the back. One room unit is one
 * metre; world x = 9.15 - room z, world z = 18 + room x, and the windows inside sit where the windows outside are.
 *
 * Ground floor, public at the front and the station's working rooms behind the counter:
 *   the lobby: the counter with its bell, the waiting bench under the town map by the door, the notice board, and the
 *     foot of the stairs, which rise along the plaza wall to the private floor;
 *   behind the counter: the duty desk with the radio; the counter-window bay, where the old police box's window is now,
 *     with the window desk and the lost-property shelf; the holding room with its barred door; the tea corner and the
 *     filing cabinet with the duty roster on the back wall; the typhoon cupboard under the stairs; the WC; and the
 *     back door, under the head of the stairs, out to the patrol car.
 * First floor, up the stairs, private: Officer Mori's quarters, the station's accommodation he has lived in since the
 *   police box came down: an eight-mat room with his futon, his desk at the window over the plaza, the clothes rail,
 *   the extension telephone, and a kitchenette in the back room. He bathes at Umi-no-yu after the night patrol.
 *
 * The floors are walked with house-walk.js (the stair is a sloped floor); walls, furniture and the stair guards are the
 * room's colliders at their own storey's height. Every object below says who it is for and why it is there.
 */
export const STATION_STOREY=S.storey;
const H=S.storey,FLOOR2=H,CEIL1=H-.15,CEIL2=H+2.6;
export const STATION_ROOM=Object.freeze({
 bounds:Object.freeze({minX:-3.8,maxX:3.8,minZ:-3.25,maxZ:3.25}),
 spawn:Object.freeze([2.3,0,2.65]),exit:Object.freeze([2.3,1.1,3.2]),yaw:0,
 /** Where Officer Mori stands on the desk shift (people/workplace-residents.js): behind the counter, facing the lobby. */
 staff:Object.freeze({'Officer Mori':Object.freeze([1.1,0,.15])}),
});
/**
 * The flight, 0.8 m wide against the plaza wall: its foot in the lobby by the door (z 1.6), rising towards the back to
 * the landing over the back door (z -2.2). One straight run, so Officer Mori is up it in a few seconds.
 */
export const STATION_STAIR=Object.freeze({x0:3,x1:3.8,z0:-2.2,z1:1.6,rise:H});
const stairY=z=>Math.max(0,Math.min(H,(STATION_STAIR.z1-z)/(STATION_STAIR.z1-STATION_STAIR.z0)*H));
/**
 * Officer Mori's way from the street door to his quarters (people/home-residents.js walks it, and back again when he
 * goes out): three steps across the lobby to the foot of the stairs, up the flight, and onto the landing.
 */
const ENTRANCE_ROUTE=Object.freeze([[2.3,0,2.65],[2.75,0,2.35],[3.4,0,2.15],[3.4,0,1.65],
 ...Array.from({length:24},(_,i)=>{const z=1.6-(i+1)*3.8/24;return [3.4,stairY(z),z];}),[3.4,H,-2.5],[3.4,H,-2.9]]);
/**
 * Where Officer Mori sleeps, sits and hangs his cap at home (people/home-residents.js): all upstairs.
 * His futon lies along the street wall under its window, head to the north; his desk is at the plaza window.
 */
export const STATION_HOME_LAYOUT=Object.freeze({...STATION_ROOM,
 door:[3.4,H,-2.9],entranceRoute:ENTRANCE_ROUTE,
 hatHook:{position:[1.0,H+1.6,.66],yaw:0},
 table:[2.85,H,2.4],tableStand:[2.4,H,2.1],tableSeatHeight:.44,tableSeatFront:.22,tableSeatYaw:-Math.PI/2,
 bedAxis:'x',bedside:[.87,H,1.57],bed:[1.8,H+.31,2.72],
 cover:{position:[1.3,H+.37,2.72],width:1.1,length:1.3,axis:'x'}});

const SANS='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';
const C=Object.freeze({wall:0xf1ede2,wainscot:0x9fb3c4,ceiling:0xf6f4ee,vinyl:0xb7b9ad,terrazzo:0xcfcabb,tatami:0xcbc38c,tatamiEdge:0x3f4a3a,
 counter:0x8a6a4a,counterTop:0xb59572,steel:0x7d8a86,grey:0x5e6466,navy:0x27304d,timber:0x9a7650,timberDark:0x6d5238,
 white:0xf4f3ee,black:0x1d1f24,glass:0xcfe6f2,red:0xc8302a,green:0x3f7a55,blue:0x2a6fb0,tile:0xd8e4e6,lamp:0xf4f8ff,
 futon:0xe9dfc8,quilt:0x7f9fc4,khaki:0x9dbfe0});

const time=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
/** A little enamel plate: the Japanese word for the door it hangs over (the sign map), navy on white. */
const plate=(key,{w=256,h=72,bg='#f4f2ea',ink='#27304d'}={})=>paint(w,h,(ctx,W,Hh)=>{ctx.fillStyle=bg;ctx.fillRect(0,0,W,Hh);ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';
 let size=Math.floor(Hh*.62);const text=japaneseSign(key);ctx.font=`bold ${size}px ${SANS}`;while(size>12&&ctx.measureText(text).width>W-16){size--;ctx.font=`bold ${size}px ${SANS}`;}ctx.fillText(text,W/2,Hh/2+2);});

/** The lobby's notice board: the same four notices as outside, and the station's own reminder about bicycle locks. */
const lobbyNotices=()=>paint(768,512,(ctx,w,h)=>{
 ctx.fillStyle='#b98a55';ctx.fillRect(0,0,w,h);ctx.textAlign='center';ctx.textBaseline='middle';
 const sheet=(x,y,bg)=>{ctx.fillStyle=bg;ctx.fillRect(x,y,220,210);};
 sheet(24,24,'#fff4dc');ctx.fillStyle='#c8302a';ctx.font=`bold 34px ${SANS}`;ctx.fillText('指名手配',134,62);ctx.fillStyle='#2b2b2b';ctx.font=`bold 28px ${SANS}`;ctx.fillText('タマ（猫）',134,130);ctx.font=`18px ${SANS}`;ctx.fillText('サバ一匹で出頭',134,186);
 sheet(274,24,'#eef4f6');ctx.fillStyle='#27304d';ctx.font=`bold 34px ${SANS}`;ctx.fillText('落とし物',384,62);ctx.font=`22px ${SANS}`;ctx.fillText('傘・手袋・帽子',384,130);ctx.fillText('受付でどうぞ',384,180);
 sheet(524,24,'#fff1c1');ctx.fillStyle='#1f6b3a';ctx.font=`bold 28px ${SANS}`;ctx.fillText('秋の交通安全',634,62);ctx.font=`22px ${SANS}`;ctx.fillText('9月21日〜30日',634,130);ctx.fillText('夜はライトを',634,180);
 sheet(24,262,'#e6eef8');ctx.fillStyle='#1f4e6b';ctx.font=`bold 30px ${SANS}`;ctx.fillText('台風に備えて',134,300);ctx.font=`20px ${SANS}`;ctx.fillText('窓にテープ',134,360);ctx.fillText('お風呂に水',134,400);ctx.fillText('ご近所に声かけ',134,440);
 sheet(274,262,'#f6e6e6');ctx.fillStyle='#8a2b2b';ctx.font=`bold 30px ${SANS}`;ctx.fillText('自転車に鍵を',384,300);ctx.font=`20px ${SANS}`;ctx.fillText('二重ロックで',384,370);ctx.fillText('盗難防止',384,410);
 ctx.fillStyle='#c8302a';ctx.fillRect(524,262,220,210);ctx.fillStyle='#fff';ctx.font=`bold 84px ${SANS}`;ctx.fillText('110',634,350);ctx.font=`bold 22px ${SANS}`;ctx.fillText('事件・事故',634,430);
});
/** The town map by the door, for the people who come in to ask the way, with 現在地 (you are here) on the station. */
const townMap=()=>paint(768,512,(ctx,w,h)=>{
 ctx.fillStyle='#ece5cc';ctx.fillRect(0,0,w,h);ctx.fillStyle='#8cc6e0';ctx.fillRect(0,0,w,90);ctx.fillRect(w-70,0,70,h);
 ctx.fillStyle='#bfb69a';ctx.fillRect(250,90,56,h-90);ctx.fillRect(0,300,w-70,26);
 ctx.fillStyle='#9fcf7c';ctx.fillRect(420,110,200,140);ctx.fillStyle='#d6c7a8';ctx.fillRect(330,350,330,120);ctx.fillStyle='#c9b48a';ctx.fillRect(40,120,170,150);
 ctx.fillStyle='#3b3f55';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold 30px ${SANS}`;
 ctx.fillText('港',150,45);ctx.fillText('さくら商店',125,195);ctx.fillText('港公園',520,180);ctx.fillText('町役場',495,410);ctx.fillText('北浜',140,420);
 ctx.fillStyle='#d7263d';ctx.beginPath();ctx.arc(330,268,13,0,Math.PI*2);ctx.fill();ctx.font=`bold 26px ${SANS}`;ctx.fillText('現在地',395,262);
 ctx.strokeStyle='#6b4a1c';ctx.lineWidth=10;ctx.strokeRect(5,5,w-10,h-10);
});
/** The calendar over the window desk: September 1997, the month of the autumn traffic-safety week. */
const calendar=()=>paint(256,352,(ctx,w,h)=>{
 ctx.fillStyle='#fffaf0';ctx.fillRect(0,0,w,h);ctx.fillStyle='#2a8fcc';ctx.fillRect(0,0,w,110);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.font=`bold 38px ${SANS}`;ctx.fillText('1997年 9月',w/2,56);ctx.font=`20px ${SANS}`;
 for(let d=1;d<=30;d++){const col=d%7,row=Math.floor(d/7);ctx.fillStyle=col===0?'#d7263d':'#3b3f55';ctx.fillText(String(d),20+col*36,140+row*40);}
});
/** The wall clock (a plain station clock, its hands at ten past ten as clocks are shown). */
const clockFace=()=>paint(128,128,(ctx,w,h)=>{ctx.fillStyle='#27304d';ctx.beginPath();ctx.arc(w/2,h/2,w/2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f4f1ea';ctx.beginPath();ctx.arc(w/2,h/2,w*.44,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#27304d';for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.fillRect(w/2+Math.sin(a)*w*.38-3,h/2-Math.cos(a)*h*.38-3,6,6);}
 ctx.strokeStyle='#27304d';ctx.lineCap='round';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(w/2,h/2);ctx.lineTo(w/2-w*.2,h/2-h*.08);ctx.stroke();ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(w/2,h/2);ctx.lineTo(w/2+w*.3,h/2-h*.12);ctx.stroke();});

export function buildPoliceStationInterior({site,room,reg,collider=()=>{},action,exit}){
 const group=new THREE.Group();group.name='Minato Police Station interior';room.add(group);
 const ground=new THREE.Group();ground.name='Police station ground floor';group.add(ground);
 const upper=new THREE.Group();upper.name='Police station first floor';group.add(upper);
 const G=createKit(),U=createKit();
 const B=STATION_ROOM.bounds,st=STATION_STAIR,colliders=[];
 /** A solid at one storey's height: [x0,x1]×[z0,z1] from y0 to y1 (the game's room colliders, game.js roomCollider). */
 const solid=(x0,x1,z0,z1,y0,y1)=>{const c={x:(x0+x1)/2,z:(z0+z1)/2,w:x1-x0,d:z1-z0,height:y1-y0,minY:y0};colliders.push(c);collider(c.x,c.z,c.w,c.d,c.height,c.minY);return c;};
 /** A named mesh of its own: the floors (the building survey reads them by name) and the few things a test looks for. */
 const named=(parent,name,size,pos,color)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,roughness:.85}));m.name=name;m.position.set(...pos);m.receiveShadow=true;parent.add(m);return m;};
 const spot=(parent,pos,label,kind,title,text)=>{const o=new THREE.Object3D();o.name=label;o.position.set(...pos);parent.add(o);reg(o,label,()=>action(kind,title,text),true);return o;};
 // (`front`: how far ahead of the mark the seat's front edge is; `bench`: a bench's length, for a place per sitter: seat-slots.js)
 const seat=(o,{position,stand,surfaceY,yaw,front,id,bench})=>{o.userData.npcInteraction=false;const s={id,position,stand,surfaceY,eyeY:surfaceY+.76,yaw,pitch:0,front};o.userData.seat=bench?benchSeat(s,{length:bench,front}):s;return o;};

 // ── The shell ──
 // Terrazzo in the lobby, office vinyl behind the counter (you can see where the public side ends), walls with a
 // pale-blue wainscot, as government offices painted them.
 named(ground,'Police station lobby floor',[3.98,.1,2.45],[1.89,-.05,2.025],C.terrazzo);
 named(ground,'Police station office floor',[7.6,.1,4.05],[0,-.05,-1.225],C.vinyl);
 named(ground,'Police station window bay floor',[3.6,.1,2.45],[-2.0,-.05,2.025],C.vinyl);
 const shell=(kit,y0,y1)=>{
  kit.block(B.minX-.1,B.minX,y0,y1,B.minZ-.1,B.maxZ+.1,C.wall);kit.block(B.maxX,B.maxX+.1,y0,y1,B.minZ-.1,B.maxZ+.1,C.wall);
  kit.block(B.minX,B.maxX,y0,y1,B.minZ-.1,B.minZ,C.wall);kit.block(B.minX,B.maxX,y0,y1,B.maxZ,B.maxZ+.1,C.wall);
 };
 // The ground floor's outer walls run up to the first floor's top, past the slab's edge, so there is no slit at the floor line.
 shell(G,0,FLOOR2);shell(U,FLOOR2,CEIL2);
 for(const [x0,x1,z0,z1] of [[B.minX,B.minX+.02,B.minZ,B.maxZ],[B.minX,1.7,B.maxZ-.02,B.maxZ],[2.9,B.maxX,B.maxZ-.02,B.maxZ],[B.minX,B.maxX,B.minZ,B.minZ+.02]])G.block(x0,x1,0,.9,z0,z1,C.wainscot);
 // The first-floor slab, open over the stair; and the upstairs ceiling.
 for(const [x0,x1,z0,z1] of [[B.minX,st.x0,B.minZ,B.maxZ],[st.x0,B.maxX,B.minZ,st.z0],[st.x0,B.maxX,st.z1,B.maxZ]])G.block(x0,x1,CEIL1,FLOOR2-.012,z0,z1,C.ceiling);
 U.block(B.minX,B.maxX,CEIL2,CEIL2+.1,B.minZ,B.maxZ,C.ceiling);
 // Fluorescent fittings: the lobby, the office, the window bay, the back; upstairs, his room's and the kitchenette's.
 for(const [x,z] of [[1.4,2.0],[1.2,-1.0],[-1.2,-1.0],[-2.0,2.0],[1.0,-2.4]])G.box(1.25,.06,.2,x,CEIL1-.04,z,C.lamp,{finish:'lamp'});
 for(const [x,z] of [[.4,1.9],[-1.6,-.8]])U.box(.5,.06,.5,x,CEIL2-.04,z,C.lamp,{finish:'lamp'});

 // ── Windows (glass in the walls where the outside has its windows) ──
 // Each pane in an aluminium frame with a middle mullion, as the sliding sashes of the time were.
 const pane=(kit,face,a0,a1,y0,y1)=>{
  const at=(u0,u1,v0,v1,d0,d1,c,f)=>face==='+z'?kit.block(u0,u1,v0,v1,B.maxZ-d1,B.maxZ-d0,c,f):face==='-z'?kit.block(u0,u1,v0,v1,B.minZ+d0,B.minZ+d1,c,f)
   :face==='+x'?kit.block(B.maxX-d1,B.maxX-d0,v0,v1,u0,u1,c,f):kit.block(B.minX+d0,B.minX+d1,v0,v1,u0,u1,c,f);
  at(a0,a1,y0,y1,.01,.03,C.glass,'glow');
  for(const u of [a0,(a0+a1)/2,a1])at(u-.025,u+.025,y0-.03,y1+.03,.005,.05,0xb9bfbf,'metal');
  for(const v of [y0,y1])at(a0-.025,a1+.025,v-.03,v+.03,.005,.05,0xb9bfbf,'metal');
 };
 // Ground: the glass doors, the counter window, the lobby's side window over the stair foot, the stair's window, the
 // holding room's high window (barred outside), the WC's.
 pane(G,'+z',1.7,2.9,0,2.1);for(const x of [1.7,2.3,2.9])G.block(x-.03,x+.03,0,2.16,B.maxZ-.05,B.maxZ,0xb9bfbf);
 pane(G,'+z',-2.6,-1.0,.95,2.05);pane(G,'+x',1.0,2.6,1.0,2.0);pane(G,'+x',-1.1,-.4,1.25,1.95);pane(G,'-x',-1.1,-.5,1.9,2.3);pane(G,'-z',-3.25,-2.75,1.6,1.9);
 // Upstairs: his two windows over Main Street, the plaza window by the desk, the back room's and the north ones.
 pane(U,'+z',-2.4,-.6,FLOOR2+.88,FLOOR2+2.08);pane(U,'+z',.8,2.6,FLOOR2+.88,FLOOR2+2.08);pane(U,'+x',.8,2.4,FLOOR2+.88,FLOOR2+2.08);
 pane(U,'+x',-1.6,-.4,FLOOR2+.88,FLOOR2+2.08);pane(U,'-x',1.2,2.6,FLOOR2+.88,FLOOR2+1.88);pane(U,'-x',-1.0,-.2,FLOOR2+.88,FLOOR2+1.88);
 // Curtains in his room, drawn back: he draws them at seven in the morning to sleep.
 for(const x of [-2.6,-.4,.6,2.8])U.box(.3,1.3,.04,x,FLOOR2+1.5,B.maxZ-.09,0xe2d6b8);

 // ── The lobby ──
 // The counter: public on the lobby side, the duty side behind it. Its end is open, between the counter and the
 // stair, for the officer to come round to the visitor.
 G.block(-.2,1.8,0,1.0,.55,1.05,C.counter);G.block(-.25,1.85,1.0,1.05,.5,1.1,C.counterTop);solid(-.2,1.8,.55,1.05,0,1.05);
 G.box(.1,.06,.1,1.3,1.08,.95,0xc9b26a,{finish:'metal'});G.cyl(.05,.06,.05,1.3,1.12,.95,0xd9c27a,{segments:12,finish:'metal'});
 G.sign(plate('Reception'),.5,.16,.5,1.15,1.02,{name:'Reception plate',depth:.02});
 spot(ground,[1.3,1.15,1.15],'Ring the counter bell','read','The counter bell','Ding.\n\nFrom four in the afternoon until ten Officer Mori is at the desk, and he looks up from the incident log: “Lost something, or found something?”\nIn the morning he is asleep upstairs after the night patrol. The card under the bell says: Please ring once and wait. In an emergency, dial 110 from any telephone.');
 // The partition between the lobby and the counter-window bay, with the notice board and the clock on the lobby side.
 G.block(-.25,-.15,0,CEIL1,1.05,B.maxZ,C.wall);G.block(-.15,-.13,0,.9,1.05,B.maxZ,C.wainscot);solid(-.27,-.13,1.05,B.maxZ,0,CEIL1);
 G.sign(lobbyNotices(),1.5,1.0,-.12,1.7,2.2,{ry:Math.PI/2,name:'Lobby notice board',edge:C.timber,depth:.03});
 spot(ground,[.35,1.6,2.2],'Read the lobby notice board','read','Notices','WANTED: Tama, a ginger cat, for sleeping in the fish crates. Will surrender for one mackerel.\nLOST PROPERTY: umbrellas, gloves, hats. Ask at the counter.\nAutumn Traffic Safety Week, 21 to 30 September: lamps on after dark.\nTyphoon season: tape the windows, fill the bath, look in on your neighbours.\nLock your bicycle, twice.\n110: incidents and accidents.');
 const clock=new THREE.Mesh(new THREE.CircleGeometry(.2,24),new THREE.MeshStandardMaterial({map:clockFace(),roughness:.8}));clock.position.set(-.12,2.45,1.3);clock.rotation.y=Math.PI/2;clock.name='Wall clock';ground.add(clock);
 // The waiting bench along the street wall beside the doors, under the town map: for whoever is waiting to be seen,
 // or waiting to be collected.
 G.block(0,1.5,.4,.46,2.82,3.24,C.timber);for(const x of [.1,1.4])G.block(x-.05,x+.05,0,.4,2.86,3.2,C.steel);solid(0,1.5,2.8,3.25,0,.46);
 seat(spot(ground,[.75,.8,2.55],'Sit on the waiting bench','seat','Waiting bench','A long wooden bench by the door. Children waiting to be collected kick their heels against it; the varnish is worn where they do.'),{id:'police-waiting-bench',position:[.75,0,3.0],stand:[.75,0,2.35],surfaceY:.46,yaw:0,front:.18,bench:1.5});
 G.sign(townMap(),1.4,.94,.75,1.6,B.maxZ-.03,{ry:Math.PI,name:'Town map',edge:C.timberDark,depth:.02});
 spot(ground,[.75,1.5,2.4],'Read the town map','read','Town map','Minato on one sheet, for the visitors who come in to ask the way: the harbour and the ferry at the top, Sakura across Main Street, Harbour Park and Umi-no-yu to the east, the town hall behind the station, and Kitahama’s lanes to the south. The red dot by Main Street says You Are Here.');

 // ── The counter-window bay (where the police box's window is now) ──
 // The window desk: the incident log, the telephone, a desk lamp. Whoever is on duty sits here when the window is open.
 G.block(-2.75,-.85,.71,.75,2.75,3.25,C.counter);for(const x of [-2.7,-.9])G.block(x-.04,x+.04,0,.71,2.78,3.22,C.steel);solid(-2.75,-.85,2.75,3.25,0,.75);
 G.box(.32,.03,.24,-1.7,.77,3.0,0xe8e1c7);G.box(.22,.1,.2,-2.4,.8,3.0,C.black);G.box(.24,.05,.07,-2.4,.87,3.0,C.black);
 G.rod([-1.0,.75,3.12],[-1.0,1.05,3.12],.015,C.green);G.box(.2,.1,.14,-1.0,1.1,3.05,C.green);
 G.box(.44,.05,.42,-1.8,.45,2.35,C.navy);G.cyl(.03,.03,.42,-1.8,.22,2.35,C.grey,{segments:6});G.box(.42,.42,.05,-1.8,.7,2.15,C.navy);
 G.sign(calendar(),.36,.5,-1.75,2.35,B.maxZ-.03,{ry:Math.PI,name:'Calendar',depth:.01});
 spot(ground,[-1.7,.95,2.75],'Read the incident log','read','Minato Police Station · incident log','13 Sep, 22:00. Night patrol: Main Street, the quay, the pier, back. Nothing to report.\n14 Sep, 01:15. A cat in a fish crate at the quay. The cat declined to give a statement.\n14 Sep, 03:30. The lamp outside Sakura flickering again; noted for the electrician.\n14 Sep, 16:20. A visitor from Naha asked the way to Umi-no-yu. Walked him to the corner.\n14 Sep, 17:15. Flag down.\n\n— Mori');
 spot(ground,[-2.4,.95,2.75],'Inspect the window telephone','inspect','The station telephone','A black desk telephone with the harbour office, the clinic, the ferry office and the town hall taped to its base. After ten at night it rings upstairs as well, and on the patrol radio.');
 // The lost-property shelf against the north wall. Every item is tagged with where and when it was found.
 // An open shelf (back, two sides, four boards), so what is on it shows, each thing with its white paper tag.
 G.block(-3.8,-3.77,0,1.8,1.05,2.85,C.timberDark);for(const z of [1.05,2.82])G.block(-3.8,-3.38,0,1.8,z,z+.03,C.timberDark);
 for(const y of [.06,.47,.97,1.47])G.block(-3.77,-3.38,y,y+.03,1.08,2.82,C.timber);solid(-3.8,-3.36,1.05,2.85,0,1.8);
 G.sign(plate('Lost property'),.6,.17,-3.35,1.95,1.95,{ry:Math.PI/2,name:'Lost property plate',depth:.02});
 G.box(.05,.05,.95,-3.58,.525,1.75,0x2a8fcc);G.box(.04,.12,.04,-3.58,.56,1.25,0x2a8fcc);
 G.box(.14,.09,.22,-3.55,1.045,1.3,C.red);G.box(.12,.03,.18,-3.55,1.015,2.1,0x6b4a2a);
 G.cyl(.17,.17,.05,-3.56,1.525,1.5,0xe9d49a,{segments:14});G.box(.08,.1,.2,-3.55,1.55,2.35,C.red);G.box(.12,.04,.16,-3.55,.52,2.5,0xe8cf85);
 for(const [y,z] of [[.6,1.42],[1.12,1.3],[1.04,2.1],[1.57,1.5],[1.62,2.35],[.56,2.5]])G.box(.01,.06,.04,-3.47,y,z+.12,0xfafaf2);
 spot(ground,[-2.95,1.2,1.95],'Look through the lost property','inspect','Lost property','Each thing has a tag in Officer Mori’s careful handwriting, with where and when it was found:\nA blue umbrella, left on the ferry, 28 August.\nOne child’s red shoe, size 15, on the beach steps, 3 September. The other one has not been handed in.\nA brown wallet with ¥3,200, a ferry ticket stub and a photograph of a fishing boat, outside Sato Ramen, 12 September. Its owner has been telephoned; he is at sea until Friday.\nA straw sun hat, Harbour Park, 7 September.\nA small red toy boat with HANA painted on the hull, the end of the pier.\nOne glove, left hand.');

 // ── Behind the counter: the duty desk and its radio ──
 G.block(.4,1.8,.72,.76,-1.0,-.3,C.counter);G.block(.42,.85,0,.72,-.98,-.32,C.steel);G.block(1.4,1.78,0,.72,-.98,-.32,C.steel);solid(.4,1.8,-1.0,-.3,0,.76);
 // The base radio to prefectural headquarters in Naha, through the mast on the roof, with its desk microphone.
 G.box(.46,.18,.3,1.35,.85,-.75,0x3b3f45);G.box(.4,.1,.01,1.35,.86,-.595,0x21302c);G.cyl(.012,.02,.2,1.0,.86,-.6,C.black,{segments:6});G.box(.08,.05,.08,1.0,.97,-.6,C.black);
 G.box(.3,.03,.22,.7,.77,-.62,0xe8e1c7);
 G.box(.44,.05,.42,1.1,.45,-1.35,C.navy);G.cyl(.03,.03,.42,1.1,.22,-1.35,C.grey,{segments:6});G.box(.42,.45,.05,1.1,.72,-1.55,C.navy);
 spot(ground,[1.35,1.0,-.35],'Inspect the desk radio','inspect','The desk radio','The base set to prefectural headquarters in Naha, through the mast on the roof. Officer Mori checks in at ten at night, when the patrol starts, and at six in the morning, when it ends: “Minato. All quiet.” Nobody in Naha can remember him saying anything else.');
 // On the back wall: the filing cabinet with the duty roster pinned to it, and the tea corner, a thermos and cups for
 // visitors who come in upset (and for the night shift).
 G.block(-1.6,-1.0,0,1.32,-3.25,-2.7,C.steel);for(const y of [.35,.75,1.15])G.block(-1.52,-1.08,y-.01,y+.01,-2.72,-2.7,C.grey);solid(-1.62,-.98,-3.25,-2.68,0,1.32);
 G.box(.22,.3,.01,-1.3,1.05,-2.695,0xfff8e6);
 spot(ground,[-1.3,1.2,-2.25],'Read the duty roster','read','Duty roster, September 1997','Desk: 16:00 to 22:00. Night patrol: 22:00 to 06:00. Officer Mori.\nFlag up 08:30, down 17:15.\nRadio check-in with Naha at 22:00 and 06:00.\nPatrol car: Sunday mornings, wash.\nWhen the desk is closed, ring the bell or dial 110.');
 G.block(-.8,.6,0,.85,-3.25,-2.8,C.timber);G.block(-.82,.62,.85,.89,-3.25,-2.78,C.counterTop);solid(-.82,.62,-3.25,-2.78,0,.89);
 G.cyl(.07,.07,.3,-.5,1.04,-3.0,C.red,{segments:12});G.box(.1,.12,.1,-.25,.95,-3.05,C.green);for(const x of [0,.15,.3])G.cyl(.035,.03,.07,x,.925,-2.95,C.white,{segments:10});
 spot(ground,[-.1,1.0,-2.4],'Inspect the tea things','inspect','Tea for visitors','A thermos of cold barley tea, a tin of green tea and four cups. The note on the tin says: For anybody who comes in upset. Also for me at four in the morning.');

 // ── The holding room: for anyone who needs looking after until morning ──
 // Its back wall shares the WC's; its front is bars, and the barred door stands open because nobody is in it.
 G.block(-3.8,-2.0,0,CEIL1,-1.7,-1.6,C.wall);solid(-3.8,-2.0,-1.72,-1.58,0,CEIL1);
 G.block(-3.8,-2.0,0,CEIL1,.55,.65,C.wall);solid(-3.8,-2.0,.53,.67,0,CEIL1);
 for(const [z0,z1] of [[-1.6,-1.1],[-.3,.55]]){for(let z=z0+.06;z<z1;z+=.12)G.rod([-2.0,0,z],[-2.0,2.3,z],.014,C.grey);G.block(-2.04,-1.96,2.3,2.38,z0,z1,C.grey);G.block(-2.04,-1.96,0,.06,z0,z1,C.grey);solid(-2.06,-1.94,z0,z1,0,CEIL1);}
 G.block(-2.04,-1.96,2.3,CEIL1,-1.1,-.3,C.wall);
 // The door, swung open into the room on its hinges at the post by the bay: bars in a frame.
 for(let x=-2.06;x>-2.8;x-=.12)G.rod([x,.06,-.3],[x,2.2,-.3],.014,C.grey);for(const y of [.06,1.1,2.2])G.block(-2.82,-2.0,y-.03,y+.03,-.33,-.27,C.grey);solid(-2.84,-2.0,-.36,-.24,0,2.25);
 G.sign(plate('Holding room'),.5,.15,-1.94,2.55,-.7,{ry:Math.PI/2,name:'Holding room plate',depth:.02});
 // Inside: a low wooden platform bed with a blanket folded square and a pillow, under the high window.
 G.block(-3.8,-3.1,0,.4,-1.5,.45,C.timber);solid(-3.8,-3.1,-1.5,.45,0,.4);
 G.box(.55,.12,.45,-3.45,.46,-.95,0x8f6f5a);G.box(.45,.1,.3,-3.45,.45,.15,C.white);
 spot(ground,[-2.3,1.2,-.7],'Look into the holding room','inspect','The holding room','A wooden bench-bed, a blanket folded square, a pillow and a high barred window. It is for anyone who needs looking after until morning: a child waiting for a parent, a visitor who missed the last ferry. It is empty, and the door stands open.\n\nThe last guest in the book was Tama the cat, kept overnight for her own good and released at breakfast with a sardine.');

 // ── The WC, in the back corner, its door off the back of the office ──
 G.block(-2.65,-2.55,0,CEIL1,-3.25,-2.35,C.wall);G.block(-2.65,-2.55,2.05,CEIL1,-2.35,-1.75,C.wall);solid(-2.67,-2.53,-3.25,-2.35,0,CEIL1);
 G.block(-3.8,-2.6,.008,.016,-3.25,-1.7,C.tile);
 named(ground,'Toilet',[.4,.4,.55],[-3.55,.2,-2.95],0xf4f6f6);named(ground,'Toilet cistern',[.42,.5,.16],[-3.55,.65,-3.15],0xeef2f2);solid(-3.8,-3.3,-3.25,-2.65,0,.6);
 G.box(.36,.1,.3,-2.95,.82,-3.08,C.white);solid(-3.15,-2.75,-3.25,-2.9,0,.9);
 G.sign(plate('Toilet'),.4,.13,-2.52,2.15,-2.05,{ry:Math.PI/2,name:'Toilet plate',depth:.02});

 // ── The stairs: concrete, against the plaza wall, from the lobby up to the landing over the back door ──
 // Closed underneath at the low end (that part is solid), open at the high end, where the back door is under it.
 const run=(st.z1-st.z0)/16,openUnder=-1.0;
 for(let i=0;i<16;i++){const zb=st.z1-i*run,za=zb-run,top=stairY(za);
  G.block(st.x0,st.x1,za>openUnder?0:Math.max(0,top-.45),top,za,zb,0xc6c1b5);G.block(st.x0,st.x1,top-.004,top+.006,za,za+.03,0x6f6a60);}
 G.rod([st.x0+.02,.9,st.z1-.1],[st.x0+.02,H+.9,st.z0],.022,C.timberDark);
 for(const z of [st.z1-.1,0,-1.4,st.z0+.05])G.rod([st.x0+.02,stairY(z),z],[st.x0+.02,stairY(z)+.9,z],.018,C.grey);
 // Under the low end nobody fits (house-walk.js stops the player); these keep a walker out too, each set back a body's
 // radius from where somebody climbing is, so it never trips them.
 for(let z=st.z1-.6;z>openUnder;z-=.44){const za=Math.max(openUnder,z-.44),h=stairY(z+.32)-.04;if(h>.05)solid(st.x0,st.x1,za,z,0,h);}
 // Where it opens, the typhoon cupboard, its doors facing the office.
 G.block(st.x0-.02,st.x0,0,1.7,-1.6,openUnder,0xa98e6a);G.block(st.x0-.03,st.x0-.02,.1,1.6,-1.31,-1.29,C.timberDark);solid(st.x0-.02,st.x1,-1.6,openUnder,0,stairY(openUnder+.32)-.04);
 spot(ground,[2.55,1.0,-1.3],'Open the typhoon cupboard','inspect','The typhoon cupboard','Under the stairs: torches, spare batteries, a coil of rope, sandbags, a battery radio, a megaphone and a tin of hard biscuits. When a typhoon warning comes, the whole cupboard goes over to the town hall, where people wait out the storm.');
 // The sign on the newel post at the foot: upstairs is private.
 G.rod([st.x0+.02,0,st.z1-.02],[st.x0+.02,1.05,st.z1-.02],.03,C.timberDark);
 G.sign(plate('Staff only',{w:512,h:80}),.62,.1,st.x0+.36,1.12,st.z1+.02,{name:'Stair private sign',depth:.015});
 spot(ground,[2.7,1.4,2.1],'Read the sign at the stairs','read','Staff only','Private: the officer’s quarters. Officer Mori lives upstairs. He works the night patrol and sleeps in the morning, so please ring the bell at the counter rather than come up.');
 // The back door, under the head of the stairs, out to the yard and the patrol car.
 G.block(B.maxX-.06,B.maxX-.01,0,2.05,-3.12,-2.28,0x7d8f86);G.box(.04,.04,.12,B.maxX-.08,1.0,-2.4,C.grey);
 const back=new THREE.Object3D();back.position.set(3.45,1.1,-2.7);back.name='Station back door';ground.add(back);
 reg(back,'Go out to the patrol car',()=>{
  // Out of the back door, not the front: the street door's exit point is swapped for this one exit and put back.
  const keep={exit:site?.exitPosition,facing:site?.entryFacing};
  if(site){site.exitPosition=[S.backDoor.x,.02,S.maxZ+.75];site.entryFacing=0;}
  try{exit();}finally{if(site){site.exitPosition=keep.exit;site.entryFacing=keep.facing;}}
 },true);

 // ── Upstairs: Officer Mori's quarters ──
 const y2=FLOOR2;
 named(upper,'Upstairs tatami',[5.75,.012,2.55],[-.925,y2+.006,1.95],C.tatami);
 for(const x of [-2.85,-.85,1.15])U.block(x-.025,x+.025,y2+.012,y2+.016,.68,3.22,C.tatamiEdge);U.block(-3.78,1.93,y2+.012,y2+.016,1.93,1.97,C.tatamiEdge);
 // The guard round the stair well: a low wall with a timber cap along the flight, and across its foot end.
 U.block(st.x0-.04,st.x0,y2,y2+1.0,st.z0,st.z1,C.wall);U.block(st.x0-.06,st.x0+.02,y2+1.0,y2+1.04,st.z0,st.z1+.04,C.timberDark);
 U.block(st.x0,st.x1,y2,y2+1.0,st.z1,st.z1+.04,C.wall);U.block(st.x0,st.x1,y2+1.0,y2+1.04,st.z1-.02,st.z1+.06,C.timberDark);
 solid(st.x0-.06,st.x0+.02,st.z0,st.z1+.06,y2,y2+1.04);solid(st.x0,st.x1,st.z1-.02,st.z1+.06,y2,y2+1.04);
 // The partition between his room and the back room, open at its end, by the stair well.
 U.block(B.minX,2.0,y2,CEIL2,.56,.64,C.wall);solid(B.minX,2.02,.54,.66,y2,CEIL2);
 // His futon along the street wall, laid out in the morning and folded away in the afternoon (the routine keeps it
 // laid: he is in it from seven till three), so the rest of his room stays a room to walk through.
 U.block(.2,2.0,y2,y2+.14,2.25,3.2,C.futon);U.box(1.1,.05,1.05,1.38,y2+.165,2.72,C.quilt);U.box(.4,.12,.75,.62,y2+.2,2.72,0xf3e8d2);solid(.2,2.0,2.25,3.2,y2,y2+.14);
 spot(upper,[1.1,y2+.5,1.85],'Inspect Officer Mori’s futon','inspect','Officer Mori’s futon','Laid out at seven in the morning, after the night patrol, and slept in until three. If he is asleep, let him be.');
 // The extension telephone by his pillow: after ten the station's calls ring up here too.
 U.box(.2,.1,.18,-.15,y2+.05,2.75,0xe8e1c7);U.box(.22,.05,.07,-.15,y2+.12,2.75,0xe8e1c7);
 spot(upper,[-.15,y2+.4,2.35],'Inspect the extension telephone','inspect','Extension telephone','A cream telephone on the tatami by his pillow, wired to the station’s line. In the morning, while he sleeps, it rings through to the prefectural headquarters in Naha instead.');
 // His desk at the plaza window, with the notebook he keeps his days in, and the chair he sits in.
 U.block(3.3,3.8,y2+.7,y2+.74,1.8,3.0,C.timber);for(const z of [1.85,2.95])U.block(3.32,3.78,y2,y2+.7,z-.04,z+.04,C.timberDark);solid(3.3,3.8,1.8,3.0,y2,y2+.74);
 U.box(.22,.03,.3,3.55,y2+.76,2.4,0x3f5a44);U.box(.08,.12,.08,3.6,y2+.8,2.8,0x3a4a6a);
 U.box(.44,.05,.42,2.85,y2+.42,2.4,C.timber);for(const [dx,dz] of [[-.18,-.18],[.18,-.18],[-.18,.18],[.18,.18]])U.box(.04,.42,.04,2.85+dx,y2+.21,2.4+dz,C.timberDark);U.box(.05,.42,.42,2.62,y2+.68,2.4,C.timber);
 const work=sleepHours({name:'Officer Mori'});
 spot(upper,[3.45,y2+1.0,2.4],'Read Officer Mori’s notebook','read','Officer Mori’s notebook','Patrol from '+time(1320)+' to '+time(360)+'. Sleep '+time(work.sleep)+' to '+time(work.wake)+'. Desk from 16:00. Supper from Sakura (Thuan says the curry bun).\nUmi-no-yu after the patrol, before bed.\nWash the car on Sunday.\nThe child’s green bicycle: still nobody. Ask at the school.');
 seat(spot(upper,[2.3,y2+.9,1.9],'Sit at Officer Mori’s desk','seat','Officer Mori’s desk','His chair at the window over the bus plaza. From here he can see the bus come in and the yard where the car is.'),{position:[2.85,y2,2.4],stand:[2.4,y2,2.1],surfaceY:y2+.44,yaw:-Math.PI/2,front:STATION_HOME_LAYOUT.tableSeatFront});
 // The clothes rail with the spare uniform, and the peg on the partition where his cap hangs when he is home.
 U.rod([-3.6,y2+1.75,.8],[-2.2,y2+1.75,.8],.02,C.grey);U.box(.5,.7,.08,-3.2,y2+1.35,.82,C.khaki);U.box(.35,.9,.06,-2.6,y2+1.25,.84,C.navy);
 for(const x of [-3.65,-2.15])U.rod([x,y2,.8],[x,y2+1.75,.8],.018,C.grey);solid(-3.7,-2.1,.7,.9,y2,y2+1.8);
 U.box(.1,.1,.03,1.0,y2+1.72,.655,C.timberDark);U.box(.035,.035,.14,1.0,y2+1.7,.71,C.timberDark);
 spot(upper,[-2.9,y2+1.3,1.4],'Inspect the spare uniform','inspect','Spare uniform','A pressed summer shirt and the trousers on a hanger, ready for the night patrol. His cap hangs on the peg by the door when he is home; MORI is written inside it in marker pen.');
 // The portable television on a low cabinet, for the late news and the baseball.
 U.block(-3.75,-3.05,y2,y2+.45,2.2,3.15,C.timberDark);U.box(.45,.38,.4,-3.35,y2+.64,2.7,0x3b3f45);U.box(.01,.28,.32,-3.12,y2+.66,2.7,0x21302c);solid(-3.78,-3.05,2.2,3.15,y2,y2+.85);
 spot(upper,[-2.6,y2+.9,2.7],'Inspect the television','inspect','Portable television','A small portable set with a bent aerial. The channel knob is stuck between the late news and the baseball, which suits him.');
 // The stair head is the door of his home: the rack where his patrol boots come off and the slippers go on.
 U.block(2.3,2.9,y2,y2+.4,-3.25,-3.0,C.timber);U.block(2.3,2.9,y2+.2,y2+.22,-3.25,-3.0,C.timberDark);U.box(.28,.12,.24,2.45,y2+.46,-3.12,C.black);U.box(.22,.05,.24,2.75,y2+.43,-3.12,C.navy);solid(2.3,2.9,-3.25,-3.0,y2,y2+.4);
 spot(upper,[2.6,y2+.8,-2.6],'Look at the shoe rack','inspect','At the top of the stairs','His patrol boots, polished, on the rack, and a pair of navy slippers. Upstairs is his home, so the boots stop here.');
 // The back room: the kitchenette along the north wall, with the kettle on the gas ring and the rice cooker.
 U.block(-3.8,-3.25,y2,y2+.85,-2.2,.4,C.white);U.block(-3.82,-3.23,y2+.85,y2+.89,-2.22,.42,C.counterTop);solid(-3.82,-3.23,-2.22,.42,y2,y2+.89);
 U.box(.4,.08,.5,-3.52,y2+.9,-1.5,0x9aa3a0);U.cyl(.11,.13,.18,-3.52,y2+1.03,-1.5,0xd9d6cc,{segments:12});U.rod([-3.52,y2+1.12,-1.5],[-3.4,y2+1.16,-1.38],.015,C.black);
 U.box(.36,.3,.36,-3.52,y2+1.04,-.6,C.white);U.block(-3.8,-3.25,y2+.85,y2+.95,-.2,.3,0xb9c4c6);
 // The washing machine at the back, for the uniform shirts he washes every afternoon.
 U.block(-3.8,-3.25,y2,y2+.9,-3.1,-2.5,C.white);U.cyl(.18,.18,.02,-3.24,y2+.55,-2.8,0x9aa3a0,{rz:Math.PI/2,segments:14});solid(-3.8,-3.24,-3.1,-2.5,y2,y2+.9);
 spot(upper,[-2.9,y2+1.2,-1.5],'Inspect the kettle','inspect','The kettle','An aluminium kettle on the gas ring, the rice cooker beside it and the small fridge under the counter. Everything he needs for breakfast at three in the afternoon.');
 // The light: a soft sky light for both floors and one lamp that goes with him up and down the stairs.
 room.add(new THREE.HemisphereLight(0xfff3dc,0x8a8474,1.6));
 const lamp=new THREE.PointLight(0xf4f6ff,1.3,8,2);lamp.position.set(.6,CEIL1-.4,-.3);group.add(lamp);

 // The front door.
 const door=new THREE.Object3D();door.position.set(...STATION_ROOM.exit);door.name='Station front door';ground.add(door);reg(door,'Exit to Main Street',exit,true);

 const g=G.finish(ground,'Police station ground floor'),u=U.finish(upper,'Police station first floor');
 for(const m of [g.materials.lamp,u.materials.lamp])if(m){m.emissive.set(C.lamp);m.emissiveIntensity=.9;}
 // The windows show daylight inside; the ground floor's glazing is the same `glow` finish the street sees lit at night.
 for(const m of [g.materials.glow,u.materials.glow])if(m)m.emissiveIntensity=.35;
 delete ground.userData.walkLevels;delete ground.userData.powerNetwork;delete upper.userData.walkLevels;delete upper.userData.powerNetwork;

 const floors=[{id:'ground',x:[B.minX,B.maxX],z:[B.minZ,B.maxZ],y:0,thick:.1},
  {id:'stair',x:[st.x0,st.x1],z:[st.z0,st.z1],y:[H,0],thick:.25},
  {id:'first-floor',x:[B.minX,st.x0],z:[B.minZ,B.maxZ],y:H,thick:.15},
  {id:'first-floor-front',x:[st.x0,B.maxX],z:[st.z1,B.maxZ],y:H,thick:.15},
  {id:'landing',x:[st.x0,B.maxX],z:[B.minZ,st.z0],y:H,thick:.15}];
 const walk=createHouseWalk(floors);
 return {...STATION_ROOM,homeLayouts:{'Officer Mori':STATION_HOME_LAYOUT},entranceRoute:ENTRANCE_ROUTE,storeys:true,walk,colliders:[],
  exitFloor:0,ceilingsFrom:1.9,
  /** Which storey he is on: the lamp goes with him (one light for the station, not two). */
  follow(p){const up=p.y>1.5;lamp.position.set(up?.4:.6,(up?CEIL2:CEIL1)-.4,up?1.2:-.3);},
  /** The station's own solids, storey by storey, and its floors, for tests and the building survey. */
  solids:colliders,floors};
}
