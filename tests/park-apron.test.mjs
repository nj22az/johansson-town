import test from 'node:test';
import assert from 'node:assert/strict';
import {routeAt,groundHeight} from '../src/world/layout.js';
import {parkApproachHeight} from '../src/world/park-layout.js';
import {HARBOUR_PARK_MAIN,HARBOUR_PARK_EXTENSION,HARBOUR_PARK_PATHS,inHarbourPark} from '../src/world/harbour-park-plan.js';
const RADIUS=.34,walkable=(x,z)=>!!routeAt(x,z,RADIUS);

test('the level park has an open western edge along its street frontage',()=>{
 const b=HARBOUR_PARK_MAIN;let reachable=0,total=0;
 for(let z=b.minZ+1;z<=b.maxZ-1;z+=.5){total++;for(let x=b.minX-2;x<b.minX;x+=.25)if(walkable(x,z)){reachable++;break;}}
 assert.ok(reachable/total>.9,'Open frontage at '+reachable+' of '+total+' sample sections');
});
test('the park apron joins the street at several points along the frontage',()=>{
 for(const z of [-33,-29,-25,-22]){let x=HARBOUR_PARK_MAIN.minX-.5;assert.ok(walkable(x,z));while(x>0&&walkable(x-.25,z))x-=.25;assert.ok(x<=0,'Street connection stops at '+[x,z]);}
});
test('the whole consolidated park and its street edge have no concealed height cliffs',()=>{
 const b=HARBOUR_PARK_MAIN,e=HARBOUR_PARK_EXTENSION,worst={rise:0,at:null};
 for(let z=b.minZ;z<=e.maxZ;z+=.25)for(let x=b.minX-2;x<=b.maxX;x+=.25){
  if(!inHarbourPark(x,z,2)||!walkable(x,z))continue;
  for(const [dx,dz] of [[.25,0],[0,.25]]){if(!walkable(x+dx,z+dz))continue;const rise=Math.abs(groundHeight(x+dx,z+dz)-groundHeight(x,z));if(rise>worst.rise){worst.rise=rise;worst.at=[x,z];}}
 }
 assert.ok(worst.rise<.24,'A step of '+worst.rise+'m at '+JSON.stringify(worst.at));
});
test('the crossing and bathhouse approach are level across their complete paved widths',()=>{
 for(const route of HARBOUR_PARK_PATHS.filter(r=>['park-approach','garden-onsen-approach'].includes(r.id)))for(let i=1;i<route.points.length;i++){
  const a=route.points[i-1],b=route.points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
  for(let step=0;step<=10;step++)for(const side of [-1,0,1]){
   const offset=side*(route.width/2-.05),x=a[0]+dx*step/10-dz/length*offset,z=a[1]+dz*step/10+dx/length*offset;
   assert.equal(parkApproachHeight(x,z),0,route.id+' level paved edge at '+[x,z]);assert.ok(walkable(x,z),route.id+' open edge at '+[x,z]);
  }
 }
});
