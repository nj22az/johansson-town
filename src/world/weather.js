/**
 * The town's weather: sunny, cloudy or rain. The title page and the game share one record
 * in localStorage, so the weather on the title card is the weather you walk out into.
 *
 * In random mode the title rolls a fresh weather on each visit (title-sky.js keeps a copy
 * of these weights), and the town rolls `nextWeather` every two in-game hours. Choosing a
 * weather on the title or in the Town book fixes it until the dice are rolled again.
 */
export const WEATHERS=Object.freeze(['sunny','cloudy','rain']);
export const WEATHER_KEY='johansson-town-weather';
export const WEATHER_CHANGE_MINUTES=120;
const WEIGHTS=Object.freeze({sunny:.5,cloudy:.3,rain:.2});

/** A fresh weather, weighted towards fine days. */
export function rollWeather(rand=Math.random){
 let r=rand();for(const w of WEATHERS){if((r-=WEIGHTS[w])<0)return w;}return 'sunny';
}
/** The next spell of weather: half the time it holds; rain only comes out of cloud. */
export function nextWeather(current,rand=Math.random){
 if(rand()<.5)return current;
 if(current==='sunny')return 'cloudy';
 if(current==='cloudy')return rand()<.55?'sunny':'rain';
 return 'cloudy';
}
const valid=r=>r&&WEATHERS.includes(r.weather)&&['random','fixed'].includes(r.mode);
export function readWeather(storage=globalThis.localStorage){
 try{const r=JSON.parse(storage?.getItem(WEATHER_KEY)||'null');if(valid(r))return {mode:r.mode,weather:r.weather};}catch{}
 return {mode:'random',weather:'sunny'};
}
export function writeWeather(record,storage=globalThis.localStorage){
 if(!valid(record))return;try{storage?.setItem(WEATHER_KEY,JSON.stringify({mode:record.mode,weather:record.weather}));}catch{}
}
/** What the town says when the weather turns. */
export const WEATHER_LINES=Object.freeze({sunny:'The clouds break up and the sun comes out.',cloudy:'Clouds roll in off the sea.',rain:'It starts to rain.'});
/** The same, at night: there is no sun to come out at half past eleven. */
export const WEATHER_NIGHT_LINES=Object.freeze({sunny:'The clouds break up; stars over the harbour.',cloudy:'Clouds roll in and cover the stars.',rain:'It starts to rain.'});
/** The line for a change of weather at a town minute: night is 19:00 to 05:30. */
export function weatherLine(kind,minutes){const m=((minutes%1440)+1440)%1440;return (m>=1140||m<330?WEATHER_NIGHT_LINES:WEATHER_LINES)[kind];}
