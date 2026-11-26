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
 // A heart: the jaw narrows to a small chin that is still round (it has width a fifth of the way up from its point).
 const cheek=V.half(100),chin=V.half(150);assert.ok(V.half(128)>cheek*.6&&V.half(128)<cheek*.8&&chin>cheek*.34,`a heart with a small round chin: jaw ${(V.half(128)/cheek).toFixed(2)}, chin ${(chin/cheek).toFixed(2)}`);
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

test('Thao, from her photograph: a long serene oval, her hair tied back to a low bun with her ears showing, and short pants',async()=>{
 // The owner, 26 November 2026: "This is Thao but cartoon Thao should wear short pants".
 const T=head('Thao'),{measure}=await import('../src/avatars/build.js');
 assert.equal(T.R.head.form,'serene');assert.ok(HEAD_FORMS.includes('serene'));
 const ratio=T.P.height/T.P.width;assert.ok(ratio>1.18&&ratio<1.3,'a long oval: '+ratio.toFixed(2));
 // An oval, never a kite: the jaw stays full and the chin is a round end, with no corner on the way down.
 const cheek=T.half(96);assert.ok(T.half(130)>cheek*.72,'a full jaw: '+(T.half(130)/cheek).toFixed(2));assert.ok(T.half(150)>cheek*.4,'a round chin: '+(T.half(150)/cheek).toFixed(2));
 for(let t=95;t<=150;t+=5)assert.ok(T.half(t)-T.half(t+10)<cheek*.2,'no corner at θ '+t);
 assert.equal(T.P.sculpt.nose,false,'her nose is the kit\'s, not the sculpt\'s');
 // Short pants, as asked, with the photograph's yellow top; slim, on the graceful frame.
 assert.equal(T.R.outfit.bottom,'shorts');assert.equal(T.R.outfit.top,'tee');assert.equal(measure(T.R).graceful,true);
 const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),[r,g,b]=rgb(T.R.outfit.topColour);assert.ok(r>200&&g>170&&b<140,'a yellow top');
 // Her hair (tiedback), sculpted: off the forehead, over the crown, down to the nape, cut round each ear, a bun behind.
 assert.equal(T.R.hair.style,'tiedback');
 const {TIEDBACK_HAIR:S}=await import('../src/avatars/sculpts/tiedback-hair.js');
 const table=K=>{const raw=atob(K.data);return (a,t)=>{const i=Math.round(t/180*(S.nt-1))*S.na+Math.round((a+180)/360*(S.na-1));return K.min+(K.max-K.min)*(raw.charCodeAt(i*2)|raw.charCodeAt(i*2+1)<<8)/65535;};};
 const field=table(S.field),radius=table(S.radius);
 assert.ok(field(0,30)>0&&field(180,100)>0&&field(120,70)>0,'over the crown and down the back');
 assert.ok(field(0,60)<0&&field(0,T.brow)<0&&field(30,T.eye)<0,'a clear forehead and an open face');
 assert.ok(field(89,94)<0&&field(-89,94)<0,'cut round the ears');assert.ok(field(180,130)<0,'the nape is bare below the bun');
 assert.ok(radius(180,108)>radius(180,60)+.15&&radius(180,108)>radius(140,108)+.12,'a round bun at the nape, proud of the head');
 // Her sisters' sister, and nobody's copy: her head, her hair and her mouth are her own.
 for(const other of ['Thuan','Vy']){const o=recipeFor(other);assert.notEqual(T.R.head.form,o.head.form);assert.notEqual(T.R.hair.style,o.hair.style);assert.notEqual(T.R.mouth.style,o.mouth.style);assert.notEqual(T.R.nose.style,o.nose.style);}
 // Fully rigged, with every expression.
 const a=buildAvatar(T.R,{shadows:false,eyes3d:false});assert.ok(a.body.skeleton.bones.length>=28);for(const e of EXPRESSION_NAMES)a.paintFace({expression:e,blink:0,talk:0,look:[0,0]});a.dispose();
 for(const f of ['tools/blender/build-thao-head.py','art/characters/thao/thao-head.blend','art/characters/thao/thao-rigged.blend','art/characters/thao/review/contact-sheet.png','art/characters/thao/review/expressions.png'])assert.ok(existsSync(file(f)),f);
});

