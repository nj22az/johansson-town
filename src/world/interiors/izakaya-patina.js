import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';

// Thin finishes sit on the existing furniture, never in a walking or serving lane.
// Keep the original bevels, floorboard gaps, shoji and timber posts visible.
export const MINATO_WORN_SURFACES=Object.freeze([
 // The commissioned walnut counter supplies its own finished slate top. An old
 // timber patina plane here would cover it and compete for the same depth.
 ...[[-3.5,2.2],[2.6,2]].map(([x,z])=>({name:'Dining table',kind:'wood',size:[2.43,1.28],position:[x,FURNITURE_HEIGHTS.table+.002,z],floor:true,color:0x795236})),
 ...[4.15,5].map(z=>({name:'Lounge table',kind:'wood',size:[.60,.60],position:[-4.6,FURNITURE_HEIGHTS.table+.002,z],floor:true,color:0x946844})),
 ...[.5,3.1].map(z=>({name:'Koagari table',kind:'wood',size:[.70,1.15],position:[5.3,.772,z],floor:true,color:0x795236})),
 {name:'West plaster',kind:'plaster',size:[12.6,2.54],position:[-6.297,2.32,0],yaw:Math.PI/2,color:0xb18d68},
 {name:'East plaster',kind:'plaster',size:[9.65,2.54],position:[6.297,2.32,1.525],yaw:-Math.PI/2,color:0xb18d68},
 // The entry wall's plaster stops at the street window (x -4.99…-2.81, 1.18…2.26 high),
 // which looks out on the real street.
 {name:'Entry plaster',kind:'plaster',size:[4.37,2.54],position:[4.08,2.32,6.297],yaw:Math.PI,color:0xb18d68},
 ...[[1.275,2.54,-5.6275,2.32],[.915,2.54,-2.3525,2.32],[2.18,1.33,-3.9,2.925],[2.18,.13,-3.9,1.115]].map(([w,h,x,y])=>({name:'Entry plaster',kind:'plaster',size:[w,h],position:[x,y,6.297],yaw:Math.PI,color:0xb18d68})),
 ...[4.15,5].flatMap(z=>[
  {name:'Lounge cushion',kind:'fabric',size:[.62,.68],position:[-5.62,FURNITURE_HEIGHTS.seat+.002,z],floor:true,color:0x7b7057},
  {name:'Lounge back',kind:'fabric',size:[.68,.59*FURNITURE_HEIGHTS.seat/.56],position:[-5.858,.88*FURNITURE_HEIGHTS.seat/.56,z],yaw:Math.PI/2,color:0x7b7057}
 ])
]);

