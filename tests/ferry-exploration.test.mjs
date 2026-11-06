import {createFerryExplorationUI} from '../src/ui/ferry-exploration.js';
import {runInNewContext} from 'node:vm';
import {createMotion,createAutoRun} from '../src/input/touch-feel.js';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createFerryExploration,ferryLadderRoute,ferryLocalFloor,ferryLocalBlocked,slideFerryLens,FERRY_EXPLORE_SPEED,FERRY_PRECISION_SPEED,withFerryInteriorView,FERRY_EXPLORE_TARGETS} from '../src/render/ferry-exploration.js';
import {h1ToLocal,FERRY_H1_SHOTS} from '../src/world/ferry-engine-room-plan.js';
import {FERRY_FLOORS} from '../src/world/ferry-walk.js';

function fixture(){
 const camera=new T.PerspectiveCamera(67,1.5,.15,200);camera.zoom=1.2;
 const ship=new T.Group(),explorer=createFerryExploration(camera);ship.updateMatrixWorld(true);
 const enter=(cad=[11.1,0,.9],id='engine-room')=>{const p=ship.localToWorld(new T.Vector3(...h1ToLocal(cad)));explorer.sync({ship,position:p,deck:{floor:FERRY_FLOORS.find(f=>f.id===id)}});return p;};
 return {camera,ship,explorer,enter};
}
test('ordinary exploration has no automatic shots, no bob and a constant ship-local eye through heave and roll',()=>{
 const {camera,ship,explorer,enter}=fixture();enter();assert.equal(explorer.mode,'walk');assert.equal(explorer.id,null);
 let start;
 for(let i=0;i<300;i++){
  ship.position.set(i*.1,Math.sin(i*.06)*.3,3);ship.rotation.set(Math.sin(i*.05)*.04,.7+i*.001,Math.cos(i*.04)*.07);ship.updateMatrixWorld(true);
  enter();explorer.apply({yaw:ship.rotation.y+.3,pitch:.1,dt:1/60});
  const p=ship.worldToLocal(camera.position.clone());start??=p.clone();assert.ok(p.distanceTo(start)<1e-9,p.toArray().join(','));
  const q=ship.getWorldQuaternion(new T.Quaternion()).invert().multiply(camera.quaternion);const expected=new T.Quaternion().setFromEuler(new T.Euler(.1,.3,0,'YXZ'));assert.ok(q.angleTo(expected)<1e-6);
 }
 for(const X of [11.7,12.15,12.3,12.6,13]){enter([X,0,.9]);assert.equal(explorer.mode,'walk');assert.equal(explorer.id,null);}
 assert.equal(FERRY_EXPLORE_SPEED,1);assert.equal(FERRY_PRECISION_SPEED,.35);explorer.precision=true;assert.equal(explorer.speed,.35);
});
test('eight views require manual selection and inspection returns the exact walking pose; ordinary lens restores',()=>{
 const {camera,ship,explorer,enter}=fixture();enter();explorer.apply({yaw:.4,pitch:-.1});const original=camera.position.clone(),q=camera.quaternion.clone();
 for(let i=0;i<8;i++){explorer.overview(i);explorer.apply({yaw:.4,pitch:-.1});assert.equal(explorer.id,FERRY_H1_SHOTS[i].id);}
 explorer.walk();explorer.apply({yaw:.4,pitch:-.1});assert.ok(camera.position.distanceTo(original)<1e-9);assert.ok(camera.quaternion.angleTo(q)<1e-6);
 const target=explorer.nearby()[0];assert.ok(target);assert.equal(explorer.inspect(target),true);
 for(let i=0;i<100;i++){explorer.orbit(.05,.02);explorer.zoom(.98);explorer.apply({dt:1/60});const p=ship.worldToLocal(camera.position.clone());assert.equal(ferryLocalBlocked(p),false);}
 explorer.walk();explorer.apply({yaw:.4,pitch:-.1});assert.ok(camera.position.distanceTo(original)<1e-9);assert.ok(camera.quaternion.angleTo(q)<1e-6);
 explorer.sync({ship:null,deck:null,position:original});assert.equal(explorer.active,false);assert.equal(camera.fov,67);assert.equal(camera.zoom,1.2);assert.equal(camera.near,.15);assert.deepEqual(camera.up.toArray(),[0,1,0]);
});
test('inspection sweeps cannot tunnel through a bulkhead even after a large input',()=>{
 const from=new T.Vector3(...h1ToLocal([11.1,0,2.55]));assert.equal(ferryLocalBlocked(from),false);
 const to=new T.Vector3(...h1ToLocal([11.1,-9,2.55])),p=slideFerryLens(from,to);assert.equal(ferryLocalBlocked(p),false);assert.ok(p.x> -4);
 for(let i=0;i<100;i++){const q=slideFerryLens(p,to);assert.equal(ferryLocalBlocked(q),false);}
});
test('every representative room has a body-clear measured route to the lower ladder landing',()=>{
 for(const cad of [[11.1,0,.9],[13.1,0,.9],[10.55,-2.8,.9],[16.7,0,.9],[21,0,.9],[21.4,-1.4,.9],[24,0,.9],[19.3,0,.9]]){
  const start=new T.Vector3(...h1ToLocal(cad)),path=ferryLadderRoute(start);assert.ok(path.length>1,'No route '+cad);
  for(let i=1;i<path.length;i++){
   const a=path[i-1],b=path[i],steps=Math.ceil(a.distanceTo(b)/.025);
   for(let j=1;j<=steps;j++){const p=a.clone().lerp(b,j/steps);assert.ok(ferryLocalFloor(p.x,p.z,p.y,.28),'Off floor '+cad+' / '+p.toArray());assert.equal(ferryLocalBlocked(p,.28,1.82),false,'Obstructed '+cad+' / '+p.toArray());}
  }
  assert.ok(path.at(-1).distanceTo(new T.Vector3(3.575,-1,9.1-17.25))<1e-6);
 }
});

