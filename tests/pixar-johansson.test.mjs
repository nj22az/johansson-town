import test from 'node:test';
import assert from 'node:assert/strict';
import {EXPRESSION_NAMES} from '../src/avatars/face.js';
import {featuresOf,MOUTH_KEYS,BROW_KEYS} from '../src/avatars/face-features.js';
import {actingOf,springOf} from '../src/avatars/face-acting.js';
import {readFileSync} from 'node:fs';
import {PIXAR_BODIES} from '../src/avatars/pixar.js';

const card=JSON.parse(readFileSync(new URL('../assets/'+PIXAR_BODIES.Johansson.path+'.json',import.meta.url),'utf8'));

// Pixar Johansson's acting (src/avatars/face-acting.js). His model is tested with Thao's in pixar-meshy.test.mjs: since
// 27 October 2026 both come from the owner's Meshy models (jojo 3d/cast/game_meshy.py); the earlier route from the free
// sculpt (game_johansson.py, with separate shirt and shorts) is kept in the studio repo, out of the game.

test('he acts his feelings his own way, inside his decals, never as a mirror',()=>{
 const acting=actingOf('Johansson'),A=acting.feelings;
 for(const [expression,act] of Object.entries(A)){
  assert.ok(EXPRESSION_NAMES.includes(expression),expression);
  for(const k of Object.keys(act.mouth||{}))assert.ok(MOUTH_KEYS.includes(k),expression+' mouth '+k);
  const sp=springOf(acting,expression);assert.ok(sp.f>0&&sp.z>0);
  for(const talk of [0,1]){
   const f=featuresOf({expression,talk},A);
   const range=acting.browRange;   // (his own, wider than pixar.js BROW_RANGE: his brow decal holds the evil V)
   for(const b of [f.brows.left,f.brows.right]){assert.equal(b.length,BROW_KEYS.length);range.forEach(([lo,hi],i)=>assert.ok(b[i]>=lo&&b[i]<=hi,expression+' brow '+BROW_KEYS[i]));}
   assert.ok(f.mouth.open>=0&&f.mouth.open<=14,expression);
  }
  if(expression!=='neutral'&&act.brows)assert.notDeepEqual(act.brows.left,act.brows.right,expression+' is not twinned');
 }
 // an older face's lines (the forehead's, crow's feet, smile lines) are his, not hers
 assert.ok(acting.lines>0&&!actingOf('Thuan').lines);
 // evil brows (the owner: "he should be able to do "evil " angry eyebrows"): his brows slope down to the outside at rest;
 // angry, the inner ends come down below the outer ends, a V (the shader's line, face-features.js browY)
 const poly=(c,x)=>c.reduce((a,k)=>a*x+k,0);
 const ends=(shape,b)=>{const [lift,tilt,arch,,outer,straight]=b;
  return [poly(shape.line,shape.x0)+lift-tilt,poly(shape.line,shape.x1)+lift+tilt*.3*(1-straight)+outer];};
 for(const side of ['left','right']){
  const [inner0,outer0]=ends(card.brows[side],featuresOf({expression:'neutral'},A).brows[side]);
  assert.ok(inner0>outer0+5,'at rest his '+side+' brow slopes down to the outside');
  for(const expression of ['angry','fuming','raging','scheme']){
   const [inner,outer]=ends(card.brows[side],featuresOf({expression},A).brows[side]);
   assert.ok(outer>inner+4,`${expression}: his ${side} brow a V (inner ${inner.toFixed(1)}, outer ${outer.toFixed(1)})`);
  }
 }
 // his own: a drier, slower take than hers
 const her=actingOf('Thuan');
 assert.ok(springOf(acting,'shock').f<springOf(her,'shock').f,'his shock is a beat slower');
 assert.notDeepEqual(A.angry,her.feelings.angry,'his anger is not hers');
});
