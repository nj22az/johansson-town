import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildOnsenInterior,ONSEN_ROOM} from '../src/world/interiors/onsen.js';
import {ONSEN_CIRCUITS,ONSEN_BOARD,ONSEN_CONTRACT,ONSEN_RESET,ONSEN_REWIRING,ONSEN_VOLTS,ONSEN_SCENARIOS,AT_REST,loadOf,wattsOf,overloaded,houseAmps,tripSeconds,circuitOf,trip,reset,resetAll,isLive,isOn,isPowered,isRunning,isWorking,switchOn,switchOff,assess,advance,settle,higaReset,boardDoor,stageScenario} from '../src/world/interiors/onsen-electrics.js';
import {ONSEN_TOWELS,TOWEL_PRICE} from '../src/world/interiors/onsen-towels.js';
import {FEED_PLACES} from '../src/feed/places.js';
import {measure} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {provideCatalog} from './catalog-fixture.mjs';
// The massage chair's model in hand (World's catalogue), as the game has it before it opens the door: Fujita's offering
// stands on its arm, and the room's own parts on it (the coin timer, the rollers, the cord, the plate) are on its anchors.
await provideCatalog('massage-chair');

const build=()=>{const room=new THREE.Group(),hits=[],actions=[];const layout=buildOnsenInterior({room,reg:(o,label,fn)=>hits.push({o,label,fn}),action:(...a)=>actions.push(a),exit(){}});room.updateMatrixWorld(true);return {room,hits,actions,layout};};
const circuit=id=>ONSEN_CIRCUITS.find(c=>c.id===id);
const meshes=room=>{const list=[];room.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh)list.push(o);});return list;};

test('every mirror on its own branch: no branch is over its 20 A even with everything on, and the house idles at 9.46 A',()=>{
 assert.equal(ONSEN_VOLTS,100);
 // The board as it is now (the rewiring is history: ONSEN_REWIRING): the left mirror and the chair on circuit 1, the middle
 // and right mirrors on circuits 7 and 8.
 assert.deepEqual(ONSEN_CIRCUITS.map(c=>c.no),[1,2,3,4,5,6,7,8]);
 assert.deepEqual(['dryer-1','dryer-2','dryer-3','massage-chair','kettle'].map(circuitOf),['changing-sockets','vanity-2','vanity-3','changing-sockets','lobby']);
 assert.deepEqual(circuit('changing-sockets').loads.map(l=>l.watts),[1200,200]);
 assert.equal(loadOf('changing-sockets'),14,'one dryer and the chair: 14 A');
 for(const id of ['vanity-2','vanity-3'])assert.equal(loadOf(id),12,id+': one dryer');
 assert.ok(Math.abs(loadOf('lobby')-15.01)<1e-9,'the lobby with the pot boiling: 15.01 A');
 for(const c of ONSEN_CIRCUITS){
  assert.equal(c.volts,100,c.id);assert.equal(c.amps,20,c.id+' is a 20 A branch');
  assert.ok(!overloaded(c.id),c.id+' within its rating even with everything on: '+loadOf(c.id)+' A');
  assert.ok(loadOf(c.id,c.normal)<=c.amps,c.id+' within rating in normal use');
  assert.ok(c.jp&&c.en&&c.why.length>30,c.id+' is labelled and explained');
  for(const l of c.loads){assert.ok(l.watts>0,l.id);assert.ok(typeof l.purpose==='string'&&l.purpose.length>20,l.id+' has a purpose');}
 }
 // The ways wired in the rewiring and circuit 1's new name carry their tape; the history is in the data.
 assert.deepEqual(ONSEN_CIRCUITS.filter(c=>c.fitted).map(c=>c.id),ONSEN_REWIRING.ways);
 assert.deepEqual(ONSEN_CIRCUITS.filter(c=>c.tape).map(c=>c.id).sort(),[...ONSEN_REWIRING.ways,...ONSEN_REWIRING.relabelled].sort());
 for(const c of ONSEN_CIRCUITS.filter(c=>c.tape)){assert.match(c.tape.jp,/^[\p{Script=Han}\p{Script=Katakana}ー・ ]+$/u,'the tape is written in Japanese');assert.ok(c.tape.en.length>5);}
 assert.ok(ONSEN_REWIRING.route.length>30&&ONSEN_REWIRING.tape.why.length>30);
 // At rest the house draws 946 W: the lamps, the andon, the television, the fan, the sterilizer, the cooler and the pump.
 assert.ok(Math.abs(houseAmps(AT_REST)-9.46)<1e-9,'idle: '+houseAmps(AT_REST));
 // Everything at once is 60.46 A: a hair over the main's 60 A, under the 105 % it never trips below; the contract is 40 A.
 assert.ok(Math.abs(houseAmps()-60.46)<1e-9,'everything: '+houseAmps());
 assert.equal(tripSeconds(houseAmps(),ONSEN_BOARD.main.amps),Infinity,'the main never trips');
 assert.ok(Number.isFinite(tripSeconds(houseAmps(),ONSEN_CONTRACT.amps)),'the supply breaker does');
 const ids=ONSEN_CIRCUITS.flatMap(c=>c.loads.map(l=>l.id));assert.equal(new Set(ids).size,ids.length,'every load on one circuit');
});