test('Christina, Erik and Sverker: renamed by the owner, drawn from their photographs, sculpted in Blender and fully rigged',async()=>{
 // The owner, 26 November 2026: "This is Mrs Higa who should be renamed to Christina and she should not have a wheelchair",
 // "This is Mac who should be renamed Erik", "This is the harbour master Sverker".
 const {identityOf,ROSTER}=await import('../src/people/roster.js'),{castMember}=await import('../src/people/cast.js');
 const {measure}=await import('../src/avatars/build.js'),{PATTERNS}=await import('../src/avatars/recipe.js');
 const WAS={Christina:['Gran Higa','Grandmother Higa'],Erik:['Mac','Mac Turner','Mr Nakandakari'],Sverker:['Jack','Jack Reed','Harbour master']};
 const ID={Christina:'gran-higa',Erik:'mac',Sverker:'jack'},FORM={Christina:'kindly',Erik:'burly',Sverker:'broad'};
 for(const [name,old] of Object.entries(WAS)){
  const who=identityOf(name);assert.equal(who.id,ID[name]);assert.equal(who.name,name);assert.equal(who.avatar,name);
  assert.equal(castMember(name).name,name,name+' is the name the town uses');
  for(const o of old){assert.equal(identityOf(o).id,ID[name],o+' still finds '+name);assert.equal(castMember(o).name,name);assert.deepEqual(recipeFor(o).head,recipeFor(name).head);}
  assert.ok(!ROSTER.some(p=>old.includes(p.name)),'nobody is shown by an old name');
  // A head of their own, sculpted in Blender; rigged, with every expression; their sheets kept.
  const H=head(name);assert.equal(H.R.head.form,FORM[name]);assert.ok(H.P.sculpt,name+' wears a sculpted head');
  const a=buildAvatar(H.R,{shadows:false,eyes3d:false});assert.ok(a.body.skeleton.bones.length>=28);for(const e of EXPRESSION_NAMES)a.paintFace({expression:e,blink:0,talk:0,look:[0,0]});a.dispose();
  const slug=name.toLowerCase();
  for(const f of [`tools/blender/build-${slug}-head.py`,`art/characters/${slug}/${slug}-head.blend`,`art/characters/${slug}/${slug}-rigged.blend`,`art/characters/${slug}/review/contact-sheet.png`,`art/characters/${slug}/review/expressions.png`])assert.ok(existsSync(file(f)),f);
 }
 const lum=h=>{const n=parseInt(h.slice(1),16);return (.3*(n>>16)+.59*(n>>8&255)+.11*(n&255))/255;};
 // Christina: round and soft, white hair of her own (softwave), the spotted navy dress; she stands and walks, and there
 // is no wheelchair in the town's people or their drawings.
 const C=head('Christina');assert.ok(C.P.width/C.P.height>.94,'a round head');assert.equal(C.R.hair.style,'softwave');assert.ok(lum(C.R.hair.colour)>.9,'white hair');
 assert.equal(C.R.outfit.pattern,'dots');assert.ok(lum(C.R.outfit.topColour)<.2);assert.equal(C.R.glasses.style,'none');
 const {readdirSync}=await import('node:fs');
 for(const dir of ['src/people','src/avatars'])for(const f of readdirSync(file(dir)).filter(f=>f.endsWith('.js'))){
  // (in the code and its data; the owner's words are quoted in the notes)
  const code=readFileSync(file(dir+'/'+f),'utf8').split('\n').filter(l=>!/^\s*(\*|\/\/|\/\*)/.test(l)).join('\n');assert.ok(!/wheelchair/i.test(code),dir+'/'+f);}
 // Erik: broad and heavy, a full grey beard, his olive cap and the blue checked shirt.
 const E=head('Erik');assert.ok(E.P.width>=1.04,'a broad head');assert.equal(E.R.facial.paint,'full');assert.equal(E.R.outfit.hat,'cap');
 assert.equal(E.R.outfit.pattern,'check');assert.ok(PATTERNS.includes('check'));assert.equal(PATTERNS.indexOf('check'),4,'appended: no saved look moves');
 // Sverker: broader than tall, thick pale hair swept across (sweptmop), no cap over it, and a big man's belly.
 const S=head('Sverker');assert.ok(S.P.width>S.P.height,'broader than tall');assert.equal(S.R.hair.style,'sweptmop');assert.ok(lum(S.R.hair.colour)>.85,'white-blond');assert.equal(S.R.outfit.hat,'none');
 const m=measure(S.R),plain=measure({...S.R,body:{...S.R.body,frame:'standard'}});
 assert.equal(m.stout,true);assert.ok(m.waistRatio>1,'his belly is the widest of him');assert.ok(m.depth>plain.depth*1.2,'deep through the middle');assert.ok(m.legR>plain.legR,'on thicker legs');
 // Nobody's head is anybody else's.
 const forms=['Johansson','Thuan','Tetsuo','Vy','Thao','Christina','Erik','Sverker'].map(n=>recipeFor(n).head.form);assert.equal(new Set(forms).size,forms.length);
});
