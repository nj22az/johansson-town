import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {coplanarOverlaps} from '../tools/z-fighting.mjs';
import {FURNITURE_HEIGHTS} from '../src/world/furniture-standards.js';
import {SHARED_DINING_COLLIDERS} from '../src/world/interiors/shared-dining-layout.js';
import {IZAKAYA_PLAYER_SEATS} from '../src/people/izakaya-beer.js';
import {MINATO_COMPACT as P} from '../src/world/interiors/minato-compact-plan.js';

// Scan the actual exported furniture, in the room which uses it. A photo cannot catch
// every depth-buffer conflict: the owner's requirement is no flicker while moving,
// including the small bottle labels and the joins seen close up at a phone's size.
const NAMES=['Minato walnut back bar','Minato walnut counter'];
const FILE='minato-interior-compact.glb';
const REGIONS=[
 {minX:-3.82,maxX:-.38,minZ:-3.75,maxZ:-3.02,minY:.04,maxY:2.95},
 {minX:-3.95,maxX:.45,minZ:-1.32,maxZ:-.58,minY:.04,maxY:1.05},
];
const bytesByFile=new Map(),requests=[];
let room,display,api,models;
const bounds=o=>new THREE.Box3().setFromObject(o);
const scan=o=>coplanarOverlaps(o,{regions:REGIONS,tolerance:.002,minArea:.0005,keepIdentical:true});
const describe=f=>`${f.a} | ${f.b}: ${f.area.toFixed(5)} m², ${f.gap.toFixed(6)} m apart at ${f.at.join(', ')}`;
const down=(root,x,z,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,z),new THREE.Vector3(0,-1,0)).intersectObject(root,true)[0]?.point.y;

before(async()=>{
 installDOM();
 const previous={fetch:globalThis.fetch,self:globalThis.self,bitmap:globalThis.createImageBitmap};
 globalThis.self=globalThis;
 // Texture pixels are reviewed in the browser. Retain the loader's actual texture
 // objects/materials here, so the geometry scan still treats printed faces as such.
 globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});
 globalThis.fetch=async(input,options)=>{
  const url=new URL(typeof input==='string'?input:input.url);
  if(url.protocol==='blob:')return previous.fetch(input,options);
  assert.ok(url.pathname.startsWith('/johansson-town/assets/models/izakaya/'),'Unexpected fixture request '+url.href);
  const filename=url.pathname.split('/').at(-1);requests.push(filename);
  const bytes=await readFile(new URL('../assets/models/izakaya/'+filename,import.meta.url));bytesByFile.set(filename,bytes);
  return new Response(bytes,{headers:{'Content-Type':'model/gltf-binary'}});
 };
 try{
  api=await import('../src/world/izakaya.js');
  await api.preloadIzakaya(['interior']);
  assert.ok(api.izakayaReady('interior'),'The complete fitted interior must load');
  room=new THREE.Group();
  display=api.buildIzakayaRoom({room,
   box:(size,position,color,parent)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color}));mesh.position.set(...position);parent.add(mesh);return mesh;},
   reg(){},collider(){},action(){},exit(){},signTexture:()=>null});
  room.updateMatrixWorld(true);models=NAMES.map(name=>{const model=room.getObjectByName(name);assert.ok(model,name+' must be in the real room');return model;});
 }finally{globalThis.fetch=previous.fetch;globalThis.self=previous.self;globalThis.createImageBitmap=previous.bitmap;}
});
after(()=>{display?.dispose();display?.television?.dispose();});

test('both shared dining entrances clone one complete replacement from the same cached asset',async()=>{
 const other=new THREE.Group(),registered=[];
 // Exercise the real Sato entry, including its existing queried import path.
 const {buildSatoRamenRoom}=await import('../src/world/interiors/sato-ramen.js');
 const sato=buildSatoRamenRoom({room:other,collider:(...c)=>registered.push(c)});
 assert.ok(other.getObjectByName('Minato interior'),'Sato receives the same fitted model');
 assert.equal(other.getObjectByName('Minato compact loading shell'),undefined);
 assert.deepEqual(sato.spawn,P.ramenEntrance.spawn);
 assert.deepEqual(registered,SHARED_DINING_COLLIDERS.map(c=>[c.x,c.z,c.w,c.d,c.height]));
 await api.preloadIzakaya(['interior']);
 assert.deepEqual(requests,[FILE],'One complete compact room loads once, before the interior is ready');
 for(const name of NAMES){
  let count=0;other.traverse(o=>{if(o.name===name)count++;});assert.equal(count,1,name+' is not duplicated on another entry');
  const clone=other.getObjectByName(name),original=room.getObjectByName(name);
  assert.notEqual(clone,original);assert.deepEqual(clone.position.toArray(),original.position.toArray());
  const firstMesh=o=>{let found;o.traverse(m=>{if(m.isMesh&&!found)found=m;});return found;};
  // The vertices are shared; a room may hold its own index where a piece is lifted out to move (minato-bar.js liftPiece).
  assert.equal(firstMesh(clone).geometry.attributes.position,firstMesh(original).geometry.attributes.position,'Repeated visits share immutable geometry');
 }
 sato.dispose();
});

