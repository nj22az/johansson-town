import * as THREE from '../../vendor/three.module.js';

/**
 * The Halloween things of "The Haunted Vending Machine" (halloween.js puts them on Sakura Street), built of plain
 * rounded shapes in the town's chunky-toy look, no textures, so the film and Studio can build them too: the paper
 * pumpkin lantern, the plastic jack-o'-lantern pail, the obake (a cardboard cut-out or a plush, which can hold a
 * coffee can), Kuro the dog and the cord reel.
 */
export const std=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.7,...o});
export function mesh(parent,geo,mat,x=0,y=0,z=0,name=''){const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);if(name)o.name=name;parent.add(o);return o;}

/** A smiling jack-o'-lantern face (two triangle eyes, a nose, a grin with two teeth), facing +z, about `s` across. */
function pumpkinFace(s){
 const shapes=[];
 const tri=(cx,cy,w,h)=>{const t=new THREE.Shape();t.moveTo(cx-w/2,cy-h/2);t.lineTo(cx+w/2,cy-h/2);t.lineTo(cx,cy+h/2);t.closePath();return t;};
 shapes.push(tri(-.22*s,.12*s,.2*s,.17*s),tri(.22*s,.12*s,.2*s,.17*s),tri(0,-.02*s,.09*s,.08*s));
 const m=new THREE.Shape();const w=.36*s;m.moveTo(-w,-.1*s);
 m.quadraticCurveTo(0,-.42*s,w,-.1*s);m.lineTo(w*.62,-.17*s);m.lineTo(w*.45,-.11*s);m.lineTo(w*.15,-.2*s);m.lineTo(-w*.15,-.2*s);m.lineTo(-w*.45,-.11*s);m.lineTo(-w*.62,-.17*s);m.closePath();
 shapes.push(m);
 return new THREE.ShapeGeometry(shapes,6);
}

/**
 * The glow round a lit lantern: a soft warm halo (one shared radial texture, drawn additively, no light of its own), so a
 * lantern reads as lit at a glance, on a phone too. `halo(size)` is a sprite `size` metres across; its opacity is the
 * glow (setGlow). Built from data, not a canvas, so the film and the tests can build it too.
 */
