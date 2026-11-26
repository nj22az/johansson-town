// The town's near-coplanar audit (tools/near-coplanar.mjs): Minato's streets as createTown builds them, and every room
// the game can open, built as the game builds it (game.js roomShell, run as tests/enterable-sites.test.mjs runs it, with
// Sakura's shop and the izakaya, which the game builds elsewhere). Rooms drawn with the Kikkou line are checked in its ID
// pass too. Usage: node --max-old-space-size=6000 tools/zfight-audit.mjs [out.json] [--rooms-only|--town-only] [--only=id,id]
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from '../tests/fixtures.mjs';

installDOM();globalThis.self=globalThis;globalThis.__KIT_TRACE__=true;
const {nearCoplanar,longestView,describe,DEPTH}=await import('./near-coplanar.mjs');
const {KIKKOU_ROOMS}=await import('../src/render/kikkou-ids.js');

/** game.js roomShell with the builders game.js imports, as tests/enterable-sites.test.mjs takes it. */
const source=readFileSync(new URL('../src/game.js',import.meta.url),'utf8');
const shellSource=(()=>{const a=source.indexOf('function roomShell(s){'),b=source.indexOf('\n\n\n/**\n * Doorways.',a);if(a<0||b<a)throw Error('game.js roomShell not found');return source.slice(a,b);})();
const imports={};
for(const m of source.matchAll(/^import\s*\{([^}]*)\}\s*from\s*'([^']+)'/gm)){
 const path=new URL('../src/'+m[2].replace(/^\.\//,''),import.meta.url).href;
 for(const part of m[1].split(',')){const [name,alias]=part.trim().split(/\s+as\s+/);if(name)imports[(alias||name).trim()]={path,name:name.trim()};}
}
const scope={};
for(const n of new Set([...shellSource.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)].map(m=>m[1])))if(imports[n])scope[n]=(await import(imports[n].path))[imports[n].name];

const {createTown}=await import('../src/world/town.js');
const {createBusinesses}=await import('../src/world/businesses.js');
const {SAKURA_LAYOUT}=await import('../src/world/interiors/sakura-layout.js');
const {buildIzakayaRoom}=await import('../src/world/izakaya.js');
const {buildSakuraInterior}=await import('../src/world/interiors/sakura-interior.js');

/** Minato's streets (tests/no-z-fighting.test.mjs MINATO), scanned in tiles to keep the scan's memory down. */
export const MINATO=Object.freeze({minX:-45,maxX:45,minZ:-52,maxZ:66});
const moving=o=>{for(let p=o;p;p=p.parent)if(p.userData.dynamicProp||p.userData.vehicle||/^(Scheduled island cargo ship|Road traffic|Harbour gulls and garden butterflies|Beach life)$/.test(p.name))return true;return false;};

export async function buildWorld(){
 const SITES=createBusinesses(),town=new THREE.Group(),scene=new THREE.Scene();scene.add(town);
 const world=createTown({scene:town,sites:SITES,townMode:'peninsula',mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 scene.updateMatrixWorld(true);
 return {SITES,world,scene};
}

/** Every room the game opens: its id, its title and a builder that returns the built room group. */
export function rooms({SITES,world}){
 const out=new Map();
 const shell=s=>()=>{
  const room=new THREE.Group(),noop=()=>{};
  const context={...scope,THREE,Math,Number,Object,Array,Error,room,town:{visible:true},SITES,world,current:s,activeRoomLayout:null,minutes:720,elapsed:0,
   player:new THREE.Object3D(),clearRoom:noop,reg:noop,roomColliders:[],roomCollider:(x,z,w,d,height=2.8,minY=0)=>({x,z,w,d,height,minY}),
   activities:{state:{},action:noop,save:noop,unreadPost:0,post:noop,menu:noop,close:noop},islandPlay:null,leaveRoom:noop,crossThreshold:noop,enterRoom:noop,takeNahaBoat:noop,
   takeSakuraStair:noop,evacuateSakuraOffice:noop,sleepUntilMorning:noop,playerRecipe:()=>null,hands:{},say:noop,weatherMode:'fixed',newsOn:()=>false,
   box:(size,pos,color,parent)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color}));m.position.set(...pos);parent.add(m);return m;},
   sakuraShop:{layout:SAKURA_LAYOUT,colliders:SAKURA_LAYOUT.colliders}};
  vm.runInNewContext(shellSource+'\nroomShell(site);',Object.assign(context,{site:s}));
  return room;
 };
 for(const s of [...SITES,...(world.landmarks||[]).filter(l=>Number.isFinite(l.entryFacing))]){
  if(out.has(s.id)||!(s.approachPosition||s.door||s.insideOnly))continue;
  if(s.id==='market')out.set(s.id,{title:s.title||s.id,build:async()=>{const room=new THREE.Group();await buildSakuraInterior({room,reg(){},action(){},exit(){}}).ready?.();return room;}});
  else if(s.id==='izakaya')out.set(s.id,{title:s.title||s.id,build:()=>{const room=new THREE.Group(),noop=()=>{};
   buildIzakayaRoom({room,box:(size,pos,color,parent)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color}));m.position.set(...pos);parent.add(m);return m;},reg:noop,collider:()=>({}),action:noop,exit:noop,signTexture:()=>null});return room;}});
  else out.set(s.id,{title:s.title||s.id,build:shell(s)});
 }
 return out;
}

