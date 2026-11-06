import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {getPosterMaterial,POSTER_SPECS} from './store-advertising.js';

/**
 * Three pieces of dressing for Sakura Shōten, each measured against the supplied model.
 *
 *  - The medicine shelf behind the till. Thuan holds a 特例販売業 licence -- the permit
 *    a shop could get to sell household medicines where there was no pharmacy, which on
 *    this headland there is not -- so the four empty boards behind the counter carry
 *    cold granules, painkillers, stomach medicine, eye drops, plasters, compresses,
 *    mosquito coils and a row of brown-bottle stamina drinks. Customers ask; she reaches.
 *  - The posters, on the shop's own walls instead of stuck across its windows.
 *  - Paper decorations hanging in the front windows, changed with the season by the real
 *    calendar: sakura in April, carp streamers in May, teru-teru bōzu in the rains,
 *    tanabata strips and wind chimes in summer, moon-viewing rabbits in September, maple
 *    and persimmons in autumn, stars and snowflakes in December, and New Year in January.
 */
const GOTHIC='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';
const SERIF='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';
function canvasTexture(width,height,draw){
 const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'),width,height);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}

// ================================================================== the medicine shelf
/** The boards behind the counter (sakura-shell.js builds them to these measurements). */
export const MEDICINE_SHELF=Object.freeze({front:6.50,back:6.70,levels:Object.freeze([1.1,1.385,1.669,1.954]),minZ:.75,maxZ:3.25});

/**
 * What is on it. Fictional brands of the period, drawn as their boxes; prices are what
 * the same kind of thing cost over a Japanese counter in 1997, tax included.
 */
export const MEDICINES=Object.freeze([
 {id:'kaze',jp:"Minato cold medicine",sub:"Comprehensive cold medicine Granules",en:'Minato cold granules',price:1380,size:[.09,.13,.045],bg:'#f7f4ec',band:'#c8312c',ink:'#1d2a55',side:'#f2eee2'},
 {id:'itami',jp:"Itaminon",sub:"Antipyretic analgesic 20Lock",en:'Itaminon pain tablets',price:880,size:[.08,.11,.035],bg:'#f6d24a',band:'#2d5aa6',ink:'#1b1b1b',side:'#f0c83a'},
 {id:'ichou',jp:"Shiokaze gastrointestinal medicine",sub:"Eating too much/leaning back",en:'Shiokaze stomach medicine',price:1100,size:[.1,.12,.045],bg:'#3f8a5e',band:'#f4efe0',ink:'#ffffff',side:'#377a53'},
 {id:'megusuri',jp:"Eye Cool",sub:"Eye drops 15ml",en:'Eye Cool eye drops',price:480,size:[.05,.09,.03],bg:'#8ed0ea',band:'#1e6ea8',ink:'#0f3355',side:'#7fc4df'},
 {id:'nodo',jp:"Island lemon throat candy",sub:"Throat candy",en:'Island-lemon throat sweets',price:150,size:[.1,.13,.03],bg:'#f39a2e',band:'#fff3c2',ink:'#6b2a0c',side:'#e98c22'},
 {id:'bansoko',jp:"Kizuban",sub:"First aid bandage 30pieces",en:'Kizuban plasters',price:350,size:[.09,.07,.035],bg:'#f2a6b4',band:'#ffffff',ink:'#7a1f33',side:'#eb97a7'},
 {id:'shippu',jp:"Hiyatsu poultice",sub:"Stiff shoulders/back pain",en:'Hiyatto cooling compresses',price:980,size:[.12,.16,.03],bg:'#ffffff',band:'#2f6fb6',ink:'#123b75',side:'#e8eef6'},
 {id:'katori',jp:"Mosquito coil",sub:"Swirl 10Volume",en:'Mosquito coils',price:320,size:[.15,.15,.1],bg:'#2e7a3c',band:'#d7342a',ink:'#fff7d6',side:'#276a33'},
 {id:'mushi',jp:"Insect spray",sub:"Beware of jellyfish",en:'Insect repellent',price:640,size:[.07,.16,.05],bg:'#a8d94a',band:'#1f5a2c',ink:'#16361b',side:'#99c93e'},
 {id:'ugai',jp:"Mouthwash",sub:"Throat sterilization",en:'Throat gargle',price:720,size:[.07,.15,.05],bg:'#8a4a1c',band:'#f5e2b4',ink:'#fff4dc',side:'#7a4018'},
 {id:'vitamin',jp:"VitaminC 1000",sub:"60grain",en:'Vitamin C tablets',price:900,size:[.08,.12,.05],bg:'#ffb21f',band:'#e2442b',ink:'#ffffff',side:'#f5a414'},
 {id:'taionkei',jp:"Thermometer",sub:"Electronic thermometer",en:'Digital thermometer',price:1800,size:[.05,.17,.03],bg:'#ffffff',band:'#1c3a78',ink:'#1c3a78',side:'#eef1f6'},
 {id:'houtai',jp:"Bandage",sub:"Stretching 5cm",en:'Bandage roll',price:280,size:[.07,.07,.07],bg:'#e9eef0',band:'#3c8a9c',ink:'#1d4550',side:'#dde4e6'},
 {id:'menbou',jp:"Cotton swab",sub:"200items",en:'Cotton buds',price:180,size:[.09,.1,.09],bg:'#bfe6f5',band:'#ffffff',ink:'#1e5b76',side:'#aedcef'},
 {id:'drink10',jp:"HarborD",sub:"10Book pack",en:'Harbour-D stamina drink, 10 pack',price:1500,size:[.14,.13,.1],bg:'#6a2f14',band:'#f2c230',ink:'#fff3c8',side:'#5c2911'},
]);
const byId=new Map(MEDICINES.map(m=>[m.id,m]));
/** The single bottle, sold one at a time from the row on the drinks board. */
export const STAMINA_DRINK=Object.freeze({id:'drink',jp:"HarborD",en:'Harbour-D stamina drink',price:150});

/** Board by board, bottom to top: which boxes, and how many facings of each. */
const PLANOGRAM=[
 [['megusuri',4],['bansoko',3],['houtai',3],['nodo',4],['menbou',2],['mushi',3],['megusuri',3]],
 [['kaze',5],['itami',5],['ichou',4],['ugai',3],['nodo',3]],
 [['bottles',30],['vitamin',5],['drink10',4]],
 [['katori',5],['shippu',6],['taionkei',4],['katori',2],['houtai',2]],
];

const CELL=256,ATLAS_COLS=4;
/** One box face per atlas cell; the bottom strip of each cell is the box's plain side colour. */
function medicineAtlas(){
 const rows=Math.ceil(MEDICINES.length/ATLAS_COLS);
 return canvasTexture(CELL*ATLAS_COLS,CELL*rows,(ctx)=>{
  MEDICINES.forEach((m,i)=>{
   const x0=(i%ATLAS_COLS)*CELL,y0=Math.floor(i/ATLAS_COLS)*CELL,W=CELL,H=CELL-24;
   ctx.save();ctx.translate(x0,y0);
   ctx.fillStyle=m.bg;ctx.fillRect(0,0,W,H);
   // A diagonal band, the device every box on a Japanese medicine shelf seems to share.
   ctx.fillStyle=m.band;ctx.beginPath();ctx.moveTo(0,H*.62);ctx.lineTo(W,H*.42);ctx.lineTo(W,H*.56);ctx.lineTo(0,H*.76);ctx.fill();
   ctx.fillStyle=m.ink;ctx.textAlign='center';ctx.textBaseline='middle';
   const tall=m.size[1]/m.size[0]>1.6;
   if(tall){const chars=[...m.jp].slice(0,7),s=Math.min(52,H*.62/chars.length);ctx.font=`bold ${s}px ${GOTHIC}`;chars.forEach((c,k)=>ctx.fillText(c,W/2,H*.08+s*(k+.6)));}
   else{let s=64;ctx.font=`bold ${s}px ${GOTHIC}`;while(ctx.measureText(m.jp).width>W*.9&&s>20){s-=2;ctx.font=`bold ${s}px ${GOTHIC}`;}ctx.fillText(m.jp,W/2,H*.28);}
   ctx.font=`bold 22px ${GOTHIC}`;ctx.fillStyle=m.ink;ctx.fillText(m.sub,W/2,H*.88,W*.9);
   // The regulatory mark: 第2類医薬品 did not exist until 2009; in 1997 the box said 医薬品.
   ctx.strokeStyle=m.ink;ctx.lineWidth=3;ctx.strokeRect(W*.06,H*.05,64,26);ctx.font=`bold 16px ${GOTHIC}`;ctx.fillText("Pharmaceuticals",W*.06+32,H*.05+14);
   ctx.fillStyle=m.side;ctx.fillRect(0,H,W,24);
   ctx.restore();
  });
 });
}

function boxWithArt(m,index,rows){
 const [w,h,d]=m.size;
 // Width along z, height up, depth along x; the face toward the counter is -x.
 const g=new THREE.BoxGeometry(d,h,w);
 const uv=g.attributes.uv,col=index%ATLAS_COLS,row=Math.floor(index/ATLAS_COLS);
 const u0=col/ATLAS_COLS,u1=(col+1)/ATLAS_COLS,vTop=1-row/rows,vArt=1-(row+(CELL-24)/CELL)/rows,vSide=1-(row+(CELL-12)/CELL)/rows;
 for(let face=0;face<6;face++)for(let k=0;k<4;k++){
  const i=face*4+k,su=uv.getX(i),sv=uv.getY(i);
  if(face===1)uv.setXY(i,u0+(u1-u0)*su,vArt+(vTop-vArt)*sv);
  else uv.setXY(i,u0+(u1-u0)*.5,vSide);
 }
 return g;
}

export function buildMedicineShelf(room){
 const S=MEDICINE_SHELF,rows=Math.ceil(MEDICINES.length/ATLAS_COLS);
 const atlas=medicineAtlas(),pieces=[],bottles=[];
 PLANOGRAM.forEach((board,level)=>{
  const y=S.levels[level]+.002;
  const width=board.reduce((sum,[id,n])=>sum+(id==='bottles'?.042:(byId.get(id).size[0]+.006))*n,0);
  let z=S.minZ+Math.max(0,(S.maxZ-S.minZ-width)/2);
  for(const [id,n] of board)for(let k=0;k<n;k++){
   if(id==='bottles'){bottles.push([S.front+.03,y,z+.021]);z+=.042;continue;}
   const m=byId.get(id),[w,h,d]=m.size,g=boxWithArt(m,MEDICINES.indexOf(m),rows);
   // Stacked two deep where the board is deep enough, the front one a hair proud.
   for(const [depth,lean] of [[0,0],[d+.004,.0]]){
    if(S.front+depth+d>S.back+.01)continue;
    const piece=g.clone();piece.translate(S.front+depth+d/2,y+h/2,z+w/2);pieces.push(piece);
   }
   g.dispose();z+=w+.006;
  }
 });
 const geometry=mergeGeometries(pieces,false);pieces.forEach(p=>p.dispose());
 const boxes=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:atlas,roughness:.6}));
 boxes.name='Sakura medicine shelf';boxes.userData.sharedAsset=true;boxes.receiveShadow=true;room.add(boxes);
 // Brown glass stamina drinks, a yellow label round each.
 const glass=new THREE.InstancedMesh(new THREE.CylinderGeometry(.019,.02,.105,12),new THREE.MeshStandardMaterial({color:0x4a1f0a,roughness:.15,metalness:.1}),bottles.length);
 const neck=new THREE.InstancedMesh(new THREE.CylinderGeometry(.009,.016,.035,10),new THREE.MeshStandardMaterial({color:0x4a1f0a,roughness:.15}),bottles.length);
 const cap=new THREE.InstancedMesh(new THREE.CylinderGeometry(.011,.011,.012,10),new THREE.MeshStandardMaterial({color:0xd8b43a,roughness:.35,metalness:.6}),bottles.length);
 const label=new THREE.InstancedMesh(new THREE.CylinderGeometry(.0205,.0205,.05,12,1,true),new THREE.MeshStandardMaterial({color:0xf2c230,roughness:.5}),bottles.length);
 const dummy=new THREE.Object3D();
 bottles.forEach(([x,y,z],i)=>{
  for(const [mesh,dy] of [[glass,.0525],[neck,.122],[cap,.145],[label,.05]]){dummy.position.set(x,y+dy,z);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
 });
 for(const mesh of [glass,neck,cap,label]){mesh.name='Sakura stamina drinks';mesh.userData.sharedAsset=true;room.add(mesh);}
 // The header over it, and the licence that lets her sell any of it.
 const header=canvasTexture(640,90,(ctx,w,h)=>{ctx.fillStyle='#1f5a8c';ctx.fillRect(0,0,w,h);ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold 40px ${GOTHIC}`;ctx.fillText('おくすり・日用品',w*.34,32,w*.61);ctx.font=`bold 17px ${GOTHIC}`;ctx.fillText('MEDICINE & DAILY CARE',w*.34,68,w*.61);ctx.font=`bold 22px ${GOTHIC}`;ctx.fillText('お声がけください',w*.81,32,w*.32);ctx.font=`bold 15px ${GOTHIC}`;ctx.fillText('ASK THUAN',w*.81,67,w*.32);});
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.21),new THREE.MeshStandardMaterial({map:header,roughness:.6}));
 sign.position.set(S.back-.005,2.3,1.75);sign.rotation.y=-Math.PI/2;sign.name='Medicine shelf sign';sign.userData.sharedAsset=true;room.add(sign);
 const licence=canvasTexture(300,190,(ctx,w,h)=>{ctx.fillStyle='#7a5a32';ctx.fillRect(0,0,w,h);ctx.fillStyle='#fbf7ea';ctx.fillRect(12,12,w-24,h-24);ctx.fillStyle='#222';ctx.textAlign='center';ctx.font=`bold 22px ${SERIF}`;ctx.fillText("Pharmaceutical sales business license",w/2,48);ctx.font=`15px ${SERIF}`;ctx.fillText("Special sales business",w/2,78);ctx.fillText("Sakura Shop　Thuan",w/2,104);ctx.fillText("Governor of Okinawa Prefecture",w/2,130);ctx.fillText("1 April 1997",w/2,156);ctx.fillStyle='#c0322c';ctx.beginPath();ctx.arc(w-54,146,16,0,Math.PI*2);ctx.fill();});
 const frame=new THREE.Mesh(new THREE.PlaneGeometry(.34,.215),new THREE.MeshStandardMaterial({map:licence,roughness:.5}));
 frame.position.set(S.back-.005,2.3,3.05);frame.rotation.y=-Math.PI/2;frame.name='Medicine licence';frame.userData.sharedAsset=true;room.add(frame);
 return {boxes,bottles:glass,sign,licence:frame};
}

// ================================================================== the posters
/**
 * Where the posters hang. Two on the partition over the delivery shelf, the blank wall
 * that faces you walking in; one on the side wall by the counter; and the town's own
 * poster, for the Eisa dance in August, on the back wall beside the fridges.
 */
export const WALL_POSTERS=Object.freeze([
 {id:'tea',position:[-5.72,2.3,-2.433],yaw:0,size:[.74,1.1]},
 {id:'coffee',position:[-4.62,2.3,-2.433],yaw:0,size:[.74,1.1]},
 {id:'biscuit',position:[4.57,1.82,-2.35],yaw:-Math.PI/2,size:[.94,1.41]},
 // Up and along, clear of the cash corner under it (sakura-corners.js).
 {id:'eisa',position:[-3.45,1.92,-3.94],yaw:0,size:[.74,1.04]},
 // Thuan's own sale poster, 50 × 70 cm, on the side wall by the door: the first thing you see walking in, so this week's
 // cold drinks are an impulse buy. Its top-left corner carries a "30% OFF" burst. Tetsuo (of all people) once tore that
 // corner off with a mad laugh (30 cm along the top, 40 cm down the side) and Thuan chased it back down Main Street; it is
 // taped back along the 50 cm tear: exactly the last half metre on her roll, as Johansson worked out at Sato Ramen (the
 // Pythagoras story, Johansson Shorts). The Shorts draw it here.
 {id:'sale',position:[-6.78,1.5,3.3],yaw:Math.PI/2,size:[.5,.7]},
]);
/** The sale poster: Sakura's pink band, the "30% OFF" corner burst, SALE on all drinks this week, and the strip of tape
 *  along the old tear. */
function salePoster(){
 return canvasTexture(500,700,(ctx,w,h)=>{
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.fillStyle='#f4a3bd';ctx.fillRect(0,0,w,h*.13);
  ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillStyle='#ffffff';ctx.font=`bold 32px ${GOTHIC}`;ctx.fillText('SAKURA SHŌTEN',w*.62,h*.085);
  // the corner burst
  ctx.save();ctx.translate(w*.2,h*.17);ctx.rotate(-.28);ctx.beginPath();for(let i=0;i<24;i++){const r=i%2?66:90,a=i*Math.PI/12;ctx[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();
  ctx.fillStyle='#f2b705';ctx.fill();ctx.strokeStyle='#c5281c';ctx.lineWidth=5;ctx.stroke();ctx.fillStyle='#c5281c';ctx.font=`900 44px ${GOTHIC}`;ctx.fillText('30%',0,-2);ctx.font=`900 30px ${GOTHIC}`;ctx.fillText('OFF',0,36);ctx.restore();
  ctx.fillStyle='#111111';ctx.font=`900 146px ${GOTHIC}`;ctx.fillText('SALE',w*.56,h*.5);
  ctx.fillStyle='#c5281c';ctx.font=`bold 50px ${GOTHIC}`;ctx.fillText('all drinks',w/2,h*.64);
  ctx.fillStyle='#06c755';const bw=w*.64,bh=h*.085,bx=w*.18,by=h*.76,r=bh/2;ctx.beginPath();ctx.moveTo(bx+r,by);ctx.arcTo(bx+bw,by,bx+bw,by+bh,r);ctx.arcTo(bx+bw,by+bh,bx,by+bh,r);ctx.arcTo(bx,by+bh,bx,by,r);ctx.arcTo(bx,by,bx+bw,by,r);ctx.fill();
  ctx.fillStyle='#ffffff';ctx.font=`bold 30px ${GOTHIC}`;ctx.fillText('this week only',w/2,h*.818);
  // the repaired tear: a hairline seam from 30 cm along the top to 40 cm down the side, under a strip of tape
  const A=[w*.6,0],B=[0,h*40/70];ctx.strokeStyle='rgba(60,50,40,.35)';ctx.lineWidth=2;ctx.beginPath();
  for(let i=0;i<=12;i++){const k=i/12,j=(i%2?4:-4)*(i&&i<12?1:0),len=Math.hypot(A[0],B[1]);ctx[i?'lineTo':'moveTo'](A[0]+(B[0]-A[0])*k+B[1]/len*j,A[1]+(B[1]-A[1])*k+A[0]/len*j);}
  ctx.stroke();ctx.strokeStyle='rgba(236,224,190,.88)';ctx.lineWidth=22;ctx.beginPath();ctx.moveTo(A[0]+6,-4);ctx.lineTo(-4,B[1]+6);ctx.stroke();
 });
}
/** The posters Sakura draws itself (the others come from Thuan's label atlas, store-advertising.js). */
const OWN_POSTERS={
 eisa:{texture:()=>eisaPoster(),name:'Eisa festival poster',verb:'Read the Eisa poster',title:"Sakura · Eisa poster",
  text:"The youth association’s Eisa: drummers and dancers down the harbour road on the last night of Obon, ending at the festival ground. Thuan has written \"Rest 8/17\" underneath in marker -- closed that evening, so she can go."},
 sale:{texture:()=>salePoster(),name:'Sakura sale poster',verb:'Read the sale poster',title:'Sakura · SALE poster',
  text:'All drinks 30% off this week. The "30% OFF" corner was torn off once -- by Tetsuo, of all people, laughing like a madman -- and Thuan chased it back down Main Street. The tear was exactly 50 cm, her last half metre of tape, and it is taped straight back. Nhung had hoped to sell her a new roll.'},
};
function eisaPoster(){
 return canvasTexture(512,720,(ctx,w,h)=>{
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#0f2a55');sky.addColorStop(.6,'#b8324a');sky.addColorStop(1,'#f0a33a');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(255,236,170,.9)';ctx.beginPath();ctx.arc(w*.78,h*.38,46,0,Math.PI*2);ctx.fill();
  // Three dancers with their drums, in silhouette.
  ctx.fillStyle='#14100e';
  for(const [x,s] of [[.24,1],[.5,1.15],[.76,1]]){
   const cx=w*x,base=h*.83;ctx.save();ctx.translate(cx,base);ctx.scale(s,s);
   ctx.beginPath();ctx.arc(0,-190,20,0,Math.PI*2);ctx.fill();ctx.fillRect(-18,-172,36,90);
   ctx.beginPath();ctx.moveTo(-18,-82);ctx.lineTo(-40,0);ctx.lineTo(-24,0);ctx.lineTo(0,-70);ctx.lineTo(24,0);ctx.lineTo(40,0);ctx.lineTo(18,-82);ctx.fill();
   ctx.save();ctx.translate(-34,-130);ctx.rotate(-.5);ctx.fillRect(-4,-40,8,60);ctx.restore();ctx.save();ctx.translate(34,-150);ctx.rotate(.8);ctx.fillRect(-4,-44,8,60);ctx.restore();
   ctx.fillStyle='#c8312c';ctx.beginPath();ctx.ellipse(0,-120,34,28,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#14100e';
   ctx.fillRect(-26,-220,52,10);ctx.restore();
  }
  ctx.fillStyle='#fff6dc';ctx.textAlign='center';ctx.font=`bold 96px ${SERIF}`;ctx.fillText("Eisa",w/2,150);
  ctx.font=`bold 40px ${SERIF}`;ctx.fillText("Minato Town Youth Association",w/2,215);
  ctx.fillStyle='#14100e';ctx.fillRect(0,h-78,w,78);ctx.fillStyle='#ffe9a8';ctx.font=`bold 30px ${GOTHIC}`;
  ctx.fillText("Old Obon Night of Ukui　Port Festival Plaza",w/2,h-44);ctx.font=`18px ${GOTHIC}`;ctx.fillText("1997　Sponsored Minato Town Youth Association/Fishery Cooperative",w/2,h-16);
 });
}
export function hangWallPosters(room,{anchor,action}){
 const meshes=[];
 for(const spot of WALL_POSTERS){
  const spec=POSTER_SPECS.find(p=>p.id===spot.id),own=OWN_POSTERS[spot.id];
  const material=spec?getPosterMaterial(spec):new THREE.MeshStandardMaterial({map:own.texture(),roughness:.85});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(...spot.size),material);
  mesh.position.set(...spot.position);mesh.rotation.y=spot.yaw;mesh.name=spec?spec.title:own.name;mesh.userData.sharedAsset=true;room.add(mesh);
  // Tape at the corners, because it is a poster on a wall.
  const tape=new THREE.MeshStandardMaterial({color:0xf2ecd2,roughness:.7,transparent:true,opacity:.8,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-8});
  for(const [sx,sy] of [[-1,1],[1,1],[-1,-1],[1,-1]]){
   const t=new THREE.Mesh(new THREE.PlaneGeometry(.07,.03),tape);t.position.set(sx*(spot.size[0]/2-.02),sy*(spot.size[1]/2-.01),.002);t.rotation.z=sx*sy*.6;mesh.add(t);
  }
  const normal=new THREE.Vector3(Math.sin(spot.yaw),0,Math.cos(spot.yaw));
  const at=new THREE.Vector3(...spot.position).addScaledVector(normal,.3);
  anchor([at.x,Math.min(1.8,spot.position[1]),at.z],spec?'Read '+spec.id+' poster':own.verb,()=>action('inspect',spec?spec.title:own.title,
   spec?'Thuan’s own label, printed for the shop, taped up where you see it as you walk in.':own.text));
  meshes.push(mesh);
 }
 return meshes;
}

// ================================================================== window decorations
/** Which decorations hang in which month. */
export function seasonFor(date=new Date()){
 const m=date.getMonth()+1,d=date.getDate();
 if(m===1)return {id:'new-year',title:'New Year',shapes:['kagami','ume','daruma']};
 if(m===2)return {id:'ume',title:'Plum blossom',shapes:['ume','oni','ume']};
 if(m===3)return {id:'hina',title:'Hinamatsuri',shapes:['hina','momo','sakura']};
 if(m===4)return {id:'sakura',title:'Cherry blossom',shapes:['sakura','sakura','chick']};
 if(m===5)return {id:'koinobori',title:'Children’s Day',shapes:['koi','kabuto','koi']};
 if(m===6)return {id:'tsuyu',title:'The rains',shapes:['teru','ajisai','kaeru']};
 if(m===7)return {id:'tanabata',title:'Tanabata',shapes:['tanzaku','star','furin']};
 if(m===8)return {id:'summer',title:'Summer',shapes:['furin','himawari','hanabi']};
 if(m===9)return {id:'tsukimi',title:'Moon viewing',shapes:['moon','usagi','dango']};
 if(m===10||(m===11&&d<=20))return {id:'aki',title:'Autumn',shapes:['momiji','kaki','momiji']};
 if(m===11)return {id:'aki',title:'Autumn',shapes:['momiji','kaki','donguri']};
 return {id:'winter',title:'Winter holidays',shapes:['star','snow','tree']};
}

/** Each paper shape, drawn in its cell. Symmetric where possible, as it is seen from both sides. */
const SHAPES={
 sakura:(c,s)=>{flower(c,s,5,'#f7b6c9','#e889a6','#fff1a8');},
 ume:(c,s)=>{flower(c,s,5,'#ffffff','#f3c0cd','#e3405e',true);},
 momo:(c,s)=>{flower(c,s,5,'#ff9fb8','#f07a98','#ffe37a');},
 kagami:(c,s)=>{c.fillStyle='#f7f3ea';blob(c,s*.5,s*.66,s*.36,s*.16);blob(c,s*.5,s*.5,s*.28,s*.13);c.fillStyle='#f39a2e';c.beginPath();c.arc(s*.5,s*.33,s*.12,0,Math.PI*2);c.fill();c.fillStyle='#3e8a3a';c.beginPath();c.ellipse(s*.56,s*.23,s*.07,s*.03,-.6,0,Math.PI*2);c.fill();c.fillStyle='#c8312c';c.fillRect(s*.2,s*.78,s*.6,s*.08);},
 daruma:(c,s)=>{c.fillStyle='#d7342a';blob(c,s*.5,s*.55,s*.32,s*.36);c.fillStyle='#f7ead4';blob(c,s*.5,s*.46,s*.18,s*.14);c.fillStyle='#1b1b1b';for(const x of [.43,.57]){c.beginPath();c.arc(s*x,s*.45,s*.035,0,Math.PI*2);c.fill();}c.fillStyle='#f2c230';c.fillRect(s*.36,s*.72,s*.28,s*.05);},
 oni:(c,s)=>{c.fillStyle='#e0453a';blob(c,s*.5,s*.55,s*.3,s*.3);c.fillStyle='#f2c230';for(const x of [.37,.63]){c.beginPath();c.moveTo(s*x-s*.05,s*.32);c.lineTo(s*x,s*.14);c.lineTo(s*x+s*.05,s*.32);c.fill();}c.fillStyle='#fff';for(const x of [.42,.58]){c.beginPath();c.arc(s*x,s*.5,s*.06,0,Math.PI*2);c.fill();}c.fillStyle='#1b1b1b';for(const x of [.42,.58]){c.beginPath();c.arc(s*x,s*.51,s*.03,0,Math.PI*2);c.fill();}c.fillStyle='#fff';c.beginPath();c.arc(s*.5,s*.66,s*.1,0,Math.PI);c.fill();},
 hina:(c,s)=>{for(const [x,col] of [[.32,'#3a3f8a'],[.68,'#c8312c']]){c.fillStyle=col;c.beginPath();c.moveTo(s*x,s*.36);c.lineTo(s*x-s*.17,s*.86);c.lineTo(s*x+s*.17,s*.86);c.fill();c.fillStyle='#fbf1e2';c.beginPath();c.arc(s*x,s*.3,s*.1,0,Math.PI*2);c.fill();c.fillStyle='#1b1b1b';c.beginPath();c.arc(s*x,s*.25,s*.1,Math.PI,0);c.fill();}},
 chick:(c,s)=>{c.fillStyle='#ffd83a';blob(c,s*.5,s*.56,s*.28,s*.26);blob(c,s*.5,s*.3,s*.16,s*.15);c.fillStyle='#f39a2e';c.beginPath();c.moveTo(s*.5,s*.3);c.lineTo(s*.56,s*.34);c.lineTo(s*.5,s*.37);c.fill();c.fillStyle='#1b1b1b';for(const x of [.44,.56]){c.beginPath();c.arc(s*x,s*.27,s*.02,0,Math.PI*2);c.fill();}},
 koi:(c,s)=>{const cols=['#d7342a','#2f5aa6','#1b1b1b'];for(let k=0;k<3;k++){const y=s*(.22+k*.28),col=cols[k];c.fillStyle=col;c.beginPath();c.moveTo(s*.1,y);c.quadraticCurveTo(s*.5,y-s*.12,s*.78,y);c.lineTo(s*.92,y-s*.08);c.lineTo(s*.92,y+s*.08);c.lineTo(s*.78,y);c.quadraticCurveTo(s*.5,y+s*.12,s*.1,y);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(s*.22,y-s*.01,s*.035,0,Math.PI*2);c.fill();c.fillStyle='#1b1b1b';c.beginPath();c.arc(s*.22,y-s*.01,s*.017,0,Math.PI*2);c.fill();c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=2;for(let q=0;q<4;q++){c.beginPath();c.arc(s*(.36+q*.1),y,s*.04,-.8,.8);c.stroke();}}},
 kabuto:(c,s)=>{c.fillStyle='#2f4a7a';c.beginPath();c.arc(s*.5,s*.62,s*.3,Math.PI,0);c.fill();c.fillRect(s*.16,s*.6,s*.68,s*.08);c.fillStyle='#e0b43a';c.beginPath();c.moveTo(s*.5,s*.36);c.lineTo(s*.3,s*.12);c.lineTo(s*.4,s*.4);c.moveTo(s*.5,s*.36);c.lineTo(s*.7,s*.12);c.lineTo(s*.6,s*.4);c.fill();},
 teru:(c,s)=>{c.fillStyle='#ffffff';c.beginPath();c.arc(s*.5,s*.34,s*.2,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(s*.32,s*.44);c.quadraticCurveTo(s*.5,s*.5,s*.68,s*.44);c.lineTo(s*.8,s*.86);c.lineTo(s*.2,s*.86);c.fill();c.fillStyle='#e0453a';c.fillRect(s*.34,s*.48,s*.32,s*.04);c.fillStyle='#1b1b1b';for(const x of [.44,.56]){c.beginPath();c.arc(s*x,s*.32,s*.02,0,Math.PI*2);c.fill();}c.strokeStyle='#1b1b1b';c.lineWidth=3;c.beginPath();c.arc(s*.5,s*.36,s*.06,.2,Math.PI-.2);c.stroke();},
 ajisai:(c,s)=>{for(let k=0;k<22;k++){const a=k*2.4,r=s*.06+s*.2*Math.sqrt(k/22);c.fillStyle=k%3?'#7a8fe0':'#b07ad8';c.beginPath();c.arc(s*.5+Math.cos(a)*r,s*.45+Math.sin(a)*r,s*.07,0,Math.PI*2);c.fill();}c.fillStyle='#3e8a3a';c.beginPath();c.ellipse(s*.5,s*.84,s*.14,s*.06,0,0,Math.PI*2);c.fill();},
 kaeru:(c,s)=>{c.fillStyle='#5cb85c';blob(c,s*.5,s*.56,s*.28,s*.22);for(const x of [.38,.62]){c.beginPath();c.arc(s*x,s*.36,s*.08,0,Math.PI*2);c.fill();}c.fillStyle='#fff';for(const x of [.38,.62]){c.beginPath();c.arc(s*x,s*.35,s*.05,0,Math.PI*2);c.fill();}c.fillStyle='#1b1b1b';for(const x of [.38,.62]){c.beginPath();c.arc(s*x,s*.35,s*.025,0,Math.PI*2);c.fill();}c.strokeStyle='#1b5a1b';c.lineWidth=3;c.beginPath();c.arc(s*.5,s*.56,s*.1,.3,Math.PI-.3);c.stroke();},
 tanzaku:(c,s)=>{const cols=['#e0453a','#f2c230','#5cb85c','#4a8ad8','#b07ad8'];for(let k=0;k<5;k++){c.fillStyle=cols[k];c.save();c.translate(s*(.18+k*.16),s*.12);c.rotate((k-2)*.06);c.fillRect(-s*.05,0,s*.1,s*.7);c.restore();}},
 star:(c,s)=>{c.fillStyle='#ffd83a';c.beginPath();for(let k=0;k<10;k++){const r=k%2?s*.17:s*.4,a=-Math.PI/2+k*Math.PI/5;c.lineTo(s*.5+Math.cos(a)*r,s*.52+Math.sin(a)*r);}c.fill();c.strokeStyle='#f39a2e';c.lineWidth=4;c.stroke();},
 furin:(c,s)=>{c.fillStyle='rgba(190,230,245,.95)';c.beginPath();c.arc(s*.5,s*.36,s*.2,Math.PI,0);c.lineTo(s*.7,s*.44);c.lineTo(s*.3,s*.44);c.fill();c.fillStyle='#e0453a';for(let k=0;k<3;k++){c.beginPath();c.arc(s*(.42+k*.08),s*.3,s*.025,0,Math.PI*2);c.fill();}c.fillStyle='#fff8d8';c.fillRect(s*.44,s*.48,s*.12,s*.36);c.strokeStyle='#4a8ad8';c.lineWidth=2;for(let k=0;k<3;k++){c.beginPath();c.moveTo(s*.46,s*(.56+k*.08));c.quadraticCurveTo(s*.5,s*(.53+k*.08),s*.54,s*(.56+k*.08));c.stroke();}},
 himawari:(c,s)=>{for(let k=0;k<14;k++){c.save();c.translate(s*.5,s*.5);c.rotate(k*Math.PI/7);c.fillStyle='#ffd21f';c.beginPath();c.ellipse(0,-s*.25,s*.07,s*.15,0,0,Math.PI*2);c.fill();c.restore();}c.fillStyle='#6b3a14';c.beginPath();c.arc(s*.5,s*.5,s*.15,0,Math.PI*2);c.fill();},
 hanabi:(c,s)=>{const cols=['#ff5a7a','#ffd83a','#6ad0ff'];for(let k=0;k<24;k++){const a=k*Math.PI/12;c.strokeStyle=cols[k%3];c.lineWidth=5;c.beginPath();c.moveTo(s*.5+Math.cos(a)*s*.08,s*.5+Math.sin(a)*s*.08);c.lineTo(s*.5+Math.cos(a)*s*.4,s*.5+Math.sin(a)*s*.4);c.stroke();}},
 moon:(c,s)=>{c.fillStyle='#ffe27a';c.beginPath();c.arc(s*.5,s*.5,s*.36,0,Math.PI*2);c.fill();c.fillStyle='rgba(230,190,90,.5)';for(const [x,y,r] of [[.4,.42,.06],[.6,.6,.08],[.58,.36,.04]]){c.beginPath();c.arc(s*x,s*y,s*r,0,Math.PI*2);c.fill();}},
 usagi:(c,s)=>{c.fillStyle='#ffffff';blob(c,s*.5,s*.62,s*.26,s*.2);blob(c,s*.5,s*.42,s*.16,s*.14);for(const x of [.43,.57]){c.beginPath();c.ellipse(s*x,s*.2,s*.05,s*.15,0,0,Math.PI*2);c.fill();}c.fillStyle='#f7a6b6';for(const x of [.43,.57]){c.beginPath();c.ellipse(s*x,s*.2,s*.022,s*.1,0,0,Math.PI*2);c.fill();}c.fillStyle='#e0453a';for(const x of [.45,.55]){c.beginPath();c.arc(s*x,s*.42,s*.02,0,Math.PI*2);c.fill();}},
 dango:(c,s)=>{c.strokeStyle='#8a6a3a';c.lineWidth=5;c.beginPath();c.moveTo(s*.5,s*.1);c.lineTo(s*.5,s*.9);c.stroke();for(const [y,col] of [[.28,'#f7b6c9'],[.48,'#ffffff'],[.68,'#8fcf7a']]){c.fillStyle=col;c.beginPath();c.arc(s*.5,s*y,s*.1,0,Math.PI*2);c.fill();c.strokeStyle='rgba(0,0,0,.15)';c.lineWidth=2;c.stroke();}},
 momiji:(c,s)=>{c.fillStyle='#e0452a';c.beginPath();for(let k=0;k<14;k++){const a=-Math.PI/2+(k-7)*Math.PI/8*1.1,r=k%2?s*.16:s*.4;c.lineTo(s*.5+Math.sin(a+Math.PI/2)*r,s*.5-Math.cos(a+Math.PI/2)*r*(k%2?1:.95));}c.fill();c.strokeStyle='#8a2a14';c.lineWidth=3;c.beginPath();c.moveTo(s*.5,s*.5);c.lineTo(s*.5,s*.92);c.stroke();},
 kaki:(c,s)=>{c.fillStyle='#f28a1f';blob(c,s*.5,s*.55,s*.3,s*.26);c.fillStyle='#3e7a2a';for(let k=0;k<4;k++){c.save();c.translate(s*.5,s*.32);c.rotate(k*Math.PI/2+.4);c.beginPath();c.ellipse(0,-s*.06,s*.04,s*.07,0,0,Math.PI*2);c.fill();c.restore();}},
 donguri:(c,s)=>{c.fillStyle='#b5752e';blob(c,s*.5,s*.58,s*.18,s*.24);c.fillStyle='#6b4420';c.beginPath();c.arc(s*.5,s*.4,s*.2,Math.PI,0);c.fill();},
 snow:(c,s)=>{c.strokeStyle='#ffffff';c.lineWidth=6;c.lineCap='round';for(let k=0;k<6;k++){const a=k*Math.PI/3,x=Math.cos(a),y=Math.sin(a);c.beginPath();c.moveTo(s*.5,s*.5);c.lineTo(s*.5+x*s*.38,s*.5+y*s*.38);c.stroke();for(const t of [.2,.3]){c.beginPath();c.moveTo(s*.5+x*s*t,s*.5+y*s*t);c.lineTo(s*.5+(x*Math.cos(.6)-y*Math.sin(.6))*s*(t+.08),s*.5+(x*Math.sin(.6)+y*Math.cos(.6))*s*(t+.08));c.stroke();c.beginPath();c.moveTo(s*.5+x*s*t,s*.5+y*s*t);c.lineTo(s*.5+(x*Math.cos(-.6)-y*Math.sin(-.6))*s*(t+.08),s*.5+(x*Math.sin(-.6)+y*Math.cos(-.6))*s*(t+.08));c.stroke();}}},
 tree:(c,s)=>{c.fillStyle='#2f7a3c';for(let k=0;k<3;k++){c.beginPath();c.moveTo(s*.5,s*(.12+k*.18));c.lineTo(s*(.2-k*.04),s*(.44+k*.18));c.lineTo(s*(.8+k*.04),s*(.44+k*.18));c.fill();}c.fillStyle='#6b4420';c.fillRect(s*.45,s*.8,s*.1,s*.1);const cols=['#e0453a','#ffd83a','#4a8ad8'];for(let k=0;k<7;k++){c.fillStyle=cols[k%3];c.beginPath();c.arc(s*(.35+(k*37%30)/100),s*(.3+(k*23%45)/100),s*.03,0,Math.PI*2);c.fill();}},
};
function blob(c,x,y,rx,ry){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function flower(c,s,petals,fill,edge,centre,round=false){
 for(let k=0;k<petals;k++){c.save();c.translate(s*.5,s*.5);c.rotate(k*Math.PI*2/petals);c.fillStyle=fill;c.strokeStyle=edge;c.lineWidth=3;c.beginPath();
  if(round)c.arc(0,-s*.2,s*.16,0,Math.PI*2);else{c.moveTo(0,0);c.bezierCurveTo(-s*.22,-s*.18,-s*.14,-s*.4,-s*.03,-s*.38);c.lineTo(0,-s*.33);c.lineTo(s*.03,-s*.38);c.bezierCurveTo(s*.14,-s*.4,s*.22,-s*.18,0,0);}
  c.fill();c.stroke();c.restore();}
 c.fillStyle=centre;c.beginPath();c.arc(s*.5,s*.5,s*.07,0,Math.PI*2);c.fill();
}

/** The front glazing, and the three bays either side of the door the strings hang across. */
const WINDOW=Object.freeze({z:3.8,top:2.86,bays:Object.freeze([[-6.5,-4.5],[-4.3,-1.2],[1.2,3.2]])});

export function createWindowDecorations(room){
 const group=new THREE.Group();group.name='Sakura window decorations';group.userData.sharedAsset=true;room.add(group);
 let current=null,pendants=[];
 function build(season){
  for(const child of [...group.children]){child.traverse(o=>{o.geometry?.dispose?.();if(o.material?.map)o.material.map.dispose();o.material?.dispose?.();});group.remove(child);}
  pendants=[];
  const cell=192,textures=new Map();
  for(const id of new Set(season.shapes))textures.set(id,canvasTexture(cell,cell,(ctx,w)=>{SHAPES[id]?.(ctx,w);}));
  const string=new THREE.MeshStandardMaterial({color:0xd9c79a,roughness:.9});
  let n=0;
  for(const [x0,x1] of WINDOW.bays){
   const line=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,x1-x0,5),string);line.rotation.z=Math.PI/2;line.position.set((x0+x1)/2,WINDOW.top,WINDOW.z);group.add(line);
   const count=Math.max(3,Math.round((x1-x0)/.42));
   for(let k=0;k<count;k++){
    const id=season.shapes[(k+n)%season.shapes.length],x=x0+(k+.5)*(x1-x0)/count;
    // Strings of different lengths, the way somebody on a step-stool actually hangs them.
    const drop=.12+((k*7+n*3)%5)*.07,size=id==='koi'||id==='tanzaku'?.3:.22;
    const pivot=new THREE.Group();pivot.position.set(x,WINDOW.top,WINDOW.z);group.add(pivot);
    const thread=new THREE.Mesh(new THREE.CylinderGeometry(.002,.002,drop,4),string);thread.position.y=-drop/2;pivot.add(thread);
    const paper=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshStandardMaterial({map:textures.get(id),transparent:true,alphaTest:.3,side:THREE.DoubleSide,roughness:.8}));
    paper.position.y=-drop-size/2;pivot.add(paper);
    pendants.push({pivot,phase:k*1.3+n*.7});
   }
   n++;
  }
  current=season.id;
 }
 const refresh=(date=new Date())=>{const season=seasonFor(date);if(season.id!==current)build(season);return season;};
 refresh();
 return {group,refresh,get season(){return current;},tick(time){for(const {pivot,phase} of pendants){pivot.rotation.z=Math.sin(time*.9+phase)*.06;pivot.rotation.y=Math.sin(time*.5+phase*1.7)*.35;}}};
}
