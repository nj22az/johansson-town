import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {kikkouWanted,idSkips,KIKKOU_ROOMS,KIKKOU_SHIP_FLOORS} from '../src/render/kikkou-ids.js';

// Kikkou ink (the owner, 25 November 2026: "Start kikkou make the konbini first"): src/render/kikkou-ids.js and the
// composite in src/render/ink-pipeline.js.

test('Kikkou is on in Sakura (room "market") and the two dining rooms, and nowhere else yet, unless the address asks', () => {
 for(const room of ['market','izakaya','ramen'])assert.ok(KIKKOU_ROOMS.has(room),room);
 assert.equal(kikkouWanted('market',''),true);
 assert.equal(kikkouWanted(null,''),false);
 assert.equal(kikkouWanted('onsen',''),false);
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

test('aboard the Minato Maru, Kikkou is on indoors (her rooms, the engine room) and off on her open decks', async () => {
 globalThis.location??=new URL('https://example.test/');
 const {FERRY_INTERIOR}=await import('../src/world/ferry-interior.js');
 const ids=new Set(FERRY_INTERIOR.floors.map(f=>f.id));
 for(const f of KIKKOU_SHIP_FLOORS)assert.ok(ids.has(f),'a floor she has: '+f);
 for(const f of ['saloon','wheelhouse','engine-room','control-booth'])assert.equal(kikkouWanted(null,'',f),true,f);
 for(const f of ['open-deck','walkway-p','wing-s',null])assert.equal(kikkouWanted(null,'',f),false,String(f));
});
