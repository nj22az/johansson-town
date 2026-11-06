import * as THREE from '../../vendor/three.module.js';
/** Quiet scenery keeps moving while the player rests; no timer or task to complete. */
export function buildQuietLife(world){
 const group=new THREE.Group();group.name='Harbour gulls and garden butterflies';world.group.add(group);
 const white=new THREE.MeshStandardMaterial({color:0xe9e4d4,roughness:1,side:THREE.DoubleSide}),dark=new THREE.MeshStandardMaterial({color:0x526572,roughness:1});
 const birds=[];
 for(let i=0;i<4;i++){
  const g=new THREE.Group();g.position.set(9,9,-39);g.name='Circling harbour gull';g.userData.dynamicProp=true;
  const body=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),white);body.scale.set(1,.7,2);g.add(body);
  const wings=[];for(const side of [-1,1]){const pivot=new THREE.Group(),wing=new THREE.Mesh(new THREE.PlaneGeometry(.6,.22),white);wing.rotation.x=-Math.PI/2;wing.position.x=side*.3;pivot.add(wing);g.add(pivot);wings.push({pivot,side});}
  const head=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),dark);head.position.z=-.22;g.add(head);group.add(g);birds.push({g,wings,phase:i*1.8});
 }
 const butterflies=[];
 for(let i=0;i<3;i++){const g=new THREE.Group();g.name='Garden butterfly';g.userData.dynamicProp=true;const mat=new THREE.MeshStandardMaterial({color:[0xeec862,0xf1d6b0,0xbc937b][i],side:THREE.DoubleSide}),wings=[];for(const side of [-1,1]){const wing=new THREE.Mesh(new THREE.CircleGeometry(.085,7),mat);wing.position.x=side*.06;g.add(wing);wings.push({wing,side});}group.add(g);butterflies.push({g,wings,phase:i*2});}
 return {group,update(time){for(const b of birds){const t=time*.035+b.phase;b.g.position.set(9+Math.cos(t)*22,8+Math.sin(t*.7+b.phase)*1.3,-39+Math.sin(t)*10);b.g.rotation.y=-t;for(const w of b.wings)w.pivot.rotation.z=w.side*Math.sin(time*2.1+b.phase)*.15;}
 for(const b of butterflies){const t=time*.18+b.phase;b.g.position.set(-25+Math.cos(t)*3,1.05+Math.sin(t*2)*.3,54+Math.sin(t)*2);b.g.rotation.y=-t;for(const w of b.wings)w.wing.rotation.y=w.side*Math.sin(time*8)*.65;}}};
}
