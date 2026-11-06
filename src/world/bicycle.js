import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';

export const BOOKSHOP_BICYCLE=Object.freeze({x:.7,z:9.2});

// Metre-scale commuter bicycle. Only the playable one keeps moving assemblies.
export function buildBicycle({x=0,z=0,rotation=0,colour=0x426969,shadows=false,animated=false}={}){
 const object=new THREE.Group();object.name='parked-commuter-bicycle';object.position.set(x,0,z);object.rotation.y=rotation;
 const parts=[],wheels=[],rubber=0x262827,steel=0x949b94;
 let target=parts;
 function part(geometry,color,position=[0,0,0],rotation=[0,0,0]){
  const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(1,1,1));
  geometry.applyMatrix4(matrix);const rgb=new THREE.Color(color),values=new Float32Array(geometry.attributes.position.count*3);
  for(let i=0;i<values.length;i+=3){values[i]=rgb.r;values[i+1]=rgb.g;values[i+2]=rgb.b;}geometry.setAttribute('color',new THREE.BufferAttribute(values,3));target.push(geometry);
 }
 function tube(a,b,r=.018,color=colour){
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
  const geometry=new THREE.CylinderGeometry(r,r,delta.length(),6);
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));part(geometry,color,start.add(end).multiplyScalar(.5).toArray());
 }
 const wheelRadius=.31,axleY=.338,wheelbase=1.08;
 for(let wi=0;wi<2;wi++){
  const wz=wi===0?-wheelbase/2:wheelbase/2,wheelParts=[];target=wheelParts;
  part(new THREE.TorusGeometry(wheelRadius,.028,6,28),rubber,[0,axleY,wz],[0,Math.PI/2,0]);
  part(new THREE.TorusGeometry(.281,.009,5,28),steel,[0,axleY,wz],[0,Math.PI/2,0]);
  tube([-.055,axleY,wz],[.055,axleY,wz],.024,steel);
  for(let i=0;i<16;i++){const angle=i/16*Math.PI*2;tube([i%2?.025:-.025,axleY,wz],[0,axleY+Math.sin(angle)*.28,wz+Math.cos(angle)*.28],.003,steel);}
  // Mudguards belong to the frame, never to the spinning spokes.
  target=parts;part(new THREE.TorusGeometry(.353,.014,5,24,Math.PI),steel,[0,axleY,wz],[0,Math.PI/2,0]);target=wheelParts;
  for(const geometry of wheelParts)geometry.translate(0,-axleY,-wz);
  const wheelGeometry=mergeGeometries(wheelParts,false);wheelParts.forEach(p=>p.dispose());
  const wheelMesh=new THREE.Mesh(wheelGeometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78,metalness:.1}));wheelMesh.name=`commuter-bicycle-wheel-${wi+1}`;wheelMesh.castShadow=shadows;wheelMesh.receiveShadow=true;
  const wheel=new THREE.Group();wheel.name=`commuter-bicycle-wheel-pivot-${wi+1}`;wheel.position.set(0,axleY,wz);wheel.add(wheelMesh);wheels.push(wheel);
 }
 target=parts;
 const crank=[0,.32,.12],rear=[0,axleY,.54],seat=[0,.55,.18],head=[0,.83,-.43];
 for(const [a,b] of [[crank,seat],[seat,head],[head,crank],[seat,rear],[crank,rear]])tube(a,b,.022);
 for(const side of [-1,1])tube([side*.045,axleY,-.54],[side*.045,.72,-.40],.017);
 tube([0,.70,-.40],head,.027);
 tube(head,[0,1.06,-.37],.015,steel);
 tube([-.23,1.06,-.33],[.23,1.06,-.33],.014,steel);
 for(const side of [-1,1])tube([side*.17,1.06,-.33],[side*.26,1.04,-.25],.021,rubber);
 part(new THREE.TorusGeometry(.09,.01,5,16),steel,[.065,.32,.12],[0,Math.PI/2,0]);
 const pedals=[];
 for(const side of [-1,1]){
  const pieces=[];target=pieces;tube([side*.07,0,0],[side*.07,0,.12],.012,steel);
  const g=mergeGeometries(pieces,false);pieces.forEach(p=>p.dispose());
  const arm=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78}));arm.position.set(0,.32,.12);object.add(arm);
  const pedal=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,.08),new THREE.MeshStandardMaterial({color:rubber}));object.add(pedal);pedals.push({side,arm,pedal});
 }target=parts;
 for(const dy of [-.06,.06])tube([.07,.32+dy,.12],[.07,axleY+dy*.4,.54],.008,rubber);
 // Rear carrier, front basket, reflectors and a stand make the silhouette legible.
 for(const side of [-1,1]){tube([side*.09,.74,.31],[side*.09,.74,.70],.009,steel);tube([side*.045,axleY,.54],[side*.09,.74,.67],.008,steel);}
 for(const zz of [.32,.44,.56,.68])tube([-.09,.74,zz],[.09,.74,zz],.008,steel);
 for(const y of [.80,1.03])for(const [a,b] of [[[-.17,y,-.85],[.17,y,-.85]],[[-.17,y,-.52],[.17,y,-.52]],[[-.17,y,-.85],[-.17,y,-.52]],[[.17,y,-.85],[.17,y,-.52]]])tube(a,b,.008,steel);
 for(const xx of [-.17,-.085,0,.085,.17]){tube([xx,.80,-.85],[xx,1.03,-.85],.005,steel);tube([xx,.80,-.85],[xx,.80,-.52],.005,steel);}
 for(const xx of [-.17,.17])tube([xx,.80,-.52],[xx,1.03,-.52],.006,steel);
 part(new THREE.BoxGeometry(.07,.045,.028),0xb64a3d,[0,.72,.72]);
 part(new THREE.SphereGeometry(.037,8,6),0xe6ddbd,[.08,.79,-.52]);
 const standParts=[];target=standParts;tube([0,0,0],[.23,-.332,.10],.012,steel);target=parts;
 const standGeometry=mergeGeometries(standParts,false);standParts.forEach(p=>p.dispose());
 const stand=new THREE.Mesh(standGeometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78}));stand.position.set(0,.35,.14);object.add(stand);
 const saddle=new THREE.Mesh(new THREE.BoxGeometry(.21,.055,.28),new THREE.MeshStandardMaterial({color:rubber}));object.add(saddle);
 const post=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,1,6),new THREE.MeshStandardMaterial({color:steel}));object.add(post);
 let fit={scale:1,saddle:.9575};
 function setRiderFit(next=fit){
  fit=next;object.scale.setScalar(fit.scale);saddle.position.set(0,fit.saddle-.0275,.21);
  const height=fit.saddle-.055-.55;post.scale.y=height;post.position.set(0,.55+height/2,.20);
 }
 function animateRide(phase=0,riding=false){
  stand.rotation.z=riding?-1.5:0;
  for(const {side,arm,pedal} of pedals){const a=phase*Math.PI*2+(side===1?0:Math.PI);arm.rotation.x=-a;pedal.position.set(side*.12,.32+Math.sin(a)*.12,.12+Math.cos(a)*.12);}
 }
 setRiderFit();animateRide();
 if(!animated){
  for(const piece of [...object.children]){piece.updateMatrix();const g=piece.geometry.clone().applyMatrix4(piece.matrix);if(!g.attributes.color){const c=piece.material.color,values=new Float32Array(g.attributes.position.count*3);for(let i=0;i<values.length;i+=3){values[i]=c.r;values[i+1]=c.g;values[i+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(values,3));}parts.push(g);piece.removeFromParent();piece.geometry.dispose();piece.material.dispose();}
 }
 const geometry=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:.12}));mesh.name='commuter-bicycle-mesh';mesh.castShadow=shadows;mesh.receiveShadow=true;object.add(mesh);wheels.forEach(wheel=>object.add(wheel));
 object.userData.wheelRadius=wheelRadius;object.userData.wheelbase=wheelbase;
 const w=Math.abs(Math.cos(rotation))*.62+Math.abs(Math.sin(rotation))*1.88,d=Math.abs(Math.sin(rotation))*.62+Math.abs(Math.cos(rotation))*1.88;
 return {object,wheels,pedals,stand,saddle,setRiderFit,animateRide,collider:{x,z,w,d,height:1.10}};
}
