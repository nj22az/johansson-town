import {isWorkshop,WORKSHOP_OBJECTS,validateWorkshopProject} from './workshop-contract.js';
/** Portable static-room documents and commands. One implementation for the editor and MCP; no game saves. */
import {snapGrid,snapConnector,glbDocument} from './model-workbench.js';
import * as THREE from '../../vendor/three.module.js';
export const ROOM_FORMAT='johansson-room-project',ROOM_LIMIT=40*1024*1024,OBJECT_LIMIT=64;
const id=s=>typeof s==='string'&&/^[a-z][a-z0-9-]{0,47}$/.test(s);
const own=(o,k)=>Object.hasOwn(o,k);
const vector=v=>Array.isArray(v)&&v.length===3&&v.every(n=>Number.isFinite(n)&&Math.abs(n)<=1000);
const fail=s=>{throw Error(s);};
const checkId=(v,label)=>{if(!id(v))fail(`${label} must be a lowercase identifier (letters, digits, hyphens).`);};
export function encodeGLB(bytes){let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);}
export function decodeGLB(text){if(typeof text!=='string'||text.length>32*1024*1024||!/^[A-Za-z0-9+/]+={0,2}$/.test(text))fail('Invalid embedded GLB.');return Uint8Array.from(atob(text),c=>c.charCodeAt(0));}
export function newRoom({id:roomId='room',title='Untitled room'}={}){
 const p={format:ROOM_FORMAT,version:1,id:roomId,title,revision:0,assets:{},objects:[]};validateRoom(p);return p;
}
export function validateRoom(p,{models=false}={}){
 if(!p||p.format!==ROOM_FORMAT||p.version!==1)fail('Choose a Johansson room project (version 1).');
 checkId(p.id,'Project id');if(typeof p.title!=='string'||!p.title.trim()||p.title.length>120)fail('A room title needs 1–120 characters.');
 if(!Number.isSafeInteger(p.revision)||p.revision<0)fail('Invalid project revision.');
 if(!p.assets||typeof p.assets!=='object'||Array.isArray(p.assets)||Object.keys(p.assets).length>64)fail('A room can hold at most 64 assets.');
 if(!Array.isArray(p.objects)||p.objects.length>OBJECT_LIMIT)fail('A room can hold at most 64 objects.');
 let bytes=0;for(const [key,a] of Object.entries(p.assets)){
  checkId(key,'Asset id');if(!a||typeof a.name!=='string'||a.name.length>120||(a.world===undefined&&(typeof a.glb!=='string'||a.glb.length>32*1024*1024)))fail(`Invalid asset ${key}.`);
  if(a.world!==undefined){if(!isWorkshop(p)||!WORKSHOP_OBJECTS[key]||a.world!==key||typeof a.name!=='string')fail('Unknown native World asset.');continue;}
  if(!Number.isSafeInteger(a.version)||a.version<1)fail(`Invalid version for ${key}.`);bytes+=a.glb.length;
  if(models)glbDocument(decodeGLB(a.glb));
 }
 if(bytes>ROOM_LIMIT)fail('Embedded assets exceed the 40 MiB project budget.');
 const ids=new Set();for(const o of p.objects){
  checkId(o.id,'Object id');if(ids.has(o.id))fail(`Duplicate object id ${o.id}.`);ids.add(o.id);
  if(!own(p.assets,o.asset))fail(`${o.id} refers to missing asset ${o.asset}.`);
  if(typeof o.name!=='string'||o.name.length>120||!vector(o.position)||!vector(o.rotation)||!Number.isFinite(o.scale)||o.scale<=0||o.scale>100)fail(`Invalid transform for ${o.id}.`);
  if(o.support!==undefined&&!['resting','attached','suspended'].includes(o.support))fail('Invalid support mode.');
  if(typeof o.visible!=='boolean')fail(`Invalid visibility for ${o.id}.`);
 }
 if(p.world!==undefined)validateWorkshopProject(p);
 return p;
}
export function readRoom(text){if(typeof text!=='string'||text.length>ROOM_LIMIT+1024*1024)fail('Room project is too large.');return validateRoom(JSON.parse(text),{models:true});}
export function roomSummary(p){validateRoom(p);return {id:p.id,title:p.title,revision:p.revision,...p.world?{world:p.world}:{},assets:Object.entries(p.assets).map(([id,a])=>({id,name:a.name,version:a.version,usedBy:p.objects.filter(o=>o.asset===id).map(o=>o.id)})),objects:p.objects.map(o=>({...o}))};}
export function freeId(p,prefix='object'){let i=1;while(p.objects.some(o=>o.id===prefix+'-'+i)||own(p.assets,prefix+'-'+i))i++;return prefix+'-'+i;}
export function editRoom(project,commands,{expectedRevision=project.revision}={}){
 validateRoom(project);if(expectedRevision!==project.revision)fail(`Revision conflict: expected ${expectedRevision}, found ${project.revision}. Reopen the current project.`);
 if(!Array.isArray(commands)||!commands.length||commands.length>64)fail('Give 1–64 room commands.');
 const p={...project,assets:{...project.assets},objects:project.objects.map(o=>({...o,position:[...o.position],rotation:[...o.rotation]}))};
 const object=key=>p.objects.find(o=>o.id===key)||fail(`No object ${key}.`);
 for(const c of commands){
  if(!c||typeof c!=='object')fail('Invalid room command.');
  switch(c.op){
   case 'title':p.title=c.title;break;
   case 'asset.add':case 'asset.update':{
    checkId(c.id,'Asset id');const exists=own(p.assets,c.id);if(c.op==='asset.add'&&exists)fail(`Asset ${c.id} already exists.`);if(c.op==='asset.update'&&!exists)fail(`No asset ${c.id}.`);
    glbDocument(decodeGLB(c.glb));p.assets[c.id]={name:c.name,version:exists?p.assets[c.id].version+1:1,glb:c.glb};break;
   }
   case 'asset.remove':if(p.objects.some(o=>o.asset===c.id))fail(`Asset ${c.id} is still used by objects.`);if(!own(p.assets,c.id))fail(`No asset ${c.id}.`);delete p.assets[c.id];break;
   case 'object.add':{
    const objectId=c.id||freeId(p);if(p.objects.some(o=>o.id===objectId))fail(`Object ${objectId} already exists.`);
    p.objects.push({id:objectId,asset:c.asset,name:c.name||p.assets[c.asset]?.name||objectId,position:c.position||[0,0,0],rotation:c.rotation||[0,0,0],scale:c.scale??1,visible:true});break;
   }
   case 'object.update':{
    const o=object(c.id);for(const [k,v] of Object.entries(c.set||{})){if(!['name','position','rotation','scale','visible','support'].includes(k))fail(`Cannot edit object field ${k}.`);o[k]=v;}break;
   }
   case 'object.replace':object(c.id).asset=c.asset;break;
   case 'object.delete':object(c.id);p.objects=p.objects.filter(o=>o.id!==c.id);break;
   case 'object.duplicate':{
    const o=object(c.id),key=c.newId||freeId(p);if(p.objects.some(o=>o.id===key))fail(`Object ${key} already exists.`);
    p.objects.push({...o,id:key,name:o.name+' copy',position:o.position.map((v,i)=>v+(i===0?.5:0)),rotation:[...o.rotation]});break;
   }
   case 'object.snap':{
    const o=object(c.id);if(c.mode==='grid')o.position=snapGrid({position:o.position,step:c.step??.05});
    else if(c.mode==='connector'){
     const r=snapConnector({source:c.source,target:c.target,scale:o.scale,clearance:c.clearance??0}),e=new THREE.Euler().setFromQuaternion(new THREE.Quaternion(...r.quaternion));
     o.position=r.position;o.rotation=[e.x,e.y,e.z].map(n=>+THREE.MathUtils.radToDeg(n).toFixed(4));
    }else fail('Snap mode must be grid or connector.');break;
   }
   default:fail(`Unknown room command ${c.op}.`);
  }
 }
 p.revision++;return validateRoom(p);
}

/** Immutable history shares unchanged asset strings; Undo/Redo never rewinds the concurrency revision. */
export function roomHistory(initial){let current=validateRoom(initial),past=[],future=[];return {
 get current(){return current;},get canUndo(){return !!past.length;},get canRedo(){return !!future.length;},
 apply(commands){const next=editRoom(current,commands);past.push(current);if(past.length>30)past.shift();future=[];current=next;return current;},
 undo(){if(!past.length)return current;future.push(current);current={...past.pop(),revision:current.revision+1};return current;},
 redo(){if(!future.length)return current;past.push(current);current={...future.pop(),revision:current.revision+1};return current;}
};}
