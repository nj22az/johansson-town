import * as THREE from '../../vendor/three.module.js';
import {createWindowBatch} from './shop-street-batches.js';

// The room owns the visible indoor frame. Clip beyond the exterior pane and its
// shallow wooden sashes, rather than exactly on the pane: a coplanar clipping
// plane produces fragment speckles on the glazing and reveals duplicate frames.
export const SHOP_STREET_PORTAL_CLEARANCE=.13;

// The room uses its own coordinates. Map its front glazing onto the real shop
// frontage and render the street first; opaque room surfaces mask that view.
export function mapShopCamera(source,target,frontage){
 const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),(frontage.yaw-(frontage.interiorYaw||0)));
 target.copy(source);target.position.copy(source.position).sub(new THREE.Vector3(...(frontage.interiorOrigin||[0,0,frontage.interiorZ??6.3]))).applyQuaternion(rotation).add(new THREE.Vector3(...frontage.position));
 target.quaternion.copy(rotation).multiply(source.quaternion);target.updateMatrixWorld(true);
 const outward=new THREE.Vector3(Math.sin(frontage.yaw),0,Math.cos(frontage.yaw));
 return new THREE.Plane().setFromNormalAndCoplanarPoint(outward,new THREE.Vector3(...frontage.position));
}

// Side planes through the actual opening exclude geometry that the full camera
// frustum would otherwise draw behind opaque interior walls.
export function shopWindowPlanes(camera,frontage){
 const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),frontage.yaw),origin=new THREE.Vector3(...frontage.position);
 const S=frontage.span||SAKURA_SPAN;
 const corners=[[S.minX,S.minY,0],[S.maxX,S.minY,0],[S.maxX,S.maxY,0],[S.minX,S.maxY,0]].map(p=>new THREE.Vector3(...p).applyQuaternion(rotation).add(origin));
 const centre=origin.clone().add(new THREE.Vector3(0,1.5,1).applyQuaternion(rotation));
 return corners.map((p,i)=>{const plane=new THREE.Plane().setFromCoplanarPoints(camera.position,p,corners[(i+1)%4]);if(plane.distanceToPoint(centre)<0)plane.negate();return plane;});
}
/** Sakura's glazing, in its room's frame; other frontages give their own `span`. */
const SAKURA_SPAN=Object.freeze({minX:-6.65,maxX:6.65,minY:.05,maxY:3.1});
export function boxThroughWindow(bounds,planes,frustum){
 return frustum.intersectsBox(bounds)&&planes.every(plane=>{
  const n=plane.normal;
  return plane.distanceToPoint(new THREE.Vector3(n.x>=0?bounds.max.x:bounds.min.x,n.y>=0?bounds.max.y:bounds.min.y,n.z>=0?bounds.max.z:bounds.min.z))>=0;
 });
}
export function createShopStreetView(){
 const exteriorCamera=new THREE.PerspectiveCamera(),frustum=new THREE.Frustum(),matrix=new THREE.Matrix4();
 const glazing=new THREE.Box3(new THREE.Vector3(-6.65,.05,6.25),new THREE.Vector3(6.65,3.1,6.35));
 let cachedTown=null,entries=[];const batches=new Map();
 const stats={total:0,visible:0,culled:0,passes:0,batchTriangles:0,submittedBatchTriangles:0,cacheBytes:0};
 function dispose(){for(const batch of batches.values())batch?.dispose();batches.clear();cachedTown=null;entries=[];stats.cacheBytes=0;}
 function cache(town){
  town.updateWorldMatrix(true,true);entries=[];
  town.traverse(o=>{
   if(!o.isMesh&&!o.isLine&&!o.isPoints)return;
   // Preserve complete instances; their spatial batches already have bounds.
   if(o.isInstancedMesh){if(!o.boundingBox)o.computeBoundingBox();}
   else if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
   const bounds=(o.isInstancedMesh?o.boundingBox:o.geometry.boundingBox).clone().applyMatrix4(o.matrixWorld);
   let dynamic=o.isSkinnedMesh;for(let p=o;p&&p!==town;p=p.parent)if(p.userData.name||p.userData.character||p.userData.dynamicProp)dynamic=true;
   entries.push({object:o,bounds,dynamic});
  });cachedTown=town;stats.total=entries.length;
 }
 // A frontage is one opening; a room with openings on two walls (Sakura's upstairs office: Main Street and the
 // harbour) passes {portals:[…]}. Every portal in view gets its own pass, clipped to its own opening, so two windows
 // at a corner both show the town at once. One portal at a time left the other window drawing whatever the first
 // pass's clipping left there: bare sky, and the sea cut into teeth by the wrong window's planes.
 const glazingOf=(frontage,box)=>{
  const frontZ=frontage.interiorZ??6.3,S=frontage.span||SAKURA_SPAN;box.min.set(S.minX,S.minY,frontZ-.05);box.max.set(S.maxX,S.maxY,frontZ+.05);
  if(frontage.interiorOrigin){const centre=new THREE.Vector3(...frontage.interiorOrigin),half=new THREE.Vector3((S.maxX-S.minX)/2,(S.maxY-S.minY)/2,.05);if(frontage.interiorYaw)half.set(.05,half.y,(S.maxX-S.minX)/2);centre.y+=(S.minY+S.maxY)/2;box.set(centre.clone().sub(half),centre.clone().add(half));}
  return box;
 };
 return {stats,dispose,invalidate(){dispose();},render({renderer,scene,camera,town,room,frontage}){
  camera.updateMatrixWorld(true);frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  const open=(frontage?.portals||(frontage?[frontage]:[])).filter(p=>frustum.intersectsBox(glazingOf(p,glazing)));
  if(!open.length){stats.visible=0;stats.culled=stats.total;stats.passes=0;renderer.render(scene,camera);return;}
  if(cachedTown!==town)cache(town);
  const hidden=[],swapped=[];
  stats.visible=0;stats.passes=0;stats.batchTriangles=0;stats.submittedBatchTriangles=0;
  const saved={background:scene.background,autoClear:renderer.autoClear,clipping:renderer.clippingPlanes,shadows:renderer.shadowMap?.enabled,matrixAuto:scene.matrixWorldAutoUpdate,children:scene.children.map(o=>[o,o.visible])};
  const restorePass=()=>{for(const [o,geometry] of swapped)o.geometry=geometry;swapped.length=0;for(const o of hidden)o.visible=true;hidden.length=0;};
  try{
   // Hide hands, interior guests and the room during the exterior pass. The
   // clipping plane removes the shop shell behind its actual front glazing.
   for(const o of scene.children)if(o!==town&&!o.isLight)o.visible=false;
   town.visible=true;
   // Cached static transforms and no second town shadow-map render. Geometry
   // and textures remain shared with the street; no additional GLBs are fetched.
   scene.matrixWorldAutoUpdate=false;if(renderer.shadowMap)renderer.shadowMap.enabled=false;
   const seen=new Set();
   for(const portal of open){
    const plane=mapShopCamera(camera,exteriorCamera,portal);
    plane.constant-=SHOP_STREET_PORTAL_CLEARANCE;
    frustum.setFromProjectionMatrix(matrix.multiplyMatrices(exteriorCamera.projectionMatrix,exteriorCamera.matrixWorldInverse));
    const planes=[plane,...shopWindowPlanes(exteriorCamera,portal)];
    for(const entry of entries){
     const o=entry.object;
     // The town itself is hidden while indoors; respect every descendant's
     // visibility and render layers, including the original unbatched scenery.
     let shown=o.layers.test(exteriorCamera.layers);
     for(let p=o;shown&&p&&p!==town;p=p.parent)if(!p.visible)shown=false;
     if(!shown)continue;
     // Seen from inside, a frontage's own outward glazing (painted warm, to read as a lit
     // room from the pavement) would stand between the room and the street.
     if(portal.hideGlazing&&o.userData.clearWindow){hidden.push(o);o.visible=false;continue;}
     if(entry.dynamic){o.updateWorldMatrix(true,false);entry.bounds.setFromObject(o);}
     let visible=boxThroughWindow(entry.bounds,planes,frustum);
     // Partition only geometry which can actually appear through this opening.
     // Preparing every hidden building at the first doorway spikes CPU memory.
     if(visible&&!entry.dynamic){
      if(!batches.has(o)){const batch=createWindowBatch(o);batches.set(o,batch);stats.cacheBytes+=batch?.bytes||0;}
      const batch=batches.get(o);
      if(batch){
       stats.batchTriangles+=batch.totalTriangles;
       visible=batch.select(bounds=>boxThroughWindow(bounds,planes,frustum));
       if(visible){swapped.push([o,o.geometry]);o.geometry=batch.geometry;stats.submittedBatchTriangles+=batch.triangles;}
      }
     }
     if(!visible){hidden.push(o);o.visible=false;}else seen.add(o);
    }
    // The first pass clears to the sky; later ones add their own opening over it, sharing its depth.
    renderer.clippingPlanes=planes;renderer.autoClear=stats.passes===0;if(stats.passes>0)scene.background=null;
    renderer.render(scene,exteriorCamera);stats.passes++;
    restorePass();
   }
   stats.visible=seen.size;stats.culled=stats.total-stats.visible;
   scene.matrixWorldAutoUpdate=saved.matrixAuto;if(renderer.shadowMap)renderer.shadowMap.enabled=saved.shadows;
   for(const [o,visible] of saved.children)o.visible=visible;
   town.visible=false;room.visible=true;renderer.clippingPlanes=saved.clipping;
   scene.background=null;renderer.autoClear=false;renderer.clearDepth();renderer.render(scene,camera);
  }finally{
   restorePass();
   scene.matrixWorldAutoUpdate=saved.matrixAuto;if(renderer.shadowMap)renderer.shadowMap.enabled=saved.shadows;
   scene.background=saved.background;renderer.autoClear=saved.autoClear;renderer.clippingPlanes=saved.clipping;
   for(const [o,visible] of saved.children)o.visible=visible;
  }
 }};
}
