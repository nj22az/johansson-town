import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar,bodyVolume} from '../src/avatars/build.js';
import {KARIYUSHI,collarChart} from '../src/avatars/garment.js';
import {CAST_RECIPES,recipeFor} from '../src/avatars/cast.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {createAvatarActor,updateAvatarActor} from '../src/avatars/actors.js';
import {faceLayout} from '../src/avatars/face.js';
import {normalizeRecipe} from '../src/avatars/recipe.js';
import {shapeHeadPoint} from '../src/avatars/head-profile.js';
import {fitAvatarHeldProp,consumptionPhase,lowerLip} from '../src/avatars/consume.js';
import {canRim} from '../src/avatars/drink-can.js';
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

test('the kariyushi collar is cloth: a band round the neck folding forward into two short points over an open V, with a shadow under it',()=>{
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
 * The owner's brief for Johansson's aloha shirt, 27 November 2026: "Give it a low, open camp collar. A narrow band wraps
 * around the nape and folds forwards into two short points, leaving a small V of white undershirt below the throat. In
 * profile, leave visible space below the jaw." Measured on his body: the collar's top no more than 3 cm above the neck's
 * base, the neck showing for at least 6 cm under the jaw above it, and the V about a hand deep and a hand wide.
 */
/** The torso lathe's radius at a share t of its height (as build.js reads its profile). */
const latheRadius=(prof,t)=>{for(let i=1;i<prof.length;i++){const [r0,y0]=prof[i-1],[r1,y1]=prof[i];if(t<=y1)return r0+(r1-r0)*((t-y0)/((y1-y0)||1));}return prof.at(-1)[0];};
test('the kariyushi collar is low: a narrow band round the nape, the neck showing below the jaw, a small V',()=>{
 const a=buildAvatar(recipeFor('Johansson'),{shadows:false}),m=a.measure,k=m.k,P=a.body.geometry.attributes.position,C=a.body.geometry.attributes.color;
 const SI=a.body.geometry.attributes.skinIndex,chest=a.body.skeleton.bones.indexOf(a.bones.chest),shirt=new THREE.Color(a.recipe.outfit.topColour);
 let top=-1;for(let i=0;i<P.count;i++){const r=Math.hypot(P.getX(i),P.getZ(i));
  if(SI.getX(i)===chest&&r>m.neckR&&r<m.neckR+.07*k&&Math.abs(C.getX(i)-shirt.r)+Math.abs(C.getY(i)-shirt.g)+Math.abs(C.getZ(i)-shirt.b)<.02)top=Math.max(top,P.getY(i));}
 const H=a.face.head.geometry.attributes.position,v=new THREE.Vector3();a.root.updateMatrixWorld(true);
 // (the head as it sits on the neck, in the body's own frame: the root turns the town's way round, about y)
 let jaw=Infinity;for(let i=0;i<H.count;i++){v.fromBufferAttribute(H,i).applyMatrix4(a.face.head.matrixWorld).applyMatrix4(a.root.matrixWorld.clone().invert());jaw=Math.min(jaw,v.y);}
 assert.ok(top-m.neckY<.03*k,`the collar stands ${((top-m.neckY)*1000).toFixed(0)} mm above the neck's base (at most 30)`);
 assert.ok(jaw-top>.06*k,`the neck shows ${((jaw-top)*1000).toFixed(0)} mm between the collar and the jaw (at least 60)`);
 const chart=collarChart(m,t=>latheRadius(bodyVolume(a.recipe,m).prof,t)),K=KARIYUSHI.collar,corner=chart.at(K.vee,0),bottom=chart.at(K.centre[0],K.centre[1]*k);
 const deep=corner[1]-bottom[1],wide=corner[0]*2;
 assert.ok(deep>.08*k&&deep<.14*k,`the V is ${(deep*1000).toFixed(0)} mm deep`);assert.ok(wide>.08*k&&wide<.14*k,`and ${(wide*1000).toFixed(0)} mm wide at the throat`);
 // the two points: out on the chest below the neck, short of the shoulders
 const point=chart.at(K.point[0],K.point[1]*k);
 assert.ok(point[1]<m.neckY-.03*k&&point[1]>m.neckY-.09*k&&Math.abs(point[0])<m.width/2*.7,'each point on the upper chest, short of the shoulder: '+point.map(x=>(x*1000).toFixed(0)));
 a.dispose();
});

/**
 * "Let the fabric fall from the shoulders with a little air at the waist ... Finish with a nearly level, untucked hem at the
 * upper hip so the shorts remain visible" (the owner's brief, 27 November 2026), and then: "The shirt you may look like a
 * dress make it look more like a real Hawaii shirt". The body of the shirt is cloth of its own below the chest (build.js
 * alohaBody): boxy and straight, no wider at the hem than at the chest (it had flared 21 mm in front and behind, an A-line),
 * a few millimetres clear of the waist, its hem level and just over the shorts' waistband (a few centimetres, no more:
 * it had come down to 16 mm over the hip joint, a dress's length on his short legs), turned, with its inside drawn in the
 * cloth's shadow, a small vent at each side seam, and the shorts showing below it.
 */
test('the kariyushi is boxy and straight, its level hem just over the shorts\' waistband, with side vents, a turned edge and an inside',()=>{
 for(const name of ['Johansson','Vy','Sverker']){
  // (in Johansson's blue, which nothing else they wear is)
  const r=recipeFor(name),a=buildAvatar({...r,outfit:{...r.outfit,top:'kariyushi',topColour:'#7fb0d8'}},{shadows:false}),m=a.measure,k=m.k,g=a.body.geometry,P=g.attributes.position,C=g.attributes.color;
  const shirt=new THREE.Color(a.recipe.outfit.topColour),inside=shirt.clone().multiplyScalar(.68),is=(i,c)=>Math.abs(C.getX(i)-c.r)+Math.abs(C.getY(i)-c.g)+Math.abs(C.getZ(i)-c.b)<.01;
  const vol=bodyVolume(a.recipe,m),air=t=>{const y=m.hipY+t*m.torso;let f=-1,b=-1;for(let i=0;i<P.count;i++)if(is(i,shirt)&&Math.abs(P.getX(i))<.015*k&&Math.abs(P.getY(i)-y)<.03*k){f=Math.max(f,P.getZ(i));b=Math.max(b,-P.getZ(i));}
   const bare=m.depth/2*latheRadius(vol.prof,t);return [f-bare,b-bare];};
  const [front,back]=air(.3);
  assert.ok(front>.006*k&&back>.006*k,`${name}: air at the waist, ${(front*1000).toFixed(0)} mm in front and ${(back*1000).toFixed(0)} mm behind`);
  // the hem: the lowest of the shirt's body, all round at one height (the sleeves and the arms aside), but at the vents
  const body=[];for(let i=0;i<P.count;i++)if((is(i,shirt)||is(i,inside))&&P.getY(i)<m.hipY+m.torso*.3&&Math.hypot(P.getX(i)/m.width,P.getZ(i)/m.depth)>.35)body.push(i);
  const low=Math.min(...body.map(i=>P.getY(i))),waistband=m.hipY+m.torso*.13;
  assert.ok(waistband-low>.015*k&&waistband-low<.045*k,`${name}: the hem ${((waistband-low)*1000).toFixed(0)} mm under the shorts' waistband (a few centimetres)`);
  const seam=i=>Math.abs(P.getZ(i))<.02*k,level=body.filter(i=>!seam(i)&&P.getY(i)<low+.01*k).map(i=>P.getY(i));
  assert.ok(Math.max(...level)-low<.002*k,`${name}: the hem level all round`);
  // the vents: at each side seam the hem rises in a slit two or three centimetres high
  // (its top: the lowest of the outside on the seam's own line)
  for(const s of [1,-1]){const rise=Math.min(...body.filter(i=>is(i,shirt)&&Math.abs(P.getZ(i))<.002*k&&Math.sign(P.getX(i))===s).map(i=>P.getY(i)))-low;
   assert.ok(rise>.02*k&&rise<.045*k,`${name}: a vent at the ${s>0?'left':'right'} side seam, ${(rise*1000).toFixed(0)} mm high`);}
  // boxy: no wider at the hem than at the chest, front, back and sides (it was an A-line, 21 mm out in front and behind)
  const extent=(y,f)=>{let e=-Infinity;for(let i=0;i<P.count;i++)if(is(i,shirt)&&Math.abs(P.getY(i)-y)<.004*k)e=Math.max(e,f(i));return e;};
  const hemY=low;   // (the hem's own row)
  // (off the widest of the body above the hem: a figure wider at the hips than the chest, as Vy is, is followed, not flared)
  let widest=0;for(let t=(low-m.hipY)/m.torso;t<=.64;t+=.01)widest=Math.max(widest,m.depth/2*latheRadius(vol.prof,t));
  for(const [label,f] of [['in front',i=>P.getZ(i)],['behind',i=>-P.getZ(i)]])assert.ok(extent(hemY,f)-widest<.012*k,`${name}: straight ${label}, ${((extent(hemY,f)-widest)*1000).toFixed(0)} mm off the body at the hem`);
  assert.ok([...Array(P.count).keys()].some(i=>is(i,inside)&&P.getY(i)>low&&P.getY(i)<low+.05*k),`${name}: the hem's inside, in its shadow`);
  a.dispose();
 }
});

/**
 * The owner, 27 November 2026: "Johansson's rigged Hawaii shirt needs to be improved too, the collar is way too big going
 * under his arms when drinking". The collar's leaves reached 221 mm out of his 234 mm half-width, nearly to the shoulder
 * seam, and the raised arms went over them: 29 mm into the sleeve drinking, 55 mm pointing, 47 mm clapping. The collar is
 * a camp collar's size now (garment.js KARIYUSHI.collar), and stays out of the sleeves in the moves that bring an arm across
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
  anim.play('SitDrink');
  const m=a.measure;
  if(kind==='can'){
   // (a can is sipped as it was animated in Blender (drink-can.js, CAN_PARTS.sip): the motion places it, not the old fit; checked
   // at the sip's lip contact, the rim on this body's lower lip)
   let at=null;for(let i=0;i<150&&at===null;i++){anim.update(1/60,{seated:true,heldProp:prop,consumeElapsed:i/60});a.root.updateMatrixWorld(true);if(anim.canCue?.lip>.99)at=i;}
   assert.ok(at!==null,name+' '+height+' can: the sip comes to the lip');
   const rim=prop.localToWorld(canRim(prop)),lip=a.bones.head.localToWorld(lowerLip(a).lower.clone());
   assert.ok(rim.distanceTo(lip)<.002,name+' '+height+' can: the rim on the lower lip ('+(rim.distanceTo(lip)*1000).toFixed(1)+' mm)');
  }else{
   for(let i=0;i<36;i++)anim.update(1/30,{seated:true,heldProp:prop});
   fitAvatarHeldProp(a,prop,anim.consumption.lift);a.root.updateMatrixWorld(true);
   const L=faceLayout(a.recipe),theta=Math.PI*.28+L.mouthY/256*Math.PI*.58,phi=Math.PI/2-.95+L.mouthX/256*1.9;
  const v=shapeHeadPoint(new THREE.Vector3(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta)),m.profile);
  const mouth=a.bones.head.localToWorld(new THREE.Vector3(v.x*m.Rh*m.headSX,m.headCentre-m.headY+v.y*m.Rh*m.headSY,v.z*m.Rh*.98+.025*m.k));
  const rim=prop.localToWorld(new THREE.Vector3(0,prop.userData.rimHeight,0));
   assert.ok(rim.distanceTo(mouth)<.015,name+' '+height+' '+kind+' reaches lips');
  }
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
