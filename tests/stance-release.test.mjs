import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar,bodyVolume} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {createAvatarAnimator,GESTURES} from '../src/avatars/animate.js';
import {surface} from './body-contact.mjs';
installDOM();

/**
 * Hands out of the pockets and from behind the back as a movement (animate.js stanceStep; docs/ANIMATION-STANDARD.md, the
 * stance snap of 16 of the 33 residents): a move that takes an arm takes it out of the stance on an eased curve and gives it
 * back before the move ends, and on the way neither the hand nor the forearm goes into the body. The stance itself already
 * lays the forearm against the hip (on some bodies a few centimetres into the torso's measured core), so the rule is that the
 * way out and the way back go no deeper into the torso and the thighs than either end of them does, and that the hand never
 * jumps.
 */
const BODIES=['Johansson','Thao','Vy','Sverker','Miss Higa'];   // pockets (the first three), behind the back
const MOVES=['Wave','Point','Think','ScratchHead','Shrug','Clap','Eat'];

/** The torso (bodyVolume, carried by the hips and the chest as body-contact.mjs core does) and the thighs: what a hand going
 *  out of a pocket must not go into. A function of a world point: the signed distance (negative inside). */
function trunk(avatar){
 const m=avatar.measure,b=avatar.bones,vol=bodyVolume(avatar.recipe,m);avatar.root.updateMatrixWorld(true);
 const at=n=>b[n].getWorldPosition(new THREE.Vector3()),inv=n=>b[n].matrixWorld.clone().invert();
 const frames=[['hips',m.hipY],['chest',m.chestY]].map(([n,y])=>[inv(n),y]),q=new THREE.Vector3(),half=.03*m.k;
 const thighs=['L','R'].map(s=>[at('thigh'+s),at('knee'+s)]);
 const seg=(p,a,c,r)=>{const ab=c.clone().sub(a),t=THREE.MathUtils.clamp(p.clone().sub(a).dot(ab)/ab.lengthSq(),0,1);return p.distanceTo(a.clone().addScaledVector(ab,t))-r;};
 return p=>{let d=Infinity;for(const [M,y] of frames){q.copy(p).applyMatrix4(M);q.y+=y;if(y===m.hipY?q.y>m.chestY+half:q.y<m.chestY-half)continue;d=Math.min(d,vol.sdf(q));}
  for(const [a,c] of thighs)d=Math.min(d,seg(p,a,c,m.legR));return d;};
}
/** How deep each hand and its forearm go into the trunk now (metres, 0 when they do not), by side. */
function depth(avatar){const sdf=trunk(avatar),deep={L:0,R:0};for(const {p,bone} of surface(avatar,{stride:9,only:n=>/^(hand|elbow)[LR]$/.test(n)}))deep[bone.slice(-1)]=Math.max(deep[bone.slice(-1)],-sdf(p));return deep;}

test('a move takes the hands out of the stance and gives them back as a movement: never deeper into the body than either end, never a jump',()=>{
 const report=[],failures=[];
 for(const who of BODIES){
  const avatar=buildAvatar(recipeFor(who),{shadows:false}),holder=new THREE.Group();holder.add(avatar.root);
  for(const move of MOVES){
   const anim=createAvatarAnimator(avatar,{random:(()=>{let s=7;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};})(),initialTime:0});
   const step=()=>{anim.update(1/60,{});holder.updateMatrixWorld(true);};
   for(let i=0;i<60;i++)step();
   const hand=()=>['L','R'].map(s=>avatar.bones['hand'+s].getWorldPosition(new THREE.Vector3()));
   const d=GESTURES[move],n=Math.round((d+.8)*60),deep=[],jumps=[];let last=hand();
   anim.play(move);
   for(let i=0;i<n;i++){step();const h=hand();jumps.push(Math.max(...h.map((p,k)=>p.distanceTo(last[k]))));last=h;if(i%3===0)deep.push([i/60,depth(avatar)]);}
   // (a jump: a frame that carries a hand further than both the frames either side of it do, by 2 cm or more; a fast movement
   // is fast in the frames round it too)
   const jump=Math.max(0,...jumps.map((x,i)=>x-Math.max(jumps[i-1]??0,jumps[i+1]??0)));
   for(const side of ['L','R']){
    const at=k=>deep[k][1][side],stance=at(0),after=at(deep.length-1),held=deep.reduce((x,y)=>Math.abs(y[0]-d*.5)<Math.abs(x[0]-d*.5)?y:x)[1][side];
    const worst=(from,to,a,b)=>Math.max(...deep.filter(([t])=>t>=from&&t<to).map(([,x])=>x[side]-Math.max(a,b)));
    const wOut=worst(0,d*.5,stance,held),wBack=worst(d*.5,Infinity,held,after);
    report.push(`${who} ${move} ${side}: in the body ${(stance*1000).toFixed(1)} mm at the stance, ${(held*1000).toFixed(1)} in the move; out ${(wOut*1000).toFixed(1)}, back ${(wBack*1000).toFixed(1)} past them`);
    if(wOut>=.003)failures.push(`${report.at(-1)}: on the way out`);
    if(wBack>=.003)failures.push(`${report.at(-1)}: on the way back`);
   }
   if(jump>=.02)failures.push(`${who} ${move}: a hand's frame ${(jump*1000).toFixed(0)} mm past its neighbours'`);
  }
  avatar.dispose();
 }
 console.log(report.join('\n'));
 assert.deepEqual(failures,[]);
});
