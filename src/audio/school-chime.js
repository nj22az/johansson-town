import {townAudio} from './town-audio.js?snappy=1';

/**
 * キーンコーンカーンコーン: the Westminster quarters every Japanese school rings, at the
 * start of the day, noon, lunch, the end of lessons and going-home time.
 */
export const CHIME_TIMES=Object.freeze([8*60+25,12*60,12*60+20,15*60+30,17*60]);
const E4=329.63,C4=261.63,D4=293.66,G3=196;
/** Two phrases, played slowly, twice through as the speakers do. */
const PHRASES=[[E4,C4,D4,G3],[G3,D4,E4,C4],[E4,D4,C4,G3],[G3,D4,E4,C4]];
export const CHIME_NOTES=Object.freeze(PHRASES.flatMap((phrase,p)=>phrase.map((f,i)=>[f,p*3.4+i*.78+(i===3?.25:0)])));

export function playSchoolChime(volume=1){townAudio.bells(CHIME_NOTES,.5*volume);}
