import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {CAST_RECIPES,recipeFor} from '../src/avatars/cast.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {createAvatarActor,updateAvatarActor} from '../src/avatars/actors.js';
import {faceLayout} from '../src/avatars/face.js';
import {normalizeRecipe} from '../src/avatars/recipe.js';
import {shapeHeadPoint} from '../src/avatars/head-profile.js';
import {fitAvatarHeldProp,consumptionPhase} from '../src/avatars/consume.js';
import {createDrinkProp,createDishProp,setPropPortion,updatePropPortion,disposeServing} from '../src/people/izakaya-beer.js';
installDOM();

test('face UVs never interpolate a second face across the rear seam',()=>{
 for(const name of ['Thuan','Johansson'])for(const form of ['oval','round','square','narrow','heart']){
  const a=buildAvatar({...CAST_RECIPES[name],head:{...CAST_RECIPES[name].head,form}});
  const {position:P,uv:U}=a.face.head.geometry.attributes;let rear=0;
  for(let i=0;i<P.count;i+=3){
   const us=[U.getX(i),U.getX(i+1),U.getX(i+2)];
   assert.ok(Math.max(...us)-Math.min(...us)<.5,'no face-wide UV seam triangle');
   if([0,1,2].every(j=>P.getZ(i+j)<=0)){rear++;for(let j=0;j<3;j++)assert.ok(U.getX(i+j)<.003&&U.getY(i+j)<.003);}
  }
  assert.ok(rear>100);a.dispose();
 }
});

test('the kariyushi collar is cloth: a stand round the neck, notched leaves and lapels over an open V, with a shadow under them',()=>{
 for(const name of ['Johansson','Thuan']){
  const a=buildAvatar({...CAST_RECIPES[name],outfit:{...CAST_RECIPES[name].outfit,top:'kariyushi'}}),m=a.measure,P=a.body.geometry.attributes.position;
  let stand=0;
  // (outside the neck it goes round, whatever its thickness: the stand had been sized from the arm, and sat inside
  // Johansson's 104 mm neck, unseen; the owner: "his shirt needs a real collar with a rounded neck", "Johansson's neck
  // needs to fit in the shirt he is wearing, the shirt outside his body")
  const SI=a.body.geometry.attributes.skinIndex,chest=a.body.skeleton.bones.indexOf(a.bones.chest);
  for(let i=0;i<P.count;i++)if(SI.getX(i)===chest&&P.getY(i)>m.neckY&&Math.abs(P.getX(i))<.03*m.k&&P.getZ(i)<-(m.neckR+.003*m.k))stand++;
  assert.ok(stand>0,name+'\'s collar rises behind the neck, outside it');
  // and no outline across the neck where it goes into the body (the owner: "And no line on his neck like that"): the
  // neck's outline fades to nothing at its foot, and is whole up its sides
  const ink=a.body.geometry.attributes.ink,neckBone=a.body.skeleton.bones.indexOf(a.bones.neck),foot=[],up=[];
  for(let i=0;i<P.count;i++)if(SI.getX(i)===neckBone&&a.body.geometry.attributes.skinWeight.getX(i)>.99)(P.getY(i)<m.neckY-.01*m.k?foot:P.getY(i)>m.neckY+.05*m.k?up:[]).push(ink.getX(i));
  assert.ok(foot.length&&Math.max(...foot)<.05,name+': no outline at the neck\'s foot ('+Math.max(...foot).toFixed(2)+')');
  assert.ok(up.length&&Math.min(...up)>.95,name+': the neck outlined up its sides');
  assert.ok(a.garment.marks.includes('open neck'),'the V of skin is open');
  assert.ok(a.garment.marks.includes('collar shadow'),'the collar casts its toon shadow on the shirt');a.dispose();
 }
});

/**
 * The owner, 27 November 2026: "Johansson's rigged Hawaii shirt needs to be improved too, the collar is way too big going
 * under his arms when drinking". The collar's leaves reached 221 mm out of his 234 mm half-width, nearly to the shoulder
 * seam, and the raised arms went over them: 29 mm into the sleeve drinking, 55 mm pointing, 47 mm clapping. The collar is
 * a camp collar's size now (garment.js CAMP_COLLAR), and stays out of the sleeves in the moves that bring an arm across
 * or up, on the smallest, Johansson's and the largest body.
 */
