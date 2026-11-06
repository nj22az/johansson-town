import * as THREE from '../../vendor/three.module.js';
import {catalogueEntry} from './catalogue.js';
import {circleHitsRect} from '../../physics.js';

/**
 * Things the creator placed with the builder, kept in data/world-placements.json and published with the town:
 *   {version:1, placements:[{id, kind, x, z, yaw, note}]}
 * A placement must stand on walkable ground, clear of everything already there and of every doorway, and say why it
 * is there (note). The same rules run in the builder before a placement is made and when the file is loaded, so a
 * file edited by hand cannot put a bench inside a wall.
 */
export const PLACEMENTS_FILE='data/world-placements.json';
export const DOOR_CLEARANCE=1.6;   // metres square kept free in front of every door
export const LEVEL=.04;            // the most the ground may rise under one piece (a kerb is 0.12–0.15 m)
export const PASSAGE=1.4;          // metres of walking width a placement must not take away (briefs/NEXT.md §6)
// Indoors a home passes its own width (home-decorate.js HOME_PASSAGE, 0.78 m).
export const MAX_PLACEMENTS=500;   // a placements file holds at most this many: every one is checked when it loads

/** The four corners of a footprint, in town coordinates (yaw as three.js rotation.y). */
export function footprint({x,z,w,d,yaw=0}){
 const c=Math.cos(yaw),s=Math.sin(yaw);
 return [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v])=>[x+u*c+v*s,z-u*s+v*c]);
}

/** Do two footprints overlap (separating axis test on the four edge directions)? */
export function footprintsOverlap(a,b){
 const A=footprint(a),B=footprint(b);
 for(const poly of [A,B])for(let i=0;i<2;i++){
  const [x1,z1]=poly[i],[x2,z2]=poly[i+1],nx=z2-z1,nz=-(x2-x1);
  const pa=A.map(([x,z])=>x*nx+z*nz),pb=B.map(([x,z])=>x*nx+z*nz);
  if(Math.max(...pa)<=Math.min(...pb)+1e-9||Math.max(...pb)<=Math.min(...pa)+1e-9)return false;
 }
 return true;
}

/**
 * What is wrong with a placement, as sentences (an empty list means it can go there).
 * world: {colliders:[{x,z,w,d,yaw}], doors:[[x,z]], walkable(x,z), heightAt(x,z)?, passage?}; size: the prop's footprint {w,d}. Overhead colliders
 * (awnings, signs: starting above 2 m), those of a storey below (a basement's, starting a metre or more under the floor)
 * and parked ones (far away) do not count.
 */
/** Whether a collider stands above the floor at (x, z): one wholly under it is a storey below (a basement's walls and door heads). */
const aboveFloor=(c,world,x,z)=>(c.minY||0)+(c.height??Infinity)>(world.heightAt?.(x,z)??0)+.01;
export function placementProblems(p,size,world){
 const out=[],entry=(world.lookup||catalogueEntry)(p.kind);
 if(!entry)return [`There is no "${p.kind}" in the catalogue.`];
 if(![p.x,p.z,p.yaw??0].every(Number.isFinite))return [`The ${entry.name.toLowerCase()} has no proper position.`];
 if(world.needWhy!==false&&!String(p.note||'').trim())out.push(`Say why the ${entry.name.toLowerCase()} is here (who uses it, and why this spot).`);
 const box={x:p.x,z:p.z,w:size.w,d:size.d,yaw:p.yaw||0},points=[[p.x,p.z],...footprint(box)];
 if(!points.every(([x,z])=>world.walkable(x,z)))out.push(world.offGround||'Part of it is off the ground people walk on (the road, a wall or the water).');
 else if(world.heightAt){const h=points.map(([x,z])=>world.heightAt(x,z));if(Math.max(...h)-Math.min(...h)>LEVEL)out.push('It would stand across a step or a kerb; move it onto level ground.');}
 // A rug may lie under a table or a cushion, never under a wardrobe or a counter standing on it.
 const hit=world.colliders.find(c=>!c.moving&&(!entry.flat||(c.height??2)>.6)&&!(p.id&&c.placementId===p.id)&&(c.minY||0)<2&&aboveFloor(c,world,p.x,p.z)&&Math.abs(c.x)<1e5&&footprintsOverlap(box,{x:c.x,z:c.z,w:c.w,d:c.d,yaw:c.yaw||0}));
 // Name what is in the way when it is a piece somebody placed (the town's own colliders have no names a person knows).
 const other=hit?.placementKind&&(world.lookup||catalogueEntry)(hit.placementKind);
 if(hit)out.push(other?`It overlaps the ${other.name.toLowerCase()} that is already there.`:'It overlaps something that is already there.');
 if(!entry.flat&&world.doors.some(([x,z,size=DOOR_CLEARANCE])=>footprintsOverlap(box,{x,z,w:size,d:size})))out.push('It blocks a doorway or the way to something you use.');
 if(!out.length&&!entry.flat&&world.passage&&closesPassage(box,p.id,world))
  out.push(`It would leave less than ${world.passage} m to walk past it: stand it at the edge, or leave ${world.passage} m beside it.`);
 return out;
}

