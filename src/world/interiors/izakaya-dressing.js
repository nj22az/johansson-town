import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';

/**
 * Minato in October 1997: the things on its walls and tables.
 *
 * - Five posters of the year, sun-faded and taped up: Umineko Beer's summer campaign
 *   (still up in autumn, as they are),
 *   the island team's autumn fixtures, an enka singer at the harbour hall, the police's
 *   drink-driving notice, and the karaoke contest.
 * - The bottle keep: the regulars' own bottles of awamori on a shelf by the counter's
 *   end, each with its owner's name on a tag round the neck.
 * - A condiment set at every pair of stools and on every table, the oshibori warmer,
 *   red lanterns along the counter, and a tanuki by the door.
 *
 * All of it is one print sheet and a handful of merged or instanced meshes.
 * Room coordinates: Minato is x -6.3..6.3, z -6.3..6.3; the counter's customer ledge is
 * at the shared service height (z -2.1..-2.4), the tables at the shared dining height, the koagari's low tables at 0.77.
 */
const MINCHO='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';
const GOTHIC='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';

/** The regulars who keep a bottle (and so whose names are on the shelf). */
export const BOTTLE_KEEP=Object.freeze([
 {name:'Chin',drink:'Zuisen awamori',colour:0x5a3b22},{name:'Mr Higa',drink:'Kumesen awamori',colour:0x2c4a33},
 {name:'Officer Mori',drink:'Shochu, barley',colour:0xd8dccf},{name:'Hiroshi',drink:'Awamori, 10 years',colour:0x5a3b22},
 {name:'Tetsuo',drink:'Shochu, sweet potato',colour:0x34465a},{name:'Harbour master',drink:'Awamori, 5 years',colour:0x2c4a33},
 {name:'Mr Fujita',drink:'Shochu, rice',colour:0xd8dccf},{name:'Masaru',drink:'Awamori',colour:0x5a3b22},
 {name:'Ms Uezu',drink:'Plum wine',colour:0x7a2b2b},{name:'Mr Tanabe',drink:'Awamori, 3 years',colour:0x34465a},
 {name:'Nhung',drink:'Plum wine',colour:0x7a2b2b},{name:'Daichi',drink:'Shochu, barley',colour:0xd8dccf},
]);
/** The shelf, on the west wall beside the counter's end. */
export const KEEP_SHELF=Object.freeze({x:-6.29,z:-2.9,width:1.15,levels:Object.freeze([1.45,1.86]),depth:.2});
/** Posters: [cell, x, y, z, yaw, width, height]. */
export const MINATO_1997_POSTERS=Object.freeze([
 ['beer',6.29,2.02,-1.45,-Math.PI/2,.6,.86],
 ['enka',-6.29,2.02,4.55,Math.PI/2,.6,.86],
 ['police',-6.29,1.92,-1.35,Math.PI/2,.46,.66],
 ['karaoke',2.75,2.08,6.29,Math.PI,.5,.72],
 ['baseball',6.29,2.02,4.3,-Math.PI/2,.6,.86],
]);

const SHEET={w:2048,h:1024},P=[300,430];
const CELLS={
 beer:[0,0,...P],enka:[300,0,...P],baseball:[600,0,...P],police:[1200,0,...P],karaoke:[1500,0,...P],
};
BOTTLE_KEEP.forEach((b,i)=>{CELLS['tag'+i]=[(i%16)*128,440+Math.floor(i/16)*64,128,64];});
BOTTLE_KEEP.forEach((b,i)=>{CELLS['bottle'+i]=[i*128,520,128,112];});
Object.assign(CELLS,{
 soy:[1536,440,128,160],spice:[1664,440,128,160],toothpicks:[1792,440,128,160],
 warmer:[1536,608,256,96],lantern:[1792,608,160,256],
 flask:[1536,720,128,160],bill:[1664,720,128,160],
});

// Supported by the steel worktop, clear of the sink and the beer-glass rack.
export const OSHIBORI_WARMER=Object.freeze({x:.55,y:.9175,z:-3.06,w:.3,h:.2,d:.22});

