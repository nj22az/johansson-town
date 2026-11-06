import {MAP_BOUNDS,groundHeight} from '../world/layout.js?snappy=1';

// A conservative walkability raster. It shares the player's radius-aware collision
// predicate; diagonal edges may never cut a blocked corner.
//
// The raster must never be narrower than the walker it is rastered for, or the walker
// is routed through gaps it cannot fit down and stalls against its own collision
// check — which is what kept the shop clerk pinned at 0.32 while this was fixed there.
// Wider only makes a route more conservative, and every room in the town was laid out
// against this margin, so it is the floor as well as the default.
export const NAV_MARGIN=.32;
export function createNavigation(blocked,{step=1,bounds=MAP_BOUNDS,heightAt=groundHeight,radius=NAV_MARGIN}={}){
  const cache=new Map(),edges=new Map(),key=(x,z)=>x+','+z;
  const clear=(x,z)=>{const k=key(x,z);if(!cache.has(k))cache.set(k,!blocked(x*step,z*step,radius));return cache.get(k);};
  const edgeClear=(a,b)=>{const k=key(...a)+'>'+key(...b);if(!edges.has(k)){
    const dx=b[0]-a[0],dz=b[1]-a[1],n=Math.max(1,Math.ceil(Math.hypot(dx,dz)*step/.15));let safe=true,lastHeight=heightAt(a[0]*step,a[1]*step);
    for(let i=1;i<=n;i++){const x=(a[0]+dx*i/n)*step,z=(a[1]+dz*i/n)*step,height=heightAt(x,z);
      if(blocked(x,z,radius)||Math.abs(height-lastHeight)>.180001){safe=false;break;}lastHeight=height;
    }edges.set(k,safe);
  }return edges.get(k);};
  // The nearest clear point looks as far in metres on a fine grid as on the town's (5 cells of 0.35 m): a tapped desk or
  // shelf stands in its own collider, and the walk ends beside it.
  const reach=Math.max(5,Math.ceil(1.75/step));
  function nearest(x,z){const gx=Math.round(x/step),gz=Math.round(z/step);for(let r=0;r<=reach;r++)for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++)if(clear(gx+dx,gz+dz)&&edgeClear([x/step,z/step],[gx+dx,gz+dz]))return [gx+dx,gz+dz];return null;}
  function path(from,to){const a=nearest(from.x,from.z),b=nearest(to.x,to.z);if(!a||!b)return [];const start=key(...a),end=key(...b),open=[{x:a[0],z:a[1],g:0,f:0}],scores=new Map([[start,0]]),parents=new Map();let count=0;
    while(open.length&&count++<30000){let low=0;for(let i=1;i<open.length;i++)if(open[i].f<open[low].f)low=i;const n=open.splice(low,1)[0],k=key(n.x,n.z);if(k===end){const points=[[b[0]*step,b[1]*step]];let at=k;while(parents.has(at)){at=parents.get(at);const [x,z]=at.split(',').map(Number);points.push([x*step,z*step]);}points.reverse();
        // Finish at the actual reachable threshold, not merely its nearby grid cell.
        // Small authored door offsets otherwise leave actors outside arrival range.
        if(Math.hypot(to.x-b[0]*step,to.z-b[1]*step)>.001&&!blocked(to.x,to.z,radius)&&edgeClear(b,[to.x/step,to.z/step]))points.push([to.x,to.z]);
        return points;}
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=n.x+dx,z=n.z+dz;if(x*step<bounds.minX||x*step>bounds.maxX||z*step<bounds.minZ||z*step>bounds.maxZ||!clear(x,z)||!edgeClear([n.x,n.z],[x,z])||dx&&dz&&(!clear(n.x+dx,n.z)||!clear(n.x,n.z+dz)))continue;const nk=key(x,z),g=n.g+Math.hypot(dx,dz);if(g>=(scores.get(nk)??Infinity))continue;scores.set(nk,g);parents.set(nk,k);open.push({x,z,g,f:g+Math.hypot(x-b[0],z-b[1])});}
    }return [];
  }
  return {path,clearCache:()=>{cache.clear();edges.clear();}};
}
