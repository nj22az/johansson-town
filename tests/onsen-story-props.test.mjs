import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildOnsenInterior,ONSEN_WALLS,ONSEN_CEILINGS,ONSEN_ROOM} from '../src/world/interiors/onsen.js';
import {createNavigation} from '../src/people/navmesh.js';
import {ONSEN_PROPS} from '../src/world/interiors/onsen-props.js';
import {LOBBY_CHANNELS,LOBBY_TV_STATES,pinLobbyChannel} from '../src/world/interiors/onsen-lobby.js';
import {ONSEN_SIGNS} from '../src/world/interiors/onsen-signs.js';
import {ONSEN_BOARD,ONSEN_CIRCUITS,CHAIR_TIMER,DRYER_CORD,MASSAGE_CHAIR,stageScenario,chairTimer,timerReads,trip,reset,isRunning,higaReset} from '../src/world/interiors/onsen-electrics.js';
import {circleHitsRect} from '../physics.js';
import {FEED_PLACES} from '../src/feed/places.js';
import {CHAIR} from '../src/world/interiors/onsen-chair.js';
import {provideCatalog} from './catalog-fixture.mjs';
// The massage chair is World's catalogue's (assets/catalog): its model in hand, as the game has it before the door opens.
await provideCatalog('massage-chair');

// Plan batches 1 and 3 (shot-plan.md §7) for "Fujita's Ten Minutes of Heaven": walls a film can lift one at a time, and the
// war's things, each with its purpose, each a state a film or capture-room.mjs can set.
const build=()=>{const room=new THREE.Group(),hits=[],actions=[];const layout=buildOnsenInterior({room,reg:(o,label,fn)=>hits.push({o,label,fn}),action:(...a)=>actions.push(a),exit(){}});room.updateMatrixWorld(true);return {room,hits,actions,layout};};
const meshes=root=>{const all=[];root.traverse(o=>{if(o.isMesh)all.push(o);});return all;};
const box=o=>{o.updateWorldMatrix(true,true);return new THREE.Box3().setFromObject(o);};
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const ticks=(layout,seconds,dt=1/30)=>{for(let t=0;t<seconds-1e-9;t+=dt)layout.tick(dt,1170);};

test('every wall piece and every room’s ceiling has a name of its own, so a film can lift one at a time',()=>{
 const {room,layout}=build();
 const walls=meshes(room).filter(m=>m.userData.wall),names=walls.map(m=>m.name);
 assert.equal(new Set(names).size,names.length,'no two walls share a name: '+names.join(', '));
 assert.deepEqual([...names].sort(),ONSEN_WALLS.map(w=>w.name).sort(),'the walls are the ones listed in ONSEN_WALLS');
 for(const w of ONSEN_WALLS)assert.ok(w.faces.length>8,w.name+' says what it stands between');
 assert.equal(room.getObjectByName('Umi-no-yu wall'),undefined,'no anonymous wall left');
 const ceilings=[];room.traverse(o=>{if(o.userData.ceiling)ceilings.push(o);});
 assert.deepEqual(ceilings.map(c=>c.name).sort(),ONSEN_CEILINGS.map(c=>c.name).sort());
 // Every name a film hides by is unique in the room (capture-room HIDE takes everything with that name).
 const all=new Map();room.traverse(o=>{if(o.name)all.set(o.name,(all.get(o.name)||0)+1);});
 for(const n of [...names,...ONSEN_CEILINGS.map(c=>c.name),...ONSEN_CEILINGS.flatMap(c=>c.beams.map(b=>b[1]))])assert.equal(all.get(n),1,n+' is one object');
 // A ceiling lifts with its beams, and between them they cover the house from the street wall to the sea glass.
 for(const C of ONSEN_CEILINGS){const g=room.getObjectByName(C.name),beams=meshes(g).filter(m=>m.userData.beam);assert.equal(beams.length,C.beams.length,C.name+' carries its beams');
  const b=box(g);assert.ok(Math.abs(b.max.y-2.8)<.001&&b.min.y>2.69,C.name+' at the ceiling');}
 const area=ONSEN_CEILINGS.reduce((s,C)=>s+(C.x1-C.x0)*(C.z1-C.z0),0);assert.ok(Math.abs(area-10*(5+4.4))<1e-9,'the ceilings cover the house once');
 // The wainscot, the shoji and the props on a wall say which wall, so lifting the wall lifts them too.
 for(const m of meshes(room).filter(m=>/^(Lobby wainscot|Wainscot rail) /.test(m.name)))assert.ok(names.includes(m.userData.hangsOn),m.name+' hangs on '+m.userData.hangsOn);
 for(const m of meshes(room).filter(m=>m.userData.hangsOn&&!m.userData.hangsOn.startsWith('Noren pole')))assert.ok(names.includes(m.userData.hangsOn),m.name+' hangs on a named wall: '+m.userData.hangsOn);
 // Splitting the walls changed nothing a walker meets: the colliders are the same lines.
 assert.ok(layout.colliders.length>30);
 layout.dispose();
});

