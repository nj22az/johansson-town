import {buildFishingBoat,EAST_QUAY_BOAT_LOOKS} from '../harbour-boats.js';
import {benchSeat} from '../seat-slots.js';
import {hangingRope} from '../timber-pier.js';
import {SEA_LEVEL} from '../ocean.js';
import {SHED_WALKWAY} from '../fujita-layout.js';
import {COURT_TERRACE} from '../park-layout.js';
import {GROUND} from '../../render/ground-palette.js';
/** The east lawn's south edge (east-lawn.js EAST_LAWN.minZ), where the seawall's return begins. */
const EAST_LAWN_SOUTH=-38;
import * as THREE from '../../../vendor/three.module.js';
import {createKit,rng} from './kit.js';
import {buildAuctionBoard} from '../auction-board.js';
import {buildWestShore} from '../west-shore.js';
import {buildFishMarket,fishCounterOpen,FISH_COUNTER,SORTING_STACK,QUAY_EDGE} from '../fish-market.js';
import {fishById} from './fish.js';
import {createMaterials} from '../../render/materials.js';
import {utakiStones,NISHI,EAST_ROW,YARD_ROW,EAST_QUAY,EAST_BACK,GATEBALL,GATEBALL_ACTIVE,GOYA,KITAHAMA} from './layout.js';
import {fascia,vertical,nameplate,poster,coralStone,roofTile,flowerBlock,coralSand} from './signs.js';
import {redTileHouse,concreteHouse,shopHouse,coralWall,blockWall,hinpun,shisa,fukugi,gajumaru,hibiscus,banana,potPlant,OKINAWA_COLOURS as C} from './houses.js';
import {utilityPole,wiresBetween,serviceDrop,bicycle,laundry,gasBottles,fishCrates,buoys,netPile,sabani,planterBoxes} from './props.js';
import {GROUND_LAYER} from '../ground-layers.js';
import {KITAHAMA_LANES} from '../kitahama-layout.js';
import {buildKitahamaQuarter} from './kitahama-quarter.js';
import {plotGate} from './layout.js';
import {residentsLine,homeNameplate} from '../../people/island-households.js';
import {dressOldTown} from './old-town.js';
import {buildStreetLots} from './lots.js';
import {buildLotDressing} from './lot-dressing.js';
import {buildLaneEdges} from './lane-edges.js';


import {MAIN_ROAD} from '../main-road.js';
import {WEST_YARD} from '../west-yard.js';
import {createVendingMachine,vendingReady,hydrateVending,VENDING_MACHINE} from '../vending.js';
import {windowGlow} from '../../render/dusk.js';
import {dessertShopOpen,BLUE_CORAL} from '../blue-coral-shop.js';
import {higaFrontage,higaPoint} from './higa-liquor-dressing.js';
import {buildKissaProps} from './kissa-higa-props.js';
import {laundryFrontage,LAUNDRY_BENCH,laundryPoint} from './coin-laundry-dressing.js';
import {HIGA_KUSU,YUNTAKU,yuntakuSeatAt} from '../../commerce/higa-liquor.js';
import {KISSA,KISSA_NOTICE,KISSA_MENU,KISSA_RECORDS,KISSA_SEATS,kissaOpen,kissaPassable,kissaShutterDown,inKissaHiga} from '../../commerce/kissa-higa.js';
import {laundryNotices,laundryMachinesAt,LAUNDRY_MANGA} from '../../commerce/coin-laundry.js';

/**
 * Builds the streets that fill the island in: Nishi-machi to the west, the shop-houses
 * on the east side of Main Street and the two on the west side by the terminus. See
 * layout.js for the plan and houses.js / props.js for what they are made of.
 *
 * @param {object} world the town being built (group, colliders, hourly, details)
 * @param {object} options register, onAction, shadows
 */
export function buildOkinawaQuarters(world,{register,onAction,shadows=false,getPlayerPosition=()=>null}={}){
 const group=new THREE.Group();group.name='Okinawan quarters';world.group.add(group);
 const kit=createKit({shadows});
 const plaster=createMaterials().material('plaster');
 kit.surface('plaster',{map:plaster.map,normalMap:plaster.normalMap,normalScale:plaster.normalScale,roughnessMap:plaster.roughnessMap,aoMap:plaster.aoMap,metres:2});
 kit.surface('coral',{map:coralStone(),metres:1.6});
 kit.surface('tile',{map:roofTile(),metres:.9,roughness:.8,side:THREE.DoubleSide});
 kit.surface('hana',{map:flowerBlock(),metres:.42});
 kit.surface('sand',{map:coralSand(),metres:3.2,roughness:1});
 const colliders=[],kissaPrompts=[];
 const solid=list=>{for(const c of [].concat(list))if(c)colliders.push(c);};
 const anchor=(x,y,z,label,fn)=>{const a=new THREE.Object3D();a.position.set(x,y,z);group.add(a);register?.(a,label,fn);return a;};
 const inspect=(x,y,z,label,title,text)=>anchor(x,y,z,label,()=>onAction?.('inspect',title,text));
 const vendings=[],ropeMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92});
 const vending=(x,z,ry,y=0)=>{
  const machine=createVendingMachine({shadows});machine.position.set(x,y,z);machine.rotation.y=ry;group.add(machine);vendings.push(machine);
  // its collider is its footprint: the cabinet and the pad's lip in front of it (so nobody stands on the pad's edge)
  const S=VENDING_MACHINE.size,across=S.width+.06,deep=S.depth+S.padFront+.04,off=(S.padFront+.04)/2,side=Math.abs(Math.sin(ry))>.5;
  colliders.push({id:'vending',x:x+Math.sin(ry)*off,z:z+Math.cos(ry)*off,w:side?deep:across,d:side?across:deep,height:2.2});
  anchor(x+Math.sin(ry)*.95,1,z+Math.cos(ry)*.95,'Buy a drink',()=>onAction?.('vending'));
 };

 buildNishiGround(kit,solid);
 buildNishiPlots(kit,solid,{inspect,anchor,onAction});
 buildWestQuay(kit,solid,{inspect,anchor,onAction,vending});
 buildPromenade(kit,solid,{anchor,onAction});
 // North of the seawall the shore is the west-shore bank, in the same coral stone. See west-shore.js.
 buildWestShore(kit,solid,{anchor,onAction,group});
 buildYardRow(kit,solid,{anchor,inspect,onAction,getMinutes:()=>world.minutes??720});
 buildEastRow(kit,solid,{anchor,inspect,onAction,vending,getMinutes:()=>world.minutes??720,kissaPrompts,
  getHiga:()=>world.quarters?.higa,getPeople:()=>[...(world.people||[]).map(p=>p.g),...(world.neighbours||[])]});
 buildEastBack(kit,solid,{anchor,inspect,onAction});
 if(GATEBALL_ACTIVE)buildGateball(kit,solid,{anchor,inspect,onAction});
 const fishMarket=buildEastQuay(kit,solid,{group,anchor,inspect,onAction,vending,getMinutes:()=>world.minutes??720,eastQuayBoat:(x,z,ry,opts)=>{
  // Her bow along the plan's +x turned by ry (as props.js drew her); she lies quay side to, her lines to the kerb.
  const face=EAST_QUAY.minZ-.45,side=Math.cos(ry)>0?-1:1,gap=face-(z+opts.beam/2);
  const boat=buildFishingBoat({...opts,shadows,name:opts.look.name,quayFenders:{side,radius:Math.min(.22,gap/2)}});boat.position.set(x,SEA_LEVEL,z);boat.rotation.y=ry+Math.PI/2;group.add(boat);boat.updateMatrixWorld(true);
  for(const f of boat.userData.fairleads){const p=boat.localToWorld(new THREE.Vector3(...f)),ring=[p.x+(p.x>x?1.2:-1.2),.22,EAST_QUAY.minZ-.25];kit.box(.12,.05,.12,ring[0],.205,ring[2],0x2b2f30);group.add(new THREE.Mesh(hangingRope(p.toArray(),ring,{sag:.08}),ropeMaterial));}
 }});
 // The fish counter's wares are out while it is open (fish-market.js fishCounterOpen).
 fishMarket.wares.visible=fishCounterOpen(world.minutes??720);
 (world.hourly??=[]).push(minutes=>{fishMarket.wares.visible=fishCounterOpen(minutes);});
 buildWires(kit,solid);
 // Kitahama stands on the island's ground, below the old town's datum.
 kit.at(0,0,0,()=>buildKitahama(kit,solid,{anchor,inspect,onAction,vending:(x,z,ry)=>vending(x,z,ry,(KITAHAMA.y||0)+GROUND_LAYER.lane)}),KITAHAMA.y);
 // What stands where the surplus houses stood (lots.js), and the gutter-and-weed edge every Kitahama lane has (lane-edges.js).
 buildStreetLots(kit,solid,{anchor,onAction});
 // What the cleared lots are now (lots.js CLEARED_LOTS dressing): gardens, parking, the bicycle shed, the cane, the drinks corner.
 buildLotDressing(kit,solid,{anchor,onAction,vending});
 const laneEdges=buildLaneEdges(kit,group);

 const old=dressOldTown(kit,solid,{inspect,anchor,onAction,vending,group});

 const {meshes,materials}=kit.finish(group,'Okinawan quarter');
 // Kissa Higa's front in the old Higa Liquor, which follows its clock (higa-liquor-dressing.js higaFrontage: the shutter,
 // the doors, the tubes, the lamps and the board), its three Meshy models streamed in near it (kissa-higa-props.js), and
 // what follows the clock at the coin laundry: the machines turning, the baskets, the misted glass and the day's notices
 // (coin-laundry-dressing.js).
 const higa=higaFrontage({shadows,getOccupants:()=>[getPlayerPosition(),...(world.people||[]).map(p=>p.g),...(world.neighbours||[])]
  .filter(g=>g&&(!g.isObject3D||g.visible&&!g.userData.indoors&&!g.userData.inHome&&!g.userData.aboardFerry))
  .map(g=>g.position||g)}),coinLaundry=laundryFrontage({shadows});group.add(higa.group,coinLaundry.group);
 buildKissaProps({world,frontage:higa,shadows});
 higa.update(world.minutes??720);
 for(const p of kissaPrompts)p.visible=higa.shutterSolid.minY>100;
 colliders.push(higa.shutterSolid,higa.doorSolid,higa.aboardSolid);
 world.colliders.push(...colliders);
 // Windows light up and the lamps come on at dusk, like the rest of the town.
 (world.hourly??=[]).push(minutes=>{
  const glow=windowGlow(minutes);
  if(materials.glow)materials.glow.emissiveIntensity=glow*.75;
  if(materials.lamp)materials.lamp.emissiveIntensity=.1+glow*1.6;
  for(const machine of vendings)machine.userData.night?.(glow);   // the drinks machines' light on the pavement
  old.shutter.update(minutes);
  // The kissaten's way in opening or shutting: the residents' routes are searched again (game.js, neighbours.replan).
  if(higa.update(minutes))world.passagesChanged=true;
  for(const p of kissaPrompts)p.visible=higa.shutterSolid.minY>100;
  coinLaundry.update(minutes,world.laundryWash||null);
 });
 if(!vendingReady())for(const machine of vendings)(world.details??=[]).push({id:'okinawa-vending-'+machine.id,x:machine.position.x,z:machine.position.z,radius:44,load:()=>hydrateVending(machine,{shadows})});
 return {group,meshes,colliders,materials,shutter:old.shutter,laneEdges,higa,coinLaundry};
}

