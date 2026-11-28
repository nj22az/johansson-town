import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {kikkouWanted,idSkips,KIKKOU_ROOMS,KIKKOU_SHIP_FLOORS} from '../src/render/kikkou-ids.js';

// Kikkou ink (the owner, 25 November 2026: "Start kikkou make the konbini first"): src/render/kikkou-ids.js and the
// composite in src/render/ink-pipeline.js.

// The owner, 28 November 2026: "How about the blahaj kikkou outlines you made in Sakura I want it one the whole world".
test('Kikkou is on everywhere: the rooms it reached first, the street, every other room, unless the address turns it off', () => {
 for(const room of ['market','sakura-office','izakaya','ramen'])assert.ok(KIKKOU_ROOMS.has(room),room);
 assert.equal(kikkouWanted('market',''),true);
 assert.equal(kikkouWanted(null,''),true,'the street');
 assert.equal(kikkouWanted('onsen',''),true,'a room it had not reached');
 assert.equal(kikkouWanted(null,'?kikkou=0'),false);
 assert.equal(kikkouWanted(null,'?kikkou=1'),true);
 assert.equal(kikkouWanted('market','?kikkou=0'),false);
 assert.equal(kikkouWanted('market','?kikkou=ids'),'ids');
 assert.equal(kikkouWanted('market','?kikkou=edge'),'edge');
});

test('see-through, decal and colourless surfaces are left out of the IDs; cut-outs and solids are not', () => {
 assert.equal(idSkips({opacity:1,depthWrite:true}),false);
 assert.equal(idSkips({opacity:.3,transparent:true,depthWrite:true}),true,'glass');
 assert.equal(idSkips({opacity:1,depthWrite:false}),true,'a decal that does not write depth');
 assert.equal(idSkips({opacity:1,depthWrite:true,colorWrite:false}),true,'a stand-in the picture never shows');
 assert.equal(idSkips({opacity:.8,transparent:true,depthWrite:true}),true,'faintly see-through');
 assert.equal(idSkips({opacity:1,transparent:true,alphaTest:.5,depthWrite:true}),false,'a cut-out keeps its shape');
 assert.equal(idSkips({opacity:1,depthWrite:true,visible:false}),true);
 assert.equal(idSkips({opacity:1,depthWrite:true,userData:{noInk:true}}),true);
});

test('the composite draws the ID line without the depth gate, at its own strength, thinning with distance', () => {
 const src=readFileSync(new URL('../src/render/ink-pipeline.js',import.meta.url),'utf8');
 assert.match(src,/float idE=uIdOn>0\.5\?idEdge\(uv\):0\.0;/,'full strength: not scaled by the town’s depth-ink strength');
 const gate=src.indexOf('if(dc>uSkyDepth)');
 assert.ok(src.indexOf('float idE=')<gate,'the ID line is found before the far-depth early return');
 assert.match(src.slice(gate,gate+120),/idE/,'and the early return still draws it');
 assert.match(src,/clamp\(uIdNear\/max\(z,0\.01\),0\.4,1\.0\)/,'thinner with distance, never under two fifths');
 assert.match(src,/drawWithoutHulls/,'the cartoon hulls are hidden while Kikkou draws the line');
});

test('aboard the Minato Maru, Kikkou is on indoors (her rooms, the engine room) and on her open decks, as on the street', async () => {
 globalThis.location??=new URL('https://example.test/');
 const {FERRY_INTERIOR}=await import('../src/world/ferry-interior.js');
 const ids=new Set(FERRY_INTERIOR.floors.map(f=>f.id));
 for(const f of KIKKOU_SHIP_FLOORS)assert.ok(ids.has(f),'a floor she has: '+f);
 for(const f of ['saloon','wheelhouse','engine-room','control-booth'])assert.equal(kikkouWanted(null,'',f),true,f);
 for(const f of ['open-deck','walkway-p','wing-s',null])assert.equal(kikkouWanted(null,'',f),true,String(f));
});

test('the town\u2019s Sakura storefront slab lies under the shop\u2019s own floor, not in its plane (z-fighting from the street)', () => {
 // The shop's floor is drawn through the window at y 0.18 (measured in the running game); the storefront's slab was 0.18 high.
 const src=readFileSync(new URL('../src/world/storefront.js',import.meta.url),'utf8');
 const m=src.match(/box\(\[width,(\.\d+),depth\],\[0,(\.\d+),mid\]/);
 assert.ok(m,'the slab');assert.ok(+m[1]<=.165,'its top at least 15 mm under 0.18');assert.equal(+m[2],+m[1]/2,'standing on the ground');
});

test('a decal keeps its polygon offset in the IDs, so its ID never fights its backing’s', async () => {
 // (26 November 2026, the z-fighting audits: the ID material dropped the offset, so a floor marking, a plate or a poster
 // was drawn at its backing's depth here, the two IDs fought, and the line drawn where the ID changes scribbled across it.)
 const THREE=await import('../vendor/three.module.js');
 const {createKikkouIds}=await import('../src/render/kikkou-ids.js');
 const seen=new Map(),renderer={getRenderTarget:()=>null,setRenderTarget(){},getClearColor:c=>c,getClearAlpha:()=>1,setClearColor(){},clear(){},
  autoClear:true,shadowMap:{autoUpdate:true,needsUpdate:false},render(scene){scene.traverse(o=>{if(o.isMesh)seen.set(o.name,o.material);});}};
 const scene=new THREE.Scene(),plane=new THREE.PlaneGeometry(1,1);
 const decal=new THREE.Mesh(plane,new THREE.MeshStandardMaterial({polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4}));decal.name='decal';
 const backing=new THREE.Mesh(plane,new THREE.MeshStandardMaterial());backing.name='backing';scene.add(decal,backing);
 const ids=createKikkouIds(renderer);ids.render(r=>r.render(scene,new THREE.PerspectiveCamera()),8,8);
 const d=seen.get('decal'),b=seen.get('backing');
 assert.equal(d.name,'Kikkou ID');assert.notEqual(d,b,'one ID material per source material');
 assert.deepEqual([d.polygonOffset,d.polygonOffsetFactor,d.polygonOffsetUnits],[true,-1,-4]);
 assert.deepEqual([b.polygonOffset,b.polygonOffsetFactor,b.polygonOffsetUnits],[false,0,0]);
 assert.equal(decal.material.isMeshStandardMaterial,true,'the picture’s own materials are put back');
 ids.dispose();
});
