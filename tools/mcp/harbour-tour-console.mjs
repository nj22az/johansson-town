// An interactive, official-SDK client. Every game action goes through the wired
// MCP server; this runner has no browser evaluation, fixture or teleport path.
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile,readFile,appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';

const root=fileURLToPath(new URL('../../',import.meta.url));
const output=resolve(root,'../output/mcp-harbour-tour');
await mkdir(resolve(output,'calls'),{recursive:true});
const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./server.mjs',import.meta.url))],stderr:'pipe'});
const client=new Client({name:'town-harbour-world-tour',version:'1'}),history=[];
await client.connect(transport);
const names=new Set((await client.listTools()).tools.map(t=>t.name));
const briefState=s=>s&&({player:s.game?.player,room:s.game?.room,coordinates:s.game?.coordinates,minutes:s.game?.minutes,seated:s.seated,view:s.view,blocked:s.blocked,nearby:s.nearby,ui:s.ui,roomNavigation:s.roomNavigation,targets:s.targets?.filter(t=>t.distance<16),sites:s.sites?.filter(t=>s.game?.player&&Math.hypot(t.x-s.game.player[0],t.z-s.game.player[2])<18),landmarks:s.landmarks?.filter(t=>s.game?.player&&Math.hypot(t.x-s.game.player[0],t.z-s.game.player[2])<18),clearance:s.playerClearance,errors:s.errors,invalidTransforms:s.invalidTransforms});
function brief(data){
 if(data?.game)return briefState(data);
 if(data?.cells)return {columns:data.columns,rows:data.rows,components:data.components,startComponent:data.startComponent,startIndex:data.startIndex,edgeProbeSpacing:data.edgeProbeSpacing,blockedEdges:data.blockedEdges?.length,cells:data.cells.length};
 return {...data,before:briefState(data?.before),after:briefState(data?.after),state:briefState(data?.state),route:data?.route?.map(r=>({point:r.point,reached:r.reached,reason:r.reason,roomChanged:r.roomChanged})),steps:Array.isArray(data?.steps)?{count:data.steps.length,first:data.steps[0],last:data.steps.at(-1)}:data?.steps};
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
 return data;
}
const responseFile=resolve(output,'responses.jsonl');
await writeFile(responseFile,'');
async function respond(data){const line=JSON.stringify(data);await appendFile(responseFile,line+'\n');console.log(line);}
await respond({ready:true,tools:[...names],output});
const commandIndex=process.argv.indexOf('--commands'),commandFile=commandIndex<0?null:process.argv[commandIndex+1];
if(commandIndex>=0&&!commandFile)throw Error('--commands requires a JSONL file path');
const input=commandFile?null:createInterface({input:process.stdin,crlfDelay:Infinity});
async function* fileCommands(path){
 let offset=0,pending='';
 while(true){
  let body='';try{body=await readFile(path,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
  if(body.length<offset)throw Error('Command file was truncated during the tour');
  pending+=body.slice(offset);offset=body.length;
  let end;while((end=pending.indexOf('\n'))>=0){const line=pending.slice(0,end);pending=pending.slice(end+1);yield line;}
  await new Promise(done=>setTimeout(done,100));
 }
}
try{
 for await(const line of commandFile?fileCommands(resolve(commandFile)):input){
  if(!line.trim())continue;
  try{
   const command=JSON.parse(line);let data;
   if(command.path){
    const points=command.path.map(p=>Array.isArray(p)?{x:p[0],z:p[1]}:p);
    if(names.has('follow_path'))data=await call('follow_path',{points,maxSeconds:command.maxSeconds??120});
    else{const legs=[];for(const p of points){const leg=await call('walk_to',{...p,maxSeconds:command.maxSeconds??60});legs.push(brief(leg));if(!leg.reached)break;}data={legs};}
   }else if(command.face){
    const state=await call('get_state'),p=state.game.player,target=Math.atan2(command.face[0]-p[0],p[2]-command.face[1]);
    // Mouse yaw is positive toward -x; use the same heading as normal movement.
    let delta=-target-state.view.yaw;while(delta>Math.PI)delta-=2*Math.PI;while(delta< -Math.PI)delta+=2*Math.PI;
    data=await call('look',{degrees:delta*180/Math.PI,verticalDegrees:command.verticalDegrees??0});
   }else data=await call(command.tool,command.arguments||{});
   await respond({ok:true,command,result:brief(data)});
   if(command.tool==='close_session')break;
  }catch(error){await respond({ok:false,error:error.message});}
 }
}finally{await client.close();}
