import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {clock as duskClock} from '../src/render/dusk.js';
import {graphicsProfile} from '../src/render/startup-recovery.js';
import {buildSakuraLife} from '../src/world/interiors/sakura-life.js';
import {installDOM} from './fixtures.mjs';

test('repeated frozen draws refresh lighting and late materials without advancing hourly animation',async()=>{
 const source=await readFile(new URL('../src/game.js',import.meta.url),'utf8');
 // Execute the production lighting and audit-render functions against a small
 // renderer fixture, without booting a whole DOM/WebGL town in Node.
 const lightSource=source.slice(source.indexOf('function setTime('),source.indexOf("$('#exitRoomButton').onclick="));
 const renderStart=source.indexOf(' render(){',source.indexOf('window.__JOHANSSON_AUDIT__={'));
 const renderSource=source.slice(renderStart,source.indexOf('\n setTime(value',renderStart));
 // The audit's render() delegates to renderStill, which the free camera shares; run that production body too.
 const stillSource=source.slice(source.indexOf('function renderStill('),source.indexOf("if(new URLSearchParams(location.search).has('audit'))window.__JOHANSSON_AUDIT__"));
 let hours=0,shutterY=0,skyUpdates=0,celSweeps=0,outdoor=0,interior=0,market=0;
 const context={THREE,duskClock,world:{updateHours(){hours++;shutterY+=.02;}},minutes:1260,weather:false,weatherKind:'sunny',
  // Match the live lighting dependencies; retain the production setTime/render bodies.
  current:null,graphics:graphicsProfile(),graphicsLifecycle:null,activeRoomLayout:null,concert:null,photoStudio:null,spawnScene:null,player:new THREE.Group(),
  SUN_REACH:46,nightLift:0,conversationLine:null,placeWorldBalloons(){},setRoadPaintLight(){},
  lightBudget:{update(){}},colliderGrid:{refresh(){}},
  sun:new THREE.DirectionalLight(),ambient:new THREE.HemisphereLight(),bounce:new THREE.PointLight(),uplight:new THREE.DirectionalLight(),UPLIGHT:.35,
  scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(),town:{},room:{},renderer:{render(){interior++;}},
  townSky:{update(){skyUpdates++;}},setOceanLight(){},atmosphere:()=>({sky:0x111122,fog:null,ambient:1,exposure:1}),
  pipeline:{setExposure(){},tune(){}},CEL_FILL:1,CEL_EXPOSURE:1,NIGHT_TINT:{light:0xffffff,shadow:0xffffff},
  INK_OPTIONS:{gradeOptions:{lift:.04}},GRADE_DEFAULTS:{lift:.04},DUNGEON_FOG:null,$:()=>({}),
  celPass:{apply(){celSweeps++;}},renderOutdoor(){outdoor++;},present:draw=>draw(),
  shopStreetView:{render(){market++;}},sakuraShop:{layout:{frontZ:0}},streetFrontageOf:site=>site?.id==='market'||site?.id==='izakaya'?{}:null};
 context.scene.background=new THREE.Color();
 vm.runInNewContext(lightSource+'\n'+stillSource+'\nglobalThis.auditRender=({'+renderSource+'}).render;',context);
 context.setTime();assert.equal(hours,1);const initialShutter=shutterY;
 const audit={camera:{pos:[4,2,-17],at:[-5,1.2,-13]},render:context.auditRender};
 for(let i=0;i<10;i++)audit.render();
 assert.equal(shutterY,initialShutter,'Painting the same frozen frame cannot move the shutter');
 assert.equal(hours,1);assert.equal(skyUpdates,11,'Lighting still follows the chosen camera');
 assert.equal(celSweeps,10,'Streamed materials receive cel shading without simulation');assert.equal(outdoor,10);
 assert.ok(context.sun.position.toArray().every(Number.isFinite),'Frozen lighting keeps a finite sun position');
 assert.ok(context.sun.target.position.toArray().every(Number.isFinite),'Frozen lighting keeps a finite shadow target');
 assert.deepEqual(context.camera.position.toArray(),audit.camera.pos);
 context.current={id:'mayor-home'};audit.render();assert.equal(interior,1);
 context.current={id:'market'};audit.render();assert.equal(market,1);
 let concerts=0;context.concert={active:true,render(){concerts++;}};
 assert.equal(audit.render(),true);assert.equal(concerts,1);
 assert.equal(market,1,'The concert owns the renderer while its panel is open');
 assert.equal(celSweeps,12,'A concert draw does not advance the frozen town');
 context.concert=null;
 context.setTime();assert.equal(hours,2,'Normal lighting calls retain their hourly update');
 context.graphicsLifecycle={lost:true};assert.equal(audit.render(),false);assert.equal(hours,2);assert.equal(celSweeps,12);
});

test('frozen fixture time resets the shop decoration phase after normal town sync only',async()=>{
 const source=await readFile(new URL('../src/game.js',import.meta.url),'utf8');
 const start=source.indexOf(' setTime(value',source.indexOf('window.__JOHANSSON_AUDIT__={'));
 const method=source.slice(start,source.indexOf('\n teleport(',start));
 const calls=[],clockNode={},context={minutes:0,followRealClock:true,weather:true,
  townClock:{set:(...values)=>calls.push(['clock',...values])},world:{setRain:rain=>calls.push(['rain',rain]),quarters:{shutter:{update:(...values)=>calls.push(['shutter',...values])}}},
  advanceTown:(...values)=>calls.push(['sync',...values]),setTime:()=>calls.push(['light']),$:()=>clockNode,fmt:String,
  sakuraShop:{display:{tick:time=>calls.push(['decorations',time])}}};
 vm.runInNewContext('globalThis.auditSetTime=({'+method+'}).setTime;',context);
 context.auditSetTime.call({frozen:true},720);
 assert.deepEqual(calls.filter(c=>c[0]==='decorations'),[['decorations',0]]);
 assert.ok(calls.findIndex(c=>c[0]==='sync')<calls.findIndex(c=>c[0]==='decorations'),'Sync may sample wall time before the frozen sample');
 assert.equal(clockNode.textContent,'720');assert.equal(context.followRealClock,false);
 context.auditSetTime.call({frozen:false},1260,{rain:true});
 assert.equal(calls.filter(c=>c[0]==='decorations').length,1,'Ordinary audits retain live decorative animation');
 assert.throws(()=>context.auditSetTime.call({frozen:true},NaN),/finite/);
});

test('a fixed decorative phase makes the actual shop mascot independent of boot wall time',()=>{
 installDOM();const room=new THREE.Group(),life=buildSakuraLife(room,{anchor(){},action(){}});
 const mascot=room.getObjectByName('Jaga-bo mascot');assert.ok(mascot);
 const matrices=()=>{room.updateMatrixWorld(true);const result=[];mascot.traverse(o=>result.push([...o.matrixWorld.elements]));return result;};
 life.tick(12.3);const firstBoot=matrices();life.tick(0);const fixed=matrices();
 assert.notDeepEqual(firstBoot,fixed,'The wall-time sample actually changes the mascot silhouette');
 life.tick(51.7);assert.notDeepEqual(matrices(),firstBoot,'Fresh boot timing has a visible pose effect');
 life.tick(0);assert.deepEqual(matrices(),fixed,'Fixed phase resets every mascot transform exactly');
 life.dispose();
});
