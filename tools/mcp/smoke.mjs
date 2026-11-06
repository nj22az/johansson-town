// Exercise the shipped server over actual MCP, then inspect its real browser capture.
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=new URL('../../../output/mcp-smoke/',import.meta.url);await mkdir(out,{recursive:true});
const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./server.mjs',import.meta.url))],stderr:'pipe'}),client=new Client({name:'town-mcp-smoke',version:'1'}),report=[];
const call=async(name,args={})=>{const result=await client.callTool({name,arguments:args},{timeout:240000});assert.notEqual(result.isError,true,JSON.stringify(result));const data=JSON.parse(result.content[0].text);report.push({name,data});return data;};
try{
 await client.connect(transport);assert.ok((await client.listTools()).tools.length>=10);
 // The old URL remains supported, but starts on foot at the fish auction after the bench's removal.
 const initial=await call('start_session',{spawn:'sakura-bench',time:'12:00'});assert.equal(initial.seated,false);assert.deepEqual(initial.errors,[]);
 assert.ok(Math.hypot(initial.game.player[0]-19.8,initial.game.player[2]+40)<1,'Legacy bench start reaches the clear harbour point');
 if(initial.game.arrival.active)await call('wait',{durationMs:2500});
 const move=await call('press_control',{control:'forward',durationMs:350});assert.equal(move.accepted,true);assert.ok(move.displacement>.3);assert.equal(move.after.seated,false);assert.equal(move.after.game.arrival.active,false);
 const turn=await call('look',{degrees:30});assert.ok(Math.abs(turn.after.view.yaw-turn.before.view.yaw)>.4);
 const waiting=await call('wait',{durationMs:250});assert.ok(waiting.game.minutes>=turn.after.game.minutes);assert.deepEqual(waiting.errors,[]);
 const p=turn.after.game.player,grid=await call('inspect_navigation',{x:p[0],z:p[2],width:8,depth:8,cell:.5});assert.ok(grid.components.length>0);assert.ok(grid.cells.some(c=>c.reachable));
 const menu=await call('press_control',{control:'directory',durationMs:16});assert.equal(menu.after.ui.directoryOpen,true);
 const blocked=await call('press_control',{control:'forward',durationMs:250});assert.equal(blocked.accepted,false);assert.deepEqual(blocked.before.game.player,menu.after.game.player);
 await call('press_control',{control:'close',durationMs:16});
 const shot=await client.callTool({name:'screenshot',arguments:{}});assert.equal(shot.content[0].type,'image');await writeFile(new URL('game.png',out),Buffer.from(shot.content[0].data,'base64'));
 const final=await call('get_state');assert.deepEqual(final.errors,[]);assert.deepEqual(final.invalidTransforms,[]);
 await call('close_session');
}finally{await writeFile(new URL('report.json',out),JSON.stringify(report,null,2)+'\n');await client.close();}
console.log('MCP handshake, gameplay controls, camera, navigation, modal blocking and screenshot passed.');