/* ------------------------------ Nishi-machi ------------------------------ */

function buildNishiGround(kit,solid){
 // The quarter's ground (the coral yards, the lanes and the walk, their gutters) is laid by the ground generator from
 // its plan (ground-plan-quarters.js, step 3 of the ground plan).
 const Q=NISHI.quay;
 // The quay's apron and its coping are the harbour's ground (ground-plan-harbour.js, laid by harbour.js).
 // The seawall along the shore, and its quay edge along the harbour.
 const S=NISHI.seawall;
 kit.block(S.x-S.thickness/2,S.x+S.thickness/2,-.7,S.height,NISHI.minZ,NISHI.maxZ+.4,0xb9b4a6);
 kit.block(S.x-S.thickness/2-.04,S.x+S.thickness/2+.04,S.height,S.height+.08,NISHI.minZ,NISHI.maxZ+.4,0xa9a497);
 solid({id:'seawall',x:S.x,z:(NISHI.minZ+NISHI.maxZ)/2,w:S.thickness+.1,d:NISHI.maxZ-NISHI.minZ+.4,height:S.height});
 // The quay edge, its yellow kerb and its solid edge, with a gap the width of the timber pier's walkway
 // (fujita-layout.js SHED_WALKWAY) where it lands, so you can walk onto the pier. The wall runs on under the
 // walkway as the shelf its stringers rest on (timber-pier.js); the gap was 4.8 m wide for the old L-shaped slab,
 // and left 2.6 m of the shore's grass for a quay wall beside the pier (2026-10-19).
 const PIER_GAP=[SHED_WALKWAY.minX,SHED_WALKWAY.maxX];
 for(const [x0,x1] of [[Q.minX-.6,PIER_GAP[0]],[PIER_GAP[1],Q.maxX]])solid({id:'west-quay-edge',x:(x0+x1)/2,z:Q.minZ-.25,w:x1-x0,d:.3,height:.4});
 for(const x of [-33.8]){kit.cyl(.16,.2,.42,x,.24,Q.minZ+.35,0x3a3f42,{segments:10});kit.cyl(.24,.24,.08,x,.47,Q.minZ+.35,0x3a3f42,{segments:10});solid({id:'bollard',x,z:Q.minZ+.35,w:.45,d:.45,height:.5});}
 // The north end opens into the residential street; no bank across the walk.

}

function buildNishiPlots(kit,solid,ctx){
 for(const [i,p] of NISHI.plots.entries()){
  if(p.kind==='shed'){netShed(kit,solid,p,ctx);continue;}
  if(p.kind==='grove'){utaki(kit,solid,p,ctx);continue;}
  walledHouse(kit,solid,p,{...ctx,seed:i,sideGate:'west',windbreak:'west'});
 }
}

/** Which way a plot's gate looks, as the turn that points a local +z that way. */
const FACING=Object.freeze({north:0,south:Math.PI,west:-Math.PI/2,east:Math.PI/2});

/**
 * A walled plot with its house: coral stone round it, a gate with shisa on the posts and
 * the family's name beside it, a hinpun inside a red-tile house's gate, fukugi along
 * the windward side and the garden things people keep. Built in the plot's own frame,
 * gate at the front (+z), whichever way that is in the world.
 */
function walledHouse(kit,solid,p,{anchor,onAction,seed=0,sideGate=null,windbreak=null}){
 const ry=FACING[p.gate],quarter=Math.abs(Math.sin(ry))>.5;
 const W=quarter?p.maxZ-p.minZ:p.maxX-p.minX,D=quarter?p.maxX-p.minX:p.maxZ-p.minZ;
 const r=rng(40+seed),hw=W/2,hd=D/2;
 // Local +x points this way in the world; used to put a side gate or a windbreak on
 // the right side of the plot whichever way it is turned.
 const sideOf=dir=>{const v={north:[0,1],south:[0,-1],east:[1,0],west:[-1,0]}[dir];if(!v)return 0;const lx=Math.cos(ry),lz=-Math.sin(ry);return Math.sign(Math.round(v[0]*lx+v[1]*lz));};
 kit.at((p.minX+p.maxX)/2,(p.minZ+p.maxZ)/2,ry,()=>{
  const gate=[-.95,.95],side=sideOf(sideGate),wind=sideOf(windbreak)||-1;
  // Old houses keep coral stone; houses built since the eighties got block walls.
  const wall=p.wall==='block'?(x0,z0,x1,z1,o)=>blockWall(kit,x0,z0,x1,z1,o):(x0,z0,x1,z1,o)=>coralWall(kit,x0,z0,x1,z1,o);
  solid(wall(-hw,hd,hw,hd,{gaps:[gate],seed:50+seed,flowers:seed%2===0}));
  solid(wall(-hw,-hd,hw,-hd,{seed:60+seed,flowers:seed%2===1}));
  solid(wall(-hw,-hd,-hw,hd,{gaps:side<0?[[-.6,.6]]:[],seed:70+seed}));
  solid(wall(hw,-hd,hw,hd,{gaps:side>0?[[-.6,.6]]:[],seed:80+seed}));
  for(const gx of gate)shisa(kit,gx,1.53,hd,0,.7);
  const plate=homeNameplate(p.id);
  kit.sign(nameplate(plate?.address||p.family,plate?.owners||p.romaji),.95,.32,gate[1]+.65,1.15,hd+.24,{name:'nameplate'});
  const at=kit.point(gate[1]+.45,1,hd+1);
  anchor(at.x,at.y,at.z,plate?plate.address+' · '+plate.owners:`Read the ${p.romaji} nameplate`,()=>onAction?.('read',plate?.title||`${p.family} · the ${p.romaji} house`,[residentsLine(p.id),NAMEPLATES[p.id]].filter(Boolean).join('\n\n')));
  hibiscus(kit,gate[0]-1.1,hd-.9,{seed:90+seed});
  if(p.kind==='red-tile'){
   solid(hinpun(kit,0,hd-2,Math.min(2.6,W-3)));
   // Backed onto the rear wall, as they are: the eaves hang over it, and there is no
   // strip behind the house too narrow to walk down but wide enough to get stuck in.
   // A windbreak needs its own strip beside the house and a path inside it, so a plot
   // wide enough for one gets a narrower house; a tight plot gets no trees.
   const trees=W>=10,d=6.2,w=Math.min(7.4,W-(trees?3.8:2.6)),houseZ=-hd+.3+d/2;
   kit.at(0,houseZ,0,()=>solid(redTileHouse(kit,{w,d,seed})));
   // Fukugi down the windward side, where there is room for a row of them and a path.
   if(trees)for(let z=-hd+1.2;z<hd-.8;z+=2.2)if(Math.abs(z)>1)solid(fukugi(kit,wind*(hw-.5),z,{h:5+r.next()*1.4,seed:100+seed*10+Math.round(z*3)}));
   banana(kit,-wind*(hw-.9),-hd+.9,{seed});
   // Gas bottles against the kitchen wall, leaving the side path clear.
   if(w/2+1.4<hw)solid(gasBottles(kit,-wind*(w/2+.32),houseZ-1,{ry:Math.PI/2}));
   potPlant(kit,1.6,hd-2.2,{seed});potPlant(kit,-1.8,hd-2.3,{seed:seed+3});
   solid(planterBoxes(kit,Math.min(hw-2.6,2.2),hd-.65,{count:3,seed}));
  }else{
   // The concrete house: no hinpun, a bicycle and washing in the yard instead.
   // Against the back and the side wall, with the outside stair on the open side.
   const d=6.2,w=Math.min(6.8,W-3.4),houseZ=-hd+.35+d/2,houseX=-hw+.35+w/2;
   kit.at(houseX,houseZ,0,()=>solid(concreteHouse(kit,{w,d,seed})));
   solid(laundry(kit,1.7,hd-1.7,{length:2.2}));
   // The bicycle stands inside the front wall right of the gate, the pot by the gate pier and the hibiscus in the
   // left-hand corner, so none of them stands in another or in the washing.
   potPlant(kit,1.3,hd-.45,{seed:seed+5});hibiscus(kit,-hw+.85,hd-.8,{seed:seed+9,flower:0xe8b12c,size:.5});
   solid(bicycle(kit,2.55,hd-.62,{ry:0,colour:0xb03a3a,frame:'step',id:'house-bicycle',owner:plate?.owners||p.romaji,
    why:'The household’s shopping bicycle, inside the front wall where it is off the lane and clear of the washing; it goes to Sakura and back with the basket full.'}));
  }
 });
}

