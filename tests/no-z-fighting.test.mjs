import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';

/**
 * No flashing surfaces in Minato (the owner, 20 October 2026, playing on his iPhone: "Lots of flashing meshes"). Two faces
 * that look the same way, lie within 2 mm of one plane and overlap are drawn at one depth, and a phone's depth buffer
 * picks a different winner from frame to frame: the facade glass in the sliding door's plane, the earth of a raised bed in
 * its edging boards' faces, a corner post in its wall's, the signboard rails in the board's. tools/z-fighting.mjs finds
 * them in the town as the game builds it (each piece of a merged mesh by the line that made it, a face hidden inside
 * another solid left out, decal layers drawn with polygon offset left out). 2 mm is what a 24-bit depth buffer with the
 * game's near plane (0.15 m, game.js) still separates at about 70 m; nothing in town may flash over more than 0.05 m².
 */
installDOM();globalThis.self=globalThis;
// The kit and the static batches record which line made each merged piece, so a finding names its source.
globalThis.__KIT_TRACE__=true;
const {createTown}=await import('../src/world/town.js');const {createBusinesses}=await import('../src/world/businesses.js');
const {coplanarOverlaps}=await import('../tools/z-fighting.mjs');
const scene=new THREE.Scene();
const town=createTown({scene,sites:createBusinesses(),townMode:'peninsula',mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
delete globalThis.__KIT_TRACE__;
scene.updateMatrixWorld(true);

/** The places the owner photographed: there, nothing over 0.01 m² (a hand's breadth square) may flash. */
const OWNER={
 'Sakura Shōten, its office storey and side walls':{minX:-22,maxX:-4.5,minZ:-37,maxZ:-17},
 'the Minato izakaya and Sato Ramen':{minX:-17,maxX:-5.5,minZ:-17,maxZ:-4},
 'Minato Police Station':{minX:4,maxX:14,minZ:13,maxZ:32},
 'Nakamura Zenzai':{minX:2,maxX:15,minZ:-16,maxZ:-3},
 // The park rework (21 October 2026): its beds, pond, footbath, guide board and the gajumaru's bench.
 'Harbour Park and Umi-no-yu\'s forecourt':{minX:5.2,maxX:33.2,minZ:-37,maxZ:-3.6},
};
/** All of Minato: Main Street, Kitahama, the police station, the docks and the port building, and everything between. */
const MINATO={minX:-45,maxX:45,minZ:-52,maxZ:66};
// What moves is not scenery: the boats under way, the traffic, the birds and the crabs are placed by the clock.
const moving=o=>{for(let p=o;p;p=p.parent)if(p.userData.dynamicProp||p.userData.vehicle||/^(Scheduled island cargo ship|Road traffic|Harbour gulls and garden butterflies|Beach life)$/.test(p.name))return true;return false;};
const TOLERANCE=.002,MIN_AREA=.05,OWNER_AREA=.01;
const found=coplanarOverlaps(scene,{regions:[MINATO],tolerance:TOLERANCE,minArea:OWNER_AREA,skip:moving});
const inside=(f,b)=>f.at[0]>=b.minX&&f.at[0]<=b.maxX&&f.at[2]>=b.minZ&&f.at[2]<=b.maxZ;
const where=f=>`${f.a} | ${f.b}: ${f.area.toFixed(3)} m² at ${f.at.join(', ')} facing ${f.normal.join(', ')}`;

test('no two surfaces in Minato share a plane over more than 0.05 m² (the flashing the owner saw)',()=>{
 assert.deepEqual(found.filter(f=>f.area>=MIN_AREA).map(where),[]);
});

for(const [name,box] of Object.entries(OWNER))test(`${name}: nothing over 0.01 m² flashes`,()=>{
 assert.deepEqual(found.filter(f=>inside(f,box)).map(where),[]);
});

test('Nakamura Zenzai after hours: the shutter down over the counter shares no plane with the opening or the box',()=>{
 town.blueCoral.update(20*60+30);scene.updateMatrixWorld(true);
 const shut=coplanarOverlaps(scene,{regions:[OWNER['Nakamura Zenzai']],tolerance:TOLERANCE,minArea:OWNER_AREA,skip:moving});
 town.blueCoral.update(12*60);
 assert.ok(scene.getObjectByName('Nakamura shutter'),'the shutter is in the town');
 assert.deepEqual(shut.map(where),[]);
});

test('Kissa Higa and the coin laundry: the front open and shut, the paper on the shutter, and the turning machines share no plane',()=>{
 // The two buildings and their pavements only (Kissa Higa, the old Higa Liquor, on the east row; the coin laundry on the
 // yard row). Since 30 October 2026 Kissa Higa's front follows its clock (commerce/kissa-higa.js): open on a weekday
 // morning (the shutter up, the doors slid behind the fixed panes, the board out), shut with its paper on the shutter
 // the rest of the day. (Its three Meshy models stream in near the shop and are not in this static town.)
 const shops=[{minX:2,maxX:15,minZ:4,maxZ:12.5},{minX:-17,maxX:-6,minZ:16,maxZ:25}],{higa,coinLaundry}=town.quarters;
 // A Wednesday (town day 10002): twenty to eight with the kissaten open, two in the afternoon, ten at night (the
 // doctor's washing in the dryer and her basket on the counter).
 for(const minutes of [10002*1440+7*60+40,10002*1440+14*60,10002*1440+22*60]){
  higa.update(minutes);assert.equal(higa.shutter.visible,minutes%1440>12*60,'the shutter is down outside its hours');
  coinLaundry.update(minutes,{machine:'W1',start:minutes-5});scene.updateMatrixWorld(true);
  assert.deepEqual(coplanarOverlaps(scene,{regions:shops,tolerance:TOLERANCE,minArea:OWNER_AREA,skip:moving}).map(where),[],'at '+(minutes%1440)/60);
 }
 higa.update(12*60);coinLaundry.update(12*60);
});

test('the scan finds what it is for: a pane laid in a wall, and nothing where a decal is offset or a face is buried',()=>{
 const g=new THREE.Group(),wall=new THREE.Mesh(new THREE.BoxGeometry(2,2,.2),new THREE.MeshStandardMaterial({color:0xeeeeee}));wall.position.z=-.1;g.add(wall);
 const pane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshStandardMaterial({color:0x335577}));pane.position.z=.0005;g.add(pane);
 assert.equal(coplanarOverlaps(g).length,1,'a pane half a millimetre off its wall flashes');
 pane.material.polygonOffset=true;pane.material.polygonOffsetFactor=-1;pane.material.polygonOffsetUnits=-1;
 assert.equal(coplanarOverlaps(g).length,0,'drawn with polygon offset, it does not');
 pane.material.polygonOffset=false;pane.position.z=.01;
 assert.equal(coplanarOverlaps(g).length,0,'a centimetre proud, it does not');
 // A box flush with a bigger box's face, inside the third: never seen.
 const hidden=new THREE.Group(),a=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0xff0000})),b=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),new THREE.MeshStandardMaterial({color:0x00ff00}));
 b.position.set(0,0,.25);hidden.add(a,b);const cover=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,.4),new THREE.MeshStandardMaterial({color:0x0000ff}));cover.position.z=.6;hidden.add(cover);
 assert.equal(coplanarOverlaps(hidden).length,0,'faces buried in another solid are not reported');
 cover.removeFromParent();assert.equal(coplanarOverlaps(hidden).length,1,'uncovered, they are');
});

