import {singingPart} from './songs.js';
const ROUTINES=Object.freeze({pop:['IdolDance','DiscoPoint','IdolDance','Kachashi'],ballad:['EnkaReach','Sing','EnkaReach','RockBelt'],disco:['DiscoPoint','RobotDance','IdolDance','DiscoPoint'],rock:['RockBelt','AirGuitar','RockBelt','AirGuitar'],enka:['EnkaReach','Sing','EnkaReach','EnkaReach'],eurobeat:['RobotDance','DiscoPoint','AirGuitar','IdolDance']});
export const SHOW_ENERGY=Object.freeze({relaxed:.28,showtime:.7,wild:1});
/** One score directs the cast, faces, steps, camera and musical accents. No random frame-time changes. */
export function performanceAt(score,seconds,index,count,{reduced=false,cheering=false}={}){
 const beat=seconds/score.beat,line=Math.max(0,Math.min(3,Math.floor((beat-4)/8))),singing=beat>=4&&beat<36,
  lead=line===3||singingPart(line,index,count),energy=reduced?0:Math.min(1,(SHOW_ENERGY[score.song.performance]??.7)+(cheering?.3:0)),
  phrase=Math.max(0,Math.floor((beat-4)/4)),sequence=ROUTINES[score.song.style]||ROUTINES.pop;
 const silly=!reduced&&singing&&(score.song.performance==='wild'||cheering),antics=['ChickenDance','JellyWobble','DramaFinish','RobotDance'];
 const move=!singing?null:reduced?'Sing':silly&&(!lead||phrase%2)?antics[(phrase+index)%antics.length]:lead?sequence[Math.floor(phrase/2)%sequence.length]:sequence[(phrase+index+1)%sequence.length];
 const syllable=singing&&lead?score.syllables.find(s=>s.line===line&&seconds>=s.start&&seconds<s.start+s.duration):null;
 const response=singing&&[11.72,19.72,27.72].some(b=>beat>=b&&beat<b+.28);
 const expression=!singing?'smile':silly?(lead&&phrase%2?'surprised':'laugh'):score.song.style==='enka'||score.song.style==='ballad'?(lead?'hope':'content'):score.song.style==='rock'?(lead?'focus':'laugh'):'happy';
 return {move,beat,energy,lead:singing&&lead,expression,mouth:syllable ? .75+.25*Math.sin((seconds-syllable.start)*28) : response?.8:0,
  step:energy ? energy*Math.sin(beat*Math.PI+index*.2)*(score.song.style==='ballad'||score.song.style==='enka'?.035:.16) : 0,
  turn:energy ? energy*Math.sin(beat*Math.PI/4+index)*.16 : 0,blink:singing&&!reduced&&((beat+index*3)%17)<.12?1:0,
  cheering,shot:!singing||line===3?'wide':Math.floor((beat-4)/4)%2?'lead':'wide',leadIndex:line%count};
}
