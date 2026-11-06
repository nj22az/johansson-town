/** The first native World room adapter. Stable assembly identities; no game state or DOM. */
export const WORKSHOP_ID='dock-workshop';
export const WORKSHOP_SOURCE_FILES=['src/studio/workshop-contract.js','src/studio/workshop-room.js','src/world/interiors/workshop-props.js','src/world/interiors/compact-shops.js','src/world/interiors/business-content.js','src/world/dock-workshop-layout.js','src/workshop/tetsuo-bench.js','src/workshop/chin-wall.js','src/workshop/motor-bench.js','src/workshop/machine.js','assets/models/props/motor-90l-display.glb'];
export const WORKSHOP_OBJECTS=Object.freeze({
 'workshop-shell':{name:'Room shell, door and lights',position:[0,0,0],locked:true},
 'fabrication-bench':{name:'Chin’s fabrication bench and printer',position:[0,0,0],locked:true},
 'electrical-bench':{name:'Tetsuo’s working electrical corner',position:[0,0,0],locked:true},
 'chin-wall':{name:'Chin’s tools, parts and outboard',position:[0,0,0],locked:true},
 'pattern-table':{name:'Pattern and calculation table',position:[3.2,0,.3]},
 'motor-bench':{name:'Pump motor and test bench',position:[1.75,0,.85]},
 'star-port':{name:'Star Port arcade cabinet',position:[-1.65,0,3.21]},
 'workshop-sign':{name:'Workshop name board',position:[0,0,0],locked:true},
});
export const nativeObject=id=>({id,asset:id,name:WORKSHOP_OBJECTS[id].name,position:[...WORKSHOP_OBJECTS[id].position],rotation:[0,0,0],scale:1,visible:true,support:WORKSHOP_OBJECTS[id].locked?'attached':'resting'});
export const isWorkshop=p=>p?.world?.room===WORKSHOP_ID;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function validateWorkshopProject(p){
 const w=p.world;if(!w||w.room!==WORKSHOP_ID||w.adapter!==1||!Number.isSafeInteger(w.revision)||w.revision<0||!/^[a-f0-9]{64}$/.test(w.source||''))throw Error('Invalid native workshop source. Reopen the World workshop.');
 for(const [id,a] of Object.entries(p.assets))if(a.world!==undefined&&(!WORKSHOP_OBJECTS[id]||a.world!==id||a.glb!==undefined||a.version!==1))throw Error('Invalid native workshop asset.');
 for(const [id,def] of Object.entries(WORKSHOP_OBJECTS)){
  const o=p.objects.find(o=>o.id===id),asset=p.assets[id];if(!asset||asset.world!==id)throw Error('Native workshop assets must be retained.');
  if(!o){if(def.locked)throw Error(def.name+' is protected.');continue;}
  if(o.asset!==id)throw Error('Native assemblies keep their World builder. Add a separate GLB prop instead.');
  if(def.locked&&(!same(o.position,def.position)||!same(o.rotation,[0,0,0])||o.scale!==1||!o.visible))throw Error(def.name+' is protected: its services and machinery remain connected.');
 }
 for(const o of p.objects){
  if(WORKSHOP_OBJECTS[o.asset]&&o.id!==o.asset)throw Error('Native assemblies cannot be duplicated.');
  const floating=o.support==='suspended';if(!WORKSHOP_OBJECTS[o.id]?.locked&&o.support&&!['resting','suspended'].includes(o.support))throw Error('Choose floor support or intentional floating for movable workshop props.');
  if((floating?o.position[1]<0:o.position[1]!==0)||o.rotation[0]!==0||o.rotation[2]!==0||o.rotation[1]%90!==0||o.scale>4||(WORKSHOP_OBJECTS[o.id]&&o.scale!==1))throw Error('Workshop furniture needs floor contact unless Allow floating is enabled, with quarter-turn rotations. Native scale remains 1.');
 }
 if(p.objects.filter(o=>!WORKSHOP_OBJECTS[o.id]).length>8)throw Error('The first workshop adapter allows eight additional static floor props.');
 return p;
}
export function workshopLayout(p){validateWorkshopProject(p);const used=new Set(p.objects.filter(o=>!WORKSHOP_OBJECTS[o.id]).map(o=>o.asset));return {objects:p.objects.map(o=>structuredClone(o)),assets:Object.fromEntries([...used].map(id=>[id,structuredClone(p.assets[id])]))};}
export function workshopProject({revision,source,layout={objects:Object.keys(WORKSHOP_OBJECTS).map(nativeObject),assets:{}}}){
 return {format:'johansson-room-project',version:1,id:'dock-workshop',title:'Dock Electrical & Repair Workshop',revision:0,world:{room:WORKSHOP_ID,adapter:1,revision,source},assets:{...Object.fromEntries(Object.keys(WORKSHOP_OBJECTS).map(id=>[id,{name:WORKSHOP_OBJECTS[id].name,version:1,world:id}])),...structuredClone(layout.assets)},objects:structuredClone(layout.objects)};
}
