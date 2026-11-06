import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildOnsenInterior,ONSEN_ROOM,ONSEN_SEATS,ROCK_RING} from '../src/world/interiors/onsen.js';
import {ONSEN_DOORWAYS,ONSEN_NOREN,onsenSide} from '../src/world/interiors/onsen-lobby.js';
import {ONSEN_SIGNS} from '../src/world/interiors/onsen-signs.js';
import {ONSEN_RACEWAY} from '../src/world/interiors/onsen-electrics.js';
import {RESIDENTS} from '../src/people/residents.js';
import {createIndoorResidents} from '../src/people/indoor-residents.js';
import {createNavigation} from '../src/people/navmesh.js';
import {ONSEN_DOOR} from '../src/world/onsen-layout.js';
import {recipeFor} from '../src/avatars/cast.js';
import {circleHitsRect} from '../physics.js';

// The creator's decision after the architect's audit (A1): Umi-no-yu is a 男湯 and a 女湯, like every town bath of the period.
const build=()=>{const room=new THREE.Group(),hits=[];const layout=buildOnsenInterior({room,reg:(o,label,fn)=>hits.push({o,label,fn}),action(){},exit(){}});room.updateMatrixWorld(true);return {room,hits,layout};};
const meshes=root=>{const all=[];root.traverse(o=>{if(o.isMesh)all.push(o);});return all;};
const box=o=>new THREE.Box3().setFromObject(o);
const centre=o=>box(o).getCenter(new THREE.Vector3());
const blockedFor=(layout,who)=>(x,z,r=.3)=>layout.colliders.some(c=>(!c.only||c.only===who)&&circleHitsRect(x,z,r,c));
const H=ONSEN_ROOM.hall;

test('two noren, crimson 女 west and indigo 男 east, a short wall between them and a partition to the bath doors',()=>{
 const {room,layout}=build();
 assert.equal(ONSEN_SIGNS.norenWomen.jp,'女');assert.equal(ONSEN_SIGNS.norenMen.jp,'男');
 assert.notEqual(ONSEN_SIGNS.norenWomen.colour,ONSEN_SIGNS.norenMen.colour,'two colours of cloth');
 const W=ONSEN_DOORWAYS.women,M=ONSEN_DOORWAYS.men;
 assert.ok(W.x1<0&&M.x0>0&&W.x1-W.x0>=.8&&M.x1-M.x0>=.8,'two openings, each wide enough to walk through');
 for(const [name,D] of [['Women’s noren',W],['Men’s noren',M]]){
  const panels=[];room.traverse(o=>{if(o.name===name)panels.push(o);});assert.equal(panels.length,2,name+': two panels with a slit');
  for(const p of panels){const b=box(p);assert.ok(b.min.x>=D.x0-.001&&b.max.x<=D.x1+.001,name+' hangs in its own doorway');assert.ok(Math.abs(b.min.y-ONSEN_NOREN.hem)<.005&&Math.abs(b.max.y-ONSEN_NOREN.top)<.005,name+' hangs from the rod to its hem at '+ONSEN_NOREN.hem+' m');}
 }
 // The partition: plaster from the noren wall to the bath doors at x 0, full height, solid for everybody.
 const walls=meshes(room).filter(m=>m.userData.wall).map(box);
 const partition=walls.find(b=>b.min.x>-.1&&b.max.x<.1&&b.min.z<=H.changing+.01&&b.max.z>=H.front-.01);
 assert.ok(partition,'a partition at x 0 from z '+H.changing+' to '+H.front);assert.ok(partition.max.y>=ONSEN_ROOM.walls.height-.01,'to the ceiling');
 const stub=walls.find(b=>b.min.x>=W.x1-.001&&b.max.x<=M.x0+.001&&Math.abs((b.min.z+b.max.z)/2-H.front)<.02);assert.ok(stub,'a short wall between the two noren');
 for(const who of ['player','resident'])for(const z of [1.6,1,0,-1])assert.ok(blockedFor(layout,who)(0,z,.05),'nobody walks through the partition at z '+z);
 // The raceway was drilled through it: one run each side, end caps at its faces.
 const runs=ONSEN_RACEWAY.runs.filter(r=>r.wall.startsWith('bandai wall'));assert.equal(runs.length,2);
 layout.dispose();
});

