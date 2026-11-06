import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildOnsenInterior,ONSEN_ROOM} from '../src/world/interiors/onsen.js';
import {ONSEN_CIRCUITS,ONSEN_BOARD,ONSEN_SPILLS,ONSEN_FILL,ONSEN_VOLTS,stageScenario,assess,circuitOf,isWorking,trip,resetAll,wattsOf,loadOf} from '../src/world/interiors/onsen-electrics.js';
import {ONSEN_HARBOUR} from '../src/world/interiors/onsen-night.js';
import {ONSEN_DOORWAYS} from '../src/world/interiors/onsen-lobby.js';
import {FEED_PLACES} from '../src/feed/places.js';
import {placeAsset} from '../src/catalog/catalog.js';
import {provideCatalog} from './catalog-fixture.mjs';
// The massage chair's model in hand (World's catalogue), as the game has it before it opens the door.
await provideCatalog('massage-chair');

// The lighting batch (shot plan B4/B4b): two camps of light, the andon on the board, the dark house, the night outside.
const build=()=>{const room=new THREE.Group(),hits=[];const layout=buildOnsenInterior({room,reg:(o,label,fn)=>hits.push({o,label,fn}),action(){},exit(){}});room.updateMatrixWorld(true);return {room,hits,layout};};
const R=ONSEN_ROOM;
const loads=Object.fromEntries(ONSEN_CIRCUITS.flatMap(c=>c.loads.map(l=>[l.id,{...l,circuit:c.id}])));
const pointLights=room=>{const list=[];room.traverse(o=>{if(o.isPointLight)list.push(o);});return list;};
const hemiOf=room=>{let h=null;room.traverse(o=>{if(o.isHemisphereLight&&!h)h=o;});return h;};
const lookFrom=(room,x,z)=>{const cam=new THREE.PerspectiveCamera();cam.position.set(x,1.5,z);cam.updateMatrixWorld();room.getObjectByName('Breaker board plate').onBeforeRender(null,null,cam);const h=hemiOf(room);return {intensity:h.intensity,color:h.color.clone()};};
const cool=c=>c.b-c.r,warm=c=>c.r-c.b;
// How far a point light's light reaches a floor rectangle (x0..x1, z0..z1) at y.
const reach=(p,[x0,x1,z0,z1],y=0)=>Math.hypot(Math.max(x0-p[0],p[0]-x1,0),p[1]-y,Math.max(z0-p[2],p[2]-z1,0));

test('the women’s changing room has its own ceiling lamp, a cool daylight tube on the changing-room lights circuit',()=>{
 resetAll();stageScenario('rest');const {room,layout}=build();
 const L=loads['women-tube'];
 assert.equal(L.circuit,'changing-lights');assert.equal(circuitOf('women-tube'),'changing-lights');
 assert.equal(ONSEN_CIRCUITS.find(c=>c.id==='changing-lights').jp,'脱衣所照明');
 assert.equal(L.watts,40);assert.ok(L.period.includes('FL40')&&L.purpose.length>40&&L.light.why.length>40);
 assert.ok(L.fixture.at[0]<-.1&&L.fixture.at[2]>R.hall.changing&&L.fixture.at[2]<R.hall.front,'over the women’s side');
 const tube=room.getObjectByName('Women’s changing-room lamp'),light=room.getObjectByName('Women’s changing-room light');
 assert.ok(tube&&light?.isPointLight&&room.getObjectByName('Women’s changing-room lamp fitting'));
 assert.ok(isWorking('women-tube')&&light.intensity>0&&tube.material.emissiveIntensity>0,'lit at rest');
 // Cool against the lobby's warm bulb; the men's ring a little less cool.
 const c=new THREE.Color(L.light.colour),lobby=new THREE.Color(loads['lobby-lamp'].light.colour),men=new THREE.Color(loads['changing-pendant'].light.colour);
 assert.ok(cool(c)>0&&warm(lobby)>0&&cool(men)>0&&cool(c)>cool(men));
 // The fitting hangs from the ceiling, clear of the beam, the walls and the heads below.
 const box=new THREE.Box3().setFromObject(room.getObjectByName('Women’s changing-room lamp fitting'));
 assert.ok(box.max.y<=R.walls.height+1e-6&&box.min.y>2.6,'on the ceiling');
 assert.ok(box.min.z>R.hall.changing+.1&&box.max.z<.14,'between the vanity wall and the beam');
 assert.ok(box.min.x>-4.94&&box.max.x<-.06,'inside the women’s room');
 // The men's side keeps its pendant, now a ring tube under a shade.
 assert.ok(room.getObjectByName('Changing-room pendant lamp')&&room.getObjectByName('Pendant shade'));
 layout.dispose();
});

