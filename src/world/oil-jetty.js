import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {assetURL} from '../assets.js';
import {registerDetail} from './detail-stream.js';
import {createKit} from './okinawa/kit.js';
import {SEA_LEVEL} from './ocean.js';
import {buildGround} from './ground-build.js';
import {cargoAccessPlan} from './ground-plan-harbour.js';
import {CARGO_BERTH,OIL_JETTY,TANKER_CALL,oilJettyAt,oilJettyHeight} from './oil-jetty-layout.js';
export {OIL_JETTY,TANKER_CALL,oilJettyAt};

let source=null,pending=null;
export function preloadCargoBerth(){
 if(source)return Promise.resolve(source);
 if(pending)return pending;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 pending=fetch(assetURL('models/harbour/cargo-berth.glb?cad-berth-a1'),{signal:controller.signal}).then(response=>{
  if(!response.ok)throw Error('Cargo berth HTTP '+response.status);
  return response.arrayBuffer();
 }).then(data=>new GLTFLoader().parseAsync(data,'')).then(gltf=>{
  for(const name of ['vessel','quay','connections'])if(!gltf.scene.getObjectByName(name))throw Error('Missing CAD berth group '+name);
  source=gltf.scene;return source;
 }).finally(()=>{clearTimeout(timer);pending=null;});
 return pending;
}

/** Preserve the port's existing call calendar, with separate moored/underway states. */
export function cargoBerthVisit(minutes){
 const day=Math.floor(minutes/1440),m=((minutes%1440)+1440)%1440,C=TANKER_CALL;
 if(day%C.every!==0||m<C.arrive-C.passage||m>C.leave+C.passage)return {visible:false,moored:false,phase:'at sea',progress:0};
 const phase=m<C.arrive?'arriving':m>C.leave?'departing':'alongside';
 const progress=phase==='arriving'?(m-C.arrive+C.passage)/C.passage:phase==='departing'?(m-C.leave)/C.passage:1;
 return {visible:true,moored:phase==='alongside',phase,progress};
}

