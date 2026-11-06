import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {MINATO_COMPACT as P} from './minato-compact-plan.js';
import {SHARED_DINING_BOUNDS,SHARED_DINING_FLOOR,SHARED_DINING_COLLIDERS} from './shared-dining-layout.js';
import {buildIzakayaDressing} from './izakaya-dressing.js';
import {buildMinatoBar} from './minato-bar.js';
import {buildIzakayaInteractive} from './izakaya-interactive.js';
import {hangIzakayaPosters} from './izakaya-posters.js';
import {createMinatoMemories,MINATO_MEMORIES} from './izakaya-exploration.js';
import {createFutureCalendar} from './future-calendar.js';
import {createIzakayaTV} from '../advertising-billboard.js';
import {MINATO_WALNUT_STORY} from './izakaya-walnut.js';
import {IZAKAYA_PLAYER_SEATS,DISHES,DRINKS} from '../../people/izakaya-beer.js';
import {izakayaOpen} from '../../people/social.js';
import {SATO_COUNTER,SATO_LEDGE,SATO_MENU,satoRamenOpen} from '../sato-ramen-layout.js';
import {japaneseSign} from '../okinawa/signs.js';
import {buildSatoRamenDressing} from './sato-ramen-dressing.js';
import {addOwnedCharacter} from '../../people/owned-characters.js';

// The imported room supplies its walls, kitchen, WC, chairs, pendant fittings and
// ticket machine. This layer supplies only the objects whose content or behaviour
// belongs to the game. Neither entrance adds the retired 13 m shell or scales it.
const xyz=([x,y,z])=>({x,y,z});
export const COMPACT_DRESSING=Object.freeze({
 phone:Object.freeze(xyz(P.details.phone)),
 karaoke:Object.freeze({...xyz(P.details.karaoke),w:.62,d:.48,h:.72}),
 keepShelf:P.details.keptBottleShelf,
 tanuki:Object.freeze({...xyz(P.details.tanuki),scale:.55}),
 lanterns:Object.freeze([]), // The Blender pendants own these two positions.
 caddies:Object.freeze([
  [-3.12,P.counter.top,-1.10,0],[-1.52,P.counter.top,-1.10,0],
  [-2.50,P.booth.tableTop,2.40,Math.PI/2],
 ]),
 warmer:Object.freeze({x:-2.70,y:P.worktop.top,z:P.worktop.position[2]}),
 posters:Object.freeze([
  ['beer',2.305,2.12,.28,-Math.PI/2,.5,.72],
  ['enka',-4.055,2.00,2.96,Math.PI/2,.6,.86],
  ['police',-4.055,1.90,-.32,Math.PI/2,.46,.66],
  ['karaoke',2.305,2.10,1.02,-Math.PI/2,.5,.72],
  ['baseball',1.94,2.20,1.565,Math.PI,.52,.74],
 ]),
});

export const COMPACT_CAMPAIGN_POSTERS=Object.freeze({
 sakura:{position:P.details.campaignPoster,yaw:Math.PI/2,approach:[-3.61,1.55,1.95]},
 yakitori:{position:[-4.055,1.65,-2.54],yaw:Math.PI/2,approach:[-3.57,1.55,-2.54]},
 sake:{position:[5.845,1.85,1.06],yaw:-Math.PI/2,approach:[5.10,1.55,1.06]},
 house:{position:[4.69,2.02,3.435],yaw:Math.PI,approach:[4.18,1.55,2.87]},
});

export const COMPACT_SATO_DRESSING=Object.freeze({
 prints:Object.freeze([
  ['beer',2.635,1.83,.55,Math.PI/2,.5,.72],
  ...[1.45,1.82,2.19].map((z,i)=>['shikishi'+i,2.635,2.10,z,Math.PI/2,.27,.3]),
  ['hari',5.845,1.92,-.55,-Math.PI/2,.5,.72],
  ['calendar',5.845,2.05,2.45,-Math.PI/2,.46,.66],
  ['note',5.50,2.30,3.435,Math.PI,.26,.2],
 ]),
 condiments:[[4.10,.12],[4.80,.12]],tissues:[[3.59,.18],[5.67,.18]],board:[5.55,.54],
 bowls:[], // The physical high rack and its bowls are in the fitted GLB.
 okamochi:{x:P.ramenLedge.position[0],y:P.floorY,z:2.70,w:.30,d:.46,h:.46},
 closed:false,
 approaches:{autographs:[3.12,1.75,1.82],hari:[5.30,1.7,-.55],calendar:[5.20,1.7,2.45],beer:[3.12,1.6,.55],pepper:[4.50,1.1,.90],delivery:[5.10,.85,2.70],today:[5.35,1.3,.94]},
});

