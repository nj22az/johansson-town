/**
 * Favours: what a resident asks the mayor to do for them, written from who they are.
 *
 * A favour is an errand (people/errands.js) with its own story: who asks, who it is for,
 * the thing, and why. That why is the residents' own facts (profiles.json, the shops'
 * stock), so the story makes sense and the town remembers it. It starts with a letter in
 * the post (mail/post.js), plays out in conversations, and every step that matters is a
 * moment (progression/diary.js) that the diary and the evening news retell in their own
 * words. The next morning the asker writes to say thank you.
 *
 * Lines here are the favour's own; any step without one uses the shared errand lines in
 * the speaker's temperament. Cues are dialogue/markup.js's.
 */
import {offerErrand,answer,expire,visit,errandLine,restoreErrand} from './errands.js';
import {renderLine,seedOf} from '../dialogue/markup.js';

export const FAVOURS=Object.freeze([
 Object.freeze({
  id:'nhung-cookbook',kind:'deliver',from:'Nhung',to:'Thao',item:'Cookery book',at:'Minato Clinic',
  // The town's own facts, as the game shows them, which is why this favour exists.
  why:[
   'Thao (people/residents.js, her gossip): "Nhung says I am stubborn. I say I am right."',
   'Nhung (her name tab): "Playful mischief, the eldest sister"; the three sisters, Nhung, Thao and Thuan (people/neighbour-chats.js).',
   'Nhung (profiles.json, hello): she bookmarks the funny parts.',
   'Minato (people/izakaya-beer.js DISHES): Thao serves a rolled dashi omelette.',
   'Front-Row Books (world/interiors/bookshop-detail.js): a Cookery section on the east wall, the reading copies that stayed when Nhung became the doctor.',
   'Nhung is the island doctor (people/clinic-hours.js): in surgery hours she hands it over at the clinic, between patients; on a Sunday, at Sakura’s counter.',
  ],
  // Nhung's surgery ends at 17:00 and Minato opens at 16:00 (clinic-hours.js, profiles.json): it is asked by day,
  // handed over in the evening, and done by midnight.
  askBy:15*60,
  // Asked while Nhung is at the clinic (until 17:00); Minato is open into the night, so it can be done today.
  askUntil:17*60,
  letter:'I have found something for my sister Thao, and it cannot come from me. Could you come and find me today? In surgery hours I am at the clinic, between my patients; on a Sunday, at Sakura’s counter.',
  thanks:'Thank you for yesterday. Thao has not said a word about the book, which means she has read it. Not a word to her, please.',
  lines:Object.freeze({
   ask:'{face:scheme}Thao says her dashi omelette is perfect as it is.{p} This cookery book disagrees,{p} and I have bookmarked the page.{p:2} {face:smile}Take it to Minato for me?{p} From her big sister,{p} she would never open it.',
   accepted:'{face:happy}Thank you.{p} Say it was your idea.{p} Minato opens at four.',
   checkIn:'{face:smile}Minato opens at four.{p} She is the one behind the counter,{p} being right about everything.',
   handOver:'{face:surprised}A cookery book?{p} For me?{p:2} {face:dry}Bookmarked at the omelette page.{p} My sister sent this.{p:2} {face:pouting}Tell her I am still right.{p} Actually,{p} tell her nothing.',
   done:'{face:smug}So my sister has a new cookery book.{p} She will make the omelette my way by Friday and say it was her own idea.{p} Thank you,{p} {name}.',
   late:'{face:smile}Ah,{p} the day ran out.{p} Never mind.{p} Give it here.{p} I will leave it on her doorstep,{p} and she can think it was the wind.',
  }),
  moments:Object.freeze({
   accepted:{text:'Nhung gave me a cookery book to take to her sister Thao at Minato. It must not look as if it came from her.',kind:'friend'},
   declined:{text:'Nhung asked me to take a cookery book to her sister Thao. I said not today.',kind:'note'},
   done:{text:'Took the cookery book to Thao. She saw through it at once, and kept it anyway.',kind:'friend',
    news:'A cookery book has turned up at Minato, bookmarked at the page for a rolled dashi omelette. Owner Thao says her omelette was already perfect. Front-Row Books has no comment.'},
   late:{text:'I promised Nhung I would take the cookery book to Thao, and the day ran out.',kind:'note'},
  }),
  friendship:Object.freeze({Nhung:10,Thao:3}),
 }),
 Object.freeze({
  // Phase 4 of docs/CAST-CONSOLIDATION.md retired the Bus driver this favour went to. It is Mrs Sato's delivery box
  // now, the one that carries his noon bowls up from Sato Ramen (people/belongings.js); the id is kept, so a save in
  // the middle of it carries on. The favour calendar (one-day-slice) asks that both ends walk the town: she does.
  id:'harbour-timetable',kind:'deliver',from:'Harbour master',to:'Mrs Sato',item:'Delivery box',at:'the harbour office',
  why:[
   'Mrs Sato (people/belongings.js): her aluminium delivery box "at noon carries two bowls to the harbour office".',
   'Harbour master and Mrs Sato (people/cast.js RELATIONSHIPS): old flames; "he eats her ramen every day and never says why".',
   'Harbour master (activities.js): "The harbour office is staffed around the clock. I stay on the quay." So he cannot take it back himself.',
   'Hours (profiles.json): the harbour master 5:00 to 14:00, Mrs Sato at Sato Ramen 9:00 to 21:00.',
  ],
  // Asked before the harbour master goes off at two; handed over at Sato Ramen before six.
  askBy:12*60+30,
  // Asked while the harbour master is in (until 14:00), leaving the afternoon to walk the box up Main Street.
  askUntil:13*60+45,doneBy:18*60,
  letter:'A small matter of a box. Mrs Sato’s delivery box came up with the noon bowls and she will want it back for the evening. Call in at the harbour office before two, if you would.',
  thanks:'Thank you for taking the box back. The bowls came up at noon as they always do, and she said nothing, as she always does. I have checked the box. I have not checked the bowls.',
  lines:Object.freeze({
   ask:'{face:dry}Every noon Mrs Sato sends two bowls up in her box,{p} and every noon the box goes back empty.{p:2} Today it is still on my desk.{p} {face:smile}Would you take it down to Sato Ramen for me?{p} I do not leave the quay.',
   accepted:'{face:smile}Thank you.{p} Tell her the bowls were good.{p} Today.',
   checkIn:'{face:dry}Sato Ramen,{p} on Main Street.{p} She is at the stove until nine;{p} she will pretend not to see the box.',
   checkInAfter:'{face:dry}The afternoon has gone by now,{p} and the box is not going anywhere tonight.{p} Never mind.{p} It can wait for the morning.',
   handOver:'{face:surprised}My box!{p} I was going to send Tetsuo for it.{p:2} {face:smile}Did he eat both bowls?{p} Of course he ate both bowls.{p} Tell him nothing.{p} He knows.',
   done:'{face:smile}She has it back?{p} Good.{p} Tomorrow there will be three bowls,{p} and no explanation.{p} Thank you,{p} {name}.',
   late:'{face:dry}The day ran out,{p} and the box is still here.{p} Never mind.{p} I will send it down in the morning,{p} with a note of my own for once.',
  }),
  moments:Object.freeze({
   accepted:{text:'The harbour master gave me Mrs Sato’s delivery box to take back to her at Sato Ramen.',kind:'friend'},
   declined:{text:'The harbour master asked me to take the delivery box back to Mrs Sato. I said not today.',kind:'note'},
   done:{text:'Took the delivery box back to Mrs Sato at Sato Ramen. She said nothing about the harbour master, at length.',kind:'friend',
    news:'Mrs Sato’s delivery box is back at Sato Ramen from the harbour office. The noon bowls will go up tomorrow as usual; nobody at either end has said why.'},
   late:{text:'I promised the harbour master I would take the delivery box to Mrs Sato, and the day ran out.',kind:'note'},
  }),
  friendship:Object.freeze({'Harbour master':10,'Mrs Sato':3}),
 }),
 Object.freeze({
  id:'nhung-rain-book',kind:'return',from:'Nhung',to:'Harbour master',item:'Rain-stained book',at:'Minato Clinic',
  why:[
   'Nhung (profiles.json, her clue): "A rain-stained book is drying at the harbour office."',
   'Nhung (profiles.json, hello): "I bookmark the funny parts — apparently that is not how a lending library works."',
   'Harbour master (profiles.json, hello): "I can predict rain by my knees."; he stays on the quay (activities.js).',
   'Hours (clinic-hours.js, profiles.json): Nhung at the clinic 9:00 to 17:00, the harbour master 5:00 to 14:00.',
  ],
  // The book is with the harbour master, who goes off at two: asked in the morning.
  askBy:12*60,
  // Asked in time to reach the harbour office before the harbour master goes off at two.
  askUntil:13*60,doneBy:14*60,
  letter:'A book of ours went out in the rain and ended up drying at the harbour office instead of coming home. Could you call in at the clinic today? I will explain between patients.',
  thanks:'Thank you for bringing the book home. It is back on the window shelf, a little wavy and very proud of itself. I have put a card in it: reserved for the harbour master.',
  // Her clue said the book was drying at the harbour office; once it is home, that is no longer true.
  clueAfter:'The book that went out in the rain is back on our window shelf. Wavy, but readable.',
  lines:Object.freeze({
   ask:'{face:sweatdrop}A customer read one of our books on the quay.{p} In the rain.{p:2} The harbour master took it in to dry.{p} {face:smile}Could you fetch it back for me?{p} He is at the office until two,{p} and I cannot leave the counter.',
   accepted:'{face:happy}Thank you.{p} Carry it flat.{p} It has been through enough.',
   checkIn:'{face:smile}The harbour office,{p} before two.{p} Ask nicely.{p} I think he has grown fond of it.',
   checkInAfter:'{face:smile}He will have gone off by now.{p} The book can have one more night at the office.',
   handBack:'{face:smile}The book?{p} Dry as a biscuit.{p} I turned the pages every hour.{p:2} {face:dry}Chapter six is very good.{p} Tell her I have not finished it.',
   done:'{face:happy}It is dry!{p} Wavy,{p} but dry.{p:2} {face:scheme}And somebody has bookmarked chapter six.{p} I will lend it to him properly.{p} Thank you,{p} {name}.',
   late:'{face:smile}The day ran out?{p} Never mind.{p} The book has been patient.{p} So can I.',
  }),
  moments:Object.freeze({
   accepted:{text:'Nhung asked me to fetch a rain-stained book back from the harbour office, where it has been drying.',kind:'friend'},
   declined:{text:'Nhung asked me to fetch a book back from the harbour office. I said not today.',kind:'note'},
   done:{text:'Brought the rain-stained book back to Front-Row Books. The harbour master had read half of it while it dried.',kind:'friend',
    news:'A book left out in the rain is back on the shelves of Front-Row Books, dried at the harbour office. Staff say it is wavy but readable.'},
   late:{text:'I promised Nhung I would fetch the book from the harbour office, and the day ran out.',kind:'note'},
  }),
  friendship:Object.freeze({Nhung:6,'Harbour master':3}),
 }),
]);
export const favourById=id=>FAVOURS.find(f=>f.id===id)||null;

