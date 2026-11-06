import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
installDOM();
import {buildAvatar} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {storyProps,STORY_PROPS,WORK_KIT,HEADLAMP,TESTER,SAFETY_GLASSES,GLOVES} from '../src/avatars/story-props.js';

// Tetsuo's work kit for the open board ("Fujita's Back", page 9): safety glasses over his own, a lit headlamp, rubber
// gloves and a two-pole voltage tester. Part of the town's story props (src/avatars/story-props.js), so the film, the
// stories and the game give the same things.
const tetsuo=()=>{const a=buildAvatar(recipeFor('Tetsuo'));a.root.updateMatrixWorld(true);return a;};
const verts=(root,frame,filter=()=>true)=>{root.updateWorldMatrix(true,true);const inv=new THREE.Matrix4().copy(frame.matrixWorld).invert(),out=[],v=new THREE.Vector3();
 root.traverse(o=>{if(!o.isMesh||!filter(o))return;const P=o.geometry.attributes.position;for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);if(o.isSkinnedMesh)o.applyBoneTransform(i,v);out.push(v.clone().applyMatrix4(o.matrixWorld).applyMatrix4(inv));}});return out;};

test('the kit is data first: who wears each piece, why and where, given together in the order of the job',()=>{
 const K=WORK_KIT.electricianWork;assert.equal(K.who,'Tetsuo');assert.deepEqual([...K.props],['safetyGlasses','headlamp','gloves','voltageTester']);
 assert.match(K.why,/Isolate, lock and tag/);
 for(const k of K.props){const P=STORY_PROPS[k];assert.equal(P.who,'Tetsuo');assert.ok(P.why.length>60&&P.where.length>40,k+' says why and where');}
 assert.match(STORY_PROPS.voltageTester.why,/live, dead, live/);
 assert.ok(HEADLAMP.light.kelvin<=3200,'a bulb of the period, warm, not a white LED');assert.ok(HEADLAMP.light.why.length>40);
 assert.equal(TESTER.colour,0xe8c23a,'the film’s tester yellow');
 assert.ok(!/Math\.random/.test(readFileSync(new URL('../src/avatars/story-props.js',import.meta.url),'utf8')),'nothing random');
});

test('safety glasses sit over his own glasses, clear of the face, the nose and his frames',()=>{
 const a=tetsuo(),g=storyProps(a).give('safetyGlasses'),head=a.bones.head,m=a.measure;
 assert.equal(g.parent,head,'carried by the head');assert.ok(g.userData.lift>=SAFETY_GLASSES.lift&&g.userData.lift<.2,'close to the face: '+g.userData.lift);
 const shield=g.getObjectByName('Safety glasses shield'),own=head.getObjectByName('Glasses frames and temples');assert.ok(shield&&own,'his own half-rims stay on');
 const c=new THREE.Vector3(0,m.headCentre-m.headY,0),S=verts(shield,head),F=verts(own,head);
 // Every point of his frames lies inside the shield's surface where the shield covers it (nearer the head's centre).
 for(const p of F){const d=p.clone().sub(c),len=d.length();d.normalize();
  for(const q of S){const e=q.clone().sub(c);if(e.clone().normalize().dot(d)>.9995)assert.ok(e.length()>len+.002,'his frame comes through the shield at '+p.toArray().map(n=>n.toFixed(3)));}}
 // In front of the eyes: the shield's middle is forward of the face.
 const zs=S.map(p=>p.z);assert.ok(Math.max(...zs)>m.Rh*.9,'in front of the face');
 storyProps(a).dispose();assert.equal(g.parent,null,'taken off with the rest');
});

test('the headlamp: a band clear of the head, the lamp on the forehead, lit with one warm light that a capture can copy',()=>{
 const a=tetsuo(),h=storyProps(a).give('headlamp'),m=a.measure,head=a.bones.head;
 const lamp=h.getObjectByName('Headlamp lamp'),band=h.getObjectByName('Headlamp band'),light=h.userData.headlamp.light;
 assert.ok(lamp.position.z>m.Rh*.8,'on the forehead, facing ahead');assert.ok(lamp.rotation.x>0,'tipped down a little');
 assert.equal(h.userData.headlamp.on,true,'given lit');assert.equal(light.intensity,HEADLAMP.light.intensity);
 let lights=0;h.traverse(o=>{if(o.isLight)lights++;});assert.equal(lights,1,'one light, for phones');
 assert.equal(light.color.getHex(),HEADLAMP.light.colour);assert.ok(Math.abs(light.angle-HEADLAMP.light.angle)<1e-9);
 h.userData.headlamp.setOn(false);assert.equal(light.intensity,0);h.userData.headlamp.setOn(true);
 // The band is outside the head and whatever is on it at its height (a hand's breadth slab).
 const B=verts(band,head),c=new THREE.Vector3(0,m.headCentre-m.headY,0),y=B.reduce((s,p)=>s+p.y,0)/B.length;
 const body=verts(a.root,head,o=>o.isSkinnedMesh&&!o.userData.outline&&!o.name.includes('outline')).filter(p=>Math.abs(p.y-y)<HEADLAMP.band*.5);
 const radiusAt=(list,ang)=>Math.max(0,...list.filter(p=>{const a2=Math.atan2(p.x-c.x,p.z-c.z);return Math.abs(Math.atan2(Math.sin(a2-ang),Math.cos(a2-ang)))<.05;}).map(p=>Math.hypot(p.x-c.x,p.z-c.z)));
 for(let i=0;i<24;i++){const ang=i/24*Math.PI*2,rb=radiusAt(B,ang),rh=radiusAt(body,ang);if(rh>0&&rb>0)assert.ok(rb>=rh,'the band clears the head at '+(ang*180/Math.PI).toFixed(0)+'°: '+rb.toFixed(3)+' < '+rh.toFixed(3));}
 // Where it shines from and to, in the world: the numbers for capture-room's torch.
 const aim=h.userData.headlamp.aim(.8);assert.equal(aim.from.length,3);assert.ok(aim.at[1]<aim.from[1],'tipped down');assert.ok(Math.abs(aim.angle_deg-HEADLAMP.light.angle*180/Math.PI)<1e-9);
 storyProps(a).dispose();
});