/** The net shed at the quay end: an open-fronted timber shed with a tin roof. */
function netShed(kit,solid,p,{inspect}){
 const x0=-34.8,x1=-27.4,z0=p.minZ+.6,z1=p.maxZ-.6,h=3.1,tin=0x8c9ea3;
 kit.block(x1-.2,x1,0,h,z0,z1,tin);
 kit.block(x0+2.8,x1,0,h,z0,z0+.2,tin);kit.block(x0+2.8,x1,0,h,z1-.2,z1,tin);
 // Corrugated sheet: ribs up every wall, and the rust where the sheets overlap.
 for(let x=x0+3;x<x1;x+=.3)for(const z of [z0-.02,z1+.02])kit.box(.06,h,.04,x,h/2,z,0x7b8c91);
 for(let z=z0+.2;z<z1;z+=.3)kit.box(.04,h,.06,x1+.02,h/2,z,0x7b8c91);
 for(const [x,z] of [[x0+4.6,z0-.05],[x1-1.2,z1+.05],[x0+6.4,z1+.05]])kit.box(.5,h*.7,.02,x,h*.35,z,0x9a6a48);
 kit.box(.3,1.6,.02,x0+3.6,h-.9,z0-.06,0xe8e2d0);
 for(let z=z0;z<=z1;z+=(z1-z0)/4)kit.box(.18,h,.18,x0+.1,h/2,z,0x5d4431);
 kit.gableRoof(z1-z0,x1-x0,.9,(x0+x1)/2,h,(z0+z1)/2,0x8a9496,{ry:Math.PI/2,overhang:.5});
 // Corrugations, as ribs over the roof.
 for(let x=x0-.3;x<x1+.3;x+=.5)kit.box(.04,.03,z1-z0+1.02,x,h+.47-Math.abs(x-(x0+x1)/2)/((x1-x0)/2)*.45,(z0+z1)/2,0x7c8587);
 netPile(kit,x0+4,z0+2.2,{size:1.1});netPile(kit,x0+5.5,z1-2,{size:.9});
 buoys(kit,x1-.6,1.6,(z0+z1)/2,{count:10});
 for(const z of [z0+1.5,z1-1.5])kit.box(.08,.08,.08,x1-.3,2.4,z,0x5d4431);
 kit.box(.12,.9,1.8,x1-.35,1.2,(z0+z1)/2,0x3a6e8f);
 solid({id:'net-shed',x:(x0+2.8+x1)/2,z:(z0+z1)/2,w:x1-x0-2.8,d:z1-z0,height:h});
 for(let z=z0;z<=z1;z+=(z1-z0)/4)solid({id:'net-shed-post',x:x0+.1,z,w:.25,d:.25,height:h});
 inspect(x0-.4,1.2,(z0+z1)/2,'Inspect the net shed','Net shed',
  "Nets for the reef, mended where the coral took them, heaped on the floor with their floats. The orange ones are new; the glass ones are older than the harbour office. A sign on the post says Don't walk on the net — don’t walk on the nets.");
}

/** The utaki: the neighbourhood's sacred grove, where nobody builds and nobody shouts. */
function utaki(kit,solid,p,{anchor,onAction,inspect}){
 const cx=-30.8,cz=(p.minZ+p.maxZ)/2;
 // The grove's gravel is the ground's (ground-plan-quarters.js).
 solid(coralWall(kit,p.minX,p.minZ,p.maxX,p.minZ,{height:.9,gaps:[[cx-1,cx+1]],seed:120}));
 solid(coralWall(kit,p.minX,p.minZ,p.minX,p.maxZ,{height:.9,seed:121}));
 solid(coralWall(kit,p.maxX,p.minZ,p.maxX,p.maxZ,{height:.9,seed:122}));
 solid(gajumaru(kit,cx,cz+2.2,{seed:7,size:1.05}));
 for(const [x,z] of [[p.minX+1,p.minZ+2],[p.minX+1,p.maxZ-1.5],[p.maxX-1,p.minZ+2.2],[p.maxX-1,p.maxZ-1.2],[p.minX+3.5,p.maxZ-1],[p.maxX-3.4,p.maxZ-1]])solid(fukugi(kit,x,z,{h:6,seed:x*3+z}));
 // The stone path in, and the incense stone at the end of it.
 // Limestone stepping stones set in the gravel: the same stone, cut and laid.
 // They are set into it: the gravel's plan leaves their beds (ground-plan-quarters.js), their tops 14 mm over it.
 for(const s of utakiStones(p))kit.box(s.w,.05,s.d,s.x,GROUND_LAYER.gravel+.014-.025,s.z,0xa8a498);
 kit.box(1.4,.35,.9,cx,.18,cz-.6,0xcfc8b4,{finish:'coral'});
 kit.box(.5,.3,.36,cx,.5,cz-.6,0x9a958a);
 kit.cyl(.12,.1,.12,cx,.71,cz-.6,0x7b766c,{segments:8});
 for(const dx of [-.35,.35])kit.cyl(.05,.05,.25,cx+dx,.48,cz-.35,0xe8e0c4,{segments:6});
 solid({id:'utaki-stone',x:cx,z:cz-.6,w:1.5,d:1,height:.8});
 anchor(cx,1,cz-1.6,'Pray at the utaki',()=>onAction?.('shrine','Nishi-machi utaki',
  'The grove at the top of the quarter. There is no shrine building and no gate, only the old banyan, the fukugi round it and a stone where the women of the street leave rice, salt and incense. People lower their voices before they reach the wall.'));
 inspect(cx+2.4,1,p.minZ-.9,'Read the utaki notice',"Utaki · Utaki",
  "A hand-lettered board: Please refrain from entering the Utaki.. This is a sacred place; please do not go in without reason. Underneath, in a child’s writing, somebody has added: the cat is allowed.");
}

function buildWestQuay(kit,solid,{inspect,anchor,onAction,vending}){
 const Q=NISHI.quay;
 // Two sabani hauled out side by side in the yard, square to it, up on blocks: the blue
 // one against the staging container, the red one that was Mr Ōshiro's (Chin mends it now) in front of it, with a lane
 // between them. Their sterns stop 2.1 m short of the seawall, so the way along it to
 // Mr Fujita's pier stays open, and their bows 1.5 m short of the Dock Electrical wall,
 // the lane to the hoist and the quay edge. (The red one used to lie inside the Dock
 // Electrical building and the blue one's bow ran into its wall: both were here before
 // the workshop was built. So were a net pile and a stack of fish boxes, inside it.)
 solid(sabani(kit,-34,-44.5,{ry:Math.PI/2}));

 solid(fishCrates(kit,-36.6,-41.6,{rows:2,cols:3,seed:3}));
 inspect(-31.8,1,-45,'Inspect the sabani','Sabani',
  'A narrow island fishing boat, cedar planked and painted, up on blocks for its bottom to be scraped. The sail is rolled along the thwarts. Old men still race these in the summer.');
 anchor(-29,1,Q.minZ+.9,'Fish from the west quay',()=>onAction?.('fishing'));
}

function buildPromenade(kit,solid,{anchor,onAction}){
 const x=-38.35;
 // Benches and lamps along the seawall walk.
 // Facing the sea over the low parapet, with room for your legs in front and the back on
 // the landward side; each one is a seat.
 for(const z of [-20,4,22]){
  kit.box(.45,.08,1.6,x,.46,z,0x9a7a55);kit.box(.06,.4,1.6,x+.22,.72,z,0x9a7a55);
  for(const dz of [-.65,.65])kit.box(.43,.44,.08,x,.22,z+dz,0x5d6468);
  solid({id:'promenade-bench',x,z,w:.6,d:1.7,height:.8});
  const seat=anchor(x+.6,1,z,'Sit on the seawall bench',()=>onAction?.('seat','Seawall bench','You sit with your back to the town. Over the parapet the reef goes green, then blue; the tetrapods at the foot of the wall break each wave into spray and a long hiss.'));
  if(seat)seat.userData.seat=benchSeat({id:'seawall-bench-'+z,position:[x,0,z],stand:[x+.85,0,z],surfaceY:.5,eyeY:1.12,yaw:Math.PI/2,pitch:-.03},{length:1.6,front:.225});
 }
 // The narrow seawall strip is seating and circulation, not a second planting
 // system. The park and walled gardens supply the town's shared broadleaf trees.
 for(const z of [-44.5,-26,-2,18]){
  kit.cyl(.05,.07,3.6,-39.05,1.8,z,0x5d6468,{segments:6});
  kit.rod([-39.05,3.6,z],[-38.5,3.7,z],.035,0x5d6468);
  kit.box(.3,.12,.24,-38.4,3.62,z,0xfff0c8,{finish:'lamp'});
  solid({id:'promenade-lamp',x:-39.05,z,w:.2,d:.2,height:3.6});
 }
 anchor(-38.6,1,-10,'Fish from the seawall',()=>onAction?.('fishing'));
 anchor(-38.6,1,10,'Fish from the seawall',()=>onAction?.('fishing'));
}

