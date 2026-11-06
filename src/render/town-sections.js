import * as THREE from '../../vendor/three.module.js';
import {createSectionInstances} from './section-instances.js';
import {createWindowBatch} from './shop-street-batches.js';
import {BUS_STATION} from '../world/bus-station.js';
import {FOREST_EDGE} from '../world/forest-edge.js';

export function districtAt(x,z){
  if((z>=FOREST_EDGE.wallZ))return 'Forest Edge';
  if((z>=BUS_STATION.minZ))return 'Bus Station';
  if(z < -36)return 'Port';
  
  if(x > 7 && z < -16)return 'Park';
  return 'Shopping';
}
const CELL=24;
function near(bounds,x,z,reach){
  return bounds.max.x>=x-reach&&bounds.min.x<=x+reach&&bounds.max.z>=z-reach&&bounds.min.z<=z+reach;
}

// Geometry stays batched in 24 m cells, but the viewing window follows the player
// continuously. Look ahead and retain the margin when crossing a cell boundary.
// Collisions, schedules and interaction anchors remain in the shared town.
export function createTownSections({mobile=false}={}){
  let cached=null,entries=[];
  const batchCache=new WeakMap(),instanceCache=new WeakMap();
  const stats={district:'Shopping',sections:[],total:0,visible:0,culled:0,batchTriangles:0,submittedBatchTriangles:0};
  function cache(town){
    town.updateWorldMatrix(true,true);entries=[];
    town.traverse(object=>{
      if(!object.isMesh&&!object.isLine&&!object.isPoints)return;
      if(object.userData.renderBatch)return;
      // Scenery on the horizon -- the airport island -- is drawn from anywhere in town: it is
      // far from every section by design, and the far plane is what limits it.
      for(let p=object;p&&p!==town;p=p.parent)if(p.userData.horizon)return;
      let actor=null;
      for(let p=object;p&&p!==town;p=p.parent)if(p.userData.name||p.userData.character||p.userData.dynamicProp)actor=p;
      if(object.isSkinnedMesh&&!actor)actor=object;
      let bounds=new THREE.Box3();
      if(!actor){
        if(object.isInstancedMesh){if(!object.boundingBox)object.computeBoundingBox();bounds.copy(object.boundingBox);}
        else{if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();bounds.copy(object.geometry.boundingBox);}
        bounds.applyMatrix4(object.matrixWorld);
        // Split town-wide merged geometry into cells, sharing vertex buffers.
        if(!batchCache.has(object)){
          const size=bounds.getSize(new THREE.Vector3());
          batchCache.set(object,Math.max(size.x,size.z)>CELL?createWindowBatch(object,{cellSize:CELL}):null);
        }
      }
      if(!actor&&object.isInstancedMesh&&!instanceCache.has(object))instanceCache.set(object,createSectionInstances(object));
      entries.push({object,bounds,actor,batch:batchCache.get(object),instances:instanceCache.get(object)});
    });
    cached=town;stats.total=entries.length;
  }
  return {stats,invalidate(){cached=null;entries=[];},render({renderer,scene,camera,town,position}){
    if(cached!==town)cache(town);
    const direction=camera.getWorldDirection(new THREE.Vector3());
    const x=position.x,z=position.z,reach=mobile?36:54;
    const ax=x+direction.x*16,az=z+direction.z*16;
    const hidden=[],swapped=[],instanceSwaps=[],sections=new Set(),point=new THREE.Vector3();
    stats.district=districtAt(position.x,position.z);stats.visible=0;stats.batchTriangles=0;stats.submittedBatchTriangles=0;
    try{
      for(const entry of entries){
        const {object,bounds,actor,batch,instances}=entry;
        if(!object.visible)continue;
        if(actor){actor.getWorldPosition(point);bounds.min.copy(point).addScalar(-4);bounds.max.copy(point).addScalar(4);}
        const margin=entry.wasNear?6:0;
        const inView=box=>near(box,x,z,reach+margin)||near(box,ax,az,reach);
        let visible=inView(bounds);entry.wasNear=visible;
        if(batch){stats.batchTriangles+=batch.totalTriangles;if(visible){visible=batch.select(inView);if(visible){swapped.push([object,object.geometry]);object.geometry=batch.geometry;stats.submittedBatchTriangles+=batch.triangles;}}}
        if(visible&&instances){const selected=instances.select(inView);visible=selected.count>0;if(visible){instanceSwaps.push([object,object.instanceMatrix,object.instanceColor,object.count]);object.instanceMatrix=selected.matrix;object.instanceColor=selected.color;object.count=selected.count;}}
        if(!visible){hidden.push(object);object.visible=false;}
        else{stats.visible++;const centre=bounds.getCenter(point);sections.add(districtAt(centre.x,centre.z));}
      }
      stats.culled=stats.total-stats.visible;stats.sections=[...sections];
      renderer.render(scene,camera);
    }finally{
      for(const [object,matrix,color,count] of instanceSwaps){object.instanceMatrix=matrix;object.instanceColor=color;object.count=count;}
      for(const [object,geometry] of swapped)object.geometry=geometry;
      for(const object of hidden)object.visible=true;
    }
  }};
}
