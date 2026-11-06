import test from 'node:test';
import assert from 'node:assert/strict';
import {createInkPipeline} from '../src/render/ink-pipeline.js';
import {LOOKS,LOOK_KEY,isLook,clearSavedLook,lookCSS,lookNeedsPipeline,lookFlatten,lookFragment,normalLook} from '../src/render/looks.js';

function fakeRenderer(){
 const calls=[];
 return {
  calls,
  capabilities:{isWebGL2:true},
  getDrawingBufferSize(target){target.set(1280,720);return target;},
  getRenderTarget(){return this._target??null;},
  setRenderTarget(target){this._target=target;calls.push(['target',target]);},
  clear(){},
  render(){calls.push(['render',this._target]);}
 };
}
const renders=renderer=>renderer.calls.filter(([kind])=>kind==='render');

test('every look but Natural has a shader of its own, and the menu offers the requested set',()=>{
 assert.deepEqual(Object.keys(LOOKS),['none','mono','sepia','pocket','snes','lines','crt','manga','crayon','tilt','print','watercolour','flat','oil','sketchbook','riso','pencilManga','brushOil','stamp']);
 assert.equal(lookFragment('none'),null);
 for(const name of Object.keys(LOOKS).filter(n=>n!=='none')){
  const source=lookFragment(name);
  assert.match(source,/void main\(\)\{/,name);
  assert.match(source,/gl_FragColor=vec4\(/,name);
  // Nothing in a look moves on its own: a still camera gives a still picture.
  assert.doesNotMatch(source,/uTime/,name);
 }
});

test('Natural adds no pass; a look adds exactly one, and the chain still ends on the screen',()=>{
 const renderer=fakeRenderer(),pipeline=createInkPipeline(renderer,{superScale:1});
 pipeline.render(r=>r.render());
 const natural=renders(renderer).length;
 assert.equal(renders(renderer).at(-1)[1],null);
 for(const name of ['manga','crayon','crt']){
  renderer.calls.length=0;pipeline.setLook(name);pipeline.render(r=>r.render());
  assert.equal(renders(renderer).length,natural+1,name);
  assert.equal(renders(renderer).filter(([,t])=>t===null).length,1,name+' draws the screen once');
  assert.equal(renders(renderer).at(-1)[1],null,name+' is the last pass');
 }
 renderer.calls.length=0;pipeline.state.fxaa=false;pipeline.render(r=>r.render());
 assert.equal(renders(renderer).filter(([,t])=>t===null).length,1,'without FXAA the look still finishes on the screen');
 pipeline.setLook('nonsense');assert.equal(pipeline.state.look,'none');
 pipeline.dispose();
});

test('nothing is remembered: an old saved look is cleared, and only real looks are accepted',()=>{
 const store=new Map([[LOOK_KEY,'manga']]),storage={removeItem:k=>store.delete(k)};
 clearSavedLook(storage);assert.equal(store.has(LOOK_KEY),false);
 assert.doesNotThrow(()=>clearSavedLook({removeItem(){throw new Error('blocked');}}));
 assert.doesNotThrow(()=>clearSavedLook(null));
 assert.ok(isLook('manga')&&isLook('none'));
 assert.ok(!isLook('__proto__')&&!isLook('nonsense'));
});

test('reduced graphics keep the colour looks as a CSS filter and offer nothing they cannot draw',()=>{
 assert.equal(lookCSS('none'),'none');
 assert.match(lookCSS('mono'),/grayscale/);
 assert.match(lookCSS('sepia'),/sepia/);
 for(const name of ['pocket','snes','lines','crt','manga','crayon','tilt','print','watercolour','flat','oil','sketchbook'])assert.ok(lookNeedsPipeline(name),name);
 assert.ok(!lookNeedsPipeline('none')&&!lookNeedsPipeline('mono'));
});

test('the oil painting has a lighter version for phones and tablets, and every look still builds both ways',()=>{
 const full=lookFragment('oil'),light=lookFragment('oil',{light:true});
 assert.doesNotMatch(full,/#define LIGHT/);
 assert.match(light,/^#define LIGHT\n/);
 for(const name of Object.keys(LOOKS).filter(n=>n!=='none'))assert.match(lookFragment(name,{light:true}),/void main\(\)\{/,name);
});

test('only Cartoon takes the surface photographs away',()=>{
 assert.deepEqual(Object.keys(LOOKS).filter(n=>lookFlatten(n)!==1),['flat']);
 assert.equal(lookFlatten('flat'),0);
});

test('all retained styles keep the World ink prepass',()=>{
 const renderer=fakeRenderer(),render=renderer.render.bind(renderer),seen=[];renderer.render=scene=>{const u=scene?.children?.[0]?.material?.uniforms;if(u?.uInkEnabled)seen.push(u.uInkEnabled.value);render(scene);};const pipeline=createInkPipeline(renderer,{superScale:1});
 for(const look of ['oil','flat','sketchbook','none','riso','pencilManga','brushOil','stamp']){pipeline.setLook(look);pipeline.render(r=>r.render());}
 assert.deepEqual(seen,[1,1,1,1,1,1,1,1]);pipeline.dispose();
});

test('retired experiments are absent from the picker and normalize to clean styles',()=>{for(const [old,next] of Object.entries({storybook:'flat',sunday:'flat',gouache:'oil'})){assert.equal(isLook(old),false);assert.equal(lookFragment(old),null);assert.equal(normalLook(old),next);}assert.equal(normalLook('__proto__'),'none');assert.equal(normalLook('sketchbook'),'sketchbook');});
