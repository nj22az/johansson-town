/**
 * Letters: residents write to Johansson, and Johansson can write back.
 *
 * Learned from the Animal Crossing games (docs/ANIMAL-CROSSING-STUDY.md): a resident's
 * letter is put together from three parts written separately for each personality and
 * occasion, the greeting, the body and the P.S. A few of each multiply into many
 * letters that still sound like one person. A letter can carry a present, and the P.S.
 * is where a letter wanders off topic, which is what makes it feel written by hand.
 *
 * Here the parts are written for the town's four temperaments (people/chat-lines.js):
 * sunny, dramatic, easy and dry. Nothing is random:
 *  - the occasion is why the letter was sent (a favour to ask, a thank-you for a present or
 *    for help, a long absence, a typhoon warning), and the town decides when that happened.
 *    Johansson has lived here since 1979 (the photograph in his home): nobody writes to him
 *    as a newcomer;
 *  - the present, when there is one, is the sender's own favourite thing (their tastes
 *    in resident-personalities.js), because people share what they love;
 *  - the P.S. is the sender's own clue when they have one (profiles.json), so a letter
 *    points somewhere real and opens the next story;
 *  - the stationery is the one that sender would choose (STATIONERY.by).
 * Which of the written variants a letter uses is picked by a seed from the sender, the
 * occasion and the day, so the same letter reads the same every time it is opened.
 *
 * Pure data and rules: no DOM. A mailbox in the save holds at most ten letters, as the
 * games' mailbox does; the oldest read letter makes way first.
 */
import {renderLine,seedOf} from '../dialogue/markup.js';

export const MAILBOX_SIZE=10;
export const TEMPERS=Object.freeze(['sunny','dramatic','easy','dry']);

const L=(sunny,dramatic,easy,dry)=>Object.freeze({sunny:Object.freeze(sunny),dramatic:Object.freeze(dramatic),easy:Object.freeze(easy),dry:Object.freeze(dry)});

/**
 * Each occasion: when it is sent, and the parts. Every greeting works with every body
 * and every body with every P.S. of the same temperament, so any combination is a
 * letter one person could have written. {name} is Johansson.
 */
