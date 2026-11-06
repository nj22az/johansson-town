import * as THREE from '../../../vendor/three.module.js';
import {MINATO_COMPACT as P} from './minato-compact-plan.js';
import {createDrinkProp,setPropPortion,updatePropPortion} from '../../people/izakaya-beer.js';

/**
 * Where Thao gets every drink she serves (the owner, 21 October 2026: "it's better if the bottles in the izakaya bar
 * desk is where Thao gets the drink for the person who orders… now she just brings by magic"). Nothing is poured from
 * nowhere: each drink has a place it comes from, and the glass she sets down in front of you is the one she took.
 *
 * - The glass rack on the worktop: the empty draught mugs, rocks glasses and tumblers, washed and waiting.
 * - The Orion draught tap beside it: the keg is in the worktop's cupboard; the mug fills under the spout.
 * - The back bar: awamori is Sango Quay, the house's everyday pour (izakaya-walnut.js), the bottle on the middle
 *   shelf at her shoulder (the walnut export's bottle 25), taken down, poured at the worktop and put back.
 * - The cold store's upper door: the big Orion bottles with a chilled glass beside each, the cans and the jug of
 *   oolong tea. She opens the door, takes what was ordered and shuts it.
 * - The rear unit beside the range: the sake set, its tokkuri warmed in the simmer pan.
 *
 * Coordinates are the room's (the compact plan, minato-compact-plan.js). Thao works from her aisle, between the
 * worktop (its back edge at z -1.80) and the back bar (its cupboard front at z -3.05).
 */