test('the supply breaker: 40 A, ahead of the board, and the busy evening trips it, not a branch and not the main',()=>{
 resetAll();stageScenario('rest');
 const C=ONSEN_CONTRACT;assert.equal(C.amps,40);assert.equal(C.id,'contract');assert.ok(C.amps<ONSEN_BOARD.main.amps,'smaller than the main');
 for(const k of ['why','where','period','region'])assert.ok(C[k].length>60,'the supply breaker says '+k);
 assert.equal(C.label.amps,'40A');
 const at=(ids)=>houseAmps([...AT_REST,...ids]);
 // The busy evening's numbers (card.json): idle 9.46, three dryers 36, the pot 13, the chair 2.
 const rush=at(['dryer-1','dryer-2','dryer-3','kettle']),all=at(['dryer-1','dryer-2','dryer-3','kettle','massage-chair']);
 assert.ok(Math.abs(rush-58.46)<1e-9&&Math.abs(all-60.46)<1e-9,rush+' / '+all);
 assert.ok(all/C.amps>1.5&&all/C.amps<1.52,'one and a half times the contract');
 // Thermal: minutes, not at once (and inside JIS: within 4 minutes at 200 % for a 40 A breaker).
 const tRush=tripSeconds(rush,C.amps),tAll=tripSeconds(all,C.amps);
 assert.ok(tRush>240&&tRush<360,'the rush alone lets go in about five minutes: '+tRush.toFixed(0)+' s');
 assert.ok(tAll>180&&tAll<tRush,'with the chair a little sooner: '+tAll.toFixed(0)+' s');
 assert.ok(tripSeconds(2*C.amps,C.amps)<=240);
 // What holds: without the pot and with one dryer fewer, or the pot with one dryer; the quiet evening.
 assert.ok(Math.abs(at(['dryer-1','dryer-2','massage-chair'])-35.46)<1e-9);assert.equal(tripSeconds(at(['dryer-1','dryer-2','massage-chair']),C.amps),Infinity,'two dryers and the chair hold');
 assert.equal(tripSeconds(at(['dryer-2','kettle']),C.amps),Infinity,'one dryer and the pot hold');
 // Staged and left to run: the supply breaker lets go first; every branch and the main stay up.
 for(const id of ['dryer-1','dryer-2','dryer-3','kettle','massage-chair'])switchOn(id);
 const a=assess();assert.ok(a.contract.over);assert.equal(a.main.tripIn,Infinity,'the main carries 60.46 A (under 105 % of 60)');for(const c of a.circuits)assert.ok(!c.over,c.id);
 assert.deepEqual(advance(a.contract.tripIn*.5),[]);assert.equal(isLive('contract'),true,'still up halfway');
 assert.deepEqual(advance(a.contract.tripIn*.6),['contract'],'CLICK');
 assert.equal(isOn('contract'),false);for(const id of ['main','elcb',...ONSEN_CIRCUITS.map(c=>c.id)])assert.equal(isOn(id),true,id+' lever still up');
 for(const c of ONSEN_CIRCUITS)assert.equal(isLive(c.id),false,c.id+' dead: the whole house');
 assert.equal(assess().contract.amps,0);
 resetAll();stageScenario('rest');
});

test('the reset: straight back up under load it lets go again in about a second; with the dryers, the chair and the pot off it holds',()=>{
 assert.deepEqual(ONSEN_RESET.steps.map(s=>s.do),['switchOff','switchOff','switchOff','reset']);
 assert.deepEqual(ONSEN_RESET.steps.flatMap(s=>s.loads||[]),['dryer-1','dryer-2','dryer-3','massage-chair','kettle'],'Tetsuo’s order: the dryers, the chair, her pot');
 assert.equal(ONSEN_RESET.steps.at(-1).breaker,'contract');
 for(const s of ONSEN_RESET.steps)assert.ok(s.why.length>30&&s.en.length>10&&s.by.length>3);
 let a=stageScenario('blackout');
 assert.equal(isOn('contract'),false);assert.equal(isRunning('kettle'),true,'the pot still switched on in the dark');
 assert.equal(isRunning('massage-chair'),false,'the chair forgot its coin');
 // Her first reset, without looking and with everything still on: the lights come on, and the breaker, still hot, goes again.
 assert.deepEqual(advance(2),[],'two seconds in the dark');assert.equal(reset('contract'),true);
 a=assess();assert.ok(Math.abs(a.contract.amps-58.46)<1e-9,'everything still on: '+a.contract.amps);
 assert.ok(a.contract.tripIn>.5&&a.contract.tripIn<1.5,'it lets go again in about a second: '+a.contract.tripIn.toFixed(2)+' s');
 assert.ok(isWorking('lobby-lamp'),'the lights blink on');assert.deepEqual(advance(1.5),['contract'],'CLACK');
 assert.equal(isWorking('lobby-lamp'),false,'dark again');
 // The 'retrip' moment stages that one second: lever up, lamps lit, held for the camera; let go, it clacks.
 a=stageScenario('retrip');
 assert.equal(isOn('contract'),true);assert.ok(isWorking('women-tube')&&isWorking('lobby-lamp')&&isWorking('dryer-2')&&isWorking('kettle'));
 assert.equal(isRunning('massage-chair'),false,'the chair does not restart: its coin is gone');
 assert.ok(a.contract.tripIn>.5&&a.contract.tripIn<1.5,'about a second: '+a.contract.tripIn.toFixed(2));
 assert.deepEqual(advance(10),[],'held for the camera');assert.equal(switchOn('dryer-2'),false,'any switch lets the moment go');assert.deepEqual(advance(1.5),['contract'],'released, it goes again');
 // Then the reset that holds: the dryers, the chair and the pot off, the lever up; the hot breaker carries the idle house.
 a=higaReset();assert.equal(isOn('contract'),true);for(const id of ['dryer-1','dryer-2','dryer-3','massage-chair','kettle'])assert.equal(isRunning(id),false,id+' off');
 assert.ok(Math.abs(a.contract.amps-9.46)<1e-9);assert.equal(a.contract.tripIn,Infinity);assert.deepEqual(advance(7200),[],'it holds');
 // Even the pot alone off is not enough with three dryers back on a hot breaker.
 stageScenario('blackout');switchOff('kettle');reset('contract');assert.ok(assess().contract.over);assert.ok(assess().contract.tripIn<1,'45.46 A on a hot breaker');
 // The 'restored' moment: the house at rest, under the contract, and it holds.
 a=stageScenario('restored');
 assert.ok(a.contract.amps<ONSEN_CONTRACT.amps,'restored: '+a.contract.amps);assert.ok(Math.abs(a.contract.amps-9.46)<1e-9);
 assert.equal(isRunning('kettle'),false);assert.deepEqual(advance(7200),[],'it holds');
 stageScenario('rest');
});

