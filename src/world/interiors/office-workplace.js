import {FURNITURE_HEIGHTS,setFurnitureSurface} from '../furniture-standards.js';
import * as THREE from '../../../vendor/three.module.js';
import {createPlanKit} from './house-plan.js';

export const OFFICE_STAFF={'Harbour master':[-1.85,0,-1.20]};
// (`front`: how far ahead of the mark the seat's front edge is, seat-slots.js; the chairs' seats are .46 square, the tea stool .36)
export const OFFICE_DESK_SEAT={position:[-2.52,0,-2.02],stand:[-1.85,0,-1.20],surfaceY:FURNITURE_HEIGHTS.seat,eyeY:1.18,yaw:0,pitch:0,front:.23};
/**
 * On the island the harbour master lives here: a tatami mat and futon behind a
 * folding screen on the east side, a tea stool, his coat on a stand. home-residents.js
 * walks him to bed from these points.
 */
export const OFFICE_HOME_LAYOUT=Object.freeze({bounds:{minX:-3.37,maxX:3.37,minZ:-3.37,maxZ:3.37},spawn:[0,0,2.4],exit:[0,1.1,3.34],
 door:[0,0,2.45],table:[-.9,0,1.35],tableSeatHeight:FURNITURE_HEIGHTS.seat,tableSeatFront:.18,bedside:[1.0,0,.95],bed:[2.1,.35,1.82],
 cover:{position:[2.1,.41,1.22],width:1.1,length:1.3,axis:'z'},
 hatHook:{mode:'stand',position:[2.9,1.76,-.45],yaw:Math.PI/2}});
