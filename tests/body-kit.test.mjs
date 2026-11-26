import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';

/**
 * The modular body kit (the owner, 26 November 2026): "can you redraw Johansson and Thuan's body's in blender too? And arms
 * and legs? The shoes shouldn't be fused on their feet they should be rigged so you can wear different shoes, these bodies
 * needs to be modular so we can reuse them for all characters". Sculpted in Blender (tools/blender/build-body-kit.py),
 * worn by the generator: one kit, every resident.
 */
installDOM();globalThis.self=globalThis;
const {LIMBS,TORSO,FEET}=await import('../src/avatars/sculpts/body-kit.js');
const {buildAvatar,buildShoeProp,measure,SHOE_SHAPES,SOCK}=await import('../src/avatars/build.js');
const {recipeFor,CAST_RECIPES}=await import('../src/avatars/cast.js');
const file=p=>new URL('../'+p,import.meta.url);
const bytes=text=>Uint8Array.from(atob(text),c=>c.charCodeAt(0));

test('the kit is Blender\'s, and its limbs are never thicker than the taper they replace',()=>{
 for(const f of ['tools/blender/build-body-kit.py','art/characters/body-kit/body-kit.blend','art/characters/body-kit/body-kit-report.json'])assert.ok(existsSync(file(f)),f);
 for(const kind of ['arm','leg'])for(const frame of ['standard','sturdy','graceful']){
  const T=LIMBS[kind][frame];assert.ok(T.length>=20&&T[0].length>=12,kind+' '+frame);
  const flat=T.flat();assert.ok(Math.max(...flat)<=1&&Math.min(...flat)>=.5,`${kind} ${frame}: ${Math.min(...flat)}..${Math.max(...flat)}`);
 }
 // A leg has a knee and an ankle narrower than its thigh and its calf; the calf is fuller behind than the shin in front.
 const L=LIMBS.leg.standard,at=(t,a=0)=>L[Math.round(t*(L.length-1))][Math.round(a/(2*Math.PI)*L[0].length)%L[0].length];
 const side=Math.PI/2;
 assert.ok(at(.5,side)<at(.3,side)-.03&&at(.5)<at(.3)-.03,'a knee, in front and at the sides');assert.ok(at(.97)<at(.66)-.05,'an ankle');
 assert.ok(at(.66,Math.PI)>at(.66,0)+.02,'the calf is behind');
 // What is sat on is the taper's own: the back of the thigh, hip to knee, and the hip's end all round (seat-support.js
 // seats a body on them: a kit that thinned them sat everybody 7 mm into the floor).
 for(const frame of ['standard','sturdy','graceful']){const T=LIMBS.leg[frame],back=Math.round(T[0].length/2);
  for(let r=0;r<=Math.floor((T.length-1)*.45);r++)assert.ok(T[r][back]>=(frame==='graceful'?.96:.985),`${frame}: the back of the thigh at row ${r} is ${T[r][back]}`);
  assert.ok(T[0].every(v=>v===1),frame+': full at the hip');}
 // An arm has an elbow and a wrist; a sturdy one is fuller than a graceful one all the way down.
 const A=LIMBS.arm,arm=(f,t)=>A[f][Math.round(t*(A[f].length-1))][0];
 assert.ok(arm('standard',.5)<arm('standard',.25)&&arm('standard',.98)<arm('standard',.64));
 for(const t of [.25,.5,.64,.9])assert.ok(arm('sturdy',t)>arm('graceful',t),'at '+t);
 assert.ok(TORSO.sturdy.at(-1)[0]===0&&TORSO.graceful.at(-1)[0]===0,'both lines close at the neck');
});

test('feet and shoes are one layout in several shapes, each in the unit box on the floor',()=>{
 const index=new Uint16Array(bytes(FEET.index).buffer);assert.equal(index.length%3,0);assert.ok(Math.max(...index)<FEET.points);
 for(const name of ['foot','sneaker','shoe','boot','slipper']){
  const P=new Float32Array(bytes(FEET.shapes[name]).buffer);assert.equal(P.length,FEET.points*3,name+' has the layout\'s points');
  assert.equal(bytes(FEET.zones[name]).length,FEET.points);
  let lo=[9,9,9],hi=[-9,-9,-9];for(let i=0;i<P.length;i+=3)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],P[i+k]);hi[k]=Math.max(hi[k],P[i+k]);}
  assert.ok(Math.abs(lo[1])<1e-5,name+' stands on the floor');assert.ok(Math.abs(lo[2]+1)<1e-4&&Math.abs(hi[2]-1)<1e-4,name+' heel to toe');
  assert.ok(hi[0]<=1.001&&lo[0]>=-1.001&&hi[1]<=1.001,name+' is in the box');
 }
 assert.deepEqual(Object.values(SHOE_SHAPES).sort(),['boot','shoe','slipper','sneaker']);
});

