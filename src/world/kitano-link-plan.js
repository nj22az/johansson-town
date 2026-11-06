import {GROUND_LAYER} from './ground-layers.js';

/** Mainland access lane ending on the east lawn. Airport travel is by passenger ferry. */
export const KITANO_ROAD=Object.freeze({
 id:'kitano-road',title:'Kitano Road',
 /** Corners of the centreline (the carriageway's middle), each rounded by its radius. */
 corners:Object.freeze([[-.5,3.3,0],[29.5,3.3,0]].map(Object.freeze)),
 lane:2.25,
 /** Offsets across the road, positive to the left of eastbound travel (south). */
 // The footway lies flush with the lawn and with Main Street's footways it runs on from (ground-standard.js: a footway
 // with no road beside it at its back is laid flush); the kerb face along the carriageway stays.
 section:Object.freeze({north:-2.35,carriageway:2.25,footway:4.0,parapet:.25,kerb:0}),
 /** Where the rise begins and ends, and the crest. Gradients stay at or under 8 %. */
 profile:Object.freeze({riseFrom:Infinity,crest:0,crestFrom:Infinity,crestTo:Infinity,grade:0,blend:0}),
 /** Town 30 km/h, bridge 40 km/h: scaled to the game's compressed distances (m/s). */
 speed:Object.freeze({town:4.6,bridge:6.2}),
 /** Deck depth under the running surface, for the navigation clearance. */
 deckDepth:.85,
});

/**
 * The running surface is laid this far over whatever it crosses (the lawn, the quarter's
 * paving, the district's slab), clear of each of their own layers.
 */
export const KITANO_SURFACE_LIFT=GROUND_LAYER.lane;

/** Where the bridge stands on its piers: from the foot of the beach to the district edge. */
export const KITANO_BRIDGE=Object.freeze({id:'kitano-bridge',removed:true,fromX:Infinity,spans:0});

// ---- The centreline: straight runs joined by circular arcs. ----
function buildPrimitives(){
 const P=KITANO_ROAD.corners,prims=[];let cur=[P[0][0],P[0][1]];
 for(let i=1;i<P.length;i++){
  const [x,z,R]=P[i];
  if(i===P.length-1){prims.push(line(cur,[x,z]));break;}
  const [nx,nz]=P[i+1],d1=unit(x-cur[0],z-cur[1]),d2=unit(nx-x,nz-z);
  const cross=d1[0]*d2[1]-d1[1]*d2[0],theta=Math.acos(Math.max(-1,Math.min(1,d1[0]*d2[0]+d1[1]*d2[1])));
  const T=R*Math.tan(theta/2),a=[x-d1[0]*T,z-d1[1]*T],b=[x+d2[0]*T,z+d2[1]*T];
  prims.push(line(cur,a));
  // Turning toward d2: the centre lies on that side of d1.
  const side=cross<0?-1:1,c=[a[0]-d1[1]*R*side,a[1]+d1[0]*R*side];
  prims.push({kind:'arc',c,R,a0:Math.atan2(a[1]-c[1],a[0]-c[0]),sweep:theta*side,length:R*theta});
  cur=b;
 }
 let s=0;for(const p of prims){p.s0=s;s+=p.length;}
 return prims;
}
function unit(x,z){const l=Math.hypot(x,z);return [x/l,z/l];}
function line(a,b){const l=Math.hypot(b[0]-a[0],b[1]-a[1]);return {kind:'line',a,b,length:l,d:[(b[0]-a[0])/l,(b[1]-a[1])/l]};}
const PRIMS=buildPrimitives();
export const KITANO_ROAD_LENGTH=PRIMS.at(-1).s0+PRIMS.at(-1).length;

/** The centreline at distance s: position and unit heading [x,z,hx,hz]. */
export function roadPoint(s){
 s=Math.max(0,Math.min(KITANO_ROAD_LENGTH,s));
 const p=PRIMS.find(q=>s<=q.s0+q.length+1e-9)||PRIMS.at(-1),t=s-p.s0;
 if(p.kind==='line')return [p.a[0]+p.d[0]*t,p.a[1]+p.d[1]*t,p.d[0],p.d[1]];
 const sign=Math.sign(p.sweep),ang=p.a0+t/p.R*sign;
 return [p.c[0]+Math.cos(ang)*p.R,p.c[1]+Math.sin(ang)*p.R,-Math.sin(ang)*sign,Math.cos(ang)*sign];
}
/** The left of a heading, the way Japan keeps to it: (hz, -hx). */
export const leftOf=(hx,hz)=>[hz,-hx];

/** Nearest centreline station to x,z: {s, o} with o measured to the left of eastbound. */
export function roadStation(x,z){
 let best=null;
 for(const p of PRIMS){
  let s,px,pz;
  if(p.kind==='line'){
   const t=Math.max(0,Math.min(p.length,(x-p.a[0])*p.d[0]+(z-p.a[1])*p.d[1]));s=p.s0+t;px=p.a[0]+p.d[0]*t;pz=p.a[1]+p.d[1]*t;
  }else{
   const sign=Math.sign(p.sweep);let ang=Math.atan2(z-p.c[1],x-p.c[0]),rel=(ang-p.a0)*sign;
   rel=((rel%(2*Math.PI))+2*Math.PI)%(2*Math.PI);if(rel>Math.PI)rel-=2*Math.PI;
   const t=Math.max(0,Math.min(p.length,rel*p.R));s=p.s0+t;[px,pz]=roadPoint(s);
  }
  const d=Math.hypot(x-px,z-pz);
  if(!best||d<best.d)best={s,d,px,pz};
 }
 const [,,hx,hz]=roadPoint(best.s),[lx,lz]=leftOf(hx,hz);
 return {s:best.s,o:(x-best.px)*lx+(z-best.pz)*lz};
}

// There is no embankment, causeway, bridge or airport road support.
export const roadHeight=()=>0;
export const KITANO_ROAD_LANDS=KITANO_ROAD_LENGTH;
export const KITANO_SHORE=Object.freeze({beachFoot:null,district:null});
export const NAVIGATION_CLEARANCE=0;

/**
 * Where people can stand on the mainland access lane, and at what height.
 * The footway is a kerb's height above the carriageway.
 */
export function kitanoRoadAt(x,z,r=0){
 // Reject the strait before asking the nearest mainland centreline.
 if(x<-1||x>30||z< -3||z>8)return null;
 const {s,o}=roadStation(x,z),S=KITANO_ROAD.section;
 if(s<=.01||s>=KITANO_ROAD_LANDS)return null;
 if(o<S.north+r||o>S.footway-r)return null;
 const [px,pz]=roadPoint(s);
 // On the district, past its edge, the road is the airport's ground once it is level.
 const footway=o>S.carriageway;
 const y=roadHeight(s)+(footway?S.kerb:0);
 return {id:KITANO_ROAD.id,surface:footway?'stone':'asphalt',y,s,o,x:px,z:pz};
}

/** No airport road opening remains in the east seawall. */
export const KITANO_SEAWALL_GAP=Object.freeze({z:0,half:0});
