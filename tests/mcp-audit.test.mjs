import test from 'node:test';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {fileURLToPath} from 'node:url';
import {analyseGrid,sampleGridEdges} from '../tools/mcp/navigation.mjs';
import {serveGame} from '../tools/mcp/static-server.mjs';
import {resolve} from 'node:path';
import {TownAuditSession} from '../tools/mcp/session.mjs';

test('actual MCP stdio handshake lists bounded tools, rejects invalid controls and returns missing-session errors',async()=>{
 const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../tools/mcp/server.mjs',import.meta.url))],stderr:'pipe'});
 const client=new Client({name:'town-audit-test',version:'1'});
 try{
  await client.connect(transport,{timeout:240000});const tools=(await client.listTools()).tools;
  assert.deepEqual(tools.map(t=>t.name).sort(),['choose_action','close_session','directory_action','follow_path','get_state','inspect_navigation','look','press_control','report_finding','screenshot','start_session','ui_control','wait','walk_to']);
  const move=tools.find(t=>t.name==='press_control');assert.ok(move.inputSchema.properties.durationMs.maximum<=2500);
  const invalid=await client.callTool({name:'press_control',arguments:{control:'teleport'}});assert.equal(invalid.isError,true);
  const invalidDirectory=await client.callTool({name:'directory_action',arguments:{section:'people',action:'teleport'}});assert.equal(invalidDirectory.isError,true);
  const missing=await client.callTool({name:'get_state',arguments:{}});assert.equal(missing.isError,true);assert.match(missing.content[0].text,/Start a test session/);
  assert.ok((await client.listPrompts()).prompts.some(p=>p.name==='audit_town'));
 }finally{await client.close();}
});

test('failed browser startup and cancellation during launch release the preview and any late browser',async()=>{
 let previewClosed=0,browserClosed=0;const serve=async()=>({url:'http://127.0.0.1:12345/johansson-town/',close:async()=>previewClosed++});
 const failed=new TownAuditSession({serve,launch:async()=>{throw Error('Browser unavailable');}});
 await assert.rejects(failed.start(),/Browser unavailable/);assert.equal(previewClosed,1);assert.equal(failed.preview,null);
 let releaseLaunch,started;const ready=new Promise(resolve=>started=resolve),late=new Promise(resolve=>releaseLaunch=resolve);
 const cancelled=new TownAuditSession({serve,launch:()=>{started();return late;}}),startup=cancelled.start();
 await ready;await cancelled.close();releaseLaunch({close:async()=>browserClosed++,newContext(){throw Error('Cancelled browser cannot create a context');}});
 await assert.rejects(startup,/cancelled/);assert.equal(browserClosed,1);assert.equal(cancelled.browser,null);assert.equal(cancelled.page,null);
});

test('coarse clear cell centers cannot claim access through an intervening thin wall; a gentle slope remains walkable',()=>{
 const cells=[{x:0,z:0,y:0,staticBlocked:false},{x:1,z:0,y:0,staticBlocked:false}];
 const wall=sampleGridEdges(cells,2,1,(x,z)=>({x,z,y:0,staticBlocked:Math.abs(x-.5)<.12}));
 assert.equal(analyseGrid(cells,2,1,0,wall).cells[1].reachable,false);
 const slope=[cells[0],{...cells[1],y:.4}],edges=sampleGridEdges(slope,2,1,(x,z)=>({x,z,y:x*.4,staticBlocked:false}));
 assert.equal(analyseGrid(slope,2,1,0,edges).cells[1].reachable,true,'Small actual steps on a gentle slope should not be rejected by the endpoint height difference');
});

test('an MCP route stops at a real doorway instead of interpreting later world waypoints as room coordinates',async()=>{
 const session=new TownAuditSession();let room=null,walks=0;
 session.observe=async()=>({game:{room}});session.controlState=session.observe;
 session.walk=async()=>{walks++;room='ramen';return {reached:true,steps:[{durationMs:250}]};};
 const result=await session.follow({points:[{x:0,z:-14},{x:0,z:14}],maxSeconds:20});
 assert.equal(walks,1);assert.equal(result.reached,false);assert.equal(result.roomChanged,true);assert.equal(result.after.game.room,'ramen');
});

test('navigation components preserve real walls and reject height jumps above standing step limit',()=>{
 const cells=Array.from({length:15},()=>({staticBlocked:false,y:0}));
 for(const i of [2,7,12])cells[i].staticBlocked=true;cells[4].y=.4;
 const result=analyseGrid(cells,5,3,0);
 assert.equal(result.components.length,3);assert.equal(result.cells[1].reachable,true);
 assert.equal(result.cells[3].reachable,false);assert.equal(result.cells[4].component===result.cells[3].component,false);
 assert.equal(analyseGrid(cells,5,3,-1).cells.some(c=>c.reachable),false,'A player outside the sampled grid cannot be marked reachable');
});

test('MCP preview accepts a directory URL path, serves game bytes only and handles actual binary range requests',async()=>{
 const root=fileURLToPath(new URL('../',import.meta.url)),server=await serveGame(root);
 try{
  const response=await fetch(server.url);assert.equal(response.status,200);assert.match(await response.text(),/JOHANSSON|Johansson/);
  const module=await fetch(new URL('tools/mcp/navigation.mjs',server.url));assert.match(module.headers.get('content-type'),/javascript/,'Browser navigation module must have a valid ESM MIME type');
  const range=await fetch(new URL('index.html',server.url),{headers:{range:'bytes=0-9'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,10);
  assert.equal((await fetch(new URL('%2e%2e%2fpackage.json',server.url))).status,403);
 }finally{await server.close();}
});

test('door transitions do not invent a travelled distance between world and room coordinates',async()=>{
 const session=new TownAuditSession(),states=[{game:{room:null,player:[-5,0,-28],island:{}},blocked:{},ui:{}},{game:{room:'market',player:[-6,0,3],island:{}},blocked:{},ui:{}}];
 session.observe=async()=>states.shift();session.page={keyboard:{down:async()=>{},up:async()=>{}},evaluate:async()=>{},waitForTimeout:async()=>{}};
 const result=await session.input({control:'interact',durationMs:17});assert.equal(result.coordinateFrameChanged,true);assert.equal(result.displacement,null);assert.equal(result.moved,false);
});

test('MCP honours the cinematic lock while allowing normal movement on a walking ferry crossing',async()=>{
 const session=new TownAuditSession(),state={game:{room:null,player:[0,1.1,0],island:{crossing:{progress:.5},cinematic:true}},blocked:{},ui:{}};
 let keys=0;session.observe=async()=>state;
 session.page={keyboard:{down:async()=>keys++,up:async()=>{}},evaluate:async()=>{},waitForTimeout:async()=>{}};
 assert.equal((await session.input({control:'forward',durationMs:17})).accepted,false);assert.equal(keys,0);
 state.game.island.cinematic=false;
 assert.equal((await session.input({control:'forward',durationMs:17})).accepted,true);assert.equal(keys,1);
});
