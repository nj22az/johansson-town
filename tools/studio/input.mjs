import {realpath,stat,readFile} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
/** Bounded repository-local input, with no traversal or symbolic links. */
export async function studioInput(repo,file,{suffix,limit}){
 if(typeof file!=='string'||file.startsWith('/')||file.includes('\\')||file.includes('\0')||file.split('/').some(p=>p==='..'||p==='.'||!p)||!file.endsWith(suffix))throw Error('Give a repository-relative '+suffix+' path without traversal.');
 const root=await realpath(repo.root),path=resolve(root,file),actual=await realpath(path),rel=relative(root,actual);
 if(actual!==path||rel==='..'||rel.startsWith('..'+sep))throw Error('Input must be inside this checkout without symlinks.');
 const info=await stat(path);if(!info.isFile()||info.size>limit)throw Error('Input exceeds the permitted file size.');return readFile(path);
}
