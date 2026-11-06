import * as THREE from '../../../vendor/three.module.js';
import {BUILDING,FIXTURES,PARTITIONS,INNER_DOORS,OPENINGS,INSIDE,SHOP,HOURS,kitahamaShopOnDuty} from '../okinawa/kitahama-shop.js';
import {createAvatarActor,updateAvatarActor} from '../../avatars/actors.js';
import {loadKitahamaShopModels,kitahamaShopModel} from '../kitahama-shop-build.js';

/**
 * Inside Johansson Mart, Kitahama: the room you walk into from the door (batch 2 of bringing the shop in; the owner,
 * 27 October 2026). The room is drawn in the shop's own frame, as the models are: x = u (east), z = v (north), the
 * shop floor at y 0 (the models sit 100 mm down, BUILDING.floor). So its front glazing maps onto the real street with no
 * turn (KITAHAMA_SHOP_FRONTAGE, render/shop-street-view.js) and the fittings stand where the drawing puts them.
 *
 * What is solid: the walls' inside faces, the stockroom's partitions (but its door, D3, which only the keeper uses: the
 * counter's flap keeps customers to the shop floor) and every fitting. The customer's floor is what is left: the window
 * aisle, round the island, the cooler and the chiller, the front of the counter.
 */
const FL=BUILDING.floor,CE=BUILDING.ceiling-FL,[OU,OV]=BUILDING.outside;
const door=OPENINGS.find(o=>o.id==='D1');
export const KITAHAMA_SHOP_ROOM=Object.freeze({
 bounds:Object.freeze({minX:INSIDE.u0,maxX:INSIDE.u1,minZ:INSIDE.v0,maxZ:INSIDE.v1}),
 // Just inside the door, facing into the shop (yaw π faces +z, as in the town).
 spawn:Object.freeze([(door.from+door.to)/2,0,.95]),exit:Object.freeze([(door.from+door.to)/2,1.1,.35]),yaw:Math.PI,
 // Where the keeper stands behind the till, facing the shop floor (west, -x): read by the keeper's day (batch 3).
 staff:Object.freeze({'Grandmother Higa':Object.freeze([5.25,0,2.6])}),
 ceiling:CE,
});

/** The front glazing (the door and the shop window) on the real street: the room's origin is the shop's local origin,
 *  which stands at the shop's corner on the island, one floor's height above the apron. */
export function kitahamaShopFrontage(world,padTop){
 const W1=OPENINGS.find(o=>o.id==='W1');
 return {position:[world[0],padTop+FL,world[1]],yaw:Math.PI,interiorYaw:Math.PI,interiorOrigin:[0,0,0],
  // In the frontage's own frame (turned by its yaw): local u runs to -x there.
  span:{minX:-door.to,maxX:-W1.from,minY:.05,maxY:W1.head-FL},hideGlazing:false};
}

/** What she says across the counter on the web: one short line (people/greetings.js, at most 35 characters). */
export const KEEPER_GREETING='Welcome. Take your time, dear.';