test('each lamp lights its own camp: no lamp reaches the floor on the far side of a wall it is not meant to cross',()=>{
 const W=ONSEN_DOORWAYS.women,M=ONSEN_DOORWAYS.men;
 const women=[-4.94,-.06,R.hall.changing,R.hall.front],men=[.06,4.94,R.hall.changing,R.hall.front],lobby=[-4.94,4.94,R.hall.front+.06,4.94];
 const at=id=>loads[id].light;
 // The women's tube stops short of the men's floor; the men's ring short of the women's.
 assert.ok(reach(at('women-tube').at,men)>at('women-tube').range,'women’s tube on the men’s floor');
 assert.ok(reach(at('changing-pendant').at,women)>at('changing-pendant').range,'men’s ring on the women’s floor');
 // The lobby's bulb does not reach the women's mirrors and vanity, nor the men's bench; its own floor it does.
 assert.ok(reach(at('lobby-lamp').at,[-4.2,-1.7,R.hall.changing,-.6],.8)>at('lobby-lamp').range,'lobby bulb on the women’s vanity');
 assert.ok(reach(at('lobby-lamp').at,[1.2,3,0,.6],.45)>at('lobby-lamp').range,'lobby bulb on the men’s bench');
 assert.ok(reach(at('lobby-lamp').at,lobby)<at('lobby-lamp').range);
 // Nor the floors beyond the walls (a floor faces every lamp): the women's tube stops short of the bath hall's floor
 // and the lobby's, the bath lamps short of the women's mirrors.
 // (light falls off as three.js does: intensity / d², eased to nothing at the range)
 const lux=(L,rect,y=0)=>{const d=reach(L.at,rect,y);return L.intensity*Math.max(0,1-(d/L.range)**4)**2/(d*d);};
 assert.ok(lux(at('women-tube'),[-4.94,-.06,-4.4,R.hall.changing-.06])<.12,'women’s tube on the bath floor: '+lux(at('women-tube'),[-4.94,-.06,-4.4,R.hall.changing-.06]).toFixed(3));
 assert.equal(lux(at('women-tube'),[-4.94,-.06,R.hall.front+.06,4.94]),0,'women’s tube on the lobby floor');
 // The women's vanity top, against the bath hall's wall, under their own tube: the tube outshines what the bath
 // lamp throws over the wall at least two to one.
 const top=[-4.2,-1.7,R.hall.changing+.06,-.64];
 assert.ok(lux(at('women-tube'),top,.81)>2*lux(at('bath-lamp-west'),top,.81),`tube ${lux(at('women-tube'),top,.81).toFixed(2)} bath ${lux(at('bath-lamp-west'),top,.81).toFixed(2)}`);
 // A fitting flat on the ceiling has its light just above the ceiling's face, so no ceiling takes it (its own nor the
 // next room's across the wall); the porch lamp's reach ends before the lobby ceiling inside the street wall; the andon's
 // is the keeper's corner, short of the women's side of the noren wall.
 for(const l of Object.values(loads))if(l.fixture&&['flush','sealed','trough'].includes(l.fixture.kind))assert.ok(l.light.at[1]>R.walls.height,l.id+' above its ceiling');
 assert.ok(reach(at('porch-lamp').at,[-5,5,R.hall.front,5],R.walls.height)>at('porch-lamp').range,'porch lamp on the lobby ceiling');
 assert.ok(lux(at('andon'),[-4.94,-4.94,R.hall.front-.6,R.hall.front-.06],1.1)<.6,'andon on the women’s west wall: '+lux(at('andon'),[-4.94,-4.94,R.hall.front-.6,R.hall.front-.06],1.1).toFixed(2));
 // Each tube lights its own walls and mirrors, up to the noren wall; its light reaches the floor under the noren as the
 // floor's own pool (light.floor), which runs right up to the noren line.
 assert.ok(Math.hypot(at('women-tube').at[2]-R.hall.front,at('women-tube').at[1]-1.5)<at('women-tube').range,'the tube on the noren wall');
 assert.equal(at('women-tube').floor.rect[3],R.hall.front);
});

