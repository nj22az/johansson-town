import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {buildAvatar} from '../src/avatars/build.js';
import {poseStudioActor} from '../src/photo/studio.js';
import {FORMATS,POSES,EXPRESSIONS,cleanCaption,frameSize,comicLayout,wrapCaption} from '../src/photo/layout.js';

test('photo frames fit desktop, narrow phone and landscape phone without overflow',()=>{
 for(const [w,h] of [[1100,850],[366,330],[550,240],[290,145]])for(const aspect of Object.values(FORMATS)){
  const s=frameSize(w,h,aspect);assert.ok(s.width<=w&&s.height<=h);assert.ok(Math.abs(s.width/s.height-aspect)<.02);
 }
});
test('comic layout preserves order and keeps all panels inside the export',()=>{
 for(const style of ['grid','strip'])for(let count=1;count<=4;count++){
  const l=comicLayout(count,style);assert.equal(l.cells.length,count);
  l.cells.forEach(c=>{assert.ok(c.x>=0&&c.y>=0&&c.x+c.w<=l.width&&c.y+c.h<=l.height);});
  for(let i=1;i<count;i++)assert.ok(l.cells[i].y>l.cells[i-1].y||l.cells[i].x>l.cells[i-1].x);
 }
});
test('captions are bounded and Unicode wrapping handles long unbroken text',()=>{
 const ctx={measureText:s=>({width:Array.from(s).length*10})};
 assert.equal(cleanCaption('a\nb\u0000c'),'a b c');assert.equal(cleanCaption('x'.repeat(500)).length,120);
 for(const text of ['Johansson at the harbour','こんにちは沖縄の友達','A'.repeat(120),'😀'.repeat(20)]){
  const lines=wrapCaption(ctx,text,100,3);assert.ok(lines.length<=3);assert.ok(lines.every(s=>ctx.measureText(s).width<=100));
 }
 // English breaks between words, never inside one; the words all come back in order.
 const words=wrapCaption(ctx,'and then the cat ate the ramen!',100,3);
 assert.deepEqual(words,['and then','the cat','ate th…'],'a cut-off last line ends in an ellipsis');assert.ok(words.every(s=>ctx.measureText(s).width<=100));
 assert.deepEqual(wrapCaption(ctx,'the cat ate the ramen!',100,4),['the cat','ate the','ramen!']);
 assert.deepEqual(wrapCaption(ctx,'Go on',100,3),['Go on']);
});
test('every studio pose stays finite and all expressions use independent disposable avatars',()=>{
 installDOM();const recipeBefore=JSON.stringify(CAST_RECIPES.Thuan),avatar=buildAvatar(CAST_RECIPES.Thuan),original=buildAvatar(CAST_RECIPES.Thuan);
 const skeletonBefore=original.bones.shoulderR.rotation.toArray();
 for(const pose of POSES){poseStudioActor({avatar,pose,expression:'happy'});avatar.root.updateMatrixWorld(true);avatar.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite),pose));}
 for(const expression of EXPRESSIONS){poseStudioActor({avatar,pose:'Wave',expression});assert.equal(avatar.faceState.expression,expression);assert.equal(avatar.faceState.blink,0);}
 assert.deepEqual(original.bones.shoulderR.rotation.toArray(),skeletonBefore);assert.equal(JSON.stringify(CAST_RECIPES.Thuan),recipeBefore);
 assert.notEqual(original.face.texture,avatar.face.texture);avatar.dispose();original.dispose();
});
