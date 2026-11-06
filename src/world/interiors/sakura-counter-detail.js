import {SAKURA_FONT,refreshSakuraPrint} from './sakura-print.js';
import {FURNITURE_HEIGHTS,TILL_TOP} from '../furniture-standards.js';
import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {CHILLER,SAKURA_TILL_CABINET,COPY_MACHINE} from './sakura-layout.js';
import {HOT_SNACKS} from '../../commerce/konbini.js';

// The equipment sits on existing counter/cabinet tops; these are not new floor obstacles.
export const SAKURA_EQUIPMENT=Object.freeze({
 register:Object.freeze({minX:4.60,maxX:4.99,minZ:.98,maxZ:1.415,minY:FURNITURE_HEIGHTS.serviceCounter,maxY:TILL_TOP}),
 scanner:Object.freeze({minX:4.62,maxX:4.80,minZ:.24,maxZ:.44,minY:FURNITURE_HEIGHTS.serviceCounter,maxY:FURNITURE_HEIGHTS.serviceCounter+.14}),
 cardTray:Object.freeze({minX:4.565,maxX:4.695,minZ:.47,maxZ:.65,minY:FURNITURE_HEIGHTS.serviceCounter,maxY:FURNITURE_HEIGHTS.serviceCounter+.045}),
 microwave:Object.freeze({minX:6.24,maxX:6.59,minZ:1.425,maxZ:1.775,minY:.722,maxY:.936}),
 supplies:Object.freeze({minX:6.27,maxX:6.58,minZ:1.145,maxZ:1.365,minY:.722,maxY:.93}),
 copy:Object.freeze({minX:1.75,maxX:2.45,minZ:3.18,maxZ:3.82,minY:.5,maxY:1.01}),
});
export const SAKURA_DETAIL_PRINTS=Object.freeze([
 {id:'pos',title:'SAKURA SHOP',line:'REGISTER READY',foot:'Thank you'},
 {id:'customer',title:'WELCOME',line:'Cash / phone cards',foot:'Tax included'},
 {id:'receipt',title:'SAKURA SHOP',line:'1 item · tax incl.',foot:'PAID · THANK YOU'},
 {id:'tray',title:'CHANGE TRAY',line:'Please place cash here',foot:'SAKURA'},
 {id:'microwave',title:'WARM MEAL',line:'30s   60s   90s',foot:'Please ask Thuan'},
 {id:'rice',title:'RICE BALLS & BENTO',line:'Prepared for today',foot:'Keep refrigerated'},
 {id:'sandwich',title:'SANDWICHES & BREAD',line:'A quick harbour lunch',foot:'Fresh every morning'},
 {id:'dairy',title:'PUDDING & YOGHURT',line:'Chilled favourites',foot:'Keep refrigerated'},
 {id:'hot',title:'HOT SNACKS',line:'Nikuman ¥'+HOT_SNACKS.find(s=>s.id==='nikuman').cost,foot:'Fresh from the warmer'},
 {id:'supplies',title:'COUNTER SUPPLIES',line:'Bags / cups / chopsticks',foot:'Staff stock'},
 {id:'scan',title:'SCAN',line:'||||| || ||||| |||',foot:'SAKURA'},
 {id:'copy',title:'COPY / FAX',line:'Copy ¥10 · Fax ¥50',foot:'Please ask Thuan'},
]);
const COLS=4,CELL_W=256,CELL_H=128,ROWS=3;
let printMaterial;
const bodyMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.68});
const materialForPrints=()=>{
 if(printMaterial)return printMaterial;
 let texture=null;
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=COLS*CELL_W;canvas.height=ROWS*CELL_H;
  const ctx=canvas.getContext('2d');drawSakuraDetailPrints(ctx);
  texture=new THREE.CanvasTexture(canvas);
  refreshSakuraPrint(texture,drawSakuraDetailPrints,SAKURA_DETAIL_PRINTS.map(p=>p.title+p.line+p.foot).join(''));texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 }
 printMaterial=new THREE.MeshBasicMaterial({map:texture,color:texture?0xffffff:0xf4ead4,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4});
 printMaterial.name='Sakura equipment and category print atlas';return printMaterial;
};
/** Separate baselines, fixed gutters and bounded text widths survive small displays. */
export function drawSakuraDetailPrints(ctx){
 ctx.fillStyle='#eee9de';ctx.fillRect(0,0,COLS*CELL_W,ROWS*CELL_H);
 SAKURA_DETAIL_PRINTS.forEach((p,i)=>{
  ctx.save();ctx.translate(i%COLS*CELL_W,Math.floor(i/COLS)*CELL_H);
  const lcd=p.id==='pos'||p.id==='customer';
  ctx.fillStyle=lcd?'#bfd2ad':'#fff8e7';ctx.fillRect(4,4,248,120);
  ctx.fillStyle=lcd?'#2c4934':'#356052';ctx.fillRect(8,8,240,30);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff7df';
  ctx.font=`700 19px ${SAKURA_FONT}`;ctx.fillText(p.title,128,23,226);
  ctx.fillStyle=lcd?'#243d2b':'#34352b';ctx.font=`700 20px ${SAKURA_FONT}`;ctx.fillText(p.line,128,65,226);
  ctx.fillStyle='#9c4734';ctx.font=`700 15px ${SAKURA_FONT}`;ctx.fillText(p.foot,128,103,226);
  ctx.restore();
 });
}
function batch(name){
 const bodies=[],prints=[],colour=new THREE.Color(),features=[];
 const part=(geometry,hex,pos=[0,0,0],rotation=null)=>{
  if(rotation)geometry.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rotation)));
  geometry.translate(...pos);colour.set(hex);const c=new Float32Array(geometry.attributes.position.count*3);
  for(let i=0;i<c.length;i+=3)c.set([colour.r,colour.g,colour.b],i);geometry.setAttribute('color',new THREE.BufferAttribute(c,3));bodies.push(geometry);
 };
 const box=(w,h,d,x,y,z,c)=>part(new THREE.BoxGeometry(w,h,d),c,[x,y,z]);
 const cyl=(r,h,x,y,z,c,rb=r)=>part(new THREE.CylinderGeometry(r,rb,h,10),c,[x,y,z]);
 const print=(id,w,h,pos,yaw=0,flat=false)=>{
  const index=SAKURA_DETAIL_PRINTS.findIndex(p=>p.id===id);if(index<0)throw Error('Unknown Sakura print '+id);
  const g=new THREE.PlaneGeometry(w,h);if(flat)g.rotateX(-Math.PI/2);else g.rotateY(yaw);g.translate(...pos);
  const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(index%COLS+.03+uv.getX(i)*.94)/COLS,1-(Math.floor(index/COLS)+.03+(1-uv.getY(i))*.94)/ROWS);
  prints.push(g);features.push({id,width:w,height:h,position:[...pos],yaw,flat});
 };
 const finish=()=>{
  const group=new THREE.Group();group.name=name;group.userData.features=features;
  for(const [parts,material,suffix] of [[bodies,bodyMaterial,' bodies'],[prints,materialForPrints(),' print']])if(parts.length){
   const normalized=parts.map(g=>g.index?g.toNonIndexed():g),geometry=mergeGeometries(normalized);
   parts.forEach(g=>g.dispose());normalized.forEach((g,i)=>{if(g!==parts[i])g.dispose();});
   geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const mesh=new THREE.Mesh(geometry,material);mesh.name=name+suffix;mesh.receiveShadow=true;mesh.userData.preserveMaterial=true;group.add(mesh);
  }
  return group;
 };
 return {part,box,cyl,print,finish};
}

