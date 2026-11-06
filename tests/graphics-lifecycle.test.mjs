import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGraphicsLifecycle} from '../src/render/graphics-lifecycle.js';

function game({running=true,saveError=false,restoreError=false}={}){
 const canvas=new EventTarget(),calls=[],state={running,player:{x:2,z:-1},room:{id:'home'},minutes:1280};
 const lifecycle=createGraphicsLifecycle({canvas,getRunning:()=>state.running,setRunning:value=>{state.running=value;},
  save(){calls.push('save');if(saveError)throw Error('Storage is full');},resetInput:()=>calls.push('input'),
  suspendInput:()=>calls.push('controller'),dropPipeline:()=>calls.push('dispose'),
  restoreGraphics(){calls.push('rebuild');if(restoreError)throw Error('Context is still unavailable');},
  resetClock:()=>calls.push('reset-clock'),followClock:()=>calls.push('follow-clock'),
  onLost:()=>calls.push('show-pause'),onRestored:()=>calls.push('hide-pause'),onError:(_,phase)=>calls.push('error-'+phase)});
 const lose=()=>{const event=new Event('webglcontextlost',{cancelable:true});canvas.dispatchEvent(event);return event;};
 const restore=()=>canvas.dispatchEvent(new Event('webglcontextrestored'));
 return {canvas,calls,state,lifecycle,lose,restore};
}

test('a context loss saves and pauses; restoration preserves the player and open room',()=>{
 const g=game(),player=g.state.player,room=g.state.room;
 assert.equal(g.lose().defaultPrevented,true);assert.equal(g.lifecycle.lost,true);assert.equal(g.state.running,false);
 assert.deepEqual(g.calls,['save','input','controller','dispose','show-pause']);
 g.restore();assert.equal(g.lifecycle.lost,false);assert.equal(g.state.running,true);
 assert.equal(g.state.player,player);assert.equal(g.state.room,room);assert.equal(g.state.minutes,1280);
 assert.deepEqual(g.calls.slice(5),['rebuild','reset-clock','follow-clock','hide-pause']);
});

test('duplicate context events cannot overwrite whether the game was playing or repeat allocations',()=>{
 const g=game();g.lose();g.lose();g.restore();g.restore();
 assert.equal(g.state.running,true);assert.equal(g.calls.filter(c=>c==='dispose').length,1);
 assert.equal(g.calls.filter(c=>c==='rebuild').length,1);assert.equal(g.calls.filter(c=>c==='save').length,1);
 const beforePlay=game({running:false});beforePlay.lose();beforePlay.restore();assert.equal(beforePlay.state.running,false);
});

test('a full save store does not block safe graphics restoration',()=>{
 const g=game({saveError:true});g.lose();assert.equal(g.state.running,false);assert.ok(g.calls.includes('dispose'));
 g.restore();assert.equal(g.state.running,true);assert.equal(g.lifecycle.lost,false);
});

test('failed restoration remains paused; disposing the lifecycle removes its handlers',()=>{
 const g=game({restoreError:true});g.lose();g.restore();
 assert.equal(g.lifecycle.lost,true);assert.equal(g.state.running,false);assert.ok(g.calls.includes('error-restore'));
 assert.equal(g.calls.includes('follow-clock'),false);g.lifecycle.dispose();
 const n=g.calls.length;assert.equal(g.lose().defaultPrevented,false);g.restore();assert.equal(g.calls.length,n);
});

test('the game uses one lifecycle and retains a plain fallback without an automatic reload',async()=>{
 const source=await readFile(new URL('../src/game.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/addEventListener\(['"]webglcontext(?:lost|restored)/);
 assert.match(source,/graphicsLifecycle=createGraphicsLifecycle\(/);
 assert.match(source,/if\(!buildInk\(\)\)inkRecovery\.failed\(\)/);
 assert.match(source,/function present\([^)]*\)\{\s*if\(graphicsLifecycle\?\.lost\)return;/,'Lost contexts must not recreate post-process targets');
 assert.match(source,/function loop\(\)\{requestAnimationFrame\(loop\);if\(graphicsLifecycle\?\.lost\)\{clock\.getDelta\(\);return;\}/,'The loss pause also covers photo studio rendering');
 assert.doesNotMatch(source,/location\.reload\(\)/);
});

test('context recovery is listening before town construction and shader warm-up yield',async()=>{
 const source=await readFile(new URL('../src/game.js',import.meta.url),'utf8');
 const installed=source.indexOf('graphicsLifecycle=createGraphicsLifecycle(');
 assert.ok(installed>0&&installed<source.indexOf("launchReport.stage('Building town')"),'A loss during the loading screen must be eligible for restoration');
 assert.ok(installed<source.indexOf("loadingProgress?.start('shaders')"));
});
