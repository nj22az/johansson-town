import * as THREE from '../../vendor/three.module.js';
import {buildPortBuilding,portBuildingColliders,PORT_BUILDING} from './port-building.js';
import {buildShopDoor} from './shop-door.js';
import {HARBOUR_OFFICE as O} from './business-layout.js';
import {OFFICE_HOME_LAYOUT} from './interiors/office-workplace.js';
// A single quay office replaces the old cold-store box and both office addresses.
export function buildHarbourOffice({parent,site,register,enter,label,shadows,onAction}){
 // The office is the town-side half of the Minato Port Building (port-building.js),
 // which also holds the ferry's waiting hall and the clock tower. Its door, windows
 // and footprint are the ones the interior and the residents expect.
 const group=new THREE.Group();group.name='Consolidated harbour office';group.position.set(O.x,0,O.frontZ);parent.add(group);
 const port=buildPortBuilding({parent,label,shadows,register,onAction});
 const door=buildShopDoor(group,{name:'office-quay-door',width:1.4,shadows});door.group.position.z=.13;
 label(site.jp,'HARBOUR OFFICE · 24 HOUR MARINE SERVICE',[O.x,3.04,O.frontZ+.2],4.6,.45,0,'#e7dcc0','#3e463f',true);
 const entrance=new THREE.Object3D();entrance.name='office-quay-entrance';entrance.position.set(O.x,1.25,O.frontZ+.65);parent.add(entrance);register(entrance,'Enter '+site.title,()=>enter(site));
 Object.assign(site,{x:O.x,z:O.z,door:[...O.door],exitPosition:[...O.door],entryFacing:0,streetFrontage:{position:[O.x,0,O.frontZ],yaw:0}});
 // On the island it is also the harbour master's home: he sleeps behind the screen
 // (office-workplace.js), and walking in at night finds him there.
 Object.assign(site,{homeOwner:'Harbour master',homeOwners:['Harbour master'],ownRoom:true,homeLayouts:{'Harbour master':OFFICE_HOME_LAYOUT}});
 return {id:site.id,lod:group,entrance,shutter:door.pane,source:'Quay office',nearTriangles:0,farTriangles:0,collider:{x:O.x,z:(PORT_BUILDING.office.minZ+PORT_BUILDING.office.maxZ)/2,w:O.width,d:PORT_BUILDING.office.maxZ-PORT_BUILDING.office.minZ,height:6.8},colliders:portBuildingColliders(),port,update:door.update};
}