const MINCHO='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';
function printTexture(lines,{width=512,height=256,paper='#eee2c7',ink='#3b2d25'}={}){
 const c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d');
 x.fillStyle=paper;x.fillRect(0,0,width,height);x.textAlign='center';x.textBaseline='middle';x.fillStyle=ink;
 lines.forEach((line,i)=>{x.font=`${i?'600':'700'} ${Math.min(48,height/(lines.length+1)*.62)}px ${MINCHO}`;x.fillText(japaneseSign(line),width/2,(i+1)*height/(lines.length+1),width-26);});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function meshBox(parent,name,size,position,color,roughness=.8){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,roughness}));
 mesh.name=name;mesh.position.set(...position);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function panel(parent,name,size,position,lines,yaw=0,options={}){
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(...size),new THREE.MeshStandardMaterial({map:printTexture(lines,options),roughness:.92}));
 mesh.name=name;mesh.position.set(...position);mesh.rotation.y=yaw;parent.add(mesh);return mesh;
}
// Printed faces belong to the solid they finish. Stacking a separate paper plane
// a millimetre over the wood/pages competed for depth on the owner's phone.
function printedBox(parent,name,size,position,lines,face,options={}){
 const edge=new THREE.MeshStandardMaterial({color:options.paper||'#644e37',roughness:.9});
 const materials=Array(6).fill(edge);
 materials[face]=new THREE.MeshStandardMaterial({map:printTexture(lines,options),roughness:.92});
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),materials);
 mesh.name=name;mesh.position.set(...position);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

/** Small waiting shell using the same fitted footprint, only if the GLB is unavailable. */
function fallback(room){
 const group=new THREE.Group();group.name='Minato compact loading shell';room.add(group);
 for(const [name,b] of [['Minato',P.main],['Sato',P.ramen]]){
  const w=b.maxX-b.minX,d=b.maxZ-b.minZ,x=(b.minX+b.maxX)/2,z=(b.minZ+b.maxZ)/2;
  meshBox(group,name+' floor',[w,.08,d],[x,0,z],0x845b3d);
  meshBox(group,name+' back wall',[w,P.ceilingY,.15],[x,P.ceilingY/2,b.minZ-.075],0xc3ad82);
 }
 for(const [name,f] of [['Counter',P.counter],['Kitchen worktop',P.worktop],['Sato counter',P.ramenCounter],['Sato preparation',P.ramenPrep]])
  meshBox(group,name,[f.width,f.top-P.floorY,f.depth],[f.position[0],(f.top+P.floorY)/2,f.position[2]],0x66462e);
 meshBox(group,'Booth table',[P.booth.tableWidth,.05,P.booth.tableDepth],[P.booth.position[0],P.booth.tableTop-.025,P.booth.position[2]],0x82572f);
 for(const x of P.counterStools)meshBox(group,'Counter stool',[.38,P.seatHeight-P.floorY,.38],[x,(P.seatHeight+P.floorY)/2,P.counterSeatZ],0x6b3d32);
}

