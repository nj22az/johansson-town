import {FERRY_H1} from './ferry-engine-room-plan.js';
import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {waveHeight,SEA_LEVEL,setOceanHole} from './ocean.js';
import {HARBOUR_LINE,BUS_DWELL,nextService} from '../people/commuter-schedule.js';
import {AIRPORT_FERRY_PORTS,FERRY_SAILINGS} from './airport-ferry.js';
import {sailingDue,timetableBerth,FERRY_WARNING_MINUTES} from './ferry-timetable.js';
import {airportWorld} from './airport-ground.js';
import {PORT_BUILDING} from './port-building.js';
import {FERRY_DAY,rollPeriod,pitchPeriod} from './ferry-ship.js';
import {buildFerryModel,GANGWAY_Z,WL,FERRY_HULL,FERRY_RAMP,FERRY_DECKS,FERRY_CASINGS,halfBreadth} from './ferry-model.js';
import {MINATO_BERTH} from './minato-berth.js';
import {FERRY_INSPECT,FERRY_LADDER} from './ferry-inspect.js';
import {FERRY_PASSENGER_SEATS} from './ferry-interior.js';
import {createPlant} from './ferry-plant.js';
import {createFerryOperations,FERRY_PROCEDURE} from './ferry-operations.js';
import {PLANT_STATIONS,stationLabel,plantSound,telegraphFor} from './ferry-plant-controls.js';
import {OUTER_PIER} from './layout.js';
import {BERTH_X,BERTH_Z,townArrival,townDeparture} from './ferry-paths.js';
import {lanternGlow,windowGlow} from '../render/dusk.js';

/**
 * One Minato–Kitano-jima ferry, the town's Minato Maru (ferry-ship.js, ferry-model.js), carries a hundred
 * passengers and six cars. At Minato she lies port side to the outer pier on its fenders with her bow
 * ramp on the quay's landing plate and her gangway from the port casing's door to the pier; at
 * Kitano-jima she lands her ramp on the pier. In play she keeps
 * the timetable (ferry-timetable.js, `keepTimetable`): she prepares each sailing, sounds her horn two minutes before it,
 * closes her gangway at its time and sails, whoever is aboard. The legacy commuter timetable interface remains for the
 * tests that drive the run without play.
 */
export const FERRY=Object.freeze({length:FERRY_HULL.length,beam:FERRY_HULL.beam,freeboard:FERRY_HULL.freeboard,draft:FERRY_HULL.draft,waterline:WL});
/** The outer pier's west flank (layout.js OUTER_PIER: x 0, 8.2 m wide). */
const PIER_WEST=-4.1;

/** Where it lies: alongside the pier's open west flank, clear of the rails and bollards. */
export const FERRY_BERTH=Object.freeze({
 x:BERTH_X,z:BERTH_Z,
 /** The gangway, from the port casing's door to the pier, short of the pier's end. */
 gangwayZ:BERTH_Z+GANGWAY_Z,
});

/**
 * The terminal: a ticket booth and a shelter on the quay at the root of the pier. It
 * takes over from the bus station's points -- queue, platform, arrival, exit -- so the
 * schedules that walked people to the bus walk them here.
 */
export const FERRY_TERMINAL=Object.freeze({
 // The waiting hall of the Minato Port Building (port-building.js), on the quay at the
 // pier's root. It used to be a booth of its own beside the harbour office.
 id:'ferry-terminal',x:(PORT_BUILDING.hall.minX+PORT_BUILDING.hall.maxX)/2,z:(PORT_BUILDING.hall.minZ+PORT_BUILDING.hall.maxZ)/2,
 minX:PORT_BUILDING.hall.minX,maxX:PORT_BUILDING.hall.maxX,minZ:PORT_BUILDING.hall.minZ,maxZ:PORT_BUILDING.hall.maxZ,
 /** The gangway's foot on the pier, which is where the queue starts. */
 queue:Object.freeze([FERRY_H1.shore.queueX,FERRY_BERTH.gangwayZ]),
 /** Where somebody waiting stands: under the hall's canopy, off the pier. */
 platform:PORT_BUILDING.platform,
 /** Where the people it brought step onto the pier: the open pier end, clear of the crate stack. */
 arrival:Object.freeze([FERRY_H1.shore.arrivalX,FERRY_BERTH.gangwayZ-.7]),
 driver:PORT_BUILDING.driver,
 exit:PORT_BUILDING.platform,
});

/**
 * Her mooring lines at Minato (docs/FERRY-AUDIT.md §6, batch 6d): four vinylon lines from her bitts, out through a
 * fairlead at the bulwark, to the pier's bitts (minato-berth.js MINATO_BERTH.bitts): the head line and the forward
 * spring from the forward mooring station on the port bow house, the after spring and the stern line from the aft
 * station. Points in her frame (ferry-model.js); the pier's in the world.
 *
 * Each station keeps its own two ropes, coiled on its own deck (`ropes`): the port bow's, the stern's and the starboard
 * bow's. A berth's lines name the rope they use (`rope`), the bitt it is made fast on (`bitt`) and the fairlead it is
 * led through (`lead`); a rope a berth does not use stays coiled at its station, so no coil ever moves between them.
 * (3 November 2026: at Kitano-jima the stern's two lines were led to the pier ahead of her bow, 37 m through her
 * casing and across the car deck: docs/minato-maru/exterior, problem 1.)
 */
