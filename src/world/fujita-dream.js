import * as THREE from '../../vendor/three.module.js';
import {buildJCoffeeCan,J_COFFEE_CAN} from './halloween-props.js';

/**
 * Fujita's dream (The Haunted Vending Machine: "One million cans… and I buy a house!"): the cartoon dream that rises over
 * his head when he explains his pension (¥10 back for every empty can at Sakura's recycling box, commerce/
 * vending-catalogue.js CAN_REFUND): a sunrise, a meadow, his little house that is a giant J-Coffee can with a door and
 * round windows, and beside it a mountain of black J-Coffee cans with a tower of them stacked up past the clouds.
 * A set of its own, high over the street and closed in by its own painted sky (a dome), so a camera inside it sees only
 * the dream; drawn flat (unlit colours, no fog), as a dream is. `pop`: the dream bursting, the end of the gag: the
 * tower broken and the cans tumbling through the air, the house tipped over.
 * Origin at the meadow's centre.
 */
export const FUJITA_DREAM=Object.freeze({at:Object.freeze([-6,150,-32]),radius:24,cans:7000,
 house:Object.freeze([-.6,0,-2.7]),mountain:Object.freeze([-3.2,0,2.4]),tower:Object.freeze([-4.6,0,3.2]),
 why:'Fujita’s sums made a picture: ¥10 a can, one million cans, a ¥10,000,000 house. The pile is a mountain; the million goes up past the clouds.'});

