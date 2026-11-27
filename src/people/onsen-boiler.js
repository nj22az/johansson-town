import {CAST} from './cast.js';
import {ONSEN_BOILER} from '../world/onsen-layout.js';
import {yawFacing} from './stand-points.js';

/**
 * Umi-no-yu's boiler, worked where it stands (world/onsen-layout.js ONSEN_BOILER: the back corner of the bathhouse on
 * the park side). Who works it and when is the cast's own day (people/cast.js): every row at the onsen whose activity is
 * the boiler, until that day's next row. For Tetsuo that is 18:00-18:30 (lighting it for the evening, before his bottle
 * on the yuntaku bench, whose reason sends him "back up to the boiler at eight") and 20:00-22:30 (keeping it and closing
 * up at ten). The bath's own place, `onsen`, is the bath, entered in swimwear (indoor-residents.js), so the boiler is a
 * place of its own on the lawn outside: `onsen-boiler`, a stand facing the heater.
 */
const minute=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
export const BOILER_DUTY=Object.freeze(Object.fromEntries(CAST.map(p=>{
 const rows=(p.day||[]).map(([time,place,activity])=>({from:minute(time),place,activity})).sort((a,b)=>a.from-b.from);
 const spans=rows.flatMap((r,i)=>r.place==='onsen'&&/\bboiler\b/.test(r.activity)?[Object.freeze({from:r.from,to:rows[i+1]?.from??1440,activity:r.activity})]:[]);
 return [p.name,Object.freeze(spans)];
}).filter(([,spans])=>spans.length)));
const STAND=Object.freeze({yaw:yawFacing(ONSEN_BOILER.facing),pose:'Interact',why:ONSEN_BOILER.why});
/** Where this resident is at the boiler now, or null when the boiler does not have them. */
export function boilerDutyAt(name,minutes){
 const spans=BOILER_DUTY[name];if(!spans)return null;
 const m=((minutes%1440)+1440)%1440,span=spans.find(s=>m>=s.from&&m<s.to);
 return span?{place:'onsen-boiler',target:[...ONSEN_BOILER.stand],activity:'at Umi-no-yu’s boiler: '+span.activity,stand:STAND}:null;
}
