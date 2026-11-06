import * as THREE from '../../vendor/three.module.js';
import {residentPersonality} from '../people/resident-personalities.js';
/** A private bedroom at the resident's canonical address, with an owned, usable bed. */
export function buildLinuxBedroom({room,box,reg,collider,owner,exit,onRest}){
 const colour=residentPersonality(owner).top||'#7b9c88';
 box([7,.12,7],[0,-.06,0],0xb8a17b,room);box([7,2.8,.15],[0,1.4,-3.5],0xe9dfc8,room);
 for(const x of [-3.5,3.5])box([.15,2.8,7],[x,1.4,0],0xe9dfc8,room);
 for(const x of [-2.15,2.15])box([2.7,2.8,.15],[x,1.4,3.5],0xe9dfc8,room);
 const frame=box([1.5,.35,2.35],[-1.6,.18,-1.4],0x77563c,room);frame.name=owner+'’s bed';collider(-1.6,-1.4,1.5,2.35,.55);
 box([1.42,.18,2.25],[-1.6,.44,-1.4],0xf4ead7,room);box([1.42,.09,1.45],[-1.6,.57,-1.05],colour,room);box([.85,.13,.42],[-1.6,.59,-2.23],0xfff6e5,room);
 reg(frame,'Rest in '+owner+'’s bed',onRest,true);
 box([.9,.65,.6],[1.8,.325,-2.6],0x896b48,room);box([.18,.25,.18],[1.8,.78,-2.6],0xe3bc70,room);
 box([1.1,1.8,.65],[2.7,.9,.1],0xa1855f,room);collider(2.7,.1,1.1,.65,1.8);
 const door=new THREE.Object3D();door.position.set(0,1,3.4);room.add(door);reg(door,'Leave '+owner+'’s home',exit,true);
 room.add(new THREE.HemisphereLight(0xffe6bc,0x9aa790,2.1));
 return {home:true,spawn:[0,0,2.2],bounds:{minX:-3.4,maxX:3.4,minZ:-3.4,maxZ:3.4},bed:[-1.6,.73,-.45],bedside:[-.4,0,-.7],bedAxis:'z',owner};
}
