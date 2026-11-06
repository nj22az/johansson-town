import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createFutureCalendar,getFutureCalendarDate,getFutureCalendarMonth,FUTURE_CALENDAR_SIZE} from '../src/world/interiors/future-calendar.js';

function captureCanvas(){
 installDOM();const writes=[];const createElement=document.createElement;
 document.createElement=(tag)=>{
  const element=createElement(tag);
  if(tag==='canvas'){
   const ctx=element.getContext('2d');ctx.fillText=text=>writes.push(String(text));element.getContext=()=>ctx;
  }
  return element;
 };
 return writes;
}

test('real Stockholm dates roll over at local midnight, across month and year boundaries',()=>{
 const expectations=[
  ['2026-10-04T21:59:59.999Z','2026-10-04','Sunday, 4 October 2026'],
  ['2026-10-04T22:00:00.000Z','2026-10-05','Monday, 5 October 2026'],
  ['2026-10-31T22:59:59.999Z','2026-10-31','Saturday, 31 October 2026'],
  ['2026-10-31T23:00:00.000Z','2026-11-01','Sunday, 1 November 2026'],
  ['2026-12-31T22:59:59.999Z','2026-12-31','Thursday, 31 December 2026'],
  ['2026-12-31T23:00:00.000Z','2027-01-01','Friday, 1 January 2027'],
 ];
 for(const [instant,key,label] of expectations){
  const date=getFutureCalendarDate(new Date(instant));assert.equal(date.dateKey,key);assert.equal(date.dateLabel,label);assert.equal(date.timeZone,'Europe/Stockholm');
 }
});

test('calendar months use Monday columns and Gregorian leap years',()=>{
 const october=getFutureCalendarMonth(2026,10);
 assert.equal(october.startColumn,3);assert.equal(october.daysInMonth,31);
 assert.deepEqual(october.weeks[0],[null,null,null,1,2,3,4]);
 assert.deepEqual(october.weeks.at(-1),[26,27,28,29,30,31,null]);
 const leap=getFutureCalendarMonth(2024,2);
 assert.equal(leap.daysInMonth,29);assert.equal(leap.weeks.flat().filter(Boolean).at(-1),29);
 assert.equal(getFutureCalendarMonth(2000,2).daysInMonth,29);
 assert.equal(getFutureCalendarMonth(2100,2).daysInMonth,28);
 assert.equal(getFutureCalendarMonth(2026,2).daysInMonth,28);
 assert.equal(getFutureCalendarMonth(2026,8).weeks.length,6);
});

test('calendar print names Future Calendar exactly and prominently prints the real date',()=>{
 const writes=captureCanvas(),calendar=createFutureCalendar({now:new Date('2026-10-05T12:00:00Z')});
 assert.ok(writes.includes('Future Calendar'));assert.ok(writes.includes('05 OCT 2026'));assert.ok(writes.includes('Monday'));assert.ok(writes.includes('OCTOBER 2026'));
 assert.deepEqual(writes.filter(s=>/^\d{1,2}$/.test(s)).map(Number),Array.from({length:31},(_,i)=>i+1));
 assert.deepEqual(calendar.mesh.userData,{title:'Future Calendar',dateKey:'2026-10-05',dateLabel:'Monday, 5 October 2026',timeZone:'Europe/Stockholm',calendarYear:2026,calendarMonth:10,highlightedDay:5,daysInMonth:31});
 assert.equal(calendar.group.children.filter(o=>o.isMesh).length,3);
 assert.deepEqual(FUTURE_CALENDAR_SIZE,{width:.8,height:1.12});
 assert.ok(calendar.mesh.geometry.attributes.position.getZ(0)<calendar.mesh.geometry.attributes.position.getZ(calendar.mesh.geometry.attributes.position.count-1),'The lower paper curls out from the wall');
 calendar.dispose();
});

test('frame updates keep the texture stable until exact real midnight and handle clock correction',()=>{
 const writes=captureCanvas(),calendar=createFutureCalendar({now:new Date('2026-10-05T09:00:00Z')});
 const texture=calendar.mesh.material.map,initialVersion=texture.version,initialWrites=writes.length;
 for(const instant of ['2026-10-05T09:00:00.016Z','2026-10-05T18:00:00Z','2026-10-05T21:59:59.999Z'])assert.equal(calendar.update(new Date(instant)),false);
 assert.equal(texture.version,initialVersion);assert.equal(writes.length,initialWrites);
 assert.equal(calendar.update(new Date('2026-10-05T22:00:00.000Z')),true);
 assert.equal(texture.version,initialVersion+1);assert.equal(calendar.mesh.userData.dateKey,'2026-10-06');assert.equal(calendar.mesh.userData.highlightedDay,6);
 assert.equal(calendar.update(new Date('2026-10-05T20:00:00Z')),true,'A backwards system-clock correction can restore yesterday');
 assert.equal(calendar.mesh.userData.dateKey,'2026-10-05');
 calendar.dispose();
});

test('midnight updates survive Stockholm 23-hour and 25-hour daylight-saving days',()=>{
 for(const [start,before,after,key] of [
  ['2026-03-28T23:00:00Z','2026-03-29T21:59:59.999Z','2026-03-29T22:00:00Z','2026-03-30'],
  ['2026-10-24T22:00:00Z','2026-10-25T22:59:59.999Z','2026-10-25T23:00:00Z','2026-10-26'],
 ]){
  installDOM();const calendar=createFutureCalendar({now:new Date(start)}),version=calendar.mesh.material.map.version;
  assert.equal(calendar.update(new Date(before)),false);assert.equal(calendar.mesh.material.map.version,version);
  assert.equal(calendar.update(new Date(after)),true);assert.equal(calendar.mesh.userData.dateKey,key);calendar.dispose();
 }
});

test('default creation follows the actual date, and dispose releases every owned resource once',()=>{
 installDOM();const before=getFutureCalendarDate(),calendar=createFutureCalendar(),after=getFutureCalendarDate();
 assert.ok([before.dateKey,after.dateKey].includes(calendar.mesh.userData.dateKey));
 const room=new THREE.Group();room.add(calendar.group);
 const resources=[calendar.mesh.material.map,...calendar.group.children.flatMap(mesh=>[mesh.geometry,mesh.material])],counts=new Map();
 for(const resource of resources)resource.addEventListener('dispose',()=>counts.set(resource,(counts.get(resource)||0)+1));
 const version=calendar.mesh.material.map.version;calendar.dispose();calendar.dispose();
 assert.equal(calendar.group.parent,null);assert.equal(room.children.length,0);
 for(const resource of resources)assert.equal(counts.get(resource),1);
 assert.equal(calendar.update(new Date('2030-01-01T12:00:00Z')),false);assert.equal(calendar.mesh.material.map.version,version);
});
