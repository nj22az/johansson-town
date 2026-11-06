import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar,bodyVolume,wearsSwimTop,wearsSwimSkirt,SWIMSUIT,TENUGUI,TURBAN,HAIR_STATES,BONES} from '../src/avatars/build.js';
import {AFTERBATH,houseDressColour} from '../src/avatars/outfits.js';
import {recipeFor,CAST_RECIPES} from '../src/avatars/cast.js';
import {normalizeRecipe} from '../src/avatars/recipe.js';
import {createAvatarAnimator,GESTURES} from '../src/avatars/animate.js';
import {createAvatarActor,updateAvatarActor} from '../src/avatars/actors.js';
import {previewOutfits} from '../src/avatars/creator.js';
import {faceLayout} from '../src/avatars/face.js';
installDOM();

/**
 * Umi-no-yu's dress (The Breaker at Umi-no-yu, shot plan C1): nobody is ever bare. Behind the noren the bath wrap; in the
 * shared lobby the after-bath clothes of a town bath in the 80s and 90s; in the shared bath swimwear. And the hair states
 * the story needs: Nhung's half-dried bob, Fujita's cloud, hair slicked flat by the water.
 */
const SIX=['Mr Fujita','Thuan','Nhung','Thao','Tetsuo','Miss Higa'];
const shown=avatar=>avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible).map(o=>o.name).sort();
const after=avatar=>avatar.root.children.find(o=>o.name.startsWith('Shimanchu after the bath')&&!o.name.endsWith('outline'));
const swimOf=avatar=>avatar.root.children.find(o=>o.name==='Shimanchu swimwear');
const towelOf=avatar=>avatar.root.children.find(o=>o.name==='Shimanchu bath towel');
const child=normalizeRecipe({...CAST_RECIPES.Thuan,name:'Kid',age:'child'});
const seeded=()=>{let s=11;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};};
const near=(a,b,e=1e-6)=>Math.abs(a-b)<=e;

test('after the bath grown-ups change into the lobby clothes; children keep their own',()=>{
 for(const name of SIX){
  const recipe=recipeFor(name),avatar=buildAvatar(recipe,{shadows:false}),women=recipe.body.silhouette==='feminine';
  assert.equal(avatar.wear('afterbath'),'afterbath',name);assert.equal(avatar.outfit,'afterbath');
  const body=after(avatar);
  assert.deepEqual(shown(avatar),[body.name,body.name+' outline'].sort(),name+': the after-bath clothes, inked, and nothing else');
  assert.equal(body.userData.afterbath.women,women,name);
  if(women){
   assert.equal(body.userData.afterbath.dress,houseDressColour(recipe));assert.ok(body.userData.afterbath.skirt,'the dress skirt is fitted to the legs');
   assert.equal(body.userData.tenugui,undefined,'no tenugui round a woman’s neck');
  }else{assert.ok(body.userData.tenugui.count>1000,name+': the tenugui round his neck');assert.equal(body.userData.afterbath.skirt,false);}
  // Barefoot: the shoes are in the getabako at the genkan.
  assert.equal(AFTERBATH.men.footwear,'barefoot');assert.equal(AFTERBATH.women.footwear,'barefoot');
  // Back and forth leaves nothing behind.
  const meshes=avatar.root.children.length;
  for(const o of ['clothes','afterbath','swim','towel','afterbath','clothes'])avatar.wear(o);
  assert.equal(avatar.root.children.length,meshes+4,'one swimwear and one wrap body were added, with their ink, no more');
  assert.equal(avatar.body.visible,true);assert.equal(body.visible,false);
  avatar.dispose();
 }
 // A child keeps their clothes in the lobby, as they keep their swimwear behind the noren.
 const kid=buildAvatar(child,{shadows:false});
 assert.equal(kid.wear('afterbath'),'clothes');assert.equal(after(kid),undefined,'nothing is made for them');assert.equal(kid.body.visible,true);kid.dispose();
 // The maker offers it to grown-ups.
 assert.deepEqual(previewOutfits(CAST_RECIPES.Johansson).map(o=>o.value),['clothes','swim','towel','afterbath']);
 assert.equal(previewOutfits(child).find(o=>o.value==='afterbath').disabled,true);
 // Residents are dressed by the flag, like the bath's other outfits.
 const scene=new THREE.Scene(),entity=new THREE.Group();entity.userData.name='Mr Fujita';scene.add(entity);
 const actor=createAvatarActor(entity,'Mr Fujita');entity.userData.outfit='afterbath';updateAvatarActor(actor,1/30,0);
 assert.equal(actor.outfit,'afterbath');assert.equal(after(actor.avatar).visible,true);
});