/** A 1997 cash register, not a flat blank block, and the clerk's actual working supplies. */
export function buildSakuraCounterDetail(room){
 const b=batch('Sakura checkout equipment'),{box,cyl,print}=b;
 const cream=0xe3e5d8,dark=0x3d4946,key=0xf2efe3,steel=0x9aa9a4;
 const top=FURNITURE_HEIGHTS.serviceCounter,registerZ=1.17,dz=registerZ-.75;
 // The low register sits beside the clerk's face line, with all equipment on the counter.
 box(.38,.075,.38,4.80,top+.0375,registerZ,cream);box(.012,.018,.30,4.608,top+.031,registerZ,dark);box(.30,.05,.31,4.81,top+.10,registerZ,dark);
 box(.035,.016,.11,4.635,top+.093,.62+dz,steel);
 box(.10,.12,.12,4.87,top+.185,.80+dz,cream);box(.095,.13,.28,4.68,top+.185,registerZ,dark);
 print('pos',.232,.10,[4.6285,top+.185,registerZ],-Math.PI/2);
 for(let r=0;r<4;r++)for(let c=0;c<3;c++)box(.034,.012,.032,4.84+r*.027,top+.1375,.60+c*.041+dz,c===2&&r===3?0x5f916a:key);
 box(.029,.008,.11,4.72,top+.139,.90+dz,0xb9c5b8);
 box(.027,.10,.026,4.79,top+.17,.90+dz,steel);box(.04,.065,.19,4.77,top+.225,1.32,dark);
 print('customer',.17,.047,[4.746,top+.225,1.32],-Math.PI/2);
 box(.12,.011,.014,4.78,top+.081,1.29,dark);
 print('receipt',.095,.155,[4.782,top+.089,1.32],0,true);
 // Scanner and change tray remain separate, clear of the staff's sight line.
 box(.15,.036,.17,4.71,top+.018,.34,dark);box(.055,.075,.10,4.67,top+.073,.34,cream);
 box(.008,.047,.078,4.638,top+.08,.34,0x713d31);print('scan',.069,.035,[4.633,top+.08,.34],-Math.PI/2);
 const trayZ=.56;
 box(.13,.012,.18,4.63,top+.006,trayZ,0x3d7184);
 for(const x of [4.57,4.69])box(.01,.032,.18,x,top+.027,trayZ,0x528e9f);
 for(const z of [trayZ-.085,trayZ+.085])box(.11,.032,.01,4.63,top+.027,z,0x528e9f);
 print('tray',.103,.145,[4.63,top+.0135,trayZ],0,true);
 // Microwave in the existing cabinet's middle bay. No part enters the staff aisle.
 box(.33,.205,.35,6.42,.8245,1.60,cream);box(.014,.145,.285,6.255,.825,1.60,dark);
 box(.008,.126,.207,6.246,.825,1.57,0x394f4b);
 box(.008,.12,.015,6.244,.825,1.678,steel);
 box(.006,.025,.27,6.249,.914,1.585,dark);print('microwave',.26,.023,[6.241,.914,1.585],-Math.PI/2);
 for(let i=0;i<3;i++)box(.01,.012,.016,6.246,.87-i*.03,1.746,i?0xc6cabf:0x659269);
 // Stacks of folded bags, nested paper cups and chopsticks in their sleeve.
 for(let i=0;i<7;i++)box(.25,.005,.115,6.42,.726+i*.006,1.215,i%2?0xccb284:0xdfcda9);
 for(let i=0;i<5;i++)cyl(.036,.05,6.39,.79+i*.014,1.31,0xf4f0df,.025);
 box(.08,.13,.06,6.53,.793,1.29,0xd1bb91);
 for(let i=0;i<5;i++)box(.004,.165,.004,6.514+i*.008,.81,1.288,0x9f8051);
 const C=SAKURA_TILL_CABINET;
 print('supplies',.29,.045,[C.x0-.006,.698,1.285],-Math.PI/2);
 // The existing entry-side machine gains a scanner lid, keypad and a fed-out sheet.
 const P=COPY_MACHINE;
 box(.215,.018,.39,P.x+.125,.973,P.z+.05,0xf0efe4);
 box(.16,.01,.018,P.x+.125,.993,P.z-.123,dark);
 print('copy',.17,.095,[P.x-.125,.992,P.z-.15],0,true);
 for(let r=0;r<3;r++)for(let c=0;c<2;c++)box(.020,.008,.016,P.x-.245+c*.027,1.0,P.z-.205+r*.023,r===2&&c===1?0x63936d:key);
 box(.34,.009,.075,P.x,.53,P.z-.278,steel);
 box(.29,.002,.028,P.x,.537,P.z-.303,0xf7f2e2);
 // Canopy cards face the aisle, not the wall; separate bays make the offer readable.
 for(const [id,z] of [['rice',-.93],['sandwich',.43],['dairy',1.79]])print(id,1.19,.13,[CHILLER.x1-.172,CHILLER.canopy+.092,z],Math.PI/2);
 const group=b.finish();
 const drawer=new THREE.Mesh(new THREE.BoxGeometry(.24,.045,.28),new THREE.MeshStandardMaterial({color:dark,roughness:.68}));
 drawer.name='Sakura cash drawer';drawer.position.set(4.84,top+.035,registerZ);group.add(drawer);
 room.add(group);return group;
}