test('two camps: each room is seen by its own lamp, and the floor changes colour exactly under the noren',()=>{
 resetAll();stageScenario('evening');const {room,layout}=build();layout.tick(1/30,1170);
 const W=loads['women-tube'].light,M=loads['changing-pendant'].light,L=loads['lobby-lamp'].light;
 assert.ok(cool(new THREE.Color(W.colour))>.1&&warm(new THREE.Color(L.colour))>.1,'a daylight tube and a bulb');
 // The light on each floor is clipped to its room: the women's and the lobby's meet on the noren line, and the
 // changing rooms' wedges go out under their own noren and nowhere else.
 assert.equal(W.floor.rect[3],R.hall.front);assert.equal(M.floor.rect[3],R.hall.front);assert.equal(L.floor.rect[2],R.hall.front);
 assert.ok(W.floor.rect[1]<0&&M.floor.rect[0]>0,'each on its own side of the partition');
 const DW=ONSEN_DOORWAYS;assert.deepEqual([W.floor.wedge.x0,W.floor.wedge.x1],[DW.women.x0,DW.women.x1]);assert.deepEqual([M.floor.wedge.x0,M.floor.wedge.x1],[DW.men.x0,DW.men.x1]);
 const pools=[];room.traverse(o=>{if(o.userData.lightPool&&o.name.endsWith('on the floor'))pools.push(o);});
 assert.equal(pools.length,5,'three rooms and two wedges');
 for(const p of pools){assert.ok(p.visible&&p.material.opacity>0,p.name+' lit');assert.equal(p.material.blending,THREE.AdditiveBlending);assert.ok(!p.castShadow&&p.material.depthWrite===false);}
 // The house's bounce is one colour wherever the camera stands, so a shot across the border keeps both camps.
 const lobby=lookFrom(room,-2,3.4),women=lookFrom(room,-2.8,0);assert.equal(lobby.color.getHexString(),women.color.getHexString());
 // and low after dark, so the lamps carry the colour; at noon the daylight fills the house as before.
 const night=lookFrom(room,-2,3.4).intensity;layout.tick(1/30,720);const noon=lookFrom(room,-2,3.4).intensity;assert.ok(night<noon*.75,`dusk ${night.toFixed(2)} noon ${noon.toFixed(2)}`);
 // Walking through the noren it eases, never jumps.
 layout.tick(1/30,1170);let last=lookFrom(room,-.47,2.4).intensity;
 for(let z=2.4;z>=.6;z-=.01){const v=lookFrom(room,-.47,z).intensity;assert.ok(Math.abs(v-last)<.02,'smooth at z '+z.toFixed(2));last=v;}
 // The evening rush, before the click: every lamp lit, so the camps hold.
 for(const id of ['women-tube','changing-pendant','lobby-lamp','andon'])assert.ok(isWorking(id),id);
 // A dead circuit takes its floor light with it.
 trip('changing-lights');for(const p of pools.filter(p=>!p.name.startsWith('Lobby')))assert.equal(p.visible,false,p.name+' out');
 resetAll();layout.dispose();
});

