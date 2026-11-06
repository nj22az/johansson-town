/**
 * Walking a house of more than one floor (Johansson's, johansson-house-interior.js): its floors stack one over another,
 * so the floor you stand on is the one nearest your feet, within a step, as aboard the Minato Maru (ferry-walk.js). A
 * flight of stairs is a sloped floor through its nosings. The house stands still, so its floors are in the room's own
 * frame; what stands on them (walls, furniture, the guards) is the room's colliders, each with its storey's height.
 *
 * A floor: {id, x:[x0, x1], z:[z0, z1], y, thick}, where y is a height, or [at z0, at z1] for a flight running along z,
 * or {x:[at x0, at x1]} for one running along x; `thick` is the depth of what is under its top (a slab, a landing, a
 * flight's treads and soffit). Nobody stands where a floor's body is in theirs: under the foot of a flight, or under a
 * landing lower than a head, the floor over you is in the way, so you step onto it or go round.
 */
export const HOUSE_STEP=.24;
/** How tall a person is to the floors over them (physics.js standingHitsRect). */
export const HOUSE_HEAD=1.82;

export function createHouseWalk(floors){
 const list=floors.map(f=>Object.freeze({...f}));
 /** The height of floor `f` at (x, z), or null where it is not. */
 function heightOn(f,x,z){
  if(x<f.x[0]-1e-6||x>f.x[1]+1e-6||z<f.z[0]-1e-6||z>f.z[1]+1e-6)return null;
  if(typeof f.y==='number')return f.y;
  if(Array.isArray(f.y)){const t=(z-f.z[0])/(f.z[1]-f.z[0]||1);return f.y[0]+(f.y[1]-f.y[0])*t;}
  const t=(x-f.x[0])/(f.x[1]-f.x[0]||1);return f.y.x[0]+(f.y.x[1]-f.y.x[0])*t;
 }
 /** Is there room to stand at (x, z) on height h: no floor's body over the feet and under the head? */
 function headroom(x,z,h){
  for(const f of list){const top=heightOn(f,x,z);if(top!==null&&top>h+.03&&top-(f.thick??0)<h+HOUSE_HEAD)return false;}
  return true;
 }
 /** Every floor under (x, z) within a step of feet at `y` with room to stand on it, nearest first. */
 function under(x,z,y,step=HOUSE_STEP){
  const out=[];for(const f of list){const h=heightOn(f,x,z);if(h!==null&&Math.abs(h-y)<=step+1e-6&&headroom(x,z,h))out.push({floor:f,y:h});}
  return out.sort((a,b)=>Math.abs(a.y-y)-Math.abs(b.y-y));
 }
 /** The floor under (x, z) nearest to feet at `y`, within a step, with room to stand: {floor, y}, or null. */
 const floorAt=(x,z,y,step=HOUSE_STEP)=>under(x,z,y,step)[0]??null;
 /** The floor under feet at `y`: the highest at (x, z) no more than a step above them, or null. */
 function floorBelow(x,z,y,step=HOUSE_STEP){
  let best=null;for(const f of list){const h=heightOn(f,x,z);if(h===null||h>y+step)continue;if(!best||h>best.y)best={floor:f,y:h};}
  return best;
 }
 /**
  * A step from feet at (x, y, z) to (nx, nz) for a person of radius `r`: {ok, y, floor}, ok false where there is no
  * floor within a step there, or where the body would hang over an edge with no floor under it (a stair well).
  * `blocked(nx, y, nz)` is what stands there (the room's colliders, at that height).
  */
 function move(x,y,z,nx,nz,r,blocked=()=>false){
  const on=floorAt(nx,nz,y);if(!on)return {ok:false,y,floor:null};
  // Every side of him stands over a floor within a step of the one he steps onto (or a wall stops him first).
  for(const [dx,dz] of [[r,0],[-r,0],[0,r],[0,-r]])if(!floorAt(nx+dx,nz+dz,on.y,HOUSE_STEP+.02)&&!blocked(nx+dx*.5,on.y,nz+dz*.5))return {ok:false,y:on.y,floor:on.floor};
  if(blocked(nx,on.y,nz))return {ok:false,y:on.y,floor:on.floor};
  return {ok:true,y:on.y,floor:on.floor};
 }
 return {floors:list,heightOn,headroom,floorAt,floorBelow,move};
}
