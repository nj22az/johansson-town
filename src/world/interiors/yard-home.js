import {registerHomeSeats} from './home-seats.js';
import * as THREE from '../../../vendor/three.module.js';
import {createPlanKit,addHatPeg,materialCache} from './house-plan.js';
import {YARD_HOMES} from '../yard-homes-layout.js';
import {householdFor} from '../../people/households.js';
import {RESIDENTS} from '../../people/residents.js';
import {residentPersonality} from '../../people/resident-personalities.js';
import {householdDetails,addPersonalObject,addFamilyPhoto,addTeaSetting} from './home-details.js';

/**
 * Inside the two staff houses in Front-Row yard (yard-homes-layout.js), drawn to the size
 * they are outside (docs/BUILDING-AUDIT.md: they used to open into a 7 x 6.8 m room
 * behind a 4.2 x 3.2 m front). Each is the small 1K a shop would rent its staff in the
 * 1980s:
 *
 *  - a genkan at the door, with the step up;
 *  - the WC beside it, its door off the genkan;
 *  - a board-floored kitchen: sink and two gas rings along the back wall, the fridge,
 *    a little table for two and a shelf;
 *  - a tatami room behind fusuma, where the two futons are laid out at night.
 *
 * No bath: like half the town, they go to Umi-no-yu (the note on the fridge says so).
 * The plan is drawn for a door on the east of the front wall and mirrored for a door on
 * the west, so it always opens the way the house does. Room contract: door on +z.
 */
const mat=materialCache();

export function yardHomeSpec(id){
 const spec=YARD_HOMES[id];if(!spec)return null;
 const front=Math.sign(spec.doorFace-spec.z),doorX=(spec.door[0]-spec.x)*front;
 return {W:spec.w-.2,D:spec.d-.2,H:2.5,s:Math.sign(doorX)||1,doorX:Math.abs(doorX)};
}

