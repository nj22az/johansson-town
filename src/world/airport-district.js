import * as THREE from '../../vendor/three.module.js';
import {benchSeat} from './seat-slots.js';
import {AIRPORT_PLAZA as P,AIRPORT_SHOPS,AIRPORT_GATES} from './airport-district-plan.js';
import {airportWorld,AIRPORT_HEIGHT,AIRPORT_PUBLIC_FLOORS} from './airport-ground.js';
import {TROPIC_PLACES,tropicHeight,tropicalPlantings} from './tropical-island.js';
import {SEA_LEVEL} from './ocean.js';
import {AIRPORT_ISLAND} from './airport-island.js';
import {TREE_REBUILD,treeBarkEnvelope,PALM_VARIANTS,FOREST_VARIANTS} from './tree-designs.js';
import {islandBuildMaterial,thatchRoof,bambooPost,corrugatedRoof,stripedAwning,planks,shelfGoods} from './island-architecture.js';

/**
 * The airport's public side and the island's stopping places, in Kitano-jima's frame.
 *
 * A small airport, as an island this size has: travellers step off the ferry onto the quay,
 * walk past check-in into a paved plaza with three kiosks (coffee for the early flight,
 * noodles for the wait, island crafts to take home) and sit in a thatched lounge that looks
 * straight down the runway. From the plaza a sand trail leads to Coral Bay and up through
 * the jungle to the Hinata lookout, then down to Turtle Cove. Every seat, sign and kiosk
 * here has someone it is for; the readable notes say who.
 */
