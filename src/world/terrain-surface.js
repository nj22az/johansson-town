import * as THREE from '../../vendor/three.module.js';

/** Sample the walking terrain across mesh boundaries. Independent edge normals made
 * a seamless heightfield look like separately lit square pieces of green card. */
export function applyTerrainNormals(geometry,heightAt){
 const positions=geometry.attributes.position,normals=new Float32Array(positions.count*3),step=.08;
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),z=positions.getZ(i);
  const dx=(heightAt(x+step,z)-heightAt(x-step,z))/(2*step);
  const dz=(heightAt(x,z+step)-heightAt(x,z-step))/(2*step),length=Math.hypot(dx,1,dz);
  normals.set([-dx/length,1/length,-dz/length],i*3);
 }
 geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));
 return geometry;
}
