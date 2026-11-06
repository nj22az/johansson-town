import * as THREE from '../../vendor/three.module.js';
import {HOUSEHOLDS} from '../people/households.js';
import {windowGlow} from '../render/dusk.js';
import {YARD_HOMES} from './yard-homes-layout.js';
import {glazeWithRoom} from '../render/window-interior.js';
import {TETSUO_BACK_WINDOW} from './interiors/tetsuo-flat.js';

/**
 * The yard house behind Front-Row Books & Workshop (yard-homes-layout.js).
 *
 * A small Okinawan concrete-block house, Tetsuo's, flat-roofed with a water tank and a TV aerial (the tiled one
 * beside it, 1 Front-Row Yard, went in phase 4 of the consolidation). It is a home site, so its door works like
 * every other door in town — walk in at any hour, including while he is asleep in bed (home-residents.js puts him
 * there). Windows light up in the evening.
 */
const MARU='"Hiragino Maru Gothic ProN","M PLUS Rounded 1c","Yu Gothic","Noto Sans CJK JP",sans-serif';

export function buildYardHomes(world,options){
 const group=new THREE.Group();group.name='Front-Row yard homes';world.group.add(group);
 const std=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.85,...extra});
 const mesh=(g,m,x,y,z,name)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.name=name;o.castShadow=!!options.shadows;o.receiveShadow=true;group.add(o);return o;};
 const glass=[],homes=world.homes instanceof Map?world.homes:new Map();
 // Every yard house in the layout is built; one without a household would be to let.
 for(const [id,spec] of Object.entries(YARD_HOMES)){
  const household=HOUSEHOLDS.find(h=>h.id===id)||null,title=household?.title||'House to let';
  const {x,z,w,d,height:h}=spec,front=Math.sign(spec.doorFace-z);
  // Walls: a block of painted concrete on a low grey plinth.
  mesh(new THREE.BoxGeometry(w+.1,.18,d+.1),std(0x9a968c),x,.09,z,'Yard home plinth');
  mesh(new THREE.BoxGeometry(w,h,d),std(spec.walls),x,h/2+.18,z,'Yard home walls');
  // Roof: red tiles in a shallow hip with a shisa, or a flat slab with a water tank.
  if(spec.roof==='tile'){
   // The quarter turn is baked into the cone before it is stretched to the house's
   // depth: as a rotation on the mesh, the stretch ran along a diagonal and sheared the
   // roof into a skewed rhombus, crooked against the walls and the street grid.
   const roofGeometry=new THREE.ConeGeometry(Math.hypot(w,w)*.62,1.1,4,1);roofGeometry.rotateY(Math.PI/4);
   const roof=mesh(roofGeometry,std(0xc4553a,{roughness:.7}),x,h+.18+.55,z,'Yard home tiled roof');roof.scale.set(1,1,d/w);
   const shisa=new THREE.Group();shisa.position.set(x,h+.18+1.12,z);shisa.name='Shisa';group.add(shisa);
   const clay=std(0xd2804a,{roughness:.9});
   const body=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),clay);body.scale.set(1,.9,1.2);shisa.add(body);
   const head=new THREE.Mesh(new THREE.SphereGeometry(.11,10,8),clay);head.position.set(0,.13,.1*front);shisa.add(head);
   const mane=new THREE.Mesh(new THREE.TorusGeometry(.1,.035,6,12),std(0x9a4a2a));mane.position.copy(head.position);mane.rotation.x=Math.PI/2;shisa.add(mane);
  }else{
   mesh(new THREE.BoxGeometry(w+.3,.16,d+.3),std(0xcfc9bc),x,h+.26,z,'Yard home roof slab');
   mesh(new THREE.CylinderGeometry(.42,.42,.9,16),std(0x2a8fcc,{roughness:.5}),x-w*.25,h+.8,z-d*.2,'Yard home water tank');
   const mast=mesh(new THREE.CylinderGeometry(.02,.02,1.4,6),std(0x9aa3a0,{metalness:.4}),x+w*.3,h+1.05,z+d*.2,'Yard home aerial');void mast;
   for(let i=0;i<4;i++){const rod=mesh(new THREE.CylinderGeometry(.01,.01,.7-i*.12,4),std(0x9aa3a0),x+w*.3,h+1.5+i*.1,z+d*.2,'Yard home aerial rod');rod.rotation.z=Math.PI/2;}
  }
  // The front: a wooden door with a small canopy, two windows, a nameplate.
  const face=spec.doorFace+front*.01,doorX=spec.door[0];
  mesh(new THREE.BoxGeometry(.95,2.0,.06),std(0x8a5a36),doorX,1.18,face,'Yard home door');
  mesh(new THREE.BoxGeometry(1.3,.08,.6),std(spec.trim),doorX,2.36,face+front*.28,'Yard home canopy');
  for(const wx of [doorX-1.35,x-w/2+.55]){
   if(Math.abs(wx-doorX)<.8)continue;
   mesh(new THREE.BoxGeometry(.95,.8,.05),std(spec.trim),wx,1.55,face,'Yard home window frame');
   const pane=new THREE.MeshStandardMaterial({color:0x9fc4d6,emissive:0xffd89a,emissiveIntensity:0,roughness:.2});glass.push(pane);
   glazeWithRoom(mesh(new THREE.PlaneGeometry(.82,.66),pane,wx,1.55,face+front*.03,'Yard home window')).rotation.y=front>0?0:Math.PI;
  }
  const plate=document.createElement('canvas');plate.width=256;plate.height=96;const ctx=plate.getContext('2d');
  ctx.fillStyle='#f4e4c8';ctx.fillRect(0,0,256,96);ctx.strokeStyle='#6b4a1c';ctx.lineWidth=6;ctx.strokeRect(3,3,250,90);
  ctx.fillStyle='#3b3f55';ctx.font=`bold 30px ${MARU}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(household?household.residents.join(' · '):'貸家 · To let',128,40);
  ctx.font=`18px ${MARU}`;ctx.fillText(spec.address,128,74);
  const tex=new THREE.CanvasTexture(plate);tex.colorSpace=THREE.SRGBColorSpace;
  mesh(new THREE.PlaneGeometry(.5,.19),new THREE.MeshStandardMaterial({map:tex,roughness:.8}),doorX+.75,1.55,face+front*.02,'Yard home nameplate').rotation.y=front>0?0:Math.PI;
  // A little of who lives there by the door.
  if(household){
   // Tetsuo's: a crate of radio chassis waiting for the workshop, and his bicycle. Round the back, the window of
   // his tatami room, with its shoji (interiors/tetsuo-flat.js TETSUO_BACK_WINDOW).
   mesh(new THREE.BoxGeometry(.5,.32,.38),std(0x9a7a4c),doorX-1.0,.34,face+front*.42,'Crate of radio chassis');
   for(let i=0;i<3;i++)mesh(new THREE.BoxGeometry(.3,.12,.2),std([0x5a5048,0x7a6e5e,0x3d4a52][i]),doorX-1.05+i*.04,.56+i*.12,face+front*.42,'Old radio chassis');
   const sw=Math.sign((spec.door[0]-x)*front)||1,back=z-front*d/2-front*.01,wx=x+front*sw*((TETSUO_BACK_WINDOW.x0+TETSUO_BACK_WINDOW.x1)/2),ww=TETSUO_BACK_WINDOW.x1-TETSUO_BACK_WINDOW.x0,wh=TETSUO_BACK_WINDOW.head-TETSUO_BACK_WINDOW.sill,wy=.18+(TETSUO_BACK_WINDOW.head+TETSUO_BACK_WINDOW.sill)/2;
   mesh(new THREE.BoxGeometry(ww+.1,wh+.1,.05),std(0xb9bec0,{metalness:.4}),wx,wy,back,'Back window frame (aluminium sash)');
   const pane=new THREE.MeshStandardMaterial({color:0xb7c4c4,emissive:0xffd89a,emissiveIntensity:0,roughness:.25});glass.push(pane);
   mesh(new THREE.PlaneGeometry(ww-.04,wh-.04),pane,wx,wy,back-front*.03,'Back window (shoji behind the glass)').rotation.y=front>0?Math.PI:0;
   mesh(new THREE.BoxGeometry(.04,wh,.06),std(0xb9bec0,{metalness:.4}),wx,wy,back-front*.04,'Back window meeting rail');
  }else{
   // To let: the agent's board by the door and a swept step.
   mesh(new THREE.BoxGeometry(.4,.28,.03),std(0xf3efe2),doorX-1.0,1.3,face+front*.02,'To-let board');
   mesh(new THREE.CylinderGeometry(.14,.11,.26,10),std(0x8a6a46),doorX-1.0,.31,face+front*.4,'Empty flower pot');
  }
  world.colliders.push({x,z,w:w+.1,d:d+.1,height:h+.4,id:'yard-home'});
  // The home site: its door, who lives there, and the heading you walk in with.
  let site=options.sites.find(s=>s.id===id);
  if(!site){site={id,jp:"Home",sub:'FRONT-ROW YARD',color:0xd4c6ad,accent:'#776953'};options.sites.push(site);}
  Object.assign(site,{title,line:spec.address,door:[spec.door[0],.02,spec.door[1]],entryFacing:spec.inward,x:spec.door[0],z:spec.door[1]});
  if(household)Object.assign(site,{homeOwner:household.residents[0],homeOwners:[...household.residents],homeEntry:'yard-'+spec.number});
  else Object.assign(site,{familyHome:{members:[],toLet:true},houseKind:'concrete',ownRoom:true});
  site.exitPosition=[...site.door];
  for(const name of household?.residents||[])homes.set(name,{owner:name,household:id,address:spec.address,door:[...spec.door],building:'front-row-yard',occupied:false});
  const anchor=new THREE.Object3D();anchor.name='yard home entrance:'+id;anchor.position.set(spec.door[0],1.3,spec.door[1]);group.add(anchor);
  options.register?.(anchor,(household?'Visit ':'Look round the ')+title,()=>options.enter(site));
 }
 world.homes=homes;
 const previous=world.updateHomes;
 world.updateHomes=minutes=>{previous?.(minutes);const glow=windowGlow(minutes);for(const pane of glass)pane.emissiveIntensity=glow*.7;};
 return group;
}
