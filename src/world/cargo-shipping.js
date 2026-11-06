import * as THREE from '../../vendor/three.module.js';
import {buildCargoBoat,createMooringLines} from './harbour-boats.js';
import {profiledTrack} from './ferry-paths.js';
import {CARGO_BERTH} from './minato-berth.js';
import {SEA_LEVEL} from './ocean.js';

/**
 * The island cargo boat: a 19-ton class island cargo boat (19トン型貨物船), 20 × 5 m, that brings rice,
 * shop goods, post and repair parts twice a day and takes chilled catch and outgoing mail away. She lies
 * at the outer pier's east face (minato-berth.js CARGO_BERTH), starboard side to, bow to the quay.
 *
 * She is a visitor with her own crew, a skipper and two hands who never come ashore in the game and are never the
 * ferry's people (docs/CAST-CONSOLIDATION.md §9: the ferry crew are never borrowed for cargo work, and no cargo crew
 * has a house ashore). Her calls fall between the ferry's, so the two never work the pier at once.
 * Her calls are real passages (docs/FERRY-AUDIT.md §6, batch 4b). In: up from the south through the open
 * water east of the harbour, round the breakwater's east end, across the eastern basin on a slant to the
 * pier and alongside, the stern brought in last. Out: the stern sprung off, astern until her bow is
 * past the pier's end, ahead swinging hard to port across the eastern basin, and away south. She never enters the ferry's water west of the
 * pier, and her minutes in and out of the harbour fall between the ferry's calls (08:30, 14:30, 22:00).
 */
export const CARGO_BOAT=Object.freeze({...CARGO_BERTH.boat,className:'19-ton class island cargo boat'});
const B=CARGO_BERTH,deg=Math.PI/180;
/** Where she lies off the berth before the stern comes in (and after it is sprung off). */
const OFF=Object.freeze({x:9,z:-64.5,yaw:-7.9*deg});
/** Her way in from beyond sight to OFF: north up the open water, round the breakwater's east end, slant in to the pier. */
const IN=profiledTrack([[64,-420],[64,-114],[38,-92],[12,-86],[OFF.x,OFF.z]],[26,18,16],{vMax:3.2,turnDeg:2.4,accel:.05,startSpeed:3.2,endSpeed:0});
/** Astern from OFF, straight back the way she came in, until her bow is past the pier's end. */
const ASTERN=profiledTrack([[OFF.x,OFF.z],[OFF.x-21.7*Math.sin(OFF.yaw),OFF.z-21.7*Math.cos(OFF.yaw)]],[],{vMax:.45,accel:.03,astern:true});
const BACKED=ASTERN.end;
/**
 * Ahead from there with the helm hard to port and the thruster pushing her bow round: she swings
 * east across the eastern basin (her stern kicks toward the pier's end but stays clear of it), then
 * east-south-east past the breakwater's end, and south out of sight.
 */
const OUT=profiledTrack([[BACKED.x,BACKED.z],[OFF.x,OFF.z+.3],[40,-80],[64,-112],[64,-420]],[11,16,24],{vMax:3.2,turnDeg:2.4,accel:.05,startSpeed:0,endSpeed:3.2});
const ALONGSIDE_S=50,SPRING_S=50;
const smoother=u=>{u=Math.max(0,Math.min(1,u));return u*u*u*(u*(u*6-15)+10);};
const lerpAngle=(a,b,u)=>{let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+d*u;};
const between=(a,b,u)=>({x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u,yaw:lerpAngle(a.yaw,b.yaw,u)});
const BERTH=Object.freeze({x:B.x,z:B.z,yaw:B.yaw});

/** Seconds of each passage. */
export const CARGO_PASSAGES=Object.freeze({
 arrival:Object.freeze({duration:IN.duration+ALONGSIDE_S,pose(t){
  if(t<IN.duration)return {...IN.pose(t),phase:'in'};
  const u=smoother((t-IN.duration)/ALONGSIDE_S);return {...between(IN.end,BERTH,u),phase:'alongside'};}}),
 departure:Object.freeze({duration:SPRING_S+ASTERN.duration+OUT.duration,pose(t){
  if(t<SPRING_S){const u=smoother(t/SPRING_S);return {...between(BERTH,ASTERN.start,u),phase:'springing off'};}
  t-=SPRING_S;if(t<ASTERN.duration)return {...ASTERN.pose(t),phase:'astern'};
  t-=ASTERN.duration;return {...OUT.pose(t),phase:'out'};}}),
});
const IN_MIN=CARGO_PASSAGES.arrival.duration/60,OUT_MIN=CARGO_PASSAGES.departure.duration/60;
/**
 * Alongside 07:30–08:55 and 15:00–16:30, as the board says; in and out take the passages' minutes. The
 * morning boat waits until the ferry has sailed (she used to leave at 08:40, in the middle of it).
 */
