import {FURNITURE_HEIGHTS} from '../furniture-standards.js';
import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';

/** Actual upper faces in build-minato-interior.py, rather than collider heights. */
export const MINATO_DETAIL_SURFACES=Object.freeze({
 counter:Object.freeze({y:FURNITURE_HEIGHTS.serviceCounter,minX:-5,maxX:3.4,minZ:-2.475,maxZ:-1.925}),
 westTable:Object.freeze({y:FURNITURE_HEIGHTS.table,minX:-4.75,maxX:-2.25,minZ:1.525,maxZ:2.875}),
 eastTable:Object.freeze({y:FURNITURE_HEIGHTS.table,minX:1.35,maxX:3.85,minZ:1.325,maxZ:2.675}),
 lowNorth:Object.freeze({y:.77,minX:4.925,maxX:5.675,minZ:-.1,maxZ:1.1}),
 lowSouth:Object.freeze({y:.77,minX:4.925,maxX:5.675,minZ:2.5,maxZ:3.7}),
 loungeNorth:Object.freeze({y:FURNITURE_HEIGHTS.table,minX:-4.93,maxX:-4.27,minZ:3.82,maxZ:4.48}),
 loungeSouth:Object.freeze({y:FURNITURE_HEIGHTS.table,minX:-4.93,maxX:-4.27,minZ:4.67,maxZ:5.33}),
 backBar:Object.freeze({y:1.03,minX:-4.55,maxX:-1.20,minZ:-6.22,maxZ:-5.58}),
 prep:Object.freeze({y:.8975,minX:4.84,maxX:6.26,minZ:-6.335,maxZ:-5.565}),
 loungeSeat:Object.freeze({y:FURNITURE_HEIGHTS.seat,minX:-5.98,maxX:-5.26,minZ:3.76,maxZ:4.54}),
 boothSeat:Object.freeze({y:FURNITURE_HEIGHTS.seat,minX:-4.75,maxX:-2.25,minZ:3.05,maxZ:3.51}),
});

const C={paper:0xeadfc8,fold:0xc4b598,cloth:0xd0c2a3,hem:0x9b8d72,
 china:0xe8dfcc,blue:0x3d5b65,sage:0x727c62,tea:0x795129,beer:0xb7802e,
 foam:0xece1c7,wood:0x7d5837,darkWood:0x4a3324,sauce:0x593b29,
 steel:0xa3a59a,vinyl:0x71382e,thread:0xb49370,olive:0x695e47};
const REST=.004; // Clears the thin patina layer on the furniture without floating.
const vector=(x,y)=>new THREE.Vector2(x,y);

function coloured(g,hex){
 const rgb=new THREE.Color(hex).toArray(),colours=new Float32Array(g.attributes.position.count*3);
 for(let i=0;i<colours.length;i+=3)colours.set(rgb,i);
 g.setAttribute('color',new THREE.BufferAttribute(colours,3));g.deleteAttribute('uv');
 // Extruded tray rims are non-indexed; preserve every other primitive's shared
 // vertices while giving all inputs the same representation for the final merge.
 if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));
 return g;
}
function roundedRect(w,d,r){
 const s=new THREE.Shape(),x=-w/2,z=-d/2;
 s.moveTo(x+r,z);s.lineTo(x+w-r,z);s.quadraticCurveTo(x+w,z,x+w,z+r);
 s.lineTo(x+w,z+d-r);s.quadraticCurveTo(x+w,z+d,x+w-r,z+d);
 s.lineTo(x+r,z+d);s.quadraticCurveTo(x,z+d,x,z+d-r);
 s.lineTo(x,z+r);s.quadraticCurveTo(x,z,x+r,z);return s;
}

/**
 * The quiet evidence of another evening at Minato. These sit on existing furniture;
 * nothing is added to the customer aisle, kitchen aisle, koagari step or doorway.
 * Hollow cups, partial drinks and turned dishes remain recognisable close to the
 * player's camera. Paper, glaze, metal and glass each share one merged draw.
 */
