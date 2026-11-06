import * as THREE from '../../vendor/three.module.js';
import {benchSeat} from './seat-slots.js';
import {createKit,paint} from './okinawa/kit.js';
import {bicycle} from './okinawa/parked-bicycle.js';
import {buildPatrolCar,PATROL_CAR} from './patrol-car.js';
import {japaneseSign} from './okinawa/signs.js';
import {createLampGlow,createLightPools} from './light-pools.js';
import {windowGlow,poolGlow} from '../render/dusk.js';
import {POLICE_STATION as S,STATION_YARD as Y,STATION_NOTICE as N,KOBAN} from './police-station-layout.js';
import {buildStationDressing,stationNoticeTexture} from './police-station-dressing.js';
import {stationNoticeText} from '../feed/police-notices.js';
import {STATION_HOME_LAYOUT} from './interiors/police-station.js';

/**
 * Minato Police Station from the street (police-station-layout.js has the why of every measurement).
 *
 * Two storeys of painted concrete with a navy plinth band, a flat roof behind a parapet with the water tank and the
 * radio mast on it: the small-town station of the seventies. On the street face: the glazed sliding doors under a
 * concrete canopy, the red lamp, the counter window under its 交番 sign, the notice board, the name board and the
 * station's vertical plate. In the yard on the bus plaza, where the police box stood: the patrol car, the bicycle rack
 * with Mori's white bicycle and a lost child's bicycle waiting for its owner, the flagpole, and a bench by the wall.
 *
 * One kit (okinawa/kit.js), so the building, the car and the yard are a handful of draw calls; the glazing is the kit's
 * `glow` finish, which the town lights at dusk with every other window, and the red lamp's halo and the pools of light
 * on the footway are light-pools.js decals, not lights.
 */
const SANS='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';
const SERIF='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';
const C=Object.freeze({wall:0xebe6d8,band:0xd3cdbd,navy:0x27304d,plinth:0x9a968c,slab:0xc9c3b4,coping:0xdcd6c6,
 glass:0x7f98a2,alu:0xb9bfbf,steel:0x6f7a72,door:0x7d8f86,red:0xc8302a,white:0xf4f3ee,black:0x1d1f24,tyre:0x1c1c20,
 timber:0x9a7650,galv:0xa9b1b3,paint:0xf2f1ea,tank:0xe8e6dc,gold:0xd9a441});

