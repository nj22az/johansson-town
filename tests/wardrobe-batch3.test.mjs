import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {surface} from './body-contact.mjs';
import {PARTS,DICE,BOTTOM_PATTERNS,normalizeRecipe,encodeRecipe,decodeRecipe,randomRecipe} from '../src/avatars/recipe.js';
import {buildAvatar,STRIPED_BOTTOMS} from '../src/avatars/build.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {ISLAND_OUTFITS} from '../src/avatars/outfits.js';
import {entryFor,ISLAND_HEX,searchWardrobe,labelFor} from '../src/avatars/wardrobe-catalogue.js';
import {ACCENT_SLEEVES} from '../src/avatars/garment.js';
import {LOOK_FIELDS} from '../src/avatars/looks.js';
import {TABS} from '../src/avatars/creator.js';
import {bicycleRiderFit} from '../src/world/bicycle-fit.js';
installDOM();

/**
 * Cute everyday wear (the creator, 2026-10-14: "characters need to … have cute clothes"): the raglan tee, the pinafore,
 * the hair clip, striped trousers and three sets made from them, checked by the wardrobe plan's standard check S.
 */
const TOPS=['raglan','pinafore'];
const SETS=['saturday-ice-cream','market-stripes','sunday-pinafore'];
const set=id=>ISLAND_OUTFITS.find(s=>s.id===id);
const BODIES={
 Thuan:CAST_RECIPES.Thuan,
 child:normalizeRecipe({...CAST_RECIPES.Johansson,name:'Higa Kenta',age:'child',body:{...CAST_RECIPES.Johansson.body,build:.35}}),
};
/** An item worn in its first colourway (its own colours), as the maker puts it on. */
const wearing=(body,slot,id,more={})=>{const way=entryFor(slot,id).colourways[0]?.colours||{},o={...body.outfit,[slot==='hat'?'hat':'top']:id,pattern:'none',...more};
 for(const [at,hex] of Object.entries(way))o[at.split('.')[1]]=hex;return normalizeRecipe({...body,outfit:o});};
const striped=(body,bottom='widepants')=>normalizeRecipe({...body,outfit:{...body.outfit,bottom,bottomColour:'#4f7a4f',bottomPattern:'stripes',accent:'#f4f1ea'}});
const dressed=(body,id)=>normalizeRecipe({...body,outfit:{...body.outfit,...set(id).outfit}});
const baseLayer=body=>normalizeRecipe({...body,outfit:{...body.outfit,top:'tank',bottom:'underwear',footwear:'barefoot',hat:'none'},accessories:{...body.accessories,earrings:'none',neckwear:'none',pin:false}});
const marksOf=a=>a.body.material.userData.garment.marks;
const colourCount=(a,hex)=>{const C=a.body.geometry.attributes.color,c=new THREE.Color(hex);let n=0;for(let i=0;i<C.count;i++)if(Math.abs(C.getX(i)-c.r)+Math.abs(C.getY(i)-c.g)+Math.abs(C.getZ(i)-c.b)<1e-4)n++;return n;};
function draws(a){let meshes=0,ink=0;const face=o=>{for(let p=o;p;p=p.parent)if(p.name==='Face objects')return true;return false;};
 // The rigged eyes (eyes3d.js) are a draw of their own, on for everyone since the owner's word of 25 October 2026 ("I think
 // it looks better already": commit 4ad3b4e6, briefs/HANDOFF-AVATAR-EYES-2026-10-25.md); tests/eyes3d.test.mjs holds both
 // eyes to one draw. The body and the head are still the two draws counted here.
 a.root.traverse(o=>{if(o.isMesh&&o.visible&&!face(o)&&o!==a.eyes3d?.mesh)(o.userData.outline?ink++:meshes++);});return [meshes,ink];}

