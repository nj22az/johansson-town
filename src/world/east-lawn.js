import * as THREE from '../../vendor/three.module.js';
import {KITANO_SEAWALL_GAP} from './kitano-link-plan.js';
import {applyTerrainNormals} from './terrain-surface.js';
import {GROUND} from '../render/ground-palette.js';
import {MAIN_ROAD} from './main-road.js';
import {PARK,TURF_TINT,PARK_TERRAIN_SEGMENTS} from './park-layout.js';
import {GROUND_LAYER} from './ground-layers.js';
import {HARBOUR_PARK_EXTENSION,inHarbourPark} from './harbour-park-plan.js';
import {BEACH,BEACH_EDGES,BEACH_GRADES,BEACH_SHORE,BEACH_DRY_EDGE_X,beachHeight,beachProfile,gradedHeight,onBeach} from './beach-layout.js';
import {GROUND_CLASSES} from './ground-standard.js';
import {applyWorldUV} from '../render/world-uv.js';
import {GATEBALL,GATEBALL_ACTIVE} from './okinawa/layout.js';
import {paintedTurf,paintedGrit} from '../render/toy-surfaces.js';

/**
 * The east side of the town: one green from the boardwalk out to the water.
 *
 * With the port to the north and the shops to the west, everything east of the road
 * was ground you could look at but not stand on. The park sat in the middle of it like
 * an island — reachable only through its own ramp — and the rest was scenery half a
 * metre below the pavement, so the town had a walking lane rather than a side.
 *
 * It is now lawn at pavement level, from the pavement's east kerb to a seawall, with
 * sand and the sea below the wall. Harbour Park shares this level ground; its own
 * turf has an opening for the pond, so the surrounding lawn must leave that footprint clear.
 */
export const EAST_LAWN=Object.freeze({
 id:'east-lawn',surface:'grass',
 minX:MAIN_ROAD.pavementEast,maxX:33.2,minZ:-38,maxZ:21.2,
 /**
  * The parapet at the far end, and the south return along the auction apron. The return
  * stops at x 21.65 (southFrom less half its depth), leaving a truck-width gate between
  * it and the harbour office into the auction apron (EAST_QUAY.gate); before, the shed,
  * the ice plant and the east quay were reached through a 1.3 m slot beside the office.
  */
 wall:Object.freeze({x:33.55,z:-38.35,depth:.7,height:.58,southFrom:22}),
 /**
  * Sand from the foot of the wall out past the headland's edge. It has to stay above
  * the island's own ground (y -0.4) the whole way it is dry, or the land draws
  * through it; it crosses the water plane at y -0.56 a little beyond the old shore,
  * which is where the tide line ends up.
  */
 beach:BEACH,
});

/** True on the lawn itself. The caller asks the park and the roads first. */
export const eastLawnAt=(x,z,r=0)=>
 x>=EAST_LAWN.minX+r&&x<=EAST_LAWN.maxX-r&&z>=EAST_LAWN.minZ+r&&z<=EAST_LAWN.maxZ-r;

/** How many metres of lawn one tile of the park's grass covers. */
const TURF_METRES=2.4;

/** The green the lawn shows without a page to paint the turf on. */
const BARE_TURF=GROUND.grass;

/**
 * Ground drawn rather than fetched, for the surfaces the town supplies no photograph
 * of: sand, and the gravel of the yard on the other side of the road. A flat fill
 * reads as a sheet of card at this scale, and a couple of passes of soft blotches over
 * a scratch of grain is enough at walking height.
 */
export function groundTexture(base,marks,strokes){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,256,256);
 let seed=20250918;const random=()=>(seed=seed*1103515245+12345&0x7fffffff)/0x7fffffff;
 for(const [colour,count,size] of marks){
  ctx.fillStyle=colour;
  for(let i=0;i<count;i++){const x=random()*256,y=random()*256,r=size*(.5+random());
   ctx.beginPath();ctx.ellipse(x,y,r,r*(.6+random()*.7),random()*Math.PI,0,Math.PI*2);ctx.fill();}
 }
 if(strokes){
  ctx.strokeStyle=strokes;ctx.lineWidth=1;
  for(let i=0;i<900;i++){const x=random()*256,y=random()*256,a=random()*Math.PI*2,l=1.5+random()*2.5;
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);ctx.stroke();}
 }
 const texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;
 return texture;
}

/** The beach's surface at x, z: its profile with the grades laid over it. */
export const sandHeight=(x,z)=>gradedHeight(x,z,beachProfile(x));
/**
 * The east beach's sand, as one mesh: the rulebook's coral-white dry sand above the tide line and its wet band below
 * (ground-standard.js beach-sand), raked grit for the finish, laid over the outline of beach-layout.js (onBeach).
 */
