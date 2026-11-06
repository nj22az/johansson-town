import * as THREE from '../../../vendor/three.module.js';
import {rng} from './kit.js';

/**
 * Street furniture, after Sakura Crossing's props.js (Kenton-GMI, MIT; see
 * LICENSE-SAKURA-CROSSING.txt): the utility pole with its crossarms, insulators and
 * transformer cans, the sagging cables strung between them, and household tools, rebuilt
 * for the kit so that a whole street of them is a few draw calls. The rest -- bicycles,
 * laundry, gas bottles, fish crates, buoys, a sabani -- are the things an Okinawan
 * harbour street is cluttered with.
 */

/**
 * The town's poles and wires are planned before they are drawn. While a plan is open,
 * utilityPole only measures (its anchors and collider are real, its geometry is not) and
 * wiresBetween only records the span; town-power.js then thins the network, leaves out
 * any wire that would pass through a building or a tree, and draws the lot as one mesh.
 */
let plan=null;
export const beginPowerPlan=()=>{plan={poles:[],spans:[],drops:[]};};
export const takePowerPlan=()=>{const p=plan;plan=null;return p;};
const measuring=kit=>({...kit,box(){},cyl(){},rod(){}});

export function utilityPole(kit,x,z,{h=9.8,face=0,transformer=true,lamp=false,guy=false,tel=true,seed=1}={}){
 const planning=!!plan,real=kit;kit=planning?measuring(kit):kit;
 h=Math.max(9.8,h);
 const r=rng(seed),anchors=[];let origin,east,lampAt=null;
 const concrete=0xc9c5bc,steel=0x8e979a,porcelain=0xf2f0ea,black=0x2b2a30;
 kit.at(x,z,face,()=>{
  origin=kit.point(0,0,0);east=kit.point(1,0,0);
  // Tapered shaft in three courses (a pole is spun concrete, not a cylinder), base, cap.
  kit.cyl(.12,.15,h*.5,0,h*.75,0,concrete,{segments:7});
  kit.cyl(.15,.18,h*.5,0,h*.25,0,concrete,{segments:7});
  kit.cyl(.13,.13,.08,0,h+.04,0,0xb7b2a8,{segments:7});
  kit.cyl(.24,.26,.22,0,.11,0,0xb7b2a8,{segments:7});
  // High voltage: the crossarm, its two braces, three pin insulators.
  const hv=h-.45;
  kit.box(2.1,.1,.1,0,hv,0,0x6f7579);
  for(const s of [-1,1])kit.rod([0,hv-.55,0],[s*.7,hv-.03,0],.025,steel);
  for(const i of [-1,0,1]){
   kit.cyl(.06,.085,.18,i*.9,hv+.14,0,porcelain,{segments:6});
   kit.cyl(.09,.09,.04,i*.9,hv+.1,0,porcelain,{segments:8});
   anchors.push(kit.point(i*.9,hv+.22,0));
  }
  // Transformer: two cans on a bracket, each with a cutout fuse on the arm above.
  if(transformer){
   const ty=h-2.6;
   kit.box(.12,.12,1.3,0,ty+.95,.25,steel);
   for(const dx of [-.42,.42]){
    kit.cyl(.24,.24,.78,dx,ty+.25,.42,0x9aa3a6,{segments:8});
    kit.cyl(.26,.26,.05,dx,ty+.66,.42,0x7d8588,{segments:8});
    for(const b of [-.09,.09])kit.cyl(.03,.03,.16,dx+b,ty+.76,.42,porcelain,{segments:6});
    kit.box(.07,.34,.07,dx,hv-.5,.18,0x5b6164);
    kit.rod([dx,hv-.32,.18],[dx*.5,hv+.18,0],.008,black);
    kit.rod([dx+.09,ty+.82,.42],[dx,hv-.66,.18],.008,black);
   }
  }
  // Low voltage: three spool insulators racked up the side facing the street.
  const lv=h-3.55;
  kit.box(.06,.95,.08,0,lv,.16,steel);
  for(const k of [0,1,2]){const y=lv+.35-k*.35;kit.cyl(.065,.065,.12,0,y,.27,porcelain,{segments:8,rx:Math.PI/2});}
  // Telephone: one thick black cable lower down, with its closure box.
  // (Left off where the street side is lined with trees: anchors[3] stays empty.)
  if(tel){
   const y=h-4.15;
   kit.box(.05,.05,.35,0,y,.18,steel);
   kit.box(.3,.22,.18,.22,y-.35,.2,0x9ba1a3);
   anchors.push(kit.point(0,y,.36));
  }else anchors.push(null);
  for(const k of [0,1,2])anchors.push(kit.point(0,lv+.35-k*.35,.34));
  // The riser cable, step bolts, plate and foot guard.
  kit.cyl(.035,.035,h-1.8,-.16,(h-1.8)/2,.05,black,{segments:5});
  for(let y=2.4,i=0;y<h-.8;y+=.9,i++)kit.box(.22,.025,.025,i%2?.18:-.18,y,0,0x9aa2a6,{ry:i%2?0:Math.PI});
  kit.box(.2,.34,.03,0,2.1,.16,0xe8e3d4);
  kit.box(.16,.06,.04,0,2.2,.17,0x2b4a7a);
  kit.cyl(.19,.19,1.6,0,.8,0,0xe0b93a,{segments:7});
  for(let y=.2;y<1.6;y+=.4)kit.cyl(.205,.205,.18,0,y,0,0x2b2b2b,{segments:7});
  if(guy){
   const foot=[0,0,-3.2];
   kit.rod([0,h-1.2,0],foot,.012,0x6f7579);
   kit.rod([0,.1,-2.85],[0,2.2,-2.85+.62],.05,0xe0b93a);
   kit.box(.3,.12,.3,...foot,0x8e8a80);
  }
  if(lamp){
   kit.rod([0,h-5.3,0],[0,h-5.6,1.3],.04,steel);
   kit.box(.36,.12,.5,0,h-5.65,1.35,steel);
   kit.box(.3,.03,.42,0,h-5.72,1.35,0xfff0c8,{finish:'lamp'});
   lampAt=kit.point(0,h-5.72,1.35);
  }
 });
 const foot=kit.point(x,0,z),pole={id:`pole:${foot.x.toFixed(2)}:${foot.z.toFixed(2)}`,x:foot.x,z:foot.z,y:foot.y,anchors,top:h,collider:kit.rect(x-.2,x+.2,z-.2,z+.2,h,'utility-pole'),seed:r.next(),
  // The lamp's head in the world, for the pool of light under it (town.js lampPools); null on a pole without one.
  lamp:lampAt?{x:lampAt.x,y:lampAt.y,z:lampAt.z}:null};
 if(planning){pole.place={x:origin.x,y:origin.y,z:origin.z,face:Math.atan2(-(east.z-origin.z),east.x-origin.x),h,transformer,lamp,guy,tel,seed};plan.poles.push(pole);}
 else real.powerNode(pole);
 return pole;
}