test('the coin timer reads the chair’s own state: 10:00 for a coin, counting down while it kneads, dark when the power goes',()=>{
 const {room,layout}=build();
 assert.equal(CHAIR_TIMER.seconds,600);assert.ok(CHAIR_TIMER.why.length>40&&CHAIR_TIMER.period.length>40&&CHAIR_TIMER.for.length>30);
 assert.deepEqual(['0:00','0:01','0:59','1:00','9:58','10:00'],[0,.4,59,60,598,600].map(timerReads));
 // The coin box is the chair's own (Studio's model): its face plate is the metal of the box ('Massage chair coin box
 // (metal)'). The room's two live parts lie on it: the readout and the lamp, facing the lobby (-x), never off its edge.
 const led=room.getObjectByName(CHAIR_TIMER.name),lamp=room.getObjectByName('Massage chair lamp'),coinBox=room.getObjectByName('Massage chair coin box');
 assert.ok(led&&visible(led)&&lamp&&visible(lamp),'the readout and the lamp are on the coin box');
 assert.equal(coinBox.parent.parent,layout.chair.object,'the coin box is part of the chair');
 const plate=meshes(coinBox).find(m=>m.name==='Massage chair coin box (metal)'),ray=new THREE.Raycaster(),east=new THREE.Vector3(1,0,0);
 const onPlate=(p,label,most)=>{ray.set(new THREE.Vector3(p.x-.2,p.y,p.z),east);ray.far=1;
  const hit=ray.intersectObjects(meshes(layout.chair.object),false)[0];
  assert.ok(hit&&hit.object===plate,label+' is in front of the face plate, not off its edge: '+(hit?.object.name||'nothing'));
  assert.ok(hit.point.x-p.x>=-1e-6&&hit.point.x-p.x<=most,label+' lies on it: '+(hit.point.x-p.x).toFixed(4)+' m in front');};
 const L=box(led);for(const [y,z] of [[L.min.y,L.min.z],[L.min.y,L.max.z],[L.max.y,L.min.z],[L.max.y,L.max.z],[(L.min.y+L.max.y)/2,(L.min.z+L.max.z)/2]])
  onPlate(new THREE.Vector3(L.max.x,y+(y===L.min.y?1e-4:y===L.max.y?-1e-4:0),z+(z===L.min.z?1e-4:z===L.max.z?-1e-4:0)),'the readout',.001);
 assert.ok(L.max.x-L.min.x<1e-6,'the readout is flat on the face, facing the lobby');
 // The lamp is a lens on the plate: half of it sunk in it, so its middle (where its rim meets the plate) is on the plate's face.
 const lampBox=box(lamp),lc=lampBox.getCenter(new THREE.Vector3());onPlate(lc,'the lamp’s rim',.0005);
 assert.ok(Math.abs(lampBox.min.x-CHAIR.anchor('running-lamp')[0])<1e-4,'the lamp’s front at the running-lamp anchor');
 assert.ok(lampBox.min.y>L.max.y,'the lamp over the readout');
 // The box itself against the right arm's front and under its top (the arm pad's top, right-arm-top), above the seat.
 const cb=box(coinBox),[,armTop]=CHAIR.anchor('right-arm-top');
 assert.ok(cb.max.y<armTop&&cb.min.y>.5-1e-3,'under the arm’s top, and none of it below the seat’s top: '+cb.min.y.toFixed(4)+'–'+cb.max.y.toFixed(4));
 ray.set(new THREE.Vector3(cb.min.x-.2,.45,(cb.min.z+cb.max.z)/2),east);const arm=ray.intersectObjects(meshes(layout.chair.object),false)[0];
 const back=meshes(coinBox).filter(m=>m.name==='Massage chair coin box').map(box)[0];
 assert.ok(arm&&Math.abs(back.max.x-arm.point.x)<.0015,'the coin box stands against the arm’s front: '+back.max.x.toFixed(4)+' / '+arm?.point.x.toFixed(4));
 // Page 4: two seconds of heaven, held.
 stageScenario('last-straw');ticks(layout,1);assert.equal(chairTimer().reads,'9:58');assert.equal(chairTimer().lit,true);
 // The blackout: the readout goes dark and the coin is forgotten; when the power comes back the chair stays still.
 stageScenario('blackout');ticks(layout,.5);assert.equal(chairTimer().lit,false);assert.equal(chairTimer().left,0);
 assert.equal(isRunning('massage-chair'),false,'the coin is gone: it needs another');
 stageScenario('retrip');ticks(layout,.5);assert.equal(isRunning('massage-chair'),false,'the lights blink on and the chair stays still');
 higaReset();ticks(layout,.5);assert.equal(isRunning('massage-chair'),false);
 // A coin on a quiet evening: it counts down while the chair runs and stops it at 0:00.
 stageScenario('quiet');ticks(layout,2);assert.equal(chairTimer().reads,'9:58');
 chairTimer(1);chairTimer(null);ticks(layout,1.5);assert.equal(isRunning('massage-chair'),false,'ten minutes up: it stops');assert.equal(chairTimer().reads,'0:00');
 // A film can hold the readout at a reading on any running chair.
 stageScenario('quiet');chairTimer('9:58');ticks(layout,3);assert.deepEqual([chairTimer().reads,chairTimer().pinned,chairTimer().lit],['9:58',true,true]);
 assert.equal(layout.power.boardDoor(),ONSEN_BOARD.door.shut);
 assert.throws(()=>chairTimer('11:00'),/0:00 to 10:00/);assert.throws(()=>chairTimer('9:5'),/0:00 to 10:00/);
 // A trip lets a held reading go.
 trip('changing-sockets');assert.equal(chairTimer().pinned,false);
 stageScenario('rest');layout.dispose();
});

