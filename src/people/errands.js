/**
 * Errands: a resident asks Johansson to do something for them, and a small story
 * happens whichever way it goes.
 *
 * Learned from the Animal Crossing games (docs/ANIMAL-CROSSING-STUDY.md): every request
 * a villager makes runs through the same steps, each with its own lines for every
 * personality: the ask, yes or no, a check-in while it is under way, the hand-over, the
 * thank-you, and the ways it can go wrong (too late, pockets full, given to the wrong
 * person). Because the steps are shared, one new kind of errand is a handful of lines,
 * and each ending is a story the town can tell afterwards (the `moment` of each step).
 *
 * The kinds are the town's own, and each says why someone would ask:
 *   deliver  take something of theirs to a friend they cannot visit today
 *   fetch    buy them something from the shop that sells it, because they are working
 *   return   get back a thing they lent, because asking themselves is awkward
 * An errand lasts until the end of the town day it was asked on.
 *
 * Pure: the state is a plain object kept in the save; steps return the line to say
 * (marked up for dialogue/markup.js) and the moment to record.
 */
import {renderLine,seedOf} from '../dialogue/markup.js';

export const ERRAND_KINDS=Object.freeze({
 deliver:'take {item} to {to}',
 fetch:'buy {item} at {place}',
 return:'get {item} back from {to}',
});

const S=(sunny,dramatic,easy,dry)=>Object.freeze({sunny,dramatic,easy,dry});

/** The ask, per kind; the other steps are shared by every kind. */
const ASK=Object.freeze({
 deliver:S('{face:happy}Can you do me a favour?{p} Take {item} to {to} for me?{p} I promised,{p} but I’m stuck here!',
  '{face:worried}I made a promise to {to}.{p:2} {item}.{p} Today.{p} And I cannot leave.{p} Will you go in my place?',
  '{face:smile}Hey,{p} you going past {to}’s?{p} Could you drop off {item}?{p} No rush.{p} Well,{p} today.',
  '{face:neutral}A request.{p} {item},{p} to {to},{p} today.{p} I would go myself,{p} but I am working.'),
 fetch:S('{face:happy}I’m dying for {item}!{p} Could you get me one from {place}?{p} I’ll pay you back!',
  '{face:worried}I have not had {item} all day.{p:2} I may not survive.{p} {place} has them.{p} Please.',
  '{face:smile}If you’re near {place},{p} grab me {item}?{p} I’ll pay you back.{p} Promise.',
  '{face:neutral}I require {item},{p} from {place}.{p} I will reimburse you in full.'),
 return:S('{face:sweatdrop}So,{p} um,{p} I lent {to} {item} ages ago.{p} Could you ask for it back?{p} It’s awkward for me!',
  '{face:dismay}{to} has had {item} of mine for a month.{p:2} A month!{p} I cannot ask.{p} Our friendship would not survive it.',
  '{face:sweatdrop}{to} borrowed {item} a while back.{p} Could you get it?{p} I keep forgetting to ask.',
  '{face:neutral}{to} has {item} of mine.{p} The loan has expired.{p} Please collect it.'),
});

const STEPS=Object.freeze({
 accepted:S('{face:happy}Yay!{p} Thank you thank you!','{face:relieved}You have saved me.{p} I will not forget it.','{face:smile}Nice.{p} Thanks.','{face:neutral}Thank you.{p} Before the end of the day,{p} please.'),
 declined:S('{face:sad}Oh.{p} OK!{p} Maybe next time!','{face:dismay}I see.{p:2} I shall manage.{p} Alone.','{face:smile}No worries.{p} I’ll figure it out.','{face:neutral}Understood.{p} I will make other arrangements.'),
 checkIn:S('{face:smile}Did you do it yet?{p} No pressure!{p} A bit of pressure.','{face:worried}The sun is moving,{p} {name}.{p} The day is not long.','{face:smile}No hurry.{p} Just,{p} you know,{p} today.','{face:neutral}The errand is still open.{p} The day ends at midnight.'),
 // The resident at the other end, when it is a delivery or a return.
 handOver:S('{face:surprised}For me?{p} From {from}?{p} Aww!','{face:surprised}{from} sent this?{p:2} Then {from} did not forget.','{face:smile}Oh,{p} from {from}?{p} Cool,{p} thanks.','{face:neutral}From {from}.{p} Received.{p} Thank you for the delivery.'),
 handBack:S('{face:embarrassed}Oh no,{p} I still had that?!{p} Sorry!{p} Here!','{face:embarrassed}I have been found out.{p:2} Take it.{p} Tell {from} I am ashamed.','{face:sweatdrop}Oh,{p} right.{p} That.{p} Here you go.','{face:neutral}I did have it.{p} Please return it with my apologies.'),
 done:S('{face:happy}You did it!{p} You’re the best!{p} Here,{p} for your trouble!','{face:starstruck}It is done.{p:2} You are a true friend.{p} Take this,{p} I insist.','{face:smile}Thanks,{p} really.{p} Here’s a little something.','{face:neutral}Done,{p} and on time.{p} Your payment,{p} as agreed.'),
 late:S('{face:sad}Oh,{p} it’s tomorrow now.{p} That’s OK!{p} I sorted it out.','{face:bawling}The day ended.{p:2} The promise is broken.{p} It is not your fault.{p} Mostly.','{face:smile}Ah,{p} too late,{p} but whatever.{p} It worked out.','{face:neutral}The deadline passed.{p} I have noted it.{p} Without blame.'),
 pocketsFull:S('{face:surprised}Your bag’s full!{p} Make some room and come back!','{face:dismay}Your bag cannot take it.{p} Return when it can.','{face:smile}Bag’s full,{p} huh.{p} Come back after.','{face:neutral}Your bag is full.{p} Clear one space.'),
 wrongPerson:S('{face:surprised}Huh?{p} This isn’t for me!{p} It’s for {to}!','{face:surprised}This was meant for {to}.{p:2} Not me.{p} Alas.','{face:smile}Pretty sure that’s for {to},{p} not me.','{face:neutral}This is addressed to {to}.{p} Incorrect recipient.'),
});

