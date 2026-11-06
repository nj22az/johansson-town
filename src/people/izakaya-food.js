import * as THREE from '../../vendor/three.module.js';
import {MINATO_COMPACT as P} from '../world/interiors/minato-compact-plan.js';
import {MINATO_BAR} from '../world/interiors/minato-bar.js';
import {createDishProp,createBiteProp,setPropPortion,disposeServing} from './izakaya-beer.js';

// All food is plated on the clear steel between the oden bath and the cutting board.
// No extra counter: the dish's foot is 2 mm above the existing worktop, clear of the
// otoshi, knife and drinks rack. The same vessel is picked up and delivered.
const lip=P.worktop.position[2]-P.worktop.depth/2;
export const foodSolids=()=>[...MINATO_BAR.solids,[[-2.85,P.worktop.top,-1.66],[-2.55,P.worktop.top+.20,-1.44]],...[P.counter,P.booth].map(p=>[[p.position[0]-(p.width??p.tableWidth)/2,0,p.position[2]-(p.depth??p.tableDepth)/2],[p.position[0]+(p.width??p.tableWidth)/2,p.top??p.tableTop,p.position[2]+(p.depth??p.tableDepth)/2]])];
const place=(x,rear=false)=>({stand:[x,rear?-2.70:lip-.36],close:[x,rear?-2.96:lip-.17],yaw:rear?0:Math.PI});
export const MINATO_FOOD=Object.freeze({
 pass:{...place(-2.30),stand:[-2.30,P.staff.aisleZ],dish:[-2.30,P.worktop.top+.002,-1.69],purpose:'Thao plates supper on the clear steel beside the cutting board.'},
 grill:{...place(P.kitchenStations.grill[0]),source:[-.10,P.worktop.top+.24,-1.72],purpose:'Skewers and hokke from the charcoal grill.'},
 oden:{...place(P.kitchenStations.oden[0]),source:[-3.35,P.worktop.top+.18,-1.72],purpose:'Simmered oden lifted from its divided bath.'},
 prep:{...place(-1.43),source:[-1.43,P.worktop.top+.06,-1.69],purpose:'Cold dishes dressed on the board, clear of the otoshi and knife.'},
 range:{...place(P.sink.rangeX,true),source:[P.sink.rangeX,P.sink.top+.23,-3.18],purpose:'Rolled egg, ochazuke and residents’ rice warmed at the range.'},
 fryer:{...place(P.sink.fryerX,true),source:[P.sink.fryerX,P.sink.top+.26,-3.18],purpose:'Karaage and agedashi drained from the existing fryer basket.'},
});
// Rice is an existing resident order, not a new priced menu item.
export const RESIDENT_RICE=Object.freeze({id:'rice',en:'a bowl of rice',station:'range',cook:3,bites:3,line:'Rice. Still warm.'});