/* ------------------------------- Shop-houses ------------------------------ */

const SHOPS=Object.freeze({
 nakamura:{interior:'zenzai',jp:"Nakamura Zenzai",en:'Nakamura · zenzai & Blue Coral',bg:'#f6efd9',accent:'#2f7fa8',mark:"Ice",upright:"Zenzai",uprightBg:'#2f7fa8',
  buy:{label:'Buy a zenzai',title:"Nakamura Zenzai · Nakamura Zenzai",cost:250,item:'Zenzai',text:'Okinawan zenzai: a mountain of shaved ice over sweet kintoki beans and little white mochi, in a glass bowl that sweats on the counter.'},
  // The island's one sweet counter: when Aragaki Confectionery shut, Mrs Nakamura took on the sata andagi.
  more:[{label:'Buy sata andagi',title:"Nakamura Zenzai · sata andagi",cost:120,item:'Sata andagi',text:'Okinawan doughnuts, fried in the back in the morning until they crack open and smile, to the recipe from the old sweet shop over the road. Three to a paper bag, still warm, sugar on your fingers.',dz:1.3}]},
 // Kissa Higa in the old Higa Liquor (commerce/kissa-higa.js, 30 October 2026): Grandmother Higa's morning coffee shop,
 // weekdays 07:00–09:30, under its own green canvas awning (higa-liquor-dressing.js). The liquor shop stays shut and the
 // drink is Sakura's (22 October 2026); the fascia is repainted with the kissaten's name.
 'higa-saketen':{interior:'kissaten',awning:false,jp:"Kissa Higa",en:'Kissa Higa · morning coffee',bg:'#f2ead6',accent:'#2f5d46',upright:"Coffee",uprightBg:'#2f5d46',
  inspect:{label:'Look at Kissa Higa',title:'Kissa Higa',text:KISSA_NOTICE.en}},
 // Aragaki Confectionery, closed (cast.js PLACES): nobody keeps it, and nobody lives behind it. The faded
 // sign stays up.
 arakaki:{interior:'sweets',awning:false,jp:"Aragaki Confectionery Store",en:'Arakaki sweets · closed',bg:'#efe6cf',accent:'#5f7d76',upright:"Sweets",uprightBg:'#8a9a94',
  inspect:{label:'Look at the old sweet shop',title:"Aragaki Confectionery · the old sweet shop",text:'The shutter is down, and nobody lives behind it now; the faded sign remains. Both old dessert counters await a new keeper.'}},
 // Yonamine Fresh Fish, closed (cast.js PLACES): nobody keeps it; the morning catch is sold at the auction.
 yonamine:{interior:'fish',anchorDz:2.3,jp:"Yonamine Fresh Fish Store",en:'Yonamine fish',bg:'#eef4f2',accent:'#9a4a2a',mark:"Fish",upright:"Fresh fish",uprightBg:'#9a4a2a',
  inspect:{label:'Look at the old fish shop',title:"Yonamine Fresh Fish · closed",text:'The shop is shut, and nobody keeps it now. The morning catch goes to the fish auction on the east quay instead: irabuchā, the blue parrotfish; gurukun, red on the ice though they are blue in the sea; and a taman from the night anglers.'}},
 'coin-laundry':{interior:'laundry',jp:"Coin laundry",en:'Coin laundry · open 24 hours',bg:'#e9f0f6',accent:'#3a6a9a',upright:"Laundry",uprightBg:'#3a6a9a',
  inspect:{label:'Look into the coin laundry',title:'Coin laundry',text:'Four washers, two dryers and a bench under the noticeboard, with a shelf of old manga and a sign about not leaving washing overnight that everybody ignores. It smells of warm cotton.'}},
});

function shopFront(kit,solid,plot,frame,{anchor,inspect,onAction,getMinutes=()=>720,getHiga=()=>null,getPeople=()=>[],kissaPrompts=[]}){
 const spec=SHOPS[plot.id],w=plot.maxZ-plot.minZ-.1,d=frame.depth;
 const sign=fascia({jp:spec.jp,en:spec.en,bg:spec.bg,accent:spec.accent,mark:spec.mark||''});
 const upright=vertical({jp:spec.upright,bg:spec.uprightBg});
 kit.at(frame.x,(plot.minZ+plot.maxZ)/2,frame.ry,()=>solid(shopHouse(kit,{w,d,colour:plot.colour,trim:plot.trim,sign,upright,interior:spec.interior,occupied:plot.id!=='nakamura'||BLUE_CORAL.staffed,awning:spec.awning!==false,seed:plot.minZ*7|0})));
 const front=frame.front,out=frame.out,z=(plot.minZ+plot.maxZ)/2;
 const buy=item=>()=>plot.id==='nakamura'&&!dessertShopOpen(getMinutes())?onAction?.('read','Nakamura is closed',BLUE_CORAL.closedNotice):onAction?.('buy',item.title,{cost:item.cost,item:item.item,text:item.text});
 if(plot.id==='nakamura')return; // One shared dessert menu owns all orders.
 const act=plot.id==='higa-saketen'?()=>kissaFront(getMinutes(),onAction,{front:getHiga(),people:getPeople()}):spec.buy?.action?()=>onAction?.(spec.buy.action):spec.buy?buy(spec.buy):plot.id==='coin-laundry'?()=>onAction?.('inspect',spec.inspect.title,laundryLook(getMinutes())):()=>onAction?.('inspect',spec.inspect.title,spec.inspect.text);
 // Off to one side where somebody works the counter, so talking to them wins over the shop.
 anchor(front+out*.9,1.1,z+(spec.anchorDz||0),(spec.buy||spec.inspect).label,act);
 for(const m of spec.more||[])anchor(front+out*.9,1.1,z+m.dz,m.label,buy(m));
 if(plot.id==='higa-saketen')higaPrompts({anchor,onAction,getMinutes,getHiga,kissaPrompts});
 if(plot.id==='coin-laundry')laundryPrompts({anchor,onAction,getMinutes});
}

/** A prompt only the player uses: residents never pick it as something to do in their free time (town-activities.js). */
const private_=a=>{if(a)a.userData.npcInteraction=false;return a;};
/** What the front of Kissa Higa says at this minute: who is in through the open doors, or the paper on the shutter. */
function kissaFront(minutes,onAction,{front=null,people=[]}={}){
 const down=front?(front.shutter.visible?front.shutter.scale.y:0):kissaShutterDown(minutes);
 if(!kissaOpen(minutes)){
  if(down===1)return onAction?.('read','Kissa Higa · the paper on the shutter',KISSA_NOTICE.en);
  return onAction?.('read','Kissa Higa · '+(minutes%1440<KISSA.open?'opening up':'closing up'),
   (minutes%1440<KISSA.open?'Grandmother Higa is opening up. ':'Morning service has finished; Grandmother Higa waits until everyone is out before closing. ')+KISSA_NOTICE.en);
 }
 const present=people.filter(g=>g.visible&&!g.userData.indoors&&!g.userData.inHome&&inKissaHiga(g.position)).map(g=>g.userData.name||g.name);
 const keeper=present.includes(KISSA.keeper),regulars=present.filter(n=>n!==KISSA.keeper);
 onAction?.('inspect','Kissa Higa',`Through the open doors: the coffee counter, two siphons on their spirit lamps and the smell of toast. ${keeper?'Grandmother Higa is behind the counter. ':''}${regulars.length?regulars.join(' and ')+(regulars.length>1?' are':' is')+' in.':'The customer seats are free.'} Morning set, blend or iced coffee, ¥300 each, until half past nine.`);
}
/**
 * The bench out front (commerce/higa-liquor.js YUNTAKU), a seat at any hour; and inside Kissa Higa, in its hours
 * (commerce/kissa-higa.js): ordering at the counter's open end, the table's near chair, the records and the family kusu.
 */