test('the lobby set can be pinned to the story’s held scores and to the power-off dot, never reached with the knob',()=>{
 const {room,hits,actions,layout}=build(),knob=hits.find(h=>h.label==='Change the channel');
 assert.deepEqual(LOBBY_TV_STATES.map(s=>s.id),['score-0-7','score-0-11','off-dot']);
 for(const s of LOBBY_TV_STATES){assert.ok(s.why.length>40&&s.panels.length,s.id);if(s.kind==='score'){const S=ONSEN_SIGNS.tv[s.sign];assert.equal(S.score.home,0,'Fujita’s team, Okinawa, has nothing');assert.match(S.inning,/^\d回表$/);}}
 assert.deepEqual(['score-0-7','score-0-11'].map(id=>ONSEN_SIGNS.tv[LOBBY_TV_STATES.find(s=>s.id===id).sign].score.away),[7,11]);
 pinLobbyChannel(null);const seen=new Set();for(let i=0;i<10;i++){knob.fn();seen.add(layout.tv.channel);}
 assert.deepEqual([...seen].sort(),LOBBY_CHANNELS.map(c=>c.id).sort(),'the knob only turns through the broadcast channels');
 const dot=room.getObjectByName('Lobby CRT dot');
 for(const id of ['score-0-7','score-0-11']){layout.power.tv.pin(id);layout.realUpdate();assert.equal(layout.tv.channel,id);assert.equal(dot.visible,false);}
 knob.fn();assert.match(actions.at(-1)[2],/leave it where it is/);assert.equal(layout.tv.channel,'score-0-11','pinned, the knob leaves it');
 // The dot shows on the dead set (main off) and on a live one alike.
 stageScenario('isolated');layout.power.tv.pin('off-dot');layout.realUpdate();assert.equal(dot.visible,true);assert.equal(visible(layout.tv.screen),false,'no picture: the set is dead');
 stageScenario('rest');layout.power.tv.pin('off-dot');layout.realUpdate();assert.equal(dot.visible,true);
 const glass=box(layout.tv.deadGlass),d=box(dot);assert.ok(d.min.y>glass.min.y&&d.max.y<glass.max.y,'in the middle of the glass');
 pinLobbyChannel(null);layout.realUpdate();assert.equal(dot.visible,false);
 assert.throws(()=>pinLobbyChannel('cartoons'),/No such channel/);
 stageScenario('rest');pinLobbyChannel(null);layout.dispose();
});

