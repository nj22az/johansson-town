import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {createAvatarAnimator,GESTURES} from '../src/avatars/animate.js';
import {MOVES} from '../src/avatars/moves.js';
import {seatContactHeight} from './seating-contact.mjs';
import {catalogCard,placeAsset} from '../src/catalog/catalog.js';
import {provideCatalog} from './catalog-fixture.mjs';
installDOM();
await provideCatalog('massage-chair');

/**
 * The moves Fujita's Ten Minutes of Heaven needs (the shot plan's batch C2), each on the person and in the clothes the story
 * gives it: they exist, play, hold and let go smoothly and the same every time; the feet, the seat or the floor carry the
 * body; the mittens are where the film's props are gripped; and the arms keep out of the body, the clothes and the head as
 * far as the town's own moves already do.
 */
const FPS=60,dt=1/FPS;
const STORY=['CupHands','CoinToCheek','BowDeep','BowWalk','KneelHug','PoleFlick','Peek','BannerUp','FanWild','HoldOn','FingerStop',
 'Tape','Offer','Reach','LieKnead','GrenadeCoin','Aim','HoldUp','HoldUpStraws','Call','WriteAbove'];
/** Umi-no-yu's rock bath, as the film sits a bather in it (remotion Film.tsx ROCK_BATH): the seat, and the water 0.5 m above it. */
const ROCK_BATH={seat:-.42,water:.08};
const F={who:'Mr Fujita',outfit:'afterbath'},STOOL={seated:true,seatHeight:.4},CHAIR={seated:true,seatHeight:.5},SOAK={seated:true,seatHeight:ROCK_BATH.seat,seat:'Soak'};
/** Every place the story uses each move: who, in what, doing what (state as the film passes it). */
const CASES=[
 ['CupHands',F],['CupHands',{...F,state:{speed:1.1},walking:true}],['CoinToCheek',F],['BowDeep',{...F,hold:2.4}],
 ['BowWalk',{who:'Thuan',outfit:'afterbath',state:{speed:.7},walking:true}],['BowWalk',{who:'Nhung',outfit:'afterbath'}],
 ['KneelHug',{...F,seconds:4}],['PoleFlick',{who:'Miss Higa',outfit:'clothes',state:{...STOOL,pose:'SitHold'},hold:3}],
 ['Peek',{who:'Thuan',outfit:'towel'}],['Peek',{who:'Thao',outfit:'towel'}],['Peek',F],
 ['BannerUp',F],['BannerUp',{...F,state:{speed:1.2},walking:true}],['FanWild',F],['HoldOn',{...F,tenugui:'flag'}],
 ['FingerStop',{who:'Miss Higa',outfit:'clothes'}],['FingerStop',{who:'Miss Higa',outfit:'clothes',state:STOOL}],
 ['Tape',F],['Tape',{who:'Thuan',outfit:'towel'}],['Offer',{who:'Nhung',outfit:'towel'}],['Offer',{who:'Miss Higa',outfit:'clothes',state:STOOL}],
 ['Offer',{who:'Nhung',outfit:'swim',state:SOAK}],['Reach',{who:'Thuan',outfit:'towel'}],['Reach',F],
 ['LieKnead',{...F,state:{lying:true}}],['GrenadeCoin',{...F,state:CHAIR}],
 ['Aim',{who:'Thuan',outfit:'towel'}],['Aim',{who:'Nhung',outfit:'towel'}],['Aim',{who:'Thao',outfit:'towel'}],
 ['HoldUp',{who:'Tetsuo',outfit:'clothes'}],['HoldUpStraws',{who:'Tetsuo',outfit:'clothes'}],
 ['Call',{who:'Miss Higa',outfit:'clothes',state:STOOL}],['WriteAbove',{who:'Miss Higa',outfit:'swim',state:SOAK}],
];
const label=(name,c)=>`${name} (${c.who}, ${c.outfit}${c.state?.seated?', seated':''}${c.walking?', walking':''}${c.state?.lying?', lying':''})`;

