import * as THREE from '../../vendor/three.module.js';
import {coconutPalm,rainforestTree,pandanus,bananaPlant,fern,shrub,grassTuft,rock,driftwood,shell} from './vegetation-kit.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {TREE_REBUILD,treeDesignGeometry,PALM_VARIANTS,FOREST_VARIANTS} from './tree-designs.js';

/**
 * Kitano-jima as a tropical island: white beaches, clear shallows, a jungle hill and the
 * small airport on its flat north side. Built in the airport island's own frame (u along the
 * runway, v across it; y = 0 is sea level), so the runway, pier, cargo court, check-in and
 * flights keep their places, saves and timetables.
 *
 * One terrain grid is the island. The mesh is drawn from it and the walking height reads
 * the same triangles back (tropicHeight), so feet stand on what is drawn, on the beach
 * slope and the hillside alike. The shore is the grid's zero contour, and the same
 * outline feeds the sea's shallows and the visitor map.
 *
 * Plan, by purpose:
 * - North side, airside: the runway, apron, terminal, hangar, tower and sewage works on
 *   the old reclaimed plateau, fenced at v = 16.75. A strip of beach beyond the runway
 *   that nobody walks on: it is what passengers see from the plane.
 * - West: the ferry quay (cargo court and pier), where the Minato car ferry lands.
 * - Terminal plaza, beside check-in: three kiosks a traveller needs and the departure
 *   lounge, a thatched shelter looking at the runway.
 * - South-west: Coral Bay, the long crescent of sand under leaning coconut palms, the
 *   reason people come over on the ferry with a towel.
 * - Middle: the jungle hill (Mount Hinata), a trail up through the trees to a lookout.
 * - East: Turtle Cove, a small sheltered inlet below the hill.
 */

/** Waterline, island frame. The quay at u = -53 is kept straight for the ferry. */
const OUTLINE_POINTS=[
 [-53,37],[-53,31],[-53,25],[-53,19],[-57,12],[-60,2],[-58,-10],[-48,-18],[-30,-21],[-5,-22],[20,-21.5],[42,-20],[58,-16],
 [72,-9],[86,0],[98,10],[108,22],[112,34],[109,45],[100,52],[95,59],[101,67],[106,76],[100,87],[86,96],[68,102],[50,106],
 [34,104],[22,98],[12,90],[0,86],[-12,88],[-24,92],[-36,90],[-46,82],[-52,70],[-54,56],[-53,46],
];
function closedSpline(points,per=6){
 const out=[],n=points.length;
 for(let i=0;i<n;i++){
  const p0=points[(i-1+n)%n],p1=points[i],p2=points[(i+1)%n],p3=points[(i+2)%n];
  for(let k=0;k<per;k++){const t=k/per,t2=t*t,t3=t2*t;out.push([0,1].map(a=>.5*((2*p1[a])+(-p0[a]+p2[a])*t+(2*p0[a]-5*p1[a]+4*p2[a]-p3[a])*t2+(-p0[a]+3*p1[a]-3*p2[a]+p3[a])*t3)));}
 }
 return out;
}
/** The island's waterline as a dense closed polygon, island frame. */
export const TROPIC_OUTLINE=Object.freeze(closedSpline(OUTLINE_POINTS).map(p=>Object.freeze(p)));

/** Where the island's places are, island frame. */
export const TROPIC_PLACES=Object.freeze({
 fence:16.75,
 plaza:Object.freeze({minX:-8,maxX:36,minZ:21,maxZ:34}),
 kiosks:Object.freeze([[3.5,31.6],[12,31.6],[20.5,31.6]].map(Object.freeze)),
 lounge:Object.freeze([29.5,26.5]),
 coralBay:Object.freeze([-14,80]),
 /** The beach bar at the top of Coral Bay's sand, where the trail comes out of the palms. */
 beachBar:Object.freeze([-25,74]),
 /** Parasols and towels the bar rents out, on the dry sand below it. */
 parasols:Object.freeze([[-30,82],[-22,84.5],[-6,82.5]].map(Object.freeze)),
 lookout:Object.freeze([54,68]),
 turtleCove:Object.freeze([92,64]),
 quayU:-53,
});
/** The trail: plaza → Coral Bay, and from the fork up the hill to the lookout and down to Turtle Cove. */
export const TROPIC_TRAILS=Object.freeze([
 [[-4,34],[-6,44],[-9,56],[-12,68],[-13,76]],
 [[-6,44],[6,49],[20,54],[32,60],[44,66],[54,68]],
 [[54,68],[64,70],[76,68],[86,64],[92,64]],
].map(t=>Object.freeze(t.map(Object.freeze))));

