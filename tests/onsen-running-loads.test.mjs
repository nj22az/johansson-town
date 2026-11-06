import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildOnsenInterior} from '../src/world/interiors/onsen.js';
import {ONSEN_CIRCUITS,ONSEN_BOARD,AT_REST,BREAKER_CURVE,BREAKER_COOL,tripSeconds,switchOn,switchOff,isRunning,isWorking,isLive,isOn,
 runningLoads,runningOn,assess,advance,settle,reset,resetAll,stageScenario,ONSEN_SCENARIOS} from '../src/world/interiors/onsen-electrics.js';
import {LOBBY_CHANNELS,pinLobbyChannel,lobbyChannelPin} from '../src/world/interiors/onsen-lobby.js';
import {ONSEN_SIGNS} from '../src/world/interiors/onsen-signs.js';
import {buildParkOnsen} from '../src/world/park-onsen.js';

const build=()=>{const room=new THREE.Group(),hits=[],actions=[];const layout=buildOnsenInterior({room,reg:(o,label,fn)=>hits.push({o,label,fn}),action:(...a)=>actions.push(a),exit(){}});room.updateMatrixWorld(true);return {room,hits,actions,layout};};
const BUSY=['dryer-1','dryer-2','dryer-3','massage-chair'],RUSH=['dryer-1','dryer-2','dryer-3','kettle'];
const circuit=(a,id)=>a.circuits.find(c=>c.id===id);

test('at rest the fixed loads run and the dryers, the chair and the pot wait for somebody',()=>{
 stageScenario('rest');
 for(const c of ONSEN_CIRCUITS)for(const l of c.loads){
  assert.ok(l.atRest==='on'||l.atRest==='off',l.id+' says how it stands at rest');
  assert.ok(typeof l.by==='string'&&l.by.length>5,l.id+' says who switches it');
 }
 assert.deepEqual([...BUSY,'kettle'].map(isRunning),[false,false,false,false,false]);
 assert.ok(AT_REST.includes('changing-pendant')&&AT_REST.includes('television')&&AT_REST.includes('circulation-pump'));
 const a=assess();assert.equal(circuit(a,'changing-sockets').amps,0);
 // Lamps 40+30+40+20+120+5 W, andon 25, television 80, fan 30, sterilizer 6, cooler 150, pump 400: 946 W.
 assert.ok(Math.abs(a.main.amps-9.46)<1e-9,'the house idles at 9.46 A: '+a.main.amps);assert.equal(a.contract.amps,a.main.amps,'the supply breaker sees the same');
 assert.deepEqual(advance(3600),[],'nothing trips at rest, however long');
});

test('three dryers, the pot and the chair: every branch holds, the 40 A supply breaker lets go after minutes and the whole house is dark',()=>{
 stageScenario('rest');
 for(const id of [...RUSH,'massage-chair'])assert.equal(switchOn(id),true,id);
 assert.equal(switchOn('dryer-1'),false,'already on');
 const a=assess();
 for(const c of a.circuits)assert.ok(!c.over&&c.tripIn===Infinity,c.id+' within its 20 A: '+c.amps);
 assert.equal(circuit(a,'changing-sockets').amps,14);assert.equal(circuit(a,'vanity-2').amps,12);assert.equal(circuit(a,'vanity-3').amps,12);
 assert.ok(Math.abs(a.contract.amps-60.46)<1e-9);assert.equal(a.contract.rating,40);assert.ok(a.contract.over);
 assert.equal(a.main.rating,60);assert.equal(a.main.tripIn,Infinity,'the main never trips at 60.46 A');
 // A thermal breaker: it roars for minutes first.
 const t=a.contract.tripIn;assert.ok(t>120&&t<300,'trips in '+t.toFixed(0)+' s');
 assert.deepEqual(advance(t*.5),[]);assert.equal(isLive('contract'),true,'still up halfway');
 assert.deepEqual(advance(t*.6),['contract'],'CLICK');
 assert.equal(isOn('contract'),false);assert.equal(isOn('main'),true,'the main lever stays up');
 for(const id of RUSH){assert.equal(isRunning(id),true,id+' still switched on');assert.equal(isWorking(id),false,id+' dead');}
 assert.equal(isRunning('massage-chair'),false,'the chair’s coin relay dropped out');
 for(const id of ['changing-pendant','women-tube','porch-lamp','garden-lantern','bath-lamp-west','bath-lamp-east','lobby-lamp','andon','television','milk-cooler','circulation-pump'])assert.equal(isWorking(id),false,id+' dark');
 assert.equal(assess().main.amps,0);
 // Put straight back up, still hot, with everything on: it goes again within a second or two.
 reset('contract');assert.ok(assess().contract.tripIn<2);assert.deepEqual(settle(),['contract']);
 // Two dryers and the chair, no pot (35.46 A): it holds all evening once it has cooled.
 switchOff('kettle');switchOff('dryer-3');advance(BREAKER_COOL);reset('contract');switchOn('massage-chair');
 assert.ok(Math.abs(assess().contract.amps-35.46)<1e-9);assert.deepEqual(advance(7200),[],'two dryers and the chair hold all evening');
 stageScenario('rest');
});

