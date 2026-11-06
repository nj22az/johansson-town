import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {surface} from './body-contact.mjs';
import {PARTS,PATTERNS,DRESS_BOTTOMS,NUMBERED_TOPS,DICE,normalizeRecipe,encodeRecipe,decodeRecipe,randomRecipe} from '../src/avatars/recipe.js';
import {buildAvatar} from '../src/avatars/build.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {ISLAND_OUTFITS} from '../src/avatars/outfits.js';
import {entryFor,ISLAND_HEX,searchWardrobe} from '../src/avatars/wardrobe-catalogue.js';
import {patchName,SHIRT_SLEEVES,SLEEVE_END,JERSEY_LETTERING} from '../src/avatars/garment.js';
import {LOOK_FIELDS} from '../src/avatars/looks.js';
import {lookValue} from '../src/studio/rules.js';
import {residentRecipe,saveResidentRecipe} from '../src/avatars/wardrobe.js';
import {bicycleRiderFit} from '../src/world/bicycle-fit.js';
installDOM();

/**
 * Batch 2 of the Minato Machi wardrobe plan (2026-10-11): the groundwork (one list each for prints, skirts and the dice;
 * the shirt number) and the tops painted on the body every top already has, checked by the plan's standard check S.
 */
const TOPS=['shirt','vest','knitvest','gymtee','baseball','festival'];
const SETS=['ticket-window','harbour-summer'];
const set=id=>ISLAND_OUTFITS.find(s=>s.id===id);
const BODIES={
 Thuan:CAST_RECIPES.Thuan,
 child:normalizeRecipe({...CAST_RECIPES.Johansson,name:'Higa Kenta',age:'child',body:{...CAST_RECIPES.Johansson.body,build:.35}}),
};
/** A top worn in its first colourway (its own colours), as the maker puts it on. */
const wearing=(body,top,more={})=>{const way=entryFor('top',top).colourways[0]?.colours||{},o={...body.outfit,top,pattern:'none',...more};
 for(const [at,hex] of Object.entries(way))o[at.split('.')[1]]=hex;return normalizeRecipe({...body,outfit:o});};
const baseLayer=body=>normalizeRecipe({...body,outfit:{...body.outfit,top:'tank',bottom:'underwear',footwear:'barefoot',hat:'none'},accessories:{...body.accessories,earrings:'none',neckwear:'none',pin:false}});
const marksOf=a=>a.body.material.userData.garment.marks;
function draws(a){let meshes=0,ink=0;const face=o=>{for(let p=o;p;p=p.parent)if(p.name==='Face objects')return true;return false;};
 // The rigged eyes (eyes3d.js) are a draw of their own, on for everyone since the owner's word of 25 October 2026 ("I think
 // it looks better already": commit 4ad3b4e6, briefs/HANDOFF-AVATAR-EYES-2026-10-25.md); tests/eyes3d.test.mjs holds both
 // eyes to one draw. The body and the head are still the two draws counted here.
 a.root.traverse(o=>{if(o.isMesh&&o.visible&&!face(o)&&o!==a.eyes3d?.mesh)(o.userData.outline?ink++:meshes++);});return [meshes,ink];}

test('one list each for the prints, the skirts and the dice, used everywhere',()=>{
 assert.deepEqual([...PATTERNS],['none','flowers','stripes','dots']);
 assert.deepEqual([...DRESS_BOTTOMS],['skirt','longskirt','pleatedskirt']);
 for(const b of DRESS_BOTTOMS)assert.ok(PARTS.bottom.includes(b));
 assert.deepEqual([...LOOK_FIELDS['outfit.pattern'].words],[...PATTERNS]);
 // The dice deal everyday clothes only: never a uniform, a costume, or one of batch 2's work and team tops.
 for(let i=0;i<60;i++){const r=randomRecipe('dice-'+i);assert.ok(DICE.tops.includes(r.outfit.top),r.outfit.top);assert.equal(r.outfit.number,0);}
 for(const top of TOPS)assert.ok(!DICE.tops.includes(top),top+' is not dealt by the dice');
});