test('the women’s lamp goes out with its breaker and with the main; the blackout and the isolated house are equally dark',()=>{
 resetAll();stageScenario('rest');const {room,layout}=build();layout.tick(1/30,1170);
 const light=room.getObjectByName('Women’s changing-room light'),tube=room.getObjectByName('Women’s changing-room lamp');
 trip('changing-lights');assert.equal(light.intensity,0);assert.equal(tube.material.emissiveIntensity,0);
 assert.ok(room.getObjectByName('Changing-room light').intensity===0,'and the men’s with it: one circuit');
 assert.ok(room.getObjectByName('Lobby light').intensity>0,'the lobby stays lit');
 resetAll();
 const snapshot=()=>{layout.tick(1/30,1170);const lights=pointLights(room).map(l=>[l.name,l.intensity]);const look=lookFrom(room,-3.1,1.95);
  return {lights,hemi:look.intensity,color:look.color.getHexString(),town:layout.townFill()};};
 stageScenario('isolated');const isolated=snapshot();
 for(const [name,v] of isolated.lights)assert.equal(v,0,name+' dark with the main off');
 assert.ok(isolated.town<.3&&isolated.hemi<hemiOf(room).intensity+1e-9);
 // The blackout: the supply breaker down, every lamp in the house dark, as dark as the house with its main off.
 stageScenario('blackout');const blackout=snapshot();
 for(const [name,v] of blackout.lights)assert.equal(v,0,name+' dark in the blackout');
 assert.deepEqual(blackout,isolated,'the blackout matches the isolated house');
 for(const n of ['Women’s changing-room lamp','Changing-room pendant lamp','Lobby ceiling lamp','Andon','Bath hall lamp west','Bath hall lamp east','Milk cooler light','Comb sterilizer lamp','Electric pot boil lamp','Massage chair lamp'])
  assert.equal(room.getObjectByName(n).material.emissiveIntensity,0,n+' dark');
 assert.equal(room.getObjectByName('Spout water').visible,false,'no pump');
 // The retrip's one second: every lamp lit again, then dark.
 stageScenario('retrip');const blink=snapshot();assert.ok(blink.lights.filter(([n])=>!/glow|lantern|Porch/.test(n)).every(([,v])=>v>0),'the lights blink on');
 // Not pitch black: the dusk through the glass still lights faces at a low key, and it is cool, not lamp-warm.
 assert.ok(isolated.hemi>.1,'faces still read: '+isolated.hemi.toFixed(3));
 stageScenario('restored');const restored=snapshot();assert.ok(restored.lights.filter(([,v])=>v===0).every(([n])=>/glow|lantern|Porch/.test(n)),'restored: every lamp lit (the photocell lamps by the hour)');
 layout.dispose();
});

test('the andon lights the board from below at the bandai',()=>{
 resetAll();stageScenario('evening');const {room,layout}=build();
 const A=loads.andon,light=room.getObjectByName('Andon light'),andon=room.getObjectByName('Andon');
 assert.equal(A.circuit,'lobby');assert.ok(light?.isPointLight&&light.intensity>0);
 const p=new THREE.Vector3();andon.getWorldPosition(p);
 const paper=new THREE.Box3().setFromObject(andon);assert.ok(paper.containsPoint(light.position),'the light is in the paper lamp');
 const B=ONSEN_BOARD,face=new THREE.Vector3(B.wallX+B.d,B.y,B.z);
 const d=face.clone().sub(light.position);
 const onBoard=A.light.intensity*Math.max(0,1-(d.length()/A.light.range)**4)**2/d.lengthSq();
 assert.ok(onBoard>1,'the board is well lit: '+onBoard.toFixed(2));
 assert.ok(light.position.y<B.y-B.h/2,'below the board, so the light comes up');
 assert.ok(-d.x/d.length()>.6,'and falls on the board’s face');
 trip('lobby');assert.equal(light.intensity,0,'on the lobby circuit');
 layout.dispose();resetAll();
});

