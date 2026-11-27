import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {tableDrink,heldDrink,checkTableDrink,worst,JUMP,THREE,beerMotion,beerLastBlend,IZAKAYA_PLAYER_SEATS,createDrinkProp,KIND} from './drink-beer-fixtures.mjs';
import {BEER_TABLE_MOTIONS,beerParts,mirrorMotion,beerSideFor} from '../src/avatars/drink-beer.js';
import {glassYawAt} from '../src/people/izakaya-beer.js';

/**
 * Beer from a glass at the booth's table and held in the hand with nowhere to set it down, as animated in Blender
 * (tools/blender/drink-beer.py --table booth|held; the owner, 27 November 2026: "Remake it follow Disney principles how should
 * it look when anyone drinks beer"). Before, a booth's glass was drunk with the counter's motion, which stepped up to 0.5 rad a
 * frame and moved the glass 35 mm a frame there, its wrist 0.18 rad past what a wrist does (a glass set to the drinker's left
 * reached across for with the right hand); and a glass held standing was the old drink from the hand. Each is held here to what
 * the counter's drink is (tests/drink-beer-fixtures.mjs checkTableDrink): the rim on the lip, the foot on the table where it
 * stands and never through it, the glass never in the face, no hand through the table, the wrists within what a wrist does,
 * nothing pops, the glass tipped as far as the beer left needs.
 */
// (a small body, Johansson whose motion it is, the largest, and a sipper with the shortest arm of those served beer)
const BODIES=['Nils Johansson','Thao','Sverker','Christina'];

test('the booth\'s motions and the held ones are the ones made in Blender: their parts join on one pose, the rim on the lip there; the mirrored is the right hand\'s exactly',()=>{
 for(const [vessel,tables] of Object.entries(BEER_TABLE_MOTIONS))for(const table of ['booth','held']){const M=tables[table],P=beerParts(M),T=M.times;
  assert.equal(M.props.table,table);assert.deepEqual(Object.keys(P),table==='held'?['hold','sip','last']:['take','first','sip','last','let'],vessel+' '+table);
  const idx=t=>T.findIndex(x=>x>=t-1e-6),ref=Object.values(P)[1][0];
  for(const [,[t]] of Object.entries(P).slice(1))for(const [n,d] of Object.entries(M.joints)){const q=new THREE.Quaternion().fromArray(d,idx(t)*4),q0=new THREE.Quaternion().fromArray(d,idx(ref)*4);
   assert.ok(q.angleTo(q0)<.005,`${vessel} ${table}: ${n} at ${t} s is the pose the parts join on`);}
  // (SIP and LAST at the same times: the game blends one into the other)
  assert.ok(Math.abs((P.sip[1]-P.sip[0])-(P.last[1]-P.last[0]))<1e-6,`${vessel} ${table}: SIP and LAST as long`);
  for(const c of ['lip','mouth','hold','counter']){const d=M.contact[c],o=Math.round((P.last[0]-P.sip[0])*M.fps);for(let i=idx(P.sip[0]);i<idx(P.sip[1]);i++)assert.ok(Math.abs(d[i]-d[i+o])<1e-3,`${vessel} ${table}: ${c} the same in SIP and LAST`);}
  const V=JSON.parse(readFileSync(new URL(`./drink-beer-${vessel}-${table}.verify.json`,import.meta.url),'utf8'));
  const on=V.lipWeight.map((w,i)=>w>.99?Math.hypot(...V.rim[i].map((v,j)=>v-V.lip[i][j])):0);
  assert.ok(Math.max(...on)<.009,`${vessel} ${table}: in Blender the rim on the lip to ${(Math.max(...on)*1000).toFixed(1)} mm`);}
 // (mirrored: each joint the other side's, its turns about up and forward the other way; each path across the body the other way)
 const M=BEER_TABLE_MOTIONS.mug.booth,L=mirrorMotion(M);
 for(const i of [0,200,400]){const r=new THREE.Quaternion().fromArray(M.joints.elbowR,i*4),l=new THREE.Quaternion().fromArray(L.joints.elbowL,i*4);
  assert.deepEqual([l.x,l.y,l.z,l.w].map(v=>+v.toFixed(6)),[r.x,-r.y,-r.z,r.w].map(v=>+v.toFixed(6)));
  assert.deepEqual(L.reach.L.slice(i*3,i*3+3).map(v=>+v.toFixed(6)),[-M.reach.R[i*3],M.reach.R[i*3+1],M.reach.R[i*3+2]].map(v=>+v.toFixed(6)));}
});

test('at the booth Thao sets the glass at the table\'s end she can reach; the hand on its side takes it, a mug\'s handle turned to it',()=>{
 const S=IZAKAYA_PLAYER_SEATS;
 // ('window' faces the window wall, the glass to its right; 'table' faces the other way, the same end of the table its left)
 assert.equal(S.window.glassYaw,S.window.yaw);assert.ok(Math.abs(S.table.glassYaw-S.table.yaw-Math.PI)<1e-9);
 assert.equal(glassYawAt([0,0,0],0,[.15,0,-.3]),0);assert.equal(glassYawAt([0,0,0],0,[-.15,0,-.3]),Math.PI);
 assert.equal(tableDrink('Nils Johansson','mug',{seat:'window'}).side,'R');assert.equal(tableDrink('Nils Johansson','mug',{seat:'table'}).side,'L');
 assert.equal(tableDrink('Nils Johansson','mug',{seat:'table'}).table,'booth');
});

