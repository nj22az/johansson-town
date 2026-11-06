import {PROFILES} from './profiles.js';
import {CAST} from './cast.js';
import {RENAMED_RESIDENTS} from './renamed.js';

export const MEMORY_KINDS=Object.freeze(['chat','meal','help','disagreement','reconcile']);
export const MEMORY_LIMIT=8;
const names=new Set([...PROFILES.map(p=>p.name),...CAST.map(p=>p.name),'Thuan','Johansson']);
const canonical=name=>RENAMED_RESIDENTS[name]||name;
const pair=(a,b)=>{a=canonical(a);b=canonical(b);return a!==b&&names.has(a)&&names.has(b)?[a,b].sort():null;};
export const relationshipKey=(a,b)=>pair(a,b)?.join('|')||null;
const places=new Set(['street','izakaya','ramen','market','home','onsen','favour']);
const count=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,999):0;
const validDay=n=>Number.isSafeInteger(n)&&Math.abs(n)<1000000;

/** Validate bounds and identities; never trust saved object keys or prose. */
export function restoreRelationships(saved){
 const out={};if(!saved||typeof saved!=='object'||Array.isArray(saved))return out;
 for(const [key,r] of Object.entries(saved).slice(0,names.size*(names.size-1)/2)){
  const ids=key.split('|');if(ids.length!==2||!r||typeof r!=='object')continue;
  const k=relationshipKey(...ids);if(!k||Object.hasOwn(out,k))continue;
  const totals=Object.fromEntries(MEMORY_KINDS.map(kind=>[kind,count(r.totals?.[kind])]));
  const marks=Object.fromEntries(MEMORY_KINDS.filter(kind=>validDay(r.marks?.[kind])).map(kind=>[kind,r.marks[kind]]));
  const recent=Array.isArray(r.recent)?r.recent.filter(e=>e&&MEMORY_KINDS.includes(e.kind)&&validDay(e.day)&&places.has(e.place)).slice(-MEMORY_LIMIT).map(e=>({kind:e.kind,day:e.day,place:e.place})):[];
  out[k]={totals,marks,recent};
 }return out;
}

/** Once per pair, event kind and town day. Call only for an event that actually finished. */
export function rememberEncounter(state,a,b,{kind='chat',minutes,place='street'}={}){
 const key=relationshipKey(a,b),day=Math.floor(minutes/1440);
 if(!state||!key||!MEMORY_KINDS.includes(kind)||!validDay(day)||!places.has(place))return false;
 state.relationships??={};
 const record=state.relationships[key]??={totals:Object.fromEntries(MEMORY_KINDS.map(k=>[k,0])),marks:{},recent:[]};
 if(record.marks[kind]>=day)return false;
 record.marks[kind]=day;record.totals[kind]=Math.min(999,(record.totals[kind]||0)+1);
 record.recent.push({kind,day,place});record.recent=record.recent.slice(-MEMORY_LIMIT);return true;
}

export const relationshipBetween=(state,a,b)=>state?.relationships?.[relationshipKey(a,b)]||null;
export function connectionWeight(state,a,b){
 const t=relationshipBetween(state,a,b)?.totals;if(!t)return 0;
 return Math.max(0,Math.min(4,((t.chat||0)+2*(t.meal||0)+3*(t.help||0)+(t.reconcile||0)-2*(t.disagreement||0))*.15));
}

const WHERE={street:'on the street',izakaya:'at Minato',ramen:'at the ramen counter',market:'at Sakura',home:'at home',onsen:'at Umi-no-yu',favour:'during an errand'};
export function encounterText(e){
 const action={chat:'Talked',meal:'Shared a meal',help:'Completed a favour',disagreement:'Disagreed',reconcile:'Cleared the air'}[e.kind];
 return `${action} ${WHERE[e.place]||'in town'}.`;
}
export function connectionSummary(record){
 const t=record?.totals||{},parts=[];
 for(const [kind,one,many] of [['chat','conversation','conversations'],['meal','shared meal','shared meals'],['help','completed favour','completed favours'],['disagreement','disagreement','disagreements'],['reconcile','reconciliation','reconciliations']])if(t[kind])parts.push(t[kind]+' '+(t[kind]===1?one:many));
 const last=record?.recent?.at(-1);
 return (parts.join(' · ')||'A familiar face')+(last?'. Most recent: '+encounterText(last):'.');
}
export function connectionsFor(state,name){
 name=canonical(name);
 return Object.entries(state?.relationships||{}).filter(([key])=>key.split('|').includes(name)).map(([key,record])=>({name:key.split('|').find(n=>n!==name),record})).sort((a,b)=>connectionWeight(state,name,b.name)-connectionWeight(state,name,a.name)||a.name.localeCompare(b.name));
}

/** Only recall a witnessed event from before today. No zodiac, invented facts or romance. */
export function relationshipChat(state,a,b,{minutes,sharedInterests=[]}={}){
 const record=relationshipBetween(state,a,b),day=Math.floor(minutes/1440);
 if(!record||Object.values(record.marks).some(d=>d>=day))return null;
 const last=record.recent.at(-1);if(!last||last.day>=day)return null;
 let kind='chat',lines;
 if(last.kind==='disagreement'){
  kind='reconcile';lines=['About our disagreement. Shall we start again?','Yes. We can take turns choosing next time.','That sounds fair.'];
 }else if(last.kind==='meal')lines=['I enjoyed sitting down for a meal together.','So did I. We should make time for it again.','When the work is done, let us see.'];
 else if(last.kind==='help')lines=['That errand worked out in the end.','It did. I am glad we got it sorted.','A good reason to stop for a chat.'];
 else if(day%7===0&&(record.totals.chat||0)>=2&&sharedInterests.length===0){
  kind='disagreement';lines=['I was hoping for a quiet afternoon on my own.','Oh. I had hoped we might spend it together.','Let us leave it for today, then.'];
 }else if((record.totals.chat||0)>=2)lines=['Good to stop and catch up again.','There is always something happening round here.','And always time for one more story.'];
 else return null;
 return {topic:'memory-'+kind,relationshipKind:kind,lines,speakers:[0,1,0]};
}

/** Familiarity survives the year loop; dated encounters and daily limits start again. */
export function relationshipsNextYear(saved){
 const out=restoreRelationships(saved);for(const r of Object.values(out)){r.recent=[];r.marks={};}return out;
}
