import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as T from '../vendor/three.module.js';
import {installDOM} from '../tests/fixtures.mjs';
import {surveyInterior,khaakaPlan} from './building-survey.mjs';
import {buildOnsenInterior} from '../src/world/interiors/onsen.js';
import {buildPoliceStationInterior} from '../src/world/interiors/police-station.js';
import {buildClinic,buildCommunityKitchen,buildMayorHome} from '../src/world/interiors/town-hall.js';
import {buildCompactShop} from '../src/world/interiors/compact-shops.js';
import {CLASSROOM} from '../src/world/interiors/classroom.js';
import {SATO_ROOM} from '../src/world/sato-ramen-layout.js';
import {SHARED_DINING_COLLIDERS} from '../src/world/interiors/shared-dining-layout.js';
installDOM();
const folder=fileURLToPath(new URL('../docs/building-plans/',import.meta.url));
// An explicit revision lets refreshed evidence cite main even when the survey
// tooling lives on a PR branch. Refuse provenance that differs from local inputs.
const source=execFileSync('git',['rev-parse',process.argv[2]||'HEAD'],{encoding:'utf8'}).trim();
const inputDiff=execFileSync('git',['diff',source,'--','src','vendor','tests/fixtures.mjs'],{encoding:'utf8',cwd:fileURLToPath(new URL('../',import.meta.url))});
if(inputDiff.trim())throw Error('Survey inputs differ from the requested source revision');
const analysis=JSON.parse(readFileSync(folder+'analysis.json'));
const entries=[
 ['onsen',buildOnsenInterior,{},[['Lobby / genkan',-1,4.1],['Changing / lockers',-2,.4],['Washing area',-4,-2.1],['Indoor bath',1.4,-3.1],['Rock bath',-1,-6.7]]],
 ['koban',buildPoliceStationInterior,{}],['clinic',buildClinic,{}],['community-kitchen',buildCommunityKitchen,{}],['mayor-home',buildMayorHome,{}],
 ['frontrow',buildCompactShop,{site:{id:'frontrow',title:'Front-Row Books',bookshop:true}}],
 ['form3d',buildCompactShop,{site:{id:'form3d',title:'Dock Electrical & Repair',industrialWorkshop:true}}],
 // Both doors use the same polygon on current main; do not invent a dividing wall
 // or use the former, retired Inakaya room as Sato Ramen's current extent.
 ['ramen',null,{layout:{...SATO_ROOM,colliders:SHARED_DINING_COLLIDERS}}],
 ['izakaya',null,{layout:{...SATO_ROOM,colliders:SHARED_DINING_COLLIDERS}}],
 ['school',null,{layout:CLASSROOM}],
];
const baseline=JSON.parse(execFileSync('git',['show',source+':johansson-town/docs/building-plans/analysis.json'],{encoding:'utf8'}));
const evidence=[];
for(const [id,build,extra,labels=[]] of entries){
 const room=new T.Group(),cols=[];
 const layout=build?build({room,reg(){},action(){},exit(){},collider:(x,z,w,d,height)=>cols.push({x,z,w,d,height}),...extra}):extra.layout;
 const s=surveyInterior(room,{...layout,colliders:[...cols,...(layout.colliders||[])]});
 const row=analysis.find(r=>r.id===id);if(!row)throw Error('Missing analysis row '+id);
 const old=baseline.find(r=>r.id===id),previous={w:old.w,h:old.h,m2:old.m2};
 Object.assign(row,{w:s.w,h:s.h,m2:s.domainArea,jo:+(s.domainArea/1.62).toFixed(1),tsubo:+(s.domainArea/3.3).toFixed(1),moduleOff:null,
  rooms:null,roomSizes:[],doors:null,measurement:{method:build?'runtime-builder-full-domain':'runtime-layout-full-domain',source,bounds:s.bounds,floorPolygon:s.polygon,floorArea:s.floorArea,floorSampleStep:s.floorSampleStep,floorMeshes:s.floorMeshes,scope:id==='ramen'||id==='izakaya'?'Shared Minato / Sato interior; same domain, not two independent areas':'Complete movement domain; not net walkable area'}});
 // Presence is positive evidence; absence from layout-only evidence proves nothing.
 if(build){const names=s.features.join('\n');row.missing=row.missing.filter(f=>!(f==='toilet'&&/Toilet|WC/i.test(names)||f==='counter'&&/counter/i.test(names)||f==='storage'&&/shelf|storage|cabinet/i.test(names)));}
 writeFileSync(folder+id+'.khaaka.json',JSON.stringify(khaakaPlan(row.title,s,labels),null,1)+'\n');
 evidence.push({id,source,previous,measurement:row.measurement,domainArea:s.domainArea,features:s.features,
  review:build?'Built current runtime geometry; fittings recorded positively only':'Layout-only: extent verified; geometry and missing fittings require separate inspection'});
}
writeFileSync(folder+'analysis.json',JSON.stringify(analysis,null,1)+'\n');
writeFileSync(folder+'measurement-review.json',JSON.stringify({source,method:'Full runtime movement bounds/polygon; all datum floor meshes; no first-hit or whole-scene extent',entries:evidence},null,1)+'\n');
console.log(`Regenerated ${entries.length} plans and analysis rows from ${source}`);

const report=new URL('../docs/BUILDING-AUDIT.md',import.meta.url);
const lines=['<!-- full-domain-survey:start -->',`Survey source: \`${source}\`. Regenerate with \`node scripts/build-building-audit.mjs\`, then \`python3 scripts/render-building-plans.py onsen koban clinic community-kitchen mayor-office mayor-home frontrow form3d ramen izakaya school\` from \`johansson-town/\`.`, '', '| Interior | Movement extent (m) | Domain (m²) | Sampled floor (m²) | Evidence |','|---|---|---|---|---|'];
for(const e of evidence){const r=analysis.find(r=>r.id===e.id);lines.push(`| ${r.title} | ${r.w} × ${r.h} | ${r.m2} | ${r.measurement.floorArea??'not sampled'} | ${r.measurement.method==='runtime-builder-full-domain'?'Current builder geometry':'Current layout only'} |`);}
lines.push('<!-- full-domain-survey:end -->');
let reportText=readFileSync(report,'utf8');reportText=reportText.replace(/<!-- full-domain-survey:start -->[\s\S]*?<!-- full-domain-survey:end -->/,lines.join('\n'));writeFileSync(report,reportText);
