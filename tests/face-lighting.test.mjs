import test from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
installDOM();

test('shared painted heads keep cel shading, their animated map and a minimum albedo light',()=>{
 for(const name of ['Johansson','Thuan','Vy','Mr Fujita']){
  const avatar=buildAvatar(recipeFor(name),{shadows:false});
  try{
   const material=avatar.face.head.material;
   assert.equal(material.isMeshToonMaterial,true,name);
   assert.equal(material.map,avatar.face.texture,name);
   const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <lights_toon_pars_fragment>\n#include <opaque_fragment>'};
   material.onBeforeCompile(shader,{});
   assert.ok(shader.uniforms.uShadowTint,'Existing toon tint hook is retained');
   assert.match(shader.fragmentShader,/outgoingLight = max\( outgoingLight, diffuseColor.rgb \* 0\.5 \)/,'The painted albedo retains contrast in low light');
   assert.match(material.customProgramCacheKey(),/:face-light-floor-v1$/);
   const map=material.map;avatar.paintFace({expression:'smile',blink:1,talk:1});
   assert.equal(material.map,map);assert.equal(avatar.faceState.blink,1);assert.equal(avatar.faceState.talk,1);
   assert.notEqual(avatar.body.material.customProgramCacheKey(),material.customProgramCacheKey(),'The face floor does not change body or scenery materials');
  }finally{avatar.dispose();}
 }
});