const DAY=1440;
const dayOf=m=>Math.floor(m/DAY);
const minuteOf=m=>((m%DAY)+DAY)%DAY;

export const FAVOUR_TRIES=3;
const letterId=(f,day)=>`favour:${f.id}:${day}`;
const offerDay=(f,minutes)=>dayOf(minutes)+(minuteOf(minutes)<f.askBy?0:1);
const OPEN=['planned','asked','accepted'];
/**
 * The favour calendar: one favour a day at most, in the order of FAVOURS, and only one on at a time. A favour is
 * offered on a day with time left to do it (today if the morning is young enough, else tomorrow) and never on the
 * same day as the one before. One that was never taken up (he did not call, or did not answer) is offered again on
 * the next such day, up to FAVOUR_TRIES times, the way a neighbour asks again; then it lapses and the next one comes.
 * A favour he said no to, or let run late, is over. Returns the letters to post, each replacing any earlier one for
 * the same favour: [{id, day, occasion:'favour', from, place, body, replaces}].
 */
export function planFavours(state,minutes){
 state.favours||={};const today=dayOf(minutes);
 const letter=(f,day)=>({id:letterId(f,day),day,occasion:'favour',from:f.from,place:f.at,body:f.letter,replaces:`favour:${f.id}:`});
 // Untaken ones first: asked again, or lapsed.
 for(const f of FAVOURS){
  const r=state.favours[f.id];
  if(!(r&&['planned','asked'].includes(r.status)&&today>r.day&&state.errand?.favour!==f.id))continue;
  // It lets go: its last letter, if it has not come yet, is not sent.
  if((r.tries||1)>=FAVOUR_TRIES){r.status='lapsed';if(Array.isArray(state.post?.pending))state.post.pending=state.post.pending.filter(p=>!p.id.startsWith(`favour:${f.id}:`));continue;}
  const day=offerDay(f,minutes);state.favours[f.id]={day,status:'planned',tries:(r.tries||1)+1};
  return [letter(f,day)];
 }
 // One on at a time.
 if(FAVOURS.some(f=>OPEN.includes(state.favours[f.id]?.status))||state.errand?.favour&&OPEN.includes(state.errand.status))return [];
 const next=FAVOURS.find(f=>!state.favours[f.id]);if(!next)return [];
 const last=Math.max(-Infinity,...Object.values(state.favours).map(r=>r.day));
 const day=Math.max(offerDay(next,minutes),Number.isFinite(last)?last+1:-Infinity);
 state.favours[next.id]={day,status:'planned',tries:1};
 return [letter(next,day)];
}

