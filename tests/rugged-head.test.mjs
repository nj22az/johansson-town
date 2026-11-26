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
 // A strong jaw, as wide as the temples to within a few hundredths (a ball's would be a fifth narrower); not a heavy one
 // (the owner: "Johansson isn't fat he should have a neck and a maybe smaller face").
 const temple=Math.abs(at(88,82).x),jaw=Math.abs(at(72,128).x);assert.ok(jaw>temple*.97&&jaw<temple*1.04,'the jaw ('+jaw.toFixed(3)+') against the temples ('+temple.toFixed(3)+')');
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
 // He has a neck that shows, and his head is not the biggest thing about him.
 assert.ok(m.neck>plain.neck*1.8,'a neck');assert.ok(R.head.size<.4&&R.body.build<.62,'a smaller head, a trim build');
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

/**
 * Thuan (the owner, the same day): "redraw Thuan in Blender too"; "The blender thuan is the inspiration"; and of the first
 * attempt, "She looks grotesque can you use Disney art design this is real life Thuan it should look like her but a cute
 * cartoon". A soft oval head with a round chin, sculpted in Blender; a face drawn from her photograph on Disney's terms.
 */
test('Thuan: a soft oval head with a small round chin and a small nose, sculpted in Blender, never a kite',async()=>{
 const {THUAN_STUDIO_DESIGN}=await import('../src/avatars/thuan-studio-design.js');
 const T=recipeFor('Thuan'),P=headProfile(T.head);
 assert.equal(T.head.form,'gentle');assert.ok(P.sculpt);assert.equal(THUAN_STUDIO_DESIGN.head.form,'diamond','the Studio design file is as it was');
 const surface=(a,t)=>{const p=shapeHeadPoint({x:Math.sin(t*DEG)*Math.sin(a*DEG),y:Math.cos(t*DEG),z:Math.sin(t*DEG)*Math.cos(a*DEG)},P);return {x:p.x*P.width,y:p.y*P.height,z:p.z*.98};};
 const half=t=>{let m=0;for(let a=40;a<=140;a+=2)m=Math.max(m,Math.abs(surface(a,t).x));return m;};
 assert.ok(P.height/P.width>1.05&&P.height/P.width<1.2,'a little taller than wide');
 // It narrows from the cheekbones to the chin, gently: the jaw at the mouth's height is still most of the cheek's width.
 const cheek=half(95),jaw=half(125),chin=half(150);
 assert.ok(jaw<cheek&&jaw>cheek*.7,`a soft narrowing: cheek ${cheek.toFixed(3)}, jaw ${jaw.toFixed(3)}`);
 assert.ok(chin>cheek*.42,'the chin is round and has width: '+(chin/cheek).toFixed(2)+' of the cheek');
 // One curve, no corner: the width never drops by more than a fifth of the cheek in any ten degrees.
 for(let t=95;t<=150;t+=5)assert.ok(half(t)-half(t+10)<cheek*.2,'no corner at θ '+t);
 const LT=faceLayout(T),tip=theta(LT.noseY),mouth=theta(LT.mouthY);
 // A small soft nose: forward of the upper lip and of the cheek beside it, but low, so the ink line does not catch its edge in dashes.
 assert.ok(surface(0,tip-1.6).z>surface(0,mouth-5).z+.012,'forward of the upper lip');
 assert.ok(surface(0,tip-1.6).z-surface(14,tip-1.6).z>.012,'and of the cheek beside it');
 assert.equal(T.nose.style,'curve','its line is drawn');
 for(const f of ['tools/blender/build-thuan-head.py','tools/blender/head_sculpt.py','art/characters/thuan/thuan-head.blend','art/characters/thuan/thuan-rigged.blend','art/characters/thuan/review/contact-sheet.png'])assert.ok(existsSync(file(f)),f);
 const rig=JSON.parse(readFileSync(file('art/characters/thuan/rig-report.json'),'utf8'));
 assert.equal(rig.meshes['Shimanchu body'].skinned,true);assert.ok(rig.bones.includes('braidL1')&&rig.bones.includes('braidR2'),'her braids are rigged');
});

test('Thuan\'s face is drawn from her photograph on Disney\'s terms; everything else is the Studio design',async()=>{
 const {THUAN_STUDIO_DESIGN}=await import('../src/avatars/thuan-studio-design.js'),{THUAN_REDRAWN}=await import('../src/avatars/cast.js');
 const T=recipeFor('Thuan'),lum=h=>{const n=parseInt(h.slice(1),16);return (.3*(n>>16)+.59*(n>>8&255)+.11*(n&255))/255;};
 // Her eyes are hers: dark, almond, longer than they are tall, the outer corner a little up, set wide and low.
 assert.equal(T.eyes.style,'almond');assert.ok(T.eyes.width>.7&&T.eyes.tilt>.55,'long, a little lifted');assert.ok(lum(T.eyes.colour)<.25,'dark');
 assert.ok(T.eyes.spacing>.55&&T.eyes.height<.3,'set wide and low');
 assert.equal(T.brows.style,'straight');assert.equal(T.mouth.style,'soft');
 const m=parseInt(T.mouth.colour.slice(1),16);assert.ok((m>>16)>180&&(m>>8&255)<90,'her red lips');
 assert.ok(T.blush>=.4);assert.ok(lum(T.body.skin)>.8,'fair');
 for(const [part,values] of Object.entries(THUAN_REDRAWN)){if(typeof values==='object')for(const [k,v] of Object.entries(values))assert.deepEqual(T[part][k],v,part+'.'+k);else assert.equal(T[part],values,part);}
 for(const part of ['hair','outfit'])for(const [k,v] of Object.entries(THUAN_STUDIO_DESIGN[part]))assert.deepEqual(T[part][k],v,part+'.'+k);
 assert.equal(T.hair.style,'braids','her two braids');
 // More feminine, still a cartoon: the graceful frame is slimmer in the limb and the neck, narrower in the shoulder, and has a waist.
 assert.equal(T.body.frame,'graceful');
 const slim=measure(T),plain=measure({...T,body:{...T.body,frame:'standard'}});
 assert.ok(slim.armR<plain.armR*.85&&slim.legR<plain.legR*.92&&slim.width<plain.width&&slim.waistRatio<plain.waistRatio&&slim.depth<plain.depth);   // (her hips and her line: tests/body-kit.test.mjs)
 // Her mouth and eyes act: every expression the face has paints on her.
 const {EXPRESSION_NAMES}=await import('../src/avatars/face.js');assert.ok(EXPRESSION_NAMES.length>=46);
 assert.ok(existsSync(file('art/characters/thuan/review/expressions.png')));
});

test('a wink shuts one of the resident\'s own rigged eyes; it does not draw another eye',async()=>{
 const src=readFileSync(file('src/avatars/eyes3d.js'),'utf8');
 assert.match(src,/else if\(eyes==='wink'&&style!=='squint'\)\{wink=true;eyes='open';\}/);
});
