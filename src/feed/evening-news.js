import {townDate,townDay} from '../town-clock.js';
import {momentsOn} from '../progression/diary.js';
import {happeningsOn} from '../people/happenings.js';
import {typhoonTomorrow,typhoonAt} from '../world/typhoons.js';
import {birthdaysOn} from '../people/birthdays.js';

/**
 * The Minato Evening News, on the town's televisions from six in the evening (Mr Fujita's shed set after he signs off).
 *
 * Tomodachi Life's nightly news reports what really happened on the island that day, and
 * it is a story the player did not have to write (docs/ANIMAL-CROSSING-STUDY.md, section 7).
 * Here the bulletin reads the day's moments (progression/diary.js): only the ones that
 * carry a `news` sentence, because the news speaks in its own voice, the heaviest first,
 * at most three. A day with no news gets one quiet-day item instead: small, true to the
 * town and a little absurd, and never the same one twice until they have all been used.
 *
 * Pure apart from remembering which quiet item each day used (state.news), so the same
 * evening reads the same however often the set is switched on.
 */
export const NEWS_FROM=18*60;
export const NEWS_ITEMS=3;

/** Quiet days. Each is about something that is really in the town. */
export const QUIET_NEWS=Object.freeze([
 'The harbour office reports that the tide came in this morning and went out again this afternoon. Both were on time.',
 'Tama, the cat from the quay, was seen leaving the market with a whole squid. The market says it is looking into it. Tama has not commented.',
 'Sakura Shōten’s radio played the same song twice before lunch. Staff deny singing along.',
 'A gull stood on the roof of the harbour office for most of the afternoon. Staff say it looked important.',
 'The ferry was late. Islanders were not surprised, and have asked us not to call this news.',
 'At the old Front-Row shop, a reader finished a whole novel in the window seat. The honesty tin is calling it a review copy.',
 'Blue Coral says its busiest hour was the one after school. The ice cream did not last.',
 'The steam from Umi-no-yu was seen from the ferry pier at dusk. Bathers report that the water was, once again, hot.',
]);

const WEEKDAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];

/** Whether the set shows the news at this minute (from six until midnight). */
export const newsOn=minutes=>((minutes%1440)+1440)%1440>=NEWS_FROM;

function ensure(state){
 state.news||={days:{},quiet:[]};state.news.days||={};state.news.quiet||=[];return state.news;
}

/** The town's calendar: the festivals and days of the year (not the weekly ones), by date. */
const annual=h=>!!(h.on.date||h.on.dates);
const atWords=minute=>{const h=Math.floor(minute/60),m=minute%60,hour=h%12===0?12:h%12;return `${m?hour+':'+String(m).padStart(2,'0'):hour+' o’clock'} ${h<12?'in the morning':h<18?'in the afternoon':'in the evening'}`;};
/**
 * What is coming tomorrow, so a festival has a build-up: the calendar's day, and a
 * typhoon on its way (when the weather follows the town; a weather the player fixed is
 * the weather, and the news does not contradict it).
 */
export function tomorrowItems(minutes,{weather=true}={}){
 const items=[],next=minutes+1440,start=Math.floor(next/1440)*1440;
 // The storm first, so a festival it will call off can refer to it.
 const t=weather&&typhoonTomorrow(minutes);
 if(t)items.push(`The weather: Typhoon No. ${t.number} is expected to come near Okinawa tomorrow.`);
 for(const h of happeningsOn(next).filter(annual)){
  const title=(h.name||h.title).replace(/^The /,'the '),timed=h.hours[1]>h.hours[0];
  // A typhoon's rain over all of an outdoor happening's hours will very likely call it off: say so, not "from 7:30".
  const storm=weather&&h.dry&&timed&&typhoonAt(start+h.hours[0])&&typhoonAt(start+h.hours[1]-1);
  items.push(storm?`Tomorrow: ${title}, though with Typhoon No. ${storm.number} near it is likely to be called off.`:timed?`Tomorrow: ${title}, from ${atWords(h.hours[0])}.`:`Tomorrow: ${title}.`);
 }
 for(const who of birthdaysOn(next))items.push(who==='Johansson'?'Tomorrow is chief engineer Johansson’s birthday.':`Tomorrow is ${who}’s birthday.`);
 return items;
}

/**
 * Today's bulletin: {title, items:[string], quiet:boolean, text}. What happened today
 * comes from the day's moments, which is where the town records its festivals and its
 * typhoons as well as what Johansson did; what is coming comes from the calendar.
 */
export function eveningNews(state,minutes,{weather=true}={}){
 const day=townDay(minutes),{month,day:date,weekday}=townDate(minutes);
 const items=momentsOn(state,day).filter(m=>m.news).slice(0,NEWS_ITEMS).map(m=>m.news);
 let quiet=false;
 if(!items.length){
  quiet=true;
  const news=ensure(state);
  let pick=news.days[day];
  if(!QUIET_NEWS.includes(pick)){
   const fresh=QUIET_NEWS.filter(t=>!news.quiet.includes(t)),pool=fresh.length?fresh:QUIET_NEWS;
   pick=pool[day%pool.length];
   news.days[day]=pick;news.quiet=[...news.quiet.filter(t=>t!==pick),pick].slice(-QUIET_NEWS.length+1);
   for(const d of Object.keys(news.days))if(+d<day-14)delete news.days[d];
  }
  items.push(pick);
 }
 items.push(...tomorrowItems(minutes,{weather}));
 const title='Minato Evening News';
 const opening=`Good evening. This is the Minato Evening News for ${WEEKDAYS[weekday]} ${date} ${MONTHS[month-1]}.`;
 const text=[opening,...items,'That was the news. Goodnight from Minato.'].join('\n\n');
 return {title,items,quiet,text};
}

/** The saved record, cleaned: quiet items it knows, for the last fortnight of days. */
export function restoreNews(saved){
 const out={days:{},quiet:[]};if(!saved||typeof saved!=='object')return out;
 for(const [d,t] of Object.entries(saved.days||{}))if(/^\d+$/.test(d)&&QUIET_NEWS.includes(t))out.days[d]=t;
 if(Array.isArray(saved.quiet))out.quiet=saved.quiet.filter(t=>QUIET_NEWS.includes(t)).slice(-QUIET_NEWS.length);
 return out;
}
