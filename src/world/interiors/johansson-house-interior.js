import * as THREE from '../../../vendor/three.module.js';
import {createKit} from '../okinawa/kit.js';
import {addOwnedCharacter} from '../../people/owned-characters.js';
import {HOUSE_FLOORS,HOUSE_LEVELS,HOUSE_ROOMS,HOUSE_WALLS,HOUSE_SLABS,HOUSE_OPENINGS,HOUSE_DOORS,HOUSE_LEAF,HOUSE_STAIR,HOUSE_GUARDS,HOUSE_RAILS,HOUSE_FIXTURES,HOUSE_EQUIPMENT,houseRoom} from '../johansson-house.js';
import {createHouseWalk} from '../house-walk.js';

/**
 * Inside Johansson's house (johansson-house.js, from the creator's Final Rev F): the basement, the ground floor and
 * the upper floor, the nineteen rooms the drawings name furnished for what they are for, the dog-leg stair between them
 * with its guards, the sliding doors, the boards and the equipment the drawings place, and the mayor's home life where
 * it belongs in a house: the post through the front door, the low table and the television in the living room, the
 * futons upstairs, the bath, the bookshelf in the study.
 *
 * The room's frame: centred on the plan, the front door's face at +z (the door you came in by, as every room in the
 * town has it), y up from the ground floor. A drawn point (x, y, z) is (x − 6, z, 5 − y). Each storey is its own
 * group, so the storeys over the one you stand on are put away and the camera never looks through a floor. The floors
 * are walked with house-walk.js; walls, guards, furniture and the doors' leaves are the room's colliders at their
 * storey's height.
 */
export const roomPoint=(x,y,z)=>[x-6,z,5-y];
/** Each storey's floor in the room's frame: B1 −2.8, G0 0, L1 2.8. */
export const HOUSE_STOREY_FLOOR=Object.freeze(Object.fromEntries(HOUSE_LEVELS.map(l=>[l,HOUSE_FLOORS[l].floor])));
/** The storey a pair of feet at height y is on. */
export const storeyAt=y=>y>=HOUSE_STOREY_FLOOR.L1-1?'L1':y>=HOUSE_STOREY_FLOOR.G0-1?'G0':'B1';

const C=Object.freeze({
 wall:0xf3eee2,ceiling:0xf6f3ea,slab:0xb9b4aa,timber:0xb8865a,timberDark:0x6b4a32,timberLight:0xd6b98e,tatami:0xcbc38c,tatamiEdge:0x3f4a3a,
 doma:0x8f8a80,tile:0xd5dfe0,tileDark:0x9fb0b4,concrete:0xb4b0a6,steel:0x8e979a,white:0xf4f5f2,frame:0x8a6a4a,sash:0xc3c8c9,board:0xe9e7df,
 leaf:0x9a7650,leafPanel:0xc8a67a,
 fabric:[0xb2453b,0x2f4f6f,0xc9a64a,0x3f6a4a,0xe6c9b8,0x6f2f6f],book:[0x2f4f6f,0xc9a64a,0x6f2f2f,0x3f6a4a,0x8a6a4a,0x40505f],
});
const mats=new Map();
const mat=(c,o={})=>{const k=c+JSON.stringify(o);if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color:c,roughness:.85,...o}));return mats.get(k);};
function canvas(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const room=key=>houseRoom(key).bounds;
const r4=v=>Math.round(v*1e4)/1e4;
const levelOfHeight=z=>z>=HOUSE_FLOORS.L1.floor-.05?'L1':z>=HOUSE_FLOORS.G0.floor-.05?'G0':'B1';

/**
 * Builds the house into `room` (game.js roomShell). `reg(object, label, fn, inside)` offers a prompt; `collider(x, z, w,
 * d, height, minY)` blocks (and gives the collider back, so a door's leaf can carry its own as it slides); `sleep`,
 * `television` and `post` are the mayor's home life; `doors` keeps the sliding doors' state ({get(id), set(id, open)},
 * game.js, under johansson.house.v2); `player()` is where he stands, so a door is not shut on him.
 */
export function buildJohanssonHouse({room:parent,reg,action,collider=()=>{},sleep=null,television=null,post=null,doors=null,player=null}){
 const home=new THREE.Group();home.name='Mayor’s home';parent.add(home);
 const storeys={};
 for(const level of HOUSE_LEVELS){const g=new THREE.Group();g.name='House '+level;home.add(g);storeys[level]=makeStorey(level,g,{reg,collider});}
 for(const level of HOUSE_LEVELS)shell(storeys[level]);
 stair(storeys);
 views(storeys);
 const leaves=slidingDoors(storeys,{reg,collider,doors,player,action});
 const owned=[],life={reg,action,sleep,television,post,owned};
 furnishBasement(storeys.B1,life);furnishGround(storeys.G0,life);furnishUpper(storeys.L1,life);
 equipment(storeys,life);
 for(const s of Object.values(storeys)){s.kit.finish(s.group,'Johansson house '+s.level);delete s.group.userData.walkLevels;delete s.group.userData.powerNetwork;}
 home.add(new THREE.HemisphereLight(0xf4f2ea,0x8a8478,.95));
 const walk=createHouseWalk(houseFloors());
 const refreshPost=storeys.G0.refreshPost||(()=>{});
 const [sx,,sz]=roomPoint(6.05,.75,0),[ex,,ez]=roomPoint(6.05,.24,0);
 let showing=null;
 /**
  * Put away what is more than one storey over him: the storey he stands on, those under it, and the one over it (seen
  * up the stair's well) are drawn; on the basement the upper floor is not.
  */
 function show(y){
  const level=storeyAt(y),i=HOUSE_LEVELS.indexOf(level);if(level===showing)return;showing=level;
  HOUSE_LEVELS.forEach((l,k)=>{storeys[l].group.visible=k<=i+1;});
 }
 show(0);
 return {
  bounds:{minX:-5.8,maxX:5.8,minZ:-4.8,maxZ:4.8},spawn:[sx,0,sz],exit:[ex,1.1,ez],exitFloor:0,yaw:0,
  home:true,storeys:true,walk,refreshPost,doors:leaves.api,owned,dispose:()=>owned.forEach(prop=>prop.dispose()),
  /** Overhead surfaces start from the basement's ceiling, not the town's 1.9 m (render/indoor-camera.js). */
  ceilingsFrom:HOUSE_STOREY_FLOOR.B1+1.9,
  /** Which storeys to show for feet at (x, y, z) (game.js calls it as he moves). */
  follow(p){show(p.y);},
  /** The doors' leaves slide (game.js calls it every frame he is inside). */
  tick(dt){leaves.tick(dt);},
  showStorey(level){showing=null;const i=HOUSE_LEVELS.indexOf(level);HOUSE_LEVELS.forEach((l,k)=>{storeys[l].group.visible=k<=i;});showing=level+'#';},
  storeyGroups:Object.fromEntries(HOUSE_LEVELS.map(l=>[l,storeys[l].group])),
 };
}

/**
 * Where furniture may go in his home (build/home-decorate.js, Johansson Studio): the open floor of the living room and of
 * the kitchen and dining room on the ground floor, the room frame's y = 0. The house's own furniture is in the colliders;
 * these squares are kept free besides: the doorways, the four cushions and the television, the kitchen's working front,
 * the dining chairs and the china cupboard.
 */
export const JOHANSSON_HOUSE_FLOOR=(()=>{
 const rect=key=>{const [x0,y0,x1,y1]=room(key),[ax,,az]=roomPoint(x0,y1,0),[bx,,bz]=roomPoint(x1,y0,0);return [ax+.02,bx-.02,az+.02,bz-.02];};
 const open=[rect('g0-living'),rect('g0-kitchen')];
 const at=(x,y,size)=>{const [px,,pz]=roomPoint(x,y,0);return Object.freeze([+px.toFixed(3),+pz.toFixed(3),size]);};
 return Object.freeze({
  walkable:(x,z)=>open.some(([x0,x1,z0,z1])=>x>x0&&x<x1&&z>z0&&z<z1),
  keepClear:Object.freeze([
   at(4.45,2.75,.9),at(4.45,7.95,.9),                                                     // the doorways
   at(2.6,1.65,.55),at(2.6,3.35,.55),at(1.75,2.5,.55),at(3.45,2.5,.55),at(3.2,4.4,.8),    // the cushions, the television
   at(.75,6.4,.8),at(.75,7.7,.8),at(.75,8.6,.8),at(.8,9.25,.8),                           // the kitchen's front, the fridge
   at(2.1,8.05,.55),at(2.9,8.05,.55),at(1.55,8.75,.55),at(3.45,8.75,.55),at(4.4,6.05,.8),  // the chairs, the china cupboard
   at(.75,1.2,.7),                                                                       // the keepsake shelf
  ]),
 });
})();

// ---------------------------------------------------------------- a storey's tools

/** The kit, the group and the helpers one storey is built with, in drawn metres over its floor. */
function makeStorey(level,group,{reg,collider}){
 const kit=createKit(),F=HOUSE_FLOORS[level].floor;
 /** A drawn point `h` over this floor, in the room's frame. */
 const at=(x,y,h=0)=>roomPoint(x,y,F+h);
 const s={level,group,kit,F,at};
 /** A block between drawn corners, heights over this floor. */
 s.blk=(x0,y0,h0,x1,y1,h1,hex,finish='matte')=>{const [ax,ay,az]=at(x0,y1,h0),[bx,by,bz]=at(x1,y0,h1);kit.block(ax,bx,ay,by,az,bz,hex,finish);};
 /** A box centred at drawn (x, y), its centre `h` over the floor: w along x, d along y. */
 s.box=(w,d,hh,x,y,h,hex,o={})=>{const [px,py,pz]=at(x,y,h);kit.box(w,hh,d,px,py,pz,hex,o);};
 s.cyl=(r0,r1,hh,x,y,h,hex,o={})=>{const [px,py,pz]=at(x,y,h);kit.cyl(r0,r1,hh,px,py,pz,hex,o);};
 s.rod=(a,b,r,hex,o={})=>kit.rod(at(...a),at(...b),r,hex,o);
 s.sphere=(r,x,y,h,hex,o={})=>{const [px,py,pz]=at(x,y,h);kit.sphere(r,px,py,pz,hex,o);};
 /** A collider over drawn x0..x1, y0..y1, from h0 to h1 over this floor. */
 s.solid=(x0,y0,x1,y1,h0=0,h1=2.4)=>{const [ax,,az]=at(x0,y1,0),[bx,,bz]=at(x1,y0,0);return collider((ax+bx)/2,(az+bz)/2,Math.abs(bx-ax),Math.abs(bz-az),h1-h0,F+h0);};
 /** A mesh of its own (one the game finds by name: the quilt, a cushion, the letter box), in this storey's group. */
 s.mesh=(w,d,hh,x,y,h,hex,name,o={})=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),o.material||mat(hex,o.mat));m.position.set(...at(x,y,h));if(o.ry)m.rotation.y=o.ry;m.name=name;m.receiveShadow=true;group.add(m);return m;};
 /** A prompt at drawn (x, y), `h` over this floor: only offered on this storey. */
 s.anchor=(x,y,h,label,fn)=>{const o=new THREE.Object3D();o.position.set(...at(x,y,h));o.userData.npcInteraction=false;o.userData.sameLevel=true;group.add(o);reg(o,label,fn,true);return o;};
 /**
  * A slab or board in the plane x = const between drawn x0 and x1, its outline in (y, height over this floor): a
  * stair's string, its soffit, a sloping board. Extruded from the outline, so a slope is exact.
  */
 s.profile=(x0,x1,outline,hex,finish='matte')=>{
  const [fx]=at(x1,0,0),shape=outline.map(([y,h])=>[5-y,h+F]);
  // Shape x → the room's z, shape y → up, extruded towards −x from x1: a turn, not a mirror.
  const m=new THREE.Matrix4().set(0,0,-1,fx, 0,1,0,0, 1,0,0,0, 0,0,0,1);
  kit.extrude(shape,x1-x0,m,hex,finish);
 };
 return s;
}
/**
 * Open shelving against a wall, running along x: a back, two ends and a board at each height, so what stands on it
 * shows. `x0..x1` its length, `y0..y1` its depth, `back` the side it backs onto ('y0' or 'y1').
 */