const HILLS=[[54,68,14,21],[86,36,7,12],[20,74,3.5,12],[78,84,4,13]];
const PLATEAU=Object.freeze({minX:-58,maxX:64,minZ:-12,maxZ:40,y:1.1,feather:10});
export const TROPIC_PLATEAU_Y=PLATEAU.y;

function segDist(px,pz,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((px-a[0])*dx+(pz-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(px-a[0]-dx*t,pz-a[1]-dz*t);}
function inside(px,pz,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j],zi=a[1],zj=b[1];if((zi>pz)!==(zj>pz)&&px<(b[0]-a[0])*(pz-zi)/(zj-zi)+a[0])c=!c;}return c;}
/** How far the waterline distance is measured; nothing on the island looks further. */
const SHORE_REACH=36,BUCKET=12;
let buckets=null;
function shoreBuckets(){
 if(buckets)return buckets;buckets=new Map();const O=TROPIC_OUTLINE;
 for(let i=0;i<O.length;i++){const a=O[i],b=O[(i+1)%O.length];for(let x=Math.floor(Math.min(a[0],b[0])/BUCKET);x<=Math.floor(Math.max(a[0],b[0])/BUCKET);x++)for(let z=Math.floor(Math.min(a[1],b[1])/BUCKET);z<=Math.floor(Math.max(a[1],b[1])/BUCKET);z++){const k=(x+64)*256+z+64;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(a,b);}}
 return buckets;
}
/** Signed metres to the waterline, positive on land, capped at 36 m either way. */
const OUTLINE_BOX=TROPIC_OUTLINE.reduce((b,[u,v])=>[Math.min(b[0],u),Math.min(b[1],v),Math.max(b[2],u),Math.max(b[3],v)],[Infinity,Infinity,-Infinity,-Infinity]);
export function shoreSigned(u,v){
 if(u<OUTLINE_BOX[0]-SHORE_REACH||v<OUTLINE_BOX[1]-SHORE_REACH||u>OUTLINE_BOX[2]+SHORE_REACH||v>OUTLINE_BOX[3]+SHORE_REACH)return -SHORE_REACH;
 const B=shoreBuckets(),bx=Math.floor(u/BUCKET),bz=Math.floor(v/BUCKET),n=Math.ceil(SHORE_REACH/BUCKET);let d=SHORE_REACH;
 for(let x=bx-n;x<=bx+n;x++)for(let z=bz-n;z<=bz+n;z++){const list=B.get((x+64)*256+z+64);if(list)for(let i=0;i<list.length;i+=2)d=Math.min(d,segDist(u,v,list[i],list[i+1]));}
 return inside(u,v,TROPIC_OUTLINE)?d:-d;
}
export function trailDistance(u,v){let d=Infinity;for(const t of TROPIC_TRAILS)for(let i=0;i+1<t.length;i++)d=Math.min(d,segDist(u,v,t[i],t[i+1]));return d;}
function smooth(a,b,x){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
function plateauWeight(u,v){const P=PLATEAU,ex=Math.max(P.minX-u,0,u-P.maxX),ez=Math.max(P.minZ-v,0,v-P.maxZ);return 1-smooth(0,P.feather,Math.hypot(ex,ez));}
function hills(u,v){let h=0;for(const [x,z,a,r] of HILLS)h+=a*Math.exp(-((u-x)**2+(v-z)**2)/(r*r));return h+.6*Math.sin(u*.11+v*.07)*Math.cos(v*.09-u*.05);}

/** The analytic shape the grid samples: beach profile, the hills, and the flat airport. */
function shapeHeight(u,v,d=shoreSigned(u,v)){
 // The hilltop is levelled into a pad for the lookout deck, which stands one step above it.
 const [lu,lv]=TROPIC_PLACES.lookout,pad=1-smooth(4.5,9,Math.hypot(u-lu,v-lv));
 const h=naturalHeight(u,v,d);return pad>0?h+(naturalHeight(lu,lv,shoreSigned(lu,lv))-h)*pad:h;
}
function naturalHeight(u,v,d){
 if(d<0)return Math.max(-3,d*.32);
 let s=Math.min(1,d/9);s=s*(2-s);
 let h=.95*s+.15*smooth(9,15,d)+hills(u,v)*smooth(10,28,d);
 const w=plateauWeight(u,v);h+=(PLATEAU.y-h)*w;
 return h;
}

/** The terrain grid. Square cells, each split along the same diagonal as the mesh. */
export const TROPIC_GRID=Object.freeze({minX:-66,maxX:120,minZ:-28,maxZ:110,step:1.5});
const NX=Math.round((TROPIC_GRID.maxX-TROPIC_GRID.minX)/TROPIC_GRID.step),NZ=Math.round((TROPIC_GRID.maxZ-TROPIC_GRID.minZ)/TROPIC_GRID.step);
let heights=null,shoreField=null;
function grid(){
 if(heights)return heights;
 heights=new Float32Array((NX+1)*(NZ+1));shoreField=new Float32Array((NX+1)*(NZ+1));
 for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++){const u=TROPIC_GRID.minX+i*TROPIC_GRID.step,v=TROPIC_GRID.minZ+j*TROPIC_GRID.step,k=j*(NX+1)+i;shoreField[k]=shoreSigned(u,v);heights[k]=shapeHeight(u,v,shoreField[k]);}
 return heights;
}
/** Height above sea level of the drawn ground at (u,v), island frame; -3 off the grid. */
export function tropicHeight(u,v){
 const H=grid(),G=TROPIC_GRID,fx=(u-G.minX)/G.step,fz=(v-G.minZ)/G.step;
 if(fx<0||fz<0||fx>=NX||fz>=NZ)return -3;
 const i=Math.floor(fx),j=Math.floor(fz),tx=fx-i,tz=fz-j,a=H[j*(NX+1)+i],b=H[j*(NX+1)+i+1],c=H[(j+1)*(NX+1)+i],d=H[(j+1)*(NX+1)+i+1];
 // Triangles (a,c,b) and (b,c,d): the diagonal runs from b to c.
 return tx+tz<=1?a+(b-a)*tx+(c-a)*tz:d+(c-d)*(1-tx)+(b-d)*(1-tz);
}
/** The waterline distance read off the grid: close enough to place a plant by. */
function shoreAt(u,v){
 grid();const G=TROPIC_GRID,fx=Math.max(0,Math.min(NX-1e-6,(u-G.minX)/G.step)),fz=Math.max(0,Math.min(NZ-1e-6,(v-G.minZ)/G.step)),i=Math.floor(fx),j=Math.floor(fz),tx=fx-i,tz=fz-j,F=shoreField,k=j*(NX+1)+i;
 return (F[k]*(1-tx)+F[k+1]*tx)*(1-tz)+(F[k+NX+1]*(1-tx)+F[k+NX+2]*tx)*tz;
}
/** True where a walker's feet are on dry island ground. */
export function tropicLand(u,v){return tropicHeight(u,v)>.18;}

