import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {createPropFactory} from '../prop-factory.js';
import {BUILD_CATALOGUE,catalogueEntry} from '../src/build/catalogue.js';
import {createPlacements,footprint,footprintsOverlap,placementProblems,readPlacementsFile,PLACEMENTS_FILE} from '../src/build/placements.js';
import {townBoundsBlocked,circleHitsRect} from '../physics.js';
import {installDOM} from './fixtures.mjs';

installDOM();

const factory=createPropFactory({shadows:false});
function town({colliders=[],doors=[],walkable=()=>true}={}){
 const group=new THREE.Group(),list=[...colliders];
 return {group,colliders:list,builder:createPlacements({group,colliders:list,factory,walkable,doors})};
}

test('every catalogue piece has a name, a reason to exist and a real prop behind it',()=>{
 assert.ok(BUILD_CATALOGUE.length>=8);
 for(const e of BUILD_CATALOGUE){
  assert.ok(e.name&&e.purpose.length>30,e.id+' says who it is for and why');
  const made=factory[e.make](0,0,0);
  assert.ok(made.object instanceof THREE.Object3D&&made.collider.w>0&&made.collider.d>0,e.id+' builds a prop with a footprint');
 }
});

test('footprints turn with the prop, the same way the walking test does',()=>{
 const box={x:2,z:3,w:2,d:.5,yaw:Math.PI/2},corners=footprint(box);
 for(const [x,z] of corners)assert.ok(Math.abs(Math.abs(x-2)-.25)<1e-9&&Math.abs(Math.abs(z-3)-1)<1e-9);
 // A point the turned footprint covers is also inside it for circleHitsRect, which people and the camera use.
 assert.equal(circleHitsRect(2,3.9,0,box),true);assert.equal(circleHitsRect(2.9,3,0,box),false);
 assert.equal(footprintsOverlap(box,{x:2,z:3.9,w:.2,d:.2}),true);
 assert.equal(footprintsOverlap(box,{x:2,z:4.2,w:.2,d:.2}),false);
 assert.equal(footprintsOverlap(box,{x:2.6,z:3,w:.2,d:.2}),false);
});

test('a placement must be on walkable ground, clear, out of doorways, and say why it is there',()=>{
 const size={w:1.95,d:.78},world={colliders:[{x:10,z:0,w:2,d:2}],doors:[[0,10]],walkable:(x,z)=>Math.abs(x)<20&&Math.abs(z)<20};
 assert.deepEqual(placementProblems({kind:'bench',x:0,z:0,yaw:0,note:'For people waiting for the bus.'},size,world),[]);
 const sayWhy=placementProblems({kind:'bench',x:0,z:0,yaw:0,note:' '},size,world);
 assert.equal(sayWhy.length,1);assert.match(sayWhy[0],/why/);
 assert.match(placementProblems({kind:'bench',x:19.5,z:0,yaw:0,note:'x'},size,world)[0],/ground people walk on/);
 assert.match(placementProblems({kind:'bench',x:9.5,z:0,yaw:0,note:'x'},size,world)[0],/overlaps/);
 assert.match(placementProblems({kind:'bench',x:0,z:10.6,yaw:0,note:'x'},size,world)[0],/doorway/);
 assert.match(placementProblems({kind:'spaceship',x:0,z:0,note:'x'},size,world)[0],/catalogue/);
 // Overhead things (an awning starting at 2.3 m) do not stop a bench underneath.
 assert.deepEqual(placementProblems({kind:'bench',x:0,z:0,yaw:0,note:'x'},size,{...world,colliders:[{x:0,z:0,w:2,d:1,minY:2.3}]}),[]);
});

test('a piece stands on the ground there, and never across a kerb',()=>{
 const kerb=(x,z)=>x>5?.15:.02,t=town();t.builder=createPlacements({group:t.group,colliders:t.colliders,factory,walkable:()=>true,heightAt:kerb});
 assert.match(t.builder.check({kind:'bench',x:5,z:0,note:'x'})[0],/kerb/);
 const r=t.builder.place({kind:'bench',x:8,z:0,note:'On the raised pavement'});
 assert.equal(r.ok,true);
 const c=t.colliders.find(c=>c.placementId===r.id);
 assert.ok(Math.abs(c.minY-.15)<.02,'its feet are on the pavement, at '+c.minY);
 assert.equal(t.group.children[0].position.y,.15);
});

