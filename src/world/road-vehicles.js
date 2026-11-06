import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {createShopGlass} from './shop-glass.js';

// Minato's one car family: original 1990s Japanese compact, tall kei hatchback, cab-over kei and local delivery truck
// silhouettes, the nose along +z, the wheels on the ground at y 0. The traffic drives them (buildVehicle: hollow cabins with
// clear glass, so the actual resident drivers show); the parked cars are the same bodies built into a street kit
// (buildParkedVehicle: tinted glass, no cabin inside, merged with the quarter so they cost no draw call of their own).
export const VEHICLE_SIZE=Object.freeze({'kei truck':Object.freeze({length:3.4,width:1.48}),'kei car':Object.freeze({length:3.3,width:1.4}),car:Object.freeze({length:3.9,width:1.62}),'delivery truck':Object.freeze({length:4.9,width:1.95})});
// (floor: the top of the cab's floor under the driver's feet, measured by a ray down the footwell: 0.265 in all four; a
// driver's feet were set on 0.22 and his soles stood 4 to 8 cm into it. The kei truck's driver sits 0.27 from the middle,
// not 0.32: its front wheels lie under the footwell, and the outer foot stood 3 cm into the tyre)
export const DRIVER_SEATS=Object.freeze({car:{x:-.34,y:.46,z:.05,roof:1.78,floor:.265},'kei car':{x:-.31,y:.46,z:-.05,roof:1.74,floor:.265},'kei truck':{x:-.27,y:.56,z:.8,roof:1.91,floor:.265},'delivery truck':{x:-.38,y:.72,z:1.65,roof:2.22,floor:.265}});

/**
 * The two hatchbacks' bodies, as side profiles [z, y]: the 3.9 m compact and the tall 3.3 m kei car of the 1993 kind
 * (3.30 × 1.40 m under the kei rules, a short bonnet, an upright hatch, a tall glasshouse). `nose` is the bonnet's block
 * from the windscreen's foot to the grille, `tail` the deck under the hatch glass.
 */
const HATCHES=Object.freeze({
 car:Object.freeze({w:1.6,r:.3,wheel:1.18,front:1.9,back:-1.9,
  top:[[-1.9,.32],[-1.87,.76],[-1.24,.89],[.95,.87],[1.78,.74],[1.9,.51]],
  belt:.89,frontBottom:.94,frontTop:.57,rearBottom:-1.24,rearTop:-.76,roofW:1.30,pillar:-.40,
  nose:[[.94,.83],[1.80,.72],[1.88,.57],[1.88,.52],[.94,.59]],tail:[[-1.9,.57],[-1.85,.76],[-1.24,.87],[-1.24,.57]]}),
 'kei car':Object.freeze({w:1.36,r:.26,wheel:1.13,front:1.64,back:-1.64,
  top:[[-1.64,.32],[-1.62,.84],[-1.5,.87],[.80,.86],[1.55,.72],[1.64,.52]],
  belt:.87,frontBottom:.80,frontTop:.10,rearBottom:-1.5,rearTop:-1.40,roofW:1.18,pillar:-.42,
  nose:[[.80,.83],[1.56,.72],[1.62,.58],[1.62,.52],[.80,.59]],tail:[[-1.64,.57],[-1.62,.84],[-1.5,.86],[-1.5,.57]]}),
});
/** Where a kei truck's load bed is (its floor's top, its inside), for what an owner carries in it. */
export const KEI_TRUCK_BED=Object.freeze({floor:.6825,minX:-.64,maxX:.64,minZ:-1.58,maxZ:.18});

/**
 * Sculpts a vehicle, handing every piece to `emit(geometry, hex, finish)` ('gloss' for paint and glass, 'metal', 'matte',
 * 'lamp') and every clear pane to `pane(name, points)`. Options: `interior` (seats, dash and wheel; false where the glass
 * is tinted), `cargo` ('parts', the blue parts boxes on a kei truck's bed, or 'none'), `bonnet` ('shut' or 'open', a
 * hatchback's bonnet up on its stay with the engine bay under it), `detail` (1, or lower for a parked car's tyres).
 */
