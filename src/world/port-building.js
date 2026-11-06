import * as THREE from '../../vendor/three.module.js';
import {benchSeat} from './seat-slots.js';
import {createKit} from './okinawa/kit.js';
import {createMaterials} from '../render/materials.js';
import {flowerBlock,roofTile,poster} from './okinawa/signs.js';

/**
 * The Minato Port Building (docs/PORT-BUILDING-PLAN.md): one building on the quay for
 * the ferry and the harbour, where there used to be a booth and a separate office.
 *
 * A 1970s Okinawan public building: a cream rendered box on a plinth, a red-tile pent
 * roof along the eaves, a flower-block screen on the upper floor and a clock tower on
 * the corner the ferry comes in to. The waiting hall faces the pier under its canopy;
 * the Harbour Office keeps its own door on the town side. World frame, metres.
 */
/**
 * The timetable poster under the canopy: the service as the ferry runs it (the same words as the
 * hall's departures board, the harbour office on the telephone and the boarding menu).
 */
export const PORT_TIMETABLE_POSTER=Object.freeze(['MINATO ⇄ KITANO-JIMA','Minato Maru · 22 min','Out 7:30 · 8:45 · 14:45 · 22:15','Commuter boats in:','8:30 · 14:30 · 22:00','She does not wait'])
export const PORT_BUILDING=Object.freeze({
 office:Object.freeze({minX:9.7,maxX:16.9,minZ:-46.9,maxZ:-38.4}),
 hall:Object.freeze({minX:5.6,maxX:9.7,minZ:-46.9,maxZ:-39.6}),
 tower:Object.freeze({minX:5.6,maxX:8.2,minZ:-46.9,maxZ:-45.4,height:11}),
 ground:3.4,upper:3,
 /** The waiting hall's glass doors, on the pier side. */
 hallDoor:Object.freeze([5.6,0,-42.6]),
 /** Passenger cover remains clear of the cargo bays and their turning paths. */
 canopy:Object.freeze({minX:3.85,maxX:5.6,minZ:-45.2,maxZ:-40}),
 /** Where somebody waiting for the boat stands, and where the driver waits for his. */
 platform:Object.freeze([4.7,-44.3]),
 driver:Object.freeze([4.65,-41.4]),
});

const P=PORT_BUILDING;
const CREAM=0xeee6d2,PLINTH=0xa9aa9c,TEAL=0x2f5f6a,TILE=0xb9573f,STEEL=0x7f888b,GLASS=0x40585a,ALU=0xb8bec0,SLAB=0xc8c2b5;

/** Colliders in the town's centre-and-size form. The office keeps its own (tests and residents use it). */
export function portBuildingColliders(){
 const r=(id,b,height)=>({id,x:(b.minX+b.maxX)/2,z:(b.minZ+b.maxZ)/2,w:b.maxX-b.minX,d:b.maxZ-b.minZ,height});
 const posts=[[P.canopy.minX+.1,P.canopy.minZ+.15],[P.canopy.minX+.1,P.canopy.maxZ-.15]].map(([x,z])=>({id:'port-canopy-post',x,z,w:.2,d:.2,height:2.9}));
 return [r('port-waiting-hall',P.hall,P.ground+.4),r('port-clock-tower',P.tower,P.tower.height),...posts,{id:'port-canopy-bench',x:P.canopy.minX+.3,z:-44.0,w:.42,d:1.7,height:.5}];
}

