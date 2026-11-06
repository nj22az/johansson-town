import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';

const V=(x,y)=>new THREE.Vector2(x,y);
function rounded(w,h,r){
 // A radius larger than half the thin panel made the outline cross itself;
 // ExtrudeGeometry then produced overlapping front/back triangles.
 r=Math.min(r,w/2,h/2);
 const s=new THREE.Shape(),x=-w/2,y=-h/2;
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
 s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
 s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
function colour(g,hex){
 const c=new THREE.Color(hex).toArray(),a=new Float32Array(g.attributes.position.count*3);
 for(let i=0;i<a.length;i+=3)a.set(c,i);
 g.setAttribute('color',new THREE.BufferAttribute(a,3));g.deleteAttribute('uv');
 if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));return g;
}

/** Recognizable period appliances; all their small parts share three finish draws. */
export function buildIzakayaDevices(room,P,K){
 const parts={plastic:[],metal:[],paper:[]},placements=[];let bounds;
 const add=(finish,g,c,p,x=0,y=0,z=0)=>{
  g.translate(p.x+x,(p.y||0)+y,p.z+z);colour(g,c);parts[finish].push(g);
  g.computeBoundingBox();bounds?.union(g.boundingBox);return g;
 };
 const box=(f,w,h,d,c,p,x=0,y=0,z=0,r=0)=>{
  const g=r?new THREE.ExtrudeGeometry(rounded(w,h,r),{depth:d,bevelEnabled:false,curveSegments:3}).translate(0,0,-d/2):new THREE.BoxGeometry(w,h,d);
  return add(f,g,c,p,x,y,z);
 };
 const cyl=(f,r,h,c,p,x=0,y=0,z=0,axis='y')=>{
  const g=new THREE.CylinderGeometry(r,r,h,16);if(axis==='z')g.rotateX(Math.PI/2);
  if(axis==='x')g.rotateZ(Math.PI/2);return add(f,g,c,p,x,y,z);
 };
 const tube=(f,points,r,c,p)=>add(f,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),Math.max(12,points.length*2),r,6,false),c,p);
 const on=(id,fn)=>{bounds=new THREE.Box3();fn();placements.push({id,min:bounds.min.toArray(),max:bounds.max.toArray()});bounds=null;};
 on('pink-payphone',()=>{
  box('plastic',.4,.03,.26,0x6e4c30,P,0,0,0,.015);
  for(const x of [-.16,.16])box('metal',.026,.12,.2,0x554d42,P,x,-.07,.02);
  box('plastic',.285,.026,.23,0x823b55,P,0,.028,-.005,.02);
  box('plastic',.28,.145,.224,0xe090a2,P,0,.108,-.005,.025);
  // Raised coin mechanism and cradle sit behind the dialing panel.
  box('plastic',.085,.09,.08,0xd27691,P,-.084,.204,.058,.01);
  const coinPlate=box('metal',.06,.047,.003,0xb5b7af,P,-.084,.206,.016);
  // This is a face plate fixed to the coin housing, not a closed metal block
  // with another rear face competing against the housing's recess.
  coinPlate.setIndex([...coinPlate.index.array.slice(0,24),...coinPlate.index.array.slice(30)]);
  box('plastic',.026,.003,.004,0x252629,P,-.084,.216,.013);
  box('metal',.033,.015,.003,0x6b6c68,P,-.084,.193,.012);
  for(const x of [-.09,.09])box('plastic',.036,.034,.047,0xaa536f,P,x,.189,-.005,.008);
  // A real handset has two cups, a narrow grip, and visible perforations.
  box('plastic',.165,.035,.037,0xe7a0b2,P,0,.224,-.006,.016);
  for(const x of [-.103,.103]){
   box('plastic',.063,.058,.071,0xc76789,P,x,.223,-.011,.026);
   box('plastic',.042,.008,.048,0xad5276,P,x,.195,-.017,.016);
   for(let row=0;row<3;row++)for(let col=0;col<3;col++)cyl('plastic',.0018,.009,0x66374a,P,x+(col-1)*.01,.191,-.017+(row-1)*.011);
  }
  box('plastic',.106,.085,.005,0xa95372,P,.029,.10,-.119,.008);
  for(let row=0;row<4;row++)for(let col=0;col<3;col++){
   const x=.029+(1-col)*.027,y=.131-row*.02;
   // The printed digit is the keycap's front face, not an overlay on it.
   const key=new THREE.BoxGeometry(.022,.015,.008);key.setIndex(Array.from(key.index.array).slice(0,30));
   add('plastic',key,0xf0ded5,P,x,y,-.124);
  }
  box('metal',.046,.021,.007,0xadb2aa,P,-.081,.069,-.121,.003);
  box('plastic',.035,.008,.002,0x323331,P,-.081,.071,-.126);
  tube('plastic',[[-.12,.215,.005],[-.159,.16,-.018],[-.158,.04,-.025]],.003,0x9c4666,P);
  const coil=[];for(let i=0;i<=144;i++){const a=i/144*Math.PI*20;coil.push([-.157+Math.cos(a)*.008,.043-i/144*.105,-.035+Math.sin(a)*.008]);}
  tube('plastic',coil,.0018,0x873b59,P);
  tube('plastic',[[-.157,-.062,-.035],[-.132,-.072,.035],[-.124,.055,.06]],.0026,0x873b59,P);
 });
 on('laserdisc-karaoke',()=>{
  box('plastic',K.w,K.h,K.d,0x493728,K,0,K.h/2,0,.015);
  for(const x of [-.27,.27])box('plastic',.026,.65,.018,0x70533a,K,x,.35,-.247);
  box('plastic',.50,.39,.012,0x282527,K,0,.23,-.247,.006);
  // The cabinet's perforated speaker and an access latch.
  for(let row=0;row<12;row++)for(let col=0;col<17;col++)box('plastic',.012,.008,.002,0x60544b,K,(col-8)*.026,.09+row*.025,-.255);
  box('metal',.026,.022,.006,0xa5a496,K,.239,.36,-.257,.004);
  box('plastic',.54,.09,.425,0x292c2d,K,0,.59,-.008,.006);
  box('metal',.49,.062,.003,0x787d79,K,0,.594,-.224);
  box('plastic',.257,.022,.006,0x363b3b,K,-.035,.599,-.229,.003);
  box('metal',.23,.003,.003,0xa9aaa3,K,-.035,.596,-.234);
  for(const x of [.144,.196])cyl('plastic',.011,.009,0x242a28,K,x,.6,-.232,'z');
  box('paper',.006,.004,.002,0x95c873,K,.23,.615,-.232);
  // Thick CRT housing, raised bezel and separate control strip.
  box('plastic',.48,.36,.4,0x444344,K,0,K.h+.18,.02,.033);
  box('plastic',.443,.319,.016,0x202b2b,K,0,K.h+.191,-.186,.026);
  box('plastic',.403,.281,.009,0x181f21,K,-.009,K.h+.208,-.199,.023);
  for(const x of [.145,.183])cyl('plastic',.012,.009,0xa69d87,K,x,K.h+.047,-.2,'z');
  box('paper',.004,.004,.002,0x90b379,K,.211,K.h+.048,-.208);
  for(let i=0;i<9;i++)box('plastic',.067,.004,.002,0x202426,K,-.155,K.h+.019+i*.007,-.207);
  for(const x of [-.21,.21])for(let i=0;i<8;i++)box('plastic',.002,.05,.005,0x24292a,K,x,K.h+.22,.006+i*.02);
  // Microphones have tapered grips, rounded mesh heads, collars and leads.
  for(const x of [-.21,.21]){
   cyl('plastic',.011,.11,0x282b2c,K,x,.737,-.167,'z');
   cyl('metal',.015,.014,0x8a918f,K,x,.737,-.222,'z');
   add('metal',new THREE.SphereGeometry(.021,12,8).scale(1,1,1.18),0xaeb4b0,K,x,.737,-.239);
   for(let j=0;j<3;j++)add('plastic',new THREE.TorusGeometry(.019-j*.003,.0009,4,16).rotateX(Math.PI/2),0x616969,K,x,.727+j*.006,-.239);
   box('plastic',.007,.003,.017,0x777b76,K,x,.749,-.179);
   tube('plastic',[[x,.737,-.112],[x*.8,.725,.0],[x*.9,.54,.183],[x*.7,.18,.184]],.0025,0x24282a,K);
  }
 });
 const group=new THREE.Group();group.name='Minato detailed devices';group.userData.placements=placements;
 for(const [finish,gs] of Object.entries(parts)){
  const mesh=new THREE.Mesh(mergeGeometries(gs),new THREE.MeshStandardMaterial({vertexColors:true,roughness:finish==='metal'?.35:finish==='paper'?.9:.65,metalness:finish==='metal'?.65:0}));
  mesh.name='Minato devices '+finish;group.add(mesh);gs.forEach(g=>g.dispose());
 }
 // One small atlas puts real dial legends and calling instructions on the phone.
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#eaddcf';ctx.fillRect(0,0,512,256);ctx.fillStyle='#61464e';ctx.textAlign='center';
 ctx.font='700 25px sans-serif';ctx.fillText('公衆電話',384,34);ctx.font='20px sans-serif';ctx.fillText('PUBLIC PHONE',384,66);
 ctx.font='700 25px sans-serif';ctx.fillText('¥10 / CALL',384,107);ctx.font='17px sans-serif';ctx.fillText('Lift receiver',384,145);ctx.fillText('Insert coin · dial',384,173);ctx.fillText('Harbour 01 · Ferry 02',384,216);
 const digits=['1','2','3','4','5','6','7','8','9','＊','0','＃'];ctx.font='700 52px sans-serif';
 const labels=[];
 for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  ctx.fillText(digits[row*3+col],40+col*80,48+row*64);
  const g=new THREE.PlaneGeometry(.022,.015).rotateY(Math.PI).translate(P.x+.029+(1-col)*.027,P.y+.131-row*.02,P.z-.128);
  const uv=g.attributes.uv;for(let i=0;i<uv.count;i++){uv.setXY(i,(col*80+uv.getX(i)*80)/512,1-(row*64+(1-uv.getY(i))*64)/256);}labels.push(g);
 }
 const card=new THREE.PlaneGeometry(.058,.084).rotateY(Math.PI).translate(P.x-.081,P.y+.128,P.z-.1205);
 for(let i=0;i<card.attributes.uv.count;i++)card.attributes.uv.setX(i,.5+card.attributes.uv.getX(i)*.5);labels.push(card);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const legends=new THREE.Mesh(mergeGeometries(labels),new THREE.MeshStandardMaterial({map:texture,roughness:.9}));legends.name='Minato phone dial and instructions';group.add(legends);labels.forEach(g=>g.dispose());
 room.add(group);return group;
}

