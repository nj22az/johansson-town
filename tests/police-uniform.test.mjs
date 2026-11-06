import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {normalizeRecipe,PARTS,DICE,randomRecipe} from '../src/avatars/recipe.js';
import {CAST_RECIPES,recipeFor} from '../src/avatars/cast.js';
import {buildAvatar} from '../src/avatars/build.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {storyProps} from '../src/avatars/story-props.js';
import {POLICE_UNIFORM,DUTY_BELT} from '../src/avatars/police-data.js';
import {entryFor,putOnSet,SETS} from '../src/avatars/wardrobe-catalogue.js';
import {LOOK_FIELDS} from '../src/avatars/looks.js';

/**
 * Officer Mori's 1994-pattern uniform (police-data.js, police-uniform.js), the kitchen kerchief (kerchief.js) and the ghost
 * sheet's hood over the cap (story-props.js): they sit on the head without anything coming through, the kit on the duty
 * belt is never met by a hand, an arm or a thigh in the moves he makes, they stay light, and the builder offers them.
 */
installDOM();
const MORI=recipeFor('Officer Mori');
const rel=(colour)=>new THREE.Color(colour).getHexString();
/** Rays in from outside at points round the head: which colour each first meets (the body's drawn surface, rest pose). */
function firstHits(avatar,{heights,colours}){
 const g=avatar.body.geometry,P=g.attributes.position,C=g.attributes.color,m=avatar.measure;
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',P.clone());
 const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({side:THREE.DoubleSide})),ray=new THREE.Raycaster(),c=new THREE.Color(),out=[];
 for(const h of heights)for(let i=0;i<24;i++){const a=i/24*Math.PI*2,y=m.headCentre+h*m.Rh*m.headSY,d=new THREE.Vector3(Math.sin(a),0,Math.cos(a));
  ray.set(new THREE.Vector3(0,y,0).addScaledVector(d,1),d.clone().negate());const hit=ray.intersectObject(mesh)[0];if(!hit)continue;
  const v=hit.face.a;c.setRGB(C.getX(v),C.getY(v),C.getZ(v));out.push({a,h,colour:c.getHexString(),ok:colours.has(c.getHexString())});}
 return out;
}

test('the police cap sits on the head: round its band and crown nothing of the hair comes through, on every head form',()=>{
 const C=POLICE_UNIFORM.cap.colours;
 for(const form of PARTS.head)for(const style of ['crop','sidepart','bob','afro','bun','horseshoe']){
  const r=normalizeRecipe({...MORI,head:{...MORI.head,form},hair:{...MORI.hair,style}});
  const a=buildAvatar(r,{shadows:false,faceSize:64});
  const own=new Set([rel(r.outfit.hatColour),rel(C.band),rel(C.strap),rel(C.earButton),rel(C.felt),rel(C.gold),rel(C.silver),rel(new THREE.Color(r.outfit.hatColour).multiplyScalar(.82))]);
  const hits=firstHits(a,{heights:[.42,.55,.8,1.0],colours:own}),bad=hits.filter(h=>!h.ok);assert.ok(hits.length>80,'the rays find the head');
  assert.deepEqual(bad,[],`${form} ${style}: the cap is what is seen round the band and crown`);a.dispose();
 }
});

test('the kerchief covers the head from the hairline back, nothing of the hair through it, for each wearer',()=>{
 for(const who of ['Mrs Sato','Mrs Nakamura','Kōji','Mr Higa Jr']){
  const r=recipeFor(who),a=buildAvatar(r,{shadows:false,faceSize:64}),cloth=new THREE.Color(r.outfit.hatColour);
  const own=new Set([rel(cloth),rel(cloth.clone().multiplyScalar(.9))]);
  // above the folded edge all round (the edge is at 0.4 in front, 0.2 at the sides, lower behind)
  const hits=firstHits(a,{heights:[.55,.75,.95],colours:own}),bad=hits.filter(h=>!h.ok);assert.ok(hits.length>60,'the rays find the head');
  assert.deepEqual(bad,[],who+': only the kerchief is seen over the head');a.dispose();
 }
});

test('the duty belt’s kit is never met by a hand, an arm or a thigh: standing, walking, running, sitting, saluting, bowing',()=>{
 const a=buildAvatar(MORI,{shadows:false,faceSize:64}),holder=new THREE.Group();holder.add(a.root);
 let s=7;const random=()=>{s=(s*16807)%2147483647;return s/2147483647;};
 const anim=createAvatarAnimator(a,{random}),m=a.measure,b=a.bones,g=a.body.geometry,C=g.attributes.color,c=new THREE.Color();
 const kit=new Set([DUTY_BELT.holster.grip,DUTY_BELT.holster.lanyard,DUTY_BELT.radio.colour,DUTY_BELT.radio.aerial,DUTY_BELT.baton.colour,DUTY_BELT.baton.grip,MORI.outfit.beltColour,'#2a2b31'].map(rel)),idx=[];
 for(let i=0;i<C.count;i++){c.setRGB(C.getX(i),C.getY(i),C.getZ(i));if(kit.has(c.getHexString()))idx.push(i);}
 assert.ok(idx.length>500,'the kit is built');
 const p=new THREE.Vector3(),q=new THREE.Vector3();
 const clearance=()=>{holder.updateMatrixWorld(true);const at=n=>b[n].getWorldPosition(new THREE.Vector3());
  const segs=['L','R'].flatMap(S=>[[at('shoulder'+S),at('elbow'+S),m.armR*1.04],[at('elbow'+S),at('hand'+S),m.armR*.9],[at('thigh'+S),at('knee'+S),m.legR*1.02]]).map(([x,y,r])=>[new THREE.Line3(x,y),r]);
  const hands=['L','R'].map(S=>b['hand'+S].matrixWorld.clone().invert());let worst=Infinity;
  for(const i of idx){a.body.getVertexPosition(i,p);p.applyMatrix4(a.body.matrixWorld);
   for(const [l,r] of segs)worst=Math.min(worst,l.closestPointToPoint(p,true,q).distanceTo(p)-r);
   for(const inv of hands){q.copy(p).applyMatrix4(inv);worst=Math.min(worst,(Math.hypot(q.x/(m.hand*.9),(q.y+m.hand*.55)/(m.hand*1.15),q.z/(m.hand*.78))-1)*m.hand*.78);}}
  return worst;};
 const run=(label,frames,state,move)=>{if(move)anim.play(move);let worst=Infinity;for(let f=0;f<frames;f++){anim.update(1/60,state);a.springs?.update?.(1/60);if(f%5===0)worst=Math.min(worst,clearance());}
  assert.ok(worst>=0,`${label}: the kit is ${(-worst*100).toFixed(1)} cm into a limb`);};
 run('standing',90,{});run('walking',150,{speed:1.4});run('running',120,{speed:4,running:true});run('sitting',90,{seated:true,seatHeight:.45});
 for(const move of ['Salute','StartledJump','Bow','Wave'])run(move,120,{},move);
 a.dispose();
});