/** The island's surface name at a point, for footsteps and the map. */
export function tropicSurface(u,v){
 const t=trailDistance(u,v);if(t<1.4)return 'gravel';
 return shoreAt(u,v)<10&&plateauWeight(u,v)<.5?'sand':'grass';
}

function mulberry(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}

/**
 * Every tree and bush on the island, placed once by rule, the same on every device:
 * coconut palms on the sand above the tide line, leaning to the sea; rainforest trees on
 * the hill; flowering shrubs where people pass. Nothing on the trail, the plaza, the quay or
 * the airside.
 */
import {KITANO_HAMLET,KITANO_DUG} from './kitano-hamlet-layout.js';
const HAMLET=KITANO_HAMLET.clear;
/** Inside Kitano hamlet's lane and yards: slabs over the ground, where nothing grows through. */
const inHamlet=(u,v,r=0)=>HAMLET.some(H=>u>H.minX-r&&u<H.maxX+r&&v>H.minZ-r&&v<H.maxZ+r);
let plantings=null;
export function tropicalPlantings(){
 if(plantings)return plantings;
 grid();const rand=mulberry(19970710),palms=[],trees=[],bushes=[],pandanus=[],bananas=[],ferns=[],grass=[],rocks=[],driftwood=[],shells=[];
 const P=TROPIC_PLACES,clearOfPlaces=(u,v,r)=>{
  if(u>P.plaza.minX-r&&u<P.plaza.maxX+r&&v>P.plaza.minZ-r-6&&v<P.plaza.maxZ+r)return false;
  if(u<-36&&v>14&&v<42)return false;
  // Kitano hamlet's lane and yards (kitano-hamlet-layout.js).
  if(inHamlet(u,v,r))return false;
  // The lookout keeps its view: no rainforest trees within fourteen metres of the deck,
  // and none on the west slope below it, where the view runs across the strait to Minato.
  if(Math.hypot(u-P.lookout[0],v-P.lookout[1])<(r>1?(u<P.lookout[0]+6?26:14):5)+r)return false;
  if(Math.hypot(u-P.coralBay[0],v-P.coralBay[1])<5+r)return false;
  if(Math.hypot(u-P.beachBar[0],v-P.beachBar[1])<6+r)return false;
  if(P.parasols.some(([x,z])=>Math.hypot(u-x,v-z)<3+r))return false;
  return trailDistance(u,v)>1.6+r;
 };
 const airside=(u,v)=>v<P.fence+1.5&&v>-16;
 const pick=()=>[TROPIC_GRID.minX+rand()*(TROPIC_GRID.maxX-TROPIC_GRID.minX),TROPIC_GRID.minZ+rand()*(TROPIC_GRID.maxZ-TROPIC_GRID.minZ)];
 const apart=(list,u,v,r)=>!list.some(p=>Math.hypot(p.u-u,p.v-v)<r);
 const seaward=(u,v)=>{const e=.7,gx=shoreAt(u+e,v)-shoreAt(u-e,v),gz=shoreAt(u,v+e)-shoreAt(u,v-e);return Math.atan2(-gz,-gx);};
 // Coconut palms on the sand above the tide line, leaning out to sea as beach palms do.
 for(let n=0;n<4000&&palms.length<110;n++){
  const [u,v]=pick(),d=shoreAt(u,v);
  if(d<2.6||d>13||airside(u,v)||!clearOfPlaces(u,v,.8)||plateauWeight(u,v)>.4||!apart(palms,u,v,4.4))continue;
  palms.push({u,v,y:tropicHeight(u,v),lean:seaward(u,v),scale:.8+rand()*.35,turn:rand()*Math.PI*2,kind:Math.floor(rand()*3)});
 }
 // Rainforest on the hill and the inland flats.
 for(let n=0;n<9000&&trees.length<170;n++){
  const [u,v]=pick(),d=shoreAt(u,v);
  if(d<12||airside(u,v)||v<P.fence+3||!clearOfPlaces(u,v,1.6)||plateauWeight(u,v)>.25||!apart(trees,u,v,4.6))continue;
  trees.push({u,v,y:tropicHeight(u,v),scale:.8+rand()*.5,turn:rand()*Math.PI*2,kind:Math.floor(rand()*3)});
 }
 // Adan (pandanus) behind the beaches and on the headlands, where the salt wind is.
 for(let n=0;n<4000&&pandanus.length<36;n++){
  const [u,v]=pick(),d=shoreAt(u,v);
  if(d<4||d>15||airside(u,v)||!clearOfPlaces(u,v,1)||plateauWeight(u,v)>.3||!apart(pandanus,u,v,6)||!apart(palms,u,v,2.4)||!apart(trees,u,v,3))continue;
  pandanus.push({u,v,y:tropicHeight(u,v),scale:.9+rand()*.4,turn:rand()*Math.PI*2});
 }
 // Banana plants in the clearings by the trail, and a stand behind the beach bar.
 for(let n=0;n<4000&&bananas.length<34;n++){
  const [u,v]=pick(),d=shoreAt(u,v),t=trailDistance(u,v),bar=Math.hypot(u-P.beachBar[0]+1,v-P.beachBar[1]+7);
  if(!(t>2.6&&t<7&&d>10||bar<6)||airside(u,v)||!clearOfPlaces(u,v,.9)||!apart(bananas,u,v,2.4)||!apart(trees,u,v,2.6)||!apart(palms,u,v,2))continue;
  bananas.push({u,v,y:tropicHeight(u,v),scale:.85+rand()*.35,turn:rand()*Math.PI*2});
 }
 // Shrubs; bougainvillea where people pass, along the trail and round the plaza.
 for(let n=0;n<9000&&bushes.length<150;n++){
  const [u,v]=pick(),d=shoreAt(u,v);
  if(d<5||airside(u,v)||v<P.fence+1||!clearOfPlaces(u,v,.6))continue;
  if(plateauWeight(u,v)>.5&&!(u>P.plaza.minX-4&&u<P.plaza.maxX+4&&v>P.plaza.maxZ&&v<P.plaza.maxZ+4))continue;
  if(!apart(bushes,u,v,2.2)||!apart(trees,u,v,1.8)||!apart(palms,u,v,1.4)||!apart(pandanus,u,v,1.8)||!apart(bananas,u,v,1.5))continue;
  const near=trailDistance(u,v)<5||v<P.plaza.maxZ+5;
  const flower=near&&rand()<.4;bushes.push({u,v,y:tropicHeight(u,v),scale:(flower?.7:.75)+rand()*.5,turn:rand()*Math.PI*2,flower,kind:flower?(rand()<.6?1:2):0});
 }
 // Ferns on the forest floor, in the trees' shade.
 for(let n=0;n<9000&&ferns.length<170;n++){
  const [u,v]=pick(),d=shoreAt(u,v);
  if(d<12||airside(u,v)||!clearOfPlaces(u,v,.3)||apart(trees,u,v,4.5)||!apart(trees,u,v,.9)||!apart(ferns,u,v,1.2))continue;
  ferns.push({u,v,y:tropicHeight(u,v),scale:.8+rand()*.6,turn:rand()*Math.PI*2});
 }
 // Grass tufts on the lawns and where the dune grass holds the back of the beach.
 for(let n=0;n<12000&&grass.length<900;n++){
  const [u,v]=pick(),d=shoreAt(u,v);
  // Only on ground that is earth: never the quay, the cargo court, the walks or the plaza.
  if(v<P.plaza.minZ+.5&&u<P.plaza.maxX+2||u<-44&&v<40||u>-54&&u<-9&&v>19&&v<37)continue;
  if(d<3.5||airside(u,v)||trailDistance(u,v)<1.2||(u>P.plaza.minX-1&&u<P.plaza.maxX+1&&v>P.plaza.minZ-1&&v<P.plaza.maxZ+1)||Math.hypot(u-P.beachBar[0],v-P.beachBar[1])<3.5)continue;
  if(d>9&&d<12&&rand()<.5)continue;
  // Not through the hamlet's slabs (the yards, the lane): grass there stood up through the paving.
  if(inHamlet(u,v,.3))continue;
  grass.push({u,v,y:tropicHeight(u,v),scale:.7+rand()*.8,turn:rand()*Math.PI*2});
 }
 // Coral-limestone rocks along the waterline of the headlands (the bays keep their sand),
 // and a few weathered boulders up on the hill.
 for(let n=0;n<9000&&rocks.length<90;n++){
  const [u,v]=pick(),d=shoreAt(u,v),bay=Math.hypot(u-P.coralBay[0],v-P.coralBay[1])<26;
  const coast=d>-2&&d<1.4&&!bay&&u>P.quayU+3,hill=d>18&&plateauWeight(u,v)<.1&&tropicHeight(u,v)>2.5&&rand()<.2;
  if(!(coast||hill)||!apart(rocks,u,v,1.6))continue;
  if(hill&&(!clearOfPlaces(u,v,1.2)||airside(u,v)||!apart(trees,u,v,2.5)))continue;
  rocks.push({u,v,y:tropicHeight(u,v)-(hill?.25:.15),scale:hill?1+rand()*.6:.55+rand()*.9,turn:rand()*Math.PI*2,kind:Math.floor(rand()*3),hill});
 }
 // What the tide leaves: bleached driftwood and shells on the sand.
 for(let n=0;n<3000&&driftwood.length<9;n++){const [u,v]=pick(),d=shoreAt(u,v);if(d<1.2||d>4||airside(u,v)||plateauWeight(u,v)>.3||!clearOfPlaces(u,v,1)||!apart(driftwood,u,v,10))continue;driftwood.push({u,v,y:tropicHeight(u,v),scale:.7+rand()*.5,turn:rand()*Math.PI*2});}
 for(let n=0;n<5000&&shells.length<80;n++){const [u,v]=pick(),d=shoreAt(u,v);if(d<.8||d>5||airside(u,v)||plateauWeight(u,v)>.3||inHamlet(u,v,.3)||!apart(shells,u,v,.8))continue;shells.push({u,v,y:tropicHeight(u,v),scale:.8+rand()*.6,turn:rand()*Math.PI*2,kind:Math.floor(rand()*2)});}
 plantings={palms,trees,bushes,pandanus,bananas,ferns,grass,rocks,driftwood,shells};
 return plantings;
}

