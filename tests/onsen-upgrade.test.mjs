import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildOnsenInterior} from '../src/world/interiors/onsen.js';
import {ONSEN_CIRCUITS,ONSEN_UPGRADED_CIRCUITS,ONSEN_UPGRADE,ONSEN_LOCKOUT,ONSEN_CONTRACT,ONSEN_BOARD,ONSEN_SCENARIOS,AT_REST,
 stageScenario,assess,settle,houseAmps,loadOf,circuitOf,circuitsNow,contractNow,tripSeconds,isLive,isOn,isWorking,trip,reset,resetAll,
 switchOn,boardDoor,boardUpgrade,lockOut} from '../src/world/interiors/onsen-electrics.js';
import {measure} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {provideCatalog} from './catalog-fixture.mjs';
await provideCatalog('massage-chair');

// The ending of "Fujita's Back" (page 9): Tetsuo locks the main off, gives the left mirror's dryer a branch of its own in an
// add-on box under the full board, and fits a 60 A supply breaker. A later step the film and stories set by name; the
// town plays the board as it is.
const build=()=>{const room=new THREE.Group(),hits=[],actions=[];const layout=buildOnsenInterior({room,reg:(o,label,fn)=>hits.push({o,label,fn}),action:(...a)=>actions.push(a),exit(){}});room.updateMatrixWorld(true);return {room,hits,actions,layout};};
const meshes=root=>{const list=[];root.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh)list.push(o);});return list;};
const shown=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const box=o=>{o.updateWorldMatrix(true,true);return new THREE.Box3().setFromObject(o);};
const UPGRADE_PARTS=['Add-on breaker box','Tape label changing-sockets (upgrade)','Tape label circuit list 1 (upgrade)','Tape label circuit list 9 (upgrade)','Supply breaker label (60A)'];

test('the town plays the board as it is: eight ways, 40 A, no lock, and none of the ending shows',()=>{
 const {room,layout}=build();
 for(const name of ['rest','quiet','evening','last-straw','blackout','retrip','restored','isolated']){
  const a=stageScenario(name);assert.equal(a.circuits.length,8,name);assert.equal(a.contract.rating,40,name);assert.equal(a.upgraded,false);assert.equal(a.locked,false);
  assert.equal(circuitOf('dryer-1'),'changing-sockets',name+': the left mirror shares circuit 1 with the chair');
  for(const n of UPGRADE_PARTS)assert.equal(shown(room.getObjectByName(n)),false,name+': '+n+' hidden');
  assert.equal(shown(room.getObjectByName('Main lock-out')),false,name+': no lock');
  assert.ok(shown(room.getObjectByName('Supply breaker label')),name+': 契約 40A');}
 // The blackout still happens on 40 A, which is why the upgrade is not the town's default.
 assert.equal(stageScenario('blackout').contract.live,false);
 assert.throws(()=>isLive('vanity-1'),/fitted in the upgrade/);
 assert.equal(contractNow(),ONSEN_CONTRACT);assert.equal(circuitsNow(),ONSEN_CIRCUITS);
 // An upgraded moment does not leak into the next one.
 stageScenario('upgraded');assert.equal(stageScenario('restored').contract.rating,40);assert.equal(circuitsNow().length,8);
 layout.dispose();stageScenario('rest');
});