export function buildKitahamaShopRoom({site,room,reg,collider=()=>{},action,exit,getMinutes=()=>0}){
 const group=new THREE.Group();group.name='Johansson Mart interior';room.add(group);
 const solids=[];
 const solid=(x0,x1,z0,z1,h=CE,y0=0)=>{const c={x:(x0+x1)/2,z:(z0+z1)/2,w:x1-x0,d:z1-z0,height:h-y0,minY:y0};solids.push(c);collider(c.x,c.z,c.w,c.d,c.height,c.minY);return c;};
 // The walls' inside faces, a hand's breadth thick inside them.
 const I=INSIDE,t=.1;
 solid(I.u0-t,I.u1+t,I.v0-t,I.v0);solid(I.u0-t,I.u1+t,I.v1,I.v1+t);
 solid(I.u0-t,I.u0,I.v0,I.v1);solid(I.u1,I.u1+t,I.v0,I.v1);
 // The stockroom: its partitions, closed to customers (the staff door D3 is the keeper's; the flap keeps you out).
 for(const p of PARTITIONS)solid(p.min[0],p.max[0],p.min[1],p.max[1]);
 const d3=INNER_DOORS[0];solid(d3.from,d3.to,4.40,4.50);
 // Every fitting, to its own height over the floor.
 for(const f of FIXTURES)solid(f.min[0],f.max[0],f.min[1],f.max[1],f.max[2]-FL);
 // The models, the floor at y 0. Loaded with the shop outside (kitahama-shop-build.js); waited for at the door.
 const models=new THREE.Group();models.position.y=-FL;group.add(models);
 for(const part of ['interior','exterior']){const m=kitahamaShopModel(part);if(m){m.traverse(o=>{if(o.isMesh&&/roof|parapet|tank|sign|canopy|vending|bins|A-board|condens|downpipe|louvre/i.test(o.name))o.visible=part==='interior';});models.add(m);}}
 // The light: the troffers are the model's; their light is a warm-white fill and two lamps over the floor.
 const fill=new THREE.HemisphereLight(0xfffbf0,0xcfcac0,.9);fill.position.set(OU/2,CE,OV/2);group.add(fill);
 for(const [x,z] of [[1.6,2.2],[3.2,4.6]]){const l=new THREE.PointLight(0xfff6e6,2.2,8,1.6);l.position.set(x,CE-.25,z);group.add(l);}
 // What can be looked at and done: the till, the hot case, the greens, the cooler, the magazines, the copier.
 const anchor=(x,y,z,label,fn)=>{const a=new THREE.Object3D();a.position.set(x,y,z);group.add(a);reg?.(a,label,fn);};
 const F=id=>FIXTURES.find(f=>f.id===id),mid=f=>[(f.min[0]+f.max[0])/2,(f.min[1]+f.max[1])/2];
 const say=(title,text)=>()=>action?.('read',title,text);
 {const [,z]=mid(F('F1'));anchor(F('F1').min[0]-.45,1.1,2.3,'Look at the till',say(SHOP.name+' · the till','A cash register with a green pole display, the hot case beside it, and at the customer’s end a tray of gōyā and island greens from Grandmother Higa’s garden, picked that morning.'));}
 {const [x,z]=mid(F('F3'));anchor(x,1.2,F('F3').min[1]-.5,'Look in the drinks cooler',say('The drinks cooler','Three glass doors: tea, water, milk coffee and sports drinks, and the beer and chūhai that are sold here when Sakura is shut.'));}
 {const [x,z]=mid(F('F5'));anchor(F('F5').max[0]+.45,1.2,z,'Look at the chiller',say('The chiller','Bento, onigiri and sandwiches on the stepped shelves, milk and tofu at the top: supper for whoever finishes late.'));}
 {const [x,z]=mid(F('F7'));anchor(x,1.1,F('F7').max[1]+.45,'Look at the magazines',say('The magazine rack','The island paper, printed by Nhung, the weeklies, manga and puzzle books, read by the window.'));}
 {const [x,z]=mid(F('F8'));anchor(F('F8').max[0]+.35,1.0,z,'Look at the copier',say('The copier','¥10 a copy. The residents’ association copies its notices here.'));}
 anchor(KITAHAMA_SHOP_ROOM.exit[0],KITAHAMA_SHOP_ROOM.exit[1],KITAHAMA_SHOP_ROOM.exit[2],'Go out to the lane',()=>exit?.());
 // The keeper: Grandmother Higa behind the till while the shop has her (SHOP_DUTY), facing the shop floor (west, -x).
 // She is a neighbour of the town (people/neighbours.js), drawn here by the room itself; in the street she is indoors.
 const keeperAt=KITAHAMA_SHOP_ROOM.staff['Grandmother Higa'];
 const keeperBody=new THREE.Group();keeperBody.name='Grandmother Higa at the till';keeperBody.position.set(keeperAt[0],0,keeperAt[2]);
 // An avatar faces +z at rotation 0; a quarter turn the positive way faces it to -x, the shop floor (seen in the game).
 keeperBody.rotation.y=Math.PI/2;group.add(keeperBody);
 let keeper=null;
 const onDuty=()=>kitahamaShopOnDuty(getMinutes());
 const showKeeper=()=>{const on=onDuty();if(on&&!keeper)keeper=createAvatarActor(keeperBody,'Grandmother Higa');keeperBody.visible=on;};
 showKeeper();
 anchor(F('F1').min[0]-.45,1.3,keeperAt[2],'Talk to Grandmother Higa',()=>onDuty()?action?.('read','Grandmother Higa',KEEPER_GREETING)
  :action?.('read',SHOP.name,'Nobody at the till: Grandmother Higa is not in yet.'));
 return {...KITAHAMA_SHOP_ROOM,solids,colliders:[],
  hours:HOURS.signEnglish,
  /** Each frame in the room: the keeper breathes and looks about; she comes and goes with her duty. */
  ownedUpdate(dt){showKeeper();if(keeper&&keeperBody.visible)updateAvatarActor(keeper,dt);},
  keeper:()=>keeperBody.visible?keeperBody:null,
  dispose(){group.traverse(o=>{if(o.isLight)o.dispose?.();});}};
}

/** Wait for the models at the door, so the room never opens empty. */
export const kitahamaShopRoomReady=()=>loadKitahamaShopModels();
