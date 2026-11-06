import * as THREE from '../../vendor/three.module.js';
import {createKit} from './okinawa/kit.js';
import {nameplate} from './okinawa/signs.js';
import {redTileHouse,concreteHouse,coralWall,blockWall,shisa,hinpun,fukugi,hibiscus,potPlant,banana,gajumaru} from './okinawa/houses.js';
import {bicycle,laundry,planterBoxes} from './okinawa/props.js';
import {AIRPORT_ISLAND} from './airport-island.js';
import {airportWorld,airportSurface} from './airport-ground.js';
import {SEA_LEVEL,setOceanPits} from './ocean.js';
import {KITANO_HAMLET,KITANO_DUG,hamletGate,houseIsland,houseRect} from './kitano-hamlet-layout.js';
import {buildHouseExterior,houseLocal} from './johansson-house-build.js';
import {HOUSE_OPENINGS,HOUSE_SITE,HOUSE_ROOF} from './johansson-house.js';
import {householdAtHome,residentsLine,householdTitle,homeNameplate} from '../people/island-households.js';
import {kitanoLater} from './kitano-on-demand.js';

/**
 * Kitano hamlet, built on the island's group in its own frame (batch 7a; docs/KITANO-JIMA.md): the lane's crushed coral,
 * each plot's slab and walls, its gate with the shisa and the nameplate, and the house at the back: Johansson's red-tile
 * house (his rooms inside are the mayor's home, interiors/town-hall.js, so his futon, post and television come with him)
 * and the Shiroma house (concrete, Kai's). The Chinen house went in phase 4. The walls' and houses' colliders are turned into the world with
 * the island. Each gate is a site, entered the way Kitahama's are (island-homes.js), except Johansson's: his house is
 * the creator's (johansson-house.js), his gate opens onto his yard, and his front door is the site.
 */