function shelves(s,x0,x1,y0,y1,boards,hex,back){
 const top=boards.at(-1)+.03,b=back==='y1'?[y1-.02,y1]:[y0,y0+.02];
 s.blk(x0,b[0],0,x1,b[1],top,hex);
 for(const x of [x0,x1-.03])s.blk(x,y0,0,x+.03,y1,top,hex);
 for(const h of boards)s.blk(x0,y0,h,x1,y1,h+.03,hex);
}
/** The same, running along y against a wall at x0 ('x0') or x1 ('x1'). */
function shelvesY(s,y0,y1,x0,x1,boards,hex,back){
 const top=boards.at(-1)+.03,b=back==='x1'?[x1-.02,x1]:[x0,x0+.02];
 s.blk(b[0],y0,0,b[1],y1,top,hex);
 for(const y of [y0,y1-.03])s.blk(x0,y,0,x1,y+.03,top,hex);
 for(const h of boards)s.blk(x0,y0,h,x1,y1,h+.03,hex);
}

// ---------------------------------------------------------------- the shell: floors, walls, ceilings

/**
 * The rooms whose lamp throws a light (the others' fittings glow, and the house's sky light does the rest): no more
 * than six are ever shown at once, inside the town's light budget (render/light-budget.js, eight).
 */
const LIT_ROOMS=Object.freeze(['b1-workshop','b1-club','g0-living','g0-kitchen','g0-sewing','l1-bedroom']);
/** What each room's floor is finished in. */
const FLOOR_FINISH={
 'b1-workshop':C.concrete,'b1-club':0x8a5a3c,'b1-hall':C.timber,'b1-boiler':C.concrete,'b1-sauna':C.tileDark,'b1-storage':C.concrete,
 'g0-living':'tatami','g0-kitchen':C.timberLight,'g0-genkan':C.timber,'g0-hall':C.timber,'g0-sewing':C.timberLight,'g0-wc':C.tile,'g0-terrace':0xc9c0ae,
 'l1-bedroom':'tatami','l1-guest':'tatami','l1-hall':C.timber,'l1-bathroom':C.tile,'l1-study':C.timber,'l1-linen':C.timber,
};
/** The genkan's stone floor at the front door, where shoes come off: level with the hall (Rev F), its edge a timber strip. */
const GENKAN_STONE=1.4;
/** The slabs a storey stands on, as rectangles [x0, y0, x1, y1]: the well is where there are none. */
const floorSlabs=level=>HOUSE_SLABS.filter(b=>b.kind==='slab'&&b.level===level).map(b=>[b.min[0],b.min[1],b.max[0],b.max[1]]);
/** A rectangle cut to each rectangle of a list it overlaps. */
const clip=(r,list)=>list.map(q=>[Math.max(r[0],q[0]),Math.max(r[1],q[1]),Math.min(r[2],q[2]),Math.min(r[3],q[3])]).filter(q=>q[2]-q[0]>1e-6&&q[3]-q[1]>1e-6);

function shell(s){
 const L=s.level,slabs=floorSlabs(L),top=HOUSE_FLOORS[L].soffit-s.F;
 // The slabs under this floor, finished room by room.
 for(const b of HOUSE_SLABS.filter(q=>q.level===L&&q.kind==='slab'))s.blk(b.min[0],b.min[1],b.min[2]-s.F,b.max[0],b.max[1],b.max[2]-s.F-.012,C.slab);
 for(const r of HOUSE_ROOMS.filter(q=>q.level===L))for(const zone of r.zones)for(const [x0,y0,x1,y1] of clip(zone,slabs)){
  const f=FLOOR_FINISH[r.key];
  if(r.key==='g0-genkan'){
   s.blk(x0,y0,-.012,x1,Math.min(y1,GENKAN_STONE),0,C.doma);
   s.blk(x0,GENKAN_STONE,-.012,x1,GENKAN_STONE+.06,.002,C.timberDark);
   s.blk(x0,GENKAN_STONE+.06,-.012,x1,y1,0,f);
   continue;
  }
  if(f==='tatami'){
   s.blk(x0,y0,-.012,x1,y1,0,C.tatami);
   // Mats of about 1.82 × 0.91 with their cloth borders.
   for(let x=x0+1.82;x<x1-.3;x+=1.82)s.blk(x-.02,y0,0,x+.02,y1,.004,C.tatamiEdge);
   for(let y=y0+.91;y<y1-.3;y+=.91)s.blk(x0,y-.02,0,x1,y+.02,.004,C.tatamiEdge);
  }else s.blk(x0,y0,-.012,x1,y1,0,f);
 }
 // The floor through each doorway and the stair's opening from the genkan, over the partition's foot.
 for(const [x0,y0,x1,y1] of thresholds(L))s.blk(x0,y0,-.012,x1,y1,0,C.timber);
 // The walls as drawn, a sleeve's hole filled until its pipe goes through (RF5): those standing in this storey block.
 for(const w of HOUSE_WALLS.filter(q=>q.level===L)){
  s.blk(w.min[0],w.min[1],w.min[2]-s.F,w.max[0],w.max[1],w.max[2]-s.F,C.wall);
  if(w.max[2]-s.F>.05&&w.min[2]-s.F<2.2)s.solid(w.min[0],w.min[1],w.max[0],w.max[1],Math.max(0,w.min[2]-s.F),w.max[2]-s.F);
 }
 // The well's edges: a timber fascia over the slab's cut edge, all round, under the guards.
 if(L!=='B1'){const [x0,y0,x1,y1]=HOUSE_STAIR.well,d=.18;
  for(const [a,b,c,e] of [[x0-.02,y0,x0,y1],[x1,y0,x1+.02,y1],[x0,y1,x1,y1+.02]])s.blk(a,b,-d,c,e,0,C.timberDark);}
 // A frame round each doorway: two jambs and the head's lining (the leaves and their tracks are slidingDoors').
 for(const d of HOUSE_DOORS.filter(q=>q.level===L)){
  const t=.065,h=d.head-s.F;
  for(const e of [d.from,d.to]){if(d.axis==='x')s.blk(d.at-t,e-.03,0,d.at+t,e+.03,h,C.frame);else s.blk(e-.03,d.at-t,0,e+.03,d.at+t,h,C.frame);}
  if(d.axis==='x')s.blk(d.at-t,d.from,h-.03,d.at+t,d.to,h+.02,C.frame);else s.blk(d.from,d.at-t,h-.03,d.to,d.at+t,h+.02,C.frame);
 }
 // The ceiling: the soffit of the slab over this storey (the well open in it where there is one). A group of its own,
 // standing at the ceiling's height, so a view from above (Johansson Studio's furniture tool, build/home-decorate.js)
 // can lift it off as it lifts off every room's ceiling.
 const over=L==='B1'?'G0':L==='G0'?'L1':null,ceiling=createKit(),[,cy]=s.at(0,0,top);
 const cblk=(x0,y0,x1,y1)=>{const [ax,,az]=s.at(x0,y1,0),[bx,,bz]=s.at(x1,y0,0);ceiling.block(ax,bx,-.002,.01,az,bz,C.ceiling);};
 if(over)for(const [x0,y0,x1,y1] of floorSlabs(over))cblk(x0,y0,x1,y1);
 else cblk(.2,.2,11.8,9.8);
 const lid=new THREE.Group();lid.name='Ceiling '+L;lid.position.y=cy;s.group.add(lid);ceiling.finish(lid,'Johansson house ceiling '+L);delete lid.userData.walkLevels;delete lid.userData.powerNetwork;
 // The threshold of each outside door, across the wall's thickness.
 for(const o of HOUSE_OPENINGS.filter(q=>q.level===L&&q.type==='door')){
  const [y0,y1]=o.side==='south'?[0,.2]:[9.8,10];
  s.blk(o.from,y0,-.1,o.to,y1,0,o.id==='D-ENTRY'?C.doma:C.concrete);
 }
 for(const o of HOUSE_OPENINGS.filter(q=>q.level===L))openingInside(s,o);
 // The lamps where the drawings put them (one in each room, at its middle; a tube in the working rooms), and the
 // sockets on their walls (RF4).
 for(const f of HOUSE_FIXTURES){
  const r=houseRoom(f.room);if(r.level!==L)continue;
  const [x,y,z]=f.at;
  if(f.kind==='light'){
   const working=/workshop|boiler|storage|sewing|wc|linen/.test(r.key),lit=LIT_ROOMS.includes(r.key);
   if(working){s.box(1.2,.2,.05,x,y,top-.03,0xdedfd6);const t=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.1,6),new THREE.MeshBasicMaterial({color:0xf6fbf4}));t.rotation.z=Math.PI/2;t.position.set(...s.at(x,y,top-.08));t.name='Ceiling tube';s.group.add(t);}
   else{const m=new THREE.Mesh(new THREE.CylinderGeometry(.24,.28,.08,16),new THREE.MeshBasicMaterial({color:0xfff6e2}));m.position.set(...s.at(x,y,top-.05));m.name='Ceiling lamp';s.group.add(m);}
   if(lit){const l=new THREE.PointLight(0xfff2dc,.75,7.5,2);l.position.set(...s.at(x,y,top-.3));s.group.add(l);}
   continue;
  }
  // A socket: its plate on the wall, the two pins' holes.
  const h=z-s.F,n=f.wall==='w'||f.wall==='s'?1:-1,alongY=f.wall==='w'||f.wall==='e';
  if(alongY){s.box(.02,.07,.11,x+n*.01,y,h,C.white);for(const d of [-.012,.012])s.box(.006,.012,.025,x+n*.022,y+d,h,0x8a8a86);}
  else{s.box(.07,.02,.11,x,y+n*.01,h,C.white);for(const d of [-.012,.012])s.box(.012,.006,.025,x+d,y+n*.022,h,0x8a8a86);}
 }
}

/** The floors through the doorways (across the partition) and the genkan's opening onto the stair (RF1). */
function thresholds(level){
 const out=[];
 for(const d of HOUSE_DOORS.filter(q=>q.level===level)){const t=.07;out.push(d.axis==='x'?[d.at-t,d.from,d.at+t,d.to]:[d.from,d.at-t,d.to,d.at+t]);}
 if(level==='G0'){const h=HOUSE_WALLS.find(w=>w.id==='G0-INT-ENTRY-00-HEAD');out.push([h.min[0],h.min[1]-.01,h.max[0],h.max[1]+.01]);}
 return out;
}

