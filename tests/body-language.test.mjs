import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {createAvatarAnimator,GESTURES} from '../src/avatars/animate.js';
import {bodyLanguage,BODY_LANGUAGE_MOVES,lineFeeling} from '../src/avatars/body-language.js';
import {PERSONALITIES,personalityOf,TOWN_DIALS} from '../src/avatars/personality.js';
import {recipeFor} from '../src/avatars/cast.js';
import {MOVES} from '../src/avatars/moves.js';
import {POSES} from '../src/photo/layout.js';

installDOM();
const seeded=(s=7)=>()=>((s=Math.imul(s^s>>>15,2246822507)+1>>>0)/4294967296);

test('every move a personality uses is one the body knows',()=>{
 for(const move of BODY_LANGUAGE_MOVES)assert.ok(move in GESTURES,move);
 for(const [name] of MOVES)assert.ok(name in GESTURES,name);
 for(const pose of POSES)assert.ok(pose==='Idle'||pose==='Sit'||pose in GESTURES,pose);
});

test('the playful poses are on the moves menu and in the photo studio',()=>{
 for(const pose of ['Heart','Peace','Coy','Tada','HandsOnHips','HeelKick']){
  assert.ok(MOVES.some(([n])=>n===pose),pose);assert.ok(POSES.includes(pose),pose);
 }
});

test('the town is not sixteen copies of one personality',()=>{
 const types=new Set(Object.keys(TOWN_DIALS).map(name=>personalityOf(recipeFor(name).profile).name));
 assert.ok(types.size>=10,`${types.size} personalities`);
 assert.equal(personalityOf(recipeFor('Thuan').profile).name,'Festival friend');
 assert.equal(personalityOf(recipeFor('Tetsuo').profile).name,'Quiet craftsman');
 // A neighbour with no authored dials still gets the same ones every time.
 assert.deepEqual(recipeFor('Mr Ōshiro').profile,recipeFor('Mr Ōshiro').profile);
});

test('lively people fidget more and gesture more as they talk',()=>{
 const calm=bodyLanguage({pace:.1,talk:.1,show:.1,outlook:.1}),lively=bodyLanguage({pace:.9,talk:.9,show:.9,outlook:.9});
 assert.equal(calm.type,PERSONALITIES[0].name);assert.equal(lively.type,PERSONALITIES[15].name);
 assert.ok(lively.idleEvery[1]<calm.idleEvery[0]);assert.ok(lively.talkChance>calm.talkChance);
});

test('a resident strikes their own poses standing about, and as they start to speak',()=>{
 const a=buildAvatar(recipeFor('Thuan'),{}),anim=createAvatarAnimator(a,{lively:true,random:seeded()});
 const seen=new Set();
 for(let i=0;i<60*90;i++){anim.update(1/60,{});if(anim.gesture)seen.add(anim.gesture);}
 assert.ok([...seen].some(g=>anim.style.idle.includes(g)),'an idle flourish within ninety seconds: '+[...seen]);
 // Every flourish ends, even a dance that would otherwise loop for ever.
 for(let i=0;i<60*6;i++)anim.update(1/60,{seated:true});assert.equal(anim.gesture,null);
 const quiet=createAvatarAnimator(buildAvatar(recipeFor('Thuan'),{}),{random:seeded()});
 for(let i=0;i<60*90;i++){quiet.update(1/60,{});assert.equal(quiet.gesture,null);}
 a.dispose();
});

test('a happy line brings out the speaker’s own happy move',()=>{
 assert.equal(lineFeeling('Haha, not again.'),'laugh');assert.equal(lineFeeling('Welcome back!'),'happy');assert.equal(lineFeeling('How has your day been?'),null);
 const a=buildAvatar(recipeFor('Thuan'),{}),anim=createAvatarAnimator(a,{random:seeded()});
 anim.update(.016,{expression:'neutral'});anim.update(.016,{expression:'happy'});
 assert.equal(anim.gesture,bodyLanguage(recipeFor('Thuan').profile).feel.happy);a.dispose();
});

test('town residents are lively: the actor every resident is built from strikes poses of its own',async()=>{
 const THREE=await import('../vendor/three.module.js');
 const {createAvatarActor,updateAvatarActor}=await import('../src/avatars/actors.js');
 const scene=new THREE.Scene(),entity=new THREE.Group();entity.userData.name='Masaru';scene.add(entity);
 const actor=createAvatarActor(entity,'Masaru'),seen=new Set();let now=0;
 for(let i=0;i<60*60;i++){now+=1000/60;updateAvatarActor(actor,1/60,now);if(actor.animator.gesture)seen.add(actor.animator.gesture);}
 assert.equal(actor.animator.style.type,'Typhoon');
 assert.ok([...seen].some(g=>actor.animator.style.idle.includes(g)),[...seen].join());
 actor.avatar.dispose();
});