test('the runtime replacement keeps bounded geometry and opaque, front-sided finishes',()=>{
 let triangles=0,draws=0;
 const bytes=bytesByFile.get(FILE);assert.ok(bytes,FILE+' was loaded by the game');
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 assert.ok(!json.extensionsRequired?.length,'The standard GLTFLoader needs no optional decoder');
 for(let i=0;i<models.length;i++){
  let localDraws=0;
  models[i].traverse(o=>{if(!o.isMesh)return;
   const g=o.geometry;localDraws+=(g.groups.length||1);triangles+=(g.index?.count||g.attributes.position.count)/3;
   for(const [name,a] of Object.entries(g.attributes))assert.ok(a.array.every(Number.isFinite),o.name+' has finite '+name);
   if(g.index)assert.ok(g.index.array.every(k=>k<g.attributes.position.count),o.name+' has valid indices');
   for(const m of Array.isArray(o.material)?o.material:[o.material]){
    assert.equal(m.transparent,false,'Solid tinted glass avoids transparency sorting at '+o.name);
    assert.equal(m.opacity,1);assert.equal(m.side,THREE.FrontSide,'Closed cabinet and bottle surfaces have one visible side');
    assert.ok(!m.transmission,'No nested refractive shells');
    assert.ok(!m.polygonOffset,'Physical geometry resolves joins; no blanket depth offset');
    assert.equal(m.userData.keepPhysicalStrict,true,'Commissioned wood, brass and labels retain their authored physical finish');
    if(m.map)assert.equal(m.map.minFilter,THREE.LinearMipmapLinearFilter,'Fine labels and grain use mipmaps as the camera moves away');
   }
  });
  assert.ok(localDraws<=(i===0?10:6),NAMES[i]+' draw budget: '+localDraws);draws+=localDraws;
 }
 assert.ok(triangles<=34000,'The two furniture assets use '+triangles+' triangles');
 assert.ok(draws<=16,'Fixed material batches bound the draw calls');
 assert.ok(bytes.length<=6*1024*1024,'The complete fitted room uses '+bytes.length+' bytes');
 let roomTriangles=0,roomDraws=0;
 room.getObjectByName('Minato interior').traverse(o=>{if(o.isMesh){roomTriangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;roomDraws+=o.geometry.groups.length||1;}});
 assert.ok(roomTriangles<=184126,'The fitted room remains below its previous '+roomTriangles+' triangle budget');
 assert.ok(roomDraws<=50,'The complete fitted room uses '+roomDraws+' material draws');
});