test('the pot: Miss Higa’s tea on the bandai, 1 300 W on the lobby circuit, switched like the other loads, its lamp and plug showing it',()=>{
 resetAll();stageScenario('rest');const {room,layout}=build();
 const K=ONSEN_CIRCUITS.flatMap(c=>c.loads).find(l=>l.id==='kettle'),P=K.prop;
 assert.equal(K.watts,1300);assert.equal(K.atRest,'off');assert.equal(circuitOf('kettle'),'lobby');assert.match(K.jp,/電気ポット/);
 for(const k of ['for','why','period'])assert.ok(P[k].length>60,'the pot says '+k);assert.ok(K.purpose.length>40);
 assert.equal(P.on,'Bandai top');
 const pot=room.getObjectByName('Electric pot'),top=new THREE.Box3().setFromObject(room.getObjectByName('Bandai top')),pb=new THREE.Box3().setFromObject(pot);
 assert.ok(Math.abs(pb.min.y-top.max.y)<.001,'it stands on the bandai top: '+pb.min.y.toFixed(3));
 assert.ok(pb.min.x>top.min.x+.02&&pb.max.x<top.max.x&&pb.min.z>top.min.z&&pb.max.z<top.max.z,'on the counter, not over its edge');
 const h=pb.max.y-pb.min.y;assert.ok(h>.3&&h<.36,'a 3-litre pot is about a third of a metre tall: '+h.toFixed(3));
 // Clear of the andon, the ticket tray and her account book.
 for(const n of ['Andon base','Andon','Ticket tray','Account book cover','Push-button phone'])assert.ok(!pb.intersectsBox(new THREE.Box3().setFromObject(room.getObjectByName(n))),'clear of '+n);
 // In her reach from the stool; out of a customer's.
 const Kp=ONSEN_BOARD.keeper,m=measure(recipeFor(Kp.who)),reach=m.upper+m.fore+m.hand/2+(m.shoulderY-m.hipY)*Math.sin(Kp.lean*Math.PI/180);
 const shoulderY=Kp.seat[1]+m.seatDrop+m.shoulderY-m.hipY,lid=new THREE.Vector3((pb.min.x+pb.max.x)/2,pb.max.y,(pb.min.z+pb.max.z)/2);
 assert.ok(Math.min(...[-1,1].map(s=>new THREE.Vector3(Kp.seat[0],shoulderY,Kp.seat[2]+s*m.shoulderX).distanceTo(lid)))<=reach,'she reaches its lid from her stool');
 // Its socket on the counter's inside face, on her side, and the cord clear of the counter, above the floor.
 assert.ok(room.getObjectByName(K.socket));const sb=new THREE.Box3().setFromObject(room.getObjectByName(K.socket+' plate')),counter=new THREE.Box3().setFromObject(room.getObjectByName('Bandai counter'));
 assert.ok(Math.abs(sb.max.x-counter.min.x)<.002,'on the counter’s inside face');
 const cordClear=()=>{const c=room.getObjectByName('Electric pot cord');c.updateMatrixWorld(true);const p=c.geometry.attributes.position,v=new THREE.Vector3(),solid=[top,counter].map(b=>b.clone().expandByScalar(-.0015));
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(c.matrixWorld);for(const b of solid)assert.ok(!b.containsPoint(v),'the pot’s cord passes into the counter at '+v.toArray().map(n=>n.toFixed(3)));}};
 // At rest: unplugged, lamp dark, the magnet plug lying on the counter beside it.
 const lamp=room.getObjectByName('Electric pot boil lamp'),plug=room.getObjectByName('Electric pot magnet plug');
 assert.equal(lamp.material.emissiveIntensity,0);assert.deepEqual(layout.power.appearance('kettle'),{id:'kettle',working:false,lamp:false,plugged:false});
 const lying=new THREE.Box3().setFromObject(plug);assert.ok(Math.abs(lying.min.y-top.max.y)<.001&&!lying.intersectsBox(pb),'the plug lies on the counter beside it');cordClear();
 // Switched on: plugged, the 沸騰 lamp lit, 13 A on the lobby circuit; and dark in the blackout with its switch still on.
 switchOn('kettle');room.updateMatrixWorld(true);assert.ok(lamp.material.emissiveIntensity>0);assert.equal(layout.power.appearance('kettle').plugged,true);cordClear();
 const on=new THREE.Box3().setFromObject(plug);assert.ok(on.min.y>top.max.y+.02&&on.max.x<=pb.min.x+.004&&on.min.x>top.min.x,'the plug on the pot’s back, over the counter');
 assert.equal(assess().circuits.find(c=>c.id==='lobby').amps,15.01);
 trip('contract');assert.equal(lamp.material.emissiveIntensity,0,'dark in the blackout');assert.equal(isRunning('kettle'),true);
 resetAll();switchOff('kettle');layout.dispose();stageScenario('rest');
});