test('placing adds the prop and a turned collider people bump into; removing takes both away',()=>{
 const t=town(),r=t.builder.place({kind:'bench',x:1,z:2,yaw:Math.PI/2,note:'A seat by the quay for anglers.'});
 assert.equal(r.ok,true);
 const c=t.colliders.find(c=>c.placementId===r.id);
 assert.ok(c&&c.yaw===Math.PI/2&&c.height>.8&&c.minY<=.01,'collider carries the yaw and the real height');
 assert.equal(t.group.children.length,1);
 assert.equal(circleHitsRect(1,2.9,.3,c),true,'a person walking into the turned bench is stopped');
 assert.equal(t.builder.place({kind:'postbox',x:1,z:2.5,note:'Post'}).ok,false,'nothing can be placed inside it');
 assert.equal(t.builder.remove(r.id),true);
 assert.equal(t.colliders.length,0);assert.equal(t.group.children.length,0);
});

test('moving checks the new spot, ignoring the piece itself, and leaves it where it was when refused',()=>{
 const t=town({colliders:[{x:6,z:0,w:1,d:1}]}),{id}=t.builder.place({kind:'postbox',x:0,z:0,note:'Letters'});
 assert.equal(t.builder.move(id,{x:.3}).ok,true,'a small nudge overlaps only itself');
 const refused=t.builder.move(id,{x:6});
 assert.equal(refused.ok,false);assert.match(refused.problems[0],/overlaps/);
 assert.deepEqual(t.builder.list().map(p=>[p.id,p.x]),[[id,.3]]);
});

test('the placements file round-trips; a bad entry is not built into a wall, and saving keeps it for fixing',()=>{
 const t=town({colliders:[{x:5,z:5,w:2,d:2}]});
 t.builder.place({kind:'bench',x:0,z:0,yaw:.5,note:'Bus stop seat'});
 const again=town({colliders:[{x:5,z:5,w:2,d:2}]});
 const list=readPlacementsFile(t.builder.file());
 const skipped=again.builder.load([...list,{id:'p9',kind:'bench',x:5,z:5,yaw:0,note:'In the wall'}]);
 assert.deepEqual(again.builder.list().map(p=>p.kind),['bench']);
 assert.equal(skipped.length,1);assert.equal(skipped[0].id,'p9');
 assert.deepEqual(again.builder.held().map(p=>p.id),['p9']);
 assert.equal(again.builder.place({kind:'postbox',x:-4,z:0,note:'Letters'}).id,'p10','new ids continue after the loaded ones');
 assert.deepEqual(readPlacementsFile(again.builder.file()).map(p=>p.id),['p1','p9','p10'],'saving never drops the held one');
 assert.equal(again.builder.move('p9',{x:-8}).ok,true,'moving it to a clear spot builds it');
 assert.deepEqual(again.builder.held(),[]);
 assert.throws(()=>readPlacementsFile('{"version":2,"placements":[]}'));
 assert.throws(()=>readPlacementsFile({version:1,placements:[{id:'a'},{id:'a'}]}));
});

test('things that come and go (parked cars, the ferry) never decide a placement; their bays are kept clear instead',()=>{
 const world={colliders:[{x:0,z:0,w:2,d:4.5,moving:true}],doors:[[6,0,4.8]],walkable:()=>true};
 assert.deepEqual(placementProblems({kind:'postbox',x:0,z:0,note:'x'},{w:.74,d:.58},world),[]);
 assert.match(placementProblems({kind:'postbox',x:5,z:0,note:'x'},{w:.74,d:.58},world)[0],/doorway/);
});

