import {STORY_PLACES,feedPlace} from './places.js';
import {choosePanelFx} from './manga-fx.js';
import {belongingsOf} from '../people/belongings.js';
import {isRetired} from '../people/roster.js';
import {GENRES,ENDINGS,OPENINGS,REACTIONS,FOODS,DRINKS,SNACKS,WEATHER,HOURS,RECIPE,COURSE,OVERHEARD} from './stories.js';

/**
 * The storyteller: turns a seed (normally the date) into the town feed's stories. Everything is
 * drawn from the story database (stories.js), the real places (places.js) and the resident
 * catalogue, with a seeded random source, so a given day always tells the same stories and
 * every reader sees the same edition. Stories are coherent by construction (the cast, place
 * and variables are bound once and every beat refers back to them); whether they are funny
 * is left to chance.
 */

/** A small, fast, seeded random source (mulberry32) from a string. */
export function seeded(text){
 let h=1779033703^text.length;for(let i=0;i<text.length;i++){h=Math.imul(h^text.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
 let a=h>>>0;
 const next=()=>{a=a+0x6D2B79F5|0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
 const sample=(list,n)=>{const pool=[...list],out=[];while(out.length<n&&pool.length)out.push(pool.splice(Math.floor(next()*pool.length),1)[0]);return out;};
 return {next,int:n=>Math.floor(next()*n),pick:list=>list[Math.floor(next()*list.length)],chance:p=>next()<p,sample};
}

const PROPER=/^(Vietnamese|Okinawan|Japanese|Minato|Sakura)\b/;
const job=role=>{const r=String(role||'resident');return PROPER.test(r)?r:r[0].toLowerCase()+r.slice(1);};
const sentence=text=>text?text.replace(/\s+/g,' ').trim().replace(/^([“"…]*)([a-z])/,(m,q,c)=>q+c.toUpperCase()).replace(/([.!?]\s+)([a-z])/g,(m,p,c)=>p+c.toUpperCase()):text;
const article=phrase=>(/^[aeiouāēīōū]/i.test(phrase)?'an ':'a ')+phrase;   // "an ēgwā": Okinawan long vowels too
const clip=s=>String(s||'').replace(/\.$/,'');

/** The facts a story can use about one resident. */
export function castMember(r){
 if(!r)return null;
 const p=r.islandPersonality||{};
 return {name:r.name,job:job(r.role),ajob:article(job(r.role)),place:r.place,friend:r.friend||null,trait:String(p.traits?.[0]||'kind').toLowerCase(),
  habit:clip(p.habit)||'Keep a spare umbrella',ambition:clip(p.ambition)||'See the whole island in one day',
  belongings:belongingsOf(r.name)};
}

/** Expands the story grammar. Unknown symbols throw, so a typo in the database fails a test. */
export function expand(text,ctx,rng,depth=0){
 if(depth>6)throw Error('Story grammar recursion: '+text);
 let out=String(text).replace(/\[([^\[\]]+)\]/g,(m,body)=>rng.pick(body.split('|')));
 // {a $name}: the same symbol with a or an in front.
 out=out.replace(/\{a ([$\w.]+)\}/g,(m,key)=>article(expand('{'+key+'}',ctx,rng,depth+1)));
 out=out.replace(/\{([$\w.]+)\}/g,(m,key)=>{
  let value;
  if(key.startsWith('$')){value=ctx.vars[key.slice(1)];}
  else{
   const [head,field]=key.split('.');
   if(head==='A'||head==='B'||head==='C'){const who=ctx[head];if(!who)throw Error('Story needs '+head+': '+text);value=field?who[field]:who.name;}
   else if(head==='place')value=field==='short'?ctx.place.short:field==='bare'?ctx.place.short.replace(/^the /,''):ctx.place.name;
   else value={thing:ctx.thing,doing:ctx.doing,food:()=>rng.pick(FOODS),drink:()=>rng.pick(DRINKS),snack:()=>rng.pick(SNACKS),weather:()=>rng.pick(WEATHER),hour:()=>rng.pick(HOURS)}[head];
   if(typeof value==='function')value=value();
   if(field==='bare'&&head!=='place'&&typeof value==='string')value=value.replace(/^the /,'');
  }
  if(value==null)throw Error('Unknown story symbol {'+key+'} in: '+text);
  return expand(value,ctx,rng,depth+1);
 });
 return out;
}

/** The catalogue without anyone the roster retired (roster.js RETIRED): a guide entry that lingers summons nobody. */
export const living=catalogue=>catalogue.filter(r=>r&&!isRetired(r.name));
/** Picks the cast and the place: a resident, someone who plausibly shares a scene with them, and where. */
function stage(rng,catalogue,{need=2,place=null,who=null}={}){
 const people=living(catalogue).map(castMember);
 const A=who?people.find(p=>p.name===who):rng.pick(people);
 // Only a place with its backdrops photographed (places.js STORY_PLACES) is set; a regular of a place still waiting
 // for its pictures is a visitor elsewhere meanwhile.
 const home=STORY_PLACES.filter(p=>p.regulars.includes(A.name));
 const where=place||(home.length&&rng.chance(.6)?rng.pick(home):rng.pick(STORY_PLACES));
 let B=null;
 if(need>1){
  const friend=people.find(p=>p.name===A.friend),regular=people.filter(p=>p.name!==A.name&&where.regulars.includes(p.name));
  B=friend&&rng.chance(.45)?friend:regular.length&&rng.chance(.5)?rng.pick(regular):rng.pick(people.filter(p=>p.name!==A.name));
 }
 return {A,B,place:where,thing:rng.pick(where.things),doing:rng.pick(where.doing)};
}

const pose=(spec,rng)=>spec?{pose:Array.isArray(spec[0])?rng.pick(spec[0]):spec[0],expression:spec[1]}:null;

/**
 * The camera for a panel, by its place in the strip: an establishing shot first, the twist
 * (third panel) favouring the dramatic angles, and a pay-off that can go either way.
 */
export const SHOTS=Object.freeze(['wide','medium','close','eyes','low','high','dutch','close-thing']);
function chooseShot(rng,index,people){
 const by=[['wide','wide','medium','high'],['medium','medium','close','low'],['close','eyes','low','dutch','high','medium'],['medium','wide','close','low','dutch']][index];
 const shot=rng.pick(by);return people<2&&shot==='eyes'?'close':shot;
}

/** One four-panel comic. */
export function tellComic(rng,catalogue,opts={}){
 const long=opts.long??rng.chance(.4);
 // A genre that needs a particular kind of place is only told there.
 const fits=g=>!g.places||!opts.place||g.places.includes(opts.place.id);
 const genre=opts.genre?GENRES.find(g=>g.id===opts.genre):rng.pick(GENRES.filter(fits));
 const place=opts.place||(genre.places?feedPlace(rng.pick(genre.places.filter(id=>STORY_PLACES.some(p=>p.id===id)))):null);
 // A genre with a `lead` is about that resident unless the caller names another.
 const ctx={...stage(rng,catalogue,{need:genre.cast,who:genre.lead??null,...opts,place}),vars:{}};
 // A story about one of A's own things (belongings.js) binds it, its tale and where it is kept.
 if(genre.belonging){const b=rng.pick(ctx.A.belongings);if(!b)throw Error(ctx.A.name+' owns nothing for a '+genre.id+' story');Object.assign(ctx.vars,{lost:b.what,tale:b.tale,keeps:b.keeps});}
 for(const [k,options] of Object.entries(genre.bind||{}))ctx.vars[k]=expand(rng.pick(options),ctx,rng);
 let previous=null;const panels=[];
 // A third resident, in case the ending wants someone to walk in.
 ctx.C=castMember(rng.pick(living(catalogue).filter(r=>r.name!==ctx.A.name&&r.name!==ctx.B?.name)));
 const twist=!genre.beats[3].some(o=>o.cast==='C')&&rng.chance(.28);
 genre.beats.forEach((options,index)=>{
  if(index===3&&twist)options=ENDINGS.filter(e=>ctx.B||(!e.line.includes('{B')&&!e.b));
  // Coherent, not necessarily funny: an option may only answer the option it fits (after), or
  // belong to certain kinds of place (kinds).
  const fit=options.filter(o=>(!o.after||o.after.includes(previous?.tag))&&(!o.kinds||o.kinds.includes(ctx.place.kind)));
  const beat=rng.pick(fit.length?fit:options.filter(o=>!o.after&&!o.kinds));previous=beat;
  const line=sentence(expand(beat.line,ctx,rng));
  const actors=beat.cast==='C'?[{name:ctx.C.name,...pose(beat.a,rng)}]:[{name:ctx.A.name,...pose(beat.a,rng)},...(ctx.B?[{name:ctx.B.name,...pose(beat.b,rng)}]:[])];
  const focus=beat.focus?ctx[beat.focus].name:beat.say?ctx[beat.say].name:actors[0].name;
  panels.push({say:beat.say?ctx[beat.say].name:null,line,actors,focus,shot:beat.shot||chooseShot(rng,index,actors.length),...choosePanelFx(rng,actors,index,beat)});
 });
 // Longer strips (and every Sunday) open on the place and pause before the pay-off.
 if(long||opts.sunday){
  const all=[{name:ctx.A.name,pose:'Idle',expression:'neutral'},...(ctx.B?[{name:ctx.B.name,pose:'Idle',expression:'neutral'}]:[])];
  if(genre.beats[0].every(o=>o.shot!=='wide'))panels.unshift({say:null,line:sentence(expand(rng.pick(OPENINGS),ctx,rng)),actors:all,focus:ctx.A.name,shot:'wide',fx:[],bg:null,sfx:null});
  const last=panels.length-1,before=panels[last-1],who=before.actors.find(a=>a.name!==before.say)||before.actors[0];
  const look={pose:rng.pick(['Idle','Think','Shrug']),expression:rng.pick(['surprised','thinking','worried'])};
  const reaction=rng.pick(REACTIONS);
  panels.splice(last,0,{say:reaction&&!['…','!'].includes(reaction)?who.name:null,line:['!','…'].includes(reaction)?'':reaction,actors:before.actors.map(a=>a.name===who.name?{name:a.name,...look}:{...a}),focus:who.name,shot:rng.pick(['close','close','eyes','dutch']),fx:before.actors.map(a=>a.name===who.name?(reaction==='!'?'!':rng.pick(['sweat','…','?!'])):null),bg:rng.chance(.4)?'focus':null,sfx:null});
  if(opts.sunday){const extra=panels[2];panels.splice(3,0,{...extra,shot:extra.shot==='wide'?'medium':'high',line:'',say:null,sfx:rng.pick(['…','TICK TOCK','RUSTLE']),fx:extra.fx.map(()=>null)});}
 }
 // What they are doing there: a drink each at Minato, a can on the pier, sitting or standing.
 const act=ctx.place.activity||{},props={};
 for(const who of [ctx.A,ctx.B].filter(Boolean))if(act.hold&&rng.chance(act.chance??.5))props[who.name]=rng.pick(act.hold);
 const sitting=rng.chance(act.sit??0);
 // The same framing twice reads as a mistake: a repeated establishing shot moves up high, any
 // other repeat back to a medium shot or the low angle.
 const seen=new Set();for(const p of panels){if(seen.has(p.shot)&&p.shot!=='eyes')p.shot=p.shot==='wide'?'high':seen.has('medium')?'low':'medium';seen.add(p.shot);}
 return {type:'comic',genre:genre.id,title:sentence(expand(rng.pick(genre.title),ctx,rng)),place:ctx.place.id,placeName:ctx.place.name,cast:[...new Set(panels.flatMap(p=>p.actors.map(a=>a.name)))],props,sitting,panels};
}

/** A recipe a resident claims, with one step that has no business being there. */
export function tellRecipe(rng,catalogue,opts={}){
 const ctx={...stage(rng,catalogue,{need:2,...opts}),vars:{}};
 const [dish,needs]=rng.pick(RECIPE.dish);ctx.vars.dish=expand(dish,ctx,rng);const key=expand(needs,ctx,rng);
 ctx.vars.main=expand(rng.pick(RECIPE.main),ctx,rng);
 const ingredients=[...new Set([key,ctx.vars.main,...rng.sample(RECIPE.ingredients,4).map(i=>expand(i,ctx,rng))])].slice(0,6);
 // Four steps in the order a cook does them.
 const steps=rng.sample(RECIPE.steps.map((step,i)=>[i,step]),4).sort((a,b)=>a[0]-b[0]).map(([,step])=>expand(step,ctx,rng));
 steps.splice(1+rng.int(steps.length-1),0,expand(rng.pick(RECIPE.odd),ctx,rng));
 return {type:'recipe',title:sentence(expand(rng.pick(RECIPE.title),ctx,rng)),place:ctx.place.id,placeName:ctx.place.name,cast:[ctx.A.name],
  by:ctx.A.name,serves:1+rng.int(4),minutes:5*(2+rng.int(8)),ingredients:ingredients.map(sentence),steps:steps.map(sentence),tip:sentence(expand(rng.pick(RECIPE.tip),ctx,rng))};
}

/** A short course: something a resident is good at, in three lessons. */
export function tellCourse(rng,catalogue,opts={}){
 const ctx={...stage(rng,catalogue,{need:2,...opts}),vars:{}};
 ctx.vars.topic=expand(rng.pick(COURSE.topic),ctx,rng);
 const lessons=rng.sample(COURSE.lesson,3).map(l=>sentence(expand(l,ctx,rng)));
 return {type:'course',title:sentence(expand(rng.pick(COURSE.title),ctx,rng)),place:ctx.place.id,placeName:ctx.place.name,cast:[ctx.A.name],by:ctx.A.name,lessons,exam:sentence(expand(rng.pick(COURSE.exam),ctx,rng))};
}

/** One overheard line, one panel. */
export function tellOverheard(rng,catalogue,opts={}){
 const ctx={...stage(rng,catalogue,{need:2,...opts}),vars:{}};
 const line=expand(rng.pick(OVERHEARD),ctx,rng);
 const post={type:'overheard',title:'Overheard at '+ctx.place.short,place:ctx.place.id,placeName:ctx.place.name,cast:[ctx.A.name],by:ctx.A.name,line,
  actors:[{name:ctx.A.name,pose:rng.pick(['Point','Shrug','Think','HandsOnHips','Laugh']),expression:rng.pick(['happy','thinking','grumpy','surprised','content'])}]};
 Object.assign(post,choosePanelFx(rng,post.actors,0));return post;
}

/** The day's edition: the same date always gives the same posts. */
export function dailyEdition(date,catalogue){
 const day=typeof date==='string'?date:date.toISOString().slice(0,10);
 const rng=seeded('johansson-town-feed:'+day);
 // Sunday is the big funny page.
 const sunday=new Date(day+'T12:00:00Z').getUTCDay()===0;
 const posts=[tellComic(rng,catalogue,{sunday}),rng.chance(.5)?tellRecipe(rng,catalogue):tellCourse(rng,catalogue),tellOverheard(rng,catalogue)];
 if(rng.chance(.5))posts.splice(2,0,tellComic(rng,catalogue,{long:false}));
 return posts.map((post,i)=>({...post,id:day+'-'+i,date:day}));
}