/** Math.random fixed for the animator's own little randomness (its clock, its blinks), as the film fixes it. */
function seededRandom(seed=7){let s=seed;return ()=>{s=(s*16807)%2147483647;return s/2147483647;};}
function withRandom(rand,fn){const orig=Math.random;Math.random=rand;try{return fn();}finally{Math.random=orig;}}
/** A body in its clothes on a holder, and an animator, the way the film builds them. */
function cast(c){
 const avatar=buildAvatar(recipeFor(c.who),{shadows:false});avatar.wear(c.outfit);if(c.tenugui)avatar.setTenugui(c.tenugui,Math.PI);
 const holder=new THREE.Group();holder.add(avatar.root);const rand=seededRandom();
 const animator=withRandom(rand,()=>createAvatarAnimator(avatar,{random:rand}));
 const looks=[];const paint=avatar.paintFace.bind(avatar);avatar.paintFace=s=>{looks.push(s.look);return paint(s);};
 const step=(n=1)=>{for(let i=0;i<n;i++){withRandom(rand,()=>animator.update(dt,c.state||{}));avatar.springs?.update(dt);}holder.updateMatrixWorld(true);};
 return {avatar,holder,animator,step,looks,m:avatar.measure};
}
/** Played as the film plays them: for a time (held moves), or stretched with `hold` (in and out at their own pace). */
const play=(b,name,c)=>c.hold?b.animator.play(name,c.hold,true):b.animator.play(name,c.seconds??(GESTURES[name]===Infinity?3:undefined));
const JOINTS=['hips','spine','chest','neck','head','shoulderL','elbowL','handL','shoulderR','elbowR','handR','thighL','kneeL','footL','thighR','kneeR','footR'];
const rotations=a=>JOINTS.flatMap(j=>a.bones[j].rotation.toArray().slice(0,3));
/** The body frame: x to their left, y up, z ahead, the feet's level at 0 (the avatar's own space). */
const local=(b,v)=>v.clone().applyMatrix4(b.avatar.root.matrixWorld.clone().invert());
const world=(b,bone,p=[0,0,0])=>b.avatar.bones[bone].localToWorld(new THREE.Vector3(...p));
/** Where the film grips a prop: on the hand bone, 6 cm into the mitten (FilmCast.tsx). */
const grip=(b,side)=>local(b,world(b,'hand'+side,[0,-.06,0]));
const mitten=(b,side)=>local(b,world(b,'hand'+side,[0,-b.m.hand*.55,0]));
/** The head as the tests see it: an ellipsoid on the head bone. Its centre, its radii and how far out a point is (1 = on it). */
function head(b){
 const m=b.m,S=[m.Rh*m.headSX,m.Rh*m.headSY,m.Rh*.98],hc=m.headCentre-m.headY,inv=b.avatar.bones.head.matrixWorld.clone().invert();
 const r=p=>{const q=p.clone().applyMatrix4(inv);return Math.hypot(q.x/S[0],(q.y-hc)/S[1],q.z/S[2]);};
 return {centre:local(b,world(b,'head',[0,hc,0])),S,r,face:local(b,world(b,'head',[0,hc,1])).sub(local(b,world(b,'head',[0,hc,0])))};
}
/** The lowest point of everything drawn, and of what is skinned to some bones, in the world. */
function lowest(b,bones=null){
 let low=Infinity;const p=new THREE.Vector3();
 for(const mesh of b.avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'))){
  const P=mesh.geometry.attributes.position,I=mesh.geometry.attributes.skinIndex,W=mesh.geometry.attributes.skinWeight;
  for(let i=0;i<P.count;i+=2){if(bones&&!(W.getX(i)>.5&&bones.includes(mesh.skeleton.bones[I.getX(i)]?.name)))continue;mesh.getVertexPosition(i,p);mesh.localToWorld(p);low=Math.min(low,p.y);}
 }
 if(!bones||bones.includes('head')){const h=b.avatar.face.head,P=h.geometry.attributes.position;for(let i=0;i<P.count;i+=3){p.fromBufferAttribute(P,i);h.localToWorld(p);low=Math.min(low,p.y);}}
 return low;
}

test('the story’s moves are on the body’s list: held until the next move, or one movement that ends in a hold',()=>{
 for(const name of STORY)assert.ok(name in GESTURES,name);
 assert.equal(GESTURES.BowDeep,1.8,'down in 0.6 s, held 0.6 s, up in 0.6 s');assert.equal(GESTURES.PoleFlick,2.4);
 for(const name of STORY.filter(n=>n!=='BowDeep'&&n!=='PoleFlick'))assert.equal(GESTURES[name],Infinity,name);
 // They are the film's and the storyteller's; the moves menu is as it was.
 for(const name of STORY)assert.ok(!MOVES.some(([n])=>n===name),name);
});

test('every move plays, holds and lets go: smoothly, nothing lost, and the same every time',()=>{
 for(const [name,c] of CASES){
  const run=()=>{
   const b=cast(c),control=cast(c);b.step(30);control.step(30);
   assert.ok(play(b,name,c),label(name,c)+' plays');
   const frames=[];let prev=rotations(b.avatar),prevRoot=b.avatar.root.position.clone(),fastest=0,jump=0;
   const length=c.hold??c.seconds??3,total=Math.round((length+1.6)*FPS);
   for(let f=0;f<total;f++){
    b.step();control.step();const now=rotations(b.avatar);
    assert.ok(now.every(Number.isFinite),label(name,c)+': a joint is not a number at frame '+f);
    assert.ok(b.avatar.bones.handR.matrixWorld.elements.every(Number.isFinite)&&b.avatar.bones.footL.matrixWorld.elements.every(Number.isFinite));
    // No snapping: no joint turns more than 0.15 rad in a frame (9 rad/s), and the body does not jump.
    fastest=Math.max(fastest,...now.map((v,i)=>Math.abs(v-prev[i])));jump=Math.max(jump,b.avatar.root.position.distanceTo(prevRoot));
    prev=now;prevRoot=b.avatar.root.position.clone();frames.push(now);
    // Held for its time (an endless one while it is not stopped).
    if(f===Math.round((length-.2)*FPS))assert.equal(b.animator.gesture,name,label(name,c)+' is held');
   }
   assert.ok(fastest<.15,`${label(name,c)}: a joint turns ${fastest.toFixed(3)} rad in one frame`);
   assert.ok(jump<.03,`${label(name,c)}: the body jumps ${jump.toFixed(3)} m in one frame`);
   // Let go: when its time is up the body is where it would have been without it.
   assert.equal(b.animator.gesture,null,label(name,c)+' ends');
   const back=rotations(b.avatar),without=rotations(control.avatar),off=Math.max(...back.map((v,i)=>Math.abs(v-without[i])));
   if(!c.walking)assert.ok(off<.03,`${label(name,c)}: ${off.toFixed(3)} rad from where it would be without the move`);
   b.avatar.dispose();control.avatar.dispose();return frames;
  };
  const once=run(),again=run();
  assert.deepEqual(again,once,label(name,c)+' is the same every time');
 }
});

