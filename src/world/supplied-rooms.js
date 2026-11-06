import {buildOfficeWorkplace,buildOfficeShell,OFFICE_STAFF} from './interiors/office-workplace.js';
import * as THREE from '../../vendor/three.module.js';

/**
 * The one room still described by a layout table: the harbour office, built in code
 * (office-workplace.js). Geometry is in metres; the doorway and floor are at Y=0.
 * The other supplied rooms (the old ramen shop, Thuan and Thao's flat) belonged to the
 * retired town layouts.
 */
export const SUPPLIED_ROOM_LAYOUTS={
  office:{bounds:{minX:-3.37,maxX:3.37,minZ:-3.37,maxZ:3.37},spawn:[0,0,2.4],exit:[0,1.1,3.34],staff:OFFICE_STAFF,
    colliders:[
      {x:0,z:-2.78,w:6.27,d:1.23,height:1.72},
      {x:0,z:-2.0,w:.11,d:.45,height:1.7},
      {x:-3.08,z:-2.02,w:.12,d:.48,height:1.7},
      {x:3.08,z:-2.02,w:.12,d:.48,height:1.7},
      {x:-2.52,z:-2.02,w:.68,d:.68,height:1.28},
      {x:1.14,z:-2.22,w:.65,d:.72,height:.94},
      {x:2.91,z:-1.39,w:.43,d:.46,height:.46},
      {x:3.1,z:1.58,w:.6,d:2.72,height:1.87},
      {x:-2.98,z:.17,w:.7,d:2.28,height:2.05},
      {x:-1.85,z:3.05,w:.61,d:.62,height:1.62},
    ]},
};

export function suppliedRoomBoundsBlocked(layout,x,z,r=0){
  // A room with walls of its own shape (the dungeon's tile grid) answers for itself.
  if(layout.blocked)return layout.blocked(x,z,r);
  const b=layout.bounds;
  if(layout.floorPolygon){
    const inside=(px,pz)=>{let hit=false;const p=layout.floorPolygon;for(let i=0,j=p.length-1;i<p.length;j=i++){
      const [ax,az]=p[i],[bx,bz]=p[j];if((az>pz)!==(bz>pz)&&px<(bx-ax)*(pz-az)/(bz-az)+ax)hit=!hit;
    }return hit;};
    if(!inside(x,z))return true;
    for(let i=0;r>0&&i<16;i++)if(!inside(x+Math.cos(i*Math.PI/8)*r,z+Math.sin(i*Math.PI/8)*r))return true;
  }
  return x<b.minX+r||x>b.maxX-r||z<b.minZ+r||z>b.maxZ-r;
}

export function buildSuppliedRoom({site,room,reg,collider,action,exit}){
  const layout=SUPPLIED_ROOM_LAYOUTS[site.id];
  if(!layout)return null;
  buildOfficeShell(room);
  for(const c of layout.colliders)collider(c.x,c.z,c.w,c.d,c.height);
  const exitPoint=new THREE.Object3D();exitPoint.name='Exit to street';exitPoint.position.set(...layout.exit);room.add(exitPoint);
  reg(exitPoint,'Exit to street',exit,true);
  buildOfficeWorkplace({room,reg,action,collider});
  return layout;
}
