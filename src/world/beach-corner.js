import * as THREE from '../../vendor/three.module.js';
import {BEACH_CORNER,beachHeight} from './beach-layout.js';
import {SEA_LEVEL} from './ocean.js';

/**
 * A quiet corner of the east beach to sit and do nothing in.
 *
 * At the north end, away from the steps, a woven goza mat is laid on the dry sand under a
 * striped parasol and the shade of an adan (pandanus) on its stilt roots. Two low wooden
 * beach chairs face the sea. Someone has left sandals on the mat, a straw hat and a cool
 * box; a bleached driftwood log is pulled up for a footrest.
 *
 * The life here is for watching: sandpipers run the wash line and dart back from each
 * wave, a little egret stands in the shallows and now and then stabs at a fish, and terns
 * wheel overhead. The sound of it -- the swell, the wash, the birds and the odd splash --
 * comes from town-audio.js, louder the nearer you are and loudest in the chairs.
 */
export {BEACH_CORNER};
const C=BEACH_CORNER;
const sand=(x,z)=>beachHeight(x,z)??-.1;

/** The two chairs, as seats: looking east over the water. */
export const BEACH_CORNER_SEATS=Object.freeze([-.55,.55].map((dz,i)=>Object.freeze({
 id:'beach-chair-'+i,label:'Sit in the beach chair',beachCorner:true,
 position:[C.x,sand(C.x,C.z+dz),C.z+dz],stand:[C.x-1.05,sand(C.x-1.05,C.z+dz),C.z+dz],
 surfaceY:sand(C.x,C.z+dz)+.2575,eyeY:sand(C.x,C.z+dz)+.92,yaw:-Math.PI/2,pitch:.04,
 // (the canvas seat runs .5 m, its middle 2 cm ahead of the mark: its front edge is .27 m ahead, seat-slots.js `front`)
 front:.27,
})));