/** The soles: the vertices that only the feet carry (the floor test's). */
function soles(b){
 const body=b.avatar.root.children.find(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'));
 const {position,skinIndex,skinWeight}=body.geometry.attributes,feet=['footL','footR'].map(n=>body.skeleton.bones.indexOf(b.avatar.bones[n])),indices=[];
 for(let i=0;i<position.count;i++)if(feet.includes(skinIndex.getX(i))&&skinWeight.getX(i)>.999)indices.push(i);
 const p=new THREE.Vector3();
 return ()=>{let low=Infinity;for(const i of indices){body.getVertexPosition(i,p);body.localToWorld(p);low=Math.min(low,p.y);}return low;};
}

test('standing, a foot is always on the floor and nothing goes through it; seated, the seat carries them',()=>{
 for(const [name,c] of CASES){
  if(name==='KneelHug'||c.state?.lying)continue;
  const b=cast(c),still=cast(c);b.step(20);still.step(20);play(b,name,c);const sole=soles(b);
  for(let f=0;f<150;f++){
   b.step();still.step();if(f%10)continue;
   // Seated, the body sits on the seat exactly as it does without the move (the town's seating puts it there).
   if(c.state?.seated){assert.ok(Math.abs(b.avatar.root.position.y-still.avatar.root.position.y)<1e-4,`${label(name,c)} moves on the seat at ${f}`);
    if(name==='GrenadeCoin'&&f>=60)assert.ok(Math.abs(seatContactHeight(b.avatar)-c.state.seatHeight)<1e-4,`${label(name,c)} leaves the chair's seat`);continue;}
   assert.ok(Math.abs(sole()-0)<1e-5,`${label(name,c)} loses its supporting foot at ${f}: ${sole()}`);
   assert.ok(lowest(b)>-.004,`${label(name,c)}: something goes below the floor at ${f}`);
  }
  b.avatar.dispose();still.avatar.dispose();
 }
});

/**
 * The massage chair as KneelHug meets it, in the chair's own frame (+z its front, y up, the floor 0): from its card (the
 * seat's height and front edge) and its model, measured piece by piece from its meshes: the seat cushion; the back in
 * four (the padded middle, whose face is the cushions', each side with its shoulder wing, and the headrest pillow on
 * top, each its own depth); and the leg rest in two (the foot box on the floor and the calf massager over it). So the move
 * is checked against the chair that stands in the room.
 */
function chairFrame(){
 const card=catalogCard('massage-chair'),seat=card.seats[0],front=seat.position[2]+seat.front,chair=placeAsset('massage-chair');
 chair.object.updateMatrixWorld(true);const part=name=>new THREE.Box3().setFromObject(chair.part(name));
 const cushion=part('Massage chair seat'),back=part('Massage chair back'),mesh=name=>{let m=null;chair.object.traverse(o=>{if(o.isMesh&&o.name===name)m=o;});return m;};
 const zones=(m,sort)=>{const P=m.geometry.attributes.position,v=new THREE.Vector3(),out={};for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);const k=sort(v);if(k)(out[k]??=new THREE.Box3()).expandByPoint(v);}return out;};
 const {foot,calf}=zones(mesh('Coin massage chair'),v=>Math.abs(v.x)>.3?null:v.y<.24&&v.z>.15?'foot':v.y>=.24&&v.y<.45&&v.z>.2?'calf':null);
 const {middle,left,right,pillow}=zones(mesh('Massage chair back'),v=>v.y>=.975?'pillow':v.x<=-.24?'left':v.x>=.24?'right':'middle');
 chair.dispose();
 return {front,
  // the seat, and everything under it down to the floor, from its front edge to the back
  seat:new THREE.Box3(new THREE.Vector3(cushion.min.x,0,back.max.z),new THREE.Vector3(cushion.max.x,seat.surfaceY,front)),
  back:[middle,left,right,pillow],foot,calf,
  // the arms, either side of the seat: the pads' tops at 0.71 (the card's right-arm-top), from the back to the front edge
  arms:[-1,1].map(s=>new THREE.Box3(new THREE.Vector3(s<0?-.45:.36,0,back.min.z),new THREE.Vector3(s<0?-.36:.45,card.anchors['right-arm-top'][1],front)))};
}