/** Three occupied trays in the current hot case, in one shared vertex-colour draw. */
export function buildSakuraHotFood(room,C){
 const b=batch('Sakura warmer food'),{part,box,cyl,print}=b,cx=C.x,cz=C.z;
 const levels=[C.top+.065,C.top+.165,C.top+.265];
 for(const y of levels)box(C.w-.04,.008,C.d-.04,cx,y,cz,0xb8b7a1);
 for(let i=0;i<4;i++){
  const z=cz-.165+i*.108,y=levels[0];
  part(new THREE.SphereGeometry(.039,10,6).scale(1,.72,.95),0xf7f0da,[cx-.045,y+.032,z]);
  for(let j=0;j<3;j++)box(.004,.015,.018,cx-.061+j*.013,y+.057,z,0xe2d5bc);
 }
 for(let i=0;i<4;i++){
  const z=cz-.165+i*.108,y=levels[1];cyl(.034,.037,cx-.07,y+.023,z,0xb34033,.027);
  for(let k=0;k<3;k++)part(new THREE.IcosahedronGeometry(.019,0),0xd29948,[cx-.07+(k-1)*.018,y+.054+(k%2)*.006,z+(k-1)*.008]);
 }
 for(let i=0;i<3;i++){
  const z=cz-.14+i*.14,y=levels[2];
  part(new THREE.CapsuleGeometry(.015,.067,2,7),0xd49c43,[cx-.005,y+.021,z],[0,0,Math.PI/2]);
  box(.068,.005,.005,cx+.068,y+.021,z,0xe3cda1);
 }
 print('hot',C.d-.055,.042,[cx-C.w/2-.012,C.top+.03,cz],-Math.PI/2);
 const group=b.finish();room.add(group);return group;
}
