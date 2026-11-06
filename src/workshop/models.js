import * as THREE from '../../vendor/three.module.js';
import {workshopModel} from './catalogue.js';

const requests=new Map();
export function loadWorkshopModel(id){
 if(!workshopModel(id))return Promise.reject(new Error('Unknown workshop model'));
 // Resolve against the game page: compiled runtime chunks live at another depth.
 if(!requests.has(id))requests.set(id,fetch(new URL('./assets/workshop/'+id+'.json',document.baseURI||location.href)).then(response=>{if(!response.ok)throw Error('Could not load model');return response.json();}).catch(error=>{requests.delete(id);throw error;}));
 return requests.get(id);
}
export function makeWorkshopModel(data,colour=0xc7dbcf){
 const group=new THREE.Group();group.name='Form 3D · '+data.name;
 const material=new THREE.MeshStandardMaterial({color:colour,roughness:.53,metalness:.08,flatShading:true});
 for(const solid of data.solids){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(solid.mesh.vertices.flat(),3));geometry.setIndex(solid.mesh.faces.flat());geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name=solid.name;group.add(mesh);
 }
 // Form 3D uses Z up; the town and inspector use Y up.
 group.rotation.x=-Math.PI/2;group.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3()),centre=bounds.getCenter(new THREE.Vector3());
 const scale=1.1/Math.max(size.x,size.y,size.z);group.scale.setScalar(scale);group.position.copy(centre).multiplyScalar(-scale);
 const wrapper=new THREE.Group();wrapper.add(group);return wrapper;
}
export function printedItem(model,data){return {id:'print-'+model.id,kind:'printed-model',title:model.name,color:model.colour,meshData:data,note:'Examined the Form 3D '+model.name+'.',pages:[[model.name,model.description+'\n\nThuan buys this for ¥'+model.price+' at Sakura Konbini.']]};}