test('the porch lamp rims the doorway from the street after dusk; it is on the lobby circuit and a photocell',()=>{
 resetAll();stageScenario('rest');const {room,layout}=build();
 const P=loads['porch-lamp'],light=room.getObjectByName('Porch light'),globe=room.getObjectByName('Porch lamp');
 assert.equal(P.circuit,'lobby');assert.ok(P.dusk&&P.period.length>30);
 assert.ok(light.position.z>5.3&&Math.abs(light.position.x)<.5,'behind whoever stands in the doorway');
 layout.tick(1/30,12*60);assert.equal(light.intensity,0,'off at noon');assert.equal(globe.material.emissiveIntensity,0);
 layout.tick(1/30,1170);assert.ok(light.intensity>0&&globe.material.emissiveIntensity>0,'on at Tetsuo’s dusk');
 const lit=light.intensity;for(let i=0;i<30;i++){layout.tick(1/30,1170+i/10);assert.equal(light.intensity,lit,'steady');}
 layout.dispose();
});

test('night: the harbour lights stand still over the fence, red right and green left, and the lit hall keys the rock bath',()=>{
 resetAll();stageScenario('restored');const {room,layout}=build();
 const lights=room.getObjectByName('Harbour light'),streaks=room.getObjectByName('Harbour light reflection');
 assert.ok(lights?.isInstancedMesh&&streaks?.isInstancedMesh);
 assert.equal(lights.count,ONSEN_HARBOUR.lights.length+2);
 const M=ONSEN_HARBOUR.mouth;assert.ok(M.red.x>M.green.x,'seen from outside the harbour: red on the right');
 assert.ok(ONSEN_HARBOUR.lights.some(l=>l.kind==='sodium')&&ONSEN_HARBOUR.lights.some(l=>l.kind==='window'));
 layout.tick(1/30,12*60);assert.equal(lights.material.opacity,0,'not by day');
 layout.tick(1/30,1290);const glow=lights.material.opacity;assert.ok(glow>.9,'on at night');
 const before=[...lights.instanceMatrix.array],colours=[...lights.instanceColor.array];
 for(let i=0;i<120;i++)layout.tick(1/30,1290+i/60);
 assert.deepEqual([...lights.instanceMatrix.array],before,'they never move');assert.deepEqual([...lights.instanceColor.array],colours,'never change colour');
 assert.equal(lights.material.opacity,glow,'never blink');
 // The bath hall's glow: the warm key on the faces in the water, from the building side.
 const G=ONSEN_SPILLS[0],key=room.getObjectByName(G.name);
 assert.ok(key.intensity>0,'lit at night');assert.ok(key.position.z<R.hall.bath&&key.position.z>R.pool.z,'between the glass and the bathers');
 assert.ok(new THREE.Color(G.colour).r>new THREE.Color(G.colour).b,'warm');
 for(let i=0;i<30;i++){const k=key.intensity;layout.tick(1/30,1290);assert.equal(key.intensity,k);}
 trip('bath-lights');layout.tick(1/30,1290);assert.equal(key.intensity,0,'no lamps in the hall, no glow');
 assert.equal(room.getObjectByName('Stone lantern light').intensity,0,'the lantern’s bulb is on the bath lights');
 resetAll();layout.tick(1/30,12*60);assert.equal(key.intensity,0,'by day the outside is brighter than the hall');
 layout.dispose();
});

