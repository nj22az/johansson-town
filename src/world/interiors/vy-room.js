import * as THREE from '../../../vendor/three.module.js';
import {createPlanKit,materialCache,addHatPeg} from './house-plan.js';
import {householdAtHome} from '../../people/island-households.js';
import {registerHomeSeats} from './home-seats.js';
import {householdDetails,addPersonalObject,addFamilyPhoto,addTeaSetting} from './home-details.js';

// The supplied Tokyo diorama translated to a child's room in the existing 1 Kitahama
// shell, not a second apartment. Family fittings remain outside her bedroom.
const mat=materialCache();
export const VY_HOME_LAYOUT=Object.freeze({bounds:{minX:-3.15,maxX:3.15,minZ:-2.75,maxZ:2.75},spawn:[0,0,2.2],exit:[0,1.1,2.76],yaw:0});
export const VY_ROOM=Object.freeze({minX:.05,maxX:3.15,minZ:-2.75,maxZ:-.15,door:[.4,1.4],bed:[.85,-1.5],desk:[2.86,-.65]});

export function buildVyFamilyHome({room,reg,action,collider=()=>{},exit=()=>{}}){
 const group=new THREE.Group();group.name='1 Kitahama · Vy and her family';room.add(group);
 const box=(size,pos,c,name)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(c));m.position.set(...pos);m.name=name||'';m.castShadow=m.receiveShadow=true;group.add(m);return m;};
 const solid=(size,pos,c,name)=>{const m=box(size,pos,c,name);collider(pos[0],pos[2],size[0],size[2],pos[1]+size[1]/2);return m;};
 const anchor=(pos,label,fn)=>{const o=new THREE.Object3D();o.position.set(...pos);o.userData.npcInteraction=false;group.add(o);reg(o,label,fn,true);return o;};
 const kit=createPlanKit({box,collider,height:2.7});
 box([6.4,.04,5.6],[0,-.02,0],0xb7a77d,'Family floor');
 // Window opening in the east bedroom, a real sash outside the inner shoji.
 for(const [size,pos] of [ [[.08,2.7,5.6],[-3.2,1.35,0]],[[.08,2.7,5.6],[3.2,1.35,0]],[[3.4,2.7,.08],[-1.5,1.35,-2.8]],[[.7,2.7,.08],[2.85,1.35,-2.8]],[[2.3,.8,.08],[1.35,.4,-2.8]],[[2.3,.55,.08],[1.35,2.425,-2.8]],[[2.7,2.7,.08],[-1.85,1.35,2.8]],[[2.7,2.7,.08],[1.85,1.35,2.8]],[[1, .65,.08],[0,2.375,2.8]]])box(size,pos,0xeee3cc,'Family wall');
 const ceiling=box([6.4,.04,5.6],[0,2.72,0],0xf4eee1,'Ceiling');ceiling.receiveShadow=false;
 // Bedrooms behind sliding doors. Existing shell retains its entrance and services.
 kit.partition(-3.2,-.1,3.2,-.1,[[-1.5,-.5],VY_ROOM.door],{fusuma:true});
 kit.partition(0,-2.8,0,-.1,[],{fusuma:true});
 kit.partition(.75,1.2,3.2,1.2,[[.9,1.6],[2.25,3.05]]);
 kit.partition(.75,1.2,.75,2.8);kit.partition(1.75,1.2,1.75,2.8);
 kit.wetRoom(.8,1.7,1.25,2.75,'Toilet',true);kit.wetRoom(1.8,3.15,1.25,2.75,'Bath',false);
 kit.floorPatch(-.7,.7,1.8,2.75,0x90958d,'Genkan tiles');
 box([1.4,.06,.1],[0,.03,1.8],0x775338,'Genkan step');
 kit.finishPartitions();
 solid([.5,.88,1.5],[-2.88,.44,.68],0xe5d8bc,'Family kitchen');
 box([.52,.035,1.52],[-2.88,.895,.68],0xa8b4b4,'Kitchen counter');
 box([.38,.018,.45],[-2.88,.922,1.1],0x5e7479,'Sink');
 box([.04,.22,.04],[-3.02,1.03,1.1],0xc6cccc,'Tap');
 box([.36,.035,.4],[-2.88,.93,.25],0x353d42,'Cooking hob');
 solid([.55,1.25,.55],[-2.85,.625,1.9],0xa3c9b3,'Family refrigerator');
 solid([1.2,.55,.7],[-.9,.275,1.25],0x795036,'Family dining table');
 for(const [x,z] of [[-.9,.52],[-.9,1.98],[-1.95,1.25]])box([.45,.07,.45],[x,.035,z],0x637e76,'Family zabuton');
 // Thuan's weekday guest bedding went with her weekday room (docs/CAST-CONSOLIDATION.md addendum 4): the household is
 // Thao, Chin and Vy, each with their own futon, and the floor by the kitchen is clear.
 const homeLayouts={};
 for(const [name,x,c] of [['Thao',-2.5,0x63817e],['Chin',-1.3,0x526d8d]])homeLayouts[name]={...VY_HOME_LAYOUT,...kit.futon(x,-1.55,c,'Futon '+name),table:[-.9,0,name==='Thao'?1.98:.52],tableStand:[.2,0,.7],tableSeatHeight:.07,tableSeatFront:.225,tableSeatYaw:name==='Thao'?0:Math.PI,door:[0,0,2.2]};
 const members=householdAtHome('kitahama-1').members,details=householdDetails(members);
 addFamilyPhoto(box,{x:-3.14,z:.2,westWall:true,members});
 details.slice(0,2).forEach((detail,i)=>addPersonalObject(box,{x:-1.1+i*.4,y:.552,z:1.2,detail,scale:.65}));
 addTeaSetting(box,{x:-.8,y:.552,z:1.45,people:members.length});
 box([.2,.15,.2],[-2.88,1.02,.25],0xb57655,'Cooking pot');
 box([.09,.06,.09],[-2.88,.962,1.1],0xd9e5df,'Washed rice bowl');
 for(const dx of [-.08,.08])box([.12,.065,.24],[-.4+dx,.033,2.5],0x556c61,'Household shoes');
 anchor([-.9,1,.95],'Inspect the household’s everyday things',()=>action('inspect','1 Kitahama',details.map(d=>d.owner+' · '+d.text).join('\n')));
 // 4.5 small mats: four full mats and a centre half mat, no four-corner junction.
 // 2.52 m square fits this existing bedroom; the diorama's eight giant mats do not.
 const s=.84,x0=.22,z0=-2.7;
 for(const [u,v,w,d] of [[0,0,2,1],[2,0,1,2],[1,2,2,1],[0,1,1,2],[1,1,1,1]]){
  const x=x0+(u+w/2)*s,z=z0+(v+d/2)*s;
  box([w*s-.014,.015,d*s-.014],[x,.0075,z],0xb7bc85,'Vy tatami');
  // Binding along the long sides, separated from adjacent mats by the joint.
  if(w>=d)for(const dz of [-1,1])box([w*s-.02,.008,.022],[x,.019,z+dz*(d*s/2-.02)],0x344c3b,'Tatami binding');
  else for(const dx of [-1,1])box([.022,.008,d*s-.02],[x+dx*(w*s/2-.02),.019,z],0x344c3b,'Tatami binding');
 }
 const vyBed=kit.futon(...VY_ROOM.bed,0xdf93ab,'Futon Vy',{width:.85,length:1.8});
 // Low quilt stitches and an original plush cat: all detail remains on the bedding.
 for(let i=0;i<4;i++)box([.75,.003,.007],[.85,.152,-1.8+i*.23],0xf4c1ce,'Quilt stitching');
 const plush=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),mat(0xf5d586));plush.scale.set(.8,1,.8);plush.position.set(.62,.28,-2.1);plush.name='Vy’s plush cat';group.add(plush);
 for(const dx of [-.06,.06]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.035,.07,4),mat(0xf5d586));ear.position.set(.62+dx,.4,-2.1);group.add(ear);}
 solid([.48,.7,.95],[2.86,.35,-.65],0x987354,'Vy homework desk');
 box([.5,.035,.97],[2.86,.7175,-.65],0xb48b65,'Desk top');
 box([.38,.38,.38],[2.32,.19,-.65],0x819b9f,'Desk stool');
 box([.16,.009,.22],[2.79,.741,-.65],0xfff5df,'Kanji notebook');
 box([.014,.014,.17],[2.89,.749,-.67],0xd7b164,'Pencil');
 const lamp=box([.12,.16,.12],[2.87,.825,-.93],0x668e84,'Green study lamp');
 const lampLight=new THREE.PointLight(0xffdab0,.55,2.4,2);lampLight.position.set(2.7,1.03,-.88);group.add(lampLight);
 reg(lamp,'Switch Vy’s desk lamp',()=>{lampLight.visible=!lampLight.visible;action('inspect','Vy’s study lamp',lampLight.visible?'The green lamp lights the kanji notebook.':'The desk lamp is off.');},true);
 solid([.75,.6,.36],[2.25,.3,-2.51],0x947357,'Vy book cabinet');
 for(let i=0;i<5;i++)box([.07,.22,.19],[2+i*.1,.73,-2.51],[0xd47e9a,0x7299af,0xd5b26f][i%3],'School book');
 const radio=box([.32,.18,.16],[2.25,.71,-2.4],0xd78faa,'Pink cassette player');
 for(const dx of [-.1,.1])box([.07,.075,.01],[2.25+dx,.72,-2.312],0x3a3a4a,'Cassette speaker');
 reg(radio,'Inspect Vy’s cassette player',()=>action('inspect','Pink cassette player','Chin repaired this cassette player for Vy. Her favourite tape is labelled in her own handwriting.'),true);
 box([.23,.3,.1],[.22,1.1,-.35],0x835545,'Vy school satchel');
 anchor([.65,.85,-.35],'Look at Vy’s school bag',()=>action('inspect','Vy’s school satchel','Her notebook, pencil case and tomorrow’s school books. Ten kanji still need practising.'));
 anchor([2.25,.95,-.65],'Read Vy’s homework',()=>action('read','Vy’s homework','Miss Higa has set ten kanji and a page of fractions. A bookmark marks the next page to practise.'));
 // Window and folded pink curtains. No balcony or kitchen invented inside her room.
 for(const x of [.2,1.35,2.5])box([.035,1.35,.05],[x,1.475,-2.75],0xaaaeb0,'Window sash');
 for(const y of [.8,2.15])box([2.3,.035,.05],[1.35,y,-2.75],0xaaaeb0,'Window sash');
 const glass=new THREE.Mesh(new THREE.PlaneGeometry(2.25,1.3),new THREE.MeshStandardMaterial({color:0xb4d8dc,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide}));glass.position.set(1.35,1.475,-2.755);glass.name='Window glass';group.add(glass);
 for(const x of [.34,2.36])box([.2,1.35,.09],[x,1.475,-2.68],0xe8a8b9,'Pink curtain');
 const paper=box([.4,.53,.02],[1.9,1.47,-2.69],0xfcf1dd,'Vy’s harbour drawing');
 box([.34,.08,.009],[1.9,1.33,-2.674],0x75a9b1,'Drawing sea');
 box([.12,.07,.01],[1.9,1.43,-2.667],0xd69762,'Drawing ferry');
 reg(paper,'Look at Vy’s drawing',()=>action('inspect','The ferry, by Vy','A drawing of the Minato Maru for the school wall. She has counted every window. Chin says the engine is missing; Vy says it is inside.'),true);
 homeLayouts.Vy={...VY_HOME_LAYOUT,...vyBed,table:[2.32,0,-.65],tableStand:[1.95,0,-.65],tableSeatHeight:.38,tableSeatFront:.19,tableSeatYaw:-Math.PI/2,door:[.9,0,-.1]};
 registerHomeSeats({parent:group,reg,action,layouts:homeLayouts});
 group.add(new THREE.HemisphereLight(0xffefdc,0x887768,1.25));
 anchor(VY_HOME_LAYOUT.exit,'Leave the family home',exit);
 return {...VY_HOME_LAYOUT,home:true,homeLayouts};
}