export async function scanRoom(id,{build}){
 const room=await build();room.updateMatrixWorld(true);
 const ink=KIKKOU_ROOMS.has(id),view=longestView(room);
 const found=nearCoplanar(room,{maxDistance:view,minArea:.0005,ink});
 room.traverse(o=>{if(o.isMesh){o.geometry?.dispose?.();}});
 return {ink,view,found};
}

export function scanTown(scene,{tile=30}={}){
 const found=[];
 for(let x=MINATO.minX;x<MINATO.maxX;x+=tile)for(let z=MINATO.minZ;z<MINATO.maxZ;z+=tile){
  const region={minX:x,maxX:Math.min(MINATO.maxX,x+tile),minZ:z,maxZ:Math.min(MINATO.maxZ,z+tile)};
  for(const f of nearCoplanar(scene,{regions:[region],maxDistance:DEPTH.town,minArea:.002,skip:moving}))found.push(f);
  globalThis.gc?.();
 }
 return found;
}

const round=v=>+v.toFixed(5);
const record=(place,f)=>({place,kind:f.kind,a:f.a,b:f.b,areaM2:round(f.area),gapMm:+(f.gap*1000).toFixed(2),requiredMm:+(f.required*1000).toFixed(2),seenFromM:+f.seen.toFixed(1),at:f.centre,normal:f.normal});

if(import.meta.url===`file://${process.argv[1]}`){
 const out=process.argv.slice(2).find(a=>!a.startsWith('--'))||'docs/qa/zfight-audit.json';
 const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',');
 const {SITES,world,scene}=await buildWorld();
 const findings=[],places=[];
 if(!process.argv.includes('--rooms-only')&&!only){
  const t=scanTown(scene);for(const f of t)findings.push(record('Minato streets',f));
  places.push({place:'Minato streets',ink:false,viewM:DEPTH.town,pairs:t.length});
  console.error('town',t.length);
 }
 if(!process.argv.includes('--town-only'))for(const [id,r] of rooms({SITES,world})){
  if(only&&!only.includes(id))continue;
  try{const {ink,view,found}=await scanRoom(id,r);for(const f of found)findings.push(record(id,f));places.push({place:id,title:r.title,ink,viewM:+view.toFixed(1),pairs:found.length});console.error(id,found.length);}
  catch(e){places.push({place:id,title:r.title,error:e.message});console.error(id,'ERROR',e.message);}
  globalThis.gc?.();
 }
 findings.sort((x,y)=>y.areaM2-x.areaM2);
 writeFileSync(out,JSON.stringify({date:new Date().toISOString().slice(0,10),rule:'tools/near-coplanar.mjs',depth:DEPTH,places,findings},null,1)+'\n');
 console.error('wrote',out,findings.length,'pairs');
}
export {describe};
