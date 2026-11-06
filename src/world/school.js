import * as THREE from '../../vendor/three.module.js';
import {GROUND_LAYER} from './ground-layers.js';
import {SCHOOL,SCHOOL_COLUMNS,FUKUGI,TOWN_HALL_BUILDINGS,TOWN_HALL_PASSAGES,schoolColliders} from './school-layout.js';
import {createKit} from './okinawa/kit.js';
import {bicycle} from './okinawa/parked-bicycle.js';
import {shisa} from './okinawa/houses.js';
import {broadleafGeometry} from './okinawa/trees.js';
import {japaneseSign} from './okinawa/signs.js';
import {playSchoolChime,CHIME_TIMES} from '../audio/school-chime.js';

/**
 * 港小中学校, Minato Elementary & Junior High School, on the ground.
 *
 * The concrete block, the gateposts and their shisa, the bike shed, the taps, the iron
 * bars and the sea defences are a Blender model (tools/blender/build-school.py) that
 * streams in as you come near. What is made here is what has to be drawn sharp or has
 * to move: the coral-sand yard and the lines chalked on the field, the hana-block
 * screens with the light through them, the fukugi windbreak, the lettering, the clock's
 * hands, and the chime. Colliders and prompts are in place from the start.
 *
 * The classroom you can walk into is src/world/interiors/classroom.js.
 */
const B=SCHOOL.building;

function canvasTexture(width,height,draw,{srgb=true,repeat=null}={}){
 const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'),width,height);
 const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;
 if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);}
 return t;
}
const SERIF='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';
const GOTHIC='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';

/**
 * The yard's ground is laid by the ground generator from the town hall's plan (ground-plan-quarters.js TOWN_HALL_GROUND,
 * step 3 of the ground plan): the rolled yard, the forecourt, the aprons, the car park and its bays, the lawn and its
 * bed. What is left here is the lettering painted in the visitors' bay, 来客用 · For guests.
 */
function buildYard(group){
 const pk=SCHOOL.parking,PX=64,w=2.4,d=.7;
 const map=canvasTexture(Math.round(w*PX),Math.round(d*PX),(ctx,cw,ch)=>{
  ctx.clearRect(0,0,cw,ch);ctx.fillStyle='#f2efe6';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=`bold ${Math.round(ch*.5)}px ${GOTHIC}`;ctx.fillText('来客用 · For guests',cw/2,ch/2);
 });
 const mark=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,roughness:.85}));
 // Read from the aisle on the bays' south side, as a driver turning in reads it (it was turned to the hall, upside down
 // from the car park and the lane).
 mark.rotation.set(-Math.PI/2,0,Math.PI);mark.position.set(pk.maxX-2.2,GROUND_LAYER.lane+.004,pk.maxZ-.6);
 mark.name='Town hall car park lettering';mark.renderOrder=1;mark.userData.walkSurface=false;group.add(mark);
 return mark;
}

/**
 * Hana-block: the pierced concrete breeze block Okinawa builds screens and garden walls
 * out of, for the wind to go through and the sun not to. One block to a tile of the
 * texture; the holes are real holes, so the light through them lands on the floor as the
 * lattice it is.
 */
export function hanaBlockMaterial(){
 const tile=canvasTexture(128,128,(ctx,w,h)=>{
  ctx.fillStyle='#dcd8ca';ctx.fillRect(0,0,w,h);
  ctx.globalCompositeOperation='destination-out';
  // Four petals round a centre boss, and a quarter-round in each corner.
  const petal=(a)=>{ctx.save();ctx.translate(64,64);ctx.rotate(a);ctx.beginPath();ctx.ellipse(0,-30,11,21,0,0,Math.PI*2);ctx.fill();ctx.restore();};
  for(let k=0;k<4;k++)petal(k*Math.PI/2);
  for(const [x,y] of [[0,0],[128,0],[0,128],[128,128]]){ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.fill();}
  ctx.globalCompositeOperation='source-over';
  ctx.strokeStyle='rgba(120,116,104,.55)';ctx.lineWidth=3;ctx.strokeRect(1.5,1.5,125,125);
  ctx.fillStyle='#e8e4d7';ctx.beginPath();ctx.arc(64,64,9,0,Math.PI*2);ctx.fill();
 });
 const material=new THREE.MeshStandardMaterial({map:tile,alphaTest:.5,roughness:.95,side:THREE.DoubleSide});
 const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:tile,alphaTest:.5,side:THREE.DoubleSide});
 return {material,depth,tile};
}
export function hanaScreen(group,{material,depth,tile},x0,x1,y0,y1,z,alongX=true,name='Hana-block screen'){
 const w=alongX?x1-x0:z[1]-z[0],h=y1-y0;
 const map=tile.clone();map.needsUpdate=true;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(w/.2,h/.2);
 const m=material.clone();m.map=map;
 const d=depth.clone();d.map=map;
 const screen=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);screen.customDepthMaterial=d;
 if(alongX)screen.position.set((x0+x1)/2,(y0+y1)/2,z);
 else{screen.position.set(x0,(y0+y1)/2,(z[0]+z[1])/2);screen.rotation.y=Math.PI/2;}
 screen.castShadow=true;screen.receiveShadow=true;screen.name=name;group.add(screen);
 // A frame of plain block round it, so it is a wall with a pattern in it and not a sheet.
 const frame=new THREE.MeshStandardMaterial({color:0xd6d2c4,roughness:.95});
 const bar=(sx,sy,sz,px,py,pz)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),frame);b.position.set(px,py,pz);b.castShadow=true;b.receiveShadow=true;group.add(b);};
 if(alongX){bar(w+.04,.08,.16,(x0+x1)/2,y1+.04,z);}
 else{bar(.16,.08,w+.04,x0,y1+.04,(z[0]+z[1])/2);}
 return screen;
}

