import * as THREE from '../../vendor/three.module.js';

/**
 * Minato's patrol car: a 1990s kei patrol car (軽パトカー) in the town's chunky-toy style, built into a street kit
 * (okinawa/kit.js) in the kit's current frame, front along +z, width along x, wheels on the ground at y 0.
 *
 * The owner, 20 October 2026, from the police yard on his phone: "The police car needs to look prettier." What makes it
 * read at a glance, from a phone's height over the yard: the two-tone 白黒 livery (black below the waist and on the
 * bonnet, white doors-up and roof), a proper glasshouse with its A, B and C pillars, the red light bar on the roof,
 * round-edged panels, wheels in their arches, bumpers, square headlamps, door mirrors, the yellow kei number plates and
 * 沖縄県警察 on the front doors. A kei car is 3.39 × 1.47 m (the 1990 kei rules, 3.4 × 1.48 m) and about 1.5 m tall to
 * the roof; the light bar puts it at 1.75 m. No maker's badge: the town's car is nobody's model.
 *
 * Panels are extruded side profiles with rounded (bevelled) edges, one geometry per colour, merged by the kit with the
 * rest of the station: about 1,850 triangles for the whole car.
 */
export const PATROL_CAR=Object.freeze({
 length:3.39,width:1.47,height:1.75,
 /** Half the wheelbase and the wheel's radius: 145/80 R12 tyres, a 2.24 m wheelbase. */
 axle:1.12,wheel:.27,
 /** Door mirrors stand 4 cm out from the body each side. */
 mirrors:.04,
});

const C=Object.freeze({black:0x17191d,white:0xf4f3ee,glass:0x2f3e4a,trim:0x3c3f44,tyre:0x1c1c20,hub:0xc9cdcf,
 red:0xd22a24,lamp:0xf3efd8,amber:0xe8a33a,tail:0xb52a26,liner:0x101114});

/**
 * A side profile [[z,y],…], extruded `width` across with rounded (bevelled) edges. With `arches`, the profile's first two
 * points are its rear and front bottom corners, and each arch is cut up into the bottom edge between them.
 */
function profileSlab(kit,outline,width,colour,{bevel=.03,finish='gloss',arches=[]}={}){
 const [[z0,y0],[z1,y1],...rest]=outline,shape=new THREE.Shape();shape.moveTo(z0,y0);
 for(const {z,y,r} of [...arches].sort((a,b)=>a.z-b.z)){shape.lineTo(z-r,y0);shape.absarc(z,y,r,Math.PI,0,true);shape.lineTo(z+r,y0);}
 shape.lineTo(z1,y1);for(const [z,y] of rest)shape.lineTo(z,y);
 addSlab(kit,shape,width,colour,bevel,finish);
}
function addSlab(kit,shape,width,colour,bevel,finish){
 const depth=width-2*bevel;
 const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel*.8,bevelOffset:-bevel*.8,bevelSegments:2,curveSegments:6});
 // Shape x → car z, shape y → car y, the extrusion → car x, centred (a proper rotation, so the faces stay outward).
 const m=new THREE.Matrix4().set(0,0,-1,depth/2, 0,1,0,0, 1,0,0,0, 0,0,0,1);
 kit.add(g,m,colour,finish);g.dispose();
}

/**
 * @param kit the street kit, already in the car's frame (front along +z)
 * @param {object} o
 * @param {THREE.Texture} [o.door] the door panel lettering (沖縄県警察), drawn on a canvas by the caller
 * @param {THREE.Texture} [o.plate] the yellow kei number plate
 */
