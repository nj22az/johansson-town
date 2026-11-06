/** Retained public paths link Main Street and Kitahama through the former Rainflower plots. */
export const SHOPPING_LANE_SCALE=.6;
export const SHOPPING_LANE=Object.freeze({minX:.7,maxX:3.1,minZ:18.4,maxZ:28.1,x:1.9,z:23.25,y:0,entry:Object.freeze([1.9,18.4]),exit:Object.freeze([1.9,28.1]),crosswalks:Object.freeze([])});
// Legacy author-coordinate helpers remain available for old data. The facades
// and their collisions are retired; current businesses use harbour-park-plan.js.
export const shoppingLanePoint=(x,z)=>[SHOPPING_LANE.x+(x-90)*SHOPPING_LANE_SCALE,SHOPPING_LANE.z+(z-113)*SHOPPING_LANE_SCALE];
export function placeShoppingLaneGroup(group){const [x,z]=shoppingLanePoint(group.position.x,group.position.z);group.position.x=x;group.position.z=z;group.scale.x*=SHOPPING_LANE_SCALE;group.scale.z*=SHOPPING_LANE_SCALE;}
export function placeShoppingLaneColliders(colliders,start=0){for(const c of colliders.slice(start)){const [x,z]=shoppingLanePoint(c.x,c.z);Object.assign(c,{x,z,w:c.w*SHOPPING_LANE_SCALE,d:c.d*SHOPPING_LANE_SCALE,rainflower:true});}}
export const SHOPPING_LANE_ROWS=Object.freeze([99,112,125]);
export const SHOPPING_LANE_ROUTE=Object.freeze({id:'island-shopping-lane',peninsula:true,width:2.4,surface:'stone',points:[SHOPPING_LANE.entry,SHOPPING_LANE.exit]});
export const SHOPPING_LANE_ROUTES=[SHOPPING_LANE_ROUTE];
export const inShoppingLane=(x,z)=>x>=SHOPPING_LANE.minX&&x<=SHOPPING_LANE.maxX&&z>=SHOPPING_LANE.minZ&&z<=SHOPPING_LANE.maxZ;
/** Grade the street's datum into the island, ending before Kitahama's pocket park. */
export function shoppingLaneGroundHeight(x,z){return inShoppingLane(x,z)?0:null;}

export const SHOPPING_LANE_OUTFIT=Object.freeze({top:'jacket',topColour:'#eee8da',pattern:'none',bottom:'skirt',bottomColour:'#9b2834',bottomPattern:'plaid',footwear:'boots',shoes:'#704431',accent:'#e7c887',hat:'none'});