const W=P.worktop,top=W.top,edge=W.position[2]-W.depth/2,S=P.storage,store=S.position,rear=P.sink;
// Where she walks to (her walker keeps 0.3 m from every solid) and where she then steps in to work: as near as her
// body is (0.11 m in front of her middle, 2 cm of air), so her short arm reaches what she takes.
const AT_WORKTOP=edge-.36,AT_BACK=-2.70,IN_WORKTOP=edge-.17,IN_BACK=-2.92;
const BACKBAR=P.backbar.position;
// Bottle 25, SANGO QUAY, from the back bar's middle shelf (art/izakaya/walnut-runtime-report.json). The bottle in use
// stands out at the front of the back counter's slate, as a bar keeps the one it is pouring from: its place on the
// shelf is empty while it is out, and the shelves are beyond Thao's arm (her shoulder is below the slate).
const SANGO_LOCAL=[.364,1.5035,.0846],SANGO_FRONT=-3.13,SLATE=1.03;
// `over`: the top of what is in front of her there, which anything in her hand is carried above as she steps in.
const at=(x,inZ,outZ,yaw,over=top)=>({stand:[x,outZ],close:[x,inZ],yaw,over});
export const MINATO_BAR=Object.freeze({
 top,
 // Between the prep board and the grill the worktop is clear for 0.9 m (between the oden pot and the board stands the
 // oshibori warmer): the rack, the pour and the tap stand there, where her hand reaches from the aisle and the
 // counter can watch.
 rack:Object.freeze({...at(-1.06,IN_WORKTOP,AT_WORKTOP,Math.PI),
  // Eight clean glasses, the nearer row within her reach of the worktop's edge; she tops the rack up from the glass
  // washer under the worktop when she is back at her station. A draught mug is 0.145 m across with its handle (to +x),
  // so the mugs stand 0.15 m apart, each handle clear of the next mug, and the two rocks glasses go to the back row
  // with the tumblers.
  slots:Object.freeze({draft:[[-1.25,-1.72],[-1.10,-1.72],[-.95,-1.72]],oolong:[[-1.26,-1.61],[-1.165,-1.61],[-1.07,-1.61]],awamori:[[-.975,-1.61],[-.88,-1.61]]}),
  tray:[-1.06,-1.665,.48,.22],
  purpose:'The night’s clean glasses, beside the prep board, where each pour starts.'}),
 // A glass stands on a ribbed mat (the pour) or the tap's grille: on the ribs' crests, never flat on a flat top.
 pour:Object.freeze({...at(-.70,IN_WORKTOP,AT_WORKTOP,Math.PI),glass:[-.70,top+.007,-1.72],
  purpose:'The clear stretch of worktop where she pours, in sight of the counter.'}),
 tap:Object.freeze({...at(-.52,IN_WORKTOP,AT_WORKTOP,Math.PI),at:[-.52,top,-1.60],glass:[-.52,top+.013,-1.72],
  purpose:'Orion on draught: the keg is in the worktop cupboard below, the tap where she can pull it from the aisle.'}),
 shelf:Object.freeze({...at(BACKBAR[0]+SANGO_LOCAL[0],IN_BACK,AT_BACK,0,SLATE),brand:'sango_quay',name:'Sango Quay',source:'Bottle 25 | SANGO QUAY',
  bottle:[BACKBAR[0]+SANGO_LOCAL[0],BACKBAR[1]+SANGO_LOCAL[1],BACKBAR[2]+SANGO_LOCAL[2]],
  inUse:[BACKBAR[0]+SANGO_LOCAL[0],SLATE,SANGO_FRONT],
  purpose:'The house awamori: its bottle off the middle shelf, standing at the front of the back counter while it is poured.'}),
 store:Object.freeze({...at(store[0]+.18,IN_BACK,AT_BACK,0,.83),
  // The upper door (build-minato-compact.py: from 0.82 m to the top, hinged on the left, its pull on the right).
  door:Object.freeze({hinge:[store[0]-S.width/2+.015,store[2]+S.depth/2+.008],width:S.width-.03,low:.82,high:S.height-.018,thick:.035,open:-1.05}),
  // The compartment's floor, at her waist; everything along its front, where she reaches it through the door (open
  // to 60°, her hand on its pull all the way), standing in front of what she takes.
  shelfY:.835,
  stock:Object.freeze({bottle:[[.06,-3.20],[.27,-3.20]],can:[[.41,-3.19]],oolong:[[.51,-3.21]]}),
  // Her right side stays clear of the rear unit's corner beside the store.
  maxStandX:.52,
  purpose:'The cold store’s upper compartment: the big Orion bottles with their chilled glasses, the cans, the oolong jug.'}),
 sink:Object.freeze({...at(rear.basinX,IN_BACK,AT_BACK,0),at:[rear.basinX,top-.04,-3.26],
  purpose:'The wash basin: a drink nobody is waiting for goes down it, the glass into the washer.'}),
 // What her hands go over, never through ([min, max] in the room): the worktop, the back bar's cupboard below the
 // shelves (its slate at 1.03 m), the cold store below its upper door, and the rear washing and cooking unit.
 solids:Object.freeze([
  [[W.position[0]-W.width/2,0,edge],[W.position[0]+W.width/2,top,W.position[2]+W.depth/2]],
  [[BACKBAR[0]-P.backbar.width/2,0,-3.69],[BACKBAR[0]+P.backbar.width/2,SLATE,-3.05]],
  [[store[0]-S.width/2,0,store[2]-S.depth/2],[store[0]+S.width/2,.83,store[2]+S.depth/2]],
  [[rear.position[0]-rear.width/2,0,rear.position[2]-rear.depth/2],[rear.position[0]+rear.width/2,rear.top,rear.position[2]+rear.depth/2]],
 ].map(([a,b])=>Object.freeze([Object.freeze(a),Object.freeze(b)]))),
 warmer:Object.freeze({...at(rear.rangeX-.27,IN_BACK,AT_BACK,0),set:[rear.rangeX-.27,rear.top,rear.position[2]+.17],
  purpose:'Beside the range, a sake set; its tokkuri is warmed in the simmer pan.'}),
});
/** What each drink needs, in the order she does it. */
export const BAR_ROUNDS=Object.freeze({
 draft:['rack','tap','pick','serve'],
 awamori:['rack','set','shelf','pour','return','pick','serve'],
 oolong:['rack','set','store','pour','return','pick','serve'],
 bottle:['store','set','pour-own','pick','serve'],
 can:['store','serve'],
 sake:['warmer','serve'],
});

