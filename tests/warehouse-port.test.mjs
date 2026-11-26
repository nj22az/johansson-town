import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildWarehouseInterior,WAREHOUSE_ROOM,WAREHOUSE_BAY,WAREHOUSE_STOCK} from '../src/world/interiors/warehouse.js';
import {circleHitsRect,sweepFraction} from '../physics.js';
import {coplanarOverlaps} from '../tools/z-fighting.mjs';

/**
 * The Harbour Warehouse inside (the owner, 26 November 2026, with a storage bay he had made: "Also bring this warehouse to
 * the island"): his bay at the tin shed's own size, its mezzanine and stair walked, every piece of stock with its reason.
 */
function build(options={}){installDOM();const room=new THREE.Group(),colliders=[],actions=[];
 const layout=buildWarehouseInterior({room,collider:(x,z,w,d,height,minY=0)=>colliders.push({x,z,w,d,height,minY}),reg:(o,label,fn)=>actions.push({o,label,fn}),action(){},exit(){},...options});return {room,colliders,actions,layout};}
const B=WAREHOUSE_BAY,M=B.mezzanine,S=B.stair;

test('the bay keeps its spawn, staff spot and aisle clear, and what stands in it is solid',()=>{
 const {colliders,layout}=build();
 for(const key of Object.keys(WAREHOUSE_ROOM))assert.deepEqual(layout[key],WAREHOUSE_ROOM[key],key);
 const ground=colliders.filter(c=>c.minY<1.8),blocked=(x,z)=>ground.some(c=>circleHitsRect(x,z,.32,c));
 // The aisle from the door to the racks under the mezzanine, between the painted lines.
 for(const x of [-.55,0])assert.equal(sweepFraction({x,z:4.5},{x,z:-3.6},blocked),1,'aisle at x '+x);
 assert.equal(blocked(layout.spawn[0],layout.spawn[2]),false);assert.equal(blocked(.55,-3.35),false);
 for(const id of ['fishing-gear','bait','depot-drinks','depot-dry','lamp-oil','incoming','ledger-bench']){const s=WAREHOUSE_STOCK.find(k=>k.id===id);assert.equal(blocked(s.at[0],s.at[1]),true,id+' is solid');}
 // Clear before the roll-up door: a pallet off the boat has somewhere to be set down and somewhere to go.
 assert.equal(blocked(.4,4.2),false);
});

test('the stair and the mezzanine are walked, and nobody steps off an edge or through the stair\'s side',()=>{
 const {layout,colliders}=build(),walk=layout.walk;
 assert.ok(walk&&layout.floors.some(f=>f.id==='mezzanine')&&layout.floors.some(f=>f.id==='stair'));
 const going=(S.foot-S.head)/S.steps,rise=M.y/S.steps;assert.ok(rise>.17&&rise<.21&&going>.24&&going<.3,`a stair for a person: rise ${rise.toFixed(3)}, going ${going.toFixed(3)}`);
 // Up from the foot to the head, a step at a time.
 const x=(S.x[0]+S.x[1])/2;let y=0;for(let z=S.foot+.3;z>=S.head-.5;z-=.08){const on=walk.floorAt(x,z,y);assert.ok(on,'a floor under him at z '+z.toFixed(2));y=on.y;}
 assert.equal(y,M.y,'he arrives on the mezzanine');
 // On the deck: the whole of it, and no way over its front edge but the stair.
 assert.equal(walk.floorAt(-1,-3,M.y).y,M.y);assert.equal(walk.floorAt(-1,M.front+.3,M.y),null,'no step into the air');
 const rail=colliders.filter(c=>c.minY>=M.y-.01&&c.d<.1&&Math.abs(c.z-(M.front-.05))<.02),span=rail.reduce((n,c)=>n+c.w,0);
 assert.ok(span>B.halfWidth*2-(S.x[1]-S.x[0])-.2,'a guard or the gate along the whole front but the stair: '+span.toFixed(2)+' m');
 // From the bay floor the stair's side is a wall, and under its low end there is no headroom.
 assert.equal(walk.floorAt(x,-.5,0),null);assert.ok(colliders.some(c=>Math.abs(c.x-(S.x[0]-.04))<.01&&c.d>2),'its open side is guarded');
 // Nothing overhead is in the way of a head on the deck: the ties, the lamps and the main are up in the roof.
 assert.ok(B.tie-M.y>2.2,'under the trusses\' ties: '+(B.tie-M.y).toFixed(2)+' m');
 // Under the mezzanine a person stands upright.
 assert.ok(M.y-M.deck-.26>2.2&&walk.floorAt(-1,-3.5,0).y===0);
});

