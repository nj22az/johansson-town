/**
 * Bodies are solid: no resident walks through another, or through the player. Each standing body is a circle on the
 * ground (BODY_RADIUS); where two in the same space overlap they are moved apart along the line between them. A body
 * that is busy where it is (seated, serving, asleep, on a bicycle, mid-transition) does not move: the other steps
 * aside. A move that would put someone into a wall or a prop (blocked) is not made; the other takes it instead.
 * The film engine keeps the same rule for its cast (remotion/src/Short.tsx, collide).
 */
export const BODY_RADIUS=.26;

/** bodies: [{x, z, fixed?, space?}] (space: what they stand in; only the same space collides). Moves x/z in place;
 *  returns how many pairs were pushed apart. */
export function separateBodies(bodies,{radius=BODY_RADIUS,blocked=null,passes=3}={}){
  let pushed=0;
  for(let pass=0;pass<passes;pass++){
    let any=false;
    for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
      const a=bodies[i],b=bodies[j];
      if(a.space!==b.space||(a.fixed&&b.fixed))continue;
      const gap=(a.radius??radius)+(b.radius??radius);
      let dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
      if(d>=gap)continue;
      if(d<1e-6){dx=1;dz=0;}else{dx/=d;dz/=d;}
      const overlap=gap-Math.min(d,gap)+.002;
      let wa=a.fixed?0:b.fixed?1:.5,wb=1-wa;
      const can=(o,s)=>!blocked||!blocked(o.x+dx*s,o.z+dz*s,o.radius??radius);
      if(wa>0&&!can(a,-overlap*wa)){wb=b.fixed?0:1;wa=0;}
      if(wb>0&&!can(b,overlap*wb)){if(!a.fixed&&can(a,-overlap)){wa=1;wb=0;}else wb=0;}
      if(wa===0&&wb===0)continue;
      a.x-=dx*overlap*wa;a.z-=dz*overlap*wa;b.x+=dx*overlap*wb;b.z+=dz*overlap*wb;
      pushed++;any=true;
    }
    if(!any)break;
  }
  return pushed;
}
