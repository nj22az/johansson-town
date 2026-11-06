import * as THREE from '../../vendor/three.module.js';
import {SEA_LEVEL} from './ocean.js';
import {TROPIC_OUTLINE,buildTropicalIsland,shoreSigned} from './tropical-island.js';

/**
 * Kitano-jima: the airport island, out to the east-south-east.
 *
 * Reached by the Minato car ferry. From the quay and the east beach it is a tropical
 * island on the horizon: white beaches under coconut palms, a jungle hill, and along its flat
 * north side a short runway with a control tower, a small terminal and a hangar, and now and
 * then a plane taking off over the water. The ferry lands at the quay on its west end, beside
 * check-in. The island itself (terrain, beaches, jungle) is tropical-island.js.
 */
export const AIRPORT_ISLAND=Object.freeze({
 id:'kitano-jima',title:'Kitano-jima Airport',jp:"Kitanoshima Airport",
 // Far across the strait: from the quay it is a low green island on the horizon, palms and a
 // control tower just made out, 360 m off. The car ferry takes half an hour of game time over it.
 x:270,z:-290,yaw:-.22,
 /** The airport's half-extents along and across the runway (the flat north side). */
 halfLength:62,halfWidth:20,
 /** Passenger pier's shoreward landing, in world metres. */
 dock:Object.freeze([270+Math.cos(-.22)*-51+Math.sin(-.22)*33,-290-Math.sin(-.22)*-51+Math.cos(-.22)*33]),
 /** The runway's ends in the island's own frame: planes take off toward +x. */
 runway:Object.freeze({from:-50,to:50,width:8}),
});

/** Island frame → world. */
function toWorld([u,v]){const A=AIRPORT_ISLAND,c=Math.cos(A.yaw),s=Math.sin(A.yaw);return [A.x+c*u+s*v,A.z-s*u+c*v];}
/** The island's waterline in world metres, for the sea's shallows and the map. */
export const AIRPORT_OUTLINE_WORLD=Object.freeze(TROPIC_OUTLINE.map(p=>Object.freeze(toWorld(p))));
/** Metres from a world point out to the island's waterline (0 on land); Infinity past 36 m. */
export function airportShoreDistance(x,z){const A=AIRPORT_ISLAND,dx=x-A.x,dz=z-A.z,c=Math.cos(A.yaw),s=Math.sin(A.yaw),d=Math.max(0,-shoreSigned(c*dx-s*dz,s*dx+c*dz));return d>=36?Infinity:d;}
/** How far the island's shore reaches from its centre. */
export const AIRPORT_REACH=Math.max(...TROPIC_OUTLINE.map(([u,v])=>Math.hypot(u,v)));

/** Local-frame pier bounds; the same rectangle is drawn and used for walking. */
export const AIRPORT_JETTY=Object.freeze({minX:-55.2,maxX:-48,minZ:28,maxZ:34,top:1.15,thickness:.5,landing:Object.freeze([-51,33])});

/** Minutes past midnight of the day's departures. */
export const AIRPORT_DEPARTURES=Object.freeze([555,760,975,1140]);

export function buildPlane(){
 const plane=new THREE.Group();plane.name='Commuter plane';
 const white=new THREE.MeshStandardMaterial({color:0xf2f0ea,roughness:.5});
 const blue=new THREE.MeshStandardMaterial({color:0x2d5d8a,roughness:.5});
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.9,.7,12,10),white);body.rotation.z=Math.PI/2;plane.add(body);
 const nose=new THREE.Mesh(new THREE.ConeGeometry(.9,1.8,10),white);nose.rotation.z=-Math.PI/2;nose.position.x=6.9;plane.add(nose);
 const wing=new THREE.Mesh(new THREE.BoxGeometry(2.2,.18,16),white);wing.position.set(.8,.7,0);plane.add(wing);
 const tail=new THREE.Mesh(new THREE.BoxGeometry(1.6,2.4,.16),blue);tail.position.set(-5.4,1.6,0);plane.add(tail);
 const stab=new THREE.Mesh(new THREE.BoxGeometry(1.3,.14,5),white);stab.position.set(-5.5,.5,0);plane.add(stab);
 const stripe=new THREE.Mesh(new THREE.CylinderGeometry(.92,.8,9,10,1,true),blue);stripe.rotation.z=Math.PI/2;stripe.scale.set(1,1,.35);stripe.position.y=-.1;plane.add(stripe);
 for(const side of [-1,1]){const prop=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,1.8,8),blue);prop.rotation.z=Math.PI/2;prop.position.set(1.6,.5,side*3.2);plane.add(prop);}
 return plane;
}

