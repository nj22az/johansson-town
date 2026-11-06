import * as THREE from '../../vendor/three.module.js';

/** The game's fitted wheel equipment follows the actual vehicle wheels. A deployment value is visual only;
 * the departure controller separately requires the bosun's work, engine/brake state and the driver's arrival upstairs. */
export function buildWheelSecuring(vehicle){
 const group=new THREE.Group();group.name='Ferry wheel chocks and securing straps';group.visible=false;vehicle.add(group);
 group.userData.dynamicProp=true;group.userData.walkSurface=false;
 const chocks=new THREE.Group(),straps=new THREE.Group();group.add(chocks,straps);
 const yellow=new THREE.MeshStandardMaterial({color:0xe5b93e,roughness:.9}),webbing=new THREE.MeshStandardMaterial({color:0xb65b2e,roughness:.95});
 const up=new THREE.Vector3(0,1,0);
 for(const w of (vehicle.userData.wheels||[]).filter(w=>w.z>0)){
  for(const direction of [-1,1]){
   const block=new THREE.Mesh(new THREE.BoxGeometry(.22,.13,.18),yellow);block.name='Wheel chock';block.position.set(w.x,.065,w.z+direction*(w.r+.075));chocks.add(block);
   const a=new THREE.Vector3(w.x,w.r,w.z+direction*(w.r+.03)),b=new THREE.Vector3(w.x+Math.sign(w.x)*.11,.025,w.z+direction*(w.r+.42)),delta=b.clone().sub(a);
   const strap=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,delta.length(),5),webbing);strap.name='Wheel securing strap';strap.position.copy(a).add(b).multiplyScalar(.5);strap.quaternion.setFromUnitVectors(up,delta.normalize());straps.add(strap);
  }
  const over=new THREE.Mesh(new THREE.TorusGeometry(w.r+.026,.026,5,16,Math.PI),webbing);over.name='Wheel strap over tread';over.rotation.y=Math.PI/2;over.position.set(w.x,w.r,w.z);straps.add(over);
 }
 return {group,set(progress){const p=Math.max(0,Math.min(1,progress));group.visible=p>0;chocks.scale.setScalar(Math.min(1,p*2));straps.visible=p>.5;straps.scale.y=Math.max(.01,(p-.5)*2);group.userData.deployed=p;}};
}