function sculpt(kind,colour,{emit,pane,interior=true,cargo='parts',bonnet='shut',detail=1}){
 const wheelPoints=[],trim=0x30393d,metal=0xb2b9ba,dark=0x2a2c2f;
 const fin=c=>c===colour?'gloss':c===metal?'metal':'matte';
 const add=(geometry,hex,finish=fin(hex))=>emit(geometry.index?geometry.toNonIndexed():geometry,hex,finish);
 function box(w,h,d,x,y,z,c=colour,finish,rx=0){const geo=new THREE.BoxGeometry(w,h,d);if(rx)geo.rotateX(rx);geo.translate(x,y,z);add(geo,c,finish);}
 function rod(a,b,r,c=colour){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),delta=B.clone().sub(A),geo=new THREE.CylinderGeometry(r,r,delta.length(),detail<1?6:8);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));geo.translate(...A.add(B).multiplyScalar(.5).toArray());add(geo,c);}
 function profile(points,width,x=0,c=colour){const shape=new THREE.Shape();points.forEach(([z,y],i)=>shape[i?'lineTo':'moveTo'](-z,y));shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false,steps:1});geo.rotateY(Math.PI/2);geo.translate(x-width/2,0,0);add(geo,c);}
 const round=n=>Math.max(8,Math.round(n*detail));
 function wheel(x,z,r){
  wheelPoints.push(Object.freeze({x,z,r}));
  // Rounded tyre shoulders, silver steel wheel, dark centre and four lug nuts.
  const tyre=new THREE.CylinderGeometry(r*.91,r*.91,.17,round(16));tyre.rotateZ(Math.PI/2);tyre.translate(x,r,z);add(tyre,0x22272b);
  // A parked car (detail under 1) keeps only the outer shoulder: the inner one faces under the car.
  for(const dx of detail<1?[Math.sign(x)*.075]:[-.075,.075]){const shoulder=new THREE.TorusGeometry(r*.78,r*.22,detail<1?4:6,detail<1?12:16);shoulder.rotateY(Math.PI/2);shoulder.translate(x+dx,r,z);add(shoulder,0x22272b);}
  const side=Math.sign(x),face=x+side*.092,rim=new THREE.CylinderGeometry(r*.57,r*.57,.025,round(12));rim.rotateZ(Math.PI/2);rim.translate(face,r,z);add(rim,metal);
  const hub=new THREE.CylinderGeometry(r*.21,r*.21,.036,detail<1?6:10);hub.rotateZ(Math.PI/2);hub.translate(face+side*.015,r,z);add(hub,trim);
  if(detail>=1)for(let i=0;i<4;i++){const a=i*Math.PI/2;box(.012,.024,.024,face+side*.016,r+Math.cos(a)*r*.34,z+Math.sin(a)*r*.34,0xe0e3df);}
 }
 const hatch=HATCHES[kind],delivery=kind==='delivery truck',seat=DRIVER_SEATS[kind],size=VEHICLE_SIZE[kind];
 const w=hatch?hatch.w:delivery?1.86:1.42,r=hatch?hatch.r:delivery?.36:.275;
 const frontWheel=hatch?hatch.wheel:delivery?1.8:1.06,rearWheel=-frontWheel+(delivery?.33:0);
 const front=hatch?hatch.front:delivery?2.4:1.64,back=hatch?hatch.back:delivery?-2.4:-1.64;
 // Side body skins have real wheel openings, rather than solid boxes over the tyres.
 for(const side of [-1,1]){
  const shape=new THREE.Shape();const top=hatch?hatch.top:[[back,.3],[back,.7],[front,.7],[front,.3]];
  top.forEach(([z,y],i)=>shape[i?'lineTo':'moveTo'](-z,y));shape.lineTo(-front,.25);
  for(const z of [frontWheel,rearWheel]){shape.lineTo(-(z+r+.06),r);shape.absarc(-z,r,r+.06,Math.PI,0,true);shape.lineTo(-(z-r-.06),.25);}
  shape.lineTo(-back,.25);shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false});geo.rotateY(Math.PI/2);geo.translate(side*w/2-(side>0?.045:0),0,0);add(geo,colour);
  for(const z of [frontWheel,rearWheel])wheel(side*(size.width/2-.095),z,r);
 }
 box(w-.1,.07,front-back-.2,0,.23,(front+back)/2,trim);
 // `nose`: the edge of the front face the grille and headlamps sit on (top, then bottom), where it slopes.
 let belt,frontBottom,frontTop,rearBottom,rearTop,roofW,nose=null;
 if(hatch){
  ({belt,frontBottom,frontTop,rearBottom,rearTop,roofW}=hatch);
  if(bonnet==='open')openBonnet();else{profile(hatch.nose,w);nose=[hatch.nose[1],hatch.nose[2]];}
  profile(hatch.tail,w);
  // Narrow door skins leave the footwell and cabin open for seated residents.
  const doors=frontBottom-rearBottom-.06,mid=(frontBottom+rearBottom)/2;
  for(const side of [-1,1]){box(.055,.13,doors,side*(w/2-.025),.815,mid);box(.027,.018,doors+.06,side*(w/2+.007),.90,mid,trim);}
  box(w,.09,.065,0,.78,rearBottom,colour);
 }else if(delivery){
  belt=.96;frontBottom=2.38;frontTop=2.13;rearBottom=.9;rearTop=.99;roofW=1.7;
  for(const side of [-1,1])profile([[.9,.70],[.9,.96],[2.30,.96],[2.4,.70]],.045,side*(w/2-.025));
  box(w,.30,.055,0,.50,2.37);
  // The cab's front skin and engine cover stop ahead of the driver's knees.
  box(w,.19,.09,0,.93,2.35);box(w-.08,.08,.38,0,.91,2.17);
  // Hollow corrugated freight box with double rear doors and latch bars.
  box(1.86,1.84,.065,0,1.38,.79,0xeeeadd);
  for(const side of [-1,1]){box(.055,1.84,3.15,side*.92,1.38,-.82,0xeeeadd);for(let z=-2.33;z<.7;z+=.18)box(.018,1.70,.025,side*.956,1.38,z,0xcccfc7);}
  box(1.91,.085,3.25,0,2.34,-.83,0xeeeadd);box(1.85,.1,3.18,0,.47,-.82,trim);
  for(const x of [-.46,.46]){box(.88,1.80,.055,x,1.38,-2.43,0xe5e4db);rod([x-.15,.6,-2.468],[x-.15,2.12,-2.468],.02,metal);box(.15,.05,.06,x-.1,1.15,-2.475,trim);}
 }else{
  belt=.94;frontBottom=1.62;frontTop=1.39;rearBottom=.20;rearTop=.29;roofW=1.27;
  // The cab front, closed from the bumper up to the screen, the lamps and grille on it.
  box(w,.19,.065,0,.88,1.59);box(w-.08,.065,.3,0,.91,1.45);box(w,.28,.05,0,.65,front-.025);
  // Cab-over utility truck: a visible load bed, tailgate and hinges, and the owner's load on it.
  box(1.32,.065,1.8,0,.65,-.71,0x767e7f);
  for(const side of [-1,1])box(.045,.30,1.82,side*.685,.82,-.71);
  box(1.40,.30,.05,0,.82,-1.62);for(const x of [-.5,.5])box(.12,.04,.045,x,.69,-1.66,metal);
  if(cargo==='parts'){box(1.1,.44,1.2,0,.905,-.7,0x3479ac);for(const z of [-1.15,-.3])box(1.12,.018,.018,0,1.12,z,0x5c9bc3);}
 }
 /**
  * A hatchback's bonnet up on its stay, hinged at the scuttle below the windscreen, and the engine bay it opens: the
  * liner and the inner wings, the bulkhead, the engine with its cam cover and the air cleaner, the battery, the radiator
  * behind the grille and the coolant bottle. The grille's surround stays where the closed bonnet's nose was.
  */
 function openBonnet(){
  const [[fb,hy],[nz,ny]]=hatch.nose,F=hatch.nose[2][0],bay0=fb+.04,bay1=F-.16,mid=(bay0+bay1)/2,inner=w/2-.065;
  profile([[F-.16,.42],[F-.16,ny-.03],[nz,ny-.03],[F,.57],[F,.52]],w);nose=[[nz,ny-.03],[F,.57]];
  box(w-.1,.04,bay1-bay0,0,.40,mid,dark);
  for(const s of [-1,1])box(.03,.30,bay1-bay0,s*inner,.57,mid,dark);
  box(w-.1,.40,.03,0,.62,bay0,dark);box(w-.04,.05,.10,0,hy-.03,fb+.05,colour);
  const ez=mid-.04;box(.6,.3,.4,0,.57,ez,0x5d6266,'metal');box(.54,.06,.32,0,.75,ez,0xb0b5b8,'metal');
  const cleaner=new THREE.CylinderGeometry(.16,.16,.07,14);cleaner.translate(-.2,.815,ez-.02);add(cleaner,0x2b2d30);
  const nut=new THREE.CylinderGeometry(.03,.03,.02,8);nut.translate(-.2,.86,ez-.02);add(nut,metal);
  rod([-.2,.79,ez+.14],[-.2,.62,bay1-.06],.045,0x2b2d30);
  box(.2,.18,.15,inner-.14,.51,bay1-.12,0x24272a);box(.035,.03,.035,inner-.2,.615,bay1-.12,0xc8432f);box(.035,.03,.035,inner-.08,.615,bay1-.12,0x2b2d30);
  box(w-.34,.26,.04,0,.56,bay1-.02,0x3a3d40);box(.09,.12,.08,-inner+.12,.5,bay1-.14,0xe8e6dc);
  // The bonnet: the panel and its dark under-pad, turned up about the hinge, and the stay from the slam panel to it.
  const len=nz-fb+.06,up=.95,hinge=new THREE.Vector3(0,hy+.01,fb+.02),turn=g=>{g.rotateX(-up);g.translate(hinge.x,hinge.y,hinge.z);return g;};
  const panel=new THREE.BoxGeometry(w-.1,.03,len);panel.translate(0,0,len/2);add(turn(panel),colour);
  const pad=new THREE.BoxGeometry(w-.24,.02,len-.14);pad.translate(0,-.026,len/2);add(turn(pad),0x2f3133);
  const stayFoot=[inner-.12,ny-.03,F-.18],stayTop=new THREE.Vector3(inner-.12,-.035,len*.8).applyAxisAngle(new THREE.Vector3(1,0,0),-up).add(hinge);
  rod(stayFoot,stayTop.toArray(),.008,0x9aa0a4);
 }
 // Tapered cabin with a slightly crowned roof and inclined front/rear glazing.
 const roofY=seat.roof,sideX=w/2-.025;
 const fb=[[-sideX,belt,frontBottom],[sideX,belt,frontBottom],[roofW/2,roofY-.075,frontTop],[-roofW/2,roofY-.075,frontTop]],rb=[[-sideX,belt,rearBottom],[sideX,belt,rearBottom],[roofW/2,roofY-.075,rearTop],[-roofW/2,roofY-.075,rearTop]];
 pane('Sloping windshield',fb);pane('Rear window',rb);
 for(const side of [-1,1]){
  const lowerFront=[side*sideX,belt,frontBottom],upperFront=[side*roofW/2,roofY-.075,frontTop],lowerRear=[side*sideX,belt,rearBottom],upperRear=[side*roofW/2,roofY-.075,rearTop];
  pane('Side door windows',[lowerRear,lowerFront,upperFront,upperRear]);rod(lowerFront,upperFront,.04);rod(lowerRear,upperRear,.055);rod(upperRear,upperFront,.027,trim);
  box(.05,.15,frontBottom-rearBottom,side*sideX,belt-.10,(frontBottom+rearBottom)/2);
  // Door seam, chrome handle, and mirrors on short stalks.
  const seam=hatch?hatch.pillar-.02:rearBottom+.1;rod([side*(sideX+.025),.4,seam],[side*(sideX+.025),belt,seam],.006,trim);
  box(.025,.035,.15,side*(sideX+.04),belt-.15,seam+.18,metal);
  rod([side*sideX,1.10,frontBottom-.05],[side*(size.width/2-.02),1.12,frontBottom-.13],.023,trim);
  box(.11,.105,.17,side*(size.width/2-.04),1.15,frontBottom-.14,trim);box(.015,.075,.13,side*(size.width/2+.017),1.15,frontBottom-.14,metal);
  if(hatch){const z=hatch.pillar;rod([side*sideX,belt,z],[side*roofW/2,roofY-.08,z],.022,trim);}
 }
 // Curved, closed roof surface: this remains opaque when seen from above or behind.
 const roofProfile=[[rearTop-.08,roofY-.08],[rearTop,roofY-.01],[(rearTop+frontTop)/2,roofY+.025],[frontTop,roofY-.01],[frontTop+.06,roofY-.08]];
 profile(roofProfile,roofW+.10);
 for(const pts of [fb,rb])rod(pts[0],pts[1],.027,trim);
 // The dash under the windscreen's foot; separate seats, rear seat for the hatchbacks and the steering wheel.
 box(w-.14,.12,.17,0,belt-.05,frontBottom-.12,trim);
 if(interior){
  // (the seats under where the driver and his passenger sit)
  for(const x of [seat.x,-seat.x]){box(.49,.11,.46,x,seat.y-.055,seat.z,0x4d555b);box(.47,.43,.09,x,seat.y+.21,seat.z-.28,0x4d555b);box(.25,.17,.12,x,seat.y+.48,seat.z-.29,0x4d555b);}
  if(hatch){box(w-.45,.09,.36,0,.46,rearBottom+.34,0x4d555b);box(w-.45,.35,.09,0,.65,rearBottom+.16,0x4d555b);}
  const steering=new THREE.TorusGeometry(.13,.022,6,12);steering.rotateX(.6);steering.translate(seat.x,belt+.10,seat.z+.32);add(steering,trim);
  rod([seat.x,belt+.10,seat.z+.32],[seat.x,belt-.13,seat.z+.46],.025,trim);
 }
 // Black bumpers, grille, paired lights and Japanese registration plates: a kei's are yellow, everyone else's white.
 const plate=kind.startsWith('kei')?0xe7c43c:0xf3efda;
 for(const end of [-1,1]){const z=end>0?front:back;box(w+.025,.16,.085,0,.43,z,trim);box(.32,.11,.012,0,.46,z+end*.049,plate);}
 // On a hatchback they lie on the sloping nose, turned to its slope; on the trucks on the upright cab front and tailgate.
 const ly=delivery?.84:.64,gy=delivery?.86:.63;
 const onFront=(w,h,d,x,y,c,finish,lift=0)=>{
  if(!nose)return box(w,h,d,x,y,front+d/2+lift,c,finish);
  const [[z0,y0],[z1,y1]]=nose,tilt=Math.atan2(z1-z0,y0-y1),z=z1+(z0-z1)*(y-y1)/(y0-y1);
  const out=d/2+.002+lift;box(w,h,d,x,y+Math.sin(tilt)*out,z+Math.cos(tilt)*out,c,finish,-tilt);
 };
 const rearFace=hatch?(([z0,y0],[z1,y1])=>z0+(z1-z0)*(.64-y0)/(y1-y0))(hatch.tail[0],hatch.tail[1]):delivery?-2.4575:-1.645;
 onFront(w*.42,.105,.025,0,gy,trim);
 for(let i=0;i<5;i++)onFront(w*.40,.013,.02,0,gy-.04+i*.017,metal,undefined,.017);
 for(const side of [-1,1]){const x=side*w*.34;onFront(kind==='car'?.32:.24,.15,.025,x,ly,0xf7ead0,'lamp');onFront(.07,.15,.027,x+side*((kind==='car'?.32:.24)/2+.037),ly,0xdd9e42,'lamp');box(.24,.11,.027,side*w*.34,.64,rearFace-.0145,0xb83d32,'lamp');}
 // Windshield wipers and the small exhaust pipe below the rear bumper.
 for(const x of [-w*.22,w*.22])rod([x,belt+.035,frontBottom+.014],[x+.14,belt+.19,frontBottom-.02],.009,trim);
 rod([w*.3,.27,back+.15],[w*.3,.27,back-.06],.035,0x727b7e);
 return {seat,wheels:Object.freeze(wheelPoints),steeringWheel:{x:seat.x,y:belt+.10,z:seat.z+.32,r:.13},
  style:kind==='car'?'1990s Japanese compact hatchback':kind==='kei car'?'1990s Japanese tall kei hatchback':delivery?'1990s Japanese cab-over delivery truck':'1990s Japanese kei pickup'};
}

