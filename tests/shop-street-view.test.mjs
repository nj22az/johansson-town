import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {mapShopCamera,createShopStreetView,SHOP_STREET_PORTAL_CLEARANCE} from '../src/render/shop-street-view.js';
import {createSteamedBunGeometry} from '../src/world/interiors/steamed-bun.js';
import {createWindowBatch} from '../src/render/shop-street-batches.js';

test('shop camera preserves parallax and clips the building side of the frontage',()=>{
 const camera=new THREE.PerspectiveCamera(65,1,.07,220),mapped=new THREE.PerspectiveCamera();
 camera.position.set(0,1.7,6.3);camera.rotation.y=Math.PI;
 const frontage={position:[14,.12,3],yaw:-Math.PI/2};
 const plane=mapShopCamera(camera,mapped,frontage);
 assert.ok(mapped.position.distanceTo(new THREE.Vector3(14,1.82,3))<1e-6);
 assert.ok(mapped.getWorldDirection(new THREE.Vector3()).distanceTo(new THREE.Vector3(-1,0,0))<1e-6);
 assert.ok(plane.distanceToPoint(new THREE.Vector3(13,1,3))>0);
 assert.ok(plane.distanceToPoint(new THREE.Vector3(15,1,3))<0);
 camera.position.x=1;mapShopCamera(camera,mapped,frontage);assert.ok(Math.abs(mapped.position.z-4)<1e-6);
});

test('street renders behind the room and restores renderer state, including after failure',()=>{
 const scene=new THREE.Scene(),town=new THREE.Group(),room=new THREE.Group(),hands=new THREE.Group();scene.add(town,room,hands);scene.background=new THREE.Color('blue');town.visible=false;
 const camera=new THREE.PerspectiveCamera(65,1,.07,220);camera.position.set(0,1.7,3);camera.rotation.y=Math.PI;
 const calls=[],background=scene.background,clipping=[];
 const renderer={autoClear:true,clippingPlanes:clipping,render(s,c){calls.push({town:town.visible,room:room.visible,hands:hands.visible,background:s.background,camera:c});},clearDepth(){calls.push('depth');}};
 const view=createShopStreetView(),args={renderer,scene,camera,town,room,frontage:{position:[0,0,0],yaw:0}};
 view.render(args);assert.equal(calls.length,3);assert.equal(calls[0].town,true);assert.equal(calls[0].room,false);assert.equal(calls[0].hands,false);assert.equal(calls[1],'depth');assert.equal(calls[2].background,null);assert.equal(calls[2].room,true);
 assert.equal(scene.background,background);assert.equal(renderer.clippingPlanes,clipping);assert.equal(renderer.autoClear,true);assert.equal(town.visible,false);assert.equal(hands.visible,true);
 calls.length=0;camera.rotation.y=0;view.render(args);assert.equal(calls.length,1,'No extra street pass when looking away from the windows');
 camera.rotation.y=Math.PI;renderer.render=()=>{throw Error('render failure');};assert.throws(()=>view.render(args),/render failure/);assert.equal(town.visible,false);assert.equal(room.visible,true);assert.equal(hands.visible,true);assert.equal(scene.background,background);assert.equal(renderer.clippingPlanes,clipping);
});

test('steamed bun has a flat resting base, rounded belly and folded crown',()=>{
 const g=createSteamedBunGeometry(),p=g.attributes.position;
 assert.ok(Math.abs(g.boundingBox.min.y)<1e-6);assert.ok(g.boundingBox.max.y>.068&&g.boundingBox.max.y<.076);
 const crown=[];for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)));if(p.getY(i)>.066)crown.push(Math.hypot(p.getX(i),p.getZ(i)));}
 assert.ok(crown.length>64);assert.ok(g.attributes.color.count===p.count);g.dispose();
});

test('the outgoing shop view excludes coplanar glass and duplicate sashes while retaining the exterior awning',()=>{
 const scene=new THREE.Scene(),town=new THREE.Group(),room=new THREE.Group();scene.add(town,room);town.visible=false;
 const camera=new THREE.PerspectiveCamera(65,1.6,.15,480);camera.position.set(-4.3,1.7,2.54);camera.lookAt(-4.3,2.01,6.34);
 const frontage={position:[-7.43,.18,-27.3],yaw:Math.PI/2,interiorZ:3.91};let passes=0;
 const renderer={autoClear:true,clippingPlanes:[],clearDepth(){},render(){if(!town.visible)return;passes++;const plane=this.clippingPlanes[0];
  for(const offset of [0,.04,.08,.12])assert.ok(plane.distanceToPoint(new THREE.Vector3(frontage.position[0]+offset,1.5,-27.3))<0,'Glass and exterior sash must be behind the clipping plane');
  assert.ok(plane.distanceToPoint(new THREE.Vector3(frontage.position[0]+.3,2.7,-27.3))>0,'Actual awning remains outside');
 }};
 createShopStreetView().render({renderer,scene,camera,town,room,frontage});assert.equal(passes,1);assert.ok(SHOP_STREET_PORTAL_CLEARANCE>.12);
});

