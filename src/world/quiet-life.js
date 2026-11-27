import * as THREE from '../../vendor/three.module.js';
import {buildGulls} from './gulls.js';
/** Quiet scenery keeps moving while the player rests; no timer or task to complete. */
export function buildQuietLife(world){
 const group=new THREE.Group();group.name='Harbour gulls and garden butterflies';world.group.add(group);
 // The harbour's gulls are their own (gulls.js): umineko, drawn in the Blåhaj look.
 const gulls=buildGulls(world);
 const butterflies=[];
 for(let i=0;i<3;i++){const g=new THREE.Group();g.name='Garden butterfly';g.userData.dynamicProp=true;const mat=new THREE.MeshStandardMaterial({color:[0xeec862,0xf1d6b0,0xbc937b][i],side:THREE.DoubleSide}),wings=[];for(const side of [-1,1]){const wing=new THREE.Mesh(new THREE.CircleGeometry(.085,7),mat);wing.position.x=side*.06;g.add(wing);wings.push({wing,side});}group.add(g);butterflies.push({g,wings,phase:i*2});}
 return {group,gulls,update(time){gulls.update(time);
 for(const b of butterflies){const t=time*.18+b.phase;b.g.position.set(-25+Math.cos(t)*3,1.05+Math.sin(t*2)*.3,54+Math.sin(t)*2);b.g.rotation.y=-t;for(const w of b.wings)w.wing.rotation.y=w.side*Math.sin(time*8)*.65;}}};
}