test('tripping a breaker drops its lever and puts its lamps out at once; reset brings them back',()=>{
 resetAll();const {room,hits,layout}=build();
 const lamp=room.getObjectByName('Changing-room pendant lamp'),light=room.getObjectByName('Changing-room light');
 const lever=room.getObjectByName('Breaker lever changing-lights');
 assert.ok(lamp&&light?.isPointLight&&lever);
 const lit={emissive:lamp.material.emissiveIntensity,light:light.intensity,lever:lever.rotation.x};
 assert.ok(lit.emissive>0&&lit.light>0);
 const resetAnchor=hits.find(h=>h.label==='Reset the changing-room lights').o;assert.equal(resetAnchor.visible,false,'nothing to reset yet');
 assert.equal(trip('changing-lights'),true);
 assert.equal(isLive('changing-lights'),false);assert.equal(isLive('changing-sockets'),true,'only that circuit');
 assert.equal(lamp.material.emissiveIntensity,0);assert.equal(light.intensity,0);
 assert.ok(lever.rotation.x>Math.PI/2,'lever down');assert.equal(resetAnchor.visible,true);
 // Ticking the room does not bring a dead lamp back or make it flicker.
 for(let i=0;i<20;i++){layout.tick(1/30,1200+i);assert.equal(light.intensity,0);assert.equal(lamp.material.emissiveIntensity,0);}
 // Other areas stay lit.
 assert.ok(room.getObjectByName('Lobby light').intensity>0&&room.getObjectByName('Bath hall light west').intensity>0);
 // Seen from inside the changing room, the house fill drops too; from the lobby it hardly does.
 let hemi;room.traverse(o=>{if(o.isHemisphereLight)hemi=o;});
 const look=z=>{const cam=new THREE.PerspectiveCamera();cam.position.set(0,1.6,z);cam.updateMatrixWorld();room.getObjectByName('Breaker board plate').onBeforeRender(null,null,cam);return hemi.intensity;};
 const inside=look(.2),lobby=look(4);assert.ok(inside<lobby*.8,`changing room ${inside.toFixed(2)} darker than the lobby ${lobby.toFixed(2)}`);
 assert.ok(Math.abs(look(1.62)-look(1.58))<.05,'no step at the doorway');
 assert.equal(reset('changing-lights'),true);assert.equal(look(.2),look(4),'all lit again');
 assert.equal(lamp.material.emissiveIntensity,lit.emissive);assert.equal(light.intensity,lit.light);assert.equal(lever.rotation.x,lit.lever);assert.equal(resetAnchor.visible,false);
 layout.dispose();
});

