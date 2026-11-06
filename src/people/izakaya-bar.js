import * as THREE from '../../vendor/three.module.js';
import {setPropPortion,updatePropPortion} from './izakaya-beer.js';

/**
 * One drink made by Thao, from where it is kept to the glass in her hand (world/interiors/minato-bar.js holds the
 * places and the order of the steps). Her right hand takes the glass off the rack, sets it at the tap or on the
 * worktop, takes the bottle from the back counter (or the jug out of the cold store, her left hand on the door),
 * pours, puts the bottle back and picks up the glass; the caller then carries it to whoever ordered it.
 *
 * Every object she handles is the room's own: the glass she sets down at your place is the glass she took from the
 * rack, the bottle she pours from is the back bar's own Sango Quay, put back where it stood.
 *
 * `full` (Linux, edition.js) adds the pour's own movement: the bottle or jug tipped over the glass with its stream,
 * and the tap's lever pulled. On the web the hands make the same round, and the glass fills while she holds the
 * bottle over it.
 */
const POUR={draft:4.2,awamori:1.8,oolong:1.6,bottle:2};
const REACH=.9,TURN=Math.PI*2.4;
const glassKind=kind=>kind==='draft'||kind==='awamori'||kind==='oolong'?kind:null;
const COLOURS={draft:0xd9a441,awamori:0xe9e2c8,oolong:0x8a4a1c,bottle:0xd9a441};

