import * as THREE from '../../vendor/three.module.js';
import {NISHI} from './okinawa/layout.js';
import {ISLAND_COAST} from './island-plan.js';
import {rng} from './okinawa/kit.js';
import {GROUND_CLASSES} from './ground-standard.js';

/**
 * The west-shore bank (西海岸護岸): where the island's ground meets the sea north of the Nishi-machi seawall.
 *
 * The Nishi seawall (okinawa/quarters.js) ends at z 29.7, the quarter's ground at 29.3. North of it, to the coast's north-west corner at z 77, the
 * shore used to be a grass slope that ran out under a line of boulders, with the former garden's ground mesh buried
 * under it (garden-layout.js, park-access.js, removed with this bank: 27,000 triangles of which fewer than 300 ever
 * showed, a hump at the seawall's end). What stands there now is a bank a person can see and walk along, finished the
 * way the town finishes its edges on the water (the seawall walk, the quay coping, the east lawn's parapet and chain):
 *
 *   - the neighbourhood's level ground runs out to a coral-stone coping on the coast line, a kerb 10 cm proud of the
 *     grass (neighbourhood-ground.js keeps the ground level to it; the old four-metre grass slope is gone here);
 *   - from the coping the bank is pitched in coral stone down to a strip of sand at the water, the foreshore the waves
 *     wash over, with armour stones settled on it at the toe;
 *   - the drop from the coping to the sand is 0.62 m, more than a step, so the town's chain bollards run along the top
 *     (street-furniture.js CHAIN_RUNS), as they do along the east seawall;
 *   - at the north-west corner the bank turns and runs 2.1 m along the north shore to an end block, so the sea cannot
 *     get behind it; the north shore beyond lies in the lee and keeps its rock.
 *
 * Who walks it: the island's pedestrian circuit (island-plan.js COAST_WALK) comes off the seawall walk at z 30 and runs
 * north along the shore to Kitahama's west link at z 57 and on round the north shore; the grass verge between the walk
 * and the chain is where you stand to look over the reef, and the only place on the west shore where you can.
 *
 * World frame: x east, z north. Distances across the bank (`d`) are measured seaward from the coping's inner edge.
 */
const CORNER=ISLAND_COAST[1];   // [-40, 77]: the coast's north-west corner (island-plan.js)
const COAST=CORNER[0];          // the west coast line, x −40, where the land polygon ends
const COPING=.4;                // the coping's width: its outer edge is the coast line
export const WEST_SHORE=Object.freeze({
 id:'west-shore-bank',jp:'西海岸護岸',
 /** The coping's inner edge: the last line of level, walkable ground. */
 edge:COAST+COPING,coast:COAST,
 /** From the quarter's end to the coast's corner: the seawall's cap runs 0.4 m past NISHI.maxZ (okinawa/quarters.js) and hides the coping's first 0.4 m, so the pitching meets the last tetrapods. */
 fromZ:NISHI.maxZ,cornerZ:CORNER[1],
 /** The return along the north shore ends here; east of it the rock shore continues. */
 returnToX:-37.5,
 /** The ground stays level (y 0) out to the coping between these z, instead of the neighbourhood's four-metre slope. */
 level:Object.freeze({minZ:NISHI.maxZ,maxZ:CORNER[1]}),
 /** The profile across the bank, seaward from the coping's inner edge: [d, y]. */
 profile:Object.freeze({
  coping:Object.freeze({points:[[0,-.3],[0,.12],[COPING,.12]],why:'a kerb 10 cm proud of the grass; the collider that keeps feet off the pitching'}),
  pitching:Object.freeze({points:[[COPING,.12],[1.15,-.5],[1.15,-.9]],why:'coral stone pitched at 1 in 1.2 from the coping down to the foreshore'}),
  sand:Object.freeze({points:[[1.15,-.5],[2.1,-.64],[2.1,-.9]],why:'the strip of sand at the toe, 6 cm above still water, that the waves wash over'}),
 }),
 /** The chain bollards (street-furniture.js) stand on the verge 0.25 m inside the coping, as on the east seawall. */
 rail:Object.freeze({inset:.25,endGap:.9,why:'the drop from the coping to the sand is more than a step'}),
 /** Armour stones on the sand at the toe: every few metres, some half in the water. */
 stones:Object.freeze({every:3.4,seed:31,why:'what holds the toe of a pitched bank against the winter seas'}),
});

