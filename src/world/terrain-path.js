import {TERRAIN_GRID} from './island-plan.js';
/** Clip short path quads to the terrain's triangles, so uphill paving cannot sink through them. */
export function terrainPathPolygons(quad){
 const g=TERRAIN_GRID;
 if(quad.some(([x,z])=>x<g.minX||x>g.maxX||z<g.minZ||z>g.maxZ))return [quad];
 const minX=Math.max(0,Math.floor((Math.min(...quad.map(p=>p[0]))-g.minX)/g.step)),maxX=Math.min((g.maxX-g.minX)/g.step-1,Math.floor((Math.max(...quad.map(p=>p[0]))-g.minX)/g.step));
 const minZ=Math.max(0,Math.floor((Math.min(...quad.map(p=>p[1]))-g.minZ)/g.step)),maxZ=Math.min((g.maxZ-g.minZ)/g.step-1,Math.floor((Math.max(...quad.map(p=>p[1]))-g.minZ)/g.step)),out=[];
 const clip=(poly,a,b)=>{const side=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]),result=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dp=side(p),dq=side(q);if(dp>=-1e-8)result.push(p);if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq);result.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}}return result;};
 for(let iz=minZ;iz<=maxZ;iz++)for(let ix=minX;ix<=maxX;ix++){const x=g.minX+ix*g.step,z=g.minZ+iz*g.step,s=g.step,a=[x,z],b=[x+s,z],c=[x,z+s],d=[x+s,z+s];for(const triangle of [[a,b,c],[b,d,c]]){let polygon=quad;for(let i=0;i<3&&polygon.length;i++)polygon=clip(polygon,triangle[i],triangle[(i+1)%3]);if(polygon.length>=3)out.push(polygon);}}
 return out;
}
