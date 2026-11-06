/**
 * Coming in through a door with the camera behind him (game.js enterRoom): he starts up to `reach` metres inside, so the
 * lens is not up against the door. Every tenth of a metre of that is a step his own feet could take: `step(x, y, z, nx,
 * nz)` answers {ok, y} by the room's walking rules (its floors, a stair's treads, its walls and furniture), and `lens(x,
 * y, z)` whether the camera would be inside something there. He stops at the first step that is not allowed and keeps
 * the height of the floor he is on.
 *
 * Before 21 October 2026 the steps were tested for the lens only and his height was left at the door's: in the Nakamura
 * family's stairwell (interiors/upper-home.js) the step inside put him 1.2 m up the flight with his feet still at the
 * foyer's floor, under the treads, where no step is allowed (the owner, on his phone: "I get stuck in the staircase").
 */
export function stepInside(spawn,inward,{step,lens=()=>false,reach=1.2}={}){
 let x=spawn[0],y=spawn[1]??0,z=spawn[2]??0;
 const dx=-Math.sin(inward),dz=-Math.cos(inward);
 for(let d=.1;d<=reach+1e-9;d+=.1){
  const nx=spawn[0]+dx*d,nz=(spawn[2]??0)+dz*d;
  if(lens(nx,y,nz))break;
  const s=step(x,y,z,nx,nz);if(!s.ok)break;
  x=nx;z=nz;y=s.y;
 }
 return [x,y,z];
}