function skyTexture(){
 if(typeof document==='undefined'||!document.createElement)return null;
 const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext?.('2d');if(!x)return null;
 const g=x.createLinearGradient(0,0,0,512);
 g.addColorStop(0,'#7fb4e6');g.addColorStop(.38,'#bcd8ef');g.addColorStop(.52,'#ffe0a6');g.addColorStop(.6,'#ffb36b');g.addColorStop(1,'#ff9a6b');
 x.fillStyle=g;x.fillRect(0,0,1024,512);
 // the rising sun with its rays, low behind the house (u .5: the dome's -x side, where the camera looks)
 const sx=512,sy=268;
 x.save();x.translate(sx,sy);x.fillStyle='rgba(255,236,170,.55)';
 for(let i=0;i<16;i++){x.rotate(Math.PI/8);x.beginPath();x.moveTo(0,0);x.lineTo(320,-22);x.lineTo(320,22);x.closePath();x.fill();}
 x.restore();
 x.fillStyle='#fff3c2';x.beginPath();x.arc(sx,sy,62,0,Math.PI*2);x.fill();
 x.fillStyle='#ffd75e';x.beginPath();x.arc(sx,sy,48,0,Math.PI*2);x.fill();
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const flat=(color,o={})=>new THREE.MeshBasicMaterial({color,fog:false,...o});

export function buildFujitaDream(){
 const D=FUJITA_DREAM,g=new THREE.Group();g.name='Fujita’s dream';g.position.set(...D.at);
 // the sky and the meadow
 const map=skyTexture();
 const sky=new THREE.Mesh(new THREE.SphereGeometry(D.radius,32,16),map?flat(0xffffff,{map,side:THREE.BackSide,toneMapped:false}):flat(0xffc890,{side:THREE.BackSide}));
 sky.name='Dream sky';sky.rotation.y=Math.PI-.3;   // the sun low behind the house, seen from the meadow's +x side
 g.add(sky);
 const meadow=new THREE.Mesh(new THREE.CircleGeometry(D.radius,40).rotateX(-Math.PI/2),flat(0x9fd27a));meadow.name='Dream meadow';meadow.position.y=.001;g.add(meadow);
 for(let i=0;i<14;i++){const a=i*2.4,r=4+((i*7)%9);const f=new THREE.Mesh(new THREE.CircleGeometry(.12,6).rotateX(-Math.PI/2),flat(i%2?0xfff4f0:0xffd34a));f.position.set(Math.cos(a)*r,.004,Math.sin(a)*r);g.add(f);}
 // clouds round the top of the tower
 const cloud=flat(0xffffff);
 for(const [x,y,z,s] of [[-4,9,2,1.6],[-6,10,4.5,1.9],[-2.5,10.5,5,1.4],[-5.5,8.6,0,1.3],[-7.5,9.4,2.8,1.5],[-3.4,11,3,1.2]]){const c=new THREE.Mesh(new THREE.SphereGeometry(s,16,10),cloud);c.position.set(x,y,z);c.scale.y=.6;g.add(c);}
 // the house: a giant J-Coffee can (30 times a real one: 3.7 m tall), its door and windows cut in
 const house=new THREE.Group();house.name='Dream house (a J-Coffee can)';g.add(house);
 const big=buildJCoffeeCan();big.scale.setScalar(30);big.rotation.y=-Math.PI/2-.3;house.add(big);   // its name to the meadow's +x, where Fujita stands
 // the door and two round windows on its side (its name to the front), each set into the can
 const face=-.95,Rh=J_COFFEE_CAN.diameter/2*30,out=(a,y,d=0)=>new THREE.Vector3(Math.cos(face+a)*(Rh+d),y,Math.sin(face+a)*(Rh+d));
 const door=new THREE.Mesh(new THREE.BoxGeometry(.1,1.6,.82),flat(0x8a5a36));door.position.copy(out(0,.8,-.02));door.rotation.y=-face;house.add(door);
 const knob=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),flat(0xf2c64a));knob.position.copy(out(-.2,.8,.04));house.add(knob);
 for(const a of [-.36,.36]){const w=new THREE.Mesh(new THREE.CircleGeometry(.28,20),flat(0xfff2b0));const pos=out(a,2.35,.01);w.position.copy(pos);w.lookAt(pos.clone().multiplyScalar(2).setY(2.35));house.add(w);
  const frame=new THREE.Mesh(new THREE.RingGeometry(.28,.34,20),flat(0x8a5a36));frame.position.copy(out(a,2.35,.015));frame.lookAt(frame.position.clone().multiplyScalar(2).setY(2.35));house.add(frame);}
 const chimney=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.7,10),flat(0x9ea3a6));chimney.position.set(.3,3.95,-.3);house.add(chimney);
 house.position.set(...D.house);
 // the million: a mountain of cans and a tower of them up past the clouds (instanced: one draw)
 const proto=buildJCoffeeCan(),body=proto.getObjectByName('J-Coffee can body');
 const canGeo=new THREE.CylinderGeometry(J_COFFEE_CAN.diameter/2,J_COFFEE_CAN.diameter/2,J_COFFEE_CAN.height,12).translate(0,J_COFFEE_CAN.height/2,0);
 const canMat=body.material.map?flat(0xffffff,{map:body.material.map}):flat(0x141414);
 const n=D.cans,cans=new THREE.InstancedMesh(canGeo,canMat,n);cans.name='A million J-Coffee cans';
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),p=new THREE.Vector3(),sc=new THREE.Vector3(3,3,3);
 let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 const rest=[];
 const towerN=Math.floor(n*.2);
 for(let i=0;i<n;i++){
  if(i<towerN){   // the tower: rings of standing cans, 1.1 m across, up to 13 m
   const per=14,ring=Math.floor(i/per),a=(i%per)/per*Math.PI*2+ring*.31,h=J_COFFEE_CAN.height*3;
   p.set(D.tower[0]+Math.cos(a)*.55,ring*h*.98,D.tower[2]+Math.sin(a)*.55);e.set(0,a+rnd()*.3,0);
  }else{          // the mountain: a cone of cans 3.6 m high, 4.6 m across at its foot, every one at its own angle
   const u=rnd(),h=3.6*(1-Math.sqrt(u)),r=(1-h/3.6)*4.6*Math.sqrt(rnd()),a=rnd()*Math.PI*2;
   p.set(D.mountain[0]+Math.cos(a)*r,h,D.mountain[2]+Math.sin(a)*r);e.set(rnd()*Math.PI,rnd()*Math.PI,rnd()*Math.PI);
  }
  q.setFromEuler(e);rest.push([p.clone(),q.clone()]);m.compose(p,q,sc);cans.setMatrixAt(i,m);
 }
 g.add(cans);
 const pop=new THREE.Group();pop.name='Dream bursting';g.add(pop);
 g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false;}});
 g.userData.dream={
  /** 'dream' (whole) or 'pop' (bursting: the tower's cans and the mountain's top flung into the air, the house tipped). */
  set(state){
   for(let i=0;i<n;i++){const [p0,q0]=rest[i];
    if(state==='pop'&&(i<towerN?p0.y>1.2:p0.y>1.8||(i%5===0))){const k=i*.618%1;
     p.set(p0.x+(k-.5)*6,p0.y*.55+2+((i*.37)%1)*5,p0.z+(((i*.73)%1)-.5)*6);e.set(k*9,i*.7,k*4);q.setFromEuler(e);m.compose(p,q,sc);}
    else m.compose(p0,q0,sc);
    cans.setMatrixAt(i,m);}
   cans.instanceMatrix.needsUpdate=true;
   house.rotation.z=state==='pop'?-.32:0;house.position.y=state==='pop'?.35:0;
  }};
 return g;
}