/** Draws a planned pole into another kit, where it stood in the world. */
export function drawPlannedPole(kit,{place:{x,y,z,face,h,transformer,lamp,guy,tel,seed}}){
 let pole;kit.at(0,0,0,()=>{pole=utilityPole(kit,x,z,{h,face,transformer,lamp,guy,tel,seed});},y);return pole;
}

/** Cables from each anchor of one pole to the matching anchor of the next. */
export function wiresBetween(kit,a,b,{sag=.45}={}){
 if(plan){plan.spans.push({a,b,sag});return;}
 kit.powerSpan(a,b);
 for(const i of SPAN_WIRES)if(a.anchors[i]&&b.anchors[i])kit.wire(...spanWire(a,b,i,sag));
}
/**
 * Three high-voltage lines and one telephone cable per span: the low-voltage spools stay
 * on the pole but are not strung, because seven wires a span read as a tangle.
 */
export const SPAN_WIRES=[0,1,2,3];
export const spanWire=(a,b,i,sag)=>[a.anchors[i].toArray(),b.anchors[i].toArray(),i<3?sag*.7:sag*1.5,i===3?.034:.016,0x2b2a30];

/** A cable from a pole down to the eave of a house: the service drop. */
export function serviceDrop(kit,pole,to){if(plan){plan.drops.push({pole,to});return;}kit.wire(pole.anchors[pole.anchors.length-1].toArray(),to,.25,.014,0x2b2a30);}

/** A parked bicycle on its centre stand, front along local +x: the town's one model (parked-bicycle.js). */
export {bicycle,PARKED_BICYCLE} from './parked-bicycle.js';

