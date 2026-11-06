import {registerHomeSeats} from './home-seats.js';
import * as THREE from '../../../vendor/three.module.js';
import {RESIDENTS} from '../../people/residents.js';
import {householdDetails,addPersonalObject,addFamilyPhoto,addTeaSetting} from './home-details.js';
import {createPlanKit,addHatPeg,materialCache} from './house-plan.js';
import {buildVyFamilyHome} from './vy-room.js';

/**
 * Inside an island family's house, planned the way it would have been built (see
 * docs/BUILDING-AUDIT.md). It used to be one tatami box for every house on the island,
 * red-tile or concrete, with no entrance, no toilet and no bath -- while the house to let
 * advertised "2DK, kitchen and bath". The shell is the same 6.4 x 5.6 m; inside:
 *
 *  - concrete (the 1970s-80s block house, kind 'concrete'): a 2DK. Genkan with its step and
 *    shoe cupboard; toilet and bath off to the east; the dining-kitchen across the front;
 *    two tatami rooms at the back divided by fusuma, the altar in the west one and the
 *    futons in the east.
 *  - red-tile (the older house, kind 'red-tile'): ichibanza (the guest room, with its
 *    tokonoma) and nibanza (the family room, with the tōtōmē, the altar) along the front,
 *    opening into each other through fusuma; behind them the kitchen with a small bath and
 *    toilet, and uraza, where the family sleeps.
 *
 * Every room has a door gap at least 0.8 m wide, and every partition is solid, so you walk
 * round the house the way its plan says. A house to let is the same plan, swept and empty.
 *
 * Room contract as everywhere: door on +z, enter facing -z, bounds/spawn/exit.
 */
const W=6.4,D=5.6,H=2.7;
const mat=materialCache();
export const FAMILY_HOME_LAYOUT=Object.freeze({bounds:{minX:-W/2+.05,maxX:W/2-.05,minZ:-D/2+.05,maxZ:D/2-.05},spawn:[0,0,D/2-.6],exit:[0,1.1,D/2-.04],yaw:0});

