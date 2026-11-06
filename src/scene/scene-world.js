import {FUJITA_VIEW,buildFujitaStage} from '../../../avatar-creator/fujita-stage.js';
import {WORKSHOP_VIEW} from './workshop-view.js';
import * as THREE from '../../vendor/three.module.js';
import {createTown} from '../world/town.js';
import {createIslandBusinesses} from '../world/businesses.js';
import {groundHeight,routeAt,planHeight} from '../world/layout.js';
import {suppliedRoomBoundsBlocked} from '../world/supplied-rooms.js';
import {createTownSky} from '../render/sky.js';
import {createCelPass} from '../render/cel.js';
import {createWalkSurface} from '../world/walk-surface.js';
import {clock as duskClock} from '../render/dusk.js';
import {hitsSolid,slideTo} from './scene-physics.mjs';
import {SNAP,seatKey,matchSeat,numberLabels,seatTurn,counterEdges,edgeLine,personMarks} from './scene-snap.mjs';
import {buildClassroomStage} from '../../../avatar-creator/classroom-stage.js';
const BLOCKERS=7;
const interiors=new Set(['sakura','minato','sato-ramen','books','onsen','town-hall','classroom','dock-workshop','fujita-shed']);
const noop=()=>{};
/**
 * The hour on a street: the game's own clock (src/render/dusk.js) for the sun's colour and
 * strength, the sky and its fill, the lit windows and lanterns (world.updateHours) and the
 * street lamps. Every light is set relative to its noon value, so noon looks exactly as a
 * scene built without a clock does and the evening and night follow the game. A room keeps
 * its own lamps' light: its lighting does not follow the sky.
 */