export function buildBeachSand({shadows=false}={}){
 const S=GROUND_CLASSES['beach-sand'],E=BEACH_EDGES,P=BEACH.profile;
 // The tide line: where the profile crosses the wet band's top, and a line just above it to blend over.
 const at=y=>{for(let i=1;i<P.length;i++){const [ax,ay]=P[i-1],[bx,by]=P[i];if(by<=y&&ay>y)return ax+(y-ay)*(bx-ax)/(by-ay);}return null;};
 const lines=(from,to,keep,step=.5,fine=[])=>{const set=new Set(keep.filter(v=>v>=from-1e-9&&v<=to+1e-9).map(v=>+v.toFixed(4)));for(let v=from;v<to;v+=step)set.add(+v.toFixed(4));for(const [a,b,f=.5] of fine)for(let v=Math.max(from,a);v<=Math.min(to,b);v+=f)set.add(+v.toFixed(4));set.add(to);return [...set].sort((a,b)=>a-b);};
 const xs=lines(P[0][0],P.at(-1)[0],[...P.map(p=>p[0]),E.quayEdge,E.quayEnd,E.court.maxX,E.school.maxX,E.walk.minX-.1,E.walk.maxX+.1,at(S.wetBelow),at(S.wetBelow+S.wetBlend/2),at(S.wetBelow+S.wetBlend)].filter(v=>v!==null),.5,
  // Every 10 cm across the short bank where the lane's corner meets the water (beach-layout.js BEACH_SHORE): drawn coarse,
  // its facets showed as ink scratches.
  [[BEACH_SHORE.coastX-.2,BEACH_DRY_EDGE_X+.4,.1]]);
 // Along the beach a row every metre; every half metre where the sand is graded along z (BEACH_GRADES' cores across it).
 const zs=lines(BEACH.minZ,BEACH.maxZ,[E.jettyNorth,E.quayNorth,E.court.maxZ,E.school.minZ,...BEACH.accesses.flatMap(a=>[a.z-a.half,a.z+a.half])],1,
  [...BEACH_GRADES.filter(g=>g.core.minZ===g.core.maxZ).map(g=>[g.core.minZ-3,g.core.maxZ+3]),[BEACH.maxZ-3.2,BEACH.maxZ,.1]]);
 const dry=new THREE.Color(S.colour),wet=new THREE.Color(S.wet),c=new THREE.Color();
 const positions=[],colours=[],index=[];
 for(const z of zs)for(const x of xs){
  const y=sandHeight(x,z);positions.push(x,y,z);
  const t=Math.max(0,Math.min(1,(S.wetBelow+S.wetBlend-y)/S.wetBlend));c.copy(dry).lerp(wet,t*t*(3-2*t));colours.push(c.r,c.g,c.b);
 }
 const n=xs.length;
 for(let j=0;j<zs.length-1;j++)for(let i=0;i<n-1;i++){
  if(!onBeach((xs[i]+xs[i+1])/2,(zs[j]+zs[j+1])/2))continue;
  const a=j*n+i,b=a+1,d=a+n,e=d+1;index.push(a,d,b,b,d,e);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));
 geometry.setIndex(index);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const material=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1,dithering:true});
 if(typeof document!=='undefined'&&document.createElement){try{material.map=paintedGrit();applyWorldUV(material,2.4);}catch{}}
 const mesh=new THREE.Mesh(geometry,material);mesh.name='east-beach-sand';mesh.userData.groundClass='beach-sand';mesh.receiveShadow=!!shadows;
 return mesh;
}

/** Roughly how wide one cell of the lawn's grid is. */
const CELL=.6;

/**
 * @param {object} options
 * @param {THREE.Object3D} options.parent
 * @param {Array} options.colliders  the wall and the treeline are solid.
 * @param {(x:number,z:number)=>number} [options.heightAt]  the walkable ground, so the
 *   lawn's surface is the surface the player's feet are put on — in particular the
 *   graded foot of the park mound, which used to be a vertical face you walked into.
 */