export function buildPortBuilding({parent,label=()=>{},shadows=false,register,onAction}){
 const group=new THREE.Group();group.name='Minato Port Building';parent.add(group);
 const kit=createKit({shadows});
 const plaster=createMaterials().material('plaster');
 kit.surface('plaster',{map:plaster.map,normalMap:plaster.normalMap,normalScale:plaster.normalScale,roughnessMap:plaster.roughnessMap,aoMap:plaster.aoMap,metres:2});
 kit.surface('hana',{map:flowerBlock(),metres:.42});
 kit.surface('tile',{map:roofTile(),metres:.9,roughness:.8,side:THREE.DoubleSide});
 const G=P.ground,U=P.upper,O=P.office,H=P.hall,T=P.tower;

 // Plinth and the ground floor: the office block and the waiting hall beside it.
 kit.block(H.minX-.1,O.maxX+.1,0,.3,O.minZ-.1,O.maxZ+.1,PLINTH);
 kit.block(O.minX,O.maxX,.3,G,O.minZ,O.maxZ,CREAM,'plaster');
 kit.block(H.minX,H.maxX,.3,G,H.minZ,H.maxZ,CREAM,'plaster');
 // A teal band where the ground floor meets the slab, the colour the ferry company paints.
 kit.block(H.minX-.04,O.maxX+.04,G,G+.3,O.minZ-.04,O.maxZ+.04,TEAL);
 kit.block(H.minX-.04,H.maxX,G,G+.3,H.minZ-.04,H.maxZ+.04,TEAL);

 // The hall's pier front: a timetable pier, glass, the doors, glass, all under the canopy.
 const wx=H.minX-.03,doorZ=P.hallDoor[2];
 const pane=(z0,z1)=>{kit.box(.05,2.35,z1-z0,wx,1.6,(z0+z1)/2,GLASS,{finish:'window'});
  for(const z of [z0,z1])kit.box(.08,2.45,.07,wx-.01,1.6,z,ALU,{finish:'metal'});
  kit.box(.08,.07,z1-z0,wx-.01,2.8,(z0+z1)/2,ALU,{finish:'metal'});kit.box(.08,.07,z1-z0,wx-.01,.42,(z0+z1)/2,ALU,{finish:'metal'});};
 pane(-44.55,doorZ-.95);pane(doorZ+.95,H.maxZ-.25);
 for(const s of [-1,1])kit.box(.06,2.2,.88,wx,1.4,doorZ+s*.46,0x5a7476,{finish:'window'});
 kit.box(.09,.09,1.95,wx-.02,2.52,doorZ,ALU,{finish:'metal'});
 for(const s of [-1,0,1])kit.box(.09,2.2,.06,wx-.02,1.4,doorZ+s*.92,ALU,{finish:'metal'});
 // The south front, to the sea: a long window band in both blocks.
 for(const [x0,x1] of [[T.maxX+.3,H.maxX-.3],[O.minX+.4,O.maxX-.4]]){
  kit.box(x1-x0,1.3,.05,(x0+x1)/2,1.85,O.minZ-.03,GLASS,{finish:'window'});
  for(let x=x0;x<=x1+.01;x+=(x1-x0)/Math.max(1,Math.round((x1-x0)/1.8)))kit.box(.07,1.38,.08,x,1.85,O.minZ-.04,ALU,{finish:'metal'});
  kit.box(x1-x0+.2,.08,.22,(x0+x1)/2,1.15,O.minZ-.1,SLAB);
 }
 // The town front: the office's windows either side of its door.
 for(const x of [11.1,15.5]){
  kit.box(1.7,1.5,.05,x,1.9,O.maxZ+.03,GLASS,{finish:'window'});
  for(const dx of [-.85,0,.85])kit.box(.05,1.5,.08,x+dx,1.9,O.maxZ+.05,ALU,{finish:'metal'});
  kit.box(1.85,.07,.2,x,1.1,O.maxZ+.1,SLAB);
 }
 kit.box(1.4,.5,.05,7.6,1.9,H.maxZ+.03,GLASS,{finish:'window'});

 // Red-tile pent roofs over the ground-floor eaves, south and north: the Okinawan touch.
 const pent=(x0,x1,z,out)=>kit.box(x1-x0+.5,.07,1,(x0+x1)/2,G+.42,z+out*.42,TILE,{rx:out*.38,finish:'tile'});
 pent(T.maxX,O.maxX,O.minZ,-1);pent(H.minX,H.maxX,H.maxZ,1);pent(O.minX,O.maxX,O.maxZ,1);

 // The upper floor, the Harbour Office's records room, set back from the sea front.
 const u0=G+.3,u1=u0+U,uz0=O.minZ+1;
 kit.block(O.minX,O.maxX-.5,u0,u1,uz0,O.maxZ-.6,CREAM,'plaster');
 kit.block(O.minX+.25,O.maxX-.75,u0+.75,u0+2.05,uz0-.07,uz0+.01,CREAM,'hana');
 for(const x of [11.4,13.3,15.2]){kit.box(1.3,1.2,.05,x,u0+1.45,O.maxZ-.57,GLASS,{finish:'window'});kit.box(1.4,.07,.18,x,u0+.8,O.maxZ-.52,SLAB);}
 kit.block(O.minX-.05,O.maxX-.45,u1,u1+.15,uz0-.05,O.maxZ-.55,SLAB);
 kit.block(O.minX-.06,O.maxX-.44,u1+.15,u1+.55,uz0-.06,O.maxZ-.54,TEAL);
 // The hall's flat roof: a low parapet.
 for(const [x0,x1,z0,z1] of [[T.maxX,H.maxX,H.maxZ-.14,H.maxZ],[H.minX,H.minX+.14,T.maxZ,H.maxZ]])kit.block(x0,x1,G+.3,G+.75,z0,z1,CREAM,'plaster');

 // The clock tower, on the corner the ferry comes in to: render, slit windows, a clock
 // to the sea and one to the town, an open lookout, a red-tile hip and the radio mast.
 const tx=(T.minX+T.maxX)/2,tz=(T.minZ+T.maxZ)/2,tw=T.maxX-T.minX,shaft=T.height-1.9;
 kit.block(T.minX,T.maxX,G+.3,shaft,T.minZ,T.maxZ,CREAM,'plaster');
 kit.block(T.minX-.06,T.maxX+.06,shaft,shaft+.2,T.minZ-.06,T.maxZ+.06,TEAL);
 for(const y of [4.6,5.9])for(const [x,z,ry] of [[T.minX-.03,tz,Math.PI/2],[tx,T.minZ-.03,0]])kit.box(.32,.9,.05,x,y,z,GLASS,{ry,finish:'window'});
 for(const [z,face] of [[T.minZ-.04,-1],[T.maxZ+.04,1]]){
  const y=shaft-.75;
  kit.cyl(.82,.82,.06,tx,y,z,0x2b3436,{segments:24,rx:Math.PI/2});
  kit.cyl(.74,.74,.07,tx,y,z+face*.01,0xf6f1e2,{segments:24,rx:Math.PI/2,finish:'glow'});
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;kit.box(.05,i%3?.1:.18,.02,tx+Math.sin(a)*.62,y+Math.cos(a)*.62,z+face*.05,0x2b3436,{rz:-a});}
  kit.box(.06,.42,.02,tx+.12,y+.16,z+face*.06,0x2b3436,{rz:-.62});
  kit.box(.06,.58,.02,tx-.08,y+.27,z+face*.065,0x2b3436,{rz:.3});
 }
 kit.block(T.minX-.15,T.maxX+.15,shaft+.2,shaft+.32,T.minZ-.15,T.maxZ+.15,SLAB);
 for(const [x,z] of [[T.minX,T.minZ],[T.maxX,T.minZ],[T.maxX,T.maxZ],[T.minX,T.maxZ]])kit.box(.16,1.25,.16,x+(x<tx?.07:-.07),shaft+.95,z+(z<tz?.07:-.07),CREAM);
 for(const [x0,x1,z0,z1] of [[T.minX,T.maxX,T.minZ,T.minZ+.06],[T.minX,T.maxX,T.maxZ-.06,T.maxZ],[T.minX,T.minX+.06,T.minZ,T.maxZ],[T.maxX-.06,T.maxX,T.minZ,T.maxZ]])kit.block(x0,x1,shaft+.75,shaft+.82,z0,z1,STEEL,'metal');
 kit.hipRoof(tw,tw,.95,tx,shaft+1.57,tz,TILE,{overhang:.35,finish:'tile'});
 kit.rod([tx,shaft+2.4,tz],[tx,T.height+2.6,tz],.04,STEEL);
 for(const y of [T.height+1.2,T.height+2])kit.rod([tx-.35,y,tz],[tx+.35,y,tz],.02,STEEL);

 // The canopy on the pier side, where the queue forms, on two slim steel columns.
 const C=P.canopy;
 kit.block(C.minX,C.maxX,2.78,2.92,C.minZ,C.maxZ,SLAB);
 kit.block(C.minX-.02,C.maxX,2.92,3.06,C.minZ-.02,C.maxZ+.02,TEAL);
 for(const z of [C.minZ+.15,C.maxZ-.15])kit.cyl(.065,.065,2.78,C.minX+.1,1.39,z,STEEL,{segments:8,finish:'metal'});
 // A bench under it, for the boat.
 kit.box(1.7,.08,.42,C.minX+.3,.46,-44.0,0x8d7652,{ry:Math.PI/2});
 for(const dz of [-.6,.6])kit.box(.38,.42,.08,C.minX+.3,.23,-44.0+dz,STEEL,{finish:'metal'});

 const waitingSeat=new THREE.Object3D();waitingSeat.position.set(C.minX+1.15,1,-44.0);waitingSeat.userData.seat=benchSeat({id:'port-canopy-bench',position:[C.minX+.3,0,-44.0],stand:[C.minX+1.15,0,-44.0],surfaceY:.5,eyeY:1.2,yaw:-Math.PI/2,pitch:0},{length:1.7,front:.21});group.add(waitingSeat);register?.(waitingSeat,'Sit under the ferry canopy',()=>onAction?.('seat','Ferry canopy bench','A dry bench beside the waiting hall, looking out across the quay.'));

 // The timetable, on the pier between the tower and the glass.
 kit.sign(poster({title:'Timetable',lines:PORT_TIMETABLE_POSTER,band:'#2b5a78',bg:'#f3ecd8'}),.62,.86,wx-.04,1.55,-44.98,{ry:-Math.PI/2,name:'Ferry timetable'});
 kit.finish(group,'Port building shell');

 // Names: the terminal over the canopy, to the pier; tickets over the doors.
 label('Minato Port Terminal','MINATO PORT TERMINAL',[H.minX-.05,G+.6,-42.4],3.4,.5,-Math.PI/2,'#e7dcc0','#2b5a78',true);
 label('Tickets','TICKETS · WAITING HALL',[wx-.06,2.62,doorZ],1.5,.24,-Math.PI/2,'#2b5a78','#f3ecd8');
 return {group};
}
