import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import {SAKURA_STAIR_PASSAGE,buildSakuraStairHead} from './sakura-stairs.js';
import {buildSakuraOfficeDressing} from './sakura-office-dressing.js';
import {buildTradePosters,buildSakuraHallStock} from './sakura-trade-posters.js';

/**
 * Sakura's upper floor, in the office's own frame: x along the frontage (+x the harbour side, south), z from the back
 * wall (-5.5, over Nishi-machi) to the front (+4.55, Main Street, east); heights above the office floor (4.01 m over
 * the shop). The shell (thuan-flat.js) is seen from the street and stays as it is; only the plan inside it changes.
 *
 * The owner, 19 October 2026: "The Sakura office is way too big and empty. I want maybe two windows you can look out
 * from; now the whole island looks broken from the Sakura office. It should have like a bedroom or rest room upstairs
 * too." So the 12.8 × 10 m open floor becomes a small shop's upstairs: a 5.65 × 4.05 m office with its kitchenette and
 * the two outlooks, a 4½-mat staff rest room (休憩室) behind a sliding door, the hall at the stair head, and two
 * closed stores. Sizes are from the New Yokosuka study (docs/research/new-yokosuka-lessons.md), measured, not copied.
 */
export const SAKURA_UPSTAIRS=Object.freeze({
 shell:Object.freeze({minX:-6.4,maxX:6.4,minZ:-5.5,maxZ:4.55,ceiling:2.8}),
 office:Object.freeze({minX:.75,maxX:6.4,minZ:.5,maxZ:4.55,sign:'事務所',
  why:'Thuan’s office: orders, deliveries, the till ledger and the monthly accounts, with the kitchenette AGENTS.md asks for. 5.65 × 4.05 m (23 m², about 14 jō) instead of the whole 128 m² floor: one desk, one filing cabinet, the safe, the calendar, a corner to make tea.'}),
 restRoom:Object.freeze({minX:-2.05,maxX:.75,minZ:1.7,maxZ:4.55,ceiling:2.4,mats:4.5,sign:'休憩室',
  why:'A staff rest room (休憩室・仮眠室), not a home: a 4½-mat tatami room (2.7 × 2.7 m) where whoever keeps the shop can lie down between the shop and the late boat, or stay the night if the ferry is ever stopped. Thuan lives on Kitano-jima (the 08:30 boat over, the 22:00 home) and Nhung keeps the shop on Sunday (it shuts on Saturday). The town does not stop for weather yet (typhoons.js), so no canonical day sleeps here; the player may lie down for a minute. Its ceiling is 2.4 m, the New Yokosuka konbini’s 2.41 m class, below the shell’s 2.8 m.'}),
 hall:Object.freeze({minX:-2.05,maxX:.75,minZ:-5.5,maxZ:1.7,
  why:'The landing at the stair head: shoes off at the step (the upper floor is a slipper floor, the rest room is tatami), the shoe cabinet, the staff lockers, the fire door to the escape, and the doors to the office and both stores.'}),
 stores:Object.freeze([
  Object.freeze({id:'decorations',minX:-6.4,maxX:-2.05,minZ:-3.36,maxZ:4.55,sign:'倉庫',door:Object.freeze({wall:'x',at:-2.05,from:-1.6,to:-.7}),
   why:'Since Mrs Kinjō retired Sakura supplies the town’s flowers and decorations (merchandising.js): the festival lanterns, the New Year pine frames, vases, ribbon and wrapping for the bouquets sold at the door, and the shop’s spare shelf parts and sign stands.'}),
  Object.freeze({id:'archive',minX:.75,maxX:6.4,minZ:-5.5,maxZ:.5,sign:'書庫',door:Object.freeze({wall:'x',at:.75,from:-2.3,to:-1.4}),
   why:'Seven years of account books and supplier slips, which a Japanese business must keep, and the shop’s paper supplies by the case: till rolls, carrier bags, price labels.'}),
 ]),
 // Exactly two windows look out, both the office’s; the rest of the shell’s glazing is lined inside or screened.
 windows:Object.freeze({
  town:Object.freeze({wall:'front',x0:1.6,x1:4.8,sill:.9,head:2.35,label:'Look over Main Street',
   why:'Two sashes of the front band (the shell’s mullions at 1.6, 3.2 and 4.8), over Main Street: the bus stop, the terminal and the shops across the road. You stand at it.'}),
  harbour:Object.freeze({wall:'side',z0:1.5,z1:4.45,sill:.9,head:2.35,label:'Look over the harbour',
   why:'Two sashes of the side glazing (mullions at 1.5, 2.925 and 4.45), over the ferry berth. The desk is under it and the seated view frames the berth: Thuan watches for the deliveries and for the 22:00 boat she goes home on.'}),
 }),
 doors:Object.freeze({
  office:Object.freeze({wall:'x',at:.75,from:.65,to:1.55,head:2.1,kind:'hinged',why:'New Yokosuka’s hinged door, 0.90 × 2.10 m, from the hall; it stands open against the office wall in working hours.'}),
  restRoom:Object.freeze({wall:'x',at:.75,from:2,to:3.77,open:2.885,head:2.1,kind:'sliding pair',why:'The door between the office and the rest room: a sliding pair 1.77 × 2.10 m (New Yokosuka’s), one leaf slid over the other, so 0.885 m is open.'}),
  fire:Object.freeze({wall:'back',x0:-.45,x1:.45,head:2,why:'The fire door onto the escape down the back (okinawa/old-town.js SAKURA_BACK.fireEscape: 0.9 × 2.0 m at the same place).'}),
 }),
 oshiire:Object.freeze({minX:-2.95,maxX:-2.05,minZ:2.6,maxZ:4.4,shelf:.8,head:2.1,
  why:'The futon cupboard (押入れ), one ken wide (1.8 m) and 0.9 m deep with its middle shelf, set into the store’s corner: two sliding fronts 0.9 × 2.1 m, one slid open on the folded futon.'}),
 items:Object.freeze([
  {id:'desk',name:'Office desk',at:[5.97,0,2.2],size:[.7,.74,1.2],room:'office',who:'Thuan',why:'A steel office desk with a drawer pedestal under the harbour window: the ledger, the phone and the calculator, the berth in view.'},
  {id:'chair',name:'Desk chair',at:[5.15,0,2.2],size:[.48,.9,.48],room:'office',who:'Thuan',why:'Faces the harbour window (yaw −90°), set so the seated eye looks at the berthed ferry through the middle of the near sash, not into the mullion.'},
  {id:'ledger',name:'Till ledger',at:[5.95,.74,2.05],size:[.42,.03,.3],room:'office',who:'Thuan',why:'The shop’s daily takings carried up from the till each night, and the supplier orders.'},
  {id:'phone',name:'Desk telephone',at:[6.05,.74,2.6],size:[.32,.09,.24],room:'office',who:'Thuan',why:'A fax telephone: the orders go to the Quay Warehouse depot and the mainland wholesalers by fax, the drink as well since Higa Liquor closed, the confirmations come back on the roll; the handset for the suppliers.',period:'A yellowed beige 1990s plain-paper fax with its handset on the side (New Yokosuka’s telephone is 0.24 × 0.16 m; the fax is the bigger body).'},
  {id:'filing',name:'Filing cabinet',at:[5.13,0,4.18],size:[.47,1.32,.62],room:'office',who:'Thuan',why:'Four drawers: this year’s invoices, the staff papers, the depot’s delivery notes, the bouquet orders.'},
  {id:'safe',name:'Office safe',at:[6.05,0,4.2],size:[.5,.62,.5],room:'office',who:'Thuan',why:'The change float and the day’s takings until the bank opens, in the corner away from the window.'},
  {id:'calendar',name:'Wall calendar',at:[6.05,1.55,4.49],size:[.32,.46,.01],room:'office',who:'Thuan',why:'Delivery days and the boat times, on the wall above the safe where the desk can see it.'},
  {id:'shelf',name:'Ledger shelf',at:[1.18,0,4.32],size:[.75,1.8,.34],room:'office',who:'Thuan',why:'This year’s binders; the older years are in the archive across the hall.'},
  {id:'kitchenette',name:'Kitchenette cupboards',at:[2.9,0,.85],size:[1.8,.85,.6],room:'office',who:'staff',why:'Sink, worktop and the wall cupboard with cups and tea, on the office’s back wall clear of both doors.'},
  {id:'pot',name:'Electric thermo pot',at:[3.45,.85,.85],size:[.2,.3,.2],room:'office',who:'staff',why:'Hot water all day for tea and cup noodles, for Thuan and whoever comes up from the shop; its gauge shows when to fill it at the sink.',period:'An electric thermo pot (電気ポット) with a push-top dispenser and a water gauge.'},
  {id:'fridge',name:'Office fridge',at:[4.18,0,.85],size:[.55,1.2,.6],room:'office',who:'staff',why:'The staff’s lunch boxes and milk, never shop stock.'},
  {id:'getabako',name:'Shoe cabinet',at:[.52,0,-3.95],size:[.35,.9,.9],room:'hall',who:'staff',why:'Shoes off at the stair head; outdoor shoes in, slippers out.'},
  {id:'lockers',name:'Staff lockers',at:[.445,0,-.5],size:[.5,1.8,.9],room:'hall',who:'Thuan and Nhung',why:'Two lockers: a bag, a coat and the Sakura apron each.'},
  {id:'extinguisher',name:'Fire extinguisher',at:[.62,0,-5.2],size:[.16,.5,.16],room:'hall',who:'everyone',why:'Beside the fire door, as the fire service asks at the spring inspection.'},
  {id:'table',name:'Low table',at:[-.35,0,2.5],size:[.75,FURNITURE_HEIGHTS.lowTable,.75],room:'restRoom',who:'staff',why:'A round chabudai for a cup of tea and a bowl of noodles on a long day.'},
  {id:'chest',name:'Six-drawer chest',at:[-1.4,0,2.05],size:[1.1,1.11,.57],room:'restRoom',who:'staff',why:'New Yokosuka’s chest, 1.10 × 1.11 × 0.57 m with six drawers: towels, a spare shirt, the torch and batteries.'},
  {id:'radio',name:'Cassette radio',at:[-1.4,1.11,2.05],size:[.66,.24,.17],room:'restRoom',who:'staff',why:'New Yokosuka’s 0.66 × 0.24 × 0.17 m radio-cassette, for the weather and the ferry notices on Aoba Radio.'},
  {id:'clock',name:'Wall clock',at:[-1.4,1.95,1.76],size:[.26,.26,.04],room:'restRoom',who:'staff',why:'A 0.26 m wall clock, so a nap does not miss the boat.'},
  {id:'fan',name:'Electric fan',at:[.35,0,4.1],size:[.36,.95,.36],room:'restRoom',who:'staff',why:'Okinawa’s summer: the room has no air conditioner of its own.'},
  {id:'futon',name:'Folded futon',at:[-2.5,.8,3.9],size:[.7,.45,1],room:'restRoom',who:'staff',why:'One shikibuton, a quilt and a pillow, folded on the cupboard’s middle shelf.'},
 ]),
});