let haloTexture=null;
function haloMap(){
 if(haloTexture)return haloTexture;
 const n=64,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const dx=(x+.5)/n*2-1,dy=(y+.5)/n*2-1,r=Math.min(1,Math.hypot(dx,dy)),a=Math.pow(1-r,2.2)*(1-r*r*.3),i=(y*n+x)*4;
  data[i]=255;data[i+1]=Math.round(170+60*(1-r));data[i+2]=Math.round(70+90*Math.pow(1-r,3));data[i+3]=Math.round(255*a);}
 haloTexture=new THREE.DataTexture(data,n,n,THREE.RGBAFormat);haloTexture.colorSpace=THREE.SRGBColorSpace;haloTexture.magFilter=THREE.LinearFilter;haloTexture.minFilter=THREE.LinearFilter;haloTexture.needsUpdate=true;
 return haloTexture;
}
export function buildHalo(size,opacity=1){
 const m=new THREE.SpriteMaterial({map:haloMap(),transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
 const s=new THREE.Sprite(m);s.scale.set(size,size,1);s.name='Lantern glow';s.renderOrder=2;s.userData.glowHalo=true;s.raycast=()=>{};return s;
}

/** A sphere's vertex colours, bright at its middle and deeper orange to its top and bottom (a bulb behind paper). */
function glowShade(geo,mid,edge){
 const p=geo.attributes.position,c=new Float32Array(p.count*3),r=geo.parameters?.radius||1,A=new THREE.Color(),B=new THREE.Color(),C=new THREE.Color();
 A.setRGB(...mid,THREE.SRGBColorSpace);B.setRGB(...edge,THREE.SRGBColorSpace);
 for(let i=0;i<p.count;i++){const t=Math.min(1,Math.abs(p.getY(i))/r);C.copy(A).lerp(B,t*t);c[i*3]=C.r;c[i*3+1]=C.g;c[i*3+2]=C.b;}
 geo.setAttribute('color',new THREE.BufferAttribute(c,3));return geo;
}

/**
 * A paper pumpkin lantern (the 1990s party-shop kind: orange paper on a wire frame, a bulb inside): six lobes round a
 * vertical axis, a black cap and a green stem, the face cut on one side. Glows with `glow` (0 dark … 1 at 100 V): lit, the
 * paper is bright orange-yellow, brightest at its middle where the bulb is, the cut face glows pale yellow from inside, and
 * a soft halo hangs round it; dimmed, all three fall together (eased, so a dim lantern still reads as a lantern); unlit
 * (0), plain orange paper with a dark cut face, no halo. Its origin is the hanging point at the top of its cord.
 */
export function buildPumpkinLantern({r=.19}={}){
 const g=new THREE.Group();g.name='Pumpkin lantern';
 const paper=new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true,toneMapped:false}),face=new THREE.MeshBasicMaterial({color:0x3a2410,side:THREE.DoubleSide,toneMapped:false});
 const cy=-.06-r*.85;
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2,lobe=mesh(g,glowShade(new THREE.SphereGeometry(r*.62,14,10),[1,.62,.14],[.88,.3,.02]),paper,Math.cos(a)*r*.42,cy,Math.sin(a)*r*.42);lobe.scale.set(1,1.18,1);}
 mesh(g,new THREE.CylinderGeometry(r*.32,r*.38,r*.16,12),std(0x2a2522),0,cy+r*.78,0,'Pumpkin lantern cap');
 mesh(g,new THREE.CylinderGeometry(r*.06,r*.09,r*.32,8),std(0x4f7a32),0,cy+r*.98,0);
 mesh(g,new THREE.CylinderGeometry(.004,.004,.06,6),std(0x2a2522),0,-.03,0);
 const f=mesh(g,pumpkinFace(r*1.05),face,0,cy-r*.04,r*.99,'Pumpkin lantern face');f.renderOrder=1;
 const halo=buildHalo(r*6.5,0);halo.position.set(0,cy,0);g.add(halo);
 const unlit=new THREE.Color().setRGB(.8,.43,.1,THREE.SRGBColorSpace);
 g.userData.lantern={paper,face,halo,glow:0,setGlow(v){const k=THREE.MathUtils.clamp(v,0,1);this.glow=k;
  // unlit (k=0): orange paper in the daylight and a dark cut face; lit: the paper (its own bright-middle shading), the face
  // and the halo glow with the bulb
  if(k===0){if(paper.vertexColors){paper.vertexColors=false;paper.needsUpdate=true;}paper.color.copy(unlit);face.color.setRGB(.28,.16,.07,THREE.SRGBColorSpace);halo.visible=false;return;}
  if(!paper.vertexColors){paper.vertexColors=true;paper.needsUpdate=true;}
  const l=.3+.7*Math.pow(k,.6);paper.color.setScalar(l);face.color.setRGB(1*Math.min(1,l*1.15),.97*Math.min(1,l*1.15),.72*Math.min(1,l*1.15),THREE.SRGBColorSpace);
  halo.visible=true;halo.material.opacity=.95*Math.pow(k,.85);}};
 g.userData.lantern.setGlow(0);
 return g;
}

/**
 * A plastic jack-o'-lantern (a sweets pail, lit inside by a little torch): solid, ribbed, a carved face, a small glow
 * round it. Origin on the ground: the lobes' bottoms touch y = 0 (they once stood a quarter of r above it, so every pail
 * floated 3 to 4 cm over the pavement, the crates and the bin).
 */
export function buildJackOLantern({r=.16}={}){
 const g=new THREE.Group();g.name='Jack-o’-lantern';
 const skin=new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true,toneMapped:false}),face=new THREE.MeshBasicMaterial({color:0xfff4b0,side:THREE.DoubleSide,toneMapped:false});   // lit from inside: bright skin, a glowing face
 const cy=r*.57;   // the lobes' middle: a lobe is r·0.6 round, squashed to 0.95, so its bottom is on the ground
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2,lobe=mesh(g,glowShade(new THREE.SphereGeometry(r*.6,14,10),[1,.68,.24],[.93,.42,.08]),skin,Math.cos(a)*r*.42,cy,Math.sin(a)*r*.42);lobe.scale.set(1,.95,1);}
 // the stem on the pumpkin's top: on its axis that is between the lobes, 0.41 r above their middle (a lobe r·0.6 round,
 // squashed to 0.95, 0.42 r off the axis), so the stem's foot sits 1 cm into it there instead of 3.6 cm above it
 mesh(g,new THREE.CylinderGeometry(r*.07,r*.1,r*.35,8),std(0x4f7a32),0,cy+r*(.407-.06+.175),0);
 mesh(g,pumpkinFace(r*1.35),face,0,cy,r*.99,'Jack-o’-lantern face');
 const halo=buildHalo(r*4.2,.42);halo.position.set(0,cy+r*.03,0);g.add(halo);
 return g;
}

