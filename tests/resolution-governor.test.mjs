import test from 'node:test';
import assert from 'node:assert/strict';
import {createResolutionGovernor} from '../src/render/resolution-governor.js';
import {drawingDpr,graphicsProfile} from '../src/render/startup-recovery.js';
const run=(g,seconds,fps,active=true)=>{for(let i=0;i<seconds*fps;i++)g.sample(1/fps,{active});};
test('sustained overload reduces detail within bounds and sustained headroom restores it',()=>{
 const g=createResolutionGovernor();run(g,45,18);assert.ok(g.scale<1);assert.ok(g.scale>=2/3);
 const p=graphicsProfile({mobile:true,ios:true});
 assert.ok(drawingDpr({width:390,height:844,deviceDpr:3,profile:p,scale:g.scale})>=1);
 run(g,100,60);assert.equal(g.scale,1);
});
test('loading and hidden intervals do not lower quality; brief spikes do not cause pumping',()=>{
 const g=createResolutionGovernor();run(g,90,10,false);assert.equal(g.scale,1);
 run(g,2,15);run(g,10,60);assert.equal(g.scale,1);
 for(let i=0;i<10;i++){run(g,2,20);run(g,8,60);}assert.equal(g.scale,1);
});