const KIOSK_COLOURS=[0x5fb7b0,0xf08a6c,0xf2c84b];
export function buildAirportDistrict({world,register,onAction}){
 const root=world.airportIsland.group,materials=new Map(),yaw=root.rotation.y;
 const material=c=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.86}));return materials.get(c);};
 const ground=(u,v)=>Math.max(1.1,tropicHeight(u,v));
 const built=islandBuildMaterial(),piece=(name,geometry,x,y,z,turn=0)=>{const m=new THREE.Mesh(geometry,built);m.name=name;m.position.set(x,y,z);m.rotation.y=turn;root.add(m);return m;};
 // Everything here stands still, so it is drawn in a handful of batches (static-props.js).
 const box=(name,size,p,c,solid=false)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material(c));m.name=name;m.position.set(...p);m.userData.staticProp=true;root.add(m);if(solid){const [x,z]=airportWorld(p[0],p[2]);world.colliders.push({id:name,x,z,yaw,w:size[0],d:size[2],minY:SEA_LEVEL+p[1]-size[1]/2-.2,height:size[1]+.2});}return m;};
 const sign=(text,x,z,width=8,y=4,color=0x2f6f7a,turn=0)=>{const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=160;const c=canvas.getContext('2d');c.fillStyle='#'+color.toString(16).padStart(6,'0');c.fillRect(0,0,1024,160);c.fillStyle='#fff6e0';c.font='bold 46px sans-serif';c.textAlign='center';c.fillText(text,512,98,995);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(width,1.2),new THREE.MeshBasicMaterial({map:t}));m.name=text+' sign';m.position.set(x,y,z);m.rotation.y=turn;root.add(m);
  // Read the right way round from behind as well: a second face, not the mirror of the first.
  const back=new THREE.Mesh(m.geometry,m.material);back.name=text+' sign back';back.rotation.y=Math.PI;back.position.z=-.01;m.add(back);return m;};
 const anchor=(x,z,label,kind,title,text,y=ground(x,z)+1)=>{const p=airportWorld(x,z),a=new THREE.Object3D();a.position.set(p[0],SEA_LEVEL+y,p[1]);world.group.add(a);register(a,label,()=>onAction(kind,title,text));return a;};
 /** A bench and its seat. `facing` 1 looks toward -v (the runway), -1 toward +v (the sea). */
 const bench=(id,x,z,facing,title,text,floor=ground(x,z))=>{
  box('Island bench seat',[2.2,.12,.6],[x,floor+.46,z],0x9a6b45);box('Island bench back',[2.2,.5,.1],[x,floor+.75,z+.3*facing],0x9a6b45);
  for(const dx of [-.9,.9])box('Island bench leg',[.12,.42,.5],[x+dx,floor+.2,z],0x6a4a32);
  const p=airportWorld(x,z),s=airportWorld(x,z+1.1*facing),seat=anchor(x,z+1.1*facing,'Sit on the bench','seat',title,text,floor+1);
  const surfaceY=SEA_LEVEL+floor+.52;
  seat.userData.seat=benchSeat({id,position:[p[0],SEA_LEVEL+floor,p[1]],stand:[s[0],SEA_LEVEL+floor,s[1]],surfaceY,eyeY:surfaceY+.72,yaw:yaw+(facing>0?0:Math.PI),pitch:0},{length:2.2,front:.3});
  world.colliders.push({id:'Island bench',x:p[0],z:p[1],yaw,w:2.2,d:.6,minY:SEA_LEVEL+floor,height:.55});
 };
 // The plaza: one paved floor from check-in to the kiosks, at the height its walk record gives.
 const plazaY=AIRPORT_PUBLIC_FLOORS[0].y-SEA_LEVEL;
 box('Airport terminal plaza',[P.maxX-P.minX,.12,P.maxZ-P.minZ],[(P.minX+P.maxX)/2,plazaY-.06,(P.minZ+P.maxZ)/2],0xe7dcc2);
 // Three kiosks along the plaza's south edge, their counters open to the passing travellers.
 // Each kiosk is an open timber booth: back and side walls, a counter at the front, the
 // shelves behind it stocked with what it sells, a corrugated roof and a striped awning.
 const STOCK=[{kind:'cans',palette:[0x6b4a2e,0xe9e2d2,0xb8352e,0x2f5f8a]},{kind:'cans',palette:[0xd8a03a,0xc4472b,0xf2ead8,0x3a7d3a]},{kind:'crafts',palette:[0xb98a52,0x7a9a6a,0xd9c49a,0x4f7fa0,0xb85a3a]}];
 AIRPORT_SHOPS.forEach((shop,i)=>{
  const c=KIOSK_COLOURS[i],x=shop.x,z=shop.z,b=plazaY;
  box(shop.title+' back wall',[6,2.8,.14],[x,b+1.4,z+1.73],c);
  for(const dx of [-2.93,2.93])box(shop.title+' side wall',[.14,2.8,2.8],[x+dx,b+1.4,z+.4],c);
  box(shop.title+' counter',[5.6,1,.6],[x,b+.5,z-.75],0xf4ecd8);box(shop.title+' counter top',[5.8,.06,.75],[x,b+1.03,z-.75],0x8a6a46);
  {const [cx,cz]=airportWorld(x,z+.45);world.colliders.push({id:shop.title+' kiosk',x:cx,z:cz,yaw,w:6,d:3,minY:SEA_LEVEL+b-.2,height:3.2});}
  piece(shop.title+' shelves',shelfGoods({w:5.2,rows:3,seed:i+1,...STOCK[i]}),x,b+.9,z+1.45);
  piece(shop.title+' roof',corrugatedRoof({w:6.8,d:4,pitch:.12,color:[0x6f9a9c,0xa86a4a,0x7c8f6a][i],seed:i}),x,b+3.05,z+.3);
  piece(shop.title+' awning',stripedAwning({w:5.8,depth:1.1,drop:.5,stripes:[0xf4ecd8,c]}),x,b+2.6,z-1.1,Math.PI);
  sign(shop.title,x,z-1.12,5.4,b+2.05,0x2f6f7a,Math.PI);
  anchor(x,z-3.6,'Visit '+shop.title,'airport-shop',shop.title,shop,b+1);
 });
 // The departure lounge: a thatched shelter on the plaza's east end, facing the runway.
 const [lx,lz]=TROPIC_PLACES.lounge;
 for(const [dx,dz] of [[-4,-3],[4,-3],[-4,3],[4,3]]){piece('Lounge bamboo post',bambooPost(3.3,.11),lx+dx,plazaY,lz+dz);const [cx,cz]=airportWorld(lx+dx,lz+dz);world.colliders.push({id:'Lounge post',x:cx,z:cz,yaw,w:.3,d:.3,minY:SEA_LEVEL+plazaY-.2,height:3.6});}
 piece('Departure lounge thatch',thatchRoof({w:8.6,d:6.6,height:2.3,overhang:.6,seed:4}),lx,plazaY+3.15,lz);
 for(let i=0;i<4;i++)bench('airport-gate-a'+i,lx+(i%2?2.3:-2.3),lz+(i<2?-1.2:1.6),1,'Departure lounge','You sit in the shade of the thatch and watch the windsock over the runway. The commuter to Naha boards from Gate 1.',plazaY);
 AIRPORT_GATES.forEach((gate,i)=>{const x=lx+(i?2.6:-2.6);sign(gate.title,x,lz-3.4,4.2,plazaY+2.7,0x2f6f7a);anchor(x,lz-1.4,'Read gate '+gate.id,'read','Gate '+gate.id,gate.id===1?'Naha commuter flights board here. Buy your ticket and check in at the counter before departure.':'Gate 2 opens for the extra summer flight. Otherwise the commuter boards at Gate 1.',plazaY+1);});
 sign('KITANO-JIMA AIRPORT',(P.minX+P.maxX)/2-6,P.minZ+.3,14,plazaY+3.2,0x2f6f7a,Math.PI);
 box('Airport sign posts',[.2,3.2,.2],[(P.minX+P.maxX)/2-12.6,plazaY+1.6,P.minZ+.3],0x7a5a3c);box('Airport sign posts',[.2,3.2,.2],[(P.minX+P.maxX)/2+.6,plazaY+1.6,P.minZ+.3],0x7a5a3c);
 // The trail head: a timber gateway over the path, its board read from the plaza.
 {const gy=ground(-4.5,P.maxZ+1.2);sign('CORAL BAY ↓  ·  HINATA LOOKOUT ↗',-4.5,P.maxZ+1.2,6.4,gy+2.9,0x6a5a3a,Math.PI);for(const dx of [-3.4,3.4])box('Trail gateway post',[.22,3.6,.22],[-4.5+dx,gy+1.8,P.maxZ+1.2],0x7a5a3c,true);box('Trail gateway beam',[7.2,.22,.26],[-4.5,gy+3.62,P.maxZ+1.2],0x7a5a3c);}
 anchor(-4.5,P.maxZ-.6,'Read the island trail map','read','Kitano-jima trails','A sand trail leaves the plaza for Coral Bay, five minutes down through the palms. At the fork it climbs through the jungle to the Hinata lookout, where you can see the whole strait and Minato on the far shore, and comes down to Turtle Cove on the east side. Keep to the trail on the hill; the airport side of the fence is closed.',plazaY+1);
 // The airport fence, all the way across the island, so the runway is never somewhere you walk.
 const F=TROPIC_PLACES.fence;let east=38;while(east<118&&tropicHeight(east+1,F)>.3)east++;
 for(let u=-52;u<=east;u+=4){const y=ground(u,F);box('Airport perimeter post',[.09,1.3,.09],[u,y+.65,F],0x81918a);if(u+4<=east){const y2=ground(u+4,F),rail=box('Airport perimeter rail',[4.05,.07,.08],[u+2,(y+y2)/2+1,F],0x81918a);rail.rotation.z=Math.atan2(y2-y,4);}}
 // The Hinata lookout: a timber deck on the hilltop, one bench looking out to sea.
 const [ox,oz]=TROPIC_PLACES.lookout,look=AIRPORT_PUBLIC_FLOORS.find(f=>f.id==='kitano-lookout'),deckY=look.y-SEA_LEVEL;
 box('Hinata lookout deck',[look.maxX-look.minX,1.2,look.maxZ-look.minZ],[ox,deckY-.6,oz],0x9c7650);
 for(const [dx,dz,w,d] of [[0,2.85,6,.1],[-2.95,0,.1,6],[2.95,0,.1,6]])box('Lookout rail',[w,.08,d],[ox+dx,deckY+1,oz+dz],0x7a5a3c);
 for(const [dx,dz] of [[-2.9,2.8],[2.9,2.8],[-2.9,-2.8],[2.9,-2.8]])box('Lookout rail post',[.12,1,.12],[ox+dx,deckY+.5,oz+dz],0x7a5a3c,true);
 bench('kitano-lookout',ox,oz+1,-1,'Hinata lookout','The jungle drops away below you. Beyond the palms of Coral Bay the strait is every shade of blue, and across it Minato lies along its quay.',deckY);
 anchor(ox,oz-1.5,'Look out from Hinata','read','Hinata lookout','From up here you can count the town: the harbour office, the red roofs of the shopping street and the green dome of Mount Aoba behind them. A frigatebird hangs over the runway. The ferry is a white dot halfway across.',deckY+1);
 // Coral Bay: two benches on the sand for people waiting for the evening flight.
 const [bx,bz]=TROPIC_PLACES.coralBay;
 bench('kitano-coral-bay-0',bx-2,bz,-1,'Coral Bay','Warm sand, palm shade and water so clear you can see the ripples on the bottom. Plenty of people come over on the morning ferry just for this.');
 bench('kitano-coral-bay-1',bx+2.6,bz+.4,-1,'Coral Bay','Warm sand, palm shade and water so clear you can see the ripples on the bottom. Plenty of people come over on the morning ferry just for this.');
 anchor(bx,bz-1.8,'Read the Coral Bay notice','read','Coral Bay','Swimming between the palms only. The reef beyond the turquoise is for looking at, not standing on. Last ferry to Minato leaves after the evening flight.');
 // The Coral Bay beach bar: a thatched hut where the trail comes out onto the sand. Cold
 // Umineko lager from Sakura Trading for the people who came over for the day, shikuwasa juice
 // from Sakura's depot for the children and the drivers; it rents out the parasols below.
 {const [hx,hz]=TROPIC_PLACES.beachBar,hy=ground(hx,hz);
  box('Beach bar floor',[5,.3,4],[hx,hy+.05,hz],0xb08a5e);
  for(const [dx,dz] of [[-2.3,-1.8],[2.3,-1.8],[-2.3,1.8],[2.3,1.8]]){piece('Beach bar bamboo post',bambooPost(2.9,.09),hx+dx,hy+.15,hz+dz);const [cx,cz]=airportWorld(hx+dx,hz+dz);world.colliders.push({id:'Beach bar post',x:cx,z:cz,yaw,w:.25,d:.25,minY:SEA_LEVEL+hy-.2,height:3.2});}
  piece('Beach bar bottles',shelfGoods({w:4,rows:2,rowGap:.5,seed:9,palette:[0x3a7d3a,0x8a5a2a,0xd9e6ea,0xc9a44a]}),hx,hy+1.85,hz+1.6);
  piece('Beach bar counter planks',planks({w:4.6,d:.75,n:7,seed:3}),hx,hy+1.24,hz-1.5);
  box('Beach bar counter',[4.4,.9,.6],[hx,hy+.65,hz-1.5],0xe6d2a8,true);box('Beach bar back shelf',[4.4,1.6,.4],[hx,hy+1,hz+1.7],0x9a6b45,true);
  for(let i=0;i<4;i++)box('Beach bar cool box',[.7,.5,.5],[hx-1.6+i*1.05,hy+.45,hz+1.1],i%2?0x3f7fb0:0xd9e6ea);
  piece('Beach bar thatch',thatchRoof({w:5.4,d:4.4,height:1.9,overhang:.55,seed:7}),hx,hy+2.95,hz);
  sign('UMINEKO ¥300 · SHIKUWASA ¥150',hx+2.42,hz,3.2,hy+1.95,0x23302b,Math.PI/2);
  sign('CORAL BAY BAR',hx,hz-2.15,3.8,hy+2.55,0x2f6f7a,Math.PI);
  for(const dx of [-1.4,0,1.4]){box('Beach bar stool seat',[.42,.08,.42],[hx+dx,hy+.72,hz-2.3],0x9a6b45);box('Beach bar stool leg',[.08,.68,.08],[hx+dx,hy+.34,hz-2.3],0x6a4a32);}
  anchor(hx,hz-3.4,'Visit the Coral Bay Bar','airport-shop','Coral Bay Bar',{id:'coral-bay-bar',title:'Coral Bay Bar',line:'A thatched beach bar at the top of the sand. The juice comes over from Sakura’s depot on the morning ferry, the Umineko twice a week on the afternoon boat, packed in ice. The parasols below are rented from the counter.',items:[['Umineko lager, cold bottle',300],['Shikuwasa juice',150]]},hy+1);
  for(const [px,pz] of TROPIC_PLACES.parasols){const py=ground(px,pz);box('Rental parasol pole',[.07,2.4,.07],[px,py+1.2,pz],0xe8e2d2);const top=new THREE.Mesh(new THREE.ConeGeometry(1.5,.55,8,1),material(px<-20?0xe0705a:0x3f9fb0));top.name='Rental parasol';top.position.set(px,py+2.45,pz);top.userData.staticProp=true;root.add(top);box('Beach towel',[.9,.02,1.9],[px+.9,py+.03,pz+.3],px<-20?0xf2c84b:0xf4ecd8);}
 }
 const [tx,tz]=TROPIC_PLACES.turtleCove;
 bench('kitano-turtle-cove',tx-3,tz+1.5,-1,'Turtle Cove','You sit still and wait. After a while a dark shape surfaces in the green water, breathes, and slips under again.');
 anchor(tx,tz,'Look into Turtle Cove','read','Turtle Cove','A sheltered inlet under the hill. Green turtles come in on the rising tide to graze; the fishermen from Minato leave this cove alone for them.');
 // Tree trunks are solid where people walk.
 const {palms,trees,pandanus,bananas,rocks}=tropicalPlantings();
 if(TREE_REBUILD){
  for(const [list,family,variants] of [[palms,'palm',PALM_VARIANTS],[trees,'broadleaf',FOREST_VARIANTS],[pandanus,'pandanus',[{}]],[bananas,'banana',[{}]]])for(const t of list){
   const options=variants[(t.kind??0)%variants.length],b=treeBarkEnvelope(family,options,2.2/t.scale),yaw=family==='palm'?-t.lean:t.turn;
   const cx=(b.minX+b.maxX)/2*t.scale,cz=(b.minZ+b.maxZ)/2*t.scale,co=Math.cos(yaw),si=Math.sin(yaw),[x,z]=airportWorld(t.u+co*cx+si*cz,t.v-si*cx+co*cz);
   world.colliders.push({id:'Island '+family+' trunk',treeFamily:family,x,z,yaw:yaw+AIRPORT_ISLAND.yaw,w:(b.maxX-b.minX)*t.scale+.04,d:(b.maxZ-b.minZ)*t.scale+.04,minY:SEA_LEVEL+t.y-.03,height:Math.max(2.2,Math.min((options.height||3.6)*.55,4.5))*t.scale});
  }
  for(const t of rocks.filter(r=>r.hill)){const [x,z]=airportWorld(t.u,t.v);world.colliders.push({id:'Island hill rock',x,z,yaw:0,w:1.4*t.scale,d:1.4*t.scale,minY:SEA_LEVEL+t.y-.2,height:1.2});}
 }else for(const [list,w,h] of [[palms,.5,4],[trees,.75,4.5],[pandanus,1.2,2.5],[bananas,.35,2],[rocks.filter(r=>r.hill),1.4,1.2]])for(const t of list){const [x,z]=airportWorld(t.u,t.v);world.colliders.push({id:'Island tree trunk',x,z,yaw:0,w:w*t.scale,d:w*t.scale,minY:SEA_LEVEL+t.y-.2,height:h});}
}

