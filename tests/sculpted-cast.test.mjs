import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {installDOM} from './fixtures.mjs';

/**
 * Vy and Tetsuo (the owner, 26 November 2026): "rework Vy, and Tetsuo give them expressions and fully rigged in blender".
 * Each has a head sculpted in Blender (tools/blender/build-vy-head.py, build-tetsuo-head.py) worn by the generator, so
 * each keeps the cartoon's rig and every expression; the rigged .blend and the sheets are in art/characters/<name>/.
 */
installDOM();globalThis.self=globalThis;
const {headProfile,shapeHeadPoint,HEAD_FORMS}=await import('../src/avatars/head-profile.js');
const {recipeFor}=await import('../src/avatars/cast.js');
const {faceLayout,EXPRESSION_NAMES}=await import('../src/avatars/face.js');
const {buildAvatar}=await import('../src/avatars/build.js');
const file=p=>new URL('../'+p,import.meta.url),DEG=Math.PI/180,theta=y=>50.4+y*(.58*180/256);
function head(name){
 const R=recipeFor(name),P=headProfile(R.head),L=faceLayout(R);
 const at=(a,t)=>{const p=shapeHeadPoint({x:Math.sin(t*DEG)*Math.sin(a*DEG),y:Math.cos(t*DEG),z:Math.sin(t*DEG)*Math.cos(a*DEG)},P);return {x:p.x*P.width,y:p.y*P.height,z:p.z*.98};};
 const half=t=>{let m=0;for(let a=40;a<=140;a+=2)m=Math.max(m,Math.abs(at(a,t).x));return m;};
 return {R,P,L,at,half,tip:theta(L.noseY),mouth:theta(L.mouthY),brow:theta(L.browY),eye:theta(L.eyeY),eyeA:L.spread*(1.9*180/Math.PI/256)};
}

for(const [name,slug,form] of [['Vy','vy','child'],['Tetsuo','tetsuo','lean']])test(`${name}: sculpted in Blender, fully rigged, every expression`,()=>{
 const R=recipeFor(name);assert.ok(HEAD_FORMS.includes(form));assert.equal(R.head.form,form);assert.ok(headProfile(R.head).sculpt);
 for(const f of [`tools/blender/build-${slug}-head.py`,`art/characters/${slug}/${slug}-head.blend`,`art/characters/${slug}/${slug}-rigged.blend`,`art/characters/${slug}/review/contact-sheet.png`,`art/characters/${slug}/review/expressions.png`])assert.ok(existsSync(file(f)),f);
 const rig=JSON.parse(readFileSync(file(`art/characters/${slug}/rig-report.json`),'utf8'));
 for(const b of ['root','hips','spine','chest','neck','head','shoulderL','elbowR','handL','thighR','kneeL','footR'])assert.ok(rig.bones.includes(b),b);
 assert.equal(rig.meshes['Shimanchu body'].skinned,true);assert.equal(rig.meshes['Shimanchu head'].parentBone,'head');
 assert.deepEqual(rig.meshes['Shimanchu head'].shapeKeys,['Basis','smile','shy','surprised','blink']);
 // Every expression paints on the face, and the rigged eyes follow it.
 const a=buildAvatar(R,{shadows:false,eyes3d:true});assert.ok(EXPRESSION_NAMES.length>=46);
 for(const expression of EXPRESSION_NAMES)assert.doesNotThrow(()=>a.paintFace({expression,blink:0,look:[0,0]}),expression);
 a.dispose();
});

