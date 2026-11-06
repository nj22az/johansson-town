/** Original Minato songs. Templates, words, notes and performances are our own. */
export const SONG_PRICE=100;
export const STYLES=Object.freeze({
 pop:Object.freeze({label:'Island city pop',bpm:112,colour:0x56c7b3,base:60,melody:[0,4,7,9,7,4,2,0],wave:'triangle'}),
 ballad:Object.freeze({label:'Power ballad',bpm:80,colour:0xe6ae77,base:57,melody:[0,3,7,10,7,5,3,0],wave:'sine'}),
 disco:Object.freeze({label:'Neon disco',bpm:124,colour:0xe384bc,base:60,melody:[0,7,10,12,10,7,5,3],wave:'square'}),
 rock:Object.freeze({label:'Stadium rock',bpm:128,colour:0xf07758,base:57,melody:[0,0,7,10,12,10,7,3],wave:'sawtooth'}),
 enka:Object.freeze({label:'Midnight enka',bpm:76,colour:0x99a8ec,base:57,melody:[0,2,3,7,10,7,3,2],wave:'sine'}),
 eurobeat:Object.freeze({label:'Turbo eurobeat',bpm:160,colour:0x7dccf5,base:60,melody:[0,7,12,10,7,3,5,7],wave:'sawtooth'}),
});
export const VOICES=Object.freeze({cast:'Live cast voices',crooner:'Low crooner',alto:'Bright alto',belt:'Stadium belt',chip:'Tiny superstar'});
export const PERFORMANCES=Object.freeze({relaxed:'Relaxed',showtime:'Showtime',wild:'Go wild'});
export const SONGS=Object.freeze([
 {id:'harbour',title:'Harbour Lights',style:'ballad',lines:['The ferry horn across the water','The lanterns shine along the quay','I sing beneath the harbour lights','Come home and sing this song with me']},
 {id:'bus',title:'Island Bus Stop',style:'pop',lines:['The last bus left without me','The moon is high above the sea','We walk the long way home tonight','The whole town sings along with me']},
 {id:'summer',title:'Summer After Midnight',style:'disco',lines:['The summer sun has gone to bed','The neon paints the harbour blue','We dance until the morning comes','One more song for me and you']},
]);
const clean=(s,n)=>typeof s==='string'?s.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n):'';
export function cleanSong(raw={}){
 const template=SONGS.find(s=>s.id===raw?.id)||SONGS[0];
 return {id:template.id,title:clean(raw?.title,48)||template.title,style:Object.hasOwn(STYLES,raw?.style)?raw.style:template.style,
  voice:Object.hasOwn(VOICES,raw?.voice)?raw.voice:'cast',performance:Object.hasOwn(PERFORMANCES,raw?.performance)?raw.performance:'showtime',
  lines:template.lines.map((line,i)=>clean(raw?.lines?.[i],64)||line)};
}
export function cleanConcert(raw){
 return {song:cleanSong(raw?.song),cast:Array.isArray(raw?.cast)?[...new Set(raw.cast.filter(n=>typeof n==='string'&&n.length<=60))].slice(0,4):['Johansson'],
  completed:Number.isSafeInteger(raw?.completed)&&raw.completed>0?Math.min(raw.completed,999999):0};
}
/** Four count-in beats, four eight-beat phrases, four beats to bow. One clock drives sound and picture. */
export function scoreFor(raw){
 const song=cleanSong(raw),style=STYLES[song.style],beat=60/style.bpm,words=[],syllables=[];
 song.lines.forEach((line,index)=>{
  const row=line.split(/\s+/),slot=7.2/row.length;
  row.forEach((word,w)=>{
   const start=4+index*8+w*slot,spoken=word.toLowerCase().replace(/[^a-zà-öø-ÿ]/g,'').replace(/(.{3,})e$/, '$1'),matches=[...spoken.matchAll(/[aeiouyà-öø-ÿ]+/g)],parts=matches.length?matches:[{0:'a',index:0}];
   words.push({line:index,word:w,text:word,start:start*beat,end:(start+slot)*beat});
   parts.forEach((vowel,s)=>syllables.push({line:index,word:w,vowel:vowel[0][0],onset:spoken.slice(s?parts[s-1].index+parts[s-1][0].length:0,vowel.index),coda:s===parts.length-1?spoken.slice(vowel.index+vowel[0].length):'',start:(start+s*slot/parts.length)*beat,
    duration:slot/parts.length*beat*.88,note:style.base+style.melody[(w+s+index*2)%style.melody.length]}));
  });
 });
 return {song,style,beat,words,syllables,duration:40*beat};
}
export function cueAt(score,seconds){
 const t=Math.max(0,seconds),beat=t/score.beat;
 if(beat<4)return {phase:'count-in',count:4-Math.floor(beat),line:-1,word:-1};
 if(beat>=40)return {phase:'finished',line:-1,word:-1};
 if(beat>=36)return {phase:'bow',line:-1,word:-1};
 const line=Math.min(3,Math.floor((beat-4)/8)),word=score.words.find(w=>w.line===line&&t>=w.start&&t<w.end)?.word??-1;
 return {phase:'singing',line,word};
}
/** Alternate the first three lines; the final chorus brings everybody in. */
export const singingPart=(line,index,count)=>count===1||line===3||line%count===index;