/** The window's sill board and inside frame, the glass, and the front, terrace and basement doors from inside. */
function openingInside(s,o){
 const face=o.side==='south'?.2:o.side==='north'?9.8:o.side==='west'?.2:11.8,inward=o.side==='south'||o.side==='west'?1:-1;
 const alongX=o.side==='south'||o.side==='north',sill=o.sill-s.F,head=o.head-s.F,mid=(o.from+o.to)/2,w=o.to-o.from;
 const put=(along,across,h,ww,dd,hh,hex,finish)=>{const x=alongX?along:across,y=alongX?across:along;s.box(alongX?ww:dd,alongX?dd:ww,hh,x,y,h,hex,{finish});};
 if(o.type==='window'){
  put(mid,face+inward*.06,sill-.02,w+.1,.14,.04,C.timberLight);
  for(const e of [o.from+.02,o.to-.02])put(e,face-inward*.05,(sill+head)/2,.04,.06,head-sill,C.sash);
  for(const h of [sill+.02,head-.02])put(mid,face-inward*.05,h,w,.06,.04,C.sash);
  put(mid,face-inward*.05,(sill+head)/2,.04,.07,head-sill,C.sash);
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(w-.06,head-sill-.06),new THREE.MeshStandardMaterial({color:0xd8eef3,transparent:true,opacity:.16,roughness:.05,depthWrite:false,side:THREE.DoubleSide}));
  glass.position.set(...s.at(alongX?mid:face-inward*.07,alongX?face-inward*.07:mid,(sill+head)/2));glass.rotation.y=alongX?0:Math.PI/2;glass.name='Window glass';glass.userData.clearWindow=true;s.group.add(glass);
  return;
 }
 if(o.id==='D-ENTRY'){
  // The front door from inside: the leaf, the lever and the latch, and the letter box under its slot (the post).
  const y=.12;
  s.box(w-.02,.05,head-.02,mid,y-.02,head/2,0x6a4c36,{finish:'gloss'});
  for(const e of [o.from,o.to])s.box(.06,.12,head,e,face-.02,head/2,C.frame);
  s.box(o.to-o.from,.12,.06,mid,face-.02,head,C.frame);
  s.box(.12,.03,.03,o.to-.16,y+.02,1,0xc9cdd0,{finish:'metal'});s.box(.04,.04,.1,o.to-.16,y+.02,1.25,0xc9cdd0,{finish:'metal'});
  s.box(.3,.03,.05,mid,y+.01,1.05,0xb8913f,{finish:'metal'});
  return;
 }
 if(o.id==='D-TERRACE'){
  for(const e of [o.from+.03,o.to-.03])put(e,face-inward*.05,head/2,.06,.07,head,C.sash);
  put(mid,face-inward*.05,head-.03,w,.07,.06,C.sash);put(mid,face-inward*.05,.25,w-.12,.05,.5,C.sash);
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(w-.12,head-.6),new THREE.MeshStandardMaterial({color:0xd8eef3,transparent:true,opacity:.16,roughness:.05,depthWrite:false,side:THREE.DoubleSide}));
  glass.position.set(...s.at(mid,face-inward*.05,(.5+head)/2));glass.name='Terrace door glass';glass.userData.clearWindow=true;s.group.add(glass);
  return;
 }
 // D-BEXT: the steel door out to the court and the garden stair, shut, in its frame.
 put(mid,face-.08,head/2,w,.05,head,C.steel,'metal');
 for(const e of [o.from+.02,o.to-.02])put(e,face-.02,head/2,.06,.12,head,C.frame);put(mid,face-.02,head-.02,w,.12,.06,C.frame);
 put(o.to-.15,face+.08,1,.12,.04,.03,0xc9cdd0,'metal');
}

// ---------------------------------------------------------------- what the windows look out on

/**
 * The town is put away while you are indoors, so each window looks out on a painting of what is outside it: the yard
 * and the hinpun to the front, the terrace and the fukugi behind, the sea past the windbreak on the sea side, the
 * jungle hill on the other, and the lightwell's concrete from the basement.
 */
function views(storeys){
 const sky=(g,w,h,horizon)=>{const s=g.createLinearGradient(0,0,0,h*horizon);s.addColorStop(0,'#5d9fd8');s.addColorStop(1,'#cfe6f2');g.fillStyle=s;g.fillRect(0,0,w,h*horizon);};
 const clouds=(g,w,h)=>{g.fillStyle='rgba(255,255,255,.85)';for(const [x,y,r] of [[.2,.12,.07],[.26,.1,.05],[.7,.18,.08],[.78,.16,.05]]){g.beginPath();g.ellipse(x*w,y*h,r*w,r*h*.45,0,0,7);g.fill();}};
 const fukugi=(g,x,base,hgt,w)=>{g.fillStyle='#5a4130';g.fillRect(x-w*.04,base-hgt*.35,w*.08,hgt*.35);g.fillStyle='#2f5d35';g.beginPath();g.ellipse(x,base-hgt*.62,w*.42,hgt*.42,0,0,7);g.fill();g.fillStyle='#3f7440';g.beginPath();g.ellipse(x-w*.1,base-hgt*.7,w*.22,hgt*.22,0,0,7);g.fill();};
 const wall=(g,w,h,top,colour='#e9e0cc')=>{g.fillStyle=colour;g.fillRect(0,h*top,w,h*.07);g.fillStyle='rgba(0,0,0,.08)';for(let x=0;x<w;x+=w/9)g.fillRect(x,h*top,2,h*.07);};
 const PAINT={
  south:(g,w,h)=>{sky(g,w,h,.62);clouds(g,w,h);g.fillStyle='#e6dcc3';g.fillRect(0,h*.62,w,h*.38);g.fillStyle='#d9cdb0';g.fillRect(w*.08,h*.5,w*.22,h*.12);g.fillStyle='#b8574a';g.beginPath();g.moveTo(w*.05,h*.5);g.lineTo(w*.19,h*.42);g.lineTo(w*.33,h*.5);g.fill();wall(g,w,h,.58);g.fillStyle='#d8cfb3';g.fillRect(w*.42,h*.52,w*.16,h*.14);g.fillStyle='#2f5d35';g.beginPath();g.ellipse(w*.5,h*.5,w*.08,h*.05,0,0,7);g.fill();fukugi(g,w*.85,h*.62,h*.45,w*.16);},
  north:(g,w,h)=>{sky(g,w,h,.6);clouds(g,w,h);g.fillStyle='#2f9fc0';g.fillRect(0,h*.52,w,h*.08);g.fillStyle='#e6dcc3';g.fillRect(0,h*.6,w,h*.4);g.fillStyle='#d9d1bf';g.fillRect(0,h*.78,w,h*.22);wall(g,w,h,.6);for(const x of [.12,.34,.56,.78])fukugi(g,w*x,h*.62,h*.5,w*.2);},
  east:(g,w,h)=>{sky(g,w,h,.5);clouds(g,w,h);g.fillStyle='#1f7fb4';g.fillRect(0,h*.5,w,h*.08);g.fillStyle='#3fc1c9';g.fillRect(0,h*.58,w,h*.08);g.fillStyle='#efe6d2';g.fillRect(0,h*.66,w,h*.34);wall(g,w,h,.68);for(const x of [.08,.44,.9])fukugi(g,w*x,h*.7,h*.5,w*.14);},
  west:(g,w,h)=>{sky(g,w,h,.55);clouds(g,w,h);g.fillStyle='#4f8a4c';g.beginPath();g.moveTo(0,h*.55);g.quadraticCurveTo(w*.5,h*.18,w,h*.5);g.lineTo(w,h);g.lineTo(0,h);g.fill();g.fillStyle='#3f7440';for(let i=0;i<14;i++){g.beginPath();g.ellipse(w*(i/13),h*(.42+.08*Math.sin(i*1.7)),w*.07,h*.07,0,0,7);g.fill();}g.fillStyle='#e6dcc3';g.fillRect(0,h*.7,w,h*.3);wall(g,w,h,.66);},
  well:(g,w,h)=>{g.fillStyle='#a7a398';g.fillRect(0,0,w,h);g.fillStyle='#c9d6d6';g.fillRect(0,0,w,h*.12);g.fillStyle='rgba(0,0,0,.08)';for(let y=h*.2;y<h;y+=h*.18)g.fillRect(0,y,w,3);g.fillStyle='#8a8578';g.fillRect(0,h*.9,w,h*.1);},
 };
 const tex={};
 for(const o of HOUSE_OPENINGS.filter(q=>q.type==='window'||q.id==='D-TERRACE')){
  const s=storeys[o.level],kind=o.id==='W-B1'?'well':o.side,map=tex[kind]??=canvas(512,384,PAINT[kind]);
  const alongX=o.side==='south'||o.side==='north',out=o.side==='south'||o.side==='west'?-1:1;
  const dist=kind==='well'?.85:2.2,w=(o.to-o.from)+dist*1.6,h=(o.head-o.sill)+dist*1.2,mid=(o.from+o.to)/2,hc=(o.sill+o.head)/2-s.F+(kind==='well'?0:.15);
  const card=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,fog:false,side:THREE.DoubleSide}));
  card.position.set(...s.at(alongX?mid:o.face+out*dist,alongX?o.face+out*dist:mid,hc));
  // The painting faces back in at the window.
  card.rotation.y=o.side==='south'?Math.PI:o.side==='north'?0:o.side==='west'?Math.PI/2:-Math.PI/2;
  card.name='View from '+o.id;card.userData.clearWindow=true;s.group.add(card);
 }
}

// ---------------------------------------------------------------- the stair

/** How deep under a flight's ramp its soffit runs: under the backs of the treads. */
const SOFFIT=.36;
/** A flight's ramp height at drawn y (through its nosings; the walk's carries on one going at the foot). */
const rampAt=(f,y,walk=false)=>{const [y0,z0]=walk?f.walkLow:f.low,[y1,z1]=f.high;return z0+(z1-z0)*(y-y0)/(y1-y0);};
/**
 * A flight's string (or soffit) in its plane, as (drawn y, height) points: the band from `top` over its nosings to
 * `bottom` under them, from the first nosing to the head, where the top comes down flush with the floor or landing it
 * meets; at the foot it stands on the floor or landing it rises from, and is cut level there.
 */
function flightOutline(f,top,bottom){
 const [yA,zA]=f.low,[yB,zB]=f.high,up=Math.sign(yB-yA),base=f.walkLow[1],slope=(zB-zA)/(yB-yA);
 const r=y=>zA+slope*(y-yA),yIn=yB-up*.08;
 const band=[[yA,r(yA)+top],[yIn,r(yIn)+top],[yB,Math.min(zB,r(yB)+top)],[yB,r(yB)-bottom],[yA,r(yA)-bottom]];
 if(base<r(yA)+top)band.unshift([yA,base]);
 // Cut by the level of the floor or landing at the foot (Sutherland–Hodgman, one edge).
 const out=[];
 for(let i=0;i<band.length;i++){
  const a=band[i],b=band[(i+1)%band.length],ina=a[1]>=base-1e-9,inb=b[1]>=base-1e-9;
  if(ina)out.push(a);
  if(ina!==inb){const t=(base-a[1])/(b[1]-a[1]);out.push([a[0]+(b[0]-a[0])*t,base]);}
 }
 return out.filter((p,i)=>Math.hypot(p[0]-out[(i+out.length-1)%out.length][0],p[1]-out[(i+out.length-1)%out.length][1])>1e-6);
}