test('forty-two physical bottles carry the fourteen fictional brands recorded for Thao and Sakura Trading',()=>{
 const shelf=models[0],stock=shelf.getObjectByName('Backbar').userData,catalogue=api.MINATO_FICTIONAL_SPIRITS;
 assert.equal(stock.bottles.length,42);assert.equal(stock.brands.length,14);
 assert.equal(new Set(stock.bottles.map(b=>b.source)).size,42,'Each bottle has its own authored placement');
 assert.deepEqual([...new Set(stock.bottles.map(b=>b.brand))].sort(),catalogue.map(b=>b.name.toUpperCase()).sort());
 for(const brand of catalogue){assert.equal(brand.fictional,true);assert.equal(brand.owner,'Thao');assert.equal(brand.supplier,'Sakura Trading','the drink is Sakura Trading’s since Higa Liquor closed');assert.ok(brand.reason.length>20);}
 let bodies,labels;
 shelf.traverse(o=>{if(!o.isMesh)return;const parts=o.userData.mergedParts||[];
  if(parts.some(p=>p.where.endsWith('/ solid body and closure')))bodies=o;
  if(parts.some(p=>p.where.endsWith('/ integral paper faces')))labels=o;
 });
 assert.ok(bodies&&labels,'The data has both bottle and printed face geometry');
 for(const [mesh,suffix] of [[bodies,'solid body and closure'],[labels,'integral paper faces']]){
  const p=mesh.geometry.attributes.position,parts=mesh.userData.mergedParts;
  assert.equal(parts.length,42,'One physical '+suffix+' for each bottle');
  // Blender preserves the authored parts and transforms but reindexes vertices.
  // Check the exported geometry at each actual bottle position, rather than using
  // offsets into the original asset's pre-export vertex buffer.
  const vertices=Array.from({length:p.count},(_,k)=>new THREE.Vector3().fromBufferAttribute(p,k).applyMatrix4(mesh.matrixWorld));
  for(let i=0;i<parts.length;i++){
   const item=stock.bottles[i],pos=new THREE.Vector3(...item.position).applyMatrix4(shelf.matrixWorld);
   assert.equal(parts[i].where,item.source+' / '+suffix);
   const near=vertices.filter(v=>Math.abs(v.x-pos.x)<.10&&Math.abs(v.z-pos.z)<.10&&v.y>=pos.y-.04&&v.y<=pos.y+.39);
   assert.ok(near.length,item.source+' has real '+suffix+' geometry at its authored location');
   const b=new THREE.Box3().setFromPoints(near);
   assert.ok(b.max.y>b.min.y+.05,'The named '+suffix+' is an actual three-dimensional bottle component');
   if(mesh===bodies){
    assert.ok(Math.abs(b.min.y-pos.y)<.001,item.source+' base agrees with its authored position');
    const support=down(shelf,pos.x,pos.z,pos.y+.002);
    assert.ok(Math.abs(support-pos.y)<.002,item.source+' stands on its actual shelf');
   }
  }
 }
});

test('the furniture stands on the floor, clears the wall and fits the compact solids',()=>{
 const [shelf,counter]=models.map(bounds),solid=SHARED_DINING_COLLIDERS.find(c=>c.id==='minato-counter'),cabinet=SHARED_DINING_COLLIDERS.find(c=>c.id==='minato-backbar');
 assert.ok(Math.abs(shelf.min.y-.04)<.001,'Shelf feet meet the actual floorboards');
 assert.ok(Math.abs(counter.min.y-.04)<.001,'Counter plinth meets the actual floorboards');
 assert.ok(shelf.min.z>=P.main.minZ+.006,'Cabinet back clears the real back wall');
 assert.ok(shelf.min.z>=cabinet.z-cabinet.d/2-.001&&shelf.max.z<=cabinet.z+cabinet.d/2+.001,'Cabinet fits its measured collision footprint');
 assert.ok(shelf.min.x>=cabinet.x-cabinet.w/2-.001&&shelf.max.x<=cabinet.x+cabinet.w/2+.001,'The retained cupboard fits its compact bay');
 assert.ok(shelf.max.y<P.ceilingY-.2,'The full-height cabinet clears the lower ceiling');
 assert.ok(counter.min.x>=solid.x-solid.w/2-.001&&counter.max.x<=solid.x+solid.w/2+.001,'Counter ends match the collision footprint');
 assert.ok(counter.min.z>=solid.z-solid.d/2-.001&&counter.max.z<=solid.z+solid.d/2+.001,'Counter and footrail fit inside the existing collision footprint');
 assert.ok(Math.abs(counter.max.y-FURNITURE_HEIGHTS.serviceCounter)<.001,'Counter retains the low serving height');
});

test('every counter drink and dish rests on the new slate at the unchanged serving height',()=>{
 const counter=models[1];
 for(const seat of Object.values(IZAKAYA_PLAYER_SEATS).filter(s=>s.counter))for(const [kind,point] of [['drink',seat.table],['dish',seat.dish]]){
  const [x,y,z]=point,actual=down(counter,x,z,y+.02);
  assert.ok(Number.isFinite(actual),seat.id+' '+kind+' has a real support surface');
  assert.ok(Math.abs(actual-y)<.001,seat.id+' '+kind+' must sit on the slate, at '+actual+' instead of '+y);
 }
 // The existing steel preparation surface remains separate and usable behind it.
 assert.ok(Math.abs(down(room,-2.25,P.worktop.position[2],.935)-P.worktop.top)<.001,'The kitchen worktop keeps its original height');
});

