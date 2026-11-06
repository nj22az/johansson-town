import {ganahaAtWindow} from './ganaha.js';
import {izakayaOpen} from './social.js';
import {BOTTLE_KEEP} from '../world/interiors/izakaya-dressing.js';
import {ferryTimetableText} from '../world/ferry-timetable.js';

/**
 * What you can do with the things in Minato (world/interiors/izakaya-interactive.js):
 * the pink telephone, the bottle keep and the karaoke. Money, saving and the dialog
 * come from activities.js.
 */
export const KEEP_PRICE=2500,CALL_PRICE=10,SONG_PRICE=100;
const SONGS=Object.freeze([
 {title:'Harbour Lights',singer:'Kayoko Shima, 1994',lines:['The ferry’s horn across the water,','the lanterns lit along the quay —','I pour one more and tell the harbour','the things I never said to you.'],nao:'Thao claps on the beat and gets it wrong on purpose, so you can’t hear that you did too.'},
 {title:'Island Bus Stop',singer:'The Seagulls, 1988',lines:['Last bus is gone and so’s my money,','the moon is up, the road is long,','but if you’re walking home tomorrow','I know a short cut and a song.'],nao:'The whole counter comes in on the chorus. Chin does the bus horn.'},
 {title:'Summer’s Over',singer:'Yuki Arakaki, 1997',lines:['The beach umbrellas folded early,','the shaved-ice flags are taken down,','but you still smell of sun and salt','the first cold night back in the town.'],nao:'“That was on the radio all summer,” says Thao. “I am so tired of it. Sing it again.”'},
]);
const CALLS=Object.freeze([
 // The harbour office reads you the real timetable (world/ferry-timetable.js).
 ['Harbour office',minutes=>'“Harbour office.” The duty clerk reads it off the board:\n\n'+ferryTimetableText(minutes)],
 // Ms Ganaha keeps the ferry desk from noon to 22:15 (people/ganaha.js); after that it rings out.
 ['Ferry desk',minutes=>ganahaAtWindow(minutes)?'Ms Ganaha picks up on the fourth ring. “Port Terminal. She keeps her timetable, love, and she does not wait: out of Minato at half past seven, a quarter to nine, a quarter to three and a quarter past ten. The commuter boats are in at half past eight, half past two and ten. Are you at Minato? Say hello to Thao.”':'The ferry desk rings and rings. Ms Ganaha keeps the window from noon until a quarter past ten; tomorrow, then.'],
 ['Sakura','“Sakura Shōten!” Thuan sounds out of breath. “We close at eight — oh, it’s you. Are you at Thao’s? Order the sardines. Don’t tell her I said so.”'],
]);

export function createIzakayaPlay({state,show,close,spend,save,receipt,getMinutes,say,note,onKaraoke=null}){
 const open=()=>izakayaOpen(getMinutes());
 function phone(){
  show('Pink telephone','A pink public phone on its own little shelf, ¥10 a call. A card taped beside it has three numbers in Thao’s writing.',[
   ...CALLS.map(([who,line])=>['Call '+who+' · ¥'+CALL_PRICE,()=>{if(!spend(CALL_PRICE))return;save();receipt(who,typeof line==='function'?line(getMinutes()):line);}]),
   ['Hang up',close]]);
 }
 function bottleKeep(){
  const mine=state.izakayaBottle,tags=BOTTLE_KEEP.map(b=>`${b.name} — ${b.drink}`).join('\n');
  const text='The regulars’ own bottles, each with its owner’s name on a tag round the neck. You pay for the bottle once and drink it a glass at a time.\n\n'+tags+(mine?`\n\nYou — ${mine.drink} (${mine.poured} poured so far)`:'');
  const buttons=[];
  if(!mine)buttons.push(['Keep a bottle of awamori · ¥'+KEEP_PRICE,()=>{
   if(!open()){receipt('Bottle keep','Thao keeps the bottles for you, and she isn’t in yet. Minato opens at four.');return;}
   if(!spend(KEEP_PRICE))return;state.izakayaBottle={drink:'Zuisen awamori',poured:0,since:getMinutes()};note?.('Kept a bottle of awamori at Minato.');save();
   receipt('Bottle keep','Thao writes your name on a tag in her careful hand and loops it round the neck. “There. Now you’re a regular. That’s worse for you than it sounds.”');}]);
  else buttons.push(['Pour a glass from your bottle',()=>{
   if(!open()){receipt('Bottle keep','Your bottle is on the shelf, but the counter is closed. Minato opens at four.');return;}
   mine.poured++;save();receipt('Your bottle','Thao pours a measure over ice and slides it over. '+(mine.poured>=20?'“That’s the last of it. Another bottle?” She is already writing the tag.':'The level on the bottle drops by a finger.'));
   if(mine.poured>=20)delete state.izakayaBottle;}]);
 buttons.push(['Back',close]);
  show('Bottle keep',text,buttons);
 }
 function karaoke(){
  if(!open()){receipt('Karaoke','The laserdisc player is off and its mics are put away in the cabinet. Karaoke is from opening time, at four.');return;}
  if(onKaraoke){close();onKaraoke();return;}
  show('Laserdisc karaoke','¥'+SONG_PRICE+' a song. The machine takes a while to find the disc.',[
   ...SONGS.map(song=>[song.title+' · '+song.singer,()=>{if(!spend(SONG_PRICE))return;save();receipt(song.title,song.lines.join('\n')+'\n\n'+song.nao);}]),
   ['Not tonight',close]]);
 }
 return {phone,bottleKeep,karaoke};
}
