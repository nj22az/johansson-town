// Dining-lane bounds, izakaya and ramen plots and their doors.
export const NIGHT_LANE=Object.freeze({x:.1,z:.9,y:0,minX:-.5,maxX:4.8,minZ:-13,maxZ:14.5});
export function inDiningLane(x,z){return x>=NIGHT_LANE.minX&&x<=NIGHT_LANE.maxX&&z>=NIGHT_LANE.minZ&&z<=NIGHT_LANE.maxZ;}

export const DINING=Object.freeze({
 // Next to Sakura's north wall; retain the full-size konbini and clear footway.
 // Set back from the west pavement: at -11.97 the east face landed at -7.45,
 // 0.10 inside the pavement edge, which blocked the south shop crossing.
 // See IZAKAYA_PLOTS below: the island stands it further up the same pavement.
 izakayaX:-12.5,izakayaZ:-20.4,izakayaYaw:Math.PI/2,izakayaDoor:Object.freeze([-7.05,-20.4]),
 ramenX:5.45,ramenZ:-12.8,ramenYaw:-Math.PI/2,ramenDoor:Object.freeze([.75,-12.15]),crystalDoor:Object.freeze([.75,-15.6]),
});
/**
 * The izakaya's plot.
 *
 * It stands next to the bookshop, which is where it was asked
 * for: Minato's north gable is at z -6.10 and the relocated bookshop's
 * south wall is at -3.02, leaving a walkable passage between them. Thuan comes out of Sakura, up the west pavement past Nhung's window, and
 * in.
 *
 * The door, its approach and the lane to it are live arrays rather than copies:
 * Thuan's evening, Thao's shift and the walkable route all hold these exact arrays, so
 * moving the plot moves them too. Anything that reads the plot syncs them on the way
 * past, and createTown asks for it once as soon as the layout is chosen.
 */
const IZAKAYA_PLOTS=Object.freeze({
 street:Object.freeze([-12.5,-20.4]),
 // North gable at -6.10; the bookshop is separated by a three-metre passage.
 island:Object.freeze([-12.5,-10.43]),
});
export const IZAKAYA_DOOR=[-7.05,-20.4];
/**
 * The ramen counter's street door. On the old street that is Inakaya across the road; on
 * the island it is Sato Ramen, the single-storey corner shop on Minato's alley flank
 * that shares its kitchen (minato-facade.js). izakayaPlot() sets it for the layout.
 */
export const RAMEN_DOOR=[...DINING.ramenDoor];
export const SATO_RAMEN_DOOR=Object.freeze([-7.05,-13.9]);
const IZAKAYA_APPROACH=[-6.35,-20.4];
export const IZAKAYA_LANE=[[0,-20.4],IZAKAYA_DOOR];
export function izakayaPlot(){
 const [x,z]=IZAKAYA_PLOTS.island;
 IZAKAYA_DOOR[1]=z;IZAKAYA_APPROACH[1]=z;IZAKAYA_LANE[0][1]=z;
 const ramen=SATO_RAMEN_DOOR;RAMEN_DOOR[0]=ramen[0];RAMEN_DOOR[1]=ramen[1];
 return {x,z,yaw:DINING.izakayaYaw,door:IZAKAYA_DOOR};
}
const restaurantPlot=kind=>kind==='izakaya'?izakayaPlot()
 :{x:DINING[kind+'X'],z:DINING[kind+'Z'],yaw:DINING[kind+'Yaw'],door:DINING[kind+'Door']};
// Cardinal rotations are exact so entrance and collision coordinates agree.
const restaurantRotation=kind=>{const yaw=restaurantPlot(kind).yaw;return [Math.round(Math.cos(yaw)),Math.round(Math.sin(yaw))];};
export const restaurantPoint=(kind,x,z)=>{const p=restaurantPlot(kind),[c,s]=restaurantRotation(kind);return [p.x+x*c+z*s,p.z-x*s+z*c];};
export const restaurantCollider=(kind,{x,z,w,d,...rest})=>{const [wx,wz]=restaurantPoint(kind,x,z),[c,s]=restaurantRotation(kind);return {x:wx,z:wz,w:Math.abs(c)*w+Math.abs(s)*d,d:Math.abs(s)*w+Math.abs(c)*d,...rest};};
export const restaurantApproach=kind=>{
 const p=restaurantPlot(kind),[c,s]=restaurantRotation(kind),[x,z]=p.door;
 if(kind!=='izakaya')return [x+.7*s,z+.7*c];
 IZAKAYA_APPROACH[0]=x+.7*s;IZAKAYA_APPROACH[1]=z+.7*c;return IZAKAYA_APPROACH;
};