function discoveries(room,anchor,action,exploration){
 const group=new THREE.Group();group.name='Minato compact discoveries';room.add(group);
 const [wx,wy,wz]=P.window.position,w=P.window.width,h=P.window.height;
 const glass=new THREE.Mesh(new THREE.PlaneGeometry(w-.04,h-.04),new THREE.MeshBasicMaterial({color:0xd8e5db,transparent:true,opacity:.065,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true}));
 glass.name='Minato clear street window';glass.position.set(wx,wy,wz);group.add(glass);
 const curtains=new THREE.Group();curtains.name='Minato sliding window curtains';group.add(curtains);
 for(const side of [-1,1]){
  const g=new THREE.PlaneGeometry(w/2,.73,20,2),v=g.attributes.position;
  for(let i=0;i<v.count;i++)v.setZ(i,Math.sin(v.getX(i)*Math.PI*22)*.018);g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xc1b18d,roughness:.95,side:THREE.DoubleSide,forceSinglePass:true}));
  m.position.set(wx+side*w/4,wy+.11,wz-.055);m.userData.side=side;curtains.add(m);
 }
 meshBox(group,'Curtain track',[w+.08,.025,.025],[wx,wy+h/2+.03,wz-.055],0x6e5140);
 const curtainOpen=open=>curtains.children.forEach(m=>{m.position.x=wx+m.userData.side*(open?w*.44:w/4);m.scale.x=open?.23:1;});
 curtainOpen(true);
 const [gx,gy,gz]=P.details.guestbook;
 meshBox(group,'Guestbook lower cover',[.18,.004,.24],[gx,gy-.002,gz],0x644e37);
 meshBox(group,'Guestbook pages',[.172,.022,.232],[gx,gy+.011,gz],0xdfd1ad);
 printedBox(group,'First Lantern Night guestbook cover',[.18,.004,.24],[gx,gy+.024,gz],['初めての提灯の夜','窓と歌','おいしいごはん','思い出を覚える人'],2,{width:256,height:384});
 const [rx,ry,rz]=P.details.radio,radioBase=ry-.12,shelfDepth=rz-P.main.minZ+.13;
 meshBox(group,'Kitchen radio wall shelf',[.76,.035,shelfDepth],[rx,radioBase-.0175,P.main.minZ+shelfDepth/2],0x65503b);
 for(const dx of [-.27,.27])meshBox(group,'Radio shelf bracket',[.025,.18,.04],[rx+dx,radioBase-.10,P.main.minZ+.025],0x493f32);
 meshBox(group,'Old kitchen radio',[.66,.24,.17],[rx,ry,rz],0x64503b);
 meshBox(group,'Radio woven speaker grille',[.33,.18,.008],[rx-.115,ry,rz+.089],0x2e2c25);
 panel(group,'Radio frequency dial',[.21,.06],[rx+.19,ry+.04,rz+.094],['AM  FM'],0,{width:256,height:64,paper:'#b7bd8a'});
 for(const dx of [.135,.245]){
  const knob=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.02,16),new THREE.MeshStandardMaterial({color:0xd1c4a6,roughness:.5}));knob.rotation.x=Math.PI/2;knob.position.set(rx+dx,ry-.064,rz+.103);group.add(knob);
 }
 const [px,py,pz]=P.details.recipe,backDepth=pz-P.main.minZ;
 printedBox(group,'House recipe card',[.31,.39,backDepth],[px,py,P.main.minZ+backDepth/2],['港のたれ','醤油・みりん・砂糖','最終の船を待つ人に','温かい一皿を'],4,{width:384,height:512});
 panel(group,'Old ferry ticket',[.19,.075],[wx+w/2-.16,wy-h/2+.11,wz-.035],['LAST BOAT · 1997'],Math.PI,{width:256,height:96});
 const positions={guestbook:[gx,.91,gz],window:[wx,1.55,wz-.33],radio:[rx,2.15,rz+.45],recipe:[px,1.60,pz+.42]};
 const memories=exploration?createMinatoMemories({...exploration,onCurtain:curtainOpen}):null;
 for(const m of MINATO_MEMORIES)anchor(positions[m.id],m.label,()=>memories?memories.open(m.id):action(m.id==='radio'?'radio':'inspect',m.title,m.text));
 return {memories,update(){},dispose(){},curtains};
}