/** Kitano-jima. `plants:false` gives its plants as seen from across the strait until he heads there (town.js world.kitano). */
export function buildAirportIsland({parent,shadows=false,plants=true}={}){
 const A=AIRPORT_ISLAND;
 const group=new THREE.Group();group.name='Kitano-jima airport island';
 group.position.set(A.x,SEA_LEVEL,A.z);group.rotation.y=A.yaw;group.userData.horizon=true;parent.add(group);
 const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.95});
 // Everything on the island stands still except the plane and the tower beacon, so it is
 // drawn in a handful of batches (static-props.js).
 const add=(geometry,material,x,y,z)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=false;m.userData.staticProp=true;group.add(m);return m;};
 // The island: beaches, the jungle hill and the flat airport side, one terrain.
 const tropic=buildTropicalIsland(group,{plants});
 // The runway, its centreline and the threshold bars.
 const R=A.runway;
 add(new THREE.BoxGeometry(R.to-R.from,.1,R.width),mat(0x4a4d4f),0,1.15,-4);
 const paint=mat(0xf1efe6);
 for(let x=R.from+4;x<R.to-4;x+=7)add(new THREE.BoxGeometry(3.2,.04,.4),paint,x,1.22,-4);
 for(const end of [R.from+1.2,R.to-1.2])for(let k=-3;k<=3;k++)add(new THREE.BoxGeometry(1.6,.04,.5),paint,end,1.22,-4+k*1.05);
 // Apron, terminal, hangar and tower on the town side of the runway.
 add(new THREE.BoxGeometry(34,.08,10),mat(0x8a8c86),-6,1.13,8);
 const terminal=add(new THREE.BoxGeometry(18,5,7),mat(0xe8e2d2),-10,3.6,13);
 add(new THREE.BoxGeometry(18.6,.6,7.6),mat(0x2b5a78),-10,6.4,13);
 add(new THREE.BoxGeometry(16,1.4,.1),new THREE.MeshStandardMaterial({color:0x2d4a55,roughness:.2,emissive:0xf0d8a0,emissiveIntensity:.05}),-10,3.8,9.46);
 const hangar=new THREE.Mesh(new THREE.CylinderGeometry(6,6,14,16,1,false,0,Math.PI),mat(0xb7b9b4));
 // A half-cylinder lying along the runway, its curve up.
 hangar.rotation.z=Math.PI/2;hangar.position.set(14,1.1,12);group.add(hangar);
 add(new THREE.CylinderGeometry(1.3,1.7,13,10),mat(0xe8e2d2),6,7.6,14);
 add(new THREE.CylinderGeometry(2.6,2.2,2.4,10),new THREE.MeshStandardMaterial({color:0x2d4a55,roughness:.2,emissive:0xa9dcef,emissiveIntensity:.12}),6,15.2,14);
 add(new THREE.CylinderGeometry(2.9,2.9,.4,10),mat(0x2b5a78),6,16.6,14);
 const beacon=add(new THREE.SphereGeometry(.45,8,6),new THREE.MeshStandardMaterial({color:0xd8342c,emissive:0xd8342c,emissiveIntensity:.3}),6,17.3,14);beacon.userData.staticProp=false;
 // The windsock at the runway's east end.
 add(new THREE.CylinderGeometry(.15,.15,6,6),mat(0xd8d8d0),R.to-6,4,4);
 const sock=add(new THREE.ConeGeometry(.7,3.2,8,1,true),new THREE.MeshStandardMaterial({color:0xe46a2a,roughness:.7,side:THREE.DoubleSide}),R.to-4.4,6.6,4);
 sock.rotation.z=Math.PI/2;
 // The ferry pier off the quay, on the island's town-facing west end.
 const J=AIRPORT_JETTY;
 const jetty=add(new THREE.BoxGeometry(J.maxX-J.minX,J.thickness,J.maxZ-J.minZ),mat(0x9a958a),(J.minX+J.maxX)/2,J.top-J.thickness/2,(J.minZ+J.maxZ)/2);
 jetty.name='Airport shared ferry pier';
 const approach=add(new THREE.BoxGeometry(88,.08,1.4),mat(0xc4c0aa),0,1.1,20.1);approach.name='Airport terminal approach';
 // Rails along the sides leave a broad, unobstructed route into the arrival plaza.
 for(const z of [J.minZ+.12,J.maxZ-.12]){
  add(new THREE.BoxGeometry(6.8,.06,.06),mat(0x536e75),-51.6,J.top+.85,z);
  for(const x of [-54.7,-52,-49])add(new THREE.BoxGeometry(.08,.9,.08),mat(0x536e75),x,J.top+.45,z);
 }
 const sewage=buildSewagePlant(add,mat);

 const plane=buildPlane();plane.visible=false;group.add(plane);
 let flight=null,lastDeparture=null,departures=AIRPORT_DEPARTURES;
 /**
  * @param {number} dt seconds
  * @param {number} minutes the town clock
  * @param {number} day 0 at night, 1 at noon
  * @param {{x:number,z:number}} [player] where the player is, for the island's close-up detail
  */
 const update=(dt,minutes=0,day=1,player=null)=>{
  tropic.lod(player);
  beacon.material.emissiveIntensity=day<.4?1.4:(Math.sin(minutes*6)>0?.6:.1);
  const m=((minutes%1440)+1440)%1440;
  if(!flight){
   const due=departures.find(t=>m>=t&&m<t+.5&&lastDeparture!==Math.floor(minutes/1440)+':'+t);
   if(due!==undefined){flight={t:0};lastDeparture=Math.floor(minutes/1440)+':'+due;}
  }
  if(!flight){plane.visible=false;return;}
  // Rolling down the runway for twenty seconds, then climbing away east and out of sight.
  flight.t+=Math.max(0,Math.min(.1,dt));
  const t=flight.t,roll=20,climb=40;
  let x,y,pitch;
  if(t<roll){const u=t/roll;x=R.from+4+(R.to*.55-R.from-4)*u*u;y=2.05;pitch=0;}
  else{const u=Math.min(1,(t-roll)/climb);x=R.to*.55+u*260;y=2.05+u*u*70+u*10;pitch=.12+.1*(1-u);}
  plane.position.set(x,y,-4);plane.rotation.set(0,0,pitch);plane.visible=true;
  if(t>roll+climb){flight=null;plane.visible=false;}
 };
 return {group,plane,jetty,sewage,tropic,update,setDepartures:times=>{departures=times;}};
}

