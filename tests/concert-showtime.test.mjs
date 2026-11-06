import test from 'node:test';
import assert from 'node:assert/strict';
import {MUSIC_MOVES,musicPose} from '../src/avatars/music-moves.js';
import {MOVES} from '../src/avatars/moves.js';
import {GESTURES} from '../src/avatars/animate.js';
import {scoreFor,SONGS,STYLES,cleanSong} from '../src/music/songs.js';
import {performanceAt} from '../src/music/show.js';

test('every new music move is available to all actors and stays finite through a complete musical phrase',()=>{
 for(const [name]of MUSIC_MOVES){
  assert.ok(MOVES.some(([move])=>move===name));assert.equal(GESTURES[name],Infinity);
  const shapes=new Set();
  for(let beat=0;beat<16;beat+=.125){
   const pose=musicPose(name,beat,.8);for(const angles of Object.values(pose.joints))for(const a of angles)assert.ok(Number.isFinite(a)&&Math.abs(a)<=Math.PI,name);
   shapes.add(JSON.stringify(pose));
  }
  assert.ok(shapes.size>4,name+' is a moving routine rather than one static pose');
 }
});
test('six genres direct different routines, alternate verses, and bring all voices into the chorus',()=>{
 const routines=new Set();
 for(const style of Object.keys(STYLES)){
  const score=scoreFor({...SONGS[0],style,performance:'wild'}),moves=[];
  for(let line=0;line<4;line++){
   const time=(4+line*8+.25)*score.beat;
   for(let i=0;i<4;i++){
    const p=performanceAt(score,time,i,4);assert.equal(p.lead,line===3||i===line);assert.ok(p.energy>0);assert.ok(p.move);assert.ok(Number.isFinite(p.step));moves.push(p.move);
   }
  }
  routines.add(moves.join('|'));
  const quiet=performanceAt(score,9*score.beat,0,4,{reduced:true,cheering:true});assert.equal(quiet.energy,0);assert.equal(quiet.step,0);assert.equal(quiet.turn,0);assert.equal(quiet.move,'Sing');
 }
 assert.ok(routines.size>=5,'genres have distinct choreography');
});
test('old saves acquire bounded voice and stage settings, and cheers cannot exceed the motion budget',()=>{
 const song=cleanSong({...SONGS[0],voice:'not-a-voice',performance:'not-a-mode'});assert.equal(song.voice,'cast');assert.equal(song.performance,'showtime');
 const score=scoreFor({...song,performance:'wild'});
 for(let beat=0;beat<40;beat+=.1){const p=performanceAt(score,beat*score.beat,0,4,{cheering:true});assert.ok(p.energy<=1);assert.ok(p.mouth>=0&&p.mouth<=1);}
});