export function createBarRound({kind,bar,room,staff:g,walk,full=true,cancelled=()=>false}){
 const B=bar.data,steps=[...bar.rounds[kind]],u=g.userData;
 let step=-1,phase='walking',inside=null,timer=0,path=null,glass=null,source=null,set=null,stream=null,done=false,bottleOut=false,jug=null,ownBottle=null;
 // While she works, a free hand hangs still at her side: a walking swing would take it into the worktop.
 const hands=u.workHands={R:{rest:true},L:{rest:true}},held=u.workHeld={};u.workAvoid=B.solids;
 // At the cold store she stands in front of what she takes (or puts back), the door's pull still in her reach.
 const atStore=x=>{const sx=Math.min(B.store.maxStandX,x+.12);return {...B.store,stand:[sx,B.store.stand[1]],close:[sx,B.store.close[1]]};};
 let storeFor=null;
 const station=name=>name==='rack'?B.rack:name==='tap'?B.tap:name==='shelf'?B.shelf:name==='store'?storeFor:name==='warmer'?B.warmer:name==='sink'?B.sink
  :name==='return'?(jug?storeFor:B.shelf):name==='pick'?(kind==='draft'?B.tap:B.pour):B.pour;
 const hold=(side,object)=>{g.updateMatrixWorld(true);if(object.parent)g.attach(object);held[side]=object;};
 /** Out of her hand onto `at`, upright: the hand has brought it there. */
 const release=(side,object,at,parent=room)=>{parent.attach(object);if(at)object.position.copy(parent.worldToLocal(new THREE.Vector3(...at)));object.rotation.x=object.rotation.z=0;delete held[side];};
 /** A short straight step, in to work at a place or back out to the walking line (the places are clear of solids for
  * her body, tests/izakaya-bar.test.mjs). */
 const stepTo=([x,z],dt)=>{const dx=x-g.position.x,dz=z-g.position.z,d=Math.hypot(dx,dz);if(d<.005){g.position.x=x;g.position.z=z;return true;}const k=Math.min(1,dt*.5/d);g.position.x+=dx*k;g.position.z+=dz*k;return false;};
 const turnTo=(yaw,dt)=>{const d=Math.atan2(Math.sin(yaw-g.rotation.y),Math.cos(yaw-g.rotation.y));g.rotation.y+=Math.max(-dt*TURN,Math.min(dt*TURN,d));return Math.abs(d)<.02;};
 // The work at a station is a short list of moves: [seconds, what the hands do, what happens at its end].
 let moves=[];
 const plan=list=>{moves=list.filter(Boolean);timer=0;};
 function pourStream(from,to,colour){
  if(!full)return;
  if(!stream){stream=new THREE.Mesh(new THREE.CylinderGeometry(.0035,.0045,1,8,1,true),new THREE.MeshStandardMaterial({color:colour,roughness:.2,transparent:true,opacity:.85}));stream.name='Pouring stream';stream.castShadow=false;room.add(stream);}
  const a=room.worldToLocal(from.clone()),b=room.worldToLocal(to.clone()),mid=a.clone().add(b).multiplyScalar(.5),length=a.distanceTo(b);
  stream.position.copy(mid);stream.scale.set(1,Math.max(.001,length),1);stream.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.sub(a).normalize());stream.visible=true;
 }
 const stopStream=()=>{if(stream)stream.visible=false;};
 /** The glass fills while `seconds` pass; `from` gives the spout's world point for the stream. */
 const fill=(seconds,from,colour)=>[seconds,null,null,t=>{setPropPortion(glass,t,{immediate:true});updatePropPortion(glass,0);if(from)pourStream(from(),glass.localToWorld(new THREE.Vector3(0,(glass.userData.rimHeight||.1)*Math.max(.2,t),0)),colour);}];
 const spout=object=>()=>object.localToWorld(new THREE.Vector3(...(object.userData.spout||[0,.2,0])));
 function work(name){
  const R=v=>{hands.R=v;},L=v=>{hands.L=v;};
  if(name==='rack'){const g0=bar.glass(glassKind(kind));glass=g0;plan([[REACH,()=>R({reach:glass})],[.05,null,()=>hold('R',glass)],[.35,()=>R(lifted())]]);}
  else if(name==='tap')plan([
   [REACH,()=>R({place:B.tap.glass})],[.05,null,()=>{release('R',glass,B.tap.glass);}],
   [REACH,()=>R({to:bar.leverKnob().toArray()})],
   [.3,null,null,t=>{if(full)bar.lever=t;}],
   fill(POUR.draft,full?()=>bar.nozzle():null,COLOURS.draft),
   [.3,null,()=>stopStream(),t=>{if(full)bar.lever=1-t;}],
  ]);
  else if(name==='set'){const item=glass||set;plan([[REACH,()=>R({place:B.pour.glass})],[.05,null,()=>release('R',item,B.pour.glass)],[.3,()=>R({rest:true})]]);}
  else if(name==='shelf')plan([[REACH,()=>R({reach:bar.bottle.piece})],[.05,null,()=>{bottleOut=true;source=bar.bottle.piece;hold('R',source);}],[.35,()=>R(lifted())]]);
  else if(name==='store'){
   const item=kind==='oolong'?null:true;
   plan([
    [REACH,()=>L({to:bar.doorPull().toArray()})],
    [.7,null,null,t=>{bar.doorOpen=t;hands.L={to:bar.doorPull().toArray()};}],
    [.3,()=>L({rest:true})],
    [REACH,()=>{const it=bar.stock(kind);if(kind==='oolong')jug=it;else set=it;R({reach:it});}],
    [.05,null,()=>{const it=jug||set;hold('R',it);if(kind==='oolong')source=jug;}],
    [.35,()=>R(lifted())],
    [REACH,()=>L({to:bar.doorPull().toArray()})],
    [.7,null,()=>L({rest:true}),t=>{bar.doorOpen=1-t;hands.L={to:bar.doorPull().toArray()};}],
   ]);void item;
  }
  else if(name==='warmer'){set=bar.stock('sake');plan([[REACH,()=>R({reach:set})],[.05,null,()=>hold('R',set)],[.35,()=>R(lifted())]]);}
  else if(name==='pour')plan([
   [REACH,()=>R({pour:glass,tilt:0})],
   [.45,()=>R({pour:glass,tilt:full?2.1:0})],
   fill(POUR[kind],full?spout(source):null,COLOURS[kind]),
   [.4,()=>{stopStream();R({pour:glass,tilt:0});}],
   [.3,()=>R(lifted())],
  ]);
  else if(name==='pour-own'){
   // The big bottle's first glass: she lifts the bottle out of its set, pours, and stands it back beside the glass.
   glass=set;ownBottle=splitBottle(set);
   plan([[REACH,()=>R({reach:ownBottle})],[.05,null,()=>hold('R',ownBottle)],[REACH,()=>R({pour:set,tilt:0})],[.45,()=>R({pour:set,tilt:full?2.2:0})],
    fill(POUR.bottle,full?spout(ownBottle):null,COLOURS.bottle),[.4,()=>{stopStream();R({pour:set,tilt:0});}],
    [REACH,()=>R({place:ownBottle.userData.home})],[.05,null,()=>{release('R',ownBottle,null,set);ownBottle.position.set(...ownBottle.userData.local);ownBottle.rotation.set(0,0,0);}],[.3,()=>R({rest:true})]]);
  }
  else if(name==='return'){
   if(jug)plan([
    [REACH,()=>L({to:bar.doorPull().toArray()})],[.7,null,null,t=>{bar.doorOpen=t;hands.L={to:bar.doorPull().toArray()};}],[.3,()=>L({rest:true})],
    [REACH,()=>R({place:jugHome()})],[.05,null,()=>{delete held.R;bar.shelve(jug);jug=null;source=null;}],[.35,()=>R({rest:true})],
    [REACH,()=>L({to:bar.doorPull().toArray()})],[.7,null,()=>L({rest:true}),t=>{bar.doorOpen=1-t;hands.L={to:bar.doorPull().toArray()};}],
   ]);
   else plan([[REACH,()=>R({place:B.shelf.inUse})],[.05,null,()=>{delete held.R;bar.bottle.home();bottleOut=false;source=null;}],[.35,()=>R({rest:true})]]);
  }
  else if(name==='pick'){const item=glass;plan([[REACH,()=>R({reach:item})],[.05,null,()=>hold('R',item)],[.35,()=>R(lifted())]]);}
  else if(name==='sink'){
   // A drink nobody is waiting for any more goes down the sink, its glass into the washer under the worktop.
   const item=held.R||glass;plan([[REACH,()=>R({place:B.sink.at})],[.6,null,()=>{delete held.R;item?.removeFromParent();if(item===glass)glass=null;if(item===set)set=null;}],[.3,()=>R({rest:true})]]);
  }
  else plan([]);
 }
 /**
  * Stepped in at a worktop or the back bar, the furniture is at her chest: what she has just taken is lifted straight
  * up 5 cm, held so as she steps back, and comes in to her carrying hold only once she is out.
  */
 const lifted=()=>{const o=held.R;if(!o)return null;const p=o.localToWorld(new THREE.Vector3(...(o.userData.gripAt||[0,0,0])));return {place:[p.x,p.y+.05,p.z]};};
 const jugHome=()=>{const [x,z]=B.store.stock.oolong[0];return [x,B.store.shelfY,z];};
 function next(){
  // Someone who ordered has gone: what is in her hand goes back, the drink down the sink.
  if(cancelled()&&!steps.includes('sink')){const left=steps.slice(step+1).filter(s=>s==='return');steps.splice(step+1,Infinity,...left,...(glass||set?['sink']:[]));}
  step++;const name=steps[step];
  if(!name||name==='serve'){if(inside)phase='leaving';else done=true;return;}
  if(name==='store'){const home=bar.peek(kind);storeFor=atStore(home?home[0]:B.store.stand[0]);}
  const s=station(name);
  // Already standing in at this place (the glass set down where she pours): straight to work. Otherwise a step back
  // out to her walking line, the walk, and a step in.
  if(inside&&Math.hypot(g.position.x-s.close[0],g.position.z-s.close[1])<.01){inside=s;phase='turning';}
  else{path=[[s.stand[0],s.stand[1]]];phase=inside?'out':'walking';}
  u.activity=name==='shelf'?'taking down the '+B.shelf.name:name==='store'?'fetching from the cold store':name==='tap'?'pulling an Orion draught':name==='pour'||name==='pour-own'?'pouring':name==='return'?'putting the bottle back':name==='sink'?'pouring a drink away':'getting a glass';
 }
 next();
 return {
  get done(){return done;},get step(){return steps[step]||null;},get phase(){return phase;},
  /** Stepped in to work at a place (or stepping in or out), nearer the furniture than her walking line. */
  get close(){return !!inside||phase==='in';},
  /** The drink she is holding when the round is done: the one she sets down for whoever ordered it. */
  get drink(){return set||glass;},
  update(dt){
   if(done)return true;
   if(phase==='leaving'){if(held.R&&!hands.R?.keep&&!hands.R?.carry)hands.R={keep:true};if(stepTo(inside.stand,dt)){inside=null;done=true;if(held.R)hands.R={carry:true};}return done;}
   if(phase==='out'){if(held.R&&!hands.R?.keep&&!hands.R?.carry)hands.R={keep:true};if(stepTo(inside.stand,dt)){inside=null;phase='walking';if(held.R)hands.R={carry:true};}return false;}
   // She turns to the place on her walking line and steps straight in: turning close to a worktop at her chest would
   // swing her shoulder over its edge.
   if(phase==='walking'){if(walk(g,path,dt)){phase='turning';}return false;}
   if(phase==='turning'){const s=station(steps[step]);if(held.R&&inside!==s)hands.R={carry:true,high:s.over+.08};if(turnTo(s.yaw,dt)){if(inside===s){phase='working';work(steps[step]);}else phase='in';}return false;}
   if(phase==='in'){const s=station(steps[step]);if(stepTo(s.close,dt)){inside=s;phase='working';work(steps[step]);}return false;}
   const move=moves[0];
   if(!move){next();return done;}
   const [seconds,start,end,during]=move;
   if(timer===0)start?.();
   timer+=dt;during?.(Math.min(1,timer/seconds));
   if(timer>=seconds){end?.();moves.shift();timer=0;}
   return false;
  },
  /** The drink in her hand for the walk to the customer, and the hand back to carrying it. */
  carry(){const d=set||glass;if(d&&held.R!==d)hold('R',d);hands.R={carry:true};return d;},
  /** Set it down at `at` and let go of it: from then on it is the customer's. */
  placeAt(at){hands.R={place:at};},
  letGo(at){const d=held.R;if(d){release('R',d,at);}hands.R={rest:true};return d;},
  /** Leaving the room: put back what she holds, at once (nobody is there to see). */
  dispose(){stopStream();stream?.removeFromParent();if(bottleOut)bar.bottle.home();if(jug)bar.shelve(jug);for(const side of ['R','L']){const o=held[side];if(o&&o!==bar.bottle.piece&&o!==jug)o.removeFromParent();}bar.doorOpen=0;bar.lever=0;delete u.workHands;delete u.workHeld;delete u.workAvoid;},
  finish(){delete u.workHands;delete u.workHeld;delete u.workAvoid;stopStream();stream?.removeFromParent();},
 };
}
/** The big bottle in a bottle-and-glass set, as its own piece to lift (the set's bottle, label and cap). */
function splitBottle(set){
 const pieces=set.children.filter(o=>/Brown beer bottle|bottle metal details|Printed serving product label/.test(o.name));
 const bottle=new THREE.Group();bottle.name='Orion large bottle';bottle.position.set(-.06,0,0);set.add(bottle);
 for(const p of pieces){bottle.attach(p);}
 set.updateMatrixWorld(true);
 bottle.userData={grip:{radius:.038,height:.12},spout:[0,.278,0],local:[-.06,0,0],home:bottle.getWorldPosition(new THREE.Vector3()).toArray()};
 return bottle;
}
