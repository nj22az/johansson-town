import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';

/** Small architectural fittings, batched by material instead of one draw per fitting. */
function detailKit(parent,name,{shadows=false}={}){
 const group=new THREE.Group();group.name=name;parent.add(group);
 const parts=new Map();
 const add=(size,position,colour,rotation=0)=>{
  const g=new THREE.BoxGeometry(...size);g.rotateY(rotation);g.translate(...position);
  if(!parts.has(colour))parts.set(colour,[]);parts.get(colour).push(g);
 };
 const finish=()=>{
  for(const [colour,list] of parts){
   const material=new THREE.MeshStandardMaterial({color:colour,roughness:.82,metalness:.08});
   material.userData.keepPhysical=true;
   const mesh=new THREE.Mesh(mergeGeometries(list,false),material);list.forEach(g=>g.dispose());
   mesh.name=name+' fittings';mesh.castShadow=shadows;mesh.receiveShadow=true;
   mesh.userData.staticProp=true;group.add(mesh);
  }
  return group;
 };
 return {add,finish};
}

export function buildSakuraDetails(parent,{width,depth,doorX,shadows=true}){
 const {add,finish}=detailKit(parent,'Sakura exterior details',{shadows});
 const half=width/2;
 // Roof drip edge and rainwater fittings. All remain against the building envelope.
 add([width+.38,.10,.16],[0,3.80,.20],0x586660);
 for(const side of [-1,1]){
  add([.10,3.65,.10],[side*(half+.15),1.84,-.18],0x586660);
  add([.18,.07,.16],[side*(half+.15),.17,-.13],0x586660);
  add([.22,.20,depth+.02],[side*(half+.04),.12,-depth/2],0x8d897c);
 }
 // Window sill runs stop at the doorway so the shop's sliding leaves remain clear.
 const lo=-half+.12,hi=half-.12;
 for(const [a,b] of [[lo,doorX-.98],[doorX+.98,hi]])if(b>a){
  add([b-a,.12,.23],[(a+b)/2,.14,.075],0x8d897c);
 }
 add([2.05,.055,.36],[doorX,.20,.07],0x8d897c);
 // Low maintenance paving at each corner, clear of the customer entrance.
 for(const side of [-1,1])add([.55,.05,.55],[side*(half-.35),.04,.37],0x8d897c);
 return finish();
}
