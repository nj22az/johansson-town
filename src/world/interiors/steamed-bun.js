import * as THREE from '../../../vendor/three.module.js';

// A flattened base, full steamed belly and twelve folds pinched at the crown.
// Coordinates are metres, with the bottom resting on y=0.
export function createSteamedBunGeometry(){
 const profile=[[0,0],[.075,0],[.116,.015],[.135,.045],[.137,.078],[.126,.115],[.100,.146],[.067,.169],[.035,.180],[.014,.174],[0,.169]];
 const g=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),64);
 const p=g.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){
  let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const theta=Math.atan2(x,z);
  const fold=Math.pow((Math.cos(theta*12)+1)/2,4)*THREE.MathUtils.smoothstep(y,.075,.175);
  const radius=Math.hypot(x,z),shrink=radius?Math.max(0,radius-.012*fold)/radius:1;
  p.setXYZ(i,x*shrink,y-.004*fold,z*shrink);
  const shade=1-.10*fold;colors.push(.97*shade,.925*shade,.82*shade);
 }
 // A palm-sized bao: 11 cm across and just over 7 cm tall.
 g.scale(.4,.4,.4);g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingBox();return g;
}
