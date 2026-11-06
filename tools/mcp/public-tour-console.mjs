// An interactive, official-SDK client. Every game action goes through the wired
// MCP server; this runner has no browser evaluation, fixture or teleport path.
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {TourClient} from './tour-client.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const output=resolve(root,'../output/mcp-world-tour',process.argv[2]||'public');
await mkdir(resolve(output,'calls'),{recursive:true});
const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./server.mjs',import.meta.url))],stderr:'pipe'});
const client=new Client({name:'town-public-world-tour',version:'1'}),history=[];
// Reuse the shared collision-grid planner with this one official MCP connection.
// Its call adapter below preserves every action in this console's evidence log.
const navigator=new TourClient('public-planner');
await client.connect(transport);
const names=new Set((await client.listTools()).tools.map(t=>t.name));
const briefState=s=>s&&({player:s.game?.player,room:s.game?.room,coordinates:s.game?.coordinates,minutes:s.game?.minutes,seated:s.seated,view:s.view,blocked:s.blocked,nearby:s.nearby,ui:s.ui,roomNavigation:s.roomNavigation,targets:s.targets?.filter(t=>t.distance<12),clearance:s.playerClearance,errors:s.errors,invalidTransforms:s.invalidTransforms});
function brief(data){
 if(data?.game)return briefState(data);
 if(data?.cells)return {columns:data.columns,rows:data.rows,components:data.components,startComponent:data.startComponent,startIndex:data.startIndex,edgeProbeSpacing:data.edgeProbeSpacing,blockedEdges:data.blockedEdges?.length,cells:data.cells.length};
 return {...data,before:briefState(data?.before),after:briefState(data?.after),state:briefState(data?.state),route:data?.route?.map(r=>({point:r.point,reached:r.reached,reason:r.reason,roomChanged:r.roomChanged,player:r.after?.game?.player,room:r.after?.game?.room,steps:r.steps?.length})),steps:Array.isArray(data?.steps)?{count:data.steps.length,first:data.steps[0],last:data.steps.at(-1)}:data?.steps};
}
async function call(name,args={}){
 if(!names.has(name))throw Error('Unavailable MCP tool '+name);
 const result=await client.callTool({name,arguments:args},{timeout:240000});
 const index=history.length+1,stem=String(index).padStart(4,'0')+'-'+name;
 const text=result.content.find(c=>c.type==='text'),data=text?JSON.parse(text.text):null;
 if(name==='screenshot'){
  const image=result.content.find(c=>c.type==='image');if(!image)throw Error('Screenshot did not return image content');
  const path=resolve(output,stem+'.png');await writeFile(path,Buffer.from(image.data,'base64'));
  history.push({index,name,args,image:path});await writeFile(resolve(output,'actions.json'),JSON.stringify(history,null,2)+'\n');
  return {image:path};
 }
 const file=resolve(output,'calls',stem+'.json');await writeFile(file,JSON.stringify({name,args,result:data,isError:result.isError===true},null,2)+'\n');
 history.push({index,name,args,file,isError:result.isError===true});await writeFile(resolve(output,'actions.json'),JSON.stringify(history,null,2)+'\n');
 if(result.isError)throw Error(JSON.stringify(data));
 const state=data?.game?data:data?.after||data?.state;
 if(state?.game)navigator.state=state;
 return data;
}
navigator.call=call;
console.log(JSON.stringify({ready:true,tools:[...names],output}));
const input=createInterface({input:process.stdin,crlfDelay:Infinity});
try{
 for await(const line of input){
  if(!line.trim())continue;
  try{
   const command=JSON.parse(line);let data;
   if(command.navigate){
    await call('get_state');
    data=await navigator.navigate(...command.navigate,command.options||{});
   }else if(command.path){
    const points=command.path.map(p=>Array.isArray(p)?{x:p[0],z:p[1]}:p);
    if(names.has('follow_path'))data=await call('follow_path',{points,maxSeconds:command.maxSeconds??120});
    else{const legs=[];for(const p of points){const leg=await call('walk_to',{...p,maxSeconds:command.maxSeconds??60});legs.push(brief(leg));if(!leg.reached)break;}data={legs};}
   }else if(command.face){
    const state=await call('get_state'),p=state.game.player,target=Math.atan2(command.face[0]-p[0],p[2]-command.face[1]);
    // Mouse yaw is positive toward -x; use the same heading as normal movement.
    let delta=-target-state.view.yaw;while(delta>Math.PI)delta-=2*Math.PI;while(delta< -Math.PI)delta+=2*Math.PI;
    data=await call('look',{degrees:delta*180/Math.PI,verticalDegrees:command.verticalDegrees??0});
    await call('wait',{durationMs:34});
   }else data=await call(command.tool,command.arguments||{});
   console.log(JSON.stringify({ok:true,command,result:brief(data)}));
   if(command.tool==='close_session')break;
  }catch(error){console.log(JSON.stringify({ok:false,error:error.message}));}
 }
}finally{await client.close();}