test('the shirt number: a whole number 0–99, 0 for none, through the share code, a design file, a saved wardrobe and Studio',()=>{
 assert.equal(normalizeRecipe({}).outfit.number,0);
 for(const [given,kept] of [[18,18],[7.6,8],[-3,0],[150,99],['12',12],[null,0],[true,0],['x',0]])assert.equal(normalizeRecipe({outfit:{number:given}}).outfit.number,kept,String(given));
 const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))};
 const r=wearing(BODIES.Thuan,'baseball',{number:18});
 assert.deepEqual(decodeRecipe(encodeRecipe(r)),r);assert.equal(decodeRecipe(encodeRecipe(r)).outfit.number,18);
 assert.deepEqual(normalizeRecipe(JSON.parse(JSON.stringify({format:'nj-avatar-studio',version:1,recipe:r})).recipe),r);
 saveResidentRecipe('Thuan',r,storage);assert.equal(residentRecipe('Thuan',storage).outfit.number,18);
 assert.deepEqual({...LOOK_FIELDS['outfit.number']},{kind:'number',min:0,max:99,whole:true});
 assert.deepEqual(lookValue('outfit.number',18),{value:18});
 assert.equal(lookValue('outfit.number',120).value,99);assert.equal(lookValue('outfit.number',3.4).value,3);
 assert.deepEqual(lookValue('body.height',.5),{value:.5},'other numbers still run 0 to 1');
 assert.deepEqual([...NUMBERED_TOPS],['baseball']);
});

