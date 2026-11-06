import * as THREE from '../../../vendor/three.module.js';

/**
 * The boulders round Umi-no-yu's rock bath (岩風呂): rounded river and shore stones, set round the water's edge on a
 * bed of mortar the way a 1970s–80s inn or town bath built its 露天風呂, low on the sea side so the bathers look over
 * them, a gap of low stones by the door to step in at, and two big ones to lean back against.
 *
 * Each is a closed, smooth stone: one surface, every edge shared by two faces, its corners shared, so it never tears
 * into loose triangles and the ink (render/ink-pipeline.js) draws only its outline. Its lumps come from the room's
 * seeded sequence (onsen.js), drawn in the same order and number as before, so every rock keeps its place, size,
 * colour and turn, and nothing after it in the sequence changes.
 */
export const ONSEN_ROCKS=Object.freeze({
 // How finely each is cut, by its size (the room's scale, metres): the small sea-side stones are never more than a few
 // centimetres on screen, the big ones you lean on fill a low frame (12d), so their outline must stay round there.
 detail:Object.freeze([[.2,2],[.3,3],[Infinity,4]]),squash:.62,lump:Object.freeze([.78,1.13]),blend:16,draws:240,
 why:'Rounded shore stones round the rock bath: what you sit against and step over, low on the sea side so the view from the water is over them.',
 period:'Shōwa 露天風呂: natural stones set in mortar round a sunk pool, with a low stone at the door to step in.'
});

const key=(x,y,z)=>`${Math.round(x*1e4)},${Math.round(y*1e4)},${Math.round(z*1e4)}`;
/** A sphere geometry with its shared corners merged: positions and an index only. */
function indexedSphere(detail){
 const g=new THREE.IcosahedronGeometry(1,detail),p=g.attributes.position,at=new Map(),pos=[],index=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=key(x,y,z);
  if(!at.has(k)){at.set(k,pos.length/3);const l=Math.hypot(x,y,z);pos.push(x/l,y/l,z/l);}index.push(at.get(k));}
 g.dispose();return {pos,index};
}
// The old rock's 42 corners (an icosahedron split once), and for each of its 240 face corners which of them it is: each
// corner's lump is the first of its draws, so the stone keeps the shape it was meant to have.
const BASE=(()=>{const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position,at=new Map(),dirs=[],corner=[];
 for(let i=0;i<p.count;i++){const k=key(p.getX(i),p.getY(i),p.getZ(i));
  if(!at.has(k)){at.set(k,dirs.length);dirs.push(new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)).normalize());}corner.push(at.get(k));}
 g.dispose();return {dirs,corner};})();
const SPHERES=new Map();
const sphere=d=>{if(!SPHERES.has(d))SPHERES.set(d,indexedSphere(d));return SPHERES.get(d);};
/** How finely a rock of this size is cut (ONSEN_ROCKS.detail). */
export const rockDetail=size=>ONSEN_ROCKS.detail.find(([below])=>size<below)[1];

/**
 * One boulder, unit size (about 1 m across, 0.62 m high before the room scales it), from `draw` (the room's seeded
 * sequence, [0, 1)): takes exactly ONSEN_ROCKS.draws values. Indexed, smooth normals. `size`: the scale the room gives it.
 * @param {()=>number} draw
 * @param {number} [size]
 */
export function rockGeometry(draw,size=1){
 const SPHERE=sphere(rockDetail(size));
 const R=ONSEN_ROCKS,[lo,hi]=R.lump,lump=new Array(BASE.dirs.length).fill(null);
 for(let i=0;i<R.draws;i++){const k=lo+draw()*(hi-lo),c=BASE.corner[i%BASE.corner.length];if(lump[c]===null)lump[c]=k;}
 const n=SPHERE.pos.length/3,pos=new Float32Array(n*3),d=new THREE.Vector3();
 for(let i=0;i<n;i++){d.fromArray(SPHERE.pos,i*3);
  // The lumps blend smoothly over the stone: each corner's weight falls off with the angle from it.
  let s=0,w=0;BASE.dirs.forEach((b,j)=>{const q=Math.exp(R.blend*(d.dot(b)-1));s+=q*lump[j];w+=q;});
  const k=s/w;pos[i*3]=d.x*k;pos[i*3+1]=d.y*k*R.squash;pos[i*3+2]=d.z*k;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(SPHERE.index.slice());
 g.computeVertexNormals();g.computeBoundingSphere();g.computeBoundingBox();g.name='Bath rock';
 return g;
}