function menus(room,anchor,action){
 const group=new THREE.Group();group.name='Minato and Sato menus';room.add(group);
 const items=[...Object.values(DISHES).map(d=>[d.jp,d.price]),...['draft','bottle','awamori','sake','can','oolong'].map(id=>[DRINKS[id].jp,DRINKS[id].price])];
 const batch=(name,list,size,placement,paper,ink)=>{
  const c=document.createElement('canvas');c.width=96*list.length;c.height=320;const x=c.getContext('2d'),parts=[];
  list.forEach(([title,price],i)=>{
   const left=i*96;x.fillStyle=paper;x.fillRect(left,0,96,320);x.textAlign='center';x.textBaseline='middle';x.fillStyle=ink;
   const chars=[...japaneseSign(title).replace(/ /g,'')],font=Math.min(36,238/chars.length);x.font=`700 ${font}px ${MINCHO}`;
   chars.forEach((ch,k)=>x.fillText(ch,left+48,14+font/2+k*font,80));
   x.font=`700 25px ${MINCHO}`;x.fillText('¥'+price,left+48,292,86);
   const [px,py,pz,yaw]=placement(i),g=new THREE.PlaneGeometry(...size),uv=g.attributes.uv;
   for(let k=0;k<uv.count;k++)uv.setX(k,(i+uv.getX(k))/list.length);
   g.rotateY(yaw);g.translate(px,py,pz);parts.push(g);
  });
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const mesh=new THREE.Mesh(mergeGeometries(parts),new THREE.MeshStandardMaterial({map:texture,roughness:.92}));mesh.name=name;group.add(mesh);parts.forEach(g=>g.dispose());
 };
 // Two rows of full-size cards fit the east wall without projecting into the
 // shared passage. Printed names stay vertical and both menus use one draw each.
 batch('Minato menu strips',items,[.20,.65],i=>[2.305,2.45-Math.floor(i/8)*.73,-3.58+(i%8)*.27,-Math.PI/2],'#eee2c7','#3b2d25');
 // Sato's back wall already owns its shop sign and extractor. A clear band on
 // the shared side wall holds the lunch plaques above the autograph boards.
 batch('Sato menu plaques',SATO_MENU.map(item=>[item.jp,item.cost]),[.26,.48],i=>[2.635,2.55,.15+i*.30,Math.PI/2],'#815736','#f4e3b9');
 anchor([3.15,2.15,.70],'Read the menu plaques',()=>action('read','Sato Ramen · menu',SATO_MENU.map(item=>item.name+' ¥'+item.cost).join(' · ')));
}

function lighting(room){
 const lamps=[];
 for(const [x,y,z,power] of [...P.details.lanterns.map(([x,y,z])=>[x,y-.11,z,2.4]),[P.booth.position[0],2.10,P.booth.position[2],2.9],[4.35,2.14,.35,3.3],[-2.10,2.35,-2.90,1.0]]){
  const light=new THREE.PointLight(0xffc284,power,5.3,2);light.name='Compact dining practical';light.position.set(x,y,z);room.add(light);lamps.push({light,power,ramen:x>2.5});
 }
 return lamps;
}
function hours(room,lamps){
 const minato=panel(room,'Minato closed card',[.48,.24],[0,1.93,3.40],['準備中','OPEN AT 16:00'],Math.PI);
 const ramen=panel(room,'Sato Ramen closed card',[.48,.24],[P.ramenEntrance.position[0],1.93,3.40],['準備中','LUNCH 11:00–14:00'],Math.PI);
 return {update(minutes){const m=izakayaOpen(minutes),r=satoRamenOpen(minutes);minato.visible=!m;ramen.visible=!r;for(const l of lamps)l.light.intensity=l.power*((l.ramen?r:m)?1:.35);}};
}

function steam(room){
 const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gradient=x.createRadialGradient(32,32,2,32,32,30);
 gradient.addColorStop(0,'rgba(255,255,255,.5)');gradient.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gradient;x.fillRect(0,0,64,64);
 const texture=new THREE.CanvasTexture(c),puffs=[],sources=[[3.65,P.ramenPrep.top+.25,-1.42],[4.25,P.ramenPrep.top+.34,-1.42],[4.65,P.ramenPrep.top+.34,-1.42]];
 for(let i=0;i<9;i++){
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,opacity:0}));s.name='Sato soup steam';s.raycast=()=>{};s.userData.phase=i/9;s.userData.source=sources[i%3];room.add(s);puffs.push(s);
 }
 let clock=0;
 return {update(dt,minutes){clock+=dt;for(const s of puffs){const t=(s.userData.phase+clock*.18)%1,[x,y,z]=s.userData.source;s.position.set(x+Math.sin(t*6+z)*.035,y+t*.68,z+Math.cos(t*5)*.03);s.scale.setScalar(.13+t*.26);s.material.opacity=satoRamenOpen(minutes)?.35*(1-t)*Math.min(1,t*6):0;}},dispose(){for(const s of puffs){s.material.dispose();s.removeFromParent();}texture.dispose();}};
}