test('the gloves cover the mittens and the ends of the sleeves, and go wherever the hands go',()=>{
 const a=tetsuo(),gl=storyProps(a).give('gloves'),[L,R]=gl.userData.parts,m=a.measure;
 assert.equal(L.parent,a.bones.handL);assert.equal(R.parent,a.bones.handR);
 for(const [side,glove] of [['L',L],['R',R]]){
  const palm=glove.getObjectByName('Rubber glove palm'),thumb=glove.getObjectByName('Rubber glove thumb'),hand=a.bones['hand'+side];
  // the mitten's own surface (build.js: radius hand, scaled .9 1.15 .78, centred hand*.55 below the bone) inside the palm's
  for(const [x,y,z] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){
   const p=new THREE.Vector3(x*m.hand*.9,y*m.hand*1.15-m.hand*.55,z*m.hand*.78),q=p.clone().sub(palm.position).divide(palm.scale);
   assert.ok(q.length()<palm.geometry.parameters.radius,side+': the mitten is inside the glove');}
  assert.ok(thumb.geometry.parameters.radius>m.hand*.42,side+': a thumb bigger than the mitten’s');
  const cuff=glove.getObjectByName('Rubber glove gauntlet');assert.ok(cuff.geometry.parameters.radiusBottom>m.armR*.86+GLOVES.clear*.5,'the gauntlet goes over the wrist');void hand;}
 // An animated hand carries its glove: wave and look.
 const anim=createAvatarAnimator(a,{lively:false,random:()=>.5});anim.play('Wave');for(let i=0;i<20;i++)anim.update(1/30,{speed:0});
 a.root.updateMatrixWorld(true);const hp=a.bones.handR.getWorldPosition(new THREE.Vector3()),gp=R.getWorldPosition(new THREE.Vector3());assert.ok(hp.distanceTo(gp)<1e-6);
 storyProps(a).take('gloves');assert.equal(L.parent,null);assert.equal(R.parent,null,'both come off');
});

test('the two-pole tester: in his right fist pointing ahead, the window up; lamps for the voltage; the second probe to his left hand and back',()=>{
 const a=tetsuo(),sp=storyProps(a),t=sp.give('voltageTester'),T=t.userData.tester;
 assert.equal(t.parent,a.bones.handR);assert.equal(t.userData.hold,'facing','upright like the film’s held props when the film holds it');
 // the probe tip ahead of the fist (+z in the hand's frame), clear of the glove's palm
 const tip=new THREE.Vector3(0,TESTER.length,0).applyMatrix4(new THREE.Matrix4().compose(t.position,t.quaternion,t.scale));
 assert.ok(tip.z>a.measure.hand*GLOVES.over*.78+.04,'the probe stands out ahead of the fist: '+tip.z.toFixed(3));
 const lamps=TESTER.scale.map(v=>t.getObjectByName('Voltage tester lamp '+v).material);
 assert.ok(lamps.every(l=>l.emissiveIntensity===0),'dead: every lamp dark');
 T.setReading(100);assert.deepEqual(lamps.map(l=>l.emissiveIntensity>0),[true,true,true,true,false,false],'100 V: four lamps');
 T.setReading(0);assert.ok(lamps.every(l=>l.emissiveIntensity===0));
 sp.testerSplit(true);assert.equal(T.second.parent,a.bones.handL,'the second probe in his left fist');
 a.root.updateMatrixWorld(true);T.update();const lead=t.getObjectByName('Voltage tester lead');lead.geometry.computeBoundingBox();
 const span=lead.geometry.boundingBox.getSize(new THREE.Vector3()).length();assert.ok(span>.2,'the lead runs from hand to hand: '+span.toFixed(2));
 sp.testerSplit(false);assert.equal(T.second.parent,t,'parked again');
 sp.take('voltageTester');assert.equal(t.parent,null);
});

test('the whole kit at once, light enough for phones',()=>{
 const a=tetsuo(),props=storyProps(a).giveKit('electricianWork');assert.equal(props.length,4);
 let tris=0;for(const p of props)for(const o of [p,...(p.userData.parts||[])])o.traverse(x=>{if(x.isMesh)tris+=(x.geometry.index?x.geometry.index.count:x.geometry.attributes.position.count)/3;});
 assert.ok(tris<8000,'the kit is '+tris+' triangles');
 assert.throws(()=>storyProps(a).giveKit('nothing'),/No kit/);
 storyProps(a).dispose();
});
