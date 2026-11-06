import {beachAccessHeight,onBeach} from './beach-layout.js';
import * as THREE from '../../vendor/three.module.js';
import {GROUND} from '../render/ground-palette.js';
import {GROUND_LAYER} from './ground-layers.js';
import {paintedTurf} from '../render/toy-surfaces.js';
import {SCHOOL} from './school-layout.js';
import {applyTerrainNormals} from './terrain-surface.js';
import {WEST_SHORE} from './west-shore.js';
import {MAIN_STREET_GROUND as MS} from './ground-plan.js';
/**
 * The relocated blocks share Main Street's datum. Outside, a four-metre bank meets the island, except along the
 * west shore north of the seawall, where the ground stays level out to the bank's coping (west-shore.js).
 */
/** maxZ: level to the coastal walk's setts on the north shore (z 93.3, ground-plan-coast.js), so the walk lies flat. */
export const NEIGHBOURHOOD=Object.freeze({minX:-37,maxX:51.5,minZ:20.5,maxZ:93.4,margin:4});
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
/** The neighbourhood's ground at x, z, or null where the beach is (beach-layout.js onBeach) or beyond its bank. */
export function neighbourhoodHeight(x,z){
 if(onBeach(x,z)&&beachAccessHeight(x,z)===null)return null;
 return levelHeight(x,z);
}
/** The level ground and its bank, wherever asked (the mesh's edge on the beach's line included). */
function levelHeight(x,z){
 const B=NEIGHBOURHOOD,minX=z>=WEST_SHORE.level.minZ&&z<=WEST_SHORE.level.maxZ?WEST_SHORE.coast:B.minX;
 const d=Math.hypot(Math.max(minX-x,0,x-B.maxX),Math.max(B.minZ-z,0,z-B.maxZ));
 if(d>B.margin)return null;
 let h=d===0?0:-.4*smooth(d/B.margin);
 // The north beach opening's ramp; past it the beach is the beach's own (beach-layout.js), to the town hall's grounds and
 // the coastal walk: the neighbourhood's lawn no longer lies over the sand there (step 4 of the ground plan).
 if(x>=32.7&&z<30.5){const ramp=beachAccessHeight(x,z);if(ramp!==null)return ramp;}
 return h;
}
export function buildNeighbourhoodGround(parent,onLand){
 const B=NEIGHBOURHOOD,p=[],indices=[],uv=[];
 const height=(x,z)=>levelHeight(x,z)??-.4;
 // Main Street and the bus plaza are laid by the ground generator (ground-plan.js): no lawn under its carriageway.
 const skip=(x,z)=>x>=MS.pavementWest&&x<=MS.pavementEast&&z<=MS.maxZ||x<=-24.6&&z<=29.3||x>=5.2&&x<=33.2&&z<=21.2||x>=SCHOOL.minX-.9&&x<=(z<30.5?SCHOOL.seawall.east:SCHOOL.maxX+.9)&&z>=SCHOOL.minZ&&z<=SCHOOL.seawall.south+.6
  // The beach is drawn by east-lawn.js, out to the town hall's grounds and the coastal walk.
  ||onBeach(x,z);
 // Coarse tiles on flat ground, half-metre tiles only on the graded banks.
 const axis=(min,max,extra)=>[...new Set([...Array.from({length:9},(_,i)=>min-4+i*.5),...Array.from({length:Math.ceil((max-min)/2)},(_,i)=>Math.min(max,min+i*2)),...Array.from({length:9},(_,i)=>max+i*.5),...extra])].filter(n=>n>=min-4&&n<=max+4).sort((a,b)=>a-b);
 const xs=axis(B.minX,B.maxX,[-24.6,MS.pavementWest,5.2,33.2,-10.6,5.4,SCHOOL.minX-.9,SCHOOL.maxX+.9,41]),zs=axis(B.minZ,B.maxZ,[21.2,24.6,29.3,30.5,SCHOOL.minZ,SCHOOL.seawall.south+.6]);
 const coast=parent.getObjectByName('Island land')?.geometry,triangles=[];
 if(coast){const pos=coast.attributes.position,idx=coast.index;for(let i=0;i<idx.count;i+=3){const t=[0,1,2].map(k=>{const n=idx.getX(i+k);return [pos.getX(n),-pos.getY(n)];});if((t[1][0]-t[0][0])*(t[2][1]-t[0][1])-(t[1][1]-t[0][1])*(t[2][0]-t[0][0])<0)t.reverse();triangles.push(t);}}
 const clip=(poly,a,b)=>{const side=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]),out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],d=side(p),e=side(q);if(d>=-1e-8)out.push(p);if((d>=0)!==(e>=0)){const t=d/(d-e);out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}}return out;};
 const add=poly=>{const n=p.length/3;for(const [x,z] of poly){p.push(x,height(x,z)+GROUND_LAYER.grass,z);uv.push(x/6,-z/6);}for(let i=1;i<poly.length-1;i++)indices.push(n,n+i+1,n+i);};
 for(let iz=1;iz<zs.length;iz++)for(let ix=1;ix<xs.length;ix++){
  const x=xs[ix-1],xx=xs[ix],z=zs[iz-1],zz=zs[iz],quad=[[x,z],[xx,z],[xx,zz],[x,zz]];
  if(skip((x+xx)/2,(z+zz)/2))continue;
  if(quad.every(([x,z])=>onLand(x,z))){add(quad);continue;}
  for(const t of triangles){let poly=quad;for(let i=0;i<3&&poly.length;i++)poly=clip(poly,t[i],t[(i+1)%3]);if(poly.length>=3)add(poly);}
 }

 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);applyTerrainNormals(geometry,height);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:GROUND.grass,map:paintedTurf(),roughness:1}));mesh.name='Compact neighbourhood ground';mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
