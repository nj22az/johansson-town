/**
 * Cel-safe dusk clock.
 *
 * No PointLights. Drives the existing sun (its colour and where it stands, sunPath),
 * hemisphere, grade and emissive meshes from town minutes. Sakura's fluorescent stays
 * cold white; paper lanterns and occupied windows glow as emissive only.
 *
 * MeshToonMaterial ignores HDR, so time of day is these knobs — not more
 * lights. Extra lights add extra ramp bands and turn anime cel into muddy
 * low-poly. Do not change ink thickness, shadow tint or flatten from here.
 */

export function wrapMinutes(minutes){
 return ((minutes%1440)+1440)%1440;
}

export function hourOf(minutes){
 return wrapMinutes(minutes)/60;
}

/**
 * 1 at full day (07:00–17:00), 0 at night. Same envelope the town already uses
 * so shutters, AI and the sun height keep agreeing with the clock.
 */
export function daylight(minutes){
 const h=hourOf(minutes);
 if(h>=7&&h<17)return 1;
 if(h>=17&&h<20)return 1-(h-17)/3;
 if(h>=5&&h<7)return (h-5)/2;
 return 0;
}

function saturate(t){
 return t<0?0:t>1?1:t;
}

function smooth(t){
 const u=saturate(t);
 return u*u*(3-2*u);
}

function mixHex(a,b,t){
 t=saturate(t);
 const ar=(a>>16)&255,ag=(a>>8)&255,ab=a&255;
 const br=(b>>16)&255,bg=(b>>8)&255,bb=b&255;
 return (Math.round(ar+(br-ar)*t)<<16)|(Math.round(ag+(bg-ag)*t)<<8)|Math.round(ab+(bb-ab)*t);
}

/**
 * 0 before 17:00, 1 from 18:30–20:00, gone by 20:30.
 * The Gion-shaped hour: apricot then violet, then night.
 */
export function duskAmount(minutes){
 const h=hourOf(minutes);
 if(h<17||h>=20.5)return 0;
 if(h<18.5)return smooth((h-17)/1.5);
 if(h<20)return 1;
 return smooth(1-(h-20)/0.5);
}

/**
 * Occupied windows: off in full day, full from 18:00 through the night,
 * fading with the morning rather than snapping at 18:00.
 */
export function windowGlow(minutes){
 const h=hourOf(minutes);
 if(h>=18||h<5)return 1;
 if(h>=17)return smooth(h-17);
 if(h>=5&&h<7)return smooth(1-(h-5)/2);
 return 0;
}

/**
 * Paper lanterns (Minato akachochin): on from 17:00, full by 17:30, until 05:00.
 * They lead the windows by half an hour.
 */
export function lanternGlow(minutes){
 const h=hourOf(minutes);
 if(h>=17.5||h<5)return 1;
 if(h>=17)return smooth((h-17)/0.5);
 if(h>=5&&h<6)return smooth(1-(h-5));
 return 0;
}

/**
 * The light a lamp throws on the ground and the glow round its head (light-pools.js): the
 * lamp is on from 17:00, but its pool only shows as the daylight goes, the way a street
 * lamp's does. Full at 20:00, gone by 06:00.
 */
export function poolGlow(minutes){
 return lanternGlow(minutes)*Math.pow(1-daylight(minutes),1.5);
}

/**
 * Sakura fluorescent: cold and full from the clerk's boat at half past eight until nine at night -- through opening,
 * and on while she cashes up and restocks after the shutter comes down at half past eight (commerce/sakura-rota.js)
 * -- then the night light over the till. Never warms toward lantern orange.
 */
export function fluorescent(minutes){
 const m=wrapMinutes(minutes);
 if(m>=510&&m<1260)return 1;
 return 0.6;
}

/**
 * The morning's own light, 06:00–08:30: a cool gold, distinct from the evening's apricot.
 * In by 06:15, full until 07:30, gone by 08:30.
 */
export function morningAmount(minutes){
 const h=hourOf(minutes);
 if(h<5.5||h>=8.5)return 0;
 if(h<6.25)return smooth((h-5.5)/.75);
 if(h<7.5)return 1;
 return smooth(1-(h-7.5));
}

