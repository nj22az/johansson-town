import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {prepareVendingModel,createVendingMachine} from '../src/world/vending.js';
import {installDOM} from './fixtures.mjs';

test('local vending GLB fits its existing collider and renders as one opaque body',async()=>{
 const bytes=await readFile(new URL('../assets/models/props/vending-machine.glb',import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const mesh=prepareVendingModel(gltf.scene),b=mesh.geometry.boundingBox;
 assert.ok(b.max.x-b.min.x<=1.30001);assert.ok(b.max.z-b.min.z<=1.00001);
 assert.ok(Math.abs(b.min.y)<.00001);assert.ok(b.max.y<=2.25001&&b.max.y>2);
 assert.equal(mesh.geometry.groups.length,0);assert.equal(mesh.material.transparent,false);
 assert.equal(mesh.geometry.attributes.color.count,mesh.geometry.attributes.position.count);
});
test('vending is drawn in code, so it is always there and never waits on a download',()=>{
 installDOM();const group=createVendingMachine();assert.ok(group.userData.parts.length>20);
 assert.ok(group.children.every(child=>child.isMesh));
});

// The drinks machine rebuilt as a real mid-1990s Japanese can machine ("the vending machine doesn't look right").
test('the drinks machine: a 1990s can machine’s size, its window of dummy cans, its money panel and its pocket',async()=>{
 installDOM();
 const THREE=await import('../vendor/three.module.js');
 const {VENDING_MACHINE:M,VENDING_COLUMNS,vendingPoints}=await import('../src/world/vending.js');
 const {VENDING_PRODUCTS}=await import('../src/commerce/vending-catalogue.js');
 const g=createVendingMachine(),parts=g.userData.parts,body=g.getObjectByName('Vending machine body');
 const b=new THREE.Box3().setFromObject(body),size=b.getSize(new THREE.Vector3());
 // about 1.83 m high on a 4 cm pad, about a metre wide and three quarters deep: the real thing's size
 assert.ok(Math.abs(b.max.y-(M.size.pad+M.size.height))<.01&&M.size.height>1.8&&M.size.height<1.86,'1.83 m high on its pad: '+b.max.y.toFixed(3));
 assert.ok(M.size.width>=1&&M.size.width<=1.1&&M.size.depth>=.7&&M.size.depth<=.78,'about 1.0–1.1 m wide and 0.75 m deep');
 assert.ok(Math.abs(b.min.y)<.001,'standing on the ground, not in it');
 assert.ok(size.x<M.size.width+2*M.size.padSide+.01&&size.z<M.size.depth+M.size.padFront+.04,'nothing sticks out past its pad');
 for(const part of ['Vending pad','Vending cabinet','Vending door','Vending header','Vending display window','Vending glass','Price plate','Push button','Sold-out lamp',
  'Coin slot','Note slot','Note lamp','Amount display','Coin return lever','Change cup','Change label','Take-out pocket','Take-out flap','Take-out label',
  'Vending side poster','Vending vents','Vending lock','Vending rating plate','Maker’s plate','Cord grommet'])assert.ok(parts.includes(part),part);
 // its maker is a Johansson company (CLAUDE.md: Johansson is this universe's Acme), its plate's numbers the machine's own
 const {vendingMakerPlate,vendingModel,vendingCapacity}=await import('../src/world/vending.js');
 const plate=vendingMakerPlate();assert.ok(/^JOHANSSON /.test(plate[0]),'a Johansson maker: '+plate[0]);
 assert.equal(vendingModel(),'JV-'+VENDING_COLUMNS.length+'C');
 assert.equal(vendingCapacity(),VENDING_COLUMNS.reduce((n,c)=>n+M.columnCapacity[c.size],0));
 assert.ok(plate[1].includes(vendingModel())&&plate[1].includes(VENDING_COLUMNS.length+' columns')&&plate[1].includes(vendingCapacity()+' cans'),plate[1]);
 assert.ok(plate[2].includes(M.rating.volts+' V')&&plate[2].includes(M.rating.amps.toFixed(1)+' A')&&plate[2].includes(String(M.maker.built)),plate[2]);
 const src=(await import('node:fs')).readFileSync(new URL('../src/world/vending.js',import.meta.url),'utf8');assert.ok(!/shiranami|白波/i.test(src),'no other maker’s name on the machine');
 // the window: two rows of eight, every column a catalogue drink at its price; J-Coffee among them; the warm ones red, at the right
 assert.equal(VENDING_COLUMNS.length,16);
 for(const c of VENDING_COLUMNS){const p=VENDING_PRODUCTS.find(x=>x.id===c.id);assert.ok(p,'a catalogue drink: '+c.id);assert.equal(c.price,p.price);assert.equal(c.hot,!!p.hot);assert.ok(M.cans[c.size],'a real can size: '+c.size);}
 const j=VENDING_COLUMNS.filter(c=>c.id==='j-coffee');assert.ok(j.length>=2&&j.every(c=>c.size===350&&c.price===120),'J-Coffee in its 350 ml can at ¥120');
 assert.ok(VENDING_COLUMNS.some(c=>c.soldOut)&&VENDING_COLUMNS.some(c=>!c.soldOut),'a sold-out lamp lit, the rest not');
 const hot=VENDING_COLUMNS.filter(c=>c.hot);assert.ok(hot.length&&hot.every(c=>c.row===1&&c.col>=8-hot.length),'the warm columns at the right of the bottom row');
 // each dummy can stands on its shelf, inside its band, behind the glass, clear of its neighbours
 const S=g.userData.samples;assert.equal(S.length,16);
 for(const s of S){const C=M.cans[s.size],r=C.diameter/2,band=M.bands[s.row];
  assert.ok(s.y>band.bottom&&s.y+C.height<s.top-.02,'inside its window band');assert.ok(s.z+r<s.glass-.01&&s.z-r>s.back,'behind the glass, in front of the back');
  assert.ok(Math.abs(s.x)+r<M.windowWidth/2,'inside the window');}
 for(const row of [0,1]){const xs=S.filter(s=>s.row===row).map(s=>s.x).sort((a,c)=>a-c);for(let i=1;i<xs.length;i++)assert.ok(xs[i]-xs[i-1]>M.cans[350].diameter+.02,'a gap between cans');}
 // the take-out pocket holds a 350 ml can lying across it, behind its flap
 const T=g.userData.takeOut,r=M.cans[350].diameter/2;
 assert.ok(T.y-r>=T.floor-1e-9&&T.y+r<M.pocket.y1+M.size.pad,'a can fits between the pocket’s floor and its top');
 assert.ok(T.z+r<T.flap&&T.z-r>T.back,'and between its flap and its back');assert.ok(T.x1-T.x0>M.cans[350].height+.1,'lying across it');
 assert.deepEqual(vendingPoints({pad:true}).takeOut,T);
 // the lever pushes down; the light on the pavement comes on at night; indoors there is no pad
 g.userData.setLever(1);assert.ok(g.userData.lever.rotation.x>.3,'the coin-return lever goes down');g.userData.setLever(0);assert.equal(g.userData.lever.rotation.x,0);
 const pool=g.getObjectByName('Vending light on the pavement');assert.equal(pool.visible,false,'no light pool by day');g.userData.night(1);assert.ok(pool.visible&&pool.material.opacity>.9,'a pool of light at night');
 const indoor=createVendingMachine({pad:false});assert.ok(!indoor.getObjectByName('Vending light on the pavement')&&!indoor.userData.parts.includes('Vending pad'),'indoors: no pad, no pavement');
 assert.ok(Math.abs(indoor.userData.top-M.size.height)<1e-9);
 // light enough for phones: a handful of meshes and a few thousand triangles, the paint in two shared 1K atlases
 let meshes=0,tris=0;g.traverse(o=>{if(o.isMesh){meshes++;tris+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
 assert.ok(meshes<=7&&tris<5000,meshes+' meshes, '+tris+' triangles');
 const other=createVendingMachine();assert.equal(other.getObjectByName('Vending machine body').geometry,body.geometry,'machines share their geometry');
 assert.notEqual(other.getObjectByName('Vending lit panels').material,g.getObjectByName('Vending lit panels').material,'but each dims its own lights');
});

test('Sakura’s machine stands in front of the shutter, clear of its rail, the reel and the nobori; its cord runs to its own socket',async()=>{
 installDOM();
 const THREE=await import('../vendor/three.module.js');
 const {VENDING_MACHINE:M}=await import('../src/world/vending.js');
 const {SAKURA_BOX,SAKURA_VENDING:V}=await import('../src/world/okinawa/old-town.js');
 const {buildHalloween,HALLOWEEN,HALLOWEEN_ELECTRICS}=await import('../src/world/halloween.js');
 assert.equal(HALLOWEEN_ELECTRICS.compressorRun,M.rating.amps,'the story’s compressor is the rating plate’s');
 const back=V.x-M.size.depth/2,rail=SAKURA_BOX.maxX+.24;
 assert.ok(back-rail>=.02&&back-rail<.05,'its back just clear of the closed shutter’s bottom rail: '+(back-rail).toFixed(3));
 assert.ok(V.z-M.size.width/2-M.size.padSide>SAKURA_BOX.minZ+.3+.5,'clear of the corner pier and the shutter’s guide');
 const world={group:new THREE.Group(),colliders:[],hourly:[]};const m=createVendingMachine();m.position.set(V.x,V.y,V.z);m.rotation.y=V.ry;world.group.add(m);
 const h=buildHalloween(world,{});world.group.updateMatrixWorld(true);
 const mb=new THREE.Box3().setFromObject(m.getObjectByName('Vending machine body'));
 const reel=new THREE.Box3();h.stage({cable:'reel'});h.group.getObjectByName('Cord reel').traverse(o=>{if(o.isMesh)reel.expandByObject(o);});assert.ok(!reel.intersectsBox(mb),'the reel stands clear of the machine and its pad');
 assert.ok(Math.abs(HALLOWEEN.machine.top-(V.y+m.userData.top))<1e-9&&Math.abs(HALLOWEEN.machine.front-(V.x+M.size.depth/2))<1e-9,'the Halloween set reads the machine’s own measurements');
 const peek=new THREE.Box3().setFromObject(h.group.getObjectByName('Plush ghost peeking'));assert.ok(Math.abs(peek.min.y-m.userData.top)<.06,'the plush ghost sits on the top');
 // its cord: there all year, off only while the machine is on Kōji's reel; it leaves the back at the cord's grommet
 const cord=world.group.getObjectByName('Drinks machine cord');h.stage({show:false});assert.ok(cord.visible&&cord.parent.visible,'its cord to its socket out of season');
 h.stage({cable:'reel'});assert.equal(cord.visible,false,'unplugged while it is on the reel');h.stage({cable:'fixed'});assert.equal(cord.visible,true,'back on its own socket');
 const P=cord.geometry.attributes.position,q=new THREE.Vector3(),[ex,ey,ez]=HALLOWEEN.machine.cordExit;let near=Infinity,behind=true;
 for(let i=0;i<P.count;i++){q.fromBufferAttribute(P,i);near=Math.min(near,Math.hypot(q.x-ex,q.y-ey,q.z-ez));
  // along the foot of the shutter: in front of its bottom rail (where the shutter is) and behind the machine's back
  if(q.z>SAKURA_BOX.minZ+.3&&q.y<.1&&q.x<rail-.0005)behind=false;}
 assert.ok(near<.02,'the cord meets the machine at its grommet');assert.ok(behind,'the cord never runs into the shutter’s rail');
 // no cord runs through the corner paving or under the footway; none through the machine's body
 // the cabinet and its pad, from the machine's own measurements (its back is flat: only the cord's grommet stands off it)
 const Z=M.size,body=new THREE.Box3(new THREE.Vector3(back,V.y,V.z-Z.width/2-Z.padSide),new THREE.Vector3(V.x+Z.depth/2+Z.padFront,V.y+Z.pad+Z.height,V.z+Z.width/2+Z.padSide)).expandByScalar(-.002),C=HALLOWEEN.cornerPaving;
 const cords=[cord];h.stage({cable:'reel'});h.group.getObjectByName('Kōji’s way: the reel').traverse(o=>{if(o.isMesh&&o.geometry.type==='TubeGeometry')cords.push(o);});
 for(const c of cords){const A=c.geometry.attributes.position;c.updateWorldMatrix(true,false);
  for(let i=0;i<A.count;i++){q.fromBufferAttribute(A,i).applyMatrix4(c.matrixWorld);
   assert.ok(q.y>HALLOWEEN.ground-.0015,'a cord above the footway');
   if(q.x>C.minX+.002&&q.x<C.maxX-.002&&q.z>C.minZ+.002&&q.z<C.maxZ-.002)assert.ok(q.y>C.top-.0015,'a cord over the corner paving, not through it: '+q.toArray().map(v=>v.toFixed(3)));
   if(!(Math.hypot(q.x-ex,q.y-ey,q.z-ez)<.05))assert.ok(!body.containsPoint(q),'a cord through the machine at '+q.toArray().map(v=>v.toFixed(3)));
   const L=HALLOWEEN.sill;assert.ok(!(q.x<L.maxX-.001&&q.y>L.bottom+.001&&q.y<L.top-.001&&q.z>L.minZ+.001),'a cord through the window sill at '+q.toArray().map(v=>v.toFixed(3)));}}
 const coils=[];h.group.traverse(o=>{if(o.name==='Loose cord coil')coils.push(new THREE.Box3().setFromObject(o));});assert.equal(coils.length,5);
 for(const b of coils)assert.ok(b.max.x<C.minX||b.min.x>C.maxX||b.max.z<C.minZ||b.min.z>C.maxZ,'the loose coils lie on the footway, not in the paving');
});