test('each woman’s house dress is a washed pastel of what she likes to wear, and the same every time',()=>{
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const dresses=['Thuan','Nhung','Thao','Miss Higa'].map(n=>{const r=recipeFor(n),d=houseDressColour(r),pale=rgb(r.outfit.topColour).every(v=>v>215),base=pale?r.outfit.accent:r.outfit.topColour;
  assert.equal(houseDressColour(r),d);
  assert.ok(rgb(d).every((v,k)=>v>=rgb(base)[k])&&rgb(d).reduce((a,b)=>a+b)/3>175,n+': '+d+', a pastel of '+base);return d;});
 assert.equal(new Set(dresses).size,4,'four women, four dresses: '+dresses.join(' '));
});

/** The body under the clothes, as built: vertices bound to the trunk and the neck alone that are not the cloth, with normals. */
function trunk(mesh,isCloth){
 const g=mesh.geometry,P=g.attributes.position,N=g.attributes.normal,I=g.attributes.skinIndex,W=g.attributes.skinWeight,names=mesh.skeleton.bones.map(b=>b.name),pts=[];
 const keep=new Set(['hips','spine','chest','neck']);
 for(let i=0;i<P.count;i++){if(isCloth(i))continue;const bones=[0,1,2,3].filter(k=>W.getComponent(i,k)>1e-3).map(k=>names[I.getComponent(i,k)]);if(bones.length&&bones.every(b=>keep.has(b)))pts.push({p:new THREE.Vector3().fromBufferAttribute(P,i),n:new THREE.Vector3().fromBufferAttribute(N,i)});}
 return pts;
}

test('the vest, its straps and the tenugui lie on the body at rest, never in it',()=>{
 for(const name of ['Mr Fujita','Tetsuo','Johansson']){
  const recipe=recipeFor(name),avatar=buildAvatar(recipe,{shadows:false});avatar.wear('afterbath');
  const body=after(avatar),m=avatar.measure,vol=bodyVolume(avatar.recipe,m),P=body.geometry.attributes.position,C=body.geometry.attributes.color;
  const white=new THREE.Color(AFTERBATH.men.topColour),t=body.userData.tenugui,p=new THREE.Vector3();
  // Every vertex of the vest (its colour, above the drawers) and of the tenugui, outside the trunk, the caps and the neck.
  const isVest=i=>Math.abs(C.getX(i)-white.r)<1e-3&&Math.abs(C.getY(i)-white.g)<1e-3&&Math.abs(C.getZ(i)-white.b)<1e-3,isCloth=i=>i>=t.start&&i<t.start+t.count||isVest(i);
  let checked=0,deepest=-Infinity;const cloth=[];
  for(let i=0;i<P.count;i++){
   if(!isCloth(i))continue;p.fromBufferAttribute(P,i);if(p.y<m.hipY+m.torso*.05)continue;
   checked++;deepest=Math.max(deepest,-vol.sdf(p));if(i%4===0)cloth.push(p.clone());
  }
  assert.ok(checked>8000,name+': checked '+checked);
  assert.ok(deepest<-.002*m.k,`${name}: the cloth sits ${(-deepest*1000).toFixed(1)} mm off the body at least`);
  // And against the body as built (the skin under the cloth): at the cloth's height, in its direction from the body's axis,
  // the skin is nearer the axis than the cloth.
  const pts=trunk(body,isCloth);let compared=0;
  for(const c of cloth){const r=Math.hypot(c.x,c.z),a=Math.atan2(c.x,c.z);
   for(const {p:b} of pts){if(Math.abs(b.y-c.y)>.004)continue;let da=Math.abs(Math.atan2(b.x,b.z)-a);if(da>Math.PI)da=Math.PI*2-da;if(da>.04)continue;
    compared++;assert.ok(Math.hypot(b.x,b.z)<r,name+': the body comes through the cloth at '+c.toArray().map(v=>v.toFixed(3)));}}
  assert.ok(compared>2000,'compared '+compared);
  avatar.dispose();
 }
});

