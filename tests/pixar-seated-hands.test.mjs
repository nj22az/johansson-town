import test from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';

installDOM();
const {providePixarBodyInNode,pixarAvatar,skinnedPositions}=await import('./pixar-fixture.mjs');

// Seated, a Pixar body rests its palms on its thighs by the knees (the owner, 29 October 2026, of Johansson on a bench:
// "How about his hands shouldn't they rest on his knees when sitting like that"; animate.js CHAIR_SIT.pixar.rest). Measured
// on the drawn skin: the lowest of the right hand's vertices over the top of the leg beneath it (leg vertices within 2 cm
// across), and how far along the thigh from the hip to the knee the wrist is.
const HAND=['handR',...['index','middle','pinky','ring','thumb'].flatMap(f=>[1,2,3].map(i=>f+'R'+i))];
const LEGS=['thighR','kneeR','thighL','kneeL'];
function seatedHand(name,seat){
 const {a,anim,parts}=pixarAvatar(name),skin=parts.body,g=skin.geometry,I=g.attributes.skinIndex,W=g.attributes.skinWeight;
 const names=skin.skeleton.bones.map(b=>b.name),bone=i=>{let best=0,w=-1;for(const c of ['getX','getY','getZ','getW'])if(W[c](i)>w){w=W[c](i);best=I[c](i);}return names[best];};
 const of=Array.from({length:g.attributes.position.count},(_,i)=>bone(i));
 const legs=[];for(let i=0;i<of.length;i++)if(LEGS.includes(of[i]))legs.push(i);
 // (through a whole breath: the chest rises and falls 0.02 rad, about 4.2 s, and the hand with it)
 for(let k=0;k<240;k++)anim.update(1/60,{seated:true,seatHeight:seat});
 let low=Infinity,high=-Infinity,over=0;
 for(let frame=0;frame<9;frame++){
  for(let k=0;k<30;k++)anim.update(1/60,{seated:true,seatHeight:seat});
  const P=skinnedPositions(a,skin);let gap=Infinity;over=0;
  for(let i=0;i<of.length;i++){if(!HAND.includes(of[i]))continue;let top=-Infinity;
   for(const j of legs)if(Math.hypot(P[j*3]-P[i*3],P[j*3+2]-P[i*3+2])<.02&&P[j*3+1]>top)top=P[j*3+1];
   if(top>-Infinity){over++;gap=Math.min(gap,P[i*3+1]-top);}}
  low=Math.min(low,gap);high=Math.max(high,gap);}
 const at=n=>a.bones[n].getWorldPosition(new a.root.position.constructor());
 const hip=at('thighR'),knee=at('kneeR'),wrist=at('handR'),axis=knee.clone().sub(hip);axis.y=0;
 const along=wrist.clone().sub(hip).setY(0).dot(axis)/axis.lengthSq();
 return {low,high,over,along};
}

test('seated, Johansson rests his palms on his knees, on a bench, a chair and a counter stool',async()=>{
 await providePixarBodyInNode('Johansson');
 for(const seat of [.35,.45,.62]){
  const {low,high,over,along}=seatedHand('Johansson',seat);
  assert.ok(over>200,seat+': the hand lies over the leg ('+over+' vertices)');
  // (on it, not in it: a few millimetres at most; the hand once floated 1.5 cm and more over the lap, sampled as a
  // mitten twice as thick as it is drawn)
  assert.ok(low>-.003&&high<.008,seat+': the palm '+(low*100).toFixed(2)+' to '+(high*100).toFixed(2)+' cm over the thigh');
  assert.ok(along>.6,seat+': by the knee, not the hip ('+along.toFixed(2)+' of the way along the thigh)');
 }
});

test('seated, Thao rests her hands on her knees as far as her arms reach',async()=>{
 await providePixarBodyInNode('Thao');
 for(const seat of [.45,.62]){
  const {low,high,over,along}=seatedHand('Thao',seat);
  assert.ok(over>100,seat+': the hand lies over the leg');
  // (her arm at its full reach there, 1.8 to 2.1 cm over (2.4 to 2.7 before 30 October): nearer the hip, the hand went
  // into the thigh)
  assert.ok(low>-.003&&high<.025,seat+': the palm '+(low*100).toFixed(2)+' to '+(high*100).toFixed(2)+' cm over the thigh');
  assert.ok(along>.6,seat+': by the knee');
 }
});