test('KneelHug kneels on the knees and the tucked toes, its cheek on the massage chair’s seat, and gets up at its own pace',()=>{
 // Fujita in the lobby clothes: the knees and the toes on the floor, nothing under it.
 const b=cast({...F}),m=b.m;b.step(20);b.animator.play('KneelHug',4);b.step(60);
 const half=b.avatar.root.position.y;b.step(60);
 assert.ok(lowest(b)>-.002,'nothing below the floor: '+lowest(b));
 assert.ok(lowest(b,['kneeL','kneeR'])<.01,'the knees are on the floor: '+lowest(b,['kneeL','kneeR']));
 assert.ok(lowest(b,['footL','footR'])<.005,'the toes are on the floor: '+lowest(b,['footL','footR']));
 assert.ok(b.avatar.root.position.y<half+1e-6,'it goes down, it does not pop');
 // The chair (Umi-no-yu's coin massage chair, World's catalogue: its card and its model), facing him, its seat's front edge
 // 0.38 m before his mark: the seat (0.5 m high, 0.44 deep, and everything under it), the back (to 1.14 m, its cushions'
 // face 0.43 m behind the front edge, the headrest pillow 2 cm proud of them) and the leg rest in front (the card's
 // collider). Nothing of him goes in any of it, the head rests on the seat (its lowest point within a centimetre above it),
 // and the right forearm lies along it. Measured in the chair's own frame (its front +z) and turned to face him: his z
 // ahead is f + (front edge - the chair's z), his left the chair's -x.
 const f=.38,p=new THREE.Vector3(),C=chairFrame(),toChair=q=>new THREE.Vector3(-q.x,q.y,C.front-(q.z-f));
 assert.ok(C.foot.max.y>.2&&C.foot.max.y<.25&&C.calf.min.y>.23&&C.calf.max.y<.45,'the leg rest’s two pieces: '+[C.foot.max.y,C.calf.min.y,C.calf.max.y].map(v=>v.toFixed(3)));
 const [mid,wingL,wingR,pil]=C.back;
 assert.ok(mid.max.z<wingL.max.z&&Math.abs(wingL.max.z-wingR.max.z)<1e-6&&wingL.max.z<pil.max.z&&pil.max.y>1.13&&wingL.max.x<-.24&&wingR.min.x>.24,'the back: the middle, the wings a little proud either side, the pillow most');
 const inSeat=q=>{const a=toChair(q);return C.seat.containsPoint(a);},inBack=q=>{const a=toChair(q);return C.back.some(b=>b.containsPoint(a))||C.foot.containsPoint(a)||C.calf.containsPoint(a);};
 const at=q=>{const l=local(b,q);return new THREE.Vector3(l.x,q.y,l.z);};
 let headLow=Infinity,forearm=Infinity;
 for(const mesh of b.avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'))){
  const P=mesh.geometry.attributes.position,I=mesh.geometry.attributes.skinIndex;
  for(let i=0;i<P.count;i+=2){mesh.getVertexPosition(i,p);mesh.localToWorld(p);const q=at(p),bone=mesh.skeleton.bones[I.getX(i)]?.name;
   assert.ok(!inSeat(q)&&!inBack(q),'into the chair: '+bone+' '+q.toArray().map(v=>v.toFixed(3)));
   if(bone==='head')headLow=Math.min(headLow,q.y);if((bone==='elbowR'||bone==='handR')&&q.z>f)forearm=Math.min(forearm,q.y);}
 }
 assert.ok(headLow>.5&&headLow<.51,'the cheek rests on the seat: '+headLow);
 assert.ok(forearm>.5&&forearm<.51,'the right forearm lies on the seat: '+forearm);
 const H=head(b);assert.ok(H.face.normalize().x>.9,'the face is turned to his left (to the lens of 3a)');
 // Gets up over 0.8 s at the end of its time, and then stands as before.
 b.step(Math.round(2.1*FPS));assert.equal(b.animator.gesture,null);
 assert.ok(Math.abs(soles(b)()-0)<1e-5,'standing again');
 b.avatar.dispose();
 // Anyone in the town's barefoot clothes kneels the same way without going through the floor.
 for(const who of ['Thuan','Nhung','Thao','Tetsuo','Miss Higa'])for(const outfit of ['afterbath','towel','swim','clothes']){
  const k=cast({who,outfit});k.step(10);k.animator.play('KneelHug');k.step(90);
  assert.ok(lowest(k)>-.002,`${who} in ${outfit} kneels through the floor: ${lowest(k)}`);k.avatar.dispose();
 }
});

// Fujita's right hand and elbow go 4 cm into the chair's left arm (the sitter's left, the remote's side) as he hugs the seat:
// a characters batch (the hug a little narrower), not the chair's (briefs/NEXT.md §5).
test.todo('KneelHug keeps its arms out of the massage chair’s arms');