test('window pass excludes geometry behind walls and restores shadows and hidden objects',()=>{
 const scene=new THREE.Scene(),town=new THREE.Group(),room=new THREE.Group();scene.add(town,room);town.visible=false;
 const add=(x,y,z)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),new THREE.MeshBasicMaterial());mesh.position.set(x,y,z);town.add(mesh);return mesh;};
 const visible=add(0,1,2),behind=add(0,1,-5),above=add(0,8,2),side=add(25,1,2),alreadyHidden=add(1,1,2);alreadyHidden.visible=false;
 const camera=new THREE.PerspectiveCamera(100,1.6,.07,220);camera.position.set(0,1.7,0);camera.rotation.y=Math.PI;
 const renderer={shadowMap:{enabled:true},autoClear:true,clippingPlanes:[],clearDepth(){},render(s,c){if(town.visible){assert.equal(renderer.shadowMap.enabled,false);assert.equal(s.matrixWorldAutoUpdate,false);assert.ok(visible.visible);for(const o of [behind,above,side,alreadyHidden])assert.equal(o.visible,false);}}};
 const view=createShopStreetView(),args={renderer,scene,camera,town,room,frontage:{position:[0,0,0],yaw:0}};view.render(args);
 assert.equal(view.stats.visible,1);assert.equal(view.stats.culled,4);assert.equal(renderer.shadowMap.enabled,true);assert.equal(scene.matrixWorldAutoUpdate,true);
 for(const o of [behind,above,side])assert.ok(o.visible);assert.equal(alreadyHidden.visible,false);
 renderer.render=()=>{throw Error('failed');};assert.throws(()=>view.render(args));assert.equal(renderer.shadowMap.enabled,true);assert.equal(scene.matrixWorldAutoUpdate,true);assert.ok(behind.visible);assert.equal(alreadyHidden.visible,false);
});

test('large street batches submit selected cells while preserving original geometry and shared buffers',()=>{
 const geometry=new THREE.BufferGeometry(),positions=[];
 for(const x of [-20,0,20])for(let i=0;i<400;i++)positions.push(x,0,0,x+1,0,0,x,1,1);
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());mesh.position.x=3;mesh.updateMatrixWorld(true);
 const batch=createWindowBatch(mesh);assert.ok(batch);assert.equal(batch.totalTriangles,1200);
 assert.equal(batch.geometry.attributes.position,geometry.attributes.position,'No second vertex buffer');
 assert.ok(batch.select(bounds=>bounds.min.x>0&&bounds.max.x<10));assert.equal(batch.triangles,400);
 assert.equal(batch.geometry.drawRange.count,1200);assert.equal(mesh.geometry,geometry);assert.equal(geometry.index,null);
 const version=batch.geometry.index.version;batch.select(bounds=>bounds.min.x>0&&bounds.max.x<10);assert.equal(batch.geometry.index.version,version,'Stationary views do not re-upload indices');
 assert.equal(batch.select(()=>false),false);assert.equal(batch.geometry.drawRange.count,0);
 batch.select(()=>true);assert.equal(batch.geometry.drawRange.count,positions.length/3);
});


test('the first window view does not partition hidden or offscreen town geometry',()=>{
 const scene=new THREE.Scene(),town=new THREE.Group(),room=new THREE.Group();scene.add(town,room);town.visible=false;
 const counts=new Map();
 const add=(name,x,z,parent=town)=>{
  const g=new THREE.PlaneGeometry(4,4,30,30),m=new THREE.Mesh(g,new THREE.MeshBasicMaterial());m.name=name;m.position.set(x,1,z);parent.add(m);
  const get=g.index.getX.bind(g.index);g.index.getX=i=>{counts.set(name,(counts.get(name)||0)+1);return get(i);};return m;
 };
 const hidden=new THREE.Group();hidden.visible=false;town.add(hidden);
 add('hidden-parent',0,2,hidden);add('offscreen',200,2);const layer=add('unrendered-layer',0,2);layer.layers.set(31);
 add('visible',0,2);
 const camera=new THREE.PerspectiveCamera(100,1.6,.07,220);camera.position.set(0,1.7,0);camera.rotation.y=Math.PI;
 const renderer={autoClear:true,clippingPlanes:[],clearDepth(){},render(){}};
 const view=createShopStreetView();view.render({renderer,scene,camera,town,room,frontage:{position:[0,0,0],yaw:0}});
 assert.equal(counts.get('hidden-parent'),undefined);assert.equal(counts.get('offscreen'),undefined);assert.equal(counts.get('unrendered-layer'),undefined);
 assert.ok(counts.get('visible')>0,'Visible geometry is considered for spatial partitioning');
 assert.equal(view.stats.visible,1);assert.equal(hidden.visible,false);assert.equal(layer.layers.mask,2**31);
});

test('portal caches release private indices on exit without disposing borrowed street vertex buffers',()=>{
 const scene=new THREE.Scene(),town=new THREE.Group(),room=new THREE.Group();scene.add(town,room);town.visible=false;
 const geometry=new THREE.PlaneGeometry(40,4,60,30),mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());mesh.position.set(0,1,2);town.add(mesh);
 const position=geometry.attributes.position,camera=new THREE.PerspectiveCamera(100,1.6,.07,220);camera.position.set(0,1.7,0);camera.rotation.y=Math.PI;
 let released=0,removedAttributes;
 const renderer={autoClear:true,clippingPlanes:[],clearDepth(){},render(){if(mesh.geometry!==geometry&&!mesh.geometry.userData.observed){const g=mesh.geometry;g.userData.observed=true;g.addEventListener('dispose',()=>{released++;removedAttributes=Object.keys(g.attributes);});}}};
 const view=createShopStreetView(),args={renderer,scene,camera,town,room,frontage:{position:[0,0,0],yaw:0}};
 for(let i=0;i<10;i++){
  view.render(args);assert.ok(view.stats.cacheBytes>0);assert.equal(mesh.geometry,geometry);
  view.dispose();assert.equal(view.stats.cacheBytes,0);assert.deepEqual(removedAttributes,[],'Disposal cannot delete shared GPU vertex buffers');
 }
 assert.equal(released,10);view.dispose();assert.equal(released,10,'Disposal is idempotent');
 assert.equal(geometry.attributes.position,position);
});
