import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildStorefront} from '../src/world/storefront.js';

/** A storefront placed the way the harbour street places the konbini. */
function frontage(){
 installDOM();
 const parent=new THREE.Group(),site={id:'market',title:'Sakura Shōten',side:-1,z:-28};
 const group=buildStorefront({parent,site,label(){},enter(){},register(){},
  span:{width:14.26,depth:11,doorX:0},placement:{x:-7.45,z:-26.8,yaw:Math.PI/2,scale:1}});
 parent.updateMatrixWorld(true);
 return {parent,group,door:group.shopDoor};
}

test('the shop door opens for whoever walks up to it and closes behind them',()=>{
 const {door}=frontage();
 assert.ok(door,'The doorway is still a hole in the frontage');
 assert.equal(door.amount,0,'The door starts open');

 // Nobody about: it stays shut, however long you wait.
 for(let t=0;t<3;t+=1/30)door.update(1/30,[]);
 assert.equal(door.amount,0);

 // Somebody on the mat opens it, and quickly — you should not walk into it.
 const mat=door.mat;
 for(let t=0;t<1;t+=1/30)door.update(1/30,[{x:mat.x,z:mat.z}]);
 assert.ok(door.amount>.9,'The door is still shut with somebody standing on the mat');

 // It does not care who: a person is {x,z} or an Object3D position all the same.
 door.update(1/30,[new THREE.Vector3(mat.x,0,mat.z)]);
 assert.ok(door.amount>.9,'The door only opens for one kind of caller');

 // Away down the street, it holds a moment (sliding-door.js), then shuts again — slower than it opened.
 for(let t=0;t<1;t+=1/30)door.update(1/30,[{x:mat.x+40,z:mat.z}]);
 assert.ok(door.amount>.9,'The door slams on the heels of whoever has just gone');
 for(let t=0;t<3.5;t+=1/30)door.update(1/30,[{x:mat.x+40,z:mat.z}]);
 assert.ok(door.amount<.02,'The door stays open once everybody has gone');
});

test('the leaves part from the middle and clear the doorway',()=>{
 const {group,door}=frontage();
 const leaves=[];group.traverse(o=>{if(o.isMesh&&o.name==='Sakura door leaf pane')leaves.push(o.parent);});
 assert.equal(leaves.length,2,'A sliding door needs two leaves');

 group.updateMatrixWorld(true);
 const shut=leaves.map(l=>l.getWorldPosition(new THREE.Vector3()));
 assert.ok(shut[0].distanceTo(shut[1])<1.1,'The leaves are parked apart when the door is shut');

 for(let t=0;t<2;t+=1/30)door.update(1/30,[{x:door.mat.x,z:door.mat.z}]);
 group.updateMatrixWorld(true);
 const open=leaves.map(l=>l.getWorldPosition(new THREE.Vector3()));
 assert.ok(open[0].distanceTo(open[1])>2.4,'The leaves do not open far enough to walk between');
 // and each one went its own way rather than both sliding the same way.
 assert.ok(open[0].distanceTo(shut[0])>.7&&open[1].distanceTo(shut[1])>.7,'A leaf stayed put');
});
