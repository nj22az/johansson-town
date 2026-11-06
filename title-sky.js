const title=document.querySelector('#title'),weatherButton=document.querySelector('#titleWeather');
// The weather on the title: sunny, cloudy or rain. It is the same record the town reads
// (src/world/weather.js), so the title shows the weather you will walk out into. In random
// mode a fresh weather is rolled on every visit; the button fixes one, the dice roll again.
const WEATHERS=['sunny','cloudy','rain'],WEATHER_KEY='johansson-town-weather',LABELS={sunny:'sunny',cloudy:'cloudy',rain:'raining'},WEIGHTS={sunny:.5,cloudy:.3,rain:.2};
const diceButton=document.querySelector('#titleDice');
const roll=()=>{let r=Math.random();for(const w of WEATHERS){if((r-=WEIGHTS[w])<0)return w;}return 'sunny';};
let record={mode:'random',weather:'sunny'};try{const saved=JSON.parse(localStorage.getItem(WEATHER_KEY)||'null');if(saved&&WEATHERS.includes(saved.weather)&&['random','fixed'].includes(saved.mode))record=saved;}catch{}
let weather=record.weather;
function setWeather(next,mode){weather=next;record={mode,weather:next};if(title){title.dataset.weather=next;title.dataset.weatherMode=mode;}weatherButton?.setAttribute('aria-label','Weather: '+LABELS[next]+(mode==='random'?' (random)':'')+'. Tap to change');try{localStorage.setItem(WEATHER_KEY,JSON.stringify(record));}catch{} dispatchEvent(new CustomEvent('johansson-title-weather'));}
setWeather(record.mode==='random'?roll():record.weather,record.mode);
weatherButton?.addEventListener('click',()=>setWeather(WEATHERS[(WEATHERS.indexOf(weather)+1)%WEATHERS.length],'fixed'));
diceButton?.addEventListener('click',()=>{let next=roll();if(next===weather)next=roll();setWeather(next,'random');});
