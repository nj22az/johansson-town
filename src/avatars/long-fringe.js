import * as THREE from '../../vendor/three.module.js';

/** A closed, rounded curtain of loose hair, in model space. The crown is the
 * builder's fitted cap; this continuous shell overlaps it behind the temples.
 * Length and volume reuse the recipe dials, so saved looks need no new format.
 */
export function longFringeGeometry(recipe,m){
 const rows=18,cols=40,R=m.Rh,length=1.55+recipe.hair.length*.95,volume=.96+recipe.hair.volume*.15;
 const vertices=[],indices=[],stride=cols+1,layer=(rows+1)*stride;
 for(let inner=0;inner<2;inner++)for(let row=0;row<=rows;row++){
  const t=row/rows,round=Math.sin(Math.PI*t),end=THREE.MathUtils.smoothstep(t,.82,1);
  for(let col=0;col<=cols;col++){
   const edge=.91+.35*THREE.MathUtils.smoothstep(t,.3,1);
   const theta=edge+col/cols*(Math.PI*2-2*edge),radius=volume+.025*round-.16*end-inner*.085;
   const depth=1-.60*THREE.MathUtils.smoothstep(t,.18,.85);
   const x=Math.sin(theta)*R*m.headSX*radius,z=(Math.cos(theta)*depth-.08*t)*R*.98*radius;
   const y=m.headCentre+R*(.12-length*t+.07*end*Math.cos(theta*4));
   vertices.push(x,y,z);
  }
 }
 const quad=(a,b,c,d,flip=false)=>indices.push(...(flip?[a,c,b,a,d,c]:[a,b,c,a,c,d]));
 for(let inner=0;inner<2;inner++)for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
  const a=inner*layer+r*stride+c;quad(a,a+stride,a+stride+1,a+1,!!inner);
 }
 for(let c=0;c<cols;c++){
  quad(c,c+1,layer+c+1,layer+c);
  const a=rows*stride+c;quad(a,layer+a,layer+a+1,a+1);
 }
 for(let r=0;r<rows;r++){
  const a=r*stride,b=a+cols;quad(a,layer+a,layer+a+stride,a+stride);quad(b,b+stride,layer+b+stride,layer+b);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