export const OCCASIONS=Object.freeze({
 favour:Object.freeze({subject:'a favour to ask',why:'A resident asks the mayor to call in: the start of a favour (people/favours.js). The favour can bring its own body.',gift:false,place:true,
  greeting:L(['Dear Mayor!','Hi, {name}!'],['My dear Mayor,','{name}, I need you.'],['Hi {name},','Morning, Mayor,'],['Dear Mayor,','{name},']),
  body:L(['Could you come by {place} today? I have a favour to ask, and you are the only one I trust with it! It is a small one. Mostly.','Are you free today? Pop in at {place}! I need a hand with something, and I will explain when you get here!'],
   ['I must ask something of you, and it cannot be put in a letter. Come to {place} today. You will understand.','A small matter has become a large one. Come to {place} when you can. Today, ideally.'],
   ['If you’re passing {place} today, come in for a minute? I have a little favour to ask. No rush. Well, today.','Could you stop by {place} when you get a chance? Nothing serious, just a small favour.'],
   ['I have a favour to ask. It is best explained at {place}. Today, during opening hours.','Please call at {place} today. The matter is small and the explanation is short.'])}),
 helped:Object.freeze({subject:'thank you',why:'Sent the morning after the mayor did a favour for this resident. It encloses their favourite thing when they have one; the words never promise it.',gift:'optional',
  greeting:L(['Mayor!!','Dear {name}!'],['My dear {name},','Mayor,'],['Hi {name},','Hey Mayor,'],['Dear Mayor,','{name},']),
  body:L(['Thank you SO much for helping yesterday! I told everyone. Well, three people. But they were very impressed!','You did it! I knew you would! Thank you for helping me out yesterday. Best mayor this island has ever had. I have not met the others, but still!'],
   ['Yesterday you did me a kindness, and I have not stopped thinking about it. A town is only as good as the people who help. Thank you.','I asked, and you came. Do you know how rare that is? I do. Thank you, from the bottom of everything.'],
   ['Thanks for helping out yesterday. It made things a lot easier. I owe you one.','Just wanted to say thanks for yesterday. Really. You didn’t have to, and you did.'],
   ['Thank you for your help yesterday. It was done promptly and correctly. I have made a note of it.','Your help yesterday was appreciated. I am writing to say so, so that it is on paper.']),
  ps:L(['P.S. Come by any time!','P.S. I am still smiling about it!'],
   ['P.S. I shall remember this.','P.S. Do not let anyone tell you small kindnesses are small.'],
   ['P.S. Tea’s on me next time.','P.S. No need to reply.'],
   ['P.S. No reply is required.','P.S. I have kept a copy.'])}),
 thanks:Object.freeze({subject:'thank you for the present',why:'Sent the morning after Johansson gave this resident a present.',gift:true,
  greeting:L(['{name}! Guess what!','Dearest {name},'],['My dear {name},','{name}, I must write to you at once.'],['Hey {name},','Hi {name},'],['Dear {name},','{name},']),
  body:L(['Thank you SO much for the present! I put it right where I can see it every morning. I have enclosed something I love too, so now we are even. Or not even, but happy!','You remembered what I like! Nobody remembers! I am sending you some of mine, because a good thing is better shared.'],
   ['Your gift arrived at the end of a very hard week, and it changed the whole week. I am not exaggerating. Well, a little. Please take this in return.','I have kept your present on the windowsill, in the good light. In return, the best thing I have. Do not argue.'],
   ['Thanks for the present. It was nice of you. I’m sending one back, mostly because it was right here on the table.','That was kind of you, really. Here’s one of my favourites. Don’t eat it all at once. Or do, I won’t tell.'],
   ['Thank you for the present. I have written it down, with the date. Enclosed is one of mine, which I consider a fair exchange.','Your present was appropriate and well chosen. I have enclosed a return present of roughly equal value.']),
  ps:L(['P.S. You are officially my favourite neighbour this week!','P.S. Write back! I love getting letters!'],
   ['P.S. I may have wept a little. Do not mention it.','P.S. Nobody has given me a present since the typhoon of ’93.'],
   ['P.S. The enclosed tastes best on the sea wall at sunset.','P.S. No need to write back. But you can.'],
   ['P.S. Please do not feel obliged to reply. Though a reply would be correct.','P.S. Roughly equal. I checked the prices.'])}),
 missed:Object.freeze({subject:'where have you been?',why:'Sent when Johansson comes back after a week or more away (by the real calendar).',gift:false,
  greeting:L(['{name}!!! You’re back!','Oh, {name}!'],['{name}, at last.','{name}! Where have you been?'],['Hey {name}, long time.','Hi {name},'],['Dear {name},','{name},']),
  body:L(['The street felt quiet without you! I kept looking for you at the bus stop. Come by and tell me everything you did!','I nearly sent a search party! Then I remembered I am the only member. Anyway, welcome home!'],
   ['Days passed. The ferry came and went. I looked at the horizon and wondered. Next time, leave a note.','I had begun to compose your farewell song. Three verses in. I am almost sorry to stop.'],
   ['You were away a while. That’s fine. The town kept your bench warm. More or less.','Didn’t see you around for a bit. Hope it was a good trip. The sea didn’t go anywhere.'],
   ['You have been absent for some time. I assumed you were busy, and did not worry more than was reasonable.','I noticed your absence on day three and have kept a tally since. It was getting long.'])}),
 typhoon:Object.freeze({subject:'storm warning',why:'Sent on a day the town has a typhoon warning: a neighbour checking on him.',gift:false,
  greeting:L(['{name}! Storm day!','Hi {name}!'],['{name}, the sky is turning.','{name}! Brace yourself!'],['Hey {name},','{name},'],['Dear {name},','{name}, a notice.']),
  body:L(['The radio says a typhoon is on the way! Shutters closed, candles out, snacks ready. If you get bored, knock. We can play cards!','Big wind coming! I tied down my plants and my bicycle, and nearly myself. Stay safe inside!'],
   ['They say this one is strong. Fill a bucket with water, tape your windows, and keep this letter as proof that someone cared.','I have seen the sea go grey like this before. Stay in. Promise me. The quay is no place for heroes today.'],
   ['There’s a storm coming. Shutters down, kettle on, and don’t go out unless you have to. It’ll pass. They always pass.','Typhoon day. Good excuse to stay in. Got rice? Got water? Then you’re fine.'],
   ['A typhoon warning has been issued. Close the shutters, fill the bath, charge the torch. Stay off the quay until it has passed.','Checklist: shutters, water, torch, radio, rice. Tick each one. I have enclosed no checklist, but this letter will do.'])}),
});

/** P.S. lines for occasions without their own (the missed and typhoon letters). */
const PS_FALLBACK=L(['P.S. I left something on my doorstep for you to guess about.','P.S. Say hi to Tama for me!'],
 ['P.S. Burn this letter. No, keep it.','P.S. Some days the sea is too beautiful to bear.'],
 ['P.S. See you at the bench.','P.S. Bring snacks.'],
 ['P.S. Please confirm receipt in person.','P.S. I have kept a copy.']);

/**
 * Writing paper, made for the town. Each one says who would choose it, so a letter's
 * paper matches its sender (the colours are drawn by stationerySvg).
 */
