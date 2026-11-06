import * as THREE from '../../vendor/three.module.js';
import {DOCK_WORKSHOP_PLOT as P} from './dock-workshop-layout.js';
/** Salt-worn industrial shed with a passenger entrance clear of the loading bay. */
export function buildDockWorkshop({parent,site,colliders,register,enter,label}){
 const group=new THREE.Group();group.name='Dock electrical workshop';parent.add(group);
 const materials=new Map(),mat=c=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.85}));return materials.get(c);};
 const box=(name,size,position,colour)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(colour));m.name=name;m.position.set(...position);m.receiveShadow=true;group.add(m);return m;};
 // The plinth stands 3 cm proud of the shed all round: flush, its faces flashed through the shed's walls on a phone.
 box('Industrial concrete plinth',[P.width+.06,.14,P.depth+.06],[P.x,.02,P.z],0x8b9192);
 box('Corrugated workshop shed',[P.width,3.3,P.depth],[P.x,1.65,P.z],0x8d9a9b);
 const front=P.z+P.depth/2;
 box('Low industrial roof',[P.width+.35,.18,P.depth+.4],[P.x,3.38,P.z],0x456570);
 for(let i=0;i<24;i++)box('Corrugated wall seam',[.035,3.1,.04],[P.x-P.width/2+.15+i*(P.width-.3)/23,1.6,front+.03],0x667f84);
 box('Loading bay shutter',[2.6,2.5,.07],[P.x+2.15,1.25,front+.065],0x526b73);
 for(let i=0;i<14;i++)box('Shutter slat',[2.5,.035,.03],[P.x+2.15,.13+i*.17,front+.12],0x829092);
 box('Staff entrance',[1.15,2.3,.09],[P.x,.0+1.15,front+.07],0x283f49);
 box('Entrance window',[.75,.65,.035],[P.x,1.65,front+.13],0xb2ced1);
 box('Rain canopy',[2.0,.13,1.1],[P.x,2.48,front+.45],0x456570);
 box('Electrical meter cabinet',[.8,.95,.2],[P.x-2.7,1.15,front+.12],0xd3d5c9);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;const ctx=canvas.getContext('2d');ctx.fillStyle='#294b60';ctx.fillRect(0,0,1024,192);ctx.fillStyle='#f8edce';ctx.textAlign='center';ctx.font='bold 46px sans-serif';ctx.fillText('DOCK ELECTRICAL & REPAIRS',512,78,970);ctx.font='26px sans-serif';ctx.fillText('CHIN & TETSUO · INSTRUMENTS · FORM 3D',512,140,970);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(P.width-.7,.7),new THREE.MeshBasicMaterial({map:texture}));sign.position.set(P.x,2.97,front+.1);group.add(sign);
 colliders.push({id:'dock-workshop',x:P.x,z:P.z,w:P.width,d:P.depth,height:3.5});
 Object.assign(site,{x:P.x,z:P.z,door:[...P.door],exitPosition:[...P.door],entryFacing:0});
 const entrance=new THREE.Object3D();entrance.name='Dock workshop entrance';entrance.position.set(P.door[0],1.1,P.door[2]);parent.add(entrance);register?.(entrance,'Enter '+site.title,()=>enter(site));
 return {id:site.id,group,entrance,update(){}};
}