/**
 * Does a piece close a way through? Around the piece, the ground is looked at in small squares (0.1 m, 0.05 m indoors): a square is open when
 * a person needing `world.passage` metres of width could stand there (walkable ground and nothing standing within
 * half that width). Open squares that joined up across the area before the piece must still join up after it. So a
 * bench against a wall or at a kerb is fine, one in the middle of a pavement is not; a pavement already narrower than
 * the passage has no way through to close, and a nook off the way is nobody's way unless a door opens onto it. In a
 * room the area's edges are walls, so the ways are between its keep-clear spots: the door, the wardrobe, the futon.
 * Ground is sampled at the squares; colliders are tested whole (as people bump into them), so a thin fence counts.
 */
export function closesPassage(box,ownId,world){
 // A person needs half the passage on either side of the line they walk; the squares are GRID apart, so half a square
 // is given back: a way of the full passage is never missed, and one narrower by more than a square is never passed.
 const GRID=world.passage>=1?.1:.05;   // squares: 0.1 m outdoors, 0.05 m for a home's narrower way
 const half=world.passage/2-GRID/2,reach=Math.ceil(half/GRID),pts=footprint(box);
 const xs=pts.map(q=>q[0]),zs=pts.map(q=>q[1]),pad=world.passage+1+half;
 const x0=Math.min(...xs)-pad,z0=Math.min(...zs)-pad,nx=Math.ceil((Math.max(...xs)+pad-x0)/GRID)+1,nz=Math.ceil((Math.max(...zs)+pad-z0)/GRID)+1;
 if(nx*nz>60000)return false;   // a piece this big is not a street prop; the other rules still apply
 const minX=x0,maxX=x0+nx*GRID,minZ=z0,maxZ=z0+nz*GRID;
 const solid=world.colliders.filter(c=>!c.moving&&(c.minY||0)<2&&aboveFloor(c,world,box.x,box.z)&&!(ownId&&c.placementId===ownId)&&Math.abs(c.x)<1e5&&
  c.x+Math.hypot(c.w,c.d)/2>minX&&c.x-Math.hypot(c.w,c.d)/2<maxX&&c.z+Math.hypot(c.w,c.d)/2>minZ&&c.z-Math.hypot(c.w,c.d)/2<maxZ);
 // Which ground points are off the walkable ground (the road, the water, a wall's footprint).
 const off=new Uint8Array(nx*nz);
 for(let i=0;i<nx;i++)for(let k=0;k<nz;k++)off[i*nz+k]=world.walkable(x0+i*GRID,z0+k*GRID)?0:1;
 // A square is open when the ground within half the passage is walkable and nothing standing is within half of it
 // (only squares a whole half from the area's edge, so the ground around them is known).
 const offsets=[];for(let a=-reach;a<=reach;a++)for(let b=-reach;b<=reach;b++)if(Math.hypot(a,b)*GRID<=half+1e-9)offsets.push(a*nz+b);
 const clear=new Uint8Array(nx*nz);
 for(let i=reach;i<nx-reach;i++)for(let k=reach;k<nz-reach;k++){const j=i*nz+k,x=x0+i*GRID,z=z0+k*GRID;
  clear[j]=offsets.every(d=>!off[j+d])&&!solid.some(c=>circleHitsRect(x,z,half,c))?1:0;}
 const open=withPiece=>{if(!withPiece)return clear;const o=new Uint8Array(nx*nz);
  for(let i=reach;i<nx-reach;i++)for(let k=reach;k<nz-reach;k++){const j=i*nz+k;o[j]=clear[j]&&!circleHitsRect(x0+i*GRID,z0+k*GRID,half,box)?1:0;}
  return o;};
 const parts=o=>{const label=new Int32Array(nx*nz).fill(-1);let n=0;
  for(let j=0;j<o.length;j++){if(!o[j]||label[j]>=0)continue;const stack=[j];label[j]=n;
   while(stack.length){const q=stack.pop(),i=Math.floor(q/nz),k=q%nz;
    for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+a,kk=k+b;if(ii<0||kk<0||ii>=nx||kk>=nz)continue;const r=ii*nz+kk;if(o[r]&&label[r]<0){label[r]=n;stack.push(r);}}}
   n++;}
  return label;};
 const before=open(false),after=open(true),was=parts(before),now=parts(after);
 // The ways in and out: the area's edge squares, and the open squares in front of every door in it (an alley that
 // ends at a door is somebody's way). Those joined before must be joined after, and a door's way must stay open.
 const ends=[];
 for(let i=reach;i<nx-reach;i++)for(let k=reach;k<nz-reach;k++)if(i===reach||i===nx-reach-1||k===reach||k===nz-reach-1)ends.push(i*nz+k);
 for(const [dx,dz,size=DOOR_CLEARANCE] of world.doors||[]){
  const di=Math.round((dx-x0)/GRID),dk=Math.round((dz-z0)/GRID),r=Math.ceil(size/2/GRID);
  if(di<reach-r||dk<reach-r||di>nx-reach-1+r||dk>nz-reach-1+r)continue;
  const near=[];
  for(let i=Math.max(reach,di-r);i<=Math.min(nx-reach-1,di+r);i++)for(let k=Math.max(reach,dk-r);k<=Math.min(nz-reach-1,dk+r);k++)if(before[i*nz+k])near.push(i*nz+k);
  if(near.length&&!near.some(j=>after[j]))return true;
  ends.push(...near);
 }
 const joined=new Map();
 for(const j of ends){
  if(!before[j]||!after[j])continue;
  const set=joined.get(was[j])||new Set();set.add(now[j]);joined.set(was[j],set);if(set.size>1)return true;
 }
 return false;
}