test('the trip curve stays inside the JIS limits and never trips within the rating',()=>{
 assert.equal(tripSeconds(20,20),Infinity);assert.equal(tripSeconds(14,20),Infinity);
 assert.ok(tripSeconds(25,20)<=3600,'125 %: within 60 minutes');assert.ok(tripSeconds(40,20)<=120,'200 %: within 2 minutes');
 assert.equal(tripSeconds(200,20),0,'magnetic trip at ten times');
 assert.ok(tripSeconds(80,40)<=240,'the 40 A supply breaker at 200 %: within 4 minutes');assert.equal(tripSeconds(40,40),Infinity);
 let last=Infinity;for(let r=1.06;r<10;r+=.01){const t=tripSeconds(r*20,20);assert.ok(t<=last+1e-9,'more current never takes longer at '+r.toFixed(2));last=t;}
 assert.ok(BREAKER_CURVE.length>3);
});

test('the board, lamps and screen follow switches as well as breakers',()=>{
 stageScenario('rest');resetAll();const {room,layout}=build();
 const lamp=room.getObjectByName('Changing-room pendant lamp'),light=room.getObjectByName('Changing-room light');
 const lever=room.getObjectByName('Breaker lever changing-sockets'),screen=room.getObjectByName('Lobby CRT').children.find(o=>o.isMesh&&o.geometry?.type==='PlaneGeometry');
 const up=lever.rotation.x,lit=light.intensity;
 // Switching the pendant off at the wall puts it out without touching the breaker.
 switchOff('changing-pendant');assert.equal(light.intensity,0);assert.equal(lamp.material.emissiveIntensity,0);assert.equal(isLive('changing-lights'),true);
 switchOn('changing-pendant');assert.equal(light.intensity,lit);
 // The busy evening, ticked in the room: the supply breaker's lever drops by itself and the whole house goes dark.
 const contract=room.getObjectByName('Breaker lever contract');
 for(const id of [...RUSH,'massage-chair'])switchOn(id);
 let seconds=0;while(isLive('contract')&&seconds<600){layout.tick(.5,20*60);seconds+=.5;}
 assert.equal(isLive('contract'),false,'tripped in the room after '+seconds+' s');assert.ok(seconds>60,'not at once');
 assert.ok(contract.rotation.x>Math.PI/2,'its lever down');assert.ok(lever.rotation.x===up&&up<Math.PI/2,'the branch levers stay up');
 assert.equal(screen.visible,false,'the game goes black');assert.equal(light.intensity,0,'the lights go out');
 resetAll();
 // Isolate first: the main off and the screen goes black (the dead glass shows).
 stageScenario('isolated');assert.equal(screen.visible,false);assert.ok(room.getObjectByName('Lobby CRT glass'),'a dark glass behind the picture');
 assert.equal(room.getObjectByName('Lobby light').intensity,0);
 stageScenario('rest');layout.dispose();
});