/** What the town records when each ending happens: a sentence the storyteller can use. */
const MOMENTS=Object.freeze({
 accepted:'{from} asked Johansson to {task}.',
 declined:'{from} asked Johansson to {task}, and he said no.',
 done:'Johansson helped {from}: he went to {task}.',
 late:'Johansson promised {from} he would {task}, and the day ran out.',
});

export const DAY=1440;
const dayOf=m=>Math.floor(m/DAY);
const fill=(t,e)=>t.replace(/\{(from|to|item|place|task)\}/g,(_,k)=>k==='task'?fill(ERRAND_KINDS[e.kind],e):e[k]??'');

/**
 * A new errand, offered. `kind` is one of ERRAND_KINDS; `item` is the thing; `to` the
 * other resident (deliver, return); `place` the shop (fetch); `reward` in yen.
 */
export function offerErrand({kind,from,temper='easy',item,to=null,place=null,minutes,reward=200}){
 if(!ERRAND_KINDS[kind]||!from||!item)return null;
 if((kind==='deliver'||kind==='return')&&!to)return null;
 if(kind==='fetch'&&!place)return null;
 return {id:`${kind}:${from}:${dayOf(minutes)}`,kind,from,temper,item,to,place,day:dayOf(minutes),reward,status:'offered',
  // A delivery starts in Johansson's hands; a return or a fetch ends there.
  carrying:kind==='deliver'};
}

/** The line someone says at a step, rendered. `speaker` defaults to the asker. */
export function errandLine(errand,step,{playerName='Johansson',speaker,temper}={}){
 const table=step==='ask'?ASK[errand.kind]:STEPS[step];if(!table)return null;
 const t=temper||errand.temper,source=fill(table[t]||table.easy,errand);
 return renderLine(source,{name:playerName,speaker:speaker||errand.from,seed:seedOf(errand.id,step)});
}

function moment(errand,status){const t=MOMENTS[status];return t?fill(t,errand):null;}

/** Yes or no to the ask. */
export function answer(errand,yes){
 if(errand?.status!=='offered')return null;
 errand.status=yes?'accepted':'declined';
 return {step:errand.status,moment:moment(errand,errand.status)};
}

/** Ends an errand that has run past its day. Returns the step, or null if still open. */
export function expire(errand,minutes){
 if(errand?.status!=='accepted'||dayOf(minutes)<=errand.day)return null;
 errand.status='late';return {step:'late',moment:moment(errand,'late')};
}

/**
 * Johansson talks to `who` while the errand is open. `bagFull` says whether he has room
 * for what they would hand him. Returns which step happens, or null for an ordinary chat.
 */
export function visit(errand,who,{minutes,bagFull=false,bought=false}={}){
 // After a delivery, the asker's thanks, once.
 if(errand?.status==='done'&&errand.kind==='deliver'&&who===errand.from&&!errand.thanked){errand.thanked=true;return {step:'done',speaker:who};}
 if(errand?.status!=='accepted')return null;
 const late=expire(errand,minutes);if(late)return who===errand.from?late:null;
 const {kind}=errand;
 // A delivery is done when it is in the right hands: nothing has to go back, so the asker
 // says thank you the next time they see him (and by letter), not as a step he must make.
 if(kind==='deliver'&&errand.carrying&&who===errand.to){errand.carrying=false;errand.handed=true;errand.status='done';return {step:'handOver',speaker:who,done:true,reward:errand.reward,moment:moment(errand,'done')};}
 if(kind==='return'&&!errand.carrying&&who===errand.to){if(bagFull)return {step:'pocketsFull',speaker:who};errand.carrying=true;return {step:'handBack',speaker:who};}
 if(kind==='fetch'&&!errand.carrying&&bought){errand.carrying=true;}
 if(who===errand.from){
  const finished=(kind==='deliver'&&errand.handed)||((kind==='return'||kind==='fetch')&&errand.carrying);
  if(finished){errand.status='done';errand.carrying=false;return {step:'done',speaker:who,reward:errand.reward,moment:moment(errand,'done')};}
  return {step:'checkIn',speaker:who};
 }
 // Showing the parcel to the wrong neighbour gets a polite correction.
 if(errand.carrying&&kind==='deliver')return {step:'wrongPerson',speaker:who};
 return null;
}

/** Keeps a saved errand only if it is well formed. */
export function restoreErrand(saved){
 if(!saved||typeof saved!=='object'||!ERRAND_KINDS[saved.kind])return null;
 const statuses=['offered','accepted','declined','done','late'];
 if(!statuses.includes(saved.status)||!Number.isSafeInteger(saved.day)||typeof saved.from!=='string'||typeof saved.item!=='string')return null;
 const str=v=>typeof v==='string'?v.slice(0,80):null;
 return {id:String(saved.id).slice(0,200),kind:saved.kind,from:saved.from.slice(0,60),temper:['sunny','dramatic','easy','dry'].includes(saved.temper)?saved.temper:'easy',
  item:saved.item.slice(0,80),to:str(saved.to),place:str(saved.place),day:saved.day,reward:Math.max(0,Math.min(5000,Math.round(Number(saved.reward)||0))),
  status:saved.status,carrying:saved.carrying===true,handed:saved.handed===true,thanked:saved.thanked===true};
}