test('Vy, from her photograph: a soft oval head that is not a balloon, a round chin, and her bob sculpted in Blender',async()=>{
 const V=head('Vy'),{measure}=await import('../src/avatars/build.js'),{normalizeRecipe}=await import('../src/avatars/recipe.js');
 const ratio=V.P.height/V.P.width;assert.ok(ratio>1.08&&ratio<1.2,'a soft oval: '+ratio.toFixed(2));
 // Not a balloon: her head is smaller than the child's default by a sixth.
 const m=measure(V.R),plain=measure(normalizeRecipe({...V.R,head:{...V.R.head,scale:1,size:.55}}));assert.ok(m.Rh<plain.Rh*.86,'a smaller head');
 const cheek=V.half(100),chin=V.half(150);assert.ok(V.half(128)>cheek*.7&&chin>cheek*.44,'full low down, and a chin with width, never a point');
 for(let t=95;t<=150;t+=5)assert.ok(V.half(t)-V.half(t+10)<cheek*.2,'no corner at θ '+t);
 const nose=V.at(0,V.tip-1.5).z-V.at(14,V.tip-1.5).z;assert.ok(nose>.008&&nose<.08,'a small soft nose: '+nose.toFixed(3));
 // Her hair: a chin-length bob with a fringe to the brows, sculpted (softbob), fair brown; and her face as the photograph has it.
 assert.equal(V.R.hair.style,'softbob');assert.equal(V.R.eyes.style,'dewy');assert.equal(V.R.mouth.style,'bud');assert.equal(V.R.mole,true);assert.equal(V.R.age,'child');
 // Her face is her own, not her aunt's (the owner: "she shouldn't be a clone of Thuan"): no feature's style is shared.
 const aunt=recipeFor('Thuan');for(const part of ['eyes','nose','mouth'])assert.notEqual(V.R[part].style,aunt[part].style,part);assert.notEqual(V.R.hair.style,aunt.hair.style);assert.notEqual(V.R.head.form,aunt.head.form);
 const lum=h=>{const n=parseInt(h.slice(1),16);return (.3*(n>>16)+.59*(n>>8&255)+.11*(n&255))/255;};assert.ok(lum(V.R.hair.colour)>.38&&lum(V.R.hair.colour)<.6,'brown, not black');
 const {SOFTBOB_HAIR:S}=await import('../src/avatars/sculpts/softbob-hair.js'),raw=atob(S.field.data);
 const field=(a,t)=>{const i=Math.round(t/180*(S.nt-1))*S.na+Math.round((a+180)/360*(S.na-1));return S.field.min+(S.field.max-S.field.min)*(raw.charCodeAt(i*2)|raw.charCodeAt(i*2+1)<<8)/65535;};
 assert.ok(field(0,40)>0&&field(180,100)>0&&field(90,120)>0,'over the crown, down the back, beside the cheeks');
 assert.ok(field(0,100)<0&&field(15,V.eye)<0,'the face is open: her eyes are clear of the fringe');assert.ok(field(0,70)>0&&field(0,V.brow+4)<0,'a fringe to the brows');
 assert.ok(field(100,150)<0&&field(180,135)<0,'chin length; shorter at the nape');
 for(const f of ['art/characters/vy/review/clay.png','src/avatars/sculpts/softbob-hair.js'])assert.ok(existsSync(file(f)),f);
});

test('Tetsuo has a lean man\'s head: long and narrow, cheekbones over hollow cheeks, a long hooked nose for his glasses',()=>{
 const T=head('Tetsuo');
 assert.ok(T.P.height/T.P.width>1.3,'long and narrow');
 assert.ok(T.half(128)<T.half(96)*.9,'lean in the jaw');
 const z=(a,t)=>T.at(a,t).z;
 assert.ok(z(0,T.tip-1)-z(0,T.mouth-4)>.12,'a long nose, well forward of the lip');
 assert.ok(z(0,T.brow+6)-z(T.eyeA,T.brow+6)>.04,'a high bridge between deep-set eyes');
 assert.ok(z(T.eyeA,T.brow)-z(T.eyeA,T.eye+1.5)>.03,'under a brow');
 // Cheekbones stand out over the hollow under them.
 const r=(a,t)=>{const p=T.at(a,t);return Math.hypot(p.x/T.P.width,p.y/T.P.height,p.z/.98);};
 assert.ok(r(46,T.eye+9)-r(50,T.tip+12)>.03,'cheekbones over hollow cheeks');
 assert.equal(T.R.glasses.style,'half');assert.equal(T.R.nose.style,'none','his nose is the sculpt\'s');assert.equal(T.R.hair.style,'horseshoe');
 for(const k of ['creases','nostrils','cheeks'])assert.equal(T.R.marks[k],true,k);
});
