import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drawFace,EXPRESSION_NAMES} from '../src/avatars/face.js';
import {normalizeRecipe,PARTS} from '../src/avatars/recipe.js';
import {buildAvatar,measure} from '../src/avatars/build.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {installDOM} from './fixtures.mjs';

function drawing(recipe,state={}){
 const commands=[],canvas={};
 const ctx=new Proxy({canvas},{
  get(target,key){
   if(key in target)return target[key];
   if(key==='createRadialGradient')return (...args)=>{commands.push([key,...args]);return {addColorStop:(...stop)=>commands.push(['stop',...stop])};};
   return (...args)=>commands.push([key,...args]);
  },
  set(target,key,value){target[key]=value;commands.push(['set',key,value]);return true;},
 });
 drawFace(ctx,recipe,state);return JSON.stringify(commands);
}

test('every eye style renders distinct moods, speech and blinks without changing identity',()=>{
 for(const style of PARTS.eyes){
  const recipe=normalizeRecipe({eyes:{style}}),before=JSON.stringify(recipe);
  const images=EXPRESSION_NAMES.map(expression=>drawing(recipe,{expression}));
  assert.equal(new Set(images).size,EXPRESSION_NAMES.length,style+' has distinct expressions');
  assert.equal(drawing(recipe,{expression:'unknown'}),drawing(recipe,{expression:'neutral'}));
  assert.notEqual(drawing(recipe,{expression:'neutral',blink:1}),drawing(recipe,{expression:'neutral'}));
  assert.notEqual(drawing(recipe,{expression:'smile',talk:1}),drawing(recipe,{expression:'smile'}));
  assert.equal(drawing(recipe,{expression:'happy',blink:1}),drawing(recipe,{expression:'happy'}),'happy eye curves survive a blink');
  assert.equal(JSON.stringify(recipe),before,'painting does not rewrite saved recipes');
 }
});

test('face repainting stays cached and preserves the two-draw avatar and current proportions',()=>{
 installDOM();
 const recipe=normalizeRecipe(),m=measure(recipe),avatar=buildAvatar(recipe,{shadows:false});
 // Adults wear the big-headed life-sim proportions: 1.12 of the original head.
 assert.equal(m.Rh,(.19+recipe.head.size*.055)*m.k*1.12,'existing head radius');
 assert.equal(m.H,1.36+recipe.body.height*.44,'existing body height');
 assert.equal(avatar.paintFace({expression:'happy'}),true);
 assert.equal(avatar.paintFace({expression:'happy'}),false,'idle expressions do not re-upload the texture');
 assert.equal(avatar.paintFace({expression:'surprised'}),true);
 assert.equal(avatar.paintFace({talk:1}),true);
 assert.equal(avatar.paintFace({talk:1}),false);
 // The rigged eyes (eyes3d.js) are a draw of their own, on for everyone since the owner's word of 25 October 2026 ("I think
 // it looks better already": commit 4ad3b4e6, briefs/HANDOFF-AVATAR-EYES-2026-10-25.md); tests/eyes3d.test.mjs holds both
 // eyes to one draw. The body and the head are still the two draws counted here.
 let draws=0,lines=0;avatar.root.traverse(o=>{if(o.isMesh&&o.visible&&o!==avatar.eyes3d?.mesh)(o.userData.outline?lines++:draws++);});assert.equal(draws,2);assert.equal(lines,2,"body and head each carry one ink shell");
 avatar.dispose();
});


test('surprise raises both hands once and leaves walking and seated actions in control',()=>{
 installDOM();const a=buildAvatar(normalizeRecipe()),anim=createAvatarAnimator(a);
 anim.update(.35,{expression:'surprised'});assert.ok(a.bones.elbowL.rotation.x<-.5&&a.bones.elbowR.rotation.x<-.5,'both hands rise for a startled reaction');
 for(let i=0;i<120;i++)anim.update(1/60,{expression:'surprised'});assert.equal(anim.gesture,null,'a held emotion does not repeat the gesture endlessly');
 anim.stop();anim.update(.1,{expression:'neutral'});anim.update(.1,{expression:'surprised',speed:1});assert.equal(anim.gesture,null,'walking keeps its stride');
 anim.update(.1,{expression:'neutral'});anim.update(.1,{expression:'surprised',seated:true});assert.equal(anim.gesture,null,'seated activities keep their pose');a.dispose();
});

test('the funny faces: each has its purpose, keeps its marks with every eye style, and is in every expression list',async()=>{
 const {EXPRESSION_INFO,EXPRESSION_GLYPHS}=await import('../src/avatars/face.js');
 const {EXPRESSIONS:PHOTO}=await import('../src/photo/layout.js');
 const funny=['gobsmacked','smug','bawling','starstruck','sweatdrop','blank','pouting','bleh','drowsy','lovestruck','fuming','drooling','wink','raging','seething','eyeroll','scared','kiss','flustered'];
 for(const name of funny){assert.ok(EXPRESSION_NAMES.includes(name),name);assert.ok(EXPRESSION_INFO[name]?.length>20,name+' says what it is for');}
 for(const name of EXPRESSION_NAMES)assert.ok(EXPRESSION_GLYPHS[name],name+' has a face for the chips');
 assert.deepEqual([...PHOTO],[...EXPRESSION_NAMES],'the photo studio offers World’s one list');
 // The mark that makes each gag, whatever the eyes are like.
 const marks={starstruck:'#f6c945',lovestruck:'#e5484d',sweatdrop:'#bfe6fb',fuming:'#d8342c',bawling:'rgba(150,205,240,.88)',drooling:'rgba(200,232,248,.92)',blank:'rgba(70,78,160,.6)'};
 for(const style of PARTS.eyes){
  const recipe=normalizeRecipe({eyes:{style}});
  for(const [name,colour] of Object.entries(marks))assert.ok(drawing(recipe,{expression:name}).includes(JSON.stringify(colour)),style+' '+name);
  // Symbol eyes and a wink are drawings, not lids: a blink leaves them as they are.
  for(const name of ['starstruck','lovestruck','blank','bawling','wink'])assert.equal(drawing(recipe,{expression:name,blink:1}),drawing(recipe,{expression:name}),style+' '+name+' through a blink');
  // A face with its own look (the smug sideways glance) keeps it whatever the gaze would be.
  assert.equal(drawing(recipe,{expression:'smug',look:[-1,1]}),drawing(recipe,{expression:'smug'}),style+' smug looks its own way');
 }
});
