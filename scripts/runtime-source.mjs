import {readFile,readdir} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';

export async function runtimeSourceHash(root){
 const files=[];
 async function scan(folder){for(const entry of await readdir(folder,{withFileTypes:true})){const path=resolve(folder,entry.name);if(entry.isDirectory())await scan(path);else if(/\.m?js$/.test(entry.name))files.push(path);}}
 await scan(resolve(root,'src'));await scan(resolve(root,'scripts'));
 for(const entry of await readdir(root,{withFileTypes:true}))if(entry.isFile()&&entry.name.endsWith('.js'))files.push(resolve(root,entry.name));
 const hash=createHash('sha256');for(const path of files.sort()){hash.update(relative(root,path)+'\0');let content=await readFile(path,'utf8');if(relative(root,path)==='sw.js')content=content.replace(/const VERSION = '[^']*';/,"const VERSION = 'BUILD';");hash.update(content);hash.update('\0');}return hash.digest('hex');
}
