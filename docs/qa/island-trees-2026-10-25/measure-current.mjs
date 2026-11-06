import * as THREE from '../../../vendor/three.module.js';
import {installDOM} from '../../../tests/fixtures.mjs';
import {writeFile} from 'node:fs/promises';
installDOM();globalThis.self=globalThis;globalThis.__TREE_AUDIT__=[];
const {createTown}=await import('../../../src/world/town.js'),{createBusinesses}=await import('../../../src/world/businesses.js');
const {broadleafGeometry}=await import('../../../src/world/okinawa/trees.js');
const K=await import('../../../src/world/vegetation-kit.js');
const {buildCherryTree}=await import('../../../src/world/cherry-tree.js');
const {tropicalPlantings,TROPIC_OUTLINE,TROPIC_TRAILS,farPlants}=await import('../../../src/world/tropical-island.js');
const {AIRPORT_ISLAND}=await import('../../../src/world/airport-island.js');
const scene=new THREE.Scene();
const town=createTown({scene,sites:createBusinesses(),townMode:'peninsula',mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
town.kitano?.ensure();scene.updateMatrixWorld(true);
const details=[];scene.traverse(o=>{if(o.isInstancedMesh&&/tree|fukugi|palms|pandanus|banana/i.test(o.name)){
 const instances=[];for(let i=0;i<o.count;i++){const m=new THREE.Matrix4();o.getMatrixAt(i,m);m.premultiply(o.matrixWorld);const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();m.decompose(p,q,s);instances.push({position:p.toArray(),scale:s.toArray()});}
 details.push({name:o.name,count:o.count,visible:o.visible,ancestors:(()=>{let a=[],p=o;while(p){a.push(p.name);p=p.parent;}return a;})(),instances});}});
const serialize=(id,g,more={})=>{g.computeBoundingBox();const box=g.boundingBox;return {id,...more,bounds:{min:box.min.toArray(),max:box.max.toArray(),size:box.getSize(new THREE.Vector3()).toArray()},triangles:g.index?g.index.count/3:g.attributes.position.count/3,position:Array.from(g.attributes.position.array),normal:Array.from(g.attributes.normal.array),color:g.attributes.color?Array.from(g.attributes.color.array):null,index:g.index?Array.from(g.index.array):null};};
const models=[];for(const form of ['round','column','spread'])models.push(serialize('minato-'+form,broadleafGeometry({form,variant:0}).scale(5,5,5),{family:form,nominalHeight:5}));
for(const [id,g] of [['palm',K.coconutPalm({seed:3,height:8.5,bow:1.8})],['rainforest',K.rainforestTree({seed:2,height:8,spread:3.4})],['pandanus',K.pandanus({seed:4})],['banana',K.bananaPlant({seed:6})]])models.push(serialize(id,g));
const distant=farPlants(new THREE.Group(),Object.fromEntries(['palms','trees','pandanus','bananas','bushes','rocks'].map(k=>[k,[{u:0,v:0,y:0,scale:1,turn:0}]])));for(const o of distant.children)models.push(serialize('far-'+o.name.split(' ').at(-1),o.geometry));
const cherry=buildCherryTree({scale:6.2});for(const season of ['leaf','bloom','bare'])models.push(serialize('cherry-'+season,cherry.dresses[season].clone().scale(6.2,6.2,6.2)));
const P=tropicalPlantings();const report={date:'2026-10-25',sourceCommit:process.env.TREE_SOURCE_COMMIT,broadleafCalls:globalThis.__TREE_AUDIT__,instancedBatches:details,kitanoPlantingCounts:Object.fromEntries(Object.entries(P).map(([k,v])=>[k,v.length])),kitanoPlantings:P,kitanoOutline:TROPIC_OUTLINE,kitanoTrails:TROPIC_TRAILS,airportFrame:AIRPORT_ISLAND,contextFootprints:town.colliders.filter(c=>c.w>3&&c.d>3),treeColliders:town.colliders.filter(c=>/tree|fukugi|gajumaru|cherry|palm/i.test(c.id||'')),models};
await writeFile(process.env.TREE_AUDIT_OUTPUT||'/workspace/scratch/c5269f4340fb/tree-output/current.json',JSON.stringify(report));
console.log(JSON.stringify({broadleafs:report.broadleafCalls.length,forms:report.broadleafCalls.reduce((a,p)=>(a[p.family]=(a[p.family]||0)+1,a),{}),kitano:report.kitanoPlantingCounts,batches:details.map(b=>({name:b.name,count:b.count})),samples:models.map(({id,bounds,triangles})=>({id,bounds,triangles}))},null,2));
