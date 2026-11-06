import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createStartupRecovery,graphicsProfile} from '../src/render/startup-recovery.js';
const fixture=()=>{const data=new Map(),listeners=new Map(),callbacks=new Map();let id=0;return {storage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)},events:{addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:k=>listeners.delete(k)},schedule:f=>{callbacks.set(++id,f);return id;},cancel:i=>callbacks.delete(i),hide:()=>listeners.get('pagehide')?.(),settle:()=>[...callbacks.values()].forEach(f=>f())};};
test('model-stage interruptions are counted by the same attempt used in the game',async()=>{
 const boot=await readFile(new URL('../src/boot.js',import.meta.url),'utf8'),game=await readFile(new URL('../src/game.js',import.meta.url),'utf8');
 const marker=boot.indexOf('__JOHANSSON_STARTUP_RECOVERY__??=createStartupRecovery(');
 assert.ok(marker>=0&&marker<boot.indexOf("import('./avatars/pixar.js')"),'Start the marker before downloading or parsing character models');
 assert.match(game,/startupRecovery=window\.__JOHANSSON_STARTUP_RECOVERY__\|\|createStartupRecovery/,'Do not double-count one page as two attempts');
 const f=fixture();createStartupRecovery({...f,now:()=>1000});createStartupRecovery({...f,now:()=>1100});
 assert.equal(createStartupRecovery({...f,now:()=>1200}).recovering,true,'Two processes killed before game construction recover on the third attempt');
 const ready=game.slice(game.indexOf('function firstFrameReady(){'),game.indexOf('const lensInShip='));
 assert.match(ready,/startupRecovery\.running\(\)/,'A launch only settles after a playable frame');
 const enter=game.slice(game.indexOf('function enterWorld(){'),game.indexOf('function desktopCheckpoint(){'));
 assert.doesNotMatch(enter,/startupRecovery\.running\(\)/,'Clicking START without a drawn frame cannot settle the attempt');
});
test('two processes killed in a row select recovery on the next launch, and it says so',()=>{
 const f=fixture(),first=createStartupRecovery({...f,now:()=>1000});assert.equal(first.safe,false);first.entering();first.running();
 const second=createStartupRecovery({...f,now:()=>1100});assert.equal(second.interrupted,true);assert.equal(second.safe,false,'one interruption is often a moment');
 second.entering();
 const third=createStartupRecovery({...f,now:()=>1200});assert.equal(third.safe,true);assert.equal(third.recovering,true);assert.equal(third.reduced,false);
 third.running();f.settle();assert.equal(createStartupRecovery({...f,now:()=>1300}).safe,false,'a settled recovery launch clears the count');
});
test('normal reloads and settled starts do not trigger recovery',()=>{
 for(const finish of ['hide','settle']){const f=fixture();for(let i=0;i<3;i++){const a=createStartupRecovery({...f,now:()=>1000+i});a.entering();a.running();f[finish]();}assert.equal(createStartupRecovery({...f,now:()=>1100}).safe,false);}
});
test('old attempts and unavailable storage do not block launch; explicit recovery persists',()=>{
 const f=fixture();createStartupRecovery({...f,now:()=>1000});createStartupRecovery({...f,now:()=>1001});assert.equal(createStartupRecovery({...f,now:()=>200000}).safe,false);
 const broken={getItem(){throw Error('denied');},setItem(){throw Error('denied');},removeItem(){throw Error('denied');}};assert.equal(createStartupRecovery({storage:broken}).safe,false);
 createStartupRecovery({...f,search:'?graphics=safe',now:()=>300000});f.hide();assert.equal(createStartupRecovery({...f,now:()=>300100}).safe,true);
});
test('every device class draws the full look; only recovery is lean',()=>{
 const desktop=graphicsProfile(),tablet=graphicsProfile({mobile:true,tablet:true}),phone=graphicsProfile({mobile:true});
 for(const p of [desktop,tablet,phone]){assert.equal(p.samples,4);assert.equal(p.preferHalfFloat,true);assert.equal(p.postprocess,true);assert.equal(p.precompile,true);
  assert.equal(p.streamDetails,true);assert.equal(p.cinematic,true);assert.equal(p.quietOpening,false);assert.equal(p.canvasPixels,null);
  assert.equal(p.antialias,false,'the canvas only receives the FXAA pass');}
 assert.deepEqual([desktop.dpr,tablet.dpr,phone.dpr],[2,1.85,1.5]);
 assert.deepEqual([desktop.shadowSize,tablet.shadowSize,phone.shadowSize],[2048,1024,0]);
 assert.deepEqual([desktop.shadows,tablet.shadows,phone.shadows],[true,true,false]);
 assert.deepEqual([desktop.pixelBudget,tablet.pixelBudget,phone.pixelBudget],[4.6e6,2.4e6,2.4e6]);
 for(const input of [{mobile:true,safe:true},{safe:true}]){const p=graphicsProfile(input);assert.equal(p.samples,0);assert.equal(p.precompile,false);assert.ok(p.pixelBudget<=650000);assert.equal(p.shadows,false);assert.equal(p.streamDetails,false);}
});
test('recovery keeps a CSS-pixel floor within its hard canvas budget',async()=>{
 const {drawingDpr}=await import('../src/render/startup-recovery.js');
 const p=graphicsProfile({mobile:true,safe:true,reduced:false});
 assert.equal(p.postprocess,true);assert.equal(p.canvasPixels,650000);
 for(const [width,height] of [[430,932],[932,430],[4096,2732]]){
  const dpr=drawingDpr({width,height,deviceDpr:3,profile:p});assert.ok(width*height*dpr*dpr<=650001);
 }
 const full=graphicsProfile({mobile:true});
 const normal=drawingDpr({width:430,height:932,deviceDpr:3,profile:full});
 const slower=drawingDpr({width:430,height:932,deviceDpr:3,profile:full,scale:.6});
 assert.equal(normal,1.5);assert.ok(slower<normal);assert.ok(slower>=1,'normal phone sizes retain a CSS-pixel resolution floor');
});