const SAND=new THREE.Color(0xf6ead0),WET=new THREE.Color(0xe3d2ad),LAWN=new THREE.Color(0x76a654),JUNGLE=new THREE.Color(0x4a8139),HIGH=new THREE.Color(0x3d7234),TRAIL=new THREE.Color(0xdcc597),QUAY=new THREE.Color(0xb9b4a6);

function terrainGeometry(){
 const H=grid(),G=TROPIC_GRID,pos=new Float32Array((NX+1)*(NZ+1)*3),col=new Float32Array((NX+1)*(NZ+1)*3),idx=[],c=new THREE.Color();
 for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++){
  const k=j*(NX+1)+i,u=G.minX+i*G.step,v=G.minZ+j*G.step,h=H[k],d=shoreField[k],w=plateauWeight(u,v);
  pos.set([u,h,v],k*3);
  if(d<1.2)c.copy(WET);else c.copy(SAND).lerp(d>12?JUNGLE:LAWN,smooth(7,12,d)*(1-w));
  if(w>.02)c.lerp(LAWN,Math.min(1,w*1.4)*smooth(1,5,d));
  if(h>3)c.lerp(HIGH,smooth(3,12,h));
  if(u<-50&&v>17&&v<39&&d<4)c.copy(QUAY);
  const t=trailDistance(u,v);if(t<1.8&&d>1)c.lerp(TRAIL,1-smooth(.9,1.8,t));
  // A faint, fixed mottling so the lawn and sand do not read as plastic.
  const m=1+.04*Math.sin(u*1.7+v*.9)*Math.cos(v*1.3-u*.4);col.set([c.r*m,c.g*m,c.b*m],k*3);
 }
 for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){
  const a=j*(NX+1)+i,b=a+1,c2=a+NX+1,d=c2+1;
  // Skip cells wholly under the sea floor's flat floor; the opaque sea hides them anyway.
  if(Math.max(H[a],H[b],H[c2],H[d])<-2.9)continue;
  // Skip the cells Johansson's court and lightwell are dug through: their walls line the pits, and the yard's slab
  // covers the rest of each cell (kitano-hamlet-layout.js KITANO_DUG).
  const u0=G.minX+i*G.step,v0=G.minZ+j*G.step;
  if(KITANO_DUG.some(q=>u0<q.maxX&&u0+G.step>q.minX&&v0<q.maxZ&&v0+G.step>q.minZ))continue;
  idx.push(a,c2,b,b,c2,d);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
 return g;
}

