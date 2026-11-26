import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';

/**
 * No near-coplanar faces in Johansson Town's rooms (the owner, 26 November 2026, on his iPad: "Lots of z fighting I thought
 * we eliminated it", "no z fighting allowed"). tools/near-coplanar.mjs sets how near two faces may lie from what the depth
 * buffer tells apart at the distance they are seen from (its header has the arithmetic), and checks what the coplanar
 * scan (tests/no-z-fighting.test.mjs) was blind to: every room the game opens, built as the game builds it, and in the
 * rooms drawn with the Kikkou line, the line's own ID pass (two alike objects in one plane; a decal, which that pass draws
 * without its polygon offset). Audit: docs/qa/ZFIGHT-AUDIT-2026-11-26.md.
 */
installDOM();globalThis.self=globalThis;
const {DEPTH,depthStep,requiredGap,nearCoplanar,describe}=await import('../tools/near-coplanar.mjs');

test('the threshold is the depth buffer’s arithmetic: 4 steps at the farthest an overlap still shows, 2 mm at least',()=>{
 const mm=v=>+(v*1000).toFixed(2);
 assert.deepEqual([1,10,30,50,70,100].map(z=>+(depthStep(z)*1000).toFixed(4)),[.0004,.0397,.3575,.9932,1.9466,3.9727]);
 assert.equal(mm(requiredGap(.0005,20)),2,'a room: the 2 mm floor decides');
 assert.equal(mm(requiredGap(.01)),2.45,'a hand’s breadth in the street, seen from 39 m');
 assert.equal(mm(requiredGap(1)),15.89,'a shop front, seen from 100 m');
 assert.equal(DEPTH.near,.15,'game.js camera near plane');
});

test('the check finds what the coplanar scan missed, and nothing where a face is far enough off',()=>{
 const wall=()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(2,2,.2),new THREE.MeshStandardMaterial({color:0xeeeeee}));m.position.z=-.1;return m;};
 // A signboard 5 mm proud of a street front: fine in a room, a flicker from 100 m.
 const g=new THREE.Group(),board=new THREE.Mesh(new THREE.PlaneGeometry(1,.5),new THREE.MeshStandardMaterial({color:0x335577}));board.position.z=.005;g.add(wall(),board);
 assert.equal(nearCoplanar(g,{maxDistance:100}).length,1,'5 mm off a front seen from 100 m');
 assert.equal(nearCoplanar(g,{maxDistance:12}).length,0,'5 mm off a wall in a room');
 // A decal in its backing's plane: told apart by its offset in the picture, not in the Kikkou IDs.
 const d=new THREE.Group(),decal=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5),new THREE.MeshStandardMaterial({color:0xff0000,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4}));d.add(wall(),decal);
 assert.equal(nearCoplanar(d,{maxDistance:12}).length,0,'the picture: the offset parts them');
 assert.deepEqual(nearCoplanar(d,{maxDistance:12,ink:true}).map(f=>f.kind),['decal'],'the Kikkou IDs: drawn without the offset');
 // Two pieces alike lying in one plane: one look in the picture, two IDs in the Kikkou line.
 const a=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0x888888}),p=new THREE.Mesh(new THREE.BoxGeometry(1,.1,.05),mat),q=new THREE.Mesh(new THREE.BoxGeometry(.1,1,.05),mat);a.add(p,q);
 assert.equal(nearCoplanar(a,{maxDistance:12}).length,0,'alike, the picture cannot tell them apart');
 assert.ok(nearCoplanar(a,{maxDistance:12,ink:true}).some(f=>f.kind==='ink'),'the Kikkou line can');
});

/**
 * Every room, as the game builds it: what is still on file, by place, with the reason it is not fixed yet. A place not
 * named here may have none; a place named may not have more. When one is fixed, lower its number (or drop the line).
 * Fixed on 26 November 2026 and so not here: Tetsuo's floors (house-plan.js cuts a finish into another), Johansson's
 * window views (each at a distance of its own), the town hall's and the harbour office's skirting and rails (on the dado's
 * face), the police station's futon, cabinet, telephone and boot rack, Sakura's sliding doors, refrigerator doors and hot
 * case (stiles take the corners), and the stockroom's Tanabata star (it stood in the beer crates).
 */