/** The favour waiting to be asked by `name` today, once its letter has come: the "!" card's reason. */
export function favourWaiting(state,name,minutes){
 const f=FAVOURS.find(f=>{const r=state.favours?.[f.id];return f.from===name&&r?.status==='planned'&&r.day===dayOf(minutes)&&minuteOf(minutes)<f.askUntil&&state.post?.sent?.includes(letterId(f,r.day));});
 return f&&!errandUnderWay(state)?f:null;
}
/** An errand still being done (offered or accepted). A finished one (done, declined, late) does not stop the next ask. */
export function errandUnderWay(state){return ['offered','accepted'].includes(state.errand?.status);}
/** A resident's clue, true to what has happened: a favour that changes what it says replaces it. */
export function clueFor(name,clue,state){
 const f=FAVOURS.find(f=>f.from===name&&f.clueAfter&&state.favours?.[f.id]?.status==='done');return f?f.clueAfter:clue;
}

/** A favour's line at a step, rendered: its own words, or the shared errand line. */
export function favourLine(f,errand,step,{speaker,temper,playerName='Johansson',minutes=null}={}){
 // Past the hour it can be done by, the check-in says so instead of sending him off.
 if(step==='checkIn'&&f?.doneBy&&f.lines?.checkInAfter&&Number.isFinite(minutes)&&minuteOf(minutes)>=f.doneBy)step='checkInAfter';
 const own=f?.lines?.[step];
 if(own&&(!speaker||speaker===(['handOver','handBack'].includes(step)?f.to:f.from)))return renderLine(own,{name:playerName,speaker:speaker||f.from,seed:seedOf(f.id,step)});
 return errandLine(errand,step,{playerName,speaker,temper});
}