export const CARGO_CALLS=Object.freeze([[450,535],[900,990]].map(([alongside,departure])=>Object.freeze({arrival:alongside-IN_MIN,alongside,departure,gone:departure+OUT_MIN})));
const clock=m=>{const h=Math.floor(m/60),mm=Math.round(m%60);return String(h).padStart(2,'0')+':'+String(mm).padStart(2,'0');};

export function cargoVisit(minutes){
 const day=Math.floor(minutes/1440),m=minutes-day*1440,call=CARGO_CALLS.find(c=>m>=c.arrival&&m<c.gone);
 if(!call)return {phase:'at sea',visible:false,progress:0,day,name:day%2?'Island Trader':'Kitano Supply'};
 const phase=m<call.alongside?'arriving':m<call.departure?'alongside':'departing',progress=phase==='arriving'?(m-call.arrival)/(call.alongside-call.arrival):phase==='departing'?(m-call.departure)/(call.gone-call.departure):1;
 return {phase,visible:true,progress,day,name:day%2?'Island Trader':'Kitano Supply',call:CARGO_CALLS.indexOf(call),seconds:phase==='arriving'?(m-call.arrival)*60:phase==='departing'?(m-call.departure)*60:0};
}
/** Where she is at a town minute: {x, z, yaw, phase} (yaw 0 heading north, +z). */
export function cargoPose(minutes){
 const v=cargoVisit(minutes);
 if(v.phase==='arriving')return CARGO_PASSAGES.arrival.pose(v.seconds);
 if(v.phase==='departing')return CARGO_PASSAGES.departure.pose(v.seconds);
 return {...BERTH,phase:v.phase==='alongside'?'moored':'at sea'};
}

export function buildCargoShipping(world,{register,onAction}={}){
 const ship=new THREE.Group();ship.name='Scheduled island cargo ship';ship.userData.dynamicProp=true;world.group.add(ship);
 // Drawn by harbour-boats.js to the Minato Maru's finish: her lines, her house and crane, today's load, her name. Its
 // frame has her bow at +z; this one at +x, so it turns a quarter.
 const model=buildCargoBoat({length:CARGO_BOAT.length,beam:CARGO_BOAT.beam,shadows:true});model.rotation.y=Math.PI/2;ship.add(model);
 // She floats laden: the hull's foot 0.7 m below the water, her deck 0.95 m above it.
 const REST_Y=SEA_LEVEL-.04;
 // Her lines, alongside: from her fairleads (bow and stern, on her starboard side) to the bitts on the pier's east edge,
 // each hanging a little and re-laid every frame as she rises and rolls.
 const toShip=([x,y,z])=>new THREE.Vector3(z,y,-x);
 const lines=B.bitts.map(b=>{const lead=model.userData.leads.find(l=>l.line===b.line),rope=createMooringLines(world.group,1,{name:'Cargo mooring line',radius:.026});
  const m=rope.mesh;Object.assign(m.userData,{bitt:new THREE.Vector3(b.x,.6,b.z),fairlead:toShip(lead.at),rope});m.visible=false;return m;});
 const from=new THREE.Vector3();
 const placeLines=on=>{for(const m of lines){m.visible=on;if(!on)continue;from.copy(m.userData.fairlead);ship.localToWorld(from);m.userData.rope.set(0,from,m.userData.bitt,.12);}};
 let visit=cargoVisit(0);
 const times=CARGO_CALLS.map(c=>'in '+clock(c.arrival)+' · alongside '+clock(c.alongside)+'–'+clock(c.departure)+' · clear '+clock(c.gone));
 const a=new THREE.Object3D();a.position.set(-20,1,-49.3);world.group.add(a);register?.(a,'Read the cargo arrival board',()=>onAction?.('read','Island cargo calls','ISLAND SUPPLY SERVICE · outer pier, east side\nMorning: '+times[0]+'.\nAfternoon: '+times[1]+'.\n'+visit.name+' is '+visit.phase+'. Rice, shop goods, post and repair parts come in; chilled catch and outgoing mail leave. Her own two hands work her hatches, and the depot at the Quay Warehouse takes the goods in from the quay. Keep the pier’s east side clear while she berths.'));
 return {ship,update(time,minutes){
  visit=cargoVisit(minutes);ship.visible=visit.visible;
  const p=cargoPose(minutes);
  ship.position.set(p.x,REST_Y+Math.sin(time*.8)*.025,p.z);ship.rotation.set(0,p.yaw-Math.PI/2,Math.sin(time*.45)*.003);
  model.userData.showName(visit.name);ship.updateMatrixWorld();placeLines(visit.phase==='alongside');
 },snapshot:()=>({...visit,position:ship.position.toArray()})};
}
