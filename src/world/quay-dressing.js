import {createBoatKit} from './harbour-boats.js';
import {OUTER_PIER} from './layout.js';

/**
 * The working dressing of Minato's main quay, the outer pier's root and the Nishi-machi quay beside them: what a port of 1997 has on its
 * concrete because somebody uses it, each item with its reason. Data first, so the tests and the stories can ask
 * where things are and why; `buildQuayDressing` draws it in a handful of merged meshes.
 *
 * World frame: x east, z north; the main quay's seaward face is at z −49.975, its top at −0.016 (harbour.js), its
 * kerb from z −49.555 to −49.005 with its top at 0.28. The Nishi quay's face is at z −49.95 (okinawa/quarters.js).
 */
export const MAIN_QUAY_FACE=-49.975,NISHI_QUAY_FACE=-49.95;
const TOP=-.016;

export const QUAY_DRESSING=Object.freeze({
 /** Tyres hung on chains down the face: what a boat's side rests against. */
 tyres:Object.freeze([
  ...[-14,0,7].map(x=>Object.freeze({x,face:MAIN_QUAY_FACE,why:'for the island boats and the harbour launch to lie against'})),
  // The fishing boat (minato-berth.js QUAY_FISHING_BOAT, x 13.5–19.8) lies on these two.
  ...[14,17.6].map(x=>Object.freeze({x,face:MAIN_QUAY_FACE,why:'the fishing boat alongside lies on it'})),
  // The Nishi quay, where boats lie under the freight hoist (docklands-life.js, x −33.2) to be worked.
  ...[-31.4,-35].map(x=>Object.freeze({x,face:NISHI_QUAY_FACE,why:'boats lie here under the freight hoist'})),
 ]),
 /**
  * The cargo staging bay: what the island cargo boat landed this morning (harbour-boats.js CARGO_BOAT_LOOK.load),
  * waiting on pallets for the vans, on the outer pier's east side beside her berth, between the pier's root and her
  * head line's bitt (minato-berth.js CARGO_BERTH). Not on the quay: the walks round the port building and the auction
  * shed (architecture-plan.js) keep the whole quay edge open. Painted out in yellow, with its sign.
  */
 staging:Object.freeze({minX:1.5,maxX:3.45,minZ:-52.6,maxZ:-50.05,
  sign:Object.freeze({x:1.62,z:-50.2,jp:'荷さばき場',sub:'駐車禁止',why:'cargo handling area, no parking'}),
  pallets:Object.freeze([
   Object.freeze({id:'sakura-cartons',x:2.8,z:-50.75,why:'cartons of shop stock for Sakura Trading’s depot in the Quay Warehouse'}),
   Object.freeze({id:'higa-crates',x:2.8,z:-51.95,why:'Umineko crates off the boat for Sakura Trading’s depot, whose round takes them to the bars (Higa Liquor’s van did, until the shop closed)'}),
  ]),
  truck:Object.freeze({x:1.92,z:-51.45,why:'Riku’s hand pallet truck, that brought them off her deck'}),
 }),
 /**
  * The fuel point by the fishing boat's bow: the co-op's diesel line (軽油, light oil) ends in a locked steel box on the
  * kerb, its hose on a reel beside it, so a boat alongside fills straight from the quay edge.
  */
 fuel:Object.freeze({x:18.2,z:-49.3,sign:Object.freeze({jp:'給油所',sub:'火気厳禁'}),why:'the boats fill with diesel here'}),
 /** Drainage slots through the kerb every few metres, and the stain each leaves down the face; none across the pier's
  *  root, where the kerb is cut away (harbour.js), the one by it on the short length between the ramp and the pier. */
 scuppers:Object.freeze([-17.5,-13,-4.9,6,10.5,16].map(x=>Object.freeze({x}))),
});

const PIER_TOP=OUTER_PIER.height,KERB_TOP=.28;
/** Footprints of everything solid, for colliders and the walking tests (`outerPier`: standing on the pier's deck). */
export function quayDressingSolids(){
 const D=QUAY_DRESSING,S=D.staging,out=[];
 for(const p of S.pallets)out.push({id:'quay-pallet-'+p.id,x:p.x,z:p.z,w:1.15,d:1.15,height:PIER_TOP+1.25,outerPier:true});
 out.push({id:'quay-pallet-truck',x:S.truck.x,z:S.truck.z+.1,w:.55,d:1.15,height:PIER_TOP+1.15,outerPier:true});
 out.push({id:'quay-sign-staging',x:S.sign.x,z:S.sign.z,w:.18,d:.18,height:PIER_TOP+2,outerPier:true});
 out.push({id:'quay-fuel-box',x:D.fuel.x,z:D.fuel.z,w:.75,d:.36,height:1,kerb:true});
 return out;
}

/**
 * Draws the dressing into `parent`; `label(text, sub, position, width, height, angle, bg, fg)` is harbour.js's sign
 * painter. Returns {group, colliders, puddles} (puddles: where rain lies by the scuppers, for harbour.js puddle()).
 */
