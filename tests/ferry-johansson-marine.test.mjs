import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {JOHANSSON_MARINE,makerPlate} from '../src/world/johansson-marine.js';
import {FERRY_MACHINERY,FERRY_ELECTRICS} from '../src/world/ferry-ship.js';
import {FERRY_INTERIOR} from '../src/world/ferry-interior.js';
import {FERRY_INSPECT} from '../src/world/ferry-inspect.js';
import {createFerryRun} from '../src/world/ferry.js';
import {FERRY_DECK_SIGNS} from '../src/world/ferry-model.js';
installDOM();

test('the Johansson Marine catalogue is the ship’s own data under the brand',()=>{
 const c=JOHANSSON_MARINE.catalogue;
 assert.match(c.main.spec,new RegExp(`${FERRY_MACHINERY.mains.cylinders} cyl · ${FERRY_MACHINERY.mains.bore}×${FERRY_MACHINERY.mains.stroke} mm · ${FERRY_MACHINERY.mains.kW} kW at ${FERRY_MACHINERY.mains.rpm} rpm`));
 assert.match(c.genset.spec,new RegExp(`${FERRY_ELECTRICS.generators.kVA} kVA`));assert.match(c.gear.spec,new RegExp(`^${FERRY_MACHINERY.gears.ratio}:1`));
 for(const [key,m] of Object.entries(c)){assert.match(m.model,/^J[A-Z]-?[A-Z0-9-]+$/,key+' has a Johansson model number');assert.ok(m.kind&&m.spec&&m.count>0,key);}
 const plate=makerPlate('main',1);assert.equal(plate[0],'JOHANSSON MARINE');assert.equal(plate[1],'JM6-160');assert.match(plate[3],/^No\. \d+ · Johansson Marine Works/);
 assert.throws(()=>makerPlate('tractor'));
});

test('the main engines and generator sets are built as machines, in the livery, with their plates',()=>{
 const names=new Set(FERRY_INTERIOR.cyls.map(c=>c.name).filter(Boolean));
 for(const part of ['crankcase door','oil filler','fuel filter','turbocharger turbine','turbocharger compressor','air filter','cooling-water pump','sea-water pump','lube-oil filter','flywheel housing','coupling guard','gearbox cover','output flange','tachometer','stop button','start button','shutdown button','sensor box','lagging band','bulkhead lamp','generator turbocharger','alternator','alternator end bell','pump casing','pump motor','compressor cylinder','purifier bowl','separator vessel','earth lamp','synchronising lamp','fuel valve handwheel','flange','strainer housing','strainer cover','strainer stud','camshaft','cam lobe','crankcase opening','door bolt','telegraph lever','clock','clutch pack','clutch plate'])assert.ok(names.has(part),'built: '+part);
 const green=JOHANSSON_MARINE.livery.green;
 const blocks=FERRY_INTERIOR.boxes.filter(b=>b.name==='main engine');assert.equal(blocks.length,2);for(const b of blocks)assert.equal(b.hex,green,'the block is in Johansson green');
 const plates=FERRY_INTERIOR.plates;
 // Two mains, two gensets, the compressor, purifier, separator, the switchboard and the six pumps carry a maker's plate.
 assert.equal(plates.filter(p=>p.lines[0]==='JOHANSSON MARINE').length,22,'every machine carries a maker’s plate (6q: the ballast and sewage pumps; D10: the standby pumps and compressor No.2)');
 const tags=plates.filter(p=>p.name==='KKS tag');assert.ok(tags.length>=28,'KKS tags on the machines: '+tags.length);for(const t of tags)assert.match(t.lines[0],/^\d\d[A-Z]{3}\d\d( [A-Z]{2}\d{3})?( · \d\d[A-Z]{3}\d\d [A-Z]{2}\d{3})?$/,'a KKS tag: '+t.lines[0]);
 assert.equal(plates.filter(p=>p.name==='wordmark').length,2,'the wordmark on each engine');assert.equal(plates.filter(p=>p.name==='badge').length,2,'the silver badge on each engine’s covers');
 for(const p of plates)assert.ok(p.w>0&&p.h>0&&p.pos.length===3&&Number.isFinite(p.rotY),p.name);
 // The photographs' engine room (6o-2): round dials on the gauge boards and the switchboard, chequer plate on the floor.
 const dials=plates.filter(p=>p.kind==='dial');assert.ok(dials.length>=24,'dials: '+dials.length);
 for(const d of dials)assert.ok(d.value>=0&&d.value<=1&&d.w===d.h,'a dial reads 0–1 and is round: '+d.name);
 for(const label of ['LO PRESS','WATER','EXHAUST','RPM','kW','Hz','SYNCHROSCOPE','INSULATION'])assert.ok(dials.some(d=>d.lines[0]===label),'a dial for '+label);
 assert.equal(dials.filter(d=>d.lines[0]==='kW').length,2,'a kW meter per generator panel');
 assert.ok(plates.some(p=>p.kind==='chequer'&&p.rotX===-Math.PI/2&&p.w>6),'the floor is chequer plate');
 assert.equal(plates.filter(p=>p.name==='label: fuel filter').length,4,'the filters are dated');
 assert.ok(plates.filter(p=>p.kind==='grating').length>=5,'gratings over the bilge in the aisle and beside the engines');
 // The second photo set (6o-3): one crankcase door is off the starboard engine and lies on the plates; no two solid
 // things of the engine room stand inside each other (the sea chests once stood inside the fuel tank and the separator).
 const doors=FERRY_INTERIOR.cyls.filter(c=>c.name==='crankcase door');assert.equal(doors.length,12);assert.equal(doors.filter(d=>d.pos[1]<-.9).length,1,'one door on the plates');
 const solids=FERRY_INTERIOR.boxes.filter(b=>b.solid&&b.name&&/sea chest|strainer|fuel service tank|oily-water separator|air compressor|local control stand|air bottles|workbench|pump$/.test(b.name));
 const lo=(b,i)=>Math.min(b.a[i],b.b[i]),hi=(b,i)=>Math.max(b.a[i],b.b[i]);
 for(let i=0;i<solids.length;i++)for(let j=i+1;j<solids.length;j++){const A=solids[i],B=solids[j];const overlap=[0,1,2].every(k=>lo(A,k)<hi(B,k)-.01&&lo(B,k)<hi(A,k)-.01);assert.ok(!overlap,A.name+' stands inside '+B.name);}
 // Every cylinder stands inside the engine room, below the car deck.
 for(const c of FERRY_INTERIOR.cyls)assert.ok(c.pos[1]<2.2&&c.pos[1]>-1.25&&Math.abs(c.pos[0])<4,'in the engine room: '+c.name+' '+JSON.stringify(c.pos));
});

test('the model draws the cylinders and hangs the plates on her; the prompts name the brand',()=>{
 const parent=new THREE.Group(),run=createFerryRun({parent,colliders:[]});
 const plates=[];run.ferry.traverse(o=>{if(o.isMesh&&o.userData.plate)plates.push(o);});
 assert.equal(plates.length,FERRY_INTERIOR.plates.length+FERRY_DECK_SIGNS.length,'every plate and deck sign is a textured plane on the ship');
 const metal=run.ferry.getObjectByName('Minato Maru metal');assert.ok(metal,'the metal class carries the machine parts');
 for(const id of ['main-engine','gearbox','generator']){const p=FERRY_INSPECT.find(p=>p.id===id);assert.match(p.title+' '+p.text,/Johansson Marine J[A-Z]/,id);}
});