test('the women keep the vanity, the three dryers, the lockers and the plant; the men get the bench, the baskets, the fan, the rail and a mirror',()=>{
 const {room,hits,layout}=build();
 const west=o=>centre(o).x<-.05,east=o=>centre(o).x>.05,inChanging=o=>{const c=centre(o);return c.z>H.changing-.1&&c.z<H.front;};
 const named=n=>meshes(room).filter(m=>m.name===n);
 for(let i=1;i<=3;i++){const d=room.getObjectByName('Hair dryer '+i);assert.ok(west(d)&&inChanging(d),'dryer '+i+' on the women’s side');}
 assert.equal(named('Mirror').filter(m=>west(m)&&inChanging(m)).length,3,'three mirrors at the women’s vanity');
 assert.ok(named('Locker').length>=12&&named('Locker').every(west),'the lockers');
 assert.ok(west(room.getObjectByName('Rubber plant')),'Miss Higa’s rubber plant');
 assert.ok(named('Changing bench').every(east)&&named('Rattan basket').every(east),'bench and baskets on the men’s side');
 assert.ok(east(room.getObjectByName('Towel rail bar')),'the towel rail by the men’s bath door');
 let fan=null;room.traverse(o=>{if(o.isGroup&&o.position.x===3.85&&o.position.z===1.2)fan=o;});assert.ok(fan,'the fan on the men’s side');
 for(const n of ['Men’s mirror','Hair tonic bottle','Comb sterilizer','Comb sterilizer lamp','Men’s vanity socket'])assert.ok(room.getObjectByName(n)&&east(room.getObjectByName(n)),n);
 assert.equal(named('Men’s mirror').length,1,'one mirror is enough for the men’s side');
 // Where the player changes: the men's baskets, not the women's lockers.
 const change=hits.find(h=>h.label==='Change at the baskets');assert.ok(change&&change.o.position.x>0);
 assert.ok(!hits.some(h=>h.label==='Change at the lockers'));
 assert.ok(ONSEN_SEATS.bench.position[0]>0,'the bench seat is a men’s seat');
 // The notice no longer calls the main bath a mixed family bath; there is one by each side's bath door.
 const notices=meshes(room).filter(m=>m.name==='Bath door notice');assert.deepEqual(notices.map(m=>m.userData.side).sort(),['men','women']);
 layout.dispose();
});

test('the women’s side’s prompts are not offered through the partition to a man in the men’s changing room',()=>{
 let me={name:null,x:0,z:4.2};const room=new THREE.Group(),hits=[];
 const layout=buildOnsenInterior({room,reg:(o,label)=>hits.push({o,label}),action(){},exit(){},people:()=>[me]});
 const women=hits.filter(h=>h.o.userData.side==='women');
 for(const label of ['Look at the rubber plant','Use a hair dryer','Read the notice by the bath door'])assert.ok(women.some(h=>h.label===label),label+' is a women’s-side prompt');
 assert.ok(!hits.some(h=>h.o.userData.side==='women'&&h.o.position.x>0),'none of them on the men’s side');
 layout.tick(1/30,1170);assert.ok(women.every(h=>h.o.visible),'offered from the lobby');
 me={name:null,x:.6,z:-.5};layout.tick(1/30,1170);assert.ok(women.every(h=>!h.o.visible),'put away while he is on the men’s side');
 me={name:null,x:.3,z:-2.5};layout.tick(1/30,1170);assert.ok(women.every(h=>h.o.visible),'back in the bath hall');
 layout.dispose();
});