test('shoes are worn, not fused: changed, taken off and put back on a finished body, in its own points',()=>{
 const a=buildAvatar(recipeFor('Thuan'),{shadows:false,eyes3d:false}),g=a.body.geometry,P=g.attributes.position,C=g.attributes.color;
 assert.equal(a.shoeWorn('L'),'sneaker');assert.equal(a.shoeWorn('R'),'sneaker');
 const count=P.count,before=P.array.slice(),colours=C.array.slice();
 const box=()=>{g.computeBoundingBox();return g.boundingBox.clone();};
 const low=box().min.y;
 assert.equal(a.wearShoes('shoes',{colour:'#5a3a22'}),true);assert.equal(a.shoeWorn('L'),'shoe');
 assert.equal(P.count,count,'the same points');assert.notDeepEqual(Array.from(P.array),Array.from(before),'in another shape');
 assert.ok(Math.abs(box().min.y-low)<.002,'she stands as she stood');
 const brown=new THREE.Color('#5a3a22');let n=0;for(let i=0;i<C.count;i++)if(Math.abs(C.getX(i)-brown.r)<1e-4&&Math.abs(C.getY(i)-brown.g)<1e-4)n++;assert.ok(n>1000,'in its colour');
 // Off: her foot in its sock. On again: the shoe she has on now, not the one she was built in.
 a.setShoe('L',false);const sock=new THREE.Color(SOCK.colour);let socks=0;for(let i=0;i<C.count;i++)if(Math.abs(C.getX(i)-sock.r)<1e-4&&Math.abs(C.getZ(i)-sock.b)<1e-4)socks++;assert.ok(socks>500);
 const off=P.array.slice();a.setShoe('L',true);assert.notDeepEqual(Array.from(P.array),Array.from(off));assert.equal(a.shoeWorn('L'),'shoe');
 // One foot at a time, and back to what she was built in, exactly.
 a.wearShoes('slippers',{side:'R'});assert.equal(a.shoeWorn('R'),'slipper');assert.equal(a.shoeWorn('L'),'shoe');
 a.wearShoes('sneakers');assert.deepEqual(Array.from(P.array),Array.from(before));assert.deepEqual(Array.from(C.array),Array.from(colours));
 assert.equal(a.wearShoes('clogs'),false,'only what the kit has');a.dispose();
 // Somebody in sandals has the kit's bare foot and no shoe to change.
 const j=buildAvatar(recipeFor('Johansson'),{shadows:false,eyes3d:false});assert.equal(j.shoeWorn('L'),null);assert.equal(j.wearShoes('sneakers'),false);j.dispose();
 const prop=buildShoeProp(CAST_RECIPES.Thuan);assert.ok(prop&&prop.geometry.attributes.position.count>1000,'a shoe on its own is the kit\'s too');
});

test('one kit, every resident: each builds, stands on the floor, and wears the frame that is theirs',()=>{
 for(const name of Object.keys(CAST_RECIPES)){
  const a=buildAvatar(recipeFor(name),{shadows:false,eyes3d:false}),P=a.body.geometry.attributes.position;
  for(let i=0;i<P.count;i+=97)assert.ok(Number.isFinite(P.getX(i))&&Number.isFinite(P.getY(i))&&Number.isFinite(P.getZ(i)),name);
  a.dispose();
 }
 assert.equal(measure(recipeFor('Johansson')).sturdy,true);assert.equal(measure(recipeFor('Thuan')).graceful,true);
 // Hers is the feminine one: slimmer limbs, a waist well inside her hips, shoulders narrower than her hips are wide.
 // (The owner, of hips that were a wide straight band: "she still has a barrel for hips she needs to look cute use Disney
 // audit". One soft line, hips to neck: no straight in it, hips a little wider than the shoulders, a small high waist.)
 const G=TORSO.graceful,rAt=y=>{for(let i=1;i<G.length;i++)if(y<=G[i][1]){const [r0,y0]=G[i-1],[r1,y1]=G[i];return r0+(r1-r0)*(y-y0)/(y1-y0);}return 0;};
 const hips=Math.max(...G.filter(([,y])=>y<.3).map(([r])=>r)),waist=Math.min(...G.filter(([,y])=>y>.3&&y<.6).map(([r])=>r)),bust=Math.max(...G.filter(([,y])=>y>.6&&y<.8).map(([r])=>r));
 assert.ok(waist<hips*.7&&waist<bust*.8,'a waist');assert.ok(hips>bust&&hips<bust*1.25,'hips a little wider than the bust, not a barrel');
 for(let i=2;i<G.length;i++)if(G[i][1]>0&&G[i][1]<1){const a=G[i-2],b=G[i-1],c=G[i];assert.ok(!(a[0]===b[0]&&b[0]===c[0]),'no straight band at y '+b[1]);}
 assert.ok(rAt(.9)<.7,'sloping shoulders');
 const t=measure(recipeFor('Thuan')),plain=measure({...recipeFor('Thuan'),body:{...recipeFor('Thuan').body,frame:'standard'}});
 assert.ok(t.depth<plain.depth*.9,'slim from the side');assert.ok(t.leg/t.H>plain.leg/plain.H,'a little longer in the leg');
});
