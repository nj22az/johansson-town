/** CAD Rev C / H1. Metres: X forward from transom, Y port, Z above keel.
 * Default game arrangement, published on the owner's instruction, 31 October 2026.
 * Structural/berthing acceptance remains a separate real-vessel engineering hold.
 */
export const FERRY_H1_ENABLED=true;
export const FERRY_H1=Object.freeze({revision:'C-H1',floor:.9,tankTop:.7,clearHeight:2.4,
 serviceBottom:3.3,deckhead:3.6,carDeck:4,upperRise:1,structureDepth:.4,
 ladder:Object.freeze({head:6.4,foot:8.6,width:.8,bounds:[3.11,3.99],entrance:[5.25,6.4],door:[5.3,6.4],risers:14,hatch:[6.4,9]}),
 serviceOpening:Object.freeze({from:10.38,to:11.22,clear:.8}),
 portLobbyBenches:Object.freeze([[3.2,5],[6.7,11]].map(p=>Object.freeze(p))),
 gangwayLength:4,
 shore:Object.freeze({landingX:.3,queueX:.3,arrivalX:.6}),
 boothDoorHeight:2.1,
 luminaires:Object.freeze([[9.5,0],[12.5,0],[9.6,-3.1],[15.5,0],[18,0],[21,1.7],[21.3,-2.2],[24.4,-1],[24.4,1.6]].map(p=>Object.freeze(p))),
 status:'development geometry study; structure, stability, berth and emergency escape acceptance open'});
export const FERRY_H1_SHOTS=Object.freeze([
 {id:'engines-aft',label:'Main engines',floor:'engine-room',pos:[9.2,3.45,3.1],at:[11.2,0,1.6],fov:65},
 {id:'engines-fore',label:'Engine service side',floor:'engine-room',pos:[13.6,3.5,3.1],at:[12.8,0,1.6],fov:65},
 {id:'control',label:'Engine control booth',floor:'control-booth',pos:[10.55,-2.7,2.75],at:[8.8,-3.25,1.8],fov:75},
 {id:'aux',label:'Generators and auxiliaries',floor:'aux-room',pos:[18.5,-2.8,3.1],at:[15.5,.2,1.55],fov:68},
 {id:'workshop',label:'Mechanical workshop',floor:'workshop',pos:[19.35,.3,3.1],at:[21.3,.25,1.6],fov:75},
 {id:'store',label:'Engine store',floor:'workshop',pos:[20,-.85,3.1],at:[21.8,-2,1.5],fov:70},
 {id:'electrical',label:'Electrical workshop',floor:'electrical-workshop',pos:[22.85,-2.7,3.1],at:[25.3,.8,1.55],fov:68},
 {id:'workshop-entry',label:'Workshop entrance',floor:'workshop',pos:[22.1,3.2,3.1],at:[19.7,0,1.6],fov:74},
].map(s=>Object.freeze({...s,pos:Object.freeze(s.pos),at:Object.freeze(s.at)})));
export const h1ToLocal=([X,Y,Z])=>[Y,Z-1.9,X-17.25];
export function ferryShotAt(floor,local,previous=null){
 if(floor==='engine-room'){
  const X=local[2]+17.25;
  if(previous==='engines-aft'&&X<12.6)return FERRY_H1_SHOTS[0];
  if(previous==='engines-fore'&&X>11.7)return FERRY_H1_SHOTS[1];
  return FERRY_H1_SHOTS[X>12.15?1:0];
 }
 if(floor==='workshop'){
  if(local[0]<-.65)return FERRY_H1_SHOTS[5];
  const X=local[2]+17.25;
  if(previous==='workshop-entry'&&X<20.6||previous==='workshop'&&X>20.2)return FERRY_H1_SHOTS[previous==='workshop-entry'?7:4];
  return FERRY_H1_SHOTS[X<20.4?7:4];
 }
 return FERRY_H1_SHOTS.find(s=>s.floor===floor)||null;
}
