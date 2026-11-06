import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';
installDOM();
const THREE=await import('../vendor/three.module.js');
const {buildAvatar}=await import('../src/avatars/build.js');
const {CAST_RECIPES}=await import('../src/avatars/cast.js');
const {createAvatarAnimator}=await import('../src/avatars/animate.js');

const angle=b=>2*Math.acos(Math.min(1,Math.abs(b.quaternion.w)))*180/Math.PI;
function stage(recipe){
 const scene=new THREE.Scene(),holder=new THREE.Group(),avatar=buildAvatar(recipe,{shadows:false});
 holder.add(avatar.root);scene.add(holder);
 return {holder,avatar,animator:createAvatarAnimator(avatar,{random:()=>.5})};
}
const run=(s,seconds,move=()=>{})=>{for(let t=0;t<seconds;t+=1/60){move(t);s.animator.update(1/60,{speed:0});s.avatar.springs.update(1/60);}};

test('Thuan’s twin braids and Johansson’s shirt hem hang on swing bones; a cropped head has none',()=>{
 // In her own blouse and trousers only the braids swing; in a pleated skirt its four quarters swing too.
 assert.equal(stage(CAST_RECIPES.Thuan).avatar.springs.links.length,4,'both braids');
 assert.equal(stage({...CAST_RECIPES.Thuan,outfit:{...CAST_RECIPES.Thuan.outfit,bottom:'pleatedskirt'}}).avatar.springs.links.length,8,'both braids and four pleated skirt quarters');
 assert.equal(stage(CAST_RECIPES.Johansson).avatar.springs.links.length,4);
 const thuan=stage(CAST_RECIPES.Thuan).avatar;thuan.wear('sailor');
 assert.equal(thuan.springs.links.length,8,'in her sailor set the pleated skirt swings too');
});

test('standing still, everything hangs where the pose puts it; a sudden move swings it, and it settles',()=>{
 for(const name of ['Thuan','Johansson']){
  const s=stage(CAST_RECIPES[name]);
  run(s,2);
  for(const l of s.avatar.springs.links)assert.ok(angle(l.bone)<6,`${name}’s ${l.bone.name} sags ${angle(l.bone).toFixed(1)}° at rest`);
  // A quick step sideways and stop.
  let peak=0;
  run(s,.5,t=>{s.holder.position.x=Math.min(.6,t*3);peak=Math.max(peak,...s.avatar.springs.links.map(l=>angle(l.bone)));});
  assert.ok(peak>2,`${name}: nothing swung (${peak.toFixed(1)}°)`);
  for(const l of s.avatar.springs.links)assert.ok(angle(l.bone)<=(l.chain.limit+.5),'beyond its limit');
  run(s,3);
  for(const l of s.avatar.springs.links)assert.ok(angle(l.bone)<6,`${name}’s ${l.bone.name} has not settled`);
 }
});

test('a body moved across the town starts its swing again from rest rather than whipping after it',()=>{
 const s=stage(CAST_RECIPES.Thuan);run(s,1);
 s.holder.position.set(40,0,40);run(s,1/60);
 for(const l of s.avatar.springs.links)assert.ok(angle(l.bone)<6);
});
