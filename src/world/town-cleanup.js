import * as THREE from '../../vendor/three.module.js';
import {groundHeight} from './layout.js';
import {CLEANUP_SPOTS} from '../commerce/town-cleanup.js';
import {TOWN_FINDS} from '../commerce/sakura-economy.js';

export function createTownCleanup({parent,register,action,getState,blocked=()=>false}){
 const objects=[];
 // The finds lie on whatever is actually underfoot. The walking height is the ground
 // itself, but paving is laid a few centimetres over it, so a bottle placed at the walking
 // height was half sunk into the pavement and the scrap disappeared into it altogether --
 // a pick-up prompt for nothing you could see.
 parent.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
 const surfaceAt=(x,z)=>{
  const ground=groundHeight(x,z);ray.set(new THREE.Vector3(x,ground+.6,z),down);ray.far=.9;
  const hit=ray.intersectObject(parent,true).find(h=>h.object.isMesh&&h.object.visible&&(!h.face||h.face.normal.y>.5));
  return hit?Math.max(ground,hit.point.y):ground;
 };
 for(const spot of CLEANUP_SPOTS){
  const original=spot['classic'];let position=null;
  for(let radius=0;radius<=2&&!position;radius+=.4)for(let i=0;i<12;i++){
   const x=original[0]+Math.cos(i*Math.PI/6)*radius,z=original[1]+Math.sin(i*Math.PI/6)*radius;
   if(!blocked(x,z,.35)){position=[x,surfaceAt(x,z),z];break;}
  }
  if(!position)continue;
  const group=new THREE.Group();group.position.set(...position);group.name='Town clean-up · '+spot.id;group.userData.dynamic=true;group.userData.npcInteraction=false;
  const item=TOWN_FINDS.find(i=>i.id===spot.kind),mat=new THREE.MeshStandardMaterial({color:spot.kind==='bottle'?0x4e8270:spot.kind==='cans'?0xb5b7a5:0x846d52,roughness:.7});
  if(spot.kind==='bottle'){
   const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.039,.048,.20,10),mat);bottle.rotation.z=1.24;bottle.position.y=.06;group.add(bottle);
   const neck=new THREE.Mesh(new THREE.CylinderGeometry(.021,.028,.07,8),mat);neck.position.y=.128;bottle.add(neck);
  }else if(spot.kind==='cans'){
   for(let i=0;i<3;i++){const can=new THREE.Mesh(new THREE.CylinderGeometry(.037,.04,.07,10),mat);can.rotation.z=.8+i*.25;can.position.set(i*.065-.065,.047,(i%2)*.05);group.add(can);}
  }else{
   // An offcut of pipe, a bent bracket and a couple of washers: small, but a shape.
   const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.28,10),mat);pipe.rotation.set(0,.5,Math.PI/2);pipe.position.set(0,.03,0);group.add(pipe);
   const bracket=new THREE.Mesh(new THREE.BoxGeometry(.16,.012,.05),mat);bracket.rotation.set(0,-.7,.18);bracket.position.set(.03,.02,.09);group.add(bracket);
   for(let i=0;i<2;i++){const washer=new THREE.Mesh(new THREE.TorusGeometry(.028,.009,5,12),mat);washer.rotation.set(Math.PI/2,0,0);washer.position.set(-.1+i*.06,.009,-.07);group.add(washer);}
  }
  parent.add(group);register(group,'Pick up '+item.name.toLowerCase(),()=>{action('town-cleanup',spot.id);update();});objects.push({id:spot.id,group});
 }
 function update(){const collected=getState().townCleanup?.collected||[];for(const {id,group} of objects)group.visible=!collected.includes(id);}
 update();return {update,objects};
}