test('a branch trips on its own: its things go dead, the reset prompt appears; the main and the supply breaker take everything',()=>{
 resetAll();stageScenario('rest');const {room,hits,actions,layout}=build();
 trip('changing-sockets');
 assert.equal(isPowered('dryer-1'),false);assert.equal(isPowered('massage-chair'),false);assert.equal(isPowered('fan'),true,'the fan is on the lobby circuit');
 assert.equal(isPowered('dryer-2'),true,'the middle mirror is on a circuit of its own');
 const r=hits.find(h=>h.label==='Reset the changing-room sockets');assert.equal(r.o.visible,true);
 r.fn();assert.equal(isLive('changing-sockets'),true);assert.match(actions.at(-1)[2],/The power comes back/);
 trip('vanity-2');hits.find(h=>h.label==='Use a hair dryer').fn();assert.match(actions.at(-1)[2],/middle mirror dryer breaker has tripped/);
 hits.find(h=>h.label==='Reset the middle mirror dryer').fn();assert.equal(isLive('vanity-2'),true);
 hits.find(h=>h.label==='Use a hair dryer').fn();assert.match(actions.at(-1)[2],/circuit of its own/);
 // The supply breaker takes the whole house; its reset prompt is Miss Higa's reset, the big things off first.
 switchOn('dryer-1');switchOn('kettle');trip('contract');for(const c of ONSEN_CIRCUITS)assert.equal(isLive(c.id),false,c.id);
 hits.find(h=>h.label==='Use a hair dryer').fn();assert.match(actions.at(-1)[2],/whole house is dark/);
 const rc=hits.find(h=>h.label==='Reset the supply breaker');assert.equal(rc.o.visible,true);
 rc.fn();assert.match(actions.at(-1)[2],/Switch off what’s in your hand/);assert.match(actions.at(-1)[2],/stays/);
 assert.equal(isRunning('kettle'),false);assert.equal(isRunning('dryer-1'),false);assert.equal(isLive('lobby'),true);assert.equal(rc.o.visible,false);
 // The main breaker and the earth-leakage breaker cut every branch.
 trip('main');for(const c of ONSEN_CIRCUITS)assert.equal(isLive(c.id),false,c.id);
 for(const name of ['Lobby light','Changing-room light','Bath hall light west','Bath hall light east'])assert.equal(room.getObjectByName(name).intensity,0,name);
 assert.equal(room.getObjectByName('Spout water').visible,false,'no pump, no spout');
 assert.ok(isOn('changing-sockets'),'the branch lever itself is still up');
 reset('main');trip('elcb');assert.equal(isLive('pump'),false);reset('elcb');assert.equal(isLive('pump'),true);
 assert.equal(room.getObjectByName('Spout water').visible,true);
 // The fan is on the lobby circuit: it stops where it is and starts again from there.
 const fanHead=room.getObjectByName('Fan socket')&&(()=>{let blades;room.traverse(o=>{if(o.isMesh&&o.geometry?.type==='CircleGeometry'&&o.parent?.parent?.position?.x===3.85)blades=o;});return blades;})();
 assert.ok(fanHead,'fan blades');trip('lobby');const still=fanHead.rotation.z;layout.tick(.5,1200);assert.equal(fanHead.rotation.z,still);
 assert.equal(room.getObjectByName('Lobby light').intensity,0);reset('lobby');layout.tick(.5,1200);assert.notEqual(fanHead.rotation.z,still);
 assert.throws(()=>trip('sauna'),/No such breaker/);
 layout.dispose();
});

test('the board reads well: inspect text, labels in data, and the audit hook only when auditing',async()=>{
 resetAll();
 let {hits,actions,layout}=build();
 hits.find(h=>h.label==='Look at the breaker board').fn();
 const [kind,title,text]=actions.at(-1);
 assert.equal(kind,'inspect');assert.match(title,/Breaker board/);
 for(const phrase of [/60 A main/,/earth-leakage/,/protects the cable/,/never fit a bigger breaker/,/changing-room sockets/,/bath pump/])assert.match(text,phrase);
 assert.match(text,/supply breaker, 契約 40A/);assert.match(text,/switch the big things off/);
 layout.dispose();
 const {installDOM}=await import('./fixtures.mjs');installDOM();
 globalThis.window.__JOHANSSON_AUDIT__={};
 ({layout}=build());
 const hook=globalThis.window.__JOHANSSON_AUDIT__.onsenPower;
 assert.ok(hook&&typeof hook.trip==='function'&&typeof hook.isLive==='function'&&hook.circuits===ONSEN_CIRCUITS);
 hook.trip('changing-sockets');assert.equal(isLive('changing-sockets'),false);hook.reset('changing-sockets');
 layout.dispose();assert.equal(globalThis.window.__JOHANSSON_AUDIT__.onsenPower,undefined,'removed on leaving');
 delete globalThis.window.__JOHANSSON_AUDIT__;
 ({layout}=build());layout.dispose();
});

test('the supply breaker hangs beside the board, on the stool side, a hand lower: on the wall, clipping nothing, in her reach',()=>{
 resetAll();stageScenario('rest');const {room,layout}=build();
 const C=ONSEN_CONTRACT,cb=room.getObjectByName('Supply breaker'),b=new THREE.Box3().setFromObject(cb),board=new THREE.Box3().setFromObject(room.getObjectByName('Breaker board'));
 assert.ok(Math.abs(b.min.x-C.wallX)<.002,'its back on the wall face');
 assert.ok(b.min.z>board.max.z+.03&&b.max.z<ONSEN_BOARD.keeper.seat[2],'between the board and her stool: '+b.min.z.toFixed(3)+'..'+b.max.z.toFixed(3));
 assert.ok(b.max.y<board.max.y&&b.min.y>board.min.y,'a hand lower than the board’s top, within its height');
 const lever=room.getObjectByName('Breaker lever contract');assert.ok(lever.rotation.x<Math.PI/2,'lever up');
 assert.ok(room.getObjectByName('Supply breaker label'),'契約 40A on its face');
 const own=new Set(meshes(cb)),shrunk=b.clone().expandByScalar(-.002);
 for(const o of meshes(room)){if(own.has(o)||o.userData.wall||/^(Umi-no-yu floor|Umi-no-yu sea view)$/.test(o.name)||o.parent?.name==='Umi-no-yu attendant')continue;const ob=new THREE.Box3().setFromObject(o);if(ob.isEmpty())continue;
  assert.ok(!shrunk.intersectsBox(ob),'the supply breaker clips '+(o.name||o.type));}
 trip('contract');assert.ok(lever.rotation.x>Math.PI/2,'lever down when it lets go');reset('contract');
 layout.dispose();
});

