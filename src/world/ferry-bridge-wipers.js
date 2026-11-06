import * as THREE from '../../vendor/three.module.js';
import {assetURL} from '../assets.js';
import {WIPER_GEOMETRY as PLAN} from './ferry-bridge-wipers-geometry.js';

// The fallback is the same Blender mesh vertices as the native asset. Both
// keep the motor fixed and use two equal arms, with an unrotated blade carrier.
export function buildBridgeWipers(parent){
 const group=new THREE.Group();group.name='Frame-mounted marine pantograph wipers';parent.add(group);
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65});
 const geometries={};
 for(const [name,data] of Object.entries(PLAN.fallback)){
  const g=new THREE.BufferGeometry();
  for(const key of ['position','normal','color'])g.setAttribute(key,new THREE.Float32BufferAttribute(data[key],3));
  g.computeBoundingBox();g.computeBoundingSphere();geometries[name]=g;
 }
 const wipers=[],units=[];
 let angle=PLAN.park,phase=-Math.PI/2,pending=null,loaded=false,error=null;
 function buildUnit(x){
  const unit=new THREE.Group();unit.name='Window pantograph '+x;unit.position.set(x+PLAN.rootXOffset,PLAN.rootY,0);group.add(unit);
  const parts={};
  for(const name of PLAN.parts){
   const pivot=new THREE.Group();pivot.name='wiper_'+name;
   if(name==='idler')pivot.position.x=PLAN.shaftCentres;
   const mesh=new THREE.Mesh(geometries[name],material);mesh.name='wiper_'+name+'_mesh';mesh.castShadow=mesh.receiveShadow=true;pivot.add(mesh);unit.add(pivot);parts[name]=pivot;
  }
  wipers.push(parts.drive);units.push({unit,parts});return parts;
 }
 for(const x of PLAN.sourcePane.centres)buildUnit(x);
 function apply(){
  for(const {parts} of units){
   parts.drive.rotation.z=angle;parts.idler.rotation.z=angle;
   parts.carrier.position.set(PLAN.armLength*Math.sin(angle),-PLAN.armLength*Math.cos(angle),0);
  }
 }
 function setAngle(value){angle=Math.max(PLAN.sweep[0],Math.min(PLAN.sweep[1],value));phase=Math.asin(angle/PLAN.sweep[1]);apply();}
 function update(dt,{rain=false,powered=true}={}){
  const step=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.1));
  if(!powered)return; // A powerless motor cannot teleport its mechanism to park.
  if(rain){phase+=step*3.8;angle=Math.sin(phase)*PLAN.sweep[1];}
  else if(angle>PLAN.park){
   // Finish the current cycle in its existing direction before self-parking.
   // The motor stays powered for the parking cam; derivative is zero at park.
   const nextPark=-Math.PI/2+(Math.floor((phase+Math.PI/2)/(2*Math.PI))+1)*2*Math.PI;
   phase=Math.min(nextPark,phase+step*3.8);
   if(phase===nextPark){phase=-Math.PI/2;angle=PLAN.park;}
   else angle=Math.sin(phase)*PLAN.sweep[1];
  }
  apply();
 }
 async function ensureNative(){
  return pending??=(async()=>{
   const {GLTFLoader}=await import('../../vendor/GLTFLoader.js');
   const {scene}=await new GLTFLoader().loadAsync(assetURL(PLAN.nativeAsset));
   const native={};let meshes=0,triangles=0;
   for(const name of PLAN.parts){const p=scene.getObjectByName('wiper_'+name);if(!p||!p.isObject3D)throw Error('Missing wiper linkage '+name);native[name]=p;}
   scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;o.castShadow=o.receiveShadow=true;}});
   if(meshes!==4||triangles>6000)throw Error('Invalid wiper mesh budget');
   // Keep the public drive pivots and current angle during a late lazy load.
   for(const {parts} of units)for(const name of PLAN.parts){
    parts[name].clear();for(const child of native[name].children)parts[name].add(child.clone(true));
   }
   apply();loaded=true;
   for(const g of Object.values(geometries))g.dispose();material.dispose();
   return true;
  })().catch(e=>{error=String(e?.message||e);return false;});
 }
 const eye=new THREE.Vector3(),centre=new THREE.Vector3(0,1.5,0);
 const trigger=units[0].parts.drive.children[0];
 trigger.onBeforeRender=(_renderer,_scene,camera)=>{
  if(pending)return;camera.getWorldPosition(eye);group.worldToLocal(eye);
  if(eye.y>-.5&&eye.y<3.5&&eye.distanceToSquared(centre)<144)ensureNative();
 };
 setAngle(PLAN.park);
 return {group,wipers,units,update,setAngle,ensureNative,plan:PLAN,get angle(){return angle;},get loaded(){return loaded;},get pending(){return pending;},get error(){return error;}};
}