test('the film stages the story by name, and the TV can be pinned to the night game',()=>{
 for(const [name,s] of Object.entries(ONSEN_SCENARIOS)){assert.ok(s.en.length>30,name+' explains itself');for(const id of s.on)assert.ok(ONSEN_CIRCUITS.some(c=>c.loads.some(l=>l.id===id)),id);}
 assert.deepEqual(Object.keys(ONSEN_SCENARIOS),['rest','quiet','evening','last-straw','blackout','retrip','restored','isolated','locked-out','upgraded-locked-out','upgraded']);
 // "Fujita's Back": the evening (3–4), the last straw (4), the blackout and the dark twice (5–6), restored (7–9).
 for(const [name,pages] of [['evening',[3,4]],['last-straw',[4]],['blackout',[5,6]],['retrip',[6]],['restored',[7,8,9]]])assert.deepEqual(ONSEN_SCENARIOS[name].pages,pages,name);
 let a=stageScenario('evening');
 assert.deepEqual(runningOn('lobby').includes('kettle'),true);assert.equal(isLive('contract'),true,'the lever still up');
 assert.ok(Math.abs(a.contract.amps-58.46)<1e-9);assert.ok(a.contract.tripIn>240,'left alone, about five minutes');
 assert.deepEqual(advance(600),[],'held for the camera');assert.equal(lobbyChannelPin(),'night-game');
 a=stageScenario('last-straw');assert.ok(isWorking('massage-chair'));assert.ok(Math.abs(a.contract.amps-60.46)<1e-9);assert.deepEqual(advance(600),[],'held');
 a=stageScenario('blackout');
 assert.equal(a.contract.live,false);assert.equal(isOn('main'),true);for(const c of a.circuits)assert.equal(c.live,false,c.id);
 assert.equal(isWorking('television'),false);assert.equal(lobbyChannelPin(),'night-game','the set is dead, not switched');
 a=stageScenario('isolated');assert.equal(isWorking('television'),false);assert.equal(a.main.amps,0);
 stageScenario('quiet');assert.ok(Math.abs(assess().contract.amps-23.46)<1e-9);assert.deepEqual(advance(3600),[]);
 assert.throws(()=>stageScenario('typhoon'),/No such Umi-no-yu scenario/);
 for(const old of ['rush','busy','fitting','fixed','peace'])assert.throws(()=>stageScenario(old),/No such/,'the retired story’s '+old);
 stageScenario('rest');assert.equal(lobbyChannelPin(),null);assert.deepEqual(runningLoads(),AT_REST);
 // Pinned, the channel knob leaves it alone; unpinned it turns again.
 const {hits,actions,layout}=build(),knob=hits.find(h=>h.label==='Change the channel');
 pinLobbyChannel('night-game');knob.fn();assert.match(actions.at(-1)[1],/night game/i);assert.equal(layout.tv.channel,'night-game');
 assert.throws(()=>pinLobbyChannel('cartoons'),/No such channel/);
 pinLobbyChannel(null);knob.fn();assert.match(actions.at(-1)[1],/Channel 2/);
 assert.equal(LOBBY_CHANNELS[0].id,'night-game');
 layout.dispose();
});

test('the signs say it in proper Japanese, and the room paints what the data says',async()=>{
 const jp=/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー・ ¥0-9℃\-]+$/u;
 const S=ONSEN_SIGNS;
 assert.equal(S.milk.jp,'牛乳');assert.equal(S.milk.price,'各 ¥100');assert.equal(S.noren.jp,'ゆ');assert.equal(S.kanban.jp,'海の湯');
 assert.equal(S.tv.nightGame.inning,'7回裏');assert.deepEqual(S.tv.nightGame.score,{away:2,home:3});
 for(const text of [S.milk.jp,S.milk.price,S.noren.jp,S.kanban.jp,S.notice.jp,S.bathBoard.jp,...S.fee.lines,...S.dailyBath,S.poster.title,S.poster.line,S.tv.nightGame.inning,S.tv.weather.title,S.tv.weather.forecast])
  assert.match(text,jp,`"${text}" is Japanese, not a translation`);
 assert.equal(S.dailyBath.length,7);
 for(const [k,v] of Object.entries(S))if(v.where)assert.ok(v.why.length>20,k+' says why');
 // Record every word painted on a canvas while the room and the front of the bathhouse are built.
 const painted=[];const ctx=new Proxy({fillText:t=>painted.push(String(t)),measureText:s=>({width:s.length*17}),createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),fillRect(){}},{get:(o,k)=>o[k]||(()=>{})});
 const saved=globalThis.document;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx,style:{}})};
 try{
  stageScenario('evening');const {layout}=build();layout.tick(1,20*60);
  const world={group:new THREE.Group(),colliders:[]};buildParkOnsen(world,{});
  for(const word of ['牛','乳','各 ¥100','ゆ','♨ 海の湯','海の湯','本日の湯','南の島 湯めぐり','港の湯・海の湯・森の湯','大人 ¥300','タオル ¥100・牛乳 ¥100','7回裏','沖','鹿'])assert.ok(painted.includes(word),'paints '+word);
  for(const wrong of ['Cow Breasts','Yu','Sea Bath','7Back of the inning  3 - 2',"Today's hot water",'Adult ¥300'])assert.ok(!painted.includes(wrong),'no longer paints '+wrong);
  layout.dispose();
 }finally{globalThis.document=saved;stageScenario('rest');}
});
