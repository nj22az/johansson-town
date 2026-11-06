/**
 * The post: letters written to the mayor, brought up from the mailbag at Ms Ganaha's counter at the Port Terminal
 * (people/ganaha.js, since phase 3 of docs/CAST-CONSOLIDATION.md; the postman retired in phase 4) and dropped through
 * the door of the mayor's home into the box inside it.
 *
 * A letter is sent for a day (the favour's, or the morning after something happened) and
 * is written when the round brings it, so the sender's P.S. points at what is true that day.
 * The mailbag comes off the morning boat and is sorted by half past ten (ROUND), so a letter for a day arrives then. A
 * letter for an earlier day that could not be delivered (a box full of unread letters)
 * waits for the next round rather than being lost.
 *
 * state.post = {box:[letter], pending:[{id, day, occasion, from, gift?, place?, body?}], sent:[id]}
 * Pure: no DOM. activities.js shows the box; game.js runs the round.
 */
import {composeLetter,deliver,restoreMail,OCCASIONS,own} from './letters.js';

export const ROUND=10*60+30;
const DAY=1440;
const dayOf=m=>Math.floor(m/DAY);
const str=(v,n)=>typeof v==='string'&&v?v.slice(0,n):null;

export function ensurePost(state){
 state.post||={box:[],pending:[],sent:[]};
 for(const k of ['box','pending','sent'])if(!Array.isArray(state.post[k]))state.post[k]=[];
 return state.post;
}

/**
 * Sends a letter to arrive with the round on `day`. The same id is never sent twice, even
 * after the letter has been read and thrown away. Returns whether it was sent.
 */
export function sendLetter(state,{id,day,occasion,from,gift=null,place=null,body=null}){
 const post=ensurePost(state);
 if(!id||!own(OCCASIONS,occasion)||!from||!Number.isSafeInteger(day))return false;
 if(post.sent.includes(id)||post.pending.some(p=>p.id===id))return false;
 post.pending.push({id,day,occasion,from,...(gift?{gift}:{}),...(place?{place}:{}),...(body?{body}:{})});
 return true;
}

/** Whether the round has been for a letter meant for `day`, at `minutes`. */
export const dueBy=(day,minutes)=>dayOf(minutes)>day||(dayOf(minutes)===day&&((minutes%DAY)+DAY)%DAY>=ROUND);

/**
 * The round: every letter that is due is written and put in the box.
 * `senderOf(name)` gives {name, temper, favourite?, clue?}. Returns the letters delivered.
 */
export function postRound(state,minutes,{senderOf,playerName='Johansson'}){
 const post=ensurePost(state),delivered=[];
 for(const p of [...post.pending].sort((a,b)=>a.day-b.day)){
  if(!dueBy(p.day,minutes))continue;
  // A clue is worth saying once: if a letter already in the box carried it, this one uses
  // the sender's own P.S. instead.
  let sender=senderOf(p.from);
  if(sender?.clue&&post.box.some(l=>l.from===p.from&&l.ps==='P.S. '+sender.clue))sender={...sender,clue:null};
  const letter=sender&&composeLetter({occasion:p.occasion,sender,day:p.day,playerName,gift:p.gift||null,place:p.place||null,body:p.body||null,id:p.id});
  // A letter that cannot be written (its sender has gone) is dropped; one that cannot fit waits.
  if(letter&&!deliver(post.box,letter))continue;
  post.pending=post.pending.filter(x=>x!==p);
  post.sent=[...post.sent,p.id].slice(-80);
  if(letter)delivered.push(letter);
 }
 return delivered;
}

/**
 * After a long absence (seven or more real days), the friends who know him best write to
 * say so: only friends (a heart or more of friendship), the closest first, at most `max`.
 * Nobody writes "where have you been?" to a stranger. Returns the letters to send.
 */
export const MISSED_AFTER_DAYS=7,MISSED_FRIEND_POINTS=10;
export function lettersForReturn({friendship={},daysAway=0,day,max=2}){
 if(!(daysAway>=MISSED_AFTER_DAYS)||!Number.isSafeInteger(day))return [];
 return Object.entries(friendship||{}).filter(([,r])=>Number(r?.points)>=MISSED_FRIEND_POINTS)
  .sort((a,b)=>b[1].points-a[1].points||a[0].localeCompare(b[0])).slice(0,max)
  .map(([from])=>({id:`missed:${from}:${day}`,day,occasion:'missed',from}));
}

/** The saved post, cleaned. */
export function restorePost(saved){
 const out={box:[],pending:[],sent:[]};if(!saved||typeof saved!=='object')return out;
 out.box=restoreMail(saved.box);
 if(Array.isArray(saved.pending))out.pending=saved.pending.filter(p=>p&&str(p.id,200)&&own(OCCASIONS,p.occasion)&&str(p.from,60)&&Number.isSafeInteger(p.day)).slice(-20)
  .map(p=>{const o={id:p.id.slice(0,200),day:p.day,occasion:p.occasion,from:p.from.slice(0,60)};for(const [k,n] of [['gift',80],['place',80],['body',600]]){const v=str(p[k],n);if(v)o[k]=v;}return o;});
 if(Array.isArray(saved.sent))out.sent=saved.sent.filter(id=>typeof id==='string').slice(-80).map(id=>id.slice(0,200));
 return out;
}