test('the upgrade moves load between breakers and takes none away: the supply breaker sees the same 60.46 A, now on 60 A',()=>{
 const U=ONSEN_UPGRADE;
 for(const k of ['by','when','en','route'])assert.ok(U[k].length>20,k);
 for(const k of ['why','period'])assert.ok(U.box[k].length>60,'the box says '+k);
 for(const k of ['why','isolation','period'])assert.ok(U.contract[k].length>60,'the contract says '+k);
 assert.equal(U.contract.amps,60);assert.equal(U.contract.label.amps,'60A');assert.equal(U.contract.label.jp,'契約');
 assert.equal(U.contract.amps,ONSEN_BOARD.main.amps,'as far as the 60 A main allows');
 // Honest numbers in the words: everything at once is still 60.46 A, a hair over 60, and it holds without headroom.
 assert.match(U.contract.why,/60\.46 A/);assert.match(U.contract.why,/holds/);assert.doesNotMatch(U.contract.why,/never (trip|go)s? again|run everything/i);
 assert.match(U.contract.isolation,/ahead of the board’s main/);
 // The upgraded board: circuit 1 the chair alone, the ninth the left mirror's dryer; the same loads, each on one circuit.
 assert.deepEqual(ONSEN_UPGRADED_CIRCUITS.map(c=>c.no),[1,2,3,4,5,6,7,8,9]);
 const ids=c=>c.flatMap(x=>x.loads.map(l=>l.id)).sort();
 assert.deepEqual(ids(ONSEN_UPGRADED_CIRCUITS),ids(ONSEN_CIRCUITS),'not a load added or taken away');
 const one=ONSEN_UPGRADED_CIRCUITS.find(c=>c.id==='changing-sockets'),nine=ONSEN_UPGRADED_CIRCUITS.find(c=>c.id==='vanity-1');
 assert.deepEqual(one.loads.map(l=>l.id),['massage-chair']);assert.deepEqual(nine.loads.map(l=>l.id),['dryer-1']);
 assert.equal(nine.amps,20);assert.equal(nine.fitted,'upgrade');assert.match(nine.tape.jp,/ドライヤー/);assert.match(one.tape.jp,/椅子/);
 for(const c of ONSEN_UPGRADED_CIRCUITS.filter(c=>c.tape))assert.match(c.tape.jp,/^[\p{Script=Han}\p{Script=Katakana}ー・ ]+$/u,'tape in Japanese: '+c.id);
 const all=['dryer-1','dryer-2','dryer-3','kettle','massage-chair'];
 const before=stageScenario('last-straw');
 let a=stageScenario('upgraded');assert.equal(a.circuits.length,9);assert.equal(a.contract.rating,60);assert.ok(Math.abs(a.contract.amps-9.46)<1e-9,'at rest 9.46 A');
 assert.equal(circuitOf('dryer-1'),'vanity-1');assert.equal(circuitOf('massage-chair'),'changing-sockets');
 for(const id of all)switchOn(id);a=assess();
 assert.ok(Math.abs(a.contract.amps-before.contract.amps)<1e-9,'the same total the supply breaker sees: '+a.contract.amps);
 assert.ok(Math.abs(a.contract.amps-houseAmps())<1e-9&&Math.abs(houseAmps()-60.46)<1e-9);
 assert.ok(a.contract.amps>a.contract.rating,'a hair over the 60 A on its face');
 assert.equal(a.contract.tripIn,Infinity,'inside the 105 % a breaker carries: it holds');assert.equal(a.main.tripIn,Infinity);
 assert.ok(a.contract.amps/a.contract.rating<1.05);
 for(const c of a.circuits){assert.ok(!c.over,c.id+' within its 20 A');}
 assert.equal(a.circuits.find(c=>c.id==='changing-sockets').amps,2);assert.equal(a.circuits.find(c=>c.id==='vanity-1').amps,12);
 assert.deepEqual(settle(),[],'nothing lets go');
 // Without headroom: one more 13 A pot on top would take it over 105 % and it would warm and go.
 assert.ok(Number.isFinite(tripSeconds(a.contract.amps+13,60)));
 // The ninth is fed from the board's load side: the main and the earth-leakage breaker switch it, and its own breaker only it.
 trip('vanity-1');assert.equal(isWorking('dryer-1'),false);assert.ok(isWorking('dryer-2')&&isWorking('massage-chair'));reset('vanity-1');
 trip('elcb');assert.equal(isLive('vanity-1'),false);reset('elcb');trip('main');assert.equal(isLive('vanity-1'),false);reset('main');
 assert.equal(isWorking('dryer-1'),true);
 // boardUpgrade() sets it outside a moment too, and the dryer goes with its socket.
 stageScenario('rest');assert.equal(boardUpgrade(true),true);assert.equal(circuitOf('dryer-1'),'vanity-1');assert.equal(assess().contract.rating,60);
 assert.equal(boardUpgrade(false),false);assert.equal(circuitOf('dryer-1'),'changing-sockets');
 stageScenario('rest');
});