function stair(storeys){
 const S=HOUSE_STAIR;
 for(const f of S.flights){
  const s=storeys[f.from],h=z=>z-s.F,up=Math.sign(f.high[0]-f.low[0]);
  // Each tread: a timber board over the drawn tread's top, and the riser under its edge towards the step below.
  for(const t of f.treads){
   s.blk(t.min[0],t.min[1],h(t.max[2])-.035,t.max[0],t.max[1],h(t.max[2]),C.timber);
   const y=up>0?t.min[1]:t.max[1];
   s.blk(t.min[0],Math.min(y,y+up*.02),h(t.max[2])-S.riser,t.max[0],Math.max(y,y+up*.02),h(t.max[2])-.035,C.white);
  }
  // The strings either side (closed: the posts stand on them) and the soffit under the treads.
  for(const [x0,x1] of [[f.x[0]-.03,f.x[0]],[f.x[1],f.x[1]+.03]])s.profile(x0,x1,flightOutline(f,.05,SOFFIT).map(([y,z])=>[y,h(z)]),C.timberDark);
  s.profile(f.x[0],f.x[1],flightOutline(f,.03-SOFFIT,SOFFIT).map(([y,z])=>[y,h(z)]),C.ceiling);
 }
 // The landings, a timber slab with its fascia.
 for(const l of S.landings){const s=storeys[l.level==='B1'?'B1':'G0'];s.blk(l.min[0],l.min[1],l.min[2]-s.F,l.max[0],l.max[1],l.max[2]-s.F,C.timber);}
 // The guards (posts at the drawn spacing, 1.1 m: RF2 and RF3 with them) and the rails: those in the house; the court's
 // and the lightwell's are outside (johansson-house-build.js).
 for(const g of HOUSE_GUARDS.filter(q=>!/^(EXT|LIGHTWELL)-/.test(q.id))){
  const s=storeys[levelOfHeight(g.min[2]+.01)];
  s.blk(g.min[0],g.min[1],g.min[2]-s.F,g.max[0],g.max[1],g.max[2]-s.F,C.timberDark);
  s.solid(g.min[0],g.min[1],g.max[0],g.max[1],g.min[2]-s.F,g.max[2]-s.F);
 }
 for(const r of HOUSE_RAILS){const s=storeys[levelOfHeight(Math.min(r.a[2],r.b[2])-1.1+.01)];s.rod([r.a[0],r.a[1],r.a[2]-s.F],[r.b[0],r.b[1],r.b[2]-s.F],r.d/2,C.timberDark);}
 // A pendant down the well.
 const s=storeys.L1,[x0,y0,x1,y1]=S.well;
 const m=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.22,14),new THREE.MeshBasicMaterial({color:0xfff6e2}));m.position.set(...s.at((x0+x1)/2,(y0+y1)/2,HOUSE_FLOORS.L1.soffit-s.F-.6));m.name='Stair pendant';s.group.add(m);
 s.rod([(x0+x1)/2,(y0+y1)/2,HOUSE_FLOORS.L1.soffit-s.F],[(x0+x1)/2,(y0+y1)/2,HOUSE_FLOORS.L1.soffit-s.F-.5],.006,0x2b2b2b);
 const l=new THREE.PointLight(0xfff2dc,.6,7,2);l.position.set(...s.at((x0+x1)/2,(y0+y1)/2,HOUSE_FLOORS.L1.soffit-s.F-.9));s.group.add(l);
}

/** The floors the house is walked on, in the room's frame (house-walk.js): rooms, doorways, the stair's flights and landings. */
export function houseFloors(){
 const out=[],rect=(id,[x0,y0,x1,y1],z,thick)=>{const [ax,,az]=roomPoint(x0,y1,0),[bx,,bz]=roomPoint(x1,y0,0);out.push({id,x:[r4(ax),r4(bx)],z:[r4(az),r4(bz)],y:z,thick});};
 for(const r of HOUSE_ROOMS){
  const slabs=floorSlabs(r.level);
  r.zones.forEach((zone,i)=>clip(zone,slabs).forEach((q,k)=>rect(`${r.key}-${i}-${k}`,q,r.floor,.18)));
 }
 for(const level of HOUSE_LEVELS)thresholds(level).forEach((q,i)=>rect(`${level}-threshold-${i}`,q,HOUSE_FLOORS[level].floor,.18));
 // The front door's sill, level with the genkan.
 const fd=HOUSE_OPENINGS.find(o=>o.id==='D-ENTRY');rect('front-door',[fd.from,0,fd.to,.2],0,.18);
 for(const f of HOUSE_STAIR.flights){
  // Each flight a slope through its nosings, carried one going on at its foot, so feet go up evenly from the floor.
  const [ya,za]=f.walkLow,[yb,zb]=f.high,lo=Math.min(ya,yb),hi=Math.max(ya,yb);
  const [ax,,az]=roomPoint(f.x[0],hi,0),[bx,,bz]=roomPoint(f.x[1],lo,0);
  // The room's z runs against drawn y: at z = az (drawn hi) and z = bz (drawn lo).
  const atHi=hi===yb?zb:za,atLo=lo===yb?zb:za;
  out.push({id:'flight-'+f.id,x:[r4(ax),r4(bx)],z:[r4(az),r4(bz)],y:[r4(atHi),r4(atLo)],thick:SOFFIT});
 }
 for(const l of HOUSE_STAIR.landings)rect('landing-'+l.level,[l.min[0],l.min[1],l.max[0],l.max[1]],l.max[2],l.max[2]-l.min[2]);
 return out;
}

// ---------------------------------------------------------------- the sliding doors

/**
 * The leaves of the sliding doors (Rev F: timber, 900 mm clear, the collider out of the passage only when open): each a
 * framed panel on its track on one face of the partition, slid open beside its opening or shut across it. Each keeps
 * its collider and carries it as it slides; its state is saved by the door's id (`doors`, johansson.house.v2).
 */
function slidingDoors(storeys,{reg,collider,doors,player,action}){
 const L=HOUSE_LEAF,list=[];
 for(const d of HOUSE_DOORS){
  const s=storeys[d.level];
  if(!d.leaf){
   // RF1: D-G0-ENTRY-HALL is a doorway without a leaf (no wall left to slide one over).
   continue;
  }
  const lf=d.leaf,run=[Math.min(lf.shut[0],lf.parked[0]),Math.max(lf.shut[1],lf.parked[1])],t=.065;
  // The track: the head rail (kamoi) along the leaf's run at its top and the guide on the floor under it.
  const plane=lf.plane,th=d.head-s.F,lo=lf.face>0?plane-L.thick/2-.006:plane-L.thick/2-.03,hi=lf.face>0?plane+L.thick/2+.03:plane+L.thick/2+.006;
  if(d.axis==='x'){s.blk(Math.min(lo,d.at+lf.face*t),run[0],th-.02,Math.max(hi,d.at+lf.face*t),run[1],th+.05,C.frame);s.blk(lo,run[0],0,hi,run[1],.008,C.timberDark);}
  else{s.blk(run[0],Math.min(lo,d.at+lf.face*t),th-.02,run[1],Math.max(hi,d.at+lf.face*t),th+.05,C.frame);s.blk(run[0],lo,0,run[1],hi,.008,C.timberDark);}
  // The leaf: stiles and rails round a panel, the finger pull (hikite) on both faces, in a group that slides.
  const g=new THREE.Group();g.name='Sliding door '+d.id;s.group.add(g);
  const k=createKit(),W=L.width,H=L.height,T=L.thick;
  // Built along the room's x (a door on a line of constant drawn y), then turned for a door on a line of constant x.
  k.block(-W/2,W/2,.01,.06,-T/2,T/2,C.leaf);k.block(-W/2,W/2,H-.05,H,-T/2,T/2,C.leaf);
  for(const e of [-W/2,W/2-.055])k.block(e,e+.055,.01,H,-T/2,T/2,C.leaf);
  k.block(-W/2+.055,W/2-.055,1.0,1.06,-T/2,T/2,C.leaf);
  k.block(-W/2+.055,W/2-.055,.06,H-.05,-T/2+.008,T/2-.008,C.leafPanel);
  const pull=(lf.open>0?-1:1)*(W/2-.12);
  for(const z of [-T/2-.002,T/2+.002])k.box(.04,.1,.004,pull,1.0,z,0x3a2a1e);
  k.finish(g,'Leaf '+d.id);delete g.userData.walkLevels;delete g.userData.powerNetwork;
  const place=(c)=>{const [x,y,z]=d.axis==='y'?roomPoint(c,plane,s.F):roomPoint(plane,c,s.F);g.position.set(x,y,z);};
  if(d.axis==='x')g.rotation.y=Math.PI/2;
  // The collider the leaf carries: its own size, where it is.
  const centre=([a,b])=>(a+b)/2,shutC=centre(lf.shut),openC=centre(lf.parked);
  let open=doors?.get?.(d.id)??true,at=open?openC:shutC;
  const box=d.axis==='y'?s.solid(at-W/2,plane-T/2,at+W/2,plane+T/2,0,H):s.solid(plane-T/2,at-W/2,plane+T/2,at+W/2,0,H);
  const carry=c=>{place(c);if(!box||typeof box!=='object')return;const [x,,z]=d.axis==='y'?roomPoint(c,plane,0):roomPoint(plane,c,0);box.x=x;box.z=z;};
  carry(at);
  const entry={id:d.id,level:d.level,get open(){return open;},get at(){return at;},target:()=>open?openC:shutC,carry,set(v){at=v;}};
  list.push(entry);
  const [mx,my]=d.axis==='y'?[(d.from+d.to)/2,d.at]:[d.at,(d.from+d.to)/2];
  s.anchor(mx,my,1.1,'Slide the door',()=>{
   const p=player?.();
   if(open&&p){const [px,,pz]=p,[ox,,oz]=roomPoint(mx,my,0);const along=d.axis==='y'?Math.abs(px-ox):Math.abs(pz-oz),across=d.axis==='y'?Math.abs(pz-oz):Math.abs(px-ox);
    if(Math.abs(p[1]-s.F)<1&&along<(d.to-d.from)/2+.3&&across<.4){action?.('inspect','Sliding door','Step out of the doorway first.');return;}}
   open=!open;doors?.set?.(d.id,open);
  });
 }
 return {
  tick(dt){for(const e of list){const goal=e.target(),now=e.at;if(Math.abs(goal-now)<1e-4)continue;const step=Math.sign(goal-now)*Math.min(Math.abs(goal-now),1.4*Math.max(0,dt));e.set(now+step);e.carry(now+step);}},
  api:{list:()=>list.map(e=>({id:e.id,level:e.level,open:e.open})),settle(){for(const e of list){e.set(e.target());e.carry(e.target());}}},
 };
}

// ---------------------------------------------------------------- the equipment the drawings place