test('the cabinet hangs behind the bandai, its door shut, every lever in Miss Higa\'s reach from her stool and nobody else\'s',()=>{
 resetAll();stageScenario('rest');const {room,layout}=build();
 const board=room.getObjectByName('Breaker board'),box=new THREE.Box3().setFromObject(board);
 // In the keeper's corner: over the bandai's raised floor, behind the counter, on the lobby's west wall.
 const platform=new THREE.Box3().setFromObject(room.getObjectByName('Bandai platform')),counter=new THREE.Box3().setFromObject(room.getObjectByName('Bandai counter'));
 assert.ok(box.min.z>ONSEN_ROOM.hall.front&&box.max.x<counter.min.x,'in the lobby, behind the counter');
 assert.ok(box.min.z>=counter.min.z&&box.max.z<=platform.max.z&&box.max.x<platform.max.x,'in the keeper\'s corner, over the bandai floor, the counter between it and the lobby');
 assert.ok(Math.abs(box.min.x-ONSEN_BOARD.wallX)<.002,'its back is on the wall face');
 assert.ok(box.max.y<1.95&&box.max.y>1.8,'its top where a Japanese board hangs: '+box.max.y.toFixed(3));
 // Shut at rest, with the staff-only card on it; open only while someone works inside it.
 assert.equal(boardDoor(),0);assert.equal(room.getObjectByName('Breaker board door').rotation.y,0,'the door is shut');
 assert.ok(room.getObjectByName('Staff only card'),'関係者以外 on the door');
 assert.equal(ONSEN_SCENARIOS.isolated.board,'open','isolated opens it');
 for(const name of ['rest','quiet','evening','last-straw','blackout','retrip','restored'])assert.ok(!ONSEN_SCENARIOS[name].board,name+' leaves it shut');
 // Miss Higa reaches every lever from her stool: arm and a lean from the hip (ONSEN_BOARD.keeper), from the nearer shoulder.
 const K=ONSEN_BOARD.keeper,m=measure(recipeFor(K.who)),arm=m.upper+m.fore+m.hand/2,reach=arm+(m.shoulderY-m.hipY)*Math.sin(K.lean*Math.PI/180);
 const shoulderY=K.seat[1]+m.seatDrop+m.shoulderY-m.hipY,shoulders=[-1,1].map(s=>new THREE.Vector3(K.seat[0],shoulderY,K.seat[2]+s*m.shoulderX));
 const standing=[-1,1].map(s=>new THREE.Vector3(K.stand[0],K.stand[1]+m.shoulderY,K.stand[2]+s*m.shoulderX));
 const branches=[...ONSEN_CIRCUITS.map(c=>c.id),'contract'],levers=['main','elcb',...branches];
 const lever=id=>room.getObjectByName('Breaker lever '+id).getWorldPosition(new THREE.Vector3());
 for(const id of branches){const d=Math.min(...shoulders.map(s=>s.distanceTo(lever(id))));
  assert.ok(d<=reach,`Miss Higa reaches the ${id} lever from her stool: ${d.toFixed(2)} m (reach ${reach.toFixed(2)} m)`);}
 for(const id of levers){const d=Math.min(...standing.map(s=>s.distanceTo(lever(id))));
  assert.ok(d<=reach,`standing on the bandai floor she reaches the ${id} lever: ${d.toFixed(2)} m`);}
 // The board stands on the bandai floor's edge of the stool, not where she stands: her standing place is clear.
 assert.ok(!new THREE.Box3().setFromObject(room.getObjectByName('Attendant stool')).containsPoint(new THREE.Vector3(K.stand[0],K.stand[1]+.1,K.stand[2])),'she can stand beside her stool');
 // Nobody on the customer side can reach it: the counter is in the way.
 const customer=new THREE.Vector3(counter.max.x+.3,1.3,2.35),tall=measure(recipeFor('Tetsuo'));
 for(const id of levers)assert.ok(customer.distanceTo(room.getObjectByName('Breaker lever '+id).getWorldPosition(new THREE.Vector3()))>tall.upper+tall.fore+tall.hand+.35,'out of a customer\'s reach: '+id);
 // The shut cabinet, and the open one, touch nothing but the wall it hangs on (the levers stay inside the shut door).
 for(const state of ['shut','open']){boardDoor(state);
  const now=new THREE.Box3().setFromObject(board),own=new Set(meshes(board)),shrunk=now.clone().expandByScalar(-.002);
  // Miss Higa is checked vertex by vertex below: her box is far bigger than she is.
  const higa=room.getObjectByName('Umi-no-yu attendant'),hers=new Set(higa?meshes(higa):[]);
  // The sea view wraps round the bath 45–70 m out, so its box holds the whole house (onsen-night.js ONSEN_SEA_VIEW).
  for(const o of meshes(room)){if(own.has(o)||hers.has(o)||o.userData.wall||/^(Umi-no-yu floor|Umi-no-yu sea view)$/.test(o.name))continue;const ob=new THREE.Box3().setFromObject(o);if(ob.isEmpty())continue;
   assert.ok(!shrunk.intersectsBox(ob),state+': the board clips '+(o.name||o.type));}
  if(state==='shut'){const door=new THREE.Box3().setFromObject(room.getObjectByName('Breaker board door panel'));
   const tips=new THREE.Box3();for(const id of levers)tips.union(new THREE.Box3().setFromObject(room.getObjectByName('Breaker lever '+id)));
   assert.ok(tips.max.x<door.min.x,'the levers stay behind the shut door: '+tips.max.x.toFixed(3)+' < '+door.min.x.toFixed(3));}}
 boardDoor('shut');assert.throws(()=>boardDoor(200),/opens from 0/);
 // Her head and bun clear the board through her whole loop at the bandai (reading, then looking up), door shut or open.
 const higa=room.getObjectByName('Umi-no-yu attendant');
 if(higa&&meshes(higa).length)for(const state of ['shut','open']){boardDoor(state);room.updateMatrixWorld(true);const v=new THREE.Vector3();
  // Each part of the board on its own (the open door's box is a thin slab; the board's whole box would take in her shoulder).
  const parts=[...meshes(board),...meshes(room.getObjectByName('Supply breaker'))].map(m=>new THREE.Box3().setFromObject(m).expandByScalar(-.001)).filter(b=>!b.isEmpty()),solid={containsPoint:p=>parts.some(b=>b.containsPoint(p))};
  for(let f=0;f<30*28;f++){layout.tick(1/30,1170);if(f%30)continue;room.updateMatrixWorld(true);
   for(const o of meshes(higa)){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);if(o.isSkinnedMesh)o.applyBoneTransform(i,v);v.applyMatrix4(o.matrixWorld);
    assert.ok(!solid.containsPoint(v),`Miss Higa (${o.name}) passes into the board at ${v.toArray().map(n=>n.toFixed(3))}, door ${state}`);}}}}
 boardDoor('shut');
 layout.dispose();
});