test('a broken number in the file is kept as written, never saved as 0',()=>{
 const t=town(),list=readPlacementsFile({version:1,placements:[{id:'p1',kind:'bench',x:'abc',z:2,yaw:0,note:'?'}]});
 assert.equal(t.builder.load(list).length,1);
 assert.equal(readPlacementsFile(t.builder.file()).length,1);
 assert.equal(JSON.parse(t.builder.file()).placements[0].x,'abc');
});

test('the published placements file is valid, and every placement in it stands on the real town ground',()=>{
 const list=readPlacementsFile(readFileSync(new URL('../'+PLACEMENTS_FILE,import.meta.url),'utf8'));
 for(const p of list){
  const c=factory[catalogueEntry(p.kind).make](0,0,0).collider;
  for(const [x,z] of [[p.x,p.z],...footprint({x:p.x,z:p.z,w:c.w,d:c.d,yaw:p.yaw})])assert.equal(townBoundsBlocked(x,z,0),false,p.id+' is on walkable ground');
  assert.ok(p.note.trim(),p.id+' says why it is there');
 }
});

// Undo beside the way out (research/mario-artist/report.md §5): every place, move and remove can be taken back, in
// order, and done again; a step that cannot go back says why and loses nothing.
test('undo takes back a place, a move and a remove, in order, and redo does them again',()=>{
 const t=town(),b=t.builder,{id}=b.place({kind:'bench',x:0,z:0,note:'A seat by the quay for anglers.'});
 b.move(id,{x:2});b.remove(id);
 assert.deepEqual(b.history(),{undo:3,redo:0});
 assert.match(b.undo().undid,/Put back the bench/);assert.deepEqual(b.list().map(p=>[p.id,p.x]),[[id,2]],'back where it was removed from, with its own id');
 assert.match(b.undo().undid,/Moved the bench back/);assert.deepEqual(b.list().map(p=>[p.id,p.x]),[[id,0]]);
 assert.equal(t.colliders.filter(c=>c.placementId===id).length,1,'one collider, at the old spot');assert.equal(t.colliders[0].x,0);
 assert.match(b.undo().undid,/Took away the bench/);assert.equal(b.list().length,0);assert.equal(t.colliders.length,0);assert.equal(t.group.children.length,0);
 assert.equal(b.undo().ok,false,'nothing more to undo');
 assert.deepEqual(b.history(),{undo:0,redo:3});
 b.redo();b.redo();b.redo();assert.equal(b.list().length,0,'placed, moved and removed again');
 assert.deepEqual(b.history(),{undo:3,redo:0});
});

test('a new change clears what could be redone; loading a file is not a step',()=>{
 const t=town(),b=t.builder;
 b.load([{id:'p1',kind:'postbox',x:0,z:0,note:'Letters'}]);assert.deepEqual(b.history(),{undo:0,redo:0});
 const {id}=b.place({kind:'bench',x:4,z:0,note:'A seat by the quay for anglers.'});b.undo();
 assert.equal(b.history().redo,1);b.place({kind:'bench',x:-4,z:0,note:'A seat by the quay for anglers.'});
 assert.deepEqual(b.history(),{undo:1,redo:0});void id;
});

test('an undo that cannot be done says why and changes nothing',()=>{
 const t=town(),b=t.builder,{id}=b.place({kind:'postbox',x:0,z:0,note:'Letters'});
 b.remove(id);
 t.colliders.push({x:0,z:0,w:1,d:1});   // something now stands where the postbox was
 const r=b.undo();assert.equal(r.ok,false);assert.match(r.problems[0],/postbox cannot go back: It overlaps/);
 assert.equal(b.history().undo,2,'the removal is still there to undo once the spot is clear');
 t.colliders.pop();assert.equal(b.undo().ok,true,'and then it can');
});

