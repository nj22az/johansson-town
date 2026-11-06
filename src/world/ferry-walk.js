import * as THREE from '../../vendor/three.module.js';
import {FERRY_HULL,FERRY_DECKS,FERRY_RAMP,FERRY_CASINGS,FERRY_DECK_FITTINGS,GATE,GANGWAY_LENGTH,halfBreadth} from './ferry-model.js';
import {FERRY_HEIGHTS,FERRY_SHIP} from './ferry-ship.js';
import {FERRY_INTERIOR,underStair} from './ferry-interior.js';

/**
 * Walking aboard the Minato Maru while she lies alongside (the creator, 2026-10-11: "I want to be able to board and
 * explore the ferry, whenever it's in port"). Her decks are floors in her own frame, so they heave and roll with her
 * and stack one over another (the car deck under the passenger deck): the floor you stand on is the one nearest your
 * feet, within a step. Her houses, casings and fittings are solids in her frame. Where a floor ends you step onto the
 * shore only where the shore is there to step onto: off the gangway's foot onto the pier, off the ramp's flap onto
 * the quay or Kitano-jima's pier.
 *
 * Model frame (ferry-model.js): +z forward, +x to port, y up from her laden waterline. Each floor belongs to one moving
 * part: the ship, the ramp's leaf, its flap, or the gangway (whose own frame runs x out from her side, z along her).
 */
const HALF=FERRY_HULL.length/2,HB=FERRY_HULL.beam/2,CAR=FERRY_DECKS.car.y;
const Z=zy=>zy-HALF,Y=yk=>yk-FERRY_SHIP.draft;
const PASS=Y(FERRY_HEIGHTS.passengerDeck);
/** The highest step a foot takes without a stair: physics.js canStepBetween. */
export const FERRY_STEP=.24;
/** A person, from the soles to the top of the head (physics.js standingHitsRect). */
const TALL=1.82;
const C=FERRY_CASINGS,P=C.passage,BHS=C.bowHouses;
const FORECASTLE=BHS.top+.06,FORECASTLE_OUT=halfBreadth(BHS.fore)-.1;
const BAR=FERRY_DECK_FITTINGS.barrier,SIG=FERRY_DECK_FITTINGS.signals;
/** The inside face of her bulwark, off her side plating (ferry-model.js deckAndBulwarks). */
const bulwarkIn=z=>halfBreadth(z)-.07;

/** A floor: `y` its height, or [at z0, at z1] for a stair or a ladder. */
const floor=(id,part,x,z,y,inside=null)=>Object.freeze({id,part,x:Object.freeze(x),z:Object.freeze(z),y,inside});
/** The visible vertical ladders. The upper run-out stays above the roof, never through the bow house. */
export const FERRY_CLIMBS=Object.freeze([1,-1].map(s=>Object.freeze({
 id:'forecastle-ladder-'+(s>0?'p':'s'),
 from:Object.freeze([s*3.4,CAR,BHS.aft-.37]),
 via:Object.freeze([Object.freeze([s*3.4,FORECASTLE,BHS.aft-.37])]),
 to:Object.freeze([s*3.4,FORECASTLE,BHS.aft+.35]),
})));
/**
 * The floors you can walk on alongside: `inside(x, z, r)` (the part's frame) says where on it a person of radius `r`
 * may stand, where its edge is a bulwark or a rail rather than an open end.
 */
