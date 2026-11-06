import {townCalendarAt} from '../town-clock.js';
/**
 * Sakura Shōten is Thuan's outright (docs/CAST-CONSOLIDATION.md §3, the owner's ruling of 19 October 2026): the
 * purchasing, the accounts, the stock, the shop and the supply business. The rota is honest about who can stand at
 * the counter: Thuan keeps the day on weekdays, over on the 08:30 boat from Kitano-jima and home on the 22:00 one
 * (people/commuter-schedule.js), and Nhung keeps it on Sunday while Thuan stays on the island. Since Nhung became the
 * island doctor (the owner, 22 October 2026) her Saturday morning is the clinic's surgery, so the shop shuts on
 * Saturdays (土曜定休) rather than conjure a clerk, and Saturday afternoon is her one free stretch of the week. Nobody keeps a
 * night counter: Grandmother Sakurai, who did, has retired (§6), and Chin is the ferry's motorman with no Sakura clerk,
 * till, stock-cover or relief duties (§3), so the shop closes overnight rather than conjure a second body for anyone.
 * That supersedes the 24-hour opening of 12 October 2026, which the night keeper made possible.
 *
 * The day: open 09:00, the till closes at 20:00, and the last half hour (shop-stock.js closingDay, from 20:00) is the
 * clerk's restock with the shutter coming down behind her at 20:30.
 */
const minute=m=>((m%1440)+1440)%1440;
export const SAKURA_HOURS=Object.freeze({open:540,till:1200,close:1230});
export const SAKURA_DAY_SHIFT=Object.freeze([SAKURA_HOURS.open,SAKURA_HOURS.close]);
export const isWeekend=minutes=>{const w=townCalendarAt(minutes).weekday;return w===0||w===6;};
/** Saturday, the shop's closing day (the owner, 22 October 2026). */
export const sakuraClosedDay=minutes=>townCalendarAt(minutes).weekday===6;
export const sakuraDayShift=minutes=>{const m=minute(minutes);return !sakuraClosedDay(minutes)&&m>=SAKURA_DAY_SHIFT[0]&&m<SAKURA_DAY_SHIFT[1];};
/** Whether the shop is open at this minute: the day shift, Sunday to Friday. */
export const sakuraOpenAt=sakuraDayShift;
/** Whether the till takes money: until 20:00; the last half hour is the restock. */
export const sakuraTillOpen=minutes=>{const m=minute(minutes);return !sakuraClosedDay(minutes)&&m>=SAKURA_HOURS.open&&m<SAKURA_HOURS.till;};
/** Who is at the counter at this minute, or null while the shop is shut: Nhung on Sunday, Thuan on weekdays. */
export function sakuraClerkAt(minutes){
 if(!sakuraDayShift(minutes))return null;
 return isWeekend(minutes)?'Nhung':'Thuan';
}
/** The walking residents who take a shift at Sakura. Never Chin (above). */
export const SAKURA_STAFF=Object.freeze(['Thuan','Nhung']);
/** Whether this resident is on their Sakura shift at this minute. */
export const onSakuraShift=(name,minutes)=>!!name&&sakuraClerkAt(minutes)===name;
/** The hours as the signs print them. */
export const SAKURA_HOURS_TEXT='9:00–20:30';
/** The days, as the signs print them. */
export const SAKURA_DAYS_TEXT='closed Saturdays';