test('each batch-2 top is in the catalogue with who, why and its own colours from the island palette, and is found by who wears it',()=>{
 for(const top of TOPS){
  const e=entryFor('top',top);assert.ok(e&&e.who&&e.why,top);
  for(const way of e.colourways)for(const [at,v] of Object.entries(way.colours))assert.ok(at==='outfit.pattern'?v==='none':ISLAND_HEX.has(v),`${top} ${way.name} ${at} ${v}`);
 }
 for(const top of ['shirt','vest','knitvest','gymtee','baseball'])assert.ok(entryFor('top',top).colourways.length,top+' goes on in its own colours');
 const found=q=>searchWardrobe(q).flatMap(g=>g.entries.map(e=>e.slot+':'+e.id));
 assert.ok(found('Ganaha').includes('top:vest')&&found('Ganaha').includes('set:ticket-window'));
 assert.ok(found('Fujita').includes('top:knitvest'));assert.ok(found('Seagulls').includes('top:baseball'));assert.ok(found('PE').includes('top:gymtee'));
 assert.ok(found('happi').includes('top:festival'));
 // Mr Shimabukuro is retired (roster.js RETIRED; phase 4 of docs/CAST-CONSOLIDATION.md, recorded in johansson-town/AGENTS.md),
 // so no live list names him: the office shirt is found by who wears it now, and no longer by him.
 assert.ok(found('Reed').includes('top:shirt'));assert.ok(!found('Shimabukuro').includes('top:shirt'));
 for(const id of SETS){const s=set(id);assert.ok(s.who&&s.why,id);
  for(const [k,v] of Object.entries(s.outfit))if(/^#/.test(v))assert.ok(ISLAND_HEX.has(v),`${id} ${k} ${v}`);}
 assert.deepEqual([set('ticket-window').outfit.top,set('ticket-window').outfit.topColour,set('ticket-window').outfit.bottom],['vest','#b4583c','skirt']);
 assert.deepEqual([set('harbour-summer').outfit.top,set('harbour-summer').outfit.topColour,set('harbour-summer').outfit.hat],['shirt','#8fbfe0','captain']);
});

test('what each top paints: collars, the shirt in a vest’s V, the name patch, the jersey’s lettering and number, the happi coat’s bands',()=>{
 const built=(top,more={},body=BODIES.Thuan)=>{const a=buildAvatar(wearing(body,top,more),{shadows:false,faceSize:64}),marks=marksOf(a);a.dispose();return marks;};
 assert.ok(['collar','placket','pocket','pen'].every(m=>built('shirt').includes(m)));
 assert.ok(['collar','shirt V','buttons:4','welt pockets'].every(m=>built('vest').includes(m)));
 assert.ok(built('knitvest').includes('rib')&&!built('knitvest').some(m=>m.startsWith('buttons')),'a knitted vest has rib and no buttons');
 assert.ok(built('gymtee').includes('name:Thuan'));
 assert.ok(built('gymtee',{},normalizeRecipe({...BODIES.Thuan,name:''})).includes('blank patch'),'no name, a blank patch');
 assert.ok(built('baseball',{number:18}).includes('number:18')&&built('baseball').includes('lettering'));
 assert.ok(built('baseball',{number:0}).includes('no number'));
 assert.ok(['bands','sash','cuffs'].every(m=>built('festival').includes(m)));
 assert.equal(JERSEY_LETTERING,'Minato','our own lettering, no real club’s');
});

test('a PE shirt’s name fits its patch: smaller, then cut after a whole word, a 24-letter name never runs off it',()=>{
 const m=t=>[...t].length;
 assert.deepEqual(patchName('Thuan',m,8),{text:'Thuan',scale:1});
 assert.deepEqual(patchName('',m,8),{text:'',scale:1});
 assert.deepEqual(patchName('Higa Kenta',m,8),{text:'Higa Kenta',scale:.8});
 assert.deepEqual(patchName('Higa Kenta',m,5),{text:'Higa',scale:.6},'cut after a whole word, never "Higa Kent"');
 assert.equal(patchName('Supercalifragilistic',m,8).text,'Supercalifrag','one long word is cut at a character');
 const long='Grandfather Taira Seiich',fit=patchName(long,m,8);assert.equal([...long].length,24);
 assert.ok(m(fit.text)*fit.scale<=8,'it fits');
 // Vietnamese and Japanese names are cut between characters, never inside one.
 assert.ok(['Phạm Thị Thu Hương','比嘉健太郎'].every(n=>n.startsWith(patchName(n,m,4).text)));
});

test('over a shirt the sleeves, shoulders and underarms are the shirt’s; a jersey’s arm is its undershirt; a happi coat’s sleeve ends on the forearm',()=>{
 const has=(a,hex)=>{const C=a.body.geometry.attributes.color,c=new THREE.Color(hex);for(let i=0;i<C.count;i++)if(Math.abs(C.getX(i)-c.r)+Math.abs(C.getY(i)-c.g)+Math.abs(C.getZ(i)-c.b)<1e-4)return true;return false;};
 for(const top of SHIRT_SLEEVES){
  const r=wearing(BODIES.Thuan,top),a=buildAvatar(r,{shadows:false,faceSize:64});
  assert.ok(has(a,r.outfit.accent),top+': the shirt’s colour is on the body');a.dispose();
 }
 const jersey=wearing(BODIES.Thuan,'baseball'),j=buildAvatar(jersey,{shadows:false,faceSize:64});assert.ok(has(j,jersey.outfit.accent),'the undershirt’s arms');j.dispose();
 // The arm below a three-quarter sleeve is bare: some skin-coloured arm vertices sit below where the sleeve ends.
 const r=wearing(BODIES.Thuan,'festival'),a=buildAvatar(r,{shadows:false,faceSize:64}),m=a.measure,ends=m.shoulderY-(m.upper+m.fore)*SLEEVE_END.festival;
 const {position:P,color:C,skinIndex:I,skinWeight:W}=a.body.geometry.attributes,skin=new THREE.Color(r.body.skin);let bare=0,sleeved=0;
 for(let i=0;i<P.count;i++){let fore=false;for(let k=0;k<4;k++)if(/^elbow[LR]$/.test(a.body.skeleton.bones[I.array[i*4+k]].name)&&W.array[i*4+k]>.5)fore=true;if(!fore)continue;
  const isSkin=Math.abs(C.getX(i)-skin.r)+Math.abs(C.getY(i)-skin.g)+Math.abs(C.getZ(i)-skin.b)<1e-5;
  if(P.getY(i)<ends-.01&&isSkin)bare++;if(P.getY(i)>ends+.01&&!isSkin)sleeved++;}
 assert.ok(bare>20&&sleeved>20,`bare forearm ${bare}, sleeved forearm ${sleeved}`);a.dispose();
});

test('standard check S: two draws and two ink shells, and at most 6k vertices over the base layer (a set 10k), on Thuan and a child',()=>{
 const vertices=r=>{const a=buildAvatar(r,{shadows:false,faceSize:64}),n=a.body.geometry.attributes.position.count;assert.deepEqual(draws(a),[2,2],r.outfit.top);a.dispose();return n;};
 for(const body of Object.values(BODIES)){
  const base=vertices(baseLayer(body));
  for(const top of TOPS){const extra=vertices(wearing(baseLayer(body),top))-base;assert.ok(extra<=6000,`${top} adds ${extra}`);}
  for(const id of SETS){const extra=vertices(normalizeRecipe({...baseLayer(body),outfit:{...baseLayer(body).outfit,...set(id).outfit}}))-base;assert.ok(extra<=10000,`${id} adds ${extra}`);}
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
test('standard check S: each batch-2 top walks, runs, sits, bows, waves, raises both arms and rides a bicycle without popping',()=>{
 for(const who of ['Thuan','child']){
  const bare=rehearse(baseLayer(BODIES[who]),who+' in the base layer');
  for(const top of TOPS){
   const worn=rehearse(wearing(BODIES[who],top,{number:7}),`${top} on ${who}`);
   for(const [move] of MOVES){
    assert.ok(worn[move].low>-.01,`${top} on ${who}: ${move} goes below the floor`);
    assert.ok(worn[move].jump<=bare[move].jump+.03,`${top} on ${who}: ${move} pops ${worn[move].jump.toFixed(3)} m (bare ${bare[move].jump.toFixed(3)})`);
   }
  }
 }
});
