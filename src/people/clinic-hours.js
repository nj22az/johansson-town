import {townCalendarAt} from '../town-clock.js';
/**
 * Minato Clinic's hours, and the doctor's day around them. Nhung is the island doctor since 22 October 2026 (the owner:
 * the clinic doctor's look and post are hers; Dr Kakazu retired into her, people/roster.js RETIRED). Surgery is on
 * weekdays, 9–12 and 14–17, and on Saturday morning; Sunday she keeps Sakura's counter (commerce/sakura-rota.js), and
 * the clinic telephone is hers at night. The board inside the clinic door prints CLINIC_HOURS_TEXT.
 */
const minute=m=>((m%1440)+1440)%1440;
export const CLINIC_SESSIONS=Object.freeze({
 weekday:Object.freeze([Object.freeze([540,720]),Object.freeze([840,1020])]),
 saturday:Object.freeze([Object.freeze([540,720])]),
});
const sessionsOn=minutes=>{const w=townCalendarAt(minutes).weekday;return w===0?[]:w===6?CLINIC_SESSIONS.saturday:CLINIC_SESSIONS.weekday;};
/** Whether the clinic's door is open to patients at this minute. */
export const clinicOpenAt=minutes=>{const m=minute(minutes);return sessionsOn(minutes).some(([a,b])=>m>=a&&m<b);};
/**
 * Whether the doctor is at the clinic: from a quarter of an hour before morning surgery to its close on the day's last
 * session, the gap between them included (the morning's notes, and the house calls of the afternoon) unless she is out
 * at lunch with her sisters, which the street plan reads first.
 */
export const doctorAtClinic=minutes=>{const s=sessionsOn(minutes),m=minute(minutes);return !!s.length&&m>=s[0][0]-15&&m<s[s.length-1][1];};
export const CLINIC_HOURS_TEXT=Object.freeze(['Mon–Fri 9:00–12:00, 14:00–17:00','Sat 9:00–12:00','After hours: ring the bell; the doctor’s telephone is answered at 3 Kitahama','Emergencies to Naha by the ferry, or the prefecture helicopter from Kitano-jima']);
