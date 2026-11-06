// Interactive official-MCP client: no fixture placement or browser evaluation.
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile,readFile,appendFile} from 'node:fs/promises';
import {createInterface} from 'node:readline';
import {setTimeout as delay} from 'node:timers/promises';
const output=new URL('../../../output/mcp-shop-tour/',import.meta.url);await mkdir(new URL('calls/',output),{recursive:true});
const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('server.mjs',import.meta.url))],stderr:'pipe'});
const client=new Client({name:'town-shop-walkthrough',version:'1'}),history=[];await client.connect(transport);
const tools=(await client.listTools()).tools.map(t=>t.name);
const commandsIndex=process.argv.indexOf('--commands'),commandsPath=commandsIndex<0?null:process.argv[commandsIndex+1];
if(commandsIndex>=0&&!commandsPath)throw Error('--commands requires a JSON-lines file path.');
const responses=new URL('responses.jsonl',output);
async function respond(value){const line=JSON.stringify(value);console.log(line);await appendFile(responses,line+'\n');}
async function* fileCommands(path){
 let consumed=0;
 for(;;){
  let contents='';try{contents=await readFile(path,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
  if(contents.length<consumed)throw Error('Commands file was truncated during the tour.');
  let end;while((end=contents.indexOf('\n',consumed))>=0){const line=contents.slice(consumed,end);consumed=end+1;yield line;}
  await delay(100);
 }
}
const state=s=>s&&({player:s.game?.player,room:s.game?.room,minutes:s.game?.minutes,view:s.view,seated:s.seated,blocked:s.blocked,ui:s.ui,sites:s.sites,targets:s.targets,roomNavigation:s.roomNavigation,clearance:s.playerClearance,shop:s.shop,residents:s.residents?.filter(p=>p.visible&&p.inMarket||p.inBookshop||p.inWorkplace||p.indoors==='izakaya'||p.indoors==='ramen'),errors:s.errors,invalidTransforms:s.invalidTransforms});
async function call(name,args={}){
 if(!tools.includes(name))throw Error('Unavailable MCP tool '+name);
 const result=await client.callTool({name,arguments:args},{timeout:240000}),stem=String(history.length+1).padStart(4,'0')+'-'+name;
 const image=result.content.find(c=>c.type==='image');if(image){const file=new URL(stem+'.png',output);await writeFile(file,Buffer.from(image.data,'base64'));history.push({name,args,image:fileURLToPath(file)});await writeFile(new URL('actions.json',output),JSON.stringify(history,null,2)+'\n');return {image:fileURLToPath(file)};}
 const block=result.content.find(c=>c.type==='text'),data=block?JSON.parse(block.text):null,file=new URL('calls/'+stem+'.json',output);
 await writeFile(file,JSON.stringify({name,args,result:data,isError:result.isError===true},null,2)+'\n');history.push({name,args,file:fileURLToPath(file),isError:result.isError===true});await writeFile(new URL('actions.json',output),JSON.stringify(history,null,2)+'\n');
 if(result.isError)throw Error(JSON.stringify(data));
 if(data?.game)return state(data);
 if(data?.cells)return {columns:data.columns,rows:data.rows,components:data.components,startComponent:data.startComponent,startIndex:data.startIndex,file:fileURLToPath(file)};
 return {...data,before:state(data?.before),after:state(data?.after),state:state(data?.state),route:data?.route?.map(r=>({point:r.point,reached:r.reached,reason:r.reason})),steps:data?.steps?.length};
}
await respond({ready:true,tools,output:fileURLToPath(output),commandsPath});
const input=commandsPath?fileCommands(commandsPath):createInterface({input:process.stdin,crlfDelay:Infinity});
try{for await(const line of input){if(!line.trim())continue;try{const command=JSON.parse(line);let result;
 if(command.face){const s=await client.callTool({name:'get_state',arguments:{}}),data=JSON.parse(s.content[0].text),p=data.game.player;let delta=Math.atan2(-(command.face[0]-p[0]),-(command.face[1]-p[2]))-data.view.yaw;while(delta>Math.PI)delta-=2*Math.PI;while(delta< -Math.PI)delta+=2*Math.PI;result=await call('look',{degrees:delta*180/Math.PI,verticalDegrees:command.verticalDegrees||0});}
 else if(command.path)result=await call('follow_path',{points:command.path.map(([x,z])=>({x,z})),maxSeconds:command.maxSeconds||120});
 else result=await call(command.tool,command.arguments||{});
 await respond({ok:true,command,result});if(command.tool==='close_session')break;
 }catch(error){await respond({ok:false,error:error.message});}}}finally{await client.close();}