test('a moved piece is never lost: undo and redo refuse before touching it when its other spot is taken',()=>{
 const t=town(),b=t.builder,{id}=b.place({kind:'postbox',x:3,z:0,note:'Letters'});b.move(id,{x:5});
 t.colliders.push({x:3,z:0,w:1,d:1});   // the old spot is taken now
 const before=JSON.stringify(b.list()),groups=t.group.children.length;
 const r=b.undo();assert.equal(r.ok,false);assert.match(r.problems[0],/cannot go back/);
 assert.equal(JSON.stringify(b.list()),before,'still where it was moved to');assert.equal(t.group.children.length,groups);
 assert.equal(t.colliders.filter(c=>c.placementId===id).length,1);
 t.colliders.pop();assert.equal(b.undo().ok,true);assert.deepEqual(b.list().map(p=>p.x),[3]);
 t.colliders.push({x:5,z:0,w:1,d:1});   // now the new spot is taken: redo refuses the same way
 assert.equal(b.redo().ok,false);assert.deepEqual(b.list().map(p=>p.x),[3],'still at the old spot');
 assert.match(b.file(),new RegExp('"id": "'+id+'"'),'and in the file');
});

test('undoing the removal of a piece the file could not place keeps its numbers exactly as written',()=>{
 const t=town(),b=t.builder;
 const list=readPlacementsFile({version:1,placements:[{id:'p1',kind:'bench',x:'abc',z:0,yaw:0,note:'A seat by the quay for anglers.'}]});
 b.load(list);assert.equal(b.held().length,1);
 b.remove('p1');assert.equal(b.undo().ok,true);
 assert.equal(JSON.parse(b.file()).placements[0].x,'abc','the broken number comes back as the file had it, never as 0');
});

test('turning a piece 15° at a time is one step to undo',()=>{
 const t=town(),b=t.builder,{id}=b.place({kind:'bench',x:0,z:0,note:'A seat by the quay for anglers.'});
 for(let i=1;i<=6;i++)b.move(id,{yaw:i*Math.PI/12},{merge:'turn'});
 assert.equal(b.history().undo,2,'placed, then turned');
 b.undo();assert.equal(b.list()[0].yaw,0,'one undo turns it all the way back');
 b.move(id,{x:1});b.move(id,{yaw:.2},{merge:'turn'});assert.equal(b.history().undo,3,'a move between starts a new turn step');
});

test('a refusal names the piece in the way when somebody placed it',()=>{
 const t=town(),b=t.builder;b.place({kind:'bench',x:0,z:0,note:'A seat by the quay for anglers.'});
 assert.match(b.check({kind:'postbox',x:0,z:0,note:'Letters'}).join(' '),/overlaps the bench that is already there/);
 const u=town({colliders:[{x:0,z:0,w:1,d:1}]});
 assert.match(u.builder.check({kind:'postbox',x:0,z:0,note:'Letters'}).join(' '),/overlaps something that is already there/);
});

test('a piece must leave a 1.4 m way to walk past it, where there was one',()=>{
 // A pavement 3 m wide (z 0..3) between a shop wall and the road.
 const pavement=(x,z)=>z>=0&&z<=3&&Math.abs(x)<30,size={w:1.95,d:.78},note='For people waiting for the bus.';
 const world={colliders:[],doors:[],walkable:pavement,passage:1.4};
 // In the middle it leaves 1.1 m each side: nobody can pass at 1.4 m.
 assert.match(placementProblems({kind:'bench',x:0,z:1.5,yaw:0,note},size,world)[0],/less than 1.4 m to walk past it/);
 // At the kerb it leaves 2.2 m: fine.
 assert.deepEqual(placementProblems({kind:'bench',x:0,z:2.6,yaw:0,note},size,world),[]);
 // Turned across the pavement it takes 1.95 m of the 3 m, leaving 1.05 m in all: it never fits, wherever it stands.
 for(const z of [1,1.5,2])assert.match(placementProblems({kind:'bench',x:0,z,yaw:Math.PI/2,note},size,world)[0],/walk past/);
 // A pavement already narrower than the passage has no way through to close.
 const narrow=(x,z)=>z>=0&&z<=1.2&&Math.abs(x)<30;
 assert.deepEqual(placementProblems({kind:'bench',x:0,z:.6,yaw:0,note},{w:1.95,d:.5},{...world,walkable:narrow}),[]);
 // Without a passage rule (inside a home), the old rules alone.
 assert.deepEqual(placementProblems({kind:'bench',x:0,z:1.5,yaw:0,note},size,{...world,passage:null}),[]);
});