/** Fukugi: tall, narrow, dense and dark, planted in lines against the wind. */
function buildFukugi(group,shadows){
 // The island's one tree in its windbreak form (okinawa/trees.js), two variants in turn.
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85});
 const d=new THREE.Object3D(),c=new THREE.Color();
 [0,1].forEach(variant=>{
  const spots=FUKUGI.filter((_,i)=>i%2===variant);
  const trees=new THREE.InstancedMesh(broadleafGeometry({form:'column',variant}),material,spots.length);
  spots.forEach(([x,z],i)=>{
   const h=5.2+(((i*2+variant)*37)%10)/10*1.6;
   d.position.set(x,0,z);d.scale.set(h,h,h);d.rotation.set(0,i*1.3+variant,0);d.updateMatrix();
   trees.setMatrixAt(i,d.matrix);trees.setColorAt(i,c.setScalar(.9+((i+variant)%3)*.06));
  });
  trees.name='School fukugi';trees.castShadow=!!shadows;trees.receiveShadow=true;group.add(trees);
 });
}

function plate(group,text,{w,h,at,rotY=0,bg='#f1ead6',fg='#1f2a26',font=SERIF,vertical=false,size=.7,sub=null,name}){
 text=japaneseSign(text);
 const px=256,cw=Math.round(w*px),ch=Math.round(h*px);
 const map=canvasTexture(cw,ch,(ctx)=>{
  ctx.fillStyle=bg;ctx.fillRect(0,0,cw,ch);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';
  if(vertical){const chars=[...text],s=Math.min(cw*size,(sub?ch*.8:ch*.94)/chars.length);ctx.font=`bold ${s}px ${font}`;chars.forEach((c,i)=>ctx.fillText(c,cw/2,ch*.05+s*(i+.55)));
   if(sub){ctx.font=`bold ${cw*.16}px ${GOTHIC}`;ctx.fillText(sub,cw/2,ch*.95);}}
  else{ctx.font=`bold ${ch*size}px ${font}`;ctx.fillText(text,cw/2,sub?ch*.4:ch*.54,cw*.94);if(sub){ctx.font=`bold ${ch*.2}px ${GOTHIC}`;ctx.fillText(sub,cw/2,ch*.82,cw*.94);}}
 });
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map,roughness:.8}));
 mesh.position.set(...at);mesh.rotation.y=rotY;mesh.name=name||text;group.add(mesh);return mesh;
}

/** Room plates, hung out from the corridor ceiling over each door, as every school has them. */
// The plates over each bay. Every plate is lettered in Japanese, as a Japanese town hall's are (plate(), through
// okinawa/signs.js SIGN_JAPANESE: the English sweep had put English on them, and the owner's phone showed it,
// 21 October 2026). The east bay is the doctor's flat now that Johansson lives on Kitano-jima, and the mayor's office is
// the Community Hall's meeting room since it went to his study there (briefs/town-hall-zone.md, phase M).
const ROOMS=[["Warehouse"],["Entrance"],["Classroom"],["Community Kitchen"],["Meeting room"],["Clinic"],["Doctor’s residence"]];

/** The noticeboard in the entrance: harbour safety, the typhoon shelter map, the co-op. */
function noticeboard(group){
 const map=canvasTexture(560,460,(ctx,w0,h0)=>{
  // Laid out on a 640 x 400 board and fitted to the narrow wall beside the entrance.
  ctx.scale(560/640,460/400);const w=640,h=400;
  ctx.fillStyle='#6b5a44';ctx.fillRect(0,0,w,h);ctx.fillStyle='#c9ae83';ctx.fillRect(12,12,w-24,h-24);
  let seed=5;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const note=(x,y,nw,nh,bg,rot,lines,head)=>{ctx.save();ctx.translate(x+nw/2,y+nh/2);ctx.rotate(rot);ctx.fillStyle=bg;ctx.fillRect(-nw/2,-nh/2,nw,nh);
   ctx.fillStyle='#b3382c';ctx.beginPath();ctx.arc(0,-nh/2+8,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2a2520';ctx.textAlign='center';
   ctx.font=`bold 20px ${GOTHIC}`;ctx.fillText(head,0,-nh/2+34);ctx.font=`13px ${GOTHIC}`;lines.forEach((l,i)=>ctx.fillText(l,0,-nh/2+58+i*18));ctx.restore();};
  note(26,26,200,160,'#f4efdf',-.03,["When there is a typhoon","To Minato Elementary Gymnasium/Community Center","Check your emergency bag",'Typhoon shelters:','school gym, community hall'],"Typhoon shelter");
  note(242,30,170,150,'#fff7c9',.02,["Don't play on the quay",'Do not play on','the quay or the','tetrapods'],"Port Safety");
  note(430,24,186,176,'#e3f0e6',-.015,["Harley Tournament","May 4th of the lunar calendar","Fisheries cooperative Youth group",'Harbour boat race','co-op youth section'],"From the Fisheries Association");
  note(40,206,250,168,'#f6f1e6',.01,["Evacuation site map",'Shelter map'],"Minato Town Evacuation map");
  // The map on that notice: the harbour, the school, the hall, drawn with a felt pen.
  ctx.strokeStyle='#3f6f9a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(60,330);ctx.quadraticCurveTo(160,300,270,340);ctx.stroke();
  ctx.fillStyle='#b3382c';ctx.fillRect(120,290,26,18);ctx.fillRect(200,300,20,14);ctx.fillStyle='#2a2520';ctx.font=`11px ${GOTHIC}`;ctx.fillText("School",120,284);ctx.fillText("Community Hall",196,296);
  note(312,210,150,160,'#f4efdf',-.02,["School lunch news","September","Goya Champuru","Soki soup","Fried horse mackerel"],"School lunch");
  note(478,214,140,150,'#ffe1d6',.03,["Lost item",'Lost: one','blue sandal','(left foot)'],"Otoshimono");
 });
 // On the wall between the column and the entrance, where you wait for the doors.
 const board=new THREE.Mesh(new THREE.BoxGeometry(.95,.78,.05),[...Array(4).fill(new THREE.MeshStandardMaterial({color:0x5c4b39})),new THREE.MeshStandardMaterial({color:0x5c4b39}),new THREE.MeshStandardMaterial({map,roughness:.9})]);
 board.position.set(SCHOOL.genkan.x-1.78,1.6,B.minZ-.16);board.name='School noticeboard';group.add(board);
 return board;
}

/** The clock over the entrance. Its face is built with the hall; the hands follow the town clock. */
function clockHands(group){
 // On the parapet over the entrance, beside the name.
 const centre=new THREE.Vector3(SCHOOL.genkan.x-4.5,3.75,SCHOOL.corridor.minZ-.42);
 const black=new THREE.MeshStandardMaterial({color:0x1d1d1d,roughness:.6});
 const hand=(length,width)=>{const g=new THREE.Group();g.position.copy(centre);const m=new THREE.Mesh(new THREE.BoxGeometry(width,length,.02),black);m.position.y=length/2-.06;g.add(m);group.add(g);return g;};
 const hour=hand(.38,.06),minute=hand(.56,.04);
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.04,12),black);cap.rotation.x=Math.PI/2;cap.position.copy(centre);cap.position.z-=.02;group.add(cap);
 // Seen from the field (-z), clockwise is the hands turning about +z.
 return minutes=>{const m=((minutes%1440)+1440)%1440;minute.rotation.z=(m%60)/60*Math.PI*2;hour.rotation.z=((m/60)%12)/12*Math.PI*2;};
}