/**
 * J-Coffee (ジェイコーヒー): the island's own canned black coffee, a made-up brand of Minato Drinks (no real maker). A
 * standard 350 ml can (66 mm across, 122 mm tall, a cola can's shape, not the short 190 ml coffee can), black, with a
 * bold cream "J-COFFEE" under a gold bean mark on its front and "BLACK · 無糖" under it, a big gold J on its back;
 * aluminium rims and a ring-pull top. Origin at its base, standing; its front (the name) faces -z, so rotation.y = π
 * shows it to +z and -π/2 to +x. Lay it on its side with rotation.x.
 * Sold at ¥120 in the town's drinks machines (commerce/vending-catalogue.js 'j-coffee').
 */
export const J_COFFEE_CAN=Object.freeze({diameter:.066,height:.122,colour:'#17130f',ink:'#f3e6c4',gold:'#d9a441'});
let jLabel=null;
/**
 * Paints the J-Coffee can's printed body into a w × h box of a 2D canvas (the label wraps once round the can: its
 * front at u .5, the seam at the back). Shared by the can (buildJCoffeeCan) and the drinks machine's dummy sample
 * (vending.js), so the can in the window and the can in the pocket are the same can.
 */
export function paintJCoffeeLabel(x,w=512,h=256){
 const C=J_COFFEE_CAN,sx=w/512,sy=h/256;
 x.save();x.scale(sx,sy);
 x.fillStyle=C.colour;x.fillRect(0,0,512,256);
 // the front (u .5): the bean mark, the name, a rule and the kind, the name kept within about a third of the way round
 // so it reads whole from in front; the back (the seam): a big gold J, so the can is known from any side
 x.fillStyle=C.gold;x.beginPath();x.ellipse(256,58,26,36,.5,0,Math.PI*2);x.fill();
 x.strokeStyle=C.colour;x.lineWidth=6;x.beginPath();x.moveTo(238,31);x.bezierCurveTo(268,50,242,70,272,88);x.stroke();
 x.fillStyle=C.ink;x.textAlign='center';x.textBaseline='middle';
 x.font='900 50px "Arial Black", Arial, sans-serif';x.fillText('J-COFFEE',256,140,178);
 x.fillRect(176,170,160,5);
 x.font='bold 28px Arial, sans-serif';x.fillText('BLACK · 無糖',256,204,170);
 x.fillStyle=C.gold;x.font='900 150px "Arial Black", Arial, sans-serif';for(const u of [0,512])x.fillText('J',u,138);
 x.restore();
}
function jCoffeeLabel(){
 if(jLabel!==null)return jLabel;jLabel=undefined;
 if(typeof document==='undefined'||!document.createElement)return jLabel;
 const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext?.('2d');if(!x)return jLabel;
 paintJCoffeeLabel(x,512,256);
 jLabel=new THREE.CanvasTexture(c);jLabel.colorSpace=THREE.SRGBColorSpace;jLabel.anisotropy=4;
 return jLabel;
}
export function buildJCoffeeCan(){
 const C=J_COFFEE_CAN,r=C.diameter/2,H=C.height,g=new THREE.Group();g.name='J-Coffee can';
 const map=jCoffeeLabel();
 // the printed body drawn as its own colours (unlit: the town's toon ramp lifts a black surface towards its blue shadow
 // tint, and the can must read black at a glance, day or night); its aluminium rims and top are lit and give it its form
 const body=map?new THREE.MeshBasicMaterial({map}):new THREE.MeshBasicMaterial({color:C.colour});
 const alu=std(0xc9cdd0,{roughness:.3,metalness:.7});
 mesh(g,new THREE.CylinderGeometry(r,r,H*.84,24,1,true),body,0,H*.5,0,'J-Coffee can body');
 mesh(g,new THREE.CylinderGeometry(r*.84,r,H*.08,24),alu,0,H*.96,0,'J-Coffee can shoulder');
 mesh(g,new THREE.CylinderGeometry(r,r*.84,H*.08,24),alu,0,H*.04,0,'J-Coffee can base');
 mesh(g,new THREE.CircleGeometry(r*.84,24).rotateX(-Math.PI/2),alu,0,H+.0005,0);
 mesh(g,new THREE.BoxGeometry(r*.5,.002,r*.3),std(0x9ea3a6,{metalness:.7,roughness:.3}),0,H+.002,r*.25,'Ring pull');
 if(!map)mesh(g,new THREE.CylinderGeometry(r*1.005,r*1.005,H*.18,24,1,true),std(C.ink),0,H*.5,0,'J-Coffee band');
 g.userData.product='j-coffee';
 return g;
}

