import {townDate} from '../town-clock.js';
import {BIRTHDAYS} from './birthdays-data.js';

/**
 * Birthdays, as 'MM-DD'. Only real ones go here: the creator sets them (2026-10-12: "Johansson is
 * January 30, Thuan march 15, make up the rest"). Johansson's and Thuan's are the creator's own;
 * the residents' were chosen on the creator's instruction, one to a month where it could be, away
 * from the town's festival days so a birthday is its own day.
 *
 * The maker profiles' own birthday field (1 July for everyone) is not used; recipeFor
 * (avatars/cast.js) gives each profile the date here, so Studio shows it too. On that day
 * of the town's 1997:
 *   - a resident greets Johansson with their birthday line, and on his everyone wishes him
 *     a happy birthday (people/greetings.js); Thuan says hers in her own conversation,
 *   - the evening before, the news says it is their birthday tomorrow (feed/evening-news.js),
 *   - and the day's moments, so the diary and the news, record it (activities.js).
 */
export {BIRTHDAYS};

const VALID=/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
/** Whether today (a town minute) is `name`'s birthday. False for anyone without a real one. */
export function birthdayOn(name,minutes,table=BIRTHDAYS){
 const date=table[name];return typeof date==='string'&&VALID.test(date)&&townDate(minutes).key===date;
}
/** The residents whose birthday is on this town day. */
export function birthdaysOn(minutes,table=BIRTHDAYS){
 return Object.keys(table).filter(name=>birthdayOn(name,minutes,table));
}
