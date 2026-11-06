/**
 * Kitano hamlet (北野集落), the handful of houses by the pier on Kitano-jima (batch 7a; docs/KITANO-JIMA.md): three walled
 * plots on a sandy lane just south of the cargo court, in the island's own frame (airport-ground.js airportWorld: u along
 * the runway, v towards Minato; y above the sea). The Shiroma house (Kai's, rented) stands north of the lane with its gate
 * on the lane; Johansson's house stands south of it, its gate on the lane and the sea behind. The Chinen house that stood
 * east of the Shiroma house (u −33..−23, v 38..48) was removed in phase 4 of docs/CAST-CONSOLIDATION.md (addendum 5): the
 * island's own ground and plantings are back on its plot (`clear` no longer keeps them off it).
 * It imports only the house's data (johansson-house.js, no three.js), so the island's ground and plantings can read it
 * as freely as the builder does.
 */
import {HOUSE_SITE} from './johansson-house.js';

export const KITANO_HAMLET=Object.freeze({
 /** The yards' slabs and the lane, metres above the sea (the plateau is 1.1; the ground here runs 0.9–1.25). */
 yardTop:1.3,laneTop:1.22,
 lane:Object.freeze({minX:-47,maxX:-20,minZ:47.5,maxZ:51.5}),
 /** Plantings keep out of these rectangles (tropical-island.js): the lane and the plots, and kitano-1's back yard. */
 clear:Object.freeze([Object.freeze({minX:-51,maxX:-19,minZ:47,maxZ:71}),Object.freeze({minX:-51,maxX:-34,minZ:37,maxZ:47}),Object.freeze({minX:-51,maxX:-31,minZ:71,maxZ:75})]),
 plots:Object.freeze([
  // Johansson's house, built from the creator's Final Rev F (johansson-house.js, finding RF8): 12 × 10 m on a plot of
  // 17 × 22, its front 7.5 m in from the gate (`front`, the plot's own z, the gate at +11) for the garden stair down to
  // the court, 2.5 m either side for the lightwell and the outdoor units, 4.5 m behind for the terrace. The plot stops
  // where the ground east of it rises above the yard (1.28 m at its edge); west and north it runs down towards the beach
  // (0.26 m at its far corner), so its slab goes down to `base`.
  {id:'kitano-1',family:'ヨハンソン',romaji:'Johansson & Thuan',minX:-49.5,maxX:-32.5,minZ:51.5,maxZ:73.5,gate:'south',kind:'johansson-house',wall:'coral',front:3.5,base:.2},
  {id:'kitano-2',family:'城間',romaji:'Shiroma',minX:-45,maxX:-35,minZ:38,maxZ:48,gate:'north',kind:'concrete',wall:'block'},
 ].map(Object.freeze)),
});
/**
 * Where the Kitano line hand stands by between calls (people/ferry-shore-crew.js), island frame: on the pier beside its
 * bitts (ferry.js KITANO_FERRY_BITTS), clear of the landing and the cars' lane, 25 m down the lane from the Shiroma house.
 */
export const KITANO_PIER_STAND=Object.freeze([-50.1,32.5]);
/** The gate in the plot's wall, 0.7 m out on the lane, and the way in (0 faces −v, π faces +v), island frame. */
export function hamletGate(p,out=.7){
 const cx=(p.minX+p.maxX)/2;
 return p.gate==='north'?{door:[cx,p.maxZ+out],inward:0}:{door:[cx,p.minZ-out],inward:Math.PI};
}
const JOHANSSON=KITANO_HAMLET.plots.find(p=>p.id==='kitano-1');
/**
 * A point of Johansson's house (drawn x, y: johansson-house.js) on the island (u, v): the plot is turned half round, the
 * house's front `front` in from the plot's middle towards the gate.
 */
