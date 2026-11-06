import {buildIslandHomes} from './island-homes.js';
import {buildKitanoHamlet} from './kitano-hamlet.js';
import {buildLaneSurfaces} from './lane-surfaces.js?snappy=1';
import {buildYardHomes} from './yard-homes.js';
import {buildPoliceStation} from './police-station.js';
import * as THREE from '../../vendor/three.module.js';
import {createMaterials} from '../render/materials.js?snappy=1';

// Modular timber, tiled roofs and open thresholds. Ground and collision share ROUTES.
export function buildDistricts(world,options){
  const {group,colliders}=world,library=createMaterials({mobile:options.mobile,anisotropy:options.maxAnisotropy}),batches=new Map(),shutters=[],windows=[],animators=[];
  const unit=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D();
  function box(size,pos,kind='concrete',colour=0xffffff,rotation=[0,0,0]){const mat=library.worldMaterial(kind,colour);const key=mat.uuid;if(!batches.has(key))batches.set(key,{mat,items:[]});dummy.position.set(...pos);dummy.rotation.set(...rotation);dummy.scale.set(...size);dummy.updateMatrix();batches.get(key).items.push(dummy.matrix.clone());}
  function verb(pos,label,kind,title,text){const a=new THREE.Object3D();a.position.set(...pos);group.add(a);options.register(a,label,()=>options.onAction(kind,title,text));return a;}
  function sign(text,sub,pos,w=2,h=.6,angle=0){const c=document.createElement('canvas');c.width=512;c.height=160;const x=c.getContext('2d');x.fillStyle='#dfd7bb';x.fillRect(0,0,512,160);x.fillStyle='#344e4a';x.textAlign='center';x.font='bold 64px serif';x.fillText(text,256,76,490);x.font='22px serif';x.fillText(sub,256,129,490);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.8}));m.position.set(...pos);m.rotation.y=angle;group.add(m);
   // Plain board behind: a double-sided face showed its directions mirrored from behind.
   const back=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({color:0xb3ac94,roughness:.9}));back.position.set(pos[0]-Math.sin(angle)*.012,pos[1],pos[2]-Math.cos(angle)*.012);back.rotation.y=angle+Math.PI;group.add(back);
   return m;}
  buildLaneSurfaces(group,library);
  // The western lane is the seafront service edge behind the shopping street. The island
  // has its own seawall (okinawa/quarters.js), and this one ran down the middle of its walk.
  
  // The heron fishes the seawall, which the island keeps out of reach behind the yard.
  
  // Sparse bilingual junction signs, above eye level and outside the walking lane.
  // Each faces the people it is directing: the port sign is read walking up from the
  // shops, the bus-stop sign walking down to the terminus. That one stands on the footway's kerb side, clear of the
  // police station's doors and notice board behind it.
  // (The port sign's post stands on the footway behind the cargo driveway's kerb, 0.4 m east of the driveway's edge.)
  const signs=[[3.6,-34,"港へ →",'HARBOUR'],[3.6,18.9,"港湾ターミナル ↓",'PORT TERMINAL · FERRIES',Math.PI]];
  
  for(const [x,z,jp,en,angle=0] of signs){
    const marker=sign(jp,en,[x,2.1,z],1.55,.42,angle);marker.name='District direction';
    box([.09,2.15,.09],[x,1.075,z],'timber',0x655444);
  }
  
  // The bookshop and workshop staff live in the yard behind Front-Row (yard-homes.js).
  buildYardHomes(world,options);
  // Minato Police Station, on the lawn corner at the bus plaza, where Officer Mori works and lives. See police-station.js.
  world.policeStation=buildPoliceStation(world,options);
  // Kitahama's houses on the north-east land (island-homes.js).
  buildIslandHomes(world,options);
  // Kitano hamlet by the pier on Kitano-jima: Johansson's house, the Chinen house, and the Shiroma house, to let (kitano-hamlet.js).
  buildKitanoHamlet(world,options);
  for(const batch of batches.values()){const m=new THREE.InstancedMesh(unit,batch.mat,batch.items.length);batch.items.forEach((v,i)=>m.setMatrixAt(i,v));m.castShadow=options.shadows;m.receiveShadow=true;group.add(m);}
  return {shutters,windows,animators,sign,library};
}
