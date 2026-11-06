import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar,buildShoeProp,SOCK} from '../src/avatars/build.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
installDOM();

/** The lowest point of the drawn body (its skin, as skinned, and the face), in the floor's frame. */
function lowest(avatar){
 avatar.root.updateMatrixWorld(true);
 const body=avatar.root.children.find(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'));
 const {position,skinIndex,skinWeight}=body.geometry.attributes,p=new THREE.Vector3();
 const swinging=new Set(['hairA','hairB','braidL1','braidL2','braidR1','braidR2','skirtF','skirtB','skirtL','skirtR']);
 let low=Infinity;
 for(let i=0;i<position.count;i++){
  let swing=0;for(let k=0;k<4;k++)if(swinging.has(body.skeleton.bones[skinIndex.getComponent(i,k)].name))swing+=skinWeight.getComponent(i,k);
  if(swing>=.5)continue;   // a braid or a hem hangs from the body; it is not what the body rests on
  p.fromBufferAttribute(position,i);body.applyBoneTransform(i,p);body.localToWorld(p);low=Math.min(low,p.y);
 }
 const head=avatar.face.head,hp=head.geometry.attributes.position;
 for(let i=0;i<hp.count;i++)low=Math.min(low,p.fromBufferAttribute(hp,i).applyMatrix4(head.matrixWorld).y);
 return low;
}

test('knocked out face down: resting on the ground (never through it), feet up and swaying, mitten hands',()=>{
 for(const who of ['Tetsuo','Johansson','Nhung','Chin']){
  const avatar=buildAvatar(CAST_RECIPES[who]),anim=createAvatarAnimator(avatar),floor=.1;
  const holder=new THREE.Group();holder.add(avatar.root);
  const feet=[],hips=new THREE.Vector3(),foot=new THREE.Vector3();
  for(let frame=0;frame<300;frame++){
   anim.update(1/60,{lying:'prone',floorHeight:floor});
   if(frame<90)continue;   // going down
   const low=lowest(avatar);
   assert.ok(low>=floor-.003,`${who} goes through the ground at ${frame}: ${low}`);
   assert.ok(low<=floor+.01,`${who} hovers over the ground at ${frame}: ${low}`);
   avatar.bones.hips.getWorldPosition(hips);avatar.bones.footR.getWorldPosition(foot);
   assert.ok(foot.y>hips.y+.1,`${who}'s feet are up in the air`);feet.push(foot.x);
  }
  const head=avatar.bones.head.getWorldPosition(new THREE.Vector3());
  assert.ok(Math.abs(head.y-hips.y)<.12,`${who} lies flat (head ${head.y.toFixed(2)}, hips ${hips.y.toFixed(2)})`);
  assert.ok(Math.max(...feet)-Math.min(...feet)>.05,`${who}'s feet sway`);
  avatar.dispose();
 }
});

test('face down goes back to standing, and the back-lying knock-out is unchanged by it',()=>{
 const avatar=buildAvatar(CAST_RECIPES.Tetsuo),anim=createAvatarAnimator(avatar);
 for(let i=0;i<120;i++)anim.update(1/60,{lying:'prone'});
 assert.ok(avatar.root.rotation.x<-1.5,'face down');
 for(let i=0;i<180;i++)anim.update(1/60,{});
 assert.ok(Math.abs(avatar.root.rotation.x)<1e-3,'up again');
 for(let i=0;i<120;i++)anim.update(1/60,{lying:true});
 assert.ok(avatar.root.rotation.x>1.5,'on the back');
 avatar.dispose();
});

test('a shoe comes off: a sock on the foot, and the shoe itself as a prop of the same shoe',()=>{
 const avatar=buildAvatar(CAST_RECIPES.Tetsuo),colour=avatar.body.geometry.attributes.color,before=colour.array.slice();
 avatar.setShoe('R',false);assert.equal(avatar.shoeOn('R'),false);assert.equal(avatar.shoeOn('L'),true);
 const sock=new THREE.Color(SOCK.colour);let socks=0;
 for(let i=0;i<colour.count;i++)if(Math.abs(colour.getX(i)-sock.r)<1e-6&&Math.abs(colour.getZ(i)-sock.b)<1e-6)socks++;
 assert.ok(socks>50,'the foot is in its sock');
 avatar.setShoe('R',true);assert.deepEqual(Array.from(colour.array),Array.from(before),'and the shoe goes back on exactly');
 const shoe=buildShoeProp(CAST_RECIPES.Tetsuo);shoe.geometry.computeBoundingBox();
 assert.ok(Math.abs(shoe.geometry.boundingBox.min.y)<1e-6,'it stands on its sole');
 assert.ok(shoe.geometry.boundingBox.max.z-shoe.geometry.boundingBox.min.z>shoe.geometry.boundingBox.max.x-shoe.geometry.boundingBox.min.x,'toe to heel along z');
 assert.equal(buildShoeProp({...CAST_RECIPES.Tetsuo,outfit:{...CAST_RECIPES.Tetsuo.outfit,footwear:'barefoot'}}),null);
 avatar.dispose();
});
