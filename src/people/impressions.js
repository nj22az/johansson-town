/**
 * Impressions: what a resident makes of the mayor, from what he has really done with them.
 *
 * Tomodachi Life's islanders remember who was kind to them, and Animal Crossing's villagers
 * bring up what you did last week (docs/ANIMAL-CROSSING-STUDY.md). Here the memory is the
 * diary's moments (progression/diary.js) of the last fortnight that name the resident:
 * favours he kept, favours he let run late or turned down, presents and drinks. Nothing
 * else counts, so a resident never thanks him for something that did not happen.
 *
 * A favour he turned down or let run late is only known to the one who asked: the friend
 * it was for never heard about it. A kept delivery is known to both; a thing fetched back,
 * only to the one who asked for it.
 *
 * The impression is said once, the next time they talk and nothing else comes first (a
 * favour, today's happening), and again only when it changes. Pure: activities.js says it.
 */
import {renderLine,seedOf} from '../dialogue/markup.js';
import {favourById} from './favours.js';

export const IMPRESSION_DAYS=14;

const G=(sunny,dramatic,easy,dry)=>Object.freeze({sunny,dramatic,easy,dry});
/** Most telling first: a broken promise is remembered before a kept one. */
export const IMPRESSIONS=Object.freeze([
 {id:'let-down',why:'He said yes to their favour and the day ran out, at least as often as he kept one.',
  when:d=>d.late>0&&d.late>=d.kept,
  lines:G('{face:sad}You forgot about that favour the other day,{p} didn’t you?{p} {face:smile}It’s OK!{p} Mostly OK!',
   '{face:sad}A promise,{p} {name}.{p:2} The day ended,{p} and the promise with it.{p} I have forgiven you.{p} I have not forgotten.',
   '{face:smile}That favour the other day kind of slipped,{p} huh.{p} No hard feelings.',
   '{face:neutral}The other day you said yes,{p} and then the day ran out.{p} Next time,{p} say no.{p} It is quicker.')},
 {id:'kept-word',why:'He did a favour they asked for, or brought them one.',
  when:d=>d.kept>0,
  lines:G('{face:happy}You know what people say about you?{p} Ask {name},{p} and it gets done!{p} I say it too.',
   '{face:smug}A mayor who keeps his word.{p:2} I had heard of such men.{p} I had not met one.',
   '{face:smile}You get things done,{p} huh.{p} People have noticed.',
   '{face:neutral}You did what was asked.{p} I have made a note of it.{p} A good note.')},
 {id:'turned-down',why:'He said no to two of their favours, and kept none.',
  when:d=>d.declined>=2,
  lines:G('{face:smile}You’re always so busy!{p} One day you’ll say yes to me.{p} You’ll see!',
   '{face:sad}I asked,{p} and you were busy.{p:2} I asked again.{p} Busy.{p} The life of a mayor.',
   '{face:smile}You’ve been busy lately,{p} huh.{p} That’s fine.{p} Another time.',
   '{face:neutral}You have said no to me twice.{p} I respect a man who knows his diary.')},
 {id:'generous',why:'He gave them a present or stood them a drink, twice or more.',
  when:d=>d.gifts+d.drinks>=2,
  lines:G('{face:happy}You keep spoiling me!{p} People will talk!{p} I’ll make sure they do!',
   '{face:happy}Gifts,{p} {name}.{p} Again.{p:2} The town will say I have a patron.{p} Let it.',
   '{face:smile}You’re a generous guy,{p} you know that?{p} Thanks.{p} Really.',
   '{face:neutral}You have been generous lately.{p} I am keeping a list.{p} It is a nice list.')},
]);
const KNOWN=new Set(IMPRESSIONS.map(i=>i.id));

/** What the mayor has done with `name` in the last fortnight, from the diary's moments. */
export function deedsWith(state,name,minutes){
 const today=Math.floor(minutes/1440),d={kept:0,late:0,declined:0,gifts:0,drinks:0};
 for(const [day,list] of Object.entries(state?.diary?.moments||{})){
  if(!(+day<=today&&+day>today-IMPRESSION_DAYS)||!Array.isArray(list))continue;
  for(const m of list){
   if(!m?.who?.includes(name))continue;
   const fav=/^favour:(.+):(done|late|declined)$/.exec(m.id||'');
   // A delivery is known to both ends; getting something back only to the one who asked (the holder handed it over
   // and never saw it arrive); a refusal or a lapse only to the one who asked.
   if(fav){const f=favourById(fav[1]);if(fav[2]==='done'){if(f?.kind!=='return'||f.from===name)d.kept++;}else if(f?.from===name)d[fav[2]==='late'?'late':'declined']++;continue;}
   if(m.kind==='gift')d.gifts++;else if(/^Bought .+ a drink/.test(m.text))d.drinks++;
  }
 }
 return d;
}

export function impressionOf(state,name,minutes){
 const d=deedsWith(state,name,minutes);return IMPRESSIONS.find(i=>i.when(d))||null;
}

/**
 * The line to say now, or null: only when their impression differs from the last one they
 * said (state.impressions[name]). The caller records it as said.
 */
export function impressionLine(state,name,minutes,{temper='easy',playerName='Johansson'}={}){
 const i=impressionOf(state,name,minutes);if(!i||state.impressions?.[name]===i.id)return null;
 const r=renderLine(i.lines[temper]||i.lines.easy,{name:playerName,speaker:name,seed:seedOf(name,i.id)});
 return {id:i.id,...r};
}

export function restoreImpressions(saved){
 const out={};if(!saved||typeof saved!=='object')return out;
 for(const [name,id] of Object.entries(saved))if(typeof name==='string'&&name.length<=60&&KNOWN.has(id))out[name]=id;
 return out;
}
