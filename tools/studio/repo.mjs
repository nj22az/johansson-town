import {fileURLToPath} from 'node:url';
import {resolve,relative,dirname,sep,posix} from 'node:path';
import {lstat,realpath,readFile,writeFile,rename,unlink,mkdir,readdir,stat} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';

/**
 * Where Johansson Studio's tools may read and write, and the only way they write.
 *
 * - The repository is found from this file (johansson-town/tools/studio/ → three folders up). JOHANSSON_STUDIO_ROOT
 *   moves it only inside `node --test` (NODE_TEST_CONTEXT), so a stray variable can never point the tools elsewhere.
 * - A write is allowed only to the paths below; anything else, a path that climbs out ("..") or a symbolic link
 *   anywhere on the way is refused. Every target is checked again with realpath and lstat just before writing.
 * - writeAll writes every new file to a temporary file beside its target first, and renames them over their targets
 *   only once all of them are on disk: a reader never sees half a file, and a full disk or a refused path never leaves
 *   half a change behind.
 * - locked runs a read, its checks and its writes as one step for every process on this checkout (each Claude
 *   session's johansson-studio server, cli.mjs, apply.mjs), with a lock file; serial orders the steps of one process.
 * - Nothing here writes .mcp.json, settings, workflows, code or git, and nothing commits.
 */
export const CODE_ROOT=resolve(fileURLToPath(new URL('../../../',import.meta.url)));
export function defaultRoot(){
 const forTests=process.env.NODE_TEST_CONTEXT&&process.env.JOHANSSON_STUDIO_ROOT;
 return resolve(forTests||CODE_ROOT);
}

export const PATHS=Object.freeze({
 // World's data (in git): written only by publishing the draft, when the creator says "update World".
 looks:'johansson-town/data/studio/looks.json',
 products:'johansson-town/data/studio/products.json',
 log:'johansson-town/data/studio/log.json',
 looksModule:'johansson-town/src/avatars/looks-data.js',
 charactersModule:'johansson-town/src/studio/characters-data.js',
 productsModule:'johansson-town/src/commerce/products-data.js',
 // Studio's draft (git ignores it): the changes the creator said yes to, not yet published.
 draft:'johansson-town/data/studio/draft/pending.json',
 lock:'johansson-town/data/studio/.lock',
 brands:'johansson-town/data/studio/brand-rules.json',
 output:'output/studio-mcp',
});
const ROOM_PROJECT=/^johansson-town\/data\/studio\/projects\/[a-z][a-z0-9-]{0,47}\.room\.json$/;
const WRITABLE=['johansson-town/data/studio/rooms/dock-workshop.json','johansson-town/src/world/interiors/workshop-publication.js','johansson-town/data/studio/world-library-review.json','johansson-town/src/catalog/catalog-data.js',PATHS.looks,PATHS.products,PATHS.log,PATHS.draft,PATHS.looksModule,PATHS.charactersModule,PATHS.productsModule];
const LABEL=/^johansson-town\/assets\/graphics\/labels\/[a-z][a-z0-9-]{1,39}\.r[1-9][0-9]{0,3}\.webp$/;
const OUTPUT=/^output\/studio-mcp\/(?:[a-z0-9][a-z0-9._-]{0,80}\/){0,3}[a-z0-9][a-z0-9._-]{0,120}\.(png|webp|json|txt|glb|stl)$/;
// Assets made in Studio (tools/studio/assets.mjs): held in the draft until "update World", then World's catalogue.
const DRAFT_ASSET=/^johansson-town\/data\/studio\/draft\/assets\/[a-z0-9][a-z0-9-]{1,47}\/(model\.glb|asset\.json|hero\.png|package\.json)$/;
const CATALOG_ASSET=/^johansson-town\/assets\/catalog\/([a-z0-9][a-z0-9-]{1,47}\/(model\.glb|asset\.json|hero\.png)|index\.json)$/;
export const OUTPUT_CAP=50*1024*1024;

