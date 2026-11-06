import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar,bodyVolume} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {STORY_PROPS,PAPERBACK,buildPaperback,storyProps} from '../src/avatars/story-props.js';

installDOM();

// Miss Higa's paperback (the creator, about Fujita's Back: "the lady who works at the Onsen should read a book not hold
// whatever that glitchy thing is"): a real book, open in her mitten, its pages up to her eyes, the cover to the room.
const meshes=o=>{const out=[];o.traverse(x=>{if(x.isMesh)out.push(x);});return out;};
const points=(o,frame)=>{o.updateMatrixWorld(true);const inv=frame?new THREE.Matrix4().copy(frame.matrixWorld).invert():null,out=[],v=new THREE.Vector3();
 for(const m of meshes(o)){const P=m.geometry.attributes.position;for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(m.matrixWorld);out.push(inv?v.clone().applyMatrix4(inv):v.clone());}}return out;};

test('the paperback is a whole book: two halves of page block, boards, print, a spine, and a cover with its title and band',()=>{
 const S=STORY_PROPS.paperback;assert.equal(S.who,'Miss Higa');assert.ok(S.why.length>60&&S.where.length>40);
 const g=buildPaperback(),B=PAPERBACK;assert.equal(g.userData.hold,'facing');
 const front=g.getObjectByName('Paperback front half'),back=g.getObjectByName('Paperback back half');assert.ok(front&&back,'two halves');
 for(const half of [front,back]){const box=new THREE.Box3().setFromObject(half);assert.ok(meshes(half).length>=9,half.name+': block, board, face, print');}
 // the front cover carries the title panel, the rule and the 1990s band; the back cover only a blurb panel
 const colours=half=>new Set(meshes(half).map(m=>m.material.color.getHex()));
 for(const c of ['panel','rule','obi','obiStripe'])assert.ok([...colours(front)].some(h=>new THREE.Color(B.colours[c]).getHex()===h||Math.abs(h-B.colours[c])<0x030303),'the front cover has its '+c);
 // the book's size: a bunko at the town's scale, open, with thickness (block and boards)
 g.updateMatrixWorld(true);const all=new THREE.Box3().setFromObject(g),size=all.getSize(new THREE.Vector3());
 assert.ok(size.x>2*B.w*.9&&size.x<2*B.w*1.1,'open across '+size.x.toFixed(3));
 assert.ok(B.block>=.008&&B.board>=.002,'it has thickness');
 // its foot sits in the grip: the lowest point just under the mitten's grip, nothing hanging below it
 assert.ok(all.min.y>-.02&&all.min.y<.03,'the foot of the book at the grip ('+all.min.y.toFixed(3)+')');
 // the reading faces look up and back to the reader (-z): their normals
 const faces=meshes(g).filter(m=>m.geometry.type==='PlaneGeometry'&&m.material.color.getHex()===new THREE.Color(B.colours.face).getHex());
 assert.equal(faces.length,2,'two pages to read');
 for(const f of faces){const n=new THREE.Vector3(0,0,-1).transformDirection(f.matrixWorld);assert.ok(n.y>.5&&n.z<-.3,'the page faces up to the eyes: '+n.toArray().map(x=>x.toFixed(2)));}
});

test('given to her, it is in her right mitten, and held as the film holds it it clears her body and her head: at the counter, reaching back, held up',()=>{
 const avatar=buildAvatar(recipeFor('Miss Higa'),{shadows:false});avatar.wear('clothes');
 const holder=new THREE.Group();holder.add(avatar.root);const animator=createAvatarAnimator(avatar,{lively:false,random:()=>.5});
 const state={seated:true,seatHeight:.4,pose:'SitHold'},m=avatar.measure,step=n=>{for(let i=0;i<n;i++)animator.update(1/60,state);holder.updateMatrixWorld(true);};
 const book=storyProps(avatar).give('paperback');assert.equal(book.parent,avatar.bones.handR,'in her right mitten');
 const vol=bodyVolume(avatar.recipe,m),head=()=>[avatar.bones.head.matrixWorld.clone().invert(),[m.Rh*m.headSX,m.Rh*m.headSY,m.Rh*.98],m.headCentre-m.headY];
 const check=label=>{
  // the film's 'facing' hold: upright in the room, turned to where she faces, 6 cm down the hand from the bone
  const hand=avatar.bones.handR;book.position.set(0,-.06,0);hand.updateMatrixWorld(true);
  book.quaternion.copy(hand.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(holder.getWorldQuaternion(new THREE.Quaternion())));
  const pts=points(book),frames=[['hips',m.hipY],['chest',m.chestY]].map(([b,y])=>[avatar.bones[b].matrixWorld.clone().invert(),y]),[hInv,S,hc]=head();
  let inBody=0,inHead=0;
  for(const p of pts){const d=Math.min(...frames.map(([inv,y])=>{const q=p.clone().applyMatrix4(inv);q.y+=y;return vol.sdf(q);}));if(d<-.002)inBody++;
   const q=p.clone().applyMatrix4(hInv);if(Math.hypot(q.x/S[0],(q.y-hc)/S[1],q.z/S[2])<1)inHead++;}
  assert.equal(inBody,0,label+': the book in her body');assert.equal(inHead,0,label+': the book in her head');
  // in front of her, at reading height: between her hips and her eyes, ahead of her chest
  const c=new THREE.Box3().setFromObject(book).getCenter(new THREE.Vector3()),local=holder.worldToLocal(c.clone());
  assert.ok(local.y>m.hipY*.8&&local.y<m.headCentre+.05,label+': at reading height '+local.y.toFixed(2));
 };
 // the film's three: holding it at the counter (SitHold), reaching back for the lever with it (ReachBack, 6c and 7a), and
 // holding it up to the torch (Reach, 6j)
 step(60);check('at the counter');
 state.pose='ReachBack';step(Math.round(1.4*60));check('reaching back for the lever');
 state.pose='SitHold';step(90);animator.play('Reach');step(60);check('holding it up');
 storyProps(avatar).take('paperback');assert.equal(storyProps(avatar).has('paperback'),false);
 avatar.dispose();
});