test('LieKnead lies on the back and kneads the air: the head, the back and the feet on the floor',()=>{
 const b=cast({...F,state:{lying:true}});b.step(20);b.animator.play('LieKnead');b.step(90);
 assert.ok(lowest(b)>-.002,'nothing below the floor: '+lowest(b));
 for(const [part,bones] of [['the head',['head']],['the back',['hips','spine','chest']],['the feet',['footL','footR']]])
  assert.ok(lowest(b,bones)<.006,`${part} rests on the floor: ${lowest(b,bones)}`);
 // The arms up over the chest, rolling: each mitten goes round, a good few centimetres, in two seconds.
 const chest=world(b,'chest').y,track={L:[],R:[]};
 for(let f=0;f<120;f++){b.step();for(const s of ['L','R']){const g=world(b,'hand'+s,[0,-.06,0]);assert.ok(g.y>chest+.15,'the arms are up');track[s].push(g);}}
 for(const s of ['L','R']){const box=new THREE.Box3().setFromPoints(track[s]),size=box.getSize(new THREE.Vector3());assert.ok(Math.max(size.x,size.y,size.z)>.05,'it kneads');}
 // Getting up from it is the town's own: back to the knocked-out sprawl when the move ends, still on the floor.
 b.animator.stop();b.step(40);assert.ok(lowest(b)>-.002,'nothing below the floor after: '+lowest(b));
 b.avatar.dispose();
});

