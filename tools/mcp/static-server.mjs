import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';

const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary','.wasm':'application/wasm','.mp4':'video/mp4','.mp3':'audio/mpeg','.woff2':'font/woff2'};

/**
 * A private, ephemeral loopback preview of this game's compiled checkout.
 * serveGame(root) serves the game folder at /johansson-town/ (the audit server's preview).
 * serveGame({root, mounts}) serves a repository root, but only the listed top-level folders, each at its own name
 * (Johansson Studio's agent page: mounts ['johansson-town','avatar-creator']); anything else is not found.
 */
export async function serveGame(root,options={}){
 const {mounts=null}=root&&typeof root==='object'?root:options;
 root=resolve(root&&typeof root==='object'?root.root:root);
 const locate=pathname=>{
  if(!mounts){const relative=pathname.replace(/^\/johansson-town\/?/,'');return {base:root,file:resolve(root,relative==='/'||relative===''?'index.html':relative.replace(/^\//,''))};}
  const mount=mounts.find(m=>pathname===`/${m}`||pathname.startsWith(`/${m}/`));if(!mount)return null;
  const base=resolve(root,mount),rest=pathname.slice(mount.length+2);
  return {base,file:resolve(base,rest===''||rest.endsWith('/')?rest+'index.html':rest)};
 };
 const server=createServer(async(req,res)=>{
  try{
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
   const url=new URL(req.url,'http://127.0.0.1'),found=locate(decodeURIComponent(url.pathname));
   if(!found){res.writeHead(404);res.end();return;}
   const {base,file}=found;
   if(!file.startsWith(base+sep)){res.writeHead(403);res.end();return;}
   const info=await stat(file);if(!info.isFile()){res.writeHead(404);res.end();return;}
   let start=0,end=info.size-1,status=200;const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
   if(range){start=Number(range[1]);end=range[2]?Math.min(end,Number(range[2])):end;if(start>end){res.writeHead(416);res.end();return;}status=206;}
   res.writeHead(status,{'Content-Type':TYPES[extname(file)]||'application/octet-stream','Content-Length':end-start+1,'Cache-Control':'no-store','Accept-Ranges':'bytes',...(status===206?{'Content-Range':`bytes ${start}-${end}/${info.size}`}:{})});
   if(req.method==='HEAD'){res.end();return;}createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 return {url:`http://127.0.0.1:${server.address().port}/${mounts?'':'johansson-town/'}`,close:()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();})};
}