/** A file's placements, checked for shape only (the world rules run when they are placed). */
export function readPlacementsFile(json){
 const data=typeof json==='string'?JSON.parse(json):json;
 if(!data||data.version!==1||!Array.isArray(data.placements))throw new Error('Not a placements file (version 1).');
 if(data.placements.length>MAX_PLACEMENTS)throw new Error(`A placements file holds at most ${MAX_PLACEMENTS} pieces; this one has ${data.placements.length}.`);
 const ids=new Set();
 return data.placements.map(p=>{
  if(!p||typeof p.id!=='string'||ids.has(p.id))throw new Error('Every placement needs its own id.');
  ids.add(p.id);
  const e={id:p.id,kind:String(p.kind),x:+p.x,z:+p.z,yaw:+(p.yaw||0),note:String(p.note||'')};
  // A broken number is kept exactly as written, so saving never turns it into 0 (a spot nobody chose).
  if(![e.x,e.z,e.yaw].every(Number.isFinite))Object.defineProperty(e,'written',{value:{...p}});
  return e;
 });
}

export const placementsFile=list=>JSON.stringify({version:1,placements:list.map(e=>e.written||{id:e.id,kind:e.kind,x:+e.x.toFixed(3),z:+e.z.toFixed(3),yaw:+e.yaw.toFixed(4),note:e.note})},null,1)+'\n';

/**
 * The live builder for the town outdoors. group/colliders are the world's own (colliders are picked up by the collider
 * grid on its next refresh); factory is the prop factory; walkable and doors describe the ground.
 */
