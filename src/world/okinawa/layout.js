import {MAIN_ROAD} from '../main-road.js';
import {WEST_YARD} from '../west-yard.js';
import {OIL_JETTY} from '../oil-jetty-layout.js';

/**
 * Where the new streets go, as plain numbers, so the walkable ground, the colliders, the
 * map and the buildings all read the same plan.
 *
 * The island had one street, with buildings along one side of it, a walled gravel
 * yard behind them and a strip of bare ground between that wall and the sea that nobody
 * could reach. This fills it in the way an Okinawan harbour town is actually laid out:
 *
 *   Nishi-machi   the west quarter: lanes running down to a seawall walk, with red-tile
 *                 houses behind coral-stone walls, a concrete house with its water tank,
 *                 a net shed on the quay and the neighbourhood's sacred grove at the end.
 *   East row      the side of Main Street that was lawn becomes shop-houses, with a
 *                 lane between them up to Umi-no-yu.
 *   Yard row      two more shop-houses on the gap between the bookshop and the bus
 *                 station, so the west side runs unbroken to the terminus.
 */

/**
 * The stone path into the utaki (the sacred grove, NISHI.plots' grove): limestone stepping stones 0.9 × 0.55 m from the
 * opening in its south wall to the incense stone, swinging a hand's width either side of the line, as feet laid them.
 */
export function utakiStones(p){const cx=-30.8,cz=(p.minZ+p.maxZ)/2,out=[];for(let z=p.minZ+.6;z<cz-1;z+=.8)out.push({x:cx+Math.sin(z)*.15,z,w:.9,d:.55});return out;}
export const NISHI=Object.freeze({
 id:'nishi-machi',surface:'stone',
 /** The quarter, from the seawall to the yard wall. */
 minX:-39.2,maxX:WEST_YARD.minX,minZ:-49.5,maxZ:29.3,
 /** The seawall along the shore, and the walk behind it. */
 // A sitting height: from the benches behind it you look over it at the sea.
 seawall:Object.freeze({x:-39.55,thickness:.6,height:.7}),
 promenade:Object.freeze({minX:-39.2,maxX:-36.4}),
 /** The concrete apron that runs on from the quay, round to the second pier. */
 quay:Object.freeze({minX:-39.2,maxX:-19,minZ:-49.5,maxZ:-38.6}),
 /** Lanes from the seawall walk to the yard, each through a gap in the yard wall. */
 lanes:Object.freeze(WEST_YARD.lanes.map(z=>Object.freeze({z,half:WEST_YARD.laneHalf}))),
 /** The plots between the lanes, from the walk to the yard wall. */
 plots:Object.freeze([
  {id:'net-shed',kind:'shed',minZ:-37.8,maxZ:-29.3},
  {id:'higa',kind:'red-tile',family:"Higa",romaji:'Higa',minZ:-25.7,maxZ:-14.8,gate:'south'},
  // The Kinjō (concrete, z −11.2..−0.2) and Ōshiro (red tile, z 3.3..14.2) plots between the Higa house and the utaki
  // were cleared in phase 4 of docs/CAST-CONSOLIDATION.md with their residents. The lanes at z −13, 1.5 and 16 stay:
  // the first is the Higa house's north side, the second the way through the yard wall to 2 Front-Row Yard, the third
  // the utaki's approach. The cleared ground is the quarter's coral sand (NISHI_CLEARED, lots.js), walkable from the
  // seawall walk to the yard, until the dressing pass.
  {id:'utaki',kind:'grove',minZ:17.8,maxZ:28.8},
 ].map(p=>Object.freeze({...p,minX:-34.7,maxX:-27}))),
});