export function buildEastLawn({parent,colliders=[],shadows=false,heightAt=null,paved=null,anisotropy=4,register=()=>{},onAction=()=>{}}={}){
 const group=new THREE.Group();group.name='East lawn, seawall and beach';parent.add(group);
 const {wall,beach}=EAST_LAWN;
 const width=EAST_LAWN.maxX-EAST_LAWN.minX,depth=EAST_LAWN.maxZ-EAST_LAWN.minZ;

 // A grid rather than one slab: the mound's foot is graded into the lawn now, so the
 // green has to follow the ground the player actually walks on. Cells wholly inside
 // the park square are left out — the park's own model stands there.
 // The grid lines carry the park square's own edges, so every cell lies either wholly
 // on the mound or wholly off it. Without that the cells that straddled the boundary
 // rose to the mound's height at their inner corners and fought the model's surface
 // for the same pixels — a bright green seam all the way round the park.
 const lines=(from,to,...keep)=>{
  const set=new Set([from,to,...keep.filter(v=>v>from+.05&&v<to-.05)]);
  for(let v=from;v<to;v+=CELL)set.add(v);
  return [...set].sort((a,b)=>a-b);
 };
 // Carry the mound's edge samples into the lawn: matching heights alone leaves
 // hairline gaps when a coarse triangle bridges a bend in a finer border.
 // The gateball court's edges too: the court is level ground cut into the hill's foot,
 // and the lawn stops at its retaining wall rather than sloping in under the sand.
 const boundary=axis=>{const half=axis==='x'?PARK.halfX:PARK.halfZ;return Array.from({length:PARK_TERRAIN_SEGMENTS+1},(_,i)=>PARK[axis]-half+i/PARK_TERRAIN_SEGMENTS*half*2);};
 const xs=lines(EAST_LAWN.minX,EAST_LAWN.maxX,...boundary('x'),HARBOUR_PARK_EXTENSION.minX,HARBOUR_PARK_EXTENSION.maxX,GATEBALL.minX,GATEBALL.maxX);
 const zs=lines(EAST_LAWN.minZ,EAST_LAWN.maxZ,...boundary('z'),HARBOUR_PARK_EXTENSION.minZ,HARBOUR_PARK_EXTENSION.maxZ,GATEBALL.minZ,GATEBALL.maxZ);
 const onCourt=(x,z)=>GATEBALL_ACTIVE&&x>GATEBALL.minX&&x<GATEBALL.maxX&&z>GATEBALL.minZ&&z<GATEBALL.maxZ;
 // The lawn's own ground: at its west edge the shading is not bent towards Main Street's footway and road, laid on
 // their own plan beside it (ground-plan.js).
 const height=(x,z)=>heightAt?heightAt(Math.max(x,EAST_LAWN.minX),z):0;
 const onPark=(x,z)=>inHarbourPark(x,z);
 const vertices=[],turfUV=[],faces=[];
 // Under a path the turf is tucked a few centimetres down. Its 1.2m grid runs straight
 // between samples while the paving follows the slope on a finer one, so where the ground
 // bends -- the rise beside the harbour office -- the grass came up through the middle
 // of the path as a green stripe.
 const tuck=(x,z)=>paved?.(x,z)?.08:0;
 for(const z of zs)for(const x of xs){vertices.push(x,height(x,z)+GROUND_LAYER.grass-tuck(x,z),z);turfUV.push(x/TURF_METRES,z/TURF_METRES);}
 for(let j=0;j<zs.length-1;j++)for(let i=0;i<xs.length-1;i++){
  const mx=(xs[i]+xs[i+1])/2,mz=(zs[j]+zs[j+1])/2;
  if(onPark(mx,mz)||onCourt(mx,mz))continue;
  const a=j*xs.length+i,b=a+1,c=a+xs.length,d=c+1;
  faces.push(a,c,b,b,c,d);
 }
 const turf=new THREE.BufferGeometry();
 turf.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 turf.setAttribute('uv',new THREE.Float32BufferAttribute(turfUV,2));
 turf.setIndex(faces);applyTerrainNormals(turf,height);
 const lawn=new THREE.Mesh(turf,new THREE.MeshStandardMaterial({color:BARE_TURF,roughness:1}));
 lawn.name='east-lawn-grass';lawn.receiveShadow=!!shadows;group.add(lawn);

 // The parapet. Low enough to see the water over, solid enough to stop at.
 const stone=new THREE.MeshStandardMaterial({color:0xa8a293,roughness:.92});
 const cap=new THREE.MeshStandardMaterial({color:0x8e897c,roughness:.86});
 const parapet=(w,d,x,z,id='east-seawall')=>{
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,wall.height,d),stone);
  body.position.set(x,wall.height/2,z);body.castShadow=!!shadows;body.receiveShadow=!!shadows;group.add(body);
  const coping=new THREE.Mesh(new THREE.BoxGeometry(w+.14,.1,d+.14),cap);
  coping.position.set(x,wall.height+.05,z);coping.receiveShadow=!!shadows;group.add(coping);
  colliders.push({id,x,z,w:w+.14,d:d+.14,height:wall.height+.1});
 };
 // Real openings in the mesh and collision wall lead down to the sand.
 let wallFrom=-36;
 for(const access of [...BEACH.accesses,KITANO_SEAWALL_GAP,{z:EAST_LAWN.maxZ+wall.depth/2,half:0}].sort((a,b)=>a.z-b.z)){
  const wallTo=access.z-access.half;
  if(wallTo>wallFrom)parapet(wall.depth,wallTo-wallFrom,wall.x,(wallFrom+wallTo)/2);
  wallFrom=access.z+access.half;
 }
 // The south return along the auction apron, as the plan above says (EAST_LAWN.wall.southFrom): it was never built, and
 // the strip between the lawn's south edge and the quay's north edge (z -38.9 to -38) lay open 0.4 m deep, from the
 // truck gate east to the seawall (Kōji stepped into it on his way to the ice plant). The wall fills the whole strip.
 // (3 cm into the lawn, so its face lies behind the lawn's stone edging rather than on its plane)
 {const z0=-38.9,z1=EAST_LAWN.minZ+.03,x0=wall.southFrom,x1=wall.x-wall.depth/2;parapet(x1-x0,z1-z0,(x0+x1)/2,(z0+z1)/2,'east-lawn-south-return');}



 // The beach (step 4 of the ground plan): coral-white sand from under the parapet out under the water, its wet band at
 // the water's edge, graded up to the quay, the fuel depot's court, the town hall's yard and the coastal walk where it
 // meets them (beach-layout.js BEACH_GRADES), never a step. One grid, half a metre square, with a line on every edge
 // the sand meets and on the tide line, so the grades and the wet band follow it exactly.
 const shore=buildBeachSand({shadows});group.add(shore);
 for(const access of BEACH.accesses){
  const {fromX,toX,z,half}=access,y=beachHeight(toX,z);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([
   fromX,.008,z-half,fromX,.008,z+half,toX,y+.008,z-half,toX,y+.008,z+half],3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,0,1,1,0,1,1],2));
  geometry.setIndex([0,1,2,2,1,3]);geometry.computeVertexNormals();
  const ramp=new THREE.Mesh(geometry,stone);ramp.name='Beach access ramp';ramp.receiveShadow=!!shadows;group.add(ramp);
  const anchor=new THREE.Object3D();anchor.position.set(fromX-.65,.9,z);group.add(anchor);
  register(anchor,'Read the beach access sign',()=>onAction('read','East beach','The opening in the seawall leads down to the sand. Follow the shore to the other beach entrance.'));
 }


 // The former north-edge treeline belongs to the retired layout. The town hall,
 // police box and residential access now occupy that edge; planting belongs to
 // the park and the individual gardens, without a second decorative tree system.

 const marker=new THREE.Object3D();marker.name='east-seawall-view';marker.position.set(wall.x-1.1,1.2,-6);group.add(marker);
 register(marker,'Look out over the seawall',()=>onAction('inspect','East seawall','Concrete coping warm from the afternoon. Below it the sand runs down to the water, and the tide has left a line of weed and one blue float.'));
 const garden={retired:true,tick(){}};
 /**
  * Lay the supplied park's own grass and leaf over the green, so the lawn and the mound
  * it runs up to are one field rather than two parks meeting along an edge. The model
  * is fetched by the detail stream, so this is called again once it arrives; until then
  * the lawn is the flat green above.
  * @returns {boolean} whether the grass was there to use.
  */
 const useParkGreenery=({grass}={})=>{
  if(!grass?.image)return false;
  // The tiling is in the lawn's own UVs, in metres, so the texture repeats once per
  // TURF_METRES wherever the ground goes.
  const map=grass.clone();map.needsUpdate=true;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(1,1);
  // You almost never look down at a lawn; you look along it, and along is where a
  // texture smears. Anisotropy is the one setting that fixes that, and it was pinned
  // at 4 while the rest of the town takes whatever the device will give.
  map.anisotropy=Math.max(map.anisotropy,anisotropy);
  lawn.material.map=map;lawn.material.color.setHex(TURF_TINT);lawn.material.needsUpdate=true;
  return true;
 };
 // The same painted turf as the park's own ground from the start, so the two greens match
 // before the park has streamed in -- and where it never does.
 if(typeof document!=='undefined'&&document.createElement){try{const turf=paintedTurf();if(turf)useParkGreenery({grass:turf});}catch{}}
 return {group,lawn,shore,garden,useParkGreenery,tick:garden.tick};
}