export function buildPatrolCar(kit,{door=null,plate=null}={}){
 const P=PATROL_CAR,L=P.length/2,W=P.width/2,ax=P.axle,R=P.wheel,arch=R+.06;
 const arches=[{z:-ax,y:R,r:arch},{z:ax,y:R,r:arch}];
 // ── Body: black below the waist and over the bonnet; white doors-up, pillars and roof. ──
 const waist=.66,belt=.9,screen=.76;   // the black/white line, the window line, and where the windscreen meets the bonnet
 profileSlab(kit,[[-L+.04,.2],[L-.04,.2],[L,.3],[L,.56],[L-.08,.7],[screen,belt-.02],[screen-.04,waist],[-L+.02,waist],[-L,.56],[-L,.3]],P.width,C.black,{arches});
 // The white band, doors and rear quarters from the waist to the window line.
 profileSlab(kit,[[-L+.02,waist],[screen-.02,waist],[screen-.02,belt],[-L+.04,belt]],P.width,C.white,{bevel:.025});
 // The glasshouse: tumblehome narrower than the body, the windscreen raked, the hatch nearly upright.
 const cabin=1.3,roof=1.5,front=[screen,belt],top=[.02,roof],back=[-L+.16,roof-.02];
 profileSlab(kit,[[-L+.05,belt],front,top,back,[-L+.03,roof-.12]],cabin,C.white,{bevel:.05});
 // ── Glass: side windows either side of the B pillar, the windscreen and the hatch glass. ──
 // Each pane is a flat shape drawn in (-s·z, y), so that mapped back to the car (a proper rotation) its face looks out.
 const side=cabin/2+.004,sideGlass=(pts)=>{for(const s of [-1,1]){const shape=new THREE.Shape();pts.forEach(([z,y],i)=>i?shape.lineTo(-s*z,y):shape.moveTo(-s*z,y));
  const g=new THREE.ShapeGeometry(shape);const m=new THREE.Matrix4().set(0,0,s,s*side, 0,1,0,0, -s,0,0,0, 0,0,0,1);kit.add(g,m,C.glass,'gloss');g.dispose();}};
 // The windscreen line runs from (screen, belt) to (top): its z at a height y.
 const screenAt=y=>front[0]+(top[0]-front[0])*(y-front[1])/(top[1]-front[1]);
 const g0=belt+.07,g1=roof-.09;
 sideGlass([[-.3,g0],[screenAt(g0)-.1,g0],[screenAt(g1)-.06,g1],[-.3,g1]]);
 sideGlass([[-L+.3,g0],[-.4,g0],[-.4,g1],[-L+.34,g1]]);
 {const dz=top[0]-front[0],dy=top[1]-front[1],len=Math.hypot(dz,dy),nz=dy/len,ny=-dz/len,mid=[(front[0]+top[0])/2,(front[1]+top[1])/2];
  kit.box(cabin-.2,len-.16,.012,0,mid[1]+ny*.02,mid[0]+nz*.02,C.glass,{rx:Math.atan2(dz,dy),finish:'gloss'});}
 kit.box(cabin-.26,.4,.012,0,belt+.28,-L+.01,C.glass,{finish:'gloss'});
 // ── The light bar: a black base on two feet, red lenses either end, the speaker in the middle. ──
 for(const z of [-.18,.18])kit.box(.9,.04,.06,0,roof+.03,z-.25,C.trim);
 kit.box(1.04,.06,.26,0,roof+.08,-.25,C.black,{finish:'gloss'});
 for(const s of [-1,1]){kit.cyl(.078,.078,.4,s*.28,roof+.16,-.25,C.red,{rz:Math.PI/2,segments:10,finish:'gloss'});kit.sphere(.078,s*.48,roof+.16,-.25,C.red,{sx:.5,finish:'gloss'});}
 kit.box(.14,.12,.18,0,roof+.15,-.25,C.white,{finish:'gloss'});
 // ── Bumpers, grille, lamps. ──
 // The bumpers stand a centimetre proud of the body's ends, their rubber strip proud of them: flush, they flashed.
 for(const s of [-1,1]){kit.box(P.width-.08,.15,.1,0,.31,s*(L-.04),C.trim,{finish:'gloss'});kit.box(P.width-.14,.05,.03,0,.31,s*(L+.004),0x55595e);}
 kit.box(.5,.1,.02,0,.58,L-.002,C.liner);
 for(const s of [-1,1]){
  kit.box(.27,.12,.03,s*.47,.6,L-.01,C.lamp,{finish:'gloss'});kit.box(.11,.05,.025,s*.62,.46,L-.01,C.amber,{finish:'gloss'});
  kit.box(.1,.24,.03,s*.6,.72,-L+.01,C.tail,{finish:'gloss'});kit.box(.1,.06,.03,s*.6,.56,-L+.01,C.amber,{finish:'gloss'});
 }
 // ── Mirrors on the doors, by the windscreen pillar. ──
 for(const s of [-1,1]){kit.rod([s*(cabin/2-.01),belt+.02,screen-.12],[s*(W+.02),belt+.08,screen-.16],.012,C.black);kit.box(.06,.08,.11,s*(W+P.mirrors-.03),belt+.1,screen-.17,C.black,{finish:'gloss'});}
 // ── Door seams and handles, so the doors read as doors. ──
 for(const s of [-1,1]){
  for(const z of [screen-.06,-.34,-L+.32])kit.box(.006,belt-.24,.012,s*(W+.001),(belt+.24)/2,z,C.trim);
  for(const z of [-.12,-.62])kit.box(.008,.025,.1,s*(W+.002),belt-.06,z,C.trim,{finish:'metal'});
 }
 // ── Wheels in their arches, with liners so the arch does not show the street through the car. ──
 for(const z of [-ax,ax]){
  kit.box(P.width-.38,arch*.95,arch*2-.04,0,R+arch*.45,z,C.liner);
  for(const s of [-1,1]){
   kit.cyl(R,R,.16,s*(W-.1),R,z,C.tyre,{rz:Math.PI/2,segments:16});
   kit.cyl(.15,.15,.02,s*(W-.015),R,z,C.hub,{rz:Math.PI/2,segments:12,finish:'metal'});
   kit.cyl(.045,.045,.025,s*(W-.005),R,z,C.trim,{rz:Math.PI/2,segments:8});
  }
 }
 // ── The doors' lettering and the plates. ──
 if(door)for(const s of [-1,1])kit.sign(door,.58,.15,s*(W+.004),(waist+belt)/2,.2,{ry:s*Math.PI/2,depth:.004,name:'Patrol car door panel',edge:C.white});
 if(plate){kit.sign(plate,.33,.165,0,.33,L+.022,{depth:.006,name:'Patrol car number plate',edge:0xd8b52c});kit.sign(plate,.33,.165,0,.5,-L-.022,{ry:Math.PI,depth:.006,name:'Patrol car number plate',edge:0xd8b52c});}
}