/**
 * Where the sun stands, by the clock. Minato lies at 26°N (Okinawa) in October: up over the
 * east beach at six, 55° over the south at noon, down over the western sea by half past six.
 * From the last hour of the afternoon it holds low and golden (SUN_PATH.floor) instead of
 * slipping under the horizon, so the long shadows last the whole of the town's evening
 * (duskAmount). At night the one key light is the moon, where the sun used to stand all
 * day (west-north-west, 20° up), so the night look is as it was; the two are blended over
 * the hour before sunrise and the hour and a half after sunset, never a jump.
 *
 * Azimuth is degrees clockwise from north (+z): east 90 (+x), south 180 (−z), west 270.
 */
export const SUN_PATH=Object.freeze({rise:6,set:18.5,noon:55,floor:10,moon:Object.freeze({azimuth:291.8,elevation:20.4})});

function sunVector(azimuth,elevation){
 const a=azimuth*Math.PI/180,e=elevation*Math.PI/180,c=Math.cos(e);
 return {x:Math.sin(a)*c,y:Math.sin(e),z:Math.cos(a)*c};
}
/** Along the great circle from a to b at a steady angular speed (unit vectors), so the light never races. */
function blendVectors(a,b,t){
 const dot=Math.max(-1,Math.min(1,a.x*b.x+a.y*b.y+a.z*b.z)),theta=Math.acos(dot),s=Math.sin(theta);
 if(s<1e-6)return {...a};
 const wa=Math.sin((1-t)*theta)/s,wb=Math.sin(t*theta)/s;
 return {x:a.x*wa+b.x*wb,y:a.y*wa+b.y*wb,z:a.z*wa+b.z*wb};
}
function withAngles(v){
 const azimuth=((Math.atan2(v.x,v.z)*180/Math.PI)%360+360)%360,elevation=Math.asin(Math.max(-1,Math.min(1,v.y)))*180/Math.PI;
 return {...v,azimuth,elevation};
}

/**
 * @param {number} minutes town minutes
 * @returns {{x:number,y:number,z:number,azimuth:number,elevation:number}} the unit vector
 *   toward the sun (or the moon, at night), with its angles in degrees
 */
export function sunPath(minutes){
 const h=hourOf(minutes),{rise,set,noon,floor,moon}=SUN_PATH;
 const moonV=sunVector(moon.azimuth,moon.elevation);
 const day=u=>sunVector(90+180*u,Math.max(floor,noon*Math.pow(Math.sin(Math.PI*u),1.35)));
 if(h>=rise&&h<set)return withAngles(day((h-rise)/(set-rise)));
 if(h>=set&&h<20)return withAngles(blendVectors(day(1),moonV,smooth((h-set)/(20-set))));
 if(h>=5&&h<rise)return withAngles(blendVectors(moonV,day(0),smooth((h-5)/(rise-5))));
 return withAngles(moonV);
}

export function periodLabel(minutes){
 const h=hourOf(minutes);
 if(h<5)return 'NIGHT';
 if(h<10.5)return 'MORNING';
 if(h<14)return 'MIDDAY';
 if(h<17)return 'AFTERNOON';
 if(h<20.5)return 'EVENING';
 return 'NIGHT';
}

export const PALETTE=Object.freeze({
 skyDay:0x86cff2,
 skyDuskApricot:0xe7b08a,
 skyDuskViolet:0x6a5b8c,
 skyNight:0x1b2747,
 skyRain:0xa7bcc6,
 sunDay:0xfff0da,
 sunDusk:0xffb07a,
 sunNight:0x9aacd0,
 // The morning: a pale gold key under a paler, hazier sky, with a cool fill. Cooler than
 // the dusk apricot, so a walk at seven does not look like a walk at six in the evening.
 sunMorning:0xffe4b8,
 skyMorning:0xbcd6ee,
 fillMorning:0xe4edfc,
 fillDay:0xeef5ff,
 fillDusk:0xf0c4a8,
 fillNight:0x5b6d9e,
 groundDay:0x8a82b0,
 groundDusk:0x5a4a78,
 groundNight:0x2a2444,
 sakuraTube:0xfff1ce,
 lanternPaper:0xd8562e,
});

/** How much of the morning grade is in: its own amount, scaled by the daylight it rides on. */
function morningMix(minutes){
 return morningAmount(minutes)*daylight(minutes);
}

export function sunColor(minutes){
 const h=hourOf(minutes);
 if(h>=20&&h<20.5)return mixHex(PALETTE.sunDusk,PALETTE.sunNight,smooth((h-20)/.5));
 const day=daylight(minutes);
 const dusk=duskAmount(minutes);
 if(dusk>0)return mixHex(PALETTE.sunDay,PALETTE.sunDusk,dusk);
 if(day>0)return mixHex(mixHex(PALETTE.sunNight,PALETTE.sunDay,day),PALETTE.sunMorning,morningMix(minutes));
 return PALETTE.sunNight;
}

