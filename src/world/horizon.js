import * as THREE from '../../vendor/three.module.js';
import {createSurroundingOcean,onOceanLight,SEA_LEVEL} from './ocean.js';
// Distant scenery outside the collision/navigation core; replaces fog-hidden cut-off edges.
export function addHorizon(parent){
 const sea=createSurroundingOcean();
 parent.add(sea);
 addDistantIslands(parent);
 const mesh=new THREE.PlaneGeometry(600,300,60,30);mesh.rotateX(-Math.PI/2);const p=mesh.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i)+650,edge=Math.min(1,Math.max(0,(z-500)/60));const ridge=14+30*Math.exp(-Math.pow((x+70)/75,2))+18*Math.exp(-Math.pow((x-110)/65,2))+5*Math.sin(x*.055+z*.026)+4*Math.cos(z*.08);p.setXYZ(i,x,edge*ridge-1,z);const c=new THREE.Color(0x6e8265).lerp(new THREE.Color(0x9ca68b),Math.max(0,Math.min(1,z/600)));colors.push(c.r,c.g,c.b);}
 mesh.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));mesh.computeVertexNormals();const hills=new THREE.Mesh(mesh,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));hills.name='Distant wooded ridge';hills.userData.horizon=true;parent.add(hills);return hills;
}

/**
 * Islands out at sea, blue with distance: a long one with two summits off the beach,
 * a flat-topped rock, and low humps round the rest of the compass. They are flat
 * cut-outs of colour, darker on top and lighter where they meet the haze, and take the
 * sea's light so they go warm at dusk and dark at night.
 */
export const DISTANT_ISLANDS=Object.freeze([
 // x, z, length, height, depth, turn
 // A ring beyond both coasts: the island grew south and the airport island east, and
 // four of the old ones ended up standing on land as blue hills (tests/horizon.test.mjs).
 [400,-30,48,15,16,.15],[-120,-420,30,8,12,-.3],[40,-330,42,11,14,.05],[-210,-230,34,9,12,.8],
 [-260,60,46,13,16,1.4],[-220,300,40,11,14,-.1],[320,250,40,12,16,.7],
].map(Object.freeze));
function addDistantIslands(parent){
 const top=new THREE.Color('#6f98c4'),foot=new THREE.Color('#b6d4ea'),tmp=new THREE.Color();
 const material=new THREE.MeshBasicMaterial({vertexColors:true,fog:false,toneMapped:false});
 const group=new THREE.Group();group.name='Distant islands';group.userData.horizon=true;
 DISTANT_ISLANDS.forEach(([x,z,length,height,depth,turn],k)=>{
  const geo=new THREE.SphereGeometry(1,40,10,0,Math.PI*2,0,Math.PI/2),p=geo.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){
   const vx=p.getX(i),vy=p.getY(i),vz=p.getZ(i);
   // Two or three summits along the length, and a lumpy skyline.
   const ridge=.55+.45*Math.exp(-Math.pow((vx-.35*Math.sin(k*2.3))/.45,2))+.25*Math.exp(-Math.pow((vx+.5)/.25,2))*(k%2)+.06*Math.sin(vx*17+k)+.04*Math.sin(vz*13+k*3);
   p.setXYZ(i,vx,vy*ridge,vz);
   tmp.copy(foot).lerp(top,Math.min(1,Math.pow(vy,.7)*1.2));colors.push(tmp.r,tmp.g,tmp.b);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const isle=new THREE.Mesh(geo,material);isle.name='Distant island';
  isle.position.set(x,SEA_LEVEL-.4,z);isle.scale.set(length,height,depth);isle.rotation.y=turn;
  isle.castShadow=isle.receiveShadow=false;group.add(isle);
 });
 parent.add(group);
 const day=new THREE.Color('#ffffff'),dusk=new THREE.Color('#f3c6b2'),night=new THREE.Color('#2a3850'),wet=new THREE.Color('#c8d2da');
 onOceanLight(({day:d,dusk:k},rain)=>{material.color.copy(night).lerp(day,d);if(k>0)material.color.lerp(dusk,k*.8);if(rain)material.color.multiply(wet);});
 return group;
}