test('the aft booth pocket cannot be offered a walking route through its chair',()=>{
 const p=new T.Vector3(...h1ToLocal([9.2,-3.1,.9]));assert.equal(ferryLocalBlocked(p,.28,1.82),false);assert.deepEqual(ferryLadderRoute(p),[]);
});

test('enclosed-room rendering removes street work only for the draw and restores it on failure',()=>{
 const town=new T.Group(),harbour=new T.Group(),ship=new T.Group(),street=new T.Group(),person=new T.Group(),lamp=new T.AmbientLight();town.add(harbour,street,person,lamp);harbour.add(ship);
 const parked=new T.Group();parked.visible=false;town.add(parked);
 assert.throws(()=>withFerryInteriorView(town,ship,[person],()=>{assert.equal(ship.visible,true);assert.equal(person.visible,true);assert.equal(lamp.visible,true);assert.equal(street.visible,false);throw Error('test render failure');}),/test render failure/);
 assert.equal(street.visible,true);assert.equal(parked.visible,false);assert.equal(harbour.visible,true);
});

test('inspection also respects the transparent control-booth glazing',()=>{
 const from=new T.Vector3(-2.8,.35,-7.4),to=new T.Vector3(-1.8,.35,-7.4);assert.equal(ferryLocalBlocked(from),false);
 const end=slideFerryLens(from,to);assert.ok(end.x< -2.46);assert.equal(ferryLocalBlocked(end),false);
});

test('guidance never invents a floor-level shortcut from halfway up the ladder or inside equipment',()=>{
 assert.deepEqual(ferryLadderRoute(new T.Vector3(3.575,.5,7.5-17.25)),[]);
 assert.deepEqual(ferryLadderRoute(new T.Vector3(1.55,-1,11-17.25)),[]);
});

