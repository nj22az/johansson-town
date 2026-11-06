import {okinawaSeason} from '../town-clock.js';

/**
 * The island's soundscape: which living sounds are in the air, and how loud, for the
 * season and the hour. A summer-holiday game taught this: the same street sounds
 * different at seven in the morning in June and at seven in the evening in September,
 * and the player feels the calendar through their ears before their eyes.
 *
 * Every layer is a level from 0 to 1, read from smooth curves over the hour (never a step,
 * so the morning cicadas fade into the afternoon ones instead of switching), scaled by
 * the season and by the weather. town-audio.js plays them; this file only decides.
 *
 *   kumazemi    the big black cicada: the roar of a summer morning, gone by noon
 *   aburazemi   the afternoon cicada, frying-pan sizzle from late morning to dusk
 *   higurashi   the evening cicada's falling “kana-kana”, at dusk in late summer
 *   crickets    summer and autumn nights
 *   frogs       the rainy season's nights, and any wet night in summer
 *   birds       morning song: bulbuls and white-eyes, loudest in spring
 *   gulls       over the harbour by day
 *   rain        the rain itself
 */
export const LAYERS=Object.freeze(['kumazemi','aburazemi','higurashi','crickets','frogs','birds','gulls','rain']);

/** How each season carries each layer. */
const SEASON=Object.freeze({
 winter:{kumazemi:0,aburazemi:0,higurashi:0,crickets:.1,frogs:0,birds:.6,gulls:1},
 spring:{kumazemi:0,aburazemi:0,higurashi:0,crickets:.25,frogs:.35,birds:1,gulls:1},
 rainy:{kumazemi:.2,aburazemi:.1,higurashi:0,crickets:.4,frogs:1,birds:.8,gulls:.8},
 summer:{kumazemi:1,aburazemi:1,higurashi:.8,crickets:.9,frogs:.45,birds:.7,gulls:1},
 autumn:{kumazemi:.05,aburazemi:.35,higurashi:.4,crickets:1,frogs:.15,birds:.75,gulls:1},
});
/** A soft bump over the hours: 1 between `from` and `to`, easing in and out over `edge` hours. */
function window_(h,from,to,edge=1){
 const s=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 const rise=s((h-from+edge)/edge),fall=s((to+edge-h)/edge);
 return Math.min(rise,fall);
}
/** The hour's own shape for each layer, before season and weather. */
function hourly(h){
 const night=Math.max(window_(h,19.5,24.5,1),window_(h,-.5,4.5,1));
 return {
  kumazemi:window_(h,6,10.5,1),
  aburazemi:window_(h,10,17,1.5),
  higurashi:Math.max(window_(h,18,19.2,.6),window_(h,4.6,5.4,.4)*.6),
  crickets:night,frogs:night,
  birds:window_(h,5.2,8.5,.8)*1+window_(h,16.5,18,.6)*.4,
  gulls:window_(h,6,18.5,1),
 };
}
/**
 * The mix for a town minute.
 * @param {{minutes:number,rain?:boolean,inside?:boolean,harbour?:number}} options
 *   harbour: 0–1, how close to the water the listener is (gulls).
 * @returns {Record<string,number>} a level per LAYERS entry
 */
export function ambience({minutes,rain=false,inside=false,harbour=0}){
 const h=(((minutes%1440)+1440)%1440)/60,season=SEASON[okinawaSeason(minutes)],shape=hourly(h);
 const out={};
 for(const layer of LAYERS){
  if(layer==='rain'){out.rain=rain?1:0;continue;}
  let level=shape[layer]*season[layer];
  // Rain quiets the insects and the birds and wakes the frogs.
  if(rain)level*=layer==='frogs'?2.2:layer==='gulls'?.4:.15;
  if(layer==='gulls')level*=harbour;
  out[layer]=Math.min(1,level);
 }
 // Indoors, the outside comes through the walls.
 if(inside)for(const layer of LAYERS)out[layer]*=layer==='rain'?.45:.2;
 return out;
}
