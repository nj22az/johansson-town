/** Model preparation uses the same browser module as Make model. Outputs never publish or overwrite World assets. */
import {resolve,relative,sep} from 'node:path';
import {realpath,stat,readFile} from 'node:fs/promises';
const object=(properties,required=[])=>({type:'object',additionalProperties:false,properties,required});
const point={type:'array',items:{type:'number'},minItems:3,maxItems:3};
const connector=object({point,normal:point,up:point},['point','normal']);
const file={type:'string',minLength:1,maxLength:300,description:'Repository-relative .glb file; copy an external file into this checkout first. No symlinks or paths outside the checkout.'};
const transform=object({name:{type:'string',maxLength:80},scale:{type:'number',exclusiveMinimum:0,maximum:1000},rotation:point,position:point,ground:{type:'boolean',default:true}});
export async function modelBytes(repo,file){
 if(typeof file!=='string'||file.includes('\\')||file.split('/').some(p=>p==='..'||p==='.'||!p)||!file.endsWith('.glb'))throw Error('Give a repository-relative .glb path without traversal.');
 const root=await realpath(repo.root),path=resolve(root,file),actual=await realpath(path);
 if(actual!==path||relative(root,actual).startsWith('..'+sep)||relative(root,actual)==='..')throw Error('The model must be inside this checkout without symlinks.');
 const info=await stat(path);if(!info.isFile()||info.size>24*1024*1024)throw Error('Choose a GLB smaller than 24 MiB.');
 return (await readFile(path)).toString('base64');
}
async function runModel(ctx,file,options,write){
 const data=await modelBytes(ctx.repo,file),page=await ctx.page();
 return page.evaluate(async([data,options,write])=>{
  const M=await import('/johansson-town/src/studio/model-workbench.js');
  const raw=Uint8Array.from(atob(data),c=>c.charCodeAt(0)),root=await M.loadModel(raw,options);
  try{
   const report=M.inspectModel(root);
   if(!write)return {report};
   const out=await M.exportModel(root);let text='';for(let i=0;i<out.length;i+=32768)text+=String.fromCharCode(...out.subarray(i,i+32768));
   return {report,glb:btoa(text)};
  }finally{M.disposeModel(root);}
 },[data,options,write]);
}
export const MODEL_TOOLS=[
 {name:'model_inspect',readOnly:true,description:'Inspect a static GLB: metre dimensions, materials and bounded near-coplanar triangle overlap checks. No files change. This checks the supplied model, not the whole island.',input:object({file},['file']),
  async run({file},ctx){return (await runModel(ctx,file,{ground:false},false)).report;}},
 {name:'model_prepare',idempotent:true,description:'Prepare a static GLB with scale, XYZ rotation in degrees, position in metres and optional floor origin. Dry run by default. With dryRun:false, export a GLB and a report sidecar under output/studio-mcp/models/. Uses the UI workshop code; never changes or publishes World. Shader effects and game behaviours are not GLB data.',
  input:object({file,transform,output:{type:'string',pattern:'^[a-z0-9][a-z0-9-]{1,47}$',default:'prepared-model'},dryRun:{type:'boolean',default:true}},['file']),
  async run({file,transform={},output='prepared-model',dryRun=true},ctx){
   if(!/^[a-z0-9][a-z0-9-]{1,47}$/.test(output))throw Error('Choose an output id of 2-48 lowercase letters, digits or hyphens.');
   const result=await runModel(ctx,file,transform,!dryRun),path=`output/studio-mcp/models/${output}`;
   if(!dryRun)await ctx.repo.writeAll([[path+'.glb',Buffer.from(result.glb,'base64')],[path+'.json',JSON.stringify({format:'johansson-model-preparation',version:1,source:file,transform,report:result.report},null,1)+'\n']]);
   return {dryRun,report:result.report,...dryRun?{wouldWrite:[path+'.glb',path+'.json']}:{path:path+'.glb',reportPath:path+'.json'},next:'Inspect the surface report. A prepared file is not a World asset package and does not place or publish anything. Open the GLB with Make model → Import GLB.'};
  }},
 {name:'model_snap',readOnly:true,description:'Compute a Lego-style placement using the same workshop maths: grid position in metres, or a local source connector aligned to a world target with opposing normals. Returns position, quaternion and rotation in degrees. It does not move a live town object. For connector preparation use ground:false, preserving the source coordinate frame.',
  input:object({mode:{enum:['grid','connector']},position:point,step:{type:'number',minimum:.001,maximum:10,default:.05},origin:point,source:connector,target:connector,scale:{type:'number',exclusiveMinimum:0,maximum:1000,default:1},clearance:{type:'number',minimum:-1,maximum:1,default:0}},['mode']),
  async run(args){
   const M=await import('../../src/studio/model-workbench.js');
   if(args.mode==='grid')return {position:M.snapGrid(args),step:args.step??.05};
   const result=M.snapConnector(args),THREE=await import('../../vendor/three.module.js'),e=new THREE.Euler().setFromQuaternion(new THREE.Quaternion(...result.quaternion));
   return {...result,rotation:[e.x,e.y,e.z].map(n=>+THREE.MathUtils.radToDeg(n).toFixed(4)),ground:false};
  }},
];
