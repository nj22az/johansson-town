import * as THREE from '../../../vendor/three.module.js';
import {HOME_WALLS,HOME_TEXTILES,restoreHomeDecor,setHomeDecor,unlockedHomeKeepsakes} from '../../progression/home-decor.js';

// The living room's west wall in Johansson's house on Kitano-jima (interiors/johansson-house-interior.js), south of the
// photograph: the display faces east into the room, and its control stays on the open floor in front of it.
export const HOME_CUSTOMIZATION_PLACEMENT=Object.freeze({
 shelf:Object.freeze([-5.67,1.3,3.8]),yaw:-Math.PI/2,
 anchor:Object.freeze([-5.19,1.3,3.8]),
});

/**
 * Dresses the mayor's home in the chosen wall colour, cushions and quilt, and keepsake. With a `menu` (and `reg`) it
 * also offers 'Decorate your home' in the room; World passes none, because decorating is done in Johansson Studio
 * (src/studio-handoff.js). snapshot() re-reads state.homeDecor and redresses the room.
 */
export function createHomeCustomization({room,state,menu=null,save=()=>{},close=()=>{},reg=null,arrange=null}){
 const group=room.getObjectByName('Mayor’s home'),walls=[],textiles=[];
 if(!group)return null;
 group.traverse(o=>{
  if(!o.isMesh)return;
  const targets=o.name==='Upper wall'?walls:['Zabuton','Quilt'].includes(o.name)?textiles:null;
  if(targets){o.material=o.material.clone();targets.push(o);}
 });
 // On the ground floor's own group where the house has storeys, so it is put away with that floor.
 const shelf=new THREE.Group();shelf.name='Earned keepsake shelf';shelf.position.set(...HOME_CUSTOMIZATION_PLACEMENT.shelf);shelf.rotation.y=HOME_CUSTOMIZATION_PLACEMENT.yaw;(group.getObjectByName('House G0')||group).add(shelf);
 const part=(size,pos,colour,name)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color:colour,roughness:.9}));m.position.set(...pos);m.name=name;shelf.add(m);return m;};
 part([.8,.05,.24],[0,0,0],0x8a6a4a,'Keepsake shelf board');
 const objects={};
 const add=(id,fn)=>{const start=shelf.children.length;fn();objects[id]=shelf.children.slice(start);};
 add('postcard',()=>{part([.29,.22,.025],[0,.14,0],0xf4ead1,'Swedish harbour postcard');part([.2,.055,.012],[0,.12,-.025],0x7299ab,'Postcard sea');part([.07,.07,.012],[-.055,.17,-.055],0xb86d61,'Postcard boathouse');});
 add('shell',()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.1,12,6),new THREE.MeshStandardMaterial({color:0xe5c9b1,roughness:.9}));m.scale.set(1,.55,.8);m.position.set(0,.083,0);m.name='Fishing-pier shell';shelf.add(m);});
 add('cat',()=>{part([.12,.13,.09],[0,.092,0],0xd49b64,'Tama clay cat');part([.13,.095,.095],[0,.2,0],0xd49b64,'Cat head');for(const x of [-.044,.044])part([.033,.045,.04],[x,.263,0],0xd49b64,'Cat ear');for(const x of [-.03,.03])part([.014,.017,.01],[x,.209,-.052],0x473c34,'Cat eye');});
 add('radio',()=>{part([.25,.15,.09],[0,.105,0],0x638574,'Workshop miniature radio');part([.11,.095,.01],[-.043,.11,-.05],0x334942,'Radio speaker');part([.025,.025,.014],[.076,.11,-.052],0xc7b992,'Radio dial');});
 function apply(){
  const decor=restoreHomeDecor(state.homeDecor),available=unlockedHomeKeepsakes(state);
  walls.forEach(m=>m.material.color.setHex(HOME_WALLS.find(c=>c.id===decor.wall).colour));
  textiles.forEach(m=>m.material.color.setHex(HOME_TEXTILES.find(c=>c.id===decor.textile).colour));
  const chosen=available.some(c=>c.id===decor.keepsake)?decor.keepsake:'postcard';
  for(const [id,meshes] of Object.entries(objects))meshes.forEach(m=>m.visible=id===chosen);
  return {...decor,keepsake:chosen,unlocked:available.map(c=>c.id)};
 }
 const choose=(key,items,title)=>menu(title,'Choose what feels like home.',[
  ...items.map(item=>[item.name,()=>{if(setHomeDecor(state,key,item.id)){apply();save();}choose(key,items,title);},state.homeDecor?.[key]===item.id]),['Back',open],
 ]);
 function open(){menu('Make yourself at home','Choose wall colours, textiles and a keepsake earned around the island. Your choices stay with this player.',[
  ...(arrange?[['Arrange furniture',()=>{close();arrange();}]]:[]),
  ['Wall colour',()=>choose('wall',HOME_WALLS,'Wall colour')],
  ['Cushions and quilt',()=>choose('textile',HOME_TEXTILES,'Cushions and quilt')],
  ['Keepsake shelf',()=>choose('keepsake',unlockedHomeKeepsakes(state),'Keepsake shelf')],
  ['Done',close],
 ]);}
 if(menu&&reg){const anchor=new THREE.Object3D();anchor.position.set(...HOME_CUSTOMIZATION_PLACEMENT.anchor);anchor.userData.npcInteraction=false;group.add(anchor);reg(anchor,'Decorate your home',open,true);}
 apply();return {snapshot:apply,open};
}
