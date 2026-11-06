import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import vm from 'node:vm';

const execute=promisify(execFile),generator=await readFile(new URL('../tools/render-resident-guide.mjs',import.meta.url));
const sourceFiles=['guide/residents.json','src/avatars/build.js'];
const guide=rows=>JSON.stringify(rows,null,1)+'\n';
const hash=(guideBytes,visual)=>createHash('sha256').update(sourceFiles[0]+'\0').update(guideBytes).update('\0').update(sourceFiles[1]+'\0').update(visual).update('\0').digest('hex');
async function fixture(t){
 const root=await mkdtemp(join(tmpdir(),'resident-catalogue-'));t.after(()=>rm(root,{recursive:true,force:true}));
 for(const path of ['tools','guide','src/avatars','portraits'])await mkdir(join(root,path),{recursive:true});
 const old=[{name:'Keep',portrait:'portraits/keep.webp',bio:'Old text'},{name:'Retire',portrait:'portraits/retire.webp'}];
 const current=[{...old[0],bio:'Current text'}],visual='unchanged avatar pipeline\n',sha256=hash(guide(old),visual);
 const manifest={sourceFiles,sha256,count:2};
 for(const [path,bytes] of [['tools/render-resident-guide.mjs',generator],['guide/residents.json',guide(current)],
  ['resident-guide.js','window.JOHANSSON_RESIDENT_GUIDE = '+JSON.stringify(old)+';\n'],['guide/portraits.json',JSON.stringify(manifest,null,2)+'\n'],
  ['src/avatars/build.js',visual],['portraits/keep.webp','retained image bytes'],['portraits/retire.webp','retired image bytes']])await writeFile(join(root,path),bytes);
 const outputs=async()=>Promise.all(['resident-guide.js','guide/portraits.json'].map(path=>readFile(join(root,path),'utf8')));
 return {root,old,current,visual,manifest,outputs,run:()=>execute(process.execPath,[join(root,'tools/render-resident-guide.mjs'),'--catalogue-only'],
  {timeout:5000,env:{...process.env,CODEX_PRIMARY_RUNTIME_NODE_MODULES:join(root,'no-browser-tools')}})};
}

test('catalogue-only retains unchanged portrait files and prior proof, without browser tools, and is idempotent',async t=>{
 const f=await fixture(t),result=await f.run(),[js,metadata]=await f.outputs(),context={window:{}};
 assert.match(result.stdout,/no rendering/);vm.runInNewContext(js,context);
 assert.deepEqual(JSON.parse(JSON.stringify(context.window.JOHANSSON_RESIDENT_GUIDE)),f.current);
 const manifest=JSON.parse(metadata);assert.equal(manifest.count,1);assert.equal(manifest.sha256,hash(guide(f.current),f.visual));
 assert.deepEqual(manifest.retainedPortraits,{previousSha256:f.manifest.sha256,previousCount:2,count:1,rendered:0});
 assert.equal(await readFile(join(f.root,'portraits/keep.webp'),'utf8'),'retained image bytes');
 assert.equal(await readFile(join(f.root,'portraits/retire.webp'),'utf8'),'retired image bytes','mode does not delete or alter images');
 assert.match((await f.run()).stdout,/already current/);assert.deepEqual(await f.outputs(),[js,metadata],'retained provenance is not rewritten');
});

test('a changed visual source rejects catalogue-only before either output is written',async t=>{
 const f=await fixture(t),before=await f.outputs();await writeFile(join(f.root,'src/avatars/build.js'),'changed visual source\n');
 await assert.rejects(f.run(),error=>/visual sources changed.*real renderer/.test(error.stderr));
 assert.deepEqual(await f.outputs(),before);
});

test('new names, changed portrait paths and invalid previous counts cannot claim retained rendering',async t=>{
 for(const kind of ['new-name','new-path','bad-count'])await t.test(kind,async t=>{
  const f=await fixture(t),before=await f.outputs();
  if(kind==='bad-count')await writeFile(join(f.root,'guide/portraits.json'),JSON.stringify({...f.manifest,count:3}));
  else await writeFile(join(f.root,'guide/residents.json'),guide([{...f.current[0],...(kind==='new-name'?{name:'New'}:{portrait:'portraits/new.webp'})}]));
  const protectedOutputs=kind==='bad-count'?await f.outputs():before;
  await assert.rejects(f.run(),error=>/real renderer/.test(error.stderr));assert.deepEqual(await f.outputs(),protectedOutputs);
 });
});