/** Distance from p to the segment a-b. */
const segment=(p,a,b)=>{const ab=b.clone().sub(a),t=THREE.MathUtils.clamp(p.clone().sub(a).dot(ab)/ab.lengthSq(),0,1);return p.distanceTo(a.clone().addScaledVector(ab,t));};
/** Every pose the town has: standing, walking, running, a chair, the massage chair, asleep in it, coffee milk, and every gesture. */
function* everyPose(animator){
 const held={stand:{},walk:{speed:1.3},run:{speed:3.6,running:true},sit:{seated:true,seatHeight:.45},chair:{seated:true,seatHeight:.5},
  sleep:{seated:true,seatHeight:.5,pose:'Sleep'},drinkHip:{pose:'DrinkHip'},sitDrinkHip:{seated:true,seatHeight:.5,pose:'SitDrinkHip'}};
 for(const [name,state] of Object.entries(held))for(let f=0;f<80;f++){animator.update(1/60,state);if(f%20===19)yield name;}
 for(const g of Object.keys(GESTURES)){animator.play(g,1.6);for(let f=0;f<100;f++){animator.update(1/60,{});if(f%25===24)yield g;}}
}

test('in every pose the tenugui keeps off the chin and the neck, and an arm meets it only where the pose already puts that arm in the chest',()=>{
 for(const [name,state,direction] of [['Mr Fujita','rest'],['Tetsuo','rest'],['Mr Fujita','flag',Math.PI],['Mr Fujita','flag',Math.PI/2],['Tetsuo','flag',-2.3],['Mr Fujita','flag',-Math.PI/2]]){
  const avatar=buildAvatar(recipeFor(name),{shadows:false});avatar.wear('afterbath');avatar.setTenugui(state,direction);
  const body=after(avatar),t=body.userData.tenugui,m=avatar.measure,vol=bodyVolume(avatar.recipe,m),holder=new THREE.Group();holder.add(avatar.root);
  const S=[m.Rh*m.headSX,m.Rh*m.headSY,m.Rh*.98],hc=m.headCentre-m.headY,stand=(TENUGUI.gap+TENUGUI.thickness)*m.k;
  const p=new THREE.Vector3(),q=new THREE.Vector3(),inv=new THREE.Matrix4(),toChest=new THREE.Matrix4(),lift=new THREE.Vector3(0,m.chestY,0);
  let poses=0;
  for(const pose of everyPose(createAvatarAnimator(avatar,{random:seeded()}))){
   holder.updateMatrixWorld(true);poses++;
   const at=n=>avatar.bones[n].getWorldPosition(new THREE.Vector3());
   const arms=[['shoulderL','elbowL'],['elbowL','handL'],['shoulderR','elbowR'],['elbowR','handR']].map(([a,b])=>[at(a),at(b)]);
   const neck=[at('neck'),at('head')];
   inv.copy(avatar.bones.head.matrixWorld).invert();toChest.copy(avatar.bones.chest.matrixWorld).invert();
   // How far into the chest each arm already goes in this pose (away from the shoulder joint, which always sits in it), read
   // in the chest's frame (to within a few millimetres low down, where the torso also bends with the hips).
   const intoChest=arms.map(([a,b],k)=>{let d=-Infinity;for(let s=k%2?0:.6;s<=1.001;s+=.05){const x=a.clone().lerp(b,s).applyMatrix4(toChest).add(lift);if(x.y>m.hipY+m.torso*.3)d=Math.max(d,m.armR*1.04-vol.sdf(x));}return d;});
   for(let i=t.start;i<t.start+t.count;i+=2){
    body.getVertexPosition(i,p);body.localToWorld(p);
    q.copy(p).applyMatrix4(inv);
    assert.ok(Math.hypot(q.x/S[0],(q.y-hc)/S[1],q.z/S[2])>=1,`${name} ${state} ${pose}: the head comes down through the tenugui`);
    assert.ok(segment(p,...neck)>m.armR*1.08,`${name} ${state} ${pose}: the neck goes through the tenugui`);
    // An arm may rest on the cloth (a few millimetres, as it would press real cotton), and goes further only where the pose
    // already puts it into the chest under the cloth.
    arms.forEach(([a,b],k)=>{const d=m.armR*1.04-segment(p,a,b);if(d>.003*m.k)assert.ok(intoChest[k]>=d-stand-.004*m.k,`${name} ${state} ${pose}: an arm goes ${(d*1000).toFixed(0)} mm into the tenugui but only ${(intoChest[k]*1000).toFixed(0)} mm into the chest`);});
   }
  }
  assert.ok(poses>150,'every pose: '+poses);
  avatar.dispose();
 }
});