function equipment(storeys,{action}){
 const say=(title,text)=>()=>action('inspect',title,text);
 const eq=id=>HOUSE_EQUIPMENT.find(e=>e.id===id);
 // The boards on the east wall of the genkan and of the halls over and under it, one over another on the riser.
 for(const [id,level,title,text] of [
  ['ELECTRICAL-EQ-MAIN','G0','Main switchboard','Johansson Denki’s main board: single-phase three-wire, 100 and 200 V at 60 hertz, as everywhere in Okinawa. The supply breaker, the earth-leakage breaker, and the feeders down to the basement’s board and up to the upper floor’s. If the whole house wants more than 12 kW at once, the main breaker trips.'],
  ['ELECTRICAL-EQ-G0_DB','G0','Ground floor board','The ground floor’s circuits, labelled in his hand: lights, sockets, Thuan’s sewing machine, the cooling for the ground floor. Each breaker its own circuit; the sewing room’s has a strip of red tape, because Thuan asked.'],
  ['ELECTRICAL-EQ-B1_DB','B1','Basement board','The basement’s circuits: the workshop, the sauna’s 200 V heater on both legs, the lift pump, the storm pump, the water heater’s controls and the fans. Before any work on a circuit: switch it off, lock it off and tag it, then prove it dead with a tester you have just tried on a live socket, and try the tester again after.'],
  ['ELECTRICAL-EQ-L1_DB','L1','Upper floor board','The upper floor’s lights and sockets and its cooling. A torch hangs on a hook beside it for the nights a typhoon takes the island’s supply.'],
 ]){
  const e=eq(id),s=storeys[level],[x0,y0,z0]=e.min,[x1,y1,z1]=e.max;
  // The board is on the wall's face (x 8.24); the drawn envelope reaches out into the room past it.
  // The board's steel box on the wall, its door, the door's catch and the circuit card behind the window in it.
  const h0=z0-s.F,h1=z1-s.F;
  s.blk(8.24-.1,y0,h0,8.24,y1,h1,0xd9dbd6,'metal');s.blk(8.24-.104,y0+.015,h0+.015,8.24-.1,y1-.015,h1-.015,0xc9ccc6,'metal');
  s.blk(8.24-.107,y0+.06,h1-.11,8.24-.104,y1-.06,h1-.04,0xf2efe4);s.box(.006,.02,.05,8.24-.108,y1-.04,(h0+h1)/2,0x3a3a3a);
  const [ax,ay,az]=e.approach;s.anchor(Math.min(ax,7.9),ay,az-s.F,'Look at the '+title.toLowerCase(),say(title,text));
 }
}

// ---------------------------------------------------------------- the basement

function furnishBasement(s,{action}){
 const say=(title,text)=>()=>action('inspect',title,text);
 // The electrical workshop: the bench, the meters, the parts drawers and the teaching board.
 {const [x0,y0,x1,y1]=room('b1-workshop');
  s.blk(x0,.6,0,x0+.75,3.6,.9,C.timberLight);s.solid(x0,.6,x0+.77,3.6,0,.92);
  s.blk(x0,.6,1.1,x0+.03,3.6,2.1,0xc9b48a);for(let i=0;i<8;i++)s.box(.04,.08,.3,x0+.05,.9+i*.35,1.5+(i%2)*.2,0x5d6b70);
  s.box(.25,.2,.12,x0+.3,1.2,.96,0xc9a64a);s.box(.15,.22,.08,x0+.3,1.7,.94,0xd9b04a);s.box(.16,.1,.1,x0+.35,2.6,.95,0x5d6b70);
  s.blk(x0,3.8,0,x0+.45,4.6,1.2,0x8e979a,'metal');for(let i=0;i<10;i++)s.box(.02,.3,.08,x0+.46,3.95+(i%2)*.4,.15+Math.floor(i/2)*.22,0xe9e7df);s.solid(x0,3.8,x0+.47,4.6,0,1.2);
  // The teaching board on the south wall: a supply breaker, an earth-leakage breaker, three circuits, sockets and lamps.
  s.blk(1.2,y0,1,3.6,y0+.04,2,0xe9e7df);s.box(.16,.04,.24,1.5,y0+.06,1.7,0x2b2b2b);s.box(.16,.04,.24,1.8,y0+.06,1.7,0x3a5260);
  for(let i=0;i<3;i++)s.box(.06,.04,.16,2.2+i*.12,y0+.06,1.72,0x2b2b2b);
  for(let i=0;i<3;i++){s.box(.12,.04,.16,2.4+i*.35,y0+.06,1.25,C.white);s.sphere(.05,2.4+i*.35,y0+.08,1.45,0xf3e7c4);}
  s.anchor(2.4,y0+.8,1.4,'Look at the teaching board',say('Teaching board','The board he wired to teach the island’s apprentices: a supply breaker, an earth-leakage breaker, three circuits. Before any work on a circuit: switch it off, lock it off and tag it, then prove it dead with a tester you have just tried on a live socket, and try the tester again after.'));
  s.box(.4,.4,.04,1.5,2,.6,C.timber);s.cyl(.03,.03,.58,1.5,2,.29,C.steel);s.solid(1.28,1.78,1.72,2.22,0,.62);
  s.anchor(x0+1.1,2,1.2,'Look at the workbench',say('Workbench','The soldering iron in its stand, an insulation tester, the meter he bought in Gothenburg in 1975, and a radio from the Higa house waiting for a valve.'));}
 // The club's reading room: the bookcases, four armchairs round the rug, the little bar, the window on the lightwell.
 {const [x0,y0,x1,y1]=room('b1-club');
  shelves(s,x0,x1,y1-.35,y1,[.02,.52,1.02,1.52,2.02],0x6b4a32,'y1');s.solid(x0,y1-.37,x1,y1,0,2.2);
  for(let i=0;i<60;i++){const shelf=Math.floor(i/15),k=i%15;s.box(.06,.24,.3-(k%3)*.04,x0+.3+k*.29+(k%2)*.02,y1-.18,.19+shelf*.5-(k%3)*.02,C.book[(i*7)%6]);}
  s.blk(1.3,6.6,0,3.5,8.4,.012,0x7a2f2f);
  for(const [x,y] of [[1.6,7.0],[3.2,7.0],[1.6,8.0],[3.2,8.0]]){s.box(.7,.7,.4,x,y,.22,0x6f4a3a);s.box(.7,.15,.5,x,y+(y<7.5?-.3:.3),.65,0x6f4a3a);s.solid(x-.36,y-.36,x+.36,y+.36,0,.9);}
  s.box(.6,.6,.04,2.4,7.5,.45,C.timberDark);s.solid(2.1,7.2,2.7,7.8,0,.47);
  s.blk(x0+.3,y0,0,3.4,y0+.5,1.05,C.timberDark);s.solid(x0+.3,y0,3.4,y0+.52,0,1.1);
  for(let i=0;i<6;i++)s.cyl(.04,.04,.28,x0+.6+i*.4,y0+.2,1.19,[0x3f6a4a,0x8a5a2b,0xe9e2d0][i%3],{segments:8});
  s.anchor(1.8,y0+.9,1.2,'Look at the bar',say('The club’s bar','Awamori in its jars, from Higa Liquor before it closed, a bottle of aquavit from the Christmas parcel, and the club’s book of who owes what.'));
  s.anchor(2.4,y1-.8,1.2,'Look at the club’s books',say('Reading club','The reading club’s shelves: this month Tanizaki, next month Lagerlöf in a translation nobody has finished. The minutes are kept by Nhung.'));
  for(const [x,y] of [[x0+.3,5.5],[x1-.3,y1-.6]]){s.cyl(.02,.02,1.5,x,y,.75,0x3a3632);s.cyl(.14,.2,.2,x,y,1.55,0xf3e7c4,{finish:'glow'});s.solid(x-.15,y-.15,x+.15,y+.15,0,1.6);}}
 // The stair hall: the preserves and the typhoon kit along the south wall (under the genkan), the dehumidifier.
 {const [x0,y0,x1]=room('b1-hall');
  shelves(s,5.3,7.6,y0,y0+.42,[.02,.6,1.2,1.78],C.timberLight,'y0');s.solid(5.3,y0,7.6,y0+.44,0,1.85);
  for(let i=0;i<12;i++)s.cyl(.06,.06,.16,5.5+(i%6)*.36,y0+.22,.7+Math.floor(i/6)*.6,[0xc0543e,0xd9b04a,0x6ea05a][i%3],{segments:8});
  for(let i=0;i<4;i++)s.box(.3,.3,.4,5.6+i*.55,y0+.22,.25,0x3f6a9a);
  s.anchor(6.45,y0+.9,1.2,'Look at the typhoon kit',say('Typhoon kit','Water for three days, candles, the battery radio, tinned saba, a first-aid box, and the shutter key on its red tag.'));
  s.box(.35,.25,.6,7.9,y0+.32,.3,C.white);s.solid(7.7,y0+.17,8.1,y0+.47,0,.62);
  s.anchor(7.6,y0+.9,.9,'Look at the dehumidifier',say('Dehumidifier','A Johansson D-20 dehumidifier, emptied every morning: a basement below the sea’s level is always damp.'));}
 // The boiler room: the water heater and the cold-water manifold where the drawings put them, the door to the court.
 {const [x0,y0,x1,y1]=room('b1-boiler');
  const hx=11.1,hy=2.2;s.cyl(.27,.27,1.3,hx,hy,.65,C.white,{segments:16});s.cyl(.06,.06,.25,hx,hy,1.42,0x8e979a);s.solid(hx-.3,hy-.3,hx+.3,hy+.3,0,1.6);
  s.box(.14,.02,.1,hx,hy-.275,1.0,0xc9cdd0,{finish:'metal'});
  s.anchor(10.3,hy,1.2,'Look at the water heater',say('Water heater','A Johansson 180-litre water heater, its flue going up through the house to the roof. Hot water needs the cold supply, its fuel, the heater healthy and its own small circuit; it makes about three litres a minute once the tank is drawn down.'));
  // The manifold on its stand: the cold main in, a valve for each branch, the labels in his hand.
  const mx=10.9,my=1.5;for(const x of [mx-.2,mx+.2])s.rod([x,my,0],[x,my,.95],.02,C.steel);
  s.rod([mx-.25,my,.9],[mx+.25,my,.9],.035,0x3f6a9a);for(let i=0;i<4;i++){const x=mx-.18+i*.12;s.rod([x,my,.9],[x,my,1.2],.015,0x3f6a9a);s.cyl(.03,.03,.02,x,my,1.05,0xb2453b,{rx:Math.PI/2});}
  s.solid(mx-.3,my-.15,mx+.3,my+.15,0,1.25);
  s.anchor(10.1,my,1.1,'Look at the water manifold',say('Cold-water manifold','The island’s water comes in through the meter and the shutoff to this manifold, and goes out to the house from it, one valve a branch: the kitchen, the WC, the bathroom, the sauna’s shower, the water heater.'));
  const bext=HOUSE_OPENINGS.find(o=>o.id==='D-BEXT');
  s.anchor((bext.from+bext.to)/2,y0+.8,1.2,'Try the court door',say('Court door','The steel door out to the court and the garden stair up to the front yard. Bolted for the typhoon season: you go out by the front.'));}
 // The sauna and shower: the cedar cabin in the south-east corner, the shower over the drain to the lift pump, the bench.
 {const [x0,y0,x1,y1]=room('b1-sauna'),cx=9.8,cy=5.2;
  // The cabin: its west wall and its north wall with the glass door, a ceiling of its own.
  s.blk(cx-.05,y0,0,cx+.05,cy,2.3,0xc9a37a);s.solid(cx-.05,y0,cx+.05,cy,0,2.3);
  for(const [a,b] of [[cx-.05,10.4],[11.1,x1]]){s.blk(a,cy-.05,0,b,cy+.05,2.3,0xc9a37a);s.solid(a,cy-.05,b,cy+.05,0,2.3);}
  s.blk(10.4,cy-.05,2,11.1,cy+.05,2.3,0xc9a37a);s.blk(10.42,cy-.02,0,11.08,cy,2,0xd8eef3,'gloss');s.solid(10.4,cy-.06,11.1,cy+.06,0,2);
  s.blk(cx+.05,y0,2.3,x1,cy+.05,2.36,0xc9a37a);s.blk(cx+.05,y0,-.01,x1,cy-.05,.01,0xc9a37a);
  for(const [x,h] of [[x1-.5,.45],[x1-.25,.9]])s.blk(cx+.05,y0+.05,h-.05,x+.25,y0+.75,h,0xd8b48a);
  s.box(.45,.45,.6,cx+.35,cy-.4,.3,0x3a3a3a);for(let i=0;i<6;i++)s.sphere(.06,cx+.25+(i%3)*.1,cy-.45+Math.floor(i/3)*.1,.63,0x8a8a8a);
  s.anchor(10.75,cy+.6,1.3,'Take a sauna',say('Bastu','The cedar cabin he built himself, the stove a Johansson Bastu 6 on the 200 V circuit. Eighty degrees, a ladle of water on the stones, then the cold shower: a Swede’s evening.'));
  // The shower over the drain: the channel at y 6.0 to the lift pump's pit under its cover, the rose on the east wall.
  s.blk(10.4,cy+.1,0,x1,y1,.012,C.tile);s.blk(10.765,5.965,.012,11.335,6.035,.016,0x5d6b70,'metal');
  s.blk(11.05,5.75,.012,11.55,6.25,.018,0x8e979a,'metal');
  s.rod([x1-.05,6.6,.9],[x1-.05,6.6,2.05],.015,0xc9cdd0);s.cyl(.07,.04,.05,x1-.15,6.6,2.05,0xc9cdd0);
  s.anchor(10.5,6.0,1,'Look at the lift pump cover',say('Lift pump','Under the plate, the pit and the pump that lifts the basement’s waste up to the drain the rest of the house falls to. It needs its own circuit, its check valve and a clear way out, and it rings an alarm when the pit fills.'));
  s.blk(8.5,y1-.4,0,9.6,y1,.45,C.timberLight);s.solid(8.5,y1-.42,9.6,y1,0,.48);for(const x of [8.6,8.95,9.3])s.box(.04,.08,.04,x,y1-.03,1.7,C.timberDark);}
 // The storage: shelves along the north wall, the fishing rods, the spare tiles; the far store's shelves.
 {const z=houseRoom('b1-storage').zones;const [ax0,ay0,ax1,ay1]=z[0],[bx0,by0,bx1,by1]=z[1];
  shelves(s,5.3,8.0,ay1-.45,ay1,[.02,.6,1.2,1.78],0x8e979a,'y1');s.solid(5.3,ay1-.47,8.0,ay1,0,1.85);
  for(let i=0;i<9;i++)s.box(.45,.4,.3,5.6+(i%3)*.85,ay1-.22,.2+Math.floor(i/3)*.6,[0xc9b48a,0x5d6b70,0x3f5f7a][i%3]);
  for(let i=0;i<4;i++)s.rod([ax0+.1,ay1-.6,.1+i*.05],[ax0+.12+i*.05,ay1-.6,2.2],.012,[0x2b2b2b,0x5a3f2a][i%2]);
  for(let i=0;i<5;i++)s.box(.3,.4,.04,5.4,7.0,.02+i*.04,0xc4553a);s.solid(5.2,6.75,5.6,7.25,0,.25);
  shelvesY(s,by0+.1,by1-.1,bx1-.5,bx1,[.02,.6,1.2,1.78],0x8e979a,'x1');s.solid(bx1-.52,by0,bx1,by1,0,1.85);
  for(let i=0;i<9;i++)s.box(.4,.45,.3,bx1-.25,by0+.45+(i%3)*.75,.2+Math.floor(i/3)*.6,[0xc9b48a,0x5d6b70,0x3f5f7a][i%3]);
  s.anchor(6.6,8.4,1.2,'Look at the storage',say('Storage','The fishing rods, the spare red tiles from the roof for after a typhoon, the deck chairs, and a box marked JUL with the Christmas star in it.'));}
}

