import {buildCargoShipping} from './cargo-shipping.js';
import {addDocklandsDetail} from './docklands-detail.js';
import * as THREE from '../../vendor/three.module.js';
import {DOCKLANDS as D,cargoShift} from './docklands-layout.js';
import {APRON_TOP} from './ground-plan-harbour.js';
/** A compact working port, built in local geometry, with pedestrian access to every door. */
export function buildDocklandsLife(world,{register,onAction}={}){
 const group=new THREE.Group();group.name='Working western docklands';world.group.add(group);
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.88}));return mats.get(c);};
 const box=(name,size,pos,c,parent=group,solid=false)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(c));m.name=name;m.position.set(...pos);parent.add(m);if(solid)world.colliders.push({id:name,x:pos[0],z:pos[2],w:size[0],d:size[2],height:pos[1]+size[1]/2});return m;};
 // The yard's ground is the Nishi quay's apron (ground-plan-harbour.js); it laid a slab of its own under it before.
 // Freight containers and loose pallets are stored aboard; the shore circuits remain clear.
 // Kept in its own fenced test bay: forks cycle during the electrical inspection.
 const forklift=new THREE.Group();forklift.name='Workshop forklift test bay';forklift.position.set(40.5,APRON_TOP-.03,-40.0);forklift.userData.dynamicProp=true;group.add(forklift);
 box('Forklift counterweight',[1.2,.55,1.6],[0,.62,0],0xc58b35,forklift);box('Forklift seat',[.5,.16,.5],[0,1.0,.1],0x3c4545,forklift);
 for(const x of [-.6,.6])for(const z of [-.48,.48]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.16,12),mat(0x303c3c));w.rotation.z=Math.PI/2;w.position.set(x,.28,z);forklift.add(w);}
 for(const x of [-.42,.42])box('Forklift mast',[.08,2,.12],[x,1.12,-.81],0x4b5857,forklift);
 const forks=new THREE.Group();forks.userData.dynamicProp=true;forklift.add(forks);for(const x of [-.32,.32])box('Forklift fork',[.10,.07,1.0],[x,.15,-1.21],0x6b7370,forks);
 world.colliders.push({id:'forklift-test-bay',x:40.5,z:-40.35,w:1.55,d:2.65,height:2.25});
 // Small quayside hoist, scaled for island supplies rather than a city container port.
 const crane=new THREE.Group();crane.name='Island freight hoist';crane.position.set(-33.2,0,-48.6);group.add(crane);
 box('Hoist footing',[1.1,.35,1.1],[0,.18,0],0x5a6865,crane);box('Hoist mast',[.3,5.2,.3],[0,2.8,0],0x687974,crane);box('Hoist boom',[4.0,.25,.3],[1.8,5.2,0],0x687974,crane);
 const cable=box('Cargo hoist cable',[.025,3,.025],[3.4,3.7,0],0x343d3b,crane);
 const hook=box('Cargo hoist hook',[.18,.23,.14],[3.4,2.2,0],0x4a5350,crane);cable.userData.dynamicProp=true;hook.userData.dynamicProp=true;
 world.colliders.push({id:'freight-hoist',x:-33.2,z:-48.6,w:1.3,d:1.3,height:5.5});
 const lamps=[];for(const x of [-38,-27.5]){box('Cargo yard lamp post',[.10,4,.1],[x,2,-34],0x52605b,group,true);const bulb=new THREE.Mesh(new THREE.BoxGeometry(.55,.14,.3),new THREE.MeshStandardMaterial({color:0xe6d5a9,emissive:0xffc474,emissiveIntensity:0}));bulb.position.set(x,4,-34);group.add(bulb);lamps.push(bulb.material);}
 const anchor=(pos,label,fn)=>{const a=new THREE.Object3D();a.position.set(...pos);group.add(a);register?.(a,label,fn);};
 anchor([40.5,1,-38.2],'Inspect workshop forklift',()=>onAction?.('inspect','Dock electrical test bay','Tetsuo checks the lift limit switch and Chin repairs the fork carriage. The test bay stays separate from the walking route. Come into the blue workshop for electrical and instrument repairs.'));
 anchor([-21,1,-35.1],'Read the island freight board',()=>onAction?.('read','Island freight and dock shifts','WESTERN QUAY · ISLAND LIFELINE\nCargo crews: 07:00–22:00. Early boat: ice, rice and shop supplies. Afternoon: post, repair parts and village parcels. Evening: chilled fish and outgoing mail.\nThe harbour master runs the cargo yard and keeps the freight book at the dispatch desk. Ferry passengers use the marked main quay. Dock Electrical & Repairs is beside the warehouse. Keep its doorway and the hoist bay clear.'));
 box('Dock dispatch desk',[1.6,.9,.8],[-30,.45,-34.5],0x6f7565,group,true);
 const shipping=buildCargoShipping(world,{register,onAction});world.cargoShipping=shipping;
 addDocklandsDetail(world,group,{register,onAction});
 return {group,forklift,forks,hook,cable,update(time,minutes){shipping.update(time,minutes);const open=cargoShift(minutes),lift=open?.16+(Math.sin(time*.45)+1)*.18:.16;forks.position.y=lift;const rope=open?2.5+Math.sin(time*.16)*.45:3;cable.scale.y=rope/3;cable.position.y=5.2-rope/2;hook.position.y=5.2-rope;for(const m of lamps)m.emissiveIntensity=minutes%1440>=1080||minutes%1440<360?1.4:0;}};
}