const ON_FILE={
 'school':{max:33,reason:'classroom.js builds unnamed meshes, batched by static-props.js: flush desks, boards and cupboards, not yet traced to their lines'},
 'mayor-home':{max:60,reason:'Johansson’s house shell (johansson-house-interior.js shell(), lines 181, 195, 206, 218, 224): wall and slab blocks end in each other’s faces at every storey; the walls need rule 2 (one takes the corner, the other butts)'},
 'onsen':{max:43,reason:'Umi-no-yu: signs 1 mm off their frames and the breaker labels 1.2 mm off the plate without polygon offset, the CRT glass 1.5 mm off the set, bath-wall pieces and ceiling beams ending in the walls’ faces'},
 'market':{max:39,reason:'Kikkou only: 26 prints 0.4–0.5 mm off their packs and bottles, which the ID pass draws without their polygon offset (one global fix: kikkou-ids.js idFor copies the offset); 13 alike pieces of the specials board, the shelf ends and the restroom fan in one plane'},
 'form3d':{max:22,reason:'the shared workshop shell (world-room workshop-shell: plaster rear wall in the side walls’ plane), merged corner pieces and tool grips'},
 'frontrow':{max:18,reason:'the bookcases’ backs flush with their timber, books touching, and the same workshop shell'},
 'ferry-terminal':{max:15,reason:'port-hall.js: the door frame in the glass doors’ plane, the ceiling crossbeam in the spine’s, dado ends in the walls'},
 'office':{max:14,reason:'office-workplace.js: the filing cabinet’s back, sides and shelves flush, the desk’s modesty panel in the desk run, partition posts in the screens'},
 'resident-home-kenji':{max:13,reason:'Tetsuo’s flat: the shoji frames in their paper’s plane, the kotatsu leg in the quilt, the fridge’s doors'},
 'koban':{max:8,reason:'police-station.js lines 144–149, 205 and 237: the front counter’s and the desks’ pieces flush'},
 'clinic':{max:6,reason:'town-hall.js clinic: the sample hatch in its partition, the cabinet glass, the WC plate on the head beam, the desk drawers'},
 'home-higa':{max:6,reason:'family-home.js: the outer wall’s skirting ends (0.012 m²), a notebook lying on a recipe book, the DK floor at the genkan step'},
 'home-kitahama-3':{max:6,reason:'family-home.js, as home-higa'},
 'home-kitahama-8':{max:6,reason:'family-home.js, as home-higa'},
 'home-kitahama-flat-3':{max:6,reason:'family-home.js, as home-higa'},
 'home-kitahama-flat-4':{max:6,reason:'family-home.js, as home-higa'},
 'home-kitano-2':{max:6,reason:'family-home.js, as home-higa'},
 'resident-home-thuan':{max:3,reason:'1 Kitahama: the cassette player lying on a school book, two books, the genkan step'},
 'community-kitchen':{max:2,reason:'town-hall.js: the WC plate on the doorway head beam, the request box on the wall'},
 'sakura-office':{max:2,reason:'Kikkou only: the stair plates 0.5 mm off the stairwell fitting (the global ID-pass fix)'},
 'warehouse':{max:2,reason:'the inside door’s jamb and lintel, merged, end in each other'},
};

test('every room the game opens: nothing near-coplanar but what is on file, place by place',{timeout:600000},async()=>{
 globalThis.__KIT_TRACE__=true;
 const {buildWorld,rooms,scanRoom}=await import('../tools/zfight-audit.mjs');
 const world=await buildWorld(),list=rooms(world),over=[],seen=new Set();
 assert.ok(list.size>=25,'the town still has its rooms ('+list.size+')');
 for(const [id,r] of list){
  const {found}=await scanRoom(id,r);seen.add(id);
  const allowed=ON_FILE[id]?.max??0;
  if(found.length>allowed)over.push(`${id}: ${found.length} pairs, ${allowed} on file\n    `+found.slice(0,12).map(describe).join('\n    '));
 }
 delete globalThis.__KIT_TRACE__;
 for(const id of Object.keys(ON_FILE))assert.ok(seen.has(id),`${id} is on file but no longer a room`);
 assert.deepEqual(over,[],'\n  '+over.join('\n  '));
});
