// Every observation, camera turn and movement passes through the actual MCP server.
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
export class TourClient {
 constructor(name='interior'){this.output=resolve(fileURLToPath(new URL('../../../output/',import.meta.url)),`mcp-${name}-tour`);this.log=[];this.captures=[];this.state=null;}
 async connect(){await mkdir(resolve(this.output,'calls'),{recursive:true});this.client=new Client({name:'town-complete-walking-tour',version:'1'});this.transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./server.mjs',import.meta.url))],stderr:'pipe'});await this.client.connect(this.transport,{timeout:240000});this.connected=true;}
 async call(name,args={}){const result=await this.client.callTool({name,arguments:args},{timeout:240000});if(result.isError)throw Error(result.content[0].text);const data=JSON.parse(result.content[0].text);const id=this.log.length+1,file=resolve(this.output,'calls',String(id).padStart(4,'0')+'-'+name+'.json');await writeFile(file,JSON.stringify({name,args,data},null,2));this.log.push({id,name,args,file});await writeFile(resolve(this.output,'actions.json'),JSON.stringify(this.log,null,2));const state=data.game?data:data.after||data.state;if(state?.game)this.state=state;return data;}
 async shot(label){await this.call('wait',{durationMs:50});const result=await this.client.callTool({name:'screenshot',arguments:{}},{timeout:240000});const item=result.content.find(x=>x.type==='image');if(!item)throw Error('Missing actual MCP pixels');const file=resolve(this.output,label+'.png');await writeFile(file,Buffer.from(item.data,'base64'));const state=await this.call('get_state');this.captures.push({label,file,state});await writeFile(resolve(this.output,'captures.json'),JSON.stringify(this.captures,null,2));console.log(JSON.stringify({capture:label,file,room:state.game.room,player:state.game.player,errors:state.errors}));return state;}
 async face(x,z){const s=await this.call('get_state'),p=s.game.player;let delta=Math.atan2(p[0]-x,p[2]-z)-s.view.yaw;while(delta>Math.PI)delta-=2*Math.PI;while(delta< -Math.PI)delta+=2*Math.PI;return this.call('look',{degrees:delta*180/Math.PI,verticalDegrees:Math.max(-60,Math.min(60,s.view.pitch*180/Math.PI))});}
 async settle(){await this.call('wait',{durationMs:1000});for(let i=0;i<12;i++){await this.call('wait',{durationMs:100});const s=this.state;if(!s.blocked.roomLoading&&i>=3)return s;}return this.state;}
 async gridAtPlayer(width=24,depth=24,cell=.75){const p=this.state.game.player;return this.call('inspect_navigation',{x:p[0],z:p[2],width,depth,cell,radius:.28});}
 path(grid,goal,{avoidPeople=true}={}){
  const cells=grid.cells,edges=new Set(grid.blockedEdges.map(([a,b])=>`${Math.min(a,b)}:${Math.max(a,b)}`)),p=this.state.game.player;
  const doors=this.state.game.room?[]:this.state.sites.filter(s=>s.door).map(s=>s.approachPosition||s.door).filter(d=>Math.hypot(d[0]-goal.x,d[2]-goal.z)>3);
  // Doorways are facing-dependent interactions, not circular solid walls. A large
  // exclusion disk incorrectly seals the 2.6m lane between opposite Kitahama homes.
  const allowed=c=>!c.staticBlocked&&(!avoidPeople||!c.residentBlocked)&&!doors.some(d=>Math.hypot(c.x-d[0],c.z-d[2])<(d[2]>=62?.6:1.6));
  let start=-1,best=Infinity;for(let i=0;i<cells.length;i++)if(allowed(cells[i])){const d=Math.hypot(cells[i].x-p[0],cells[i].z-p[2]);if(d<best){best=d;start=i;}}
  if(start<0)return null;const prev=new Int32Array(cells.length).fill(-2),cost=new Float64Array(cells.length),queue=[start];prev[start]=-1;
  for(let head=0;head<queue.length;head++){const i=queue[head],x=i%grid.columns,z=Math.floor(i/grid.columns);for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz;if(nx<0||nx>=grid.columns||nz<0||nz>=grid.rows)continue;const j=nz*grid.columns+nx;if(prev[j]!==-2||!allowed(cells[j])||edges.has(`${Math.min(i,j)}:${Math.max(i,j)}`))continue;prev[j]=i;cost[j]=cost[i]+grid.cell;queue.push(j);}}
  let end=start,score=Infinity;for(const i of queue){const c=cells[i],n=Math.hypot(c.x-goal.x,c.z-goal.z)+cost[i]*.015;if(n<score){score=n;end=i;}}
  const indices=[];for(let i=end;i!==-1;i=prev[i])indices.push(i);indices.reverse();
  const points=[];for(let i=0;i<indices.length;i++){if(i>0&&i<indices.length-1&&indices[i]-indices[i-1]===indices[i+1]-indices[i])continue;const c=cells[indices[i]];points.push({x:c.x,z:c.z});}
  return {points,end:cells[end],remaining:Math.hypot(cells[end].x-goal.x,cells[end].z-goal.z),cells:queue.length};
 }
 async navigate(x,z,{inside=false,tolerance=.6}={}){
  if(inside&&!this.state.game.room)return {reached:false,roomChanged:true,reason:'The player has already walked out through the real door.'};const originalRoom=this.state.game.room,legs=[];let previousDistance=Infinity;
  for(let attempt=0;attempt<16;attempt++){
   const p=this.state.game.player,distance=Math.hypot(x-p[0],z-p[2]);if(distance<tolerance)return {reached:true,legs};
   if(this.state.game.room!==originalRoom)return {reached:false,roomChanged:true,legs};
   let grid;if(inside){const b=this.state.roomNavigation.bounds;grid=await this.call('inspect_navigation',{x:(b.minX+b.maxX)/2,z:(b.minZ+b.maxZ)/2,width:Math.min(32,b.maxX-b.minX),depth:Math.min(32,b.maxZ-b.minZ),cell:.4});}else grid=await this.gridAtPlayer(24,24,.75);
   const path=this.path(grid,{x,z});if(!path||path.points.length<1)return {reached:false,reason:'No standing path in sampled connected component.',legs};
   const result=await this.call('follow_path',{points:path.points.slice(0,64),maxSeconds:120});legs.push({goal:[x,z],path:path.points,reached:result.reached,reason:result.reason,roomChanged:result.roomChanged});await this.settle();
   if(this.state.game.room!==originalRoom)return {reached:false,roomChanged:true,legs};
   const next=Math.hypot(x-this.state.game.player[0],z-this.state.game.player[2]);
   if(next<tolerance)return {reached:true,legs};
   if(!result.reached||next>=previousDistance-.15){await this.call('wait',{durationMs:2000});if(attempt>=2)return {reached:false,reason:result.reason||'No progress toward target.',legs};}
   previousDistance=next;
  }return {reached:false,reason:'Route planning budget exhausted.',legs};
 }
 async enter(site){
  const d=site.door,angle=site.entryFacing||0;let out=['resident-home-aya','resident-home-kenji'].includes(site.id)?[-17.8,1.6]:[d[0]+Math.sin(angle)*.85,d[2]+Math.cos(angle)*.85];
  if(['school','community-kitchen','clinic','mayor-home'].includes(site.id)&&!this.state.game.room){await this.navigate(20.5,23.2);await this.navigate(20.5,26.2);await this.navigate(d[0],36.8);}
  if(d[2]>=62&&!this.state.game.room){
   const p=this.state.game.player;
   if(p[2]<62){await this.navigate(1.9,63.2);await this.navigate(1.9,66);}
   else if(p[2]<69){await this.navigate(p[0]+(p[0]>55?-2:2),p[2]);await this.navigate(this.state.game.player[0],66);}
   else{await this.navigate(23.5,p[2]);await this.call('walk_to',{x:23.5,z:66,maxSeconds:60});await this.settle();}
   if(Math.abs(angle+Math.PI/2)<.1){await this.call('walk_to',{x:23.5,z:66,maxSeconds:60});out=[23.5,d[2]];}
   else out=[d[0],66];
   await this.call('walk_to',{x:out[0],z:out[1],maxSeconds:60});await this.settle();
  }
  const travel=await this.navigate(...out);await this.settle();if(this.state.game.room===site.id)return {entered:true,travel};if(this.state.game.room)return {entered:false,reason:'Another doorway entered',travel};await this.face(d[0],d[2]);await this.call('press_control',{control:'interact',durationMs:16});await this.settle();if(this.state.game.room===site.id)return {entered:true,travel};if(this.state.ui.activity){await this.call('press_control',{control:'close',durationMs:16});}await this.call('press_control',{control:'forward',durationMs:250});await this.settle();return {entered:this.state.game.room===site.id,travel,state:this.state};
 }
 async exploreRoom(id){const s=await this.call('get_state'),b=s.roomNavigation.bounds,spawn=s.roomNavigation.spawn,grid=await this.call('inspect_navigation',{x:(b.minX+b.maxX)/2,z:(b.minZ+b.maxZ)/2,width:Math.min(32,b.maxX-b.minX),depth:Math.min(32,b.maxZ-b.minZ),cell:.4}),records=[];let modalProbe=null;
  await this.shot(id+'-entrance');if(this.state.view.thirdPerson)await this.call('press_control',{control:'view',durationMs:34});
  const goals=[[b.minX+.8,b.minZ+.8],[(b.minX+b.maxX)/2,b.minZ+.8],[b.maxX-.8,b.minZ+.8],[b.maxX-.8,(b.minZ+b.maxZ)/2],[b.minX+.8,(b.minZ+b.maxZ)/2]];
  for(let i=0;i<goals.length;i++){const path=this.path(grid,{x:goals[i][0],z:goals[i][1]});if(!path||Math.hypot(path.end.x-spawn[0],path.end.z-spawn[2])<1.3)continue;const r=await this.navigate(path.end.x,path.end.z,{inside:true,tolerance:.55});records.push({goal:goals[i],sampled:path.end,walk:r});if(this.state.game.room!==id)break;await this.face((b.minX+b.maxX)/2,(b.minZ+b.maxZ)/2);await this.shot(id+'-walk-'+i);}
  if(this.state.game.room!==id)return {id,walks:records,unexpectedExit:true,returned:this.state.game.room===null,gridComponents:grid.components};
  const target=this.state.targets.find(t=>/^Inspect |^Read |^Look /.test(t.label)&&!/^Inspect .*furniture/.test(t.label));
  if(target){const path=this.path(grid,{x:target.position[0],z:target.position[2]});if(path){await this.navigate(path.end.x,path.end.z,{inside:true,tolerance:.55});if(this.state.game.room!==id)return {id,walks:records,returned:this.state.game.room===null,naturalExit:true,gridComponents:grid.components};await this.face(target.position[0],target.position[2]);await this.call('press_control',{control:'interact',durationMs:16});await this.shot(id+'-interaction');if(this.state.blocked.creator||this.state.blocked.viewer){const p=this.state.game.player.slice();const probe=await this.call('press_control',{control:'forward',durationMs:250});modalProbe={blocked:probe.accepted===false,positionHeld:JSON.stringify(p)===JSON.stringify(probe.before.game.player)};if(!modalProbe.blocked||!modalProbe.positionHeld)throw Error('Movement must be rejected while the editor/viewer is open.');}await this.call('press_control',{control:'close',durationMs:34});await this.settle();}}
  if(this.state.game.room!==id)return {id,walks:records,returned:this.state.game.room===null,naturalExit:true,gridComponents:grid.components};const exit=this.state.roomNavigation?.exit||spawn,ex=Array.isArray(exit)?exit[0]:exit.x,ez=Array.isArray(exit)?exit[2]:exit.z;
  const returnWalk=await this.navigate(ex,ez,{inside:true,tolerance:.55});
  if(this.state.game.room===id){await this.settle();await this.call('ui_control',{control:'exit_room'});await this.settle();}
  if(this.state.game.room)await this.shot(id+'-exit-blocked');else await this.shot(id+'-returned');
  // Restore the same view using the normal V key after first-person exploration.

  return {id,walks:records,gridComponents:grid.components,reachableCells:grid.cells.filter(c=>c.reachable).length,clearCells:grid.cells.filter(c=>!c.staticBlocked).length,interaction:target?.label,modalProbe,returnWalk,returned:this.state.game.room===null,errors:this.state.errors,invalidTransforms:this.state.invalidTransforms};
 }
 async close(){try{if(this.connected)await this.call('close_session').catch(e=>console.warn('Session cleanup: '+e.message));}finally{await this.client?.close();this.connected=false;}}
}
