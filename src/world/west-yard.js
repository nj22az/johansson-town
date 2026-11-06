import * as THREE from '../../vendor/three.module.js';
import {MAIN_ROAD} from './main-road.js';
import {paintedTurf} from '../render/toy-surfaces.js';
import {GROUND} from '../render/ground-palette.js';
import {GROUND_LAYER} from './ground-layers.js';

/**
 * The yard on the shop side of the street.
 *
 * The konbini stood in an invisible box: only its frontage met walkable ground, and
 * its ends and back were nothing you could stand on, so the one building the town is
 * really about could not be walked round. The east of the town is a green; this is
 * what the west is -- a lawn behind the shops, like the green across the street, with
 * the shop and the warehouse standing on it and room to get behind them.
 *
 * It reaches the quay at its south end and the pavement along its whole east edge, so
 * it joins the town rather than being a second island. The other two edges are closed
 * by a wall you can see, because ground that simply stops is the same invisible wall
 * this was built to remove.
 */
export const WEST_YARD=Object.freeze({
 id:'west-yard',surface:'grass',
 minX:-24.6,maxX:MAIN_ROAD.pavementWest,minZ:-38,maxZ:MAIN_ROAD.maxZ,
 /** Where the quay takes over along the south edge, and the bus station along the north. */
 quayFrom:-19,stationFrom:-10.6,
 wall:Object.freeze({height:.72,thickness:.5}),
 /**
  * Where the lanes of Nishi-machi come through the long wall, as lane centres. The
  * wall is broken for each, three metres wide, so the quarter behind it is the next
  * street over rather than ground on the far side of a wall.
  */
 lanes:Object.freeze([-27.5,-13,1.5,16]),
 laneHalf:1.5,
});

export const westYardAt=(x,z,r=0)=>
 x>=WEST_YARD.minX+r&&x<=WEST_YARD.maxX&&z>=WEST_YARD.minZ+r&&z<=WEST_YARD.maxZ-r;

/**
 * @param {object} options
 * @param {THREE.Object3D} options.parent
 * @param {Array} options.colliders  the boundary wall is solid.
 */
export function buildWestYard({parent,colliders=[],shadows=false}={}){
 const group=new THREE.Group();group.name='West yard and its boundary';parent.add(group);
 const width=WEST_YARD.maxX-WEST_YARD.minX,depth=WEST_YARD.maxZ-WEST_YARD.minZ;
 // A lawn, the same painted turf as the green across the street. It was speckled
 // gravel: from above, a grey patchwork behind the shops; at street level, dust. The
 // town reads as one place when both sides of Main Street stand on the same clean green.
 let turf=null;if(typeof document!=='undefined'&&document.createElement){try{turf=paintedTurf();}catch{}}
 if(turf){turf=turf.clone();turf.needsUpdate=true;turf.wrapS=turf.wrapT=THREE.RepeatWrapping;turf.repeat.set(width/2.4,depth/2.4);}
 // A centimetre short at each end, so its ends never lie in the footway's (Main Street's paving ends on the same lines).
 const ground=new THREE.Mesh(new THREE.BoxGeometry(width,.06,depth-.02),
  new THREE.MeshStandardMaterial({color:GROUND.grass,roughness:1,map:turf}));
 ground.name='west-yard-lawn';
 // Two centimetres under the paved routes, the same clearance the east lawn keeps.
 // The yard used to sit at exactly the height the lane surfacing draws at, so gravel
 // and pavement shared a plane the whole length of the shop frontage and the two
 // flickered against each other wherever they met.
 ground.position.set((WEST_YARD.minX+WEST_YARD.maxX)/2,GROUND_LAYER.gravel-.03,(WEST_YARD.minZ+WEST_YARD.maxZ)/2);
 ground.receiveShadow=!!shadows;group.add(ground);

 const stone=new THREE.MeshStandardMaterial({color:0x8b8779,roughness:.94});
 const cap=new THREE.MeshStandardMaterial({color:0x757165,roughness:.9});
 const {height,thickness}=WEST_YARD.wall;
 const wall=(w,d,x,z)=>{
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,height,d),stone);
  body.position.set(x,height/2,z);body.castShadow=!!shadows;body.receiveShadow=!!shadows;group.add(body);
  const coping=new THREE.Mesh(new THREE.BoxGeometry(w+.12,.09,d+.12),cap);
  coping.position.set(x,height+.045,z);coping.receiveShadow=!!shadows;group.add(coping);
  colliders.push({id:'west-yard-wall',x,z,w:w+.12,d:d+.12,height:height+.09});
 };
 // The long side, in lengths between the lane openings, and the return that closes the
 // corner the bus station does not. The south end is open: the yard runs straight on
 // onto the quay apron, which is how a working yard meets a quay.
 // Open service streets replace the obsolete internal dividing wall.
 return {group,ground};
}
