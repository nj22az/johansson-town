import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {BONES} from '../src/avatars/build.js';
import {EXPRESSION_NAMES,moodOf} from '../src/avatars/face.js';
import {eyeShape,EYES_3D_STATES} from '../src/avatars/eyes3d.js';
import {featuresOf,MOUTH_KEYS} from '../src/avatars/face-features.js';
import {ACTING,actingOf,springOf} from '../src/avatars/face-acting.js';
import {PIXAR_BODIES,pixarWanted,BROW_RANGE} from '../src/avatars/pixar.js';

// Pixar Thuan in World (src/avatars/pixar.js; the owner, 26 October 2026: "Replace her in the live game and studio now").
// Her model and card come from the studio repo (jojo 3d/cast/game_thuan.py) into assets/avatars/pixar/.

const root=new URL('../assets/',import.meta.url),{path,version}=PIXAR_BODIES.Thuan;
const glb=readFileSync(new URL(path+'.glb',root)),card=JSON.parse(readFileSync(new URL(path+'.json',root),'utf8'));
function gltfJSON(bytes){
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 const n=bytes.readUInt32LE(12);assert.equal(bytes.toString('ascii',16,20),'JSON');
 return JSON.parse(bytes.toString('utf8',20,20+n));
}

test('her model is the version the game asks for, light enough for a phone',()=>{
 assert.equal(createHash('sha256').update(glb).digest('hex').slice(0,version.length),version,'PIXAR_BODIES version is the GLB\'s hash');
 assert.ok(glb.length<2.2*1024*1024,`GLB ${glb.length} bytes`);
 const j=gltfJSON(glb);
 let triangles=0;for(const m of j.meshes)for(const p of m.primitives)triangles+=j.accessors[p.indices].count/3;
 assert.ok(triangles<=24000,`${triangles} triangles`);
 assert.equal(j.images.length,1,'one texture');
 const names=j.meshes.flatMap(m=>m.primitives.map(p=>j.materials[p.material].name));
 for(const want of ['body','eyes','brows','mouth'])assert.ok(names.includes(want),'a '+want+' primitive');
});

test('she is skinned to World\'s own bones (and the face\'s: jaw, nose, cheeks)',()=>{
 const j=gltfJSON(glb),joints=new Set(j.skins.flatMap(s=>s.joints.map(i=>j.nodes[i].name)));
 const known=new Set([...BONES,'jaw','nose','cheekL','cheekR']);
 // (and her finger bones, fifteen a hand, so she holds a jug by its handle: jojo game_thuan.py, game_meshy.finger_joints)
 const finger=/^(thumb|index|middle|ring|pinky)[LR][123]$/;
 for(const n of joints)assert.ok(known.has(n)||finger.test(n),'unknown bone '+n);
 assert.equal([...joints].filter(n=>finger.test(n)).length,30,'fifteen finger bones a hand');
 assert.ok(card.fingers?.L?.bend&&card.fingers?.R?.bend,'the card gives the fingers\' bend axes');
 for(const n of ['hips','spine','chest','neck','head','shoulderL','elbowL','handL','thighR','kneeR','footR','braidL1','braidR2','jaw'])assert.ok(joints.has(n),'no '+n);
 // Every joint's rest place is in the card, in World's frame: standing on the ground, her head where World's Thuan's is.
 for(const n of [...joints])assert.ok(Array.isArray(card.rest[n])&&card.rest[n].every(Number.isFinite),'rest of '+n);
 assert.ok(Math.abs(card.measure.H-1.6211)<.01,'her height is World\'s Thuan\'s');
 assert.ok(card.rest.footL[1]>0&&card.rest.footL[1]<.15&&card.rest.head[1]>1.2,'feet low, head high');
 assert.equal(card.measure.hipY,card.rest.hips[1],'the hips bone is where World\'s animation puts it');
});

test('every page draws her unless it asks for the cartoon',()=>{
 assert.equal(pixarWanted('Thuan',''),true);
 assert.equal(pixarWanted('Thuan','?audit'),true);
 assert.equal(pixarWanted('Thuan','?pixar=0'),false);
 assert.equal(pixarWanted('Thuan','?pixar=thuan'),true);
 assert.equal(pixarWanted('Thuan','?pixar=johansson'),false);
});

test('every feeling moves her brows and mouth by sane amounts, and never as a mirror where it leans',()=>{
 for(const expression of EXPRESSION_NAMES)for(const talk of [0,1]){
  const f=featuresOf({expression,talk});
  for(const v of [...f.brows.left,...f.brows.right,...Object.values(f.mouth),...f.cheeks,f.scrunch,f.jaw])assert.ok(Number.isFinite(v),expression);
  assert.ok(f.mouth.open>=0&&f.mouth.open<=16,expression+' open '+f.mouth.open);
  assert.ok(f.jaw>=0&&f.jaw<=1&&f.scrunch>=0&&f.scrunch<=1,expression);
  assert.ok(Math.abs(f.brows.left[0])<14&&Math.abs(f.brows.right[0])<14,expression+' brow lift');
 }
 assert.ok(featuresOf({expression:'neutral',talk:1}).mouth.open>featuresOf({expression:'neutral'}).mouth.open,'talking opens the mouth');
 assert.ok(featuresOf({expression:'smile'}).cheeks[0]>featuresOf({expression:'neutral'}).cheeks[0],'a smile raises the cheeks');
 assert.ok(featuresOf({expression:'surprised'}).brows.left[0]>featuresOf({expression:'neutral'}).brows.left[0],'surprise raises the brows');
 const angry=featuresOf({expression:'angry'});
 assert.notDeepEqual(angry.brows.left,angry.brows.right,'angry is not twinned');
 assert.ok(angry.mouth.smile<0,'angry is not smiling');
 const pain=featuresOf({expression:'pain'});
 assert.ok(pain.brows.left[1]>2&&pain.scrunch>.5&&pain.mouth.teeth>0,'pain knits the brows, wrinkles the nose and clenches the teeth');
 assert.equal(moodOf('no such feeling'),moodOf('neutral'));
});

