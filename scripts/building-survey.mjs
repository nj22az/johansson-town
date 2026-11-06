import * as T from '../vendor/three.module.js';

const round=n=>+n.toFixed(3);
/** Measure the complete movement domain, never the first floor hit at the spawn.
 * A floor polygon can narrow that domain (shared dining). Geometry floor coverage is
 * separate from domain area: baths, steps and furniture are not walkable floor area.
 */
export function surveyInterior(room,layout,{step=.2}={}){
 const b=layout?.bounds;
 if(!b||![b.minX,b.maxX,b.minZ,b.maxZ].every(Number.isFinite)||b.maxX<=b.minX||b.maxZ<=b.minZ)throw Error('Survey requires explicit runtime movement bounds');
 room.updateMatrixWorld(true);
 const floors=[],walls=[],features=new Set();
 room.traverse(o=>{
  if(o.name)features.add(o.name);
  if(!o.isMesh||!o.geometry?.attributes.position)return;
  const box=new T.Box3().setFromObject(o);
  // Floor surfaces at the movement datum. Exclude lowered pool bottoms, water,
  // bath rims, ceiling, signs, backdrop and elevated tatami/furniture tops.
  if(/floor|paving|tiles?/i.test(o.name)&&box.min.y>=-.15&&box.max.y<=.08)floors.push(o);
  if(/wall|partition/i.test(o.name)&&box.min.y<.1&&box.max.y>1.95)walls.push({name:o.name,minX:box.min.x,maxX:box.max.x,minZ:box.min.z,maxZ:box.max.z});
 });
 const polygon=layout.floorPolygon||[[b.minX,b.minZ],[b.maxX,b.minZ],[b.maxX,b.maxZ],[b.minX,b.maxZ]];
 let twice=0;for(let i=0;i<polygon.length;i++){const a=polygon[i],c=polygon[(i+1)%polygon.length];twice+=a[0]*c[1]-c[0]*a[1];}
 const inside=(x,z)=>{let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],c=polygon[j];if((a[1]>z)!==(c[1]>z)&&x<(c[0]-a[0])*(z-a[1])/(c[1]-a[1])+a[0])yes=!yes;}return yes;};
 const nx=Math.ceil((b.maxX-b.minX)/step),nz=Math.ceil((b.maxZ-b.minZ)/step),dx=(b.maxX-b.minX)/nx,dz=(b.maxZ-b.minZ)/nz;
 const ray=new T.Raycaster(),runs=[];let cells=0;
 for(let j=0;j<nz;j++){
  let start=null;
  for(let i=0;i<=nx;i++){
   const x=b.minX+(i+.5)*dx,z=b.minZ+(j+.5)*dz;
   let hit=false;
   if(i<nx&&inside(x,z)){ray.set(new T.Vector3(x,.15,z),new T.Vector3(0,-1,0));ray.far=.3;hit=ray.intersectObjects(floors,false).length>0;}
   if(hit){cells++;start??=i;}
   else if(start!==null){runs.push({minX:b.minX+start*dx,maxX:b.minX+i*dx,minZ:b.minZ+j*dz,maxZ:b.minZ+(j+1)*dz});start=null;}
  }
 }
 return {bounds:{...b},w:round(b.maxX-b.minX),h:round(b.maxZ-b.minZ),domainArea:round(Math.abs(twice)/2),floorArea:floors.length?round(cells*dx*dz):null,floorSampleStep:step,
  floorMeshes:floors.map(o=>o.name),floorRuns:runs,walls,polygon,features:[...features].sort(),colliders:layout.colliders||[]};
}

export function khaakaPlan(title,survey,labels=[]){
 const objects=[],b=survey.bounds,point=([x,z])=>({x:round(x-b.minX),y:round(z-b.minZ)});
 const add=o=>objects.push({id:objects.length+1,label:'',strokeWidth:1,...o});
 const poly=(points,fill,label='')=>add({type:'polygon',closed:true,points:points.map(point),fill,stroke:fill,label});
 poly(survey.polygon,'#f1eee5','Movement domain (not net walkable area)');
 for(const r of survey.floorRuns)poly([[r.minX,r.minZ],[r.maxX,r.minZ],[r.maxX,r.maxZ],[r.minX,r.maxZ]],'#d9e7d5');
 for(const r of survey.walls){const x0=Math.max(r.minX,b.minX),x1=Math.min(r.maxX,b.maxX),z0=Math.max(r.minZ,b.minZ),z1=Math.min(r.maxZ,b.maxZ);if(x1>x0&&z1>z0)poly([[x0,z0],[x1,z0],[x1,z1],[x0,z1]],'#554940',r.name);}
 for(const c of survey.colliders){const x0=Math.max(c.x-c.w/2,b.minX),x1=Math.min(c.x+c.w/2,b.maxX),z0=Math.max(c.z-c.d/2,b.minZ),z1=Math.min(c.z+c.d/2,b.maxZ);if(x1>x0&&z1>z0)poly([[x0,z0],[x1,z0],[x1,z1],[x0,z1]],'#ad9c85',c.id||'Solid fitting');}
 for(const [text,x,z] of labels)add({type:'text',...point([x,z]),text,size:13,fill:'#1c2433',stroke:'#1c2433'});
 add({type:'text',x:0,y:-.7,text:`${title} · movement domain ${survey.w} × ${survey.h} m · ${survey.domainArea} m²`,size:16,fill:'#1c2433',stroke:'#1c2433'});
 return {version:1,pxPerMeter:40,pxPerBox:36.4,grid:{show:true,snap:true,size:.91},showDims:false,units:'m',defaultWallThickness:.12,projectName:'Johansson Town · '+title,view:{x:60,y:80,zoom:1},objects,nextId:objects.length+1};
}
