import test from 'node:test';
import assert from 'node:assert/strict';
import {createIzakayaPlay,KEEP_PRICE,SONG_PRICE,CALL_PRICE} from '../src/people/izakaya-play.js';

function harness(minutes){
 const state={yen:5000},shown=[];let saved=0;
 const play=createIzakayaPlay({state,getMinutes:()=>minutes,save:()=>saved++,close(){},say(){},note(){},
  spend:n=>{if(state.yen<n)return false;state.yen-=n;return true;},
  show:(title,text,buttons=[])=>shown.push({title,text,buttons}),receipt:(title,text)=>shown.push({title,text,buttons:[]})});
 const press=label=>shown.at(-1).buttons.find(([l])=>l.startsWith(label))[1]();
 return {state,shown,play,press,saves:()=>saved};
}
test('the pink phone takes ¥10 a call and the harbour office reads the real timetable',()=>{
 const h=harness(20*60);h.play.phone();
 assert.equal(h.shown.at(-1).buttons.length,4,'Three numbers and hang up');
 h.press('Call Harbour office');assert.equal(h.state.yen,5000-CALL_PRICE);assert.match(h.shown.at(-1).text,/Harbour office/);
});
test('keeping a bottle costs ¥2,500 once, is saved, and pours a glass at a time; Thao keeps it only when open',()=>{
 const closed=harness(10*60);closed.play.bottleKeep();closed.press('Keep a bottle');
 assert.equal(closed.state.izakayaBottle,undefined,'Not while Minato is closed');assert.equal(closed.state.yen,5000);
 const h=harness(20*60);h.play.bottleKeep();h.press('Keep a bottle');
 assert.equal(h.state.yen,5000-KEEP_PRICE);assert.equal(h.state.izakayaBottle.poured,0);assert.ok(h.saves()>0);
 h.play.bottleKeep();assert.match(h.shown.at(-1).text,/You — /,'Your own tag is listed');
 h.press('Pour a glass');assert.equal(h.state.izakayaBottle.poured,1);
});
test('karaoke is ¥100 a song from opening time, and off while Minato is closed',()=>{
 const closed=harness(11*60);closed.play.karaoke();assert.equal(closed.shown.at(-1).buttons.length,0,'Switched off');
 const h=harness(21*60);h.play.karaoke();h.press('Harbour Lights');assert.equal(h.state.yen,5000-SONG_PRICE);assert.match(h.shown.at(-1).text,/lanterns/);
});