test('the story’s numbers hold with the lamps: the house idles at 9.46 A, the evening rush is 58.46 A on the 40 A supply',()=>{
 resetAll();stageScenario('rest');
 const lights=ONSEN_CIRCUITS.find(c=>c.id==='changing-lights');
 assert.deepEqual(lights.loads.map(l=>[l.id,l.watts]),[['changing-pendant',30],['women-tube',40]]);
 assert.equal(wattsOf('changing-lights'),70);
 assert.ok(Math.abs(assess().contract.amps-9.46)<1e-9);
 let a=stageScenario('evening');
 assert.ok(Math.abs(a.contract.amps-58.46)<1e-9,'evening: '+a.contract.amps);assert.ok(a.contract.over&&a.contract.live,'over the contract, the lever still up');
 a=stageScenario('last-straw');assert.ok(Math.abs(a.contract.amps-60.46)<1e-9);assert.equal(a.main.tripIn,Infinity,'the main holds');
 const every=ONSEN_CIRCUITS.reduce((s,c)=>s+wattsOf(c.id),0)/ONSEN_VOLTS;assert.ok(every<ONSEN_BOARD.main.amps*1.05,'everything at once: '+every);
 // Every lamp says what it is, why it is there and what light it gives.
 for(const l of Object.values(loads))if(l.light){assert.ok(l.light.range>0&&l.light.intensity>0&&l.light.kelvin>=2000,l.id);assert.ok(ONSEN_FILL.why.length>20);}
 resetAll();stageScenario('rest');
});

test('the lights are the same every time the room is built, and few: one point light per lamp and none casts a shadow',()=>{
 resetAll();stageScenario('rest');
 const a=build(),b=build();
 const list=r=>pointLights(r.room).map(l=>[l.name,l.position.toArray(),l.intensity,l.distance,l.color.getHex(),l.castShadow]);
 assert.deepEqual(list(a),list(b));
 const L=list(a);assert.ok(L.length<=10,'a phone-sized light budget: '+L.length);
 assert.ok(L.every(l=>l[5]===false&&l[0]),'named, and no shadow maps');
 a.layout.dispose();b.layout.dispose();
});

test('the storyteller knows the lights: the andon, the women’s tube, the porch lamp, the lantern and the harbour',()=>{
 const onsen=FEED_PLACES.find(p=>p.id==='onsen');
 for(const thing of ['the andon on the bandai','the women’s fluorescent tube','the porch lamp','the stone lantern by the rock bath','the harbour lights across the water'])assert.ok(onsen.things.includes(thing),thing);
});

test('the house’s lamps stop at its walls: every surface of the room but the noren cloth takes point light only on the side facing it',()=>{
 resetAll();stageScenario('rest');const {room,layout}=build();
 let walls=0,cloth=0;
 room.traverse(o=>{if(!o.isMesh||!o.material?.isMeshStandardMaterial)return;
  if(o.name==='Noren'){cloth++;assert.notEqual(o.material.userData.lampsStopAtWalls,true,'the noren glows through');return;}
  if(o.userData.wall){walls++;assert.equal(o.material.userData.lampsStopAtWalls,true,o.name);}});
 assert.ok(walls>15&&cloth===4);
 // The massage chair from the catalogue too: its own copies of the model's materials (no other room's) take the house's rule.
 const chair=[];layout.chair.object.traverse(o=>{if(o.isMesh)chair.push(o);});assert.ok(chair.length>=8,'the chair is in the room');
 for(const m of chair)if(m.material.isMeshStandardMaterial)assert.equal(m.material.userData.lampsStopAtWalls,true,m.name);
 const elsewhere=placeAsset('massage-chair');elsewhere.object.traverse(o=>{if(o.isMesh)assert.notEqual(o.material.userData.lampsStopAtWalls,true,'not in another place: '+o.name);});elsewhere.dispose();
 layout.dispose();
});

test('the room says when its chair is in place (ready), and by then the chair takes the room’s light',async()=>{
 // Johansson Studio's Build scene builds the room without waiting and shades it once `ready` resolves (scene-world.js).
 resetAll();stageScenario('rest');const {room,layout}=build();
 assert.equal(await layout.ready,true,'the chair is in place');
 layout.chair.object.traverse(o=>{if(o.isMesh&&o.material.isMeshStandardMaterial)assert.equal(o.material.userData.lampsStopAtWalls,true,o.name);});
 layout.dispose();assert.equal(room.getObjectByName('Catalogue asset massage-chair'),undefined,'and it goes with the room');
});