/**
 * An obake (お化け), the cute paper-and-plush ghost of a Japanese Halloween: a round white head running into a
 * wavy hem, two little arms, dot eyes, rosy cheeks and a small smile. `flat`: a cardboard cut-out (a single shape,
 * for taping to a shutter); else a plush figure. `can`: holding a J-Coffee can in its arms (buildJCoffeeCan, scaled to its arms). Faces +z; origin at its
 * base (the plush) or its middle (the cut-out).
 */
export function buildObake({h=.42,flat=false,can=false}={}){
 const g=new THREE.Group();g.name=flat?'Cardboard ghost':'Plush ghost';
 const white=std(0xfbfaf6,{roughness:.9,side:THREE.DoubleSide}),ink=new THREE.MeshBasicMaterial({color:0x1d1b1a,side:THREE.DoubleSide}),pink=new THREE.MeshBasicMaterial({color:0xf2a3a8,side:THREE.DoubleSide});
 const w=h*.62,R=w/2;
 if(flat){
  const s=new THREE.Shape();s.moveTo(-R,0);s.absarc(0,0,R,Math.PI,0,true);s.lineTo(R,-h*.42);
  for(let i=0;i<4;i++){const x0=R-i*w/4,x1=x0-w/4;s.quadraticCurveTo((x0+x1)/2,-h*.42-h*.12*(i%2?-1:1),x1,-h*.42);}
  s.lineTo(-R,0);
  const arm=(sx)=>{const a=new THREE.Shape();a.moveTo(sx*R*.9,-h*.08);a.quadraticCurveTo(sx*R*1.45,-h*.02,sx*R*1.42,-h*.2);a.quadraticCurveTo(sx*R*1.2,-h*.22,sx*R*.92,-h*.2);a.closePath();return a;};
  mesh(g,new THREE.ShapeGeometry([s,arm(-1),arm(1)],10),white);
  for(const sx of [-1,1]){mesh(g,new THREE.CircleGeometry(h*.045,12),ink,sx*R*.36,h*.02,.002);mesh(g,new THREE.CircleGeometry(h*.07,14),pink,sx*R*.62,-h*.09,.002);}
  const smile=new THREE.Mesh(new THREE.TorusGeometry(h*.05,h*.012,6,12,Math.PI),ink);smile.rotation.z=Math.PI;smile.position.set(0,-h*.05,.003);g.add(smile);
 }else{
  mesh(g,new THREE.SphereGeometry(R,20,14),white,0,h-R,0);
  const pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push(new THREE.Vector2(R*(.98+.18*t),(h-R)*(1-t)));}
  const body=mesh(g,new THREE.LatheGeometry(pts,24),white,0,0,0);void body;
  for(let i=0;i<8;i++){const a=(i+.5)/8*Math.PI*2;mesh(g,new THREE.SphereGeometry(R*.2,10,8),white,Math.cos(a)*R*1.08,R*.08,Math.sin(a)*R*1.08);}
  for(const sx of [-1,1]){const arm=can?mesh(g,new THREE.SphereGeometry(R*.22,10,8),white,sx*R*.42,h*.36,R*1.0):mesh(g,new THREE.SphereGeometry(R*.24,10,8),white,sx*R*.95,h*.42,R*.35);arm.scale.set(1.3,.8,.9);
   mesh(g,new THREE.SphereGeometry(h*.032,10,8),ink,sx*R*.33,h-R*1.02,R*.93);
   const cheek=mesh(g,new THREE.CircleGeometry(h*.05,14),pink,sx*R*.58,h-R*1.3,R*.83);cheek.lookAt(sx*R*2,h-R*1.3,R*3);}
  const smile=new THREE.Mesh(new THREE.TorusGeometry(h*.04,h*.011,6,14,Math.PI),ink);smile.rotation.z=Math.PI;smile.position.set(0,h-R*1.18,R*1.01);g.add(smile);
  if(can){const c=buildJCoffeeCan();const k=(R*.78)/J_COFFEE_CAN.height;c.scale.setScalar(k);c.position.set(0,h*.36-R*.16,R*1.02);c.rotation.y=Math.PI;c.name='J-Coffee can';g.add(c);}
 }
 return g;
}

/**
 * Kuro, the Tamashiros' black dog (a shiba-type with tan points, "who barks at the postman’s Super Cub and nothing
 * else"): built of rounded shapes. pose 'sit' (head up), 'eat' (standing, head down to the ground), 'stand'. Origin
 * on the ground under its chest; faces +z.
 */