export function buildQuayDressing({parent,label,shadows=false}){
 const kit=createBoatKit('Quay dressing'),D=QUAY_DRESSING,S=D.staging;
 const iron=0x2b2f30,rust=0x9a5a36,rubber=0x1f2324,galv=0x8d9493,yellow=0xe0b93a;
 // Tyres: a lorry tyre on two chains from ringbolts in the coping, its tread against the face, top below the coping.
 for(const t of D.tyres){
  const z=t.face-.1,y=-.27;kit.torus(.31,.1,t.x,y,z,rubber,'rubber',{radial:5,tubular:12});
  for(const dx of [-.22,.22]){kit.rod([t.x+dx,.16,t.face-.02],[t.x+dx*.8,y+.24,z],.013,galv,'metal');kit.box(.06,.06,.05,t.x+dx,.13,t.face-.02,iron,'metal');}
  // Rust weeping from the ringbolts down the concrete.
  kit.streak(t.x+.22,.02,t.face-.004,.04,.22,rust,'-z');
 }
 // Scuppers: a dark slot through the kerb at its foot, and the green-black stain down the face below each.
 for(const s of D.scuppers){kit.box(.32,.07,.57,s.x,.135,-49.28,0x23282a);kit.streak(s.x,-.06,MAIN_QUAY_FACE-.004,.3,.42,0x4a5248,'-z');}
 // The staging bay on the pier: yellow lines, the two pallets with their loads, the pallet truck, the sign on its post.
 const T=PIER_TOP,line=(x0,x1,z0,z1)=>kit.streak((x0+x1)/2,T+.004,(z0+z1)/2,x1-x0,z1-z0,yellow,'y');
 line(S.minX,S.maxX,S.minZ,S.minZ+.08);line(S.minX,S.maxX,S.maxZ-.08,S.maxZ);line(S.minX,S.minX+.08,S.minZ+.08,S.maxZ-.08);line(S.maxX-.08,S.maxX,S.minZ+.08,S.maxZ-.08);
 // The pallets and their loads are cargo, not the pier: a group of their own (the ground audit leaves loose things out).
 const cargo=createBoatKit('Cargo on pallets');
 const pallet=(x,z)=>{for(const dz of [-.45,0,.45])cargo.box(1.1,.1,.1,x,T+.05,z+dz,0x6e5a44);cargo.box(1.1,.04,1.1,x,T+.12,z,0x8a6c4a);return T+.14;};
 {const p=S.pallets[0],y=pallet(p.x,p.z);
  // Cartons, kraft brown with the red band of Sakura Trading's packing tape, two tiers of four.
  for(let r=0;r<2;r++)for(const [dx,dz] of [[-.27,-.26],[.27,-.26],[-.27,.26],[.27,.26]]){const cy=y+.21+r*.43;cargo.box(.52,.42,.5,p.x+dx,cy,p.z+dz,0xb48b5a);cargo.box(.53,.06,.51,p.x+dx,cy+.12,p.z+dz,0xb8463a);}}
 {const p=S.pallets[1],y=pallet(p.x,p.z);
  // Yellow bottle crates, three high, the brown caps of the bottles showing at the top.
  for(let r=0;r<3;r++)for(const [dx,dz] of [[-.25,-.33],[.25,-.33],[-.25,0],[.25,0],[-.25,.33],[.25,.33]]){cargo.box(.48,.28,.32,p.x+dx,y+.15+r*.29,p.z+dz,0xe7b52c);if(r===2)cargo.box(.4,.02,.26,p.x+dx,y+.15+r*.29+.15,p.z+dz,0x5a3a22);}}
 {const t=S.truck;// the pallet truck: forks, the pump and its tiller, yellow
  for(const dx of [-.17,.17])kit.box(.16,.08,.9,t.x+dx,T+.05,t.z-.1,yellow,'metal');kit.box(.5,.25,.18,t.x,T+.15,t.z+.4,yellow,'metal');
  kit.rod([t.x,T+.25,t.z+.42],[t.x,T+1.05,t.z+.62],.025,iron);kit.rod([t.x-.14,T+1.08,t.z+.63],[t.x+.14,T+1.08,t.z+.63],.025,iron);
  for(const dx of [-.12,.12])kit.cyl(.08,.08,.06,t.x+dx,T+.08,t.z+.4,iron,'rubber',{rz:Math.PI/2});}
 kit.cyl(.04,.04,2,S.sign.x,T+1,S.sign.z,galv,'metal',{segments:8});
 // The fuel box on the kerb: grey steel, a red lid band, its hose on a reel on the east side, the nozzle in its holster.
 {const F=D.fuel,y=KERB_TOP;kit.box(.45,.62,.32,F.x,y+.31,F.z,0x9fa29b,'metal');kit.box(.47,.08,.34,F.x,y+.59,F.z,0xc23a2c);
  kit.cyl(.2,.2,.12,F.x+.31,y+.34,F.z,0x3d4548,'metal',{rz:Math.PI/2,segments:12});
  for(let k=0;k<2;k++)kit.torus(.17-k*.04,.025,F.x+.31,y+.34,F.z,0x1f2324,'rubber',{ry:Math.PI/2});
  kit.box(.06,.2,.08,F.x-.26,y+.4,F.z,iron,'metal');}
 kit.finish(shadows);cargo.finish(shadows);
 const group=kit.group;group.add(cargo.group);parent.add(group);
 // Signs, in Japanese: what a bay or a pump is for (English is spoken, not painted).
 label?.(S.sign.jp,S.sign.sub,[S.sign.x,PIER_TOP+1.75,S.sign.z+.05],.9,.5,0,'#f2efe4','#b8463a');
 label?.(D.fuel.sign.jp,D.fuel.sign.sub,[D.fuel.x,KERB_TOP+.34,D.fuel.z+.18],.4,.24,0,'#f2efe4','#b8463a');
 const colliders=quayDressingSolids();
 // Rain lies in the hollows by the scuppers (harbour.js shows them only when it rains).
 const puddles=D.scuppers.filter((_,i)=>i%2===0).map(s=>[s.x+.25,-48.7,.55,.3,0]);
 return {group,colliders,puddles};
}
