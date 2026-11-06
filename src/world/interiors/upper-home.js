import * as THREE from '../../../vendor/three.module.js';
import {buildFamilyHome} from './family-home.js';
import {createHouseWalk} from '../house-walk.js';

/** A private stairwell, followed by the existing 2DK upstairs. No public shop furniture in the route. */
export function buildUpperHome(options){
 const {room,collider=()=>{}}=options,H=3.3,top=new THREE.Group();top.position.y=H;room.add(top);
 const layout=buildFamilyHome({...options,room:top,collider:(x,z,w,d,h)=>collider(x,z,w,d,h+H,H)});
 top.traverse(o=>{const seat=o.userData.seat;if(!seat)return;for(const k of ['position','stand'])if(seat[k])seat[k]=[seat[k][0],seat[k][1]+H,seat[k][2]];for(const k of ['surfaceY','eyeY'])if(Number.isFinite(seat[k]))seat[k]+=H;});
 const mat=new THREE.MeshStandardMaterial({color:0x8d8069,roughness:.9});
 const box=(w,h,d,x,y,z,name)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.name=name;room.add(o);};
 // A 5.4 m straight flight runs from the street foyer to the room's existing +z doorway.
 box(1.6,.12,1.5,0,-.06,9,'Private entrance landing');
 // The street door at the foyer's end, closed behind him (the stairwell had no end: the sky's colour showed through it),
 // in the trim's teal of the frame outside (okinawa/houses.js shopHouse).
 box(1.76,6.1,.08,0,3.05,9.79,'Private entrance wall');
 {const leaf=new THREE.Mesh(new THREE.BoxGeometry(.92,2.02,.05),new THREE.MeshStandardMaterial({color:0x416d72,roughness:.8}));leaf.position.set(0,1.01,9.73);leaf.name='Private entrance door';room.add(leaf);}
 box(1.76,.12,7.5,0,6.15,6,'Stairwell ceiling');
 for(let i=0;i<19;i++)box(1.6,.12,5.4/19,0,(i+1)*H/19-.06,8.4-(i+.5)*5.4/19,'Private stair tread');
 // Closed risers: with open ones the void under the flight showed the sky's colour between the treads.
 for(let i=0;i<19;i++)box(1.6,H/19,.03,0,(i+.5)*H/19,8.4-i*5.4/19-.015,'Private stair riser');
 box(1.6,.12,.6,0,H-.06,2.9,'Upper landing');
 for(const x of [-.84,.84]){
  box(.08,6.1,7.5,x,3.05,6,'Private stairwell wall');collider(x,6,.08,7.5,6.1);
  const rail=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,Math.hypot(5.4,H),8),mat);
  rail.position.set(x*.84,H/2+1,5.7);rail.rotation.x=Math.atan2(5.4,H);rail.name='Private stair handrail';room.add(rail);
 }
 const floors=[{id:'foyer',x:[-.8,.8],z:[8.4,9.75],y:0,thick:.12},
  {id:'private-stair',x:[-.8,.8],z:[3,8.4],y:[H,0],thick:.12},
  {id:'upper-landing',x:[-.8,.8],z:[2.7,3],y:H,thick:.12},
  {id:'private-flat',x:[-3.2,3.2],z:[-2.8,2.8],y:H,thick:.12}];
 const layouts=Object.fromEntries(Object.entries(layout.homeLayouts||{}).map(([name,l])=>[name,{...l,
  ...Object.fromEntries(['bed','bedside','table','tableStand','door'].filter(k=>l[k]).map(k=>[k,[l[k][0],l[k][1]+H,l[k][2]]])),
  hatHook:l.hatHook?{...l.hatHook,position:[l.hatHook.position[0],l.hatHook.position[1]+H,l.hatHook.position[2]]}:undefined,
  cover:l.cover?{...l.cover,position:[l.cover.position[0],l.cover.position[1]+H,l.cover.position[2]]}:undefined}]));
 return {...layout,homeLayouts:layouts,bounds:{minX:-3.2,maxX:3.2,minZ:-2.8,maxZ:9.75},spawn:[0,0,9],exit:[0,1.1,9.5],walk:createHouseWalk(floors),
  blocked(x,z,r=0){return z>2.8?(x<-.8+r||x>.8-r||z>9.75-r):(x< -3.15+r||x>3.15-r||z< -2.75+r);},
  entranceRoute:[[0,0,9],[0,0,8.4],...Array.from({length:55},(_,i)=>[0,H*(i+1)/55,8.4-5.4*(i+1)/55]),[0,H,2.4]]};
}