test('the new items are appended to their slots, never dealt by the dice, and nobody is wearing them',()=>{
 // Appended after batch 3: Vy's striped tee and vest (briefs/HANDOFF-VY-REFERENCE-2026-10-24.md, "appended to the wardrobe").
 // Batch 3's two tops stay together, in order, and only that later top comes after them.
 const at=PARTS.top.indexOf('raglan');
 assert.deepEqual(PARTS.top.slice(at,at+2),['raglan','pinafore']);assert.deepEqual(PARTS.top.slice(at+2),['stripedvest']);assert.equal(PARTS.hat.at(-1),'hairclip');
 for(let i=0;i<60;i++){const r=randomRecipe('dice-'+i);assert.ok(DICE.tops.includes(r.outfit.top));assert.equal(r.outfit.hat,'none');assert.equal(r.outfit.bottomPattern,'none');}
 for(const [name,r] of Object.entries(CAST_RECIPES)){
  assert.ok(!TOPS.includes(r.outfit.top)&&r.outfit.hat!=='hairclip'&&r.outfit.bottomPattern!=='stripes',name+' is dressed as before');
 }
});

test('bottom patterns: none, plaid and stripes, through the share code, Studio and the maker',()=>{
 assert.deepEqual([...BOTTOM_PATTERNS],['none','plaid','stripes']);
 for(const p of BOTTOM_PATTERNS)assert.equal(normalizeRecipe({outfit:{bottomPattern:p}}).outfit.bottomPattern,p);
 for(const bad of ['checks',null,3,undefined])assert.equal(normalizeRecipe({outfit:{bottomPattern:bad}}).outfit.bottomPattern,'none');
 const r=striped(BODIES.Thuan);assert.deepEqual(decodeRecipe(encodeRecipe(r)),r);
 assert.deepEqual([...LOOK_FIELDS['outfit.bottomPattern'].words],[...BOTTOM_PATTERNS]);
 const control=TABS.find(t=>t.id==='bottom').controls.find(c=>c.at==='outfit.bottomPattern');
 assert.ok(control&&control.kind==='chips'&&control.list===BOTTOM_PATTERNS,'the maker offers the pattern on the Bottoms tab');
});