test('locked out: the main off, locked and tagged; nothing puts it up until the lock is off, and the door will not shut over it',()=>{
 const L=ONSEN_LOCKOUT;
 for(const k of ['tag','padlock','clamp'])assert.ok(L[k].why.length>50,k);assert.ok(L.why.length>80&&L.door.length>40);
 assert.equal(L.tag.jp,'投入禁止');assert.equal(L.tag.head,'作業中');
 assert.match(L.why,/supply breaker .* still live/,'the lock does not make the supply breaker dead');
 for(const name of ['locked-out','upgraded-locked-out']){const s=ONSEN_SCENARIOS[name];assert.ok(s.lock&&s.down.includes('main')&&s.board==='open',name);assert.ok(s.en.length>60);}
 assert.equal(!!ONSEN_SCENARIOS['locked-out'].upgrade,false);assert.equal(ONSEN_SCENARIOS['upgraded-locked-out'].upgrade,true);
 assert.ok(ONSEN_SCENARIOS.upgraded.upgrade&&!ONSEN_SCENARIOS.upgraded.lock&&!ONSEN_SCENARIOS.upgraded.down.length);
 let a=stageScenario('locked-out');assert.equal(a.locked,true);assert.equal(isOn('main'),false);assert.equal(a.main.amps,0);
 for(const c of a.circuits)assert.equal(c.live,false,c.id+' dead');assert.equal(isLive('contract'),true,'the supply breaker, ahead of the main, is still live');
 assert.equal(reset('main'),false,'locked: it stays down');resetAll();assert.equal(isOn('main'),false,'resetAll leaves a locked main down');
 assert.throws(()=>boardDoor('shut'),/will not shut over the lock-out/);assert.equal(boardDoor(),ONSEN_BOARD.door.open);
 assert.equal(lockOut(false),false);assert.equal(reset('main'),true);assert.equal(isLive('lobby'),true,'lock off, main up: the house comes back');
 assert.throws(()=>lockOut(true),/Switch the main off/,'a lock goes on an isolated switch');
 trip('main');boardDoor('shut');assert.equal(lockOut(true),true);assert.ok(boardDoor()>=L.doorMin,'locking it opens the door');
 stageScenario('rest');assert.equal(lockOut(),false,'a moment that does not name the lock has none');
});