/** The police emblem as the small stations paint it: a gold five-pointed sunburst in a ring. */
function emblem(ctx,cx,cy,r){
 ctx.save();ctx.translate(cx,cy);ctx.fillStyle='#d9a441';
 ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fill();
 ctx.strokeStyle='#d9a441';ctx.lineWidth=r*.12;ctx.beginPath();ctx.arc(0,0,r*1.18,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#f4f2ea';ctx.beginPath();ctx.arc(0,0,r*.2,0,Math.PI*2);ctx.fill();ctx.restore();
}
/** The name board: emblem, 港警察署 and the English line under it, navy on enamel white. */
const nameBoard=()=>paint(1280,128,(ctx,w,h)=>{
 ctx.fillStyle='#f4f2ea';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#27304d';ctx.lineWidth=8;ctx.strokeRect(4,4,w-8,h-8);
 emblem(ctx,80,h/2,40);ctx.fillStyle='#1f2c4a';ctx.textBaseline='middle';ctx.textAlign='left';
 ctx.font=`bold 84px ${SERIF}`;ctx.fillText(japaneseSign('Minato Police Station'),150,h/2+4);
 ctx.font=`bold 30px ${SANS}`;ctx.textAlign='right';ctx.fillText('MINATO',w-40,h*.3);ctx.fillText('POLICE STATION',w-40,h*.72);
});
/** Four evenly spaced characters on a four-character plate: no obsolete seven-character blank tail. */
const doorPlate=()=>paint(128,512,(ctx,w,h)=>{
 ctx.fillStyle='#f3efe4';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#6b5a40';ctx.lineWidth=10;ctx.strokeRect(5,5,w-10,h-10);
 const chars=[...japaneseSign('Minato Police Station')],pitch=(h-48)/chars.length,size=Math.min(96,pitch*.84);
 ctx.fillStyle='#16181c';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${size}px ${SERIF}`;
 chars.forEach((c,i)=>ctx.fillText(c,w/2,24+(i+.5)*pitch));
});
/** The canopy fascia is a complete enamel sign, with its emblem and lettering on the same face. */
const entranceSign=()=>paint(1024,128,(ctx,w,h)=>{
 ctx.fillStyle='#27304d';ctx.fillRect(0,0,w,h);emblem(ctx,92,h/2,39);
 ctx.fillStyle='#f4f3ee';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold 84px ${SERIF}`;
 ctx.fillText(japaneseSign('Minato Police Station'),620,h/2+3,650);
});
/** Over the counter window: the police box's own sign, 交番 and KOBAN, kept when the box came down. */
const kobanSign=()=>paint(512,176,(ctx,w,h)=>{
 ctx.fillStyle='#f6f5ef';ctx.fillRect(0,0,w,h);ctx.fillStyle='#27304d';ctx.fillRect(0,h-26,w,26);
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold 96px ${SANS}`;ctx.fillText(japaneseSign('Police box'),w/2,h*.4);
 ctx.fillStyle='#c8302a';ctx.font=`bold 26px ${SANS}`;ctx.fillText('KOBAN',w/2,h-13);
});
/** The car's door panels: 沖縄県警察 in black on the white. */
const carDoor=()=>paint(256,64,(ctx,w,h)=>{ctx.fillStyle='#f4f3ee';ctx.fillRect(0,0,w,h);ctx.fillStyle='#16181c';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold 40px ${SANS}`;ctx.fillText(japaneseSign('Okinawa Prefectural Police'),w/2,h/2+2);});
/**
 * The car's number plates: a kei car's yellow plate, black lettering, the Okinawa office, its class number and a
 * kana. A made-up number, nobody's: ・110, which the station's clerk asked for as a joke and got.
 */
const kPlate=()=>paint(256,128,(ctx,w,h)=>{ctx.fillStyle='#f2cf3a';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#2a2a2a';ctx.lineWidth=5;ctx.strokeRect(6,6,w-12,h-12);
 ctx.fillStyle='#1d1d1d';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold 30px ${SANS}`;ctx.fillText('沖縄 50',w/2+20,30);
 ctx.font=`bold 26px ${SANS}`;ctx.fillText('あ',34,88);ctx.font=`bold 62px ${SANS}`;ctx.fillText('・110',w/2+22,86);});
/** The bay's ground marking, white paint: 警察車両専用. */
const bayMark=()=>paint(512,96,(ctx,w,h)=>{ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(244,243,236,.92)';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold 64px ${SANS}`;ctx.fillText(japaneseSign('Police vehicles only'),w/2,h/2+4);});
/** The flag. */
const hinomaru=()=>paint(192,128,(ctx,w,h)=>{ctx.fillStyle='#f6f5f0';ctx.fillRect(0,0,w,h);ctx.fillStyle='#bc002d';ctx.beginPath();ctx.arc(w/2,h/2,h*.3,0,Math.PI*2);ctx.fill();});

export function buildPoliceStation(world,options){
 const group=new THREE.Group();group.name='Minato Police Station';world.group.add(group);
 const kit=createKit({shadows:!!options.shadows});
 const {minX,maxX,minZ,maxZ,plinth:P,storey:H,roof:R,parapet:T,face}=S,cx=(minX+maxX)/2,cz=(minZ+maxZ)/2,W=maxX-minX,D=maxZ-minZ;
 const doorZ=S.entrance.z,winZ=S.window.z,west=face-.02;

 // ── The building ──
 // A low plinth (one step up from the footway), the walls, the navy skirting every police building in Japan wears,
 // the first-floor band, the roof slab and the parapet with its coping.
 kit.block(minX-.06,maxX+.06,0,P,minZ-.06,maxZ+.06,C.plinth);
 kit.block(minX,maxX,P,R,minZ,maxZ,C.wall);
 kit.block(minX-.015,maxX+.015,P,.75,minZ-.015,maxZ+.015,C.navy);
 kit.block(minX-.025,maxX+.025,H,H+.24,minZ-.025,maxZ+.025,C.band);
 kit.block(minX-.06,maxX+.06,R,R+.14,minZ-.06,maxZ+.06,C.slab);
 for(const [x0,x1,z0,z1] of [[minX-.06,maxX+.06,minZ-.06,minZ+.14],[minX-.06,maxX+.06,maxZ-.14,maxZ+.06],[minX-.06,minX+.14,minZ+.14,maxZ-.14],[maxX-.14,maxX+.06,minZ+.14,maxZ-.14]]){
  kit.block(x0,x1,R+.14,T,z0,z1,C.wall);kit.block(x0-.03,x1+.03,T,T+.06,z0-.03,z1+.03,C.coping);
 }
 kit.block(minX+.14,maxX-.14,R+.14,R+.17,minZ+.14,maxZ-.14,C.slab);
 // Rain from the flat roof comes down four downpipes, one at each corner, into the gutter at the plinth.
 for(const [x,z] of [[minX+.12,minZ-.06],[maxX-.12,minZ-.06],[maxX+.06,maxZ-.25],[minX+.12,maxZ+.06]])kit.rod([x,R+.1,z],[x,.06,z],.045,C.alu);
 // On the roof: the water tank every Okinawan building keeps against the dry season's cuts, and the radio mast
 // that carries the duty desk's set to the prefectural network in Naha (the desk radio, interiors/police-station.js).
 kit.cyl(.5,.5,1.0,maxX-1.4,R+1.08,minZ+1.4,C.tank,{segments:16});kit.block(maxX-2.0,maxX-.8,R+.57,R+.65,minZ+.8,minZ+2.0,C.steel);
 kit.rod([maxX-1.4,R+1.58,minZ+1.4],[maxX-1.4,R+1.68,minZ+1.4],.12,C.tank);
 kit.rod([maxX-.9,R+.17,maxZ-1.0],[maxX-.9,R+4.2,maxZ-1.0],.05,C.alu);
 for(const [y,l] of [[R+2.6,.9],[R+3.4,.6]])kit.box(l,.03,.03,maxX-.9,y,maxZ-1.0,C.alu);
 for(const [dx,dz] of [[.9,.5],[-.9,.5],[0,-.9]])kit.rod([maxX-.9,R+3.0,maxZ-1.0],[maxX-.9+dx,R+.2,maxZ-1.0+dz],.008,C.black);

 // ── The street face (west) ──
 // The glazed sliding doors, aluminium-framed, lit from the lobby after dark (kit `glow`).
 const e0=doorZ-S.entrance.half,e1=doorZ+S.entrance.half;
 kit.block(west-.02,west-.005,P,P+2.1,e0,e1,C.glass,'glow');
 for(const z of [e0,doorZ,e1])kit.block(west-.05,west+.01,P,P+2.16,z-.04,z+.04,C.alu,'metal');
 kit.block(west-.05,west+.01,P+2.1,P+2.18,e0-.04,e1+.04,C.alu,'metal');
 // Two actual pull handles, clear of the glazing, rather than a rail across both panes.
 for(const z of [doorZ-.13,doorZ+.13]){
  kit.rod([face-.105,1.03,z],[face-.105,1.29,z],.016,C.alu,{finish:'metal'});
  for(const y of [1.04,1.28])kit.rod([face-.04,y,z],[face-.105,y,z],.012,C.alu,{finish:'metal'});
 }
 kit.block(face-.55,face,0,P-.01,doorZ-.8,doorZ+.8,C.slab);
 // A concrete rain hood with a visible cream cap above the enamel fascia. The old tall navy lip hid the slab
 // and read as a flat bar; this cap projects 72 cm and the complete sign stands 15 mm clear of its front edge.
 kit.block(face-.72,face,2.62,2.78,doorZ-.91,doorZ+.91,C.slab);
 kit.sign(entranceSign(),1.76,.18,face-.75,2.65,doorZ,{ry:-Math.PI/2,depth:.03,name:'Station entrance canopy sign',edge:C.navy});
 // The counter window: a sliding pane with a ledge outside, where you ask the way or hand in a wallet without
 // coming in. It is the police box's job, and the 交番 sign over it is the police box's sign.
 const w0=winZ-S.window.half,w1=winZ+S.window.half;
 kit.block(west-.02,west-.005,P+.95,P+2.05,w0,w1,C.glass,'glow');
 for(const z of [w0,winZ,w1])kit.block(west-.05,west+.01,P+.92,P+2.08,z-.035,z+.035,C.alu,'metal');
 for(const y of [P+.92,P+2.05])kit.block(west-.05,west+.01,y,y+.05,w0-.04,w1+.04,C.alu,'metal');
 kit.block(face-.3,face,P+.86,P+.92,w0-.05,w1+.05,C.slab);
 kit.sign(kobanSign(),1.4,.48,face-.04,P+2.4,winZ,{ry:-Math.PI/2,name:'Station counter window sign',edge:C.navy});
 // The notice board between them, glazed, under its own little hood: wanted, lost, and the season's notices.
 kit.block(face-.08,face,N.y0-.04,N.y1+.04,N.z0-.04,N.z1+.04,C.timber);
 kit.sign(stationNoticeTexture(),N.z1-N.z0,N.y1-N.y0,face-.09,(N.y0+N.y1)/2,(N.z0+N.z1)/2,{ry:-Math.PI/2,name:'Station notice board',depth:.01,edge:C.timber});
 kit.block(face-.2,face,N.y1+.04,N.y1+.08,N.z0-.08,N.z1+.08,C.navy);
 // The station's plate, brush lettering on white wood, beside the doors on the corner side.
 kit.sign(doorPlate(),.3,1.18,face-.045,1.68,doorZ+1.08,{ry:-Math.PI/2,name:'Station door plate',edge:0x6b5a40});
 // Upstairs, Officer Mori's two windows over the street (window-interior.js paints a room behind them).
 for(const z of [16.5,19.7]){kit.block(west-.02,west-.012,4.0,5.2,z-.9,z+.9,C.glass,'window');kit.block(face-.18,face,3.92,3.98,z-.98,z+.98,C.slab);for(const zz of [z-.92,z,z+.92])kit.block(west-.05,west,3.98,5.22,zz-.03,zz+.03,C.alu,'metal');}
 // The name board, high on the street face where it reads from the bus stop and from halfway up Main Street.
 const board=nameBoard();
 kit.sign(board,6,.6,face-.04,5.62,cz,{ry:-Math.PI/2,name:'Station name board',edge:C.navy});

 // ── The plaza face (south) ──
 const south=maxZ+.02;
 // The lobby's side window, over the waiting bench inside; and the tea corner's small one.
 for(const [x0,x1,y0,y1] of [[6.55,8.15,P+1.0,P+2.0],[9.55,10.25,P+1.25,P+1.95]]){kit.block(x0,x1,y0,y1,south-.01,south+.01,C.glass,'glow');kit.block(x0-.05,x1+.05,y0-.06,y0,maxZ,maxZ+.16,C.slab);}
 // The back door, steel, with its lamp over it (the kit's `lamp` finish comes on at dusk) and a step down to the yard.
 const b0=S.backDoor.x-S.backDoor.half,b1=S.backDoor.x+S.backDoor.half;
 kit.block(b0,b1,P,P+2.05,south-.01,south+.02,C.door);kit.block(b0-.05,b1+.05,P+2.05,P+2.1,maxZ,maxZ+.03,C.alu,'metal');
 kit.box(.18,.12,.12,S.backDoor.x,P+2.3,maxZ+.08,0xfff3d0,{finish:'lamp'});
 kit.block(b0-.1,b1+.1,0,P-.01,maxZ,maxZ+.3,C.slab);
 // The outdoor unit of the duty office's air-conditioner (Okinawa's summers), on its bracket off the wall.
 kit.box(.8,.55,.28,Y.aircon.x,.42,Y.aircon.z,C.white);kit.cyl(.19,.19,.02,Y.aircon.x-.12,.42,Y.aircon.z+.15,C.steel,{rx:Math.PI/2,segments:14});
 // Upstairs south: his room's side window and the kitchenette's.
 for(const [x0,x1] of [[6.75,8.35],[9.55,10.75]]){kit.block(x0,x1,4.0,5.2,south-.01,south+.01,C.glass,'window');kit.block(x0-.05,x1+.05,3.92,3.98,maxZ,maxZ+.16,C.slab);}
 kit.sign(board,4.2,.42,cx-.6,5.62,maxZ+.04,{name:'Station plaza name board',edge:C.navy});
 // The red lamp (赤色灯) on its bracket at the plaza corner, over the doors: seen up Main Street and across the plaza.
 const lampAt=new THREE.Vector3(face-.45,3.05,maxZ-.35);
 kit.rod([face,3.05,maxZ-.35],[lampAt.x+.12,3.05,lampAt.z],.03,C.steel);kit.cyl(.09,.12,.1,lampAt.x,2.86,lampAt.z,C.steel);
 const red=new THREE.Mesh(new THREE.SphereGeometry(.2,16,12),new THREE.MeshStandardMaterial({color:C.red,emissive:0xff2a1a,emissiveIntensity:.4,roughness:.3}));
 red.position.copy(lampAt);red.name='Police station red lamp';red.userData.redLamp=true;group.add(red);

 // ── The north and back faces ──
 // The holding room's high window, barred; the upstairs kitchenette and his room; the meter box on the back wall.
 kit.block(9.65,10.25,P+1.9,P+2.3,minZ-.02,minZ,C.glass);for(let x=9.72;x<10.25;x+=.12)kit.block(x-.012,x+.012,P+1.88,P+2.32,minZ-.05,minZ-.02,C.steel,'metal');
 for(const [x0,x1] of [[6.55,7.95],[9.35,10.15]])kit.block(x0,x1,4.0,5.0,minZ-.02,minZ,C.glass,'window');
 kit.block(maxX,maxX+.02,P+1.6,P+1.9,14.75,15.25,C.glass);
 kit.box(.12,.5,.36,maxX+.06,1.6,15.9,C.galv,{finish:'metal'});

 // ── The yard, where the police box stood ──
 // Its concrete is the station's forecourt route (architecture-plan.js), laid by the town's lane surfaces. The bay is
 // marked out in white paint, 16 mm over the concrete (ground-layers.js keeps overlapping surfaces 15 mm apart).
 const car=Y.car,paintY=.046,bay={x0:car.x-car.length/2-.25,x1:car.x+car.length/2+.1,z0:car.z-car.width/2-.3,z1:car.z+car.width/2+.3};
 for(const z of [bay.z0,bay.z1])kit.block(bay.x0,bay.x1,paintY,paintY+.01,z-.05,z+.05,C.paint);
 kit.block(bay.x1-.1,bay.x1,paintY,paintY+.01,bay.z0,bay.z1,C.paint);
 const mark=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.32),new THREE.MeshStandardMaterial({map:bayMark(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,roughness:.9}));
 mark.rotation.set(-Math.PI/2,0,Math.PI/2);mark.position.set(bay.x0+.45,paintY+.012,car.z);mark.name='Police bay marking';group.add(mark);
 // The patrol car: a white-and-black kei car, reverse-parked, its light bar dark until it is needed (patrol-car.js).
 kit.at(car.x,car.z,-Math.PI/2,()=>buildPatrolCar(kit,{door:carDoor(),plate:kPlate()}));
 // The rack: a front-wheel rack of galvanised steel, two base rails and a pair of wheel guides per slot. Mori's white
 // bicycle is in the first slot; a child's green bicycle, found by the seawall and handed in, waits in the third with its
 // lost-property tag. Each stands with its front axle on the slot line (okinawa/parked-bicycle.js).
 const rack=Y.rack,step=(rack.x1-rack.x0)/(rack.slots-1),slot=rack.slot;
 for(const dz of [-.2,.2])kit.rod([rack.x0-.3,.035,slot+dz],[rack.x1+.3,.035,slot+dz],.022,C.galv,{finish:'metal'});
 for(let i=0;i<rack.slots;i++){const x=rack.x0+i*step;
  for(const dx of [-.065,.065]){const g=[[x+dx,.035,slot-.2],[x+dx,.36,slot-.1],[x+dx,.36,slot+.1],[x+dx,.035,slot+.2]];for(let k=0;k<3;k++)kit.rod(g[k],g[k+1],.012,C.galv,{finish:'metal'});}
 }
 const bikes=[];
 for(const [i,b] of [[0,{id:'police-bicycle',colour:C.white,box:true,owner:'Officer Mori',why:'Officer Mori’s white police bicycle, with the lamp, the basket and the lockable box on the carrier for the forms. He walks the current night patrol; the bicycle stays locked in its rack.'}],
  [2,{id:'lost-child-bicycle',colour:0x3f8f5a,size:.75,basket:false,tag:true,owner:'a child (lost property, unclaimed)',why:'A small green bicycle found by the seawall on 2 September and handed in. It waits in the rack with its tag on the bars until somebody claims it.'}]]){
  const size=b.size||1;bikes.push(bicycle(kit,rack.x0+i*step,slot+.52*size,{ry:Math.PI/2,...b}));
 }
 // The flagpole on its concrete foot, and the flag, which is up from half past eight to a quarter past five.
 const fp=Y.flagpole;kit.block(fp.x-.25,fp.x+.25,0,.12,fp.z-.25,fp.z+.25,C.slab);kit.cyl(.035,.05,fp.height,fp.x,fp.height/2,fp.z,C.alu,{finish:'metal'});kit.sphere(.07,fp.x,fp.height+.05,fp.z,C.gold);
 const flag=new THREE.Mesh(new THREE.PlaneGeometry(.9,.6),new THREE.MeshStandardMaterial({map:hinomaru(),side:THREE.DoubleSide,roughness:.9}));
 flag.position.set(fp.x+.5,fp.height-.38,fp.z);flag.name='Station flag';group.add(flag);
 // The bench under the south wall's eave, facing the plaza.
 const bn=Y.bench;for(const dx of [-.65,.65])kit.block(bn.x+dx-.06,bn.x+dx+.06,0,.42,bn.z-.18,bn.z+.18,C.slab);
 for(const dz of [-.13,0,.13])kit.block(bn.x-bn.length/2,bn.x+bn.length/2,.42,.46,bn.z+dz-.055,bn.z+dz+.055,C.timber);
 const dressing=buildStationDressing(kit,group,world,options);
 kit.finish(group,'Minato Police Station');
 // The 交番 sign is a light box, lit after dark like every police box's.
 const lightBox=group.getObjectByName('Station counter window sign')?.material?.[4];
 if(lightBox){lightBox.emissive=new THREE.Color(0xffffff);lightBox.emissiveMap=lightBox.map;lightBox.emissiveIntensity=0;}

 // The red lamp's halo and its glow on the footway, and the lobby's light falling out through the doors after dark.
 const glowRed=createLampGlow(group,[{head:{x:lampAt.x,y:lampAt.y,z:lampAt.z},ground:{x:face-.9,y:.04,z:maxZ-.4},radius:1.4,size:1.5}],{pool:{color:0xff5a4a,strength:.35},halo:{color:0xff4a3a,strength:1}});
 const glowLobby=createLightPools(group,[{x:face-1.2,y:.04,z:doorZ,radius:2.1},{x:face-1.0,y:.04,z:winZ,radius:1.6}],{strength:.45});

 // The colliders: the building, the car, the rack with its bicycles, the flagpole, the bench, the air-conditioner.
 world.colliders.push({id:'police-station',x:cx,z:cz,w:W,d:D,height:T+.06},
  {id:'police-station-patrol-car',x:car.x,z:car.z,w:car.length+.03,d:car.width+2*PATROL_CAR.mirrors,height:PATROL_CAR.height},
  {id:'police-station-bicycle-rack',x:(rack.x0+rack.x1)/2,z:slot,w:rack.x1-rack.x0+.6,d:.46,height:.4,holds:'bicycles'},...bikes,
  {id:'police-station-flagpole',x:fp.x,z:fp.z,w:.5,d:.5,height:fp.height},
  {id:'police-station-bench',x:bn.x,z:bn.z,w:bn.length,d:.4,height:.46},
  {id:'police-station-aircon',x:Y.aircon.x,z:Y.aircon.z,w:.8,d:.32,height:.72});

 // What you can look at from the street, in English (the signs stay Japanese).
 const inspect=(pos,label,title,text,kind='inspect')=>{const a=new THREE.Object3D();a.position.set(...pos);a.name=label;group.add(a);options.register?.(a,label,()=>options.onAction?.(kind,title,typeof text==='function'?text():text));return a;};
 inspect([face-.35,1.45,(N.z0+N.z1)/2],'Read the station notice board','Station notice board',stationNoticeText(),'read');
 inspect([face-.45,1.5,winZ],'Look in at the counter window','The counter window','The police box’s old window, moved into the station’s wall under the police box’s own sign. The officer on the desk slides it open to give directions, take in a lost wallet or lend an umbrella, without anybody having to come in.');
 inspect([5.48,1.1,16.65],'Ring the counter bell','The counter bell',()=>dressing.card.visible?'The bell rings clearly. Mori is on his night patrol; the card asks visitors to ring here. In an emergency, dial 110.':'The bell gives a clear ring at the service window.');
 inspect([car.x-car.length/2-.4,1.0,car.z],'Inspect the patrol car','Patrol car','The station’s kei patrol car, white over black, the light bar on the roof. It is small enough for Kitahama’s lanes and the lane up to the sea cave. Officer Mori washes it on Sunday mornings and has never once needed the siren.');
 inspect([rack.x0,1.0,slot-.7],'Inspect the police bicycle','Police bicycle','Officer Mori’s white bicycle, with a lamp, a basket and the lockable box on the carrier for the forms. He walks the current night patrol; the bicycle stays locked in its rack.');
 inspect([rack.x0+2*step,.8,slot-.7],'Read the tag on the small green bicycle','Lost property: a child’s bicycle','A small green bicycle with a tag on the handlebar: Found by the seawall, 2 September. Not yet claimed. The bell still works.','read');
 inspect([fp.x+.6,1.2,fp.z-.6],'Look up at the flag','Station flag','The flag goes up at half past eight, when the desk opens for the day, and comes down at a quarter past five. Whoever is on duty does it; most days that is Officer Mori, before he goes up to sleep or before supper.');
 const seat=inspect([bn.x,.75,bn.z+.5],'Sit on the bench by the station','Bench by the station','A bench under the eave, for whoever is waiting: to see the officer, for the bus, or for a child to be collected.','seat');
 // (the three slats span 0.37 m about bn.z: the front edge is 0.185 ahead of it)
 seat.userData.seat=benchSeat({position:[bn.x,0,bn.z+.05],stand:[bn.x,0,bn.z+.75],surfaceY:.46,eyeY:1.2,yaw:Math.PI,pitch:0},{length:bn.length,front:.135});

 // The site: the station is Officer Mori's home (id `koban`, as the roster and the save migration have it) and a
 // public building you walk into at any hour.
 let site=options.sites.find(s=>s.id===KOBAN.id);
 if(!site){site={id:KOBAN.id,jp:KOBAN.jp,sub:'MINATO POLICE',color:C.wall,accent:'#27304d'};options.sites.push(site);}
 Object.assign(site,{title:KOBAN.title,jp:KOBAN.jp,line:KOBAN.address,homeOwner:KOBAN.resident,homeOwners:[KOBAN.resident],ownRoom:true,
  homeLayouts:{[KOBAN.resident]:STATION_HOME_LAYOUT},door:[KOBAN.door[0],.02,KOBAN.door[1]],entryFacing:KOBAN.inward,x:KOBAN.door[0],z:KOBAN.door[1]});
 site.exitPosition=[...site.door];
 const homes=world.homes instanceof Map?world.homes:new Map();
 homes.set(KOBAN.resident,{owner:KOBAN.resident,household:KOBAN.id,address:KOBAN.address,door:[...KOBAN.door],building:'police-station',occupied:false});
 world.homes=homes;
 const anchor=new THREE.Object3D();anchor.name='police station entrance';anchor.position.set(face-.3,1.3,doorZ);group.add(anchor);
 options.register?.(anchor,'Enter '+KOBAN.title,()=>options.enter(site));

 // By the clock: the red lamp burns day and night, brighter after dark; the pools and halo come up with the street's;
 // the flag is up in the day.
 const update=minutes=>{
  dressing.update(minutes);
  const m=((minutes%1440)+1440)%1440,glow=windowGlow(m),pool=poolGlow(m);
  red.material.emissiveIntensity=.4+glow*1.6;glowRed.update(pool);glowLobby.update(pool);
  flag.visible=m>=fp.raise&&m<fp.lower;
  if(lightBox)lightBox.emissiveIntensity=glow*.55;
 };
 (world.hourly??=[]).push(update);update(720);
 return {group,red,flag,update,site,dressing};
}