test('her eyes are her own; the cartoon eyes are as they were',()=>{
 const own={rx:card.eyes.rx,ry:card.eyes.ry,iris:card.eyes.iris,lash:card.eyes.lash,flick:card.eyes.flick,lashes:card.eyes.lashes};
 for(const eyes of EYES_3D_STATES){
  const s=eyeShape('pixar',eyes,own);
  for(const v of Object.values(s))assert.ok(Number.isFinite(v),eyes);
  if(!['daze','dry'].includes(eyes))assert.ok(s.follow>0&&s.still===1&&s.depth>0,eyes+': lids follow, still highlight, iris under the cornea');
  const cartoon=eyeShape('heavy',eyes);
  assert.equal(cartoon.follow,0);assert.equal(cartoon.still,0);assert.equal(cartoon.depth,0);assert.equal(cartoon.caruncle,0);
 }
 // her wide eyes open in her own socket, not to the cartoon's painted size
 const wide=eyeShape('pixar','wide',own);
 assert.ok(wide.rx<own.rx*1.1&&wide.ry<own.ry*1.5);
});

// Her own acting (face-acting.js; the creator, 26 October 2026: "she needs more personality when she is shocked and the
// different expressions, now she comes off as Generic").
test('she acts every feeling her own way, inside her decals, never as a mirror',()=>{
 const acting=actingOf('Thuan'),A=acting.feelings;
 assert.ok(acting&&A,'Thuan has her acting');
 const eyeKeys=new Set(['ry','rx','iris','pupil','cut','slant','smile','look','tremble','tear','squeeze','as']);
 for(const [expression,act] of Object.entries(A)){
  assert.ok(EXPRESSION_NAMES.includes(expression),'a feeling of the painter: '+expression);
  for(const k of Object.keys(act.mouth||{}))assert.ok(MOUTH_KEYS.includes(k),expression+' mouth '+k);
  for(const k of Object.keys(act.eyes||{}))assert.ok(eyeKeys.has(k),expression+' eyes '+k);
  const sp=springOf(acting,expression);assert.ok(sp.f>0&&sp.z>0,expression+' spring');
  for(const talk of [0,1]){
   const f=featuresOf({expression,talk},A);
   for(const v of [...f.brows.left,...f.brows.right,...Object.values(f.mouth),...f.cheeks,f.scrunch,f.jaw])assert.ok(Number.isFinite(v),expression);
   // (the studio's decals: the brows' room to rise, drop and pinch; the mouth's to open)
   for(const b of [f.brows.left,f.brows.right]){
    assert.ok(b[0]>=-3.2&&b[0]<=11&&b[1]>=-9.5&&b[1]<=10.6&&b[2]>=-1.6&&b[2]<=3&&b[3]>=0&&b[3]<=3.2,expression+' brow '+b);
   }
   assert.ok(f.mouth.open>=0&&f.mouth.open<=14,expression+' open');
  }
  if(expression!=='neutral'&&act.brows)assert.notDeepEqual(act.brows.left,act.brows.right,expression+' is not twinned');
 }
 // (and her springs' overshoot held where her decal holds her brows: Johansson's wider evil-brow range is his alone)
 const held=actingOf('Thuan').browRange||BROW_RANGE;
 assert.ok(held[0][1]<=11&&held[1][1]<=10.6&&held[3][1]<=3.2,'her brows held inside her decal: '+JSON.stringify(held.slice(0,4)));
 const F=e=>featuresOf({expression:e},A);
 // shock is not surprise: the brows higher, the mouth far more open, the pupils pinpricks that shiver, a take that overshoots
 assert.ok(F('shock').brows.left[0]>F('surprised').brows.left[0]&&F('shock').mouth.open>F('surprised').mouth.open+4);
 assert.ok(A.shock.eyes.iris<.6&&A.surprised.eyes.iris>=1&&A.shock.eyes.tremble>0&&springOf(acting,'shock').z<.5);
 // anger knits the brows down at the nose (a V); sadness and worry lift them there; sadness sinks in rather than pops
 for(const b of [F('angry').brows.left,F('angry').brows.right])assert.ok(b[1]>6&&b[3]>2,'angry V');
 for(const e of ['sad','worried'])for(const b of [F(e).brows.left,F(e).brows.right])assert.ok(b[1]<-5,e+' inner brows up');
 assert.ok(springOf(acting,'sad').z>=.9);
 // the main feelings are each a different face
 const main=['neutral','smile','happy','laugh','sad','worried','angry','grumpy','shy','surprised','shock','scared','smug','pain','thinking','kiss'];
 const seen=new Set(main.map(e=>JSON.stringify(F(e))));
 assert.equal(seen.size,main.length,'every main feeling looks different');
 // a body without acting plays the painter's feelings, as before
 assert.equal(actingOf('Nobody'),null);
 assert.deepEqual(featuresOf({expression:'angry'},null),featuresOf({expression:'angry'}));
 assert.ok(Object.keys(ACTING).includes('Thuan'));
});
