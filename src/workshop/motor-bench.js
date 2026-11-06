import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {assetURL} from '../assets.js';
import {celFrom} from '../render/cel.js';

// The site's IEC 90L pump motor (/motor-90l/), packed by tools/pack-motor-90l.mjs.
// The asset is true size; the bench shows it 1.7x, as motor-90l/workshop does beside
// the big-headed islanders.
export const MOTOR_BENCH=Object.freeze({x:1.75,z:.85,width:1.1,depth:.6,top:.72,scale:1.7,path:'models/props/motor-90l-display.glb'});
export const MOTOR_LINKS=Object.freeze({stripDown:'/motor-90l/',routine:'/motor-90l/workshop/'});
export const MOTOR_NOTE='A pump motor off a ship’s bilge pump, IEC frame 90L: 1.5 kW, four poles, 230 V delta or 400 V star, 1,440 rpm at full load. Tetsuo has it on the test bench for an insulation test and a bearing check before it goes back aboard.\n\n“Erik, the old Swedish sailor, stripped one of these to the last washer. He says the bearings tell you everything if you listen. I have been listening for twenty minutes. They say nothing. That means they are good.”';

let request=null;
function loadMotor(){
 request??=new GLTFLoader().loadAsync(assetURL(MOTOR_BENCH.path)).then(g=>{
  g.scene.traverse(o=>{if(o.isMesh){o.material=celFrom(o.material,{bands:3});o.castShadow=o.receiveShadow=true;}});return g.scene;
 }).catch(error=>{request=null;throw error;});
 return request;
}

/** A welded steel test bench, built as one vertex-coloured mesh, with the motor bolted on top. */
export function buildMotorBench({room,collider}){
 const {x,z,width:w,depth:d,top}=MOTOR_BENCH,parts=[];
 const piece=(size,pos,colour)=>{const g=new THREE.BoxGeometry(...size).toNonIndexed();g.translate(...pos);const c=new THREE.Color(colour),rgb=new Float32Array(g.attributes.position.count*3);for(let i=0;i<rgb.length;i+=3)c.toArray(rgb,i);g.setAttribute('color',new THREE.BufferAttribute(rgb,3));g.deleteAttribute('uv');parts.push(g);};
 const STEEL=0x4b5857,PLATE=0x6b7370,MAT=0x2e3333;
 piece([w,.04,d],[0,top-.02,0],PLATE);// 10 mm plate on a box-section frame, drawn thick enough to read
 for(const sx of [-1,1])for(const sz of [-1,1])piece([.05,top-.04,.05],[sx*(w/2-.04),(top-.04)/2,sz*(d/2-.04)],STEEL);
 for(const sz of [-1,1])piece([w-.04,.05,.04],[0,top-.065,sz*(d/2-.04)],STEEL);
 piece([w-.08,.025,d-.08],[0,.16,0],STEEL);// lower shelf
 piece([.66,.012,.36],[0,top+.006,0],MAT);// rubber mat under the feet
 const bench=new THREE.Mesh(mergeGeometries(parts,false),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:.35}));
 bench.name='Steel motor test bench';bench.position.set(x,0,z);bench.receiveShadow=bench.castShadow=true;room.add(bench);
 collider(x,z,w+.03,d+.03,top);
 // Feet on the mat, axis along x, rating plate toward the door.
 const holder=new THREE.Group();holder.name='IEC 90L pump motor';holder.position.set(x,top+.012,z);holder.scale.setScalar(MOTOR_BENCH.scale);holder.userData.sharedAsset=true;room.add(holder);
 const ready=typeof window==='undefined'||!window.document?Promise.resolve(false):loadMotor().then(scene=>{if(!holder.parent)return false;holder.add(scene.clone());holder.userData.ready=true;return true;}).catch(error=>{holder.userData.loadError=true;console.warn('Motor display unavailable',error);return false;});
 return {bench,holder,ready};
}