test('the old baked cupboard and counter bodies were removed rather than covered with new ones',()=>{
 const legacy=room.getObjectByName('Minato interior').clone(true);
 for(const name of NAMES)legacy.getObjectByName(name).removeFromParent();
 legacy.updateMatrixWorld(true);
 for(const [x,z] of [...[-3.5,-2.7,-1.9,-1.1,-.3].map(x=>[x,P.counter.position[2]]),...[-3.6,-2.5,-1.4].map(x=>[x,P.backbar.position[2]])]){
  const y=down(legacy,x,z,.77);
  assert.ok(Math.abs(y-.04)<.001,'Retired furniture still occupies '+[x,z]+' at '+y);
 }
 // The old five shelves and their bottles would intercept these rays before the
 // rear wall. The replacement is separate, so its absence reveals the bare bay.
 for(const x of [-3.5,-2.5,-1.5])for(const y of [.5,1.08,1.42,1.76,2.1,2.44]){
  const ray=new THREE.Raycaster(new THREE.Vector3(x,y,-3.01),new THREE.Vector3(0,0,-1));
  const hit=ray.intersectObject(legacy,true)[0];
  assert.ok(hit&&hit.point.z<=P.main.minZ+.002,'An old shelf or bottle remains at '+[x,y]+': '+hit?.point.z);
 }
});

test('the cabinet, labels, brasswork and counter contain no overlapping planes at phone viewing scale',()=>{
 const furniture=new THREE.Group();for(const model of models)furniture.add(model.clone(true));
 assert.deepEqual(scan(furniture).map(describe),[]);
});

test('the replacement shares no visible plane with the room, fitted props or runtime dressing',()=>{
 // Existing independent parts of the venue are covered by their own suites. This
 // check concerns every pair containing the new cabinet or counter, without hiding
 // any old mesh or excluding the small contact areas on its new surfaces.
 const concernsReplacement=f=>NAMES.some(name=>f.a.includes(name)||f.b.includes(name));
 assert.deepEqual(scan(room).filter(concernsReplacement).map(describe),[]);
});

test('the whole fitted dining room and its runtime details have no competing planes',()=>{
 // Cabinet-only regions missed the owner's window/door surrounds, phone,
 // guestbook, recipe, towel warmer and small printed products.
 assert.deepEqual(coplanarOverlaps(room,{tolerance:.002,minArea:.0005,keepIdentical:true}).map(describe),[]);
});

test('the whole-room scan catches a new wall print accidentally laid in the plaster',()=>{
 const pane=new THREE.Mesh(new THREE.PlaneGeometry(.4,.3),new THREE.MeshStandardMaterial({color:0xff00ff}));
 pane.name='Accidental plaster overlay';pane.rotation.y=-Math.PI/2;pane.position.set(2.3195,2.55,.60);room.add(pane);
 try{
  const found=coplanarOverlaps(room,{tolerance:.002,minArea:.0005,keepIdentical:true});
  assert.ok(found.some(f=>(f.a+f.b).includes(pane.name)&&f.area>.10),'The real shared wall remains protected');
 }finally{pane.removeFromParent();pane.geometry.dispose();pane.material.dispose();}
});

test('the depth scan measures tapered faces at their overlap, independent of world position',()=>{
 const group=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0xdddddd,side:THREE.DoubleSide});
 const base=new THREE.Mesh(new THREE.PlaneGeometry(.4,.4).rotateX(-Math.PI/2),mat);base.position.set(-3,0,0);group.add(base);
 const above=base.clone();above.material=mat.clone();above.rotation.z=.004;above.position.y=.012;group.add(above);
 assert.deepEqual(coplanarOverlaps(group,{tolerance:.002,minArea:.0005,keepIdentical:true}),[],
  'A 12 mm gap cannot become a depth conflict when a surface is away from the origin');
 above.position.y=.0005;
 assert.ok(coplanarOverlaps(group,{tolerance:.002,minArea:.0005,keepIdentical:true}).length,
  'The same slightly sloping face half a millimetre above the base is still detected');
});