test('dryers, chair and fan are plugged in, and the dryers carry legible ratings',()=>{
 resetAll();const {room,layout}=build();
 const all=meshes(room);
 for(let i=1;i<=3;i++){const d=room.getObjectByName('Hair dryer '+i);assert.ok(d,'dryer '+i);
  const bottom=new THREE.Box3().setFromObject(d).min.y;assert.ok(Math.abs(bottom-.81)<.003,'dryer '+i+' rests on the vanity at '+bottom.toFixed(3));
  assert.ok(room.getObjectByName('Vanity socket '+i));assert.ok(d.getObjectByName('Hair dryer rating sticker'));}
 const colours=new Set([1,2,3].map(i=>room.getObjectByName('Hair dryer '+i).children[0].material.color.getHex()));assert.equal(colours.size,3,'three different dryers');
 // Each dryer and its cord are named apart, so a film can hide one and keep the others.
 for(let i=1;i<=3;i++){assert.equal(all.filter(m=>m.name==='Hair dryer '+i+' cord').length,1,'dryer '+i+'’s cord');assert.ok(room.getObjectByName('Hair dryer '+i).isGroup,'dryer '+i+' is one object');}
 for(const name of ['Massage chair socket','Fan socket','Massage chair rating plate','Massage chair cord','Fan cord'])assert.ok(room.getObjectByName(name),name);
 // Every socket named by a load exists.
 for(const c of ONSEN_CIRCUITS)for(const l of c.loads)if(l.socket)assert.ok(room.getObjectByName(l.socket),l.socket);
 // Cords stay above the surfaces they cross.
 for(const cord of all.filter(m=>/cord$/i.test(m.name)&&m.geometry.type==='TubeGeometry')){const b=new THREE.Box3().setFromObject(cord);assert.ok(b.min.y>=-.001,cord.name+' above the floor');}
 layout.dispose();
});

test('towels: rental stacks by the bandai, a rail by the bath door, one on the bench; resting, not floating or clipping',()=>{
 resetAll();const {room,layout}=build();room.updateMatrixWorld(true);
 const all=meshes(room),B=ONSEN_ROOM.bounds,ray=new THREE.Raycaster();
 const towels=all.filter(m=>m.userData.restsOn||m.userData.hangsFrom);
 assert.ok(towels.length>=30,'stacks of towels, not one '+towels.length);
 const groups=new Set();room.traverse(o=>{if(o.userData.towel)groups.add(o.userData.towel);});
 for(const t of ONSEN_TOWELS){assert.ok(groups.has(t.id),t.id+' is in the room');assert.ok(t.why.length>30&&t.for.length>5,t.id+' has a reason');}
 assert.equal(TOWEL_PRICE,100);
 const itemOf=o=>{for(let p=o;p;p=p.parent)if(p.userData.towel)return p;return null;};
 for(const t of towels){
  const box=new THREE.Box3().setFromObject(t);
  assert.ok(box.min.x>B.minX&&box.max.x<B.maxX&&box.min.z>B.minZ&&box.max.z<B.maxZ&&box.min.y>0,t.name+' inside the room');
  if(t.userData.restsOn){
   const c=box.getCenter(new THREE.Vector3());ray.set(new THREE.Vector3(c.x,box.min.y+.001,c.z),new THREE.Vector3(0,-1,0));ray.far=.02;
   const hit=ray.intersectObjects(all.filter(m=>m!==t),false)[0];
   assert.ok(hit,`${t.name} (${t.parent.name}) rests on something`);assert.ok(hit.distance<.004,t.name+' sits on '+hit.object.name+' with a gap of '+hit.distance.toFixed(4));
   assert.equal(hit.object.name,t.userData.restsOn,t.name+' rests on '+t.userData.restsOn);
  }else{
   const bar=room.getObjectByName(t.userData.hangsFrom),bb=new THREE.Box3().setFromObject(bar),cloth=new THREE.Box3().setFromObject(itemOf(t));
   assert.ok(cloth.max.y>bb.max.y&&cloth.min.y<bb.min.y&&cloth.min.x>=bb.min.x&&cloth.max.x<=bb.max.x,'hangs over the rail, inside its length');
   assert.ok(box.max.y>=bb.min.y,t.name+' reaches up to the rail');
  }
  // Nothing else passes through it, apart from the cloth of the same towel and what it sits on.
  const own=itemOf(t),shrunk=box.clone().expandByScalar(-.002);
  for(const o of all){
   if(o===t||itemOf(o)===own||o.name===t.userData.restsOn||o.name===t.userData.hangsFrom||/floor|paving|ceiling|sea view/i.test(o.name))continue;
   const ob=new THREE.Box3().setFromObject(o);if(ob.isEmpty())continue;
   assert.ok(!shrunk.intersectsBox(ob),`${t.name} (${own?.userData.towel}) clips ${o.name||o.type}`);
  }
 }
 // The rental shelf and the rail do not block the way through or the bath door.
 const blocked=(x,z,r)=>layout.colliders.some(c=>c.only!=='player'&&Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r);
 for(const x of [-.45,.45])for(const z of [3,1.6,0,-1.2])assert.ok(!blocked(x,z,.25),'the way through each side stays open at '+x+', '+z);
 layout.dispose();
});

