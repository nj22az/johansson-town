import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createInkPipeline,INK_DEFAULTS,GRADE_DEFAULTS} from '../src/render/ink-pipeline.js';
import {
 applyCelShading,createCelPass,celFrom,bandsFor,luminance,keepsPhysical,photographic,
 gradientMap,shadowTintAvailable,flattenAvailable,FLATTEN,DEFAULT_TINT
} from '../src/render/cel.js';

/** Runs a material's compile hook against a stand-in for what three hands it. */
function compile(material){
 const shader={
  uniforms:{},
  vertexShader:'void main(){\n#include <worldpos_vertex>\n}',
  fragmentShader:'void main(){\n#include <map_fragment>\n}\n#include <lights_toon_pars_fragment>'
 };
 material.onBeforeCompile?.(shader,{});
 return shader;
}

const standard=(options={})=>new THREE.MeshStandardMaterial({color:0x8a7f6d,...options});
const withMap=()=>{
 const map=new THREE.Texture();
 return standard({map,normalMap:new THREE.Texture()});
};

test('a uniform is never declared inside a chunk that sits in main()',()=>{
 assert.ok(flattenAvailable(),'the map chunk still matches, so the patch is live');
 const shader=compile(celFrom(withMap()));
 const body=shader.fragmentShader;
 const mainAt=body.indexOf('void main()');
 const uniformAt=body.indexOf('uniform float uFlatten;');
 assert.notEqual(uniformAt,-1,'the flatten uniform is declared');
 assert.ok(uniformAt<mainAt,
  'uFlatten must be declared above main(); map_fragment is included inside main(), '+
  'and a uniform there fails to compile and silently flattens every textured surface');
});

test('the shadow tint rides the pars chunk, which is already global',()=>{
 assert.ok(shadowTintAvailable(),'the toon chunk still matches, so the tint is live');
 const shader=compile(celFrom(standard()));
 assert.match(shader.fragmentShader,/uniform vec3 uShadowTint;/);
 assert.ok(shader.uniforms.uShadowTint,'and is bound');
 assert.deepEqual(
  new THREE.Color(DEFAULT_TINT).getHex(),shader.uniforms.uShadowTint.value.getHex());
});

test('the box projection survives conversion, hook or no hook',async()=>{
 const {applyWorldUV}=await import('../src/render/world-uv.js');
 // The hook is present, as it is on a freshly built material.
 const direct=applyWorldUV(standard({map:new THREE.Texture()}),3);
 assert.match(compile(celFrom(direct)).vertexShader,/townTileMetres/);

 // And absent, as it is on a clone: Material.copy carries userData but not the hook.
 const clone=standard({map:new THREE.Texture()});
 clone.userData.worldTextureScale=2;
 const shader=compile(celFrom(clone));
 assert.match(shader.vertexShader,/townTileMetres/,
  'without this every wall and pavement samples one texel and reads as flat colour');
 assert.equal(shader.uniforms.townTileMetres.value,2,'at the scale the material recorded');
});

test('a world-projected surface does not share a shader program with a plain one',()=>{
 const projected=standard({map:new THREE.Texture()});
 projected.userData.worldTextureScale=2;
 const plain=standard({map:new THREE.Texture()});
 assert.notEqual(
  celFrom(projected).customProgramCacheKey(),
  celFrom(plain).customProgramCacheKey());
});

test('only photographic surfaces are flattened, never drawn signage',()=>{
 assert.equal(photographic(standard({normalMap:new THREE.Texture()})),true);
 assert.equal(photographic(standard({roughnessMap:new THREE.Texture()})),true);
 // A shop sign is a CanvasTexture with no PBR maps: flattening it would fade its text.
 const sign=standard({map:new THREE.Texture()});
 assert.equal(photographic(sign),false);
 assert.equal(celFrom(sign).userData.flatten.value,1,'signage keeps its full contrast');
 assert.equal(celFrom(withMap()).userData.flatten.value,FLATTEN);
});

