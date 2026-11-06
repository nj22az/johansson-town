import {buildAirportVehicleYard} from './airport-vehicle-yard.js';
import {buildShoppingLane} from './shopping-lane.js';
import {buildAirportDistrict,buildAirportDistrictFar} from './airport-district.js';
import {kitanoLater} from './kitano-on-demand.js';
import * as THREE from '../../vendor/three.module.js';
import {ISLAND_LANDMARKS} from './island-plan.js';
import {GROUND_LAYER} from './ground-layers.js';
import {AIRPORT_LANDING,AIRPORT_COUNTER,AIRPORT_HEIGHT,airportWorld} from './airport-ground.js';
/** Geometry and walking heights consume the same authored plan. */
export function buildIslandLandscape({world,register,onAction,mobile=false}){
 const group=new THREE.Group();group.name='Minato urban coast';world.group.add(group);
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.92}));return mats.get(c);};
 // Static by default: batched into a few draws. What a project shows or hides opts out below.
 const box=(name,size,pos,c,solid=false,parent=group)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(c));mesh.name=name;mesh.position.set(...pos);mesh.userData.staticProp=true;parent.add(mesh);if(solid)world.colliders.push({id:name,x:pos[0],z:pos[2],w:size[0],d:size[2],height:pos[1]+size[1]/2});return mesh;};
 const anchor=(pos,label,kind,title,text)=>{const a=new THREE.Object3D();a.position.set(...pos);group.add(a);register(a,label,()=>onAction(kind,title,text));return a;};

 // Urban routes are paved once by lane-surfaces.js, including coastal bends.
 // The urban boundary excludes rural scenery, remote buildings and their interactions.
 anchor([-25,1,-39.65],'Complete the airport radio service','island-repair');
 // Airport passenger walkway, check-in counter and a usable local landing (the fence is in airport-district.js).
 world.shoppingLane=buildShoppingLane({world,register,onAction});
 // Kitano-jima's district when he heads there; until then as it is seen from Minato (kitano-on-demand.js).
 kitanoLater(world,'airport district',()=>buildAirportDistrict({world,register,onAction}));
 if(world.kitano?.distant)world.kitano.far(buildAirportDistrictFar(world));
 world.airportVehicleYard=buildAirportVehicleYard(world);
 const airport=world.airportIsland.group;box('Airport passenger pavement',[88,.1,2.7],[0,1.05+GROUND_LAYER.grass,18.35],0xc4c0aa,false,airport);box('Check-in desk',[4,.9,.55],[-10,1.55,17.8],0x517282,false,airport);
 const [cx,cz]=AIRPORT_COUNTER;anchor([cx,AIRPORT_HEIGHT+1.2,cz],'Airport tickets and check-in','airport-counter');const [lx,lz]=AIRPORT_LANDING;anchor([lx,AIRPORT_HEIGHT+1.2,lz],'Airport ferry back to Minato','airport-return');const view=airportWorld(30,18.4);anchor([view[0],AIRPORT_HEIGHT+1,view[1]],'Read the airport departures board','airport-counter');
 const cargo=box('Airport cargo shelter',[6,.2,3],[-23,3.8,18.2],0x517282,false,airport);cargo.visible=false;cargo.userData.staticProp=false;
 (world.landmarks??=[]).push(...ISLAND_LANDMARKS,{id:'airport-island',title:'Kitano-jima Airport',sub:'COMMUTER FLIGHTS · FERRY TRANSFER',x:cx,z:cz,exitPosition:[cx,AIRPORT_HEIGHT,cz],entryFacing:0,line:'A tropical island across the strait: Coral Bay, the jungle trail and the commuter airport. Take the Minato ferry; check-in closes ten minutes before departure.'});
 return {group,cargo,update(state){cargo.visible=!!state.island?.projects.includes('cargo');}};
}