test('the mittens are where the film’s props are gripped',()=>{
 const pose=(name,c,seconds=1.2)=>{const b=cast(c);b.step(20);play(b,name,{...c,hold:c.hold??(GESTURES[name]===Infinity?undefined:3)});b.step(Math.round(seconds*FPS));return b;};
 const near=(a,b2,d,msg)=>assert.ok(a.distanceTo(b2)<d,`${msg}: ${a.distanceTo(b2).toFixed(3)} m`);
 // CupHands: the two mittens together before the chest, at its height.
 {const b=pose('CupHands',F),m=b.m,L=mitten(b,'L'),R=mitten(b,'R');
  near(L,R,.12,'the mittens are together');for(const p of [L,R]){assert.ok(p.z>m.depth/2+.05&&p.y>m.chestY&&p.y<m.shoulderY,'before the chest: '+p.toArray());}b.avatar.dispose();}
 // CoinToCheek: the coin (in the right mitten) on the right cheek, the left mitten over it, nothing in the head.
 {const b=pose('CoinToCheek',F),H=head(b),R=mitten(b,'R'),L=mitten(b,'L'),coin=world(b,'handR',[0,-.06,0]).add(new THREE.Vector3(0,.03,.02));
  assert.ok(R.x-H.centre.x<-H.S[0]*.4&&Math.abs(R.y-H.centre.y)<.15,'on the right cheek: '+R.toArray());
  const r=H.r(coin);assert.ok(r>1&&r<1.45,'the coin is at the cheek, not in it: '+r);near(L,R,.16,'the left mitten is with it');b.avatar.dispose();}
 // HoldOn: each mitten at the tenugui round the neck, one each side.
 {const b=pose('HoldOn',{...F,tenugui:'flag'}),body=b.avatar.root.children.find(o=>o.name.startsWith('Shimanchu after the bath')&&!o.name.endsWith('outline')),t=body.userData.tenugui,p=new THREE.Vector3();
  for(const s of ['L','R']){const g=world(b,'hand'+s,[0,-b.m.hand*.55,0]);let d=Infinity;for(let i=t.start;i<t.start+t.count;i+=3){body.getVertexPosition(i,p);body.localToWorld(p);d=Math.min(d,p.distanceTo(g));}
   assert.ok(d<.075,`the ${s} mitten holds the tenugui: ${d.toFixed(3)}`);}
  assert.ok(mitten(b,'L').x>0&&mitten(b,'R').x<0);b.avatar.dispose();}
 // Peek: the mittens at the edges of the face, at eye height, before it.
 for(const who of ['Thuan','Mr Fujita']){const b=pose('Peek',{who,outfit:who==='Thuan'?'towel':'afterbath'}),H=head(b);
  for(const s of ['L','R']){const p=mitten(b,s);assert.ok(Math.abs(p.x-H.centre.x)>H.S[0]*.5&&Math.abs(p.x-H.centre.x)<H.S[0]*1.7&&p.y>H.centre.y-.15&&p.y<H.centre.y+.06&&p.z>H.centre.z,`${who}: the ${s} mitten holds the slit by the face: `+p.toArray().map(v=>v.toFixed(3)));}
  b.avatar.dispose();}
 // BannerUp: both arms up beside the head, the giant uchiwa (its face 0.36 m above the grip, 0.23 round) above the head.
 {const b=pose('BannerUp',F),H=head(b);for(const s of ['L','R'])assert.ok(grip(b,s).y>H.centre.y-.05,'up: '+s);
  assert.ok(grip(b,'R').y+.36+.23>H.centre.y+H.S[1],'the banner is over the head');b.avatar.dispose();}
 // FanWild: strokes before him, high to low.
 {const b=cast(F);b.step(20);b.animator.play('FanWild');b.step(40);const H=head(b),ys=[];
  for(let f=0;f<60;f++){b.step();const g=grip(b,'R');ys.push(g.y);assert.ok(g.z-H.centre.z>.1,'the fan is before him');}
  assert.ok(Math.max(...ys)-Math.min(...ys)>.12,'it strokes: '+(Math.max(...ys)-Math.min(...ys)).toFixed(3));b.avatar.dispose();}
 // GrenadeCoin: the coin up by the right cheek, a hand's breadth off it; the left fist before the chest.
 {const b=pose('GrenadeCoin',{...F,state:CHAIR}),H=head(b),R=mitten(b,'R');
  assert.ok(R.x<H.centre.x-H.S[0]&&Math.abs(R.y-H.centre.y)<.16,'by the right cheek: '+R.toArray());assert.ok(H.r(world(b,'handR',[0,-b.m.hand*.55,0]))>1.2,'off it');
  assert.ok(mitten(b,'L').z>b.m.depth/2,'the left fist before the chest');b.avatar.dispose();}
 // Aim: the dryer out ahead at arm's length, far enough from the head that the film's hold points it ahead (more than 0.65 m:
 // props3d.ts orientHeld), the left mitten under the right forearm.
 for(const who of ['Thuan','Nhung','Thao']){const b=pose('Aim',{who,outfit:'towel'}),H=head(b),g=grip(b,'R');
  assert.ok(g.distanceTo(H.centre)>.65,`${who}: ${g.distanceTo(H.centre).toFixed(3)} m from the head`);assert.ok(g.z>.38,'out ahead');
  const e=local(b,world(b,'elbowR')),w=local(b,world(b,'handR')),L=mitten(b,'L'),t=THREE.MathUtils.clamp(L.clone().sub(e).dot(w.clone().sub(e))/w.distanceToSquared(e),0,1);
  near(L,e.clone().lerp(w,t),.1,who+': the left mitten steadies the forearm');b.avatar.dispose();}
 // HoldUp: the screwdriver (0.16 m) upright before his face, under the nose. HoldUpStraws: beside the face, up to eye height.
 {const b=pose('HoldUp',{who:'Tetsuo',outfit:'clothes'}),H=head(b),g=grip(b,'R'),chin=H.centre.y-H.S[1];
  assert.ok(Math.abs(g.x)<.1&&g.z>H.centre.z+H.S[2]&&g.y<chin&&g.y+.16>chin,'before the face: '+g.toArray());b.avatar.dispose();}
 {const b=pose('HoldUpStraws',{who:'Tetsuo',outfit:'clothes'}),H=head(b),g=grip(b,'R');
  assert.ok(g.x<H.centre.x-H.S[0]*.9&&g.z>.2&&g.y+.2>H.centre.y-H.S[1]&&g.y+.2<H.centre.y+.1,'beside the face: '+g.toArray());b.avatar.dispose();}
 // PoleFlick: after the flick the hand is up and behind, over the right shoulder; the head stays down, the eyes on the book.
 {const b=pose('PoleFlick',{who:'Miss Higa',outfit:'clothes',state:{...STOOL,pose:'SitHold'}},1.4),g=grip(b,'R');
  assert.ok(g.y>b.m.shoulderY+.2&&g.z<0&&g.x<0,'up and back over the right shoulder: '+g.toArray());assert.ok(b.looks.at(-1)[1]>.5,'the eyes down');b.avatar.dispose();}
 // FingerStop: the right arm out, the mitten raised like a stop sign; reading, eyes down.
 for(const state of [undefined,STOOL]){const b=pose('FingerStop',{who:'Miss Higa',outfit:'clothes',state}),g=grip(b,'R');
  const up=local(b,world(b,'handR',[0,-b.m.hand,0])).sub(local(b,world(b,'handR'))).normalize();
  assert.ok(g.z>.3,'out before her');assert.ok(up.y>.6,'the mitten up: '+up.y.toFixed(2));assert.ok(b.looks.at(-1)[1]>.5,'the eyes down');b.avatar.dispose();}
 // Tape: both mittens pressed on a cloth before the chest, level, the mittens up.
 for(const c of [F,{who:'Thuan',outfit:'towel'}]){const b=pose('Tape',c),L=mitten(b,'L'),R=mitten(b,'R');
  assert.ok(L.z>.28&&R.z>.28&&Math.abs(L.y-R.y)<.03&&L.y>b.m.chestY&&L.y<b.m.shoulderY+.1,'pressing before the chest: '+L.toArray());b.avatar.dispose();}
 // Offer: held out ahead; in the bath the hand comes up out of the water with it and the other stays in.
 {const b=pose('Offer',{who:'Nhung',outfit:'towel'});assert.ok(grip(b,'R').z>.38);b.avatar.dispose();}
 {const b=pose('Offer',{who:'Nhung',outfit:'swim',state:SOAK}),water=ROCK_BATH.water;
  const R=world(b,'handR',[0,-b.m.hand*.55,0]),L=world(b,'handL',[0,-b.m.hand*.55,0]);
  assert.ok(R.y>water+.05,'out of the water: '+R.y.toFixed(3));assert.ok(L.y<water,'the other hand in it');assert.ok(grip(b,'R').z>.35);b.avatar.dispose();}
 // Reach: the arm straight out.
 for(const c of [F,{who:'Thuan',outfit:'towel'}]){const b=pose('Reach',c),m=b.m;
  assert.ok(local(b,world(b,'shoulderR')).distanceTo(grip(b,'R'))>.85*(m.upper+m.fore+.06),'reaching');b.avatar.dispose();}
 // Call: the head turned to her left to call, the eyes down on the book in the left mitten.
 {const b=pose('Call',{who:'Miss Higa',outfit:'clothes',state:STOOL}),H=head(b);
  assert.ok(H.face.normalize().x>.3,'the head turned');assert.ok(b.looks.at(-1)[1]>.5,'the eyes on the book');assert.ok(mitten(b,'L').z>b.m.depth/2+.05);b.avatar.dispose();}
 // WriteAbove: in the rock bath, both mittens (the book and the pencil) above the water, before her; the eyes on the book.
 {const b=pose('WriteAbove',{who:'Miss Higa',outfit:'swim',state:SOAK});
  for(const s of ['L','R']){const p=world(b,'hand'+s,[0,-b.m.hand*.55,0]);assert.ok(p.y>ROCK_BATH.water+.04,`the ${s} mitten above the water: ${p.y.toFixed(3)}`);assert.ok(mitten(b,s).z>.2);}
  near(mitten(b,'L'),mitten(b,'R'),.15,'both at the book');assert.ok(b.looks.at(-1)[1]>.5);b.avatar.dispose();}
 // BowDeep: 45° from the hips at the hold, the hands by the knees, the legs straight.
 {const b=pose('BowDeep',{...F,hold:2.4},1),back=local(b,world(b,'neck')).sub(local(b,world(b,'hips'))).normalize();
  const angle=THREE.MathUtils.radToDeg(Math.acos(back.y));assert.ok(angle>40&&angle<52,'a 45° bow: '+angle.toFixed(1));
  assert.ok(grip(b,'R').y<b.m.hipY,'the hands down by the knees');b.avatar.dispose();}
});

