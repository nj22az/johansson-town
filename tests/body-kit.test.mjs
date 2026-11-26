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
const {LIMBS,TORSO,FEET,NOSES,HANDS}=await import('../src/avatars/sculpts/body-kit.js');
const {buildAvatar,buildShoeProp,measure,SHOE_SHAPES,SOCK,NOSE_SHAPES,HAND,handShape}=await import('../src/avatars/build.js');
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

test('nobody has a ball for a nose: every nose style wears a nose from the kit, each its own shape, grown out of the face',()=>{
 // (The owner, 26 November 2026, of the whole cast: "Can you do all of them in a sweep but keep their personalities".)
 const shapes=Object.fromEntries(Object.entries(NOSES.shapes).map(([k,t])=>[k,new Float32Array(bytes(t).buffer)]));
 for(const [style,shape] of Object.entries(NOSE_SHAPES)){
  const H=shapes[shape];assert.ok(H,style);assert.equal(H.length,NOSES.cols*NOSES.rows);assert.equal(NOSES.size[shape].length,3);
  let max=0;for(const v of H){assert.ok(v>=0&&v<=1);max=Math.max(max,v);}assert.ok(Math.abs(max-1)<1e-6,'its tip is its height');
  for(let c=0;c<NOSES.cols;c++)assert.ok(H[c]===0&&H[(NOSES.rows-1)*NOSES.cols+c]===0,'nothing at its edge');
  for(let r=0;r<NOSES.rows;r++)assert.ok(H[r*NOSES.cols]===0&&H[r*NOSES.cols+NOSES.cols-1]===0);
 }
 const tipRow=H=>{let best=0,row=0;for(let r=0;r<NOSES.rows;r++){const v=H[r*NOSES.cols+(NOSES.cols>>1)];if(v>best){best=v;row=r;}}return row;};
 assert.ok(tipRow(shapes.hook)>tipRow(shapes.snub),'a hooked nose points down, a snub one is turned up');
 assert.ok(NOSES.size.hook[1]>NOSES.size.button[1]*1.5&&NOSES.size.wide[0]>NOSES.size.button[0]*1.3,'long, and broad');
 // On a body: the nose is skin on the head bone, in front of the face, and the build has no sphere where the ball was.
 for(const name of ['Thao','Mrs Sato','Chin','Officer Mori','Vy']){
  const r=recipeFor(name),a=buildAvatar(r,{shadows:false,eyes3d:false}),m=a.measure,P=a.body.geometry.attributes.position;
  let front=-9;for(let i=0;i<P.count;i++)if(Math.abs(P.getX(i))<m.Rh*.2&&Math.abs(P.getY(i)-(m.headCentre-m.Rh*.2))<m.Rh*.25)front=Math.max(front,P.getZ(i));   // (under a cap's peak)
  assert.ok(front>m.Rh*.9&&front<m.Rh*1.5,`${name}: a nose stands ${(front/m.Rh).toFixed(2)} head radii forward`);a.dispose();
 }
});

test('a bare leg has no line down it: the sculpted limb\'s seam is one surface, its two columns sharing their normals',()=>{
 // The owner, 26 November 2026, of Vy in her own look on his phone: "Why does Vy have lines on her legs no one should
 // have it in any shader". The looks that draw from the normals (Vy's drawing, the pencil crayon, the sketchbook) drew
 // the lathe's seam, which the kit's limb had joined on the wrong points.
 const r=recipeFor('Vy'),m=measure(r),a=buildAvatar(r,{shadows:false,eyes3d:false}),P=a.body.geometry.attributes.position,N=a.body.geometry.attributes.normal,seen=new Map();
 let pairs=0;
 for(let i=0;i<P.count;i++){
  const y=P.getY(i);if(y<m.hipY*.25||y>m.hipY*.8)continue;                                  // her legs, shoe to skirt
  const k=[P.getX(i),y,P.getZ(i)].map(v=>Math.round(v*1e5)).join(',');
  if(!seen.has(k)){seen.set(k,i);continue;}
  const j=seen.get(k),d=N.getX(i)*N.getX(j)+N.getY(i)*N.getY(j)+N.getZ(i)*N.getZ(j);pairs++;
  assert.ok(d>.999,`a crease at ${k}: the two normals agree to ${d.toFixed(3)}`);
 }
 assert.ok(pairs>20,'the seam was looked at');a.dispose();
});

