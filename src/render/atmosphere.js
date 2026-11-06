import {clock as duskClock} from './dusk.js';

// Fog is disabled in every weather/time state, including restored rainy saves.
// When town minutes are passed, the cel-safe dusk clock owns sky/ambient/exposure.
// The three-stop (day) path stays for callers that only have a daylight factor.
export function atmosphere(day,rain=false,inside=false,minutes=null){
 if(minutes!=null){
  const c=duskClock(minutes,{rain,inside});
  return {sky:c.sky,fog:null,exposure:c.exposure,ambient:c.ambient};
 }
 return {sky:rain?0xa7bcc6:day>.7?0xb8dce9:day>.1?0xdbb5a0:0x30455d,
  fog:null,
  exposure:inside?1.08:1.04+day*.04,ambient:inside?1.05:.55+day*.38};
}