/** One preparation, collection and carry; the service queue still owns Thao. */
export function createFoodRound({kind,spec,room,staff:g,walk,cancelled=()=>false}){
 const u=g.userData,hands=u.workHands={R:{rest:true},L:{rest:true}},held=u.workHeld={};u.workAvoid=foodSolids();
 const source=MINATO_FOOD[spec.station],pass=MINATO_FOOD.pass;
 let phase='walking',step='utensil',inside=null,path=[pass.stand.slice()],timer=0,prop=null,released=false;
 const tool=createKitchenUtensil(spec.station);tool.position.set(-2.08,P.worktop.top+.138,-1.69);room.add(tool);
 const toolHome=tool.position.clone();
 const sample=createBiteProp(kind),food=sample.userData.level;food.removeFromParent();food.position.set(0,-.16,-.1);food.visible=false;tool.add(food);disposeServing(sample);
 const turn=(yaw,dt)=>{const d=Math.atan2(Math.sin(yaw-g.rotation.y),Math.cos(yaw-g.rotation.y));g.rotation.y+=THREE.MathUtils.clamp(d,-dt*5,dt*5);return Math.abs(d)<.02;};
 const near=([x,z],dt)=>{const dx=x-g.position.x,dz=z-g.position.z,d=Math.hypot(dx,dz);if(d<.005)return true;const k=Math.min(1,dt*.5/d);g.position.x+=dx*k;g.position.z+=dz*k;return false;};
 const hold=object=>{g.updateMatrixWorld(true);g.attach(object);held.R=object;};
 const clean=()=>{delete u.workHands;delete u.workHeld;delete u.workAvoid;};
 function target(){return step==='station'?source:pass;}
 function next(){timer=0;if(step==='utensil'){step='station';path=[source.stand.slice()];phase='out';}else if(step==='station'){food.visible=true;step='plate';path=[pass.stand.slice()];phase='out';}else if(step==='plate'){step='put-tool';phase='working';}else if(step==='put-tool'){step='collect';phase='working';}else{step='serve';phase='out';}}
 return {
  get step(){return step;},get close(){return !!inside||phase==='in';},get drink(){return prop;},
  update(dt){
   if(cancelled()){
    if(prop&&!released)disposeServing(prop);prop=null;
    if(!tool.userData.discarded){disposeServing(tool);tool.userData.discarded=true;}
    delete held.R;hands.R={rest:true};hands.L={rest:true};
    // Back out to the walking line before returning; a .3 m walker cannot start
    // from the .13 m close-up position beside a worktop.
    if(phase==='in'&&!inside)inside=target();
    if(inside&&!near(inside.stand,dt))return false;
    inside=null;clean();return true;
   }
   if(phase==='done')return true;
   if(phase==='out'){
    if(held.R)hands.R={keep:true};
    if(near(inside.stand,dt)){inside=null;if(held.R)hands.R={carry:true,high:1.18};if(step==='serve'){phase='done';hands.R={carry:true,forward:.12};return true;}phase='walking';}return false;
   }
   if(phase==='walking'){if(walk(g,path,dt))phase='turning';return false;}
   if(phase==='turning'){if(turn(target().yaw,dt))phase='in';return false;}
   if(phase==='in'){if(near(target().close,dt)){inside=target();phase='working';timer=0;}return false;}
   timer+=dt;
   if(step==='utensil'){
    hands.R=held.R?{keep:true,up:.08}:{reach:tool};
    if(timer>=1.1&&!held.R)hold(tool);if(timer>=1.5)next();
   }else if(step==='station'){
    // A controlled working reach at the actual appliance/board, rather than a
    // generic arm swing through the worktop. Existing cooking durations stay intact.
    hands.R={place:[source.source[0]+Math.sin(timer*3)*.018,source.source[1]+.13,source.source[2]]};
    u.activity='preparing '+spec.en+' at the '+spec.station;
    if(timer>=spec.cook)next();
   }else if(step==='plate'){
    if(!prop){prop=createDishProp(kind);prop.position.set(...pass.dish);room.add(prop);setPropPortion(prop,0,{immediate:true});
     const box=new THREE.Box3().setFromObject(prop),size=box.getSize(new THREE.Vector3());prop.userData.workGrip={radius:size.x/2-.012,height:.012};}
    hands.R={place:[pass.dish[0],pass.dish[1]+.17,pass.dish[2]]};u.activity='plating '+spec.en;
    // Food is revealed only here, on a supported dish, while she plates it.
    setPropPortion(prop,Math.min(1,timer/1.4),{immediate:true});
    if(timer>=1.6){food.visible=false;next();}
   }else if(step==='put-tool'){
    hands.R={place:toolHome.toArray()};
    if(timer>=1.1){room.attach(tool);tool.position.copy(toolHome);tool.rotation.set(0,0,0);delete held.R;hands.R={rest:true};next();}
   }else if(step==='collect'){
    hands.R={reach:prop};u.activity='collecting '+spec.en;
    if(timer>=1.4){if(!held.R)hold(prop);hands.R={keep:true,up:.06};if(timer>=1.8)next();}
   }
   return false;
  },
  carry(){hands.R={carry:true,forward:.12};return prop;},
  placeAt(at){hands.R={place:at};},
  letGo(at){room.attach(prop);prop.position.set(...at);prop.rotation.set(0,0,0);delete held.R;hands.R={rest:true};released=true;return prop;},
  finish(){disposeServing(tool);clean();},
  dispose(){if(prop&&!released)disposeServing(prop);disposeServing(tool);clean();},
 };
}

/** Small kitchen tools, fitted to Thao's existing working-hand solver. Vertical
 * handles keep hot food below her mitten; the tool's tip meets the appliance. */
function createKitchenUtensil(station){
 const g=new THREE.Group(),metal=new THREE.MeshStandardMaterial({color:0xa9ada8,roughness:.45,metalness:.55});
 g.name=station==='grill'||station==='fryer'?'Kitchen tongs':'Kitchen serving spoon';
 const handle=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.13,8),metal);handle.position.y=-.035;g.add(handle);
 if(station==='grill'||station==='fryer')for(const x of [-.012,.012]){const tip=new THREE.Mesh(new THREE.BoxGeometry(.009,.06,.025),metal);tip.position.set(x,-.105,0);g.add(tip);}
 else{const spoon=new THREE.Mesh(new THREE.SphereGeometry(.022,12,8),metal);spoon.scale.set(1,.25,1.2);spoon.position.y=-.13;g.add(spoon);}
 g.userData.grip={radius:.006,height:.025};return g;
}
