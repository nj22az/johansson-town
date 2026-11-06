import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/avatars/recipe.js';
import {measure} from '../src/avatars/build.js';
const read=name=>{const b=readFileSync(new URL('../assets/models/owned/'+name+'.glb',import.meta.url));assert.equal(b.toString('ascii',0,4),'glTF');return {bytes:b.length,json:JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)))};};
test('owned characters have real skinning and complete rest-keyed clips',()=>{
 for(const name of ['barfly','Jonsson']){
  const {bytes,json:g}=read(name);assert.ok(bytes<2_000_000);assert.equal(g.skins.length,1);
  assert.deepEqual(g.animations.map(a=>a.name).sort(),['Idle','Wave','Work']);
  assert.ok(g.skins[0].joints.length>=7);
  for(const mesh of g.meshes)for(const p of mesh.primitives){assert.ok(p.attributes.JOINTS_0!==undefined);assert.ok(p.attributes.WEIGHTS_0!==undefined);}
  const head=g.nodes.findIndex(n=>n.name==='head');assert.ok(head>=0);
  for(const a of g.animations){assert.ok(a.channels.some(c=>c.target.node===head));assert.ok(a.channels.length>=7);assert.ok(a.channels.some(c=>c.target.path==='rotation'));for(const channel of a.channels)assert.ok(['rotation','translation','scale'].includes(channel.target.path));}
 }
});
test('Merry Moose has replacement lettering and both complete pupils',()=>{
 const {json:g}=read('merry_Moose');assert.ok(g.nodes.some(n=>n.name==='Merry Moose lettering'));
 assert.equal(g.nodes.filter(n=>n.name?.startsWith('Complete pupil')).length,2);
 assert.ok(g.nodes.some(n=>n.name==='Readable Merry Moose plaque'));
});
test('rounded proportions retain height, shorten legs and survive saved recipes',()=>{
 const classic=normalizeRecipe({body:{proportion:'classic'}}),rounded=normalizeRecipe({body:{proportion:'rounded'}});
 const a=measure(classic),b=measure(rounded);assert.equal(a.H,b.H);assert.ok(b.Rh>a.Rh);assert.ok(b.leg<a.leg);assert.ok(b.width>a.width);
 assert.equal(decodeRecipe(encodeRecipe(rounded)).body.proportion,'rounded');assert.equal(normalizeRecipe({body:{proportion:'unknown'}}).body.proportion,'classic');
});