test('a real visible Blender machinery surface resolves to inspection data at phone, iPad and desktop aspect ratios',async()=>{
 const bytes=readFileSync(new URL('../assets/models/ferry-engine-room/minato-engine-room-h1-f1.glb',import.meta.url));
 const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');scene.updateMatrixWorld(true);
 for(const aspect of [390/844,744/1133,1133/744,1280/800]){
  const c=new T.PerspectiveCamera(65,aspect,.055,200);c.position.set(0,.65,11.1-17.25);c.rotation.set(0,-1.5,0,'YXZ');c.updateMatrixWorld(true);
  let picked=false;
  for(const t of FERRY_EXPLORE_TARGETS){const at=new T.Vector3(...t.pos),p=at.clone().project(c);if(Math.max(Math.abs(p.x),Math.abs(p.y))>.9||p.z< -1||p.z>1)continue;
   const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(p.x,p.y),c);const hit=ray.intersectObjects(scene.children,true)[0];
   if(hit&&hit.point.y>-.65&&hit.point.y<1.4&&hit.point.distanceTo(at)<1.5)picked=true;
  }assert.equal(picked,true,'Machinery can be picked at aspect '+aspect);
 }
});

// Mode changes can happen between simulation frames, before the locked update resets easing.
test('opening and closing machinery inspection between frames clears residual walking',()=>{
 const source=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
 const walkMotion=createMotion(),touchAutoRun=createAutoRun();walkMotion.update(0,1,.1);touchAutoRun.update(1,.3);
 let resets=0;const ctx={walkMotion,touchAutoRun,resetInput:()=>resets++,ferryExploreActive:()=>true,ferryExplorer:{mode:'walk',nearby:()=>[{}],inspect(){this.mode='inspect';return true;},walk(){this.mode='walk';}},say:()=>{}};
 for(const name of ['resetFerryInput','inspectFerryMachinery']){
  const start=source.indexOf('function '+name+'('),end=source.indexOf('\n}',start)+2;
  // The reset helper is intentionally a one-line function.
  const text=name==='resetFerryInput'?source.slice(start,source.indexOf('\n',start)):source.slice(start,end);
  runInNewContext(text,ctx);
 }
 ctx.inspectFerryMachinery();ctx.inspectFerryMachinery();assert.equal(ctx.ferryExplorer.mode,'walk');
 const remaining=walkMotion.update(0,0,.02);assert.equal(remaining.x,0);assert.equal(remaining.y,0);assert.equal(touchAutoRun.running,false);assert.equal(resets,2);
});

test('the exploration panel opens once and keeps its mouse target through repeated updates',()=>{
 const elements=new Map();let root,replacements=0,prevented=0;
 const element=()=>({value:'',setAttribute(){},addEventListener(){},append(){},querySelector(key){if(!elements.has(key))elements.set(key,element());return elements.get(key);}});
 const doc={head:element(),body:element(),documentElement:{classList:{toggle(){}}},createElement(tag){const e=element();if(tag==='details'){root=e;e.open=false;}return e;}};
 const explorer={active:true,mode:'walk',floor:'engine-room',local:new T.Vector3(0,-1,11.1-17.25),heading:0,precision:false,nearby:()=>[]};
 const ui=createFerryExplorationUI({explorer,doc}),summary=elements.get('summary');let text='';
 Object.defineProperty(summary,'textContent',{get:()=>text,set:v=>{text=v;replacements++;}});
 ui.update(0);summary.onclick({preventDefault(){prevented++;}});assert.equal(root.open,true);assert.equal(prevented,1);
 for(let i=1;i<=20;i++)ui.update(i*160);
 assert.equal(root.open,true);assert.equal(replacements,1,'An unchanged live label must keep the same DOM target');
 elements.get('[data-precision]').onclick();assert.equal(explorer.precision,true);ui.update(3400);assert.equal(root.open,true);
 summary.onclick({preventDefault(){prevented++;}});ui.update(3600);assert.equal(root.open,false);assert.equal(prevented,2);
 elements.get('[data-guide]').onclick();ui.update(3800);const count=replacements;
 for(let i=1;i<=5;i++)ui.update(3800+i*160);
 assert.equal(replacements,count,'Guidance computes and writes one final label, without resetting it each tick');
});