/**
 * Draws the island into `group` (the airport island's own frame). With `plants:false` only its ground and quay, and its
 * plants as they are read from across the strait (farPlants); `addPlants()` grows the real ones when he is on his way
 * (town.js world.kitano). Once both exist, `lod` shows the real ones within 240 m of the island and the far ones beyond
 * 260 m, where the difference is a few pixels.
 */
export function buildTropicalIsland(group,{plants=true}={}){
 const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.95,...extra});
 const terrain=new THREE.Mesh(terrainGeometry(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
 terrain.name='Kitano-jima island ground';terrain.receiveShadow=true;group.add(terrain);
 // The ferry quay's face, where the cargo court meets deep water.
 const quay=new THREE.Mesh(new THREE.BoxGeometry(1.2,4,19),mat(0xa8a396));quay.name='Kitano-jima ferry quay wall';quay.position.set(TROPIC_PLACES.quayU-.2,-.92,28);quay.userData.staticProp=true;group.add(quay);
 const P=tropicalPlantings(),m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 const detail=[],treeLods=[];let real=null,far=null;
 /** One instanced draw per plant model into `parent`; `angle` turns it, `variant` picks which model of a kind. */
 const plantInto=parent=>(name,models,list,{material,angle=it=>it.turn,small=false}={})=>models.forEach((geometry,variant)=>{
  const items=list.filter(it=>(it.kind??0)%models.length===variant);if(!items.length)return;
  const im=new THREE.InstancedMesh(geometry,material,items.length);im.name=name;
  items.forEach((it,k)=>{q.setFromAxisAngle(up,angle(it));m.compose(p.set(it.u,it.y,it.v),q,s.setScalar(it.scale));im.setMatrixAt(k,m);});
  im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();im.computeBoundingBox?.();parent.add(im);if(small)detail.push(im);
  if(TREE_REBUILD&&geometry.userData.treeDesign){const {family,options}=geometry.userData.treeDesign;treeLods.push({mesh:im,near:geometry,mid:treeDesignGeometry(family,{...options,lod:'mid'})});}
 });
 function addPlants(){
  if(real)return real;
  real=new THREE.Group();real.name='Kitano-jima plants';group.add(real);
  // One material for every plant: the colours are painted into each plant's vertices.
  const foliage=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,side:THREE.DoubleSide});
  const solid=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}),plantOne=plantInto(real);
  const plant=(name,models,list,o={})=>plantOne(name,models,list,{material:foliage,...o});
  plant('Coconut palms',TREE_REBUILD?PALM_VARIANTS.map(v=>treeDesignGeometry('palm',v)):[coconutPalm({seed:3,height:8.5,bow:1.8}),coconutPalm({seed:8,height:10,bow:3}),coconutPalm({seed:13,height:7,bow:1})],P.palms,{angle:it=>-it.lean});
  plant('Rainforest trees',TREE_REBUILD?FOREST_VARIANTS.map(v=>treeDesignGeometry('broadleaf',v)):[rainforestTree({seed:2,height:8,spread:3.4}),rainforestTree({seed:5,height:10,spread:4,light:0x7cbd58,dark:0x285c31}),rainforestTree({seed:9,height:7,spread:3,light:0x8ab858,dark:0x33652f,mid:0x56913f})],P.trees);
  plant('Adan (pandanus)',[TREE_REBUILD?treeDesignGeometry('pandanus'):pandanus({seed:4})],P.pandanus);
  plant('Banana plants',[TREE_REBUILD?treeDesignGeometry('banana'):bananaPlant({seed:6})],P.bananas);
  plant('Island shrubs',[shrub({seed:3}),shrub({seed:7,flowers:0xb83a78}),shrub({seed:11,flowers:0xd8423a})],P.bushes);
  plant('Forest ferns',[fern({seed:2})],P.ferns,{small:true});
  plant('Grass tufts',[grassTuft({seed:1}),grassTuft({seed:4,height:.6,blades:11})],P.grass.map((g,k)=>({...g,kind:k%2})),{small:true});
  plant('Coral-limestone rocks',[rock({seed:1,size:.9}),rock({seed:2,size:.8,flat:.55}),rock({seed:5,size:1,flat:.8,light:0xcfc6b0,dark:0x7f7a70})],P.rocks,{material:solid});
  plant('Driftwood',[driftwood({seed:3})],P.driftwood,{material:solid,small:true});
  plant('Shells',[shell({seed:1}),shell({seed:2})],P.shells,{small:true});
  return real;
 }
 if(plants)addPlants();else far=farPlants(group,P);
 /** Ferns, grass and shells are only worth drawing within a stroll of them; the far plants only from across the strait. */
 let near=null,closeTrees=null;
 const lod=at=>{
  if(!at)return;const d=group.position.distanceTo(new THREE.Vector3(at.x,group.position.y,at.z));
  for(const x of detail)x.visible=d<=150;
  if(TREE_REBUILD){closeTrees=d<(closeTrees?135:120);for(const tree of treeLods)tree.mesh.geometry=closeTrees?tree.near:tree.mid;}
  if(real&&far){near=d<(near?260:240);real.visible=near;far.visible=!near;}
 };
 return {terrain,plantings:P,lod,addPlants,get plants(){return real;},get farPlants(){return far;}};
}

