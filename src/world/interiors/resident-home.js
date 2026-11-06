import {registerHomeSeats} from './home-seats.js';
import {addIkeaFurniture} from './ikea-furniture.js';
import {buildTatamiHome} from './tatami-home.js';
import {homeExitLabel} from './home-exit-label.js';
import {TATAMI_HOME_OWNER} from './tatami-home-layout.js';
import {householdFor} from '../../people/households.js';
import {RESIDENTS} from '../../people/residents.js';
import * as THREE from '../../../vendor/three.module.js';
import {HOME_LAYOUT,SHARED_HOME_LAYOUT,sleepHours} from '../../people/home-life.js';
import {residentPersonality} from '../../people/resident-personalities.js';
import {householdDetails,addPersonalObject,addFamilyPhoto,addTeaSetting} from './home-details.js';
const time=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');

// Closed slabs cast their exterior entry face, rather than the interior receiver
// face selected by the renderer's default back-face shadow pass. Keep this choice
// local to the shell: furniture can share a material supplied by the box helper.
function residentShell(mesh,name='Resident shell wall'){
 const owned=material=>{const clone=material.clone();clone.shadowSide=THREE.FrontSide;return clone;};
 mesh.material=Array.isArray(mesh.material)?mesh.material.map(owned):owned(mesh.material);
 mesh.name=name;return mesh;
}

// A shared Kitahama room has its own coordinates. The supplied Yuri apartment's
// routines cannot be reused here: its table and Thuan's bed are outside this shell.
export function sharedHomeLayouts(names){
 // A third person (batch 7b: Chin with Thuan and Thao) sleeps between the two, and stands at the foot of the bed.
 return Object.fromEntries(names.map((name,i)=>{const side=i===0?-1:i===1?1:0,x=side*2.1;
  return [name,{...SHARED_HOME_LAYOUT,bed:[x,.58,-.3],bedside:side?[side*.95,0,-.4]:[0,0,.5],table:[side*.72,0,2.15],
   cover:{position:[x,.64,-.9],width:1.1,length:1.3,axis:'z'},hatHook:{position:[side*1.4,1.6,3.33],yaw:Math.PI}}];
 }));
}
import {YARD_HOMES} from '../yard-homes-layout.js';
import {buildYardHomeInterior} from './yard-home.js';
import {buildTetsuoFlat} from './tetsuo-flat.js';
import {buildFamilyHome} from './family-home.js';
import {buildVyFamilyHome} from './vy-room.js';
export function buildResidentHome({site,profile,room,box,reg,collider,action,exit}){
 if(site?.plot==='kitahama-1')return buildVyFamilyHome({room,reg,collider,action,exit});
 if(profile.name===TATAMI_HOME_OWNER)return buildTatamiHome({site,profile,room,box,reg,collider,action,exit});
 // Shared houses are drawn to the house you walked into (docs/BUILDING-AUDIT.md): the
 // Front-Row yard staff houses, and Thuan and Thao's house in Kitahama, which is built
 // like its neighbours.
 // 2 Front-Row Yard is Tetsuo's flat, built from the creator's diorama (tetsuo-flat.js).
 if(site?.id==='resident-home-kenji'&&profile.name==='Tetsuo')return buildTetsuoFlat({site,profile,room,reg,action,collider});
 if(site&&YARD_HOMES[site.id])return buildYardHomeInterior({site,room,reg,action,collider});
 if(site?.plot&&site.homeOwners?.length>1)return buildFamilyHome({room,reg,action,collider,title:site.title,kind:site.houseKind||'concrete',residents:site.homeOwners});
 if(householdFor(profile.name)?.residents.length>1)return buildSharedHome({site,profile,room,box,reg,collider,action,exit});
 const style=residentPersonality(profile.name),colour=new THREE.Color(style.top),hours=sleepHours(profile),details=householdDetails([{name:profile.name,role:profile.role}]);
 const part=(size,pos,c,solid=false)=>{const m=box(size,pos,c,room,false);if(solid)collider(pos[0],pos[2],size[0],size[2],pos[1]+size[1]/2);return m;};
 const detailBox=(size,pos,c,name)=>{const m=part(size,pos,c);m.name=name;return m;};
 part([6,.12,6],[0,-.06,0],0xc1b18a);
 for(const x of [-3,3])residentShell(part([.12,2.8,6],[x,1.4,0],0xe2d7bd));
 residentShell(part([6,2.8,.12],[0,1.4,-3],0xe2d7bd));residentShell(part([3.8,2.8,.12],[-1.1,1.4,3],0xe2d7bd));residentShell(part([.8,2.8,.12],[2.6,1.4,3],0xe2d7bd));
 // The exterior sun grazes this thin slab; receiving its own shadow creates
 // diagonal acne on the interior face. Keep the slab casting onto the room.
 residentShell(part([6,.08,6],[0,2.84,0],0xf1ead9),'Ceiling').receiveShadow=false;
 for(const x of [-2,-1,0,1,2])part([.025,.012,6],[x,.006,0],0x8d9270);
 const bed=part([1.2,.18,2.15],[-1.75,.36,-.3],0xe9dfc8,true);bed.name=profile.name+' futon';
 part([1.1,.055,1.62],[-1.75,.48,-.02],colour);part([.92,.16,.48],[-1.75,.57,-.82],0xf3e8d2);
 part([1.1,.16,.65],[1.1,.66,-1.9],0x94714f,true);part([.65,.1,.6],[1.1,.36,-1.2],colour);
 part([.9,1.7,.5],[2.4,.85,-2.45],0x846749,true);
 for(let i=0;i<5;i++)part([.1,.3,.24],[2.1+i*.13,1.3,-2.15],i%2?colour:0xc7b77a);
 const radio=part([.45,.25,.23],[1.1,.86,-1.9],0x485c58);reg(radio,'Inspect '+profile.name+'’s belongings',()=>action('inspect',profile.name+' at home',profile.role+'. '+(profile.personality||'A familiar room with a place for everything.')+' '+details[0].text+' A radio sits beside tomorrow’s notes.'),true);
 const note=new THREE.Object3D();note.position.set(2,1,1.9);room.add(note);reg(note,'Read daily routine',()=>action('read',profile.name+'’s routine','Usually sleeps at '+time(hours.sleep)+' and wakes at '+time(hours.wake)+'. Work, meals and walks continue outside. You may stay here while the day passes.'),true);
 addIkeaFurniture({room,box,collider,reg,action,kind:'lack',x:2.35,z:.65});
 addIkeaFurniture({room,box,collider,reg,action,kind:'ivar',x:-1.7,z:-2.55});
 for(const detail of details){addPersonalObject(detailBox,{x:.7,y:.745,z:-1.9,detail,scale:.7});}
 addTeaSetting(detailBox,{x:2.3,y:.45,z:.6});
 addFamilyPhoto(detailBox,{x:.15,z:-2.93,members:[profile]});
 addEntryDetails(part,HOME_LAYOUT.exit[0]);
 hatPeg(part,HOME_LAYOUT.hatHook);
 registerHomeSeats({parent:room,reg,action,layouts:{[profile.name]:HOME_LAYOUT}});
 const door=new THREE.Object3D();door.position.set(...HOME_LAYOUT.exit);room.add(door);reg(door,homeExitLabel(site,profile),exit,true);
 room.add(new THREE.HemisphereLight(0xffe4b4,0x887867,1.6));
 return {...HOME_LAYOUT,home:true,homeLayouts:{[profile.name]:HOME_LAYOUT}};
}