const SAND=0xe6dcc3,CORAL_SAND=0xefe6d2;
export function buildKitanoHamlet(world,options){
 const island=world.airportIsland?.group;if(!island)return null;
 const H=KITANO_HAMLET,A=AIRPORT_ISLAND;
 // The gates as sites, their prompts and the court door: always, for the doors, the Town Book and the residents' homes.
 for(const p of H.plots){
  const household=householdAtHome(p.id),toLet=!household||household.toLet;
  // The gate as a site: Johansson's front door is the mayor's home (its rooms come with him); the others are family homes.
  const {door,inward}=p.kind==='johansson-house'?frontDoor(p):hamletGate(p),[wx,wz]=airportWorld(door[0],door[1]),y=airportSurface(wx,wz)?.y??SEA_LEVEL+H.laneTop,facing=inward+A.yaw;
  const title=p.id==='kitano-1'?'Johansson & Thuan’s House':householdTitle(household);
  const site={id:p.id==='kitano-1'?'mayor-home':'home-'+p.id,title,jp:p.family,sub:'KITANO-JIMA',color:0xd4c6ad,accent:'#776953',
   line:household?.address||'Kitano hamlet, by the pier',door:[wx,y,wz],exitPosition:[wx,y,wz],approachPosition:[wx,y,wz],entryFacing:facing,x:wx,z:wz,opens:'00:00',plot:p.id,
   homeId:p.id,isResidence:true,status:household?.status||'vacant',residents:[...(household?.residents||[])]};
  if(p.id!=='kitano-1')Object.assign(site,{familyHome:household||{members:[],toLet:true},houseKind:p.kind,ownRoom:true});
  options.sites.push(site);
  const anchor=new THREE.Object3D();anchor.name='kitano gate:'+p.id;anchor.position.set(wx,y+1.3,wz);world.group.add(anchor);
  options.register?.(anchor,p.id==='kitano-1'?'Go home':(toLet?'Look round the ':'Visit ')+title,()=>options.enter(site));
  const plate=new THREE.Object3D();plate.name='kitano nameplate:'+p.id;const gateAt=hamletGate(p).door,[px,pz]=airportWorld(gateAt[0]+(p.gate==='north'?1.3:-1.3),gateAt[1]-(p.gate==='north'?.4:-.4));plate.position.set(px,y+1,pz);world.group.add(plate);
  const label=homeNameplate(p.id);
  options.register?.(plate,label?label.address+' · '+label.owners:`Read the ${p.romaji} nameplate`,()=>options.onAction?.('read',title,[residentsLine(p.id),KITANO_PLATES[p.id]].filter(Boolean).join('\n\n')));
  if(p.kind==='johansson-house'){
   // The basement's own door, at the foot of the garden stair in the court (D-BEXT).
   const o=HOUSE_OPENINGS.find(q=>q.id==='D-BEXT'),[cu,cv]=houseIsland((o.from+o.to)/2,-.5),[cx,cz]=airportWorld(cu,cv);
   const court=new THREE.Object3D();court.name='kitano court door';court.position.set(cx,SEA_LEVEL+H.yardTop+HOUSE_SITE.court.floor+1.2,cz);world.group.add(court);
   options.register?.(court,'Try the court door',()=>options.onAction?.('inspect','Court door','The steel door into the boiler room, bolted from inside for the typhoon season. The way in is the front door.'));
  }
 }
 // The court and the lightwell are dug below the sea's level: the sea is not drawn in them.
 setOceanPits(KITANO_DUG.map(r=>{const [x,z]=airportWorld((r.minX+r.maxX)/2,(r.minZ+r.maxZ)/2);return {x,z,yaw:A.yaw,halfX:(r.maxX-r.minX)/2,halfZ:(r.maxZ-r.minZ)/2};}));
 // Its lane, yards, walls and houses: now, or when he heads for the island (kitano-on-demand.js), seen from Minato meanwhile.
 kitanoLater(world,'hamlet',()=>buildHamletHouses(world,options));
 if(world.kitano?.distant)world.kitano.far(hamletFar(world));
 return {};
}
/** The hamlet's lane, yards, walls and houses, with their colliders. */
function buildHamletHouses(world,options){
 const island=world.airportIsland.group,H=KITANO_HAMLET,kit=createKit({shadows:options.shadows}),A=AIRPORT_ISLAND;
 const colliders=[];
 /** A collider from the kit (island frame) into the world: turned with the island, lifted to the sea's level. */
 const solid=list=>{for(const c of [].concat(list)){if(!c)continue;const [x,z]=airportWorld(c.x,c.z);colliders.push({...c,x,z,yaw:(c.yaw??0)+A.yaw,minY:SEA_LEVEL+(c.minY??0)});}};
 // The lane: crushed coral between the row and Johansson's plot.
 kit.block(H.lane.minX,H.lane.maxX,.6,H.laneTop,H.lane.minZ,H.lane.maxZ,CORAL_SAND);
 for(const [i,p] of H.plots.entries()){
  const W=p.maxX-p.minX,D=p.maxZ-p.minZ,hw=W/2,hd=D/2,ry=p.gate==='north'?0:Math.PI,seed=30+i;
  // The yard's slab (cut where Johansson's court and lightwell are dug), then everything else in the plot's frame on
  // top of it, the gate at local +z.
  for(const r of cutOut({minX:p.minX,maxX:p.maxX,minZ:p.minZ,maxZ:p.maxZ},KITANO_DUG))kit.block(r.minX,r.maxX,p.base??.6,H.yardTop,r.minZ,r.maxZ,SAND);
  kit.at((p.minX+p.maxX)/2,(p.minZ+p.maxZ)/2,ry,()=>{
   const gate=[-.95,.95],wall=p.wall==='block'?(x0,z0,x1,z1,o)=>blockWall(kit,x0,z0,x1,z1,o):(x0,z0,x1,z1,o)=>coralWall(kit,x0,z0,x1,z1,o);
   solid(wall(-hw,hd,hw,hd,{gaps:[gate],seed:50+seed,flowers:i%2===0}));
   solid(wall(-hw,-hd,hw,-hd,{seed:60+seed}));
   solid(wall(-hw,-hd,-hw,hd,{seed:70+seed}));
   solid(wall(hw,-hd,hw,hd,{seed:80+seed}));
   for(const gx of gate)shisa(kit,gx,1.53,hd,0,.7);
   const label=homeNameplate(p.id);
   kit.sign(nameplate(label.address,label.owners),.95,.32,gate[1]+.65,1.15,hd+.24,{name:'nameplate '+p.id});
   hibiscus(kit,gate[0]-1.1,hd-.9,{seed:90+seed});
   if(p.kind==='johansson-house')johanssonYard(kit,solid,p,hw,hd,seed);
   else if(p.kind==='red-tile'){
    solid(hinpun(kit,0,hd-2,2.6));
    const d=6.2,w=7.4,houseZ=-hd+.3+d/2;
    kit.at(0,houseZ,0,()=>solid(redTileHouse(kit,{w,d,seed})));
    for(let z=-hd+1.2;z<hd-.8;z+=2.2)if(Math.abs(z)>1)solid(fukugi(kit,-(hw-.5),z,{h:5.2+(i%3)*.5,seed:100+seed*10+Math.round(z*3)}));
    banana(kit,hw-.9,-hd+.9,{seed});
    potPlant(kit,1.6,hd-2.2,{seed});potPlant(kit,-1.8,hd-2.3,{seed:seed+3});
    solid(planterBoxes(kit,2.2,hd-.65,{count:3,seed}));
   }else{
    const d=6.2,w=6.8,houseZ=-hd+.35+d/2,houseX=-hw+.35+w/2;
    kit.at(houseX,houseZ,0,()=>solid(concreteHouse(kit,{w,d,seed})));
    solid(laundry(kit,1.7,hd-1.7,{length:2.2}));
    // As in Minato's concrete yards (okinawa/quarters.js): the bicycle inside the front wall right of the gate, the pot
    // by the gate pier, the hibiscus in the left-hand corner, none of them in another or in the washing.
    potPlant(kit,1.3,hd-.45,{seed:seed+5});hibiscus(kit,-hw+.85,hd-.8,{seed:seed+9,flower:0xe8b12c,size:.5});
    solid(bicycle(kit,2.55,hd-.62,{ry:0,colour:0xb03a3a,frame:'step',id:'house-bicycle',owner:label.owners,
     why:'The household’s shopping bicycle, inside the front wall where it is off the lane and clear of the washing.'}));
   }
  },H.yardTop);
 }
 // Its own group under the island's: the kit's finish writes walk levels and a power network on the group it is
 // given, and the island's group must not carry those (the town's power lines and the walk surface read them).
 const hamlet=new THREE.Group();hamlet.name='Kitano hamlet';island.add(hamlet);
 kit.finish(hamlet,'Kitano hamlet');
 // The houses' service drops are in the island's frame, and Minato's power station does not reach across the strait:
 // the hamlet has no town power network (Kitano-jima's own supply is an open item, docs/KITANO-JIMA.md).
 delete hamlet.userData.powerNetwork;delete hamlet.userData.walkLevels;
 world.colliders.push(...colliders);
 return {colliders};
}
/**
 * The hamlet as it is read from Minato, until he heads for the island (kitano-on-demand.js): Johansson's house as its
 * drawn walls (0–12 × 0–10 m) up to its eaves under a red hip roof to its ridge (HOUSE_ROOF) and the Shiroma
 * house (concrete) at its place and size, on its yard. No colliders or prompts.
 */