function higaPrompts({anchor,onAction,getMinutes,getHiga,kissaPrompts}){
 const P=YUNTAKU.seats.player,seat=private_(anchor(P.at[0]-.55,1,P.at[1],'Sit on the bench outside Higa Liquor',()=>{
  const m=getMinutes(),here=YUNTAKU.sitters.filter(s=>yuntakuSeatAt(s.name,m)).map(s=>s.name);
  onAction?.('seat','Higa Liquor’s bench',here.length?`You sit down at the end of the bench. ${here.join(' and ')} ${here.length>1?'are':'is'} already here with a bottle each from Sakura, talking about nothing in particular, which is the point.`:'A timber bench and two upturned beer crates in front of Kissa Higa, its shutter down by evening. Of an evening the men still sit here with a bottle, bought at Sakura now.');}));
 // The player's end of the bench; Tetsuo's is the other (YUNTAKU.seats.tetsuo): the bench is two places already. Facing the
 // street as Tetsuo does (P.yaw), with the shop at the back: it faced the shop's wall, and a body slid forward to the seat's
 // front edge (seatFront) would have gone into the backrest.
 if(seat)seat.userData.seat={id:'higa-yuntaku-bench',position:[P.at[0],0,P.at[1]],stand:[P.stand[0],0,P.stand[1]],surfaceY:P.height,eyeY:1.1,yaw:P.yaw,pitch:-.03,front:P.at[0]-(YUNTAKU.bench.x-YUNTAKU.bench.depth/2)};
 // Inside Kissa Higa (the shop-house frame, higa-liquor-dressing.js higaPoint). Outside its hours the room is behind the
 // shutter and the doors; ordering says when it opens.
 const passable=()=>{const h=getHiga();return h?h.shutterSolid.minY>100:kissaPassable(getMinutes());};
 const inside=(x,z,y,label,fn)=>{const [wx,wz]=higaPoint(x,z),a=private_(anchor(wx,y,wz,label,()=>passable()?fn():closed()));
  if(a){a.visible=passable();kissaPrompts.push(a);}return a;};
 const closed=()=>onAction?.('read','Kissa Higa is closed','Grandmother Higa serves from 7:00 to 9:30, Monday to Friday. '+KISSA_NOTICE.en);
 KISSA_MENU.forEach((item,i)=>inside(-.1+i*.3,.3,1.1,item.label,()=>kissaOpen(getMinutes())?onAction?.('buy','Kissa Higa · '+item.name,{cost:item.cost,item:item.item,text:item.text}):closed()));
 // The table's near chair is the player's (Ms Uezu takes the far one on her weeks off: KISSA_SEATS chair-1).
 const C=KISSA_SEATS['chair-0'],chair=inside(.8,1.5,1,'Sit at the table in Kissa Higa',()=>onAction?.('seat','Kissa Higa · the table','A bentwood chair at the round table by the wall, under the photograph of the island bus. The cane seat creaks the way they all do.'));
 if(chair)chair.userData.seat={id:'kissa-chair-0',position:[C.at[0],0,C.at[1]],stand:[C.stand[0],0,C.stand[1]],surfaceY:C.height+.08,eyeY:1.1,yaw:C.yaw,pitch:-.03,front:C.front};
 inside(-1.4,1.6,1.1,'Look at the records',()=>onAction?.('read','Kissa Higa · the records',KISSA_RECORDS.text));
 inside(-1.3,.95,1.2,'Ask about the jar behind the counter',()=>onAction?.('read','The Higa family kusu',HIGA_KUSU.neverSold+' '+HIGA_KUSU.why));
}
/** What the laundry looks like through the glass at this minute: which machines are turning, and whose. */
function laundryLook(minutes){
 const now=laundryMachinesAt(minutes).filter(m=>m.running),names=m=>m.kind==='washer'?'washer '+m.id.slice(1):'dryer '+m.id.slice(1);
 return now.length?`Through the glass: ${now.map(names).join(' and ')} going round. Four washers, two gas dryers, a bench under the noticeboard and a shelf of old manga. It smells of warm cotton.`
  :'Four washers and two gas dryers, all still. A bench under the noticeboard, a shelf of old manga, the change machine humming. It smells of warm cotton.';
}
/** The coin laundry's prompts inside: a wash of your own, the noticeboard, the manga, the bench. */
function laundryPrompts({anchor,onAction,getMinutes}){
 const at=(x,z,y,label,fn)=>{const [wx,wz]=laundryPoint(x,z);return private_(anchor(wx,y,wz,label,fn));};
 at(-1.2,.65,1.1,'Do a wash at the coin laundry',()=>onAction?.('coin-laundry'));
 at(-.3,-.75,1.6,'Read the coin laundry noticeboard',()=>onAction?.('read','Coin laundry noticeboard',laundryNotices(getMinutes()).map(n=>`${n.title}\n${n.text}`).join('\n\n')));
 at(1.07,-.75,1.0,'Read the manga by the bench',()=>{const m=LAUNDRY_MANGA[Math.floor(getMinutes()/1440)%LAUNDRY_MANGA.length];onAction?.('read',m.title,m.text);});
 const B=LAUNDRY_BENCH.seats[0],seat=at(-.8,-.4,1,'Sit on the coin laundry bench',()=>onAction?.('seat','Coin laundry bench','A blue vinyl bench under the noticeboard, facing the machines. Somebody has left a manga open on it, face down.'));
 // Its two places are the bench's own (LAUNDRY_BENCH.seats), facing the machines (B.yaw): it faced the noticeboard's wall.
 if(seat)seat.userData.seat=benchSeat({id:'coin-laundry-bench',position:[B.at[0],0,B.at[1]],stand:[B.stand[0],0,B.stand[1]],surfaceY:B.height+.08,eyeY:1.1,yaw:B.yaw,pitch:-.03},
  {length:LAUNDRY_BENCH.x1-LAUNDRY_BENCH.x0,front:LAUNDRY_BENCH.z1-(LAUNDRY_BENCH.seats[0].at[0]-laundryPoint(0,0)[0]),places:LAUNDRY_BENCH.seats.map(s=>({position:[s.at[0],0,s.at[1]],stand:[s.stand[0],0,s.stand[1]]}))});
}

function buildEastRow(kit,solid,{anchor,inspect,onAction,vending,getMinutes,getHiga,getPeople,kissaPrompts}){
 const depth=EAST_ROW.maxX-EAST_ROW.minX,x=(EAST_ROW.minX+EAST_ROW.maxX)/2;
 for(const plot of EAST_ROW.plots)shopFront(kit,solid,plot,{x,ry:-Math.PI/2,depth,front:EAST_ROW.minX,out:-1},{anchor,inspect,onAction,getMinutes,getHiga,getPeople,kissaPrompts});
 // The strip of ground between the pavement and each shop front is Main Street's concrete back strip, laid with the
 // street by the ground generator (ground-plan.js); Kitano Road crosses the row where the old lane was.
 // (Their aprons are Main Street's back strip now, laid with the street: ground-plan.js.)
 // A bench for eating at Nakamura's (its shaved-ice flag is put out and taken in with the hours: nakamura-dressing.js).
 // A usable park-side eating bench; the shop's threshold stays clear.
 const bx=7.3,bz=-17.6;
 kit.box(.44,.08,1.4,bx,.45,bz,0x3a6e8f);
 for(const dz of [-.55,.55])kit.box(.36,.42,.06,bx,.21,bz+dz,0x5d6468);
 solid({id:'zenzai-bench',x:bx,z:bz,w:.44,d:1.4,height:.5});
 const seat=anchor(bx-.65,1,bz,'Sit beside Nakamura with your dessert',()=>onAction?.('seat','Nakamura dessert bench','A place in the park breeze for zenzai, warm andagi or an ice-cream cone.'));
 if(seat)seat.userData.seat=benchSeat({id:'nakamura-dessert-bench',position:[bx,0,bz],stand:[bx-.8,0,bz],surfaceY:.49,eyeY:1.12,yaw:-Math.PI/2,pitch:-.03},{length:1.4,front:.22});
 // The old lane up to the sea bath between the shop-houses is Kitano Road now (kitano-link.js):
 // its stepping stones, lanterns, pot plants and the vending machine made way for the carriageway.
 // Higa Liquor's old delivery bicycle, against its own (shut) shopfront. It stood on the kerb in the crossing's planter until the
 // owner's phone found it there (20 October 2026).
 const liquor=EAST_ROW.plots.find(p=>p.id==='higa-saketen');
 // Moved again on 21 October 2026 for the yuntaku bench (higa-liquor-dressing.js): nose-in to the pier at the Kitano Road
 // corner, beside the empties, clear of the door.
 solid(bicycle(kit,EAST_ROW.minX-.95,liquor.minZ+.42,{ry:0,colour:0x2b2d30,basket:false,id:'higa-liquor-bicycle',owner:'Grandmother Higa',
  why:'The shop’s old black delivery bicycle with the big carrier, from the days her husband did the rounds. Nobody has ridden it since the shop shut, and Grandmother Higa will not sell it: it leans against its own shopfront, clear of the shutter and the footway, and the bench’s regulars lean their bags on it.'}));
}

function buildYardRow(kit,solid,{anchor,inspect,onAction,getMinutes}){
 const depth=YARD_ROW.maxX-YARD_ROW.minX,x=(YARD_ROW.minX+YARD_ROW.maxX)/2;
 for(const plot of YARD_ROW.plots)shopFront(kit,solid,plot,{x,ry:Math.PI/2,depth,front:YARD_ROW.maxX,out:1},{anchor,inspect,onAction,getMinutes});
 // The yard behind them: fish crates and a garden of greens in fish boxes.


 // Moved west, beside the second yard house (yard-homes-layout.js), clear of the lane.

 buildYardLife(kit,solid,{anchor,inspect,onAction});
 laundrySideWall(kit,solid,YARD_ROW.plots.find(p=>p.id==='coin-laundry'));
 gasBottles(kit,-15.4,17.8,{ry:Math.PI/2});
 hibiscus(kit,-23.6,18.6,{seed:23});banana(kit,-23.4,-16.6,{seed:24});
 for(const [i,z] of YARD_WINDBREAK.z.entries())solid(fukugi(kit,YARD_WINDBREAK.x,z,{h:5.4+(i%3)*.5,seed:500+i}));
}

/**
 * Fukugi along the yard's west edge, where the old yard wall stood: the shops' yard takes the west wind off the sea
 * through the Nishi lanes, and the row shades Thuan's break bench (staff-bench.js) and the goya bed in the afternoon.
 * Planted between the lane openings (WEST_YARD.lanes), clear of the tyres and of the building circuits (the stretch
 * beside the yard houses is left for the housing consolidation). Midway between the Higa house's circuit band (to x
 * -24.55) and Sakura's (from -23.55): at -24.1 the stoutest trunk (0.91 m) stood 5 mm in the Higa house's band.
 */