test('the uniform stays light: the cap, the kerchief and the belt each within their budget, the set within the town’s',()=>{
 const count=r=>{const a=buildAvatar(r,{shadows:false,faceSize:64});const n=a.body.geometry.attributes.position.count;a.dispose();return n;};
 const base={...MORI,outfit:{...MORI.outfit,hat:'none',belt:'none'}},n0=count(base);
 assert.ok(count({...base,outfit:{...base.outfit,hat:'police'}})-n0<=3600,'the police cap');
 assert.ok(count({...base,outfit:{...base.outfit,hat:'kerchief'}})-n0<=6000,'the kerchief');
 assert.ok(count({...base,outfit:{...base.outfit,belt:'duty'}})-n0<=4100,'the duty belt');
 const dressed=count(MORI),undressed=count({...MORI,outfit:{...MORI.outfit,top:'tank',bottom:'underwear',footwear:'barefoot',hat:'none',belt:'none'}});
 assert.ok(dressed-undressed<=10000,'the whole uniform over the base layer');
});

test('the ghost sheet’s hood goes over the cap: nothing of the head or cap outside it except through the face’s opening',()=>{
 const a=buildAvatar(MORI,{shadows:false,faceSize:64});storyProps(a).give('ghostSheet');a.root.updateMatrixWorld(true);
 const hood=[];a.root.traverse(o=>{if(o.name==='Ghost hood cloth')hood.push(o);});assert.equal(hood.length,1,'the draped hood');
 const m=a.measure,ray=new THREE.Raycaster(),centre=a.bones.head.localToWorld(new THREE.Vector3(0,m.headCentre-m.headY,0));
 const g=a.body.geometry,P=g.attributes.position,start=g.drawRange.start,p=new THREE.Vector3();let outside=0;
 // every drawn point of the cap and the hair (head bone) above the brow, looked at from the head's middle: the hood is beyond it
 for(let i=0;i<P.count;i+=7){a.body.getVertexPosition(i,p);p.applyMatrix4(a.body.matrixWorld);if(p.y<centre.y+m.Rh*.45)continue;
  const d=p.clone().sub(centre),len=d.length();if(len>m.Rh*3)continue;ray.set(centre,d.normalize());const hit=ray.intersectObject(hood[0])[0];if(!hit||hit.distance<len)outside++;}
 void start;assert.equal(outside,0,'cap or hair through the hood');a.dispose();
});

test('the builder offers the belt as a recipe field the dice never deal, the police set brings it and takes it off again',()=>{
 assert.deepEqual([...PARTS.belt],['none','duty']);
 assert.equal(normalizeRecipe({}).outfit.belt,'none','an old recipe has no belt');
 assert.equal(normalizeRecipe({outfit:{belt:'holster'}}).outfit.belt,'none','an unknown belt is none');
 assert.equal(MORI.outfit.belt,'duty');assert.equal(MORI.outfit.footwear,'shoes');
 for(let i=0;i<200;i++)assert.equal(randomRecipe('belt '+i).outfit.belt,'none','a stranger is never dealt the duty belt');
 assert.ok(!Object.values(DICE).flat().includes('duty'));
 assert.equal(entryFor('belt','duty').label,'Duty belt');assert.deepEqual([...LOOK_FIELDS['outfit.belt'].words],['none','duty']);
 const police=SETS.find(s=>s.id==='police-uniform'),kitchen=SETS.find(s=>s.id==='ramen-kitchen');
 const on=putOnSet(normalizeRecipe({}).outfit,police);assert.equal(on.belt,'duty');assert.equal(putOnSet(on,kitchen).belt,'none','the belt comes off with the uniform');
 for(const who of Object.keys(CAST_RECIPES))if(who!=='Officer Mori')assert.equal(CAST_RECIPES[who].outfit.belt,'none',who);
});

test('the research is kept with the data, in English: the 1994 pattern, no ID badge before 2002, the open radio question',()=>{
 const J=POLICE_UNIFORM.jacket;
 assert.equal(J.buttons.length,3,'single-breasted, three buttons (the 1968 jacket had four)');
 assert.ok(POLICE_UNIFORM.sources.length>=3);assert.match(DUTY_BELT.radio.open,/not confirmed/);
 for(const s of [POLICE_UNIFORM.period,...POLICE_UNIFORM.sources,J.rank.why,J.emblem.why,...['holster','baton','radio','cuffs'].map(k=>DUTY_BELT[k].why)])
  assert.ok(!/[぀-ヿ一-鿿]/.test(s),'English words: '+s);
});