test('one light, a few batches, a phone\'s triangles; and no two faces in one plane',()=>{
 const {room,actions}=build();let draws=0,triangles=0,lights=0;
 room.updateMatrixWorld(true);room.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.isLight)lights++;if(o.isMesh&&o.layers.test(new THREE.Layers())){draws++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 assert.ok(draws<=70,`Draws ${draws}`);assert.ok(triangles<18000,`Triangles ${triangles}`);assert.equal(lights,1);
 assert.ok(room.userData.portBatch.drawsSaved>500);
 for(const title of ['Cargo hoist','Pallet jack','Island provisions','Fishing-gear shelves','Bait stores','Quay ledger','Mooring rope','Oil drums','Town decorations','Boat timber','Festival drum'])assert.ok(actions.some(a=>a.label==='Inspect '+title),title);
 assert.ok(actions.some(a=>a.label==='Exit Harbour Warehouse'));
 // Every piece by name, unbatched: the standard's 2 mm (tests/no-z-fighting.test.mjs). The shared shop door's own jamb and
 // lintel are its own (world/shop-door.js) and were here before.
 const plain=build({batch:false}).room;
 for(const name of ['warehouse-ledger-bench','warehouse-mezzanine-deck','warehouse-stair-tread','warehouse-pallet-gate','warehouse-cargo-hook','warehouse-hoist-rail','warehouse-jack-handle','warehouse-pallet-cargo','warehouse-roll-up-door','warehouse-clerestory','warehouse-truss-chord','warehouse-festival-drum','warehouse-cantilever-rack'])assert.ok(plain.getObjectByName(name),name);
 const flat=coplanarOverlaps(plain,{tolerance:.002,minArea:.0004,offsetPairs:true}).filter(f=>!(f.a.includes('warehouse-inside-door')&&f.b.includes('warehouse-inside-door')));
 assert.deepEqual(flat.map(f=>`${f.a} | ${f.b}: ${(f.gap*1000).toFixed(2)} mm at ${f.centre.map(v=>+v.toFixed(2))}`),[]);
 console.log({draws,triangles,lights,batches:room.userData.portBatch.batches});
});

test('nothing in it is dressing: every piece of stock says what it is, whose, and why it is where it is',()=>{
 const R=WAREHOUSE_ROOM.bounds;
 assert.ok(WAREHOUSE_STOCK.length>=12);assert.equal(new Set(WAREHOUSE_STOCK.map(s=>s.id)).size,WAREHOUSE_STOCK.length);
 for(const s of WAREHOUSE_STOCK){
  assert.ok(s.what.length>10&&s.who.length>3&&s.why.length>30,s.id);assert.ok(['ground','mezzanine'].includes(s.floor),s.id);
  assert.ok(s.at[0]>R.minX-.1&&s.at[0]<R.maxX+.1&&s.at[1]>R.minZ-.1&&s.at[1]<R.maxZ+.1,s.id+' is in the room');
  if(s.floor==='mezzanine')assert.ok(s.at[1]<M.front,s.id+' is on the deck');
 }
 // The two stores under the one roof: the quay's, and Sakura Trading's depot (commerce/merchandising.js).
 assert.ok(WAREHOUSE_STOCK.some(s=>/Sakura Trading/.test(s.what))&&WAREHOUSE_STOCK.some(s=>/boats/.test(s.who)));
 for(const part of [M,S,B.shutter])assert.ok(part.why.length>30);
});