export const YARD_WINDBREAK=Object.freeze({x:-24.05,z:Object.freeze([-25.2,-23.1,-21,-18.9])});

/**
 * The coin laundry's long south wall, which faces Main Street's crossing and was blank: its own painted name and
 * hours for the street, the two gas dryers' vent hoods (with the lint they stain the wall with), the gas line from
 * the bottles at the back corner, and the downpipe.
 */
function laundrySideWall(kit,solid,plot){
 const z=plot.minZ+.05,x0=YARD_ROW.minX,x1=YARD_ROW.maxX,steel=0x9aa2a6;
 if(typeof document!=='undefined'&&document.createElement)kit.sign(fascia({jp:'Coin laundry wall',en:'Open 24 hours · wash · dry',bg:'#e9f0f6',accent:'#3a6a9a'}),3.4,.64,(x0+x1)/2+1,4.5,z-.03,{ry:Math.PI,depth:.03,edge:0x3a6a9a,name:'coin laundry wall sign'});
 for(const x of [x1-3.4,x1-4.3]){
  kit.box(.34,.3,.2,x,2.45,z-.1,steel,{finish:'metal'});kit.box(.3,.04,.22,x,2.28,z-.11,0x6d7477);
  kit.box(.28,.7,.01,x,1.95,z-.005,0xc3ced3);
 }
 // The gas comes from the pair of bottles already standing at the back corner (buildYardRow).
 kit.rod([x0+.6,1.5,z-.04],[x1-3.4,1.5,z-.04],.015,0x6d7477);kit.rod([x1-3.4,1.5,z-.04],[x1-3.4,2.3,z-.04],.015,0x6d7477);
 kit.rod([x0+.15,6.2,z-.08],[x0+.15,.2,z-.08],.045,0x8e9699);kit.box(.12,.1,.22,x0+.15,.13,z-.16,0x8e9699);
}

function buildEastBack(kit,solid,ctx){
 // The back lane behind the shops: a concrete strip with a gutter, down to the lawn.
 EAST_BACK.plots.forEach((p,i)=>walledHouse(kit,solid,p,{...ctx,seed:10+i,windbreak:'east'}));
}

/**
 * The fish market's drinks machine: its back 3 cm off the ice plant's plinth, on the plant's west wall north of the ice
 * door, facing the lane between the plant and the auction shed. The owner, 21 October 2026, on his phone: "a vending
 * machine misplaced in the fish market" (it stood on the auction floor among the crates).
 */
export const AUCTION_VENDING=Object.freeze({x:EAST_QUAY.ice.minX-.05-.03-VENDING_MACHINE.size.depth/2,z:EAST_QUAY.ice.maxZ-.8,ry:-Math.PI/2,y:GROUND_LAYER.lane,
 who:'the fishermen up from the boats, the ice plant’s men and the auction’s buyers',
 why:'Machines stand against a wall, on somebody’s supply: here the ice plant’s, on its west wall where the lane from the boats meets the walk to the gate. The boats are in by five and the bell goes at six, so a hot J-Coffee before it and a cold one after the floor is hosed. North of the ice door, so the forklift’s run to the boats stays clear; off the auction floor, which is for the catch.'});

function buildEastQuay(kit,solid,{group,anchor,inspect,onAction,vending,getMinutes,eastQuayBoat}){
 const Q=EAST_QUAY,S=Q.shed,I=Q.ice,lane=GROUND_LAYER.apron;
 // The apron, the gate's paving and the quay's coping are the harbour's ground (ground-plan-harbour.js), run on east
 // to the oil jetty; here the edge's collider, its bollards and the tyres hung on its face. East of x 41.4 the walkable
 // quay (layout.js eastQuayAt) stops at the coping on its own.
 solid({id:'east-quay-edge',x:(Q.minX+Q.maxX)/2,z:Q.minZ-.25,w:Q.maxX-Q.minX+.4,d:.3,height:.4});
 // The bollard; the tyres hung on the face and the line coiled beside it are the fish market's (fish-market.js QUAY_EDGE).
 {const {x,z}=QUAY_EDGE.bollard;
  kit.cyl(.16,.2,.42,x,.24,z,0x3a3f42,{segments:10});kit.cyl(.24,.24,.08,x,.47,z,0x3a3f42,{segments:10});
  solid({id:'bollard',x,z,w:.45,d:.45,height:.5});
 }
 // The auction shed: open sides, a painted floor, a steel roof on H-section columns.
 kit.block(S.minX,S.maxX,lane,lane+.1,S.minZ,S.maxZ,0x5f8a7a);
 const cols=[];
 for(let x=S.minX+.15;x<=S.maxX;x+=(S.maxX-S.minX-.3)/3)for(const z of [S.minZ+.15,S.maxZ-.15])cols.push([x,z]);
 for(const [x,z] of cols){kit.box(.22,S.height,.22,x,S.height/2,z,0x5e7078,{finish:'metal'});solid({id:'auction-column',x,z,w:.3,d:.3,height:S.height});}
 kit.gableRoof(S.maxX-S.minX,S.maxZ-S.minZ,.9,(S.minX+S.maxX)/2,S.height,(S.minZ+S.maxZ)/2,0x7a8f96,{overhang:.7});
 // Its corrugation ribs, ridge cap, gutters and downpipes are drawn with the fish market (fish-market.js roofWater).
 // The roof is solid to the lens, eaves to ridge with its purlins: the fish-auction opening's arrival shot began over it
 // and came down through it between two purlins (the creator, 2026-10-19, on his phone: "I spawned in a beam"). An
 // overhead collider (minY above a standing head), so nobody walking under the roof meets it (physics.js
 // standingHitsRect, build/placements.js); the lens does (game.js cameraBlocked, spawn-scene.js clearArrivalLens).
 solid({id:'auction-roof',x:(S.minX+S.maxX)/2,z:(S.minZ+S.maxZ)/2,w:S.maxX-S.minX+1.4,d:S.maxZ-S.minZ+1.4,minY:S.height-.1,height:1.1});
 kit.sign(fascia({jp:"Port Fisheries Association Auction market",en:'Minato fisheries co-op · fish auction',bg:'#eef3f1',accent:'#2f6f8a',mark:"Fish"}),6,.9,(S.minX+S.maxX)/2,S.height-.3,S.maxZ+.02,{name:'auction sign'});
 // The sign on the fascia, solid to the lens the same way (the lens came down past it a hand's width off).
 solid({id:'auction-sign',x:(S.minX+S.maxX)/2,z:S.maxZ+.02,w:6,d:.12,minY:S.height-.75,height:.9});
 // Inside: the morning's catch laid a lot to a box on ice, the scale, the hose and the drain, the boots, the bell, the
 // lamps, the buyers' packed boxes and the co-op's sale counter (fish-market.js). What is left in the boxes is the fish
 // nobody bid for: the tuna (laid out whole, never boxed) and the squid went first.
 const market=buildFishMarket(kit,solid,group);
 // The same supported, glazed cabinet as the harbour noticeboard; both posts meet the auction floor.
 const board=buildAuctionBoard();group.add(board.object);solid(board.collider);
 inspect((S.minX+S.maxX)/2,1.2,S.maxZ+1,'Inspect the auction shed',"Minato fish auction · Auction market",
  'The boats are in by five and the auction is at six: a bell, a man with a clipboard shouting numbers too fast for anyone but the buyers, and a floor hosed down by seven. What is left in the boxes went unsold, and will be somebody\'s supper: gurukun, Okinawa\'s own red fish; irabuchā, the blue parrotfish; mībai and shichūmachi. The maguro went first, and so did the sēika, a diamond squid the size of a cat. A slip under each box\'s lip says whose catch it is: the Daisan Minatomaru\'s from the reef and the deep-drop lines, Kōji\'s from his sabani.');
 // The co-op's sale counter (fish-market.js FISH_COUNTER): a kilo of what the buyers left, while Kōji keeps it.
 const C=FISH_COUNTER,counterShut=()=>onAction?.('read','The fish counter is closed','Kōji sells what the buyers left from 07:00, when the floor is washed, until he goes to the ice plant at nine; not on his weeks as the ferry\'s bosun.');
 C.sells.forEach((sale,i)=>{
  const fish=fishById(sale.fish),name=fish.name[0].toUpperCase()+fish.name.slice(1),title=`Fish counter · ${name}`;
  anchor(C.x+(i?.45:-.18),1.1,C.z+C.d/2+.9,`Buy a kilo of ${fish.name}`,()=>fishCounterOpen(getMinutes())?onAction?.('buy',title,{cost:sale.kilo,item:sale.item,text:sale.text}):counterShut());
 });
 // The ice plant: a tall concrete block with its chute swung out over the quay.
 kit.block(I.minX,I.maxX,0,I.height,I.minZ,I.maxZ,0xd8d4ca);
 kit.block(I.minX-.05,I.maxX+.05,0,.4,I.minZ-.05,I.maxZ+.05,0xb3ad9f);
 kit.block(I.minX-.02,I.minX,0,2.8,I.minZ+1.2,I.minZ+4.2,0x8e9699,'metal');
 for(let y=.3;y<2.8;y+=.18)kit.box(.03,.04,3,I.minX-.03,y,I.minZ+2.7,0x7b8285);
 kit.sign(vertical({jp:"Ice making",bg:'#2f6f8a'}),.9,3.4,I.minX-.05,4.6,I.maxZ-1.1,{ry:-Math.PI/2,depth:.06,name:'ice sign'});
 kit.rod([(I.minX+I.maxX)/2,I.height-1,I.minZ],[(I.minX+I.maxX)/2,3.2,Q.minZ+.8],.28,0x9aa3a6,{segments:8,finish:'metal'});
 kit.box(.8,.6,.8,(I.minX+I.maxX)/2,I.height-.8,I.minZ-.3,0x9aa3a6,{finish:'metal'});
 for(const x of [I.minX+1.4,I.maxX-1.4]){kit.box(1.4,.9,1.2,x,I.height+.45,(I.minZ+I.maxZ)/2,0xe6e6e0);kit.cyl(.45,.45,.06,x,I.height+.93,(I.minZ+I.maxZ)/2,0x3a3f42,{segments:12});}
 for(const x of [I.maxX-.4])kit.rod([x,.4,I.maxZ+.1],[x,I.height,I.maxZ+.1],.05,0x8e979a);
 solid(kit.rect(I.minX,I.maxX,I.minZ,I.maxZ,I.height,'ice-plant'));
 inspect(I.minX-1,1.2,I.minZ+2.7,'Inspect the ice plant',"Minato ice plant · Ice factory",
  'Block ice, crushed ice, flake ice. The chute swings out over the boats and fills a hold in four minutes with a roar you can hear out on the ferry. Inside it is winter all year; the men who work it wear jumpers in August and sit out on the quay at lunch to thaw.');
 // Boats lying to the quay, a forklift, crates, the fuel pump.
 // Two inshore boats lie here, drawn like the main quay's (harbour-boats.js), each on fat fenders against the face (its
 // tyres hang east of them, fish-market.js QUAY_EDGE) and tied to ringbolts in the kerb fore and aft.
 eastQuayBoat(24.6,Q.minZ-2.1,0,{length:8,beam:2.3,look:EAST_QUAY_BOAT_LOOKS[0]});
 eastQuayBoat(33.6,Q.minZ-2.2,Math.PI,{length:7.2,beam:2.3,look:EAST_QUAY_BOAT_LOOKS[1]});
 // The forklift runs ice from the plant's door to the boats. Between runs it waits on the
 // quay side of the plant, along its wall under the chute, forks to the west: parked in the
 // lane between the shed and the plant it stood in front of the ice door (and 0.3 m into
 // the plant's wall), and Kōji loads ice there.
 // The boxes Kōji sorts the catch into, behind the sale counter beside where he stands to sort (fish-market.js
 // SORTING_STACK), standing on the floor. In front of the shed they stood through one column and left 1 m of the walk
 // between the shed and the parapet, from the lawn gate to the ice plant.
 solid(fishCrates(kit,SORTING_STACK.x,SORTING_STACK.z,{rows:SORTING_STACK.rows,cols:SORTING_STACK.cols,y:SORTING_STACK.y,seed:31}));
 vending(AUCTION_VENDING.x,AUCTION_VENDING.z,AUCTION_VENDING.ry,AUCTION_VENDING.y);   // on the quay's paving (the lane layer), not sunk in it
 inspect(24.6,1,Q.minZ+.9,'Look at the boats',"Daisan Minatomaru · Minato Maru No. 3",
  'The Daisan Minatomaru, the third fishing boat of the name (the town ferry is the Minato Maru), is back from the reef with her hold iced and her deck hosed. Her skipper is asleep in the wheelhouse with the radio on. The red boat further along goes out for squid at night and has its lamps strung along a boom.');
 anchor(29.5,1,Q.minZ+.9,'Fish from the east quay',()=>onAction?.('fishing'));
 return market;
}