const steel=()=>new THREE.MeshStandardMaterial({color:0xb9bdb7,metalness:.55,roughness:.38});
/** Round ribs across a mat, their crests 3 mm above `y` (eight-sided, an edge up: nothing flat to stand on). */
function ribs(parent,name,x,z,w,d,y,material){for(let i=0;i<=Math.floor((d-.02)/.02);i++){const r=new THREE.Mesh(new THREE.CylinderGeometry(.0015,.0015,w-.02,8).rotateZ(Math.PI/2),material);r.name=name;r.position.set(x,y+.0015,z-d/2+.01+i*.02);r.castShadow=false;parent.add(r);}}
const box=(parent,name,size,position,material)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.name=name;m.position.set(...position);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
const cyl=(parent,name,r,h,position,material,axis='y')=>{const g=new THREE.CylinderGeometry(r,r,h,16);if(axis==='z')g.rotateX(Math.PI/2);const m=new THREE.Mesh(g,material);m.name=name;m.position.set(...position);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
/** An empty glass waiting to be filled: the drink's own vessel with nothing in it yet. */
function empty(kind){const g=createDrinkProp(kind);setPropPortion(g,0,{immediate:true});updatePropPortion(g,0);return g;}

/**
 * A piece of the fitted room (bottle, door) taken out of its baked mesh so it can move, and put back. The room's
 * meshes are shared with the cached model, so the first lift gives this room its own copy of that mesh's index.
 * `parts` are [material key, test(world point)] pairs; the piece's origin is `pivot`.
 */
export function liftPiece(root,parts,pivot,name){
 root.updateMatrixWorld(true);
 const piece=new THREE.Group();piece.name=name;piece.position.set(...pivot);const saved=[],ownedIndices=[];let disposed=false;
 const key=s=>s.replace(/[^a-z]/gi,'').toLowerCase(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),mid=new THREE.Vector3();
 root.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.geometry.index)return;
  const part=parts.find(([material])=>key(mesh.name).endsWith(key(material)));if(!part)return;
  const g=mesh.geometry,p=g.attributes.position,index=g.index,picked=[];
  for(let t=0;t<index.count;t+=3){
   a.fromBufferAttribute(p,index.getX(t)).applyMatrix4(mesh.matrixWorld);b.fromBufferAttribute(p,index.getX(t+1)).applyMatrix4(mesh.matrixWorld);c.fromBufferAttribute(p,index.getX(t+2)).applyMatrix4(mesh.matrixWorld);
   if(part[1](mid.copy(a).add(b).add(c).divideScalar(3)))picked.push(t);
  }
  if(!picked.length)return;
  // Its own index only: the vertices stay the cached model's, shared by every visit (tests/izakaya-backbar.test.mjs).
  if(!mesh.userData.ownIndex){const own=new THREE.BufferGeometry();for(const n of Object.keys(g.attributes))own.setAttribute(n,g.attributes[n]);own.setIndex(g.index.clone());for(const group of g.groups)own.addGroup(group.start,group.count,group.materialIndex);own.boundingBox=g.boundingBox;own.boundingSphere=g.boundingSphere;ownedIndices.push({mesh,source:g,geometry:own});mesh.geometry=own;mesh.userData.ownIndex=true;}
  const own=mesh.geometry.index,copy=new THREE.BufferGeometry(),names=Object.keys(g.attributes);
  for(const n of names){const src=g.attributes[n],out=new Float32Array(picked.length*3*src.itemSize);
   picked.forEach((t,i)=>{for(let k=0;k<3;k++)for(let s=0;s<src.itemSize;s++)out[(i*3+k)*src.itemSize+s]=src.getComponent(index.getX(t+k),s);});
   copy.setAttribute(n,new THREE.BufferAttribute(out,src.itemSize,src.normalized));}
  // Into the piece's frame: the baked mesh's own transform, less the pivot.
  copy.applyMatrix4(mesh.matrixWorld.clone().premultiply(new THREE.Matrix4().makeTranslation(-pivot[0],-pivot[1],-pivot[2]).multiply(root.matrixWorld.clone().invert())));
  const m=new THREE.Mesh(copy,mesh.material);m.name=name+' · '+mesh.name;m.castShadow=mesh.castShadow;m.receiveShadow=mesh.receiveShadow;piece.add(m);
  const before=picked.map(t=>[own.getX(t),own.getX(t+1),own.getX(t+2)]);saved.push({own,picked,before});
 });
 const hide=on=>{for(const {own,picked,before} of saved){picked.forEach((t,i)=>{const v=on?before[i][0]:null;for(let k=0;k<3;k++)own.setX(t+k,on?v:before[i][k]);});own.needsUpdate=true;}};
 return {piece,found:saved.length>0,
  /** The piece leaves the baked mesh: from now on only `piece` draws it. */
  take(){if(disposed)return;piece.position.set(...pivot);piece.rotation.set(0,0,0);hide(true);root.add(piece);},
  /** Back where it was baked: the copy goes and the room draws it again. */
  restore(){piece.removeFromParent();if(!disposed)hide(false);},
  dispose(){
   if(disposed)return;piece.removeFromParent();hide(false);disposed=true;
   // These extracted triangles and the added inner face belong to this piece.
   // Their materials still belong to the fitted model or the room's bar group.
   const copies=new Set();piece.traverse(o=>{if(o.isMesh)copies.add(o.geometry);});copies.forEach(g=>g.dispose());piece.clear();
   for(const {mesh,source,geometry} of ownedIndices){
    if(mesh.geometry===geometry){mesh.geometry=source;delete mesh.userData.ownIndex;}
    // The wrapper owns its index, but borrows the cached model's vertex buffers.
    // As with shop-street-batches, detach those before Three's disposal handler.
    for(const key of Object.keys(geometry.attributes))geometry.deleteAttribute(key);
    geometry.morphAttributes={};geometry.dispose();
   }
  }};
}