export function skyColor(minutes,rain=false){
 if(rain)return PALETTE.skyRain;
 const day=daylight(minutes);
 const dusk=duskAmount(minutes);
 const h=hourOf(minutes);
 if(h>=20&&h<20.5)return mixHex(PALETTE.skyDuskViolet,PALETTE.skyNight,smooth((h-20)/.5));
 if(dusk>0){
  // Apricot on the way in, violet as the hour deepens past 18:30.
  const violet=h<18.5?0:smooth((h-18.5)/1.5);
  const warm=mixHex(PALETTE.skyDay,PALETTE.skyDuskApricot,dusk);
  return mixHex(warm,PALETTE.skyDuskViolet,violet);
 }
 if(day>0)return mixHex(mixHex(PALETTE.skyNight,PALETTE.skyDay,day),PALETTE.skyMorning,morningMix(minutes)*.7);
 return PALETTE.skyNight;
}

export function skyFill(minutes){
 const h=hourOf(minutes);
 if(h>=20&&h<20.5)return mixHex(PALETTE.fillDusk,PALETTE.fillNight,smooth((h-20)/.5));
 const day=daylight(minutes);
 const dusk=duskAmount(minutes);
 if(dusk>0)return mixHex(PALETTE.fillDay,PALETTE.fillDusk,dusk);
 if(day>0)return mixHex(mixHex(PALETTE.fillNight,PALETTE.fillDay,day),PALETTE.fillMorning,morningMix(minutes)*.8);
 return PALETTE.fillNight;
}

export function groundFill(minutes){
 const h=hourOf(minutes);
 if(h>=20&&h<20.5)return mixHex(PALETTE.groundDusk,PALETTE.groundNight,smooth((h-20)/.5));
 const day=daylight(minutes);
 const dusk=duskAmount(minutes);
 if(dusk>0)return mixHex(PALETTE.groundDay,PALETTE.groundDusk,dusk);
 if(day>0)return mixHex(PALETTE.groundNight,PALETTE.groundDay,day);
 return PALETTE.groundNight;
}

/**
 * Grade warmth only. Do not touch uShadowTint / ink uniforms from here —
 * those are the cel look.
 */
export function gradeWarmth(minutes){
 return 0.05+duskAmount(minutes)*0.07+morningMix(minutes)*0.03;
}

/**
 * How bright an unlit decal (road paint, a crossing's bars) is drawn: 1 by day, with the
 * town's fill at night. Paint takes no light of its own, so without this it glowed white
 * on a dark street.
 */
export function decalLight(minutes){
 return (.36+daylight(minutes)*.84+duskAmount(minutes)*.1)/1.2;
}

/**
 * One clock sample. Safe to call every setTime().
 * @param {number} minutes town minutes
 * @param {{rain?:boolean,inside?:boolean}} [options]
 */
export function clock(minutes,{rain=false,inside=false}={}){
 const day=daylight(minutes);
 const dusk=duskAmount(minutes);
 return {
  minutes:wrapMinutes(minutes),
  day,
  dusk,
  period:periodLabel(minutes),
  morning:morningMix(minutes),
  sky:skyColor(minutes,rain),
  sun:sunColor(minutes),
  sunDirection:sunPath(minutes),
  sunIntensity:(.15+day*3.32)*(rain?.62:1),
  decal:decalLight(minutes),
  skyFill:skyFill(minutes),
  groundFill:groundFill(minutes),
  // A clear island night: deep blue fill and the lit windows and lamps doing the work,
  // rather than a grey haze at sixty per cent of the day (docs/QA-REPORT.md, O2).
  // Daylight fill is generous: a sunny island town has soft, light shadows, and shaded
  // walls keep their colour instead of going grey. (Sakura's interior fill used to leak
  // into the street and do this job by accident; it is switched off outdoors now.)
  ambient:inside?1.05:(.36+day*.84+dusk*.1),
  bounce:(.34+day*1.06)*(rain?.8:1),
  exposure:inside?1.08:.8+day*.28+dusk*.08,
  gradeWarmth:gradeWarmth(minutes),
  windowGlow:windowGlow(minutes),
  lanternGlow:lanternGlow(minutes),
  fluorescent:fluorescent(minutes),
  fog:null,
 };
}