export const STATIONERY=Object.freeze({
 hibiscus:Object.freeze({name:'Hibiscus',by:'sunny',why:'Bright flowers from the buckets by Sakura’s door, for people who sign with exclamation marks.',paper:'#fff6ef',ink:'#7a2f3a',accent:'#e0546a',motif:'hibiscus'}),
 'storm-sky':Object.freeze({name:'Storm sky',by:'dramatic',why:'Dark clouds over the sea, for letters that are an event.',paper:'#eef1f6',ink:'#24314a',accent:'#5a6f96',motif:'clouds'}),
 kraft:Object.freeze({name:'Kraft',by:'easy',why:'Brown paper bags from Sakura, cut to size. Free, and fine.',paper:'#e8d6b5',ink:'#4a3a28',accent:'#a5865a',motif:'none'}),
 ledger:Object.freeze({name:'Ledger',by:'dry',why:'Ruled sheets from Front-Row Books & Stationery, for people who number their points.',paper:'#fbfaf3',ink:'#22303a',accent:'#9fb6c4',motif:'rules'}),
 'quay-blue':Object.freeze({name:'Quay blue',by:null,why:'The harbour in a band of waves; the town’s own paper, sold at the post counter.',paper:'#f3f8fb',ink:'#1f4560',accent:'#5b9cc0',motif:'waves'}),
});
export const stationeryFor=temper=>Object.keys(STATIONERY).find(id=>STATIONERY[id].by===temper)||'quay-blue';