/** Starts the favour: the errand is offered. */
export function askFavour(state,f,{minutes,temper}){
 const errand=offerErrand({kind:f.kind,from:f.from,temper,item:f.item,to:f.to,minutes,reward:0});
 errand.favour=f.id;state.errand=errand;state.favours[f.id].status='asked';
 return errand;
}

/** Yes or no. Returns {step, moment} with the favour's own moment. */
export function replyFavour(state,yes){
 const e=state.errand,f=favourById(e?.favour);const r=answer(e,yes);if(!r)return null;
 state.favours[f.id].status=e.status;
 return {step:r.step,moment:{...f.moments[r.step],who:[f.from,f.to],id:`favour:${f.id}:${r.step}`}};
}

/**
 * Ends what the day has run out on, whoever he is talking to: an accepted favour is late
 * (a moment; the thing goes back when he next sees the asker), and an ask he never
 * answered goes back to be offered again (planFavours). Returns {moment} when it is late.
 */
export function favourExpire(state,minutes){
 const e=state.errand,f=favourById(e?.favour);if(!e||!f||!state.favours?.[f.id])return null;
 // An ask not answered by the time it could still be done goes back to be offered another day.
 if(e.status==='offered'&&(dayOf(minutes)>e.day||minuteOf(minutes)>=f.askUntil)){state.errand=null;state.favours[f.id].status='asked';return null;}
 if(!expire(e,minutes))return null;
 state.favours[f.id].status='late';
 return {moment:{...f.moments.late,who:[f.from,f.to],id:`favour:${f.id}:late`}};
}

/**
 * Johansson talks to `who` with a favour on (call favourExpire first). Returns null for
 * an ordinary chat, or {step, speaker, done?}: the hand-over is where a delivery is done.
 */
export function favourVisit(state,who,{minutes,bagFull=false}={}){
 const e=state.errand,f=favourById(e?.favour);if(!e||!f)return null;
 if(e.status==='late'){if(who===f.from&&!e.lateSaid){e.lateSaid=true;return {step:'late',speaker:who,item:f.item};}return null;}
 const r=visit(e,who,{minutes,bagFull});if(!r)return null;
 // The asker mentions it once a day; after that they talk about other things.
 if(r.step==='checkIn'){if(e.checkedDay===dayOf(minutes))return null;e.checkedDay=dayOf(minutes);}
 // Done at the hand-over for a delivery, back with the asker for a return.
 if(r.done||(r.step==='done'&&r.moment)){state.favours[f.id].status='done';return {...r,done:true,moment:{...f.moments.done,who:[f.from,f.to],id:`favour:${f.id}:done`}};}
 return r;
}

/** The saved favours and the errand on, cleaned. */
export function restoreFavours(saved){
 const out={};if(!saved||typeof saved!=='object')return out;
 for(const f of FAVOURS){const r=Object.hasOwn(saved,f.id)?saved[f.id]:null;if(r&&Number.isSafeInteger(r.day)&&['planned','asked','accepted','declined','done','late','lapsed'].includes(r.status))out[f.id]={day:r.day,status:r.status,tries:Math.max(1,Math.min(FAVOUR_TRIES,Number.isSafeInteger(r.tries)?r.tries:1))};}
 return out;
}
export function restoreFavourErrand(saved){
 const e=restoreErrand(saved);if(!e||!favourById(saved?.favour))return null;
 e.favour=saved.favour;e.lateSaid=saved.lateSaid===true;if(Number.isSafeInteger(saved.checkedDay))e.checkedDay=saved.checkedDay;return e;
}