export const FERRY_FLOORS=Object.freeze([
 // The car deck, bulwark to bulwark from the transom to the stem, open at the gangway gate (its 1.4 m opening in the
 // port bulwark) and forward between the bow houses to the ramp.
 floor('car-deck','ship',[-HB,HB],[-HALF+.08,HALF],CAR,(x,z,r)=>{
  if(z<-HALF+.12+r)return false;
  // Under the stairs' flights, in the casings, the deck is under the stair, not a place to stand.
  if(underStair(x,z,r))return false;
  const atGate=x>0&&z>=GATE.from+r&&z<=GATE.to-r;
  return Math.abs(x)<=(atGate?halfBreadth(z):bulwarkIn(z)-r);
 }),
 // The bow ramp's leaf and flap (ferry-model.js FERRY_RAMP): their tops, 0.07 and 0.05 over their pivots.
 floor('ramp','ramp',[-FERRY_RAMP.width/2,FERRY_RAMP.width/2],[0,FERRY_RAMP.leaf],.07,(x,z,r)=>Math.abs(x)<=FERRY_RAMP.clear/2-.05),
 floor('flap','flap',[-FERRY_RAMP.flapWidth/2,FERRY_RAMP.flapWidth/2],[0,FERRY_RAMP.flap],.05),
 // The gangway: 2 m of plank, 1.4 m wide between hand rails 0.68 m out (batch 6f).
 floor('gangway','gangway',[0,GANGWAY_LENGTH],[-.7,.7],.03,(x,z,r)=>Math.abs(z)<=.66-r),
 // The green forecastle tops carry the forward mooring stations. Their aft rail has the actual ladder opening.
 ...[1,-1].map(s=>floor('forecastle-'+(s>0?'p':'s'),'ship',
  [s*2.22,s*(halfBreadth(BHS.fore)-.02)].sort((a,b)=>a-b),[BHS.aft,BHS.fore],FORECASTLE,(x,z,r)=>{
   const a=Math.abs(x);return a>=2.325+r&&a<=FORECASTLE_OUT-.025-r&&z<=BHS.fore-.075-r
    &&(z>=BHS.aft+.075+r||a>=3.075+r);
  })),
 // The stairs, the lobby, the corridor, the carpet room, the saloon, the walkways, the open deck, the ladders, the
 // bridge deck's aft platform, the wings and the wheelhouse (ferry-interior.js).
 ...FERRY_INTERIOR.floors.map(f=>floor(f.id,'ship',f.x,f.z,f.y,f.inside)),
]);