test('BowWalk backs out of the room in small steps',()=>{
 // Over two seconds of walking: how far each thigh swings, and which way the foot on the ground goes under the body (forwards
 // it is left behind; backing out, it is passed going the other way).
 const walk=gesture=>{
  const b=cast({who:'Thuan',outfit:'afterbath',state:{speed:.7},walking:true});b.step(30);if(gesture)b.animator.play(gesture);b.step(30);
  const swing=[],feet=[];for(let f=0;f<120;f++){b.step();swing.push(b.avatar.bones.thighL.rotation.x);feet.push([world(b,'footL').y,local(b,world(b,'footL')).z]);}
  const low=Math.min(...feet.map(([y])=>y));let planted=0;for(let i=1;i<feet.length;i++)if(feet[i][0]<low+.01)planted+=feet[i][1]-feet[i-1][1];
  b.avatar.dispose();return {swing:Math.max(...swing)-Math.min(...swing),planted};
 };
 const ahead=walk(null),back=walk('BowWalk');
 assert.ok(Math.abs(ahead.planted)>.02&&Math.abs(back.planted)>.02&&Math.sign(back.planted)===-Math.sign(ahead.planted),
  `the foot on the ground goes under the body the other way to a walk forwards: ${back.planted.toFixed(3)} against ${ahead.planted.toFixed(3)}`);
 assert.ok(back.swing<ahead.swing*.8,`small steps: ${back.swing.toFixed(3)} against ${ahead.swing.toFixed(3)}`);
});

/**
 * The torso as it is drawn in these clothes (the wrap, the vest, the house dress, the swimsuit), from the waist to under the
 * shoulders: how far out from the body's axis it reaches, by height and direction, at rest.
 */
