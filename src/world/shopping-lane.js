import * as THREE from '../../vendor/three.module.js';
/** The old Rainflower lots are open ground. Its connecting street is drawn from ISLAND_ROUTES. */
export function buildShoppingLane({world}){
 const group=new THREE.Group();group.name='Kitahama connector';world.group.add(group);
 const road=world.group.getObjectByName('island-shopping-lane');
 if(road?.material){road.material=road.material.clone();road.userData.staticProp=false;}
 return {group,retiredShops:true,update(rain){if(!road?.material)return;const wet=rain===true||rain==='rain';road.material.roughness=wet?.32:.92;road.material.color.set(wet?0x68716b:0x70756c);}};
}