export function createPlacements({group,colliders,factory,walkable,heightAt=null,doors=[],lookup=catalogueEntry,needWhy=true,offGround=null,passage=null,passageOnLoad=true,onChange=()=>{}}){
 const placed=new Map(),held=new Map();let next=1;   // held: entries from the file that cannot stand where they are
 // Undo and redo (Mario Artist keeps Undo beside the way out in every mode: research/mario-artist/report.md §5). Each
 // step is what was done with the entry before and after; loading a file is not a step, nor is undoing.
 const done=[],undone=[],HISTORY=50;let recording=true;
 const remember=step=>{
  if(!recording)return;
  // Turning one piece 15° at a time is one step: the turns since it was last placed or moved add up, so a full turn
  // is not 24 undos and does not push real changes out of the history.
  const last=done.at(-1);
  if(step.merge&&last?.merge===step.merge&&last.do==='move'&&last.after.id===step.before.id){last.after=step.after;undone.length=0;return;}
  done.push(step);if(done.length>HISTORY)done.shift();undone.length=0;
 };
 const quietly=fn=>{const was=recording;recording=false;try{return fn();}finally{recording=was;}};
 const nameOf=e=>(lookup(e.kind)?.name||e.kind).toLowerCase();
 // A copy of an entry that keeps a broken number exactly as the file wrote it (readPlacementsFile), as load() does.
 const copy=e=>{const c={...e};if(e.written)Object.defineProperty(c,'written',{value:e.written});return c;};
 const world={colliders,doors,walkable,heightAt,lookup,needWhy,offGround,passage};
 function build(p){
  const entry=lookup(p.kind),made=factory[entry.make](p.x,p.z,p.yaw);
  made.object.position.y=heightAt?heightAt(p.x,p.z):0;   // on the ground, not floating over it or sunk into it
  made.object.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(made.object);
  const collider=made.collider&&{...made.collider,x:p.x,z:p.z,yaw:p.yaw,height:box.max.y-box.min.y,minY:box.min.y,placementId:p.id,placementKind:p.kind};
  made.object.name=`placed:${p.kind}:${p.id}`;made.object.userData.placement=p.id;
  return {object:made.object,collider};
 }
 const sizeOf=kind=>{const e=lookup(kind);if(!e)return {w:0,d:0};if(e.size)return {w:e.size[0],d:e.size[1]};const c=factory[e.make](0,0,0).collider;return {w:c.w,d:c.d};};
 const sizes=new Map();
 const size=kind=>{if(!sizes.has(kind))sizes.set(kind,sizeOf(kind));return sizes.get(kind);};
 // Pieces loaded where the walkway rule was not asked on load (a player's saved room) keep their own spot: there, and
 // only there, the rule does not apply to them, so an older arrangement is never hidden and an Undo can put one back.
 // Same spot within a millimetre and a tenth of a degree: turning a piece away and back is float arithmetic.
 const turnedTo=(a,b)=>Math.abs(((a-b)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI)<.002;
 const ownSpot=new Map(),atOwnSpot=p=>{const s=ownSpot.get(p.id);return !!s&&s.kind===p.kind&&Math.abs(s.x-p.x)<.001&&Math.abs(s.z-p.z)<.001&&turnedTo(s.yaw,+(p.yaw||0));};
 const exempt={...world,passage:null};
 function check(p){return placementProblems(p,size(p.kind),world.passage&&atOwnSpot(p)?exempt:world);}
 function place(p){
  const entry={id:p.id||`p${next++}`,kind:p.kind,x:+p.x,z:+p.z,yaw:+(p.yaw||0),note:String(p.note||'')};
  while(placed.has(entry.id)||held.has(entry.id))entry.id=`p${next++}`;
  const problems=check(entry);if(problems.length)return {ok:false,problems};
  if(placed.size+held.size>=MAX_PLACEMENTS)return {ok:false,problems:[`The town holds at most ${MAX_PLACEMENTS} placed pieces; remove one first.`]};
  const made=build(entry);group.add(made.object);if(made.collider)colliders.push(made.collider);
  placed.set(entry.id,{entry,...made});remember({do:'place',after:{...entry}});onChange();return {ok:true,id:entry.id};
 }
 function remove(id){
  if(held.has(id)){remember({do:'remove',before:copy(held.get(id)),held:true});held.delete(id);onChange();return true;}
  const p=placed.get(id);if(!p)return false;
  p.object.removeFromParent();const i=colliders.indexOf(p.collider);if(i>=0)colliders.splice(i,1);
  placed.delete(id);remember({do:'remove',before:copy(p.entry)});onChange();return true;
 }
 function move(id,changes,{merge=null}={}){
  const p=placed.get(id)||(held.has(id)&&{entry:held.get(id)});if(!p)return {ok:false,problems:[`Nothing placed as ${id}.`]};
  const entry={...p.entry,...changes,id};
  const problems=check(entry);if(problems.length)return {ok:false,problems};
  const before=copy(p.entry),wasHeld=held.has(id);
  const r=quietly(()=>{remove(id);return place(entry);});   // a held entry moved to a good spot is built
  if(r.ok)remember({do:'move',before,after:{...entry,id:r.id},held:wasHeld,merge});
  return r;
 }
 /** Puts an entry back exactly as it was (its own id), or says why it cannot stand there now. */
 function restore(e,wasHeld){
  if(wasHeld){held.set(e.id,copy(e));onChange();return {ok:true};}
  return place(e);
 }
 /** Can this entry stand at its spot now (ignoring its own collider)? The problems, or none. */
 const fits=e=>check(e);
 /** Takes back the last change: a placed piece goes, a removed one comes back, a moved one returns. Nothing is touched
  * unless it can be done: a piece is never taken away before it is known it can go back. */
 function undo(){
  const step=done.at(-1);if(!step)return {ok:false,problems:['There is nothing to undo.']};
  const why=step.do==='move'&&!step.held?fits(step.before):step.do==='remove'&&!step.held?fits(step.before):[];
  if(why.length)return {ok:false,problems:[`The ${nameOf(step.before)} cannot go back: ${why.join(' ')}`]};
  if((step.do==='place'||step.do==='move')&&!placed.has(step.after.id))return {ok:false,problems:[`The ${nameOf(step.after)} is no longer there.`]};
  quietly(()=>{
   if(step.do==='place')remove(step.after.id);
   else if(step.do==='remove')restore(step.before,step.held);
   else{remove(step.after.id);restore(step.before,step.held);}
  });
  done.pop();undone.push(step);
  return {ok:true,undid:step.do==='place'?`Took away the ${nameOf(step.after)}.`:step.do==='remove'?`Put back the ${nameOf(step.before)}.`:`Moved the ${nameOf(step.before)} back.`};
 }
 /** Does again what the last undo took back, under the same rule. */
 function redo(){
  const step=undone.at(-1);if(!step)return {ok:false,problems:['There is nothing to redo.']};
  const why=step.do==='place'||step.do==='move'?fits(step.after):[];
  if(why.length)return {ok:false,problems:[`The ${nameOf(step.after)} cannot go there again: ${why.join(' ')}`]};
  const here=step.do==='move'?step.before.id:step.do==='remove'?step.before.id:null;
  if(here&&!placed.has(here)&&!held.has(here))return {ok:false,problems:[`The ${nameOf(step.before)} is no longer there.`]};
  quietly(()=>{
   if(step.do==='place')place(step.after);
   else if(step.do==='remove')remove(step.before.id);
   else{remove(step.before.id);place(step.after);}
  });
  undone.pop();done.push(step);
  return {ok:true,undid:step.do==='place'?`Placed the ${nameOf(step.after)} again.`:step.do==='remove'?`Took away the ${nameOf(step.before)} again.`:`Moved the ${nameOf(step.after)} again.`};
 }
 function load(list){
  // Ids continue after every id in the file, built or not, so a new piece never takes a held one's id.
  for(const p of list){const n=+String(p.id).replace(/^p/,'');if(Number.isInteger(n)&&n>=next)next=n+1;}
  const skipped=[];recording=false;   // loading a file is not a step to undo
  if(!passageOnLoad)for(const p of list)ownSpot.set(p.id,{kind:p.kind,x:+p.x,z:+p.z,yaw:+(p.yaw||0)});
  try{for(const p of list){const r=place(p);if(!r.ok){const kept={...p};if(p.written)Object.defineProperty(kept,'written',{value:p.written});held.set(p.id,kept);skipped.push({id:p.id,problems:r.problems});}}}finally{recording=true;}
  return skipped;
 }
 return {
  check:p=>check({...p,yaw:+(p.yaw||0)}),place,move,remove,load,undo,redo,
  /** How many steps can be undone and redone. */
  history:()=>({undo:done.length,redo:undone.length}),
  list:()=>[...placed.values()].map(p=>({...p.entry})),
  /** Entries from the file that could not be built where they are; kept in the file until moved or removed. */
  held:()=>[...held.values()].map(e=>({...e,problems:check(e)})),
  file:()=>placementsFile([...[...placed.values()].map(p=>p.entry),...held.values()].sort((a,b)=>String(a.id).localeCompare(String(b.id),undefined,{numeric:true}))),
  size,
 };
}