/**
 * The airport district as it is read from across the strait (kitano-on-demand.js), in the same places and colours: the
 * plaza, the three kiosks and their roofs, the lounge's and the beach bar's thatch, the parasols on the sand and the
 * lookout's deck. No prompts, no colliders: nobody stands there before the real district is built.
 */
export function buildAirportDistrictFar(world){
 const root=world.airportIsland.group,far=new THREE.Group();far.name='Kitano-jima distant airport district';root.add(far);
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.9}));return mats.get(c);};
 const box=(size,p,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(c));m.position.set(...p);far.add(m);return m;};
 const ground=(u,v)=>Math.max(1.1,tropicHeight(u,v)),plazaY=AIRPORT_PUBLIC_FLOORS[0].y-SEA_LEVEL;
 box([P.maxX-P.minX,.12,P.maxZ-P.minZ],[(P.minX+P.maxX)/2,plazaY-.06,(P.minZ+P.maxZ)/2],0xe7dcc2);
 AIRPORT_SHOPS.forEach((shop,i)=>{box([6,2.8,2.8],[shop.x,plazaY+1.4,shop.z+.4],KIOSK_COLOURS[i]);box([6.8,.25,4],[shop.x,plazaY+3.05,shop.z+.3],[0x6f9a9c,0xa86a4a,0x7c8f6a][i]);});
 const thatch=0xc8a868,[lx,lz]=TROPIC_PLACES.lounge;box([8.6,1.2,6.6],[lx,plazaY+3.4,lz],thatch);
 const [hx,hz]=TROPIC_PLACES.beachBar,hy=ground(hx,hz);box([5,1.6,4],[hx,hy+.8,hz],0xe6d2a8);box([5.4,1,4.4],[hx,hy+3.1,hz],thatch);
 for(const [px,pz] of TROPIC_PLACES.parasols){const py=ground(px,pz),top=new THREE.Mesh(new THREE.ConeGeometry(1.5,.55,8,1),mat(px<-20?0xe0705a:0x3f9fb0));top.position.set(px,py+2.45,pz);far.add(top);}
 const [ox,oz]=TROPIC_PLACES.lookout,look=AIRPORT_PUBLIC_FLOORS.find(f=>f.id==='kitano-lookout');box([look.maxX-look.minX,1.2,look.maxZ-look.minZ],[ox,look.y-SEA_LEVEL-.6,oz],0x9c7650);
 return far;
}
