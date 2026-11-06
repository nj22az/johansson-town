/** Static reachability includes actual standing clearance and the game's 24 cm step limit. */
export function sampleGridEdges(cells,columns,rows,probe){
 const blocked=[];
 for(let i=0;i<cells.length;i++){
  if(cells[i].staticBlocked)continue;
  const x=i%columns,z=Math.floor(i/columns);
  for(const j of [x+1<columns?i+1:-1,z+1<rows?i+columns:-1]){
   if(j<0||cells[j].staticBlocked)continue;
   const a=cells[i],b=cells[j],steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.05);let previous=a;
   for(let k=1;k<=steps;k++){
    const t=k/steps,p=probe(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t);
    if(p.staticBlocked||Math.abs(p.y-previous.y)>.24){blocked.push([i,j]);break;}previous=p;
   }
  }
 }
 return blocked;
}

export function analyseGrid(cells,columns,rows,startIndex,blockedEdges=null){
 const blocked=blockedEdges&&new Set(blockedEdges.map(([a,b])=>`${Math.min(a,b)}:${Math.max(a,b)}`));
 const labels=new Int32Array(cells.length).fill(-1),components=[];
 for(let seed=0;seed<cells.length;seed++){
  if(cells[seed].staticBlocked||labels[seed]>=0)continue;
  const id=components.length,queue=[seed];labels[seed]=id;
  for(let head=0;head<queue.length;head++){
   const i=queue[head],x=i%columns,z=Math.floor(i/columns);
   for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const nx=x+dx,nz=z+dz;if(nx<0||nx>=columns||nz<0||nz>=rows)continue;
    const j=nz*columns+nx;if(labels[j]>=0||cells[j].staticBlocked||(blocked?blocked.has(`${Math.min(i,j)}:${Math.max(i,j)}`):Math.abs(cells[i].y-cells[j].y)>.24))continue;
    labels[j]=id;queue.push(j);
   }
  }
  components.push({id,cells:queue.length});
 }
 return {components,startComponent:labels[startIndex]??-1,cells:cells.map((c,i)=>({...c,component:labels[i],reachable:labels[startIndex]>=0&&labels[i]===labels[startIndex]}))};
}
