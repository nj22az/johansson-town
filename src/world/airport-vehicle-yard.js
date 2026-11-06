import * as THREE from '../../vendor/three.module.js';
import {AIRPORT_CARGO_SURFACE,airportWorld} from './airport-ground.js';
import {AIRPORT_ISLAND} from './airport-island.js';
import {SEA_LEVEL} from './ocean.js';

/** A connected cargo court entirely on the airport arrival plaza, below Terminal A. */
export const AIRPORT_VEHICLE_YARD=Object.freeze({...AIRPORT_CARGO_SURFACE,
 bays:Object.freeze([[-20,25],[-28,25],[-36,25],[-36,34.1],[-28,34.1],[-20,34.1]].map(Object.freeze)),
 stage:Object.freeze([-46.5,29.5])});
export function airportVehiclePoint(u,v){const [x,z]=airportWorld(u,v);return [x,AIRPORT_VEHICLE_YARD.y,z];}
export function airportVehicleBay(i){const [u,v]=AIRPORT_VEHICLE_YARD.bays[i],[x,y,z]=airportVehiclePoint(u,v);return {where:'airport',bay:i,x,y,z,yaw:AIRPORT_ISLAND.yaw+(i<3?Math.PI/2:-Math.PI/2)};}

export function buildAirportVehicleYard(world){
 const Y=AIRPORT_VEHICLE_YARD,group=new THREE.Group();group.name='Airport cargo vehicle court';world.airportIsland.group.add(group);
 const asphalt=new THREE.MeshStandardMaterial({color:0x73786c,roughness:.96}),paint=new THREE.MeshStandardMaterial({color:0xd6c8a7,roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const slab=new THREE.Mesh(new THREE.BoxGeometry(Y.maxX-Y.minX,.04,Y.maxZ-Y.minZ),asphalt);slab.name='Connected airport cargo asphalt';slab.position.set((Y.minX+Y.maxX)/2,Y.y-SEA_LEVEL-.02,(Y.minZ+Y.maxZ)/2);slab.receiveShadow=true;group.add(slab);
 for(const [u,v] of Y.bays)for(const dz of [-1.3,1.3]){const line=new THREE.Mesh(new THREE.BoxGeometry(5,.012,.10),paint);line.name='Cargo loading bay marking';line.position.set(u,Y.y-SEA_LEVEL+.008,v+dz);group.add(line);}
 return group;
}
