import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,symlink,rm} from 'node:fs/promises';
import {PassThrough} from 'node:stream';
import {request} from 'node:http';
import {Client,InMemoryTransport} from '@modelcontextprotocol/client';
import {StdioServerTransport} from '@modelcontextprotocol/server/stdio';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {decodeImage,imageType,imageInfo,readImage,validateEdit,MAX_IMAGE_BYTES} from './policy.mjs';
import {TOOLS,callTool} from './tools.mjs';
import {CameraSession} from './session.mjs';
import {serveCamera} from './preview.mjs';
import {createCameraServer} from './server.mjs';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');
const catalog={looks:[{id:'none'},{id:'crayon'}],papers:[{id:'none'}],frames:[{id:'none'}]};
test('strict image bytes and bounded payloads',()=>{
 assert.equal(decodeImage(png.toString('base64')).mimeType,'image/png');
 for(const value of ['https://example.com/image.png','data:image/png;base64,'+png.toString('base64'),'abcd=','<svg/>'])assert.throws(()=>decodeImage(value));
 assert.throws(()=>imageType(Buffer.alloc(MAX_IMAGE_BYTES+1)));
 assert.throws(()=>imageType(Buffer.from('<svg>not an approved image</svg>')));
});
test('original PNG, JPEG and WebP dimensions are checked before app downscaling',()=>{
 assert.deepEqual(imageInfo(png),{mimeType:'image/png',width:1,height:1});
 const large=Buffer.from(png);large.writeUInt32BE(8000,16);large.writeUInt32BE(6001,20);
 assert.throws(()=>decodeImage(large.toString('base64')),/48 megapixels/);
 large.writeUInt32BE(6000,20);assert.equal(imageInfo(large).width,8000);
 const jpeg=Buffer.from([255,216,255,224,0,4,0,0,255,194,0,8,8,0,100,0,200,1]);
 assert.deepEqual(imageInfo(jpeg),{mimeType:'image/jpeg',width:200,height:100});
 jpeg.writeUInt16BE(8000,13);jpeg.writeUInt16BE(6001,15);assert.throws(()=>imageInfo(jpeg),/48 megapixels/);
 for(const kind of ['VP8X','VP8 ','VP8L']){
  const bytes=Buffer.alloc(30);bytes.write('RIFF');bytes.writeUInt32LE(22,4);bytes.write('WEBP',8);bytes.write(kind,12);bytes.writeUInt32LE(10,16);
  if(kind==='VP8X'){bytes.writeUIntLE(199,24,3);bytes.writeUIntLE(99,27,3);}
  if(kind==='VP8 '){Buffer.from('9d012a','hex').copy(bytes,23);bytes.writeUInt16LE(200,26);bytes.writeUInt16LE(100,28);}
  if(kind==='VP8L'){bytes[20]=0x2f;bytes.writeUInt32LE(199|(99<<14),21);}
  assert.deepEqual(imageInfo(bytes),{mimeType:'image/webp',width:200,height:100});
 }
 for(const bytes of [png.subarray(0,20),jpeg.subarray(0,12),Buffer.from('RIFF0000WEBP')])assert.throws(()=>imageInfo(bytes));
});
test('imports stay inside the approved folder, including symlinks',async()=>{
 const root=await mkdtemp(join(tmpdir(),'camera-policy-'));try{
  const input=join(root,'in');await mkdir(input);await writeFile(join(input,'image.png'),png);await writeFile(join(root,'outside.png'),png);
  assert.equal((await readImage(input,'image.png')).mimeType,'image/png');
  await assert.rejects(readImage(input,'../outside.png'),/outside/);
  await symlink(join(root,'outside.png'),join(input,'linked.png'));await assert.rejects(readImage(input,'linked.png'),/outside/);
  const large=Buffer.from(png);large.writeUInt32BE(8000,16);large.writeUInt32BE(6001,20);await writeFile(join(input,'large.png'),large);
  await assert.rejects(readImage(input,'large.png'),/48 megapixels/);
  await assert.rejects(readImage(null,'image.png'),/CAMERA_MCP_INPUT_DIR/);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('Camera preview serves only public app resources and rejects foreign hosts, origins and symlinks',async()=>{
 const root=await mkdtemp(join(tmpdir(),'camera-preview-'));let preview;
 try{
  await mkdir(join(root,'camera','samples'),{recursive:true});await mkdir(join(root,'johansson-town','node_modules'),{recursive:true});
  await writeFile(join(root,'camera','index.html'),'<p>Camera fixture</p>');await writeFile(join(root,'camera','samples','ok.png'),png);
  await writeFile(join(root,'camera','.private.js'),'private fixture');await writeFile(join(root,'johansson-town','node_modules','private.js'),'dependency fixture');
  await writeFile(join(root,'outside.png'),png);await symlink(join(root,'outside.png'),join(root,'camera','samples','linked.png'));
  preview=await serveCamera({root});const url=new URL('camera/',preview.url);
  const response=await fetch(url);assert.equal(response.status,200);assert.equal(await response.text(),'<p>Camera fixture</p>');
  const picture=await fetch(new URL('camera/samples/ok.png',preview.url));assert.equal(picture.status,200);await picture.arrayBuffer();
  assert.equal(response.headers.get('cross-origin-resource-policy'),'same-origin');
  const foreignHost=await new Promise((resolve,reject)=>{const req=request(url,{headers:{Host:'untrusted.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();});
  assert.equal(foreignHost,403);
  assert.equal((await fetch(url,{headers:{Origin:'https://untrusted.example'}})).status,403);
  assert.equal((await fetch(url,{headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);
  assert.equal((await fetch(url,{method:'POST'})).status,405);
  for(const path of ['camera/.private.js','camera/samples/linked.png','johansson-town/node_modules/private.js','AGENTS.md'])assert.equal((await fetch(new URL(path,preview.url))).status,404,path);
 }finally{await preview?.close();await rm(root,{recursive:true,force:true});}
});
test('Camera preview permits only the exact bundled face-finder assets with their own MIME types',async()=>{
 const root=await mkdtemp(join(tmpdir(),'camera-detector-preview-'));let preview;
 const assets=[
  ['vision_bundle.js','text/javascript',Buffer.from('self.exports={fixture:true};')],
  ['vision_wasm_internal.js','text/javascript',Buffer.from('/* loader fixture */')],
  ['vision_wasm_internal.wasm','application/wasm',Buffer.from([0,97,115,109,1,0,0,0])],
  ['face_landmarker.task','application/octet-stream',Buffer.from([0,127,128,255,10,0])],
  ['NOTICE.txt','text/plain',Buffer.from('Face finder fixture provenance')],
  ['MEDIAPIPE-LICENSE.txt','text/plain',Buffer.from('Apache fixture licence')],
 ];
 try{
  const vendor=join(root,'camera','vendor','mediapipe');await mkdir(vendor,{recursive:true});await mkdir(join(root,'camera','samples'));
  for(const [name,,bytes] of assets)await writeFile(join(vendor,name),bytes);
  for(const name of ['private.js','.private.js','other.bin'])await writeFile(join(vendor,name),'private fixture');await writeFile(join(root,'camera','vendor','private.js'),'private fixture');
  await writeFile(join(root,'camera','elsewhere.bin'),'private binary');await writeFile(join(root,'camera','samples','elsewhere.bin'),'private binary');
  await writeFile(join(root,'outside.bin'),'outside fixture');
  preview=await serveCamera({root});
  for(const [name,mime,bytes] of assets){
   const response=await fetch(new URL('camera/vendor/mediapipe/'+name,preview.url));
   assert.equal(response.status,200,name);assert.equal(response.headers.get('content-type'),mime,name);
   assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('cache-control'),'no-store');
   assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes,name);
   const head=await fetch(new URL('camera/vendor/mediapipe/'+name,preview.url),{method:'HEAD'});
   assert.equal(head.status,200,name);assert.equal(head.headers.get('content-type'),mime,name);assert.equal((await head.arrayBuffer()).byteLength,0);
  }
  for(const path of ['camera/vendor/private.js','camera/vendor/.private.js','camera/vendor/other.bin','camera/vendor/mediapipe/private.js','camera/elsewhere.bin','camera/samples/elsewhere.bin']){
   assert.equal((await fetch(new URL(path,preview.url))).status,404,path);
  }
  // An allowlisted name still cannot expose a link outside the public app resources.
  await rm(join(vendor,'face_landmarker.task'));await symlink(join(root,'outside.bin'),join(vendor,'face_landmarker.task'));
  assert.equal((await fetch(new URL('camera/vendor/mediapipe/face_landmarker.task',preview.url))).status,404);
 }finally{await preview?.close();await rm(root,{recursive:true,force:true});}
});
test('valid edit preserves explicit values',()=>{
 const edit={layers:[{look:'crayon',amount:.65}],adjust:{light:-.2},enhance:0,paper:'none',frame:'none',crop:{x:.1,y:.2,w:.8,h:.7}};
 assert.equal(validateEdit(edit,catalog),edit);
});
test('all invalid edits fail before browser mutation',()=>{
 for(const edit of [{},{foo:1},{layers:[]},{layers:[{look:'invented',amount:1}]},{layers:[{look:'none',amount:NaN}]},{layers:Array(4).fill({look:'none',amount:1})},{adjust:{exposure:1}},{enhance:2},{paper:'alien'},{frame:'alien'},{crop:{x:.9,y:0,w:.2,h:1}},{crop:{x:0,y:0,w:0,h:1}},{crop:{x:0,y:0,w:1}}])assert.throws(()=>validateEdit(edit,catalog));
});
test('tool catalog has strict schemas and no capture/share/delete/eval tools',()=>{
 assert.equal(TOOLS.length,11);assert.equal(new Set(TOOLS.map(t=>t.name)).size,11);
 for(const tool of TOOLS){assert.equal(tool.input.additionalProperties,false);assert.ok(tool.description);}
 assert.ok(!TOOLS.some(t=>/capture|share|delete|eval|publish/.test(t.name)));
});
test('close requires explicit confirmation; dispatch unwraps edits',async()=>{
 let called=false;const session={close:async()=>{called=true;},edit:async e=>e};
 await assert.rejects(callTool('camera_close',{},session),/confirm/);assert.equal(called,false);
 await callTool('camera_close',{confirm:true},session);assert.equal(called,true);
 assert.deepEqual(await callTool('camera_edit',{edit:{enhance:.4}},session),{enhance:.4});
 await assert.rejects(callTool('unknown',{},session),/Unknown/);
});
test('save/export confirmation fails without touching a browser',async()=>{
 const s=new CameraSession();await assert.rejects(s.save(),/confirm/);await assert.rejects(s.exportPhoto({id:'x'}),/confirm/);
 await assert.rejects(s.state(),/camera_open/);await assert.rejects(s.requireEditor(),/camera_open/);
});
test('startup failure closes the preview',async()=>{
 let closed=0;const s=new CameraSession({serve:async()=>({url:'http://127.0.0.1:1234/',close:async()=>{closed++;}}),launch:async()=>{throw Error('launch failed');}});
 await assert.rejects(s.open(),/launch failed/);assert.ok(closed);assert.equal(s.page,null);
});
test('cancellation during launch closes the late browser',async()=>{
 let release,closed=0;const pending=new Promise(resolve=>{release=resolve;});
 const s=new CameraSession({serve:async()=>({url:'http://127.0.0.1:1234/',close:async()=>{}}),launch:()=>pending});
 const opened=s.open();await new Promise(resolve=>setImmediate(resolve));await s.close();
 release({close:async()=>{closed++;}});await assert.rejects(opened,/cancelled/);assert.ok(closed);assert.equal(s.page,null);
});
test('official MCP client serializes edits and honours active-request cancellation',async()=>{
 let release,entered,closed;const started=new Promise(resolve=>{entered=resolve;}),stopped=new Promise(resolve=>{closed=resolve;});
 let active=0,maximum=0;
 const session={state:async()=>{active++;maximum=Math.max(maximum,active);entered();await new Promise(resolve=>{release=resolve;});active--;return {};},catalog:async()=>{active++;maximum=Math.max(maximum,active);active--;return {};},close:async()=>{release?.();closed();}};
 const {server,shutdown}=createCameraServer(session),client=new Client({name:'camera-policy',version:'1.0.0'}),[a,b]=InMemoryTransport.createLinkedPair();
 try{
  await server.connect(b);await client.connect(a);
  const controller=new AbortController(),request=client.callTool({name:'camera_state',arguments:{}},{signal:controller.signal});
  const rejected=assert.rejects(request);await started;
  const queued=client.callTool({name:'camera_catalog',arguments:{}});
  controller.abort();await rejected;await stopped;await queued;assert.equal(maximum,1);
 }finally{await client.close();await shutdown();}
});
test('a transport buffer error closes the isolated session',async()=>{
 let closed;const stopped=new Promise(resolve=>{closed=resolve;}),input=new PassThrough(),output=new PassThrough();
 const {server,shutdown}=createCameraServer({close:async()=>closed()});
 try{await server.connect(new StdioServerTransport(input,output,{maxBufferSize:64}));input.write(Buffer.alloc(100));await stopped;}
 finally{await shutdown();input.destroy();output.destroy();}
});
test('stdio accepts base64 imports larger than the SDK default 10 MiB buffer',async()=>{
 const client=new Client({name:'camera-large-payload',version:'1.0.0'}),transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./server.mjs',import.meta.url))],stderr:'pipe'});
 try{
  await client.connect(transport);
  const data=Buffer.concat([png,Buffer.alloc(8*1024*1024)]).toString('base64');
  const result=await client.callTool({name:'camera_import',arguments:{data}},{timeout:10000});
  assert.equal(result.isError,true);assert.match(result.content[0].text,/camera_open/);
  assert.equal((await client.listTools()).tools.length,11);
 }finally{await client.close();}
});
test('adapter import cache keys match the Camera app',async()=>{
 const app=await readFile(new URL('../../../camera/app.js',import.meta.url),'utf8'),session=await readFile(new URL('./session.mjs',import.meta.url),'utf8');
 for(const name of ['looks-gl','frames','album']){
  const specifier=app.match(new RegExp("from '\\./("+name+"\\.js\\?[^']+)'"))?.[1];
  assert.ok(specifier);assert.ok(session.includes('/camera/'+specifier),`Adapter cache key differs: ${name}`);
 }
});
