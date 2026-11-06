import * as THREE from '../../../vendor/three.module.js';

/** The owner's ferry-terminal reference, scaled to Minato's existing 9 x 7 m hall.
 * An older building still in use in 1997: material wear, not a second engine or a new port.
 */
export const PORT_HALL_FINISH=Object.freeze({wall:0xd8cfba,dado:0x7b8174,concrete:0xa39b8a,orange:0xb65f35,olive:0x65694a,timber:0x906846,metal:0x9caaa4});

function random(seed){let state=seed;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function paintHallFloor(ctx,w,h){
 const rand=random(1975);ctx.fillStyle='#b1a796';ctx.fillRect(0,0,w,h);
 const colours=['#6c685d','#d5ccba','#8d8576','#c8bcaa','#7e8b83'];
 for(let i=0;i<2400;i++){ctx.fillStyle=colours[i%colours.length];ctx.fillRect(rand()*w,rand()*h,1+rand()*3,1+rand()*2);}
 ctx.strokeStyle='#8f897b';ctx.lineWidth=1.5;
 for(let i=0;i<=9;i++){ctx.beginPath();ctx.moveTo(i*w/9,0);ctx.lineTo(i*w/9,h);ctx.stroke();}
 for(let i=0;i<=7;i++){ctx.beginPath();ctx.moveTo(0,i*h/7);ctx.lineTo(w,i*h/7);ctx.stroke();}
}
export function paintHallPlywood(ctx,w,h){
 const rand=random(1976);ctx.fillStyle='#9a724c';ctx.fillRect(0,0,w,h);
 for(let i=0;i<180;i++){ctx.fillStyle=i%2?'rgba(48,29,17,.10)':'rgba(243,210,166,.10)';ctx.fillRect(rand()*w,0,1+rand()*2,h);}
 for(let i=0;i<=8;i++){ctx.fillStyle='#684c35';ctx.fillRect(i*w/8,0,2,h);}
 const wear=ctx.createLinearGradient(0,h*.65,0,h);wear.addColorStop(0,'rgba(43,34,22,0)');wear.addColorStop(1,'rgba(43,34,22,.24)');ctx.fillStyle=wear;ctx.fillRect(0,0,w,h);
}

export function paintHallConcrete(ctx,w,h){
 const rand=random(1977);ctx.fillStyle='#b3ac9b';ctx.fillRect(0,0,w,h);
 for(let i=0;i<700;i++){ctx.fillStyle=i%2?'rgba(51,48,40,.06)':'rgba(243,237,219,.12)';ctx.fillRect(rand()*w,rand()*h,1+rand()*3,1+rand()*2);}
 for(let i=0;i<16;i++){ctx.fillStyle='rgba(65,68,54,.035)';ctx.fillRect(rand()*w,rand()*h,w*(.02+rand()*.05),h*(.05+rand()*.25));}
 ctx.strokeStyle='rgba(64,59,48,.09)';ctx.lineWidth=1;
 for(let y=h/4;y<h;y+=h/4){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
}

/** Shared geometry/materials keep the small architectural fittings inexpensive. */
export function finishPortHall({group,w,d,h,box,panel}){
 const F=PORT_HALL_FINISH,hw=w/2,hd=d/2;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');if(ctx)paintHallConcrete(ctx,256,256);
 const concreteTexture=new THREE.CanvasTexture(canvas);concreteTexture.colorSpace=THREE.SRGBColorSpace;
 const concrete=new THREE.MeshStandardMaterial({color:0xffffff,map:concreteTexture,roughness:.94});
 for(const x of [-hw+.08,hw-.08])for(const z of [-2.6,.15,2.7])box('Exposed concrete pier',[.16,h,.2],[x,h/2,z],concrete);
 for(const z of [-2.6,.15,2.7])box('Concrete ceiling crossbeam',[w,.17,.18],[0,h-.085,z],concrete);
 box('Concrete ceiling spine',[.18,.17,d],[0,h-.085,0],concrete);

 const steel=new THREE.MeshStandardMaterial({color:F.metal,roughness:.52,metalness:.35});
 const bladeMaterial=new THREE.MeshStandardMaterial({color:0x82948a,roughness:.65,metalness:.15});
 const fanBlade=new THREE.BoxGeometry(.23,.015,.075),fanHub=new THREE.CylinderGeometry(.045,.045,.06,8),cageGeometry=new THREE.SphereGeometry(.29,12,6);
 const cageMaterial=new THREE.MeshStandardMaterial({color:0xaaa99a,wireframe:true,roughness:.65});
 const fans=[];
 for(const z of [-1.4,1.7]){
  const fan=new THREE.Group();fan.name='Caged terminal fan';fan.position.set(0,h-.43,z);group.add(fan);
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.25,6),steel);rod.position.y=.17;fan.add(rod);
  const cage=new THREE.Mesh(cageGeometry,cageMaterial);cage.scale.y=.4;fan.add(cage);
  const blades=new THREE.Group();blades.name='Terminal fan blades';fan.add(blades);fans.push(blades);
  const hub=new THREE.Mesh(fanHub,steel);blades.add(hub);
  for(let i=0;i<3;i++){const pivot=new THREE.Group();pivot.rotation.y=i*Math.PI*2/3;const blade=new THREE.Mesh(fanBlade,bladeMaterial);blade.position.x=.14;pivot.add(blade);blades.add(pivot);}
 }
 // A practical handset and a small bin by the entrance; neither narrows the central doorway.
 box('Public telephone cabinet',[.13,.42,.28],[-hw+.12,1.45,2.55],0x414c44);
 box('Public telephone handset',[.08,.26,.065],[-hw+.21,1.45,2.55],0x202820);
 panel('Public telephone plate',.34,.13,[-hw+.035,1.83,2.55],Math.PI/2,(x,cw,ch)=>{x.fillStyle='#eee5cf';x.fillRect(0,0,cw,ch);x.fillStyle='#344139';x.textAlign='center';x.textBaseline='middle';x.font=`700 ${ch*.5}px sans-serif`;x.fillText('公衆電話',cw/2,ch/2);},256);
 const bin=new THREE.Mesh(new THREE.CylinderGeometry(.16,.13,.45,12),new THREE.MeshStandardMaterial({color:0x727b70,roughness:.8}));bin.name='Terminal litter bin';bin.position.set(-hw+.22,.225,1.95);group.add(bin);
 panel('Island travel poster',.5,.72,[2.65,1.75,-hd+.015],0,(x,cw,ch)=>{
  x.fillStyle='#eee5cf';x.fillRect(0,0,cw,ch);x.fillStyle='#73b7bf';x.fillRect(cw*.07,ch*.07,cw*.86,ch*.65);x.fillStyle='#2c8e87';x.fillRect(cw*.07,ch*.45,cw*.86,ch*.27);
  x.fillStyle='#f6f0e0';x.beginPath();x.moveTo(cw*.18,ch*.49);x.lineTo(cw*.82,ch*.49);x.lineTo(cw*.73,ch*.58);x.lineTo(cw*.25,ch*.58);x.closePath();x.fill();x.fillRect(cw*.32,ch*.4,cw*.32,ch*.09);
  x.fillStyle='#33463e';x.textAlign='center';x.font=`700 ${ch*.055}px sans-serif`;x.fillText('北野島へ',cw/2,ch*.83);x.font=`600 ${ch*.032}px sans-serif`;x.fillText('KITANO-JIMA',cw/2,ch*.91);
 },256);
 return {tick(time){fans.forEach((fan,i)=>{fan.rotation.y=time*(5.2+i*.3);});}};
}
