import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {recipeFor} from '../src/avatars/cast.js';
import {gaitOf,PERSONAL_GAITS} from '../src/avatars/gait.js';
import {RESIDENTS} from '../src/people/residents.js';
import {NEIGHBOURS} from '../src/people/neighbours.js';

installDOM();

/** Walks someone for a few seconds and measures how their body moves. */
function walk(name,seconds=4){
 const avatar=buildAvatar(recipeFor(name),{shadows:false}),anim=createAvatarAnimator(avatar,{random:()=>.5});
 let low=Infinity,high=-Infinity,behind=0,frames=0;
 for(let t=0;t<seconds;t+=1/60){
  anim.update(1/60,{speed:1.3,expression:'neutral'});
  const y=avatar.bones.hips.position.y;low=Math.min(low,y);high=Math.max(high,y);
  if(avatar.bones.shoulderL.rotation.x>.2)behind++;frames++;
 }
 const out={bounce:high-low,behind:behind/frames,gait:anim.gait};avatar.dispose();return out;
}

test('residents can be told apart by how they walk',()=>{
 const vy=walk('Vy'),higa=walk('Grandmother Higa'),mori=walk('Officer Mori');
 assert.ok(vy.bounce>higa.bounce*1.3,`Vy bounces (${vy.bounce.toFixed(4)}) and Grandmother Higa does not (${higa.bounce.toFixed(4)})`);
 assert.ok(higa.behind>.8,'Grandmother Higa walks with her hands behind her back');
 assert.equal(mori.gait.carry,'stiff','Officer Mori marches');
 assert.ok(higa.gait.stride<vy.gait.stride*.85,'Grandmother Higa takes shorter steps');
 // Everyone in town has a gait, and the town is not one walk.
 const names=[...RESIDENTS.map(r=>r.name),...NEIGHBOURS.map(n=>n.name)];
 const gaits=names.map(n=>gaitOf(recipeFor(n),()=>.5));
 assert.ok(new Set(gaits.map(g=>JSON.stringify([g.carry,g.stride.toFixed(2),g.bounce.toFixed(2),g.tics]))).size>=12,'At least a dozen different walks in town');
 for(const name of Object.keys(PERSONAL_GAITS))assert.ok(names.includes(name)||name==='Johansson','Personal gait for someone who lives here: '+name);
});