test('the furniture scan detects an accidentally doubled counter finish',()=>{
 const group=new THREE.Group();group.add(models[1].clone(true));
 const sheet=new THREE.Mesh(new THREE.PlaneGeometry(1,.3).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:0xffffff}));
 sheet.name='Accidental extra counter finish';sheet.position.set(P.counter.position[0],FURNITURE_HEIGHTS.serviceCounter+.0005,P.counter.position[2]);group.add(sheet);
 assert.ok(scan(group).some(f=>(f.a+f.b).includes(sheet.name)&&f.area>.2),'A second surface half a millimetre above the slate must fail');
});

// The owner's photo of 21 October: two cream bowls on the prep board drawn into each
// other as one. They are tonight's otoshi now, apart on the board, the knife on top of it.
const BOARD={minX:-1.97,maxX:-1.33,minZ:-1.735,maxZ:-1.365,minY:.935,maxY:1.02};
const pointsIn=(name,box)=>{
 const out=[],v=new THREE.Vector3();
 room.traverse(mesh=>{const key=s=>s.replace(/[^a-z]/gi,'').toLowerCase();if(!mesh.isMesh||!key(mesh.name).endsWith(key(name)))return;const p=mesh.geometry.attributes.position;
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);if(v.x>=box.minX&&v.x<=box.maxX&&v.z>=box.minZ&&v.z<=box.maxZ&&v.y>=box.minY&&v.y<=box.maxY)out.push(v.clone());}});
 return out;
};
test('the otoshi bowls on the prep board stand apart, and the knife lies on the board',()=>{
 // Each bowl is its own connected piece of the ceramic mesh: join vertices along triangle
 // edges, then count the pieces with a vertex on the board.
 const bowls=[];
 room.traverse(mesh=>{
  if(!mesh.isMesh||!/creamceramic$/i.test(mesh.name.replace(/[^a-z]/gi,'')))return;
  const p=mesh.geometry.attributes.position,index=mesh.geometry.index,parent=Array.from({length:p.count},(_,i)=>i);
  const find=i=>{while(parent[i]!==i)i=parent[i]=parent[parent[i]];return i;};
  // glTF splits vertices at hard edges: the same position is the same point of the bowl.
  const at=new Map(),v=new THREE.Vector3();for(let i=0;i<p.count;i++){const k=[p.getX(i),p.getY(i),p.getZ(i)].map(n=>n.toFixed(5)).join();if(at.has(k))parent[find(i)]=find(at.get(k));else at.set(k,i);}
  for(let t=0;t<index.count;t+=3){const a=find(index.getX(t));parent[find(index.getX(t+1))]=a;parent[find(index.getX(t+2))]=a;}
  const pieces=new Map();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);const r=find(i);if(!pieces.has(r))pieces.set(r,[]);pieces.get(r).push(v.clone());}
  for(const points of pieces.values())if(points.some(q=>q.x>=BOARD.minX&&q.x<=BOARD.maxX&&q.z>=BOARD.minZ&&q.z<=BOARD.maxZ&&q.y>=BOARD.minY&&q.y<=BOARD.maxY))bowls.push(points);
 });
 bowls.sort((a,b)=>a[0].x-b[0].x);
 assert.equal(bowls.length,2,'Two separate bowls on the board');
 const shapes=bowls.map(points=>{const box=new THREE.Box3().setFromPoints(points),c=box.getCenter(new THREE.Vector3());return {c,r:Math.max(...points.map(p=>Math.hypot(p.x-c.x,p.z-c.z))),box};});
 assert.ok(shapes[1].c.x-shapes[0].c.x>=shapes[0].r+shapes[1].r+.005,'Rims at least 5 mm apart: '+shapes.map(s=>s.c.x.toFixed(3)+'/'+s.r.toFixed(3)));
 const board=pointsIn('Honey cedar',{...BOARD,minY:.9}),top=Math.max(...board.map(p=>p.y));
 const edge=new THREE.Box3().setFromPoints(board);
 for(const s of shapes){assert.ok(s.box.min.y>=top-.0005,'A bowl stands on the board, not in it');assert.ok(s.box.min.x>=edge.min.x&&s.box.max.x<=edge.max.x&&s.box.min.z>=edge.min.z&&s.box.max.z<=edge.max.z,'and wholly on it');}
 for(const name of ['Brushed kitchen steel','Dark fittings']){
  const knife=pointsIn(name,{...BOARD,minY:.9});assert.ok(knife.length,'The knife is on the board: '+name);
  assert.ok(Math.min(...knife.map(p=>p.y))>=top-.0005,'The knife lies on the board, not in it: '+name);
  for(const s of shapes)assert.ok(!knife.some(p=>Math.hypot(p.x-s.c.x,p.z-s.c.z)<s.r+.002),'The knife is clear of the bowls');
 }
});
test('the prep board, its bowls and knife share no flickering plane',()=>{
 const found=coplanarOverlaps(room,{regions:[{...BOARD,minY:.9}],tolerance:.002,minArea:.0005,keepIdentical:true});
 assert.deepEqual(found.map(describe),[]);
});