/** The bank's centreline (the coping's inner edge), south end to the end of the north return. */
export function westShorePath(){
 const S=WEST_SHORE;return [[S.edge,S.fromZ],[S.edge,S.cornerZ-COPING],[S.returnToX,S.cornerZ-COPING]];
}
/** Where the chain bollards run: along the verge, from just past the seawall's end round the corner to the end block. */
export function westShoreRail(){
 const S=WEST_SHORE,x=S.edge+S.rail.inset,z=S.cornerZ-COPING-S.rail.inset;
 return [x,S.fromZ+S.rail.endGap,x,z,S.returnToX-.1,z];
}
/** Whether the bank stands at x,z (its coping, pitching and sand): the coast's own wall and boulders are left off there. */
export function westShoreCovers(x,z){
 const S=WEST_SHORE,reach=S.profile.sand.points[1][0]+.6;
 if(x<=S.edge+1e-6&&x>=S.edge-reach&&z>=S.fromZ-1e-6&&z<=S.cornerZ+reach)return true;
 return z>=S.cornerZ-COPING-1e-6&&z<=S.cornerZ+reach&&x<=S.returnToX+1e-6&&x>=S.edge-reach;
}
/** The solids: the coping along the west run and the return (the chain bollards add their own, street-furniture.js). */
export function westShoreSolids(){
 const S=WEST_SHORE,z1=S.cornerZ-COPING,inner=S.edge,outer=S.coast+.01;   // a hair inside the coast line, so it stands on land
 return [
  {id:'west-shore-coping',x:(inner+outer)/2,z:(S.fromZ+z1)/2,w:+(inner-outer).toFixed(4),d:+(z1-S.fromZ).toFixed(4),height:.4},
  {id:'west-shore-coping-return',x:(outer+S.returnToX)/2,z:(z1+S.cornerZ-.01)/2,w:+(S.returnToX-outer).toFixed(4),d:+(S.cornerZ-.01-z1).toFixed(4),height:.4},
 ];
}

/**
 * A profile ([d, y] points) swept along a path of [x, z] points, `d` to the left of travel (seaward along this coast),
 * mitred at the corners, each face flat. `caps` closes the profile with the given extra points and faces both ends.
 * Returns a non-indexed geometry in world coordinates, which the kit then buckets and finishes.
 */
export function sweepProfile(path,profile,{caps=null}={}){
 const n=path.length,normals=[],mitre=[];
 for(let i=0;i<n-1;i++){const dx=path[i+1][0]-path[i][0],dz=path[i+1][1]-path[i][1],l=Math.hypot(dx,dz);normals.push([-dz/l,dx/l]);}
 for(let i=0;i<n;i++){
  const a=normals[Math.max(0,i-1)],b=normals[Math.min(n-2,i)],s=[a[0]+b[0],a[1]+b[1]],k=1+a[0]*b[0]+a[1]*b[1];
  mitre.push([s[0]/k,s[1]/k]);
 }
 const at=(i,[d,y])=>[path[i][0]+mitre[i][0]*d,y,path[i][1]+mitre[i][1]*d];
 const out=[];const tri=(a,b,c)=>out.push(...a,...b,...c);
 for(let i=0;i<n-1;i++)for(let k=0;k<profile.length-1;k++){
  const A=at(i,profile[k]),B=at(i,profile[k+1]),C=at(i+1,profile[k]),D=at(i+1,profile[k+1]);
  tri(A,B,C);tri(B,D,C);
 }
 if(caps){
  const ring=[...profile,...caps],faces=THREE.ShapeUtils.triangulateShape(ring.map(([d,y])=>new THREE.Vector2(d,y)),[]);
  for(const [a,b,c] of faces){tri(at(0,ring[a]),at(0,ring[b]),at(0,ring[c]));tri(at(n-1,ring[a]),at(n-1,ring[c]),at(n-1,ring[b]));}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(out,3));g.computeVertexNormals();return g;
}