/** The same fitted room is visible and collidable from Minato and Sato's doors. */
export function buildCompactDiningRoom({room,reg=()=>{},collider=()=>{},action=()=>{},exit=()=>{},getMinutes=()=>1200,exploration}, {addInterior,kind='izakaya'}={}){
 const furnished=addInterior?.(room);if(!furnished)fallback(room);
 const anchor=(position,label,fn)=>{const o=new THREE.Object3D();o.position.set(...position);o.name=label;room.add(o);reg(o,label,fn,true);return o;};
 for(const c of SHARED_DINING_COLLIDERS)collider(c.x,c.z,c.w,c.d,c.height);
 const dressing=buildIzakayaDressing(room,{layout:COMPACT_DRESSING});
 const ramenDressing=buildSatoRamenDressing(room,{anchor,action,layout:COMPACT_SATO_DRESSING});
 const keep=buildIzakayaInteractive(room,{anchor,action,layout:COMPACT_DRESSING});
 // Where Thao gets every drink: the rack, the tap, the back bar's bottles, the cold store, the warm sake (minato-bar.js).
 const bar=buildMinatoBar(room);
 hangIzakayaPosters({room,reg,action,placements:COMPACT_CAMPAIGN_POSTERS});
 const discovery=discoveries(room,anchor,action,exploration);
 const calendar=createFutureCalendar();calendar.group.position.set(...P.details.calendar);calendar.group.rotation.y=Math.PI;room.add(calendar.group);
 anchor([P.details.calendar[0],1.85,P.details.calendar[2]-.4],'Read Future Calendar',()=>{calendar.update();action('inspect','Future Calendar',calendar.mesh.userData.dateLabel+'\nToday’s real date · Europe/Stockholm. This calendar turns a page every real day.');});
 const television=createIzakayaTV({parent:room,position:P.details.television,yaw:Math.PI/2});
 anchor([P.details.television[0]+.7,1.65,P.details.television[2]],'Watch the television',()=>action('inspect','Minato television','Old television adverts, the lunchtime news and the occasional baseball game. Thao turns it down when a good story begins.'));
 menus(room,anchor,action);
 const lamps=lighting(room),closed=hours(room,lamps);closed.update(getMinutes());
 const vapour=steam(room);vapour.update(0,getMinutes());ramenDressing.update(getMinutes());
 // Retain the imported beer mascot at its original 48 cm display size. Its new
 // shelf is above the street window, clear of the curtain and walking headroom.
 meshBox(room,'Hawaii Lager high display shelf',[.68,.04,.48],[-2.40,2.23,3.20],0x664832);
 for(const x of [-2.65,-2.15]){
  meshBox(room,'Hawaii Lager shelf wall bracket',[.025,.16,.04],[x,2.30,3.425],0x4d493d);
  meshBox(room,'Hawaii Lager shelf support',[.025,.025,.42],[x,2.225,3.22],0x4d493d);
 }
 meshBox(room,'Hawaii Lager advertising plinth',[.58,.08,.45],[-2.40,2.29,3.20],0x244b46);
 const barfly=addOwnedCharacter({parent:room,kind:'barfly',position:[-2.40,2.33,3.20],height:.48,staticDisplay:true,yaw:Math.PI});
 panel(room,'Hawaii Lager advertising',[.65,.25],[-1.75,2.55,3.435],['ハワイラガー','アメリカのビール'],Math.PI,{paper:'#244b46',ink:'#f4e2bc'});
 anchor([-2.40,1.85,2.72],'Look at Hawaii Lager',()=>action('inspect','Hawaii Lager','An American lager advertisement sent by the harbour importer. The little Barfly mascot wears his favourite island shirt. Thao keeps him on a shelf above the window, where the whole table can see him.'));
 const owned=[barfly];
 anchor([...P.entrance.exit],'Step outside',()=>exit('izakaya'));
 anchor([...P.ramenEntrance.exit],'Exit to the street',()=>exit('ramen'));
 anchor([1.22,1.1,-.55],'Order something delicious',()=>action('izakaya-menu'));
 anchor([-2.10,1.7,-2.78],'Look at Thao’s back bar',()=>action('inspect',MINATO_WALNUT_STORY.title,MINATO_WALNUT_STORY.text+'\n\n'+MINATO_WALNUT_STORY.brands.map(b=>b.name+' — '+b.spirit).join('\n')));
 anchor([-1.35,1.1,2.4],'Listen to the table',()=>action('izakaya-gossip'));
 for(const seat of Object.values(IZAKAYA_PLAYER_SEATS)){
  const title=seat.id==='window'?'Minato window seat':seat.counter?'Minato counter':'Minato table';
  const o=anchor([seat.position[0],1,seat.position[2]],seat.label,()=>action('seat',title,'A warm table, a little conversation, and nowhere to hurry.'));
  o.userData.seat={...seat,izakaya:seat,pitch:0};
 }
 [...SATO_COUNTER,...SATO_LEDGE].forEach((seat,i)=>{
  const ledge=i>=SATO_COUNTER.length,o=anchor([seat.position[0],1,seat.position[2]],ledge?'Sit at the wall ledge':'Sit at the ramen counter',()=>action('seat',ledge?'Sato Ramen ledge':'Sato Ramen counter','A red stool and a glass of cold water. Mrs Sato nods over the steam.'));
  o.userData.seat={ramenSeatId:i,position:[...seat.position],stand:[...seat.stand],eyeY:seat.height+.6,yaw:seat.yaw,pitch:0,table:[...seat.table],surfaceY:seat.surfaceY,front:seat.front};
 });
 anchor([P.details.ticketMachine[0],1.15,P.details.ticketMachine[2]+.44],'Use the ticket machine',()=>action('ramen-ticket'));
 anchor([1.4,1.25,-1.10],'Inspect the shared kitchen',()=>action('inspect','Minato and Sato shared kitchen','Thao’s evening counter and Mrs Sato’s lunch counter share the washing, storage and cooking line. The open passage links both rooms; the grill, noodle boiler and stock pots stand on real worktops.')).userData.promptPenalty=.8;
 anchor([.25,1.55,-2.94],'Read the storage labels',()=>action('inspect','Thao’s stock cupboard','A cold cabinet below the radio, with labelled supplies for tonight and Mrs Sato’s lunch. Fresh produce, tea and prepared ingredients each have a place.'));
 anchor([.20,1.20,2.25],'Use the guest WC',()=>action('inspect','Guest WC','A small shared guest toilet and hand basin, reached directly from the dining aisle. Please leave the folding door as you found it.'));
 if(kind==='ramen')room.add(new THREE.HemisphereLight(0xfff1dc,0x7b7668,1.55));
 const entry=kind==='ramen'?P.ramenEntrance:P.entrance;
 const exitSiteAt=(x,z)=>Math.hypot(x-P.ramenEntrance.exit[0],z-P.ramenEntrance.exit[2])<Math.hypot(x-P.entrance.exit[0],z-P.entrance.exit[2])?'ramen':'izakaya';
 return {
  name:kind==='ramen'?'Sato Ramen':'Minato',bounds:SHARED_DINING_BOUNDS,floorPolygon:SHARED_DINING_FLOOR,
  spawn:[...entry.spawn],exit:[...entry.exit],yaw:0,cutaway:true,ceilingsFrom:1.9,
  exitSiteAt,exitAt:(x,z)=>[...(exitSiteAt(x,z)==='ramen'?P.ramenEntrance.exit:P.entrance.exit)],
  keep,owned,television,dressing,bar,calendar:()=>({...calendar.mesh.userData}),discoveries:()=>discovery.memories?.snapshot(),
  realUpdate(){calendar.update();discovery.update();},ownedUpdate(dt){owned.forEach(actor=>actor.update(dt));closed.update(getMinutes());},tick(dt=0){const minutes=getMinutes();closed.update(minutes);ramenDressing.update(minutes);vapour.update(dt,minutes);},
  dispose(){bar.dispose();calendar.dispose();discovery.dispose();television.dispose();vapour.dispose();owned.forEach(actor=>actor.dispose());},
 };
}
