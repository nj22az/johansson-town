import * as THREE from '../../vendor/three.module.js';
import {nakamuraFrontage} from './okinawa/nakamura-dressing.js';
import {NAKAMURA_HOME_DOOR} from './nakamura-plan.js';
import {NAKAMURA_DESSERTS} from './harbour-park-plan.js';
export const BLUE_CORAL=NAKAMURA_DESSERTS;
/** The retained menu and painted price tags; unavailable while the counter has no keeper. */
export const NAKAMURA_MENU=Object.freeze([
 {title:'Zenzai',cost:250,item:'Zenzai',text:'Shaved ice over slow-cooked kintoki beans and white mochi.'},
 {title:'Sata andagi',cost:120,item:'Sata andagi',text:'Three freshly fried Okinawan doughnuts in a paper bag.'},
 {title:'Blue Coral island ice cream',cost:150,item:'Blue Coral ice cream',text:'A freshly scooped cone of beni-imo and island vanilla.'},
 {title:'Island tea',cost:120,item:'Green tea',text:'A chilled bottle of island tea.'},
 {title:'Cold island soda',cost:100,item:'Cold island soda',text:'A cold bottle from Nakamura’s ice case.'}
].map(Object.freeze));
export const dessertShopOpen=minutes=>{const m=((minutes%1440)+1440)%1440;return BLUE_CORAL.staffed&&m>=BLUE_CORAL.open&&m<BLUE_CORAL.close;};
/** Retain the closed dessert shop for future facility work, without a replacement resident. */
export function buildBlueCoralShop({world,group=world.group,register,onAction,shadows=false}){
 const root=new THREE.Group();root.name='Blue Coral at Nakamura';group.add(root);
 // The menu tags on the counter's back wall, the cider tin and the family's nameplate (one lettering sheet), and what
 // follows the hours: the noren, the lanterns' glow, the bench's parasol, the ice flag and the shutter (nakamura-dressing.js
 // NAKAMURA_OPEN_SIGNS).
 const frontage=nakamuraFrontage({menu:NAKAMURA_MENU,hours:BLUE_CORAL,shadows});root.add(frontage.group,frontage.world);
 (world.colliders??=[]).push(frontage.canopy,frontage.shutterSolid);
 let minutes=720;frontage.update(minutes,dessertShopOpen(minutes));
 const anchor=(x,z,label,fn,place='nakamura')=>{const a=new THREE.Object3D();a.position.set(x,1.1,z);a.userData.placeId=place;root.add(a);register?.(a,label,fn);};
 anchor(5.1,-12.4,'Read the dessert counter notice',()=>onAction?.('read','Nakamura is closed',BLUE_CORAL.closedNotice));
 const [hx,,hz]=NAKAMURA_HOME_DOOR;
 anchor(hx-.25,hz,'Read the upstairs vacancy notice',()=>onAction?.('read','Vacant flat · upstairs','The flat is empty. Its separate stairwell and rooms are retained for future use.'));
 const [x,z]=BLUE_CORAL.approach,landmark={id:'nakamura',title:BLUE_CORAL.name,owner:BLUE_CORAL.owner,aliases:['blue-coral','zenzai'],sub:'MAIN STREET · CLOSED DESSERT COUNTER',x,z,exitPosition:[x,0,z],entryFacing:Math.PI/2,line:BLUE_CORAL.closedNotice};
 if(!(world.landmarks??=[]).some(s=>s.id===landmark.id))world.landmarks.push(landmark);
 return {root,landmark,merged:true,update(value){if(Number.isFinite(value))minutes=value;frontage.update(minutes,dessertShopOpen(minutes));},frontage,isOpen(){return dessertShopOpen(minutes);}};
}
