// Plan from an actual inspect_navigation response. This reads observations only;
// returned waypoints still have to be walked through official MCP follow_path.
import {readFile} from 'node:fs/promises';
const [file,goalX,goalZ]=process.argv.slice(2),entry=JSON.parse(await readFile(file,'utf8')),grid=entry.result||entry.data,goal={x:Number(goalX),z:Number(goalZ)},cells=grid.cells;
if(!cells||!Number.isFinite(goal.x)||!Number.isFinite(goal.z))throw Error('Usage: path-from-log.mjs GRID_LOG X Z');
const allowed=c=>!c.staticBlocked&&!c.residentBlocked&&!c.bounds,edges=new Set((grid.blockedEdges||[]).map(([a,b])=>`${Math.min(a,b)}:${Math.max(a,b)}`));
let start=grid.startIndex;
if(!allowed(cells[start])){const p=cells[start];start=cells.reduce((best,c,i)=>allowed(c)&&Math.hypot(c.x-p.x,c.z-p.z)<Math.hypot(cells[best].x-p.x,cells[best].z-p.z)?i:best,cells.findIndex(allowed));}
const previous=new Int32Array(cells.length).fill(-2),queue=[start];previous[start]=-1;
for(let h=0;h<queue.length;h++){const i=queue[h],x=i%grid.columns,z=Math.floor(i/grid.columns);for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz;if(nx<0||nx>=grid.columns||nz<0||nz>=grid.rows)continue;const j=nz*grid.columns+nx;if(previous[j]!==-2||!allowed(cells[j])||edges.has(`${Math.min(i,j)}:${Math.max(i,j)}`))continue;previous[j]=i;queue.push(j);}}
const distance=i=>Math.hypot(cells[i].x-goal.x,cells[i].z-goal.z),end=queue.reduce((a,b)=>distance(a)<distance(b)?a:b),indices=[];
for(let i=end;i!==-1;i=previous[i])indices.push(i);indices.reverse();const points=[];
for(let i=0;i<indices.length;i++){if(i>0&&i<indices.length-1&&indices[i]-indices[i-1]===indices[i+1]-indices[i])continue;points.push([cells[indices[i]].x,cells[indices[i]].z]);}
console.log(JSON.stringify({path:points.slice(0,64),maxSeconds:120,remaining:distance(end),end:[cells[end].x,cells[end].z]}));
