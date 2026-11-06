import * as THREE from '../../vendor/three.module.js';
import {consumptionPhase} from '../avatars/consume.js';
// (the player's own sip, seen from the eyes: the can or glass turned up toward them as far as before, 1.1 rad full to 1.5
// for the last of it; a resident's sip (consume.js drinkTilt) tips a full glass far less, with the head going back)
const firstPersonTilt=(prop,k)=>(1.1+.4*(1-Math.min(1,Math.max(0,prop?.userData?.portion??1))))*k;
import {createDrinkProp,setPropPortion,updatePropPortion,disposeServing} from '../people/izakaya-beer.js';

export function createHands({scene,camera,say,consume,onDrink=()=>{},canColour=null}){
 // The can is held in front of the first-person camera; `view` hides it when the camera is behind him.
 const view=new THREE.Group(),hold=new THREE.Group();camera.add(view);view.add(hold);scene.add(camera);hold.position.set(.24,-.29,-.48);hold.rotation.set(.1,-.2,-.15);
 const can=new THREE.Mesh(new THREE.CylinderGeometry(.047,.047,.145,20),new THREE.MeshStandardMaterial({color:0x91734e,roughness:.42,metalness:.45}));hold.add(can);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(.043,.003,6,20),new THREE.MeshStandardMaterial({color:0xb8bab1,roughness:.22,metalness:.7}));rim.rotation.x=Math.PI/2;rim.position.y=.075;hold.add(rim);hold.visible=false;
 const dropped=hold.clone(true);scene.add(dropped);dropped.visible=false;let name=null,drop=0,drink=0,autoDrink=false;
 function offer(item,position,drinkAfter=false){name=item;if(canColour){const c=canColour(item);can.material.color.setHex(c);for(const o of dropped.children)if(o.geometry?.type==='CylinderGeometry')o.material.color?.setHex(c);}autoDrink=drinkAfter;hold.position.set(.24,-.29,-.48);hold.rotation.set(.1,-.2,-.15);drop=.6;drink=0;hold.visible=false;dropped.visible=true;dropped.position.copy(position||camera.position);dropped.position.y=(position?.y||0)+.45;say(item+' · R to drink',3);}
 // A sip from a drink on the table, on the same clock and tilt as every avatar's (consume.js): it comes up to the mouth and goes back down.
 let sipProp=null,sipT=0;const SIP=2.4;
 function sip(kind,start=1,finish=Math.max(0,start-.2)){if(sipT>0)return false;disposeServing(sipProp);sipProp=createDrinkProp(kind,{held:true});setPropPortion(sipProp,start,{immediate:true});sipProp.userData.startPortion=start;sipProp.userData.finishPortion=finish;sipProp.position.set(.08,-.34,-.42);sipProp.rotation.set(.15,0,-.05);view.add(sipProp);sipT=SIP;onDrink();return true;}
 // A mouthful from a dish on the table: chopsticks and a morsel, up and back down.
 const MORSEL={yakitori:0x7c3f1b,edamame:0x7d9b45,oden:0xe3d3a6,hiyayakko:0xf1ece0,dashimaki:0xf0c94a,hokke:0xb07a45,sashimi:0xea8a5c,agedashi:0xd7a55a,karaage:0xb8742e,ochazuke:0xb7a35c,ramen:0xe8cf7a,gyoza:0xd9b27a,rice:0xf4f1ea};
 function bite(kind){
  if(sipT>0)return false;disposeServing(sipProp);
  const g=new THREE.Group(),stick=new THREE.MeshStandardMaterial({color:0xc9a26b,roughness:.6});
  for(const dx of [-.008,.008]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.003,.004,.22,6),stick);c.position.set(dx,.05,0);c.rotation.x=-.9;g.add(c);}
  const morsel=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),new THREE.MeshStandardMaterial({color:MORSEL[kind]??0xd9b27a,roughness:.5}));morsel.position.set(0,-.04,-.08);g.add(morsel);
  g.userData.bite=true;sipProp=g;g.position.set(.08,-.34,-.42);g.rotation.set(.15,0,-.05);view.add(g);sipT=SIP;return true;
 }
 function drinkCan(){if(!name||drink>0||drop>0)return false;if(!consume(name)){hold.visible=false;name=null;return false;}drink=.85;onDrink();return true;}
 return {offer,drink:drinkCan,set firstPersonVisible(value){view.visible=!!value;},sip,bite,get held(){return name;},get canDrink(){return !!name&&drop<=0&&drink<=0;},update(dt){if(sipT>0&&sipProp){sipT=Math.max(0,sipT-dt);const bite=!!sipProp.userData.bite,{lift:k,swallow}=consumptionPhase(SIP-sipT,SIP);sipProp.position.set(.08-.06*k,-.34+.2*k,-.42+.08*k);sipProp.rotation.set(.15+(bite?.25*k:firstPersonTilt(sipProp,k)),0,-.05);if(!bite){setPropPortion(sipProp,THREE.MathUtils.lerp(sipProp.userData.startPortion,sipProp.userData.finishPortion,swallow));updatePropPortion(sipProp,dt);}else if(sipT<.5){sipProp.children.at(-1).scale.setScalar(Math.max(0,sipT/.5));}if(sipT===0){disposeServing(sipProp);sipProp=null;}}if(drop>0){drop-=dt;dropped.position.y=dropped.position.y-dt*.5;if(drop<=0){dropped.visible=false;hold.visible=true;if(autoDrink){autoDrink=false;drinkCan();}}}if(drink>0){drink=Math.max(0,drink-dt);hold.position.y=-.29+Math.sin((.85-drink)/.85*Math.PI)*.22;hold.rotation.z=-.15+Math.sin((.85-drink)/.85*Math.PI)*.8;if(drink===0){hold.visible=false;say('The empty can goes back in your bag.',3);name=null;}}}};
}
