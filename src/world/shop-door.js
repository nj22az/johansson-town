import * as THREE from '../../vendor/three.module.js';
import {createMaterials} from '../render/materials.js?snappy=1';
import {glazeWithRoom} from '../render/window-interior.js';

// Metre-scale joinery. The handle, threshold and interaction share this doorway.
export function buildShopDoor(parent,{name='shop-door',width=1.45,glass=true,shadows=false}={}){
 const group=new THREE.Group();group.name=name;parent.add(group);
 const surfaces=createMaterials(),wood=surfaces.material('timber',0x74563b),dark=new THREE.MeshStandardMaterial({color:0x302c27,roughness:.85});
 const metal=new THREE.MeshStandardMaterial({color:0x9c8860,roughness:.35,metalness:.65});
 const pane=new THREE.MeshStandardMaterial({color:0x495c5d,roughness:.42,metalness:.05,emissive:0xe5ba77,emissiveIntensity:0});
 function part(size,position,material,label){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.set(...position);mesh.castShadow=shadows;mesh.receiveShadow=true;mesh.userData.staticProp=material!==pane;if(label)mesh.name=label;group.add(mesh);return mesh;}
 part([width+.28,2.6,.08],[0,1.3,.12],dark,'door-recess');
 for(const x of [-width/2-.06,width/2+.06])part([.12,2.58,.20],[x,1.29,.23],wood,'door-jamb');
 part([width+.24,.12,.20],[0,2.58,.23],wood,'door-lintel');
 const leaf=part([width,2.4,.10],[0,1.28,.23],wood,'door-leaf');
 let glazing=leaf;
 if(glass){
  glazing=glazeWithRoom(part([width-.24,1.28,.035],[0,1.75,.30],pane,'door-glazing'));
  for(const y of [1.08,1.75,2.42])part([width-.16,.055,.07],[0,y,.335],wood);
  part([.055,1.35,.07],[0,1.75,.335],wood);
 }
 for(const x of [-width*.29,0,width*.29])part([.024,.71,.025],[x,.63,.292],dark);
 part([.04,.30,.06],[width*.33,1.12,.37],metal,'door-handle');
 part([width+.32,.10,.50],[0,.05,.29],new THREE.MeshStandardMaterial({color:0x96958a,roughness:.96}),'door-threshold');
 return {group,leaf,pane:glazing,update(open,day){pane.emissiveIntensity=open?(1-day)*.16:0;}};
}