/** The four bicycles in the west yard's shed, of the people who live and work round the yard. */
const WEST_YARD_BICYCLES=Object.freeze([
 Object.freeze({id:'west-yard-bicycle-tetsuo',colour:0x3d6f8f,basket:false,owner:'Tetsuo',why:'Tetsuo’s, from 2 Front-Row Yard across the yard: he rides it to the power house’s switchboard and round the lane lights, his toolbag on the carrier.'}),
 Object.freeze({id:'west-yard-bicycle-laundry',colour:0xb03a3a,frame:'step',owner:'the coin laundry’s customers',why:'Whoever has a wash going round leaves a bicycle here; this one has been here since Tuesday, and nobody minds.'}),
 Object.freeze({id:'west-yard-bicycle-bookshop',colour:0xd9d2c0,owner:'Nhung (the town paper)',why:'The old bookshop’s errand bicycle, kept for the paper: the week’s copies go round to the harbour office, the kōban and the hall in its basket.'}),
 Object.freeze({id:'west-yard-bicycle-workshop',colour:0x3a7a5a,owner:'Chin & Tetsuo’s workshop',why:'The workshop’s spare, lent to whoever is fetching a part from the depot.'}),
]);

/** The back of the west yard: the goya trellis, the bicycle shed, drums and tyres. */
function buildYardLife(kit,solid,{inspect}){
 const G=GOYA,y=GROUND_LAYER.lane;
 // Raised beds of red earth with a path between them, under a trellis the bitter melon
 // has already covered: a roof of leaves, and the gourds hanging through it.
 for(const z of [G.minZ+.55,(G.minZ+G.maxZ)/2,G.maxZ-.55]){
  kit.block(G.minX+.4,G.maxX-.4,y-.02,.24,z-.55,z+.55,0x8a4a32);
  for(let x=G.minX+.8;x<G.maxX-.6;x+=.55)kit.sphere(.18,x,.34,z+(x*7%2?.2:-.2),0x4f7d3e,{sy:.7,detail:0});
  solid({id:'goya-bed',x:(G.minX+G.maxX)/2,z,w:G.maxX-G.minX-.8,d:1.1,height:.3});
 }
 const posts=[];for(const x of [G.minX+.2,(G.minX+G.maxX)/2,G.maxX-.2])for(const z of [G.minZ+.2,G.maxZ-.2])posts.push([x,z]);
 for(const [x,z] of posts){kit.cyl(.05,.06,2.1,x,1.05,z,0x6e5a44,{segments:6});solid({id:'trellis-post',x,z,w:.14,d:.14,height:2.1});}
 kit.box(G.maxX-G.minX,.02,G.maxZ-G.minZ,(G.minX+G.maxX)/2,2.08,(G.minZ+G.maxZ)/2,0x3f6b3a,{finish:'thin'});
 const r=rng(55);
 for(let i=0;i<34;i++)kit.sphere(.35+r.next()*.25,G.minX+.3+r.next()*(G.maxX-G.minX-.6),2.18,G.minZ+.3+r.next()*(G.maxZ-G.minZ-.6),r.pick([0x4f8a3e,0x3f7a36,0x5c9446]),{sy:.35,detail:0});
 for(let i=0;i<16;i++){const x=G.minX+.5+r.next()*(G.maxX-G.minX-1),z=G.minZ+.5+r.next()*(G.maxZ-G.minZ-1);kit.sphere(.08,x,1.78,z,0x6fa84a,{sy:2.6,detail:1});}
 inspect((G.minX+G.maxX)/2,1,G.maxZ+.8,'Look at the goya trellis','Goya trellis',
  "Bitter melon, Goya, grown up a net until it roofs the whole bed: in summer it is the coolest place in the yard. The warty green gourds hanging through are for chanpurū, fried with tofu, egg and a little spam. Whoever planted it has written Don't take it on a card — please don’t pick.");
 // The bicycle shed at the top of the yard, and what gathers round a working yard.
 const bx0=-24,bx1=-19.4,bz0=15.8,bz1=19.6;
 kit.block(bx0,bx1,2.15,2.25,bz0,bz1,0x8c9ea3);
 for(const [x,z] of [[bx0+.1,bz0+.1],[bx1-.1,bz0+.1],[bx0+.1,bz1-.1],[bx1-.1,bz1-.1]]){kit.box(.08,2.15,.08,x,1.08,z,0x9aa0a4);solid({id:'shed-post',x,z,w:.14,d:.14,height:2.2});}
 // On the shed's concrete slab (ground-plan-quarters.js), 4 cm up.
 kit.at(0,0,0,()=>WEST_YARD_BICYCLES.forEach((b,i)=>solid(bicycle(kit,bx0+.8+i*1.05,(bz0+bz1)/2,{ry:Math.PI/2,...b}))),GROUND_LAYER.lane);
 for(const [x,z] of [[-17,-16.2],[-16.4,-15.8]]){kit.cyl(.29,.29,.88,x,.44,z,0x2f5a8a,{segments:12});kit.cyl(.3,.3,.04,x,.89,z,0x24486e,{segments:12});}
 solid({id:'oil-drums',x:-16.7,z:-16,w:1.3,d:1,height:.9});
 for(let k=0;k<4;k++)kit.cyl(.33,.33,.2,-23.6,.12+k*.21,-15.6,0x1f2124,{segments:12});
 solid({id:'tyres',x:-23.6,z:-15.6,w:.72,d:.72,height:.9});
}