export const SAKURA_OFFICE=Object.freeze({width:12.8,depth:11,floor:4.01,front:4.55,harbourX:6.4,
 desk:SAKURA_UPSTAIRS.items[0].at,deskStand:[4.45,0,2.2],
 townWindow:[(SAKURA_UPSTAIRS.windows.town.x0+SAKURA_UPSTAIRS.windows.town.x1)/2,0,4.55],
 harbourWindow:[6.4,0,(SAKURA_UPSTAIRS.windows.harbour.z0+SAKURA_UPSTAIRS.windows.harbour.z1)/2]});

/** The office's two outlooks as street-view portals, in the office frame: centre, the facing turn, and the opening. */
export function sakuraOfficePortals(){
 const {town:T,harbour:S}=SAKURA_UPSTAIRS.windows;
 return [
  {id:'town',local:[(T.x0+T.x1)/2,0,4.55],interiorYaw:0,span:{minX:-(T.x1-T.x0)/2,maxX:(T.x1-T.x0)/2,minY:T.sill,maxY:T.head}},
  {id:'harbour',local:[6.4,0,(S.z0+S.z1)/2],interiorYaw:Math.PI/2,span:{minX:-(S.z1-S.z0)/2,maxX:(S.z1-S.z0)/2,minY:S.sill,maxY:S.head}},
 ];
}

