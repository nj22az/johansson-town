import * as THREE from '../../vendor/three.module.js';
import {FERRY_FLOORS,FERRY_SOLIDS} from '../world/ferry-walk.js';
import {BELOW_DECK_FLOORS,FERRY_INTERIOR} from '../world/ferry-interior.js';
import {FERRY_H1,FERRY_H1_SHOTS,ferryShotAt,h1ToLocal} from '../world/ferry-engine-room-plan.js';
import {FERRY_INSPECT,FERRY_LADDER} from '../world/ferry-inspect.js';

const rooms=new Set(BELOW_DECK_FLOORS),flat=FERRY_H1.floor-1.9;
const floors=FERRY_FLOORS.filter(f=>f.part==='ship'&&rooms.has(f.id));
const solids=FERRY_SOLIDS.filter(s=>s.part==='ship');
// Glazing does not need a standing-person box (the sill already stops a body), but a lens must not pass through it.
for(const g of FERRY_INTERIOR.glass){
 const half=new THREE.Vector3(...g.size).multiplyScalar(.5),matrix=new THREE.Matrix4().compose(new THREE.Vector3(...g.pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(...(g.rot||[0,0,0]))),new THREE.Vector3(1,1,1));
 const b=new THREE.Box3(half.clone().negate(),half).applyMatrix4(matrix);solids.push({camera:true,walk:false,x:[b.min.x,b.max.x],y:[b.min.y,b.max.y],z:[b.min.z,b.max.z]});
}
export const FERRY_EXPLORE_SPEED=1,FERRY_PRECISION_SPEED=.35;
export const FERRY_EXPLORE_ROOMS=floors.filter(f=>!f.id.startsWith('er-'));
export const FERRY_EXPLORE_TARGETS=FERRY_INSPECT.filter(t=>t.pos[1]>=flat&&t.pos[1]<flat+FERRY_H1.clearHeight&&t.pos[2]>8-17.25&&t.pos[2]<26.5-17.25);
const routeCells=new Map();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
const floorY=(f,z)=>Array.isArray(f.y)?THREE.MathUtils.lerp(f.y[0],f.y[1],clamp((z-f.z[0])/(f.z[1]-f.z[0]),0,1)):f.y;
/** Enclosed machinery spaces have no street outlook. Preserve the ship/people and all scene lighting,
 * but do not submit the hidden town behind their opaque bulkheads. Restore even if a render fails. */