test('the storyteller knows the board and the towels',()=>{
 const onsen=FEED_PLACES.find(p=>p.id==='onsen');
 for(const thing of ['the breaker board','a stack of rental towels'])assert.ok(onsen.things.includes(thing),thing);
 assert.ok(onsen.doing.includes('resetting a tripped breaker'));
});

test('with the main off the lobby goes dark (only the dusk through the glass), and comes back exactly with the power',()=>{
 resetAll();const {room,layout}=build();
 let hemi;room.traverse(o=>{if(o.isHemisphereLight)hemi=o;});
 const look=z=>{const cam=new THREE.PerspectiveCamera();cam.position.set(0,1.6,z);cam.updateMatrixWorld();room.getObjectByName('Breaker board plate').onBeforeRender(null,null,cam);return hemi.intensity;};
 layout.tick(1/30,1170);
 const lit=look(4),glow=name=>room.getObjectByName(name).material.emissiveIntensity;
 let daylight;room.traverse(o=>{if(o.isDirectionalLight&&!daylight)daylight=o;});const sunLit=daylight.intensity;
 const before={andon:glow('Andon'),cooler:glow('Milk cooler light'),lamp:room.getObjectByName('Lobby light').intensity};
 assert.ok(before.andon>0&&before.cooler>0&&before.lamp>0);
 // The same frame the main goes down: lamps, andon, cooler and screen out, and the fill falls far below the lit house.
 // With the lamps on after dark the house is lit by its lamps and takes a little of the town's sky fill; at noon all of it.
 const litShare=layout.townFill();assert.ok(litShare>.25&&litShare<.6,'lamp-lit at dusk: '+litShare.toFixed(3));
 trip('main');const dark=look(4);
 assert.ok(dark<lit*.3,`lobby fill ${dark.toFixed(3)} with the main off, ${lit.toFixed(3)} lit`);
 assert.ok(layout.townFill()<.3,`and only the daylight's share of the town's fill comes in: ${layout.townFill().toFixed(3)}`);
 assert.equal(glow('Andon'),0);assert.equal(glow('Milk cooler light'),0);assert.equal(room.getObjectByName('Lobby light').intensity,0);
 let screen;room.getObjectByName('Lobby CRT').traverse(o=>{if(o.isMesh&&o.geometry?.type==='PlaneGeometry'&&o.name!=='Lobby CRT glass'&&!screen)screen=o;});
 assert.ok(!screen||screen.visible===false,'the CRT shows dead glass');
 // Every lamp in the house is dead, so it is as dark seen from the changing room as from the lobby.
 assert.ok(Math.abs(look(.2)-dark)<1e-9,'the whole house is equally dark');
 layout.tick(1/30,1170);assert.ok(daylight.intensity<sunLit*.3,'the daylight in the house is only what comes through the glass');
 // Ticking does not bring anything back or flicker.
 for(let i=0;i<20;i++){layout.tick(1/30,1170);assert.equal(look(4),dark);assert.equal(glow('Andon'),0);}
 // Daylight still comes in through the shoji and the glass: noon in a dead house is brighter than dusk.
 layout.tick(1/30,720);const noon=look(4);assert.ok(noon>dark,'the windows still light it by day');
 layout.tick(1/30,1170);
 reset('main');layout.tick(1/30,1170);
 assert.equal(look(4),lit,'exactly as before');assert.equal(daylight.intensity,sunLit);assert.equal(layout.townFill(),litShare);
 layout.tick(1/30,720);assert.equal(layout.townFill(),1,'at noon the lit house takes all of the town\'s daylight fill');
 assert.equal(glow('Andon'),before.andon);assert.equal(glow('Milk cooler light'),before.cooler);assert.equal(room.getObjectByName('Lobby light').intensity,before.lamp);
 layout.dispose();
});