/** A laundry pole on two stands, with the day's washing on it. */
export function laundry(kit,x,z,{ry=0,seed=10,length=2.6}={}){
 const r=rng(seed),cloth=[0xf4f1ea,0x7fb0d8,0xe8a0a8,0xf1d27a,0x9fc79a,0xffffff];
 kit.at(x,z,ry,()=>{
  for(const s of [-1,1]){kit.rod([s*length/2,0,-.35],[s*length/2,1.7,0],.025,0x9aa0a4);kit.rod([s*length/2,0,.35],[s*length/2,1.7,0],.025,0x9aa0a4);}
  kit.rod([-length/2-.2,1.7,0],[length/2+.2,1.7,0],.02,0xd0d4d6);
  for(let i=0;i<Math.floor(length/.45);i++){
   const x0=-length/2+.25+i*.45,h=.45+r.next()*.4;
   kit.box(.38,h,.015,x0,1.68-h/2,0,r.pick(cloth),{finish:'thin'});
  }
 });
 let solid;kit.at(x,z,ry,()=>{solid=kit.rect(-length/2-.2,length/2+.2,-.4,.4,1.8,'laundry');});
 return solid;
}

/** Two propane bottles against a wall, with their regulator hose. */
export function gasBottles(kit,x,z,{ry=0}={}){
 kit.at(x,z,ry,()=>{
  for(const dx of [-.22,.22]){
   kit.cyl(.17,.17,1.05,dx,.53,0,0x9aa2a6,{segments:10,finish:'metal'});
   kit.sphere(.17,dx,1.06,0,0x9aa2a6,{sy:.5,finish:'metal'});
   kit.cyl(.05,.05,.12,dx,1.2,0,0x3c4448,{segments:6});
  }
  kit.rod([-.22,1.24,0],[0,1.5,-.12],.012,0x2b2b2b);kit.rod([.22,1.24,0],[0,1.5,-.12],.012,0x2b2b2b);
 });
 let solid;kit.at(x,z,ry,()=>{solid=kit.rect(-.42,.42,-.2,.2,1.3,'gas-bottles');});
 return solid;
}

/** The blue plastic fish crates a harbour street has everywhere, stacked; `y` is what they stand on. */
export function fishCrates(kit,x,z,{ry=0,rows=2,cols=2,height=3,seed=11,y=0}={}){
 const r=rng(seed);
 kit.at(x,z,ry,()=>{
  for(let c=0;c<cols;c++)for(let q=0;q<rows;q++){
   const n=1+Math.floor(r.next()*height);
   for(let k=0;k<n;k++)kit.box(.62,.26,.42,c*.66,y+.13+k*.27,q*.46,k%2?0x2f6fb8:0x3a7cc2);
  }
 });
 let solid;kit.at(x,z,ry,()=>{solid=kit.rect(-.35,cols*.66-.3,-.25,rows*.46-.2,1,'fish-crates');});
 return solid;
}

/** Glass and plastic fishing floats in a net, hung or heaped. */
export function buoys(kit,x,y,z,{seed=12,count=7}={}){
 const r=rng(seed);
 for(let i=0;i<count;i++)kit.sphere(.16+r.next()*.08,x+(r.next()-.5)*.7,y+(r.next())*.35,z+(r.next()-.5)*.5,r.pick([0xe8742a,0xf0a030,0x5aa0a8,0xeeeeea]),{finish:'gloss'});
}

/** A heap of green nylon net. */
export function netPile(kit,x,z,{size=1}={}){
 kit.sphere(.8*size,x,.25*size,z,0x2f5a4a,{sx:1.4,sy:.45});
 kit.sphere(.55*size,x+.4*size,.45*size,z-.2,0x3a6a55,{sx:1.2,sy:.5});
 buoys(kit,x-.3,.3,z+.3,{count:4});
}

/** A sabani: the island's narrow fishing boat, up on blocks. Bow along local +x. */
export function sabani(kit,x,z,{ry=0,y=.5,colour=0x3c6f8a}={}){
 kit.at(x,z,ry,()=>{
  const shape=[[-2.6,.1],[2.4,.1],[3,.55],[2.8,.62],[-2.6,.55]];
  for(const s of [-1,1])kit.extrude(shape,.05,new THREE.Matrix4().makeTranslation(0,y,s*.38-(s>0?.05:0)),colour);
  kit.box(5.1,.06,.72,-.1,y+.1,0,0x8a6a4a);
  kit.box(5,.08,.08,-.1,y+.6,-.4,0xf2ede0);kit.box(5,.08,.08,-.1,y+.6,.4,0xf2ede0);
  for(const bx of [-1.4,.1,1.4])kit.box(.1,.08,.8,bx,y+.45,0,0x8a6a4a);
  for(const bx of [-1.6,1.4])kit.box(.5,y,.9,bx,y/2,0,0x7a756c);
  kit.box(.8,.15,.05,-.9,y+.3,.42,0xf0d27a);
 });
 let solid;kit.at(x,z,ry,()=>{solid=kit.rect(-2.9,3.1,-.45,.45,1.2,'sabani');});
 return solid;
}