const CAR_Y=FERRY_DECKS.car.y,BH_TOP=FERRY_CASINGS.bowHouses.top,HALF_L=FERRY_HULL.length/2;
const v3=a=>Object.freeze(a);
export const FERRY_MOORING=Object.freeze({
 bitts:Object.freeze({aft:v3([2.9,CAR_Y+.45,1.6-HALF_L]),fwd:v3([3.1,BH_TOP+.4,33.6-HALF_L]),
  // The forward bitt's head on each bow house, for a line led ahead through the stem fairlead (bow-on, at Kitano-jima).
  bowP:v3([3.1,BH_TOP+.45,33.85-HALF_L]),bowS:v3([-3.1,BH_TOP+.45,33.85-HALF_L])}),
 fairleads:Object.freeze({aft:v3([halfBreadth(2.2-HALF_L)-.06,CAR_Y+1.0,2.2-HALF_L]),fwd:v3([3.9,BH_TOP+.16,34.15-HALF_L]),
  // The closed fairleads in the bow houses' forward rails, one each side of the ramp (ferry-model.js: the forward mooring station).
  bowP:v3([3.0,BH_TOP+.2,HALF_L-.1]),bowS:v3([-3.0,BH_TOP+.2,HALF_L-.1])}),
 /** The six ropes aboard, two a station, each coiled on its own station's deck clear of the windlass and the bitts. */
 ropes:Object.freeze([
  ['head line','fwd',[3.45,BH_TOP+.08,13.9]],['forward spring','fwd',[3.45,BH_TOP+.08,14.55]],
  ['after spring','aft',[3.3,CAR_Y+.03,-14.8]],['stern line','aft',[3.3,CAR_Y+.03,-16.3]],
  ['starboard head line','fwdS',[-3.45,BH_TOP+.08,13.9]],['starboard bow line','fwdS',[-3.45,BH_TOP+.08,14.55]],
 ].map(([name,station,coil])=>Object.freeze({name,station,coil:v3(coil)}))),
 lines:Object.freeze(MINATO_BERTH.bitts.map((b,i)=>{const station=/head|forward/.test(b.line)?'fwd':'aft';
  return Object.freeze({name:b.line,station,rope:i,bitt:station,lead:station,pier:v3([b.x,OUTER_PIER.height+.5,b.z])});})),
 radius:.025,
});
/** Kitano's actual pier fittings, beside its rails and clear of the loading centreline: two each side of the ramp. */
export const KITANO_FERRY_BITTS=Object.freeze([[-54.55,28.45],[-51.4,28.45],[-53.65,33.55],[-54.55,33.55]].map(Object.freeze));
/**
 * At Kitano-jima she lies bow-on to the pier's end, so she makes fast from her bows only: each bow house's two ropes
 * are led ahead through its stem fairlead to the two bitts on its own side of the ramp. The stern's ropes stay coiled.
 */
const KITANO_LINES=Object.freeze([
 ['port head line','fwd','bowP',0],['port bow line','fwd','bowP',1],['starboard bow line','fwdS','bowS',5],['starboard head line','fwdS','bowS',4],
].map(([name,station,lead,rope])=>Object.freeze({name,station,rope,bitt:lead,lead})));
export const FERRY_MOORINGS=Object.freeze({
 town:Object.freeze(FERRY_MOORING.lines.map((l,i)=>Object.freeze({...l,id:'line-'+i,shoreTarget:Object.freeze({x:l.pier[0]+.65,y:OUTER_PIER.height,z:l.pier[2]})}))),
 airport:Object.freeze(KITANO_FERRY_BITTS.map(([u,v],i)=>{
  const [x,z]=airportWorld(u,v),[sx,sz]=airportWorld(u,v<31?v+.65:v-.65),y=AIRPORT_FERRY_PORTS.airport.height;
  return Object.freeze({...KITANO_LINES[i],id:'line-'+i,pier:Object.freeze([x,y+.45,z]),shoreTarget:Object.freeze({x:sx,y,z:sz})});
 })),
});

/**
 * Town minutes for each part of a call -- real minutes, since the clock is the one on your
 * wall (town-clock.js). She comes in off the sea, slows to a crawl inside the breakwater, pivots in
 * the western basin and is alongside four and a half minutes later; it loads for a quarter of an
 * hour (BUS_DWELL); getting out of port takes five minutes -- astern off the berth, a slow
 * swing in the basin, dead slow to the breakwater -- and only then does it open up and
 * go. Each part is a leg of the passage (ferry-paths.js townArrival, townDeparture).
 */
export const FERRY_TIMES=Object.freeze({sea:2,harbour:4.5,reverse:1.5,turn:1.5,leaveHarbour:2,leaveSea:2});
const ARRIVAL=townArrival(FERRY_TIMES),DEPARTURE=townDeparture(FERRY_TIMES);
/** The timetable's passages in and out of Minato, for the tests and the sounds. */
export const TOWN_PASSAGES=Object.freeze({arrival:ARRIVAL,departure:DEPARTURE});