test('the board carries the rewiring’s three tapes in every moment: the two new ways and circuit 1’s new name',()=>{
 const {room,layout}=build();
 const one=ONSEN_CIRCUITS.find(c=>c.id==='changing-sockets');assert.ok(one.tape.why.length>40);assert.match(one.tape.jp,/左鏡/);
 const tapes=()=>meshes(room).filter(m=>/^Tape label /.test(m.name)&&m.name!=='Tape label circuit list'&&visible(m)).map(m=>m.name).sort();
 for(const moment of ['rest','evening','blackout','restored']){stageScenario(moment);layout.realUpdate();
  assert.deepEqual(tapes(),['Tape label changing-sockets','Tape label vanity-2','Tape label vanity-3'],moment);}
 stageScenario('rest');layout.dispose();
});

test('Fujita’s offering: three coffee milks on the chair’s arm when a story sets it, full or empty, and nowhere otherwise',()=>{
 const {room,layout}=build(),O=ONSEN_PROPS.offering,g=room.getObjectByName(O.name);
 assert.equal(visible(g),false,'nobody leaves milk on the chair: bare unless staged');
 assert.deepEqual(layout.props.stage({offering:'full'}).offering,'full');assert.equal(visible(g),true);
 // On the right arm's pad (the chair's body, 'Coin massage chair', at its right-arm-top anchor): straight down from every
 // side of a bottle's foot the pad is right under it, flat at 0.71, so none stands over its edge.
 assert.equal(O.on,'Coin massage chair');assert.deepEqual([O.z,O.top],[CHAIR.anchor('right-arm-top')[2],CHAIR.anchor('right-arm-top')[1]]);
 const coin=box(room.getObjectByName('Massage chair coin box')),chairMeshes=meshes(layout.chair.object),ray=new THREE.Raycaster();
 for(let i=1;i<=3;i++){const bottle=room.getObjectByName('Coffee milk '+i+' bottle'),b=box(bottle),c=b.getCenter(new THREE.Vector3()),r=O.bottle.r-.001;
  for(const [dx,dz] of [[0,0],[r,0],[-r,0],[0,r],[0,-r]]){ray.set(new THREE.Vector3(c.x+dx,b.min.y+.01,c.z+dz),new THREE.Vector3(0,-1,0));ray.far=.05;
   const hit=ray.intersectObjects(chairMeshes,false)[0];
   assert.ok(hit&&hit.object.name==='Coin massage chair'&&Math.abs(hit.point.y-O.top)<.001,'bottle '+i+' stands on the arm pad, not over its edge: '+(hit?hit.object.name+' '+hit.point.y.toFixed(4):'nothing'));}
  assert.ok(Math.abs(b.min.y-O.top)<.001,'bottle '+i+' on the pad’s top');
  assert.ok(b.min.x>coin.max.x+.03,'clear of the coin slot');assert.ok(visible(room.getObjectByName('Coffee milk '+i+' cap')),'capped');}
 const xs=O.xs;for(let i=1;i<xs.length;i++)assert.ok(xs[i]-xs[i-1]>2*O.bottle.r+.02,'lined up, not touching');
 layout.props.stage({offering:'empty'});for(let i=1;i<=3;i++){assert.equal(visible(room.getObjectByName('Coffee milk '+i+' cap')),false);assert.equal(visible(room.getObjectByName('Coffee milk '+i+' dregs')),true);}
 layout.props.stage({offering:'none'});assert.equal(visible(g),false);
 assert.throws(()=>layout.props.stage({offering:'half'}),/none, full, empty/);
 layout.dispose();
});