export function buildOfficeWorkplace({room:parent,reg,action,collider=()=>{}}){
 const room=new THREE.Group();room.name='Harbour office workplace';parent.add(room);
 const paper=new THREE.MeshStandardMaterial({color:0xe8e1c7,roughness:.92});
 const palette=new Map(),mat=c=>{if(!palette.has(c))palette.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.8}));return palette.get(c);};
 function box(name,size,pos,material){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),typeof material==='number'?mat(material):material);m.name=name;m.position.set(...pos);room.add(m);return m;}
 function label(text,pos,width=.7,height=.18,yaw=0){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#e7dfc7';ctx.fillRect(0,0,512,128);ctx.fillStyle='#33483e';ctx.textAlign='center';ctx.font='bold 46px sans-serif';ctx.fillText(text,256,82,485);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture}));mesh.name=text;mesh.position.set(...pos);mesh.rotation.y=yaw;room.add(mesh);}
 function records(pos,title,id,task){const o=new THREE.Object3D();o.name=title;o.position.set(...pos);room.add(o);o.userData.workers=['Harbour master'];o.userData.npcInteraction=!!task;if(task){o.userData.officeTask=task;if(task.seated)o.userData.seat=OFFICE_DESK_SEAT;}reg(o,title,()=>action('office-records','Harbour office records',id),true);return o;}
 // One period workstation fits the original desk; the baked duplicate PCs were
 // removed from the source asset. All desk equipment follows the shared table surface.
 box('Clerk computer base',[.50,.08,.38],[-2.52,.945,-2.90],0xb9baa5);
 box('Clerk CRT monitor',[.56,.43,.45],[-2.52,1.20,-2.89],0xc6c6b1);
 box('Clerk green screen',[.44,.31,.018],[-2.52,1.22,-2.656],0x213e35);
 for(let i=0;i<6;i++)box('Computer record line',[.29-(i%2)*.06,.009,.008],[-2.54,1.33-i*.04,-2.642],0xa2bb88);
 box('Clerk keyboard',[.52,.035,.19],[-2.52,.921,-2.40],0xb7b7a2);
 for(let row=0;row<3;row++)for(let key=0;key<9;key++)box('Keyboard key',[.042,.010,.032],[-2.72+key*.05,.944,-2.46+row*.04],0x5b665a);
 box('Harbour master nameplate base',[.67,.045,.12],[-1.48,.925,-2.43],0x66563f);
 label('HARBOUR MASTER',[-1.48,.994,-2.365],.62,.12);
 label('SEPTEMBER 1997',[-1.22,1.35,-3.298],.48,.28);
 const computer=records([-2.52,1.20,-2.55],'Open harbour spreadsheets','berth-register',{pose:'Type',activity:'typing berth records',seated:true});
 // A fitted cabinet replaces the old decorative shelf. Each binder rests on a
 // shelf and keeps its spine within the frame, clear of the working aisle.
 box('Filing cabinet back',[.06,2.05,2.22],[-3.27,1.035,.17],0x8e9587);
 for(const z of [-.91,1.25])box('Filing cabinet side',[.56,2.05,.06],[-3.02,1.035,z],0xc1c2ad);
 for(const y of [.12,.68,1.24,1.80,2.04])box('Filing cabinet shelf',[.56,.04,2.16],[-3.02,y,.17],0xc1c2ad);
 for(const [row,y] of [[0,.31],[1,.87],[2,1.43]])for(let i=0;i<7;i++){
  const z=-.65+i*.25;box('Labelled service binder',[.28,.34,.17],[-2.98,y,z],[0x526c61,0x8b6752,0x5d7184][row]);
  box('Binder spine label',[.012,.19,.095],[-2.834,y+.025,z],paper);
  box('Binder finger ring',[.014,.028,.028],[-2.825,y-.105,z],0x414d46);
 }
 label('VESSEL FILES',[-2.726,1.93,.17],1.2,.16,Math.PI/2);
 records([-2.56,1.20,.15],'Browse service binders','service-work-log',{pose:'Read',activity:'filing service certificates',heldItem:'paper'});
 for(const [i,y] of [[0,.923],[1,1.04]]){box('Document tray',[.58,.035,.35],[1.93,y,-2.65],0x556d60);for(const x of [1.65,2.25])box('Document tray side',[.025,.11,.35],[x,y+.06,-2.64],0x556d60);box('Office forms',[.48,.025,.29],[1.95,y+.032,-2.64],paper);}
 label('IN / OUT',[1.95,1.03,-2.44],.53,.10);
 box('Visitor writing pad',[.55,.028,.38],[1.15,.917,-2.62],paper);box('Desk pencil',[.22,.018,.018],[1.43,.94,-2.50],0xa77c3d);
 label('STORES & SERVICE',[.46,.97,-2.43],.87,.13);
 records([1.15,1.05,-2.40],'Open warehouse stock ledger','warehouse-stock');
 records([2.45,1.23,1.30],'Open berth record binders','berth-register');
 label('JOHANSSON HARBOUR',[0,2.48,-3.27],2.5,.28);
 buildBedNook({room,box,label,reg,action,collider,mat});
 // A staffed office -- and the harbour master's home -- has its WC: the front-west corner,
 // its door facing into the room (docs/BUILDING-AUDIT.md).
 {const kit=createPlanKit({box:(size,pos,c,name)=>box(name||'WC wall',size,pos,c),collider,height:2.9,wall:0xeee6cf,frame:0x6f8a76});
  kit.partition(-3.37,1.4,-2.2,1.4);kit.partition(-2.2,1.4,-2.2,3.37,[[1.6,2.4]]);
  kit.wetRoom(-3.33,-2.24,1.44,3.33,'Toilet',true,'x1');}
 const visitorSeat=new THREE.Object3D();visitorSeat.position.set(1.14,.7,-2.05);visitorSeat.userData.npcInteraction=false;visitorSeat.userData.seat={position:[1.14,0,-2.0],stand:[1.14,0,-1.1],surfaceY:FURNITURE_HEIGHTS.seat,eyeY:1.2,yaw:0,pitch:0,front:.23};room.add(visitorSeat);reg(visitorSeat,'Sit at the visitor desk',()=>action('seat','Visitor desk','A clean writing pad and the harbour ledgers are ready.'),true);
 for(const [id,x,z,top,yaw,sx,sz,label,front] of [['office-stool',2.91,-1.39,FURNITURE_HEIGHTS.seat,0,2.25,-.7,'Sit on the office stool',.23],['office-tea-stool',-.9,1.35,FURNITURE_HEIGHTS.seat,0,-1.65,1.35,'Sit in the tea corner',.18]]){const seat=new THREE.Object3D();seat.position.set(sx,.9,sz);seat.userData.npcInteraction=false;seat.userData.seat={id,position:[x,0,z],stand:[sx,0,sz],surfaceY:top,eyeY:top+.72,yaw,pitch:0,front};room.add(seat);reg(seat,label,()=>action('seat',label,'A quiet moment in the harbour office.'),true);}
 setFurnitureSurface(room,{from:.9,to:FURNITURE_HEIGHTS.table,props:/^(Clerk computer|Clerk CRT|Clerk green|Computer record|Clerk keyboard|Keyboard key|Harbour master nameplate|HARBOUR MASTER)/});
 return {computer,staff:OFFICE_STAFF};
}