const canPaint=()=>typeof document!=='undefined'&&typeof document.createElement==='function';
function paint(w,h,draw){
 if(!canPaint())return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
const JP='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';

/** Clear glazing uses the existing street renderer: both outlooks show the live town, with no backdrop texture. */
/**
 * The office storey as its own room (sakura-stairs.js: the stair between it and the shop is a passage into darkness). The
 * hall's stair head opens on the stairwell, dark below its rail; `downstairs` is the way down it, `evacuate` the fire
 * door's (the only door out of the office besides the stair: it opens from inside only). `merge` false keeps every piece
 * a mesh of its own, for the flashing-surface scan.
 */
export function buildSakuraOfficeRoom({room,reg,action,collider=()=>{},downstairs=()=>{},evacuate=null,merge=true}){
 const U=SAKURA_UPSTAIRS,O=SAKURA_OFFICE,hw=O.width/2,back=U.shell.minZ,front=U.shell.maxZ,H=U.shell.ceiling,T=.1,mats=new Map();
 const mat=(c,extra)=>{const key=c+JSON.stringify(extra||{});if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.83,...extra}));return mats.get(key);};
 const box=(size,pos,c,name,solid=false)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),typeof c==='number'?mat(c):c);m.position.set(...pos);m.name=name||'';room.add(m);if(solid)collider(pos[0],pos[2],size[0],size[2],pos[1]+size[1]/2);return m;};
 const cyl=(r,h,pos,c,name,segments=16)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),typeof c==='number'?mat(c):c);m.position.set(...pos);m.name=name;room.add(m);return m;};
 const anchor=(at,label,fn)=>{const a=new THREE.Object3D();a.position.set(...at);a.userData.npcInteraction=false;room.add(a);reg(a,label,fn,true);return a;};
 const PLASTER=0xece1ca,SAND=0xd9c8a2,TIMBER=0x8a6a48,DARK=0x5e4630,STEEL=0x7e8a84;
 // A sign plate in Japanese, its face turned by yaw (0 faces +z).
 const sign=(text,at,yaw,{w=.36,h=.12,ground='#efe6d0',ink='#2c2620',name='Door sign'}={})=>{
  const tex=paint(256,Math.round(256*h/w),(ctx,cw,ch)=>{ctx.fillStyle=ground;ctx.fillRect(0,0,cw,ch);ctx.fillStyle=ink;ctx.font=`bold ${Math.round(ch*.62)}px ${JP}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,cw/2,ch/2+2);});
  // A dark wooden backing (merged with the room) and the lettered face in front of it.
  const back=box([w+.02,h+.02,.012],at,DARK,'Door sign backing');back.rotation.y=yaw;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),tex?new THREE.MeshStandardMaterial({map:tex,roughness:.7}):mat(0xefe6d0));
  m.position.set(...at).add(new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)).multiplyScalar(.012));m.rotation.y=yaw;m.name=name+' '+text;m.userData.text=text;room.add(m);return m;
 };

 // ---- floor, ceiling and the shell's inner faces
 // The floor round the stairwell's hole (x -5.65..-2.05 behind the decorations store) and the top of its flight (from x
 // -1.8 at the hall's back): four boards that meet edge to edge, none over another (the top landing used to be a second
 // floor laid in the hall's, and flashed on the phone).
 // West of the stairwell the floor and the rear wall run under its wall (x -5.73..-5.65), which goes up to the ceiling.
 for(const [x0,x1,z0,z1] of [[-hw,hw,-3.36,front],[-hw,-5.73,back,-3.36],[-2.05,hw,-4.96,-3.36],[-1.8,hw,back,-4.96]])box([x1-x0,.12,z1-z0],[(x0+x1)/2,-.06,(z0+z1)/2],0x947354,'Office timber floor');
 box([.12,H,front-back],[-hw,H/2,(front+back)/2],PLASTER,'Office north wall');
 box([O.width,.12,front-back],[0,H+.06,(front+back)/2],0xf1eadb,'Office ceiling');
 // The back wall: the stairwell opens behind it (sakura-stairs.js buildSakuraStairHead) under a lintel; the fire door is a door.
 const F=U.doors.fire;
 for(const [x0,x1] of [[-hw,-5.73],[-.6,F.x0],[F.x1,hw]])box([x1-x0,H,.12],[(x0+x1)/2,H/2,back],PLASTER,'Office rear wall',true);
 box([F.x1-F.x0,H-F.head,.12],[0,(H+F.head)/2,back],PLASTER,'Fire door lintel');
 // The opening's head at 2.4 m, a beam's depth under the ceiling: the lens behind him at the stair head passes under it.
 box([5.05,H-2.4,.12],[(-5.65-.6)/2,(H+2.4)/2,back],PLASTER,'Stairwell lintel');
 buildSakuraStairHead({room,box,collider,reg,go:downstairs});
 box([F.x1-F.x0-.02,F.head-.02,.05],[0,F.head/2,back+.085],STEEL,'Fire door leaf',true);
 box([.6,.04,.06],[0,1.02,back+.14],0xc9c9c0,'Fire door push bar');
 box([.36,.13,.06],[0,F.head+.18,back+.1],new THREE.MeshBasicMaterial({color:0x2f9e5a,toneMapped:false}),'非常口 exit sign').userData.text='非常口';
 // Front band: sill and head right across, as outside; between them, the office's town window is open, the rest
 // room's stretch is screened by shoji, and the rest is lined.
 box([O.width,.9,.12],[0,.45,front],PLASTER,'Front sill wall');box([O.width,H-2.35,.12],[0,(H+2.35)/2,front],PLASTER,'Front window head');
 const TW=U.windows.town,R=U.restRoom;
 for(const [x0,x1] of [[-hw,R.minX],[U.office.minX,TW.x0],[TW.x1,hw]])box([x1-x0,2.35-.9,.12],[(x0+x1)/2,1.625,front],PLASTER,'Front lining');
 for(const x of [TW.x0,(TW.x0+TW.x1)/2,TW.x1])box([.055,1.45,.11],[x,1.625,front],0x8f9894,'Town window mullion');
 box([TW.x1-TW.x0,.12,.14],[(TW.x0+TW.x1)/2,2.3,front-.08],0xc2b69a,'Town blind');
 // Harbour side: full wall but for the office's two sashes.
 const SW=U.windows.harbour;
 for(const [z0,z1] of [[back,SW.z0],[SW.z1,front+.06]])box([.12,H,z1-z0],[hw,H/2,(z0+z1)/2],PLASTER,'Harbour side wall');
 box([.12,.9,SW.z1-SW.z0],[hw,.45,(SW.z0+SW.z1)/2],PLASTER,'Harbour window sill wall');box([.12,H-2.35,SW.z1-SW.z0],[hw,(H+2.35)/2,(SW.z0+SW.z1)/2],PLASTER,'Harbour window head');
 for(const z of [SW.z0,(SW.z0+SW.z1)/2,SW.z1])box([.11,1.45,.055],[hw,1.625,z],0x8f9894,'Harbour window mullion');
 box([.14,.12,SW.z1-SW.z0],[hw-.08,2.3,(SW.z0+SW.z1)/2],0xc2b69a,'Harbour blind');

 // ---- partitions: full-height walls with their door openings, solid for walking
 const wallX=(x,z0,z1,gaps,c=PLASTER,name='Partition')=>{
  let at=z0;for(const g of [...gaps].sort((a,b)=>a.from-b.from)){if(g.from>at)box([T,H,g.from-at],[x,H/2,(at+g.from)/2],c,name,true);box([T,H-g.head,g.to-g.from],[x,(H+g.head)/2,(g.from+g.to)/2],c,name+' lintel');at=g.to;}
  if(z1>at)box([T,H,z1-at],[x,H/2,(at+z1)/2],c,name,true);
 };
 const wallZ=(z,x0,x1,c=PLASTER,name='Partition')=>box([x1-x0,H,T],[(x0+x1)/2,H/2,z],c,name,true);
 const A=U.stores[0],B=U.stores[1],D=U.doors,K=U.oshiire,OF=U.office;
 // The store's long wall starts at the face of its end wall (A.minZ + T/2), not inside it: their faces met in one plane.
 wallX(A.door.at,A.minZ+T/2,front,[{...A.door,head:2.1},{from:K.minZ,to:K.maxZ,head:K.head}],PLASTER,'Store wall');
 wallX(B.door.at,back,front,[{...B.door,head:2.1},D.office,D.restRoom],PLASTER,'Office wall');
 wallZ(A.minZ,-hw,A.door.at+T/2,PLASTER,'Store wall');wallZ(R.minZ,R.minX,R.maxX,PLASTER,'Rest room wall');wallZ(OF.minZ,OF.minX,hw,PLASTER,'Office back wall');
 // Closed store doors (hinged 0.90 × 2.10 m), each with its plate and a look inside.
 for(const s of U.stores){
  const z=(s.door.from+s.door.to)/2,face=s.door.at>0?-1:1,x=s.door.at+face*.06;
  box([.045,2.08,s.door.to-s.door.from-.02],[s.door.at,1.04,z],0xb49c78,'Store door leaf',true);
  box([.04,.035,.12],[x,1.0,s.door.to-.12],0xc9c9c0,'Store door handle');
  sign(s.sign,[x,2.25,z],face>0?Math.PI/2:-Math.PI/2);
 }
 anchor([A.door.at+.3,1.1,(A.door.from+A.door.to)/2],'Look in the decorations store',()=>action('read','Sakura decorations store','The festival lanterns, the New Year pine frames, vases, ribbon and wrapping for the bouquets sold at the door, and the shop’s spare shelf parts. Sakura has supplied the town’s flowers and decorations since Mrs Kinjō retired.'));
 anchor([B.door.at-.3,1.1,(B.door.from+B.door.to)/2],'Look in the archive',()=>action('read','Sakura archive','Seven years of account books and supplier slips, which the shop must keep, and paper supplies by the case: till rolls, carrier bags, price labels.'));

 // ---- the hall at the stair head
 const stairHead=[-1.8,-.6];
 box([stairHead[1]-stairHead[0],.012,.6],[(stairHead[0]+stairHead[1])/2,.006,back+.35],0x6e6a62,'Shoe step');
 for(const [x,c] of [[-1.45,0x5d7a8c],[-1.0,0x8c6a5d]])for(const dx of [-.06,.06])box([.1,.035,.26],[x+dx,.018,back+.85],c,'Slippers');
 for(const it of U.items.filter(i=>i.room==='hall')){
  const [x,y,z]=it.at,[w,h,d]=it.size;
  if(it.id==='extinguisher'){cyl(.08,.46,[x,.23,z],0xc23a2e,'Fire extinguisher');cyl(.03,.06,[x,.49,z],0x2b2b2b,'Fire extinguisher valve');collider(x,z,w,d,h);continue;}
  box([w,h,d],[x,y+h/2,z],it.id==='lockers'?0x8e9a95:0x9b7b57,it.name,true);
  if(it.id==='lockers')for(const dz of [-.225,.225]){box([.012,1.7,.42],[x-w/2-.006,.9,z+dz],0x7f8a85,'Locker door');box([.02,.12,.02],[x-w/2-.02,1.05,z+dz-.15],0xc9c9c0,'Locker handle');}
  else for(const dz of [-.225,.225])box([.012,.84,.43],[x-w/2-.006,.45,z+dz],0xa98a63,'Shoe cabinet door');
 }
 anchor([.25,1,-3.95],'Look at the shoe cabinet',()=>action('read','Shoe cabinet','Shoes come off at the top of the stair: the floor up here is in slippers and the rest room is tatami. Thuan’s and Nhung’s shoes in the cabinet, the slippers on the step.'));
 // The fire door opens from inside only: out onto the escape's landing and down its caged ladder to the yard.
 if(evacuate)anchor([0,1.1,back+.35],'Evacuate by the fire escape',evacuate);
 else anchor([0,1.1,back+.35],'Look at the fire door',()=>action('inspect','Fire door','The fire door onto the escape ladder down the back of the shop. It is for a fire, not for coming and going: it opens only from inside and rings a bell in the shop when it does. The way out is down the stair and through the shop.'));

 // ---- the office
 const item=id=>U.items.find(i=>i.id===id);
 {const d=item('desk'),[x,,z]=d.at,[w,h,l]=d.size;
  box([w,.04,l],[x,h-.02,z],0x8f8a7d,'Office desk top');box([w-.05,h-.04,.45],[x,(h-.04)/2,z+l/2-.25],0x8e9a95,'Office desk pedestal');
  for(const dz of [-l/2+.05])for(const dx of [-w/2+.05,w/2-.05])box([.04,h-.04,.04],[x+dx,(h-.04)/2,z+dz],0x6f7773,'Office desk leg');
  box([w-.1,.25,.02],[x+.05,h-.2,z-l/2+.05],0x8e9a95,'Office desk modesty panel');
  collider(x,z,w,l,h);}
 {const c=item('chair'),[x,,z]=c.at;
  box([.46,.07,.46],[x,FURNITURE_HEIGHTS.seat-.035,z],0x3f4d47,'Desk chair seat');box([.06,.48,.42],[x-.22,FURNITURE_HEIGHTS.seat+.28,z],0x3f4d47,'Desk chair back');
  cyl(.03,FURNITURE_HEIGHTS.seat-.1,[x,(FURNITURE_HEIGHTS.seat-.1)/2+.06,z],0x6f7773,'Desk chair column',8);cyl(.26,.05,[x,.035,z],0x2f3532,'Desk chair base',5);}
 const chair=anchor([item('chair').at[0],1,item('chair').at[2]],'Sit at the harbour desk',()=>action('seat','Sakura office','The ferry berth lies beyond the harbour window: the deliveries come off there, and the 22:00 boat home leaves from it.'));
 chair.userData.seat={position:[...item('chair').at],stand:[...SAKURA_OFFICE.deskStand],surfaceY:FURNITURE_HEIGHTS.seat,eyeY:1.12,yaw:-Math.PI/2,pitch:0,front:.23};
 {const l=item('ledger');box(l.size,[l.at[0],l.at[1]+.015,l.at[2]],0xd7ceb4,'Till ledger');box([.01,.032,.3],[l.at[0],l.at[1]+.016,l.at[2]],0x7a5c3e,'Till ledger spine');
  // The fax telephone: its body, the handset on its cradle along the left, the paper roll's slanted tray at the back.
  const p=item('phone'),[px,py,pz]=p.at,[pw,ph,pd]=p.size,FAX=0xd8cdb0;box(p.size,[px,py+ph/2,pz],FAX,'Desk telephone');
  box([.05,.04,.2],[px-pw/2+.035,py+ph+.02,pz],FAX,'Desk telephone handset');box([.03,.012,.12],[px+.03,py+ph+.006,pz-.03],0x8f877a,'Fax keypad');
  {const tray=box([.2,.012,.1],[px+.05,py+ph+.03,pz+pd/2-.04],0xc9bfa4,'Fax paper tray');tray.rotation.x=-.5;}
  box([.12,.02,.17],[5.85,.75,1.75],0x40444a,'Desk calculator');}
 anchor([5.85,1,2.05],'Read the till ledger',()=>action('read','Sakura till ledger','The day’s takings carried up from the till each night, the supplier orders, the depot’s deliveries and the monthly accounts. The downstairs office keeps the till float and the daily shop paperwork.'));
 {const f=item('filing'),[x,,z]=f.at,[w,h,d]=f.size;box([w,h,d],[x,h/2,z],0x8e9a95,'Filing cabinet',true);
  for(let i=0;i<4;i++){box([w-.04,.29,.01],[x,.17+i*.32,z-d/2-.005],0x9aa6a1,'Filing cabinet drawer');box([.12,.025,.03],[x,.26+i*.32,z-d/2-.02],0xc9c9c0,'Filing cabinet handle');}}
 {const s=item('safe'),[x,,z]=s.at,[w,h,d]=s.size;box([w,h,d],[x,h/2,z],0x3e4a45,'Office safe',true);cyl(.05,.03,[x+.08,.36,z-d/2-.015],0xb8b39c,'Safe dial').rotation.x=Math.PI/2;box([.03,.12,.03],[x-.12,.36,z-d/2-.02],0xb8b39c,'Safe handle');}
 {const c=item('calendar'),[x,y,z]=c.at,[w,h]=c.size;
  const tex=paint(160,230,(ctx,cw,ch)=>{ctx.fillStyle='#f6f1e4';ctx.fillRect(0,0,cw,ch);ctx.fillStyle='#4f7f8f';ctx.fillRect(10,10,cw-20,92);ctx.fillStyle='#2c2620';ctx.font=`bold 22px ${JP}`;ctx.textAlign='center';ctx.fillText('平成9年 1997',cw/2,128);
   ctx.strokeStyle='#8a8070';for(let r=0;r<6;r++)for(let k=0;k<7;k++){ctx.strokeRect(12+k*19.4,142+r*14,19.4,14);}ctx.fillStyle='#b33';ctx.fillRect(12,142,19.4,84);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),tex?new THREE.MeshStandardMaterial({map:tex,roughness:.9}):mat(0xf6f1e4));m.position.set(x,y,z-.008);m.rotation.y=Math.PI;m.name='Wall calendar';room.add(m);}
 {const s=item('shelf'),[x,,z]=s.at,[w,h,d]=s.size;box([w,.03,d],[x,h,z],TIMBER,'Ledger shelf');box([w,.03,d],[x,.05,z],TIMBER,'Ledger shelf');
  for(const dx of [-w/2+.015,w/2-.015])box([.03,h,d],[x+dx,h/2,z],TIMBER,'Ledger shelf side');for(const y of [.62,1.2])box([w-.03,.025,d],[x,y,z],TIMBER,'Ledger shelf board');
  collider(x,z,w,d,h);
  // The binders are the dressing's (sakura-office-dressing.js): blue, labelled, one leaning, a flat pile.
 }
 {const k=item('kitchenette'),[x,,z]=k.at,[w,h,d]=k.size;
  box([w,h-.04,d],[x,(h-.04)/2,z],0xd3c8ae,'Kitchenette cupboards',true);box([w+.04,.04,d+.03],[x,h-.02,z+.01],0xb2bab5,'Kitchenette worktop');
  box([.5,.02,.38],[x-.45,h+.005,z+.02],0x737f7c,'Kitchenette sink');box([.04,.25,.04],[x-.45,h+.12,z-.22],0xb4beb8,'Kitchenette tap');
  box([w,.6,.34],[x,1.85,OF.minZ+T/2+.17],0xd3c8ae,'Kitchenette wall cupboard');
  const t=item('pot');cyl(.1,t.size[1]-.05,[t.at[0],t.at[1]+(t.size[1]-.05)/2,t.at[2]],0xe8e6dc,'Electric thermo pot',16);cyl(.085,.05,[t.at[0],t.at[1]+t.size[1]-.025,t.at[2]],0xb9c4c8,'Thermo pot lid',16);
  box([.05,.03,.06],[t.at[0],t.at[1]+t.size[1]-.035,t.at[2]+.1],0xb9c4c8,'Thermo pot spout');box([.025,.13,.012],[t.at[0],t.at[1]+.12,t.at[2]+.1+.004],0x8fc6e0,'Thermo pot gauge');
  for(const [dx,c] of [[.25,0x8c6a5d],[.36,0xe8e4d8]])cyl(.04,.09,[t.at[0]+dx,t.at[1]+.045,t.at[2]+.05],c,'Tea cup',10);
  const f=item('fridge');box(f.size,[f.at[0],f.size[1]/2,f.at[2]],0xe1dfd0,'Office fridge',true);box([.02,.25,.03],[f.at[0]+.2,.95,f.at[2]+.31],0xb4beb8,'Office fridge handle');}
 anchor([3.45,1,1.3],'Make office tea',()=>action('read','Sakura kitchenette','Fill the kettle at the sink. Cups and tea are in the wall cupboard; the staff’s lunch boxes are in the little fridge.'));
 anchor([(TW.x0+TW.x1)/2,1.2,front-.3],TW.label,()=>action('inspect','Main Street outlook','Main Street from above the shop: the bus stop, the terminal and the shops across the road, and Sakura’s own canopy under the window.'));
 anchor([hw-.35,1.2,SW.z1-.75],SW.label,()=>action('inspect','Harbour outlook','The ferry berth and the strait, from the desk’s window. Thuan watches for the depot’s van and for the boat home.'));
 // The office door, open against the office's back wall; the plate faces the hall.
 box([.88,2.05,.04],[D.office.at+.06+.44,1.025,D.office.from+.07],0xb49c78,'Office door leaf',true);
 sign(U.office.sign,[D.office.at-.06,2.25,(D.office.from+D.office.to)/2],-Math.PI/2);
 // ---- the sliding pair between the office and the rest room: one leaf over the other, the plate on the office side
 {const S=D.restRoom,leaf=(S.to-S.from)/2;
  for(const [dx,c] of [[.03,0xa8865f],[-.03,0xb49c78]]){box([.03,S.head-.02,leaf],[S.at+dx,(S.head-.02)/2,S.from+leaf/2],c,'Rest room sliding door');box([.006,.1,.04],[S.at+dx+Math.sign(dx)*.016,1,S.from+leaf-.08],DARK,'Sliding door pull');}
  collider(S.at,S.from+leaf/2,.1,leaf,S.head);
  box([.04,.012,S.to-S.from],[S.at,.006,(S.from+S.to)/2],DARK,'Sliding door track');
  sign(R.sign,[S.at+.06,2.25,(S.from+S.to)/2],Math.PI/2);}
 // Steady fluorescent fittings in the office, as before; the hall and the rest room have their own ceiling fittings.
 const tube=new THREE.MeshBasicMaterial({color:0xfff1ce,toneMapped:false});
 tube.userData.keepPhysical=true;tube.userData.keepPhysicalStrict=true;
 for(const [x,z] of [[2.4,2.5],[4.8,2.5]]){
  box([1.35,.08,.25],[x,2.64,z],0x777e79,'Office fluorescent housing');
  const light=new THREE.Mesh(new THREE.BoxGeometry(1.2,.035,.12),tube);light.position.set(x,2.59,z);light.name='Office fluorescent diffuser';room.add(light);
 }
 // New Yokosuka's ceiling fitting, 0.87 × 0.33 m, one per room and along the run.
 const fitting=(x,y,z,name)=>{box([.87,.06,.33],[x,y-.03,z],0xdedbd2,name+' fitting');const d=new THREE.Mesh(new THREE.BoxGeometry(.8,.02,.27),tube);d.position.set(x,y-.07,z);d.name=name+' diffuser';room.add(d);};
 fitting(-.65,H,-3.2,'Hall ceiling');fitting(-.65,H,-.2,'Hall ceiling');

 // ---- the rest room: 4½ mats, a 2.4 m board ceiling, shoji on the street glass, the futon cupboard
 {const x0=R.minX+T/2,z0=R.minZ+T/2,size=2.7,matTop=.02;
  const tatami=mat(0xc9c08a),edge=mat(0x3d4a3a);
  // The pinwheel: four full mats (1.8 × 0.9 m) round a half mat, as a 4½-mat room is laid.
  for(const [a,b,c,d] of [[0,1.8,0,.9],[1.8,2.7,0,1.8],[.9,2.7,1.8,2.7],[0,.9,.9,2.7],[.9,1.8,.9,1.8]]){
   const w=b-a-.008,l=d-c-.008,x=x0+(a+b)/2,z=z0+(c+d)/2;box([w,matTop,l],[x,matTop/2,z],tatami,'Tatami mat');
   // The edge cloth stands 4 mm proud of the mat and 3 mm inside its sides and ends: never in the mat's planes.
   if(b-a!==d-c){const long=b-a>d-c;for(const s of [-1,1])box(long?[w-.006,matTop+.008,.035]:[.035,matTop+.008,l-.006],long?[x,(matTop+.008)/2,z+s*(l/2-.0205)]:[x+s*(w/2-.0205),(matTop+.008)/2,z],edge,'Tatami edge');}
  }
  box([R.maxX-R.minX,.03,R.maxZ-R.minZ],[(R.minX+R.maxX)/2,R.ceiling+.015,(R.minZ+R.maxZ)/2],0xc8ae84,'Rest room ceiling boards');
  for(let x=R.minX+.45;x<R.maxX-.1;x+=.45)box([.025,.025,R.maxZ-R.minZ],[x,R.ceiling-.0125,(R.minZ+R.maxZ)/2],DARK,'Ceiling batten');
  // Sand-plaster lining on the three inner walls, under the ceiling.
  box([R.maxX-R.minX-T,R.ceiling,.01],[(R.minX+R.maxX)/2,R.ceiling/2,R.minZ+T/2+.005],SAND,'Rest room wall lining');
  for(const [z0b,z1b,y0,y1] of [[R.minZ,K.minZ,0,R.ceiling],[K.maxZ,R.maxZ-.06,0,R.ceiling],[K.minZ,K.maxZ,K.head,R.ceiling]])box([.01,y1-y0,z1b-z0b],[R.minX+T/2+.005,(y0+y1)/2,(z0b+z1b)/2],SAND,'Rest room wall lining');
  const S=D.restRoom;for(const [z0b,z1b,y0,y1] of [[R.minZ,S.from,0,R.ceiling],[S.to,R.maxZ-.06,0,R.ceiling],[S.from,S.to,S.head,R.ceiling]])box([.01,y1-y0,z1b-z0b],[R.maxX-T/2-.005,(y0+y1)/2,(z0b+z1b)/2],SAND,'Rest room wall lining');
  box([.03,.08,R.maxZ-R.minZ-T-.006],[R.minX+T/2+.025,S.head+.044,(R.minZ+R.maxZ)/2],TIMBER,'Nageshi rail');// on the lining's face, not 5 mm into it
  // Shoji over the street glass: daylight and privacy over Main Street, no outlook.
  const paper=paint(128,256,(ctx,w,h)=>{ctx.fillStyle='#f3eedf';ctx.fillRect(0,0,w,h);ctx.fillStyle='#b8a074';for(let i=1;i<3;i++)ctx.fillRect(i*w/3-1.5,0,3,h);for(let j=1;j<6;j++)ctx.fillRect(0,j*h/6-1.5,w,3);});
  const shoji=new THREE.MeshStandardMaterial({color:paper?0xffffff:0xf3eedf,map:paper,roughness:.95,emissive:0x2a251a});
  const n=4,pw=(R.maxX-R.minX-T)/n;
  // Two tracks just inside the glass. A thin solid keeps the lens (near plane 0.15 m) from pressing through them.
  for(let i=0;i<n;i++){const x=R.minX+T/2+pw*(i+.5),z=front-.08-(i%2)*.025;
   box([pw-.01,1.43,.012],[x,1.625,z],shoji,'Shoji screen');
   for(const dx of [-pw/2+.015,pw/2-.015])box([.03,1.45,.03],[x+dx,1.625,z],0xb8a074,'Shoji frame');
   for(const y of [.915,2.335])box([pw,.03,.03],[x,y,z],0xb8a074,'Shoji frame');}
  box([R.maxX-R.minX-T-.006,.03,.08],[(R.minX+R.maxX)/2,.881,front-.1],TIMBER,'Shoji sill');
  collider((R.minX+R.maxX)/2,front-.1,R.maxX-R.minX-T,.2,R.ceiling);
  // The futon cupboard: its lining, middle shelf, two fronts (the near one slid over the far), the folded futon.
  const kw=K.maxX-K.minX,kl=K.maxZ-K.minZ,kz=(K.minZ+K.maxZ)/2;
  // Lining in courses (SK-ZF-005): the sides full height and depth, the back between them, the top on the back between
  // the sides; no board runs into another's plane.
  box([.02,K.head-.03,kl-.04],[K.minX+.01,(K.head-.03)/2,kz],SAND,'Oshiire back');
  for(const z of [K.minZ+.01,K.maxZ-.01])box([kw,K.head,.02],[(K.minX+K.maxX)/2,K.head/2,z],SAND,'Oshiire side');
  box([kw-.02,.03,kl-.04],[(K.minX+K.maxX)/2+.01,K.head-.015,kz],SAND,'Oshiire top');box([kw-.03,.03,kl-.046],[(K.minX+K.maxX)/2+.01,.05,kz],TIMBER,'Oshiire floor');
  // Floor, shelf and its edge stand clear of the back and the sides (a board flush in a wall's plane flashes).
  box([kw-.076,.03,kl-.046],[K.minX+.025+(kw-.076)/2,K.shelf-.015,kz],TIMBER,'Oshiire middle shelf');/* to the edge's back, not under it */box([.05,.06,kl-.056],[K.maxX-.026,K.shelf-.027,kz],DARK,'Oshiire shelf edge');
  collider((K.minX+K.maxX)/2+.2,kz,kw-.4,kl,K.head);
  const fronts=new THREE.MeshStandardMaterial({color:0xe9e2cf,roughness:.9});
  for(const [dx,z] of [[.035,K.minZ+kl/4],[.005,K.minZ+kl/4+.02]]){box([.02,K.head-.02,kl/2],[K.maxX+dx,(K.head-.02)/2,z],fronts,'Oshiire sliding front');box([.025,K.head-.03,.02],[K.maxX+dx,(K.head-.03)/2,z+kl/4],DARK,'Oshiire front edge');}
  const f=item('futon'),[fx,fy,fz]=f.at;
  box([.68,.17,.98],[fx,fy+.085,fz],0xf2efe6,'Folded futon');box([.66,.18,.94],[fx,fy+.26,fz],0x8fb1c9,'Folded futon quilt');box([.3,.08,.45],[fx,fy+.39,fz+.2],0xe8dcc0,'Futon pillow');
  box([.7,.32,.5],[fx,.225,fz],0xcfd6d9,'Storage case');
  anchor([K.maxX+.35,.9,(K.minZ+K.maxZ)/2+.45],'Lie down for a minute',()=>action('read','Sakura rest room','You take the futon down from the cupboard, lie on the tatami with the fan turning, and listen to the shop below. Ten minutes; then the futon goes back on its shelf. It is here for whoever keeps the shop: a rest between the shop and the late boat, or the night if the ferry ever cannot run.'));
  // The low table, the chest with its radio, the clock, the fan, two cushions, the ceiling fitting.
  {const t=item('table'),[x,,z]=t.at,r=t.size[0]/2,h=t.size[1];cyl(r,.03,[x,h-.015,z],0x7a5638,'Low table top',24);
   for(const a of [0,1,2,3]){const ax=x+Math.cos(a*Math.PI/2+Math.PI/4)*.236,az=z+Math.sin(a*Math.PI/2+Math.PI/4)*.236;box([.04,h-.03,.04],[ax,(h-.03)/2+.02,az],0x6a4a30,'Low table leg');}
   collider(x,z,t.size[0]*.9,t.size[2]*.9,h);
   // Two zabuton: one squared to the table, one skewed where somebody just got up.
   box([.48,.06,.48],[x+.62,.05,z],0x8a4b52,'Floor cushion');box([.48,.06,.48],[x+.07,.05,z-.56],0x8a4b52,'Floor cushion').rotation.y=.35;}
  {const c=item('chest'),[x,,z]=c.at,[w,h,d]=c.size;box([w,h,d],[x,h/2+.02,z],0x7a5638,'Six-drawer chest',true);
   for(const [dx,y,ww] of [[-.27,.95,.52],[.27,.95,.52],[-.27,.77,.52],[.27,.77,.52],[0,.53,1.04],[0,.25,1.04]]){box([ww,.16,.01],[x+dx,y,z+d/2+.005],0x8c6643,'Chest drawer');box([.06,.015,.02],[x+dx,y,z+d/2+.015],0xc9b27a,'Chest drawer pull');}
   const r=item('radio');box(r.size,[r.at[0],r.at[1]+.02+r.size[1]/2,r.at[2]],0x3a3d40,'Cassette radio');for(const dx of [-.22,.22])cyl(.07,.012,[r.at[0]+dx,r.at[1]+.02+r.size[1]/2,r.at[2]+r.size[2]/2+.004],0x23262a,'Radio speaker',14).rotation.x=Math.PI/2;
   const k=item('clock');const face=cyl(k.size[0]/2,.035,[k.at[0],k.at[1],R.minZ+T/2+.03],0xf4efe0,'Wall clock',20);face.rotation.x=Math.PI/2;
   for(const [len,a] of [[.08,-.5],[.11,1.2]]){const hand=box([.008,len,.004],[k.at[0]+Math.sin(a)*len/2,k.at[1]+Math.cos(a)*len/2,R.minZ+T/2+.05],0x2c2620,'Clock hand');hand.rotation.z=-a;}}
  {const n=item('fan'),[x,,z]=n.at;cyl(.17,.04,[x,.04,z],0xdcdad2,'Fan base',16);cyl(.02,.7,[x,.4,z],0xdcdad2,'Fan pole',8);
   const head=cyl(.17,.08,[x,.82,z-.02],0xb9d3d8,'Fan guard',20);head.rotation.x=Math.PI/2;collider(x,z,.36,.36,.95);}
  fitting((R.minX+R.maxX)/2,R.ceiling,(R.minZ+R.maxZ)/2+.2,'Rest room ceiling');
  cyl(.004,.45,[(R.minX+R.maxX)/2+.3,R.ceiling-.06-.225,(R.minZ+R.maxZ)/2+.2],0x2c2620,'Pull cord',4);
 }
 // What the storey holds besides its furniture: each piece with its owner and its reason (sakura-office-dressing.js).
 buildSakuraOfficeDressing({room,box,cyl,anchor,action,paint});
 // The hall's trade posters and the drink stock outside the office (SK-ST-003, sakura-trade-posters.js).
 {const red=mat(0xc23a2e);
  for(const area of ['hall','office']){const {paper,pins}=buildTradePosters(area,{parent:room,register:reg,onView:id=>action('trade-poster',id)});if(paper)room.add(paper);
   for(const g of pins){const m=new THREE.Mesh(g,red);m.name='Poster pin';room.add(m);}}
  buildSakuraHallStock({room,box,collider});}
 const fill=new THREE.HemisphereLight(0xffefd7,0x7e8071,1.2);fill.name='Sakura office steady indoor fill';room.add(fill);
 // The tubes' warm white as the shop's (sakura-interior.js): while the office shared the shop's room it was lit by both;
 // as a room of its own it keeps that light, not the town's evening blue.
 const tubes=new THREE.HemisphereLight(0xfff1ce,0xd8d2c4,1.7);tubes.name='Sakura office tube light';room.add(tubes);
 if(merge)mergeStatic(room);
 // Bounds reach the top landing's south end behind the hall (to z -6.02); the stairwell's walls and pit keep him on it.
 const arrive=SAKURA_STAIR_PASSAGE.head.arrive;
 return {bounds:{minX:-hw+.1,maxX:hw-.1,minZ:-6.02,maxZ:front-.1},spawn:[...arrive.at],yaw:arrive.yaw,office:true};
}

/**
 * The floor's fixed pieces (walls, furniture, mats) are merged: every plain painted piece into one vertex-coloured
 * mesh, each other material into one mesh of its own. Each original is left behind as a named, placed marker so the
 * plan can still be read and tested by name. Lit fittings (basic materials) and lettered faces keep their meshes.
 * Sakura's interior has a draw budget (sakura-budget.test).
 */
function mergeStatic(room){
 const plain=m=>m.isMeshStandardMaterial&&!m.map&&!m.transparent&&m.emissive.getHex()===0&&m.roughness===.83;
 const groups=new Map(),PAINT='paint';
 for(const m of [...room.children]){
  if(!m.isMesh||m.isInstancedMesh||Array.isArray(m.material)||m.material.isMeshBasicMaterial||m.material.map&&/^Door sign /.test(m.name))continue;
  const key=plain(m.material)?PAINT:m.material;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);
 }
 for(const [key,meshes] of groups){
  if(meshes.length<2)continue;
  const parts=meshes.map(m=>{m.updateMatrix();const g=m.geometry.clone().applyMatrix4(m.matrix);
   if(key===PAINT){const c=m.material.color,n=g.attributes.position.count,col=new Float32Array(n*3);for(let i=0;i<n;i++){col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(col,3));}
   return g;});
  const merged=mergeGeometries(parts,false);for(const g of parts)g.dispose();
  if(!merged)continue;
  const material=key===PAINT?new THREE.MeshStandardMaterial({vertexColors:true,roughness:.83}):key;
  const mesh=new THREE.Mesh(merged,material);mesh.name='Sakura upstairs fittings';room.add(mesh);
  for(const m of meshes){const marker=new THREE.Object3D();marker.name=m.name;marker.position.copy(m.position);marker.rotation.copy(m.rotation);marker.userData={...m.userData,merged:true};room.add(marker);room.remove(m);m.geometry.dispose();}
 }
}
