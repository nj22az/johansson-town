import * as THREE from '../../vendor/three.module.js';

/** Anatomical right hand in its grip frame: +X fingers, +Y index side, -Z palm normal. */
const DIGITS=Object.freeze([
 {name:'index', y:.026, lengths:[.034,.025,.018], radius:.0068},
 {name:'middle', y:.0087, lengths:[.037,.027,.019], radius:.0070},
 {name:'ring', y:-.0087, lengths:[.034,.025,.018], radius:.0066},
 {name:'pinky', y:-.025, lengths:[.028,.021,.016], radius:.0060},
]);
const clamp=THREE.MathUtils.clamp;
function outerRadius(profile,y){
 const t=clamp((y-.003)/(profile.height-.003),0,1);
 return THREE.MathUtils.lerp(profile.outerRadiusBottom,profile.outerRadiusTop,t);
}
export function handGripPosition(profile){
 const h=profile.gripHeight??profile.gripHeightOffset;
 return new THREE.Vector3(-.060,h,outerRadius(profile,h)+.014);
}
/** Tangent polyline round the outer wall. Fixed phalanx lengths are never stretched. */
function tangentChain(x,z,radius,lengths,mirror=false){
 let px=mirror?-x:x,pz=z;
 const angles=[];
 for(const length of lengths){
  const d=Math.hypot(px,pz);
  const a=Math.atan2(px,pz)+Math.acos(clamp(radius/d,-1,1));
  angles.push(mirror?Math.PI-a:a);
  px+=Math.cos(a)*length;pz-=Math.sin(a)*length;
 }
 return angles;
}
function segmentClearance(a,b,r,profile,grip){
 // A cylinder section at each point's height; sample the actual rigid link centreline.
 let result=Infinity;
 for(let j=0;j<=16;j++){
  const t=j/16,x=THREE.MathUtils.lerp(a.x,b.x,t)+grip.x,y=THREE.MathUtils.lerp(a.y,b.y,t)+grip.y,z=THREE.MathUtils.lerp(a.z,b.z,t)+grip.z;
  if(y<0||y>profile.height)continue;
  result=Math.min(result,Math.hypot(x,z)-outerRadius(profile,y)-r);
 }
 return result;
}

export function createArticulatedHand(root,wrist){
 const cache=new WeakMap();
 const fingers=DIGITS.map(spec=>({...spec,nodes:['MCP','PIP','DIP'].map(s=>root.getObjectByName(spec.name+s))}));
 const thumbNodes=['thumbCMC','thumbIP'].map(n=>root.getObjectByName(n));
 if(fingers.some(f=>f.nodes.some(n=>!n))||thumbNodes.some(n=>!n))throw new Error('The drinking mannequin is missing an articulated digit.');
 let profile=null,closure=0;
 function targets(p){
  if(cache.has(p))return cache.get(p);
  const grip=handGripPosition(p);
  const digits=fingers.map(f=>{
   const mcp=f.nodes[0].position;
   return tangentChain(mcp.x+grip.x,mcp.z+grip.z,outerRadius(p,grip.y+f.y)+f.radius+.0006,f.lengths);
  });
  const t=thumbNodes[0].position;
  const thumb=tangentChain(t.x+grip.x,t.z+grip.z,outerRadius(p,grip.y+t.y)+.0082+.0006,[.035,.030],true);
  const value={grip,digits,thumb};cache.set(p,value);return value;
 }
 function setGrip(p,value){
  profile=p;closure=clamp(value,0,1);const poses=targets(p);
  for(let i=0;i<fingers.length;i++){
   let previous=0;
   for(let j=0;j<3;j++){
    const absolute=THREE.MathUtils.lerp(.10+j*.13,poses.digits[i][j],closure);
    fingers[i].nodes[j].rotation.set(0,absolute-previous,0);previous=absolute;
   }
  }
  let previous=0;
  for(let j=0;j<2;j++){
   // Thumb opens away from the palm, then closes on the opposite (-X) wall.
   const absolute=THREE.MathUtils.lerp(Math.PI+.48+j*.06,poses.thumb[j],closure);
   thumbNodes[j].rotation.set(0,absolute-previous,0);previous=absolute;
  }
  wrist.updateWorldMatrix(false,true);
 }
 function diagnostics(){
  if(!profile)return {};
  const inverse=wrist.matrixWorld.clone().invert(),grip=targets(profile).grip;
  let fingersMin=Infinity,thumbMin=Infinity;
  const tipPositions=[];
  for(const f of fingers){
   for(let j=0;j<3;j++){
    const n=f.nodes[j],a=n.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse),b=n.localToWorld(new THREE.Vector3(f.lengths[j],0,0)).applyMatrix4(inverse);
    fingersMin=Math.min(fingersMin,segmentClearance(a,b,f.radius,profile,grip));
    if(j===2)tipPositions.push(b.toArray());
   }
  }
  for(let j=0;j<2;j++){
   const n=thumbNodes[j],a=n.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse),b=n.localToWorld(new THREE.Vector3(j===0?.035:.030,0,0)).applyMatrix4(inverse);
   thumbMin=Math.min(thumbMin,segmentClearance(a,b,j===0?.0082:.0076,profile,grip));
  }
  return {handedness:'right',closure,fingerMinClearance:fingersMin,thumbMinClearance:thumbMin,
   fingerTipPositions:tipPositions,thumbTipPosition:thumbNodes[1].localToWorld(new THREE.Vector3(.030,0,0)).applyMatrix4(inverse).toArray()};
 }
 return {setGrip,diagnostics,fingers,thumbNodes};
}