test('nothing goes below the floor, and the house dress and the swimsuit skirt stay out of the legs and sit on the seat',()=>{
 const poses={stand:{},walk:{speed:1.3},run:{speed:3.6,running:true},sit:{seated:true,seatHeight:.45},chair:{seated:true,seatHeight:.5}};
 for(const [name,outfit] of [['Thuan','afterbath'],['Miss Higa','afterbath'],['Mr Fujita','afterbath'],['Miss Higa','swim']]){
  for(const [pose,state] of Object.entries(poses)){
   const avatar=buildAvatar(recipeFor(name),{shadows:false});avatar.wear(outfit);
   const mesh=outfit==='swim'?swimOf(avatar):after(avatar),m=avatar.measure,fit=mesh.towelFit,flags=mesh.geometry.attributes.towelFit,holder=new THREE.Group();holder.add(avatar.root);
   const animator=createAvatarAnimator(avatar,{random:seeded()}),p=new THREE.Vector3(),ab=new THREE.Vector3(),d=new THREE.Vector3();
   const at=n=>avatar.bones[n].getWorldPosition(new THREE.Vector3());
   for(let f=0;f<90;f++){
    animator.update(1/60,state);if(f%15)continue;holder.updateMatrixWorld(true);fit?.refresh();
    let lowest=Infinity,deepest=0,lowCloth=Infinity;
    const legs=[['thighL','kneeL'],['thighR','kneeR']].map(([a,b])=>[at(a),at(b)]);
    for(let i=0;i<mesh.geometry.attributes.position.count;i+=2){
     mesh.getVertexPosition(i,p);const fitted=flags&&flags.getX(i)>.5;if(fitted)fit.fitPoint(p);mesh.localToWorld(p);lowest=Math.min(lowest,p.y);
     if(!fitted)continue;lowCloth=Math.min(lowCloth,p.y);
     for(const [A,B] of legs){ab.subVectors(B,A);const t=THREE.MathUtils.clamp(d.subVectors(p,A).dot(ab)/ab.lengthSq(),0,1);deepest=Math.max(deepest,m.legR*(1.02-.16*t*m.thigh/(m.hipY-m.foot))-d.copy(A).addScaledVector(ab,t).distanceTo(p));}
    }
    assert.ok(lowest>-.004,`${name} ${outfit} ${pose}: something goes ${(-lowest*1000).toFixed(1)} mm below the floor`);
    if(fit){assert.ok(deepest<=1e-4,`${name} ${outfit} ${pose}: a thigh comes through the skirt by ${deepest}`);
     if(state.seated&&f>=60)assert.ok(lowCloth>state.seatHeight-.03,`${name} ${outfit} ${pose}: the skirt sinks into the seat (${lowCloth})`);}
   }
   avatar.dispose();
  }
 }
});