/**
 * How she moves on the water, whatever she is doing: she heaves with the swell, rolls at her own
 * period (ferry-ship.js rollPeriod, about five and a half seconds) and pitches a little, more at sea
 * than in harbour, `exposure` 0 alongside and in the basin, 1 out in the strait. Roll and pitch are
 * a few degrees at most: ±0.35° in harbour, ±2° at sea (briefs/ferry-audit.md §7.2). Time is the
 * game's clock in seconds, so she rolls at her real period even when a crossing is shown faster.
 */
/** Her origin's height with her at rest in calm water (the waterline at sea level). */
const REST_Y=SEA_LEVEL+FERRY_HULL.origin;
/** The ramp's leaf, at rest on a landing at height `landing`: how far it drops from the car deck (radians below level). */
const rampSlope=landing=>Math.asin(Math.max(-1,Math.min(1,(REST_Y+FERRY_HULL.freeboard-landing-.05)/FERRY_RAMP.leaf)));
export function shipMotion(x,z,time,exposure=0){
 const e=Math.max(0,Math.min(1,exposure)),deg=Math.PI/180,Tr=rollPeriod(FERRY_HULL),Tp=pitchPeriod(FERRY_HULL),phase=x*.37+z*.21;
 const roll=(.35+1.65*e)*deg*(.85*Math.sin(2*Math.PI*time/Tr+phase)+.15*Math.sin(2*Math.PI*time/(Tr*1.61)+1.3*phase));
 const pitch=(.1+.4*e)*deg*Math.sin(2*Math.PI*time/Tp+.7*phase);
 const heave=(waveHeight(x,z,time)-SEA_LEVEL)*(.25+.55*e);
 return {y:REST_Y+heave,roll,pitch};
}

/** The ferry itself: the Minato Maru, modelled whole in ferry-model.js. */
export function buildFerry({shadows=false}={}){
 const ferry=buildFerryModel({shadows});ferry.name='Minato–Kitano-jima shared ferry';ferry.userData.dynamicProp=true;ferry.userData.walkSurface=false;
 // A ship on open water is seen from far off: drawn wherever she is in view, like the islands on the
 // horizon (render/town-sections.js), not only within the 54 m round the player that the streets
 // are, where she vanished at the harbour mouth while you watched her go from the pier.
 ferry.userData.horizon=true;
 // Heading first, then pitch about her own beam, then roll about her own length.
 ferry.rotation.order='YXZ';
 return ferry;
}

/**
 * @param {object} options
 * @param {THREE.Object3D} options.parent
 * @returns the run, with the bus's interface.
 */