test('the add-on box under the board: on the wall, clear of the board, the pole and Miss Higa, its lever in her reach',()=>{
 stageScenario('upgraded-locked-out');const {room,hits,actions,layout}=build();
 const X=ONSEN_UPGRADE.box,addon=room.getObjectByName(X.en),b=box(addon);
 for(const n of UPGRADE_PARTS)assert.ok(shown(room.getObjectByName(n)),n+' shows');
 assert.equal(shown(room.getObjectByName('Supply breaker label')),false,'the 40A label is gone with the old breaker');
 assert.ok(shown(room.getObjectByName('Main lock-out')),'the lock shows');
 assert.ok(Math.abs(b.min.x-X.wallX)<.002,'its back on the wall face');
 const board=box(room.getObjectByName('Breaker board')),contract=box(room.getObjectByName('Supply breaker'));
 assert.ok(Math.abs(b.max.y-board.min.y)<.002,'its conduit runs up into the board’s bottom');
 const body=box(room.getObjectByName('Add-on breaker box body'));assert.ok(body.max.y<board.min.y-.01&&body.min.z>board.min.z&&body.max.z<contract.min.z,'under the board, on the contract side');
 // Nothing clips it but the board its conduit enters; the noren pole lifts off its hooks under it.
 const own=new Set(meshes(addon)),boardOwn=new Set(meshes(room.getObjectByName('Breaker board'))),shrunk=b.clone().expandByScalar(-.002);
 for(const o of meshes(room)){if(own.has(o)||boardOwn.has(o)||o.userData.wall||/^(Umi-no-yu floor|Umi-no-yu sea view)$/.test(o.name))continue;const ob=box(o);if(ob.isEmpty())continue;
  assert.ok(!shrunk.intersectsBox(ob),'the add-on box clips '+(o.name||o.type));}
 const pole=new THREE.Box3();for(const o of meshes(room).filter(m=>/^Noren pole/.test(m.name)&&box(m).max.z>body.min.z&&box(m).min.z<body.max.z))pole.union(box(o));
 assert.ok(body.min.y-pole.max.y>.03,'room to lift the noren pole off its hooks: '+(body.min.y-pole.max.y).toFixed(3)+' m');
 // In Miss Higa's reach from her stool, like every lever on the board; out of a customer's.
 const K=ONSEN_BOARD.keeper,m=measure(recipeFor(K.who)),reach=m.upper+m.fore+m.hand/2+(m.shoulderY-m.hipY)*Math.sin(K.lean*Math.PI/180);
 const shoulderY=K.seat[1]+m.seatDrop+m.shoulderY-m.hipY,lever=room.getObjectByName('Breaker lever vanity-1').getWorldPosition(new THREE.Vector3());
 const d=Math.min(...[-1,1].map(s=>new THREE.Vector3(K.seat[0],shoulderY,K.seat[2]+s*m.shoulderX).distanceTo(lever)));assert.ok(d<=reach,'she reaches it: '+d.toFixed(2));
 const counter=box(room.getObjectByName('Bandai counter')),tall=measure(recipeFor('Tetsuo'));
 assert.ok(new THREE.Vector3(counter.max.x+.3,1.3,2.35).distanceTo(lever)>tall.upper+tall.fore+tall.hand+.35,'out of a customer’s reach');
 // Its lever follows its breaker; its reset anchor shows only when it is down.
 const pivot=room.getObjectByName('Breaker lever vanity-1');assert.ok(pivot.rotation.x<Math.PI/2,'up');
 const anchor=hits.find(h=>h.label==='Reset the left mirror dryer');assert.ok(anchor);
 assert.equal(anchor.o.visible,false);trip('vanity-1');assert.ok(pivot.rotation.x>Math.PI/2,'down');assert.equal(anchor.o.visible,true);reset('vanity-1');
 // The main's reset anchor refuses while it is locked.
 const main=hits.find(h=>h.label==='Reset the main breaker');assert.equal(main.o.visible,true);
 main.fn();assert.match(actions.at(-1)[1],/Locked off/);assert.equal(isOn('main'),false,'still off');
 layout.dispose();stageScenario('rest');
});

test('the lock and tag hang from the main’s lever, between branch breakers 1 and 2, and clear the open door',()=>{
 stageScenario('locked-out');const {room,layout}=build();
 const tag=box(room.getObjectByName('Lock-out tag')),lock=box(room.getObjectByName('Main lock-out'));
 for(const id of ['changing-sockets','changing-lights']){const br=box(room.getObjectByName('Breaker '+id));
  assert.ok(tag.max.z<=br.min.z+1e-6||tag.min.z>=br.max.z-1e-6,'the tag hangs beside breaker '+id+', not over it');}
 const mainBox=box(room.getObjectByName('Breaker main'));assert.ok(lock.min.x>mainBox.min.x,'in front of the main');
 assert.ok(tag.min.y>box(room.getObjectByName('Tape label changing-sockets')).max.y,'above the branch labels');
 const door=box(room.getObjectByName('Breaker board door panel'));assert.ok(!door.intersectsBox(lock),'clear of the open door');
 const text=room.getObjectByName('Lock-out tag');assert.ok(text.material.side===THREE.DoubleSide||text.material.color);
 layout.dispose();stageScenario('rest');
});