test('the turban covers the hair, sized to it, and leaves the brows and eyes clear',()=>{
 for(const name of ['Thuan','Nhung','Thao','Miss Higa']){
  const recipe=recipeFor(name),avatar=buildAvatar(recipe,{shadows:false});avatar.wear('afterbath');
  const body=after(avatar),m=avatar.measure,g=body.geometry,P=g.attributes.position,C=g.attributes.color,I=g.attributes.skinIndex,head=BONES.indexOf('head');
  const hair=new THREE.Color(recipe.hair.colour),S=[m.Rh*m.headSX,m.Rh*m.headSY,m.Rh*.98];
  let towel=0,hairLeft=0,lowestFront=Infinity,reach=0;const terry=['#f2ede2','#ddd5c3'].map(h=>new THREE.Color(h));
  for(let i=0;i<P.count;i++){
   if(I.getX(i)!==head)continue;
   if(Math.abs(C.getX(i)-hair.r)<1e-3&&Math.abs(C.getY(i)-hair.g)<1e-3&&Math.abs(C.getZ(i)-hair.b)<1e-3)hairLeft++;
   const x=P.getX(i)/S[0],y=(P.getY(i)-m.headCentre)/S[1],z=P.getZ(i)/S[2],r=Math.hypot(x,y,z);
   if(r<1.02||!terry.some(c=>Math.abs(C.getX(i)-c.r)<1e-3&&Math.abs(C.getY(i)-c.g)<1e-3))continue;towel++;reach=Math.max(reach,r);
   if(z>.55&&Math.abs(x)<.35)lowestFront=Math.min(lowestFront,y);
  }
  assert.equal(hairLeft,0,name+': no hair outside the towel');assert.ok(towel>2000,name+': the turban');
  // It reads as a towel: Umi-no-yu's navy band shows on it, in the twist at the front and round the back.
  const navy=new THREE.Color('#2e3e68');let front=0,back=0;
  for(let i=0;i<P.count;i++){if(I.getX(i)!==head||Math.abs(C.getX(i)-navy.r)>1e-3||Math.abs(C.getZ(i)-navy.b)>1e-3)continue;if(P.getZ(i)>m.Rh*.3)front++;else if(P.getZ(i)<-m.Rh*.3)back++;}
  assert.ok(front>200&&back>200,`${name}: the towel's navy band, ${front} in front and ${back} behind`);
  // Long hair (all four have it) needs the fuller turban.
  assert.ok(reach>=TURBAN.longRadius*.98,name+': a turban for long hair, '+reach.toFixed(2));
  // Its front edge is above the brows at their highest (surprised: browLift 20 px of the 256 px face).
  const browY=Math.cos(Math.PI*.28+(faceLayout(recipe).browY-20)/256*Math.PI*.58);
  assert.ok(lowestFront>browY+.03,`${name}: the turban's edge (${lowestFront.toFixed(2)}) clears the brows (${browY.toFixed(2)})`);
  avatar.dispose();
 }
});

test('swimwear for the story’s six is modest: one-piece costumes (the skirted one only for the older generation), bath trunks, and Tetsuo’s towel on his head',()=>{
 for(const name of SIX){
  const recipe=recipeFor(name),avatar=buildAvatar(recipe,{shadows:false});
  assert.equal(avatar.wear('swim'),'swim');const swim=swimOf(avatar),m=avatar.measure;
  assert.deepEqual(shown(avatar),['Shimanchu swimwear','Shimanchu swimwear outline'],name+': swimwear, inked like everyone else');
  const g=swim.geometry,P=g.attributes.position,C=g.attributes.color,I=g.attributes.skinIndex,W=g.attributes.skinWeight,names=swim.skeleton.bones.map(b=>b.name);
  const suit=new THREE.Color(recipe.swim.colour),skin=new THREE.Color(recipe.body.skin),same=(i,c)=>Math.abs(C.getX(i)-c.r)<1e-3&&Math.abs(C.getY(i)-c.g)<1e-3&&Math.abs(C.getZ(i)-c.b)<1e-3;
  const top=wearsSwimTop(recipe),women=recipe.body.silhouette==='feminine';
  assert.equal(top,women,name+': a costume for the women, trunks for the men');
  // The torso (hips and chest only) from the hips to above the bust: all costume for a one-piece; skin above the waist for trunks.
  let suitRows=0,skinRows=0;
  for(let i=0;i<P.count;i++){
   const bones=[0,1,2,3].filter(k=>W.getComponent(i,k)>1e-3).map(k=>names[I.getComponent(i,k)]);if(!bones.every(b=>b==='hips'||b==='chest'))continue;
   const t=(P.getY(i)-m.hipY)/m.torso,front=P.getZ(i)>0&&Math.abs(P.getX(i))<m.width*.3;if(!front||t<.2||t>.74)continue;
   if(same(i,suit))suitRows++;else if(same(i,skin))skinRows++;
  }
  if(top)assert.ok(suitRows>50&&skinRows===0,`${name}: covered from the hips to above the bust (${suitRows} costume, ${skinRows} bare)`);
  else assert.ok(skinRows>50,name+': bare-chested in trunks');
  // Trunks to mid-thigh; a costume's short legs.
  let low=Infinity;for(let i=0;i<P.count;i++)if(same(i,suit)&&P.getY(i)<m.hipY)low=Math.min(low,P.getY(i));
  const want=top?(wearsSwimSkirt(recipe)?.42:SWIMSUIT.legs):SWIMSUIT.trunks;
  assert.ok(low<=m.hipY-m.thigh*want*.95,`${name}: down to ${((m.hipY-low)/m.thigh).toFixed(2)} of the thigh`);
  assert.equal(swim.userData.swim.skirt,wearsSwimSkirt(recipe),name+': the skirted costume is for the older generation');
  if(name==='Miss Higa')assert.equal(swim.userData.swim.skirt,false,'Miss Higa is 29: a plain one-piece');
  // The folded towel on the head: off unless asked for, on for Tetsuo's soak.
  assert.equal(avatar.headTowel,false);assert.equal(g.drawRange.count,swim.userData.swim.headTowel[0]);
  assert.equal(avatar.wear('swim',{headTowel:true}),'swim');assert.equal(avatar.headTowel,true);assert.equal(g.drawRange.count,Infinity);
  const [h0,h1]=swim.userData.swim.headTowel;for(let i=h0;i<h1;i+=7){assert.equal(I.getX(i),BONES.indexOf('head'));assert.ok(P.getY(i)>m.headCentre+m.Rh*m.headSY*.6,name+': on the crown');}
  avatar.wear('swim');assert.equal(avatar.headTowel,false);
  avatar.dispose();
 }
 // The wrap's towel can come off for drying the hair at the mirror, and goes back on by default.
 const nhung=buildAvatar(recipeFor('Nhung'),{shadows:false});
 nhung.wear('towel',{headTowel:false});assert.equal(nhung.headTowel,false);assert.equal(towelOf(nhung).geometry.drawRange.count,towelOf(nhung).userData.towel.head[0]);
 nhung.wear('towel');assert.equal(nhung.headTowel,true);assert.equal(towelOf(nhung).geometry.drawRange.count,Infinity);nhung.dispose();
});