/** Shop-houses along the east kerb of Main Street, facing the road (-x). */
export const EAST_ROW=Object.freeze({
 minX:MAIN_ROAD.pavementEast+.5,maxX:MAIN_ROAD.pavementEast+8.2,
 /** The lane between them that leads up to Umi-no-yu's door. */
 onsenLane:Object.freeze({minZ:-1,maxZ:5.9}),
 plots:Object.freeze([
  {id:'nakamura',minZ:-14.2,maxZ:-9.2,colour:0xe9dfc4,trim:0x3f7f86},
  // The post-office shop-house (z −6.6..−1.6, the barber's before that) came down in phase 4 of
  // docs/CAST-CONSOLIDATION.md (addendum 3): its counter had moved to the Port Terminal and its tenant retired. The
  // park's lawn runs out to Main Street between Nakamura's and Kitano Road now (EAST_ROW_CLEARED, lots.js).
  {id:'higa-saketen',minZ:5.9,maxZ:10.9,colour:0xecd2c6,trim:0x8a3b2e},
  // Stops short of the alley at z 18.4, which is the way through to the school gate.
 ].map(Object.freeze)),
});

/** Two shop-houses on the west kerb, between the bookshop and the bus station, facing +x. */
export const YARD_ROW=Object.freeze({
 minX:-15.8,maxX:MAIN_ROAD.pavementWest-.45,
 plots:Object.freeze([
  {id:'coin-laundry',minZ:18,maxZ:23.4,colour:0xd9e4ea,trim:0x3a6a9a},
 ].map(Object.freeze)),
});

/**
 * The quay east of the harbour office, which was bare ground: the fish auction shed and
 * the ice plant, with the boats lying to the quay edge in front of them.
 */
export const EAST_QUAY=Object.freeze({
 id:'east-quay',surface:'stone',
 minX:19,maxX:41,minZ:-49.6,maxZ:-38.9,
 shed:Object.freeze({minX:20.8,maxX:29.2,minZ:-46.8,maxZ:-40.6,height:4.4}),
 ice:Object.freeze({minX:31.8,maxX:36.2,minZ:-46.4,maxZ:-40.4,height:7.2}),
 /**
  * The gate from the lawn into the auction apron, where the lawn's parapet stops short
  * (east-lawn.js): truck-width, paved level with the quay across the parapet's line.
  */
 gate:Object.freeze({minX:19,maxX:21.65,minZ:-38.9,maxZ:-38}),
});
/**
 * The east quay's paving runs on east to the oil jetty's root (ground-plan-harbour.js); north of the jetty it ends at
 * x 42.3, in line with the fuel depot's court, and the beach runs from there to the water (step 4 of the ground plan).
 */
export const EAST_QUAY_CORNER=Object.freeze({jettyFrom:OIL_JETTY.shore.minX+.1,beachFrom:42.3,jettyNorth:OIL_JETTY.shore.maxZ});
export const eastQuayAt=(x,z,r=0)=>{
 const g=EAST_QUAY.gate,C=EAST_QUAY_CORNER;
 return x>=EAST_QUAY.minX-1+r&&x<=EAST_QUAY.maxX-r&&z>=EAST_QUAY.minZ+r&&z<=EAST_QUAY.maxZ-r
  ||x>=g.minX+r&&x<=g.maxX-r&&z>=g.minZ+r&&z<=g.maxZ-r
  ||x>=EAST_QUAY.maxX-1&&x<=C.jettyFrom-.15-r&&z>=EAST_QUAY.minZ+r&&z<=C.jettyNorth-r
  ||x>=EAST_QUAY.maxX-1&&x<=C.beachFrom-r&&z>=EAST_QUAY.minZ+r&&z<=EAST_QUAY.maxZ-r;
};

/**
 * Occupied homes behind the east row, reached by the back lane. The former vacant
 * Kamiya and Tamaki plots now belong to Harbour Park and its Onsen garden.
 */
export const EAST_BACK=Object.freeze({
 lane:Object.freeze({minX:EAST_ROW.maxX,maxX:EAST_ROW.maxX+2.6}),
 plots:Object.freeze([
  // Gates on the green in front of Umi-no-yu, with the houses backed onto the trees.
 ].map(Object.freeze)),
});