/** `walk`: people walk round it; `camera`: the lens stays out of it. */
const solid=(id,x,y,z,part='ship',walk=true,camera=true)=>Object.freeze({id,part,x:Object.freeze(x),y:Object.freeze(y),z:Object.freeze(z),walk,camera});
/** What stands on her decks, in the same frames: what a person walks round and the camera stays out of. */
export const FERRY_SOLIDS=Object.freeze([
 // The casings, the stairs' walls, the houses, their furniture (ferry-interior.js).
 ...FERRY_INTERIOR.boxes.filter(b=>b.solid||b.camera).map(b=>solid(b.name||'interior',[b.a[0],b.b[0]],[b.a[1],b.b[1]],[b.a[2],b.b[2]],'ship',b.solid,b.camera)),
 // The pillars under the passenger deck's open ends.
 ...[1,-1].flatMap(s=>[Z(.3),Z(22.7)].map(z=>solid('pillar',[s*3.75-.11,s*3.75+.11].sort((a,b)=>a-b),[CAR,PASS],[z-.11,z+.11]))),
 // The aft mooring station: the capstan and two pairs of bitts.
 solid('capstan',[-.3,.3],[CAR,CAR+.6],[Z(1.2)-.3,Z(1.2)+.3]),
 ...[1,-1].map(s=>solid('bitts',[s*2.9-.13,s*2.9+.13].sort((a,b)=>a-b),[CAR,CAR+.5],[Z(1.6)-.39,Z(1.6)+.39])),
 // The bow houses either side of the ramp, and the ladders up their aft faces.
 ...[1,-1].map(s=>solid('bow-house',[s*BHS.inner,s*HB].sort((a,b)=>a-b),[CAR,BHS.top],[BHS.aft,HALF])),
 ...[1,-1].map(s=>solid('forecastle-ladder',[s*3.4-.3,s*3.4+.3].sort((a,b)=>a-b),[CAR,BHS.top+.95],[BHS.aft-.17,BHS.aft],'ship',false,true)),
 ...[1,-1].flatMap(s=>{
  const span=(a,b)=>[s*a,s*b].sort((a,b)=>a-b),railY=[FORECASTLE,FORECASTLE+1.075];
  return [
   solid('forecastle-outer-rail',span(FORECASTLE_OUT-.025,FORECASTLE_OUT+.025),railY,[BHS.aft+.025,BHS.fore-.025]),
   solid('forecastle-inner-rail',span(2.275,2.325),railY,[BHS.aft+.025,BHS.fore-.025]),
   solid('forecastle-forward-rail',span(2.3,FORECASTLE_OUT),railY,[BHS.fore-.075,BHS.fore-.025]),
   solid('forecastle-aft-rail',span(2.3,3.05),railY,[BHS.aft+.025,BHS.aft+.075]),
   solid('forecastle-windlass',span(2.75,3.25),[BHS.top+.09,BHS.top+.61],[Z(32.4)-.26,Z(32.4)+.26]),
   ...[-.25,.25].map(dz=>solid('forecastle-bitts',span(2.98,3.22),[BHS.top+.025,BHS.top+.475],[Z(33.6)+dz-.12,Z(33.6)+dz+.12])),
   solid('forecastle-fairlead',span(2.75,3.25),[BHS.top+.07,BHS.top+.33],[HALF-.17,HALF-.03]),
  ];
 }),
 // The ramp's rams, from the bow houses to the leaf's edges: the outer edges of the leaf, near the hinge.
 solid('ramp-control-pedestal',[3.0,3.4],[CAR,2.25],[11.17,11.53]),
 ...[1,-1].map(s=>solid('ramp-ram',[s*1.98,s*2.4].sort((a,b)=>a-b),[0,2.6],[0,1.9],'ramp')),
 // The gangway's hand rails.
 ...[1,-1].map(s=>solid('gangway-rail',[0,GANGWAY_LENGTH],[0,1],[s*.66,s*.72].sort((a,b)=>a-b),'gangway')),
 // Her moving parts as walls (batch 6f), in her own frame, each open the other way from the part it follows (partOpen):
 // the raised ramp across the bow while it is up or moving; the gate and the gangway door in her side while the
 // gangway is in; the gangway door's leaf hooked back against the passage's forward wall while it is out.
 solid('raised-ramp',[-2.3,2.3],[CAR,CAR+4.2],[HALF-.4,HALF+.1],'bow'),
 // The car deck's working fittings (FERRY_DECK_FITTINGS): the vehicle barrier shut across the lanes while the ramp is
 // up or moving, and its leaves standing upright on the walkways while it is down ('quay'); the barrier's posts, the
 // lane-signal posts on the bow houses, the hydrants and the forward hose boxes.
 solid('vehicle-barrier',[-BAR.pivot,BAR.pivot],[CAR,CAR+BAR.foot+BAR.height+.05],[BAR.z-.06,BAR.z+.06],'bow'),
 ...[1,-1].map(s=>solid('vehicle-barrier-open',[s*BAR.pivot,s*(BAR.pivot+BAR.height+BAR.foot)].sort((a,b)=>a-b),[CAR,CAR+BAR.foot+BAR.leaf+.05],[BAR.z-.06,BAR.z+.06],'quay')),
 ...[1,-1].map(s=>solid('barrier-post',[s*BAR.pivot,s*(BAR.pivot+.12)].sort((a,b)=>a-b),[CAR,CAR+1.1],[BAR.z-.06,BAR.z+.06])),
 ...[1,-1].map(s=>solid('lane-signal-post',[s*(SIG.x-SIG.board[0]/2),s*(SIG.x+SIG.board[0]/2)].sort((a,b)=>a-b),[BHS.top,BHS.top+SIG.height+.1],[SIG.z-.45,SIG.z+.45])),
 ...FERRY_DECK_FITTINGS.hydrants.map(h=>{const z=Z(h.zy),s=h.side;
  if(h.on==='casing')return solid('hydrant',[s*(C.inner-.2),s*C.inner].sort((a,b)=>a-b),[CAR,CAR+.95],[z-.3,z+.12]);
  return solid('hydrant',[s*(halfBreadth(z)-.32),s*halfBreadth(z)].sort((a,b)=>a-b),[CAR,CAR+.95],[z-.12,z+1.12]);}),
 solid('shut-gate',[HB-.25,HB+.1],[CAR,CAR+2.1],[P.from-.1,P.to+.1],'gate'),
 solid('gangway-door-open',[HB-1.36,HB-.02],[CAR,CAR+2],[P.to-.08,P.to],'shore'),
]);

/** The solids filed by part and by metre of z, so a test looks only at what is near (a person, or the lens, ±1.5 m). */
const EMPTY=Object.freeze([]),BIN0=-Math.ceil(HALF)-6,SOLID_PARTS=[...new Set(FERRY_SOLIDS.map(s=>s.part))];
const BINS=Object.fromEntries(SOLID_PARTS.map(part=>{
 const bins=[];for(let b=0;b<Math.ceil(HALF)*2+12;b++)bins.push([]);
 for(const s of FERRY_SOLIDS.filter(s=>s.part===part)){const from=Math.max(0,Math.floor(s.z[0]-1.5)-BIN0),to=Math.min(bins.length-1,Math.floor(s.z[1]+1.5)-BIN0);for(let b=from;b<=to;b++)bins[b].push(s);}
 return [part,bins];
}));