/** A body's hair, as positions, by its colour (the hair colour, or wet: darker). */
const hairOf=(mesh,recipe)=>{const P=mesh.geometry.attributes.position,I=mesh.geometry.attributes.skinIndex,C=mesh.geometry.attributes.color,c=new THREE.Color(recipe.hair.colour),out=[];
 for(let i=0;i<P.count;i++){if(I.getX(i)!==BONES.indexOf('head'))continue;const k=C.getX(i)/c.r;if(Math.abs(C.getY(i)-c.g*k)<2e-3&&Math.abs(C.getZ(i)-c.b*k)<2e-3&&k>.5&&k<1.01)out.push(i);}return out;};

test('hair states: half-dried (one side dry and blown out, the other wet and flat), slicked flat with water, Nhung’s half-dried bob (the cloud is retired)',()=>{
 assert.deepEqual(HAIR_STATES,[null,'halfDry','wetFlat']);
 const fujita=recipeFor('Mr Fujita'),a=buildAvatar(fujita,{shadows:false});a.wear('afterbath');
 const body=after(a),m=a.measure,P=body.geometry.attributes.position,hair=hairOf(body,fujita),rest=hair.map(i=>new THREE.Vector3().fromBufferAttribute(P,i));
 assert.ok(hair.length>10000,'his hair: '+hair.length);
 assert.throws(()=>a.setHairState('frizz'));
 // The creator, 2026-10-10: "I don't want Fujitas hair blown up like that".
 assert.throws(()=>a.setHairState('cloud'),'no blown-up cloud of hair');
 assert.equal(a.setHairState('halfDry'),'halfDry');assert.equal(a.hairState.state,'halfDry');
 const puffed=hair.map(i=>new THREE.Vector3().fromBufferAttribute(P,i));
 assert.ok(puffed.some((p,k)=>p.distanceTo(rest[k])>.01),'one side stands out');
 // Deterministic: another Fujita gets the same half-dried hair.
 const b=buildAvatar(fujita,{shadows:false});b.wear('afterbath');b.setHairState('halfDry');
 assert.deepEqual(Array.from(after(b).geometry.attributes.position.array),Array.from(P.array));b.dispose();
 // Sinking in the water: from half-dried to wet and flat, every point on a straight line, nothing popping.
 a.setHairState('wetFlat',{from:'halfDry',amount:0});hair.forEach((i,k)=>assert.ok(new THREE.Vector3().fromBufferAttribute(P,i).distanceTo(puffed[k])<1e-6));
 a.setHairState('wetFlat');const wet=hair.map(i=>new THREE.Vector3().fromBufferAttribute(P,i));
 a.setHairState('wetFlat',{from:'halfDry',amount:.5});hair.forEach((i,k)=>assert.ok(new THREE.Vector3().fromBufferAttribute(P,i).distanceTo(puffed[k].clone().lerp(wet[k],.5))<1e-5));
 // Wet: darker, and flat to the scalp but never inside it.
 a.setHairState('wetFlat');
 const C=body.geometry.attributes.color,colour=new THREE.Color(fujita.hair.colour);assert.ok(near(C.getX(hair[0]),colour.r*.6,1e-3),'darker with water');
 const headMesh=new THREE.Mesh(a.face.head.geometry.clone().translate(0,m.headCentre,0),new THREE.MeshBasicMaterial({side:THREE.DoubleSide})),ray=new THREE.Raycaster(),c=new THREE.Vector3(0,m.headCentre,0);
 let flat=0;
 // (Only the hair that is outside the head at rest: where the hairline tucks into the scalp it is inside it anyway.)
 const surface=p=>{const d=p.clone().sub(c),r=d.length();ray.set(c,d.normalize());const hit=ray.intersectObject(headMesh)[0];return hit?{r,at:hit.distance}:null;};
 let compared=0;
 for(let k=0;k<hair.length;k+=5){const before=surface(rest[k]);if(!before||before.r<=before.at)continue;const now=surface(wet[k]);compared++;
  assert.ok(now.r>now.at,'wet hair inside the head at '+wet[k].toArray().map(v=>v.toFixed(3)));if(now.r<now.at*1.06)flat++;}
 assert.ok(compared>1000,'compared '+compared);
 assert.ok(flat>compared*.8,'it lies flat: '+flat+' of '+compared);
 // As it was.
 a.setHairState(null);hair.forEach((i,k)=>assert.ok(new THREE.Vector3().fromBufferAttribute(P,i).equals(rest[k])));assert.ok(near(C.getX(hair[0]),colour.r,1e-6));
 a.dispose();

 // Nhung at the mirror, in her wrap with the towel off her head, caught half way through drying: her bob dry and blown out in
 // a big puff on her right (the dryer was in her right hand), still wet on her left, flat to her head and darker; lopsided
 // enough to read at comic size, the face clear.
 const nhung=recipeFor('Nhung'),n=buildAvatar(nhung,{shadows:false});n.wear('towel',{headTowel:false});
 const wrap=towelOf(n),NP=wrap.geometry.attributes.position,nh=hairOf(wrap,nhung),nm=n.measure,before=nh.map(i=>new THREE.Vector3().fromBufferAttribute(NP,i));
 n.setHairState('halfDry');const dried=nh.map(i=>new THREE.Vector3().fromBufferAttribute(NP,i));
 // how far the hair reaches to each side (her left is +x), in half-widths of her head
 const half=nm.Rh*nm.headSX,reach=(list,side)=>Math.max(...list.map(p=>p.x*side))/half;
 assert.ok(reach(dried,-1)>1.8,'the dry side blown out well past her head: '+reach(dried,-1).toFixed(2)+' half-widths');
 assert.ok(reach(dried,1)<1.07&&reach(dried,1)<reach(before,1)-.05,'the wet side flat to her head: '+reach(dried,1).toFixed(2));
 assert.ok(reach(dried,-1)-reach(dried,1)>.7,'lopsided');
 const NC=wrap.geometry.attributes.color,hue=new THREE.Color(nhung.hair.colour),shade=k=>NC.getX(nh[k])/hue.r;
 const wetSide=nh.map((i,k)=>k).filter(k=>dried[k].x>half*.5),drySide=nh.map((i,k)=>k).filter(k=>dried[k].x<-half*.5);
 assert.ok(wetSide.length>100&&wetSide.every(k=>shade(k)<.7),'darker with water on the wet side');assert.ok(drySide.length>100&&drySide.every(k=>shade(k)>.95),'its own colour on the dry side');
 // no more hair over the face (outside the head, below the brows, before the cheeks) than her bob has as it is
 const face=list=>list.filter(p=>Math.hypot(p.x/half,(p.y-nm.headCentre)/(nm.Rh*nm.headSY),p.z/(nm.Rh*.98))>1&&p.y<nm.headCentre+nm.Rh*nm.headSY*.25&&p.y>nm.headCentre-nm.Rh*nm.headSY&&p.z>nm.Rh*.5&&Math.abs(p.x)<half*.75).length;
 assert.ok(face(dried)<=face(before),'the face clear: '+face(dried)+' points of hair over it, '+face(before)+' before');
 // With the towel on her head the hair under it stays as it lies.
 n.wear('towel');nh.forEach((i,k)=>assert.ok(new THREE.Vector3().fromBufferAttribute(NP,i).equals(before[k]),'covered hair is left alone'));
 n.wear('towel',{headTowel:false});assert.ok(new THREE.Vector3().fromBufferAttribute(NP,nh[0]).distanceTo(dried[0])<1e-6,'and back to the state uncovered');
 // A beret (hers from the bookshop days; the doctor wears none since 22 October 2026): hair under a hat is tucked and
 // stays tucked; hat off, the state shows.
 const hat=buildAvatar(normalizeRecipe({...nhung,outfit:{...nhung.outfit,hat:'beret',hatColour:'#5f8f6a'}}),{shadows:false}),HP=hat.body.geometry.attributes.position,hh=hairOf(hat.body,nhung),tucked=hh.map(i=>new THREE.Vector3().fromBufferAttribute(HP,i));
 hat.setHairState('halfDry');hh.forEach((i,k)=>assert.ok(new THREE.Vector3().fromBufferAttribute(HP,i).equals(tucked[k])));
 hat.setHat(false);assert.ok(hh.some((i,k)=>new THREE.Vector3().fromBufferAttribute(HP,i).distanceTo(tucked[k])>.01));
 hat.setHat(true);hh.forEach((i,k)=>assert.ok(new THREE.Vector3().fromBufferAttribute(HP,i).equals(tucked[k])));
 n.dispose();hat.dispose();
});

