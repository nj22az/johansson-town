import * as THREE from '../../../vendor/three.module.js';
import {createMaterials} from '../../render/materials.js?snappy=1';
import {buildShopDoor} from '../shop-door.js';
import {buildWarehousePortDetails} from './warehouse-port.js';
import {batchStaticProps} from '../../render/static-props.js';

export const WAREHOUSE_ROOM=Object.freeze({bounds:{minX:-2.8,maxX:2.8,minZ:-5.1,maxZ:5.1},spawn:[0,0,3.6],yaw:0,exit:[0,1.15,4.8],staff:{'Mrs Sato':[.55,0,-3.35]}});

export function buildWarehouseInterior({room,reg,collider,action,exit}){
 room.name='Harbour Warehouse interior';
 const surfaces=createMaterials(),concrete=surfaces.worldMaterial('concrete',0xada89a,2),wood=surfaces.material('timber',0x8c7455),dark=surfaces.material('timber',0x514335);
 const steel=new THREE.MeshStandardMaterial({color:0x475b59,roughness:.66,metalness:.2}),rope=new THREE.MeshStandardMaterial({color:0xa08d64,roughness:1});
 function box(size,pos,mat,name){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);mesh.position.set(...pos);mesh.receiveShadow=true;mesh.userData.staticProp=true;if(name)mesh.name=name;room.add(mesh);return mesh;}
 function inspect(pos,title,text){const a=new THREE.Object3D();a.position.set(...pos);a.userData.workers=['Mrs Sato'];room.add(a);reg(a,'Inspect '+title,()=>action('inspect',title,text),true);}
 box([5.8,.16,10.4],[0,-.08,0],concrete,'warehouse-floor');
 box([5.8,3.6,.18],[0,1.8,-5.2],wood);for(const x of [-2.9,2.9])box([.18,3.6,10.4],[x,1.8,0],wood);
 box([5.8,.16,10.4],[0,3.65,0],dark,'warehouse-ceiling');
 for(const z of [-4,-1,2,5]){
  box([5.8,.22,.22],[0,3.38,z],dark);for(const x of [-2.7,2.7])box([.16,3.4,.16],[x,1.7,z],dark);
 }
 for(const x of [-1.94,1.94])box([1.92,3.6,.18],[x,1.8,5.2],wood);
 box([2,1,.18],[0,3.1,5.2],wood);
 const door=buildShopDoor(room,{name:'warehouse-inside-door',glass:false,width:1.65});door.group.position.z=5.08;door.group.rotation.y=Math.PI;
 const exitAnchor=new THREE.Object3D();exitAnchor.name='warehouse-room-exit';exitAnchor.position.set(...WAREHOUSE_ROOM.exit);room.add(exitAnchor);reg(exitAnchor,'Exit Harbour Warehouse',exit,true);
 for(const x of [-2.28,2.28]){
  for(const z of [-3.2,-.4]){
   for(const dz of [-1.03,1.03])for(const dx of [-.36,.36])box([.055,2.45,.055],[x+dx,1.225,z+dz],steel);
   for(const y of [.24,1.05,1.88]){
    box([.82,.07,2.2],[x,y,z],steel);
    for(const dz of [-.62,.12,.72]){
     box([.63,.42,.52],[x,y+.245,z+dz],wood);
     for(const hy of [y+.09,y+.40])box([.025,.05,.56],[x+(x<0?.33:-.33),hy,z+dz],dark);
    }
   }
   collider(x,z,.87,2.25,2.45);
  }
 }
 inspect([-1.58,1.2,-2.7],'Fishing-gear shelves','Wooden boxes hold net floats, shackles and spare fittings. The centre aisle stays clear for deliveries.');
 inspect([1.55,1.1,-.2],'Bait stores','Hooks, bait tins and line are sorted by the boats that ordered them.');
 const desk=box([1.6,.10,.78],[.55,.83,-4.40],wood,'warehouse-ledger-bench');
 for(const x of [-.13,1.23])box([.09,.78,.60],[x,.39,-4.4],dark);
 collider(.55,-4.4,1.65,.85,1.1);
 box([.35,.035,.45],[.30,.91,-4.32],new THREE.MeshStandardMaterial({color:0xd3c7a5,roughness:1}));
 inspect([.55,1,-3.7],'Quay ledger','Ice, rope and lamp oil issued to the evening boats are recorded in the harbour master’s carbon book.');
 for(let i=0;i<4;i++){
  const coil=new THREE.Mesh(new THREE.TorusGeometry(.30+i*.045,.035,6,28),rope);coil.rotation.x=Math.PI/2;coil.position.set(-2.12,.14+i*.025,2.0);coil.userData.staticProp=true;room.add(coil);
 }
 collider(-2.12,2,.95,.95,.45);inspect([-1.5,.8,2],'Mooring rope','A dry coil of natural-fibre rope, ready for the next boat.');
 const lampMat=new THREE.MeshStandardMaterial({color:0xefe5bd,emissive:0xffdf9d,emissiveIntensity:.8});
 for(const z of [-2.7,2])box([.26,.07,1.35],[0,3.40,z],lampMat);
 const light=new THREE.PointLight(0xffe0a3,2.2,13,2);light.position.set(0,2.95,0);room.add(light);
 buildWarehousePortDetails({room,box,inspect,collider,wood,dark,steel,rope});
 room.userData.portBatch=batchStaticProps(room);return WAREHOUSE_ROOM;
}
