import {test} from 'node:test';
import assert from 'node:assert/strict';
import {wrapAngle,doorTwist,streetToRoom,roomToStreet} from '../src/world/doorway.js';
import {SAKURA_LAYOUT} from '../src/world/interiors/sakura-layout.js';

const near=(a,b,msg)=>assert.ok(Math.abs(wrapAngle(a-b))<1e-9,msg+' ('+a+' vs '+b+')');
/** The konbini: its door faces west, and its room is authored facing +z. */
const SAKURA={entryFacing:Math.PI/2},ROOM=SAKURA_LAYOUT;

test('a heading goes through the door and comes back unchanged',()=>{
 for(const yaw of [0,.3,1.74,-2.2,Math.PI,-Math.PI/2]){
  const inside=streetToRoom(yaw,SAKURA,ROOM);
  near(roomToStreet(inside,SAKURA,ROOM),yaw,'The heading did not survive the round trip');
 }
});

test('walking straight at a shop leaves you walking straight into it',()=>{
 // Square-on to the door outside is square-on down the shop inside.
 near(streetToRoom(SAKURA.entryFacing,SAKURA,ROOM),ROOM.yaw??0,'Straight in is not straight in');
 // Half a radian off to one side outside is the same half radian off inside.
 near(streetToRoom(SAKURA.entryFacing+.5,SAKURA,ROOM),(ROOM.yaw??0)+.5,'The angle to the door was not kept');
 // and facing the door from inside puts you facing the street.
 near(roomToStreet((ROOM.yaw??0)+Math.PI,SAKURA,ROOM),SAKURA.entryFacing+Math.PI,'Leaving does not face you out');
});

test('a building that never said which way it faces is left alone',()=>{
 // No entryFacing and no layout is a twist of zero, not a NaN that eats the camera.
 assert.equal(doorTwist(undefined,undefined),0);
 assert.equal(doorTwist({},null),0);
 near(streetToRoom(1.2,{},null),1.2,'A building without a facing rotated the player');
 assert.ok(Number.isFinite(streetToRoom(1.2,{},null)));
});

test('the twist is the one angle between the two frames, both ways',()=>{
 const site={entryFacing:-Math.PI/2},layout={yaw:Math.PI};
 assert.equal(doorTwist(site,layout),Math.PI+Math.PI/2);
 for(const yaw of [0,1,-3])near(roomToStreet(streetToRoom(yaw,site,layout),site,layout),yaw,'Round trip failed');
 // wrapAngle keeps everything in (-pi,pi] so the camera never accumulates turns.
 for(const yaw of [0,1,-3,6.5,-9])assert.ok(Math.abs(streetToRoom(yaw,site,layout))<=Math.PI+1e-12);
});
