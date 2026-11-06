import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {CAST_RECIPES,recipeFor} from '../src/avatars/cast.js';
import {createAvatarJohansson} from '../src/avatars/actors.js';
import {buildAvatar} from '../src/avatars/build.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {ONSEN_SEATS,buildOnsenInterior} from '../src/world/interiors/onsen.js';
import {MASSAGE_CHAIR} from '../src/world/interiors/onsen-electrics.js';
import {ONSEN_CHAIR} from '../src/world/interiors/onsen-chair.js';
import {provideCatalog} from './catalog-fixture.mjs';
installDOM();
await provideCatalog('massage-chair');

// The creator: "Fujita's legs blended together with the onsen ... correct collision". A sitter faces -x; the lower legs
// hang below the knees and must stay in front of the seat's front face, never inside the seat block.
test('Umi-no-yu massage chair: every sitter\'s lower legs hang in front of the seat, not inside it',()=>{
 const actor=createAvatarJohansson({scene:new THREE.Scene()}),S=ONSEN_SEATS.massage;
 const people={...CAST_RECIPES,'Mr Fujita':recipeFor('Mr Fujita'),child:{...CAST_RECIPES.Johansson,age:'child'}};
 for(const [name,recipe] of Object.entries(people)){
  actor.setRecipe(recipe);actor.seat('Sit');actor.root.position.set(...S.position);actor.root.rotation.y=S.yaw;
  for(let i=0;i<90;i++)actor.update(1/60,{seated:true,seatHeight:S.surfaceY,visible:true});
  actor.root.updateMatrixWorld(true);
  const foot=actor.avatar.bones.footL.getWorldPosition(new THREE.Vector3()),legR=actor.avatar.measure.legR;
  assert.ok(foot.x+legR<MASSAGE_CHAIR.front-.01,`${name}: calves at ${(foot.x+legR).toFixed(3)} reach the seat front ${MASSAGE_CHAIR.front}`);
 }
 actor.avatar.dispose();
});

/**
 * The chair is Studio's (assets/catalog/massage-chair): Studio keeps every piece of it out of the spaces World's sitters
 * take (its card's keepClear, measured with World's own avatars by Studio's modeller/tools/keep-clear.mjs), and World
 * keeps its sitters inside them. So a sitter here, posed the way Studio measured them, must lie wholly inside keepClear
 * (all but the cloth that meets the seat's top, which is the seat taking their weight), and its feet hang over the foot
 * box, not in it. An avatar change that would put a sitter into the chair fails here; then the chair is measured again in
 * Studio (keep-clear.mjs) and published again.
 */
test('the chair\'s sitters stay in the room Studio left them (keepClear), and their feet hang over the foot box',async()=>{
 const card=JSON.parse(readFileSync(new URL('../assets/catalog/massage-chair/asset.json',import.meta.url),'utf8'));
 const boxes=card.keepClear.map(b=>new THREE.Box3(new THREE.Vector3(...b.min),new THREE.Vector3(...b.max)).expandByScalar(1e-4));
 const seat=card.seats[0],front=seat.position[2]+seat.front,lift=seat.surfaceY+.015,S=ONSEN_SEATS.massage;
 // The room's frame to the chair's own (ONSEN_CHAIR's turn undone).
 const co=Math.cos(ONSEN_CHAIR.yaw),si=Math.sin(ONSEN_CHAIR.yaw),own=p=>{const dx=p.x-ONSEN_CHAIR.x,dz=p.z-ONSEN_CHAIR.z;return new THREE.Vector3(co*dx-si*dz,p.y,si*dx+co*dz);};
 // The room, with the chair in it, for the feet.
 const room=new THREE.Group(),layout=buildOnsenInterior({room,reg(){},action(){},exit(){}});room.updateMatrixWorld(true);
 const chair=[];layout.chair.object.traverse(o=>{if(o.isMesh)chair.push(o);});
 const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
 const seeded=(s=7)=>()=>(s=(s*16807)%2147483647)/2147483647;
 const sit=(who,recipe,outfit,pose)=>{
  const rand=seeded(),orig=Math.random;Math.random=rand;
  try{
   const a=buildAvatar(recipe,{shadows:false});a.wear(outfit);
   const holder=new THREE.Group();holder.add(a.root);holder.position.set(...S.position);holder.rotation.y=S.yaw;
   // As Studio measured them: seated a moment, then the pose, held four seconds.
   const anim=createAvatarAnimator(a,{random:rand}),state={seated:true,seatHeight:S.surfaceY,seat:'Sit'};
   for(let i=0;i<20;i++)anim.update(1/60,state);if(pose)state.pose=pose;
   for(let i=0;i<240;i++){anim.update(1/60,state);a.springs?.update(1/60);}
   holder.updateMatrixWorld(true);
   const label=`${who} in ${outfit}${pose?' ('+pose+')':''}`,p=new THREE.Vector3();let outside=null,count=0;
   for(const mesh of a.root.children.filter(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'))){
    const P=mesh.geometry.attributes.position,r=mesh.geometry.drawRange,end=Math.min(P.count,r.start+r.count);
    for(let i=r.start;i<end;i++){mesh.getVertexPosition(i,p);mesh.localToWorld(p);const q=own(p);
     if(q.z<=front&&q.y<lift)continue;// the cloth on the seat's top
     count++;if(!outside&&!boxes.some(b=>b.containsPoint(q)))outside=q.toArray().map(v=>v.toFixed(3));}}
   assert.ok(count>1000,label+': a body');
   assert.equal(outside,null,`${label}: a point at ${outside} (the chair's frame) is outside the room Studio left for sitters`);
   // The feet: straight down from each foot, the first thing of the chair under it is at least a centimetre below.
   for(const bone of ['footL','footR']){const f=a.bones[bone].getWorldPosition(new THREE.Vector3());ray.set(f,down);ray.far=2;
    const hit=ray.intersectObjects(chair,false)[0];if(hit)assert.ok(f.y-hit.point.y>.04&&hit.point.y<.24,`${label}: ${bone} over ${hit.object.name} at ${hit.point.y.toFixed(3)} (foot ${f.y.toFixed(3)})`);}
   a.dispose?.();
  }finally{Math.random=orig;}
 };
 const people={...CAST_RECIPES,'Mr Fujita':recipeFor('Mr Fujita')};
 for(const [who,recipe] of Object.entries(people))for(const outfit of ['clothes','afterbath'])sit(who,recipe,outfit);
 sit('a child',{...CAST_RECIPES.Johansson,age:'child'},'clothes');
 // (Studio measured Fujita's two with the cloud of hair, since retired: his hair as World draws it now is inside that.)
 for(const pose of ['ChairUncurl','FrozenAbsurd'])sit('Mr Fujita',recipeFor('Mr Fujita'),'afterbath',pose);
 layout.dispose();
});