/**
 * Draws the bank and registers its solids. The coping and the pitching go into the quarter's kit, in its coral stone; the
 * foreshore's wet sand and the armour stones on it are a kit of their own, named for what they are (the beach's wet band,
 * ground-standard.js beach-sand; the rock armour at the water), so the ground audit reads them as such.
 */
export function buildWestShore(kit,solid,{anchor,onAction,group=null}={}){
 const S=WEST_SHORE,P=S.profile,path=westShorePath();
 const cx=(S.edge+S.returnToX)/2,cz=(S.fromZ+S.cornerZ)/2,here=new THREE.Matrix4().makeTranslation(cx,0,cz),local=g=>{g.translate(-cx,0,-cz);return g;};
 // The coping and the pitching are one run of coral stone; the sand strip lies against its toe.
 const stone=local(sweepProfile(path,[...P.coping.points,...P.pitching.points.slice(1)],{caps:[[0,-.9]]}));
 const sand=local(sweepProfile(path,P.sand.points,{caps:[[1.15,-.9]]}));
 // Armour stones along the toe of the west run, settled into the sand, a few of them half in the water.
 const r=rng(S.stones.seed),d0=P.sand.points[0][0],run=S.cornerZ-COPING-S.fromZ,stones=[];
 for(let z=S.fromZ+1.6;z<S.fromZ+run-1;z+=S.stones.every){
  const d=d0+.2+r.next()*.55,size=.32+r.next()*.22,zz=z+(r.next()-.5)*.8,y=-.5-.14*(d-d0)/.95;
  stones.push({x:S.edge-d,y:y+size*.45,z:zz,size,colour:r.pick([0x9a9f94,0x8f968c,0xa5a89c])});
 }
 if(!group){
  kit.add(stone,here,0xe6e0d0,'coral');kit.add(sand,here,GROUND_CLASSES['beach-sand'].wet,'sand');
  for(const s of stones)kit.sphere(s.size,s.x,s.y,s.z,s.colour,{sx:1.5,sy:.7,sz:1.1,detail:0});
 }else{
  // Named for what they are, so the ground audit reads them so: the bank's coping (an edge), the foreshore's wet sand
  // (ground-standard.js beach-sand, its wet band) and the rock armour at the water.
  const mesh=(g,material,name)=>{g.applyMatrix4(here);g.computeVertexNormals();const m=new THREE.Mesh(g,material);m.name=name;m.receiveShadow=true;group.add(m);return m;};
  mesh(stone.clone(),new THREE.MeshStandardMaterial({color:0xe6e0d0,roughness:.92}),'West-shore bank coping');
  mesh(sand.clone(),new THREE.MeshStandardMaterial({color:GROUND_CLASSES['beach-sand'].wet,roughness:1}),'West-shore foreshore wet-sand');
  const rock=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),stones.length),m=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color();
  stones.forEach((s,i)=>{rock.setMatrixAt(i,m.compose(new THREE.Vector3(s.x,s.y,s.z),q,new THREE.Vector3(s.size*1.5,s.size*.7,s.size*1.1)));rock.setColorAt(i,c.setHex(s.colour));});
  rock.name='West-shore armour stones';rock.receiveShadow=true;rock.castShadow=false;rock.computeBoundingSphere();group.add(rock);
 }
 stone.dispose();sand.dispose();
 solid(westShoreSolids());
 anchor?.(S.edge+1.1,1,(S.fromZ+S.cornerZ)/2,'Look over the bank',()=>onAction?.('read','The west-shore bank',
  'North of the seawall the shore is pitched in coral stone, down to a strip of sand the waves wash over, with a chain along the top. Over the reef the water goes green, then blue; on a winter day the spray comes over the stones.'));
}
