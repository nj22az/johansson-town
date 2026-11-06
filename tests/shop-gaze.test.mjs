import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createShopAttention} from '../src/people/shop-attention.js';

test('Thuan notices nearby customers, gives the till priority, and does not watch through furniture',()=>{
 const clerk=new T.Group(),guest=new T.Group(),world={people:[{profile:{name:'Thuan'},g:clerk},{profile:{name:'Reiko',height:1.65},g:guest}]};clerk.userData.inMarket=true;guest.userData.inMarket=true;guest.position.set(.4,0,-2);let inside=true;const player=new T.Vector3(-.3,0,-1.4),retail={customers:new Map()},colliders=[];
 const attention=createShopAttention({clerk,world,retail,colliders,isInside:()=>inside,getPlayerPosition:()=>player});attention.update(.2);assert.equal(clerk.userData.lookCustomer,'player');
 retail.customers.set(world.people[1],{phase:'queue',atCounter:true});attention.update(.2);assert.equal(clerk.userData.lookCustomer,'Reiko');
 colliders.push({x:.2,z:-1,w:.25,d:.1,height:2});attention.update(.2);assert.equal(clerk.userData.lookCustomer,'player');
 inside=false;attention.update(.2);assert.equal(clerk.userData.lookTarget,undefined);
 colliders.length=0;guest.position.set(0,0,1);attention.update(.2);assert.equal(clerk.userData.lookTarget,undefined,'No backwards head turn');
 guest.position.set(0,0,-1);clerk.userData.carrying=true;attention.update(.2);assert.equal(clerk.userData.lookTarget,undefined,'Restocking takes precedence');
});

