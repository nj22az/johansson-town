import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildEastLawn} from '../src/world/east-lawn.js';
import {createTown} from '../src/world/town.js';
import {createBusinesses} from '../src/world/businesses.js';
import {HARBOUR_POND,HARBOUR_PARK_PATHS,harbourPondAt} from '../src/world/harbour-park-plan.js';
import {groundHeight,routeAt} from '../src/world/layout.js';
import {standingHitsRect} from '../physics.js';
let cached;
function town(){
 if(cached)return cached;installDOM();const prompts=[],actions=[];
 const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),mobile:true,shadows:false,register:(object,label,run)=>prompts.push({object,label,run}),onAction:(...args)=>actions.push(args),enter(){},getPlayerPosition:()=>new THREE.Vector3()});
 return cached={world,prompts,actions};
}
test('the east lawn retires its duplicate garden and keeps the grass hook without fetching assets',()=>{
 installDOM();const requests=[],original=globalThis.fetch;globalThis.fetch=(...args)=>{requests.push(args);throw Error('No garden asset request');};
 try{const parent=new THREE.Group(),colliders=[],lawn=buildEastLawn({parent,colliders});assert.equal(lawn.garden.retired,true);assert.equal(typeof lawn.useParkGreenery,'function');assert.equal(colliders.some(c=>c.id?.startsWith('east-garden')),false);assert.equal(parent.getObjectByName('Japanese garden'),undefined);lawn.tick(17,1110);assert.deepEqual(requests,[]);}finally{globalThis.fetch=original;}
});
test('one Harbour Park pond retains the inspection interaction and its koi update in the real world',()=>{
 const {world,prompts,actions}=town(),ponds=[];world.group.traverse(o=>{if(o.name==='Harbour Park koi pond')ponds.push(o);});
 assert.equal(ponds.length,1);assert.equal(world.group.getObjectByName('Aoba Traditional Garden'),undefined);assert.equal(world.eastLawn.garden.retired,true);
 const look=prompts.find(a=>a.object.name==='harbour-pond-view');assert.ok(look);look.run();assert.deepEqual(actions.at(-1).slice(0,2),['inspect','Garden pond']);
 const before=world.park.fish.map(f=>f.position.toArray());world.update(.016,60,.5,720);assert.notDeepEqual(world.park.fish.map(f=>f.position.toArray()),before);
 for(const fish of world.park.fish){assert.ok(harbourPondAt(fish.position.x,fish.position.z));assert.ok(fish.position.y<HARBOUR_POND.waterY);assert.equal(fish.userData.dynamicProp,true);}
});
test('the pond is water with a real turf opening, and its whole gravel circuit is reachable',()=>{
 const {world,prompts}=town(),p=HARBOUR_POND;world.group.updateMatrixWorld(true);
 assert.equal(routeAt(p.x,p.z,.32),null,'A water surface never becomes a hidden walking floor');
 const ray=new THREE.Raycaster(new THREE.Vector3(p.x,1,p.z),new THREE.Vector3(0,-1,0));
 assert.equal(ray.intersectObject(world.park.group.getObjectByName('Harbour Park ground')).length,0);assert.equal(ray.intersectObject(world.eastLawn.lawn).length,0);
 assert.ok(ray.intersectObject(world.park.group.getObjectByName('Harbour Park koi pond')).length);assert.ok(ray.intersectObject(world.park.group.getObjectByName('Harbour pond bed'))[0].point.y<p.waterY);
 const route=HARBOUR_PARK_PATHS.find(r=>r.id==='garden-pond-loop');
 const clear=(x,z)=>{assert.ok(routeAt(x,z,.32));assert.equal(world.colliders.some(c=>standingHitsRect(x,z,.32,groundHeight(x,z),c)),false,'Blocked pond circuit at '+[x,z]);};
 for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.15);for(let j=0;j<=n;j++)clear(a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n);}
 const look=prompts.find(a=>a.object.name==='harbour-pond-view').object;clear(look.position.x,look.position.z);
});
