import {CAST,castMember} from '../people/cast.js';
import {homeForResident} from '../people/island-households.js';
import {homeRoutine} from '../people/home-life.js';
import {RESIDENTS} from '../people/residents.js';
const minute=value=>((value%1440)+1440)%1440;
export const canonicalResidentName=name=>castMember(name)?.name||name;
export function playableRoster(names=[]){
 const canonical=canonicalResidentName;
 // Housing consolidation deliberately removed spare homes. Only residents with
 // a canonical household can be selected; background figures are not tenants.
 const unique=[...new Set([...CAST.map(p=>p.name),...names].filter(Boolean).map(canonical))].filter(name=>homeForResident(name));
 return unique.map(name=>{
  const person=castMember(name),home=homeForResident(name);
  return {name,age:person?.age??null,role:person?.purpose||'Island resident',home:{id:home.id,address:home.address,siteId:home.entranceSiteId,island:home.island}};
 });
}
export function shouldSleep(name,minutes){
 const profile=RESIDENTS.find(p=>p.name===name);
 if(profile)return homeRoutine(profile,minutes).id==='sleep';
 const person=castMember(name),m=minute(minutes);
 if(person&&person.age!==null&&person.age<18)return m>=1260||m<420;
 const first=person?.day?.[0]?.[0]?.split(':').map(Number),wake=first?Math.max(0,Math.min(390,first[0]*60+first[1]-30)):390;
 return m>=1380||m<wake;
}
/** A save's names are read as the consolidated cast reads them (people/cast.js `was`): a 0.2.9 save playing as
 * Mr Nakandakari goes on as Mac at his own checkpoint; a retired resident's record has nobody to go to and is dropped. */
export function restoreLife(raw,roster){
 const names=new Set(roster.map(p=>p.name)),people={},saved=raw?.people&&typeof raw.people==='object'?raw.people:{};
 const savedFor=name=>saved[name]??saved[Object.keys(saved).find(key=>canonicalResidentName(key)===name)];
 for(const p of roster){const record=savedFor(p.name),point=record?.checkpoint;
  people[p.name]={home:p.home.id,...(point&&[point.x,point.z,point.yaw].every(Number.isFinite)&&Math.abs(point.x)<2000&&Math.abs(point.z)<2000?{checkpoint:{x:point.x,z:point.z,yaw:point.yaw,atHome:!!point.atHome}}:{})};
 }
 const tempers={};
 for(const [key,value] of Object.entries(raw?.version===2?raw.tempers||{}:{}).slice(-400)){
  const pair=key.split('\u0000').map(canonicalResidentName);
  if(pair.length===2&&pair.every(name=>names.has(name))&&value&&Number.isFinite(value.at)&&Number.isInteger(value.count))tempers[pair.join('\u0000')]={at:value.at,count:Math.max(0,Math.min(4,value.count)),cooldown:Number.isFinite(value.cooldown)?value.cooldown:0};
 }
 const active=canonicalResidentName(typeof raw?.active==='string'?raw.active:'');
 return {version:2,active:names.has(active)?active:'Johansson',people,tempers};
}
export function insultResident(life,target,minutes){
 const key=life.active+'\u0000'+target,old=life.tempers[key];
 if(target===life.active)return {kind:'self',count:0};
 if(old?.cooldown>minutes)return {kind:'leave',count:old.count,text:target+' wants some space. Leave them alone for now.'};
 const count=old&&minutes>=old.at&&minutes-old.at<=20?Math.min(4,old.count+1):1;
 life.tempers[key]={at:minutes,count,cooldown:count>=4?minutes+1440:0};
 const lines=['There is no need for that.','Enough. Stop insulting me.','Last warning. Back off.','You have pushed this too far.'];
 return {kind:count>=4?'leave':'warning',count,text:target+': “'+(count>=4?'I’m not listening to this. We’re done.':lines[count-1])+'”'};
}
export function apologiseTo(life,target){delete life.tempers[life.active+'\u0000'+target];}
