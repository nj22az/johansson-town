// Generate small static meshes from the user's existing Form 3D recipes.
// Run after `npm ci` in ../form-3d-studio; the game does not download JSCAD.
import {mkdir,writeFile} from 'node:fs/promises';
import {buildModel} from '../../form-3d-studio/src/open-models.mjs';
import {WORKSHOP_MODELS} from '../src/workshop/catalogue.js';
import {MeshoptSimplifier} from 'meshoptimizer';
await MeshoptSimplifier.ready;
const directory=new URL('../assets/workshop/',import.meta.url);await mkdir(directory,{recursive:true});
for(const recipe of WORKSHOP_MODELS){
 const model=buildModel(recipe.type,recipe.parameters);
 for(const solid of model.solids){
  let positions=new Float32Array(solid.mesh.vertices.flat()),indices=new Uint32Array(solid.mesh.faces.flat());
  if(indices.length>9000){[indices]=MeshoptSimplifier.simplify(indices,positions,3,9000,.002,['Permissive']);}
  const [remap,count]=MeshoptSimplifier.compactMesh(indices),vertices=Array(count);
  for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff)vertices[remap[i]]=[...positions.slice(i*3,i*3+3)].map(value=>{if(!Number.isFinite(value))throw Error('Invalid vertex: '+recipe.id);return Math.round(value*10000)/10000;});
  // compactMesh rewrites indices in place as well as returning the vertex map.
  const faces=[];for(let i=0;i<indices.length;i+=3)faces.push([indices[i],indices[i+1],indices[i+2]]);
  solid.mesh={vertices,faces};
 }
 const content=JSON.stringify(model)+'\n';await writeFile(new URL(recipe.id+'.json',directory),content);
 console.log(recipe.id,content.length+' bytes',model.solids.reduce((sum,solid)=>sum+solid.mesh.faces.length,0)+' triangles');
}