const NOON=duskClock(720),BASE={sun:new THREE.Color(0xfff3de),sky:new THREE.Color(0xfff5e5),ground:new THREE.Color(0x80949c),background:new THREE.Color(0xb4dce8)};
const relative=(base,now,noon)=>{const a=new THREE.Color(now),b=new THREE.Color(noon);return base.clone().setRGB(base.r*a.r/Math.max(b.r,.01),base.g*a.g/Math.max(b.g,.01),base.b*a.b/Math.max(b.b,.01));};
function setClock({minutes,camera,inside,scene,world,sun,fill,sky}){
 if(inside||!Number.isFinite(minutes))return;
 const c=duskClock(minutes);
 world?.updateHours?.(minutes);
 sun.color.copy(relative(BASE.sun,c.sun,NOON.sun));sun.intensity=2.4*c.sunIntensity/NOON.sunIntensity;
 fill.color.copy(relative(BASE.sky,c.skyFill,NOON.skyFill));fill.groundColor.copy(relative(BASE.ground,c.groundFill,NOON.groundFill));fill.intensity=2*c.ambient/NOON.ambient;
 scene.background=relative(BASE.background,c.sky,NOON.sky);
 sky?.update(camera,c.day,false,false,c.sky);
 for(const l of world?.streetLights||[])l.intensity=(1-c.day)*1.55;
}
export async function buildSceneWorld(id,views,townData=null){
 if(id==='dock-workshop')views={...views,'dock-workshop':WORKSHOP_VIEW};
 if(id==='fujita-shed')views[id]=FUJITA_VIEW;
 const inside=interiors.has(id);
 const scene=!inside&&townData?townData.scene:new THREE.Scene(),room=new THREE.Group();scene.background=new THREE.Color(inside?0xe8e4d8:0xb4dce8);if(inside)scene.add(room);
 const solids=[],reg=(o,label)=>{o.userData.studioLabel=label;};
 const collider=(x,z,w,d,height,minY)=>solids.push({x,z,w,d,height,minY});
 const options={room,reg,collider,action:noop,exit:noop};let api,layout,world;
 if(!inside){world=townData?.world||createTown({scene,sites:createIslandBusinesses(),mobile:true,shadows:true,maxAnisotropy:2,register:reg,enter:noop,onAction:noop,getPlayerPosition:()=>new THREE.Vector3()});solids.push(...world.colliders);for(const p of world.people||[])if(p.g)p.g.visible=false;}
 else if(id==='fujita-shed'){api=buildFujitaStage(options);layout=api;solids.push(...api.colliders);}
 else if(id==='classroom'){api=buildClassroomStage(options);layout=api;solids.push(...api.colliders);}
 else if(id==='sakura'){const m=await import('../world/interiors/sakura-interior.js');api=m.buildSakuraInterior(options);await api.ready();layout=api.layout;solids.push(...(layout.colliders||[]));}
 else if(id==='minato'||id==='sato-ramen'){
  const m=await import('../world/izakaya.js?snappy=1');await m.preloadIzakaya(['interior']);if(!m.izakayaReady('interior'))throw Error('Dining room model unavailable');
  const box=(size,pos,color,parent=room)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color}));mesh.position.set(...pos);parent.add(mesh);return mesh;};
  const signTexture=(a,b)=>{const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#eee4cb';ctx.fillRect(0,0,512,128);ctx.fillStyle='#243442';ctx.font='28px sans-serif';ctx.fillText(a,20,45);ctx.fillText(b||'',20,95);return new THREE.CanvasTexture(c);};
  api=id==='minato'?m.buildIzakayaRoom({...options,box,signTexture}):(await import('../world/interiors/sato-ramen.js')).buildSatoRamenRoom(options);layout=api.layout||api;if(id==='sato-ramen'){const shared=await import('../world/interiors/shared-dining-layout.js');solids.push(...shared.SHARED_DINING_COLLIDERS);layout={...layout,bounds:shared.SHARED_DINING_BOUNDS,floorPolygon:shared.SHARED_DINING_FLOOR};}
 }else if(id==='dock-workshop'){
  const P=await import('../world/interiors/workshop-props.js');if(!await P.preloadWorkshopProps())throw Error('Workshop props unavailable.');
  api=(await import('../world/interiors/compact-shops.js')).buildCompactShop({...options,site:createIslandBusinesses().find(s=>s.id==='form3d')});layout=api;if(!await api.ready)throw Error('Workshop motor unavailable.');
  (await import('../world/interiors/business-content.js')).buildBusinessContent({site:createIslandBusinesses().find(s=>s.id==='form3d'),room,register:reg,onInspect:noop,onAction:noop});
 }else if(id==='books'){api=(await import('../world/interiors/compact-shops.js')).buildCompactShop({...options,site:createIslandBusinesses().find(s=>s.id==='frontrow')});layout=api;}
 // Umi-no-yu's massage chair is World's catalogue's (src/catalog): its model comes after the room is built, and the room
 // says when it is in place and lit like the room (ready), before the cel pass below shades it.
 else if(id==='onsen'){api=(await import('../world/interiors/onsen.js')).buildOnsenInterior(options);layout=api;solids.push(...(api.colliders||[]));await api.ready;}
 // The town hall's place is the Community Hall's kitchen, with its register and request box, since the mayor's office went.
 else{api=(await import('../world/interiors/town-hall.js')).buildCommunityKitchen(options);layout=api;}
 for(const actor of api?.owned||[])if(actor.holder?.name==='barfly')actor.holder.visible=false;
 const preset=views[id].wide,spots=[...preset.spots.stand];
 if(!spots.length){const p=new THREE.Vector3().fromArray(preset.camera.position),f=new THREE.Vector3(0,0,-1).applyQuaternion(new THREE.Quaternion().fromArray(preset.camera.quaternion));for(let d=3;d<10;d+=.6)for(let side=-2;side<=2;side+=.5){const x=p.x+f.x*d+f.z*side,z=p.z+f.z*d-f.x*side;spots.push([x,groundHeight(x,z),z,.5,.78]);}}
 const candidates=[...spots].sort((a,b)=>(a[3]-.5)**2+(a[4]-.78)**2-((b[3]-.5)**2+(b[4]-.78)**2));
 let walk;const base=(x,z)=>inside?(preset.floor||0):planHeight(x,z);
 const floor=(x,z)=>walk?.level(x,z)??(base(x,z)+(walk?.lift(x,z)||0));
 let near=solids;const blocked=(x,z,r=.23)=>!Number.isFinite(floor(x,z))||(!inside&&!routeAt(x,z,r))||(inside&&suppliedRoomBoundsBlocked(layout,x,z,r))||hitsSolid(x,z,r,near,floor(x,z));
 const origin=candidates.find(p=>!blocked(p[0],p[2]))||candidates[0];
 if(!origin)throw Error('No standing area for this location');
 // Only the solids that can touch the walkable square (origin ±12 m): the same answers there, far fewer tests outdoors.
 near=solids.filter(c=>{const e=(c.r??Math.hypot(c.w||0,c.d||0)/2)+1;return Math.abs(c.x-origin[0])-e<SNAP.bounds&&Math.abs(c.z-origin[2])-e<SNAP.bounds;});
 for(const d of world?.details||[])if(Math.hypot(d.x-origin[0],d.z-origin[2])<Math.min(d.radius||20,25)){try{if(!d.studioLoaded){await d.load();d.studioLoaded=true;}}catch(e){console.warn('Optional scene detail',e);}}
 walk=createWalkSurface({minX:origin[0]-12,maxX:origin[0]+12,minZ:origin[2]-12,maxZ:origin[2]+12,base});walk.add(scene);
 // Seats keep a stable key (World's id, else their place: scene-snap.mjs); 'seat-N' (walk order) is how older scenes saved them.
 const found=[];scene.traverse(o=>{const s=o.userData.seat;if(s?.position&&!s.soak&&!s.wash)found.push({seat:s,label:o.userData.studioLabel});});
 const records=found.map(f=>f.seat),seats=found.map(({seat,label},i)=>({...seat,worldId:seat.id,id:seatKey(seat,records),legacyId:'seat-'+i,turn:seatTurn(seat),label:label||'Seat'}));
 const fill=inside||!townData?new THREE.HemisphereLight(0xfff5e5,0x80949c,2):townData.fill;if(inside||!townData)scene.add(fill);
 const sun=townData&&!inside?townData.sun:new THREE.DirectionalLight(0xfff3de,2.4);sun.position.set(origin[0]+5,10,origin[2]+6);sun.target.position.set(origin[0],0,origin[2]);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.1,far:40});sun.shadow.bias=-.0005;if(inside||!townData)scene.add(sun,sun.target);
 // Keep the photograph's location while letting the author move its camera.
 const camera=new THREE.PerspectiveCamera(55,4/3,.05,250);camera.fov=id==='dock-workshop'?65:55;camera.updateProjectionMatrix();camera.position.fromArray(preset.camera.position);camera.quaternion.fromArray(preset.camera.quaternion);camera.updateMatrixWorld(true);
 // Repeated labels in the furniture menu are numbered left to right as the preset wide camera sees them.
 const menuSeats=seats.filter(s=>Math.hypot(s.position[0]-origin[0],s.position[2]-origin[2])<SNAP.reach),screen=new THREE.Vector3();
 numberLabels(menuSeats,s=>screen.fromArray(s.position).project(camera).x).forEach((label,i)=>{menuSeats[i].label=label;});
 const edges=counterEdges(near,floor,{reach:SNAP.reach,origin,seats:seats.map(s=>[s.position[0],s.position[2],s.turn])});
 const sky=inside?null:(townData?.sky||createTownSky(scene)),cel=createCelPass({tint:0xffffff});cel.apply(scene);
 let lamps=0;scene.traverse(o=>{if(o.isPointLight&&++lamps>4)o.visible=false;});
 const meshes=[];scene.traverse(o=>{if(o.isMesh){let p=o,actor=false;while(p){if(p.userData.studioActor||!p.visible)actor=true;p=p.parent;}if(!actor)meshes.push(o);}});scene.updateMatrixWorld(true);
 // What can hide a character from the camera (solid, depth-writing scenery) also sits on its own layer, for seeing().
 const blockers=meshes.filter(m=>(Array.isArray(m.material)?m.material:[m.material]).some(x=>x?.depthWrite!==false));for(const m of blockers)m.layers.enable(BLOCKERS);
 let depthTarget=null,depthPixels=null;const depthMaterials=new Map();
 // A depth material per face side, so a one-sided wall hides exactly what a ray (which honours the side) says it hides.
 const depthFor=side=>{if(!depthMaterials.has(side))depthMaterials.set(side,new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side}));return depthMaterials.get(side);};
 const ray=new THREE.Raycaster(),from=new THREE.Vector3(),to=new THREE.Vector3();
 const within=(x,z)=>Math.abs(x-origin[0])<=SNAP.bounds&&Math.abs(z-origin[2])<=SNAP.bounds;
 return {scene,camera,origin,seats,edges,floor,blocked,meshes,sky,sun,stage:api?.stage,furniture:api?.furniture,townData:inside?null:{scene,world,sun,sky,fill},
  setClock(minutes,camera=this.camera){setClock({minutes,camera,inside,scene,world,sun,fill,sky});},
  /**
   * Can `actor` stand at (x,z)? Clear of walls and furniture, of everyone else (each placed once, by the rule settle() uses),
   * inside ±12 m of the origin (what a saved scene keeps) and on level floor (6 cm under the feet). `.people(x,z)` checks only
   * the other characters (for a seat, which stands inside its furniture).
   */
  free(actor,actors){
   const r=SNAP.body*actor.size,others=actors.filter(a=>a.id!==actor.id).map(a=>({...this.place(a),size:a.size}));
   const people=(x,z)=>!others.some(o=>Math.hypot(o.x-x,o.z-z)<r+SNAP.body*o.size);
   // Level under the feet. (Not over the whole body: World's walk surface lifts whole 25 cm cells around a counter's plinth.)
   const feet=SNAP.feet*actor.size,level=(x,z)=>{const f=floor(x,z);if(!Number.isFinite(f))return false;for(const [dx,dz] of [[feet,0],[-feet,0],[0,feet],[0,-feet]]){const g=floor(x+dx,z+dz);if(!Number.isFinite(g)||Math.abs(g-f)>SNAP.level)return false;}return true;};
   const free=(x,z)=>within(x,z)&&people(x,z)&&level(x,z)&&!blocked(x,z,r);free.people=people;return free;
  },
  /** Does the camera see the point (x,y,z)? Nothing solid in `meshes` in front of it (5 cm tolerance), as picking tests. */
  seen(x,y,z){from.copy(camera.position);to.set(x,y,z).sub(from);const length=to.length();if(!(length>.06))return true;ray.set(from,to.divideScalar(length));ray.near=0;ray.far=length;
   const hit=ray.intersectObjects(meshes,false).find(h=>h.object.visible&&h.object.material?.depthWrite!==false);return !hit||hit.distance>=length-.05;},
  /**
   * seen() for a whole drag: one depth picture of the solid scenery from the camera (`width` px wide), read back once, then
   * every question is a pixel lookup. The same rule as seen(), to a pixel of that picture; seen() itself when there is no
   * renderer or the picture cannot be read. (A ray costs up to 40 ms in the dining rooms' merged 90 000-triangle meshes.)
   */
  seeing(renderer,width=600){
   if(!renderer)return this.seen.bind(this);
   const height=Math.max(1,Math.round(width/(camera.aspect||4/3))),mask=camera.layers.mask,background=scene.background,auto=renderer.shadowMap.autoUpdate,colour=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha(),before=renderer.getRenderTarget();
   const materials=blockers.map(m=>m.material);
   try{
    depthTarget??=new THREE.WebGLRenderTarget(width,height);if(depthTarget.width!==width||depthTarget.height!==height)depthTarget.setSize(width,height);
    if(depthPixels?.length!==width*height*4)depthPixels=new Uint8Array(width*height*4);
    for(const m of blockers)m.material=Array.isArray(m.material)?m.material.map(x=>depthFor(x.side)):depthFor(m.material.side);
    camera.layers.set(BLOCKERS);scene.background=null;renderer.shadowMap.autoUpdate=false;camera.updateMatrixWorld(true);
    renderer.setRenderTarget(depthTarget);renderer.setClearColor(0xffffff,1);renderer.clear();renderer.render(scene,camera);renderer.readRenderTargetPixels(depthTarget,0,0,width,height,depthPixels);
   }catch(e){console.warn('Johansson Studio: depth picture',e);return this.seen.bind(this);}
   finally{blockers.forEach((m,i)=>{m.material=materials[i];});camera.layers.mask=mask;scene.background=background;renderer.shadowMap.autoUpdate=auto;renderer.setRenderTarget(before);renderer.setClearColor(colour,alpha);}
   const pixels=depthPixels.slice(),near=camera.near,far=camera.far,view=camera.matrixWorldInverse.clone(),projection=camera.projectionMatrix.clone(),v=new THREE.Vector3();
   // three.js r170 packDepthToRGBA / unpackRGBAToDepth, then perspectiveDepthToViewZ: the distance along the view axis.
   const distanceAt=k=>{const d=pixels[k]/255*(255/256)+pixels[k+1]/255*(255/256/256)+pixels[k+2]/255*(255/256/65536)+pixels[k+3]/255/16777216;return d>=.9999999?Infinity:-(near*far)/((far-near)*d-far);};
   return (x,y,z)=>{v.set(x,y,z).applyMatrix4(view);const distance=-v.z;v.applyMatrix4(projection);
    if(!(distance>near))return false;if(v.x<-1||v.x>1||v.y<-1||v.y>1)return this.seen(x,y,z);   // off the picture: ask a ray
    const i=Math.min(width-1,Math.floor((v.x+1)/2*width)),j=Math.min(height-1,Math.floor((v.y+1)/2*height));
    return distanceAt((j*width+i)*4)>=distance-.05;};
  },
  /**
   * What can catch `actor` during a drag (scene-snap.mjs resolveSnap): the free seats within 12 m that are on the picture,
   * the places in front of and beside each standing character, and the counter faces. Each has a gate (ok) that is asked
   * only when it would win, and remembers its answer: the camera must see the seat (0.75·size above its top) or the head
   * (1.45·size above the floor), and a place must be free. Each is on the picture by its feet or its head (8 px in).
   * `project(point, clip)` gives CSS px on the picture or null;
   * `seen(x,y,z)` (default: a ray) and `seated(pose)` come from the page.
   * → {targets, free(x,z), view(x,z) (also as seen): the camera sees them standing at (x,z), head or feet on the picture}
   */
  snapTargets(actor,actors,{project,seen=this.seen.bind(this),seated=()=>false}){
   const size=actor.size,free=this.free(actor,actors),others=actors.filter(a=>a.id!==actor.id),taken=new Set(others.map(o=>o.seat).filter(Boolean)),targets=[];
   const memo=f=>{const known=new Map();return (x,z)=>{const k=x.toFixed(3)+','+z.toFixed(3);if(!known.has(k))known.set(k,f(x,z));return known.get(k);};};
   // On the picture: the feet or the head (a close shot cuts off the feet of anyone near the camera).
   const shown=(x,y,z,lift)=>!!project([x,y,z])||!!project([x,y+lift,z]);
   const view=memo((x,z)=>{const y=floor(x,z);return Number.isFinite(y)&&shown(x,y,z,SNAP.seenHead*size)&&seen(x,y+SNAP.seenHead*size,z);});
   const standing=memo((x,z)=>free(x,z)&&view(x,z));
   for(const s of seats){
    const [x,y,z]=s.position,top=Number.isFinite(s.surfaceY)?s.surfaceY:y;
    if(Math.hypot(x-origin[0],z-origin[2])>SNAP.reach||taken.has(s.id)||!shown(x,y,z,top-y+SNAP.seenSeat*size)||!free.people(x,z))continue;let sees;
    targets.push({id:s.id,kind:'seat',rank:SNAP.rank.seat,point:[x,y,z],turn:s.turn,seat:s,label:s.label,ok:()=>sees??=seen(x,top+SNAP.seenSeat*size,z)});
   }
   // Nothing between two people who talk or stand side by side (no shelf or counter between them): every 5 cm.
   const clear=(p,m)=>{const n=Math.ceil(Math.hypot(m.x-p.x,m.z-p.z)/.05);for(let i=1;i<n;i++){const x=p.x+(m.x-p.x)*i/n,z=p.z+(m.z-p.z)*i/n;if(blocked(x,z,.02))return false;}return true;};
   for(const other of others){
    if(other.seat||seated(other.pose))continue;const q=this.place(other);if(!shown(q.x,q.y,q.z,SNAP.seenHead*other.size))continue;let sees;
    for(const m of personMarks({x:q.x,z:q.z,turn:other.turn,size:other.size},size)){
     const y=floor(m.x,m.z);if(!Number.isFinite(y)||!shown(m.x,y,m.z,SNAP.seenHead*size)||!free(m.x,m.z)||!clear(q,m))continue;
     targets.push({id:'person:'+other.id+':'+m.mark,kind:'person',rank:SNAP.rank.person,point:[m.x,y,m.z],turn:m.turn,other,mark:m.mark,ok:()=>(sees??=seen(q.x,q.y+SNAP.seenHead*other.size,q.z))&&view(m.x,m.z)});
    }
   }
   for(const edge of edges){const line=edgeLine(edge,size);if(line)targets.push({id:edge.id,kind:'edge',rank:SNAP.rank.edge,line,turn:edge.turn,edge,ok:standing});}
   return {targets,free,view,seen:view};   // seen: as resolveSnap() names it
  },
  /** Put a character down at (x,z) in town metres, on a seat (its key) or standing. No walking. */
  put(actor,{x,z,seat}){actor.x=x-origin[0];actor.z=z-origin[2];actor.seat=typeof seat==='string'?seat:'';},
  settle(actors){if(id==='classroom')return;const occupied=[];for(const a of actors){let p=this.place(a);if(!a.seat&&(blocked(p.x,p.z,.23*a.size)||occupied.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<.23*(q.size+a.size)))){const choices=[...candidates];for(let dx=-2;dx<=2;dx+=.6)for(let dz=-2;dz<=2;dz+=.6)choices.push([origin[0]+dx,0,origin[2]+dz]);const free=choices.find(q=>!blocked(q[0],q[2],.23*a.size)&&!occupied.some(o=>Math.hypot(o.x-q[0],o.z-q[2])<.23*(o.size+a.size)));if(free){a.x=free[0]-origin[0];a.z=free[2]-origin[2];p=this.place(a);}}occupied.push({...p,size:a.size});}},
  place(actor){if(id==='classroom'&&!actor.seat)return {x:origin[0]+actor.x,y:actor.y||0,z:origin[2]+actor.z};if(actor.seat){const s=matchSeat(actor.seat,seats);if(s){actor.seat=s.id;return {x:s.position[0],y:s.position[1],z:s.position[2],seat:s};}actor.seat='';}
   let x=origin[0]+actor.x,z=origin[2]+actor.z;
   if(blocked(x,z,.23*actor.size)){const p=candidates.find(p=>!blocked(p[0],p[2],.23*actor.size));if(p){x=p[0];z=p[2];actor.x=x-origin[0];actor.z=z-origin[2];}}
   return {x,y:floor(x,z),z};},
  /** Walk `actor` towards (x,z) for the sliders and arrow keys, sliding along whatever stops them; true when they got there. */
  move(actor,x,z,actors){if(actor.seat){const seat=matchSeat(actor.seat,seats);if(seat?.stand){actor.x=seat.stand[0]-origin[0];actor.z=seat.stand[2]-origin[2];}actor.seat='';actor.pose='Idle';}
   const p=this.place(actor),r=SNAP.body*actor.size,others=actors.filter(a=>a.id!==actor.id).map(a=>({...this.place(a),size:a.size}));
   const result=slideTo({x:p.x,z:p.z},{x,z},(x,z)=>!within(x,z)||Math.abs(floor(x,z)-p.y)>.4||blocked(x,z,r)||others.some(o=>Math.hypot(x-o.x,z-o.z)<r+SNAP.body*o.size));
   actor.seat='';actor.x=result.x-origin[0];actor.z=result.z-origin[2];return Math.hypot(result.x-x,result.z-z)<.1;},
  dispose(){depthTarget?.dispose();for(const m of depthMaterials.values())m.dispose();api?.workshop?.dispose?.();api?.dispose?.();api?.television?.dispose?.();api?.tv?.dispose?.();}
 };
}
