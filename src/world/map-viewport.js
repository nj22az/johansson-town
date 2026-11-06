/** Keep Minato readable; the distant island belongs to the optional world view. */
export const MINATO_MAP_BOUNDS=Object.freeze({minX:-45,maxX:65,minZ:-67,maxZ:99});
export function townMapBounds({mode='local',player={x:0,z:0},target=null,route=[]}={},worldBounds){
 if(mode==='world')return {...worldBounds};
 const valid=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z);
 const points=[player,...route].filter(valid);
 // A selected route focuses on the leg that can be walked from here. Until it has
 // been calculated, keep a nearby destination in view without shrinking the island.
 if(!route.length&&valid(target)&&Math.hypot(target.x-player.x,target.z-player.z)<180)points.push(target);
 if(points.length<2){
  const b=MINATO_MAP_BOUNDS;
  if(player.x>=b.minX&&player.x<=b.maxX&&player.z>=b.minZ&&player.z<=b.maxZ)return {...b};
  return {minX:player.x-48,maxX:player.x+48,minZ:player.z-64,maxZ:player.z+64};
 }
 const minX=Math.min(...points.map(p=>p.x))-12,maxX=Math.max(...points.map(p=>p.x))+12;
 const minZ=Math.min(...points.map(p=>p.z))-12,maxZ=Math.max(...points.map(p=>p.z))+12;
 const cx=(minX+maxX)/2,cz=(minZ+maxZ)/2,halfX=Math.max(22,(maxX-minX)/2),halfZ=Math.max(27,(maxZ-minZ)/2);
 return {minX:cx-halfX,maxX:cx+halfX,minZ:cz-halfZ,maxZ:cz+halfZ};
}