/**
 * @param {object} world
 * @param {object} options register / onAction / enter / sites / shadows, as the town gives them
 */
/**
 * The town hall's additions to the old school, all from the Okinawan kit: the power
 * house (two diesel sets behind louvred walls, two exhaust stacks, the fuel tank in its
 * bund, the cable going out to the poles), the concrete canopy over the entrance, the
 * clear forecourt, the flags on the pole, and a monument sign
 * by the gate. Returns nothing; colliders are in schoolColliders().
 */
function buildTownHallDressing(group,options){
 const kit=createKit({shadows:options.shadows});
 const ph=SCHOOL.powerHouse,wall=0xdcd6c6,trim=0x2f5f6a,steel=0x8e979a;
 const cx=(ph.minX+ph.maxX)/2,cz=(ph.minZ+ph.maxZ)/2,H=ph.height;
 kit.block(ph.minX,ph.maxX,0,H,ph.minZ,ph.maxZ,wall);
 kit.block(ph.minX-.1,ph.maxX+.1,H,H+.15,ph.minZ-.1,ph.maxZ+.1,0xc8c2b5);
 kit.block(ph.minX-.05,ph.maxX+.05,0,.3,ph.minZ-.05,ph.maxZ+.05,0xa9aa9c);
 // Louvred vents down both long walls, and the steel double doors facing the forecourt.
 for(const z of [ph.minZ-.03,ph.maxZ+.03])for(let x=ph.minX+.6;x<ph.maxX-.4;x+=1.3){kit.box(.9,.9,.04,x+.45,2.2,z,0x6f7579);for(let k=0;k<6;k++)kit.box(.86,.04,.06,x+.45,1.82+k*.15,z,0x4f5559);}
 kit.box(.06,2.4,1.9,ph.maxX+.03,1.2,ph.door[1],0x6f8a8e);kit.box(.07,2.4,.04,ph.maxX+.05,1.2,ph.door[1],0x3a3d3f);
 kit.box(.6,.4,.02,ph.maxX+.04,2.75,ph.door[1],0xe0b93a);
 kit.box(.4,.16,.04,ph.maxX+.045,2.75,ph.door[1],0x2b2b2b);
 // Two exhaust stacks with rain caps, sooty at the top, through the roof.
 for(const z of [cz-1.2,cz+1.2]){kit.cyl(.17,.19,3.2,ph.minX+1.2,H+1.5,z,0x7a7d78,{segments:8});kit.cyl(.26,.26,.08,ph.minX+1.2,H+3.15,z,0x3a3d3f,{segments:8});kit.cyl(.18,.18,.48,ph.minX+1.2,H+2.84,z,0x4a4a46,{segments:8});}
 // The day tank: a horizontal steel tank on saddles inside a low bund wall.
 const [tx,tz]=ph.tank;
 kit.block(tx-1.6,tx+1.6,0,.45,tz-.7,tz-.55,0xc8c2b5);kit.block(tx-1.6,tx+1.6,0,.45,tz+.55,tz+.7,0xc8c2b5);
 kit.block(tx-1.6,tx-1.45,0,.45,tz-.7,tz+.7,0xc8c2b5);kit.block(tx+1.45,tx+1.6,0,.45,tz-.7,tz+.7,0xc8c2b5);
 kit.cyl(.5,.5,2.6,tx,1.05,tz,0xe6e3d6,{rz:Math.PI/2,segments:14});
 for(const dx of [-.8,.8])kit.box(.15,.6,.9,tx+dx,.3,tz,steel);
 kit.box(1,.25,.02,tx,1.1,tz+.51,0xc0392b);
 // The fuel line runs buried, under the forecourt and the lawn: down from the tank's outlet into the bund's floor, and up
 // the power house's wall to its day-tank inlet. It ran 12 m through the air at hip height, across the walk from the gate.
 kit.rod([tx+1.3,1.05,tz],[tx+1.3,.02,tz],.04,0x3a3d3f);
 kit.rod([tx+1.3,-.3,tz],[ph.minX+2,-.3,ph.maxZ+.06],.04,0x3a3d3f);
 kit.rod([ph.minX+2,.02,ph.maxZ+.06],[ph.minX+2,1.05,ph.maxZ+.06],.04,0x3a3d3f);
 // The cable out of the switchboard, up a riser pole to the town's lines.
 kit.rod([ph.maxX-.4,H,ph.minZ+.3],[ph.maxX-.4,H+1.5,ph.minZ-.6],.05,0x2b2a30);
 // The canopy over the entrance: a thin concrete slab on two round columns.
 const c=SCHOOL.canopy;
 kit.block(c.minX,c.maxX,c.height,c.height+.2,c.minZ,c.maxZ+.1,0xe4e1d3);
 kit.block(c.minX,c.maxX,c.height+.2,c.height+.32,c.minZ,c.minZ+.12,trim);
 for(const x of [c.minX+.2,c.maxX-.2])kit.cyl(.14,.14,c.height,x,c.height/2,c.minZ+.2,0xe4e1d3,{segments:12});
 // The forecourt remains clear for people; working vehicles use Main Street and the quay.
 // A monument sign of polished stone at the gate, the way every town hall has one.
 kit.box(2.4,1.3,.4,15,.65,30,0x4a4f52,{finish:'gloss'});
 // Its stone plinth stands on the yard: architecture, not ground (tools/ground-audit.mjs reads the name).
 {const plinth=new THREE.Mesh(new THREE.BoxGeometry(2.6,.15,.55),new THREE.MeshStandardMaterial({color:0x9a958a,roughness:.9}));plinth.position.set(15,.075,30);plinth.name='Town hall monument plinth';plinth.receiveShadow=true;group.add(plinth);}
 kit.finish(group,'Town hall dressing');
 plate(group,"Minato Town Hall · Community Centre",{w:2.1,h:.62,at:[15,.75,29.79],rotY:Math.PI,bg:'#4a4f52',fg:'#efe6cc',size:.36,sub:'MINATO TOWN HALL · COMMUNITY CENTRE',name:'Town hall monument'});
 plate(group,"Minato Power Station",{w:1.4,h:.4,at:[ph.maxX+.06,3.2,ph.door[1]],rotY:Math.PI/2,bg:'#e6ecef',fg:'#2f4f5a',size:.6,name:'Power house sign'});
 // Flags on the old school's pole: Japan and the town.
 const flag=(y,draw)=>{const t=canvasTexture(140,96,draw);const f=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.95),new THREE.MeshStandardMaterial({map:t,side:THREE.DoubleSide,roughness:.9}));f.position.set(SCHOOL.flagpole.x-.74,y,SCHOOL.flagpole.z);f.rotation.y=Math.PI;f.name='Town hall flag';group.add(f);};
 flag(8.2,(cx2,w0,h0)=>{cx2.fillStyle='#f4f1ea';cx2.fillRect(0,0,w0,h0);cx2.fillStyle='#c8102e';cx2.beginPath();cx2.arc(w0/2,h0/2,h0*.3,0,Math.PI*2);cx2.fill();});
 flag(7.1,(cx2,w0,h0)=>{cx2.fillStyle='#2f6f9f';cx2.fillRect(0,0,w0,h0);cx2.fillStyle='#f4f1ea';cx2.font=`bold 50px ${SERIF}`;cx2.textAlign='center';cx2.textBaseline='middle';cx2.fillText(japaneseSign("Minato"),w0/2,h0/2);});
}

