import * as THREE from '../../vendor/three.module.js';

/** A shared portrait shot: the phone needs room for two heads and the spoken line. */
export function portraitConversationShot({speaker,player,aspect,fov=65,clear=()=>true,blocked=()=>false}){
 const mid=player.clone().lerp(speaker,.5),dx=speaker.x-player.x,dz=speaker.z-player.z,dist=Math.hypot(dx,dz);
 if(dist<.2||aspect>=.85)return null;
 const ux=dx/dist,uz=dz/dist,tan=Math.tan(THREE.MathUtils.degToRad(fov/2));
 const desired=Math.min(6.5,Math.max(3.2,(dist*.5+.65)/(tan*Math.max(.3,aspect)*.75)));
 let best=null;
 // Try the street side of the pair at a few angles. A clear lens and both sightlines
 // are required; a wall never becomes a reason to put the camera through it.
 for(const bias of [.45,1.1,2])for(const side of [1,-1]){
  const direction=new THREE.Vector3(uz*side-ux*bias,0,-ux*side-uz*bias).normalize();
  for(const reach of [desired,desired*.82,desired*.64,2.2,1.6]){
   const position=mid.clone().addScaledVector(direction,reach);position.y+=.18;
   if(blocked(position)||!clear(speaker,position)||!clear(player,position))continue;
   const zoom=Math.max(.6,Math.min(1,reach/desired));
   const score=reach/desired*4-bias*.02;
   if(!best||score>best.score)best={positionOffset:position.sub(mid),lookOffset:new THREE.Vector3(0,reach*tan*.2/zoom,0),zoom,score};
  }
 }
 return best;
}