function sheet(){
 const c=document.createElement('canvas');c.width=SHEET.w;c.height=SHEET.h;const ctx=c.getContext('2d');
 ctx.fillStyle='#000';ctx.fillRect(0,0,SHEET.w,SHEET.h);
 const at=(name,draw)=>{const [x,y,w,h]=CELLS[name];ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();draw(ctx,w,h);ctx.restore();};
 const write=(c,s,x,y,size,colour,font=GOTHIC,weight=900,max=280)=>{c.fillStyle=colour;c.font=`${weight} ${size}px ${font}`;c.textAlign='center';c.textBaseline='middle';c.fillText(s,x,y,max);};
 // Four months of sun through the window: a faded print and a lighter top edge.
 const fade=(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,248,230,.22)');g.addColorStop(.5,'rgba(255,248,230,.06)');g.addColorStop(1,'rgba(255,248,230,0)');c.fillStyle=g;c.fillRect(0,0,w,h);};
 at('beer',(c,w,h)=>{
  const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#2a8fcc');sky.addColorStop(.62,'#8fd3f0');sky.addColorStop(.63,'#f2d8a0');sky.addColorStop(1,'#e9c27a');c.fillStyle=sky;c.fillRect(0,0,w,h);
  c.fillStyle='#ffffff';c.beginPath();c.arc(230,70,36,0,Math.PI*2);c.fill();
  // The can, cold and sweating, on the sand.
  c.fillStyle='#f4f1e6';c.fillRect(110,170,80,150);c.fillStyle='#c8102e';c.fillRect(110,205,80,40);c.fillStyle='#8a9aa3';c.fillRect(110,166,80,8);
  write(c,'UMINEKO',150,225,22,'#ffffff');
  write(c,"夏だ！ウミネコ",w/2,48,36,'#ffffff',MINCHO);write(c,'UMINEKO BEER · SUMMER 1997',w/2,372,19,'#7a2b14',GOTHIC,800);write(c,'Drinking is for adults',w/2,404,14,'#7a2b14',GOTHIC,700);
  fade(c,w,h);
 });
 at('enka',(c,w,h)=>{
  c.fillStyle='#3a1630';c.fillRect(0,0,w,h);
  c.fillStyle='#f2c14e';c.beginPath();c.arc(w/2,170,92,0,Math.PI*2);c.fill();
  c.fillStyle='#1c0d18';c.beginPath();c.arc(w/2,150,40,0,Math.PI*2);c.fill();c.fillRect(w/2-56,186,112,80);
  write(c,"港の灯",w/2,42,46,'#f2c14e',MINCHO);
  write(c,'HARBOUR LIGHTS',w/2,300,26,'#f2c14e',GOTHIC,900);write(c,'Kayoko Shima · enka evening',w/2,334,17,'#ffffff',GOTHIC,700);
  write(c,'Harbour Hall · Sat 25 Oct · ¥3,000',w/2,368,16,'#ffffff',GOTHIC,700);fade(c,w,h);
 });
 at('baseball',(c,w,h)=>{
  c.fillStyle='#f4efe2';c.fillRect(0,0,w,h);c.fillStyle='#1b4f8a';c.fillRect(0,0,w,86);
  write(c,'MINATO SEAGULLS',w/2,32,28,'#ffffff');write(c,'AUTUMN FIXTURES 1997',w/2,66,18,'#ffd23f',GOTHIC,800);
  c.fillStyle='#ffffff';c.strokeStyle='#c8102e';c.lineWidth=4;c.beginPath();c.arc(w/2,140,34,0,Math.PI*2);c.fill();c.stroke();
  [['4 Oct','v Kitahama','H'],['11 Oct','v Port Ferries','A'],['18 Oct','v Airport Club','H'],['25 Oct','v Aoba','H'],['1 Nov','Island cup final','H']].forEach(([d,v,ha],i)=>{
   const y=206+i*42;c.fillStyle=i%2?'#e9e1cc':'#f4efe2';c.fillRect(14,y-18,w-28,38);
   c.fillStyle='#1b4f8a';c.font=`800 17px ${GOTHIC}`;c.textAlign='left';c.textBaseline='middle';c.fillText(d,22,y);c.fillStyle='#2a2a2a';c.fillText(v,96,y,170);c.fillStyle=ha==='H'?'#c8102e':'#555';c.textAlign='right';c.fillText(ha==='H'?'Home':'Away',w-22,y);
  });
  fade(c,w,h);
 });
 at('police',(c,w,h)=>{
  c.fillStyle='#ffffff';c.fillRect(0,0,w,h);c.fillStyle='#c8102e';c.fillRect(0,0,w,74);
  write(c,"飲んだら乗るな",w/2,38,34,'#ffffff',GOTHIC);
  c.strokeStyle='#c8102e';c.lineWidth=12;c.beginPath();c.arc(w/2,190,80,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(w/2-56,134);c.lineTo(w/2+56,246);c.stroke();
  c.fillStyle='#2a2a2a';c.fillRect(w/2-44,182,88,30);c.beginPath();c.arc(w/2-26,216,12,0,Math.PI*2);c.arc(w/2+26,216,12,0,Math.PI*2);c.fill();
  write(c,"IF YOU DRINK, DON'T DRIVE",w/2,312,19,'#c8102e',GOTHIC,900);write(c,'Minato Police Station',w/2,350,16,'#2a2a2a',GOTHIC,700);write(c,'Ask Thao to call a taxi',w/2,380,15,'#2a2a2a',GOTHIC,700);
 });
 at('karaoke',(c,w,h)=>{
  c.fillStyle='#ffe14d';c.fillRect(0,0,w,h);
  c.fillStyle='#e8346c';for(let i=0;i<12;i++){c.save();c.translate(w/2,150);c.rotate(i*Math.PI/6);c.fillRect(-6,0,12,160);c.restore();}
  c.fillStyle='#2a2a2a';c.beginPath();c.arc(w/2,150,44,0,Math.PI*2);c.fill();c.fillStyle='#777';c.fillRect(w/2-10,190,20,60);
  write(c,"カラオケ大会",w/2,40,38,'#e8346c',GOTHIC);
  write(c,'KARAOKE CONTEST',w/2,300,24,'#2a2a2a',GOTHIC,900);write(c,'Last Friday of the month · 21:00',w/2,334,16,'#2a2a2a',GOTHIC,700);
  write(c,'Prize: a bottle on the keep shelf',w/2,364,15,'#2a2a2a',GOTHIC,700);
 });
 BOTTLE_KEEP.forEach((b,i)=>at('tag'+i,(c,w,h)=>{c.fillStyle='#f6efdc';c.fillRect(0,0,w,h);c.strokeStyle='#8a6a3a';c.lineWidth=3;c.strokeRect(2,2,w-4,h-4);write(c,b.name,w/2,h/2,b.name.length>10?17:22,'#2a2018',MINCHO,700,w-10);}));
 BOTTLE_KEEP.forEach((b,i)=>at('bottle'+i,(c,w,h)=>{
  c.fillStyle='#ece4cc';c.fillRect(0,0,w,h);c.strokeStyle=i%3===0?'#a63d2c':'#325851';c.lineWidth=6;c.strokeRect(8,7,w-16,h-14);
  write(c,b.drink.includes('Plum')?'梅酒':b.drink.includes('Shochu')?'焼酎':'泡盛',w/2,37,31,'#302a20',MINCHO,800,w-20);
  write(c,'MINATO CELLAR',w/2,72,13,'#695235',GOTHIC,800,w-18);write(c,b.drink,w/2,91,11,'#695235',GOTHIC,600,w-18);
 }));
 const label=(name,base,title,small)=>at(name,(c,w,h)=>{
  c.fillStyle=base;c.fillRect(0,0,w,h);c.strokeStyle='#b6a280';c.lineWidth=4;c.strokeRect(7,7,w-14,h-14);
  write(c,title,w/2,h*.35,27,'#38291f',MINCHO,900,w-18);write(c,small,w/2,h*.64,15,'#7b3529',GOTHIC,800,w-16);
 });
 label('soy','#eadcc1','醤油','SOY SAUCE');label('spice','#eadcc1','七味','SHICHIMI');label('toothpicks','#f4ead8','爪楊枝','TOOTHPICKS');
 at('warmer',(c,w,h)=>{c.fillStyle='#e7e9df';c.fillRect(0,0,w,h);write(c,'MINATO · HOT TOWELS',w/2,30,17,'#526056',GOTHIC,800,w-18);write(c,'Keep door closed · WARM',w/2,66,14,'#7b5140',GOTHIC,700,w-18);});
 at('lantern',(c,w,h)=>{c.clearRect(0,0,w,h);for(const [i,s] of [...'小料理'].entries())write(c,s,w/2,49+i*79,64,'#231e17',MINCHO,900,w-16);});
 label('flask','#e9dcb6','酒','MINATO');
 at('bill',(c,w,h)=>{c.fillStyle='#e4cf9d';c.fillRect(0,0,w,h);write(c,'通帳',w/2,32,24,'#4a3928',MINCHO,800,w-16);for(let i=0;i<5;i++){c.fillStyle='#ac9166';c.fillRect(16,65+i*15,w-32,2);}write(c,'MINATO',w/2,143,15,'#73573b',GOTHIC,700,w-14);});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function printed(name,w,h){
 const [x,y,cw,ch]=CELLS[name],g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,(x+uv.getX(i)*cw)/SHEET.w,1-(y+(1-uv.getY(i))*ch)/SHEET.h);
 return g;
}
function curvedPrint(name,r,h,arc=1.6,rows=4){
 const g=new THREE.PlaneGeometry(arc*r,h,8,rows),p=g.attributes.position,uv=g.attributes.uv,[x,y,w,ch]=CELLS[name];
 for(let i=0;i<p.count;i++){
  const a=p.getX(i)/r;
  p.setXYZ(i,Math.sin(a)*r,p.getY(i),Math.cos(a)*r);
  uv.setXY(i,(x+3+uv.getX(i)*(w-6))/SHEET.w,1-(y+3+(1-uv.getY(i))*(ch-6))/SHEET.h);
 }
 g.computeVertexNormals();return g;
}
function coloured(g,hex){
 const c=new THREE.Color(hex),a=new Float32Array(g.attributes.position.count*3);
 for(let i=0;i<a.length;i+=3)a.set(c.toArray(),i);g.setAttribute('color',new THREE.BufferAttribute(a,3));if(g.attributes.uv)g.deleteAttribute('uv');return g;
}
const at=(g,x,y,z,yaw=0)=>{g.rotateY(yaw);g.translate(x,y,z);return g;};

export function buildIzakayaDressing(room,{collider,layout={}}={}){
 const prints=[],solids=[],glaze=[],glow=[],placements=[];let bounds=null;
 const piece=(g,p,batch,hex,x=0,y=0,z=0)=>{
  g.translate(x,y,z);if(p.scale)g.scale(p.scale,p.scale,p.scale);at(g,p.x,p.y,p.z,p.yaw||0);if(hex!==undefined)coloured(g,hex);batch.push(g);
  if(bounds){g.computeBoundingBox();bounds.union(g.boundingBox);}return g;
 };
 const localBox=(w,h,d,p,hex,x=0,y=0,z=0,batch=solids)=>piece(new THREE.BoxGeometry(w,h,d),p,batch,hex,x,y,z);
 const localCyl=(r,h,p,hex,x=0,y=0,z=0,top=r,batch=glaze,seg=12)=>piece(new THREE.CylinderGeometry(top,r,h,seg),p,batch,hex,x,y,z);
 const lathe=(points,p,hex,x=0,y=0,z=0,batch=glaze)=>piece(new THREE.LatheGeometry(points.map(([r,h])=>new THREE.Vector2(r,h)),16),p,batch,hex,x,y,z);
 const ball=(r,p,hex,x,y,z,sx=1,sy=1,sz=1,batch=glaze)=>piece(new THREE.SphereGeometry(r,12,8).scale(sx,sy,sz),p,batch,hex,x,y,z);
 const ring=(r,t,p,hex,x=0,y=0,z=0,batch=glaze)=>piece(new THREE.TorusGeometry(r,t,3,16).rotateX(Math.PI/2),p,batch,hex,x,y,z);
 const tube=(points,r,p,hex,batch=glaze)=>piece(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),12,r,5,false),p,batch,hex);
 const decal=(name,w,h,p,x=0,y=0,z=0)=>piece(printed(name,w,h),p,prints,undefined,x,y,z);
 const wrap=(name,r,h,p,x=0,y=0,z=0,arc=1.6)=>piece(curvedPrint(name,r,h,arc),p,prints,undefined,x,y,z);
 const item=(id,p,draw)=>{const previous=bounds;bounds=new THREE.Box3();draw(p);placements.push(Object.freeze({id,min:Object.freeze(bounds.min.toArray()),max:Object.freeze(bounds.max.toArray())}));bounds=previous;};
 const box=(w,h,d,x,y,z,hex,yaw=0)=>localBox(w,h,d,{x,y,z,yaw},hex);
 const roundedBox=(w,h,d,r,p,hex,x=0,y=0,z=0,batch=glaze)=>{
  const s=new THREE.Shape(),a=-w/2+r,b=-h/2+r,iw=w-2*r,ih=h-2*r;
  s.moveTo(a+r,b);s.lineTo(a+iw-r,b);s.quadraticCurveTo(a+iw,b,a+iw,b+r);s.lineTo(a+iw,b+ih-r);s.quadraticCurveTo(a+iw,b+ih,a+iw-r,b+ih);s.lineTo(a+r,b+ih);s.quadraticCurveTo(a,b+ih,a,b+ih-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
  const g=new THREE.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:2,curveSegments:3});
  // ExtrudeGeometry is non-indexed; make all merged inputs share a representation.
  g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));g.translate(0,0,-d/2+r);piece(g,p,batch,hex,x,y,z);
 };
 // The posters, taped, a hair off the wall.
 for(const [cell,x,y,z,yaw,w,h] of layout.posters||MINATO_1997_POSTERS){
  const out=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)).multiplyScalar(.012);
  prints.push(at(printed(cell,w,h),x+out.x,y,z+out.z,yaw));
  for(const [sx,sy] of [[-1,1],[1,1],[-1,-1],[1,-1]]){const t=new THREE.BoxGeometry(.07,.028,.002);t.rotateZ(sx*sy*.6);t.translate(sx*(w/2-.02),sy*(h/2-.01),0);solids.push(coloured(at(t,x+out.x*1.2,y,z+out.z*1.2,yaw),0xf2ecd2));}
 }
 // The bottle keep: two boards on brackets, the bottles in a row, tags on their necks.
 const K=layout.keepShelf||KEEP_SHELF;
 for(const y of K.levels){box(K.depth,.03,K.width,K.x+K.depth/2,y-.015,K.z,0x6e4c30);box(.04,.11,.03,K.x+.02,y-.085,K.z-K.width/2+.08,0x3a2a1c);box(.04,.11,.03,K.x+.02,y-.085,K.z+K.width/2-.08,0x3a2a1c);}
 const bottle=new THREE.LatheGeometry([[0,0],[.031,0],[.043,.005],[.045,.024],[.044,.23],[.039,.247],[.027,.267],[.019,.279],[.017,.331],[.019,.334],[.019,.349],[0,.349]].map(([r,y])=>new THREE.Vector2(r,y)),16);
 const bottles=new THREE.InstancedMesh(bottle,new THREE.MeshStandardMaterial({roughness:.22,metalness:.05}),BOTTLE_KEEP.length);bottles.name='Minato bottle keep';
 const dummy=new THREE.Object3D(),perRow=Math.ceil(BOTTLE_KEEP.length/K.levels.length),spacing=(K.width-.12)/perRow;
 BOTTLE_KEEP.forEach((b,i)=>{
  const level=K.levels[Math.floor(i/perRow)],z=K.z-K.width/2+.06+spacing*(i%perRow+.5);
  dummy.position.set(K.x+.11,level,z);dummy.updateMatrix();bottles.setMatrixAt(i,dummy.matrix);bottles.setColorAt(i,new THREE.Color(b.colour));
  item('Kept bottle '+b.name,{x:K.x+.11,y:level,z,yaw:Math.PI/2},p=>{
   const bb=bottle.clone();piece(bb,p,[],undefined);bb.dispose();
   localCyl(.0195,.019,p,0xa89b75,0,.343);ring(.0195,.0013,p,0x615a47,0,.336);
   for(const y of [.339,.343,.347])ring(.0195,.0006,p,0xd2c7a7,0,y);
   wrap('bottle'+i,.0451,.085,p,0,.139,0,1.65);
   ring(.0186,.0012,p,0x9c8660,0,.308,0,solids);
   tube([[.012,.309,.015],[.019,.293,.026],[.01,.278,.048]],.0008,p,0x9c8660,solids);
   decal('tag'+i,.085,.042,p,0,.253,.0508);
  });
 });
 bottles.computeBoundingSphere();
 // A condiment set: soy, shichimi, a toothpick pot and the chopstick box.
 const caddy=(x,y,z,yaw=0)=>item('Condiment caddy '+x+','+z,{x,y:y+.002,z,yaw},p=>{
  // A shallow cedar carrier, with real open containers supported by its base.
  localBox(.38,.006,.096,p,0x63472d,.05,.003);for(const dz of [-.046,.046])localBox(.38,.014,.004,p,0x9a6c3e,.05,.013,dz);
  for(const dx of [-.138,.238])localBox(.004,.014,.088,p,0x9a6c3e,dx,.013);
  // Pressed glass soy bottle, a black screw lid and its short pour spout.
  lathe([[0,.006],[.019,.006],[.024,.013],[.024,.072],[.018,.087],[.012,.091],[.012,.106],[0,.106]],p,0x482a18,-.095);
  localCyl(.015,.009,p,0x211d17,-.095,.106);ring(.015,.0011,p,0x746650,-.095,.108);
  tube([[-.095,.11,0],[-.085,.118,.004],[-.073,.12,.006]],.0035,p,0x34291f);
  ball(.0034,p,0x100e0a,-.072,.119,.006,1,.55,1);wrap('soy',.0244,.042,p,-.095,.046,0,1.7);
  // The shichimi shaker has a perforated red cap and its paper spice label.
  lathe([[0,.006],[.012,.006],[.016,.011],[.016,.061],[.012,.066],[0,.066]],p,0xa67039,-.027);
  localCyl(.0165,.013,p,0xa33628,-.027,.0705);ring(.0168,.0008,p,0x6d2119,-.027,.065);
  for(const [dx,dz] of [[0,0],[.006,0],[-.006,0],[0,.006],[0,-.006]])localCyl(.0014,.0008,p,0x3f241a,-.027+dx,.0774,dz,undefined,solids,6);
  wrap('spice',.0164,.038,p,-.027,.032,0,1.8);
  // An open ceramic toothpick pot, rather than a solid beige cylinder.
  lathe([[0,.006],[.013,.006],[.017,.012],[.018,.051],[.0155,.053],[.014,.016],[0,.014]],p,0xd8c8a4,.028);
  wrap('toothpicks',.0183,.029,p,.028,.034,0,1.55);
  for(let i=0;i<9;i++){
   const a=i*2.399,r=.007+(i%2)*.003;
   piece(new THREE.CylinderGeometry(.0005,.00085,.055,5).rotateZ((i%3-1)*.05),p,solids,0xc19b57,.028+Math.cos(a)*r,.05,Math.sin(a)*r);
  }
  // A hollow chopstick box with individual bamboo pairs and a notch at each end.
  localBox(.188,.004,.071,p,0x775031,.141,.008);for(const dz of [-.034,.034])localBox(.188,.039,.004,p,0x99693b,.141,.0295,dz);
  for(const dx of [.049,.233]){localBox(.004,.02,.064,p,0x99693b,dx,.02);for(const dz of [-.026,.026])localBox(.004,.014,.012,p,0x99693b,dx,.037,dz);}
  for(let i=0;i<10;i++)piece(new THREE.CylinderGeometry(.0013,.0022,.176,6).rotateZ(Math.PI/2),p,solids,i%2?0xcbb079:0xb88d51,.141,.013+Math.floor(i/5)*.005,-.022+(i%5)*.0105);
 });
 const caddies=layout.caddies||[
  ...[-3.05,-1.55,-.05,1.45].map(x=>[x,FURNITURE_HEIGHTS.serviceCounter,-2.24,0]),
  ...[[-4.55,2.2],[1.55,2.0]].map(([x,z])=>[x,FURNITURE_HEIGHTS.table,z,Math.PI/2]),
  [5.0,.77,.25,Math.PI/2],
 ];
 for(const p of caddies)caddy(...p);
 // The towel cabinet now rests on the steel counter and opens toward the staff.
 const W=layout.warmer||OSHIBORI_WARMER;
 item('Oshibori towel warmer',{x:W.x,y:W.y,z:W.z,yaw:Math.PI},p=>{
  for(const dx of [-.115,.115])for(const dz of [-.079,.079])localCyl(.011,.012,p,0x312d24,dx,.006,dz);
  roundedBox(.3,.188,.22,.006,p,0xe1ded1,0,.106);roundedBox(.269,.155,.004,.0018,p,0x8b9290,0,.105,.1125);
  roundedBox(.254,.142,.006,.002,p,0xced4c8,0,.106,.116);roundedBox(.213,.078,.003,.001,p,0xb3bdb5,-.004,.111,.121);
  for(const dy of [.057,.155])localBox(.014,.025,.012,p,0x8e9a91,-.131,dy,.12,glaze);
  tube([[.118,.067,.12],[.12,.08,.133],[.12,.132,.133],[.118,.145,.12]],.0045,p,0x687a75);
  // Eight separate louvers fixed to the case; the old 52 mm strips overlapped
  // on a 14 mm pitch and shared the case's side plane.
  for(let i=0;i<8;i++)localBox(.004,.014,.006,p,0x7f897e,-.152,.06,-.059+i*.014,glaze);
  ball(.005,p,0x74ad55,.095,.053,.124,1,1,.3);decal('warmer',.198,.043,p,-.012,.106,.126);
 });
 // Red lanterns along the counter, between the bell pendants.
 const paperRadius=y=>.102-.044*(Math.abs(y)/.13)**3;
 for(const placement of layout.lanterns||[-3.05,-1.55,-.05,1.45].map(x=>({x,y:2.62,z:-1.72})))item('Paper counter lantern '+placement.x,placement,p=>{
  lathe(Array.from({length:27},(_,i)=>{const y=-.13+i*.01;return [paperRadius(y),y];}),p,0xb92e20,0,0,0,glow);
  for(let i=0;i<12;i++){const y=-.116+i*.021;ring(paperRadius(y)+.0006,.0011,p,0x80372b,0,y,0,solids);}
  for(const y of [-.137,.137]){localCyl(.060,.015,p,0x27281e,0,y);ring(.057,.0025,p,0x5a4a32,0,y+(y>0?.01:-.01),0,solids);}
  const drop=p.drop??.55;localCyl(.0025,drop,p,0x3a3023,0,.149+drop/2,0,.0025,solids,6);
  for(const yaw of [0,Math.PI]){
   const label=curvedPrint('lantern',.1036,.17,.84,20),v=label.attributes.position;
   for(let i=0;i<v.count;i++){const y=v.getY(i),a=Math.atan2(v.getX(i),v.getZ(i)),r=paperRadius(y)+.0016;v.setXYZ(i,Math.sin(a)*r,y,Math.cos(a)*r);}label.computeVertexNormals();label.rotateY(yaw);piece(label,p,prints);
  }
 });
 // The tanuki by the door: straw hat, sake flask, a belly for luck.
 const T=layout.tanuki||{x:2.25,y:0,z:5.78};
 item('Glazed lucky tanuki',{x:T.x,y:T.y||0,z:T.z,scale:T.scale||1},p=>{
  localCyl(.173,.025,p,0x5f4a32,0,.0125);ball(.19,p,0x72543a,0,.26,0,1,1.13,.89);
  // The belly glaze follows the pot's surface. Intersecting two separate ellipsoids
  // left the cream patch disappearing into brown triangles at oblique angles.
  const belly=new THREE.BufferGeometry(),bp=[],bi=[],rings=8,segments=24;
  const bellyVertex=(x,y)=>bp.push(x,y,-.19*.89*Math.sqrt(Math.max(0,1-(x/.19)**2-((y-.26)/(.19*1.13))**2))-.0012);
  bellyVertex(0,.249);
  for(let j=1;j<=rings;j++)for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments,u=j/rings;bellyVertex(Math.cos(a)*.137*u,.249+Math.sin(a)*.158*u);}
  for(let i=0;i<segments;i++)bi.push(0,1+(i+1)%segments,1+i);
  for(let j=0;j<rings-1;j++)for(let i=0;i<segments;i++){const a=1+j*segments+i,b=1+j*segments+(i+1)%segments,c=a+segments,d=b+segments;bi.push(a,b,d,a,d,c);}
  belly.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));belly.setIndex(bi);belly.computeVertexNormals();piece(belly,p,glaze,0xe0cfaa);
  ball(.003,p,0x967a55,0,.206,-.1705,1,1,.45);
  ball(.119,p,0x795b3d,0,.541,0,1,.99,.90);
  for(const sx of [-1,1]){
   ball(.041,p,0x705036,sx*.091,.618,-.006,.76,1,.68);ball(.026,p,0xac8c69,sx*.091,.622,-.025,.71,.83,.37);
   ball(.051,p,0x563e2d,sx*.048,.557,-.087,1,.78,.45);ball(.032,p,0xe5d9bb,sx*.052,.559,-.105,.74,.82,.49);ball(.014,p,0x251e16,sx*.052,.561,-.120,.80,1,.45);ball(.0034,p,0xffefd0,sx*.048,.568,-.126);
   ball(.05,p,0x765738,sx*.14,.355,-.026,.69,1.25,.71);ball(.041,p,0x9a7751,sx*.156,.316,-.072,.70,.70,.63);
   ball(.063,p,0x70523a,sx*.10,.046,-.065,.79,.52,1.14);for(let i=0;i<2;i++)localBox(.001,.018,.016,p,0x4b3927,sx*.10-.011+i*.021,.054,-.116);
  }
  ball(.03,p,0xbaa180,0,.503,-.104,1.30,.61,.70);ball(.02,p,0x33271c,0,.524,-.126,1,.63,.68);
  tube([[-.021,.492,-.120],[0,.484,-.125],[.021,.492,-.120]],.002,p,0x59422c);
  // Straw hat: open brim, overlapping plait rings and a pressed crown.
  ring(.155,.018,p,0xa78b55,0,.645,0,solids);
  lathe([[.18,.646],[.185,.653],[.14,.661],[.114,.69],[.058,.731],[.008,.744]],p,0xbe9d61,0,0,0,solids);
  for(const [r,y] of [[.171,.652],[.149,.661],[.125,.68],[.095,.704],[.060,.728]])ring(r,.0015,p,0x977846,0,y,0,solids);
  for(let i=0;i<16;i++){const a=i*Math.PI/8;localBox(.018,.0015,.0018,p,0xd4b67e,Math.sin(a)*.171,.654,Math.cos(a)*.171);}
  ball(.04,p,0x705036,0,.197,.143,.9,1.4,.92);
  // A real sake flask in one hand and the stamped account book in the other.
  const q={x:p.x+.168*p.scale,y:p.y+.176*p.scale,z:p.z-.069*p.scale,yaw:Math.PI,scale:p.scale};
  lathe([[0,0],[.021,0],[.032,.012],[.034,.075],[.026,.091],[.014,.105],[.014,.134],[.017,.137],[.017,.143],[.010,.143],[.009,.109],[0,.012]],q,0xd5c59e);
  wrap('flask',.0345,.059,q,0,.051,0,1.65);ring(.015,.0012,q,0x8d7351,0,.138);
  const book=new THREE.BoxGeometry(.063,.098,.014);book.setIndex(Array.from(book.index.array).slice(0,30));
  piece(book,p,solids,0x987640,-.151,.337,-.139);decal('bill',.063,.098,{...p,yaw:Math.PI},.151,.337,.146);
 });
 if(collider){collider(T.x,T.z,.42,.38,.8);collider(K.x+K.depth/2,K.z,K.depth,K.width,2.0);}
 const group=new THREE.Group();group.name='Minato 1997 dressing';room.add(group);
 const posters=new THREE.Mesh(mergeGeometries(prints),new THREE.MeshStandardMaterial({map:sheet(),roughness:.9,alphaTest:.4}));posters.name='Minato posters and tags';group.add(posters);
 const props=new THREE.Mesh(mergeGeometries(solids),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6}));props.name='Minato table and counter things';group.add(props);
 const ceramic=new THREE.Mesh(mergeGeometries(glaze),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.24,metalness:.12}));ceramic.name='Minato glaze and appliance fittings';group.add(ceramic);
 if(glow.length){const lanterns=new THREE.Mesh(mergeGeometries(glow),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,emissive:0x5a1408,emissiveIntensity:.8}));lanterns.name='Minato red lanterns';group.add(lanterns);}
 group.add(bottles);
 [...prints,...solids,...glaze,...glow].forEach(g=>g.dispose());
 group.userData.realItems=placements;
 return {group,bottles,placements};
}
