import {townDate} from '../town-clock.js';

/**
 * 1997's typhoons that came near Okinawa, as they really did.
 *
 * The town lives in 1997 (town-clock.js), so its typhoon days are that year's. These are
 * every storm of 1997 whose centre came within 300 km of Naha at tropical-storm strength or
 * more, which is the Japan Meteorological Agency's rule for a typhoon "approaching" the
 * Okinawa region. Times are Japan time (JST) and come from the JMA best-track archive
 * (RSMC Tokyo, bst_all.txt, read 2026-10-11): `from` and `to` are the first and last fixes
 * within 300 km, `closest` the fix nearest Naha. Two near misses are left out because they
 * stayed just outside: No. 19 Oliwa (319 km, 14 September) and No. 23 Ivan (323 km,
 * 23 October). Japan calls a typhoon by its number ("Typhoon No. 13"); the name is the
 * international one.
 *
 * Nothing here changes the ferry or the shops: the town does not stop for weather yet, so
 * nothing that is said about a typhoon may claim it does.
 */
export const TYPHOONS_1997=Object.freeze([
 Object.freeze({number:4,name:'Levi',strength:'a tropical storm',from:'05-29 09:00',to:'05-29 21:00',closest:Object.freeze({at:'05-29 15:00',km:153,hPa:994})}),
 Object.freeze({number:8,name:'Peter',strength:'a severe tropical storm',from:'06-27 00:00',to:'06-27 15:00',closest:Object.freeze({at:'06-27 09:00',km:139,hPa:975})}),
 Object.freeze({number:11,name:'Tina',strength:'a typhoon',from:'08-06 15:00',to:'08-07 21:00',closest:Object.freeze({at:'08-07 06:00',km:128,hPa:960})}),
 Object.freeze({number:13,name:'Winnie',strength:'a typhoon',from:'08-17 03:00',to:'08-18 03:00',closest:Object.freeze({at:'08-17 15:00',km:117,hPa:945})}),
]);

const stamp=(key,minuteOfDay)=>`${key} ${String(Math.floor(minuteOfDay/60)).padStart(2,'0')}:${String(minuteOfDay%60).padStart(2,'0')}`;
const minuteOf=m=>((m%1440)+1440)%1440;
const keyOf=minutes=>townDate(minutes).key;

/** The typhoon whose warning is in force at this town minute, or null. */
export function typhoonAt(minutes){
 const now=stamp(keyOf(minutes),minuteOf(minutes));
 return TYPHOONS_1997.find(t=>now>=t.from&&now<=t.to)||null;
}
/** The typhoon that is near Okinawa at some time on this town day, or null. */
export function typhoonOnDay(minutes){
 const key=keyOf(minutes);
 return TYPHOONS_1997.find(t=>key>=t.from.slice(0,5)&&key<=t.to.slice(0,5))||null;
}
/** The typhoon that will first come near tomorrow, for the evening news's forecast. */
export function typhoonTomorrow(minutes){
 const key=keyOf(minutes+1440);
 return TYPHOONS_1997.find(t=>t.from.slice(0,5)===key)||null;
}
/**
 * The day ('MM-DD') whose morning post round (`roundMinute`, e.g. 10:30) falls while this warning is in force, so a
 * friend's typhoon letter comes with the post that day; null if the warning covers no round.
 */
export function typhoonPostDay(t,roundMinute){
 for(const key of new Set([t.from.slice(0,5),t.to.slice(0,5)])){const at=stamp(key,roundMinute);if(at>=t.from&&at<=t.to)return key;}
 return null;
}
/** "3 o’clock this afternoon" from "08-17 15:00" (for the news, on the same day). */
export function clockWords(at){
 const h=Number(at.slice(6,8));
 return `${hourWords(at)} ${h<5?'in the night':h<12?'this morning':h<18?'this afternoon':'this evening'}`;
}
/** "3 in the afternoon on 17 August" (for a day that is not necessarily today). */
export function whenWords(at){
 const h=Number(at.slice(6,8));
 return `${hourWords(at).replace(' o’clock','')} ${h<5?'in the night':h<12?'in the morning':h<18?'in the afternoon':'in the evening'} on ${dateWords(at)}`;
}
const hourWords=at=>{const h=Number(at.slice(6,8)),m=Number(at.slice(9,11)),hour=h%12===0?12:h%12;return m?`${hour}:${String(m).padStart(2,'0')}`:`${hour} o’clock`;};
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const dateWords=at=>`${Number(at.slice(3,5))} ${MONTHS[Number(at.slice(0,2))-1]}`;

/**
 * What NHK Okinawa shows during the day while a warning is in force (the Minato Evening
 * News has it from six). Before the closest approach it is expected; after, it has passed.
 */
export function typhoonBulletin(t,minutes){
 const now=stamp(keyOf(minutes),minuteOf(minutes)),coming=now<t.closest.at;
 return {title:'NHK Okinawa · Typhoon information',text:[
  `Typhoon No. ${t.number} is near Okinawa. A storm warning is in force.`,
  coming?`It is expected to come closest at ${whenWords(t.closest.at)}, about ${t.closest.km} kilometres from Naha, with a central pressure of ${t.closest.hPa} hectopascals.`
   :`It came closest at ${whenWords(t.closest.at)}, about ${t.closest.km} kilometres from Naha, and is moving away. The warning stays in force until it has passed.`,
  'Stay indoors, keep away from the sea wall, and keep a torch and water ready.',
 ].join('\n\n')};
}