function hamletFar(world){
 const island=world.airportIsland.group,H=KITANO_HAMLET,far=new THREE.Group();far.name='Kitano hamlet, distant';island.add(far);
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.9}));return mats.get(c);};
 const box=(w,h,d,x,y,z,c,ry=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.rotation.y=ry;far.add(m);return m;};
 const hip=(w,d,h,x,y,z,c,ry=0)=>{const g=new THREE.ConeGeometry(Math.SQRT1_2,1,4,1).rotateY(Math.PI/4).scale(w,h,d),m=new THREE.Mesh(g,mat(c));m.position.set(x,y+h/2,z);m.rotation.y=ry;far.add(m);return m;};
 const y0=H.yardTop;
 for(const p of H.plots)box(p.maxX-p.minX,.2,p.maxZ-p.minZ,(p.minX+p.maxX)/2,y0-.1,(p.minZ+p.maxZ)/2,SAND);
 {const R=houseRect([0,0,12,10]),cx=(R.minX+R.maxX)/2,cz=(R.minZ+R.maxZ)/2,eaves=HOUSE_ROOF.eaves??5.68,ridge=HOUSE_ROOF.ridge??8;
  box(R.maxX-R.minX,eaves,R.maxZ-R.minZ,cx,y0+eaves/2,cz,0xe8e0cc);hip(R.maxX-R.minX+.8,R.maxZ-R.minZ+.8,ridge-eaves,cx,y0+eaves,cz,0xb4513a);}
 for(const p of H.plots){
  if(p.kind==='johansson-house')continue;
  const hw=(p.maxX-p.minX)/2,hd=(p.maxZ-p.minZ)/2,ry=p.gate==='north'?0:Math.PI,c=Math.cos(ry),sn=Math.sin(ry),cx=(p.minX+p.maxX)/2,cz=(p.minZ+p.maxZ)/2;
  const at=(lx,lz)=>[cx+c*lx+sn*lz,cz-sn*lx+c*lz];
  if(p.kind==='red-tile'){const [x,z]=at(0,-hd+.3+3.1);box(7.4,3,6.2,x,y0+1.5,z,0xece4d2,ry);hip(8.2,7,1.6,x,y0+3,z,0xb4513a,ry);}
  else{const [x,z]=at(-hw+.35+3.4,-hd+.35+3.1);box(6.8,3.2,6.2,x,y0+1.6,z,0xd8d4c8,ry);}
 }
 return far;
}
/** A rectangle less the holes in it, as rectangles: cut in strips along x at the holes' sides, each strip less their z. */
function cutOut(r,holes){
 const inside=holes.filter(h=>h.minX<r.maxX&&h.maxX>r.minX&&h.minZ<r.maxZ&&h.maxZ>r.minZ);
 const xs=[...new Set([r.minX,r.maxX,...inside.flatMap(h=>[Math.max(r.minX,h.minX),Math.min(r.maxX,h.maxX)])])].sort((a,b)=>a-b),out=[];
 for(let i=0;i+1<xs.length;i++){
  const [x0,x1]=[xs[i],xs[i+1]],m=(x0+x1)/2,cuts=inside.filter(h=>h.minX<m&&h.maxX>m).map(h=>[Math.max(r.minZ,h.minZ),Math.min(r.maxZ,h.maxZ)]).sort((a,b)=>a[0]-b[0]);
  let z=r.minZ;for(const [a,b] of cuts){if(a>z)out.push({minX:x0,maxX:x1,minZ:z,maxZ:a});z=Math.max(z,b);}
  if(z<r.maxZ)out.push({minX:x0,maxX:x1,minZ:z,maxZ:r.maxZ});
 }
 return out;
}
/**
 * Johansson's yard: his house from the creator's drawings, its front to the gate and 7.5 m in from it (the plot's
 * `front`), level with the yard as the drawings have it; the hinpun between them, a path of coral flags round it to the
 * front door, the gajumaru, his bicycle, the fukugi windbreak along the seaward wall and the back, and the drawn terrace
 * outside the back door (D-TERRACE). Built in the plot's frame, the gate at +z.
 */