/** A road vehicle for the traffic: its own group, the body merged into one mesh and the lamps into another, clear glass. */
export function buildVehicle(kind,colour,options={}){
 const g=new THREE.Group();g.name='Road '+kind;
 const opaque=[],lamps=[],color=new THREE.Color();
 const panes=new THREE.Group();panes.name='Clear vehicle windows';g.add(panes);
 const glass=createShopGlass();glass.opacity=.10;glass.color.setHex(0xc5e0e5);
 const made=sculpt(kind,colour,{...options,
  emit(geo,hex,finish){geo.deleteAttribute('uv');color.set(hex);
   const c=new Float32Array(geo.attributes.position.count*3);for(let i=0;i<c.length;i+=3)c.set([color.r,color.g,color.b],i);
   geo.setAttribute('color',new THREE.BufferAttribute(c,3));(finish==='lamp'?lamps:opaque).push(geo);},
  pane(name,points){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));geometry.setIndex([0,1,2,0,2,3]);geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,glass);mesh.name=name;panes.add(mesh);}});
 function finish(parts,name,material){const geo=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());geo.computeBoundingSphere();const m=new THREE.Mesh(geo,material);m.name=name;m.castShadow=true;m.receiveShadow=true;g.add(m);}
 finish(opaque,'Sculpted vehicle body, cabin and wheels',new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6}));
 finish(lamps,'Vehicle lamps',new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35}));
 g.userData.driverSeat={...made.seat};
 g.userData.wheels=made.wheels;
 // Where the driver's hands go (people/vehicle-driver.js): the rim at nine and three.
 g.userData.steeringWheel=made.steeringWheel;g.userData.vehicleStyle=made.style;
 g.visible=false;g.userData.dynamicProp=true;g.userData.walkSurface=false;return g;
}