/**
 * The town hall itself: one storey of painted concrete on a plinth, twenty-five metres
 * along the forecourt, the way island village offices were built in the seventies and
 * eighties. A deep veranda runs the length of the front under the roof slab, on the old
 * column lines. Seven bays along it: store, the glass-doored entrance, the classroom,
 * the community kitchen, the meeting room, the clinic and the doctor's flat at
 * the east end, each with its own door or windows. The parapet carries the name and a
 * clock; on the roof, two water tanks and an aerial. Also the yard furniture the old
 * model carried: the gateposts and their shisa, the bike shed, the wash taps and the
 * flagpole with its horn speakers.
 */
/**
 * The town hall's bicycle shed holds four: the town office's, the teacher's and two pupils'. Side by side between the
 * corner posts, a hand apart, each in its own collider.
 */
const SCHOOL_BICYCLES=Object.freeze([
 Object.freeze({id:'town-office-bicycle',x:34.57,colour:0xe8e2d0,owner:'Minato Town Office',why:'The office’s errand bicycle: forms to Ms Ganaha’s counter at the terminal and the harbour office, the minutes to whoever missed the meeting.'}),
 Object.freeze({id:'teacher-bicycle',x:35.28,colour:0x3f7fc0,frame:'step',owner:'Miss Higa',why:'Miss Higa rides up from the Higa house for the eight o’clock bell, and on to the bandai at Umi-no-yu after school.'}),
 Object.freeze({id:'pupil-bicycle-1',x:35.92,colour:0x6ea05a,size:.8,basket:false,owner:'a pupil from Shiroma',why:'One of the eight pupils’, with the name written on the mudguard in marker; it comes the long way round from Shiroma.'}),
 Object.freeze({id:'pupil-bicycle-2',x:36.5,colour:0xc8432f,size:.8,basket:false,owner:'a pupil from the Kitano Road houses',why:'Another pupil’s, a hand-me-down, its name crossed out and written again.'}),
]);

