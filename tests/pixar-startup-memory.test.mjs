import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {setImmediate as tick} from 'node:timers/promises';

test('startup loads all six full Pixar bodies with at most two simultaneous model decodes',async()=>{
 const url=new URL('../src/avatars/pixar.js',import.meta.url);
 let source=await readFile(url,'utf8');
 source=source.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_,a,path,b)=>a+new URL(path,url).href+b);
 const fake='data:text/javascript;base64,'+Buffer.from('export class GLTFLoader {loadAsync(url){return globalThis.__PIXAR_TEST_LOAD__(url);}}').toString('base64');
 source=source.replace(/import \{GLTFLoader\} from '[^']+';/,'import {GLTFLoader} from '+JSON.stringify(fake)+';');
 source+='\n//# sourceURL=pixar-startup-memory-fixture.js\n';
 const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const names=Object.keys(module.PIXAR_BODIES),byPath=Object.fromEntries(Object.entries(module.PIXAR_BODIES).map(([name,spec])=>[spec.path.split('/').at(-1),name]));
 const originalFetch=globalThis.fetch,originalLoader=globalThis.__PIXAR_TEST_LOAD__,originalDocument=globalThis.document;
 const pending=[],began=[];let active=0,peak=0;
 const scene={updateMatrixWorld(){},traverse(fn){for(const name of ['body','eyes'])fn({isSkinnedMesh:true,skeleton:{bones:[]},material:{name},geometry:{}});}};
 globalThis.document={baseURI:'https://example.test/johansson-town/'};
 globalThis.fetch=async url=>({json:async()=>({name:byPath[String(url).match(/\/([^/]+)\.json/)[1]],rest:{head:[0,0,0]},measure:{}})});
 globalThis.__PIXAR_TEST_LOAD__=async url=>{
  began.push(String(url));peak=Math.max(peak,++active);
  await new Promise(resolve=>pending.push(resolve));active--;return {scene};
 };
 try{
  const loading=module.loadPixarBodies({search:'',timeout:5000});
  await tick();assert.equal(began.length,2,'Do not start six large decoder jobs together');
  pending.shift()();await tick();assert.equal(began.length,3,'A finished decode admits the next resident');
  while(began.length<names.length||active){while(pending.length)pending.shift()();await tick();}
  assert.deepEqual((await loading).sort(),names.sort(),'Every approved full model is ready before the town builds');
  assert.equal(peak,2);
 }finally{while(pending.length)pending.shift()();globalThis.fetch=originalFetch;
  if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;
  if(originalLoader===undefined)delete globalThis.__PIXAR_TEST_LOAD__;else globalThis.__PIXAR_TEST_LOAD__=originalLoader;
 }
});
