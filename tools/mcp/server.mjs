import {McpServer} from '@modelcontextprotocol/server';
import {StdioServerTransport} from '@modelcontextprotocol/server/stdio';
import * as z from 'zod';

const server=new McpServer({name:'johansson-town-audit',version:'1.0.0'});
// Initialisation and tool discovery do not need Chromium or the game module.
// Load the browser driver only when a test session is actually requested.
let session=null,creating=null,stopping=false;
const requireSession=()=>{if(!session)throw Error('Start a test session first.');return session;};
async function ensureSession(){
 if(stopping)throw Error('Test server is closing.');
 if(!creating)creating=import('./session.mjs').then(({TownAuditSession})=>{if(stopping)throw Error('Test server is closing.');return session=new TownAuditSession();});
 return creating;
}
const withSession=(method,create=false)=>async args=>(create?await ensureSession():requireSession())[method](args);
let queue=Promise.resolve();
const serial=fn=>{const task=queue.then(fn);queue=task.catch(()=>{});return task;};
const text=data=>({content:[{type:'text',text:JSON.stringify(data)}]});
const number=z.number().finite().min(-300).max(300);
function tool(name,description,schema,handler,{readOnly=false}={}){
 server.registerTool(name,{description,inputSchema:z.object(schema).strict(),annotations:{readOnlyHint:readOnly,destructiveHint:false,openWorldHint:false}},args=>serial(async()=>{try{return text(await handler(args));}catch(e){return {...text({error:e.message}),isError:true};}}));
}
tool('start_session','Start an isolated local game save in Chromium. Select an opening, clock and viewport. This never uses or changes your normal browser save.',{viewport:z.enum(['desktop','phone']).default('desktop'),spawn:z.enum(['fish-auction','sakura-bench','park-bench','pier','ferry','seawall','ramen','izakaya']).default('fish-auction'),headless:z.boolean().default(true),time:z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).default('12:00'),source:z.boolean().default(false).describe('Load the game from src/ as it is on disk instead of the compiled runtime/, to walk a change before runtime/ is rebuilt (slower to start).')},withSession('start',true));
tool('get_state','Read player coordinates, current interactions and menu choices, visible capabilities, NPC/car/ferry state, blockers, scene transforms and browser errors.',{},withSession('observe'),{readOnly:true});
tool('wait','Advance bounded gameplay at60Hz without pressing movement controls, to observe NPC routines, ferry boarding or recovery from a temporary blockage.',{durationMs:z.number().int().min(16).max(20000).default(1000)},withSession('wait'));
tool('press_control','Use real keyboard controls and simulate bounded 60 Hz gameplay. Returns before/after state and measured displacement; a blocked move is visible, never reported as successful travel.',{control:z.enum(['forward','backward','left','right','jump','interact','close','directory','view']),durationMs:z.number().int().min(16).max(2500).default(300),run:z.boolean().default(false)},withSession('input'));
tool('look','Turn the camera through the real mouse path. Positive degrees turns left; positive verticalDegrees looks down.',{degrees:z.number().min(-180).max(180).default(45),verticalDegrees:z.number().min(-60).max(60).default(0)},withSession('look'));
tool('choose_action','Click an exact enabled label from the current activity. This can spend in-game yen or advance quests in the isolated test save.',{label:z.string().min(1).max(200)},withSession('choose'));
tool('directory_action','Search the visible Town Book and use a normal Show home, Find person, Directions or unlocked Shortcut button. Reads the planned route; it never teleports for a walking action.',{section:z.enum(['places','homes','people']).default('people'),query:z.string().max(100).default(''),action:z.enum(['search','show_home','find_person','directions','shortcut']).default('search'),id:z.string().min(1).max(120).optional()},withSession('directory'));
tool('walk_to','Attempt a straight walk to an x/z point in the current town or interior coordinate frame using real camera and keyboard controls; returns any stall and evidence. Does not teleport, find a path, or claim a collision-free route without walking it.',{x:number,z:number,maxSeconds:z.number().min(1).max(60).default(20)},withSession('walk'));
tool('follow_path','Walk a bounded sequence of x/z waypoints through real camera and keyboard input. All points use the current room coordinate frame. Stops on a stall, unavailable controls or doorway crossing; never teleports.',{points:z.array(z.object({x:number,z:number}).strict()).min(1).max(64),maxSeconds:z.number().min(1).max(120).default(120)},withSession('follow'));
tool('ui_control','Click a normal, visible enabled game button or the town menu Settings disclosure, including leaving a room from its actual exit. Unavailable or distant exit buttons are rejected.',{control:z.enum(['exit_room','close_activity','close_directory','town_menu','settings','map','map_scope','field_book','clock','weather','moves','bag','residents','ferry_operations','close_ferry_operations','ferry_sequence','ferry_crew','ferry_reports'])},withSession('ui'));
tool('inspect_navigation','Sample the current room or town standing collision grid, floor heights, walls, residents and connected components. Maximum4096cells; the player component is marked reachable. Static samples complement actual control tests.',{x:number,z:number,width:z.number().min(1).max(32).default(12),depth:z.number().min(1).max(32).default(12),cell:z.number().min(.25).max(1).default(.5),radius:z.number().min(.1).max(.6).default(.28)},withSession('grid'),{readOnly:true});
server.registerTool('screenshot',{description:'Capture the actual game pixels for visual judgement, including clipping, odd placement, facial poses and UI.',inputSchema:z.object({}),annotations:{readOnlyHint:true,openWorldHint:false}},()=>serial(async()=>{try{return {content:[{type:'image',data:(await requireSession().screenshot()).toString('base64'),mimeType:'image/png'}]};}catch(e){return {...text({error:e.message}),isError:true};}}));
tool('report_finding','Save an observed bug or odd behaviour with expected behaviour, reproducible steps, game state, input history and a real screenshot under output/mcp-audit.',{summary:z.string().min(1).max(300),expected:z.string().min(1).max(2000),observed:z.string().min(1).max(2000),reproduction:z.array(z.string().max(500)).min(1).max(30)},withSession('report'));
tool('close_session','Close this test browser and its private loopback preview.',{},async()=>{await session?.close();return {closed:true};});
server.registerPrompt('audit_town',{description:'Run a grounded gameplay and visual bug audit.',argsSchema:z.object({focus:z.string().max(500).optional()})},({focus})=>({messages:[{role:'user',content:{type:'text',text:`Audit Johansson Town${focus?' focusing on '+focus:''}. Start a fresh test session, read state/capabilities, use actual controls and enabled choices, and take screenshots. Inspect navigation for suspicious obstructions, then confirm them by walking. Test a complete interaction through its exit/return. Record observed bugs or odd behaviour with report_finding and reproducible evidence. Walls, locked shortcuts and NPC pauses are not bugs by themselves. Distinguish tested success, blocked access, expected limits and subjective visual judgements. Do not claim unvisited areas are perfect.`}}]}));
const shutdown=async()=>{stopping=true;if(session)session.stopping=true;await session?.close();await queue;await session?.close();await server.close();};
process.once('SIGINT',()=>shutdown().finally(()=>process.exit(0)));process.once('SIGTERM',()=>shutdown().finally(()=>process.exit(0)));
const transport=new StdioServerTransport();transport.onclose=async()=>{await session?.close();return {closed:true};};
process.stdin.once('end',()=>shutdown());
await server.connect(transport);