function buildTownHall(group,options){
 const kit=createKit({shadows:options.shadows}),bikes=[];
 const z0=SCHOOL.corridor.minZ,zf=B.minZ,zb=B.maxZ,H=B.storey,top=B.roof;
 const trim=0x2f5f6a,slab=0xd8d2c2,alu=0xb8bec0,glass=0x5d7a84,plinth=0xa9aa9c,steel=0x8e979a;
 const door=(cx,w,c=trim)=>{kit.box(w+.16,2.25,.05,cx,1.27,zf-.03,alu,{finish:'metal'});kit.box(w,2.1,.05,cx,1.2,zf-.05,c);};
 const window=(cx,w,y=1.65,h=1.3)=>{kit.box(w+.12,h+.12,.05,cx,y,zf-.03,alu,{finish:'metal'});kit.box(w,h,.05,cx,y,zf-.05,glass,{finish:'window'});kit.box(.04,h,.06,cx,y,zf-.07,alu,{finish:'metal'});kit.box(w+.2,.07,.2,cx,y-h/2-.06,zf-.1,slab);};
 // What each front carries, west to east (the doors where they always were: the rooms and the routines are unchanged).
 const FRONTS={
  school:()=>{window(15.43,1.4);window(17.13,1.4);
   // The entrance: glass double doors and fixed glass either side.
   for(const dx of [-.5,.5])kit.box(.95,2.3,.05,SCHOOL.genkan.x+dx,1.3,zf-.05,glass,{finish:'window'});
   kit.box(2.2,.08,.08,SCHOOL.genkan.x,2.47,zf-.06,alu,{finish:'metal'});kit.box(.06,2.3,.08,SCHOOL.genkan.x,1.3,zf-.07,alu,{finish:'metal'});
   window(18.6,.8,1.5,1.9);window(22.35,.9);window(23.35,.6);},
  'community-hall':()=>{door(27.0,.95);window(25.95,.6);window(28.1,.7);door(30.6,.95);window(29.5,.7);},
  clinic:()=>{door(34.1,.95,0xf2f0ea);window(35.2,.7);door(37.7,.95,0x8a5a36);window(36.6,.7);window(38.8,.7);},
 };
 for(const b of TOWN_HALL_BUILDINGS){
  const x0=b.minX,x1=b.maxX,wall=b.wall;
  kit.block(x0-.1,x1+.1,0,.3,zf-.05,zb+.1,plinth);
  kit.block(x0,x1,.3,H,zf,zb,wall);
  // Veranda floor, the roof slab over building and veranda, the parapet ring.
  kit.block(x0,x1,0,.15,z0,zf,0xc9c3b4);
  kit.block(x0-.3,x1+.3,H,top,z0-.3,zb+.2,slab);
  for(const [a0,a1,c0,c1] of [[x0-.3,x1+.3,z0-.3,z0-.15],[x0-.3,x1+.3,zb+.05,zb+.2],[x0-.3,x0-.15,z0-.3,zb+.2],[x1+.15,x1+.3,z0-.3,zb+.2]])kit.block(a0,a1,top,B.parapet,c0,c1,wall);
  kit.block(x0-.34,x1+.34,B.parapet,B.parapet+.07,z0-.34,z0-.12,trim);
  kit.block(x0-.31,x1+.31,top-.35,top-.12,z0-.32,z0-.29,trim);
  // Veranda columns at its corners and bays.
  // The end columns stand 3 cm in from the veranda floor's ends, so their faces never lie in its end faces.
  for(const x of b.columns)kit.box(.34,H,.34,Math.min(x1-.2,Math.max(x0+.2,x)),H/2,z0+.2,wall);
  FRONTS[b.id]();
  // The back: plain windows, with the mould band under the slab; the ends onto the passages carry one window each.
  for(let x=x0+1.2;x<x1-.9;x+=2.4){kit.box(1.4,1.1,.05,x,1.7,zb+.03,glass,{finish:'window'});kit.box(1.5,1.2,.04,x,1.7,zb+.02,alu,{finish:'metal'});}
  kit.box(x1-x0,.3,.02,(x0+x1)/2,H-.2,zb+.04,0xbdb4a2);
  for(const [x,s] of [[x0,-1],[x1,1]]){kit.box(.05,1.1,1.2,x+s*.03,1.7,(zf+zb)/2,glass,{finish:'window'});kit.box(.04,1.2,1.3,x+s*.02,1.7,(zf+zb)/2,alu,{finish:'metal'});}
 }
 // The clock face on the school's parapet (its hands are clockHands).
 kit.cyl(.42,.42,.06,SCHOOL.genkan.x-4.5,3.75,z0-.34,0xf6f3ea,{rx:Math.PI/2,segments:24});
 // Roofs: a water tank on the school and one on the clinic, the clinic's aerial.
 const [school,,clinic]=TOWN_HALL_BUILDINGS;
 for(const x of [school.minX+4,clinic.maxX-2.5]){for(const [dx,dz] of [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]])kit.box(.07,.8,.07,x+dx,top+.4,(zf+zb)/2+dz,steel);kit.box(1.2,.08,1.2,x,top+.84,(zf+zb)/2,steel);kit.cyl(.62,.62,1.3,x,top+1.53,(zf+zb)/2,0x2b2d2f,{segments:14,finish:'gloss'});}
 kit.rod([clinic.maxX-1,top,zb-1],[clinic.maxX-1,top+3,zb-1],.03,steel);
 // The gateposts with their shisa.
 const g=SCHOOL.gate;
 for(const s of [-1,1]){kit.box(.6,1.6,.6,g.x+s*g.half,.8,g.z,0xdcd6c6);kit.box(.7,.1,.7,g.x+s*g.half,1.65,g.z,slab);shisa(kit,g.x+s*g.half,1.7,g.z,Math.PI,.8);}
 // The bike shed: a zinc roof on steel posts over a concrete pad.
 const bs=SCHOOL.bikeShed;
 for(const x of [bs.minX+.2,bs.maxX-.2])for(const z of [bs.minZ+1.1,bs.maxZ-.2])kit.box(.08,2.2,.08,x,1.1,z,steel);
 kit.box(bs.maxX-bs.minX+.3,.06,bs.maxZ-bs.minZ-.4,(bs.minX+bs.maxX)/2,2.25,(bs.minZ+bs.maxZ)/2+.5,0x8a9aa0,{rx:.08});
 // Four bicycles under it, nose to the back wall, between the posts (SCHOOL_BICYCLES); their colliders join the
 // campus's in buildSchool.
 // They stand on the shed's pad, flush with the yard (ground-plan-quarters.js TOWN_HALL_GROUND: 4 cm).
 kit.at(0,0,0,()=>{for(const b of SCHOOL_BICYCLES)bikes.push(bicycle(kit,b.x,(bs.minZ+bs.maxZ)/2+.5,{ry:-Math.PI/2,...b}));},GROUND_LAYER.lane);
 // The wash taps: a concrete trough with a row of brass taps.
 const w=SCHOOL.wash;kit.box(w.w,.75,w.d,w.x,.375,w.z,0xc9c3b4);kit.box(w.w-.1,.06,w.d-.1,w.x,.76,w.z,0x8a9a9a);
 for(let i=0;i<5;i++)kit.cyl(.03,.03,.25,w.x-w.w/2+.35+i*.53,.95,w.z+.25,0xc9a64a,{segments:6});
 // The flagpole and its horn speakers.
 const fp=SCHOOL.flagpole;kit.cyl(.3,.25,.25,fp.x,.125,fp.z,0xc9c3b4,{segments:12});kit.cyl(.055,.055,8.6,fp.x,4.5,fp.z,steel,{segments:8});
 for(const a of [-1,1]){kit.rod([fp.x,6.8,fp.z],[fp.x+a*.35,6.6,fp.z-.35],.03,steel);kit.cyl(.08,.26,.5,fp.x+a*.45,6.55,fp.z-.45,0x9aa3a6,{rx:-1.1,segments:10});}
 kit.finish(group,'Town hall building');
 return bikes;
}