for(const seat of ['window','table'])for(const vessel of ['mug','pint','glass'])test(`the ${vessel} at the booth, ${seat==='window'?'to the right':'to the left, the left hand'}: taken off its table, the first draught, set down where it stood`,()=>{
 const report=[];for(const who of BODIES)report.push(checkTableDrink(`${who}, the ${vessel}, ${seat}`,tableDrink(who,vessel,{seat})));
 console.log(report.join('\n'));
});

test('a later sip at the booth, the glass to the left: as far toward the last of it as the beer left needs',()=>{
 const report=[];for(const vessel of ['mug','pint','glass'])for(const who of BODIES){const run=tableDrink(who,vessel,{seat:'table',start:.5,end:.33});
  assert.ok(run.last>0&&run.last<1,`${who}, the ${vessel}: a sip between half and the last of it (${run.last})`);report.push(checkTableDrink(`${who}, the ${vessel}, a later sip`,run));}
 console.log(report.join('\n'));
});

/** The checks for a glass held: the rim on the lip, never in the face, the wrists, nothing pops (the way in, between sips and out). */
function checkHeld(tag,run){
 const {frames}=run;let rim=0,n=0,face=0;
 for(const f of frames){face=Math.max(face,f.inFace);if(f.on&&f.c&&f.c.w>.99&&f.c.lip>.99){rim=Math.max(rim,f.rimLip);n++;}}
 const W=worst(frames,2),line=`${tag}: rim ${(rim*1000).toFixed(1)} mm over ${n}; glass ${(face*1000).toFixed(1)} mm into the face; wrist ${W.wrist[0].toFixed(3)} past (${W.wrist[1]} ${W.wrist[2]?.toFixed(2)}); `+
  `steps ${W.jump[0].toFixed(3)} rad (${W.jump[1]} ${W.jump[2]?.toFixed(2)}), turn ${W.turn[0].toFixed(2)}, glass ${(W.glass[0]*1000).toFixed(0)} mm a frame`;
 assert.ok(n>20&&rim<.002,`${tag}: the rim on the lip: ${line}`);
 assert.ok(face<.002,`${tag}: the glass never in the face: ${line}`);
 assert.ok(W.wrist[0]<.05,`${tag}: the wrists within what a wrist does: ${line}`);
 assert.ok(W.turn[0]<.3&&W.jump[0]<JUMP,`${tag}: nothing pops: ${line}`);
 assert.ok(W.glass[0]<.03,`${tag}: the glass never snatched: ${line}`);
 // (and the hand never jumps: the way in from the animator's pose, and out to it)
 let hand=0;for(let i=1;i<frames.length;i++)hand=Math.max(hand,frames[i].hand.distanceTo(frames[i-1].hand));
 assert.ok(hand<.03,`${tag}: the hand ${(hand*1000).toFixed(0)} mm in a frame`);
 return line;
}
for(const vessel of ['mug','pint','glass'])test(`the ${vessel} held standing, nowhere to set it down: a sip from it and the last of it, held at the waist between`,()=>{
 const report=[];
 for(const who of BODIES)for(const portion of [.6,.2]){const run=heldDrink(who,vessel,{portion});assert.ok(run.frames.some(f=>f.c&&f.c.part==='sip'),`${who}: played as animated, held`);
  report.push(checkHeld(`${who}, the ${vessel} held standing, ${portion===.6?'a sip':'the last of it'}`,run));}
 console.log(report.join('\n'));
});
test('a glass held seated with no table (Mr Fujita\'s chair in his shed): sipped in their own rhythm, held between, eased out when the pose ends',()=>{
 const report=[];
 for(const who of ['Mr Fujita','Thao']){const run=heldDrink(who,'mug',{seated:true,timed:false,seconds:22});
  // (two sips at least in 22 s, and held between; then eased out without the glass)
  let sips=0;for(let i=1;i<run.frames.length;i++)if(run.frames[i].c?.lip>.99&&!(run.frames[i-1].c?.lip>.99))sips++;
  assert.ok(sips>=2,`${who}: sips in their own time (${sips})`);
  const out=run.frames.filter(f=>!f.on);assert.ok(out.length&&!out.at(-1).c,`${who}: eased out`);
  report.push(checkHeld(`${who}, a mug held seated`,run));}
 console.log(report.join('\n'));
});

test('a later sip goes toward the last of it as the glass empties: none of LAST for half a glass, all of it for the last',()=>{
 for(const vessel of ['mug','pint','glass'])for(const table of ['counter','booth','held']){const prop=createDrinkProp(KIND[vessel],{held:true}),M=beerMotion(prop,table);
  const b=[.6,.4,.25,0].map(f=>beerLastBlend(M,prop,f));
  assert.ok(b[0]<.15&&b[3]>.95&&b.every((x,i)=>i===0||x>=b[i-1]),`${vessel} ${table}: ${b.map(x=>x.toFixed(2)).join(' ')}`);}
});