/** A sheet of writing paper as an SVG string (width × height in pixels). */
export function stationerySvg(id,width=360,height=480){
 const s=STATIONERY[id]||STATIONERY['quay-blue'];
 const w=Math.max(120,Math.round(width)),h=Math.max(160,Math.round(height));
 let art='';
 if(s.motif==='rules')for(let y=72;y<h-24;y+=28)art+=`<line x1="24" y1="${y}" x2="${w-24}" y2="${y}" stroke="${s.accent}" stroke-width="1"/>`;
 if(s.motif==='waves'){
  let d=`M0 ${h-34}`;for(let x=0;x<=w;x+=30)d+=` q15 -12 30 0`;
  art+=`<path d="${d}" fill="none" stroke="${s.accent}" stroke-width="3"/><path d="${d.replace(`M0 ${h-34}`,`M0 ${h-20}`)}" fill="none" stroke="${s.accent}" stroke-opacity=".5" stroke-width="2"/>`;
 }
 if(s.motif==='clouds')art+=`<path d="M0 64 q40 -36 80 -8 q34 -30 74 -2 q36 -26 76 4 q40 -24 ${w-230} 0 V0 H0 Z" fill="${s.accent}" fill-opacity=".35"/>`;
 if(s.motif==='hibiscus'){
  const flower=(cx,cy,r)=>[0,72,144,216,288].map(a=>{const t=a*Math.PI/180;return `<ellipse cx="${(cx+Math.cos(t)*r*.55).toFixed(1)}" cy="${(cy+Math.sin(t)*r*.55).toFixed(1)}" rx="${(r*.5).toFixed(1)}" ry="${(r*.32).toFixed(1)}" transform="rotate(${a} ${(cx+Math.cos(t)*r*.55).toFixed(1)} ${(cy+Math.sin(t)*r*.55).toFixed(1)})" fill="${s.accent}"/>`;}).join('')+`<circle cx="${cx}" cy="${cy}" r="${(r*.16).toFixed(1)}" fill="#f6d36b"/>`;
  art+=flower(w-40,40,26)+flower(w-84,22,14);
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="6" fill="${s.paper}"/>${art}</svg>`;
}

const pick=(list,seed,salt)=>list[seedOf(seed,salt)%list.length];
/** A table's own key only: a save cannot name `toString` and reach Object's methods. */
export const own=(table,key)=>typeof key==='string'&&Object.hasOwn(table,key);

/**
 * Writes one letter. `sender` is {name, temper, favourite?, clue?}; `day` is the town
 * day it was sent. Returns the letter as data, ready for the mailbox, or null if the
 * occasion is not one the town writes.
 */
export function composeLetter({occasion,sender,day,playerName='Johansson',gift=null,place=null,body=null,id=null}){
 const o=own(OCCASIONS,occasion)?OCCASIONS[occasion]:null;
 if(!o||!sender?.name)return null;
 const present=o.gift?(gift||sender.favourite||null):null;
 // A thank-you for a present says something is enclosed, so it is only written when
 // something is; a thank-you for help encloses one when they have one to give.
 if(o.gift===true&&!present)return null;
 if(o.place&&!place&&!body)return null;
 const temper=TEMPERS.includes(sender.temper)?sender.temper:'easy';
 const seed=seedOf(sender.name,occasion,day);
 const fill=line=>renderLine(String(line).replace(/\{place\}/g,place||''),{name:playerName,speaker:sender.name,seed}).text;
 const greeting=fill(pick(o.greeting[temper],seed,'g'));
 // A favour can bring its own words: the story is the favour's, the voice the sender's.
 const text=fill(body||pick(o.body[temper],seed,'b'));
 // Their own clue first: it points at somewhere real. Otherwise their temperament's P.S.
 const ps=sender.clue?'P.S. '+sender.clue:fill(pick((o.ps||PS_FALLBACK)[temper],seed,'p'));
 return Object.freeze({id:id||`${occasion}:${sender.name}:${day}`,occasion,from:sender.name,temper,day,
  greeting,body:text,ps,signoff:sender.name,gift:present,stationery:stationeryFor(temper),read:false});
}

/** What the envelope says in the list: who, and what about. */
export const letterLabel=l=>`${l.from} · ${OCCASIONS[l.occasion]?.subject||'a letter'}${l.read?'':' · new'}`;

/** The whole letter as plain text, as the reading screen and the tests see it. */
export const letterText=l=>`${l.greeting}\n\n${l.body}\n\n${l.signoff}\n\n${l.ps}`;

/** Restores the saved mailbox, keeping only well-formed letters and at most ten. */
export function restoreMail(saved){
 if(!Array.isArray(saved))return [];
 const str=(v,n)=>typeof v==='string'?v.slice(0,n):'';
 return saved.filter(l=>l&&typeof l.id==='string'&&own(OCCASIONS,l.occasion)&&typeof l.from==='string'&&Number.isSafeInteger(l.day))
  .slice(-MAILBOX_SIZE).map(l=>({id:str(l.id,200),occasion:l.occasion,from:str(l.from,60),temper:TEMPERS.includes(l.temper)?l.temper:'easy',day:l.day,
   greeting:str(l.greeting,200),body:str(l.body,600),ps:str(l.ps,300),signoff:str(l.signoff||l.from,60),
   gift:typeof l.gift==='string'?l.gift.slice(0,80):null,stationery:own(STATIONERY,l.stationery)?l.stationery:'quay-blue',read:l.read===true}));
}

/**
 * Puts a letter in the box. The same letter is never delivered twice. When the box is
 * full the oldest read letter makes way; if every letter is unread, the new one waits
 * (returns false) rather than throwing away one he has not seen.
 */
export function deliver(box,letter){
 if(!letter||box.some(l=>l.id===letter.id))return false;
 if(box.length>=MAILBOX_SIZE){
  const i=box.findIndex(l=>l.read);
  if(i<0)return false;
  box.splice(i,1);
 }
 box.push({...letter});return true;
}

/** Opens a letter: marks it read and hands over its present once. */
export function openLetter(box,id){
 const l=box.find(x=>x.id===id);if(!l)return null;
 const present=l.read?null:l.gift;
 l.read=true;
 return {letter:l,present};
}
export const unreadCount=box=>box.filter(l=>!l.read).length;

/**
 * What a resident thinks of a letter Johansson wrote, from 0 to 4. The games score a
 * player's letter by how much of it is real words; this asks the questions a person
 * reading it would: did he greet me, use my name, say something, sign it, and not shout?
 * Returns {score, notes} so the reply can say what they liked.
 */
export function rateLetter(text,{to='',from='Johansson'}={}){
 const t=String(text||'').trim(),notes=[];let score=0;
 const words=t.split(/\s+/).filter(Boolean);
 const letters=t.replace(/[^A-Za-z]/g,'');
 const caps=letters?letters.replace(/[^A-Z]/g,'').length/letters.length:0;
 const mashed=/(.)\1{4,}/.test(t)||words.some(w=>w.length>6&&!/[aeiouy]/i.test(w));
 if(/^(dear|hi|hello|hey|good (morning|evening|day))\b/i.test(t)){score++;notes.push('greeted');}
 if(to&&new RegExp(`\\b${to.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(t)){score++;notes.push('used my name');}
 if((t.match(/[.!?](\s|$)/g)||[]).length>=2&&words.length>=12){score++;notes.push('said something');}
 if(from&&new RegExp(`(^|\\n)\\s*(from |love,? |yours,? |—\\s*|-\\s*)?${from}\\s*$`,'i').test(t)){score++;notes.push('signed it');}
 if(letters.length>20&&caps>.6){score=Math.max(0,score-2);notes.push('shouting');}
 if(mashed){score=0;notes.push('keyboard mash');}
 return {score:Math.min(4,score),notes};
}