// ---------------------------------------------------------------- the ground floor

function furnishGround(s,{action,television,post}){
 const say=(title,text)=>()=>action('inspect',title,text);
 // The genkan: the shoe cupboard under the boards, the umbrella stand, slippers at the stone's edge, the coat hooks.
 {const [x0,y0,x1]=room('g0-genkan'),D=GENKAN_STONE;
  s.blk(x1-.38,y0+.05,0,x1,D-.05,.95,C.timberLight);s.blk(x1-.4,y0+.05,.95,x1,D-.05,.98,C.timberDark);s.solid(x1-.4,y0,x1,D,0,1);
  s.cyl(.12,.11,.5,x0+.2,y0+.25,.25,0x5d6b70,{segments:10});s.rod([x0+.18,y0+.25,.1],[x0+.22,y0+.27,.85],.015,0x2b2b2b);s.solid(x0,y0,x0+.34,y0+.4,0,.6);
  for(const [x,c] of [[5.6,0x2f4f6f],[5.85,0x2f4f6f],[6.3,0xb2453b],[6.55,0xb2453b]])s.box(.1,.26,.04,x,D+.25,.02,c);
  for(const y of [.55,.8,1.05])s.box(.06,.06,.06,x0+.03,y,1.75,C.timberDark);
  s.box(.03,.3,.4,x0+.03,.8,1.42,0xc9a64a);
  s.anchor(x1-.6,.8,1.1,'Look in the shoe cupboard',say('Shoe cupboard','His black shoes for assembly days, Thuan’s sandals, two pairs of gumboots for the typhoon, and the shoehorn from the Stockholm ferry. Shoes come off on the stone, slippers on at its edge.'));
  // The letter box on the inside of the front door, under the slot (src/mail/post.js): when something unread is in it,
  // the tops of the envelopes show over its lip, and that is the only signal.
  const fd=HOUSE_OPENINGS.find(o=>o.id==='D-ENTRY'),lx=(fd.from+fd.to)/2,ly=.2,lh=.85;
  s.mesh(.34,.012,.26,lx,ly-.054,lh,0xd9d4c3,'Letter box back');
  for(const sx of [-1,1])s.mesh(.012,.12,.26,lx+sx*.164,ly,lh,0xd9d4c3,'Letter box side');
  s.mesh(.34,.12,.012,lx,ly,lh-.124,0xd9d4c3,'Letter box floor');
  s.mesh(.34,.012,.2,lx,ly+.054,lh-.03,0xd9d4c3,'Letter box front');
  s.mesh(.35,.022,.02,lx,ly+.056,lh+.075,0xbfb9a8,'Letter box lip');
  const envelopes=[[-.06,.02,0xf6f2e6],[.05,-.01,0xe9dcc3]].map(([dx,tilt,c])=>{const e=s.mesh(.17,.008,.12,lx+dx,ly-.01,lh+.06,c,'Envelope in the letter box');e.rotation.z=tilt;e.visible=false;return e;});
  s.refreshPost=()=>{const n=post?.unread?.()||0;envelopes.forEach((e,i)=>{e.visible=n>i;});};s.refreshPost();
  s.anchor(lx,.75,1.05,'Check the post',()=>{post?.open?.();s.refreshPost();});}
 // The hall: the telephone on its shelf on the north wall, a bench by the kitchen's door.
 {const [x0,y0,x1,y1]=room('g0-hall');
  s.box(.5,.3,.03,6.3,y1-.15,.8,C.timberDark);s.box(.22,.18,.08,6.3,y1-.15,.86,0x1f1f1f);for(const x of [6.1,6.5])s.rod([x,y1-.02,.78],[x,y1-.28,.78],.01,C.steel);
  s.anchor(6.3,y1-.6,1.1,'Look at the telephone',say('Telephone','The black telephone. Taped to the shelf: the town hall, the ferry office, Sakura Shōten, and the clinic.'));
  s.blk(5.3,y1-.4,0,5.9,y1,.45,C.timber);s.solid(5.3,y1-.42,5.9,y1,0,.48);}
 // The living room: the low table and its four cushions, the television, the photograph, the keepsake shelf (Studio).
 {const [x0,y0,x1,y1]=room('g0-living'),tx=2.6,ty=2.5;
  s.box(1.1,.75,.05,tx,ty,.335,C.timberDark);for(const [dx,dy] of [[-.5,-.32],[.5,-.32],[-.5,.32],[.5,.32]])s.box(.05,.05,.32,tx+dx,ty+dy,.16,0x5a3f2a);
  s.solid(tx-.55,ty-.38,tx+.55,ty+.38,0,.42);
  s.box(.35,.35,.08,tx-.15,ty+.05,.4,0xf2efe6);s.cyl(.04,.035,.1,tx+.05,ty-.1,.41,0x3f7a55);
  const seats=[[tx,ty-.85,0],[tx,ty+.85,Math.PI],[tx-.85,ty,-Math.PI/2],[tx+.85,ty,Math.PI/2]];
  for(const [x,y] of seats)s.mesh(.5,.5,.08,x,y,.04,0xb2453b,'Zabuton');
  const [cx,,cz]=s.at(tx,ty,0);
  for(const [x,y] of seats){
   // The cushion's seat, facing the table: in the room's frame he looks along (−sin yaw, −cos yaw), and stands up
   // behind the cushion, away from the table.
   const [px,,pz]=s.at(x,y,0),yaw=Math.atan2(px-cx,pz-cz);
   const o=s.anchor(x,y,.8,'Sit at the low table',()=>action('seat','Low table','Tea from the thermos, still warm. Through the window, the hinpun and the lane, and somebody’s bicycle going down to the pier.'));
   o.userData.seat={position:[px,0,pz],stand:[px+Math.sin(yaw)*.75,0,pz+Math.cos(yaw)*.75],surfaceY:.09,eyeY:.82,yaw,pitch:0,front:.25};
  }
  // The television on its cabinet against the north wall, facing the table.
  s.box(.9,.4,.45,tx+.6,y1-.22,.23,C.timberDark);s.solid(tx+.13,y1-.45,tx+1.07,y1,0,1);
  s.box(.62,.45,.48,tx+.6,y1-.25,.7,0x2b2b2b);s.mesh(.52,.02,.36,tx+.6,y1-.48,.72,0x3a5260,'Television screen');
  s.anchor(tx+.6,y1-.8,1,'Watch the television',()=>{const news=television?.();if(news)action('watch',news.title,news.text);else action('inspect','Television','NHK Okinawa: the weather map with a typhoon symbol far to the south, then sumo highlights. You leave it on low for company.');});
  // The photograph on the west wall: a harbour in Sweden, and this one the year he came.
  s.box(.03,.5,.38,x0+.02,ty,1.75,0x3a3a3a);s.box(.01,.44,.32,x0+.04,ty,1.75,0xe9dcc3);
  for(const [dy,sea,roof] of [[-.11,0x7498aa,0xac5149],[.11,0x78aaa2,0xae8063]]){s.box(.01,.19,.09,x0+.045,ty+dy,1.69,sea);s.box(.01,.08,.07,x0+.05,ty+dy,1.78,roof);}
  s.anchor(x0+.5,ty,1.7,'Look at the photograph',say('Photograph','Two pictures in one frame: a red wooden boathouse on a grey Swedish shore, and this harbour in 1979, the year you stepped off the ferry and did not get back on.'));
  // The walls over the dado, in the colour chosen in Johansson Studio (interiors/home-customization.js recolours every
  // 'Upper wall'): the four walls of the living room between their openings, and the dado rail under them.
  const lining=(x0,y0,x1,y1,h0=.9,h1=2.5)=>{const w=Math.max(.01,x1-x0),d=Math.max(.01,y1-y0);s.mesh(w,d,h1-h0,(x0+x1)/2,(y0+y1)/2,(h0+h1)/2,0xefe6d2,'Upper wall');if(h0<1)s.box(w+(d>w?.02:0),d+(w>d?.02:0),.04,(x0+x1)/2,(y0+y1)/2,h0,C.timberDark);};
  lining(x0,y0,x0+.01,y1);lining(x0,y1-.01,x1,y1);
  lining(x1-.01,y0,x1,2.27);lining(x1-.01,3.23,x1,y1);lining(x1-.01,2.27,x1,3.23,2.14,2.5);
  lining(x0,y0,1.4,y0+.01);lining(3.4,y0,x1,y0+.01);lining(1.4,y0,3.4,y0+.01,2.12,2.5);
  // The air conditioner over the window, and the fan in the corner for the days it is not worth switching on.
  s.box(.85,.24,.28,2.4,y0+.14,2.28,C.white);s.box(.8,.02,.02,2.4,y0+.27,2.18,0xc9cdd0);
  s.cyl(.03,.03,1,x1-.35,y0+.4,.5,0xd8dcdc);s.cyl(.2,.2,.1,x1-.35,y0+.4,1.05,0xa8c8d8,{rx:Math.PI/2});s.solid(x1-.55,y0,x1,y0+.6,0,1.2);
 }
 // The kitchen along the west wall, under its window, and the dining table under the north window.
 {const [x0,y0,x1,y1]=room('g0-kitchen');
  s.blk(x0,5.9,0,x0+.65,9.0,.85,0xe8e3d6);s.blk(x0,5.9,.85,x0+.67,9.0,.89,0x9aa3a6);s.solid(x0,5.9,x0+.67,9.0,0,.9);
  s.blk(x0+.12,7.4,.79,x0+.52,8.0,.89,0x8e979a,'metal');s.rod([x0+.06,7.7,.89],[x0+.2,7.7,1.15],.012,0xc9cdd0);
  s.box(.5,.55,.04,x0+.33,6.4,.91,0x2b2b2b);for(const y of [6.27,6.53])s.cyl(.09,.09,.02,x0+.33,y,.94,0x555555);
  s.box(.28,.3,.26,x0+.3,8.55,1.02,C.white);s.cyl(.09,.1,.2,x0+.35,6.9,.99,0xc0543e,{finish:'gloss'});
  s.blk(x0,9.1,0,x0+.7,y1,1.75,0xe8ebe6);s.solid(x0,9.1,x0+.72,y1,0,1.75);
  s.blk(x0,5.9,1.55,x0+.35,6.85,2.25,0xe8e3d6);s.blk(x0,8.55,1.55,x0+.35,9.0,2.25,0xe8e3d6);
  s.anchor(x0+.8,6.9,1.1,'Make tea',say('Kettle','You put the kettle on. Jasmine tea, the way Thuan makes it, in the pot her mother sent from Hội An.'));
  s.anchor(x0+.8,9.45,1.2,'Look in the fridge',say('Fridge','Orion beer from Sakura, goya for tomorrow, a jar of Thuan’s nước chấm, and the herring Mr Higa ordered in for midsummer.'));
  // The dining table for four, under the north window.
  const dx=2.5,dy=8.75;s.box(1.4,.8,.04,dx,dy,.72,C.timberDark);for(const [a,b] of [[-.62,-.33],[.62,-.33],[-.62,.33],[.62,.33]])s.box(.05,.05,.7,dx+a,dy+b,.35,0x5a3f2a);
  s.solid(dx-.7,dy-.4,dx+.7,dy+.4,0,.76);
  for(const [cx,cy,bx,by] of [[dx-.4,dy-.7,0,-1],[dx+.4,dy-.7,0,-1],[dx-.95,dy,-1,0],[dx+.95,dy,1,0]]){
   s.box(.42,.42,.04,cx,cy,.45,C.timber);s.box(bx?.04:.4,bx?.4:.04,.45,cx+bx*.19,cy+by*.19,.7,C.timber);
   for(const [a,b] of [[-.18,-.18],[.18,-.18],[-.18,.18],[.18,.18]])s.box(.03,.03,.43,cx+a,cy+b,.215,C.timberDark);
   s.solid(cx-.21,cy-.21,cx+.21,cy+.21,0,.48);}
  // The china cupboard on the hall's wall, south of its door.
  s.blk(x1-.42,5.3,0,x1,6.8,1.8,C.timberDark);s.blk(x1-.43,5.35,.9,x1-.41,6.75,1.75,0xbfe0e8,'gloss');s.solid(x1-.43,5.3,x1,6.8,0,1.8);}
 // Thuan's sewing studio: her machine at the east window, the cutting table, the fabric shelves, the dress form.
 {const [x0,y0,x1,y1]=room('g0-sewing');
  s.blk(x1-.7,1.3,0,x1,2.9,.72,C.timberLight);s.solid(x1-.72,1.3,x1,2.9,0,.75);
  s.box(.45,.22,.3,x1-.38,2.1,.87,0xe9e2d0);s.box(.1,.2,.18,x1-.55,2.1,.94,0xe9e2d0);s.box(.3,.03,.05,x1-.3,2.1,1.03,0xb2453b);
  s.box(.45,.45,.04,x1-1.05,2.1,.45,C.timber);s.solid(x1-1.28,1.88,x1-.82,2.32,0,.48);
  s.anchor(x1-1,2.1,1.1,'Look at Thuan’s sewing machine',say('Sewing machine','A Johansson Model 7 sewing machine on its own circuit, its plate polished. Under the foot, a half-made kariyushi shirt for you, the pattern pinned to it, hibiscus on navy.'));
  s.blk(9.4,3.7,0,10.9,4.5,.86,C.timberLight);s.solid(9.38,3.68,10.92,4.52,0,.9);
  for(const [i,c] of C.fabric.entries())s.box(.25,.3,.04,9.6+i*.22,4.1,.88+i*.005,c);
  shelves(s,8.6,11.4,y0,y0+.4,[.02,.6,1.2,1.78],C.timberDark,'y0');s.solid(8.6,y0,11.4,y0+.42,0,1.8);
  for(let i=0;i<18;i++)s.cyl(.07,.07,.36,8.85+(i%6)*.45,y0+.22,.11+Math.floor(i/6)*.58,C.fabric[(i*5)%6],{rz:Math.PI/2,segments:8});
  // The dress form: a padded linen torso (hips, waist, bust, shoulders) on a turned stand with three feet.
  const fx=9.0,fy=1.4,linen=0xd9cbb0;
  for(const a of [0,2.1,4.2])s.rod([fx,fy,.32],[fx+Math.cos(a)*.24,fy+Math.sin(a)*.24,.02],.014,0x5a3f2a);
  s.cyl(.018,.018,.62,fx,fy,.6,0x5a3f2a);
  s.sphere(.17,fx,fy,.98,linen,{sx:1,sy:.9,sz:.72});s.cyl(.12,.15,.22,fx,fy,1.12,linen,{segments:14});
  s.sphere(.18,fx,fy,1.32,linen,{sx:1,sy:.9,sz:.7});s.cyl(.16,.17,.1,fx,fy,1.46,linen,{segments:14});
  s.cyl(.045,.06,.08,fx,fy,1.55,linen,{segments:10});s.sphere(.035,fx,fy,1.61,0x5a3f2a);
  // A tape measure round its neck.
  s.box(.012,.3,.02,fx+.06,fy,1.4,0xe8c84a);s.solid(fx-.22,fy-.22,fx+.22,fy+.22,0,1.65);}
 // The WC and utility room (one room, as drawn): the toilet at the east end, the basin, the washing machine, the sink.
 {const [x0,y0,x1,y1]=room('g0-wc');
  s.mesh(.55,.4,.4,x1-.35,6.3,.2,0xf4f6f6,'Toilet');s.mesh(.16,.42,.5,x1-.1,6.3,.65,0xeef2f2,'Toilet cistern');s.solid(x1-.62,6.08,x1,6.52,0,.6);
  s.box(.3,.35,.2,x1-.2,y1-.22,.85,0xf4f6f6);s.box(.3,.02,.4,x1-.2,y1-.02,1.35,0xcfe0e6,{finish:'gloss'});s.solid(x1-.37,y1-.42,x1,y1,0,.95);
  s.anchor(x1-.8,6.3,1,'Use the toilet',say('WC','A Johansson Washlet, the seat warm. On the shelf, a wooden Dala horse Thuan finds funny.'));
  s.box(.6,.6,.85,9.0,y0+.32,.43,C.white);s.cyl(.17,.17,.02,9.0,y0+.63,.55,0x8e979a,{rx:Math.PI/2});s.solid(8.68,y0,9.32,y0+.64,0,.9);
  s.blk(9.5,y0,0,10.1,y0+.5,.8,0xe8e3d6);s.blk(9.6,y0+.08,.7,10.0,y0+.42,.81,0x8e979a,'metal');s.solid(9.48,y0,10.12,y0+.52,0,.82);}
 // The covered terrace's lobby: boots, the garden tools on the wall, the potting bench beside the terrace door.
 {const [x0,y0,x1,y1]=room('g0-terrace');
  s.blk(x1-.4,y0+.2,0,x1,8.6,.4,C.timberDark);s.solid(x1-.42,y0+.2,x1,8.6,0,.4);
  for(const [y,c] of [[7.6,0x2b2b2b],[7.85,0x2b2b2b],[8.15,0x3f6a4a],[8.4,0x3f6a4a]])s.box(.12,.25,.35,x1-.2,y,.57,c);
  for(const [x,h] of [[9.0,1.5],[9.3,1.6],[9.6,1.4]]){s.rod([x,y0+.04,.15],[x,y0+.04,h],.02,0x8a6641);s.box(.25,.05,.12,x,y0+.06,.12,C.steel);}
  s.blk(10.2,y1-.6,0,x1,y1,.85,C.timberLight);s.solid(10.2,y1-.62,x1,y1,0,.9);for(const x of [10.6,11.1])s.cyl(.09,.07,.14,x,y1-.3,.92,0xb8643c);
  s.anchor(9.3,y0+.6,1.2,'Look at the garden tools',say('Garden tools','The rake, the spade and Thuan’s hoe for the goya bed, each on its own hook, the hooks labelled.'));}
}