export function houseIsland(x,y,p=JOHANSSON){const cx=(p.minX+p.maxX)/2,cz=(p.minZ+p.maxZ)/2;return [cx-(x-6),cz-p.front+y];}
/** A drawn rectangle [x0, y0, x1, y1] of the house as an island rectangle. */
export function houseRect([x0,y0,x1,y1]){const [a,b]=houseIsland(x1,y0),[c,d]=houseIsland(x0,y1);return {minX:Math.min(a,c),maxX:Math.max(a,c),minZ:Math.min(b,d),maxZ:Math.max(b,d)};}
const siteBox=prefix=>{const list=HOUSE_SITE.boxes.filter(b=>b.id.startsWith(prefix));return [Math.min(...list.map(b=>b.min[0])),Math.min(...list.map(b=>b.min[1])),Math.max(...list.map(b=>b.max[0])),Math.max(...list.map(b=>b.max[1]))];};
/**
 * Where Johansson's yard is dug (Rev F): the court outside the basement's door with the garden stair down into it, inside
 * its retaining walls, and the lightwell outside the club's window. The yard's slab, the island's ground and the sea
 * stand clear of these (kitano-hamlet.js, tropical-island.js, ocean.js setOceanPits).
 */
export const KITANO_DUG=Object.freeze([
 Object.freeze({id:'johansson-court',...houseRect(siteBox('COURT-RETAIN-'))}),
 Object.freeze({id:'johansson-lightwell',...houseRect(siteBox('LIGHTWELL-'))}),
]);
/**
 * The house's floors outside, in the hamlet's frame (above the sea): the garden stair, a slope through its nosings from
 * the yard at its top to the court's floor one going past its foot; the court; the lightwell's floor (no way in: guards).
 */
const JOHANSSON_SITE_FLOORS=(()=>{
 const X=HOUSE_SITE.gardenStair,top=KITANO_HAMLET.yardTop,[sx0,sx1]=[Math.min(...X.treads.map(t=>t.min[0])),Math.max(...X.treads.map(t=>t.max[0]))];
 const foot=X.ramp.find(c=>c[2]===Math.min(...X.ramp.map(q=>q[2]))),head=X.ramp.find(c=>c[2]===Math.max(...X.ramp.map(q=>q[2])));
 const footY=foot[1]+(foot[1]>head[1]?1:-1)*X.tread,stair=houseRect([sx0,Math.min(head[1],footY),sx1,Math.max(head[1],footY)]);
 const [v0,v1]=[houseIsland(0,head[1])[1],houseIsland(0,footY)[1]];
 return [
  {id:'kitano-garden-stair',...stair,y:top+head[2],slope:{v0,v1,y1:top+foot[2]-X.riser}},
  {id:'kitano-court',...houseRect([HOUSE_SITE.court.x[0],HOUSE_SITE.court.y[0],HOUSE_SITE.court.x[1],HOUSE_SITE.court.y[1]]),y:top+HOUSE_SITE.court.floor},
  {id:'kitano-lightwell',...houseRect([HOUSE_SITE.lightwell.x[0],HOUSE_SITE.lightwell.y[0],HOUSE_SITE.lightwell.x[1],HOUSE_SITE.lightwell.y[1]]),y:top+HOUSE_SITE.lightwell.floor},
 ];
})();
/**
 * The walkable floors the hamlet adds to the island (airport-ground.js), the first that holds a point being its floor: the
 * garden stair, the court and the lightwell in Johansson's yard, then the lane and the three yards (his front door is
 * level with his yard: Rev F).
 */
export const KITANO_HAMLET_FLOORS=Object.freeze([
 ...JOHANSSON_SITE_FLOORS,
 {id:'kitano-lane',...KITANO_HAMLET.lane,y:KITANO_HAMLET.laneTop},
 ...KITANO_HAMLET.plots.map(p=>({id:'kitano-yard-'+p.id,minX:p.minX,maxX:p.maxX,minZ:p.minZ,maxZ:p.maxZ,y:KITANO_HAMLET.yardTop})),
].map(Object.freeze));
