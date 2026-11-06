/**
 * Friendship: the first slice of the life engine (docs/AMPLIFY-AUDIT.md, §7).
 *
 * Every resident has a friendship with Johansson, kept in the save as points and shown
 * as five hearts. It grows by talking (once a day each) and by presents, and it grows
 * most by bringing someone the thing they wanted today. Each day a few residents want
 * something small — the snack, drink or meal they are known for, from Sakura or the
 * harbour — and wear a "!" card over their heads until they get it.
 *
 * Pure data and rules: no DOM, no three.js. activities.js asks it what to say and
 * game.js asks it who to put a card over.
 */
import {pierFishOfItem,LEGACY_CATCH} from '../world/okinawa/fish.js';
import {RESIDENT_PERSONALITIES} from './resident-personalities.js';
import {STREET_CAST_NAMES} from './residents.js';

/** Points at which each heart fills: stranger, then five hearts. */
export const HEART_STEPS=Object.freeze([10,30,60,100,150]);
export const LEVEL_NAMES=Object.freeze(['Stranger','Acquaintance','Friend','Good friend','Close friend','Best friend']);

/** What each taste in resident-personalities.js is, as a thing you can carry. */
export const TASTE_ITEMS=Object.freeze({
 bun:'Steamed pork bun',tea:'Green tea',rice:'Plum rice ball',beer:'Umineko lager',soda:'Ramune soda',
 coffee:'Canned coffee',fish:'Taman',cola:'Sea breeze cola',milk:'Asamori milk',
});

const POINTS=Object.freeze({talk:2,gift:3,favourite:6,want:10});
const WANTS_PER_DAY=3;

const dayOf=minutes=>Math.floor(minutes/1440);
/** "a mackerel", "an umineko lager". */
export const withArticle=thing=>(/^[aeiouāēīōū]/i.test(thing)?'an ':'a ')+thing;
const clampName=name=>String(name||'').slice(0,60);

/** The bounded friendship record for one resident, made on first use. */
function record(state,name){
 state.friendship??={};
 const key=clampName(name);
 const r=state.friendship[key]??={points:0,talkDay:-1,giftDay:-1,giftsToday:0,wantDoneDay:-1};
 return r;
}

/** Restores the saved table, keeping only well-formed records for known people. */
export function restoreFriendship(saved){
 const out={};if(!saved||typeof saved!=='object')return out;
 for(const [name,r] of Object.entries(saved)){
  if(!r||typeof r!=='object'||!Number.isFinite(r.points))continue;
  out[clampName(name)]={points:Math.max(0,Math.min(999,Math.round(r.points))),talkDay:Number.isSafeInteger(r.talkDay)?r.talkDay:-1,
   giftDay:Number.isSafeInteger(r.giftDay)?r.giftDay:-1,giftsToday:Number.isSafeInteger(r.giftsToday)?Math.max(0,r.giftsToday):0,
   wantDoneDay:Number.isSafeInteger(r.wantDoneDay)?r.wantDoneDay:-1};
 }
 return out;
}

/** How many hearts (0–5) a number of points is. */
export function heartsFor(points=0){return HEART_STEPS.filter(step=>points>=step).length;}
/** The hearts as text: ♥ filled, ♡ empty. */
export function heartLine(points=0){const n=heartsFor(points);return '♥'.repeat(n)+'♡'.repeat(5-n);}
export const levelName=points=>LEVEL_NAMES[heartsFor(points)];

/** A resident's favourite thing to be given, from their tastes. */
export function favouriteOf(name){
 const p=RESIDENT_PERSONALITIES[name];if(!p)return null;
 return TASTE_ITEMS[p.snack]||TASTE_ITEMS[p.drink]||null;
}

/** A small deterministic shuffle so the same day always wants the same things. */
function seeded(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}

/**
 * Today's wants: who wants what. The same every time it is asked on the same day.
 * @param {number} minutes town clock
 * @param {string[]} names residents who are in town
 * @returns {Array<{name:string,item:string,reward:number}>}
 */
