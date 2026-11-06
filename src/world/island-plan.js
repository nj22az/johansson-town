import {SHOPPING_LANE_ROUTES} from './shopping-lane-plan.js';
import {routeFinder} from './plan-index.js';
import {GARDEN,GARDEN_PATHS} from './garden-layout.js';

/** Compact urban island. Archived rural modules are not part of the active world. */
export const ISLAND=Object.freeze({name:'Johansson Island',mountain:{name:'Mount Aoba',x:66,z:198,height:14,radiusX:30,radiusZ:28},pond:{...GARDEN.pond,radius:GARDEN.pond.rx},village:{name:'Hoshizaki Fishing Village',x:132,z:190},lighthouse:{x:-54,z:204},viewpoint:{x:40,z:158}});
/** Separate customer, shopkeeper and lunch queue positions outside the south wall. */
export const HOSHIZAKI_STORE=Object.freeze({
 customer:Object.freeze([126,207.3]),
 clerk:Object.freeze([126,205.65]),
 waiting:Object.freeze([127.25,207.3]),
 clerkFace:Object.freeze([0,1]),
 waitingFace:Object.freeze([-1.25,-1.65]),
});
// The main island ends at the inhabited urban blocks. Rural districts are reserved
// for a later tropical-island expansion; they must not extend this land polygon.
export const ISLAND_COAST=[[-40,30],[-40,77],[-26,77],[-26,95],[10,95],[10,80],[49,80],[49,57]];
export const COAST_ROAD=[];
/** Continuous pedestrian circuit; its harbour section uses the existing quay and seawall walk. */
export const COAST_WALK=[
 [46.5,57],[46.5,76.5],[7.5,76.5],[7.5,92],[-23.5,92],[-23.5,75],[-37,75],[-37,57],[-36.5,48],[-36.7,30],[-36.7,15],[-36.7,-21.5],
 [-36.7,-27.5],[-24.5,-27.5],[-24.5,-38.5],[-19,-38.5],[-18.5,-35.85],[-8.5,-35.85],[-8.5,-36.5],
 [0,-36.5],[20,-36.5],[20,-27],[31.8,-27],[31.8,-10],[43.6,-10],[43.6,40],
 [43.3,52],[43.3,57],[46.5,57],
];

export const COAST_CONNECTOR=[[-37,30],[-37,-42],[-18,-42],[0,-36],[17,-36],[31,-25],[43,1],[43,40]];
export const MOUNTAIN_TRAIL=[[23.5,73],[23.5,95],[23.5,112],[24,134],[28,151],[40,158],[40,167]];
/**
 * From the end of the mountain trail at Aoba Radio, a footpath spirals once and a half round
 * Mount Aoba to the utaki on its summit, so it never climbs steeper than a person walks.
 */
export const AOBA_SUMMIT=Object.freeze({x:66,z:198});
export const SUMMIT_PATH=[[40,167],[48.6,177.3],[54.9,174.1],[61.5,172.7],[68.2,173],[74.4,175],[79.7,178.5],[83.8,183.1],[86.4,188.5],[87.6,194.2],[87.2,199.9],[85.4,205.1],[82.4,209.5],[78.4,212.8],[73.9,214.9],[69.1,215.8],[64.5,215.4],[60.3,213.8],[56.7,211.2],[54.1,208],[52.5,204.3],[52,200.5],[52.5,196.8],[53.8,193.6],[55.9,190.9],[58.5,189.1],[61.3,188],[64.2,187.8],[66.9,188.3],[69.1,189.4],[70.9,191.1],[72,193],[72.5,195],[72.5,196.9],[71.9,198.5],[71,199.8],[69.8,200.7],[68.6,201.1]];
export const ISLAND_ROUTES=[...GARDEN_PATHS,...SHOPPING_LANE_ROUTES,{id:'island-coast-walk',peninsula:true,width:2.4,surface:'stone',points:COAST_WALK},{id:'kitahama-west-link',peninsula:true,width:3,surface:'stone',points:[[-37,57],[-35,57]]}].map(r=>({...r,terrain:!r.park}));
export function nearestSegment(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);}
/** The first island route under (x,z), through its index (plan-index.js): the answer a scan of every segment gives. */
const findIslandRoute=routeFinder(ISLAND_ROUTES);
export function islandRouteAt(x,z){return findIslandRoute(x,z);}
export const TERRAIN_GRID=Object.freeze({minX:-53,maxX:118,minZ:97,maxZ:268,step:3});
function authoredHeight(){return -.4;}
const G=TERRAIN_GRID,nx=Math.round((G.maxX-G.minX)/G.step)+1,nz=Math.round((G.maxZ-G.minZ)/G.step)+1;
export const MOUNTAIN_VERTICES=Array.from({length:nx*nz},(_,i)=>authoredHeight(G.minX+i%nx*G.step,G.minZ+Math.floor(i/nx)*G.step));
/** Match the rendered triangles exactly, including pond basin and trail grounding. */
export function islandTerrainHeight(x,z){if(x<G.minX||x>G.maxX||z<G.minZ||z>G.maxZ)return null;const fx=(x-G.minX)/G.step,fz=(z-G.minZ)/G.step,ix=Math.min(nx-2,Math.floor(fx)),iz=Math.min(nz-2,Math.floor(fz)),u=fx-ix,v=fz-iz,a=MOUNTAIN_VERTICES[iz*nx+ix],b=MOUNTAIN_VERTICES[iz*nx+ix+1],c=MOUNTAIN_VERTICES[(iz+1)*nx+ix],d=MOUNTAIN_VERTICES[(iz+1)*nx+ix+1];return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}
export const ISLAND_LANDMARKS=[
 {id:'harbour-park',title:'Minato Harbour Park',aliases:['park','aoba-garden','japanese-garden','east-garden'],x:GARDEN.entry[0],z:GARDEN.entry[1],line:'The park opposite Sakura: Umi-no-yu, one cherry, the pond, Rainflower Florist and an open shore walk.'},
].map(s=>({...s,sub:'ISLAND COAST & NEIGHBOURHOODS',exitPosition:[s.x,s.id==='harbour-park'?0:islandTerrainHeight(s.x,s.z)??-.4,s.z],entryFacing:0}));
