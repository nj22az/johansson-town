import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {BONES} from '../src/avatars/build.js';
import {eyeShape,EYES_3D_STATES} from '../src/avatars/eyes3d.js';
import {PIXAR_BODIES,pixarWanted} from '../src/avatars/pixar.js';

// The Pixar bodies made from the owner's Meshy models (jojo 3d/cast/game_meshy.py; the owner, 27 October 2026: "use
// Meshy Johansson and Meshy Thao, bring them to the world"): one textured skin each with its own hands, on World's
// skeleton, bound with the arms out, World's rigged eyes, brows and mouth over the painted-out ones. The cartoon
// characters stay beside them (the owner: "don't delete the old simple characters").

const HEIGHTS={Johansson:1.6768,Thao:1.5536,Tetsuo:1.6328,'Mr Fujita':1.5505};   // (Tetsuo and Mr Fujita: clones of Meshy Johansson)
const root=new URL('../assets/',import.meta.url);
function gltfJSON(bytes){
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 const n=bytes.readUInt32LE(12);assert.equal(bytes.toString('ascii',16,20),'JSON');
 return JSON.parse(bytes.toString('utf8',20,20+n));
}
for(const name of Object.keys(HEIGHTS)){
 const {path,version}=PIXAR_BODIES[name];
 const glb=readFileSync(new URL(path+'.glb',root)),card=JSON.parse(readFileSync(new URL(path+'.json',root),'utf8'));
 test(`${name}: the model is the version the game asks for, light enough for a phone`,()=>{
  assert.equal(createHash('sha256').update(glb).digest('hex').slice(0,version.length),version,'PIXAR_BODIES version is the GLB\'s hash');
  assert.ok(glb.length<4.5*1024*1024,`GLB ${glb.length} bytes`);
  const j=gltfJSON(glb),tris=card.triangles;
  assert.ok(Object.values(tris).reduce((a,b)=>a+b,0)<=26000,'triangles in all');
  assert.equal(j.images.length,card.hair?.rigged?2:1,'one texture: the body\'s own (and a rigged hairstyle\'s own, small)');
  for(const want of ['pixar','eyes','brows','mouth'])assert.ok(tris[want]>0,'a '+want+' primitive');
  assert.equal(card.made_by,'jojo 3d/cast/game_meshy.py');
 });
 test(`${name}: skinned to World's own bones, bound with the arms out, as tall as the cartoon`,()=>{
  const j=gltfJSON(glb),known=new Set([...BONES,'jaw','nose','cheekL','cheekR']),joints=new Set(j.skins[0].joints.map(i=>j.nodes[i].name));
  // (and the finger bones of a hand sculpted with fingers: thumb, index, middle, ring, pinky, a side, three joints)
  const finger=/^(thumb|index|middle|ring|pinky)[LR][123]$/;
  for(const n of joints)assert.ok(known.has(n)||finger.test(n),'unknown bone '+n);
  const fingers=[...joints].filter(n=>finger.test(n));
  if(fingers.length){assert.equal(fingers.length,30,'fifteen finger bones a hand');for(const n of fingers)assert.ok(card.rest[n],'the card rests '+n);assert.ok(card.fingers?.L?.bend&&card.fingers?.R?.bend,'the card gives the fingers\' bend axes');}
  for(const n of ['hips','spine','chest','neck','head','shoulderL','elbowL','handL','thighR','kneeR','footR','jaw'])assert.ok(joints.has(n),'no '+n);
  // (a rigged hairstyle swings on the braid bones, Thao's bob: its sides; otherwise no braid bones)
  if(card.hair?.rigged){for(const n of ['braidL1','braidL2','braidR1','braidR2'])assert.ok(joints.has(n),'the hair\'s '+n);assert.ok(card.rest.braidLTip&&card.rest.braidRTip,'the hair\'s ends');}
  else for(const n of joints)assert.ok(!n.startsWith('braid'),'a braid bone: '+n);
  assert.ok(Math.abs(card.measure.H-HEIGHTS[name])<.01,`height ${card.measure.H}`);
  assert.equal(card.measure.hipY,card.rest.hips[1],'the hips bone is where World\'s animation puts it');
  assert.ok(card.rest.footL[1]>0&&card.rest.footL[1]<.15&&card.rest.head[1]>1.1,'feet low, head high');
  assert.ok(card.bind&&card.bind.shoulderL[2]>.5&&card.bind.shoulderR[2]<-.5,'bound with the arms out');
  assert.equal(card.clothes,undefined,'one skin, the clothes part of it');
 });
 test(`${name}: the face, rigged`,()=>{
  const own={rx:card.eyes.rx,ry:card.eyes.ry,iris:card.eyes.iris,lash:card.eyes.lash,flick:card.eyes.flick,lashes:card.eyes.lashes};
  for(const eyes of EYES_3D_STATES)for(const v of Object.values(eyeShape('pixar',eyes,own)))assert.ok(Number.isFinite(v),eyes);
  assert.ok(card.eyes.centres.length===2&&card.eyes.colour.startsWith('#'));
  const [r,l]=card.eyes.centres;
  assert.ok(Math.abs(r[0]+l[0])<.012&&Math.abs(r[1]-l[1])<.006,'the eyes set either side of the nose at one height');
  assert.ok(card.mouth.half>0&&[card.mouth.line,card.mouth.upper,card.mouth.lower].every(c=>c.length===5&&c.every(Number.isFinite)));
  assert.equal(pixarWanted(name,''),true);assert.equal(pixarWanted(name,'?pixar=0'),false);
 });
}