test('each new item is in the catalogue with a label, who, why and island colours, and found by who wears it',()=>{
 for(const [slot,id] of [['top','raglan'],['top','pinafore'],['hat','hairclip']]){
  const e=entryFor(slot,id);assert.ok(e&&e.who&&e.why&&e.label,`${slot} ${id}`);assert.equal(labelFor(slot,id),e.label);
  assert.ok(e.colourways.length,id+' goes on in its own colours');
  for(const way of e.colourways)for(const [at,v] of Object.entries(way.colours))assert.ok(at==='outfit.pattern'?v==='none':ISLAND_HEX.has(v),`${id} ${way.name} ${at} ${v}`);
 }
 const found=q=>searchWardrobe(q).flatMap(g=>g.entries.map(e=>e.slot+':'+e.id));
 assert.ok(found('Vy').includes('top:raglan')&&found('Vy').includes('hat:hairclip')&&found('Vy').includes('set:saturday-ice-cream'));
 assert.ok(found('Mai').includes('top:pinafore')&&found('pinafore').includes('set:sunday-pinafore'));
 assert.ok(found('Thao').includes('set:market-stripes')&&found('Blue Coral').includes('top:raglan'));
 for(const id of SETS){const s=set(id);assert.ok(s.who&&s.why&&s.label,id);
  for(const [k,v] of Object.entries(s.outfit))if(/^#/.test(v))assert.ok(ISLAND_HEX.has(v),`${id} ${k} ${v}`);}
 assert.deepEqual([set('saturday-ice-cream').outfit.top,set('saturday-ice-cream').outfit.hat,set('saturday-ice-cream').outfit.shoes],['raglan','hairclip','#f2b8c6'],'pastel pink sneakers');
 assert.equal(set('market-stripes').outfit.bottomPattern,'stripes');
});

test('what the new tops paint: the raglan’s seams, neck band and heart; the pinafore’s bib, straps and pocket',()=>{
 const built=(top,body=BODIES.Thuan)=>{const a=buildAvatar(wearing(body,'top',top),{shadows:false,faceSize:64}),marks=marksOf(a);a.dispose();return marks;};
 assert.ok(['raglan seams','heart','neckline','sleeve-hems'].every(m=>built('raglan').includes(m)),built('raglan').join());
 assert.ok(['bib','straps','pocket','neckline'].every(m=>built('pinafore').includes(m)),built('pinafore').join());
});

test('a raglan’s sleeves, shoulders and underarms are in the accent; the pinafore’s are the tee’s',()=>{
 assert.deepEqual([...ACCENT_SLEEVES],['raglan']);
 const r=wearing(BODIES.Thuan,'top','raglan'),a=buildAvatar(r,{shadows:false,faceSize:64});
 assert.ok(colourCount(a,r.outfit.accent)>200,'the sleeves are the accent');a.dispose();
 const p=wearing(BODIES.Thuan,'top','pinafore'),b=buildAvatar(p,{shadows:false,faceSize:64});
 assert.equal(colourCount(b,p.outfit.accent),0,'no modelled part of the pinafore is in the accent: its buttons are painted');b.dispose();
});

test('stripes run down trousers, wide trousers, cropped trousers and culottes in the accent, and nowhere else',()=>{
 for(const bottom of STRIPED_BOTTOMS){
  const plain=normalizeRecipe({...striped(BODIES.Thuan,bottom),outfit:{...striped(BODIES.Thuan,bottom).outfit,bottomPattern:'none'}});
  const a=buildAvatar(striped(BODIES.Thuan,bottom),{shadows:false,faceSize:64}),b=buildAvatar(plain,{shadows:false,faceSize:64});
  const s=colourCount(a,'#f4f1ea')-colourCount(b,'#f4f1ea');assert.ok(s>300,`${bottom}: ${s} striped vertices`);
  assert.equal(a.body.geometry.attributes.position.count,b.body.geometry.attributes.position.count,'stripes are paint, not geometry');
  a.dispose();b.dispose();
 }
 // A skirt and shorts are left plain by stripes (plaid is for skirts).
 for(const bottom of ['skirt','shorts']){
  const r=normalizeRecipe({...BODIES.Thuan,outfit:{...BODIES.Thuan.outfit,top:'tee',topColour:'#3a9cb8',bottom,bottomColour:'#4f7a4f',accent:'#f4f1ea'}});
  const a=buildAvatar({...r,outfit:{...r.outfit,bottomPattern:'stripes'}},{shadows:false,faceSize:64}),b=buildAvatar(r,{shadows:false,faceSize:64});
  assert.equal(colourCount(a,'#f4f1ea'),colourCount(b,'#f4f1ea'),bottom);a.dispose();b.dispose();
 }
});

test('the hair clip is worn with the hair out: nothing is tucked, it sits on the hair, and it comes off with the hat',()=>{
 for(const style of PARTS.hair){
  const bare=normalizeRecipe({...BODIES.Thuan,hair:{...BODIES.Thuan.hair,style},outfit:{...BODIES.Thuan.outfit,hat:'none'}});
  const a=buildAvatar(bare,{shadows:false,faceSize:64}),b=buildAvatar({...bare,outfit:{...bare.outfit,hat:'hairclip'}},{shadows:false,faceSize:64});
  const n=a.body.geometry.attributes.position.count,A=a.body.geometry.attributes.position.array,B=b.body.geometry.attributes.position.array;
  assert.ok(b.hasHat,style);assert.deepEqual(B.slice(0,n*3),A,style+': the hair is as it was');
  // The clip is outside the head (its centre and radius) and close to it: no part floats more than 3 cm off the skull.
  const m=b.measure;let far=0,near=Infinity;
  for(let i=n;i<B.length/3;i++){const d=Math.hypot(B[i*3]/(m.headSX*m.Rh),(B[i*3+1]-m.headCentre)/(m.headSY*m.Rh),B[i*3+2]/m.Rh);far=Math.max(far,d);near=Math.min(near,d);}
  assert.ok(near>1,`${style}: the clip stays outside the head (${near.toFixed(2)})`);assert.ok(far<1.62,`${style}: the clip lies on the hair (${far.toFixed(2)})`);
  b.setHat(false);assert.deepEqual(draws(b),[2,2]);a.dispose();b.dispose();
 }
});

test('standard check S: two draws and two ink shells, and at most 6k vertices over the base layer (a set 10k), on Thuan and a child',()=>{
 const vertices=r=>{const a=buildAvatar(r,{shadows:false,faceSize:64}),n=a.body.geometry.attributes.position.count;assert.deepEqual(draws(a),[2,2],r.outfit.top+' '+r.outfit.hat);a.dispose();return n;};
 for(const body of Object.values(BODIES)){
  const base=vertices(baseLayer(body));
  for(const top of TOPS){const extra=vertices(wearing(baseLayer(body),'top',top))-base;assert.ok(extra<=6000,`${top} adds ${extra}`);}
  const clip=vertices(wearing(baseLayer(body),'hat','hairclip'))-base;assert.ok(clip<=1500,`the hair clip adds ${clip}`);
  for(const id of SETS){const extra=vertices(dressed(baseLayer(body),id))-base;assert.ok(extra<=10000,`${id} adds ${extra}`);}
 }
});

/** Every move: walk, run, chair, stool, floor, bow, wave, cheer, kachāshī and the bicycle; finite, above the floor, no popping. */
const MOVES=[['walk',{speed:1.2}],['run',{speed:3.4}],['chair',{seated:true,seatHeight:.45}],['stool',{seated:true,seatHeight:.3}],['floor',{seated:true,seatHeight:0}],
 ['Bow',{}],['Wave',{}],['Cheer',{}],['Kachashi',{}],['bicycle',{riding:true}]];
function rehearse(recipe,label){
 const a=buildAvatar(recipe,{shadows:false,faceSize:64}),motion=createAvatarAnimator(a),fit=bicycleRiderFit(a.measure),out={};
 for(const [move,state] of MOVES){
  motion.stop();if(/^[A-Z]/.test(move))motion.play(move);
  let before=null,jump=0,low=Infinity;
  for(let frame=0;frame<36;frame++){
   motion.update(1/30,{...state,bicycleFit:fit,ridePhase:frame/24});a.root.updateMatrixWorld(true);
   const points=surface(a,{stride:41}).map(x=>x.p);
   for(const p of points){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z),`${label}: ${move} at ${frame}`);low=Math.min(low,p.y);}
   if(before&&frame>2)for(let i=0;i<points.length;i++)jump=Math.max(jump,points[i].distanceTo(before[i]));
   before=points;
  }
  out[move]={jump,low};
 }
 a.dispose();return out;
}
test('standard check S: each new item and set walks, runs, sits, bows, waves, raises both arms and rides a bicycle without popping',()=>{
 for(const who of ['Thuan','child']){
  const bare=rehearse(baseLayer(BODIES[who]),who+' in the base layer'),body=BODIES[who];
  const looks=[['raglan',wearing(body,'top','raglan')],['pinafore',wearing(body,'top','pinafore',{bottom:'skirt'})],['hair clip',wearing(body,'hat','hairclip')],
   ['striped wide trousers',striped(body)],...SETS.map(id=>[id,dressed(body,id)])];
  for(const [what,recipe] of looks){
   const worn=rehearse(recipe,`${what} on ${who}`);
   for(const [move] of MOVES){
    assert.ok(worn[move].low>-.01,`${what} on ${who}: ${move} goes below the floor`);
    assert.ok(worn[move].jump<=bare[move].jump+.03,`${what} on ${who}: ${move} pops ${worn[move].jump.toFixed(3)} m (bare ${bare[move].jump.toFixed(3)})`);
   }
  }
 }
});