export function withFerryInteriorView(town,ship,people,draw){
 const keep=new Set(),hidden=[];
 for(const root of [ship,...people])for(let p=root;p;p=p.parent){keep.add(p);if(p===town)break;}
 const visit=o=>{for(const child of o.children){if(!child.visible)continue;if(child===ship||people.includes(child))continue;if(keep.has(child))visit(child);else if(!child.isLight){hidden.push(child);child.visible=false;}}};
 try{visit(town);return draw();}finally{for(const o of hidden)o.visible=true;}
}
export function ferryLocalFloor(x,z,y=flat,r=0){
 return floors.find(f=>x>=f.x[0]&&x<=f.x[1]&&z>=f.z[0]&&z<=f.z[1]&&Math.abs(floorY(f,z)-y)<.25&&(!f.inside||f.inside(x,z,r)))||null;
}
export function ferryLocalBlocked(p,r=.1,height=null){
 return solids.some(s=>{
  if(height===null){if(!s.camera||p.y<s.y[0]-r||p.y>s.y[1]+r)return false;}
  else if(!s.walk||s.y[0]>=p.y+height||s.y[1]<=p.y+.03)return false;
  return p.x>s.x[0]-r&&p.x<s.x[1]+r&&p.z>s.z[0]-r&&p.z<s.z[1]+r;
 });
}
/** Short swept steps, resolving each axis in sequence: no diagonal corner cuts or wall tunnelling. */
export function slideFerryLens(from,to){
 const p=from.clone(),d=to.clone().sub(from),steps=Math.max(1,Math.ceil(d.length()/.04));d.divideScalar(steps);
 for(let i=0;i<steps;i++)for(const axis of ['x','y','z']){
  const q=p.clone();q[axis]+=d[axis];
  if(q.x< -3.9||q.x>3.9||q.z<8.6-17.25||q.z>26.3-17.25||q.y<flat+.16||q.y>flat+FERRY_H1.clearHeight-.12||ferryLocalBlocked(q))continue;
  p.copy(q);
 }
 return p;
}
/** A floor-plan route to the actual lower ladder landing. Never teleports or steers the player. */
export function ferryLadderRoute(start){
 if(Math.abs(start.y-flat)>.2||!ferryLocalFloor(start.x,start.z,start.y,.28)||ferryLocalBlocked(start,.28,1.82))return [];
 const step=.2,x0=-3.95,z0=8.6-17.25,nx=41,nz=90,goal=new THREE.Vector3(...FERRY_LADDER.up.at);goal.y=flat;
 const index=(x,z)=>clamp(Math.round((z-z0)/step),0,nz-1)*nx+clamp(Math.round((x-x0)/step),0,nx-1);
 const point=i=>new THREE.Vector3(x0+(i%nx)*step,flat,z0+Math.floor(i/nx)*step),cache=routeCells;
 const clear=i=>{if(!cache.has(i)){const p=point(i);cache.set(i,!!ferryLocalFloor(p.x,p.z,flat,.28)&&!ferryLocalBlocked(p,.28,1.82));}return cache.get(i);};
 const seed=index(start.x,start.z),candidates=[];
 for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){
  const x=seed%nx+dx,z=Math.floor(seed/nx)+dz,i=z*nx+x;if(x<0||x>=nx||z<0||z>=nz||!clear(i))continue;
  const p=point(i),n=Math.ceil(p.distanceTo(start)/.025);let ok=true;
  for(let j=1;j<=n;j++){const q=start.clone().lerp(p,j/n);if(!ferryLocalFloor(q.x,q.z,q.y,.28)||ferryLocalBlocked(q,.28,1.82)){ok=false;break;}}
  if(ok)candidates.push(i);
 }
 candidates.sort((a,b)=>point(a).distanceToSquared(start)-point(b).distanceToSquared(start));if(!candidates.length)return [];
 const a=candidates[0],b=index(goal.x,goal.z),open=[a],cost=new Map([[a,0]]),came=new Map(),done=new Set();
 const heuristic=i=>Math.abs(i%nx-b%nx)+Math.abs(Math.floor(i/nx)-Math.floor(b/nx));
 while(open.length){
  open.sort((a,b)=>(cost.get(a)+heuristic(a))-(cost.get(b)+heuristic(b)));const i=open.shift();if(done.has(i))continue;
  if(i===b){const path=[goal];for(let k=i;k!==a;k=came.get(k))path.push(point(k));path.push(point(a),start.clone());return path.reverse();}
  done.add(i);const x=i%nx,z=Math.floor(i/nx);
  for(const j of [x>0?i-1:-1,x<nx-1?i+1:-1,z>0?i-nx:-1,z<nz-1?i+nx:-1]){
   if(j<0||done.has(j)||!clear(j))continue;const c=cost.get(i)+1;
   if(c<(cost.get(j)??Infinity)){cost.set(j,c);came.set(j,i);open.push(j);}
  }
 }
 return [];
}