function random(seed){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
function finishTexture(kind){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
 const c=canvas.getContext('2d'),r=random(kind==='wood'?1977:kind==='fabric'?871:422);
 c.fillStyle=kind==='wood'?'#f7ede0':kind==='fabric'?'#eee7da':'#f2eadc';c.fillRect(0,0,1024,512);
 if(kind==='wood'){
  // Wavering fine grain, occasional knots, polished edges and old cup rings.
  for(let i=0;i<145;i++){
   const y=r()*512;c.strokeStyle=`rgba(76,43,21,${.025+r()*.065})`;c.lineWidth=.4+r()*1.7;c.beginPath();
   for(let x=0;x<=1024;x+=16){const yy=y+Math.sin(x*.012+i)*1.9+Math.sin(x*.027+i)*.7;x?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();
  }
  for(let i=0;i<4;i++){
   const x=80+r()*864,y=60+r()*392;c.strokeStyle='rgba(91,51,26,.12)';c.lineWidth=1.2;c.beginPath();c.ellipse(x,y,36,7,r()*.18,0,Math.PI*2);c.stroke();
  }
  c.strokeStyle='rgba(79,47,26,.13)';c.lineWidth=2;
  for(const [x,y] of [[237,166],[772,334]]){c.beginPath();c.arc(x,y,31,.35,5.7);c.stroke();}
  for(let i=0;i<32;i++){c.strokeStyle='rgba(255,250,230,.35)';c.lineWidth=.7;c.beginPath();const x=r()*1024,y=r()*512;c.moveTo(x,y);c.lineTo(x+9+r()*38,y+(r()-.5)*2);c.stroke();}
 }else if(kind==='plaster'){
  // Smoke near the picture rail, patchy limewash and small hairline repairs.
  const smoke=c.createLinearGradient(0,0,0,512);smoke.addColorStop(0,'rgba(67,52,40,.24)');smoke.addColorStop(.28,'rgba(67,52,40,0)');smoke.addColorStop(.82,'rgba(67,52,40,0)');smoke.addColorStop(1,'rgba(67,52,40,.10)');c.fillStyle=smoke;c.fillRect(0,0,1024,512);
  for(let i=0;i<32;i++){const x=r()*1024,y=r()*512,g=c.createRadialGradient(x,y,0,x,y,30+r()*115);g.addColorStop(0,'rgba(115,93,66,.055)');g.addColorStop(1,'rgba(115,93,66,0)');c.fillStyle=g;c.fillRect(0,0,1024,512);}
  c.strokeStyle='rgba(82,65,48,.12)';c.lineWidth=.65;c.beginPath();c.moveTo(746,15);c.lineTo(748,47);c.lineTo(742,66);c.lineTo(746,92);c.stroke();
 }else{
  // Faded woven olive cloth, with darker piping supplied by the actual model.
  const worn=c.createRadialGradient(512,270,40,512,270,460);worn.addColorStop(0,'rgba(255,245,205,.18)');worn.addColorStop(1,'rgba(47,38,29,.15)');c.fillStyle=worn;c.fillRect(0,0,1024,512);
  c.lineWidth=.6;c.strokeStyle='rgba(40,36,24,.09)';c.beginPath();
  for(let x=0;x<1024;x+=5){c.moveTo(x,0);c.lineTo(x,512);}for(let y=0;y<512;y+=5){c.moveTo(0,y);c.lineTo(1024,y);}c.stroke();
 }
 for(let i=0;i<6500;i++){c.fillStyle=r()<.5?'rgba(55,44,29,.045)':'rgba(255,252,231,.1)';c.fillRect(r()*1024,r()*512,.6+r()*1.3,.6+r()*1.3);}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}

export function buildIzakayaPatina(room){
 const group=new THREE.Group();group.name='Minato aged finishes';
 const surfaces=[...MINATO_WORN_SURFACES];
 for(let i=0;i<40;i++)surfaces.push({name:'Worn floorboard',kind:'wood',size:[.304,12.6],position:[-6.24+i*.32,.042,0],floor:true,color:i%2?0x765333:0x65482f});
 for(const kind of ['wood','plaster','fabric']){
  const geometries=surfaces.filter(s=>s.kind===kind).map(s=>{
   const g=new THREE.PlaneGeometry(...s.size),colour=new THREE.Color(s.color),values=new Float32Array(g.attributes.position.count*3);
   for(let i=0;i<values.length;i+=3)colour.toArray(values,i);g.setAttribute('color',new THREE.BufferAttribute(values,3));
   if(s.name==='Worn floorboard'){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);uv.setXY(i,v,.03+u*.16);}}
   if(s.floor)g.rotateX(-Math.PI/2);else g.rotateY(s.yaw||0);
   g.translate(...s.position);return g;
  });
  const map=finishTexture(kind),mesh=new THREE.Mesh(mergeGeometries(geometries),new THREE.MeshStandardMaterial({map,vertexColors:true,roughness:kind==='wood'?.76:.98,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
  mesh.name='Minato worn '+kind;mesh.receiveShadow=true;mesh.userData.finishOnly=true;group.add(mesh);geometries.forEach(g=>g.dispose());
 }
 room.add(group);return group;
}
