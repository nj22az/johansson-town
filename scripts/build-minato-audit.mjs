import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {surveyInterior,khaakaPlan} from './building-survey.mjs';
import {MINATO_COMPACT as P} from '../src/world/interiors/minato-compact-plan.js';
import {SHARED_DINING_BOUNDS,SHARED_DINING_FLOOR,SHARED_DINING_COLLIDERS} from '../src/world/interiors/shared-dining-layout.js';

// Refresh this shared venue only. The wider town survey keeps its original evidence
// and revision. A working Blender refit must not claim to have come from git HEAD.
const root=new URL('../',import.meta.url),folder=new URL('docs/building-plans/',root);
const read=path=>readFileSync(new URL(path,root)),json=path=>JSON.parse(read(path));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const planPath='art/izakaya/compact/plan.json',assetPath='assets/models/izakaya/minato-interior-compact.glb';
const colliderPath='src/world/interiors/shared-dining-layout.js',builderPath='tools/blender/build-minato-compact.py';
const planBytes=read(planPath),assetBytes=read(assetPath),report=json('art/izakaya/compact/compact-report.json');
assert.deepEqual(JSON.parse(planBytes),P,'Regenerate minato-compact-plan.js before refreshing the survey');
assert.equal(report.planRevision,P.revision,'Export the current compact plan in Blender before refreshing the survey');
assert.equal(report.export.path,assetPath,'The Blender report must identify the active runtime export');
assert.equal(assetBytes.length,report.export.bytes,'The runtime asset must match the reviewed export size');
const provenance={status:'working prototype',plan:planPath,planRevision:P.revision,planSha256:hash(planBytes),
 asset:assetPath,assetSha256:hash(assetBytes),colliders:colliderPath,collidersSha256:hash(read(colliderPath)),
 blenderBuilder:builderPath,blenderBuilderSha256:hash(read(builderPath)),exportReport:'art/izakaya/compact/compact-report.json',
 exportReportSha256:hash(read('art/izakaya/compact/compact-report.json'))};
const source=`working-prototype:minato-compact-r${P.revision}:sha256:${provenance.planSha256}`;
const previousGlobals={self:globalThis.self,bitmap:globalThis.createImageBitmap};
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});
let room;
try{room=(await new GLTFLoader().parseAsync(assetBytes.buffer.slice(assetBytes.byteOffset,assetBytes.byteOffset+assetBytes.byteLength),'')).scene;}
finally{globalThis.self=previousGlobals.self;globalThis.createImageBitmap=previousGlobals.bitmap;}
// The exported cedar material includes both floorboards and the booth tabletop.
// Recover its actual upward datum triangles for the survey; a whole-batch box would
// reject the timber floor or count furniture as floor. Production geometry is untouched.
room.updateMatrixWorld(true);
const floorRoom=new T.Group(),floorBand={minY:-.15,maxY:.08},floorBatches=[];
const sourceNames=o=>{
 const raw=o.userData.sourceObjects;return raw?(typeof raw==='string'?JSON.parse(raw):raw).map(e=>e.name):[];
};
room.traverse(o=>{
 if(!o.isMesh||![o.name,...sourceNames(o)].some(name=>/floor|paving|tiles?/i.test(name)))return;
 const p=o.geometry.attributes.position,index=o.geometry.index,vertices=[],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),ab=new T.Vector3(),ac=new T.Vector3();
 for(let i=0,n=index?.count??p.count;i<n;i+=3){
  for(const [j,v] of [[0,a],[1,b],[2,c]])v.fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(o.matrixWorld);
  if([a,b,c].some(v=>v.y<floorBand.minY||v.y>floorBand.maxY))continue;
  const normal=ab.subVectors(b,a).cross(ac.subVectors(c,a));if(normal.lengthSq()===0||normal.y/normal.length()<.65)continue;
  vertices.push(...a.toArray(),...b.toArray(),...c.toArray());
 }
 if(!vertices.length)return;
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial());mesh.name='Datum floor · '+o.name;floorRoom.add(mesh);
 floorBatches.push({sourceMesh:o.name,upwardTriangles:vertices.length/9});
});
const survey=surveyInterior(floorRoom,{bounds:SHARED_DINING_BOUNDS,floorPolygon:SHARED_DINING_FLOOR,colliders:SHARED_DINING_COLLIDERS});
assert.ok(survey.floorArea>0,'The compact export must retain identifiable datum floor batches');
// Material batching keeps the original authored fitting names in sourceObjects.
// These supply positive presence evidence; they do not establish absent facilities.
const features=new Set(survey.features);
room.traverse(o=>{
 if(o.name)features.add(o.name);
 const raw=o.userData.sourceObjects;if(!raw)return;
 for(const entry of typeof raw==='string'?JSON.parse(raw):raw)if(entry.name)features.add(entry.name.replace(/\.\d+$/,''));
});
const positive=[...features].sort(),has=pattern=>positive.some(name=>pattern.test(name));
assert.ok(has(/WC porcelain bowl/) && has(/Sato counter cabinetry/) && has(/Shared cold store cabinet/),'The shared WC, counter and storage must exist in the export');
const analysis=json('docs/building-plans/analysis.json'),review=json('docs/building-plans/measurement-review.json');
const labels=[['Shared kitchen',-3.6,-2.65],['Minato counter',-3.6,-1.05],['Booth',-2.9,2.3],['Guest WC',1.02,2.45],
 ['Sato Ramen',3.25,.42],['Minato entry',-.68,3.18],['Sato entry',3.02,3.18],
 ['Shared Minato / Sato',2.7,-3.4],[`Working prototype r${P.revision}`,2.7,-3.0]];