test('the kariyushi collar stays out from under the arms when they come up or across (drinking, pointing, clapping)',()=>{
 for(const name of ['Vy','Johansson','Sverker']){
  const base=recipeFor(name),kar=buildAvatar({...base,outfit:{...base.outfit,top:'kariyushi'}},{shadows:false}),tee=buildAvatar({...base,outfit:{...base.outfit,top:'tee'}},{shadows:false});
  // the collar: what the kariyushi adds on the front of the chest, bound to the chest alone (a tee has the same torso)
  const key=(P,i)=>[P.getX(i),P.getY(i),P.getZ(i)].map(v=>Math.round(v*1e4)).join(','),T=tee.body.geometry.attributes.position,plain=new Set();for(let i=0;i<T.count;i++)plain.add(key(T,i));
  const g=kar.body.geometry,P=g.attributes.position,SI=g.attributes.skinIndex,SW=g.attributes.skinWeight,m=kar.measure,chest=kar.body.skeleton.bones.indexOf(kar.bones.chest),collar=[];
  for(let i=0;i<P.count;i++)if(!plain.has(key(P,i))&&SI.getX(i)===chest&&SW.getX(i)>.99&&P.getZ(i)>0&&P.getY(i)>m.hipY+.6*m.torso&&P.getY(i)<m.neckY)collar.push(i);
  assert.ok(collar.length>1000,name+': the collar found');
  let reach=0;for(const i of collar)reach=Math.max(reach,Math.abs(P.getX(i)));
  assert.ok(reach<m.width/2*.8,`${name}: the collar's leaves end well inside the shoulders (${(reach*1000).toFixed(0)} of ${(m.width/2*1000).toFixed(0)} mm)`);
  const holder=new THREE.Group();holder.add(kar.root);let s=7;const animator=createAvatarAnimator(kar,{random:()=>{s=(s*16807)%2147483647;return s/2147483647;},initialTime:0});
  const v=new THREE.Vector3(),seg=new THREE.Line3(),cl=new THREE.Vector3(),SH=['L','R'].map(side=>kar.body.skeleton.bones.indexOf(kar.bones['shoulder'+side]));
  for(let i=0;i<30;i++)animator.update(1/60,{});kar.root.updateMatrixWorld(true);
  // the sleeve's radius about the upper arm, from its own vertices half way down it
  const radius=['L','R'].map((side,k)=>{seg.set(kar.bones['shoulder'+side].getWorldPosition(new THREE.Vector3()),kar.bones['elbow'+side].getWorldPosition(new THREE.Vector3()));let sum=0,n=0;
   for(let i=0;i<P.count;i++){if(SI.getX(i)!==SH[k]||SW.getX(i)<.9)continue;v.fromBufferAttribute(P,i);kar.body.applyBoneTransform(i,v);v.applyMatrix4(kar.body.matrixWorld);const t=seg.closestPointToPointParameter(v,true);if(t<.35||t>.65)continue;seg.closestPointToPoint(v,true,cl);sum+=cl.distanceTo(v);n++;}
   return sum/n;});
  for(const move of ['Drink','Point','Clap','CollarTug']){
   const prop=move==='Drink'?createDrinkProp('can',{held:true}):null;if(prop)kar.bones.handR.add(prop);const state=prop?{heldProp:prop}:{};
   for(let i=0;i<20;i++)animator.update(1/60,state);animator.play(move);let deep=0;
   for(let f=0;f<150;f+=2){animator.update(2/60,state);kar.root.updateMatrixWorld(true);
    ['L','R'].forEach((side,k)=>{seg.set(kar.bones['shoulder'+side].getWorldPosition(new THREE.Vector3()),kar.bones['elbow'+side].getWorldPosition(new THREE.Vector3()));
     for(const i of collar){v.fromBufferAttribute(P,i);kar.body.applyBoneTransform(i,v);v.applyMatrix4(kar.body.matrixWorld);if(seg.closestPointToPointParameter(v,true)<.12)continue;seg.closestPointToPoint(v,true,cl);deep=Math.max(deep,radius[k]-cl.distanceTo(v));}});}
   if(prop)disposeServing(prop);
   assert.ok(deep<=.001,`${name}, ${move}: the collar never under the sleeve (${(deep*1000).toFixed(1)} mm into it)`);
  }
  kar.dispose();tee.dispose();
 }
});