/**
 * Indoors, at the size a phone shows. The scan above is the town as createTown builds it, and a room is not in it: each
 * is built when he walks in. So the flicker the owner photographed in Sakura's office hall (20 October 2026: "Lots of Z
 * fighting in the upper office on Sakura") was never looked at: the stair's top landing was a second floor laid in the
 * hall's (2.57 m² in one plane, by the slippers and the fire door), and the door plates stood 1.5 mm off their
 * backings. And 0.05 m² and 0.01 m² are sizes for a street seen from 5 to 70 m. In a room everything is a metre or two
 * from the lens: on a phone held upright (844 points high, a 70° lens) a 2.2 cm square two metres away is about 7 points,
 * 20 pixels, a flashing patch anyone sees. So rooms are scanned unmerged (every piece by its name) down to 0.0005 m².
 * The same scan of origin/main 01918368's office storey (sakura-stairs.js buildSakuraStoreys) finds 19 such pairs.
 */
const ROOM_AREA=.0005;
const {buildSakuraOfficeRoom}=await import('../src/world/interiors/sakura-office-room.js');
const {buildSakuraInterior}=await import('../src/world/interiors/sakura-interior.js');
function officeStorey(){const room=new THREE.Group();buildSakuraOfficeRoom({room,reg(){},action(){},downstairs(){},evacuate(){},merge:false});room.updateMatrixWorld(true);return room;}
const inRoom=(room,regions)=>coplanarOverlaps(room,{regions,tolerance:TOLERANCE,minArea:ROOM_AREA});