function buildBedNook({room,box,reg,action,collider,mat}){
 // A low tatami platform with the futon, head to the screen, feet to the door.
 box('Harbour master tatami mat',[1.3,.1,2.3],[2.1,.05,.87],0xcbc38c);
 for(const z of [-.27,2.01])box('Tatami edge',[1.3,.012,.05],[2.1,.106,z],0x3f4a3a);
 const futon=box('Harbour master futon',[1.1,.12,2.15],[2.1,.16,.87],0xe9dfc8);futon.userData.bed=true;
 box('Harbour master quilt',[1.05,.05,1.5],[2.1,.245,1.2],0x2c3e5c);box('Harbour master pillow',[.8,.12,.4],[2.1,.28,.35],0xf3e8d2);
 collider(2.1,.87,1.3,2.3,.3);
 // The folding screen: four leaves, paper on timber, zig-zagging along the west side.
 const paper=new THREE.MeshStandardMaterial({color:0xf2ead2,roughness:.95});
 for(let i=0;i<4;i++){
  const leaf=box('Folding screen leaf',[.04,1.55,.5],[.38+(i%2)*.08,.8,-.35+i*.46],paper);leaf.rotation.y=(i%2?-1:1)*.2;
  box('Screen frame',[.05,.05,.5],[.38+(i%2)*.08,1.6,-.35+i*.46],0x6d5238).rotation.y=leaf.rotation.y;
 }
 collider(.42,.34,.3,1.9,1.6);
 // Beside the bed: an alarm clock, his glasses case, a tide table to fall asleep over.
 box('Alarm clock',[.14,.12,.08],[1.55,.16,-.1],0xd7263d);box('Tide table',[.2,.02,.28],[1.55,.23,1.7],0xe8e1c7);
 // Coat stand with the harbour master's jacket and cap, by the foot of the bed.
 box('Coat stand pole',[.05,1.75,.05],[2.9,.88,-.45],0x6d5238);box('Coat stand foot',[.4,.04,.4],[2.9,.02,-.45],0x6d5238);
 box('Harbour master jacket',[.42,.7,.14],[2.9,1.3,-.38],0x2c3e5c);// his cap goes on top when he is home
 collider(2.9,-.45,.4,.4,1.8);
 // A tea stool and a little table at the open side of the room.
 box('Tea stool',[.36,FURNITURE_HEIGHTS.seat,.36],[-.9,FURNITURE_HEIGHTS.seat/2,1.35],0x6d5238);
 box('Tea side table',[.55,.05,.4],[-.9,FURNITURE_HEIGHTS.table-.025,.8],0x8a6a4a);box('Tea side table leg',[.06,FURNITURE_HEIGHTS.table-.05,.06],[-.9,(FURNITURE_HEIGHTS.table-.05)/2,.8],0x6d5238);
 box('Kettle',[.18,.16,.18],[-1.0,FURNITURE_HEIGHTS.table+.075,.8],0x9aa3a0);box('Tea cup',[.07,.07,.07],[-.75,FURNITURE_HEIGHTS.table+.035,.82],0x3f7a55);
 collider(-.9,.8,.55,.4,.62);
 // The island's development projects are reviewed at the harbour master's desk, not on the doorstep.
 {const o=new THREE.Object3D();o.name='Island development projects';o.position.set(.6,1.1,-2.3);room.add(o);o.userData.npcInteraction=false;reg(o,'Review island development projects',()=>action('island-projects'),true);}
 const inspect=(pos,label,title,text)=>{const o=new THREE.Object3D();o.name=label;o.position.set(...pos);room.add(o);o.userData.npcInteraction=false;reg(o,label,()=>action('inspect',title,text),true);};
 inspect([2.1,.7,.9],'Inspect the bed behind the screen','The harbour master’s bed','A tatami mat and a futon behind the folding screen, the quilt folded square every morning at half past five. He says the harbour needs someone within earshot of the radio, and the stairs to a flat would only slow him down.');
 inspect([-.9,1.0,.8],'Inspect the tea corner','Tea corner','A kettle, one cup and a tin of jasmine tea. The stool is where he reads the evening paper before turning in at nine.');
 inspect([2.9,1.4,-.45],'Inspect the coat stand','Coat stand','The navy jacket, brushed and hung up at the end of the day, with his white cap on top when he is in. A tide table sticks out of the jacket pocket.');
}

