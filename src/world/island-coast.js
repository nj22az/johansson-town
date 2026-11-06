import {ISLAND_COAST} from './island-plan.js';
import * as THREE from '../../vendor/three.module.js';
import {GROUND} from '../render/ground-palette.js';
import {TUNNEL} from './coyote-tunnel.js';
import {paintedTurf} from '../render/toy-surfaces.js';
import {westShoreCovers} from './west-shore.js';

// One shoreline shared by the ground, visible retaining edge and visitor map.
// The shoreline fits the port, shops, park and inhabited residential blocks.
export const COASTLINE=[
 [-40,-50],
 ...ISLAND_COAST,
 [49,48],
 [47.5,40],[45,29],[45,-43],
 [44,-46.5],[41.5,-49],[38,-50],[20,-50]];
/** The land's bounding box, for the map and the residents' navigation grid. */
export const COAST_BOUNDS=Object.freeze({minX:Math.min(...COASTLINE.map(p=>p[0])),maxX:Math.max(...COASTLINE.map(p=>p[0])),minZ:Math.min(...COASTLINE.map(p=>p[1])),maxZ:Math.max(...COASTLINE.map(p=>p[1]))});
// The shore runs under the headland the tunnel goes through, and a boulder there stands
// in the tunnel's road. Along Nishi-machi the seawall is the shore, and north of it the
// west-shore bank (west-shore.js): no boulders and no retaining stone where they stand.
const underTunnel=(x,z)=>Math.abs(x-TUNNEL.x)<TUNNEL.bore.half+1.5&&z>TUNNEL.z-1;
export function buildIslandCoast(parent){
 const shape=new THREE.Shape();COASTLINE.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 // Unbuilt land is rough island grass, painted like the lawns, not a grey-khaki slab:
 // from the harbour it was the largest flat colour in view (docs/AMPLIFY-AUDIT.md).
 const groundMaterial=new THREE.MeshStandardMaterial({color:GROUND.grass,roughness:1});
 if(typeof document!=='undefined'&&document.createElement){try{const turf=paintedTurf().clone();turf.needsUpdate=true;turf.repeat.set(1/6,1/6);groundMaterial.map=turf;}catch{}}
 const ground=new THREE.Mesh(new THREE.ShapeGeometry(shape),groundMaterial);ground.rotation.x=-Math.PI/2;ground.position.y=-.4;ground.name='Island land';parent.add(ground);
 const positions=[],indices=[];
 // The faces stand 12 mm out to sea of the coastline: the harbour's quay walls stand on the same line, and a face in
 // their plane flashed through them at the waterline (the owner's iPhone, 20 October 2026: "Lots of flashing meshes").
 const ccw=COASTLINE.reduce((s,p,i)=>{const q=COASTLINE[(i+1)%COASTLINE.length];return s+p[0]*q[1]-q[0]*p[1];},0)>0;
 // Each edge of the coast as a stone face, except the spans the bank stands on (sampled every quarter metre).
 for(let i=0;i<COASTLINE.length;i++){
  const a=COASTLINE[i],b=COASTLINE[(i+1)%COASTLINE.length],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.25));
  const len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,ox=(ccw?1:-1)*(b[1]-a[1])/len*.012,oz=(ccw?-1:1)*(b[0]-a[0])/len*.012;
  let from=null;const face=(p,q)=>{const n=positions.length/3;positions.push(p[0]+ox,-.38,p[1]+oz,p[0]+ox,-1.5,p[1]+oz,q[0]+ox,-.38,q[1]+oz,q[0]+ox,-1.5,q[1]+oz);indices.push(n,n+1,n+2,n+2,n+1,n+3);};
  for(let s=0;s<=steps;s++){const t=s/steps,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],mid=[a[0]+(b[0]-a[0])*(s+.5)/steps,a[1]+(b[1]-a[1])*(s+.5)/steps];
   const open=s<steps&&!westShoreCovers(mid[0],mid[1]);if(open&&from===null)from=p;if(!open&&from!==null){face(from,p);from=null;}}
 }
 const edge=new THREE.BufferGeometry();edge.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));edge.setIndex(indices);edge.computeVertexNormals();
 const wall=new THREE.Mesh(edge,new THREE.MeshStandardMaterial({color:0x79847c,roughness:1,side:THREE.DoubleSide}));wall.name='Coastal retaining stone';parent.add(wall);
 const rocks=[],dummy=new THREE.Object3D();
 for(let i=0;i<COASTLINE.length;i++){
  const a=COASTLINE[i],b=COASTLINE[(i+1)%COASTLINE.length],count=Math.floor(Math.hypot(b[0]-a[0],b[1]-a[1])/3);
  for(let j=0;j<count;j++){const t=(j+.5)/count,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;if(z< -40||underTunnel(x,z)||x< -39&&z<30||westShoreCovers(x,z)||x>44&&z>-43&&z<40)continue;rocks.push({x,z,size:.65+.25*Math.sin(i*9+j*2.3)});}
 }
 const shore=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:0x859080,roughness:1}),rocks.length);
 rocks.forEach((r,i)=>{dummy.position.set(r.x,-.35,r.z);dummy.scale.set(r.size*1.6,r.size*.7,r.size);dummy.rotation.set(.2,i*1.7,.15);dummy.updateMatrix();shore.setMatrixAt(i,dummy.matrix);});shore.name='Rocky island shore';parent.add(shore);
 return ground;
}