test('obsolete automatic recovery markers cannot permanently remove cartoon effects',()=>{
 const f=fixture();f.storage.setItem('johansson-safe-graphics-v1','1');
 const a=createStartupRecovery({...f,now:()=>1000});
 assert.equal(a.safe,false);assert.equal(a.reduced,false);assert.equal(f.storage.getItem('johansson-safe-graphics-v1'),undefined);
 a.entering();createStartupRecovery({...f,now:()=>1100}).entering();const recovery=createStartupRecovery({...f,now:()=>1200});
 assert.equal(recovery.safe,true);assert.equal(recovery.reduced,false);
 const p=graphicsProfile({mobile:true,safe:recovery.safe,reduced:recovery.reduced});
 assert.equal(p.postprocess,true);assert.equal(p.preferHalfFloat,true);assert.equal(p.samples,0);assert.equal(p.shadows,false);assert.equal(p.canvasPixels,650000);
 recovery.running();f.settle();assert.equal(createStartupRecovery({...f,now:()=>1300}).safe,false);
});

test('a deliberate full-effects request clears reduced mode and overrides recovery for that launch',()=>{
 const f=fixture();createStartupRecovery({...f,search:'?graphics=safe',now:()=>1000});f.hide();
 const retry=createStartupRecovery({...f,search:'?graphics=full',now:()=>1100});assert.equal(retry.safe,false);
 f.hide();assert.equal(createStartupRecovery({...f,now:()=>1200}).safe,false);
 createStartupRecovery({...f,now:()=>1300}).entering();createStartupRecovery({...f,now:()=>1400}).entering();
 const full=createStartupRecovery({...f,search:'?graphics=full',now:()=>1500});
 assert.equal(full.interrupted,true);assert.equal(full.safe,false);
 assert.equal(createStartupRecovery({...f,now:()=>1600}).safe,true,'a further crash still counts');
});