/** Gateball on the lawn by the seawall: a sand court, three hoops, the goal post, a shelter. */
function buildGateball(kit,solid,{anchor,inspect}){
 // The court is level on a terrace at the hill's own ground (COURT_TERRACE), graded into
 // the hill with banks and held up on the seaward side by a stone wall.
 const G=GATEBALL,T=COURT_TERRACE,H=T.height,top=H+GROUND_LAYER.apron,cx=(G.minX+G.maxX)/2,cz=(G.minZ+G.maxZ)/2;
 kit.block(G.minX,G.maxX,top-.05,top,G.minZ,G.maxZ,GROUND.sand,'sand');
 // The wall fills the strip between the terrace and the seawall's south return, so no
 // slope of lawn is left running up under it.
 {const z0=EAST_LAWN_SOUTH,z1=T.minZ,x0=T.minX,x1=T.maxX;
  kit.block(x0,x1,0,H+.02,z0,z1,0x8f8a7c);
  kit.block(x0-.03,x1,H+.02,H+.08,z1-.3,z1+.04,0x6f6b60);
  solid({id:'gateball-wall',x:(x0+x1)/2,z:(z0+z1)/2,w:x1-x0,d:z1-z0,height:H+.1});
  // Its west end, where the bank comes down beside it.
  kit.block(x0-.3,x0,0,H+.02,z0,z1,0x8f8a7c);}
 const line=(x0,x1,z0,z1)=>kit.block(x0,x1,top,top+.006,z0,z1,0xf4f1ea);
 line(G.minX+.3,G.maxX-.3,G.minZ+.3,G.minZ+.36);line(G.minX+.3,G.maxX-.3,G.maxZ-.36,G.maxZ-.3);
 line(G.minX+.3,G.minX+.36,G.minZ+.3,G.maxZ-.3);line(G.maxX-.36,G.maxX-.3,G.minZ+.3,G.maxZ-.3);
 for(const [x,z] of [[G.minX+2.4,G.minZ+1.4],[G.maxX-2.8,cz],[G.minX+3.2,G.maxZ-1.3]]){
  for(const dx of [-.11,.11])kit.box(.02,.2,.02,x+dx,top+.1,z,0xf4f1ea);
  kit.box(.24,.02,.02,x,top+.2,z,0xf4f1ea);
 }
 kit.cyl(.02,.02,.45,cx,top+.22,cz,0xf4f1ea,{segments:5});
 // Five coloured balls where the last game stopped.
 for(const [i,[x,z]] of [[22.5,-35],[24.1,-33.9],[26,-36.2],[27.3,-34.4],[29.4,-33.2]].entries())kit.sphere(.04,x,top+.04,z,i%2?0xd8342c:0xf4f1ea,{detail:1});
 // The shelter on the seaward end, where the elders sit between turns.
 const sx0=G.maxX-.1,sx1=G.maxX+1.5;
 kit.block(sx0,sx1,H+2.3,H+2.4,G.minZ+.6,G.maxZ-.6,0x8a3b2e);
 for(const z of [G.minZ+.8,G.maxZ-.8])for(const x of [sx0+.1,sx1-.1]){kit.box(.1,2.3,.1,x,H+1.15,z,0x6e5a44);solid({id:'shelter-post',x,z,w:.14,d:.14,height:H+2.3});}
 kit.box(.45,.08,G.maxZ-G.minZ-2,sx1-.4,H+.46,cz,0x9a7a55);for(const dz of [-1.5,1.5])kit.box(.4,.44,.08,sx1-.4,H+.22,cz+dz,0x5d6468);
 solid({id:'gateball-bench',x:sx1-.4,z:cz,w:.5,d:G.maxZ-G.minZ-2,height:H+.5});
 for(let i=0;i<3;i++)kit.rod([sx1-.25,H+.02,cz-1+i*.5],[sx1-.15,H+.95,cz-1.1+i*.5],.02,[0xd8342c,0x2f6fb8,0xe0b93a][i]);
 inspect(cx,H+1,G.maxZ+.7,'Watch the gateball',"Gateball · Gateball",
  'Five a side, mallets and numbered balls, three hoops and a post, and a referee with a whistle and a stopwatch who is somehow also the loudest player. The Minato seniors play here at seven every morning before it gets hot. They have been losing to the team from the next village since 1985.');
}

/* ---------------------------------- Wires --------------------------------- */

function buildWires(kit,solid){
 const poles=[];
 const pole=(x,z,o={})=>{const p=utilityPole(kit,x,z,o);solid(p.collider);poles.push(p);return p;};
 // Down the east kerb of Main Street, the row's side.
 const east=[-15,-1.5,12.3,19.6].map((z,i)=>pole(.35,z,{face:-Math.PI/2,transformer:i%2===0,lamp:true,seed:i}));
 for(let i=0;i<east.length-1;i++)wiresBetween(kit,east[i],east[i+1]);
 // A drop to each shop-house that stands: Nakamura's and Higa Liquor (the post office's went with it, phase 4).
 for(const [p,z] of [[east[0],-11],[east[2],9]])serviceDrop(kit,p,[EAST_ROW.minX+.3,6,z]);
 // Along the seawall walk: three poles, one span to each block. The lanes off it have no
 // poles of their own; a small island lane is fed from the walk, not lined with concrete.
 const walk=[-38,-9.5,20].map((z,i)=>pole(-39,z,{face:Math.PI/2,tel:false,transformer:i===1,lamp:i!==1,seed:10+i*2}));
 for(let i=0;i<walk.length-1;i++)wiresBetween(kit,walk[i],walk[i+1]);
}

/* -------------------------------- Kitahama -------------------------------- */

/**
 * The new district on the north-east land: the approach lane up from the beach, the
 * cross lane, the standard walled homes that stand (walledHouse, the same as Nishi-machi), a
 * sugar-cane field and the pole line that brings power up from the station on Main
 * Street.
 */
function buildKitahama(kit,solid,ctx){
 const K=KITAHAMA,lane=GROUND_LAYER.lane;
 // The shared lane union is drawn by lane-surfaces.js, together with the public plot circuits.
 K.plots.forEach((p,i)=>walledHouse(kit,solid,p,{...ctx,seed:30+i,windbreak:p.gate==='north'?'south':p.gate==='south'?'north':p.gate==='west'?'east':'west'}));
 // The pole line: up the approach lane from the beach, then along the cross lane, with
 // a drop to every house. Poles stand on the lane's own verge, a quarter-metre in from its
 // edge: set outside the edge, they stood inside the garden walls.
 const poles=[];
 const pole=(x,z,o={})=>{const p=utilityPole(kit,x,z,o);solid(p.collider);poles.push(p);return p;};
 const up=[30,51].map((z,i)=>pole(i===0?40:K.approach.maxX-.1,z,{face:Math.PI/2,transformer:i===1,lamp:true,seed:200+i*3}));
 wiresBetween(kit,up[0],up[1]);
 const across=[pole(44.7,K.lane.maxZ-.25,{face:Math.PI,transformer:false,lamp:true,seed:211})];
 wiresBetween(kit,up[1],across[0],{sag:.5});
 for(const p of K.plots.filter(q=>Number(q.id.split('-')[1])<6)){const {door}=plotGate(p,0);const near=across.reduce((a,b)=>Math.abs(b.anchors[0].x-door[0])<Math.abs(a.anchors[0].x-door[0])?b:a);
  serviceDrop(kit,near,kit.point(door[0]+1.5,2.6,p.gate==='north'?p.minZ+3.2:p.maxZ-3.2).toArray());}
 // The residential quarter to the west: flats, park, rubbish point, poles (kitahama-quarter.js).
 buildKitahamaQuarter(kit,solid,ctx,{across});
}

/** What the nameplates say when you stop to read one. */
const NAMEPLATES=Object.freeze({
 higa:'The Higas. Grandmother Higa sits on the verandah every evening shelling beans into a bowl and knows the time of every ferry by the sound of its horn off the breakwater. The shisa on the left gatepost has its mouth open to let luck in; the one on the right has it shut, to keep it.',
 nakasone:'An empty red-tile house facing the lawn in front of Umi-no-yu. The shutters are down and the shisa still sit on the gateposts.',
 miyagi:'An empty red-tile house, the oldest on this side. A typhoon took the roof off everything else here, but not this one. The shisa on the ridge is older than the house.',
 kamiya:'An empty red-tile house, swept, with the water off at the main.',
 'kitahama-1':'Thao, Chin and Vy\'s house: a red-tile roof, a hinpun, and a row of herb pots that Thuan named after customers when she stayed here. The gate latch is oiled so the late shift does not wake anybody.',
 'kitahama-2':'Mrs Sato\'s house, concrete and very tidy, with a stock pot always on the back step to cool. She walks down to the morning auction at half past five and has the ramen stock on by seven.',
 'kitahama-3':'Nhung, Kōji and Riku\'s house. A wetsuit on the line, fish boxes stacked by the gate, a football in the yard, a crate of reading copies from the old bookshop and the doctor’s bag in the genkan, and a radio that plays the weather on the hour.',
 'fumoto-1':'The oldest house in Fumoto, red tile behind a hinpun, and empty. The shutters are down and the yard has gone to grass.',
 'fumoto-2':'An empty red-tile house. Hand-carved shisa still sit on the gate, from the year the co-op store opened.',
 'fumoto-3':'An empty concrete house, rebuilt after Typhoon Della in 1977. The back kitchen once made the hamlet’s tofu; it is dark now, with the water off at the main.',
 'fumoto-4':'An empty red-tile house with a hinpun, and a goat pen behind it.',
 'kitahama-7':'An empty concrete house, swept and waiting, with the water off at the main.',
 'kitahama-8':'Ms Uezu\'s house: a week of washing on the line when she is home, and the shutters down the week she is on the ferry. A neighbour waters the bougainvillea.',
 'kitahama-9':'An old red-tile house with a deep verandah, empty, its shutters down.',
 'kitahama-10':'An empty red-tile house: goya gone to seed over the wall, and the papaya by the gate left unpicked.',
 'kitahama-11':'An empty concrete house on Fukugi Lane. Its plate says to let; enquiries are at the town hall.',
 'kitahama-12':'An empty concrete house at the end of Fukugi Lane, its shutters down and its gate tied shut with wire.',
 tamaki:'An empty concrete house near the east quay, its shutters down and the water off at the main.',
});