test('animated residents share the town cel ramp without changing their skeleton or textures',()=>{
 const skin=standard({map:new THREE.Texture()});
 assert.equal(keepsPhysical(skin,{skinned:true}),false);
 const mesh=new THREE.SkinnedMesh(new THREE.BufferGeometry(),skin);
 const skeleton=new THREE.Skeleton([new THREE.Bone()]);
 mesh.bind(skeleton);
 const root=new THREE.Group();root.add(mesh);
 const stats=applyCelShading(root);
 assert.equal(mesh.material.type,'MeshToonMaterial');
 assert.equal(mesh.material.map,skin.map);
 assert.equal(mesh.skeleton,skeleton,'toon shading must not replace the animation rig');
 assert.equal(mesh.material.gradientMap,gradientMap(bandsFor(skin)));
 assert.equal(stats.converted,1);
 assert.equal(stats.skipped,0);
 skin.opacity=.6;skin.emissiveIntensity=2;
 assert.equal(mesh.material.opacity,.6);
 assert.equal(mesh.material.emissiveIntensity,2);
});

test('glass and explicitly protected effects retain physical shading on residents too',()=>{
 const glass=standard({transparent:true,opacity:.4});
 glass.userData.keepPhysical=true;
 const effect=standard();effect.userData.keepPhysical=true;effect.userData.keepPhysicalStrict=true;
 for(const material of [glass,effect]){
  const mesh=new THREE.SkinnedMesh(new THREE.BufferGeometry(),material);
  applyCelShading(mesh);
  assert.equal(mesh.material,material);
 }
});

test('conversion carries a material across and drops only what a ramp cannot use',()=>{
 const source=standard({transparent:true,opacity:.5,alphaTest:.3,side:THREE.DoubleSide,
  map:new THREE.Texture(),emissive:0x221100,emissiveIntensity:2});
 source.name='Shop awning';
 const toon=celFrom(source);
 assert.equal(toon.type,'MeshToonMaterial');
 assert.equal(toon.name,'Shop awning');
 assert.equal(toon.color.getHex(),source.color.getHex());
 assert.equal(toon.map,source.map,'the same texture, not a copy');
 assert.equal(toon.transparent,true);
 assert.equal(toon.opacity,.5);
 assert.equal(toon.alphaTest,.3);
 assert.equal(toon.side,THREE.DoubleSide);
 assert.equal(toon.emissiveIntensity,2);
 assert.ok(toon.gradientMap,'and it is banded');
 assert.equal(celFrom(source),toon,'converting twice returns the same material');
});

test('cel conversion retains explicit shadow casting sides and the automatic default',()=>{
 for(const shadowSide of [null,THREE.FrontSide,THREE.BackSide,THREE.DoubleSide]){
  const source=standard({side:THREE.FrontSide,shadowSide}),toon=celFrom(source);
  assert.equal(toon.shadowSide,shadowSide,'an explicit shell override must not revert to PCF back-face casting');
  assert.equal(source.shadowSide,shadowSide,'conversion leaves the original casting side intact');
  assert.equal(toon.side,THREE.FrontSide,'shadow casting does not change visible face culling');
 }
});

test('pale surfaces get a high-key ramp so they do not go grey in shadow',()=>{
 assert.ok(luminance(new THREE.Color(0xf2ece0))>luminance(new THREE.Color(0x3a3330)));
 assert.equal(bandsFor(standard({color:0xf6f1e6})),'soft3','blossom and plaster');
 assert.equal(bandsFor(standard({color:0x4a4038})),3,'timber and asphalt');
 assert.notEqual(gradientMap('soft3'),gradientMap(3));
 assert.equal(gradientMap(3),gradientMap(3),'ramps are shared, not rebuilt per material');
});

