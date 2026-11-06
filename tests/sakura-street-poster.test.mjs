import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {SAKURA_STREET_POSTER as P,addSakuraStreetPoster} from '../src/world/sakura-street-poster.js';
import {coplanarOverlaps} from '../tools/z-fighting.mjs';
import {measurePosterSurroundings} from '../tools/street-poster-audit.mjs';
import {PRODUCT_BY_ID} from '../src/commerce/products-data.js';
import {SAKURA_HOURS_TEXT} from '../src/commerce/sakura-rota.js';
import {readFileSync} from 'node:fs';

/** The owner (24 October 2026): "make a poster we can put on the wall on another building", "maybe the ice cream shop".
 * Drawing SP-NK-001 rev C. */
test('the poster sits on its board on the ice-cream shop’s south wall, clear of its window, with nothing in front',async()=>{
 installDOM();const root=new THREE.Group(),g=addSakuraStreetPoster(root);root.updateMatrixWorld(true);
 const board=new THREE.Box3().setFromObject(g.getObjectByName('Sakura street poster board'));
 const paper=g.getObjectByName('Sakura street poster print');
 assert.ok(board.min.x>P.wall.window[1]+.3&&board.max.x<P.wall.to-.3,'between the window and the back corner, 300 mm clear of each');
 assert.ok(board.min.y>.6&&board.max.y<P.wall.firstFloor/1000-.3,'at eye level, under the first floor');
 assert.ok(Math.abs(board.max.z-P.wallFace)<1e-6,'on the plaster, not in the air');
 const n=new THREE.Vector3(0,0,1).applyQuaternion(paper.getWorldQuaternion(new THREE.Quaternion()));
 assert.ok(n.z<-.99,'the print faces down Main Street (-z)');
 assert.deepEqual(coplanarOverlaps(root,{tolerance:.002,minArea:.0004}),[],'no face fights another');
 // measured in the built town, not from a list (rev A on the warehouse hung behind a sign no list had)
 const r=await measurePosterSurroundings();
 assert.deepEqual(r.intruders,[],'nothing of the town stands in front of or over the poster');
});

test('what the poster says is what Sakura sells, at its price and hours',()=>{
 assert.equal(PRODUCT_BY_ID.tea?.price??PRODUCT_BY_ID.get?.('tea')?.price,120,'NAGI green tea ¥120, as the roundel says');
 assert.equal(SAKURA_HOURS_TEXT,'9:00–20:30','the foot prints Open 9:00–20:30');
 const webp=readFileSync(new URL('../assets/'+P.asset,import.meta.url));
 assert.ok(webp.length>20000&&webp.subarray(8,12).toString()==='WEBP','the printed poster ships with the game');
});
