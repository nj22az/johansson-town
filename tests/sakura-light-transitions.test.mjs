import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {RESIDENTS} from '../src/people/residents.js';
import {createResidentLedger} from '../src/people/resident-personalities.js';
import {restoreSakura} from '../src/commerce/sakura-economy.js';
import {createSakuraShop} from '../src/people/sakura-shop.js';

test('late Sakura street mounting cannot expose interior lights before another simulation tick',()=>{
 installDOM();const scene=new THREE.Scene(),street=new THREE.Group();scene.add(street);
 const profile=RESIDENTS.find(p=>p.name==='Thuan'),g=new THREE.Group();
 g.userData={name:'Thuan',hit:{inside:false},indoors:'market',visualReady:false};g.visible=false;street.add(g);
 const world={people:[{profile,g}]},state={yen:1200,inventory:[],sakura:restoreSakura(),residentLife:{}};
 let inside=false;
 const shop=createSakuraShop({world,scene,state,ledger:createResidentLedger(()=>state),register(o,label,fn,within){o.userData.hit={inside:within,fn,label};},action(){},exit(){},getMinutes:()=>1260,getPlayerPosition:()=>null,isInside:()=>inside});
 const lights=()=>{const result=[];shop.group.traverse(o=>{if(o.isLight)result.push(o);});return result;};
 try{
  // Asset completion mounts the window after the initial outside-light scan. No
  // wall-clock delay or simulation movement is needed to expose the former halo.
  shop.update(0);
  assert.ok(lights().length>0,'The actual authored shop contains its hemisphere fill');
  assert.ok(lights().every(l=>!l.visible),'The initial outside scan hides interior lighting');
  const worker=new THREE.Group(),customer=new THREE.Group();worker.userData.name='window clerk';customer.userData.name='window customer';
  for(const person of [worker,customer]){person.visible=false;person.add(new THREE.Mesh(new THREE.BoxGeometry(.2,.7,.2),new THREE.MeshBasicMaterial()));shop.group.add(person);}
  assert.equal(shop.street(street,{position:[-11,0,-28],yaw:0}),true);
  const strip=shop.group.getObjectByName('Sakura shopfront strip lights');
  assert.equal(strip?.children.filter(o=>o.isPointLight).length,2,'Mounting creates the real shopfront tube lights');
  assert.ok(lights().every(l=>!l.visible),'Newly mounted tube lights must not brighten the street, roof or paving');
  const copy=shop.group.getObjectByName('Sakura window stand-in');
  assert.ok(copy,'The street has its merged window copy');
  for(const person of [worker,customer]){assert.equal(person.visible,true,'Street view reveals live occupants');assert.equal(person.children[0].layers.isEnabled(0),true,'The stand-in never hides live people');}
  let released=0;copy.traverse(o=>o.geometry?.addEventListener('dispose',()=>released++));
  inside=true;shop.enter(scene);
  assert.equal(shop.group.getObjectByName('Sakura window stand-in'),undefined,'Entry releases the expanded exterior copy');
  assert.ok(released>0,'The exterior geometry buffers are disposed');
  assert.ok(lights().every(l=>l.visible),'The actual shop lights turn on immediately when entered');
  inside=false;shop.street(street,{position:[-11,0,-28],yaw:0});
  assert.ok(lights().every(l=>!l.visible),'Returning to the pavement immediately restores exterior lighting');
  const lateLight=new THREE.PointLight(0xffffff,1);shop.group.add(lateLight);
  shop.update(.5);
  assert.equal(lateLight.visible,false,'The periodic scan still handles a light supplied by a later model');
  shop.hide();
  assert.ok(lights().every(l=>!l.visible),'Hiding the shared shop keeps all of its lights disabled');
 }finally{shop.display.dispose();}
});
