import * as THREE from '../../vendor/three.module.js';
// A camera inside the actual doorway; no photographic backdrop or duplicate set.
const camera=new THREE.PerspectiveCamera(65,4/3,.05,60);camera.position.set(0,2.15,3.1);camera.lookAt(-.4,1.05,-1.5);camera.updateMatrixWorld(true);
const stand=[];for(let x=-2.4;x<=2.4;x+=.6)for(let z=-1.2;z<=1.8;z+=.6)stand.push([+x.toFixed(2),0,+z.toFixed(2),.5,.78]);
export const WORKSHOP_VIEW={wide:{camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:65,aspect:4/3},floor:0,spots:{stand}}};
