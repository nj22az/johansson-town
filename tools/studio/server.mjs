#!/usr/bin/env node
/**
 * The johansson-studio MCP server (.mcp.json): Claude's way into Johansson Studio, to look at and change the town's
 * characters, and Sakura Shōten's products and their labels. Every tool is also on the command line (cli.mjs), for when
 * the host times the connection out. Startup loads only the SDK, zod and the tool table; World's code loads on the
 * first call and Chromium only for a render. Write tools are dry runs unless dryRun:false; what the creator says yes to
 * goes into Studio's draft (outside git), and nothing commits.
 * How to use it: avatar-creator/docs/STUDIO-MCP.md.
 */
import {McpServer} from '@modelcontextprotocol/server';
import {StdioServerTransport} from '@modelcontextprotocol/server/stdio';
import * as z from 'zod';
import {TOOLS,context,callTool} from './tools.mjs';

const server=new McpServer({name:'johansson-studio',version:'1.7.0'},{instructions:'Johansson Studio: the town\'s characters, and Sakura Shōten\'s products and their labels. Look first (character_list, character_get, render_portrait; product_list, product_get, render_product), then change with a dry run, show the creator (a baked label comes back as a picture), and apply with dryRun:false only when they agree: that puts the change in Studio\'s draft, outside git. World changes only when the creator says "update World" (publish_draft, the guide portraits and runtime build, publish_check, then commit, merge main, push, check the live workflow). Assets from Make model: asset_list, asset_export (the iPad\'s files, drawn headless), asset_draft (a package the creator sent; dry run first), asset_publish only on "update World". Static GLBs: model_inspect checks dimensions and possible surface overlaps; model_snap computes a grid or connector transform; model_prepare exports an adjusted copy (dry run first). These use the UI workshop and never change or publish town placements. Room drafts: room_create/open/get/edit/import_model/export/check/render share the Edit room document and commands. Use expectedRevision and dry runs; exchange .room.json files explicitly. Generic room drafts do not publish World. Native workshop: world_room_open/check/publish/rollback preserves machinery and checks contact, collisions, doorway, staff paths and prompts. world_room_publish requires both revisions, a dry run, and the creator’s update-World instruction; it writes only local data and its generated module. Build, review and deploy explicitly. Allow floating marks an intentional support exception, never a collision bypass. World library: world_asset_list/get/review/review_export exposes purpose and reference evidence; review proposals never remove World geometry. room_drop and room_check add static support queries. Comic After effects: comic_effects_info discovers looks and editing; comic_after_effects opens Fujita or a layered project, replaces text, applies looks and assets, exports a new PNG/project and editable link. This edits an output copy only and never publishes World. Films reuse the EXISTING jojo/remotion engine: film_pipeline_info describes it; scene_export_film exports actual World plate/camera/cast staging, not an approved episode. No second renderer. Setup: avatar-creator/docs/MODEL-WORKSHOP.md, ROOM-PROJECTS.md, WORLD-LIBRARY.md, WORKSHOP-ROUNDTRIP.md and REMOTION-PLAN.md.'});
const ctx=await context();
// Tools that write (a change, the draft, a render's file, the one headless page) take turns; tools that only read run
// at once, so a long publish_check never holds up a look at somebody. Writes across processes take Studio's lock too.
let queue=Promise.resolve();
const serial=task=>{const run=queue.then(task);queue=run.catch(()=>{});return run;};
const text=data=>({content:[{type:'text',text:JSON.stringify(data,null,1)}]});
for(const tool of TOOLS){
 server.registerTool(tool.name,{description:tool.description,inputSchema:z.fromJSONSchema(tool.input),
  annotations:{readOnlyHint:!!tool.readOnly,destructiveHint:!!tool.destructive,idempotentHint:!!(tool.readOnly||tool.idempotent),openWorldHint:false}},
  (args,extra)=>{
   const work=async()=>{
    const result=await callTool(tool.name,args,ctx,{signal:extra?.mcpReq?.signal??extra?.signal});
    if(result?.error)return {...text(result),isError:true};
    // A tool that draws (a portrait, a pack, a baked label) answers with the picture and its words.
    if(result?.image&&result?.mimeType)return {content:[{type:'image',data:result.image,mimeType:result.mimeType},{type:'text',text:JSON.stringify(result.data,null,1)}]};
    return text(result);
   };
   return tool.readOnly?work():serial(work);
  });
}
let stopping=null;
const shutdown=()=>stopping??=(async()=>{await queue;await ctx.close();await server.close();})();
process.once('SIGINT',()=>shutdown().finally(()=>process.exit(0)));process.once('SIGTERM',()=>shutdown().finally(()=>process.exit(0)));
process.stdin.once('end',()=>shutdown());
await server.connect(new StdioServerTransport());