test('Sakura’s office storey (office, rest room, kitchenette, hall and stair head): nothing over 0.0005 m² flashes',()=>{
 assert.deepEqual(inRoom(officeStorey(),null).map(where),[]);
});

test('Sakura’s stockroom stair: the treads, the walls and the darkness they go into share no plane',async()=>{
 const room=new THREE.Group(),d=buildSakuraInterior({room,reg(){},action(){},exit(){}});await d.ready();room.updateMatrixWorld(true);
 // The stairwell (the lower flight and the dark west of it) and the opening over the stockroom's ceiling.
 const found=inRoom(room,[{minX:-5.75,maxX:-1.75,minZ:-6.9,maxZ:-4.0},{minX:-2.95,maxX:-.6,minZ:-6.9,maxZ:-4.0,minY:2.5}]);
 assert.deepEqual(found.map(where),[]);
});

test('the indoor scan catches the owner’s flicker: the old top landing laid in the hall’s floor, a plate 1.5 mm off its backing',()=>{
 const room=officeStorey();
 // The old landing (origin/main sakura-stairs.js: 1.2 × 0.12 × 2.7 m at the office floor), in the office's frame.
 const landing=new THREE.Mesh(new THREE.BoxGeometry(1.2,.12,2.7),new THREE.MeshStandardMaterial({color:0x8d7458}));landing.position.set(-1.2,-.06,-4.71);landing.name='Old top landing';room.add(landing);
 const found=inRoom(room,null);
 assert.ok(found.some(f=>/Old top landing/.test(f.a+f.b)&&f.normal[1]===1&&f.area>1),'the landing on the hall floor is found');
 landing.removeFromParent();
 // A door plate as it was: its face 1.5 mm in front of a 12 mm backing.
 const backing=new THREE.Mesh(new THREE.BoxGeometry(.38,.14,.012),new THREE.MeshStandardMaterial({color:0x5e4630})),plate=new THREE.Mesh(new THREE.PlaneGeometry(.36,.12),new THREE.MeshStandardMaterial({color:0xefe6d0}));
 const g=new THREE.Group();backing.position.set(0,2.25,0);plate.position.set(0,2.25,.0075);g.add(backing,plate);
 assert.equal(inRoom(g,null).length,1,'a plate 1.5 mm off its backing flashes');
 plate.position.z=.012;assert.equal(inRoom(g,null).length,0,'6 mm off, as the plates are now, it does not');
 // And at the street's size it would have passed: why the indoor scan has its own.
 plate.position.z=.0075;assert.equal(coplanarOverlaps(g,{tolerance:TOLERANCE,minArea:MIN_AREA}).length,0);
});

// Sensitivity proof at the owner's station threshold, in the real region (not a mock scan elsewhere).
test('station owner region detects a planted 0.04 m² pane 0.5 mm off its street wall',()=>{
 const pane=new THREE.Mesh(new THREE.PlaneGeometry(.2,.2),new THREE.MeshStandardMaterial({color:0xff00ff}));
 pane.rotation.y=-Math.PI/2;pane.position.set(5.6995,2.3,18);pane.name='Planted station flashing pane';scene.add(pane);
 const fault=coplanarOverlaps(scene,{regions:[OWNER['Minato Police Station']],tolerance:TOLERANCE,minArea:OWNER_AREA,skip:moving});
 pane.removeFromParent();pane.geometry.dispose();pane.material.dispose();
 assert.ok(fault.some(f=>/Planted station flashing pane/.test(f.a+f.b)&&f.area>=.01),'planted fault must fail the station gate');
});