test('unlit and already-converted materials are left alone',()=>{
 const basic=new THREE.MeshBasicMaterial({color:0xffffff});   // sky, glass, glowing panels
 const toon=new THREE.MeshToonMaterial({color:0x808080});
 const root=new THREE.Group();
 for(const material of [basic,toon])root.add(new THREE.Mesh(new THREE.BufferGeometry(),material));
 applyCelShading(root);
 assert.equal(root.children[0].material,basic);
 assert.equal(root.children[1].material,toon);
});

test('a multi-material mesh is converted slot by slot',()=>{
 const mesh=new THREE.Mesh(new THREE.BufferGeometry(),
  [standard({color:0x445566}),new THREE.MeshBasicMaterial({color:0x111111})]);
 const root=new THREE.Group();root.add(mesh);
 applyCelShading(root);
 assert.equal(mesh.material[0].type,'MeshToonMaterial');
 assert.equal(mesh.material[1].type,'MeshBasicMaterial');
});

test('the sweep converts streamed geometry once and only once',()=>{
 const pass=createCelPass();
 const root=new THREE.Group();
 root.add(new THREE.Mesh(new THREE.BufferGeometry(),standard({color:0x203040})));
 assert.equal(pass.apply(root).converted,1);
 assert.equal(pass.apply(root).visited,0,'a second sweep does no work');
 // A district arriving later is picked up without re-walking what is already done.
 root.add(new THREE.Mesh(new THREE.BufferGeometry(),standard({color:0x506070})));
 const later=pass.apply(root);
 assert.equal(later.visited,1);
 assert.equal(later.converted,1);
});

test('flatten can be retuned across everything already converted',()=>{
 const pass=createCelPass();
 const root=new THREE.Group();
 root.add(new THREE.Mesh(new THREE.BufferGeometry(),withMap()));
 pass.apply(root);
 const uniform=root.children[0].material.userData.flatten;
 assert.equal(uniform.value,FLATTEN);
 pass.setFlatten(1);
 assert.equal(uniform.value,1);
});

/** Enough of a renderer for the pipeline's own bookkeeping. */
function fakeRenderer(){
 const calls=[];
 return {
  calls,
  capabilities:{isWebGL2:true},
  getDrawingBufferSize(target){target.set(1280,720);return target;},
  getRenderTarget(){return this._target??null;},
  setRenderTarget(target){this._target=target;calls.push(['target',target]);},
  clear(){calls.push(['clear']);},
  render(){calls.push(['render',this._target]);}
 };
}

test('the chain always ends on the screen, whichever passes are on',()=>{
 const renderer=fakeRenderer();
 const pipeline=createInkPipeline(renderer,{superScale:1});
 const screenRenders=()=>renderer.calls.filter(([kind,target])=>kind==='render'&&target===null).length;

 pipeline.render(r=>r.render());
 assert.equal(screenRenders(),1,'ink + grade + fxaa');

 renderer.calls.length=0;
 pipeline.state.ink=false;pipeline.state.grade=false;pipeline.state.fxaa=false;
 pipeline.render(r=>r.render());
 assert.equal(screenRenders(),1,
  'the grade also converts to sRGB, so it can be neutralised but never skipped');
 pipeline.dispose();
});

test('the scene is drawn offscreen and the previous target is put back',()=>{
 const renderer=fakeRenderer();
 const outer={};renderer.setRenderTarget(outer);renderer.calls.length=0;
 const pipeline=createInkPipeline(renderer,{superScale:1});
 let drawTarget='not called';
 pipeline.render(r=>{drawTarget=r.getRenderTarget();});
 assert.notEqual(drawTarget,null,'the town is drawn into a target, not onto the screen');
 assert.notEqual(drawTarget,outer);
 pipeline.dispose();
});

test('a draw that throws still restores the render target',()=>{
 const renderer=fakeRenderer();
 const pipeline=createInkPipeline(renderer,{superScale:1});
 assert.throws(()=>pipeline.render(()=>{throw new Error('interior blew up');}),/interior blew up/);
 assert.equal(renderer.getRenderTarget(),null,'the next frame is not left drawing into a target');
 pipeline.dispose();
});