/**
 * The deck walk for one ship (ferry.js createFerryRun's `run`): which floors are out (the gangway only while it is
 * run out, the ramp only while it is down), where they are in the world this frame, and the moves on them.
 */
export function createFerryWalk(run){
 const ferry=run.ferry,parts={ship:ferry,ramp:ferry.userData.ramp,flap:ferry.userData.flap,gangway:ferry.userData.gangway,bow:ferry,gate:ferry,shore:ferry,quay:ferry};
 const inverse=Object.fromEntries(Object.keys(parts).map(k=>[k,new THREE.Matrix4()]));
 const v=new THREE.Vector3();
 // Each floor's four corners in the world, this frame.
 const corners=FERRY_FLOORS.map(()=>[0,1,2,3].map(()=>new THREE.Vector3()));
 let open=[];
 /** Out, for walking: the ship visible and lying alongside; the gangway run out; the ramp down on its landing. */
 function partOpen(part){
  if(!ferry.visible)return false;
  const stage=run.operation?.stage,accessOpen=run.phase==='waiting'||['preparing','securing','alongside'].includes(stage);
  // While the gangway and the ramp are still fully out as she closes up, they are still floors: whoever is on them when
  // she sails is walked off to the nearer end (island/play.js clearAccess) before they move, never left on nothing.
  if(part==='gangway')return (accessOpen||stage==='closing-access')&&(run.gangwayOut??(parts.gangway?.visible?1:0))>=1;
  // The walls that stand while a moving part is the other way (FERRY_SOLIDS).
  if(part==='bow')return !partOpen('ramp');
  if(part==='gate')return !partOpen('gangway');
  if(part==='shore')return partOpen('gangway');
  if(part==='quay')return partOpen('ramp');
  if(part==='ramp'||part==='flap')return (accessOpen||['closing-access','raising-ramp'].includes(stage))&&(run.rampDown??0)>=1;
  // Her own decks are walked whenever she is there: alongside, and under way with him aboard (batch 6e).
  return true;
 }
 function update(){
  ferry.updateMatrixWorld(true);open=[];
  for(const [k,o] of Object.entries(parts))if(o)inverse[k].copy(o.matrixWorld).invert();
  FERRY_FLOORS.forEach((f,i)=>{
   if(!parts[f.part]||!partOpen(f.part))return;
   const m=parts[f.part].matrixWorld,c=corners[i],[y0,y1]=Array.isArray(f.y)?f.y:[f.y,f.y];
   c[0].set(f.x[0],y0,f.z[0]).applyMatrix4(m);c[1].set(f.x[1],y0,f.z[0]).applyMatrix4(m);
   c[2].set(f.x[1],y1,f.z[1]).applyMatrix4(m);c[3].set(f.x[0],y1,f.z[1]).applyMatrix4(m);
   open.push(i);
  });
 }
 /** The height of floor `i` under the world point (x, z), or null where it is not. */
 function heightOn(i,x,z){
  const c=corners[i];
  for(const [a,b,d] of [[c[0],c[1],c[2]],[c[0],c[2],c[3]]]){
   const det=(b.z-d.z)*(a.x-d.x)+(d.x-b.x)*(a.z-d.z);if(Math.abs(det)<1e-9)continue;
   const l1=((b.z-d.z)*(x-d.x)+(d.x-b.x)*(z-d.z))/det,l2=((d.z-a.z)*(x-d.x)+(a.x-d.x)*(z-d.z))/det,l3=1-l1-l2;
   if(l1>=-1e-6&&l2>=-1e-6&&l3>=-1e-6)return l1*a.y+l2*b.y+l3*d.y;
  }
  return null;
 }
 /** The floor under (x, z) nearest to feet at `y`, within a step of them: {floor, y}, or null. */
 function floorAt(x,z,y,step=FERRY_STEP){
  let best=null;
  for(const i of open){const h=heightOn(i,x,z);if(h===null||Math.abs(h-y)>step)continue;if(!best||Math.abs(h-y)<Math.abs(best.y-y))best={floor:FERRY_FLOORS[i],y:h};}
  return best;
 }
 /**
  * The floor under feet at `y`: the highest at (x, z) no more than a step above them (in the air, during a jump, it is
  * the one he comes down on), or null.
  */
 function floorBelow(x,z,y,step=FERRY_STEP){
  let best=null;
  for(const i of open){const h=heightOn(i,x,z);if(h===null||h>y+step)continue;if(!best||h>best.y)best={floor:FERRY_FLOORS[i],y:h};}
  return best;
 }
 /** A point in a part's frame. */
 const local=(part,x,y,z)=>v.set(x,y,z).applyMatrix4(inverse[part]);
 /** The solids near a point in its part's frame (z in one-metre bins, with a margin of a metre and a half). */
 const near=(part,lz)=>BINS[part]?.[Math.floor(lz)-BIN0]||EMPTY;
 /** Vehicles move with the ship and keep their actual footprint as boarding and securing proceed. */
 function vehicleBlocked(x,y,z,r,height){
  const p=local('ship',x,y,z);
  return (run.vehicleObstacles?.()||EMPTY).some(b=>{
   if(b.y>=p.y+height||b.y+b.height<=p.y+.03)return false;
   const dx=Math.max(0,Math.abs(p.x-b.x)-b.w/2),dz=Math.max(0,Math.abs(p.z-b.z)-b.d/2);
   return dx*dx+dz*dz<r*r;
  });
 }
 /** Whether a person of radius `r` with their feet at world (x, y, z) runs into anything aboard; `height` 1.82 standing. */
 function blocked(x,y,z,r,height=TALL){
  if(vehicleBlocked(x,y,z,r,height))return true;
  for(const part of SOLID_PARTS){
   if(!parts[part]||!partOpen(part))continue;
   const p=local(part,x,y,z);
   for(const s of near(part,p.z)){
    if(!s.walk||s.y[0]>=p.y+height||s.y[1]<=p.y+.03)continue;
    if(p.x>s.x[0]-r&&p.x<s.x[1]+r&&p.z>s.z[0]-r&&p.z<s.z[1]+r)return true;
   }
  }
  return false;
 }
 /**
  * A step from where he stands, `y` the height of the floor or ground under him, at world (x, z), to (nx, nz): `null` if
  * it is not onto one of her floors (the shore decides),
  * else {ok, y, floor}: ok false where a bulwark, a rail or something standing on her deck is in the way.
  */
 function move(x,y,z,nx,nz,r){
  // Every floor there within a step, nearest first: where two meet (a ladder's foot on the deck), the one you can
  // stand on.
  const options=[];for(const i of open){const h=heightOn(i,nx,nz);if(h!==null&&Math.abs(h-y)<=FERRY_STEP)options.push({floor:FERRY_FLOORS[i],y:h});}
  if(!options.length)return null;
  options.sort((a,b)=>Math.abs(a.y-y)-Math.abs(b.y-y));
  for(const on of options){
   const f=on.floor,p=local(f.part,nx,on.y,nz);
   if(f.inside&&!f.inside(p.x,p.z,r))continue;
   if(blocked(nx,on.y,nz,r))continue;
   return {ok:true,y:on.y,floor:f};
  }
  return {ok:false,y:options[0].y,floor:options[0].floor};
 }
 /** For the third-person lens: inside a solid aboard (a point, `r` its radius). */
 function cameraBlocked(x,z,y,r){
  if(vehicleBlocked(x,y-r,z,r,2*r))return true;
  for(const part of SOLID_PARTS){
   if(!parts[part]||!partOpen(part))continue;
   const p=local(part,x,y,z);
   for(const s of near(part,p.z)){
    if(!s.camera||p.y<s.y[0]-r||p.y>s.y[1]+r)continue;
    if(p.x>s.x[0]-r&&p.x<s.x[1]+r&&p.z>s.z[0]-r&&p.z<s.z[1]+r)return true;
   }
  }
  return false;
 }
 /** Whether feet at world (x, y, z) are on her: over one of her floors (ferry-walk's floorBelow). */
 const aboard=(x,y,z)=>!!floorBelow(x,z,y);
 /** Her floors' world corners this frame (the tests and the look tool). */
 const outline=()=>open.map(i=>({id:FERRY_FLOORS[i].id,corners:corners[i].map(c=>c.toArray())}));
 return {update,floorAt,floorBelow,move,blocked,cameraBlocked,aboard,outline,partOpen,local:(part,x,y,z)=>local(part,x,y,z).toArray()};
}