// ---------------------------------------------------------------- the upper floor

function furnishUpper(s,{action,sleep,owned}){
 const say=(title,text)=>()=>action('inspect',title,text);
 // Their bedroom: his futon laid out, Thuan's folded in the corner by day, the wardrobe and its mirror, her dresser.
 {const [x0,y0,x1,y1]=room('l1-bedroom'),fx=2.6,fy=2.6;
  const futon=s.mesh(1,2,.1,fx,fy,.05,0xe9dfc8,'Futon');futon.userData.bed=true;
  s.mesh(.95,1.3,.06,fx,fy-.3,.12,0x2c3e5c,'Quilt');s.mesh(.7,.35,.1,fx,fy+.8,.15,0xf3e8d2,'Pillow');
  const hers=s.mesh(.9,.5,.42,x1-.6,y0+.4,.21,0xf1e6e0,'Futon Thuan');hers.userData.bed=true;
  s.mesh(.86,.46,.08,x1-.6,y0+.4,.46,0xb2453b,'Thuan’s quilt');s.mesh(.5,.3,.1,x1-.6,y0+.4,.55,0xf3e8d2,'Thuan’s pillow');
  s.solid(x1-1.06,y0,x1-.14,y0+.66,0,.6);
  s.anchor(fx,fy,.6,'Lie down on the futon',()=>sleep?sleep():action('inspect','Futon','Folded square every morning, the way the harbour master taught you.'));
  s.blk(x0,3.3,0,x0+.6,4.4,1.9,0x7a5a3e);s.solid(x0,3.3,x0+.62,4.4,0,1.9);
  const mirror=new THREE.Mesh(new THREE.PlaneGeometry(.38,1.3),new THREE.MeshStandardMaterial({color:0xcfe0e6,roughness:.08,metalness:.6}));mirror.position.set(...s.at(x0+.61,3.85,1.05));mirror.rotation.y=Math.PI/2;mirror.name='Wardrobe mirror';s.group.add(mirror);
  s.anchor(x0+.9,3.85,1.3,'Look in the wardrobe mirror',say('Wardrobe','Three kariyushi shirts, a suit for assembly days and a straw hat. Thuan’s áo dài in its bag at the end.'));
  s.blk(x1-.45,y0+1,0,x1,y0+1.8,.75,C.timberDark);s.box(.04,.6,.7,x1-.43,y0+1.4,1.15,0xcfe0e6,{finish:'gloss'});s.solid(x1-.47,y0+1,x1,y0+1.8,0,.8);
  s.box(.22,.22,.4,x0+.35,y0+.35,.2,0xf3e7c4,{finish:'glow'});
  s.box(.85,.24,.28,2.25,y0+.14,2.28,C.white);}
 // The guest room: tatami, the closet of guests' futons behind its sliding doors, a low table.
 {const [x0,y0,x1,y1]=room('l1-guest');
  s.blk(1.9,y1-.75,0,x1,y1,2.3,0xf6efdc);for(let x=1.9;x<=x1;x+=.73)s.blk(x-.02,y1-.77,0,x+.02,y1-.74,1.9,C.timberDark);s.blk(1.9,y1-.77,1.88,x1,y1-.74,1.92,C.timberDark);s.solid(1.9,y1-.77,x1,y1,0,2.3);
  s.box(.9,.6,.04,2.6,7.3,.33,C.timberDark);for(const [a,b] of [[-.4,-.25],[.4,-.25],[-.4,.25],[.4,.25]])s.box(.04,.04,.3,2.6+a,7.3+b,.15,0x5a3f2a);s.solid(2.15,7,3.05,7.6,0,.38);
  for(const y of [6.75,7.85])s.box(.45,.45,.07,2.6,y,.035,0x3f6a4a);
  s.anchor(2.6,8.4,1,'Open the guest closet',say('Guest closet','Two futons for guests, aired last Sunday, and the cushions. Thuan’s sisters sleep here when the last boat has gone.'));}
 // The stair hall over the genkan: the low cupboard of suitcases along the south wall, a plant by the well.
 {const [x0,y0,x1]=room('l1-hall');
  s.blk(5.3,y0,0,7.7,y0+.45,.8,C.timberLight);s.blk(5.28,y0,.8,7.72,y0+.47,.83,C.timberDark);s.solid(5.28,y0,7.72,y0+.47,0,.85);
  for(const [x,c] of [[5.6,0x3f5f7a],[6.15,0x6f2f2f],[6.75,0xc9b48a]])s.box(.45,.35,.3,x,y0+.22,.98,c);
  s.anchor(6.5,y0+.9,1.1,'Look at the suitcases',say('Suitcases','The suitcases, the box of Christmas things marked JUL in his hand, Thuan’s winter coat from Hà Nội in its bag, and the town’s spare flags.'));
  s.cyl(.18,.14,.35,7.75,2.0,.18,0xb8643c);s.sphere(.3,7.75,2.0,.7,0x3f7440);s.solid(7.55,1.8,7.95,2.2,0,.8);}
 // The bathroom: the changing room by the door with the basin and the washing machine, the wet room past the glass
 // screen with the ofuro under the window and the washing place.
 {const [x0,y0,x1,y1]=room('l1-bathroom'),scr=2.2;
  for(const [a,b] of [[x0,9.9],[10.7,x1]]){s.blk(a,scr-.03,0,b,scr+.03,2.1,0xd8eef3,'gloss');s.solid(a,scr-.03,b,scr+.03,0,2.1);}
  s.blk(9.9,scr-.03,2.0,10.7,scr+.03,2.1,C.sash);
  s.blk(10,y1-.5,0,10.8,y1,.85,C.white);s.box(.7,.03,.7,10.4,y1-.02,1.4,0xcfe0e6,{finish:'gloss'});s.solid(10,y1-.52,10.8,y1,0,.9);
  s.box(.6,.6,.85,x1-.35,y1-.35,.43,C.white);s.solid(x1-.66,y1-.66,x1,y1,0,.9);
  s.blk(x1-.8,y0,0,x1,y0+1.75,.55,0x7fb8c8);s.mesh(.6,1.55,.04,x1-.4,y0+.88,.5,0xbfe0e8,'Bath (ofuro)');s.solid(x1-.82,y0,x1,y0+1.77,0,.6);
  s.box(.32,.32,.25,10.2,1.2,.13,0xe9e2d0);s.box(.05,.4,.6,x0+.03,1.3,1.2,0xcfe0e6,{finish:'gloss'});s.rod([x0+.05,1.6,.9],[x0+.05,1.6,1.9],.015,0xc9cdd0);
  s.anchor(x1-1.1,1.0,1,'Run a bath',say('Ofuro','You run the bath deep and hot, wash first at the stool, then sit in it to the chin with the window open on the sea.'));}
 // The study: his desk at the east window, the bookshelf on the south wall, the ship's clock. Since 21 October 2026 it is
 // also where the mayor's office went (the owner: "remove the mayors office and put it on the tropical island … or even
 // rework it into one of the rooms in Johansson's house"): its computer, with the Community Hall's register on it, and
 // the Merry Moose on its plinth by the door. He is the ship's chief engineer, not a mayor; the papers are the ship's.
 {const [x0,y0,x1,y1]=room('l1-study');
  s.blk(x1-.7,4.4,0,x1,6.1,.73,C.timberDark);s.solid(x1-.72,4.4,x1,6.1,0,.76);
  s.box(.3,.4,.02,x1-.4,4.75,.75,0xf2efe6);s.box(.25,.15,.14,x1-.4,5.55,.8,0x638574);s.cyl(.02,.06,.4,x1-.15,4.5,.93,0x2b2b2b);
  // The office's 1990s computer: the beige CRT against the window, the keyboard in front of it, facing his chair.
  s.mesh(.29,.34,.24,x1-.3,5.25,.85,0xd9d4b8,'CRT monitor casing');s.mesh(.015,.28,.18,x1-.452,5.25,.86,0x263c38,'CRT screen');
  s.mesh(.13,.38,.025,x1-.6,5.25,.745,0xd8d4bb,'Keyboard');
  s.box(.45,.45,.04,x1-1.05,5.25,.45,C.timber);s.solid(x1-1.28,5.02,x1-.82,5.48,0,.48);
  shelves(s,8.7,10.4,y0,y0+.32,[.02,.57,1.12,1.68],0x8a6a4a,'y0');s.solid(8.7,y0,10.4,y0+.34,0,1.7);
  for(let i=0;i<27;i++)s.box(.06,.22,.26-(i%3)*.03,8.82+(i%9)*.17,y0+.15,.17+Math.floor(i/9)*.55-(i%3)*.015,C.book[(i*5)%6]);
  s.anchor(9.55,y0+.7,1.2,'Look at the bookshelf',()=>action('read','Bookshelf','Sea charts of the Ryūkyū arc. A Swedish–Japanese dictionary with a cracked spine. Three Wallander paperbacks. The Minato Maru\u2019s engine manuals, with coffee rings.'));
  s.cyl(.14,.14,.05,10.2,y1-.03,1.9,0xb8913f,{rx:Math.PI/2,segments:16});
  s.anchor(x1-1.05,5.25,1.2,'Sit at the desk',say('Desk','The ship\u2019s papers in two piles: the engine log to sign and the parts to order for the Thursday ferry. The radio on low, the ship\u2019s clock striking the watch.'));
  s.anchor(x1-.75,5.25,1.0,'Use the computer',()=>action('document-archive','Community Hall Document Register'));
  // The Merry Moose, the island's good-luck moose, on its plinth in the corner by the door, where you see it coming in.
  s.blk(8.54,y1-.6,0,8.96,y1-.18,.5,C.timberDark);s.solid(8.54,y1-.6,8.96,y1-.18,0,1.1);
  owned.push(addOwnedCharacter({parent:s.group,kind:'merry_Moose',height:.6,position:s.at(8.75,y1-.39,.5),yaw:Math.PI/4}));
  s.anchor(9.1,y1-.8,1.0,'Look at the Merry Moose',say('The Merry Moose','The island\u2019s good-luck moose. It stood by the mayor\u2019s desk at the town hall until the office went; the town gave it to Nils to keep. Thuan pats its nose on the way past; the paint there is wearing thin.'));}
 // The linen room and landing: shelves of sheets and towels in the far room, the airing rail under the landing window.
 {const z=houseRoom('l1-linen').zones,[ax0,ay0,ax1,ay1]=z[0],[bx0,by0,bx1,by1]=z[1];
  shelvesY(s,by0+.1,8.4,bx1-.5,bx1,[.02,.6,1.2,1.78],C.timberLight,'x1');s.solid(bx1-.52,by0,bx1,8.4,0,1.85);
  for(let i=0;i<6;i++)s.box(.4,.35,.12,bx1-.25,by0+.4+(i%2)*.55,.12+Math.floor(i/2)*.6,[0xf4f5f2,0xe6dccb,0xc9d6d6][i%3]);
  s.rod([8.7,by1-.25,1.5],[10.3,by1-.25,1.5],.015,C.steel);for(const x of [8.9,9.4,9.9])s.box(.4,.02,.6,x,by1-.25,1.2,[0xf4f5f2,0x2f4f6f,0xb2453b][Math.round((x-8.9)*2)]);
  for(const x of [8.7,10.3])s.rod([x,by1-.25,0],[x,by1-.25,1.5],.012,C.steel);s.solid(8.65,by1-.32,8.75,by1-.18,0,1.5);s.solid(10.25,by1-.32,10.35,by1-.18,0,1.5);
  s.cyl(.25,.2,.45,ax1-.5,ay1-.5,.23,0xc9b48a,{segments:10});s.solid(ax1-.76,ay1-.76,ax1-.24,ay1-.24,0,.46);
  s.anchor(9.6,8.3,1.2,'Look at the linen',say('Linen room','Sheets folded in thirds, the towels by colour, his sauna towel apart from the rest.'));}
}