/**
 * Whether a circle of radius r stands in Nishi-machi: the seawall walk, the lanes, the
 * yards and the quay apron. What stands in them -- houses, walls, trees -- is solid
 * through the collider list, like everything else in the town.
 */
export function nishiAt(x,z,r=0){
 const q=NISHI.quay;
 if(x>=q.minX+r&&x<=q.maxX-r&&z>=q.minZ+r&&z<=q.maxZ+.6-r)return true;
 return x>=NISHI.minX+r&&x<=NISHI.maxX-r&&z>=NISHI.minZ+r&&z<=NISHI.maxZ-r;
}

export function mapPlan(){
 const walks=[[NISHI.promenade.minX,NISHI.promenade.maxX,NISHI.minZ,NISHI.maxZ],[NISHI.quay.minX,NISHI.quay.maxX,NISHI.quay.minZ,NISHI.quay.maxZ],
  ...NISHI.lanes.map(l=>[NISHI.promenade.maxX,WEST_YARD.minX,l.z-l.half,l.z+l.half]),
  [EAST_QUAY.minX,EAST_QUAY.maxX,EAST_QUAY.minZ,EAST_QUAY.maxZ],
  [EAST_QUAY.gate.minX,EAST_QUAY.gate.maxX,EAST_QUAY.gate.minZ,EAST_QUAY.gate.maxZ],
  [EAST_BACK.lane.minX,EAST_BACK.lane.maxX,EAST_ROW.plots[0].minZ,EAST_ROW.plots.at(-1).maxZ+2.4],
  [MAIN_ROAD.pavementEast,EAST_ROW.maxX+.5,EAST_ROW.onsenLane.minZ,EAST_ROW.onsenLane.maxZ]];
 const yards=[...NISHI.plots,...EAST_BACK.plots].map(p=>[p.minX,p.maxX,p.minZ,p.maxZ]);
 const buildings=[...EAST_ROW.plots.map(p=>[EAST_ROW.minX,EAST_ROW.maxX,p.minZ,p.maxZ]),...YARD_ROW.plots.map(p=>[YARD_ROW.minX,YARD_ROW.maxX,p.minZ,p.maxZ]),
  [EAST_QUAY.shed.minX,EAST_QUAY.shed.maxX,EAST_QUAY.shed.minZ,EAST_QUAY.shed.maxZ],[EAST_QUAY.ice.minX,EAST_QUAY.ice.maxX,EAST_QUAY.ice.minZ,EAST_QUAY.ice.maxZ],
  [GOYA.minX,GOYA.maxX,GOYA.minZ,GOYA.maxZ],
  ...[...NISHI.plots,...EAST_BACK.plots].filter(p=>p.kind!=='grove').map(p=>{const cx=(p.minX+p.maxX)/2,cz=(p.minZ+p.maxZ)/2;return [cx-3.3,cx+3.3,cz-2.8,cz+2.8];})];
 const labels=[['NISHI-MACHI',-38.5,-8],['FISH AUCTION',20.5,-44],['UTAKI',-33,23],...(GATEBALL_ACTIVE?[['GATEBALL',21,-34]]:[])];
 if(GATEBALL_ACTIVE)walks.push([GATEBALL.minX,GATEBALL.maxX,GATEBALL.minZ,GATEBALL.maxZ]);
 return {walks,yards,buildings,labels};
}

/**
 * The gateball court on the lawn by the seawall, and the goya garden in the west yard.
 * The court is switched off (October 2026): nobody plays by the harbour office, and the
 * lawn runs on to the seawall. GATEBALL_ACTIVE brings it, its terrace and players back.
 */
export const GATEBALL_ACTIVE=false;
export const GATEBALL=Object.freeze({minX:20,maxX:31.4,minZ:-37.5,maxZ:-32.2});
export const GOYA=Object.freeze({minX:-23.4,maxX:-20,minZ:-10.8,maxZ:-7.8});

// Kitahama lives in its own dependency-free module so residents.js can read it.
export {KITAHAMA,plotGate} from '../kitahama-layout.js';
