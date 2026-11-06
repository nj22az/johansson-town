import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {standingHitsRect} from '../physics.js';
import {buildJohanssonHouse,roomPoint,HOUSE_STOREY_FLOOR} from '../src/world/interiors/johansson-house-interior.js';
import {houseRoom} from '../src/world/johansson-house.js';

// The owner, 21 October 2026: "remove the mayors office and put it on the tropical island … or even rework it into one of
// the rooms in Johansson's house" (briefs/town-hall-zone.md, phase M). The office's computer, with the Community Hall's
// register on it, and the Merry Moose are in his study on the upper floor; the town hall has no mayor's office.
function build(){
 installDOM();
 const room=new THREE.Group(),anchors=[],actions=[],cols=[];
 const layout=buildJohanssonHouse({room,reg:(o,label,fn)=>anchors.push({o,label,fn}),action:(...a)=>actions.push(a),collider:(x,z,w,d,height=2.8,minY=0)=>{const c={x,z,w,d,height,minY};cols.push(c);return c;}});
 room.updateMatrixWorld(true);
 return {room,layout,anchors,actions,cols};
}
const [x0,y0,x1,y1]=houseRoom('l1-study').bounds,F=HOUSE_STOREY_FLOOR.L1,R=.28;
const inStudy=p=>{const x=p.x+6,y=5-p.z;return x>x0&&x<x1&&y>y0&&y<y1&&p.y>F-.5&&p.y<F+2.8;};

test('the study has the office’s computer with the town’s register, and the Merry Moose by the door',()=>{
 const {room,layout,anchors,actions,cols}=build();
 const at=label=>{const a=anchors.find(a=>a.label===label);assert.ok(a,'no prompt: '+label);return a;};
 const computer=at('Use the computer');assert.ok(inStudy(computer.o.getWorldPosition(new THREE.Vector3())),'the computer is in the study');
 computer.fn();assert.deepEqual(actions.at(-1),['document-archive','Community Hall Document Register']);
 const moose=at('Look at the Merry Moose');assert.ok(inStudy(moose.o.getWorldPosition(new THREE.Vector3())),'the moose is in the study');
 assert.ok(layout.owned.some(p=>p.kind==='merry_Moose'||/moose/i.test(p.holder?.name||p.kind||'')),'the Merry Moose stands in the house');
 // The screen faces his chair, at the window.
 const screen=[];room.traverse(o=>{if(o.name==='CRT screen')screen.push(o);});assert.equal(screen.length,1);
 const s=screen[0].getWorldPosition(new THREE.Vector3()),chair=new THREE.Vector3(...roomPoint(x1-1.05,5.25,F));
 assert.ok(chair.x<s.x,'the chair is in front of the screen, away from the window');
 // The moose's plinth is solid, and his chair has room to stand beside it.
 const [mx,,mz]=roomPoint(8.75,y1-.39,F);assert.ok(cols.some(c=>standingHitsRect(mx,mz,R,F,c)),'the plinth is solid');
 const [cx,,cz]=roomPoint(x1-1.6,5.25,F);assert.ok(!cols.some(c=>standingHitsRect(cx,cz,R,F,c)),'there is room to stand at the desk');
 // The door, the desk and the moose are joined by open floor (walked at 10 cm, as the house is).
 const walk=layout.walk,blocked=(x,y,z)=>cols.some(c=>standingHitsRect(x,z,R,y,c));
 const [dx,,dz]=roomPoint(x0+.35,4.95,F),key=(x,z)=>Math.round(x*10)+','+Math.round(z*10);
 const seen=new Set([key(dx,dz)]),queue=[[dx,F,dz]];
 while(queue.length){const [x,y,z]=queue.pop();for(const [ex,ez] of [[.1,0],[-.1,0],[0,.1],[0,-.1]]){const nx=x+ex,nz=z+ez,k=key(nx,nz);if(seen.has(k))continue;
  const m=walk.move(x,y,z,nx,nz,R,blocked);if(!m.ok||!inStudy({x:nx,y:m.y,z:nz}))continue;seen.add(k);queue.push([nx,m.y,nz]);}}
 assert.ok(seen.has(key(cx,cz)),'the desk is reached from the door');
 const [ax,,az]=roomPoint(9.1,y1-.8,F);assert.ok([...seen].some(k=>{const [i,j]=k.split(',').map(Number);return Math.hypot(i/10-ax,j/10-az)<.5;}),'the moose is reached from the door');
 layout.dispose?.();
});
