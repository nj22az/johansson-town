import * as THREE from '../../vendor/three.module.js';
import {createKit} from './okinawa/kit.js';
import {stairFlight,stairLanding} from './okinawa/stairs.js';
import {poster,fascia} from './okinawa/signs.js';
/** A small late-Shōwa island broadcaster replaces the oversized mountain. */
export function buildAobaRadio(world,{register,onAction,shadows=false}={}){
 const group=new THREE.Group();group.name='Aoba radio station and public roof lookout';world.group.add(group);
 const kit=createKit({shadows}),solid=c=>world.colliders.push(c),Y=-.4,H=3.5;
 kit.at(0,0,0,()=>{
  kit.block(28.5,42,-.02,.06,157,172,0xb8b5a6);
  kit.block(30,38.5,0,H,160,168,0xdcd7c6);
  solid(kit.rect(30,38.5,160,168,H,'radio-station'));
  kit.block(29.9,38.6,H-.1,H,159.9,168.1,0x9caba3);
  for(const x of [31.5,36.5]){kit.box(1.6,1.15,.06,x,1.8,159.97,0x3c6168,{finish:'window'});kit.box(1.75,.06,.25,x,1.18,159.9,0x949e98);}
  kit.box(1.0,2,.08,34,1,159.95,0x53767a);
  kit.sign(fascia({jp:'青葉放送局',en:'AOBA RADIO · 76.4 FM',bg:'#ece9da',accent:'#355f64',ink:'#355f64'}),6.4,.65,34.3,2.95,159.88,{ry:Math.PI,name:'Aoba radio bilingual fascia'});
  kit.box(.85,.45,.35,30.2,1.45,168.2,0xa5b0ad);
  kit.box(.12,1.8,.12,38.3,.9,160.3,0x768783);
  // A roof deck reached from the forecourt by a full-length measured flight.
  stairFlight(kit,solid,{id:'radio-stair',x:39.3,z:160,length:6.16,height:H});
  stairLanding(kit,{id:'radio-landing',x0:38.3,x1:40.0,z0:166.16,z1:167.66,y:H},solid);
  kit.level(30.15,38.35,160.15,167.85,H,'radio-lookout');
  const guard=(x0,x1,z0,z1)=>{kit.block(x0,x1,H,H+.08,z0,z1,0x738783);kit.block(x0,x1,H+.98,H+1.03,z0,z1,0x738783);solid({...kit.rect(x0,x1,z0,z1,1.03,'radio-lookout-rail'),minY:Y+H});};
  guard(30,38.5,160,160.06);guard(30,38.5,167.94,168);guard(30,30.06,160,168);guard(38.44,38.5,160,166.16);guard(38.44,38.5,167.66,168);guard(39.95,40,166.16,167.66);guard(38.3,40,167.61,167.66);
  for(let x=30.1;x<38.5;x+=.8)for(const z of [160.03,167.97])kit.box(.035,1,.035,x,H+.5,z,0x738783);
  for(let z=160.1;z<168;z+=.8)kit.box(.035,1,.035,30.03,H+.5,z,0x738783);
  // Braced mast, insulators and aerials; the service feeder is separate from the antenna.
  for(const x of [31,32.1])for(const z of [161.7,162.8])kit.rod([x,H,z],[31.55,H+13.5,162.25],.055,0x80918b);
  for(let y=H+.7;y<H+13;y+=1.4){const t=(y-H)/13.5,w=1.1*(1-t);kit.rod([31.55-w/2,y,162.25-w/2],[31.55+w/2,y+1.4,162.25+w/2],.025,0x738681);kit.rod([31.55+w/2,y,162.25-w/2],[31.55-w/2,y+1.4,162.25+w/2],.025,0x738681);}
  kit.rod([31.55,H+13.5,162.25],[31.55,H+16,162.25],.025,0x87978f);
  for(const y of [H+12,H+14.2])kit.rod([30.6,y,162.25],[32.5,y,162.25],.022,0x87978f);
  kit.box(.16,.18,.16,31.55,H+16.1,162.25,0xe18973,{finish:'lamp'});
  solid({...kit.rect(30.75,32.35,161.45,163.05,16.3,'radio-mast'),minY:Y+H});
  kit.box(2,.08,.55,34.8,H+.45,166.8,0x897557);kit.box(2,.4,.06,34.8,H+.7,167.04,0x897557);
  for(const x of [34,35.6])kit.box(.08,.45,.35,x,H+.22,166.8,0x677a73);
  solid({...kit.rect(33.8,35.8,166.5,167.08,.95,'radio-lookout-bench'),minY:Y+H});
  kit.sign(poster({title:'青葉展望台',lines:['AOBA ROOF LOOKOUT','階段をご利用ください','Please use the stairs'],band:'#426960',bg:'#eeead8'}),.85,1.0,40.5,1.3,159.6,{name:'Radio lookout stair sign'});
 },Y);kit.finish(group,'Aoba broadcaster');
 const anchor=(position,label,fn)=>{const o=new THREE.Object3D();o.position.set(...position);group.add(o);register?.(o,label,fn);return o;};
 anchor([34,.9,158.8],'Read the island radio bulletin',()=>onAction?.('read','Aoba Radio, 76.4 FM','Since 1986, Aoba Radio has broadcast the ferry notices, weather, school announcements and the evening request show. The technician checks the transmitter after breakfast. The old oversized hill has given way to a small public station yard. Take the outside stairs to the roof lookout; please keep the aerial enclosure clear.'));
 anchor([36.2,Y+H+1,164.8],'Look out from Aoba Radio',()=>onAction?.('read','Aoba lookout','The homes of Kitahama lie along the southern lane. Beyond them are the town hall, the harbour roofs and the boat channel. On clear evenings the lights of Kitano-jima show across the water.'));
 const seat=anchor([34.8,Y+H+1,166.8],'Sit at the radio lookout',()=>onAction?.('seat','Aoba roof lookout','The ferry forecast drifts out of the studio downstairs.'));
 seat.userData.seat={position:[34.8,Y+H,166.8],stand:[34.8,Y+H,165.8],surfaceY:Y+H+.49,eyeY:Y+H+1.12,yaw:0,pitch:0};
 return {group};
}
