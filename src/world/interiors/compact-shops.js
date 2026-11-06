import {WORKSHOP_OBJECTS,nativeObject} from '../../studio/workshop-contract.js';
import {WORKSHOP_PUBLICATION} from './workshop-publication.js';
import {addPublishedWorkshopProps} from './workshop-props.js';
import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import {addBookshopDetail} from './bookshop-detail.js';
import {DOCK_WORKSHOP_ROOM} from '../dock-workshop-layout.js';
import {buildWorkshopMachine} from '../../workshop/machine.js';
import {buildMotorBench,MOTOR_BENCH,MOTOR_NOTE} from '../../workshop/motor-bench.js';
import {buildTetsuoBench} from '../../workshop/tetsuo-bench.js';
import {buildChinWall} from '../../workshop/chin-wall.js';
import * as THREE from '../../../vendor/three.module.js';
import {createMaterials} from '../../render/materials.js';
import {buildShopDoor} from '../shop-door.js';
import {signPlate} from '../sign-plate.js';
import {BOOKSHOP_WORKSHOP_ROOM} from '../bookshop-workshop-layout.js';


// Each business owns its room layout and furniture.
// Furniture and approaches are authored together; there is no generic room shell.
export function buildCompactShop({site,room,reg:register,collider:addCollider,action,exit,studioLayout=undefined}){
 let workshop=null,tetsuo=null,chin=null,motor=null;const owned=[],workshopObjects=new Map();
 const nativeLayout=site.industrialWorkshop?(studioLayout===undefined?WORKSHOP_PUBLICATION.layout:studioLayout):null;
 let active=null;
 const collider=(...args)=>{if(active)active.solids.push(args);else addCollider(...args);};
 const reg=(...args)=>{if(active)active.prompts.push(args);else register(...args);};
 function begin(id){if(!site.industrialWorkshop)return;active={id,before:new Set(room.children),solids:[],prompts:[]};}
 function finish(){if(!active)return;const a=active;active=null;const def=WORKSHOP_OBJECTS[a.id],placement=nativeLayout?nativeLayout.objects.find(o=>o.id===a.id):nativeObject(a.id),g=new THREE.Group();g.name='world-room:'+a.id;g.userData.roomObject=a.id;g.userData.worldRoomObject=a.id;
  // Components retain the original builders and live controls. Only their parent placement changes.
  for(const child of [...room.children])if(!a.before.has(child)){g.add(child);child.position.sub(new THREE.Vector3(...def.position));}room.add(g);g.position.fromArray(placement?.position||def.position);g.rotation.y=THREE.MathUtils.degToRad(placement?.rotation[1]||0);g.visible=!!placement?.visible;
  const cs=[],c=Math.cos(g.rotation.y),s=Math.sin(g.rotation.y);for(const [x,z,w,d,height,minY] of a.solids){const dx=x-def.position[0],dz=z-def.position[2],solid={x:g.position.x+dx*c+dz*s,z:g.position.z-dx*s+dz*c,w:Math.abs(c)*w+Math.abs(s)*d,d:Math.abs(s)*w+Math.abs(c)*d,height:height+g.position.y,minY:(minY??0)+g.position.y,owner:a.id};cs.push(solid);if(g.visible)addCollider(solid.x,solid.z,solid.w,solid.d,solid.height,solid.minY);}
  if(g.visible)for(const args of a.prompts)register(...args);workshopObjects.set(a.id,{group:g,colliders:g.visible?cs:[]});
 }
 begin('workshop-shell');
 const layout=site.bookshop?BOOKSHOP_WORKSHOP_ROOM:site.industrialWorkshop?DOCK_WORKSHOP_ROOM:null;if(!layout)return null;
 const {width:w,depth:d,doorX}=layout,hw=w/2,hd=d/2;
 room.name=site.title+' interior';
 const surfaces=createMaterials(),wood=surfaces.material('timber',0x92734f),dark=surfaces.material('timber',0x574837),plaster=surfaces.material('plaster',0xd8cbb1),floor=surfaces.material(site.industrialWorkshop?'concrete':'timber',site.industrialWorkshop?0x92958c:0x9b8464);
 const palette=new Map();const colour=c=>{if(!palette.has(c))palette.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.82}));return palette.get(c);};
 function box(name,size,pos,mat,solid=false){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),typeof mat==='number'?colour(mat):mat);m.name=name;m.position.set(...pos);m.receiveShadow=true;room.add(m);if(solid)collider(pos[0],pos[2],size[0]+.03,size[2]+.03,pos[1]+size[1]/2);return m;}
 function anchor(pos,label,kind,title,text,worker){const o=new THREE.Object3D();o.name=label;o.position.set(...pos);room.add(o);if(worker)o.userData.workers=[worker];reg(o,label,kind==='exit'?exit:()=>action(kind,title,text),true);return o;}
 function board(title,sub,pos,width=1.5){const c=document.createElement('canvas');c.width=512;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#e6d7b7';ctx.fillRect(0,0,512,160);ctx.fillStyle='#3d4942';ctx.textAlign='center';ctx.font='bold 36px serif';ctx.fillText(title,256,65,480);ctx.font='21px sans-serif';ctx.fillText(sub,256,120,480);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  // A painted plate with a back (sign-plate.js): the bookshop's hangs over the aisle and is seen from behind.
  const m=signPlate(new THREE.MeshBasicMaterial({map:t}),width,.44,{name:'Sign: '+title});m.position.set(...pos);room.add(m);}
 function bench(name,x,z,width,depth=.48,top=.9){box(name,[width,.10,depth],[x,top-.05,z],wood,true);for(const dx of [-width/2+.08,width/2-.08])box(name+' leg',[.07,top-.10,depth-.10],[x+dx,(top-.10)/2,z],dark);}
 function chair(x,z,yaw=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=yaw;room.add(g);const part=(size,pos)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),wood);m.position.set(...pos);g.add(m);};part([.43,.08,.43],[0,FURNITURE_HEIGHTS.seat-.04,0]);part([.43,.45,.06],[0,FURNITURE_HEIGHTS.seat+.22,.19]);for(const dx of [-.16,.16])for(const dz of [-.16,.16])part([.045,FURNITURE_HEIGHTS.seat-.08,.045],[dx,(FURNITURE_HEIGHTS.seat-.08)/2,dz]);collider(x,z,.48,.48,.96);return g;}
 box(site.industrialWorkshop?'Workshop concrete floor':'Fitted timber floor',[w+.16,.12,d+.16],[0,-.06,0],floor);
 box('Plaster rear wall',[w+.16,2.75,.12],[0,1.375,-hd-.06],plaster);
 for(const x of [-hw-.06,hw+.06])box('Side wall',[.12,2.75,d+.24],[x,1.375,0],plaster);
 for(const [a,b] of [[-hw,doorX-.52],[doorX+.52,hw]])if(b>a)box('Street wall',[b-a,2.75,.12],[(a+b)/2,1.375,hd+.06],plaster);
 box('Door lintel',[1.04,.22,.12],[doorX,2.64,hd+.06],dark);
 box('Timber ceiling',[w+.16,.12,d+.16],[0,2.81,0],plaster);
 for(const z of [-hd,hd])box('Wall skirting',[w,.14,.08],[0,.1,z],dark);
 for(const x of [-hw,hw])box('Wall skirting',[.08,.14,d],[x,.1,0],dark);
 const door=buildShopDoor(room,{name:site.id+'-inside-door',width:1.0});door.group.position.set(doorX,0,hd-.02);door.group.rotation.y=Math.PI;
 anchor(layout.exit,'Exit to '+(site.bookshop?'Main Street':'the street'),'exit');
 // A small illuminated shop window gives the front wall a clear street orientation.
 const windowX=doorX<0?Math.min(hw-.65,doorX+2):Math.max(-hw+.65,doorX-1.8);
 box('Window surround',[1.08,1.22,.06],[windowX,1.75,hd-.02],dark);
 const glass=new THREE.MeshStandardMaterial({color:0x73887e,emissive:0xc7ae76,emissiveIntensity:.2,roughness:.5});
 box('Street window',[.96,1.1,.025],[windowX,1.75,hd-.065],glass);
 for(const dx of [-.46,0,.46])box('Window joinery',[.04,1.1,.04],[windowX+dx,1.75,hd-.09],dark);
 const lamp=new THREE.MeshStandardMaterial({color:0xf3e4bd,emissive:0xffd69b,emissiveIntensity:.8});
 // The workshop has twin-tube fittings of its own (tetsuo-bench.js).
 if(!site.industrialWorkshop)for(const x of [-w*.25,w*.25])box('Ceiling strip',[.14,.055,Math.min(1.1,d*.5)],[x,2.7,0],lamp);
 room.add(new THREE.HemisphereLight(0xffead0,0x777465,1.35));const light=new THREE.PointLight(0xffdba4,1.35,8,2);light.position.set(0,2.35,0);room.add(light);

 finish();
 if(site.bookshop){
  addBookshopDetail({room,collider,reg,action});
  // The walls are books to the ceiling (bookshop-detail.js); the floor keeps the
  // entrance and central aisle open between the counter, the desks and the reading table.
  bench('Bookselling counter',-2.55,2.12,1.65,.55,FURNITURE_HEIGHTS.serviceCounter);
  box('Brass till',[.25,.19,.22],[-3.05,FURNITURE_HEIGHTS.serviceCounter+.095,2.12],0x53685d);
  // Unstaffed since 22 October 2026: Nhung is the island doctor, Sakura sells the books and the stationery, and what is
  // left here (the reading copies, the paper, the last second-hand books) goes by the honesty tin (無人販売).
  anchor([-2.55,1,2.12],'Read the note on the counter','read','A note on the counter','“The books and the stationery are at Sakura Shōten now. The reading copies stay: please put each one back in its place. The paper is ¥80, the paperbacks ¥300; the tin is by the till. Surgery is 9–12 and 2–5 at the town hall. Nhung”','Nhung');
  const newspaper=anchor([-1.85,1,2.12],'Buy newspaper · ¥80','buy','Evening newspaper',{cost:80,item:'Evening newspaper',text:'Nhung’s small town paper, a page of harbour news and corrections, printed at the back bench in the evening. You leave ¥80 in the tin by the till.'});newspaper.userData.npcInteraction=false;
  bench('Newspaper and book wrapping desk',-2.55,-2.84,2.45,.5,FURNITURE_HEIGHTS.table);
  box('Wrapping paper roll',[.65,.11,.22],[-2.7,FURNITURE_HEIGHTS.table+.055,-2.84],0xc8b493);
  box('Evening newspaper proofs',[.48,.025,.36],[-2.0,FURNITURE_HEIGHTS.table+.0125,-2.84],0xf1ead8);
  anchor([-1.65,1,-2.55],'Read the editor’s proofs','read','Editor’s desk','Corrections and harbour reports for the next edition, in Nhung’s hand.','Nhung');
  bench('New arrivals display',1.62,-2.84,4.0,.5,FURNITURE_HEIGHTS.table);
  for(let i=0;i<12;i++)box('New and second-hand books',[.22,.11,.32],[.1+(i%6)*.53,FURNITURE_HEIGHTS.table+.055+Math.floor(i/6)*.13,-2.84],[0x814c3e,0x4d6668,0xa49267][i%3]);
  const usedBook=anchor([-1.4,1,2.12],'Buy a second-hand paperback · ¥300','buy','Second-hand paperback',{cost:300,item:'Second-hand paperback',text:'One of the last of the shop’s second-hand paperbacks, wrapped in brown paper from the roll; ¥300 in the tin by the till.'});usedBook.userData.npcInteraction=false;
  bench('Reading table',2.15,.4,1.45,.8,FURNITURE_HEIGHTS.table);
  anchor([1.4,1,-2.45],'Look at the last of the display','read','What is left on the display','A sea adventure, an island history and a well-loved poetry collection, each with one of Nhung’s slips in it. New books come in through Sakura now: ask Thuan at the till.','Nhung');
  anchor([2.15,1,.4],'Browse the local history books','read','Local history reading table','Reading copies stay in the shop. Please return each book to its marked place.');
  const seat=chair(-3.7,2.85,Math.PI/2);seat.userData.seat={position:[-3.7,0,2.85],stand:[-3.02,0,2.95],surfaceY:FURNITURE_HEIGHTS.seat,eyeY:1.12,yaw:Math.PI/2,pitch:0,front:.22};seat.userData.npcInteraction=false;reg(seat,'Sit in the reading chair',()=>action('seat','Reading chair','A quiet chair beside the window. Read for a while, with the harbour outside.'),true);
  // The name board hangs from the ceiling over the aisle, facing the door: the back wall is books.
  board('FRONT-ROW BOOKS','THE TOWN PAPER · READING COPIES',[0,2.42,-1.4],2.6);
 }else if(site.industrialWorkshop){
  // Chin's half of the back wall (fabrication and the Form 3D printer); Tetsuo's electrical bench is the other half.
  begin('fabrication-bench');
  bench('Chin’s fabrication bench',-2.05,-hd+.32,3.95,.54);
  workshop=buildWorkshopMachine({room,x:-1.24,z:-hd+.32});
  anchor([-1.24,1.25,-hd+.58],'Use Form 3D printer','workshop','Form 3D printer',null,'Chin');
  finish();begin('electrical-bench');
  tetsuo=buildTetsuoBench({room,collider,reg,action});
  anchor([-.1,1.0,-hd+.6],'Complete the airport radio service','island-repair');
  anchor([2.92,1.15,-3.05],'Tune workshop radio','radio','Workshop radio','Tetsuo has restored the tuner. Harbour weather and late-night music come through clearly.','Tetsuo');
  anchor([3.95,1.2,-2.66],'Read the electrical safety checklist','read','Workshop safety checklist','Isolate the bench at its switch, lock it and hang the tag, prove it dead with the tester (live, dead, live), and record the test before anything goes back into service.');
  finish();begin('pattern-table');
  bench('Pattern and calculation table',3.2,.3,.7,2.6);
  finish();begin('chin-wall');
  box('Tool board',[1.8,.38,.06],[-1.02,2.05,-hd+.08],dark);
  for(let i=0;i<5;i++){box('Hanging hand tool',[.04,.31,.07],[-1.65+i*.29,2.02,-hd+.13],0x8b9994);box('Tool grip',[.07,.11,.07],[-1.65+i*.29,2.14,-hd+.13],0x7b4e38);}
  // Chin's west wall (chin-wall.js): his tool board, parts, the outboard on its stand, the job board and the poster of
  // Jonsson, the chief's kneeling-mechanic sculpture that stood on this floor until 20 October 2026 (the owner: "Maybe the
  // Johnson mechanical statue should go; maybe he can be used for a poster in the workshop"). The floor is clear again.
  chin=buildChinWall({room,collider,reg,action});
  finish();begin('motor-bench');
  // The site's IEC 90L pump motor (/motor-90l/) on Tetsuo's test bench, rating plate to the door.
  motor=buildMotorBench({room,collider});
  anchor([MOTOR_BENCH.x,1.05,MOTOR_BENCH.z+.18],'Look at the pump motor','motor-bench','Pump motor on the test bench',MOTOR_NOTE,'Tetsuo');
  finish();begin('star-port');
  box('Star Port cabinet',[.60,1.48,.47],[-1.65,.74,hd-.29],0x4b414d,true);box('Star Port screen',[.46,.43,.028],[-1.65,1.09,hd-.545],0x344f57);
  const arcade=anchor([-1.65,1,hd-.57],'Play Star Port','arcade','Star Port');arcade.userData.npcInteraction=false;
  finish();begin('workshop-sign');
  board('CHIN & TETSUO REPAIRS','ELECTRICAL · INSTRUMENTS · FORM 3D',[0,2.52,-hd+.08],3.65);
 }
 finish();
 if(site.industrialWorkshop&&studioLayout===undefined)addPublishedWorkshopProps({room,collider:addCollider});
 return {...layout,workshopObjects,ready:motor?.ready||Promise.resolve(true),compact:true,workshop,tetsuo,chin,owned,ownedUpdate:dt=>{owned.forEach(actor=>actor.update(dt));tetsuo?.update(dt);},dispose:()=>{owned.forEach(actor=>actor.dispose());tetsuo?.dispose();chin?.dispose();}};
}