export function buildDog({pose='sit'}={}){
 const g=new THREE.Group();g.name='Kuro (dog)';
 const black=std(0x26221f,{roughness:.85}),tan=std(0xc98f55,{roughness:.85}),white=std(0xf1ebe0,{roughness:.85}),nose=std(0x111111);
 const sit=pose==='sit',eat=pose==='eat';
 const body=mesh(g,new THREE.SphereGeometry(.13,16,12),black,0,sit?.2:.27,sit?-.08:-.1);body.scale.set(.9,sit?1.2:.9,sit?1.1:1.7);
 mesh(g,new THREE.SphereGeometry(.085,14,10),white,0,sit?.23:.25,sit?.03:.08).scale.set(.95,1.1,.7);
 const head=new THREE.Group();head.position.set(0,sit?.42:eat?.19:.38,sit?.04:eat?.22:.18);if(eat)head.rotation.x=.7;g.add(head);
 mesh(head,new THREE.SphereGeometry(.085,16,12),black).scale.set(1.05,.95,1);
 const snout=mesh(head,new THREE.SphereGeometry(.05,12,10),tan,0,-.025,.07);snout.scale.set(1,.8,1.1);
 mesh(head,new THREE.SphereGeometry(.016,8,6),nose,0,-.01,.12);
 for(const sx of [-1,1]){const ear=mesh(head,new THREE.ConeGeometry(.032,.07,10),black,sx*.05,.08,-.01);ear.rotation.z=-sx*.25;
  mesh(head,new THREE.SphereGeometry(.012,8,6),nose,sx*.035,.02,.075);mesh(head,new THREE.SphereGeometry(.014,8,6),tan,sx*.04,.045,.065);}
 const legs=sit?[[.06,.07,.08],[-.06,.07,.08]]:[[.06,.1,.08],[-.06,.1,.08],[.06,.1,-.26],[-.06,.1,-.26]];
 for(const [x,y,z] of legs){mesh(g,new THREE.CylinderGeometry(.025,.022,sit?.12:.2,8),black,x,y,z);mesh(g,new THREE.SphereGeometry(.03,8,6),tan,x,.03,z+.01);}
 if(sit)for(const sx of [-1,1])mesh(g,new THREE.SphereGeometry(.07,10,8),black,sx*.08,.07,-.13).scale.set(.8,.6,1.3);
 const tail=mesh(g,new THREE.TorusGeometry(.05,.018,8,14,Math.PI*1.5),black,0,sit?.3:.36,sit?-.24:-.36);tail.rotation.y=Math.PI/2;
 return g;
}

/** The cord reel (コードリール): an orange drum on a grey stand with a handle, four outlets on the hub, the cord half off
 *  it. Origin on the ground under the drum; the drum's axis along x. */
export function buildCordReel(){
 const g=new THREE.Group();g.name='Cord reel';
 const orange=std(0xe8742a,{roughness:.5}),grey=std(0x6d7276,{roughness:.5,metalness:.3}),cord=std(0x3d3f42,{roughness:.6}),hub=std(0xf1ede4,{roughness:.5});
 for(const sx of [-1,1])mesh(g,new THREE.CylinderGeometry(.16,.16,.015,24).rotateZ(Math.PI/2),orange,sx*.075,.2,0);
 mesh(g,new THREE.CylinderGeometry(.11,.11,.14,24).rotateZ(Math.PI/2),cord,0,.2,0,'Cord reel coil');   // the half coil still on it
 const face=mesh(g,new THREE.CylinderGeometry(.075,.075,.03,20).rotateZ(Math.PI/2),hub,.093,.2,0,'Cord reel outlets');void face;
 for(const [y,z] of [[.03,.03],[.03,-.03],[-.03,.03],[-.03,-.03]])mesh(g,new THREE.BoxGeometry(.004,.014,.004),std(0x222222),.11,.2+y,z);
 for(const sx of [-1,1]){const leg=mesh(g,new THREE.BoxGeometry(.02,.28,.02),grey,sx*.1,.14,0);void leg;mesh(g,new THREE.BoxGeometry(.02,.02,.22),grey,sx*.1,.01,0);}
 mesh(g,new THREE.CylinderGeometry(.012,.012,.22,8).rotateZ(Math.PI/2),grey,0,.38,0);
 // the label a real reel carries: the coiled rating
 mesh(g,new THREE.PlaneGeometry(.06,.035),std(0xf5e86a),-.084,.27,.01).rotation.y=-Math.PI/2;
 return g;
}