/**
 * The island's sewage works (下水処理場), at the west end of Kitano-jima, away from the
 * town and downwind of the terminal: where the town's wastewater goes, across the
 * strait in a pipe under the seabed. Two round clarifiers with their bridges, a long
 * aeration basin, a sludge tank, the control building and the outfall pipe running
 * out past the beach. Modelled large and simple like the rest of the island: it is
 * read from across the water. Island frame, metres; the green top is at y = 1.1.
 */
export const SEWAGE_PLANT=Object.freeze({x:-33,z:9,title:'Kitano-jima Sewage Works',jp:"Kitanojima Sewage Treatment Plant"});
function buildSewagePlant(add,mat){
 const P=SEWAGE_PLANT,top=1.1,concrete=mat(0xc9c6bc),water=mat(0x5f7f6e),dark=mat(0x4a6458),rail=mat(0x2f6f9f);
 add(new THREE.BoxGeometry(24,.12,15),mat(0x9a9b94),P.x,top+.06,P.z);
 for(const dx of [-6.5,1]){
  add(new THREE.CylinderGeometry(4,4,1.8,24),concrete,P.x+dx,top+.9,P.z-3.2);
  add(new THREE.CylinderGeometry(3.7,3.7,.1,24),water,P.x+dx,top+1.75,P.z-3.2);
  add(new THREE.CylinderGeometry(.5,.5,.6,10),concrete,P.x+dx,top+2,P.z-3.2);
  const bridge=add(new THREE.BoxGeometry(8,.25,.7),rail,P.x+dx,top+2.2,P.z-3.2);bridge.rotation.y=dx*.2;
 }
 add(new THREE.BoxGeometry(14,1.6,4.4),concrete,P.x-2,top+.8,P.z+3.6);
 add(new THREE.BoxGeometry(13.4,.1,3.8),dark,P.x-2,top+1.56,P.z+3.6);
 for(let x=-8;x<=4;x+=4)add(new THREE.BoxGeometry(.3,.3,4.6),rail,P.x+x,top+1.7,P.z+3.6);
 add(new THREE.CylinderGeometry(1.8,1.8,4.2,16),mat(0x8fa39a),P.x+8.5,top+2.1,P.z+4);
 add(new THREE.ConeGeometry(1.9,.9,16),mat(0x7d8f87),P.x+8.5,top+4.65,P.z+4);
 add(new THREE.BoxGeometry(6,4,4.2),mat(0xe4e1d6),P.x+8,top+2,P.z-3.8);
 add(new THREE.BoxGeometry(6.4,.4,4.6),mat(0x2f6f9f),P.x+8,top+4.2,P.z-3.8);
 add(new THREE.BoxGeometry(5,1,.1),mat(0x3a4a50),P.x+8,top+2.6,P.z-1.66);
 const outfall=add(new THREE.CylinderGeometry(.45,.45,18,8),mat(0x7a7d78),P.x-16,top-.4,P.z-12);
 outfall.rotation.z=Math.PI/2;outfall.rotation.y=-.6;
 return {position:[P.x,P.z]};
}