/** Original 72 m CAD ship / 100 m quay at 1:1 scale; the ferry terminal is separate. */
export function buildOilJetty(world,{register,onAction,shadows=false}={}){
 const group=new THREE.Group();group.name='Eastern CAD cargo berth';world.group.add(group);
 const ship=new THREE.Group();ship.name='Coastal cargo ship';ship.userData.dynamicProp=true;ship.userData.walkSurface=false;ship.visible=false;group.add(ship);
 const connections=new THREE.Group();connections.name='Cargo mooring lines and gangway';connections.userData.dynamicProp=true;connections.userData.walkSurface=false;connections.visible=false;connections.position.set(CARGO_BERTH.x,CARGO_BERTH.y,CARGO_BERTH.z);connections.rotation.y=CARGO_BERTH.yaw;group.add(connections);
 const quay=new THREE.Group();quay.name='CAD piled cargo quay';quay.position.copy(connections.position);quay.rotation.y=CARGO_BERTH.yaw;group.add(quay);
 const J=OIL_JETTY,D=J.deck,A=J.access,T=J.depot,kit=createKit({shadows});
 // An exact-height walking slab remains until the CAD detail has decoded.
 const fallback=new THREE.Mesh(new THREE.BoxGeometry(D.maxX-D.minX,1.2,D.maxZ-D.minZ),new THREE.MeshStandardMaterial({color:0xaaa99e,roughness:.9}));
 fallback.name='Cargo quay loading surface';fallback.position.set((D.minX+D.maxX)/2,D.y-.6,(D.minZ+D.maxZ)/2);fallback.receiveShadow=true;group.add(fallback);
 const slope=(D.y-A.fromY)/(A.rampEndX-A.minX);
 buildGround(group,[cargoAccessPlan()],{shadows,name:'Cargo quay shore approach'});
 // Guard the side facing the higher slab until the ramp reaches its landing.
 for(const z of [A.minZ,A.maxZ]){
  const end=z===A.minZ?A.rampEndX-1:A.maxX;
  for(let x=A.minX+.3;x<end;x+=1.5){const y=oilJettyHeight(x,(A.minZ+A.maxZ)/2);kit.rod([x,y,z],[x,y+1.05,z],.035,0xe2e4df);}
  const endY=A.fromY+Math.min(end-A.minX,A.rampEndX-A.minX)*slope;
  kit.rod([A.minX,A.fromY+1.05,z],[Math.min(end,A.rampEndX),endY+1.05,z],.035,0xe2e4df);
  if(end>A.rampEndX)kit.rod([A.rampEndX,D.y+1.05,z],[end,D.y+1.05,z],.035,0xe2e4df);
  world.colliders.push({id:'cargo-ramp-rail',x:(A.minX+end)/2,z,w:end-A.minX,d:.08,minY:A.fromY,height:D.y+1.1});
 }
 for(const x of [A.minX+1,A.rampEndX-1])for(const z of [A.minZ+.25,A.maxZ-.25]){
  const y=oilJettyHeight(x,z);kit.cyl(.18,.18,y-SEA_LEVEL+1,x,(y+SEA_LEVEL-1)/2,z,0x8f9b9d,{segments:8});
 }
 // The existing fuel depot stays ashore, independent of the general cargo berth.
 kit.cyl(T.r,T.r,T.h,T.x,T.h/2,T.z,0xeeece4,{segments:20});kit.cyl(T.r+.05,T.r-.3,.4,T.x,T.h+.2,T.z,0xd8d4c8,{segments:20});
 kit.box(.06,T.h,.4,T.x+T.r+.05,T.h/2,T.z,0x8e979a);
 for(const [x0,x1,z0,z1] of [[T.x-2.6,T.x+2.6,T.z-2.6,T.z-2.45],[T.x-2.6,T.x+2.6,T.z+2.45,T.z+2.6],[T.x-2.6,T.x-2.45,T.z-2.6,T.z+2.6],[T.x+2.45,T.x+2.6,T.z-2.6,T.z+2.6]])kit.block(x0,x1,0,.6,z0,z1,0xc8c2b5);
 kit.box(1.2,.5,.03,T.x,1.6,T.z+T.r+.02,0xc8102e);kit.finish(group,'Cargo berth shore approach');
 world.colliders.push({id:'fuel-depot',x:T.x,z:T.z,w:5.2,d:5.2,height:3.4});
 for(const x of [-44,-33,-22,-11,0,11,22,33,44])world.colliders.push({id:'cargo-quay-bollard',x:CARGO_BERTH.x+9.3,z:CARGO_BERTH.z-x,w:.8,d:1.05,minY:D.y,height:2.5});
 for(const x of [-47,47])world.colliders.push({id:'cargo-quay-light',x:CARGO_BERTH.x+11.9,z:CARGO_BERTH.z-x,w:.3,d:.3,minY:D.y,height:10});
 const anchor=(x,z,label,fn)=>{const o=new THREE.Object3D();o.position.set(x,oilJettyHeight(x,z)??0,z);o.position.y+=1.2;o.name=label;group.add(o);register?.(o,label,fn);};
 let visit=cargoBerthVisit(0),loaded=false,mountPending=null;
 anchor(T.x+2.8,T.z+2.8,'Read the depot board',()=>onAction?.('read','Minato fuel depot','Hazardous materials · No open flames. The shore tank stores diesel for the town power house. Keep the access and the bund clear.'));
 anchor(53,-60.5,'Look at the cargo berth',()=>onAction?.('inspect','Eastern cargo berth',visit.moored?'The coastal cargo ship is alongside. Two covered holds lie forward of the bridge; mooring lines lead to the quay bollards, rubber fenders protect the hull, and the gangway connects the side deck to the berth.':'A piled concrete quay with rubber fenders, bollards and access ladders. Cargo calls every third day, alongside 08:00–15:00.'));
 async function load(){
  if(loaded)return true;
  if(mountPending)return mountPending;
  mountPending=(async()=>{
  const model=await preloadCargoBerth();
  for(const [name,parent] of [['vessel',ship],['quay',quay],['connections',connections]]){
   const part=model.getObjectByName(name).clone(true);
   part.traverse(o=>{if(o.isMesh){o.castShadow=shadows;o.receiveShadow=true;}});parent.add(part);
  }
  fallback.removeFromParent();fallback.geometry.dispose();fallback.material.dispose();loaded=true;group.userData.cadLoaded=true;
  return true;
  })().finally(()=>{mountPending=null;});
  return mountPending;
 }
 registerDetail(world,{id:'cargo-berth-cad',x:53,z:-55,radius:90,priority:0,load});
 const start=new THREE.Vector3(42.5,SEA_LEVEL,-200),berth=new THREE.Vector3(CARGO_BERTH.x,CARGO_BERTH.y,CARGO_BERTH.z),end=new THREE.Vector3(42.5,SEA_LEVEL,-220);
 return {group,tanker:ship,ship,quay,connections,load,get loaded(){return loaded;},snapshot:()=>({...visit,loaded,position:ship.position.toArray()}),update(dt,minutes,time=0){
  visit=cargoBerthVisit(minutes);ship.visible=visit.visible;connections.visible=visit.moored;
  if(!visit.visible)return;
  const u=visit.progress*visit.progress*(3-2*visit.progress);
  if(visit.phase==='arriving')ship.position.lerpVectors(start,berth,u);
  else if(visit.phase==='departing')ship.position.lerpVectors(berth,end,u);
  else ship.position.copy(berth);
  // Back slowly onto the berth, then depart bow-first down the clear sea lane.
  ship.rotation.set(0,CARGO_BERTH.yaw,0);
  if(!visit.moored){ship.position.y+=.025*Math.sin(time*.8);ship.rotation.z=Math.sin(time*.45)*.002;}
 }};
}
