import * as THREE from '../../../vendor/three.module.js';
import {createMaterials} from '../../render/materials.js?snappy=1';
import {buildShopDoor} from '../shop-door.js';
import {batchStaticProps} from '../../render/static-props.js';
import {createHouseWalk} from '../house-walk.js';

/**
 * The Harbour Warehouse, inside (the owner, 26 November 2026, with a three.js storage bay he had made: "Also bring this
 * warehouse to the island"). His bay, at the size of the tin shed that stands on the western quay (world/warehouse.js):
 * a concrete floor with yellow aisle lines, block and tin walls with pilasters, open steel roof trusses under a ridge
 * along the quay, clerestory windows on the west wall, a roll-up door on the street wall where the shutter is outside;
 * and across the back a timber mezzanine on steel columns and beams, 2.6 m up, with a yellow guardrail, a pallet gate
 * under a chain hoist, and a steel stair with timber treads along the east wall. The stair and the mezzanine are walked
 * (house-walk.js), as Johansson's house and the police station are.
 *
 * Nothing in it is dressing. It is two stores under one roof (WAREHOUSE_STOCK): the quay's own (fishing gear, bait, rope,
 * lamp oil, the boats' timber, the fenders) with the harbour's ledger bench; and Sakura Trading's depot (commerce/
 * merchandising.js, trade-round.js: Kōji loads the round here), with the town's decorations and the festival drum kept
 * dry upstairs.
 *
 * Room frame: x across (-2.9 west .. 2.9 east), z along (-5.2 back .. 5.2 the door), y up. One light, and everything that
 * does not move in a few batches (render/static-props.js): the room is drawn on a phone.
 */
export const WAREHOUSE_ROOM=Object.freeze({bounds:{minX:-2.8,maxX:2.8,minZ:-5.1,maxZ:5.1},spawn:[0,0,3.6],yaw:0,exit:[0,1.15,4.8],staff:{'Mrs Sato':[.55,0,-3.35]}});

/** The building's inside, metres. */
export const WAREHOUSE_BAY=Object.freeze({
 halfWidth:2.9,halfLength:5.2,eave:4.2,ridge:5.6,plinth:1.0,
 /** The trusses' ties, the lamps and the sprinkler main are all above this: clear of a head on the mezzanine. */
 tie:4.9,
 mezzanine:Object.freeze({y:2.6,front:-1.8,deck:.09,gate:Object.freeze([-1.6,-.2]),rail:1.08,
  who:'Thuan, Kōji and the harbour agent',why:'What must stay dry and is fetched seldom goes up: the decorations, the festival drum, the boats’ timber. The floor under it keeps its racks.'}),
 stair:Object.freeze({x:Object.freeze([1.85,2.72]),foot:1.7,head:-1.8,steps:13,
  who:'Anyone carrying a carton',why:'Along the east wall, out of the forklift’s way, arriving beside the gate so a load and its carrier meet at the top.'}),
 shutter:Object.freeze({z:Object.freeze([2.1,5.0]),height:3.3,
  why:'On the street wall, where the shutter is outside: pallets come off the ferry’s apron and straight in.'}),
});

/** What is kept here, where, for whom and why: the storeteller and the tests read it. Positions are the piece's middle on its floor. */
export const WAREHOUSE_STOCK=Object.freeze([
 {id:'fishing-gear',what:'Net floats, shackles and spare fittings in boxes',floor:'ground',at:[-1.75,-4.7],who:'The evening boats',why:'Issued over the ledger bench; under the mezzanine because they are heavy and asked for daily.'},
 {id:'bait',what:'Hooks, bait tins and line, sorted by boat',floor:'ground',at:[.55,-4.7],who:'Kōji and the other boats',why:'Beside the gear, a step from the bench where it is signed for.'},
 {id:'ledger-bench',what:'The quay’s ledger bench: the carbon book, a vice, the tool box, a lamp',floor:'ground',at:[2.5,-3.4],who:'Sverker Reed, the harbour agent',why:'Under the mezzanine by the stair’s head: everything that leaves passes it.'},
 {id:'depot-drinks',what:'Sakura Trading’s cases: jasmine tea, bottled beer, tinned pork',floor:'ground',at:[-2.45,-.55],who:'Thuan; Kōji on the round',why:'On the west wall nearest the shutter: the heaviest stock moves the least distance.'},
 {id:'depot-dry',what:'Sakura Trading’s paper goods, batteries and washing things in totes',floor:'ground',at:[-2.45,1.8],who:'Thuan; Kōji on the round',why:'Totes keep the quay’s damp out of paper and batteries.'},
 {id:'lamp-oil',what:'Four drums on a spill pallet: lamp oil, engine oil, diesel',floor:'ground',at:[-2.15,4.2],who:'The boats; Tetsuo for the power house',why:'By the door on a pallet that holds a leak, away from the timber and the paper.'},
 {id:'incoming',what:'A pallet off the morning boat: a crate and a carton, still strapped',floor:'ground',at:[1.75,3.5],who:'Whoever it is addressed to',why:'Set down just inside the shutter until it is checked against the delivery note.'},
 {id:'empties',what:'Three empty pallets',floor:'ground',at:[2.28,-1.0],who:'The ferry',why:'Under the stair, where nothing else fits, until they go back on the boat.'},
 {id:'decorations',what:'The town’s decorations: lantern boxes, Halloween, New Year',floor:'mezzanine',at:[-1.75,-4.7],who:'Thuan, since Mrs Kinjō retired',why:'Paper and cloth, fetched four times a year: upstairs, dry.'},
 {id:'boat-timber',what:'Planks and pipe on a cantilever rack',floor:'mezzanine',at:[.75,-4.86],who:'Chin, who mends the boats',why:'Long stock lies flat and off the floor; the hoist brings a plank down through the gate.'},
 {id:'festival-drum',what:'The Obon drum under a canvas tarp',floor:'mezzanine',at:[2.2,-3.8],who:'The Youth Association',why:'One night a year on the quay; the rest of it dry under canvas.'},
 {id:'fenders',what:'Old tyres, stacked',floor:'mezzanine',at:[2.45,-4.8],who:'Any boat that needs a fender',why:'They cost nothing and save a hull; out of the way upstairs.'},
 {id:'tarpaulins',what:'Rolled tarpaulins and a net',floor:'mezzanine',at:[-2.72,-2.9],who:'The quay, in rain',why:'Stood on end against the wall so they dry.'},
 {id:'gate-pallet',what:'A pallet of cartons at the gate, and the platform cart',floor:'mezzanine',at:[-.9,-2.6],who:'Thuan',why:'Made up by the gate for the hoist: next week’s lanterns going down.'},
].map(Object.freeze));