/** The player's kept sake uses the same vessel construction as the regulars'. */
export function buildKeptBottleVisual(){
 const group=new THREE.Group();group.name='Your bottle on the keep shelf';group.visible=false;
 const profile=[[0,0],[.038,0],[.045,.012],[.045,.22],[.038,.248],[.018,.277],[.017,.335],[0,.335]];
 const body=new THREE.Mesh(new THREE.LatheGeometry(profile.map(a=>V(...a)),20),new THREE.MeshStandardMaterial({color:0x344e3b,roughness:.26}));group.add(body);
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.024,16),new THREE.MeshStandardMaterial({color:0xb5a477,roughness:.42,metalness:.4}));cap.position.y=.346;group.add(cap);
 const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');
 x.fillStyle='#ede4c8';x.fillRect(0,0,256,256);x.strokeStyle='#a03e38';x.lineWidth=9;x.strokeRect(12,12,232,232);
 x.fillStyle='#394332';x.textAlign='center';x.font='700 48px serif';x.fillText('港島',128,80);x.font='600 25px sans-serif';x.fillText('MINATO SAKE',128,122);x.font='20px sans-serif';x.fillText('BOTTLE KEEP',128,162);x.font='700 23px sans-serif';x.fillText('Johansson',128,211);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 const label=new THREE.Mesh(new THREE.CylinderGeometry(.0455,.0455,.09,20,1,true,Math.PI/2-.8,1.6),new THREE.MeshStandardMaterial({map:t,roughness:.9}));label.position.y=.13;group.add(label);
 const cord=new THREE.Mesh(new THREE.TorusGeometry(.018,.0012,4,20).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:0xc4b18b}));cord.position.y=.286;group.add(cord);
 return group;
}