export function buildIzakayaLivedIn(room){
 const parts={matte:[],glaze:[],metal:[],glass:[]},placements=[];let itemBounds=null;
 const piece=(batch,g,hex,p,dx=0,dy=0,dz=0)=>{
  g.translate(dx,dy,dz);g.rotateY(p.yaw||0);g.translate(p.x,p.y,p.z);coloured(g,hex);
  parts[batch].push(g);if(itemBounds){g.computeBoundingBox();itemBounds.union(g.boundingBox);}return g;
 };
 const box=(batch,w,h,d,hex,p,x=0,y=0,z=0)=>piece(batch,new THREE.BoxGeometry(w,h,d),hex,p,x,y,z);
 const cylinder=(batch,r,h,hex,p,x=0,y=0,z=0,top=r,segments=16)=>
  piece(batch,new THREE.CylinderGeometry(top,r,h,segments),hex,p,x,y,z);
 const ring=(batch,r,t,hex,p,x=0,y=0,z=0,arc=Math.PI*2)=>
  piece(batch,new THREE.TorusGeometry(r,t,5,24,arc).rotateX(Math.PI/2),hex,p,x,y,z);
 const ball=(batch,r,hex,p,x,y,z,sx=1,sy=1,sz=1)=>
  piece(batch,new THREE.SphereGeometry(r,10,6).scale(sx,sy,sz),hex,p,x,y,z);
 const turned=(points,hex,p)=>piece('glaze',new THREE.LatheGeometry(points.map(([r,y])=>vector(r,y)),20),hex,p);
 const on=(id,surface,x,z,yaw,draw)=>{
  const previous=itemBounds;itemBounds=new THREE.Box3();
  draw({x,y:MINATO_DETAIL_SURFACES[surface].y+REST,z,yaw});
  placements.push(Object.freeze({id,surface,min:Object.freeze(itemBounds.min.toArray()),max:Object.freeze(itemBounds.max.toArray())}));
  itemBounds=previous;
 };
 const plate=(p,r=.095,colour=C.china)=>{
  cylinder('glaze',r*.44,.005,colour,p,0,.0025);
  turned([[0,.004],[r*.58,.004],[r*.87,.011],[r,.019],[r-.003,.023],[r*.83,.015],[r*.5,.009],[0,.009]],colour,p);
  ring('glaze',r*.94,.0018,C.blue,p,0,.02);
  // A hand-painted blue rim, with a few irregular brush dashes.
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3+.12,g=new THREE.BoxGeometry(.012,.0014,.003);
   g.rotateY(-a);piece('glaze',g,C.blue,p,Math.cos(a)*r*.87,.0205,Math.sin(a)*r*.87);
  }
 };
 const tea=p=>{
  plate(p,.067);
  const q={...p,y:p.y+.009};
  cylinder('glaze',.026,.005,C.blue,q,0,.0025);
  turned([[0,.005],[.029,.005],[.033,.017],[.042,.081],[.04,.086],[.035,.083],[.029,.018],[0,.018]],C.china,q);
  ring('glaze',.041,.0016,C.blue,q,0,.076);
  ring('glaze',.039,.0013,C.blue,q,0,.063);
  cylinder('glaze',.033,.002,C.tea,q,0,.058);
 };
 const beer=(p,fill)=>{
  piece('glass',new THREE.LatheGeometry([[0,0],[.038,0],[.044,.008],[.045,.142],[.043,.146],[.039,.14],[.036,.012],[0,.012]].map(([r,y])=>vector(r,y)),20),0xd8dfd5,p);
  ring('glass',.043,.0025,0xdce1d6,p,0,.143);
  piece('glass',new THREE.TorusGeometry(.027,.005,6,16,Math.PI).rotateZ(-Math.PI/2),0xd8dfd5,p,.046,.075);
  cylinder('glaze',.037,fill,C.beer,p,0,.012+fill/2);
  cylinder('glaze',.038,.005,C.foam,p,0,.0145+fill);
  // The previous mouthful left a broken foam collar above the new level.
  ring('glaze',.039,.0014,C.foam,p,0,.113,0,Math.PI*1.15);
 };
 const sleeve=p=>{
  box('matte',.185,.002,.031,C.paper,p,0,.001);
  box('matte',.165,.0008,.003,C.fold,p,-.008,.0024,.013);
  box('matte',.03,.0008,.032,0x965246,p,-.048,.0024);
  // Exposed bamboo tips and a folded seam stop this reading as a flat white bar.
  for(const z of [-.006,.006])piece('matte',new THREE.CylinderGeometry(.0013,.0023,.237,6).rotateZ(-Math.PI/2),C.wood,p,.028,.0045,z);
  box('matte',.012,.0007,.017,C.fold,p,.087,.0027);
  for(const [x,z,w,d] of [[-.05,0,.002,.014],[-.046,.002,.009,.002],[-.053,-.003,.008,.002]])box('matte',w,.0008,d,C.paper,p,x,.003,z);
 };
 const napkin=(p,w=.14,d=.1)=>{
  box('matte',w,.003,d,C.cloth,p,0,.0015);
  const fold=new THREE.PlaneGeometry(w*.66,d,3,2).rotateX(-Math.PI/2),v=fold.attributes.position;
  for(let i=0;i<v.count;i++)v.setY(i,.0035+.002*Math.sin((v.getX(i)/w+.5)*Math.PI));
  fold.computeVertexNormals();piece('matte',fold,C.paper,p,w*.12,0,0);
  box('matte',w*.92,.0008,.0015,C.hem,p,0,.0035,-d/2+.005);
  box('matte',.0015,.0008,d*.91,C.hem,p,-w/2+.005,.0035);
 };
 const sauceDish=(p,used=false)=>{
  plate(p,.072);
  cylinder('glaze',.035,.0015,C.sauce,p,0,.0105);
  if(used){
   // A discarded pod and one skewered morsel: a meal in progress, not a full display.
   for(const [x,z,a] of [[.043,.005,.5],[.045,-.012,-.2]])piece('matte',new THREE.CapsuleGeometry(.004,.035,2,6).rotateZ(Math.PI/2).rotateY(a),0x788052,p,x,.019,z);
   piece('matte',new THREE.CylinderGeometry(.0015,.0018,.16,5).rotateZ(Math.PI/2).rotateY(.23),C.wood,p,-.01,.019,.008);
  }
 };
 const tray=p=>{
  const w=.28,d=.14;
  piece('matte',new THREE.ExtrudeGeometry(roundedRect(w,d,.015),{depth:.006,bevelEnabled:false,curveSegments:4}).rotateX(-Math.PI/2),C.darkWood,p);
  const edge=roundedRect(w,d,.015),hole=roundedRect(w-.019,d-.019,.007);
  edge.holes.push(hole);
  piece('matte',new THREE.ExtrudeGeometry(edge,{depth:.012,bevelEnabled:false,curveSegments:4}).rotateX(-Math.PI/2),C.wood,p,0,.006);
  const cup={...p,x:p.x-.064,y:p.y+.008,z:p.z};
  for(let i=0;i<3;i++){
   const q={...cup,y:cup.y+i*.009};
   turned([[0,.002],[.026,.002],[.041,.027],[.037,.03],[.022,.01],[0,.01]],i===1?C.blue:C.china,q);
  }
  // Two teaspoons, bowl and tapered handle distinct, inside the shallow tray.
  for(const z of [-.029,.018]){
   ball('metal',.014,C.steel,p,.078,.012,z,1.25,.17,.68);
   box('metal',.075,.0025,.006,C.steel,p,.028,.012,z);
  }
 };
 const teapot=p=>{
  cylinder('glaze',.042,.006,C.sage,p,0,.003);
  turned([[0,.006],[.045,.006],[.073,.025],[.083,.065],[.071,.099],[.052,.106],[.049,.102],[.062,.093],[.069,.064],[.059,.025],[0,.02]],C.sage,p);
  cylinder('glaze',.053,.008,C.china,p,0,.108,0,.056);
  ball('glaze',.013,C.blue,p,0,.121,0,1,.7,1);
  // The angled ceramic spout is open at its tip; the handle lies in the pot's plane.
  const a=new THREE.Vector3(.061,.062,0),b=new THREE.Vector3(.135,.09,0),dir=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5);
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize());
  piece('glaze',new THREE.CylinderGeometry(.014,.026,dir.length(),12,1,true).applyQuaternion(q),C.sage,p,mid.x,mid.y,mid.z);
  piece('glaze',new THREE.CylinderGeometry(.009,.009,.001,12).applyQuaternion(q),C.sauce,p,b.x,b.y,b.z);
  piece('glaze',new THREE.TorusGeometry(.036,.009,6,18,Math.PI*1.65).rotateZ(Math.PI*.18),C.china,p,-.081,.063);
 };
 const patch=(p,w,d,colour)=>{
  box('matte',w,.0015,d,colour,p,0,.00075);
  // Two staggered stitch rows and a crooked mended edge, rather than a broad decal.
  for(const side of [-1,1])for(let i=0;i<5;i++){
   const g=new THREE.BoxGeometry(.008,.0008,.0014);g.rotateY((i%2?.22:-.12));
   piece('matte',g,C.thread,p,-w*.38+i*w*.19,.002,side*(d/2-.007));
  }
  box('matte',.0015,.0008,d*.8,C.darkWood,p,-w/2+.003,.002);
 };

 // Existing bottles, caddies, ashtrays and the player's served dish/drink positions
 // keep their spaces. These are the unused corners of the fitted tabletops.
 on('west shallow soy dish','westTable',-2.73,2.64,-.12,p=>sauceDish(p,true));
 on('west partial lager','westTable',-2.48,2.39,-.18,p=>beer(p,.066));
 on('west warm tea','westTable',-3.48,2.58,.12,tea);
 on('west chopstick sleeve','westTable',-4.02,2.68,-.14,sleeve);
 on('west folded napkin','westTable',-3.13,2.7,.08,p=>napkin(p,.14,.09));
 on('east warm tea','eastTable',2.4,2.35,-.1,tea);
 on('east dipping dish','eastTable',2.91,2.44,.18,p=>sauceDish(p));
 on('east chopstick sleeve','eastTable',1.98,2.49,.1,sleeve);
 on('east folded napkin','eastTable',2.66,1.48,-.12,p=>napkin(p,.13,.1));
 on('counter used saucer','counter',-4.75,-2.22,.05,p=>sauceDish(p));
 on('counter folded cloth','counter',2.79,-2.035,-.08,p=>napkin(p,.1,.068));
 on('north koagari tea','lowNorth',5.54,.57,0,tea);
 on('north koagari napkin','lowNorth',5.57,.9,.08,p=>napkin(p,.085,.135));
 on('south koagari tea','lowSouth',5.54,3.1,0,tea);
 on('south koagari sleeve','lowSouth',5.015,3.37,Math.PI/2,sleeve);
 // The lounge cards occupy the middle/back. Drinks are at the outer front corners.
 on('lounge north tea','loungeNorth',-4.76,4.22,-.12,tea);
 on('lounge north napkin','loungeNorth',-4.43,4.34,.06,p=>napkin(p,.11,.085));
 on('lounge south partial lager','loungeSouth',-4.73,5.14,.24,p=>beer(p,.042));
 on('lounge south small dish','loungeSouth',-4.42,5.07,0,p=>plate(p,.065));
 // The new cabinet is stocked with bottles. The tea service now stands on the
 // clear rear strip of the kitchen prep bench, behind the chopping board.
 on('prep teapot','prep',5.39,-6.22,.04,teapot);
 on('prep clean saucers','prep',5.72,-6.22,0,p=>{
  for(let i=0;i<5;i++)plate({...p,y:p.y+i*.013},.084,i===1?C.blue:C.china);
 });
 on('prep service tray','prep',5.025,-5.655,0,tray);
 on('prep folded cloth','prep',5.5,-5.66,.02,p=>napkin(p,.24,.14));
 on('lounge stitched repair','loungeSeat',-5.77,4.38,.09,p=>patch(p,.15,.10,C.olive));
 on('booth stitched repair','boothSeat',-4.55,3.32,-.06,p=>patch(p,.12,.068,C.vinyl));

 const group=new THREE.Group();group.name='Minato lived-in details';room.add(group);
 const finishes={
  matte:{roughness:.88},glaze:{roughness:.36},metal:{roughness:.43,metalness:.55},
  glass:{roughness:.12,transparent:true,opacity:.29,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true},
 };
 for(const [name,geometries] of Object.entries(parts)){
  if(!geometries.length)continue;
  const geometry=mergeGeometries(geometries),material=new THREE.MeshStandardMaterial({vertexColors:true,...finishes[name]});
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Minato lived-in '+name;
  mesh.castShadow=false;mesh.receiveShadow=name!=='glass';group.add(mesh);
  geometries.forEach(g=>g.dispose());
 }
 group.userData.placements=placements;
 return {group,placements};
}