/**
 * The room itself: a 1990s harbour co-op office, built here rather than loaded.
 *
 * It replaces a ripped game interior. The footprint, the door on the +z wall and every
 * collider in SUPPLIED_ROOM_LAYOUTS.office are unchanged, so the furniture below sits
 * where those solids already are: a row of steel desks along the back wall with low
 * partitions, the clerk's chair, a visitor chair, a stool, a locker run on the east
 * wall, the filing cabinet on the west wall (buildOfficeWorkplace) and a water cooler
 * by the door. Speckled vinyl, a pale green dado under cream plaster, fluorescent
 * tubes, an aluminium window with half-drawn blinds and a wall clock.
 */
export const OFFICE_SHELL=Object.freeze({width:6.74,depth:6.74,height:2.9});
export function buildOfficeShell(parent){
 const shell=new THREE.Group();shell.name='Harbour office shell';shell.userData.officeShell=true;parent.add(shell);
 const palette=new Map(),mat=c=>{if(!palette.has(c))palette.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.85}));return palette.get(c);};
 const box=(name,size,pos,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),typeof c==='number'?mat(c):c);m.name=name;m.position.set(...pos);m.receiveShadow=true;shell.add(m);return m;};
 const {width:W,depth:D,height:H}=OFFICE_SHELL,hw=W/2,hd=D/2;
 // Floor: grey-green speckled vinyl in 0.45 m tiles, alternate tiles a shade lighter.
 const floor=document.createElement('canvas');floor.width=floor.height=256;
 {const ctx=floor.getContext('2d');for(let y=0;y<2;y++)for(let x=0;x<2;x++){ctx.fillStyle=(x+y)%2?'#b9bfb0':'#c6cbbd';ctx.fillRect(x*128,y*128,128,128);}
  let s=7;const r=()=>(s=s*16807%2147483647)/2147483647;for(let i=0;i<900;i++){ctx.fillStyle=r()<.5?'rgba(80,90,80,.35)':'rgba(255,255,250,.5)';ctx.fillRect(r()*256,r()*256,1.5,1.5);}}
 const floorTex=new THREE.CanvasTexture(floor);floorTex.colorSpace=THREE.SRGBColorSpace;floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(W/.9,D/.9);
 floorTex.magFilter=THREE.NearestFilter;
 const floorMesh=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({map:floorTex,roughness:.9}));
 floorMesh.name='Office vinyl floor';floorMesh.rotation.x=-Math.PI/2;floorMesh.receiveShadow=true;shell.add(floorMesh);
 // Walls: dado to 0.9 m, plaster above, a skirting line and a picture rail.
 const wall=(name,w,pos,yaw)=>{
  const g=new THREE.Group();g.name=name;g.position.set(...pos);g.rotation.y=yaw;shell.add(g);
  const part=(n,size,p,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(c));m.name=n;m.position.set(...p);m.receiveShadow=true;g.add(m);return m;};
  part(name+' dado',[w,.9,.04],[0,.45,0],0x9fb8a4);part(name+' plaster',[w,H-.9,.04],[0,.9+(H-.9)/2,0],0xeee6cf);
  part(name+' skirting',[w,.08,.06],[0,.04,.01],0x5f7466);part(name+' dado rail',[w,.04,.06],[0,.9,.01],0x6f8a76);
  return g;
 };
 wall('Back wall',W,[0,0,-hd-.02],0);
 wall('West wall',D,[-hw-.02,0,0],Math.PI/2);
 wall('East wall',D,[hw+.02,0,0],-Math.PI/2);
 // Front wall with the door gap the player walks through (x -0.55..0.55).
 for(const [x,w] of [[-(hw+.55)/2,hw-.55],[(hw+.55)/2,hw-.55]])wall('Front wall',w,[x,0,hd+.02],Math.PI);
 box('Front wall over door',[1.1,H-2.1,.04],[0,2.1+(H-2.1)/2,hd+.02],0xeee6cf);
 for(const x of [-.57,.57])box('Door frame',[.06,2.12,.1],[x,1.06,hd],0x8a9092);
 box('Door head',[1.2,.06,.1],[0,2.13,hd],0x8a9092);
 box('Ceiling',[W,.04,D],[0,H+.02,0],0xf3efe2);
 // Fluorescent fittings: two twin-tube battens, glowing.
 const tube=new THREE.MeshBasicMaterial({color:0xf6fbf4});
 for(const z of [-1.2,1.1]){box('Fluorescent batten',[1.3,.06,.24],[0,H-.04,z],0xdedfd6);
  for(const dz of [-.06,.06]){const t=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,1.2,6),tube);t.name='Fluorescent tube';t.rotation.z=Math.PI/2;t.position.set(0,H-.09,z+dz);shell.add(t);}}
 // East window: aluminium slider, sea-blue glass, venetian blind half down.
 box('Window frame',[.06,1.2,1.9],[hw-.01,1.65,-1.0],0xb4b8b6);
 const glass=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.1),new THREE.MeshBasicMaterial({color:0xa9dceb}));glass.name='Window glass';glass.rotation.y=-Math.PI/2;glass.position.set(hw-.03,1.65,-1.0);shell.add(glass);
 for(let i=0;i<10;i++)box('Blind slat',[.03,.012,1.84],[hw-.07,2.2-i*.05,-1.0],0xf1eee4);
 // Wall clock and a tide chart over the desks.
 const clock=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.04,24),mat(0xf6f3ea));clock.name='Wall clock';clock.rotation.x=Math.PI/2;clock.position.set(1.2,2.3,-hd+.03);shell.add(clock);
 box('Clock hand',[.012,.12,.01],[1.2,2.34,-hd+.06],0x24302a);box('Clock hand',[.09,.012,.01],[1.24,2.3,-hd+.06],0x24302a);
 // Desks along the back wall, inside the collider (z -3.40..-2.17, 0.9 m top).
 box('Steel desk run',[W-.5,.04,1.15],[0,.88,-2.78],0xb8bdb3);
 for(const x of [-3.0,-1.5,0,1.5,3.0])box('Desk pedestal',[.42,.86,1.0],[Math.max(-hw+.25,Math.min(hw-.25,x)),.43,-2.8],0x9da49a);
 box('Desk modesty panel',[W-.6,.6,.03],[0,.55,-2.22],0x8f978c);
 // The three partition posts in the layout, with frosted screens between the desks.
 for(const x of [-3.08,0,3.08]){box('Partition post',[.08,1.7,.42],[x,.85,-2.02],0x7c8579);box('Partition screen',[.04,.7,.42],[x,1.25,-2.02],0xd6dccf);}
 // Shelves above the desk run, below the 1.72 m collider top.
 box('Desk hutch shelf',[W-.6,.03,.3],[0,1.62,-3.2],0xb8bdb3);
 for(const [i,x] of [-2.9,-2.4,-.8,-.3,.4,.9,2.6].entries())box('Ledger on hutch',[.07,.3,.24],[x,1.79,-3.2],[0x6d4f3c,0x2f4a63,0x8b2f2f,0x4e6a4a][i%4]);
 // Clerk's swivel chair (collider -2.52,-2.02), visitor chair (1.14,-2.22), stool (2.91,-1.39).
 const chair=(name,x,z,c,back=true)=>{box(name+' seat',[.46,.07,.46],[x,.46,z],c);box(name+' column',[.05,.4,.05],[x,.23,z],0x5a5f5c);box(name+' base',[.5,.04,.5],[x,.03,z],0x5a5f5c);if(back)box(name+' back',[.44,.42,.06],[x,.8,z+.22],c);};
 chair('Clerk chair',-2.52,-2.02,0x3e5a74);chair('Visitor chair',1.14,-2.0,0x7d4b3a);chair('Stool',2.91,-1.39,0x5f6d63,false);
 // Steel lockers along the east wall (collider 3.1,1.58; 0.6 x 2.72 x 1.87).
 for(let i=0;i<4;i++){const z=.35+i*.67;box('Steel locker',[.55,1.85,.64],[3.1,.925,z],0x8fa59b);box('Locker vent',[.01,.12,.3],[2.82,1.6,z],0x5c6d66);box('Locker handle',[.02,.12,.03],[2.82,1.05,z+.22],0x3b4542);}
 // Water cooler by the door (collider -1.85,3.05).
 box('Water cooler body',[.36,1.0,.36],[-1.85,.5,3.05],0xe6e3d8);
 const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.42,16),new THREE.MeshStandardMaterial({color:0x8ecfe6,roughness:.3,transparent:true,opacity:.75}));bottle.name='Water cooler bottle';bottle.position.set(-1.85,1.22,3.05);shell.add(bottle);
 parent.add(new THREE.HemisphereLight(0xf4f8ee,0x8a8a7a,1.05));
 const lamp=new THREE.PointLight(0xf2f6ee,.9,9,2);lamp.position.set(0,2.6,0);parent.add(lamp);
 setFurnitureSurface(shell,{from:.9,to:FURNITURE_HEIGHTS.table,bodies:/^(Steel desk run|Desk pedestal)$/});
 setFurnitureSurface(shell,{from:.495,to:FURNITURE_HEIGHTS.seat,bodies:/^(Clerk chair|Visitor chair|Stool) /});
 return shell;
}