for(const id of ['izakaya','ramen']){
 const row=analysis.find(r=>r.id===id),evidence=review.entries.find(e=>e.id===id);
 assert.ok(row&&evidence,'Retain the existing survey entry for '+id);
 evidence.beforeCompactRefit??={w:row.w,h:row.h,m2:row.m2,measurement:row.measurement};
 const measurement={method:'compact-gltf-full-domain',source,provenance,bounds:survey.bounds,floorPolygon:survey.polygon,
  floorArea:survey.floorArea,floorSampleStep:survey.floorSampleStep,floorMeshes:survey.floorMeshes,
  floorGeometry:{method:'Upward datum triangles from actual GLB floor batches; mixed floor/furniture materials separated by world-space height and face direction',band:floorBand,batches:floorBatches},
  scope:'Shared Minato / Sato interior; the same domain appears at both entrances and is counted once. Sampled floor support is not net walkable area.'};
 Object.assign(row,{w:survey.w,h:survey.h,m2:survey.domainArea,jo:+(survey.domainArea/1.62).toFixed(1),tsubo:+(survey.domainArea/3.3).toFixed(1),
  ceiling:+(P.ceilingY-P.floorY).toFixed(3),moduleOff:null,rooms:null,roomSizes:[],doors:null,measurement});
 row.missing=row.missing.filter(f=>!(f==='toilet'&&has(/WC porcelain bowl/)
  ||f==='counter'&&has(/Sato counter cabinetry/)
  ||f==='storage'&&has(/Shared cold store cabinet/)));
 Object.assign(evidence,{source,measurement,domainArea:survey.domainArea,features:positive,
  review:'Working compact prototype: actual Blender export and the complete runtime collider plan. WC, counters and cold storage are positively recorded. Net walkable area and statutory compliance are not inferred from floor sampling.'});
 const plan=khaakaPlan(row.title+' / shared compact interior',survey,labels);plan.provenance=provenance;
 writeFileSync(new URL(id+'.khaaka.json',folder),JSON.stringify(plan,null,1)+'\n');
}
review.sourceScope='Original multi-venue survey; compact Minato/Sato entries have their own source and prototype provenance.';
review.compactRefit={source,provenance,scope:['izakaya','ramen']};
writeFileSync(new URL('analysis.json',folder),JSON.stringify(analysis,null,1)+'\n');
writeFileSync(new URL('measurement-review.json',folder),JSON.stringify(review,null,1)+'\n');