/** `batch: false` leaves every piece its own mesh, named, for the surface scan (tests/warehouse-port.test.mjs). */
export function buildWarehouseInterior({room,reg,collider,action,exit,batch=true}){
 room.name='Harbour Warehouse interior';
 const B=WAREHOUSE_BAY,HW=B.halfWidth,HL=B.halfLength,M=B.mezzanine,S=B.stair,MY=M.y;
 const surfaces=createMaterials();
 const std=(color,roughness=.8,metalness=0,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
 const mat={
  floor:surfaces.worldMaterial('concrete',0xa9a89f,2),block:std(0xb9b5a8,.95),tin:std(0x8fa6ae,.7,.2),rib:std(0x7b929b,.7,.2),roof:std(0x6f7f85,.75,.2),
  steel:std(0x3f4a52,.55,.5),galv:std(0x9aa3a8,.45,.6),yellow:std(0xe0a81c,.5,.15),blue:std(0x2a5587,.55,.3),orange:std(0xc9591f,.55,.25),
  deck:surfaces.material('timber',0xa37b4f),pallet:surfaces.material('timber',0xbb9866),bench:surfaces.material('timber',0x6f5036),crate:surfaces.material('timber',0xa98456),
  card:std(0xb98f5e,.9),cardDark:std(0xa47b4c,.9),label:std(0xf0eadb,.8),
  toteNavy:std(0x24426a,.45),toteGreen:std(0x2c5942,.45),
  rubber:std(0x202327,.9),red:std(0xa8231f,.45,.4),canvas:std(0x56684f,.95,0,{side:THREE.DoubleSide}),rope:std(0xa08d64,1),
  glass:new THREE.MeshBasicMaterial({color:0xd4ecff}),lamp:std(0xefe5bd,.6,0,{emissive:0xffdf9d,emissiveIntensity:.9}),
 };
 const fixed=m=>{m.receiveShadow=true;m.userData.staticProp=true;return m;};
 const box=(size,pos,material,name,parent=room)=>{const m=fixed(new THREE.Mesh(new THREE.BoxGeometry(...size),material));m.position.set(...pos);if(name)m.name=name;parent.add(m);return m;};
 const cyl=(rt,rb,h,pos,material,{segments=12,rx=0,rz=0,name,parent=room}={})=>{const m=fixed(new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material));m.position.set(...pos);m.rotation.set(rx,0,rz);if(name)m.name=name;parent.add(m);return m;};
 // (What stands on a floor is set 3 mm into it: no face lies in the floor's own plane.)
 const SINK=.003;
 const set=(name,x,y,z,ry=0)=>{const g=new THREE.Group();g.name=name;g.position.set(x,y,z);g.rotation.y=ry;room.add(g);return g;};
 const solids=[];
 const solid=(x,z,w,d,height,minY=0)=>{solids.push({x,z,w,d,height,minY});collider(x,z,w,d,height,minY);};
 const inspect=(pos,title,text)=>{const a=new THREE.Object3D();a.position.set(...pos);a.userData.workers=['Mrs Sato'];room.add(a);reg(a,'Inspect '+title,()=>action('inspect',title,text),true);};
 const stock=id=>WAREHOUSE_STOCK.find(s=>s.id===id);

 // ------------------------------------------------------------------ the shell
 box([HW*2,.16,HL*2],[0,-.08,0],mat.floor,'warehouse-floor');
 // Walls: a block plinth and tin above it, standing outside the room's faces; ribs and pilasters stand on those faces.
 for(const s of [-1,1]){
  box([.16,B.plinth,HL*2],[s*(HW+.08),B.plinth/2,0],mat.block);box([.14,B.eave-B.plinth,HL*2],[s*(HW+.07),(B.eave+B.plinth)/2,0],mat.tin);
  for(let z=-HL+.15;z<HL;z+=.3)box([.04,B.eave-B.plinth-.04,.06],[s*HW,(B.eave+B.plinth)/2,z],mat.rib,'warehouse-wall-rib');
  for(const z of [-3.9,-1.3,1.3,3.9])box([.16,B.eave-.01,.22],[s*(HW-.02),B.eave/2-.005,z],mat.block,'warehouse-pilaster');
 }
 // The gable ends: the back whole, the front in three pieces round the door (1.65 wide, 2.2 high).
 const gable=(z,name)=>{const g=new THREE.Shape([new THREE.Vector2(-HW,B.eave),new THREE.Vector2(HW,B.eave),new THREE.Vector2(0,B.ridge)]),m=fixed(new THREE.Mesh(new THREE.ShapeGeometry(g),mat.tin));
  m.position.z=z;if(z>0)m.rotation.y=Math.PI;m.name=name;room.add(m);};
 box([HW*2,B.plinth,.16],[0,B.plinth/2,-HL-.08],mat.block);box([HW*2,B.eave-B.plinth,.14],[0,(B.eave+B.plinth)/2,-HL-.07],mat.tin);gable(-HL,'warehouse-back-gable');
 for(const s of [-1,1])box([HW-.825,B.eave,.14],[s*(HW+.825)/2,B.eave/2,HL+.07],mat.tin);
 box([1.65,B.eave-2.2,.14],[0,(B.eave+2.2)/2,HL+.07],mat.tin);gable(HL,'warehouse-front-gable');
 for(let x=-HW+.15;x<HW;x+=.3){box([.06,B.eave-B.plinth-.04,.04],[x,(B.eave+B.plinth)/2,-HL],mat.rib,'warehouse-wall-rib');if(Math.abs(x)>.9)box([.06,B.eave-.06,.04],[x,B.eave/2+.01,HL],mat.rib,'warehouse-wall-rib');}
 // The roof: two slopes of tin seen from below, and a steel truss on every pair of pilasters.
 const rise=B.ridge-B.eave,slope=Math.hypot(HW,rise),pitch=Math.atan2(rise,HW);
 for(const s of [-1,1]){const r=box([slope+.1,.05,HL*2],[s*HW/2,B.eave+rise/2+.04,0],mat.roof,'warehouse-ceiling');r.rotation.z=-s*pitch;}
 // (Collar-tie trusses: the tie is up at 4.9 m, so a person on the mezzanine walks under it with 2.3 m to spare. A tie at
 // the eaves would cross the deck at chest height.)
 const tieY=B.tie,tieHalf=HW*(1-(tieY-B.eave)/rise);
 for(const z of [-3.9,-1.3,1.3,3.9]){
  box([tieHalf*2-.1,.09,.12],[0,tieY,z],mat.steel,'warehouse-truss-chord');
  for(const s of [-1,1]){const r=box([slope-.25,.08,.1],[s*HW/2,B.eave+rise/2-.1,z],mat.steel,'warehouse-truss-rafter');r.rotation.z=-s*pitch;}
  box([.06,B.ridge-tieY-.2,.06],[0,(B.ridge+tieY)/2-.1,z],mat.steel,'warehouse-truss-post');
 }
 // Clerestory windows high on the west wall, their daylight a pale shaft across the bay.
 const shaft=new THREE.MeshBasicMaterial({color:0xdcefff,transparent:true,opacity:.05,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 for(const z of [-2.6,0,2.6]){
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.62),mat.glass);pane.position.set(-HW+.012,3.55,z);pane.rotation.y=Math.PI/2;pane.name='warehouse-clerestory';room.add(pane);
  for(const y of [3.22,3.88])box([.05,.05,1.6],[-HW+.03,y,z],mat.steel);for(const dz of [-.77,-.27,.27,.77])box([.045,.62,.04],[-HW+.03,3.55,z+dz],mat.steel);
  const beam=new THREE.Mesh(new THREE.PlaneGeometry(3.4,1.3),shaft);beam.position.set(-HW+1.5,2.6,z);beam.rotation.z=.55;beam.name='warehouse-light-shaft';beam.userData.noInk=true;room.add(beam);
 }
 // The roll-up door on the street wall, seen from inside: its slats, guides, hood and the two bollards that keep a pallet off them.
 const R=B.shutter,rz=(R.z[0]+R.z[1])/2,rw=R.z[1]-R.z[0];
 box([.06,R.height,rw-.1],[HW,R.height/2+.004,rz],mat.galv,'warehouse-roll-up-door');
 for(let y=.14;y<R.height;y+=.16)box([.03,.025,rw-.16],[HW-.035,y,rz],mat.rib);
 for(const z of R.z)box([.16,R.height+.2,.12],[HW-.03,(R.height+.2)/2-.004,z],mat.steel);
 box([.34,.36,rw+.3],[HW-.14,R.height+.39,rz],mat.steel,'warehouse-door-hood');
 for(const z of [R.z[0]-.22,R.z[1]+.02]){cyl(.07,.07,.91,[HW-.42,.445,z],mat.yellow,{name:'warehouse-bollard'});solid(HW-.42,z,.2,.2,.95);}
 // Painted on the floor: the aisle, the keep-clear hatch before the shutter, the stair's foot. A drain in the aisle.
 const linePaint=new THREE.MeshStandardMaterial({color:0xdca215,roughness:.75,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
 const paint=(w,d,x,z,ry=0)=>{const m=fixed(new THREE.Mesh(new THREE.PlaneGeometry(w,d),linePaint));m.rotation.set(-Math.PI/2,0,ry);m.position.set(x,.006,z);m.name='warehouse-floor-line';room.add(m);};
 for(const x of [-1.05,1.05])paint(.08,5.2,x,.9);paint(2.18,.08,0,-1.66);
 for(let i=0;i<5;i++)paint(.1,1.5,1.55+i*.24,3.55,.5);
 paint(S.x[1]-S.x[0]+.2,.14,(S.x[0]+S.x[1])/2,S.foot+.25);
 box([.4,.03,.4],[0,-.003,2.2],mat.steel,'warehouse-drain');for(let i=-3;i<=3;i++)box([.34,.012,.018],[0,.014,2.2+i*.05],mat.galv);
 // Services overhead: the red sprinkler main, a breaker panel by the door with its conduit.
 cyl(.04,.04,HL*2-.3,[.9,B.tie+.12,0],mat.red,{rx:Math.PI/2,name:'warehouse-sprinkler-main'});
 box([.12,.7,.5],[-HW+.04,1.5,4.5],mat.galv,'warehouse-breaker-panel');for(const dz of [-.12,0,.12])cyl(.014,.014,2.3,[-HW+.03,3.0,4.5+dz],mat.galv,{segments:6});
 // The door, as it was, and the way out.
 const door=buildShopDoor(room,{name:'warehouse-inside-door',glass:false,width:1.65});door.group.position.z=HL-.12;door.group.rotation.y=Math.PI;
 const exitAnchor=new THREE.Object3D();exitAnchor.name='warehouse-room-exit';exitAnchor.position.set(...WAREHOUSE_ROOM.exit);room.add(exitAnchor);reg(exitAnchor,'Exit Harbour Warehouse',exit,true);
 box([.5,.2,.06],[0,2.55,HL-.02],mat.steel,'warehouse-exit-sign');box([.44,.14,.012],[0,2.55,HL-.056],std(0x2f9a62,.5,0,{emissive:0x2bd17a,emissiveIntensity:.8}),'warehouse-exit-sign-face').userData.staticProp=false;

 // ------------------------------------------------------------- the mezzanine
 const front=M.front,depth=front+HL,mz=(front-HL)/2;
 box([HW*2-.04,M.deck,depth-.05],[0,MY-M.deck/2,mz-.015],mat.deck,'warehouse-mezzanine-deck');
 box([HW*2-.04,.24,.07],[0,MY-.125,front+.005],mat.steel,'warehouse-mezzanine-fascia');
 const beamY=MY-M.deck-.13;
 const iBeam=(len,x,y,z,alongZ=false)=>{const g=set('warehouse-beam',x,y,z,alongZ?Math.PI/2:0);box([len,.026,.16],[0,.117,0],mat.steel,null,g);box([len,.026,.16],[0,-.117,0],mat.steel,null,g);box([len,.2,.02],[0,0,0],mat.steel,null,g);};
 for(const z of [front-.16,mz,-HL+.14])iBeam(HW*2-.24,0,beamY,z);
 for(let x=-2.4;x<=2.4;x+=.8)box([.07,.14,depth-.5],[x,MY-M.deck-.072,mz-.02],mat.steel,'warehouse-joist');
 const column=(x,z)=>{const h=beamY-.13+SINK,g=set('warehouse-column',x,-SINK,z);
  for(const s of [-1,1])box([.18,h,.022],[0,h/2,s*.079],mat.steel,null,g);box([.022,h,.134],[0,h/2,0],mat.steel,null,g);
  box([.3,.026,.3],[0,.013,0],mat.steel,null,g);box([.21,.8,.21],[0,.43,0],mat.yellow,null,g);box([.28,.026,.28],[0,h-.013,0],mat.steel,null,g);solid(x,z,.24,.24,h);};
 // (On the aisle's painted lines and at the west wall: none stands in the aisle. The beam's east end bears on the wall.)
 for(const x of [-2.7,-1.1,1.1])column(x,front-.16);
 // The guardrail: two rails and a kick plate, a post every metre or so; open at the stair, and a gate at the hoist.
 const rail=(x0,x1)=>{const len=x1-x0,mid=(x0+x1)/2,z=front-.05;
  cyl(.022,.022,len,[mid,MY+M.rail,z],mat.yellow,{rz:Math.PI/2,segments:8});cyl(.018,.018,len,[mid,MY+M.rail*.54,z],mat.yellow,{rz:Math.PI/2,segments:8});box([len,.13,.016],[mid,MY+.068,z],mat.yellow);
  const n=Math.max(2,Math.ceil(len/1.2)+1);for(let i=0;i<n;i++)box([.045,M.rail+.01,.045],[x0+len*i/(n-1),MY+M.rail/2,z],mat.steel);
  solid(mid,z,len,.08,M.rail+.05,MY);};
 rail(-HW+.03,M.gate[0]);rail(M.gate[1],S.x[0]-.03);rail(S.x[1]+.03,HW-.03);
 const gate=set('warehouse-pallet-gate',(M.gate[0]+M.gate[1])/2,MY,front-.05),gw=M.gate[1]-M.gate[0]-.04;
 for(const y of [.16,.56,1.04])cyl(.02,.02,gw,[0,y,0],mat.yellow,{rz:Math.PI/2,segments:8,parent:gate});
 for(const x of [-gw/2,0,gw/2])cyl(.02,.02,.9,[x,.6,0],mat.yellow,{segments:8,parent:gate});
 solid((M.gate[0]+M.gate[1])/2,front-.05,gw,.08,M.rail+.05,MY);
 // The chain hoist over the gate: a rail under the trusses, its trolley, chain and hook hanging in the bay.
 box([.1,.14,3.0],[-.9,B.tie-.13,-1.5],mat.steel,'warehouse-hoist-rail');box([.26,.16,.3],[-.9,B.tie-.28,-1.1],mat.steel,'warehouse-hoist-trolley');
 box([.022,B.tie-.36-(B.eave-1.39),.022],[-.9,(B.tie-.36+B.eave-1.39)/2,-1.1],mat.galv,'warehouse-hoist-chain');
 const hook=fixed(new THREE.Mesh(new THREE.TorusGeometry(.08,.02,6,12,Math.PI*1.55),mat.steel));hook.name='warehouse-cargo-hook';hook.position.set(-.9,B.eave-1.47,-1.1);hook.rotation.z=Math.PI;room.add(hook);

 // ------------------------------------------------------------------ the stair
 const sx0=S.x[0],sx1=S.x[1],sw=sx1-sx0,scx=(sx0+sx1)/2,run=S.foot-S.head,riseStep=MY/S.steps,going=run/S.steps,incline=Math.hypot(run,MY),angle=Math.atan2(MY,run),smz=(S.foot+S.head)/2;
 for(const x of [sx0-.035,sx1+.035]){const str=box([.06,.24,incline+.1],[x,MY/2-.07,smz],mat.steel,'warehouse-stair-stringer');str.rotation.x=angle;}
 for(let i=0;i<S.steps;i++){const y=(i+1)*riseStep,z=S.foot-(i+.5)*going;
  box([sw-.01,.026,going+.012],[scx,y-.05,z],mat.steel);box([sw-.03,.034,going+.02],[scx,y-.017,z],mat.deck,'warehouse-stair-tread');box([sw-.03,.012,.03],[scx,y+.006,z+going/2-.006],mat.yellow,'warehouse-stair-nosing');}
 for(const x of [sx0-.035,sx1+.035]){
  const top=cyl(.022,.022,incline+.2,[x,MY/2+1.0,smz],mat.yellow,{segments:8});top.rotation.x=Math.PI/2+angle;
  const mid=cyl(.017,.017,incline+.1,[x,MY/2+.52,smz],mat.yellow,{segments:8});mid.rotation.x=Math.PI/2+angle;
  for(let p=0;p<=4;p++){const f=p/4;box([.04,1.04,.04],[x,f*MY+.52,S.foot-f*run],mat.steel);}
 }
 for(const x of [sx0-.035,sx1+.035])box([.08,MY/2-.15,.08],[x,(MY/2-.15)/2-SINK,smz],mat.steel,'warehouse-stair-post');
 // Its open side is a guard from the third tread up; the wall is its other side.
 solid(sx0-.04,(S.foot-going*2.4+S.head)/2,.08,S.foot-going*2.4-S.head,MY+1.05);

 // ------------------------------------------------------------------ the props
 const carton=(g,w,h,d,x,y,z,dark=false,ry=0)=>{const c=set('carton',x,y,z,ry);g.add(c);box([w,h,d],[0,h/2,0],dark?mat.cardDark:mat.card,null,c);box([w+.012,.014,d*.2],[0,h,0],mat.label,null,c);box([w*.34,h*.3,.006],[-w*.2,h*.62,d/2+.003],mat.label,null,c);return c;};
 const tote=(g,x,y,z,body)=>{const w=.52,h=.32,d=.4,c=set('tote',x,y,z);g.add(c);box([w,h-.04,d],[0,(h-.04)/2,0],body,null,c);box([w+.04,.044,d+.04],[0,h-.02,0],mat.yellow,null,c);for(const rx of [-w*.33,w*.33])box([.022,h-.08,d+.016],[rx,(h-.04)/2,0],body,null,c);return c;};
 const crate=(g,w,h,d,x,y,z)=>{const c=set('crate',x,y,z);g.add(c);box([w-.05,h-.05,d-.05],[0,h/2,0],mat.crate,null,c);const t=.04;
  for(const a of [-1,1])for(const b of [-1,1])box([t,h,t],[a*(w/2-t/2),h/2,b*(d/2-t/2)],mat.pallet,null,c);
  // (The rails sit a little inside the posts all round: no rail's face lies in a post's.)
  for(const y2 of [t/2+.004,h-t/2-.004])for(const b of [-1,1]){box([w-.012,t-.008,t-.012],[0,y2,b*(d/2-t/2)],mat.pallet,null,c);box([t-.012,t-.008,d-.09],[b*(w/2-t/2),y2,0],mat.pallet,null,c);}return c;};
 const pallet=(g,x,y,z,ry=0)=>{const c=set('pallet',x,y,z,ry);g.add(c);for(const a of [-.52,0,.52])box([.08,.095,1.0],[a,.068,0],mat.pallet,null,c);
  for(let i=0;i<7;i++)box([1.2,.022,.115],[0,.127,-.43+i*.1433],mat.pallet,null,c);for(const b of [-.43,0,.43])box([1.198,.02,.12],[0,.01,b],mat.pallet,null,c);return c;};
 /** A pallet rack bay: blue uprights, orange beams, a board on each level, and what its rows hold ('c' carton, 't' tote, 'k' crate). */
 const rack=(name,x,y,z,ry,{width=2.2,height=2.1,depth=.8,rows})=>{const g=set(name,x,y,z,ry),p=.06;
  for(const a of [-1,1]){for(const b of [-1,1]){box([p,height,p],[a*width/2,height/2,b*depth/2],mat.blue,null,g);box([.13,.016,.13],[a*width/2,.012,b*depth/2],mat.steel,null,g);}
   for(let i=0;i<3;i++){const y0=.25+i*(height-.5)/3,y1=.25+(i+1)*(height-.5)/3,len=Math.hypot(depth,y1-y0),br=box([.024,.028,len-.08],[a*width/2,(y0+y1)/2,0],mat.blue,null,g);br.rotation.x=(i%2?-1:1)*Math.atan2(y1-y0,depth);}}
  rows.forEach((row,l)=>{const sy=l===0?.16:.16+l*(height-.56)/(rows.length-1),top=sy+.07;
   for(const b of [-1,1])box([width-p-.004,.09,.044],[0,sy,b*depth/2],mat.orange,null,g);box([width-p*1.4,.026,depth-.05],[0,sy+.056,0],mat.pallet,null,g);
   let cx=-width/2+.14;[...row].forEach((k,i)=>{
    if(k==='c'){const w=.46+((i*7+l*3)%4)*.04,h=.3+((i+l)%3)*.07,d=.5;carton(g,w,h,d,cx+w/2,top,((i%2)-.5)*.06,(i+l)%2===1,((i%3)-1)*.05);if((i+l)%3===0&&l<rows.length-1&&h<.4)carton(g,w*.82,.24,d*.8,cx+w/2,top+h+.014,0,true,.08);cx+=w+.07;}
    else if(k==='t'){tote(g,cx+.26,top,0,[mat.toteNavy,mat.toteGreen][(i+l)%2]);cx+=.6;}
    else{crate(g,.48,.42,.48,cx+.24,top,0);cx+=.56;}});});
  return g;};
 const groundRack=(id,name,x,z,ry,rows)=>{rack(name,x,-SINK,z,ry,{rows});const w=ry?.86:2.3,d=ry?2.3:.86;solid(x,z,w,d,2.15);return stock(id);};
 groundRack('fishing-gear','warehouse-rack-fishing-gear',-1.75,-4.7,0,['kkk','ckc','ccc']);
 groundRack('bait','warehouse-rack-bait',.55,-4.7,0,['tkt','ctc','cc']);
 groundRack('depot-drinks','warehouse-rack-depot-drinks',-2.45,-.55,Math.PI/2,['ccc','ccc','cc']);
 groundRack('depot-dry','warehouse-rack-depot-dry',-2.45,1.8,Math.PI/2,['ttt','tct','tt']);
 inspect([-1.75,1.2,-4.2],'Fishing-gear shelves','Wooden boxes hold net floats, shackles and spare fittings. The centre aisle stays clear for deliveries.');
 inspect([.55,1.1,-4.2],'Bait stores','Hooks, bait tins and line are sorted by the boats that ordered them.');
 inspect([-1.9,1.2,.6],'Island provisions','Sakura Trading’s depot: cases of jasmine tea, bottled beer and tinned pork on the heavy rack, paper goods and batteries in lidded totes beside it. Kōji loads the round from here.');
 // The quay's ledger bench under the mezzanine: the carbon book, a vice, the red tool box, a lamp, a stool.
 const bench=set('warehouse-ledger-bench',2.5,-SINK,-3.4,-Math.PI/2),bw=1.8,bh=.9,bd=.72;
 box([bw,.06,bd],[0,bh,0],mat.bench,null,bench);box([bw-.12,.03,bd-.12],[0,.26,0],mat.steel,null,bench);
 for(const a of [-1,1])for(const b of [-1,1])box([.055,bh-.03,.055],[a*(bw/2-.06),(bh-.03)/2,b*(bd/2-.06)],mat.steel,null,bench);
 box([bw-.08,.8,.03],[0,bh+.45,-bd/2+.035],mat.block,'warehouse-pegboard',bench);
 box([.5,.26,.24],[-.55,bh+.16,-.12],mat.red,'warehouse-tool-box',bench);box([.16,.02,.02],[-.55,bh+.3,-.12],mat.galv,null,bench);
 box([.15,.13,.22],[.68,bh+.095,.2],mat.blue,'warehouse-vice',bench);cyl(.008,.008,.2,[.68,bh+.09,.36],mat.galv,{rz:Math.PI/2,segments:6,parent:bench});
 box([.34,.03,.44],[.05,bh+.045,.05],mat.label,'warehouse-ledger',bench);
 cyl(.08,.1,.03,[.3,bh+.045,-.2],mat.steel,{parent:bench});cyl(.011,.011,.44,[.27,bh+.25,-.19],mat.steel,{segments:6,rz:.2,parent:bench});
 const shade=fixed(new THREE.Mesh(new THREE.ConeGeometry(.1,.14,12,1,true),mat.steel));shade.position.set(.17,bh+.46,-.12);shade.rotation.z=-.35;bench.add(shade);
 const bulb=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),mat.lamp);bulb.position.set(.16,bh+.42,-.12);bulb.name='warehouse-task-lamp';bench.add(bulb);
 for(let i=0;i<3;i++)cyl(.085,.085,.2,[-.5+i*.22,.375,.03],mat.galv,{parent:bench});
 const stool=set('warehouse-stool',1.75,-SINK,-3.55);cyl(.16,.16,.04,[0,.62,0],mat.bench,{segments:14,parent:stool});for(let a=0;a<4;a++){const t=a/4*Math.PI*2+.4;cyl(.013,.011,.62,[Math.cos(t)*.12,.3,Math.sin(t)*.12],mat.steel,{segments:6,parent:stool});}
 solid(2.5,-3.4,.78,1.86,1.1);solid(1.75,-3.55,.34,.34,.66);
 inspect([1.9,1.1,-3.4],'Quay ledger','Ice, rope and lamp oil issued to the evening boats are recorded in the harbour agent’s carbon book. Everything that leaves the warehouse passes this bench.');
 // Lamp oil, engine oil and diesel on a spill pallet by the door, the hand truck that moves them beside it.
 const D=stock('lamp-oil').at;box([1.3,.166,1.3],[D[0],.077,D[1]],mat.yellow,'warehouse-spill-pallet');
 [[-.31,-.31,0x1e40af],[.31,-.31,0x8f1d1d],[-.31,.31,0x1e40af],[.31,.31,0x262c33]].forEach(([dx,dz,colour])=>{const m=std(colour,.4,.55),g=set('warehouse-drum',D[0]+dx,.16,D[1]+dz);
  cyl(.27,.27,.86,[0,.43,0],m,{segments:16,parent:g});for(const y of [.03,.3,.58,.83])cyl(.282,.282,.03,[0,y,0],m,{segments:16,parent:g});cyl(.03,.03,.02,[.13,.87,0],mat.galv,{segments:8,parent:g});});
 solid(D[0],D[1],1.34,1.34,1.05);
 inspect([D[0]+.9,.9,D[1]],'Oil drums','Two of lamp oil, one of engine oil, one of diesel, on a yellow pallet that would hold a leak. Issued by the can and written in the ledger.');
 const truck=set('warehouse-hand-truck',-1.15,0,4.35,-.5);truck.rotation.x=-.14;
 for(const a of [-.18,.18])cyl(.015,.015,1.2,[a,.66,0],mat.red,{segments:6,parent:truck});cyl(.015,.015,.38,[0,1.26,0],mat.red,{rz:Math.PI/2,segments:6,parent:truck});
 for(const y of [.32,.62,.94])box([.36,.03,.014],[0,y,0],mat.red,null,truck);box([.4,.014,.24],[0,.07,.12],mat.steel,'warehouse-jack-handle',truck);
 for(const a of [-.23,.23])cyl(.1,.1,.04,[a,.11,-.06],mat.rubber,{rz:Math.PI/2,parent:truck});
 solid(-1.15,4.35,.5,.45,1.3);
 inspect([-1.1,.9,3.9],'Pallet jack','The red hand truck takes one drum or four cases. Anything heavier waits for the forklift from the ferry’s apron.');
 // Just inside the shutter: a pallet off the morning boat, a crate and a carton still on it. Under the stair: empties.
 const I=stock('incoming').at,inc=set('warehouse-pallet-cargo',I[0],-SINK,I[1],.08);pallet(inc,0,0,0);crate(inc,.84,.76,.76,-.12,.14,-.04);carton(inc,.56,.42,.5,-.1,.9,-.04,true,-.08);carton(inc,.3,.3,.4,.42,.14,.2);
 solid(I[0],I[1],1.26,1.06,1.3);
 const E=stock('empties').at;for(let i=0;i<3;i++)pallet(room,E[0],i*.146-SINK,E[1],Math.PI/2+(i-1)*.05);solid(E[0],E[1],1.02,1.22,.46);
 // The step ladder between the east column and the stair; the mooring rope coiled on its hooks by the door.
 const ladder=set('warehouse-step-ladder',1.45,-SINK,-1.25,.6),lh=1.6,sp=.4,tilt=Math.atan2(sp,lh);
 for(const a of [-1,1]){const f=box([.03,lh,.06],[a*.2,lh/2,sp/2],mat.galv,null,ladder);f.rotation.x=-tilt;const b=box([.026,lh,.042],[a*.2,lh/2,-sp/2],mat.galv,null,ladder);b.rotation.x=tilt;}
 box([.42,.04,.17],[0,lh-.01,0],mat.yellow,null,ladder);for(let i=1;i<=5;i++){const f=i/6;box([.44-f*.1,.02,.08],[0,f*lh,sp*(1-f)],mat.galv,null,ladder);}
 solid(1.45,-1.25,.5,.55,1.6);
 for(let i=0;i<3;i++){const coil=fixed(new THREE.Mesh(new THREE.TorusGeometry(.2+i*.03,.03,6,20),mat.rope));coil.position.set(1.75+i*.02,1.5-i*.02,HL-.06-i*.035);coil.name='warehouse-mooring-rope';room.add(coil);}
 box([.05,.05,.14],[1.77,1.72,HL-.07],mat.steel);
 inspect([1.75,1.3,4.6],'Mooring rope','Dry coils of natural-fibre rope on their hook, ready for the next boat.');
 inspect([-.9,1.6,-1.1],'Cargo hoist','A manual chain hoist runs along the rail under the trusses and hangs over the mezzanine’s gate. What goes up or comes down goes on the hook, never down the stair.');
 // Upstairs.
 rack('warehouse-rack-decorations',-1.75,MY-SINK,-4.7,0,{height:1.5,rows:['ccc','tct']});solid(-1.75,-4.7,2.3,.86,1.55,MY);
 inspect([-1.75,MY+1.1,-4.3],'Town decorations','Lantern boxes for Obon, the Halloween walk’s paper pumpkins, the New Year pine and rope: Sakura keeps the town’s decorations since Mrs Kinjō retired, and they are kept here, dry.');
 const C=stock('boat-timber').at,canti=set('warehouse-cantilever-rack',C[0],MY-SINK,C[1]);
 for(const a of [-1,0,1]){box([.09,1.7,.11],[a*1.0,.85,-.16],mat.steel,null,canti);for(const y of [.5,1.0,1.5])box([.06,.06,.52],[a*1.0,y,.1],mat.orange,null,canti);}
 for(let p=0;p<4;p++)box([2.5,.04,.17],[0,.552+p*.042,.1],mat.pallet,null,canti);for(let p=0;p<4;p++)cyl(.034,.034,2.4,[0,1.066,-.04+p*.08],mat.galv,{rz:Math.PI/2,segments:8,parent:canti});
 solid(C[0],C[1]+.05,2.6,.62,1.75,MY);
 inspect([C[0],MY+1.1,C[1]+.7],'Boat timber','Planks and galvanised pipe on the arms of a cantilever rack: Chin’s stock for mending the boats. A plank goes down through the gate on the hoist.');
 const F=stock('fenders').at;for(let t=0;t<4;t++){const tyre=fixed(new THREE.Mesh(new THREE.TorusGeometry(.26,.1,8,16),mat.rubber));tyre.rotation.x=Math.PI/2;tyre.position.set(F[0],MY+.1+t*.2,F[1]);tyre.name='warehouse-tyre';room.add(tyre);}
 solid(F[0],F[1],.74,.74,.85,MY);
 const T=stock('festival-drum').at,tarpGeo=new THREE.PlaneGeometry(1.5,1.4,14,14),tp=tarpGeo.attributes.position;
 for(let i=0;i<tp.count;i++){const x=tp.getX(i),y=tp.getY(i),d=Math.hypot(Math.max(0,Math.abs(x)-.34),Math.max(0,Math.abs(y)-.34));tp.setZ(i,Math.max(.012,.92-d*2.3+Math.sin(Math.atan2(y,x)*8)*.03*Math.min(1,d*3)));}
 tarpGeo.computeVertexNormals();const tarp=fixed(new THREE.Mesh(tarpGeo,mat.canvas));tarp.rotation.x=-Math.PI/2;tarp.rotation.z=.2;tarp.position.set(T[0],MY,T[1]);tarp.name='warehouse-festival-drum';room.add(tarp);
 solid(T[0],T[1],1.05,1.0,1.0,MY);
 inspect([T[0]-.8,MY+.9,T[1]],'Festival drum','Under the canvas: the big drum of the Obon night on the quay. The Youth Association carry it down the stair, four of them, once a year.');
 const P=stock('tarpaulins').at;[0x7c3a1c,0x26466b,0x5b5650].forEach((colour,i)=>{const roll=cyl(.1,.1,1.5,[P[0],MY+.74,P[1]+i*.26],std(colour,.95),{segments:10,name:'warehouse-tarpaulin-roll'});roll.rotation.z=-.12;});
 solid(P[0],P[1]+.26,.3,.8,1.5,MY);
 const G=stock('gate-pallet').at,gp=set('warehouse-gate-pallet',G[0],MY-SINK,G[1],-.04);pallet(gp,0,0,0);carton(gp,.5,.42,.42,-.28,.14,0);carton(gp,.5,.42,.42,.27,.14,0,true);carton(gp,.56,.34,.44,0,.575,0,false,.1);
 solid(G[0],G[1],1.26,1.06,1.0,MY);
 const cart=set('warehouse-platform-cart',.8,MY-SINK,-2.9,-.4);box([1.05,.05,.66],[0,.185,0],mat.blue,null,cart);for(const b of [-.28,.28])cyl(.015,.015,.8,[.5,.6,b],mat.galv,{segments:6,parent:cart});
 cyl(.017,.017,.58,[.5,1.0,0],mat.galv,{rx:Math.PI/2,segments:6,parent:cart});for(const a of [-.42,.42])for(const b of [-.24,.24])cyl(.07,.07,.036,[a,.07,b],mat.rubber,{rx:Math.PI/2,segments:10,parent:cart});
 tote(cart,-.2,.21,0,mat.toteGreen);solid(.8,-2.9,1.0,.9,1.05,MY);
 // The lamps: two high-bay pendants under the trusses, a tube under the mezzanine. One light for the room.
 for(const z of [-2.6,2.6]){cyl(.012,.012,.36,[0,B.ridge-.2,z],mat.steel,{segments:6});const dome=fixed(new THREE.Mesh(new THREE.ConeGeometry(.3,.22,14,1,true),mat.steel));dome.position.set(0,B.ridge-.47,z);room.add(dome);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.03,14),mat.lamp);disc.position.set(0,B.ridge-.56,z);disc.name='warehouse-high-bay-lamp';room.add(disc);}
 box([1.2,.045,.15],[-.6,beamY-.16,-3.4],mat.galv);const tube=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.14,8),mat.lamp);tube.rotation.z=Math.PI/2;tube.position.set(-.6,beamY-.2,-3.4);tube.name='warehouse-shop-light';room.add(tube);
 const light=new THREE.PointLight(0xffe6b8,2.8,17,1.8);light.position.set(0,4.4,.4);room.add(light);

 if(batch)room.userData.portBatch=batchStaticProps(room);
 const floors=[{id:'ground',x:[-HW,HW],z:[-HL,HL],y:0,thick:.16},
  {id:'stair',x:[sx0,sx1],z:[S.head,S.foot],y:[MY,0],thick:.26},
  {id:'mezzanine',x:[-HW,HW],z:[-HL,front],y:MY,thick:M.deck+.26}];
 return {...WAREHOUSE_ROOM,walk:createHouseWalk(floors),floors,solids,stock:WAREHOUSE_STOCK};
}