/**
 * Kitano-jima's plants as they are read from Minato and the strait: at each palm, tree, pandanus, banana, shrub and rock
 * its own place, size and turn (tropicalPlantings), drawn as a few simple shapes in the plants' own colours: about 10k
 * triangles for the 355k of the real ones. Ferns, grass, shells and driftwood are not seen from there.
 */
export function farPlants(group,P=tropicalPlantings()){
 if(TREE_REBUILD)return designedFarPlants(group,P);
 const far=new THREE.Group();far.name='Kitano-jima distant plants';group.add(far);
 const paint=(geometry,hex)=>{const g=geometry.index?geometry.toNonIndexed():geometry,c=new THREE.Color(hex),n=g.attributes.position.count,col=new Float32Array(n*3);for(let i=0;i<n;i++)c.toArray(col,i*3);g.setAttribute('color',new THREE.BufferAttribute(col,3));g.deleteAttribute('uv');return g;};
 const shape=parts=>mergeGeometries(parts.map(([geometry,hex])=>paint(geometry,hex)),false);
 const crown=(r,y,flat,hex)=>[new THREE.IcosahedronGeometry(r,0).scale(1,flat,1).translate(0,y,0),hex];
 const trunk=(r,h,hex)=>[new THREE.CylinderGeometry(r*.7,r,h,5).translate(0,h/2,0),hex];
 // Sizes are the real models' (vegetation-kit.js): palms 7–10 m with a 2 m crown of fronds, trees 7–10 m and 3–4 m wide.
 const models={
  palms:shape([trunk(.2,8.4,0x8a7a5a),crown(2.2,8.4,.32,0x5f9a45)]),
  trees:shape([trunk(.3,4.2,0x6a5a42),crown(3.4,5.6,.8,0x3f7a3a)]),
  pandanus:shape([trunk(.15,1.2,0x7a6a4a),crown(1.3,1.8,.6,0x6a9a4a)]),
  bananas:shape([crown(1.1,1.4,.9,0x7ab84a)]),
  bushes:shape([crown(.7,.55,.75,0x4f8a42)]),
  rocks:shape([crown(.6,.2,.6,0xbdb6a4)]),
 };
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,flatShading:true});
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 for(const [kind,geometry] of Object.entries(models)){
  const list=P[kind];if(!list?.length)continue;
  const im=new THREE.InstancedMesh(geometry,material,list.length);im.name='Kitano-jima distant '+kind;
  list.forEach((it,k)=>{q.setFromAxisAngle(up,it.turn??0);m.compose(p.set(it.u,it.y,it.v),q,s.setScalar(it.scale??1));im.setMatrixAt(k,m);});
  im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();far.add(im);
 }
 return far;
}