const reportPath=new URL('docs/BUILDING-AUDIT.md',root);let text=readFileSync(reportPath,'utf8');
text=text.replace(/^Survey source:/m,'Original multi-venue survey source:');
for(const id of ['izakaya','ramen']){
 const row=analysis.find(r=>r.id===id);
 text=text.replace(new RegExp(`^\\| ${row.title} \\| [^\\n]*$`,'m'),`| ${row.title} | ${row.w} × ${row.h} | ${row.m2} | ${survey.floorArea} | Compact prototype GLB, revision ${P.revision} |`);
}
const sourceNote=[
 '<!-- minato-compact-survey:start -->',
 `**Compact Minato/Sato update (working prototype).** The two shared-venue rows above were refreshed from \`${planPath}\`, revision **${P.revision}**, SHA-256 \`${provenance.planSha256}\`, and the actual \`${assetPath}\` export. They replace the earlier 202.26 m² shared domain with **${survey.domainArea} m²** inside a **${survey.w} × ${survey.h} m** movement envelope. The domain is counted once across both doors. The sampled **${survey.floorArea} m²** measures supporting floor geometry; walls, furniture and body clearance are separate navigation constraints.`,
 '',
 'The fitted model positively contains the guest WC, both serving counters and shared cold storage. `measurement-review.json` retains the previous shared-domain evidence and records the plan, GLB, collider and Blender-builder hashes. Unrelated town rows retain their original provenance. Regenerate only these two entries with `node scripts/build-minato-audit.mjs`, then `python3 scripts/render-building-plans.py izakaya ramen`.',
 '<!-- minato-compact-survey:end -->',
 ].join('\n');
if(text.includes('<!-- minato-compact-survey:start -->'))text=text.replace(/<!-- minato-compact-survey:start -->[\s\S]*?<!-- minato-compact-survey:end -->/,sourceNote);
else text=text.replace('<!-- full-domain-survey:end -->','<!-- full-domain-survey:end -->\n\n'+sourceNote);
text=text.replace(/^\| B6 \|[^\n]*$/m,`| B6 | B | Izakaya / Sato Ramen | The earlier fitted building used a 202.26 m² shared movement domain. The compact Blender prototype now uses **${survey.w} × ${survey.h} m**, **${survey.domainArea} m²**, with a 4.35 m Minato counter, five stools, one four-person booth, a three-stool Sato counter and a two-seat ledge. Both entrances still share the kitchen and guest WC; the domain is counted once. | **Refitted prototype, measured.** Source: compact plan revision ${P.revision} and the exported GLB, recorded by hash above. Every authored Minato approach, the WC and the connection to Sato are checked against complete runtime solids; player service checks all seats and cooking stations. Publication and final visual acceptance are separate from this measurement. |`);
text=text.replace('**Remaining:** no WC geometry in the current onsen builder; izakaya WC provision needs a separate geometry/shared-facility check. Extent alone cannot establish missing fittings.',
 '**Remaining:** no WC geometry in the current onsen builder. The compact Minato/Sato prototype supplies a shared guest WC, positively recorded in the Blender export and checked for a reachable approach. Extent alone cannot establish missing fittings.');
text=text.replace('B6 needs revised shared-venue interpretation.','B6 now has a separately measured compact Minato/Sato prototype, recorded below.');
writeFileSync(reportPath,text);
console.log(JSON.stringify({source,domainArea:survey.domainArea,sampledFloorArea:survey.floorArea,extent:[survey.w,survey.h],floorMeshes:survey.floorMeshes,updated:['izakaya','ramen']},null,2));