/** One ship-local owner for the final rendered lens. Walking never selects a shot. */
export function createFerryExploration(camera){
 const local=new THREE.Vector3(),eye=new THREE.Vector3(),worldQ=new THREE.Quaternion(),lookQ=new THREE.Quaternion();
 let ship=null,deck=null,saved=null,overridden=false,mode='walk',shot=0,focus=null,orbit=null,lens=null,look=null,precision=false;
 const restore=()=>{if(saved){camera.fov=saved.fov;camera.zoom=saved.zoom;camera.near=saved.near;camera.up.copy(saved.up);camera.updateProjectionMatrix();}saved=null;mode='walk';focus=null;orbit=null;lens=null;look=null;};
 function walk(){mode='walk';focus=null;orbit=null;lens=null;}
 function inspect(target,point=null){
  if(!saved||!target)return false;
  const at=point?.clone()||new THREE.Vector3(...target.pos),from=ship.worldToLocal(camera.position.clone());
  if(at.distanceTo(local)>4)return false;
  const d=from.clone().sub(at),distance=Math.max(.35,d.length());
  focus={...target,point:at};orbit={yaw:Math.atan2(d.x,d.z),pitch:Math.asin(clamp(d.y/distance,-1,1)),distance};lens=from;mode='inspect';return true;
 }
 return {
  sync({ship:nextShip,position,deck:nextDeck,override=false}){
   if(!nextShip||!rooms.has(nextDeck?.floor?.id)){if(saved)restore();ship=null;deck=null;return false;}
   ship=nextShip;deck=nextDeck;ship.updateWorldMatrix(true,false);local.copy(position);ship.worldToLocal(local);overridden=override;
   if(!saved)saved={fov:camera.fov,zoom:camera.zoom,near:camera.near,up:camera.up.clone()};
   return !override;
  },
  apply({yaw,pitch,dt=1/60,fov=saved?.fov??65}={}){
   if(!saved||overridden)return false;
   ship.updateWorldMatrix(true,false);ship.getWorldQuaternion(worldQ);
   if(mode==='overview'){
    const s=FERRY_H1_SHOTS[shot];camera.position.copy(ship.localToWorld(eye.set(...h1ToLocal(s.pos))));camera.up.set(0,1,0).applyQuaternion(worldQ);camera.lookAt(ship.localToWorld(new THREE.Vector3(...h1ToLocal(s.at))));
    camera.fov=Math.min(84,s.fov+(camera.aspect<1?13:0));
   }else if(mode==='inspect'){
    const c=Math.cos(orbit.pitch),to=focus.point.clone().add(new THREE.Vector3(Math.sin(orbit.yaw)*c,Math.sin(orbit.pitch),Math.cos(orbit.yaw)*c).multiplyScalar(orbit.distance));
    const eased=lens.clone().lerp(to,1-Math.exp(-14*Math.max(0,Math.min(.1,dt))));
    lens=slideFerryLens(lens,eased);camera.position.copy(ship.localToWorld(eye.copy(lens)));camera.up.set(0,1,0).applyQuaternion(worldQ);camera.lookAt(ship.localToWorld(focus.point.clone()));camera.fov=clamp(fov,55,82);
   }else{
    const target={yaw:yaw-ship.rotation.y,pitch:clamp(pitch,-1.2,1.2)},k=1-Math.exp(-22*Math.max(0,Math.min(.1,dt)));
    if(!look)look={...target};else{look.yaw+=angle(target.yaw-look.yaw)*k;look.pitch+=(target.pitch-look.pitch)*k;}
    eye.copy(local);eye.y=floorY(deck.floor,local.z)+1.65;
    camera.position.copy(ship.localToWorld(eye));lookQ.setFromEuler(new THREE.Euler(look.pitch,look.yaw,0,'YXZ'));camera.quaternion.copy(worldQ).multiply(lookQ);camera.fov=clamp(fov,60,82);
   }
   camera.near=.055;camera.zoom=1;camera.updateProjectionMatrix();camera.updateMatrixWorld();return true;
  },
  walk,
  inspect,
  orbit(dx,dy){if(mode==='inspect'){orbit.yaw-=dx;orbit.pitch=clamp(orbit.pitch+dy,-1.15,1.15);}},
  zoom(factor){if(mode==='inspect')orbit.distance=clamp(orbit.distance*factor,.35,4);},
  overview(index=null){
   if(!saved)return null;
   if(index!==null)shot=clamp(index,0,FERRY_H1_SHOTS.length-1);
   else if(mode==='overview')shot=(shot+1)%FERRY_H1_SHOTS.length;
   else shot=FERRY_H1_SHOTS.indexOf(ferryShotAt(deck.floor.id,local.toArray())||FERRY_H1_SHOTS[0]);
   mode='overview';return FERRY_H1_SHOTS[shot].label;
  },
  nearby(){return FERRY_EXPLORE_TARGETS.filter(t=>new THREE.Vector3(...t.pos).distanceTo(local)<4).sort((a,b)=>new THREE.Vector3(...a.pos).distanceToSquared(local)-new THREE.Vector3(...b.pos).distanceToSquared(local));},
  targetAt(point){return this.nearby().find(t=>new THREE.Vector3(...t.pos).distanceTo(point)<1.5)||null;},
  get local(){return local.clone();},
  get active(){return !!saved&&!overridden;},
  get mode(){return mode;},
  get id(){return mode==='overview'?FERRY_H1_SHOTS[shot].id:mode==='inspect'?focus?.id:null;},
  get floor(){return deck?.floor?.id||null;},
  get heading(){return look?.yaw??0;},
  get focus(){return focus;},
  get precision(){return precision;},set precision(v){precision=!!v;},
  get speed(){return precision?FERRY_PRECISION_SPEED:FERRY_EXPLORE_SPEED;},
 };
}