test('the walkway counts what already stands there, and a nook off the way is nobody\'s way',()=>{
 const pavement=(x,z)=>z>=0&&z<=3&&Math.abs(x)<30,size={w:1.95,d:.78},note='x';
 // A cabinet at the kerb at x=0 leaves 2.2 m; a bench beside it at the shop wall would leave 3-.8-.78 = 1.42 m between them.
 const cabinet={x:0,z:2.6,w:1.2,d:.8};
 assert.deepEqual(placementProblems({kind:'bench',x:0,z:.39,yaw:0,note},size,{colliders:[cabinet],doors:[],walkable:pavement,passage:1.4}),[]);
 // Moved 0.4 m out from the wall, it leaves 1.02 m: refused.
 assert.match(placementProblems({kind:'bench',x:0,z:.8,yaw:0,note},size,{colliders:[cabinet],doors:[],walkable:pavement,passage:1.4})[0],/walk past/);
 // A nook 2 m deep and 2.4 m wide off the pavement (z -2..0, x -1.2..1.2): a bench at its back closes nothing.
 const withNook=(x,z)=>pavement(x,z)||(z>=-2&&z<0&&Math.abs(x)<=1.2);
 assert.deepEqual(placementProblems({kind:'bench',x:0,z:-1.6,yaw:0,note},size,{colliders:[],doors:[],walkable:withNook,passage:1.4}),[]);
 // The piece's own collider never counts against it when it is moved.
 const own={x:0,z:.39,w:1.95,d:.78,placementId:'p1'};
 assert.deepEqual(placementProblems({id:'p1',kind:'bench',x:.2,z:.39,yaw:0,note},size,{colliders:[own],doors:[],walkable:pavement,passage:1.4}),[]);
});

test('the live builder refuses a bench across the walkway, and the town holds a fixed most of pieces',()=>{
 const pavement=(x,z)=>z>=0&&z<=3&&Math.abs(x)<300;
 const group=new THREE.Group(),list=[],b=createPlacements({group,colliders:list,factory,walkable:pavement,passage:1.4});
 const r=b.place({kind:'bench',x:0,z:1.5,note:'In the way'});
 assert.equal(r.ok,false);assert.match(r.problems[0],/walk past/);assert.equal(list.length,0);
 assert.equal(b.place({kind:'bench',x:0,z:2.6,note:'At the kerb, for the bus'}).ok,true);
 assert.throws(()=>readPlacementsFile({version:1,placements:Array.from({length:501},(_,i)=>({id:'p'+i,kind:'bench',x:0,z:0}))}),/at most 500/);
});

test('an alley that ends at a door is somebody\'s way, and a thin fence counts',()=>{
 // A pavement (z 0..3) with an alley 1.6 m wide going back from it (x -0.8..0.8, z -6..0) to a door at its end.
 const ground=(x,z)=>(z>=0&&z<=3&&Math.abs(x)<30)||(z>=-6&&z<0&&Math.abs(x)<=.8);
 const box={w:.5,d:.5},note='x',world={colliders:[],doors:[[0,-6]],walkable:ground,passage:1.4};
 assert.match(placementProblems({kind:'crate-stack',x:0,z:-3,yaw:0,note},box,world)[0],/walk past/,'a box in the alley shuts the door off');
 // Without the door it is a nook, and nobody's way.
 assert.deepEqual(placementProblems({kind:'crate-stack',x:0,z:-3,yaw:0,note},box,{...world,doors:[]}),[]);
 // A fence 0.08 m thick (thinner than the 0.2 m squares) across a 4 m area leaves 2 m; a bench 0.78 m deep against
 // the edge leaves 1.2 m between it and the fence, and that is too narrow.
 const area=(x,z)=>z>=0&&z<=4&&Math.abs(x)<30,fence={x:0,z:2.05,w:60,d:.08};
 assert.match(placementProblems({kind:'bench',x:0,z:.39,yaw:0,note},{w:1.95,d:.78},{colliders:[fence],doors:[],walkable:area,passage:1.4})[0],/walk past/);
});
