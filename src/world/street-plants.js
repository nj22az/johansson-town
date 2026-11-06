import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {assetURL} from '../assets.js';

let parts=null,pending=null;
export function preloadStreetPlants(){
  if(parts)return Promise.resolve(true);if(pending)return pending;
  const controller=new AbortController();let timer;
  const load=fetch(assetURL('models/street/potted-plant.glb'),{signal:controller.signal}).then(response=>{
    if(!response.ok)throw Error('Plant asset HTTP '+response.status);
    return response.arrayBuffer();
  }).then(data=>new GLTFLoader().parseAsync(data,''));
  pending=Promise.race([load,new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Plant asset timeout'));},12000);})]).then(gltf=>{
    gltf.scene.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(gltf.scene),centre=bounds.getCenter(new THREE.Vector3()),height=bounds.max.y-bounds.min.y;
    const normalise=new THREE.Matrix4().makeScale(1/height,1/height,1/height).multiply(new THREE.Matrix4().makeTranslation(-centre.x,-bounds.min.y,-centre.z));
    const result=[];
    gltf.scene.traverse(mesh=>{if(!mesh.isMesh)return;
      const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld).applyMatrix4(normalise);
      geometry.computeBoundingBox();geometry.computeBoundingSphere();
      mesh.material.dithering=true;mesh.material.envMapIntensity=.45;
      result.push({geometry,material:mesh.material});
    });
    if(!result.length)throw Error('Empty plant asset');parts=result;return true;
  }).catch(error=>{console.warn('Street plant unavailable:',error.message);return false;}).finally(()=>{clearTimeout(timer);pending=null;});
  return pending;
}

export function buildStreetPlants(parent,placements,{shadows=false}={}){
  if(!parts)return {count:0,draws:0};
  const cells=new Map(),dummy=new THREE.Object3D();
  for(const [i,p] of placements.entries()){
    const key=Math.floor(p.x/32)+','+Math.floor(p.z/32);
    if(!cells.has(key))cells.set(key,[]);
    dummy.position.set(p.x,p.y||0,p.z);dummy.rotation.set(0,i*2.399,0);dummy.scale.setScalar(p.height||1.1);dummy.updateMatrix();cells.get(key).push(dummy.matrix.clone());
  }
  let draws=0;
  for(const [cell,matrices] of cells)for(const part of parts){
    const mesh=new THREE.InstancedMesh(part.geometry,part.material,matrices.length);
    mesh.name='street-plants:'+cell;mesh.castShadow=shadows;mesh.receiveShadow=true;
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;
    mesh.computeBoundingSphere();mesh.computeBoundingBox();parent.add(mesh);draws++;
  }
  return {count:placements.length,draws};
}