test('Sato toppings fill the real pans from their bottoms to below their rims',()=>{
 const top=P.ramenPrep.top,z=P.ramenPrep.position[2];
 for(const [x,finish] of [[5.02,'Food green'],[5.24,'Food cream']]){
  const points=pointsIn(finish,{minX:x-.076,maxX:x+.076,minZ:z-.136,maxZ:z+.136,minY:top,maxY:top+.10});
  assert.ok(points.length,'The topping has real volume inside its pan');
  const base=Math.min(...points.map(p=>p.y)),upper=Math.max(...points.map(p=>p.y));
  assert.ok(Math.abs(base-down(room,x,z,top+.013))<.0005,'Food rests on the actual pan bottom');
  assert.ok(upper<=top+.0585&&upper<top+.07,'The heap stays below the steel rim');
 }
});

// Thao's drinks station (minato-bar.js) stands on clear worktop: nothing of the fitted room or its dressing (the
// oshibori warmer, the prep board, the grill) is under the rack, the pour or the tap, and nothing of it flickers.
test('the drinks station stands on clear worktop, its glasses apart, sharing no plane with the room',async()=>{
 const {MINATO_BAR}=await import('../src/world/interiors/minato-bar.js');
 const station=room.getObjectByName('Minato drinks station');assert.ok(station,'built into the real room');
 const B=MINATO_BAR,top=B.top,others=[];room.traverse(o=>{if(o.isMesh&&!o.name.startsWith('Rack ')){let p=o;while(p&&p!==station)p=p.parent;if(!p)others.push(o);}});
 const [tx,tz,tw,td]=B.rack.tray,spots=[];
 for(let x=tx-tw/2;x<=tx+tw/2+1e-6;x+=.04)for(let z=tz-td/2;z<=tz+td/2+1e-6;z+=.04)spots.push(['rack',x,z]);
 for(const [name,[x,,z],r] of [['pour',B.pour.glass,.05],['tap',B.tap.at,.07],['tap glass',B.tap.glass,.05]])for(let a=0;a<8;a++)spots.push([name,x+Math.cos(a*Math.PI/4)*r,z+Math.sin(a*Math.PI/4)*r]);
 const busy=spots.filter(([,x,z])=>{const hit=new THREE.Raycaster(new THREE.Vector3(x,1.8,z),new THREE.Vector3(0,-1,0)).intersectObjects(others,false)[0];return !hit||Math.abs(hit.point.y-top)>.002;}).map(([n,x,z])=>[n,+x.toFixed(2),+z.toFixed(2)]);
 assert.deepEqual(busy,[],'clear worktop under the station');
 const glasses=station.children.filter(o=>/^Rack /.test(o.name)).map(o=>new THREE.Box3().setFromObject(o).expandByScalar(-.001));
 for(let i=0;i<glasses.length;i++)for(let j=i+1;j<glasses.length;j++)assert.ok(!glasses[i].intersectsBox(glasses[j]),'rack glasses '+i+' and '+j+' stand apart');
 // With a glass set down where she pours and under the tap, as she does.
 const {createDrinkProp}=await import('../src/people/izakaya-beer.js'),set=[['awamori',B.pour.glass],['draft',B.tap.glass]].map(([kind,at])=>{const g=createDrinkProp(kind);g.position.set(...at);room.add(g);return g;});
 room.updateMatrixWorld(true);
 const region={minX:tx-tw/2-.05,maxX:B.tap.at[0]+.1,minZ:-1.82,maxZ:-1.40,minY:top-.01,maxY:top+.4};
 const found=coplanarOverlaps(room,{regions:[region],tolerance:.002,minArea:.0005,keepIdentical:true}).map(describe);
 for(const g of set)g.removeFromParent();
 assert.deepEqual(found,[]);
});