test('the noren pole hangs on its hooks behind Miss Higa, in her reach; the cords wait in their box on the bandai floor',()=>{
 const {room,layout}=build(),NP=ONSEN_PROPS.norenPole,EC=ONSEN_PROPS.extensionCords;
 for(const p of [NP,EC])assert.ok(p.for.length>30&&p.why.length>60&&p.period.length>60,p.id);
 const cane=box(room.getObjectByName('Noren pole cane')),hook=box(room.getObjectByName('Noren pole hook')),rail=meshes(room).find(m=>m.name==='Wainscot rail west'),board=box(room.getObjectByName('Breaker board'));
 assert.ok(Math.abs(cane.min.y-(NP.y-NP.r*1.1))<.001,'the cane lies on the hooks');
 assert.ok(Math.abs(hook.min.x-NP.wallX)<.002,'the hooks are on the wall');
 assert.ok(cane.min.y>box(rail).max.y+.02,'above the wainscot rail');assert.ok(cane.max.y<board.min.y-.1,'under the board');
 assert.ok(cane.max.z<3.98,'clear of the getabako');assert.ok(cane.min.z>1.74,'clear of the noren wall’s wainscot');
 // In her reach from the stool: the nearest part of the cane within her arm.
 const [sx,sy,sz]=NP.reach.from,near=new THREE.Vector3(Math.min(Math.max(sx,cane.min.x),cane.max.x),Math.min(Math.max(sy,cane.min.y),cane.max.y),Math.min(Math.max(sz,cane.min.z),cane.max.z));
 assert.ok(near.distanceTo(new THREE.Vector3(sx,sy,sz))<NP.reach.arm,'she reaches it from her stool: '+near.distanceTo(new THREE.Vector3(sx,sy,sz)).toFixed(2));
 assert.ok(Math.abs(sx-ONSEN_BOARD.keeper.seat[0])<.01&&Math.abs(sz-ONSEN_BOARD.keeper.seat[2])<.01,'from where she sits');
 // Behind the counter: no walker can get to it, and nobody walks into it.
 const walker=(x,z)=>layout.colliders.some(c=>c.only!=='player'&&circleHitsRect(x,z,.01,c));
 const crate=box(room.getObjectByName('Extension cord box crate')),platform=box(room.getObjectByName('Bandai platform')),stool=box(room.getObjectByName('Attendant stool'));
 assert.ok(Math.abs(crate.min.y-platform.max.y)<.001,'the box stands on the bandai floor');
 assert.ok(crate.min.x>platform.min.x&&crate.max.x<platform.max.x&&crate.min.z>platform.min.z&&crate.max.z<platform.max.z,'on it, not over its edge');
 assert.ok(!crate.intersectsBox(stool)&&crate.min.z>stool.max.z+.1,'clear of the stool and her feet');
 assert.ok(crate.max.y<.78-.2,'under the counter’s height');
 // Nobody walks to them: from the street door there is no way to stand within a body's width of the pole or the box.
 const nav=createNavigation((x,z,r=.3)=>layout.colliders.some(c=>c.only!=='player'&&circleHitsRect(x,z,r,c)),{step:.1,heightAt:()=>0,bounds:ONSEN_ROOM.bounds});
 const spawn={x:ONSEN_ROOM.spawn[0],z:ONSEN_ROOM.spawn[2]};
 for(const [x,z] of [[(crate.min.x+crate.max.x)/2,(crate.min.z+crate.max.z)/2],[cane.max.x+.3,cane.min.z],[cane.max.x+.3,(cane.min.z+cane.max.z)/2],[cane.max.x+.3,cane.max.z+.08]])
  assert.deepEqual(nav.path(spawn,{x,z}),[],'nobody gets to '+x.toFixed(2)+', '+z.toFixed(2));
 assert.ok(walker((crate.min.x+crate.max.x)/2,(crate.min.z+crate.max.z)/2),'the box is inside the bandai’s fence');
 // Three cords, one for each mirror, each good for one dryer and not for three.
 assert.equal(EC.cords.length,3);for(const c of EC.cords){assert.ok(c.amps>=12&&c.amps<36,'one dryer, not three');assert.match(c.use.from,/^Vanity socket \d$/);assert.ok(room.getObjectByName(c.name));}
 layout.dispose();
});

