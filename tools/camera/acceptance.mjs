// End-to-end: official MCP client -> stdio server -> actual Camera -> saved JPEG.
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {PNG} from 'pngjs';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';

const evidence=process.env.CAMERA_MCP_EVIDENCE_DIR;
if(evidence)await mkdir(evidence,{recursive:true});
const png=new PNG({width:320,height:240});
for(let y=0;y<240;y++)for(let x=0;x<320;x++){const i=(y*320+x)*4;png.data[i]=x%256;png.data[i+1]=y%256;png.data[i+2]=((x>>4)+(y>>4))%2?220:35;png.data[i+3]=255;}
const data=PNG.sync.write(png).toString('base64');
const root=fileURLToPath(new URL('../../../',import.meta.url)),registration=JSON.parse(await readFile(join(root,'.mcp.json'),'utf8')).mcpServers['johansson-camera'];
assert.equal(registration.command,'node');assert.deepEqual(registration.args,['johansson-town/tools/camera/server.mjs']);
const input=await mkdtemp(join(tmpdir(),'camera-mcp-approved-'));await writeFile(join(input,'test.png'),Buffer.from(data,'base64'));
const transport=new StdioClientTransport({command:process.execPath,args:registration.args.map(arg=>resolve(root,arg)),cwd:tmpdir(),env:{...process.env,CAMERA_MCP_INPUT_DIR:input},stderr:'pipe'});
let stderr='';transport.stderr?.on('data',chunk=>{stderr+=chunk;});
const client=new Client({name:'camera-mcp-acceptance',version:'1.0.0'}),report=[],exports=new Set();
const call=async(name,args={})=>{const result=await client.callTool({name,arguments:args},{timeout:120000});assert.notEqual(result.isError,true,JSON.stringify(result));return result;};
const json=async(name,args={})=>JSON.parse((await call(name,args)).content.find(c=>c.type==='text').text);
const rejected=async(name,args={})=>assert.equal((await client.callTool({name,arguments:args},{timeout:120000})).isError,true);
const check=async(name,fn)=>{await fn();report.push(name);console.log(`ok ${report.length} - ${name}`);};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
let failure;const started=new Date().toISOString();
try{
 await client.connect(transport,{timeout:30000});
 await check('MCP initialization and discovery expose eleven tools',async()=>assert.equal((await client.listTools()).tools.length,11));
 await check('calls before session open fail explicitly',()=>rejected('camera_state'));
 await check('actual Camera starts with working WebGL',async()=>assert.equal((await json('camera_open')).webgl,true));
 let catalog;
 await check('catalog reports actual app choices',async()=>{catalog=await json('camera_catalog');assert.ok(catalog.looks.length>=34);assert.ok(catalog.looks.some(l=>l.id==='crayon'));assert.ok(catalog.frames.length>1);});
 await check('approved image imports into the actual editor',async()=>{const s=await json('camera_import',{data,name:'mcp-test.png'});assert.equal(s.mode,'editor');assert.equal(s.editing.width,320);assert.equal(s.editing.height,240);});
 await check('replacement needs explicit discard and failed imports preserve the edit',async()=>{
  const before=await json('camera_state');await rejected('camera_import',{path:'test.png'});
  const large=Buffer.from(data,'base64');large.writeUInt32BE(8000,16);large.writeUInt32BE(6001,20);
  await rejected('camera_import',{data:large.toString('base64'),discard:true});await rejected('camera_import',{path:'../outside.png',discard:true});
  assert.deepEqual((await json('camera_state')).editing,before.editing);
 });
 await check('approved directory import uses the same real editor',async()=>{const s=await json('camera_import',{path:'test.png',discard:true});assert.equal(s.editing.width,320);assert.equal(s.editing.height,240);});
 await check('strict tool schema rejects arbitrary extra fields',()=>rejected('camera_state',{javascript:'return document.cookie'}));
 let beforePreview;
 await check('preview returns real PNG pixels',async()=>{const result=await call('camera_preview'),image=result.content.find(c=>c.type==='image');assert.equal(image.mimeType,'image/png');const bytes=Buffer.from(image.data,'base64'),picture=PNG.sync.read(bytes);assert.ok(picture.width>100&&picture.height>100);beforePreview=hash(bytes);if(evidence)await writeFile(join(evidence,'before.png'),bytes);});
 let edited;
 await check('three Looks, six adjustments, Enhance, crop, frame and paper use the editor',async()=>{
  const paper=catalog.papers.find(p=>p.id!=='none').id;
  const adjust={light:.15,contrast:.1,colour:.2,warmth:-.12,pattern:.1,detail:.14},frame=catalog.frames.find(f=>f.id==='print').id;
  edited=await json('camera_edit',{edit:{layers:[{look:'crayon',amount:.7},{look:'mono',amount:.3},{look:'sepia',amount:.1}],adjust,enhance:.65,paper,frame,crop:{x:.1,y:.1,w:.8,h:.8}}});
  assert.equal(edited.editing.recipe.layers.length,3);assert.deepEqual(edited.editing.recipe.adjust,adjust);assert.equal(edited.editing.recipe.frame,frame);assert.equal(edited.editing.recipe.enhance,.65);assert.equal(edited.editing.recipe.paper,paper);assert.deepEqual(edited.editing.recipe.crop,{x:.1,y:.1,w:.8,h:.8});
 });
 await check('invalid edits do not mutate the recipe',async()=>{await rejected('camera_edit',{edit:{crop:{x:.8,y:0,w:.5,h:1}}});assert.deepEqual((await json('camera_state')).editing.recipe,edited.editing.recipe);});
 await check('editing changes the rendered preview',async()=>{const result=await call('camera_preview'),bytes=Buffer.from(result.content.find(c=>c.type==='image').data,'base64');assert.notEqual(hash(bytes),beforePreview);if(evidence)await writeFile(join(evidence,'after.png'),bytes);});
 await check('Save requires explicit confirmation',()=>rejected('camera_save',{confirm:false}));
 let saved,firstExport;
 await check('Save uses the app JPEG pipeline',async()=>{saved=await json('camera_save',{confirm:true});assert.equal(saved.mimeType,'image/jpeg');assert.equal(saved.width,256);assert.equal(saved.height,192);assert.ok(saved.bytes>100);assert.equal((await json('camera_state')).mode,'viewer');});
 await check('album lists the new photo and recipe',async()=>assert.deepEqual((await json('camera_album')).find(s=>s.id===saved.id).recipe,saved.recipe));
 await check('Export preserves exact saved bytes without overwriting',async()=>{
  await rejected('camera_export',{id:saved.id,confirm:false});
  firstExport=await json('camera_export',{id:saved.id,confirm:true});exports.add(dirname(firstExport.path));
  const second=await json('camera_export',{id:saved.id,confirm:true});assert.notEqual(second.path,firstExport.path);assert.equal(second.sha256,firstExport.sha256);
  const bytes=await readFile(firstExport.path);assert.equal(hash(bytes),firstExport.sha256);assert.equal(bytes.length,saved.bytes);if(evidence)await writeFile(join(evidence,'saved.jpg'),bytes);
 });
 await check('re-edit uses original source and saves a separate copy',async()=>{
  const s=await json('camera_open_photo',{id:saved.id});assert.equal(s.editing.width,320);assert.deepEqual(s.editing.recipe,saved.recipe);
  await json('camera_edit',{edit:{enhance:0}});const copy=await json('camera_save',{confirm:true});assert.notEqual(copy.id,saved.id);
  const old=await json('camera_export',{id:saved.id,confirm:true});assert.equal(old.sha256,firstExport.sha256);
 });
 await check('browser reports no uncaught page errors',async()=>assert.deepEqual((await json('camera_state')).errors,[]));
 await check('close is explicit and preserves exported files',async()=>{
  await rejected('camera_close',{confirm:false});await json('camera_close',{confirm:true});await rejected('camera_state');assert.equal(hash(await readFile(firstExport.path)),firstExport.sha256);
 });
 await check('a fresh session cannot read the preceding temporary album',async()=>{
  await json('camera_open');await rejected('camera_open_photo',{id:saved.id});await json('camera_close',{confirm:true});
 });
 console.log(`PASS: ${report.length}/${report.length} real MCP/Camera acceptance checks`);
}catch(error){failure=error;throw error;
}finally{
 await client.close();
 if(evidence){await writeFile(join(evidence,'results.json'),JSON.stringify({status:failure?'failed':'passed',started,finished:new Date().toISOString(),connection:{host:'Official SDK acceptance client; not the owner\'s installed MCP host',registration:'.mcp.json#mcpServers.johansson-camera',cwd:tmpdir()},passed:report.length,checks:report,error:failure?.message,stderr},null,2));}
 await rm(input,{recursive:true,force:true});
 for(const dir of exports)await rm(dir,{recursive:true,force:true});
}
