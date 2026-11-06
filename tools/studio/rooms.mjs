import {resolve,relative,sep} from 'node:path';
import {realpath,stat,readFile} from 'node:fs/promises';
import {newRoom,readRoom,roomSummary,editRoom,freeId,ROOM_LIMIT} from '../../src/studio/room-project.js';
import {modelBytes} from './models.mjs';
const obj=(properties,required=[])=>({type:'object',additionalProperties:false,properties,required});
const ID={type:'string',pattern:'^[a-z][a-z0-9-]{0,47}$'},REV={type:'integer',minimum:0},DRY={type:'boolean',default:true};
const folder='johansson-town/data/studio/projects',path=id=>{if(!/^[a-z][a-z0-9-]{0,47}$/.test(id))throw Error('Invalid room id.');return `${folder}/${id}.room.json`;};
const read=async(ctx,id)=>readRoom(await ctx.repo.read(path(id)));
async function change(ctx,id,expected,commands,dryRun){
 return ctx.repo.locked(async()=>{const p=await read(ctx,id),next=editRoom(p,commands,{expectedRevision:expected});
  if(!dryRun)await ctx.repo.write(path(id),JSON.stringify(next));
  return {dryRun,path:path(id),project:roomSummary(next),next:dryRun?'Review the proposed changes, then repeat with dryRun:false.':'Room draft saved. room_export makes a portable file to open in Studio. No town data was published.'};
 });
}
export const ROOM_TOOLS=[
 {name:'room_create',idempotent:true,description:'Create a portable room draft with stable asset/object IDs. Dry run by default. Saves under data/studio/projects (outside git and the preview-output eviction cache), never to World.',input:obj({id:ID,title:{type:'string',minLength:1,maxLength:120},dryRun:DRY},['id','title']),
  async run({id,title,dryRun=true},ctx){return ctx.repo.locked(async()=>{if(await ctx.repo.exists(path(id)))throw Error('This room already exists. Use room_get.');const p=newRoom({id,title});if(!dryRun)await ctx.repo.write(path(id),JSON.stringify(p));return {dryRun,path:path(id),project:roomSummary(p)};});}},
 {name:'room_open',idempotent:true,description:'Import a portable .room.json downloaded from Studio into a NEW MCP room ID. Validates embedded models; never overwrites an existing draft. Copy the file inside this checkout first. Dry run by default.',input:obj({id:ID,file:{type:'string',minLength:1,maxLength:300},dryRun:DRY},['id','file']),
  async run({id,file,dryRun=true},ctx){
   if(file.includes('\\')||file.startsWith('/')||file.split('/').some(p=>p==='..'||p==='.'||!p)||!file.endsWith('.room.json'))throw Error('Give a repository-relative .room.json path without traversal.');
   const root=await realpath(ctx.repo.root),source=resolve(root,file),actual=await realpath(source),rel=relative(root,actual);
   if(actual!==source||rel==='..'||rel.startsWith('..'+sep))throw Error('The project must be inside this checkout without symlinks.');
   const info=await stat(source);if(!info.isFile()||info.size>ROOM_LIMIT+1024*1024)throw Error('Room project exceeds 41 MiB.');
   const p=readRoom(await readFile(source,'utf8'));p.id=id;p.revision=0;
   return ctx.repo.locked(async()=>{if(await ctx.repo.exists(path(id)))throw Error('This room already exists. Choose a new id.');if(!dryRun)await ctx.repo.write(path(id),JSON.stringify(p));return {dryRun,path:path(id),project:roomSummary(p)};});
  }},
 {name:'room_get',readOnly:true,description:'Read a room draft: revision, objects and asset usage, without returning large embedded GLBs.',input:obj({id:ID},['id']),async run({id},ctx){return roomSummary(await read(ctx,id));}},
 {name:'room_edit',destructive:true,description:'Edit a room with the same commands as the UI: title; object.add/update/replace/duplicate/delete/snap; asset.add/update/remove. Replacements preserve transforms. Updating a shared asset changes all its uses. Required expectedRevision prevents overwriting another editor. Dry run by default; never publishes World.',
  input:obj({id:ID,expectedRevision:REV,commands:{type:'array',minItems:1,maxItems:64,items:{type:'object',required:['op'],properties:{op:{enum:['title','object.add','object.update','object.replace','object.duplicate','object.delete','object.snap','asset.add','asset.update','asset.remove']}},additionalProperties:true}},dryRun:DRY},['id','expectedRevision','commands']),
  async run({id,expectedRevision,commands,dryRun=true},ctx){return change(ctx,id,expectedRevision,commands,dryRun);}},
 {name:'room_import_model',idempotent:true,description:'Import a repository-local static GLB into a room asset and add an object, or replace one selected object using replaceObject. Keeps its transform and other uses unchanged. Dry run by default. room_get supplies expectedRevision.',
  input:obj({id:ID,expectedRevision:REV,file:{type:'string',maxLength:300},name:{type:'string',maxLength:120},replaceObject:ID,dryRun:DRY},['id','expectedRevision','file']),
  async run({id,expectedRevision,file,name,replaceObject,dryRun=true},ctx){
   const glb=await modelBytes(ctx.repo,file),p=await read(ctx,id),asset=freeId(p,'asset'),object=freeId(p),label=name||file.split('/').at(-1).replace(/\.glb$/,'');
   return change(ctx,id,expectedRevision,[{op:'asset.add',id:asset,name:label,glb},replaceObject?{op:'object.replace',id:replaceObject,asset}:{op:'object.add',id:object,asset,name:label}],dryRun);
  }},
 {name:'room_export',idempotent:true,description:'Export a room as a portable .room.json (editable, with embedded GLBs) or a combined GLB. Open the project file in Edit room. File exchange is explicit; an MCP process does not silently synchronise with a separate browser device.',input:obj({id:ID,format:{enum:['project','glb'],default:'project'}},['id']),
  async run({id,format='project'},ctx){
   const p=await read(ctx,id),out=`output/studio-mcp/rooms/${id}${format==='project'?'.room.json':'.glb'}`;
   if(format==='glb'&&!p.objects.some(o=>o.visible))throw Error('Add a visible object before GLB export.');
   if(format==='project')await ctx.repo.write(out,JSON.stringify(p));
   else{const page=await ctx.page(),data=await page.evaluate(async p=>{const M=await import('/johansson-town/src/studio/room-render.js'),P=await import('/johansson-town/src/studio/room-project.js');return P.encodeGLB(await M.exportRoom(p));},p);await ctx.repo.write(out,Buffer.from(data,'base64'));}
   return {path:out,revision:p.revision,objects:p.objects.length};
  }},
 {name:'room_check',idempotent:true,description:'Check the combined room draft for near-coplanar overlaps across its visible static objects. Reports partial coverage honestly. Native workshop drafts use their dedicated floor/collision/door/staff-route checks. Generic drafts do not validate gameplay. Never certifies the whole island.',input:obj({id:ID},['id']),
  async run({id},ctx){const p=await read(ctx,id),page=await ctx.page();return page.evaluate(async p=>(await import('/johansson-town/src/studio/room-render.js')).checkRoom(p),p);}},
 {name:'room_drop',idempotent:true,description:'Drop one visible room object vertically onto the highest static support below its footprint or the explicit room floor y=0. Uses five ray samples; contact check, not full physics or collision certification. Required revision; dry run by default.',input:obj({id:ID,object:ID,expectedRevision:REV,dryRun:DRY},['id','object','expectedRevision']),async run({id,object,expectedRevision,dryRun=true},ctx){const p=await read(ctx,id);if(p.revision!==expectedRevision)throw Error('Revision conflict. Read room_get first.');const page=await ctx.page(),result=await page.evaluate(async([p,id])=>(await import('/johansson-town/src/studio/room-render.js')).dropRoomObject(p,id),[p,object]);return {...await change(ctx,id,expectedRevision,[{op:'object.update',id:object,set:{position:result.position,support:'resting'}}],dryRun),support:result.report};}},
 {name:'room_render',idempotent:true,image:true,description:'Render a room draft as a PNG using Studio hero lighting. Inspect the picture after editing; it is a draft composition, not a screenshot of the live town.',input:obj({id:ID,size:{type:'integer',minimum:128,maximum:1200,default:700}},['id']),
  async run({id,size=700},ctx){const p=await read(ctx,id),page=await ctx.page();if(!p.objects.some(o=>o.visible))throw Error('Add a visible object before rendering.');
   const data=await page.evaluate(async([p,size])=>{const R=await import('/johansson-town/src/studio/room-render.js'),P=await import('/johansson-town/src/studio/room-project.js'),M=await import('/johansson-town/src/studio/model-workbench.js'),L=await import('/johansson-town/src/studio/modeller/look.js'),root=await R.buildRoom(p);try{return P.encodeGLB(await L.renderHero(root,{size}));}finally{M.disposeModel(root);}},[p,size]);
   const out=`output/studio-mcp/rooms/${id}.png`;await ctx.repo.write(out,Buffer.from(data,'base64'));return {image:data,mimeType:'image/png',data:{path:out,revision:p.revision,size}};
  }},
];