/** Minato's drinks station, built into the fitted room. */
export function buildMinatoBar(room){
 const B=MINATO_BAR,group=new THREE.Group();group.name='Minato drinks station';room.add(group);
 let disposed=false;
 const metal=steel(),dark=new THREE.MeshStandardMaterial({color:0x2b2926,roughness:.55}),liner=new THREE.MeshStandardMaterial({color:0xdfe3df,roughness:.6,side:THREE.BackSide});
 // The glass rack: a perforated steel tray on the worktop.
 // A steel tray with a ribbed rubber bar mat: the glasses rest on the round ribs' crests (no flat face to share), 3 mm
 // up, draining.
 {const [x,z,w,d]=B.rack.tray;box(group,'Glass rack tray',[w,.012,d],[x,top+.006,z],metal);
  const rib=new THREE.MeshStandardMaterial({color:0x2a2b2a,roughness:.8});
  ribs(group,'Glass rack mat rib',x,z,w,d,top+.012,rib);
  // The pour's own bar mat.
  const [px,,pz]=B.pour.glass;box(group,'Pour bar mat',[.16,.004,.16],[px,top+.002,pz],rib);ribs(group,'Pour bar mat rib',px,pz,.16,.16,top+.004,rib);}
 const glasses=[];
 for(const [kind,spots] of Object.entries(B.rack.slots))for(const [x,z] of spots){
  glasses.push({kind,make:()=>{const g=empty(kind);g.name='Rack '+kind+' glass';return g;},home:[x,top+.015,z]});
 }
 // The Orion draught tap: a steel font on its drip tray, the spout over the mug, the lever towards the aisle.
 const tap=new THREE.Group();tap.name='Orion draught tap';tap.position.set(B.tap.at[0],top,B.tap.at[2]);group.add(tap);
 const reachZ=B.tap.glass[2]-B.tap.at[2];
 // A low counter-top server, as Japanese bars have them: the spout just clears a mug, the lever at her reach.
 box(tap,'Tap drip tray',[.13,.010,.22],[0,.005,reachZ/2+.01],metal);ribs(tap,'Tap drip tray grille',0,reachZ/2+.01,.12,.20,.010,metal);
 cyl(tap,'Tap font column',.026,.20,[0,.114,0],metal);
 cyl(tap,'Tap spout arm',.016,-reachZ+.03,[0,.20,reachZ/2],metal,'z');
 cyl(tap,'Tap nozzle',.009,.025,[0,.18,reachZ],metal);
 const lever=new THREE.Group();lever.name='Tap lever';lever.position.set(0,.215,reachZ+.01);tap.add(lever);
 cyl(lever,'Tap lever handle',.011,.09,[0,.045,0],dark);
 const badge=box(tap,'Tap Orion badge',[.045,.045,.004],[0,.13,-.027],new THREE.MeshStandardMaterial({color:0x2d5fa8,roughness:.5}));badge.castShadow=false;
 // The cold store's upper door comes out of the baked room to swing on its hinge; behind it, a lined compartment.
 const D=B.store.door,doorX=D.hinge[0],doorZ=D.hinge[1];
 const inside=(min,max)=>p=>p.x>=min[0]&&p.x<=max[0]&&p.y>=min[1]&&p.y<=max[1]&&p.z>=min[2]&&p.z<=max[2];
 const door=liftPiece(room,[
  ['Enamel cream',inside([doorX-.005,D.low-.005,doorZ-.025],[doorX+D.width+.005,D.high+.005,doorZ+.025])],
  ['Dark fittings',inside([doorX+D.width*.75,D.low+.05,doorZ],[doorX+D.width,D.high-.05,doorZ+.06])],
  ['Ink',inside([doorX,D.low,doorZ-.01],[doorX+D.width,D.high,doorZ+.03])],
 ],[doorX,0,doorZ],'Cold store upper door');
 // The door's inner face (the baked door has none: it was never meant to open).
 box(door.piece,'Cold store door inner face',[D.width-.02,D.high-D.low-.02,.004],[D.width/2,(D.low+D.high)/2,-D.thick/2-.002],metal);
 const lining=box(group,'Cold store lining',[S.width-.05,D.high-D.low-.03,S.depth-.06],[store[0],(D.low+D.high)/2,store[2]-.01],liner);lining.castShadow=false;
 const stock=[];
 for(const [kind,spots] of Object.entries(B.store.stock))for(const [x,z] of spots){
  // The big bottle's chilled glass is empty until she pours the first one.
  stock.push({kind,make:()=>{const g=kind==='oolong'?jug():kind==='bottle'?empty('bottle'):createDrinkProp(kind);g.name='Cold store '+kind;
   // The set is taken by its big bottle, not between bottle and glass.
   if(kind==='bottle'){g.userData.gripAt=[-.06,0,0];g.userData.workGrip={radius:.038,height:.12};g.userData.pourAt=[.05,g.userData.rimHeight,0];}return g;},home:[x,B.store.shelfY,z]});
 }
 // The sake set by the range.
 const warm={kind:'sake',make:()=>{const g=createDrinkProp('sake');g.name='Warm sake set by the range';g.userData.gripAt=[-.049,0,0];g.userData.workGrip={radius:.039,height:.07};return g;},home:[...B.warmer.set]};
 // Sango Quay comes off the back bar as itself: the walnut cabinet's own bottle and label.
 const [bx,by,bz]=B.shelf.bottle;
 const bottle=liftPiece(room,[['Bottle bodies',p=>Math.hypot(p.x-bx,p.z-bz)<.075&&p.y>by-.01&&p.y<by+.42],['Bottle labels',p=>Math.hypot(p.x-bx,p.z-bz)<.075&&p.y>by-.01&&p.y<by+.42]],[bx,by,bz],'Sango Quay bottle');
 // Without the fitted room (a test's bare room) the bottle is a plain one of the same size.
 const fallbackMaterial=!bottle.found?new THREE.MeshStandardMaterial({color:0x8a6a3a}):null;
 if(fallbackMaterial)cyl(bottle.piece,'Sango Quay bottle stand-in',.035,.30,[0,.15,0],fallbackMaterial);
 bottle.piece.userData.grip={radius:.036,height:.07};
 // Out of the shelf and at the front of the slate, where she takes it from and puts it back.
 const inUse=new THREE.Vector3(...B.shelf.inUse);bottle.take();bottle.piece.position.copy(inUse);bottle.piece.rotation.set(0,0,0);
 bottle.home=()=>{if(disposed)return;group.attach(bottle.piece);bottle.piece.position.copy(inUse);bottle.piece.rotation.set(0,0,0);};bottle.piece.userData.spout=[0,.30,0];
 let doorAngle=0,leverAngle=0;
 // Every place holds its item until she takes it; she refills an empty place when she is back at her station.
 const fill=slot=>{slot.item=slot.make();slot.item.position.set(...slot.home);group.add(slot.item);};
 for(const slot of [...glasses,...stock,warm])fill(slot);
 const takeFrom=list=>{const slot=list.find(s=>s.item);if(!slot)return null;const item=slot.item;slot.item=null;return item;};
 return {group,door,bottle,data:MINATO_BAR,rounds:BAR_ROUNDS,
  /** A clean glass of this kind off the rack (null when the rack has none left of it). */
  glass:kind=>takeFrom(glasses.filter(s=>s.kind===kind)),
  /** The bottle set, can, jug or sake set for this drink from where it is kept. */
  stock:kind=>takeFrom(kind==='sake'?[warm]:stock.filter(s=>s.kind===kind)),
  /** Where the next one of this kind is kept, before she goes for it. */
  peek:kind=>(kind==='sake'?[warm]:stock.filter(s=>s.kind===kind)).find(s=>s.item)?.home||null,
  /** The jug back on its place in the cold store. */
  shelve(item){const slot=stock.find(s=>s.kind==='oolong'&&!s.item);if(!slot)return false;slot.item=item;group.attach(item);item.position.set(...slot.home);item.rotation.set(0,0,0);return true;},
  /** Back at her station: the rack from the glass washer, the cold store and the warmer from behind. */
  restock(){for(const slot of [...glasses,...stock,warm])if(!slot.item&&!(slot.kind==='oolong'&&stock.includes(slot)))fill(slot);},
  /** How many of each are in their places, for tests. */
  get counts(){const n={};for(const s of [...glasses,...stock,warm])if(s.item)n[(stock.includes(s)?'store-':glasses.includes(s)?'rack-':'')+s.kind]=(n[(stock.includes(s)?'store-':glasses.includes(s)?'rack-':'')+s.kind]||0)+1;return n;},
  /** 0 shut, 1 open. */
  set doorOpen(v){doorAngle=THREE.MathUtils.clamp(v,0,1);door.piece.rotation.y=D.open*doorAngle;if(doorAngle>0&&!door.piece.parent)door.take();else if(doorAngle===0&&door.piece.parent)door.restore();},
  get doorOpen(){return doorAngle;},
  /** 0 up, 1 pulled towards her. */
  set lever(v){leverAngle=THREE.MathUtils.clamp(v,0,1);lever.rotation.x=-.6*leverAngle;},
  get lever(){return leverAngle;},
  /** Where her hand takes the lever: its knob, in the room. */
  leverKnob(){room.updateMatrixWorld(true);return lever.localToWorld(new THREE.Vector3(0,.08,0));},
  nozzle(){room.updateMatrixWorld(true);return tap.localToWorld(new THREE.Vector3(0,.167,reachZ));},
  /** Where her hand meets the door's pull, as it is now. */
  doorPull(){room.updateMatrixWorld(true);const p=door.piece.parent?door.piece:null,local=new THREE.Vector3(D.width*.86,1.06,.04);
   if(p)return p.localToWorld(local);return local.applyAxisAngle(new THREE.Vector3(0,1,0),D.open*doorAngle).add(new THREE.Vector3(doorX,0,doorZ));},
  dispose(){if(disposed)return;disposed=true;door.dispose();bottle.dispose();fallbackMaterial?.dispose();}};
}
/** Cold oolong tea in a glass jug with a lid, as a 1997 counter kept it. */
function jug(){
 const g=new THREE.Group();g.name='Oolong jug';
 const glass=new THREE.Mesh(new THREE.CylinderGeometry(.052,.056,.22,20,1,true),new THREE.MeshStandardMaterial({color:0xd8e4dc,transparent:true,opacity:.35,roughness:.1,side:THREE.DoubleSide,depthWrite:false}));glass.position.y=.11;glass.name='Oolong jug glass';
 // Leave glass thickness at the widest base too; the old tea column nearly
 // touched the tapered shell and flashed through it at an oblique angle.
 const tea=new THREE.Mesh(new THREE.CylinderGeometry(.046,.049,.17,20),new THREE.MeshStandardMaterial({color:0x7b3d16,roughness:.25}));tea.position.y=.091;tea.name='Oolong in the jug';
 const lid=new THREE.Mesh(new THREE.CylinderGeometry(.054,.054,.014,20),new THREE.MeshStandardMaterial({color:0x2b2926,roughness:.5}));lid.position.y=.227;lid.name='Oolong jug lid';
 g.add(glass,tea,lid);g.userData.grip={radius:.056,height:.11};g.userData.spout=[0,.23,-.05];return g;
}