test('everyone reaches their own changing room and the baths; the player may go anywhere, the women’s side too',()=>{
 const {layout}=build();
 const B=ONSEN_ROOM.bounds,resident=blockedFor(layout,'resident'),player=blockedFor(layout,'player');
 const nav=blocked=>createNavigation(blocked,{step:.2,heightAt:()=>0,bounds:B});
 const spawn={x:ONSEN_ROOM.spawn[0],z:ONSEN_ROOM.spawn[2]};
 // Each crossing of a wall line (z) along a path, and at what x.
 const crossings=(path,z)=>{const xs=[];for(let i=1;i<path.length;i++){const [x0,z0]=path[i-1],[x1,z1]=path[i];if((z0-z)*(z1-z)<=0&&z0!==z1)xs.push(x0+(x1-x0)*(z-z0)/(z1-z0));}return xs;};
 for(const side of ['women','men']){
  const D=ONSEN_DOORWAYS[side],[cx,,cz]=D.changeAt,sign=side==='women'?-1:1,r=nav(resident);
  assert.ok(!resident(cx,cz,.32),side+': the place to change is clear');
  const inside=[spawn,{x:cx,z:cz}],path=r.path(...inside);assert.ok(path.length,side+': from the street door to the '+ONSEN_SIGNS[D.sign].bath+' changing room');
  for(const x of crossings([[spawn.x,spawn.z],...path],H.front))assert.ok(x*sign>0,side+' goes through their own noren: x '+x.toFixed(2));
  for(const seat of ROCK_RING.map(id=>ONSEN_SEATS[id])){const out=r.path({x:cx,z:cz},{x:seat.stand[0],z:seat.stand[2]});assert.ok(out.length,side+' reaches '+seat.id);
   for(const x of crossings([[cx,cz],...out],H.changing))assert.ok(x*sign>0,side+' out through their own bath door: x '+x.toFixed(2));}
  // (The indoor tub's step and the west washing places, behind the stool stack and the island, are narrower than the
  // residents' 0.32 m raster, as they were before the split; nobody is routed there yet. The island's east face is open.)
  for(const id of ['wash6','wash7'])assert.ok(r.path({x:cx,z:cz},{x:ONSEN_SEATS[id].stand[0],z:ONSEN_SEATS[id].stand[2]}).length,side+' reaches '+id);
 }
 // The player gets to the men's side, the baths and the women's side too (the creator, 2026-10-11: Johansson goes anywhere).
 const p=nav(player);
 assert.ok(p.path(spawn,{x:ONSEN_DOORWAYS.men.changeAt[0],z:ONSEN_DOORWAYS.men.changeAt[2]}).length,'the player reaches the baskets');
 assert.ok(p.path(spawn,{x:ONSEN_SEATS.rock.stand[0],z:ONSEN_SEATS.rock.stand[2]}).length,'and the rock bath');
 assert.ok(p.path(spawn,{x:ONSEN_DOORWAYS.women.changeAt[0],z:ONSEN_DOORWAYS.women.changeAt[2]}).length,'and the women’s lockers');
 assert.ok(p.path({x:ONSEN_SEATS.rock.stand[0],z:ONSEN_SEATS.rock.stand[2]},{x:-3,z:.2}).length,'and from the bath hall');
 layout.dispose();
});

test('residents change on their own side, by their silhouette, in and out through the same noren',()=>{
 assert.equal(onsenSide(recipeFor('Thuan')),'women');assert.equal(onsenSide(recipeFor('Miss Higa')),'women');
 for(const name of ['Mr Fujita','Tetsuo','Johansson'])assert.equal(onsenSide(recipeFor(name)),'men',name);
 const {layout}=build(),resident=blockedFor(layout,'resident');
 const street=new THREE.Group(),scene=new THREE.Group();scene.add(street);
 const world={people:RESIDENTS.map((profile,i)=>{const g=new THREE.Group();g.userData.name=profile.name;g.userData.hit={inside:false};g.position.set(i,0,i+1);street.add(g);return {g,profile};})};
 const thuan=world.people.find(p=>p.profile.name==='Thuan'),g=thuan.g,state={onsenDate:0};let clock=1215;
 const guests=createIndoorResidents({world,parent:scene,place:'onsen',layout:{entrance:ONSEN_ROOM.spawn,bounds:ONSEN_ROOM.bounds},getState:()=>state,collides:(x,z,r)=>resident(x,z,r)});
 g.position.set(ONSEN_DOOR[0],0,ONSEN_DOOR[1]);
 const track=[];let sat=false;
 for(let t=0;t<90&&!sat;t+=1/30){guests.sync(clock,1/30);if(g.parent===scene){track.push([g.position.x,g.position.z,g.userData.outfit]);sat=g.userData.socialPose==='Soak'&&g.userData.chairBlend===undefined;}}
 assert.ok(sat,'Thuan reaches the rock bath and sits in it');
 // Nobody is ever bare: in her clothes through the lobby, into swimwear at her side's lockers for the shared bath.
 const dressed=list=>{for(const [x,z,outfit] of list){if(z>H.front+.05)assert.equal(outfit,undefined,'in her clothes in the lobby at '+x.toFixed(2)+', '+z.toFixed(2));if(z<H.changing)assert.equal(outfit,'swim','in swimwear in the bath at '+x.toFixed(2)+', '+z.toFixed(2));}};
 dressed(track);assert.ok(track.some(([,z])=>z>H.front+.05)&&track.some(([,z])=>z<H.changing));assert.equal(g.userData.outfit,'swim');
 assert.ok(track.some(([x,z])=>x<-1.5&&z>-1.2&&z<1.6),'she changes on the women’s side, at the lockers');
 for(const [x,z] of track)if(Math.abs(z-H.front)<.15||Math.abs(z-H.changing)<.15)assert.ok(x<0,'through the women’s doorways only: '+x.toFixed(2)+', '+z.toFixed(2));
 // Out the same way at closing.
 clock=1330;const out=[];for(let t=0;t<90&&g.parent===scene;t+=1/30){guests.sync(clock,1/30);if(g.parent===scene)out.push([g.position.x,g.position.z,g.userData.outfit]);}
 assert.equal(g.parent,street,'she leaves');dressed(out);assert.ok(out.some(([,z])=>z>H.front+.05),'and dressed again through the lobby');
 for(const [x,z] of out)if(Math.abs(z-H.front)<.15||Math.abs(z-H.changing)<.15)assert.ok(x<0,'out through the women’s side: '+x.toFixed(2)+', '+z.toFixed(2));
 layout.dispose();
});