function torsoHull(b){
 const m=b.m,mesh=b.avatar.root.children.find(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline')),g=mesh.geometry;
 const P=g.attributes.position,I=g.attributes.skinIndex,W=g.attributes.skinWeight,names=mesh.skeleton.bones.map(x=>x.name),torso=new Set(['hips','spine','chest']);
 const y0=m.hipY+m.torso*.25,y1=m.shoulderY-.06*m.k,dy=.015,da=Math.PI/12,bins=new Map();
 for(let i=0;i<P.count;i++){
  const y=P.getY(i);if(y<y0||y>y1)continue;let w=0;for(let k=0;k<4;k++)if(torso.has(names[I.getComponent(i,k)]))w+=W.getComponent(i,k);if(w<.9)continue;
  const x=P.getX(i),z=P.getZ(i),key=Math.floor((y-y0)/dy)+':'+Math.floor((Math.atan2(x,z)+Math.PI)/da);bins.set(key,Math.max(bins.get(key)||0,Math.hypot(x,z)));
 }
 /** How far a point (the body's rest frame) is inside the drawn torso, and a limb of radius r round it. */
 return (p,r)=>{if(p.y<y0||p.y>y1)return -Infinity;const R=bins.get(Math.floor((p.y-y0)/dy)+':'+Math.floor((Math.atan2(p.x,p.z)+Math.PI)/da));return R===undefined?-Infinity:R+r-Math.hypot(p.x,p.z);};
}
/** How deep the forearms and the mittens go into the drawn torso (in its own frame), and the forearms into the head. */
function intrusion(b,hull){
 const m=b.m,toChest=b.avatar.bones.chest.matrixWorld.clone().invert(),lift=new THREE.Vector3(0,m.chestY,0),H=head(b);let arm=-Infinity,hand=-Infinity,headR=Infinity;
 for(const s of ['L','R']){
  const e=world(b,'elbow'+s),w=world(b,'hand'+s),c=world(b,'hand'+s,[0,-m.hand*.55,0]);
  for(let t=0;t<=1.001;t+=.1){const p=e.clone().lerp(w,t);arm=Math.max(arm,hull(p.clone().applyMatrix4(toChest).add(lift),m.armR*.9));headR=Math.min(headR,H.r(p)-m.armR*.9/m.Rh);}
  hand=Math.max(hand,hull(c.applyMatrix4(toChest).add(lift),m.hand*.8));
 }
 return {arm,hand,headR};
}
/** The town's own moves that bring the hands to the body and the face: how far they already go. */
const REFERENCE=['CollarTug','Heart','Think','HairDry','Phone','CheekRest','DoubleCheek','Clap','Sing','HandsOnHips'];

test('the arms keep out of the body, the clothes and the head, as far as the town’s own moves do',()=>{
 const seen=new Map();
 for(const [name,c] of CASES){
  if(c.state?.lying||name==='KneelHug')continue;
  const key=c.who+'|'+c.outfit+'|'+(c.state?.seated?'seated':'standing');
  if(!seen.has(key)){
   const b=cast({...c,state:c.state?.seated?c.state:{}}),hull=torsoHull(b);b.step(30);let ref=intrusion(b,hull);   // at rest, and in the town's moves
   for(const g of REFERENCE){b.animator.stop();b.animator.play(g,1.6);for(let f=0;f<80;f++){b.step();if(f%10===9){const r=intrusion(b,hull);ref={arm:Math.max(ref.arm,r.arm),hand:Math.max(ref.hand,r.hand),headR:Math.min(ref.headR,r.headR)};}}}
   seen.set(key,{ref,hull});b.avatar.dispose();
  }
  const {ref,hull}=seen.get(key),b=cast(c),tol=.004*b.m.k;b.step(20);play(b,name,c);
  for(let f=0;f<150;f++){b.step();if(f%10!==9)continue;const r=intrusion(b,hull);
   assert.ok(r.arm<=Math.max(ref.arm,0)+tol,`${label(name,c)}: a forearm ${(r.arm*1000).toFixed(0)} mm into the body or its clothes (the town's own moves: ${(ref.arm*1000).toFixed(0)})`);
   assert.ok(r.hand<=Math.max(ref.hand,0)+tol,`${label(name,c)}: a mitten ${(r.hand*1000).toFixed(0)} mm into the body or its clothes (${(ref.hand*1000).toFixed(0)})`);
   assert.ok(r.headR>=Math.min(ref.headR,1)-.02,`${label(name,c)}: a forearm in the head (${r.headR.toFixed(3)})`);
  }
  b.avatar.dispose();
 }
});

test('no mitten goes into the face',()=>{
 const ray=new THREE.Raycaster(),p=new THREE.Vector3();
 for(const [name,c] of CASES){
  if(!['CoinToCheek','HoldOn','Peek','GrenadeCoin','HoldUp','HoldUpStraws','CupHands','FingerStop','BannerUp'].includes(name))continue;
  const b=cast(c);b.step(20);play(b,name,c);b.step(70);
  const faceMesh=b.avatar.face.head,body=b.avatar.root.children.find(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'));
  const inv=faceMesh.matrixWorld.clone().invert();faceMesh.geometry.computeBoundingSphere();const centre=faceMesh.geometry.boundingSphere.center;
  const {skinIndex,skinWeight,position}=body.geometry.attributes,hands=['handL','handR'].map(n=>body.skeleton.bones.indexOf(b.avatar.bones[n]));
  const probe=new THREE.Mesh(faceMesh.geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  let deepest=0;
  for(let i=0;i<position.count;i+=3){
   if(!hands.includes(skinIndex.getX(i))||skinWeight.getX(i)<.9)continue;
   body.getVertexPosition(i,p);body.localToWorld(p);const q=p.clone().applyMatrix4(inv),dir=q.clone().sub(centre),d=dir.length();
   ray.set(centre,dir.normalize());const hit=ray.intersectObject(probe)[0];if(hit&&hit.distance>d)deepest=Math.max(deepest,hit.distance-d);
  }
  assert.ok(deepest<.004,`${label(name,c)}: a mitten ${(deepest*1000).toFixed(1)} mm into the face`);
  b.avatar.dispose();
 }
});