export function createFerryRun({parent,shadows=false,colliders,register=null,onAction=()=>{}}={}){
 const ferry=buildFerry({shadows});parent.add(ferry);
 // Each line keeps its own eye, paid-out length and coil. Returning an eye is visible from the pier
 // to the receiving seaman, then the rope is heaved through the fairlead; it is never hidden as a group.
 const lines=new THREE.Group();lines.name='Minato Maru mooring lines';lines.visible=false;lines.userData.walkSurface=false;lines.userData.dynamicProp=true;lines.userData.horizon=true;parent.add(lines);   // drawn wherever she is in view, like her (render/town-sections.js)
 const ropeGeo=new THREE.CylinderGeometry(FERRY_MOORING.radius,FERRY_MOORING.radius,1,6);ropeGeo.translate(0,.5,0);
 const ropeMat=new THREE.MeshStandardMaterial({color:0xd9cfa8,roughness:.92});
 const coilRings=Array.from({length:4},(_,i)=>{const g=new THREE.TorusGeometry(.16+i*.028,.017,5,14);g.rotateX(Math.PI/2);g.translate(0,i*.023,0);return g;});
 const coilGeometry=mergeGeometries(coilRings);for(const g of coilRings)g.dispose();
 const ropeSets=FERRY_MOORING.ropes.map(l=>{
  const segments=[0,1,2].map(()=>{const m=new THREE.Mesh(ropeGeo,ropeMat);m.name='Mooring line: '+l.name;lines.add(m);return m;});
  const eye=new THREE.Mesh(new THREE.TorusGeometry(.13,FERRY_MOORING.radius,5,12),ropeMat);eye.name='Returned eye: '+l.name;lines.add(eye);
  const coil=new THREE.Mesh(coilGeometry,ropeMat);coil.name='Coiled aboard: '+l.name;coil.position.set(...l.coil);ferry.add(coil);
  return {segments,eye,coil};
 });
 for(const [i,l] of FERRY_MOORINGS.airport.entries()){
  const bitt=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,.45,10),new THREE.MeshStandardMaterial({color:0x424b50,roughness:.8}));
  bitt.name='Kitano ferry pier bitt: '+l.name;bitt.position.set(l.pier[0],l.pier[1]-.225,l.pier[2]);parent.add(bitt);
  colliders?.push({id:'kitano-ferry-bitt-'+i,x:l.pier[0],z:l.pier[2],r:.16,height:l.pier[1]});
 }
 const vA=new THREE.Vector3(),vB=new THREE.Vector3(),vD=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0);
 const lay=(m,a,b)=>{vD.subVectors(b,a);const L=vD.length();m.position.copy(a);m.scale.set(1,Math.max(.01,L),1);m.quaternion.setFromUnitVectors(UP,vD.normalize());};
 const moor=(list,visible=true)=>{lines.visible=visible;
  // A rope this berth does not work stays coiled on its own station's deck.
  const worked=new Set(list.map((l,i)=>l.rope??i));
  ropeSets.forEach((r,k)=>{if(worked.has(k))return;for(const m of r.segments)m.visible=false;r.eye.visible=false;r.coil.visible=visible;});
  list.forEach((l,i)=>{
   const {segments,eye,coil}=ropeSets[l.rope??i],bitt=ferry.localToWorld(vA.set(...FERRY_MOORING.bitts[l.bitt||l.station])).clone(),lead=ferry.localToWorld(vB.set(...FERRY_MOORING.fairleads[l.lead||l.station])).clone(),shore=new THREE.Vector3(...l.pier),p=l.progress||0,status=l.status||'fast';
   const coiled=status==='coiled';for(const m of segments)m.visible=!coiled;eye.visible=!coiled;
   coil.visible=visible&&(coiled||status==='heaving'||status==='paying-out');
   const fraction=status==='eye-return'?1-(p-.25)*4:status==='paying-out'?Math.min(1,p*2):1;
   // The returned eye reaches the fairlead before it is hauled inboard. Continue from
   // that same point: restarting a heaving segment at the pier would throw it ashore again.
   const end=status==='heaving'?lead.clone().lerp(bitt,Math.max(0,Math.min(1,(p-.5)*2))):lead.clone().lerp(shore,Math.max(0,Math.min(1,fraction))),middle=lead.clone().lerp(end,.5);
   if(status!=='fast')middle.y-=Math.min(.65,lead.distanceTo(end)*.06);
   lay(segments[0],bitt,lead);lay(segments[1],lead,middle);lay(segments[2],middle,end);eye.position.copy(end);eye.rotation.set(Math.PI/2,0,0);
  });
 };
 // What you can look at aboard (ferry-inspect.js): prompts that move with her, offered only on the deck you stand on.
 if(register)for(const p of FERRY_INSPECT){const a=new THREE.Object3D();a.name='Ferry: '+p.title;a.position.set(...p.pos);a.userData.sameLevel=true;a.userData.reach=p.reach??2.2;a.userData.facing=p.facing??.55;ferry.add(a);
  register(a,p.label,()=>onAction('inspect',p.title,p.text));}
 // Seats anyone may take (ferry-interior.js FERRY_PASSENGER_SEATS): the front row by the bow windows, a window seat, a
 // bench on the raised passenger floor. Each moves with her: where it is, where he stands up and the way it faces are read from
 // her pose when he sits, and `aboard` keeps them in her frame so game.js carries him on it while she sails.
 if(register)for(const p of FERRY_PASSENGER_SEATS){const a=new THREE.Object3D();a.name='Ferry seat: '+p.title;a.position.set(...p.anchor);
  a.userData.sameLevel=true;a.userData.reach=1.6;a.userData.facing=.4;a.userData.npcInteraction=false;ferry.add(a);
  const at=v=>{ferry.updateMatrixWorld(true);return ferry.localToWorld(new THREE.Vector3(...v)).toArray();};
  a.userData.seat={get position(){return at(p.position);},get stand(){return at(p.stand);},get surfaceY(){return at(p.position)[1]+p.surface;},
   get yaw(){return ferry.rotation.y+p.yaw;},pitch:0,eyeY:p.eyeY,
   aboard:Object.freeze({position:p.position,stand:p.stand,surface:p.surface,yaw:p.yaw})};
  register(a,p.label,()=>onAction('seat',p.title,p.text));}
 // The engine-room ladder: down from the casing door, up from the floor plates (game.js moves him; ferry-inspect.js).
 if(register)for(const [way,l] of Object.entries(FERRY_LADDER)){const a=new THREE.Object3D();a.name='Ferry: ladder '+way;a.position.set(...l.at);a.userData.sameLevel=true;ferry.add(a);
  register(a,l.label,()=>onAction('ferry-ladder',way));}
 // And the crossing itself, asked for at the purser's window: to Kitano-jima from Minato, home from Kitano-jima.
 if(register){const a=new THREE.Object3D();a.name='Ferry: purser';a.position.set(-2.3,FERRY_DECKS.upper.y+1.2,FERRY_DECKS.saloon.aft+3.1);a.userData.sameLevel=true;ferry.add(a);
  register(a,'Ask the purser for the crossing',()=>onAction(run.berth==='airport'?'airport-return':'airport-ferry'));}
 let phase='away',t=0,service=null,serviceAt=null,lastMinutes=null,clock=0,yaw=0,x=FERRY_BERTH.x,z=FERRY_BERTH.z,exposure=0,shipSeconds=null,plan=null;
 let berth='town',localService=false,crossing=null,crewController=null,vehicleController=null,accessGuard=()=>true;
 // The timetable (ferry-timetable.js): whether she keeps it, the last sailing begun and warned, and the clock last seen.
 let timetable=false,ranSailing=null,warnedSailing=null,keptMinutes=null;
 const DOOR=[FERRY_TERMINAL.queue[0],FERRY_TERMINAL.queue[1]];
 // Her whistle: every signal she sounds, in order (the town's sound plays each one where she is).
 const whistle={count:0,kind:null,x,z,log:[]};
 const sound=kind=>{whistle.count++;whistle.kind=kind;whistle.x=x;whistle.z=z;whistle.log.push({n:whistle.count,kind,x,z});if(whistle.log.length>6)whistle.log.shift();};
 // The plant (6r-2, ferry-plant.js): her machines as they run, worked by the crew's day and by the player at the
 // stations (ferry-plant-controls.js); the console's dials and alarm matrix, the prompts and her sound read it.
 const plant=createPlant();let plantMinute=null,plantShown=-1;const stations=[];
 if(register)for(const st of PLANT_STATIONS){const a=new THREE.Object3D();a.name='Ferry: '+st.title;a.position.set(...st.pos);a.userData.sameLevel=true;a.userData.reach=st.reach;a.userData.facing=.55;ferry.add(a);
  register(a,stationLabel(plant,st),()=>onAction('plant',st.id));stations.push({st,a});}
 /** The prompts and the live plates follow the plant (after the crew's routine, time passing, or the player's hand). */
 const showPlant=()=>{for(const {st,a} of stations)if(a.userData.hit)a.userData.hit.label=stationLabel(plant,st);ferry.userData.readPlant?.(plant.readings());};
 /**
 * Advances the plant to the town's minute: the crew's routine each minute, time passing, the telegraph by her phase.
 * The first time (and when the clock is set back or jumps), the day so far is replayed from midnight in five-minute
 * steps, so an engine that the crew started at 6:25 is warm with its hours on the counter when the player comes aboard
 * at two, not one that has just been started.
 */
 const runPlant=(minutes,dt=0)=>{
  if(operations.active){plant.tick(Math.min(.25,Math.max(0,dt))/60);plantMinute=minutes;showPlant();return;}
  const m=((minutes%1440)+1440)%1440;
  if(plantMinute===null||minutes<plantMinute||minutes-plantMinute>180){const day=minutes-m;for(let t=0;t<m;t+=5){plant.routine(t);plant.tick(Math.min(5,m-t));}plantMinute=minutes;plant.routine(m);}
  const dm=minutes-plantMinute;if(dm>0){plant.tick(dm);if(Math.floor(minutes)!==Math.floor(plantMinute))plant.routine(m);plantMinute=minutes;}
  const under=!['waiting','away'].includes(phase);plant.setUnderway(under);const order=telegraphFor(phase,exposure);
  // Manoeuvring (FERRY_WATCH: the chief puts both generators on the board for the thruster), No.2 comes on; alongside again it goes off, unless the player has it in hand.
  const g2=plant.machine('gen2');if(g2&&!g2.manual){const manoeuvring=['reversing','swinging'].includes(phase)||(phase==='arriving'&&(exposure<.5||g2.state==='running'))||(phase==='leaving'&&exposure<.5);   // once on for the arrival it stays on until she is alongside
   if(manoeuvring&&g2.state==='stopped'&&plant.start('gen2').ok){plant.closeBreaker('gen2');g2.manual=false;}
   else if(!manoeuvring&&g2.state==='running'&&g2.breaker&&plant.readings().board.generatorsOnline>1){plant.openBreaker('gen2');plant.stop('gen2');g2.manual=false;}}
  for(const id of ['mainP','mainS'])if(plant.readings().telegraph[id]!==order)plant.setTelegraph(id,order);
  if(Math.abs(minutes-plantShown)>=.05){plantShown=minutes;showPlant();}
 };
 /** Signals of the passage she is on, sounded as her time passes each one. */
 const signalsBetween=(passage,from,to)=>{if(!passage||to<=from)return;for(const s of passage.signals)if(s.at>=from&&s.at<to)sound(s.kind);};
 const set=(nx,nz,nyaw)=>{x=nx;z=nz;yaw=nyaw;};
 const park=()=>{set(FERRY_BERTH.x,FERRY_BERTH.z,0);ferry.visible=true;};
 /** Her pose on the water, from the shared motion; alongside, the ramp's toe and the gangway's foot stay on the landing. */
 const pose=()=>{
  const m=shipMotion(x,z,clock,exposure);
  ferry.position.set(x,m.y,z);ferry.rotation.set(m.pitch,yaw,m.roll);ferry.updateMatrixWorld(true);
  // The sea stays outside her plating: no water inside her engine room (her parallel body, shipyard z 6 to 28).
  setOceanHole(x,z,yaw,FERRY_HULL.beam/2-.15,11,-.25);
 };
 const place=()=>{
  const operation=operations.snapshot(),moored=phase==='waiting',access=operation?.gangway.out??(moored&&berth==='town'?1:0);
  pose();
  ferry.userData.gangway.visible=true;ferry.userData.setGangway?.(access);ferry.userData.setGate?.(access);
  // Down, the ramp rests on its landing: the steel plate in Minato's quay, Kitano-jima's pier.
  const landing=berth==='airport'?AIRPORT_FERRY_PORTS.airport.height:MINATO_BERTH.landing.top,down=run.rampDown;
  if(down>=1)ferry.userData.restRamp?.(landing);else ferry.userData.setRamp?.(down,rampSlope(landing));
  ferry.userData.setRampLocked?.(operation?.ramp.locked??!moored);
  if(access>=1&&berth==='town')ferry.userData.restGangway?.(OUTER_PIER.height);
  moor(operation?.lines||FERRY_MOORINGS[berth].map(l=>({...l,status:'fast',progress:0})),ferry.visible);
  // Her screws turn and the radar sweeps while she moves; alongside both are still.
  const moved=Math.hypot(x-last.x,z-last.z),dt=clock-last.t;last.x=x;last.z=z;last.t=clock;
  if(dt>0&&dt<1)ferry.userData.underway?.(dt,moored?0:Math.min(6,moved/dt),plant.readings());
 };
 const last={x,z,t:0};
 /**
  * Her lights, by the clock: the navigation lights (masthead, sidelights, stern light) whenever she
  * is under way between sunset and sunrise, and none alongside; the saloon and wheelhouse lit after
  * dark while she is in service (FERRY_DAY), and only the night watch's light after the last boat.
  */
  const lights=(minutes,underway)=>{
  const m=((minutes%1440)+1440)%1440,dark=lanternGlow(minutes)>=.5,inService=m>=FERRY_DAY.inService&&m<FERRY_DAY.shorePower;
  ferry.userData.setNavigationLights?.(underway&&dark);
  ferry.userData.setCabinLights?.(windowGlow(minutes)*(underway||inService?1:.12));
  // The ramp floodlights: loading after dark (FERRY_LOADS `floodlights`), alongside and in service.
  ferry.userData.setFloodlights?.(!underway&&dark&&inService);
 };
 // Nobody walks on the harbour, but the gangway's foot is on the pier: a collider for the
 // hull alongside stops the player stepping off the pier's open flank onto the water.
 const solid=colliders?{id:'ferry',moving:true,x:FERRY_BERTH.x,z:FERRY_BERTH.z,w:FERRY.beam,d:FERRY.length,height:3}:null;
 if(solid)colliders.push(solid);
 const trackSolid=()=>{if(!ferry.visible)setOceanHole(0,0,0,0,0);if(!solid)return;const here=ferry.visible&&!['crossing','away'].includes(phase);solid.x=here?x:1e6;solid.z=here?z:1e6;solid.yaw=yaw;};
 const operations=createFerryOperations({plant,sailings:FERRY_SAILINGS,getBerth:()=>berth,getMinutes:()=>lastMinutes??0,getLines:location=>FERRY_MOORINGS[location],
  getCrew:()=>crewController,getVehicles:()=>vehicleController,accessClear:()=>accessGuard(),
  onStage:stage=>{phase=stage==='alongside'?'waiting':['passage','departing'].includes(stage)?'crossing':['arriving','making-fast','opening-access'].includes(stage)?'arriving':stage==='held'&&operations.snapshot()?.heldFrom==='passage'?'crossing':'preparing';},
  onPose:(p,op)=>{signalsBetween(FERRY_SAILINGS[op.destination],crossing?.seconds??-1,p.seconds+(p.progress>=1?1e-6:0));if(crossing)crossing.seconds=p.seconds;set(p.x,p.z,p.yaw);exposure=p.exposure;},
  onBerth:destination=>{berth=destination;exposure=0;const p=AIRPORT_FERRY_PORTS[destination];set(p.berth[0],p.berth[1],p.yaw);serviceAt=lastMinutes??0;},
 });
 /**
  * Keeping the timetable, each frame. When the town's clock jumps (time passed, a save loaded, the page back after a
  * while) she is put where the timetable has her, as the whole town is; otherwise each sailing is begun three minutes
  * before its time (FERRY_PREPARE_MINUTES), and her horn sounds two minutes before it.
  */
 function keep(minutes){
  const jumped=keptMinutes===null||minutes<keptMinutes||minutes-keptMinutes>2;keptMinutes=minutes;
  if(jumped)settle(minutes);
  if(!operations.active){
   const due=sailingDue(minutes,berth);
   if(due&&due.key!==ranSailing&&run.beginCrossing(due.sailing.to,{automatic:true,departs:due.at,sailing:due.sailing.id}))ranSailing=due.key;
  }
  const op=operations.snapshot();
  if(op&&Number.isFinite(op.departs)&&minutes>=op.departs-FERRY_WARNING_MINUTES&&warnedSailing!==op.id&&['preparing','securing'].includes(op.stage)){warnedSailing=op.id;sound('departure');}
 }
 function settle(minutes){
  const target=timetableBerth(minutes),was=operations.active;
  if(was)operations.abandon();
  if(!was&&berth===target&&phase==='waiting'&&ferry.visible)return;
  const p=AIRPORT_FERRY_PORTS[target];operations.reset();berth=target;crossing=null;phase='waiting';exposure=0;serviceAt=minutes;
  set(p.berth[0],p.berth[1],p.yaw);ferry.visible=true;
  // A sailing whose time came and went in the jump is not made late; one still to come is made.
  const due=sailingDue(minutes,target);ranSailing=due&&minutes>due.at?due.key:null;warnedSailing=null;
  place();trackSolid();
 }
 park();ferry.visible=false;trackSolid();
 const run={
  ferry,
  /** Kept under the old name too: the debug readout and a few callers ask for `.bus`. */
  get bus(){return ferry;},
  get phase(){return phase;},
  get berth(){return berth;},
  get destination(){return operations.active?operations.snapshot().destination:null;},
  get crossingProgress(){return operations.active?operations.snapshot().progress:null;},
  get automaticCrossing(){return operations.active&&operations.snapshot().automatic===true;},
  get gangwayOut(){return operations.snapshot()?.gangway.out??(phase==='waiting'&&berth==='town'?1:0);},
  get operation(){return operations.snapshot();},
  procedure:FERRY_PROCEDURE,
  get completedVoyages(){return operations.completed;},
  bindCrewController(controller){crewController=controller;},
  /** From now on she sails to the timetable (island/play.js), not on anybody's request. */
  keepTimetable(on=true){timetable=!!on;keptMinutes=null;if(timetable)localService=true;},
  get keepsTimetable(){return timetable;},
  /**
   * The sailing she is about to make from where she lies, from two minutes before it until her gangway is in:
   * {sailing, at, from, to}. The horn has sounded; the sign reads 出港; aboard he is asked to go ashore or stay.
   */
  get departing(){
   const op=operations.snapshot();
   if(!timetable||!op||!Number.isFinite(op.departs)||!['preparing','securing','closing-access'].includes(op.stage))return null;
   if((lastMinutes??0)<op.departs-FERRY_WARNING_MINUTES)return null;
   return {sailing:op.sailing,at:op.departs,from:op.origin,to:op.destination,stage:op.stage};
  },
  bindVehicleController(controller){vehicleController=controller;},
  setAccessGuard(guard){accessGuard=typeof guard==='function'?guard:()=>true;},
  /** Both passengers and vehicles use this single ferry group and these ports. */
  parkAt(location){
   if(!AIRPORT_FERRY_PORTS[location])throw new RangeError('Unknown ferry berth');
   if(!operations.reset())return false;
   const p=AIRPORT_FERRY_PORTS[location];berth=location;localService=true;crossing=null;phase='waiting';exposure=0;
   serviceAt=lastMinutes??0;service=service??0;set(p.berth[0],p.berth[1],p.yaw);ferry.visible=true;place();trackSolid();
   if(lastMinutes!==null)lights(lastMinutes,false);
   return true;
  },
  get moored(){const op=operations.snapshot();return ferry.visible&&(op?op.lines.every(l=>l.status==='fast'):phase==='waiting');},
  beginCrossing(destination,{automatic=false,departs=null,sailing=null}={}){
   if(!AIRPORT_FERRY_PORTS[destination]||destination===berth||!operations.request(destination,{automatic,departs,sailing}))return false;
   localService=true;crossing={destination,seconds:null};ferry.visible=true;place();trackSolid();return true;
  },
  /** Kept for old observers. Only update() owns elapsed physical time. */
  advanceAutomaticCrossing(){return null;},
  setCrossingProgress(progress){
   return operations.active&&Number.isFinite(progress)&&Math.abs(progress-run.crossingProgress)<1e-9;
  },
  get door(){return [...DOOR];},
  /** A queue across the pier end from the gangway, south of the crate stack and clear of the bollards. */
  queueSpot(place=0){return [DOOR[0]+(place%3)*.75,DOOR[1]-.35-Math.floor(place/3)*.85];},
  /** On board: the deck beyond the gangway. */
  get doorway(){return [FERRY_BERTH.x+FERRY.beam/2-.9,FERRY_BERTH.gangwayZ];},
  get boarding(){return run.canLoad&&berth==='town';},
  get canLoad(){return ferry.visible&&['alongside','preparing'].includes(operations.stage)&&run.rampDown>=1;},
  get canUnload(){return ferry.visible&&!operations.active&&phase==='waiting'&&run.rampDown>=1&&run.moored;},
  /** Town minutes since it came alongside, while it is alongside. */
  get alongsideFor(){return phase==='waiting'&&Number.isFinite(serviceAt)?Math.max(0,lastMinutes-serviceAt):null;},
  /** The bow ramp: down a minute after it berths, up again a minute before it leaves. */
  get rampDown(){if(localService)return operations.snapshot()?.ramp.down??(phase==='waiting'?1:0);const e=run.alongsideFor;if(e===null)return 0;const s=u=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);};return Math.min(s(e-.2),s(BUS_DWELL-.4-e));},
  get service(){return service;},
  /** Her plant (ferry-plant.js) and the stations the player works it at; `refreshPlant` after the player's hand. */
  get plant(){return plant;},get stations(){return stations.map(s=>s.st);},refreshPlant(){showPlant();},
  /** What the town's sound needs: where she is, what she is doing, her engines and her whistle. */
  get audio(){
   const m=((lastMinutes??0)%1440+1440)%1440,underway=operations.active?['passage','arriving'].includes(operations.stage):!['waiting','away'].includes(phase);
   const engines=!ferry.visible?'off':plantSound(plant.readings(),{underway,exposure});
   return {phase,x,z,engines,whistle:{count:whistle.count,kind:whistle.kind,x:whistle.x,z:whistle.z,log:[...whistle.log]}};
  },
  update(dt,minutes=0,time){
   if(!(dt>0))return;
   clock=Number.isFinite(time)?time:clock+dt;
   runPlant(minutes,dt);
   if(localService){lastMinutes=minutes;if(timetable)keep(minutes);operations.tick(dt);place();lights(minutes,['passage','arriving'].includes(operations.stage));trackSolid();return;}
   try{
    if(lastMinutes===null||minutes<lastMinutes||minutes-lastMinutes>dt+1){
     phase='away';service=null;serviceAt=null;ferry.visible=false;plan=null;shipSeconds=null;
     const day=Math.floor(minutes/1440),m=minutes-day*1440;
     const current=HARBOUR_LINE.find(s=>m>=s&&m<s+BUS_DWELL);
     if(current!==undefined){service=current;serviceAt=day*1440+current;park();phase='waiting';exposure=0;}
    }
    lastMinutes=minutes;
    run.step(dt,minutes);
    if(ferry.visible){place();lights(minutes,!['waiting','away'].includes(phase));}
   }finally{trackSolid();}
  },
  step(dt,minutes=0){
   if(localService||operations.active)return;
   // Everything is read off the clock rather than added up frame by frame, so the ferry is
   // where the timetable says whatever the frame rate or the clock's speed.
   const T=FERRY_TIMES,inbound=T.sea+T.harbour;
   const follow=(passage,seconds)=>{if(plan!==passage){plan=passage;shipSeconds=null;}signalsBetween(passage,shipSeconds===null?-1:shipSeconds,seconds);shipSeconds=seconds;const p=passage.pose(seconds);set(p.x,p.z,p.yaw);exposure=p.exposure;return p;};
   if(phase==='away'){
    const due=nextService(minutes);
    if(due.wait<=inbound){service=due.service;serviceAt=minutes+due.wait;phase='arriving';ferry.visible=true;}
    else return;
   }
   if(phase==='arriving'){
    const e=inbound-(serviceAt-minutes);
    if(e>=inbound){park();serviceAt=Math.max(serviceAt,minutes);phase='waiting';exposure=0;plan=null;return;}
    follow(ARRIVAL,Math.max(0,e)*60);
    return;
   }
   if(phase==='waiting'){
    if(minutes-serviceAt>=BUS_DWELL)phase='reversing';
    else return;
   }
   // Astern off the berth, the swing on the thruster, then ahead: the legs of the departure.
   const e=(minutes-(serviceAt+BUS_DWELL))*60;
   if(e>=DEPARTURE.duration){ferry.visible=false;phase='away';service=null;plan=null;ferry.userData.setNavigationLights?.(false);return;}
   const p=follow(DEPARTURE,e);
   phase=p.kind==='astern'?'reversing':p.kind==='swing'?'swinging':'leaving';
  },
 };
 return run;
}