/** Styrofoam fish boxes reused as planters, with greens and a tomato or two. */
export function planterBoxes(kit,x,z,{ry=0,count=3,seed=13}={}){
 const r=rng(seed);
 kit.at(x,z,ry,()=>{
  for(let i=0;i<count;i++){
   const px=i*.72;
   kit.box(.62,.3,.4,px,.15,0,0xf1efe8);
   kit.sphere(.26,px,.42,0,r.pick([0x5b8a45,0x6e9a4c,0x4d7a3e]),{sx:1.1,sy:.6});
   if(r.next()>.5)kit.sphere(.05,px+.1,.52,.08,0xd9412b,{detail:0});
  }
 });
 let solid;kit.at(x,z,ry,()=>{solid=kit.rect(-.35,count*.72-.35,-.22,.22,.5,'planters');});
 return solid;
}

/**
 * An inshore fishing boat, white with a coloured sheer stripe, a wheelhouse aft and a
 * mast with its lamps, lying in the water. Bow along local +x.
 */
export function fishingBoat(kit,x,z,{ry=0,y=-.55,colour=0x2f6fb8,length=8,name=''}={}){
 const L=length,B=2.3;
 kit.at(x,z,ry,()=>{
  const half=L/2,stations=[[-half,.78],[-half+.65,1.02],[0,1.15],[half-1.1,.8],[half+.3,.025]],vertices=[],indices=[];
  // A closed hull with a pointed bow and a submerged keel, rather than two flat side plates.
  for(const [sx,beam] of stations)for(const [by,bz] of [[1,1],[.25,1],[-.45,.55],[-.65,0],[-.45,-.55],[.25,-1],[1,-1]])vertices.push(sx,y+by,beam*bz);
  for(let i=0;i<stations.length-1;i++)for(let k=0;k<7;k++){const a=i*7+k,b=i*7+(k+1)%7;indices.push(a,b,a+7,b,b+7,a+7);}
  for(const i of [0,stations.length-1])for(let k=1;k<6;k++)indices.push(i*7,i*7+k,i*7+k+1);
  const hull=new THREE.BufferGeometry();hull.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));hull.setIndex(indices);hull.computeVertexNormals();kit.add(hull,new THREE.Matrix4(),0xe0dfd3,'thin');hull.dispose();
  kit.box(L-1.3,.1,B-.25,-.5,y+.62,0,0x9a9686);
  for(const s of [-1,1]){
   for(let i=1;i<stations.length;i++){const a=stations[i-1],b=stations[i];kit.rod([a[0],y+.99,s*a[1]],[b[0],y+.99,s*b[1]],.075,colour);}
   for(let i=0;i<4;i++){const bx=-half+1.2+i*(L-2.5)/4;kit.rod([bx,y+1,s*1.05],[bx,y+1.5,s*1.05],.018,0x7b888b);}
   kit.rod([-half+1.2,y+1.5,s*1.05],[half-1.2,y+1.5,s*.8],.018,0x7b888b);
  }
  // Wheelhouse, its windows, the mast and the lamps.
  kit.box(1.8,1.5,1.7,-half+1.8,y+1.35,0,0xf1efe8);
  kit.box(1.95,.1,1.85,-half+1.8,y+2.12,0,colour);
  kit.box(.06,.5,1.3,-half+2.72,y+1.55,0,0x2e3c44,{finish:'gloss'});
  for(const s of [-1,1])kit.box(1.2,.45,.05,-half+1.8,y+1.55,s*.86,0x2e3c44,{finish:'gloss'});
  kit.cyl(.05,.07,3.6,-half+2,y+3.9,0,0xd8d6cf,{segments:6});
  kit.rod([-half+2,y+4.6,0],[half-.4,y+.95,0],.012,0x3a3a3a);
  kit.rod([-half+2,y+4.6,0],[-half+.2,y+1,0],.012,0x3a3a3a);
  kit.box(.12,.12,.12,-half+2,y+5.1,0,0xfff0c8,{finish:'lamp'});
  kit.box(.04,.52,1.3,-half+2.76,y+1.55,0,0xc5ccca);
  for(const z of [-.43,.43])kit.box(.08,.52,.035,-half+2.77,y+1.55,z,0x2e3c44);
  // Fenders along the side it lies to, and a heap of gear on the deck.
  for(let i=0;i<4;i++)kit.cyl(.22,.22,.45,-half+1.5+i*1.6,y+.55,B/2+.18,0x222326,{segments:8});
  kit.box(1.2,.5,.9,.8,y+.9,0,0x2f6fb8);
  kit.sphere(.25,1.8,y+.9,.4,0xe8742a,{finish:'gloss'});
 });
}