test('a dryer off the counter keeps its cord taut to its own socket, and cannot be taken past the cord’s reach',()=>{
 const {room,layout}=build();
 for(let n=1;n<=3;n++)assert.ok(room.getObjectByName('Hair dryer '+n+' cord'),'dryer '+n+' has a visible cord');
 const home=room.getObjectByName('Hair dryer 2').position.clone();
 const r=layout.props.stage({dryers:{2:{at:[-2.75,1.3,-.45],aim:[-.6,1,1.78]}}});void r;
 const cord=room.getObjectByName('Hair dryer 2 cord'),pts=cord.userData.points,plug=room.getObjectByName('Vanity socket 2');
 assert.ok(cord.geometry.userData.length<=DRYER_CORD.length,'within the cord: '+cord.geometry.userData.length.toFixed(2));
 const end=new THREE.Vector3(...pts.at(-1)),socket=new THREE.Vector3();plug.getWorldPosition(socket);assert.ok(end.distanceTo(socket)<.03,'it ends at its socket');
 const g=room.getObjectByName('Hair dryer 2');g.updateMatrixWorld(true);const foot=new THREE.Vector3(-.01,.015,-.155).applyMatrix4(g.matrixWorld);
 assert.ok(foot.distanceTo(new THREE.Vector3(...pts[0]))<.002,'it leaves the foot of the handle');
 // The nozzle looks where it is aimed; the handle hangs below it.
 const nozzle=new THREE.Vector3(1,0,0).applyQuaternion(g.quaternion),to=new THREE.Vector3(-.6,1,1.78).sub(g.position).normalize();assert.ok(nozzle.dot(to)>.999);
 assert.ok(new THREE.Vector3(0,0,-1).applyQuaternion(g.quaternion).y<-.9,'handle down');
 // Taut: no lower than a hand's sag below the line from the handle to the socket.
 for(const p of pts){const y=p[1];assert.ok(y>Math.min(pts[0][1],pts.at(-1)[1])-.05,'taut, not trailing on the floor');}
 ticks(layout,.5);assert.ok(nozzle.dot(new THREE.Vector3(1,0,0).applyQuaternion(g.quaternion))>.9999,'the counter’s hum does not shake it in a hand');
 assert.throws(()=>layout.props.stage({dryers:{2:{at:[-.5,1.3,1.4],aim:[0,1,3]}}}),/cord is 1.7 m/);
 assert.ok(g.position.distanceTo(new THREE.Vector3(-2.75,1.3,-.45))<1e-9&&cord.userData.points===pts,'a refused move leaves it, and its cord, where they were');
 layout.props.stage({dryers:{2:null}});assert.ok(g.position.distanceTo(home)<1e-9,'back on the counter');
 layout.dispose();
});

test('Tetsuo’s work shoes are at the step only while he is in',()=>{
 const {layout}=build();
 assert.ok(!layout.genkan.stage('evening').some(s=>s.name==='Tetsuo'));
 const shoes=layout.genkan.stage('electrician').find(s=>s.name==='Tetsuo');assert.ok(shoes&&shoes.x>.5,'at the end of the row on the chair’s side');
 layout.genkan.stage(null);layout.dispose();
});

test('the storyteller knows the war’s things',()=>{
 const onsen=FEED_PLACES.find(p=>p.id==='onsen');
 for(const thing of ['Miss Higa’s noren pole','the box of extension cords under the bandai','the massage chair’s coin timer'])assert.ok(onsen.things.includes(thing),thing);
});

test('page 5’s paper war: his sign and their manifesto on the crimson noren, a flyer on her book, only when staged',()=>{
 const {room,layout}=build(),W=ONSEN_SIGNS.paperWar;
 for(const k of ['reserved','hairRights','flyer'])assert.ok(W[k].why.length>30&&W[k].where.length>30,k);
 assert.match(W.reserved.jp,/予約/);assert.match(W.hairRights.jp,/権利/);
 const signs=['Reserved sign','Hair rights sign'].map(n=>room.getObjectByName(n)),flyer=room.getObjectByName('Hair rights flyer');
 assert.ok(signs.every(s=>!visible(s))&&!visible(flyer),'nothing up before the war');
 const s=layout.props.stage({signs:{reserved:true,hairRights:true,flyer:true}});assert.deepEqual(s.signs,{reserved:true,hairRights:true,flyer:true});
 const panels=[];room.traverse(o=>{if(o.name==='Women’s noren')panels.push(o);});
 for(const sign of signs){assert.ok(visible(sign));assert.ok(panels.includes(sign.parent),sign.name+' moves with the cloth');
  const b=box(sign);assert.ok(b.min.y>1.12&&b.max.y<2.2,sign.name+' on the cloth, above its hem');assert.ok(b.min.x>-.9&&b.max.x<-.05,sign.name+' within the crimson doorway');
  assert.ok(b.min.x<-.475&&b.max.x>-.475,sign.name+' across the slit');assert.ok(Math.abs(Math.abs((b.min.z+b.max.z)/2-1.6)-.004)<.001,sign.name+' 4 mm off the cloth');}
 assert.ok(box(signs[0]).min.z>1.6&&box(signs[1]).max.z<1.6,'his on the lobby side, theirs on the women’s side');
 assert.ok(visible(flyer));const fb=box(flyer),page=box(room.getObjectByName('Account book spread'));
 assert.ok(fb.min.x>page.min.x&&fb.max.x<page.max.x&&fb.min.z>page.min.z&&fb.max.z<page.max.z,'on the book, not over its edge');
 layout.props.stage({signs:{reserved:false,hairRights:false,flyer:false}});assert.ok(signs.every(s=>!visible(s))&&!visible(flyer));
 layout.dispose();
});