export function buildYardHomeInterior({site,room,reg,action,collider=()=>{}}){
 const spec=yardHomeSpec(site.id),household=householdFor(site.homeOwner);
 const {W,D,H,s,doorX}=spec,hw=W/2,hd=D/2,X=x=>s*x;
 const group=new THREE.Group();group.name='Yard home · '+(household?.title||site.title);room.add(group);
 const box=(size,pos,c,name)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(c));m.position.set(...pos);m.receiveShadow=true;if(name)m.name=name;group.add(m);return m;};
 const at=(size,[x,y,z],c,name)=>box(size,[X(x),y,z],c,name);
 const block=(x,z,w,d,h)=>collider(X(x),z,w,d,h);
 const anchor=(pos,label,fn)=>{const o=new THREE.Object3D();o.position.set(X(pos[0]),pos[1],pos[2]);o.userData.npcInteraction=false;group.add(o);reg(o,label,fn,true);};
 // One yard home is left (resident-home-kenji, Tetsuo); 1 Front-Row Yard went in phase 4 (okinawa/lots.js CLEARED_LOTS).
 const wall=0xf1e6cf,trim=0x2a6f9c;
 const kit=createPlanKit({box,collider,height:H,wall});
 const partition=(x1,z1,x2,z2,gaps=[],opts)=>kit.partition(X(x1),z1,X(x2),z2,Math.abs(z2-z1)<1e-6?gaps.map(([a,b])=>[Math.min(X(a),X(b)),Math.max(X(a),X(b))]):gaps,opts);

 // Shell: floor finishes, walls with a dado, the door gap in the front wall, ceiling.
 const genkan=[doorX-.45,doorX+.45];
 box([W,.02,D],[0,-.01,0],0x8a7a64,'Floor');
 kit.floorPatch(X(-hw)<X(.2)?X(-hw):X(.2),X(-hw)<X(.2)?X(.2):X(-hw),-hd,hd,0xcbc38c,'Tatami');
 for(const x of [-hw+.9,-hw+1.8])at([.03,.014,D],[x,.02,0],0x3f4a3a);at([2.9,.014,.03],[-hw+1.45,.02,-hd+1.8],0x3f4a3a);
 kit.floorPatch(Math.min(X(.2),X(hw)),Math.max(X(.2),X(hw)),-hd,hd,0xb08c62,'Kitchen boards');
 kit.floorPatch(Math.min(X(genkan[0]),X(genkan[1])),Math.max(X(genkan[0]),X(genkan[1])),hd-.8,hd,0x9a9c96,'Genkan tiles');
 at([genkan[1]-genkan[0],.06,.1],[doorX,.03,hd-.8],0x8a6a46,'Genkan step (agarikamachi)');
 const shell=(len,pos,ry)=>{const g=new THREE.Group();g.position.set(...pos);g.rotation.y=ry;group.add(g);
  const p=(size,o,c)=>{const own=mat(c).clone();own.shadowSide=THREE.FrontSide;const m=new THREE.Mesh(new THREE.BoxGeometry(...size),own);m.position.set(...o);g.add(m);};
  p([len,H,.08],[0,H/2,0],wall);p([Math.max(.01,len-.12),.05,.08],[0,.9,.03],trim);p([len,.08,.08],[0,.04,.03],0x5a4430);};
 shell(W,[0,0,-hd],0);shell(D,[-hw,0,0],Math.PI/2);shell(D,[hw,0,0],-Math.PI/2);
 const left=genkan[0]+hw,right=hw-genkan[1];
 shell(left,[X((-hw+genkan[0])/2),0,hd],Math.PI);shell(right,[X((genkan[1]+hw)/2),0,hd],Math.PI);
 at([genkan[1]-genkan[0],H-2.05,.08],[doorX,2.05+(H-2.05)/2,hd],wall);
 const ceiling=box([W,.04,D],[0,H+.02,0],0xf3ece0,'Ceiling');ceiling.material=ceiling.material.clone();ceiling.material.shadowSide=THREE.FrontSide;ceiling.receiveShadow=false;
 group.add(new THREE.HemisphereLight(0xfff0d8,0x8a7a64,1.15));
 const lamp=new THREE.PointLight(0xffe8c8,.75,7,2);lamp.position.set(0,H-.3,0);group.add(lamp);

 // The tatami room, behind fusuma; the kitchen; the WC off the genkan.
 partition(.2,-hd,.2,hd-.85,[[-.55,.35]],{fusuma:true,name:'Fusuma'});
 partition(1.6,hd-1.15,1.6,hd,[[hd-1.0,hd-.2]]);partition(1.6,hd-1.15,hw,hd-1.15);
 kit.finishPartitions();
 const t0=Math.min(X(1.64),X(hw-.04)),t1=Math.max(X(1.64),X(hw-.04));
 kit.wetRoom(t0,t1,hd-1.11,hd-.04,'Toilet',true,s>0?'x0':'x1');
 at([1.5,.88,.6],[1.2,.44,-hd+.3],0xd8d2c4,'Kitchen counter');at([1.52,.04,.62],[1.2,.9,-hd+.3],0x9aa3a6);
 at([.42,.05,.3],[.9,.93,-hd+.3],0xb8c0c4,'Sink');at([.5,.08,.35],[1.55,.96,-hd+.3],0x2b2b2b,'Gas rings');block(1.2,-hd+.3,1.5,.6,.95);
 at([.55,1.3,.55],[2.3,.65,-hd+.32],0xe8ebe6,'Fridge');block(2.3,-hd+.32,.6,.6,1.3);
 at([.24,.18,.01],[2.3,1.05,-hd+.6],0xf4ecd6,'Note on the fridge');
 anchor([2.3,1.05,-hd+.95],'Read the note on the fridge',()=>action('read','On the fridge',"No bath in this house: Umi-no-yu after the shop shuts, ¥300 with a towel. Rubbish: burnables Tuesday and Friday, cans on Wednesday to the box at Sakura. Rent is paid to Front-Row, ¥18,000 a month."));
 // A little table for two with its stools.
 at([.6,.04,.5],[1.25,.7,-.2],0x8a6a46,'Kitchen table');for(const [dx,dz] of [[-.25,-.2],[.25,-.2],[-.25,.2],[.25,.2]])at([.04,.7,.04],[1.25+dx,.35,-.2+dz],0x6b4a32);block(1.25,-.2,.6,.5,.75);
 for(const [x,z] of [[.6,-.2],[1.25,.5]])at([.32,.45,.32],[x,.22,z],0x6b4a32,'Stool');
 // Against the east wall: the radio bench.
 {at([.45,.75,.8],[hw-.24,.375,-.25],0x6b4a32,'Workbench');at([.3,.18,.22],[hw-.26,.84,-.4],0x485c58,'Radio in pieces');at([.06,.06,.3],[hw-.3,.78,-.05],0xc4a35a,'Soldering iron');block(hw-.24,-.25,.45,.8,.8);
  anchor([hw-.7,1.0,-.25],'Look at the radio bench',()=>action('inspect','Chin’s radio bench','A short-wave set with its back off, a soldering iron on a tin lid, and a tide table for Kitahama with the good surf days ringed in red.'));}

 // The two futons, laid out for the night; each person's place and hat peg.
 const names=household?.residents||[site.homeOwner],homeLayouts={};
 // Personal work stays on the shelf/bench; cups and yesterday's kitchen washing
 // use existing tops, without adding an obstacle to this compact floor plan.
 const members=names.map(name=>RESIDENTS.find(p=>p.name===name)||{name});
 const details=householdDetails(members),detailBox=(size,[x,y,z],colour,name)=>at(size,[x,y,z],colour,name);
 for(const detail of details.slice(0,1))addPersonalObject(detailBox,{x:hw-.2,y:.752,z:-.575,detail,scale:.45});
 addTeaSetting(detailBox,{x:1.06,y:.728,z:-.18,people:names.length});
 addFamilyPhoto(box,{x:X(-1.35),z:-hd+.065,members});
 at([.20,.14,.20],[1.55,1.074,-hd+.3],0xb57655,'Cooking pot');
 for(let i=0;i<2;i++)at([.075,.04,.075],[.82+i*.12,.976,-hd+.3],0xd9e5df,'Washed rice bowl');
 anchor([hw-.6,1,-.25],'Inspect the household’s everyday things',()=>action('inspect',site.title,details.map(d=>d.owner+' · '+d.text).join('\n')));
 names.forEach((name,i)=>{
  const style=residentPersonality(name),p=RESIDENTS.find(r=>r.name===name),fx=i?-.8:-2.1,zc=-hd+1.1;
  const bed=kit.futon(X(fx),zc,style.top,name+' futon');
  const hatHook={position:[X(1.3+i*.2),1.6+i*.12,hd-.05],yaw:Math.PI};addHatPeg(box,hatHook);
  homeLayouts[name]={bounds:{minX:-hw+.05,maxX:hw-.05,minZ:-hd+.05,maxZ:hd-.05},spawn:[X(doorX),0,hd-.5],exit:[X(doorX),1.1,hd-.04],
   ...bed,table:i?[X(1.25),0,.5]:[X(.6),0,-.2],tableStand:i?[X(1.05),0,.85]:[X(.6),0,.55],tableSeatHeight:.445,tableSeatFront:.16,tableSeatYaw:i?0:-s*Math.PI/2,door:[X(doorX),0,hd-.45],hatHook};
  anchor([X(fx),.6,zc+.9],'Inspect '+name+'’s belongings',()=>action('inspect',name+' at home',(p?.role||'')+'. '+name+' keeps a futon, a hook by the door and a stool at the table.'));
 });
 registerHomeSeats({parent:group,reg,action,layouts:homeLayouts});
 return {bounds:{minX:-hw+.05,maxX:hw-.05,minZ:-hd+.05,maxZ:hd-.05},spawn:[X(doorX),0,hd-.5],exit:[X(doorX),1.1,hd-.04],yaw:0,home:true,homeLayouts};
}