export function buildSchool(world,options){
 const group=new THREE.Group();group.name='Minato school';world.group.add(group);
 world.colliders.push(...schoolColliders());
 buildYard(group);
 const hana=hanaBlockMaterial();
 // Everything fixed to the block or the gateposts goes up with them when the model
 // arrives: before that it would be hanging in the air where the building will be.
 const onBuilding=new THREE.Group();onBuilding.name='Minato school fittings';
 world.colliders.push(...buildTownHall(group,options));
 // The boundary wall against the headland, and the wall of the bike shed's end.
 hanaScreen(group,hana,SCHOOL.westWall,0,.3,1.7,[SCHOOL.minZ,SCHOOL.seawall.south],false,'School boundary wall');
 {const base=new THREE.Mesh(new THREE.BoxGeometry(.2,.3,SCHOOL.seawall.south-SCHOOL.minZ),new THREE.MeshStandardMaterial({color:0xbdb8a9,roughness:.95}));
  base.position.set(SCHOOL.westWall,.15,(SCHOOL.minZ+SCHOOL.seawall.south)/2);base.receiveShadow=true;group.add(base);}
 world.colliders.push({id:'school-boundary-wall',x:SCHOOL.westWall,z:(SCHOOL.minZ+SCHOOL.seawall.south)/2,w:.3,d:SCHOOL.seawall.south-SCHOOL.minZ,height:1.8});
 // The power house's compound: a hana-block fence round the house, its apron and the day tank, the gate at the doors
 // (school-layout.js powerHouse.compound; its colliders are in schoolColliders()).
 {const k=SCHOOL.powerHouse.compound,ph=SCHOOL.powerHouse,h=k.height;
  // Drawn 4 cm inside the compound's line, so the screens never lie in the plane of the edging laid along it.
  const I=.04;
  hanaScreen(group,hana,k.minX+I,0,0,h,[k.minZ,k.maxZ-I],false,'Power compound fence');
  hanaScreen(group,hana,k.minX+I,k.maxX-I,0,h,k.maxZ-I,true,'Power compound fence');
  hanaScreen(group,hana,k.minX+I,ph.minX,0,h,k.minZ+I,true,'Power compound fence');hanaScreen(group,hana,ph.maxX,k.maxX-I,0,h,k.minZ+I,true,'Power compound fence');
  hanaScreen(group,hana,k.maxX-I,0,0,h,[k.minZ+I,k.gate[0]],false,'Power compound fence');hanaScreen(group,hana,k.maxX-I,0,0,h,[k.gate[1],k.maxZ-I],false,'Power compound fence');}
 buildFukugi(group,options.shadows);
 buildTownHallDressing(group,options);

 // Lettering.
 // The gate is the campus's: the school's plate on one post, the Community Hall's on the other.
 plate(onBuilding,"Minato Elementary School",{w:.42,h:1.18,at:[SCHOOL.gate.x-SCHOOL.gate.half,.88,SCHOOL.gate.z-.31],rotY:Math.PI,vertical:true,bg:'#e9dfc5',fg:'#1b1b1b',size:.62,name:'School gate plate'});
 plate(onBuilding,"Minato Community Hall",{w:.42,h:1.18,at:[SCHOOL.gate.x+SCHOOL.gate.half,.88,SCHOOL.gate.z-.31],rotY:Math.PI,vertical:true,bg:'#e9dfc5',fg:'#1b1b1b',size:.62,name:'Community Hall gate plate'});
 // Each building's name on its own parapet. On the school's, the old 港小中学校 shows through the paint under the new
 // name: the junior high closed in 1989, and nobody repainted the parapet properly (a story the town tells).
 for(const b of TOWN_HALL_BUILDINGS){
  const cx=b.id==='school'?(SCHOOL.genkan.x+b.maxX)/2+.4:(b.minX+b.maxX)/2,w=Math.min(b.maxX-b.minX-.8,4.2);
  if(b.id!=='school'){plate(onBuilding,b.sign,{w,h:.5,at:[cx,3.75,SCHOOL.corridor.minZ-.36],rotY:Math.PI,bg:'#e4e1d3',fg:'#2d5a4c',size:.78,name:b.name+' name on parapet'});continue;}
  // One board: the old name in the paint's ghost, the new one lettered over it.
  const ghost=japaneseSign("Minato Elementary and Junior High School"),now=japaneseSign(b.sign),px=256,cw=Math.round(w*px),ch=Math.round(.5*px);
  const map=canvasTexture(cw,ch,ctx=>{ctx.fillStyle='#e4e1d3';ctx.fillRect(0,0,cw,ch);ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.font=`bold ${ch*.78}px ${SERIF}`;ctx.fillStyle='rgba(120,110,90,.16)';ctx.fillText(ghost,cw/2,ch*.54,cw*.94);
   ctx.fillStyle='#2d5a4c';ctx.fillText(now,cw/2,ch*.54,cw*.8);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,.5),new THREE.MeshStandardMaterial({map,roughness:.8}));m.position.set(cx,3.75,SCHOOL.corridor.minZ-.36);m.rotation.y=Math.PI;m.name=b.name+' name on parapet';onBuilding.add(m);
 }
 plate(onBuilding,"Entrance",{w:1.2,h:.3,at:[SCHOOL.genkan.x,2.62,B.minZ-.13],rotY:Math.PI,bg:'#e4e1d3',fg:'#2b2b2b',font:GOTHIC,size:.72,name:'Entrance plate'});
 ROOMS.forEach(([down,up],i)=>{
  const x=SCHOOL_COLUMNS[i]+.8;
  for(const [text,y] of [[down,2.55]]){
   if(text==="Entrance")continue;
   plate(onBuilding,text,{w:.62,h:.2,at:[x,y,B.minZ-.55],rotY:Math.PI/2,bg:'#f3f0e4',fg:'#23302a',font:GOTHIC,size:.66,name:'Room plate '+text});
   plate(onBuilding,text,{w:.62,h:.2,at:[x,y,B.minZ-.55],rotY:-Math.PI/2,bg:'#f3f0e4',fg:'#23302a',font:GOTHIC,size:.66,name:'Room plate '+text});
  }
 });
 const board=noticeboard(onBuilding);
 const setClock=clockHands(onBuilding);

 // Prompts.
 const anchor=(at,label,fn)=>{const o=new THREE.Object3D();o.position.set(...at);group.add(o);options.register?.(o,label,fn);return o;};
 const say=(title,text)=>()=>options.onAction?.('inspect',title,text);
 options.register?.(board,'Read the noticeboard',()=>options.onAction?.('read','School noticeboard',
  "Pinned in the entrance of the town hall, one over another: Typhoon shelter -- in a typhoon, the school gym and the community hall are the shelters, check your emergency bag. Port Safety -- do not play on the quay or the tetrapods. From the fishing co-op, the youth section is taking crews for the harbour boat race (Harbour Boat Race) on the fourth day of the fifth month. A felt-pen map of the town with the shelters in red. This month's kyūshoku: goya champuru, sōki-jiru, fried aji. Lost: one blue sandal, left foot."));
 anchor([SCHOOL.gate.x-SCHOOL.gate.half,1.9,SCHOOL.gate.z-.9],'Greet the shisa',say('Shisa on the gateposts',
  'A pair of glazed shisa, one on each post: the one on the right with its mouth open to take in good fortune, the one on the left with its mouth shut to keep it. Somebody has put a hibiscus flower behind the left one\'s ear.'));
 anchor([SCHOOL.gate.x-SCHOOL.gate.half,1,SCHOOL.gate.z-.7],'Read the gate plates',say("Minato Elementary School · Minato Community Hall",
  'One gate for three buildings in a row on the old school\'s footprint: the island school with its clock (the 5th and 6th years together), the Community Hall with its kitchen, the town\'s register and the meeting room, and the clinic with the doctor\'s flat at the east end. Narrow passages run between them to the lane behind.'));
 anchor([SCHOOL.wash.x,1,SCHOOL.wash.z-.8],'Rinse your feet at the taps',()=>options.onAction?.('school-taps'));
 anchor([(SCHOOL.bikeShed.minX+SCHOOL.bikeShed.maxX)/2,1,SCHOOL.bikeShed.minZ+.4],'Look at the bicycles',say('Bike shed',
  'Bicycles under a zinc roof rusted through at the ribs: the town office\'s errand bicycle, Miss Higa\'s, and two pupils\' with their names in marker on the mudguards.'));
 anchor([SCHOOL.powerHouse.door[0]+.4,1.2,SCHOOL.powerHouse.door[1]],'Look in at the generators',say("Minato power station",
  'Through the open steel doors: two diesel generator sets, green and yellow, each as long as a kei truck, one thudding, one resting. A switchboard of black dials and red lamps runs along the back wall; the needles sit on 6,600 volts and 60 cycles. Every light on the island comes out of this room. The day tank outside is filled from the oil jetty when the tanker is in. Tetsuo, who keeps the switchboard now, keeps the logbook on a clipboard by the door.'));
 anchor([15,1,29.1],'Read the monument',say("Minato Town Hall · Community Centre",
  "Minato Town Hall and Community Centre. Polished granite, the characters cut and filled with gold that has mostly worn away. Underneath, smaller: 1971 Constructed as an elementary and junior high school · 1989 Opened as a town hall (built as the school, 1971; opened as the town hall, 1989)."));
 // At the end of the passage between the school and the Community Hall, where it comes out on Kitahama's north lane.
 anchor([(TOWN_HALL_PASSAGES[0].minX+TOWN_HALL_PASSAGES[0].maxX)/2,1,SCHOOL.building.maxZ-.6],'Look along the back lane',say('Kitahama north lane',
  'The passage between the school and the Community Hall comes out on the lane behind them, the short way to Kitahama: the pupils from the Kitahama houses come in this way, and the women\'s association carries the big pots out this way on a Saturday.'));
 anchor([SCHOOL.flagpole.x,1.1,SCHOOL.flagpole.z-.6],'Listen to the speakers',say('Horn speakers',
  "Two grey horns on the flagpole and two on the tower: the town's Disaster prevention radio, the disaster radio. The chime comes out of them at 8:25, noon, 12:20, 15:30 and 17:00 -- the Westminster quarters, a little slow and a little flat, heard all over the harbour -- and typhoon warnings when there are any."));

 // The door. The school keeps a site like any building in town, so the map, the
 // directory and the doorway carry you in and out the way they do everywhere else.
 const door=[SCHOOL.genkan.x,0,B.minZ-.7];
 const site={id:'school',title:'Minato Elementary School',jp:"School · Classroom",sub:"Years 5–6",x:SCHOOL.genkan.x,z:B.minZ-.7,color:0x587a6a,accent:'#2d5a4c',
  line:'Lessons 8:30–15:30 · kyūshoku 12:20 · visitors sign in at the staff room',door,exitPosition:[SCHOOL.genkan.x,0,B.minZ-1.4],
  approachPosition:[SCHOOL.genkan.x,0,B.minZ-1.4],entryFacing:Math.PI,opens:'07:30'};
 options.sites.push(site);
 anchor([SCHOOL.genkan.x,1.2,B.minZ-.5],'Go in to the classroom',()=>options.enter(site));
 // The community kitchen and the clinic: more doors along the field face, each its own room (interiors/town-hall.js), the
 // way every door in town is its own site. (The mayor's home was the east wing until batch 7a, and the mayor's office the
 // bay between them until October 2026: Johansson lives on Kitano-jima, and the office is his study there.)
 for(const [id,title,jp,sub,x,label,line] of [
  // The Community Hall's door is the kitchen's: the register (sign it yourself; nobody keeps the counter) and the request
  // box are inside it (interiors/town-hall.js), as is the way through to the meeting room.
  ['community-kitchen','Community Hall',"Community Hall · Kitchen",'KITCHEN · REGISTER · MEETING ROOM',27.0,'Go into the Community Hall','Open to every household · the register is self-service · the women’s association on Saturdays'],
  ['clinic','Minato Clinic',"Clinic",'DR NHUNG',34.1,'Go into the clinic','Mon–Fri 9–12, 14–17 · Sat 9–12 · ring the bell after hours'],
 ]){
  const at=[x,0,B.minZ-.7],s={id,title,jp,sub,x,z:B.minZ-.7,color:0x587a6a,accent:'#2d5a4c',line,door:at,exitPosition:[x,0,B.minZ-1.4],approachPosition:[x,0,B.minZ-1.4],entryFacing:Math.PI,opens:'00:00'};
  options.sites.push(s);
  plate(onBuilding,jp,{w:.9,h:.26,at:[x,2.45,B.minZ-.13],rotY:Math.PI,bg:'#e4e1d3',fg:'#2b2b2b',font:GOTHIC,size:.72,name:'Door plate '+jp});
  anchor([x,1.2,B.minZ-.5],label,()=>options.enter(s));
 }

 group.add(onBuilding);

 let lastMinute=null;
 function tick(time,minutes,listener){
  setClock(minutes);
  const m=Math.floor(((minutes%1440)+1440)%1440);
  if(lastMinute!==null&&m!==lastMinute&&CHIME_TIMES.includes(m)){
   // Heard over the whole harbour end of town, louder the nearer you are.
   const d=listener?Math.hypot(listener.x-SCHOOL.flagpole.x,listener.z-SCHOOL.flagpole.z):0;
   if(d<110)playSchoolChime(Math.max(.15,1-d/110));
  }
  lastMinute=m;
 }
 return {group,site,tick,get model(){return model;}};
}
