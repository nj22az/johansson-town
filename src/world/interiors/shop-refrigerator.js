import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {FRIDGE_LEVELS} from './sakura-layout.js';
// Four sliding glazed doors, fitted to the supplied refrigerator's footprint.
export function createShopRefrigerator(room,reg){
 const group=new THREE.Group();group.name='Sakura refrigerated drinks and dairy';room.add(group);
 const parts=[],frame=new THREE.MeshStandardMaterial({color:0x798d89,metalness:.45,roughness:.36}),white=new THREE.MeshStandardMaterial({color:0xe4eee6,roughness:.65}),dark=new THREE.MeshStandardMaterial({color:0x263b36,roughness:.68}),light=new THREE.MeshBasicMaterial({color:0xf1fff1,toneMapped:false});
 const box=(w,h,d,x,y,z,material=white,parent=group)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);if(parent===group){parts.push({g,material});return;}const m=new THREE.Mesh(g,material);parent.add(m);};
 // The back panel, then the plinth, the head and the two sides in front of it, the sides between plinth and head: each
 // piece starts where the last ends, so no two faces lie in one plane (the Sakura surface audit, SK-ZF rev A).
 box(5.39,2.26,.065,.395,1.13,-3.895);box(5.39,.23,.6925,.395,.115,-3.51625,dark);box(5.39,.20,.6925,.395,2.19,-3.51625,frame);
 box(.05,1.86,.6925,-2.275,1.16,-3.51625);box(.05,1.86,.6925,3.065,1.16,-3.51625);
 for(let i=1;i<4;i++)box(.035,1.91,.66,-2.27+i*1.33,1.17,-3.57,frame);
 for(let column=0;column<4;column++){
  const x=-1.60+column*1.33;
  for(const y of FRIDGE_LEVELS)box(1.265,.018,.60,x,y-.009,-3.535);
  box(.014,1.82,.022,x-.61,1.19,-3.25,light);box(1.13,.014,.025,x,2.075,-3.40,light);
  for(let line=0;line<4;line++)box(1.10,.009,.006,x,.053+line*.032,-3.161,frame);
 }
 // One batch for each material keeps the cold cabinet inexpensive on mobile.
 for(const material of [white,frame,dark,light]){const gs=parts.filter(p=>p.material===material).map(p=>p.g);if(!gs.length)continue;const mesh=new THREE.Mesh(mergeGeometries(gs),material);gs.forEach(g=>g.dispose());group.add(mesh);}
 const c=document.createElement('canvas');c.width=1024;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#36594f';ctx.fillRect(0,0,1024,96);ctx.fillStyle='#fbf1d6';ctx.font='bold 36px sans-serif';ctx.textAlign='center';ctx.fillText("Cold drinks   ·   DRINKS & DAIRY",512,62);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(4.65,.16),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));sign.position.set(.395,2.19,-3.157);group.add(sign);
 const glass=new THREE.MeshStandardMaterial({color:0xb4d9d4,transparent:true,opacity:.075,roughness:.15,metalness:.05,depthWrite:false,side:THREE.DoubleSide});
 const doors=[];
 for(let i=0;i<4;i++){
  const door=new THREE.Group(),x=-2.255+i*1.33;door.position.set(x,0,-3.145-i%2*.022);door.name='Sliding refrigerator door '+(i+1);group.add(door);
  box(.024,1.86,.03,.012,1.18,0,frame,door);box(.024,1.86,.03,1.292,1.18,0,frame,door);box(1.304,.024,.03,.652,.262,0,frame,door);box(1.304,.024,.03,.652,2.098,0,frame,door);
  box(.028,.35,.035,i%2?.10:1.20,1.12,.035,dark,door);
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(1.254,1.812),glass);pane.position.set(.652,1.18,.004);pane.renderOrder=3;door.add(pane);
  const entry={door,x,amount:0,timer:0,direction:i%2?-1:1};doors.push(entry);
  const target=new THREE.Object3D();target.position.set(x+.652,1.65,-3.10);group.add(target);reg(target,'Open refrigerated drinks and dairy',()=>{entry.timer=6;},true);
 }
 return {group,doors,open(column){if(doors[column])doors[column].timer=3;},
  /** Hold a door at an amount (0 shut, 1 open): a film's photographs of somebody restocking. */
  hold(column,amount){const d=doors[column];if(!d)return false;d.amount=Math.max(0,Math.min(1,amount));d.timer=d.amount>0?1e9:0;d.door.position.x=d.x+d.direction*d.amount*1.10;return true;},update(dt){for(const d of doors){d.timer=Math.max(0,d.timer-dt);d.amount=THREE.MathUtils.damp(d.amount,d.timer>0?1:0,5,dt);d.door.position.x=d.x+d.direction*d.amount*1.10;}}};
}
