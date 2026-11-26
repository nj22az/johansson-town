import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {installDOM} from './fixtures.mjs';

/**
 * Johansson, redrawn from the owner's photograph (26 November 2026): "rugged, sturdy, manly cartoon caricature", "Make him
 * in blender", "Fully rigged". His head is sculpted in Blender (tools/blender/build-johansson-head.py) and measured into
 * src/avatars/sculpts/rugged-head.js; the generator wears it as the head form 'rugged'.
 */
installDOM();globalThis.self=globalThis;
const {headProfile,shapeHeadPoint,HEAD_FORMS}=await import('../src/avatars/head-profile.js');
const {RUGGED_HEAD}=await import('../src/avatars/sculpts/rugged-head.js');
const {recipeFor}=await import('../src/avatars/cast.js');
const {faceLayout,FACE_MARKS,PAINTED_BEARDS}=await import('../src/avatars/face.js');
const {measure}=await import('../src/avatars/build.js');
const {PARTS,normalizeRecipe}=await import('../src/avatars/recipe.js');
const file=p=>new URL('../'+p,import.meta.url);

const R=recipeFor('Johansson'),profile=headProfile(R.head),DEG=Math.PI/180;
/** The head's surface along a direction: a from the front, θ from the crown, in head radii, half-axes applied. */
const at=(a,t)=>{const p=shapeHeadPoint({x:Math.sin(t*DEG)*Math.sin(a*DEG),y:Math.cos(t*DEG),z:Math.sin(t*DEG)*Math.cos(a*DEG)},profile);return {x:p.x*profile.width,y:p.y*profile.height,z:p.z*.98};};
const L=faceLayout(R),theta=y=>50.4+y*(.58*180/256),eyeA=L.spread*(1.9*180/Math.PI/256);

test('the sculpt is Blender\'s: a measured table, its source and the rigged character beside it',()=>{
 assert.ok(HEAD_FORMS.includes('rugged'));assert.equal(R.head.form,'rugged');assert.ok(profile.sculpt);
 assert.equal(atob(RUGGED_HEAD.data).length,RUGGED_HEAD.na*RUGGED_HEAD.nt*2);
 for(const f of ['tools/blender/build-johansson-head.py','art/characters/johansson/johansson-head.blend','art/characters/johansson/johansson-rigged.blend','art/characters/johansson/review/contact-sheet.png'])assert.ok(existsSync(file(f)),f);
 const rig=JSON.parse(readFileSync(file('art/characters/johansson/rig-report.json'),'utf8'));
 for(const b of ['root','hips','spine','chest','neck','head','shoulderL','elbowL','handL','thighR','kneeR','footR'])assert.ok(rig.bones.includes(b),b);
 assert.equal(rig.meshes['Shimanchu body'].skinned,true);assert.equal(rig.meshes['Shimanchu head'].parentBone,'head');
 assert.deepEqual(rig.meshes['Shimanchu head'].shapeKeys,['Basis','smile','shy','surprised','blink']);
});

test('the head is taller and blockier: flat temples, a jaw wider than them, a squared chin',()=>{
 const ratio=profile.height/profile.width;assert.ok(ratio>=1.15&&ratio<=1.25,'height '+ratio.toFixed(3)+' x width');
 const temple=Math.abs(at(88,82).x),jaw=Math.abs(at(72,128).x);assert.ok(jaw>temple,'the jaw ('+jaw.toFixed(3)+') is wider than the temples ('+temple.toFixed(3)+')');
 // The chin's base: nearly level from its middle to its corners, not a point.
 const mid=at(0,150).y,corner=at(24,150).y;assert.ok(Math.abs(mid-corner)<.06,'a flat base');
 // Symmetrical, and one surface: the seam at the back closes.
 assert.ok(Math.abs(at(40,100).x+at(-40,100).x)<.004);assert.ok(Math.abs(at(179.9,90).z-at(-179.9,90).z)<.002);
});

test('a brow ridge overhangs recessed eyes, and the nose has a bridge, a tip that stands forward and wings',()=>{
 const brow=theta(L.browY),eye=theta(L.eyeY),tip=theta(L.noseY),mouth=theta(L.mouthY);
 const z=(a,t)=>at(a,t).z;
 assert.ok(z(eyeA,brow)-z(eyeA,eye+1.5)>.05,'the socket sits back under the ridge');
 assert.ok(z(0,brow+6)>z(eyeA,brow+6)+.03,'the bridge stands between the eyes');
 assert.ok(z(0,tip-2)-z(0,mouth-4)>.12,'the tip is well forward of the upper lip');
 assert.ok(z(0,tip-2)>z(0,brow),'and forward of the brow');
 assert.ok(Math.abs(at(11,tip-.5).x)>Math.abs(at(11,tip-12).x),'wings wider than the bridge');
});

test('his frame is sturdy and his face is dark-featured, fair and dry, never the cute defaults',()=>{
 assert.equal(R.body.frame,'sturdy');
 const m=measure(R),plain=measure({...R,body:{...R.body,frame:'standard'}});
 const jawWidth=2*Math.abs(at(72,128).x)*m.Rh;
 assert.ok(2*m.neckR/jawWidth>.5&&2*m.neckR/jawWidth<.7,'the neck is about 60% of the jaw: '+(2*m.neckR/jawWidth).toFixed(2));
 assert.ok(m.width>plain.width&&m.depth>plain.depth&&m.neckR>plain.neckR*1.6);
 assert.equal(normalizeRecipe({}).body.frame,'standard','older recipes keep the standard frame');
 assert.equal(R.brows.style,'strong');assert.equal(R.mouth.style,'dry');assert.equal(R.facial.paint,'shadow');assert.equal(R.nose.style,'none');
 assert.ok(R.eyes.shine<.5&&R.eyes.size<.2);
 for(const k of ['creases','nostrils','folds','finecrows','chesthair'])assert.equal(R.marks[k],true,k);
 for(const k of ['creases','nostrils','folds','finecrows','chesthair'])assert.ok(FACE_MARKS[k]);
 assert.ok(PARTS.brows.at(-1)==='strong'&&PARTS.mouth.at(-1)==='dry'&&Object.keys(PAINTED_BEARDS).at(-1)==='shadow','new parts are appended: no saved id moves');
 // Fair skin, dark brows and eyes.
 const lum=h=>{const n=parseInt(h.slice(1),16);return (.3*(n>>16)+.59*(n>>8&255)+.11*(n&255))/255;};
 assert.ok(lum(R.body.skin)>.78,'fair');assert.ok(lum(R.brows.colour)<.15&&lum(R.eyes.colour)<.2,'dark features');
});