/** Is this repository-relative path one Studio may write? (Checked before anything touches the disk.) */
export function writable(path){
 if(typeof path!=='string'||path.includes('\\')||path.includes('\0'))return false;
 const clean=posix.normalize(path);
 if(clean!==path||clean.startsWith('/')||clean.split('/').some(part=>part==='..'||part==='.'||part===''))return false;
 return WRITABLE.includes(clean)||ROOM_PROJECT.test(clean)||LABEL.test(clean)||DRAFT_ASSET.test(clean)||CATALOG_ASSET.test(clean)||(OUTPUT.test(clean)&&!clean.split('/').some(p=>p.startsWith('.')));
}

let queue=Promise.resolve();
/** Run a task after every earlier one of this process has finished. */
export function serial(task){const run=queue.then(task);queue=run.catch(()=>{});return run;}

/** How long a writer waits for the lock, when a lock counts as left behind, and how often to look again (ms). */
export const LOCK=Object.freeze({wait:20000,stale:60000,poll:50});
const alive=pid=>{try{process.kill(pid,0);return true;}catch(e){return e.code==='EPERM';}};

export function openRepo(root=defaultRoot()){
 root=resolve(root);
 const abs=path=>resolve(root,path);
 /** Refuses a path unless every folder on the way is a real folder inside the repository and the file is no link. */
 async function guard(path,{create=false}={}){
  if(!writable(path))throw Error(`Studio may not write ${JSON.stringify(path)}: only its data files, its generated modules, label pictures, drafted and catalogue assets and output/studio-mcp are writable.`);
  const realRoot=await realpath(root),target=abs(path);
  let folder=dirname(target);
  if(create)await mkdirInside(realRoot,relative(root,folder));
  const realFolder=await realpath(folder);
  if(realFolder!==resolve(realRoot,relative(root,folder)))throw Error(`Studio will not write ${path}: a folder on the way is a link to somewhere else.`);
  const info=await lstat(target).catch(()=>null);
  if(info&&!info.isFile())throw Error(`Studio will not write ${path}: it is ${info.isSymbolicLink()?'a link to another file':'not an ordinary file'}.`);
  return target;
 }
 /** Make folders one at a time, refusing any that is (or becomes) a link. */
 async function mkdirInside(realRoot,folder){
  let at=realRoot;
  for(const part of folder.split(sep).filter(Boolean)){
   at=resolve(at,part);
   const info=await lstat(at).catch(()=>null);
   if(!info)await mkdir(at).catch(e=>{if(e.code!=='EEXIST')throw e;});
   else if(!info.isDirectory())throw Error(`Studio will not write inside ${relative(realRoot,at)}: it is ${info.isSymbolicLink()?'a link':'not a folder'}.`);
  }
 }
 /**
  * Write several files as one step. Every target is checked, every new content goes to a temporary file beside its
  * target, and only when all of them are on disk are they renamed over their targets, in the order given. A refused
  * path or a full disk before the renames removes the temporary files and leaves every target as it was.
  */
 async function writeAll(entries){
  const staged=[];
  try{
   for(const [path] of entries)await guard(path,{create:true});
   for(const [path,content] of entries){
    const target=abs(path),temporary=`${target}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
    staged.push({path,target,temporary});
    await writeFile(temporary,content,{flag:'wx'});
   }
   for(const s of staged)await guard(s.path);
  }catch(e){await Promise.all(staged.map(s=>unlink(s.temporary).catch(()=>{})));throw e;}
  for(let i=0;i<staged.length;i++){
   try{await rename(staged[i].temporary,staged[i].target);}
   catch(e){await Promise.all(staged.slice(i).map(s=>unlink(s.temporary).catch(()=>{})));throw e;}
  }
  if(entries.some(([path])=>path.startsWith(PATHS.output+'/')))await capOutput();
  return entries.map(([path])=>path);
 }
 const write=(path,content)=>writeAll([[path,content]]).then(()=>path);
 /**
  * Run a task holding Studio's write lock (data/studio/.lock), so its reads, checks and writes are one step for every
  * process on this checkout. A lock whose process has ended, or that is over a minute old, was left behind and is
  * taken over. Not re-entrant: a task never takes the lock again.
  */
 async function locked(task){
  const lock=abs(PATHS.lock),mine=`${process.pid} ${Date.now()} ${randomBytes(6).toString('hex')}\n`,started=Date.now();
  for(;;){
   try{await writeFile(lock,mine,{flag:'wx'});break;}
   catch(e){
    if(e.code!=='EEXIST')throw e;
    if(await leftBehind(lock))continue;
    if(Date.now()-started>LOCK.wait)throw Error('Another Studio tool is writing Studio\'s data right now; call again in a moment.');
    await new Promise(r=>setTimeout(r,LOCK.poll));
   }
  }
  try{return await task();}
  finally{if(await readFile(lock,'utf8').catch(()=>null)===mine)await unlink(lock).catch(()=>{});}
 }
 /** Removes a lock that was left behind (its process has ended, or it is too old). True when the lock is gone. */
 async function leftBehind(lock){
  const [text,info]=await Promise.all([readFile(lock,'utf8').catch(()=>null),lstat(lock).catch(()=>null)]);
  if(text===null||!info)return true;
  const pid=Number(text.split(' ')[0]);
  // Exclusive creation makes the file visible before writeFile fills in its owner.
  // A contender must wait for that fresh empty file, rather than delete a lock
  // whose owner is still writing its token. Malformed abandoned files age out.
  if((!Number.isInteger(pid)||pid<=0)&&Date.now()-info.mtimeMs<LOCK.stale)return false;
  if(Number.isInteger(pid)&&pid>0&&alive(pid)&&Date.now()-info.mtimeMs<LOCK.stale)return false;
  // Only one process clears a left-behind lock, holding the breaker (lock.break): otherwise two can both see it as
  // left behind, one clears it and takes the lock, and the other then deletes that new lock and writes alongside it.
  // While the breaker is held nobody else can delete the lock, and nobody can take it until it is gone, so the check
  // and the delete below are one step. A breaker over the stale age was itself left behind and is cleared.
  const breaker=lock+'.break';
  try{await writeFile(breaker,`${process.pid} ${Date.now()}\n`,{flag:'wx'});}
  catch(e){
   if(e.code!=='EEXIST')throw e;
   const held=await lstat(breaker).catch(()=>null);if(held&&Date.now()-held.mtimeMs>LOCK.stale)await unlink(breaker).catch(()=>{});
   return false;
  }
  try{if(await readFile(lock,'utf8').catch(()=>null)===text)await unlink(lock).catch(()=>{});}
  finally{await unlink(breaker).catch(()=>{});}
  return true;
 }
 async function read(path,encoding='utf8'){
  const target=abs(path),info=await lstat(target);
  if(info.isSymbolicLink())throw Error(`Studio will not read ${path}: it is a link to another file.`);
  return readFile(target,encoding);
 }
 const readJSON=async path=>JSON.parse(await read(path));
 const exists=path=>lstat(abs(path)).then(()=>true,()=>false);
 /** Removes a file Studio may write (a drafted asset once published or discarded); a missing file is no error. */
 async function remove(path){const target=await guard(path);await unlink(target).catch(e=>{if(e.code!=='ENOENT')throw e;});return path;}
 /** output/studio-mcp stays under 50 MB: the oldest files go first. */
 async function capOutput(){
  const files=[];
  async function scan(folder){for(const entry of await readdir(folder,{withFileTypes:true}).catch(()=>[])){const p=resolve(folder,entry.name);
   if(entry.isDirectory())await scan(p);else if(entry.isFile()){const s=await stat(p);files.push({p,size:s.size,time:s.mtimeMs});}}}
  await scan(abs(PATHS.output));
  let total=files.reduce((a,f)=>a+f.size,0);
  for(const f of files.sort((a,b)=>a.time-b.time)){if(total<=OUTPUT_CAP)break;await unlink(f.p).catch(()=>{});total-=f.size;}
 }
 return {root,abs,guard,write,writeAll,locked,read,readJSON,exists,remove,capOutput};
}

/** JSON as Studio writes it: two spaces and a newline at the end, so the same data is always the same bytes. */
export const jsonText=data=>JSON.stringify(data,null,2)+'\n';