test('the hand is a hand: four fingers and a thumb in one closed skin, within its points, worn on both wrists',()=>{
 // (The owner, 26 November 2026: "Omg they have mitten hands"; of a palm of spheres with spheres for fingers, "Draw the hand
 // properly not like a balloon with sausages on it"; of a lumpy anatomical one, "The hands look awful, make them Disney
 // quality". tools/blender/hand_model.py: box-modelled and smoothed in Blender.)
 const index=new Uint32Array(bytes(HANDS.index).buffer),rest=new Float32Array(bytes(HANDS.hand).buffer),grip=new Float32Array(bytes(HANDS.grip).buffer),n=HANDS.points;
 assert.ok(n<=2210,`${n} points a hand (a phone draws two on every resident)`);assert.equal(rest.length,n*3);assert.equal(grip.length,n*3,'the grip is the same points');
 assert.equal(index.length%3,0);assert.ok(Math.max(...index)<n);
 // one closed skin: every edge between exactly two triangles, all of it one piece, and no hole through it (V - E + F = 2)
 const edges=new Map(),key=(a,b)=>a<b?a*n+b:b*n+a;
 for(let i=0;i<index.length;i+=3)for(let j=0;j<3;j++){const k=key(index[i+j],index[i+(j+1)%3]);edges.set(k,(edges.get(k)||0)+1);}
 assert.ok([...edges.values()].every(c=>c===2),'closed: no open edge, no fin');
 assert.equal(n-edges.size+index.length/3,2,'one skin with no hole through it');
 const near=new Map();for(const k of edges.keys()){const a=Math.floor(k/n),b=k%n;(near.get(a)||near.set(a,[]).get(a)).push(b);(near.get(b)||near.set(b,[]).get(b)).push(a);}
 const parts=keep=>{const seen=new Set(),out=[];for(let i=0;i<n;i++){if(!keep(i)||seen.has(i))continue;const part=[i];seen.add(i);for(let q=0;q<part.length;q++)for(const j of near.get(part[q]))if(keep(j)&&!seen.has(j)){seen.add(j);part.push(j);}out.push(part);}return out;};
 assert.equal(parts(()=>true).length,1,'one piece');
 // four fingers below the knuckles, each to its own tip, the middle one longest; a thumb out of the palm's side
 const y=i=>rest[i*3+1],z=i=>rest[i*3+2],fingers=parts(i=>y(i)<HANDS.knuckles-.25).filter(p=>p.length>20);
 assert.equal(fingers.length,4,'four fingers');
 const tips=fingers.map(p=>Math.min(...p.map(y))),across=fingers.map(p=>p.reduce((s,i)=>s+z(i),0)/p.length);
 const order=across.map((v,i)=>i).sort((a,b)=>across[b]-across[a]);   // forefinger (on the thumb's side) to little finger
 assert.equal(Math.min(...tips),tips[order[1]],'the middle finger is the longest');assert.ok(tips[order[3]]>tips[order[2]],'the little finger is the shortest of the others');
 const width=Math.max(...fingers.flat().map(i=>Math.abs(z(i)))),thumb=parts(i=>z(i)>width+.08);
 assert.equal(thumb.length,1,'a thumb');assert.ok(thumb[0].length>40&&Math.max(...thumb[0].map(z))>width+.3,'standing out from the palm');
 // the contact shape the poses are made to is measured from it: the envelope is points of the hand, the palm's side
 // within its thickness, the middle on the palm between the wrist and the knuckles
 const pts=[];for(let i=0;i<n;i++)pts.push([rest[i*3]*.9,.08+(rest[i*3+1]-1)*.9,rest[i*3+2]*.9]);
 for(const q of HAND.touch)assert.ok(pts.some(p=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2])<1e-3),'an envelope point is on the hand: '+q);
 assert.ok(HAND.lie<=HAND.half[0]+1e-6&&HAND.lie>.2,'the palm lies a hand\'s thickness off what it rests on: '+HAND.lie);
 assert.ok(HAND.middle[1]<0&&HAND.middle[1]>HAND.knuckles,'the middle is the palm\'s');assert.ok(HAND.fist.lie>HAND.lie,'a fist stands on its curled fingers');
 assert.equal(handShape({realHand:true}).half[0],.9,'a Pixar body keeps the mitten its poses were made to');
 // worn: on both wrists, the right the left's mirror, hanging from the hand bone down the forearm's line, the palm to the
 // body and the thumb forward; and it closes and opens again in its own points
 const a=buildAvatar(recipeFor('Thao'),{shadows:false,eyes3d:false}),m=a.measure,g=a.body.geometry,P=g.attributes.position,I=g.attributes.skinIndex,W=g.attributes.skinWeight;
 const bones=a.body.skeleton.bones,side={L:[],R:[]};
 for(let i=0;i<P.count;i++){const b=bones[I.getX(i)].name;if(b==='handL'||b==='handR'){assert.equal(W.getX(i),1);side[b.at(-1)].push(i);}}
 assert.equal(side.L.length,index.length,'the left hand, every triangle');assert.equal(side.R.length,index.length,'the right hand');
 const at=a.bones.handL.getWorldPosition(new THREE.Vector3());a.root.updateMatrixWorld(true);
 const box=list=>{const b=new THREE.Box3();for(const i of list)b.expandByPoint(new THREE.Vector3(P.getX(i),P.getY(i),P.getZ(i)));return b;},L=box(side.L),R=box(side.R);
 const hd=[m.shoulderX+.015,m.shoulderY-m.upper-m.fore];
 assert.ok(Math.abs(L.max.y-(hd[1]+m.hand*HAND.top))<1e-3&&Math.abs(L.min.y-(hd[1]+m.hand*HAND.tip))<1e-3,'from the wrist to the fingertips');
 assert.ok(Math.abs((L.min.x+L.max.x)/2-hd[0])<m.hand*.1,'on the forearm\'s line');assert.ok(Math.abs(L.min.x+R.max.x)<1e-5&&Math.abs(L.max.x+R.min.x)<1e-5,'the right the left\'s mirror');
 assert.ok(L.max.z>m.hand*.9,'the thumb forward');
 const before=P.array.slice(side.L[0]*3,(side.L.at(-1)+1)*3);a.grip('L',1);const closed=P.array.slice(side.L[0]*3,(side.L.at(-1)+1)*3);
 assert.notDeepEqual(Array.from(closed),Array.from(before),'it closes');assert.equal(a.gripOf('L'),1);assert.equal(P.count,g.attributes.position.count);
 a.grip('L',0);assert.deepEqual(Array.from(P.array.slice(side.L[0]*3,(side.L.at(-1)+1)*3)),Array.from(before),'and opens again as it was');
 a.dispose();
});