const IDENTITY=new THREE.Matrix4();
/**
 * A parked vehicle of the same family, built into a street kit (okinawa/kit.js) in the kit's current frame, nose along +z,
 * wheels on the ground at y 0: merged with the quarter by finish, so a car park of them adds no draw call (paint, glass and
 * lamps in the kit's metal finish, which a street already has for its poles and rails; the rest matte), with tinted
 * glass (both faces, so it reads from inside a bay and out), no cabin behind it and lighter tyres. Lamps are painted, not
 * lit: a parked car's lights are off. `cargo` and `bonnet` as for the traffic (sculpt).
 */
export function buildParkedVehicle(kit,kind,colour,{cargo='none',bonnet='shut',glass=0x2f3e4a}={}){
 const made=sculpt(kind,colour,{cargo,bonnet,interior:false,detail:.75,
  emit(geo,hex,finish){kit.add(geo,IDENTITY,hex,finish==='matte'?'matte':'metal');geo.dispose();},
  pane(name,points){const [a,b,c,d]=points,geo=new THREE.BufferGeometry();
   geo.setAttribute('position',new THREE.Float32BufferAttribute([a,b,c,a,c,d,a,c,b,a,d,c].flat(),3));geo.computeVertexNormals();
   kit.add(geo,IDENTITY,glass,'metal');geo.dispose();}});
 return {wheels:made.wheels,style:made.style};
}

/**
 * A parked vehicle's measure, as buildParkedVehicle builds it (nose along +z): the rear axle's distance behind the centre
 * and the tyres' radius, how far its tail and nose reach, its half width over the tyres and mirrors, and its height.
 */
export function parkedVehicleFit(kind,{bonnet='shut'}={}){
 const box=new THREE.Box3(),p=new THREE.Vector3();
 const made=sculpt(kind,-1,{interior:false,detail:.75,cargo:'none',bonnet,
  emit(geo){geo.computeBoundingBox();box.union(geo.boundingBox);geo.dispose();},
  pane(name,points){for(const q of points)box.expandByPoint(p.set(...q));}});
 const rear=made.wheels.reduce((a,w)=>w.z<a.z?w:a);
 return Object.freeze({wheel:-rear.z,r:rear.r,tail:box.min.z,nose:box.max.z,half:Math.max(-box.min.x,box.max.x),height:box.max.y});
}