function stripes(){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=256;c.height=32;const x=c.getContext('2d');if(!x)return null;
 for(let i=0;i<8;i++){x.fillStyle=i%2?'#f6f1e6':'#d8463a';x.fillRect(i*32,0,32,32);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function weave(){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=128;c.height=128;const x=c.getContext('2d');if(!x)return null;
 x.fillStyle='#d9c48e';x.fillRect(0,0,128,128);
 for(let i=0;i<128;i+=4){x.fillStyle=i%8?'rgba(140,110,60,.18)':'rgba(255,255,255,.12)';x.fillRect(0,i,128,2);}
 x.fillStyle='#3f6f5a';x.fillRect(0,10,128,6);x.fillRect(0,112,128,6);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

export function buildBeachCorner({parent,colliders,register,onAction,shadows=false}){
 const g=new THREE.Group();g.name='Beach corner';g.userData.walkSurface=false;parent.add(g);
 const y0=sand(C.x,C.z);
 const std=(color,rough=.85,extra={})=>new THREE.MeshStandardMaterial({color,roughness:rough,...extra});
 const mesh=(geo,mat,x,y,z,name)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.name=name;m.castShadow=shadows;m.receiveShadow=true;g.add(m);return m;};

 // The goza mat.
 const matTex=weave();const goza=mesh(new THREE.PlaneGeometry(2.2,1.7),matTex?new THREE.MeshStandardMaterial({map:matTex,roughness:.95}):std(0xd9c48e),C.x+.1,y0+.012,C.z,'Goza mat');goza.rotation.x=-Math.PI/2;
 // Two low beach chairs: a slatted seat and back on a folding frame.
 const teak=std(0x9a6a40,.7),canvas=std(0x2f6f8a,.8);
 for(const s of BEACH_CORNER_SEATS){
  const [x,y,z]=s.position,chair=new THREE.Group();chair.name='Beach chair';chair.position.set(x,y,z);g.add(chair);
  const add=(geo,mat,px,py,pz,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);m.rotation.z=rz;m.castShadow=shadows;chair.add(m);};
  add(new THREE.BoxGeometry(.5,.035,.48),canvas,.02,.24,0);
  add(new THREE.BoxGeometry(.04,.62,.48),canvas,-.3,.48,0,-.55);
  for(const dz of [-.25,.25]){add(new THREE.BoxGeometry(.6,.03,.03),teak,0,.23,dz);add(new THREE.BoxGeometry(.03,.7,.03),teak,-.28,.42,dz,-.55);add(new THREE.BoxGeometry(.03,.25,.03),teak,.24,.12,dz);add(new THREE.BoxGeometry(.32,.025,.04),teak,.02,.4,dz);}
  colliders.push({x,z,w:.6,d:.55,height:.7,beachCorner:true});
  const marker=new THREE.Object3D();marker.position.set(x,y+1,z);marker.userData.seat=s;g.add(marker);
  register(marker,s.label,()=>onAction('seat','Beach chair','You sink into the low chair and stretch your legs out on the warm sand. The swell comes in, folds over and slides back, again and again. A bird calls along the shore. Out past the buoy, a fish jumps.'));
 }
 // The parasol between the chairs, tilted a little against the sun.
 const pole=mesh(new THREE.CylinderGeometry(.02,.02,2.1,8),std(0xe9e3d6,.5),C.x-.15,y0+1.0,C.z,'Parasol pole');pole.rotation.z=.12;
 const stripeTex=stripes();if(stripeTex){stripeTex.wrapS=THREE.RepeatWrapping;stripeTex.repeat.set(1,1);}
 const canopy=mesh(new THREE.ConeGeometry(1.25,.42,16,1,true),stripeTex?new THREE.MeshStandardMaterial({map:stripeTex,roughness:.8,side:THREE.DoubleSide}):std(0xd8463a,.8,{side:THREE.DoubleSide}),C.x-.02,y0+2.0,C.z,'Parasol canopy');canopy.rotation.z=.12;
 colliders.push({x:C.x-.15,z:C.z,w:.12,d:.12,height:2.1,beachCorner:true});
 // The adan behind, on its stilt roots, with spiky leaves in tufts.
 const ax=C.x-2.2,az=C.z+1.9,ay=sand(ax,az),bark=std(0x8a7656,.9),leaf=std(0x5f8a3e,.8,{side:THREE.DoubleSide});
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2,r=mesh(new THREE.CylinderGeometry(.03,.04,1.0,6),bark,ax+Math.cos(a)*.32,ay+.45,az+Math.sin(a)*.32,'Adan stilt root');r.rotation.set(-Math.sin(a)*.4,0,Math.cos(a)*.4);}
 const trunk=mesh(new THREE.CylinderGeometry(.09,.12,1.9,8),bark,ax+.2,ay+1.6,az,'Adan trunk');trunk.rotation.z=-.25;
 for(const [bx,by,bz] of [[ax+.55,ay+2.5,az],[ax-.05,ay+2.3,az+.4],[ax+.25,ay+2.45,az-.45]]){
  for(let k=0;k<11;k++){const a=k/11*Math.PI*2,blade=mesh(new THREE.PlaneGeometry(.09,1.0),leaf,bx+Math.cos(a)*.3,by+.05,bz+Math.sin(a)*.3,'Adan leaf');blade.rotation.set(0,-a,0);blade.rotateX(Math.PI/2-.5);}
  mesh(new THREE.SphereGeometry(.12,8,6),std(0xd28a3a,.7),bx,by-.12,bz,'Adan fruit');
 }
 colliders.push({x:ax+.1,z:az,w:.8,d:.8,height:2.6,beachCorner:true});
 // Driftwood, a cool box, sandals and a straw hat.
 const drift=mesh(new THREE.CylinderGeometry(.11,.14,1.6,9),std(0xc9bfae,.95),C.x+.95,sand(C.x+.95,C.z)+.1,C.z,'Driftwood log');drift.rotation.set(Math.PI/2,0,.15);
 mesh(new THREE.BoxGeometry(.42,.3,.3),std(0x2f7fb8,.6),C.x-.55,y0+.15,C.z-1.15,'Cool box');mesh(new THREE.BoxGeometry(.44,.05,.32),std(0xf2efe6,.6),C.x-.55,y0+.32,C.z-1.15,'Cool box lid');
 colliders.push({x:C.x-.55,z:C.z-1.15,w:.45,d:.34,height:.35,beachCorner:true});
 for(const dz of [-.07,.07]){const s=mesh(new THREE.BoxGeometry(.26,.02,.1),std(0x3c6a8a,.7),C.x+.55,y0+.02,C.z+.05+dz,'Sandal');s.rotation.y=.2;}
 const brim=mesh(new THREE.CylinderGeometry(.24,.24,.012,20),std(0xe2c27a,.9),C.x+.35,y0+.022,C.z-.85,'Straw hat brim');void brim;mesh(new THREE.SphereGeometry(.11,14,8,0,Math.PI*2,0,Math.PI/2),std(0xe2c27a,.9),C.x+.35,y0+.025,C.z-.85,'Straw hat crown');

 // ---- Birds. Sandpipers along the wash line, an egret in the shallows, terns aloft.
 const birdBody=std(0x9a8a74,.8),white=std(0xf4f1ea,.7),beak=std(0x2a2622,.6);
 const shoreX=(()=>{let x=C.x;while(beachHeight(x+.1,C.z)!=null&&beachHeight(x+.1,C.z)>SEA_LEVEL+.04)x+=.1;return x;})();
 const pipers=[];
 for(let i=0;i<4;i++){
  const b=new THREE.Group();b.name='Sandpiper';g.add(b);
  const body=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),birdBody);body.scale.set(1.5,.9,1);body.position.y=.07;b.add(body);
  const belly=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),white);belly.scale.set(1.3,.7,.95);belly.position.set(0,.055,0);b.add(belly);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.028,8,6),birdBody);head.position.set(.06,.1,0);b.add(head);
  const bill=new THREE.Mesh(new THREE.ConeGeometry(.006,.05,5),beak);bill.rotation.z=-Math.PI/2;bill.position.set(.105,.1,0);b.add(bill);
  for(const dz of [-.015,.015]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.003,.003,.05,4),beak);leg.position.set(0,.025,dz);b.add(leg);}
  pipers.push({b,z:C.z-6+i*3.2+Math.random(),phase:i*1.7,run:0});
 }
 const egret=new THREE.Group();egret.name='Little egret';g.add(egret);
 {const body=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),white);body.scale.set(1.6,.8,.8);body.position.y=.5;egret.add(body);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,.32,6),white);neck.position.set(.16,.68,0);neck.rotation.z=-.5;egret.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.04,8,6),white);head.position.set(.24,.83,0);egret.add(head);egret.userData.head=head;
  const bill=new THREE.Mesh(new THREE.ConeGeometry(.012,.13,6),beak);bill.rotation.z=-Math.PI/2;bill.position.set(.32,.83,0);egret.add(bill);egret.userData.bill=bill;
  for(const dz of [-.03,.03]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.45,5),beak);leg.position.set(0,.22,dz);egret.add(leg);}}
 egret.position.set(shoreX+1.6,SEA_LEVEL-.25,C.z+2.5);egret.rotation.y=-.6;
 const terns=[];
 for(let i=0;i<3;i++){
  const t=new THREE.Group();t.name='Tern';g.add(t);
  const body=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),white);body.scale.set(2,.6,.7);t.add(body);
  const wings=[-1,1].map(s=>{const w=new THREE.Mesh(new THREE.PlaneGeometry(.12,.38),white);w.position.z=s*.19;w.rotation.x=-Math.PI/2;const pivot=new THREE.Group();pivot.add(w);t.add(pivot);pivot.userData.side=s;return pivot;});
  terns.push({t,wings,phase:i*2.1,r:5+i*2.5,h:5+i*1.5});
 }

 let clock=0;
 return {
  group:g,seats:BEACH_CORNER_SEATS,shoreX,
  tick(dt,player){
   clock+=dt;const wave=Math.sin(clock*.8);
   // Sandpipers chase the wash down and run back from the next wave.
   for(const p of pipers){
    const x=shoreX-.3+wave*.55+Math.sin(clock*.3+p.phase)*.15,z=p.z+Math.sin(clock*.11+p.phase)*.8;
    const near=player&&Math.hypot(player.x-x,player.z-z)<1.6;
    p.b.position.set(x+(near?.8:0),sand(Math.min(x,shoreX),z)+.0,z);p.b.rotation.y=wave>0?Math.PI:0;
    p.b.children[2].position.y=.1-(Math.sin(clock*9+p.phase)>.6?.03:0);
   }
   // The egret stands, and every so often stabs at the water.
   const strike=(clock%7)<.35;egret.userData.head.position.set(strike?.34:.24,strike?.62:.83,0);egret.userData.bill.position.set(strike?.42:.32,strike?.6:.83,0);
   // Terns wheel and flap.
   for(const tn of terns){const a=clock*.35+tn.phase;tn.t.position.set(C.x+8+Math.cos(a)*tn.r,tn.h+Math.sin(clock*.7+tn.phase)*.4,C.z+Math.sin(a)*tn.r);tn.t.rotation.y=-a;for(const w of tn.wings)w.rotation.x=w.userData.side*Math.sin(clock*7+tn.phase)*.5;}
  },
 };
}