/** Same instances, seeds, lean and canonical silhouettes as the near trees, at a lower mesh sampling density. */
function designedFarPlants(group,P){
 const far=new THREE.Group();far.name='Kitano-jima distant plants';group.add(far);
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95});
 const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 const lists=[['palms','palm',PALM_VARIANTS],['trees','broadleaf',FOREST_VARIANTS],['pandanus','pandanus',[{}]],['bananas','banana',[{}]]];
 for(const [name,family,variants] of lists)variants.forEach((variant,i)=>{
  const list=P[name].filter(it=>(it.kind??0)%variants.length===i);if(!list.length)return;
  const mesh=new THREE.InstancedMesh(treeDesignGeometry(family,{...variant,lod:'far'}),material,list.length);mesh.name='Kitano-jima distant '+name;
  list.forEach((it,k)=>{q.setFromAxisAngle(up,name==='palms'?-it.lean:it.turn);matrix.compose(p.set(it.u,it.y,it.v),q,s.setScalar(it.scale));mesh.setMatrixAt(k,matrix);});
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.computeBoundingBox?.();far.add(mesh);
 });
 // Shrubs and rocks retain the old small silhouettes; do not duplicate the four tree collections.
 const legacyP={...P,palms:[],trees:[],pandanus:[],bananas:[]};
 // Build only the six simple shrub/rock batches, using the legacy path without changing the global flag.
 for(const [name,color,radius,cy,flat] of [['bushes',0x4f8a42,.7,.55,.75],['rocks',0xbdb6a4,.6,.2,.6]]){
  const list=legacyP[name];if(!list.length)continue;const geometry=new THREE.IcosahedronGeometry(radius,0).scale(1,flat,1).translate(0,cy,0),colors=new Float32Array(geometry.attributes.position.count*3),c=new THREE.Color(color);
  for(let i=0;i<colors.length;i+=3)c.toArray(colors,i);geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const mesh=new THREE.InstancedMesh(geometry,material,list.length);mesh.name='Kitano-jima distant '+name;
  list.forEach((it,k)=>{q.setFromAxisAngle(up,it.turn??0);matrix.compose(p.set(it.u,it.y,it.v),q,s.setScalar(it.scale??1));mesh.setMatrixAt(k,matrix);});mesh.computeBoundingSphere();far.add(mesh);
 }
 return far;
}