export function buildFamilyHome({room,reg,action,collider=()=>{},household,title='Home',kind='concrete',residents=null,exit}){
 if(household?.members?.some(m=>m.name==='Vy')||residents?.includes('Vy'))return buildVyFamilyHome({room,reg,action,collider,exit});
 const redTile=kind==='red-tile';
 const group=new THREE.Group();group.name='Family home · '+title;room.add(group);
 const box=(size,pos,c,name)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(c));m.position.set(...pos);m.receiveShadow=true;if(name)m.name=name;group.add(m);return m;};
 const anchor=(pos,label,fn)=>{const o=new THREE.Object3D();o.position.set(...pos);o.userData.npcInteraction=false;group.add(o);reg(o,label,fn,true);};
 const hw=W/2,hd=D/2,empty=!residents&&(!household||household.toLet||!household.members.length);
 // Tatami, walls with a timber dado line, ceiling, the door gap on +z.
 box([W,.04,D],[0,-.02,0],0xcbc38c,'Tatami');
 for(const x of [-hw/2,0,hw/2])box([.04,.012,D],[x,.006,0],0x3f4a3a);box([W,.012,.04],[0,.006,0],0x3f4a3a);
 for(const [len,pos,ry] of [[W,[0,0,-hd],0],[D,[-hw,0,0],Math.PI/2],[D,[hw,0,0],-Math.PI/2],[hw-.55,[-(hw+.55)/2,0,hd],Math.PI],[hw-.55,[(hw+.55)/2,0,hd],Math.PI]]){
  const g=new THREE.Group();g.position.set(...pos);g.rotation.y=ry;group.add(g);
  const p=(size,at,c,name)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(c));m.position.set(...at);if(name)m.name=name;g.add(m);};
  // Insets meet at their inner corner instead of sharing 6 cm of top face.
  p([len,H,.06],[0,H/2,0],0xeee3cc);p([len-.12,.05,.08],[0,.95,.02],0x6d5238,'Outer wall dado');p([len,.08,.08],[0,.04,.02],0x5a4430);
 }
 box([1.1,H-2.05,.06],[0,2.05+(H-2.05)/2,hd],0xeee3cc);box([W,.04,D],[0,H+.02,0],0xf3ece0,'Ceiling');
 group.add(new THREE.HemisphereLight(0xfff0d8,0x8a7a64,1.15));
 const lamp=new THREE.PointLight(0xffe8c8,.7,8,2);lamp.position.set(0,2.4,0);group.add(lamp);
 // The kitchen through the west side; a house to let comes with it.
 // In the concrete house it runs along the dining-kitchen's west wall; in the red-tile
 // house the kitchen is at the back, beside the bath.
 const K=redTile?{x:-.15,z:-hd+.34,w:1.4,d:.6,fx:.3,fz:-.68}:{x:-hw+.32,z:1.0,w:.6,d:1.6,fx:-hw+.32,fz:-.3};
 box([K.w,.9,K.d],[K.x,.45,K.z],0xd8d2c4,'Kitchen counter');box([K.w+.02,.04,K.d+.02],[K.x,.92,K.z],0x9aa3a6);collider(K.x,K.z,K.w,K.d,.95);
 if(!empty){box([.55,1.3,.55],[K.fx,.65,K.fz],0xe8ebe6,'Fridge');collider(K.fx,K.fz,.6,.6,1.3);}
 // ---- The plan: partitions with door gaps, and the rooms' own fittings. ----
 const wallMat=redTile?0xf1e6cc:0xeee3cc,frame=0x5a4430;
 const {partition,floorPatch,wetRoom,futon,finishPartitions}=createPlanKit({box,collider,height:H,wall:wallMat,frame});
 let altar,table,futons,tv,board;
 if(!redTile){
  // Concrete 2DK.
  floorPatch(-.75,.75,1.85,hd-.04,0x9a9c96,'Genkan tiles');
  box([1.5,.06,.12],[0,.03,1.82],0x8a6a46,'Genkan step (agarikamachi)');
  partition(.75,1.2,.75,hd);                     // genkan / toilet
  partition(.75,1.2,hw,1.2,[[.95,1.65],[2.3,3.0]]); // toilet and bath doors face the DK
  partition(1.75,1.2,1.75,hd);                   // toilet / bath
  wetRoom(.79,1.71,1.24,hd-.04,'Toilet',true,'z0');wetRoom(1.79,hw-.04,1.24,hd-.04,'Bath',false,'z0');
  box([.32,1.0,.9],[-.58,.5,2.3],0x8a6a46,'Getabako (shoe cupboard)');collider(-.58,2.3,.34,.9,1.0);
  floorPatch(-hw+.04,.75,-.6,1.82,0xc9b48c,'DK floor');floorPatch(.79,hw-.04,-.6,1.16,0xc9b48c,'DK floor');
  box([1.2,.06,.8],[-1.3,.72,.35],0x8a6a46,'Dining table');for(const [x,z] of [[-1.3,-.25],[-1.3,.95],[-2.15,.35],[-.45,.35]])box([.38,.45,.38],[x,.22,z],0x6b4a32,'Dining chair');collider(-1.3,.35,1.3,.9,.75);
  partition(-hw,-.6,hw,-.6,[[-1.2,-.4],[1.1,2.0]],{fusuma:true});
  partition(0,-hd,0,-.6,[[-1.9,-1.1]],{fusuma:true});
  altar={x:-1.6,z:-hd+.3};table={x:-2.25,z:-1.45};tv={x:2.55,z:-.33,ry:0};board={x:.7,z:2.2,ry:-Math.PI/2};
  futons={x0:.5,z:-hd+.5,step:.72,along:'x'};
 }else{
  // The older Okinawan house: ichibanza and nibanza at the front, kitchen and uraza behind.
  partition(0,-.4,0,hd-1.2,[[.25,1.25]],{fusuma:true});        // ichibanza | nibanza
  partition(-hw,-.4,hw,-.4,[[-1.6,-.8],[.65,1.65]]);           // front rooms | back rooms
  partition(.6,-hd,.6,-.4,[[-1.7,-.9]]);                   // kitchen | uraza
  partition(-hw,-1.45,-.9,-1.45,[[-3.0,-2.35],[-1.95,-1.15]]); // kitchen | toilet and bath
  partition(-2.2,-hd,-2.2,-1.45);partition(-.9,-hd,-.9,-1.45);
  wetRoom(-hw+.04,-2.24,-hd+.04,-1.49,'Toilet',true,'z1');wetRoom(-2.16,-.94,-hd+.04,-1.49,'Bath',false,'z1');
  floorPatch(-hw+.04,.56,-1.41,-.44,0xa58a68,'Kitchen boards');floorPatch(-.86,.56,-hd+.04,-1.41,0xa58a68,'Kitchen boards');
  // Tokonoma: a raised alcove in the ichibanza with a hanging scroll and a vase.
  box([.5,.12,1.0],[hw-.27,.06,.2],0x6d5238,'Tokonoma');box([.03,1.0,.5],[hw-.07,1.35,.2],0xe9e0c4,'Hanging scroll');box([.1,.22,.1],[hw-.27,.23,.45],0x3f6a8a,'Ikebana vase');collider(hw-.27,.2,.52,1.0,.2);
  altar={x:-2.4,z:-.4+.3};table={x:1.6,z:1.0};tv={x:-hw+.55,z:1.1,ry:Math.PI/2};board={x:1.6,z:hd-.05,ry:0};
  futons={x0:1.0,z:-hd+.5,step:.62,along:'x'};
 }
 // Partitions meet as one solid shell. Remove buried faces and give each
 // coplanar patch one owner, including where doorway beams cross a T-junction.
 finishPartitions();
 if(empty){
  box([.3,.01,.42],[0,.01,.6],0xf4ecd6,'Rental note');
  anchor([0,.5,.6],'Read the rental note',()=>action('read',"For rent · Rental house","2DK, tatami, kitchen and bath, water tank on the roof. ¥28,000 a month. Enquiries to the town hall, Residents Division. Somebody new could live here."));
  return {...FAMILY_HOME_LAYOUT,home:true,toLet:true};
 }
 // The family altar: lacquer cabinet, the tablets, offerings of fruit and an incense bowl.
 // Its back is to a wall and it faces into its room (+z).
 if(!residents){const a=altar;box([1.2,1.3,.5],[a.x,.65,a.z],0x3a2a20,'Butsudan');box([1.0,.5,.05],[a.x,1.1,a.z+.26],0x8a6a2a);
 for(let i=0;i<3;i++)box([.08,.32,.04],[a.x-.3+i*.3,1.12,a.z+.2],0x1c1612,'Ancestral tablet');
 box([.18,.08,.18],[a.x,1.32,a.z+.12],0xd9a43a,'Incense bowl');
 for(const [dx,c] of [[-.35,0xe8742a],[.35,0xf4d23c]])box([.12,.12,.12],[a.x+dx,1.36,a.z+.12],c,'Offering');
 collider(a.x,a.z,1.2,.5,1.3);}
 const visitorSeats=[];
 // (`front`: the dining chairs are .38 deep, the zabuton .48)
 const addSeat=(x,z,yaw,surfaceY,label,stand,front)=>visitorSeats.push({label,position:[x,0,z],stand:stand||[x+Math.sin(yaw)*.65,0,z+Math.cos(yaw)*.65],surfaceY,yaw,front});
 if(!redTile)for(const [x,z,yaw,stand] of [[-1.3,-.25,Math.PI,[-.15,0,-.25]],[-1.3,.95,0,[-1.3,0,1.4]],[-2.15,.35,-Math.PI/2,[-2.15,0,1.55]],[-.45,.35,Math.PI/2,[.05,0,.35]]])addSeat(x,z,yaw,.445,'Sit at the dining table',stand,.19);
 // Low table and cushions in the tatami room; the television.
 box([1.1,.05,.75],[table.x,.36,table.z],0x6b4a32,'Low table');collider(table.x,table.z,1.1,.75,.4);
 // Keep cushions inside the west wall and out from under the altar cabinet.
 for(const [dx,dz] of (redTile?[[0,.62],[0,-.62],[-.75,0],[.75,0]]:[[0,.62],[-.6,0],[.75,0]])){box([.48,.07,.48],[table.x+dx,.04,table.z+dz],0x3f6f8a,'Zabuton');const stand=!redTile&&dx<0?[-1.1,0,-1.45]:redTile&&dx<0?[.5,0,1]:redTile&&dz<0?[1.05,0,.1]:redTile&&dx>0?[2.35,0,1.85]:undefined;addSeat(table.x+dx,table.z+dz,Math.atan2(dx,dz),.075,'Sit at the tea table',stand,.24);}
 {const g=new THREE.Group();g.position.set(tv.x,0,tv.z);g.rotation.y=tv.ry;group.add(g);
  const add=(size,at,c,name)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(c));m.position.set(...at);if(name)m.name=name;g.add(m);};
  add([.8,.42,.4],[0,.21,0],0x6b4a32,'TV stand');add([.58,.44,.42],[0,.64,.02],0x2b2b2b,'Television');
  collider(tv.x,tv.z,Math.abs(Math.sin(tv.ry))>.5?.4:.8,Math.abs(Math.sin(tv.ry))>.5?.8:.4,.9);}
 const members=residents?residents.map(name=>RESIDENTS.find(p=>p.name===name)||{name}):household.members;
 // Each occupied house keeps evidence of its residents' work and time together.
 // These objects use existing tops and walls; none adds a walking obstruction.
 const details=householdDetails(members);
 for(const [i,detail] of details.slice(0,2).entries())addPersonalObject(box,{x:table.x-.2+i*.38,y:.388,z:table.z-.12,detail,scale:.75});
 addTeaSetting(box,{x:table.x-.2,y:.388,z:table.z+.21,people:members.length});
 addFamilyPhoto(box,{x:-3.14,z:redTile?.85:-.9,members:members,westWall:true});
 // Washed bowls, a pot and a folded tea towel make the fitted kitchen usable.
 const counterY=.94;
 box([.22,.14,.22],[K.x,counterY+.07,K.z],0xb57655,'Cooking pot');
 box([.13,.035,.13],[K.x,counterY+.16,K.z],0xb57655,'Pot lid');
 box([.18,.015,.18],[K.x+(redTile?.45:0),counterY+.009,K.z+(redTile?0:.48)],0xdfd5b6,'Folded kitchen towel');
 for(let i=0;i<2;i++)box([.09,.06,.09],[K.x+(redTile?-.4:0),counterY+.031,K.z+(redTile?i*.14:-.4+i*.14)],0xd9e5df,'Washed rice bowl');
 // Shoes stay along the wall, with a full passage through the entrance.
 for(const dx of [-.08,.08])box([.12,.065,.24],[-.35+dx,.033,2.53],0x556c61,'Household shoes');
 anchor([table.x,.8,table.z+.45],'Inspect the household’s everyday things',()=>action('inspect',title,details.map(d=>d.owner+' · '+d.text).join('\n')+'\nThe cups have been used, the bedding has a place, and the photograph by the wall belongs to this family.'));
 // Walking residents (Thuan and Thao): futons laid out in the sleeping room, and where each
 // of them sleeps, sits and hangs a hat (home-residents.js). Low futons are walked onto.
 if(residents){
  // Three places (batch 7b: Thuan, Thao and Chin at 1 Kitahama): the third futon beside the others, the third seat at the table's end.
  // Red tile: the uraza takes two futons (Thao and Chin, the couple); the first resident's (Thuan's) lies in the nibanza.
  const homeLayouts={},beds=redTile?[[-1.3,1.2],[1.2,-1.7],[2.6,-1.7]]:[[.55,-1.68],[2.7,-1.68],[1.62,-1.68]];
  // Seats: either side of the low table in the ichibanza, or at the 2DK's dining table.
  const seats=redTile?[[table.x,table.z+.62],[table.x,table.z-.62],[table.x-.75,table.z]]:[[-1.3,.95],[-.45,.35],[-2.15,.35]];
  residents.forEach((name,i)=>{
   const [x,zc]=beds[i%3],bed=futon(x,zc,[0xe06a7a,0x3f6a8a,0x5a8a5a][i%3],'Futon '+name);
   const hatHook=redTile?{position:[.8+i*.25,1.6,hd-.04],yaw:Math.PI}:{position:[.7,1.6,2.15+i*.35],yaw:-Math.PI/2};
   addHatPeg(box,hatHook);
   const k=i%3,stand=redTile?[[table.x,0,table.z+.95],[1.05,0,.1],[.5,0,1]][k]:[[-1.3,0,1.4],[.05,0,.35],[-2.15,0,1.2]][k];
   homeLayouts[name]={...FAMILY_HOME_LAYOUT,...bed,table:[seats[k][0],0,seats[k][1]],tableStand:stand,tableSeatHeight:redTile?.075:.445,tableSeatFront:redTile?.24:.19,tableSeatYaw:[0,redTile?Math.PI:Math.PI/2,Math.PI/2][k],door:[0,0,hd-.5],hatHook};
  });
  // Thuan's wardrobe: against the nibanza's back wall (where a family keeps its altar), or
  // in the 2DK's west tatami room.
  if(residents.includes('Thuan')){const [x,z]=redTile?[-2.4,-.12]:[-hw+.45,-hd+.65];box([.85,1.8,.5],[x,.9,z],0x765343,'Thuan’s wardrobe');collider(x,z,.85,.5,1.8);anchor([x,1.1,z+.55],'Look at Thuan’s wardrobe',()=>action('inspect','Thuan’s wardrobe','Her everyday clothes, the navy harbour academy sailor set she wears to evening classes, and the outfit she wears on Rainflower Lane.'));}
  registerHomeSeats({parent:group,reg,action,layouts:homeLayouts,extra:visitorSeats});
  return {...FAMILY_HOME_LAYOUT,home:true,homeLayouts};
 }
 // One futon per person, folded along the back wall of the sleeping room, each in their own colour.
 household.members.forEach((m,i)=>{const c=[0x2c3e5c,0xb2453b,0x3f6a4a,0x8a6aa8][i%4],x=futons.x0+i*futons.step;
  box([.58,.36,.95],[x,.18,futons.z],0xe9dfc8,'Futon '+m.name);box([.54,.1,.9],[x,.41,futons.z],c);});
 if(household.members.length)collider(futons.x0+(household.members.length-1)*futons.step/2,futons.z,household.members.length*futons.step,.95,.5);
 // Who lives here, on the board by the door.
 {const g=new THREE.Group();g.position.set(board.x,1.5,board.z);g.rotation.y=board.ry;group.add(g);const m=new THREE.Mesh(new THREE.BoxGeometry(.5,.7,.03),mat(0xf4ecd6));m.name='Household board';g.add(m);}
 anchor([board.x+(board.ry?-.35:0),1.4,board.z-(board.ry?0:.35)],'Read the household board',()=>action('read',title,household.members.map(m=>m.name+' — '+m.purpose).join('\n')));
 anchor([altar.x,1.1,altar.z+.7],'Look at the family altar',()=>action('inspect','Tōtōmē · the family altar','The ancestors\' tablets in their lacquer case, a bowl of incense ash, an orange and a box of sweets. On the first and fifteenth of the month somebody lights three sticks and says the family\'s news out loud.'));
 if(household?.members?.some(m=>m.name==='Thuan')){box([.85,1.8,.5],[-hw+.45,.9,-hd+.65],0x765343,'Thuan’s wardrobe');collider(-hw+.45,-hd+.65,.85,.5,1.8);anchor([-hw+.7,1.1,-hd+1.15],'Look at Thuan’s wardrobe',()=>action('inspect','Thuan’s wardrobe','Her everyday clothes, the navy harbour academy sailor set she wears to evening classes, and the outfit she wears on Rainflower Lane.'));}
 registerHomeSeats({parent:group,reg,action,extra:visitorSeats});
 return {...FAMILY_HOME_LAYOUT,home:true};
}