/** The owner, 27 November 2026: "He should be wearing a 'wife beater' tank top under his shirt". */
test('Johansson wears a white ribbed tank top under his open kariyushi, showing in its V; nobody else does unless dressed so',()=>{
 assert.equal(recipeFor('Johansson').outfit.under,'tank');
 assert.equal(normalizeRecipe({outfit:{under:'cape'}}).outfit.under,'none','only a known under layer is kept');
 const a=buildAvatar(recipeFor('Johansson'),{shadows:false});
 assert.ok(a.garment.marks.includes('tank top under'),'painted in the V');assert.ok(a.garment.marks.includes('chest hair'),'his chest hair above its scoop');a.dispose();
 const t=buildAvatar({...recipeFor('Thuan'),outfit:{...recipeFor('Thuan').outfit,top:'kariyushi'}},{shadows:false});
 assert.ok(!t.garment.marks.includes('tank top under'),'a kariyushi alone has the skin in its V');t.dispose();
});

test('shirt collars and buttons are painted on the +z front, with nothing stuck on',()=>{
 for(const top of ['polo','blouse','jacket','smock']){
  const a=buildAvatar({...CAST_RECIPES.Thuan,outfit:{...CAST_RECIPES.Thuan.outfit,top,pattern:'flowers'}});
  assert.ok(a.garment.marks.some(m=>m==='collar'||m==='lapels'),top+' has a collar drawn');
  // The torso carries the garment's UVs, centred on the front; every other part samples the empty strip.
  const {position:P,uv:U}=a.body.geometry.attributes,m=a.measure;let front=0;
  for(let i=0;i<P.count;i++){
   const v=U.getY(i);
   if(v>.05){if(P.getZ(i)>m.depth*.4&&Math.abs(P.getX(i))<.02*m.k&&P.getY(i)>m.hipY)assert.ok(Math.abs(U.getX(i)-.5)<.05),front++;}
   else assert.ok(Math.abs(U.getX(i)-.5)<1e-6&&Math.abs(v-.02)<1e-6);
  }
  assert.ok(front>0,'the front of the torso is mapped');a.dispose();
 }
});

test('glasses stay clear of the hand and their rim meets the measured mouth at every height',()=>{
 for(const name of ['Johansson','Thuan'])for(const height of [0,.5,1])for(const kind of ['draft','bottle','oolong','can','coffee']){
  const a=buildAvatar({...CAST_RECIPES[name],body:{...CAST_RECIPES[name].body,height}});
  const prop=createDrinkProp(kind,{held:true}),anim=createAvatarAnimator(a);a.bones.handR.add(prop);
  anim.play('SitDrink');for(let i=0;i<36;i++)anim.update(1/30,{seated:true,heldProp:prop});
  fitAvatarHeldProp(a,prop,anim.consumption.lift);a.root.updateMatrixWorld(true);
  const m=a.measure,L=faceLayout(a.recipe),theta=Math.PI*.28+L.mouthY/256*Math.PI*.58,phi=Math.PI/2-.95+L.mouthX/256*1.9;
  const v=shapeHeadPoint(new THREE.Vector3(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta)),m.profile);
  const mouth=a.bones.head.localToWorld(new THREE.Vector3(v.x*m.Rh*m.headSX,m.headCentre-m.headY+v.y*m.Rh*m.headSY,v.z*m.Rh*.98+.025*m.k));
  const rim=prop.localToWorld(new THREE.Vector3(0,prop.userData.rimHeight,0));
  assert.ok(rim.distanceTo(mouth)<.015,name+' '+height+' '+kind+' reaches lips');
  // The palm closes on the drink: on the outside of a mug's handle, on a tumbler's side.
  const palm=prop.worldToLocal(a.bones.handR.localToWorld(new THREE.Vector3(0,-m.hand*.55,0))),grip=prop.userData.grip;
  const across=Math.hypot(palm.x,palm.z);
  if(grip.handle!=null)assert.ok(palm.x>grip.handle&&across<grip.handle+m.hand,name+' '+kind+' holds the handle');
  else assert.ok(across>grip.radius&&across<grip.radius+m.hand*1.1,name+' '+kind+' palm on the glass, not floating beside it ('+across.toFixed(3)+')');
  assert.ok(Math.abs(palm.y-grip.height)<.01,name+' '+kind+' held at the grip height');
  disposeServing(prop);a.dispose();
 }
 assert.equal(consumptionPhase(0).lift,0);assert.equal(consumptionPhase(1.2).lift,1);assert.equal(consumptionPhase(2.4).lift,0);
});