function johanssonYard(kit,solid,p,hw,hd,seed){
 const at=p.front-5;
 kit.at(0,at,0,()=>buildHouseExterior(kit,solid));
 // A drawn point of the house in the plot's frame.
 const plot=(x,y)=>{const [lx,,lz]=houseLocal(x,y,0);return [lx,lz+at];};
 solid(hinpun(kit,0,hd-2.2,2.6));
 // The path: flags from the gate, round the hinpun on its west side, to the front door.
 const door=HOUSE_OPENINGS.find(o=>o.id==='D-ENTRY'),[dx,dz]=plot((door.from+door.to)/2,-.35);
 for(const [x,z] of [[0,hd-.6],[-.5,hd-1.3],[-1.9,hd-2.2],[-1.6,hd-3.1],[-1.1,hd-3.9],[-.5,hd-4.7],[dx,dz+1.6],[dx,dz+.8],[dx,dz+.05]])kit.box(.62,.03,.5,x,.015,z,0xe3dccb);
 // The gajumaru by the front wall, his bicycle by the door, pots either side of it.
 gajumaru(kit,-(hw-2.2),hd-2.4,{seed:seed+7,size:.85});
 solid(bicycle(kit,dx-1.9,dz+.4,{ry:.25,colour:0x2f6f74,id:'johansson-bicycle',owner:'Johansson',
  why:'His bicycle by the front door, for the lane down to the ferry slip when the ship is in at Minato, and back up it at night.'}));
 potPlant(kit,dx-1.0,dz-.05,{seed});potPlant(kit,dx+1.05,dz-.05,{seed:seed+3});
 solid(planterBoxes(kit,-(hw-1.6),hd-.65,{count:3,seed}));
 // The windbreak: fukugi along the seaward wall (the plot's +x) and along the back.
 for(let z=-hd+1.1;z<hd-4.6;z+=2.3)solid(fukugi(kit,hw-.55,z,{h:5.4+((z*7)%3+3)%3*.4,seed:100+seed*10+Math.round(z*3)}));
 for(let x=-hw+1.3;x<hw-1.5;x+=2.6)solid(fukugi(kit,x,-hd+.55,{h:5.2+((x*5)%3+3)%3*.4,seed:200+seed*10+Math.round(x*3)}));
 banana(kit,-(hw-.9),-hd+2.2,{seed});
 // The terrace as drawn behind the back door: coral flags level with the yard, a bench along the house wall, two pots.
 const T=HOUSE_SITE.terrace,[t0x,t0z]=plot(T.min[0],T.min[1]),[t1x,t1z]=plot(T.max[0],T.max[1]),D=HOUSE_OPENINGS.find(o=>o.id==='D-TERRACE');
 kit.block(Math.min(t0x,t1x),Math.max(t0x,t1x),0,.012,Math.min(t0z,t1z),Math.max(t0z,t1z),0xd9d1bf);
 const [bx,bz]=plot(D.to+1.15,10.45);
 kit.box(1.4,.06,.38,bx,.44,bz,0x8a6641);for(const sx of [-.6,.6])kit.box(.08,.42,.34,bx+sx,.21,bz,0x5d4431);
 solid(kit.rect(bx-.72,bx+.72,bz-.2,bz+.2,.5,'johansson-terrace-bench'));
 potPlant(kit,Math.min(t0x,t1x)+.3,Math.min(t0z,t1z)+.4,{seed:seed+11});hibiscus(kit,Math.max(t0x,t1x)-.4,Math.min(t0z,t1z)+.4,{seed:seed+13,flower:0xe8b12c});
}
/** Johansson's front door as the site's door: 0.4 m out in the yard, facing in (island frame, as hamletGate). */
function frontDoor(p){
 const o=HOUSE_OPENINGS.find(o=>o.id==='D-ENTRY'),[lx,,lz]=houseLocal((o.from+o.to)/2,-.4,0);
 const cx=(p.minX+p.maxX)/2,cz=(p.minZ+p.maxZ)/2,x=lx,z=lz+p.front-5;
 // The plot is turned half round (the gate on its lane side): a plot point (x, z) is the island's (cx − x, cz − z).
 return {door:[cx-x,cz-z],inward:Math.PI};
}
const KITANO_PLATES=Object.freeze({
 'kitano-1':'Johansson and Thuan’s house: the big concrete house at the end of the lane under a red-tile roof, two floors and a basement, its front to the pier, so he hears the Minato Maru’s whistle before he sees her. He moved out here from his rooms in the town hall’s east wing; the office is still in Minato, a crossing away, and the futon, the television and the letter box came with him. Thuan, his wife, keeps Sakura Shōten in town and comes home on the last boat every night; her futon lies beside his.',
 'kitano-2':'The Shiroma house: concrete, after the typhoon of 1987 took the roof off the old one. The Shiromas moved to their daughter’s in Naha and let it to Kai, the line hand at the pier across the lane.',
});