test('the tenugui streams like a flag in a gust, the same for the same wind and moment, and is itself again after',()=>{
 const a=buildAvatar(recipeFor('Mr Fujita'),{shadows:false});
 // Asked before the clothes are on, it is remembered.
 assert.equal(a.setTenugui('flag',Math.PI,{time:.25}),'flag');a.wear('afterbath');
 const body=after(a),t=body.userData.tenugui,P=body.geometry.attributes.position,m=a.measure;
 const read=()=>Array.from(P.array.slice(t.start*3,(t.start+t.count)*3));
 const flag=read();a.setTenugui('rest');const rest=read();
 assert.notDeepEqual(flag,rest);a.setTenugui('flag',Math.PI,{time:.25});assert.deepEqual(read(),flag,'deterministic');
 a.setTenugui('flag',Math.PI,{time:.6});assert.notDeepEqual(read(),flag,'it ripples over time');
 a.setTenugui('rest');assert.deepEqual(read(),rest,'and lies down again exactly');
 assert.throws(()=>a.setTenugui('knot'));
 // Where the wind blows it: behind him, to his left, ahead.
 const reach=dir=>{a.setTenugui('flag',dir);const v=read();let far=-Infinity;for(let i=0;i<v.length;i+=3)far=Math.max(far,v[i]*Math.sin(dir)+v[i+2]*Math.cos(dir));return far;};
 const restReach=dir=>{let far=-Infinity;for(let i=0;i<rest.length;i+=3)far=Math.max(far,rest[i]*Math.sin(dir)+rest[i+2]*Math.cos(dir));return far;};
 for(const dir of [Math.PI,Math.PI/2,-Math.PI/2,2.3])assert.ok(reach(dir)>restReach(dir)+.08*m.k,'it streams towards '+dir.toFixed(2));
 // Ahead of sideways is drawn as sideways (ends blown forward would go through the arms).
 a.setTenugui('flag',.6);const ahead=read();a.setTenugui('flag',Math.PI/2);assert.deepEqual(ahead,read());
 // Always out of the body, whichever way it blows.
 const vol=bodyVolume(a.recipe,m),p=new THREE.Vector3();
 for(const dir of [Math.PI,Math.PI/2,-Math.PI/2,0,2.3,-.8]){a.setTenugui('flag',dir,{time:dir});for(let i=t.start;i<t.start+t.count;i++){p.fromBufferAttribute(P,i);assert.ok(vol.sdf(p)>.002*m.k,'the flag goes into the body at '+dir);}}
 a.dispose();
});
