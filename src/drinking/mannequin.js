import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {createArticulatedHand,handGripPosition} from './hand.js';
export {handGripPosition};

/** Blender-authored rigid artist mannequin, one metre per unit; no mirrored hand scale. */
export async function createMannequin({url=new URL('../../assets/models/drinking/drinking-mannequin.glb',import.meta.url),arrayBuffer}={}){
 const loader=new GLTFLoader();
 const asset=arrayBuffer?await loader.parseAsync(arrayBuffer,''):await loader.loadAsync(String(url));
 return rigMannequin(asset.scene);
}

export function rigMannequin(root){
 const node=name=>{const o=root.getObjectByName(name);if(!o)throw new Error('Drinking mannequin joint missing: '+name);return o;};
 const pelvis=node('pelvis'),spine=node('spine'),chest=node('chest'),neck=node('neck'),head=node('head'),jaw=node('jaw'),throat=node('throat');
 const shoulder=node('shoulderR'),elbow=node('elbowR'),wrist=node('wristR'),mouth=node('mouth');
 root.name='Sober articulated study mannequin';
 root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 root.updateMatrixWorld(true);
 const upperAxis=elbow.position.clone().normalize(),foreAxis=wrist.position.clone().normalize();
 const upperLength=elbow.position.length(),foreLength=wrist.position.length();
 const shoulderRest=shoulder.position.clone(),throatRest=throat.position.clone();
 const hand=createArticulatedHand(root,wrist);
 const restWrist={position:new THREE.Vector3(-.055,.695,.21),quaternion:new THREE.Quaternion().setFromEuler(new THREE.Euler(.04,-.10,-.08))};
 const poleDefault=new THREE.Vector3(-.30,.73,.36);
 const state={reachClamped:false,wristError:0,elbowFlexion:0,wristDeviation:0};
 const start=new THREE.Vector3(),direction=new THREE.Vector3(),bend=new THREE.Vector3(),elbowTarget=new THREE.Vector3(),reachable=new THREE.Vector3();
 const targetQuat=new THREE.Quaternion(),parentQuat=new THREE.Quaternion();
 function orient(bone,localAxis,worldDirection){
  targetQuat.setFromUnitVectors(localAxis,worldDirection);
  bone.parent.getWorldQuaternion(parentQuat).invert();
  bone.quaternion.copy(parentQuat).multiply(targetQuat);
  bone.updateWorldMatrix(false,true);
 }
 function setPosture({lean=0,head:headPitch=0,neck:neckPitch=0,shoulder:raise=0,swallow=0,breath=0,jaw:jawOpen=0}={}){
  // Pelvis and legs never participate in upper-body leaning. The far hand stays supported.
  spine.rotation.z=-THREE.MathUtils.clamp(lean,-.06,.10)*.45;
  chest.rotation.z=-THREE.MathUtils.clamp(lean,-.06,.10)*.55;
  neck.rotation.z=THREE.MathUtils.clamp(neckPitch,-.12,.32);
  head.rotation.z=THREE.MathUtils.clamp(headPitch,-.20,.55);
  shoulder.position.copy(shoulderRest);shoulder.position.y+=THREE.MathUtils.clamp(raise,0,.035);
  jaw.rotation.z=-THREE.MathUtils.clamp(jawOpen,0,.10)+.010*swallow;
  throat.position.copy(throatRest);throat.position.y+=.009*swallow;throat.position.x+=.0025*swallow;
  node('Ribcage').scale.x=1+THREE.MathUtils.clamp(breath,-1,1)*.003;
  root.updateMatrixWorld(true);
 }
 /** Analytic two-link IK. Targets outside the envelope are reported and clamped, never stretched. */
 function solveArm(position,quaternion,pole=poleDefault){
  root.updateWorldMatrix(true,true);shoulder.getWorldPosition(start);
  direction.subVectors(position,start);const requested=direction.length();
  if(requested<1e-8)direction.set(1,0,0);else direction.multiplyScalar(1/requested);
  // 8° extension and 155° flexion limits leave a stable elbow bend.
  const low=Math.sqrt(upperLength**2+foreLength**2+2*upperLength*foreLength*Math.cos(155*Math.PI/180));
  const high=Math.sqrt(upperLength**2+foreLength**2+2*upperLength*foreLength*Math.cos(8*Math.PI/180));
  const distance=THREE.MathUtils.clamp(requested,low,high);
  reachable.copy(start).addScaledVector(direction,distance);
  bend.subVectors(pole,start).addScaledVector(direction,-bend.dot(direction));
  if(bend.lengthSq()<1e-9){bend.set(0,0,1).addScaledVector(direction,-direction.z);}
  bend.normalize();
  const along=(upperLength**2-foreLength**2+distance**2)/(2*distance);
  const height=Math.sqrt(Math.max(0,upperLength**2-along**2));
  // A pole alone can give an exact hand position but a severely folded wrist.
  // Pick the closest point on the elbow circle which also respects the wrist.
  // This is a geometric angular constraint, independent of previous frames.
  const palmForward=new THREE.Vector3(1,0,0).applyQuaternion(quaternion);
  const forwardAlong=palmForward.dot(direction);
  const planar=palmForward.clone().addScaledVector(direction,-forwardAlong);
  const planarLength=planar.length();
  if(planarLength>1e-7&&height>1e-7){
   planar.multiplyScalar(1/planarLength);
   const limit=(forwardAlong*(distance-along)-foreLength*Math.cos(55*Math.PI/180))/(height*planarLength);
   if(bend.dot(planar)>limit){
    const k=THREE.MathUtils.clamp(limit,-1,1);
    const side=bend.clone().addScaledVector(planar,-bend.dot(planar));
    if(side.lengthSq()<1e-9)side.crossVectors(direction,planar);
    side.normalize();bend.copy(planar).multiplyScalar(k).addScaledVector(side,Math.sqrt(Math.max(0,1-k*k)));
   }
  }
  elbowTarget.copy(start).addScaledVector(direction,along).addScaledVector(bend,height);
  orient(shoulder,upperAxis,new THREE.Vector3().subVectors(elbowTarget,start).normalize());
  orient(elbow,foreAxis,new THREE.Vector3().subVectors(reachable,elbowTarget).normalize());
  wrist.parent.getWorldQuaternion(parentQuat).invert();wrist.quaternion.copy(parentQuat).multiply(quaternion);
  wrist.updateWorldMatrix(false,true);
  state.reachClamped=Math.abs(distance-requested)>1e-5;
  state.wristError=wrist.getWorldPosition(new THREE.Vector3()).distanceTo(position);
  const up=elbowTarget.clone().sub(start).normalize(),fore=reachable.clone().sub(elbowTarget).normalize();
  state.elbowFlexion=THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(up.dot(fore),-1,1)));
  state.wristDeviation=THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(palmForward.dot(fore),-1,1)));
  return elbowTarget.clone();
 }
 function getDiagnostics(){
  root.updateMatrixWorld(true);
  return {...state,...hand.diagnostics(),upperLength,foreLength,
   shoulder:shoulder.getWorldPosition(new THREE.Vector3()).toArray(),elbow:elbow.getWorldPosition(new THREE.Vector3()).toArray(),wrist:wrist.getWorldPosition(new THREE.Vector3()).toArray(),mouth:mouth.getWorldPosition(new THREE.Vector3()).toArray(),
   hips:pelvis.getWorldPosition(new THREE.Vector3()).toArray(),
   feet:['footR','footL'].map(n=>node(n).getWorldPosition(new THREE.Vector3()).toArray())};
 }
 function dispose(){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent();}
 setPosture();solveArm(restWrist.position,restWrist.quaternion);
 return {root,mouth,shoulder,elbow,wrist,pelvis,neck,head,restWrist,upperLength,foreLength,hand,setPosture,solveArm,setGrip:hand.setGrip,getDiagnostics,dispose};
}