test('the render target tracks the buffer and respects the pixel budget',()=>{
 const renderer=fakeRenderer();
 const pipeline=createInkPipeline(renderer,{superScale:2,pixelBudget:1e6});
 pipeline.resize();
 assert.ok(pipeline.width*pipeline.height<=1e6+1,'a budget caps the supersample');
 assert.ok(pipeline.width>0&&pipeline.height>0);
 const roomy=createInkPipeline(fakeRenderer(),{superScale:1.5,pixelBudget:1e9});
 roomy.resize();
 assert.equal(roomy.width,1920,'1280 at 1.5x');
 assert.equal(roomy.height,1080);
 pipeline.dispose();roomy.dispose();
});

test('the camera clip planes and the exposure reach the ink and the grade',()=>{
 const pipeline=createInkPipeline(fakeRenderer(),{superScale:1});
 pipeline.setCamera(new THREE.PerspectiveCamera(65,1.7,.07,220));
 pipeline.tune({uSens:.003});
 pipeline.setExposure(1.4);
 // Nothing here is observable except through a render that does not throw.
 assert.doesNotThrow(()=>pipeline.render(r=>r.render()));
 assert.equal(typeof INK_DEFAULTS.sensitivity,'number');
 assert.equal(typeof GRADE_DEFAULTS.lift,'number');
 pipeline.dispose();
});

test('a room can ask that its lamps stop at its walls: point lights then light only the faces turned to them',async()=>{
 const {wallsStopLampsAvailable}=await import('../src/render/cel.js');
 assert.ok(wallsStopLampsAvailable(),'the lights chunk still has the point-light line, so the option is live');
 const run=material=>{const shader={uniforms:{},vertexShader:'void main(){}',fragmentShader:'void main(){\n#include <lights_fragment_begin>\n}\n#include <lights_toon_pars_fragment>'};material.onBeforeCompile?.(shader,{});return shader;};
 const plain=celFrom(standard()),walled=standard();walled.userData.lampsStopAtWalls=true;const toon=celFrom(walled);
 // Untouched unless asked: the town keeps the soft wrap on every light.
 assert.ok(run(plain).fragmentShader.includes('#include <lights_fragment_begin>'));
 const body=run(toon).fragmentShader;
 assert.ok(!body.includes('#include <lights_fragment_begin>'),'the chunk is inlined with the change');
 assert.match(body,/getPointLightInfo\( pointLight, geometryPosition, directLight \);\s*directLight\.color \*= step\( 0\.0, dot\( geometryNormal, directLight\.direction \) \);/);
 assert.equal((body.match(/step\( 0\.0, dot\( geometryNormal/g)||[]).length,1,'only the point lights: the sun and the spot lights keep their wrap');
 assert.notEqual(plain.customProgramCacheKey(),toon.customProgramCacheKey(),'its own program');
});

test('a look can take the photographic maps away and give each back its own amount',async()=>{
 const {createCelPass}=await import('../src/render/cel.js');
 const pass=createCelPass();
 const root=new THREE.Group();
 const textured=()=>{const m=new THREE.MeshStandardMaterial({map:new THREE.Texture(),normalMap:new THREE.Texture(),roughnessMap:new THREE.Texture()});return m;};
 root.add(new THREE.Mesh(new THREE.BufferGeometry(),textured()));
 pass.apply(root);
 const uniform=root.children[0].material.userData.flatten;
 if(!uniform)return; // this three.js build has no map chunk to patch; nothing to scale
 const own=uniform.value;
 pass.scaleFlatten(0);assert.equal(uniform.value,0);
 // A district that streams in while the look is on arrives flat too.
 const later=new THREE.Group();later.add(new THREE.Mesh(new THREE.BufferGeometry(),textured()));
 pass.apply(later);
 assert.equal(later.children[0].material.userData.flatten.value,0);
 pass.scaleFlatten(1);
 assert.equal(uniform.value,own);
 assert.equal(later.children[0].material.userData.flatten.value,own);
});