function buildSharedHome({site,profile,room,box,reg,collider,action,exit}){
 // This archived generic room hosts the street-engine adults. Vy has her own authored
 // bedroom in the live Kitahama house above and is animated by the neighbours engine.
 const household=householdFor(profile.name),roomResidents=household.residents.filter(name=>RESIDENTS.some(p=>p.name===name)),layout=SHARED_HOME_LAYOUT,homeLayouts=sharedHomeLayouts(roomResidents);
 const part=(size,pos,color,solid=false)=>{const mesh=box(size,pos,color,room,false);if(solid)collider(pos[0],pos[2],size[0],size[2],pos[1]+size[1]/2);return mesh;};
 const detailBox=(size,pos,c,name)=>{const m=part(size,pos,c);m.name=name;return m;};
 part([7,.12,6.8],[0,-.06,0],0xbbaa87);
 for(const side of [-1,1]){residentShell(part([.12,2.8,6.8],[side*3.5,1.4,0],0xe3d8bd));residentShell(part([2.85,2.8,.12],[side*2.075,1.4,3.4],0xe3d8bd));}
 residentShell(part([7,2.8,.12],[0,1.4,-3.4],0xe3d8bd));
 residentShell(part([7,.08,6.8],[0,2.84,0],0xf1ead9),'Ceiling').receiveShadow=false;
 part([1.9,.12,.7],[0,.68,1.35],0x98724e,true);
 roomResidents.forEach((name,i)=>{
  const side=i?-1:1,style=residentPersonality(name),p=RESIDENTS.find(p=>p.name===name),routine=homeLayouts[name],hours=sleepHours(p),x=routine.bed[0];
  const bed=part([1.2,.18,2.15],[x,.36,-1.05],0xe9dfc8,true);bed.name=name+' futon';
  part([1.1,.055,1.62],[x,.48,-.77],style.top);part([.92,.16,.48],[x,.57,-1.57],0xf3e8d2);
  part([.6,.1,.6],[routine.table[0],.36,routine.table[2]],style.top);
  part([.9,1.7,.5],[-side*2.85,.85,-2.95],0x876b50,true);
  if(name==='Thuan'){const wardrobe=new THREE.Object3D();wardrobe.position.set(-side*2.85,1,-2.3);room.add(wardrobe);reg(wardrobe,'Look at Thuan’s wardrobe',()=>action('inspect','Thuan’s wardrobe','Her everyday clothes, the navy harbour academy sailor set she wears to evening classes, and the outfit she wears on Rainflower Lane.'),true);}
  for(let b=0;b<4;b++)part([.11,.26,.22],[-side*2.85-.2+b*.13,1.14,-2.64],b%2?style.top:0xc6b78d);
  const notes=new THREE.Object3D();notes.position.set(routine.table[0],.8,1.35);notes.name=name+' personal notes';room.add(notes);
  const detail=householdDetails([{name,role:p.role}])[0];addPersonalObject(detailBox,{x:routine.table[0],y:.745,z:1.3,detail,scale:.7});
  hatPeg(part,routine.hatHook);
  reg(notes,'Inspect '+name+'’s belongings',()=>action('inspect',name+' at home',p.role+'. '+detail.text+' '+name+' keeps a separate futon, wardrobe and place at the table. Usually sleeps at '+time(hours.sleep)+' and wakes at '+time(hours.wake)+'.'),true);
 });
 addIkeaFurniture({room,box,collider,reg,action,kind:'lack',x:2.95,z:.55});
 addIkeaFurniture({room,box,collider,reg,action,kind:'ivar',x:-2.85,z:.75});
 addKitchen(part,detailBox,reg,action,roomResidents);
 addTeaSetting(detailBox,{x:0,y:.745,z:1.3,people:roomResidents.length});
 addFamilyPhoto(detailBox,{x:0,z:-3.33,members:roomResidents.map(name=>({name}))});
 addEntryDetails(part,0,3.15);
 registerHomeSeats({parent:room,reg,action,layouts:homeLayouts});
 const door=new THREE.Object3D();door.position.set(...layout.exit);room.add(door);reg(door,homeExitLabel(site,profile),exit,true);
 room.add(new THREE.HemisphereLight(0xffe4b4,0x887867,1.6));return {...layout,home:true,homeLayouts};
}