/**
 * The ferry's stop: the prompts at the Port Building's waiting hall (port-building.js)
 * and the place the map and the schedules use. It answers the calls the bus station did.
 */
export function buildFerryTerminal({parent,colliders,register=()=>{},onAction=()=>{},enter=()=>{},label=()=>{},shadows=false}={}){
 const group=new THREE.Group();group.name='Minato ferry terminal';parent.add(group);
 const T=FERRY_TERMINAL;
 const anchor=(pos,text,fn)=>{const a=new THREE.Object3D();a.position.set(...pos);group.add(a);register(a,text,fn);return a;};
 // The Port Building owns the waiting hall and its supported canopy.
 const [px,pz]=T.platform;
 anchor([T.minX-.5,1.3,-44.95],'Read the shared ferry timetable',()=>onAction('read','Minato–Kitano-jima ferry','The combined passenger and vehicle ferry connects Minato and Kitano-jima. Buy passenger tickets inside the waiting hall, then board at the outer pier. Cars join crossings when their drivers have an island errand.'));
 anchor([px,1,pz+1.1],'Board the Kitano-jima ferry',()=>onAction('airport-ferry'));
 anchor([-4.5,1,-47.1],'Look out for the ferry',()=>onAction('inspect','Minato ferry','The shared ferry runs between Minato and Kitano-jima. Passengers use it every day; some crossings also carry island cars and service trucks. Return passenger tickets are sold at this terminal.'));
 const [hx,,hz]=PORT_BUILDING.hallDoor,outside=[hx-.7,0,hz];
 const place={id:T.id,title:'Minato Port Terminal',jp:'Minato Port Terminal',sub:'TICKETS · WAITING HALL',x:T.x,z:T.z,line:'The shared passenger and vehicle ferry to Kitano-jima, and the evening boat to Naha.',
  door:outside,exitPosition:outside,entryFacing:-Math.PI/2};
 anchor([hx-.45,1.3,hz],'Enter '+place.title,()=>enter(place));

 const departures=[];
 return {group,place,queue:[...T.queue],arrival:[...T.arrival],driver:[...T.driver],exit:[...T.exit],departures,
  board(name,minutes){departures.push({name,minutes});if(departures.length>24)departures.shift();},
  update(){}};
}
