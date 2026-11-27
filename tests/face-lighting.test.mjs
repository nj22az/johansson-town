import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {celFrom} from '../src/render/cel.js';
import {FIGURE_LIGHT_FLOOR} from '../src/avatars/figure-light.js';
installDOM();

const FLOOR=new RegExp(`outgoingLight = max\\( outgoingLight, diffuseColor.rgb \\* ${FIGURE_LIGHT_FLOOR.toFixed(2).replace('.','\\.')} \\)`);
// What a material does to a toon shader's source (the existing hooks run first: the cel tint, a garment's own).
const compiled=material=>{const shader={uniforms:{},defines:{},vertexShader:'#include <common>\n#include <uv_vertex>\n#include <begin_vertex>\n#include <project_vertex>',
 fragmentShader:'#include <common>\n#include <lights_toon_pars_fragment>\n#include <color_fragment>\n#include <emissivemap_fragment>\n#include <opaque_fragment>'};
 material.onBeforeCompile(shader,{});return shader;};

test('shared painted heads keep cel shading, their animated map and a minimum albedo light',()=>{
 for(const name of ['Johansson','Thuan','Vy','Mr Fujita']){
  const avatar=buildAvatar(recipeFor(name),{shadows:false});
  try{
   const material=avatar.face.head.material;
   assert.equal(material.isMeshToonMaterial,true,name);
   assert.equal(material.map,avatar.face.texture,name);
   const shader=compiled(material);
   assert.ok(shader.uniforms.uShadowTint,'Existing toon tint hook is retained');
   assert.match(shader.fragmentShader,FLOOR,'The painted albedo retains contrast in low light');
   assert.match(material.customProgramCacheKey(),/:figure-light-v1$/);
   const map=material.map;avatar.paintFace({expression:'smile',blink:1,talk:1});
   assert.equal(material.map,map);assert.equal(avatar.faceState.blink,1);assert.equal(avatar.faceState.talk,1);
  }finally{avatar.dispose();}
 }
});

// The owner, 27 November 2026, on Johansson at Kitano-jima airport at 19:00 in rain: "Johansson's face and body needs to
// have same color". The face kept a floor on dim light that the body did not have, so after dark and in rain the face
// stood paler than the neck, arms and legs (19:00 in rain: the cheek #af8f7a, the forearm #a17067). One light for the
// whole figure (figure-light.js): every material it is built with takes the face's floor, its ink does not, and the
// town's own materials are left as they were.
test('the face and the body take one light: the same floor on every material of the figure, none on its ink or the town',()=>{
 for(const name of ['Johansson','Thuan','Christina','Sverker','Vy']){
  const avatar=buildAvatar(recipeFor(name),{shadows:false});
  try{
   const head=compiled(avatar.face.head.material).fragmentShader.match(FLOOR)?.[0];
   assert.ok(head,`${name}: the face has its floor`);
   assert.equal(compiled(avatar.body.material).fragmentShader.match(FLOOR)?.[0],head,`${name}: the body (skin, neck, hands, clothes) has the face's own floor`);
   let figure=0,ink=0;
   avatar.root.traverse(o=>{if(!o.isMesh)return;for(const m of [].concat(o.material)){
    if(m.userData.outline){ink++;assert.doesNotMatch(compiled(m).fragmentShader,FLOOR,`${name}: ${o.name}: the ink line is not lit`);continue;}
    figure++;assert.match(compiled(m).fragmentShader,FLOOR,`${name}: ${o.name} (${m.name||m.type}) is lit as the face is`);}});
   assert.ok(figure>=3&&ink>=1,`${name}: ${figure} materials of the figure, ${ink} of ink`);
   // An outfit's body made later (the bath's, the beach's) takes it too.
   for(const outfit of ['swim','towel']){avatar.wear(outfit);
    avatar.root.traverse(o=>{if(o.isMesh&&o.visible&&!o.userData.outline&&!o.material.userData?.outline&&/swim|towel/i.test(o.name))assert.match(compiled(o.material).fragmentShader,FLOOR,`${name} in ${outfit}: ${o.name}`);});}
  }finally{avatar.dispose();}
 }
 // The town's materials keep their own light.
 const scenery=celFrom(new THREE.MeshStandardMaterial({color:0x8a6a4a}),{bands:'soft3'});
 assert.doesNotMatch(compiled(scenery).fragmentShader,FLOOR,'A town material is not given the figure\'s floor');
});
