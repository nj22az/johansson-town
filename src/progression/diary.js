import {townDate,townDay,okinawaSeason,townCalendarAt} from '../town-clock.js';

/**
 * Johansson's diary: one page a day.
 *
 * The lesson of a summer-holiday game's picture diary is that a day is remembered by one
 * thing. Everything worth remembering that happens is offered as a moment with a weight
 * (a dated happening outweighs a purchase; a present outweighs a chat), and the page for a
 * day is written from the heaviest -- with one or two lesser things after it. A day when
 * nothing much happened still gets a page, from a pool of quiet-day entries that are never
 * used twice, so no two pages read alike.
 *
 * state.diary = {moments:{[day]:[{text,weight,kind,who?,news?,id?}]}, pages:{[day]:string}, quiet:[used]}
 *
 * The moments are also the town's shared memory (docs/ANIMAL-CROSSING-STUDY.md): the diary
 * is one retelling, the evening news and the residents' letters are others. A moment can
 * say who it is about (`who`) and carry the news's own sentence (`news`), so each retelling
 * keeps its own voice: the diary in Johansson's first person, the news in the third. An
 * `id` lets a story step be recorded once even when its words change.
 */
export const MOMENT_WEIGHT=Object.freeze({happening:5,friend:4,gift:3,discovery:3,work:2,meal:2,note:1});
const QUIET=Object.freeze({
 any:[
  'Nothing much happened, which on this island is its own kind of event. I watched the ferry come in and decided that counted.',
  'A quiet day. Wrote three letters in my head and posted none of them.',
  'Slept badly, walked well. The harbour smells of diesel and something frying.',
  'Bought nothing, said little, and came home feeling I had been somewhere.',
  'The radio at Sakura played the same song twice. Thuan pretended not to sing along.',
  'Counted the stray cats on the way home: five, or the same one four times.',
  'Sat on the sea wall until the light went orange. That was the day.',
 ],
 winter:['The north wind came round today and the whole town put on a cardigan at once.','A grey sea and a grey sky and, between them, one very bright fishing boat.'],
 spring:['The hibiscus on the corner has opened. Everyone walking past slows down a little.','Swallows under the bus shelter roof again. Nobody has the heart to move them.'],
 rainy:['Rain all day, the warm kind. The frogs were delighted. I was less so.','My shoes have not been dry for a week. Tsuyu, they call it. I call it a lot.'],
 summer:['Too hot to do anything properly, so I did several things badly. The cicadas approved.','Ate a Blue Coral ice cream faster than it could melt. A personal best.'],
 autumn:['The first cool evening. The crickets have taken over from the cicadas, like a night shift.','The light is lower and kinder now. Even the harbour cranes look thoughtful.'],
});
const ensure=state=>{state.diary||={moments:{},pages:{},quiet:[]};state.diary.moments||={};state.diary.pages||={};state.diary.quiet||=[];return state.diary;};

/** A moment as it is kept: bounded strings, at most four names. */
function cleanMoment(m){
 const out={text:String(m.text).slice(0,280),kind:String(m.kind||'note').slice(0,24),weight:Number(m.weight)||1};
 const who=Array.isArray(m.who)?m.who.filter(n=>typeof n==='string'&&n).slice(0,4).map(n=>n.slice(0,60)):[];
 if(who.length)out.who=who;
 if(typeof m.news==='string'&&m.news)out.news=m.news.slice(0,280);
 if(typeof m.id==='string'&&m.id)out.id=m.id.slice(0,120);
 return out;
}
/** The moments of one town day, heaviest first (a copy: readers cannot change the record). */
export function momentsOn(state,day){
 return [...(state?.diary?.moments?.[day]||[])].sort((a,b)=>b.weight-a.weight).map(m=>({...m,...(m.who?{who:[...m.who]}:{})}));
}

/** Offer something to today's page. A repeat of the same text the same day is ignored. */
export function recordMoment(state,minutes,{text,kind='note',weight,who,news,id}={}){
 if(!text)return;
 const diary=ensure(state),day=townDay(minutes),list=diary.moments[day]||=[];
 if(list.some(m=>m.text===text||(id&&m.id===id)))return;
 list.push(cleanMoment({text,kind,weight:Number.isFinite(weight)?weight:MOMENT_WEIGHT[kind]??1,who,news,id}));
 // Keep the record small: a fortnight of moments, the best dozen of each day.
 list.sort((a,b)=>b.weight-a.weight).splice(12);
 for(const d of Object.keys(diary.moments))if(+d<day-14)delete diary.moments[d];
}

// The page's year is the device's own, like its weekday (the owner, 26 October 2026: "they use normal date device date,
// they only live like it's the 90's"; johansson-town/AGENTS.md). A fixed 1997 put the real weekday beside a year it
// does not belong to ("Monday 17 August 1997").
const DATE_LINE=minutes=>{const {month,day,weekday}=townDate(minutes),year=townCalendarAt(minutes).date.getFullYear();return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][weekday]+' '+day+' '+['January','February','March','April','May','June','July','August','September','October','November','December'][month-1]+' '+year;};

/**
 * The page for the day `minutes` falls on. Once a day has been written it stays written;
 * today's page is rewritten as the day goes on.
 */
export function diaryPage(state,minutes){
 const diary=ensure(state),day=townDay(minutes),today=townDay(state.minutes??minutes);
 if(diary.pages[day]&&day<today)return diary.pages[day];
 const moments=[...(diary.moments[day]||[])].sort((a,b)=>b.weight-a.weight);
 // A quiet page once written stays: reopening the diary must not use up another entry.
 if(!moments.length&&diary.pages[day])return diary.pages[day];
 let body;
 if(moments.length){
  const [best,...rest]=moments;
  body=best.text+(rest.length?'\n\n'+rest.slice(0,2).map(m=>m.text).join(' '):'');
 }else{
  // A quiet day: the season's own entries first, never one already used.
  const pool=[...QUIET[okinawaSeason(minutes)],...QUIET.any],fresh=pool.filter(t=>!diary.quiet.includes(t));
  const pick=(fresh.length?fresh:pool)[day%(fresh.length||pool.length)];
  if(!diary.quiet.includes(pick))diary.quiet=[...diary.quiet,pick].slice(-60);
  body=pick;
 }
 const page=DATE_LINE(minutes)+'\n\n'+body;
 diary.pages[day]=page;
 for(const d of Object.keys(diary.pages))if(+d<day-60)delete diary.pages[d];
 return page;
}
/** Days with a page, newest first. */
export function diaryDays(state,minutes){
 const diary=ensure(state),today=townDay(minutes);
 return [...new Set([today,...Object.keys(diary.pages).map(Number),...Object.keys(diary.moments).map(Number)])].filter(d=>d<=today).sort((a,b)=>b-a);
}
/** A diary from a save, cleaned: only sane records survive. */
export function restoreDiary(saved){
 const out={moments:{},pages:{},quiet:[]};if(!saved||typeof saved!=='object')return out;
 for(const [d,list] of Object.entries(saved.moments||{}))if(/^\d+$/.test(d)&&Array.isArray(list))out.moments[d]=list.filter(m=>m&&typeof m.text==='string').slice(0,12).map(cleanMoment);
 for(const [d,page] of Object.entries(saved.pages||{}))if(/^\d+$/.test(d)&&typeof page==='string')out.pages[d]=page.slice(0,1200);
 if(Array.isArray(saved.quiet))out.quiet=saved.quiet.filter(t=>typeof t==='string').slice(-60);
 return out;
}