test('liquid drains smoothly and food pieces disappear without flattening the whole dish',()=>{
 const glass=createDrinkProp('bottle'),dish=createDishProp('sashimi');
 setPropPortion(glass,.5);updatePropPortion(glass,1/60);
 assert.ok(glass.userData.portion<1&&glass.userData.portion>.5);
 for(let i=0;i<100;i++)updatePropPortion(glass,1/60);
 assert.ok(Math.abs(glass.userData.portion-.5)<.002);
 setPropPortion(dish,.5,{immediate:true});
 const pieces=dish.userData.level.children;assert.ok(pieces.some(o=>!o.visible));assert.ok(pieces.some(o=>o.visible&&o.scale.y===1));
 setPropPortion(glass,0,{immediate:true});assert.equal(glass.userData.level.visible,false);
 disposeServing(glass);disposeServing(dish);
});

test('resident props and portions work for named residents and a generic visitor',()=>{
 for(const name of ['Thuan','Johansson','Mrs Nakamura','Visiting engineer']){
  const entity=new THREE.Group();entity.userData.name=name;
  const actor=createAvatarActor(entity,name);entity.userData.socialPose='Drink';entity.userData.seatHeight=.45;entity.userData.heldItem='beer';entity.userData.heldPortion=.5;
  for(let i=0;i<40;i++)updateAvatarActor(actor,1/30);
  assert.ok(actor.heldProp);assert.equal(actor.heldProp.parent,actor.avatar.bones.handR);assert.ok(Math.abs(actor.heldProp.userData.portion-.5)<.002);
  entity.userData.socialPose='Eat';entity.userData.heldItem='ramen';entity.userData.foodPortion=.4;
  for(let i=0;i<40;i++)updateAvatarActor(actor,1/30);
  assert.ok(actor.dishProp);assert.equal(actor.dishProp.parent,actor.avatar.bones.handL);assert.ok(Math.abs(actor.dishProp.userData.portion-.4)<.002);
  delete entity.userData.heldItem;entity.userData.socialPose='Sit';updateAvatarActor(actor,1/30);assert.equal(actor.heldProp,null);assert.equal(actor.dishProp,null);actor.avatar.dispose();
 }
});

test('a beer keeps its head as it empties, bubbles stay in the beer, and the last sip tips further',async()=>{
 const {drinkTilt}=await import('../src/avatars/consume.js');
 const glass=createDrinkProp('draft'),u=glass.userData,p=u.pour;
 assert.ok(p,'a poured beer has a liquid, a head and bubbles');
 for(const left of [1,.6,.2]){
  setPropPortion(glass,left,{immediate:true});for(let i=0;i<30;i++)updatePropPortion(glass,1/30);
  const top=p.bottom+p.height*left,headBase=p.head.position.y-p.headHeight*p.head.scale.y/2;
  assert.ok(Math.abs(headBase-top)<1e-6,'the foam sits on the beer at '+left);
  assert.ok(p.head.visible,'there is still a head at '+left);
  const pos=p.bubbles.geometry.attributes.position;for(let i=0;i<pos.count;i++)assert.ok(pos.getY(i)<=top+1e-6,'a bubble above the beer at '+left);
 }
 setPropPortion(glass,0,{immediate:true});assert.equal(glass.userData.level.visible,false,'an empty glass shows no beer and no foam');
 const full=createDrinkProp('draft'),last=createDrinkProp('draft');setPropPortion(last,.05,{immediate:true});
 assert.ok(drinkTilt(last,1)<drinkTilt(full,1),'the last mouthful is tipped further than the first');
 assert.equal(drinkTilt(full,1,true),0,'food stays level');
});