test('the rock bath is shared, a swimwear zone, with room for six in a ring',()=>{
 const {room,hits,layout}=build(),P=ONSEN_ROOM.pool,blocked=blockedFor(layout,'resident');
 assert.equal(ROCK_RING.length,6);
 const seats=ROCK_RING.map(id=>ONSEN_SEATS[id]);
 for(const s of seats){
  const [x,,z]=s.position;assert.ok(((x-P.x)/P.rx)**2+((z-P.z)/P.rz)**2<.75,s.id+' sits in the water, clear of the rocks');
  assert.ok(s.soak&&s.surfaceY<0&&s.eyeY>P.water&&s.eyeY-P.water<.45,s.id+' in up to the chest');
  assert.ok(!blocked(s.stand[0],s.stand[2],.25),s.id+' steps in from a clear spot');
  assert.ok(s.stand[2]>P.z+P.rz,s.id+' gets in by the low rocks at the door');
  assert.ok(hits.some(h=>h.o.userData.seat?.id===s.id),s.id+' has a prompt');
  // Wading to it, nobody passes through anyone already sitting.
  for(const o of seats){if(o===s)continue;const [ax,,az]=s.stand,[bx,,bz]=s.position,[ox,,oz]=o.position,dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((ox-ax)*dx+(oz-az)*dz)/(dx*dx+dz*dz)));
   if(ROCK_RING.indexOf(o.id)<ROCK_RING.indexOf(s.id)||['rock','rockBeside'].includes(o.id))assert.ok(Math.hypot(ax+dx*t-ox,az+dz*t-oz)>.4,s.id+' wades past '+o.id);}
 }
 for(let i=0;i<seats.length;i++)for(let j=i+1;j<seats.length;j++){const a=seats[i].position,b=seats[j].position;assert.ok(Math.hypot(a[0]-b[0],a[2]-b[2])>=.9,seats[i].id+' and '+seats[j].id+' have room')}
 // The new four face the middle of the ring.
 const mid=seats.reduce((m,s)=>[m[0]+s.position[0]/6,m[1]+s.position[2]/6],[0,0]);
 for(const s of seats.filter(s=>!['rock','rockBeside'].includes(s.id))){const f=[-Math.sin(s.yaw),-Math.cos(s.yaw)],to=[mid[0]-s.position[0],mid[1]-s.position[2]],n=Math.hypot(...to);assert.ok((f[0]*to[0]+f[1]*to[1])/n>.9,s.id+' faces the ring');}
 // Its sign, over the glass doorway on the bath-hall side, in Japanese with an English line.
 const sign=room.getObjectByName('Swimwear zone sign');assert.ok(sign);const b=box(sign);
 assert.ok(b.min.x>-1&&b.max.x<1&&b.min.y>=2.35&&b.max.y<=ONSEN_ROOM.walls.height&&b.min.z>H.bath,'on the header over the doorway, facing the bath hall');
 assert.deepEqual([...ONSEN_SIGNS.swimZone.lines],['水着ゾーン','混浴 (水着着用)']);assert.match(ONSEN_SIGNS.swimZone.sub,/SWIMWEAR ZONE/);
 layout.dispose();
});