export function wantsFor(minutes,names){
 const day=dayOf(minutes),r=seeded(day*7919+13),pool=names.filter(n=>RESIDENT_PERSONALITIES[n]).slice().sort();
 const out=[];
 while(out.length<WANTS_PER_DAY&&pool.length){
  const name=pool.splice(Math.floor(r()*pool.length),1)[0],p=RESIDENT_PERSONALITIES[name];
  const tastes=[p.snack,p.drink,p.meal,p.shopping].map(t=>TASTE_ITEMS[t]).filter(Boolean);
  if(!tastes.length)continue;
  out.push({name,item:tastes[Math.floor(r()*tastes.length)],reward:100+Math.floor(r()*3)*50});
 }
 return out;
}
/** Today's want for one resident, if they have one and it is not done yet. */
export function openWant(state,minutes,names,name){
 const want=wantsFor(minutes,names).find(w=>w.name===name);
 if(!want)return null;
 return record(state,name).wantDoneDay===dayOf(minutes)?null:want;
}

/** Talking: a little friendship, once a day each. Returns the points gained. */
export function talked(state,name,minutes){
 const r=record(state,name),day=dayOf(minutes);
 if(r.talkDay===day)return 0;
 r.talkDay=day;r.points+=POINTS.talk;return POINTS.talk;
}

/**
 * A present. Favourites count for more, and today's want counts most and pays.
 * A second present the same day is still welcome but adds nothing.
 * @returns {{points:number,yen:number,kind:'want'|'favourite'|'gift'|'again',hearts:number,up:boolean}}
 */
export function gave(state,name,item,minutes,names){
 // Old saves called the pier's catch mackerel, then sea bream; both are a taman now (fish.js).
 item=LEGACY_CATCH[item]||item;
 const r=record(state,name),day=dayOf(minutes),before=heartsFor(r.points);
 if(r.giftDay!==day){r.giftDay=day;r.giftsToday=0;}
 const want=openWant(state,minutes,names,name);
 let kind='gift',points=POINTS.gift,yen=0;
 if(want&&want.item===item){kind='want';points=POINTS.want;yen=want.reward;r.wantDoneDay=day;}
 else if(r.giftsToday>=1){kind='again';points=0;}
 else if(favouriteOf(name)===item){kind='favourite';points=POINTS.favourite;}
 r.giftsToday++;r.points+=points;
 const hearts=heartsFor(r.points);
 return {points,yen,kind,hearts,up:hearts>before};
}

/**
 * A favour done (people/favours.js): it counts as much as bringing what they wanted
 * today, once per favour. Returns {points, hearts, up}.
 */
export function helped(state,name,points=POINTS.want){
 const r=record(state,name),before=heartsFor(r.points);
 r.points=Math.min(999,r.points+Math.max(0,points|0));
 const hearts=heartsFor(r.points);
 return {points,hearts,up:hearts>before};
}

/** What they say when given something. */
export function giftLine(name,item,result){
 const thing=item.toLowerCase();
 if(result.kind==='want')return `Oh! The ${thing} — that is exactly what I was after today. How did you know? Here, take this for your trouble.`;
 if(result.kind==='favourite')return `${withArticle(thing).replace(/^a/,'A')}? You remembered. That is my favourite.`;
 if(result.kind==='again')return `Another present? You are too kind. I will save it for later.`;
 return `For me? Thank you — ${withArticle(thing)}. That is thoughtful of you.`;
}
/** How they mention their want in conversation. */
export function wantLine(want){
 const fish=pierFishOfItem(want.item);
 const where=fish?(fish.id==='taman'?'If you are fishing off the pier tonight':'If you are passing the fishing pier'):'If you are passing Sakura';
 return `${where}, I could really do with ${withArticle(want.item.toLowerCase())} today.`;
}
/**
 * The authored playable cast, bar Thuan, whose presents work their own way. Keep this
 * independent of who is visible or loaded, so cards and conversations agree throughout
 * the day, without assigning errands to retired avatar identities.
 */
export function wantPool(){return STREET_CAST_NAMES.filter(n=>n!=='Thuan'&&RESIDENT_PERSONALITIES[n]);}