function addKitchen(part,box,reg,action,names){
 part([1.8,.85,.6],[0,.425,-2.98],0xd6c9ab,true);box([1.84,.04,.64],[0,.87,-2.98],0x999e97,'Shared kitchenette');
 box([.54,.018,.37],[-.45,.898,-2.98],0x586c70,'Kitchen sink');
 box([.045,.26,.045],[-.45,1.02,-3.15],0xbac6c5,'Kitchen tap');
 box([.44,.025,.38],[.5,.902,-2.98],0x3e4c48,'Cooking hob');
 box([.23,.16,.22],[.5,.995,-2.98],0xbb6c4f,'Cooking pot');
 const rice=box([.23,.23,.24],[0,1.005,-2.98],0xe7dcc2,'Rice cooker');
 reg(rice,'Inspect the shared kitchen',()=>action('inspect','A kitchen used every day','A pot on the hob, a rice cooker and washed bowls. '+names.join(' and ')+' keep the shopping list beside the cooker and take turns washing up.'),true);
}

function addEntryDetails(part,doorX,z=2.68){
 for(const [i,x] of [doorX-.9,doorX+.9].entries())for(const dx of [-.09,.09]){
  const shoe=part([.13,.07,.26],[x+dx,.037,z],i?0x745648:0x4d645b);shoe.name='Everyday shoes';
 }
 const mat=part([.76,.018,.42],[doorX,.012,z-.15],0x9ba780);mat.name='Worn entrance mat';
}

/** A wooden peg on the wall where a hat hangs when its owner is home. */
function hatPeg(part,hook){
 if(!hook)return;
 const [x,y,z]=hook.position,out=[Math.sin(hook.yaw||0),Math.cos(hook.yaw||0)];
 part([.1,.1,.03],[x+out[0]*.005,y+.12,z+out[1]*.005],0x6d5238).rotation.y=hook.yaw||0;
 part([.035,.035,.14],[x+out[0]*.07,y+.1,z+out[1]*.07],0x6d5238).rotation.y=hook.yaw||0;
}
